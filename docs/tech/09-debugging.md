# デバッグ手法

## Chrome DevTools 基本操作

Chrome DevTools は Web開発の標準デバッガ。`F12` または `Ctrl+Shift+I` で開く。

**Java開発者向けの全体像:**

| DevToolsのタブ | 役割 | Javaでの対応物 |
|---|---|---|
| Elements | DOMツリーとCSSの確認・編集 | XMLビュー |
| Console | ログ出力・JS実行 | System.out.println / JShell |
| Sources | ブレークポイント・ステップ実行 | IntelliJデバッガ |
| Network | HTTPリクエスト/レスポンス確認 | Fiddler / WireShark |
| Application | localStorage / Service Worker確認 | DBビュー / キャッシュ確認 |

---

### Elements タブ（DOM インスペクション）

HTMLのDOMツリーをリアルタイムで確認・編集できる。

**使い方:**
- 画面上の要素を右クリック →「検証」でその要素にジャンプ
- 左上の矢印アイコンをクリック後、画面の要素をクリックするとピンポイント選択
- 選択中の要素のCSSは右ペインの「Styles」で確認。その場で値を変更してプレビューできる

**デバッグに役立つシーン:**
- スタイルが当たっていない → Stylesペインで「Inherited from...」を追う
- レイアウトがずれる → 「Computed」タブでbox modelを確認
- CSS Modulesのクラス名（`WordCard_card__xK3jP` 等）が実際に付いているか確認

---

### Console タブ（console.log とJS実行）

**Javaとの対比:**

| Java | JavaScript |
|---|---|
| `System.out.println(x)` | `console.log(x)` |
| `System.err.println(e)` | `console.error(e)` |
| `logger.warn(msg)` | `console.warn(msg)` |

Consoleはただのログ表示だけでなく、**その場でJSを実行できる**。

```js
// Consoleで直接実行できる例
localStorage.getItem('ipa-words-progress')  // 保存された進捗を確認
JSON.parse(localStorage.getItem('ipa-words-progress'))  // 整形して確認
document.querySelectorAll('[class*="card"]')  // cardを含むクラス名の要素一覧
```

**ログの種類:**
```ts
console.log('通常のログ', someObject)    // オブジェクトは展開して確認できる
console.error('エラー', error)           // 赤色で表示
console.warn('警告', value)             // 黄色で表示
console.table(termsArray)              // 配列をテーブル表示（便利）
console.group('useFilter')             // グループ化して折りたたみ
console.log('filtered:', filtered)
console.groupEnd()
```

---

### Sources タブ（ブレークポイント・ステップ実行）

IntelliJのデバッガとほぼ同じ操作感でブレークポイントを張れる。

**手順:**
1. Sources タブを開く
2. 左ペインのファイルツリーから `src/hooks/useFilter.ts` などを開く
   - `Ctrl+P` でファイル名検索（IntelliJの `Shift+Shift` 相当）
3. 行番号をクリック → 青い丸 = ブレークポイント
4. アプリを操作してブレークポイントに到達したら一時停止
5. 右ペインで変数の値を確認

**ステップ実行ボタン（IntelliJと同じキー）:**

| ボタン | 動作 | IntelliJ |
|---|---|---|
| F8 | ステップオーバー（関数に入らない） | F8 |
| F7 | ステップイン（関数に入る） | F7 |
| F9 | 実行再開 | F9 |
| Shift+F11 | ステップアウト（現在の関数を抜ける） | Shift+F8 |

**ソースマップについて:**
Viteはビルド時にソースマップを生成する。開発サーバー（`npm run dev`）では
バンドルされた `.js` ではなく、元の `.ts` / `.tsx` ファイルのコードがそのまま表示される。

---

### Network タブ（HTTPリクエスト確認）

本プロジェクトで特に確認が必要なのは `terms.json` の取得。

**確認手順:**
1. Network タブを開いた状態でページをリロード（`Ctrl+R`）
2. `terms.json` の行をクリック
3. Headers → Request URL, Status Code（200なら成功）
4. Response → 実際に返ってきたJSONを確認

**Fiddlerとの比較:**
- Fiddler は全アプリのHTTPをキャプチャする外部ツール
- DevTools の Network はブラウザのタブ単位で軽量にキャプチャできる

