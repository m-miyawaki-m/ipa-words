# Kotlin移行ガイド — 応用編

[18-kotlin-fundamentals.md](18-kotlin-fundamentals.md)（言語基礎編）を理解した上で、
Kotlin のより高度な機能を Java との対比で学ぶ。
ラムダ、コレクション操作、コルーチン、ジェネリクス、DSL など、
実務で頻繁に使う Kotlin の強力な機能を網羅する。

---

## 1. ラムダと高階関数

### 1.1 ラムダ式の構文

```java
// Java: ラムダ式（Java 8+）
// 関数型インターフェースが必要
Runnable r = () -> System.out.println("Hello");

Function<String, Integer> strLen = s -> s.length();

BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// メソッド参照
Function<String, Integer> strLen2 = String::length;
```

```kotlin
// Kotlin: ラムダ式（関数型インターフェース不要）
val r: () -> Unit = { println("Hello") }

val strLen: (String) -> Int = { s -> s.length }

val add: (Int, Int) -> Int = { a, b -> a + b }

// 型推論と組み合わせ
val strLen2 = { s: String -> s.length }

// メソッド参照（関数参照）
val strLen3 = String::length

// ラムダの最後の式が戻り値
val transform: (String) -> String = { input ->
    val trimmed = input.trim()
    val upper = trimmed.uppercase()
    upper  // これが戻り値（return は書かない）
}
```

### 1.2 高階関数（関数を引数に取る/返す）

```java
// Java
public static <T> List<T> filter(List<T> list, Predicate<T> predicate) {
    List<T> result = new ArrayList<>();
    for (T item : list) {
        if (predicate.test(item)) {
            result.add(item);
        }
    }
    return result;
}

// 呼び出し
List<Integer> evens = filter(numbers, n -> n % 2 == 0);
```

```kotlin
// Kotlin: 関数型をそのまま引数に取れる
fun <T> filter(list: List<T>, predicate: (T) -> Boolean): List<T> {
    val result = mutableListOf<T>()
    for (item in list) {
        if (predicate(item)) {
            result.add(item)
        }
    }
    return result
}

// 呼び出し（最後の引数がラムダなら () の外に書ける — trailing lambda）
val evens = filter(numbers) { it % 2 == 0 }

// 関数を返す高階関数
fun multiplier(factor: Int): (Int) -> Int {
    return { number -> number * factor }
}

val double = multiplier(2)
val triple = multiplier(3)
println(double(5))    // 10
println(triple(5))    // 15
```

### 1.3 it キーワード

```kotlin
// ラムダのパラメータが1つの場合、it で参照できる
val numbers = listOf(1, 2, 3, 4, 5)

// 明示的なパラメータ名
numbers.filter { n -> n > 3 }

// it を使用（パラメータが1つなら省略可能）
numbers.filter { it > 3 }

// チェーンで使う
numbers
    .filter { it > 2 }
    .map { it * 10 }
    .forEach { println(it) }

// 注意: ネストしたラムダでは it が曖昧になるので明示的な名前を使う
listOf(listOf(1, 2), listOf(3, 4)).forEach { innerList ->
    innerList.forEach { item ->      // it だとどちらの it かわからない
        println(item)
    }
}
```

### 1.4 SAM変換（Java関数型インターフェースとの互換）

```java
// Java: 関数型インターフェース
@FunctionalInterface
public interface OnClickListener {
    void onClick(View view);
}

// ラムダで実装
button.setOnClickListener(view -> {
    System.out.println("Clicked!");
});
```

```kotlin
// Kotlin: Java の関数型インターフェースはラムダで渡せる（SAM変換）
button.setOnClickListener { view ->
    println("Clicked!")
}

// Kotlin で定義した interface は SAM変換されない（デフォルト）
interface MyCallback {
    fun onResult(data: String)
}

// fun interface にすると SAM変換可能になる（Kotlin 1.4+）
fun interface MyCallback {
    fun onResult(data: String)
}

// SAM変換で使える
fun process(callback: MyCallback) { /* ... */ }
process { data -> println(data) }   // ラムダで渡せる
```

### 1.5 クロージャ（変数のキャプチャ）

```java
// Java: ラムダから外部変数をキャプチャする場合、実質 final でなければならない
int count = 0;
// list.forEach(item -> count++);  // コンパイルエラー！count は final でない

// 回避策: AtomicInteger や配列を使う
AtomicInteger count2 = new AtomicInteger(0);
list.forEach(item -> count2.incrementAndGet());
```

```kotlin
// Kotlin: var でもキャプチャできる（Javaより柔軟）
var count = 0
list.forEach { count++ }        // OK！var をそのまま変更できる
println(count)                  // リストのサイズ

// 実用例: イベントカウンター
fun createCounter(): () -> Int {
    var count = 0
    return { ++count }          // count を閉じ込める
}

val counter = createCounter()
println(counter())   // 1
println(counter())   // 2
println(counter())   // 3
```

### 1.6 インライン関数

```kotlin
// inline: ラムダのオーバーヘッドをゼロにする
// 通常、高階関数を呼ぶと内部的にFunctionオブジェクトが生成される
// inline をつけると、関数の本体が呼び出し元に展開される

inline fun measureTime(block: () -> Unit): Long {
    val start = System.nanoTime()
    block()
    return System.nanoTime() - start
}

// 呼び出し
val elapsed = measureTime {
    // この処理は呼び出し元にインライン展開される
    // Functionオブジェクトは生成されない
    Thread.sleep(100)
}

// noinline: 特定のラムダをインライン化しない
inline fun doSomething(
    inlined: () -> Unit,           // インライン化される
    noinline notInlined: () -> Unit // インライン化されない（変数に代入等が可能）
) {
    inlined()
    val stored = notInlined        // noinline なので変数に保存可能
    stored()
}

// crossinline: 非ローカルリターンを禁止
inline fun runOnThread(crossinline block: () -> Unit) {
    Thread {
        block()    // crossinline なので、block 内で return できない
    }.start()
}
```

