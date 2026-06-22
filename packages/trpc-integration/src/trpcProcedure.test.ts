import { TRPCError } from "@trpc/server";
import { type } from "arktype";
import * as s from "superstruct";
import { normalizeValidationErrors } from "trpc-parser";
import * as v from "valibot";
import { describe, expect, test } from "vitest";
import * as yup from "yup";
import { z } from "zod/v3";

describe("normalizeValidationErrors with real tRPC procedures", () => {
  describe("Zod procedure", () => {
    test("should normalize Zod validation errors when passed through tRPC error formatter", () => {
      const inputSchema = z.object({
        email: z.string().email("Invalid email format"),
        name: z.string().min(1, "Name is required"),
      });

      // Simulate what tRPC does: validate input and throw error
      try {
        inputSchema.parse({ email: "invalid-email", name: "" });
      } catch (error) {
        const trpcError = new TRPCError({
          cause: error,
          code: "BAD_REQUEST",
          message: "Input validation failed",
        });

        // Simulate the error formatter
        const normalizedErrors = normalizeValidationErrors(trpcError.cause);
        expect(normalizedErrors).toBeDefined();
        expect(normalizedErrors?.fieldErrors.email).toEqual([
          "Invalid email format",
        ]);
        expect(normalizedErrors?.fieldErrors.name).toEqual([
          "Name is required",
        ]);
      }
    });

    test("should handle nested Zod object validation errors", () => {
      const inputSchema = z.object({
        user: z.object({
          email: z.string().email(),
          profile: z.object({
            name: z.string().min(1),
          }),
        }),
      });

      try {
        inputSchema.parse({
          user: { email: "invalid", profile: { name: "" } },
        });
      } catch (error) {
        const trpcError = new TRPCError({
          cause: error,
          code: "BAD_REQUEST",
          message: "Input validation failed",
        });

        const normalizedErrors = normalizeValidationErrors(trpcError.cause);
        expect(normalizedErrors).toBeDefined();
        expect(normalizedErrors?.fieldErrors["user.email"]).toBeDefined();
        expect(
          normalizedErrors?.fieldErrors["user.profile.name"],
        ).toBeDefined();
      }
    });
  });

  describe("Valibot procedure", () => {
    test("should normalize Valibot validation errors when passed through tRPC error formatter", () => {
      const inputSchema = v.object({
        email: v.string("Invalid email"),
        name: v.string("Name is required"),
      });

      const result = v.safeParse(inputSchema, { email: 123, name: "" });

      if (!result.success) {
        const trpcError = new TRPCError({
          cause: { issues: result.issues },
          code: "BAD_REQUEST",
          message: "Input validation failed",
        });

        const normalizedErrors = normalizeValidationErrors(trpcError.cause);
        expect(normalizedErrors).toBeDefined();
        expect(normalizedErrors?.fieldErrors.email).toBeDefined();
      }
    });
  });

  describe("Arktype procedure", () => {
    test("should normalize Arktype validation errors when passed through tRPC error formatter", () => {
      const inputSchema = type({
        email: "string.email",
        name: "string",
      });

      // Use a number to fail string validation (arktype is strict about types)
      // This matches the pattern in normalizeErrors.test.ts that works
      const arktypeResult = inputSchema({ email: 123, name: "" });

      // The arktype result is the error object itself (not thrown)
      // Check if it has problems (indicating validation failure)
      if (arktypeResult && "problems" in arktypeResult) {
        const trpcError = new TRPCError({
          cause: arktypeResult,
          code: "BAD_REQUEST",
          message: "Input validation failed",
        });

        const normalizedErrors = normalizeValidationErrors(trpcError.cause);
        expect(normalizedErrors).toBeDefined();
        expect(normalizedErrors?.fieldErrors.email).toBeDefined();
      }
    });
  });

  describe("Yup procedure", () => {
    test("should normalize Yup validation errors when passed through tRPC error formatter", () => {
      const inputSchema = yup.object({
        email: yup.string().email().required(),
        name: yup.string().required(),
      });

      try {
        inputSchema.validateSync({ email: "invalid", name: "" });
      } catch (error) {
        const trpcError = new TRPCError({
          cause: error,
          code: "BAD_REQUEST",
          message: "Input validation failed",
        });

        const normalizedErrors = normalizeValidationErrors(trpcError.cause);
        expect(normalizedErrors).toBeDefined();
        expect(normalizedErrors?.fieldErrors.name).toBeDefined();
      }
    });
  });

  describe("Superstruct procedure", () => {
    test("should normalize Superstruct validation errors when passed through tRPC error formatter", () => {
      const inputSchema = s.object({
        email: s.string(),
        name: s.string(),
      });

      const [error] = s.validate({ email: 123, name: "" }, inputSchema);

      if (error) {
        const trpcError = new TRPCError({
          cause: error,
          code: "BAD_REQUEST",
          message: "Input validation failed",
        });

        const normalizedErrors = normalizeValidationErrors(trpcError.cause);
        expect(normalizedErrors).toBeDefined();
        expect(normalizedErrors?.fieldErrors.email).toBeDefined();
      }
    });
  });

  describe("Error formatter integration", () => {
    test("error formatter should add fieldErrors to error shape", () => {
      const inputSchema = z.object({
        email: z.string().email(),
      });

      try {
        inputSchema.parse({ email: "invalid" });
      } catch (error) {
        const trpcError = new TRPCError({
          cause: error,
          code: "BAD_REQUEST",
          message: "Validation failed",
        });

        // Simulate the full error formatter
        const normalizedErrors = normalizeValidationErrors(trpcError.cause);
        const formattedError = {
          ...{
            code: trpcError.code,
            data: {},
            message: trpcError.message,
          },
          data: {
            fieldErrors: normalizedErrors,
          },
        };

        expect(formattedError.data.fieldErrors).toBeDefined();
        expect(
          formattedError.data.fieldErrors?.fieldErrors.email,
        ).toBeDefined();
      }
    });
  });
});
