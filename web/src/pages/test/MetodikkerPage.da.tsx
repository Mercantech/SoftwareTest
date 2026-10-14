import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath } from '../../data/objectives'

const overview = `
flowchart TB
  M["Testmetodikker"] --> D["Design-teknikker"]
  M --> S["Strategier / tilgange"]
  M --> L["Niveauer"]
  D --> BB["Black box<br/>(specifikationsbaseret)"]
  D --> WB["White box<br/>(strukturbaseret)"]
  D --> EXP["Erfaringsbaseret<br/>(eksplorativ)"]
  BB --> EQ["Ãƒâ€ kvivalensklasser"]
  BB --> BV["GrÃƒÂ¦nsevÃƒÂ¦rdier"]
  BB --> DT["Beslutningstabeller"]
  WB --> ST["Statement / branch coverage"]
  S --> SM["Smoke"]
  S --> RG["Regression"]
  L --> U["Unit"]
  L --> I["Integration"]
  L --> E["E2E"]
`

const whichWhen = `
flowchart TD
  Q1{"Ny build klar?"} -->|Ja| SMK["1. Smoke-test"]
  SMK -->|Fejl| STOP["Stop og returnÃƒÂ©r build"]
  SMK -->|OK| REG["2. Regressionssuite i CI"]
  REG --> NEW{"Ny funktionalitet?"}
  NEW -->|Ja| FT["3. Nye funktionstests<br/>EP + BVA"]
  NEW --> EXPL["4. Eksplorativ session"]
  FT --> EXPL
  EXPL --> DONE["Release-beslutning"]
`

const bvaCode = `
// Krav: "Rabatten er 0 % under 100 kr, 10 % fra 100 kr til og med 499 kr, 20 % fra 500 kr"
public static class Rabat
{
    public static decimal Procent(decimal subtotal) => subtotal switch
    {
        < 0    => throw new ArgumentOutOfRangeException(nameof(subtotal)),
        < 100  => 0m,
        < 500  => 10m,
        _      => 20m
    };
}

public class RabatTests
{
    // Ãƒâ€ kvivalensklasser: [0..99.99] -> 0, [100..499.99] -> 10, [500..] -> 20, [<0] -> fejl
    // GrÃƒÂ¦nsevÃƒÂ¦rdier: lige under, pÃƒÂ¥ og lige over hver grÃƒÂ¦nse
    [Theory]
    [InlineData(0,      0)]    // nedre grÃƒÂ¦nse for klasse 1
    [InlineData(99.99,  0)]    // lige under 100
    [InlineData(100,    10)]   // PÃƒâ€¦ grÃƒÂ¦nsen
    [InlineData(100.01, 10)]
    [InlineData(499.99, 10)]   // lige under 500
    [InlineData(500,    20)]   // PÃƒâ€¦ grÃƒÂ¦nsen
    [InlineData(10000,  20)]   // reprÃƒÂ¦sentant for ÃƒÂ¸vre klasse
    public void Procent_GiverKorrektRabat(double subtotal, double forventet)
        => Assert.Equal((decimal)forventet, Rabat.Procent((decimal)subtotal));

    [Fact]
    public void Procent_NegativSubtotal_Kaster()
        => Assert.Throws<ArgumentOutOfRangeException>(() => Rabat.Procent(-0.01m));
}
`

const whiteBoxCode = `
public static string Klassificer(int alder, bool harSamtykke)
{
    if (alder < 0) return "ugyldig";             // gren A
    if (alder < 13) return "barn";               // gren B
    if (alder < 18 && !harSamtykke) return "afvist"; // gren C
    return "godkendt";                           // gren D
}

// Branch coverage (alle beslutninger bÃƒÂ¥de true/false) krÃƒÂ¦ver mindst:
// (-1, _)      -> A
// (10, _)      -> B
// (15, false)  -> C
// (15, true)   -> D  (kombination der gÃƒÂ¸r 'alder<18 && !samtykke' false)
// (30, false)  -> D  (viser at 'alder<18' false alene ogsÃƒÂ¥ er nok)
`

