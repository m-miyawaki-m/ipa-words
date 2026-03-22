# Kotlin アプリとの比較

## 1. Kotlin/Android 開発 vs React/PWA 開発の全体像

### 哲学的な違い

| 観点 | Kotlin/Android | React/PWA |
|------|---------------|-----------|
| **UI の定義** | Jetpack Compose（宣言的）または XML（命令的） | JSX（宣言的） |
| **実行環境** | Android ランタイム（ART） | ブラウザ / Node.js |
| **型システム** | Kotlin の強い静的型付け | TypeScript（オプション） |
| **配布** | Google Play Store | URL（Web） |
| **更新** | ストア審査 → ユーザーが手動更新 | デプロイ即時反映 |
| **コードの共有** | Android / iOS 間は Kotlin Multiplatform | Web / モバイルで 100% 共有 |
| **エコシステム** | Jetpack ライブラリ群（Google 製） | npm パッケージ（コミュニティ主導） |

### 技術スタック全体図

```
【Kotlin/Android】                    【React/PWA】
┌────────────────────────────┐        ┌────────────────────────────┐
│ Android Studio             │        │ VSCode / WebStorm          │
│ ├── Kotlin コード          │        │ ├── TypeScript / JSX       │
│ ├── Jetpack Compose UI     │        │ ├── React コンポーネント   │
│ ├── ViewModel (状態管理)   │        │ ├── useState / useEffect   │
│ ├── Room (DB)              │        │ ├── localStorage /         │
│ ├── Retrofit (HTTP)        │        │ │   IndexedDB              │
│ ├── Hilt (DI)              │        │ ├── fetch API / axios      │
│ ├── Navigation Component   │        │ ├── React Router           │
│ └── Gradle (ビルド)        │        │ └── Vite + npm (ビルド)   │
│                            │        │                            │
│  ↓ .apk / .aab             │        │  ↓ 静的ファイル（JS/CSS） │
│  Google Play Store         │        │  Web サーバー / CDN        │
│  Android 端末              │        │  ブラウザ（全端末）        │
└────────────────────────────┘        └────────────────────────────┘
```

---

## 2. プロジェクト構成比較（Android Studio vs VSCode + Vite）

### Kotlin/Android プロジェクト構成

```
ipa-words-android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml        # アプリの設定・権限
│   │   │   ├── java/com/example/ipawords/
│   │   │   │   ├── MainActivity.kt        # エントリーポイント
│   │   │   │   ├── ui/
│   │   │   │   │   ├── home/
│   │   │   │   │   │   ├── HomeScreen.kt  # Compose UI
│   │   │   │   │   │   └── HomeViewModel.kt
│   │   │   │   │   ├── quiz/
│   │   │   │   │   │   ├── QuizScreen.kt
│   │   │   │   │   │   └── QuizViewModel.kt
│   │   │   │   │   └── wordlist/
│   │   │   │   │       ├── WordListScreen.kt
│   │   │   │   │       └── WordListViewModel.kt
│   │   │   │   ├── data/
│   │   │   │   │   ├── WordDatabase.kt    # Room DB
│   │   │   │   │   ├── WordDao.kt         # DB操作
│   │   │   │   │   ├── WordEntity.kt      # DBエンティティ
│   │   │   │   │   └── WordRepository.kt  # データ層
│   │   │   │   └── navigation/
│   │   │   │       └── AppNavigation.kt
│   │   │   └── res/
│   │   │       ├── drawable/              # 画像リソース
│   │   │       ├── values/
│   │   │       │   ├── strings.xml        # 文字列リソース
│   │   │       │   └── themes.xml         # テーマ
│   │   │       └── mipmap/                # アイコン
│   │   └── test/                          # ユニットテスト
│   └── build.gradle                       # モジュール設定
├── build.gradle                           # プロジェクト設定
├── settings.gradle
└── gradle.properties
```

### React/PWA プロジェクト構成（本プロジェクト）

