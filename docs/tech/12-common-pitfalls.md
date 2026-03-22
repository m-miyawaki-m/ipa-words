# よくあるハマりポイント集

React・TypeScript・ビルド環境で初学者がよく詰まる問題をまとめた。それぞれ「問題 → 原因 → 解決策」の順で説明する。

---

## React 関連

### 1. useEffect の依存配列を忘れて無限ループ

**問題**

```tsx
const [terms, setTerms] = useState<Term[]>([])
const [count, setCount] = useState(0)

// ❌ 依存配列なし → 毎レンダーで実行される
useEffect(() => {
  setCount(terms.length)  // count が変わる → re-render → また実行 → 無限ループ
})
```

ブラウザがフリーズし、コンソールに大量のログが流れる。

**原因**

`useEffect` は第 2 引数（依存配列）を省略すると、**毎レンダー後に実行**される。内部で state を更新すると再レンダーが起き、また `useEffect` が走り、無限ループになる。

**解決策**

```tsx
// ✅ 依存配列に terms を指定 → terms が変わったときだけ実行
useEffect(() => {
  setCount(terms.length)
}, [terms])

// ✅ または、そもそも useEffect が不要なケースが多い
// 派生値は計算で求められる（useMemo or 直接計算）
const count = terms.length  // これで十分
```

**ESLint ルール**: `eslint-plugin-react-hooks` の `exhaustive-deps` ルールを有効にすると、依存配列の漏れを自動検出できる。

---

### 2. state の更新が即座に反映されない（非同期バッチ更新）

**問題**

```tsx
const [count, setCount] = useState(0)

const handleClick = () => {
  setCount(count + 1)
  console.log(count)  // ❌ まだ古い値が出力される！

  setCount(count + 1)  // ❌ count はまだ 0 → 2 にならず 1 になる
  setCount(count + 1)  // ❌ 同上
}
```

ボタンを 1 回クリックしても count が 1 しか増えない。

**原因**

`setCount` は React に「次のレンダーでこの値を使ってください」と予約するだけで、**現在の変数 `count` の値は変わらない**。Java で言えば、`count` は `final` として扱われ、同じレンダー内では変わらない。

**解決策**

```tsx
// ✅ 関数形式で更新（最新の state を受け取れる）
const handleClick = () => {
  setCount(prev => prev + 1)
  setCount(prev => prev + 1)  // ✅ 正しく +2 になる
  setCount(prev => prev + 1)  // ✅ 正しく +3 になる
}

// ✅ 更新後の値が必要なら useEffect で監視
useEffect(() => {
  console.log('count が更新された:', count)
}, [count])
```

---

### 3. オブジェクト/配列の state 更新で参照が変わらない（イミュータブル更新）

**問題**

```tsx
const [terms, setTerms] = useState<Term[]>([...])

const handleFavorite = (id: number) => {
  // ❌ 配列を直接変更（ミューテーション）→ 再レンダーされない
  terms.find(t => t.id === id)!.isFavorite = true
  setTerms(terms)  // 同じ参照を渡しているので React は変化を検知しない
}
```

お気に入りボタンを押しても画面が更新されない。

**原因**

React は `setTerms(newTerms)` で「前の参照と同じかどうか」で変化を判断する。同じ配列オブジェクトを渡した場合、内部の値を変えていても**参照が同じ**なので再レンダーしない。Java の `ArrayList` を直接変更してから同じ参照を返すようなもの。

**解決策**

```tsx
// ✅ スプレッド演算子で新しい配列を生成（イミュータブル更新）
const handleFavorite = (id: number) => {
  setTerms(prev =>
    prev.map(term =>
      term.id === id ? { ...term, isFavorite: true } : term
    )
  )
}

// ✅ 配列に要素を追加する場合
setTerms(prev => [...prev, newTerm])       // push の代わり

// ✅ 配列から要素を削除する場合
setTerms(prev => prev.filter(t => t.id !== id))  // remove の代わり

// ✅ ネストしたオブジェクトの更新
setSettings(prev => ({
  ...prev,
  display: {
    ...prev.display,
    darkMode: true,
  },
}))
```

---

### 4. 子コンポーネントの不要な re-render（React.memo, useMemo, useCallback）

**問題**

```tsx
// 親コンポーネント
const App = () => {
  const [query, setQuery] = useState('')

  // query が変わるたびに handleFavorite が再生成される
  const handleFavorite = (id: number) => { /* ... */ }

  return (
    <>
      <SearchBar onChange={setQuery} />
      {terms.map(term => (
        // ❌ query が変わるたびに全 WordCard が再レンダー
        <WordCard key={term.id} term={term} onFavorite={handleFavorite} />
      ))}
    </>
  )
}
```

