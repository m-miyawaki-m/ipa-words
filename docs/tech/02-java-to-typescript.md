# Java → TypeScript 型システム比較

Javaエンジニアにとって、TypeScriptの型システムは「Javaに近いが、かなり違う」と感じるものだ。
基本的な型の考え方は共通しているが、TypeScriptは「構造的型付け」を採用しており、
Javaの「名前的型付け」とは根本的に異なる部分がある。
このドキュメントでは、Java の各概念に対応する TypeScript のパターンを比較する。

---

## 1. 基本型の対応

```java
// Java: プリミティブ型と参照型が別
int count = 0;
long id = 100L;
double rate = 0.85;
boolean active = true;
String name = "IPA";
char initial = 'I';
```

```typescript
// TypeScript: 数値はすべて number、文字はすべて string
const count: number = 0;
const id: number = 100;
const rate: number = 0.85;
const active: boolean = true;
const name: string = "IPA";
const initial: string = "I"; // charはなく、1文字もstring

// 実際のプロジェクトコード: src/types/index.ts
export interface Term {
  id: number        // int/long の区別なし
  url: string
  name: string
  description: string
}
```

主な型の対応表：

| Java          | TypeScript         | 備考                              |
|---------------|--------------------|----------------------------------|
| `int`         | `number`           | 整数・小数の区別なし              |
| `long`        | `number`           | 同上                             |
| `double`      | `number`           | 同上                             |
| `float`       | `number`           | 同上                             |
| `boolean`     | `boolean`          | 同じ                             |
| `String`      | `string`           | 小文字始まり                     |
| `char`        | `string`           | 1文字もstring                   |
| `void`        | `void`             | 戻り値なし                       |
| `Object`      | `object` / `unknown` | 何でも入る型（any より安全）    |
| `null`        | `null`             | 同じ                             |
| `Object[]`    | `T[]` or `Array<T>` | 後述                            |

---

## 2. interface（Javaとの違い: `implements` 不要、構造的型付け）

```java
// Java: interface を定義してクラスが implements する
interface Greetable {
  String greet();
}

class User implements Greetable {
  private String name;
  User(String name) { this.name = name; }

  @Override
  public String greet() {
    return "Hello, " + name;
  }
}
```

```typescript
// TypeScript: implements は不要。「形が合えば」代入できる
interface Greetable {
  greet(): string;
}

// implements は任意（書いても動くが、必須ではない）
class User {
  constructor(private name: string) {}
  greet(): string { return `Hello, ${this.name}`; }
}

// greet() メソッドを持つオブジェクトなら何でも Greetable として扱える
const obj = { greet: () => "Hi!" };
const g: Greetable = obj;     // OK: 形が合っているから
const u: Greetable = new User("Alice"); // OK
```

**構造的型付け（Structural Typing）**: TypeScriptでは型の「名前」ではなく「構造（プロパティやメソッドの形）」で型の互換性を判断する。
Javaは名前的型付けなので `implements Greetable` と明示しないと代入できないが、TypeScriptは形が合えばOK。

```typescript
// 実際のプロジェクトコード: src/types/index.ts
// interface はデータの「形」を定義するために多用する
export interface Term {
  id: number
  url: string
  majorCategoryId: string
  minorCategoryId: string
  name: string
  reading: string
  english: string
  category: string
  subcategory: string
  description: string
}

export interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}
```

---

## 3. ジェネリクス比較

```java
// Java: ジェネリクス
List<String> names = new ArrayList<>();
Map<String, Integer> scores = new HashMap<>();

public <T> T getFirst(List<T> list) {
  return list.get(0);
}
```

```typescript
// TypeScript: ジェネリクスの構文は非常に似ている
const names: string[] = [];
const scores: Map<string, number> = new Map();

function getFirst<T>(list: T[]): T {
  return list[0];
}

// 実際のプロジェクトコード: src/hooks/useTerms.ts
// useState<T[]> のように型引数を渡す
const [terms, setTerms] = useState<Term[]>([]);
const [error, setError] = useState<string | null>(null);

// src/hooks/useQuiz.ts: ジェネリック関数
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
```

Javaとの構文の違い：

| Java                      | TypeScript                  |
|---------------------------|-----------------------------|
| `List<String>`            | `string[]` or `Array<string>` |
| `Map<String, Integer>`    | `Map<string, number>`       |
| `<T extends Comparable>`  | `<T extends Comparable>`    |
| `? extends T`（上限ワイルドカード） | `T` のみ（ワイルドカードはない）|
| `Class<T>`                | `{ new(): T }` or `Constructor<T>` |

