import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import Figure from '../../components/Figure'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'
import Split from '../../components/Split'

const pyramid = `
flowchart TB
  E2E["E2E / UI-tests<br/>få, langsomme, dyre"]
  INT["Integrationstests<br/>nogle, middel hastighed"]
  UNIT["Unit tests<br/>mange, hurtige, billige"]
  E2E --> INT --> UNIT
  style E2E fill:#7f1d1d,stroke:#f87171,color:#fff
  style INT fill:#78350f,stroke:#fbbf24,color:#fff
  style UNIT fill:#14532d,stroke:#4ade80,color:#fff
`

const typeMap = `
flowchart LR
  T["Softwaretest"] --> F["Funktionel test<br/>Gør systemet det rigtige?"]
  T --> NF["Ikke-funktionel test<br/>Gør det det godt nok?"]
  F --> U["Unit"]
  F --> I["Integration"]
  F --> S["System / E2E"]
  F --> A["Accept (UAT)"]
  F --> R["Regression / Smoke"]
  NF --> P["Performance / Tryk"]
  NF --> SEC["Sikkerhed"]
  NF --> UX["UX / Usability"]
  NF --> ACC["Tilgængelighed"]
`

const flow = `
flowchart LR
  K["Krav"] --> P["Testplan"]
  P --> M["Metodikker"]
  M --> U["Unit"]
  M --> I["Integration"]
  M --> E["E2E (Bruno)"]
  U --> C["CI/CD"]
  I --> C
  E --> C
  C --> R["Release-beslutning"]
  R --> T["Tryk / Performance / UX / Sikkerhed"]
`

const aaaExample = `
// Det mindste eksempel på en funktionstest i xUnit (AAA-mønstret)
public class PrisberegnerTests
{
    [Fact]
    public void Rabat_OverHundredeKroner_Giver10Procent()
    {
        // Arrange - opstil forudsætninger
        var beregner = new Prisberegner();

        // Act - udfør handlingen
        var pris = beregner.MedRabat(subtotal: 200m);

        // Assert - verificér forventet resultat
        Assert.Equal(180m, pris);
    }
}
`

