import { type } from "arktype";
import * as s from "superstruct";
import { normalizeValidationErrors } from "trpc-parser";
import * as v from "valibot";
import { describe, expect, test } from "vitest";
import * as yup from "yup";
import { z } from "zod/v3";

// Helper to simulate tRPC error formatter behavior
async function simulateTRPCErrorFormatter(
  input: unknown,
  schema: any,
  validatorType: "zod" | "valibot" | "arktype" | "yup" | "superstruct",
) {
  let validationError: unknown;

  try {
    if (validatorType === "zod") {
      schema.parse(input);
    } else if (validatorType === "valibot") {
      const result = v.safeParse(schema, input);
      if (!result.success) {
        validationError = { issues: result.issues };
      }
    } else if (validatorType === "arktype") {
      // Arktype doesn't throw - it returns an error object directly
      // Pass the result directly to normalizeValidationErrors (same as existing tests)
      validationError = schema(input);
    } else if (validatorType === "yup") {
      await schema.validate(input, { abortEarly: false });
    } else if (validatorType === "superstruct") {
      const [error] = s.validate(input, schema);
      if (error) validationError = error;
    }
  } catch (error) {
    validationError = error;
  }

  // Simulate what tRPC's error formatter does
  const normalizedErrors = normalizeValidationErrors(validationError);
  return normalizedErrors;
}