```
ipa-words/
├── src/
│   ├── main.tsx                           # エントリーポイント
│   ├── App.tsx                            # ルートコンポーネント
│   ├── components/
│   │   ├── ui/                            # 汎用UIコンポーネント
│   │   ├── FlashCard.tsx
│   │   ├── QuizMode.tsx
│   │   └── WordList.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Quiz.tsx
│   │   └── WordList.tsx
│   ├── hooks/
│   │   ├── useWords.ts                    # カスタムフック
│   │   └── useProgress.ts
│   ├── store/                             # 状態管理
│   │   └── wordStore.ts
│   ├── data/
│   │   └── words.ts                       # 単語データ
│   └── types/
│       └── index.ts                       # 型定義
├── public/
│   ├── manifest.webmanifest               # PWA設定
│   └── icons/
├── index.html                             # HTMLテンプレート
├── vite.config.ts                         # ビルド設定
├── package.json                           # 依存関係
└── tsconfig.json                          # TypeScript設定
```

### 対応表

| Android | React/PWA | 役割 |
|---------|-----------|------|
| `AndroidManifest.xml` | `manifest.webmanifest` | アプリメタデータ・権限 |
| `MainActivity.kt` | `main.tsx` | エントリーポイント |
| `res/values/strings.xml` | `src/i18n/` or 定数ファイル | 文字列リソース |
| `res/drawable/` | `public/` or `src/assets/` | 画像リソース |
| `build.gradle` | `package.json` + `vite.config.ts` | ビルド設定 |
| `gradle.properties` | `.env` | 環境変数 |

---

## 3. UI 構築: Jetpack Compose vs React JSX

### 同じ機能のコード比較（フラッシュカード表示）

#### Kotlin / Jetpack Compose

```kotlin
// FlashCardScreen.kt
@Composable
fun FlashCard(
    word: Word,
    isFlipped: Boolean,
    onFlip: () -> Unit
) {
    val rotation by animateFloatAsState(
        targetValue = if (isFlipped) 180f else 0f,
        animationSpec = tween(durationMillis = 400)
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(200.dp)
            .graphicsLayer {
                rotationY = rotation
                cameraDistance = 8 * density
            }
            .clickable { onFlip() },
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.fillMaxSize()
        ) {
            if (!isFlipped) {
                // 表面: 単語
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = word.term,
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = word.category,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
            } else {
                // 裏面: 説明
                Text(
                    text = word.definition,
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.padding(16.dp),
                    textAlign = TextAlign.Center,
                    // 裏面は左右反転して表示
                    modifier = Modifier.graphicsLayer { rotationY = 180f }
                )
            }
        }
    }
}

// 使用側
@Composable
fun FlashCardScreen(viewModel: FlashCardViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    FlashCard(
        word = uiState.currentWord,
        isFlipped = uiState.isFlipped,
        onFlip = viewModel::toggleFlip
    )
}
```

#### React / TypeScript / JSX（本プロジェクト）

```tsx
// FlashCard.tsx
interface FlashCardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashCard({ word, isFlipped, onFlip }: FlashCardProps) {
  return (
    <div
      className="relative w-full h-48 cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={onFlip}
    >
      <div
        className="relative w-full h-full transition-transform duration-400"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* 表面: 単語 */}
        <div className="absolute inset-0 bg-white rounded-xl shadow-md flex flex-col items-center justify-center backface-hidden">
          <p className="text-2xl font-bold text-gray-800">{word.term}</p>
          <p className="text-sm text-blue-500 mt-2">{word.category}</p>
        </div>

        {/* 裏面: 説明 */}
        <div
          className="absolute inset-0 bg-blue-50 rounded-xl shadow-md flex items-center justify-center p-4 backface-hidden"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <p className="text-base text-gray-700 text-center">{word.definition}</p>
        </div>
      </div>
    </div>
  );
}

// 使用側
export function FlashCardScreen() {
  const { currentWord, isFlipped, toggleFlip } = useFlashCard();

  return <FlashCard word={currentWord} isFlipped={isFlipped} onFlip={toggleFlip} />;
}
```

### 構文の対応関係

