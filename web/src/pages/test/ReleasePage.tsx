import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath } from '../../data/objectives'

const decisionFlow = `
flowchart TD
  A["Release-kandidat bygget"] --> B{"Alle must-have<br/>tests grønne?"}
  B -- Nej --> X["NO-GO: ret og kør igen"]
  B -- Ja --> C{"Åbne kritiske/høje<br/>fejl?"}
  C -- Ja --> X
  C -- Nej --> D{"Risikoområder<br/>testet?"}
  D -- Nej --> X
  D -- Ja --> E{"Performance- og<br/>sikkerhedskrav ok?"}
  E -- Nej --> X
  E -- Ja --> F{"Rollback og<br/>monitorering klar?"}
  F -- Nej --> X
  F -- Ja --> G["GO: release"]
`

const riskMatrix = `
flowchart TB
  subgraph HK["Høj konsekvens"]
    direction LR
    A["Lav sandsynlighed<br/>Test med omtanke<br/>fx login med MFA"]
    B["Høj sandsynlighed<br/>Test grundigt<br/>fx betaling, ny kode"]
  end
  subgraph LK["Lav konsekvens"]
    direction LR
    C["Lav sandsynlighed<br/>Let test<br/>fx profilbillede"]
    D["Høj sandsynlighed<br/>Automatisér basis<br/>fx søgning, rapporter"]
  end
  HK ~~~ LK
  style B fill:#7f1d1d,stroke:#f87171,color:#fff
  style A fill:#78350f,stroke:#fbbf24,color:#fff
  style D fill:#1e3a5f,stroke:#60a5fa,color:#fff
  style C fill:#14532d,stroke:#4ade80,color:#fff
`

const flakyCycle = `
flowchart LR
  F["Test fejler tilfældigt"] --> D["Detektér: samme commit, forskelligt resultat"]
  D --> Q["Karantæne: markér og fjern fra gate"]
  Q --> I["Undersøg rod-årsag"]
  I --> FX["Ret test eller kode"]
  FX --> R["Genindfør i suiten"]
`

const dodChecklist = `
## Definition of Done (eksempel for et user story)

- [ ] Acceptkriterier er opfyldt og demonstreret for PO
- [ ] Unit tests for ny logik (inkl. grænseværdier og fejlstier)
- [ ] Integrationstest for nye/ændrede endpoints (inkl. 401/403)
- [ ] Alle tests er grønne i CI på pull requesten
- [ ] Kode er reviewet af mindst én anden
- [ ] Ingen nye warnings / lint-fejl / sårbare dependencies
- [ ] Dokumentation og OpenAPI opdateret
- [ ] Migrationer testet op og ned
- [ ] Logning og fejlhåndtering på plads
- [ ] Ingen secrets i kode eller commit-historik
`

const goNoGo = `
## Go/no-go checkliste

KVALITET
- [ ] 100 % af must-have testcases kørt, >= 95 % bestået
- [ ] Ingen åbne fejl med alvorlighed Kritisk/Høj
- [ ] Kendte fejl er dokumenterede, vurderede og accepterede af PO
- [ ] Regressionssuite grøn på præcis release-commit

RISIKO
- [ ] Højrisiko-områder (betaling, auth, data) har eksplorativ test + automatiske tests
- [ ] Ændringer siden sidste release er gennemgået og testet

IKKE-FUNKTIONELT
- [ ] Performance-mål opfyldt (fx p95 < 500 ms ved forventet last)
- [ ] Sikkerhed: dependency-scan og DAST-baseline uden højrisiko-fund
- [ ] Tilgængelighed: kritiske flows tjekket

DRIFT
- [ ] Rollback-plan testet
- [ ] Monitorering, alarmer og logs dækker de nye features
- [ ] Database-migrationer er bagudkompatible / har plan
- [ ] Feature flags kan slå nye features fra

KOMMUNIKATION
- [ ] Release notes skrevet
- [ ] Support og interessenter informeret
`

const coverageCmd = `
# Mål kodedækning i .NET med Coverlet
dotnet test --collect:"XPlat Code Coverage"

# Lav læsbar rapport
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:"**/coverage.cobertura.xml" -targetdir:coverage-report -reporttypes:Html
`

