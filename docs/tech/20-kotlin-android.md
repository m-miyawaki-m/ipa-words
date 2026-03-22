# Kotlin移行ガイド — Android開発実践編

[18-kotlin-fundamentals.md](18-kotlin-fundamentals.md)（基礎編）と
[19-kotlin-advanced.md](19-kotlin-advanced.md)（応用編）を踏まえ、
Android 開発の実践を学ぶ。Jetpack Compose、アーキテクチャコンポーネント、
そして本プロジェクト（IPA単語帳）をAndroid/Kotlinで実装する場合の具体例を示す。

---

## 1. Android 開発の全体像（2026年時点）

### 1.1 Android 開発の進化

```
2008年  Android 1.0 リリース — Java + XML レイアウト
2011年  Fragments 導入 — 画面分割・再利用
2014年  Material Design 発表
2017年  Kotlin 公式サポート
2018年  Jetpack ライブラリ群 登場
2019年  Google「Kotlin-first」宣言
2020年  Jetpack Compose アルファ版
2021年  Jetpack Compose 1.0 安定版
2023年  Compose Multiplatform 安定版
2024年  Compose 2.0 — パフォーマンス大幅改善
2025年  Kotlin 2.x + Compose がデファクトスタンダード化

【現在の推奨スタック】
  UI層:         Jetpack Compose（XMLレイアウトは新規プロジェクトでは非推奨）
  言語:         Kotlin（Javaは新規プロジェクトでは非推奨）
  アーキテクチャ: MVVM + Clean Architecture
  状態管理:     StateFlow + ViewModel
  DI:           Hilt
  ナビゲーション: Navigation Compose
  データ:       Room + DataStore
  ネットワーク:  Ktor / Retrofit + kotlinx.serialization
```

### 1.2 Jetpack ライブラリ群の概要

```
┌──────────────────────────────────────────────────┐
│ Jetpack ライブラリ群（Google 公式）               │
├──────────────────────────────────────────────────┤
│                                                  │
│ 【UI】                                           │
│   Compose UI ········ 宣言的UIフレームワーク      │
│   Compose Material3 · Material Design 3          │
│   Compose Navigation  画面遷移                   │
│                                                  │
│ 【アーキテクチャ】                                │
│   ViewModel ·········· UI状態の管理               │
│   Lifecycle ·········· ライフサイクル管理         │
│   Navigation ········· 画面遷移                  │
│   Hilt ··············· 依存性注入(DI)            │
│                                                  │
│ 【データ】                                       │
│   Room ··············· SQLite ラッパー           │
│   DataStore ·········· Key-Value ストレージ      │
│   WorkManager ········ バックグラウンド処理       │
│   Paging ············· ページング                │
│                                                  │
│ 【その他】                                       │
│   CameraX ············ カメラ                    │
│   Media3 ············· メディア再生              │
│   Biometric ·········· 生体認証                  │
└──────────────────────────────────────────────────┘
```

### 1.3 アーキテクチャの推奨パターン（MVVM + Clean Architecture）

```
┌───────────────────────────────────────────────┐
│                   UI Layer                     │
│  ┌─────────────┐    ┌─────────────────────┐   │
│  │  Composable  │ ←→ │     ViewModel       │   │
│  │  Functions   │    │   (StateFlow)        │   │
│  └─────────────┘    └──────────┬──────────┘   │
│                                │               │
├────────────────────────────────┼───────────────┤
│                  Domain Layer  │               │
│                    ┌───────────▼──────────┐    │
│                    │     UseCase          │    │
│                    │  (ビジネスロジック)    │    │
│                    └───────────┬──────────┘    │
│                                │               │
├────────────────────────────────┼───────────────┤
│                   Data Layer   │               │
│  ┌─────────────┐    ┌─────────▼───────────┐   │
│  │    Room      │ ←→ │    Repository       │   │
│  │  (SQLite)    │    │  (データ取得の抽象)  │   │
│  └─────────────┘    └─────────────────────┘   │
│  ┌─────────────┐                               │
│  │  Retrofit    │  ← ネットワーク               │
│  └─────────────┘                               │
└───────────────────────────────────────────────┘
```

```kotlin
// 各層の責務

// UI Layer: 表示のみ。ロジックは持たない
@Composable
fun WordListScreen(viewModel: WordListViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // uiState を表示するだけ
}

// ViewModel: UI の状態管理
class WordListViewModel(
    private val getWordsUseCase: GetWordsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(WordListUiState())
    val uiState: StateFlow<WordListUiState> = _uiState.asStateFlow()
}

// UseCase: ビジネスロジック
class GetWordsUseCase(
    private val repository: WordRepository
) {
    suspend operator fun invoke(category: String?): List<Word> {
        return repository.getWords(category)
    }
}

// Repository: データソースの抽象化
class WordRepositoryImpl(
    private val wordDao: WordDao
) : WordRepository {
    override suspend fun getWords(category: String?): List<Word> {
        return if (category != null) {
            wordDao.getByCategory(category)
        } else {
            wordDao.getAll()
        }
    }
}
```

---

## 2. Jetpack Compose

### 2.1 Compose とは

```
【XMLレイアウト（従来）】           【Jetpack Compose（現在）】
  命令的UI                          宣言的UI

  // XML でレイアウト定義             // Kotlin コードでUI定義
  <LinearLayout>                    @Composable
    <TextView                       fun Greeting() {
      android:id="@+id/text"          Column {
      android:text="Hello" />           Text("Hello")
    <Button                              Button(onClick = {}) {
      android:id="@+id/btn" />              Text("Click me")
  </LinearLayout>                       }
                                      }
  // Activity で操作                  }
  TextView tv = findViewById(...)
  tv.setText("Hello")

【React との類似点】
  React                              Compose
  ─────                              ─────────
  JSX                                @Composable 関数
  useState                           remember + mutableStateOf
  useEffect                          LaunchedEffect / SideEffect
  props                              関数の引数
  コンポーネント                      Composable 関数
  再レンダリング                      リコンポジション
  Virtual DOM                        Slot Table
```

### 2.2 @Composable 関数

```kotlin
// @Composable: UIを定義する関数
// React のコンポーネントに相当する

// シンプルなComposable
@Composable
fun Greeting(name: String) {
    Text(text = "Hello, $name!")
}

// 引数でカスタマイズ（React の props に相当）
@Composable
fun UserCard(
    user: User,
    onClick: () -> Unit,
    modifier: Modifier = Modifier     // Modifier はデフォルト引数で渡す
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(8.dp),
        onClick = onClick
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = user.name,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = user.email,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
```

```tsx
// React 相当
function UserCard({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <div className="card" onClick={onClick}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

### 2.3 基本コンポーネント

```kotlin
// Text: テキスト表示
Text(
    text = "Hello, World!",
    fontSize = 24.sp,
    fontWeight = FontWeight.Bold,
    color = Color.Red,
    textAlign = TextAlign.Center,
    maxLines = 2,
    overflow = TextOverflow.Ellipsis
)

// Button: ボタン
Button(
    onClick = { /* クリック時の処理 */ },
    colors = ButtonDefaults.buttonColors(
        containerColor = MaterialTheme.colorScheme.primary
    )
) {
    Icon(Icons.Default.Add, contentDescription = null)
    Spacer(Modifier.width(8.dp))
    Text("追加")
}