**絞り込みフィルタ:**
- 上部フィルタバーで `Fetch/XHR` を選ぶと `fetch()` のリクエストだけ表示

---

### Application タブ（localStorage・Service Worker・Cache）

PWAデバッグで最もよく使うタブ。

**localStorage の確認:**

左ペイン → Storage → Local Storage → `http://localhost:5173`

```
キー: ipa-words-progress
値:   {"1":{"correct":3,"total":5},"2":{"correct":1,"total":1},...}
```

値を直接ダブルクリックして編集できる。デバッグ時に進捗をリセットしたい場合は
該当行を選択して `Delete` キーで削除できる。

**Service Worker の確認:**

左ペイン → Service Workers

- Status が `activated and is running` なら正常
- 「Update on reload」にチェックを入れると、リロードのたびにSWが更新される（開発中推奨）
- 「Unregister」でSWを削除できる（キャッシュが古い場合の対処）

**Cache Storage の確認:**

左ペイン → Cache Storage → `workbox-...`

Workboxがキャッシュしているファイル一覧が確認できる。
`terms.json` がキャッシュに入っているかを確認する場合はここを見る。

---

## React DevTools

Chrome拡張機能として追加できる専用ツール。インストール後、DevToolsに「Components」と「Profiler」タブが追加される。

インストール: Chrome ウェブストア → 「React Developer Tools」で検索

### Components タブ

Reactのコンポーネントツリーを視覚化する。

```
App
 ├── TabNavigation
 └── WordListPage
      ├── CategoryFilter
      ├── SearchBar
      └── WordCard (×N)
```

**できること:**
- 各コンポーネントをクリックして現在の props / state を確認
- `useFilter` の `filtered` の件数をリアルタイムで確認
- `useProgress` の `progress` の中身を確認

**特に役立つシーン:**
- 「propsが正しく渡っているか」の確認
- 「stateが期待通りに更新されているか」の確認
- 「再レンダリングが多すぎないか」のチェック（Profiler）

---

## TypeScript のエラーメッセージの読み方

TypeScriptのエラーは英語で出るが、パターンを覚えると読みやすい。

**よくあるエラーメッセージ:**

```
Type 'string | null' is not assignable to type 'string'
```
→ `null` になる可能性がある値を `string` として使おうとしている。
→ 対処: `if (value !== null)` でガードするか、`value ?? ''` でデフォルト値を指定する。

```
Property 'foo' does not exist on type 'Bar'
```
→ `Bar` 型のオブジェクトに `foo` プロパティがない。
→ 対処: `src/types/index.ts` で型定義を確認し、正しいプロパティ名を使う。

```
Argument of type 'number' is not assignable to parameter of type 'string'
```
→ 型が合っていない。Javaで `int` を `String` 引数に渡した場合と同じ。
→ 対処: `.toString()` や `String(value)` で変換する。

```
Object is possibly 'undefined'
```
→ `undefined` になる可能性がある値に直接アクセスしようとしている。
→ 対処: `if (value !== undefined)` でガード、またはオプショナルチェーン `value?.property` を使う。

**VSCodeでの確認:**
エラーがある行には赤い波線が引かれる。ホバーすると詳細が表示される。
`Ctrl+Shift+M` で問題パネルを開くと全エラー一覧が確認できる。

---

## よくあるエラーと対処法

### "Cannot read properties of undefined (reading 'xxx')"

**原因:** `undefined` なオブジェクトのプロパティにアクセスしようとした。

```ts
// NG: termがundefinedのときにcrash
const name = term.name

// OK: オプショナルチェーンで安全にアクセス
const name = term?.name

// OK: useQuizのcurrentTermはnullになりうる
if (!currentTerm) return null
```

**本プロジェクトでの典型例:**
`useQuiz` の `currentTerm` は `quizTerms[currentIndex] || null` で、
クイズが始まっていない状態では `null`。
`QuizPage.tsx` では `if (quiz.settings && quiz.currentTerm)` でガードしてから使っている。

---

### "Objects are not valid as a React child"

**原因:** JSXの中にオブジェクトをそのまま書いた。

