"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { OpeningHours } from "@/components/layout/footer/footer-config";

type StudioStatusProps = {
  hours: OpeningHours;
  openText: string;
  closedText: string;
};

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Is the studio open right now, in its own time zone? */
export function isOpenAt(date: Date, hours: OpeningHours) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: hours.timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = WEEKDAYS[get("weekday")];
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));
  return (
    hours.days.includes(weekday) &&
    minutes >= toMinutes(hours.opens) &&
    minutes < toMinutes(hours.closes)
  );
}

/**
 * Live open/closed status, computed on the client after mount (no hydration mismatch).
 * Before mount nothing is shown — the hours line next to it is server-rendered.
 */
export function StudioStatus({ hours, openText, closedText }: StudioStatusProps) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const update = () => setIsOpen(isOpenAt(new Date(), hours));
    const frame = requestAnimationFrame(update);
    const interval = window.setInterval(update, 60_000);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, [hours]);

  if (isOpen === null) return null;

  return (
    <p className="flex items-center gap-2 text-mnh-text-muted-dark" data-status={isOpen ? "open" : "closed"}>
      <span aria-hidden="true" className="relative flex size-2 shrink-0">
        {isOpen && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-mnh-accent opacity-60 motion-reduce:animate-none" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            isOpen ? "bg-mnh-accent" : "bg-mnh-text-muted-light",
          )}
        />
      </span>
      {isOpen ? openText : closedText}
    </p>
  );
}
