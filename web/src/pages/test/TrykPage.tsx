import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath } from '../../data/objectives'

const loadShapes = `
flowchart LR
  subgraph LOAD["Load test"]
    L1["Ramp op til forventet last<br/>hold 10-30 min<br/>ramp ned"]
  end
  subgraph STRESS["Stress test"]
    S1["Øg last over forventet niveau<br/>til systemet knækker<br/>observer fejl og recovery"]
  end
  subgraph SOAK["Soak / endurance"]
    K1["Moderat last i mange timer<br/>find memory leaks, connection leaks"]
  end
  subgraph SPIKE["Spike test"]
    P1["Pludselig stor stigning<br/>fx kampagne eller nyhed"]
  end
`

const testDesignFlow = `
flowchart TD
  A["Definér mål og SLA"] --> B["Analysér trafik<br/>brugere, requests/s, peak"]
  B --> C["Design scenarier og testdata"]
  C --> D["Forbered miljø<br/>produktionslignende hardware"]
  D --> E["Kør baseline<br/>enkelt bruger"]
  E --> F["Kør load, stress, soak"]
  F --> G["Overvåg CPU, RAM, IO, DB, netværk"]
  G --> H["Analysér og find flaskehals"]
  H --> I{"SLA opfyldt?"}
  I -- Nej --> J["Optimér og gentag"]
  J --> F
  I -- Ja --> K["Rapportér og dokumentér kapacitet"]
`

const arch = `
flowchart LR
  LG["Load generator<br/>k6 / NBomber"] -->|HTTP| LB["Traefik / nginx"]
  LB --> API["API (.NET)"]
  API --> DB[("PostgreSQL")]
  API --> CACHE[("Redis")]
  MON["Prometheus + Grafana"] -.-> API
  MON -.-> DB
  MON -.-> LB
`

const littles = `
flowchart LR
  A["Ankomster: λ = 100 req/s"] --> S["System"]
  S --> B["Svartid W = 0,2 s"]
  S --> C["Samtidige i systemet<br/>L = λ × W = 20"]
`

const k6Script = `
// k6-script (JavaScript): load test med ramp-up, thresholds og checks
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // ramp op til 50 virtuelle brugere
    { duration: '10m', target: 50 },   // hold lasten
    { duration: '1m', target: 0 },     // ramp ned
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],           // < 1 % fejl
    http_req_duration: ['p(95)<500', 'p(99)<1500'], // SLA: p95 < 500 ms, p99 < 1,5 s
  },
};

export default function () {
  const res = http.get(__ENV.BASE_URL + '/api/products');
  check(res, {
    'status er 200': (r) => r.status === 200,
    'svar under 800 ms': (r) => r.timings.duration < 800,
  });
  sleep(1);   // think time: rigtige brugere venter mellem handlinger
}

// Kør:  k6 run -e BASE_URL=https://staging.example.dk script.js
`

const k6Stress = `
// Stress: stig trin for trin til systemet knækker
export const options = {
  stages: [
    { duration: '2m',  target: 100 },
    { duration: '2m',  target: 200 },
    { duration: '2m',  target: 400 },
    { duration: '2m',  target: 800 },   // hvor knækker det?
    { duration: '3m',  target: 0 },     // recovery: kommer systemet sig igen?
  ],
};
`

const nbomber = `
// NBomber (C#): load test skrevet i samme sprog som systemet
using NBomber.CSharp;
using NBomber.Http.CSharp;

var httpClient = new HttpClient();

var scenario = Scenario.Create("hent_produkter", async context =>
{
    var request = Http.CreateRequest("GET", "https://staging.example.dk/api/products");
    var response = await Http.Send(httpClient, request);
    return response;
})
.WithWarmUpDuration(TimeSpan.FromSeconds(10))
.WithLoadSimulations(
    Simulation.RampingInject(rate: 50, interval: TimeSpan.FromSeconds(1),
                             during: TimeSpan.FromMinutes(2)),
    Simulation.Inject(rate: 50, interval: TimeSpan.FromSeconds(1),
                      during: TimeSpan.FromMinutes(10))
);

NBomberRunner
    .RegisterScenarios(scenario)
    .Run();
`

const compose = `
# docker-compose.loadtest.yml - begrænsede ressourcer gør kapacitet målbar og reproducerbar
services:
  api:
    build: ./api
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
  db:
    image: postgres:16-alpine
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
    shm_size: 256mb
  k6:
    image: grafana/k6
    volumes:
      - ./loadtest:/scripts
    command: run /scripts/script.js
    environment:
      BASE_URL: http://api:8080
    depends_on:
      - api
`

