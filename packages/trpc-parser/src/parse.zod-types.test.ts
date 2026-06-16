import { describe, expect, test } from "vitest";
import { z } from "zod/v3";
import { parseTRPCRouter } from "./parse.js";

describe("parseTRPCRouter with Zod v3 - Supported Types", () => {
  describe("Zod type support", () => {
    test("should support Array type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ items: z.array(z.string()) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.items).toBeDefined();
    });

    test("should support BigInt type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ bigNum: z.bigint() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.bigNum).toBeDefined();
    });

    test("should support Boolean type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ isActive: z.boolean() })],
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

    test("should support Branded type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ id: z.string().brand<"UserId">() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.id).toBeDefined();
    });

    test("should support Default type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ name: z.string().default("anonymous") })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.name).toBeDefined();
    });

    test("should support DiscriminatedUnion type", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            z.object({
              shape: z.discriminatedUnion("kind", [
                z.object({ kind: z.literal("circle"), radius: z.number() }),
                z.object({ kind: z.literal("square"), sideLength: z.number() }),
              ]),
            }),
          ],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.shape).toBeDefined();
    });

    test("should support Effects type (transform/preprocess)", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            z.object({
              trimmed: z.string().transform((val) => val.trim()),
            }),
          ],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.trimmed).toBeDefined();
    });

    test("should support Enum type", () => {
      const ColorEnum = z.enum(["red", "green", "blue"]);
      const mockProcedure = {
        _def: {
          inputs: [z.object({ color: ColorEnum })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.color).toBeDefined();
    });

    test("should support Literal type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ literal: z.literal("constant") })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.literal).toBeDefined();
    });

    test("should support NativeEnum type", () => {
      enum Status {
        Active = "active",
        Inactive = "inactive",
      }
      const mockProcedure = {
        _def: {
          inputs: [z.object({ status: z.nativeEnum(Status) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.status).toBeDefined();
    });

    test("should support Nullable type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ value: z.string().nullable() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.value).toBeDefined();
    });

    test("should support Null type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ value: z.null() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.value).toBeDefined();
    });

    test("should support Nullish type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ value: z.string().nullish() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.value).toBeDefined();
    });

    test("should support Number type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ count: z.number() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.count.type).toBe("number");
    });

    test("should support Object type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ data: z.object({ nested: z.string() }) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.data).toBeDefined();
    });

    test("should support Optional type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ optional: z.string().optional() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.optional).toBeDefined();
    });

    test("should support Promise type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ asyncValue: z.promise(z.string()) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.asyncValue).toBeDefined();
    });

    test("should support String type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ text: z.string() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.text.type).toBe("string");
    });

    test("should support Undefined type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ undef: z.undefined() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.undef).toBeDefined();
    });

    test("should support Any type via json mode", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ anything: z.any() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.anything).toBeDefined();
    });
  });

  describe("Additional Zod types (now supported)", () => {
    test("should support Union type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ value: z.union([z.string(), z.number()]) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.value).toBeDefined();
      expect((result.test as any).schema.properties.value.type).toContain(
        "string",
      );
    });

    test("should support Tuple type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ tuple: z.tuple([z.string(), z.number()]) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.tuple).toBeDefined();
      expect((result.test as any).schema.properties.tuple.type).toBe("array");
    });

    test("should support Record type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ record: z.record(z.string(), z.number()) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.record).toBeDefined();
      expect((result.test as any).schema.properties.record.type).toBe("object");
    });

    test("should support Never type", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ neverField: z.never() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.neverField).toBeDefined();
    });

    test("should support Date type (superjson only)", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ createdAt: z.date() })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.createdAt).toBeDefined();
      expect((result.test as any).schema.properties.createdAt.type).toBe(
        "string",
      );
    });

    test("should support Map type (superjson only)", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ metadata: z.map(z.string(), z.string()) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.metadata).toBeDefined();
    });

    test("should support Set type (superjson only)", () => {
      const mockProcedure = {
        _def: {
          inputs: [z.object({ tags: z.set(z.string()) })],
          meta: {},
          type: "mutation",
        },
      };

      const result = parseTRPCRouter({ test: mockProcedure });
      expect((result.test as any).schema).toBeDefined();
      expect((result.test as any).schema.properties.tags).toBeDefined();
      expect((result.test as any).schema.properties.tags.type).toBe("array");
    });
  });
});