| Compose | React JSX | 説明 |
|---------|-----------|------|
| `@Composable fun` | `function Component()` | UI の基本単位 |
| `Column` | `<div className="flex flex-col">` | 縦方向レイアウト |
| `Row` | `<div className="flex flex-row">` | 横方向レイアウト |
| `Box` | `<div className="relative">` | 重ねるレイアウト |
| `Text` | `<p>` / `<span>` | テキスト表示 |
| `Card` | `<div className="rounded shadow">` | カード UI |
| `Button` | `<button>` | ボタン |
| `Modifier.fillMaxWidth()` | `className="w-full"` | 幅いっぱい |
| `Modifier.padding(16.dp)` | `className="p-4"` | パディング |
| `MaterialTheme.colorScheme` | Tailwind のカラークラス | テーマカラー |
| `animateFloatAsState` | CSS `transition` / Framer Motion | アニメーション |

---

## 4. 状態管理: ViewModel/LiveData vs useState/useEffect

### Kotlin / ViewModel + StateFlow

```kotlin
// FlashCardViewModel.kt
@HiltViewModel
class FlashCardViewModel @Inject constructor(
    private val wordRepository: WordRepository
) : ViewModel() {

    // 画面全体の状態を一つの data class で管理
    data class UiState(
        val words: List<Word> = emptyList(),
        val currentIndex: Int = 0,
        val isFlipped: Boolean = false,
        val isLoading: Boolean = false,
        val errorMessage: String? = null
    )

    private val _uiState = MutableStateFlow(UiState(isLoading = true))
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    // 現在の単語（派生状態）
    val currentWord: Word?
        get() = _uiState.value.words.getOrNull(_uiState.value.currentIndex)

    init {
        loadWords()
    }

    private fun loadWords() {
        viewModelScope.launch {
            wordRepository.getWords()
                .catch { e ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = e.message) }
                }
                .collect { words ->
                    _uiState.update { it.copy(words = words, isLoading = false) }
                }
        }
    }

    fun toggleFlip() {
        _uiState.update { it.copy(isFlipped = !it.isFlipped) }
    }

    fun nextWord() {
        _uiState.update { state ->
            state.copy(
                currentIndex = (state.currentIndex + 1) % state.words.size,
                isFlipped = false
            )
        }
    }
}
```

### React / useState + useEffect + カスタムフック

```typescript
// hooks/useFlashCard.ts
interface FlashCardState {
  words: Word[];
  currentIndex: number;
  isFlipped: boolean;
  isLoading: boolean;
  errorMessage: string | null;
}

export function useFlashCard() {
  const [state, setState] = useState<FlashCardState>({
    words: [],
    currentIndex: 0,
    isFlipped: false,
    isLoading: true,
    errorMessage: null,
  });

  // 初回マウント時にデータを読み込む（ViewModelのinit{}相当）
  useEffect(() => {
    loadWords();
  }, []);

  async function loadWords() {
    try {
      const words = await wordRepository.getWords();
      setState(prev => ({ ...prev, words, isLoading: false }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        errorMessage: e instanceof Error ? e.message : '不明なエラー',
      }));
    }
  }

  // 派生状態（Kotlinのgetプロパティに相当）
  const currentWord = state.words[state.currentIndex] ?? null;

  function toggleFlip() {
    setState(prev => ({ ...prev, isFlipped: !prev.isFlipped }));
  }

  function nextWord() {
    setState(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.words.length,
      isFlipped: false,
    }));
  }

  return { ...state, currentWord, toggleFlip, nextWord };
}
```

### 概念の対応

| Kotlin/Android | React | 説明 |
|---------------|-------|------|
| `ViewModel` | カスタムフック (`useXxx`) | 状態とロジックのカプセル化 |
| `MutableStateFlow` | `useState` | 変更可能な状態 |
| `StateFlow` | `useState` の読み取り側 | UI が購読する状態 |
| `uiState.collect` | コンポーネントが自動的に購読 | 状態変化でUI再描画 |
| `_uiState.update { }` | `setState(prev => ...)` | 状態の更新 |
| `viewModelScope.launch` | `useEffect` + async/await | 非同期処理 |
| `init { }` | `useEffect([], [])` | 初期化処理 |
| `LiveData` | `useState` (旧来の対応) | 観察可能な値 |
| `collectAsState()` | コンポーネント内で useState を使う | 状態をUIにバインド |

