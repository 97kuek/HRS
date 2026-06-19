# Git Beginner Guide

Gitを初めて使うメンバー向けの作業手順です。まずこのページの順番どおりに進めてください。

## 0. 最初に用意するもの

- GitHubアカウント
- Git
- エディタ

エディタはVisual Studio Codeを推奨します。

## 1. Gitをインストールする

### Windows

1. <https://git-scm.com/download/win> を開く
2. インストーラをダウンロードする
3. 基本的にそのまま `Next` を押してインストールする
4. インストール後、PowerShellを開く
5. 次のコマンドで確認する

```powershell
git --version
```

バージョン番号が表示されればOKです。

### macOS

ターミナルで次を実行します。

```bash
git --version
```

Gitが入っていない場合は、画面の案内に従ってCommand Line Toolsをインストールしてください。

## 2. Gitの名前とメールアドレスを設定する

初回だけ、自分の名前とメールアドレスを登録します。

```powershell
git config --global user.name "自分の名前"
git config --global user.email "自分のメールアドレス"
```

例:

```powershell
git config --global user.name "Taro Yamada"
git config --global user.email "taro@example.com"
```

設定できたか確認します。

```powershell
git config --global user.name
git config --global user.email
```

## 3. リポジトリを自分のPCにコピーする

作業したい場所でPowerShellまたはターミナルを開きます。

```powershell
git clone https://github.com/97kuek/HRS.git
cd HRS
```

`HRS` フォルダの中に入った状態で作業します。

## 4. 作業前に最新状態にする

毎回、作業を始める前に `main` を最新にします。

```powershell
git checkout main
git pull
```

意味:

- `git checkout main`: 基準になる `main` ブランチへ移動する
- `git pull`: GitHub上の最新内容を取り込む

## 5. Issueを選ぶ

GitHubのIssuesまたはProjectsから、自分が担当するIssueを1つ選びます。

作業するIssueを決めたら、Project上で `Doing` に移します。

## 6. ブランチを作る

`main` に直接変更を入れず、作業用ブランチを作ります。

```powershell
git checkout -b docs/<issue-number>-<short-name>
```

例:

```powershell
git checkout -b docs/3-usecase-description
```

ブランチ名の付け方:

- ドキュメント作業: `docs/<issue番号>-<短い説明>`
- 機能追加: `feature/<issue番号>-<短い説明>`
- 修正: `fix/<issue番号>-<短い説明>`

例:

```text
docs/3-usecase-description
docs/8-domain-review
feature/12-reservation-search
fix/18-checkin-flow
```

## 7. ファイルを編集する

Visual Studio Codeで開く場合:

```powershell
code .
```

編集が終わったら、変更されたファイルを確認します。

```powershell
git status
```

よく見る表示:

- `modified`: 変更されたファイル
- `untracked`: 新しく作ったが、まだGit管理に入っていないファイル

## 8. 変更内容を確認する

コミットする前に、何を変更したか確認します。

```powershell
git diff
```

追加したファイルなど、`git diff` に出ないものがある場合もあります。その場合は `git status` も確認してください。

## 9. コミットする

コミットは「作業の保存ポイント」です。

まず、コミットしたいファイルを追加します。

```powershell
git add .
```

次に、コミットメッセージを付けてコミットします。

```powershell
git commit -m "docs: add usecase description draft"
```

コミットメッセージの形:

```text
<type>: <summary>
```

よく使う `type`:

- `docs`: ドキュメント、UML、レビュー記録
- `feat`: 機能追加
- `fix`: 修正
- `test`: テスト追加・修正
- `refactor`: 整理
- `chore`: 設定、雑務

例:

```text
docs: add domain analysis class diagram draft
docs: ドメイン分析の初版を追加
feat: add reservation number lookup
fix: correct checkout fee calculation
```

コツ:

- 何をしたかが分かる短い文にする
- 「修正」「更新」だけにしない
- 1つのコミットには、なるべく1つの目的だけを入れる

## 10. GitHubにpushする

初回push:

```powershell
git push -u origin 今のブランチ名
```

例:

```powershell
git push -u origin docs/3-usecase-description
```

2回目以降のpush:

```powershell
git push
```

今のブランチ名が分からない場合:

```powershell
git branch
```

`*` が付いているものが現在のブランチです。

## 11. Pull Requestを作る

GitHubでリポジトリを開きます。

<https://github.com/97kuek/HRS>

1. `Compare & pull request` を押す
2. タイトルに作業内容を書く
3. 本文に関連Issueを書く
4. `Create pull request` を押す

本文には次のように書きます。

```text
Closes #3
```

まだIssueを完了扱いにしたくない場合:

```text
Refs #3
```

意味:

- `Closes #3`: このPRがマージされたらIssue 3を閉じる
- `Refs #3`: Issue 3に関係するPRとして紐付ける

## 12. レビューを受ける

最低1人に見てもらいます。

レビューで指摘されたら、同じブランチで修正します。

```powershell
git status
git add .
git commit -m "docs: revise usecase description"
git push
```

PRは自動で更新されます。

## 13. mainに取り込まれた後

自分のPRがマージされたら、ローカルの `main` を最新にします。

```powershell
git checkout main
git pull
```

次の作業をするときは、また新しいブランチを作ります。

```powershell
git checkout -b docs/<issue-number>-<short-name>
```

## よく使うコマンド一覧

| Command | Meaning |
| --- | --- |
| `git status` | 今の変更状態を見る |
| `git branch` | ブランチ一覧を見る |
| `git checkout main` | `main` ブランチへ移動する |
| `git pull` | GitHubの最新内容を取り込む |
| `git checkout -b <branch>` | 新しいブランチを作って移動する |
| `git diff` | 変更内容を見る |
| `git add .` | 変更をコミット対象に入れる |
| `git commit -m "message"` | 変更をコミットする |
| `git push` | GitHubに送る |

## 困ったとき

### 今どこにいるか分からない

```powershell
git status
git branch
```

### mainに戻りたい

```powershell
git checkout main
```

### 最新状態にしたい

```powershell
git checkout main
git pull
```

### pushできない

まず現在のブランチ名を確認します。

```powershell
git branch
```

初回pushの場合は、次の形でpushします。

```powershell
git push -u origin <branch-name>
```

### 間違えてmainで作業してしまった

すぐにチームへ相談してください。まだコミットしていなければ、作業をブランチへ移せる場合があります。

## 作業の基本ルール

- `main` に直接pushしない
- 作業前に必ず `git pull` する
- Issueごとにブランチを作る
- コミットメッセージは内容が分かるように書く
- Pull Requestを作ってレビューを受ける
- Publicリポジトリに置いてよい内容だけを追加する
