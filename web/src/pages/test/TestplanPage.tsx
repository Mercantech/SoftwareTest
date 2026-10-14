import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath } from '../../data/objectives'

const processFlow = `
flowchart LR
  A["Analysér krav"] --> B["Definér scope og approach"]
  B --> C["Design testcases"]
  C --> D["Estimér og planlæg"]
  D --> E["Udfør tests"]
  E --> F["Rapportér"]
  F --> G{"Exit criteria<br/>opfyldt?"}
  G -- Nej --> E
  G -- Ja --> H["Afslut / release"]
`

const traceability = `
flowchart LR
  R1["KRAV-01<br/>Login"] --> TC1["TC-01 gyldigt login"]
  R1 --> TC2["TC-02 forkert kodeord"]
  R1 --> TC3["TC-03 låst konto"]
  R2["KRAV-02<br/>Opret ordre"] --> TC4["TC-04 gyldig ordre"]
  R2 --> TC5["TC-05 tom kurv"]
  R2 --> TC6["TC-06 negativ mængde"]
`

const planSkeleton = `
# Testplan: WebShop v1.2          (efter IEEE 829 / ISO/IEC/IEEE 29119-3)

1. Testplan-ID og version        TP-WEBSHOP-1.2, forfatter, dato, godkender
2. Introduktion                  Formål, baggrund, referencer (kravspec, designdok)
3. Testobjekter (items)          Build 1.2.0, API v1, React-frontend, PostgreSQL 16
4. Features der testes           Login, Opret ordre, Betaling, Ordrehistorik
5. Features der IKKE testes      Admin-rapporter (udskudt til v1.3), 3. parts betalingsside
6. Approach (strategi)           Unit + integration automatiseret, E2E via Bruno,
                                 eksplorativ test af betalingsflow, ZAP-baseline i CI
7. Pass/fail-kriterier           Testcase består, når faktisk = forventet resultat
8. Suspension / resumption       Stop ved blocker i login; genoptag efter hotfix + smoke
9. Deliverables                  Testcases, testrapport, fejlliste, dækningsrapport
10. Testmiljø                    Docker Compose: web, api, db; seed-data; test-SMTP
11. Ansvar og ressourcer         QA: Anna, Dev: Bo, Product owner: Carla
12. Tidsplan                     Sprint 14: design uge 1, udførelse uge 2, regression uge 3
13. Risici og afhjælpning        Se risikotabel
14. Exit criteria                Se afsnit nedenfor
15. Godkendelser                 Underskrifter
`

const testCaseCsharp = `
public class LoginTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public LoginTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    // TC-01 (KRAV-01): gyldigt login giver 200 og token
    [Fact]
    public async Task TC01_GyldigtLogin_Returnerer200OgToken()
    {
        var resp = await _client.PostAsJsonAsync("/api/login",
            new { email = "anna@test.dk", password = "Hemmelig123!" });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.False(string.IsNullOrWhiteSpace(body!.Token));
    }

    // TC-02 (KRAV-01): forkert kodeord giver 401 og ingen token
    [Fact]
    public async Task TC02_ForkertKodeord_Returnerer401()
    {
        var resp = await _client.PostAsJsonAsync("/api/login",
            new { email = "anna@test.dk", password = "forkert" });

        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    // TC-03 (KRAV-01): konto låses efter 5 mislykkede forsøg
    [Fact]
    public async Task TC03_FemFejlForsoeg_LaaserKonto()
    {
        for (var i = 0; i < 5; i++)
            await _client.PostAsJsonAsync("/api/login",
                new { email = "bo@test.dk", password = "forkert" });

        var resp = await _client.PostAsJsonAsync("/api/login",
            new { email = "bo@test.dk", password = "KorrektKode1!" });

        Assert.Equal(HttpStatusCode.Locked, resp.StatusCode); // 423
    }
}
`

