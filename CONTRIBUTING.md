# Contributing

HRSチーム開発に参加するメンバー向けの作業ルールです。新しく作業を始める前に、このファイルと[docs/README.md](docs/README.md)を確認してください。

Gitをまだインストールしていない人、cloneやcommitに慣れていない人は、先に[docs/git-beginner-guide.md](docs/git-beginner-guide.md)を読んでください。

Claude CodeやCodexなどのAIコーディングツールを使う場合は、[docs/ai-agents-guide.md](docs/ai-agents-guide.md)とリポジトリルートの[AGENTS.md](AGENTS.md)を確認してください。AIエージェントは作業前に`AGENTS.md`(Claude Codeは`CLAUDE.md`経由)を読み込みます。

## Repository Setup

チームメンバーとして参加する場合は、まずリポジトリを自分のPCにコピーします。

```powershell
git clone https://github.com/97kuek/HRS.git
cd HRS
```

Gitのユーザー情報が未設定の場合は、自分の名前とメールアドレスを設定します。

```powershell
git config --global user.name "<your-name>"
git config --global user.email "<your-email>"
```

## Daily Workflow

1. GitHub Projectsで担当Issueを決める
2. Issueを `Doing` に移す
3. `main` を最新化する（**作業開始前に必ず `git pull` する**）
4. Issue番号付きのブランチを作る
5. 変更してコミットする
6. Pull Requestを作る
7. レビュー後に `main` へマージする
8. Issueを `Done` に移す

> **作業を始める前に必ず `main` を最新化してからブランチを作る**こと。古い `main` から始めると、あとで競合（コンフリクト）が起きやすくなります。

```powershell
git checkout main
git pull
git checkout -b docs/<issue-number>-<short-name>
```

## コンフリクト（競合）の解決

複数人が同じファイルを編集すると、マージ時に競合が起きることがあります。

**予防（いちばん大事）**: 作業を始める前と再開するときに、必ず `main` を最新化する。

作業中に `main` が他の人の変更で進んだら、自分のブランチに最新の `main` を取り込みます。

```powershell
git checkout <your-branch>
git fetch origin
git merge origin/main
```

競合が出たときの手順:

1. `git status` で競合しているファイルを確認する
2. ファイルを開き、`<<<<<<<` / `=======` / `>>>>>>>` のマーカーで挟まれた部分を、正しい内容に手で直す
3. マーカー行（`<<<<<<<` など）を消したら、`git add <file>` で解決済みにする
4. すべて解決したら `git commit`（マージコミット）で確定する
5. 内容に自信がないときは、勝手に上書きせず変更した本人に確認する

途中でやめて元に戻したいときは `git merge --abort` で中断できます。

## Branch Rules

- `main`: 発表・提出可能な安定版のみを置く
- `docs/<issue-number>-<short-name>`: 分析設計資料、README、レビュー記録
- `feature/<issue-number>-<short-name>`: 実装の新規追加
- `fix/<issue-number>-<short-name>`: 資料や実装の修正

Examples:

```text
docs/3-usecase-description
docs/8-domain-review
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
- Publicリポジトリに置いてよい内容だけを含める

## GitHub Project

作業管理にはGitHub Projectsのかんばんボードを使います。

Columns:

- `Todo`: 未着手
- `Doing`: 作業中
- `Review`: レビュー待ち
- `Done`: 完了

Issueは技術レイヤー別ではなく、ユースケースや成果物単位で作成します。

## Issues

分析・設計・実装・発表の各Issueは作成済みです。[GitHub Issues](https://github.com/97kuek/HRS/issues)から担当を選んでください。

Issueは技術レイヤー別ではなく、ユースケースや成果物単位で作成しています。ラベルは`分析` / `設計・実装` / `発表` / `レビュー`、フェーズは`分析フェーズ完了` / `設計・実装フェーズ完了`のマイルストーンで管理します。

新しいIssueを作る場合は、`.github/ISSUE_TEMPLATE/`のテンプレートを利用してください。

## Review Focus

レビューでは授業資料のチェックリストを使います。

- 図が読みやすい
- 用語がHRSの問題領域に合っている
- 実装都合ではなく問題領域の概念を表している
- ユースケースが具体的な振る舞いとして書かれている
- 事前条件、事後条件、基本系列、代替・例外系列が明確である
- システム分析の相互作用がユースケース記述と対応している

## Public Repository Notice

このリポジトリはPublic運用です。授業資料、提供コード、個人情報、提出条件に関わる内容を追加する前に、公開してよい情報か確認してください。
