# PWA 詳解

## 1. PWA とは何か（Progressive Web App）

PWA（Progressive Web App）は、Web 技術（HTML / CSS / JavaScript）で構築しながら、ネイティブアプリに近い体験を提供する Web アプリの設計手法・仕様の総称である。

**「Progressive」の意味：** ブラウザや端末の能力に応じて段階的（progressively）に機能を強化する。古いブラウザでは通常の Web ページとして動き、最新のブラウザでは通知・オフライン・インストールなどの高度な機能が使える。

### PWA の 3 つの柱

| 柱 | 技術 | 効果 |
|----|------|------|
| **信頼性** | Service Worker | オフラインでも動作、読み込みが速い |
| **インストール可能** | Web App Manifest | ホーム画面に追加、アプリのように起動 |
| **高機能** | Web API群 | プッシュ通知、カメラ、GPS等 |

### 従来の Web / ネイティブ / PWA の位置づけ

```
通常の Webサイト ──────────────── ネイティブアプリ
    ↑                                    ↑
    リンクでアクセス                    ストアで配布
    インターネット必須                  オフライン対応
    ホーム画面に追加不可                通知・デバイスAPI
    キャッシュなし                      高パフォーマンス

              PWA (中間を埋める)
              ──────────────────
              ストア不要 + オフライン対応
              ホーム画面に追加 + 通知
              Web URL でアクセス可能
```

---

## 2. Service Worker の仕組み

### Service Worker とは

Service Worker は、ブラウザのバックグラウンドで動作する **JavaScript のプロキシ（仲介者）** である。Web ページとは別のスレッドで動き、ネットワークリクエストの傍受・キャッシュの制御・プッシュ通知の受信などを担当する。

```
[ブラウザ タブ（メインスレッド）]
        ↑↓ fetch / message
[Service Worker（バックグラウンドスレッド）]
        ↑↓ キャッシュ制御
[Cache Storage / Push API / Background Sync]
        ↑↓ 条件に応じてネットワークへ
[ネットワーク（サーバー）]
```

### Service Worker のライフサイクル

```
1. 登録 (register)
   navigator.serviceWorker.register('/sw.js')
         ↓
2. インストール (install)
   self.addEventListener('install', (event) => {
     // 必要なファイルをキャッシュに保存
   })
         ↓
3. アクティベーション (activate)
   self.addEventListener('activate', (event) => {
     // 古いキャッシュを削除
   })
         ↓
4. 制御開始 (controlling)
   // fetch / message / push イベントを処理
         ↓
5. 更新 (update)
   // 新しい sw.js が検出されると install → activate を再実行
         ↓
6. 削除 (terminated / unregistered)
```

**重要な点：** Service Worker は HTTPS 環境（または localhost）でのみ動作する。

### Service Worker の基本コード例

```javascript
// sw.js（手動で書く場合の例 / vite-plugin-pwa は自動生成）

const CACHE_NAME = 'ipa-words-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
];

// インストール時: 重要なファイルを事前キャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting(); // 即座にアクティベート
});

// アクティベート時: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// fetchイベント: キャッシュ戦略を適用
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
```

---

## 3. キャッシュ戦略

| 戦略名 | 動作 | 用途 |
|--------|------|------|
| **Cache First** | キャッシュ優先、なければネットワーク | 静的アセット（JS/CSS/画像） |
| **Network First** | ネットワーク優先、失敗したらキャッシュ | APIレスポンス、更新頻度が高いデータ |
| **Stale While Revalidate** | キャッシュを返しつつ、バックグラウンドで更新 | HTMLページ、ドキュメント |
| **Cache Only** | キャッシュのみ（ネットワーク不使用） | 完全オフライン動作が必要なもの |
| **Network Only** | ネットワークのみ（キャッシュしない） | 認証・決済など常に最新が必要 |

```
Cache First（静的ファイル向け）:
  Request → キャッシュにある? → YES: キャッシュを返す
                               → NO:  ネットワークからフェッチ → キャッシュに保存 → 返す

Network First（APIデータ向け）:
  Request → ネットワークに接続 → 成功: レスポンスをキャッシュ → 返す
                               → 失敗: キャッシュから返す（なければエラー）

Stale While Revalidate（HTMLページ向け）:
  Request → キャッシュから即時返す
          → 同時にバックグラウンドでネットワークフェッチ → キャッシュを更新（次回反映）
```

---

## 4. Web App Manifest（manifest.webmanifest）

### manifest.webmanifest の役割

