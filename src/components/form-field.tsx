import type { ReactNode } from "react";

export function fieldInputClass(touched: boolean, value: string, error: string | null) {
  if (!touched || value.trim() === "") return "field-input";
  return error ? "field-input is-invalid" : "field-input is-valid";
}

export function fieldDescribedBy(
  id: string,
  hint?: ReactNode,
  error?: string | null,
  touched = false,
) {
  const ids = [];
  if (hint) ids.push(`${id}-hint`);
  if (touched && error) ids.push(`${id}-error`);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function FormField({
  id,
  label,
  required = true,
  hint,
  error,
  touched = false,
  className = "",
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  touched?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const labelClass = required ? "field-label field-required" : "field-label field-optional";

  return (
    <div className={className ? `field ${className}` : "field"}>
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {touched && error && (
        <span className="field-error" id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}
