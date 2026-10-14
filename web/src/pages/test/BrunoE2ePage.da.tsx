import LessonLayout from '../../components/LessonLayout'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import MermaidDiagram from '../../components/MermaidDiagram'
import Figure from '../../components/Figure'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import LinkTrio from '../../components/LinkTrio'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'
import { useLanguage } from '../../i18n/LanguageContext'

const pyramidChart = `
flowchart TB
  E2E["E2E-tests<br/>FÃ¥ - langsomme - realistiske<br/>Bruno mod kÃ¸rende API"]
  INT["Integrationstests<br/>Nogle - flere dele sammen<br/>fx API + database"]
  UNIT["Unit-tests<br/>Mange - hurtige - isolerede<br/>NUnit + Moq"]
  E2E --> INT
  INT --> UNIT
`

const flowsChart = `
flowchart LR
  Start(["Tom testbruger"]) --> F01["01 Register<br/>POST /auth/register"]
  F01 --> F02["02 Login<br/>POST /auth/login<br/>gem token"]
  F02 --> F03["03 Brugerflow<br/>GET /me, POST /items,<br/>GET /items"]
  F03 --> Slut(["Cleanup / ny testbruger nÃ¦ste gang"])
`

const sequenceChart = `
sequenceDiagram
  participant Bruno as Bruno-CLI
  participant Api as API
  participant Db as Database
  Bruno->>Bruno: LÃ¦s environment og pre-request script
  Bruno->>Api: POST /auth/login med JSON body
  Api->>Db: SlÃ¥ bruger op og tjek password
  Db-->>Api: BrugerrÃ¦kke
  Api-->>Bruno: 200 OK + JSON med token
  Bruno->>Bruno: KÃ¸r tests og assertions
  Bruno->>Bruno: post-response script gemmer token i variabel
`

const ciChart = `
flowchart LR
  PR["Pull request / push"] --> GA["GitHub Actions"]
  GA --> Compose["docker compose up -d --build<br/>API + database"]
  Compose --> Health["Vent pÃ¥ health check"]
  Health --> Bruno["bru run E2E-UserFlows --env ci"]
  Bruno --> Res{"Alle tests grÃ¸nne?"}
  Res -- "Ja" --> Ok["Check bestÃ¥r"]
  Res -- "Nej" --> Fail["Check fejler - merge blokeres"]
`

const prProblemChart = `
flowchart LR
  Dev["PR-kode<br/>ny fejlrettelse"] -. "ikke med i testen!" .-> Api
  Main["main-branch<br/>deployet via Dokploy"] --> Api["Deployet API<br/>den gamle version"]
  Bruno["Bruno E2E i CI"] --> Api
  Api --> Res["GrÃ¸nne tests<br/>men PR-koden er aldrig kÃ¸rt"]
`

