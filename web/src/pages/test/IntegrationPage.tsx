import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath } from '../../data/objectives'

const scope = `
flowchart LR
  subgraph UNIT["Unit test"]
    S1["OrderService"]
    M1["Mock repo"]
    S1 --> M1
  end
  subgraph INTEG["Integrationstest"]
    C["HttpClient (test)"] --> API["ASP.NET Core pipeline<br/>routing, auth, validering"]
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
  F->>S: Start app med override af services
  T->>S: HTTP request (ingen netværk)
  S->>D: Query
  D-->>S: Data
  S-->>T: HTTP response
`

const dbChoice = `
flowchart TD
  Q{"Hvad vil du teste?"} -->|"Pipeline, routing, validering"| IM["In-memory / fake repo"]
  Q -->|"SQL, constraints, transaktioner, migrations"| REAL["Rigtig DB<br/>Testcontainers"]
  IM --> FAST["Hurtig, men kan lyve"]
  REAL --> TRUE["Realistisk, lidt langsommere"]
`

const authFlow = `
sequenceDiagram
  participant T as Test
  participant A as API
  participant I as Identity provider (fake)
  T->>A: GET /api/orders (uden token)
  A-->>T: 401 Unauthorized
  T->>I: Hent testtoken (rolle=user)
  I-->>T: JWT
  T->>A: GET /api/orders (Bearer JWT)
  A-->>T: 200 OK
  T->>A: DELETE /api/orders/1 (rolle=user)
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
// Program.cs i API-projektet: gør Program tilgængelig for testprojektet
var builder = WebApplication.CreateBuilder(args);
// ... services og endpoints ...
var app = builder.Build();
app.Run();

public partial class Program { }   // <- nødvendig ved top-level statements
`

const basicTest = `
public class OrdersApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrdersApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();   // in-process TestServer, ingen port
    }

    [Fact]
    public async Task GetOrders_UdenToken_Returnerer401()
    {
        // Arrange - klienten er sat op i konstruktøren

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
            // 1) Fjern den rigtige DbContext-registrering
            var descriptor = services.Single(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            services.Remove(descriptor);

            // 2) Brug SQLite in-memory (hurtigt, men kun delvist realistisk)
            var conn = new SqliteConnection("DataSource=:memory:");
            conn.Open();
            services.AddSingleton(conn);
            services.AddDbContext<AppDbContext>((sp, o) =>
                o.UseSqlite(sp.GetRequiredService<SqliteConnection>()));

            // 3) Erstat eksterne afhængigheder med fakes
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
        await _db.StartAsync();   // starter en rigtig Postgres i Docker
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
// Fake authentication: tester kan vælge bruger og rolle via headers
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

// Registrering i factory:
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
// Kontrakt (Pact-lignende) mellem frontend (consumer) og API (provider)
{
  "consumer": "web",
  "provider": "orders-api",
  "interactions": [
    {
      "description": "hent ordre 42",
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
// En simpel "kontrakttest": API'et må ikke fjerne eller omdøbe felter
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
        await _respawner.ResetAsync(conn);   // ryd data før hver test
    }

    public Task DisposeAsync() => Task.CompletedTask;
}
`

const ciYaml = `
# GitHub Actions: Testcontainers kræver Docker (findes på ubuntu-latest)
integration-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-dotnet@v4
      with:
        dotnet-version: 8.0.x
    - run: dotnet test tests/Api.IntegrationTests --configuration Release --logger trx
`

