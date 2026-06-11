import { SuperJSON } from "superjson";
import type { Procedure } from "trpc-parser";

interface DataTransformer {
  serialize(object: any): any;
  deserialize(object: any): any;
}

interface FetchWrapperOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
  transformer?: "superjson" | undefined;
}

interface ProcedureCallOptions {
  input?: any;
  signal?: AbortSignal;
}

export function createProcedureFetcher(options: FetchWrapperOptions) {
  const {
    baseUrl,
    headers = {},
    fetch: customFetch = globalThis.fetch,
    transformer,
  } = options;

  const serializer: DataTransformer | undefined =
    transformer === "superjson" ? SuperJSON : undefined;

  return async function callProcedure(
    procedure: Procedure,
    callOptions: ProcedureCallOptions = {},
  ) {
    const { input, signal } = callOptions;

    // Build the procedure path from the path array
    const dotPath = procedure.path.join(".");
    const baseUrlClean = baseUrl.replace(/\/$/, "");

    // Determine HTTP method based on procedure type
    const method = procedure.type === "query" ? "GET" : "POST";

    // Prepare request options
    const requestOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      method,
      signal,
    };

    let url = `${baseUrlClean}/${dotPath}`;
    const queryParts: string[] = [];

    // Handle input serialization based on procedure type
    if (input !== undefined) {
      // Apply transformer if available
      const serializedInput = serializer?.serialize(input) ?? input;

      if (procedure.type === "query") {
        // For queries, add input as URL parameter (no batch for single requests)
        queryParts.push(
          `input=${encodeURIComponent(JSON.stringify(serializedInput))}`,
        );
      } else {
        // For mutations, add input as request body
        requestOptions.body = JSON.stringify(serializedInput);
      }
    }

    // Construct final URL with query parameters
    if (queryParts.length > 0) {
      url += `?${queryParts.join("&")}`;
    }

    console.log("🔍 Request Debug:");
    console.log("URL:", url);
    console.log("Method:", method);
    console.log("Body:", requestOptions.body);
    console.log("Input:", input);
    console.log("Serialized Input:", serializer?.serialize(input) ?? input);

    // Make the request
    const response = await customFetch(url, requestOptions);

    const json = await response.json();

    // Handle tRPC response format (tRPC returns HTTP 400 for validation errors)
    if ("error" in json) {
      const error = json.error;
      const errorMessage =
        error.json?.message ?? error.message ?? "Unknown error";
      throw new Error(`tRPC Error: ${errorMessage}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response Error:", errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Apply transformer to deserialize response if available
    const resultData = json.result?.data;
    if (serializer && resultData !== undefined) {
      return serializer.deserialize(resultData);
    }

    return resultData;
  };
}
