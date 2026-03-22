# 基本設計書: IPA単語帳アプリ

## 1. 技術スタック

| 項目 | 技術 |
|---|---|
| フレームワーク | React 18 + TypeScript |
| ビルドツール | Vite |
| PWA | vite-plugin-pwa |
| スタイリング | CSS Modules |
| ホスティング | GitHub Pages |
| データ永続化 | localStorage |
| デプロイ | GitHub Actions |

## 2. ディレクトリ構成

```
ipa-words/
├── docs/                    # ドキュメント
├── input/                   # 入力データ
│   └── ap-shiken-pages.txt
├── output/                  # スクレイピング出力
│   └── ap-shiken-terms.csv
├── public/
│   ├── icons/               # PWAアイコン
│   └── data/
│       └── terms.json       # ビルド用語データ
├── src/
│   ├── components/          # UIコンポーネント
│   ├── hooks/               # カスタムフック
│   ├── pages/               # 画面コンポーネント
│   ├── types/               # 型定義
│   ├── utils/               # ユーティリティ
│   ├── App.tsx
│   └── main.tsx
├── scripts/
│   └── csv-to-json.ts       # CSV→JSON変換スクリプト
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 3. 画面設計

### 3.1 画面遷移

```
[タブナビゲーション（画面下部）]
├── 一覧タブ ─── 単語一覧画面
├── 出題タブ ─── 出題設定画面 → 出題画面 → 結果画面
└── 進捗タブ ─── 進捗画面
```

### 3.2 単語一覧画面

```
┌──────────────────────┐
│ IPA単語帳             │
├──────────────────────┤
│ [大分類 ▼] [中分類 ▼]│
│ [🔍 検索...         ]│
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ 基数         80% │ │
│ │ きすう / Radix   │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ 2の補数          │ │
│ │ にのほすう       │ │
│ │                  │ │
│ │ (タップで意味表示)│ │
│ └──────────────────┘ │
│         ...          │
├──────────────────────┤
│ [一覧] [出題] [進捗] │
└──────────────────────┘
```

- ジャンルフィルタ: 大分類選択 → 中分類の選択肢が連動
- 検索: 用語名・読み・英語を対象にインクリメンタルサーチ
- カードタップで説明文を展開/折りたたみ
- 5,488語の表示は仮想スクロール（react-window）で対応

### 3.3 出題設定画面

```
┌──────────────────────┐
│ 出題設定              │
├──────────────────────┤
│ ジャンル              │
│ [大分類 ▼] [中分類 ▼]│
│                      │
│ 出題方向              │
│ ○ 用語 → 意味       │
│ ○ 意味 → 用語       │
│                      │
│ 出題形式              │
│ ○ フラッシュカード   │
│ ○ 4択クイズ         │
│                      │
│ 出題数               │
│ ○ 10  ○ 20  ○ 50   │
│ ○ 全問              │
│                      │
│ [出題開始]            │
├──────────────────────┤
│ [一覧] [出題] [進捗] │
└──────────────────────┘
```

### 3.4 出題画面 - フラッシュカード型

```
┌──────────────────────┐
│ 3 / 10               │
├──────────────────────┤
│                      │
│                      │
│       基数           │
│                      │
│   (タップで表示)      │
│                      │
│                      │
├──────────────────────┤
│ ← まだ    覚えた → │
├──────────────────────┤
│ [一覧] [出題] [進捗] │
└──────────────────────┘
```

解答表示後:

```
┌──────────────────────┐
│ 3 / 10               │
├──────────────────────┤
│       基数           │
│ きすう / Radix       │
│──────────────────────│
│ 数を表現する際の     │
│ 「基」となる数を     │
│ 指す。...            │
├──────────────────────┤
│ ← まだ    覚えた → │
├──────────────────────┤
│ [一覧] [出題] [進捗] │
└──────────────────────┘
```

### 3.5 出題画面 - 4択クイズ型

```
┌──────────────────────┐
│ 3 / 10               │
├──────────────────────┤
│                      │
│       基数           │
│                      │
│ ┌──────────────────┐ │
│ │ A) 数を表現す... │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ B) 整数を2進...  │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ C) 小数部分と... │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ D) 数値をコン... │ │
│ └──────────────────┘ │
├──────────────────────┤
│ [一覧] [出題] [進捗] │
└──────────────────────┘
```

- 不正解の選択肢は同じ中分類から優先的に選出
- 正解後: 正解選択肢を緑、不正解なら赤+正解を緑で表示
- 「次へ」ボタンで次の問題に進む

### 3.6 結果画面

```
┌──────────────────────┐
│ 結果                  │
├──────────────────────┤
│                      │
│     8 / 10 正解      │
│      正答率 80%      │
│                      │
│ ── 間違えた問題 ──   │
│ ・2の補数            │
│ ・固定小数点数       │
│                      │
│ [もう一度] [設定に戻る]│
├──────────────────────┤
│ [一覧] [出題] [進捗] │
└──────────────────────┘
```

### 3.7 進捗画面

```
┌──────────────────────┐
│ 進捗                  │
├──────────────────────┤
│ 全体: 234/5488 学習済│
│ ██████░░░░░░░░░ 4.3% │
│                      │
│ ── 大分類別 ──       │
│ 1 基礎理論    80% ██ │
│ 2 アルゴリズム 60% █ │
│ ...                  │
│                      │
│ ── 苦手用語 ──       │
│ 1. MTBF       20%   │
│ 2. RASIS      25%   │
│ ...                  │
│                      │
│ [進捗リセット]        │
├──────────────────────┤
│ [一覧] [出題] [進捗] │
└──────────────────────┘
```

## 4. データ設計

### 4.1 用語データ（terms.json）

CSVから変換して `public/data/terms.json` に配置する。

```typescript
// 型定義
interface Term {
  id: number;              // 連番ID
  url: string;             // 取得元URL
  majorCategoryId: string; // 大分類番号 (例: "1")
  minorCategoryId: string; // 中分類番号 (例: "1-1")
  name: string;            // 用語名
  reading: string;         // 読み
  english: string;         // 英語
  category: string;        // カテゴリ名 (例: "1 基礎理論")
  subcategory: string;     // サブカテゴリ名 (例: "1-1 離散数学")
  description: string;     // 説明
}
```

### 4.2 進捗データ（localStorage）

```typescript
interface Progress {
  [termId: number]: {
    correct: number;  // 正答数
    total: number;    // 出題数
  };
}

