# React 基礎ガイド

このドキュメントは、JavaやjQueryの経験があるエンジニア向けのReact入門ガイドだ。
このプロジェクト（IPA単語帳）の実際のコードを参照しながら、Reactの主要概念を解説する。

---

## 1. コンポーネントとは

Reactの基本単位は**コンポーネント**だ。UIを独立した部品（コンポーネント）に分割して管理する。

### 関数コンポーネント（現代のReact）

```tsx
// src/components/WordCard.tsx
// コンポーネント = JSXを返す関数
import { useState } from 'react';
import type { Term, TermProgress } from '../types';
import styles from './WordCard.module.css';

interface Props {
  term: Term
  progress: TermProgress | null
}

export function WordCard({ term, progress }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.card} onClick={() => setExpanded(!expanded)}>
      <div className={styles.name}>{term.name}</div>
      {expanded && <div className={styles.description}>{term.description}</div>}
    </div>
  );
}
```

### クラスコンポーネント（旧来のReact、現在は非推奨）

```tsx
// 現在のReactでは通常使わない（参考として）
import { Component } from 'react';

interface State { expanded: boolean; }

class WordCard extends Component<Props, State> {
  state: State = { expanded: false };

  render() {
    const { term } = this.props;
    return (
      <div onClick={() => this.setState({ expanded: !this.state.expanded })}>
        {term.name}
      </div>
    );
  }
}
```

**なぜ関数コンポーネントが推奨されるか**:
- Hooksが使えて、ロジックの再利用が容易
- クラスの `this` によるバグが発生しない
- コードが短くシンプル
- React公式も関数コンポーネントを推奨している

---

## 2. JSXの仕組み

JSXはJavaScript内にHTML風の記法を書けるシンタックスシュガーだ。
ビルド時にReactの関数呼び出しに変換される。

### HTMLとの主な違い

```tsx
// 通常のHTML
<div class="card" for="label">
  <input type="text" />  <!-- 自己閉じタグも / なしでOK -->
</div>

// JSX（TypeScript）
<div className="card" htmlFor="label">
  {/* コメントはこう書く */}
  <input type="text" />  {/* JSXは必ず閉じタグが必要 */}
</div>
```

| HTML属性      | JSX属性       | 理由                         |
|--------------|--------------|------------------------------|
| `class`      | `className`  | `class` はJSの予約語         |
| `for`        | `htmlFor`    | `for` はJSの予約語           |
| `onclick`    | `onClick`    | キャメルケース                |
| `tabindex`   | `tabIndex`   | キャメルケース                |
| `style=""`   | `style={{}}`  | オブジェクトで指定            |

### 式の展開

```tsx
const name = "IPA";
const count = 42;

// {} の中には任意のJS式が書ける
<p>{name}</p>             // 変数
<p>{count * 2}</p>        // 計算
<p>{name.toUpperCase()}</p> // メソッド呼び出し
<p>{`件数: ${count}`}</p> // テンプレートリテラル
```

### 条件分岐

```tsx
// 三項演算子（if/elseに相当）
{isLoading ? <Spinner /> : <Content />}

// &&演算子（条件が真のときだけ表示）
{error && <ErrorMessage message={error} />}

// 複雑な条件は変数に切り出す
const badge = status === 'mastered' ? '覚えた' : status === 'learning' ? '学習中' : '未学習';
return <span>{badge}</span>;

// 実際のプロジェクトコード: src/components/WordCard.tsx
{expanded && (
  <div className={styles.description}>
    <div className={styles.category}>{term.category} › {term.subcategory}</div>
    {term.description}
  </div>
)}
```

### リスト描画

```tsx
// Javaのfor文に相当するのが .map()
// key は必須（Reactがどの要素が変わったか追跡するために使う）
const items = ['リンゴ', 'バナナ', 'ミカン'];
<ul>
  {items.map((item, index) => (
    <li key={index}>{item}</li>
  ))}
</ul>

// 実際のプロジェクトコード: src/pages/WordListPage.tsx
{pageItems.map((term) => (
  <WordCard
    key={term.id}        // ユニークなidをkeyに使うのがベスト
    term={term}
    progress={progress[term.id] || null}
  />
))}

// src/components/TabNavigation.tsx
const tabs = [
  { key: 'list', label: '一覧' },
  { key: 'quiz', label: '出題' },
  { key: 'progress', label: '進捗' },
];

{tabs.map((tab) => (
  <button
    key={tab.key}
    className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
    onClick={() => onTabChange(tab.key)}
  >
    {tab.label}
  </button>
))}
```

---

## 3. props（引数のようなもの、型定義）

propsはコンポーネントに渡す引数だ。Javaのコンストラクタ引数に近い概念。