export default function TestplanPage() {
  const objective = getObjectiveByPath('/test/testplan')

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

      <h1>Testplan til funktionelle krav</h1>

      <p>
        En testplan er det dokument, der besvarer spørgsmålene: <em>Hvad skal testes?
        Hvordan? Af hvem? Hvornår? Og hvornår er vi færdige?</em> Uden en plan bliver test
        tilfældig, og ingen kan sige, om systemet er dækket. Med en plan bliver test
        sporbar, estimérbar og kan diskuteres med kunden.
      </p>

      <h2>Læringsmål</h2>
      <ul>
        <li>Opbygge en testplan efter IEEE 829 / ISO 29119-struktur.</li>
        <li>Omsætte funktionelle krav til konkrete, målbare testcases.</li>
        <li>Opstille sporbarhed (traceability) mellem krav og tests.</li>
        <li>Definere exit criteria og identificere testrisici.</li>
        <li>Bruge en testcase-skabelon og skrive testcases som automatiserede tests.</li>
      </ul>

      <h2>1. Testplan, teststrategi og testcase — begreberne</h2>
      <table>
        <thead>
          <tr>
            <th>Begreb</th>
            <th>Niveau</th>
            <th>Indhold</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Teststrategi</td>
            <td>Organisation/produkt</td>
            <td>Overordnede principper: automatiseringsgrad, værktøjer, risikotilgang</td>
          </tr>
          <tr>
            <td>Testplan</td>
            <td>Projekt/release</td>
            <td>Scope, ressourcer, tidsplan, approach, kriterier for netop denne release</td>
          </tr>
          <tr>
            <td>Testdesign/-specifikation</td>
            <td>Feature</td>
            <td>Hvilke teknikker og betingelser dækker featuren</td>
          </tr>
          <tr>
            <td>Testcase</td>
            <td>Enkelt scenarie</td>
            <td>Forudsætninger, trin, input, forventet resultat</td>
          </tr>
          <tr>
            <td>Testrapport</td>
            <td>Efter udførelse</td>
            <td>Resultater, fejl, dækning, anbefaling</td>
          </tr>
        </tbody>
      </table>

      <h2>2. Testprocessen</h2>
      <MermaidDiagram chart={processFlow} />
      <p>
        Planlægning er <strong>iterativ</strong>: i agile teams opdateres planen hver
        sprint, men de samme spørgsmål besvares. En letvægts-testplan på en side er bedre
        end en perfekt plan på 40 sider, som ingen læser.
      </p>

      <h2>3. IEEE-inspireret struktur</h2>
      <p>
        IEEE 829 (afløst af ISO/IEC/IEEE 29119-3) beskriver en standardiseret indholdsfortegnelse.
        Den giver en tjekliste, så intet vigtigt glemmes. Skabelon:
      </p>
      <CodeBlock language="text">{planSkeleton}</CodeBlock>

      <h3>Scope (afgrænsning)</h3>
      <p>
        Scope er både det, der <strong>er med</strong>, og det, der <strong>bevidst er
        udeladt</strong>. At skrive &ldquo;ikke testet: 3. parts betalingsside&rdquo; er
        en vigtig kommunikation til interessenterne — det gør risikoen synlig i stedet for
        skjult.
      </p>

      <h3>Test items</h3>
      <p>
        Konkrete versioner: build-nummer, commit-hash, containerimage-tag. En testplan
        uden versionsangivelse kan ikke gentages.
      </p>

      <h3>Approach</h3>
      <p>
        Beskriv testniveauer, teknikker og værktøjer: &ldquo;Forretningslogik testes med
        unit tests (xUnit), API&apos;et med integrationstests
        (WebApplicationFactory), kritiske flows med E2E (Bruno), betalingsflow med
        eksplorativ test.&rdquo; Link til siderne{' '}
        <Link to="/test/metodikker">Testmetodikker</Link> og{' '}
        <Link to="/test/integration">Integrationstest</Link>.
      </p>

      <h3>Testcases</h3>
      <p>
        Selve testcases kan ligge i et værktøj (Jira/Xray, TestRail, Notion) eller —
        bedst for automatiserede tests — som kode i repoet, med testnavne der refererer
        til krav-ID&apos;er.
      </p>

      <h3>Exit criteria (afslutningskriterier)</h3>
      <p>Objektive betingelser for, at testfasen kan afsluttes. Eksempler:</p>
      <ul>
        <li>100 % af must-have testcases er udført, og ≥ 95 % består.</li>
        <li>Ingen åbne fejl af alvorlighed <em>kritisk</em> eller <em>høj</em>.</li>
        <li>Alle regressionstests er grønne i CI på release-commit.</li>
        <li>Kodedækning for forretningslogik ≥ 80 % (som signal, ikke mål — se{' '}
          <Link to="/test/release">Release</Link>).</li>
        <li>Performance: p95 &lt; 500 ms ved 100 samtidige brugere.</li>
      </ul>

      <h3>Risici</h3>
      <table>
        <thead>
          <tr>
            <th>Risiko</th>
            <th>Sandsynlighed</th>
            <th>Konsekvens</th>
            <th>Afhjælpning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Testmiljø ikke klar til tiden</td>
            <td>Middel</td>
            <td>Høj</td>
            <td>Docker Compose-miljø i repo; automatisk opsætning</td>
          </tr>
          <tr>
            <td>Krav ændres midt i sprint</td>
            <td>Høj</td>
            <td>Middel</td>
            <td>Korte planer; regressionssuite; kravændringer under change control</td>
          </tr>
          <tr>
            <td>Nøglepersoner syge</td>
            <td>Lav</td>
            <td>Høj</td>
            <td>Dokumentér testcases; parprogrammering</td>
          </tr>
          <tr>
            <td>Flaky E2E-tests skjuler rigtige fejl</td>
            <td>Middel</td>
            <td>Middel</td>
            <td>Karantæne-regler, fast testdata, retry-politik</td>
          </tr>
          <tr>
            <td>Ekstern API ikke tilgængelig</td>
            <td>Middel</td>
            <td>Middel</td>
            <td>Mock/stub (fx WireMock) og kontrakttests</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Fra funktionelle krav til testcases</h2>
      <p>
        Et funktionelt krav beskriver, <strong>hvad systemet skal gøre</strong>. Et godt
        krav er <em>testbart</em>: man kan afgøre entydigt, om det er opfyldt.
      </p>

      <Callout type="warn">
        <strong>Utestbart krav:</strong> &ldquo;Systemet skal være brugervenligt og
        hurtigt.&rdquo; <br />
        <strong>Testbart krav:</strong> &ldquo;Når brugeren indtaster korrekt email og
        adgangskode, skal vedkommende føres til forsiden inden for 2 sekunder.&rdquo;
      </Callout>

      <h3>Trin-for-trin-teknik</h3>
      <ol>
        <li>Giv hvert krav et unikt ID (KRAV-01).</li>
        <li>Find acceptkriterier (Given/When/Then, hvis I bruger BDD).</li>
        <li>
          Anvend testdesignteknikker (se <Link to="/test/metodikker">Metodikker</Link>):
          ækvivalensklasser, grænseværdier, beslutningstabeller, tilstandsdiagrammer.
        </li>
        <li>Skriv mindst ét positivt og ét negativt testcase pr. krav.</li>
        <li>Tilføj de tests til en sporbarhedsmatrix.</li>
      </ol>

      <MermaidDiagram chart={traceability} />

      <h3>Eksempel: login-krav → testcases</h3>
      <p>
        <strong>KRAV-01:</strong> &ldquo;En registreret bruger kan logge ind med email og
        adgangskode. Efter 5 mislykkede forsøg låses kontoen i 15 minutter.&rdquo;
      </p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Krav</th>
            <th>Scenarie</th>
            <th>Input</th>
            <th>Forventet</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TC-01</td>
            <td>KRAV-01</td>
            <td>Gyldigt login</td>
            <td>anna@test.dk / korrekt</td>
            <td>200 + token</td>
            <td>Positiv</td>
          </tr>
          <tr>
            <td>TC-02</td>
            <td>KRAV-01</td>
            <td>Forkert kodeord</td>
            <td>anna@test.dk / forkert</td>
            <td>401, ingen token, generisk fejltekst</td>
            <td>Negativ</td>
          </tr>
          <tr>
            <td>TC-03</td>
            <td>KRAV-01</td>
            <td>Konto låses</td>
            <td>5 × forkert, derefter korrekt</td>
            <td>423 Locked</td>
            <td>Grænse</td>
          </tr>
          <tr>
            <td>TC-04</td>
            <td>KRAV-01</td>
            <td>Ukendt email</td>
            <td>ukendt@test.dk / x</td>
            <td>401 (samme svar som TC-02 — ingen user enumeration)</td>
            <td>Sikkerhed</td>
          </tr>
          <tr>
            <td>TC-05</td>
            <td>KRAV-01</td>
            <td>Tomme felter</td>
            <td>&quot;&quot; / &quot;&quot;</td>
            <td>400 med valideringsfejl</td>
            <td>Negativ</td>
          </tr>
          <tr>
            <td>TC-06</td>
            <td>KRAV-01</td>
            <td>SQL-injection i email</td>
            <td>
              <code>&apos; OR 1=1 --</code>
            </td>
            <td>401/400, ingen databasefejl</td>
            <td>Sikkerhed</td>
          </tr>
        </tbody>
      </table>

      <h3>Testcases som automatiseret kode</h3>
      <p>
        Hver række i tabellen kan blive til en test. Bemærk navngivning med TC-ID og
        krav-ID, som giver sporbarhed direkte i testresultaterne:
      </p>
      <CodeBlock language="csharp">{testCaseCsharp}</CodeBlock>

      <h2>5. Skabelon til testcases</h2>
      <p>Kopiér tabellen og udfyld den for hver testcase:</p>
      <table>
        <thead>
          <tr>
            <th>Felt</th>
            <th>Beskrivelse</th>
            <th>Eksempel</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ID</td>
            <td>Unikt ID</td>
            <td>TC-014</td>
          </tr>
          <tr>
            <td>Titel</td>
            <td>Kort og sigende</td>
            <td>Opret ordre med tom kurv afvises</td>
          </tr>
          <tr>
            <td>Krav-ref.</td>
            <td>Hvilket krav dækkes</td>
            <td>KRAV-02</td>
          </tr>
          <tr>
            <td>Prioritet</td>
            <td>Must / Should / Could (eller risikoscore)</td>
            <td>Must</td>
          </tr>
          <tr>
            <td>Forudsætninger</td>
            <td>Miljø, data, tilstand</td>
            <td>Bruger er logget ind; kurv er tom</td>
          </tr>
          <tr>
            <td>Trin</td>
            <td>Nummererede handlinger</td>
            <td>1. POST /api/orders med tom linjeliste</td>
          </tr>
          <tr>
            <td>Testdata</td>
            <td>Konkrete input</td>
            <td>{`{ "lines": [] }`}</td>
          </tr>
          <tr>
            <td>Forventet resultat</td>
            <td>Præcist og målbart</td>
            <td>400, fejlkode EMPTY_CART</td>
          </tr>
          <tr>
            <td>Faktisk resultat</td>
            <td>Udfyldes ved kørsel</td>
            <td>—</td>
          </tr>
          <tr>
            <td>Status</td>
            <td>Pass / Fail / Blocked / Not run</td>
            <td>Not run</td>
          </tr>
          <tr>
            <td>Automatiseret?</td>
            <td>Ja/nej + sted i koden</td>
            <td>Ja — OrdersApiTests.TC014</td>
          </tr>
        </tbody>
      </table>

      <h2>6. Prioritering med risiko</h2>
      <p>
        Du kan ikke teste alt. Giv hver feature en <strong>risikoscore = sandsynlighed ×
        konsekvens</strong> (fx 1–5 hver) og brug mest tid på de højeste scorer.
        Betalingsflow (sandsynlighed 3 × konsekvens 5 = 15) prioriteres over
        &ldquo;skift profilbillede&rdquo; (2 × 1 = 2).
      </p>

      <Callout type="tip">
        Gem testplanen i repoet som Markdown ved siden af koden. Så versionsstyres den,
        kan reviewes i pull requests og følger releasen — præcis som koden.
      </Callout>

      <h2>7. Rapportering</h2>
      <p>
        Efter udførelsen laves en kort testrapport: antal tests planlagt/kørt/bestået/
        fejlet/blokeret, åbne fejl pr. alvorlighed, afvigelser fra planen, og en
        anbefaling (go/no-go). Det er input til{' '}
        <Link to="/test/release">release-beslutningen</Link>.
      </p>

      <h2>Øvelse</h2>
      <ol>
        <li>
          Tag disse to krav: <em>&ldquo;Brugeren kan lægge varer i en kurv (max 20 pr.
          vare)&rdquo;</em> og <em>&ldquo;Brugeren kan søge efter varer på navn&rdquo;</em>.
        </li>
        <li>Giv dem ID&apos;er og formulér acceptkriterier som Given/When/Then.</li>
        <li>
          Skriv mindst 5 testcases pr. krav i skabelonen ovenfor (inkl. grænseværdi 20/21
          og tom søgning).
        </li>
        <li>Tegn sporbarhedsdiagrammet (krav → testcases).</li>
        <li>
          Skriv et kort testplan-dokument (1 side) med scope, approach, exit criteria og
          tre risici.
        </li>
        <li>Implementér to af testcases som xUnit-tests.</li>
      </ol>
    </LessonLayout>
  )
}
