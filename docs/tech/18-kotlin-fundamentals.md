# Kotlin移行ガイド — 言語基礎編

JavaエンジニアがKotlinを学ぶための包括的ガイド。
各セクションで「Javaではこう書いていたもの」を「Kotlinではこう書く」と並べて比較する。
本ドキュメントを通じて、Kotlinの基本文法をJavaとの対比で理解できるようになることを目指す。

---

## 1. Kotlinとは

### 1.1 Kotlinの特徴

| 特徴 | 説明 |
|------|------|
| **JVM言語** | Java と同じ JVM 上で動作する。既存の Java ライブラリをそのまま使える |
| **Java完全互換** | Kotlin から Java を呼べるし、Java から Kotlin も呼べる |
| **Null安全** | 型レベルで null を管理し、NullPointerException を防ぐ |
| **簡潔** | Java に比べてボイラープレートが大幅に少ない |
| **関数型 + オブジェクト指向** | 両方のパラダイムをサポート |
| **コルーチン** | 軽量な非同期処理を言語レベルでサポート |

### 1.2 歴史

```
2011年  JetBrains が Kotlin を発表
2012年  オープンソース化
2016年  Kotlin 1.0 リリース
2017年  Google が Android の公式言語として Kotlin を採用
2019年  Google が「Kotlin-first」を宣言（新しい API は Kotlin 優先）
2021年  Kotlin 1.6 — サーバーサイドでも採用拡大
2023年  Kotlin 2.0 ベータ — K2 コンパイラ
2024年  Kotlin 2.0 安定版リリース
2025年  Kotlin Multiplatform (KMP) 安定版 — iOS/Desktop/Web 対応
```

### 1.3 Kotlin Multiplatform（KMP）の概要

```
┌──────────────────────────────────────┐
│         共通コード（Kotlin）         │
│  ビジネスロジック / データ層 / ネットワーク │
└──────────┬───────────┬───────────────┘
           │           │
    ┌──────▼──────┐  ┌─▼──────────────┐
    │  Android    │  │  iOS           │
    │  Compose    │  │  SwiftUI       │
    │  (Kotlin)   │  │  (Swift)       │
    └─────────────┘  └────────────────┘
                          │
                    ┌─────▼──────────┐
                    │  Desktop / Web │
                    │  (Kotlin)      │
                    └────────────────┘
```

KMP を使えば、ビジネスロジックを Kotlin で一度書いて Android / iOS / Desktop / Web で共有できる。
UI 層だけプラットフォーム固有にするか、Compose Multiplatform で UI も共有するかを選べる。

### 1.4 開発環境セットアップ

| ツール | 用途 | 備考 |
|--------|------|------|
| **IntelliJ IDEA** | Kotlin 全般の開発 | JetBrains 製。Community版で十分 |
| **Android Studio** | Android 開発 | IntelliJ ベース。Compose プレビュー搭載 |
| **JDK 17+** | Kotlin は JVM 上で動く | Amazon Corretto / Adoptium 推奨 |
| **Gradle** | ビルドツール | Kotlin DSL で設定を書く |

```bash
# sdkman で JDK と Kotlin をインストール
curl -s "https://get.sdkman.io" | bash
sdk install java 17.0.9-amzn
sdk install kotlin
```

---

## 2. 基本文法

### 2.1 変数宣言: val vs var

```java
// Java
final String name = "Kotlin";   // 再代入不可
String greeting = "Hello";       // 再代入可能
greeting = "Hi";
```

```kotlin
// Kotlin
val name = "Kotlin"       // 再代入不可（推奨！）
var greeting = "Hello"    // 再代入可能
greeting = "Hi"

// Kotlinの慣習: 基本はvalを使い、どうしても変更が必要な場合のみvarを使う
```

**ポイント**: Kotlin では `val`（不変）をデフォルトで使う文化がある。Java の `final` に相当するが、Java では `final` を付けない人が多い。Kotlin は逆に `val` がデフォルトで、変更が必要なときだけ `var` を使う。

### 2.2 型推論

```java
// Java 10+: var は使えるが、ローカル変数のみ
var count = 10;                    // int に推論
var name = "Hello";                // String に推論
// var はフィールド宣言には使えない
// var はメソッドの戻り値型には使えない

public class User {
    private String name;           // 型の省略不可

    public String getName() {      // 戻り値型の省略不可
        return name;
    }
}
```

```kotlin
// Kotlin: 型推論がより広範
val count = 10                     // Int に推論
val name = "Hello"                 // String に推論
val pi = 3.14                      // Double に推論
val numbers = listOf(1, 2, 3)      // List<Int> に推論

// プロパティでも型推論が効く
class User {
    val name = "Default"           // String に推論

    // 戻り値型も推論可能（単一式関数の場合）
    fun greet() = "Hello, $name"   // String に推論
}

// 明示的に型を書くこともできる（可読性のため）
val count: Int = 10
val name: String = "Hello"
```

### 2.3 基本型

```java
// Java: プリミティブ型とラッパー型が別に存在する
int count = 10;                    // プリミティブ
Integer boxedCount = 10;           // ラッパー（オートボクシング）
long id = 100L;
double rate = 0.85;
boolean active = true;
char initial = 'K';

// ジェネリクスではラッパー型が必要
List<Integer> numbers = List.of(1, 2, 3);  // int は使えない
```