**インライン関数を使うべき場面:**
- ラムダを引数に取る小さなユーティリティ関数
- パフォーマンスが重要な箇所（ループ内で呼ばれる関数など）
- 標準ライブラリの `let`, `run`, `apply`, `also` 等は全て `inline`

---

## 2. コレクション操作

### 2.1 map, filter, flatMap, forEach

```java
// Java: Stream API
List<String> names = users.stream()
    .filter(u -> u.getAge() >= 18)
    .map(User::getName)
    .map(String::toUpperCase)
    .collect(Collectors.toList());

List<String> allTags = articles.stream()
    .flatMap(a -> a.getTags().stream())
    .distinct()
    .collect(Collectors.toList());

users.forEach(u -> System.out.println(u.getName()));
```

```kotlin
// Kotlin: Stream 不要、直接コレクションにメソッドが生えている
val names = users
    .filter { it.age >= 18 }
    .map { it.name }
    .map { it.uppercase() }
// .collect(Collectors.toList()) が不要！

val allTags = articles
    .flatMap { it.tags }        // .stream() 不要
    .distinct()

users.forEach { println(it.name) }

// mapNotNull: null を除外しながら変換
val validIds = inputs
    .mapNotNull { it.toIntOrNull() }   // "abc" → null → 除外
// Java だと filter + map の2段階が必要

// forEachIndexed: インデックス付き
users.forEachIndexed { index, user ->
    println("$index: ${user.name}")
}
```

### 2.2 groupBy, partition, associate

```java
// Java
Map<String, List<User>> byDept = users.stream()
    .collect(Collectors.groupingBy(User::getDepartment));

Map<Boolean, List<Integer>> partitioned = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));

Map<Integer, String> idToName = users.stream()
    .collect(Collectors.toMap(User::getId, User::getName));
```

```kotlin
// Kotlin
val byDept: Map<String, List<User>> = users.groupBy { it.department }

// partition: 条件を満たすものと満たさないものに2分割
val (evens, odds) = numbers.partition { it % 2 == 0 }
// evens: List<Int>（偶数）, odds: List<Int>（奇数）

// associate: キーと値のペアを作って Map にする
val idToName: Map<Int, String> = users.associate { it.id to it.name }

// associateBy: 要素自体を値にする
val byId: Map<Int, User> = users.associateBy { it.id }

// associateWith: 要素自体をキーにする
val nameLengths: Map<String, Int> = names.associateWith { it.length }

// groupBy + 変換
val deptNames: Map<String, List<String>> = users.groupBy(
    keySelector = { it.department },
    valueTransform = { it.name }
)
```

### 2.3 fold, reduce

```java
// Java
int sum = numbers.stream().reduce(0, Integer::sum);
String joined = strings.stream().reduce("", (a, b) -> a + b);
```

```kotlin
// Kotlin
val sum = numbers.reduce { acc, n -> acc + n }
// 初期値あり: fold
val sum2 = numbers.fold(0) { acc, n -> acc + n }

// 便利な集約関数
val total = numbers.sum()
val avg = numbers.average()
val max = numbers.max()
val min = numbers.min()
val count = numbers.count { it > 5 }

// sumOf: 変換しながら合計
val totalSalary = employees.sumOf { it.salary }

// joinToString: 文字列結合
val csv = names.joinToString(", ")                    // "Alice, Bob, Charlie"
val formatted = names.joinToString(
    separator = " | ",
    prefix = "[",
    postfix = "]"
)  // "[Alice | Bob | Charlie]"

// fold で複雑な集約
val summary = users.fold(StringBuilder()) { sb, user ->
    sb.append("${user.name}: ${user.age}\n")
}
```

### 2.4 zip, unzip

```kotlin
// zip: 2つのリストを組み合わせる
val names = listOf("Alice", "Bob", "Charlie")
val ages = listOf(25, 30, 35)

val pairs: List<Pair<String, Int>> = names.zip(ages)
// [(Alice, 25), (Bob, 30), (Charlie, 35)]

// zip + 変換
val users = names.zip(ages) { name, age -> User(name, age) }

// unzip: ペアのリストを2つのリストに分解
val (nameList, ageList) = pairs.unzip()
```

```java
// Java: zip 相当は標準にない（IntStream + index で頑張る）
List<Pair<String, Integer>> pairs = IntStream.range(0, Math.min(names.size(), ages.size()))
    .mapToObj(i -> new Pair<>(names.get(i), ages.get(i)))
    .collect(Collectors.toList());
```

### 2.5 first, firstOrNull, find

```java
// Java
Optional<User> found = users.stream()
    .filter(u -> u.getName().equals("Alice"))
    .findFirst();
User user = found.orElse(null);
User userOrThrow = found.orElseThrow();
```

```kotlin
// Kotlin
val first = users.first()                           // 最初の要素（空なら例外）
val firstOrNull = users.firstOrNull()               // 最初の要素（空ならnull）
val found = users.first { it.name == "Alice" }      // 条件に一致する最初（なければ例外）
val foundOrNull = users.firstOrNull { it.name == "Alice" }  // なければnull
val find = users.find { it.name == "Alice" }        // firstOrNull の別名

val last = users.last()
val lastOrNull = users.lastOrNull()

// single: 要素がちょうど1つの場合（0個や2個以上は例外）
val onlyAdmin = users.single { it.role == "admin" }
val onlyAdminOrNull = users.singleOrNull { it.role == "admin" }

// any, all, none
val hasAdult = users.any { it.age >= 18 }
val allAdult = users.all { it.age >= 18 }
val noMinors = users.none { it.age < 18 }
```

### 2.6 sortedBy, sortedByDescending