**原因**

親コンポーネントが再レンダーされると、デフォルトでは**すべての子コンポーネントも再レンダー**される。`handleFavorite` は毎レンダーで新しい関数オブジェクトが生成されるため、props が変わったと判断される。

**解決策**

```tsx
// ✅ React.memo: props が変わっていなければ再レンダーしない
const WordCard = React.memo(({ term, onFavorite }: Props) => {
  return <div>...</div>
})

// ✅ useCallback: 関数を前のレンダーのものを再利用
const handleFavorite = useCallback((id: number) => {
  setTerms(prev => prev.map(t =>
    t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
  ))
}, [])  // 依存がないので [] でよい

// ✅ useMemo: 計算コストの高い値をキャッシュ
const filteredTerms = useMemo(
  () => terms.filter(t => t.word.includes(query)),
  [terms, query]
)
```

**注意**: 何でも `memo` / `useMemo` / `useCallback` をつければ良いわけではない。これらには「前の値と比較する」コストがかかる。ボトルネックが確認できた箇所に絞って使う。

---

### 5. key prop の重要性（リストレンダリング）

**問題**

```tsx
// ❌ インデックスを key に使う
{terms.map((term, index) => (
  <WordCard key={index} term={term} />
))}
```

リストの順序が変わる（ソート・フィルタ）と、DOM が正しく更新されずに表示が崩れる。アニメーションやフォームの入力状態が意図しない要素に残ることがある。

**原因**

`key` は React が「どの DOM 要素がどのデータに対応するか」を判断するための識別子。インデックスを使うと、並び替え時に「同じ key = 同じ要素」と誤認する。

**解決策**

```tsx
// ✅ データ固有の ID を key に使う
{terms.map(term => (
  <WordCard key={term.id} term={term} />
))}
```

**ルール**: `key` はリスト内で一意で、データが変わっても変わらない値を使う。ID が最適。

---

### 6. イベントハンドラでの this（クラスコンポーネントの場合）

**問題（クラスコンポーネント時代）**

```tsx
// ❌ クラスコンポーネントでの this の罠
class WordCard extends React.Component {
  handleClick() {
    console.log(this.state)  // TypeError: Cannot read properties of undefined
  }

  render() {
    return <button onClick={this.handleClick}>クリック</button>
  }
}
```

**原因**

JavaScript のメソッドはオブジェクトから切り離して呼ばれると `this` が `undefined` になる（strict mode）。`onClick={this.handleClick}` はメソッドを渡しているだけで、クリック時に `this` が失われる。

**解決策（クラスコンポーネントの場合）**

```tsx
// ✅ アロー関数でバインド
handleClick = () => {
  console.log(this.state)  // OK
}
```

**関数コンポーネント（現在の標準）では `this` 問題は発生しない**:

```tsx
// ✅ 関数コンポーネントでは this を使わない
const WordCard = () => {
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = () => {
    setIsOpen(true)  // this 不要
  }

  return <button onClick={handleClick}>クリック</button>
}
```

新規コードはすべて関数コンポーネントで書くこと。クラスコンポーネントは古いコードベースでのみ見かける。

---

### 7. JSX での条件分岐（0 が表示される問題）

**問題**

```tsx
const count = 0

// ❌ 0 がそのままレンダリングされる
return <div>{count && <Badge count={count} />}</div>
// 出力: <div>0</div>
```

**原因**

JavaScript の `&&` 演算子は左辺が **falsy** なとき左辺の値をそのまま返す。`0` は falsy なので `0` が返り、React はそれをテキストとしてレンダリングしてしまう（`false`, `null`, `undefined` はレンダリングされないが、`0` はされる）。

**解決策**

```tsx
// ✅ 方法1: 明示的に boolean に変換
{count > 0 && <Badge count={count} />}

// ✅ 方法2: 三項演算子
{count ? <Badge count={count} /> : null}

// ✅ 方法3: !! で boolean 変換
{!!count && <Badge count={count} />}
```

`count` が数値でなく配列の場合も注意: `array.length && <...>` で `array` が空なら `0` が表示される。

---

## TypeScript 関連

### 8. any を使いすぎる問題

**問題**

```ts
// ❌ any を使うと TypeScript の恩恵がゼロになる
const fetchTerms = async (): Promise<any> => {
  const res = await fetch('/api/terms')
  return res.json()
}

const terms: any = await fetchTerms()
terms.forEach((t: any) => console.log(t.naem))  // typo でもエラーにならない
```

**原因**

