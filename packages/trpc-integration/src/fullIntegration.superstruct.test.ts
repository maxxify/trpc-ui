import { initTRPC } from "@trpc/server";
import * as s from "superstruct";
import { normalizeValidationErrors } from "trpc-parser";
import { describe, expect, test } from "vitest";
import { callProcedure } from "./fullIntegration.helper";

describe("Full tRPC integration tests with Superstruct validation errors", () => {
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

  const superstructSchema = s.object({
    age: s.number(),
    email: s.string(),
    name: s.string(),
  });

  const nestedSuperstructSchema = s.object({
    user: s.object({
      email: s.string(),
      profile: s.object({
        name: s.string(),
      }),
    }),
  });

  const testRouter = t.router({
    validateNested: t.procedure
      .input(nestedSuperstructSchema) // Placeholder - we validate manually
      .query(({ input }) => {
        return input;
      }),
    validateUser: t.procedure
      .input(superstructSchema) // Placeholder - we validate manually
      .mutation(({ input }) => {
        return input;
      }),
  });

  test("should return fieldErrors for invalid input types", async () => {
    const response = await callProcedure(testRouter, "validateUser", {
      email: 123,
      name: 456,
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
