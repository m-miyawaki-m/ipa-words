# プラットフォーム比較（React / React Native / PWA / Ionic / Kotlin / Swift / Flutter）

## 概要

モバイル・Web アプリを開発する際、どのプラットフォーム・技術スタックを選ぶかは、要件・チーム構成・予算・納期に大きく影響する。本ドキュメントでは主要な 7 つの選択肢を多角的に比較する。

---

## 1. 技術スタック一覧

| 技術 | 種別 | 提供元 | ライセンス |
|------|------|--------|-----------|
| React (Web) | Webアプリフレームワーク | Meta | MIT |
| React Native | クロスプラットフォームモバイル | Meta | MIT |
| PWA | Web標準仕様 | W3C / ブラウザベンダー | — |
| **Ionic + Capacitor** | ハイブリッドアプリ | Ionic (Drifty社) | MIT |
| Kotlin (Android) | ネイティブAndroid | JetBrains / Google | Apache 2.0 |
| Swift (iOS) | ネイティブiOS | Apple | Apache 2.0 |
| Flutter | クロスプラットフォームUI | Google | BSD |

---

## 2. 総合比較表

| 比較軸 | React (Web) | React Native | PWA | Ionic + Capacitor | Kotlin (Android) | Swift (iOS) | Flutter |
|--------|------------|--------------|-----|-------------------|------------------|-------------|---------|
| **対応プラットフォーム** | ブラウザ全般 | iOS / Android / Web | ブラウザ全般（インストール可） | iOS / Android / Web | Android のみ | iOS / macOS のみ | iOS / Android / Web / Desktop |
| **言語** | JS / TS | JS / TS | JS / TS | JS / TS | Kotlin | Swift | Dart |
| **UI構築方法** | HTML + CSS + JSX | React コンポーネント（ネイティブUIにマップ） | HTML + CSS + JSX | Ionic UIコンポーネント + HTML/CSS | Jetpack Compose / XML | SwiftUI / UIKit | Flutter Widget（独自描画） |
| **UIの実体** | ブラウザDOM | ネイティブUI | ブラウザDOM | WebView内のDOM | ネイティブUI | ネイティブUI | 独自GPUレンダリング |
| **デバイスAPIアクセス** | 制限あり（ブラウザ経由） | 豊富（ライブラリ経由） | 中程度（Web API） | **豊富（Capacitorプラグイン）** | 完全アクセス | 完全アクセス | 豊富（プラグイン経由） |
| **カメラ** | getUserMedia | react-native-camera | MediaDevices API | @capacitor/camera | CameraX | AVFoundation | camera プラグイン |
| **GPS** | Geolocation API | react-native-geolocation | Geolocation API | @capacitor/geolocation | FusedLocationProvider | CoreLocation | geolocator |
| **プッシュ通知** | Web Push（iOS制限あり） | FCM / APNs | Web Push（iOS 16.4+） | @capacitor/push-notifications | FCM | APNs | firebase_messaging |
| **オフライン対応** | Service Worker | AsyncStorage等 | Service Worker | Service Worker + Capacitor Storage | Room / WorkManager | Core Data | Hive / SQLite |
| **配布方法** | Web | App Store / Google Play | Web（＋ホーム画面追加） | **Web + App Store + Google Play** | Google Play | App Store | App Store / Google Play / Web |
| **ストア審査** | 不要 | 必要 | 不要 | Web不要 / ストア配布時は必要 | 必要 | 必要 | 必要 |
| **パフォーマンス** | 良 | ネイティブに近い | Webと同等 | Webと同等（WebView内） | ネイティブ最高 | ネイティブ最高 | ネイティブに近い |
| **1チームで複数OS対応** | はい（Webのみ） | はい（iOS+Android） | はい（Webのみ） | **はい（Web+iOS+Android）** | いいえ | いいえ | はい（iOS+Android+Web+Desktop） |
| **開発コスト（初期）** | 低〜中 | 中 | 低 | **低（Web知識で全プラットフォーム）** | 中〜高 | 中〜高 | 中 |
| **保守コスト** | 低 | 中（RN バージョン追随） | 低 | 低〜中 | 中 | 中 | 中 |
| **学習コスト（Java/jQuery経験者）** | 低〜中 | 中 | 低 | **低（HTML/CSS/JSの延長）** | 低（Java→Kotlin） | 高 | 高（Dart） |
| **エコシステム成熟度** | 非常に成熟 | 成熟 | 成熟 | 成熟（2013年〜） | 成熟 | 成熟 | 成長中 |
| **採用・求人市場** | 非常に多い | 多い | 少なめ | 中程度 | 多い | 多い | 増加中 |

