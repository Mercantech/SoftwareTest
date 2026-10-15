import LessonLayout from '../../components/LessonLayout'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import MermaidDiagram from '../../components/MermaidDiagram'
import Figure from '../../components/Figure'

const ciCdChart = `
flowchart LR
  Commit["Commit / PR"] --> Build["Build"]
  Build --> Unit["Unit tests"]
  Unit --> Int["Integration tests"]
  Int --> Merge["Merge to main"]
  Merge --> Deliver["Continuous Delivery<br/>Ready for release"]
  Deliver --> Approve{"Manual approval?"}
  Approve -- "Yes" --> Prod["Production"]
  Approve -- "No: Continuous Deployment" --> Prod
  subgraph CI["Continuous Integration"]
    Build
    Unit
    Int
  end
`

const gatesChart = `
flowchart LR
  A["Push"] --> G1{"Gate 1<br/>Build and lint"}
  G1 -- "fail" --> X1["Stop"]
  G1 -- "ok" --> G2{"Gate 2<br/>Unit tests"}
  G2 -- "fail" --> X2["Stop"]
  G2 -- "ok" --> G3{"Gate 3<br/>Integration + E2E"}
  G3 -- "fail" --> X3["Stop"]
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
    name: Build and unit tests
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

      - name: Unit tests
        run: >
          dotnet test --no-build --configuration Release
          --logger "trx;LogFileName=results.trx"
          --collect:"XPlat Code Coverage"

      - name: Save test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: "**/TestResults/**"

  e2e:
    name: E2E with Bruno
    runs-on: ubuntu-latest
    needs: unit            # only runs if the unit tests are green
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

export default function CiCdPageEn() {

  return (
    <LessonLayout module="test">
      <h1>CI/CD – automated tests in the development cycle</h1>
      <Figure
        src="/images/commons/devops-infinity.svg"
        alt="DevOps toolchain: plan, code, build, test, release, deploy, operate, monitor"
        caption="The DevOps loop: tests are a fixed part of the path from code to operations"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Devops-toolchain.svg"
        sourceLabel="Wikimedia Commons"
      />
      <Figure
        src="/images/cicd.png"
        alt="CI/CD pipeline from commit to production"
        caption="From commit to production – automated and with tests as quality gates."
      />

      <h2>Learning objectives</h2>
      <p>After the lesson (Day 29) you should be able to:</p>
      <ul>
        <li>
          Explain the difference between <strong>Continuous Integration</strong>,{' '}
          <strong>Continuous Delivery</strong> and <strong>Continuous Deployment</strong>.
        </li>
        <li>
          Place unit, integration and E2E tests as <strong>gates</strong> in a pipeline and justify
          the order.
        </li>
        <li>
          Read and write a simple <strong>GitHub Actions workflow</strong> that builds and tests a
          .NET solution.
        </li>
        <li>
          Compare <strong>GitHub Actions</strong> and <strong>Dokploy</strong> and explain which role
          each of them has in our setup.
        </li>
      </ul>

      <h2>CI vs. CD – what is the difference?</h2>
      <p>
        The two abbreviations are often used interchangeably, but they cover different steps. What
        they share is the idea that <strong>everything that can be automated between "I have written
        code" and "the user can use it" should be automated</strong> – because humans forget things,
        and machines do the same thing every time.
      </p>

      <h3>Continuous Integration (CI)</h3>
      <p>
        CI means that all developers <strong>integrate their code often</strong> (at least daily)
        into a shared branch, and that every integration is automatically{' '}
        <strong>built and tested</strong>. The goal is to find integration errors early, while the
        change is still small and fresh in memory. Without CI you only discover at the end of a
        project that two developers' code does not fit together – and then debugging is expensive.
      </p>
      <Callout type="info">
        <strong>CI rule:</strong> When main is red, everyone's first priority is to get it green
        again. A pipeline nobody trusts gets ignored – and then it is worthless.
      </Callout>

      <h3>Continuous Delivery (CD)</h3>
      <p>
        Continuous <strong>Delivery</strong> builds on CI: every change that passes the pipeline is{' '}
        <strong>ready to be released</strong> – artifacts are built, the environment is configured,
        and all tests are green. The actual release to production is, however, a{' '}
        <em>deliberate, manual decision</em> (a click on a button).
      </p>

      <h3>Continuous Deployment</h3>
      <p>
        Continuous <strong>Deployment</strong> goes one step further: every green change on main is
        released automatically to production, with no manual click. It requires very high trust in
        the tests – and this is exactly where automated tests become indispensable.
      </p>
      <Callout type="tip">
        Remember it as three steps: <strong>Integration</strong> = built and tested.{' '}
        <strong>Delivery</strong> = can be released at any time. <strong>Deployment</strong> =
        released automatically.
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
              <strong>Trigger</strong>
            </td>
            <td>Push / pull request</td>
            <td>Green pipeline on main</td>
            <td>Green pipeline on main</td>
          </tr>
          <tr>
            <td>
              <strong>Result</strong>
            </td>
            <td>Built and tested code</td>
            <td>Release-ready artifact</td>
            <td>New version in production</td>
          </tr>
          <tr>
            <td>
              <strong>Human in the loop?</strong>
            </td>
            <td>No (review only)</td>
            <td>Yes – approves the release</td>
            <td>No</td>
          </tr>
        </tbody>
      </table>

      <h2>Where do tests fit in? Tests as gates</h2>
      <p>
        A pipeline is a series of <strong>gates</strong>. The code only moves on to the next one if a
        gate is passed. The principle for the order is simple: <em>fast and cheap tests first</em>,
        expensive and slow ones last. If something fails early, you do not waste minutes starting
        Docker and running E2E flows.
      </p>
      <MermaidDiagram chart={gatesChart} />
      <ul>
        <li>
          <strong>Build + lint (seconds):</strong> Can the code even compile? Are the style rules
          followed?
        </li>
        <li>
          <strong>Unit tests (seconds):</strong> Is the local logic correct? See the lesson on unit
          testing.
        </li>
        <li>
          <strong>Integration + E2E (minutes):</strong> Do the parts work together? See the lessons
          on integration testing and Bruno.
        </li>
        <li>
          <strong>Review + branch protection:</strong> Human control. Require green checks and at
          least one review before merging to <code>main</code>.
        </li>
        <li>
          <strong>Deploy:</strong> Only when all gates have been passed is the code rolled out.
        </li>
      </ul>
      <Callout type="warn">
        A pipeline only gives false security if the tests are bad or get skipped. Avoid switching off
        tests "just to get it green". A disabled test is a bug waiting to happen.
      </Callout>
      <Callout type="danger">
        Remember the <strong>PR trap</strong> from the lesson on Bruno: E2E tests against an already
        deployed environment do not test your PR code. Build and start the stack in the pipeline
        itself.
      </Callout>

      <h2>Example: GitHub Actions workflow</h2>
      <p>
        GitHub Actions is configured with YAML files in <code>.github/workflows/</code>. A{' '}
        <strong>workflow</strong> is triggered by <em>events</em> (<code>on:</code>), consists of{' '}
        <strong>jobs</strong> that run on a <em>runner</em> (<code>runs-on</code>), and each job
        consists of <strong>steps</strong> – either reusable actions (<code>uses:</code>) or shell
        commands (<code>run:</code>). With <code>needs:</code> you create dependencies, so the e2e
        job only starts once unit is green.
      </p>
      <CodeBlock language="yaml">{workflowYaml}</CodeBlock>
      <p>Note the important details in the file:</p>
      <ul>
        <li>
          <code>on: pull_request</code> makes sure tests run <em>before</em> merge – not only
          afterwards.
        </li>
        <li>
          <code>concurrency</code> cancels outdated runs when you push again to the same branch – it
          saves time and free minutes.
        </li>
        <li>
          <code>--no-restore</code> and <code>--no-build</code> avoid doing the work twice.
        </li>
        <li>
          <code>if: always()</code> ensures that test results are uploaded even when the tests fail –
          exactly when you need them most.
        </li>
        <li>
          Secrets are read from <code>secrets</code> – never hardcoded in the file.
        </li>
      </ul>
      <Callout type="tip">
        Enable <strong>branch protection</strong> on <code>main</code> in GitHub: require that the
        checks <em>Build and unit tests</em> and <em>E2E with Bruno</em> are green before a PR can be
        merged. Only then does the pipeline become a real gate and not just a suggestion.
      </Callout>

      <h2>GitHub Actions vs. Dokploy</h2>
      <p>
        In our setup we use both, and they overlap less than you might think. In short:{' '}
        <strong>GitHub Actions answers "is the code good enough?"</strong> and{' '}
        <strong>Dokploy answers "how does it run?"</strong>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Aspect</th>
            <th>GitHub Actions</th>
            <th>Dokploy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Main purpose</strong>
            </td>
            <td>CI: build, test, lint, scanning</td>
            <td>Hosting and deploying Docker Compose apps</td>
          </tr>
          <tr>
            <td>
              <strong>Triggered by</strong>
            </td>
            <td>Events: push, PR, schedule, manual</td>
            <td>Push to a chosen branch (webhook) or manual redeploy</td>
          </tr>
          <tr>
            <td>
              <strong>Configuration</strong>
            </td>
            <td>YAML in the repo (<code>.github/workflows</code>)</td>
            <td>UI/API/MCP + <code>docker-compose.yml</code> in the repo</td>
          </tr>
          <tr>
            <td>
              <strong>Runs where</strong>
            </td>
            <td>Ephemeral GitHub runners (or your own)</td>
            <td>Our own server (<code>deploy.mags.dk</code>)</td>
          </tr>
          <tr>
            <td>
              <strong>Tests</strong>
            </td>
            <td>Yes – this is where the gates live (unit, integration, E2E)</td>
            <td>No – does not run tests, only build and start</td>
          </tr>
          <tr>
            <td>
              <strong>Secrets</strong>
            </td>
            <td>GitHub Secrets (for test/CI)</td>
            <td>Environment variables per environment (dev/prod)</td>
          </tr>
          <tr>
            <td>
              <strong>Result</strong>
            </td>
            <td>Green/red check on a commit or PR</td>
            <td>Running container behind Traefik + logs</td>
          </tr>
          <tr>
            <td>
              <strong>Rollback</strong>
            </td>
            <td>Re-run or revert commit</td>
            <td>Redeploy of a previous version/commit</td>
          </tr>
        </tbody>
      </table>
      <p>
        The ideal interplay is: <strong>Actions tests the PR</strong> → merge to main only if green
        → <strong>Dokploy deploys main</strong> to the environment. If you want Dokploy to{' '}
        <em>wait</em> for CI, you can use Dokploy's option to trigger a deploy via webhook/API as
        the last step in the workflow instead of automatic deploy on every push. That ensures that
        only tested code ever reaches production.
      </p>

      <h3>Checklist: are the tests integrated into the cycle?</h3>
      <ul>
        <li>Do unit tests run automatically on every PR?</li>
        <li>Is branch protection enabled, so red checks block merging?</li>
        <li>Are the fastest tests first in the pipeline?</li>
        <li>Are test reports saved as artifacts, so failures can be investigated?</li>
        <li>Does E2E test the code that is in the PR – not an old deploy?</li>
        <li>Are secrets stored in GitHub Secrets/Dokploy – never in git?</li>
      </ul>
    </LessonLayout>
  )
}
