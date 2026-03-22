# jQuery → React 概念比較

jQuery/JSPで開発してきたエンジニアがReactに移行する際、最初の壁は「考え方の転換」にある。
jQueryはDOMを直接触るライブラリだが、ReactはUIの「あるべき姿」を宣言し、DOMへの反映はフレームワークに任せる。
このドキュメントでは、jQuery時代の各パターンに対応するReactコードを並べて比較する。

---

## 1. DOM直接操作 vs 宣言的UI

jQuery では「DOMを見つけて、変える」というアプローチをとる。

```javascript
// jQuery: ボタンを押したらカウントを表示
let count = 0;
$('#incrementBtn').on('click', function () {
  count++;
  $('#counter').text('カウント: ' + count);
});
```

React では「状態（state）が変わればUIは自動的に更新される」と宣言する。

```tsx
// React: 同じカウンター
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>カウント: {count}</p>
      <button onClick={() => setCount(count + 1)}>増やす</button>
    </div>
  );
}
```

**ポイント**: ReactではDOM要素を `getElementById` で取得する必要がない。
`count` が変わると React が自動的に `<p>` の中身を書き換えてくれる。
開発者は「状態がこうなったらUIはこう見える」という対応関係を書くだけでよい。

---

## 2. イベントハンドリング（`$.on` vs `onClick`）

```javascript
// jQuery: クリックとフォーカス
$('#submitBtn').on('click', handleSubmit);
$('#nameInput').on('change', function () {
  validateInput($(this).val());
});
```

```tsx
// React: 同じイベントをJSXで直接記述
function Form() {
  const [name, setName] = useState('');

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => validateInput(name)}
      />
      <button type="submit">送信</button>
    </form>
  );
}
```

主なイベント名の対応表：

| jQuery        | React         |
|---------------|---------------|
| `click`       | `onClick`     |
| `change`      | `onChange`    |
| `submit`      | `onSubmit`    |
| `keydown`     | `onKeyDown`   |
| `focus`       | `onFocus`     |
| `blur`        | `onBlur`      |
| `mouseover`   | `onMouseOver` |

**ポイント**: Reactのイベントハンドラはキャメルケース（`onClick`）で、JSXの属性として直接書く。
`$(this)` のようなコンテキスト依存はなく、イベントオブジェクト `e` を引数で受け取る。

---

## 3. Ajax vs fetch / useEffect

```javascript
// jQuery: Ajax でデータ取得
$(document).ready(function () {
  $.ajax({
    url: '/api/terms.json',
    method: 'GET',
    success: function (data) {
      renderTerms(data);
    },
    error: function () {
      $('#error').show().text('読み込み失敗');
    },
  });
});
```

```tsx
// React: fetch + useEffect でデータ取得
// 実際のプロジェクトコード: src/hooks/useTerms.ts
import { useState, useEffect } from 'react';
import type { Term } from '../types';

export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/terms.json')
      .then((res) => res.json())
      .then((data: Term[]) => {
        setTerms(data);
        setLoading(false);
      })
      .catch(() => {
        setError('データの読み込みに失敗しました');
        setLoading(false);
      });
  }, []); // 空配列 = マウント時に1回だけ実行（$(document).ready と同等）

  return { terms, loading, error };
}
```

`useEffect` の第2引数（依存配列）のルール：

| 依存配列       | 実行タイミング                         |
|---------------|---------------------------------------|
| `[]`          | マウント時に1回のみ（`$(document).ready` 相当） |
| `[value]`     | `value` が変わるたびに実行             |
| なし（省略）   | 毎レンダリング後に実行（通常は使わない） |

---

## 4. プラグイン vs コンポーネント/npm

```javascript
// jQuery: プラグインで機能追加
// <script src="jquery.datepicker.js"> を読み込んでから
$('#datepicker').datepicker({ dateFormat: 'yy/mm/dd' });
$('#select2').select2({ placeholder: '選択してください' });
```

```tsx
// React: npmパッケージをコンポーネントとして使う
import DatePicker from 'react-datepicker';
import Select from 'react-select';

function MyForm() {
  const [date, setDate] = useState<Date | null>(null);
  const [selected, setSelected] = useState(null);

  return (
    <>
      <DatePicker selected={date} onChange={setDate} dateFormat="yyyy/MM/dd" />
      <Select
        options={[{ value: 'a', label: '選択肢A' }]}
        placeholder="選択してください"
        onChange={setSelected}
      />
    </>
  );
}
```

**ポイント**: jQueryプラグインは `<script>` タグで読み込み、グローバルなjQuery関数として使う。
Reactではnpmでインストールし、`import` してコンポーネントとして使う。
依存関係は `package.json` で管理されるため、バージョン管理が明確になる。

---

## 5. グローバル状態（`window` 変数）vs React state

```javascript
// jQuery時代: window変数でグローバル状態管理
window.currentUser = null;
window.cartItems = [];

function login(user) {
  window.currentUser = user;
  updateHeader(); // DOM更新を手動で呼び出す
  updateCart();   // DOM更新を手動で呼び出す
}
```