```tsx
// 親コンポーネントからpropsを渡す
<WordCard term={term} progress={null} />

// 子コンポーネントでpropsを受け取る
// 実際のプロジェクトコード: src/components/WordCard.tsx
interface Props {
  term: Term           // 必須props
  progress: TermProgress | null  // null を許容するprops
}

export function WordCard({ term, progress }: Props) {
  // ...
}
```

```tsx
// src/components/TabNavigation.tsx
interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void  // 関数を渡すこともできる（コールバック）
}

export function TabNavigation({ activeTab, onTabChange }: Props) {
  return (
    <nav>
      {/* onTabChange はボタンのクリックで呼び出す */}
      <button onClick={() => onTabChange('list')}>一覧</button>
    </nav>
  );
}
```

propsのルール：
- 親から子への一方向データフロー（子から親への変更はコールバック関数で行う）
- propsは読み取り専用（変更しようとすると型エラーになる）
- 関数（イベントハンドラ）もpropsとして渡せる

---

## 4. state（useState）とライフサイクル（useEffect）

### Java Servlet のライフサイクルとの対比

```
Java Servlet                     React 関数コンポーネント
─────────────────────────────────────────────────────
init()                     ←→    useEffect(() => { ... }, [])  マウント時
service()（毎リクエスト）  ←→    コンポーネント関数の実行（毎レンダリング）
destroy()                  ←→    useEffect(() => { return () => { ... } }, [])  アンマウント時
```

### useState: 状態の宣言

```tsx
// useState の基本形
const [状態変数, 更新関数] = useState(初期値);

// 実際のプロジェクトコード: src/hooks/useTerms.ts
const [terms, setTerms] = useState<Term[]>([]);     // 配列の初期値は空配列
const [loading, setLoading] = useState(true);        // booleanの初期値
const [error, setError] = useState<string | null>(null); // null許容

// src/components/WordCard.tsx
const [expanded, setExpanded] = useState(false);

// state を更新するには必ず更新関数を使う（直接代入はNG）
// NG: expanded = true;      ← Reactが変更を検知できない
// OK: setExpanded(true);    ← Reactが再レンダリングをスケジュールする
```

**状態更新の注意点**（前の状態に依存する場合）:

```tsx
// src/hooks/useProgress.ts
// 前のstateに依存するときは関数形式で更新する
setProgress((prev) => {
  const entry = prev[termId] || { correct: 0, total: 0 };
  return {
    ...prev,                    // スプレッド演算子で既存のデータをコピー
    [termId]: {
      correct: entry.correct + (correct ? 1 : 0),
      total: entry.total + 1,
    },
  };
});
```

### useEffect: 副作用の処理

副作用（APIコール、タイマー、DOMへの直接アクセスなど）はuseEffectで行う。

```tsx
// マウント時に1回だけ実行（$(document).ready 相当）
useEffect(() => {
  fetch('/api/data').then(/* ... */);
}, []); // 依存配列が空 = マウント時のみ

// 特定のstateが変わったら実行
useEffect(() => {
  document.title = `検索: ${query}`;
}, [query]); // query が変わるたびに実行

// クリーンアップ（Servlet の destroy() 相当）
useEffect(() => {
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer); // アンマウント時にタイマーをクリア
}, []);

// 実際のプロジェクトコード: src/components/SearchBar.tsx
// 300ms のデバウンス処理
useEffect(() => {
  const timer = setTimeout(() => onSearch(value), 300);
  return () => clearTimeout(timer); // 次のuseEffect実行前にも呼ばれる
}, [value, onSearch]);
```

---

## 5. Hooks 一覧

Hooks は `use` から始まる関数で、コンポーネントに状態や副作用を追加する仕組み。

### useState: 状態管理

```tsx
const [count, setCount] = useState(0);
```

### useEffect: 副作用

```tsx
useEffect(() => {
  // 副作用の処理
  return () => { /* クリーンアップ */ };
}, [依存する値]);
```

### useMemo: 計算結果のキャッシュ

```tsx
// 実際のプロジェクトコード: src/hooks/useTerms.ts
// categoriesの計算はtermsが変わったときだけ実行する
const categories = useMemo<Category[]>(() => {
  const map = new Map<string, Category>();
  for (const term of terms) {
    if (!map.has(term.majorCategoryId)) {
      map.set(term.majorCategoryId, {
        id: term.majorCategoryId,
        name: term.category,
        subcategories: [],
      });
    }
    // ...
  }
  return Array.from(map.values()).sort((a, b) => Number(a.id) - Number(b.id));
}, [terms]); // termsが変わったときだけ再計算
```

Javaの例えで言えば、`@Cacheable` や計算済みの値をフィールドに保持するパターンに近い。

