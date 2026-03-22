# Java基礎 学び直しガイド — モダンJava編

> 対象読者: Java 8 以前の知識があり、モダン Java（Java 9〜21）の新機能を学びたいエンジニア
> レベル: 初級〜中級
> 前提: 「言語基礎編」の内容を理解していること

---

## 目次

1. [ラムダ式と関数型インターフェース](#1-ラムダ式と関数型インターフェース)
2. [Stream API](#2-stream-api)
3. [Record（Java 16+）](#3-recordjava-16)
4. [Sealed Classes（Java 17+）](#4-sealed-classesjava-17)
5. [パターンマッチング](#5-パターンマッチング)
6. [新しいAPI](#6-新しいapi)
7. [モジュールシステム（Java 9+）](#7-モジュールシステムjava-9)
8. [その他の便利機能](#8-その他の便利機能)

---

## 1. ラムダ式と関数型インターフェース

### 1.1 ラムダ式の構文

ラムダ式は **匿名関数** を簡潔に記述するための構文で、Java 8 で導入された。関数型インターフェース（抽象メソッドが1つだけのインターフェース）の実装を簡潔に書ける。

```java
// === ラムダ式の基本構文 ===
// (引数) -> { 本体 }

// 従来の匿名クラス
Runnable oldWay = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello from thread");
    }
};

// ラムダ式
Runnable newWay = () -> System.out.println("Hello from thread");

// === 構文のバリエーション ===

// 引数なし
Runnable r = () -> System.out.println("no args");

// 引数1つ（括弧省略可）
Consumer<String> c1 = (name) -> System.out.println("Hello, " + name);
Consumer<String> c2 = name -> System.out.println("Hello, " + name);  // 括弧省略

// 引数2つ
BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;

// 複数行（ブロック構文 → return 必要）
BiFunction<Integer, Integer, Integer> max = (a, b) -> {
    if (a >= b) {
        return a;
    } else {
        return b;
    }
};

// 型を明示することもできる
BiFunction<String, Integer, String> repeat = (String s, Integer n) -> s.repeat(n);
```

### 1.2 関数型インターフェース（@FunctionalInterface）

```java
// === 関数型インターフェースの定義 ===
// 抽象メソッドが1つだけのインターフェース
@FunctionalInterface
public interface Converter<F, T> {
    T convert(F from);

    // default メソッドや static メソッドはいくつあってもOK
    default Converter<F, T> andThen(Converter<T, ?> after) {
        return from -> (T) after.convert(this.convert(from));
    }
}

// 使い方
Converter<String, Integer> toInt = Integer::parseInt;
Converter<String, Double> toDouble = Double::parseDouble;

int num = toInt.convert("42");      // 42
double d = toDouble.convert("3.14"); // 3.14

// === カスタム関数型インターフェース ===
@FunctionalInterface
public interface Validator<T> {
    boolean validate(T value);

    default Validator<T> and(Validator<T> other) {
        return value -> this.validate(value) && other.validate(value);
    }

    default Validator<T> or(Validator<T> other) {
        return value -> this.validate(value) || other.validate(value);
    }

    default Validator<T> negate() {
        return value -> !this.validate(value);
    }
}

// 使い方
Validator<String> notEmpty = s -> !s.isEmpty();
Validator<String> notTooLong = s -> s.length() <= 100;
Validator<String> hasAtSign = s -> s.contains("@");

Validator<String> emailValidator = notEmpty.and(hasAtSign).and(notTooLong);
System.out.println(emailValidator.validate("alice@example.com"));  // true
System.out.println(emailValidator.validate(""));                   // false
```

### 1.3 標準関数型インターフェース

Java は `java.util.function` パッケージに標準的な関数型インターフェースを用意している。

```java
import java.util.function.*;

// === Function<T, R> — 引数1つ、戻り値あり ===
Function<String, Integer> length = String::length;
Function<String, String> toUpper = String::toUpperCase;

int len = length.apply("Hello");    // 5
String upper = toUpper.apply("hi"); // "HI"

// andThen（合成）
Function<String, Integer> upperLength = toUpper.andThen(length);
int result = upperLength.apply("hello"); // 5

// compose（逆順の合成）
Function<String, Integer> sameResult = length.compose(toUpper);

// === Predicate<T> — 引数1つ、boolean を返す ===
Predicate<String> isEmpty = String::isEmpty;
Predicate<String> startsWithA = s -> s.startsWith("A");

boolean test1 = isEmpty.test("");       // true
boolean test2 = startsWithA.test("Alice"); // true

// 合成
Predicate<String> notEmpty = isEmpty.negate();
Predicate<String> startsWithAAndNotEmpty = startsWithA.and(notEmpty);

// フィルタリングで活用
List<String> names = List.of("Alice", "Bob", "Anna", "", "Charlie");
List<String> filtered = names.stream()
    .filter(notEmpty.and(startsWithA))
    .toList();  // ["Alice", "Anna"]

// === Consumer<T> — 引数1つ、戻り値なし ===
Consumer<String> print = System.out::println;
Consumer<String> printUpper = s -> System.out.println(s.toUpperCase());

print.accept("Hello");      // "Hello"
printUpper.accept("Hello");  // "HELLO"

// andThen（連鎖）
Consumer<String> printBoth = print.andThen(printUpper);
printBoth.accept("Hello");
// "Hello"
// "HELLO"

// === Supplier<T> — 引数なし、戻り値あり ===
Supplier<String> greeting = () -> "Hello, World!";
Supplier<List<String>> listFactory = ArrayList::new;
Supplier<Double> random = Math::random;

String msg = greeting.get();          // "Hello, World!"
List<String> newList = listFactory.get(); // 新しい ArrayList
double rand = random.get();           // 乱数

// === BiFunction<T, U, R> — 引数2つ、戻り値あり ===
BiFunction<String, Integer, String> repeat = String::repeat;
String repeated = repeat.apply("ha", 3); // "hahaha"

// === BiPredicate<T, U> — 引数2つ、boolean を返す ===
BiPredicate<String, String> contains = String::contains;
boolean b = contains.test("Hello World", "World"); // true

// === BiConsumer<T, U> — 引数2つ、戻り値なし ===
BiConsumer<String, Integer> printRepeated = (s, n) ->
    System.out.println(s.repeat(n));
printRepeated.accept("Ha", 3); // "HaHaHa"

// === UnaryOperator<T> — Function<T, T> の特殊化（同じ型を返す） ===
UnaryOperator<String> trim = String::strip;
UnaryOperator<String> upper2 = String::toUpperCase;
UnaryOperator<String> process = trim.andThen(upper2)::apply;
// もしくは
UnaryOperator<String> process2 = s -> upper2.apply(trim.apply(s));

String processed = process.apply("  hello  "); // "HELLO"

// === BinaryOperator<T> — BiFunction<T, T, T> の特殊化 ===
BinaryOperator<Integer> sum = Integer::sum;
BinaryOperator<String> concat = String::concat;

int total = sum.apply(10, 20);         // 30
String merged = concat.apply("Hello", " World"); // "Hello World"
```

### 1.4 メソッド参照（::）

```java
// メソッド参照は、ラムダ式の省略記法

// === 1. static メソッド参照 ===
// ラムダ式: s -> Integer.parseInt(s)
Function<String, Integer> toInt = Integer::parseInt;

// ラムダ式: (a, b) -> Integer.sum(a, b)
BinaryOperator<Integer> sum = Integer::sum;

// === 2. インスタンスメソッド参照（特定のインスタンス） ===
String prefix = "Hello, ";
// ラムダ式: s -> prefix.concat(s)
Function<String, String> greeter = prefix::concat;
System.out.println(greeter.apply("Alice")); // "Hello, Alice"

// === 3. インスタンスメソッド参照（任意のインスタンス） ===
// ラムダ式: s -> s.toUpperCase()
Function<String, String> toUpper = String::toUpperCase;

// ラムダ式: s -> s.length()
Function<String, Integer> length = String::length;

// ラムダ式: (s1, s2) -> s1.compareTo(s2)
Comparator<String> comparator = String::compareTo;

// === 4. コンストラクタ参照 ===
// ラムダ式: () -> new ArrayList<>()
Supplier<List<String>> listFactory = ArrayList::new;

// ラムダ式: s -> new StringBuilder(s)
Function<String, StringBuilder> sbFactory = StringBuilder::new;

// 配列コンストラクタ参照
// ラムダ式: n -> new String[n]
Function<Integer, String[]> arrayFactory = String[]::new;
String[] array = arrayFactory.apply(5);  // new String[5]

// === 実用例: ソート ===
List<String> names = new ArrayList<>(List.of("Charlie", "Alice", "Bob"));

// ラムダ式
names.sort((a, b) -> a.compareTo(b));

// メソッド参照
names.sort(String::compareTo);

// Comparator のファクトリメソッドと組み合わせ
names.sort(Comparator.comparing(String::length));           // 長さ順
names.sort(Comparator.comparing(String::length).reversed()); // 長さ逆順
names.sort(Comparator.comparing(String::length)
    .thenComparing(String::compareTo));  // 長さ順 → アルファベット順

// === 実用例: Stream とメソッド参照 ===
List<String> lines = List.of("  hello  ", " world ", "  java  ");
List<String> cleaned = lines.stream()
    .map(String::strip)        // メソッド参照で trim
    .map(String::toUpperCase)  // メソッド参照で大文字化
    .toList();
// ["HELLO", "WORLD", "JAVA"]
```

---

## 2. Stream API

### 2.1 Stream とは

Stream は **データの流れに対する操作パイプライン** を宣言的に記述するための API。コレクションの要素を加工・フィルタリング・集計する処理を、for ループの代わりに記述できる。

**特徴:**
- **遅延評価**: 終端操作が呼ばれるまで中間操作は実行されない
- **1回限り**: Stream は再利用できない（終端操作後は使えない）
- **元のデータを変更しない**: 新しい結果を生成する

```java
// === 従来の命令的スタイル ===
List<String> names = List.of("Alice", "Bob", "Charlie", "Dave", "Eve");
List<String> result = new ArrayList<>();
for (String name : names) {
    if (name.length() > 3) {
        result.add(name.toUpperCase());
    }
}
Collections.sort(result);
// result: [ALICE, CHARLIE, DAVE]

// === Stream を使った宣言的スタイル ===
List<String> result2 = names.stream()
    .filter(name -> name.length() > 3)    // 中間操作
    .map(String::toUpperCase)             // 中間操作
    .sorted()                             // 中間操作
    .toList();                            // 終端操作（Java 16+）
// result2: [ALICE, CHARLIE, DAVE]
```

### 2.2 Stream の生成

```java
// === コレクションから ===
List<String> list = List.of("a", "b", "c");
Stream<String> stream1 = list.stream();

// === 配列から ===
String[] array = {"a", "b", "c"};
Stream<String> stream2 = Arrays.stream(array);

// === Stream.of() ===
Stream<String> stream3 = Stream.of("a", "b", "c");

// === Stream.generate()（無限ストリーム） ===
Stream<Double> randoms = Stream.generate(Math::random);
List<Double> fiveRandoms = randoms.limit(5).toList();

// === Stream.iterate() ===
// Java 8: iterate(seed, operator) — 無限ストリーム
Stream<Integer> naturals = Stream.iterate(1, n -> n + 1);
List<Integer> firstTen = naturals.limit(10).toList(); // [1, 2, ..., 10]

// Java 9+: iterate(seed, predicate, operator) — 有限ストリーム
List<Integer> powers = Stream.iterate(1, n -> n <= 1024, n -> n * 2)
    .toList();  // [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]

// === IntStream, LongStream, DoubleStream（プリミティブ特殊化） ===
IntStream ints = IntStream.range(0, 10);      // 0〜9
IntStream intsC = IntStream.rangeClosed(1, 10); // 1〜10

// 文字列の各文字を Stream で処理
IntStream chars = "Hello".chars();
chars.forEach(c -> System.out.print((char) c + " "));  // H e l l o

// === ファイルから（各行が要素） ===
// try (Stream<String> lines = Files.lines(Path.of("data.txt"))) {
//     lines.filter(line -> !line.isBlank())
//          .forEach(System.out::println);
// }

// === Stream.concat() ===
Stream<String> combined = Stream.concat(
    Stream.of("a", "b"),
    Stream.of("c", "d")
);
// ["a", "b", "c", "d"]

// === Stream.empty() ===
Stream<String> empty = Stream.empty();

// === Stream.ofNullable()（Java 9+） ===
String value = null;
Stream<String> maybe = Stream.ofNullable(value);  // 空の Stream
String value2 = "hello";
Stream<String> maybe2 = Stream.ofNullable(value2); // ["hello"]
```

### 2.3 中間操作

```java
List<String> names = List.of("Alice", "Bob", "Charlie", "Dave", "alice", "Bob");

// === filter — 条件に合う要素のみ残す ===
names.stream()
    .filter(name -> name.length() > 3)
    .toList();  // [Alice, Charlie, Dave, alice]

// === map — 各要素を変換 ===
names.stream()
    .map(String::toUpperCase)
    .toList();  // [ALICE, BOB, CHARLIE, DAVE, ALICE, BOB]

names.stream()
    .map(String::length)
    .toList();  // [5, 3, 7, 4, 5, 3]

// === flatMap — 各要素を Stream に変換して平坦化 ===
List<List<Integer>> nested = List.of(
    List.of(1, 2, 3),
    List.of(4, 5),
    List.of(6, 7, 8, 9)
);
List<Integer> flat = nested.stream()
    .flatMap(Collection::stream)
    .toList();  // [1, 2, 3, 4, 5, 6, 7, 8, 9]

// 文字列を文字に分解
List<String> words = List.of("Hello", "World");
List<String> chars = words.stream()
    .flatMap(word -> word.chars().mapToObj(c -> String.valueOf((char) c)))
    .toList();  // [H, e, l, l, o, W, o, r, l, d]

// === sorted — ソート ===
names.stream()
    .sorted()                          // 自然順序
    .toList();

names.stream()
    .sorted(Comparator.reverseOrder()) // 逆順
    .toList();

names.stream()
    .sorted(Comparator.comparingInt(String::length))  // 長さ順
    .toList();

// === distinct — 重複除去 ===
names.stream()
    .map(String::toLowerCase)
    .distinct()
    .toList();  // [alice, bob, charlie, dave]

// === peek — 途中経過の確認（デバッグ用） ===
List<String> result = names.stream()
    .filter(name -> name.length() > 3)
    .peek(name -> System.out.println("After filter: " + name))
    .map(String::toUpperCase)
    .peek(name -> System.out.println("After map: " + name))
    .toList();

// === limit — 先頭 n 件のみ ===
names.stream()
    .limit(3)
    .toList();  // [Alice, Bob, Charlie]

// === skip — 先頭 n 件をスキップ ===
names.stream()
    .skip(2)
    .toList();  // [Charlie, Dave, alice, Bob]

// === takeWhile / dropWhile（Java 9+） ===
List<Integer> numbers = List.of(1, 2, 3, 4, 5, 1, 2);
numbers.stream()
    .takeWhile(n -> n < 4)
    .toList();  // [1, 2, 3]（条件を満たす間だけ取る）

numbers.stream()
    .dropWhile(n -> n < 4)
    .toList();  // [4, 5, 1, 2]（条件を満たす間スキップ）

// === mapMulti（Java 16+） ===
// flatMap の代替。要素を0個以上の要素に変換する
List<Integer> nums = List.of(1, 2, 3, 4, 5);
List<Integer> doubled = nums.stream()
    .<Integer>mapMulti((n, consumer) -> {
        if (n % 2 == 0) {
            consumer.accept(n);
            consumer.accept(n * 10);
        }
    })
    .toList();  // [2, 20, 4, 40]
```

### 2.4 終端操作

```java
List<String> names = List.of("Alice", "Bob", "Charlie", "Dave");

// === forEach — 各要素に対して処理 ===
names.stream().forEach(System.out::println);

// === collect — 結果をコレクションに集める ===
List<String> list = names.stream()
    .filter(n -> n.length() > 3)
    .collect(Collectors.toList());  // 可変リスト

// Java 16+: toList() — 不変リスト
List<String> immutable = names.stream()
    .filter(n -> n.length() > 3)
    .toList();

// === reduce — 集約 ===
// 初期値あり
int totalLength = names.stream()
    .map(String::length)
    .reduce(0, Integer::sum);  // 19

// 初期値なし（Optional を返す）
Optional<String> longest = names.stream()
    .reduce((a, b) -> a.length() >= b.length() ? a : b);
longest.ifPresent(System.out::println);  // "Charlie"

// === count — 要素数 ===
long count = names.stream()
    .filter(n -> n.startsWith("A"))
    .count();  // 1

// === anyMatch / allMatch / noneMatch ===
boolean anyLong = names.stream().anyMatch(n -> n.length() > 5);   // true
boolean allLong = names.stream().allMatch(n -> n.length() > 2);   // true
boolean nonEmpty = names.stream().noneMatch(String::isEmpty);     // true

// === findFirst / findAny ===
Optional<String> first = names.stream()
    .filter(n -> n.startsWith("C"))
    .findFirst();  // Optional["Charlie"]

// === min / max ===
Optional<String> shortest = names.stream()
    .min(Comparator.comparingInt(String::length));  // Optional["Bob"]

// === toArray ===
String[] array = names.stream()
    .filter(n -> n.length() > 3)
    .toArray(String[]::new);  // ["Alice", "Charlie", "Dave"]
```

### 2.5 Collectors

```java
List<Person> people = List.of(
    new Person("Alice", 30, "Engineering"),
    new Person("Bob", 25, "Marketing"),
    new Person("Charlie", 35, "Engineering"),
    new Person("Dave", 28, "Marketing"),
    new Person("Eve", 32, "Engineering")
);

// ここでは record Person(String name, int age, String dept) {} を想定

// === toList / toSet / toMap ===
List<String> nameList = people.stream()
    .map(Person::name)
    .collect(Collectors.toList());

Set<String> deptSet = people.stream()
    .map(Person::dept)
    .collect(Collectors.toSet());  // [Engineering, Marketing]

Map<String, Integer> nameToAge = people.stream()
    .collect(Collectors.toMap(Person::name, Person::age));
// {Alice=30, Bob=25, Charlie=35, Dave=28, Eve=32}

// キーが重複する場合
Map<String, Integer> deptMaxAge = people.stream()
    .collect(Collectors.toMap(
        Person::dept,
        Person::age,
        Integer::max  // 重複時は大きい方を採用
    ));
// {Engineering=35, Marketing=28}

// === groupingBy — グループ化 ===
Map<String, List<Person>> byDept = people.stream()
    .collect(Collectors.groupingBy(Person::dept));
// {Engineering=[Alice, Charlie, Eve], Marketing=[Bob, Dave]}

// グループごとのカウント
Map<String, Long> countByDept = people.stream()
    .collect(Collectors.groupingBy(Person::dept, Collectors.counting()));
// {Engineering=3, Marketing=2}

// グループごとの平均年齢
Map<String, Double> avgAgeByDept = people.stream()
    .collect(Collectors.groupingBy(
        Person::dept,
        Collectors.averagingInt(Person::age)
    ));
// {Engineering=32.33, Marketing=26.5}

// グループごとの名前一覧
Map<String, List<String>> namesByDept = people.stream()
    .collect(Collectors.groupingBy(
        Person::dept,
        Collectors.mapping(Person::name, Collectors.toList())
    ));

// グループごとの最年長者
Map<String, Optional<Person>> oldestByDept = people.stream()
    .collect(Collectors.groupingBy(
        Person::dept,
        Collectors.maxBy(Comparator.comparingInt(Person::age))
    ));

// === partitioningBy — 2分割 ===
Map<Boolean, List<Person>> partitioned = people.stream()
    .collect(Collectors.partitioningBy(p -> p.age() >= 30));
// {true=[Alice, Charlie, Eve], false=[Bob, Dave]}

// === joining — 文字列結合 ===
String namesCsv = people.stream()
    .map(Person::name)
    .collect(Collectors.joining(", "));
// "Alice, Bob, Charlie, Dave, Eve"

String namesFormatted = people.stream()
    .map(Person::name)
    .collect(Collectors.joining(", ", "[", "]"));
// "[Alice, Bob, Charlie, Dave, Eve]"

// === summarizing — 統計情報 ===
IntSummaryStatistics stats = people.stream()
    .collect(Collectors.summarizingInt(Person::age));
System.out.println("Count: " + stats.getCount());    // 5
System.out.println("Sum: " + stats.getSum());        // 150
System.out.println("Min: " + stats.getMin());        // 25
System.out.println("Max: " + stats.getMax());        // 35
System.out.println("Avg: " + stats.getAverage());    // 30.0

// === teeing（Java 12+）— 2つの Collector を同時に適用 ===
var result = people.stream()
    .collect(Collectors.teeing(
        Collectors.minBy(Comparator.comparingInt(Person::age)),
        Collectors.maxBy(Comparator.comparingInt(Person::age)),
        (youngest, oldest) -> "Youngest: " + youngest.map(Person::name).orElse("?")
            + ", Oldest: " + oldest.map(Person::name).orElse("?")
    ));
// "Youngest: Bob, Oldest: Charlie"

// === collectingAndThen — Collector の結果を変換 ===
List<String> unmodifiableNames = people.stream()
    .map(Person::name)
    .collect(Collectors.collectingAndThen(
        Collectors.toList(),
        Collections::unmodifiableList
    ));
```

### 2.6 Optional

```java
// === Optional の生成 ===
Optional<String> present = Optional.of("Hello");     // 値あり（null 不可）
Optional<String> empty = Optional.empty();            // 空
Optional<String> nullable = Optional.ofNullable(null); // null なら空

// === 値の取得 ===
// 非推奨: get()（値がないと NoSuchElementException）
// String value = empty.get();  // NoSuchElementException!

// 推奨: 安全な取得方法
String value1 = present.orElse("default");           // 値があればそれ、なければデフォルト
String value2 = empty.orElse("default");             // "default"
String value3 = empty.orElseGet(() -> "computed");   // 遅延評価のデフォルト
String value4 = present.orElseThrow();               // Java 10+、値がなければ例外
String value5 = empty.orElseThrow(
    () -> new IllegalStateException("No value"));

// === 変換 ===
Optional<Integer> length = present.map(String::length);  // Optional[5]
Optional<Integer> emptyLen = empty.map(String::length);   // Optional.empty

// flatMap（Optional を返すメソッドとの組み合わせ）
Optional<String> result = present
    .flatMap(s -> s.length() > 3 ? Optional.of(s.toUpperCase()) : Optional.empty());
// Optional["HELLO"]

// === 条件分岐 ===
present.ifPresent(System.out::println);  // "Hello"
empty.ifPresent(System.out::println);    // 何も起きない

// Java 9+: ifPresentOrElse
present.ifPresentOrElse(
    System.out::println,           // 値がある場合
    () -> System.out.println("empty")  // 値がない場合
);

// === フィルタリング ===
Optional<String> filtered = present.filter(s -> s.length() > 3);  // Optional["Hello"]
Optional<String> filtered2 = present.filter(s -> s.length() > 10); // Optional.empty

// === or（Java 9+）===
Optional<String> fallback = empty.or(() -> Optional.of("fallback"));
// Optional["fallback"]

// === stream（Java 9+）===
// Optional を Stream に変換（値があれば要素1つ、なければ空の Stream）
List<String> values = List.of(
    Optional.of("a"),
    Optional.empty(),
    Optional.of("b"),
    Optional.empty(),
    Optional.of("c")
).stream()
    .flatMap(Optional::stream)  // 空の Optional を除外
    .toList();
// ["a", "b", "c"]

// === 実用パターン ===
// NG: Optional を使った悪い例
public Optional<User> findUser(long id) { ... }

// 呼び出し側
if (findUser(1).isPresent()) {     // isPresent + get は非推奨パターン
    User user = findUser(1).get();
}

// OK: 良い例
findUser(1)
    .map(User::name)
    .ifPresentOrElse(
        name -> System.out.println("Found: " + name),
        () -> System.out.println("Not found")
    );

// チェーン
String displayName = findUser(1)
    .map(User::name)
    .map(String::toUpperCase)
    .orElse("Unknown User");
```

### 2.7 パラレルストリーム

```java
// === パラレルストリームの基本 ===
List<Integer> numbers = IntStream.rangeClosed(1, 1_000_000)
    .boxed()
    .toList();

// 逐次ストリーム
long seqSum = numbers.stream()
    .mapToLong(Integer::longValue)
    .sum();

// パラレルストリーム
long parSum = numbers.parallelStream()
    .mapToLong(Integer::longValue)
    .sum();

// 既存の Stream を並列化
long parSum2 = numbers.stream()
    .parallel()
    .mapToLong(Integer::longValue)
    .sum();

// === パラレルストリームの注意点 ===

// NG: 副作用のある操作（スレッドセーフでない）
List<String> unsafeList = new ArrayList<>();
names.parallelStream()
    .forEach(unsafeList::add);  // 危険! ConcurrentModificationException の可能性

// OK: collect を使う
List<String> safeList = names.parallelStream()
    .collect(Collectors.toList());

// NG: 順序に依存する処理
names.parallelStream()
    .forEach(System.out::println);  // 順序が保証されない

// OK: 順序を保証したい場合
names.parallelStream()
    .forEachOrdered(System.out::println);  // 順序保証（ただし並列の恩恵は減る）

// === パラレルストリームを使うべき場面 ===
// - 大量のデータ（数万件以上）
// - 各要素の処理が独立している（副作用なし）
// - 各要素の処理が重い（計算コストが高い）
// - ForkJoinPool を理解している

// 使うべきでない場面:
// - 少量のデータ（オーバーヘッドの方が大きい）
// - I/O バウンドな処理（ネットワーク、ファイル）
// - 順序が重要な処理
// - 共有状態を変更する処理
```

---

## 3. Record（Java 16+）

### 3.1 基本構文

```java
// === 従来のデータクラス ===
public class PersonClass {
    private final String name;
    private final int age;

    public PersonClass(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        PersonClass that = (PersonClass) o;
        return age == that.age && Objects.equals(name, that.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }

    @Override
    public String toString() {
        return "PersonClass{name='" + name + "', age=" + age + "}";
    }
}

// === Record（上記とほぼ同等） ===
public record Person(String name, int age) {}

// 使い方
var alice = new Person("Alice", 30);
System.out.println(alice.name());   // "Alice"（getter は name() 形式）
System.out.println(alice.age());    // 30
System.out.println(alice);          // Person[name=Alice, age=30]

// equals / hashCode は自動生成
var alice2 = new Person("Alice", 30);
System.out.println(alice.equals(alice2));  // true
System.out.println(alice.hashCode() == alice2.hashCode());  // true
```

### 3.2 カスタムコンストラクタ（コンパクトコンストラクタ）

```java
public record Email(String address) {
    // コンパクトコンストラクタ（バリデーション用）
    public Email {
        Objects.requireNonNull(address, "Email address must not be null");
        if (!address.contains("@")) {
            throw new IllegalArgumentException("Invalid email: " + address);
        }
        // 正規化
        address = address.toLowerCase().trim();
        // this.address = address; は自動的に行われる
    }
}

// カノニカルコンストラクタ（明示的に全引数を記述）
public record Range(int min, int max) {
    public Range(int min, int max) {
        if (min > max) {
            throw new IllegalArgumentException("min must be <= max");
        }
        this.min = min;
        this.max = max;
    }

    // 追加のコンストラクタ
    public Range(int value) {
        this(value, value);  // カノニカルコンストラクタに委譲
    }
}
```

### 3.3 メソッド追加

```java
public record Point(double x, double y) {
    // インスタンスメソッド
    public double distanceTo(Point other) {
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // static メソッド
    public static Point origin() {
        return new Point(0, 0);
    }

    // static ファクトリメソッド
    public static Point fromPolar(double r, double theta) {
        return new Point(r * Math.cos(theta), r * Math.sin(theta));
    }
}

var p1 = new Point(3, 4);
var p2 = Point.origin();
System.out.println(p1.distanceTo(p2));  // 5.0
```

### 3.4 インターフェース実装

```java
public interface Printable {
    void print();
}

public interface Measurable {
    double measure();
}

// Record はインターフェースを実装できる
public record Rectangle(double width, double height) implements Printable, Measurable {
    @Override
    public void print() {
        System.out.printf("Rectangle: %.1f x %.1f%n", width, height);
    }

    @Override
    public double measure() {
        return width * height;  // 面積
    }
}

// ジェネリックな Record
public record Pair<A, B>(A first, B second) {
    public <C> Pair<A, C> mapSecond(Function<B, C> mapper) {
        return new Pair<>(first, mapper.apply(second));
    }
}

var pair = new Pair<>("Alice", 30);
var mapped = pair.mapSecond(age -> age + 1);  // Pair["Alice", 31]
```

### 3.5 使いどころ

```java
// === DTO（Data Transfer Object） ===
public record UserDto(
    long id,
    String name,
    String email,
    LocalDate registeredAt
) {}

// === 値オブジェクト ===
public record Money(BigDecimal amount, String currency) {
    public Money {
        Objects.requireNonNull(amount);
        Objects.requireNonNull(currency);
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Negative amount");
        }
    }

    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
}

// === 複合キー ===
public record CacheKey(String userId, String resourceType, long version) {}

Map<CacheKey, Object> cache = new HashMap<>();
cache.put(new CacheKey("user1", "profile", 1), profileData);

// === メソッドの戻り値で複数の値を返す ===
public record ParseResult(int value, String remainder) {}

ParseResult parse(String input) {
    // ...
    return new ParseResult(42, "remaining text");
}

// === Record の制限事項 ===
// - 他のクラスを extends できない（暗黙的に java.lang.Record を継承）
// - フィールドは final（イミュータブル）
// - インスタンスフィールドを追加できない（Record のコンポーネントのみ）
// - abstract にできない

// NG: これらはできない
// public record MyRecord(String name) extends SomeClass {}  // extends 不可
// public abstract record MyRecord(String name) {}            // abstract 不可
```

---

## 4. Sealed Classes（Java 17+）

### 4.1 基本構文

Sealed Classes は、**サブクラスを制限できる** クラス/インターフェース。許可されたサブクラスのみが継承/実装できる。

```java
// === 基本的な sealed interface ===
public sealed interface Shape
    permits Circle, Rectangle, Triangle {
    double area();
}

// permits で指定されたクラスは以下のいずれかでなければならない:
// - final: これ以上の継承を許可しない
// - sealed: さらに制限付きの継承を許可
// - non-sealed: 制限なしの継承を許可

public record Circle(double radius) implements Shape {
    // record は暗黙的に final
    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public record Rectangle(double width, double height) implements Shape {
    @Override
    public double area() {
        return width * height;
    }
}

public final class Triangle implements Shape {
    private final double base;
    private final double height;

    public Triangle(double base, double height) {
        this.base = base;
        this.height = height;
    }

    @Override
    public double area() {
        return 0.5 * base * height;
    }
}

// 使い方
Shape shape = new Circle(5.0);
System.out.println(shape.area());  // 78.539...
```

### 4.2 sealed / non-sealed / final の使い分け

```java
// === sealed クラスの階層 ===
public sealed class Vehicle
    permits Car, Truck, Motorcycle {}

// final: これ以上の継承不可
public final class Car extends Vehicle {
    private final int seats;
    public Car(int seats) { this.seats = seats; }
}

// sealed: さらに制限付きで継承可能
public sealed class Truck extends Vehicle
    permits PickupTruck, SemiTruck {}

public final class PickupTruck extends Truck {}
public final class SemiTruck extends Truck {}

// non-sealed: 任意のクラスが継承可能（制限を解除）
public non-sealed class Motorcycle extends Vehicle {}

// non-sealed なので誰でも継承可能
public class SportBike extends Motorcycle {}
public class Cruiser extends Motorcycle {}
```

### 4.3 パターンマッチングとの組み合わせ

```java
// Sealed class + パターンマッチング（Java 21+）
// コンパイラが全ケースを網羅しているか検証できる
public String describe(Shape shape) {
    return switch (shape) {
        case Circle c    -> "Circle with radius " + c.radius();
        case Rectangle r -> "Rectangle " + r.width() + "x" + r.height();
        case Triangle t  -> "Triangle";
        // default 不要! sealed class の全サブクラスを網羅しているため
    };
}

// ガード条件付き
public String categorize(Shape shape) {
    return switch (shape) {
        case Circle c when c.radius() > 10   -> "Large circle";
        case Circle c                         -> "Small circle";
        case Rectangle r when r.width() == r.height() -> "Square";
        case Rectangle r                      -> "Rectangle";
        case Triangle t                       -> "Triangle";
    };
}
```

### 4.4 使いどころ（代数的データ型、状態管理）

```java
// === 代数的データ型としての活用 ===
// 処理結果を型安全に表現
public sealed interface Result<T>
    permits Result.Success, Result.Failure {

    record Success<T>(T value) implements Result<T> {}
    record Failure<T>(String error, Exception cause) implements Result<T> {
        Failure(String error) { this(error, null); }
    }

    // ユーティリティメソッド
    default <R> Result<R> map(Function<T, R> mapper) {
        return switch (this) {
            case Success<T> s -> new Success<>(mapper.apply(s.value()));
            case Failure<T> f -> new Failure<>(f.error(), f.cause());
        };
    }

    default T orElse(T defaultValue) {
        return switch (this) {
            case Success<T> s -> s.value();
            case Failure<T> f -> defaultValue;
        };
    }
}

// 使い方
Result<User> result = findUser(1);
String name = result
    .map(User::name)
    .orElse("Unknown");

// === 状態管理 ===
public sealed interface OrderStatus
    permits OrderStatus.Pending, OrderStatus.Confirmed,
            OrderStatus.Shipped, OrderStatus.Delivered,
            OrderStatus.Cancelled {

    record Pending() implements OrderStatus {}
    record Confirmed(LocalDateTime confirmedAt) implements OrderStatus {}
    record Shipped(String trackingNumber, LocalDateTime shippedAt) implements OrderStatus {}
    record Delivered(LocalDateTime deliveredAt) implements OrderStatus {}
    record Cancelled(String reason, LocalDateTime cancelledAt) implements OrderStatus {}
}

// 状態に応じた処理
public String getStatusMessage(OrderStatus status) {
    return switch (status) {
        case OrderStatus.Pending p     -> "Your order is pending.";
        case OrderStatus.Confirmed c   -> "Confirmed at " + c.confirmedAt();
        case OrderStatus.Shipped s     -> "Shipped! Track: " + s.trackingNumber();
        case OrderStatus.Delivered d   -> "Delivered at " + d.deliveredAt();
        case OrderStatus.Cancelled c   -> "Cancelled: " + c.reason();
    };
}

// === コマンドパターン ===
public sealed interface Command
    permits Command.CreateUser, Command.UpdateEmail, Command.DeleteUser {

    record CreateUser(String name, String email) implements Command {}
    record UpdateEmail(long userId, String newEmail) implements Command {}
    record DeleteUser(long userId) implements Command {}
}

public void handle(Command command) {
    switch (command) {
        case Command.CreateUser c   -> createUser(c.name(), c.email());
        case Command.UpdateEmail c  -> updateEmail(c.userId(), c.newEmail());
        case Command.DeleteUser c   -> deleteUser(c.userId());
    }
}
```

---

## 5. パターンマッチング

### 5.1 instanceof パターンマッチング（Java 16+）

```java
// === 従来の instanceof ===
Object obj = "Hello, World!";
if (obj instanceof String) {
    String s = (String) obj;  // 明示的なキャストが必要
    System.out.println(s.length());
}

// === パターンマッチング（Java 16+） ===
if (obj instanceof String s) {
    // s はこのブロック内で String として使える
    System.out.println(s.length());
}

// === スコープの注意 ===
if (obj instanceof String s && s.length() > 5) {
    // OK: && の右辺でも s を使える
    System.out.println(s);
}

// if (obj instanceof String s || s.length() > 5) {
//     // コンパイルエラー: || の場合、s は右辺で使えない
// }

// 否定パターン
if (!(obj instanceof String s)) {
    // s はここでは使えない
    return;
}
// ここでは s が使える（早期 return の後なので）
System.out.println(s.toUpperCase());

// === 実用例: equals の実装 ===
public record Point(double x, double y) {
    @Override
    public boolean equals(Object o) {
        return o instanceof Point p
            && Double.compare(this.x, p.x) == 0
            && Double.compare(this.y, p.y) == 0;
    }
}
```

### 5.2 switch パターンマッチング（Java 21+）

```java
// === 型に応じた分岐 ===
public String format(Object obj) {
    return switch (obj) {
        case Integer i  -> "int: %d".formatted(i);
        case Long l     -> "long: %d".formatted(l);
        case Double d   -> "double: %.2f".formatted(d);
        case String s   -> "string: \"%s\"".formatted(s);
        case boolean[] a -> "boolean array of length %d".formatted(a.length);
        case null       -> "null";
        default         -> "other: %s".formatted(obj);
    };
}

// === null の扱い ===
// Java 21+ では switch で null を明示的に扱える
public String handleNull(String input) {
    return switch (input) {
        case null       -> "Input was null";
        case String s when s.isBlank() -> "Input was blank";
        case String s   -> "Input: " + s;
    };
}

// 従来は NullPointerException が発生していた
// switch (null) { ... }  // Java 20 以前は NullPointerException
```

### 5.3 ガード付きパターン（when）

```java
// === when キーワードでガード条件を追加 ===
public String categorize(Object obj) {
    return switch (obj) {
        case Integer i when i < 0     -> "negative integer";
        case Integer i when i == 0    -> "zero";
        case Integer i when i > 0    -> "positive integer";
        case String s when s.isEmpty() -> "empty string";
        case String s when s.length() > 100 -> "long string";
        case String s                 -> "string: " + s;
        case null                     -> "null";
        default                       -> "unknown";
    };
}

// === 複雑なガード条件 ===
record HttpResponse(int statusCode, String body) {}

public String describeResponse(HttpResponse response) {
    return switch (response) {
        case HttpResponse r when r.statusCode() >= 200 && r.statusCode() < 300
            -> "Success: " + r.body();
        case HttpResponse r when r.statusCode() == 404
            -> "Not Found";
        case HttpResponse r when r.statusCode() >= 500
            -> "Server Error: " + r.statusCode();
        case HttpResponse r
            -> "Other: " + r.statusCode();
    };
}
```

### 5.4 Record パターン（Java 21+）

```java
// === Record パターンによる分解 ===
record Point(double x, double y) {}

// 従来
Object obj = new Point(3, 4);
if (obj instanceof Point p) {
    double x = p.x();
    double y = p.y();
    System.out.println("x=" + x + ", y=" + y);
}

// Record パターン（Java 21+）
if (obj instanceof Point(double x, double y)) {
    // 直接コンポーネントにアクセスできる
    System.out.println("x=" + x + ", y=" + y);
}

// === ネストした Record パターン ===
record Line(Point start, Point end) {}

Object obj2 = new Line(new Point(0, 0), new Point(3, 4));
if (obj2 instanceof Line(Point(var x1, var y1), Point(var x2, var y2))) {
    double length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    System.out.println("Length: " + length);  // Length: 5.0
}

// === switch での Record パターン ===
sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double w, double h) implements Shape {}

public double area(Shape shape) {
    return switch (shape) {
        case Circle(var r)      -> Math.PI * r * r;
        case Rectangle(var w, var h) -> w * h;
    };
}

// === 実用例: JSON-like な構造の処理 ===
sealed interface JsonValue
    permits JsonString, JsonNumber, JsonArray, JsonObject, JsonNull {}

record JsonString(String value) implements JsonValue {}
record JsonNumber(double value) implements JsonValue {}
record JsonArray(List<JsonValue> elements) implements JsonValue {}
record JsonObject(Map<String, JsonValue> fields) implements JsonValue {}
record JsonNull() implements JsonValue {}

public String prettyPrint(JsonValue value) {
    return switch (value) {
        case JsonString(var s)   -> "\"" + s + "\"";
        case JsonNumber(var n)   -> String.valueOf(n);
        case JsonArray(var elems) -> "[" + elems.stream()
            .map(this::prettyPrint)
            .collect(Collectors.joining(", ")) + "]";
        case JsonObject(var fields) -> "{" + fields.entrySet().stream()
            .map(e -> "\"" + e.getKey() + "\": " + prettyPrint(e.getValue()))
            .collect(Collectors.joining(", ")) + "}";
        case JsonNull()          -> "null";
    };
}
```

---

## 6. 新しいAPI

### 6.1 HttpClient（Java 11+）

```java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;

// === 従来の HttpURLConnection ===
URL url = new URL("https://api.example.com/users");
HttpURLConnection conn = (HttpURLConnection) url.openConnection();
conn.setRequestMethod("GET");
conn.setRequestProperty("Accept", "application/json");

int responseCode = conn.getResponseCode();
try (var reader = new BufferedReader(
        new InputStreamReader(conn.getInputStream()))) {
    String response = reader.lines().collect(Collectors.joining());
}
conn.disconnect();

// === HttpClient（Java 11+、モダンな方法） ===
var client = HttpClient.newHttpClient();

// GET リクエスト
var request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users"))
    .header("Accept", "application/json")
    .GET()
    .build();

HttpResponse<String> response = client.send(
    request, HttpResponse.BodyHandlers.ofString()
);
System.out.println("Status: " + response.statusCode());
System.out.println("Body: " + response.body());

// POST リクエスト
var postRequest = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString("""
        {
            "name": "Alice",
            "email": "alice@example.com"
        }
        """))
    .build();

HttpResponse<String> postResponse = client.send(
    postRequest, HttpResponse.BodyHandlers.ofString()
);

// 非同期リクエスト
CompletableFuture<HttpResponse<String>> future = client.sendAsync(
    request, HttpResponse.BodyHandlers.ofString()
);

future.thenAccept(resp -> {
    System.out.println("Status: " + resp.statusCode());
    System.out.println("Body: " + resp.body());
}).join();

// カスタム HttpClient
var customClient = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_2)
    .connectTimeout(Duration.ofSeconds(10))
    .followRedirects(HttpClient.Redirect.NORMAL)
    .build();
```

### 6.2 Files / Path API（java.nio）

```java
import java.nio.file.*;

// === Path（パスの表現） ===
Path path = Path.of("data", "users", "alice.txt");
// または
Path path2 = Path.of("/home/user/data.txt");

System.out.println(path.getFileName());    // alice.txt
System.out.println(path.getParent());      // data/users
System.out.println(path.toAbsolutePath()); // /current/dir/data/users/alice.txt

// パスの結合
Path dir = Path.of("data");
Path file = dir.resolve("users.txt");  // data/users.txt

// === Files（ファイル操作） ===

// ファイルの読み書き（小さなファイル向け）
String content = Files.readString(Path.of("data.txt"));
Files.writeString(Path.of("output.txt"), "Hello, World!");

// 全行を読み込む
List<String> lines = Files.readAllLines(Path.of("data.txt"));

// 行ごとに Stream で処理（大きなファイル向け）
try (Stream<String> lineStream = Files.lines(Path.of("data.txt"))) {
    long wordCount = lineStream
        .flatMap(line -> Arrays.stream(line.split("\\s+")))
        .count();
}

// バイト列の読み書き
byte[] bytes = Files.readAllBytes(Path.of("image.png"));
Files.write(Path.of("copy.png"), bytes);

// ファイル追記
Files.writeString(Path.of("log.txt"), "new line\n",
    StandardOpenOption.CREATE, StandardOpenOption.APPEND);

// ディレクトリの作成
Files.createDirectories(Path.of("data", "backups", "2026"));

// ファイルのコピー・移動・削除
Files.copy(Path.of("src.txt"), Path.of("dst.txt"),
    StandardCopyOption.REPLACE_EXISTING);
Files.move(Path.of("old.txt"), Path.of("new.txt"));
Files.deleteIfExists(Path.of("temp.txt"));

// ファイル情報
boolean exists = Files.exists(Path.of("data.txt"));
long size = Files.size(Path.of("data.txt"));
boolean isDir = Files.isDirectory(Path.of("data"));

// ディレクトリの走査
try (Stream<Path> entries = Files.list(Path.of("."))) {
    entries.filter(Files::isRegularFile)
        .forEach(System.out::println);
}

// 再帰的な走査
try (Stream<Path> walk = Files.walk(Path.of("."))) {
    List<Path> javaFiles = walk
        .filter(p -> p.toString().endsWith(".java"))
        .toList();
}

// パターンマッチ
try (DirectoryStream<Path> ds = Files.newDirectoryStream(
        Path.of("."), "*.txt")) {
    for (Path entry : ds) {
        System.out.println(entry);
    }
}
```

### 6.3 日時 API（java.time）

```java
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

// === 従来の Date / Calendar（非推奨パターン） ===
// Date date = new Date();            // ミュータブル、スレッドアンセーフ
// Calendar cal = Calendar.getInstance();  // 月が0始まり（罠）

// === java.time（Java 8+、推奨） ===

// 現在日時
LocalDate today = LocalDate.now();           // 2026-03-23
LocalTime now = LocalTime.now();             // 14:30:45.123
LocalDateTime dateTime = LocalDateTime.now(); // 2026-03-23T14:30:45.123
ZonedDateTime zoned = ZonedDateTime.now();   // 2026-03-23T14:30:45.123+09:00[Asia/Tokyo]
Instant instant = Instant.now();             // UTC のタイムスタンプ

// 生成
LocalDate date = LocalDate.of(2026, 3, 23);
LocalDate date2 = LocalDate.of(2026, Month.MARCH, 23);
LocalTime time = LocalTime.of(14, 30, 0);
LocalDateTime dt = LocalDateTime.of(date, time);
ZonedDateTime zdt = ZonedDateTime.of(dt, ZoneId.of("Asia/Tokyo"));

// 文字列からパース
LocalDate parsed = LocalDate.parse("2026-03-23");
LocalDateTime parsed2 = LocalDateTime.parse("2026-03-23T14:30:00");

// カスタムフォーマット
DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy年MM月dd日 HH:mm");
String formatted = dt.format(formatter);  // "2026年03月23日 14:30"
LocalDateTime fromStr = LocalDateTime.parse("2026年03月23日 14:30", formatter);

// 計算
LocalDate tomorrow = today.plusDays(1);
LocalDate nextMonth = today.plusMonths(1);
LocalDate lastYear = today.minusYears(1);
LocalDate nextFriday = today.with(java.time.temporal.TemporalAdjusters.next(DayOfWeek.FRIDAY));

// 期間
Period period = Period.between(
    LocalDate.of(2020, 1, 1),
    LocalDate.of(2026, 3, 23)
);
System.out.println(period.getYears() + "年" + period.getMonths() + "月" + period.getDays() + "日");

Duration duration = Duration.between(
    LocalTime.of(9, 0),
    LocalTime.of(17, 30)
);
System.out.println(duration.toHours() + "時間" + duration.toMinutesPart() + "分");

// 日数の差
long daysBetween = ChronoUnit.DAYS.between(
    LocalDate.of(2020, 1, 1),
    LocalDate.of(2026, 3, 23)
);

// 比較
boolean isBefore = today.isBefore(tomorrow);   // true
boolean isAfter = today.isAfter(lastYear);     // true

// タイムゾーン変換
ZonedDateTime tokyo = ZonedDateTime.now(ZoneId.of("Asia/Tokyo"));
ZonedDateTime newYork = tokyo.withZoneSameInstant(ZoneId.of("America/New_York"));

// Instant（エポックからの経過時間、データベースやAPIとの連携に便利）
Instant now2 = Instant.now();
long epochMilli = now2.toEpochMilli();
Instant fromEpoch = Instant.ofEpochMilli(epochMilli);
```

### 6.4 CompletableFuture（非同期処理）

```java
import java.util.concurrent.CompletableFuture;

// === 基本的な非同期処理 ===
// 値を返す非同期処理
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 別スレッドで実行される
    try { Thread.sleep(1000); } catch (InterruptedException e) {}
    return "Hello from async!";
});

// 結果を待つ
String result = future.join();  // ブロッキング
System.out.println(result);     // "Hello from async!"

// 値を返さない非同期処理
CompletableFuture<Void> voidFuture = CompletableFuture.runAsync(() -> {
    System.out.println("Running in background...");
});

// === チェーン（パイプライン） ===
CompletableFuture<String> pipeline = CompletableFuture
    .supplyAsync(() -> "hello")
    .thenApply(String::toUpperCase)          // 変換（同期）
    .thenApply(s -> s + " WORLD")            // 変換（同期）
    .thenApplyAsync(s -> s + "!")             // 変換（別スレッド）
    .whenComplete((result2, error) -> {
        if (error != null) {
            System.err.println("Error: " + error.getMessage());
        } else {
            System.out.println("Result: " + result2);
        }
    });

// === 複数の非同期処理の合成 ===
CompletableFuture<String> userFuture = CompletableFuture.supplyAsync(() -> "Alice");
CompletableFuture<Integer> ageFuture = CompletableFuture.supplyAsync(() -> 30);

// 2つの結果を組み合わせる
CompletableFuture<String> combined = userFuture.thenCombine(
    ageFuture,
    (name, age) -> name + " is " + age + " years old"
);
System.out.println(combined.join());  // "Alice is 30 years old"

// すべての CompletableFuture が完了するまで待つ
CompletableFuture<Void> allDone = CompletableFuture.allOf(
    userFuture, ageFuture
);

// いずれか1つが完了したら結果を取得
CompletableFuture<Object> anyDone = CompletableFuture.anyOf(
    userFuture, ageFuture
);

// === エラーハンドリング ===
CompletableFuture<String> withErrorHandling = CompletableFuture
    .supplyAsync(() -> {
        if (Math.random() > 0.5) throw new RuntimeException("Oops!");
        return "Success";
    })
    .exceptionally(error -> "Recovered from: " + error.getMessage())
    .thenApply(String::toUpperCase);

// handle（成功・失敗の両方を処理）
CompletableFuture<String> handled = CompletableFuture
    .supplyAsync(() -> {
        if (true) throw new RuntimeException("Error!");
        return "OK";
    })
    .handle((result3, error) -> {
        if (error != null) {
            return "Error: " + error.getMessage();
        }
        return result3;
    });

// === 実用例: 複数APIの並列呼び出し ===
public CompletableFuture<UserProfile> getUserProfile(long userId) {
    var userFuture2 = CompletableFuture.supplyAsync(
        () -> userService.getUser(userId));
    var ordersFuture = CompletableFuture.supplyAsync(
        () -> orderService.getOrders(userId));
    var preferencesFuture = CompletableFuture.supplyAsync(
        () -> prefService.getPreferences(userId));

    return userFuture2.thenCombine(ordersFuture, (user, orders) ->
        new UserWithOrders(user, orders)
    ).thenCombine(preferencesFuture, (userWithOrders, prefs) ->
        new UserProfile(userWithOrders.user(), userWithOrders.orders(), prefs)
    );
}
```

### 6.5 Virtual Threads（Java 21+）

```java
// === 従来のプラットフォームスレッド ===
// OS のスレッドに1対1マッピング（コストが高い）
Thread platformThread = new Thread(() -> {
    System.out.println("Platform thread: " + Thread.currentThread());
});
platformThread.start();

// === Virtual Threads（Java 21+） ===
// JVM が管理する軽量スレッド（数百万スレッドを同時実行可能）
Thread virtualThread = Thread.startVirtualThread(() -> {
    System.out.println("Virtual thread: " + Thread.currentThread());
});

// ofVirtual() で生成
Thread vt = Thread.ofVirtual()
    .name("my-virtual-thread")
    .start(() -> {
        System.out.println("Running on: " + Thread.currentThread());
    });

// === ExecutorService との組み合わせ ===
// 従来: スレッドプール（固定数）
try (var executor = Executors.newFixedThreadPool(10)) {
    for (int i = 0; i < 100; i++) {
        executor.submit(() -> {
            // 最大10スレッドで並行実行
            doWork();
        });
    }
}

// Virtual Threads: タスクごとに仮想スレッドを生成（プールは不要）
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        executor.submit(() -> {
            // 10万タスクを仮想スレッドで並行実行
            doWork();
        });
    }
}  // try-with-resources: すべてのタスクが完了するまで待つ

// === Virtual Threads の特徴 ===
// 1. I/O バウンドな処理に最適（HTTP呼び出し、DB接続など）
// 2. CPUバウンドな処理には不向き（プラットフォームスレッドを使う）
// 3. スレッドプールのサイズを気にしなくていい
// 4. ブロッキングAPIでも問題ない（JVMが自動的にスイッチ）

// 実用例: 大量のHTTPリクエストを並列実行
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    var client = HttpClient.newHttpClient();
    List<String> urls = List.of(
        "https://api.example.com/users/1",
        "https://api.example.com/users/2",
        "https://api.example.com/users/3"
        // ... 数千URL
    );

    List<Future<String>> futures = urls.stream()
        .map(url -> executor.submit(() -> {
            var request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .build();
            return client.send(request, HttpResponse.BodyHandlers.ofString())
                .body();
        }))
        .toList();

    // 結果を収集
    for (var future : futures) {
        System.out.println(future.get());
    }
}

// === Virtual Threads の注意点 ===
// - synchronized ブロック内でブロッキングすると pinning が発生する
//   → ReentrantLock を代わりに使う
// - ThreadLocal は使えるが、仮想スレッドの数が多いとメモリ問題
//   → ScopedValues（Java 21+ preview）の使用を検討
```

---

## 7. モジュールシステム（Java 9+）

### 7.1 module-info.java

```java
// === モジュールの基本概念 ===
// Java 9 で導入された「プロジェクトの公開範囲を制御する仕組み」
// ソースルートに module-info.java を配置する

// src/module-info.java
module com.example.myapp {
    // このモジュールが依存する他のモジュール
    requires java.sql;
    requires java.net.http;

    // 推移的な依存（このモジュールを使う側にも公開される）
    requires transitive com.example.common;

    // このモジュールが公開するパッケージ
    exports com.example.myapp.api;
    exports com.example.myapp.model;

    // 特定のモジュールにのみ公開
    exports com.example.myapp.internal to com.example.myapp.tests;

    // リフレクションでのアクセスを許可
    opens com.example.myapp.model to com.fasterxml.jackson.databind;

    // サービスの提供・利用
    uses com.example.myapp.spi.Plugin;
    provides com.example.myapp.spi.Plugin
        with com.example.myapp.plugins.DefaultPlugin;
}
```

### 7.2 requires, exports, opens

```java
// === requires ===
// 他のモジュールへの依存を宣言
module com.example.web {
    requires java.net.http;       // HttpClient を使うために必要
    requires java.sql;            // JDBC を使うために必要
    requires com.example.common;  // 自作の共通モジュール

    // requires static: コンパイル時のみ必要（ランタイムではオプション）
    requires static lombok;

    // requires transitive: 推移的依存
    // このモジュールを require する側にも com.example.common が見える
    requires transitive com.example.common;
}

// === exports ===
// パッケージを他のモジュールに公開
module com.example.library {
    exports com.example.library.api;     // 全モジュールに公開
    exports com.example.library.spi to   // 特定モジュールにのみ公開
        com.example.plugin.a,
        com.example.plugin.b;

    // exports していないパッケージは外部からアクセス不可
    // com.example.library.internal は非公開
}

// === opens ===
// リフレクションでのアクセスを許可（DI フレームワーク、JSON ライブラリ等に必要）
module com.example.app {
    // Jackson による JSON シリアライズ/デシリアライズのため
    opens com.example.app.model to com.fasterxml.jackson.databind;

    // 全パッケージをリフレクションに開く（非推奨だが Spring 等で必要な場合）
    // open module com.example.app { ... }
}
```

### 7.3 既存プロジェクトへの影響

```java
// === クラスパス vs モジュールパス ===

// クラスパス（従来の方式）
// java -cp lib/a.jar:lib/b.jar:. com.example.Main

// モジュールパス（Java 9+）
// java --module-path lib -m com.example.myapp/com.example.Main

// === Unnamed Module ===
// module-info.java がないプロジェクトは「Unnamed Module」として扱われる
// - すべてのパッケージが公開される（既存コードとの互換性）
// - Unnamed Module は他の Named Module から require できない

// === Automatic Module ===
// モジュール化されていない JAR をモジュールパスに配置すると
// 「Automatic Module」として扱われる
// - JAR 名からモジュール名が自動生成される
// - すべてのパッケージが公開される
// - 他のすべてのモジュールを require できる
```

### 7.4 実務での扱い

```java
// === モジュールシステムを使う場合 ===
// - ライブラリ開発: API の公開範囲を制御できる
// - 大規模アプリケーション: モジュール間の依存を明確化
// - JRE のカスタムイメージ作成（jlink）

// jlink でカスタムランタイムを作成
// jlink --module-path $JAVA_HOME/jmods:mods \
//        --add-modules com.example.myapp \
//        --output custom-runtime

// === モジュールシステムを使わない場合 ===
// - 小〜中規模の Web アプリケーション（Spring Boot 等）
// - ほとんどの既存プロジェクト
// - module-info.java なしでもクラスパスで動作する

// === 実務での推奨 ===
// 1. ライブラリを作るなら module-info.java を用意する
// 2. アプリケーション開発では通常クラスパスで十分
// 3. Spring Boot はモジュールシステムなしで動く
// 4. JDK 自体はモジュール化されているので、
//    一部の内部 API（sun.misc.Unsafe 等）にアクセスするには
//    --add-opens / --add-exports フラグが必要になることがある

// 例: リフレクションで JDK 内部にアクセスする場合
// java --add-opens java.base/java.lang=ALL-UNNAMED -jar myapp.jar
```

---

## 8. その他の便利機能

### 8.1 var による型推論の使いどころ

```java
// === 推奨される使い方 ===

// 1. 右辺のコンストラクタで型が明らか
var list = new ArrayList<String>();
var map = new HashMap<String, List<Integer>>();
var reader = new BufferedReader(new FileReader("data.txt"));

// 2. ファクトリメソッドの戻り値
var path = Path.of("data.txt");
var now = LocalDateTime.now();
var client = HttpClient.newHttpClient();

// 3. for ループの変数
for (var entry : map.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}

// 4. try-with-resources
try (var stream = Files.lines(Path.of("data.txt"))) {
    stream.forEach(System.out::println);
}

// === 推奨されない使い方 ===

// 1. 右辺から型が推測できない
var result = service.process();    // 何の型？ → 明示すべき
var data = computeValue();         // 何の型？ → 明示すべき

// 2. リテラルで意図が不明確になる
var count = 0;      // int と推論されるが、long かもしれない
var amount = 1.0;   // double と推論されるが、float かもしれない
// 明確にしたい場合:
long count2 = 0L;
float amount2 = 1.0f;

// 3. ダイヤモンド演算子との組み合わせ（型情報が失われる）
var list2 = new ArrayList<>();  // ArrayList<Object> と推論される!
var list3 = new ArrayList<String>();  // OK: ArrayList<String>
```

### 8.2 switch式（値を返すswitch）

```java
// === 従来の switch 文 ===
String day = "MONDAY";
String type;
switch (day) {
    case "MONDAY":
    case "TUESDAY":
    case "WEDNESDAY":
    case "THURSDAY":
    case "FRIDAY":
        type = "Weekday";
        break;
    case "SATURDAY":
    case "SUNDAY":
        type = "Weekend";
        break;
    default:
        type = "Unknown";
}

// === switch 式（Java 14+） ===
// 値を返す + アロー構文 + fall-through なし
String type2 = switch (day) {
    case "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY" -> "Weekday";
    case "SATURDAY", "SUNDAY" -> "Weekend";
    default -> "Unknown";
};

// ブロック構文（yield で値を返す）
int numLetters = switch (day) {
    case "MONDAY", "FRIDAY", "SUNDAY" -> 6;
    case "TUESDAY" -> 7;
    case "WEDNESDAY" -> 9;
    case "THURSDAY", "SATURDAY" -> 8;
    default -> {
        System.out.println("Unknown day: " + day);
        yield -1;
    }
};

// switch式は網羅性チェックがある
// enum のすべての値をカバーしていれば default は不要
enum Season { SPRING, SUMMER, AUTUMN, WINTER }

String activity = switch (season) {
    case SPRING -> "Hiking";
    case SUMMER -> "Swimming";
    case AUTUMN -> "Reading";
    case WINTER -> "Skiing";
    // default 不要（全ケース網羅）
};
```

### 8.3 NullPointerException の改善メッセージ（Java 14+）

```java
// === 従来の NullPointerException ===
// Java 14 以前:
// Exception in thread "main" java.lang.NullPointerException

// === Helpful NullPointerExceptions（Java 14+） ===
record Address(String city) {}
record User(String name, Address address) {}

User user = new User("Alice", null);

try {
    String city = user.address().city().toUpperCase();
} catch (NullPointerException e) {
    System.out.println(e.getMessage());
    // Java 14+:
    // Cannot invoke "String.toUpperCase()" because the return value of
    // "Address.city()" is null
    //
    // → どの部分が null かが明確にわかる!
}

// 複雑な式でも原因がわかりやすい
// a.b().c.d().e() で NullPointerException が発生した場合、
// 「b() の戻り値が null」「d() の戻り値が null」など具体的に示される
```

### 8.4 String の新メソッド

```java
// === Java 11 で追加 ===
"".isBlank();           // true（空 or 空白のみ）
"  ".isBlank();         // true
"hello".isBlank();      // false

" hello ".strip();       // "hello"（Unicode 対応の trim）
" hello ".stripLeading();  // "hello "
" hello ".stripTrailing(); // " hello"
// strip() vs trim(): strip() は Unicode の空白文字（全角スペース等）も除去

"hello\nworld\n".lines()
    .forEach(System.out::println);
// hello
// world

"ha".repeat(3);          // "hahaha"

// === Java 12 で追加 ===
"hello".indent(4);       // "    hello\n"（インデント追加）
"    hello".indent(-2);  // "  hello\n"（インデント削除）

"hello".transform(s -> s.toUpperCase());  // "HELLO"
// チェーンで使える
String result = " hello world "
    .transform(String::strip)
    .transform(String::toUpperCase)
    .transform(s -> s.replace(" ", "_"));
// "HELLO_WORLD"

// === Java 15 で追加 ===
// formatted（String.format のインスタンスメソッド版）
String msg = "Hello, %s! You are %d years old.".formatted("Alice", 30);

// stripIndent（テキストブロック用だが通常の String でも使える）
String indented = "    line1\n    line2\n    line3";
String stripped = indented.stripIndent();
// "line1\nline2\nline3"

// translateEscapes（エスケープシーケンスを解釈）
String escaped = "Hello\\nWorld";
String translated = escaped.translateEscapes();
// "Hello\nWorld"（改行として解釈される）
```

---

## まとめ

モダン Java（Java 9〜21）で追加された主要機能を整理する。

| 機能 | バージョン | 用途 |
|------|-----------|------|
| モジュールシステム | Java 9 | パッケージの公開制御 |
| `var` | Java 10 | ローカル変数の型推論 |
| HttpClient | Java 11 | HTTP通信のモダン化 |
| switch式 | Java 14 | 値を返す switch、アロー構文 |
| Helpful NPE | Java 14 | NullPointerException の詳細メッセージ |
| テキストブロック | Java 15 | 複数行文字列リテラル |
| Record | Java 16 | イミュータブルなデータクラス |
| Sealed Classes | Java 17 | サブクラスの制限 |
| パターンマッチング for switch | Java 21 | 型に応じた分岐 |
| Record パターン | Java 21 | Record の分解 |
| Virtual Threads | Java 21 | 軽量スレッド |

**実務で最もインパクトが大きいもの:**
1. **Record** — DTO やバリューオブジェクトの記述量が劇的に減る
2. **Stream API + ラムダ** — コレクション操作がシンプルになる
3. **switch 式 + パターンマッチング** — 条件分岐が安全で読みやすくなる
4. **Virtual Threads** — 並行処理のモデルが根本的に変わる
5. **テキストブロック** — SQL、JSON、HTML の埋め込みが楽になる

次の「実践・設計編」では、設計原則、デザインパターン、テスト、ビルドツール、Web開発など実務に直結する内容を扱う。
