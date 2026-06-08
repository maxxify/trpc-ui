import { describe, expect, test } from "vitest";
import { z } from "zod/v3";
import { parseTRPCRouter } from "./parse";

describe("parseTRPCRouter with Zod v3", () => {
  describe("Zod v3 schema conversion to JSON Schema", () => {
    test("should parse a tRPC router with Zod input and convert to JSON Schema", () => {
      // Create a mock tRPC procedure structure
      const mockProcedure = {
        _def: {
          type: "mutation",
          inputs: [
            z.object({
              name: z.string().describe("User name"),
              age: z.number().min(0).describe("User age"),
            }),
          ],
          meta: {
            description: "Create a new user",
          },
        },
      };

      const mockRouter = {
        createUser: mockProcedure,
      };

      const result = parseTRPCRouter(mockRouter);

      expect(result).toHaveProperty("createUser");
      expect(result.createUser).toEqual({
        type: "mutation",
        path: ["createUser"],
        meta: {
          description: "Create a new user",
        },
        validator: "zod",
        schema: expect.objectContaining({
          type: "object",
          properties: {
            name: expect.objectContaining({
              type: "string",
              description: "User name",
            }),
            age: expect.objectContaining({
              type: "number",
              description: "User age",
            }),
          },
          required: ["name", "age"],
        }),
      });
    });

    test("should parse a nested tRPC router with Zod schemas", () => {
      const mockProcedure = {
        _def: {
          type: "query",
          inputs: [
            z.object({
              id: z.string().uuid(),
            }),
          ],
          meta: {},
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

    test("should handle procedure without inputs", () => {
      const mockProcedure = {
        _def: {
          type: "query",
          inputs: [],
          meta: {},
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

    test("should merge multiple Zod input schemas", () => {
      const mockProcedure = {
        _def: {
          type: "mutation",
          inputs: [
            z.object({
              name: z.string(),
            }),
            z.object({
              age: z.number(),
            }),
          ],
          meta: {},
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
      expect((result.updateUser as any).schema.properties).toHaveProperty(
        "name",
      );
      expect((result.updateUser as any).schema.properties).toHaveProperty(
        "age",
      );
    });
  });
});
