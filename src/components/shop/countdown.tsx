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
 * Live HH : MM : SS countdown to `target`, using the server time offset so a
 * wrong device clock can't mislead. Screen readers hear it once a minute.
 */
export function Countdown({ target, serverNow, label, onDone }: { target: string; serverNow: string; label: string; onDone?: () => void }) {
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
  const box = (value: string, unit: string) => (
    <div className="flex flex-col items-center">
      <span className="min-w-[3.25rem] rounded-[12px] bg-bg px-2 py-1.5 text-center text-[2rem] leading-none font-bold tabular shadow-[var(--shadow-card)]">{value}</span>
      <span className="mt-1.5 text-[0.75rem] font-medium text-muted">{unit}</span>
    </div>
  );

  return (
    <div>
      <p className="sr-only" aria-live="polite" aria-atomic="true" key={minuteKey}>
        {label} {spoken(remaining)}
      </p>
      <div aria-hidden className="flex items-start gap-2">
        {box(pad(h), "Hours")}
        <span className="pt-1.5 text-[1.75rem] leading-none font-bold">:</span>
        {box(pad(m), "Minutes")}
        <span className="pt-1.5 text-[1.75rem] leading-none font-bold">:</span>
        {box(pad(s), "Seconds")}
      </div>
    </div>
  );
}