---

## 3. デバイスAPI 詳細比較

### ブラウザ/PWA で利用できる主要 Web API

| API | Chrome(Desktop) | Chrome(Android) | Safari(iOS) | 備考 |
|-----|----------------|----------------|-------------|------|
| カメラ (getUserMedia) | ✅ | ✅ | ✅ | iOS 14.3+ |
| GPS (Geolocation) | ✅ | ✅ | ✅ | HTTPS必須 |
| プッシュ通知 | ✅ | ✅ | ✅ | iOS 16.4+、ホーム画面追加必要 |
| バックグラウンド同期 | ✅ | ✅ | ❌ | iOS 未対応 |
| Web Bluetooth | ✅ | ✅ | ❌ | iOS 未対応 |
| Web NFC | ❌ | ✅ | ❌ | Android Chrome のみ |
| 加速度センサー | ✅ | ✅ | ✅ | iOS は許可ダイアログあり |
| ファイルシステムアクセス | ✅ | ✅ | 部分的 | iOS 制限あり |
| 音声認識 (Web Speech) | ✅ | ✅ | ✅ | |
| オフラインキャッシュ | ✅ | ✅ | ✅ | Service Worker 経由 |

---

## 4. パフォーマンス比較

```
ネイティブ最高    Kotlin / Swift
                  ↑ 差は小さくなっている
ネイティブ相当    Flutter（独自GPU描画）
                  ↑ JSブリッジのオーバーヘッドなし
ネイティブ近い    React Native（UI はネイティブ）
                  ↑ JSブリッジのオーバーヘッドあり
Webと同等         React Web / PWA / Ionic（WebView内）
                  ↑ ブラウザエンジンの制約内
```

**重要な観点：** ほとんどのビジネスアプリ（単語帳、在庫管理、社内ツール等）ではパフォーマンス差はユーザーが体感できないレベルにある。ゲーム・AR・動画編集など高負荷処理が必要な場合のみネイティブを真剣に検討する必要がある。

---

## 5. 学習コスト詳細（Java/jQuery 経験者視点）

### React / PWA への移行パス（推奨：最短）
```
Java/jQuery 経験者
  → JavaScript (ES2015+) の理解を深める     [1〜2週間]
  → TypeScript の基礎を学ぶ                  [1週間]
  → React の基本概念（コンポーネント、状態）  [2〜3週間]
  → PWA の概念（Service Worker等）           [1週間]
  合計: 約 1〜2ヶ月で実用的なアプリ開発可能
```

### Kotlin (Android) への移行パス（Java開発者は有利）
```
Java 経験者
  → Kotlin 文法の習得（Java との差分）        [1〜2週間]
  → Android SDK の基礎                        [2〜4週間]
  → Jetpack Compose または XML Layout         [2〜3週間]
  → Android のライフサイクル理解              [1〜2週間]
  合計: 約 1.5〜3ヶ月で実用的なアプリ開発可能
```

