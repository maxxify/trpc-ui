import { describe, expect, test } from "vitest";
import { z } from "zod/v3";
import * as v from "valibot";
import { type } from "arktype";
import * as yup from "yup";
import * as s from "superstruct";
import { normalizeValidationErrors } from "./normalizeErrors.js";

describe("normalizeValidationErrors", () => {
  describe("Zod", () => {
    test("should normalize Zod error to fieldErrors format", () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().min(1),
      });

      try {
        schema.parse({ email: "invalid", name: "" });
      } catch (error) {
        const result = normalizeValidationErrors(error);
        expect(result).toBeDefined();
        expect(result?.fieldErrors.email).toBeDefined();
        expect(result?.fieldErrors.name).toBeDefined();
      }
    });

    test("should normalize Zod nested object error to full path", () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
          profile: z.object({
            name: z.string().min(1),
          }),
        }),
      });

      try {
        schema.parse({ user: { email: "invalid", profile: { name: "" } } });
      } catch (error) {
        const result = normalizeValidationErrors(error);
        expect(result).toBeDefined();
        expect(result?.fieldErrors["user.email"]).toBeDefined();
        expect(result?.fieldErrors["user.profile.name"]).toBeDefined();
      }
    });

    test("should normalize Zod discriminated union error to full path", () => {
      const schema = z.object({
        aDiscriminatedUnion: z.discriminatedUnion("discriminatedField", [
          z.object({
            aFieldThatOnlyShowsWhenValueIsOne: z.string(),
            discriminatedField: z.literal("One"),
          }),
          z.object({
            aFieldThatOnlyShowsWhenValueIsTwo: z.object({
              someTextFieldInAnObject: z.string(),
            }),
            discriminatedField: z.literal("Two"),
          }),
        ]),
      });

      try {
        schema.parse({
          aDiscriminatedUnion: {
            discriminatedField: "One",
            aFieldThatOnlyShowsWhenValueIsOne: 123,
          },
        });
      } catch (error) {
        const result = normalizeValidationErrors(error);
        expect(result).toBeDefined();
        expect(
          result?.fieldErrors[
            "aDiscriminatedUnion.aFieldThatOnlyShowsWhenValueIsOne"
          ],
        ).toBeDefined();
      }
    });
  });

  describe("Valibot", () => {
    test("should normalize Valibot error to fieldErrors format", () => {
      const schema = v.object({
        email: v.string("Invalid email"),
        name: v.string("Name is required"),
      });

      const result = v.safeParse(schema, { email: 123, name: "" });
      if (!result.success) {
        // Valibot returns issues array directly, wrap it in an object for normalization
        const normalized = normalizeValidationErrors({ issues: result.issues });
        expect(normalized).toBeDefined();
        expect(normalized?.fieldErrors.email).toBeDefined();
      }
    });

    test("should normalize Valibot nested object error to full path", () => {
      const schema = v.object({
        user: v.object({
          email: v.string("Invalid email"),
          profile: v.object({
            name: v.string("Name is required"),
          }),
        }),
      });

      const result = v.safeParse(schema, {
        user: { email: 123, profile: { name: "" } },
      });
      if (!result.success) {
        const normalized = normalizeValidationErrors({ issues: result.issues });
        expect(normalized).toBeDefined();
        // Valibot reports the first error found, which is user.email
        expect(normalized?.fieldErrors["user.email"]).toBeDefined();
      }
    });
  });

  describe("Arktype", () => {
    test("should normalize Arktype error to fieldErrors format", () => {
      const schema = type({
        email: "string.email",
        name: "string",
      });

      const result = schema({ email: 123, name: "" });
      // Arktype returns problems array on validation failure
      const arkResult = result as { problems?: unknown[] };
      if (arkResult.problems) {
        const normalized = normalizeValidationErrors(result);
        expect(normalized).toBeDefined();
        expect(normalized?.fieldErrors.email).toBeDefined();
      }
    });

    test("should normalize Arktype nested object error to full path", () => {
      const schema = type({
        user: {
          email: "string.email",
          profile: {
            name: "string",
          },
        },
      });

      const result = schema({ user: { email: 123, profile: { name: "" } } });
      const arkResult = result as { problems?: unknown[] };
      if (arkResult.problems) {
        const normalized = normalizeValidationErrors(result);
        expect(normalized).toBeDefined();
        expect(normalized?.fieldErrors["user.email"]).toBeDefined();
        expect(normalized?.fieldErrors["user.profile.name"]).toBeDefined();
      }
    });
  });

  describe("Yup", () => {
    test("should normalize Yup error to fieldErrors format", async () => {
      const schema = yup.object({
        email: yup.string().email().required(),
        name: yup.string().required(),
      });

      try {
        await schema.validate({ email: "invalid", name: "" });
      } catch (error) {
        const normalized = normalizeValidationErrors(error);
        expect(normalized).toBeDefined();
        expect(normalized?.fieldErrors.name).toBeDefined();
      }
    });

    test("should normalize Yup nested object error to full path", async () => {
      const schema = yup.object({
        user: yup.object({
          email: yup.string().email().required(),
          profile: yup.object({
            name: yup.string().required(),
          }),
        }),
      });

      try {
        await schema.validate({
          user: { email: "invalid", profile: { name: "" } },
        });
      } catch (error) {
        const normalized = normalizeValidationErrors(error);
        expect(normalized).toBeDefined();
        // Yup reports the first error found due to abortEarly, which is user.profile.name (empty string is required)
        expect(normalized?.fieldErrors["user.profile.name"]).toBeDefined();
      }
    });
  });

  describe("Superstruct", () => {
    test("should normalize Superstruct error to fieldErrors format", () => {
      const schema = s.object({
        email: s.string(),
        name: s.string(),
      });

      const [error] = s.validate({ email: 123, name: "" }, schema);
      if (error) {
        const normalized = normalizeValidationErrors(error);
        expect(normalized).toBeDefined();
        expect(normalized?.fieldErrors.email).toBeDefined();
      }
    });

    test("should normalize Superstruct nested object error to full path", () => {
      const schema = s.object({
        user: s.object({
          email: s.string(),
          profile: s.object({
            name: s.string(),
          }),
        }),
      });

      const [error] = s.validate(
        { user: { email: 123, profile: { name: "" } } },
        schema,
      );
      if (error) {
        const normalized = normalizeValidationErrors(error);
        expect(normalized).toBeDefined();
        expect(normalized?.fieldErrors["user.email"]).toBeDefined();
      }
    });
  });

  describe("Edge cases", () => {
    test("should return null for null error", () => {
      const result = normalizeValidationErrors(null);
      expect(result).toBeNull();
    });

    test("should return null for undefined error", () => {
      const result = normalizeValidationErrors(undefined);
      expect(result).toBeNull();
    });

    test("should return null for unrecognized error format", () => {
      const result = normalizeValidationErrors({ message: "error" });
      expect(result).toBeNull();
    });
  });
});
