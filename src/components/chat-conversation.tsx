"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LongWaitBar } from "@/components/loading-indicator";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: number;
  role: ChatRole;
  text: string;
  links?: { href: string; label: string }[];
  cards?: ChatCard[];
  typing?: boolean;
  usedFallback?: boolean;
};

type ChatCard = {
  title: string;
  description?: string;
  rows?: { label: string; value: string }[];
  tone?: "default" | "success" | "warning";
};

type ChatResponse = {
  chat: {
    reply: string;
    provider: string;
    links: { href: string; label: string }[];
    cards?: ChatCard[];
    usedFallback?: boolean;
  };
};

type ApiError = {
  error: { message: string };
};

type ChatConversationProps = {
  variant?: "page" | "widget";
};

export function ChatConversation({ variant = "page" }: ChatConversationProps) {
  const nextMessageId = useRef(2);
  const typingTimers = useRef<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "空室、部屋タイプ、キャンセルポリシーを案内できます。予約番号・氏名・メールアドレス・電話番号は入力しないでください。",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showDebug = process.env.NODE_ENV !== "production";

  useEffect(() => {
    return () => {
      typingTimers.current.forEach((timer) => window.clearInterval(timer));
      typingTimers.current = [];
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, loading]);

  function appendAssistantMessage(chat: ChatResponse["chat"]) {
    const messageId = nextMessageId.current++;
    const characters = [...chat.reply];
    let index = 0;

    setMessages((current) => [
      ...current,
      {
        id: messageId,
        role: "assistant",
        text: "",
        typing: true,
      },
    ]);

    const timer = window.setInterval(() => {
      index += 2;
      const nextText = characters.slice(0, index).join("");
      const done = index >= characters.length;

      setMessages((current) =>
        current.map((messageItem) =>
          messageItem.id === messageId
            ? {
                ...messageItem,
                text: nextText,
                links: done ? chat.links : undefined,
                cards: done ? chat.cards : undefined,
                usedFallback: done ? chat.usedFallback : undefined,
                typing: !done,
              }
            : messageItem,
        ),
      );

      if (done) {
        window.clearInterval(timer);
        typingTimers.current = typingTimers.current.filter((currentTimer) => currentTimer !== timer);
      }
    }, 18);

    typingTimers.current.push(timer);
  }

  async function sendMessage(value = input) {
    const message = value.trim();
    if (!message || loading) return;

    const userMessage: ChatMessage = {
      id: nextMessageId.current++,
      role: "user",
      text: message,
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await response.json()) as ChatResponse | ApiError;
      if (!response.ok) {
        appendAssistantMessage({
          provider: "local",
          reply: (data as ApiError).error?.message ?? "チャットの応答に失敗しました。",
          links: [],
          cards: [{ title: response.status === 429 ? "送信回数の制限" : "送信エラー", tone: "warning" }],
        });
        return;
      }
      const chat = (data as ChatResponse).chat;
      appendAssistantMessage(chat);
    } catch {
      setError("通信に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`chat-conversation is-${variant}`}>
      <div className="chat-log" aria-live="polite">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message is-${message.role}`}>
            <div className="chat-bubble">
              {message.text.split("\n").map((line, index) => (
                <span key={`${message.id}-${index}`}>
                  {line}
                  <br />
                </span>
              ))}
              {message.typing && (
                <span className="chat-typing-caret" aria-hidden="true">
                  |
                </span>
              )}
              {message.cards && message.cards.length > 0 && (
                <div className="chat-result-cards">
                  {message.cards.map((card) => (
                    <div key={`${message.id}-${card.title}`} className={`chat-result-card tone-${card.tone ?? "default"}`}>
                      <div className="chat-result-card-title">{card.title}</div>
                      {card.description && <p className="chat-result-card-desc">{card.description}</p>}
                      {card.rows && card.rows.length > 0 && (
                        <dl className="chat-result-card-rows">
                          {card.rows.map((row) => (
                            <div key={`${card.title}-${row.label}`} className="chat-result-card-row">
                              <dt>{row.label}</dt>
                              <dd>{row.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {message.links && message.links.length > 0 && (
                <div className="chat-links">
                  {message.links.map((link) => (
                    <Link key={link.href} href={link.href} className="btn btn-secondary chat-link">
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
              {showDebug && message.usedFallback && (
                <p className="chat-debug-note">開発用: AI応答に失敗したためローカル判定で回答しました。</p>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} aria-hidden="true" />
      </div>

      {error && <div className="error-box">{error}</div>}

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
      >
        <label className="field-label" htmlFor={`chatMessage-${variant}`}>
          メッセージ
        </label>
        <div className="chat-input-row">
          <input
            id={`chatMessage-${variant}`}
            className="field-input"
            value={input}
            maxLength={500}
            placeholder="空室やキャンセルポリシーについて入力"
            onChange={(event) => setInput(event.target.value)}
          />
          <button
            aria-label="メッセージを送信"
            aria-busy={loading}
            className="chat-send-button"
            type="submit"
            disabled={!input.trim() || loading}
          >
            {loading ? <span className="chat-send-spinner" aria-hidden="true" /> : <span aria-hidden="true">✈</span>}
          </button>
        </div>
        <LongWaitBar loading={loading} message="空室や料金を確認しています。そのままお待ちください…" />
      </form>
    </div>
  );
}
