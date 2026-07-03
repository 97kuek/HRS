"use client"

import { useEffect, useState } from "react"

/**
 * 待ち時間の長さに応じて表示を切り替えるローディング表示。
 * - 〜4秒: スピナー（短時間の処理）
 * - 4秒以上: プログレスバー（進行中であることを明示し不安を減らす）
 */
export function LoadingIndicator({
  label = "処理中です…",
  longWaitLabel = "通信に時間がかかっています。そのままお待ちください…",
  threshold = 4000,
}: {
  label?: string
  longWaitLabel?: string
  threshold?: number
}) {
  const [longWait, setLongWait] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLongWait(true), threshold)
    return () => clearTimeout(timer)
  }, [threshold])

  return (
    <div className="load-status" role="status" aria-live="polite">
      {longWait ? (
        <>
          <span>{longWaitLabel}</span>
          <div className="progress-track">
            <div className="progress-bar" />
          </div>
        </>
      ) : (
        <span>
          <span className="spinner" aria-hidden="true" /> {label}
        </span>
      )}
    </div>
  )
}