ブラウザに「このWebサイトはアプリとして扱える」ことを伝えるJSONファイル。ホーム画面に追加したときのアイコン・名前・テーマカラー・起動画面などを定義する。

### 本プロジェクトの設定例

```json
// public/manifest.webmanifest
{
  "name": "IPA単語帳",
  "short_name": "IPA単語帳",
  "description": "IPAの専門用語を効率的に学習するフラッシュカードアプリ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "lang": "ja",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### display モードの違い

| display値 | 動作 | ブラウザUI |
|-----------|------|-----------|
| `browser` | 通常のブラウザタブ | アドレスバーあり |
| `minimal-ui` | 最小限のブラウザUI | 戻る/更新ボタンのみ |
| `standalone` | アプリのように起動 | UIなし（推奨） |
| `fullscreen` | 全画面（ゲーム向け） | ステータスバーもなし |

### HTML での Manifest リンク

```html
<!-- index.html -->
<head>
  <link rel="manifest" href="/manifest.webmanifest" />
  <meta name="theme-color" content="#3b82f6" />
  <!-- iOS 向け（Safariは manifest を一部無視するため） -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="IPA単語帳" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
</head>
```

---

## 5. オフライン対応の仕組み（Cache API / Workbox）

### Cache API

Service Worker から利用できるブラウザ内のキャッシュストレージ。キーバリュー形式でリクエスト/レスポンスペアを保存する。

```javascript
// キャッシュに保存
const cache = await caches.open('my-cache-v1');
await cache.put('/api/words', new Response(JSON.stringify(words)));

// キャッシュから取得
const cached = await caches.match('/api/words');
const data = await cached.json();

// キャッシュ一覧
const cacheNames = await caches.keys();

// キャッシュ削除
await caches.delete('old-cache-v0');
```

### Workbox（Googleの Service Worker ライブラリ）

Service Worker の実装を抽象化し、キャッシュ戦略を宣言的に書けるライブラリ。`vite-plugin-pwa` は内部で Workbox を使用している。

```javascript
// Workboxを直接使う場合の例（参考）
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// 静的アセット: Cache First
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  })
);

// API: Network First
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'api-cache' })
);

// HTMLページ: Stale While Revalidate
registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({ cacheName: 'html-cache' })
);
```

---

## 6. vite-plugin-pwa の使い方（本プロジェクト設定）

### インストール

```bash
npm install -D vite-plugin-pwa
```

### vite.config.ts 設定例

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Service Worker の登録方法
      // 'autoUpdate': 新しいバージョンを自動で適用（ユーザーに通知なし）
      // 'prompt':     ユーザーに「更新しますか？」と確認する（推奨）
      registerType: 'prompt',

      // ビルド時に含めるファイル（事前キャッシュ対象）
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],

      // manifest.webmanifest の内容
      manifest: {
        name: 'IPA単語帳',
        short_name: 'IPA単語帳',
        description: 'IPAの専門用語を効率的に学習するフラッシュカードアプリ',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        lang: 'ja',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },

      // Workbox の設定
      workbox: {
        // 事前キャッシュ対象ファイルのパターン
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // ランタイムキャッシュ（動的なリクエスト）
        runtimeCaching: [
          {
            // 外部フォントなど
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
              },
            },
          },
        ],
      },

      // 開発環境でも Service Worker を有効化（デバッグ用）
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
});
```

### 更新プロンプトの実装例

```typescript
// src/components/UpdatePrompt.tsx
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-lg p-4 shadow-lg">
      <p className="text-sm mb-2">新しいバージョンが利用可能です</p>
      <button
        className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium"
        onClick={() => updateServiceWorker(true)}
      >
        更新する
      </button>
      <button
        className="ml-2 text-white/80 text-sm"
        onClick={() => setNeedRefresh(false)}
      >
        後で
      </button>
    </div>
  );
}
```

---

## 7. インストール体験（ホーム画面に追加）vs ストア配布

### PWA のインストールフロー

```
Android Chrome:
  ユーザーが PWA にアクセス
       ↓
  「ホーム画面に追加」バナーが自動表示（インストール基準を満たした場合）
  または アドレスバーのインストールアイコンをタップ
       ↓
  確認ダイアログ → 承認
       ↓
  ホーム画面にアイコンが追加される
       ↓
  アイコンタップ → standalone モードでアプリのように起動

iOS Safari:
  「共有」ボタン → 「ホーム画面に追加」を選択（手動のみ）
  ※ インストールバナーの自動表示は未対応（2026年現在）
```

### インストール基準（Chrome の場合）

