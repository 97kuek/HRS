import Link from "next/link";

const actions = [
  {
    href: "/reservations/new",
    label: "部屋を予約する",
    desc: "空室を検索して新しい予約を作成します。",
  },
  {
    href: "/reservations/lookup",
    label: "予約を確認する",
    desc: "予約番号から予約内容を照会します。",
  },
  {
    href: "/check-in",
    label: "チェックインする",
    desc: "ご来館時に予約番号でチェックインします。",
  },
  {
    href: "/check-out",
    label: "チェックアウトする",
    desc: "お部屋番号からお支払い・退室手続きをします。",
  },
  {
    href: "/reservations/cancel",
    label: "予約をキャンセルする",
    desc: "予約番号からご予約を取り消します。",
  },
];

export default function Home() {
  return (
    <main className="page-shell">
      <section className="hero">
        <p className="eyebrow">Hotel Reservation System</p>
        <h1>HRS</h1>
        <p className="lead">
          予約、確認、チェックイン、チェックアウトを扱うホテル予約システムです。ご利用になる操作を選んでください。
        </p>
      </section>

      <nav className="action-grid" aria-label="主要機能">
        {actions.map((action) => (
          <Link className="action-link" href={action.href} key={action.href}>
            <span className="action-link-label">{action.label}</span>
            <span className="action-link-desc">{action.desc}</span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