`any` は型チェックを完全に無効化する「脱出ハッチ」。型を書くのが面倒・型エラーを早く消したいという理由で使われがち。

**解決策**

```ts
// ✅ 型を定義して使う
interface Term {
  id: number
  word: string
  reading: string
  definition: string
}

const fetchTerms = async (): Promise<Term[]> => {
  const res = await fetch('/api/terms')
  return res.json() as Term[]  // 最低限の型アサーション
}

// 型が不明なときは unknown を使う（any より安全）
const parseData = (raw: unknown): Term => {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Invalid data')
  }
  // 型ガードで絞り込む
  return raw as Term
}
```

**tsconfig のおすすめ設定:**

```json
{
  "compilerOptions": {
    "strict": true,           // strict モードを有効化
    "noImplicitAny": true,    // any の暗黙的な使用を禁止
    "noUncheckedIndexedAccess": true  // 配列アクセスに undefined を含める
  }
}
```

---

### 9. 型アサーション（as）の濫用

**問題**

```ts
// ❌ as で型エラーを強制的に消す
const term = fetchedData as Term  // データが実際に Term 形式かどうか不明
term.word.toUpperCase()           // 実行時に TypeError になる可能性
```

**原因**

`as` はコンパイラに「私が正しいから黙って」と言うもの。実行時の型は保証されない。

**解決策**

```ts
// ✅ 型ガード関数を作る
const isTerm = (value: unknown): value is Term => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'word' in value &&
    typeof (value as Record<string, unknown>).word === 'string'
  )
}

const data = await res.json()
if (!isTerm(data)) throw new Error('Unexpected data format')
const term: Term = data  // 型安全に使える
```

`as` が許容されるのは: DOM 操作（`document.getElementById('x') as HTMLInputElement`）など、型が確実にわかっている場面に限定する。

---

### 10. undefined と null の違い

**問題**

```ts
// ❌ undefined と null を混同する
function getUser(): User | null { return null }

const user = getUser()
if (user !== undefined) {  // null が通り抜けてしまう！
  console.log(user.name)  // TypeError
}
```

**原因**

- `undefined`: 値が存在しない・初期化されていない（JavaScript 固有）
- `null`: 意図的に「値がない」ことを示す（Java の `null` に近い）

**解決策**

```ts
// ✅ 明示的にチェック
if (user !== null && user !== undefined) { /* ... */ }
if (user != null) { /* null も undefined も弾く（== を使う例外的なケース） */ }
if (user) { /* falsy チェック（0, "", false も弾くので注意） */ }

// ✅ オプショナルチェーン（?.）でシンプルに
const name = user?.name  // user が null/undefined なら undefined を返す

// ✅ null 合体演算子（??）でデフォルト値
const displayName = user?.name ?? '匿名'  // null/undefined のみ右辺（0 や "" は通す）
```

---

### 11. readonly vs const

**問題**

```ts
// ❌ const の配列の中身は変更できてしまう
const terms: Term[] = []
terms.push(newTerm)  // エラーにならない！
```

**原因**

`const` は「その変数への再代入を禁止」するだけで、オブジェクト・配列の中身は変更可能。Java の `final` と同じ挙動。

**解決策**

```ts
// ✅ readonly で配列の変更を禁止
const CATEGORIES: readonly string[] = ['technology', 'security', 'network']
CATEGORIES.push('other')  // コンパイルエラー！

// ✅ ReadonlyArray 型
function display(terms: ReadonlyArray<Term>) {
  terms.push(newTerm)  // コンパイルエラー（引数を変更しない意図を示す）
}

// ✅ as const でオブジェクトを深く readonly に
const CONFIG = {
  maxRetries: 3,
  timeout: 5000,
} as const
CONFIG.maxRetries = 5  // コンパイルエラー
```

---

## ビルド / 環境関連

### 12. npm install と npm ci の違い

**問題**

```bash
# 開発者 A の環境でビルドが通り、CI では失敗する
npm install  # ← package.json の範囲内で最新を取ってくる
```

**原因**

`npm install` は `package.json` のバージョン範囲（例: `^19.0.0`）に従い、条件を満たす最新版をインストールする。開発者ごとに異なるバージョンが入ることがある。

`npm ci` は `package-lock.json` の内容を**完全に再現**する。`node_modules` を一度削除してから完全一致でインストールする。

**解決策**

```bash
# 開発中（lock ファイルを更新してよい）
npm install

# CI / デプロイ時（lock ファイルを更新しない、完全再現）
npm ci

# package.json にないパッケージを追加
npm install <package-name>   # package.json と lock ファイルを更新

# lock ファイルを更新したくない場合
npm install --frozen-lockfile  # npm ci の挙動に近い
```

