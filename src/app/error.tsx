"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unexpected application error", error);
  }, [error]);

  return (
    <main className="page-shell">
      <div className="page-panel">
        <p className="page-kicker">ERROR</p>
        <h1 className="page-title">画面を表示できませんでした</h1>
        <p className="page-intro">時間をおいて、もう一度お試しください。</p>
        <button className="btn btn-primary btn-full" type="button" onClick={reset}>
          もう一度試す
        </button>
      </div>
    </main>
  );
}
