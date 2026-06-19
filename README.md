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
git checkout -b docs/<issue-number>-<short-name>
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

> 実装の技術スタック (言語・フレームワーク・API設計・DB設計) は今後決定します。検討は [Issue #23](https://github.com/97kuek/HRS/issues/23) で管理します。

## Team

| Role | Name | GitHub | Contact |
| --- | --- | --- | --- |
| Member | Keitaro Ueki | [@97kuek](https://github.com/97kuek) | keitaro.ueki@icloud.com |
| Member | Tomoya Hoshina | [@Tomuzou](https://github.com/Tomuzou) | tomuzouhp@outlook.jp |
| Member | TBD | TBD |
| Member | TBD | TBD |
| Member | TBD | TBD |
| Member | TBD | TBD |

## Repository Structure

```text
.
├── docs/
│   ├── チーム開発1.pdf
│   ├── git-beginner-guide.md
│   ├── ai-agents-guide.md
│   └── README.md
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── AGENTS.md
├── CLAUDE.md
├── LICENSE
├── .gitignore
├── CONTRIBUTING.md
└── README.md
```

Webアプリケーションのソースコードはリポジトリのルートまたはサブディレクトリ(例: `frontend/`, `backend/`)に配置します。具体的なディレクトリ構成は技術スタック決定後に確定します。

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