### useCallback: 関数のキャッシュ

```tsx
// 実際のプロジェクトコード: src/hooks/useProgress.ts
// recordAnswer関数を毎レンダリング再生成しないようにキャッシュ
const recordAnswer = useCallback((termId: number, correct: boolean) => {
  setProgress((prev) => {
    // ...
  });
}, []); // 依存する値が変わらなければ同じ関数オブジェクトを返す

// src/pages/WordListPage.tsx
const handleSearch = useCallback(
  (q: string) => {
    setSearchQuery(q);
    setPage(0);
  },
  [setSearchQuery] // setSearchQuery が変わったときだけ再生成
);
```

子コンポーネントに関数をpropsとして渡すとき、`useCallback` でラップしないと毎レンダリング新しい関数が生成されて子が無駄に再描画される。

### useRef: DOM要素への参照・再レンダリングをまたぐ値の保持

```tsx
// DOM要素への参照
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => { inputRef.current?.focus(); }, []);
return <input ref={inputRef} />;

// タイマーIDなど、再レンダリングをまたいで保持したい値
const timerRef = useRef<ReturnType<typeof setTimeout>>();
timerRef.current = setTimeout(() => { /* ... */ }, 1000);
```

**Hooksのルール**（Javaにはない概念）:
1. Hooksはコンポーネントのトップレベルでのみ呼べる（if文やループの中で呼ばない）
2. Hooksはカスタムフックかコンポーネント関数の中でのみ呼べる

---

## 6. 仮想DOMの仕組み

Reactが高速に動作できる理由は「仮想DOM（Virtual DOM）」にある。

```
状態変更 → 新しいVirtual DOM生成 → 前のVirtual DOMとの差分を計算（Diffing）
         → 変わった部分だけ実際のDOMに反映（Reconciliation）
```

具体的なイメージ:

```tsx
// WordCard の expanded が false → true に変わったとき

// 変更前の仮想DOM
<div className="card">
  <div className="name">プロセス管理</div>
  {/* expanded=falseなので description は存在しない */}
</div>

// 変更後の仮想DOM
<div className="card">
  <div className="name">プロセス管理</div>
  <div className="description">OSが複数のプロセスを...</div>  ← 追加
</div>

// Reactは差分（descriptionが追加された）だけをDOMに反映する
// → jQueryの $(..).show() より効率的で、開発者が差分を意識しなくてよい
```

`key` プロパティはDiffingアルゴリズムへのヒントだ。リストの要素を正確に追跡するために使う。

```tsx
// keyがないと、リストの順序変更でReactが要素を間違えて再利用する
{terms.map((term) => (
  <WordCard key={term.id} term={term} />  // idをkeyにすると正確
))}
```

---

## 7. CSS Modules vs 従来のCSS（グローバルCSS問題）

### 従来のCSS（グローバルスコープ）の問題点

```css
/* styles.css: グローバルなクラス名 */
.card { padding: 12px; }
.title { font-size: 1.2rem; }
```

```html
<!-- JSPのテンプレート: 別のページの .title が上書きされてしまうリスク -->
<div class="card">
  <h2 class="title">見出し</h2>
</div>
```

チームが大きくなるとクラス名の衝突が問題になる。これを防ぐために BEM記法（`card__title`）のような命名規則を使ってきた。

### CSS Modules（スコープを持つCSS）

```css
/* WordCard.module.css */
.card { padding: 12px; }
.name { font-size: 1rem; font-weight: 600; }
```

```tsx
// WordCard.tsx: クラス名を import してオブジェクトとして使う
import styles from './WordCard.module.css';

function WordCard() {
  return (
    <div className={styles.card}>      {/* → "WordCard_card__xK3mP" に変換 */}
      <div className={styles.name}>...</div>  {/* → "WordCard_name__7aB2c" */}
    </div>
  );
}
```

ビルド時にクラス名がハッシュ付きのユニークな文字列に変換されるため、他のコンポーネントとクラス名が衝突しない。

### 複数クラスの結合

```tsx
// 実際のプロジェクトコード: src/components/WordCard.tsx
// テンプレートリテラルで複数のクラスを結合
<div className={`${styles.status} ${styles[status]}`}>

// src/components/TabNavigation.tsx
// 条件でクラスを切り替える
<button
  className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
>
```

### グローバルCSSとの使い分け

```css
/* src/index.css: ベーススタイルはグローバルCSSで */
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: sans-serif; }
```

```css
/* 各コンポーネントのスタイルはCSS Modulesで */
/* WordCard.module.css, FlashCard.module.css ... */
```

---

## 8. コンポーネント設計のベストプラクティス