```java
// Java
List<User> sorted = users.stream()
    .sorted(Comparator.comparing(User::getName))
    .collect(Collectors.toList());

List<User> sortedDesc = users.stream()
    .sorted(Comparator.comparing(User::getAge).reversed())
    .collect(Collectors.toList());
```

```kotlin
// Kotlin
val sorted = users.sortedBy { it.name }
val sortedDesc = users.sortedByDescending { it.age }

// 複数条件
val multiSorted = users.sortedWith(
    compareBy<User> { it.department }
        .thenByDescending { it.age }
)

// reversed
val reversed = users.reversed()
val shuffled = users.shuffled()
```

### 2.7 take, drop, chunked, windowed

```kotlin
// take / drop
val first3 = numbers.take(3)          // 最初の3つ
val afterFirst3 = numbers.drop(3)     // 最初の3つを除外
val last3 = numbers.takeLast(3)       // 最後の3つ
val withoutLast3 = numbers.dropLast(3)

// takeWhile / dropWhile
val prefix = numbers.takeWhile { it < 5 }    // 条件が false になるまで取る
val suffix = numbers.dropWhile { it < 5 }    // 条件が false になるまで捨てる

// chunked: 固定サイズに分割
val chunks = (1..10).toList().chunked(3)
// [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]

// chunked + 変換
val sums = (1..10).toList().chunked(3) { chunk -> chunk.sum() }
// [6, 15, 24, 10]

// windowed: スライディングウィンドウ
val windows = (1..5).toList().windowed(3)
// [[1, 2, 3], [2, 3, 4], [3, 4, 5]]

// 移動平均の計算
val movingAverage = temperatures.windowed(3) { it.average() }
```

```java
// Java: chunked / windowed に相当する標準APIがない
// 自分で実装するか、Guava の Lists.partition() を使う
List<List<Integer>> chunks = Lists.partition(numbers, 3);
```

### 2.8 Java Stream API との比較

```java
// Java Stream API
List<String> result = employees.stream()
    .filter(e -> e.getDepartment().equals("Engineering"))
    .filter(e -> e.getSalary() > 50000)
    .sorted(Comparator.comparing(Employee::getSalary).reversed())
    .map(Employee::getName)
    .limit(5)
    .collect(Collectors.toList());
```

```kotlin
// Kotlin: Stream不要、より簡潔
val result = employees
    .filter { it.department == "Engineering" }
    .filter { it.salary > 50000 }
    .sortedByDescending { it.salary }
    .map { it.name }
    .take(5)
// collect() 不要！

// 違いのまとめ:
// Java Stream:
//   - .stream() が必要
//   - .collect(Collectors.toList()) が必要
//   - 一度しか使えない（再利用不可）
//   - 並列処理: .parallelStream()
//
// Kotlin コレクション操作:
//   - .stream() 不要（コレクションに直接メソッドがある）
//   - collect 不要（直接 List を返す）
//   - 結果はただのListなので何度でも使える
//   - 並列処理: コルーチンで対応
```

### 2.9 シーケンス（遅延評価）

```java
// Java: Stream はデフォルトで遅延評価
long count = hugeList.stream()
    .filter(x -> x > 100)
    .map(x -> x * 2)
    .count();
// 中間結果のリストは作られない（遅延評価）
```

```kotlin
// Kotlin: 通常のコレクション操作は即時評価（中間リストが作られる）
val result = hugeList
    .filter { it > 100 }     // ← ここで新しい List が作られる
    .map { it * 2 }           // ← ここでまた新しい List が作られる

// asSequence() で遅延評価に切り替える（大量データ向け）
val result2 = hugeList.asSequence()
    .filter { it > 100 }     // 中間リスト作られない
    .map { it * 2 }           // 中間リスト作られない
    .toList()                 // ここで初めて評価される

// シーケンスの生成
val fibonacci = generateSequence(Pair(0, 1)) { (a, b) -> Pair(b, a + b) }
    .map { it.first }
    .take(10)
    .toList()
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

// 使い分けの目安:
// - 要素数が少ない（< 1000）  → 通常のコレクション操作で十分
// - 要素数が多い / チェーンが長い → asSequence() を使う
// - 無限シーケンスが必要      → generateSequence / sequence { }
```

---

## 3. スコープ関数

### 3.1 let（null チェック + 変換）

```java
// Java: null チェック
String name = user.getName();
if (name != null) {
    String upper = name.toUpperCase();
    System.out.println(upper);
}
```

```kotlin
// Kotlin: let
user.name?.let { name ->
    val upper = name.uppercase()
    println(upper)
}

// it を使ったシンプルな例
user.name?.let { println(it.uppercase()) }

// チェーンでの変換
val displayName = user.name
    ?.let { it.trim() }
    ?.let { if (it.isBlank()) null else it }
    ?: "Anonymous"
```

### 3.2 run（オブジェクト設定 + 計算）

```kotlin
// run: this でレシーバにアクセス、最後の式が戻り値
val result = service.run {
    port = 8080
    query(prepareRequest() + " to port $port")
}

// 非拡張 run: スコープを作る
val hexColor = run {
    val red = 0xFF
    val green = 0x80
    val blue = 0x00
    "#${red.toString(16)}${green.toString(16)}${blue.toString(16)}"
}
```

### 3.3 with（オブジェクトのメソッド複数呼び出し）

```java
// Java
StringBuilder sb = new StringBuilder();
sb.append("Hello");
sb.append(", ");
sb.append("World!");
String result = sb.toString();
```

```kotlin
// Kotlin: with
val result = with(StringBuilder()) {
    append("Hello")
    append(", ")
    append("World!")
    toString()
}

// UI 設定での例
with(binding.recyclerView) {
    layoutManager = LinearLayoutManager(context)
    adapter = myAdapter
    setHasFixedSize(true)
}
```

### 3.4 apply（オブジェクト初期化）

```java
// Java: ビルダーパターンか、setter の連続呼び出し
User user = new User();
user.setName("Alice");
user.setAge(25);
user.setEmail("alice@example.com");
user.setActive(true);
```

