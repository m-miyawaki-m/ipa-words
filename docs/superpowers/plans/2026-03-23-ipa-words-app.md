# IPA単語帳アプリ 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** IPA応用情報技術者試験の用語5,488語を学習できるPWA単語帳アプリを構築する。

**Architecture:** React + TypeScript SPA。CSVデータをビルド時にJSONへ変換しバンドル。タブナビゲーションで一覧・出題・進捗の3画面を切り替える。進捗データはlocalStorageに永続化。vite-plugin-pwaでオフライン対応し、GitHub Pagesでホスティング。

**Tech Stack:** React 18, TypeScript, Vite, vite-plugin-pwa, react-window, CSS Modules, GitHub Pages

**Spec:** `docs/requirements.md`, `docs/basic-design.md`

---

## File Map

```
ipa-words/
├── scripts/
│   └── csv-to-json.ts           # CSV→JSON変換
├── public/
│   ├── data/terms.json           # 変換済み用語データ
│   └── icons/                    # PWAアイコン（icon-192.png, icon-512.png）
├── src/
│   ├── types/
│   │   └── index.ts              # Term, Progress, Category, QuizSettings 型定義
│   ├── hooks/
│   │   ├── useTerms.ts           # terms.json読み込み+カテゴリ生成
│   │   ├── useFilter.ts          # ジャンルフィルタ・検索
│   │   ├── useProgress.ts        # localStorage進捗読み書き
│   │   └── useQuiz.ts            # 出題ロジック
│   ├── components/
│   │   ├── TabNavigation.tsx      # 下部タブバー
│   │   ├── TabNavigation.module.css
│   │   ├── CategoryFilter.tsx     # 大分類→中分類ドリルダウン
│   │   ├── CategoryFilter.module.css
│   │   ├── SearchBar.tsx          # 検索入力
│   │   ├── SearchBar.module.css
│   │   ├── WordCard.tsx           # 単語カード（展開/折りたたみ）
│   │   ├── WordCard.module.css
│   │   ├── FlashCard.tsx          # フラッシュカード出題
│   │   ├── FlashCard.module.css
│   │   ├── MultipleChoice.tsx     # 4択クイズ出題
│   │   ├── MultipleChoice.module.css
│   │   ├── QuizResult.tsx         # 出題結果
│   │   └── QuizResult.module.css
│   ├── pages/
│   │   ├── WordListPage.tsx       # 一覧画面
│   │   ├── WordListPage.module.css
│   │   ├── QuizPage.tsx           # 出題画面（設定→出題→結果）
│   │   ├── QuizPage.module.css
│   │   ├── ProgressPage.tsx       # 進捗画面
│   │   └── ProgressPage.module.css
│   ├── App.tsx                    # タブ切り替え + データ読み込み
│   ├── App.module.css
│   ├── main.tsx                   # エントリポイント
│   └── index.css                  # グローバルスタイル（リセット等）
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

---

## Task 1: プロジェクト初期化

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: gitリポジトリ初期化**

```bash
cd /home/miyaw/dev/learning/ipa-words
git init
```

- [ ] **Step 2: .gitignore作成**

Create `.gitignore`:
```
node_modules/
dist/
.venv/
__pycache__/
```

- [ ] **Step 3: Vite + React + TypeScriptプロジェクト作成**

既存ファイル（docs/, input/, output/, scrape.py）はそのまま残す。

```bash
npm create vite@latest . -- --template react-ts
```

もし既存ファイルとの競合でエラーになる場合は、一時ディレクトリに作成してコピーする:
```bash
npm create vite@latest tmp-vite -- --template react-ts
cp -n tmp-vite/* tmp-vite/.* . 2>/dev/null || true
rm -rf tmp-vite
```

- [ ] **Step 4: 依存パッケージ追加**

```bash
npm install
npm install react-window
npm install -D @types/react-window vite-plugin-pwa
```

- [ ] **Step 5: vite.config.ts設定**

GitHub Pagesのベースパスを設定する。PWAはTask 13で設定するのでここではまだ追加しない。

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ipa-words/',
})
```

- [ ] **Step 6: 動作確認**

```bash
npm run dev
```

ブラウザで `http://localhost:5173/ipa-words/` にアクセスしてViteのデフォルト画面が表示されることを確認。Ctrl+Cで停止。

- [ ] **Step 7: 不要なデフォルトファイル削除**

Viteテンプレートの不要ファイルを削除:
```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 8: コミット**

```bash
git add .gitignore package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html src/main.tsx src/App.tsx src/vite-env.d.ts
git commit -m "chore: initialize Vite + React + TypeScript project"
```

---

## Task 2: CSV→JSON変換スクリプト

**Files:**
- Create: `scripts/csv-to-json.ts`, `public/data/terms.json`

- [ ] **Step 1: 変換スクリプト作成**

Create `scripts/csv-to-json.ts`:
```typescript
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'

interface Term {
  id: number
  url: string
  majorCategoryId: string
  minorCategoryId: string
  name: string
  reading: string
  english: string
  category: string
  subcategory: string
  description: string
}

const csvPath = resolve(__dirname, '../output/ap-shiken-terms.csv')
const outPath = resolve(__dirname, '../public/data/terms.json')

const csv = readFileSync(csvPath, 'utf-8')
const lines = csv.split('\n').filter(line => line.trim())
const header = lines[0].replace(/^\uFEFF/, '') // BOM除去
const keys = header.split(',')

const terms: Term[] = []

for (let i = 1; i < lines.length; i++) {
  // CSVパース: カンマ区切りだが説明文にカンマは含まれない前提
  // 説明フィールドは最後の列なので、最初の8カンマで分割
  const line = lines[i]
  const parts: string[] = []
  let idx = 0
  for (let col = 0; col < 8; col++) {
    const next = line.indexOf(',', idx)
    parts.push(line.substring(idx, next))
    idx = next + 1
  }
  parts.push(line.substring(idx)) // 残り全部が説明文

  terms.push({
    id: i,
    url: parts[0],
    majorCategoryId: parts[1],
    minorCategoryId: parts[2],
    name: parts[3],
    reading: parts[4],
    english: parts[5],
    category: parts[6],
    subcategory: parts[7],
    description: parts[8],
  })
}

mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, JSON.stringify(terms, null, 2), 'utf-8')
console.log(`${terms.length} terms written to ${outPath}`)
```

- [ ] **Step 2: スクリプト実行**

```bash
npx tsx scripts/csv-to-json.ts
```

Expected: `5488 terms written to .../public/data/terms.json`

- [ ] **Step 3: 出力確認**

terms.jsonの先頭と末尾を確認し、id・name・description等が正しく入っていることを検証。

- [ ] **Step 4: コミット**

```bash
git add scripts/csv-to-json.ts public/data/terms.json
git commit -m "feat: add CSV to JSON conversion script and generate terms.json"
```

---

## Task 3: 型定義

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 型定義ファイル作成**

Create `src/types/index.ts`:
```typescript
export interface Term {
  id: number
  url: string
  majorCategoryId: string
  minorCategoryId: string
  name: string
  reading: string
  english: string
  category: string
  subcategory: string
  description: string
}

export interface TermProgress {
  correct: number
  total: number
}

export interface Progress {
  [termId: number]: TermProgress
}

export interface Subcategory {
  id: string
  name: string
}

export interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}

export type QuizDirection = 'term-to-meaning' | 'meaning-to-term'
export type QuizFormat = 'flashcard' | 'multiple-choice'
export type QuizCount = 10 | 20 | 50 | 'all'
export type TabType = 'list' | 'quiz' | 'progress'

export interface QuizSettings {
  majorCategoryId: string
  minorCategoryId: string
  direction: QuizDirection
  format: QuizFormat
  count: QuizCount
}

export interface QuizAnswer {
  termId: number
  correct: boolean
}
```

- [ ] **Step 2: コミット**

```bash
git add src/types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 4: useTermsフック（データ読み込み+カテゴリ生成）

**Files:**
- Create: `src/hooks/useTerms.ts`

- [ ] **Step 1: useTermsフック作成**

Create `src/hooks/useTerms.ts`:
```typescript
import { useState, useEffect, useMemo } from 'react'
import type { Term, Category } from '../types'

export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/terms.json')
      .then(res => res.json())
      .then((data: Term[]) => {
        setTerms(data)
        setLoading(false)
      })
  }, [])

  const categories = useMemo<Category[]>(() => {
    const map = new Map<string, Category>()
    for (const term of terms) {
      if (!map.has(term.majorCategoryId)) {
        map.set(term.majorCategoryId, {
          id: term.majorCategoryId,
          name: term.category,
          subcategories: [],
        })
      }
      const cat = map.get(term.majorCategoryId)!
      if (!cat.subcategories.some(s => s.id === term.minorCategoryId)) {
        cat.subcategories.push({
          id: term.minorCategoryId,
          name: term.subcategory,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      Number(a.id) - Number(b.id)
    )
  }, [terms])

  return { terms, categories, loading }
}
```

- [ ] **Step 2: 動作確認**

App.tsxでuseTermsを呼び出し、`terms.length`と`categories.length`をコンソールに出力して確認。

- [ ] **Step 3: コミット**

```bash
git add src/hooks/useTerms.ts
git commit -m "feat: add useTerms hook for data loading and category generation"
```

---

## Task 5: useProgressフック（進捗データ永続化）

**Files:**
- Create: `src/hooks/useProgress.ts`

- [ ] **Step 1: useProgressフック作成**

Create `src/hooks/useProgress.ts`:
```typescript
import { useState, useCallback } from 'react'
import type { Progress, TermProgress } from '../types'

const STORAGE_KEY = 'ipa-words-progress'

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveProgress(progress: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress)

  const recordAnswer = useCallback((termId: number, correct: boolean) => {
    setProgress(prev => {
      const entry = prev[termId] || { correct: 0, total: 0 }
      const next: Progress = {
        ...prev,
        [termId]: {
          correct: entry.correct + (correct ? 1 : 0),
          total: entry.total + 1,
        },
      }
      saveProgress(next)
      return next
    })
  }, [])

  const getProgress = useCallback(
    (termId: number): TermProgress | null => {
      return progress[termId] || null
    },
    [progress]
  )

  const resetProgress = useCallback(() => {
    setProgress({})
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { progress, recordAnswer, getProgress, resetProgress }
}
```

- [ ] **Step 2: コミット**

```bash
git add src/hooks/useProgress.ts
git commit -m "feat: add useProgress hook for localStorage persistence"
```

---

## Task 6: useFilterフック（検索・ジャンルフィルタ）

**Files:**
- Create: `src/hooks/useFilter.ts`

- [ ] **Step 1: useFilterフック作成**

Create `src/hooks/useFilter.ts`:
```typescript
import { useState, useMemo } from 'react'
import type { Term } from '../types'

export function useFilter(terms: Term[]) {
  const [majorCategoryId, setMajorCategoryId] = useState('')
  const [minorCategoryId, setMinorCategoryId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    let result = terms

    if (majorCategoryId) {
      result = result.filter(t => t.majorCategoryId === majorCategoryId)
    }

    if (minorCategoryId) {
      result = result.filter(t => t.minorCategoryId === minorCategoryId)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.reading.toLowerCase().includes(q) ||
          t.english.toLowerCase().includes(q)
      )
    }

    return result
  }, [terms, majorCategoryId, minorCategoryId, searchQuery])

  const setMajorCategory = (id: string) => {
    setMajorCategoryId(id)
    setMinorCategoryId('')
  }

  return {
    majorCategoryId,
    minorCategoryId,
    searchQuery,
    filtered,
    setMajorCategory,
    setMinorCategoryId,
    setSearchQuery,
  }
}
```

- [ ] **Step 2: コミット**

```bash
git add src/hooks/useFilter.ts
git commit -m "feat: add useFilter hook for category and search filtering"
```

---

## Task 7: useQuizフック（出題ロジック）

**Files:**
- Create: `src/hooks/useQuiz.ts`

- [ ] **Step 1: useQuizフック作成**

Create `src/hooks/useQuiz.ts`:
```typescript
import { useState, useMemo, useCallback } from 'react'
import type { Term, QuizSettings, QuizAnswer } from '../types'

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function useQuiz(allTerms: Term[]) {
  const [settings, setSettings] = useState<QuizSettings | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [isFinished, setIsFinished] = useState(false)

  // 出題対象の用語リスト（設定確定時にシャッフル）
  const [quizTerms, setQuizTerms] = useState<Term[]>([])

  const startQuiz = useCallback(
    (newSettings: QuizSettings) => {
      let pool = allTerms

      if (newSettings.majorCategoryId) {
        pool = pool.filter(
          t => t.majorCategoryId === newSettings.majorCategoryId
        )
      }
      if (newSettings.minorCategoryId) {
        pool = pool.filter(
          t => t.minorCategoryId === newSettings.minorCategoryId
        )
      }

      const shuffled = shuffle(pool)
      const count =
        newSettings.count === 'all'
          ? shuffled.length
          : Math.min(newSettings.count, shuffled.length)

      setQuizTerms(shuffled.slice(0, count))
      setSettings(newSettings)
      setCurrentIndex(0)
      setAnswers([])
      setIsFinished(false)
    },
    [allTerms]
  )

  const currentTerm = quizTerms[currentIndex] || null

  // 4択の選択肢を生成（同じ中分類から優先）
  const choices = useMemo<Term[]>(() => {
    if (!currentTerm || !settings || settings.format !== 'multiple-choice') {
      return []
    }

    const sameCategory = allTerms.filter(
      t =>
        t.minorCategoryId === currentTerm.minorCategoryId &&
        t.id !== currentTerm.id
    )
    const otherCategory = allTerms.filter(
      t =>
        t.minorCategoryId !== currentTerm.minorCategoryId &&
        t.id !== currentTerm.id
    )

    let wrongChoices: Term[]
    if (sameCategory.length >= 3) {
      wrongChoices = shuffle(sameCategory).slice(0, 3)
    } else {
      wrongChoices = [
        ...shuffle(sameCategory),
        ...shuffle(otherCategory).slice(0, 3 - sameCategory.length),
      ]
    }

    return shuffle([currentTerm, ...wrongChoices])
  }, [currentTerm, settings, allTerms])

  const answerQuestion = useCallback(
    (correct: boolean) => {
      if (!currentTerm) return

      const newAnswers = [...answers, { termId: currentTerm.id, correct }]
      setAnswers(newAnswers)

      if (currentIndex + 1 >= quizTerms.length) {
        setIsFinished(true)
      } else {
        setCurrentIndex(currentIndex + 1)
      }
    },
    [currentTerm, answers, currentIndex, quizTerms.length]
  )

  const resetQuiz = useCallback(() => {
    setSettings(null)
    setQuizTerms([])
    setCurrentIndex(0)
    setAnswers([])
    setIsFinished(false)
  }, [])

  return {
    settings,
    currentTerm,
    currentIndex,
    totalCount: quizTerms.length,
    choices,
    answers,
    isFinished,
    quizTerms,
    startQuiz,
    answerQuestion,
    resetQuiz,
  }
}
```

- [ ] **Step 2: コミット**

```bash
git add src/hooks/useQuiz.ts
git commit -m "feat: add useQuiz hook for quiz logic and choice generation"
```

---

## Task 8: グローバルCSS + App Shell + TabNavigation

**Files:**
- Create: `src/index.css`, `src/App.module.css`, `src/components/TabNavigation.tsx`, `src/components/TabNavigation.module.css`
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: グローバルCSS作成**

Create `src/index.css`:
```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  background: #ffffff;
  color: #333333;
  line-height: 1.6;
  padding-bottom: 56px; /* タブバーの高さ分 */
}

