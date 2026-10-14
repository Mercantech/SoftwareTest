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
  BB --> EQ["Ækvivalensklasser"]
  BB --> BV["Grænseværdier"]
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
  SMK -->|Fejl| STOP["Stop og returnér build"]
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
    // Ækvivalensklasser: [0..99.99] -> 0, [100..499.99] -> 10, [500..] -> 20, [<0] -> fejl
    // Grænseværdier: lige under, på og lige over hver grænse
    [Theory]
    [InlineData(0,      0)]    // nedre grænse for klasse 1
    [InlineData(99.99,  0)]    // lige under 100
    [InlineData(100,    10)]   // PÅ grænsen
    [InlineData(100.01, 10)]
    [InlineData(499.99, 10)]   // lige under 500
    [InlineData(500,    20)]   // PÅ grænsen
    [InlineData(10000,  20)]   // repræsentant for øvre klasse
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

// Branch coverage (alle beslutninger både true/false) kræver mindst:
// (-1, _)      -> A
// (10, _)      -> B
// (15, false)  -> C
// (15, true)   -> D  (kombination der gør 'alder<18 && !samtykke' false)
// (30, false)  -> D  (viser at 'alder<18' false alene også er nok)
`

const smokeYaml = `
# GitHub Actions: smoke-test efter deploy (kort, kører på < 1 minut)
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
// Marker tests med traits, så de kan køres selektivt
[Trait("Category", "Smoke")]
[Fact]
public async Task Health_Returnerer200() { /* ... */ }

[Trait("Category", "Regression")]
[Fact]
public async Task Bug1234_OrdreMedRabatKode_BeregnerKorrektTotal() { /* ... */ }

