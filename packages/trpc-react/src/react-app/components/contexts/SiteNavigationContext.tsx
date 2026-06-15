import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
} from "react";
import { create } from "zustand";

type CollapsibleState = Record<string, boolean>;

// Create the store with a default empty state
const useCollapsableStore = create<CollapsibleState>(() => ({}));

function forAllPaths(path: string[], callback: (current: string) => void) {
  const cur: string[] = [];
  for (const next of path) {
    cur.push(next);
    const joined = cur.join(".");
    callback(joined);
  }
}

export const collapsables = (() => {
  const hide = (path: string[]) => {
    const pathJoined = path.join(".");
    forAllPaths(path, (current) => {
      useCollapsableStore.setState({
        [current]: false,
      });
    });
    // Also hide all child paths
    const state = useCollapsableStore.getState();
    for (const key in state) {
      if (key.startsWith(`${pathJoined}.`)) {
        useCollapsableStore.setState({
          [key]: false,
        });
      }
    }
  };
  const show = (path: string[]) => {
    forAllPaths(path, (current) => {
      useCollapsableStore.setState({
        [current]: true,
      });
    });
  };
  return {
    hide,
    hideAll() {
      const state = useCollapsableStore.getState();
      const newValue: CollapsibleState = {};
      for (const pathKey in state) {
        newValue[pathKey] = false;
      }
      useCollapsableStore.setState(newValue);
    },
    show,
    toggle(path: string[]) {
      const state = useCollapsableStore.getState();
      const pathKey = path.join(".");
      if (state[pathKey]) {
        hide(path);
      } else {
        show(path);
      }
    },
  };
})();

export function useCollapsableIsShowing(path: string[]): boolean {
  const pathKey = useMemo(() => path.join("."), [path]);
  return useCollapsableStore((state) => state[pathKey] ?? false);
}

const Context = createContext<{
  scrollToPathIfMatches: (path: string[], element: Element) => boolean;
  markForScrollTo: (path: string[]) => void;
  openAndNavigateTo: (path: string[], closeOthers?: boolean) => void;
} | null>(null);

export function SiteNavigationContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const scrollToPathRef = useRef<string[] | null>(null);

  function scrollToPathIfMatches(path: string[], element: Element) {
    if (
      !scrollToPathRef.current ||
      !Array.isArray(scrollToPathRef.current) ||
      path.join(".") !== scrollToPathRef.current.join(".")
    ) {
      return false;
    }

    scrollToPathRef.current = null;
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "start",
    });
    return true;
  }

  function markForScrollTo(path: string[]) {
    scrollToPathRef.current = path;
  }

  function openAndNavigateTo(path: string[], hideOthers?: boolean) {
    if (hideOthers) {
      collapsables.hideAll();
    }
    collapsables.show(path);
    markForScrollTo(path);
  }

  return (
    <Context.Provider
      value={{
        markForScrollTo,
        openAndNavigateTo,
        scrollToPathIfMatches,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useSiteNavigationContext() {
  const context = useContext(Context);
  if (context === null)
    throw new Error(
      "useCollapsableContext must be called from within a CollapsableContext",
    );
  return context;
}