export default function OversigtPageDa() {

  return (
    <LessonLayout module="test">

<h1>Test — oversigt: fejltest, funktionstest og websikkerhed</h1>

      <p>
        Denne side er <strong>landkortet</strong> for hele test-modulet. Den giver dig
        overblikket over, hvilke typer test der findes, hvordan de hænger sammen, og
        hvordan websikkerhed passer ind som en særlig form for ikke-funktionel test. De
        øvrige sider dykker ned i detaljerne.
      </p>

      <h2>Læringsmål</h2>
      <p>Når du har læst siden, kan du:</p>
      <ul>
        <li>
          forklare forskellen mellem <strong>fejltest</strong> (finde defekter) og{' '}
          <strong>funktionstest</strong> (verificere krav),
        </li>
        <li>placere unit-, integrations-, system- og accepttest i testpyramiden,</li>
        <li>skelne mellem funktionelle og ikke-funktionelle tests,</li>
        <li>
          nævne de centrale sikkerhedsemner, som en webudvikler skal kunne teste og
          forebygge, og
        </li>
        <li>navigere på sitet, så du ved hvor du skal læse videre.</li>
      </ul>

      <h2>1. Hvorfor tester vi?</h2>
      <p>
        Software indeholder fejl. Det er ikke et spørgsmål om <em>om</em>, men{' '}
        <em>hvor mange</em> og <em>hvor dyre de er</em>. Test er den systematiske
        aktivitet, der afdækker forskellen mellem det, systemet <em>faktisk</em> gør, og
        det, det <em>burde</em> gøre. Test kan aldrig bevise, at der ingen fejl er
        (Dijkstra: &ldquo;testing shows the presence, not the absence of bugs&rdquo;) — men
        den kan skabe tillid og reducere risiko.
      </p>
      <p>
        Omkostningen ved en fejl vokser typisk dramatisk jo senere den opdages: en fejl
        fundet af en udviklers unit test koster minutter; samme fejl fundet af en kunde i
        produktion kan koste dage, data, penge og omdømme.
      </p>

      <h3>De syv klassiske testprincipper (ISTQB)</h3>
      <ol>
        <li>Test viser tilstedeværelsen af fejl, ikke fraværet.</li>
        <li>Udtømmende test er umulig — vi prioriterer ud fra risiko.</li>
        <li>Tidlig test sparer tid og penge (&ldquo;shift left&rdquo;).</li>
        <li>Fejl klumper sig sammen (Pareto: ca. 80 % af fejlene i 20 % af koden).</li>
        <li>Pesticidparadokset: de samme tests finder til sidst ingen nye fejl.</li>
        <li>Test afhænger af konteksten — en bankapp testes anderledes end et spil.</li>
        <li>&ldquo;Ingen fejl fundet&rdquo; er en vildfarelse, hvis systemet ikke opfylder behovet.</li>
      </ol>

      <h2>2. Fejltest vs. funktionstest</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Fejltest (defect testing)</th>
            <th>Funktionstest (validation)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mål</td>
            <td>Finde fejl — forsøge at få systemet til at fejle</td>
            <td>Vise at kravene er opfyldt</td>
          </tr>
          <tr>
            <td>Tankegang</td>
            <td>&ldquo;Hvordan kan jeg bryde det?&rdquo;</td>
            <td>&ldquo;Gør det det, som er aftalt?&rdquo;</td>
          </tr>
          <tr>
            <td>Typiske input</td>
            <td>Ugyldige, grænseværdier, tomme, enorme, ondsindede</td>
            <td>Gyldige scenarier fra krav og user stories</td>
          </tr>
          <tr>
            <td>Eksempel</td>
            <td>Indsæt <code>&apos; OR 1=1 --</code> i loginfeltet</td>
            <td>Bruger med korrekt login kommer ind på forsiden</td>
          </tr>
          <tr>
            <td>Udspringer af</td>
            <td>Erfaring, risikoanalyse, fejlmønstre</td>
            <td>Kravspecifikation, acceptkriterier</td>
          </tr>
        </tbody>
      </table>
      <p>
        I praksis supplerer de to hinanden: funktionstests beskytter det, vi allerede
        ved skal virke, mens fejltest (fx eksplorativ test og negative testcases) leder
        efter det, ingen har tænkt på.
      </p>

      <h2>3. Kort over testtyper</h2>
      <MermaidDiagram chart={typeMap} />

      <h3>Funktionelle tests</h3>
      <ul>
        <li>
          <strong>Unit test</strong> — en enkelt metode/klasse isoleret. Hurtig og
          præcis. Se <Link to="/test/unit">Unit testing</Link>.
        </li>
        <li>
          <strong>Integrationstest</strong> — flere komponenter sammen (API + database,
          service + service). Se <Link to="/test/integration">Integrationstest</Link>.
        </li>
        <li>
          <strong>Systemtest / E2E</strong> — hele systemet set udefra, fx via HTTP eller
          browser. Se <Link to="/test/bruno-e2e">Bruno og E2E</Link>.
        </li>
        <li>
          <strong>Accepttest (UAT)</strong> — kunden/brugeren afgør, om løsningen er
          &ldquo;god nok&rdquo; til at blive taget i brug.
        </li>
        <li>
          <strong>Smoke- og regressionstest</strong> — hurtig sanity-check og
          &ldquo;er der gået noget i stykker?&rdquo;. Se{' '}
          <Link to="/test/metodikker">Testmetodikker</Link>.
        </li>
      </ul>

      <h3>Ikke-funktionelle tests</h3>
      <ul>
        <li>
          <strong>Performance</strong> — hastighed og stabilitet under belastning. Se{' '}
          <Link to="/test/performance">Performance</Link>.
        </li>
        <li>
          <strong>Sikkerhedstest</strong> — modstandsdygtighed mod angreb (se afsnit 5).
        </li>
        <li>
          <strong>Usability/UX-test</strong> — hvor nemt og behageligt det er at bruge.
          Se <Link to="/test/ux">UX-test</Link>.
        </li>
        <li>
          <strong>Kompatibilitet</strong> — browsere, enheder, OS, skærmstørrelser.
        </li>
        <li>
          <strong>Tilgængelighed</strong> — kan brugere med handicap bruge løsningen
          (WCAG).
        </li>
      </ul>

      <h2>4. Testpyramiden</h2>
      <Split
        mediaFirst
        media={
          <Figure
            src="/images/commons/testing-pyramid.png"
            alt="Testpyramide med mange unit-tests i bunden og få end-to-end-tests i toppen"
            caption="Testpyramiden: flest unit-tests, færre integrationstests, få E2E-tests"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Testing_Pyramid.png"
            sourceLabel="Wikimedia Commons"
            size="sm"
          />
        }
      >
        <p>
          Mike Cohns testpyramide er en tommelfingerregel for <em>fordelingen</em> af
          automatiserede tests. Jo højere op, jo mere realistisk — men også jo langsommere,
          mere skrøbelig og dyrere at vedligeholde.
        </p>
        <MermaidDiagram chart={pyramid} />
      </Split>

      <table>
        <thead>
          <tr>
            <th>Lag</th>
            <th>Hastighed</th>
            <th>Pris/vedligehold</th>
            <th>Fejllokalisering</th>
            <th>Realisme</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unit</td>
            <td>Millisekunder</td>
            <td>Lav</td>
            <td>Præcis (én metode)</td>
            <td>Lav</td>
          </tr>
          <tr>
            <td>Integration</td>
            <td>Sekunder</td>
            <td>Middel</td>
            <td>Et par komponenter</td>
            <td>Middel</td>
          </tr>
          <tr>
            <td>E2E</td>
            <td>Sekunder–minutter</td>
            <td>Høj</td>
            <td>Utydelig (hele stakken)</td>
            <td>Høj</td>
          </tr>
        </tbody>
      </table>

      <Callout type="warn">
        <strong>Anti-mønster: isbjerget (ice cream cone).</strong> Mange manuelle og
        E2E-tests, få unit tests. Det giver langsom feedback, flaky tests og høj
        vedligeholdelsesbyrde. Sigt mod en bred base af hurtige tests.
      </Callout>

      <h3>AAA — fælles skabelon for alle lag</h3>
      <p>
        Uanset lag følger en god automatiseret test mønstret <strong>Arrange – Act –
        Assert</strong>. Det gør testen læsbar og fokuseret på én ting.
      </p>
      <CodeBlock language="csharp">{aaaExample}</CodeBlock>

      <h2>5. Introduktion til websikkerhed</h2>
      <p>
        Sikkerhedstest er en ikke-funktionel testform: systemet kan opfylde alle
        funktionelle krav og alligevel være åbent for angreb. En webapplikation er
        særligt udsat, fordi den er tilgængelig fra internettet og håndterer input fra
        ukendte parter. Sikkerhed er ikke et lag man &ldquo;skruer på til sidst&rdquo; —
        det skal tænkes ind i design, kode, test og drift (<em>security by design</em>).
      </p>

      <h3>CIA-triaden</h3>
      <ul>
        <li>
          <strong>Confidentiality (fortrolighed)</strong> — kun autoriserede ser data.
        </li>
        <li>
          <strong>Integrity (integritet)</strong> — data ændres kun på lovlig vis.
        </li>
        <li>
          <strong>Availability (tilgængelighed)</strong> — systemet er oppe, når det
          skal bruges.
        </li>
      </ul>

      <h3>Sikkerhedsemner på dette site</h3>
      <table>
        <thead>
          <tr>
            <th>Emne</th>
            <th>Kerneidé</th>
            <th>Læs mere</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kryptering</td>
            <td>Beskyt data i transit (TLS/SSL) og i hvile</td>
            <td>
              <Link to="/sikkerhed/kryptering">/sikkerhed/kryptering</Link>
            </td>
          </tr>
          <tr>
            <td>Standarder</td>
            <td>OWASP Top 10, CVE/CWE, kendte sårbarheder</td>
            <td>
              <Link to="/sikkerhed/standarder">/sikkerhed/standarder</Link>
            </td>
          </tr>
          <tr>
            <td>Authentication</td>
            <td>Hvem er du? OAuth2/OIDC, JWT, MFA</td>
            <td>
              <Link to="/sikkerhed/authentication">/sikkerhed/authentication</Link>
            </td>
          </tr>
          <tr>
            <td>Hashing</td>
            <td>Opbevar adgangskoder sikkert (bcrypt/Argon2, ikke MD5)</td>
            <td>
              <Link to="/sikkerhed/hashing">/sikkerhed/hashing</Link>
            </td>
          </tr>
          <tr>
            <td>Angreb</td>
            <td>SQL injection, XSS, CSRF m.fl. og forsvar</td>
            <td>
              <Link to="/sikkerhed/angreb">/sikkerhed/angreb</Link>
            </td>
          </tr>
          <tr>
            <td>Security tools</td>
            <td>OWASP ZAP, Burp, SAST/DAST, dependency-scanning</td>
            <td>
              <Link to="/sikkerhed/tools">/sikkerhed/tools</Link>
            </td>
          </tr>
          <tr>
            <td>GDPR og cookies</td>
            <td>Dataansvarlig, principper, samtykke, privatlivs- og cookiepolitik</td>
            <td>
              <Link to="/sikkerhed/gdpr">/sikkerhed/gdpr</Link>
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Sikkerhed som testbart krav</h3>
      <p>
        Sikkerhed kan og skal testes konkret. Eksempler på sikkerhedstestcases, der kan
        automatiseres sammen med funktionstests:
      </p>
      <ul>
        <li>Kald til beskyttet endpoint uden token returnerer 401.</li>
        <li>Bruger med forkert rolle får 403 (ikke 200 og ikke 404).</li>
        <li>
          Input som <code>&lt;script&gt;alert(1)&lt;/script&gt;</code> bliver encodet i
          output.
        </li>
        <li>Parametriserede queries — injection-strenge giver ikke SQL-fejl eller data-læk.</li>
        <li>HTTP omdirigeres til HTTPS, og sikkerhedsheadere (HSTS, CSP) er sat.</li>
      </ul>

      <Callout type="info">
        Sikkerhedstest passer perfekt ind i CI/CD: kør dependency-scanning og en
        DAST-baseline (fx ZAP) automatisk ved hver build. Se{' '}
        <Link to="/test/ci-cd">CI/CD</Link> og{' '}
        <Link to="/sikkerhed/tools">Security tools</Link>.
      </Callout>

      <h2>6. Sådan er sitet organiseret</h2>
      <p>
        Modulet følger en naturlig rækkefølge fra planlægning til drift. Hver side
        svarer til et eller flere <Link to="/maalpinde">målpinde</Link>.
      </p>
      <MermaidDiagram chart={flow} />

      <table>
        <thead>
          <tr>
            <th>Side</th>
            <th>Målpind</th>
            <th>Fokus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <Link to="/test/testplan">Testplan</Link>
            </td>
            <td>#2</td>
            <td>Planlæg tests ud fra funktionelle krav</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/metodikker">Testmetodikker</Link>
            </td>
            <td>#3</td>
            <td>Black/white box, eksplorativ, regression m.m.</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/unit">Unit</Link> /{' '}
              <Link to="/test/integration">Integration</Link>
            </td>
            <td>—</td>
            <td>Praktisk teknik i .NET</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/release">Release</Link>
            </td>
            <td>#4</td>
            <td>Hvornår er det testet nok?</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/bruno-e2e">Bruno/E2E</Link>
            </td>
            <td>#5</td>
            <td>Scriptede tests af API/web</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/ci-cd">CI/CD</Link>
            </td>
            <td>#6</td>
            <td>Automatisér i udviklingscyklussen</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/performance">Performance</Link>
            </td>
            <td>#7</td>
            <td>Performancetabeller og flaskehalse</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/ux">UX</Link>
            </td>
            <td>#8</td>
            <td>Kundeoplevelsen</td>
          </tr>
          <tr>
            <td>Sikkerhed</td>
            <td>#9–14 + GDPR</td>
            <td>Kryptering, standarder, auth, hashing, angreb, tools, GDPR</td>
          </tr>
        </tbody>
      </table>

      <h2>Øvelse</h2>
      <ol>
        <li>
          Vælg en lille funktion i et projekt du kender (fx login eller en
          prisberegning). Skriv <strong>tre funktionstests</strong> (gyldige scenarier) og{' '}
          <strong>tre fejltests</strong> (ugyldige/ondsindede input) som tekst.
        </li>
        <li>Placér hver test i pyramiden: unit, integration eller E2E — og begrund valget.</li>
        <li>
          Vælg to af sikkerhedsemnerne ovenfor og formulér én konkret, automatiserbar
          sikkerhedstest for hver.
        </li>
        <li>
          Tegn din egen version af testpyramiden for det projekt, du arbejder på nu: hvor
          mange tests har I på hvert lag? Ligner det en pyramide eller et isbjerg?
        </li>
      </ol>

      <Callout type="tip">
        Gå videre til <Link to="/test/testplan">Testplan</Link> for at lære at omsætte
        krav til en struktureret plan.
      </Callout>
    </LessonLayout>
  )
}