// localStorageキー: "ipa-words-progress"
```

### 4.3 カテゴリマスタ

用語データから動的に生成する（別ファイル不要）。

```typescript
interface Category {
  id: string;          // 大分類番号
  name: string;        // カテゴリ名
  subcategories: {
    id: string;        // 中分類番号
    name: string;      // サブカテゴリ名
  }[];
}
```

## 5. コンポーネント設計

### 5.1 コンポーネントツリー

```
App
├── TabNavigation
├── WordListPage
│   ├── CategoryFilter
│   │   ├── MajorCategorySelect
│   │   └── MinorCategorySelect
│   ├── SearchBar
│   └── WordCardList (react-window)
│       └── WordCard
│           └── WordDescription (展開時)
├── QuizPage
│   ├── QuizSettings
│   │   ├── CategoryFilter
│   │   ├── DirectionSelect
│   │   ├── FormatSelect
│   │   └── CountSelect
│   ├── FlashCard
│   │   └── FlashCardAnswer
│   ├── MultipleChoice
│   │   └── ChoiceButton
│   └── QuizResult
│       └── MissedWordList
└── ProgressPage
    ├── OverallProgress
    ├── CategoryProgressList
    │   └── CategoryProgressBar
    └── WeakWordList
```

### 5.2 主要コンポーネント仕様

#### TabNavigation

| props | 型 | 説明 |
|---|---|---|
| activeTab | "list" \| "quiz" \| "progress" | 現在のタブ |
| onTabChange | (tab) => void | タブ切り替え |

#### WordCard

| props | 型 | 説明 |
|---|---|---|
| term | Term | 用語データ |
| progress | { correct, total } \| null | 正答率 |
| isExpanded | boolean | 説明文表示状態 |
| onToggle | () => void | 展開切り替え |

#### FlashCard

| props | 型 | 説明 |
|---|---|---|
| term | Term | 出題する用語 |
| direction | "term-to-meaning" \| "meaning-to-term" | 出題方向 |
| onAnswer | (correct: boolean) => void | 回答コールバック |

#### MultipleChoice

| props | 型 | 説明 |
|---|---|---|
| term | Term | 正解の用語 |
| choices | Term[] | 選択肢（4つ、正解含む） |
| direction | "term-to-meaning" \| "meaning-to-term" | 出題方向 |
| onAnswer | (correct: boolean) => void | 回答コールバック |

## 6. カスタムフック

| フック | 役割 |
|---|---|
| useTerms() | terms.jsonの読み込み・カテゴリ生成 |
| useFilter(terms) | ジャンルフィルタ・検索の状態管理 |
| useProgress() | localStorage進捗データの読み書き |
| useQuiz(terms, settings) | 出題ロジック（ランダム選出・選択肢生成・状態管理） |

## 7. PWA設定

### 7.1 manifest.json（vite-plugin-pwaで生成）

```json
{
  "name": "IPA単語帳",
  "short_name": "IPA単語帳",
  "start_url": "/ipa-words/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 7.2 Service Worker戦略

- **precache**: アプリシェル（HTML/CSS/JS）+ terms.json
- キャッシュファーストでオフライン対応

## 8. ビルド・デプロイ

### 8.1 CSVからJSONへの変換

`scripts/csv-to-json.ts` でCSVを読み込み、`public/data/terms.json` に出力する。ビルド前に手動実行。

### 8.2 GitHub Actionsデプロイ

mainブランチへのpush時に自動で:
1. `npm run build`
2. `dist/` をGitHub Pagesにデプロイ

### 8.3 ベースパス

GitHub Pages用に `vite.config.ts` で `base: "/ipa-words/"` を設定。

## 9. パフォーマンス対策

| 課題 | 対策 |
|---|---|
| 5,488語の一覧描画 | react-window による仮想スクロール |
| 検索のレスポンス | デバウンス（300ms）で入力中の再描画抑制 |
| 初回読み込み | terms.jsonをprecacheし2回目以降はキャッシュから |