const smokeYaml = `
# GitHub Actions: smoke-test efter deploy (kort, kÃƒÂ¸rer pÃƒÂ¥ < 1 minut)
smoke:
  runs-on: ubuntu-latest
  steps:
    - name: Health check
      run: curl --fail --retry 5 --retry-delay 3 https://staging.example.dk/health
    - name: Forsiden svarer
      run: curl --fail -s -o /dev/null https://staging.example.dk/
    - name: Login-endpoint findes
      run: |
        code=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://staging.example.dk/api/login)
        test "$code" -ne 404
`

const regressionAttr = `
// Marker tests med traits, sÃƒÂ¥ de kan kÃƒÂ¸res selektivt
[Trait("Category", "Smoke")]
[Fact]
public async Task Health_Returnerer200() { /* ... */ }

[Trait("Category", "Regression")]
[Fact]
public async Task Bug1234_OrdreMedRabatKode_BeregnerKorrektTotal() { /* ... */ }

// KÃƒÂ¸r kun smoke:       dotnet test --filter "Category=Smoke"
// KÃƒÂ¸r regression:      dotnet test --filter "Category=Regression"
`

export default function MetodikkerPageDa() {
  const objective = getObjectiveByPath('/test/metodikker')

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

      <h1>Testmetodikker</h1>

      <p>
        En <strong>testmetodik</strong> er en systematisk mÃƒÂ¥de at finde, designe og
        udfÃƒÂ¸re tests pÃƒÂ¥. Forskellige metodikker finder forskellige typer fejl Ã¢â‚¬â€ derfor
        kombinerer professionelle testere dem. Denne side giver dig vÃƒÂ¦rktÃƒÂ¸jskassen og
        hjÃƒÂ¦lper dig med at vÃƒÂ¦lge det rigtige vÃƒÂ¦rktÃƒÂ¸j til opgaven.
      </p>

      <h2>LÃƒÂ¦ringsmÃƒÂ¥l</h2>
      <ul>
        <li>Forklare forskellen pÃƒÂ¥ black box, white box og erfaringsbaseret test.</li>
        <li>Anvende ÃƒÂ¦kvivalensklasser og grÃƒÂ¦nsevÃƒÂ¦rdianalyse pÃƒÂ¥ et krav.</li>
        <li>Beskrive eksplorativ test, smoke-test og regressionstest Ã¢â‚¬â€ og hvornÃƒÂ¥r de bruges.</li>
        <li>Koble metodikker til testniveauerne unit, integration og E2E.</li>
        <li>VÃƒÂ¦lge en passende kombination af metodikker i et givet projekt.</li>
      </ul>

      <h2>1. Overblik</h2>
      <MermaidDiagram chart={overview} />
      <p>
        BemÃƒÂ¦rk at kategorierne er <em>ortogonale</em>: en unit test kan vÃƒÂ¦re
        black box (testen kender kun metodens kontrakt), og en regressionstest kan vÃƒÂ¦re
        E2E eller unit. Du vÃƒÂ¦lger teknik, strategi og niveau uafhÃƒÂ¦ngigt af hinanden.
      </p>

      <h2>2. Black box-test</h2>
      <p>
        Testeren kender kun <strong>specifikationen</strong> (input Ã¢â€ â€™ forventet output),
        ikke implementeringen. Testcases udledes af krav, user stories og API-kontrakter.
      </p>
      <ul>
        <li>
          <strong>Fordele:</strong> uafhÃƒÂ¦ngig af kode; kan skrives fÃƒÂ¸r koden; finder
          manglende eller misforstÃƒÂ¥ede krav.
        </li>
        <li>
          <strong>Ulemper:</strong> kan ikke se, om al kode er blevet kÃƒÂ¸rt; kan misse
          fejl i skjulte grene.
        </li>
        <li>
          <strong>Bruges til:</strong> funktionstest, systemtest, accepttest, API-test.
        </li>
      </ul>

      <h3>Ãƒâ€ kvivalensklasser (equivalence partitioning)</h3>
      <p>
        Opdel input i klasser, hvor systemet forventes at opfÃƒÂ¸re sig ens. Test ÃƒÂ©n
        reprÃƒÂ¦sentant pr. klasse Ã¢â‚¬â€ sÃƒÂ¥ slipper du for at teste alle vÃƒÂ¦rdier. Husk bÃƒÂ¥de
        <em> gyldige</em> og <em>ugyldige</em> klasser.
      </p>
      <table>
        <thead>
          <tr>
            <th>Input: alder (krav 18Ã¢â‚¬â€œ65 ÃƒÂ¥r)</th>
            <th>Klasse</th>
            <th>ReprÃƒÂ¦sentant</th>
            <th>Forventet</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>&lt; 18</td>
            <td>Ugyldig (for ung)</td>
            <td>10</td>
            <td>Afvist</td>
          </tr>
          <tr>
            <td>18Ã¢â‚¬â€œ65</td>
            <td>Gyldig</td>
            <td>40</td>
            <td>Accepteret</td>
          </tr>
          <tr>
            <td>&gt; 65</td>
            <td>Ugyldig (for gammel)</td>
            <td>80</td>
            <td>Afvist</td>
          </tr>
          <tr>
            <td>Ikke et tal</td>
            <td>Ugyldig (type)</td>
            <td>&quot;abc&quot;</td>
            <td>Valideringsfejl</td>
          </tr>
        </tbody>
      </table>

      <h3>GrÃƒÂ¦nsevÃƒÂ¦rdianalyse (boundary value analysis)</h3>
      <p>
        Fejl optrÃƒÂ¦der oftest <strong>ved grÃƒÂ¦nserne</strong> (<code>&lt;</code> vs{' '}
        <code>&lt;=</code>, off-by-one). Test vÃƒÂ¦rdien lige under, pÃƒÂ¥ og lige over hver
        grÃƒÂ¦nse. For 18Ã¢â‚¬â€œ65 giver det: 17, 18, 19 og 64, 65, 66.
      </p>
      <CodeBlock language="csharp">{bvaCode}</CodeBlock>

      <h3>Andre black box-teknikker</h3>
      <ul>
        <li>
          <strong>Beslutningstabeller</strong> Ã¢â‚¬â€ kombinationer af betingelser Ã¢â€ â€™ handling
          (fx rabat afhÃƒÂ¦nger af kundetype Ãƒâ€” belÃƒÂ¸b Ãƒâ€” kampagnekode).
        </li>
        <li>
          <strong>Tilstandsovergange</strong> Ã¢â‚¬â€ ordre: Oprettet Ã¢â€ â€™ Betalt Ã¢â€ â€™ Afsendt Ã¢â€ â€™
          Leveret; test lovlige og ulovlige overgange.
        </li>
        <li>
          <strong>Use case-/scenarietest</strong> Ã¢â‚¬â€ hele brugerflows fra start til slut.
        </li>
        <li>
          <strong>Parvis test (pairwise)</strong> Ã¢â‚¬â€ dÃƒÂ¦k alle par af parametre med fÃƒÂ¦rre
          tests end alle kombinationer.
        </li>
      </ul>

      <h2>3. White box-test</h2>
      <p>
        Testeren kender og bruger <strong>koden</strong> til at designe testcases. MÃƒÂ¥let
        er at gennemlÃƒÂ¸be bestemte stier og grene.
      </p>
      <table>
        <thead>
          <tr>
            <th>DÃƒÂ¦kningsmÃƒÂ¥l</th>
            <th>Betydning</th>
            <th>Styrke</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Statement/line coverage</td>
            <td>Hver linje kÃƒÂ¸rt mindst ÃƒÂ©n gang</td>
            <td>Svag</td>
          </tr>
          <tr>
            <td>Branch/decision coverage</td>
            <td>Hver if/else/switch-gren bÃƒÂ¥de true og false</td>
            <td>Middel</td>
          </tr>
          <tr>
            <td>Condition coverage</td>
            <td>Hver delbetingelse i et udtryk bÃƒÂ¥de true/false</td>
            <td>StÃƒÂ¦rkere</td>
          </tr>
          <tr>
            <td>Path coverage</td>
            <td>Alle mulige veje gennem koden</td>
            <td>Mest Ã¢â‚¬â€ men eksplosiv i praksis</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock language="csharp">{whiteBoxCode}</CodeBlock>
      <Callout type="info">
        <strong>Grey box</strong> er en mellemting: testeren kender arkitekturen og
        datamodellen (fx kan se databasen), men tester stadig gennem det eksterne
        interface. Mange integrationstests er grey box.
      </Callout>

      <h2>4. Erfaringsbaseret og eksplorativ test</h2>
      <p>
        Her designes og udfÃƒÂ¸res tests <strong>samtidig</strong> ud fra testerens
        erfaring, nysgerrighed og viden om typiske fejl. Det er ikke &ldquo;tilfÃƒÂ¦ldigt
        klik&rdquo; Ã¢â‚¬â€ god eksplorativ test er struktureret i <strong>sessioner</strong>:
      </p>
      <ol>
        <li>
          <strong>Charter</strong> Ã¢â‚¬â€ en kort mission: &ldquo;Udforsk betalingsflowet med
          fokus pÃƒÂ¥ afbrudte forbindelser.&rdquo;
        </li>
        <li>
          <strong>Timebox</strong> Ã¢â‚¬â€ typisk 60Ã¢â‚¬â€œ90 minutter.
        </li>
        <li>
          <strong>Noter</strong> Ã¢â‚¬â€ hvad blev testet, hvad blev fundet, nye spÃƒÂ¸rgsmÃƒÂ¥l.
        </li>
        <li>
          <strong>Debrief</strong> Ã¢â‚¬â€ del fund; opret fejlrapporter; omsÃƒÂ¦t gode fund til
          automatiserede regressionstests.
        </li>
      </ol>
      <p>
        Teknikker: <em>error guessing</em> (tomme felter, specialtegn, emojis, meget
        lange strenge, dobbeltklik, back-knap), <em>checklister</em> og <em>tours</em>
        (fx &ldquo;the saboteur&rdquo; forsÃƒÂ¸ger at ÃƒÂ¸delÃƒÂ¦gge, &ldquo;the impatient user&rdquo;
        klikker hurtigt).
      </p>
      <Callout type="tip">
        Eksplorativ test er den bedste modgift mod <em>pesticidparadokset</em>: nÃƒÂ¥r
        automatiske tests altid kÃƒÂ¸rer de samme stier, finder et menneske de nye.
      </Callout>

      <h2>5. Smoke-test</h2>
      <p>
        En lille, hurtig suite der svarer pÃƒÂ¥: <em>&ldquo;Er buildet overhovedet vÃƒÂ¦rd at
        teste videre?&rdquo;</em> Navnet kommer fra hardware: tÃƒÂ¦nd for strÃƒÂ¸mmen Ã¢â‚¬â€ ryger
        det? Typisk 5Ã¢â‚¬â€œ20 tests der dÃƒÂ¦kker de allervigtigste flows: applikationen starter,
        health-endpoint svarer, login virker, forsiden loader.
      </p>
      <CodeBlock language="yaml">{smokeYaml}</CodeBlock>
      <p>
        Sanity-test er beslÃƒÂ¦gtet: en meget snÃƒÂ¦ver kontrol efter en specifik rettelse
        (&ldquo;virker den fejl, vi lige har rettet?&rdquo;).
      </p>

      <h2>6. Regressionstest</h2>
      <p>
        <strong>Regression</strong> = noget, der virkede, er holdt op med at virke efter
        en ÃƒÂ¦ndring. Regressionstest kÃƒÂ¸rer eksisterende tests igen for at fange det.
        Grundregler:
      </p>
      <ul>
        <li>
          <strong>Hver rettet fejl fÃƒÂ¥r en test</strong>, der fejlede fÃƒÂ¸r rettelsen og
          bestÃƒÂ¥r efter. SÃƒÂ¥ kommer fejlen aldrig tilbage.
        </li>
        <li>AutomatisÃƒÂ©r Ã¢â‚¬â€ regressionstest er gentagelse, hvilket maskiner er gode til.</li>
        <li>KÃƒÂ¸r hurtigt i CI ved hver commit; kÃƒÂ¸r den fulde suite natligt hvis den er tung.</li>
        <li>
          Brug <em>test impact analysis</em> / risikobaseret udvÃƒÂ¦lgelse, nÃƒÂ¥r suiten bliver
          for stor.
        </li>
      </ul>
      <CodeBlock language="csharp">{regressionAttr}</CodeBlock>

      <h2>7. HvornÃƒÂ¥r bruger man hvad?</h2>
      <table>
        <thead>
          <tr>
            <th>Situation</th>
            <th>Anbefalet metodik</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nyt krav med talintervaller</td>
            <td>Black box: ÃƒÂ¦kvivalensklasser + grÃƒÂ¦nsevÃƒÂ¦rdier</td>
          </tr>
          <tr>
            <td>Kompleks forretningsregel med mange betingelser</td>
            <td>Beslutningstabel + white box branch coverage pÃƒÂ¥ implementeringen</td>
          </tr>
          <tr>
            <td>Ny build fra CI</td>
            <td>Smoke Ã¢â€ â€™ regression</td>
          </tr>
          <tr>
            <td>Fejl rettet</td>
            <td>Skriv regressionstest + sanity-check</td>
          </tr>
          <tr>
            <td>Ny, uklar feature uden gode krav</td>
            <td>Eksplorativ test med charter</td>
          </tr>
          <tr>
            <td>FÃƒÂ¸r release til kunde</td>
            <td>Accepttest (scenarier) + eksplorativ + regression</td>
          </tr>
          <tr>
            <td>Sikkerhedskritisk omrÃƒÂ¥de</td>
            <td>Negative tests, fuzzing, security tools (se <Link to="/sikkerhed/tools">Tools</Link>)</td>
          </tr>
        </tbody>
      </table>
      <MermaidDiagram chart={whichWhen} />

      <h2>8. Kobling til testniveauer</h2>
      <table>
        <thead>
          <tr>
            <th>Niveau</th>
            <th>Typisk metodik</th>
            <th>LÃƒÂ¦s mere</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unit</td>
            <td>White box (kendskab til grene) + black box EP/BVA pÃƒÂ¥ metodens kontrakt</td>
            <td>
              <Link to="/test/unit">Unit testing</Link>
            </td>
          </tr>
          <tr>
            <td>Integration</td>
            <td>Grey box; kontrakttests; scenarier pÃƒÂ¥ tvÃƒÂ¦rs af komponenter</td>
            <td>
              <Link to="/test/integration">Integrationstest</Link>
            </td>
          </tr>
          <tr>
            <td>E2E / system</td>
            <td>Black box scenarier, smoke og regression, eksplorativ</td>
            <td>
              <Link to="/test/bruno-e2e">Bruno og E2E</Link>
            </td>
          </tr>
          <tr>
            <td>Accept</td>
            <td>Scenarier fra kunden, BDD (Given/When/Then)</td>
            <td>
              <Link to="/test/testplan">Testplan</Link>
            </td>
          </tr>
        </tbody>
      </table>

      <Callout type="warn">
        Hundrede procent kodedÃƒÂ¦kning betyder ikke, at alle krav er testet. Black box og
        white box <strong>supplerer</strong> hinanden: dÃƒÂ¦kning viser hvad der <em>ikke</em>{' '}
        er kÃƒÂ¸rt, kravbaserede tests viser hvad der <em>mangler</em>.
      </Callout>

      <h2>ÃƒËœvelse</h2>
      <ol>
        <li>
          Krav: &ldquo;Et kodeord skal vÃƒÂ¦re 8Ã¢â‚¬â€œ64 tegn og indeholde mindst ÃƒÂ©t tal.&rdquo;
          Find ÃƒÂ¦kvivalensklasser og grÃƒÂ¦nsevÃƒÂ¦rdier, og skriv en xUnit-<code>[Theory]</code>{' '}
          med mindst 8 datarÃƒÂ¦kker.
        </li>
        <li>
          Skriv en funktion med tre <code>if</code>-sÃƒÂ¦tninger og find det minimale antal
          tests til 100 % branch coverage. MÃƒÂ¥l med <code>dotnet test --collect:&quot;XPlat Code Coverage&quot;</code>.
        </li>
        <li>
          Lav et eksplorativt charter (60 min) for en webapp og lav 5 noter. Hvilke fund
          kan blive til regressionstests?
        </li>
        <li>
          DefinÃƒÂ©r en smoke-suite pÃƒÂ¥ 5 tests for dit projekt. Hvorfor prÃƒÂ¦cis de fem?
        </li>
      </ol>
    </LessonLayout>
  )
}
