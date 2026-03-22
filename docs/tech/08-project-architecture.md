# 本プロジェクトのアーキテクチャガイド

## ディレクトリ構成

```
ipa-words/
├── public/                    # ビルドでそのままコピーされる静的ファイル
│   ├── data/
│   │   └── terms.json         # 全用語データ（CSV変換済み）
│   ├── favicon.svg
│   └── icons/icon.svg
│
├── src/                       # アプリケーションのソースコード
│   ├── main.tsx               # エントリーポイント（ReactDOMのrender）
│   ├── App.tsx                # ルートコンポーネント・タブ管理
│   ├── App.module.css
│   ├── index.css              # グローバルスタイル
│   │
│   ├── types/
│   │   └── index.ts           # 全型定義（Term, Progress, QuizSettings等）
│   │
│   ├── hooks/                 # カスタムフック（ロジック層）
│   │   ├── useTerms.ts        # データ取得 + カテゴリ生成
│   │   ├── useFilter.ts       # 絞り込みロジック
│   │   ├── useProgress.ts     # 学習進捗（localStorage永続化）
│   │   └── useQuiz.ts         # 出題・採点ロジック
│   │
│   ├── pages/                 # ページコンポーネント（タブ単位）
│   │   ├── WordListPage.tsx   # 単語一覧タブ
│   │   ├── WordListPage.module.css
│   │   ├── QuizPage.tsx       # クイズタブ
│   │   ├── QuizPage.module.css
│   │   ├── ProgressPage.tsx   # 進捗タブ
│   │   └── ProgressPage.module.css
│   │
│   └── components/            # 再利用可能なUIコンポーネント
│       ├── TabNavigation.tsx  # 下部タブバー
│       ├── CategoryFilter.tsx # 大分類・小分類ドロップダウン
│       ├── SearchBar.tsx      # キーワード検索入力
│       ├── WordCard.tsx       # 単語カード1件
│       ├── FlashCard.tsx      # フラッシュカード形式
│       ├── MultipleChoice.tsx # 4択クイズ形式
│       ├── QuizResult.tsx     # クイズ結果画面
│       └── *.module.css       # 各コンポーネントのCSSモジュール
│
├── scripts/
│   └── csv-to-json.ts         # データ変換スクリプト（CSVをJSONに）
│
├── output/
│   └── ap-shiken-terms.csv    # スクレイピング済みの生データ
│
├── dist/                      # ビルド成果物（gitignore対象）
├── package.json
├── vite.config.ts
├── tsconfig.app.json
└── eslint.config.js
```

---

## データフロー図

### 起動時のデータ取得

```
public/data/terms.json
        |
        | fetch()（HTTP GET）
        v
  useTerms()
   ├── terms: Term[]         ← 全用語の配列
   └── categories: Category[] ← termsから生成（useMemo）
        |
        v
    App.tsx
     ├── terms, categories → WordListPage
     ├── terms, categories → QuizPage
     └── terms, categories, progress → ProgressPage
```

### 単語一覧タブのデータフロー

```
App.tsx
  └── <WordListPage terms={terms} categories={categories} progress={progress}>
            |
            | useFilter(terms) ← フィルタリングロジック
            v
        filtered: Term[]  ← 絞り込み済み
            |
            v
        pageItems: Term[] ← ページネーション（50件ずつ）
            |
            v
        <WordCard term={...} progress={...} />  × N件
```

### クイズタブのデータフロー

```
App.tsx
  └── <QuizPage terms={terms} onRecordAnswer={recordAnswer}>
            |
            | useQuiz(terms)
            v
        startQuiz(settings)
            |
            | カテゴリ絞り込み + シャッフル
            v
        quizTerms: Term[]
            |
            v
        <FlashCard> または <MultipleChoice>
            |
            | onAnswer(correct)
            v
        answerQuestion() → answers[] 更新
            |
            | 全問完了
            v
        <QuizResult>
            |
            | onRecordAnswer(termId, correct)
            v
        useProgress.recordAnswer() → localStorage保存
```

---

## フックの設計思想

### なぜフックにロジックを分離するか

Javaで言えば「Controller（コンポーネント）」と「Service（フック）」の分離に近い。

- **コンポーネント** = 「何を表示するか」だけを担当
- **フック** = 「データをどう取得・加工するか」を担当