---

## 5. データ永続化: Room/SharedPreferences vs localStorage/IndexedDB

### Kotlin: Room（SQLiteラッパー）

```kotlin
// WordEntity.kt - DBのテーブル定義
@Entity(tableName = "words")
data class WordEntity(
    @PrimaryKey val id: String,
    val term: String,
    val definition: String,
    val category: String,
    val masteryLevel: Int = 0,
    val lastReviewedAt: Long? = null
)

// WordDao.kt - DB操作のインターフェース
@Dao
interface WordDao {
    @Query("SELECT * FROM words ORDER BY term ASC")
    fun getAllWords(): Flow<List<WordEntity>>

    @Query("SELECT * FROM words WHERE category = :category")
    fun getWordsByCategory(category: String): Flow<List<WordEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWord(word: WordEntity)

    @Update
    suspend fun updateWord(word: WordEntity)

    @Delete
    suspend fun deleteWord(word: WordEntity)

    @Query("UPDATE words SET masteryLevel = :level WHERE id = :wordId")
    suspend fun updateMasteryLevel(wordId: String, level: Int)
}

// WordDatabase.kt
@Database(entities = [WordEntity::class], version = 1)
abstract class WordDatabase : RoomDatabase() {
    abstract fun wordDao(): WordDao

    companion object {
        @Volatile private var instance: WordDatabase? = null

        fun getInstance(context: Context): WordDatabase {
            return instance ?: synchronized(this) {
                Room.databaseBuilder(context, WordDatabase::class.java, "words.db")
                    .build()
                    .also { instance = it }
            }
        }
    }
}

// SharedPreferences（簡易設定の保存）
class PreferenceRepository(context: Context) {
    private val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)

    var currentCategory: String
        get() = prefs.getString("current_category", "all") ?: "all"
        set(value) = prefs.edit { putString("current_category", value) }

    var quizMode: String
        get() = prefs.getString("quiz_mode", "flashcard") ?: "flashcard"
        set(value) = prefs.edit { putString("quiz_mode", value) }
}
```

### React/PWA: localStorage + IndexedDB

```typescript
// localStorage（簡易設定 / SharedPreferences 相当）
const PreferenceStorage = {
  getCurrentCategory: (): string =>
    localStorage.getItem('current_category') ?? 'all',

  setCurrentCategory: (category: string): void =>
    localStorage.setItem('current_category', category),

  getQuizMode: (): string =>
    localStorage.getItem('quiz_mode') ?? 'flashcard',

  setQuizMode: (mode: string): void =>
    localStorage.setItem('quiz_mode', mode),
};

// IndexedDB（大容量データ / Room 相当）
// idb ライブラリを使うと使いやすい: npm install idb
import { openDB, DBSchema } from 'idb';

interface WordDB extends DBSchema {
  words: {
    key: string;
    value: {
      id: string;
      term: string;
      definition: string;
      category: string;
      masteryLevel: number;
      lastReviewedAt: number | null;
    };
    indexes: { 'by-category': string };
  };
}

const dbPromise = openDB<WordDB>('ipa-words-db', 1, {
  upgrade(db) {
    const store = db.createObjectStore('words', { keyPath: 'id' });
    store.createIndex('by-category', 'category');
  },
});

// CRUD操作（Room の Dao に相当）
const WordStorage = {
  async getAllWords() {
    const db = await dbPromise;
    return db.getAll('words');
  },

  async getWordsByCategory(category: string) {
    const db = await dbPromise;
    return db.getAllFromIndex('words', 'by-category', category);
  },

  async saveWord(word: Word) {
    const db = await dbPromise;
    await db.put('words', word);
  },

  async deleteWord(id: string) {
    const db = await dbPromise;
    await db.delete('words', id);
  },

  async updateMasteryLevel(wordId: string, level: number) {
    const db = await dbPromise;
    const word = await db.get('words', wordId);
    if (word) {
      word.masteryLevel = level;
      await db.put('words', word);
    }
  },
};
```

