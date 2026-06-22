import { initTRPC } from "@trpc/server";
import { type } from "arktype";
import { normalizeValidationErrors } from "trpc-parser";
import { describe, expect, test } from "vitest";
import { callProcedure } from "./fullIntegration.helper";

describe("Full tRPC integration tests with Arktype validation errors", () => {
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

  const testRouter = t.router({
    validateNested: t.procedure
      .input(
        type({
          user: {
            email: "string.email",
            profile: {
              name: "string",
            },
          },
        }),
      )
      .query(({ input }) => input),
    validateUser: t.procedure
      .input(
        type({
          age: "number",
          email: "string.email",
          name: "string",
        }),
      )
      .mutation(({ input }) => input),
  });

  test("should return fieldErrors for invalid email type", async () => {
    const response = await callProcedure(testRouter, "validateUser", {
      age: 25,
      email: 123,
      name: "John",
    });

    expect(response.status).toBe(400);
    expect(response.error?.data?.fieldErrors).toBeDefined();
    expect(response.error?.data?.fieldErrors?.fieldErrors.email).toBeDefined();
  });

  test("should return fieldErrors for missing required fields", async () => {
    const response = await callProcedure(testRouter, "validateUser", {});

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
    expect(response.status).toBeOneOf([200, 400]);
    expect(response.error?.data?.fieldErrors).toBeDefined();
    expect(
      response.error?.data?.fieldErrors?.fieldErrors["user.email"],
    ).toBeDefined();
  });
});