```kotlin
// Kotlin: apply
val user = User().apply {
    name = "Alice"
    age = 25
    email = "alice@example.com"
    active = true
}
// apply は this を返す → user は User 型

// Intent の設定（Android でよく使う）
val intent = Intent(this, DetailActivity::class.java).apply {
    putExtra("USER_ID", userId)
    putExtra("FROM", "main")
    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
}
```

### 3.5 also（副作用、ログ）

```kotlin
// also: it でレシーバにアクセス、レシーバ自身を返す
// 主にログやデバッグに使う
val numbers = mutableListOf(1, 2, 3)
    .also { println("初期値: $it") }      // [1, 2, 3]
    .also { it.add(4) }
    .also { println("追加後: $it") }       // [1, 2, 3, 4]

// チェーンの途中でデバッグ
val result = users
    .filter { it.age >= 18 }
    .also { println("フィルタ後: ${it.size}件") }    // デバッグ出力
    .map { it.name }
    .also { println("名前一覧: $it") }               // デバッグ出力
```

### 3.6 使い分けフローチャート

```
                      ┌─────────────────┐
                      │ 何をしたい？    │
                      └───────┬─────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         オブジェクトを    計算結果が     副作用
         初期化・設定     ほしい        （ログ等）
              │               │               │
              │         ┌─────┴─────┐         │
              │         │           │         │
           レシーバは  レシーバは  引数で       │
           this で     this で    受け取る      │
           参照        参照                     │
              │         │           │         │
              ▼         ▼           ▼         ▼
           apply       run        with       also
           (this,      (this,     (this,     (it,
            自身を      結果を     結果を     自身を
            返す)       返す)      返す)      返す)

         ┌───────────┐
         │ let       │
         │ (it,      │  ← null チェック + 変換
         │  結果を    │
         │  返す)     │
         └───────────┘
```

### 3.7 各関数の this vs it の違い

| 関数 | レシーバの参照方法 | 戻り値 | 典型的な用途 |
|------|-------------------|--------|-------------|
| `let` | `it` | ラムダの結果 | `?.let { }` で null チェック＋変換 |
| `run` | `this` | ラムダの結果 | オブジェクト設定＋計算結果を得る |
| `with` | `this` | ラムダの結果 | 複数メソッドの呼び出し |
| `apply` | `this` | オブジェクト自身 | オブジェクトの初期化 |
| `also` | `it` | オブジェクト自身 | 副作用（ログ、検証） |

```kotlin
// 全スコープ関数の比較（同じ処理を書き比べ）
data class Person(var name: String, var age: Int)

// let: it で参照、結果を返す
val info1 = Person("Alice", 25).let {
    "${it.name} is ${it.age}"    // 文字列を返す
}

// run: this で参照、結果を返す
val info2 = Person("Alice", 25).run {
    "$name is $age"              // this. 省略可
}

// with: this で参照、結果を返す（非拡張関数）
val info3 = with(Person("Alice", 25)) {
    "$name is $age"
}

// apply: this で参照、自身を返す
val person4 = Person("Alice", 25).apply {
    age = 26                     // 自身を変更
}
// person4 は Person("Alice", 26)

// also: it で参照、自身を返す
val person5 = Person("Alice", 25).also {
    println("Created: $it")      // 副作用
}
// person5 は Person("Alice", 25)
```

---

## 4. コルーチン

### 4.1 コルーチンとは

```
┌────────────────────────────────────────────────────┐
│  スレッド                                          │
│  ┌──────────────────────────────────────┐          │
│  │ コルーチン A   │ 中断  │ コルーチン A  │         │
│  └──────────────────────────────────────┘          │
│  ┌──────────────────────────────────────┐          │
│  │               │コルーチン B│         │           │
│  └──────────────────────────────────────┘          │
│  ← 同じスレッド上で交互に実行される →               │
└────────────────────────────────────────────────────┘

スレッド: OSレベルの実行単位。メモリ消費が大きい（約1MB/スレッド）
コルーチン: 軽量な仮想スレッド。数万個同時に動かしても問題ない
```

### 4.2 suspend 関数

```java
// Java: ブロッキングI/O
public String fetchUser(int userId) throws IOException {
    // このスレッドはレスポンスが返るまでブロックされる
    HttpResponse<String> response = httpClient.send(
        HttpRequest.newBuilder()
            .uri(URI.create("https://api.example.com/users/" + userId))
            .build(),
        HttpResponse.BodyHandlers.ofString()
    );
    return response.body();
}

// Java: CompletableFuture（非同期）
public CompletableFuture<String> fetchUserAsync(int userId) {
    return CompletableFuture.supplyAsync(() -> fetchUser(userId));
}
```

```kotlin
// Kotlin: suspend 関数
// 「中断可能な関数」— スレッドをブロックせずに待機できる
suspend fun fetchUser(userId: Int): String {
    // delay はスレッドをブロックしない（Thread.sleep とは異なる）
    delay(1000)

    return httpClient.get("https://api.example.com/users/$userId")
        .body<String>()
}

// suspend 関数は別の suspend 関数、または コルーチンスコープからしか呼べない
// 通常の関数から直接呼ぶことはできない
// fetchUser(1)  // コンパイルエラー！

// 呼び出し方
suspend fun main() {
    val user = fetchUser(1)  // OK: main も suspend
    println(user)
}
```

### 4.3 CoroutineScope, launch, async/await

```java
// Java: CompletableFuture
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> fetchUser(1));
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> fetchUser(2));

// 両方を待つ
CompletableFuture.allOf(future1, future2).join();
String user1 = future1.get();
String user2 = future2.get();
```