// TextField: テキスト入力
var text by remember { mutableStateOf("") }
TextField(
    value = text,
    onValueChange = { text = it },
    label = { Text("名前") },
    placeholder = { Text("名前を入力してください") }
)

// Column: 縦並び（CSS flexbox column）
Column(
    modifier = Modifier.fillMaxSize(),
    verticalArrangement = Arrangement.Center,
    horizontalAlignment = Alignment.CenterHorizontally
) {
    Text("Item 1")
    Text("Item 2")
    Text("Item 3")
}

// Row: 横並び（CSS flexbox row）
Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.SpaceBetween,
    verticalAlignment = Alignment.CenterVertically
) {
    Text("Left")
    Text("Right")
}

// Box: 重ね合わせ（CSS position relative/absolute）
Box(
    modifier = Modifier.size(200.dp),
    contentAlignment = Alignment.Center
) {
    Image(painter = painterResource(R.drawable.bg), contentDescription = null)
    Text("Overlay Text", color = Color.White)
}

// LazyColumn: 仮想スクロールリスト（RecyclerView の代替）
LazyColumn {
    items(users) { user ->
        UserCard(user = user, onClick = { })
    }
}
```

```tsx
// React 相当（LazyColumn → 仮想化リスト）
// React では react-window や react-virtuoso 等のライブラリが必要
import { FixedSizeList } from 'react-window';