### データ永続化の対応表

| Android / Kotlin | React / Web | 用途 |
|-----------------|-------------|------|
| `SharedPreferences` | `localStorage` | 小さな設定値（文字列・数値・真偽値） |
| `Room` (SQLite) | `IndexedDB` | 大量の構造化データ |
| `DataStore` | `localStorage` (JSON) | 型安全な設定 |
| `内部ファイルストレージ` | `Cache API` | キャッシュファイル |
| `外部ストレージ` | `File System Access API` (制限あり) | ユーザーのファイル |

---

## 6. 画面遷移: Navigation Component vs React Router

### Kotlin: Navigation Component

```kotlin
// AppNavigation.kt
@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                onNavigateToQuiz = { navController.navigate("quiz") },
                onNavigateToWordList = { navController.navigate("word_list") }
            )
        }
        composable("quiz") {
            QuizScreen(
                onBack = { navController.popBackStack() }
            )
        }
        composable(
            route = "word_detail/{wordId}",
            arguments = listOf(navArgument("wordId") { type = NavType.StringType })
        ) { backStackEntry ->
            val wordId = backStackEntry.arguments?.getString("wordId")
            WordDetailScreen(wordId = wordId!!)
        }
        composable("word_list") {
            WordListScreen()
        }
    }
}

// BottomNavigation の追加
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = currentRoute == "home",
                    onClick = { navController.navigate("home") },
                    icon = { Icon(Icons.Default.Home, contentDescription = "ホーム") },
                    label = { Text("ホーム") }
                )
                NavigationBarItem(
                    selected = currentRoute == "quiz",
                    onClick = { navController.navigate("quiz") },
                    icon = { Icon(Icons.Default.Quiz, contentDescription = "クイズ") },
                    label = { Text("クイズ") }
                )
            }
        }
    ) { paddingValues ->
        AppNavigation(navController, Modifier.padding(paddingValues))
    }
}
```

### React: React Router v6

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="quiz" element={<QuizPage />} />
          <Route path="words" element={<WordListPage />} />
          <Route path="words/:wordId" element={<WordDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Layout.tsx（BottomNavigation 相当）
import { Outlet, NavLink } from 'react-router-dom';

function Layout() {
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet /> {/* 子ルートがここに描画される */}
      </main>

      {/* BottomNavigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 ${isActive ? 'text-blue-500' : 'text-gray-500'}`
          }
        >
          <HomeIcon />
          <span className="text-xs">ホーム</span>
        </NavLink>
        <NavLink
          to="/quiz"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 ${isActive ? 'text-blue-500' : 'text-gray-500'}`
          }
        >
          <QuizIcon />
          <span className="text-xs">クイズ</span>
        </NavLink>
      </nav>
    </div>
  );
}

// パラメータの取得（backStackEntry?.arguments 相当）
import { useParams, useNavigate } from 'react-router-dom';

function WordDetailPage() {
  const { wordId } = useParams<{ wordId: string }>();
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate(-1)}>戻る</button>  {/* popBackStack() 相当 */}
      {/* ... */}
    </div>
  );
}
```

---

## 7. ライフサイクル: Activity/Fragment vs React コンポーネント

### ライフサイクルの対応図

```
【Android Activity / Fragment】        【React コンポーネント】
                                        ↑
onCreate()     ←→  useEffect(() => {}, [])  # マウント時
onStart()                              ↑
onResume()     ←→  画面フォーカス時 (Page Visibility API)
onPause()      ←→  Page Visibility API（画面が隠れたとき）
onStop()                               |
onDestroy()    ←→  useEffect return () => { ... }  # アンマウント時
                                        ↓
