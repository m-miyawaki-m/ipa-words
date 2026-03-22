# 開発環境・ツールチェーン

## IDEの選択: VSCode vs Android Studio vs IntelliJ

| IDE | 得意領域 | React/PWA開発 |
|---|---|---|
| **IntelliJ IDEA** | Java/Kotlin、Spring | プラグインで可能だが重い |
| **Android Studio** | Androidアプリ | 不向き（Android専用） |
| **VSCode** | JavaScript/TypeScript、Web全般 | 最適 |

**VSCodeを推奨する理由:**

- 起動が速い。IntelliJのような「プロジェクトインデックス構築中...」の待ち時間がない
- TypeScript/JavaScript向けの拡張機能エコシステムが最大
- ターミナル統合が軽快で、`npm run dev` をすぐ叩ける
- 無料（Community Edition 相当が全機能）

---

## VSCode 推奨拡張機能

プロジェクトの `.vscode/extensions.json` に書いておくと、チームで統一できる。

| 拡張機能 | 役割 | Javaでの対応物 |
|---|---|---|
| **ES7+ React/Redux/React-Native snippets** | `rafce` 等のコードスニペット | IntelliJのライブテンプレート |
| **Prettier - Code formatter** | コード自動整形 | google-java-format |
| **ESLint** | 静的解析・リントエラー表示 | Checkstyle / SpotBugs |
| **TypeScript Error Lens** | エラーをインラインで強調表示 | IntelliJのインライン注釈 |
| **vscode-icons** | ファイルアイコン（見やすさ向上） | - |
| **GitLens** | git blame / 履歴可視化 | IntelliJのGit統合 |
| **CSS Modules** | CSS Modulesの補完 | - |

インストール方法: `Ctrl+Shift+X` で拡張機能パネルを開き、名前で検索。

---

## Node.js / npm とは

**Java開発者向けの対比:**

| 概念 | Java世界 | Node.js/npm世界 |
|---|---|---|
| ランタイム | JVM (java コマンド) | Node.js (node コマンド) |
| バージョン管理 | SDKMAN!, JEnv | nvm, volta |
| パッケージ管理 | Maven / Gradle | npm / yarn / pnpm |
| パッケージレジストリ | Maven Central | npmjs.com |
| ローカル依存関係 | `~/.m2/repository/` | `./node_modules/` |

Node.js はサーバーサイドJSだけでなく、**ビルドツールを動かすためのランタイム**としても使う。
`npm` コマンド自体も Node.js に付属している。

**バージョン確認:**
```bash
node --version   # v22.x.x など
npm --version    # 10.x.x など
```

---

## package.json の読み方（pom.xml との対比）

本プロジェクトの `package.json`:

```json
{
  "name": "ipa-words",          // artifactId に相当
  "version": "0.0.0",           // <version> に相当
  "type": "module",             // ESModules使用を宣言（Java不要）
  "scripts": {                  // Maven の <build><plugins> に近い
    "dev": "vite",              // mvn spring-boot:run に相当
    "build": "tsc -b && vite build",  // mvn package に相当
    "lint": "eslint .",         // mvn checkstyle:check に相当
    "preview": "vite preview"   // ビルド成果物をローカルで確認
  },
  "dependencies": {             // <dependencies>（scope=compile）
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-window": "^2.2.7"
  },
  "devDependencies": {          // <dependencies scope="test/provided">
    "typescript": "~5.9.3",
    "vite": "^8.0.1",
    "eslint": "^9.39.4"
    // ...
  }
}
```

**バージョン記法:**
- `^19.2.4` — メジャーバージョン固定、マイナー・パッチは自動更新（Maven の `[19.2.4, 20)` に相当）
- `~5.9.3` — パッチバージョンのみ自動更新（`[5.9.3, 5.10)` 相当）

---

## npm コマンド一覧

| コマンド | 動作 | Maven相当 |
|---|---|---|
| `npm install` | `package.json` の依存関係を全インストール | `mvn dependency:resolve` |
| `npm install react` | reactを追加インストール（dependenciesへ） | `pom.xml`に手書き後 `mvn install` |
| `npm install -D eslint` | devDependenciesへ追加 | `<scope>test</scope>` に相当 |
| `npm run dev` | 開発サーバー起動（HMR有効） | `mvn spring-boot:run` |
| `npm run build` | 本番ビルド生成（`dist/`フォルダへ） | `mvn package` |
| `npm run lint` | ESLintで静的解析実行 | `mvn checkstyle:check` |
| `npm run preview` | ビルド成果物をローカルでプレビュー | warをローカルTomcatで起動 |
| `npm ci` | lockファイルを厳密に使ってインストール（CI/CD用） | `mvn dependency:resolve -o` |