```kotlin
// Kotlin: コルーチン

// launch: 結果を返さない非同期処理（fire-and-forget）
fun main() = runBlocking {    // runBlocking: メイン関数用のコルーチンスコープ
    launch {
        delay(1000)
        println("World!")
    }
    println("Hello,")
    // 出力: "Hello," → (1秒後) → "World!"
}

// async/await: 結果を返す非同期処理
fun main() = runBlocking {
    // 2つのAPIを並列で呼ぶ
    val deferred1 = async { fetchUser(1) }
    val deferred2 = async { fetchUser(2) }

    // 両方の結果を待つ
    val user1 = deferred1.await()
    val user2 = deferred2.await()
    println("$user1, $user2")
}

// coroutineScope: 構造化された並行性
suspend fun fetchTwoUsers(): Pair<String, String> = coroutineScope {
    val user1 = async { fetchUser(1) }
    val user2 = async { fetchUser(2) }
    Pair(user1.await(), user2.await())
    // 一方が例外を投げると、もう一方も自動キャンセル
}
```

### 4.4 Dispatchers

```kotlin
// Dispatchers: コルーチンが実行されるスレッドを指定
import kotlinx.coroutines.*

// Dispatchers.Main: UIスレッド（Android）
// Dispatchers.IO: I/O操作（ネットワーク、ディスク）
// Dispatchers.Default: CPU集約的な処理

fun main() = runBlocking {
    // I/O操作
    val data = withContext(Dispatchers.IO) {
        fetchFromNetwork()     // I/Oスレッドで実行
    }

    // CPU集約的な処理
    val result = withContext(Dispatchers.Default) {
        heavyComputation(data) // バックグラウンドスレッドで実行
    }

    // Android の場合: UIの更新はMainで
    withContext(Dispatchers.Main) {
        textView.text = result // UIスレッドで実行
    }
}
```

```java
// Java 相当
ExecutorService ioExecutor = Executors.newCachedThreadPool();
ExecutorService computeExecutor = Executors.newFixedThreadPool(
    Runtime.getRuntime().availableProcessors()
);

CompletableFuture.supplyAsync(() -> fetchFromNetwork(), ioExecutor)
    .thenApplyAsync(data -> heavyComputation(data), computeExecutor)
    .thenAcceptAsync(result -> {
        // UIスレッドで更新（Platform.runLater等）
    }, Platform::runLater);
```

### 4.5 Flow（リアクティブストリーム）

```java
// Java: RxJava
Observable<Integer> observable = Observable.create(emitter -> {
    for (int i = 1; i <= 5; i++) {
        emitter.onNext(i);
        Thread.sleep(100);
    }
    emitter.onComplete();
});

observable
    .filter(n -> n % 2 == 0)
    .map(n -> n * 10)
    .subscribe(
        value -> System.out.println(value),
        error -> error.printStackTrace(),
        () -> System.out.println("Done")
    );
```

```kotlin
// Kotlin: Flow
fun numberFlow(): Flow<Int> = flow {
    for (i in 1..5) {
        emit(i)           // 値を発行
        delay(100)         // 中断可能（スレッドブロックしない）
    }
}

// 収集（collect）
fun main() = runBlocking {
    numberFlow()
        .filter { it % 2 == 0 }
        .map { it * 10 }
        .collect { value ->
            println(value)     // 20, 40
        }
}

// StateFlow: 状態を保持するFlow（LiveDataの代替）
class UserViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    fun updateName(name: String) {
        _uiState.update { it.copy(name = name) }
    }
}

// SharedFlow: イベント用（1回限りのイベント）
class EventBus {
    private val _events = MutableSharedFlow<Event>()
    val events: SharedFlow<Event> = _events.asSharedFlow()

    suspend fun emit(event: Event) {
        _events.emit(event)
    }
}
```

### 4.6 例外処理

```kotlin
// try-catch で直接キャッチ
suspend fun safeFetch(): Result<String> {
    return try {
        val data = fetchFromNetwork()
        Result.success(data)
    } catch (e: IOException) {
        Result.failure(e)
    }
}

// CoroutineExceptionHandler
val handler = CoroutineExceptionHandler { _, exception ->
    println("Caught: ${exception.message}")
}

val scope = CoroutineScope(Dispatchers.IO + handler)
scope.launch {
    throw RuntimeException("Oops!")
    // handler でキャッチされる
}

// supervisorScope: 子コルーチンの失敗が他の子に影響しない
suspend fun loadDashboard() = supervisorScope {
    val news = async { fetchNews() }         // 失敗しても...
    val weather = async { fetchWeather() }   // こちらは継続

    try {
        println(news.await())
    } catch (e: Exception) {
        println("News failed: ${e.message}")
    }
    println(weather.await())  // 問題なく取得
}
```

### 4.7 構造化された並行性

```kotlin
// 構造化された並行性: 親コルーチンが子の生存期間を管理する
class UserRepository {
    // viewModelScope: ViewModelが破棄されると自動キャンセル
    // lifecycleScope: Activityが破棄されると自動キャンセル
    // → リーク防止が構造的に保証される

    suspend fun fetchUserData(): UserData = coroutineScope {
        val profile = async { fetchProfile() }
        val posts = async { fetchPosts() }
        val friends = async { fetchFriends() }

        UserData(
            profile = profile.await(),
            posts = posts.await(),
            friends = friends.await()
        )
        // coroutineScope を抜けると、未完了の子コルーチンは全てキャンセル
        // 一つでも例外が出ると、他も全てキャンセル
    }
}
```

```java
// Java: 手動でキャンセル管理が必要
ExecutorService executor = Executors.newFixedThreadPool(3);
Future<Profile> profileFuture = executor.submit(() -> fetchProfile());
Future<List<Post>> postsFuture = executor.submit(() -> fetchPosts());

try {
    Profile profile = profileFuture.get(5, TimeUnit.SECONDS);
    List<Post> posts = postsFuture.get(5, TimeUnit.SECONDS);
} catch (Exception e) {
    profileFuture.cancel(true);    // 手動キャンセルが必要
    postsFuture.cancel(true);
} finally {
    executor.shutdown();           // 手動でシャットダウンが必要
}
```

