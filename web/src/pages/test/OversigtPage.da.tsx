import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath } from '../../data/objectives'

const pyramid = `
flowchart TB
  E2E["E2E / UI-tests<br/>fÃƒÂ¥, langsomme, dyre"]
  INT["Integrationstests<br/>nogle, middel hastighed"]
  UNIT["Unit tests<br/>mange, hurtige, billige"]
  E2E --> INT --> UNIT
  style E2E fill:#7f1d1d,stroke:#f87171,color:#fff
  style INT fill:#78350f,stroke:#fbbf24,color:#fff
  style UNIT fill:#14532d,stroke:#4ade80,color:#fff
`

const typeMap = `
flowchart LR
  T["Softwaretest"] --> F["Funktionel test<br/>GÃƒÂ¸r systemet det rigtige?"]
  T --> NF["Ikke-funktionel test<br/>GÃƒÂ¸r det det godt nok?"]
  F --> U["Unit"]
  F --> I["Integration"]
  F --> S["System / E2E"]
  F --> A["Accept (UAT)"]
  F --> R["Regression / Smoke"]
  NF --> P["Performance / Tryk"]
  NF --> SEC["Sikkerhed"]
  NF --> UX["UX / Usability"]
  NF --> ACC["TilgÃƒÂ¦ngelighed"]
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
// Det mindste eksempel pÃƒÂ¥ en funktionstest i xUnit (AAA-mÃƒÂ¸nstret)
public class PrisberegnerTests
{
    [Fact]
    public void Rabat_OverHundredeKroner_Giver10Procent()
    {
        // Arrange - opstil forudsÃƒÂ¦tninger
        var beregner = new Prisberegner();

        // Act - udfÃƒÂ¸r handlingen
        var pris = beregner.MedRabat(subtotal: 200m);

        // Assert - verificÃƒÂ©r forventet resultat
        Assert.Equal(180m, pris);
    }
}
`

