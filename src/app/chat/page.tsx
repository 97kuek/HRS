import { ChatConversation } from "@/components/chat-conversation";

export default function ChatPage() {
  return (
    <main className="chat-page-shell">
      <section className="chat-app" aria-label="予約支援チャット">
        <header className="chat-app-header">
          <div className="chat-app-avatar" aria-hidden="true">
            H
          </div>
          <div className="chat-app-heading">
            <p className="chat-app-kicker">HRS Assistant</p>
            <h1 className="chat-app-title">予約支援チャット</h1>
            <p className="chat-app-subtitle">空室、料金、各種手続きの案内に対応します。</p>
          </div>
        </header>
        <div className="chat-app-notice">
          予約番号、氏名、メールアドレス、電話番号などの個人情報は入力しないでください。
        </div>
        <ChatConversation />
      </section>
    </main>
  );
}
