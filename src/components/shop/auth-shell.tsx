import type { ReactNode } from "react";

export function AuthShell({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-sm px-4 pt-10 pb-6 sm:pt-16">
      <h1 className="text-h1 font-bold">{title}</h1>
      {intro ? <div className="mt-2 text-body text-muted">{intro}</div> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}
