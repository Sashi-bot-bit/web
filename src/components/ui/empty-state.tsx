import type { ReactNode } from "react";

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-border-strong px-6 py-10 text-center">
      <p className="text-h3 font-bold">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-body text-muted">{children}</div> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
