"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChatConversation } from "@/components/chat-conversation";

export function ChatLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/chat" || pathname.startsWith("/chat/")) {
    return null;
  }

  return (
    <div className="chat-widget">
      {open && (
        <section className="chat-widget-panel" aria-label="予約支援チャット">
          <div className="chat-widget-header">
            <div>
              <p className="chat-widget-kicker">予約支援</p>
              <h2 className="chat-widget-title">チャット</h2>
            </div>
            <button
              type="button"
              className="chat-widget-close"
              aria-label="予約支援チャットを閉じる"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <p className="chat-widget-note">
            予約番号・氏名・メールアドレス・電話番号は入力しないでください。
          </p>
          <ChatConversation variant="widget" />
        </section>
      )}
      <button
        type="button"
        className={
          open
            ? "chat-launcher chat-launcher-desktop is-open"
            : "chat-launcher chat-launcher-desktop"
        }
        aria-label={open ? "予約支援チャットを閉じる" : "予約支援チャットを開く"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="chat-launcher-mark" aria-hidden="true">
          ?
        </span>
        <span className="chat-launcher-text">
          <span className="chat-launcher-kicker">予約支援</span>
          <span className="chat-launcher-label">チャット</span>
        </span>
      </button>
      <Link
        href="/chat"
        className="chat-launcher chat-launcher-mobile"
        aria-label="予約支援チャット画面を開く"
      >
        <span className="chat-launcher-mark" aria-hidden="true">
          ?
        </span>
        <span className="chat-launcher-text">
          <span className="chat-launcher-kicker">予約支援</span>
          <span className="chat-launcher-label">チャット</span>
        </span>
      </Link>
    </div>
  );
}
