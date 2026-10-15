import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import Figure from '../../components/Figure'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'
import Split from '../../components/Split'

const pyramidChart = `
flowchart TB
  E2E["E2E tests<br/>Few - slow - realistic<br/>Bruno against a running API"]
  INT["Integration tests<br/>Some - several parts together<br/>e.g. API + database"]
  UNIT["Unit tests<br/>Many - fast - isolated<br/>NUnit + Moq"]
  E2E --> INT
  INT --> UNIT
`

const flowsChart = `
flowchart LR
  Start(["Empty test user"]) --> F01["01 Register<br/>POST /auth/register"]
  F01 --> F02["02 Login<br/>POST /auth/login<br/>store token"]
  F02 --> F03["03 User flow<br/>GET /me, POST /items,<br/>GET /items"]
  F03 --> Slut(["Cleanup / new test user next time"])
`

const sequenceChart = `
sequenceDiagram
  participant Bruno as Bruno CLI
  participant Api as API
  participant Db as Database
  Bruno->>Bruno: Read environment and pre-request script
  Bruno->>Api: POST /auth/login with JSON body
  Api->>Db: Look up user and check password
  Db-->>Api: User row
  Api-->>Bruno: 200 OK + JSON with token
  Bruno->>Bruno: Run tests and assertions
  Bruno->>Bruno: post-response script stores token in variable
`

const ciChart = `
flowchart LR
  PR["Pull request / push"] --> GA["GitHub Actions"]
  GA --> Compose["docker compose up -d --build<br/>API + database"]
  Compose --> Health["Wait for health check"]
  Health --> Bruno["bru run E2E-UserFlows --env ci"]
  Bruno --> Res{"All tests green?"}
  Res -- "Yes" --> Ok["Check passes"]
  Res -- "No" --> Fail["Check fails - merge blocked"]
`

const prProblemChart = `
flowchart LR
  Dev["PR code<br/>new bug fix"] -. "not part of the test!" .-> Api
  Main["main branch<br/>deployed via Dokploy"] --> Api["Deployed API<br/>the old version"]
  Bruno["Bruno E2E in CI"] --> Api
  Api --> Res["Green tests<br/>but the PR code never ran"]
`

