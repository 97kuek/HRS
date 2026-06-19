# docs

HRSチーム開発の資料と成果物を管理します。

## Suggested Layout

```text
docs/
├── チーム開発1.pdf
├── domain-analysis/
├── requirements-analysis/
├── system-analysis/
├── reviews/
└── presentation/
```

## Naming Rules

- ファイル名は内容が分かる名前にする
- 日付を入れる場合は `YYYY-MM-DD` 形式にする
- レビュー後の版は同じファイルを更新し、必要ならPRで差分を確認する

Examples:

```text
domain-analysis/class-diagram.md
requirements-analysis/usecase-description-reservation.md
reviews/domain-analysis-review-2026-06-19.md
presentation/2026-07-03-demo.md
```

## Review

レビューはPull Requestまたはレビュー用Issueで行います。指摘事項は「何が問題か」「なぜ問題か」「どう直すか」が分かるように書きます。