---

## 4. enum 比較

```java
// Java enum: メソッドやフィールドを持てる強力なenum
public enum QuizFormat {
  FLASHCARD("フラッシュカード"),
  MULTIPLE_CHOICE("4択問題");

  private final String label;
  QuizFormat(String label) { this.label = label; }
  public String getLabel() { return label; }
}

QuizFormat format = QuizFormat.FLASHCARD;
```

```typescript
// TypeScript enum: シンプルな値の列挙
enum Direction {
  Up = "UP",
  Down = "DOWN",
}

// より TypeScript らしい書き方: union type（型エイリアス）
// 実際のプロジェクトコード: src/types/index.ts
export type QuizDirection = 'term-to-meaning' | 'meaning-to-term';
export type QuizFormat = 'flashcard' | 'multiple-choice';
export type QuizCount = 10 | 20 | 50 | 'all';
export type TabType = 'list' | 'quiz' | 'progress';
```

**TypeScriptのベストプラクティス**: `enum` より union type（文字列リテラル型の `|` 結合）が好まれることが多い。
理由はシンプルさとJavaScriptとの相性の良さ。

```typescript
// union type の使い方
function handleTab(tab: TabType) {
  if (tab === 'list') { /* ... */ }
  if (tab === 'quiz') { /* ... */ }
  // 'progress' が未処理なら TypeScript が警告する（網羅性チェック）
}
```

---

## 5. null安全性（`Optional` vs union type `| null`）

```java
// Java: Optional で null を表現
Optional<String> name = Optional.empty();
Optional<String> found = findUser(id).map(User::getName);

// 取り出すときは明示的に処理
String result = found.orElse("不明");
String upper = found.map(String::toUpperCase).orElseThrow();
```

```typescript
// TypeScript: union type で null/undefined を表現
let name: string | null = null;
let age: number | undefined = undefined;

// Optional chaining ?. でnullセーフにアクセス
const length = name?.length;         // nameがnullなら undefined
const upper = name?.toUpperCase();   // nameがnullなら undefined

// Nullish coalescing ?? でデフォルト値
const display = name ?? '不明';      // orElse("不明") 相当

// Non-null assertion ! （nullでないと確信できるとき）
const definitelyHere = name!;        // nullチェックを無視（使用注意）

// 実際のプロジェクトコード: src/hooks/useTerms.ts
const [error, setError] = useState<string | null>(null);

// src/components/WordCard.tsx
interface Props {
  term: Term
  progress: TermProgress | null  // null = まだ記録なし
}

function getStatus(progress: TermProgress | null) {
  if (!progress || progress.total === 0) return 'new';
  // ...
}
```

| Java Optional        | TypeScript                     |
|----------------------|-------------------------------|
| `Optional.empty()`   | `null` or `undefined`         |
| `Optional.of(x)`     | `x`                           |
| `opt.isPresent()`    | `value != null`               |
| `opt.get()`          | `value!`（非推奨）            |
| `opt.orElse("x")`    | `value ?? "x"`                |
| `opt.map(f)`         | `value?.someMethod()`         |

---

## 6. アクセス修飾子

```java
// Java: フィールドとメソッドにアクセス修飾子
public class User {
  public String name;
  protected int age;
  private String password;
  // finalは再代入不可
  private final String id;
}
```

```typescript
// TypeScript: 同等のアクセス修飾子 + readonly
class User {
  public name: string;
  protected age: number;
  private password: string;
  readonly id: string;        // Java の final 相当（再代入不可）

  constructor(id: string, name: string, age: number, password: string) {
    this.id = id;
    this.name = name;
    this.age = age;
    this.password = password;
  }

  // コンストラクタ引数に修飾子を書くショートハンド
  // constructor(public name: string, private password: string) {}
}
```

TypeScript固有の注意点：
- アクセス修飾子はコンパイル時のチェックのみで、生成されるJavaScriptには残らない
- `readonly` は変数の再代入を禁止するが、オブジェクトの中身の変更は禁止しない（JavaのArrayList finalと同じ）

---

## 7. class vs type vs interface の使い分け

これがJavaエンジニアにとって最も混乱しやすいポイント。