describe("normalizeValidationErrors with @trpc/server integration", () => {
  describe("Zod", () => {
    test("should format validation errors consistently for tRPC error response", async () => {
      const schema = z.object({
        email: z.string().email("Invalid email format"),
        name: z.string().min(1, "Name is required"),
      });

      const result = await simulateTRPCErrorFormatter(
        { email: "invalid-email", name: "" },
        schema,
        "zod",
      );

      expect(result).toBeDefined();
      expect(result?.fieldErrors.email).toEqual(["Invalid email format"]);
      expect(result?.fieldErrors.name).toEqual(["Name is required"]);
    });

    test("should handle nested object validation errors for tRPC", async () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
          profile: z.object({
            name: z.string().min(1),
          }),
        }),
      });

      const result = await simulateTRPCErrorFormatter(
        { user: { email: "invalid", profile: { name: "" } } },
        schema,
        "zod",
      );

      expect(result).toBeDefined();
      expect(result?.fieldErrors["user.email"]).toBeDefined();
      expect(result?.fieldErrors["user.profile.name"]).toBeDefined();
    });

    test("should handle discriminated union errors for tRPC", async () => {
      const schema = z.object({
        type: z.discriminatedUnion("type", [
          z.object({ type: z.literal("a"), value: z.string() }),
          z.object({ type: z.literal("b"), value: z.number() }),
        ]),
      });

      const result = await simulateTRPCErrorFormatter(
        { type: "a", value: 123 }, // Wrong type for 'a'
        schema,
        "zod",
      );

      expect(result).toBeDefined();
      // Zod discriminated union errors may have different path structure
      // Just verify we get some field errors
      expect(Object.keys(result?.fieldErrors || {}).length).toBeGreaterThan(0);
    });
  });

  describe("Valibot", () => {
    test("should format validation errors consistently for tRPC error response", async () => {
      const schema = v.object({
        email: v.string("Invalid email"),
        name: v.string("Name is required"),
      });

      const result = await simulateTRPCErrorFormatter(
        { email: 123, name: "" },
        schema,
        "valibot",
      );

      expect(result).toBeDefined();
      expect(result?.fieldErrors.email).toBeDefined();
    });

    test("should handle nested object validation errors for tRPC", async () => {
      const schema = v.object({
        user: v.object({
          email: v.string("Invalid email"),
          profile: v.object({
            name: v.string("Name is required"),
          }),
        }),
      });

      const result = await simulateTRPCErrorFormatter(
        { user: { email: 123, profile: { name: "" } } },
        schema,
        "valibot",
      );

      expect(result).toBeDefined();
      expect(result?.fieldErrors["user.email"]).toBeDefined();
    });
  });

  describe("Arktype", () => {
    test("should format validation errors consistently for tRPC error response", async () => {
      const schema = type({
        email: "string.email",
        name: "string",
      });

      const result = await simulateTRPCErrorFormatter(
        { email: 123, name: "" },
        schema,
        "arktype",
      );

      expect(result).toBeDefined();
      expect(result?.fieldErrors.email).toBeDefined();
    });

    test("should handle nested object validation errors for tRPC", async () => {
      const schema = type({
        user: {
          email: "string.email",
          profile: {
            name: "string",
          },
        },
      });

      const result = await simulateTRPCErrorFormatter(
        { user: { email: 123, profile: { name: "" } } },
        schema,
        "arktype",
      );

      expect(result).toBeDefined();
      expect(result?.fieldErrors["user.email"]).toBeDefined();
    });

    test("should handle missing fields for tRPC", async () => {
      const schema = type({
        email: "string.email",
        name: "string",
      });

      const result = await simulateTRPCErrorFormatter({}, schema, "arktype");

      expect(result).toBeDefined();
      expect(result?.fieldErrors.email).toBeDefined();
      expect(result?.fieldErrors.name).toBeDefined();
    });
  });

  describe("Yup", () => {
    test("should format validation errors consistently for tRPC error response", async () => {
      const schema = yup.object({
        email: yup.string().email().required(),
        name: yup.string().required(),
      });

      const result = await simulateTRPCErrorFormatter(
        { email: "invalid", name: "" },
        schema,
        "yup",
      );

      expect(result).toBeDefined();
      expect(result?.fieldErrors.email).toBeDefined();
      expect(result?.fieldErrors.name).toBeDefined();
    });

    test("should handle nested object validation errors for tRPC", async () => {
      const schema = yup.object({
        user: yup.object({
          email: yup.string().email().required(),
          profile: yup.object({
            name: yup.string().required(),
          }),
        }),
      });

      const result = await simulateTRPCErrorFormatter(
        { user: { email: "invalid", profile: { name: "" } } },
        schema,
        "yup",
      );

      expect(result).toBeDefined();
      expect(result?.fieldErrors["user.email"]).toBeDefined();
      expect(result?.fieldErrors["user.profile.name"]).toBeDefined();
    });

    test("should handle missing fields for tRPC", async () => {
      const schema = yup.object({
        email: yup.string().email().required(),
        name: yup.string().required(),
      });

      const result = await simulateTRPCErrorFormatter({}, schema, "yup");

      expect(result).toBeDefined();
      expect(result?.fieldErrors.email).toBeDefined();
      expect(result?.fieldErrors.name).toBeDefined();
    });
  });

  describe("Superstruct", () => {
    test("should format validation errors consistently for tRPC error response", async () => {
      const schema = s.object({
        email: s.string(),
        name: s.string(),
      });

      const result = await simulateTRPCErrorFormatter(
        { email: 123, name: "" },
        schema,
        "superstruct",
      );

      expect(result).toBeDefined();
      expect(result?.fieldErrors.email).toBeDefined();
    });

    test("should handle nested object validation errors for tRPC", async () => {
      const schema = s.object({
        user: s.object({
          email: s.string(),
          profile: s.object({
            name: s.string(),
          }),
        }),
      });

      const result = await simulateTRPCErrorFormatter(
        { user: { email: 123, profile: { name: "" } } },
        schema,
        "superstruct",
      );

      expect(result).toBeDefined();
      expect(result?.fieldErrors["user.email"]).toBeDefined();
    });
  });

  describe("Cross-validator consistency", () => {
    test("all validators should produce same fieldErrors structure for simple string validation", async () => {
      const invalidInput = { email: 123 };

      const zodSchema = z.object({ email: z.string().email() });
      const valibotSchema = v.object({ email: v.string() });
      const arktypeSchema = type({ email: "string.email" });
      const yupSchema = yup.object({ email: yup.string().email().required() });
      const superstructSchema = s.object({ email: s.string() });

      const zodResult = await simulateTRPCErrorFormatter(
        invalidInput,
        zodSchema,
        "zod",
      );
      const valibotResult = await simulateTRPCErrorFormatter(
        invalidInput,
        valibotSchema,
        "valibot",
      );
      const arktypeResult = await simulateTRPCErrorFormatter(
        invalidInput,
        arktypeSchema,
        "arktype",
      );
      const yupResult = await simulateTRPCErrorFormatter(
        invalidInput,
        yupSchema,
        "yup",
      );
      const superstructResult = await simulateTRPCErrorFormatter(
        invalidInput,
        superstructSchema,
        "superstruct",
      );

      // All should have fieldErrors with 'email' key
      expect(zodResult?.fieldErrors.email).toBeDefined();
      expect(valibotResult?.fieldErrors.email).toBeDefined();
      expect(arktypeResult?.fieldErrors.email).toBeDefined();
      expect(yupResult?.fieldErrors.email).toBeDefined();
      expect(superstructResult?.fieldErrors.email).toBeDefined();

      // All should have the same structure: fieldErrors is a Record<string, string[]>
      expect(typeof zodResult?.fieldErrors).toBe("object");
      expect(typeof valibotResult?.fieldErrors).toBe("object");
      expect(typeof arktypeResult?.fieldErrors).toBe("object");
      expect(typeof yupResult?.fieldErrors).toBe("object");
      expect(typeof superstructResult?.fieldErrors).toBe("object");

      // All should have formErrors as an array
      expect(Array.isArray(zodResult?.formErrors)).toBe(true);
      expect(Array.isArray(valibotResult?.formErrors)).toBe(true);
      expect(Array.isArray(arktypeResult?.formErrors)).toBe(true);
      expect(Array.isArray(yupResult?.formErrors)).toBe(true);
      expect(Array.isArray(superstructResult?.formErrors)).toBe(true);
    });
  });
});
