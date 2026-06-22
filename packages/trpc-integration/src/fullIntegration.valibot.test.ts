import { initTRPC } from "@trpc/server";
import { normalizeValidationErrors } from "trpc-parser";
import * as v from "valibot";
import { describe, expect, test } from "vitest";
import { callProcedure } from "./fullIntegration.helper";

describe("Full tRPC integration tests with Valibot validation errors", () => {
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

  const valibotSchema = v.object({
    age: v.number("Must be a number"),
    email: v.string("Invalid email"),
    name: v.string("Name is required"),
  });

  const nestedValibotSchema = v.object({
    user: v.object({
      email: v.string(),
      profile: v.object({
        name: v.string(),
      }),
    }),
  });

  const testRouter = t.router({
    validateNested: t.procedure
      .input(nestedValibotSchema)
      .query(({ input }) => {
        return input;
      }),
    validateUser: t.procedure.input(valibotSchema).mutation(({ input }) => {
      return input;
    }),
  });

  test("should return fieldErrors for invalid input", async () => {
    const response = await callProcedure(testRouter, "validateUser", {
      email: 123,
      name: "",
    });

    expect(response.status).toBe(400);
    expect(response.error?.data?.fieldErrors).toBeDefined();
    expect(response.error?.data?.fieldErrors?.fieldErrors.email).toBeDefined();
  });

  test("should return fieldErrors for nested object validation", async () => {
    const response = await callProcedure(
      testRouter,
      "validateNested",
      {
        user: { email: 123, profile: { name: "" } },
      },
      "GET",
    );

    expect(response.status).toBe(400);
    expect(response.error?.data?.fieldErrors).toBeDefined();
    expect(
      response.error?.data?.fieldErrors?.fieldErrors["user.email"],
    ).toBeDefined();
  });
});
