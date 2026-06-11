import type { AnyTRPCRouter } from "@trpc/server";
import { parseTRPCRouter } from "trpc-parser";
import { loadFrontend } from "./frontendLoader";
import { type TrpcPanelExtraOptions } from "./parse/parseRouter";

export type Info = {
  title?: string;
  description?: string;
};

export type RenderOptions = {
  url: string;
  cache?: boolean;
  meta?: Info;
} & TrpcPanelExtraOptions;

// const defaultParseRouterOptions: Partial<TrpcPanelExtraOptions> = {
//   logFailedProcedureParse: true,
//   transformer: "superjson",
// };

const javascriptReplaceSymbol = "<!--{{js}}-->";
const cssReplaceSymbol = "<!--{{css}}-->";
const routerReplaceSymbol = '"{{parsed_router}}"';
const optionsReplaceSymbol = '"{{options}}"';

type InjectionParam = {
  searchFor: string;
  injectString: string;
};

function injectParams(string: string, injectionParams: InjectionParam[]) {
  let r = string;
  for (const param of injectionParams) {
    r = injectInString(param.searchFor, r, param.injectString);
  }
  return r;
}

function injectInString(
  searchFor: string,
  string: string,
  injectString: string,
) {
  const startIndex = string.indexOf(searchFor);
  return (
    string.slice(0, startIndex) +
    injectString +
    string.slice(startIndex + searchFor.length)
  );
}

// renders value should never change unless the server is restarted, just parse and inject once
const cache: {
  val: string | null;
} = {
  val: null,
};

// TODO: changing this from AnyTRPCRouter to a generic type would probably improve type safety
export async function renderTrpcPanel(
  router: AnyTRPCRouter,
  options: RenderOptions,
) {
  if (options.cache === true && cache.val) return cache.val;

  const bundleInjectionParams: InjectionParam[] = [
    {
      injectString: JSON.stringify(parseTRPCRouter(router)),
      searchFor: routerReplaceSymbol,
    },
    {
      injectString: JSON.stringify(options),
      searchFor: optionsReplaceSymbol,
    },
  ];

  // if we do not receive the frontend bundle, try to load it from disk
  const loadedFrontend = loadFrontend();
  if (loadedFrontend === undefined) {
    throw new Error("Failed to load frontend react bundle");
  }

  const bundleInjected = injectParams(loadedFrontend.js, bundleInjectionParams);
  const script = `<script>${bundleInjected}</script>`;
  const css = `<style>${loadedFrontend.css}</style>`;
  const htmlReplaceParams: InjectionParam[] = [
    {
      injectString: script,
      searchFor: javascriptReplaceSymbol,
    },
    {
      injectString: css,
      searchFor: cssReplaceSymbol,
    },
  ];
  cache.val = injectParams(loadedFrontend.html, htmlReplaceParams);
  return cache.val;
}
