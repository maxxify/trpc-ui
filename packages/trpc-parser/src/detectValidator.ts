import type { ValidatorType } from "./types.js";

export function detectValidatorType(validator: any): ValidatorType {
  // Handle null or undefined
  if (validator == null) {
    return "unknown";
  }

  // First attempt: Check for standard schema vendor property
  try {
    if (validator["~standard"]?.vendor) {
      const vendor = validator["~standard"].vendor.toLowerCase();
      if (vendor.includes("zod")) return "zod";
      if (vendor.includes("valibot")) return "valibot";
      if (vendor.includes("arktype")) return "arktype";
      if (vendor.includes("yup")) return "yup";
    }
  } catch (_e) {
    // Ignore errors when accessing properties
  }

  // Second attempt: Use heuristics based on library-specific properties

  // Check for Zod
  // Zod schemas have specific properties like _def, safeParse, parse, and ZodType
  if (
    validator._def !== undefined &&
    typeof validator.safeParse === "function" &&
    typeof validator.parse === "function" &&
    validator instanceof Object.getPrototypeOf(validator).constructor &&
    (Object.getPrototypeOf(validator).constructor.name.includes("Zod") ||
      validator.constructor.name.includes("Zod"))
  ) {
    return "zod";
  }

  // Check for Valibot
  // Valibot validators have specific structure with _type, _schema, and _parse properties
  if (
    validator._type !== undefined &&
    (validator._schema !== undefined || validator._expected !== undefined) &&
    typeof validator._parse === "function"
  ) {
    return "valibot";
  }

  // Check for Arktype
  // Arktype types have specific properties like infer, type, as, and schema
  if (
    typeof validator.infer === "function" &&
    validator.type !== undefined &&
    typeof validator.as === "function" &&
    validator.schema !== undefined
  ) {
    return "arktype";
  }

  // Check for Superstruct
  // Superstruct schemas have type property and Struct constructor
  if (
    validator.type !== undefined &&
    typeof validator.validate === "function" &&
    validator.constructor?.name === "Struct"
  ) {
    return "superstruct";
  }

  // Check for Yup
  // Yup schemas have specific properties like _types, _nodes, and validate method
  // They also have a describe() method and are typically named Schema or specific types
  if (
    typeof validator.validate === "function" &&
    typeof validator.describe === "function" &&
    (validator._types !== undefined ||
      validator.constructor?.name === "Schema" ||
      validator.constructor?.name?.includes("Schema") ||
      validator.constructor?.name?.includes("String") ||
      validator.constructor?.name?.includes("Number") ||
      validator.constructor?.name?.includes("Boolean") ||
      validator.constructor?.name?.includes("Array") ||
      validator.constructor?.name?.includes("Object"))
  ) {
    return "yup";
  }

  // Check for Yup wrapper function (yupInput)
  if (typeof validator === "function" && validator.yupSchema !== undefined) {
    return "yup";
  }

  // Unknown validator type
  return "unknown";
}
