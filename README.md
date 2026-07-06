# HRS

- ホテルの予約からチェックアウトまでを利用者自身で行う Web アプリケーション
- ソフトウェア工学 A チーム 6 の成果物
- UML によるオブジェクト指向分析・設計と、その設計に基づく実装を管理

## 主な機能

| 機能           | URL                    | 概要                                                       |
| -------------- | ---------------------- | ---------------------------------------------------------- |
| 予約           | `/reservations/new`    | 日程・客室・宿泊者情報を入力して予約                       |
| 予約確認       | `/reservations/lookup` | 予約番号と氏名で予約内容を照会                             |
| 予約キャンセル | `/reservations/cancel` | 予約番号と氏名で予約をキャンセル                           |
| チェックイン   | `/check-in`            | 予約情報を照合し、部屋を割り当て                           |
| チェックアウト | `/check-out`           | 料金と支払い方法を確認し、宿泊を完了                       |
| メール通知     | —                      | 予約、キャンセル、チェックイン前日、チェックアウト時に送信 |

- 予約情報の照合には、予約番号と宿泊代表者の氏名を使用
- メール送信には Resend を使用
- チェックイン前日の通知は Vercel Cron Job で毎日 9:00 JST に実行

## 技術構成

| 用途             | 技術                                    |
| ---------------- | --------------------------------------- |
| アプリケーション | TypeScript / Next.js App Router / React |
| API              | Next.js Route Handlers                  |
| データアクセス   | Prisma                                  |
| データベース     | PostgreSQL（Neon または Docker）        |
| メール送信       | Resend                                  |
| テスト           | Vitest                                  |
| デプロイ         | Vercel / Neon                           |

## セットアップ

### 必要な環境

- Node.js
- npm
- PostgreSQL
  - Neon のプロジェクト
  - または Docker Desktop

### 1. リポジトリと環境変数の準備

```powershell
git clone https://github.com/97kuek/HRS.git
cd HRS
npm install
Copy-Item .env.example .env
```

- Neon を使う場合
  - `.env` の `DATABASE_URL` に Direct connection の URL を設定
- Docker を使う場合
  - `.env.example` の `DATABASE_URL` をそのまま使用可能

```powershell
docker compose up -d
docker compose ps
```

### 2. データベースの準備

```powershell
npm run prisma:migrate
npm run prisma:seed
```

### 3. 開発サーバーの起動

```powershell
npm run dev
```

- URL: <http://localhost:3000>

## 環境変数

| 変数                | 必須となる場合 | 用途                    |
| ------------------- | -------------- | ----------------------- |
| `DATABASE_URL`      | 常時           | PostgreSQL 接続 URL     |
| `RESEND_API_KEY`    | メール送信時   | Resend API キー         |
| `RESEND_FROM_EMAIL` | メール送信時   | 送信元メールアドレス    |
| `CRON_SECRET`       | Cron 実行時    | Cron API の認証トークン |

- 設定例と補足: [.env.example](.env.example)
- `.env`、接続 URL、API キーなどの秘密情報はコミットしない
- `RESEND_API_KEY` が未設定の場合、メール送信のみスキップ

## 開発コマンド

| コマンド                  | 用途                                   |
| ------------------------- | -------------------------------------- |
| `npm run dev`             | 開発サーバーを起動                     |
| `npm run lint`            | ESLint を実行                          |
| `npm test`                | テストを 1 回実行                      |
| `npm run test:watch`      | テストを監視モードで実行               |
| `npm run test:coverage`   | カバレッジを取得                       |
| `npm run build`           | 本番ビルドを検証                       |
| `npm run prisma:generate` | Prisma Client を生成                   |
| `npm run prisma:migrate`  | 開発 DB にマイグレーションを作成・適用 |
| `npm run prisma:seed`     | 初期データを投入                       |
| `npm run prisma:studio`   | Prisma Studio を起動                   |

### 検証

```powershell
npm run lint
npm test
npm run build
```

## リポジトリ構成

```text
.
├── docs/                 # 分析・設計・レビュー・発表資料
├── prisma/               # DB スキーマ、マイグレーション、初期データ
├── src/
│   ├── app/              # 画面、Route Handlers
│   └── lib/              # 業務ロジック、共通処理
├── AGENTS.md             # AI エージェント向け規約
├── CONTRIBUTING.md       # 開発ルール
└── package.json
```

## ドキュメント

| 文書                                             | 内容                                    |
| ------------------------------------------------ | --------------------------------------- |
| [docs/README.md](docs/README.md)                 | 成果物の構成と配置                      |
| [ドメイン分析](docs/analysis/domain/README.md)   | クラス図、オブジェクト図                |
| [要求分析](docs/analysis/requirements/README.md) | ユースケース図・記述、アクティビティ図  |
| [システム分析](docs/analysis/system/README.md)   | コラボレーション図、分析資料            |
| [設計](docs/design/README.md)                    | API、DB、画面、デプロイ、テスト設計     |
| [技術スタック](docs/design/tech-stack.md)        | 技術選定の記録                          |
| [CONTRIBUTING.md](CONTRIBUTING.md)               | ブランチ、コミット、Pull Request の規約 |

## 開発ルール

- 1 Issue / 1 成果物 / 1 ブランチ / 1 Pull Request
- `main` へ直接コミットしない
- ブランチ名: `<type>/<issue-number>-<short-name>`
- コミット: `<type>: <summary>`
- Public リポジトリに秘密情報、個人情報、許可されていない授業配布物を追加しない
- 詳細は [CONTRIBUTING.md](CONTRIBUTING.md) と [AGENTS.md](AGENTS.md) を参照

## デプロイ

- 構成: Vercel（アプリケーション）/ Neon（PostgreSQL）
- `main` の更新時に Vercel がビルド・デプロイ
- ビルド時に `prisma migrate deploy` を実行
- 詳細: [環境変数・デプロイ設計](docs/design/deployment-environment-design.md)

## ライセンス

- [MIT License](LICENSE)