---

## 5. 委譲（Delegation）

### 5.1 クラス委譲（by キーワード）

```java
// Java: 委譲パターン（デコレーター）— 全メソッドを手動で委譲
public class CountingList<T> implements List<T> {
    private final List<T> inner;
    private int addCount = 0;

    public CountingList(List<T> inner) { this.inner = inner; }

    @Override
    public boolean add(T t) {
        addCount++;
        return inner.add(t);
    }

    // 以下、List の全メソッドを inner に委譲する必要がある（数十メソッド）
    @Override public int size() { return inner.size(); }
    @Override public boolean isEmpty() { return inner.isEmpty(); }
    @Override public T get(int index) { return inner.get(index); }
    // ... 20+ メソッドの委譲が必要 ...
}
```

```kotlin
// Kotlin: by で委譲を自動化
class CountingList<T>(
    private val inner: MutableList<T> = mutableListOf()
) : MutableList<T> by inner {    // inner に全メソッドを自動委譲

    var addCount = 0
        private set

    override fun add(element: T): Boolean {   // 特定メソッドだけオーバーライド
        addCount++
        return inner.add(element)
    }
}

// 使用例
val list = CountingList<String>()
list.add("A")
list.add("B")
println(list.addCount)   // 2
println(list.size)       // 2（自動委譲されたメソッド）
```

### 5.2 プロパティ委譲

```kotlin
// by lazy: 遅延初期化（前章で説明済み）
val heavyObject: HeavyObject by lazy {
    println("Initializing...")
    HeavyObject()
}

// observable: 値の変更を監視
import kotlin.properties.Delegates

var name: String by Delegates.observable("initial") { prop, old, new ->
    println("$old → $new")
}

name = "Alice"   // "initial → Alice" が出力
name = "Bob"     // "Alice → Bob" が出力

// vetoable: 値の変更を拒否できる
var age: Int by Delegates.vetoable(0) { _, _, new ->
    new >= 0     // 負の値は拒否（false を返すと変更されない）
}

age = 25     // OK
age = -1     // 拒否される（age は 25 のまま）
```

### 5.3 カスタムプロパティ委譲

```kotlin
// Map による委譲（JSON パース等に便利）
class User(map: Map<String, Any?>) {
    val name: String by map
    val age: Int by map
}

val user = User(mapOf("name" to "Alice", "age" to 25))
println(user.name)   // "Alice"
println(user.age)    // 25

// カスタム委譲の実装
class Trimmed {
    private var value: String = ""

    operator fun getValue(thisRef: Any?, property: KProperty<*>): String {
        return value
    }

    operator fun setValue(thisRef: Any?, property: KProperty<*>, newValue: String) {
        value = newValue.trim()   // 代入時に自動トリム
    }
}

class Form {
    var username: String by Trimmed()
    var email: String by Trimmed()
}

val form = Form()
form.username = "  Alice  "
println(form.username)     // "Alice"（自動トリム済み）
```

```java
// Java 相当: アスペクト指向（AOP）や独自の setter で実装するしかない
public class Form {
    private String username;

    public void setUsername(String username) {
        this.username = username != null ? username.trim() : null;
    }

    public String getUsername() { return username; }
    // 各フィールドに対して同じロジックを繰り返し書く必要がある
}
```

---

## 6. DSL構築

### 6.1 レシーバ付きラムダ（Lambda with receiver）

```kotlin
// 通常のラムダ
val greet: (String) -> String = { name -> "Hello, $name!" }

// レシーバ付きラムダ: ラムダ内で this が使える
val greet2: String.() -> String = { "Hello, $this!" }

// 呼び出し
greet("Alice")           // 通常のラムダ
"Alice".greet2()         // レシーバ付きラムダ（拡張関数のように呼べる）

// これが DSL の基盤になる
fun html(init: HTML.() -> Unit): HTML {
    val html = HTML()
    html.init()           // init 内で this = html
    return html
}
```

### 6.2 型安全なビルダーパターン

```java
// Java: ビルダーパターン
User user = new User.Builder()
    .name("Alice")
    .age(25)
    .email("alice@example.com")
    .build();
```

```kotlin
// Kotlin: DSL スタイルのビルダー
// ビルダーパターンは apply で不要になることが多い
val user = User().apply {
    name = "Alice"
    age = 25
    email = "alice@example.com"
}

// より本格的な DSL の例: HTML ビルダー
fun html(init: HTML.() -> Unit): HTML = HTML().apply(init)

class HTML {
    private val children = mutableListOf<Element>()

    fun head(init: Head.() -> Unit) {
        children.add(Head().apply(init))
    }

    fun body(init: Body.() -> Unit) {
        children.add(Body().apply(init))
    }
}

class Body {
    fun h1(text: String) { /* ... */ }
    fun p(text: String) { /* ... */ }
    fun div(init: Div.() -> Unit) { /* ... */ }
}

// 使用例（HTMLっぽい DSL）
val page = html {
    head {
        title("My Page")
    }
    body {
        h1("Welcome")
        p("This is a DSL example.")
        div {
            p("Nested content")
        }
    }
}
```

### 6.3 Gradle Kotlin DSL の例

```groovy
// Gradle Groovy DSL（従来）
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.example.app"
        minSdkVersion 24
        targetSdkVersion 34
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
}
```

```kotlin
// Gradle Kotlin DSL（現在の推奨）
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    compileSdk = 34
    defaultConfig {
        applicationId = "com.example.app"
        minSdk = 24
        targetSdk = 34
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
}

// Kotlin DSL の利点:
// - 型安全（タイポがコンパイルエラーになる）
// - IDE の補完が効く
// - リファクタリングが安全
```

### 6.4 Jetpack Compose が DSL である理由

