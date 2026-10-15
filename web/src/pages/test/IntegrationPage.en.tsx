import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const scope = `
flowchart LR
  subgraph UNIT["Unit test"]
    S1["OrderService"]
    M1["Mock repo"]
    S1 --> M1
  end
  subgraph INTEG["Integration test"]
    C["HttpClient (test)"] --> API["ASP.NET Core pipeline<br/>routing, auth, validation"]
    API --> SVC["Services"]
    SVC --> DB[("Database")]
  end
`

const waf = `
sequenceDiagram
  participant T as Test (xUnit)
  participant F as WebApplicationFactory
  participant S as TestServer (in-process)
  participant D as Database
  T->>F: CreateClient()
  F->>S: Start app with services overridden
  T->>S: HTTP request (no network)
  S->>D: Query
  D-->>S: Data
  S-->>T: HTTP response
`

const dbChoice = `
flowchart TD
  Q{"What do you want to test?"} -->|"Pipeline, routing, validation"| IM["In-memory / fake repo"]
  Q -->|"SQL, constraints, transactions, migrations"| REAL["Real DB<br/>Testcontainers"]
  IM --> FAST["Fast, but can lie"]
  REAL --> TRUE["Realistic, a bit slower"]
`

const authFlow = `
sequenceDiagram
  participant T as Test
  participant A as API
  participant I as Identity provider (fake)
  T->>A: GET /api/orders (no token)
  A-->>T: 401 Unauthorized
  T->>I: Get test token (role=user)
  I-->>T: JWT
  T->>A: GET /api/orders (Bearer JWT)
  A-->>T: 200 OK
  T->>A: DELETE /api/orders/1 (role=user)
  A-->>T: 403 Forbidden
`

const csprojSnippet = `
<!-- Tests.csproj -->
<ItemGroup>
  <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.*" />
  <PackageReference Include="xunit" Version="2.*" />
  <PackageReference Include="Testcontainers.PostgreSql" Version="3.*" />
  <PackageReference Include="Respawn" Version="6.*" />
</ItemGroup>
`

const programPartial = `
// Program.cs in the API project: make Program accessible to the test project
var builder = WebApplication.CreateBuilder(args);
// ... services and endpoints ...
var app = builder.Build();
app.Run();

public partial class Program { }   // <- required with top-level statements
`

const basicTest = `
public class OrdersApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrdersApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();   // in-process TestServer, no port
    }

    [Fact]
    public async Task GetOrders_UdenToken_Returnerer401()
    {
        // Arrange - the client is set up in the constructor

        // Act
        var response = await _client.GetAsync("/api/orders");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Health_Returnerer200()
    {
        var response = await _client.GetAsync("/health");
        response.EnsureSuccessStatusCode();
    }
}
`

const customFactory = `
public class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // 1) Remove the real DbContext registration
            var descriptor = services.Single(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            services.Remove(descriptor);

            // 2) Use SQLite in-memory (fast, but only partly realistic)
            var conn = new SqliteConnection("DataSource=:memory:");
            conn.Open();
            services.AddSingleton(conn);
            services.AddDbContext<AppDbContext>((sp, o) =>
                o.UseSqlite(sp.GetRequiredService<SqliteConnection>()));

            // 3) Replace external dependencies with fakes
            services.RemoveAll<IEmailSender>();
            services.AddSingleton<IEmailSender, FakeEmailSender>();
        });
    }
}
`

const testcontainers = `
public class PostgresApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _db = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("app_test")
        .WithUsername("test")
        .WithPassword("test")
        .Build();

    public async Task InitializeAsync()
    {
        await _db.StartAsync();   // starts a real Postgres in Docker
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, cfg) =>
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _db.GetConnectionString()
            }));
    }

    async Task IAsyncLifetime.DisposeAsync() => await _db.DisposeAsync();
}

[CollectionDefinition("db")]
public class DbCollection : ICollectionFixture<PostgresApiFactory> { }

[Collection("db")]
public class OrderPersistenceTests
{
    private readonly PostgresApiFactory _factory;
    public OrderPersistenceTests(PostgresApiFactory factory) => _factory = factory;

    [Fact]
    public async Task PostOrder_GemmerOrdreIDatabasen_OgKanHentesIgen()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new CreateOrderRequest("anna@test.dk", [new("SKU-1", 2)]);

        // Act
        var post = await client.PostAsJsonAsync("/api/orders", request);
        var location = post.Headers.Location!;
        var get = await client.GetFromJsonAsync<OrderDto>(location);

        // Assert
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);
        Assert.Equal("anna@test.dk", get!.CustomerEmail);
        Assert.Equal(2, get.Lines.Single().Quantity);
    }
}
`