### Ionic + Capacitor への移行パス（推奨：Web知識を活用してストア配布）
```
Java/jQuery 経験者
  → JavaScript (ES2015+) / TypeScript         [1〜2週間]
  → React / Angular / Vue いずれかの基礎       [2〜3週間]
  → Ionic UIコンポーネントの理解               [1週間]
  → Capacitor（ネイティブ機能アクセス）         [1週間]
  合計: 約 1.5〜2ヶ月で iOS/Android/Web 対応アプリ開発可能
```

> **PWA との違い:** Ionic + Capacitor は Web 技術で作ったアプリを**ネイティブコンテナ（WebView）でラップ**し、App Store / Google Play に配布できる。PWA ではアクセスできないネイティブ API（Bluetooth、NFC、生体認証等）も Capacitor プラグインで利用可能。

### Flutter への移行パス（難易度：高）
```
任意の経験者
  → Dart 言語の習得                           [2〜3週間]
  → Flutter Widget の概念                     [2〜3週間]
  → 状態管理（Provider/Riverpod等）           [2〜3週間]
  → プラットフォーム固有の対応               [2〜4週間]
  合計: 約 2〜4ヶ月
```

---

## 6. 選択判断フロー

### ステップ 1: ターゲットプラットフォームを確認する

```
Q1: iOS と Android の両方に対応する必要があるか？
│
├─ NO → Q2へ
│
└─ YES → Q3へ

Q2: どちらか一方のみ？
├─ Android のみ → Kotlin を検討（ネイティブ最適）
└─ iOS のみ → Swift を検討（ネイティブ最適）
              ※ ただし Web でもよいなら React/PWA も可

Q3: 両OS対応が必要。チームは1つか？
├─ YES（1チームで開発）→ Q4へ
└─ NO（iOS/Androidチームが別） → それぞれKotlin/Swiftでネイティブ開発
```

### ステップ 2: 要件の優先度を確認する

```
Q4: ストア配布（App Store / Google Play）が必須か？
├─ YES → Q5へ
└─ NO（Web配布で十分）→ React + PWA を強く推奨

Q5: 端末固有のAPI（Bluetooth / NFC / AR等）を多用するか？
├─ YES（高度なAPI）→ React Native または Flutter を検討
├─ 中程度（カメラ・GPS・通知等）→ Ionic + Capacitor を検討（Q6へ）
└─ NO（Web APIで十分）→ PWA でも対応可能

Q6: チームの主な技術スタックは？
├─ HTML/CSS/JavaScript → Ionic + Capacitor（Web知識をそのまま活用）
├─ JavaScript / TypeScript（React経験あり）→ React Native
├─ Java/Kotlin → Kotlin（Android）または Flutter
└─ Swift → Swift（iOS）
```

### ステップ 3: 最終判断マトリクス

| シナリオ | 推奨技術 | 理由 |
|---------|---------|------|
| 社内Web ツール | React + PWA | コスト最小、配布が簡単 |
| 個人学習アプリ（Web主体） | React + PWA | 本プロジェクト相当 |
| **Web + ストア配布の両方が必要** | **Ionic + Capacitor** | **1つのコードで Web/iOS/Android 対応** |
| **PWAでは足りないネイティブ機能が必要** | **Ionic + Capacitor** | **Web知識でネイティブAPI利用可** |
| 消費者向けiOS/Androidアプリ | Flutter | 1チームで両OS対応、高品質UI |
| Androidのみ、デバイスAPI多用 | Kotlin | ネイティブ最適 |
| iOSのみ、デバイスAPI多用 | Swift | ネイティブ最適 |
| iOS/Android + 高度なネイティブ機能 | React Native | JSエンジニアが多い場合 |
| ゲーム / AR | Unity / ネイティブ | 上記選択肢外 |

---

## 7. コスト試算（参考）

単純なCRUDアプリ（例：単語帳）を1人のエンジニアが作る場合の目安工数：

