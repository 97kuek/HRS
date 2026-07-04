import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <div className="page-panel page-panel-centered">
        <p className="page-kicker">404</p>
        <h1 className="page-title">ページが見つかりません</h1>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "0.9375rem",
            lineHeight: 1.7,
            margin: "0 0 32px",
          }}
        >
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <Link href="/" className="btn btn-primary">
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