```

### コード比較

```kotlin
// Kotlin: Fragment のライフサイクル
class QuizFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        // 画面が作成されたときの初期化
        setupObservers()
        startTimer()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        // クリーンアップ
        stopTimer()
    }

    override fun onResume() {
        super.onResume()
        // 画面がフォアグラウンドに来たとき
        resumeTimer()
    }

    override fun onPause() {
        super.onPause()
        // 画面がバックグラウンドに行くとき
        pauseTimer()
    }
}
```

```tsx
// React: コンポーネントのライフサイクル
function QuizPage() {
  const timerRef = useRef<number | null>(null);

  // onViewCreated 相当（マウント時）
  useEffect(() => {
    setupObservers();
    startTimer();

    // onDestroyView 相当（アンマウント時）
    return () => {
      stopTimer();
    };
  }, []); // [] = マウント時のみ実行

  // onResume / onPause 相当（Page Visibility API）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resumeTimer();
      } else {
        pauseTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ...
}
```

---

## 8. ビルド: Gradle vs npm/Vite

### Kotlin: Gradle

```kotlin
// app/build.gradle
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.example.ipawords"
    compileSdk = 34
    defaultConfig {
        applicationId = "com.example.ipawords"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }
    buildTypes {
        debug { isDebuggable = true }
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
        }
    }
}

dependencies {
    implementation("androidx.compose.ui:ui:1.6.0")
    implementation("androidx.navigation:navigation-compose:2.7.6")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("com.google.dagger:hilt-android:2.50")
}
```

### React/PWA: package.json + vite.config.ts

```json
// package.json
{
  "name": "ipa-words",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.0",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite-plugin-pwa": "^0.20.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^1.4.0"
  }
}
```

### 主要コマンドの対応

| Gradle タスク | npm/Vite コマンド | 説明 |
|--------------|------------------|------|
| `./gradlew assembleDebug` | `npm run dev` | 開発ビルド |
| `./gradlew assembleRelease` | `npm run build` | リリースビルド |
| `./gradlew test` | `npm test` | テスト実行 |
| `./gradlew dependencies` | `npm list` | 依存関係確認 |
| `./gradlew clean` | `rm -rf dist node_modules` | クリーン |
| `build.gradle の依存追加` | `npm install <package>` | 依存追加 |

---

## 9. テスト: JUnit/Espresso vs Vitest/React Testing Library

### Kotlin: ユニットテスト（JUnit + Mockito）

```kotlin
// WordViewModelTest.kt
@ExtendWith(MockitoExtension::class)
class FlashCardViewModelTest {

    @Mock
    private lateinit var wordRepository: WordRepository

    private lateinit var viewModel: FlashCardViewModel

    @Before
    fun setup() {
        whenever(wordRepository.getWords()).thenReturn(
            flowOf(listOf(
                Word(id = "1", term = "アルゴリズム", definition = "問題を解くための手順"),
                Word(id = "2", term = "スタック", definition = "後入れ先出しのデータ構造"),
            ))
        )
        viewModel = FlashCardViewModel(wordRepository)
    }

    @Test
    fun `初期状態では最初の単語が表示される`() {
        val uiState = viewModel.uiState.value
        assertEquals("アルゴリズム", uiState.words.first().term)
        assertEquals(0, uiState.currentIndex)
        assertFalse(uiState.isFlipped)
    }

    @Test
    fun `toggleFlip を呼ぶとカードが反転する`() {
        viewModel.toggleFlip()
        assertTrue(viewModel.uiState.value.isFlipped)
    }

    @Test
    fun `nextWord を呼ぶと次の単語に進む`() {
        viewModel.nextWord()
        val uiState = viewModel.uiState.value
        assertEquals(1, uiState.currentIndex)
        assertFalse(uiState.isFlipped) // 反転はリセットされる
    }
}
```

### React: ユニットテスト（Vitest + React Testing Library）

```typescript
// useFlashCard.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFlashCard } from './useFlashCard';