const coverageLie = `
// 100 % linjedækning - men INGEN verifikation
[Fact]
public void Beregn_Koerer()
{
    var pris = new Prisberegner().MedRabat(200m);   // kører koden ...
    // ... men tjekker ingenting (ingen Assert)!
}

// Bedre: samme dækning, men testen har værdi
[Fact]
public void Beregn_Over100_Giver10ProcentRabat()
{
    var pris = new Prisberegner().MedRabat(200m);
    Assert.Equal(180m, pris);
}
`

const gate = `
# GitHub Actions: kvalitets-gate i pipelinen
- name: Test med dækning
  run: dotnet test --collect:"XPlat Code Coverage" --logger trx

- name: Fejl hvis dækning falder under tærskel (signal)
  run: |
    # eksempel: brug fx coverlet.msbuild: /p:Threshold=70 /p:ThresholdType=line
    dotnet test /p:CollectCoverage=true /p:Threshold=70 /p:ThresholdType=line
`

const flakyExample = `
// Typiske flaky-årsager og løsninger
[Fact]
public async Task FlakyEksempel_Daarligt()
{
    await _client.PostAsJsonAsync("/api/jobs", job);
    await Task.Delay(500);                     // gæt-sleep: nogle gange for kort
    var status = await GetStatus();
    Assert.Equal("Done", status);
}

[Fact]
public async Task FlakyEksempel_Bedre()
{
    await _client.PostAsJsonAsync("/api/jobs", job);

    // Poll med timeout i stedet for at gætte
    var status = await Poll.UntilAsync(
        () => GetStatus(),
        s => s == "Done",
        timeout: TimeSpan.FromSeconds(10));

    Assert.Equal("Done", status);
}
`