UIとロジックが分離されているため、フックは単体でテストしやすく、
同じロジックを複数のコンポーネントから使いまわせる。

### useTerms — データ取得 + カテゴリ生成

`src/hooks/useTerms.ts`

```ts
export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/terms.json')
      .then(res => res.json())
      .then((data: Term[]) => { setTerms(data); setLoading(false) })
  }, [])  // [] = マウント時1回だけ実行（@PostConstructに近い）

  const categories = useMemo<Category[]>(() => {
    // termsからカテゴリ構造を動的生成（重複排除）
    // ...
  }, [terms])  // termsが変わったときだけ再計算

  return { terms, categories, loading, error }
}
```

**ポイント:**
- `useEffect(fn, [])` は「コンポーネントが画面に現れたとき1回だけ実行」
- `useMemo` はキャッシュ付き計算。`terms` が変わらない限り再計算しない

### useFilter — フィルタリングロジック

`src/hooks/useFilter.ts`

**入力:** `terms: Term[]`（全件）
**出力:** `filtered: Term[]`（絞り込み結果）+ フィルタ状態の更新関数

```ts
const filtered = useMemo(() => {
  let result = terms
  if (majorCategoryId) result = result.filter(t => t.majorCategoryId === majorCategoryId)
  if (minorCategoryId) result = result.filter(t => t.minorCategoryId === minorCategoryId)
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.reading.toLowerCase().includes(q) ||
      t.english.toLowerCase().includes(q)
    )
  }
  return result
}, [terms, majorCategoryId, minorCategoryId, searchQuery])
```

JavaStreamに相当する絞り込みを `useMemo` でキャッシュしている。
フィルタ条件が変わったときだけ再実行される。

### useProgress — localStorage永続化

`src/hooks/useProgress.ts`

ストレージキー: `'ipa-words-progress'`

```ts
// 初期化時にlocalStorageから読み込む
const [progress, setProgress] = useState<Progress>(loadProgress)

const recordAnswer = useCallback((termId: number, correct: boolean) => {
  setProgress(prev => {
    const next = { ...prev, [termId]: { correct: ..., total: ... } }
    saveProgress(next)  // 更新のたびlocalStorageに書き込む
    return next
  })
}, [])
```

Java の `Properties` + ファイル書き込みに相当するが、
ブラウザの `localStorage` はキー・バリュー形式でJSONを永続化できる。
**アプリを閉じても・PWAとしてオフラインでも進捗が残る。**

### useQuiz — 出題ロジック

`src/hooks/useQuiz.ts`

状態: `settings`, `quizTerms`, `currentIndex`, `answers`, `isFinished`

```
startQuiz(settings)
  → カテゴリ絞り込み + シャッフル + 指定件数を切り出し
  → quizTerms をセット、currentIndex = 0

answerQuestion(correct)
  → answers に追記
  → currentIndex を進める
  → 全問終了なら isFinished = true
```

4択の選択肢生成 (`choices`) も `useMemo` で管理。
同じ小分類から優先的に誤答候補を選ぶことで、紛らわしい問題を生成する。

---

## pages と components の使い分け

| 種類 | 置き場所 | 責務 | 例 |
|---|---|---|---|
| **Page** | `src/pages/` | タブ1つ分の全体レイアウト。フックを呼び出してデータを取得・加工する | `WordListPage`, `QuizPage` |
| **Component** | `src/components/` | 単一のUI部品。propsで受け取ったデータを表示するだけ | `WordCard`, `FlashCard`, `SearchBar` |

**判断基準:**
- フックを呼び出す → Page
- propsだけで完結する → Component
- 複数のPageで使いまわす → Component

---

## 型定義（src/types/index.ts）の設計

```ts
// 用語データの型
export interface Term {
  id: number
  majorCategoryId: string   // 大分類ID（"1", "2"...）
  minorCategoryId: string   // 小分類ID
  name: string              // 用語名（日本語）
  reading: string           // 読み仮名
  english: string           // 英語表記
  category: string          // 大分類名
  subcategory: string       // 小分類名
  description: string       // 説明文
  url: string               // 出典（"AP"）
}

// 1単語の学習進捗
export interface TermProgress { correct: number; total: number }

// 全用語の進捗（termId → TermProgress）
export interface Progress { [termId: number]: TermProgress }

// ユニオン型でとりうる値を制限（Javaのenumに相当）
export type QuizDirection = 'term-to-meaning' | 'meaning-to-term'
export type QuizFormat = 'flashcard' | 'multiple-choice'
export type QuizCount = 10 | 20 | 50 | 'all'
export type TabType = 'list' | 'quiz' | 'progress'
```

