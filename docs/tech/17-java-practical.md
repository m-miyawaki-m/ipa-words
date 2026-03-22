# Java基礎 学び直しガイド — 実践・設計編

> 対象読者: Java の基礎文法を理解しており、実務での設計・開発スキルを身につけたいエンジニア
> レベル: 初級〜中級
> 前提: 「言語基礎編」「モダンJava編」の内容を理解していること

---

## 目次

1. [設計原則](#1-設計原則)
2. [デザインパターン（よく使うもの）](#2-デザインパターンよく使うもの)
3. [テスト（JUnit 5）](#3-テストjunit-5)
4. [ビルドツール](#4-ビルドツール)
5. [データベースアクセス](#5-データベースアクセス)
6. [Web開発の基礎](#6-web開発の基礎)
7. [並行処理](#7-並行処理)
8. [実務のベストプラクティス](#8-実務のベストプラクティス)

---

## 1. 設計原則

### 1.1 SOLID 原則

SOLID は、オブジェクト指向設計において保守性・拡張性の高いコードを書くための5つの原則。

#### Single Responsibility Principle（単一責任の原則）

> クラスを変更する理由は1つだけであるべき

```java
// NG: 複数の責任を持つクラス
public class UserService {
    public void registerUser(String name, String email) {
        // バリデーション
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (!email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }

        // データベース保存
        try (var conn = DriverManager.getConnection(DB_URL)) {
            var stmt = conn.prepareStatement(
                "INSERT INTO users (name, email) VALUES (?, ?)"
            );
            stmt.setString(1, name);
            stmt.setString(2, email);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }

        // メール送信
        var props = new Properties();
        props.put("mail.smtp.host", "smtp.example.com");
        var session = Session.getInstance(props);
        var message = new MimeMessage(session);
        // ... メール送信ロジック
    }
}

// OK: 責任を分離
public class UserValidator {
    public void validate(String name, String email) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }
        if (!email.contains("@")) {
            throw new IllegalArgumentException("Invalid email");
        }
    }
}

public class UserRepository {
    public void save(User user) {
        // データベース保存のみ
    }
}

public class EmailService {
    public void sendWelcomeEmail(String email) {
        // メール送信のみ
    }
}

public class UserService {
    private final UserValidator validator;
    private final UserRepository repository;
    private final EmailService emailService;

    public UserService(UserValidator validator, UserRepository repository,
                       EmailService emailService) {
        this.validator = validator;
        this.repository = repository;
        this.emailService = emailService;
    }

    public void registerUser(String name, String email) {
        validator.validate(name, email);
        var user = new User(name, email);
        repository.save(user);
        emailService.sendWelcomeEmail(email);
    }
}
```

#### Open/Closed Principle（開放/閉鎖の原則）

> ソフトウェアのエンティティは拡張に対して開かれ、修正に対して閉じているべき

```java
// NG: 新しい図形を追加するたびに既存コードを修正する必要がある
public class AreaCalculator {
    public double calculateArea(Object shape) {
        if (shape instanceof Circle c) {
            return Math.PI * c.radius() * c.radius();
        } else if (shape instanceof Rectangle r) {
            return r.width() * r.height();
        }
        // 新しい図形を追加するたびにここに else if を追加...
        throw new IllegalArgumentException("Unknown shape");
    }
}

// OK: 新しい図形を追加しても既存コードを変更しない
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}

public record Circle(double radius) implements Shape {
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

public record Triangle(double base, double height) implements Shape {
    @Override
    public double area() {
        return 0.5 * base * height;
    }
}

// 新しい図形を追加する場合:
// 1. sealed の permits に追加
// 2. 新しい record/class を定義
// 3. area() を実装
// → AreaCalculator のような既存コードを変更する必要がない
public class AreaCalculator {
    public double totalArea(List<Shape> shapes) {
        return shapes.stream()
            .mapToDouble(Shape::area)
            .sum();
    }
}
```

#### Liskov Substitution Principle（リスコフの置換原則）

> サブクラスはスーパークラスの代わりに使えなければならない

```java
// NG: 正方形は長方形のサブクラスとして不適切
public class RectangleMutable {
    protected int width;
    protected int height;

    public void setWidth(int width) { this.width = width; }
    public void setHeight(int height) { this.height = height; }
    public int area() { return width * height; }
}

public class Square extends RectangleMutable {
    @Override
    public void setWidth(int width) {
        this.width = width;
        this.height = width;  // 正方形なので height も変える
    }

    @Override
    public void setHeight(int height) {
        this.width = height;  // 正方形なので width も変える
        this.height = height;
    }
}

// テストが壊れる
void testArea(RectangleMutable rect) {
    rect.setWidth(5);
    rect.setHeight(4);
    assert rect.area() == 20;  // Square の場合 16 になる! LSP 違反
}

// OK: イミュータブルにして問題を回避
public sealed interface Shape permits Rectangle2, Square2 {
    int area();
}

public record Rectangle2(int width, int height) implements Shape {
    @Override
    public int area() { return width * height; }
}

public record Square2(int side) implements Shape {
    @Override
    public int area() { return side * side; }
}
```

#### Interface Segregation Principle（インターフェース分離の原則）

> クライアントが使わないメソッドへの依存を強制しない

```java
// NG: 巨大なインターフェース
public interface Worker {
    void work();
    void eat();
    void sleep();
    void code();
    void attendMeeting();
}

// Robot は eat() や sleep() を実装する必要がある
public class Robot implements Worker {
    @Override public void work() { /* OK */ }
    @Override public void eat() { /* 不要なのに実装必須 */ }
    @Override public void sleep() { /* 不要なのに実装必須 */ }
    @Override public void code() { /* OK */ }
    @Override public void attendMeeting() { /* 不要なのに実装必須 */ }
}

// OK: インターフェースを分離
public interface Workable {
    void work();
}

public interface Eatable {
    void eat();
}

public interface Sleepable {
    void sleep();
}

public interface Codeable {
    void code();
}

// 必要なインターフェースだけ実装
public class HumanWorker implements Workable, Eatable, Sleepable, Codeable {
    @Override public void work() { /* ... */ }
    @Override public void eat() { /* ... */ }
    @Override public void sleep() { /* ... */ }
    @Override public void code() { /* ... */ }
}

public class RobotWorker implements Workable, Codeable {
    @Override public void work() { /* ... */ }
    @Override public void code() { /* ... */ }
}
```

#### Dependency Inversion Principle（依存性逆転の原則）

> 上位モジュールは下位モジュールに依存すべきでない。両方とも抽象に依存すべき。

```java
// NG: 上位モジュールが下位モジュールの具体クラスに依存
public class OrderService {
    private final MySqlOrderRepository repository = new MySqlOrderRepository();
    private final SmtpEmailSender emailSender = new SmtpEmailSender();

    public void placeOrder(Order order) {
        repository.save(order);
        emailSender.send(order.getCustomerEmail(), "Order placed!");
    }
}

// OK: 抽象（インターフェース）に依存
public interface OrderRepository {
    void save(Order order);
    Optional<Order> findById(String id);
}

public interface NotificationService {
    void notify(String recipient, String message);
}

public class OrderService {
    private final OrderRepository repository;       // 抽象に依存
    private final NotificationService notification;  // 抽象に依存

    // コンストラクタ・インジェクション
    public OrderService(OrderRepository repository,
                        NotificationService notification) {
        this.repository = repository;
        this.notification = notification;
    }

    public void placeOrder(Order order) {
        repository.save(order);
        notification.notify(order.getCustomerEmail(), "Order placed!");
    }
}

// 具体的な実装
public class MySqlOrderRepository implements OrderRepository {
    @Override public void save(Order order) { /* MySQL に保存 */ }
    @Override public Optional<Order> findById(String id) { /* ... */ }
}

public class EmailNotificationService implements NotificationService {
    @Override public void notify(String recipient, String message) { /* メール送信 */ }
}

// テスト時はモックを注入できる
var mockRepo = mock(OrderRepository.class);
var mockNotification = mock(NotificationService.class);
var service = new OrderService(mockRepo, mockNotification);
```

### 1.2 DRY, KISS, YAGNI

```java
// === DRY (Don't Repeat Yourself) ===
// 同じロジックを2箇所以上に書かない

// NG
public double calculateEmployeeTax(double salary) {
    if (salary <= 195_0000) return salary * 0.05;
    if (salary <= 330_0000) return salary * 0.10;
    if (salary <= 695_0000) return salary * 0.20;
    return salary * 0.23;
}

public double calculateFreelancerTax(double income) {
    // 同じ税率計算ロジックが重複!
    if (income <= 195_0000) return income * 0.05;
    if (income <= 330_0000) return income * 0.10;
    if (income <= 695_0000) return income * 0.20;
    return income * 0.23;
}

// OK
public double calculateIncomeTax(double income) {
    if (income <= 195_0000) return income * 0.05;
    if (income <= 330_0000) return income * 0.10;
    if (income <= 695_0000) return income * 0.20;
    return income * 0.23;
}

// === KISS (Keep It Simple, Stupid) ===
// 必要以上に複雑にしない

// NG: 過剰に汎用化
public <T, R, E extends Exception> R executeWithRetry(
    ThrowingFunction<T, R, E> function, T input,
    int maxRetries, Duration delay,
    Predicate<E> retryCondition,
    Consumer<E> onRetry) throws E { /* ... */ }

// OK: 実際に必要な範囲で
public String fetchData(String url) {
    for (int i = 0; i < 3; i++) {
        try {
            return httpClient.get(url);
        } catch (IOException e) {
            if (i == 2) throw new RuntimeException("Failed after 3 retries", e);
            try { Thread.sleep(1000); } catch (InterruptedException ie) { break; }
        }
    }
    throw new RuntimeException("Unreachable");
}

// === YAGNI (You Aren't Gonna Need It) ===
// 今必要でない機能を先に作らない

// NG: まだ使わないのに汎用的なプラグインシステムを作る
public interface Plugin { /* ... */ }
public class PluginManager { /* ... */ }
public class PluginLoader { /* ... */ }
public class PluginRegistry { /* ... */ }

// OK: 今必要な機能だけ作る
// 将来プラグインが必要になったらその時に設計する
```

### 1.3 凝集度と結合度

```java
// === 凝集度（Cohesion）: 高い方がよい ===
// クラス内のメソッドやフィールドがどれだけ関連しているか

// 低い凝集度（NG）: 関係のない機能が混在
public class Utility {
    public static String formatDate(LocalDate date) { /* ... */ }
    public static double calculateTax(double amount) { /* ... */ }
    public static String sanitizeHtml(String html) { /* ... */ }
    public static boolean isValidEmail(String email) { /* ... */ }
}

// 高い凝集度（OK）: 関連する機能がまとまっている
public class DateFormatter {
    public String formatJapanese(LocalDate date) { /* 2026年3月23日 */ }
    public String formatIso(LocalDate date) { /* 2026-03-23 */ }
    public String formatRelative(LocalDate date) { /* 3日前 */ }
}

public class TaxCalculator {
    public double calculateIncomeTax(double income) { /* ... */ }
    public double calculateConsumptionTax(double amount) { /* ... */ }
}

// === 結合度（Coupling）: 低い方がよい ===
// クラス間の依存関係の強さ

// 高い結合度（NG）: 具体クラスに直接依存
public class ReportService {
    private final MySqlDatabase database = new MySqlDatabase();
    private final PdfGenerator pdfGenerator = new PdfGenerator();

    public byte[] generateReport() {
        var data = database.query("SELECT * FROM sales");
        return pdfGenerator.generate(data);
    }
}

// 低い結合度（OK）: インターフェースを介して依存
public class ReportService {
    private final DataSource dataSource;     // インターフェース
    private final ReportGenerator generator;  // インターフェース

    public ReportService(DataSource dataSource, ReportGenerator generator) {
        this.dataSource = dataSource;
        this.generator = generator;
    }

    public byte[] generateReport() {
        var data = dataSource.fetchSalesData();
        return generator.generate(data);
    }
}
```

---

## 2. デザインパターン（よく使うもの）

### 2.1 生成パターン

#### Singleton

```java
// === Singleton: インスタンスが1つだけであることを保証する ===

// 方法1: enum（最も推奨）
public enum DatabaseConnection {
    INSTANCE;

    private final Connection connection;

    DatabaseConnection() {
        try {
            this.connection = DriverManager.getConnection("jdbc:h2:mem:test");
        } catch (SQLException e) {
            throw new RuntimeException(e);
        }
    }

    public Connection getConnection() {
        return connection;
    }
}
// 使い方: DatabaseConnection.INSTANCE.getConnection()

// 方法2: static final + private コンストラクタ
public class AppConfig {
    private static final AppConfig INSTANCE = new AppConfig();

    private final Map<String, String> settings;

    private AppConfig() {
        this.settings = loadSettings();
    }

    public static AppConfig getInstance() {
        return INSTANCE;
    }

    public String get(String key) {
        return settings.get(key);
    }

    private Map<String, String> loadSettings() {
        // 設定ファイルの読み込み
        return Map.of("app.name", "MyApp", "app.version", "1.0");
    }
}

// 注意: Singleton はテストしにくいため、
// DI（依存性注入）でスコープを管理する方が推奨される
```

#### Factory Method

```java
// === Factory Method: オブジェクト生成をサブクラスに委譲する ===

// 通知の種類に応じた生成
public sealed interface Notification permits EmailNotification, SmsNotification, PushNotification {
    void send(String recipient, String message);
}

public record EmailNotification(String smtpServer) implements Notification {
    @Override
    public void send(String recipient, String message) {
        System.out.println("Email to " + recipient + ": " + message);
    }
}

public record SmsNotification(String apiKey) implements Notification {
    @Override
    public void send(String recipient, String message) {
        System.out.println("SMS to " + recipient + ": " + message);
    }
}

public record PushNotification(String appId) implements Notification {
    @Override
    public void send(String recipient, String message) {
        System.out.println("Push to " + recipient + ": " + message);
    }
}

// ファクトリ
public class NotificationFactory {
    public static Notification create(String type) {
        return switch (type.toLowerCase()) {
            case "email" -> new EmailNotification("smtp.example.com");
            case "sms"   -> new SmsNotification("api-key-123");
            case "push"  -> new PushNotification("app-id-456");
            default      -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}

// 使い方
Notification notification = NotificationFactory.create("email");
notification.send("alice@example.com", "Hello!");
```

#### Builder

```java
// === Builder: 複雑なオブジェクトを段階的に構築する ===

public class HttpRequestConfig {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final Duration timeout;
    private final int maxRetries;

    private HttpRequestConfig(Builder builder) {
        this.url = builder.url;
        this.method = builder.method;
        this.headers = Map.copyOf(builder.headers);
        this.body = builder.body;
        this.timeout = builder.timeout;
        this.maxRetries = builder.maxRetries;
    }

    // Getter methods
    public String getUrl() { return url; }
    public String getMethod() { return method; }
    public Map<String, String> getHeaders() { return headers; }
    public String getBody() { return body; }
    public Duration getTimeout() { return timeout; }
    public int getMaxRetries() { return maxRetries; }

    public static Builder builder(String url) {
        return new Builder(url);
    }

    public static class Builder {
        private final String url;
        private String method = "GET";
        private final Map<String, String> headers = new HashMap<>();
        private String body;
        private Duration timeout = Duration.ofSeconds(30);
        private int maxRetries = 3;

        private Builder(String url) {
            this.url = Objects.requireNonNull(url);
        }

        public Builder method(String method) {
            this.method = method;
            return this;
        }

        public Builder header(String key, String value) {
            this.headers.put(key, value);
            return this;
        }

        public Builder body(String body) {
            this.body = body;
            return this;
        }

        public Builder timeout(Duration timeout) {
            this.timeout = timeout;
            return this;
        }

        public Builder maxRetries(int maxRetries) {
            this.maxRetries = maxRetries;
            return this;
        }

        public HttpRequestConfig build() {
            // バリデーション
            if (body != null && "GET".equals(method)) {
                throw new IllegalStateException("GET request cannot have body");
            }
            return new HttpRequestConfig(this);
        }
    }
}

// 使い方（流れるようなインターフェース）
var config = HttpRequestConfig.builder("https://api.example.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .header("Authorization", "Bearer token123")
    .body("""
        {"name": "Alice", "email": "alice@example.com"}
        """)
    .timeout(Duration.ofSeconds(10))
    .maxRetries(5)
    .build();
```

### 2.2 構造パターン

#### Adapter

```java
// === Adapter: 既存のインターフェースを別のインターフェースに変換する ===

// 既存のライブラリ（変更できない）
public class LegacyPrinter {
    public void printText(String text) {
        System.out.println("[Legacy] " + text);
    }
}

// 新しいインターフェース
public interface ModernPrinter {
    void print(String content, String format);
}

// Adapter: LegacyPrinter を ModernPrinter として使えるようにする
public class LegacyPrinterAdapter implements ModernPrinter {
    private final LegacyPrinter legacyPrinter;

    public LegacyPrinterAdapter(LegacyPrinter legacyPrinter) {
        this.legacyPrinter = legacyPrinter;
    }

    @Override
    public void print(String content, String format) {
        // フォーマットを無視して LegacyPrinter に委譲
        legacyPrinter.printText(content);
    }
}

// 使い方
ModernPrinter printer = new LegacyPrinterAdapter(new LegacyPrinter());
printer.print("Hello", "HTML");  // "[Legacy] Hello"
```

#### Decorator

```java
// === Decorator: 既存のオブジェクトに動的に機能を追加する ===

public interface DataSource {
    String read();
    void write(String data);
}

// 基本実装
public class FileDataSource implements DataSource {
    private final String filename;
    private String data = "";

    public FileDataSource(String filename) {
        this.filename = filename;
    }

    @Override
    public String read() {
        return data;
    }

    @Override
    public void write(String data) {
        this.data = data;
    }
}

// Decorator の基底クラス
public abstract class DataSourceDecorator implements DataSource {
    protected final DataSource wrappee;

    public DataSourceDecorator(DataSource wrappee) {
        this.wrappee = wrappee;
    }

    @Override
    public String read() { return wrappee.read(); }

    @Override
    public void write(String data) { wrappee.write(data); }
}

// 暗号化 Decorator
public class EncryptionDecorator extends DataSourceDecorator {
    public EncryptionDecorator(DataSource wrappee) {
        super(wrappee);
    }

    @Override
    public String read() {
        return decrypt(super.read());
    }

    @Override
    public void write(String data) {
        super.write(encrypt(data));
    }

    private String encrypt(String data) {
        return Base64.getEncoder().encodeToString(data.getBytes());
    }

    private String decrypt(String data) {
        return new String(Base64.getDecoder().decode(data));
    }
}

// 圧縮 Decorator
public class CompressionDecorator extends DataSourceDecorator {
    public CompressionDecorator(DataSource wrappee) {
        super(wrappee);
    }

    @Override
    public void write(String data) {
        super.write("[compressed]" + data);
    }

    @Override
    public String read() {
        return super.read().replace("[compressed]", "");
    }
}

// 使い方: 機能を動的に組み合わせる
DataSource source = new FileDataSource("data.txt");
source = new EncryptionDecorator(source);    // 暗号化を追加
source = new CompressionDecorator(source);    // 圧縮を追加

source.write("Hello, World!");
System.out.println(source.read());  // "Hello, World!"
```

#### Facade

```java
// === Facade: 複雑なサブシステムにシンプルなインターフェースを提供する ===

// 複雑なサブシステム
class UserValidator { boolean validate(String name, String email) { return true; } }
class UserRepository { long save(String name, String email) { return 1L; } }
class EmailService { void sendWelcome(String email) {} }
class AuditLogger { void log(String action) {} }
class CacheService { void invalidate(String key) {} }

// Facade: 複雑さを隠蔽
public class UserRegistrationFacade {
    private final UserValidator validator;
    private final UserRepository repository;
    private final EmailService emailService;
    private final AuditLogger auditLogger;
    private final CacheService cacheService;

    public UserRegistrationFacade(
            UserValidator validator, UserRepository repository,
            EmailService emailService, AuditLogger auditLogger,
            CacheService cacheService) {
        this.validator = validator;
        this.repository = repository;
        this.emailService = emailService;
        this.auditLogger = auditLogger;
        this.cacheService = cacheService;
    }

    // 複雑な手順を1つのメソッドで提供
    public long registerUser(String name, String email) {
        validator.validate(name, email);
        long userId = repository.save(name, email);
        emailService.sendWelcome(email);
        auditLogger.log("User registered: " + name);
        cacheService.invalidate("users");
        return userId;
    }
}

// 使い方: クライアントは1つのメソッドを呼ぶだけ
long userId = facade.registerUser("Alice", "alice@example.com");
```

### 2.3 振る舞いパターン

#### Strategy

```java
// === Strategy: アルゴリズムをカプセル化して交換可能にする ===

// 戦略インターフェース
@FunctionalInterface
public interface PricingStrategy {
    double calculatePrice(double basePrice, int quantity);
}

// 具体的な戦略
public class RegularPricing implements PricingStrategy {
    @Override
    public double calculatePrice(double basePrice, int quantity) {
        return basePrice * quantity;
    }
}

public class BulkPricing implements PricingStrategy {
    @Override
    public double calculatePrice(double basePrice, int quantity) {
        double discount = quantity >= 100 ? 0.20
                        : quantity >= 50  ? 0.10
                        : quantity >= 10  ? 0.05
                        : 0;
        return basePrice * quantity * (1 - discount);
    }
}

public class SeasonalPricing implements PricingStrategy {
    private final double seasonalMultiplier;

    public SeasonalPricing(double multiplier) {
        this.seasonalMultiplier = multiplier;
    }

    @Override
    public double calculatePrice(double basePrice, int quantity) {
        return basePrice * quantity * seasonalMultiplier;
    }
}

// コンテキスト
public class ShoppingCart {
    private PricingStrategy strategy;

    public ShoppingCart(PricingStrategy strategy) {
        this.strategy = strategy;
    }

    public void setStrategy(PricingStrategy strategy) {
        this.strategy = strategy;
    }

    public double checkout(double basePrice, int quantity) {
        return strategy.calculatePrice(basePrice, quantity);
    }
}

// 使い方
var cart = new ShoppingCart(new RegularPricing());
System.out.println(cart.checkout(100, 5));  // 500.0

cart.setStrategy(new BulkPricing());
System.out.println(cart.checkout(100, 50)); // 4500.0（10%割引）

// ラムダ式で戦略を定義することもできる（FunctionalInterface なので）
cart.setStrategy((price, qty) -> price * qty * 0.5);
System.out.println(cart.checkout(100, 5));  // 250.0（50%オフ）
```

#### Observer

```java
// === Observer: オブジェクトの状態変化を他のオブジェクトに通知する ===

// イベント
public record OrderEvent(String orderId, String status, LocalDateTime timestamp) {}

// Observer（リスナー）インターフェース
@FunctionalInterface
public interface OrderEventListener {
    void onEvent(OrderEvent event);
}

// Subject（通知元）
public class OrderEventPublisher {
    private final Map<String, List<OrderEventListener>> listeners = new HashMap<>();

    public void subscribe(String eventType, OrderEventListener listener) {
        listeners.computeIfAbsent(eventType, k -> new ArrayList<>())
            .add(listener);
    }

    public void unsubscribe(String eventType, OrderEventListener listener) {
        listeners.getOrDefault(eventType, List.of()).remove(listener);
    }

    public void publish(String eventType, OrderEvent event) {
        listeners.getOrDefault(eventType, List.of())
            .forEach(listener -> listener.onEvent(event));
    }
}

// 具体的な Observer
public class EmailNotifier implements OrderEventListener {
    @Override
    public void onEvent(OrderEvent event) {
        System.out.println("Sending email for order " + event.orderId()
            + ": " + event.status());
    }
}

public class InventoryUpdater implements OrderEventListener {
    @Override
    public void onEvent(OrderEvent event) {
        System.out.println("Updating inventory for order " + event.orderId());
    }
}

// 使い方
var publisher = new OrderEventPublisher();
publisher.subscribe("ORDER_PLACED", new EmailNotifier());
publisher.subscribe("ORDER_PLACED", new InventoryUpdater());
publisher.subscribe("ORDER_SHIPPED", new EmailNotifier());

// ラムダ式でも登録可能
publisher.subscribe("ORDER_CANCELLED", event ->
    System.out.println("Order " + event.orderId() + " was cancelled")
);

// イベント発行
publisher.publish("ORDER_PLACED",
    new OrderEvent("ORD-001", "PLACED", LocalDateTime.now()));
```

#### Template Method

```java
// === Template Method: アルゴリズムの骨格を定義し、一部のステップをサブクラスに委譲 ===

public abstract class DataProcessor {
    // テンプレートメソッド（処理の流れを定義）
    public final void process() {
        var data = readData();
        var processed = processData(data);
        var formatted = formatOutput(processed);
        writeOutput(formatted);
    }

    // サブクラスで実装するステップ
    protected abstract List<String> readData();
    protected abstract List<String> processData(List<String> data);

    // デフォルト実装を持つステップ（必要に応じてオーバーライド）
    protected String formatOutput(List<String> data) {
        return String.join("\n", data);
    }

    protected void writeOutput(String output) {
        System.out.println(output);
    }
}

// CSV データ処理
public class CsvProcessor extends DataProcessor {
    private final String filePath;

    public CsvProcessor(String filePath) {
        this.filePath = filePath;
    }

    @Override
    protected List<String> readData() {
        try {
            return Files.readAllLines(Path.of(filePath));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    protected List<String> processData(List<String> data) {
        return data.stream()
            .filter(line -> !line.isBlank())
            .map(String::strip)
            .toList();
    }
}

// JSON データ処理
public class JsonProcessor extends DataProcessor {
    @Override
    protected List<String> readData() {
        // API からデータ取得
        return List.of("{\"name\": \"Alice\"}", "{\"name\": \"Bob\"}");
    }

    @Override
    protected List<String> processData(List<String> data) {
        return data;  // そのまま
    }

    @Override
    protected String formatOutput(List<String> data) {
        return "[" + String.join(",", data) + "]";
    }
}

// 使い方
new CsvProcessor("data.csv").process();
new JsonProcessor().process();
```

#### Iterator

```java
// === Iterator: コレクションの内部構造を公開せずに要素を順に走査する ===

// Java の Iterable / Iterator を実装
public class NumberRange implements Iterable<Integer> {
    private final int start;
    private final int end;

    public NumberRange(int start, int end) {
        this.start = start;
        this.end = end;
    }

    @Override
    public Iterator<Integer> iterator() {
        return new Iterator<>() {
            private int current = start;

            @Override
            public boolean hasNext() {
                return current <= end;
            }

            @Override
            public Integer next() {
                if (!hasNext()) throw new NoSuchElementException();
                return current++;
            }
        };
    }
}

// 使い方: for-each が使える
var range = new NumberRange(1, 5);
for (int n : range) {
    System.out.println(n);  // 1, 2, 3, 4, 5
}

// Stream に変換することもできる
StreamSupport.stream(range.spliterator(), false)
    .map(n -> n * n)
    .forEach(System.out::println);  // 1, 4, 9, 16, 25
```

---

## 3. テスト（JUnit 5）

### 3.1 テストの基本

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

// テスト対象
public class Calculator {
    public int add(int a, int b) { return a + b; }
    public int divide(int a, int b) {
        if (b == 0) throw new ArithmeticException("Division by zero");
        return a / b;
    }
}

// テストクラス
class CalculatorTest {

    private Calculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new Calculator();
    }

    @Test
    @DisplayName("2つの正の数を加算する")
    void shouldAddTwoPositiveNumbers() {
        // Arrange（準備）
        int a = 3, b = 5;

        // Act（実行）
        int result = calculator.add(a, b);

        // Assert（検証）
        assertEquals(8, result);
    }

    @Test
    @DisplayName("0で割ると例外が発生する")
    void shouldThrowWhenDividingByZero() {
        var exception = assertThrows(ArithmeticException.class,
            () -> calculator.divide(10, 0));
        assertEquals("Division by zero", exception.getMessage());
    }

    @Test
    @DisplayName("null チェック")
    void shouldHandleNull() {
        assertNotNull(calculator);
        assertNull(null);
    }

    @Test
    @DisplayName("複数のアサーション")
    void shouldSupportMultipleAssertions() {
        assertAll("calculator operations",
            () -> assertEquals(5, calculator.add(2, 3)),
            () -> assertEquals(0, calculator.add(-1, 1)),
            () -> assertEquals(3, calculator.divide(10, 3))
        );
    }

    @Test
    @DisplayName("コレクションのテスト")
    void shouldTestCollections() {
        var list = List.of("Alice", "Bob", "Charlie");

        assertEquals(3, list.size());
        assertTrue(list.contains("Alice"));
        assertFalse(list.isEmpty());
        assertIterableEquals(List.of("Alice", "Bob", "Charlie"), list);
    }

    @Test
    @Disabled("まだ実装されていない")
    void shouldBeImplementedLater() {
        fail("Not yet implemented");
    }
}
```

### 3.2 ライフサイクル

```java
class LifecycleTest {

    @BeforeAll
    static void beforeAll() {
        System.out.println("すべてのテストの前に1回だけ実行");
        // データベース接続の初期化など
    }

    @BeforeEach
    void beforeEach() {
        System.out.println("各テストの前に実行");
        // テストデータの準備など
    }

    @Test
    void test1() {
        System.out.println("テスト1");
    }

    @Test
    void test2() {
        System.out.println("テスト2");
    }

    @AfterEach
    void afterEach() {
        System.out.println("各テストの後に実行");
        // テストデータのクリーンアップなど
    }

    @AfterAll
    static void afterAll() {
        System.out.println("すべてのテストの後に1回だけ実行");
        // データベース接続のクローズなど
    }
}

// 実行順:
// beforeAll
// beforeEach → test1 → afterEach
// beforeEach → test2 → afterEach
// afterAll

// === ネストテスト ===
@DisplayName("UserService のテスト")
class UserServiceTest {

    @Nested
    @DisplayName("ユーザー登録")
    class Registration {
        @Test
        @DisplayName("正常に登録できる")
        void shouldRegisterSuccessfully() { /* ... */ }

        @Test
        @DisplayName("重複メールで失敗する")
        void shouldFailWithDuplicateEmail() { /* ... */ }
    }

    @Nested
    @DisplayName("ユーザー検索")
    class Search {
        @Test
        @DisplayName("IDで検索できる")
        void shouldFindById() { /* ... */ }

        @Test
        @DisplayName("存在しないIDで空を返す")
        void shouldReturnEmptyForUnknownId() { /* ... */ }
    }
}
```

### 3.3 パラメータ化テスト

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.*;

class ParameterizedTests {

    // === @ValueSource ===
    @ParameterizedTest
    @ValueSource(strings = {"racecar", "radar", "level", "madam"})
    @DisplayName("回文を検出する")
    void shouldDetectPalindromes(String candidate) {
        assertTrue(isPalindrome(candidate));
    }

    // === @NullAndEmptySource ===
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  ", "\t", "\n"})
    @DisplayName("空白文字列を検出する")
    void shouldDetectBlankStrings(String input) {
        assertTrue(input == null || input.isBlank());
    }

    // === @EnumSource ===
    @ParameterizedTest
    @EnumSource(Month.class)
    @DisplayName("すべての月は1〜12の値を持つ")
    void shouldHaveValidMonthValue(Month month) {
        int value = month.getValue();
        assertTrue(value >= 1 && value <= 12);
    }

    // === @CsvSource ===
    @ParameterizedTest
    @CsvSource({
        "1, 1, 2",
        "0, 0, 0",
        "-1, 1, 0",
        "100, 200, 300"
    })
    @DisplayName("加算のテスト")
    void shouldAdd(int a, int b, int expected) {
        assertEquals(expected, new Calculator().add(a, b));
    }

    // === @MethodSource ===
    @ParameterizedTest
    @MethodSource("provideUserData")
    @DisplayName("ユーザー名のバリデーション")
    void shouldValidateUsername(String username, boolean expected) {
        assertEquals(expected, isValidUsername(username));
    }

    static Stream<Arguments> provideUserData() {
        return Stream.of(
            Arguments.of("alice", true),
            Arguments.of("bob123", true),
            Arguments.of("", false),
            Arguments.of("ab", false),        // 短すぎる
            Arguments.of("a".repeat(21), false) // 長すぎる
        );
    }

    private boolean isPalindrome(String s) {
        return s.equals(new StringBuilder(s).reverse().toString());
    }

    private boolean isValidUsername(String username) {
        return username != null && username.length() >= 3 && username.length() <= 20;
    }
}
```

### 3.4 Mockito の基本

```java
import org.mockito.Mockito;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

// テスト対象
public class OrderService {
    private final OrderRepository repository;
    private final NotificationService notificationService;

    public OrderService(OrderRepository repository,
                        NotificationService notificationService) {
        this.repository = repository;
        this.notificationService = notificationService;
    }

    public Order placeOrder(String customerId, List<OrderItem> items) {
        var order = new Order(customerId, items);
        repository.save(order);
        notificationService.notify(customerId, "Order placed: " + order.getId());
        return order;
    }

    public Order getOrder(String orderId) {
        return repository.findById(orderId)
            .orElseThrow(() -> new OrderNotFoundException(orderId));
    }
}

// テスト
class OrderServiceTest {

    private OrderRepository mockRepository;
    private NotificationService mockNotification;
    private OrderService service;

    @BeforeEach
    void setUp() {
        // モックの作成
        mockRepository = mock(OrderRepository.class);
        mockNotification = mock(NotificationService.class);
        service = new OrderService(mockRepository, mockNotification);
    }

    @Test
    @DisplayName("注文を正常に作成できる")
    void shouldPlaceOrder() {
        // Arrange
        var items = List.of(new OrderItem("item1", 2));

        // Act
        var order = service.placeOrder("customer1", items);

        // Assert
        assertNotNull(order);

        // verify: メソッドが呼ばれたことを検証
        verify(mockRepository).save(any(Order.class));
        verify(mockNotification).notify(eq("customer1"), contains("Order placed"));
    }

    @Test
    @DisplayName("注文をIDで取得できる")
    void shouldGetOrderById() {
        // Arrange: モックの振る舞いを定義
        var expectedOrder = new Order("customer1", List.of());
        when(mockRepository.findById("order1"))
            .thenReturn(Optional.of(expectedOrder));

        // Act
        var order = service.getOrder("order1");

        // Assert
        assertEquals(expectedOrder, order);
        verify(mockRepository).findById("order1");
    }

    @Test
    @DisplayName("存在しない注文IDで例外が発生する")
    void shouldThrowWhenOrderNotFound() {
        // Arrange
        when(mockRepository.findById("unknown"))
            .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(OrderNotFoundException.class,
            () -> service.getOrder("unknown"));
    }

    @Test
    @DisplayName("通知サービスが失敗しても注文は保存される")
    void shouldSaveOrderEvenIfNotificationFails() {
        // Arrange: 通知サービスが例外を投げるように設定
        doThrow(new RuntimeException("Notification failed"))
            .when(mockNotification).notify(anyString(), anyString());

        // Act & Assert
        assertThrows(RuntimeException.class,
            () -> service.placeOrder("customer1", List.of()));

        // 注文は保存されている
        verify(mockRepository).save(any(Order.class));
    }
}
```

### 3.5 テスト設計原則（AAA: Arrange-Act-Assert）

```java
// === AAA パターン ===
@Test
void shouldCalculateDiscountedPrice() {
    // Arrange（準備）: テストに必要なオブジェクトや値を用意
    var product = new Product("Widget", 100.0);
    var discount = new PercentageDiscount(20);
    var calculator = new PriceCalculator(discount);

    // Act（実行）: テスト対象のメソッドを1つだけ呼ぶ
    double result = calculator.calculate(product);

    // Assert（検証）: 期待値と実際の値を比較
    assertEquals(80.0, result, 0.01);
}

// === テストの命名規則 ===
// should + 期待される動作 + when + 条件
// 例:
// shouldReturnEmpty_whenUserNotFound
// shouldThrowException_whenInputIsNull
// shouldCalculateCorrectly_whenDiscountApplied

// === テストの FIRST 原則 ===
// Fast:       テストは高速に実行される
// Independent: テスト間に依存関係がない
// Repeatable: 何度実行しても同じ結果
// Self-validating: テスト自身が成功/失敗を判定
// Timely:     本番コードと同時にテストを書く

// === Given-When-Then（BDDスタイル） ===
@Test
@DisplayName("ユーザーが存在する場合、プロフィールを返す")
void givenExistingUser_whenGetProfile_thenReturnProfile() {
    // Given
    when(userRepository.findById(1L))
        .thenReturn(Optional.of(new User(1L, "Alice")));

    // When
    var profile = userService.getProfile(1L);

    // Then
    assertNotNull(profile);
    assertEquals("Alice", profile.name());
}
```

---

## 4. ビルドツール

### 4.1 Maven vs Gradle の比較

| 項目 | Maven | Gradle |
|------|-------|--------|
| 設定ファイル | pom.xml（XML） | build.gradle（Groovy/Kotlin） |
| 設定スタイル | 宣言的 | 宣言的 + 命令的 |
| ビルド速度 | 遅め | 速い（インクリメンタルビルド） |
| 学習曲線 | 低い | やや高い |
| プラグイン | 豊富 | 豊富 |
| IDE対応 | 全IDE | 全IDE |
| 新規プロジェクト | 中〜大規模 | あらゆる規模 |

### 4.2 Maven の pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- プロジェクトの識別情報 -->
    <groupId>com.example</groupId>
    <artifactId>my-app</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <!-- プロパティ（変数として使える） -->
    <properties>
        <java.version>21</java.version>
        <maven.compiler.source>${java.version}</maven.compiler.source>
        <maven.compiler.target>${java.version}</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <junit.version>5.10.0</junit.version>
    </properties>

    <!-- 依存関係 -->
    <dependencies>
        <!-- コンパイル時に必要 -->
        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>32.1.3-jre</version>
        </dependency>

        <!-- テスト時のみ必要 -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.mockito</groupId>
            <artifactId>mockito-core</artifactId>
            <version>5.7.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <!-- ビルド設定 -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <release>${java.version}</release>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

```bash
# Maven のよく使うコマンド
mvn clean                  # ビルド成果物を削除
mvn compile                # コンパイル
mvn test                   # テスト実行
mvn package                # JAR/WAR 作成
mvn install                # ローカルリポジトリにインストール
mvn clean package -DskipTests  # テストをスキップしてパッケージ
mvn dependency:tree        # 依存関係ツリーを表示
```

### 4.3 Gradle の build.gradle

```groovy
// build.gradle（Groovy DSL）
plugins {
    id 'java'
    id 'application'
}

group = 'com.example'
version = '1.0.0-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // コンパイル時に必要
    implementation 'com.google.guava:guava:32.1.3-jre'

    // テスト時のみ必要
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
    testImplementation 'org.mockito:mockito-core:5.7.0'

    // コンパイル時のみ（ランタイムには不要）
    compileOnly 'org.projectlombok:lombok:1.18.30'
    annotationProcessor 'org.projectlombok:lombok:1.18.30'

    // ランタイムのみ（コンパイル時には不要）
    runtimeOnly 'org.postgresql:postgresql:42.6.0'
}

test {
    useJUnitPlatform()
}

application {
    mainClass = 'com.example.Main'
}
```

```kotlin
// build.gradle.kts（Kotlin DSL — 最近のトレンド）
plugins {
    java
    application
}

group = "com.example"
version = "1.0.0-SNAPSHOT"

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.google.guava:guava:32.1.3-jre")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
    testImplementation("org.mockito:mockito-core:5.7.0")
}

tasks.test {
    useJUnitPlatform()
}

application {
    mainClass.set("com.example.Main")
}
```

```bash
# Gradle のよく使うコマンド
./gradlew clean             # ビルド成果物を削除
./gradlew build             # ビルド（コンパイル + テスト + パッケージ）
./gradlew test              # テスト実行
./gradlew run               # アプリケーション実行
./gradlew dependencies      # 依存関係ツリーを表示
./gradlew build -x test     # テストをスキップしてビルド
```

### 4.4 依存関係のスコープ

```java
// === Maven のスコープ ===
// compile   — デフォルト。コンパイル・テスト・ランタイムすべてで使える
// test      — テスト時のみ（JUnit, Mockito）
// provided  — コンパイル時のみ（Servlet API — サーバーが提供する）
// runtime   — ランタイムのみ（JDBC ドライバ）

// === Gradle のスコープ ===
// implementation     — コンパイル + ランタイム（推移的に公開しない）
// api                — コンパイル + ランタイム（推移的に公開する）
// compileOnly        — コンパイル時のみ
// runtimeOnly        — ランタイムのみ
// testImplementation — テスト時のみ
// annotationProcessor — アノテーションプロセッサ
```

### 4.5 マルチモジュールプロジェクト

```
my-project/
├── settings.gradle.kts
├── build.gradle.kts          # ルート
├── app/
│   ├── build.gradle.kts      # アプリケーション
│   └── src/
├── core/
│   ├── build.gradle.kts      # コアロジック
│   └── src/
└── common/
    ├── build.gradle.kts      # 共通ユーティリティ
    └── src/
```

```kotlin
// settings.gradle.kts
rootProject.name = "my-project"
include("app", "core", "common")

// common/build.gradle.kts
plugins { java }

// core/build.gradle.kts
plugins { java }
dependencies {
    implementation(project(":common"))  // common モジュールに依存
}

// app/build.gradle.kts
plugins {
    java
    application
}
dependencies {
    implementation(project(":core"))    // core モジュールに依存
    implementation(project(":common")) // common モジュールに依存
}
```

---

## 5. データベースアクセス

### 5.1 JDBC の基本（復習）

```java
// === JDBC: Java Database Connectivity ===
// Java からデータベースに直接アクセスするための低レベル API

// データベース接続と基本的な CRUD
public class JdbcExample {

    private static final String URL = "jdbc:postgresql://localhost:5432/mydb";
    private static final String USER = "user";
    private static final String PASSWORD = "password";

    // SELECT（読み取り）
    public List<User> findAllUsers() throws SQLException {
        var users = new ArrayList<User>();
        try (var conn = DriverManager.getConnection(URL, USER, PASSWORD);
             var stmt = conn.prepareStatement("SELECT id, name, email FROM users")) {
            try (var rs = stmt.executeQuery()) {
                while (rs.next()) {
                    users.add(new User(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("email")
                    ));
                }
            }
        }
        return users;
    }

    // INSERT（作成）
    public void createUser(String name, String email) throws SQLException {
        try (var conn = DriverManager.getConnection(URL, USER, PASSWORD);
             var stmt = conn.prepareStatement(
                 "INSERT INTO users (name, email) VALUES (?, ?)")) {
            stmt.setString(1, name);    // 1番目の ? に name をセット
            stmt.setString(2, email);   // 2番目の ? に email をセット
            stmt.executeUpdate();
        }
    }

    // UPDATE（更新）
    public void updateUserEmail(long id, String newEmail) throws SQLException {
        try (var conn = DriverManager.getConnection(URL, USER, PASSWORD);
             var stmt = conn.prepareStatement(
                 "UPDATE users SET email = ? WHERE id = ?")) {
            stmt.setString(1, newEmail);
            stmt.setLong(2, id);
            int rowsAffected = stmt.executeUpdate();
            System.out.println(rowsAffected + " rows updated");
        }
    }

    // トランザクション
    public void transferMoney(long fromId, long toId, double amount)
            throws SQLException {
        try (var conn = DriverManager.getConnection(URL, USER, PASSWORD)) {
            conn.setAutoCommit(false);  // トランザクション開始
            try {
                // 出金
                try (var stmt = conn.prepareStatement(
                        "UPDATE accounts SET balance = balance - ? WHERE id = ?")) {
                    stmt.setDouble(1, amount);
                    stmt.setLong(2, fromId);
                    stmt.executeUpdate();
                }
                // 入金
                try (var stmt = conn.prepareStatement(
                        "UPDATE accounts SET balance = balance + ? WHERE id = ?")) {
                    stmt.setDouble(1, amount);
                    stmt.setLong(2, toId);
                    stmt.executeUpdate();
                }
                conn.commit();  // コミット
            } catch (SQLException e) {
                conn.rollback();  // ロールバック
                throw e;
            }
        }
    }
}
```

### 5.2 JPA / Hibernate の概要

```java
// === JPA (Java Persistence API): ORM の標準仕様 ===
// Hibernate は JPA の実装の1つ

// エンティティ（テーブルに対応するクラス）
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();

    // コンストラクタ、getter, setter
    protected User() {} // JPA に必要なデフォルトコンストラクタ

    public User(String name, String email) {
        this.name = name;
        this.email = email;
        this.createdAt = LocalDateTime.now();
    }

    // getter / setter ...
}

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String product;

    private int quantity;

    protected Order() {}

    public Order(User user, String product, int quantity) {
        this.user = user;
        this.product = product;
        this.quantity = quantity;
    }
}

// === JPA のリレーション ===
// @OneToOne   — 1対1（User ⇔ Profile）
// @OneToMany  — 1対多（User → Orders）
// @ManyToOne  — 多対1（Order → User）
// @ManyToMany — 多対多（Student ⇔ Course）
```

### 5.3 Spring Data JPA の基本

```java
// === Repository インターフェース ===
// Spring Data JPA はインターフェースを定義するだけで CRUD が使える

public interface UserRepository extends JpaRepository<User, Long> {

    // メソッド名から自動的にクエリが生成される
    Optional<User> findByEmail(String email);
    List<User> findByNameContaining(String keyword);
    List<User> findByCreatedAtAfter(LocalDateTime date);
    boolean existsByEmail(String email);
    long countByNameStartingWith(String prefix);

    // 複数条件
    List<User> findByNameAndEmail(String name, String email);
    List<User> findByNameOrEmail(String name, String email);

    // ソート・ページング
    List<User> findAllByOrderByNameAsc();
    Page<User> findByNameContaining(String keyword, Pageable pageable);

    // カスタムクエリ（JPQL）
    @Query("SELECT u FROM User u WHERE u.email LIKE %:domain")
    List<User> findByEmailDomain(@Param("domain") String domain);

    // ネイティブクエリ
    @Query(value = "SELECT * FROM users WHERE name ILIKE ?1", nativeQuery = true)
    List<User> searchByName(String pattern);
}

// === 使い方（Service 層） ===
@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User createUser(String name, String email) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already exists");
        }
        var user = new User(name, email);
        return userRepository.save(user);
    }

    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }

    public Page<User> searchUsers(String keyword, int page, int size) {
        return userRepository.findByNameContaining(
            keyword, PageRequest.of(page, size, Sort.by("name"))
        );
    }

    @Transactional
    public void updateEmail(Long id, String newEmail) {
        var user = findById(id);
        user.setEmail(newEmail);
        // @Transactional により、メソッド終了時に自動的に保存される
    }
}
```

### 5.4 N+1 問題と対策

```java
// === N+1 問題とは ===
// 1回のクエリで N 件のデータを取得し、
// 各データに対してさらに1回ずつクエリが発行される問題

// 問題のあるコード
@Entity
public class User {
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<Order> orders;
}

// 以下のコードは N+1 問題を引き起こす:
List<User> users = userRepository.findAll();  // 1回のクエリ
for (User user : users) {
    user.getOrders().size();  // ユーザーごとに1回のクエリ（N回）
}
// 合計: 1 + N 回のクエリ

// === 対策1: Fetch Join（JPQL） ===
@Query("SELECT u FROM User u JOIN FETCH u.orders")
List<User> findAllWithOrders();
// 1回のクエリで User と Orders を一緒に取得

// === 対策2: @EntityGraph ===
@EntityGraph(attributePaths = {"orders"})
List<User> findAll();
// Spring Data JPA の機能で Fetch Join を指定

// === 対策3: Batch Size ===
@Entity
public class User {
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    @BatchSize(size = 100)  // 100件ずつまとめてクエリ
    private List<Order> orders;
}

// === 対策4: DTO Projection（必要なデータだけ取得） ===
public record UserSummary(String name, long orderCount) {}

@Query("""
    SELECT new com.example.UserSummary(u.name, COUNT(o))
    FROM User u LEFT JOIN u.orders o
    GROUP BY u.name
    """)
List<UserSummary> findUserSummaries();
```

---

## 6. Web開発の基礎

### 6.1 Servlet / JSP（歴史的経緯）

```java
// === Servlet: Java で Web アプリケーションを作る基盤技術 ===
// 現在は直接使うことは少ないが、Spring MVC の内部で使われている

// 従来の Servlet
@WebServlet("/hello")
public class HelloServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        resp.setContentType("text/html; charset=UTF-8");
        resp.getWriter().println("<h1>Hello, Servlet!</h1>");
    }
}

// === 歴史的な変遷 ===
// Servlet (1997)    → HTML を Java コードで生成（辛い）
// JSP (1999)        → HTML に Java コードを埋め込む（スパゲッティ化）
// Struts (2001)     → MVC フレームワーク（XML 地獄）
// Spring MVC (2004) → DI + MVC（アノテーションベース）
// Spring Boot (2014)→ 設定不要の Spring（現在の主流）
```

### 6.2 Spring Boot の概要

```java
// === Spring Boot: Spring ベースのアプリケーションを最小設定で作れるフレームワーク ===

// メインクラス
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}

// application.yml（設定ファイル）
/*
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: user
    password: secret
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: true

logging:
  level:
    root: INFO
    com.example: DEBUG
*/
```

### 6.3 REST API の設計（Spring MVC）

```java
// === Controller（プレゼンテーション層） ===
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/users
    @GetMapping
    public List<UserDto> getAllUsers() {
        return userService.findAll().stream()
            .map(this::toDto)
            .toList();
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return userService.findById(id)
            .map(this::toDto)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/users
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto createUser(@Valid @RequestBody CreateUserRequest request) {
        var user = userService.createUser(request.name(), request.email());
        return toDto(user);
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public UserDto updateUser(@PathVariable Long id,
                              @Valid @RequestBody UpdateUserRequest request) {
        var user = userService.updateUser(id, request.name(), request.email());
        return toDto(user);
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

    // GET /api/users?name=alice&page=0&size=10
    @GetMapping(params = "name")
    public Page<UserDto> searchUsers(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return userService.searchByName(name, page, size)
            .map(this::toDto);
    }

    private UserDto toDto(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail());
    }
}

// DTO（Data Transfer Object）
public record UserDto(Long id, String name, String email) {}

public record CreateUserRequest(
    @NotBlank(message = "Name is required")
    String name,

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email
) {}

public record UpdateUserRequest(
    @NotBlank String name,
    @Email String email
) {}
```

### 6.4 Controller / Service / Repository 層

```java
// === 3層アーキテクチャ ===

// Controller（プレゼンテーション層）
// - HTTP リクエスト/レスポンスの処理
// - バリデーション
// - DTO の変換
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderDto createOrder(@Valid @RequestBody CreateOrderRequest request) {
        var order = orderService.placeOrder(
            request.customerId(), request.items());
        return OrderDto.from(order);
    }
}

// Service（ビジネスロジック層）
// - ビジネスルールの実装
// - トランザクション管理
// - 複数の Repository の調整
@Service
@Transactional
public class OrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;

    public OrderService(OrderRepository orderRepository,
                        UserRepository userRepository,
                        InventoryService inventoryService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
    }

    public Order placeOrder(Long customerId, List<OrderItemRequest> items) {
        // ビジネスルール: ユーザーの存在確認
        var user = userRepository.findById(customerId)
            .orElseThrow(() -> new UserNotFoundException(customerId));

        // ビジネスルール: 在庫確認
        for (var item : items) {
            if (!inventoryService.isAvailable(item.productId(), item.quantity())) {
                throw new InsufficientStockException(item.productId());
            }
        }

        // 注文作成
        var order = new Order(user, items);
        return orderRepository.save(order);
    }
}

// Repository（データアクセス層）
// - データベースとの CRUD 操作
// - クエリの定義
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT o FROM Order o WHERE o.status = :status AND o.createdAt < :before")
    List<Order> findStaleOrders(
        @Param("status") OrderStatus status,
        @Param("before") LocalDateTime before);
}
```

### 6.5 DI（Dependency Injection）の仕組み

```java
// === DI: 依存するオブジェクトを外部から注入する ===

// Spring における DI の方法

// 方法1: コンストラクタ・インジェクション（推奨）
@Service
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;

    // コンストラクタが1つだけなら @Autowired は不要
    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
}

// 方法2: フィールド・インジェクション（非推奨）
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;  // テストしにくい
}

// 方法3: セッター・インジェクション（まれに使う）
@Service
public class UserService {
    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// === Spring の主なアノテーション ===
// @Component     — 汎用的な Bean
// @Service       — ビジネスロジック層の Bean
// @Repository    — データアクセス層の Bean
// @Controller    — Web コントローラの Bean
// @RestController — @Controller + @ResponseBody
// @Configuration — 設定クラス
// @Bean          — メソッドレベルの Bean 定義

// === @Configuration による手動 Bean 定義 ===
@Configuration
public class AppConfig {

    @Bean
    public HttpClient httpClient() {
        return HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}

// === スコープ ===
// @Scope("singleton")  — デフォルト。アプリ全体で1インスタンス
// @Scope("prototype")  — 注入のたびに新しいインスタンス
// @Scope("request")    — HTTPリクエストごとに1インスタンス
// @Scope("session")    — HTTPセッションごとに1インスタンス
```

---

## 7. 並行処理

### 7.1 Thread / Runnable（復習）

```java
// === 方法1: Thread クラスを継承 ===
public class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread: " + Thread.currentThread().getName());
    }
}
new MyThread().start();

// === 方法2: Runnable インターフェース ===
Runnable task = () -> {
    System.out.println("Runnable: " + Thread.currentThread().getName());
};
new Thread(task).start();

// === 方法3: Callable（値を返せる） ===
Callable<String> callable = () -> {
    Thread.sleep(1000);
    return "Result from " + Thread.currentThread().getName();
};
```

### 7.2 ExecutorService

```java
import java.util.concurrent.*;

// === 固定サイズのスレッドプール ===
try (var executor = Executors.newFixedThreadPool(4)) {
    // タスクの送信
    Future<String> future = executor.submit(() -> {
        Thread.sleep(1000);
        return "Task completed";
    });

    // 結果の取得（ブロッキング）
    String result = future.get();              // 無期限に待つ
    String result2 = future.get(5, TimeUnit.SECONDS);  // タイムアウト付き

    // 複数タスクの実行
    List<Callable<String>> tasks = List.of(
        () -> "Task 1",
        () -> "Task 2",
        () -> "Task 3"
    );

    // すべてのタスクの結果を取得
    List<Future<String>> futures = executor.invokeAll(tasks);
    for (var f : futures) {
        System.out.println(f.get());
    }

    // いずれか1つの結果を取得
    String first = executor.invokeAny(tasks);
}

// === スレッドプールの種類 ===
// newFixedThreadPool(n)     — 固定数のスレッド
// newCachedThreadPool()     — 必要に応じてスレッドを増やす
// newSingleThreadExecutor() — 1つのスレッドで順次実行
// newScheduledThreadPool(n) — 定期実行用

// === ScheduledExecutorService ===
try (var scheduler = Executors.newScheduledThreadPool(2)) {
    // 3秒後に1回実行
    scheduler.schedule(() -> System.out.println("Delayed"), 3, TimeUnit.SECONDS);

    // 1秒後に開始、2秒ごとに繰り返し
    scheduler.scheduleAtFixedRate(
        () -> System.out.println("Periodic"),
        1, 2, TimeUnit.SECONDS
    );
}
```

### 7.3 CompletableFuture

```java
// === CompletableFuture: 非同期処理のチェーン ===
// （詳細はモダンJava編を参照）

// 実用例: 非同期 API 呼び出しのパイプライン
public CompletableFuture<OrderSummary> processOrder(String orderId) {
    return CompletableFuture
        // 注文を取得
        .supplyAsync(() -> orderService.findById(orderId))
        // 在庫を確認
        .thenCompose(order -> CompletableFuture.supplyAsync(
            () -> inventoryService.checkStock(order)))
        // 支払い処理
        .thenCompose(stockResult -> CompletableFuture.supplyAsync(
            () -> paymentService.process(stockResult)))
        // 結果を変換
        .thenApply(payment -> new OrderSummary(orderId, payment.status()))
        // エラーハンドリング
        .exceptionally(error -> {
            logger.error("Order processing failed", error);
            return new OrderSummary(orderId, "FAILED");
        });
}
```

### 7.4 Virtual Threads（Java 21+）

```java
// === Virtual Threads の実践的な使い方 ===

// Web サーバーでのリクエスト処理（従来）
// スレッドプールのサイズ = 同時処理数の上限
var executor = Executors.newFixedThreadPool(200);
// → 200リクエストまで同時処理可能

// Virtual Threads（Java 21+）
// リクエストごとに仮想スレッドを作成（上限なし）
var executor2 = Executors.newVirtualThreadPerTaskExecutor();
// → 数万リクエストを同時処理可能

// === Structured Concurrency（構造化並行性、Preview） ===
// 複数の並行タスクを構造的に管理する
/*
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var userTask = scope.fork(() -> userService.getUser(userId));
    var orderTask = scope.fork(() -> orderService.getOrders(userId));

    scope.join();           // すべてのタスクの完了を待つ
    scope.throwIfFailed();  // いずれかが失敗していれば例外を投げる

    return new UserProfile(userTask.get(), orderTask.get());
}
*/

// === 従来のスレッドプール vs Virtual Threads ===
// 従来: I/O 待ちでスレッドがブロックされる
//       → スレッド数 = 同時処理数の上限
//       → リトルの法則: スループット = スレッド数 / レイテンシ

// Virtual Threads: I/O 待ちでキャリアスレッドを解放
//       → 仮想スレッド数 ≈ 無制限
//       → スループットがキャリアスレッド数に制限されない
```

### 7.5 スレッドセーフ

```java
// === synchronized ===
public class Counter {
    private int count = 0;

    // メソッド全体を同期
    public synchronized void increment() {
        count++;
    }

    // ブロック単位で同期
    public void incrementBlock() {
        synchronized (this) {
            count++;
        }
    }

    public synchronized int getCount() {
        return count;
    }
}

// === volatile ===
// 変数の読み書きがメインメモリに直接行われることを保証
public class VolatileExample {
    private volatile boolean running = true;

    public void stop() {
        running = false;  // 他のスレッドから即座に見える
    }

    public void run() {
        while (running) {
            // 処理
        }
    }
}

// === AtomicInteger（ロックフリーな並行処理） ===
import java.util.concurrent.atomic.*;

public class AtomicCounter {
    private final AtomicInteger count = new AtomicInteger(0);

    public void increment() {
        count.incrementAndGet();  // アトミックにインクリメント
    }

    public int getCount() {
        return count.get();
    }
}

// その他の Atomic クラス
AtomicLong atomicLong = new AtomicLong();
AtomicBoolean atomicBoolean = new AtomicBoolean();
AtomicReference<String> atomicRef = new AtomicReference<>("initial");

// === ConcurrentHashMap ===
Map<String, Integer> map = new ConcurrentHashMap<>();
map.put("key", 0);

// アトミックな更新
map.compute("key", (k, v) -> v + 1);
map.merge("key", 1, Integer::sum);

// === ReentrantLock（synchronized の代替、Virtual Threads 推奨） ===
import java.util.concurrent.locks.*;

public class LockExample {
    private final ReentrantLock lock = new ReentrantLock();
    private int count = 0;

    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock();
        }
    }
}

// === ReadWriteLock（読み取りは並行、書き込みは排他） ===
public class CachedData {
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private Map<String, String> cache = new HashMap<>();

    public String get(String key) {
        rwLock.readLock().lock();  // 複数スレッドが同時に読める
        try {
            return cache.get(key);
        } finally {
            rwLock.readLock().unlock();
        }
    }

    public void put(String key, String value) {
        rwLock.writeLock().lock();  // 書き込みは排他的
        try {
            cache.put(key, value);
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}

// === スレッドセーフなコレクション ===
// ConcurrentHashMap       — スレッドセーフな Map
// CopyOnWriteArrayList    — 読み取り多、書き込み少の List
// ConcurrentLinkedQueue   — ロックフリーな Queue
// BlockingQueue           — プロデューサー-コンシューマーパターン

BlockingQueue<String> queue = new LinkedBlockingQueue<>(100);
// プロデューサー
queue.put("item");      // キューが満杯ならブロック
// コンシューマー
String item = queue.take();  // キューが空ならブロック
```

---

## 8. 実務のベストプラクティス

### 8.1 ログ（SLF4J + Logback）

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserService {
    // クラスごとにロガーを定義
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    public User createUser(String name, String email) {
        logger.info("Creating user: name={}, email={}", name, email);

        try {
            var user = new User(name, email);
            userRepository.save(user);
            logger.info("User created successfully: id={}", user.getId());
            return user;
        } catch (Exception e) {
            logger.error("Failed to create user: name={}", name, e);
            throw e;
        }
    }

    public void processOrder(Order order) {
        logger.debug("Processing order: {}", order);  // 詳細ログ

        if (order.getTotal() > 100_000) {
            logger.warn("Large order detected: id={}, total={}",
                order.getId(), order.getTotal());
        }
    }
}

// === ログレベル ===
// TRACE — 最も詳細（変数の値など）
// DEBUG — 開発時のデバッグ情報
// INFO  — 正常な動作の記録
// WARN  — 警告（問題の可能性）
// ERROR — エラー（処理失敗）

// === logback-spring.xml の設定例 ===
/*
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/app.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/app.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE" />
        <appender-ref ref="FILE" />
    </root>

    <logger name="com.example" level="DEBUG" />
</configuration>
*/

// === ログのベストプラクティス ===
// 1. パラメータ化ログを使う（文字列結合しない）
logger.info("User {} created", name);           // OK
logger.info("User " + name + " created");        // NG（常に結合される）

// 2. 例外はスタックトレース付きで記録
logger.error("Failed to process", exception);    // OK（第2引数に例外）

// 3. 機密情報をログに出さない
logger.info("Password: {}", password);           // NG! 絶対ダメ
logger.info("User authenticated: {}", email);    // OK

// 4. 適切なログレベルを使う
logger.info("Server started on port {}", port);  // INFO: 運用に必要
logger.debug("SQL: {}", sql);                    // DEBUG: 開発時のみ
logger.error("DB connection failed", e);          // ERROR: 障害
```

### 8.2 設定管理（application.yml）

```yaml
# === application.yml ===
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  application:
    name: my-app

  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USERNAME:user}      # 環境変数、デフォルト値付き
    password: ${DB_PASSWORD:secret}

  jpa:
    hibernate:
      ddl-auto: validate              # none/validate/update/create/create-drop
    properties:
      hibernate:
        format_sql: true

  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

# カスタム設定
app:
  name: My Application
  max-retry: 3
  api:
    base-url: https://api.example.com
    timeout: 30s
```

```java
// === 設定値の読み取り ===

// 方法1: @Value
@Service
public class ApiClient {
    @Value("${app.api.base-url}")
    private String baseUrl;

    @Value("${app.api.timeout:10s}")  // デフォルト値付き
    private Duration timeout;

    @Value("${app.max-retry}")
    private int maxRetry;
}

// 方法2: @ConfigurationProperties（推奨）
@ConfigurationProperties(prefix = "app.api")
public record ApiConfig(
    String baseUrl,
    Duration timeout
) {}

// 使い方
@Service
public class ApiClient {
    private final ApiConfig config;

    public ApiClient(ApiConfig config) {
        this.config = config;
    }

    public String call(String path) {
        // config.baseUrl() + path で API を呼び出す
        return "response";
    }
}

// === プロファイルの切り替え ===
// application-dev.yml   — 開発環境
// application-stg.yml   — ステージング環境
// application-prod.yml  — 本番環境

// 起動時にプロファイルを指定:
// java -jar app.jar --spring.profiles.active=prod
// または環境変数: SPRING_PROFILES_ACTIVE=prod
```

### 8.3 API設計（RESTful、バージョニング）

```java
// === RESTful API の設計原則 ===

// リソースは名詞で表現（動詞ではない）
// GET    /api/users          — ユーザー一覧を取得
// GET    /api/users/{id}     — 特定のユーザーを取得
// POST   /api/users          — ユーザーを作成
// PUT    /api/users/{id}     — ユーザーを完全更新
// PATCH  /api/users/{id}     — ユーザーを部分更新
// DELETE /api/users/{id}     — ユーザーを削除

// ネストしたリソース
// GET    /api/users/{id}/orders     — ユーザーの注文一覧
// POST   /api/users/{id}/orders     — ユーザーの注文を作成

// === ステータスコード ===
// 200 OK              — 成功（GET, PUT, PATCH）
// 201 Created         — リソース作成成功（POST）
// 204 No Content      — 成功（DELETE）
// 400 Bad Request     — クライアントのリクエストが不正
// 401 Unauthorized    — 認証が必要
// 403 Forbidden       — 権限がない
// 404 Not Found       — リソースが見つからない
// 409 Conflict        — 競合（重複メールなど）
// 500 Internal Server Error — サーバーエラー

// === API バージョニング ===
// 方法1: URL パスに含める（最も一般的）
@RestController
@RequestMapping("/api/v1/users")
public class UserControllerV1 { /* ... */ }

@RestController
@RequestMapping("/api/v2/users")
public class UserControllerV2 { /* ... */ }

// 方法2: ヘッダーで指定
// Accept: application/vnd.myapp.v2+json

// === レスポンスの統一フォーマット ===
public record ApiResponse<T>(
    boolean success,
    T data,
    String message,
    LocalDateTime timestamp
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, null, message, LocalDateTime.now());
    }
}

// ページネーションレスポンス
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {
    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(
            page.getContent(),
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
    }
}
```

### 8.4 エラーハンドリング戦略

```java
// === グローバル例外ハンドラ ===
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(
        GlobalExceptionHandler.class);

    // カスタム例外
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleNotFound(ResourceNotFoundException e) {
        logger.warn("Resource not found: {}", e.getMessage());
        return ApiResponse.error(e.getMessage());
    }

    // バリデーションエラー
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Map<String, String>> handleValidation(
            MethodArgumentNotValidException e) {
        var errors = new HashMap<String, String>();
        e.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );
        logger.warn("Validation failed: {}", errors);
        return new ApiResponse<>(false, errors, "Validation failed",
            LocalDateTime.now());
    }

    // ビジネスロジック例外
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleBusinessException(BusinessException e) {
        logger.warn("Business rule violation: {}", e.getMessage());
        return ApiResponse.error(e.getMessage());
    }

    // 予期しない例外（全キャッチ）
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleUnexpected(Exception e) {
        logger.error("Unexpected error", e);
        return ApiResponse.error("Internal server error");  // 詳細を晒さない
    }
}

// === 例外クラスの階層 ===
// アプリケーション固有の基底例外
public abstract class ApplicationException extends RuntimeException {
    private final String errorCode;

    protected ApplicationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}

public class ResourceNotFoundException extends ApplicationException {
    public ResourceNotFoundException(String resource, Object id) {
        super("NOT_FOUND", resource + " not found: " + id);
    }
}

public class BusinessException extends ApplicationException {
    public BusinessException(String message) {
        super("BUSINESS_ERROR", message);
    }
}

public class DuplicateResourceException extends ApplicationException {
    public DuplicateResourceException(String resource, String field, String value) {
        super("DUPLICATE", resource + " with " + field + "=" + value + " already exists");
    }
}
```

### 8.5 コードレビューのポイント

```java
// === コードレビューで確認すべきポイント ===

// 1. null チェック
// NG
public String getUserName(User user) {
    return user.getName().toUpperCase();  // NPE の危険
}

// OK
public String getUserName(User user) {
    Objects.requireNonNull(user, "User must not be null");
    return Optional.ofNullable(user.getName())
        .map(String::toUpperCase)
        .orElse("Unknown");
}

// 2. リソースのクローズ
// NG
public String readFile(String path) throws IOException {
    var reader = new BufferedReader(new FileReader(path));
    return reader.readLine();  // reader が close されない
}

// OK
public String readFile(String path) throws IOException {
    try (var reader = new BufferedReader(new FileReader(path))) {
        return reader.readLine();
    }
}

// 3. 不変オブジェクトの活用
// NG
public List<String> getNames() {
    return names;  // 外部から変更される可能性
}

// OK
public List<String> getNames() {
    return List.copyOf(names);  // 不変コピーを返す
}

// 4. 適切な例外処理
// NG
try {
    doSomething();
} catch (Exception e) {
    // 握りつぶし（何もしない）
}

// NG
try {
    doSomething();
} catch (Exception e) {
    e.printStackTrace();  // 本番ではログに出力すべき
}

// OK
try {
    doSomething();
} catch (SpecificException e) {
    logger.error("Failed to do something: {}", e.getMessage(), e);
    throw new ServiceException("Operation failed", e);
}

// 5. マジックナンバーの排除
// NG
if (user.getAge() > 18) { /* ... */ }
Thread.sleep(5000);

// OK
private static final int LEGAL_AGE = 18;
private static final Duration RETRY_DELAY = Duration.ofSeconds(5);

if (user.getAge() > LEGAL_AGE) { /* ... */ }
Thread.sleep(RETRY_DELAY.toMillis());

// 6. 適切な命名
// NG
int d;              // 何を表す？
List<int[]> l;     // 何のリスト？
void proc();        // 何をする？

// OK
int daysSinceModification;
List<int[]> coordinatePairs;
void processPayment();

// 7. メソッドの長さと引数の数
// NG: 長すぎるメソッド、引数が多すぎる
public void createOrder(String name, String email, String address,
    String city, String zip, String country, String phone,
    List<String> items, double discount, String couponCode) {
    // 200行のメソッド...
}

// OK: 適切に分割、オブジェクトにまとめる
public record ShippingAddress(
    String address, String city, String zip, String country
) {}

public record OrderRequest(
    String customerName, String email,
    ShippingAddress shipping, List<OrderItem> items,
    DiscountInfo discount
) {}

public Order createOrder(OrderRequest request) {
    validateRequest(request);
    var customer = findOrCreateCustomer(request);
    var order = buildOrder(customer, request);
    return saveAndNotify(order);
}
```

---

## まとめ

この章では、Java の実務での使い方を広く学んだ。要点を整理する。

### 設計の基本
- **SOLID 原則** を意識してクラスを設計する
- **DI（依存性注入）** で疎結合を実現する
- **3層アーキテクチャ**（Controller → Service → Repository）でコードを整理する

### ツールと技術
- ビルドツールは **Gradle**（新規）または **Maven**（既存）
- テストは **JUnit 5 + Mockito** を標準的に使う
- データベースは **Spring Data JPA** で効率的にアクセスする
- Web API は **Spring Boot + Spring MVC** で構築する

### 品質と運用
- **SLF4J + Logback** で適切にログを記録する
- **グローバル例外ハンドラ** でエラーを一元管理する
- **コードレビュー** で品質を維持する
- **プロファイル**（dev/stg/prod）で環境ごとの設定を管理する

### 並行処理の選択指針
| 用途 | 推奨技術 |
|------|---------|
| 単純な並列処理 | `ExecutorService` |
| 非同期チェーン | `CompletableFuture` |
| 大量 I/O タスク | Virtual Threads（Java 21+） |
| スレッドセーフな変数 | `AtomicInteger`, `ConcurrentHashMap` |
| 排他制御 | `ReentrantLock`（Virtual Threads 対応） |

これらの知識を組み合わせることで、モダンな Java アプリケーションを効率的に開発できる。
