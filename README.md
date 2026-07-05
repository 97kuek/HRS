# HRS - Hotel Reservation System

ソフトウェア工学Aのチーム開発で扱うホテル予約システム(HRS)のリポジトリです。

## Quick Start

1. このREADMEでプロジェクト全体を把握する
2. GitやGitHubに慣れていない場合は [docs/git-beginner-guide.md](docs/git-beginner-guide.md) を読む
3. [CONTRIBUTING.md](CONTRIBUTING.md)で開発ルールを確認する
4. [docs/README.md](docs/README.md)で成果物の置き場所を確認する
5. Claude CodeやCodexなどのAIコーディングツールを使う場合は [docs/ai-agents-guide.md](docs/ai-agents-guide.md) を読む
6. GitHub ProjectsのIssueを1つ選び、ブランチを切って作業する

```powershell
git checkout main
git pull
git checkout -b feature/<issue-number>-<short-name>
```

初めて参加するメンバーは、Gitのインストール、clone、ブランチ作成、コミット、push、Pull Request作成までを [Git Beginner Guide](docs/git-beginner-guide.md) の順番どおりに進めてください。

## Project Goal

UMLを用いたオブジェクト指向分析設計を行い、ホテル予約システム(HRS)を**Webアプリケーション**として実装・保守します。実装形態は自由です。

主な成果物は以下です。

- ドメイン分析: UMLクラス図、UMLオブジェクト図
- 要求分析: ユースケース図、ユースケース記述、アクティビティ図
- システム分析: UMLコラボレーション図、分析クラス図
- 実装: HRSのWebアプリケーション
- レビュー記録、発表資料