export default function OversigtPageDa() {
  const objective = getObjectiveByPath('/test/oversigt')

  return (
    <LessonLayout module="test">
      <header>
        {objective ? (
          <p>
            <ObjectiveBadge level={objective.level} /> <strong>MÃƒÂ¥lpind {objective.id}</strong>
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

      <h1>Test Ã¢â‚¬â€ oversigt: fejltest, funktionstest og websikkerhed</h1>

      <p>
        Denne side er <strong>landkortet</strong> for hele test-modulet. Den giver dig
        overblikket over, hvilke typer test der findes, hvordan de hÃƒÂ¦nger sammen, og
        hvordan websikkerhed passer ind som en sÃƒÂ¦rlig form for ikke-funktionel test. De
        ÃƒÂ¸vrige sider dykker ned i detaljerne.
      </p>

      <h2>LÃƒÂ¦ringsmÃƒÂ¥l</h2>
      <p>NÃƒÂ¥r du har lÃƒÂ¦st siden, kan du:</p>
      <ul>
        <li>
          forklare forskellen mellem <strong>fejltest</strong> (finde defekter) og{' '}
          <strong>funktionstest</strong> (verificere krav),
        </li>
        <li>placere unit-, integrations-, system- og accepttest i testpyramiden,</li>
        <li>skelne mellem funktionelle og ikke-funktionelle tests,</li>
        <li>
          nÃƒÂ¦vne de centrale sikkerhedsemner, som en webudvikler skal kunne teste og
          forebygge, og
        </li>
        <li>navigere pÃƒÂ¥ sitet, sÃƒÂ¥ du ved hvor du skal lÃƒÂ¦se videre.</li>
      </ul>

      <h2>1. Hvorfor tester vi?</h2>
      <p>
        Software indeholder fejl. Det er ikke et spÃƒÂ¸rgsmÃƒÂ¥l om <em>om</em>, men{' '}
        <em>hvor mange</em> og <em>hvor dyre de er</em>. Test er den systematiske
        aktivitet, der afdÃƒÂ¦kker forskellen mellem det, systemet <em>faktisk</em> gÃƒÂ¸r, og
        det, det <em>burde</em> gÃƒÂ¸re. Test kan aldrig bevise, at der ingen fejl er
        (Dijkstra: &ldquo;testing shows the presence, not the absence of bugs&rdquo;) Ã¢â‚¬â€ men
        den kan skabe tillid og reducere risiko.
      </p>
      <p>
        Omkostningen ved en fejl vokser typisk dramatisk jo senere den opdages: en fejl
        fundet af en udviklers unit test koster minutter; samme fejl fundet af en kunde i
        produktion kan koste dage, data, penge og omdÃƒÂ¸mme.
      </p>

      <h3>De syv klassiske testprincipper (ISTQB)</h3>
      <ol>
        <li>Test viser tilstedevÃƒÂ¦relsen af fejl, ikke fravÃƒÂ¦ret.</li>
        <li>UdtÃƒÂ¸mmende test er umulig Ã¢â‚¬â€ vi prioriterer ud fra risiko.</li>
        <li>Tidlig test sparer tid og penge (&ldquo;shift left&rdquo;).</li>
        <li>Fejl klumper sig sammen (Pareto: ca. 80 % af fejlene i 20 % af koden).</li>
        <li>Pesticidparadokset: de samme tests finder til sidst ingen nye fejl.</li>
        <li>Test afhÃƒÂ¦nger af konteksten Ã¢â‚¬â€ en bankapp testes anderledes end et spil.</li>
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
            <td>MÃƒÂ¥l</td>
            <td>Finde fejl Ã¢â‚¬â€ forsÃƒÂ¸ge at fÃƒÂ¥ systemet til at fejle</td>
            <td>Vise at kravene er opfyldt</td>
          </tr>
          <tr>
            <td>Tankegang</td>
            <td>&ldquo;Hvordan kan jeg bryde det?&rdquo;</td>
            <td>&ldquo;GÃƒÂ¸r det det, som er aftalt?&rdquo;</td>
          </tr>
          <tr>
            <td>Typiske input</td>
            <td>Ugyldige, grÃƒÂ¦nsevÃƒÂ¦rdier, tomme, enorme, ondsindede</td>
            <td>Gyldige scenarier fra krav og user stories</td>
          </tr>
          <tr>
            <td>Eksempel</td>
            <td>IndsÃƒÂ¦t <code>&apos; OR 1=1 --</code> i loginfeltet</td>
            <td>Bruger med korrekt login kommer ind pÃƒÂ¥ forsiden</td>
          </tr>
          <tr>
            <td>Udspringer af</td>
            <td>Erfaring, risikoanalyse, fejlmÃƒÂ¸nstre</td>
            <td>Kravspecifikation, acceptkriterier</td>
          </tr>
        </tbody>
      </table>
      <p>
        I praksis supplerer de to hinanden: funktionstests beskytter det, vi allerede
        ved skal virke, mens fejltest (fx eksplorativ test og negative testcases) leder
        efter det, ingen har tÃƒÂ¦nkt pÃƒÂ¥.
      </p>

      <h2>3. Kort over testtyper</h2>
      <MermaidDiagram chart={typeMap} />

      <h3>Funktionelle tests</h3>
      <ul>
        <li>
          <strong>Unit test</strong> Ã¢â‚¬â€ en enkelt metode/klasse isoleret. Hurtig og
          prÃƒÂ¦cis. Se <Link to="/test/unit">Unit testing</Link>.
        </li>
        <li>
          <strong>Integrationstest</strong> Ã¢â‚¬â€ flere komponenter sammen (API + database,
          service + service). Se <Link to="/test/integration">Integrationstest</Link>.
        </li>
        <li>
          <strong>Systemtest / E2E</strong> Ã¢â‚¬â€ hele systemet set udefra, fx via HTTP eller
          browser. Se <Link to="/test/bruno-e2e">Bruno og E2E</Link>.
        </li>
        <li>
          <strong>Accepttest (UAT)</strong> Ã¢â‚¬â€ kunden/brugeren afgÃƒÂ¸r, om lÃƒÂ¸sningen er
          &ldquo;god nok&rdquo; til at blive taget i brug.
        </li>
        <li>
          <strong>Smoke- og regressionstest</strong> Ã¢â‚¬â€ hurtig sanity-check og
          &ldquo;er der gÃƒÂ¥et noget i stykker?&rdquo;. Se{' '}
          <Link to="/test/metodikker">Testmetodikker</Link>.
        </li>
      </ul>

      <h3>Ikke-funktionelle tests</h3>
      <ul>
        <li>
          <strong>Performance og tryktest</strong> Ã¢â‚¬â€ hastighed og stabilitet under
          belastning. Se <Link to="/test/tryk">Tryktest</Link> og{' '}
          <Link to="/test/performance">Performance</Link>.
        </li>
        <li>
          <strong>Sikkerhedstest</strong> Ã¢â‚¬â€ modstandsdygtighed mod angreb (se afsnit 5).
        </li>
        <li>
          <strong>Usability/UX-test</strong> Ã¢â‚¬â€ hvor nemt og behageligt det er at bruge.
          Se <Link to="/test/ux">UX-test</Link>.
        </li>
        <li>
          <strong>Kompatibilitet</strong> Ã¢â‚¬â€ browsere, enheder, OS, skÃƒÂ¦rmstÃƒÂ¸rrelser.
        </li>
        <li>
          <strong>TilgÃƒÂ¦ngelighed</strong> Ã¢â‚¬â€ kan brugere med handicap bruge lÃƒÂ¸sningen
          (WCAG).
        </li>
      </ul>

      <h2>4. Testpyramiden</h2>
      <p>
        Mike Cohns testpyramide er en tommelfingerregel for <em>fordelingen</em> af
        automatiserede tests. Jo hÃƒÂ¸jere op, jo mere realistisk Ã¢â‚¬â€ men ogsÃƒÂ¥ jo langsommere,
        mere skrÃƒÂ¸belig og dyrere at vedligeholde.
      </p>
      <MermaidDiagram chart={pyramid} />

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
            <td>PrÃƒÂ¦cis (ÃƒÂ©n metode)</td>
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
            <td>SekunderÃ¢â‚¬â€œminutter</td>
            <td>HÃƒÂ¸j</td>
            <td>Utydelig (hele stakken)</td>
            <td>HÃƒÂ¸j</td>
          </tr>
        </tbody>
      </table>

      <Callout type="warn">
        <strong>Anti-mÃƒÂ¸nster: isbjerget (ice cream cone).</strong> Mange manuelle og
        E2E-tests, fÃƒÂ¥ unit tests. Det giver langsom feedback, flaky tests og hÃƒÂ¸j
        vedligeholdelsesbyrde. Sigt mod en bred base af hurtige tests.
      </Callout>

      <h3>AAA Ã¢â‚¬â€ fÃƒÂ¦lles skabelon for alle lag</h3>
      <p>
        Uanset lag fÃƒÂ¸lger en god automatiseret test mÃƒÂ¸nstret <strong>Arrange Ã¢â‚¬â€œ Act Ã¢â‚¬â€œ
        Assert</strong>. Det gÃƒÂ¸r testen lÃƒÂ¦sbar og fokuseret pÃƒÂ¥ ÃƒÂ©n ting.
      </p>
      <CodeBlock language="csharp">{aaaExample}</CodeBlock>

      <h2>5. Introduktion til websikkerhed</h2>
      <p>
        Sikkerhedstest er en ikke-funktionel testform: systemet kan opfylde alle
        funktionelle krav og alligevel vÃƒÂ¦re ÃƒÂ¥bent for angreb. En webapplikation er
        sÃƒÂ¦rligt udsat, fordi den er tilgÃƒÂ¦ngelig fra internettet og hÃƒÂ¥ndterer input fra
        ukendte parter. Sikkerhed er ikke et lag man &ldquo;skruer pÃƒÂ¥ til sidst&rdquo; Ã¢â‚¬â€
        det skal tÃƒÂ¦nkes ind i design, kode, test og drift (<em>security by design</em>).
      </p>

      <h3>CIA-triaden</h3>
      <ul>
        <li>
          <strong>Confidentiality (fortrolighed)</strong> Ã¢â‚¬â€ kun autoriserede ser data.
        </li>
        <li>
          <strong>Integrity (integritet)</strong> Ã¢â‚¬â€ data ÃƒÂ¦ndres kun pÃƒÂ¥ lovlig vis.
        </li>
        <li>
          <strong>Availability (tilgÃƒÂ¦ngelighed)</strong> Ã¢â‚¬â€ systemet er oppe, nÃƒÂ¥r det
          skal bruges.
        </li>
      </ul>

      <h3>Sikkerhedsemner pÃƒÂ¥ dette site</h3>
      <table>
        <thead>
          <tr>
            <th>Emne</th>
            <th>KerneidÃƒÂ©</th>
            <th>LÃƒÂ¦s mere</th>
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
            <td>OWASP Top 10, CVE/CWE, kendte sÃƒÂ¥rbarheder</td>
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
        </tbody>
      </table>

      <h3>Sikkerhed som testbart krav</h3>
      <p>
        Sikkerhed kan og skal testes konkret. Eksempler pÃƒÂ¥ sikkerhedstestcases, der kan
        automatiseres sammen med funktionstests:
      </p>
      <ul>
        <li>Kald til beskyttet endpoint uden token returnerer 401.</li>
        <li>Bruger med forkert rolle fÃƒÂ¥r 403 (ikke 200 og ikke 404).</li>
        <li>
          Input som <code>&lt;script&gt;alert(1)&lt;/script&gt;</code> bliver encodet i
          output.
        </li>
        <li>Parametriserede queries Ã¢â‚¬â€ injection-strenge giver ikke SQL-fejl eller data-lÃƒÂ¦k.</li>
        <li>HTTP omdirigeres til HTTPS, og sikkerhedsheadere (HSTS, CSP) er sat.</li>
      </ul>

      <Callout type="info">
        Sikkerhedstest passer perfekt ind i CI/CD: kÃƒÂ¸r dependency-scanning og en
        DAST-baseline (fx ZAP) automatisk ved hver build. Se{' '}
        <Link to="/test/ci-cd">CI/CD</Link> og{' '}
        <Link to="/sikkerhed/tools">Security tools</Link>.
      </Callout>

      <h2>6. SÃƒÂ¥dan er sitet organiseret</h2>
      <p>
        Modulet fÃƒÂ¸lger en naturlig rÃƒÂ¦kkefÃƒÂ¸lge fra planlÃƒÂ¦gning til drift. Hver side
        svarer til et eller flere <Link to="/maalpinde">mÃƒÂ¥lpinde</Link>.
      </p>
      <MermaidDiagram chart={flow} />

      <table>
        <thead>
          <tr>
            <th>Side</th>
            <th>MÃƒÂ¥lpind</th>
            <th>Fokus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <Link to="/test/testplan">Testplan</Link>
            </td>
            <td>#2</td>
            <td>PlanlÃƒÂ¦g tests ud fra funktionelle krav</td>
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
            <td>Ã¢â‚¬â€</td>
            <td>Praktisk teknik i .NET</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/release">Release</Link>
            </td>
            <td>#4</td>
            <td>HvornÃƒÂ¥r er det testet nok?</td>
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
            <td>AutomatisÃƒÂ©r i udviklingscyklussen</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/tryk">Tryk</Link> /{' '}
              <Link to="/test/performance">Performance</Link>
            </td>
            <td>#7Ã¢â‚¬â€œ8</td>
            <td>Belastning, hardware, flaskehalse</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/ux">UX</Link>
            </td>
            <td>#9</td>
            <td>Kundeoplevelsen</td>
          </tr>
          <tr>
            <td>Sikkerhed</td>
            <td>#10Ã¢â‚¬â€œ15</td>
            <td>Kryptering, standarder, auth, hashing, angreb, tools</td>
          </tr>
        </tbody>
      </table>

      <h2>ÃƒËœvelse</h2>
      <ol>
        <li>
          VÃƒÂ¦lg en lille funktion i et projekt du kender (fx login eller en
          prisberegning). Skriv <strong>tre funktionstests</strong> (gyldige scenarier) og{' '}
          <strong>tre fejltests</strong> (ugyldige/ondsindede input) som tekst.
        </li>
        <li>PlacÃƒÂ©r hver test i pyramiden: unit, integration eller E2E Ã¢â‚¬â€ og begrund valget.</li>
        <li>
          VÃƒÂ¦lg to af sikkerhedsemnerne ovenfor og formulÃƒÂ©r ÃƒÂ©n konkret, automatiserbar
          sikkerhedstest for hver.
        </li>
        <li>
          Tegn din egen version af testpyramiden for det projekt, du arbejder pÃƒÂ¥ nu: hvor
          mange tests har I pÃƒÂ¥ hvert lag? Ligner det en pyramide eller et isbjerg?
        </li>
      </ol>

      <Callout type="tip">
        GÃƒÂ¥ videre til <Link to="/test/testplan">Testplan</Link> for at lÃƒÂ¦re at omsÃƒÂ¦tte
        krav til en struktureret plan.
      </Callout>
    </LessonLayout>
  )
}