```kotlin
// Kotlin: プリミティブとラッパーの区別がない
// コンパイラが自動的にプリミティブを使う（パフォーマンス面の心配不要）
val count: Int = 10
val id: Long = 100L
val rate: Double = 0.85
val active: Boolean = true
val initial: Char = 'K'

// ジェネリクスでもそのまま使える
val numbers: List<Int> = listOf(1, 2, 3)

// 数値リテラルの読みやすさ
val million = 1_000_000            // アンダースコアで区切れる
val hex = 0xFF
val binary = 0b1010
```

**型の対応表:**

| Java | Kotlin | 備考 |
|------|--------|------|
| `int` / `Integer` | `Int` | 統一 |
| `long` / `Long` | `Long` | 統一 |
| `double` / `Double` | `Double` | 統一 |
| `float` / `Float` | `Float` | 統一 |
| `boolean` / `Boolean` | `Boolean` | 統一 |
| `char` / `Character` | `Char` | 統一 |
| `byte` / `Byte` | `Byte` | 統一 |
| `String` | `String` | 同じ（java.lang.String が内部的に使われる） |
| `void` | `Unit` | Kotlin は `Unit` を返す型として使う |
| `Object` | `Any` | Kotlin の全クラスの親 |

### 2.4 文字列テンプレート

```java
// Java: 文字列結合のいくつかのパターン
String name = "Kotlin";
int version = 2;

// パターン1: + で結合（読みにくい）
String msg1 = "Hello, " + name + "! Version " + version;

// パターン2: String.format（C言語風）
String msg2 = String.format("Hello, %s! Version %d", name, version);

// パターン3: Java 15+ テキストブロック
String json = """
    {
        "name": "%s",
        "version": %d
    }
    """.formatted(name, version);
```

```kotlin
// Kotlin: 文字列テンプレート（$変数名 または ${式}）
val name = "Kotlin"
val version = 2

// シンプルな変数埋め込み
val msg1 = "Hello, $name! Version $version"

// 式の埋め込み（${} を使う）
val msg2 = "Hello, ${name.uppercase()}! Version ${version + 1}"

// 複数行文字列（trimIndent でインデント除去）
val json = """
    {
        "name": "$name",
        "version": $version
    }
""".trimIndent()

// trimMargin でマージン文字を指定
val text = """
    |First line
    |Second line
    |Third line
""".trimMargin()  // | の左側が除去される
```

### 2.5 複数行文字列

```java
// Java 15+: テキストブロック
String html = """
        <html>
            <body>
                <p>Hello, World!</p>
            </body>
        </html>
        """;
// 末尾の """ の位置でインデントが決まる
```

```kotlin
// Kotlin: トリプルクォート文字列
val html = """
    <html>
        <body>
            <p>Hello, World!</p>
        </body>
    </html>
""".trimIndent()
// trimIndent() で共通のインデントを除去

// エスケープ不要（正規表現に便利）
val regex = """\d{3}-\d{4}""".toRegex()
// Java だと "\\d{3}-\\d{4}" とエスケープが必要
```

---

## 3. 関数

### 3.1 fun 宣言

```java
// Java
public int add(int a, int b) {
    return a + b;
}

public void printMessage(String message) {
    System.out.println(message);
}
```

```kotlin
// Kotlin
fun add(a: Int, b: Int): Int {
    return a + b
}

fun printMessage(message: String) {    // 戻り値型 Unit は省略可
    println(message)
}
```

**違いのまとめ:**
- `public` はデフォルトなので書かない
- 戻り値型は `:` の後ろに書く（パラメータと同じ書式）
- `void` の代わりに `Unit`（省略可能）
- `System.out.println()` → `println()`

### 3.2 デフォルト引数

```java
// Java: デフォルト引数がないので、オーバーロードで対応する
public String greet(String name, String greeting) {
    return greeting + ", " + name + "!";
}

public String greet(String name) {
    return greet(name, "Hello");         // デフォルト値をハードコード
}

public String greet() {
    return greet("World");               // さらにオーバーロード
}
```

```kotlin
// Kotlin: デフォルト引数で1つの関数にまとめられる
fun greet(name: String = "World", greeting: String = "Hello"): String {
    return "$greeting, $name!"
}

// 呼び出し例
greet()                          // "Hello, World!"
greet("Kotlin")                  // "Hello, Kotlin!"
greet("Kotlin", "Hi")            // "Hi, Kotlin!"
greet(greeting = "Hey")          // "Hey, World!"  ← 名前付き引数
```

### 3.3 名前付き引数

```java
// Java: 引数の順番でしか区別できない
// どれが width で、どれが height？
createWindow(800, 600, true, false);

// 可読性のためにコメントを書くしかない
createWindow(
    /* width */  800,
    /* height */ 600,
    /* resizable */ true,
    /* fullscreen */ false
);
```

```kotlin
// Kotlin: 名前付き引数で可読性が大幅に向上
fun createWindow(
    width: Int,
    height: Int,
    resizable: Boolean = true,
    fullscreen: Boolean = false
) { /* ... */ }

// 呼び出し時に引数名を指定
createWindow(
    width = 800,
    height = 600,
    resizable = true,
    fullscreen = false
)

// 名前付き引数なら順番を変えてもOK
createWindow(
    fullscreen = true,
    width = 1920,
    height = 1080
)
```

### 3.4 単一式関数

```java
// Java
public int double(int x) {
    return x * 2;
}

public boolean isEven(int x) {
    return x % 2 == 0;
}
```

