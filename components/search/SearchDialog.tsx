"use client";

import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { search } from "@/lib/search/search";
import type { SearchResult } from "@/lib/search/types";

type SearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getFinalFocus: () => HTMLElement | null;
};

export function SearchDialog({ open, onOpenChange, getFinalFocus }: SearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="z-[60] bg-mnh-black/60 backdrop-blur-[4px] duration-200 supports-backdrop-filter:backdrop-blur-[4px] motion-reduce:animate-none" />
        <DialogPrimitive.Popup
          finalFocus={() => getFinalFocus() ?? true}
          className={cn(
            "fixed inset-3 z-[60] flex flex-col overflow-hidden rounded-2xl border border-mnh-white/8 bg-mnh-dark-elevated text-mnh-text-white shadow-[0_24px_80px_color-mix(in_srgb,var(--mnh-black)_50%,transparent)] outline-none",
            "sm:inset-auto sm:top-[15vh] sm:left-1/2 sm:max-h-[70vh] sm:w-[calc(100%-48px)] sm:max-w-[640px] sm:-translate-x-1/2",
            "origin-top transition-[opacity,scale] duration-200 ease-out data-ending-style:scale-96 data-ending-style:opacity-0 data-starting-style:scale-96 data-starting-style:opacity-0 motion-reduce:transition-none",
          )}
        >
          <DialogTitle className="sr-only">Search the site</DialogTitle>
          {/* Remount on each open so the query and selection start fresh. */}
          {open && <SearchCommand onNavigate={() => onOpenChange(false)} />}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}

function SearchCommand({ onNavigate }: { onNavigate: () => void }) {
  const router = useRouter();
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);

  const groups = useMemo(() => search(deferredQuery), [deferredQuery]);
  const flatResults = useMemo(
    () => groups.flatMap((group) => group.results),
    [groups],
  );
  const optionId = (index: number) => `${baseId}-option-${index}`;
  const safeActiveIndex =
    flatResults.length === 0 ? -1 : Math.min(activeIndex, flatResults.length - 1);

  // Keep the selected option visible while navigating with the keyboard.
  useEffect(() => {
    if (safeActiveIndex < 0) return;
    const option = document.getElementById(optionId(safeActiveIndex));
    option?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeActiveIndex]);

  function openResult(result: SearchResult | undefined) {
    if (!result) return;
    onNavigate();
    router.push(result.item.href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (flatResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((safeActiveIndex + 1) % flatResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((safeActiveIndex - 1 + flatResults.length) % flatResults.length);
    } else if (event.key === "Home" && event.ctrlKey) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End" && event.ctrlKey) {
      event.preventDefault();
      setActiveIndex(flatResults.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      openResult(flatResults[safeActiveIndex]);
    }
  }

  let runningIndex = -1;

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-mnh-dark-border px-4 sm:px-5">
        <Search aria-hidden="true" size={20} className="shrink-0 text-mnh-text-muted-dark" />
        <input
          ref={inputRef}
          autoFocus
          type="text"
          role="combobox"
          aria-label="Search pages, services, projects"
          aria-expanded="true"
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={safeActiveIndex >= 0 ? optionId(safeActiveIndex) : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          placeholder="Search pages, services, projects…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          className="h-16 min-w-0 flex-1 bg-transparent font-sans text-base text-mnh-text-white outline-none placeholder:text-mnh-text-muted-dark"
        />
        <DialogClose
          className="inline-flex h-7 shrink-0 items-center rounded-md border border-mnh-dark-border px-2 font-sans text-xs text-mnh-text-muted-dark transition-colors duration-200 hover:border-mnh-accent/40 hover:text-mnh-accent"
        >
          Esc
          <span className="sr-only"> — close search</span>
        </DialogClose>
      </div>

      <div
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-label="Search results"
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 sm:max-h-[min(420px,calc(70vh-112px))]"
      >
        {flatResults.length === 0 ? (
          <div role="presentation" className="px-4 py-10 text-center">
            <p className="font-sans text-[15px] text-mnh-text-muted-dark">
              No results for « <span className="text-mnh-text-white">{deferredQuery.trim()}</span> »
            </p>
            <Link
              href="/contact"
              onClick={onNavigate}
              className="mt-3 inline-flex items-center gap-2 rounded-md font-sans text-sm font-semibold text-mnh-accent transition-[gap] duration-200 hover:gap-3"
            >
              Contact us
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        ) : (
          groups.map((group) => {
            const headingId = `${baseId}-group-${group.label}`;
            return (
              <div key={group.label} role="group" aria-labelledby={headingId} className="pb-2 last:pb-0">
                <div
                  id={headingId}
                  role="presentation"
                  className="px-3 pt-3 pb-2 font-sans text-[11px] font-semibold tracking-[0.1em] text-mnh-text-muted-dark uppercase"
                >
                  {group.label}
                </div>
                {group.results.map((result) => {
                  runningIndex += 1;
                  const index = runningIndex;
                  const isActive = index === safeActiveIndex;
                  const Icon = result.item.icon;

                  return (
                    <div
                      key={result.item.id}
                      id={optionId(index)}
                      role="option"
                      aria-selected={isActive}
                      onMouseMove={() => {
                        if (!isActive) setActiveIndex(index);
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openResult(result)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-[10px] border-l-2 px-3 py-2.5 transition-colors duration-150",
                        isActive
                          ? "border-mnh-accent bg-mnh-accent/8"
                          : "border-transparent",
                      )}
                    >
                      <Icon
                        aria-hidden="true"
                        size={16}
                        className={cn("shrink-0", isActive ? "text-mnh-accent" : "text-mnh-text-muted-dark")}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "truncate font-sans text-[15px] font-medium",
                            isActive ? "text-mnh-accent" : "text-mnh-text-white",
                          )}
                        >
                          <HighlightedTitle result={result} />
                        </div>
                        {result.item.description && (
                          <div className="truncate font-sans text-[13px] text-mnh-text-muted-dark">
                            {result.item.description}
                          </div>
                        )}
                      </div>
                      <ArrowRight
                        aria-hidden="true"
                        size={16}
                        className={cn(
                          "shrink-0 transition-[color,translate] duration-200",
                          isActive ? "translate-x-0.5 text-mnh-accent" : "text-mnh-text-muted-dark",
                        )}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <div
        aria-hidden="true"
        className="hidden shrink-0 items-center gap-4 border-t border-mnh-dark-border px-5 py-3 font-sans text-xs text-mnh-text-muted-dark sm:flex"
      >
        <span><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
        <span><Kbd>↵</Kbd> open</span>
        <span><Kbd>esc</Kbd> close</span>
      </div>
    </>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="mr-1 inline-flex h-5 min-w-5 items-center justify-center rounded border border-mnh-dark-border px-1 font-sans text-[11px] text-mnh-text-muted-dark">
      {children}
    </kbd>
  );
}

function HighlightedTitle({ result }: { result: SearchResult }) {
  const { title } = result.item;
  const match = result.titleMatch;
  if (!match) return <>{title}</>;

  return (
    <>
      {title.slice(0, match.start)}
      <mark className="bg-transparent text-mnh-accent">
        {title.slice(match.start, match.end)}
      </mark>
      {title.slice(match.end)}
    </>
  );
}