全ての型を1ファイルに集中させることで、インポートパスが `../types` に統一される。

---

## 状態管理パターン（なぜReduxを使わないか）

本プロジェクトは **props drilling（propsの受け渡し）** で状態を管理している。

```
App.tsx
  ├── useTerms()  → terms, categories
  ├── useProgress() → progress, recordAnswer
  │
  ├── <WordListPage terms={terms} categories={categories} progress={progress} />
  ├── <QuizPage terms={terms} categories={categories} onRecordAnswer={recordAnswer} />
  └── <ProgressPage terms={terms} progress={progress} onReset={resetProgress} />
```

**Reduxが不要な理由:**
- 状態を共有するコンポーネントが浅い（App → Page の1階層）
- グローバルに共有が必要な状態は `terms` と `progress` のみ
- フックで十分にロジックが分離されている

**Reduxを検討すべきタイミング:**
- 状態を受け渡すコンポーネントの階層が5層以上になる
- 複数の無関係なコンポーネントが同じ状態を参照する
- 状態変更の履歴管理が必要になる

---

## CSS Modules の命名規則

本プロジェクトは `*.module.css` を各コンポーネントに対応して配置する。

```
WordCard.tsx
WordCard.module.css   ← このコンポーネントだけに適用されるCSS
```

**命名規則（camelCase）:**

```css
/* WordCard.module.css */
.card { ... }
.cardHeader { ... }    /* camelCase */
.termName { ... }
.progressBar { ... }
```

```tsx
// WordCard.tsx
import styles from './WordCard.module.css'
<div className={styles.card}>
  <div className={styles.termName}>...</div>
</div>
```

ビルド時に `.card` → `.WordCard_card__xK3jP` のようなユニークなクラス名に変換されるため、
グローバルなスタイル衝突が起きない。

---

## ビルド時のデータフロー（CSV → JSON → バンドル）

```
IPA試験サイト
      |
      | scrape.py（Pythonスクレイピング）
      v
output/ap-shiken-terms.csv
      |
      | npx tsx scripts/csv-to-json.ts
      v
public/data/terms.json       ← 600KB程度のJSONファイル
      |
      | npm run build（vite build）
      v
dist/data/terms.json         ← そのままコピー
dist/assets/index-*.js       ← バンドルされたアプリコード
dist/sw.js                   ← Service Worker（PWAオフライン対応）
      |
      | GitHub Actions（deploy.yml）
      v
GitHub Pages（https://yourname.github.io/ipa-words/）
```

`terms.json` はJSバンドルに含めず、**実行時に `fetch()` で取得する設計**にしている。
これによりアプリコードとデータを分離でき、データ更新時にアプリ全体を再ビルドしなくてよい。
Service WorkerがJSONをキャッシュするため、オフラインでも動作する。

---

## 新しい機能を追加する場合の手順例

### 例: 「お気に入り機能」を追加する

**1. 型定義を追加**（`src/types/index.ts`）

```ts
// お気に入りのtermIdの集合
export interface Favorites {
  [termId: number]: boolean
}
```

**2. フックを作成**（`src/hooks/useFavorites.ts`）

```ts
export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorites>(load)

  const toggleFavorite = useCallback((termId: number) => {
    setFavorites(prev => {
      const next = { ...prev, [termId]: !prev[termId] }
      save(next)
      return next
    })
  }, [])

  return { favorites, toggleFavorite }
}
```

**3. App.tsx でフックを呼び出してpropsとして渡す**

```tsx
const { favorites, toggleFavorite } = useFavorites()
// WordListPage に渡す
<WordListPage ... favorites={favorites} onToggleFavorite={toggleFavorite} />
```

**4. WordCard.tsx にお気に入りボタンを追加**

```tsx
interface Props {
  // ...既存props
  isFavorite: boolean
  onToggle: () => void
}
```

**5. WordCard.module.css にスタイルを追加**

このパターンを守ることで、機能追加の影響範囲が明確になり、
既存コードを壊すリスクを最小化できる。
