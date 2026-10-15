import LessonLayout from '../../components/LessonLayout'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import MermaidDiagram from '../../components/MermaidDiagram'
import Figure from '../../components/Figure'

const ciCdChart = `
flowchart LR
  Commit["Commit / PR"] --> Build["Build"]
  Build --> Unit["Unit-tests"]
  Unit --> Int["Integrationstests"]
  Int --> Merge["Merge til main"]
  Merge --> Deliver["Continuous Delivery<br/>Klar til release"]
  Deliver --> Approve{"Manuel godkendelse?"}
  Approve -- "Ja" --> Prod["Produktion"]
  Approve -- "Nej: Continuous Deployment" --> Prod
  subgraph CI["Continuous Integration"]
    Build
    Unit
    Int
  end
`

const gatesChart = `
flowchart LR
  A["Push"] --> G1{"Gate 1<br/>Build og lint"}
  G1 -- "fejl" --> X1["Stop"]
  G1 -- "ok" --> G2{"Gate 2<br/>Unit-tests"}
  G2 -- "fejl" --> X2["Stop"]
  G2 -- "ok" --> G3{"Gate 3<br/>Integration + E2E"}
  G3 -- "fejl" --> X3["Stop"]
  G3 -- "ok" --> G4{"Gate 4<br/>Review + branch protection"}
  G4 -- "ok" --> D["Deploy via Dokploy"]
`

const workflowYaml = `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  unit:
    name: Build og unit-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: 9.0.x

      - name: Restore
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore --configuration Release

      - name: Unit-tests
        run: >
          dotnet test --no-build --configuration Release
          --logger "trx;LogFileName=results.trx"
          --collect:"XPlat Code Coverage"

      - name: Gem testresultater
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: "**/TestResults/**"

  e2e:
    name: E2E med Bruno
    runs-on: ubuntu-latest
    needs: unit            # kører kun hvis unit-tests er grønne
    steps:
      - uses: actions/checkout@v4

      - name: Start API + database
        run: docker compose up -d --build
        env:
          POSTGRES_PASSWORD: \${{ secrets.TEST_DB_PASSWORD }}

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Bruno E2E
        working-directory: Bruno
        run: |
          npm install -g @usebruno/cli
          bru run E2E-UserFlows --env ci

      - name: Stop stack
        if: always()
        run: docker compose down -v`

