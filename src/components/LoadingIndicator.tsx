"use client";

import { useEffect, useState } from "react";

/**
 * loading が true の間だけ計測し、threshold(既定4秒)を超えたら true を返す。
 * 短い待ち時間ではスピナー、長い待ち時間ではプログレスバー、という出し分けに使う。
 * setState は setTimeout のコールバック内でのみ行い、effect 内で同期的に呼ばない。
 */
export function useLongWait(loading: boolean, threshold = 4000) {
  const [longWait, setLongWait] = useState(false);

  useEffect(() => {
    if (!loading) {
      // loading 終了時は次回のために非同期でリセットする。
      const reset = setTimeout(() => setLongWait(false), 0);
      return () => clearTimeout(reset);
    }
    const timer = setTimeout(() => setLongWait(true), threshold);
    return () => clearTimeout(timer);
  }, [loading, threshold]);

  return longWait;
}

/**
 * 送信ボタンの直後に置くプログレスバー。
 * 待ち時間が4秒を超えたときだけ表示し、それまでは何も描画しない
 * （ボタン側のインラインスピナーが短時間の待ちを担当するため）。
 */
export function LongWaitBar({
  loading,
  message = "通信に時間がかかっています。そのままお待ちください…",
}: {
  loading: boolean;
  message?: string;
}) {
  const longWait = useLongWait(loading);
  if (!loading || !longWait) return null;

  return (
    <div
      className="load-status"
      role="status"
      aria-live="polite"
      style={{ paddingBottom: 0 }}
    >
      <span>{message}</span>
      <div className="progress-track">
        <div className="progress-bar" />
      </div>
    </div>
  );
}
