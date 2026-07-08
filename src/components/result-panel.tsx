import type { ReactNode } from "react";

import { ConfirmTable, type ConfirmRow } from "@/components/confirm-table";

export function ResultPanel({
  title,
  description,
  secondaryDescription,
  rows,
  children,
}: {
  title: string;
  description?: ReactNode;
  secondaryDescription?: ReactNode;
  rows?: ConfirmRow[];
  children?: ReactNode;
}) {
  return (
    <main className="page-shell">
      <div className="page-panel page-panel-centered">
        <div className="complete-mark">✓</div>
        <h1 className="page-title">{title}</h1>
        {description && <p className="panel-text">{description}</p>}
        {secondaryDescription && (
          <p className="panel-text panel-text-small">{secondaryDescription}</p>
        )}
        {rows && <ConfirmTable rows={rows} className="confirm-table-left" />}
        {children}
      </div>
    </main>
  );
}
