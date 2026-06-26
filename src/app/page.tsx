const actions = [
  { href: "/reservations/new", label: "部屋を予約する" },
  { href: "/reservations/lookup", label: "予約を確認する" },
  { href: "/check-in", label: "チェックインする" },
  { href: "/check-out", label: "チェックアウトする" },
  { href: "/reservations/cancel", label: "予約をキャンセルする" },
];

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Hotel Reservation System</p>
        <h1>HRS</h1>
        <p className="lead">
          予約、確認、チェックイン、チェックアウトを扱うホテル予約システムです。
        </p>
      </section>

      <nav className="action-grid" aria-label="主要機能">
        {actions.map((action) => (
          <a className="action-link" href={action.href} key={action.href}>
            {action.label}
          </a>
        ))}
      </nav>
    </main>
  );
}
