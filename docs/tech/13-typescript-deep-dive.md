# TypeScript 詳細文法ガイド

Java/jQueryエンジニアがTypeScriptを深く理解するための包括的なリファレンス。
基礎から中級レベルまで、豊富なコード例とJavaとの対比を交えて解説する。

---

## 目次

1. [TypeScriptとは](#1-typescriptとは)
2. [基本型](#2-基本型)
3. [配列・タプル・オブジェクト](#3-配列タプルオブジェクト)
4. [ユニオン型・交差型](#4-ユニオン型交差型)
5. [interface と type](#5-interface-と-type)
6. [ジェネリクス](#6-ジェネリクス)
7. [関数](#7-関数)
8. [クラス](#8-クラス)
9. [モジュールシステム](#9-モジュールシステム)
10. [非同期処理](#10-非同期処理)
11. [型アサーションと型ガード](#11-型アサーションと型ガード)
12. [実践パターン](#12-実践パターン)

---

## 1. TypeScriptとは

### JavaScriptのスーパーセット

TypeScriptはMicrosoftが開発した、JavaScriptを拡張した言語だ。
「スーパーセット」とは、有効なJavaScriptコードはそのままTypeScriptとしても有効という意味である。

```
JavaScript ⊂ TypeScript
```

TypeScriptが追加するもの:
- **静的型付け**: 変数・引数・戻り値に型を付与できる
- **インターフェース**: 型の形状を定義できる
- **ジェネリクス**: 型を型パラメータで抽象化できる
- **列挙型（enum）**: 名前付き定数の集合
- **デコレータ**: アノテーションに相当する機能（実験的）

### 静的型付けの意義（Javaエンジニアには馴染みやすい）

Javaエンジニアはすでに静的型付けに慣れているため、TypeScriptの恩恵を直感的に理解できる。

```java
// Java: コンパイル時に型エラーを検出
public void greet(String name) {
    System.out.println("Hello, " + name);
}

greet(42); // コンパイルエラー: int を String に渡せない
```

```typescript
// TypeScript: 同様にコンパイル時に検出
function greet(name: string): void {
    console.log(`Hello, ${name}`);
}

greet(42); // エラー: Argument of type 'number' is not assignable to parameter of type 'string'
```

JavaScriptのみの場合、上記エラーは実行時まで気づけない。
TypeScriptは**実行前にバグを発見**できることが最大の利点だ。

### コンパイル（トランスパイル）の仕組み

TypeScriptは**トランスパイル**（ソースコードからソースコードへの変換）を行う。
コンパイル先はJavaScriptであり、ブラウザやNode.jsで実行可能になる。

```
TypeScript (.ts) → TypeScriptコンパイラ(tsc) → JavaScript (.js)
```

Javaとの対比:

| 工程           | Java                        | TypeScript                        |
|----------------|-----------------------------|-----------------------------------|
| ソース         | `.java`                     | `.ts` / `.tsx`                    |
| コンパイル先   | バイトコード (`.class`)     | JavaScript (`.js`)                |
| 実行環境       | JVM                         | ブラウザ / Node.js                |
| 型チェック     | コンパイル時                | コンパイル時（実行時には消える）  |

**重要**: TypeScriptの型情報はコンパイル後のJavaScriptには残らない。
実行時には「ただのJavaScript」として動く。これはJavaと根本的に異なる点だ。

```typescript
// TypeScript のソース
const message: string = "Hello";
function add(a: number, b: number): number {
    return a + b;
}
```

```javascript
// コンパイル後のJavaScript（型情報が消える）
const message = "Hello";
function add(a, b) {
    return a + b;
}
```

### tsconfig.json の主要設定

TypeScriptプロジェクトのルートに置く設定ファイル。Javaの`pom.xml`や`build.gradle`に相当する。

```json
{
  "compilerOptions": {
    // ターゲットのJavaScriptバージョン
    // "ES2020" など。古いブラウザ対応なら "ES5"
    "target": "ES2020",

    // モジュール形式
    // "ESNext": import/export構文 (ブラウザ・Vite向け)
    // "CommonJS": require/module.exports (Node.js向け)
    "module": "ESNext",

    // モジュール解決アルゴリズム
    "moduleResolution": "bundler",

    // 型定義ファイルの出力（ライブラリ開発時）
    "declaration": true,

    // ソースマップ出力（デバッグ用）
    "sourceMap": true,

    // 出力先ディレクトリ
    "outDir": "./dist",

    // ルートディレクトリ
    "rootDir": "./src",

    // JSX のコンパイル方法（React プロジェクト）
    // "react-jsx": React 17以降の新しい変換
    "jsx": "react-jsx",

    // ========== strictモードの詳細 ==========
    // strict: true は以下をすべて有効にする
    "strict": true,

    // nullとundefinedの扱いを厳密にする（最重要）
    // false だと null チェックを省略できてしまう
    "strictNullChecks": true,

    // 暗黙的な any を禁止（型を明示しないとエラー）
    "noImplicitAny": true,

    // this の型が暗黙的に any になることを禁止
    "noImplicitThis": true,

    // 常に strict モードの JS を出力
    "alwaysStrict": true,

    // ========== 追加の品質チェック ==========
    // 未使用のローカル変数をエラーにする
    "noUnusedLocals": true,

    // 未使用のパラメータをエラーにする
    "noUnusedParameters": true,

    // switch の fall-through を禁止
    "noFallthroughCasesInSwitch": true,

    // 関数の戻り値が常に存在することを保証
    "noImplicitReturns": true,

    // パスエイリアス（@/src → ./src）
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },

    // 型定義ファイルの参照先
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

`strict: true` は**必ず有効にすること**。これを無効にするとTypeScriptの恩恵が大幅に失われる。

---

## 2. 基本型

### プリミティブ型

```typescript
// string: 文字列（シングル・ダブル・テンプレートリテラル）
const firstName: string = "太郎";
const greeting: string = `こんにちは、${firstName}さん`;

// number: 整数・小数・16進数・2進数・8進数すべて同じ型
const age: number = 25;
const pi: number = 3.14159;
const hex: number = 0xff;     // 255
const binary: number = 0b1010; // 10
const octal: number = 0o17;   // 15

// boolean
const isActive: boolean = true;
const hasPermission: boolean = false;

// null と undefined（strictNullChecks が重要）
const nothing: null = null;
const notYet: undefined = undefined;

// symbol: ユニークなキー（Javaにない概念）
const key1 = Symbol("description");
const key2 = Symbol("description");
console.log(key1 === key2); // false: 常に異なる値

// bigint: 任意精度の整数（Java の BigInteger に相当）
const huge: bigint = 9007199254740993n; // number では精度が失われる値
const alsoHuge: bigint = BigInt("9007199254740993");
```

Javaとの対比:

| Java                   | TypeScript      | 注意点                                          |
|------------------------|-----------------|-------------------------------------------------|
| `int`, `long`, `float`, `double` | `number` | TypeScriptに数値型の細分化はない      |
| `String`               | `string`        | TypeScriptは小文字始まり                        |
| `boolean`              | `boolean`       | 同じ                                            |
| `null`                 | `null`          | strictNullChecks なしだとどこでも使える（危険） |
| なし                   | `undefined`     | 未初期化変数・存在しないプロパティの値          |
| `BigInteger`           | `bigint`        | リテラルは末尾に `n`                            |
| なし                   | `symbol`        | Javaにない概念                                  |

### リテラル型（Javaにない概念）

TypeScriptでは、特定の値そのものを型として使える。

```typescript
// 文字列リテラル型
type Direction = "north" | "south" | "east" | "west";
const heading: Direction = "north";  // OK
// const wrong: Direction = "up";   // エラー: "up" は Direction 型に代入不可

// 数値リテラル型
type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;
const roll: DiceValue = 3;  // OK
// const invalid: DiceValue = 7;  // エラー

// 真偽値リテラル型（あまり使わないが存在する）
type AlwaysTrue = true;

// 実用例: HTTP メソッド
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

function request(url: string, method: HttpMethod): void {
    // method は必ず上記5種類のいずれか
    console.log(`${method} ${url}`);
}

request("/api/users", "GET");    // OK
request("/api/users", "FETCH"); // エラー: "FETCH" は HttpMethod に代入不可
```

Javaでは同等のことを `enum` で実現するが、TypeScriptのリテラル型はより軽量だ。

```java
// Java の enum
public enum HttpMethod { GET, POST, PUT, DELETE, PATCH }
```

```typescript
// TypeScript のリテラル型（enum より軽量で柔軟）
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
```

### any, unknown, never, void の違いと使い分け

これらはTypeScript特有の「特殊型」だ。

```typescript
// ==================== any ====================
// 型チェックを完全に無効化する「逃げ道」
// 使用は最小限にすべき

let dangerous: any = "文字列";
dangerous = 42;           // OK
dangerous = { x: 1 };    // OK
dangerous.nonExistent();  // エラーにならない！（実行時エラーの温床）

// any が許容される場面:
// 1. 型定義のないサードパーティライブラリ
// 2. 段階的な移行（JSからTSへ）
// 3. 本当に動的なデータ（JSONのパース直後など）

// ==================== unknown ====================
// any の安全版。使用前に型チェックが必要

let safeData: unknown = fetchSomeData();

// unknown はそのままでは使えない
// safeData.toUpperCase(); // エラー: unknown 型にはメソッドがない

// 型チェック後に使える
if (typeof safeData === "string") {
    console.log(safeData.toUpperCase()); // OK: ここでは string として扱われる
}

// unknown は any より安全なので、any の代わりに使うべき
function parseJSON(json: string): unknown {
    return JSON.parse(json); // 何が来るかわからない
}

// ==================== never ====================
// 絶対に到達しない・値が存在し得ない型

// 例1: 必ず例外を投げる関数
function throwError(message: string): never {
    throw new Error(message);
    // この関数は正常に値を返さない → 戻り値型は never
}

// 例2: 無限ループ
function infiniteLoop(): never {
    while (true) {
        // 永遠に実行される
    }
}

// 例3: 網羅性チェック（実践で重要！）
type Shape = "circle" | "square" | "triangle";

function area(shape: Shape): number {
    switch (shape) {
        case "circle":   return Math.PI * 5 * 5;
        case "square":   return 5 * 5;
        case "triangle": return (5 * 5) / 2;
        default:
            // もし Shape に新しい型を追加して case を書き忘れると
            // ここで never 型チェックが機能してエラーになる
            const exhaustiveCheck: never = shape;
            throw new Error(`未対応の形状: ${exhaustiveCheck}`);
    }
}

// ==================== void ====================
// 「意味のある値を返さない」ことを示す
// Java の void に相当するが、微妙に異なる

function logMessage(message: string): void {
    console.log(message);
    // return; // これは OK（暗黙の undefined を返す）
    // return undefined; // これも OK
    // return "hello"; // エラー: void 型は string を返せない
}

// void と undefined の違い
// void: 戻り値を使わないことを意図した関数の型
// undefined: 実際に undefined という値を返す

type Callback = () => void;  // コールバックの戻り値は無視されることを意図
type Getter = () => undefined;  // 明示的に undefined を返す関数

// void の関数型は戻り値を返しても無視される（重要）
const arr = [1, 2, 3];
// Array.prototype.forEach のコールバックは () => void
// なので値を返す関数を渡しても型エラーにならない
arr.forEach((x) => x * 2);  // OK（戻り値は無視される）
```

まとめ表:

| 型        | 意味                                     | 使う場面                                        |
|-----------|------------------------------------------|-------------------------------------------------|
| `any`     | 型チェック無効化                         | 移行期・型定義のないライブラリ（最小限に）      |
| `unknown` | 型チェックを強制する安全な `any`         | 外部からのデータ（API レスポンス、JSON）        |
| `never`   | 値が存在し得ない・到達しない             | 例外専用関数、網羅性チェック                    |
| `void`    | 戻り値を使うことを意図しない             | 副作用のみの関数、コールバック                  |

### 型推論（Type Inference）

TypeScriptは多くの場面で型を自動推論する。Javaの`var`（Java 10以降）に相当するが、より強力だ。

```typescript
// 型を明示しなくても推論される
const name = "Alice";      // 推論: string
const age = 30;            // 推論: number
const active = true;       // 推論: boolean
const ratio = age / 100;   // 推論: number

// 配列の推論
const numbers = [1, 2, 3];        // 推論: number[]
const mixed = [1, "two", true];   // 推論: (number | string | boolean)[]

// 関数の戻り値推論
function add(a: number, b: number) {
    return a + b;  // 戻り値型が number と推論される
}

// オブジェクトの推論
const user = {
    name: "Bob",
    age: 25,
    email: "bob@example.com"
};
// 推論: { name: string; age: number; email: string }

// コンテキスト型推論: 型から引数の型を推論
const numbers2 = [1, 2, 3];
numbers2.forEach((n) => {
    // n の型は number と推論される（forEach の型定義から）
    console.log(n.toFixed(2));  // OK
});

// 型推論の限界: 明示が必要なケース
// 1. 関数のパラメータ（推論できない）
function greet(name) {  // エラー: noImplicitAny のため any と推論不可
    return `Hello, ${name}`;
}

// 2. 型を絞り込みたいとき
const status = "active";  // 推論: string（広すぎる）
const narrowStatus = "active" as const;  // 推論: "active"（リテラル型）
```

---

## 3. 配列・タプル・オブジェクト

### 配列

```typescript
// 2つの書き方（どちらも同じ意味）
const numbers1: number[] = [1, 2, 3];
const numbers2: Array<number> = [1, 2, 3]; // ジェネリクス記法

// どちらを使うべきか:
// - number[] : シンプルで読みやすい（推奨）
// - Array<T> : 複雑な型のときに読みやすい（例: Array<Map<string, number>>）

// 文字列配列
const fruits: string[] = ["apple", "banana", "cherry"];

// オブジェクトの配列
interface User {
    id: number;
    name: string;
}
const users: User[] = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
];

// 配列操作（Java の Stream API との対比）
const scores = [85, 92, 78, 95, 88];

// Java: scores.stream().filter(s -> s >= 90).collect(Collectors.toList())
const highScores = scores.filter(s => s >= 90);  // [92, 95]

// Java: scores.stream().map(s -> s * 1.1).collect(Collectors.toList())
const boosted = scores.map(s => s * 1.1);  // [93.5, 101.2, ...]

// Java: scores.stream().reduce(0, Integer::sum)
const total = scores.reduce((sum, s) => sum + s, 0);  // 438

// スプレッド演算子（イミュータブルな操作）
const moreScores = [...scores, 100, 99];  // 元の配列を変更しない
const withoutFirst = scores.slice(1);      // 先頭を除いた新しい配列

// readonly 配列（後述）
const immutable: readonly number[] = [1, 2, 3];
// immutable.push(4);  // エラー: readonly 配列は変更不可
```

### タプル

タプルは**固定長で各位置の型が決まった配列**だ。Javaにない概念。

```typescript
// 基本的なタプル
type Point = [number, number];
const origin: Point = [0, 0];
const p: Point = [3, 4];

// 型安全なアクセス
console.log(p[0]);  // 3 (number)
console.log(p[1]);  // 4 (number)
// p[2]; // エラー: タプルの長さは 2

// 異なる型を持つタプル
type NameAge = [string, number];
const alice: NameAge = ["Alice", 30];

// ラベル付きタプル（TypeScript 4.0以降）
type RGB = [red: number, green: number, blue: number];
const red: RGB = [255, 0, 0];

// 分割代入でタプルを使う（実践的）
function getMinMax(numbers: number[]): [number, number] {
    const sorted = [...numbers].sort((a, b) => a - b);
    return [sorted[0], sorted[sorted.length - 1]];
}

const [min, max] = getMinMax([3, 1, 4, 1, 5, 9, 2, 6]);
console.log(min, max);  // 1 9

// React の useState もタプルを返す
// const [count, setCount] = useState(0);
// count: number, setCount: (value: number) => void

// レストパラメータを持つタプル
type StringsWithNumber = [string, ...string[], number];
const example: StringsWithNumber = ["a", "b", "c", 42];
```

### オブジェクト型

```typescript
// インラインオブジェクト型
const user: { name: string; age: number } = {
    name: "Alice",
    age: 30,
};

// オプショナルプロパティ（? を付ける）
const optionalUser: { name: string; nickname?: string } = {
    name: "Bob",
    // nickname がなくても OK
};

// オブジェクトの操作（スプレッド）
const updatedUser = { ...user, age: 31 };  // プロパティの上書き
const mergedUser = { ...user, ...optionalUser };  // マージ

// 計算プロパティ名
const key = "name";
const dynamic: { [key: string]: string } = {};
dynamic["firstName"] = "Alice";  // 動的なキー

// インデックスシグネチャ（辞書型）
interface StringMap {
    [key: string]: string;
}
const map: StringMap = {
    hello: "こんにちは",
    goodbye: "さようなら",
};

// ネストしたオブジェクト
interface Address {
    street: string;
    city: string;
    zipCode: string;
}

interface Person {
    name: string;
    age: number;
    address: Address;
    tags: string[];
}

const alice: Person = {
    name: "Alice",
    age: 30,
    address: {
        street: "123 Main St",
        city: "Tokyo",
        zipCode: "100-0001",
    },
    tags: ["admin", "user"],
};
```

### readonly 配列と readonly プロパティ

```typescript
// readonly プロパティ: 代入後は変更不可（Java の final フィールドに相当）
interface ImmutablePoint {
    readonly x: number;
    readonly y: number;
}

const point: ImmutablePoint = { x: 3, y: 4 };
// point.x = 5;  // エラー: readonly プロパティには代入不可

// readonly 配列
const readonlyArr: readonly number[] = [1, 2, 3];
// readonlyArr.push(4);    // エラー
// readonlyArr[0] = 99;   // エラー

// ReadonlyArray<T> でも書ける（同じ意味）
const readonlyArr2: ReadonlyArray<number> = [1, 2, 3];

// const との違い
const arr = [1, 2, 3];
arr.push(4);        // OK: const は再代入を禁止するが、内容の変更はOK
arr[0] = 99;        // OK

const readOnly: readonly number[] = [1, 2, 3];
// readOnly.push(4); // エラー: 内容の変更も禁止

// 実践例: 設定オブジェクトをイミュータブルにする
const CONFIG = {
    apiUrl: "https://api.example.com",
    timeout: 5000,
    retries: 3,
} as const;  // すべてのプロパティを readonly にし、型をリテラル型にする

// CONFIG.apiUrl の型は string ではなく "https://api.example.com"
// CONFIG.timeout の型は number ではなく 5000
```

---

## 4. ユニオン型・交差型

### ユニオン型（Union Types）

「A型 **または** B型」を表す。Javaのオーバーロードに対応するが、より柔軟だ。

```typescript
// 基本的なユニオン型
type StringOrNumber = string | number;

function display(value: StringOrNumber): string {
    if (typeof value === "string") {
        return `文字列: ${value}`;
    } else {
        return `数値: ${value}`;
    }
}

console.log(display("hello")); // "文字列: hello"
console.log(display(42));      // "数値: 42"
```

```java
// Java では同名の異なる引数でオーバーロード
public String display(String value) {
    return "文字列: " + value;
}
public String display(int value) {
    return "数値: " + value;
}
```

```typescript
// TypeScript のユニオン型の方が柔軟: nullを含められる
type MaybeString = string | null;
type MaybeUser = User | null | undefined;

// 実践例: API レスポンスのステータス
type ApiStatus = "loading" | "success" | "error";

interface ApiState<T> {
    status: ApiStatus;
    data: T | null;
    error: Error | null;
}
```

### 交差型（Intersection Types）

「A型 **かつ** B型」を表す。JavaのMultiple Interfaceに相当する。

```typescript
// 基本的な交差型
interface HasName {
    name: string;
}

interface HasAge {
    age: number;
}

type Person = HasName & HasAge;

const alice: Person = {
    name: "Alice",  // HasName が要求
    age: 30,        // HasAge が要求
    // どちらも必要
};

// Javaでの対応（インターフェースの多重実装）
// class Alice implements HasName, HasAge { ... }
// TypeScriptの交差型はクラスを作らず型だけで表現できる

// 実践例: ベース型に追加プロパティを合成する
interface BaseConfig {
    timeout: number;
    retries: number;
}

interface AuthConfig {
    token: string;
    refreshToken: string;
}

type AuthenticatedConfig = BaseConfig & AuthConfig;

const config: AuthenticatedConfig = {
    timeout: 5000,
    retries: 3,
    token: "abc123",
    refreshToken: "xyz789",
};

// ミックスイン的な使い方（複数の型の機能を合成）
type Logger = {
    log: (message: string) => void;
};
type Serializable = {
    serialize: () => string;
};

type LoggableAndSerializable = Logger & Serializable;
```

### 型の絞り込み（Type Narrowing）

ユニオン型から具体的な型に絞り込む。TypeScriptが最も強力な点の一つだ。

```typescript
// ======= typeof による絞り込み =======
function processInput(input: string | number | boolean): string {
    if (typeof input === "string") {
        // ここでは input は string 型
        return input.toUpperCase();
    } else if (typeof input === "number") {
        // ここでは input は number 型
        return input.toFixed(2);
    } else {
        // ここでは input は boolean 型（TypeScript が推論）
        return input ? "はい" : "いいえ";
    }
}

// ======= instanceof による絞り込み =======
class Dog {
    bark(): void { console.log("ワン"); }
}
class Cat {
    meow(): void { console.log("ニャー"); }
}

function makeSound(animal: Dog | Cat): void {
    if (animal instanceof Dog) {
        animal.bark();  // ここでは Dog 型
    } else {
        animal.meow();  // ここでは Cat 型
    }
}

// ======= in による絞り込み =======
interface Fish {
    swim: () => void;
}
interface Bird {
    fly: () => void;
}

function move(animal: Fish | Bird): void {
    if ("swim" in animal) {
        animal.swim();  // Fish 型
    } else {
        animal.fly();   // Bird 型
    }
}

// ======= ユーザー定義型ガード =======
// 「is」キーワードで型を保証する関数

function isString(value: unknown): value is string {
    return typeof value === "string";
}

function isUser(value: unknown): value is User {
    return (
        typeof value === "object" &&
        value !== null &&
        "name" in value &&
        "age" in value
    );
}

const data: unknown = fetchData();
if (isUser(data)) {
    // ここでは data は User 型として扱われる
    console.log(data.name);  // OK
}

// ======= 真偽値チェックによる絞り込み =======
function processName(name: string | null | undefined): string {
    if (!name) {
        return "名無し"; // null と undefined を除外
    }
    return name.toUpperCase(); // ここでは name は string 型
}
```

### discriminated unions（タグ付きユニオン）

**共通のタグフィールド**を使って型を識別するパターン。実践で非常に重要。

```typescript
// 図形を表すタグ付きユニオン
interface Circle {
    kind: "circle";  // タグ（判別子）
    radius: number;
}

interface Square {
    kind: "square";  // タグ（判別子）
    side: number;
}

interface Triangle {
    kind: "triangle";  // タグ（判別子）
    base: number;
    height: number;
}

type Shape = Circle | Square | Triangle;

function area(shape: Shape): number {
    switch (shape.kind) {
        case "circle":
            // ここでは shape は Circle 型
            return Math.PI * shape.radius ** 2;
        case "square":
            // ここでは shape は Square 型
            return shape.side ** 2;
        case "triangle":
            // ここでは shape は Triangle 型
            return (shape.base * shape.height) / 2;
        default:
            // TypeScript がすべてのケースを処理したことを確認
            const _exhaustive: never = shape;
            throw new Error(`Unknown shape: ${_exhaustive}`);
    }
}

// 実践例: Redux アクション（状態管理でよく使う）
type Action =
    | { type: "INCREMENT"; amount: number }
    | { type: "DECREMENT"; amount: number }
    | { type: "RESET" }
    | { type: "SET_USER"; userId: string; name: string };

function reducer(state: number, action: Action): number {
    switch (action.type) {
        case "INCREMENT":
            return state + action.amount;  // action.amount は存在する
        case "DECREMENT":
            return state - action.amount;
        case "RESET":
            // action.amount は存在しない（エラーになる）
            return 0;
        case "SET_USER":
            console.log(action.userId, action.name);
            return state;
    }
}
```

---

## 5. interface と type

### interface の定義と実装

```typescript
// interface の定義
interface Animal {
    name: string;
    age: number;
    speak(): string;  // メソッドシグネチャ
}

// interface の実装（クラスで）
class Dog implements Animal {
    constructor(
        public name: string,
        public age: number,
    ) {}

    speak(): string {
        return `${this.name}がワンと鳴いた`;
    }
}

// interface を型として使う（オブジェクトに対して）
const myDog: Animal = {
    name: "ポチ",
    age: 3,
    speak() { return "ワン"; }
};

// interface の継承（extends）
interface Pet extends Animal {
    owner: string;
}

interface ServiceAnimal extends Animal {
    serviceType: string;
    registration: string;
}

// 複数インターフェースの継承
interface GuideDog extends Pet, ServiceAnimal {
    route: string[];
}

// 読み取り専用・オプショナルプロパティ
interface UserProfile {
    readonly id: number;      // 変更不可
    name: string;
    email?: string;           // なくてもOK
    phone?: string;
    createdAt: Date;
}

// メソッドの定義方法（2通り、ほぼ同じ）
interface Greeter {
    greet(name: string): string;       // メソッドシグネチャ
    farewell: (name: string) => string; // プロパティとして定義
}
```

### type alias

```typescript
// type alias: 型に名前をつける
type UserId = number;
type UserName = string;
type Status = "active" | "inactive" | "pending";

// オブジェクト型
type Point = {
    x: number;
    y: number;
};

// 関数型
type Formatter = (value: number, locale: string) => string;

// ジェネリクス付き type alias
type Nullable<T> = T | null;
type Optional<T> = T | null | undefined;

const maybeUser: Nullable<User> = null;

// 複雑な型の名前付け
type EventHandler<E extends Event> = (event: E) => void;
type ClickHandler = EventHandler<MouseEvent>;
type KeyHandler = EventHandler<KeyboardEvent>;
```

### interface と type の違い

```typescript
// ======= 違い1: Declaration Merging（インターフェースのみ）=======
// interface は同名で複数回宣言してマージできる

interface Window {
    myCustomProperty: string;
}
// 既存の Window インターフェースに追加される（マージ）
// ライブラリの型定義を拡張するときに使う

// type alias は同名での再宣言不可
// type MyType = string;
// type MyType = number; // エラー: 重複した識別子

// ======= 違い2: extends vs & =======
// interface は extends で継承
interface Animal {
    name: string;
}
interface Dog extends Animal {
    breed: string;
}

// type は & で交差型を作る
type AnimalType = { name: string };
type DogType = AnimalType & { breed: string };

// ======= 違い3: 複雑な型の表現 =======
// type alias にしかできないこと

// ユニオン型に名前をつける
type StringOrNumber = string | number;  // interface ではできない

// タプル型に名前をつける
type Coordinate = [number, number];  // interface ではできない

// 条件付き型・マップ型
type Readonly<T> = { readonly [K in keyof T]: T[K] }; // interface ではできない

// ======= どちらを使うべきか =======
// 【推奨】オブジェクト型・クラスが実装するもの → interface
// 【推奨】ユニオン型・タプル・複雑な型 → type

// 実際のプロジェクトでの使い分け例:
// interface: APIレスポンスの形、コンポーネントのProps、クラスの実装仕様
// type: 状態の種類（"loading" | "success"）、ユーティリティ型

interface ApiResponse<T> {   // → interface（オブジェクトの形）
    data: T;
    status: number;
    message: string;
}

type LoadingState = "idle" | "loading" | "success" | "error"; // → type（ユニオン）
```

### Utility Types（組み込みユーティリティ型）

TypeScriptが提供する便利な型変換ツール群。

```typescript
interface User {
    id: number;
    name: string;
    email: string;
    age: number;
    role: "admin" | "user" | "guest";
}

// ======= Partial<T>: すべてのプロパティをオプショナルに =======
// Java で Builder パターンを使う場面に相当

type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number; role?: ... }

// 実用例: 更新用のDTO
function updateUser(id: number, changes: Partial<User>): User {
    // changes には変更するフィールドだけ含まれる
    return { ...currentUser, ...changes };
}
updateUser(1, { name: "Bob" });  // 名前だけ更新

// ======= Required<T>: すべてのプロパティを必須に =======
interface Config {
    host?: string;
    port?: number;
    timeout?: number;
}

type StrictConfig = Required<Config>;
// { host: string; port: number; timeout: number }

// ======= Pick<T, K>: 特定のプロパティだけを抽出 =======
type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string }

// 実用例: 一覧表示用の軽量な型
type UserListItem = Pick<User, "id" | "name" | "role">;

// ======= Omit<T, K>: 特定のプロパティを除外 =======
type UserWithoutId = Omit<User, "id">;
// { name: string; email: string; age: number; role: ... }

// 実用例: 作成用のDTO（id はサーバーが採番するので除外）
type CreateUserDto = Omit<User, "id">;

// ======= Record<K, V>: キーと値の型を指定したオブジェクト型 =======
type RolePermissions = Record<"admin" | "user" | "guest", string[]>;
const permissions: RolePermissions = {
    admin: ["read", "write", "delete"],
    user: ["read", "write"],
    guest: ["read"],
};

// Java の Map<String, List<String>> に相当
type StringToNumber = Record<string, number>;

// ======= Readonly<T>: すべてのプロパティを readonly に =======
type ImmutableUser = Readonly<User>;
// { readonly id: number; readonly name: string; ... }

const frozenUser: ImmutableUser = { id: 1, name: "Alice", email: "a@b.com", age: 30, role: "user" };
// frozenUser.name = "Bob"; // エラー

// ======= Exclude<T, U>: ユニオンから特定の型を除外 =======
type Color = "red" | "green" | "blue" | "yellow";
type PrimaryColor = Exclude<Color, "yellow">;
// "red" | "green" | "blue"

// ======= Extract<T, U>: ユニオンから特定の型だけを抽出 =======
type NumberOrString = string | number | boolean | null;
type JustStringOrNumber = Extract<NumberOrString, string | number>;
// string | number

// ======= NonNullable<T>: null と undefined を除去 =======
type MaybeString = string | null | undefined;
type DefinitelyString = NonNullable<MaybeString>;
// string

// ======= ReturnType<T>: 関数の戻り値型を取得 =======
function createUser(name: string, age: number) {
    return { id: Math.random(), name, age, createdAt: new Date() };
}
type CreatedUser = ReturnType<typeof createUser>;
// { id: number; name: string; age: number; createdAt: Date }

// ======= Parameters<T>: 関数のパラメータ型をタプルで取得 =======
type CreateUserParams = Parameters<typeof createUser>;
// [name: string, age: number]

// ======= Awaited<T>: Promise の解決型を取得 =======
async function fetchUser(id: number): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
}
type FetchedUser = Awaited<ReturnType<typeof fetchUser>>;
// User
```

---

## 6. ジェネリクス

### 関数ジェネリクス

```typescript
// 型パラメータ T を使った汎用関数
function identity<T>(arg: T): T {
    return arg;
}

// 呼び出し時に型を指定（または推論）
const str = identity<string>("hello");   // T = string
const num = identity(42);               // T = number（推論）
const bool = identity<boolean>(true);   // T = boolean
```

```java
// Java のジェネリクス（対比）
public <T> T identity(T arg) {
    return arg;
}

String str = identity("hello");
Integer num = identity(42);
```

```typescript
// 実践的なジェネリクス関数

// 配列の最初の要素を取得
function first<T>(arr: T[]): T | undefined {
    return arr[0];
}
const firstNum = first([1, 2, 3]);    // number | undefined
const firstStr = first(["a", "b"]);   // string | undefined

// 配列を特定のキーで辞書に変換（実用的！）
function toMap<T, K extends keyof T>(arr: T[], key: K): Map<T[K], T> {
    return new Map(arr.map(item => [item[key], item]));
}

interface Product {
    id: number;
    name: string;
    price: number;
}

const products: Product[] = [
    { id: 1, name: "りんご", price: 100 },
    { id: 2, name: "バナナ", price: 80 },
];

const productMap = toMap(products, "id");
// Map<number, Product>

// 複数の型パラメータ
function zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
    return arr1.map((item, i) => [item, arr2[i]]);
}

const zipped = zip(["a", "b", "c"], [1, 2, 3]);
// [["a", 1], ["b", 2], ["c", 3]]
```

### インターフェースジェネリクス

```typescript
// ジェネリックなインターフェース
interface Repository<T> {
    findById(id: number): Promise<T | null>;
    findAll(): Promise<T[]>;
    create(data: Omit<T, "id">): Promise<T>;
    update(id: number, data: Partial<T>): Promise<T>;
    delete(id: number): Promise<void>;
}

// 具体的な型で実装
class UserRepository implements Repository<User> {
    async findById(id: number): Promise<User | null> {
        const response = await fetch(`/api/users/${id}`);
        return response.ok ? response.json() : null;
    }
    // ... 他のメソッドも実装
}

// ジェネリックなレスポンス型
interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
    timestamp: string;
}

// 使用例
type UserApiResponse = ApiResponse<User>;
type UserListApiResponse = ApiResponse<User[]>;
type PaginatedResponse<T> = ApiResponse<{
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}>;
```

### 制約（extends）

```typescript
// T は { length: number } を持つ型に限定
function logLength<T extends { length: number }>(arg: T): T {
    console.log(`Length: ${arg.length}`);
    return arg;
}

logLength("hello");       // string には length がある: OK
logLength([1, 2, 3]);    // number[] には length がある: OK
logLength({ length: 10, value: "x" }); // length を持つオブジェクト: OK
// logLength(42);         // number には length がない: エラー
```

```java
// Java の bounded type parameters（対比）
public <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}
```

```typescript
// TypeScript での同様の制約
function max<T extends { compareTo(other: T): number }>(a: T, b: T): T {
    return a.compareTo(b) >= 0 ? a : b;
}

// keyof を使った制約（実践で重要）
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

const user: User = { id: 1, name: "Alice", email: "alice@example.com", age: 30, role: "user" };
const name = getProperty(user, "name");   // string 型が返る
const age = getProperty(user, "age");     // number 型が返る
// getProperty(user, "invalid");          // エラー: "invalid" は User のキーにない
```

### デフォルト型パラメータ

```typescript
// Java 10以降に型推論があるが、デフォルト型パラメータはない
// TypeScript では型にデフォルト値を設定できる

interface PaginatedResult<T = unknown, Meta = Record<string, unknown>> {
    items: T[];
    total: number;
    meta: Meta;
}

// デフォルトを使う（T = unknown, Meta = Record<string, unknown>）
type GenericResult = PaginatedResult;

// 明示的に指定
type UserResult = PaginatedResult<User>;
type UserResultWithMeta = PaginatedResult<User, { searchQuery: string }>;

// 実用例: useState 的な型
type State<T = undefined> = {
    value: T;
    isLoading: boolean;
    error: Error | null;
};

const initialState: State = { value: undefined, isLoading: false, error: null };
const userState: State<User | null> = { value: null, isLoading: true, error: null };
```

### 実践例：API レスポンス型

```typescript
// 汎用的なHTTPクライアント
async function get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json() as Promise<T>;
}

// 型安全なAPI呼び出し
const user = await get<User>("/api/users/1");           // User 型
const users = await get<User[]>("/api/users");          // User[] 型
const post = await get<Post>("/api/posts/42");           // Post 型

// エラーも含めた完全なレスポンス型
type Result<T, E = Error> =
    | { success: true; data: T }
    | { success: false; error: E };

async function safeGet<T>(url: string): Promise<Result<T>> {
    try {
        const data = await get<T>(url);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error as Error };
    }
}

const result = await safeGet<User>("/api/users/1");
if (result.success) {
    console.log(result.data.name);  // OK: data は User 型
} else {
    console.error(result.error.message);  // OK: error は Error 型
}
```

---

## 7. 関数

### 関数の定義方法

```typescript
// ======= 関数宣言（ホイスティングあり）=======
function add(a: number, b: number): number {
    return a + b;
}

// ======= 関数式（変数に代入）=======
const multiply = function(a: number, b: number): number {
    return a * b;
};

// ======= アロー関数（ES6以降の主流）=======
const divide = (a: number, b: number): number => a / b;

// 複数行のアロー関数
const subtract = (a: number, b: number): number => {
    const result = a - b;
    return result;
};

// TypeScript での使い分け:
// 関数宣言: ユーティリティ関数、再帰関数
// アロー関数: コールバック、コンポーネント内の関数
// 注意: this の束縛が異なる（クラス内では重要）

// Javaとの対比（ラムダ式）
// Java:       (a, b) -> a + b
// TypeScript: (a, b) => a + b
```

### パラメータのバリエーション

```typescript
// ======= オプショナルパラメータ（? を付ける）=======
function greet(name: string, greeting?: string): string {
    const g = greeting ?? "こんにちは";  // ?? は null/undefined のとき右辺を使う
    return `${g}、${name}さん！`;
}

greet("Alice");              // "こんにちは、Aliceさん！"
greet("Bob", "おはよう");   // "おはよう、Bobさん！"

// 注意: オプショナルパラメータは必須パラメータの後に置く
// function bad(a?: string, b: string): void {} // エラー

// ======= デフォルト値パラメータ =======
function createUser(
    name: string,
    role: "admin" | "user" = "user",  // デフォルト値
    active: boolean = true,
): User {
    return { id: Date.now(), name, email: "", age: 0, role };
}

createUser("Alice");                    // role = "user", active = true
createUser("Bob", "admin");            // role = "admin", active = true
createUser("Charlie", "user", false); // すべて指定

// ======= レストパラメータ（可変長引数）=======
function sum(...numbers: number[]): number {
    return numbers.reduce((total, n) => total + n, 0);
}

sum(1, 2, 3);           // 6
sum(1, 2, 3, 4, 5);    // 15

// Java との対比
// Java:       public int sum(int... numbers)
// TypeScript: function sum(...numbers: number[]): number

// 混在させる場合（レストは最後のみ）
function log(level: "info" | "warn" | "error", ...messages: string[]): void {
    console.log(`[${level.toUpperCase()}]`, ...messages);
}

log("info", "サーバー起動", "ポート: 3000");
log("error", "接続失敗");
```

### 関数のオーバーロード

```typescript
// TypeScript のオーバーロードはシグネチャと実装を分ける

// オーバーロードシグネチャ（型の定義）
function convert(value: string): number;
function convert(value: number): string;
function convert(value: string[]): number[];

// 実装シグネチャ（実際の処理）
function convert(value: string | number | string[]): number | string | number[] {
    if (typeof value === "string") {
        return parseInt(value, 10);
    } else if (typeof value === "number") {
        return value.toString();
    } else {
        return value.map(s => parseInt(s, 10));
    }
}

// 呼び出し時は型が正確に推論される
const num = convert("42");        // 戻り値: number
const str = convert(42);          // 戻り値: string
const nums = convert(["1", "2"]); // 戻り値: number[]
```

```java
// Java のオーバーロード（対比）
public int convert(String value) { return Integer.parseInt(value); }
public String convert(int value) { return String.valueOf(value); }
public int[] convert(String[] values) { ... }
```

### コールバック関数の型定義

```typescript
// 関数型の定義
type Predicate<T> = (item: T) => boolean;
type Transformer<T, U> = (item: T) => U;
type Consumer<T> = (item: T) => void;
type Producer<T> = () => T;

// コールバックを受け取る関数
function filter<T>(arr: T[], predicate: Predicate<T>): T[] {
    return arr.filter(predicate);
}

function map<T, U>(arr: T[], transform: Transformer<T, U>): U[] {
    return arr.map(transform);
}

// 使用例
const users: User[] = [/* ... */];
const adults = filter(users, user => user.age >= 18);
const names = map(users, user => user.name);

// イベントハンドラの型定義
type EventHandler<T extends Event = Event> = (event: T) => void;

const handleClick: EventHandler<MouseEvent> = (e) => {
    console.log(e.clientX, e.clientY);
};

// 非同期コールバック
type AsyncCallback<T> = (result: T) => Promise<void>;

// React での型定義
interface ButtonProps {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onChange?: (value: string) => void;
    onError?: (error: Error) => void;
}
```

### void vs undefined の返り値

```typescript
// void: 戻り値を使うことを意図しない（でも undefined を返してもよい）
function doSomething(): void {
    console.log("何か処理");
    // return; // OK
    // return undefined; // OK
    // return "hello"; // エラー
}

// undefined: 明示的に undefined を返す
function getNothing(): undefined {
    return undefined;  // 必ずこれを返す必要がある
}

// 実際の違いが現れる場面: コールバックの型
// void型の関数型は、戻り値があっても代入できる（柔軟性のため）
type VoidCallback = () => void;

const cb1: VoidCallback = () => "hello";    // OK（戻り値は無視される）
const cb2: VoidCallback = () => 42;         // OK（戻り値は無視される）
const cb3: VoidCallback = () => {};         // OK

// undefined型の関数型は、undefined以外を返せない
type UndefinedCallback = () => undefined;
// const cb4: UndefinedCallback = () => "hello"; // エラー
const cb5: UndefinedCallback = () => undefined;  // OK
```

---

## 8. クラス

### 基本的なクラス定義

Javaエンジニアには馴染みやすいが、いくつか違いがある。

```typescript
class Animal {
    // フィールド宣言（TypeScript では型を明示）
    name: string;
    private age: number;
    protected species: string;
    readonly id: number;

    // コンストラクタ
    constructor(name: string, age: number, species: string) {
        this.name = name;
        this.age = age;
        this.species = species;
        this.id = Math.random();
    }

    // メソッド
    greet(): string {
        return `私は${this.species}の${this.name}です`;
    }

    // getter / setter
    get Age(): number {
        return this.age;
    }

    set Age(value: number) {
        if (value < 0) throw new Error("年齢は0以上");
        this.age = value;
    }
}
```

```java
// Java との対比
public class Animal {
    private String name;
    private int age;
    protected String species;
    private final int id;

    public Animal(String name, int age, String species) {
        this.name = name;
        this.age = age;
        this.species = species;
        this.id = (int)(Math.random() * Integer.MAX_VALUE);
    }
}
```

### コンストラクタの短縮記法（TypeScript 特有）

```typescript
// TypeScript 特有の便利な書き方
// constructor のパラメータにアクセス修飾子をつけると
// 自動的にフィールド宣言と代入が行われる

class Animal {
    readonly id: number = Math.random(); // フィールドのインライン初期化

    constructor(
        public name: string,           // public フィールドとして自動宣言
        private age: number,           // private フィールドとして自動宣言
        protected species: string,     // protected フィールドとして自動宣言
    ) {
        // this.name = name; などが不要！
    }
}

// 上の Java のコードと等価だが、はるかに簡潔
```

### アクセス修飾子

```typescript
class BankAccount {
    public owner: string;           // どこからでもアクセス可
    protected balance: number;      // このクラスと派生クラスから
    private _password: string;      // このクラス内からのみ

    // TypeScript 固有: # による真のプライベートフィールド
    // （JS の仕様に基づくもので、コンパイル後も非公開）
    #secretKey: string;

    constructor(owner: string, initialBalance: number) {
        this.owner = owner;
        this.balance = initialBalance;
        this._password = "default";
        this.#secretKey = "sk_secret";
    }

    // public はデフォルトなので省略可
    deposit(amount: number): void {
        this.balance += amount;
    }

    private validatePassword(pwd: string): boolean {
        return pwd === this._password;
    }
}

// Java との対比
// Java:       private, protected, public, (package-private)
// TypeScript: private, protected, public, readonly
// 注意: TypeScript の private はコンパイル後のJSでは普通のプロパティ
//        # を使うと実行時にも本当にプライベート
```

### 継承と抽象クラス

```typescript
// 抽象クラス（Java の abstract class と同じ）
abstract class Shape {
    abstract area(): number;     // 抽象メソッド（実装は派生クラスに）
    abstract perimeter(): number;

    // 共通の実装を持てる
    describe(): string {
        return `面積: ${this.area().toFixed(2)}, 周長: ${this.perimeter().toFixed(2)}`;
    }
}

class Circle extends Shape {
    constructor(private radius: number) {
        super();  // Java と同じく super() が必要
    }

    area(): number {
        return Math.PI * this.radius ** 2;
    }

    perimeter(): number {
        return 2 * Math.PI * this.radius;
    }
}

class Rectangle extends Shape {
    constructor(private width: number, private height: number) {
        super();
    }

    area(): number {
        return this.width * this.height;
    }

    perimeter(): number {
        return 2 * (this.width + this.height);
    }
}

// 多態性（Java と同じように動作）
const shapes: Shape[] = [new Circle(5), new Rectangle(4, 6)];
shapes.forEach(shape => console.log(shape.describe()));
```

### static メンバ

```typescript
class Counter {
    private static count: number = 0;  // クラス変数（Javaの static と同じ）

    private id: number;

    constructor() {
        Counter.count++;
        this.id = Counter.count;
    }

    getId(): number {
        return this.id;
    }

    static getCount(): number {    // クラスメソッド
        return Counter.count;
    }

    static reset(): void {
        Counter.count = 0;
    }
}

const c1 = new Counter();  // count: 1
const c2 = new Counter();  // count: 2
console.log(Counter.getCount()); // 2
```

### Reactではクラスをほぼ使わない理由

```typescript
// ======= React クラスコンポーネント（旧スタイル）=======
class OldButton extends React.Component<{ label: string }, { clicked: boolean }> {
    state = { clicked: false };

    handleClick = () => {
        this.setState({ clicked: true });  // this の束縛が必要
    };

    render() {
        return (
            <button onClick={this.handleClick}>
                {this.props.label}
            </button>
        );
    }
}

// ======= React 関数コンポーネント（現在の主流）=======
function NewButton({ label }: { label: string }) {
    const [clicked, setClicked] = React.useState(false);

    const handleClick = () => {
        setClicked(true);  // this が不要
    };

    return <button onClick={handleClick}>{label}</button>;
}

// 関数コンポーネントが主流な理由:
// 1. コードが簡潔（this の管理が不要）
// 2. Hooks によって状態管理・副作用が直感的
// 3. テストが書きやすい
// 4. React 公式が関数コンポーネントを推奨
// 5. パフォーマンス最適化（React.memo, useMemo, useCallback）が容易

// クラスが現代のTypeScript/Reactで使われる場面:
// 1. Error Boundary（まだ関数コンポーネントで書けない）
// 2. 既存の legacy コード
// 3. クラスが自然な設計のバックエンドロジック（サービス層など）
```

---

## 9. モジュールシステム

### export と import の基本

```typescript
// ======= named export（推奨）=======
// math.ts
export function add(a: number, b: number): number {
    return a + b;
}

export function subtract(a: number, b: number): number {
    return a - b;
}

export const PI = 3.14159265;

export interface MathConfig {
    precision: number;
}

// まとめて export も可能
function multiply(a: number, b: number) { return a * b; }
function divide(a: number, b: number) { return a / b; }
export { multiply, divide };

// 別名で export
export { multiply as mul, divide as div };
```

```typescript
// ======= import（Java の import と比較）=======

// named import
import { add, subtract, PI } from "./math";

// 別名でimport（Java: import static の別名は不可）
import { add as sum, subtract as minus } from "./math";

// すべてをまとめてimport（名前空間として使用）
import * as Math from "./math";
Math.add(1, 2);
Math.PI;
```

```java
// Java の import との対比
import com.example.math.MathUtils;          // クラスのimport
import static com.example.math.MathUtils.*; // 静的メンバのimport
// Java には named export/import の概念がない
// 1クラス = 1ファイルが基本
```

```typescript
// ======= default export =======
// userService.ts
class UserService {
    async getUser(id: number): Promise<User> {
        return fetch(`/api/users/${id}`).then(r => r.json());
    }
}

export default UserService;  // デフォルトエクスポート

// import するとき（名前を自由につけられる）
import UserService from "./userService";    // そのまま
import MyUserService from "./userService"; // 別名もOK
```

### default export vs named export

```typescript
// named export の利点（推奨）:
// 1. import 時に名前の補完が効く
// 2. 複数を同ファイルからexportできる
// 3. リファクタリングで名前が変わっても追跡しやすい
// 4. re-export が簡単

// ファイル: src/utils/index.ts
export { formatDate } from "./formatDate";
export { formatCurrency } from "./formatCurrency";
export { validateEmail } from "./validate";
export type { FormattedDate } from "./formatDate";  // 型のみの re-export

// 使う側: src/components/Form.tsx
import { formatDate, validateEmail } from "../utils";

// default export の使い所:
// - React コンポーネント（慣習として使われることが多い）
// - クラスを1つだけエクスポートするファイル
// - ページコンポーネント（Next.js のルーティング）
```

### 型のみの import

```typescript
// import type: コンパイル後のJSに残らない型のimport
// パフォーマンス改善・循環依存の回避に有効

import type { User, UserRole } from "./types";
import type { ApiResponse } from "./api";

// 通常のimportと型のimportを混在させる場合
import { fetchUser } from "./api";              // 実装のimport
import type { FetchOptions } from "./api";      // 型のみのimport

// まとめて書く場合（TypeScript 4.5以降）
import { fetchUser, type FetchOptions, type User } from "./api";

// なぜ import type を使うのか:
// 1. バンドルサイズの最適化（型情報は実行時に不要）
// 2. 循環依存の防止（型だけを参照する場合）
// 3. コードの意図を明確にする
```

### 動的 import

```typescript
// 動的import: 実行時に必要になったときにモジュールを読み込む
// コード分割（Code Splitting）に使う

// 通常のimport（静的）: バンドル時にすべて含まれる
import { heavyFunction } from "./heavy-module";

// 動的import: 必要なときだけ読み込む
async function loadHeavyFeature(): Promise<void> {
    const module = await import("./heavy-module");  // 型: Promise<typeof import("./heavy-module")>
    module.heavyFunction();
}

// 実用例: ボタンクリック時に大きなライブラリを読み込む
async function handleExportClick(): Promise<void> {
    const { exportToPdf } = await import("./pdf-exporter");
    await exportToPdf(document.body);
}

// React での Code Splitting（React.lazy との組み合わせ）
const HeavyComponent = React.lazy(() => import("./HeavyComponent"));

// 動的importはWebpackやViteが自動的にチャンク分割を行う
```

### パス解決（相対パスとエイリアス）

```typescript
// 相対パス（シンプルだが深いネストで辛くなる）
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../../hooks/useAuth";
import { API_URL } from "../../../../config/constants";

// エイリアス（tsconfig.json の paths で設定）
// tsconfig.json:
// "paths": { "@/*": ["./src/*"] }

import { Button } from "@/components/ui/Button";   // すっきり！
import { useAuth } from "@/hooks/useAuth";
import { API_URL } from "@/config/constants";

// よく使うエイリアスパターン
// "@/..."        → src/
// "@components/" → src/components/
// "@hooks/"      → src/hooks/
// "@utils/"      → src/utils/
// "@types/"      → src/types/
```

---

## 10. 非同期処理

### コールバック → Promise → async/await の進化

```typescript
// ======= 第1世代: コールバック（jQuery時代）=======
// 「コールバック地獄」が問題だった

$.ajax({
    url: "/api/users/1",
    success: function(user) {
        $.ajax({
            url: `/api/posts?userId=${user.id}`,
            success: function(posts) {
                $.ajax({
                    url: `/api/comments?postId=${posts[0].id}`,
                    success: function(comments) {
                        console.log(comments);  // 3段ネスト！
                    },
                    error: function(err) { /* ... */ }
                });
            },
            error: function(err) { /* ... */ }
        });
    },
    error: function(err) { /* ... */ }
});

// ======= 第2世代: Promise =======
// フラットなチェーンで書ける

fetch("/api/users/1")
    .then(response => response.json())
    .then((user: User) => fetch(`/api/posts?userId=${user.id}`))
    .then(response => response.json())
    .then((posts: Post[]) => fetch(`/api/comments?postId=${posts[0].id}`))
    .then(response => response.json())
    .then((comments: Comment[]) => console.log(comments))
    .catch(error => console.error(error));

// ======= 第3世代: async/await（現在の主流）=======
// 同期処理のように書ける

async function loadComments(): Promise<Comment[]> {
    const userResponse = await fetch("/api/users/1");
    const user: User = await userResponse.json();

    const postsResponse = await fetch(`/api/posts?userId=${user.id}`);
    const posts: Post[] = await postsResponse.json();

    const commentsResponse = await fetch(`/api/comments?postId=${posts[0].id}`);
    const comments: Comment[] = await commentsResponse.json();

    return comments;
}
```

### Promise の型

```typescript
// Promise<T>: T型の値で解決されるPromise

// 明示的な型
const promise1: Promise<string> = new Promise((resolve, reject) => {
    setTimeout(() => resolve("完了"), 1000);
});

const promise2: Promise<User> = fetch("/api/users/1").then(r => r.json());

// async 関数は自動的に Promise<T> を返す
async function fetchUser(id: number): Promise<User> {
    const response = await fetch(`/api/users/${id}`);
    return response.json();  // Promise<User> を返す（明示不要）
}

// Promise.resolve / Promise.reject
const resolved = Promise.resolve<number>(42);  // Promise<number>
const rejected = Promise.reject<User>(new Error("失敗"));  // Promise<User>

// 非同期関数の型定義
type AsyncFn<T> = () => Promise<T>;
type AsyncFnWithArg<A, T> = (arg: A) => Promise<T>;

const loadUser: AsyncFnWithArg<number, User> = async (id) => {
    return fetch(`/api/users/${id}`).then(r => r.json());
};
```

### try/catch でのエラーハンドリング

```typescript
// async/await + try/catch（最も一般的なパターン）
async function fetchUserSafely(id: number): Promise<User | null> {
    try {
        const response = await fetch(`/api/users/${id}`);

        if (!response.ok) {
            throw new Error(`HTTPエラー: ${response.status}`);
        }

        return await response.json() as User;
    } catch (error) {
        // 注意: TypeScript では catch の error は unknown 型
        if (error instanceof Error) {
            console.error("フェッチエラー:", error.message);
        } else {
            console.error("不明なエラー:", error);
        }
        return null;
    } finally {
        // Java の finally と同じ: 成功・失敗どちらでも実行
        console.log("フェッチ処理完了");
    }
}

// カスタムエラークラス
class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public readonly endpoint: string,
    ) {
        super(message);
        this.name = "ApiError";  // Java の e.getClass().getName() に相当
    }
}

async function apiRequest<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new ApiError(response.status, response.statusText, url);
    }
    return response.json();
}

