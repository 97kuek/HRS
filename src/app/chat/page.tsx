import { ChatConversation } from "@/components/chat-conversation";

export default function ChatPage() {
  return (
    <main className="page-shell">
      <div className="reservation-panel chat-panel">
        <p className="page-kicker">ASSISTANT</p>
        <h1 className="page-title">予約支援チャット</h1>
        <p className="page-intro">
          空室や料金の目安を確認できます。予約の作成・確認・キャンセル確定は専用画面で行います。
        </p>

        <div className="info-box chat-privacy-note">
          予約番号、氏名、メールアドレス、電話番号などの個人情報は入力しないでください。
        </div>

        <ChatConversation />
      </div>
    </main>
  );
}
