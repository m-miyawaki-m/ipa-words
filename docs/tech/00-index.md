# 技術資料 目次

Java/jQueryエンジニアがReact + TypeScript + PWA開発を理解・保守するための技術ドキュメント集。

## 概念・パラダイム比較

| # | ファイル | 内容 | 対象レベル |
|---|---------|------|-----------|
| 01 | [jQuery → React 概念比較](01-jquery-to-react.md) | DOM操作、イベント、Ajax等の対比 | 入門 |
| 02 | [Java → TypeScript 型システム比較](02-java-to-typescript.md) | 型、interface、generics等の対比 | 入門 |
| 06 | [Kotlinアプリとの比較](06-kotlin-comparison.md) | Compose vs JSX、ViewModel vs Hooks等 | 入門〜中級 |

## 言語・フレームワーク詳細

| # | ファイル | 内容 | 対象レベル |
|---|---------|------|-----------|
| 13 | [TypeScript 詳細文法ガイド](13-typescript-deep-dive.md) | 型システム、ジェネリクス、非同期処理等の網羅的解説 | 入門〜中級 |
| 14 | [React 詳細ガイド](14-react-deep-dive.md) | 思想、Hooks、状態管理、パフォーマンス最適化 | 入門〜中級 |
| 03 | [React基礎ガイド](03-react-basics.md) | コンポーネント、JSX、Hooks概要 | 入門 |

## プラットフォーム・技術選定

| # | ファイル | 内容 | 対象レベル |
|---|---------|------|-----------|
| 04 | [プラットフォーム比較](04-platform-comparison.md) | React / React Native / PWA / Kotlin / Swift / Flutter | 入門 |
| 05 | [PWA詳解](05-pwa-guide.md) | Service Worker、Manifest、キャッシュ戦略 | 中級 |

## 開発環境・プロジェクト

| # | ファイル | 内容 | 対象レベル |
|---|---------|------|-----------|
| 07 | [開発環境・ツールチェーン](07-dev-environment.md) | VSCode、Node.js/npm、Vite、ESLint | 入門 |
| 08 | [本プロジェクトのアーキテクチャ](08-project-architecture.md) | ディレクトリ構成、データフロー、Hooks設計 | 中級 |

## 品質・運用

| # | ファイル | 内容 | 対象レベル |
|---|---------|------|-----------|
| 09 | [デバッグ手法](09-debugging.md) | Chrome DevTools、React DevTools、エラー対処 | 入門〜中級 |
| 10 | [テスト](10-testing.md) | Vitest、React Testing Library、TDD | 中級 |
| 11 | [デプロイ・CI/CD](11-deploy-ci.md) | GitHub Actions、GitHub Pages | 中級 |
| 12 | [よくあるハマりポイント集](12-common-pitfalls.md) | React/TypeScript/ビルド環境の落とし穴 | 入門〜中級 |

## 読み順の推奨

### はじめて学ぶ場合
1. 01 → 02（既知技術との対比で全体像を掴む）
2. 13 → 14（TypeScript → React の順で言語を学ぶ）
3. 07（開発環境のセットアップ）
4. 08（本プロジェクトの構造理解）
5. 12（ハマりポイントを事前に把握）

### 保守・改修を担当する場合
1. 08（プロジェクト構造の把握）
2. 03 または 14（React の基礎確認）
3. 09（デバッグ手法）
4. 12（よくあるハマりポイント）

### 技術選定の検討
1. 04（プラットフォーム比較）
2. 05（PWA詳解）
3. 06（Kotlinとの比較）
