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
}: {
  target: string;
  serverNow: string;
  label: string;
  onDone?: () => void;
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
      <p aria-hidden className="text-small text-muted">
        {label}
      </p>
      <p aria-hidden className="mt-0.5 text-[2rem] leading-none font-bold tracking-[-0.02em] tabular">
        {h > 0 ? (
          <>
            {h}
            <span className="text-[0.55em] text-muted">h </span>
            {pad(m)}
            <span className="text-[0.55em] text-muted">m </span>
          </>
        ) : (
          <>
            {pad(m)}
            <span className="text-[0.55em] text-muted">m </span>
          </>
        )}
        {pad(s)}
        <span className="text-[0.55em] text-muted">s</span>
      </p>
    </div>
  );
}
