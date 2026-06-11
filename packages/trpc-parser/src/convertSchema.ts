import { toJsonSchema } from "@valibot/to-json-schema";
import type { Type as ArkTypeValidator } from "arktype";
import type { JSONSchema7Object } from "json-schema";
import z4, { ZodObject } from "zod/v4";
import zodToJsonSchema from "zod-to-json-schema";
import { ValidatorType } from "./types";

export const convertSchema = (validator: ValidatorType, def: any): any => {
  switch (validator) {
    case "zod":
      return convertZodSchema(def);
    case "valibot":
      return convertValibotSchema(def);
    case "arktype":
      return convertArktypeSchema(def);
    case "unknown":
      return convertUnknownSchema(def);
    case "mixed":
      return convertMixedSchema(def);
    default:
      return undefined;
  }
};

function convertZodSchema(schema: Array<any>): any {
  console.assert(schema !== undefined, "schema is undefined");
  console.assert(Array.isArray(schema), "schema is not an array");

  try {
    let mergedSchema = schema[0] as ZodObject;
    console.assert(mergedSchema !== undefined, "mergedSchema is undefined");
    console.assert(
      mergedSchema.shape !== undefined,
      "mergedSchema.shape is undefined",
    );

    for (let i = 1; i < schema.length; i++) {
      if (typeof mergedSchema.extend === "function") {
        mergedSchema = mergedSchema.extend(schema[i].shape);
      }
    }

    if ("_zod" in mergedSchema) {
      return z4.toJSONSchema(mergedSchema, {
        target: "draft-7",
        unrepresentable: "any",
      });
    } else {
      return zodToJsonSchema(mergedSchema);
    }
  } catch (error) {
    // If merging or conversion fails, leave jsonSchema as undefined
    console.error("Error generating JSON Schema:", error);
  }
}

function convertValibotSchema(schema: Array<any>): any {
  console.assert(schema !== undefined, "schema is undefined");
  console.assert(Array.isArray(schema), "schema is not an array");

  try {
    // For single schema, convert directly without intersect
    if (schema.length === 1) {
      const result = toJsonSchema(schema[0]);
      return result ?? {};
    }
    // For multiple schemas, merge properties into a single object (like Zod)
    const mergedSchema = mergeValibotSchemas(schema);
    return mergedSchema;
  } catch (error) {
    console.error("Error generating JSON Schema:", error);
    return {};
  }
}

function mergeValibotSchemas(schemas: Array<any>): any {
  // Convert each schema and merge properties
  const mergedProperties: Record<string, any> = {};
  const mergedRequired: string[] = [];

  for (const schema of schemas) {
    const converted = toJsonSchema(schema);
    if (converted?.properties) {
      Object.assign(mergedProperties, converted.properties);
    }
    if (converted?.required) {
      mergedRequired.push(...converted.required);
    }
  }

  return {
    properties: mergedProperties,
    required: mergedRequired,
    type: "object",
  };
}

function convertArktypeSchema(schema: Array<any>): any {
  console.assert(schema !== undefined, "schema is undefined");
  console.assert(Array.isArray(schema), "schema is not an array");

  try {
    return arkToJson(schema);
  } catch (error) {
    console.error("Error generating JSON Schema:", error);
    return {};
  }
}

function arkToJson(inputs: ArkTypeValidator[]): JSONSchema7Object {
  if (inputs.length === 1) {
    const schema = inputs[0]?.toJsonSchema() as JSONSchema7Object;
    return schema ?? {};
  }
  if (inputs.length > 1) {
    const [first, ...rest] = inputs;
    if (!first) {
      return {} as any;
    }
    return arkRecursive(first, rest);
  }
  return {};
}

function arkRecursive(
  base: ArkTypeValidator,
  rest: ArkTypeValidator[],
): JSONSchema7Object {
  if (rest.length === 0) {
    return (base.toJsonSchema() as JSONSchema7Object) ?? {};
  }
  const [first, ...left] = rest;
  if (first === undefined) {
    return (base.toJsonSchema() as JSONSchema7Object) ?? {};
  }
  return arkRecursive(base.and(first), left);
}

function convertUnknownSchema(schema: Array<any>): any {
  console.assert(schema !== undefined, "schema is undefined");
  console.assert(Array.isArray(schema), "schema is not an array");

  return {};
}

function convertMixedSchema(schema: Array<any>): any {
  console.assert(schema !== undefined, "schema is undefined");
  console.assert(Array.isArray(schema), "schema is not an array");

  return {};
}