const testAuthHandler = `
// Fake authentication: tests can choose user and role via headers
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthHandler(IOptionsMonitor<AuthenticationSchemeOptions> o,
        ILoggerFactory l, UrlEncoder e) : base(o, l, e) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue("X-Test-User", out var user))
            return Task.FromResult(AuthenticateResult.NoResult());   // -> 401

        var role = Request.Headers["X-Test-Role"].FirstOrDefault() ?? "user";
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.ToString()),   // sub (GUID)
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), "Test");
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

// Registration in the factory:
// services.AddAuthentication("Test").AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });
`

const authTests = `
[Fact]
public async Task DeleteOrder_SomUser_Returnerer403()
{
    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Add("X-Test-User", Guid.NewGuid().ToString());
    client.DefaultRequestHeaders.Add("X-Test-Role", "user");

    var response = await client.DeleteAsync("/api/orders/1");

    Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
}

[Fact]
public async Task DeleteOrder_SomAdmin_Returnerer204()
{
    var client = _factory.CreateClient();
    client.DefaultRequestHeaders.Add("X-Test-User", Guid.NewGuid().ToString());
    client.DefaultRequestHeaders.Add("X-Test-Role", "admin");

    var response = await client.DeleteAsync("/api/orders/1");

    Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
}
`

const contractJson = `
// Contract (Pact-like) between frontend (consumer) and API (provider)
{
  "consumer": "web",
  "provider": "orders-api",
  "interactions": [
    {
      "description": "get order 42",
      "request": { "method": "GET", "path": "/api/orders/42" },
      "response": {
        "status": 200,
        "body": { "id": 42, "customerEmail": "string", "total": 0.0, "lines": [] }
      }
    }
  ]
}
`

const contractTest = `
// A simple "contract test": the API must not remove or rename fields
[Fact]
public async Task GetOrder_OverholderKontrakten()
{
    var json = await _client.GetStringAsync("/api/orders/42");
    using var doc = JsonDocument.Parse(json);
    var root = doc.RootElement;

    Assert.Equal(JsonValueKind.Number, root.GetProperty("id").ValueKind);
    Assert.Equal(JsonValueKind.String, root.GetProperty("customerEmail").ValueKind);
    Assert.Equal(JsonValueKind.Number, root.GetProperty("total").ValueKind);
    Assert.Equal(JsonValueKind.Array,  root.GetProperty("lines").ValueKind);
}
`

const respawn = `
public class IntegrationBase : IAsyncLifetime
{
    private Respawner _respawner = default!;
    protected string ConnectionString = default!;

    public async Task InitializeAsync()
    {
        await using var conn = new NpgsqlConnection(ConnectionString);
        await conn.OpenAsync();
        _respawner = await Respawner.CreateAsync(conn, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = ["public"]
        });
        await _respawner.ResetAsync(conn);   // clear data before each test
    }

    public Task DisposeAsync() => Task.CompletedTask;
}
`

const ciYaml = `
# GitHub Actions: Testcontainers requires Docker (available on ubuntu-latest)
integration-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-dotnet@v4
      with:
        dotnet-version: 8.0.x
    - run: dotnet test tests/Api.IntegrationTests --configuration Release --logger trx
`