```kotlin
// Jetpack Compose は Kotlin の DSL 機能をフル活用している
@Composable
fun UserProfile(user: User) {
    // Column, Row, Text 等は全て @Composable 関数
    // レシーバ付きラムダで Modifier やコンテンツを設定
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // この {} は ColumnScope.() -> Unit というレシーバ付きラムダ
        Text(
            text = user.name,
            style = MaterialTheme.typography.headlineMedium
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(text = "Age: ${user.age}")
    }
}

// 上記は実質的に以下の DSL と同じ構造:
// column {
//     text("...")
//     spacer()
//     text("...")
// }
```

---

## 7. 型システムの高度な機能

### 7.1 ジェネリクスの変性（in, out）

```java
// Java: ワイルドカード
// ? extends T → 共変（読み取り専用）
// ? super T   → 反変（書き込み専用）
List<? extends Number> numbers = new ArrayList<Integer>();  // 共変
Number n = numbers.get(0);  // OK: 読み取り可能
// numbers.add(1);          // NG: 書き込み不可

List<? super Integer> integers = new ArrayList<Number>();   // 反変
integers.add(1);            // OK: 書き込み可能
// Integer i = integers.get(0);  // NG: 読み取りは Object 型
```

```kotlin
// Kotlin: out（共変）, in（反変）
// out T = ? extends T → 生産者（Producer）
// in T  = ? super T   → 消費者（Consumer）

// 宣言サイト変性（Java にはない機能）
interface Producer<out T> {     // T は出力のみ（読み取り専用）
    fun produce(): T
    // fun consume(item: T)     // コンパイルエラー！out なので引数に使えない
}

interface Consumer<in T> {      // T は入力のみ（書き込み専用）
    fun consume(item: T)
    // fun produce(): T         // コンパイルエラー！in なので戻り値に使えない
}

// 実用例: List は out（共変）
val intList: List<Int> = listOf(1, 2, 3)
val numberList: List<Number> = intList    // OK: List<out T> なので共変

// MutableList は不変（in/out なし）
val mutableIntList: MutableList<Int> = mutableListOf(1, 2, 3)
// val mutableNumberList: MutableList<Number> = mutableIntList  // NG

// 使用サイト変性（Java のワイルドカード相当）
fun copy(from: Array<out Any>, to: Array<Any>) {
    for (i in from.indices) {
        to[i] = from[i]
    }
}
```

### 7.2 型消去と reified

```java
// Java: 型消去により、実行時にジェネリクスの型情報が失われる
public <T> boolean isInstance(Object obj) {
    // return obj instanceof T;  // コンパイルエラー！T は消去される
    // Java では Class<T> を明示的に渡す必要がある
}

public <T> boolean isInstance(Object obj, Class<T> clazz) {
    return clazz.isInstance(obj);
}

isInstance("hello", String.class);  // true
```

```kotlin
// Kotlin: reified で型情報を実行時に保持
inline fun <reified T> isInstance(obj: Any): Boolean {
    return obj is T    // OK: reified なので型情報が使える
}

isInstance<String>("hello")   // true
isInstance<Int>("hello")      // false

// 実用例: JSON デシリアライズ
inline fun <reified T> fromJson(json: String): T {
    return gson.fromJson(json, T::class.java)
    // T::class.java が使える（reified のおかげ）
}

// 呼び出し（型引数を明示的に指定）
val user = fromJson<User>("""{"name": "Alice"}""")

// Java だと:
// User user = gson.fromJson(json, User.class);  // Class を明示的に渡す
```

### 7.3 型エイリアス（typealias）

```kotlin
// 長い型名に別名をつける
typealias UserMap = Map<String, List<User>>
typealias Predicate<T> = (T) -> Boolean
typealias Callback = (Result<String>) -> Unit
typealias StringSet = Set<String>

// 使用例
fun filterUsers(users: UserMap, predicate: Predicate<User>): UserMap {
    return users.mapValues { (_, list) ->
        list.filter(predicate)
    }
}

// 関数型の別名
typealias ClickHandler = (View) -> Unit

class Button {
    var onClick: ClickHandler? = null
}
```

```java
// Java: 型エイリアスの仕組みがない
// せいぜい interface で抽象化するか、コメントで説明するしかない
// @FunctionalInterface
// interface ClickHandler extends Consumer<View> {}
```

### 7.4 Nothing 型

```kotlin
// Nothing: 「この関数は正常に完了しない」ことを表す型
// - 常に例外を投げる関数
// - 無限ループの関数

fun fail(message: String): Nothing {
    throw IllegalStateException(message)
}

// Nothing は全ての型のサブタイプ
// → エルビス演算子と組み合わせると便利
val name: String = userName ?: fail("Name is required")
// fail() の戻り値型が Nothing なので、String に代入可能

// TODO() も Nothing を返す
fun notImplementedYet(): Int {
    TODO("この関数はまだ実装されていない")
    // TODO() は NotImplementedError を投げて Nothing を返す
}
```

### 7.5 スター投影（*）

```kotlin
// * は Java の ? に相当
// 型引数が不明な場合に使う

// Java: List<?> に相当
fun printAll(list: List<*>) {
    for (item in list) {
        println(item)     // item は Any? 型
    }
}

printAll(listOf(1, 2, 3))
printAll(listOf("a", "b", "c"))

// Class<*>
fun getClassName(obj: Any): String {
    return obj::class.simpleName ?: "Unknown"
}
```

```java
// Java: ワイルドカード ?
public void printAll(List<?> list) {
    for (Object item : list) {
        System.out.println(item);
    }
}
```

---

## 8. Java との相互運用

### 8.1 Kotlin から Java を呼ぶ

