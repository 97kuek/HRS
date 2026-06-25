# Docs

HRSチーム開発の資料と成果物を管理します。

GitやGitHubの基本操作は[git-beginner-guide.md](git-beginner-guide.md)を確認してください。

## Where to Put Files

```text
docs/
├── チーム開発1.pdf
├── git-beginner-guide.md
├── domain-analysis/
├── requirements-analysis/
├── system-analysis/
├── architecture-design/
├── tech-stack/
├── reviews/
└── presentation/
```

| Directory | Purpose |
| --- | --- |
| `domain-analysis/` | 問題領域のクラス図、オブジェクト図、用語整理 |
| `requirements-analysis/` | ユースケース図、ユースケース記述、アクティビティ図 |
| `system-analysis/` | コラボレーション図、分析クラス図 |
| `architecture-design/` | アーキテクチャ設計図、レイヤー責務、実装モジュール設計 |
| `tech-stack/` | 技術選定の記録 ([Issue #23](https://github.com/97kuek/HRS/issues/23)) |
| `reviews/` | レビュー結果、指摘事項、修正判断 |
| `presentation/` | 3分発表資料、デモ手順、発表メモ |

WebアプリケーションのソースコードはこのDocs配下ではなく、リポジトリのルートまたはサブディレクトリ(例: `frontend/`, `backend/`)に配置します。具体的な構成は技術スタック決定([Issue #23](https://github.com/97kuek/HRS/issues/23))後に確定します。

## Naming Rules

- ファイル名は内容が分かる名前にする
- 日付を入れる場合は `YYYY-MM-DD` 形式にする
- レビュー後の版は同じファイルを更新し、必要ならPRで差分を確認する
- 図の元ファイルと画像を書き出す場合は同じ名前にする

Examples:

```text
domain-analysis/class-diagram.md
domain-analysis/class-diagram.png
requirements-analysis/usecase-description-reservation.md
reviews/domain-analysis-review-2026-06-19.md
presentation/2026-07-03-demo.md
```

## Work Order

1. `domain-analysis/` で問題領域の用語と関係を整理する
2. `requirements-analysis/` で利用者のユースケースを整理する
3. `system-analysis/` でバウンダリ、コントロール、エンティティを整理する
4. `architecture-design/` でWebアプリケーションの構成と実装モジュールを整理する
5. `reviews/` にレビュー結果を残す
6. `presentation/` に発表資料とデモ手順を置く

## Review

レビューはPull Requestまたはレビュー用Issueで行います。指摘事項は「何が問題か」「なぜ問題か」「どう直すか」が分かるように書きます。
