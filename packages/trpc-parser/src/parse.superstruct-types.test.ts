import * as s from "superstruct";
import { describe, expect, test } from "vitest";
import { parseTRPCRouter } from "./parse.js";

describe("parseTRPCRouter with Superstruct - Supported Types", () => {
  describe("Superstruct type support", () => {
    test("should support String type", () => {
      const mockProcedure = {
        _def: {
          inputs: [s.object({ text: s.string() })],
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
          inputs: [s.object({ count: s.number() })],
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
          inputs: [s.object({ isActive: s.boolean() })],
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
          inputs: [s.object({ items: s.array(s.string()) })],
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
            s.object({
              data: s.object({ nested: s.string() }),
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

    test("should support Union type", () => {
      const mockProcedure = {
        _def: {
          inputs: [s.object({ value: s.union([s.string(), s.number()]) })],
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
          inputs: [
            s.object({
              optional: s.optional(s.string()),
              required: s.string(),
            }),
          ],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.optional).toBeDefined();
      expect((result.test as any).schema.properties.required).toBeDefined();
    });

    test("should support Literal type", () => {
      const mockProcedure = {
        _def: {
          inputs: [s.object({ literal: s.literal("constant") })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.literal).toBeDefined();
    });

    test("should support Enum type", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            s.object({
              color: s.enums(["red", "green", "blue"]),
            }),
          ],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.color).toBeDefined();
    });

    test("should support nested objects", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            s.object({
              user: s.object({
                age: s.number(),
                name: s.string(),
              }),
            }),
          ],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.user.type).toBe("object");
      expect(
        (result.test as any).schema.properties.user.properties,
      ).toHaveProperty("name");
    });
  });
});
