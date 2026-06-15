import * as v from "valibot";
import { describe, expect, test } from "vitest";
import { z } from "zod";
import { parseTRPCRouter } from "./parse.js";

describe("parseTRPCRouter schema comparison", () => {
  describe("Zod vs Valibot schema equivalence", () => {
    test("should produce equivalent JSON schemas for Zod and Valibot with same structure", () => {
      // Define equivalent schemas for Zod and Valibot
      const zodSchema = z.object({
        age: z.number(),
        email: z.string().email(),
        name: z.string(),
      });

      const valibotSchema = v.object({
        age: v.number(),
        email: v.string(),
        name: v.string(),
      });

      // Create mock procedures with the same structure
      const zodProcedure = {
        _def: {
          inputs: [zodSchema],
          meta: {},
          type: "query",
        },
      };

      const valibotProcedure = {
        _def: {
          inputs: [valibotSchema],
          meta: {},
          type: "query",
        },
      };

      const zodRouter = {
        getUser: zodProcedure,
      };

      const valibotRouter = {
        getUser: valibotProcedure,
      };

      const zodResult = parseTRPCRouter(zodRouter);
      const valibotResult = parseTRPCRouter(valibotRouter);

      // Both should be detected correctly
      expect((zodResult.getUser as any).validator).toBe("zod");
      expect((valibotResult.getUser as any).validator).toBe("valibot");

      // Both should have schemas defined
      expect((zodResult.getUser as any).schema).toBeDefined();
      expect((valibotResult.getUser as any).schema).toBeDefined();

      // Both should have the same structure (type: object, same properties)
      expect((zodResult.getUser as any).schema.type).toBe("object");
      expect((valibotResult.getUser as any).schema.type).toBe("object");

      // Both should have the same required properties
      const zodRequired = (zodResult.getUser as any).schema.required;
      const valibotRequired = (valibotResult.getUser as any).schema.required;
      expect(zodRequired.sort()).toEqual(valibotRequired.sort());

      // Both should have the same property names
      const zodProps = Object.keys(
        (zodResult.getUser as any).schema.properties,
      );
      const valibotProps = Object.keys(
        (valibotResult.getUser as any).schema.properties,
      );
      expect(zodProps.sort()).toEqual(valibotProps.sort());
    });

    test("should produce equivalent JSON schemas for merged Zod and Valibot inputs", () => {
      // Define equivalent merged schemas for Zod and Valibot
      const zodSchema1 = z.object({
        name: z.string(),
      });

      const zodSchema2 = z.object({
        age: z.number(),
      });

      const valibotSchema1 = v.object({
        name: v.string(),
      });

      const valibotSchema2 = v.object({
        age: v.number(),
      });

      // Create mock procedures with merged inputs
      const zodProcedure = {
        _def: {
          inputs: [zodSchema1, zodSchema2],
          meta: {},
          type: "mutation",
        },
      };

      const valibotProcedure = {
        _def: {
          inputs: [valibotSchema1, valibotSchema2],
          meta: {},
          type: "mutation",
        },
      };

      const zodRouter = {
        updateUser: zodProcedure,
      };

      const valibotRouter = {
        updateUser: valibotProcedure,
      };

      const zodResult = parseTRPCRouter(zodRouter);
      const valibotResult = parseTRPCRouter(valibotRouter);

      // Both should be detected correctly
      expect((zodResult.updateUser as any).validator).toBe("zod");
      expect((valibotResult.updateUser as any).validator).toBe("valibot");

      // Both should have schemas defined
      expect((zodResult.updateUser as any).schema).toBeDefined();
      expect((valibotResult.updateUser as any).schema).toBeDefined();

      // Both should now have consistent structure: type: object with combined properties
      expect((zodResult.updateUser as any).schema.type).toBe("object");
      expect((valibotResult.updateUser as any).schema.type).toBe("object");

      // Both should have the same property names
      const zodProps = Object.keys(
        (zodResult.updateUser as any).schema.properties,
      );
      const valibotProps = Object.keys(
        (valibotResult.updateUser as any).schema.properties,
      );
      expect(zodProps.sort()).toEqual(valibotProps.sort());

      // Both should have the same required properties
      const zodRequired = (zodResult.updateUser as any).schema.required;
      const valibotRequired = (valibotResult.updateUser as any).schema.required;
      expect(zodRequired.sort()).toEqual(valibotRequired.sort());
    });
  });
});
