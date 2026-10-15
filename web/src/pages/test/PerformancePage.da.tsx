import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'

const k6Output = `
     checks.........................: 97.82% ✓ 58680     ✗ 1308
     data_received..................: 412 MB 1.4 MB/s
     http_req_duration..............: avg=182ms  min=8ms  med=96ms  max=9.8s  p(90)=311ms p(95)=842ms p(99)=3.4s
     http_req_failed................: 2.18%  ✓ 1308      ✗ 58680
     http_reqs......................: 59988  199.9/s
     iterations.....................: 59988  199.9/s
     vus............................: 200    min=0       max=200
`

const methodology = `
flowchart TD
  A["Symptom: langsom / timeouts"] --> B["Reproducér og mål<br/>baseline og under last"]
  B --> C["Hvilket lag?<br/>klient, netværk, web, API, DB"]
  C --> D["USE-metoden pr. ressource<br/>Utilization, Saturation, Errors"]
  D --> E["Find flaskehalsen<br/>profilering, traces, slow query log"]
  E --> F["Formulér hypotese"]
  F --> G["Ret ÉN ting"]
  G --> H["Mål igen"]
  H --> I{"Forbedret?"}
  I -- Nej --> F
  I -- Ja --> J{"SLA opfyldt?"}
  J -- Nej --> C
  J -- Ja --> K["Dokumentér"]
`

const request = `
sequenceDiagram
  participant B as Browser
  participant N as nginx / Traefik
  participant A as API
  participant C as Cache
  participant D as Database
  B->>N: GET /api/orders
  Note over B,N: DNS + TLS + netværk
  N->>A: proxy
  A->>C: slå op i cache
  C-->>A: miss
  A->>D: SELECT orders
  loop for hver ordre (N+1)
    A->>D: SELECT lines WHERE order_id = ?
  end
  D-->>A: rækker
  A-->>N: JSON
  N-->>B: 200 OK
`

const flamegraphConcept = `
flowchart TB
  subgraph FG["Flamegraph (læs nedefra og op)"]
    direction TB
    R["Main / request pipeline  100 %"]
    R --> C1["OrdersController.Get  95 %"]
    C1 --> S1["OrderService.GetAll  90 %"]
    S1 --> Q1["EF Core: ToList  70 %"]
    S1 --> J1["JSON serialisering  18 %"]
    Q1 --> N1["Npgsql: venter på DB  65 %"]
  end
`

const nplus1Bad = `
// N+1: 1 query for ordrer + N queries for linjer (100 ordrer = 101 queries)
var orders = await db.Orders.ToListAsync();
foreach (var order in orders)
{
    // Lazy loading eller eksplicit load udløser en query PR. ordre
    order.Lines = await db.OrderLines
        .Where(l => l.OrderId == order.Id)
        .ToListAsync();
}
`

const nplus1Good = `
// Løsning 1: eager loading med Include (1-2 queries)
var orders = await db.Orders
    .Include(o => o.Lines)
    .AsSplitQuery()          // undgå kartesisk eksplosion ved store Include-træer
    .ToListAsync();

// Løsning 2: projektion - hent kun det der skal bruges (mindre data, ingen tracking)
var dtos = await db.Orders
    .AsNoTracking()
    .Select(o => new OrderDto(
        o.Id,
        o.CustomerEmail,
        o.Lines.Select(l => new LineDto(l.Sku, l.Quantity)).ToList()))
    .ToListAsync();
`

const logSql = `
// Se de faktiske SQL-kald i EF Core (kun i dev/test)
builder.Services.AddDbContext<AppDbContext>(o => o
    .UseNpgsql(connectionString)
    .LogTo(Console.WriteLine, LogLevel.Information)
    .EnableSensitiveDataLogging());
`