```kotlin
// Kotlin: 本体が1つの式なら = で書ける（returnも不要）
fun double(x: Int): Int = x * 2

// 型推論と組み合わせるとさらに簡潔
fun double(x: Int) = x * 2
fun isEven(x: Int) = x % 2 == 0
fun greet(name: String) = "Hello, $name!"
```

### 3.5 トップレベル関数

```java
// Java: 関数は必ずクラスに属さなければならない
public class MathUtils {
    public static int add(int a, int b) {
        return a + b;
    }
}
// 呼び出し: MathUtils.add(1, 2)

// ユーティリティクラスのアンチパターン
public class StringUtils {
    private StringUtils() {}  // インスタンス化防止

    public static boolean isEmpty(String s) {
        return s == null || s.isEmpty();
    }
}
```

```kotlin
// Kotlin: 関数はクラスに属さなくてよい（トップレベル関数）
// ファイル: MathUtils.kt
fun add(a: Int, b: Int) = a + b

// 呼び出し: add(1, 2)  ← クラス名不要

// ファイル: StringUtils.kt
fun String.isBlankOrEmpty() = this.isBlank() || this.isEmpty()

// ユーティリティクラスを作る必要がなくなる！
```

### 3.6 拡張関数

```java
// Java: 既存クラスにメソッドを追加するにはユーティリティクラスが必要
public class StringUtils {
    public static String addExclamation(String s) {
        return s + "!";
    }

    public static boolean isPalindrome(String s) {
        return s.equals(new StringBuilder(s).reverse().toString());
    }
}

// 呼び出し（不自然な語順）
StringUtils.addExclamation("Hello");
StringUtils.isPalindrome("racecar");
```

```kotlin
// Kotlin: 拡張関数で既存クラスにメソッドを「追加」できる
fun String.addExclamation(): String = this + "!"

fun String.isPalindrome(): Boolean = this == this.reversed()

// 呼び出し（自然な語順）
"Hello".addExclamation()      // "Hello!"
"racecar".isPalindrome()      // true

// 実用的な例: Int に日本語単位を追加
fun Int.toDollar(): String = "$$this"
fun Int.toYen(): String = "${this}円"

100.toDollar()   // "$100"
500.toYen()      // "500円"

// コレクションへの拡張
fun <T> List<T>.secondOrNull(): T? = if (size >= 2) this[1] else null

listOf(1, 2, 3).secondOrNull()   // 2
listOf(1).secondOrNull()         // null
```

---

## 4. Null安全

Kotlin 最大の特徴の1つ。Java の `NullPointerException`（通称 NPE）を型レベルで防ぐ。

### 4.1 Nullable型: String? vs String

```java
// Java: どの参照型も null になりうる（防ぎようがない）
String name = null;            // コンパイル通る
name.length();                 // 実行時に NullPointerException！

// @Nullable / @NonNull アノテーションはあるが、強制力がない
@Nullable String nickname = null;
@NonNull String name = "Kotlin";
```

```kotlin
// Kotlin: 型レベルで null の可否を宣言
val name: String = "Kotlin"    // null 不可（Non-null型）
// name = null                 // コンパイルエラー！

val nickname: String? = null   // null 可（Nullable型）
// nickname.length             // コンパイルエラー！null かもしれない

// Nullable型に対しては安全な操作が必要
nickname?.length               // null なら null を返す（安全呼び出し）
nickname?.length ?: 0          // null なら 0 を返す（エルビス演算子）
```

### 4.2 安全呼び出し: ?.

```java
// Java: null チェックのネスト地獄
String city = null;
if (user != null) {
    Address address = user.getAddress();
    if (address != null) {
        city = address.getCity();
    }
}
// city は null かもしれない
```

```kotlin
// Kotlin: ?. でチェーンできる
val city: String? = user?.address?.city
// user が null → null
// user.address が null → null
// どれも null でなければ city の値
```

### 4.3 エルビス演算子: ?:

```java
// Java: null の場合のデフォルト値
String displayName = user.getName() != null ? user.getName() : "Anonymous";

// Java 9+: Optional
String displayName = Optional.ofNullable(user.getName())
    .orElse("Anonymous");
```

```kotlin
// Kotlin: エルビス演算子 ?:
val displayName = user.name ?: "Anonymous"

// 式も書ける
val displayName = user.name ?: run {
    log.warn("Name is null for user: ${user.id}")
    "Anonymous"
}

// 早期リターンにも使える
fun process(input: String?) {
    val value = input ?: return             // null なら即 return
    val parsed = value.toIntOrNull() ?: throw IllegalArgumentException("Not a number")
    println(parsed)
}
```

### 4.4 非nullアサーション: !! (使うべきでない理由)

```kotlin
// !! は「絶対にnullではない」と断言する演算子
val name: String? = null
val length = name!!.length  // 実行時に NullPointerException（KotlinNPE）

// !! を使うべきでない理由:
// 1. Java の NPE と同じ問題を再導入してしまう
// 2. Kotlin の null 安全の恩恵を捨てることになる
// 3. ほぼ全てのケースで ?. や ?: で代替できる

// NG: !! の使用
fun getLength(s: String?): Int = s!!.length

// OK: 安全な代替
fun getLength(s: String?): Int = s?.length ?: 0
```

### 4.5 スマートキャスト

```java
// Java: instanceof で確認した後もキャストが必要
if (obj instanceof String) {
    String str = (String) obj;    // キャストが必要
    System.out.println(str.length());
}
```