実装の技術スタックは [Issue #23](https://github.com/97kuek/HRS/issues/23) で決定済みです。TypeScript / Next.js App Router / Prisma / Postgres を使います。

## Application Features

現在の実装で提供している画面・機能の一覧です。

| 画面 | URL | 概要 |
| --- | --- | --- |
| トップ | `/` | ヒーローギャラリー、ご利用の流れ、各種お手続きへのリンク |
| 部屋を予約する | `/reservations/new` | 日程・客室選択・宿泊者情報の5ステップ予約フロー |
| 予約を確認する | `/reservations/lookup` | 予約番号＋氏名で予約内容・ステータスを照会 |
| 予約をキャンセルする | `/reservations/cancel` | 予約番号＋氏名でキャンセル（`?r=` で予約番号を事前入力可） |
| チェックイン | `/check-in` | 予約番号＋氏名でチェックイン・部屋番号を発行 |
| チェックアウト | `/check-out` | 部屋番号で料金照会・支払い方法選択・退室処理 |

### ステータス別の導線

| 予約ステータス | 「予約を確認する」結果画面で表示されるアクション |
| --- | --- |
| `RESERVED`（チェックイン当日） | チェックインへ進む（プライマリ）＋キャンセルする |
| `RESERVED`（当日以外） | キャンセルする |
| `CHECKED_IN` | チェックアウトへ進む |
| `CHECKED_OUT` / `CANCELLED` | なし（状態のみ表示） |

### メール通知

予約時に登録したメールアドレスに対して、以下のタイミングで自動送信されます。

| タイミング | 内容 |
| --- | --- |
| 予約確定時 | 予約番号・宿泊内容を含む確認メール |
| キャンセル時 | キャンセル完了通知メール |
| チェックイン前日（9:00 JST） | 翌日のチェックインご案内メール（Vercel Cron Job） |
| チェックアウト完了時 | 宿泊履歴・支払い内容を含む領収メール |

メール送信に [Resend](https://resend.com) を使用しています。`RESEND_API_KEY` が未設定の場合は送信をスキップし、予約・チェックアウト処理には影響しません。

### セキュリティ

- 予約照会・キャンセル・チェックイン はいずれも **予約番号＋宿泊代表者の氏名（姓・名）** で本人照合を行います。

## Development

### 必要なもの

- Node.js
- npm
- 開発用 Postgres（**既定は [Neon](https://neon.tech) のクラウドDB**。各自が無料プロジェクトを1つ作る。Docker等のローカルDBでも可）
- Docker Desktop（ローカルDBを使う場合）

Dockerを選ぶ場合は、PostgreSQLだけをコンテナで動かします。Next.jsはコンテナに入れず、`npm run dev`で直接起動します。

> public リポジトリです。接続URL・APIキー・実在する個人情報は `.env`（コミット禁止）にだけ書き、Issue や PR にも貼らないでください。

### 1. 開発DBを用意する（どちらか）

#### A. Neon（推奨・インストール不要）

1. [neon.tech](https://neon.tech) でサインアップし、プロジェクトを1つ作成する。
2. ダッシュボードの **Direct connection** の接続URLをコピーする。

#### B. Docker（任意の代替・ローカルで完結）

Docker Desktopを起動してから、リポジトリのルートで次を実行します。

```powershell
docker compose up -d
docker compose ps
```

初回はPostgreSQLイメージをダウンロードするため、少し時間がかかります。`docker compose ps`で`db`が`healthy`になれば、`postgresql://hrs_user:hrs_password@localhost:5432/hrs_dev`で接続できます。

### 2. セットアップ

依存パッケージと環境変数を準備します。

```powershell
npm install
Copy-Item .env.example .env   # .env の DATABASE_URL を 1. の接続URLに書き換える
npm run prisma:generate
npm run prisma:migrate         # 初回マイグレーションをDBへ適用
npm run prisma:seed            # 部屋タイプ・部屋の初期データを投入
```

### 3. 起動

```powershell
npm run dev
```

既定では http://localhost:3000 で起動します。

### 4. Docker DBの停止と初期化

Dockerを選んだ場合、DBを停止するには次を実行します。

```powershell
docker compose stop
```

停止したDBを再開する場合:

```powershell
docker compose start
```

コンテナを削除しても、DBのデータはDockerボリュームに残ります。

```powershell
docker compose down
```

DBのデータも含めて完全に作り直す場合だけ、次を実行します。この操作ではローカルDBのデータがすべて削除されます。

```powershell
docker compose down -v
```

### 検証

```powershell
npm run lint
npm run build
```

### テスト

業務ロジックの単体テストには [Vitest](https://vitest.dev/) を使います。DB 接続不要で実行できます。

```powershell
npm test               # 全テストを一度実行
npm run test:watch     # ファイル保存のたびに自動再実行（開発中）
npm run test:coverage  # カバレッジレポートを出力
```

テストファイルは `src/**/__tests__/*.test.ts` に配置しています。対象は DB に触れない純関数です。

DBスキーマ（`prisma/schema.prisma`）を変更したら、マイグレーションを作成して反映します。

```powershell
npm run prisma:migrate   # 変更内容の migration を作成・適用（prisma/migrations/ はコミット対象）
npm run prisma:seed      # 必要に応じて再投入
```

## Deployment

本番は **Vercel（アプリ）+ Neon（本番Postgres）** にデプロイします。ビルド時に `prisma migrate deploy` で本番DBへ migration を適用してから `next build` します（`vercel.json`）。

> 接続URL・秘密情報は Vercel の環境変数にだけ登録し、コミット/Issue/PR に貼らないでください。

### 初回セットアップ（一度だけ）

1. **Neon 本番プロジェクトを作成**し、`Direct connection` の接続URLを取得する（開発用とは別プロジェクト）。
2. **Vercel にこのリポジトリを Import** する（Framework は Next.js が自動検出される）。
3. Vercel の **Settings → Environment Variables** で `DATABASE_URL` に 1. のURLを登録する（Production。必要なら Preview にも）。
4. **Deploy** を実行する。ビルドで初回 migration が本番DBへ適用される。
5. 本番DBへ初期データを一度だけ投入する（ローカルから本番URLを指定して seed）。

   ```powershell
   $env:DATABASE_URL="<Neon本番のURL>"; npm run prisma:seed
   ```

6. 公開URLで予約フローが動くことを確認する。

### 以降の運用

- `main` への push で Vercel が自動ビルド・デプロイする。
- スキーマ変更時は migration を作成（`npm run prisma:migrate`）してコミットすれば、デプロイ時に本番へ自動適用される。

## Team

| Role | Name | GitHub | Contact |
| --- | --- | --- | --- |
| Member | Keitaro Ueki | [@97kuek](https://github.com/97kuek) | keitaro.ueki@icloud.com |
| Member | Tomoya Hoshina | [@Tomuzou](https://github.com/Tomuzou) | tomuzouhp@outlook.jp |
| Member | Takumi Kawasaki | [@5tvs7vztvv-cmd](https://github.com/5tvs7vztvv-cmd) | - |

## Repository Structure

```text
.
├── docs/
│   ├── チーム開発1.pdf
│   ├── git-beginner-guide.md
│   ├── ai-agents-guide.md
│   └── README.md
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   └── lib/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── package.json
├── AGENTS.md
├── CLAUDE.md
├── LICENSE
├── .gitignore
├── CONTRIBUTING.md
└── README.md
```

Webアプリケーションのソースコードは `src/`、DBスキーマは `prisma/` に配置します。Next.js App Router の画面と Route Handler は `src/app/` 配下に置きます。

## How We Work

- 作業管理: GitHub Issues / GitHub Projects
- 進捗列: `Todo`, `Doing`, `Review`, `Done`
- 開発ルール: [CONTRIBUTING.md](CONTRIBUTING.md)
- 成果物管理: [docs/README.md](docs/README.md)
- レビュー: Pull RequestまたはレビューIssueで実施

## Schedule

| Date | Target |
| --- | --- |
| 2026-06-19 | チーム分け、分析作業に着手 |
| 2026-06-26 | ドメイン分析、要求分析、システム分析をほぼ完了 |
| 2026-07-03 | 分析・設計補足、設計・実装・保守をほぼ完了、発表 |
| 2026-07-10 | オンライン発表 |
| 2026-07-17 | 対面発表、まとめ |

## Public Repository Notice

このリポジトリはPublic運用を想定しています。授業資料、提供コード、個人情報、提出条件に関わる内容を追加する前に、公開してよい情報か確認してください。

## License

このリポジトリは [MIT License](LICENSE) の下で公開しています。
