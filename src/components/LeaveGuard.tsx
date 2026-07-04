"use client";

import { useEffect } from "react";

/**
 * 重要な入力途中でブラウザのタブを閉じる／リロードしようとした際に
 * ブラウザ標準の確認ダイアログを表示する。enabled が true のときのみ有効。
 */
export function useBeforeUnloadGuard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);
}

/**
 * アプリ内でページ離脱（予約の中止など）を確認するためのモーダル。
 */
export function LeaveConfirmModal({
  title,
  body,
  confirmLabel = "中止する",
  cancelLabel = "入力を続ける",
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-title">{title}</p>
        <p className="modal-body">{body}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
