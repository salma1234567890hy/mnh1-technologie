"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SearchDialog } from "@/components/search/SearchDialog";

type SiteSearchContextValue = {
  isOpen: boolean;
  openSearch: () => void;
  setOpen: (open: boolean) => void;
  /** Callback ref for every search trigger (desktop + mobile). */
  registerTrigger: (element: HTMLButtonElement | null) => void;
};

const SiteSearchContext = createContext<SiteSearchContextValue | null>(null);

export function useSiteSearch() {
  const context = useContext(SiteSearchContext);
  if (!context) {
    throw new Error("useSiteSearch must be used inside <SiteSearchProvider>.");
  }
  return context;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Owns the search open state, the single global keyboard shortcut
 * (⌘K / Ctrl+K and "/") and the one search dialog instance.
 */
export function SiteSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const triggersRef = useRef(new Set<HTMLButtonElement>());

  const openSearch = useCallback(() => setOpen(true), []);

  const registerTrigger = useCallback((element: HTMLButtonElement | null) => {
    if (element) triggersRef.current.add(element);
    // React 19 callback-ref cleanup removes the element on unmount.
    return () => {
      if (element) triggersRef.current.delete(element);
    };
  }, []);

  /** Focus goes back to the search button that is visible at this width. */
  const getVisibleTrigger = useCallback(() => {
    for (const trigger of triggersRef.current) {
      if (trigger.isConnected && trigger.getClientRects().length > 0) {
        return trigger;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing) return;

      const isModK =
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "k";
      if (isModK) {
        event.preventDefault();
        setOpen((open) => !open);
        return;
      }

      const isSlash =
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey;
      if (isSlash && !isEditableTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const value = useMemo(
    () => ({ isOpen, openSearch, setOpen, registerTrigger }),
    [isOpen, openSearch, registerTrigger],
  );

  return (
    <SiteSearchContext.Provider value={value}>
      {children}
      <SearchDialog
        open={isOpen}
        onOpenChange={setOpen}
        getFinalFocus={getVisibleTrigger}
      />
    </SiteSearchContext.Provider>
  );
}
