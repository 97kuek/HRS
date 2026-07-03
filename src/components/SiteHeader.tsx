"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/reservations/new", label: "予約" },
  { href: "/reservations/lookup", label: "予約確認" },
  { href: "/check-in", label: "チェックイン" },
  { href: "/check-out", label: "チェックアウト" },
  { href: "/reservations/cancel", label: "キャンセル" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="site-logo">
          HRS
        </Link>
        <nav className="site-nav" aria-label="メインナビゲーション">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "site-nav-link active" : "site-nav-link"}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