```tsx
// React: stateをコンポーネントで管理
// 実際のプロジェクトコード: src/hooks/useProgress.ts
import { useState, useCallback } from 'react';
import type { Progress } from '../types';

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress);

  const recordAnswer = useCallback((termId: number, correct: boolean) => {
    setProgress((prev) => {
      const entry = prev[termId] || { correct: 0, total: 0 };
      const next: Progress = {
        ...prev,
        [termId]: {
          correct: entry.correct + (correct ? 1 : 0),
          total: entry.total + 1,
        },
      };
      saveProgress(next); // localStorage への保存
      return next;
    });
  }, []);

  return { progress, recordAnswer };
}
```

`progress` が更新されると、それを参照している全コンポーネントが自動的に再描画される。
`updateHeader()` のような手動DOM更新の呼び出しは不要。

アプリ全体で共有したい状態には Context API や Zustand などの状態管理ライブラリを使う。

---

## 6. テンプレートエンジン（JSP/Thymeleaf）vs JSX

```jsp
<%-- JSP: 動的HTML生成 --%>
<ul>
  <% for (Term term : terms) { %>
    <li class="term-item" data-id="<%= term.getId() %>">
      <%= term.getName() %>
      <% if (term.isNew()) { %>
        <span class="badge">NEW</span>
      <% } %>
    </li>
  <% } %>
</ul>
```

```tsx
// React JSX: 同じリスト表示
// 実際のプロジェクトコード: src/pages/WordListPage.tsx（一部）
function WordList({ terms }: { terms: Term[] }) {
  return (
    <ul>
      {terms.map((term) => (
        <li key={term.id} className="term-item">
          {term.name}
          {term.isNew && <span className="badge">NEW</span>}
        </li>
      ))}
    </ul>
  );
}
```

JSXとJSPの主な違い：

| JSP                          | JSX                               |
|------------------------------|-----------------------------------|
| `class="..."`                | `className="..."`                 |
| `for="..."`                  | `htmlFor="..."`                   |
| `<% if (...) { %>`           | `{condition && <element />}`      |
| `<% for (...) { %>`          | `{array.map((item) => ...)}`      |
| サーバーサイドで実行          | ブラウザ（クライアント）で実行     |
| HTML文字列として出力          | 仮想DOMオブジェクトとして構築     |

**ポイント**: JSXはJavaScriptの拡張構文。`{}` の中には任意のJS式が書ける。
`if文` や `for文` はJSX内に直接書けないため、三項演算子や `.map()` を使う。

---

## 7. jQueryセレクタ vs React の ref

基本的にはReactでDOM要素を直接触る必要はない。しかし、フォーカス制御やサードパーティライブラリとの連携など、
どうしてもDOM要素を直接操作したい場合は `useRef` を使う。

```javascript
// jQuery: セレクタでDOM要素を取得して操作
$('#searchInput').focus();
$('#videoPlayer').get(0).play();
const rect = $('#card').offset();
```

```tsx
// React: useRef でDOM要素を参照
import { useRef, useEffect } from 'react';

function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // マウント後に自動フォーカス
    inputRef.current?.focus();
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="検索..."
    />
  );
}
```

`useRef` はDOM操作以外にも、再レンダリングをまたいで値を保持したいとき（タイマーIDの保存など）にも使う。

---

## 8. 移行時の思考の切り替えポイント

jQuery から React に移行する際、最も重要なのは次の3点の思考転換:

### 「DOMを操作する」から「状態を操作する」へ

```javascript
// jQuery思考: DOMを直接変える
$('#result').text('エラー');
$('#submitBtn').prop('disabled', true);
```

```tsx
// React思考: 状態を変えて、UIは自動更新させる
const [error, setError] = useState<string | null>(null);
const [submitting, setSubmitting] = useState(false);

// 状態を変えるだけ。DOMは触らない
setError('エラー');
setSubmitting(true);

// UIはstateを参照して自動的に描画
return (
  <>
    {error && <p className="error">{error}</p>}
    <button disabled={submitting}>送信</button>
  </>
);
```

### 「いつ更新するか」から「どう見えるか」へ

jQueryでは「ボタンが押されたら → DOMを更新する」という手続きを書く。
Reactでは「状態がこうなら → こう見える」という宣言を書く。更新タイミングはReactが判断する。

### 「HTMLにJSを追加する」から「JSの中にHTMLを書く」へ

JSPではHTMLにスクリプトタグや `<% %>` を埋め込む。
ReactではJS/TSファイルの中にJSXでHTMLを記述する。コンポーネントはJS関数であり、JSXを返す。

---

## まとめ

| jQuery/JSP の概念   | Reactの対応概念              |
|--------------------|-----------------------------|
| DOM操作             | state更新 + 自動再描画       |
| `$.ajax`           | `fetch` + `useEffect`       |
| グローバル変数      | `useState` / Context        |
| jQueryプラグイン    | Reactコンポーネント（npm）   |
| テンプレートエンジン | JSX                         |
| セレクタ            | `useRef`（最終手段）         |
| イベントバインド     | JSXのイベント属性            |

Reactに慣れると、DOMのことをほとんど意識しなくなる。
これが最大の思考転換であり、慣れれば非常に快適な開発体験につながる。