```kotlin
// Kotlin: is でチェックした後は自動的にキャストされる
if (obj is String) {
    println(obj.length)           // キャスト不要！自動でString型になる
}

// null チェックでもスマートキャスト
val name: String? = getName()
if (name != null) {
    println(name.length)          // ここでは String（non-null）型
}

// when でも使える
fun describe(obj: Any): String = when (obj) {
    is Int    -> "Integer: $obj"     // obj は Int 型
    is String -> "String of length ${obj.length}"  // obj は String 型
    is List<*> -> "List of size ${obj.size}"        // obj は List 型
    else      -> "Unknown"
}
```

### 4.6 スコープ関数と null 処理

```kotlin
// let: null でないときだけ処理を実行
val name: String? = findUserName()

// NG: 冗長
if (name != null) {
    println("Name is $name")
}

// OK: let を使う
name?.let { println("Name is $it") }

// also: 副作用（ログ等）に便利
name?.also { println("Found name: $it") }
     ?.let { it.uppercase() }

// run: オブジェクトに対する計算
val length = name?.run {
    println("Processing: $this")
    this.length  // 最後の式が戻り値
}

// apply: オブジェクトの初期化に便利
val user = User().apply {
    this.name = "Kotlin"
    this.age = 10
    this.email = "kotlin@example.com"
}

// with: apply と似ているが、引数で受け取る
val info = with(user) {
    "Name: $name, Age: $age"    // this が user
}
```

**スコープ関数の使い分け表:**

| 関数 | レシーバ | 戻り値 | 主な用途 |
|------|---------|--------|---------|
| `let` | `it` | ラムダの結果 | null チェック + 変換 |
| `run` | `this` | ラムダの結果 | オブジェクトの設定 + 計算 |
| `with` | `this` | ラムダの結果 | まとめてメソッド呼び出し |
| `apply` | `this` | オブジェクト自身 | オブジェクト初期化 |
| `also` | `it` | オブジェクト自身 | 副作用（ログ等） |

### 4.7 Java の Optional との比較

```java
// Java: Optional（Java 8+）
Optional<String> name = Optional.ofNullable(getName());

String upper = name
    .map(String::toUpperCase)
    .orElse("DEFAULT");

// Optional はフィールドに使うべきでない、引数に使うべきでない...制約が多い
```

```kotlin
// Kotlin: Nullable型で十分（Optional不要）
val name: String? = getName()

val upper = name?.uppercase() ?: "DEFAULT"

// Optional は使わなくてよい。Kotlinの型システムの方が:
// 1. パフォーマンスが良い（オブジェクト生成なし）
// 2. 使える場所に制限がない（フィールド、引数、戻り値どこでも）
// 3. 簡潔
```

---

## 5. 制御構文

### 5.1 if式（値を返す）

```java
// Java: if は文（statement）であり、値を返さない
// 三項演算子を使う
String status = score >= 60 ? "合格" : "不合格";

// 複雑な条件は三項演算子では書きにくい
String grade;
if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else if (score >= 70) {
    grade = "C";
} else {
    grade = "D";
}
```

```kotlin
// Kotlin: if は式（expression）であり、値を返す
// 三項演算子は不要（if式で代替）
val status = if (score >= 60) "合格" else "不合格"

// 複雑な条件もif式で
val grade = if (score >= 90) {
    "A"
} else if (score >= 80) {
    "B"
} else if (score >= 70) {
    "C"
} else {
    "D"
}
// ブロックの最後の式が値になる
```

### 5.2 when式（switch の強化版）

```java
// Java: switch 文
switch (day) {
    case MONDAY:
    case TUESDAY:
    case WEDNESDAY:
    case THURSDAY:
    case FRIDAY:
        System.out.println("平日");
        break;
    case SATURDAY:
    case SUNDAY:
        System.out.println("週末");
        break;
}

// Java 14+: switch 式
String type = switch (day) {
    case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> "平日";
    case SATURDAY, SUNDAY -> "週末";
};

// Java: instanceof のチェーン
if (shape instanceof Circle c) {
    return Math.PI * c.radius() * c.radius();
} else if (shape instanceof Rectangle r) {
    return r.width() * r.height();
} else {
    throw new IllegalArgumentException("Unknown shape");
}
```

```kotlin
// Kotlin: when 式 — switch の完全上位互換
val type = when (day) {
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY -> "平日"
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY -> "週末"
}

// 範囲チェック
val description = when (score) {
    in 90..100 -> "優秀"
    in 80..89  -> "良好"
    in 70..79  -> "普通"
    in 0..69   -> "要改善"
    else       -> "範囲外"
}

// 型チェック（スマートキャスト付き）
val area = when (shape) {
    is Circle    -> Math.PI * shape.radius * shape.radius
    is Rectangle -> shape.width * shape.height
    is Triangle  -> shape.base * shape.height / 2
    else         -> throw IllegalArgumentException("Unknown shape")
}

// 条件式として使う（引数なし when）
val message = when {
    temperature > 35 -> "猛暑"
    temperature > 25 -> "暑い"
    temperature > 15 -> "快適"
    temperature > 5  -> "寒い"
    else             -> "極寒"
}
```

### 5.3 for ループ

```java
// Java
for (String item : list) {
    System.out.println(item);
}

for (int i = 0; i < 10; i++) {
    System.out.println(i);
}

for (int i = 10; i >= 0; i--) {
    System.out.println(i);
}

for (int i = 0; i < list.size(); i++) {
    System.out.println(i + ": " + list.get(i));
}
```