**ルール**: CI ワークフローでは必ず `npm ci` を使う。本プロジェクトの `deploy.yml` でも `npm ci` を使用している。

---

### 13. node_modules の肥大化

**問題**

`node_modules` ディレクトリが数百 MB〜数 GB になり、Git に誤って push してしまう。

**解決策**

```bash
# ✅ .gitignore に必ず追加
node_modules/
dist/
.env
```

```bash
# キャッシュをクリアして再インストール
rm -rf node_modules package-lock.json
npm install

# 使っていない依存関係を確認
npx depcheck

# バンドルサイズを分析（大きなパッケージを特定）
npm run build
npx vite-bundle-visualizer  # または npx rollup-plugin-visualizer
```

**npm vs pnpm**: `pnpm` はパッケージをグローバルにキャッシュして各プロジェクトからリンクするため、ディスク使用量を大幅に削減できる。チームで採用を検討する価値がある。

---

### 14. 環境変数の読み込み（import.meta.env）

**問題**

```ts
// ❌ Node.js の書き方をそのまま使う
const apiUrl = process.env.VITE_API_URL  // Vite ではこれは動かない（undefined）
```

**原因**

Vite はブラウザ向けのバンドラーであり、Node.js の `process.env` はブラウザ環境に存在しない。Vite は独自の仕組みで環境変数を注入する。

**解決策**

```ts
// ✅ Vite の環境変数は import.meta.env で参照
const apiUrl = import.meta.env.VITE_API_URL

// ビルドモードの判定
if (import.meta.env.DEV) {
  console.log('開発モード')
}
if (import.meta.env.PROD) {
  console.log('本番モード')
}
```

**`.env` ファイルの規則:**

```bash
# .env（全環境共通）
VITE_APP_NAME=IPA単語帳

# .env.development（npm run dev 時）
VITE_API_URL=http://localhost:3000

# .env.production（npm run build 時）
VITE_API_URL=https://api.example.com
```

**重要**: `VITE_` プレフィックスがない変数はブラウザ側のコードには公開されない（セキュリティのため）。

**TypeScript の型定義:**

```ts
// src/vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

### 15. CORS エラー

**問題**

```
Access to fetch at 'https://api.example.com/terms' from origin
'http://localhost:5173' has been blocked by CORS policy
```

開発中に外部 API を呼ぶと、ブラウザに CORS エラーが出る。

**原因**

ブラウザは異なるオリジン（ドメイン・ポート・プロトコル）への HTTP リクエストを制限する（Same-Origin Policy）。サーバー側が許可するオリジンを `Access-Control-Allow-Origin` ヘッダーで返さないとブラウザがブロックする。

**解決策**

開発中は Vite のプロキシ機能を使う（実際のリクエストはサーバーからサーバーになるため CORS が発生しない）:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

```ts
// アプリ側は /api でリクエスト（プロキシが転送する）
const res = await fetch('/api/terms')
```

本番環境では API サーバー側で `Access-Control-Allow-Origin` ヘッダーを設定するか、同じオリジンから配信する。

---

### 16. パス問題（base path、GitHub Pages でのパス設定）

**問題**

ローカルでは動くが GitHub Pages にデプロイすると画面が真っ白になる。コンソールに以下のエラーが出る:

```
GET https://miyaw.github.io/assets/index-xxx.js net::ERR_ABORTED 404
```

**原因**

Vite はデフォルトでルート（`/`）を base として JS / CSS のパスを生成する。しかし GitHub Pages では `https://miyaw.github.io/ipa-words/` のように**サブパス**が付く。このため `/assets/index.js` を探しに行って 404 になる。

**解決策**

```ts
// vite.config.ts
export default defineConfig({
  base: '/ipa-words/',  // ← リポジトリ名に合わせる
  // ...
})
```

これにより `dist/index.html` 内のパスが `/ipa-words/assets/index.js` になる。

**React Router を使う場合（SPA のルーティング問題）:**

GitHub Pages は SPA のクライアントサイドルーティングを理解しない。`/ipa-words/words/123` に直接アクセスすると 404 になる。

```tsx
// ✅ HashRouter を使う（# によるルーティング）
import { HashRouter } from 'react-router-dom'
// URL: https://miyaw.github.io/ipa-words/#/words/123

// または 404.html にリダイレクト処理を書く（やや複雑）
```

**本プロジェクトでの確認方法:**

```bash
# ビルド後にプレビュー（base path が正しく適用されているか確認）
npm run build
npm run preview
# http://localhost:4173/ipa-words/ でアクセスできれば OK
```