button {
  font: inherit;
  cursor: pointer;
  border: none;
  background: none;
}

select {
  font: inherit;
}

input {
  font: inherit;
}
```

- [ ] **Step 2: main.tsx更新**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 3: TabNavigation作成**

Create `src/components/TabNavigation.tsx`:
```typescript
import type { TabType } from '../types'
import styles from './TabNavigation.module.css'

interface Props {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs: { key: TabType; label: string }[] = [
  { key: 'list', label: '一覧' },
  { key: 'quiz', label: '出題' },
  { key: 'progress', label: '進捗' },
]

export function TabNavigation({ activeTab, onTabChange }: Props) {
  return (
    <nav className={styles.nav}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
```

Create `src/components/TabNavigation.module.css`:
```css
.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #ffffff;
  border-top: 1px solid #e0e0e0;
  z-index: 100;
  height: 56px;
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: #999999;
  transition: color 0.2s;
}

.active {
  color: #333333;
  font-weight: 600;
}
```

- [ ] **Step 4: App.tsx更新**

```typescript
import { useState } from 'react'
import type { TabType } from './types'
import { useTerms } from './hooks/useTerms'
import { useProgress } from './hooks/useProgress'
import { TabNavigation } from './components/TabNavigation'
import styles from './App.module.css'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('list')
  const { terms, categories, loading } = useTerms()
  const { progress, recordAnswer, getProgress, resetProgress } = useProgress()

  if (loading) {
    return <div className={styles.loading}>読み込み中...</div>
  }

  return (
    <div className={styles.app}>
      <main className={styles.main}>
        {activeTab === 'list' && <div>一覧（Task 9で実装）</div>}
        {activeTab === 'quiz' && <div>出題（Task 10-12で実装）</div>}
        {activeTab === 'progress' && <div>進捗（Task 13で実装）</div>}
      </main>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
```

Create `src/App.module.css`:
```css
.app {
  max-width: 600px;
  margin: 0 auto;
}

.main {
  padding: 16px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #999999;
}
```

- [ ] **Step 5: 動作確認**

```bash
npm run dev
```

ブラウザでタブ切り替えが動作し、ローディング後にプレースホルダーが表示されることを確認。

- [ ] **Step 6: コミット**

```bash
git add src/index.css src/main.tsx src/App.tsx src/App.module.css src/components/TabNavigation.tsx src/components/TabNavigation.module.css
git commit -m "feat: add app shell with tab navigation"
```

---

## Task 9: 単語一覧画面（CategoryFilter + SearchBar + WordCard + 仮想スクロール）

**Files:**
- Create: `src/components/CategoryFilter.tsx`, `src/components/CategoryFilter.module.css`, `src/components/SearchBar.tsx`, `src/components/SearchBar.module.css`, `src/components/WordCard.tsx`, `src/components/WordCard.module.css`, `src/pages/WordListPage.tsx`, `src/pages/WordListPage.module.css`

- [ ] **Step 1: CategoryFilter作成**

Create `src/components/CategoryFilter.tsx`:
```typescript
import type { Category } from '../types'
import styles from './CategoryFilter.module.css'

interface Props {
  categories: Category[]
  majorCategoryId: string
  minorCategoryId: string
  onMajorChange: (id: string) => void
  onMinorChange: (id: string) => void
}

export function CategoryFilter({
  categories,
  majorCategoryId,
  minorCategoryId,
  onMajorChange,
  onMinorChange,
}: Props) {
  const selectedMajor = categories.find(c => c.id === majorCategoryId)

  return (
    <div className={styles.filter}>
      <select
        className={styles.select}
        value={majorCategoryId}
        onChange={e => onMajorChange(e.target.value)}
      >
        <option value="">全ての大分類</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select
        className={styles.select}
        value={minorCategoryId}
        onChange={e => onMinorChange(e.target.value)}
        disabled={!majorCategoryId}
      >
        <option value="">全ての中分類</option>
        {selectedMajor?.subcategories.map(s => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  )
}
```

Create `src/components/CategoryFilter.module.css`:
```css
.filter {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.select {
  flex: 1;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #ffffff;
  font-size: 0.875rem;
  color: #333333;
  appearance: auto;
}

.select:disabled {
  opacity: 0.5;
}
```

- [ ] **Step 2: SearchBar作成**

Create `src/components/SearchBar.tsx`:
```typescript
import { useState, useEffect } from 'react'
import styles from './SearchBar.module.css'

interface Props {
  onSearch: (query: string) => void
}

export function SearchBar({ onSearch }: Props) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 300)
    return () => clearTimeout(timer)
  }, [value, onSearch])

  return (
    <input
      className={styles.input}
      type="text"
      placeholder="用語名・読み・英語で検索..."
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  )
}
```

Create `src/components/SearchBar.module.css`:
```css
.input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 12px;
  outline: none;
}

.input:focus {
  border-color: #999999;
}
```

- [ ] **Step 3: WordCard作成**

Create `src/components/WordCard.tsx`:
```typescript
import { useState } from 'react'
import type { Term, TermProgress } from '../types'
import styles from './WordCard.module.css'

interface Props {
  term: Term
  progress: TermProgress | null
}

export function WordCard({ term, progress }: Props) {
  const [expanded, setExpanded] = useState(false)

  const rate =
    progress && progress.total > 0
      ? Math.round((progress.correct / progress.total) * 100)
      : null

  return (
    <div className={styles.card} onClick={() => setExpanded(!expanded)}>
      <div className={styles.header}>
        <div className={styles.name}>{term.name}</div>
        {rate !== null && <span className={styles.rate}>{rate}%</span>}
      </div>
      <div className={styles.sub}>
        {term.reading}
        {term.english && ` / ${term.english}`}
      </div>
      {expanded && <div className={styles.description}>{term.description}</div>}
    </div>
  )
}
```

Create `src/components/WordCard.module.css`:
```css
.card {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.15s;
}

.card:active {
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  font-size: 1rem;
  font-weight: 600;
}

.rate {
  font-size: 0.75rem;
  color: #999999;
}

.sub {
  font-size: 0.75rem;
  color: #999999;
  margin-top: 2px;
}

.description {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 0.875rem;
  line-height: 1.6;
}
```

- [ ] **Step 4: WordListPage作成（react-windowで仮想スクロール）**

Create `src/pages/WordListPage.tsx`:
```typescript
import { useCallback } from 'react'
import { FixedSizeList } from 'react-window'
import type { Term, Category, Progress } from '../types'
import { useFilter } from '../hooks/useFilter'
import { CategoryFilter } from '../components/CategoryFilter'
import { SearchBar } from '../components/SearchBar'
import { WordCard } from '../components/WordCard'
import styles from './WordListPage.module.css'

interface Props {
  terms: Term[]
  categories: Category[]
  progress: Progress
}

export function WordListPage({ terms, categories, progress }: Props) {
  const {
    majorCategoryId,
    minorCategoryId,
    filtered,
    setMajorCategory,
    setMinorCategoryId,
    setSearchQuery,
  } = useFilter(terms)

  const handleSearch = useCallback(
    (q: string) => setSearchQuery(q),
    [setSearchQuery]
  )

  // react-windowではカード高さを固定する必要がある
  // 展開時の高さが変わるため、FixedSizeListではなく通常レンダリングに
  // フォールバック（フィルタ済みが500件以下の場合）
  const useVirtualScroll = filtered.length > 500

  return (
    <div>
      <h1 className={styles.title}>IPA単語帳</h1>
      <CategoryFilter
        categories={categories}
        majorCategoryId={majorCategoryId}
        minorCategoryId={minorCategoryId}
        onMajorChange={setMajorCategory}
        onMinorChange={setMinorCategoryId}
      />
      <SearchBar onSearch={handleSearch} />
      <div className={styles.count}>{filtered.length} 語</div>

      {useVirtualScroll ? (
        <FixedSizeList
          height={window.innerHeight - 220}
          width="100%"
          itemCount={filtered.length}
          itemSize={72}
        >
          {({ index, style }) => (
            <div style={style}>
              <WordCard
                term={filtered[index]}
                progress={progress[filtered[index].id] || null}
              />
            </div>
          )}
        </FixedSizeList>
      ) : (
        filtered.map(term => (
          <WordCard
            key={term.id}
            term={term}
            progress={progress[term.id] || null}
          />
        ))
      )}
    </div>
  )
}
```

Create `src/pages/WordListPage.module.css`:
```css
.title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.count {
  font-size: 0.75rem;
  color: #999999;
  margin-bottom: 8px;
}
```

- [ ] **Step 5: App.tsxにWordListPageを接続**

App.tsxのプレースホルダー `{activeTab === 'list' && <div>一覧（Task 9で実装）</div>}` を以下に置き換え:
```typescript
{activeTab === 'list' && (
  <WordListPage terms={terms} categories={categories} progress={progress} />
)}
```

importも追加:
```typescript
import { WordListPage } from './pages/WordListPage'
```

- [ ] **Step 6: 動作確認**

```bash
npm run dev
```

一覧タブで: カテゴリフィルタ、検索、カードタップによる展開が動作することを確認。

- [ ] **Step 7: コミット**

```bash
git add src/components/CategoryFilter.tsx src/components/CategoryFilter.module.css src/components/SearchBar.tsx src/components/SearchBar.module.css src/components/WordCard.tsx src/components/WordCard.module.css src/pages/WordListPage.tsx src/pages/WordListPage.module.css src/hooks/useFilter.ts src/App.tsx
git commit -m "feat: add word list page with category filter, search, and virtual scroll"
```

---

## Task 10: 出題設定画面 + フラッシュカード

**Files:**
- Create: `src/components/FlashCard.tsx`, `src/components/FlashCard.module.css`, `src/pages/QuizPage.tsx`, `src/pages/QuizPage.module.css`

- [ ] **Step 1: FlashCard作成**

Create `src/components/FlashCard.tsx`:
```typescript
import { useState } from 'react'
import type { Term, QuizDirection } from '../types'
import styles from './FlashCard.module.css'

interface Props {
  term: Term
  direction: QuizDirection
  onAnswer: (correct: boolean) => void
}

export function FlashCard({ term, direction, onAnswer }: Props) {
  const [revealed, setRevealed] = useState(false)

  const question =
    direction === 'term-to-meaning' ? term.name : term.description
  const questionSub =
    direction === 'term-to-meaning'
      ? `${term.reading}${term.english ? ` / ${term.english}` : ''}`
      : ''

  return (
    <div className={styles.container}>
      <div
        className={styles.card}
        onClick={() => !revealed && setRevealed(true)}
      >
        <div className={styles.question}>{question}</div>
        {questionSub && <div className={styles.sub}>{questionSub}</div>}
        {!revealed && <div className={styles.hint}>タップで表示</div>}
        {revealed && (
          <div className={styles.answer}>
            {direction === 'term-to-meaning' ? (
              <p>{term.description}</p>
            ) : (
              <>
                <p className={styles.answerName}>{term.name}</p>
                <p className={styles.answerSub}>
                  {term.reading}
                  {term.english ? ` / ${term.english}` : ''}
                </p>
              </>
            )}
          </div>
        )}
      </div>
      {revealed && (
        <div className={styles.buttons}>
          <button
            className={`${styles.btn} ${styles.btnWrong}`}
            onClick={() => onAnswer(false)}
          >
            まだ
          </button>
          <button
            className={`${styles.btn} ${styles.btnCorrect}`}
            onClick={() => onAnswer(true)}
          >
            覚えた
          </button>
        </div>
      )}
    </div>
  )
}
```

Create `src/components/FlashCard.module.css`:
```css
.container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180px);
}