const explain = `
-- PostgreSQL: forstå hvorfor en query er langsom
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_email = 'anna@test.dk' ORDER BY created_at DESC LIMIT 20;

-- Typisk dårligt tegn:    Seq Scan on orders  (cost=0.00..18334.00 rows=1 ...)  Rows Removed by Filter: 999999
-- Løsning: indeks
CREATE INDEX CONCURRENTLY ix_orders_customer_created
    ON orders (customer_email, created_at DESC);
`

const profilingCmds = `
# .NET: indsaml og vis profilering
dotnet tool install -g dotnet-counters
dotnet tool install -g dotnet-trace
dotnet tool install -g dotnet-gcdump

dotnet-counters monitor --process-id <pid> System.Runtime Microsoft.AspNetCore.Hosting
dotnet-trace collect --process-id <pid> --duration 00:00:30 --format speedscope
# Åbn .speedscope.json på https://www.speedscope.app for flamegraph
`

const otelCode = `
// OpenTelemetry: traces viser hvor tiden bruges pr. request
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddOtlpExporter())
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()
        .AddOtlpExporter());
`

const stopwatchCode = `
// Hurtig lokal måling af en bestemt operation (i benchmark/dev)
var sw = Stopwatch.StartNew();
var result = await service.GetAllAsync();
sw.Stop();
logger.LogInformation("GetAll tog {Ms} ms og returnerede {Count} rækker",
    sw.ElapsedMilliseconds, result.Count);

// For præcise mikrobenchmarks: BenchmarkDotNet
// [MemoryDiagnoser] public class Bench { [Benchmark] public void Metode() { ... } }
`