```kotlin
// Kotlin
for (item in list) {
    println(item)
}

// 範囲（0から9まで）
for (i in 0..9) {       // 0, 1, 2, ..., 9 （9を含む）
    println(i)
}

for (i in 0 until 10) { // 0, 1, 2, ..., 9 （10を含まない）
    println(i)
}

// 逆順
for (i in 10 downTo 0) {  // 10, 9, 8, ..., 0
    println(i)
}

// ステップ
for (i in 0..20 step 5) {  // 0, 5, 10, 15, 20
    println(i)
}

// インデックス付き
for ((index, item) in list.withIndex()) {
    println("$index: $item")
}

// 繰り返し（repeat）
repeat(5) {
    println("Hello!")
}
```

### 5.4 while, do-while

```java
// Java
while (condition) {
    // 処理
}

do {
    // 処理
} while (condition);
```

```kotlin
// Kotlin: Java と同じ（変更なし）
while (condition) {
    // 処理
}

do {
    // 処理
} while (condition)
```

### 5.5 try-catch 式

```java
// Java: try-catch は文
int number;
try {
    number = Integer.parseInt(input);
} catch (NumberFormatException e) {
    number = 0;
}
```

```kotlin
// Kotlin: try-catch は式（値を返す）
val number = try {
    input.toInt()
} catch (e: NumberFormatException) {
    0
}

// Kotlin には検査例外がない
// Java で throws 宣言が必要だった例外も、Kotlin では不要
fun readFile(path: String): String {
    return File(path).readText()  // IOException の throws 宣言不要
}
```

---

## 6. クラスとオブジェクト

### 6.1 class 定義（プライマリコンストラクタ）

```java
// Java: ボイラープレートだらけ
public class User {
    private final String name;
    private final int age;

    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
}
```

```kotlin
// Kotlin: プライマリコンストラクタで宣言と同時に完了
class User(val name: String, val age: Int)

// これだけで:
// - コンストラクタ
// - フィールド（プロパティ）
// - getter
// がすべて定義される

// 使用例
val user = User("Kotlin", 10)
println(user.name)   // "Kotlin" — getter が自動呼び出しされる
println(user.age)    // 10
```

### 6.2 data class

```java
// Java: equals, hashCode, toString を手動実装 or lombok
public class User {
    private final String name;
    private final int age;

    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // getter（省略）

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return age == user.age && Objects.equals(name, user.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }

    @Override
    public String toString() {
        return "User{name='" + name + "', age=" + age + "}";
    }
}

// Java 16+: record（不変データ）
public record User(String name, int age) {}

// Lombok: アノテーションで生成
@Data
@AllArgsConstructor
public class User {
    private String name;
    private int age;
}
```

```kotlin
// Kotlin: data class — たった1行で全て揃う
data class User(val name: String, val age: Int)

// 自動生成されるもの:
// - equals() / hashCode()
// - toString()         → "User(name=Kotlin, age=10)"
// - copy()             → コピー＋部分変更
// - componentN()       → 分割代入

val user = User("Kotlin", 10)
println(user)                     // "User(name=Kotlin, age=10)"
println(user == User("Kotlin", 10))  // true（値の比較）

// copy: 一部だけ変更したコピーを作る（不変データの更新パターン）
val older = user.copy(age = 11)    // User(name=Kotlin, age=11)

// 分割代入（destructuring）
val (name, age) = user
println("$name is $age years old")
```

### 6.3 object（シングルトン）

```java
// Java: シングルトンパターン（冗長）
public class Database {
    private static final Database INSTANCE = new Database();

    private Database() {}

    public static Database getInstance() {
        return INSTANCE;
    }

    public void connect() {
        System.out.println("Connected");
    }
}

// 呼び出し
Database.getInstance().connect();
```

```kotlin
// Kotlin: object 宣言でシングルトン
object Database {
    fun connect() {
        println("Connected")
    }
}

// 呼び出し
Database.connect()
```

### 6.4 companion object（Java static 対比）

```java
// Java: static メンバー
public class MathUtils {
    public static final double PI = 3.14159;

    public static int add(int a, int b) {
        return a + b;
    }

    // ファクトリメソッド
    public static MathUtils create() {
        return new MathUtils();
    }
}

// 呼び出し
double pi = MathUtils.PI;
int sum = MathUtils.add(1, 2);
```

```kotlin
// Kotlin: companion object で static 的なメンバーを定義
class MathUtils {
    companion object {
        const val PI = 3.14159

        fun add(a: Int, b: Int) = a + b

        // ファクトリメソッド
        fun create() = MathUtils()
    }
}

// 呼び出し（Java static と同じ書き方）
val pi = MathUtils.PI
val sum = MathUtils.add(1, 2)

// companion object に名前を付けることもできる
class User private constructor(val name: String) {
    companion object Factory {
        fun fromJson(json: String): User {
            // JSON パース
            return User("parsed")
        }
    }
}

val user = User.fromJson("""{"name": "Kotlin"}""")
```

### 6.5 enum class

```java
// Java
public enum Color {
    RED("#FF0000"),
    GREEN("#00FF00"),
    BLUE("#0000FF");

    private final String hex;

    Color(String hex) {
        this.hex = hex;
    }

    public String getHex() { return hex; }
}
```

```kotlin
// Kotlin
enum class Color(val hex: String) {
    RED("#FF0000"),
    GREEN("#00FF00"),
    BLUE("#0000FF");

    // メソッドも定義可能
    fun rgb(): Triple<Int, Int, Int> {
        val r = hex.substring(1, 3).toInt(16)
        val g = hex.substring(3, 5).toInt(16)
        val b = hex.substring(5, 7).toInt(16)
        return Triple(r, g, b)
    }
}

// when と組み合わせる（全パターン網羅でelse不要）
fun describe(color: Color) = when (color) {
    Color.RED   -> "赤"
    Color.GREEN -> "緑"
    Color.BLUE  -> "青"
    // else 不要！全パターンを網羅しているとコンパイラが検証
}
```