export default function BrunoE2ePageEn() {

  return (
    <LessonLayout module="test">
      <h1>API testing and E2E with Bruno</h1>

      <h2>Learning objectives</h2>
      <Split
        media={
          <Figure
            src="/images/bruno.png"
            alt="Bruno API client"
            caption="Bruno – an open source API client where requests are ordinary files in your repo."
            size="sm"
          />
        }
      >
        <p>After the lesson (Day 28) you should be able to:</p>
        <ul>
          <li>
            Place <strong>E2E and API tests</strong> in the test pyramid and explain the difference
            between the three layers: unit, integration and E2E.
          </li>
          <li>
            Build a <strong>scripted E2E test in Bruno</strong> with several requests, variables and
            assertions that together reflect a real user flow.
          </li>
          <li>
            Explain how Bruno tests are run in <strong>GitHub Actions</strong> against an API started
            with Docker Compose.
          </li>
          <li>
            Identify and justify the <strong>weakness of testing against a deployed API</strong>{' '}
            instead of the PR code.
          </li>
        </ul>
      </Split>

      <h2>The three layers: unit, integration and E2E</h2>
      <p>
        In the lesson on unit tests you learned the bottom layer. Now we move to the top. The three
        layers answer three different questions, and you need all of them – they do not replace each
        other.
      </p>
      <table>
        <thead>
          <tr>
            <th>Layer</th>
            <th>Question answered</th>
            <th>What is included?</th>
            <th>Speed</th>
            <th>Quantity</th>
            <th>Tool in the curriculum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Unit</strong>
            </td>
            <td>Does this small class/method work as expected?</td>
            <td>One unit, dependencies are mocked</td>
            <td>Milliseconds</td>
            <td>Many</td>
            <td>NUnit + Moq</td>
          </tr>
          <tr>
            <td>
              <strong>Integration</strong>
            </td>
            <td>Do the parts work together (e.g. API + database + serialization)?</td>
            <td>Several real components, possibly a test database</td>
            <td>Seconds</td>
            <td>Some</td>
            <td>WebApplicationFactory, Testcontainers</td>
          </tr>
          <tr>
            <td>
              <strong>E2E</strong>
            </td>
            <td>Does the whole flow work, as a user/client experiences it?</td>
            <td>The whole system running, from the outside: HTTP, auth, DB</td>
            <td>Seconds to minutes</td>
            <td>Few</td>
            <td>Bruno (API flows)</td>
          </tr>
        </tbody>
      </table>
      <MermaidDiagram chart={pyramidChart} />
      <p>
        The pyramid is a rule of thumb about <em>balance</em>: the higher up, the more expensive the
        test is to write, run and maintain – and the more things can go wrong for reasons unrelated
        to the code (network, timing, test data). That is why we write a few, well-chosen E2E tests
        for the most important user flows and let the many small unit tests handle the rest.
      </p>

      <h2>What are API testing and E2E?</h2>
      <p>
        An <strong>API test</strong> sends real HTTP requests to a running API and checks the
        response: status code, headers, JSON content and response time. You are not testing the code
        from the inside, but <em>the contract from the outside</em> – the same way a frontend or a
        third party would use it. That makes API tests an obvious <strong>E2E test</strong> for
        backends, because the whole chain is exercised: routing, middleware, authentication,
        business logic, database and serialization.
      </p>
      <p>
        <strong>End-to-end</strong> means "from one end to the other": from the user's action to data
        being stored and returned. An E2E test typically describes a <em>flow</em>, not a single
        action: "create user → log in → create task → fetch task list". Each request depends on the
        previous one, and that is exactly what makes the test realistic.
      </p>
      <Callout type="info">
        For UI tests in the browser, tools like Playwright or Cypress are used. In the curriculum we
        stay at the API level, because it is faster, more stable and tests the logic we wrote
        ourselves.
      </Callout>

      <h2>Why Bruno?</h2>
      <p>
        Postman is the best-known tool, but Bruno has a number of advantages that suit a development
        team working in Git:
      </p>
      <ul>
        <li>
          <strong>File-based and Git-friendly:</strong> each request is a <code>.bru</code> text file
          in your repo. You can see diffs, review in a PR and have the same version as the code.
        </li>
        <li>
          <strong>Open source and offline:</strong> no forced cloud account or syncing of your
          requests to a third party.
        </li>
        <li>
          <strong>Scripting and tests in JavaScript:</strong> pre-request scripts, post-response
          scripts and <code>test()</code> blocks with Chai assertions.
        </li>
        <li>
          <strong>CLI for CI:</strong> <code>bru run</code> runs whole folders of requests from the
          command line and returns an exit code that a pipeline can react to.
        </li>
        <li>
          <strong>Environments:</strong> the same tests can run against <code>local</code>,{' '}
          <code>ci</code> and <code>prod</code> by switching baseUrl and secrets.
        </li>
      </ul>
      <Callout type="warn">
        Never put real passwords or tokens in <code>.bru</code> files. Use environment files without
        secrets (or a <code>.env</code> that is in <code>.gitignore</code>) and let CI supply secrets
        via GitHub Secrets.
      </Callout>

      <h2>E2E structure in the repo: Bruno/E2E-UserFlows</h2>
      <p>
        In h4-mags the E2E tests live in the folder <code>Bruno/E2E-UserFlows</code>. The numbered
        files ensure that Bruno runs them in the order the flow requires – each file builds on the
        result of the previous one.
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
            <th>File</th>
            <th>Purpose</th>
            <th>Stores for next step</th>
            <th>Typical assertions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>01-register</code>
            </td>
            <td>Creates a unique test user (e.g. with a timestamp in the email)</td>
            <td>The user's email and password</td>
            <td>Status 201, the response contains a user id</td>
          </tr>
          <tr>
            <td>
              <code>02-login</code>
            </td>
            <td>Logs in with the user just created</td>
            <td>Access token (<code>bru.setVar("token", ...)</code>)</td>
            <td>Status 200, token exists and is a string</td>
          </tr>
          <tr>
            <td>
              <code>03-user-flow</code>
            </td>
            <td>Uses the token for protected endpoints and checks data</td>
            <td>Possibly the id of created resources</td>
            <td>Status 200/201, list contains the created item; without a token gives 401</td>
          </tr>
        </tbody>
      </table>
      <p>
        Note that the whole flow is a <strong>chain</strong>. If 01 fails, 02 and 03 are
        meaningless – which is why a good pipeline stops at the first failure and reports exactly{' '}
        <em>which step</em> went wrong. That makes debugging far easier than guessing from "the whole
        test failed".
      </p>

      <h2>Anatomy of a single Bruno request</h2>
      <p>
        A <code>.bru</code> file is plain text and consists of blocks. Here is the login request:
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
  test("login returns token", function () {
    expect(res.body.accessToken).to.be.a("string");
    expect(res.responseTime).to.be.below(1000);
  });
}`}</CodeBlock>
      <table>
        <thead>
          <tr>
            <th>Block</th>
            <th>Role</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>meta</code>
            </td>
            <td>Name and order (<code>seq</code>) in the folder</td>
            <td>
              <code>seq: 2</code> runs after register
            </td>
          </tr>
          <tr>
            <td>
              <code>post</code> / <code>get</code>
            </td>
            <td>HTTP method, URL and body type</td>
            <td>
              <code>url: {'{{baseUrl}}'}/api/auth/login</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>headers</code>
            </td>
            <td>Request headers, e.g. Content-Type or Authorization</td>
            <td>
              <code>Authorization: Bearer {'{{token}}'}</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>body:json</code>
            </td>
            <td>Payload that is sent</td>
            <td>Email and password from variables</td>
          </tr>
          <tr>
            <td>
              <code>script:pre-request</code>
            </td>
            <td>JavaScript before the request (generate data)</td>
            <td>Unique email with timestamp</td>
          </tr>
          <tr>
            <td>
              <code>script:post-response</code>
            </td>
            <td>JavaScript after the response (store variables)</td>
            <td>
              <code>bru.setVar("token", ...)</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>assert</code>
            </td>
            <td>Declarative checks (short syntax)</td>
            <td>
              <code>res.status: eq 200</code>
            </td>
          </tr>
          <tr>
            <td>
              <code>tests</code>
            </td>
            <td>Free-form JavaScript test with Chai</td>
            <td>
              <code>expect(...).to.be.a("string")</code>
            </td>
          </tr>
        </tbody>
      </table>
      <MermaidDiagram chart={sequenceChart} />
      <p>
        The sequence diagram shows that Bruno is both a <em>client</em> and a <em>test runner</em>: it
        sends the request like a real client, but afterwards it also runs your assertions and stores
        data for the next request. The database is part of the chain – that is exactly what
        distinguishes E2E from a unit test with mocks.
      </p>

      <h2>Running in CI: GitHub Actions + Docker Compose</h2>
      <p>
        Locally you run Bruno in the GUI. In CI you use the CLI (<code>@usebruno/cli</code>). To have
        something to test against, the pipeline starts the whole stack with Docker Compose: the API
        and database are built from the code in the repo, and Bruno runs against{' '}
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

      - name: Wait for the API to be ready
        run: |
          for i in $(seq 1 30); do
            curl -fs http://localhost:8080/health && exit 0
            sleep 2
          done
          echo "API never became ready" && docker compose logs api && exit 1

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Bruno CLI
        run: npm install -g @usebruno/cli

      - name: Run E2E flows
        working-directory: Bruno
        run: bru run E2E-UserFlows --env ci --reporter-html e2e-report.html

      - name: Save report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: bruno-report
          path: Bruno/e2e-report.html

      - name: Stop stack
        if: always()
        run: docker compose down -v`}</CodeBlock>
      <p>
        The pipeline does four things in order: <strong>(1)</strong> builds and starts the stack,{' '}
        <strong>(2)</strong> waits for a health endpoint so Bruno does not start before the API is
        ready (a classic source of flaky tests), <strong>(3)</strong> runs the flows and{' '}
        <strong>(4)</strong> cleans up and saves the report as an artifact – even if the tests fail (
        <code>if: always()</code>). Because <code>bru run</code> returns a non-zero exit code when
        tests fail, the job turns red, and a branch protection rule can block the merge.
      </p>
      <Callout type="tip">
        Give the test user a unique email per run (e.g.{' '}
        <code>test+timestamp@example.com</code> generated in a pre-request script). That way the test
        does not fail simply because the user already exists from the last run.
      </Callout>

      <h2>The PR problem: E2E tests the deployed API, not the PR code</h2>
      <p>
        An important caveat: if the Bruno tests point at an <strong>already deployed</strong> API
        (e.g. the environment on Dokploy) instead of a stack built in the pipeline, they do not test
        what you changed in your pull request. They test the version running today – that is,{' '}
        <code>main</code>. The result is a <em>false green</em> signal: the tests pass, but your new
        code has never been run.
      </p>
      <MermaidDiagram chart={prProblemChart} />
      <Callout type="danger">
        A green E2E check on a PR is only valuable if the code being tested is the PR code.
        Otherwise you risk merging a bug and only discovering it once it is deployed and the tests
        run again.
      </Callout>
      <p>There are several ways to solve it:</p>
      <ul>
        <li>
          <strong>Build the stack in CI (recommended):</strong> Docker Compose in the pipeline builds
          the API from the PR's commit, as shown above.
        </li>
        <li>
          <strong>Preview environments:</strong> Dokploy can create a temporary environment per PR,
          which Bruno then tests against. Requires more setup, but is closest to production.
        </li>
        <li>
          <strong>Run E2E after deploy as a smoke test:</strong> accept that E2E against the deployed
          environment is a <em>post-deploy</em> check, not a PR gate, and use unit/integration tests
          as the PR gate.
        </li>
      </ul>

      <h2>Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Topic</th>
            <th>The most important thing to remember</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>The test pyramid</td>
            <td>Many unit, some integration, few E2E – balance between speed and realism</td>
          </tr>
          <tr>
            <td>API test / E2E</td>
            <td>Test the contract from the outside via real HTTP requests and whole flows</td>
          </tr>
          <tr>
            <td>Bruno</td>
            <td>File-based, Git-friendly, scripting in JS, CLI for CI</td>
          </tr>
          <tr>
            <td>E2E-UserFlows</td>
            <td>01 register → 02 login (store token) → 03 user flow with auth</td>
          </tr>
          <tr>
            <td>Request anatomy</td>
            <td>meta, method/URL, headers, body, scripts, assert, tests</td>
          </tr>
          <tr>
            <td>CI</td>
            <td>GitHub Actions starts Docker Compose, waits for health, runs <code>bru run</code></td>
          </tr>
          <tr>
            <td>The PR trap</td>
            <td>Testing against the deployed API does not test the PR code – build the stack in the pipeline</td>
          </tr>
        </tbody>
      </table>
    </LessonLayout>
  )
}
