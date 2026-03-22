# デプロイ・CI/CD

## GitHub Actions とは

コードの push や PR をトリガーに、テスト・ビルド・デプロイなどを自動実行するサービス。GitHub にビルトインされているため、外部サービスの契約が不要。

### Jenkins との対比

| 項目 | Jenkins | GitHub Actions |
|------|---------|----------------|
| インフラ | 自前サーバーに構築 | GitHub がホスト（サーバー不要） |
| 設定ファイル | `Jenkinsfile`（Groovy） | `.github/workflows/*.yml`（YAML） |
| 実行環境 | Jenkins エージェント | GitHub が提供するランナー（ubuntu-latest など） |
| 無料枠 | なし（自前サーバー） | public リポジトリは無制限、private は月 2000 分 |
| エコシステム | プラグイン | Marketplace のアクション（`uses:`） |

---

## ワークフローファイルの読み方

本プロジェクトの `.github/workflows/deploy.yml` を例に解説する。

```yaml
name: Deploy to GitHub Pages       # ワークフローの名前（GitHub UI に表示）

on:                                 # トリガー設定
  push:
    branches: [master]             # master ブランチへの push 時に起動
```

### on: トリガーのバリエーション

```yaml
on:
  push:
    branches: [main, master]       # 特定ブランチへの push
    paths: ['src/**']              # 特定パスの変更時だけ

  pull_request:
    branches: [main]               # PR 作成・更新時

  schedule:
    - cron: '0 9 * * 1'           # 毎週月曜 9:00 UTC に定期実行

  workflow_dispatch:               # GitHub UI から手動実行
```

### permissions

```yaml
permissions:
  contents: read    # リポジトリのコード読み取り
  pages: write      # GitHub Pages への書き込み
  id-token: write   # OIDC トークン（デプロイ認証に必要）
```

GitHub Pages へのデプロイには `pages: write` が必須。デフォルトでは `read` 権限しかないため明示的に指定する。

### concurrency（同時実行制御）

```yaml
concurrency:
  group: pages              # 同じグループのワークフローは同時に 1 つだけ実行
  cancel-in-progress: true  # 新しい実行が来たら古い実行をキャンセル
```

連続で push したとき、古いデプロイが完了前に新しいデプロイで上書きされる状況を防ぐ。

### jobs と steps

```yaml
jobs:
  build-and-deploy:                 # ジョブ名（任意）
    runs-on: ubuntu-latest          # 実行環境（GitHub 提供の Ubuntu VM）
    environment:                    # 環境設定
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}  # デプロイ後の URL を出力
    steps:
      - uses: actions/checkout@v4   # リポジトリのコードをチェックアウト

      - uses: actions/setup-node@v4  # Node.js をセットアップ
        with:
          node-version: 20
          cache: npm                 # npm キャッシュを有効化（ビルド高速化）

      - run: npm ci                  # パッケージをインストール
      - run: npm run build           # TypeScript コンパイル + Vite ビルド

      - uses: actions/configure-pages@v4            # GitHub Pages の設定
      - uses: actions/upload-pages-artifact@v3      # ビルド成果物をアップロード
        with:
          path: dist                 # dist ディレクトリをアップロード

      - id: deployment               # このステップに ID を付与（後で参照するため）
        uses: actions/deploy-pages@v4  # GitHub Pages にデプロイ
```

### uses: アクション

`uses: actions/checkout@v4` の読み方：

```
actions/checkout@v4
│      │         └── バージョン（タグ or SHA）
│      └── アクション名
└── GitHub 上のリポジトリ名（github.com/actions/checkout）
```

Marketplace で公開されているアクションを再利用できる。`@v4` のようにバージョンを固定するのが安全。

### environment（デプロイ環境）

```yaml
environment:
  name: github-pages
  url: ${{ steps.deployment.outputs.page_url }}
```

`environment` を指定すると、GitHub リポジトリの Settings > Environments で保護ルールを設定できる（例：本番デプロイには承認が必要）。

---

## GitHub Pages の仕組み

GitHub Pages は静的ファイル（HTML / CSS / JS）をそのままホスティングするサービス。

```
リポジトリ名: ipa-words
GitHub ユーザー名: miyaw

→ 公開 URL: https://miyaw.github.io/ipa-words/
```

**重要**: リポジトリ名がパスになる。このため `vite.config.ts` で `base` を設定する必要がある。

```ts
// vite.config.ts
export default defineConfig({
  base: '/ipa-words/',  // ← GitHub Pages のパスに合わせる
})
```

これがないと、JS や CSS のパスが `/assets/...` になり、GitHub Pages では `404` になる（詳細は 12-common-pitfalls.md 参照）。

---

## デプロイフロー: push → build → deploy

```
開発者の PC                   GitHub                        GitHub Pages
─────────────────────────────────────────────────────────────────────────
git push master
         ──────────────────→ push イベント検知
                              ↓
                              ワークフロー起動
                              ├─ actions/checkout    コードを取得
                              ├─ actions/setup-node  Node.js 20 準備
                              ├─ npm ci              依存関係インストール
                              ├─ npm run build       dist/ 生成
                              ├─ upload-pages-artifact  dist/ をアップロード
                              └─ deploy-pages
                                         ──────────────────→ 公開完了
                                                             (約 1〜2 分)
```

ビルドが失敗した場合（例: TypeScript エラー）、デプロイは実行されない。

---

## 環境変数とシークレット

### 環境変数（公開情報）

```yaml
# ワークフロー内で設定
env:
  VITE_API_BASE_URL: https://api.example.com

# または step レベルで
- run: npm run build
  env:
    VITE_APP_VERSION: ${{ github.sha }}
```

Vite では `VITE_` プレフィックスが必要。アプリ側では `import.meta.env.VITE_API_BASE_URL` で参照する。

