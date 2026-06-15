import * as v from "valibot";
import { describe, expect, test } from "vitest";
import { parseTRPCRouter } from "./parse.js";

describe("parseTRPCRouter with Valibot", () => {
  describe("Valibot schema conversion to JSON Schema", () => {
    test("should parse a tRPC router with Valibot input and convert to JSON Schema", () => {
      // Create a mock tRPC procedure structure
      const mockProcedure = {
        _def: {
          inputs: [
            v.object({
              age: v.number(),
              name: v.pipe(v.string(), v.minLength(1)),
            }),
          ],
          meta: {
            description: "Create a new user",
          },
          type: "mutation",
        },
      };

      const mockRouter = {
        createUser: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("createUser");
      expect((result.createUser as any).type).toBe("mutation");
      expect((result.createUser as any).path).toEqual(["createUser"]);
      expect((result.createUser as any).meta).toEqual({
        description: "Create a new user",
      });
      expect((result.createUser as any).validator).toBe("valibot");
      expect((result.createUser as any).schema).toBeDefined();
      // Single schema should have type: "object" directly
      expect((result.createUser as any).schema.type).toBe("object");
      expect((result.createUser as any).schema.properties).toHaveProperty(
        "name",
      );
      expect((result.createUser as any).schema.properties).toHaveProperty(
        "age",
      );
    });

    test("should parse a nested tRPC router with Valibot schemas", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            v.object({
              id: v.string(),
            }),
          ],
          meta: {},
          type: "query",
        },
      };

      const mockNestedRouter = {
        getUser: mockProcedure,
      };

      const mockRouter = {
        users: mockNestedRouter,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("users");
      expect((result.users as any).type).toBe("router");
      expect(((result.users as any).children as any).getUser.validator).toBe(
        "valibot",
      );
      expect(
        ((result.users as any).children as any).getUser.schema,
      ).toBeDefined();
      // Single schema should have type: "object" directly
      expect(
        ((result.users as any).children as any).getUser.schema,
      ).toHaveProperty("type", "object");
    });

    test("should handle procedure without inputs for Valibot", () => {
      const mockProcedure = {
        _def: {
          inputs: [],
          meta: {},
          type: "query",
        },
      };

      const mockRouter = {
        getAll: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("getAll");
      expect((result.getAll as any).validator).toBe("unknown");
      expect((result.getAll as any).schema).toBeUndefined();
    });

    test("should merge multiple Valibot input schemas", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            v.object({
              name: v.string(),
            }),
            v.object({
              age: v.number(),
            }),
          ],
          meta: {},
          type: "mutation",
        },
      };

      const mockRouter = {
        updateUser: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("updateUser");
      expect((result.updateUser as any).validator).toBe("valibot");
      expect((result.updateUser as any).schema).toBeDefined();
      // Merged schema should have type: object with combined properties (like Zod)
      expect((result.updateUser as any).schema.type).toBe("object");
      expect((result.updateUser as any).schema.properties).toHaveProperty(
        "name",
      );
      expect((result.updateUser as any).schema.properties).toHaveProperty(
        "age",
      );
    });
  });
});
