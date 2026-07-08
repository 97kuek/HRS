# Contributing

- 対象: HRS の開発に参加するメンバー
- 作業前に確認:

| 文書                             | 内容                                |
| -------------------------------- | ----------------------------------- |
| [README.md](README.md)           | 機能、セットアップ、開発コマンド    |
| [docs/README.md](docs/README.md) | 分析・設計成果物の配置              |
| [AGENTS.md](AGENTS.md)           | AI コーディングエージェント向け規約 |

## セットアップ

```powershell
git clone https://github.com/97kuek/HRS.git
cd HRS
npm install
Copy-Item .env.example .env
```

- Git のユーザー情報が未設定の場合:

```powershell
git config --global user.name "<your-name>"
git config --global user.email "<your-email>"
```

- DB の準備と起動方法: [README.md](README.md)

## 作業フロー

| 手順 | 作業                                       |
| ---- | ------------------------------------------ |
| 1    | GitHub Issue を作成または担当する          |
| 2    | Issue を GitHub Projects の `Doing` に移す |
| 3    | `main` を最新化する                        |
| 4    | Issue 番号付きブランチを作成する           |
| 5    | Issue の範囲内で変更し、検証する           |
| 6    | 規約に沿ってコミット、push する            |
| 7    | Pull Request を作成し、レビューを受ける    |
| 8    | マージ後に Issue を `Done` に移す          |

```powershell
git checkout main
git pull
git checkout -b <type>/<issue-number>-<short-name>
```

## ブランチ

| 種別      | 用途                                 | 例                              |
| --------- | ------------------------------------ | ------------------------------- |
| `docs`    | 分析・設計資料、README、レビュー記録 | `docs/83-document-maintenance`  |
| `feature` | 機能追加                             | `feature/12-reservation-search` |
| `fix`     | コードや資料の修正                   | `fix/18-checkin-flow`           |

- 形式: `<type>/<issue-number>-<short-name>`
- `main` は発表・提出可能な状態を維持する
- `main` へ直接コミットまたは push しない

## ファイル命名

- ユーザー定義のファイル名は lowercase kebab-case で統一する
- React コンポーネント、関数、型などの識別子は役割に応じて PascalCase または camelCase を使う
- Next.js の予約ファイルは `page.tsx`、`layout.tsx`、`route.ts`、`not-found.tsx` の形式を維持する
- GitHub、npm、Prisma などのツールが参照する慣例ファイルは既定名を維持する

## ドキュメント文体

- 文体: だ・である調で統一する
- 形式: 箇条書き・表・コードブロックのみ。散文段落は書かない
- 句読点: 読点は `、`、句点は `。` を使う（`.` / `,` は使わない）

## コミット

- 形式:

```text
<type>: <summary>
```

| type       | 用途                            |
| ---------- | ------------------------------- |
| `docs`     | ドキュメント、UML、レビュー記録 |
| `feat`     | 機能追加                        |
| `fix`      | 不具合修正                      |
| `test`     | テスト追加・修正                |
| `refactor` | 振る舞いを変えない整理          |
| `chore`    | 設定、依存関係、保守作業        |

```text
docs: READMEを整理
feat: 予約照会機能を追加
fix: チェックアウト料金の計算を修正
```

## 検証

```powershell
npm run lint
npm test
npm run build
```

- 変更内容に応じて追加:

| 変更               | コマンドまたは確認         |
| ------------------ | -------------------------- |
| Prisma スキーマ    | `npm run prisma:generate`  |
| フォーマット       | `npm run format:check`     |
| 画面・受入シナリオ | `npm run dev` と受入テスト |

## Pull Request

- 1 Issue / 1 成果物 / 1 Pull Request
- タイトルと本文から変更目的が分かるようにする
- 本文に `Closes #<issue-number>` または `Refs #<issue-number>` を記載する
- 実行した検証と結果を記載する
- 最低 1 名のレビューを受ける
- 指摘への修正は同じ Pull Request に追加する
- Public リポジトリに公開できる差分だけを含める

## コンフリクト

- 作業開始時と再開時に `main` を最新化する
- 作業中に `main` が更新された場合:

```powershell
git fetch origin
git merge origin/main
```

- 競合した場合:

1. `git status` で対象ファイルを確認する
2. `<<<<<<<` / `=======` / `>>>>>>>` の範囲を正しい内容へ修正する
3. 競合マーカーを削除する
4. `git add <file>` で解決済みにする
5. 全件解決後に `git commit` する

- 中断:

```powershell
git merge --abort
```

## GitHub Projects

| 状態     | 意味         |
| -------- | ------------ |
| `Todo`   | 未着手       |
| `Doing`  | 作業中       |
| `Review` | レビュー待ち |
| `Done`   | 完了         |

- Issue は技術レイヤーではなく、ユースケースまたは成果物単位で作成する
- 新規 Issue は `.github/ISSUE_TEMPLATE/` のテンプレートを使う

## レビュー

- Pull Request またはレビュー Issue で実施する
- 対象に応じたチェックリストを使用する
- 指摘には次の3点を含める
  - 問題点
  - 問題となる理由
  - 修正案
- UML、ユースケース、実装、README の用語と振る舞いが一致しているか確認する

## Public リポジトリ

- コミットしないもの:
  - 接続 URL、API キー、`.env`
  - 個人情報
  - 提出条件に関わる非公開情報
  - 許可されていない授業配布物
- Issue や Pull Request にも秘密情報を記載しない
