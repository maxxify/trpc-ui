import { type } from "arktype";
import { describe, expect, test, vi } from "vitest";
import { parseTRPCRouter } from "./parse.js";

describe("parseTRPCRouter with Arktype - Supported Types", () => {
  describe("Arktype type support", () => {
    test("should support String type", () => {
      const mockProcedure = {
        _def: {
          inputs: [type({ text: "string" })],
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
          inputs: [type({ count: "number" })],
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
          inputs: [type({ isActive: "boolean" })],
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
          inputs: [type({ items: "string[]" })],
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
          inputs: [type({ data: { nested: "string" } })],
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
          inputs: [type({ value: "string | number" })],
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
          inputs: [type({ optional: "string?" })],
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
          inputs: [type({ value: "null" })],
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
          inputs: [type({ literal: '"constant"' })],
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

    test("should support Enum type", () => {
      const mockProcedure = {
        _def: {
          inputs: [type({ color: "'red' | 'green' | 'blue'" })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.color.enum).toBeDefined();
    });

    test("should support Record type", () => {
      const mockProcedure = {
        _def: {
          inputs: [type({ record: "Record<string, number>" })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.record.type).toBe("object");
    });

    test("should support nested objects", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            type({
              user: {
                age: "number?",
                name: "string",
              },
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

    test("should handle Date type with superjson format", () => {
      // Date type cannot be converted to JSON Schema, but works with superjson
      // Users can input via JSON editor: { "json": "2025-03-16T12:00:00Z", "meta": { "values": ["Date"] } }
      const mockProcedure = {
        _def: {
          inputs: [type({ createdAt: "Date" })],
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
      expect((result.test as any).validator).toBe("arktype");

      consoleSpy.mockRestore();
    });

    test("should handle BigInt type with superjson format", () => {
      // BigInt type cannot be converted to JSON Schema, but works with superjson
      // Users can input via JSON editor: { "json": "9007199254740991", "meta": { "values": ["bigint"] } }
      const mockProcedure = {
        _def: {
          inputs: [type({ bigNum: "bigint" })],
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
      expect((result.test as any).validator).toBe("arktype");

      consoleSpy.mockRestore();
    });
  });
});
