# Java基礎 学び直しガイド — 言語基礎編

> 対象読者: 以前 Java を学んだが、しばらく離れていたエンジニア
> レベル: 初級〜中級
> 前提: Java 8 以前の知識がある程度あること

---

## 目次

1. [Java の全体像（2026年時点）](#1-java-の全体像2026年時点)
2. [基本文法の復習](#2-基本文法の復習)
3. [制御構文](#3-制御構文)
4. [オブジェクト指向](#4-オブジェクト指向)
5. [ジェネリクス](#5-ジェネリクス)
6. [例外処理](#6-例外処理)
7. [コレクションフレームワーク](#7-コレクションフレームワーク)
8. [文字列とテキスト処理](#8-文字列とテキスト処理)

---

## 1. Java の全体像（2026年時点）

### 1.1 バージョン変遷と LTS

Java はかつて数年に1度のメジャーリリースだったが、Java 10 以降は **6ヶ月ごとのリリースサイクル** に変わった。すべてのバージョンを追う必要はなく、**LTS（Long-Term Support）** バージョンを押さえておけばよい。

| バージョン | リリース年 | LTS | 主な追加機能 |
|-----------|-----------|-----|-------------|
| Java 8    | 2014      | Yes | ラムダ式, Stream API, Optional, Date/Time API |
| Java 9    | 2017      | No  | モジュールシステム, JShell, 不変コレクション |
| Java 10   | 2018      | No  | `var`（ローカル変数型推論） |
| Java 11   | 2018      | Yes | HttpClient, String新メソッド, `var` in lambda |
| Java 14   | 2020      | No  | switch式(正式), NullPointerException改善 |
| Java 16   | 2021      | No  | Record(正式), instanceof パターンマッチング(正式) |
| Java 17   | 2021      | Yes | Sealed Classes(正式), テキストブロック(正式) |
| Java 21   | 2023      | Yes | Virtual Threads, パターンマッチング for switch, Record Patterns |

**実務で選ぶべきバージョン:**
- 新規プロジェクト → **Java 21**（最新 LTS）
- 既存プロジェクト → Java 17 または Java 11 が多い

### 1.2 主要な変更点サマリー

Java 8 から Java 21 までの間に追加された重要機能を一覧で示す。

```java
// Java 8: ラムダ式
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
names.forEach(name -> System.out.println(name));

// Java 10: var（型推論）
var message = "Hello, Java!";  // String 型と推論される

// Java 13: テキストブロック（Java 15 で正式化）
var json = """
        {
            "name": "Alice",
            "age": 30
        }
        """;

// Java 14: switch式
String result = switch (day) {
    case MONDAY, FRIDAY -> "Working";
    case SATURDAY, SUNDAY -> "Weekend";
    default -> "Midweek";
};

// Java 16: Record
record Point(int x, int y) {}

// Java 16: instanceof パターンマッチング
if (obj instanceof String s) {
    System.out.println(s.length());
}

// Java 17: Sealed Classes
sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}

// Java 21: Virtual Threads
Thread.startVirtualThread(() -> {
    System.out.println("Running on a virtual thread!");
});

// Java 21: switch パターンマッチング
String describe(Object obj) {
    return switch (obj) {
        case Integer i when i > 0 -> "positive integer: " + i;
        case String s             -> "string: " + s;
        case null                 -> "null";
        default                   -> "other: " + obj;
    };
}
```

### 1.3 JDK のディストリビューション

Java 11 以降、Oracle JDK の商用利用にライセンス条件が変わったため、複数のディストリビューションが使われるようになった。

| ディストリビューション | 提供元 | 特徴 |
|----------------------|--------|------|
| Oracle JDK           | Oracle | 商用利用は有償サブスクリプション（条件あり） |
| OpenJDK              | Oracle/コミュニティ | オープンソースの参照実装 |
| Eclipse Temurin      | Adoptium (旧AdoptOpenJDK) | 広く使われる無償ディストリビューション |
| Amazon Corretto      | Amazon | AWS 環境で最適化、無償 LTS |
| Azul Zulu            | Azul Systems | 幅広いプラットフォーム対応 |
| GraalVM              | Oracle | 高性能ランタイム、ネイティブイメージ |

**実務での選び方:**
- AWS を使うなら → **Amazon Corretto**
- 汎用的に使うなら → **Eclipse Temurin**
- ネイティブバイナリが必要なら → **GraalVM**

---

## 2. 基本文法の復習

### 2.1 変数宣言と var による型推論（Java 10+）

```java
// 従来の書き方
String name = "Alice";
int age = 30;
List<String> items = new ArrayList<>();

// var を使った書き方（Java 10+）
var name = "Alice";          // String と推論
var age = 30;                // int と推論
var items = new ArrayList<String>();  // ArrayList<String> と推論
```

**var の使用ルール:**
```java
// OK: ローカル変数の宣言
var count = 0;
var list = List.of("a", "b", "c");
var stream = list.stream();

// OK: for文の変数
for (var item : list) {
    System.out.println(item);
}

// NG: フィールド（インスタンス変数）には使えない
class MyClass {
    // var name = "Alice";  // コンパイルエラー
    String name = "Alice";  // こちらは OK
}

// NG: メソッドの引数には使えない
// void greet(var name) {}  // コンパイルエラー
void greet(String name) {}  // こちらは OK

// NG: メソッドの戻り値には使えない
// var getName() {}  // コンパイルエラー

// NG: 初期値なしでは使えない
// var x;  // コンパイルエラー（型を推論できない）
```

**var を使うべき場面・避けるべき場面:**
```java
// 良い例: 右辺から型が明らかな場合
var connection = DriverManager.getConnection(url);
var reader = new BufferedReader(new FileReader("data.txt"));
var map = new HashMap<String, List<Integer>>();  // 長い型名の省略

// 悪い例: 右辺から型がわからない場合
var result = service.process();  // 何の型？ → 明示すべき
var data = getValue();           // 何の型？ → 明示すべき
```

### 2.2 プリミティブ型とラッパー型（オートボクシング）

```java
// プリミティブ型（スタック上に直接値を保持、高速）
byte b = 127;           // 8bit
short s = 32767;        // 16bit
int i = 2147483647;     // 32bit
long l = 9223372036854775807L;  // 64bit（末尾に L）
float f = 3.14f;        // 32bit 浮動小数点（末尾に f）
double d = 3.14159;     // 64bit 浮動小数点
char c = 'A';           // 16bit Unicode文字
boolean flag = true;    // true/false

// ラッパー型（オブジェクト、null を持てる）
Byte bObj = 127;
Short sObj = 100;
Integer iObj = 42;
Long lObj = 100L;
Float fObj = 3.14f;
Double dObj = 3.14;
Character cObj = 'A';
Boolean flagObj = true;

// オートボクシング（プリミティブ → ラッパー、自動変換）
Integer num = 42;            // int → Integer（自動）
int value = num;             // Integer → int（アンボクシング、自動）

// 注意: オートボクシングの落とし穴
Integer a = 127;
Integer b2 = 127;
System.out.println(a == b2);     // true（-128〜127はキャッシュ）

Integer c2 = 200;
Integer d2 = 200;
System.out.println(c2 == d2);    // false!（キャッシュ範囲外）
System.out.println(c2.equals(d2)); // true（equals を使うべき）

// null の危険
Integer nullable = null;
// int primitive = nullable;  // NullPointerException!

// 数値リテラルの改善（Java 7+）
int million = 1_000_000;          // アンダースコアで区切れる
long hex = 0xFF_EC_DE_5E;
int binary = 0b1010_0001_0100;
```

### 2.3 文字列操作

```java
// === String の基本（イミュータブル） ===
String s1 = "Hello";
String s2 = "Hello";
System.out.println(s1 == s2);      // true（文字列プール）

String s3 = new String("Hello");
System.out.println(s1 == s3);      // false（別オブジェクト）
System.out.println(s1.equals(s3)); // true（値比較）

// === StringBuilder（ミュータブル、高速な文字列結合） ===
var sb = new StringBuilder();
sb.append("Hello");
sb.append(" ");
sb.append("World");
String result = sb.toString();  // "Hello World"

// ループ内での文字列結合は StringBuilder を使う
// 悪い例
String bad = "";
for (int i = 0; i < 1000; i++) {
    bad += i;  // 毎回新しい String オブジェクトが生成される
}

// 良い例
var good = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    good.append(i);
}

// === テキストブロック（Java 13+、正式版 Java 15+） ===
// 従来の書き方
String oldJson = "{\n" +
    "    \"name\": \"Alice\",\n" +
    "    \"age\": 30\n" +
    "}";

// テキストブロック
String newJson = """
        {
            "name": "Alice",
            "age": 30
        }
        """;

// テキストブロックのインデント制御
String html = """
        <html>
            <body>
                <p>Hello</p>
            </body>
        </html>
        """;
// 閉じ """ の位置でインデントが決まる

// テキストブロック内での変数埋め込み
String name = "Alice";
int age = 30;
String template = """
        Name: %s
        Age: %d
        """.formatted(name, age);

// === 新しい String メソッド（Java 11+） ===
" hello ".isBlank();     // false（空白のみかどうか）
"".isBlank();            // true
"  ".isBlank();          // true
" hello ".strip();       // "hello"（Unicode対応の trim）
" hello ".stripLeading();  // "hello "
" hello ".stripTrailing(); // " hello"
"ha".repeat(3);          // "hahaha"（Java 11+）
"hello\nworld".lines().toList();  // ["hello", "world"]（Java 11+）

// Java 12+
"  hello".indent(4);     // "      hello\n"（インデント追加）
"hello".transform(s -> s.toUpperCase());  // "HELLO"
```

### 2.4 配列 vs コレクション

```java
// === 配列（固定長） ===
int[] numbers = {1, 2, 3, 4, 5};
String[] names = new String[3];
names[0] = "Alice";
names[1] = "Bob";
names[2] = "Charlie";

// 配列の長さ
System.out.println(numbers.length);  // 5（フィールド、メソッドではない）

// 配列のコピー
int[] copy = Arrays.copyOf(numbers, numbers.length);

// === コレクション（可変長） ===
// 従来の書き方
List<String> list1 = new ArrayList<>();
list1.add("Alice");
list1.add("Bob");

// Java 9+: 不変リストの生成
List<String> list2 = List.of("Alice", "Bob", "Charlie");
// list2.add("Dave");  // UnsupportedOperationException!

// Java 9+: 不変マップの生成
Map<String, Integer> map = Map.of(
    "Alice", 30,
    "Bob", 25,
    "Charlie", 35
);

// Java 9+: 不変セットの生成
Set<String> set = Set.of("Alice", "Bob", "Charlie");

// 可変コレクションが必要な場合
var mutableList = new ArrayList<>(List.of("Alice", "Bob"));
mutableList.add("Charlie");  // OK

// 配列 → リスト変換
String[] array = {"a", "b", "c"};
List<String> fromArray = List.of(array);           // 不変リスト
List<String> mutable = new ArrayList<>(List.of(array));  // 可変リスト

// リスト → 配列変換
String[] backToArray = mutableList.toArray(new String[0]);
// Java 11+
String[] backToArray2 = mutableList.toArray(String[]::new);
```

---

## 3. 制御構文

### 3.1 if/else と拡張 switch 式

```java
// === 従来の if/else ===
int score = 85;
String grade;
if (score >= 90) {
    grade = "A";
} else if (score >= 80) {
    grade = "B";
} else if (score >= 70) {
    grade = "C";
} else {
    grade = "F";
}

// === 従来の switch 文 ===
// fall-through に注意（break 忘れバグの温床）
switch (grade) {
    case "A":
        System.out.println("Excellent!");
        break;  // break を忘れると次の case に落ちる
    case "B":
        System.out.println("Good!");
        break;
    default:
        System.out.println("Keep trying!");
}

// === 拡張 switch 式（Java 14+）===
// アロー構文（break 不要、fall-through なし）
String message = switch (grade) {
    case "A" -> "Excellent!";
    case "B" -> "Good!";
    case "C" -> "Average";
    default  -> "Keep trying!";
};

// 複数の値をまとめられる
String type = switch (day) {
    case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> "Weekday";
    case SATURDAY, SUNDAY -> "Weekend";
};

// ブロック構文（複数の処理をしたい場合は yield で値を返す）
String description = switch (statusCode) {
    case 200 -> "OK";
    case 404 -> "Not Found";
    case 500 -> {
        logError("Internal Server Error");
        yield "Server Error";  // yield で値を返す
    }
    default -> "Unknown";
};

// === switch パターンマッチング（Java 21+）===
// 型に応じた分岐（後述のパターンマッチングで詳しく解説）
String describe(Object obj) {
    return switch (obj) {
        case Integer i    -> "Integer: " + i;
        case String s     -> "String: " + s;
        case Double d     -> "Double: " + d;
        case null         -> "null";
        default           -> "Other: " + obj.getClass().getSimpleName();
    };
}
```

### 3.2 ループ

```java
// === 従来の for ===
for (int i = 0; i < 10; i++) {
    System.out.println(i);
}

// === 拡張 for（for-each） ===
List<String> names = List.of("Alice", "Bob", "Charlie");
for (String name : names) {
    System.out.println(name);
}

// === while ===
int count = 0;
while (count < 5) {
    System.out.println(count);
    count++;
}

// === do-while ===
int n = 0;
do {
    System.out.println(n);
    n++;
} while (n < 5);

// === Stream を使った反復（Java 8+、モダンな方法） ===
names.forEach(System.out::println);

// インデックス付きの反復
IntStream.range(0, names.size())
    .forEach(i -> System.out.println(i + ": " + names.get(i)));
```

### 3.3 try-catch-finally と try-with-resources

```java
// === 従来の try-catch-finally ===
BufferedReader reader = null;
try {
    reader = new BufferedReader(new FileReader("data.txt"));
    String line = reader.readLine();
    System.out.println(line);
} catch (FileNotFoundException e) {
    System.err.println("File not found: " + e.getMessage());
} catch (IOException e) {
    System.err.println("IO error: " + e.getMessage());
} finally {
    if (reader != null) {
        try {
            reader.close();
        } catch (IOException e) {
            // close 失敗の処理
        }
    }
}

// === try-with-resources（Java 7+）===
// AutoCloseable を実装するリソースは自動で close される
try (var reader2 = new BufferedReader(new FileReader("data.txt"))) {
    String line = reader2.readLine();
    System.out.println(line);
} catch (IOException e) {
    System.err.println("Error: " + e.getMessage());
}
// reader2 は自動的に close される（finally 不要）

// 複数リソースの管理
try (
    var input = new FileInputStream("input.txt");
    var output = new FileOutputStream("output.txt")
) {
    input.transferTo(output);  // Java 9+
} catch (IOException e) {
    e.printStackTrace();
}

// === マルチキャッチ（Java 7+）===
try {
    // 何かの処理
    riskyOperation();
} catch (IOException | SQLException e) {
    // 複数の例外を1つの catch で処理
    System.err.println("Error: " + e.getMessage());
}
```

---

## 4. オブジェクト指向

### 4.1 クラスとオブジェクト

```java
// === 従来のクラス定義 ===
public class Person {
    private String name;
    private int age;

    // コンストラクタ
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // ゲッター
    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    // セッター
    public void setName(String name) {
        this.name = name;
    }

    // メソッド
    public String greet() {
        return "Hello, I'm " + name + " (" + age + ")";
    }

    // toString
    @Override
    public String toString() {
        return "Person{name='" + name + "', age=" + age + "}";
    }

    // equals と hashCode
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Person person = (Person) o;
        return age == person.age && Objects.equals(name, person.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }
}

// === Record を使った場合（Java 16+）===
// 上の Person クラスとほぼ同等の機能が1行で書ける
public record PersonRecord(String name, int age) {
    public String greet() {
        return "Hello, I'm " + name + " (" + age + ")";
    }
}
// getter, toString, equals, hashCode は自動生成される
// ただしイミュータブル（setter は存在しない）

// 使い方
var person = new PersonRecord("Alice", 30);
System.out.println(person.name());   // "Alice"（getter は name() 形式）
System.out.println(person.greet());  // "Hello, I'm Alice (30)"
```

### 4.2 コンストラクタ

```java
// === 複数のコンストラクタ ===
public class Product {
    private String name;
    private double price;
    private String category;

    // メインコンストラクタ
    public Product(String name, double price, String category) {
        this.name = name;
        this.price = price;
        this.category = category;
    }

    // オーバーロードコンストラクタ（this で委譲）
    public Product(String name, double price) {
        this(name, price, "General");
    }

    public Product(String name) {
        this(name, 0.0, "General");
    }
}

// === Record のコンパクトコンストラクタ（Java 16+） ===
public record Email(String address) {
    // コンパクトコンストラクタ（引数リストを書かない）
    public Email {
        // バリデーションに使う
        if (address == null || !address.contains("@")) {
            throw new IllegalArgumentException(
                "Invalid email: " + address
            );
        }
        // this.address = address; は自動的に行われる
        // フィールドの変換も可能
        address = address.toLowerCase().trim();
    }
}

// 使い方
var email = new Email("Alice@Example.com");
System.out.println(email.address());  // "alice@example.com"
// new Email("invalid");  // IllegalArgumentException
```

### 4.3 継承と多態性（Polymorphism）

```java
// === 基底クラス ===
public class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public String speak() {
        return name + " makes a sound";
    }
}

// === 派生クラス ===
public class Dog extends Animal {
    private String breed;

    public Dog(String name, String breed) {
        super(name);  // 親のコンストラクタ呼び出し
        this.breed = breed;
    }

    @Override
    public String speak() {
        return name + " barks! (breed: " + breed + ")";
    }
}

public class Cat extends Animal {
    public Cat(String name) {
        super(name);
    }

    @Override
    public String speak() {
        return name + " meows!";
    }
}

// === 多態性の利用 ===
List<Animal> animals = List.of(
    new Dog("Rex", "Shepherd"),
    new Cat("Whiskers"),
    new Dog("Buddy", "Labrador")
);

for (Animal animal : animals) {
    System.out.println(animal.speak());  // 実際の型に応じたメソッドが呼ばれる
}
// Rex barks! (breed: Shepherd)
// Whiskers meows!
// Buddy barks! (breed: Labrador)
```

### 4.4 インターフェース（Java 8+/9+ の拡張）

```java
// === インターフェースの進化 ===
public interface Printable {
    // 抽象メソッド（実装クラスで必ず実装する）
    void print();

    // default メソッド（Java 8+）— デフォルト実装を持てる
    default void printWithBorder() {
        System.out.println("====================");
        print();
        System.out.println("====================");
    }

    // static メソッド（Java 8+）— ユーティリティメソッド
    static Printable of(String message) {
        return () -> System.out.println(message);
    }

    // private メソッド（Java 9+）— default メソッド内の共通処理
    private void logPrint(String message) {
        System.out.println("[LOG] Printing: " + message);
    }
}

// 実装
public class Document implements Printable {
    private String content;

    public Document(String content) {
        this.content = content;
    }

    @Override
    public void print() {
        System.out.println(content);
    }
}

// 使い方
var doc = new Document("Hello, World!");
doc.print();           // "Hello, World!"
doc.printWithBorder();
// ====================
// Hello, World!
// ====================

Printable simple = Printable.of("Quick message");
simple.print();  // "Quick message"

// === 複数インターフェースの実装 ===
public interface Serializable {
    String serialize();
}

public interface Loggable {
    default void log() {
        System.out.println("[LOG] " + this);
    }
}

public class User implements Printable, Serializable, Loggable {
    private String name;

    public User(String name) {
        this.name = name;
    }

    @Override
    public void print() {
        System.out.println("User: " + name);
    }

    @Override
    public String serialize() {
        return "{\"name\": \"" + name + "\"}";
    }

    @Override
    public String toString() {
        return "User(" + name + ")";
    }
}
```

### 4.5 抽象クラス vs インターフェースの使い分け

```java
// === 抽象クラス ===
// - 状態（フィールド）を持てる
// - コンストラクタを持てる
// - 1つしか継承できない（単一継承）
public abstract class AbstractRepository<T> {
    protected final String tableName;

    public AbstractRepository(String tableName) {
        this.tableName = tableName;
    }

    // 抽象メソッド（サブクラスで実装必須）
    public abstract T findById(long id);
    public abstract void save(T entity);

    // 具象メソッド（共通処理）
    public void logAccess(String operation) {
        System.out.println("[" + tableName + "] " + operation);
    }
}

// === インターフェース ===
// - 状態を持たない（定数のみ）
// - 複数実装可能
// - default メソッドで実装を持てる（Java 8+）
public interface Cacheable {
    Duration getCacheTTL();

    default boolean isCacheExpired(Instant lastCached) {
        return Instant.now().isAfter(lastCached.plus(getCacheTTL()));
    }
}

// === 使い分けの指針 ===
// 「is-a」関係 → 抽象クラス（例: Dog is an Animal）
// 「can-do」関係 → インターフェース（例: Document can be Printable）
// 状態の共有が必要 → 抽象クラス
// 複数の機能を横断的に追加 → インターフェース
```

### 4.6 カプセル化と Record

```java
// === 従来のカプセル化（getter/setter） ===
public class BankAccount {
    private String accountNumber;
    private double balance;

    public BankAccount(String accountNumber, double initialBalance) {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
    }

    // getter のみ（外部から変更不可）
    public String getAccountNumber() {
        return accountNumber;
    }

    public double getBalance() {
        return balance;
    }

    // ビジネスロジックを通じてのみ変更可能
    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        this.balance += amount;
    }

    public void withdraw(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        if (amount > balance) throw new IllegalStateException("Insufficient funds");
        this.balance -= amount;
    }
}

// === Record を使ったイミュータブルな値オブジェクト（Java 16+） ===
public record Money(BigDecimal amount, Currency currency) {
    // コンパクトコンストラクタでバリデーション
    public Money {
        Objects.requireNonNull(amount, "Amount must not be null");
        Objects.requireNonNull(currency, "Currency must not be null");
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount must not be negative");
        }
    }

    // メソッド追加（新しいオブジェクトを返す）
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }

    public Money multiply(int factor) {
        return new Money(this.amount.multiply(BigDecimal.valueOf(factor)), currency);
    }
}

// 使い方
var price = new Money(new BigDecimal("19.99"), Currency.getInstance("JPY"));
var tax = new Money(new BigDecimal("1.60"), Currency.getInstance("JPY"));
var total = price.add(tax);
System.out.println(total);  // Money[amount=21.59, currency=JPY]
```

### 4.7 enum（拡張 enum）

```java
// === 基本的な enum ===
public enum Season {
    SPRING, SUMMER, AUTUMN, WINTER
}

// 使い方
Season s = Season.SPRING;
System.out.println(s.name());     // "SPRING"
System.out.println(s.ordinal());  // 0

// === フィールドとメソッドを持つ enum ===
public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    VENUS(4.869e+24, 6.0518e6),
    EARTH(5.976e+24, 6.37814e6),
    MARS(6.421e+23, 3.3972e6);

    private final double mass;
    private final double radius;

    // enum のコンストラクタは暗黙的に private
    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
    }

    public double surfaceGravity() {
        final double G = 6.67300E-11;
        return G * mass / (radius * radius);
    }

    public double surfaceWeight(double otherMass) {
        return otherMass * surfaceGravity();
    }
}

// 使い方
double earthWeight = 75.0;
double mass = earthWeight / Planet.EARTH.surfaceGravity();
for (Planet p : Planet.values()) {
    System.out.printf("Your weight on %s is %6.2f%n",
        p, p.surfaceWeight(mass));
}

// === 抽象メソッドを持つ enum ===
public enum Operation {
    ADD {
        @Override
        public double apply(double x, double y) { return x + y; }
    },
    SUBTRACT {
        @Override
        public double apply(double x, double y) { return x - y; }
    },
    MULTIPLY {
        @Override
        public double apply(double x, double y) { return x * y; }
    },
    DIVIDE {
        @Override
        public double apply(double x, double y) {
            if (y == 0) throw new ArithmeticException("Division by zero");
            return x / y;
        }
    };

    public abstract double apply(double x, double y);
}

// 使い方
double result = Operation.ADD.apply(10, 3);  // 13.0

// === enum + インターフェース ===
public interface Describable {
    String describe();
}

public enum HttpStatus implements Describable {
    OK(200, "OK"),
    NOT_FOUND(404, "Not Found"),
    INTERNAL_SERVER_ERROR(500, "Internal Server Error");

    private final int code;
    private final String message;

    HttpStatus(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() { return code; }

    @Override
    public String describe() {
        return code + " " + message;
    }
}
```

---

## 5. ジェネリクス

### 5.1 基本的な使い方

```java
// === ジェネリクスなしの場合（非推奨） ===
List rawList = new ArrayList();
rawList.add("Hello");
rawList.add(42);  // 何でも入る
String s = (String) rawList.get(0);  // キャストが必要
// String s2 = (String) rawList.get(1);  // ClassCastException!

// === ジェネリクスありの場合（推奨） ===
List<String> typedList = new ArrayList<>();
typedList.add("Hello");
// typedList.add(42);  // コンパイルエラー（型安全）
String s2 = typedList.get(0);  // キャスト不要
```

### 5.2 独自ジェネリッククラス/メソッド

```java
// === ジェネリッククラス ===
public class Pair<A, B> {
    private final A first;
    private final B second;

    public Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }

    public A getFirst() { return first; }
    public B getSecond() { return second; }

    @Override
    public String toString() {
        return "(" + first + ", " + second + ")";
    }
}

// 使い方
var pair = new Pair<>("Alice", 30);          // Pair<String, Integer>
var coord = new Pair<>(3.14, 2.72);          // Pair<Double, Double>
var nested = new Pair<>("key", List.of(1, 2, 3));  // Pair<String, List<Integer>>

// === ジェネリックメソッド ===
public class Utils {
    // <T> はメソッドレベルの型パラメータ
    public static <T> List<T> listOf(T... items) {
        var list = new ArrayList<T>();
        for (T item : items) {
            list.add(item);
        }
        return list;
    }

    // 複数の型パラメータ
    public static <K, V> Map<K, V> mapOf(K key, V value) {
        var map = new HashMap<K, V>();
        map.put(key, value);
        return map;
    }
}

// 使い方（型は推論される）
List<String> names = Utils.listOf("Alice", "Bob");
Map<String, Integer> ages = Utils.mapOf("Alice", 30);

// === ジェネリック Record（Java 16+） ===
public record Result<T>(T value, String message, boolean success) {
    public static <T> Result<T> ok(T value) {
        return new Result<>(value, "Success", true);
    }

    public static <T> Result<T> error(String message) {
        return new Result<>(null, message, false);
    }
}

// 使い方
var result = Result.ok("Hello");       // Result<String>
var error = Result.<Integer>error("Not found");  // Result<Integer>
```

### 5.3 境界型パラメータ（extends, super）

```java
// === 上限境界（extends） ===
// T は Number またはそのサブクラスでなければならない
public static <T extends Number> double sum(List<T> numbers) {
    double total = 0;
    for (T num : numbers) {
        total += num.doubleValue();
    }
    return total;
}

// 使い方
sum(List.of(1, 2, 3));          // OK: Integer extends Number
sum(List.of(1.5, 2.5, 3.5));   // OK: Double extends Number
// sum(List.of("a", "b"));     // コンパイルエラー: String は Number ではない

// === 複数の境界 ===
// T は Comparable を実装し、かつ Serializable を実装する
public static <T extends Comparable<T> & Serializable> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}
```

### 5.4 ワイルドカードと PECS 原則

```java
// === ワイルドカード ===
// ? — 任意の型
public static void printAll(List<?> list) {
    for (Object item : list) {
        System.out.println(item);
    }
}

// ? extends T — T またはそのサブクラス（読み取り専用）
public static double sumOfNumbers(List<? extends Number> numbers) {
    double total = 0;
    for (Number num : numbers) {
        total += num.doubleValue();
    }
    return total;
    // numbers.add(42);  // コンパイルエラー!（書き込み不可）
}

// ? super T — T またはそのスーパークラス（書き込み専用）
public static void addIntegers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
    list.add(3);
    // Integer n = list.get(0);  // コンパイルエラー!（読み取り時の型が不明）
}

// === PECS原則（Producer Extends, Consumer Super） ===
// コレクションから値を「取り出す（produce）」なら extends
// コレクションに値を「入れる（consume）」なら super

public static <T> void copy(
    List<? extends T> source,   // Producer（読み取り元）→ extends
    List<? super T> destination // Consumer（書き込み先）→ super
) {
    for (T item : source) {
        destination.add(item);
    }
}

// 使い方
List<Integer> ints = List.of(1, 2, 3);
List<Number> nums = new ArrayList<>();
copy(ints, nums);  // Integer → Number にコピー
```

### 5.5 型消去（Type Erasure）

```java
// コンパイル後、ジェネリクスの型情報は消える（型消去）
// コンパイル前:
List<String> strings = new ArrayList<>();
List<Integer> integers = new ArrayList<>();

// コンパイル後（概念的に）:
// List strings = new ArrayList();
// List integers = new ArrayList();

// そのため以下のようなことはできない:
// T t = new T();                    // NG: 型パラメータのインスタンス化
// if (obj instanceof List<String>)  // NG: 実行時に型情報がない
// T[] array = new T[10];           // NG: ジェネリック配列の生成

// 型消去を意識した実装
public class TypeToken<T> {
    // リフレクションを使って実行時に型情報を取得するテクニック
    private final Class<T> type;

    public TypeToken(Class<T> type) {
        this.type = type;
    }

    public T cast(Object obj) {
        return type.cast(obj);
    }
}
```

---

## 6. 例外処理

### 6.1 チェック例外 vs 非チェック例外

```java
// === Java の例外階層 ===
// Throwable
//   ├── Error（回復不能、キャッチしない: OutOfMemoryError 等）
//   └── Exception
//       ├── RuntimeException（非チェック例外）
//       │   ├── NullPointerException
//       │   ├── IllegalArgumentException
//       │   ├── IllegalStateException
//       │   ├── IndexOutOfBoundsException
//       │   └── ...
//       └── その他（チェック例外）
//           ├── IOException
//           ├── SQLException
//           ├── ClassNotFoundException
//           └── ...

// === チェック例外 ===
// コンパイラが処理を強制する（try-catch か throws 宣言が必要）
public String readFile(String path) throws IOException {
    return Files.readString(Path.of(path));
}

// === 非チェック例外（RuntimeException） ===
// コンパイラは処理を強制しない
public int divide(int a, int b) {
    if (b == 0) {
        throw new IllegalArgumentException("Divisor must not be zero");
    }
    return a / b;
}
```

### 6.2 カスタム例外

```java
// === チェック例外のカスタム例外 ===
public class UserNotFoundException extends Exception {
    private final long userId;

    public UserNotFoundException(long userId) {
        super("User not found: " + userId);
        this.userId = userId;
    }

    public long getUserId() {
        return userId;
    }
}

// === 非チェック例外のカスタム例外 ===
public class InvalidOrderException extends RuntimeException {
    private final String orderId;

    public InvalidOrderException(String orderId, String reason) {
        super("Invalid order " + orderId + ": " + reason);
        this.orderId = orderId;
    }

    public String getOrderId() {
        return orderId;
    }
}

// 使い方
public User findUser(long id) throws UserNotFoundException {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException(id));
}

public void processOrder(Order order) {
    if (order.getItems().isEmpty()) {
        throw new InvalidOrderException(order.getId(), "No items in order");
    }
    // 処理続行
}
```

### 6.3 マルチキャッチ（Java 7+）

```java
// === 従来（冗長） ===
try {
    processData();
} catch (IOException e) {
    logger.error("Error: " + e.getMessage());
    throw new ServiceException(e);
} catch (SQLException e) {
    logger.error("Error: " + e.getMessage());  // 同じ処理
    throw new ServiceException(e);
} catch (ClassNotFoundException e) {
    logger.error("Error: " + e.getMessage());  // 同じ処理
    throw new ServiceException(e);
}

// === マルチキャッチ（Java 7+） ===
try {
    processData();
} catch (IOException | SQLException | ClassNotFoundException e) {
    logger.error("Error: " + e.getMessage());
    throw new ServiceException(e);
}
```

### 6.4 try-with-resources の詳細

```java
// === AutoCloseable インターフェースの実装 ===
public class DatabaseConnection implements AutoCloseable {
    private final Connection connection;

    public DatabaseConnection(String url) throws SQLException {
        this.connection = DriverManager.getConnection(url);
        System.out.println("Connection opened");
    }

    public void execute(String sql) throws SQLException {
        try (var stmt = connection.createStatement()) {
            stmt.execute(sql);
        }
    }

    @Override
    public void close() throws SQLException {
        connection.close();
        System.out.println("Connection closed");
    }
}

// 使い方
try (var db = new DatabaseConnection("jdbc:h2:mem:test")) {
    db.execute("CREATE TABLE test (id INT)");
    db.execute("INSERT INTO test VALUES (1)");
} catch (SQLException e) {
    e.printStackTrace();
}
// "Connection closed" が自動的に出力される

// === 実質 final 変数を try-with-resources で使う（Java 9+） ===
BufferedReader reader = new BufferedReader(new FileReader("data.txt"));
// Java 9+ では事前に宣言した変数も使える（effectively final であること）
try (reader) {
    System.out.println(reader.readLine());
}

// === Suppressed Exceptions ===
// close() で例外が発生した場合、元の例外に付加される
try (var resource = new MyResource()) {
    resource.doSomething();  // ここで例外 A が発生
} // close() で例外 B が発生した場合
catch (Exception e) {
    System.out.println(e.getMessage());  // 例外 A のメッセージ
    for (Throwable suppressed : e.getSuppressed()) {
        System.out.println("Suppressed: " + suppressed.getMessage());  // 例外 B
    }
}
```

---

## 7. コレクションフレームワーク

### 7.1 List（ArrayList, LinkedList）

```java
// === ArrayList（配列ベース、ランダムアクセスが高速） ===
List<String> arrayList = new ArrayList<>();
arrayList.add("Alice");
arrayList.add("Bob");
arrayList.add("Charlie");
arrayList.add(1, "Dave");  // インデックス1に挿入

String first = arrayList.get(0);        // O(1) — 高速
arrayList.remove("Bob");                // O(n) — 線形探索
arrayList.set(0, "Alicia");             // O(1) — 高速
boolean exists = arrayList.contains("Charlie");  // O(n)

// === LinkedList（双方向連結リスト、先頭/末尾の追加・削除が高速） ===
LinkedList<String> linkedList = new LinkedList<>();
linkedList.addFirst("First");           // O(1)
linkedList.addLast("Last");             // O(1)
linkedList.add("Middle");               // O(1)（末尾）
String head = linkedList.getFirst();    // O(1)
String tail = linkedList.getLast();     // O(1)
linkedList.removeFirst();               // O(1)
// ランダムアクセスは O(n) — 遅い

// === 使い分け ===
// ほとんどの場合は ArrayList を使う
// Queue/Deque として使う場合のみ LinkedList

// === 便利な操作 ===
// ソート
var names = new ArrayList<>(List.of("Charlie", "Alice", "Bob"));
Collections.sort(names);                          // 自然順序
names.sort(Comparator.reverseOrder());             // 逆順
names.sort(Comparator.comparing(String::length));  // 長さ順

// 不変リスト（Java 9+）
List<String> immutable = List.of("a", "b", "c");
// immutable.add("d");  // UnsupportedOperationException

// 可変リストのコピーから不変リストを作る（Java 10+）
List<String> copy = List.copyOf(names);

// リストの変換（Stream利用）
List<Integer> lengths = names.stream()
    .map(String::length)
    .toList();  // Java 16+（それ以前は .collect(Collectors.toList())）
```

### 7.2 Set（HashSet, TreeSet, LinkedHashSet）

```java
// === HashSet（順序なし、最高速） ===
Set<String> hashSet = new HashSet<>();
hashSet.add("Alice");
hashSet.add("Bob");
hashSet.add("Alice");  // 重複は無視される
System.out.println(hashSet.size());  // 2
System.out.println(hashSet.contains("Alice"));  // true — O(1)

// === TreeSet（ソート順を維持） ===
Set<String> treeSet = new TreeSet<>();
treeSet.add("Charlie");
treeSet.add("Alice");
treeSet.add("Bob");
System.out.println(treeSet);  // [Alice, Bob, Charlie]（自然順序）

// カスタム比較
Set<String> byLength = new TreeSet<>(Comparator.comparingInt(String::length));
byLength.add("Hi");
byLength.add("Hello");
byLength.add("Hey");  // 長さ3 → "Hi"(2), "Hey"(3) のみ（長さが同じ"Hey"と"Bob"は重複扱い）

// === LinkedHashSet（挿入順を維持） ===
Set<String> linkedHashSet = new LinkedHashSet<>();
linkedHashSet.add("Charlie");
linkedHashSet.add("Alice");
linkedHashSet.add("Bob");
System.out.println(linkedHashSet);  // [Charlie, Alice, Bob]（挿入順）

// === 不変セット（Java 9+） ===
Set<String> immutableSet = Set.of("a", "b", "c");

// === 集合演算 ===
Set<Integer> setA = new HashSet<>(Set.of(1, 2, 3, 4));
Set<Integer> setB = Set.of(3, 4, 5, 6);

// 和集合（union）
Set<Integer> union = new HashSet<>(setA);
union.addAll(setB);  // {1, 2, 3, 4, 5, 6}

// 積集合（intersection）
Set<Integer> intersection = new HashSet<>(setA);
intersection.retainAll(setB);  // {3, 4}

// 差集合（difference）
Set<Integer> difference = new HashSet<>(setA);
difference.removeAll(setB);  // {1, 2}
```

### 7.3 Map（HashMap, TreeMap, LinkedHashMap, ConcurrentHashMap）

```java
// === HashMap（順序なし、最高速） ===
Map<String, Integer> hashMap = new HashMap<>();
hashMap.put("Alice", 30);
hashMap.put("Bob", 25);
hashMap.put("Charlie", 35);

int age = hashMap.get("Alice");             // 30
int unknown = hashMap.getOrDefault("Dave", 0);  // 0（キーがない場合のデフォルト）
boolean hasKey = hashMap.containsKey("Bob");     // true

// Java 8+ の便利メソッド
hashMap.putIfAbsent("Dave", 40);  // キーがなければ追加
hashMap.computeIfAbsent("Eve", key -> key.length());  // 5（キーがなければ計算して追加）
hashMap.merge("Alice", 1, Integer::sum);  // 30 + 1 = 31（既存値とマージ）

// 反復
for (Map.Entry<String, Integer> entry : hashMap.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}
// Java 8+
hashMap.forEach((key, value) -> System.out.println(key + ": " + value));

// === TreeMap（キーのソート順を維持） ===
Map<String, Integer> treeMap = new TreeMap<>(hashMap);
// キーがアルファベット順に並ぶ

// === LinkedHashMap（挿入順を維持） ===
Map<String, Integer> linkedHashMap = new LinkedHashMap<>();
linkedHashMap.put("Charlie", 35);
linkedHashMap.put("Alice", 30);
linkedHashMap.put("Bob", 25);
// 反復すると挿入順で出力される

// === ConcurrentHashMap（スレッドセーフ） ===
Map<String, Integer> concurrentMap = new ConcurrentHashMap<>();
concurrentMap.put("counter", 0);
// マルチスレッド環境で安全に使える
concurrentMap.compute("counter", (key, value) -> value + 1);

// === 不変マップ（Java 9+） ===
Map<String, Integer> immutableMap = Map.of(
    "Alice", 30,
    "Bob", 25,
    "Charlie", 35
);

// 10個以上のエントリ
Map<String, Integer> largeMap = Map.ofEntries(
    Map.entry("Alice", 30),
    Map.entry("Bob", 25),
    Map.entry("Charlie", 35),
    Map.entry("Dave", 40)
    // ... いくつでも追加可能
);
```

### 7.4 Queue, Deque

```java
// === Queue（FIFO: First In, First Out） ===
Queue<String> queue = new LinkedList<>();
queue.offer("first");   // 末尾に追加
queue.offer("second");
queue.offer("third");

String head = queue.peek();   // 先頭を参照（削除しない）、空なら null
String removed = queue.poll(); // 先頭を取得して削除、空なら null
// queue.add() / queue.element() / queue.remove() は例外を投げる版

// === PriorityQueue（優先度付きキュー） ===
Queue<Integer> pq = new PriorityQueue<>();  // 自然順序（小さい順）
pq.offer(30);
pq.offer(10);
pq.offer(20);
System.out.println(pq.poll());  // 10（最小値が先に出る）
System.out.println(pq.poll());  // 20

// カスタム優先度
Queue<String> pqByLength = new PriorityQueue<>(
    Comparator.comparingInt(String::length)
);

// === Deque（両端キュー: Double-Ended Queue） ===
Deque<String> deque = new ArrayDeque<>();
deque.offerFirst("middle");
deque.offerFirst("first");   // 先頭に追加
deque.offerLast("last");     // 末尾に追加

String first2 = deque.peekFirst();  // "first"
String last = deque.peekLast();     // "last"

// Deque はスタックとしても使える
Deque<String> stack = new ArrayDeque<>();
stack.push("bottom");   // 先頭に追加（スタックの push）
stack.push("middle");
stack.push("top");
String top = stack.pop();     // "top"（スタックの pop）
String peek = stack.peek();   // "middle"（スタックの peek）
```

### 7.5 Collections ユーティリティ

```java
var list = new ArrayList<>(List.of(3, 1, 4, 1, 5, 9, 2, 6));

// ソート
Collections.sort(list);                     // [1, 1, 2, 3, 4, 5, 6, 9]
Collections.sort(list, Comparator.reverseOrder());  // 逆順

// シャッフル
Collections.shuffle(list);

// 最大値・最小値
int max = Collections.max(list);
int min = Collections.min(list);

// 頻度
int freq = Collections.frequency(list, 1);  // 1 の出現回数

// 不変ラッパー
List<Integer> unmodifiable = Collections.unmodifiableList(list);
// unmodifiable.add(10);  // UnsupportedOperationException

// 同期ラッパー（スレッドセーフ化）
List<Integer> syncList = Collections.synchronizedList(new ArrayList<>());

// 空コレクション
List<String> empty = Collections.emptyList();
Map<String, Integer> emptyMap = Collections.emptyMap();

// シングルトン
List<String> single = Collections.singletonList("only");
```

### 7.6 不変コレクション（Java 9+）

```java
// === Java 9+ の不変コレクションファクトリメソッド ===

// List.of()
List<String> list = List.of("a", "b", "c");
// list.add("d");  // UnsupportedOperationException
// list.set(0, "x");  // UnsupportedOperationException
// List.of("a", null);  // NullPointerException（null 不可）

// Set.of()
Set<String> set = Set.of("a", "b", "c");
// Set.of("a", "a");  // IllegalArgumentException（重複不可）

// Map.of()
Map<String, Integer> map = Map.of("a", 1, "b", 2);

// Map.ofEntries()（10個以上の場合）
Map<String, Integer> largeMap = Map.ofEntries(
    Map.entry("key1", 1),
    Map.entry("key2", 2)
);

// === Java 10+: List.copyOf(), Set.copyOf(), Map.copyOf() ===
var mutableList = new ArrayList<>(List.of("a", "b", "c"));
var immutableCopy = List.copyOf(mutableList);
mutableList.add("d");
System.out.println(immutableCopy);  // [a, b, c]（元のリストの変更は影響しない）

// === Java 16+: Stream.toList() ===
// 従来
List<String> oldWay = list.stream()
    .filter(s -> s.startsWith("a"))
    .collect(Collectors.toList());  // 可変リストを返す

// Java 16+
List<String> newWay = list.stream()
    .filter(s -> s.startsWith("a"))
    .toList();  // 不変リストを返す
```

---

## 8. 文字列とテキスト処理

### 8.1 String のイミュータビリティ

```java
// String は不変（イミュータブル）
String s = "Hello";
s.toUpperCase();           // 新しい String を返す
System.out.println(s);     // "Hello"（元の s は変わらない）

String upper = s.toUpperCase();
System.out.println(upper); // "HELLO"

// 文字列結合の内部動作
// Java のコンパイラは + 演算子を最適化する
String result = "Hello" + " " + "World";  // コンパイル時に結合される

// ループ内での結合は StringBuilder を使うべき
var sb = new StringBuilder();
for (int i = 0; i < 100; i++) {
    sb.append("item").append(i).append(", ");
}
String joined = sb.toString();
```

### 8.2 テキストブロック（Java 13+）

```java
// === テキストブロックの基本 ===
String sql = """
        SELECT u.name, u.email
        FROM users u
        JOIN orders o ON u.id = o.user_id
        WHERE o.status = 'ACTIVE'
        ORDER BY u.name
        """;

// === インデント制御 ===
// 閉じ """ の位置が基準になる
String noIndent = """
hello
world
""";
// → "hello\nworld\n"

String withIndent = """
        hello
        world
        """;
// → "hello\nworld\n"（共通の先頭空白が除去される）

// === エスケープシーケンス ===
// 改行を防ぐ（Java 14+: \ で行末の改行を抑制）
String longLine = """
        This is a very long line \
        that continues on the next line \
        but will be treated as one line.""";
// → "This is a very long line that continues on the next line but will be treated as one line."

// 末尾の空白を保持（\s）
String withTrailingSpace = """
        Name:   \s
        Age:    \s
        """;

// === 変数埋め込み ===
String name = "Alice";
int age = 30;

// formatted() メソッド
String template = """
        {
            "name": "%s",
            "age": %d
        }
        """.formatted(name, age);

// String.format()
String template2 = String.format("""
        User: %s
        Age: %d
        """, name, age);
```

### 8.3 String.format vs formatted メソッド

```java
// === String.format（従来） ===
String msg1 = String.format("Hello, %s! You are %d years old.", "Alice", 30);

// === formatted（Java 15+、インスタンスメソッド） ===
String msg2 = "Hello, %s! You are %d years old.".formatted("Alice", 30);

// === フォーマット指定子 ===
// %s — 文字列
// %d — 整数
// %f — 浮動小数点
// %n — 改行（プラットフォーム依存）
// %% — % 文字自体
// %t — 日時

String formatted = """
        Name:    %s
        Age:     %d
        Height:  %.1f cm
        Active:  %b
        """.formatted("Alice", 30, 165.5, true);

// 幅指定
String table = String.format("%-10s %5d %8.2f%n", "Apple", 3, 1.50);
// "Apple          3     1.50"
// %-10s: 左寄せ10文字幅
// %5d: 右寄せ5文字幅
// %8.2f: 右寄せ8文字幅、小数点以下2桁
```

### 8.4 正規表現（Pattern, Matcher）

```java
import java.util.regex.Pattern;
import java.util.regex.Matcher;

// === 基本的なパターンマッチ ===
String text = "Hello, my email is alice@example.com and bob@test.org";

// matches — 全体一致
boolean isEmail = "alice@example.com".matches("[\\w.-]+@[\\w.-]+\\.\\w+");
System.out.println(isEmail);  // true

// === Pattern と Matcher ===
Pattern emailPattern = Pattern.compile("[\\w.-]+@[\\w.-]+\\.\\w+");
Matcher matcher = emailPattern.matcher(text);

// find — 部分一致を繰り返し検索
while (matcher.find()) {
    System.out.println("Found: " + matcher.group());
    System.out.println("  at position: " + matcher.start() + "-" + matcher.end());
}
// Found: alice@example.com
//   at position: 19-35
// Found: bob@test.org
//   at position: 40-52

// === グループ ===
Pattern datePattern = Pattern.compile("(\\d{4})-(\\d{2})-(\\d{2})");
Matcher dateMatcher = datePattern.matcher("Today is 2026-03-23");

if (dateMatcher.find()) {
    String whole = dateMatcher.group(0);  // "2026-03-23"
    String year  = dateMatcher.group(1);  // "2026"
    String month = dateMatcher.group(2);  // "03"
    String day   = dateMatcher.group(3);  // "23"
}

// === 名前付きグループ ===
Pattern namedPattern = Pattern.compile(
    "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})"
);
Matcher namedMatcher = namedPattern.matcher("2026-03-23");
if (namedMatcher.find()) {
    String year = namedMatcher.group("year");   // "2026"
    String month = namedMatcher.group("month"); // "03"
}

// === 置換 ===
String result = text.replaceAll("[\\w.-]+@[\\w.-]+\\.\\w+", "[EMAIL]");
// "Hello, my email is [EMAIL] and [EMAIL]"

// Pattern を使った置換（コンパイル済みで高速）
String result2 = emailPattern.matcher(text).replaceAll("[EMAIL]");

// === 分割 ===
String csv = "Alice,Bob,,Charlie";
String[] parts = csv.split(",");       // ["Alice", "Bob", "", "Charlie"]
String[] parts2 = csv.split(",", -1);  // 末尾の空文字も保持

// Pattern を使った分割
String[] parts3 = Pattern.compile(",").split(csv);

// === Java 9+: Matcher.results() で Stream を返す ===
List<String> emails = emailPattern.matcher(text)
    .results()
    .map(MatchResult::group)
    .toList();
// ["alice@example.com", "bob@test.org"]

// === よく使うパターン ===
Pattern.compile("^\\d+$");              // 数字のみ
Pattern.compile("^[a-zA-Z]+$");         // アルファベットのみ
Pattern.compile("^\\S+@\\S+\\.\\S+$");  // 簡易メールアドレス
Pattern.compile("\\d{3}-\\d{4}");       // 郵便番号（日本）
Pattern.compile("0\\d{1,4}-\\d{1,4}-\\d{4}");  // 電話番号（日本、簡易）

// フラグ
Pattern caseInsensitive = Pattern.compile("hello", Pattern.CASE_INSENSITIVE);
Pattern multiline = Pattern.compile("^start", Pattern.MULTILINE);
```

### 8.5 StringJoiner

```java
// === StringJoiner の基本 ===
var joiner = new StringJoiner(", ");
joiner.add("Alice");
joiner.add("Bob");
joiner.add("Charlie");
System.out.println(joiner.toString());  // "Alice, Bob, Charlie"

// 接頭辞・接尾辞付き
var jsonArray = new StringJoiner(", ", "[", "]");
jsonArray.add("\"Alice\"");
jsonArray.add("\"Bob\"");
System.out.println(jsonArray.toString());  // ["Alice", "Bob"]

// 空の場合のデフォルト値
var empty = new StringJoiner(", ", "[", "]");
empty.setEmptyValue("[]");
System.out.println(empty.toString());  // "[]"

// === String.join（Java 8+、より簡潔） ===
String joined = String.join(", ", "Alice", "Bob", "Charlie");
// "Alice, Bob, Charlie"

String joinedList = String.join(" | ", List.of("A", "B", "C"));
// "A | B | C"

// === Collectors.joining（Stream と組み合わせ） ===
List<String> names = List.of("Alice", "Bob", "Charlie");

String csv = names.stream()
    .collect(Collectors.joining(","));
// "Alice,Bob,Charlie"

String formatted = names.stream()
    .collect(Collectors.joining(", ", "Names: [", "]"));
// "Names: [Alice, Bob, Charlie]"
```

---

## まとめ

この章では Java の基礎文法を復習した。Java 8 以前と比較して、以下のポイントが大きく変わっている。

| 項目 | Java 8 以前 | モダン Java（17+） |
|------|------------|-------------------|
| 型宣言 | 明示的な型指定のみ | `var` による型推論 |
| 文字列 | `+` 連結、エスケープ | テキストブロック（`"""`） |
| switch | 文（fall-through あり） | 式（値を返す、アロー構文） |
| データクラス | getter/setter 大量記述 | `record` で1行 |
| コレクション生成 | `new ArrayList<>()` + `add()` | `List.of()`, `Map.of()` |
| null 安全 | `if (x != null)` | `Optional` |
| instanceof | キャスト必要 | パターンマッチング |

次の「モダンJava編」では、ラムダ式・Stream API・Record・Sealed Classes など、モダン Java の核となる機能を詳しく解説する。