```kotlin
// Kotlin から Java のクラスをそのまま使える
import java.util.ArrayList
import java.time.LocalDateTime
import java.io.File

// Java クラスの使用
val list = ArrayList<String>()       // Java の ArrayList
list.add("Hello")

val now = LocalDateTime.now()        // Java の LocalDateTime

// getter/setter はプロパティとしてアクセスできる
val file = File("/tmp/test.txt")
println(file.name)                    // getName() がプロパティになる
println(file.isDirectory)             // isDirectory() がプロパティになる
file.setReadable(true)                // set + boolean なので setReadable()

// Java の static メソッド
val maxInt = Integer.MAX_VALUE
val parsed = Integer.parseInt("42")

// SAM 変換（前述）
val thread = Thread { println("Running in thread") }
thread.start()
```

### 8.2 Java から Kotlin を呼ぶ

```kotlin
// Kotlin 側の定義
// ファイル: UserUtils.kt

// トップレベル関数
fun greet(name: String) = "Hello, $name!"

// companion object の static 的メンバー
class User(val name: String) {
    companion object {
        @JvmStatic                    // Java から User.create() で呼べるようにする
        fun create(name: String) = User(name)

        @JvmField                     // Java から User.DEFAULT_NAME でアクセス可能
        val DEFAULT_NAME = "Anonymous"

        const val MAX_NAME_LENGTH = 50  // const val は自動で static final
    }

    // デフォルト引数
    @JvmOverloads                     // Java 用のオーバーロードを自動生成
    fun greet(greeting: String = "Hello", punctuation: String = "!") =
        "$greeting, $name$punctuation"
}
```

```java
// Java 側から呼ぶ

// トップレベル関数: ファイル名 + Kt サフィックス
String greeting = UserUtilsKt.greet("Alice");

// @JvmStatic
User user = User.create("Alice");       // companion object のメソッド

// @JvmField
String defaultName = User.DEFAULT_NAME; // companion object のフィールド

// const val
int maxLen = User.MAX_NAME_LENGTH;      // 自動で static final

// @JvmOverloads（3つのオーバーロードが生成される）
user.greet();                           // greet("Hello", "!")
user.greet("Hi");                       // greet("Hi", "!")
user.greet("Hi", ".");                  // greet("Hi", ".")
```

### 8.3 プラットフォーム型（! 記号）

```kotlin
// Java から返される値は「プラットフォーム型」として扱われる
// IDE では String! のように表示される（! は「null かもしれないし、null でないかもしれない」）

// Java のメソッド: public String getName() { return null; }
val name = javaObject.name   // String! 型（プラットフォーム型）
// Kotlin コンパイラは null チェックを強制しない
// → NPE の原因になりうる

// 安全な対策:
// 方法1: 明示的な型指定で受け取る
val safeName: String? = javaObject.name    // Nullable として扱う
val unsafeName: String = javaObject.name   // Non-null として扱う（危険）

// 方法2: 早めに null チェック
val name = javaObject.name ?: "default"

// Java 側で @Nullable / @NotNull を付けていれば、Kotlin コンパイラが認識する
// @NotNull String getName() → Kotlin では String 型
// @Nullable String getName() → Kotlin では String? 型
```

### 8.4 既存Javaプロジェクトへの段階的Kotlin導入戦略

```
Step 1: テストから始める
  ├── Java の JUnit テストを Kotlin で新規作成
  ├── 既存テストは変更しない
  └── Kotlin の基本に慣れる

Step 2: 新しいクラスを Kotlin で書く
  ├── 新機能のクラスを Kotlin で作成
  ├── Java から Kotlin を呼ぶ（@JvmStatic 等）
  └── Java + Kotlin の混在プロジェクトに慣れる

Step 3: ユーティリティクラスを変換
  ├── 状態を持たない Utils 系クラスを変換
  ├── IntelliJ の "Convert Java to Kotlin" を活用
  └── 変換後のコードを Kotlin らしく改善

Step 4: データクラスを変換
  ├── POJO / DTO を data class に変換
  ├── getter/setter が消えて大幅にコード削減
  └── equals/hashCode/toString が自動生成

Step 5: ビジネスロジックを変換
  ├── コアロジックを段階的に Kotlin 化
  ├── null 安全を活用してバグを発見
  └── 拡張関数でユーティリティを整理

⚠️ 一度に全て変換しない！段階的に進めることが重要
```

### 8.5 Kotlin → Java 変換の確認

```
IntelliJ IDEA / Android Studio で:

1. Kotlin ファイルを開く
2. Tools → Kotlin → Show Kotlin Bytecode
3. Decompile ボタンをクリック
4. Kotlin がどんな Java コードにコンパイルされるか確認できる

これにより:
- data class が何を生成しているか
- inline 関数がどう展開されるか
- companion object がどう static になるか
- コルーチンがどうステートマシンに変換されるか
等を確認できる
```

---

## まとめ: Java → Kotlin 応用パターン対応表

| Java | Kotlin | セクション |
|------|--------|-----------|
| `Stream.filter().map().collect()` | `.filter { }.map { }` | 2 コレクション |
| `Predicate<T>` | `(T) -> Boolean` | 1 ラムダ |
| `Function<T, R>` | `(T) -> R` | 1 ラムダ |
| `CompletableFuture` | `async { } / await()` | 4 コルーチン |
| `ExecutorService` | `Dispatchers + CoroutineScope` | 4 コルーチン |
| `RxJava Observable` | `Flow` | 4 コルーチン |
| `? extends T` | `out T` | 7 型システム |
| `? super T` | `in T` | 7 型システム |
| `Class<T>` パラメータ | `reified T` | 7 型システム |
| デコレーターパターン | `by` 委譲 | 5 委譲 |
| ビルダーパターン | `apply { }` / DSL | 6 DSL |
| `@Nullable` アノテーション | `String?` | 基礎編 4 |

---

## 次のステップ

この応用編を理解したら、[20-kotlin-android.md](20-kotlin-android.md)（Android開発実践編）に進もう。
Jetpack Compose、アーキテクチャコンポーネント、そして本プロジェクト（IPA単語帳）を
Android / Kotlin で実装する具体例を学ぶ。