// Kør kun smoke:       dotnet test --filter "Category=Smoke"
// Kør regression:      dotnet test --filter "Category=Regression"
`

export default function MetodikkerPageDa() {
  const objective = getObjectiveByPath('/test/metodikker')

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

      <h1>Testmetodikker</h1>

      <p>
        En <strong>testmetodik</strong> er en systematisk måde at finde, designe og
        udføre tests på. Forskellige metodikker finder forskellige typer fejl — derfor
        kombinerer professionelle testere dem. Denne side giver dig værktøjskassen og
        hjælper dig med at vælge det rigtige værktøj til opgaven.
      </p>

      <h2>Læringsmål</h2>
      <ul>
        <li>Forklare forskellen på black box, white box og erfaringsbaseret test.</li>
        <li>Anvende ækvivalensklasser og grænseværdianalyse på et krav.</li>
        <li>Beskrive eksplorativ test, smoke-test og regressionstest — og hvornår de bruges.</li>
        <li>Koble metodikker til testniveauerne unit, integration og E2E.</li>
        <li>Vælge en passende kombination af metodikker i et givet projekt.</li>
      </ul>

      <h2>1. Overblik</h2>
      <MermaidDiagram chart={overview} />
      <p>
        Bemærk at kategorierne er <em>ortogonale</em>: en unit test kan være
        black box (testen kender kun metodens kontrakt), og en regressionstest kan være
        E2E eller unit. Du vælger teknik, strategi og niveau uafhængigt af hinanden.
      </p>

      <h2>2. Black box-test</h2>
      <p>
        Testeren kender kun <strong>specifikationen</strong> (input → forventet output),
        ikke implementeringen. Testcases udledes af krav, user stories og API-kontrakter.
      </p>
      <ul>
        <li>
          <strong>Fordele:</strong> uafhængig af kode; kan skrives før koden; finder
          manglende eller misforståede krav.
        </li>
        <li>
          <strong>Ulemper:</strong> kan ikke se, om al kode er blevet kørt; kan misse
          fejl i skjulte grene.
        </li>
        <li>
          <strong>Bruges til:</strong> funktionstest, systemtest, accepttest, API-test.
        </li>
      </ul>

      <h3>Ækvivalensklasser (equivalence partitioning)</h3>
      <p>
        Opdel input i klasser, hvor systemet forventes at opføre sig ens. Test én
        repræsentant pr. klasse — så slipper du for at teste alle værdier. Husk både
        <em> gyldige</em> og <em>ugyldige</em> klasser.
      </p>
      <table>
        <thead>
          <tr>
            <th>Input: alder (krav 18–65 år)</th>
            <th>Klasse</th>
            <th>Repræsentant</th>
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
            <td>18–65</td>
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

      <h3>Grænseværdianalyse (boundary value analysis)</h3>
      <p>
        Fejl optræder oftest <strong>ved grænserne</strong> (<code>&lt;</code> vs{' '}
        <code>&lt;=</code>, off-by-one). Test værdien lige under, på og lige over hver
        grænse. For 18–65 giver det: 17, 18, 19 og 64, 65, 66.
      </p>
      <CodeBlock language="csharp">{bvaCode}</CodeBlock>

      <h3>Andre black box-teknikker</h3>
      <ul>
        <li>
          <strong>Beslutningstabeller</strong> — kombinationer af betingelser → handling
          (fx rabat afhænger af kundetype × beløb × kampagnekode).
        </li>
        <li>
          <strong>Tilstandsovergange</strong> — ordre: Oprettet → Betalt → Afsendt →
          Leveret; test lovlige og ulovlige overgange.
        </li>
        <li>
          <strong>Use case-/scenarietest</strong> — hele brugerflows fra start til slut.
        </li>
        <li>
          <strong>Parvis test (pairwise)</strong> — dæk alle par af parametre med færre
          tests end alle kombinationer.
        </li>
      </ul>

      <h2>3. White box-test</h2>
      <p>
        Testeren kender og bruger <strong>koden</strong> til at designe testcases. Målet
        er at gennemløbe bestemte stier og grene.
      </p>
      <table>
        <thead>
          <tr>
            <th>Dækningsmål</th>
            <th>Betydning</th>
            <th>Styrke</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Statement/line coverage</td>
            <td>Hver linje kørt mindst én gang</td>
            <td>Svag</td>
          </tr>
          <tr>
            <td>Branch/decision coverage</td>
            <td>Hver if/else/switch-gren både true og false</td>
            <td>Middel</td>
          </tr>
          <tr>
            <td>Condition coverage</td>
            <td>Hver delbetingelse i et udtryk både true/false</td>
            <td>Stærkere</td>
          </tr>
          <tr>
            <td>Path coverage</td>
            <td>Alle mulige veje gennem koden</td>
            <td>Mest — men eksplosiv i praksis</td>
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
        Her designes og udføres tests <strong>samtidig</strong> ud fra testerens
        erfaring, nysgerrighed og viden om typiske fejl. Det er ikke &ldquo;tilfældigt
        klik&rdquo; — god eksplorativ test er struktureret i <strong>sessioner</strong>:
      </p>
      <ol>
        <li>
          <strong>Charter</strong> — en kort mission: &ldquo;Udforsk betalingsflowet med
          fokus på afbrudte forbindelser.&rdquo;
        </li>
        <li>
          <strong>Timebox</strong> — typisk 60–90 minutter.
        </li>
        <li>
          <strong>Noter</strong> — hvad blev testet, hvad blev fundet, nye spørgsmål.
        </li>
        <li>
          <strong>Debrief</strong> — del fund; opret fejlrapporter; omsæt gode fund til
          automatiserede regressionstests.
        </li>
      </ol>
      <p>
        Teknikker: <em>error guessing</em> (tomme felter, specialtegn, emojis, meget
        lange strenge, dobbeltklik, back-knap), <em>checklister</em> og <em>tours</em>
        (fx &ldquo;the saboteur&rdquo; forsøger at ødelægge, &ldquo;the impatient user&rdquo;
        klikker hurtigt).
      </p>
      <Callout type="tip">
        Eksplorativ test er den bedste modgift mod <em>pesticidparadokset</em>: når
        automatiske tests altid kører de samme stier, finder et menneske de nye.
      </Callout>

      <h2>5. Smoke-test</h2>
      <p>
        En lille, hurtig suite der svarer på: <em>&ldquo;Er buildet overhovedet værd at
        teste videre?&rdquo;</em> Navnet kommer fra hardware: tænd for strømmen — ryger
        det? Typisk 5–20 tests der dækker de allervigtigste flows: applikationen starter,
        health-endpoint svarer, login virker, forsiden loader.
      </p>
      <CodeBlock language="yaml">{smokeYaml}</CodeBlock>
      <p>
        Sanity-test er beslægtet: en meget snæver kontrol efter en specifik rettelse
        (&ldquo;virker den fejl, vi lige har rettet?&rdquo;).
      </p>

      <h2>6. Regressionstest</h2>
      <p>
        <strong>Regression</strong> = noget, der virkede, er holdt op med at virke efter
        en ændring. Regressionstest kører eksisterende tests igen for at fange det.
        Grundregler:
      </p>
      <ul>
        <li>
          <strong>Hver rettet fejl får en test</strong>, der fejlede før rettelsen og
          består efter. Så kommer fejlen aldrig tilbage.
        </li>
        <li>Automatisér — regressionstest er gentagelse, hvilket maskiner er gode til.</li>
        <li>Kør hurtigt i CI ved hver commit; kør den fulde suite natligt hvis den er tung.</li>
        <li>
          Brug <em>test impact analysis</em> / risikobaseret udvælgelse, når suiten bliver
          for stor.
        </li>
      </ul>
      <CodeBlock language="csharp">{regressionAttr}</CodeBlock>

      <h2>7. Hvornår bruger man hvad?</h2>
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
            <td>Black box: ækvivalensklasser + grænseværdier</td>
          </tr>
          <tr>
            <td>Kompleks forretningsregel med mange betingelser</td>
            <td>Beslutningstabel + white box branch coverage på implementeringen</td>
          </tr>
          <tr>
            <td>Ny build fra CI</td>
            <td>Smoke → regression</td>
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
            <td>Før release til kunde</td>
            <td>Accepttest (scenarier) + eksplorativ + regression</td>
          </tr>
          <tr>
            <td>Sikkerhedskritisk område</td>
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
            <th>Læs mere</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unit</td>
            <td>White box (kendskab til grene) + black box EP/BVA på metodens kontrakt</td>
            <td>
              <Link to="/test/unit">Unit testing</Link>
            </td>
          </tr>
          <tr>
            <td>Integration</td>
            <td>Grey box; kontrakttests; scenarier på tværs af komponenter</td>
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
        Hundrede procent kodedækning betyder ikke, at alle krav er testet. Black box og
        white box <strong>supplerer</strong> hinanden: dækning viser hvad der <em>ikke</em>{' '}
        er kørt, kravbaserede tests viser hvad der <em>mangler</em>.
      </Callout>

      <h2>Øvelse</h2>
      <ol>
        <li>
          Krav: &ldquo;Et kodeord skal være 8–64 tegn og indeholde mindst ét tal.&rdquo;
          Find ækvivalensklasser og grænseværdier, og skriv en xUnit-<code>[Theory]</code>{' '}
          med mindst 8 datarækker.
        </li>
        <li>
          Skriv en funktion med tre <code>if</code>-sætninger og find det minimale antal
          tests til 100 % branch coverage. Mål med <code>dotnet test --collect:&quot;XPlat Code Coverage&quot;</code>.
        </li>
        <li>
          Lav et eksplorativt charter (60 min) for en webapp og lav 5 noter. Hvilke fund
          kan blive til regressionstests?
        </li>
        <li>
          Definér en smoke-suite på 5 tests for dit projekt. Hvorfor præcis de fem?
        </li>
      </ol>
    </LessonLayout>
  )
}
