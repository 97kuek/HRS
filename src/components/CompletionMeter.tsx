/**
 * 入力の完了率を表示するメーター。必須項目のうち何項目入力済みかを可視化する。
 */
export function CompletionMeter({
  completed,
  total,
  label = "入力状況",
}: {
  completed: number
  total: number
  label?: string
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  const done = completed >= total && total > 0

  return (
    <div className="completion-meter">
      <span className="completion-label">{label}</span>
      <div
        className="completion-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="completion-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="completion-label">
        {done ? "入力完了" : `${completed}/${total} 項目`}
      </span>
    </div>
  )
}