export default function BrunoE2ePageDa() {
  const { lang } = useLanguage()
  const objective = getObjectiveByPath('/test/bruno-e2e')

  return (
    <LessonLayout module="test">
      <h1>API-test og E2E med Bruno</h1>
      {objective ? (
        <p>
          <ObjectiveBadge level={objective.level} /> {objectiveTitle(objective, lang)}
        </p>
      ) : (
        <p>
          <ObjectiveBadge level="H3" /> LÃ¦rlingen kan gennemfÃ¸re en scriptet test pÃ¥ en app- eller
          webplatform.
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
        src="/images/bruno.png"
        alt="Bruno API-klient"
        caption="Bruno â€“ en open source API-klient, hvor requests er almindelige filer i dit repo."
      />

      <h2>LÃ¦ringsmÃ¥l</h2>
      <p>Efter lektionen (Dag 28) skal du kunne:</p>
      <ul>
        <li>
          Placere <strong>E2E- og API-tests</strong> i testpyramiden og forklare forskellen pÃ¥ de
          tre lag: unit, integration og E2E.
        </li>
        <li>
          Opbygge en <strong>scriptet E2E-test i Bruno</strong> med flere requests, variabler og
          assertions, der tilsammen afspejler et rigtigt brugerflow.
        </li>
        <li>
          Forklare, hvordan Bruno-tests kÃ¸res i <strong>GitHub Actions</strong> mod en API startet
          med Docker Compose.
        </li>
        <li>
          Identificere og begrunde <strong>svagheden ved at teste mod et deployet API</strong>
          i stedet for PR-koden.
        </li>
      </ul>

      <h2>De tre lag: unit, integration og E2E</h2>
      <p>
        I lektionen om unit-tests lÃ¦rte du det nederste lag. Nu bevÃ¦ger vi os til toppen. De tre lag
        besvarer tre forskellige spÃ¸rgsmÃ¥l, og du har brug for dem alle â€“ de erstatter ikke hinanden.
      </p>
      <table>
        <thead>
          <tr>
            <th>Lag</th>
            <th>SpÃ¸rgsmÃ¥l der besvares</th>
            <th>Hvad er med?</th>
            <th>Hastighed</th>
            <th>Antal</th>
            <th>VÃ¦rktÃ¸j i pensum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Unit</strong>
            </td>
            <td>Virker denne lille klasse/metode som forventet?</td>
            <td>Ã‰n enhed, afhÃ¦ngigheder er mocket</td>
            <td>Millisekunder</td>
            <td>Mange</td>
            <td>NUnit + Moq</td>
          </tr>
          <tr>
            <td>
              <strong>Integration</strong>
            </td>
            <td>Virker delene sammen (fx API + database + serialisering)?</td>
            <td>Flere rigtige komponenter, evt. testdatabase</td>
            <td>Sekunder</td>
            <td>Nogle</td>
            <td>WebApplicationFactory, Testcontainers</td>
          </tr>
          <tr>
            <td>
              <strong>E2E</strong>
            </td>
            <td>Virker hele flowet, som en bruger/klient oplever det?</td>
            <td>Hele systemet kÃ¸rende udefra: HTTP, auth, DB</td>
            <td>Sekunder til minutter</td>
            <td>FÃ¥</td>
            <td>Bruno (API-flows)</td>
          </tr>
        </tbody>
      </table>
      <MermaidDiagram chart={pyramidChart} />
      <p>
        Pyramiden er en tommelfingerregel om <em>balance</em>: jo hÃ¸jere op, jo dyrere er testen at
        skrive, kÃ¸re og vedligeholde â€“ og jo flere ting kan gÃ¥ galt af Ã¥rsager, der ikke har med
        koden at gÃ¸re (netvÃ¦rk, timing, testdata). Derfor skriver vi fÃ¥, veludvalgte E2E-tests til
        de vigtigste brugerflows og lader de mange smÃ¥ unit-tests tage resten.
      </p>

      <h2>Hvad er API-test og E2E?</h2>
      <p>
        En <strong>API-test</strong> sender rigtige HTTP-requests til et kÃ¸rende API og kontrollerer
        svaret: statuskode, headers, JSON-indhold og responstid. Du tester ikke koden indefra, men{' '}
        <em>kontrakten udefra</em> â€“ pÃ¥ samme mÃ¥de som en frontend eller en tredjepart ville bruge
        den. Det gÃ¸r API-tests oplagte som <strong>E2E-test</strong> for backends, fordi hele
        kÃ¦den bliver brugt: routing, middleware, authentication, forretningslogik, database og
        serialisering.
      </p>
      <p>
        <strong>End-to-end</strong> betyder "fra ende til anden": fra brugerens handling til data er
        gemt og returneret. En E2E-test beskriver typisk et <em>flow</em>, ikke en enkelt
        handling: "opret bruger â†’ log ind â†’ opret opgave â†’ hent opgaveliste". Hver
        request afhÃ¦nger af den forrige, og det er netop det, der gÃ¸r testen realistisk.
      </p>
      <Callout type="info">
        Til UI-tests i browseren bruges vÃ¦rktÃ¸jer som Playwright eller Cypress. I pensum holder vi os til
        API-niveauet, fordi det er hurtigere, mere stabilt og tester den logik, vi selv har skrevet.
      </Callout>

      <h2>Hvorfor Bruno?</h2>
      <p>
        Postman er det mest kendte vÃ¦rktÃ¸j, men Bruno har en rÃ¦kke fordele, som passer godt til
        et udviklerhold, der arbejder i Git:
      </p>
      <ul>
        <li>
          <strong>Filbaseret og Git-venlig:</strong> hver request er en <code>.bru</code>-tekstfil i
          dit repo. Du kan se diff, review i PR og have samme version som koden.
        </li>
        <li>
          <strong>Open source og offline:</strong> ingen tvungen cloud-konto eller synkronisering
          af dine requests til en tredjepart.
        </li>
        <li>
          <strong>Scripting og tests i JavaScript:</strong> pre-request scripts, post-response scripts
          og <code>test()</code>-blokke med Chai-assertions.
        </li>
        <li>
          <strong>CLI til CI:</strong> <code>bru run</code> kÃ¸rer hele mapper af requests fra
          kommandolinjen og returnerer en exit-kode, som en pipeline kan reagere pÃ¥.
        </li>
        <li>
          <strong>Environments:</strong> samme tests kan kÃ¸re mod <code>local</code>, <code>ci</code>{' '}
          og <code>prod</code> ved at skifte baseUrl og secrets.
        </li>
      </ul>
      <Callout type="warn">
        LÃ¦g aldrig rigtige passwords eller tokens i <code>.bru</code>-filer. Brug environment-filer
        uden secrets (eller <code>.env</code> der er i <code>.gitignore</code>) og lad CI levere hemmeligheder via
        GitHub Secrets.
      </Callout>

      <h2>E2E-struktur i repo: Bruno/E2E-UserFlows</h2>
      <p>
        I h4-mags ligger E2E-testene i mappen <code>Bruno/E2E-UserFlows</code>. De nummererede
        filer sikrer, at Bruno kÃ¸rer dem i den rÃ¦kkefÃ¸lge, flowet krÃ¦ver â€“ hver fil bygger pÃ¥
        resultatet af den foregÃ¥ende.
      </p>
      <CodeBlock language="text">{`Bruno/
  bruno.json
  environments/
    local.bru
    ci.bru
  E2E-UserFlows/
    folder.bru
    01-register.bru
    02-login.bru
    03-user-flow.bru`}</CodeBlock>
      <MermaidDiagram chart={flowsChart} />
      <table>
        <thead>
          <tr>
            <th>Fil</th>
            <th>FormÃ¥l</th>
            <th>Gemmer til nÃ¦ste step</th>
            <th>Typiske assertions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>01-register</code>
            </td>
            <td>Opretter en unik testbruger (fx med timestamp i e-mail)</td>
            <td>Brugerens e-mail og password</td>
            <td>Status 201, svaret indeholder bruger-id</td>
          </tr>
          <tr>
            <td>
              <code>02-login</code>
            </td>
            <td>Logger ind med den netop oprettede bruger</td>
            <td>Access token (<code>bru.setVar("token", ...)</code>)</td>
            <td>Status 200, token findes og er en streng</td>
          </tr>
          <tr>
            <td>
              <code>03-user-flow</code>
            </td>
            <td>Bruger token til beskyttede endpoints og tjekker data</td>
            <td>Evt. id pÃ¥ oprettede ressourcer</td>
            <td>Status 200/201, liste indeholder det oprettede element; uden token giver 401</td>
          </tr>
        </tbody>
      </table>
      <p>
        BemÃ¦rk, at hele flowet er en <strong>kÃ¦de</strong>. Fejler 01, er 02 og 03 meningslÃ¸se â€“
        derfor stopper en god pipeline ved fÃ¸rste fejl og rapporterer netop <em>hvilket step</em>, der
        gik galt. Det gÃ¸r fejlsÃ¸gning markant lettere end at gÃ¦tte ud fra "hele testen fejlede".
      </p>

      <h2>Anatomien i Ã©n Bruno-request</h2>
      <p>
        En <code>.bru</code>-fil er ren tekst og bestÃ¥r af blokke. Her er login-requesten:
      </p>
      <CodeBlock language="text">{`meta {
  name: 02-login
  type: http
  seq: 2
}

post {
  url: {{baseUrl}}/api/auth/login
  body: json
  auth: none
}

headers {
  Content-Type: application/json
}

body:json {
  {
    "email": "{{userEmail}}",
    "password": "{{userPassword}}"
  }
}

script:post-response {
  bru.setVar("token", res.body.accessToken);
}

assert {
  res.status: eq 200
  res.body.accessToken: isString
}

tests {
  test("login returnerer token", function () {
    expect(res.body.accessToken).to.be.a("string");
    expect(res.responseTime).to.be.below(1000);
  });
}`}</CodeBlock>
      <table>
        <thead>
          <tr>
            <th>Blok</th>
            <th>Rolle</th>
            <th>Eksempel</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>meta</code>
            </td>
            <td>Navn og rÃ¦kkefÃ¸lge (<code>seq</code>) i mappen</td>
            <td>
              <code>seq: 2</code> kÃ¸rer efter register
            </td>
          </tr>
          <tr>
            <td>
              <code>post</code> / <code>get</code>
            </td>
            <td>HTTP-metode, URL og body-type</td>
            <td>
              <code>url: {'{{baseUrl}}'}/api/auth/login</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>headers</code>
            </td>
            <td>Request-headers, fx Content-Type eller Authorization</td>
            <td>
              <code>Authorization: Bearer {'{{token}}'}</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>body:json</code>
            </td>
            <td>Payload der sendes</td>
            <td>E-mail og password fra variabler</td>
          </tr>
          <tr>
            <td>
              <code>script:pre-request</code>
            </td>
            <td>JavaScript fÃ¸r requesten (generÃ©r data)</td>
            <td>Unik e-mail med timestamp</td>
          </tr>
          <tr>
            <td>
              <code>script:post-response</code>
            </td>
            <td>JavaScript efter svaret (gem variabler)</td>
            <td>
              <code>bru.setVar("token", ...)</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>assert</code>
            </td>
            <td>Deklarative checks (kort syntaks)</td>
            <td>
              <code>res.status: eq 200</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>tests</code>
            </td>
            <td>Fri JavaScript-test med Chai</td>
            <td>
              <code>expect(...).to.be.a("string")</code>
            </td>
          </tr>
        </tbody>
      </table>
      <MermaidDiagram chart={sequenceChart} />
      <p>
        Sekvensdiagrammet viser, at Bruno bÃ¥de er <em>klient</em> og <em>testlÃ¸ber</em>: den sender
        requesten som en rigtig klient, men bagefter kÃ¸rer den ogsÃ¥ dine assertions og gemmer
        data til nÃ¦ste request. Databasen er med i kÃ¦den â€“ det er netop det, der adskiller E2E
        fra en unit-test med mocks.
      </p>

      <h2>KÃ¸rsel i CI: GitHub Actions + Docker Compose</h2>
      <p>
        Lokalt kÃ¸rer du Bruno i GUI'et. I CI bruger du CLI'en (<code>@usebruno/cli</code>). For at
        have noget at teste imod, starter pipelinen hele stacken med Docker Compose: API og
        database bygges fra den kode, der ligger i repoet, og Bruno kÃ¸rer mod{' '}
        <code>http://localhost:PORT</code>.
      </p>
      <MermaidDiagram chart={ciChart} />
      <CodeBlock language="yaml">{`name: E2E (Bruno)

on:
  pull_request:
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Start API + database
        run: docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build

      - name: Vent pÃ¥ at API er klar
        run: |
          for i in $(seq 1 30); do
            curl -fs http://localhost:8080/health && exit 0
            sleep 2
          done
          echo "API blev aldrig klar" && docker compose logs api && exit 1

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Installer Bruno CLI
        run: npm install -g @usebruno/cli

      - name: KÃ¸r E2E-flows
        working-directory: Bruno
        run: bru run E2E-UserFlows --env ci --reporter-html e2e-report.html

      - name: Gem rapport
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: bruno-report
          path: Bruno/e2e-report.html

      - name: Stop stack
        if: always()
        run: docker compose down -v`}</CodeBlock>
      <p>
        Pipelinen gÃ¸r fire ting i rÃ¦kkefÃ¸lge: <strong>(1)</strong> bygger og starter stacken,{' '}
        <strong>(2)</strong> venter pÃ¥ et health-endpoint, sÃ¥ Bruno ikke starter, fÃ¸r API'et
        er klar (en klassisk kilde til flaky tests), <strong>(3)</strong> kÃ¸rer flowene og{' '}
        <strong>(4)</strong> rydder op og gemmer rapporten som artefakt â€“ ogsÃ¥ hvis testene fejler (
        <code>if: always()</code>). Fordi <code>bru run</code> returnerer en exit-kode forskellig
        fra 0 ved fejlede tests, bliver jobbet rÃ¸dt, og et branch protection-regelsÃ¦t kan blokere
        merge.
      </p>
      <Callout type="tip">
        Giv testbrugeren en unik e-mail pr. kÃ¸rsel (fx{' '}
        <code>test+timestamp@example.com</code> genereret i et pre-request script). SÃ¥ fejler
        testen ikke bare fordi brugeren allerede findes fra sidste kÃ¸rsel.
      </Callout>

      <h2>PR-problemet: E2E tester det deployede API, ikke PR-koden</h2>
      <p>
        Et vigtigt forbehold: hvis Bruno-testene peger pÃ¥ et <strong>allerede deployet</strong> API
        (fx miljÃ¸et pÃ¥ Dokploy) i stedet for en stack bygget i pipelinen, tester de ikke det, du
        har Ã¦ndret i din pull request. De tester den version, der kÃ¸rer i dag â€“ altsÃ¥{' '}
        <code>main</code>. Resultatet er et <em>falsk grÃ¸nt</em> signal: testene bestÃ¥r, men din
        nye kode er aldrig blevet kÃ¸rt.
      </p>
      <MermaidDiagram chart={prProblemChart} />
      <Callout type="danger">
        Et grÃ¸nt E2E-check pÃ¥ en PR har kun vÃ¦rdi, hvis den kode, der testes, er PR-koden. Ellers
        risikerer du at merge en fejl og fÃ¸rst opdage den, nÃ¥r den er deployet og testene kÃ¸rer
        igen.
      </Callout>
      <p>Der er flere mÃ¥der at lÃ¸se det pÃ¥:</p>
      <ul>
        <li>
          <strong>Byg stacken i CI (anbefalet):</strong> Docker Compose i pipelinen bygger API'et
          fra PR'ens commit, som vist ovenfor.
        </li>
        <li>
          <strong>Preview-miljÃ¸er:</strong> Dokploy kan oprette et midlertidigt miljÃ¸ pr. PR, som
          Bruno derefter tester mod. KrÃ¦ver mere opsÃ¦tning, men er tÃ¦ttest pÃ¥ produktion.
        </li>
        <li>
          <strong>KÃ¸r E2E efter deploy som smoke test:</strong> accepter, at E2E mod det deployede
          miljÃ¸ er en <em>post-deploy</em>-kontrol, ikke en PR-gate, og brug unit-/integrationstests
          som PR-gate.
        </li>
      </ul>

      <h2>Opsummering</h2>
      <table>
        <thead>
          <tr>
            <th>Emne</th>
            <th>Det vigtigste at huske</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Testpyramiden</td>
            <td>Mange unit, nogle integration, fÃ¥ E2E â€“ balance mellem hastighed og realisme</td>
          </tr>
          <tr>
            <td>API-test / E2E</td>
            <td>Test kontrakten udefra via rigtige HTTP-requests og hele flows</td>
          </tr>
          <tr>
            <td>Bruno</td>
            <td>Filbaseret, Git-venlig, scripting i JS, CLI til CI</td>
          </tr>
          <tr>
            <td>E2E-UserFlows</td>
            <td>01 register â†’ 02 login (gem token) â†’ 03 brugerflow med auth</td>
          </tr>
          <tr>
            <td>Request-anatomi</td>
            <td>meta, metode/URL, headers, body, scripts, assert, tests</td>
          </tr>
          <tr>
            <td>CI</td>
            <td>GitHub Actions starter Docker Compose, venter pÃ¥ health, kÃ¸rer <code>bru run</code></td>
          </tr>
          <tr>
            <td>PR-fÃ¦lden</td>
            <td>Test mod deployet API tester ikke PR-koden â€“ byg stacken i pipelinen</td>
          </tr>
        </tbody>
      </table>
    </LessonLayout>
  )
}