.card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  overflow-y: auto;
}

.question {
  font-size: 1.25rem;
  font-weight: 600;
  word-break: break-word;
}

.sub {
  font-size: 0.875rem;
  color: #999999;
  margin-top: 4px;
}

.hint {
  font-size: 0.75rem;
  color: #cccccc;
  margin-top: 16px;
}

.answer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 0.875rem;
  line-height: 1.6;
  text-align: left;
  width: 100%;
}

.answerName {
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
}

.answerSub {
  font-size: 0.875rem;
  color: #999999;
  text-align: center;
  margin-top: 4px;
}

.buttons {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.btn {
  flex: 1;
  padding: 14px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.btnWrong {
  background: #e0e0e0;
  color: #666666;
}

.btnCorrect {
  background: #333333;
}
```

- [ ] **Step 2: QuizPage作成（設定画面 + フラッシュカード表示）**

Create `src/pages/QuizPage.tsx`:
```typescript
import { useState } from 'react'
import type {
  Term,
  Category,
  QuizSettings,
  QuizDirection,
  QuizFormat,
  QuizCount,
} from '../types'
import { useQuiz } from '../hooks/useQuiz'
import { CategoryFilter } from '../components/CategoryFilter'
import { FlashCard } from '../components/FlashCard'
import { MultipleChoice } from '../components/MultipleChoice'
import { QuizResult } from '../components/QuizResult'
import styles from './QuizPage.module.css'

interface Props {
  terms: Term[]
  categories: Category[]
  onRecordAnswer: (termId: number, correct: boolean) => void
}

export function QuizPage({ terms, categories, onRecordAnswer }: Props) {
  const [majorCategoryId, setMajorCategoryId] = useState('')
  const [minorCategoryId, setMinorCategoryId] = useState('')
  const [direction, setDirection] = useState<QuizDirection>('term-to-meaning')
  const [format, setFormat] = useState<QuizFormat>('flashcard')
  const [count, setCount] = useState<QuizCount>(10)

  const quiz = useQuiz(terms)

  const handleStart = () => {
    quiz.startQuiz({
      majorCategoryId,
      minorCategoryId,
      direction,
      format,
      count,
    })
  }

  const handleAnswer = (correct: boolean) => {
    if (quiz.currentTerm) {
      onRecordAnswer(quiz.currentTerm.id, correct)
    }
    quiz.answerQuestion(correct)
  }

  const handleMajorChange = (id: string) => {
    setMajorCategoryId(id)
    setMinorCategoryId('')
  }

  // 結果画面
  if (quiz.isFinished) {
    return (
      <QuizResult
        answers={quiz.answers}
        quizTerms={quiz.quizTerms}
        onRetry={handleStart}
        onBackToSettings={quiz.resetQuiz}
      />
    )
  }

  // 出題画面
  if (quiz.settings && quiz.currentTerm) {
    return (
      <div>
        <div className={styles.progress}>
          {quiz.currentIndex + 1} / {quiz.totalCount}
        </div>

        {quiz.settings.format === 'flashcard' ? (
          <FlashCard
            key={quiz.currentTerm.id}
            term={quiz.currentTerm}
            direction={quiz.settings.direction}
            onAnswer={handleAnswer}
          />
        ) : (
          <MultipleChoice
            key={quiz.currentTerm.id}
            term={quiz.currentTerm}
            choices={quiz.choices}
            direction={quiz.settings.direction}
            onAnswer={handleAnswer}
          />
        )}
      </div>
    )
  }

  // 設定画面
  return (
    <div>
      <h1 className={styles.title}>出題設定</h1>

      <div className={styles.section}>
        <div className={styles.label}>ジャンル</div>
        <CategoryFilter
          categories={categories}
          majorCategoryId={majorCategoryId}
          minorCategoryId={minorCategoryId}
          onMajorChange={handleMajorChange}
          onMinorChange={setMinorCategoryId}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.label}>出題方向</div>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={direction === 'term-to-meaning'}
              onChange={() => setDirection('term-to-meaning')}
            />
            用語 → 意味
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={direction === 'meaning-to-term'}
              onChange={() => setDirection('meaning-to-term')}
            />
            意味 → 用語
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>出題形式</div>
        <div className={styles.radioGroup}>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={format === 'flashcard'}
              onChange={() => setFormat('flashcard')}
            />
            フラッシュカード
          </label>
          <label className={styles.radio}>
            <input
              type="radio"
              checked={format === 'multiple-choice'}
              onChange={() => setFormat('multiple-choice')}
            />
            4択クイズ
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>出題数</div>
        <div className={styles.radioGroup}>
          {([10, 20, 50, 'all'] as QuizCount[]).map(c => (
            <label key={String(c)} className={styles.radio}>
              <input
                type="radio"
                checked={count === c}
                onChange={() => setCount(c)}
              />
              {c === 'all' ? '全問' : `${c}問`}
            </label>
          ))}
        </div>
      </div>

      <button className={styles.startBtn} onClick={handleStart}>
        出題開始
      </button>
    </div>
  )
}
```

Create `src/pages/QuizPage.module.css`:
```css
.title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.section {
  margin-bottom: 20px;
}

.label {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.radioGroup {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.radio {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}

.startBtn {
  width: 100%;
  padding: 14px;
  background: #333333;
  color: #ffffff;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 8px;
}

.progress {
  text-align: center;
  font-size: 0.875rem;
  color: #999999;
  margin-bottom: 12px;
}
```

- [ ] **Step 3: App.tsxにQuizPageを接続**

プレースホルダーを置き換え:
```typescript
{activeTab === 'quiz' && (
  <QuizPage
    terms={terms}
    categories={categories}
    onRecordAnswer={recordAnswer}
  />
)}
```

importも追加:
```typescript
import { QuizPage } from './pages/QuizPage'
```

- [ ] **Step 4: 動作確認**

出題タブ → 設定 → フラッシュカードで出題 → 覚えた/まだの動作を確認。
（MultipleChoiceとQuizResultはまだ未作成なのでフラッシュカードのみ確認）

- [ ] **Step 5: コミット**

```bash
git add src/components/FlashCard.tsx src/components/FlashCard.module.css src/pages/QuizPage.tsx src/pages/QuizPage.module.css src/hooks/useQuiz.ts src/App.tsx
git commit -m "feat: add quiz settings page and flashcard quiz mode"
```

---

## Task 11: 4択クイズ

**Files:**
- Create: `src/components/MultipleChoice.tsx`, `src/components/MultipleChoice.module.css`

- [ ] **Step 1: MultipleChoice作成**

Create `src/components/MultipleChoice.tsx`:
```typescript
import { useState } from 'react'
import type { Term, QuizDirection } from '../types'
import styles from './MultipleChoice.module.css'

interface Props {
  term: Term
  choices: Term[]
  direction: QuizDirection
  onAnswer: (correct: boolean) => void
}

export function MultipleChoice({ term, choices, direction, onAnswer }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const question =
    direction === 'term-to-meaning' ? term.name : term.description
  const questionSub =
    direction === 'term-to-meaning'
      ? `${term.reading}${term.english ? ` / ${term.english}` : ''}`
      : ''

  const getChoiceLabel = (choice: Term) => {
    if (direction === 'term-to-meaning') {
      return choice.description.length > 80
        ? choice.description.slice(0, 80) + '...'
        : choice.description
    }
    return choice.name
  }

  const handleSelect = (choiceId: number) => {
    if (selectedId !== null) return
    setSelectedId(choiceId)
  }

  const getChoiceStyle = (choice: Term) => {
    if (selectedId === null) return styles.choice
    if (choice.id === term.id) return `${styles.choice} ${styles.correct}`
    if (choice.id === selectedId) return `${styles.choice} ${styles.wrong}`
    return `${styles.choice} ${styles.disabled}`
  }

  return (
    <div className={styles.container}>
      <div className={styles.question}>{question}</div>
      {questionSub && <div className={styles.sub}>{questionSub}</div>}

      <div className={styles.choices}>
        {choices.map(choice => (
          <button
            key={choice.id}
            className={getChoiceStyle(choice)}
            onClick={() => handleSelect(choice.id)}
          >
            {getChoiceLabel(choice)}
          </button>
        ))}
      </div>

      {selectedId !== null && (
        <button
          className={styles.nextBtn}
          onClick={() => onAnswer(selectedId === term.id)}
        >
          次へ
        </button>
      )}
    </div>
  )
}
```

Create `src/components/MultipleChoice.module.css`:
```css
.container {
  display: flex;
  flex-direction: column;
}

.question {
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 4px;
  word-break: break-word;
}

.sub {
  font-size: 0.875rem;
  color: #999999;
  text-align: center;
  margin-bottom: 20px;
}

.choices {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.choice {
  padding: 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: left;
  font-size: 0.875rem;
  line-height: 1.5;
  background: #ffffff;
  transition: background 0.15s, border-color 0.15s;
}

.choice:active {
  background: #f5f5f5;
}

.correct {
  background: #e8f5e9;
  border-color: #4caf50;
}

.wrong {
  background: #ffebee;
  border-color: #f44336;
}

.disabled {
  opacity: 0.5;
}

.nextBtn {
  margin-top: 16px;
  padding: 14px;
  background: #333333;
  color: #ffffff;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
}
```

- [ ] **Step 2: 動作確認**

出題タブ → 4択クイズ形式で出題 → 選択 → 正誤表示 → 次への動作を確認。

- [ ] **Step 3: コミット**

```bash
git add src/components/MultipleChoice.tsx src/components/MultipleChoice.module.css
git commit -m "feat: add multiple choice quiz component"
```

---

## Task 12: 出題結果画面

**Files:**
- Create: `src/components/QuizResult.tsx`, `src/components/QuizResult.module.css`

- [ ] **Step 1: QuizResult作成**

Create `src/components/QuizResult.tsx`:
```typescript
import type { Term, QuizAnswer } from '../types'
import styles from './QuizResult.module.css'

interface Props {
  answers: QuizAnswer[]
  quizTerms: Term[]
  onRetry: () => void
  onBackToSettings: () => void
}

export function QuizResult({
  answers,
  quizTerms,
  onRetry,
  onBackToSettings,
}: Props) {
  const correctCount = answers.filter(a => a.correct).length
  const totalCount = answers.length
  const rate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

  const missedTerms = answers
    .filter(a => !a.correct)
    .map(a => quizTerms.find(t => t.id === a.termId))
    .filter((t): t is Term => t !== undefined)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>結果</h1>

      <div className={styles.score}>
        <div className={styles.scoreNumber}>
          {correctCount} / {totalCount} 正解
        </div>
        <div className={styles.scoreRate}>正答率 {rate}%</div>
      </div>

      {missedTerms.length > 0 && (
        <div className={styles.missed}>
          <div className={styles.missedTitle}>間違えた問題</div>
          {missedTerms.map(term => (
            <div key={term.id} className={styles.missedItem}>
              {term.name}
            </div>
          ))}
        </div>
      )}

      <div className={styles.buttons}>
        <button className={styles.retryBtn} onClick={onRetry}>
          もう一度
        </button>
        <button className={styles.backBtn} onClick={onBackToSettings}>
          設定に戻る
        </button>
      </div>
    </div>
  )
}
```

Create `src/components/QuizResult.module.css`:
```css
.container {
  text-align: center;
}

.title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 24px;
}

.score {
  margin-bottom: 24px;
}

.scoreNumber {
  font-size: 1.5rem;
  font-weight: 700;
}

.scoreRate {
  font-size: 1rem;
  color: #999999;
  margin-top: 4px;
}

.missed {
  text-align: left;
  margin-bottom: 24px;
}

.missedTitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: #999999;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.missedItem {
  font-size: 0.875rem;
  padding: 6px 0;
}

.missedItem::before {
  content: '\00B7 ';
}

.buttons {
  display: flex;
  gap: 12px;
}

.retryBtn {
  flex: 1;
  padding: 14px;
  background: #333333;
  color: #ffffff;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
}

.backBtn {
  flex: 1;
  padding: 14px;
  background: #f5f5f5;
  color: #333333;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
}
```

- [ ] **Step 2: 動作確認**

出題 → 全問回答後に結果画面が表示され、「もう一度」「設定に戻る」が動作することを確認。

- [ ] **Step 3: コミット**

```bash
git add src/components/QuizResult.tsx src/components/QuizResult.module.css
git commit -m "feat: add quiz result component"
```

---

## Task 13: 進捗画面

**Files:**
- Create: `src/pages/ProgressPage.tsx`, `src/pages/ProgressPage.module.css`

- [ ] **Step 1: ProgressPage作成**

Create `src/pages/ProgressPage.tsx`:
```typescript
import { useMemo } from 'react'
import type { Term, Category, Progress } from '../types'
import styles from './ProgressPage.module.css'

interface Props {
  terms: Term[]
  categories: Category[]
  progress: Progress
  onReset: () => void
}

export function ProgressPage({ terms, categories, progress, onReset }: Props) {
  const studiedCount = Object.keys(progress).length
  const totalCount = terms.length

  const categoryStats = useMemo(() => {
    return categories.map(cat => {
      const catTerms = terms.filter(t => t.majorCategoryId === cat.id)
      let correct = 0
      let total = 0
      for (const t of catTerms) {
        const p = progress[t.id]
        if (p) {
          correct += p.correct
          total += p.total
        }
      }
      const rate = total > 0 ? Math.round((correct / total) * 100) : null
      return { ...cat, rate, studied: catTerms.filter(t => progress[t.id]).length, total: catTerms.length }
    })
  }, [categories, terms, progress])

  const weakTerms = useMemo(() => {
    return terms
      .filter(t => {
        const p = progress[t.id]
        return p && p.total >= 1
      })
      .map(t => {
        const p = progress[t.id]
        return { term: t, rate: Math.round((p.correct / p.total) * 100) }
      })
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 20)
  }, [terms, progress])

  const handleReset = () => {
    if (window.confirm('進捗データをすべてリセットしますか？')) {
      onReset()
    }
  }

  return (
    <div>
      <h1 className={styles.title}>進捗</h1>

      <div className={styles.overall}>
        <div className={styles.overallText}>
          全体: {studiedCount} / {totalCount} 学習済
        </div>
        <div className={styles.bar}>
          <div
            className={styles.barFill}
            style={{ width: `${(studiedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>大分類別</div>
        {categoryStats.map(cat => (
          <div key={cat.id} className={styles.catRow}>
            <div className={styles.catName}>{cat.name}</div>
            <div className={styles.catInfo}>
              {cat.rate !== null ? `${cat.rate}%` : '-'}
              <span className={styles.catCount}>
                ({cat.studied}/{cat.total})
              </span>
            </div>
          </div>
        ))}
      </div>

      {weakTerms.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>苦手用語</div>
          {weakTerms.map(({ term, rate }) => (
            <div key={term.id} className={styles.weakRow}>
              <div className={styles.weakName}>{term.name}</div>
              <div className={styles.weakRate}>{rate}%</div>
            </div>
          ))}
        </div>
      )}

      <button className={styles.resetBtn} onClick={handleReset}>
        進捗リセット
      </button>
    </div>
  )
}
```

Create `src/pages/ProgressPage.module.css`:
```css
.title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.overall {
  margin-bottom: 24px;
}

.overallText {
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.barFill {
  height: 100%;
  background: #333333;
  border-radius: 4px;
  transition: width 0.3s;
}

.section {
  margin-bottom: 24px;
}

.sectionTitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: #999999;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.catRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 0.875rem;
}

.catName {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catInfo {
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

.catCount {
  font-weight: 400;
  color: #999999;
  margin-left: 4px;
  font-size: 0.75rem;
}

.weakRow {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.875rem;
}

.weakName {
  flex: 1;
}

.weakRate {
  color: #f44336;
  font-weight: 600;
}

.resetBtn {
  width: 100%;
  padding: 12px;
  background: #f5f5f5;
  color: #f44336;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-top: 8px;
}
```

- [ ] **Step 2: App.tsxにProgressPageを接続**

プレースホルダーを置き換え:
```typescript
{activeTab === 'progress' && (
  <ProgressPage
    terms={terms}
    categories={categories}
    progress={progress}
    onReset={resetProgress}
  />
)}
```

importも追加:
```typescript
import { ProgressPage } from './pages/ProgressPage'
```

- [ ] **Step 3: 動作確認**

出題で何問か回答した後、進捗タブで大分類別の正答率と苦手用語が表示されることを確認。

- [ ] **Step 4: コミット**

```bash
git add src/pages/ProgressPage.tsx src/pages/ProgressPage.module.css src/App.tsx
git commit -m "feat: add progress page with category stats and weak terms"
```

---

## Task 14: PWA設定

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`

- [ ] **Step 1: PWAアイコン生成**

シンプルなプレースホルダーアイコンを生成する（192x192と512x512のPNG）。

```bash
mkdir -p public/icons
# canvasを使ってシンプルなアイコンを生成するNode.jsスクリプト、
# またはシンプルなSVGからPNG変換
# 最低限、背景色と「IPA」テキストのアイコンで十分
```

アイコン生成にはnpmパッケージ `canvas` やオンラインツールを使う。最小構成ではSVGファビコンで代替可能。

- [ ] **Step 2: vite.config.tsにPWA設定追加**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'IPA単語帳',
        short_name: 'IPA単語帳',
        start_url: '/ipa-words/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png}'],
      },
    }),
  ],
  base: '/ipa-words/',
})
```

- [ ] **Step 3: index.htmlにmeta追加**

```html
<meta name="theme-color" content="#ffffff" />
<link rel="apple-touch-icon" href="/ipa-words/icons/icon-192.png" />
```

- [ ] **Step 4: ビルドしてPWAファイル確認**

```bash
npm run build
ls dist/
```

`sw.js`（Service Worker）と`manifest.webmanifest`が生成されていることを確認。

- [ ] **Step 5: コミット**

```bash
git add vite.config.ts index.html public/icons/
git commit -m "feat: add PWA support with service worker and manifest"
```

---

## Task 15: GitHub Actions デプロイ設定

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: GitHub Actionsワークフロー作成**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build

      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: コミット**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow for GitHub Pages deployment"
```

---

## Task 16: 最終確認・クリーンアップ

- [ ] **Step 1: フルビルド確認**

```bash
npm run build
```

エラーなくビルドが完了することを確認。

- [ ] **Step 2: プレビュー確認**

```bash
npm run preview
```

`http://localhost:4173/ipa-words/` で全画面動作確認:
- 一覧: フィルタ、検索、カード展開
- 出題: フラッシュカード、4択、結果表示
- 進捗: 正答率表示、苦手用語、リセット

- [ ] **Step 3: 不要ファイル整理**

Viteテンプレートの残骸（不要なCSS等）が残っていれば削除。

- [ ] **Step 4: 最終コミット**

```bash
git add -A
git commit -m "chore: final cleanup and build verification"
```