| 技術 | 初期開発 | iOS対応 | Android対応 | Web対応 | 合計 |
|------|---------|---------|------------|---------|------|
| React + PWA | 2週間 | - (Web共通) | - (Web共通) | 含む | 2週間 |
| **Ionic + Capacitor** | **2.5週間** | **含む** | **含む** | **含む** | **2.5週間** |
| React Native | 3週間 | 含む | 含む | 追加対応要 | 3〜4週間 |
| Flutter | 3週間 | 含む | 含む | 追加対応要 | 3〜4週間 |
| Kotlin | 2週間 | 不可 | 含む | 不可 | 2週間 |
| Kotlin + Swift | 2週間 | 2週間 | 含む | 不可 | 4週間 |

---

## 8. Ionic + Capacitor 詳解

### Ionic とは

Ionic は **Web 技術（HTML/CSS/JavaScript）でモバイルアプリを構築するフレームワーク**。2013年にリリースされ、現在も活発に開発されている（Ionic 8、2024年リリース）。

**主要コンポーネント:**

| コンポーネント | 役割 | ライセンス |
|--------------|------|-----------|
| **Ionic Framework** | UIコンポーネントライブラリ（ボタン、リスト、モーダル等） | MIT（無料） |
| **Capacitor** | ネイティブランタイム（WebViewラッパー + ネイティブAPI橋渡し） | MIT（無料） |
| Appflow（有料） | CI/CD、ライブアップデート、クラウドビルド | 月額課金 |
| Enterprise SDK（有料） | プレミアムプラグイン（生体認証、セキュアストレージ等） | 商用ライセンス |

> **商用利用:** Ionic Framework + Capacitor は MIT ライセンスで完全無料。Appflow や Enterprise SDK は有料だが**なくてもアプリ開発・ストア配布は可能**。

### Ionic の仕組み

```
┌─────────────────────────────────┐
│         ネイティブコンテナ          │
│  ┌───────────────────────────┐  │
│  │        WebView            │  │
│  │  ┌───────────────────┐    │  │
│  │  │   Ionic UI        │    │  │
│  │  │   + React/Angular │    │  │
│  │  │   + アプリコード    │    │  │
│  │  └───────────────────┘    │  │
│  └───────────────────────────┘  │
│         Capacitor Bridge         │
│  ┌───────────────────────────┐  │
│  │    ネイティブAPI           │  │
│  │  カメラ / GPS / 通知 etc   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

- アプリのUIは **WebView 内で動作**（ブラウザと同じ描画エンジン）
- ネイティブ機能は **Capacitor** 経由で呼び出し
- React / Angular / Vue のいずれかをUIフレームワークとして選択可能

### PWA vs Ionic + Capacitor

| 比較軸 | PWA | Ionic + Capacitor |
|--------|-----|-------------------|
| ストア配布 | 不可 | **App Store / Google Play に配布可能** |
| ネイティブAPI | ブラウザAPIの範囲内 | **Capacitorプラグインで全API利用可** |
| Bluetooth / NFC | Chrome Androidのみ | **iOS/Android両対応** |
| 生体認証 | Web Authentication API（制限あり） | **@capacitor/biometrics** |
| ファイルシステム | 制限あり | **@capacitor/filesystem**（フルアクセス） |
| バックグラウンド処理 | 制限あり | **ネイティブで実行可能** |
| インストール | ホーム画面に追加（ユーザー操作） | **ストアからインストール** |
| アップデート | 即時（デプロイ時） | ストア審査（またはAppflow Live Update） |
| 開発コスト | 最小 | PWA + α（Capacitor設定、ストア対応） |

### 本プロジェクトを Ionic + Capacitor に移行する場合

現在の React + PWA 構成から Ionic + Capacitor に移行するのは比較的容易:

```bash
# 1. Capacitor をインストール
npm install @capacitor/core @capacitor/cli

# 2. 初期化
npx cap init "IPA単語帳" com.example.ipawords

# 3. プラットフォーム追加
npm install @capacitor/ios @capacitor/android
npx cap add ios
npx cap add android