### 関心の分離: ロジックとUIを分ける（カスタムHooks）

```tsx
// 悪い例: コンポーネントにロジックを詰め込む
function WordListPage() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => { /* fetch処理 */ }, []);
  useEffect(() => { /* フィルタ処理 */ }, [terms, query]);

  return <div>/* 長いJSX */</div>;
}
```

```tsx
// 良い例: ロジックをカスタムHooksに分離
// 実際のプロジェクトの構造:
// src/hooks/useTerms.ts    ← データ取得ロジック
// src/hooks/useFilter.ts   ← フィルタリングロジック
// src/hooks/useProgress.ts ← 進捗管理ロジック
// src/hooks/useQuiz.ts     ← クイズロジック

// src/pages/WordListPage.tsx: ロジックはHooksに任せ、UIだけを書く
export function WordListPage({ terms, categories, progress }: Props) {
  const { majorCategoryId, filtered, setMajorCategory, setSearchQuery } = useFilter(terms);
  const [page, setPage] = useState(0);
  // ...
  return <div>/* UIに集中できる */</div>;
}
```

Javaで言えば、Service層とController層を分けるのに近い考え方だ。

### 単一責任の原則（コンポーネントは1つのことだけ）

```
App.tsx
├── TabNavigation    ← タブ切り替えのUI
├── WordListPage     ← 単語一覧ページ
│   ├── CategoryFilter  ← カテゴリ絞り込みUI
│   ├── SearchBar       ← 検索UIとデバウンスロジック
│   └── WordCard        ← 単語カード1枚のUI
├── QuizPage         ← 出題ページ
│   ├── FlashCard       ← フラッシュカード形式
│   └── MultipleChoice  ← 4択形式
└── ProgressPage     ← 進捗確認ページ
```

### propsのバケツリレー問題とその解決

```tsx
// 問題: 深くネストしたコンポーネントへのprops渡し（バケツリレー）
// App → WordListPage → WordCard → StatusBadge → ... とpropsが流れる

// 解決策1: Context API（アプリ全体で共有する状態）
const ProgressContext = createContext<Progress>({});

function App() {
  const { progress } = useProgress();
  return (
    <ProgressContext.Provider value={progress}>
      <WordListPage />  {/* progressをpropsで渡さなくてよい */}
    </ProgressContext.Provider>
  );
}

// 解決策2: Zustand などの状態管理ライブラリ
// 解決策3: コンポーネント構成を見直す（このプロジェクトでは採用）
// App.tsxでuseProgress()してpropsで渡す（階層が浅いので許容）
```

### メモ化の使いどころ

```tsx
// src/pages/WordListPage.tsx
// pageItemsはfilteredとpageが変わったときだけ再計算
const pageItems = useMemo(
  () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
  [filtered, page]
);

// 関数はuseCallbackでメモ化（子コンポーネントに渡すとき）
const handleSearch = useCallback(
  (q: string) => {
    setSearchQuery(q);
    setPage(0);
  },
  [setSearchQuery]
);
```

**メモ化のガイドライン**:
- 計算量の多い処理 → `useMemo`
- 子コンポーネントにpropsとして渡す関数 → `useCallback`
- 単純な値の計算 → メモ化不要（オーバーエンジニアリングになる）

---

## このプロジェクトのコンポーネント構成まとめ

```
src/
├── types/
│   └── index.ts          ← 全型定義（Term, Category, Progress...）
├── hooks/
│   ├── useTerms.ts        ← データ取得 + カテゴリ生成
│   ├── useFilter.ts       ← 絞り込み + 検索ロジック
│   ├── useProgress.ts     ← 進捗のCRUD + localStorage永続化
│   └── useQuiz.ts         ← クイズのセッション管理
├── components/
│   ├── WordCard.tsx        ← 単語カード（クリックで展開）
│   ├── FlashCard.tsx       ← フラッシュカード（表/裏）
│   ├── MultipleChoice.tsx  ← 4択問題
│   ├── CategoryFilter.tsx  ← カテゴリドロップダウン
│   ├── SearchBar.tsx       ← 検索入力（デバウンス付き）
│   ├── TabNavigation.tsx   ← ボトムナビゲーション
│   └── QuizResult.tsx      ← クイズ結果表示
├── pages/
│   ├── WordListPage.tsx    ← 単語一覧（フィルタ + ページネーション）
│   ├── QuizPage.tsx        ← 出題設定 + クイズ進行
│   └── ProgressPage.tsx    ← 学習進捗グラフ
└── App.tsx                 ← ルーティング（タブ切り替え）
```

各ファイルが単一の責任を持ち、HooksがロジックをUIから分離している。
この構造がReactのベストプラクティスの典型例だ。