export default function CiCdPageDa() {

  return (
    <LessonLayout module="test">
      <h1>CI/CD – automatiserede tests i udviklingscyklussen</h1>
      <Figure
        src="/images/commons/devops-infinity.svg"
        alt="DevOps-toolchain: plan, kode, build, test, release, deploy, operate, monitor"
        caption="DevOps-loopet: tests er en fast del af vejen fra kode til drift"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Devops-toolchain.svg"
        sourceLabel="Wikimedia Commons"
      />
      <Figure
        src="/images/cicd.png"
        alt="CI/CD-pipeline fra commit til produktion"
        caption="Fra commit til produktion – automatiseret og med tests som kvalitetsporte."
      />

      <h2>Læringsmål</h2>
      <p>Efter lektionen (Dag 29) skal du kunne:</p>
      <ul>
        <li>
          Forklare forskellen på <strong>Continuous Integration</strong>,{' '}
          <strong>Continuous Delivery</strong> og <strong>Continuous Deployment</strong>.
        </li>
        <li>
          Placere unit-, integrations- og E2E-tests som <strong>gates</strong> i en pipeline og
          begrunde rækkefølgen.
        </li>
        <li>
          Læse og skrive en simpel <strong>GitHub Actions workflow</strong>, der bygger og tester
          en .NET-løsning.
        </li>
        <li>
          Sammenligne <strong>GitHub Actions</strong> og <strong>Dokploy</strong> og forklare, hvilken
          rolle hver af dem har i vores setup.
        </li>
      </ul>

      <h2>CI vs. CD – hvad er forskellen?</h2>
      <p>
        De to forkortelser bruges ofte i flæng, men dækker over forskellige trin. Fælles for dem er
        ideen om, at <strong>alt, der kan automatiseres mellem "jeg har skrevet kode" og "brugeren
        kan bruge den", bør automatiseres</strong> – for mennesker glemmer ting, og maskiner gør
        det samme hver gang.
      </p>

      <h3>Continuous Integration (CI)</h3>
      <p>
        CI betyder, at alle udviklere <strong>integrerer deres kode ofte</strong> (mindst dagligt)
        i en fælles gren, og at hver integration automatisk <strong>bygges og testes</strong>.
        Målet er at finde integrationsfejl tidligt, mens ændringen stadig er lille og frisk i
        hukommelsen. Uden CI opdager man først i slutningen af et projekt, at to udvikleres kode
        ikke passer sammen – og så er fejlsøgningen dyr.
      </p>
      <Callout type="info">
        <strong>CI-regel:</strong> Når main er rød, er det alles første prioritet at få den grøn igen.
        En pipeline, ingen stoler på, bliver ignoreret – og så er den værdiløs.
      </Callout>

      <h3>Continuous Delivery (CD)</h3>
      <p>
        Continuous <strong>Delivery</strong> bygger videre på CI: hver ændring, der består pipelinen,
        er <strong>klar til at blive udgivet</strong> – artefakter er bygget, miljøet er
        konfigureret, og alle tests er grønne. Selve udgivelsen til produktion er dog en{' '}
        <em>bevidst, manuel beslutning</em> (et klik på en knap).
      </p>

      <h3>Continuous Deployment</h3>
      <p>
        Continuous <strong>Deployment</strong> går ét skridt videre: hver grøn ændring på main
        udgives automatisk til produktion, uden manuelt klik. Det kræver meget høj tillid til
        testene – og netop her bliver automatiserede tests uundværlige.
      </p>
      <Callout type="tip">
        Husk det som tre trin: <strong>Integration</strong> = bygget og testet.{' '}
        <strong>Delivery</strong> = kan udgives når som helst. <strong>Deployment</strong> = udgives
        automatisk.
      </Callout>
      <MermaidDiagram chart={ciCdChart} />

      <table>
        <thead>
          <tr>
            <th></th>
            <th>CI</th>
            <th>Continuous Delivery</th>
            <th>Continuous Deployment</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Udløser</strong>
            </td>
            <td>Push / pull request</td>
            <td>Grøn pipeline på main</td>
            <td>Grøn pipeline på main</td>
          </tr>
          <tr>
            <td>
              <strong>Resultat</strong>
            </td>
            <td>Bygget og testet kode</td>
            <td>Release-klar artefakt</td>
            <td>Ny version i produktion</td>
          </tr>
          <tr>
            <td>
              <strong>Menneske i løkken?</strong>
            </td>
            <td>Nej (kun review)</td>
            <td>Ja – godkender udgivelse</td>
            <td>Nej</td>
          </tr>
        </tbody>
      </table>

      <h2>Hvor passer tests ind? Tests som gates</h2>
      <p>
        En pipeline er en række <strong>porte (gates)</strong>. Kun hvis en port passeres, går
        koden videre til næste. Principper for rækkefølgen er enkle: <em>hurtige og billige tests
        først</em>, dyre og langsomme sidst. Fejler noget tidligt, spilder du ikke minutter på at
        starte Docker og køre E2E-flows.
      </p>
      <MermaidDiagram chart={gatesChart} />
      <ul>
        <li>
          <strong>Build + lint (sekunder):</strong> Kan koden overhovedet kompilere? Overholdes
          stilregler?
        </li>
        <li>
          <strong>Unit-tests (sekunder):</strong> Er den lokale logik korrekt? Se lektionen om unit
          testing.
        </li>
        <li>
          <strong>Integration + E2E (minutter):</strong> Virker delene sammen? Se lektionerne om
          integrationstest og Bruno.
        </li>
        <li>
          <strong>Review + branch protection:</strong> Menneskelig kontrol. Kræv grønne checks og
          mindst ét review, før man kan merge til <code>main</code>.
        </li>
        <li>
          <strong>Deploy:</strong> Først når alle porte er passeret, rulles koden ud.
        </li>
      </ul>
      <Callout type="warn">
        En pipeline giver kun falsk tryghed, hvis testene er dårlige eller bliver sprunget
        over. Undgå at slå tests fra, "bare lige for at få den grøn". En deaktiveret test er en bug, der
        venter på at ske.
      </Callout>
      <Callout type="danger">
        Husk <strong>PR-fælden</strong> fra lektionen om Bruno: E2E-tests mod et allerede deployet
        miljø tester ikke din PR-kode. Byg og start stacken i selve pipelinen.
      </Callout>

      <h2>Eksempel: GitHub Actions workflow</h2>
      <p>
        GitHub Actions konfigureres med YAML-filer i <code>.github/workflows/</code>. En{' '}
        <strong>workflow</strong> udløses af <em>events</em> (<code>on:</code>), består af{' '}
        <strong>jobs</strong>, som kører på en <em>runner</em> (<code>runs-on</code>), og hvert job
        består af <strong>steps</strong> – enten genbrugelige actions (<code>uses:</code>) eller
        shell-kommandoer (<code>run:</code>). Med <code>needs:</code> laver du afhængigheder, så e2e-jobbet
        først starter, når unit er grønt.
      </p>
      <CodeBlock language="yaml">{workflowYaml}</CodeBlock>
      <p>Bemærk de vigtige detaljer i filen:</p>
      <ul>
        <li>
          <code>on: pull_request</code> sørger for, at tests kører <em>før</em> merge – ikke først
          bagefter.
        </li>
        <li>
          <code>concurrency</code> annullerer forældede kørsler, når du pusher igen på samme branch
          – det sparer tid og gratis minutter.
        </li>
        <li>
          <code>--no-restore</code> og <code>--no-build</code> undgår at gøre arbejdet to
          gange.
        </li>
        <li>
          <code>if: always()</code> sikrer, at testresultater uploades, selv når testene fejler – lige
          dér, hvor du har mest brug for dem.
        </li>
        <li>
          Hemmeligheder hentes fra <code>secrets</code> – aldrig hardkodet i filen.
        </li>
      </ul>
      <Callout type="tip">
        Aktivér <strong>branch protection</strong> på <code>main</code> i GitHub: kræv at checks{' '}
        <em>Build og unit-tests</em> og <em>E2E med Bruno</em> er grønne, før en PR kan merges. Først
        da bliver pipelinen en rigtig gate og ikke bare et forslag.
      </Callout>

      <h2>GitHub Actions vs. Dokploy</h2>
      <p>
        I vores setup bruger vi begge, og de overlapper mindre, end man skulle tro. Kort
        sagt: <strong>GitHub Actions svarer på "er koden god nok?"</strong> og{' '}
        <strong>Dokploy svarer på "hvordan kører den?"</strong>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Aspekt</th>
            <th>GitHub Actions</th>
            <th>Dokploy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Hovedformål</strong>
            </td>
            <td>CI: build, test, lint, scanning</td>
            <td>Hosting og deploy af Docker Compose-apps</td>
          </tr>
          <tr>
            <td>
              <strong>Udløses af</strong>
            </td>
            <td>Events: push, PR, schedule, manuelt</td>
            <td>Push til en valgt branch (webhook) eller manuelt redeploy</td>
          </tr>
          <tr>
            <td>
              <strong>Konfiguration</strong>
            </td>
            <td>YAML i repoet (<code>.github/workflows</code>)</td>
            <td>UI/API/MCP + <code>docker-compose.yml</code> i repoet</td>
          </tr>
          <tr>
            <td>
              <strong>Kører hvor</strong>
            </td>
            <td>Midlertidige GitHub-runners (eller egne)</td>
            <td>Vores egen server (<code>deploy.mags.dk</code>)</td>
          </tr>
          <tr>
            <td>
              <strong>Tests</strong>
            </td>
            <td>Ja – det er her gates ligger (unit, integration, E2E)</td>
            <td>Nej – kører ikke tests, kun build og start</td>
          </tr>
          <tr>
            <td>
              <strong>Secrets</strong>
            </td>
            <td>GitHub Secrets (til test/CI)</td>
            <td>Miljøvariabler pr. miljø (dev/prod)</td>
          </tr>
          <tr>
            <td>
              <strong>Resultat</strong>
            </td>
            <td>Grøn/rød check på commit eller PR</td>
            <td>Kørende container bag Traefik + logs</td>
          </tr>
          <tr>
            <td>
              <strong>Rollback</strong>
            </td>
            <td>Re-run eller revert commit</td>
            <td>Redeploy af tidligere version/commit</td>
          </tr>
        </tbody>
      </table>
      <p>
        Det ideelle samspil er: <strong>Actions tester PR'en</strong> → merge til main kun hvis
        grøn → <strong>Dokploy deployer main</strong> til miljøet. Vil du have, at Dokploy
        <em> venter</em> på CI, kan du bruge Dokploys mulighed for at udløse deploy via webhook/API som
        sidste step i workflowet i stedet for automatisk deploy på hvert push. Så sikrer du, at
        kun testet kode nogensinde når produktion.
      </p>

      <h3>Tjekliste: er testene integreret i cyklussen?</h3>
      <ul>
        <li>Kører unit-tests automatisk på hver PR?</li>
        <li>Er branch protection slået til, så røde checks blokerer merge?</li>
        <li>Er de hurtigste tests først i pipelinen?</li>
        <li>Gemmes testrapporter som artefakter, så fejl kan undersøges?</li>
        <li>Tester E2E den kode, der er i PR'en – ikke et gammelt deploy?</li>
        <li>Ligger secrets i GitHub Secrets/Dokploy – aldrig i git?</li>
      </ul>
    </LessonLayout>
  )
}
