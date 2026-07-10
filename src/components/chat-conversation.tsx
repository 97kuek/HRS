"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LongWaitBar } from "@/components/loading-indicator";
import { SubmitButton } from "@/components/submit-button";

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: number;
  role: ChatRole;
  text: string;
  links?: { href: string; label: string }[];
  cards?: ChatCard[];
  typing?: boolean;
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
  };
};

type ApiError = {
  error: { message: string };
};

const suggestions = [
  "2名で2030-08-10に泊まれる部屋はありますか？",
  "来月、2名で空いている日はありますか？",
  "部屋タイプと料金を教えてください",
  "キャンセル料のルールを教えてください",
];

type ChatConversationProps = {
  variant?: "page" | "widget";
};

export function ChatConversation({ variant = "page" }: ChatConversationProps) {
  const nextMessageId = useRef(2);
  const typingTimers = useRef<number[]>([]);
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

  useEffect(() => {
    return () => {
      typingTimers.current.forEach((timer) => window.clearInterval(timer));
      typingTimers.current = [];
    };
  }, []);

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
        setError((data as ApiError).error?.message ?? "チャットの応答に失敗しました。");
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
      <div className="chat-suggestions" aria-label="質問例">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="chat-suggestion"
            onClick={() => sendMessage(suggestion)}
            disabled={loading}
          >
            {suggestion}
          </button>
        ))}
      </div>

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
            </div>
          </div>
        ))}
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
            placeholder="例: 2名で2030-08-10に泊まれる部屋はありますか？"
            onChange={(event) => setInput(event.target.value)}
          />
          <SubmitButton
            className="btn btn-primary"
            type="submit"
            loading={loading}
            loadingLabel="確認中…"
            disabled={!input.trim() || loading}
          >
            送信
          </SubmitButton>
        </div>
        <LongWaitBar loading={loading} message="空室や料金を確認しています。そのままお待ちください…" />
      </form>
    </div>
  );
}
