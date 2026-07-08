import type { ReactNode } from "react";

export type ConfirmRow = readonly [label: string, value: ReactNode];

export function ConfirmTable({ rows, className = "" }: { rows: ConfirmRow[]; className?: string }) {
  return (
    <div className={className ? `confirm-table ${className}` : "confirm-table"}>
      {rows.map(([label, value]) => (
        <div key={label} className="confirm-row">
          <span className="confirm-label">{label}</span>
          <span className="confirm-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
