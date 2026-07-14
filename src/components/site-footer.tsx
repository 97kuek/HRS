"use client";

import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();

  if (pathname === "/chat" || pathname.startsWith("/chat/")) {
    return null;
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <span>HRS — Hotel Reservation System</span>
          <span className="site-footer-note">
            ソフトウェア工学A チーム開発課題（学習用のデモ環境です）
          </span>
        </div>
        <small className="site-footer-copyright">
          © 2026 Keitaro Ueki, Tomoya Hoshina, Takumi Kawasaki
        </small>
      </div>
    </footer>
  );
}