### 6.6 sealed class

```java
// Java 17+: sealed class（許可されたサブクラスを制限）
public sealed class Shape permits Circle, Rectangle, Triangle {
}

public final class Circle extends Shape {
    private final double radius;
    public Circle(double radius) { this.radius = radius; }
    public double getRadius() { return radius; }
}

public final class Rectangle extends Shape {
    private final double width, height;
    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }
    // getter 省略
}
```

```kotlin
// Kotlin: sealed class — 制限された継承階層
sealed class Shape {
    data class Circle(val radius: Double) : Shape()
    data class Rectangle(val width: Double, val height: Double) : Shape()
    data class Triangle(val base: Double, val height: Double) : Shape()
}

// when と組み合わせると強力（全パターン網羅チェック）
fun area(shape: Shape): Double = when (shape) {
    is Shape.Circle    -> Math.PI * shape.radius * shape.radius
    is Shape.Rectangle -> shape.width * shape.height
    is Shape.Triangle  -> shape.base * shape.height / 2
    // else 不要！新しいサブクラスを追加すると、ここがコンパイルエラーになる
    // → パターンの追加漏れを防げる
}

// sealed interface も可能（Kotlin 1.5+）
sealed interface Result {
    data class Success(val data: String) : Result
    data class Error(val message: String) : Result
    data object Loading : Result
}
```

### 6.7 abstract class, open class

```java
// Java: クラスはデフォルトで継承可能
public class Animal {                      // 継承可能
    public void speak() { }                // オーバーライド可能
}

public class Dog extends Animal {
    @Override
    public void speak() {
        System.out.println("Woof!");
    }
}

// final で継承を禁止（明示的に）
public final class ImmutablePoint { }      // 継承不可
```

```kotlin
// Kotlin: クラスはデフォルトで final（継承不可）
class Animal {                              // final — 継承できない！
    fun speak() { }                         // final — オーバーライドできない！
}

// open をつけて継承を許可する
open class Animal {                         // 継承可能
    open fun speak() { }                    // オーバーライド可能
    fun breathe() { }                       // final — オーバーライドできない
}

class Dog : Animal() {                      // extends → :
    override fun speak() {                  // @Override → override キーワード
        println("Woof!")
    }
}

// abstract class
abstract class Shape {
    abstract fun area(): Double             // 実装なし → サブクラスで必須

    fun describe() = "Area: ${area()}"      // 実装あり → そのまま使える
}

class Circle(val radius: Double) : Shape() {
    override fun area() = Math.PI * radius * radius
}
```

**Java との重要な違い**: Kotlin はデフォルト `final` なので、意図しない継承を防げる。「継承よりコンポジション」の原則に沿った設計。

### 6.8 interface

```java
// Java
public interface Clickable {
    void onClick();

    // default メソッド（Java 8+）
    default void showRipple() {
        System.out.println("Ripple effect");
    }
}

public interface Focusable {
    default void showFocus() {
        System.out.println("Focus highlight");
    }
}

public class Button implements Clickable, Focusable {
    @Override
    public void onClick() {
        System.out.println("Clicked!");
    }
}
```

```kotlin
// Kotlin: interface — default キーワード不要、プロパティ宣言可
interface Clickable {
    fun onClick()

    // デフォルト実装（default キーワード不要）
    fun showRipple() {
        println("Ripple effect")
    }
}

interface Focusable {
    // プロパティ宣言が可能（Javaのinterfaceではできない）
    val focusColor: String
        get() = "#0000FF"          // デフォルト実装付き

    fun showFocus() {
        println("Focus highlight: $focusColor")
    }
}

class Button : Clickable, Focusable {   // implements → :
    override fun onClick() {
        println("Clicked!")
    }

    // focusColor のデフォルト実装をオーバーライドすることも可能
    override val focusColor = "#FF0000"
}
```

---

## 7. プロパティ

### 7.1 プロパティ = フィールド + getter/setter

```java
// Java: フィールドとgetter/setterを手動で書く
public class User {
    private String name;
    private int age;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getAge() { return age; }
    public void setAge(int age) {
        if (age < 0) throw new IllegalArgumentException("Age must be positive");
        this.age = age;
    }
}

// 呼び出し
user.setName("Kotlin");
String name = user.getName();
```

```kotlin
// Kotlin: プロパティは自動的に getter/setter を持つ
class User {
    var name: String = ""           // getter + setter が自動生成
    val id: Int = 0                 // getter のみ自動生成（val なので）

    var age: Int = 0
        set(value) {                // カスタムsetter
            if (value < 0) throw IllegalArgumentException("Age must be positive")
            field = value           // field = バッキングフィールドへのアクセス
        }
}

// 呼び出し（getter/setter が裏で呼ばれる）
user.name = "Kotlin"               // setName() と同等
val name = user.name               // getName() と同等
```

### 7.2 カスタム getter/setter

```java
// Java
public class Rectangle {
    private double width;
    private double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    // 計算で求めるプロパティ
    public double getArea() {
        return width * height;
    }

    public boolean isSquare() {
        return width == height;
    }
}
```

