# GitHub Setup

GitHub CLIでPublicリポジトリ、初期Issue、Projectを作成する手順です。

## 1. Authenticate

```powershell
gh auth login -h github.com
```

## 2. Create Public Repository

代表者の個人アカウント配下にPublicリポジトリを作成します。

```powershell
gh repo create HRS --public --source . --remote origin --push
```

リポジトリ名を変える場合:

```powershell
gh repo create hotel-reservation-system --public --source . --remote origin --push
```

## 3. Create Initial Issues

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

## 4. Create GitHub Project

```powershell
gh project create --owner <github-user-name> --title "HRS Team Development"
```

作成後、GitHubの画面で以下のBoard列を用意します。

- `Todo`
- `Doing`
- `Review`
- `Done`

各IssueをProjectに追加し、初期状態は `Todo` に置きます。

## 5. Recommended Repository Settings

GitHubの画面で以下を設定します。

- `Settings` > `Collaborators and teams` からチームメンバーを招待する
- `Settings` > `Branches` で `main` のBranch protection ruleを作る
- `Require a pull request before merging` を有効にする
- `Require approvals` を1にする

Publicリポジトリのため、授業資料、提供コード、個人情報を追加する前に公開可否を確認してください。