export default function ReleasePage() {
  const objective = getObjectiveByPath('/test/release')

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

      <h1>Release: hvornår er det testet nok?</h1>

      <p>
        Det sværeste spørgsmål i test er ikke &ldquo;hvordan tester vi?&rdquo; men{' '}
        <strong>&ldquo;hvornår er vi færdige?&rdquo;</strong>. Fordi udtømmende test er
        umulig, er en release-beslutning altid en <em>risikovurdering</em> — en balance
        mellem tid, omkostning og den skade en fejl kan gøre. Denne side giver dig
        værktøjerne til at træffe og forsvare beslutningen.
      </p>

      <h2>Læringsmål</h2>
      <ul>
        <li>Formulere en Definition of Done og exit criteria, der er målbare.</li>
        <li>Fortolke kodedækning korrekt: som signal, ikke som mål.</li>
        <li>Anvende risikobaseret test til at prioritere indsatsen.</li>
        <li>Bruge en go/no-go-checkliste til at beslutte release.</li>
        <li>Genkende, håndtere og forebygge flaky tests.</li>
      </ul>

      <h2>1. Hvorfor kan man ikke teste &ldquo;alt&rdquo;?</h2>
      <p>
        En funktion med blot to input á 32 bit har 2<sup>64</sup> kombinationer. Tilføj
        tid, state, browsere, netværk og data, og antallet er astronomisk. Derfor handler
        &ldquo;tilstrækkeligt testet&rdquo; om, at <strong>restrisikoen er acceptabel</strong>{' '}
        for dem, der skal bære den (kunde, forretning, brugere).
      </p>

      <h2>2. Definition of Done (DoD) og acceptkriterier</h2>
      <p>
        <strong>Definition of Done</strong> er teamets fælles, eksplicitte liste over,
        hvad der skal være opfyldt, før noget kan kaldes færdigt. <strong>Acceptkriterier</strong>{' '}
        gælder den enkelte user story. DoD gælder <em>alle</em>. Test er en integreret del
        af &ldquo;done&rdquo; — ikke en fase efter udvikling.
      </p>
      <CodeBlock language="markdown">{dodChecklist}</CodeBlock>

      <h3>Exit criteria på release-niveau</h3>
      <p>
        Exit criteria er de målbare betingelser i{' '}
        <Link to="/test/testplan">testplanen</Link>, som skal være opfyldt for at
        afslutte testen: gennemførte testcases, pass-rate, åbne fejl pr. alvorlighed,
        performance-mål, sikkerhedsscan osv.
      </p>

      <h2>3. Kodedækning: signal, ikke mål</h2>
      <p>
        Kodedækning (code coverage) måler, hvor stor en andel af koden der blev
        <em> kørt</em> under test. Det er <strong>ikke</strong> det samme som, at koden er
        <em> verificeret</em>.
      </p>
      <CodeBlock language="csharp">{coverageLie}</CodeBlock>
      <Callout type="warn">
        <strong>Goodharts lov:</strong> &ldquo;Når et mål bliver et mål, ophører det med at
        være et godt mål.&rdquo; Kræver du 90 % dækning, får du tests uden asserts.
        Brug dækning til at <em>finde huller</em> (røde områder i kritisk kode), ikke som
        et KPI du jagter.
      </Callout>
      <table>
        <thead>
          <tr>
            <th>Dækning siger</th>
            <th>Dækning siger IKKE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Her er kode, der aldrig bliver kørt af tests</td>
            <td>At de kørte linjer er testet korrekt</td>
          </tr>
          <tr>
            <td>Lav dækning i kritisk modul = risiko</td>
            <td>At høj dækning = høj kvalitet</td>
          </tr>
          <tr>
            <td>Trend: falder dækningen markant i en PR?</td>
            <td>At krav er opfyldt, eller at edge cases er tænkt igennem</td>
          </tr>
        </tbody>
      </table>
      <p>
        Et bedre supplement er <strong>mutationstest</strong> (fx Stryker.NET): værktøjet
        ændrer koden bevidst (<code>&gt;</code> → <code>&gt;=</code>) og tjekker, om
        mindst én test fejler. Overlever mutanten, er testen for svag.
      </p>
      <CodeBlock language="bash">{coverageCmd}</CodeBlock>
      <CodeBlock language="yaml">{gate}</CodeBlock>

      <h2>4. Risikobaseret test</h2>
      <p>
        Risiko = <strong>sandsynlighed for fejl × konsekvens</strong>. Brug den til at
        beslutte, <em>hvor</em> test-timerne gør mest gavn.
      </p>
      <MermaidDiagram chart={riskMatrix} />
      <h3>Sådan finder du risici</h3>
      <ul>
        <li>
          <strong>Forretningsværdi:</strong> hvad koster det, hvis det går ned? (betaling,
          login, persondata).
        </li>
        <li>
          <strong>Kompleksitet og ændringshyppighed:</strong> meget ny/ændret kode =
          mere sandsynlige fejl (&ldquo;code churn&rdquo;).
        </li>
        <li>
          <strong>Historik:</strong> hvor har vi tidligere haft fejl? Fejl klumper sig.
        </li>
        <li>
          <strong>Afhængigheder:</strong> eksterne systemer, nyt framework, nyt team.
        </li>
        <li>
          <strong>Sikkerhed og compliance:</strong> GDPR, betalingsdata, autorisation.
        </li>
      </ul>
      <p>
        Brug en simpel 1–5 skala for begge dimensioner og multiplicér. Områder med score
        over fx 12 får grundige tests (flere niveauer + eksplorativ), mellem 6–12 får
        automatiske basistests, under 6 får minimal test.
      </p>

      <h2>5. Go/no-go-beslutningen</h2>
      <MermaidDiagram chart={decisionFlow} />
      <CodeBlock language="markdown">{goNoGo}</CodeBlock>
      <Callout type="tip">
        En <strong>no-go</strong> er ikke et nederlag — det er netop checklistens formål.
        Dokumentér altid begrundelsen. Hvis I alligevel releaser med kendte fejl, skal
        beslutningen tages af produktejeren, og fejlene skal være kendte og accepterede
        (&ldquo;known issues&rdquo;).
      </Callout>

      <h3>Hvad hvis tiden løber ud?</h3>
      <ol>
        <li>Skær scope (færre features) frem for at skære test.</li>
        <li>Release bag et <strong>feature flag</strong> til en lille brugergruppe (canary).</li>
        <li>Forbedr observabilitet og rollback, så fejl er billigere at rette i produktion.</li>
        <li>Vær ærlig: kommunikér restrisiko til produktejer og kunde.</li>
      </ol>

      <h2>6. Flaky tests</h2>
      <p>
        En <strong>flaky test</strong> består og fejler på samme kode uden ændringer. De
        er farlige, fordi teamet lærer at ignorere røde builds — og så overses de rigtige
        fejl. En ikke-pålidelig suite er næsten værre end ingen suite.
      </p>
      <MermaidDiagram chart={flakyCycle} />

      <table>
        <thead>
          <tr>
            <th>Årsag</th>
            <th>Eksempel</th>
            <th>Løsning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Timing/async</td>
            <td>
              <code>Thread.Sleep(500)</code> og håb
            </td>
            <td>Polling med timeout; await på rigtig begivenhed</td>
          </tr>
          <tr>
            <td>Delt tilstand</td>
            <td>Tests læser/skriver samme databaserække</td>
            <td>Isolér data pr. test; Respawn; unikke GUIDs</td>
          </tr>
          <tr>
            <td>Rækkefølge</td>
            <td>Test B kræver at test A har kørt</td>
            <td>Uafhængige tests; tilfældig rækkefølge i CI</td>
          </tr>
          <tr>
            <td>Tid og tilfældighed</td>
            <td>
              <code>DateTime.Now</code>, <code>Random</code>
            </td>
            <td>
              Injicér <code>TimeProvider</code> / seed
            </td>
          </tr>
          <tr>
            <td>Eksterne tjenester</td>
            <td>Kald til rigtig tredjeparts-API</td>
            <td>Stubs/mocks, kontrakttests</td>
          </tr>
          <tr>
            <td>Miljøforskelle</td>
            <td>&ldquo;Virker på min maskine&rdquo;</td>
            <td>Container-baseret miljø (Docker/Testcontainers)</td>
          </tr>
          <tr>
            <td>UI-tests</td>
            <td>Element ikke indlæst endnu</td>
            <td>Auto-wait, stabile selectors (data-testid)</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock language="csharp">{flakyExample}</CodeBlock>
      <p>
        Politik: ved første mistanke → <strong>karantæne</strong> (kør, men blokér ikke
        merge), opret en opgave med ejer og frist, ret eller slet. Mål andelen af flaky
        tests som en kvalitetsmetrik.
      </p>

      <h2>7. Øvrige signaler om testmodenhed</h2>
      <ul>
        <li>
          <strong>Defect detection trend:</strong> nye fejl pr. dag/uge aftager mod 0
          (ikke bare fordi vi stopper med at lede).
        </li>
        <li>
          <strong>Escaped defects:</strong> hvor mange fejl når til produktion? (DDP =
          fundne før release ÷ alle fundne).
        </li>
        <li>
          <strong>MTTR og change failure rate</strong> (DORA-metrikker): hvor hurtigt
          retter vi, og hvor ofte går en release galt?
        </li>
        <li>
          <strong>Testsuite-hastighed:</strong> hvis feedback tager over 10 minutter,
          bliver tests undgået.
        </li>
      </ul>
      <p>
        Læs også om <Link to="/test/ci-cd">CI/CD</Link> for at automatisere gates, og{' '}
        <Link to="/test/performance">Performance</Link> for at verificere ikke-funktionelle
        krav før release.
      </p>

      <h2>Øvelse</h2>
      <ol>
        <li>
          Skriv en Definition of Done for dit eget projekt (mindst 8 punkter). Hvilke er
          automatisk verificerbare i CI?
        </li>
        <li>
          Lav en risikotabel for 6 features (sandsynlighed 1–5 × konsekvens 1–5). Planlæg
          testindsatsen derefter.
        </li>
        <li>
          Mål kodedækning i et projekt. Find ét modul med lav dækning — er det et
          problem, eller er koden ukritisk?
        </li>
        <li>
          Gennemfør et fiktivt go/no-go-møde med checklisten: hvilke punkter ville stoppe
          jeres næste release?
        </li>
        <li>
          Find en flaky test (eller skriv en med <code>Task.Delay</code>) og gør den
          deterministisk.
        </li>
      </ol>
    </LessonLayout>
  )
}
