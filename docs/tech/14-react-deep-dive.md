# React 詳細ガイド — 思想から実践まで

Java / jQuery エンジニアがReactを基礎から中級レベルまで習得するための包括的なガイド。
本プロジェクト（IPA単語帳PWA）のソースコードを実例として随所で参照する。

---

## 目次

1. [Reactの思想](#1-reactの思想)
2. [JSX 詳解](#2-jsx-詳解)
3. [コンポーネント設計](#3-コンポーネント設計)
4. [useState 詳解](#4-usestate-詳解)
5. [useEffect 詳解](#5-useeffect-詳解)
6. [useMemo と useCallback](#6-usememo-と-usecallback)
7. [useRef](#7-useref)
8. [カスタムHooks](#8-カスタムhooks)
9. [状態管理の全体像](#9-状態管理の全体像)
10. [パフォーマンス最適化](#10-パフォーマンス最適化)
11. [よく使うパターン集](#11-よく使うパターン集)

---

## 1. Reactの思想

Reactを使いこなすには、まずReactが「なぜそう設計されているか」を理解することが重要だ。
コードの書き方だけでなく、思想を理解することで迷ったときに正しい判断ができる。

### 1.1 宣言的UI vs 命令的UI（jQuery対比）

**命令的UI（jQuery）** とは「どうやって画面を変えるか」を手続き的に書くスタイルだ。

```javascript
// jQuery: 命令的UI
// 「このボタンをクリックしたら、このdivを探して、クラスを追加して、テキストを変えて...」
$('#loadBtn').on('click', function () {
  $('#spinner').show();
  $('#content').hide();
  $.ajax('/api/data', {
    success: function (data) {
      $('#spinner').hide();
      $('#content').show();
      $('#content').text(data.message);
      if (data.isError) {
        $('#content').addClass('error');
      } else {
        $('#content').removeClass('error');
      }
    },
  });
});
```

コードが増えるにつれ、「今DOMがどういう状態にあるか」を常に追跡しなければならない。
ボタンが二重クリックされたら？他の場所からも同じ要素を変更したら？状態の追跡が破綻する。

**宣言的UI（React）** とは「状態に対してUIがどう見えるか」を宣言するスタイルだ。

```tsx
// React: 宣言的UI
// 「loadingがtrueなら spinner を、falseなら content を表示する」
function DataView() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      setData(json.message);
      setIsError(false);
    } catch {
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // UIは「状態の関数」として宣言する
  // Reactが差分を計算して自動でDOMを更新する
  return (
    <div>
      <button onClick={handleLoad}>読み込む</button>
      {loading && <div className="spinner" />}
      {!loading && data && (
        <div className={isError ? 'error' : ''}>{data}</div>
      )}
    </div>
  );
}
```

**宣言的UIの利点:**
- UIの状態が常にstateから導出される（手動でDOMを同期する必要がない）
- コードを読むだけで「どの状態のときにどう見えるか」が分かる
- バグが減る（DOMの手動操作ミスが起きない）

### 1.2 コンポーネント指向（部品の再利用性）

Javaで言うクラスの継承やインターフェース実装に相当する概念が、Reactでは「コンポーネント」だ。
UIをコンポーネントという独立した部品に分割し、それを組み合わせてアプリを作る。

本プロジェクトではUIを次のように分割している:

```
App
├── TabNavigation     ← タブバー
├── WordListPage      ← 単語一覧ページ
│   ├── CategoryFilter  ← カテゴリフィルター
│   ├── SearchBar       ← 検索バー
│   └── WordCard        ← 単語カード（複数）
├── QuizPage          ← クイズページ
│   ├── FlashCard       ← フラッシュカード
│   └── MultipleChoice  ← 4択問題
└── ProgressPage      ← 進捗ページ
```

`WordCard` は単語一覧でもクイズ結果画面でも再利用できる。
`CategoryFilter` は単語一覧画面でもクイズ設定画面でも使い回せる。

### 1.3 単方向データフロー（one-way data binding）

Reactのデータは**親から子へ**という一方向にしか流れない。
これはjQuery（双方向に自由にDOMを操作できる）やVue.js（`v-model` で双方向バインド）と対照的だ。

```
App (state: activeTab, terms, progress)
  ↓ props で渡す
WordListPage (terms, categories, progress を受け取る)
  ↓ props で渡す
WordCard (term, progress を受け取る)
```

子が親のstateを変えたい場合は、**コールバック関数をpropsで受け取る**方式を使う:

```tsx
// App.tsx
function App() {
  const [count, setCount] = useState(0);

  // 子に「増やしたいときはこれを呼べ」という関数を渡す
  return <Counter value={count} onIncrement={() => setCount(c => c + 1)} />;
}

// Counter.tsx
function Counter({ value, onIncrement }: { value: number; onIncrement: () => void }) {
  return (
    <div>
      <span>{value}</span>
      <button onClick={onIncrement}>+1</button>
    </div>
  );
}
```

**なぜ単方向か？**
データの流れが追いやすくなる。「このstateはどこで変更されているか」を追うとき、
propsを受け取っているか、その親が変更しているかのどちらかしかない。
双方向バインドだと、「誰が変えたか」の追跡が困難になる。

### 1.4 イミュータビリティ（なぜstateを直接変更しないか）

Reactのstateは**イミュータブル（不変）** として扱わなければならない。

```tsx
// NG: stateを直接変更する
const [user, setUser] = useState({ name: '田中', age: 25 });

// これは絶対にやってはいけない
user.name = '鈴木'; // Reactは変化を検知できない！
setUser(user);      // 同じオブジェクト参照なのでレンダリングが起きない
```

```tsx
// OK: 新しいオブジェクトを作って渡す
setUser({ ...user, name: '鈴木' }); // スプレッド構文で新オブジェクトを生成
```

**Javaとの対比:**
Javaの `final` フィールドに似ているが、Reactでは「参照が変わったか」を比較してレンダリングを最適化している。
同じオブジェクトを変更しても参照は変わらないため、Reactは変化を検知できない。

### 1.5 合成 vs 継承（ReactはコンポジションをJavaの継承の代わりに使う）

Javaでは機能の共有に `class A extends B` という継承をよく使う。
Reactはクラス継承を推奨せず、**コンポジション（合成）** を使う。

```tsx
// NG: 継承でUIを共有しようとする考え方（Reactでは機能しない）

// OK: コンポジションで共通UIを実現する
// 「枠」コンポーネントに children を渡してコンテンツを差し込む
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h2 className="card-title">{title}</h2>
      <div className="card-body">{children}</div>
    </div>
  );
}

// 使い方: 任意のコンテンツを children として渡す
function UserProfile() {
  return (
    <Card title="プロフィール">
      <p>田中 太郎</p>
      <p>エンジニア</p>
    </Card>
  );
}

function ProductDetail() {
  return (
    <Card title="商品詳細">
      <img src="product.jpg" alt="商品" />
      <p>価格: 1,000円</p>
    </Card>
  );
}
```

ロジックの共有はカスタムHooksで行う（後述のセクション8を参照）。

---

## 2. JSX 詳解

### 2.1 JSXとは

JSXは JavaScript XML の略で、JavaScriptの中にHTMLライクな構文を書ける拡張だ。
コンパイル時に `React.createElement()` の呼び出しに変換される。

```tsx
// JSX で書いた場合
const element = <h1 className="title">Hello World</h1>;

// コンパイル後（React.createElement の呼び出しに変換される）
const element = React.createElement('h1', { className: 'title' }, 'Hello World');
```

JSXがあることで、UIの構造をHTMLに近い感覚で書けるため可読性が上がる。

### 2.2 HTMLとの違い一覧

JSXはHTMLではなくJavaScriptなので、いくつかの違いがある。

| HTML属性 | JSX属性 | 理由 |
|---------|---------|------|
| `class` | `className` | `class` はJSの予約語 |
| `for` | `htmlFor` | `for` はJSの予約語 |
| `style="color: red"` | `style={{ color: 'red' }}` | styleはオブジェクトを渡す |
| `onclick="fn()"` | `onClick={fn}` | camelCaseで関数参照を渡す |
| `tabindex` | `tabIndex` | camelCase |
| `<br>` | `<br />` | 空要素も閉じタグ必須 |
| `<input>` | `<input />` | 同上 |
| `<!-- comment -->` | `{/* comment */}` | JSのコメント記法 |

```tsx
// HTMLとJSXの違いのまとめ
function Example() {
  const handleClick = () => console.log('clicked');

  return (
    <div>
      {/* HTMLの class → JSXの className */}
      <div className="container">

        {/* style は文字列ではなくオブジェクト。プロパティはcamelCase */}
        <p style={{ color: 'red', fontSize: '16px' }}>赤いテキスト</p>

        {/* イベントはcamelCase + 関数参照（文字列ではない） */}
        <button onClick={handleClick}>クリック</button>

        {/* for は htmlFor */}
        <label htmlFor="email">メール</label>
        <input id="email" type="email" />

        {/* 空要素は必ず閉じる */}
        <br />
        <img src="logo.png" alt="ロゴ" />
      </div>
    </div>
  );
}
```

### 2.3 式の埋め込み: {expression}

`{}` の中には任意のJavaScript式を書ける。

```tsx
function UserGreeting() {
  const name = '田中';
  const score = 85;
  const items = ['React', 'TypeScript', 'Vite'];
  const today = new Date();

  return (
    <div>
      {/* 変数の埋め込み */}
      <p>こんにちは、{name}さん</p>

      {/* 計算式 */}
      <p>スコア: {score >= 80 ? '合格' : '不合格'}</p>

      {/* メソッド呼び出し */}
      <p>今日: {today.toLocaleDateString('ja-JP')}</p>

      {/* テンプレートリテラル */}
      <p>{`点数は ${score} 点です`}</p>

      {/* 配列もOK（ただし通常はmapを使う） */}
      <p>{items.join(', ')}</p>
    </div>
  );
}
```

注意: `{}` の中に書けるのは**式**だけで、`if文` や `for文` などの**文**は書けない。

### 2.4 条件分岐パターン

**パターン1: && 演算子（「表示するかしないか」の二択）**

```tsx
function Notification({ hasNew }: { hasNew: boolean }) {
  return (
    <div>
      {/* hasNew が true のときだけ表示 */}
      {hasNew && <span className="badge">新着</span>}
    </div>
  );
}
```

注意: `{count && <span>{count}</span>}` と書くと、`count` が `0` のとき `"0"` が表示されてしまう。
数値の場合は `{count > 0 && <span>{count}</span>}` または三項演算子を使う。

**パターン2: 三項演算子（二択の出し分け）**

```tsx
function StatusBadge({ isOnline }: { isOnline: boolean }) {
  return (
    <span className={isOnline ? 'online' : 'offline'}>
      {isOnline ? 'オンライン' : 'オフライン'}
    </span>
  );
}
```

本プロジェクトの `WordCard.tsx` での実例:

```tsx
// src/components/WordCard.tsx より
<div className={`${styles.status} ${styles[status]}`}>
  {status === 'mastered' ? '覚えた' : status === 'learning' ? '学習中' : '未学習'}
</div>
```

**パターン3: 変数に格納（複雑な条件分岐）**

```tsx
function QuizContent({ phase }: { phase: 'settings' | 'quiz' | 'result' }) {
  // JSXを変数に格納できる
  let content: React.ReactNode;

  if (phase === 'settings') {
    content = <SettingsForm />;
  } else if (phase === 'quiz') {
    content = <QuizCard />;
  } else {
    content = <ResultSummary />;
  }

  return <div className="container">{content}</div>;
}
```

本プロジェクトの `QuizPage.tsx` が採用しているパターン:

```tsx
// src/pages/QuizPage.tsx より（早期returnパターン）
if (quiz.isFinished) {
  return <QuizResult ... />;
}
if (quiz.settings && quiz.currentTerm) {
  return <div>... 出題画面 ...</div>;
}
return <div>... 設定画面 ...</div>;
```

**パターン4: 即時関数（IIFE）**

```tsx
function Example({ type }: { type: string }) {
  return (
    <div>
      {(() => {
        switch (type) {
          case 'a': return <ComponentA />;
          case 'b': return <ComponentB />;
          default:  return <ComponentC />;
        }
      })()}
    </div>
  );
}
```

### 2.5 リスト描画: map() と key の重要性

配列のデータからJSXのリストを作るには `Array.map()` を使う。

```tsx
function TermList({ terms }: { terms: Term[] }) {
  return (
    <ul>
      {terms.map(term => (
        // key は必須。Reactがどの要素が変わったかを追跡するために使う
        <li key={term.id}>
          {term.name} - {term.reading}
        </li>
      ))}
    </ul>
  );
}
```

本プロジェクトの `TabNavigation.tsx` での実例:

```tsx
// src/components/TabNavigation.tsx より
{tabs.map(tab => (
  <button
    key={tab.key}  // ← key は一意な識別子
    className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
    onClick={() => onTabChange(tab.key)}
  >
    {tab.label}
  </button>
))}
```

**key について:**

```tsx
// NG: インデックスをkeyに使う（並び替えやフィルタ後にバグが起きやすい）
{items.map((item, index) => <div key={index}>{item}</div>)}

// OK: 一意なIDをkeyに使う
{items.map(item => <div key={item.id}>{item.name}</div>)}

// OK: 一意な文字列をkeyに使う
{['list', 'quiz', 'progress'].map(tab => <div key={tab}>{tab}</div>)}
```

keyはReactが仮想DOMの差分を計算するときに使う。正しいkeyを設定することで、
リストの一部だけを効率的に更新できる。keyは兄弟要素の中で一意であればよく、
グローバルで一意である必要はない。

### 2.6 フラグメント

コンポーネントは常に単一のルート要素を返さなければならない。
しかし余分な `<div>` を増やしたくない場合はフラグメントを使う。

```tsx
// NG: 複数要素を並べて返せない
function DoubleText() {
  return (
    <p>テキスト1</p>
    <p>テキスト2</p>  // エラー
  );
}

// OK: <> </> でラップ（短縮記法）
function DoubleText() {
  return (
    <>
      <p>テキスト1</p>
      <p>テキスト2</p>
    </>
  );
}

// OK: <React.Fragment> （keyが必要なリスト内でのみ明示的に使う）
function TermRows({ terms }: { terms: Term[] }) {
  return (
    <tbody>
      {terms.map(term => (
        <React.Fragment key={term.id}>
          <tr><td>{term.name}</td></tr>
          <tr><td>{term.description}</td></tr>
        </React.Fragment>
      ))}
    </tbody>
  );
}
```

### 2.7 children prop

`children` はコンポーネントの開始タグと終了タグの間のコンテンツを受け取る特殊なpropsだ。

```tsx
interface LayoutProps {
  title: string;
  children: React.ReactNode;  // 任意のJSXを受け取る
}

function Layout({ title, children }: LayoutProps) {
  return (
    <div className="layout">
      <header><h1>{title}</h1></header>
      <main>{children}</main>  {/* 呼び出し元が渡したJSXがここに入る */}
      <footer>Copyright 2025</footer>
    </div>
  );
}

// 使い方
function Page() {
  return (
    <Layout title="IPA単語帳">
      <p>ここのコンテンツが children として渡される</p>
      <WordList />
    </Layout>
  );
}
```

### 2.8 イベントハンドリング（合成イベント）

Reactはブラウザのネイティブイベントをラップした「合成イベント（SyntheticEvent）」を使う。
これによりブラウザ間の差異を吸収している。

```tsx
function EventExamples() {
  // イベントオブジェクトの型は React.イベント名Event<要素型>
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('クリック位置:', e.clientX, e.clientY);
    e.preventDefault();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('入力値:', e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // フォームのデフォルト送信を防ぐ
    // バリデーション・送信処理
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Enterが押された');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button onClick={handleClick}>送信</button>
    </form>
  );
}
```

本プロジェクトの `SearchBar.tsx` での実例:

```tsx
// src/components/SearchBar.tsx より
<input
  value={value}
  onChange={e => setValue(e.target.value)}  // e.target.value で入力値を取得
/>
```

### 2.9 スプレッド構文でprops展開

```tsx
interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary';
  disabled?: boolean;
  onClick: () => void;
}

function Button({ label, variant, ...rest }: ButtonProps) {
  // ...rest には disabled, onClick が含まれる
  return (
    <button className={`btn btn-${variant}`} {...rest}>
      {label}
    </button>
  );
}

// 親からpropsをまとめて渡すパターン
function ParentComponent() {
  const buttonProps = {
    label: '送信',
    variant: 'primary' as const,
    disabled: false,
    onClick: () => console.log('送信'),
  };

  return <Button {...buttonProps} />;
}
```

---

## 3. コンポーネント設計

### 3.1 関数コンポーネント（現在の標準）

React 16.8以降はHooksの登場により、関数コンポーネントが標準となった。
クラスコンポーネントはレガシーコードでしか見ない。

```tsx
// 現在の標準: 関数コンポーネント
function Welcome({ name }: { name: string }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>こんにちは、{name}さん</p>
      <p>クリック数: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
    </div>
  );
}

// 同じ意味のアロー関数版（どちらでも良いが、本プロジェクトは function 宣言を使用）
const Welcome = ({ name }: { name: string }) => {
  // ...
};
```

### 3.2 props の受け取り方（分割代入）

```tsx
// パターン1: 引数で分割代入
function UserCard({ name, age, email }: { name: string; age: number; email: string }) {
  return <div>{name} ({age}) - {email}</div>;
}

// パターン2: interfaceを使って型を外出し（推奨）
interface UserCardProps {
  name: string;
  age: number;
  email: string;
}

function UserCard({ name, age, email }: UserCardProps) {
  return <div>{name} ({age}) - {email}</div>;
}

// パターン3: propsオブジェクトをそのまま受け取る（あまり使わない）
function UserCard(props: UserCardProps) {
  return <div>{props.name} ({props.age}) - {props.email}</div>;
}
```

### 3.3 props の型定義（interface Props）

本プロジェクトのコンポーネントはすべて `interface Props` パターンを使っている:

```tsx
// src/components/WordCard.tsx より
interface Props {
  term: Term;
  progress: TermProgress | null;
}

export function WordCard({ term, progress }: Props) {
  // ...
}
```

```tsx
// src/components/CategoryFilter.tsx より
interface Props {
  categories: Category[];
  majorCategoryId: string;
  minorCategoryId: string;
  onMajorChange: (id: string) => void;  // コールバック関数の型定義
  onMinorChange: (id: string) => void;
}
```

### 3.4 デフォルト props

```tsx
interface ButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

// 分割代入のデフォルト値で指定する（推奨）
function Button({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
```

### 3.5 children の型（ReactNode）

```tsx
import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;      // 最も汎用的: JSX, string, number, null, 配列など
  footer?: ReactNode;       // オプショナルなchildren
}

// より厳密な型
interface StrictCardProps {
  children: React.ReactElement;  // 単一のReact要素のみ
  // または
  children: string;              // テキストのみ
  // または
  children: ReactNode[];         // 配列のみ
}
```

### 3.6 コンポーネントの分割基準（いつ分けるか）

以下の場合にコンポーネントを分割することを検討する:

1. **再利用できる** — 複数の場所で同じUIが必要
2. **独立したstateを持つ** — 展開/折りたたみ、ローカルな入力値など
3. **大きくなりすぎた** — 1コンポーネントが100行を超えてきたら検討
4. **責務が異なる** — データ取得とUI表示を分離したい

```tsx
// 分割前: 全部一つのコンポーネント（見通しが悪い）
function WordListPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  // ...数十行のロジック...
  return (
    <div>
      {/* ...数十行のJSX... */}
      {terms.map(term => (
        <div onClick={() => setExpanded(term.id === expanded ? null : term.id)}>
          {term.name}
          {expanded === term.id && <p>{term.description}</p>}
        </div>
      ))}
    </div>
  );
}

// 分割後: WordCard が独自のstateを持つ
// → WordListPage は「どのカードを表示するか」だけを知っていればよい
function WordCard({ term, progress }: Props) {
  const [expanded, setExpanded] = useState(false);  // ローカルstate
  return (
    <div onClick={() => setExpanded(!expanded)}>
      {term.name}
      {expanded && <p>{term.description}</p>}
    </div>
  );
}
```

### 3.7 Container/Presentational パターン

データ取得や加工（Container）とUI描画（Presentational）を分離するパターン。
本プロジェクトでは hooks がContainerの役割を担っている。

```tsx
// Container（データ取得・加工）= カスタムHooks
function useWordData() {
  const { terms, categories, loading, error } = useTerms();
  const { filtered, setSearchQuery } = useFilter(terms);
  return { filtered, categories, loading, error, setSearchQuery };
}

// Presentational（純粋なUI描画）= コンポーネント
function WordList({ terms, onSearch }: { terms: Term[]; onSearch: (q: string) => void }) {
  return (
    <div>
      <SearchBar onSearch={onSearch} />
      {terms.map(term => <WordCard key={term.id} term={term} progress={null} />)}
    </div>
  );
}

// つなぎ役
function WordListContainer() {
  const { filtered, loading, setSearchQuery } = useWordData();
  if (loading) return <Spinner />;
  return <WordList terms={filtered} onSearch={setSearchQuery} />;
}
```

### 3.8 制御コンポーネント vs 非制御コンポーネント（フォーム）

**制御コンポーネント（推奨）**: Reactのstateがフォームの入力値を管理する。

```tsx
function ControlledForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // name, email はReactのstateにある → 即座にアクセスできる
    console.log({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}         // ← Reactがinputの値を制御
        onChange={e => setName(e.target.value)}
      />
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button type="submit">送信</button>
    </form>
  );
}
```

**非制御コンポーネント**: DOMがフォームの値を管理する（`ref` でアクセス）。

```tsx
function UncontrolledForm() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // DOMから直接値を取り出す（jQueryスタイルに近い）
    console.log(inputRef.current?.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} defaultValue="初期値" />
      <button type="submit">送信</button>
    </form>
  );
}
```

原則として**制御コンポーネントを使う**。バリデーション、動的な入力制御、
他のstateとの連動が自然に書けるためだ。

### 3.9 コンポーネントのメモ化（React.memo）

親が再レンダリングされるたびに子も再レンダリングされる。
`React.memo` でラップすると、propsが変わらない限り再レンダリングをスキップできる。

```tsx
// React.memo でラップ
const WordCard = React.memo(function WordCard({ term, progress }: Props) {
  return (
    <div>
      <p>{term.name}</p>
      <p>{progress?.total ?? 0} 回解答</p>
    </div>
  );
});

// 使い方は変わらない
<WordCard term={term} progress={progress} />
```

詳しくはセクション10のパフォーマンス最適化で扱う。

---

## 4. useState 詳解

### 4.1 基本的な使い方

```tsx
import { useState } from 'react';

function Counter() {
  // [現在の値, 更新関数] = useState(初期値)
  const [count, setCount] = useState(0);
  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(0)}>リセット</button>
    </div>
  );
}
```

### 4.2 初期値の遅延評価

初期値の計算が重い場合（localStorageのパース、大量データの計算など）は、
**関数を渡す遅延初期化**を使う。初回レンダリング時にのみ実行される。

```tsx
// NG: コンポーネントが再レンダリングされるたびに expensiveCalc() が呼ばれる
const [data, setData] = useState(expensiveCalc());

// OK: 初回のみ呼ばれる（関数を渡す）
const [data, setData] = useState(() => expensiveCalc());
```

本プロジェクトの `useProgress.ts` での実例:

```tsx
// src/hooks/useProgress.ts より
function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};  // JSONパースが毎回走ると無駄
  } catch {
    return {};
  }
}

export function useProgress() {
  // loadProgress を関数として渡す → 初回のみ実行
  const [progress, setProgress] = useState<Progress>(loadProgress);
  // ※ loadProgress() と () を付けて呼ぶとNG（関数参照を渡す）
}
```

### 4.3 オブジェクトや配列のstate（イミュータブル更新）

```tsx
interface User {
  name: string;
  age: number;
  address: { city: string; zip: string };
}

function ProfileEditor() {
  const [user, setUser] = useState<User>({
    name: '田中太郎',
    age: 25,
    address: { city: '東京', zip: '100-0001' },
  });

  // NG: 直接変更（Reactが変化を検知できない）
  const updateNameBad = () => {
    user.name = '鈴木花子';  // 直接変更はNG
    setUser(user);            // 同じ参照なのでレンダリングされない
  };

  // OK: スプレッド構文で新しいオブジェクトを作る
  const updateName = () => {
    setUser({ ...user, name: '鈜木花子' });
  };

  // OK: ネストしたオブジェクトの更新
  const updateCity = (city: string) => {
    setUser({
      ...user,
      address: { ...user.address, city },  // ネストもスプレッドで
    });
  };

  // 配列のstate更新
  const [tags, setTags] = useState<string[]>(['React', 'TypeScript']);

  // 追加
  const addTag = (tag: string) => {
    setTags([...tags, tag]);
  };

  // 削除
  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // 更新
  const updateTag = (index: number, newTag: string) => {
    setTags(tags.map((tag, i) => (i === index ? newTag : tag)));
  };

  return <div>{/* ... */}</div>;
}
```

### 4.4 stateの更新は非同期（バッチ処理）

```tsx
function Example() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // React 18以降は自動バッチ処理されるが、
    // 同じレンダリング内で複数回setしても即座には反映されない
    setCount(count + 1);  // count は今も0
    setCount(count + 1);  // count は今も0（結果: 1になるだけ）

    // OK: 関数型更新で前の値を受け取る
    setCount(prev => prev + 1);  // prev=0 → 1
    setCount(prev => prev + 1);  // prev=1 → 2（結果: 2になる）
  };

  // setの直後にcountを読んでも古い値が返る
  const handleBad = () => {
    setCount(count + 1);
    console.log(count);  // ← まだ古い値。この方法では最新値は取れない
  };
}
```

### 4.5 関数型更新: setState(prev => ...)

前の状態に基づいて更新する場合は**必ず関数型更新**を使う。
これは特にコールバック内（useEffect内、イベントハンドラのクロージャ内）で重要だ。

```tsx
function Timer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // NG: seconds は最初の値をキャプチャしたまま（クロージャの問題）
      // setSeconds(seconds + 1);  // 常に 0 + 1 = 1 になってしまう

      // OK: prev を受け取って更新する
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);  // 依存配列が空でも正しく動く

  return <p>{seconds}秒</p>;
}
```

本プロジェクトの `useProgress.ts` での実例:

```tsx
// src/hooks/useProgress.ts より
const recordAnswer = useCallback((termId: number, correct: boolean) => {
  setProgress(prev => {  // 関数型更新で最新のprevを受け取る
    const entry = prev[termId] || { correct: 0, total: 0 };
    const next: Progress = {
      ...prev,
      [termId]: {
        correct: entry.correct + (correct ? 1 : 0),
        total: entry.total + 1,
      },
    };
    saveProgress(next);
    return next;
  });
}, []);
```

### 4.6 複数のstate vs オブジェクトにまとめるか

```tsx
// パターン1: 独立した複数のstate（関連性が低い場合）
const [name, setName] = useState('');
const [age, setAge] = useState(0);
const [loading, setLoading] = useState(false);  // ← nameとは無関係

// パターン2: オブジェクトにまとめる（密接に関連する場合）
const [user, setUser] = useState({ name: '', age: 0 });

// パターン3: フォームの複数フィールド（まとめると更新が楽）
interface FormState {
  username: string;
  password: string;
  rememberMe: boolean;
}

const [form, setForm] = useState<FormState>({
  username: '',
  password: '',
  rememberMe: false,
});

// 汎用的なフィールド更新関数
const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
  setForm(prev => ({ ...prev, [key]: value }));
};
```

**判断基準:**
- 一緒に変わることが多い → オブジェクトにまとめる
- 独立して変わる → 別々のstateにする
- useReducerを検討するほど複雑か？ → 通常useStateで十分

### 4.7 実プロジェクト例: useProgress.ts の state 管理

```tsx
// src/hooks/useProgress.ts より（全体の構造）
export function useProgress() {
  // localStorage から初期値を読む（遅延評価）
  const [progress, setProgress] = useState<Progress>(loadProgress);

  // 正解/不正解を記録する
  const recordAnswer = useCallback((termId: number, correct: boolean) => {
    setProgress(prev => {                    // 関数型更新
      const entry = prev[termId] || { correct: 0, total: 0 };
      const next: Progress = {
        ...prev,                             // イミュータブル更新
        [termId]: {
          correct: entry.correct + (correct ? 1 : 0),
          total: entry.total + 1,
        },
      };
      saveProgress(next);                    // 副作用: localStorageに保存
      return next;
    });
  }, []);  // 依存なし（allTermsに依存しないため安定）

  const resetProgress = useCallback(() => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { progress, recordAnswer, resetProgress };
}
```

---

## 5. useEffect 詳解

### 5.1 副作用（Side Effect）とは

React コンポーネントの「純粋な」責務はpropsとstateからJSXを生成することだ。
それ以外の外部とのやりとりを**副作用（Side Effect）** という。

副作用の例:
- データフェッチ（fetch/axios）
- タイマー（setTimeout, setInterval）
- イベントリスナーの登録/解除
- localStorageへの読み書き
- 外部ライブラリの初期化（地図、グラフなど）
- ドキュメントタイトルの変更

これらはレンダリングとは別のタイミングで実行する必要があるため、`useEffect` を使う。

### 5.2 基本構文: useEffect(effect, deps)

```tsx
useEffect(
  () => {
    // 副作用の処理（DOMレンダリング後に実行）

    return () => {
      // クリーンアップ関数（コンポーネントのアンマウント時や
      // 次のeffect実行前に呼ばれる）
    };
  },
  [dep1, dep2]  // 依存配列: これらの値が変わったときにeffectを再実行
);
```

### 5.3 依存配列のパターン

**パターン1: `[]` — マウント時のみ（componentDidMount相当）**

```tsx
function DataFetcher() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []); // ← 空配列: マウント時に1回だけ実行

  return <div>{JSON.stringify(data)}</div>;
}
```

本プロジェクトの `useTerms.ts` での実例:

```tsx
// src/hooks/useTerms.ts より
useEffect(() => {
  fetch(import.meta.env.BASE_URL + 'data/terms.json')
    .then(res => res.json())
    .then((data: Term[]) => {
      setTerms(data);
      setLoading(false);
    })
    .catch(() => {
      setError('データの読み込みに失敗しました');
      setLoading(false);
    });
}, []);  // ← アプリ起動時に1回だけフェッチ
```

**パターン2: `[dep1, dep2]` — 依存値変更時**

```tsx
function UserProfile({ userId }: { userId: number }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // userId が変わるたびにフェッチしなおす
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(setProfile);
  }, [userId]); // ← userId が変わったら再実行

  return <div>{profile?.name}</div>;
}
```

**パターン3: 依存配列なし — 毎回実行（ほぼ使わない）**

```tsx
useEffect(() => {
  // 毎レンダリング後に実行（パフォーマンス的に問題になりやすい）
  document.title = `カウント: ${count}`;
}); // ← 依存配列なし（省略）
```

### 5.4 クリーンアップ関数

クリーンアップを忘れると、コンポーネントがアンマウント後も処理が走り続けるバグが起きる。

**タイマーのクリーンアップ:**

```tsx
function Countdown({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id); // ← アンマウント時にタイマーを解除
  }, [seconds]);

  return <p>残り {remaining} 秒</p>;
}
```

**イベントリスナーのクリーンアップ:**

```tsx
function KeyboardShortcut({ onSave }: { onSave: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown); // ← 必ず解除
  }, [onSave]);

  return null;
}
```

本プロジェクトの `SearchBar.tsx` でのデバウンス実装:

```tsx
// src/components/SearchBar.tsx より
export function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('');

  useEffect(() => {
    // valueが変わったら300ms後にonSearchを呼ぶ（デバウンス）
    const timer = setTimeout(() => onSearch(value), 300);

    // 次のeffect実行前（次のキー入力）にタイマーをキャンセル
    return () => clearTimeout(timer);
  }, [value, onSearch]); // value が変わるたびに実行

  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
      placeholder="用語名・読み・英語で検索..."
    />
  );
}
```

これにより、入力のたびにAPIを呼ばず、入力が300ms止まったときだけ検索が走る。

### 5.5 依存配列の落とし穴

**オブジェクト参照の問題:**

```tsx
function Example() {
  // 毎レンダリングで新しいオブジェクトが生成される
  const options = { page: 1, size: 10 }; // ← 毎回新しい参照

  useEffect(() => {
    fetchData(options);
  }, [options]); // ← optionsは毎回変わる → 無限ループ！

  // 解決策1: プリミティブな値を依存配列に入れる
  useEffect(() => {
    fetchData({ page: 1, size: 10 });
  }, []); // ← 値が変わらないなら空配列でOK

  // 解決策2: useMemoでオブジェクトをメモ化
  const memoOptions = useMemo(() => ({ page: 1, size: 10 }), []);
  useEffect(() => {
    fetchData(memoOptions);
  }, [memoOptions]);
}
```

**関数参照の問題:**

```tsx
function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]); // onSearch が毎回変わると無限ループ
}

// 解決策: 親でuseCallbackを使ってonSearchを安定させる
function Parent() {
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q); // 安定した参照になる
  }, []); // 依存なし

  return <SearchBar onSearch={handleSearch} />;
}
```

### 5.6 useEffect でやるべきこと/やるべきでないこと

**やるべきこと:**
- データフェッチ（APIコール）
- サブスクリプション（WebSocket、EventSource）
- タイマー（setInterval、setTimeout）
- 外部ライブラリとの連携（地図ライブラリの初期化など）

**やるべきでないこと（代替手段あり）:**

```tsx
// NG: stateの変換にuseEffectを使う
function BadExample({ items }: { items: Item[] }) {
  const [filtered, setFiltered] = useState<Item[]>([]);

  useEffect(() => {
    // これはuseEffectでやる必要がない
    setFiltered(items.filter(i => i.active));
  }, [items]);
}

// OK: レンダリング時にそのまま計算するか、useMemoを使う
function GoodExample({ items }: { items: Item[] }) {
  // useMemoで計算（副作用は不要）
  const filtered = useMemo(() => items.filter(i => i.active), [items]);
}
```

---

## 6. useMemo と useCallback

### 6.1 useMemo: 計算結果のメモ化

`useMemo` は依存する値が変わらない限り、計算結果をキャッシュする。

```tsx
import { useMemo } from 'react';

function FilteredList({ items, filter }: { items: Item[]; filter: string }) {
  // filter か items が変わったときだけ再計算
  const filtered = useMemo(() => {
    return items.filter(item =>
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  return (
    <ul>
      {filtered.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}
```

本プロジェクトの `useTerms.ts` での実例（カテゴリー一覧の生成）:

```tsx
// src/hooks/useTerms.ts より
// terms（数百件）からカテゴリ一覧を生成する処理。
// terms が変わったときだけ再計算する。
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
    const cat = map.get(term.majorCategoryId)!;
    if (!cat.subcategories.some(s => s.id === term.minorCategoryId)) {
      cat.subcategories.push({ id: term.minorCategoryId, name: term.subcategory });
    }
  }
  return Array.from(map.values()).sort((a, b) => Number(a.id) - Number(b.id));
}, [terms]); // termsが変わったときだけ再計算
```

**useMemoを使いすぎることの弊害:**

```tsx
// これはやりすぎ（計算が軽いのにメモ化するとオーバーヘッドになる）
const doubled = useMemo(() => count * 2, [count]); // NG: 計算が簡単すぎる
const doubled = count * 2;                          // OK: そのまま計算すればよい

// useMemo が有効なケース:
// 1. フィルタリング・ソートなど計算量が多い処理
// 2. 子コンポーネントにオブジェクト・配列を渡す場合（参照の安定化）
// 3. useEffectの依存配列に入れるオブジェクトの参照を安定させる場合
```

本プロジェクトの `useFilter.ts` での実例:

```tsx
// src/hooks/useFilter.ts より
const filtered = useMemo(() => {
  let result = terms;

  if (majorCategoryId) {
    result = result.filter(t => t.majorCategoryId === majorCategoryId);
  }
  if (minorCategoryId) {
    result = result.filter(t => t.minorCategoryId === minorCategoryId);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.reading.toLowerCase().includes(q) ||
        t.english.toLowerCase().includes(q)
    );
  }

  return result;
}, [terms, majorCategoryId, minorCategoryId, searchQuery]);
// ↑ これらのどれかが変わったときだけフィルタリングを再実行
```

### 6.2 useCallback: 関数のメモ化

`useCallback` は依存する値が変わらない限り、関数の参照を同じに保つ。

```tsx
import { useCallback } from 'react';

function Parent() {
  const [items, setItems] = useState<Item[]>([]);

  // useCallback なし: 毎レンダリングで新しい関数が作られる
  // → Childコンポーネントが常に再レンダリングされる
  const handleDelete = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  // useCallback あり: items が変わらない限り同じ関数参照
  const handleDeleteMemo = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id)); // 関数型更新が重要
  }, []); // ← 関数型更新にすれば items に依存しない

  return <ChildList items={items} onDelete={handleDeleteMemo} />;
}

// React.memo でラップした子コンポーネント
const ChildList = React.memo(function ChildList({
  items,
  onDelete,
}: {
  items: Item[];
  onDelete: (id: number) => void;
}) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => onDelete(item.id)}>削除</button>
        </li>
      ))}
    </ul>
  );
});
```

本プロジェクトの `useProgress.ts` での実例:

```tsx
// src/hooks/useProgress.ts より
// recordAnswer は QuizPage に渡して、子コンポーネントが何度呼び出しても
// 関数参照が変わらないように useCallback でメモ化している
const recordAnswer = useCallback((termId: number, correct: boolean) => {
  setProgress(prev => {
    // ...
  });
}, []); // 依存なし → 常に同じ関数参照
```

### 6.3 React.memo との組み合わせ

`useCallback` + `React.memo` の組み合わせが最も効果的だ:

```tsx
// 親: useCallback で関数を安定させる
function WordListPage({ terms, progress }: Props) {
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(0);
  }, [setSearchQuery]); // setSearchQuery は安定した参照

  return (
    <>
      {/* SearchBar は onSearch が変わらない限り再レンダリングされない */}
      <SearchBar onSearch={handleSearch} />
      {/* ... */}
    </>
  );
}

// 子: React.memo で不要な再レンダリングを防ぐ
const SearchBar = React.memo(function SearchBar({ onSearch }: Props) {
  // onSearch の参照が変わったときだけ再レンダリング
  // ...
});
```

### 6.4 実プロジェクト例: useQuiz.ts

```tsx
// src/hooks/useQuiz.ts より（useMemo と useCallback の組み合わせ）

// 4択選択肢の生成: currentTerm か settings が変わったときだけ再計算
const choices = useMemo<Term[]>(() => {
  if (!currentTerm || !settings || settings.format !== 'multiple-choice') {
    return [];
  }
  // 同じカテゴリから優先的に選択肢を生成する処理
  // ...
  return shuffle([currentTerm, ...wrongChoices]);
}, [currentTerm, settings, allTerms]);

// answerQuestion: currentTerm, answers, currentIndex が変わったら更新
const answerQuestion = useCallback(
  (correct: boolean) => {
    if (!currentTerm) return;
    const newAnswers = [...answers, { termId: currentTerm.id, correct }];
    setAnswers(newAnswers);
    if (currentIndex + 1 >= quizTerms.length) {
      setIsFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  },
  [currentTerm, answers, currentIndex, quizTerms.length]
);
```

---

## 7. useRef

### 7.1 DOMアクセス（jQuery の $() 対比）

jQueryでは `$('#myInput')` でDOM要素を取得していた。
Reactでは `useRef` で同様のことができる。

```tsx
import { useRef } from 'react';

function AutoFocusInput() {
  // ref オブジェクトを作成
  const inputRef = useRef<HTMLInputElement>(null);

  // マウント後にフォーカスを当てる
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = ''; // DOM要素に直接アクセス
      inputRef.current.focus();
    }
  };

  return (
    <div>
      {/* ref属性でDOM要素と紐付ける */}
      <input ref={inputRef} type="text" />
      <button onClick={handleClear}>クリア</button>
    </div>
  );
}
```

jQueryとの対比:

```javascript
// jQuery
const $input = $('#myInput');
$input.focus();
$input.val('');

// React + useRef
const inputRef = useRef(null);
inputRef.current.focus();
inputRef.current.value = '';
```

**Canvas、Video、外部ライブラリなどのDOM操作:**

```tsx
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => videoRef.current?.play();
  const handlePause = () => videoRef.current?.pause();

  return (
    <div>
      <video ref={videoRef} src={src} />
      <button onClick={handlePlay}>再生</button>
      <button onClick={handlePause}>一時停止</button>
    </div>
  );
}
```

### 7.2 再レンダリングを起こさない値の保持

`useRef` はstateと違い、値を変更してもレンダリングが発生しない。
「レンダリングには影響しないが値を保持したい」場合に使う。

```tsx
function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  // intervalのIDはレンダリングに関係ないのでrefで持つ
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return (
    <div>
      <p>{elapsed}秒</p>
      <button onClick={start}>スタート</button>
      <button onClick={stop}>ストップ</button>
    </div>
  );
}
```

**前回の値を保持するパターン:**

```tsx
function usePrevious<T>(value: T): T | undefined {
  const prevRef = useRef<T>();

  useEffect(() => {
    prevRef.current = value;
  }); // 毎レンダリング後に更新（依存配列なし）

  return prevRef.current; // 今回のレンダリングでは前回の値
}

// 使い方
function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <p>
      現在: {count}（前回: {prevCount ?? 'なし'}）
    </p>
  );
}
```

### 7.3 forwardRef

親から子のDOM要素にアクセスするには `forwardRef` を使う。

```tsx
import { forwardRef } from 'react';

interface InputProps {
  placeholder?: string;
  className?: string;
}

// forwardRefで子のDOM要素への参照を外部に公開する
const FancyInput = forwardRef<HTMLInputElement, InputProps>(
  function FancyInput({ placeholder, className }, ref) {
    return (
      <input
        ref={ref}
        placeholder={placeholder}
        className={`fancy-input ${className ?? ''}`}
      />
    );
  }
);

// 使い方: 子のDOM要素に直接アクセスできる
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focus = () => inputRef.current?.focus();

  return (
    <div>
      <FancyInput ref={inputRef} placeholder="入力してください" />
      <button onClick={focus}>フォーカス</button>
    </div>
  );
}
```

---

## 8. カスタムHooks

### 8.1 なぜカスタムHooksを作るか

カスタムHooksは**ロジックの再利用**と**関心の分離**のための仕組みだ。

```tsx
// カスタムHookなし: ロジックがコンポーネントに直接埋め込まれている
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => { setUser(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <Profile user={user} />;
}

// カスタムHookあり: ロジックを切り出して再利用できる
function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => { setUser(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  return { user, loading, error };
}

// コンポーネントがシンプルになる
function UserProfile() {
  const { user, loading, error } = useUser();

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <Profile user={user} />;
}
```

### 8.2 命名規則: use〇〇

カスタムHooksの名前は必ず `use` で始める。これはReactのルール（Lintで強制される）。
`use` で始まることで「このHookの中でHooksが使われている」ことが分かる。

```
useTerms       - 用語データの取得・管理
useFilter      - フィルタリングロジック
useProgress    - 進捗データの永続化
useQuiz        - クイズの出題ロジック
useFetch       - 汎用フェッチ
useLocalStorage - localStorage連携
useDebounce    - デバウンス処理
```

### 8.3 本プロジェクトの4つのカスタムHooks詳解

#### useTerms: データフェッチ + メモ化カテゴリ生成

```tsx
// src/hooks/useTerms.ts
export function useTerms() {
  // 3つのstate: データ、ローディング、エラー
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // マウント時に1回だけフェッチ
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/terms.json')
      .then(res => res.json())
      .then((data: Term[]) => {
        setTerms(data);
        setLoading(false);
      })
      .catch(() => {
        setError('データの読み込みに失敗しました');
        setLoading(false);
      });
  }, []);

  // termsからカテゴリを生成（重い処理なのでメモ化）
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
      const cat = map.get(term.majorCategoryId)!;
      if (!cat.subcategories.some(s => s.id === term.minorCategoryId)) {
        cat.subcategories.push({
          id: term.minorCategoryId,
          name: term.subcategory,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => Number(a.id) - Number(b.id));
  }, [terms]);

  return { terms, categories, loading, error };
}
```

**設計のポイント:**
- `useTerms` 自体は引数を取らない（グローバルなデータ取得）
- `loading` と `error` を一緒に返して呼び出し元でハンドリングできるようにする
- `categories` はtermsの変換なので `useMemo` でメモ化

#### useFilter: 検索・フィルタリングロジック

```tsx
// src/hooks/useFilter.ts
export function useFilter(terms: Term[]) {
  // 3つのフィルタ条件をstateで管理
  const [majorCategoryId, setMajorCategoryId] = useState('');
  const [minorCategoryId, setMinorCategoryId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 条件が変わったときだけフィルタリングを再実行
  const filtered = useMemo(() => {
    let result = terms;
    if (majorCategoryId) {
      result = result.filter(t => t.majorCategoryId === majorCategoryId);
    }
    if (minorCategoryId) {
      result = result.filter(t => t.minorCategoryId === minorCategoryId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.reading.toLowerCase().includes(q) ||
          t.english.toLowerCase().includes(q)
      );
    }
    return result;
  }, [terms, majorCategoryId, minorCategoryId, searchQuery]);

  // 大分類変更時は中分類もリセット
  const setMajorCategory = (id: string) => {
    setMajorCategoryId(id);
    setMinorCategoryId('');  // ← 連動リセット
  };

  return {
    majorCategoryId,
    minorCategoryId,
    searchQuery,
    filtered,
    setMajorCategory,
    setMinorCategoryId,
    setSearchQuery,
  };
}
```

**設計のポイント:**
- `terms` を引数として受け取る（汎用的に使えるようにする）
- `setMajorCategory` と `setMajorCategoryId` を別々に公開することで、
  大分類変更時の中分類リセットをHook内でカプセル化

#### useProgress: localStorage永続化

```tsx
// src/hooks/useProgress.ts
const STORAGE_KEY = 'ipa-words-progress';

// 純粋関数として外部に切り出す（テストしやすくなる）
function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useProgress() {
  // 遅延初期化でlocalStorageから読む
  const [progress, setProgress] = useState<Progress>(loadProgress);

  const recordAnswer = useCallback((termId: number, correct: boolean) => {
    setProgress(prev => {
      const entry = prev[termId] || { correct: 0, total: 0 };
      const next: Progress = {
        ...prev,                              // 既存データを展開
        [termId]: {                           // 該当IDだけ更新
          correct: entry.correct + (correct ? 1 : 0),
          total: entry.total + 1,
        },
      };
      saveProgress(next);                     // 副作用: 永続化
      return next;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { progress, recordAnswer, resetProgress };
}
```

**設計のポイント:**
- `loadProgress` / `saveProgress` を純粋関数として外部に出すことで、
  Hookのロジックがシンプルになる
- `recordAnswer` を `useCallback` でメモ化してQuizPageに安定した参照を渡す
- `useState(loadProgress)` で遅延初期化（毎レンダリングでパースしない）

#### useQuiz: 出題ロジック + 選択肢生成

```tsx
// src/hooks/useQuiz.ts より要点を抜粋
export function useQuiz(allTerms: Term[]) {
  // クイズの状態を複数のstateで管理
  const [settings, setSettings] = useState<QuizSettings | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [quizTerms, setQuizTerms] = useState<Term[]>([]);

  // クイズ開始: フィルタ → シャッフル → 枚数制限
  const startQuiz = useCallback((newSettings: QuizSettings) => {
    let pool = allTerms;
    if (newSettings.majorCategoryId) {
      pool = pool.filter(t => t.majorCategoryId === newSettings.majorCategoryId);
    }
    if (newSettings.minorCategoryId) {
      pool = pool.filter(t => t.minorCategoryId === newSettings.minorCategoryId);
    }
    const shuffled = shuffle(pool);
    const count = newSettings.count === 'all'
      ? shuffled.length
      : Math.min(newSettings.count, shuffled.length);

    // 複数のstateを一度に更新（バッチ処理でレンダリングは1回）
    setQuizTerms(shuffled.slice(0, count));
    setSettings(newSettings);
    setCurrentIndex(0);
    setAnswers([]);
    setIsFinished(false);
  }, [allTerms]);

  // 4択の選択肢: currentTermが変わるたびに再生成
  const choices = useMemo<Term[]>(() => {
    if (!currentTerm || settings?.format !== 'multiple-choice') return [];
    // 同じカテゴリから優先して選択肢を生成
    // ...
    return shuffle([currentTerm, ...wrongChoices]);
  }, [currentTerm, settings, allTerms]);

  return { settings, currentTerm, choices, answers, isFinished, startQuiz, answerQuestion, resetQuiz };
}
```

**設計のポイント:**
- `allTerms` を引数として受け取る（データはApp→QuizPageを通じて渡される）
- 出題ロジック（フィルタ、シャッフル、選択肢生成）をすべてHook内にカプセル化
- QuizPageはUIのレンダリングのみに専念できる

### 8.4 カスタムHooksの設計原則

1. **入力（引数）は最小限に** — 必要なデータだけを受け取る
2. **出力（返り値）は過不足なく** — 呼び出し元が必要なものだけを返す
3. **単一の責務** — 一つのHookは一つのことをする
4. **副作用はHook内に閉じ込める** — コンポーネントに漏らさない
5. **ロジックは純粋関数として外出し可能** — テストしやすくなる

```tsx
// 汎用カスタムHookの例: useLocalStorage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prev => {
      const resolved = typeof newValue === 'function'
        ? (newValue as (prev: T) => T)(prev)
        : newValue;
      localStorage.setItem(key, JSON.stringify(resolved));
      return resolved;
    });
  }, [key]);

  return [value, setStoredValue] as const;
}

// 使い方
const [theme, setTheme] = useLocalStorage('theme', 'light');
const [progress, setProgress] = useLocalStorage('progress', {});
```

---

## 9. 状態管理の全体像

### 9.1 ローカル state（useState）

最もシンプルな状態管理。そのコンポーネント内だけで使う状態。

```tsx
function Accordion() {
  const [isOpen, setIsOpen] = useState(false); // このコンポーネントだけ

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>開閉</button>
      {isOpen && <div>コンテンツ</div>}
    </div>
  );
}
```

### 9.2 リフトアップ（Lifting State Up）

兄弟コンポーネントで状態を共有したい場合は、共通の親にstateを持たせる。

```tsx
// NG: 兄弟同士で状態を共有できない
function SiblingA() {
  const [value, setValue] = useState(''); // これはSiblingBから見えない
}

// OK: 親にstateをリフトアップ
function Parent() {
  const [sharedValue, setSharedValue] = useState(''); // 親が持つ

  return (
    <>
      <SiblingA value={sharedValue} onChange={setSharedValue} />
      <SiblingB value={sharedValue} />  {/* 同じ値を参照できる */}
    </>
  );
}
```

本プロジェクトの `App.tsx` がこのパターンの典型:

```tsx
// App.tsx: terms と progress を持ち、全ページに渡す
export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const { terms, categories, loading, error } = useTerms();
  const { progress, recordAnswer, resetProgress } = useProgress();

  // terms と progress を必要なページにpropsで渡す
  return (
    <div>
      {activeTab === 'list' && (
        <WordListPage terms={terms} categories={categories} progress={progress} />
      )}
      {activeTab === 'quiz' && (
        <QuizPage
          terms={terms}
          categories={categories}
          onRecordAnswer={recordAnswer}  // コールバックも渡す
        />
      )}
      {activeTab === 'progress' && (
        <ProgressPage
          terms={terms}
          progress={progress}
          onReset={resetProgress}
        />
      )}
    </div>
  );
}
```

### 9.3 Props Drilling問題と解決策

stateを深い階層のコンポーネントに渡す際、中間のコンポーネントが不要なpropsを受け渡しし続ける問題。

```
App (user state)
  └── Layout
        └── Sidebar          ← user を使わないのに受け取って渡す
              └── UserMenu   ← user を使う
```

**解決策1: Context API（後述）**
**解決策2: 中間コンポーネントを構造的に排除する**

```tsx
// children を使うことで中間コンポーネントが state を知らなくて済む
function App() {
  const user = useUser();

  return (
    <Layout>
      <Sidebar>
        <UserMenu user={user} />  {/* Sidebar は user を知らなくていい */}
      </Sidebar>
    </Layout>
  );
}
```

### 9.4 Context API（useContext）

グローバルな状態（テーマ、認証情報、言語設定など）はContextで配布する。

```tsx
// 1. Contextを作成
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// 2. Provider で値を配布
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. カスタムHookで使いやすくする
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme は ThemeProvider の中で使う必要があります');
  }
  return context;
}

// 4. 使い方（深い階層でも props drilling なしに取得できる）
function DarkModeButton() {
  const { theme, toggleTheme } = useTheme(); // どこからでもアクセス可能

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 ダークモード' : '☀️ ライトモード'}
    </button>
  );
}

// 5. アプリ全体をProviderでラップ
function App() {
  return (
    <ThemeProvider>
      <Layout />
    </ThemeProvider>
  );
}
```

**Contextの注意点:**
Context の値が変わると、`useContext` を使うすべてのコンポーネントが再レンダリングされる。
頻繁に変わる値（例: 検索クエリ）はContextに入れると全体が再レンダリングされて重くなるため、
ローカルstateかカスタムHookで管理すべきだ。

### 9.5 外部ライブラリ（概要）

より大規模なアプリには専用の状態管理ライブラリを検討する:

| ライブラリ | 特徴 | 向いている規模 |
|-----------|------|--------------|
| **Redux** | 予測可能性が高い、DevToolsが強力、学習コストが高い | 大規模・チーム開発 |
| **Zustand** | シンプルなAPI、ボイラープレート少、Reactに依存しない | 中〜大規模 |
| **Jotai** | アトムベース（Recoilに似る）、細粒度、TypeScript親和性が高い | 中規模 |
| **TanStack Query** | サーバー状態管理（fetch + キャッシュ + 再フェッチ）に特化 | APIが多い場合 |

```tsx
// Zustand の例（参考）
import { create } from 'zustand';

const useStore = create<{
  count: number;
  increment: () => void;
}>((set) => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}));

function Counter() {
  const { count, increment } = useStore(); // どこからでもアクセス
  return <button onClick={increment}>{count}</button>;
}
```

### 9.6 本プロジェクトの選択（props drilling で十分な理由）

本プロジェクトがContextや外部ライブラリを使わない理由:

1. **階層が浅い** — App → Page → Component の3階層のみ
2. **state の種類が少ない** — terms, progress, activeTab の3つだけ
3. **propsが渡されるコンポーネントが明確** — どのページがどの状態を必要とするか追跡しやすい
4. **シンプルさが保守性を高める** — 外部ライブラリの学習コスト不要

「3〜4階層以上、または5つ以上のコンポーネントが同じstateを必要とする場合」にContextを検討する目安。

---

## 10. パフォーマンス最適化

### 10.1 再レンダリングの仕組み（いつ起きるか）

Reactのコンポーネントは次のどれかが起きると再レンダリングする:

1. **stateが変わった** — `setState()` が呼ばれた
2. **propsが変わった** — 親から渡されるpropsの値（または参照）が変わった
3. **親が再レンダリングした** — 親が再レンダリングすると子も（デフォルトで）再レンダリング
4. **useContextの値が変わった** — subscribeしているContextの値が変わった

```tsx
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+1</button>
      {/* count が変わるたびに Child も再レンダリングされる */}
      <Child />
    </div>
  );
}

function Child() {
  console.log('Child が再レンダリングされた');
  return <p>子コンポーネント</p>;
}
```

### 10.2 React.memo

propsが変わらなければ再レンダリングをスキップする:

```tsx
// メモ化なし: 親が再レンダリングするたびに実行
function ExpensiveChild({ data }: { data: string[] }) {
  return <ul>{data.map(d => <li key={d}>{d}</li>)}</ul>;
}

// メモ化あり: data が変わらなければスキップ
const ExpensiveChild = React.memo(function ExpensiveChild({ data }: { data: string[] }) {
  return <ul>{data.map(d => <li key={d}>{d}</li>)}</ul>;
});

// カスタム比較関数も使える（デフォルトは浅い比較）
const ExpensiveChild = React.memo(
  function ExpensiveChild({ data }: { data: string[] }) {
    return <ul>{data.map(d => <li key={d}>{d}</li>)}</ul>;
  },
  (prevProps, nextProps) => {
    // true を返すと「変わっていない」とみなしてスキップ
    return prevProps.data.length === nextProps.data.length;
  }
);
```

### 10.3 useMemo / useCallback の適切な使用

パフォーマンス改善よりも、**参照の安定化**の目的で使うことが多い:

```tsx
// ケース1: オブジェクトや配列を子に渡す場合（参照安定化）
function Parent() {
  const [filter, setFilter] = useState('');

  // これがないと毎回新しい配列が生成されて、MemoizedChild が再レンダリングされる
  const options = useMemo(() => ['Option A', 'Option B', 'Option C'], []);

  return <MemoizedChild options={options} filter={filter} />;
}

// ケース2: 計算コストが高い場合
const expensiveResult = useMemo(() => {
  return heavyComputation(largeDataSet);
}, [largeDataSet]); // largeDataSet が変わったときだけ再計算
```

**最適化のガイドライン:**
- まずプロファイラで遅い箇所を特定してから最適化する
- `useMemo`/`useCallback` はメモリとのトレードオフ。すべてに使うと逆に遅くなる
- `React.memo` + `useCallback` のセットで初めて効果が出る

### 10.4 key の重要性（再掲）

```tsx
// 悪い例: インデックスをkeyにすると、並び替え後に誤ったコンポーネントが
// 再利用されてstateが混乱する
{items.map((item, index) => <Input key={index} defaultValue={item.value} />)}

// 良い例: 安定した一意なIDをkey
{items.map(item => <Input key={item.id} defaultValue={item.value} />)}
```

本プロジェクトの `QuizPage.tsx` での `key` の工夫:

```tsx
// FlashCard に currentTerm.id を key として渡すことで、
// 次の問題に移ったときにFlashCardを再マウント（stateをリセット）する
{quiz.settings.format === 'flashcard' ? (
  <FlashCard
    key={quiz.currentTerm.id}  // ← idが変わると新しいコンポーネントになる
    term={quiz.currentTerm}
    direction={quiz.settings.direction}
    onAnswer={handleAnswer}
  />
) : (
  <MultipleChoice
    key={quiz.currentTerm.id}  // 同様
    term={quiz.currentTerm}
    choices={quiz.choices}
    direction={quiz.settings.direction}
    onAnswer={handleAnswer}
  />
)}
```

### 10.5 仮想スクロール vs ページネーション

大量のデータを一度にDOMに描画するとパフォーマンスが劣化する。

**本プロジェクトのアプローチ: ページネーション**

```tsx
// src/pages/WordListPage.tsx より
const PAGE_SIZE = 50;

// 全件ではなく現在のページ分だけ描画
const pageItems = useMemo(
  () => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
  [filtered, page]
);

// 50件だけ描画するので高速
{pageItems.map(term => (
  <WordCard key={term.id} term={term} progress={progress[term.id] || null} />
))}
```

**仮想スクロール（react-window）のアプローチ:**

```tsx
import { FixedSizeList } from 'react-window';

// 仮想スクロール: 見えている部分だけDOMを生成する
function VirtualList({ items }: { items: Item[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>  {/* style は react-window が計算した位置 */}
      <ItemCard item={items[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}          // 表示エリアの高さ
      itemCount={items.length}
      itemSize={80}         // 1行の高さ
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

ページネーションはシンプルで実装しやすい。
10,000件以上のデータをスクロールで見せたい場合は仮想スクロールを検討する。

### 10.6 コード分割（React.lazy, Suspense）

アプリが大きくなると初期ロードが遅くなる。
ルートごとにバンドルを分割して初期表示を高速化できる。

```tsx
import { lazy, Suspense } from 'react';

// ページコンポーネントを遅延読み込み
const WordListPage = lazy(() => import('./pages/WordListPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));

function App() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      {activeTab === 'list' && <WordListPage />}
      {activeTab === 'quiz' && <QuizPage />}
      {activeTab === 'progress' && <ProgressPage />}
    </Suspense>
  );
}
```

### 10.7 プロファイラの使い方

React DevTools のProfilerタブで再レンダリングの原因と時間を確認できる。

```tsx
import { Profiler } from 'react';

// 開発時のみプロファイリング
function App() {
  const onRender = (
    id: string,
    phase: 'mount' | 'update',
    actualDuration: number
  ) => {
    console.log(`${id} が ${phase} に ${actualDuration}ms かかった`);
  };

  return (
    <Profiler id="WordList" onRender={onRender}>
      <WordListPage />
    </Profiler>
  );
}
```

**React DevToolsのProfilerの使い方:**
1. ブラウザの拡張機能「React DevTools」をインストール
2. DevToolsを開いて「Profiler」タブへ
3. 「●」ボタンで記録開始 → 操作 → 「■」で停止
4. どのコンポーネントが何回・何msかかったか確認

---

## 11. よく使うパターン集

### 11.1 フォーム処理（制御コンポーネント）

```tsx
interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

function LoginPage() {
  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 汎用フィールド更新
  const handleChange = (field: keyof LoginForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm(prev => ({ ...prev, [field]: value }));
      // 入力と同時にエラーをクリア
      setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  // バリデーション
  const validate = (): boolean => {
    const newErrors: Partial<LoginForm> = {};
    if (!form.email.includes('@')) newErrors.email = 'メールアドレスが正しくありません';
    if (form.password.length < 8) newErrors.password = '8文字以上で入力してください';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await loginApi(form.email, form.password);
      // 成功処理
    } catch (err) {
      setErrors({ email: 'メールアドレスまたはパスワードが違います' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email">メールアドレス</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={handleChange('email')}
        />
        {errors.email && <p className="error">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password">パスワード</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={handleChange('password')}
        />
        {errors.password && <p className="error">{errors.password}</p>}
      </div>

      <label>
        <input
          type="checkbox"
          checked={form.rememberMe}
          onChange={handleChange('rememberMe')}
        />
        ログイン状態を保持
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '送信中...' : 'ログイン'}
      </button>
    </form>
  );
}
```

### 11.2 モーダル/ダイアログ

```tsx
// モーダルコンポーネント
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // ESCキーでクローズ
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null; // 非表示時は何もレンダリングしない

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()} // オーバーレイへのクリック伝播を止める
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="閉じる">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// 使い方
function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>モーダルを開く</button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="確認"
      >
        <p>本当に削除しますか？</p>
        <button onClick={() => { /* 削除処理 */ setIsModalOpen(false); }}>
          削除する
        </button>
        <button onClick={() => setIsModalOpen(false)}>キャンセル</button>
      </Modal>
    </div>
  );
}
```

### 11.3 ローディング/エラー状態の管理

```tsx
// 汎用フェッチHook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false; // アンマウント後のstate更新を防ぐ

    setLoading(true);
    setError(null);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: T) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; }; // クリーンアップ
  }, [url]);

  return { data, loading, error };
}

// 三段階のUI（ローディング → エラー → データ）
function UserList() {
  const { data: users, loading, error } = useFetch<User[]>('/api/users');

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>エラー: {error}</p>
        <button onClick={() => window.location.reload()}>再試行</button>
      </div>
    );
  }

  return (
    <ul>
      {users?.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

本プロジェクトの `App.tsx` での実例:

```tsx
// src/App.tsx より
const { terms, categories, loading, error } = useTerms();

if (loading) {
  return <div className={styles.loading}>読み込み中...</div>;
}
if (error) {
  return <div className={styles.loading}>{error}</div>;
}
// ローディング・エラーをクリアしてからメインUIを表示
return <div className={styles.app}>...</div>;
```

### 11.4 デバウンス入力（本プロジェクトのSearchBar例）

入力のたびにAPIを呼ぶと負荷が高い。一定時間入力が止まったときだけ処理する。

```tsx
// src/components/SearchBar.tsx の完全な実装
interface Props {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('');

  useEffect(() => {
    // 300ms後に onSearch を呼ぶタイマーをセット
    const timer = setTimeout(() => onSearch(value), 300);

    // value が変わったら（次のキー入力が来たら）前のタイマーをキャンセル
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <input
      className={styles.input}
      type="text"
      placeholder="用語名・読み・英語で検索..."
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  );
}
```

**タイムライン:**
```
「R」入力 → タイマー開始(300ms)
「Re」入力 → 前のタイマーキャンセル → タイマー開始(300ms)
「Rea」入力 → 前のタイマーキャンセル → タイマー開始(300ms)
300ms 経過 → onSearch('Rea') が呼ばれる
```

**汎用デバウンスHookとして切り出す:**

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 使い方
function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300); // 300ms後の値

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### 11.5 タブ切り替え（本プロジェクトのApp.tsx例）

```tsx
// src/App.tsx + TabNavigation.tsx の構成

// タブの型定義
type TabType = 'list' | 'quiz' | 'progress';

// タブナビゲーションコンポーネント
const tabs: { key: TabType; label: string }[] = [
  { key: 'list', label: '一覧' },
  { key: 'quiz', label: '出題' },
  { key: 'progress', label: '進捗' },
];

function TabNavigation({ activeTab, onTabChange }: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  return (
    <nav>
      {tabs.map(tab => (
        <button
          key={tab.key}
          // アクティブなタブにスタイルを適用
          className={`tab ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

// App でstateを持つ
function App() {
  const [activeTab, setActiveTab] = useState<TabType>('list');

  return (
    <div>
      <main>
        {/* 条件分岐でページを出し分け */}
        {activeTab === 'list' && <WordListPage />}
        {activeTab === 'quiz' && <QuizPage />}
        {activeTab === 'progress' && <ProgressPage />}
      </main>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
```

**ページを `display: none` で隠す vs 条件分岐でアンマウント:**

| アプローチ | 利点 | 欠点 |
|-----------|------|------|
| `{condition && <Page />}` | 非表示時にメモリを使わない | タブを切り替えるとstateがリセット |
| `display: none` でCSS制御 | stateが保持される | 非表示でもDOMに存在 → メモリ使用 |

本プロジェクトは `{condition && <Page />}` を採用しており、
タブを切り替えるたびにページが再マウントされる（データはApp側のstateにあるので問題ない）。

### 11.6 リスト + 詳細表示（本プロジェクトのWordCard例）

```tsx
// src/components/WordCard.tsx の構造
interface Props {
  term: Term;
  progress: TermProgress | null;
}

export function WordCard({ term, progress }: Props) {
  // 展開状態をローカルstateで管理（親は知らなくていい）
  const [expanded, setExpanded] = useState(false);

  // 正答率の計算
  const status = getStatus(progress);
  const rate =
    progress && progress.total > 0
      ? Math.round((progress.correct / progress.total) * 100)
      : null;

  return (
    <div className={styles.card} onClick={() => setExpanded(!expanded)}>
      {/* 常に表示される部分 */}
      <div className={styles.body}>
        <div className={`${styles.status} ${styles[status]}`}>
          {status === 'mastered' ? '覚えた' : status === 'learning' ? '学習中' : '未学習'}
        </div>
        <div className={styles.content}>
          <div className={styles.name}>{term.name}</div>
          {rate !== null && <span className={styles.rate}>{rate}%</span>}
          <div className={styles.sub}>
            {term.reading}{term.english && ` / ${term.english}`}
          </div>
        </div>
      </div>

      {/* 展開時のみ表示される詳細 */}
      {expanded && (
        <div className={styles.description}>
          <div className={styles.category}>
            {term.category} › {term.subcategory}
          </div>
          {term.description}
        </div>
      )}
    </div>
  );
}
```

**アコーディオンパターンの変形（1つだけ展開）:**

```tsx
function AccordionList({ items }: { items: Item[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id)); // 同じIDなら閉じる
  };

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <button onClick={() => toggle(item.id)}>
            {item.title} {expandedId === item.id ? '▲' : '▼'}
          </button>
          {expandedId === item.id && (
            <div>{item.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## まとめ

本ガイドで扱った主要な概念と、本プロジェクトでの実装箇所の対応:

| 概念 | 本プロジェクトの実例 |
|------|-------------------|
| 宣言的UI | App.tsx — loadingとerrorでUIを分岐 |
| 単方向データフロー | App → QuizPage → onRecordAnswer コールバック |
| useState | WordCard.tsx の expanded、QuizPage.tsx の設定値 |
| useState 遅延初期化 | useProgress.ts の `useState(loadProgress)` |
| 関数型更新 | useProgress.ts の `setProgress(prev => ...)` |
| useEffect フェッチ | useTerms.ts の JSONデータ取得 |
| useEffect デバウンス | SearchBar.tsx の 300ms タイマー |
| useEffect クリーンアップ | SearchBar.tsx の `clearTimeout` |
| useMemo 重い計算 | useTerms.ts のカテゴリ生成、useFilter.ts のフィルタリング |
| useMemo 選択肢生成 | useQuiz.ts の 4択選択肢 |
| useCallback | useProgress.ts の recordAnswer、useQuiz.ts の startQuiz |
| カスタムHooks | useTerms, useFilter, useProgress, useQuiz |
| key の活用 | QuizPage.tsx — currentTerm.id を key にしてリセット |
| ページネーション | WordListPage.tsx の PAGE_SIZE=50 |
| タブ切り替え | App.tsx + TabNavigation.tsx |
| リスト+詳細 | WordCard.tsx の expanded パターン |

**Java/jQuery エンジニアへの移行の要点:**
- DOMを直接操作するのをやめて「stateを更新すればUIが変わる」という思考に切り替える
- 継承よりコンポジション（`children` prop、カスタムHooks）
- stateは常に新しいオブジェクト・配列で更新する（イミュータビリティ）
- `useEffect` の依存配列は正直に書く（ESLintの警告に従う）
- パフォーマンスは計測してから最適化する（premature optimization は避ける）
