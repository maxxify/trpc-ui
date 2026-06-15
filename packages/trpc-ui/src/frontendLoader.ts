import * as bundled from "trpc-react/react-app";

export function loadFrontend(): {
  js: string;
  css: string;
  html: string;
} {
  if (bundled.getBundledFrontend) {
    return bundled.getBundledFrontend();
  }
  throw new Error("No bundled frontend found");
}
