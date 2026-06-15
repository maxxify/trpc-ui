import { type } from "arktype";
import { describe, expect, test } from "vitest";
import { parseTRPCRouter } from "./parse.js";

describe("parseTRPCRouter with Arktype", () => {
  describe("Arktype schema conversion to JSON Schema", () => {
    test("should parse a tRPC router with Arktype input and convert to JSON Schema", () => {
      // Create a mock tRPC procedure structure
      const mockProcedure = {
        _def: {
          inputs: [
            type({
              age: "number",
              name: "string",
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
      expect((result.createUser as any).validator).toBe("arktype");
      expect((result.createUser as any).schema).toBeDefined();
      // Arktype schema should have type: "object"
      expect((result.createUser as any).schema.type).toBe("object");
      expect((result.createUser as any).schema.properties).toHaveProperty(
        "name",
      );
      expect((result.createUser as any).schema.properties).toHaveProperty(
        "age",
      );
    });

    test("should parse a nested tRPC router with Arktype schemas", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            type({
              id: "string",
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
        "arktype",
      );
      expect(
        ((result.users as any).children as any).getUser.schema,
      ).toBeDefined();
    });

    test("should handle procedure without inputs for Arktype", () => {
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

    test("should merge multiple Arktype input schemas", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            type({
              name: "string",
            }),
            type({
              age: "number",
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
      expect((result.updateUser as any).validator).toBe("arktype");
      expect((result.updateUser as any).schema).toBeDefined();
      // The merged schema should have both properties
      expect((result.updateUser as any).schema.properties).toHaveProperty(
        "name",
      );
      expect((result.updateUser as any).schema.properties).toHaveProperty(
        "age",
      );
    });
  });
});