// エラーの種類で分岐
try {
    const user = await apiRequest<User>("/api/users/999");
} catch (error) {
    if (error instanceof ApiError) {
        if (error.statusCode === 404) {
            console.log("ユーザーが見つかりません");
        } else if (error.statusCode >= 500) {
            console.log("サーバーエラーです");
        }
    } else if (error instanceof TypeError) {
        console.log("ネットワークエラーです");
    }
}
```

### Promise.all と Promise.race

```typescript
// ======= Promise.all: すべて並列実行、全部完了を待つ =======
// Java の CompletableFuture.allOf() に相当

async function loadDashboard(userId: number): Promise<void> {
    // 3つのAPIを並列で叩く（逐次より速い）
    const [user, posts, notifications] = await Promise.all([
        fetch(`/api/users/${userId}`).then(r => r.json() as Promise<User>),
        fetch(`/api/posts?userId=${userId}`).then(r => r.json() as Promise<Post[]>),
        fetch(`/api/notifications?userId=${userId}`).then(r => r.json() as Promise<Notification[]>),
    ]);
    // 1つでもエラーなら全体がreject

    console.log(user, posts, notifications);
}

// Promise.allSettled: 全部完了を待つが、個別の成否を確認できる
const results = await Promise.allSettled([
    fetch("/api/users/1").then(r => r.json()),
    fetch("/api/users/999").then(r => r.json()),  // 存在しないユーザー
]);