```typescript
// interface: オブジェクトの「形」を定義。宣言マージが可能
// データ構造の定義に最適
interface Term {
  id: number;
  name: string;
}

// type: 複雑な型表現に使う。union, intersection, mapped type など
// union型、タプル、プリミティブの別名など
type QuizFormat = 'flashcard' | 'multiple-choice';
type Nullable<T> = T | null;
type TermId = number; // プリミティブの別名

// class: 状態とメソッドを持つ実態。new でインスタンス化する
// Reactではclassを使う機会は少ない
class UserSession {
  private token: string;
  constructor(token: string) { this.token = token; }
  isValid(): boolean { return this.token.length > 0; }
}
```

**実際のReact/TypeScript開発での使い分け**:
- データ構造の定義 → `interface`（Javaのデータクラス相当）
- 複雑な型表現 → `type`
- ロジックを持つオブジェクト → Reactでは基本使わず、カスタムHooksで代替

```typescript
// 実際のプロジェクトコード: src/types/index.ts
// データ構造は interface で定義
export interface Term { /* ... */ }
export interface Category { /* ... */ }

// union type は type で定義
export type QuizDirection = 'term-to-meaning' | 'meaning-to-term';
export type TabType = 'list' | 'quiz' | 'progress';

// インデックスシグネチャを使った型定義
export interface Progress {
  [termId: number]: TermProgress  // Javaの Map<Integer, TermProgress> 相当
}
```

---

## 8. コレクション（List/Map → Array/Map/Record）

```java
// Java: コレクションクラス
List<String> list = new ArrayList<>();
list.add("A");
list.remove("A");
list.size();

Map<String, Term> map = new HashMap<>();
map.put("key", term);
map.get("key");
map.containsKey("key");
```

```typescript
// TypeScript: Array と Map（または Record）
const list: string[] = [];
list.push("A");
list.splice(list.indexOf("A"), 1); // remove
list.length;

// Map クラス（JavaのHashMapに近い）
const map = new Map<string, Term>();
map.set("key", term);
map.get("key");
map.has("key");

// Record型（オブジェクトをMapとして使う。JSONに直接マップできる）
const record: Record<string, Term> = {};
record["key"] = term;
record["key"];
"key" in record;

// 実際のプロジェクトコード: src/hooks/useTerms.ts
const map = new Map<string, Category>();
for (const term of terms) {
  if (!map.has(term.majorCategoryId)) {
    map.set(term.majorCategoryId, { id: term.majorCategoryId, name: term.category, subcategories: [] });
  }
}
return Array.from(map.values());
```

---

## 9. ラムダ式/Stream → アロー関数/Array methods

```java
// Java: Stream API
List<Term> filtered = terms.stream()
  .filter(t -> t.getMajorCategoryId().equals(id))
  .sorted(Comparator.comparing(Term::getName))
  .collect(Collectors.toList());

String names = terms.stream()
  .map(Term::getName)
  .collect(Collectors.joining(", "));

Optional<Term> first = terms.stream()
  .filter(t -> t.getId() == 100)
  .findFirst();
```

```typescript
// TypeScript: Array メソッド（ほぼ同じことができる）
const filtered = terms
  .filter((t) => t.majorCategoryId === id)
  .sort((a, b) => a.name.localeCompare(b.name));

const names = terms
  .map((t) => t.name)
  .join(", ");

const first = terms.find((t) => t.id === 100); // Optional相当、なければundefined

// 実際のプロジェクトコード: src/hooks/useFilter.ts
const filtered = useMemo(() => {
  let result = terms;

  if (majorCategoryId) {
    result = result.filter((t) => t.majorCategoryId === majorCategoryId);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.reading.toLowerCase().includes(q) ||
        t.english.toLowerCase().includes(q)
    );
  }
  return result;
}, [terms, majorCategoryId, searchQuery]);
```

| Java Stream              | TypeScript Array method         |
|--------------------------|---------------------------------|
| `stream().filter()`      | `.filter()`                     |
| `stream().map()`         | `.map()`                        |
| `stream().reduce()`      | `.reduce()`                     |
| `stream().findFirst()`   | `.find()`                       |
| `stream().anyMatch()`    | `.some()`                       |
| `stream().allMatch()`    | `.every()`                      |
| `Collectors.joining()`   | `.join()`                       |
| `Collectors.toList()`    | （そのまま配列として返る）       |
| `stream().sorted()`      | `.sort()`                       |

---