export default function IntegrationPage() {
  const objective = getObjectiveByPath('/test/integration')

  return (
    <LessonLayout module="test">
      <header>
        {objective ? (
          <p>
            <ObjectiveBadge level={objective.level} /> <strong>Målpind {objective.id}</strong>
          </p>
        ) : null}
        {objective ? (
          <LinkTrio
            sitePath={objective.sitePath}
            notionUrl={objective.notionUrl}
            repoUrl={objective.repoUrl}
          />
        ) : null}
      </header>

      <h1>Integrationstest i .NET</h1>

      <p>
        Unit tests viser, at de enkelte dele virker hver for sig. Integrationstests viser,
        at de <strong>virker sammen</strong>: routing, model binding, validering,
        authentication, forretningslogik, EF Core og databasen. Mange af de mest
        irriterende fejl bor i samlingerne — forkert JSON-navn, manglende DI-registrering,
        en SQL-constraint, en glemt <code>[Authorize]</code>.
      </p>

      <h2>Læringsmål</h2>
      <ul>
        <li>Forklare forskellen på unit- og integrationstest og hvor grænsen går.</li>
        <li>
          Opsætte <code>WebApplicationFactory&lt;Program&gt;</code> og kalde et ASP.NET Core-API
          via <code>HttpClient</code>.
        </li>
        <li>Vælge mellem in-memory/fake database og en rigtig database (Testcontainers).</li>
        <li>Teste authentication og authorization i API&apos;et.</li>
        <li>Forklare kontrakttests og hvordan de forebygger brud mellem services.</li>
        <li>Anvende AAA-mønstret også på integrationstests.</li>
      </ul>

      <h2>1. Hvad er en integrationstest?</h2>
      <MermaidDiagram chart={scope} />
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Unit test</th>
            <th>Integrationstest</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Omfang</td>
            <td>Én klasse/metode</td>
            <td>Flere lag/komponenter</td>
          </tr>
          <tr>
            <td>Afhængigheder</td>
            <td>Mockes/stubbes</td>
            <td>Rigtige (eller næsten rigtige)</td>
          </tr>
          <tr>
            <td>Hastighed</td>
            <td>ms</td>
            <td>100 ms – flere sekunder</td>
          </tr>
          <tr>
            <td>Finder</td>
            <td>Logikfejl</td>
            <td>Konfigurationsfejl, kontraktbrud, SQL/mapping-fejl, auth-huller</td>
          </tr>
        </tbody>
      </table>

      <Callout type="info">
        <strong>AAA gælder stadig.</strong> Arrange (opsæt data og klient), Act (ét
        HTTP-kald), Assert (statuskode, body, og evt. databasetilstand). Hold hver test
        fokuseret på ét scenarie og uafhængig af de andre.
      </Callout>

      <h2>2. WebApplicationFactory</h2>
      <p>
        <code>Microsoft.AspNetCore.Mvc.Testing</code> indeholder{' '}
        <code>WebApplicationFactory&lt;TEntryPoint&gt;</code>, som starter hele din
        ASP.NET Core-applikation <strong>i processen</strong> med en in-memory{' '}
        <code>TestServer</code>. Du får en <code>HttpClient</code>, der kalder API&apos;et
        uden netværk og uden at åbne porte — hurtigt og stabilt.
      </p>
      <MermaidDiagram chart={waf} />

      <h3>Opsætning</h3>
      <CodeBlock language="xml">{csprojSnippet}</CodeBlock>
      <p>
        Med top-level statements er <code>Program</code>-klassen intern. Gør den
        tilgængelig for testprojektet:
      </p>
      <CodeBlock language="csharp">{programPartial}</CodeBlock>

      <h3>Den første integrationstest</h3>
      <CodeBlock language="csharp">{basicTest}</CodeBlock>
      <p>
        <code>IClassFixture</code> deler én factory pr. testklasse (appen startes én
        gang). Brug <code>ICollectionFixture</code>, hvis flere testklasser skal dele
        samme instans (fx samme databasecontainer).
      </p>

      <h3>Tilpas applikationen til test</h3>
      <p>
        Ved at nedarve fra factory kan du <strong>override services</strong>: udskift
        databasen, erstat e-mail-afsender med en fake, skift miljø og konfiguration.
      </p>
      <CodeBlock language="csharp">{customFactory}</CodeBlock>

      <h2>3. In-memory vs. rigtig database</h2>
      <MermaidDiagram chart={dbChoice} />
      <table>
        <thead>
          <tr>
            <th>Valg</th>
            <th>Fordele</th>
            <th>Ulemper</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>EF Core InMemory-provider</td>
            <td>Meget hurtig, ingen opsætning</td>
            <td>
              Ikke relationel: ingen constraints, transaktioner, rå SQL eller
              migrations. Kan få forkerte tests til at bestå.
            </td>
          </tr>
          <tr>
            <td>SQLite in-memory</td>
            <td>Relationel, hurtig</td>
            <td>Anden SQL-dialekt end Postgres/SQL Server; manglende typer og funktioner</td>
          </tr>
          <tr>
            <td>Testcontainers (rigtig DB i Docker)</td>
            <td>Samme motor som produktion; test af migrations, constraints og SQL</td>
            <td>Kræver Docker; langsommere opstart (sekunder)</td>
          </tr>
          <tr>
            <td>Delt testdatabase</td>
            <td>Simpelt</td>
            <td>Tests påvirker hinanden → flaky; svært i CI</td>
          </tr>
        </tbody>
      </table>
      <Callout type="warn">
        Microsoft anbefaler <strong>ikke</strong> EF Core InMemory til at teste
        databaseadfærd. Brug en rigtig database, når kvaliteten af SQL/mapping betyder
        noget — som regel gør den det.
      </Callout>

      <h2>4. Testcontainers for .NET</h2>
      <p>
        <strong>Testcontainers</strong> starter engangs-Docker-containere (Postgres, SQL
        Server, Redis, RabbitMQ, ...) direkte fra din testkode og rydder op bagefter. Hver
        testkørsel får et rent, isoleret miljø — samme som i produktion og CI. Passer
        perfekt til vores Docker-baserede opsætning.
      </p>
      <CodeBlock language="csharp">{testcontainers}</CodeBlock>

      <h3>Isolation mellem tests</h3>
      <p>
        Tests må ikke afhænge af hinanden eller af rækkefølge. Muligheder:
      </p>
      <ul>
        <li>
          <strong>Respawn</strong> — rydder alle tabeller hurtigt mellem tests (bibliotek).
        </li>
        <li>
          <strong>Unikke data pr. test</strong> — brug <code>Guid.NewGuid()</code> i
          emails/navne, så tests aldrig kolliderer.
        </li>
        <li>
          <strong>Transaktion med rollback</strong> pr. test (fungerer kun, hvis appen
          deler forbindelsen).
        </li>
      </ul>
      <CodeBlock language="csharp">{respawn}</CodeBlock>

      <h3>Kør i CI</h3>
      <CodeBlock language="yaml">{ciYaml}</CodeBlock>
      <p>
        Se <Link to="/test/ci-cd">CI/CD</Link> for hvordan pipelinen samles.
      </p>

      <h2>5. Test af authentication og authorization</h2>
      <p>
        I vores projekter bruger vi en ekstern identity provider (Mercantec Auth, JWT
        RS256). I integrationstests <strong>vil vi ikke</strong> kalde den rigtige
        provider: det er langsomt, skrøbeligt og kræver credentials. I stedet erstatter vi
        authentication-schemet med en fake, der lader testen bestemme identitet og
        rolle.
      </p>
      <MermaidDiagram chart={authFlow} />
      <CodeBlock language="csharp">{testAuthHandler}</CodeBlock>
      <CodeBlock language="csharp">{authTests}</CodeBlock>

      <h3>Hvad skal auth-tests dække?</h3>
      <ul>
        <li>
          <strong>401</strong> uden token / med udløbet eller ugyldig token.
        </li>
        <li>
          <strong>403</strong> med gyldig token, men forkert rolle/scope.
        </li>
        <li>
          <strong>Ejerskab</strong>: bruger A kan ikke læse bruger B&apos;s ordrer (IDOR,
          jf. <Link to="/sikkerhed/angreb">Angreb</Link>). Brug <code>sub</code> (GUID)
          som nøgle — ikke email.
        </li>
        <li>
          Mindst én test mod en <strong>rigtig token-validering</strong> (fx med en
          lokalt genereret RSA-nøgle og et fake JWKS) for at sikre, at issuer/audience/
          udløb faktisk tjekkes. Se <Link to="/sikkerhed/authentication">Authentication</Link>.
        </li>
      </ul>

      <h2>6. Kontrakttests</h2>
      <p>
        I et system med flere services (frontend ↔ API, API ↔ API) kan en ændring i én
        side bryde den anden. En <strong>kontrakt</strong> beskriver de forventede
        requests/responses. <em>Consumer-driven contract testing</em> (fx Pact) lader
        forbrugeren definere sin forventning, og udbyderen verificerer, at den stadig
        overholdes — uden at skulle køre hele systemet.
      </p>
      <CodeBlock language="json">{contractJson}</CodeBlock>
      <p>Den simple variant i .NET: assert på JSON-formen i en integrationstest.</p>
      <CodeBlock language="csharp">{contractTest}</CodeBlock>
      <Callout type="tip">
        Hvis I genererer en OpenAPI-specifikation fra API&apos;et, kan I gemme den i
        repoet og lade en test fejle, når den ændrer sig utilsigtet (&ldquo;snapshot-test
        af kontrakten&rdquo;). Det fanger breaking changes tidligt.
      </Callout>

      <h2>7. Eksterne afhængigheder</h2>
      <ul>
        <li>
          <strong>HTTP til tredjepart:</strong> brug WireMock.Net eller en fake{' '}
          <code>HttpMessageHandler</code>; test timeouts og 500-svar (resilience).
        </li>
        <li>
          <strong>E-mail, betaling:</strong> sandbox-miljøer eller fakes, aldrig
          produktion.
        </li>
        <li>
          <strong>Tid og tilfældighed:</strong> injicér <code>TimeProvider</code> og
          kontrollér tiden i test.
        </li>
        <li>
          <strong>Beskedkøer:</strong> Testcontainers med RabbitMQ/Kafka og polling på
          resultatet frem for <code>Thread.Sleep</code>.
        </li>
      </ul>

      <h2>8. Gode råd og faldgruber</h2>
      <ul>
        <li>Test den <strong>offentlige adfærd</strong> (HTTP-kontrakten), ikke interne klasser.</li>
        <li>Færre, men bredere tests end unit tests — de er dyrere (jf. testpyramiden).</li>
        <li>Undgå <code>Thread.Sleep</code>; brug polling med timeout.</li>
        <li>Brug fast testdata og deterministiske IDs for stabile tests.</li>
        <li>Kør dem i CI på hver pull request; brug paralleliseringskontrol ved delt DB.</li>
      </ul>

      <h2>Øvelse</h2>
      <ol>
        <li>
          Opret et testprojekt (<code>dotnet new xunit</code>), tilføj{' '}
          <code>Microsoft.AspNetCore.Mvc.Testing</code> og referér dit API-projekt.
        </li>
        <li>Skriv en <code>/health</code>-test og en test for 401 uden token.</li>
        <li>
          Skriv en <code>PostgresApiFactory</code> med Testcontainers, og en test der
          opretter en ressource via POST og henter den igen.
        </li>
        <li>
          Tilføj en fake auth-handler og test, at en almindelig bruger får 403 på et
          admin-endpoint og ikke kan se andres data.
        </li>
        <li>
          Skriv en kontrakttest for ét endpoint, ændr et feltnavn i koden, og se testen
          fejle.
        </li>
      </ol>
    </LessonLayout>
  )
}