results.forEach(result => {
    if (result.status === "fulfilled") {
        console.log("成功:", result.value);
    } else {
        console.log("失敗:", result.reason);
    }
});

// ======= Promise.race: 最初に完了したものを使う =======
// タイムアウト処理によく使う

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`タイムアウト: ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
}

const user = await withTimeout(fetchUser(1), 5000);  // 5秒でタイムアウト

// ======= Promise.any: 最初に成功したものを使う =======
// 複数のAPIエンドポイントのフォールバック
const data = await Promise.any([
    fetch("https://api1.example.com/data").then(r => r.json()),
    fetch("https://api2.example.com/data").then(r => r.json()),
    fetch("https://api3.example.com/data").then(r => r.json()),
]);
// 最初に成功したレスポンスを使う（他は無視）
```

### Java の CompletableFuture との対比

| 操作                        | Java                                          | TypeScript                              |
|-----------------------------|-----------------------------------------------|-----------------------------------------|
| 非同期値の作成              | `CompletableFuture.supplyAsync(() -> ...)` | `new Promise((resolve) => ...)` |
| 変換                        | `.thenApply(v -> ...)`                    | `.then(v => ...)`                  |
| 副作用                      | `.thenAccept(v -> ...)`                   | `.then(v => { ... })`              |
| エラー処理                  | `.exceptionally(e -> ...)`                | `.catch(e => ...)`                 |
| 完了処理                    | `.whenComplete((v, e) -> ...)`            | `.finally(() => ...)`              |
| 並列実行・全完了待ち        | `CompletableFuture.allOf(...)`            | `Promise.all([...])`               |
| 最初の完了を使う            | `CompletableFuture.anyOf(...)`            | `Promise.race([...])`              |
| 同期的に取得                | `.get()`（ブロッキング）                  | `await`（ノンブロッキング）        |

