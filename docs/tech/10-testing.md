# テスト

## テストフレームワーク比較

Java 経験者向けに、馴染みのあるフレームワークとの対比を示す。

| 用途 | Java | JavaScript / React |
|------|------|--------------------|
| ユニット / コンポーネントテスト | JUnit 5 + Mockito | **Vitest** + React Testing Library |
| E2E テスト | Selenium | **Playwright** / Cypress |
| アサーション | AssertJ / JUnit Assertions | Vitest built-in (`expect`) |
| モック | Mockito | `vi.fn()` / `vi.mock()` |
| テストランナー | Maven Surefire / Gradle Test | `vitest` / `vitest run` |

### 主な違い

- JUnit はクラス単位でテストを書くが、Vitest は **`describe` / `it` / `test` 関数** を使う
- Selenium は実際のブラウザを操作する E2E ツール。Playwright も同様だが、API が直感的でより高速
- React コンポーネントのテストには **React Testing Library（RTL）** を使う。DOM をユーザー視点でテストするのが思想

---

## Vitest のセットアップ

### インストール

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

### vite.config.ts に追記

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,           // describe, it, expect をインポートなしで使える
    environment: 'jsdom',    // ブラウザ環境をシミュレート
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

### セットアップファイル（src/test/setup.ts）

```ts
import '@testing-library/jest-dom'
// toBeInTheDocument() など RTL のカスタムマッチャーを有効化
```

### package.json にスクリプト追加

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### テストファイルの配置

```
src/
  components/
    WordCard.tsx
    WordCard.test.tsx   ← コンポーネントと同じディレクトリに置く
  hooks/
    useFilter.ts
    useFilter.test.ts
```

---

## React Testing Library（RTL）

### 基本 API

| API | 役割 | JUnit との対比 |
|-----|------|----------------|
| `render(<Component />)` | コンポーネントを DOM にレンダリング | テストメソッド内でオブジェクト生成するイメージ |
| `screen.getByText('...')` | テキストで要素を取得 | DAO で DB から取得するイメージ |
| `screen.getByRole('button')` | ARIA ロールで要素を取得 | アクセシビリティに優しい取得方法 |
| `fireEvent.click(element)` | クリックイベントを発火 | メソッド呼び出し |
| `waitFor(() => ...)` | 非同期処理を待つ | `Thread.sleep()` の代わり（ただしポーリング） |
| `expect(element).toBeInTheDocument()` | DOM に存在するか検証 | `assertEquals()` |

### screen のクエリ一覧

```
getBy...    → 見つからないとエラー（同期）
queryBy...  → 見つからないと null を返す（存在しないことを確認するときに使う）
findBy...   → 非同期で待つ（Promise を返す）
```

### JUnit のアサーションと対比

```java
// JUnit 5
assertEquals("apple", word.getText());
assertTrue(button.isDisplayed());
assertFalse(element.isHidden());
```

```ts
// Vitest + RTL
expect(screen.getByText('apple')).toBeInTheDocument()
expect(button).toBeVisible()
expect(element).not.toBeVisible()
```

---

## テストの種類

### 1. ユニットテスト（hooks のテスト例）

`useFilter` フックのテスト。React コンポーネントを使わず、ロジックだけ検証する。

```ts
// src/hooks/useFilter.test.ts
import { renderHook, act } from '@testing-library/react'
import { useFilter } from './useFilter'

const mockTerms = [
  { id: 1, word: 'algorithm', category: 'technology', difficulty: 'basic' },
  { id: 2, word: 'database', category: 'technology', difficulty: 'advanced' },
  { id: 3, word: 'firewall', category: 'security', difficulty: 'basic' },
]

describe('useFilter', () => {
  it('初期状態ではすべての単語を返す', () => {
    const { result } = renderHook(() => useFilter(mockTerms))
    expect(result.current.filtered).toHaveLength(3)
  })

  it('カテゴリでフィルタリングできる', () => {
    const { result } = renderHook(() => useFilter(mockTerms))

    act(() => {
      result.current.setCategory('security')
    })

    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].word).toBe('firewall')
  })

  it('検索キーワードで絞り込める', () => {
    const { result } = renderHook(() => useFilter(mockTerms))

    act(() => {
      result.current.setQuery('data')
    })

    expect(result.current.filtered).toHaveLength(1)
    expect(result.current.filtered[0].word).toBe('database')
  })
})
```

**ポイント:**
- `renderHook` でフックを単体でレンダリングする
- state 変更は必ず `act()` で囲む（React の state 更新をフラッシュさせる）

---

### 2. コンポーネントテスト（WordCard のテスト例）

