import type { Metadata } from "next";
import { Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-mincho",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "HRS",
  description: "Hotel Reservation System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={notoSerifJP.variable}>
      <body>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <span>HRS — Hotel Reservation System</span>
            <span className="site-footer-note">
              ソフトウェア工学A チーム開発課題（学習用のデモ環境です）
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