---

## 11. 型アサーションと型ガード

### as によるアサーション

```typescript
// as: コンパイラへの「この型だと思え」という指示
// Java のキャストに相当するが、実行時の変換は行わない（型情報のみ）

const data: unknown = fetchData();
const user = data as User;  // TypeScript: 型アサーション
// Java: User user = (User) data;  // 実行時の型チェックを行う

// 注意: as は型チェックを強制的にスキップする危険なもの
// 誤った型を指定すると実行時エラーの原因になる

// 安全な使い方の例（自分で型チェックを行った後）
const rawData: unknown = JSON.parse(jsonString);
if (isUser(rawData)) {           // 型ガードで確認
    const user = rawData as User;  // ここは安全
}

// より安全: as を使わず型ガードだけで絞り込む
if (isUser(rawData)) {
    console.log(rawData.name);  // rawData はここで User 型に絞られる
}

// DOM 操作での一般的な使用例
const input = document.getElementById("username") as HTMLInputElement;
input.value = "Alice";  // Element 型では value がないが、HTMLInputElement にはある

// const assertion（as const）: 型をリテラル型に絞る
const config = {
    url: "https://api.example.com",
    method: "GET",
    timeout: 5000,
} as const;
// config.method の型: "GET"（string ではなく）
// config.timeout の型: 5000（number ではなく）
```

