import * as bundled from "trpc-react/react-app";

export function loadFrontend():
  | {
      js: string;
      css: string;
      html: string;
    }
  | undefined {
  // Try to import the bundled module first (works in edge runtimes without node:fs)
  try {
    if (bundled.getBundledFrontend) {
      return bundled.getBundledFrontend();
    }

    throw new Error("No bundled frontend found");
  } catch {
    throw new Error("Failed to load bundled frontend");
  }
}
