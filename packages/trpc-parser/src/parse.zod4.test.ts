import { describe, expect, test } from "vitest";
import * as z4 from "zod/v4";
import { parseTRPCRouter } from "./parse";

describe("parseTRPCRouter with Zod v4", () => {
  describe("Zod v4 schema conversion to JSON Schema", () => {
    test("should parse a tRPC router with Zod v4 input and convert to JSON Schema", () => {
      // Create a mock tRPC procedure structure
      const mockProcedure = {
        _def: {
          inputs: [
            z4.object({
              age: z4.number().min(0).describe("User age"),
              name: z4.string().describe("User name"),
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
      expect((result.createUser as any).validator).toBe("zod");
      expect((result.createUser as any).schema).toBeDefined();
      // Zod v4 schema should have type: "object"
      expect((result.createUser as any).schema.type).toBe("object");
      expect((result.createUser as any).schema.properties).toHaveProperty(
        "name",
      );
      expect((result.createUser as any).schema.properties).toHaveProperty(
        "age",
      );
    });

    test("should parse a nested tRPC router with Zod v4 schemas", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            z4.object({
              id: z4.string().uuid(),
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
        "zod",
      );
      expect(
        ((result.users as any).children as any).getUser.schema,
      ).toBeDefined();
    });

    test("should handle procedure without inputs for Zod v4", () => {
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

    test("should merge multiple Zod v4 input schemas", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            z4.object({
              name: z4.string(),
            }),
            z4.object({
              age: z4.number(),
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
      expect((result.updateUser as any).validator).toBe("zod");
      expect((result.updateUser as any).schema).toBeDefined();
      // The merged schema should have both properties
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
