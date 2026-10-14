import LessonLayout from '../../components/LessonLayout'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import MermaidDiagram from '../../components/MermaidDiagram'
import Figure from '../../components/Figure'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import LinkTrio from '../../components/LinkTrio'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'
import { useLanguage } from '../../i18n/LanguageContext'

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
    needs: unit            # kÃ¸rer kun hvis unit-tests er grÃ¸nne
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
  const { lang } = useLanguage()
  const objective = getObjectiveByPath('/test/ci-cd')

  return (
    <LessonLayout module="test">
      <h1>CI/CD â€“ automatiserede tests i udviklingscyklussen</h1>
      {objective ? (
        <p>
          <ObjectiveBadge level={objective.level} /> {objectiveTitle(objective, lang)}
        </p>
      ) : (
        <p>
          <ObjectiveBadge level="H4" /> LÃ¦rlingen kan integrere automatiserede tests i software
          udviklingscyklussen.
        </p>
      )}
      {objective ? (
        <LinkTrio
          sitePath={objective.sitePath}
          notionUrl={objective.notionUrl}
          repoUrl={objective.repoUrl}
        />
      ) : (
        <LinkTrio
          notionUrl="https://app.notion.com/p/308dab5ca23780cb9582f7857e1288af"
          repoUrl="https://github.com/Mercantech/h4-mags"
        />
      )}

      <Figure
        src="/images/cicd.png"
        alt="CI/CD-pipeline fra commit til produktion"
        caption="Fra commit til produktion â€“ automatiseret og med tests som kvalitetsporte."
      />

      <h2>LÃ¦ringsmÃ¥l</h2>
      <p>Efter lektionen (Dag 29) skal du kunne:</p>
      <ul>
        <li>
          Forklare forskellen pÃ¥ <strong>Continuous Integration</strong>,{' '}
          <strong>Continuous Delivery</strong> og <strong>Continuous Deployment</strong>.
        </li>
        <li>
          Placere unit-, integrations- og E2E-tests som <strong>gates</strong> i en pipeline og
          begrunde rÃ¦kkefÃ¸lgen.
        </li>
        <li>
          LÃ¦se og skrive en simpel <strong>GitHub Actions workflow</strong>, der bygger og tester
          en .NET-lÃ¸sning.
        </li>
        <li>
          Sammenligne <strong>GitHub Actions</strong> og <strong>Dokploy</strong> og forklare, hvilken
          rolle hver af dem har i vores setup.
        </li>
      </ul>

      <h2>CI vs. CD â€“ hvad er forskellen?</h2>
      <p>
        De to forkortelser bruges ofte i flÃ¦ng, men dÃ¦kker over forskellige trin. FÃ¦lles for dem er
        ideen om, at <strong>alt, der kan automatiseres mellem "jeg har skrevet kode" og "brugeren
        kan bruge den", bÃ¸r automatiseres</strong> â€“ for mennesker glemmer ting, og maskiner gÃ¸r
        det samme hver gang.
      </p>

      <h3>Continuous Integration (CI)</h3>
      <p>
        CI betyder, at alle udviklere <strong>integrerer deres kode ofte</strong> (mindst dagligt)
        i en fÃ¦lles gren, og at hver integration automatisk <strong>bygges og testes</strong>.
        MÃ¥let er at finde integrationsfejl tidligt, mens Ã¦ndringen stadig er lille og frisk i
        hukommelsen. Uden CI opdager man fÃ¸rst i slutningen af et projekt, at to udvikleres kode
        ikke passer sammen â€“ og sÃ¥ er fejlsÃ¸gningen dyr.
      </p>
      <Callout type="info">
        <strong>CI-regel:</strong> NÃ¥r main er rÃ¸d, er det alles fÃ¸rste prioritet at fÃ¥ den grÃ¸n igen.
        En pipeline, ingen stoler pÃ¥, bliver ignoreret â€“ og sÃ¥ er den vÃ¦rdilÃ¸s.
      </Callout>

      <h3>Continuous Delivery (CD)</h3>
      <p>
        Continuous <strong>Delivery</strong> bygger videre pÃ¥ CI: hver Ã¦ndring, der bestÃ¥r pipelinen,
        er <strong>klar til at blive udgivet</strong> â€“ artefakter er bygget, miljÃ¸et er
        konfigureret, og alle tests er grÃ¸nne. Selve udgivelsen til produktion er dog en{' '}
        <em>bevidst, manuel beslutning</em> (et klik pÃ¥ en knap).
      </p>

      <h3>Continuous Deployment</h3>
      <p>
        Continuous <strong>Deployment</strong> gÃ¥r Ã©t skridt videre: hver grÃ¸n Ã¦ndring pÃ¥ main
        udgives automatisk til produktion, uden manuelt klik. Det krÃ¦ver meget hÃ¸j tillid til
        testene â€“ og netop her bliver automatiserede tests uundvÃ¦rlige.
      </p>
      <Callout type="tip">
        Husk det som tre trin: <strong>Integration</strong> = bygget og testet.{' '}
        <strong>Delivery</strong> = kan udgives nÃ¥r som helst. <strong>Deployment</strong> = udgives
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
              <strong>UdlÃ¸ser</strong>
            </td>
            <td>Push / pull request</td>
            <td>GrÃ¸n pipeline pÃ¥ main</td>
            <td>GrÃ¸n pipeline pÃ¥ main</td>
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
              <strong>Menneske i lÃ¸kken?</strong>
            </td>
            <td>Nej (kun review)</td>
            <td>Ja â€“ godkender udgivelse</td>
            <td>Nej</td>
          </tr>
        </tbody>
      </table>

      <h2>Hvor passer tests ind? Tests som gates</h2>
      <p>
        En pipeline er en rÃ¦kke <strong>porte (gates)</strong>. Kun hvis en port passeres, gÃ¥r
        koden videre til nÃ¦ste. Principper for rÃ¦kkefÃ¸lgen er enkle: <em>hurtige og billige tests
        fÃ¸rst</em>, dyre og langsomme sidst. Fejler noget tidligt, spilder du ikke minutter pÃ¥ at
        starte Docker og kÃ¸re E2E-flows.
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
          <strong>Review + branch protection:</strong> Menneskelig kontrol. KrÃ¦v grÃ¸nne checks og
          mindst Ã©t review, fÃ¸r man kan merge til <code>main</code>.
        </li>
        <li>
          <strong>Deploy:</strong> FÃ¸rst nÃ¥r alle porte er passeret, rulles koden ud.
        </li>
      </ul>
      <Callout type="warn">
        En pipeline giver kun falsk tryghed, hvis testene er dÃ¥rlige eller bliver sprunget
        over. UndgÃ¥ at slÃ¥ tests fra, "bare lige for at fÃ¥ den grÃ¸n". En deaktiveret test er en bug, der
        venter pÃ¥ at ske.
      </Callout>
      <Callout type="danger">
        Husk <strong>PR-fÃ¦lden</strong> fra lektionen om Bruno: E2E-tests mod et allerede deployet
        miljÃ¸ tester ikke din PR-kode. Byg og start stacken i selve pipelinen.
      </Callout>

      <h2>Eksempel: GitHub Actions workflow</h2>
      <p>
        GitHub Actions konfigureres med YAML-filer i <code>.github/workflows/</code>. En{' '}
        <strong>workflow</strong> udlÃ¸ses af <em>events</em> (<code>on:</code>), bestÃ¥r af{' '}
        <strong>jobs</strong>, som kÃ¸rer pÃ¥ en <em>runner</em> (<code>runs-on</code>), og hvert job
        bestÃ¥r af <strong>steps</strong> â€“ enten genbrugelige actions (<code>uses:</code>) eller
        shell-kommandoer (<code>run:</code>). Med <code>needs:</code> laver du afhÃ¦ngigheder, sÃ¥ e2e-jobbet
        fÃ¸rst starter, nÃ¥r unit er grÃ¸nt.
      </p>
      <CodeBlock language="yaml">{workflowYaml}</CodeBlock>
      <p>BemÃ¦rk de vigtige detaljer i filen:</p>
      <ul>
        <li>
          <code>on: pull_request</code> sÃ¸rger for, at tests kÃ¸rer <em>fÃ¸r</em> merge â€“ ikke fÃ¸rst
          bagefter.
        </li>
        <li>
          <code>concurrency</code> annullerer forÃ¦ldede kÃ¸rsler, nÃ¥r du pusher igen pÃ¥ samme branch
          â€“ det sparer tid og gratis minutter.
        </li>
        <li>
          <code>--no-restore</code> og <code>--no-build</code> undgÃ¥r at gÃ¸re arbejdet to
          gange.
        </li>
        <li>
          <code>if: always()</code> sikrer, at testresultater uploades, selv nÃ¥r testene fejler â€“ lige
          dÃ©r, hvor du har mest brug for dem.
        </li>
        <li>
          Hemmeligheder hentes fra <code>secrets</code> â€“ aldrig hardkodet i filen.
        </li>
      </ul>
      <Callout type="tip">
        AktivÃ©r <strong>branch protection</strong> pÃ¥ <code>main</code> i GitHub: krÃ¦v at checks{' '}
        <em>Build og unit-tests</em> og <em>E2E med Bruno</em> er grÃ¸nne, fÃ¸r en PR kan merges. FÃ¸rst
        da bliver pipelinen en rigtig gate og ikke bare et forslag.
      </Callout>

      <h2>GitHub Actions vs. Dokploy</h2>
      <p>
        I vores setup bruger vi begge, og de overlapper mindre, end man skulle tro. Kort
        sagt: <strong>GitHub Actions svarer pÃ¥ "er koden god nok?"</strong> og{' '}
        <strong>Dokploy svarer pÃ¥ "hvordan kÃ¸rer den?"</strong>.
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
              <strong>HovedformÃ¥l</strong>
            </td>
            <td>CI: build, test, lint, scanning</td>
            <td>Hosting og deploy af Docker Compose-apps</td>
          </tr>
          <tr>
            <td>
              <strong>UdlÃ¸ses af</strong>
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
              <strong>KÃ¸rer hvor</strong>
            </td>
            <td>Midlertidige GitHub-runners (eller egne)</td>
            <td>Vores egen server (<code>deploy.mags.dk</code>)</td>
          </tr>
          <tr>
            <td>
              <strong>Tests</strong>
            </td>
            <td>Ja â€“ det er her gates ligger (unit, integration, E2E)</td>
            <td>Nej â€“ kÃ¸rer ikke tests, kun build og start</td>
          </tr>
          <tr>
            <td>
              <strong>Secrets</strong>
            </td>
            <td>GitHub Secrets (til test/CI)</td>
            <td>MiljÃ¸variabler pr. miljÃ¸ (dev/prod)</td>
          </tr>
          <tr>
            <td>
              <strong>Resultat</strong>
            </td>
            <td>GrÃ¸n/rÃ¸d check pÃ¥ commit eller PR</td>
            <td>KÃ¸rende container bag Traefik + logs</td>
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
        Det ideelle samspil er: <strong>Actions tester PR'en</strong> â†’ merge til main kun hvis
        grÃ¸n â†’ <strong>Dokploy deployer main</strong> til miljÃ¸et. Vil du have, at Dokploy
        <em> venter</em> pÃ¥ CI, kan du bruge Dokploys mulighed for at udlÃ¸se deploy via webhook/API som
        sidste step i workflowet i stedet for automatisk deploy pÃ¥ hvert push. SÃ¥ sikrer du, at
        kun testet kode nogensinde nÃ¥r produktion.
      </p>

      <h3>Tjekliste: er testene integreret i cyklussen?</h3>
      <ul>
        <li>KÃ¸rer unit-tests automatisk pÃ¥ hver PR?</li>
        <li>Er branch protection slÃ¥et til, sÃ¥ rÃ¸de checks blokerer merge?</li>
        <li>Er de hurtigste tests fÃ¸rst i pipelinen?</li>
        <li>Gemmes testrapporter som artefakter, sÃ¥ fejl kan undersÃ¸ges?</li>
        <li>Tester E2E den kode, der er i PR'en â€“ ikke et gammelt deploy?</li>
        <li>Ligger secrets i GitHub Secrets/Dokploy â€“ aldrig i git?</li>
      </ul>
    </LessonLayout>
  )
}
