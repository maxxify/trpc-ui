import { describe, expect, test } from "vitest";
import * as yup from "yup";
import { parseTRPCRouter } from "./parse.js";

describe("parseTRPCRouter with Yup - Supported Types", () => {
  describe("Yup type support", () => {
    test("should support String type", () => {
      const mockProcedure = {
        _def: {
          inputs: [yup.object({ text: yup.string().required() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.text.type).toBe("string");
    });

    test("should support Number type", () => {
      const mockProcedure = {
        _def: {
          inputs: [yup.object({ count: yup.number().required() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.count.type).toBe("number");
    });

    test("should support Boolean type", () => {
      const mockProcedure = {
        _def: {
          inputs: [yup.object({ isActive: yup.boolean().required() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.isActive.type).toBe(
        "boolean",
      );
    });

    test("should support Array type", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            yup.object({ items: yup.array().of(yup.string()).required() }),
          ],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.items.type).toBe("array");
    });

    test("should support Object type", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            yup.object({
              data: yup.object({ nested: yup.string().required() }).required(),
            }),
          ],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.data.type).toBe("object");
    });

    test("should support Date type", () => {
      const mockProcedure = {
        _def: {
          inputs: [yup.object({ createdAt: yup.date().required() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.createdAt.type).toBe(
        "string",
      );
      expect((result.test as any).schema.properties.createdAt.format).toBe(
        "date-time",
      );
    });

    test("should support Nullable type", () => {
      const mockProcedure = {
        _def: {
          inputs: [yup.object({ value: yup.string().nullable() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.value).toBeDefined();
    });

    test("should support Optional type", () => {
      const mockProcedure = {
        _def: {
          inputs: [yup.object({ optional: yup.string().optional() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.optional).toBeDefined();
    });

    test("should support string validations", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            yup.object({
              email: yup.string().email().required(),
              minLength: yup.string().min(5).required(),
            }),
          ],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.email).toBeDefined();
      expect((result.test as any).schema.properties.minLength).toBeDefined();
    });

    test("should support number validations", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            yup.object({
              max: yup.number().max(100).required(),
              min: yup.number().min(0).required(),
            }),
          ],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.min).toBeDefined();
      expect((result.test as any).schema.properties.max).toBeDefined();
    });
  });
});
