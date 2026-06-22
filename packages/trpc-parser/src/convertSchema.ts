import { convertSchema as yupToJsonSchema } from "@sodaru/yup-to-json-schema";
import { toJsonSchema } from "@valibot/to-json-schema";
import type { Type as ArkTypeValidator } from "arktype";
import type { JSONSchema7Object } from "json-schema";
import z4, { ZodObject } from "zod/v4";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ValidatorType } from "./types.js";

export const convertSchema = (validator: ValidatorType, def: any): any => {
  switch (validator) {
    case "zod":
      return convertZodSchema(def);
    case "valibot":
      return convertValibotSchema(def);
    case "arktype":
      return convertArktypeSchema(def);
    case "yup":
      return convertYupSchema(def);
    case "superstruct":
      return convertSuperstructSchema(def);
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

function convertYupSchema(schema: Array<any>): any {
  console.assert(schema !== undefined, "schema is undefined");
  console.assert(Array.isArray(schema), "schema is not an array");

  try {
    // For single schema, convert directly
    // Handle yupInput wrapper function
    const firstSchema = schema[0]?.yupSchema ?? schema[0];
    if (schema.length === 1) {
      const result = yupToJsonSchema(firstSchema);
      return result ?? {};
    }
    // For multiple schemas, merge properties into a single object (like Zod)
    const mergedSchema = mergeYupSchemas(schema);
    return mergedSchema;
  } catch (error) {
    console.error("Error generating JSON Schema:", error);
    return {};
  }
}

function mergeYupSchemas(schemas: Array<any>): any {
  // Convert each schema and merge properties
  const mergedProperties: Record<string, any> = {};
  const mergedRequired: string[] = [];

  for (const s of schemas) {
    // Handle yupInput wrapper function
    const schema = s?.yupSchema ?? s;
    const converted = yupToJsonSchema(schema);
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

function convertSuperstructSchema(schema: Array<any>): any {
  console.assert(schema !== undefined, "schema is undefined");
  console.assert(Array.isArray(schema), "schema is not an array");

  try {
    // For single schema, convert directly
    if (schema.length === 1) {
      const result = superstructToJson(schema[0]);
      return result ?? {};
    }
    // For multiple schemas, merge properties into a single object (like Zod)
    const mergedSchema = mergeSuperstructSchemas(schema);
    return mergedSchema;
  } catch (error) {
    console.error("Error generating JSON Schema:", error);
    return {};
  }
}

function superstructToJson(struct: any): JSONSchema7Object {
  if (!struct || typeof struct !== "object") {
    return {};
  }

  const type = struct.type;
  switch (type) {
    case "object":
    case "type":
      return convertSuperstructObject(struct);
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "array":
      return {
        ...(struct.schema ? { items: superstructToJson(struct.schema) } : {}),
        type: "array",
      };
    case "literal":
      return {
        enum: [struct.schema],
        type: typeof struct.schema,
      };
    case "enums": {
      const values = Object.values(struct.schema ?? {}) as Array<
        string | number
      >;
      const enumType = values.every((value) => typeof value === "number")
        ? "number"
        : "string";
      return { enum: values, type: enumType };
    }
    case "union":
      // Superstruct v1 stored union members on `schema`; v2 keeps them in a
      // closure and exposes `schema: null`, so we can only convert v1-style unions.
      if (struct.schema && Array.isArray(struct.schema)) {
        return { oneOf: struct.schema.map((s: any) => superstructToJson(s)) };
      }
      return {};
    default:
      return {};
  }
}

function convertSuperstructObject(struct: any): JSONSchema7Object {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  if (struct.schema) {
    for (const [key, value] of Object.entries(struct.schema)) {
      properties[key] = superstructToJson(value);
      if (!isSuperstructOptional(value)) {
        required.push(key);
      }
    }
  }

  return {
    properties,
    required: required.length > 0 ? required : [],
    type: "object",
  };
}

function isSuperstructOptional(struct: any): boolean {
  try {
    return typeof struct?.is === "function" && struct.is(undefined);
  } catch (_error) {
    return false;
  }
}

function mergeSuperstructSchemas(schemas: Array<any>): any {
  const mergedProperties: Record<string, any> = {};
  const mergedRequired: string[] = [];

  for (const s of schemas) {
    const converted = superstructToJson(s);
    if (converted?.properties) {
      Object.assign(mergedProperties, converted.properties);
    }
    if (converted?.required && Array.isArray(converted.required)) {
      for (const req of converted.required) {
        if (typeof req === "string") {
          mergedRequired.push(req);
        }
      }
    }
  }

  return {
    properties: mergedProperties,
    required: mergedRequired,
    type: "object",
  };
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
