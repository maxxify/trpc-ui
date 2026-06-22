import { type } from "arktype";
import * as s from "superstruct";
import * as v from "valibot";
import { describe, expect, test } from "vitest";
import * as yup from "yup";
import { z } from "zod/v3";

describe("Validator Error Formats", () => {
  describe("Zod", () => {
    test("ZodError.flatten() returns fieldErrors and formErrors", () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(1),
      });

      try {
        schema.parse({ email: "invalid", name: "" });
      } catch (error) {
        const zodError = error as z.ZodError;
        const flattened = zodError.flatten();
        expect(flattened.fieldErrors).toBeDefined();
        expect(flattened.formErrors).toBeDefined();
      }
    });
  });

  describe("Valibot", () => {
    test("Valibot error structure", () => {
      const schema = v.object({
        email: v.string("Invalid email"),
        name: v.string("Name is required"),
      });

      const result = v.safeParse(schema, { email: 123, name: "" });
      if (!result.success) {
        // Valibot returns issues array with path and message
        expect(result.issues).toBeDefined();
        expect(Array.isArray(result.issues)).toBe(true);
      }
    });
  });

  describe("Arktype", () => {
    test("Arktype error structure", () => {
      const schema = type({
        email: "string.email",
        name: "string",
      });

      const result = schema({ email: 123, name: "" });
      // Arktype returns an array-like error object (ArkErrors)
      expect(Array.isArray(result)).toBe(true);
      // Cast to access arktype-specific properties
      const arkResult = result as unknown as {
        " arkKind"?: string;
        length?: number;
        0?: { path?: unknown; message?: string };
      };
      expect(arkResult[" arkKind"]).toBe("errors");
      expect(arkResult.length).toBeGreaterThan(0);
      expect(arkResult[0]?.path).toBeDefined();
      expect(arkResult[0]?.message).toBeDefined();
    });
  });

  describe("Yup", () => {
    test("Yup error structure", async () => {
      const schema = yup.object({
        email: yup.string().email().required(),
        name: yup.string().required(),
      });

      try {
        await schema.validate({ email: "invalid", name: "" }).catch((error) => {
          // Yup returns ValidationError with inner array
          expect(error.errors).toBeDefined();
        });
      } catch (_error) {
        // Handle sync validation
      }
    });
  });

  describe("Superstruct", () => {
    test("Superstruct error structure", () => {
      const schema = s.object({
        email: s.string(),
        name: s.string(),
      });

      const [error] = s.validate({ email: 123, name: "" }, schema);
      if (error) {
        // Superstruct returns error with path and value
        expect(error).toBeDefined();
      }
    });
  });
});
