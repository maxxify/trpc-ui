import type { RenderOptions } from "@src/render";
import { createContext, type ReactNode, useContext } from "react";
import type { ParsedTRPCRouter } from "trpc-parser";

const RenderOptionsContext = createContext<{
  options: RenderOptions;
  router: ParsedTRPCRouter;
  // @ts-expect-error
}>(null);

interface RenderOptionsProviderProps {
  options: RenderOptions;
  router: ParsedTRPCRouter;
  children: ReactNode;
}

// TODO just make this a provider for everything
export function RenderOptionsProvider({
  options,
  router,
  children,
}: RenderOptionsProviderProps) {
  // Provide the options as a readonly value (React context values are immutable by design)
  return (
    <RenderOptionsContext.Provider
      value={{
        options,
        router,
      }}
    >
      {children}
    </RenderOptionsContext.Provider>
  );
}

export function useRenderOptions(): {
  options: RenderOptions;
  router: ParsedTRPCRouter;
} {
  const context = useContext(RenderOptionsContext);

  if (context === null) {
    throw new Error(
      "useRenderOptions must be used within a RenderOptionsProvider",
    );
  }

  return context;
}
