import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ChatLauncher } from "@/components/chat-launcher";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const notoSerifJP = localFont({
  src: "./fonts/NotoSerifJP-Regular.woff2",
  variable: "--font-mincho",
  display: "swap",
  preload: true,
  fallback: ["Yu Mincho", "YuMincho", "Hiragino Mincho ProN", "serif"],
});

export const metadata: Metadata = {
  title: "HRS",
  description: "Hotel Reservation System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={notoSerifJP.variable}>
      <body>
        <SiteHeader />
        {children}
        <ChatLauncher />
        <SiteFooter />
      </body>
    </html>
  );
}