```kotlin
// Kotlin: カスタム getter
class Rectangle(val width: Double, val height: Double) {
    // 計算プロパティ（フィールドを持たない）
    val area: Double
        get() = width * height

    val isSquare: Boolean
        get() = width == height

    // var のカスタム getter/setter
    var scale: Double = 1.0
        set(value) {
            require(value > 0) { "Scale must be positive" }
            field = value
        }

    val scaledArea: Double
        get() = area * scale
}

val rect = Rectangle(3.0, 4.0)
println(rect.area)       // 12.0
println(rect.isSquare)   // false
```

### 7.3 lateinit var（遅延初期化）

```java
// Java: フィールドを後から初期化（null チェックが必要）
public class MyActivity extends Activity {
    private TextView textView;      // null で初期化される

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        textView = findViewById(R.id.text_view);  // ここで初期化
    }

    private void updateText() {
        if (textView != null) {     // null チェック必要
            textView.setText("Hello");
        }
    }
}
```

```kotlin
// Kotlin: lateinit var で「後で必ず初期化する」と宣言
class MyActivity : Activity() {
    lateinit var textView: TextView    // 初期値なし（後で初期化を約束）

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        textView = findViewById(R.id.text_view)
    }

    private fun updateText() {
        textView.text = "Hello"       // null チェック不要！
    }

    // 初期化済みかどうか確認できる
    fun checkInitialized() {
        if (::textView.isInitialized) {
            textView.text = "Ready"
        }
    }
}

// lateinit の制約:
// - var のみ（val は不可）
// - プリミティブ型は不可（Int, Boolean 等）
// - 初期化前にアクセスすると UninitializedPropertyAccessException
```

### 7.4 lazy（by lazy）

```java
// Java: 遅延初期化（手動で実装）
public class Config {
    private Properties props;

    public Properties getProps() {
        if (props == null) {
            props = new Properties();
            try (InputStream is = new FileInputStream("config.properties")) {
                props.load(is);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
        return props;
    }
}
```

```kotlin
// Kotlin: by lazy で遅延初期化（初回アクセス時に1回だけ実行）
class Config {
    val props: Properties by lazy {
        Properties().apply {
            FileInputStream("config.properties").use { load(it) }
        }
    }
}

// lazy はスレッドセーフ（デフォルト）
// 初回アクセス時にラムダが実行され、結果がキャッシュされる
val heavyData: List<String> by lazy {
    println("Computing...")    // 初回のみ表示
    loadFromDatabase()
}

println(heavyData)  // "Computing..." が表示された後、データが表示
println(heavyData)  // キャッシュされた値がそのまま返る
```

### 7.5 const val

```kotlin
// Kotlin: コンパイル時定数
// const val はコンパイル時に値が確定する定数
// トップレベル、object内、companion object内でのみ使用可
const val MAX_RETRY = 3                  // トップレベル
const val API_URL = "https://api.example.com"

class AppConfig {
    companion object {
        const val VERSION = "1.0.0"      // companion object 内
        const val DEBUG = false
    }
}

// val との違い:
// const val → コンパイル時に値が埋め込まれる（Java の static final と同等）
// val       → 実行時に初期化される
```

```java
// Java 対応
public class AppConfig {
    public static final int MAX_RETRY = 3;
    public static final String API_URL = "https://api.example.com";
    public static final String VERSION = "1.0.0";
    public static final boolean DEBUG = false;
}
```

### 7.6 Java の getter/setter 地獄からの解放

```java
// Java: 典型的なPOJO（Plain Old Java Object）— 80行以上
public class Employee {
    private String name;
    private String department;
    private int salary;
    private boolean active;
    private LocalDate hireDate;

    public Employee() {}

    public Employee(String name, String department, int salary,
                    boolean active, LocalDate hireDate) {
        this.name = name;
        this.department = department;
        this.salary = salary;
        this.active = active;
        this.hireDate = hireDate;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public int getSalary() { return salary; }
    public void setSalary(int salary) { this.salary = salary; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }

    @Override
    public boolean equals(Object o) { /* 省略 */ }

    @Override
    public int hashCode() { /* 省略 */ }

    @Override
    public String toString() { /* 省略 */ }
}
```

```kotlin
// Kotlin: 1行で同等の機能
data class Employee(
    val name: String,
    val department: String,
    val salary: Int,
    val active: Boolean = true,
    val hireDate: LocalDate = LocalDate.now()
)

// これだけで:
// ✅ コンストラクタ
// ✅ 全プロパティの getter
// ✅ equals() / hashCode()
// ✅ toString()
// ✅ copy()
// ✅ デフォルト引数
// が全て揃う

val emp = Employee("田中", "開発部", 500000)
val transferred = emp.copy(department = "営業部")
println(emp)   // Employee(name=田中, department=開発部, salary=500000, ...)
```

---

## 8. コレクション

### 8.1 List, MutableList

```java
// Java: 不変と可変の区別が曖昧
List<String> immutable = List.of("A", "B", "C");       // 不変（Java 9+）
// immutable.add("D");  // UnsupportedOperationException（実行時エラー）

List<String> mutable = new ArrayList<>();               // 可変
mutable.add("A");
mutable.add("B");

// Collections.unmodifiableList は「ビュー」であり、元のリストが変更されると影響を受ける
List<String> unmodifiable = Collections.unmodifiableList(mutable);
```