### 非nullアサーション演算子（!）

```typescript
// ! : この値はnullでもundefinedでもないことをコンパイラに伝える
// strictNullChecks が有効なとき、null/undefined の可能性がある型に使う

// NG: エラーになる（nullの可能性があるため）
const el = document.getElementById("app");
el.innerHTML = "Hello";  // エラー: el は null かもしれない

// OK1: null チェック（安全）
if (el !== null) {
    el.innerHTML = "Hello";  // ここでは null でないことが保証される
}

// OK2: 非nullアサーション（危険だが簡潔）
const el2 = document.getElementById("app")!;  // null でないと断言
el2.innerHTML = "Hello";  // エラーなし（でも本当にnullだと実行時エラー）

// OK3: オプショナルチェーン（最も安全）
document.getElementById("app")?.innerHTML; // null なら undefined を返す

// 非nullアサーションを使うべき場面:
// - DOM要素が必ず存在すると確信できるとき
// - 他のコードで null チェックを行っているが TypeScript が追跡できないとき
// - テスト環境でのモックなど

// 使うべきでない場面:
// - null になり得る値（バグの原因になる）
// - API レスポンスなど外部からのデータ
```

### ユーザー定義型ガード（is キーワード）

```typescript
// 型ガード関数: 戻り値型に "value is Type" を使う
function isString(value: unknown): value is string {
    return typeof value === "string";
}

function isNumber(value: unknown): value is number {
    return typeof value === "number" && !isNaN(value);
}

// オブジェクトの型ガード
interface User {
    id: number;
    name: string;
    email: string;
}

function isUser(value: unknown): value is User {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof (value as any).id === "number" &&
        typeof (value as any).name === "string" &&
        typeof (value as any).email === "string"
    );
}

// 配列の型ガード
function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(item => typeof item === "string");
}

// 型ガードの使用
const apiResponse: unknown = await fetch("/api/user").then(r => r.json());

if (isUser(apiResponse)) {
    // ここでは apiResponse は User 型として扱われる
    console.log(apiResponse.name);  // OK
    console.log(apiResponse.email); // OK
}

// タグ付きユニオンの型ガード
type SuccessResult = { status: "success"; data: User };
type ErrorResult = { status: "error"; message: string };
type Result = SuccessResult | ErrorResult;

function isSuccess(result: Result): result is SuccessResult {
    return result.status === "success";
}

const result: Result = await fetchUser(1);
if (isSuccess(result)) {
    console.log(result.data.name);    // OK: SuccessResult
} else {
    console.log(result.message);     // OK: ErrorResult
}
```