# 4. ビルドして同期
npm run build
npx cap sync

# 5. ネイティブプロジェクトを開く
npx cap open ios      # Xcode
npx cap open android  # Android Studio
```

既存の React コードはほぼそのまま利用可能。Ionic UI コンポーネントの導入は任意（既存のCSS Modulesスタイルを維持してもよい）。

### Ionic を選ぶべき場合

- Web版を作った後に**ストア配布も追加したい**
- Web 技術者のチームで**ネイティブアプリが求められた**
- PWA では**デバイスAPIが不足**している
- **React / Angular / Vue の既存知識**を活用したい
- 予算の都合で**iOS / Android 別々に開発できない**

### Ionic を選ぶべきでない場合

- 高度なアニメーションやGPU処理が必要 → Flutter / ネイティブ
- AR / VR 機能が中心 → ネイティブ
- ゲーム → Unity / ネイティブ
- WebView のパフォーマンスが許容できない → React Native / Flutter / ネイティブ

### Capacitor vs React Native — 根本的なアーキテクチャの違い

Capacitor と React Native はどちらも「JavaScriptでモバイルアプリを作る」技術だが、**仕組みが全く異なる**。直接の関係はなく、別系統の技術である。

#### UI描画の仕組み

```
Capacitor（WebView方式）:
  JS/HTML/CSS → WebView（ブラウザエンジン）→ 画面に描画
  ボタンを書くと → HTMLの<button>がWebView内に表示される

React Native（ネイティブブリッジ方式）:
  JSX → JavaScriptエンジン → ネイティブUIコンポーネントに変換 → 画面に描画
  ボタンを書くと → OSネイティブのボタン（iOS: UIButton, Android: Button）が表示される
```

#### 詳細比較

| 比較軸 | Capacitor | React Native |
|--------|-----------|-------------|
| **UIの実体** | WebView内のHTML/CSS | **ネイティブUI**（OS本来の部品） |
| **描画エンジン** | ブラウザエンジン（WebKit/Blink） | OS のUIフレームワーク |
| **Web技術でUIを作るか** | **Yes**（HTML/CSS/JS） | No（JSXだがHTML/CSSではない） |
| **組み合わせるフレームワーク** | React / Angular / Vue / 何でも | **Reactのみ** |
| **既存Webコードの再利用** | **ほぼそのまま使える** | UIコードは全面書き直し |
| **ネイティブAPIアクセス** | Capacitorプラグイン経由 | ネイティブモジュール経由 |
| **見た目のネイティブ感** | Webアプリの見た目 | **OS標準の見た目** |
| **操作感（スクロール等）** | WebViewの挙動 | **ネイティブの滑らかさ** |
| **パフォーマンス** | WebView依存（中程度） | **ネイティブに近い** |
| **学習コスト（Web経験者）** | **低い（Web知識そのまま）** | 中（React必須 + RN固有概念） |
| **学習コスト（Java経験者）** | 中（Web技術を学ぶ必要） | 中（React + JSを学ぶ必要） |
| **デバッグ** | Chrome DevTools（Web同様） | React Native Debugger / Flipper |
| **ホットリロード** | Vite HMR（ブラウザ同様） | Fast Refresh |
| **ストア配布** | 可能 | 可能 |

#### コード比較: 同じボタンを作る場合

**Capacitor（React + HTML/CSS）:**
```tsx
// 普通のWebアプリと同じコード
function MyButton() {
  return (
    <button
      style={{ padding: '12px 24px', borderRadius: '8px', background: '#333', color: '#fff' }}
      onClick={() => console.log('clicked')}
    >
      タップ
    </button>
  )
}
```

**React Native:**
```tsx
// HTML/CSSは使えない。RN独自のコンポーネントとStyleSheet
import { TouchableOpacity, Text, StyleSheet } from 'react-native'

