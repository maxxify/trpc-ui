import { renderTrpcPanel } from "@maxxify/trpc-ui";
import * as trpcExpress from "@trpc/server/adapters/express";
import connectLiveReload from "connect-livereload";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import { testRouterArktype } from "./router.arktype.js";
import { testRouter } from "./router.js";
import { testRouterSuperstruct } from "./router.superstruct.js";
import { testRouterValibot } from "./router.valibot.js";
import { testRouterYup } from "./router.yup.js";

dotenv.config();

const serverUrl = process.env.SERVER_URL || "http://localhost";
const port = Number(process.env.PORT) || 4000;

console.log("Starting server with environment variables:");
console.log(process.env);

// to marginally improve local development experience
const liveReload = process.env.LIVE_RELOAD === "true";
const simulateDelay = process.env.SIMULATE_DELAY === "true";

if (!serverUrl) throw new Error("No SERVER_URL passed.");

async function createContext(opts: trpcExpress.CreateExpressContextOptions) {
  const authHeader = opts.req.headers.authorization;
  return {
    authorized: !!authHeader,
  };
}

const expressApp = express();
expressApp.use(cors({ origin: "*" }));

if (liveReload) {
  expressApp.use(connectLiveReload());
}

if (simulateDelay) {
  console.log("Simulating delay...");
  expressApp.use((_req, _res, next) => {
    setTimeout(() => {
      next();
      console.log("Next in timeout");
    }, 1000);
  });
}

expressApp.use(morgan("short", {}));
expressApp.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    createContext,
    router: testRouter,
  }),
);

// Valibot router endpoint
expressApp.use(
  "/trpc-valibot",
  trpcExpress.createExpressMiddleware({
    createContext,
    router: testRouterValibot,
  }),
);

// Arktype router endpoint
expressApp.use(
  "/trpc-arktype",
  trpcExpress.createExpressMiddleware({
    createContext,
    router: testRouterArktype,
  }),
);

// Superstruct router endpoint
expressApp.use(
  "/trpc-superstruct",
  trpcExpress.createExpressMiddleware({
    createContext,
    router: testRouterSuperstruct,
  }),
);

// Yup router endpoint
expressApp.use(
  "/trpc-yup",
  trpcExpress.createExpressMiddleware({
    createContext,
    router: testRouterYup,
  }),
);

console.log("Starting at url ");
console.log(`${serverUrl}${port ? `:${port}` : ""}`);

// Zod endpoint
expressApp.get("/", (_req, res) => {
  renderTrpcPanel(testRouter, {
    meta: {
      description:
        "A panel like this will be automatically generated when you add trpc-ui to your project. This main description, and procedure descriptions support markdown.\n\nIf you prefer to input raw JSON instead of using the auto generated forms, click the {} bracket icon to toggle json mode.\n\n[Repo](https://github.com/maxxify/trpc-ui) [NPM](https://www.npmjs.com/package/@maxxify/trpc-ui)\n\nValidators:\n\n[Zod](/) [Valibot](/valibot) [Arktype](/arktype) [Superstruct](/superstruct) [Yup](/yup)",
      title: "Demo tRPC Panel (Zod)",
    },
    transformer: "superjson",
    url: `${serverUrl}${
      process.env.NODE_ENV === "production" ? "" : `:${port}`
    }/trpc`,
  }).then((data) => res.send(data));
});

// Valibot endpoint
expressApp.get("/valibot", (_req, res) => {
  renderTrpcPanel(testRouterValibot, {
    meta: {
      description:
        "A panel like this will be automatically generated when you add trpc-ui to your project. This main description, and procedure descriptions support markdown.\n\nIf you prefer to input raw JSON instead of using the auto generated forms, click the {} bracket icon to toggle json mode.\n\n[Repo](https://github.com/maxxify/trpc-ui) [NPM](https://www.npmjs.com/package/@maxxify/trpc-ui)\n\nValidators:\n\n[Zod](/) [Valibot](/valibot) [Arktype](/arktype) [Superstruct](/superstruct) [Yup](/yup)",
      title: "Demo tRPC Panel (Valibot)",
    },
    transformer: "superjson",
    url: `${serverUrl}${
      process.env.NODE_ENV === "production" ? "" : `:${port}`
    }/trpc-valibot`,
  }).then((data) => res.send(data));
});

// Arktype endpoint
expressApp.get("/arktype", (_req, res) => {
  renderTrpcPanel(testRouterArktype, {
    meta: {
      description:
        "A panel like this will be automatically generated when you add trpc-ui to your project. This main description, and procedure descriptions support markdown.\n\nIf you prefer to input raw JSON instead of using the auto generated forms, click the {} bracket icon to toggle json mode.\n\n[Repo](https://github.com/maxxify/trpc-ui) [NPM](https://www.npmjs.com/package/@maxxify/trpc-ui)\n\nValidators:\n\n[Zod](/) [Valibot](/valibot) [Arktype](/arktype) [Superstruct](/superstruct) [Yup](/yup)",
      title: "Demo tRPC Panel (Arktype)",
    },
    transformer: "superjson",
    url: `${serverUrl}${
      process.env.NODE_ENV === "production" ? "" : `:${port}`
    }/trpc-arktype`,
  }).then((data) => res.send(data));
});

// Superstruct endpoint
expressApp.get("/superstruct", (_req, res) => {
  renderTrpcPanel(testRouterSuperstruct, {
    meta: {
      description:
        "A panel like this will be automatically generated when you add trpc-ui to your project. This main description, and procedure descriptions support markdown.\n\nIf you prefer to input raw JSON instead of using the auto generated forms, click the {} bracket icon to toggle json mode.\n\n[Repo](https://github.com/maxxify/trpc-ui) [NPM](https://www.npmjs.com/package/@maxxify/trpc-ui)\n\nValidators:\n\n[Zod](/) [Valibot](/valibot) [Arktype](/arktype) [Superstruct](/superstruct) [Yup](/yup)",
      title: "Demo tRPC Panel (Superstruct)",
    },
    transformer: "superjson",
    url: `${serverUrl}${
      process.env.NODE_ENV === "production" ? "" : `:${port}`
    }/trpc-superstruct`,
  }).then((data) => res.send(data));
});

// Yup endpoint
expressApp.get("/yup", (_req, res) => {
  renderTrpcPanel(testRouterYup, {
    meta: {
      description:
        "A panel like this will be automatically generated when you add trpc-ui to your project. This main description, and procedure descriptions support markdown.\n\nIf you prefer to input raw JSON instead of using the auto generated forms, click the {} bracket icon to toggle json mode.\n\n[Repo](https://github.com/maxxify/trpc-ui) [NPM](https://www.npmjs.com/package/@maxxify/trpc-ui)\n\nValidators:\n\n[Zod](/) [Valibot](/valibot) [Arktype](/arktype) [Superstruct](/superstruct) [Yup](/yup)",
      title: "Demo tRPC Panel (Yup)",
    },
    transformer: "superjson",
    url: `${serverUrl}${
      process.env.NODE_ENV === "production" ? "" : `:${port}`
    }/trpc-yup`,
  }).then((data) => res.send(data));
});

expressApp.listen(port);
