import { describe, expect, test } from "vitest";
import * as yup from "yup";
import { parseTRPCRouter } from "./parse.js";

describe("parseTRPCRouter with Yup", () => {
  describe("Yup schema conversion to JSON Schema", () => {
    test("should parse a tRPC router with Yup input and convert to JSON Schema", () => {
      // Create a mock tRPC procedure structure
      const mockProcedure = {
        _def: {
          inputs: [
            yup.object({
              age: yup.number().min(0).required(),
              name: yup.string().required(),
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
      expect((result.createUser as any).validator).toBe("yup");
      expect((result.createUser as any).schema).toBeDefined();
      // Yup schema should have type: "object"
      expect((result.createUser as any).schema.type).toBe("object");
      expect((result.createUser as any).schema.properties).toHaveProperty(
        "name",
      );
      expect((result.createUser as any).schema.properties).toHaveProperty(
        "age",
      );
    });

    test("should parse a nested tRPC router with Yup schemas", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            yup.object({
              id: yup.string().required(),
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
        "yup",
      );
      expect(
        ((result.users as any).children as any).getUser.schema,
      ).toBeDefined();
      expect(
        ((result.users as any).children as any).getUser.schema,
      ).toHaveProperty("type", "object");
    });

    test("should handle procedure without inputs for Yup", () => {
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

    test("should merge multiple Yup input schemas", () => {
      const mockProcedure = {
        _def: {
          inputs: [
            yup.object({
              name: yup.string().required(),
            }),
            yup.object({
              age: yup.number().min(0),
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
      expect((result.updateUser as any).validator).toBe("yup");
      expect((result.updateUser as any).schema).toBeDefined();
      // The merged schema should have both properties
      expect((result.updateUser as any).schema.type).toBe("object");
      expect((result.updateUser as any).schema.properties).toHaveProperty(
        "name",
      );
      expect((result.updateUser as any).schema.properties).toHaveProperty(
        "age",
      );
      // name should be required
      expect((result.updateUser as any).schema.required).toContain("name");
    });

    test("should handle Yup string schema", () => {
      const mockProcedure = {
        _def: {
          inputs: [yup.string().email().required()],
          meta: {},
          type: "query",
        },
      };

      const mockRouter = {
        getEmail: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("getEmail");
      expect((result.getEmail as any).validator).toBe("yup");
      expect((result.getEmail as any).schema).toBeDefined();
      expect((result.getEmail as any).schema.type).toBe("string");
    });

    test("should handle Yup array schema", () => {
      const mockProcedure = {
        _def: {
          inputs: [yup.array().of(yup.string())],
          meta: {},
          type: "query",
        },
      };

      const mockRouter = {
        getItems: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("getItems");
      expect((result.getItems as any).validator).toBe("yup");
      expect((result.getItems as any).schema).toBeDefined();
      expect((result.getItems as any).schema.type).toBe("array");
    });

    test("should handle Yup boolean schema", () => {
      const mockProcedure = {
        _def: {
          inputs: [yup.boolean().default(false)],
          meta: {},
          type: "mutation",
        },
      };

      const mockRouter = {
        toggle: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("toggle");
      expect((result.toggle as any).validator).toBe("yup");
      expect((result.toggle as any).schema).toBeDefined();
      expect((result.toggle as any).schema.type).toBe("boolean");
    });
  });
});