function MyButton() {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => console.log('pressed')}
    >
      <Text style={styles.text}>タップ</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: { padding: 12, borderRadius: 8, backgroundColor: '#333' },
  text: { color: '#fff', textAlign: 'center' },
})
```

> **注目点:** Capacitorでは `<button>`, `onClick`, CSS が使える（Webと同じ）。React Nativeでは `<TouchableOpacity>`, `onPress`, `StyleSheet` という独自API。**Webの知識が直接使えるかどうか**が最大の違い。

#### ネイティブ機能の呼び出し比較

**Capacitor:**
```tsx
import { Camera, CameraResultType } from '@capacitor/camera'

async function takePhoto() {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
  })
  return photo.webPath
}
```

**React Native:**
```tsx
import { launchCamera } from 'react-native-image-picker'

async function takePhoto() {
  const result = await launchCamera({ mediaType: 'photo' })
  return result.assets?.[0]?.uri
}
```

> どちらも簡潔だが、Capacitorは**Web APIに似たインターフェース**、React Nativeは**ネイティブAPIに近いインターフェース**を提供する。

#### 本プロジェクトからの移行パス

```
現在: React + PWA（Webアプリ）
│
├─── Capacitor追加（コードほぼそのまま）
│    作業量: 小（設定追加 + ビルド調整のみ）
│    結果: WebView内で動くネイティブアプリ
│    適する場合: ストア配布したい、一部ネイティブAPIが必要
│
└─── React Native で書き直し（UIコード全面変更）
     作業量: 大（全画面のUIを書き直し）
     結果: ネイティブUIで動くアプリ
     適する場合: ネイティブの操作感が必須、WebView性能が不足
```

#### どちらを選ぶか — 判断基準

| 状況 | 選択 | 理由 |
|------|------|------|
| 既存Webアプリをストア配布したい | **Capacitor** | コード変更最小 |
| Web技術者チームでモバイル対応 | **Capacitor** | 学習コスト最小 |
| ネイティブの操作感が重要（SNS、チャット等） | **React Native** | UIがネイティブ |
| 複雑なアニメーション・ジェスチャー | **React Native** | ネイティブ描画 |
| Web版は不要、モバイルのみ | **React Native** | Web資産の再利用メリットがない |
| Web + モバイル両方必要 | **Capacitor** | 1つのコードベース |

> **補足:** Capacitor は「Ionic Framework」とセットで語られることが多いが、**Ionic UI なしで Capacitor だけ使うことも可能**（本プロジェクトのようにReact + 独自CSSのまま Capacitor を追加できる）。2026年時点では Capacitor 単体での利用が増加傾向にある。

---

## 9. 本プロジェクト（IPA単語帳）の選択理由

**選択: React + TypeScript + Vite + PWA**

| 要件 | 対応状況 |
|------|---------|
| Web ブラウザで動作する | React + Vite で対応 |
| オフラインでも学習できる | Service Worker + Cache API で対応 |
| スマートフォンでも快適に使える | PWA + レスポンシブデザイン |
| ストア配布は不要 | PWA のホーム画面追加で代替 |
| 音声合成（IPA読み上げ） | Web Speech API で対応 |
| 開発コストを最小化 | 1つのコードベースで全デバイス対応 |

---

## 10. まとめ

- **Web/社内ツール中心** → React + PWA が最もコスト効率が良い
- **Web + ストア配布が必要** → Ionic + Capacitor（Web知識をそのまま活用）
- **PWAでは足りないネイティブ機能が必要** → Ionic + Capacitor
- **Java 経験者がモバイルに進出したい** → Kotlin (Android) が最短経路
- **1チームで iOS/Android 両対応（高品質UI）** → Flutter か React Native
- **パフォーマンスが最優先** → ネイティブ（Kotlin/Swift）
- **学習コストを最小化したい（JS経験者）** → PWA → Ionic → React Native の順で段階的に拡張
