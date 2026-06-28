# 環境変数・デプロイ設計

- 対象 Issue: [#15](https://github.com/97kuek/HRS/issues/15)
- 前提: [技術選定の記録](../tech-stack/README.md), [DB設計](db-design.md)
- 状態: **ドラフト**（実装開始後に実際のコマンドへ更新する）

HRS を Next.js / Prisma / Postgres で実装・起動・デプロイするための環境変数、環境分離、デプロイ手順の方針を定義する。現時点では実装コードが未作成のため、具体的なコマンドは実装開始後に確定する。

## 基本方針

- 秘密情報をリポジトリへコミットしない。
- `.env` はコミットしない。必要なキーだけ `.env.example` に記載する。
- 開発環境、プレビュー環境、本番環境でDBを分ける。
- Prisma migration は本番デプロイ時に明示的に適用する。
- Public リポジトリであるため、接続文字列、APIキー、提出条件に関わる情報をIssueやPR本文にも貼らない。

## 環境区分

| 環境 | 用途 | DB |
| --- | --- | --- |
| local | 各メンバーの開発・動作確認 | ローカルまたは開発用 Postgres |
| preview | PRやデモ前の確認 | プレビュー用 Postgres |
| production | 提出・発表用の安定版 | 本番用 Postgres |

初期実装ではデプロイ先を Vercel などの Next.js 対応環境として想定する。ただし、具体的なサービス名と設定値は実装・運用時に確定する。

## 環境変数

| 変数 | 必須 | 用途 | 備考 |
| --- | --- | --- | --- |
| `DATABASE_URL` | yes | Prisma が接続する Postgres URL | 秘密情報。コミット禁止 |
| `DIRECT_URL` | no | マイグレーション用の直接接続URL | 利用するDBサービスにより要否を決める |
| `NEXT_PUBLIC_APP_NAME` | no | 画面表示用アプリ名 | 公開されてもよい値だけ入れる |
| `APP_BASE_URL` | no | メール送信や外部連携で使うベースURL | 初期実装では未使用 |

`NEXT_PUBLIC_` で始まる値はブラウザへ公開されるため、秘密情報を入れない。

## `.env.example` 方針

実装開始時に `.env.example` を追加する場合は、値をダミーにする。

```env
DATABASE_URL="postgresql://user:password@localhost:5432/hrs_dev"
DIRECT_URL=""
NEXT_PUBLIC_APP_NAME="HRS"
APP_BASE_URL="http://localhost:3000"
```

`.env.local`、`.env.production`、DB接続文字列を含むファイルはコミットしない。

## ローカル開発手順

実コマンドは [README の Development](../../README.md#development) に記載する（#60 で整備）。開発用DBは **Neon（クラウド）を既定**とし、Docker (`docker-compose.yml`) を任意の代替として併記する。手順の流れは次の通り。

1. 依存関係をインストールする。
2. 開発用 Postgres を用意する（Neon プロジェクト作成、または `docker compose up -d`）。
3. `.env.example` をコピーして `.env` を作り、`DATABASE_URL` を接続URLに書き換える。
4. Prisma migration を適用する（`prisma/migrations/` に初回 migration を用意済み）。
5. seed を実行して部屋タイプ・部屋を投入する。
6. Next.js の開発サーバーを起動する。

## デプロイ手順

| 手順 | 内容 |
| --- | --- |
| 1 | デプロイ先に環境変数を登録する |
| 2 | Postgres を用意し、`DATABASE_URL` を接続する |
| 3 | build 前または deploy 前に Prisma Client を生成する |
| 4 | 本番DBへ migration を適用する |
| 5 | Next.js アプリを build してデプロイする |
| 6 | 予約作成、予約確認、チェックイン、チェックアウトの主要フローを確認する |

マイグレーションを本番DBへ適用するタイミングは、デプロイ先の仕組みに合わせて決める。自動実行にする場合でも、失敗時にデプロイを止められる構成にする。

### 実構成（#62）

- デプロイ先は **Vercel**、本番DBは **Neon**。
- `vercel.json` の `buildCommand` を `prisma migrate deploy && next build` とし、本番DBへ migration を適用してからビルドする。migration が失敗するとビルドも止まりデプロイされない。
- `package.json` の `postinstall: prisma generate` で、Vercel の依存キャッシュ時も Prisma Client を確実に生成する。
- `DATABASE_URL`（本番）は Vercel の環境変数に登録し、リポジトリには置かない。
- 具体的な手順は [README の Deployment](../../README.md#deployment) を参照。

## Prisma migration 方針

- `schema.prisma` をDBスキーマの正とする。
- スキーマ変更は migration ファイルとしてレビュー対象に含める。
- 本番では `prisma db push` ではなく migration を使う。
- seed データはデモに必要な部屋タイプ、部屋だけに限定し、個人情報を含めない。

## データ保護

- デモ用データに実在する個人情報を入れない。
- 予約者名や連絡先はテスト用の値を使う。
- ログに `DATABASE_URL`、連絡先、支払情報を出さない。
- 本番環境のDBをローカルへコピーする場合は、個人情報を含まない状態にする。

## 未確定事項

- デプロイ先を Vercel に固定するか、別サービスも許容するか。
- 本番 Postgres の提供元をどこにするか（開発用は Neon を既定に決定。#60）。
- seed データの内容と投入コマンド。
- CI で build、lint、test、migration check をどこまで実行するか。
- 将来ログインや管理者機能を導入する場合の認証用環境変数。
