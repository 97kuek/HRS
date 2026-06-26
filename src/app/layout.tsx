import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "HRS",
  description: "Hotel Reservation System",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="site-logo">
              HRS
            </Link>
            <nav className="site-nav" aria-label="メインナビゲーション">
              <Link href="/reservations/new">空室検索</Link>
              <Link href="/reservations/lookup">予約照会</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