### satisfies 演算子（TypeScript 4.9以降）

```typescript
// satisfies: 型を満たしていることを確認しつつ、型推論の精度を保つ

// 問題: as const を使うと型が厳しすぎる
const palette1 = {
    red: [255, 0, 0],
    green: "#00ff00",
    blue: [0, 0, 255],
} as const;
// palette1.red は readonly [255, 0, 0] → toUpperCase() が使えない

// 問題: 型注釈だと型が広すぎる
type ColorMap = Record<string, string | number[]>;
const palette2: ColorMap = {
    red: [255, 0, 0],
    green: "#00ff00",
    blue: [0, 0, 255],
};
// palette2.red は string | number[] → 配列メソッドが使えない

// 解決: satisfies で型チェックしつつ、推論された型を保持
const palette3 = {
    red: [255, 0, 0],
    green: "#00ff00",
    blue: [0, 0, 255],
} satisfies Record<string, string | number[]>;

// palette3.green は string 型（推論される）→ toUpperCase() が使える！
palette3.green.toUpperCase();  // OK

// palette3.red は number[] 型（推論される）
palette3.red.map(v => v * 2);  // OK

// 実用例: 設定オブジェクトの型チェック
interface AppConfig {
    apiUrl: string;
    timeout: number;
    features: Record<string, boolean>;
}

const config = {
    apiUrl: "https://api.example.com",
    timeout: 5000,
    features: {
        darkMode: true,
        betaFeatures: false,
    },
    // extra: "invalid",  // エラー: AppConfig に extra は存在しない
} satisfies AppConfig;

// config.apiUrl は string 型（string | undefined ではない）
// config.features.darkMode は boolean 型として推論される
```

