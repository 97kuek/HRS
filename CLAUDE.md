# CLAUDE.md

このプロジェクトの作業規約は [AGENTS.md](AGENTS.md) に集約しています。
Claude Code で作業する際は、まず **[AGENTS.md](AGENTS.md) を読んでから** 着手してください。

特に重要な点 (詳細は AGENTS.md):

- Publicリポジトリ。授業配布物・個人情報・非公開情報をコミットしない。
- `main` へ直接コミットしない。1 Issue = 1 ブランチ = 1 PR。
- 技術スタックは Issue #23 で決定済み。TypeScript / Next.js App Router / Prisma / Postgres を使う。
- 実装コードは `src/`、DBスキーマは `prisma/` に配置する。
- Pull Request の最終送信・レビュー依頼は、人間の確認を得てから行う。

人間向けのAIツール利用ガイドは [docs/ai-agents-guide.md](docs/ai-agents-guide.md) を参照してください。