```kotlin
// Kotlin: 不変と可変が型レベルで分離
val immutable: List<String> = listOf("A", "B", "C")     // 不変
// immutable.add("D")  // コンパイルエラー！（add メソッドが存在しない）

val mutable: MutableList<String> = mutableListOf("A", "B")  // 可変
mutable.add("C")       // OK

// リスト生成のさまざまな方法
val empty = emptyList<String>()
val fromValues = listOf(1, 2, 3)
val fromBuilder = buildList {
    add(1)
    add(2)
    addAll(listOf(3, 4, 5))
}

// 型の変換
val asMutable = immutable.toMutableList()   // 不変 → 可変（コピー）
val asImmutable: List<String> = mutable.toList()  // 可変 → 不変（コピー）
```

### 8.2 Set, MutableSet

```java
// Java
Set<String> set = Set.of("A", "B", "C");
Set<String> mutableSet = new HashSet<>();
mutableSet.add("A");
```

```kotlin
// Kotlin
val set: Set<String> = setOf("A", "B", "C")
val mutableSet: MutableSet<String> = mutableSetOf("A")
mutableSet.add("B")

// 集合演算
val a = setOf(1, 2, 3)
val b = setOf(2, 3, 4)
val union = a union b          // {1, 2, 3, 4}
val intersect = a intersect b  // {2, 3}
val diff = a subtract b        // {1}
```

### 8.3 Map, MutableMap

```java
// Java
Map<String, Integer> map = Map.of("a", 1, "b", 2, "c", 3);  // Java 9+
Map<String, Integer> mutableMap = new HashMap<>();
mutableMap.put("a", 1);
mutableMap.put("b", 2);

// アクセス
int value = map.get("a");   // 1（存在しないキーは null）
int safe = map.getOrDefault("z", 0);  // 0
```

```kotlin
// Kotlin
val map: Map<String, Int> = mapOf("a" to 1, "b" to 2, "c" to 3)
val mutableMap: MutableMap<String, Int> = mutableMapOf("a" to 1)
mutableMap["b"] = 2                    // put の代わりに [] で代入

// アクセス
val value = map["a"]                   // 1（Int? 型 — null かもしれない）
val safe = map.getOrDefault("z", 0)    // 0
val safe2 = map["z"] ?: 0             // エルビス演算子でも可

// to はペア（Pair）を作る中置関数
val pair: Pair<String, Int> = "key" to 42

// 分割代入
for ((key, value) in map) {
    println("$key = $value")
}
```

### 8.4 ファクトリ関数一覧

| Kotlin | 結果の型 | Java 相当 |
|--------|---------|-----------|
| `listOf(1, 2, 3)` | `List<Int>` | `List.of(1, 2, 3)` |
| `mutableListOf(1, 2, 3)` | `MutableList<Int>` | `new ArrayList<>(List.of(1, 2, 3))` |
| `arrayListOf(1, 2, 3)` | `ArrayList<Int>` | `new ArrayList<>(List.of(1, 2, 3))` |
| `setOf(1, 2, 3)` | `Set<Int>` | `Set.of(1, 2, 3)` |
| `mutableSetOf(1, 2, 3)` | `MutableSet<Int>` | `new HashSet<>(Set.of(1, 2, 3))` |
| `mapOf("a" to 1)` | `Map<String, Int>` | `Map.of("a", 1)` |
| `mutableMapOf("a" to 1)` | `MutableMap<String, Int>` | `new HashMap<>(Map.of("a", 1))` |
| `emptyList<Int>()` | `List<Int>` | `Collections.emptyList()` |

### 8.5 Java Collections との相互運用

```kotlin
// Kotlin のコレクションは Java のコレクションと完全互換

// Java の ArrayList を Kotlin から使う
val javaList: java.util.ArrayList<String> = java.util.ArrayList()
javaList.add("Hello")

// Kotlin の List を Java のメソッドに渡せる
fun processJavaApi(list: java.util.List<String>) { /* ... */ }
processJavaApi(listOf("A", "B", "C"))  // そのまま渡せる

// Java から受け取ったコレクションは「プラットフォーム型」
// List<String!> — null かもしれないし、要素も null かもしれない
// 安全のため、明示的な型指定を推奨:
val safeList: List<String> = javaApi.getNames().orEmpty()
```

---

## まとめ: Java → Kotlin 主要な変換パターン

| Java | Kotlin | 備考 |
|------|--------|------|
| `final String x = "hello";` | `val x = "hello"` | val がデフォルト |
| `String x = "hello";` | `var x = "hello"` | 可変が必要な場合のみ |
| `System.out.println(x)` | `println(x)` | トップレベル関数 |
| `String.format("Hi %s", name)` | `"Hi $name"` | 文字列テンプレート |
| `x instanceof String` | `x is String` | スマートキャスト付き |
| `(String) x` | `x as String` | 安全: `x as? String` |
| `x == null ? "default" : x` | `x ?: "default"` | エルビス演算子 |
| `if (x != null) x.method()` | `x?.method()` | 安全呼び出し |
| `obj.getClass()` | `obj::class` | KClass |
| `for (T item : list)` | `for (item in list)` | in キーワード |
| `switch (x) { case: }` | `when (x) { }` | 式として使える |
| `new User("name")` | `User("name")` | new 不要 |
| `public` | （省略） | デフォルト public |
| `void` | `Unit`（省略可） | — |
| `;`（セミコロン） | 不要 | — |

---

## 次のステップ

この基礎編を理解したら、[19-kotlin-advanced.md](19-kotlin-advanced.md)（応用編）に進もう。
ラムダ、コレクション操作、コルーチン、ジェネリクスなど、Kotlin の強力な機能を学ぶ。
