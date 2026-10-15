import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import ConceptStack from '../../components/ConceptStack'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveSectionMap from '../../components/ObjectiveSectionMap'
import PlanSectionGrid from '../../components/PlanSectionGrid'
import RiskMatrix from '../../components/RiskMatrix'
import TraceabilityBoard from '../../components/TraceabilityBoard'
import WorkshopPanel from '../../components/WorkshopPanel'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'

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

export default function TestplanPageDa() {
  const objective = getObjectiveByPath('/test/testplan')

  return (
    <LessonLayout module="test">

<h1>Testplan til funktionelle krav</h1>

      <p>
        En testplan er det dokument, der besvarer spørgsmålene: <em>Hvad skal testes?
        Hvordan? Af hvem? Hvornår? Og hvornår er vi færdige?</em> Uden en plan bliver test
        tilfældig, og ingen kan sige, om systemet er dækket. Med en plan bliver test
        sporbar, estimérbar og kan diskuteres med kunden.
      </p>

      {objective ? (
        <ObjectiveSectionMap
          level={objective.level}
          objectiveId={objective.id}
          objectiveLabel="Målpind"
          objectiveText={objectiveTitle(objective, 'da')}
          mapTitle="Fra målpind til sektion"
          mapLead="Hvert læringsmål hopper til den del af siden, der træner det:"
          items={[
            {
              goal: 'Opbygge en testplan efter IEEE 829 / ISO 29119-struktur',
              sectionId: 'ieee',
              sectionLabel: '§3 IEEE-struktur',
            },
            {
              goal: 'Omsætte funktionelle krav til konkrete, målbare testcases',
              sectionId: 'krav-til-testcases',
              sectionLabel: '§4 Krav → testcases',
            },
            {
              goal: 'Opstille sporbarhed mellem krav og tests',
              sectionId: 'sporbarhed',
              sectionLabel: 'Sporbarhedstavle',
            },
            {
              goal: 'Definere exit criteria og identificere testrisici',
              sectionId: 'risici',
              sectionLabel: 'Risikomatrice',
            },
            {
              goal: 'Bruge en testcase-skabelon og skrive testcases som automatiserede tests',
              sectionId: 'workshop',
              sectionLabel: 'Workshop + kode',
            },
          ]}
        />
      ) : null}

      <h2 id="begreber">1. Testplan, teststrategi og testcase — begreberne</h2>
      <ConceptStack
        ariaLabel="Hierarki for testplanlægning"
        caption="Fra bred organisation til enkelt scenarie — hvert lag svarer på andre spørgsmål:"
        items={[
          {
            id: 'strategy',
            title: 'Teststrategi',
            level: 'Organisation / produkt',
            body: 'Overordnede principper: automatiseringsgrad, værktøjer og risikotilgang på tværs af projekter.',
          },
          {
            id: 'plan',
            title: 'Testplan',
            level: 'Projekt / release',
            body: 'Scope, ressourcer, tidsplan, approach og kriterier for netop denne release.',
          },
          {
            id: 'design',
            title: 'Testdesign',
            level: 'Feature',
            body: 'Hvilke teknikker og betingelser dækker featuren — ækvivalens, grænser, beslutningstabeller.',
          },
          {
            id: 'case',
            title: 'Testcase',
            level: 'Enkelt scenarie',
            body: 'Forudsætninger, trin, input og forventet resultat for ét konkret scenarie.',
          },
          {
            id: 'report',
            title: 'Testrapport',
            level: 'Efter udførelse',
            body: 'Resultater, fejl, dækning og en anbefaling (go / no-go) til releasen.',
          },
        ]}
      />

      <h2 id="proces">2. Testprocessen</h2>
      <p>
        Processen er en <strong>sløjfe</strong>: hvis exit criteria ikke er opfyldt, går I tilbage
        til udførelse — ikke videre til release.
      </p>
      <MermaidDiagram chart={processFlow} />
      <p>
        Planlægning er <strong>iterativ</strong>: i agile teams opdateres planen hver
        sprint, men de samme spørgsmål besvares. En letvægts-testplan på en side er bedre
        end en perfekt plan på 40 sider, som ingen læser.
      </p>

      <h2 id="ieee">3. IEEE-inspireret struktur</h2>
      <PlanSectionGrid
        ariaLabel="IEEE testplan-sektioner"
        lead="IEEE 829 / ISO 29119-3 som tjekliste. De fremhævede felter er dem, teams oftest glemmer — og dem, der skaber mest værdi, når de er på plads."
        items={[
          {
            id: 'id',
            title: 'Testplan-ID og version',
            body: 'TP-WEBSHOP-1.2, forfatter, dato, godkender.',
          },
          {
            id: 'intro',
            title: 'Introduktion',
            body: 'Formål, baggrund, referencer (kravspec, designdok).',
          },
          {
            id: 'items',
            title: 'Testobjekter (items)',
            body: 'Build 1.2.0, API v1, React-frontend, PostgreSQL 16 — konkrete versioner.',
          },
          {
            id: 'in',
            title: 'Features der testes',
            body: 'Login, Opret ordre, Betaling, Ordrehistorik.',
            emphasis: 'scope',
          },
          {
            id: 'out',
            title: 'Features der IKKE testes',
            body: 'Admin-rapporter (v1.3), 3. parts betalingsside. Synlig risiko > skjult risiko.',
            emphasis: 'scope',
          },
          {
            id: 'approach',
            title: 'Approach (strategi)',
            body: 'Unit + integration, E2E via Bruno, eksplorativ betalingstest, ZAP i CI.',
          },
          {
            id: 'passfail',
            title: 'Pass/fail-kriterier',
            body: 'Testcase består, når faktisk resultat = forventet resultat.',
          },
          {
            id: 'suspend',
            title: 'Suspension / resumption',
            body: 'Stop ved blocker i login; genoptag efter hotfix + smoke.',
          },
          {
            id: 'deliverables',
            title: 'Deliverables',
            body: 'Testcases, testrapport, fejlliste, dækningsrapport.',
          },
          {
            id: 'env',
            title: 'Testmiljø',
            body: 'Docker Compose: web, api, db; seed-data; test-SMTP.',
          },
          {
            id: 'roles',
            title: 'Ansvar og ressourcer',
            body: 'QA: Anna, Dev: Bo, Product owner: Carla.',
          },
          {
            id: 'schedule',
            title: 'Tidsplan',
            body: 'Sprint 14: design uge 1, udførelse uge 2, regression uge 3.',
          },
          {
            id: 'risks',
            title: 'Risici og afhjælpning',
            body: 'Se risikomatrice nedenfor — score = sandsynlighed × konsekvens.',
            emphasis: 'risk',
          },
          {
            id: 'exit',
            title: 'Exit criteria',
            body: 'Objektive betingelser for at stoppe. Uden dem bliver “færdig” en fornemmelse.',
            emphasis: 'exit',
          },
          {
            id: 'approvals',
            title: 'Godkendelser',
            body: 'Underskrifter / formel accept fra interessenter.',
          },
        ]}
      />

      <div className="info-tiles">
        <article className="info-tile">
          <h3>Scope</h3>
          <p>
            Både det der <strong>er med</strong>, og det der <strong>bevidst er udeladt</strong>.
            &ldquo;Ikke testet: 3. parts betalingsside&rdquo; gør risikoen synlig.
          </p>
        </article>
        <article className="info-tile">
          <h3>Test items</h3>
          <p>
            Build-nummer, commit-hash, containerimage-tag. Uden versionsangivelse kan planen ikke
            gentages.
          </p>
        </article>
        <article className="info-tile">
          <h3>Approach</h3>
          <p>
            Forretningslogik med unit (xUnit), API med integration (
            <Link to="/test/integration">WebApplicationFactory</Link>), kritiske flows med E2E
            (Bruno). Se også <Link to="/test/metodikker">metodikker</Link>.
          </p>
        </article>
        <article className="info-tile">
          <h3>Exit criteria</h3>
          <p>
            100 % must-have kørt, ≥ 95 % bestået, ingen kritiske fejl, grøn regression i CI, p95 &lt;
            500 ms ved 100 brugere.
          </p>
        </article>
      </div>

      <h2 id="risici">Risikomatrice</h2>
      <p>
        Du kan ikke teste alt. Score = <strong>sandsynlighed × konsekvens</strong> (1–5). Klik en
        risiko for afhjælpning — eller drej tallene selv og se, hvor i matricen I lander:
      </p>
      <RiskMatrix
        ariaLabel="Testrisici i sandsynlighed × konsekvens-matrice"
        likelihoodLabel="Sandsynlighed"
        impactLabel="Konsekvens"
        emptyLabel="Vælg en risiko i matricen"
        scoreLabel="Risikoscore"
        mitigationLabel="Afhjælpning"
        tryLabel="Prøv selv: placér en risiko"
        tryHint="Vælg sandsynlighed og konsekvens — cellen i matricen markeres, og du ser prioriteten."
        priorityHint="Høj prioritet — test dybt|Medium — dæk med automation|Lav — spot-check"
        risks={[
          {
            id: 'env',
            title: 'Testmiljø ikke klar',
            likelihood: 3,
            impact: 5,
            mitigation: 'Docker Compose-miljø i repo; automatisk opsætning.',
          },
          {
            id: 'reqs',
            title: 'Krav ændres midt i sprint',
            likelihood: 5,
            impact: 3,
            mitigation: 'Korte planer; regressionssuite; change control.',
          },
          {
            id: 'people',
            title: 'Nøglepersoner syge',
            likelihood: 2,
            impact: 5,
            mitigation: 'Dokumentér testcases; parprogrammering.',
          },
          {
            id: 'flaky',
            title: 'Flaky E2E skjuler fejl',
            likelihood: 3,
            impact: 3,
            mitigation: 'Karantæne-regler, fast testdata, retry-politik.',
          },
          {
            id: 'api',
            title: 'Ekstern API nede',
            likelihood: 3,
            impact: 3,
            mitigation: 'Mock/stub (WireMock) og kontrakttests.',
          },
        ]}
      />
      <p>
        Eksempel: betalingsflow (3 × 5 = 15) prioriteres over &ldquo;skift profilbillede&rdquo; (2 ×
        1 = 2). Matricen gør den prioritering synlig for hele teamet.
      </p>

      <h2 id="krav-til-testcases">4. Fra funktionelle krav til testcases</h2>
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

      <h3 id="sporbarhed">Sporbarhedstavle</h3>
      <p>Klik på et krav for at se, hvilke testcases der dækker det:</p>
      <TraceabilityBoard
        ariaLabel="Sporbarhed mellem krav og testcases"
        requirementsLabel="Krav"
        testCasesLabel="Testcases"
        hintLabel="Vælg et krav til venstre — tilknyttede testcases lyser op til højre."
        requirements={[
          {
            id: 'KRAV-01',
            label: 'Login',
            testCaseIds: ['TC-01', 'TC-02', 'TC-03', 'TC-04', 'TC-05', 'TC-06'],
          },
          {
            id: 'KRAV-02',
            label: 'Opret ordre',
            testCaseIds: ['TC-04b', 'TC-05b', 'TC-06b'],
          },
        ]}
        testCases={[
          { id: 'TC-01', label: 'Gyldigt login', type: 'Positiv' },
          { id: 'TC-02', label: 'Forkert kodeord', type: 'Negativ' },
          { id: 'TC-03', label: 'Konto låses', type: 'Grænse' },
          { id: 'TC-04', label: 'Ukendt email', type: 'Sikkerhed' },
          { id: 'TC-05', label: 'Tomme felter', type: 'Negativ' },
          { id: 'TC-06', label: 'SQL-injection', type: 'Sikkerhed' },
          { id: 'TC-04b', label: 'Gyldig ordre', type: 'Positiv' },
          { id: 'TC-05b', label: 'Tom kurv', type: 'Negativ' },
          { id: 'TC-06b', label: 'Negativ mængde', type: 'Grænse' },
        ]}
      />

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

      <div id="workshop">
      <WorkshopPanel
        storageKey="softwaretest-workshop-testplan-da"
        requirementId="KRAV-01"
        requirementText="En registreret bruger kan logge ind med email og adgangskode. Efter 5 mislykkede forsøg låses kontoen i 15 minutter."
        labels={{
          title: 'Workshop: byg dækning for login',
          lead: 'Vælg scenarier — se testcases og sporbarhed opstå. Markér exit criteria, når I er enige.',
          pickScenarios: 'Vælg scenarier at dække',
          selected: 'Valgt',
          coverage: 'Dækning',
          of: 'af',
          testCases: 'Dine testcases',
          checklistTitle: 'Exit criteria-checklist',
          reset: 'Nulstil',
          input: 'Input',
          expected: 'Forventet',
          type: 'Type',
        }}
        scenarios={[
          {
            id: 'valid',
            title: 'Gyldigt login',
            type: 'Positiv',
            input: 'anna@test.dk / Hemmelig123!',
            expected: '200 + token',
            tcId: 'TC-01',
          },
          {
            id: 'wrong',
            title: 'Forkert kodeord',
            type: 'Negativ',
            input: 'anna@test.dk / forkert',
            expected: '401, ingen token',
            tcId: 'TC-02',
          },
          {
            id: 'lock',
            title: 'Konto låses',
            type: 'Grænse',
            input: '5 × forkert, derefter korrekt',
            expected: '423 Locked',
            tcId: 'TC-03',
          },
          {
            id: 'sqli',
            title: 'SQL-injection',
            type: 'Sikkerhed',
            input: "' OR 1=1 --",
            expected: '401/400, ingen DB-fejl',
            tcId: 'TC-06',
          },
        ]}
        checklist={[
          {
            id: 'must',
            label: '100 % af must-have testcases er udført, og ≥ 95 % består',
          },
          {
            id: 'sev',
            label: 'Ingen åbne fejl af alvorlighed kritisk eller høj',
          },
          {
            id: 'ci',
            label: 'Alle regressionstests er grønne i CI på release-commit',
          },
          {
            id: 'perf',
            label: 'Performance: p95 < 500 ms ved 100 samtidige brugere',
          },
        ]}
      />
      </div>

      <h3 id="automation">Testcases som automatiseret kode</h3>
      <p>
        Hver række i tabellen kan blive til en test. Bemærk navngivning med TC-ID og
        krav-ID, som giver sporbarhed direkte i testresultaterne:
      </p>
      <CodeBlock language="csharp">{testCaseCsharp}</CodeBlock>

      <h2 id="skabelon">5. Skabelon til testcases</h2>
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

      <Callout type="tip">
        Gem testplanen i repoet som Markdown ved siden af koden. Så versionsstyres den,
        kan reviewes i pull requests og følger releasen — præcis som koden.
      </Callout>

      <h2 id="rapportering">6. Rapportering</h2>
      <p>
        Efter udførelsen laves en kort testrapport: antal tests planlagt/kørt/bestået/
        fejlet/blokeret, åbne fejl pr. alvorlighed, afvigelser fra planen, og en
        anbefaling (go/no-go). Det er input til{' '}
        <Link to="/test/release">release-beslutningen</Link>.
      </p>

      <h2 id="oevelse">Øvelse</h2>
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
