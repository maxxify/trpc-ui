import { convertSchema } from "./convertSchema.js";
import { detectValidatorType } from "./detectValidator.js";
import type { ParsedTRPCRouter, Router } from "./types.js";
import { ValidatorType } from "./types.js";

export type TrpcPanelExtraOptions = {
  logFailedProcedureParse?: boolean;
  transformer?: "superjson";
};

export function parseRootRouter(router: any): Router {
  return parseTRPCRouter(router, []) as unknown as Router;
}

/**
 * Recursively parses a tRPC router structure and its sub-routers
 *
 * @param router - The router or procedure to parse
 * @param currentPath - The current path in the router hierarchy
 * @param detectValidatorFn - Function to detect the type of validator
 * @param zodToJsonSchemaFn - Function to convert Zod schema to JSON Schema (optional)
 * @returns A structured representation of the router hierarchy
 */
export function parseTRPCRouter(
  router: any,
  currentPath: string[] = [],
): ParsedTRPCRouter {
  // The result object we'll build up
  const result: Record<string, any> = {};

  // Iterate over each key in the router
  for (const key in router) {
    const item = router[key];

    // Skip all internal properties (starting with _)
    if (key.startsWith("_")) {
      continue;
    }

    // Create the path for this node
    const nodePath = [...currentPath, key];

    // Check if it's a procedure (query or mutation)
    if (item?._def?.type) {
      const meta = item._def.meta || {};

      // Determine validator type
      let validatorType: ValidatorType = "unknown";
      let jsonSchema: any;

      // Check if inputs array exists and has elements
      if (
        item._def.inputs &&
        Array.isArray(item._def.inputs) &&
        item._def.inputs.length > 0
      ) {
        // Get validator type of first input
        const firstType = detectValidatorType(item._def.inputs[0]);

        // Check if all inputs are of the same type
        const allSameType = item._def.inputs.every(
          (input: any) => detectValidatorType(input) === firstType,
        );

        validatorType = allSameType ? firstType : "mixed";

        // Generate JSON Schema
        try {
          jsonSchema = convertSchema(validatorType, item._def.inputs);
        } catch (error) {
          // If merging or conversion fails, leave jsonSchema as undefined
          console.error("Error generating JSON Schema:", error);
        }
      }

      if (item._def.type === "query") {
        result[key] = {
          meta,
          path: nodePath,
          schema: jsonSchema,
          type: "query",
          validator: validatorType,
        };
      } else if (item._def.type === "mutation") {
        result[key] = {
          meta,
          path: nodePath,
          schema: jsonSchema,
          type: "mutation",
          validator: validatorType,
        };
      }
    }
    // Check if it's a router (contains other procedures or routers)
    else if (item && typeof item === "object" && !Array.isArray(item)) {
      // Recursively parse potential router
      const children = parseTRPCRouter(item, nodePath);

      // Only add it as a router if it has children
      if (Object.keys(children).length > 0) {
        result[key] = {
          children,
          path: nodePath,
          type: "router",
        };
      }
    }
  }

  return result;
}