### シークレット（非公開情報）

API キーやトークンなど秘密情報は GitHub Secrets に登録する。

**登録手順:** リポジトリ > Settings > Secrets and variables > Actions > New repository secret

```yaml
# ワークフローでの参照
- run: npm run deploy
  env:
    API_SECRET_KEY: ${{ secrets.API_SECRET_KEY }}
```

シークレットはログに表示されない（`***` でマスクされる）。`.env` ファイルをリポジトリに push しないこと。

---

## ブランチ戦略

### 本プロジェクトのシンプルな構成

```
master ────────────────────────────────── 本番（GitHub Pages に自動デプロイ）
         ↑merge
feature/add-quiz-mode ──────────────────── 機能開発ブランチ
```

### より本格的な構成（Git Flow 簡易版）

```
main    ─────────────────────────────── 本番（常に安定）
           ↑merge via PR
develop ─────────────────────────────── 統合ブランチ（開発の最新）
           ↑merge via PR
feature/xxx ──────────────────────────── 機能開発ブランチ
```

| ブランチ | 役割 | デプロイ先 |
|----------|------|------------|
| `main` | 本番リリース用 | GitHub Pages 本番 |
| `develop` | 開発の統合ブランチ | ステージング（あれば） |
| `feature/*` | 機能単位の開発 | なし |
| `hotfix/*` | 緊急バグ修正 | 本番に直接マージ |

---

## プルリクエストフロー

```
1. feature ブランチを作成
   git checkout -b feature/add-search-history

2. 開発 & コミット
   git add .
   git commit -m "feat: 検索履歴機能を追加"

3. GitHub に push
   git push -u origin feature/add-search-history

4. GitHub で PR 作成
   - タイトル: わかりやすく（例: "検索履歴機能を追加"）
   - 説明: 変更内容・テスト方法・スクリーンショット

5. コードレビュー
   - レビュアーがコメント
   - 指摘に対応してコミットを追加

6. PR をマージ
   - Squash and merge / Merge commit / Rebase and merge から選択

7. feature ブランチを削除
   git branch -d feature/add-search-history
```

### PR を CI の関門にする

```yaml
# .github/workflows/ci.yml（PR 用）
on:
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test:run    # テストが通らないとマージできない
      - run: npm run build       # ビルドが通らないとマージできない
```

Settings > Branches で "Require status checks to pass before merging" を有効化すると、CI が通らない PR はマージできなくなる。

---

## Vercel / Netlify との比較（GitHub Pages 以外の選択肢）

| 項目 | GitHub Pages | Vercel | Netlify |
|------|-------------|--------|---------|
| 無料枠 | 無制限（public リポジトリ） | 無制限（個人） | 無制限（個人） |
| カスタムドメイン | 可 | 可 | 可 |
| HTTPS | 自動 | 自動 | 自動 |
| ビルド自動化 | GitHub Actions が必要 | push で自動ビルド | push で自動ビルド |
| プレビューデプロイ | なし | PR ごとに自動生成 | PR ごとに自動生成 |
| サーバーサイド機能 | なし（静的のみ） | Edge Functions | Functions |
| 設定の複雑さ | 低い（GitHub に統合済み） | 非常に低い | 非常に低い |

**Vercel の強み**: Next.js との統合が最高。PR ごとにプレビュー URL が自動生成され、レビューが楽になる。

**Netlify の強み**: フォーム処理・A/B テスト・リダイレクト設定などが UI で簡単に設定できる。

**本プロジェクトで GitHub Pages を選んだ理由**: 外部サービスのアカウント不要、リポジトリ内で完結、純粋な静的サイトなので機能的に十分。

---

## Java アプリのデプロイとの違い

### Java Web アプリ（WAR / JAR）の場合

```
ソースコード
    ↓ mvn package / gradle build
WAR / JAR ファイル（バイナリ）
    ↓
Tomcat / Spring Boot 組み込みサーバーにデプロイ
    ↓
サーバープロセスが常時起動して HTTP リクエストを処理
```

### React / Vite の場合（本プロジェクト）

```
ソースコード（TypeScript / TSX）
    ↓ npm run build（tsc + vite）
静的ファイル（HTML / CSS / JS）   ← dist/ ディレクトリ
    ↓
GitHub Pages / Nginx / CDN に配置
    ↓
ブラウザが直接ファイルを読み込む（サーバープロセス不要）
```

**主な違い:**

| 項目 | Java WAR/JAR | 静的ファイル（React）|
|------|-------------|---------------------|
| サーバープロセス | 常時起動必要 | 不要 |
| スケーリング | サーバーリソース増設 | CDN で自動 |
| デプロイ時間 | 数分〜（サーバー再起動） | 数秒〜数分 |
| ロールバック | 旧 JAR/WAR に戻す | 旧 commit に戻す |
| 状態管理 | サーバーサイドセッション可 | クライアントサイドのみ |

---

## ロールバック方法

### GitHub Pages でのロールバック

方法 1: 旧バージョンの commit に revert する

```bash
# 直前の commit を revert するコミットを作成
git revert HEAD
git push origin master
# → ワークフローが起動し、revert されたコードがデプロイされる
```

方法 2: GitHub Actions の画面から過去のワークフローを再実行

```
GitHub リポジトリ > Actions > 該当ワークフロー
→ 過去の成功したワークフロー実行を選択
→ "Re-run all jobs" でそのバージョンを再デプロイ
```

ただし方法 2 はコードが変わっていないので、ビルド成果物が同じであることが前提。

方法 3: 特定の commit にタグを打って管理

```bash
# リリース時にタグを付ける
git tag v1.0.0
git push origin v1.0.0

# ロールバック時
git checkout v1.0.0
git push origin HEAD:master  # または revert で
```
