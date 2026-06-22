import { ArkErrors } from "arktype";

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

  // Check if this is actually a valibot error by checking path structure
  // Valibot has path elements as objects with 'key' property, arktype has strings
  const hasValibotPathStructure = valibotError.issues.some((issue) =>
    issue.path?.some((p) => typeof p === "object" && p !== null && "key" in p),
  );
  if (!hasValibotPathStructure) return null;

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

  // Arktype returns an array-like object (ArkErrors) that can be iterated
  // Each error has a path property (ReadonlyPath - array-like) and message
  let arkErrors: ArkErrors;
  if ("arkErrors" in error) {
    arkErrors = error.arkErrors as ArkErrors;
  } else if (error instanceof ArkErrors) {
    arkErrors = error;
  } else {
    return null;
  }

  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  // Iterate over the array-like error object
  for (let i = 0; i < (arkErrors.length || 0); i++) {
    const issue = arkErrors[i];
    if (!issue) continue;

    const message = issue.message || "Validation error";

    // path is a ReadonlyPath which is array-like
    if (issue.path && Array.isArray(issue.path) && issue.path.length > 0) {
      // Use full path joined with dots for nested field errors
      // Spread to convert ReadonlyPath to regular array
      const fullPath = [...issue.path].map(String).join(".");
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

  // Must have either errors or inner errors to be a valid Yup error
  const hasMainErrors = yupError.errors?.length;
  const hasInnerErrors = yupError.inner && yupError.inner.length > 0;

  if (!hasMainErrors && !hasInnerErrors) return null;

  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  // Process main error - Yup may have errors without path on the main error object
  // when abortEarly: false is used
  if (hasMainErrors) {
    if (yupError.path) {
      fieldErrors[yupError.path] = yupError.errors!;
    } else {
      // When path is undefined but errors exist, they're likely form-level errors
      // or the inner array contains the actual field errors
      formErrors.push(...yupError.errors!);
    }
  }

  // Process inner errors
  if (yupError.inner) {
    for (const innerError of yupError.inner) {
      if (innerError.path && innerError.errors?.length) {
        if (!fieldErrors[innerError.path]) {
          fieldErrors[innerError.path] = [];
        }
        fieldErrors[innerError.path]?.push(...innerError.errors);
      } else if (innerError.errors?.length) {
        // Inner error without path - add to form errors
        formErrors.push(...innerError.errors);
      }
    }
  }

  // Only return if we found actual field errors
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, formErrors };
  }

  // Return form errors if no field errors but we have form-level errors
  if (formErrors.length > 0) {
    return { fieldErrors, formErrors };
  }

  return null;
}

function normalizeSuperstructError(
  error: unknown,
): NormalizedFieldErrors | null {
  if (typeof error !== "object" || error === null) return null;
  const superstructError = error as {
    failures?: () => Iterable<{
      path?: Array<string | number>;
      message?: string;
    }>;
    message?: string;
    path?: Array<string | number>;
  };

  if (!Array.isArray(superstructError.path)) return null;

  const failures =
    typeof superstructError.failures === "function"
      ? [...superstructError.failures()]
      : [superstructError];

  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  for (const failure of failures) {
    const message = failure.message || "Validation error";
    const fullPath = failure.path?.map(String).join(".");

    if (fullPath) {
      if (!fieldErrors[fullPath]) {
        fieldErrors[fullPath] = [];
      }
      fieldErrors[fullPath].push(message);
    } else {
      formErrors.push(message);
    }
  }

  if (Object.keys(fieldErrors).length > 0 || formErrors.length > 0) {
    return { fieldErrors, formErrors };
  }

  return null;
}
