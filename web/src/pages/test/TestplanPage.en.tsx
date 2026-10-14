import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
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

const traceability = `
flowchart LR
  R1["REQ-01<br/>Login"] --> TC1["TC-01 valid login"]
  R1 --> TC2["TC-02 wrong password"]
  R1 --> TC3["TC-03 locked account"]
  R2["REQ-02<br/>Create order"] --> TC4["TC-04 valid order"]
  R2 --> TC5["TC-05 empty cart"]
  R2 --> TC6["TC-06 negative quantity"]
`

const planSkeleton = `
# Test plan: WebShop v1.2         (after IEEE 829 / ISO/IEC/IEEE 29119-3)

1. Test plan ID and version      TP-WEBSHOP-1.2, author, date, approver
2. Introduction                  Purpose, background, references (requirements spec, design doc)
3. Test items                    Build 1.2.0, API v1, React frontend, PostgreSQL 16
4. Features to be tested         Login, Create order, Payment, Order history
5. Features NOT to be tested     Admin reports (postponed to v1.3), 3rd-party payment page
6. Approach (strategy)           Unit + integration automated, E2E via Bruno,
                                 exploratory testing of payment flow, ZAP baseline in CI
7. Pass/fail criteria            A test case passes when actual = expected result
8. Suspension / resumption       Stop on a blocker in login; resume after hotfix + smoke
9. Deliverables                  Test cases, test report, defect list, coverage report
10. Test environment             Docker Compose: web, api, db; seed data; test SMTP
11. Responsibilities/resources   QA: Anna, Dev: Bo, Product owner: Carla
12. Schedule                     Sprint 14: design week 1, execution week 2, regression week 3
13. Risks and mitigation         See risk table
14. Exit criteria                See section below
15. Approvals                    Signatures
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

    // TC-03 (REQ-01): account is locked after 5 failed attempts
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
      <table>
        <thead>
          <tr>
            <th>Concept</th>
            <th>Level</th>
            <th>Content</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Test strategy</td>
            <td>Organization/product</td>
            <td>Overall principles: degree of automation, tools, risk approach</td>
          </tr>
          <tr>
            <td>Test plan</td>
            <td>Project/release</td>
            <td>Scope, resources, schedule, approach, criteria for this particular release</td>
          </tr>
          <tr>
            <td>Test design/specification</td>
            <td>Feature</td>
            <td>Which techniques and conditions cover the feature</td>
          </tr>
          <tr>
            <td>Test case</td>
            <td>Single scenario</td>
            <td>Preconditions, steps, input, expected result</td>
          </tr>
          <tr>
            <td>Test report</td>
            <td>After execution</td>
            <td>Results, defects, coverage, recommendation</td>
          </tr>
        </tbody>
      </table>

      <h2>2. The test process</h2>
      <MermaidDiagram chart={processFlow} />
      <p>
        Planning is <strong>iterative</strong>: in agile teams the plan is updated every sprint, but
        the same questions are answered. A lightweight one-page test plan is better than a perfect
        40-page plan that nobody reads.
      </p>

      <h2>3. IEEE-inspired structure</h2>
      <p>
        IEEE 829 (superseded by ISO/IEC/IEEE 29119-3) describes a standardized table of contents. It
        gives you a checklist so nothing important is forgotten. Template:
      </p>
      <CodeBlock language="text">{planSkeleton}</CodeBlock>

      <h3>Scope (delimitation)</h3>
      <p>
        Scope is both what is <strong>included</strong> and what is <strong>deliberately
        excluded</strong>. Writing &ldquo;not tested: 3rd-party payment page&rdquo; is important
        communication to stakeholders — it makes the risk visible instead of hidden.
      </p>

      <h3>Test items</h3>
      <p>
        Concrete versions: build number, commit hash, container image tag. A test plan without
        version information cannot be repeated.
      </p>

      <h3>Approach</h3>
      <p>
        Describe test levels, techniques and tools: &ldquo;Business logic is tested with unit tests
        (xUnit), the API with integration tests (WebApplicationFactory), critical flows with E2E
        (Bruno), and the payment flow with exploratory testing.&rdquo; Link to the pages{' '}
        <Link to="/test/metodikker">Testing methodologies</Link> and{' '}
        <Link to="/test/integration">Integration testing</Link>.
      </p>

      <h3>Test cases</h3>
      <p>
        The test cases themselves can live in a tool (Jira/Xray, TestRail, Notion) or — best for
        automated tests — as code in the repo, with test names that refer to requirement IDs.
      </p>

      <h3>Exit criteria</h3>
      <p>Objective conditions for the test phase to be completed. Examples:</p>
      <ul>
        <li>100% of must-have test cases are executed, and ≥ 95% pass.</li>
        <li>No open defects of severity <em>critical</em> or <em>high</em>.</li>
        <li>All regression tests are green in CI on the release commit.</li>
        <li>Code coverage for business logic ≥ 80% (as a signal, not a goal — see{' '}
          <Link to="/test/release">Release</Link>).</li>
        <li>Performance: p95 &lt; 500 ms at 100 concurrent users.</li>
      </ul>

      <h3>Risks</h3>
      <table>
        <thead>
          <tr>
            <th>Risk</th>
            <th>Likelihood</th>
            <th>Impact</th>
            <th>Mitigation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Test environment not ready on time</td>
            <td>Medium</td>
            <td>High</td>
            <td>Docker Compose environment in the repo; automatic setup</td>
          </tr>
          <tr>
            <td>Requirements change mid-sprint</td>
            <td>High</td>
            <td>Medium</td>
            <td>Short plans; regression suite; requirement changes under change control</td>
          </tr>
          <tr>
            <td>Key people are sick</td>
            <td>Low</td>
            <td>High</td>
            <td>Document test cases; pair programming</td>
          </tr>
          <tr>
            <td>Flaky E2E tests hide real defects</td>
            <td>Medium</td>
            <td>Medium</td>
            <td>Quarantine rules, fixed test data, retry policy</td>
          </tr>
          <tr>
            <td>External API unavailable</td>
            <td>Medium</td>
            <td>Medium</td>
            <td>Mock/stub (e.g. WireMock) and contract tests</td>
          </tr>
        </tbody>
      </table>

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

      <MermaidDiagram chart={traceability} />

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

      <h2>6. Prioritizing with risk</h2>
      <p>
        You cannot test everything. Give each feature a <strong>risk score = likelihood ×
        impact</strong> (e.g. 1–5 each) and spend the most time on the highest scores. The payment
        flow (likelihood 3 × impact 5 = 15) is prioritized over &ldquo;change profile picture&rdquo;
        (2 × 1 = 2).
      </p>

      <Callout type="tip">
        Keep the test plan in the repo as Markdown next to the code. That way it is version
        controlled, can be reviewed in pull requests and follows the release — exactly like the
        code.
      </Callout>

      <h2>7. Reporting</h2>
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
