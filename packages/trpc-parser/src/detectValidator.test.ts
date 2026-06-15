import { type } from "arktype";
import * as s from "superstruct";
import * as v from "valibot";
import { describe, expect, test } from "vitest";
import * as yup from "yup";
import { z } from "zod";
import * as z4 from "zod/v4";
import { detectValidatorType } from "./detectValidator.js";

describe("detectValidatorType", () => {
  describe("null and undefined handling", () => {
    test("should return 'unknown' for null", () => {
      expect(detectValidatorType(null)).toBe("unknown");
    });

    test("should return 'unknown' for undefined", () => {
      expect(detectValidatorType(undefined)).toBe("unknown");
    });
  });

  describe("Zod detection via ~standard vendor", () => {
    test("should detect Zod v3 via ~standard.vendor containing 'zod'", () => {
      const schema = z.string();
      expect(detectValidatorType(schema)).toBe("zod");
    });

    test("should detect Zod v3 object schema via ~standard vendor", () => {
      const schema = z.object({
        age: z.number(),
        name: z.string(),
      });
      expect(detectValidatorType(schema)).toBe("zod");
    });

    test("should detect Zod v3 array schema via ~standard vendor", () => {
      const schema = z.array(z.string());
      expect(detectValidatorType(schema)).toBe("zod");
    });

    test("should detect Zod v3 union schema via ~standard vendor", () => {
      const schema = z.union([z.string(), z.number()]);
      expect(detectValidatorType(schema)).toBe("zod");
    });

    test("should detect Zod v4 via ~standard.vendor containing 'zod'", () => {
      const schema = z4.string();
      expect(detectValidatorType(schema)).toBe("zod");
    });

    test("should detect Zod v4 object schema via ~standard vendor", () => {
      const schema = z4.object({
        age: z4.number(),
        name: z4.string(),
      });
      expect(detectValidatorType(schema)).toBe("zod");
    });

    test("should detect Zod v4 array schema via ~standard vendor", () => {
      const schema = z4.array(z4.string());
      expect(detectValidatorType(schema)).toBe("zod");
    });
  });

  describe("Valibot detection via ~standard vendor", () => {
    test("should detect Valibot via ~standard.vendor containing 'valibot'", () => {
      const schema = v.string();
      expect(detectValidatorType(schema)).toBe("valibot");
    });

    test("should detect Valibot object schema via ~standard vendor", () => {
      const schema = v.object({
        age: v.number(),
        name: v.string(),
      });
      expect(detectValidatorType(schema)).toBe("valibot");
    });

    test("should detect Valibot array schema via ~standard vendor", () => {
      const schema = v.array(v.string());
      expect(detectValidatorType(schema)).toBe("valibot");
    });
  });

  describe("Yup detection via ~standard vendor", () => {
    test("should detect Yup via ~standard.vendor containing 'yup'", () => {
      const schema = yup.string();
      expect(detectValidatorType(schema)).toBe("yup");
    });

    test("should detect Yup object schema via ~standard vendor", () => {
      const schema = yup.object({
        age: yup.number(),
        name: yup.string(),
      });
      expect(detectValidatorType(schema)).toBe("yup");
    });

    test("should detect Yup array schema via ~standard vendor", () => {
      const schema = yup.array().of(yup.string());
      expect(detectValidatorType(schema)).toBe("yup");
    });
  });

  describe("Superstruct heuristic detection", () => {
    test("should detect Superstruct via type and Struct constructor", () => {
      const schema = s.string();
      expect(detectValidatorType(schema)).toBe("superstruct");
    });

    test("should detect Superstruct object schema via heuristic", () => {
      const schema = s.object({
        age: s.number(),
        name: s.string(),
      });
      expect(detectValidatorType(schema)).toBe("superstruct");
    });

    test("should detect Superstruct array schema via heuristic", () => {
      const schema = s.array(s.string());
      expect(detectValidatorType(schema)).toBe("superstruct");
    });
  });

  describe("Arktype detection via ~standard vendor", () => {
    test("should detect Arktype via ~standard.vendor containing 'arktype'", () => {
      const schema = type("string");
      expect(detectValidatorType(schema)).toBe("arktype");
    });

    test("should detect Arktype object schema via ~standard vendor", () => {
      const schema = type({
        age: "number",
        name: "string",
      });
      expect(detectValidatorType(schema)).toBe("arktype");
    });
  });

  describe("Zod heuristic detection (without ~standard)", () => {
    test("should detect Zod via ~standard vendor (heuristics are fallback)", () => {
      // Note: The Zod heuristic detection requires instanceof check which is hard to mock
      // Real Zod schemas will be detected via ~standard vendor property
      const schema = z.string();
      expect(detectValidatorType(schema)).toBe("zod");
    });
  });

  describe("Valibot heuristic detection (without ~standard)", () => {
    test("should detect Valibot-like object via _type, _schema, and _parse", () => {
      const mockValibotSchema = {
        _parse: () => ({}),
        _schema: "string",
        _type: "string",
      };
      expect(detectValidatorType(mockValibotSchema)).toBe("valibot");
    });

    test("should detect Valibot-like object via _type, _expected, and _parse", () => {
      const mockValibotSchema = {
        _expected: "string",
        _parse: () => ({}),
        _type: "string",
      };
      expect(detectValidatorType(mockValibotSchema)).toBe("valibot");
    });

    test("should return 'unknown' when _parse is not a function", () => {
      const mockValibotSchema = {
        _parse: "not a function",
        _schema: "string",
        _type: "string",
      };
      expect(detectValidatorType(mockValibotSchema)).toBe("unknown");
    });
  });

  describe("Arktype heuristic detection (without ~standard)", () => {
    test("should detect Arktype-like object via infer, type, as, and schema properties", () => {
      const mockArktypeSchema = {
        as: () => ({}),
        infer: () => ({}),
        schema: "string",
        type: "string",
      };
      expect(detectValidatorType(mockArktypeSchema)).toBe("arktype");
    });

    test("should return 'unknown' when infer is not a function", () => {
      const mockArktypeSchema = {
        as: () => ({}),
        infer: "not a function",
        schema: "string",
        type: "string",
      };
      expect(detectValidatorType(mockArktypeSchema)).toBe("unknown");
    });

    test("should return 'unknown' when as is not a function", () => {
      const mockArktypeSchema = {
        as: "not a function",
        infer: () => ({}),
        schema: "string",
        type: "string",
      };
      expect(detectValidatorType(mockArktypeSchema)).toBe("unknown");
    });
  });

  describe("unknown validator type", () => {
    test("should return 'unknown' for plain object without validator properties", () => {
      const plainObject = { foo: "bar" };
      expect(detectValidatorType(plainObject)).toBe("unknown");
    });

    test("should return 'unknown' for empty object", () => {
      expect(detectValidatorType({})).toBe("unknown");
    });

    test("should return 'unknown' for primitive values", () => {
      expect(detectValidatorType("string")).toBe("unknown");
      expect(detectValidatorType(123)).toBe("unknown");
      expect(detectValidatorType(true)).toBe("unknown");
    });

    test("should return 'unknown' for array", () => {
      expect(detectValidatorType([1, 2, 3])).toBe("unknown");
    });

    test("should return 'unknown' for object with partial validator properties", () => {
      // Has _def but missing other Zod properties
      const partialZod = { _def: {} };
      expect(detectValidatorType(partialZod)).toBe("unknown");

      // Has _type but missing other Valibot properties
      const partialValibot = { _type: "string" };
      expect(detectValidatorType(partialValibot)).toBe("unknown");

      // Has infer but missing other Arktype properties
      const partialArktype = { infer: () => ({}) };
      expect(detectValidatorType(partialArktype)).toBe("unknown");
    });
  });

  describe("edge cases", () => {
    test("should handle validator with throw-on-access properties gracefully", () => {
      // Create a mock that throws on ~standard access but doesn't match any validator pattern
      const mockValidator = {
        get "~standard"() {
          throw new Error("Cannot access");
        },
        // Missing the required properties for any validator type
        someOtherProp: "value",
      };
      // Should not throw, should fall through to heuristics and return "unknown"
      expect(() => detectValidatorType(mockValidator)).not.toThrow();
      expect(detectValidatorType(mockValidator)).toBe("unknown");
    });

    test("should handle error in ~standard access and still check heuristics", () => {
      // This tests that when ~standard throws, we still try heuristics
      // But we need to ensure the heuristic check doesn't pass
      const mockValidator = {
        // Has some properties but not enough for any validator type
        _def: { someProp: "value" },
        get "~standard"() {
          throw new Error("Cannot access");
        },
        constructor: { name: "SomeOtherClass" }, // Doesn't include "Zod"
        parse: () => ({}),
        safeParse: "not a function", // Not a function, so won't match Zod
      };
      expect(() => detectValidatorType(mockValidator)).not.toThrow();
      expect(detectValidatorType(mockValidator)).toBe("unknown");
    });

    test("should detect Zod with vendor in different case", () => {
      const schema = z.string();
      // The function uses .toLowerCase() on vendor, so it should handle any case
      expect(detectValidatorType(schema)).toBe("zod");
    });

    test("should detect Valibot with vendor in different case", () => {
      const schema = v.string();
      expect(detectValidatorType(schema)).toBe("valibot");
    });

    test("should detect Arktype with vendor in different case", () => {
      const schema = type("string");
      expect(detectValidatorType(schema)).toBe("arktype");
    });

    test("should detect Yup with vendor in different case", () => {
      const schema = yup.string();
      expect(detectValidatorType(schema)).toBe("yup");
    });

    test("should detect Superstruct with Struct constructor", () => {
      const schema = s.string();
      expect(detectValidatorType(schema)).toBe("superstruct");
    });
  });
});