`node_modules/` は `.gitignore` に入れる。`npm install` で再生成できるため（Mavenの `~/.m2` と同じ考え方）。

---

## Vite とは

**一言:** 開発サーバー + バンドラー を担うビルドツール。

### 役割の対比

| 機能 | Maven/Gradle | Webpack | **Vite** |
|---|---|---|---|
| 開発サーバー | Spring Boot組み込みTomcat | webpack-dev-server | **Vite dev server** |
| ファイル変更検知 | Spring DevTools | watch mode | **HMR（ほぼ瞬時）** |
| 本番バンドル | maven-jar-plugin | webpack build | **Rollup（内包）** |
| 設定ファイル | pom.xml | webpack.config.js | **vite.config.ts** |

### Webpackとの違い

Webpack は全ファイルを起動時にバンドルするため、大規模プロジェクトだと起動に数十秒かかる。
Vite は**ブラウザのネイティブESModulesを活用**し、必要なファイルだけをオンデマンドで変換する。
開発サーバー起動が1秒以内、HMRも数十msで完了する。

### 本プロジェクトのvite.config.ts

```ts
export default defineConfig({
  plugins: [
    react(),          // JSX変換 + React Fast Refresh
    VitePWA({ ... }), // Service Worker / manifest 自動生成
  ],
  base: '/ipa-words/', // GitHub Pagesのサブパス対応
})
```

---

## TypeScript コンパイラ（tsc）の役割

**Java開発者向けの対比:**

| 項目 | Java | TypeScript |
|---|---|---|
| コンパイラ | `javac` | `tsc` |
| 出力 | `.class` ファイル | `.js` ファイル（または省略） |
| 設定ファイル | なし（Mavenが管理） | `tsconfig.json` |
| 型チェック | コンパイル時（必須） | コンパイル時（省略可能） |

本プロジェクトでは `tsconfig.app.json` に `"noEmit": true` を設定している。
これは **「型チェックだけしてJSファイルは出力しない」** という意味で、実際のJS変換はViteが担う。

つまり `npm run build` の `tsc -b && vite build` は:
1. `tsc -b` — 型エラーがないか検査（エラーがあれば停止）
2. `vite build` — Rollupで実際にバンドル・最適化

`strict: true` が有効なので、`any` 型の多用やnullチェック漏れはコンパイルエラーになる。

---

## ESLint

**役割:** コードの「くせ」や「バグの種」を静的に検出するツール。

| ツール | Java | TypeScript/React |
|---|---|---|
| スタイルチェック | Checkstyle | ESLint（+ Prettier） |
| バグ検出 | SpotBugs / FindBugs | ESLint（型ルール） |
| 設定ファイル | `checkstyle.xml` | `eslint.config.js` |

本プロジェクトの `eslint.config.js` が有効にしているルールセット:
- `@eslint/js` — JS基本ルール（未使用変数等）
- `typescript-eslint` — TypeScript固有ルール
- `eslint-plugin-react-hooks` — Hooksのルール違反検出（`useEffect`の依存配列漏れ等）
- `eslint-plugin-react-refresh` — HMR互換性チェック

実行: `npm run lint`

VSCodeにESLint拡張を入れると、保存時にエラーがリアルタイム表示される。

---

## Hot Module Replacement (HMR)

**一言:** ファイルを保存した瞬間、ブラウザをリロードせずに変更が反映される仕組み。

| 比較軸 | Java（Spring DevTools） | Vite HMR |
|---|---|---|
| 反映速度 | 数秒（クラス再ロード） | 数十ms |
| 状態保持 | アプリ状態がリセットされる | Reactのstateが保持される |
| 仕組み | JVMのクラスローダー置換 | ESModulesのhotリロード |

Reactコンポーネントを編集して保存すると、そのコンポーネントだけが差し替えられる。
フォームに入力した値や開いたモーダルの状態が消えない。

---

## 環境構築手順（ゼロから始める場合）

### 1. Node.jsのインストール

```bash
# nvmを使う場合（推奨）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install --lts
nvm use --lts

# バージョン確認
node --version
npm --version
```

### 2. VSCodeのインストール

https://code.visualstudio.com/ からダウンロード。

### 3. プロジェクトのセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yourname/ipa-words.git
cd ipa-words

# 依存関係をインストール（node_modules/ が生成される）
npm install

# 開発サーバー起動
npm run dev
# → http://localhost:5173 でアプリが開く
```

### 4. よく使うコマンド早見表

```bash
npm run dev      # 開発（HMR有効）
npm run build    # 本番ビルド → dist/
npm run preview  # dist/ をローカルで確認
npm run lint     # ESLintチェック
```

`dist/` 配下が GitHub Pages にデプロイされる成果物。
