import * as yup from "yup";

/**
 * Yup wrapper that automatically validates with abortEarly: false
 * to capture all validation errors at once.
 *
 * The wrapper function stores the Yup schema on itself for parser detection.
 *
 * Usage:
 *   const schema = yup.object({
 *     name: yup.string().required(),
 *     email: yup.string().email().required(),
 *   });
 *
 *   t.procedure.input(yupInput(schema)).mutation(({ input }) => { ... })
 */
export function yupInput<T extends yup.AnySchema>(
  schema: T,
): (input: unknown) => Promise<yup.InferType<T>> & { yupSchema?: T } {
  const validateFn = async (input: unknown): Promise<yup.InferType<T>> => {
    return await schema.validate(input, { abortEarly: false });
  };
  // Store the schema on the function for parser detection
  (validateFn as any).yupSchema = schema;
  return validateFn as (
    input: unknown,
  ) => Promise<yup.InferType<T>> & { yupSchema?: T };
}
