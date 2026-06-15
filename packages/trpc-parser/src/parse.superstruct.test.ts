import * as s from "superstruct";
import { describe, expect, test } from "vitest";
import { parseTRPCRouter } from "./parse.js";

describe("parseTRPCRouter with Superstruct", () => {
  describe("Superstruct schema conversion to JSON Schema", () => {
    test("should parse a tRPC router with Superstruct input and convert to JSON Schema", () => {
      // Create a mock tRPC procedure structure
      const mockProcedure = {
        _def: {
          inputs: [
            s.object({
              age: s.number(),
              name: s.string(),
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
      expect((result.createUser as any).validator).toBe("superstruct");
      expect((result.createUser as any).schema).toBeDefined();
      // Superstruct schema should have type: "object"
      expect((result.createUser as any).schema.type).toBe("object");
      expect((result.createUser as any).schema.properties).toHaveProperty(
        "name",
      );
      expect((result.createUser as any).schema.properties).toHaveProperty(
        "age",
      );
    });

    test("should parse a nested tRPC router with Superstruct schemas", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            s.object({
              id: s.string(),
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
        "superstruct",
      );
      expect(
        ((result.users as any).children as any).getUser.schema,
      ).toBeDefined();
      expect(
        ((result.users as any).children as any).getUser.schema,
      ).toHaveProperty("type", "object");
    });

    test("should handle procedure without inputs for Superstruct", () => {
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

    test("should merge multiple Superstruct input schemas", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            s.object({
              name: s.string(),
            }),
            s.object({
              age: s.number(),
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
      expect((result.updateUser as any).validator).toBe("superstruct");
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

    test("should handle Superstruct string schema", () => {
      const mockProcedure = {
        _def: {
          inputs: [s.string()],
          meta: {},
          type: "query",
        },
      };

      const mockRouter = {
        getName: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("getName");
      expect((result.getName as any).validator).toBe("superstruct");
      expect((result.getName as any).schema).toBeDefined();
      expect((result.getName as any).schema.type).toBe("string");
    });

    test("should handle Superstruct number schema", () => {
      const mockProcedure = {
        _def: {
          inputs: [s.number()],
          meta: {},
          type: "query",
        },
      };

      const mockRouter = {
        getAge: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("getAge");
      expect((result.getAge as any).validator).toBe("superstruct");
      expect((result.getAge as any).schema).toBeDefined();
      expect((result.getAge as any).schema.type).toBe("number");
    });

    test("should handle Superstruct boolean schema", () => {
      const mockProcedure = {
        _def: {
          inputs: [s.boolean()],
          meta: {},
          type: "mutation",
        },
      };

      const mockRouter = {
        getActive: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("getActive");
      expect((result.getActive as any).validator).toBe("superstruct");
      expect((result.getActive as any).schema).toBeDefined();
      expect((result.getActive as any).schema.type).toBe("boolean");
    });

    test("should handle Superstruct array schema", () => {
      const mockProcedure = {
        _def: {
          inputs: [s.array(s.string())],
          meta: {},
          type: "query",
        },
      };

      const mockRouter = {
        getItems: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("getItems");
      expect((result.getItems as any).validator).toBe("superstruct");
      expect((result.getItems as any).schema).toBeDefined();
      expect((result.getItems as any).schema.type).toBe("array");
    });

    test("should handle Superstruct optional schema", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            s.object({
              email: s.optional(s.string()),
              name: s.string(),
            }),
          ],
          meta: {},
          type: "query",
        },
      };

      const mockRouter = {
        getOptional: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("getOptional");
      expect((result.getOptional as any).validator).toBe("superstruct");
      expect((result.getOptional as any).schema).toBeDefined();
      expect((result.getOptional as any).schema.type).toBe("object");
    });
  });
});
