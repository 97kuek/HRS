# HRS - Hotel Reservation System

ソフトウェア工学Aのチーム開発で扱うホテル予約システム(HRS)のリポジトリです。

## Project Goal

UMLを用いたオブジェクト指向分析設計を行い、提供される半完成コードを理解したうえで、Javaによる一部追加実装と保守を行います。

主な成果物は以下です。

- ドメイン分析: UMLクラス図、UMLオブジェクト図
- 要求分析: ユースケース図、ユースケース記述、アクティビティ図
- システム分析: UMLコラボレーション図、分析クラス図
- 実装: 提供コードへの追加実装
- レビュー記録、発表資料

## Team

| Role | Name | GitHub |
| --- | --- | --- |
| Lead | TBD | TBD |
| Member | TBD | TBD |
| Member | TBD | TBD |
| Member | TBD | TBD |
| Member | TBD | TBD |
| Member | TBD | TBD |

## Repository Structure

```text
.
├── docs/
│   ├── チーム開発1.pdf
│   └── README.md
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── .gitignore
└── README.md
```

Javaの実装コードは、授業で提供される半完成コードを受け取った後に配置します。

## GitHub Project

作業管理にはGitHub Projectsのかんばんボードを使います。

Columns:

- `Todo`: 未着手
- `Doing`: 作業中
- `Review`: レビュー待ち
- `Done`: 完了

Issueは技術レイヤー別ではなく、ユースケースや成果物単位で作成します。

初期Issue例:

- ドメイン分析: UMLクラス図を作成する
- ドメイン分析: オブジェクト図でクラス図を検証する
- 要求分析: 主要ユースケースを3つ以上特定する
- 要求分析: ユースケース記述を作成する
- 要求分析: アクティビティ図を作成する
- システム分析: コラボレーション図を作成する
- システム分析: 分析クラス図を作成する
- レビュー: ドメイン分析成果物を確認する
- レビュー: 要求分析成果物を確認する
- 発表準備: 3分発表資料を作成する

## Branch Rules

- `main`: 発表・提出可能な安定版のみを置く
- `feature/<issue-number>-<short-name>`: 新規作業
- `fix/<issue-number>-<short-name>`: 修正
- `docs/<issue-number>-<short-name>`: 分析設計資料、README、レビュー記録

Examples:

```text
docs/3-usecase-description
feature/12-reservation-search
fix/18-checkin-flow
```

`main` への直接pushは避け、Pull Request経由でマージします。

## Commit Message Rules

形式:

```text
<type>: <summary>
```

type:

- `docs`: ドキュメント、UML、レビュー記録
- `feat`: 機能追加
- `fix`: バグ修正
- `test`: テスト追加・修正
- `refactor`: 振る舞いを変えない整理
- `chore`: 設定、雑務

Examples:

```text
docs: add domain analysis class diagram draft
docs: ドメイン分析の初版を追加
feat: add reservation number lookup
fix: correct checkout fee calculation
```

## Pull Request Rules

- 1つのPRは1つのIssueまたは1つの成果物に対応させる
- PR本文に `Closes #<issue-number>` または `Refs #<issue-number>` を書く
- 最低1名がレビューする
- レビューで指摘された内容は、同じPR上で修正する

## Review Focus

レビューでは授業資料のチェックリストを使います。特に以下を確認します。

- 図が読みやすい
- 用語がHRSの問題領域に合っている
- 実装都合ではなく問題領域の概念を表している
- ユースケースが具体的な振る舞いとして書かれている
- 事前条件、事後条件、基本系列、代替・例外系列が明確である
- システム分析の相互作用がユースケース記述と対応している

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
