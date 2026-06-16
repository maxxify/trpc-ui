import * as v from "valibot";
import { describe, expect, test, vi } from "vitest";
import { parseTRPCRouter } from "./parse.js";

describe("parseTRPCRouter with Valibot - Supported Types", () => {
  describe("Valibot type support", () => {
    test("should support String type", () => {
      const mockProcedure = {
        _def: {
          inputs: [v.object({ text: v.string() })],
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
          inputs: [v.object({ count: v.number() })],
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
          inputs: [v.object({ isActive: v.boolean() })],
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
          inputs: [v.object({ items: v.array(v.string()) })],
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
          inputs: [v.object({ data: v.object({ nested: v.string() }) })],
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
          inputs: [v.object({ value: v.union([v.string(), v.number()]) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.value).toBeDefined();
      expect((result.test as any).schema.properties.value.anyOf).toBeDefined();
    });

    test("should support Optional type", () => {
      const mockProcedure = {
        _def: {
          inputs: [v.object({ optional: v.optional(v.string()) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.optional).toBeDefined();
    });

    test("should support Null type", () => {
      const mockProcedure = {
        _def: {
          inputs: [v.object({ value: v.null() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.value.type).toBe("null");
    });

    test("should support Literal type", () => {
      const mockProcedure = {
        _def: {
          inputs: [v.object({ literal: v.literal("constant") })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.literal.const).toBe(
        "constant",
      );
    });

    test("should support Enum (picklist) type", () => {
      const mockProcedure = {
        _def: {
          inputs: [v.object({ color: v.picklist(["red", "green", "blue"]) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.color.enum).toEqual([
        "red",
        "green",
        "blue",
      ]);
    });

    test("should support Tuple type", () => {
      const mockProcedure = {
        _def: {
          inputs: [v.object({ tuple: v.tuple([v.string(), v.number()]) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.tuple.type).toBe("array");
    });

    test("should support Record type", () => {
      const mockProcedure = {
        _def: {
          inputs: [v.object({ record: v.record(v.string(), v.number()) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.record.type).toBe("object");
    });

    test("should support piped validations", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            v.object({
              email: v.pipe(v.string(), v.email()),
              minLength: v.pipe(v.string(), v.minLength(5)),
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

    test("should handle Date type with superjson format", () => {
      // Date type cannot be converted to JSON Schema, but works with superjson
      // Users can input via JSON editor: { "json": "2025-03-16T12:00:00Z", "meta": { "values": ["Date"] } }
      const mockProcedure = {
        _def: {
          inputs: [v.object({ createdAt: v.date() })],
          meta: {},
          type: "mutation",
        },
      };

      // Suppress expected console.error for unsupported Date type
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = parseTRPCRouter({ test: mockProcedure });
      // Date schema conversion may fail, but procedure should still be parseable
      expect((result.test as any).validator).toBe("valibot");

      consoleSpy.mockRestore();
    });

    test("should handle BigInt type with superjson format", () => {
      // BigInt type cannot be converted to JSON Schema, but works with superjson
      // Users can input via JSON editor: { "json": "9007199254740991", "meta": { "values": ["bigint"] } }
      const mockProcedure = {
        _def: {
          inputs: [v.object({ bigNum: v.bigint() })],
          meta: {},
          type: "mutation",
        },
      };

      // Suppress expected console.error for unsupported BigInt type
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = parseTRPCRouter({ test: mockProcedure });
      // BigInt schema conversion may fail, but procedure should still be parseable
      expect((result.test as any).validator).toBe("valibot");

      consoleSpy.mockRestore();
    });
  });
});
