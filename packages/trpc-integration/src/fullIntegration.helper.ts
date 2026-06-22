import { createServer } from "node:http";
import * as trpcExpress from "@trpc/server/adapters/express";
import express from "express";
import { NormalizedFieldErrors } from "trpc-parser";

// Helper to make tRPC request and extract error data
export async function callProcedure(
  router: any,
  procedurePath: string,
  input: unknown,
  method: "GET" | "POST" = "POST",
): Promise<{
  status: number;
  data?: unknown;
  error?: {
    message: string;
    data?: { fieldErrors?: NormalizedFieldErrors; httpStatus: number };
  };
}> {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());
    app.use(
      "/trpc",
      trpcExpress.createExpressMiddleware({
        createContext: () => ({}),
        router,
      }),
    );

    const server = createServer(app);
    server.listen(0, async () => {
      const address = server.address() as { port: number };

      let url: string;
      let body: string | undefined;

      if (method === "GET") {
        // For GET requests, send input as query parameter
        url = `http://localhost:${address.port}/trpc/${procedurePath}?input=${encodeURIComponent(
          JSON.stringify(input),
        )}`;
      } else {
        url = `http://localhost:${address.port}/trpc/${procedurePath}`;
        body = JSON.stringify(input);
      }

      try {
        const res = await fetch(url, {
          body: body,
          headers: { "Content-Type": "application/json" },
          method,
        });
        const responseBody = await res.json();
        resolve({
          data: responseBody.result?.data,
          error: responseBody.error
            ? {
                data: responseBody.error.data,
                message: responseBody.error.message,
              }
            : undefined,
          status: res.status,
        });
      } catch (err) {
        resolve({ error: { message: String(err) }, status: 500 });
      }
      server.close();
    });
  });
}