---

## 12. 実践パターン

### 列挙型の代替（const object + typeof）

```typescript
// ======= TypeScript の enum（問題がある）=======
enum Direction {
    North = "NORTH",
    South = "SOUTH",
    East = "EAST",
    West = "WEST",
}
// 問題1: コンパイル後のJSに余分なコードが生成される
// 問題2: const enum は使い方によってバグが出る

// ======= 推奨: const object + typeof =======
const Direction = {
    North: "NORTH",
    South: "SOUTH",
    East: "EAST",
    West: "WEST",
} as const;

// 型の取り出し方
type Direction = typeof Direction[keyof typeof Direction];
// "NORTH" | "SOUTH" | "EAST" | "WEST"

// 使用例（enum とほぼ同じように使える）
function move(direction: Direction): void {
    console.log(`Moving ${direction}`);
}

move(Direction.North);  // OK: "NORTH"
move("NORTH");          // OK: リテラル型なのでこれもOK
// move("LEFT");        // エラー

// ======= 実践例: API エンドポイント =======
const ApiEndpoint = {
    Users: "/api/users",
    Posts: "/api/posts",
    Comments: "/api/comments",
} as const;

type ApiEndpoint = typeof ApiEndpoint[keyof typeof ApiEndpoint];

// ======= Java の enum との対比 =======
// Java:
// public enum Status { ACTIVE, INACTIVE, PENDING }
// Status.ACTIVE.name() → "ACTIVE"
// Status.valueOf("ACTIVE") → Status.ACTIVE

// TypeScript:
const Status = { Active: "ACTIVE", Inactive: "INACTIVE", Pending: "PENDING" } as const;
type Status = typeof Status[keyof typeof Status];
// "ACTIVE" から型を得る場合:
const statusFromString = (s: string): Status | undefined => {
    return Object.values(Status).find(v => v === s) as Status | undefined;
};
```

### 条件付き型（Conditional Types）

```typescript
// 条件付き型: T extends U ? X : Y
// 「T が U を拡張するなら X、そうでなければ Y」

// 基本形
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;   // true
type B = IsString<number>;   // false
type C = IsString<"hello">;  // true（"hello" は string を拡張）

// 実用例: 配列なら要素型を、そうでなければそのままを返す
type Flatten<T> = T extends Array<infer Item> ? Item : T;

type Str = Flatten<string[]>;     // string
type Num = Flatten<number>;       // number
type Nested = Flatten<string[][]>; // string[]（一段だけ）

// NonNullable の実装（組み込みの NonNullable はこう実装されている）
type MyNonNullable<T> = T extends null | undefined ? never : T;

type SafeString = MyNonNullable<string | null | undefined>; // string

// ユニオン型への分配（Distributive Conditional Types）
// T がユニオン型のとき、条件付き型は各メンバーに適用される
type ToArray<T> = T extends any ? T[] : never;

type StrOrNumArr = ToArray<string | number>;
// string[] | number[]（分配される）

// 分配を防ぎたいとき: [] で囲む
type ToArrayNoDistribute<T> = [T] extends [any] ? T[] : never;
type Combined = ToArrayNoDistribute<string | number>;
// (string | number)[]（分配されない）
```

