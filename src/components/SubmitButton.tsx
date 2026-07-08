import type { ReactNode } from "react";

export function SubmitButton({
  loading,
  loadingLabel,
  children,
  className = "btn btn-primary btn-full btn-lg",
  disabled,
  type,
  onClick,
}: {
  loading: boolean;
  loadingLabel: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      className={className}
      disabled={disabled || loading}
      aria-busy={loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <span className="spinner" aria-hidden="true" /> {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