export default function IntegrationPageEn() {

  return (
    <LessonLayout module="test">

<h1>Integration testing in .NET</h1>

      <p>
        Unit tests show that the individual parts work on their own. Integration tests show
        that they <strong>work together</strong>: routing, model binding, validation,
        authentication, business logic, EF Core and the database. Many of the most annoying
        defects live in the seams — a wrong JSON name, a missing DI registration, an SQL
        constraint, a forgotten <code>[Authorize]</code>.
      </p>

      <h2>Learning objectives</h2>
      <ul>
        <li>Explain the difference between unit and integration tests and where the boundary lies.</li>
        <li>
          Set up <code>WebApplicationFactory&lt;Program&gt;</code> and call an ASP.NET Core
          API via <code>HttpClient</code>.
        </li>
        <li>Choose between an in-memory/fake database and a real database (Testcontainers).</li>
        <li>Test authentication and authorization in the API.</li>
        <li>Explain contract tests and how they prevent breakage between services.</li>
        <li>Apply the AAA pattern to integration tests as well.</li>
      </ul>

      <h2>1. What is an integration test?</h2>
      <MermaidDiagram chart={scope} />
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Unit test</th>
            <th>Integration test</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Scope</td>
            <td>One class/method</td>
            <td>Several layers/components</td>
          </tr>
          <tr>
            <td>Dependencies</td>
            <td>Mocked/stubbed</td>
            <td>Real (or nearly real)</td>
          </tr>
          <tr>
            <td>Speed</td>
            <td>ms</td>
            <td>100 ms – several seconds</td>
          </tr>
          <tr>
            <td>Finds</td>
            <td>Logic errors</td>
            <td>Configuration errors, contract breaks, SQL/mapping errors, auth holes</td>
          </tr>
        </tbody>
      </table>

      <Callout type="info">
        <strong>AAA still applies.</strong> Arrange (set up data and client), Act (one HTTP
        call), Assert (status code, body, and possibly database state). Keep each test
        focused on one scenario and independent of the others.
      </Callout>

      <h2>2. WebApplicationFactory</h2>
      <p>
        <code>Microsoft.AspNetCore.Mvc.Testing</code> contains{' '}
        <code>WebApplicationFactory&lt;TEntryPoint&gt;</code>, which starts your entire
        ASP.NET Core application <strong>in-process</strong> with an in-memory{' '}
        <code>TestServer</code>. You get an <code>HttpClient</code> that calls the API
        without a network and without opening ports — fast and stable.
      </p>
      <MermaidDiagram chart={waf} />

      <h3>Setup</h3>
      <CodeBlock language="xml">{csprojSnippet}</CodeBlock>
      <p>
        With top-level statements the <code>Program</code> class is internal. Make it
        accessible to the test project:
      </p>
      <CodeBlock language="csharp">{programPartial}</CodeBlock>

      <h3>The first integration test</h3>
      <CodeBlock language="csharp">{basicTest}</CodeBlock>
      <p>
        <code>IClassFixture</code> shares one factory per test class (the app is started
        once). Use <code>ICollectionFixture</code> if several test classes need to share
        the same instance (e.g. the same database container).
      </p>

      <h3>Adapt the application for testing</h3>
      <p>
        By inheriting from the factory you can <strong>override services</strong>: swap out
        the database, replace the email sender with a fake, change the environment and
        configuration.
      </p>
      <CodeBlock language="csharp">{customFactory}</CodeBlock>

      <h2>3. In-memory vs. a real database</h2>
      <MermaidDiagram chart={dbChoice} />
      <table>
        <thead>
          <tr>
            <th>Choice</th>
            <th>Pros</th>
            <th>Cons</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>EF Core InMemory provider</td>
            <td>Very fast, no setup</td>
            <td>
              Not relational: no constraints, transactions, raw SQL or migrations. Can make
              wrong tests pass.
            </td>
          </tr>
          <tr>
            <td>SQLite in-memory</td>
            <td>Relational, fast</td>
            <td>Different SQL dialect than Postgres/SQL Server; missing types and functions</td>
          </tr>
          <tr>
            <td>Testcontainers (real DB in Docker)</td>
            <td>Same engine as production; tests migrations, constraints and SQL</td>
            <td>Requires Docker; slower startup (seconds)</td>
          </tr>
          <tr>
            <td>Shared test database</td>
            <td>Simple</td>
            <td>Tests affect each other → flaky; hard in CI</td>
          </tr>
        </tbody>
      </table>
      <Callout type="warn">
        Microsoft does <strong>not</strong> recommend EF Core InMemory for testing database
        behaviour. Use a real database when the quality of SQL/mapping matters — which it
        usually does.
      </Callout>

      <h2>4. Testcontainers for .NET</h2>
      <p>
        <strong>Testcontainers</strong> starts throwaway Docker containers (Postgres, SQL
        Server, Redis, RabbitMQ, ...) directly from your test code and cleans up afterwards.
        Every test run gets a clean, isolated environment — the same as in production and
        CI. A perfect fit for our Docker-based setup.
      </p>
      <CodeBlock language="csharp">{testcontainers}</CodeBlock>

      <h3>Isolation between tests</h3>
      <p>
        Tests must not depend on each other or on order. Options:
      </p>
      <ul>
        <li>
          <strong>Respawn</strong> — quickly clears all tables between tests (library).
        </li>
        <li>
          <strong>Unique data per test</strong> — use <code>Guid.NewGuid()</code> in
          emails/names so tests never collide.
        </li>
        <li>
          <strong>Transaction with rollback</strong> per test (only works if the app
          shares the connection).
        </li>
      </ul>
      <CodeBlock language="csharp">{respawn}</CodeBlock>

      <h3>Run in CI</h3>
      <CodeBlock language="yaml">{ciYaml}</CodeBlock>
      <p>
        See <Link to="/test/ci-cd">CI/CD</Link> for how the pipeline comes together.
      </p>

      <h2>5. Testing authentication and authorization</h2>
      <p>
        In our projects we use an external identity provider (Mercantec Auth, JWT RS256).
        In integration tests we <strong>don&apos;t want</strong> to call the real provider:
        it is slow, brittle and requires credentials. Instead we replace the authentication
        scheme with a fake that lets the test decide identity and role.
      </p>
      <MermaidDiagram chart={authFlow} />
      <CodeBlock language="csharp">{testAuthHandler}</CodeBlock>
      <CodeBlock language="csharp">{authTests}</CodeBlock>

      <h3>What should auth tests cover?</h3>
      <ul>
        <li>
          <strong>401</strong> without a token / with an expired or invalid token.
        </li>
        <li>
          <strong>403</strong> with a valid token but the wrong role/scope.
        </li>
        <li>
          <strong>Ownership</strong>: user A cannot read user B&apos;s orders (IDOR, cf.{' '}
          <Link to="/sikkerhed/angreb">Attacks</Link>). Use <code>sub</code> (GUID) as the
          key — not email.
        </li>
        <li>
          At least one test against <strong>real token validation</strong> (e.g. with a
          locally generated RSA key and a fake JWKS) to ensure that issuer/audience/expiry
          are actually checked. See{' '}
          <Link to="/sikkerhed/authentication">Authentication</Link>.
        </li>
      </ul>

      <h2>6. Contract tests</h2>
      <p>
        In a system with several services (frontend ↔ API, API ↔ API), a change on one side
        can break the other. A <strong>contract</strong> describes the expected
        requests/responses. <em>Consumer-driven contract testing</em> (e.g. Pact) lets the
        consumer define its expectation, and the provider verifies that it is still met —
        without having to run the whole system.
      </p>
      <CodeBlock language="json">{contractJson}</CodeBlock>
      <p>The simple variant in .NET: assert on the JSON shape in an integration test.</p>
      <CodeBlock language="csharp">{contractTest}</CodeBlock>
      <Callout type="tip">
        If you generate an OpenAPI specification from the API, you can store it in the repo
        and let a test fail when it changes unintentionally (a &ldquo;snapshot test of the
        contract&rdquo;). That catches breaking changes early.
      </Callout>

      <h2>7. External dependencies</h2>
      <ul>
        <li>
          <strong>HTTP to third parties:</strong> use WireMock.Net or a fake{' '}
          <code>HttpMessageHandler</code>; test timeouts and 500 responses (resilience).
        </li>
        <li>
          <strong>Email, payment:</strong> sandbox environments or fakes, never production.
        </li>
        <li>
          <strong>Time and randomness:</strong> inject <code>TimeProvider</code> and control
          the time in tests.
        </li>
        <li>
          <strong>Message queues:</strong> Testcontainers with RabbitMQ/Kafka and polling on
          the result rather than <code>Thread.Sleep</code>.
        </li>
      </ul>

      <h2>8. Good advice and pitfalls</h2>
      <ul>
        <li>Test the <strong>public behaviour</strong> (the HTTP contract), not internal classes.</li>
        <li>Fewer but broader tests than unit tests — they are more expensive (cf. the test pyramid).</li>
        <li>Avoid <code>Thread.Sleep</code>; use polling with a timeout.</li>
        <li>Use fixed test data and deterministic IDs for stable tests.</li>
        <li>Run them in CI on every pull request; use parallelisation control with a shared DB.</li>
      </ul>

      <h2>Exercise</h2>
      <ol>
        <li>
          Create a test project (<code>dotnet new xunit</code>), add{' '}
          <code>Microsoft.AspNetCore.Mvc.Testing</code> and reference your API project.
        </li>
        <li>Write a <code>/health</code> test and a test for 401 without a token.</li>
        <li>
          Write a <code>PostgresApiFactory</code> with Testcontainers, and a test that
          creates a resource via POST and fetches it again.
        </li>
        <li>
          Add a fake auth handler and test that an ordinary user gets 403 on an admin
          endpoint and cannot see other people&apos;s data.
        </li>
        <li>
          Write a contract test for one endpoint, change a field name in the code, and watch
          the test fail.
        </li>
      </ol>
    </LessonLayout>
  )
}