// wordRepository をモック
vi.mock('../data/wordRepository', () => ({
  wordRepository: {
    getWords: vi.fn().mockResolvedValue([
      { id: '1', term: 'アルゴリズム', definition: '問題を解くための手順' },
      { id: '2', term: 'スタック', definition: '後入れ先出しのデータ構造' },
    ]),
  },
}));

describe('useFlashCard', () => {
  it('初期状態では最初の単語が表示される', async () => {
    const { result } = renderHook(() => useFlashCard());

    // データ読み込み待ち
    await act(async () => {});

    expect(result.current.words[0].term).toBe('アルゴリズム');
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.isFlipped).toBe(false);
  });

  it('toggleFlip を呼ぶとカードが反転する', async () => {
    const { result } = renderHook(() => useFlashCard());
    await act(async () => {});

    act(() => {
      result.current.toggleFlip();
    });

    expect(result.current.isFlipped).toBe(true);
  });

  it('nextWord を呼ぶと次の単語に進む', async () => {
    const { result } = renderHook(() => useFlashCard());
    await act(async () => {});

    act(() => {
      result.current.nextWord();
    });

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.isFlipped).toBe(false);
  });
});
```

### UI テストの比較

| Espresso（Android） | React Testing Library | 説明 |
|--------------------|----------------------|------|
| `onView(withId(R.id.button))` | `screen.getByRole('button')` | 要素の取得 |
| `.perform(click())` | `userEvent.click(element)` | クリック操作 |
| `.check(matches(isDisplayed()))` | `expect(element).toBeInTheDocument()` | 表示確認 |
| `onView(withText("テスト"))` | `screen.getByText("テスト")` | テキストで検索 |

---

## 10. 依存管理: Gradle dependencies vs package.json

### 依存関係の比較表

| カテゴリ | Kotlin/Android ライブラリ | React/Web ライブラリ |
|---------|--------------------------|---------------------|
| **UIフレームワーク** | Jetpack Compose | React |
| **ルーティング** | Navigation Component | react-router-dom |
| **HTTP クライアント** | Retrofit + OkHttp | fetch API / axios |
| **画像読み込み** | Coil | (CSS / next/image) |
| **状態管理（大規模）** | Hilt + ViewModel | Zustand / Redux Toolkit |
| **データベース** | Room | idb (IndexedDB ラッパー) |
| **非同期処理** | Kotlin Coroutines / Flow | Promise / async-await / RxJS |
| **DI（依存注入）** | Hilt / Koin | - (Context API / カスタムフック) |
| **テスト（ユニット）** | JUnit 5 + Mockito | Vitest |
| **テスト（UI）** | Espresso | React Testing Library |
| **JSON パース** | Gson / Kotlinx Serialization | JSON.parse / zod |
| **アニメーション** | Jetpack Compose Animation | Framer Motion / CSS |
| **PWA** | 非対応 | vite-plugin-pwa / Workbox |

---

## 11. 同じアプリ（単語帳）を Kotlin で作った場合の構成例

### 必要な画面

```
MainActivity
  └── NavHost
      ├── HomeScreen
      │     フラッシュカード表示
      │     カテゴリ選択
      │     学習進捗表示
      │
      ├── QuizScreen
      │     4択クイズ
      │     正解/不正解のフィードバック
      │     スコア表示
      │
      └── WordListScreen
            単語一覧（検索/フィルタ付き）
            単語詳細
```

### 主要クラス一覧

```kotlin
// データ層
data class Word(val id: String, val term: String, val definition: String, val category: String)
data class Progress(val wordId: String, val masteryLevel: Int, val reviewCount: Int)

@Entity class WordEntity(...)
@Entity class ProgressEntity(...)
@Dao interface WordDao
@Dao interface ProgressDao
@Database class AppDatabase(...)
class WordRepository(private val wordDao: WordDao, private val progressDao: ProgressDao)

// ViewModels
class HomeViewModel(private val repo: WordRepository) : ViewModel()
class QuizViewModel(private val repo: WordRepository) : ViewModel()
class WordListViewModel(private val repo: WordRepository) : ViewModel()