const dockerStats = `
# Se ressourceforbrug live under testen
docker stats

# På en Linux-host: dybere analyse
top -H                 # CPU pr. tråd
free -m                # hukommelse
iostat -x 1            # disk-IO (utilization, await)
ss -s                  # netværksforbindelser
dotnet-counters monitor --process-id 1234 System.Runtime   # .NET: GC, threadpool, requests
`

export default function TrykPage() {
  const objective = getObjectiveByPath('/test/tryk')

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

      <h1>Tryktest: load, stress og hardware</h1>

      <p>
        En <strong>tryktest</strong> (performance- eller belastningstest) undersøger,
        hvordan systemet opfører sig, når mange bruger det samtidigt. Funktionstests
        besvarer &ldquo;virker det?&rdquo;; tryktests besvarer &ldquo;virker det{' '}
        <em>hurtigt nok, stabilt nok og længe nok</em> — på den hardware vi har?&rdquo;
      </p>

      <h2>Læringsmål</h2>
      <ul>
        <li>Skelne mellem load-, stress-, soak- og spike-test og vælge den rette.</li>
        <li>Definere målbare krav (SLA/SLO) og omsætte dem til thresholds.</li>
        <li>Designe en tryktest med realistiske scenarier og testdata.</li>
        <li>Lave et simpelt k6-script og forklare et NBomber-eksempel i C#.</li>
        <li>Inddrage hardware (CPU, RAM, IO, netværk) i testdesign og kapacitetsplanlægning.</li>
      </ul>

      <h2>1. Typer af tryktest</h2>
      <MermaidDiagram chart={loadShapes} />
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Spørgsmål</th>
            <th>Last</th>
            <th>Varighed</th>
            <th>Finder</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Smoke/baseline</td>
            <td>Virker scriptet, og hvad er referencen?</td>
            <td>1–5 brugere</td>
            <td>Minutter</td>
            <td>Fejl i testen selv, baseline-tider</td>
          </tr>
          <tr>
            <td>Load</td>
            <td>Opfylder vi SLA ved forventet last?</td>
            <td>Normal til peak</td>
            <td>10–60 min</td>
            <td>Langsomme endpoints, forkerte indstillinger</td>
          </tr>
          <tr>
            <td>Stress</td>
            <td>Hvor knækker det, og hvordan fejler det?</td>
            <td>Over peak, til brud</td>
            <td>30–60 min</td>
            <td>Grænser, graceful degradation, recovery</td>
          </tr>
          <tr>
            <td>Soak (endurance)</td>
            <td>Holder det i længden?</td>
            <td>70–80 % af peak</td>
            <td>4–24+ timer</td>
            <td>Memory leaks, connection leaks, log/disk fyldes</td>
          </tr>
          <tr>
            <td>Spike</td>
            <td>Overlever vi pludselig trafik?</td>
            <td>Pludselig 10×</td>
            <td>Korte byger</td>
            <td>Autoscaling-forsinkelse, kønedbrud</td>
          </tr>
          <tr>
            <td>Kapacitetstest</td>
            <td>Hvor mange brugere kan én node tage?</td>
            <td>Trinvis stigning</td>
            <td>Timer</td>
            <td>Skalerings- og dimensioneringsdata</td>
          </tr>
        </tbody>
      </table>

      <h2>2. Krav: SLA, SLO og SLI</h2>
      <p>
        Uden mål kan man ikke bestå eller dumpe en tryktest. Brug disse begreber:
      </p>
      <ul>
        <li>
          <strong>SLI</strong> (Service Level Indicator) — det man måler: latency,
          fejlrate, throughput.
        </li>
        <li>
          <strong>SLO</strong> (Objective) — internt mål: &ldquo;99 % af kald under 300 ms&rdquo;.
        </li>
        <li>
          <strong>SLA</strong> (Agreement) — kontraktligt løfte over for kunden, ofte med
          bod: &ldquo;99,9 % oppetid pr. måned&rdquo;.
        </li>
      </ul>
      <table>
        <thead>
          <tr>
            <th>Oppetid</th>
            <th>Tilladt nedetid pr. år</th>
            <th>pr. måned</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>99 %</td>
            <td>3,65 dage</td>
            <td>7,2 timer</td>
          </tr>
          <tr>
            <td>99,9 % (&ldquo;tre nier&rdquo;)</td>
            <td>8,76 timer</td>
            <td>43,8 min</td>
          </tr>
          <tr>
            <td>99,99 %</td>
            <td>52,6 min</td>
            <td>4,4 min</td>
          </tr>
        </tbody>
      </table>
      <Callout type="tip">
        Formulér krav som <strong>percentiler</strong>, ikke gennemsnit:{' '}
        &ldquo;p95 &lt; 500 ms ved 200 req/s og under 1 % fejl.&rdquo; Gennemsnit skjuler
        de langsomme brugere. Se <Link to="/test/performance">Performance</Link> for
        fortolkning af percentiler.
      </Callout>

      <h2>3. Test-design: fra krav til scenarie</h2>
      <MermaidDiagram chart={testDesignFlow} />

      <h3>Realistisk belastningsprofil</h3>
      <ul>
        <li>
          <strong>Brugsmønstre:</strong> brug analytics/logfiler til at finde fordelingen
          (fx 70 % browsing, 25 % søgning, 5 % checkout). Test ikke bare ét endpoint.
        </li>
        <li>
          <strong>Think time:</strong> rigtige brugere pauser. Uden pauser tester du
          &ldquo;requests pr. sekund&rdquo;, ikke &ldquo;brugere&rdquo;.
        </li>
        <li>
          <strong>Testdata:</strong> varierede, realistiske data (ikke samme produkt hver
          gang — så rammer alt cachen). Nok data i databasen (fx millioner af rækker), ellers
          viser indeks og queries ikke deres rigtige adfærd.
        </li>
        <li>
          <strong>Open vs. closed model:</strong> <em>closed</em> = fast antal brugere
          (venter på svar); <em>open</em> = nye ankomster pr. sekund uanset svartid
          (mere realistisk for web og afslører kødannelse).
        </li>
        <li>
          <strong>Warm-up:</strong> kassér de første minutter (JIT, caches, connection
          pools).
        </li>
      </ul>

      <h3>Little&apos;s lov — nyttig tommelfingerregel</h3>
      <MermaidDiagram chart={littles} />
      <p>
        <code>L = λ × W</code>: antal samtidige forespørgsler = ankomstrate × gennemsnitlig
        svartid. Hvis svartiden stiger (flaskehals), stiger køen proportionalt — og
        pludselig er systemet fuldt, selv om ankomstraten er uændret.
      </p>

      <h2>4. Værktøjer</h2>
      <table>
        <thead>
          <tr>
            <th>Værktøj</th>
            <th>Sprog</th>
            <th>Styrker</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>k6 (Grafana)</td>
            <td>JavaScript-scripts, Go-kerne</td>
            <td>Let at komme i gang, thresholds, CI-venlig, lavt ressourceforbrug</td>
          </tr>
          <tr>
            <td>NBomber</td>
            <td>C# / F#</td>
            <td>Samme sprog som .NET-systemet, kan teste ikke-HTTP (gRPC, køer)</td>
          </tr>
          <tr>
            <td>JMeter</td>
            <td>GUI + XML</td>
            <td>Modent, mange plugins, brede protokoller</td>
          </tr>
          <tr>
            <td>Locust</td>
            <td>Python</td>
            <td>Kode som scenarier, distribueret</td>
          </tr>
          <tr>
            <td>Bombardier / wrk / hey</td>
            <td>CLI</td>
            <td>Hurtige quick-checks af ét endpoint</td>
          </tr>
        </tbody>
      </table>

      <h3>k6 — load test med thresholds</h3>
      <CodeBlock language="javascript">{k6Script}</CodeBlock>
      <p>
        Thresholds gør testen til en <strong>automatisk gate</strong>: k6 afslutter med
        fejlkode, hvis SLA&apos;et brydes, og pipelinen bliver rød (jf.{' '}
        <Link to="/test/ci-cd">CI/CD</Link>).
      </p>

      <h3>k6 — stress-profil</h3>
      <CodeBlock language="javascript">{k6Stress}</CodeBlock>

      <h3>NBomber — C#-eksempel</h3>
      <CodeBlock language="csharp">{nbomber}</CodeBlock>

      <Callout type="warn">
        <strong>Husk load generatoren selv.</strong> Hvis testmaskinen løber tør for CPU
        eller netværk, måler du generatorens grænser — ikke systemets. Overvåg også den,
        og fordel evt. last over flere generatorer. Kør aldrig tryktest mod produktion
        uden aftale, og aldrig mod systemer du ikke ejer.
      </Callout>

      <h2>5. Hardware i testdesignet</h2>
      <p>
        Performance er et samspil mellem kode og hardware. En test uden viden om miljøet
        siger næsten intet: &ldquo;200 req/s&rdquo; på en laptop fortæller intet om
        produktionsserveren.
      </p>
      <MermaidDiagram chart={arch} />

      <table>
        <thead>
          <tr>
            <th>Ressource</th>
            <th>Typiske symptomer ved mangel</th>
            <th>Hvad overvåger man?</th>
            <th>Typiske tiltag</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CPU</td>
            <td>Høj latency, CPU nær 100 %, køer</td>
            <td>CPU %, run queue, throttling i containere</td>
            <td>Optimér kode, cache, flere kerner/instanser</td>
          </tr>
          <tr>
            <td>RAM</td>
            <td>Swapping, GC-pauser, OOM-kills</td>
            <td>Working set, GC-tid, memory growth</td>
            <td>Find leaks, mindre objekter, mere RAM</td>
          </tr>
          <tr>
            <td>Disk-IO</td>
            <td>Langsomme queries, høj iowait</td>
            <td>IOPS, latency (await), kø-dybde</td>
            <td>SSD/NVMe, indeks, batchede writes</td>
          </tr>
          <tr>
            <td>Netværk</td>
            <td>Timeouts, packet loss, mættet båndbredde</td>
            <td>Båndbredde, retransmissions, åbne connections</td>
            <td>Komprimering, CDN, færre/mindre kald</td>
          </tr>
          <tr>
            <td>Database</td>
            <td>Connection pool tom, locks, langsomme queries</td>
            <td>Aktive connections, slow query log, lock waits</td>
            <td>Indeks, query-tuning, read replicas, pool-størrelse</td>
          </tr>
          <tr>
            <td>Tråde/connections</td>
            <td>Thread pool starvation, socket-udmattelse</td>
            <td>Thread pool queue, TIME_WAIT</td>
            <td>Async hele vejen, HttpClientFactory</td>
          </tr>
        </tbody>
      </table>

      <h3>Principper</h3>
      <ul>
        <li>
          <strong>Produktionslignende miljø:</strong> samme hardwareklasse, samme
          konfiguration, samme versioner. Hvis I tester på en mindre maskine, skalér
          resultatet forsigtigt — præstation skalerer sjældent lineært.
        </li>
        <li>
          <strong>Isolér:</strong> ingen andre processer eller &ldquo;støjende
          naboer&rdquo; på samme VM under målingen.
        </li>
        <li>
          <strong>Ressourcegrænser:</strong> sæt CPU/RAM-limits i Docker for at gøre testen
          reproducerbar (se nedenfor).
        </li>
        <li>
          <strong>Mål alle lag samtidig:</strong> load generator, load balancer, API,
          database. Flaskehalsen er sjældent der, hvor man tror.
        </li>
        <li>
          <strong>Dokumentér miljøet</strong> i testrapporten: CPU-model, kerner, RAM,
          disktype, netværk, OS, runtime-version, config.
        </li>
      </ul>
      <CodeBlock language="yaml">{compose}</CodeBlock>
      <CodeBlock language="bash">{dockerStats}</CodeBlock>

      <h3>Kapacitetsplanlægning</h3>
      <p>
        Når testen viser, at én instans (2 vCPU, 1 GB) klarer 300 req/s inden for SLA, og
        forventet peak er 1000 req/s med 30 % sikkerhedsmargin (1300), kræves{' '}
        <code>⌈1300 / 300⌉ = 5</code> instanser — forudsat at databasen også kan følge med.
        Det er netop her, hardware indgår i testen: tallene bliver til konkrete
        indkøbs- og skaleringsbeslutninger.
      </p>

      <h2>6. Rapportering</h2>
      <p>En god testrapport indeholder:</p>
      <ul>
        <li>Mål/SLA, testtype, scenarier og lastprofil.</li>
        <li>Miljøbeskrivelse (hardware og versioner).</li>
        <li>Resultater: throughput, p50/p95/p99, fejlrate, ressourceforbrug over tid.</li>
        <li>Fund: hvor opstod flaskehalsen? Evidens (grafer, profilerings-output).</li>
        <li>Konklusion: bestået/ikke bestået; anbefalinger; næste skridt.</li>
      </ul>
      <p>
        Fortolkning og jagten på årsagen beskrives på siden{' '}
        <Link to="/test/performance">Performance</Link>.
      </p>

      <h2>Øvelse</h2>
      <ol>
        <li>
          Vælg et endpoint i et af jeres projekter og definér et SLA (fx p95 &lt; 300 ms
          ved 50 samtidige brugere).
        </li>
        <li>Installér k6 og skriv et load-script med thresholds. Kør det lokalt.</li>
        <li>
          Start API&apos;et i Docker med <code>cpus: 1</code> og <code>memory: 512M</code>.
          Kør et stress-script og find det punkt, hvor p95 overskrider SLA.
        </li>
        <li>
          Gentag med <code>cpus: 2</code>. Skalerede kapaciteten lineært? Hvorfor/hvorfor
          ikke?
        </li>
        <li>
          Observér <code>docker stats</code> under testen. Hvilken ressource er først
          mættet?
        </li>
        <li>Skriv en én-siders testrapport efter skabelonen ovenfor.</li>
      </ol>
    </LessonLayout>
  )
}