### テンプレートリテラル型

```typescript
// 型レベルでの文字列操作（TypeScript 4.1以降）

// 基本形
type Greeting = `Hello, ${string}!`;
const g: Greeting = "Hello, World!";  // OK
// const ng: Greeting = "Hi, World!"; // エラー

// ユニオン型との組み合わせ（強力！）
type EventName = "click" | "focus" | "blur" | "change";
type HandlerName = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur" | "onChange"

type CSSProperty = "margin" | "padding";
type CSSDirection = "Top" | "Right" | "Bottom" | "Left";
type CSSPropertyWithDirection = `${CSSProperty}${CSSDirection}`;
// "marginTop" | "marginRight" | ... | "paddingLeft"（8種類）

// 実用例: イベントハンドラの型定義
type DOMEventMap = {
    [K in EventName as `on${Capitalize<K>}`]: (event: Event) => void;
};
// { onClick: ...; onFocus: ...; onBlur: ...; onChange: ... }

// APIエンドポイントの型安全な構築
type ApiVersion = "v1" | "v2";
type Resource = "users" | "posts" | "comments";
type ApiPath = `/api/${ApiVersion}/${Resource}`;
// "/api/v1/users" | "/api/v1/posts" | ... (6種類)

// 組み込みの文字列操作型
type Upper = Uppercase<"hello">;         // "HELLO"
type Lower = Lowercase<"HELLO">;         // "hello"
type Cap = Capitalize<"hello">;          // "Hello"
type Uncap = Uncapitalize<"Hello">;      // "hello"
```

### infer キーワード（応用）

```typescript
// infer: 条件付き型の中で型変数を抽出する

// 関数の戻り値型を抽出（組み込みの ReturnType の実装）
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser(): User { return { id: 1, name: "Alice", email: "", age: 30, role: "user" }; }
type UserType = MyReturnType<typeof getUser>;  // User

// Promiseの解決型を抽出
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type ResolvedUser = UnwrapPromise<Promise<User>>;  // User
type PlainString = UnwrapPromise<string>;           // string

// 配列の要素型を抽出
type ArrayElement<T> = T extends (infer E)[] ? E : never;

type Element = ArrayElement<string[]>;  // string
type Numbers = ArrayElement<number[]>; // number

// 関数のパラメータ型を抽出（組み込みの Parameters の実装）
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

function createPost(title: string, body: string, tags: string[]): Post {
    return { id: 1, title, body, tags };
}
type CreatePostParams = MyParameters<typeof createPost>;
// [title: string, body: string, tags: string[]]

// 実用例: Eventオブジェクトの型を抽出
type EventOf<T> = T extends (event: infer E) => void ? E : never;

const clickHandler = (event: MouseEvent) => {};
type ClickEventType = EventOf<typeof clickHandler>;  // MouseEvent
```

### 本プロジェクトでの型定義の実例解説

このプロジェクト（IPA単語帳PWA）では以下のような型定義を使っている。

```typescript
// src/types/index.ts

// ======= ドメインモデル =======
export interface Term {
    id: number;
    url: string;
    name: string;
    description: string;
    tags?: string[];           // オプショナル: タグ
    difficulty?: 1 | 2 | 3;   // リテラル型: 難易度（1〜3のみ）
    createdAt?: string;        // ISO8601 形式の日付文字列
}

// 単語帳の表示状態（タグ付きユニオン）
export type CardState =
    | { phase: "question"; term: Term }
    | { phase: "answer"; term: Term; isCorrect: boolean | null }
    | { phase: "completed"; correctCount: number; total: number };

// ======= API 通信 =======
export interface ApiResponse<T> {
    data: T;
    total?: number;
    page?: number;
}

// 検索パラメータ（Partial を使って柔軟に）
export type SearchParams = Partial<{
    query: string;
    tags: string[];
    difficulty: 1 | 2 | 3;
    page: number;
    pageSize: number;
}>;

// ======= コンポーネントのProps =======
export interface TermCardProps {
    term: Term;
    state: CardState;
    onCorrect: () => void;
    onIncorrect: () => void;
    onNext: () => void;
}

// ======= 設定 =======
const APP_CONFIG = {
    apiBaseUrl: process.env.REACT_APP_API_URL ?? "https://api.example.com",
    itemsPerPage: 20,
    supportedTags: ["アルゴリズム", "データベース", "ネットワーク", "セキュリティ"] as const,
} as const;

type SupportedTag = typeof APP_CONFIG.supportedTags[number];
// "アルゴリズム" | "データベース" | "ネットワーク" | "セキュリティ"

// ======= カスタムフック =======
// useTerms フックの戻り値型（ReturnType を使って自動生成も可）
export interface UseTermsReturn {
    terms: Term[];
    isLoading: boolean;
    error: Error | null;
    searchParams: SearchParams;
    setSearchParams: (params: SearchParams) => void;
    refresh: () => Promise<void>;
}
```

### 実践的なパターン集

```typescript
// ======= パターン1: Null Object Pattern =======
// null チェックを減らす

const NULL_USER: Readonly<User> = {
    id: -1,
    name: "ゲスト",
    email: "",
    age: 0,
    role: "guest",
} as const;

function getCurrentUser(): User {
    const stored = localStorage.getItem("user");
    if (!stored) return NULL_USER;
    return JSON.parse(stored) as User;
}

// ======= パターン2: Builder パターン =======
class QueryBuilder<T> {
    private conditions: Partial<T> = {};

    where<K extends keyof T>(key: K, value: T[K]): QueryBuilder<T> {
        this.conditions[key] = value;
        return this;  // メソッドチェーン
    }

    build(): Partial<T> {
        return { ...this.conditions };
    }
}

const query = new QueryBuilder<User>()
    .where("role", "admin")
    .where("age", 25)
    .build();
// { role: "admin", age: 25 }

// ======= パターン3: Event Emitter の型安全版 =======
type EventMap = {
    userLogin: { userId: number; timestamp: Date };
    userLogout: { userId: number };
    dataUpdated: { resource: string; id: number };
};

class TypedEventEmitter<T extends Record<string, unknown>> {
    private listeners = new Map<keyof T, Set<Function>>();

    on<K extends keyof T>(event: K, listener: (data: T[K]) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
    }

    emit<K extends keyof T>(event: K, data: T[K]): void {
        this.listeners.get(event)?.forEach(listener => listener(data));
    }
}

const emitter = new TypedEventEmitter<EventMap>();
emitter.on("userLogin", ({ userId, timestamp }) => {
    // userId: number, timestamp: Date として推論される
    console.log(`ユーザー ${userId} がログイン: ${timestamp}`);
});
emitter.emit("userLogin", { userId: 1, timestamp: new Date() }); // OK
// emitter.emit("userLogin", { userId: "string" }); // エラー: userId は number

// ======= パターン4: 型安全なローカルストレージ =======
class TypedStorage<T extends Record<string, unknown>> {
    get<K extends keyof T>(key: K): T[K] | null {
        const item = localStorage.getItem(String(key));
        return item ? JSON.parse(item) as T[K] : null;
    }

    set<K extends keyof T>(key: K, value: T[K]): void {
        localStorage.setItem(String(key), JSON.stringify(value));
    }

    remove<K extends keyof T>(key: K): void {
        localStorage.removeItem(String(key));
    }
}

type AppStorage = {
    user: User;
    theme: "light" | "dark";
    lastVisited: string;
};

const storage = new TypedStorage<AppStorage>();
storage.set("theme", "dark");        // OK
// storage.set("theme", "blue");     // エラー: "blue" は有効な値ではない
const theme = storage.get("theme");  // "light" | "dark" | null
```

---

## まとめ: Java エンジニアが覚えるべき重要ポイント

### TypeScript で特に注意すべき概念

| 概念                         | Java との違い                                          |
|------------------------------|--------------------------------------------------------|
| 型の消去                     | 実行時には型情報が消える（Javaはジェネリクスも消える点は同じ） |
| 構造的型付け                 | 形が合えば型が違っても代入できる（Javaは名前的型付け）  |
| null / undefined             | `strictNullChecks` で厳密化しないと危険               |
| ユニオン型                   | Javaにない概念。オーバーロードや instanceof の代替として活用 |
| 型ガード                     | `instanceof`はJavaと同じ。`typeof`や`in`はTypeScript特有 |
| any vs unknown               | `any`は極力使わず`unknown`を使う                       |
| const assertion (`as const`) | オブジェクトをイミュータブルにし、型をリテラル型にする  |
| Utility Types                | `Partial`, `Pick`, `Omit`などを積極的に活用            |

### 段階的な学習パス

1. **基礎**: string, number, boolean の型付け → interface → 型推論
2. **中級**: ユニオン型 → 型の絞り込み → ジェネリクス → Utility Types
3. **上級**: 条件付き型 → infer → テンプレートリテラル型 → satisfies

### 実際のプロジェクトでのベストプラクティス

```typescript
// 1. strict: true を必ず有効に
// 2. any の代わりに unknown を使う
// 3. 型ガードで安全に型を絞り込む
// 4. Utility Types を積極的に活用する（Partial, Pick, Omit）
// 5. as const で定数オブジェクトをイミュータブルに
// 6. import type で型のみのインポートを明示する
// 7. タグ付きユニオンで状態を表現する
// 8. never で網羅性チェックを行う
```

---

*参考: TypeScript 公式ドキュメント https://www.typescriptlang.org/docs/*
*参考: TypeScript Playground https://www.typescriptlang.org/play*
