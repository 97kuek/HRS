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
- 技術スタック (言語・フレームワーク・API設計・DB設計) は未定。決定は Issue #23 で管理する。
- リポジトリはPublic運用。

## 最重要ルール

1. **Publicリポジトリである。** 授業の提供コード、配布資料の再配布、個人情報、提出条件に関わる
   非公開情報をコミットしない。`docs/チーム開発1.pdf` 以外の授業配布物を追加しないこと。
2. **1 Issue / 1 成果物 = 1 ブランチ = 1 PR。** `main` へ直接コミットしない。
3. **勝手にスタックを決めない。** 技術スタックが未確定の作業 (#23 が未完了) では、特定の言語・
   フレームワークに依存するコードや設定ファイルを新規追加しない。判断が必要なら人間に確認する。
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
└── (実装コード)               # スタック決定後に配置 (例: src/, app/, frontend/, backend/)
```

実装コードのディレクトリ構成は技術スタック決定 (#23) 後に確定する。

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
- 未確定スタックを既成事実化する依存ファイル (package.json, requirements.txt, pom.xml 等) の独断追加。
- レビューチェックリスト (各 docs サブディレクトリ・`.github/ISSUE_TEMPLATE/review.md`) を無視した成果物の完了。
- 大量の自動生成ファイルや秘密情報 (`.env` 等) のコミット。

## 検証

スタック未定のため、現時点では自動テスト・ビルドコマンドは未整備。
実装着手後 (スタック決定後) に、ビルド・テスト・起動コマンドをこのセクションへ追記すること。