```tsx
// src/components/WordCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { WordCard } from './WordCard'

const mockWord = {
  id: 1,
  word: 'algorithm',
  reading: 'アルゴリズム',
  definition: '問題を解くための手順の集合',
  category: 'technology',
  difficulty: 'basic',
}

describe('WordCard', () => {
  it('単語名が表示される', () => {
    render(<WordCard term={mockWord} />)
    expect(screen.getByText('algorithm')).toBeInTheDocument()
  })

  it('初期状態では定義が非表示', () => {
    render(<WordCard term={mockWord} />)
    expect(screen.queryByText('問題を解くための手順の集合')).not.toBeInTheDocument()
  })

  it('クリックすると定義が表示される', () => {
    render(<WordCard term={mockWord} />)

    fireEvent.click(screen.getByRole('button', { name: /詳細を見る/ }))

    expect(screen.getByText('問題を解くための手順の集合')).toBeInTheDocument()
  })

  it('カテゴリバッジが表示される', () => {
    render(<WordCard term={mockWord} />)
    expect(screen.getByText('technology')).toBeInTheDocument()
  })
})
```

**ポイント:**
- `getByRole` はアクセシビリティロール（button, heading, link など）で要素を取得する。HTML タグよりも意図が明確
- `queryByText` は要素が**存在しないこと**を確認するときに使う（`getByText` だと要素がなければエラーになる）

---

### 3. E2E テスト（概要のみ）

ブラウザを実際に操作してアプリ全体の動作を確認する。

**Playwright の例（参考）:**

```ts
// tests/e2e/search.spec.ts
import { test, expect } from '@playwright/test'

test('単語を検索できる', async ({ page }) => {
  await page.goto('http://localhost:5173')

  await page.getByPlaceholder('検索...').fill('algorithm')

  await expect(page.getByText('algorithm')).toBeVisible()
  await expect(page.getByText('database')).not.toBeVisible()
})
```

E2E テストはセットアップが重く、実行も遅い。CI で毎回回すよりも、重要なフローに絞って使うのが現実的。

---

## モック（vi.fn と Mockito の対比）

### Mockito（Java）

```java
// Mockito
UserRepository mockRepo = mock(UserRepository.class);
when(mockRepo.findById(1L)).thenReturn(Optional.of(new User("Alice")));

verify(mockRepo, times(1)).findById(1L);
```

### vi.fn()（Vitest）

```ts
// Vitest
const mockOnClick = vi.fn()

render(<WordCard term={mockWord} onFavorite={mockOnClick} />)
fireEvent.click(screen.getByRole('button', { name: /お気に入り/ }))

expect(mockOnClick).toHaveBeenCalledTimes(1)
expect(mockOnClick).toHaveBeenCalledWith(mockWord.id)
```

### モジュール全体をモック（vi.mock）

```ts
// localStorage をモック
vi.mock('../utils/storage', () => ({
  loadProgress: vi.fn(() => ({})),
  saveProgress: vi.fn(),
}))
```

---

## テスト実行コマンド

```bash
# ウォッチモード（開発中はこれ）
npm test

# 一度だけ実行（CI 向け）
npm run test:run

# 特定ファイルだけ実行
npx vitest run src/hooks/useFilter.test.ts

# テスト名でフィルタ
npx vitest run -t "カテゴリでフィルタリング"

# カバレッジ計測
npm run test:coverage
```

---

## カバレッジ

```bash
npm install -D @vitest/coverage-v8
npm run test:coverage
```

`vite.config.ts` に追記：

```ts
test: {
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],  // text: ターミナル出力、html: ブラウザで見られるレポート
    include: ['src/**/*.{ts,tsx}'],
    exclude: ['src/main.tsx', 'src/types/**'],
    thresholds: {
      lines: 80,      // 行カバレッジ 80% 未満だと失敗
      functions: 80,
    },
  },
},
```

実行後、`coverage/index.html` をブラウザで開くと視覚的なレポートを確認できる。

---

## TDD の流れ（Red → Green → Refactor）

Java の JUnit でも同じ考え方だが、フロントエンドでも有効。

```
Red    → まずテストを書く（この時点では必ずテストが失敗する）
Green  → テストを通す最小限の実装を書く
Refactor → テストが通ったままコードをきれいにする
```

### 実例: `useFilter` の検索機能を TDD で作る

**Step 1: Red（テストを書く）**

```ts
it('大文字小文字を区別せずに検索できる', () => {
  const { result } = renderHook(() => useFilter(mockTerms))

  act(() => {
    result.current.setQuery('ALGO')
  })

  expect(result.current.filtered).toHaveLength(1)
  expect(result.current.filtered[0].word).toBe('algorithm')
})
// → この時点ではテストが失敗する（Red）
```

**Step 2: Green（最小限の実装）**

```ts
// useFilter.ts
const filtered = terms.filter(term =>
  term.word.toLowerCase().includes(query.toLowerCase())
)
// → テストが通る（Green）
```

**Step 3: Refactor（整理）**

```ts
// 正規化処理を共通化
const normalize = (s: string) => s.toLowerCase().trim()
const filtered = terms.filter(term =>
  normalize(term.word).includes(normalize(query))
)
// → テストは依然として通る
```

TDD の最大の利点は「テストが仕様書になる」こと。コードを書く前に「何を実現したいか」を言語化するため、設計が自然と明確になる。