| 条件 | 詳細 |
|------|------|
| HTTPS | localhost または HTTPS 必須 |
| manifest.webmanifest | name, icons, start_url, display が必要 |
| Service Worker | fetch イベントを処理していること |
| アイコン | 192×192 以上の PNG アイコンが必要 |
| 使用実績 | ユーザーがある程度サイトを訪問している（ヒューリスティック） |

### インストール促進の実装

```typescript
// src/hooks/useInstallPrompt.ts
import { useState, useEffect } from 'react';

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // インストールプロンプトイベントをキャプチャ
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    // 既にインストール済みかチェック
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
    }
  };

  return { canInstall: !!installPrompt, isInstalled, install };
}
```

### PWA vs ストア配布の比較

| 観点 | PWA（ホーム画面追加） | ストア配布（App Store / Play Store） |
|------|----------------------|--------------------------------------|
| **配布コスト** | 無料（ホスティングのみ） | 年間 $99（Apple）/ 初回 $25（Google） |
| **審査** | 不要 | 必要（数日〜数週間） |
| **更新反映** | 即時（デプロイ後すぐ） | 審査後（数日かかることも） |
| **発見性** | SEO / SNS 共有 | ストア検索 |
| **インストール率** | 低い（ユーザーに認知されにくい） | 高い（ストアを通じた信頼感） |
| **プッシュ通知** | 対応（iOS 16.4+は制限あり） | 完全対応 |
| **デバイスAPI** | 中程度 | 完全 |
| **オフライン** | Service Worker で対応 | ネイティブAPIで対応 |

---

## 8. PWA の制限事項（特に iOS Safari）

### iOS Safari の主な制限（2026年現在）

| 機能 | iOS Safari | Android Chrome | 備考 |
|------|-----------|----------------|------|
| プッシュ通知 | iOS 16.4+ でホーム画面追加後のみ | 完全対応 | ブラウザからは不可 |
| バックグラウンド同期 | 非対応 | 対応 | - |
| Web Bluetooth | 非対応 | 対応 | - |
| Web NFC | 非対応 | 対応 | - |
| ファイルシステムアクセス API | 部分対応 | 対応 | - |
| Service Worker の保存容量 | 約 50MB（制限厳しい） | より大きい | iOSは7日間非アクセスで削除 |
| インストールバナー自動表示 | 非対応 | 対応 | 手動で「共有→ホーム追加」 |
| スプラッシュスクリーン | apple-mobile-web-app 系metaタグで対応 | manifest で対応 | 別途設定が必要 |
| `display: standalone` | 対応 | 対応 | - |
| IndexedDB | 対応 | 対応 | - |
| localStorage | 対応（7日間制限あり） | 対応 | Safari ITPの影響 |

### iOS 対応で特別に必要な設定

```html
<!-- iOS向けの追加設定（index.html）-->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="IPA単語帳">

<!-- アイコン（各サイズ指定が推奨）-->
<link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-icon-152.png">
<link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-icon-167.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-icon-180.png">

<!-- スプラッシュスクリーン（機種ごとに必要）-->
<link rel="apple-touch-startup-image"
      media="(device-width: 390px) and (device-height: 844px)"
      href="/splash/iphone14.png">
```

---

## 9. PWA のデバッグ方法（Chrome DevTools）

### Application タブの活用

```
Chrome DevTools を開く（F12）
  → 「Application」タブを選択

主要なパネル:
┌─────────────────────────────────────────────┐
│ Application                                 │
│ ├── Manifest    ... manifest の内容確認     │
│ ├── Service Workers                         │
│ │   ├── Status: activated and running       │
│ │   ├── Update on reload（開発中に便利）    │
│ │   ├── Bypass for network（キャッシュ無効）│
│ │   └── ネットワーク Offline シミュレーション│
│ ├── Storage                                 │
│ │   ├── Local Storage                       │
│ │   ├── Session Storage                     │
│ │   ├── IndexedDB                           │
│ │   └── Cache Storage（キャッシュ内容確認）│
│ └── Background Services                     │
│     ├── Background Fetch                    │
│     └── Push Messaging                      │
└─────────────────────────────────────────────┘
```

### よくあるデバッグ手順

| 問題 | 確認箇所 | 対処 |
|------|---------|------|
| Service Worker が登録されない | Application > Service Workers | HTTPS か localhost か確認、コンソールエラーを確認 |
| キャッシュが更新されない | Application > Cache Storage | 「Update on reload」を ON にして開発する |
| オフラインで動かない | Network タブで「Offline」に切り替えてテスト | fetch イベントのキャッシュ戦略を確認 |
| マニフェストが認識されない | Application > Manifest | JSON の構文エラー、アイコンのパスを確認 |
| インストールボタンが出ない | Application > Manifest > "Installability" | インストール基準を満たしているか確認 |