```tsx
// NG: Dateオブジェクトをそのまま表示しようとしている
<div>{new Date()}</div>

// NG: オブジェクトをそのまま
<div>{term}</div>

// OK: 文字列に変換する
<div>{new Date().toLocaleDateString()}</div>
<div>{term.name}</div>
```

ReactはJSXの子要素として受け付けられるのは `string`, `number`, `ReactElement`, `null`, `undefined`, `boolean` のみ。
プレーンなオブジェクトを渡すと、このエラーが出る。

---

### "Too many re-renders"

**原因:** レンダリング中にstateを更新している無限ループ。

```tsx
// NG: レンダリング中に直接setStateを呼んでいる
function MyComponent() {
  const [count, setCount] = useState(0)
  setCount(count + 1) // ← レンダー中に実行される → 再レンダー → 無限ループ
  return <div>{count}</div>
}

// OK: イベントハンドラかuseEffect内で更新する
function MyComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

---

### "Each child in a list should have a unique 'key' prop"

**原因:** 配列を `.map()` でJSXに変換するとき、`key` propsを指定していない。

```tsx
// NG: keyがない
{terms.map(term => <WordCard term={term} />)}

// OK: ユニークなIDをkeyに使う
{terms.map(term => <WordCard key={term.id} term={term} />)}

// NG: indexをkeyに使うのは避ける（並び替えがある場合）
{terms.map((term, index) => <WordCard key={index} term={term} />)}
```

本プロジェクトでは `term.id` がユニークな整数なのでそれをkeyに使っている。

---

## console.log デバッグのコツ

シンプルな `console.log` はあらゆる状況で有効なデバッグ手法。

### オブジェクトはラベル付きで出力する

```ts
// NG: 値だけ出力すると何の値か分からなくなる
console.log(filtered)

// OK: ラベルをつける
console.log('filtered:', filtered)

// OK: オブジェクト省略記法（変数名がそのままラベルになる）
console.log({ filtered, majorCategoryId, searchQuery })
```

### useEffectのデバッグ

```ts
useEffect(() => {
  console.log('useEffect実行: terms.length =', terms.length)
  // ...
}, [terms])
```

依存配列（`[terms]`）が変わるたびに実行されるため、「いつ実行されているか」が分かる。

### 条件付きブレークポイントの代替

```ts
// 特定の条件のときだけログを出す
if (term.majorCategoryId === '01') {
  console.log('大分類01の用語:', term.name)
}

// debugger文でブレークポイント（Sourcesタブが開いていれば一時停止）
if (filteredLength === 0) {
  debugger  // ここで実行が止まる
}
```

### 不要なconsole.logの削除

開発が終わったら `console.log` は削除する。
ESLintの `no-console` ルールを有効にすれば、残っている場合にlintエラーになる。

---

## VSCode でのデバッグ設定

Sourcesタブを使わず、VSCode内でデバッグしたい場合は `launch.json` を作成する。

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome (Vite)",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMapPathOverrides": {
        "/@fs/*": "${workspaceFolder}/*"
      }
    }
  ]
}
```

**使い方:**
1. `npm run dev` で開発サーバーを起動しておく
2. VSCode の「実行とデバッグ」（`Ctrl+Shift+D`）で「Launch Chrome (Vite)」を選択
3. `F5` で起動 → VSCode上でブレークポイントを張れる

VSCodeのデバッガはChromeのSourcesタブと同等の機能を持つが、
コードエディタと同じウィンドウで操作できる点が便利。
IntelliJの「Debug」ボタンと同じ使い勝手で動かせる。

---

## デバッグ時の典型的な調査フロー

```
問題発生
  |
  | エラーメッセージがConsoleに出ているか確認
  ├─ YES → エラーの種類を特定（上記「よくあるエラー」を参照）
  └─ NO  → console.logを仕掛けてデータの状態を確認
              |
              | データは正しいか？
              ├─ YES → 表示ロジックの問題
              │         → ElementsタブでDOM・CSSを確認
              └─ NO  → データ取得・加工の問題
                        → NetworkタブでJSONの中身を確認
                        → React DevToolsでprops/stateを確認
                        → Sourcesタブでブレークポイントを張る
```