## 10. async/await（CompletableFuture 対比）

```java
// Java: CompletableFuture で非同期処理
CompletableFuture<String> future = CompletableFuture
  .supplyAsync(() -> fetchData())
  .thenApply(data -> processData(data))
  .exceptionally(ex -> "エラー: " + ex.getMessage());

// Java 21以降: Virtual Threads でより簡潔に
try {
  String data = fetchData(); // ブロッキング呼び出し
  process(data);
} catch (Exception e) {
  // エラー処理
}
```

```typescript
// TypeScript: async/await（JavaのCompletableFutureより直感的）
async function loadData(): Promise<string> {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error('読み込み失敗');
  }
}

// 実際のプロジェクトコード: src/hooks/useTerms.ts（fetchを使った例）
useEffect(() => {
  fetch(import.meta.env.BASE_URL + 'data/terms.json')
    .then((res) => res.json())
    .then((data: Term[]) => {
      setTerms(data);
      setLoading(false);
    })
    .catch(() => {
      setError('データの読み込みに失敗しました');
      setLoading(false);
    });
}, []);

// async/await で書き直すとこうなる
useEffect(() => {
  const load = async () => {
    try {
      const res = await fetch(import.meta.env.BASE_URL + 'data/terms.json');
      const data: Term[] = await res.json();
      setTerms(data);
    } catch {
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };
  load();
}, []);
```

| Java                        | TypeScript                  |
|-----------------------------|-----------------------------|
| `CompletableFuture<T>`      | `Promise<T>`                |
| `supplyAsync()`             | `async function`            |
| `thenApply()`               | `await` + 次の行            |
| `thenCompose()`             | `await` でネスト解消        |
| `exceptionally()`           | `catch`                     |
| `CompletableFuture.allOf()` | `Promise.all([])`           |

---

## 11. パッケージ/import の違い（Maven vs npm）

```xml
<!-- Java: Maven pom.xml で依存関係管理 -->
<dependency>
  <groupId>com.fasterxml.jackson.core</groupId>
  <artifactId>jackson-databind</artifactId>
  <version>2.15.0</version>
</dependency>
```

```json
// TypeScript: package.json で依存関係管理
// 実際のプロジェクトの package.json（一部）
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "typescript": "~5.8.3",
    "vite": "^6.3.1",
    "@types/react": "^19.1.2"
  }
}
```

```bash
# インストールコマンド比較
# Maven
mvn install

# npm
npm install        # package.json の依存関係をインストール
npm install axios  # 新しいパッケージを追加
npm install -D @types/lodash  # 開発時のみの依存（devDependencies）
```

```java
// Java: パッケージの import
import java.util.List;
import java.util.Map;
import com.example.model.Term;
```

```typescript
// TypeScript: ES Modules の import
import { useState, useEffect } from 'react';
import type { Term, Category } from '../types';  // 型のみのimport

// デフォルトエクスポートのimport
import App from './App';

// 名前付きエクスポートのimport
export function WordCard() { /* ... */ }  // 宣言側
import { WordCard } from './components/WordCard';  // 使う側
```

**Javaとの主な違い**:
- パッケージ名ではなくファイルパスで指定する（`../types` のように）
- `@types/xxx` パッケージで型定義を追加できる（型だけのパッケージ）
- `import type` は型のみをインポートする（コンパイル後のJSには残らない）

---

## まとめ

| Java の概念               | TypeScript の対応              |
|--------------------------|-------------------------------|
| `int`, `double`, `long`  | `number`                      |
| `String`                 | `string`                      |
| `interface` + `implements` | `interface`（implements不要） |
| `Optional<T>`            | `T \| null` + `?.` + `??`    |
| `List<T>`                | `T[]` or `Array<T>`           |
| `Map<K, V>`              | `Map<K, V>` or `Record<K, V>` |
| `Stream` + ラムダ         | `Array` メソッド + アロー関数  |
| `CompletableFuture<T>`   | `Promise<T>` + `async/await`  |
| `pom.xml` + Maven        | `package.json` + npm          |
| パッケージ名でimport      | ファイルパスでimport           |

TypeScriptはJavaに比べて型が「柔軟」だ。union typeやオプショナル型など、Javaにはない表現力がある一方で、
`any` 型の多用や構造的型付けによる「意図しない型の一致」には注意が必要。
`strict: true` をtsconfig.jsonで有効にして、型の恩恵を最大限に受けることを推奨する。
