import type { TRPCPanelMeta } from "@maxxify/trpc-ui";
import { initTRPC } from "@trpc/server";
import { createNextApiHandler } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { normalizeValidationErrors } from "trpc-parser";

import { appRouterSuperjson } from "~/router-superjson";
import { createTRPCContext } from "~/server/api/trpc";

// Create a separate tRPC instance with superjson transformer
const tSuperjson = initTRPC
  .context<typeof createTRPCContext>()
  .meta<TRPCPanelMeta>()
  .create({
    allowOutsideOfServer: true,
    errorFormatter({ shape, error }) {
      // Try to normalize validation errors for all validator types
      const normalizedErrors = normalizeValidationErrors(error.cause);
      return {
        ...shape,
        data: {
          ...shape.data,
          fieldErrors: normalizedErrors,
        },
      };
    },
    transformer: superjson,
  });

// Create middleware with logging
const loggingMiddleware = tSuperjson.middleware(
  async ({ next, path, type, getRawInput }) => {
    const rawInput = await getRawInput();
    console.log(`=
 [SUPERJSON ${type.toUpperCase()}] ${path}`);
    console.log("Raw Input:", rawInput);
    console.log("Input type:", typeof rawInput);
    console.log("Input JSON:", JSON.stringify(rawInput, null, 2));
    return next();
  },
);

// Create procedure with superjson-enabled tRPC instance
const _procedureSuperjson = tSuperjson.procedure.use(loggingMiddleware);

// Export API handler
export default createNextApiHandler({
  createContext: createTRPCContext,
  onError:
    process.env.NODE_ENV === "development"
      ? ({ path, error }) => {
          console.error(
            `L tRPC (superjson) failed on ${path ?? "<no-path>"}: ${error.message}`,
          );
        }
      : undefined,
  router: appRouterSuperjson,
});