// Composable 関数
@Composable fun HomeScreen(viewModel: HomeViewModel)
@Composable fun FlashCard(word: Word, isFlipped: Boolean, onFlip: () -> Unit)
@Composable fun CategorySelector(categories: List<String>, selected: String, onSelect: (String) -> Unit)
@Composable fun QuizScreen(viewModel: QuizViewModel)
@Composable fun QuizCard(question: Word, options: List<Word>, onAnswer: (Word) -> Unit)
@Composable fun WordListScreen(viewModel: WordListViewModel)
@Composable fun WordItem(word: Word, progress: Progress, onClick: () -> Unit)
```

### build.gradle（dependencies のみ）

```kotlin
dependencies {
    // Compose
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.6")

    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

    // Room (SQLite)
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    ksp("androidx.room:room-compiler:2.6.1")

    // Hilt (DI)
    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-android-compiler:2.50")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // DataStore（SharedPreferences の代替）
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // テスト
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
```

---

## 12. どちらを選ぶべきかの判断基準

### 判断フロー

```
Q1: ターゲットユーザーは Android のみか？
├── YES → Q2
└── NO（iOS も必要 / Web も使う）→ Q3

Q2: Android に特化したデバイスAPI（NFC・AR・Bluetooth GATT等）が必要か？
├── YES → Kotlin がベスト
└── NO → PWA でも対応可能。Q4へ

Q3: ストアへの配布（App Store / Play Store）が必須か？
├── YES → React Native または Flutter を検討
└── NO → React + PWA が最もコスト効率が良い

Q4: チームの主要スキルは？
├── Java / Kotlin 経験が豊富 → Kotlin (Android)
└── JavaScript / TypeScript 経験が豊富 → React + PWA
```

### 最終比較表

| 判断基準 | Kotlin (Android) 有利 | React + PWA 有利 |
|---------|----------------------|-----------------|
| **配布対象** | Android のみ | Web / 全デバイス |
| **必要な機能** | NFC・AR・Bluetooth等 | カメラ・GPS・音声程度 |
| **ストア配布** | 必要 | 不要 |
| **チームスキル** | Java/Kotlin 経験者 | JS/TS 経験者 |
| **更新頻度** | 月次以下 | 週次・日次 |
| **開発コスト** | Android専任チーム | フルスタック1人でも可 |
| **オフライン** | 完全対応（ネイティブ） | Service Workerで対応 |
| **パフォーマンス重視** | 高負荷処理あり | 一般的なCRUDアプリ |

### 本プロジェクト（IPA単語帳）への結論

**React + TypeScript + PWA を選択する理由：**

1. **要件が PWA で十分に満たせる** - カメラ・GPS・Bluetooth 等の高度なデバイス API 不要
2. **Web Speech API（音声合成）が利用可能** - IPA 用語の読み上げに対応
3. **1つのコードベースで全デバイス対応** - PC・スマートフォン・タブレット
4. **即時更新** - 単語データの追加・修正をストア審査なしに反映
5. **URL共有** - 特定のカテゴリへの直接リンクが可能
6. **学習コスト** - TypeScript/React の知識が Web 開発全般に応用できる

---

## まとめ

| 観点 | Kotlin/Android | React/PWA |
|------|---------------|-----------|
| 学習曲線 | Java経験者には緩やか | JS経験者には緩やか |
| 型安全性 | 非常に強い（Kotlin） | TypeScriptで担保 |
| UIの書き方 | Compose（Reactに近い） | JSX（Composeに近い） |
| 状態管理 | ViewModel + StateFlow | カスタムフック + useState |
| 非同期処理 | Coroutines + Flow | async/await + Promise |
| テスト | JUnit + Espresso | Vitest + RTL |
| パフォーマンス | ネイティブ最高 | Web標準（十分な場合が多い） |
| 開発環境 | Android Studio | VSCode（軽量） |
| デバッグ | Android Studio Debugger | Chrome DevTools |
| 概念の共通性 | **非常に高い** — 両者とも宣言的UI・リアクティブ状態管理という同じ設計思想を持つ |
