/**
 * Normalized error format for field-level validation errors.
 * This format is consistent across all validator types and can be used by the frontend.
 */
export interface NormalizedFieldErrors {
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
}

/**
 * Normalizes validation errors from different validator libraries into a consistent format.
 * This format matches Zod's flatten() output for consistency.
 */
export function normalizeValidationErrors(
  error: unknown,
): NormalizedFieldErrors | null {
  if (!error) return null;

  // Try each validator type in order of specificity
  // Zod has a flatten method - most distinctive
  const zodResult = normalizeZodError(error);
  if (zodResult) return zodResult;

  // Valibot has issues with path[].key structure
  const valibotResult = normalizeValibotError(error);
  if (valibotResult) return valibotResult;

  // Arktype has problems with path[] string structure
  const arktypeResult = normalizeArktypeError(error);
  if (arktypeResult) return arktypeResult;

  // Yup has errors array and path string
  const yupResult = normalizeYupError(error);
  if (yupResult) return yupResult;

  // Superstruct has path[] and type
  const superstructResult = normalizeSuperstructError(error);
  if (superstructResult) return superstructResult;

  return null;
}

function normalizeZodError(error: unknown): NormalizedFieldErrors | null {
  if (typeof error !== "object" || error === null) return null;
  const zodError = error as {
    flatten?: () => NormalizedFieldErrors;
    issues: Array<{ path: Array<string | number>; message: string }>;
  };
  if (typeof zodError.flatten === "function") {
    const fieldErrors: Record<string, string[]> = {};
    const formErrors: string[] = [];

    for (const issue of zodError.issues) {
      const message = issue.message;

      if (issue.path.length === 0) {
        // No path - this is a form-level error
        formErrors.push(message);
      } else {
        // Use full path joined with dots for nested field errors
        const fullPath = issue.path.map(String).join(".");
        if (!fieldErrors[fullPath]) {
          fieldErrors[fullPath] = [];
        }
        fieldErrors[fullPath].push(message);
      }
    }

    return { fieldErrors, formErrors };
  }
  return null;
}

function normalizeValibotError(error: unknown): NormalizedFieldErrors | null {
  if (typeof error !== "object" || error === null) return null;
  const valibotError = error as {
    issues?: Array<{ path?: Array<{ key?: string }>; message?: string }>;
  };

  if (!valibotError.issues) return null;

  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  for (const issue of valibotError.issues) {
    const message = issue.message || "Validation error";

    if (issue.path && issue.path.length > 0) {
      // Use full path joined with dots for nested field errors
      const fullPath = issue.path
        .map((p) => p.key)
        .filter(Boolean)
        .join(".");
      if (fullPath) {
        if (!fieldErrors[fullPath]) {
          fieldErrors[fullPath] = [];
        }
        fieldErrors[fullPath].push(message);
      } else {
        formErrors.push(message);
      }
    } else {
      formErrors.push(message);
    }
  }

  return { fieldErrors, formErrors };
}

function normalizeArktypeError(error: unknown): NormalizedFieldErrors | null {
  if (typeof error !== "object" || error === null) return null;
  const arktypeError = error as {
    problems?: Array<{ path?: string[]; message?: string }>;
  };

  if (!arktypeError.problems) return null;

  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  for (const problem of arktypeError.problems) {
    const message = problem.message || "Validation error";

    if (problem.path && problem.path.length > 0) {
      // Use full path joined with dots for nested field errors
      const fullPath = problem.path.join(".");
      if (fullPath) {
        if (!fieldErrors[fullPath]) {
          fieldErrors[fullPath] = [];
        }
        fieldErrors[fullPath].push(message);
      } else {
        formErrors.push(message);
      }
    } else {
      formErrors.push(message);
    }
  }

  return { fieldErrors, formErrors };
}

function normalizeYupError(error: unknown): NormalizedFieldErrors | null {
  if (typeof error !== "object" || error === null) return null;
  const yupError = error as {
    errors?: string[];
    path?: string;
    inner?: Array<{ errors?: string[]; path?: string }>;
  };

  // Must have either path+errors or inner errors to be a valid Yup error
  const hasMainError = yupError.path && yupError.errors?.length;
  const hasInnerErrors = yupError.inner && yupError.inner.length > 0;

  if (!hasMainError && !hasInnerErrors) return null;

  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  // Process main error
  if (hasMainError) {
    fieldErrors[yupError.path!] = yupError.errors!;
  }

  // Process inner errors
  if (yupError.inner) {
    for (const innerError of yupError.inner) {
      if (innerError.path && innerError.errors?.length) {
        if (!fieldErrors[innerError.path]) {
          fieldErrors[innerError.path] = [];
        }
        fieldErrors[innerError.path]?.push(...innerError.errors);
      }
    }
  }

  // Only return if we found actual field errors
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, formErrors };
  }

  return null;
}

function normalizeSuperstructError(
  error: unknown,
): NormalizedFieldErrors | null {
  if (typeof error !== "object" || error === null) return null;
  const superstructError = error as {
    path?: string[];
    type?: string;
    value?: unknown;
  };

  // Must have path array with at least one element to be a valid Superstruct error
  if (!superstructError.path || !Array.isArray(superstructError.path))
    return null;
  if (superstructError.path.length === 0) return null;

  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  // Use full path joined with dots for nested field errors
  const fullPath = superstructError.path.join(".");
  const message = superstructError.type
    ? `${superstructError.type} validation failed`
    : "Validation error";

  if (fullPath) {
    fieldErrors[fullPath] = [message];
  } else {
    formErrors.push(message);
  }

  // Only return if we have actual field errors
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, formErrors };
  }

  return null;
}
