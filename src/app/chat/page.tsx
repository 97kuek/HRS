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
            <h1 className="chat-app-title">予約支援チャット</h1>
          </div>
        </header>
        <ChatConversation />
      </section>
    </main>
  );
}
