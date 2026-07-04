# AGENTS.md

このファイルは、HRS (Hotel Reservation System) リポジトリで作業するAIコーディングエージェント
(Claude Code, OpenAI Codex, Cursor, GitHub Copilot など) 向けの作業規約です。
人間のメンバーが各ツールの使い方を理解するための補助としても使えます。

各ツールの読み込み先:

- Claude Code: `CLAUDE.md` (このファイルへのポインタ)
- Codex / その他 AGENTS.md 準拠ツール: この `AGENTS.md`

人間向けの利用ガイドは [docs/ai-agents-guide.md](docs/ai-agents-guide.md) を参照してください。

## プロジェクト概要

- ソフトウェア工学Aのチーム開発課題。題材はホテル予約システム (HRS)。
- UMLを用いたオブジェクト指向分析設計 (ドメイン分析 → 要求分析 → システム分析) を行う。
- 実装はWebアプリケーションとして行う (実装形態は自由)。
- 技術スタックは Issue #23 で決定済み。TypeScript / Next.js App Router / Prisma / Postgres を使う。
- メール送信に **Resend** (`resend` npm パッケージ) を使う。
- リポジトリはPublic運用。

## 最重要ルール

1. **Publicリポジトリである。** 授業の提供コード、配布資料の再配布、個人情報、提出条件に関わる
   非公開情報をコミットしない。`docs/チーム開発1.pdf` 以外の授業配布物を追加しないこと。
2. **1 Issue / 1 成果物 = 1 ブランチ = 1 PR。** `main` へ直接コミットしない。
3. **決定済みスタックから逸脱しない。** 実装は TypeScript / Next.js App Router / Prisma / Postgres
   を前提にする。別のフレームワーク、ORM、DB、認証基盤などを追加する場合は人間に確認する。
4. **成果物の用語を一貫させる。** UML図・ユースケース記述・コード・READMEで同じ概念には同じ名前を使う。

## リポジトリ構成

```text
.
├── AGENTS.md                  # 本ファイル (エージェント向け規約)
├── CLAUDE.md                  # Claude Code 用 (AGENTS.md を参照)
├── LICENSE                    # MIT License
├── README.md                  # プロジェクト概要
├── CONTRIBUTING.md            # 開発ルール
├── .github/                   # Issue/PR テンプレート
├── docs/
│   ├── チーム開発1.pdf         # 課題スライド (唯一許可された配布物)
│   ├── git-beginner-guide.md
│   ├── ai-agents-guide.md     # メンバー向けAIツール利用ガイド
│   ├── domain-analysis/       # ドメイン分析 (クラス図・オブジェクト図)
│   ├── requirements-analysis/ # 要求分析 (ユースケース図・記述・アクティビティ図)
│   ├── system-analysis/       # システム分析 (コラボレーション図・分析クラス図)
│   ├── reviews/               # レビュー記録
│   └── presentation/          # 発表資料
├── prisma/
│   └── schema.prisma          # Prisma DB スキーマ
├── src/
│   ├── app/                   # Next.js App Router 画面 / Route Handler
│   └── lib/                   # 共通ライブラリ
├── package.json               # npm scripts / dependencies
└── .env.example               # 環境変数サンプル
```

実装コードは `src/`、DBスキーマは `prisma/` に配置する。Next.js の Route Handler は `src/app/api/**/route.ts` に置く。

## ブランチ / コミット規約

ブランチ名: `<type>/<issue-number>-<short-name>`

- `docs/...`: 分析設計資料・README・レビュー記録
- `feature/...`: 実装の新規追加
- `fix/...`: 資料や実装の修正

コミットメッセージ: `<type>: <summary>` (type は `docs` / `feat` / `fix` / `test` / `refactor` / `chore`)

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) を参照。

## エージェント向けの作業手順

1. 対象 Issue を確認し、目的・成果物・チェックリストを把握する。
2. `main` を最新化し、Issue番号付きブランチを作成する。
3. 変更は対象 Issue のスコープ内に限定する。無関係なファイルを変更しない。
4. ドキュメントを変更したら、関連する README / docs の記述との整合を確認する。
5. コミット後、Pull Request を作成し本文に `Closes #<issue-number>` を書く。
6. **Pull Request の最終送信・レビュー依頼は、人間の確認を得てから行う。**

## やってはいけないこと

- `main` への直接 push / force push。
- 授業配布物や非公開情報の追加。
- 決定済みスタックと無関係な依存ファイルやライブラリの独断追加。
- レビューチェックリスト (各 docs サブディレクトリ・`.github/ISSUE_TEMPLATE/review.md`) を無視した成果物の完了。
- 大量の自動生成ファイルや秘密情報 (`.env` 等) のコミット。

## 検証

依存関係をインストールした後、次のコマンドを基本の検証とする。

```powershell
npm run lint
npm run build
```

Prisma Client を生成する場合:

```powershell
npm run prisma:generate
```

ローカル起動:

```powershell
npm run dev
```

DB接続文字列、APIキー、実在する個人情報を含む `.env.local` などはコミットしない。

## 環境変数

`.env.example` に全項目のテンプレートを置いている。実際の値は `.env`（gitignore済み）に記載すること。

| 変数 | 必須 | 用途 |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Prisma が接続する Postgres URL |
| `DIRECT_URL` | — | Neon Pooled 接続時のみ Direct URL を設定 |
| `NEXT_PUBLIC_APP_NAME` | — | 表示用アプリ名（デフォルト: `HRS`） |
| `APP_BASE_URL` | — | アプリのベース URL（デフォルト: `http://localhost:3000`） |
| `RESEND_API_KEY` | ✅ | Resend の API キー。未設定時はメール送信をスキップ |
| `RESEND_FROM_EMAIL` | — | 送信元アドレス（デフォルト: `noreply@example.com`） |
| `CRON_SECRET` | ✅ | Vercel Cron Job の認証トークン。`openssl rand -base64 32` で生成 |

`RESEND_API_KEY` と `CRON_SECRET` は Vercel の Environment Variables にも同じ値を登録すること。

## Vercel Cron Job

`vercel.json` に以下の Cron を定義している。

| パス | スケジュール | 概要 |
| --- | --- | --- |
| `/api/cron/check-in-reminder` | `0 0 * * *`（毎日 0:00 UTC = 9:00 JST） | 翌日チェックイン予定のゲストにリマインダーメールを送信 |

Cron リクエストは `Authorization: Bearer {CRON_SECRET}` で保護されている。ローカルでのテストは `curl -H "Authorization: Bearer <your_secret>" http://localhost:3000/api/cron/check-in-reminder` で実行できる。
