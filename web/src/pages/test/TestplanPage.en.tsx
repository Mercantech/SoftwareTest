import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import ConceptStack from '../../components/ConceptStack'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import PlanSectionGrid from '../../components/PlanSectionGrid'
import RiskMatrix from '../../components/RiskMatrix'
import TraceabilityBoard from '../../components/TraceabilityBoard'
import WorkshopPanel from '../../components/WorkshopPanel'
import { getObjectiveByPath } from '../../data/objectives'

const processFlow = `
flowchart LR
  A["Analyze requirements"] --> B["Define scope and approach"]
  B --> C["Design test cases"]
  C --> D["Estimate and plan"]
  D --> E["Execute tests"]
  E --> F["Report"]
  F --> G{"Exit criteria<br/>met?"}
  G -- No --> E
  G -- Yes --> H["Finish / release"]
`

const testCaseCsharp = `
public class LoginTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public LoginTests(WebApplicationFactory<Program> factory)
        => _client = factory.CreateClient();

    // TC-01 (REQ-01): valid login gives 200 and a token
    [Fact]
    public async Task TC01_ValidLogin_Returns200AndToken()
    {
        var resp = await _client.PostAsJsonAsync("/api/login",
            new { email = "anna@test.dk", password = "Secret123!" });

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var body = await resp.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.False(string.IsNullOrWhiteSpace(body!.Token));
    }

    // TC-02 (REQ-01): wrong password gives 401 and no token
    [Fact]
    public async Task TC02_WrongPassword_Returns401()
    {
        var resp = await _client.PostAsJsonAsync("/api/login",
            new { email = "anna@test.dk", password = "wrong" });

        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    // TC-03 (REQ-01): account locks after 5 failed attempts
    [Fact]
    public async Task TC03_FiveFailedAttempts_LocksAccount()
    {
        for (var i = 0; i < 5; i++)
            await _client.PostAsJsonAsync("/api/login",
                new { email = "bo@test.dk", password = "wrong" });

        var resp = await _client.PostAsJsonAsync("/api/login",
            new { email = "bo@test.dk", password = "CorrectPass1!" });

        Assert.Equal(HttpStatusCode.Locked, resp.StatusCode); // 423
    }
}
`