function UserList({ users }: { users: User[] }) {
  return (
    <FixedSizeList height={600} width={400} itemCount={users.length} itemSize={80}>
      {({ index, style }) => (
        <div style={style}>
          <UserCard user={users[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### 2.4 Modifier

```kotlin
// Modifier: Composable のレイアウト・見た目・動作を設定するチェーン
// CSS + HTML属性 を1つにまとめたようなもの

Text(
    text = "Hello",
    modifier = Modifier
        // レイアウト
        .fillMaxWidth()                     // width: 100%
        .height(56.dp)                      // height: 56dp
        .padding(horizontal = 16.dp, vertical = 8.dp)  // padding
        .offset(x = 4.dp, y = 2.dp)        // position offset

        // デコレーション
        .background(Color.LightGray, RoundedCornerShape(8.dp))  // background + border-radius
        .border(1.dp, Color.Gray, RoundedCornerShape(8.dp))      // border
        .shadow(4.dp, RoundedCornerShape(8.dp))                  // box-shadow
        .clip(RoundedCornerShape(8.dp))                          // overflow: hidden

        // インタラクション
        .clickable { /* onClick */ }         // onClick
        .scrollable(rememberScrollState(), Orientation.Vertical) // scroll
)

// Modifier の順序が重要（CSS と異なる）
Modifier
    .padding(8.dp)        // 外側のpadding
    .background(Color.Red) // 背景（padding の内側に適用）
    .padding(16.dp)       // 内側のpadding

// ↑ は CSS で言うと:
// padding: 8px;
// background: red;  ← padding の内側
// padding: 16px;    ← background の内側
```

### 2.5 State（remember, mutableStateOf）

```kotlin
// Compose の状態管理（React の useState に相当）

// useState 相当
@Composable
fun Counter() {
    // remember: リコンポジション間で値を保持
    // mutableStateOf: 変更を監視可能な状態
    var count by remember { mutableStateOf(0) }

    Column {
        Text("Count: $count")
        Button(onClick = { count++ }) {
            Text("Increment")
        }
    }
}

// rememberSaveable: 画面回転でも値を保持（localStorage 的）
@Composable
fun SearchBar() {
    var query by rememberSaveable { mutableStateOf("") }

    TextField(
        value = query,
        onValueChange = { query = it },
        placeholder = { Text("検索...") }
    )
}

// 状態の巻き上げ（State Hoisting — React の「状態の持ち上げ」と同じ概念）
@Composable
fun CounterScreen() {
    var count by remember { mutableStateOf(0) }
    Counter(
        count = count,
        onIncrement = { count++ }
    )
}

@Composable
fun Counter(count: Int, onIncrement: () -> Unit) {
    // 状態を持たない（stateless）Composable
    Column {
        Text("Count: $count")
        Button(onClick = onIncrement) {
            Text("Increment")
        }
    }
}
```

```tsx
// React 相当
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  );
}
```

### 2.6 リコンポジション

```kotlin
// リコンポジション = React の再レンダリング
// 状態が変更されると、その状態を使っている Composable だけが再実行される

@Composable
fun ParentScreen() {
    var name by remember { mutableStateOf("") }
    var age by remember { mutableStateOf(0) }

    Column {
        // name が変わると NameDisplay だけリコンポジション
        NameDisplay(name = name)

        // age が変わると AgeDisplay だけリコンポジション
        AgeDisplay(age = age)

        // この部分は name と age の両方に依存
        Button(onClick = { name = "Kotlin"; age = 10 }) {
            Text("Update")
        }
    }
}

// 最適化: key を使ったリコンポジション制御（React の key に相当）
LazyColumn {
    items(users, key = { it.id }) { user ->
        // key により、リスト内の要素の追加/削除/移動が効率的になる
        UserCard(user = user)
    }
}

// derivedStateOf: 派生状態（React の useMemo に相当）
@Composable
fun FilteredList(items: List<String>, query: String) {
    // query や items が変わった時だけ再計算
    val filtered by remember(items, query) {
        derivedStateOf {
            items.filter { it.contains(query, ignoreCase = true) }
        }
    }
    // ...
}
```

### 2.7 テーマ（MaterialTheme）

```kotlin
// テーマ定義
@Composable
fun IpaWordsTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = Color(0xFF90CAF9),
            secondary = Color(0xFF80CBC4),
            background = Color(0xFF121212)
        )
    } else {
        lightColorScheme(
            primary = Color(0xFF1976D2),
            secondary = Color(0xFF00897B),
            background = Color(0xFFFAFAFA)
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(
            headlineMedium = TextStyle(
                fontWeight = FontWeight.Bold,
                fontSize = 24.sp
            )
        ),
        content = content
    )
}

// テーマの使用
@Composable
fun MyScreen() {
    Text(
        text = "Title",
        color = MaterialTheme.colorScheme.primary,
        style = MaterialTheme.typography.headlineMedium
    )
}
```

```tsx
// React 相当（CSS Modules / styled-components）
// CSSでテーマを管理
// :root { --color-primary: #1976D2; }
// .title { color: var(--color-primary); font-size: 24px; }
```

### 2.8 ナビゲーション

```kotlin
// Navigation Compose: 画面遷移
@Composable
fun IpaWordsNavHost(
    navController: NavHostController = rememberNavController()
) {
    NavHost(
        navController = navController,
        startDestination = "wordList"
    ) {
        composable("wordList") {
            WordListScreen(
                onWordClick = { wordId ->
                    navController.navigate("wordDetail/$wordId")
                }
            )
        }
        composable(
            route = "wordDetail/{wordId}",
            arguments = listOf(navArgument("wordId") { type = NavType.IntType })
        ) { backStackEntry ->
            val wordId = backStackEntry.arguments?.getInt("wordId") ?: return@composable
            WordDetailScreen(wordId = wordId)
        }
        composable("quiz") {
            QuizScreen()
        }
        composable("progress") {
            ProgressScreen()
        }
    }
}

// ボトムナビゲーション
@Composable
fun MainScreen() {
    val navController = rememberNavController()

    Scaffold(
        bottomBar = {
            NavigationBar {
                val currentRoute = navController.currentBackStackEntryAsState()
                    .value?.destination?.route

                NavigationBarItem(
                    icon = { Icon(Icons.Default.List, "単語一覧") },
                    label = { Text("単語") },
                    selected = currentRoute == "wordList",
                    onClick = { navController.navigate("wordList") }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Quiz, "クイズ") },
                    label = { Text("クイズ") },
                    selected = currentRoute == "quiz",
                    onClick = { navController.navigate("quiz") }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.BarChart, "進捗") },
                    label = { Text("進捗") },
                    selected = currentRoute == "progress",
                    onClick = { navController.navigate("progress") }
                )
            }
        }
    ) { paddingValues ->
        IpaWordsNavHost(
            navController = navController,
            modifier = Modifier.padding(paddingValues)
        )
    }
}
```

```tsx
// React Router 相当
// <BrowserRouter>
//   <Routes>
//     <Route path="/words" element={<WordListPage />} />
//     <Route path="/quiz" element={<QuizPage />} />
//     <Route path="/progress" element={<ProgressPage />} />
//   </Routes>
//   <TabNavigation />
// </BrowserRouter>
```

### 2.9 従来のXMLレイアウトとの比較

```xml
<!-- 従来: XMLレイアウト + Kotlin Activity -->
<!-- res/layout/activity_word_list.xml -->
<LinearLayout
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <EditText
        android:id="@+id/searchField"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="検索..." />

    <RecyclerView
        android:id="@+id/wordList"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</LinearLayout>
```

```kotlin
// 従来: Activity でXMLを操作
class WordListActivity : AppCompatActivity() {
    private lateinit var binding: ActivityWordListBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityWordListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.searchField.addTextChangedListener { text ->
            viewModel.search(text.toString())
        }

        binding.wordList.adapter = wordAdapter
        binding.wordList.layoutManager = LinearLayoutManager(this)
    }
}
```

```kotlin
// 現在: Compose で完結（XMLファイル不要）
@Composable
fun WordListScreen(viewModel: WordListViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Column {
        TextField(
            value = uiState.searchQuery,
            onValueChange = { viewModel.search(it) },
            placeholder = { Text("検索...") }
        )
        LazyColumn {
            items(uiState.words) { word ->
                WordCard(word = word)
            }
        }
    }
}
// XMLファイル、Activity の boilerplate、ViewBinding 全て不要！
```

---

## 3. アーキテクチャコンポーネント

### 3.1 ViewModel

```kotlin
// ViewModel: UI の状態を管理し、画面回転でも状態を保持する
// React の Context + useReducer に近い

data class WordListUiState(
    val words: List<Word> = emptyList(),
    val searchQuery: String = "",
    val selectedCategory: String? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class WordListViewModel @Inject constructor(
    private val wordRepository: WordRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(WordListUiState())
    val uiState: StateFlow<WordListUiState> = _uiState.asStateFlow()

    init {
        loadWords()
    }

    fun search(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadWords()
    }

    fun selectCategory(category: String?) {
        _uiState.update { it.copy(selectedCategory = category) }
        loadWords()
    }

    private fun loadWords() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val words = wordRepository.getWords(
                    query = _uiState.value.searchQuery,
                    category = _uiState.value.selectedCategory
                )
                _uiState.update { it.copy(words = words, isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message, isLoading = false) }
            }
        }
    }
}
```

```tsx
// React 相当（useReducer + Context）
interface WordListState {
  words: Word[];
  searchQuery: string;
  selectedCategory: string | null;
  isLoading: boolean;
  error: string | null;
}

function useWordList() {
  const [state, setState] = useState<WordListState>({
    words: [], searchQuery: '', selectedCategory: null,
    isLoading: false, error: null,
  });

  const search = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    loadWords(query, state.selectedCategory);
  };

  // ...
}
```

### 3.2 StateFlow / LiveData

```kotlin
// StateFlow: 状態を保持し、変更を通知する（現在の推奨）
class CounterViewModel : ViewModel() {
    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    fun increment() {
        _count.value++
    }
}

// Compose での収集
@Composable
fun CounterScreen(viewModel: CounterViewModel = hiltViewModel()) {
    val count by viewModel.count.collectAsStateWithLifecycle()

    Text("Count: $count")
    Button(onClick = { viewModel.increment() }) {
        Text("Increment")
    }
}

// LiveData: 従来の方法（Compose では StateFlow が推奨）
class CounterViewModel : ViewModel() {
    private val _count = MutableLiveData(0)
    val count: LiveData<Int> = _count

    fun increment() {
        _count.value = (_count.value ?: 0) + 1
    }
}

// LiveData を Compose で使う場合
@Composable
fun CounterScreen(viewModel: CounterViewModel) {
    val count by viewModel.count.observeAsState(initial = 0)
    Text("Count: $count")
}
```

### 3.3 Room（SQLite ラッパー）

```kotlin
// Room: SQLite を型安全に扱うORM
// 3つの要素: Entity, DAO, Database

// 1. Entity（テーブル定義）
@Entity(tableName = "words")
data class WordEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val name: String,
    val description: String,
    val category: String,
    val difficulty: Int = 1,
    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis()
)

// 2. DAO（データアクセス）
@Dao
interface WordDao {
    @Query("SELECT * FROM words ORDER BY name ASC")
    fun getAll(): Flow<List<WordEntity>>       // Flow で変更をリアルタイム監視

    @Query("SELECT * FROM words WHERE category = :category")
    fun getByCategory(category: String): Flow<List<WordEntity>>

    @Query("SELECT * FROM words WHERE name LIKE '%' || :query || '%'")
    fun search(query: String): Flow<List<WordEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(word: WordEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(words: List<WordEntity>)

    @Update
    suspend fun update(word: WordEntity)

    @Delete
    suspend fun delete(word: WordEntity)

    @Query("SELECT COUNT(*) FROM words")
    suspend fun count(): Int

    @Query("SELECT DISTINCT category FROM words")
    fun getCategories(): Flow<List<String>>
}

// 3. Database
@Database(entities = [WordEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun wordDao(): WordDao
}

// Database の初期化（Hilt モジュール内で）
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "ipa-words-db"
        ).build()
    }

    @Provides
    fun provideWordDao(database: AppDatabase): WordDao {
        return database.wordDao()
    }
}
```

```tsx
// React/PWA 相当: localStorage または IndexedDB
// src/hooks/useTerms.ts
function useTerms() {
  const [terms, setTerms] = useState<Term[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('terms');
    if (saved) setTerms(JSON.parse(saved));
  }, []);
  // ...
}
```

### 3.4 DataStore

```kotlin
// DataStore: SharedPreferences の後継（型安全、非同期、Flow ベース）

// Preferences DataStore（Key-Value）
@Module
@InstallIn(SingletonComponent::class)
object DataStoreModule {
    private val Context.dataStore by preferencesDataStore(name = "settings")

    @Provides
    @Singleton
    fun provideDataStore(@ApplicationContext context: Context): DataStore<Preferences> {
        return context.dataStore
    }
}

class SettingsRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        val DARK_MODE = booleanPreferencesKey("dark_mode")
        val QUIZ_COUNT = intPreferencesKey("quiz_count")
        val LAST_CATEGORY = stringPreferencesKey("last_category")
    }

    // 読み取り（Flow で変更を監視）
    val darkMode: Flow<Boolean> = dataStore.data.map { prefs ->
        prefs[DARK_MODE] ?: false
    }

    // 書き込み
    suspend fun setDarkMode(enabled: Boolean) {
        dataStore.edit { prefs ->
            prefs[DARK_MODE] = enabled
        }
    }
}
```

```tsx
// React/PWA 相当: localStorage
// const [darkMode, setDarkMode] = useState(
//   () => localStorage.getItem('darkMode') === 'true'
// );
```

### 3.5 WorkManager

```kotlin
// WorkManager: 確実にバックグラウンド処理を実行する
// アプリが終了しても、端末が再起動しても実行される

class SyncWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        return try {
            val repository = // DI で取得
            repository.syncWithServer()
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()     // リトライ
            } else {
                Result.failure()   // 失敗
            }
        }
    }
}

// WorkManager の登録
fun scheduleSyncWork(context: Context) {
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)  // ネットワーク接続時のみ
        .setRequiresBatteryNotLow(true)                 // バッテリー低下時は実行しない
        .build()

    val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
        repeatInterval = 1, repeatIntervalTimeUnit = TimeUnit.HOURS
    )
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.MINUTES)
        .build()

    WorkManager.getInstance(context)
        .enqueueUniquePeriodicWork("sync", ExistingPeriodicWorkPolicy.KEEP, syncRequest)
}
```

### 3.6 Hilt（依存性注入）

```kotlin
// Hilt: Dagger ベースの DI フレームワーク
// Spring の @Autowired に近い概念

// Application クラスにアノテーション
@HiltAndroidApp
class IpaWordsApp : Application()

// モジュール: 依存関係の提供方法を定義
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides
    @Singleton
    fun provideWordRepository(
        wordDao: WordDao
    ): WordRepository {
        return WordRepositoryImpl(wordDao)
    }
}

// ViewModel での注入
@HiltViewModel
class WordListViewModel @Inject constructor(
    private val wordRepository: WordRepository    // 自動で注入される
) : ViewModel() {
    // ...
}

// Activity での使用
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            IpaWordsTheme {
                MainScreen()
            }
        }
    }
}
```

```java
// Java/Spring 相当
@Service
public class WordService {
    @Autowired
    private WordRepository wordRepository;   // Spring DI
}
```

---

## 4. 本プロジェクト（IPA単語帳）をAndroid/Kotlinで作る場合

### 4.1 プロジェクト構成の詳細

```
ipa-words-android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   └── java/com/example/ipawords/
│   │       ├── IpaWordsApp.kt                    # @HiltAndroidApp
│   │       ├── MainActivity.kt                   # エントリーポイント
│   │       │
│   │       ├── data/                             # データ層
│   │       │   ├── local/
│   │       │   │   ├── AppDatabase.kt            # Room Database
│   │       │   │   ├── WordDao.kt                # DAO
│   │       │   │   ├── ProgressDao.kt
│   │       │   │   └── entity/
│   │       │   │       ├── WordEntity.kt          # Entity
│   │       │   │       └── ProgressEntity.kt
│   │       │   └── repository/
│   │       │       ├── WordRepository.kt          # インターフェース
│   │       │       ├── WordRepositoryImpl.kt      # 実装
│   │       │       ├── ProgressRepository.kt
│   │       │       └── ProgressRepositoryImpl.kt
│   │       │
│   │       ├── domain/                           # ドメイン層
│   │       │   ├── model/
│   │       │   │   ├── Word.kt                    # ドメインモデル
│   │       │   │   ├── QuizQuestion.kt
│   │       │   │   └── Progress.kt
│   │       │   └── usecase/
│   │       │       ├── GetWordsUseCase.kt
│   │       │       ├── SearchWordsUseCase.kt
│   │       │       ├── GenerateQuizUseCase.kt
│   │       │       └── UpdateProgressUseCase.kt
│   │       │
│   │       ├── ui/                               # UI層
│   │       │   ├── navigation/
│   │       │   │   └── IpaWordsNavHost.kt         # ナビゲーション
│   │       │   ├── theme/
│   │       │   │   ├── Color.kt
│   │       │   │   ├── Theme.kt
│   │       │   │   └── Type.kt
│   │       │   ├── wordlist/
│   │       │   │   ├── WordListScreen.kt          # Compose UI
│   │       │   │   ├── WordListViewModel.kt       # ViewModel
│   │       │   │   └── components/
│   │       │   │       ├── WordCard.kt
│   │       │   │       ├── SearchBar.kt
│   │       │   │       └── CategoryFilter.kt
│   │       │   ├── quiz/
│   │       │   │   ├── QuizScreen.kt
│   │       │   │   ├── QuizViewModel.kt
│   │       │   │   └── components/
│   │       │   │       ├── FlashCard.kt
│   │       │   │       └── MultipleChoice.kt
│   │       │   └── progress/
│   │       │       ├── ProgressScreen.kt
│   │       │       └── ProgressViewModel.kt
│   │       │
│   │       └── di/                               # DI モジュール
│   │           ├── DatabaseModule.kt
│   │           └── RepositoryModule.kt
│   │
│   ├── src/test/                                 # 単体テスト
│   │   └── java/com/example/ipawords/
│   │       ├── viewmodel/
│   │       │   ├── WordListViewModelTest.kt
│   │       │   └── QuizViewModelTest.kt
│   │       └── repository/
│   │           └── WordRepositoryTest.kt
│   │
│   └── src/androidTest/                          # UIテスト
│       └── java/com/example/ipawords/
│           ├── WordListScreenTest.kt
│           └── QuizScreenTest.kt
│
├── build.gradle.kts                              # ルート build
├── app/build.gradle.kts                          # アプリ build
├── gradle/libs.versions.toml                     # Version Catalog
└── settings.gradle.kts
```

### 4.2 各画面のCompose実装例

#### 単語一覧画面

```kotlin
// ui/wordlist/WordListScreen.kt
@Composable
fun WordListScreen(
    viewModel: WordListViewModel = hiltViewModel(),
    onWordClick: (Int) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        // 検索バー
        SearchBar(
            query = uiState.searchQuery,
            onQueryChange = { viewModel.search(it) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        )

        // カテゴリフィルタ
        CategoryFilter(
            categories = uiState.categories,
            selectedCategory = uiState.selectedCategory,
            onCategorySelect = { viewModel.selectCategory(it) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
        )

        // 単語リスト
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (uiState.words.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "単語が見つかりません",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(uiState.words, key = { it.id }) { word ->
                    WordCard(
                        word = word,
                        onClick = { onWordClick(word.id) },
                        modifier = Modifier.animateItem()
                    )
                }
            }
        }
    }
}

// ui/wordlist/components/SearchBar.kt
@Composable
fun SearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    TextField(
        value = query,
        onValueChange = onQueryChange,
        modifier = modifier,
        placeholder = { Text("単語を検索...") },
        leadingIcon = { Icon(Icons.Default.Search, contentDescription = "検索") },
        trailingIcon = {
            if (query.isNotEmpty()) {
                IconButton(onClick = { onQueryChange("") }) {
                    Icon(Icons.Default.Clear, contentDescription = "クリア")
                }
            }
        },
        singleLine = true,
        shape = RoundedCornerShape(12.dp),
        colors = TextFieldDefaults.colors(
            focusedIndicatorColor = Color.Transparent,
            unfocusedIndicatorColor = Color.Transparent
        )
    )
}

// ui/wordlist/components/CategoryFilter.kt
@Composable
fun CategoryFilter(
    categories: List<String>,
    selectedCategory: String?,
    onCategorySelect: (String?) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            FilterChip(
                selected = selectedCategory == null,
                onClick = { onCategorySelect(null) },
                label = { Text("すべて") }
            )
        }
        items(categories) { category ->
            FilterChip(
                selected = selectedCategory == category,
                onClick = { onCategorySelect(category) },
                label = { Text(category) }
            )
        }
    }
}

// ui/wordlist/components/WordCard.kt
@Composable
fun WordCard(
    word: Word,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = word.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = word.category,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = word.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}
```

```tsx
// React/PWA 相当: src/pages/WordListPage.tsx
// function WordListPage() {
//   const { filteredTerms } = useFilter();
//   return (
//     <div>
//       <SearchBar />
//       <CategoryFilter />
//       {filteredTerms.map(term => <WordCard key={term.id} term={term} />)}
//     </div>
//   );
// }
```

#### クイズ画面

```kotlin
// ui/quiz/QuizScreen.kt
@Composable
fun QuizScreen(
    viewModel: QuizViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    when {
        uiState.isFinished -> {
            QuizResultScreen(
                correctCount = uiState.correctCount,
                totalCount = uiState.totalCount,
                onRetry = { viewModel.startNewQuiz() }
            )
        }
        uiState.currentQuestion != null -> {
            when (uiState.quizMode) {
                QuizMode.FLASH_CARD -> {
                    FlashCardQuiz(
                        question = uiState.currentQuestion!!,
                        isFlipped = uiState.isFlipped,
                        onFlip = { viewModel.flipCard() },
                        onCorrect = { viewModel.answer(true) },
                        onIncorrect = { viewModel.answer(false) },
                        progress = "${uiState.currentIndex + 1} / ${uiState.totalCount}"
                    )
                }
                QuizMode.MULTIPLE_CHOICE -> {
                    MultipleChoiceQuiz(
                        question = uiState.currentQuestion!!,
                        choices = uiState.choices,
                        selectedAnswer = uiState.selectedAnswer,
                        onAnswerSelect = { viewModel.selectAnswer(it) },
                        onConfirm = { viewModel.confirmAnswer() },
                        progress = "${uiState.currentIndex + 1} / ${uiState.totalCount}"
                    )
                }
            }
        }
    }
}

// ui/quiz/components/FlashCard.kt
@Composable
fun FlashCardQuiz(
    question: QuizQuestion,
    isFlipped: Boolean,
    onFlip: () -> Unit,
    onCorrect: () -> Unit,
    onIncorrect: () -> Unit,
    progress: String
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 進捗表示
        Text(
            text = progress,
            style = MaterialTheme.typography.labelLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(32.dp))

        // フラッシュカード
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(300.dp)
                .clickable { onFlip() },
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                if (!isFlipped) {
                    // 表面: 単語名
                    Text(
                        text = question.word.name,
                        style = MaterialTheme.typography.headlineLarge,
                        textAlign = TextAlign.Center
                    )
                } else {
                    // 裏面: 説明
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = question.word.name,
                            style = MaterialTheme.typography.titleLarge
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = question.word.description,
                            style = MaterialTheme.typography.bodyLarge,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = if (!isFlipped) "タップして答えを見る" else "",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.weight(1f))

        // 正解/不正解ボタン（裏面のみ表示）
        if (isFlipped) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                Button(
                    onClick = onIncorrect,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Icon(Icons.Default.Close, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("不正解")
                }
                Button(onClick = onCorrect) {
                    Icon(Icons.Default.Check, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("正解")
                }
            }
        }
    }
}

// ui/quiz/components/MultipleChoice.kt
@Composable
fun MultipleChoiceQuiz(
    question: QuizQuestion,
    choices: List<String>,
    selectedAnswer: Int?,
    onAnswerSelect: (Int) -> Unit,
    onConfirm: () -> Unit,
    progress: String
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(text = progress, style = MaterialTheme.typography.labelLarge)

        Spacer(modifier = Modifier.height(32.dp))

        // 問題文
        Text(
            text = question.word.description,
            style = MaterialTheme.typography.headlineSmall,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "正しい用語を選んでください:",
            style = MaterialTheme.typography.bodyLarge
        )

        Spacer(modifier = Modifier.height(16.dp))

        // 選択肢
        choices.forEachIndexed { index, choice ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                onClick = { onAnswerSelect(index) },
                colors = CardDefaults.cardColors(
                    containerColor = if (selectedAnswer == index)
                        MaterialTheme.colorScheme.primaryContainer
                    else
                        MaterialTheme.colorScheme.surface
                ),
                border = if (selectedAnswer == index)
                    BorderStroke(2.dp, MaterialTheme.colorScheme.primary)
                else null
            ) {
                Text(
                    text = choice,
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // 確定ボタン
        Button(
            onClick = onConfirm,
            enabled = selectedAnswer != null,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("回答する")
        }
    }
}
```

#### 進捗画面

```kotlin
// ui/progress/ProgressScreen.kt
@Composable
fun ProgressScreen(
    viewModel: ProgressViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 全体の進捗
        item {
            OverallProgressCard(
                totalWords = uiState.totalWords,
                learnedWords = uiState.learnedWords,
                accuracy = uiState.overallAccuracy
            )
        }

        // カテゴリ別の進捗
        item {
            Text(
                text = "カテゴリ別進捗",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        items(uiState.categoryProgress) { progress ->
            CategoryProgressCard(progress = progress)
        }
    }
}

@Composable
fun OverallProgressCard(
    totalWords: Int,
    learnedWords: Int,
    accuracy: Float
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.primaryContainer
        )
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text(
                text = "学習進捗",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(16.dp))

            // 進捗バー
            val progress = if (totalWords > 0) learnedWords.toFloat() / totalWords else 0f
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(12.dp)
                    .clip(RoundedCornerShape(6.dp)),
                color = MaterialTheme.colorScheme.primary,
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("$learnedWords / $totalWords 単語")
                Text("${(progress * 100).toInt()}%")
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text("正答率: ${(accuracy * 100).toInt()}%")
        }
    }
}
```

### 4.3 データ層の定義例

```kotlin
// data/local/entity/WordEntity.kt
@Entity(tableName = "words")
data class WordEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Int = 0,
    val name: String,
    val description: String,
    val category: String,
    val difficulty: Int = 1
)

// data/local/entity/ProgressEntity.kt
@Entity(tableName = "progress")
data class ProgressEntity(
    @PrimaryKey
    val wordId: Int,
    val correctCount: Int = 0,
    val incorrectCount: Int = 0,
    val lastStudied: Long = 0,
    val mastered: Boolean = false
)

// data/local/WordDao.kt
@Dao
interface WordDao {
    @Query("SELECT * FROM words ORDER BY name")
    fun getAll(): Flow<List<WordEntity>>

    @Query("""
        SELECT * FROM words
        WHERE (:category IS NULL OR category = :category)
        AND (:query IS NULL OR name LIKE '%' || :query || '%'
             OR description LIKE '%' || :query || '%')
        ORDER BY name
    """)
    fun search(query: String?, category: String?): Flow<List<WordEntity>>

    @Query("SELECT DISTINCT category FROM words ORDER BY category")
    fun getCategories(): Flow<List<String>>

    @Query("SELECT * FROM words WHERE id IN (:ids)")
    suspend fun getByIds(ids: List<Int>): List<WordEntity>

    @Query("SELECT * FROM words ORDER BY RANDOM() LIMIT :count")
    suspend fun getRandom(count: Int): List<WordEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(words: List<WordEntity>)
}

// data/repository/WordRepositoryImpl.kt
class WordRepositoryImpl @Inject constructor(
    private val wordDao: WordDao
) : WordRepository {

    override fun getWords(query: String?, category: String?): Flow<List<Word>> {
        return wordDao.search(query, category).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun getCategories(): Flow<List<String>> {
        return wordDao.getCategories()
    }

    override suspend fun getQuizWords(count: Int): List<Word> {
        return wordDao.getRandom(count).map { it.toDomain() }
    }
}

// domain/model/Word.kt
data class Word(
    val id: Int,
    val name: String,
    val description: String,
    val category: String,
    val difficulty: Int
)

// Entity → Domain 変換
fun WordEntity.toDomain() = Word(
    id = id,
    name = name,
    description = description,
    category = category,
    difficulty = difficulty
)
```

```typescript
// React/PWA 相当: src/types/index.ts
// export interface Term {
//   id: number;
//   url: string;
//   name: string;
//   description: string;
//   category?: string;
// }
```

### 4.4 ViewModel の実装例

```kotlin
// ui/quiz/QuizViewModel.kt
data class QuizUiState(
    val quizMode: QuizMode = QuizMode.MULTIPLE_CHOICE,
    val currentQuestion: QuizQuestion? = null,
    val currentIndex: Int = 0,
    val totalCount: Int = 10,
    val choices: List<String> = emptyList(),
    val selectedAnswer: Int? = null,
    val isFlipped: Boolean = false,
    val correctCount: Int = 0,
    val isFinished: Boolean = false
)

enum class QuizMode { FLASH_CARD, MULTIPLE_CHOICE }

data class QuizQuestion(
    val word: Word,
    val correctAnswer: String
)

@HiltViewModel
class QuizViewModel @Inject constructor(
    private val wordRepository: WordRepository,
    private val progressRepository: ProgressRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(QuizUiState())
    val uiState: StateFlow<QuizUiState> = _uiState.asStateFlow()

    private var questions: List<QuizQuestion> = emptyList()

    init {
        startNewQuiz()
    }

    fun startNewQuiz() {
        viewModelScope.launch {
            val words = wordRepository.getQuizWords(10)
            questions = words.map { QuizQuestion(word = it, correctAnswer = it.name) }
            _uiState.value = QuizUiState(
                currentQuestion = questions.firstOrNull(),
                totalCount = questions.size
            )
            if (questions.isNotEmpty()) {
                generateChoices(0)
            }
        }
    }

    fun selectAnswer(index: Int) {
        _uiState.update { it.copy(selectedAnswer = index) }
    }

    fun confirmAnswer() {
        val state = _uiState.value
        val question = state.currentQuestion ?: return
        val selectedIndex = state.selectedAnswer ?: return

        val isCorrect = state.choices[selectedIndex] == question.correctAnswer
        val newCorrectCount = if (isCorrect) state.correctCount + 1 else state.correctCount

        viewModelScope.launch {
            progressRepository.recordAnswer(question.word.id, isCorrect)
        }

        moveToNext(newCorrectCount)
    }

    fun flipCard() {
        _uiState.update { it.copy(isFlipped = !it.isFlipped) }
    }

    fun answer(correct: Boolean) {
        val question = _uiState.value.currentQuestion ?: return
        val newCorrectCount = if (correct) _uiState.value.correctCount + 1
                              else _uiState.value.correctCount

        viewModelScope.launch {
            progressRepository.recordAnswer(question.word.id, correct)
        }

        moveToNext(newCorrectCount)
    }

    private fun moveToNext(correctCount: Int) {
        val nextIndex = _uiState.value.currentIndex + 1
        if (nextIndex >= questions.size) {
            _uiState.update { it.copy(isFinished = true, correctCount = correctCount) }
        } else {
            _uiState.update {
                it.copy(
                    currentIndex = nextIndex,
                    currentQuestion = questions[nextIndex],
                    selectedAnswer = null,
                    isFlipped = false,
                    correctCount = correctCount
                )
            }
            generateChoices(nextIndex)
        }
    }

    private fun generateChoices(questionIndex: Int) {
        val correct = questions[questionIndex].correctAnswer
        val wrongs = questions
            .filter { it.correctAnswer != correct }
            .shuffled()
            .take(3)
            .map { it.correctAnswer }
        val choices = (wrongs + correct).shuffled()
        _uiState.update { it.copy(choices = choices) }
    }
}
```

```typescript
// React/PWA 相当: src/hooks/useQuiz.ts
// function useQuiz() {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [score, setScore] = useState(0);
//   const [isFinished, setIsFinished] = useState(false);
//   // ...
// }
```

### 4.5 Navigation の設定例

```kotlin
// ui/navigation/IpaWordsNavHost.kt
sealed class Screen(val route: String) {
    data object WordList : Screen("wordList")
    data object Quiz : Screen("quiz")
    data object Progress : Screen("progress")
    data class WordDetail(val wordId: Int) : Screen("wordDetail/$wordId") {
        companion object {
            const val ROUTE = "wordDetail/{wordId}"
        }
    }
}

@Composable
fun IpaWordsNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Screen.WordList.route,
        modifier = modifier
    ) {
        composable(Screen.WordList.route) {
            WordListScreen(
                onWordClick = { wordId ->
                    navController.navigate("wordDetail/$wordId")
                }
            )
        }

        composable(
            route = Screen.WordDetail.ROUTE,
            arguments = listOf(
                navArgument("wordId") { type = NavType.IntType }
            )
        ) { backStackEntry ->
            val wordId = backStackEntry.arguments?.getInt("wordId") ?: return@composable
            WordDetailScreen(wordId = wordId)
        }

        composable(Screen.Quiz.route) {
            QuizScreen()
        }

        composable(Screen.Progress.route) {
            ProgressScreen()
        }
    }
}
```

### 4.6 テスト

```kotlin
// ViewModel のテスト（JUnit + Turbine）
@OptIn(ExperimentalCoroutinesApi::class)
class WordListViewModelTest {

    @get:Rule
    val mainDispatcherRule = MainDispatcherRule()

    private lateinit var viewModel: WordListViewModel
    private lateinit var fakeRepository: FakeWordRepository

    @Before
    fun setup() {
        fakeRepository = FakeWordRepository()
        viewModel = WordListViewModel(fakeRepository)
    }

    @Test
    fun `initial state should load all words`() = runTest {
        // Given
        fakeRepository.addWords(
            Word(1, "API", "Application Programming Interface", "Network", 1),
            Word(2, "DNS", "Domain Name System", "Network", 1)
        )

        // When
        viewModel = WordListViewModel(fakeRepository)

        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertEquals(2, state.words.size)
            assertFalse(state.isLoading)
        }
    }

    @Test
    fun `search should filter words`() = runTest {
        // Given
        fakeRepository.addWords(
            Word(1, "API", "Application Programming Interface", "Network", 1),
            Word(2, "DNS", "Domain Name System", "Network", 1)
        )
        viewModel = WordListViewModel(fakeRepository)

        // When
        viewModel.search("API")

        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertEquals(1, state.words.size)
            assertEquals("API", state.words.first().name)
        }
    }
}

// Compose UI テスト
class WordListScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun `should display word cards`() {
        // Given
        val words = listOf(
            Word(1, "API", "Application Programming Interface", "Network", 1),
            Word(2, "DNS", "Domain Name System", "Network", 1)
        )

        // When
        composeTestRule.setContent {
            IpaWordsTheme {
                // テスト用のデータを直接渡す
                WordListContent(
                    words = words,
                    searchQuery = "",
                    categories = listOf("Network"),
                    selectedCategory = null,
                    onSearch = {},
                    onCategorySelect = {},
                    onWordClick = {}
                )
            }
        }

        // Then
        composeTestRule.onNodeWithText("API").assertIsDisplayed()
        composeTestRule.onNodeWithText("DNS").assertIsDisplayed()
        composeTestRule.onNodeWithText("Application Programming Interface").assertIsDisplayed()
    }

    @Test
    fun `should filter by search query`() {
        composeTestRule.setContent {
            IpaWordsTheme {
                WordListScreen()
            }
        }

        // 検索フィールドにテキストを入力
        composeTestRule
            .onNodeWithContentDescription("検索")
            .performTextInput("API")

        // API が表示されていることを確認
        composeTestRule.onNodeWithText("API").assertIsDisplayed()
    }
}
```

```typescript
// React/PWA 相当: Vitest + React Testing Library
// describe('WordListPage', () => {
//   it('should display word cards', () => {
//     render(<WordListPage />);
//     expect(screen.getByText('API')).toBeInTheDocument();
//   });
// });
```

---

## 5. React/PWA版との詳細比較

### 5.1 ファイル対ファイルの対応表

| React/PWA (本プロジェクト) | Android/Kotlin | 役割 |
|---------------------------|----------------|------|
| `src/main.tsx` | `MainActivity.kt` | エントリーポイント |
| `src/App.tsx` | `IpaWordsNavHost.kt` | ルーティング |
| `src/types/index.ts` | `domain/model/Word.kt` | データ型定義 |
| `src/hooks/useTerms.ts` | `WordRepository.kt` | データ取得 |
| `src/hooks/useFilter.ts` | `WordListViewModel.kt` | フィルタ・検索ロジック |
| `src/hooks/useQuiz.ts` | `QuizViewModel.kt` | クイズロジック |
| `src/hooks/useProgress.ts` | `ProgressViewModel.kt` | 進捗管理 |
| `src/pages/WordListPage.tsx` | `WordListScreen.kt` | 単語一覧画面 |
| `src/pages/QuizPage.tsx` | `QuizScreen.kt` | クイズ画面 |
| `src/pages/ProgressPage.tsx` | `ProgressScreen.kt` | 進捗画面 |
| `src/components/WordCard.tsx` | `components/WordCard.kt` | 単語カード |
| `src/components/SearchBar.tsx` | `components/SearchBar.kt` | 検索バー |
| `src/components/CategoryFilter.tsx` | `components/CategoryFilter.kt` | カテゴリフィルタ |
| `src/components/FlashCard.tsx` | `components/FlashCard.kt` | フラッシュカード |
| `src/components/MultipleChoice.tsx` | `components/MultipleChoice.kt` | 4択問題 |
| `src/components/TabNavigation.tsx` | ボトムナビゲーション（Scaffold内） | タブ切替 |
| `*.module.css` | `Modifier` チェーン | スタイリング |
| `localStorage` | `Room` + `DataStore` | データ永続化 |
| `vite.config.ts` | `build.gradle.kts` | ビルド設定 |
| `package.json` | `gradle/libs.versions.toml` | 依存関係管理 |

### 5.2 コード行数の比較（概算）

| 項目 | React/PWA | Android/Kotlin | 備考 |
|------|-----------|----------------|------|
| エントリーポイント | ~10行 | ~20行 | Android はマニフェスト等が必要 |
| 型定義 | ~20行 | ~50行 | Entity + Domain Model + 変換 |
| データ層 | ~30行 | ~100行 | Room DAO + Repository パターン |
| 状態管理 | ~80行 | ~120行 | ViewModel は構造的だがやや冗長 |
| UI（画面） | ~200行 | ~300行 | Compose は JSX より若干冗長 |
| UI（コンポーネント） | ~150行 | ~200行 | Modifier がCSSより冗長 |
| ナビゲーション | ~20行 | ~50行 | Navigation Compose のセットアップ |
| スタイル | ~200行(CSS) | 0行(別ファイル) | Compose はインライン |
| ビルド設定 | ~30行 | ~80行 | Gradle は設定が多い |
| **合計** | **~740行** | **~920行** | Kotlin版は約1.2倍 |

### 5.3 開発体験の違い

| 観点 | React/PWA | Android/Kotlin |
|------|-----------|----------------|
| **ホットリロード** | Vite HMR（即時反映） | Compose Preview + Live Edit |
| **プレビュー** | ブラウザで確認 | Android Studio プレビュー |
| **ビルド時間** | ~1秒（HMR） | ~10-30秒（クリーンビルド） |
| **型チェック** | tsc（TypeScript） | Kotlin コンパイラ |
| **デバッグ** | Chrome DevTools | Android Studio Debugger |
| **テスト実行** | Vitest（~1秒） | JUnit + Espresso（~5-30秒） |
| **IDE** | VSCode（軽量） | Android Studio（重量級） |
| **メモリ使用** | VSCode ~500MB | Android Studio ~2-4GB |

> **VSCode で Android/Kotlin 開発はできる？**
> 「Kotlin Language」拡張機能でシンタックスハイライトや基本補完は動くが、**Compose プレビュー、エミュレータ統合管理、Layout Inspector 等の Android 専用ツールが使えない**ため、Android アプリ開発には Android Studio が事実上必須。サーバーサイド Kotlin（Ktor, Spring Boot）や CLI ツールなら VSCode でも十分実用的。詳細は [07-dev-environment.md](07-dev-environment.md) を参照。

### 5.4 テスト戦略の違い

| テスト種類 | React/PWA | Android/Kotlin |
|-----------|-----------|----------------|
| 単体テスト | Vitest | JUnit 5 + MockK |
| UIテスト | React Testing Library | Compose Testing |
| E2Eテスト | Playwright / Cypress | Espresso / UI Automator |
| スナップショット | Vitest Snapshot | Compose Preview Screenshot |
| CI実行時間 | ~1-2分 | ~5-15分 |

### 5.5 デプロイの違い

| 項目 | React/PWA | Android/Kotlin |
|------|-----------|----------------|
| ビルド成果物 | 静的ファイル（JS/CSS/HTML） | APK / AAB |
| 配布方法 | GitHub Pages / Vercel | Google Play Store |
| 更新方法 | git push → 即時反映 | ストア審査 → ユーザー手動更新 |
| 審査 | なし | Google Play 審査（数時間〜数日） |
| 費用 | 無料 | Google Play デベロッパー登録 $25（一回のみ） |
| オフライン対応 | Service Worker | ネイティブ対応 |
| インストール | ブラウザから「ホーム画面に追加」 | Play Store からインストール |

---

## 6. 実務のベストプラクティス

### 6.1 Kotlin コーディング規約（ktlint）

```kotlin
// ktlint: Kotlin のリンター＋フォーマッター（ESLint/Prettier に相当）

// build.gradle.kts に追加
plugins {
    id("org.jlleitschuh.gradle.ktlint") version "12.1.0"
}

// 主なルール:
// - インデント: スペース4つ
// - 最大行長: 120文字（デフォルト）
// - trailing comma: 推奨（diff が綺麗になる）
// - ワイルドカード import 禁止

// trailing comma の例
data class User(
    val name: String,
    val age: Int,
    val email: String,   // ← trailing comma（最後の要素にもカンマ）
)

// 実行
// ./gradlew ktlintCheck    # チェックのみ
// ./gradlew ktlintFormat   # 自動修正
```

### 6.2 Gradle の設定

```toml
# gradle/libs.versions.toml（Version Catalog）
# 依存関係のバージョンを一元管理する（package.json に相当）

[versions]
kotlin = "2.0.21"
compose-bom = "2024.12.01"
room = "2.7.0"
hilt = "2.51.1"
navigation = "2.8.5"
lifecycle = "2.8.7"
coroutines = "1.9.0"
junit = "5.11.3"

[libraries]
# Compose
compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "compose-bom" }
compose-ui = { group = "androidx.compose.ui", name = "ui" }
compose-material3 = { group = "androidx.compose.material3", name = "material3" }
compose-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }

# Room
room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

# Hilt
hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-compiler", version.ref = "hilt" }

# Navigation
navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigation" }

# Testing
junit = { group = "org.junit.jupiter", name = "junit-jupiter", version.ref = "junit" }

[plugins]
android-application = { id = "com.android.application", version = "8.7.3" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
room = { id = "androidx.room", version.ref = "room" }
```

```kotlin
// app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.room)
    kotlin("kapt")
}

android {
    namespace = "com.example.ipawords"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.ipawords"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    // Compose BOM（バージョンを一括管理）
    val composeBom = platform(libs.compose.bom)
    implementation(composeBom)
    implementation(libs.compose.ui)
    implementation(libs.compose.material3)
    implementation(libs.compose.preview)

    // Room
    implementation(libs.room.runtime)
    implementation(libs.room.ktx)
    kapt(libs.room.compiler)

    // Hilt
    implementation(libs.hilt.android)
    kapt(libs.hilt.compiler)

    // Navigation
    implementation(libs.navigation.compose)

    // Testing
    testImplementation(libs.junit)
}
```

### 6.3 CI/CD（GitHub Actions for Android）

```yaml
# .github/workflows/android.yml
name: Android CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v4

      - name: Run ktlint
        run: ./gradlew ktlintCheck

      - name: Run unit tests
        run: ./gradlew testDebugUnitTest

      - name: Build debug APK
        run: ./gradlew assembleDebug

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: debug-apk
          path: app/build/outputs/apk/debug/app-debug.apk

  ui-test:
    runs-on: ubuntu-latest
    needs: build

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Run UI tests (Emulator)
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 34
          script: ./gradlew connectedCheck
```

```yaml
# React/PWA 相当: .github/workflows/ci.yml
# jobs:
#   build:
#     steps:
#       - run: npm ci
#       - run: npm run lint
#       - run: npm run test
#       - run: npm run build
```

### 6.4 ProGuard / R8（難読化・最適化）

```kotlin
// build.gradle.kts
android {
    buildTypes {
        release {
            isMinifyEnabled = true       // R8 による難読化・最適化を有効化
            isShrinkResources = true     // 未使用リソースの削除
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}

// proguard-rules.pro
// Room の Entity は難読化しない
-keep class com.example.ipawords.data.local.entity.** { *; }

// Kotlin Serialization のクラスは難読化しない
-keepattributes *Annotation*
-keep class kotlinx.serialization.** { *; }

// R8 の効果:
// - APK サイズ: 50-80% 削減
// - コードの難読化（リバースエンジニアリング防止）
// - 未使用コードの削除（Tree Shaking — Vite の rollup と同じ概念）
```

### 6.5 Google Play Store 公開フロー

```
Step 1: 署名鍵の生成
  └── keytool でリリース用の keystore を生成
      keytool -genkey -v -keystore release.keystore \
        -alias ipawords -keyalg RSA -keysize 2048 -validity 10000

Step 2: リリースビルド
  └── ./gradlew bundleRelease（AAB 形式で出力）

Step 3: Google Play Console でアプリ登録
  ├── デベロッパーアカウント登録（$25 一回のみ）
  ├── アプリの基本情報入力
  │   ├── アプリ名、説明文
  │   ├── スクリーンショット（スマホ、タブレット）
  │   ├── アイコン（512x512）
  │   └── フィーチャーグラフィック（1024x500）
  ├── コンテンツレーティング（IARC）
  ├── プライバシーポリシー URL
  └── 対象年齢の設定

Step 4: AAB アップロード
  ├── 内部テスト → 限定公開テスト → オープンテスト → 本番
  └── 段階的にリリース範囲を広げる

Step 5: 審査
  ├── 自動審査: 数時間
  ├── 手動審査: 最大7日（初回）
  └── ポリシー違反があるとリジェクト

Step 6: 公開後
  ├── Google Play Console でクラッシュレポート確認
  ├── ANR（Application Not Responding）の監視
  ├── ユーザーレビューへの対応
  └── 段階的ロールアウトで安全に更新
```

```
React/PWA の場合:
  git push → GitHub Actions → GitHub Pages / Vercel に自動デプロイ
  審査なし、即時反映
```

---

## まとめ: 技術選定の判断基準

| 判断基準 | React/PWA を選ぶ場合 | Android/Kotlin を選ぶ場合 |
|---------|---------------------|--------------------------|
| 配布 | URL で簡単に共有したい | Play Store で配布したい |
| 対象端末 | iOS + Android + PC 全て | Android のみで OK |
| ネイティブ機能 | カメラ、通知程度で十分 | Bluetooth、NFC、バックグラウンド処理が必要 |
| 更新頻度 | 頻繁に更新したい | 安定版をリリースしたい |
| 開発速度 | 速く MVP を作りたい | 品質重視で作りたい |
| チーム | Web エンジニアが多い | Android エンジニアがいる |
| パフォーマンス | 一般的な用途で十分 | ゲーム等の高負荷アプリ |

**本プロジェクト（IPA単語帳）の場合:**
React/PWA が最適。理由は以下の通り。
- 全プラットフォームで使いたい（PC で学習、スマホで復習）
- ネイティブ機能は不要（単語帳はテキストベース）
- 頻繁にコンテンツを更新したい（新しい単語の追加）
- URL を共有するだけで使ってもらえる
- 1人で開発するなら Web の方が生産性が高い

ただし、Android / Kotlin / Compose を学ぶ教材としては本プロジェクトは最適なサイズ感。
基礎編・応用編で学んだ Kotlin の知識を、実際のアプリで試す良い練習になる。