export default function PerformancePageDa() {
  const objective = getObjectiveByPath('/test/performance')

  return (
    <LessonLayout module="test">
      <header>
        {objective ? (
          <p>
            <ObjectiveBadge level={objective.level} /> <strong>Målpind {objective.id}:</strong>{' '}
            {objectiveTitle(objective, 'da')}
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

      <h1>Performance: aflæs tabeller og find flaskehalse</h1>

      <p>
        En tryktest producerer tal. Værdien opstår først, når du kan <strong>aflæse</strong>{' '}
        dem korrekt og <strong>finde årsagen</strong> til, at et komplekst system (browser,
        proxy, API, cache, database, tredjepart) er langsomt. Denne side lærer dig at læse
        latency-, throughput- og percentiltabeller og at gå systematisk til værks.
      </p>

      <h2>Læringsmål</h2>
      <ul>
        <li>Forklare latency, throughput, fejlrate og samtidighed — og deres sammenhæng.</li>
        <li>Aflæse p50/p95/p99 og forstå hvorfor gennemsnit er misvisende.</li>
        <li>Fortolke en tryktest-tabel og udpege symptomer på mætning.</li>
        <li>Finde flaskehalse i database, kode (N+1) og netværk.</li>
        <li>Forklare flamegraphs og distributed tracing, og anvende en metodisk fejlsøgningsproces.</li>
      </ul>

      <h2>1. De fire grundmålinger</h2>
      <table>
        <thead>
          <tr>
            <th>Metrik</th>
            <th>Definition</th>
            <th>Enhed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Latency / svartid</td>
            <td>Tid fra request sendes til svar modtages</td>
            <td>ms</td>
          </tr>
          <tr>
            <td>Throughput</td>
            <td>Antal gennemførte requests pr. tidsenhed</td>
            <td>req/s, RPS, TPS</td>
          </tr>
          <tr>
            <td>Fejlrate</td>
            <td>Andel af requests, der fejler (5xx, timeout)</td>
            <td>%</td>
          </tr>
          <tr>
            <td>Mætning (saturation)</td>
            <td>Hvor fuld en ressource er (kø, brug)</td>
            <td>%, kølængde</td>
          </tr>
        </tbody>
      </table>
      <p>
        Gode systemer viser <strong>konstant latency</strong>, mens throughput vokser
        lineært med lasten. Ved flaskehalsen knækker kurven: throughput flader ud (eller
        falder), og latency eksploderer (kødannelse).
      </p>

      <h2>2. Percentiler: p50, p95, p99</h2>
      <p>
        Et <strong>percentil</strong> angiver, at x % af alle requests var hurtigere end
        værdien. <em>p95 = 842 ms</em> betyder: 95 % af brugerne fik svar på under 842 ms,
        men 5 % ventede længere.
      </p>
      <table>
        <thead>
          <tr>
            <th>Mål</th>
            <th>Fortæller</th>
            <th>Brug</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Gennemsnit (avg)</td>
            <td>Skjuler ekstremer — påvirkes af få uhyre langsomme kald</td>
            <td>Overblik, men aldrig alene</td>
          </tr>
          <tr>
            <td>p50 (median)</td>
            <td>Den &ldquo;typiske&rdquo; bruger</td>
            <td>Generel følelse</td>
          </tr>
          <tr>
            <td>p90 / p95</td>
            <td>De fleste brugere, inkl. de ret langsomme</td>
            <td>Standard i SLO&apos;er</td>
          </tr>
          <tr>
            <td>p99 / p99.9</td>
            <td>Halen (tail latency): sjældne, men reelle ventetider</td>
            <td>Kritiske systemer; mange kald pr. sidevisning</td>
          </tr>
          <tr>
            <td>max</td>
            <td>Værste enkelttilfælde</td>
            <td>Find timeouts og outliers</td>
          </tr>
        </tbody>
      </table>
      <Callout type="warn">
        <strong>Tail-latency forstærkes.</strong> Hvis en side kalder 20 backend-kald, og
        hvert har 1 % chance for at være langsomt (p99), rammer{' '}
        <code>1 − 0,99²⁰ ≈ 18 %</code> af sidevisningerne mindst ét langsomt kald.
        p99 betyder derfor mere, end tallet antyder.
      </Callout>

      <h3>Eksempel: k6-resultat</h3>
      <CodeBlock language="text">{k6Output}</CodeBlock>
      <p>Aflæsning:</p>
      <ul>
        <li>
          <strong>avg = 182 ms</strong> ser fint ud, men <strong>p95 = 842 ms</strong> og{' '}
          <strong>p99 = 3,4 s</strong> afslører en lang hale.
        </li>
        <li>
          <strong>median (p50) = 96 ms</strong>: de fleste er hurtige → systemet er
          grundlæggende ok, men et mindretal rammer noget langsomt (lås, cold cache,
          GC-pause, langsom query).
        </li>
        <li>
          <strong>max = 9,8 s</strong> tyder på timeouts/retries.
        </li>
        <li>
          <strong>2,18 % fejl</strong> er over et typisk krav på &lt; 1 %.
        </li>
        <li>
          <strong>199,9 req/s</strong> med 200 virtuelle brugere: med Little&apos;s lov
          (<code>L = λ × W</code>) giver 200 samtidige ved 0,182 s i snit teoretisk ca.
          1100 req/s, hvis brugerne ikke pauser. Vi nåede kun 200, så enten indeholder
          scriptet think time, eller også sidder brugerne og venter i kø et sted (se
          tabellen nedenfor for hvordan man finder hvor).
        </li>
      </ul>

      <h2>3. Aflæsning af en trinvis last-tabel</h2>
      <p>
        Den mest informative tabel er resultatet af en trinvis stigning i last. Her kan du
        se, <em>hvornår</em> systemet ændrer karakter.
      </p>
      <table>
        <thead>
          <tr>
            <th>Brugere</th>
            <th>Throughput (req/s)</th>
            <th>p50</th>
            <th>p95</th>
            <th>p99</th>
            <th>Fejl</th>
            <th>API CPU</th>
            <th>DB CPU</th>
            <th>DB connections</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>10</td>
            <td>95</td>
            <td>40 ms</td>
            <td>70 ms</td>
            <td>110 ms</td>
            <td>0 %</td>
            <td>12 %</td>
            <td>8 %</td>
            <td>4</td>
          </tr>
          <tr>
            <td>50</td>
            <td>470</td>
            <td>45 ms</td>
            <td>90 ms</td>
            <td>160 ms</td>
            <td>0 %</td>
            <td>45 %</td>
            <td>35 %</td>
            <td>18</td>
          </tr>
          <tr>
            <td>100</td>
            <td>880</td>
            <td>60 ms</td>
            <td>180 ms</td>
            <td>420 ms</td>
            <td>0,1 %</td>
            <td>72 %</td>
            <td>78 %</td>
            <td>38</td>
          </tr>
          <tr>
            <td>200</td>
            <td>910</td>
            <td>190 ms</td>
            <td>850 ms</td>
            <td>3,4 s</td>
            <td>2 %</td>
            <td>75 %</td>
            <td>99 %</td>
            <td>50 (max 50)</td>
          </tr>
          <tr>
            <td>400</td>
            <td>600</td>
            <td>1,2 s</td>
            <td>5,0 s</td>
            <td>timeout</td>
            <td>31 %</td>
            <td>60 %</td>
            <td>100 %</td>
            <td>50 (max 50)</td>
          </tr>
        </tbody>
      </table>

      <h3>Sådan læser du tabellen</h3>
      <ol>
        <li>
          <strong>Knæpunktet:</strong> mellem 100 og 200 brugere ændrer kurven sig.
          Throughput flader ud ved ca. 900 req/s, mens latency stiger voldsomt. Systemets
          kapacitet er altså ca. <strong>900 req/s</strong> — ikke mere uanset antal
          brugere.
        </li>
        <li>
          <strong>Hvem er flaskehalsen?</strong> API-CPU er kun 75 %, men <strong>DB-CPU
          er 99 %</strong> og connection pool er fuld (50/50). Databasen mættes først.
          At lægge flere API-instanser på hjælper ikke — det forværrer snarere
          databasebelastningen.
        </li>
        <li>
          <strong>Over kapaciteten falder throughput</strong> (910 → 600): klassisk{' '}
          <em>kollaps</em> pga. kødannelse, retries og timeouts. Systemet bør hellere
          afvise (load shedding, 429/503) end at gå i stå.
        </li>
        <li>
          <strong>Hale før gennemsnit:</strong> p99 steg allerede ved 100 brugere (420 ms)
          — et tidligt advarselstegn før p50 rykkede sig.
        </li>
        <li>
          <strong>Fejlrate</strong> er først relevant ved 200+, og lige så vigtigt som
          latency: et hurtigt fejlsvar er ikke et godt svar.
        </li>
      </ol>

      <Callout type="info">
        <strong>Tommelfingerregel:</strong> Når throughput ikke længere vokser med lasten, men
        latency gør — er en ressource mættet. Find den ressource, hvor utilization nærmer
        sig 100 % eller hvor køen vokser (connection pool, thread pool, disk-kø).
      </Callout>

      <h2>4. Systematisk fejlfinding</h2>
      <MermaidDiagram chart={methodology} />
      <p>
        <strong>USE-metoden</strong> (Brendan Gregg): for <em>hver</em> ressource (CPU,
        RAM, disk, netværk, connection pool, thread pool) spørg om
        <strong> Utilization</strong>, <strong>Saturation</strong> og <strong>Errors</strong>.
        For tjenester bruges <strong>RED</strong>: Rate, Errors, Duration.
      </p>
      <p>
        <strong>Amdahls lov:</strong> optimér det, der fylder mest. Er 70 % af tiden i
        databasen, kan en 2× hurtigere JSON-serialisering (18 %) kun give ca. 9 % samlet
        forbedring. Mål først — gæt aldrig.
      </p>

      <h2>5. Hvor tiden bliver brugt i en request</h2>
      <MermaidDiagram chart={request} />
      <p>
        En request passerer mange lag. Opdel svartiden: <em>netværk + TLS</em>,{' '}
        <em>proxy</em>, <em>API-kode</em>, <em>cache</em>, <em>database</em>,{' '}
        <em>tredjepart</em>, <em>serialisering</em>. Distributed tracing (OpenTelemetry)
        gør det synligt pr. request.
      </p>
      <CodeBlock language="csharp">{otelCode}</CodeBlock>

      <h2>6. Typiske flaskehalse</h2>

      <h3>6.1 Database</h3>
      <ul>
        <li>
          <strong>Manglende indeks</strong> → <em>Seq Scan</em> på store tabeller.
        </li>
        <li>
          <strong>Langsomme queries:</strong> brug slow query log og <code>EXPLAIN ANALYZE</code>.
        </li>
        <li>
          <strong>Låse og deadlocks:</strong> lange transaktioner blokerer andre.
        </li>
        <li>
          <strong>Connection pool udtømt:</strong> forespørgsler venter på forbindelse (ofte
          misforstået som langsom DB).
        </li>
        <li>
          <strong>Overfetching:</strong> <code>SELECT *</code> og for mange kolonner/rækker
          (brug projektion og paginering).
        </li>
      </ul>
      <CodeBlock language="sql">{explain}</CodeBlock>

      <h3>6.2 N+1-problemet</h3>
      <p>
        Én query henter en liste, og derefter udløses én ekstra query <em>pr. element</em>.
        100 rækker giver 101 queries. Det er usynligt i lille testdata og katastrofalt i
        produktion. Symptomer: høj DB-latency selvom hver query er hurtig; mange næsten
        identiske queries i loggen.
      </p>
      <CodeBlock language="csharp">{nplus1Bad}</CodeBlock>
      <CodeBlock language="csharp">{nplus1Good}</CodeBlock>
      <CodeBlock language="csharp">{logSql}</CodeBlock>
      <Callout type="tip">
        Skriv en integrationstest, der tæller antal SQL-kald for et endpoint og fejler,
        hvis tallet stiger (&ldquo;query count budget&rdquo;). Så fanger CI N+1 i
        fremtiden — se <Link to="/test/integration">Integrationstest</Link>.
      </Callout>

      <h3>6.3 Netværk</h3>
      <ul>
        <li>
          <strong>Rundturstid (RTT):</strong> mange små kald hober sig op — slå kald sammen
          (batch) eller brug færre, større responses.
        </li>
        <li>
          <strong>Store payloads:</strong> aktivér gzip/brotli, paginér, undgå at sende
          ubrugte felter.
        </li>
        <li>
          <strong>TLS-handshake og DNS:</strong> genbrug forbindelser (keep-alive, HTTP/2,{' '}
          <code>HttpClientFactory</code>).
        </li>
        <li>
          <strong>Tredjeparts-API&apos;er:</strong> timeouts, retries med backoff og circuit
          breaker (Polly) — en langsom afhængighed kan trække hele systemet ned.
        </li>
        <li>
          <strong>CDN og caching:</strong> statiske filer og cachebare svar skal ikke nå
          API&apos;et.
        </li>
      </ul>

      <h3>6.4 Applikationskode og runtime</h3>
      <ul>
        <li>
          <strong>Synkron blokering</strong> (<code>.Result</code>, <code>.Wait()</code>) →
          thread pool starvation. Brug async hele vejen.
        </li>
        <li>
          <strong>Garbage collection:</strong> mange allokeringer giver GC-pauser (p99-pigge).
        </li>
        <li>
          <strong>CPU-tung kode:</strong> regex, serialisering, kryptering (bcrypt skal
          være langsom, men begræns antal samtidige logins).
        </li>
        <li>
          <strong>Manglende caching</strong> af dyre, sjældent skiftende data.
        </li>
        <li>
          <strong>Logning:</strong> synkron, overdreven logning kan bremse mere end forventet.
        </li>
      </ul>

      <h2>7. Flamegraphs</h2>
      <p>
        En <strong>flamegraph</strong> er en visualisering af profilerings-data (stack
        samples). Hver bjælke er en funktion; <strong>bredden</strong> viser, hvor stor en
        andel af tiden (CPU eller vent) funktionen — inklusive dem den kalder — har brugt.
        Y-aksen er kald-dybden (kalder nederst, kaldte ovenover). Jagt efter de{' '}
        <strong>brede, flade &ldquo;plateauer&rdquo;</strong> øverst: det er hot spots.
      </p>
      <MermaidDiagram chart={flamegraphConcept} />
      <p>
        Diagrammet er en forenklet skitse af princippet; rigtige flamegraphs genereres af
        værktøjer. I eksemplet bruges 65 % af tiden i at <em>vente på databasen</em> —
        kodeoptimering vil ikke hjælpe; løsningen er queries/indeks.
      </p>
      <CodeBlock language="bash">{profilingCmds}</CodeBlock>
      <ul>
        <li>
          <strong>CPU flamegraph</strong> — hvad forbruger CPU? (hot loops, serialisering).
        </li>
        <li>
          <strong>Off-CPU / wall-clock</strong> — hvad <em>venter</em> vi på? (I/O, låse).
        </li>
        <li>
          <strong>Differential flamegraph</strong> — sammenlign før/efter en ændring.
        </li>
      </ul>
      <CodeBlock language="csharp">{stopwatchCode}</CodeBlock>

      <h2>8. Fra måling til rapport</h2>
      <table>
        <thead>
          <tr>
            <th>Observation</th>
            <th>Sandsynlig årsag</th>
            <th>Næste skridt</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>p50 stiger lineært med last</td>
            <td>CPU-bound kode eller for lille instans</td>
            <td>CPU-profilering; skalér op/ud</td>
          </tr>
          <tr>
            <td>p50 ok, p99 meget højt</td>
            <td>GC, låse, cold cache, enkelte langsomme queries</td>
            <td>Traces for langsomme requests; GC-tællere</td>
          </tr>
          <tr>
            <td>Throughput flader ud, CPU lav</td>
            <td>Venter på noget: DB, pool, tråde, låse</td>
            <td>Pool-metrics, DB-wait, thread pool queue</td>
          </tr>
          <tr>
            <td>Throughput falder ved højere last</td>
            <td>Kollaps (timeouts, retries, thrashing)</td>
            <td>Load shedding, begræns retries, backpressure</td>
          </tr>
          <tr>
            <td>Mange nær-identiske queries</td>
            <td>N+1</td>
            <td>Include/projektion; query count-test</td>
          </tr>
          <tr>
            <td>Stigende memory over tid (soak)</td>
            <td>Memory leak</td>
            <td>dotnet-gcdump før/efter; fjern statiske referencer</td>
          </tr>
          <tr>
            <td>Latency stiger kun for visse brugere/geografi</td>
            <td>Netværk, CDN, DNS</td>
            <td>Tjek RTT, edge-caching, payload-størrelse</td>
          </tr>
        </tbody>
      </table>

      <p>
        Se <Link to="/test/release">Release</Link> for hvordan performance indgår i
        go/no-go.
      </p>

      <h2>Øvelse</h2>
      <ol>
        <li>
          Brug tabellen i afsnit 3. Bestem kapaciteten, flaskehalsen og hvilken
          optimering du ville prøve først. Begrund med tal.
        </li>
        <li>
          Lav et endpoint med N+1 (fx ordrer og linjer), mål p95 med k6 ved 50 brugere,
          ret til <code>Include</code>/projektion og mål igen. Hvor stor var forbedringen?
        </li>
        <li>
          Slå SQL-logning til og tæl queries pr. request før/efter.
        </li>
        <li>
          Indsaml et trace med <code>dotnet-trace</code> og åbn det i speedscope. Hvilken
          funktion er bredest?
        </li>
        <li>
          Skriv en kort rapport: observation → hypotese → ændring → måling → konklusion.
        </li>
      </ol>
    </LessonLayout>
  )
}