export default function TestplanPageEn() {
  const objective = getObjectiveByPath('/test/testplan')

  return (
    <LessonLayout module="test">
      <header>
        {objective ? (
          <p>
            <ObjectiveBadge level={objective.level} /> <strong>Objective {objective.id}</strong>
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

      <h1>Test plan for functional requirements</h1>

      <p>
        A test plan is the document that answers the questions: <em>What is to be tested? How? By
        whom? When? And when are we done?</em> Without a plan, testing becomes random, and nobody
        can say whether the system is covered. With a plan, testing becomes traceable, estimable and
        can be discussed with the customer.
      </p>

      <h2>Learning objectives</h2>
      <ul>
        <li>Build a test plan following the IEEE 829 / ISO 29119 structure.</li>
        <li>Turn functional requirements into concrete, measurable test cases.</li>
        <li>Set up traceability between requirements and tests.</li>
        <li>Define exit criteria and identify test risks.</li>
        <li>Use a test case template and write test cases as automated tests.</li>
      </ul>

      <h2>1. Test plan, test strategy and test case — the concepts</h2>
      <ConceptStack
        ariaLabel="Hierarchy for test planning"
        caption="From broad organisation to a single scenario — each layer answers different questions:"
        items={[
          {
            id: 'strategy',
            title: 'Test strategy',
            level: 'Organization / product',
            body: 'Overall principles: degree of automation, tools and risk approach across projects.',
          },
          {
            id: 'plan',
            title: 'Test plan',
            level: 'Project / release',
            body: 'Scope, resources, schedule, approach and criteria for this particular release.',
          },
          {
            id: 'design',
            title: 'Test design',
            level: 'Feature',
            body: 'Which techniques and conditions cover the feature — equivalence, boundaries, decision tables.',
          },
          {
            id: 'case',
            title: 'Test case',
            level: 'Single scenario',
            body: 'Preconditions, steps, input and expected result for one concrete scenario.',
          },
          {
            id: 'report',
            title: 'Test report',
            level: 'After execution',
            body: 'Results, defects, coverage and a recommendation (go / no-go) for the release.',
          },
        ]}
      />

      <h2>2. The test process</h2>
      <p>
        The process is a <strong>loop</strong>: if exit criteria are not met, you go back to
        execution — not on to release.
      </p>
      <MermaidDiagram chart={processFlow} />
      <p>
        Planning is <strong>iterative</strong>: in agile teams the plan is updated every sprint, but
        the same questions are answered. A lightweight one-page test plan is better than a perfect
        40-page plan that nobody reads.
      </p>

      <h2>3. IEEE-inspired structure</h2>
      <PlanSectionGrid
        ariaLabel="IEEE test plan sections"
        lead="IEEE 829 / ISO 29119-3 as a checklist. Highlighted fields are the ones teams most often forget — and the ones that create the most value when they are in place."
        items={[
          {
            id: 'id',
            title: 'Test plan ID and version',
            body: 'TP-WEBSHOP-1.2, author, date, approver.',
          },
          {
            id: 'intro',
            title: 'Introduction',
            body: 'Purpose, background, references (requirements spec, design doc).',
          },
          {
            id: 'items',
            title: 'Test items',
            body: 'Build 1.2.0, API v1, React frontend, PostgreSQL 16 — concrete versions.',
          },
          {
            id: 'in',
            title: 'Features to be tested',
            body: 'Login, Create order, Payment, Order history.',
            emphasis: 'scope',
          },
          {
            id: 'out',
            title: 'Features NOT to be tested',
            body: 'Admin reports (v1.3), 3rd-party payment page. Visible risk > hidden risk.',
            emphasis: 'scope',
          },
          {
            id: 'approach',
            title: 'Approach (strategy)',
            body: 'Unit + integration, E2E via Bruno, exploratory payment test, ZAP in CI.',
          },
          {
            id: 'passfail',
            title: 'Pass/fail criteria',
            body: 'A test case passes when the actual result equals the expected result.',
          },
          {
            id: 'suspend',
            title: 'Suspension / resumption',
            body: 'Stop on a blocker in login; resume after hotfix + smoke.',
          },
          {
            id: 'deliverables',
            title: 'Deliverables',
            body: 'Test cases, test report, defect list, coverage report.',
          },
          {
            id: 'env',
            title: 'Test environment',
            body: 'Docker Compose: web, api, db; seed data; test SMTP.',
          },
          {
            id: 'roles',
            title: 'Responsibilities / resources',
            body: 'QA: Anna, Dev: Bo, Product owner: Carla.',
          },
          {
            id: 'schedule',
            title: 'Schedule',
            body: 'Sprint 14: design week 1, execution week 2, regression week 3.',
          },
          {
            id: 'risks',
            title: 'Risks and mitigation',
            body: 'See the risk matrix below — score = likelihood × impact.',
            emphasis: 'risk',
          },
          {
            id: 'exit',
            title: 'Exit criteria',
            body: 'Objective conditions for stopping. Without them, “done” is a feeling.',
            emphasis: 'exit',
          },
          {
            id: 'approvals',
            title: 'Approvals',
            body: 'Signatures / formal acceptance from stakeholders.',
          },
        ]}
      />

      <div className="info-tiles">
        <article className="info-tile">
          <h3>Scope</h3>
          <p>
            Both what is <strong>included</strong> and what is <strong>deliberately excluded</strong>.
            &ldquo;Not tested: 3rd-party payment page&rdquo; makes the risk visible.
          </p>
        </article>
        <article className="info-tile">
          <h3>Test items</h3>
          <p>
            Build number, commit hash, container image tag. Without version information the plan
            cannot be repeated.
          </p>
        </article>
        <article className="info-tile">
          <h3>Approach</h3>
          <p>
            Business logic with unit tests (xUnit), API with integration (
            <Link to="/test/integration">WebApplicationFactory</Link>), critical flows with E2E
            (Bruno). See also <Link to="/test/metodikker">methodologies</Link>.
          </p>
        </article>
        <article className="info-tile">
          <h3>Exit criteria</h3>
          <p>
            100% must-have executed, ≥ 95% pass, no critical defects, green regression in CI, p95
            &lt; 500 ms at 100 users.
          </p>
        </article>
      </div>

      <h2>Risk matrix</h2>
      <p>
        You cannot test everything. Score = <strong>likelihood × impact</strong> (1–5). Click a
        risk for mitigation — or dial the numbers yourself and see where you land in the matrix:
      </p>
      <RiskMatrix
        ariaLabel="Test risks in a likelihood × impact matrix"
        likelihoodLabel="Likelihood"
        impactLabel="Impact"
        emptyLabel="Select a risk in the matrix"
        scoreLabel="Risk score"
        mitigationLabel="Mitigation"
        tryLabel="Try it: place a risk"
        tryHint="Pick likelihood and impact — the matrix cell highlights, and you see the priority."
        priorityHint="High priority — test deeply|Medium — cover with automation|Low — spot-check"
        risks={[
          {
            id: 'env',
            title: 'Env not ready on time',
            likelihood: 3,
            impact: 5,
            mitigation: 'Docker Compose environment in the repo; automatic setup.',
          },
          {
            id: 'reqs',
            title: 'Requirements change mid-sprint',
            likelihood: 5,
            impact: 3,
            mitigation: 'Short plans; regression suite; change control.',
          },
          {
            id: 'people',
            title: 'Key people are sick',
            likelihood: 2,
            impact: 5,
            mitigation: 'Document test cases; pair programming.',
          },
          {
            id: 'flaky',
            title: 'Flaky E2E hide defects',
            likelihood: 3,
            impact: 3,
            mitigation: 'Quarantine rules, fixed test data, retry policy.',
          },
          {
            id: 'api',
            title: 'External API down',
            likelihood: 3,
            impact: 3,
            mitigation: 'Mock/stub (WireMock) and contract tests.',
          },
        ]}
      />
      <p>
        Example: the payment flow (3 × 5 = 15) is prioritized over &ldquo;change profile
        picture&rdquo; (2 × 1 = 2). The matrix makes that prioritization visible to the whole team.
      </p>

      <h2>4. From functional requirements to test cases</h2>
      <p>
        A functional requirement describes <strong>what the system must do</strong>. A good
        requirement is <em>testable</em>: you can determine unambiguously whether it has been met.
      </p>

      <Callout type="warn">
        <strong>Untestable requirement:</strong> &ldquo;The system must be user-friendly and
        fast.&rdquo; <br />
        <strong>Testable requirement:</strong> &ldquo;When the user enters a correct email and
        password, they must be taken to the front page within 2 seconds.&rdquo;
      </Callout>

      <h3>Step-by-step technique</h3>
      <ol>
        <li>Give each requirement a unique ID (REQ-01).</li>
        <li>Find acceptance criteria (Given/When/Then, if you use BDD).</li>
        <li>
          Apply test design techniques (see <Link to="/test/metodikker">Methodologies</Link>):
          equivalence classes, boundary values, decision tables, state diagrams.
        </li>
        <li>Write at least one positive and one negative test case per requirement.</li>
        <li>Add those tests to a traceability matrix.</li>
      </ol>

      <h3>Traceability board</h3>
      <p>Click a requirement to see which test cases cover it:</p>
      <TraceabilityBoard
        ariaLabel="Traceability between requirements and test cases"
        requirementsLabel="Requirements"
        testCasesLabel="Test cases"
        hintLabel="Select a requirement on the left — linked test cases light up on the right."
        requirements={[
          {
            id: 'REQ-01',
            label: 'Login',
            testCaseIds: ['TC-01', 'TC-02', 'TC-03', 'TC-04', 'TC-05', 'TC-06'],
          },
          {
            id: 'REQ-02',
            label: 'Create order',
            testCaseIds: ['TC-04b', 'TC-05b', 'TC-06b'],
          },
        ]}
        testCases={[
          { id: 'TC-01', label: 'Valid login', type: 'Positive' },
          { id: 'TC-02', label: 'Wrong password', type: 'Negative' },
          { id: 'TC-03', label: 'Account locked', type: 'Boundary' },
          { id: 'TC-04', label: 'Unknown email', type: 'Security' },
          { id: 'TC-05', label: 'Empty fields', type: 'Negative' },
          { id: 'TC-06', label: 'SQL injection', type: 'Security' },
          { id: 'TC-04b', label: 'Valid order', type: 'Positive' },
          { id: 'TC-05b', label: 'Empty cart', type: 'Negative' },
          { id: 'TC-06b', label: 'Negative quantity', type: 'Boundary' },
        ]}
      />

      <h3>Example: login requirement → test cases</h3>
      <p>
        <strong>REQ-01:</strong> &ldquo;A registered user can log in with email and password. After
        5 failed attempts the account is locked for 15 minutes.&rdquo;
      </p>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Requirement</th>
            <th>Scenario</th>
            <th>Input</th>
            <th>Expected</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TC-01</td>
            <td>REQ-01</td>
            <td>Valid login</td>
            <td>anna@test.dk / correct</td>
            <td>200 + token</td>
            <td>Positive</td>
          </tr>
          <tr>
            <td>TC-02</td>
            <td>REQ-01</td>
            <td>Wrong password</td>
            <td>anna@test.dk / wrong</td>
            <td>401, no token, generic error message</td>
            <td>Negative</td>
          </tr>
          <tr>
            <td>TC-03</td>
            <td>REQ-01</td>
            <td>Account is locked</td>
            <td>5 × wrong, then correct</td>
            <td>423 Locked</td>
            <td>Boundary</td>
          </tr>
          <tr>
            <td>TC-04</td>
            <td>REQ-01</td>
            <td>Unknown email</td>
            <td>unknown@test.dk / x</td>
            <td>401 (same response as TC-02 — no user enumeration)</td>
            <td>Security</td>
          </tr>
          <tr>
            <td>TC-05</td>
            <td>REQ-01</td>
            <td>Empty fields</td>
            <td>&quot;&quot; / &quot;&quot;</td>
            <td>400 with validation error</td>
            <td>Negative</td>
          </tr>
          <tr>
            <td>TC-06</td>
            <td>REQ-01</td>
            <td>SQL injection in email</td>
            <td>
              <code>&apos; OR 1=1 --</code>
            </td>
            <td>401/400, no database error</td>
            <td>Security</td>
          </tr>
        </tbody>
      </table>

      <WorkshopPanel
        storageKey="softwaretest-workshop-testplan-en"
        requirementId="REQ-01"
        requirementText="A registered user can log in with email and password. After 5 failed attempts the account is locked for 15 minutes."
        labels={{
          title: 'Workshop: build coverage for login',
          lead: 'Pick scenarios — watch test cases and traceability appear. Tick exit criteria when you agree.',
          pickScenarios: 'Pick scenarios to cover',
          selected: 'Selected',
          coverage: 'Coverage',
          of: 'of',
          testCases: 'Your test cases',
          checklistTitle: 'Exit criteria checklist',
          reset: 'Reset',
          input: 'Input',
          expected: 'Expected',
          type: 'Type',
        }}
        scenarios={[
          {
            id: 'valid',
            title: 'Valid login',
            type: 'Positive',
            input: 'anna@test.dk / Secret123!',
            expected: '200 + token',
            tcId: 'TC-01',
          },
          {
            id: 'wrong',
            title: 'Wrong password',
            type: 'Negative',
            input: 'anna@test.dk / wrong',
            expected: '401, no token',
            tcId: 'TC-02',
          },
          {
            id: 'lock',
            title: 'Account locked',
            type: 'Boundary',
            input: '5 × wrong, then correct',
            expected: '423 Locked',
            tcId: 'TC-03',
          },
          {
            id: 'sqli',
            title: 'SQL injection',
            type: 'Security',
            input: "' OR 1=1 --",
            expected: '401/400, no DB error',
            tcId: 'TC-06',
          },
        ]}
        checklist={[
          {
            id: 'must',
            label: '100% of must-have test cases are executed, and ≥ 95% pass',
          },
          {
            id: 'sev',
            label: 'No open defects of severity critical or high',
          },
          {
            id: 'ci',
            label: 'All regression tests are green in CI on the release commit',
          },
          {
            id: 'perf',
            label: 'Performance: p95 < 500 ms at 100 concurrent users',
          },
        ]}
      />

      <h3>Test cases as automated code</h3>
      <p>
        Each row in the table can become a test. Note the naming with TC-ID and requirement ID,
        which gives traceability directly in the test results:
      </p>
      <CodeBlock language="csharp">{testCaseCsharp}</CodeBlock>

      <h2>5. Test case template</h2>
      <p>Copy the table and fill it in for each test case:</p>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ID</td>
            <td>Unique ID</td>
            <td>TC-014</td>
          </tr>
          <tr>
            <td>Title</td>
            <td>Short and descriptive</td>
            <td>Creating an order with an empty cart is rejected</td>
          </tr>
          <tr>
            <td>Requirement ref.</td>
            <td>Which requirement is covered</td>
            <td>REQ-02</td>
          </tr>
          <tr>
            <td>Priority</td>
            <td>Must / Should / Could (or risk score)</td>
            <td>Must</td>
          </tr>
          <tr>
            <td>Preconditions</td>
            <td>Environment, data, state</td>
            <td>User is logged in; cart is empty</td>
          </tr>
          <tr>
            <td>Steps</td>
            <td>Numbered actions</td>
            <td>1. POST /api/orders with an empty line list</td>
          </tr>
          <tr>
            <td>Test data</td>
            <td>Concrete input</td>
            <td>{`{ "lines": [] }`}</td>
          </tr>
          <tr>
            <td>Expected result</td>
            <td>Precise and measurable</td>
            <td>400, error code EMPTY_CART</td>
          </tr>
          <tr>
            <td>Actual result</td>
            <td>Filled in at execution</td>
            <td>—</td>
          </tr>
          <tr>
            <td>Status</td>
            <td>Pass / Fail / Blocked / Not run</td>
            <td>Not run</td>
          </tr>
          <tr>
            <td>Automated?</td>
            <td>Yes/no + location in the code</td>
            <td>Yes — OrdersApiTests.TC014</td>
          </tr>
        </tbody>
      </table>

      <Callout type="tip">
        Keep the test plan in the repo as Markdown next to the code. That way it is version
        controlled, can be reviewed in pull requests and follows the release — exactly like the
        code.
      </Callout>

      <h2>6. Reporting</h2>
      <p>
        After execution, a short test report is produced: number of tests planned/run/passed/
        failed/blocked, open defects per severity, deviations from the plan, and a recommendation
        (go/no-go). It is input to the{' '}
        <Link to="/test/release">release decision</Link>.
      </p>

      <h2>Exercise</h2>
      <ol>
        <li>
          Take these two requirements: <em>&ldquo;The user can put items in a cart (max 20 per
          item)&rdquo;</em> and <em>&ldquo;The user can search for items by name&rdquo;</em>.
        </li>
        <li>Give them IDs and formulate acceptance criteria as Given/When/Then.</li>
        <li>
          Write at least 5 test cases per requirement in the template above (incl. boundary value
          20/21 and empty search).
        </li>
        <li>Draw the traceability diagram (requirement → test cases).</li>
        <li>
          Write a short test plan document (1 page) with scope, approach, exit criteria and three
          risks.
        </li>
        <li>Implement two of the test cases as xUnit tests.</li>
      </ol>
    </LessonLayout>
  )
}
