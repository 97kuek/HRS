# AGENTS.md

- 対象: HRS リポジトリで作業する AI コーディングエージェント
- 目的: 安全性、成果物の一貫性、開発手順を統一する
- 適用先:

| ツール                       | 読み込み先                       |
| ---------------------------- | -------------------------------- |
| Claude Code                  | `CLAUDE.md` から本ファイルを参照 |
| Codex / AGENTS.md 対応ツール | 本ファイル                       |

## プロジェクト

| 項目       | 内容                                                   |
| ---------- | ------------------------------------------------------ |
| 名称       | HRS（Hotel Reservation System）                        |
| 用途       | ソフトウェア工学 A のチーム開発課題                    |
| 開発範囲   | UML による分析・設計、Web アプリケーションの実装・保守 |
| 技術       | TypeScript / Next.js App Router / Prisma / PostgreSQL  |
| メール     | Resend                                                 |
| リポジトリ | Public                                                 |

## 最重要ルール

1. Public リポジトリに公開できる情報だけを扱う
2. 授業配布物は、公開許可と再配布権を確認できたものだけを追加する
3. 個人情報、秘密情報、提出条件に関わる非公開情報を追加しない
4. 1 Issue / 1 成果物 / 1 ブランチ / 1 Pull Request を守る
5. `main` に直接コミットまたは push しない
6. 決定済みの技術スタックから独断で逸脱しない
7. UML、ユースケース、コード、README で同じ概念に同じ用語を使う
8. Pull Request の最終送信とレビュー依頼は人間の確認後に行う

## リポジトリ構成

```text
.
├── .github/                   # Issue / Pull Request テンプレート
├── docs/                      # 分析・設計・レビュー・発表資料
├── prisma/                    # DB スキーマ、マイグレーション、初期データ
├── src/
│   ├── app/                   # 画面、Route Handlers
│   └── lib/                   # 業務ロジック、共通処理
├── AGENTS.md                  # AI エージェント向け規約
├── CLAUDE.md                  # Claude Code 用ポインタ
├── CONTRIBUTING.md            # 開発手順
├── README.md                  # プロジェクト概要
└── .env.example              # 環境変数テンプレート
```

| 成果物                 | 配置                                 |
| ---------------------- | ------------------------------------ |
| 画面                   | `src/app/**/page.tsx`                |
| Route Handler          | `src/app/api/**/route.ts`            |
| 共通処理・業務ロジック | `src/lib/`                           |
| Prisma スキーマ        | `prisma/schema.prisma`               |
| マイグレーション       | `prisma/migrations/`                 |
| 単体テスト             | `src/lib/**/__tests__/*.test.ts`     |
| API 結合テスト         | `src/app/api/**/__tests__/*.test.ts` |
| 分析・設計資料         | `docs/`                              |

## 作業手順

1. 対象 Issue の目的、成果物、チェックリストを確認する
2. `main` を最新化し、Issue 番号付きブランチを作成する
3. Issue の範囲に限定して変更する
4. 関連するコード、UML、README の整合性を確認する
5. 変更内容に応じた検証を実行する
6. 差分に秘密情報や無関係な変更がないことを確認する
7. 規約に沿ったコミットを作成する
8. Pull Request に `Closes #<issue-number>` を記載する
9. 人間の確認後に Pull Request を最終送信する

## ブランチとコミット

| 対象         | 形式                                  | 例                              |
| ------------ | ------------------------------------- | ------------------------------- |
| ドキュメント | `docs/<issue-number>-<short-name>`    | `docs/83-document-maintenance`  |
| 機能追加     | `feature/<issue-number>-<short-name>` | `feature/12-reservation-search` |
| 修正         | `fix/<issue-number>-<short-name>`     | `fix/18-checkin-flow`           |
| コミット     | `<type>: <summary>`                   | `docs: READMEを整理`            |

- コミット type: `docs` / `feat` / `fix` / `test` / `refactor` / `chore`
- 詳細: [CONTRIBUTING.md](CONTRIBUTING.md)

## 変更時の判断

| 状況                       | 対応                                             |
| -------------------------- | ------------------------------------------------ |
| 要求が曖昧                 | 既存の Issue、設計資料、実装を確認してから判断   |
| スタック外の技術が必要     | 追加前に人間へ確認                               |
| 既存の未コミット変更がある | 所有者の変更として保持し、無関係な差分を触らない |
| ドキュメントを変更         | 関連 README、リンク、用語を確認                  |
| Prisma スキーマを変更      | migration を作成し、Prisma Client を再生成       |
| 時刻依存処理をテスト       | `todayInHotelTz` などを `vi.mock` で固定         |
| DB を使う処理              | テスト戦略に従い、必要なら受入テストで確認       |

## 検証

```powershell
npm run lint
npm test
npm run build
```

| 変更             | 追加の検証                                                |
| ---------------- | --------------------------------------------------------- |
| Prisma スキーマ  | `npm run prisma:generate`                                 |
| フォーマット対象 | `npm run format:check`                                    |
| ローカル動作     | `npm run dev`                                             |
| 受入シナリオ     | `docs/analysis/requirements/acceptance-test-checklist.md` |

- テスト方針: [docs/design/test-strategy.md](docs/design/test-strategy.md)
- DB 接続不要のテストを自動テストの基本とする
- Prisma を使う `searchAvailability` などは、テスト戦略に従って手動確認する

## 環境変数と外部サービス

- `.env.example` をテンプレートとして使う
- 実値は gitignore 対象の `.env` に設定する
- 接続 URL、API キー、実在する個人情報を Issue、Pull Request、ログへ貼らない
- Vercel に必要な値は Environment Variables に設定する

| 変数                | 用途                    |
| ------------------- | ----------------------- |
| `DATABASE_URL`      | PostgreSQL 接続         |
| `RESEND_API_KEY`    | Resend API キー         |
| `RESEND_FROM_EMAIL` | メール送信元            |
| `CRON_SECRET`       | Cron API の Bearer 認証 |

## 禁止事項

- `main` への直接 push、force push
- `.env` や秘密情報のコミット
- 無関係な依存関係や技術基盤の追加
- Issue の範囲外の変更
- 大量の自動生成ファイルのコミット
- レビューチェックリストを無視した完了扱い
- 既存の未コミット変更を無断で破棄または上書き
