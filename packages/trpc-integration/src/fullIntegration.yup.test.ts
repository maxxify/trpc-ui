import { initTRPC } from "@trpc/server";
import { normalizeValidationErrors } from "trpc-parser";
import { describe, expect, test } from "vitest";
import * as yup from "yup";
import { callProcedure } from "./fullIntegration.helper";

describe("Full tRPC integration tests with Yup validation errors", () => {
  const t = initTRPC.context().create({
    errorFormatter({ shape, error }) {
      const normalizedErrors = normalizeValidationErrors(error.cause);
      return {
        ...shape,
        data: {
          ...shape.data,
          fieldErrors: normalizedErrors,
        },
      };
    },
  });

  const yupSchema = yup.object({
    age: yup.number().min(18).required(),
    email: yup.string().email().required(),
    name: yup.string().required(),
  });

  const nestedYupSchema = yup.object({
    user: yup.object({
      email: yup.string().email().required(),
      profile: yup.object({
        name: yup.string().required(),
      }),
    }),
  });

  // Yup wrapper that validates with abortEarly: false
  const yupInput = <T extends yup.AnySchema>(schema: T) => {
    const validateFn = async (input: unknown): Promise<yup.InferType<T>> => {
      return await schema.validate(input, { abortEarly: false });
    };
    // Store the schema on the function for parser detection
    (validateFn as any).yupSchema = schema;
    return validateFn as (
      input: unknown,
    ) => Promise<yup.InferType<T>> & { yupSchema?: T };
  };

  const testRouter = t.router({
    validateNested: t.procedure
      .input(yupInput(nestedYupSchema))
      .query(({ input }) => {
        return input;
      }),
    validateUser: t.procedure
      .input(yupInput(yupSchema))
      .mutation(({ input }) => {
        return input;
      }),
  });

  test("should return fieldErrors for invalid email and missing name", async () => {
    const response = await callProcedure(testRouter, "validateUser", {
      age: 25,
      email: "invalid",
    });
    expect(response.status).toBe(400);
    expect(response.error?.data?.fieldErrors).toBeDefined();
    expect(response.error?.data?.fieldErrors?.fieldErrors.email).toBeDefined();
    expect(response.error?.data?.fieldErrors?.fieldErrors.name).toBeDefined();
  });

  test("should return fieldErrors for nested object validation", async () => {
    const response = await callProcedure(
      testRouter,
      "validateNested",
      {
        user: { email: "invalid", profile: { name: "" } },
      },
      "GET",
    );

    expect(response.status).toBe(400);
    expect(response.error?.data?.fieldErrors).toBeDefined();
    expect(
      response.error?.data?.fieldErrors?.fieldErrors["user.profile.name"],
    ).toBeDefined();
  });
});
