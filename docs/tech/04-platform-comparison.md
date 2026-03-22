# プラットフォーム比較（React / React Native / PWA / Kotlin / Swift / Flutter）

## 概要

モバイル・Web アプリを開発する際、どのプラットフォーム・技術スタックを選ぶかは、要件・チーム構成・予算・納期に大きく影響する。本ドキュメントでは主要な 6 つの選択肢を多角的に比較する。

---

## 1. 技術スタック一覧

| 技術 | 種別 | 提供元 |
|------|------|--------|
| React (Web) | Webアプリフレームワーク | Meta |
| React Native | クロスプラットフォームモバイル | Meta |
| PWA | Web標準仕様 | W3C / ブラウザベンダー |
| Kotlin (Android) | ネイティブAndroid | JetBrains / Google |
| Swift (iOS) | ネイティブiOS | Apple |
| Flutter | クロスプラットフォームUI | Google |

---

## 2. 総合比較表

| 比較軸 | React (Web) | React Native | PWA | Kotlin (Android) | Swift (iOS) | Flutter |
|--------|------------|--------------|-----|------------------|-------------|---------|
| **対応プラットフォーム** | ブラウザ全般 | iOS / Android / Web | ブラウザ全般（インストール可） | Android のみ | iOS / macOS のみ | iOS / Android / Web / Desktop |
| **言語** | JavaScript / TypeScript | JavaScript / TypeScript | JavaScript / TypeScript | Kotlin | Swift | Dart |
| **UI構築方法** | HTML + CSS + JSX | React コンポーネント（ネイティブUIにマップ） | HTML + CSS + JSX | Jetpack Compose / XML Layout | SwiftUI / UIKit | Flutter Widget（独自レンダリング） |
| **デバイスAPIアクセス** | 制限あり（ブラウザ経由） | 豊富（ライブラリ経由） | 中程度（Web API の範囲内） | 完全アクセス | 完全アクセス | 豊富（プラグイン経由） |
| **カメラ** | getUserMedia（制限あり） | react-native-camera | MediaDevices API（制限あり） | CameraX / Camera2 | AVFoundation | camera プラグイン |
| **GPS** | Geolocation API | react-native-geolocation | Geolocation API | FusedLocationProvider | CoreLocation | geolocator プラグイン |
| **プッシュ通知** | Web Push API（iOS制限あり） | FCM / APNs 対応 | Web Push（iOS 16.4+） | FCM | APNs | firebase_messaging |
| **オフライン対応** | Service Worker で実装可 | AsyncStorage 等で実装可 | Service Worker（標準） | Room / WorkManager | Core Data / URLSession | Hive / SQLite |
| **配布方法** | Web（URL直アクセス） | App Store / Google Play | Web（＋ホーム画面追加） | Google Play | App Store | App Store / Google Play / Web |
| **ストア審査** | 不要 | 必要 | 不要 | 必要 | 必要 | 必要 |
| **インストール不要** | はい | いいえ | はい（オプション） | いいえ | いいえ | いいえ |
| **パフォーマンス** | 良（DOM操作ボトルネックあり） | ネイティブに近い | Webと同等 | ネイティブ最高 | ネイティブ最高 | ネイティブに近い |
| **アニメーション** | CSS / Framer Motion | Reanimated（滑らか） | CSS アニメーション | Jetpack Compose Animation | SwiftUI Animation | 非常に豊富・滑らか |
| **1チームで複数OS対応** | はい（Webのみ） | はい（iOS+Android） | はい（Webのみ） | いいえ | いいえ | はい（iOS+Android+Web+Desktop） |
| **開発コスト（初期）** | 低〜中 | 中 | 低（Webの延長） | 中〜高 | 中〜高 | 中 |
| **保守コスト** | 低 | 中（RN バージョン追随） | 低 | 中 | 中 | 中 |
| **学習コスト（Java/jQuery経験者）** | 低〜中（JSは知っている） | 中（ReactをまずマスタΌ） | 低（Webの延長） | 低（Java→Kotlin は移行しやすい） | 高（Swift・iOS エコシステム） | 高（Dart・Flutter 固有概念） |
| **エコシステム成熟度** | 非常に成熟 | 成熟 | 成熟 | 成熟 | 成熟 | 成長中 |
| **採用・求人市場** | 非常に多い | 多い | 少なめ（Webエンジニア兼任） | 多い | 多い | 増加中 |

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
Webと同等         React Web / PWA
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
├─ YES → React Native または Flutter を検討
└─ NO（カメラ・GPS程度）→ PWA でも対応可能、Q6へ

Q6: チームの主な技術スタックは？
├─ JavaScript / TypeScript → React Native または Flutter
├─ Java/Kotlin → Kotlin（Android）または Flutter
└─ Swift → Swift（iOS）
```

### ステップ 3: 最終判断マトリクス

| シナリオ | 推奨技術 | 理由 |
|---------|---------|------|
| 社内Web ツール | React + PWA | コスト最小、配布が簡単 |
| 個人学習アプリ（Web主体） | React + PWA | 本プロジェクト相当 |
| 消費者向けiOS/Androidアプリ | Flutter | 1チームで両OS対応 |
| Androidのみ、デバイスAPI多用 | Kotlin | ネイティブ最適 |
| iOSのみ、デバイスAPI多用 | Swift | ネイティブ最適 |
| iOS/Android + 高度なネイティブ機能 | React Native | JSエンジニアが多い場合 |
| ゲーム / AR | Unity / ネイティブ | 上記6択外 |

---

## 7. コスト試算（参考）

単純なCRUDアプリ（例：単語帳）を1人のエンジニアが作る場合の目安工数：

| 技術 | 初期開発 | iOS対応 | Android対応 | 合計 |
|------|---------|---------|------------|------|
| React + PWA | 2週間 | - (Web共通) | - (Web共通) | 2週間 |
| React Native | 3週間 | 含む | 含む | 3週間 |
| Flutter | 3週間 | 含む | 含む | 3週間 |
| Kotlin | 2週間 | 不可 | 含む | 2週間 |
| Kotlin + Swift | 2週間 | 2週間 | 含む | 4週間 |

---

## 8. 本プロジェクト（IPA単語帳）の選択理由

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

## 9. まとめ

- **Web/社内ツール中心** → React + PWA が最もコスト効率が良い
- **Java 経験者がモバイルに進出したい** → Kotlin (Android) が最短経路
- **1チームで iOS/Android 両対応** → Flutter か React Native
- **パフォーマンスが最優先** → ネイティブ（Kotlin/Swift）
- **学習コストを最小化したい（JS経験者）** → PWA → React Native の順で段階的に拡張