### Lighthouse による PWA 診断

```
Chrome DevTools → 「Lighthouse」タブ
  → Categories で「Progressive Web App」にチェック
  → 「Analyze page load」を実行

スコアの主なチェック項目:
  - HTTPS での配信
  - Service Worker の登録
  - manifest.webmanifest の存在
  - オフライン時の挙動（200 を返すか）
  - アイコンサイズ（192x192 以上）
  - レスポンシブデザイン
```

### 開発中の Service Worker リセット手順

```
開発中に Service Worker が古い状態で残ってしまった場合:
  1. Application > Service Workers > 「Unregister」をクリック
  2. Application > Storage > 「Clear site data」をクリック
  3. ページをリロード（Ctrl+Shift+R でハードリロード）

vite.config.ts で devOptions.enabled: true を設定すると
  開発サーバー（localhost）でも Service Worker のテストが可能。
```

---

## 10. PWA とネイティブアプリの機能比較表

| 機能カテゴリ | 具体的な機能 | PWA | iOS ネイティブ | Android ネイティブ |
|------------|------------|-----|--------------|------------------|
| **インストール** | ホーム画面に追加 | ✅ | ✅ | ✅ |
| | ストア配布 | ❌ | ✅ | ✅ |
| | インストール容量 | 小（コード自体はサーバー） | 大（全資産を保存） | 大（全資産を保存） |
| **ネットワーク** | オフライン動作 | ✅ Service Worker | ✅ | ✅ |
| | バックグラウンド同期 | △ (Android Chrome のみ) | ✅ | ✅ |
| **通知** | プッシュ通知 | △ (iOS 16.4+ 制限あり) | ✅ | ✅ |
| | ローカル通知 | ❌ | ✅ | ✅ |
| | バッジ表示 | △ | ✅ | ✅ |
| **デバイス** | カメラ | ✅ | ✅ | ✅ |
| | マイク | ✅ | ✅ | ✅ |
| | GPS / 位置情報 | ✅ | ✅ | ✅ |
| | 加速度計 | ✅ | ✅ | ✅ |
| | Bluetooth | △ (Android Chrome のみ) | ✅ | ✅ |
| | NFC | △ (Android Chrome のみ) | ✅ (iOS 13+) | ✅ |
| | 生体認証 (Face ID等) | △ (WebAuthn) | ✅ | ✅ |
| **ストレージ** | ローカルストレージ | ✅ (制限あり) | ✅ | ✅ |
| | ファイルシステム | △ | ✅ | ✅ |
| | ピクチャライブラリ保存 | △ | ✅ | ✅ |
| **UI/UX** | スプラッシュ画面 | △ (要設定) | ✅ | ✅ |
| | ステータスバーカスタム | △ | ✅ | ✅ |
| | ジェスチャーナビゲーション | △ | ✅ | ✅ |
| | ウィジェット | ❌ | ✅ | ✅ |
| | ロック画面制御 | ❌ | ✅ | ✅ |
| **ネットワーク** | WebSocket | ✅ | ✅ | ✅ |
| | P2P / WebRTC | ✅ | ✅ | ✅ |
| **その他** | ディープリンク | ✅ (URL共有が容易) | ✅ (Universal Links) | ✅ (App Links) |
| | AR / VR | △ (WebXR, 限定的) | ✅ (ARKit) | ✅ (ARCore) |

---

## 11. まとめ

### PWA が適したケース

- Web URL でアクセスできることが価値になる（共有・SEO）
- ストア審査なしに即時リリース・更新したい
- iOS/Android で1つのコードベースを維持したい
- デバイス固有の高度な機能（Bluetooth・AR等）を使わない
- 本プロジェクト（IPA単語帳）のような学習・情報閲覧系アプリ

### PWA の限界を理解する

- iOS Safari の制限は 2026 年現在も残っている（特にバックグラウンド処理・通知）
- デバイス固有機能が多く必要な場合はネイティブ or React Native を検討
- ストア経由での「発見性」はネイティブアプリに及ばない

### 本プロジェクトでの PWA の意義

IPA単語帳アプリは：
- 通信環境が不安定な場所でも学習できる（オフライン対応）
- スマートフォンからワンタップで起動できる（ホーム画面追加）
- URL 共有で他のユーザーに配布できる（ストア不要）

これらの要件が PWA の強みと合致しており、最もコスト効率の良い選択である。
