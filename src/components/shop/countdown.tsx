"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 };
}
const pad = (n: number) => String(n).padStart(2, "0");

function spoken(ms: number) {
  const { h, m } = parts(ms);
  if (h > 0) return `${h} hour${h === 1 ? "" : "s"} ${m} minute${m === 1 ? "" : "s"}`;
  if (m > 0) return `${m} minute${m === 1 ? "" : "s"}`;
  return "less than a minute";
}

/**
 * Live countdown to `target`. Uses the server time offset, so a wrong device
 * clock can't mislead. Screen readers hear an update once a minute, not every
 * second. When it reaches zero, `onDone` lets the page refresh.
 */
export function Countdown({
  target,
  serverNow,
  label,
  onDone,
  size = "lg",
}: {
  target: string;
  serverNow: string;
  label: string;
  onDone?: () => void;
  size?: "lg" | "sm";
}) {
  const [offset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const [now, setNow] = useState(() => new Date(serverNow).getTime());
  const remaining = new Date(target).getTime() - now;

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(Date.now() + offset);
    const start = () => {
      tick();
      id = setInterval(tick, 1000);
    };
    const onVisibility = () => {
      if (document.hidden) clearInterval(id);
      else start();
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [offset]);

  useEffect(() => {
    if (remaining <= 0 && onDone) onDone();
  }, [remaining, onDone]);

  const { h, m, s } = parts(remaining);
  const minuteKey = Math.ceil(Math.max(0, remaining) / 60_000);

  return (
    <div>
      <p className="sr-only" aria-live="polite" aria-atomic="true" key={minuteKey}>
        {label} {spoken(remaining)}
      </p>
      <p aria-hidden className="text-label font-bold uppercase tracking-[0.06em] opacity-80">
        {label}
      </p>
      <p aria-hidden className={size === "lg" ? "mt-1 font-bold tabular text-[2.75rem] leading-none tracking-[-0.03em] sm:text-[3.5rem]" : "font-bold tabular text-h2"}>
        {h > 0 ? (
          <>
            {h}
            <span className="text-[0.45em] font-bold opacity-70">h </span>
            {pad(m)}
            <span className="text-[0.45em] font-bold opacity-70">m </span>
          </>
        ) : (
          <>
            {pad(m)}
            <span className="text-[0.45em] font-bold opacity-70">m </span>
          </>
        )}
        {pad(s)}
        <span className="text-[0.45em] font-bold opacity-70">s</span>
      </p>
    </div>
  );
}
