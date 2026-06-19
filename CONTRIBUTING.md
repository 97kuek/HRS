# Contributing

HRSチーム開発に参加するメンバー向けの作業ルールです。新しく作業を始める前に、このファイルと[docs/README.md](docs/README.md)を確認してください。

## Repository Setup

代表者のGitHubアカウントは `97kuek` です。

初回だけGitHub CLIでログインします。

```powershell
gh auth login -h github.com
```

代表者の個人アカウント配下にPublicリポジトリを作成し、ローカルの `main` をpushします。

```powershell
gh repo create HRS --public --source . --remote origin --push
```

リポジトリを作成済みの場合は、remoteだけ設定してpushします。

```powershell
git remote add origin https://github.com/97kuek/HRS.git
git push -u origin main
```

Gitのユーザー情報が未設定の場合は、自分の名前とメールアドレスを設定します。

代表者:

```powershell
git config user.name "Keitaro Ueki"
git config user.email "keitaro.ueki@icloud.com"
```

他のメンバー:

```powershell
git config user.name "<your-name>"
git config user.email "<your-email>"
```

## Daily Workflow

1. GitHub Projectsで担当Issueを決める
2. Issueを `Doing` に移す
3. `main` を最新化する
4. Issue番号付きのブランチを作る
5. 変更してコミットする
6. Pull Requestを作る
7. レビュー後に `main` へマージする
8. Issueを `Done` に移す

```powershell
git checkout main
git pull
git checkout -b docs/<issue-number>-<short-name>
```

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

## Initial Issues

GitHubリポジトリ作成後、以下のIssueを作成します。

```powershell
gh issue create --title "ドメイン分析: UMLクラス図を作成する" --body "HRSの問題領域を分析し、UMLクラス図の初版を作成する。" --label task
gh issue create --title "ドメイン分析: オブジェクト図でクラス図を検証する" --body "具体的な状況に対するUMLオブジェクト図を作成し、クラス図を検証する。" --label task
gh issue create --title "要求分析: 主要ユースケースを3つ以上特定する" --body "HRSに期待される重要な動作を3つ以上特定し、ユースケース図に反映する。" --label task
gh issue create --title "要求分析: ユースケース記述を作成する" --body "各ユースケースの事前条件、事後条件、基本系列、代替・例外系列を記述する。" --label task
gh issue create --title "要求分析: アクティビティ図を作成する" --body "主要ユースケースの振る舞いをアクティビティ図として表現する。" --label task
gh issue create --title "システム分析: コラボレーション図を作成する" --body "ユースケース分析結果をUMLコラボレーション図として表現する。" --label task
gh issue create --title "システム分析: 分析クラス図を作成する" --body "バウンダリ、コントロール、エンティティを識別し、分析クラス図を作成する。" --label task
gh issue create --title "レビュー: ドメイン分析成果物を確認する" --body "授業資料のレビュー項目に沿ってドメイン分析成果物を確認する。" --label review
gh issue create --title "レビュー: 要求分析成果物を確認する" --body "授業資料のレビュー項目に沿って要求分析成果物を確認する。" --label review
gh issue create --title "発表準備: 3分発表資料を作成する" --body "分析設計または実装デモの3分発表資料を作成する。" --label task
```

## GitHub Project Creation

```powershell
gh project create --owner 97kuek --title "HRS Team Development"
```

作成後、GitHubの画面で `Todo`, `Doing`, `Review`, `Done` のBoard列を用意します。

## Recommended Repository Settings

GitHubの画面で以下を設定します。

- `Settings` > `Collaborators and teams` からチームメンバーを招待する
- `Settings` > `Branches` で `main` のBranch protection ruleを作る
- `Require a pull request before merging` を有効にする
- `Require approvals` を1にする

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
