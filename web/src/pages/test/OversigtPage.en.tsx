import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import Figure from '../../components/Figure'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'
import Split from '../../components/Split'

const pyramid = `
flowchart TB
  E2E["E2E / UI tests<br/>few, slow, expensive"]
  INT["Integration tests<br/>some, medium speed"]
  UNIT["Unit tests<br/>many, fast, cheap"]
  E2E --> INT --> UNIT
  style E2E fill:#7f1d1d,stroke:#f87171,color:#fff
  style INT fill:#78350f,stroke:#fbbf24,color:#fff
  style UNIT fill:#14532d,stroke:#4ade80,color:#fff
`

const typeMap = `
flowchart LR
  T["Software testing"] --> F["Functional testing<br/>Does the system do the right thing?"]
  T --> NF["Non-functional testing<br/>Does it do it well enough?"]
  F --> U["Unit"]
  F --> I["Integration"]
  F --> S["System / E2E"]
  F --> A["Acceptance (UAT)"]
  F --> R["Regression / Smoke"]
  NF --> P["Performance / Load"]
  NF --> SEC["Security"]
  NF --> UX["UX / Usability"]
  NF --> ACC["Accessibility"]
`

const flow = `
flowchart LR
  K["Requirements"] --> P["Test plan"]
  P --> M["Methodologies"]
  M --> U["Unit"]
  M --> I["Integration"]
  M --> E["E2E (Bruno)"]
  U --> C["CI/CD"]
  I --> C
  E --> C
  C --> R["Release decision"]
  R --> T["Load / Performance / UX / Security"]
`

const aaaExample = `
// The smallest example of a functional test in xUnit (the AAA pattern)
public class PriceCalculatorTests
{
    [Fact]
    public void Discount_OverHundred_Gives10Percent()
    {
        // Arrange - set up the preconditions
        var calculator = new PriceCalculator();

        // Act - perform the action
        var price = calculator.WithDiscount(subtotal: 200m);

        // Assert - verify the expected result
        Assert.Equal(180m, price);
    }
}
`

export default function OversigtPageEn() {

  return (
    <LessonLayout module="test">

<h1>Testing — overview: defect testing, functional testing and web security</h1>

      <p>
        This page is the <strong>map</strong> of the whole testing module. It gives you an overview
        of which types of tests exist, how they fit together, and how web security fits in as a
        special kind of non-functional testing. The other pages dive into the details.
      </p>

      <h2>Learning objectives</h2>
      <p>After reading this page, you can:</p>
      <ul>
        <li>
          explain the difference between <strong>defect testing</strong> (finding defects) and{' '}
          <strong>functional testing</strong> (verifying requirements),
        </li>
        <li>place unit, integration, system and acceptance tests in the test pyramid,</li>
        <li>distinguish between functional and non-functional tests,</li>
        <li>
          name the central security topics that a web developer must be able to test and prevent,
          and
        </li>
        <li>navigate the site, so you know where to read next.</li>
      </ul>

      <h2>1. Why do we test?</h2>
      <p>
        Software contains bugs. It is not a question of <em>whether</em>, but of <em>how many</em>{' '}
        and <em>how expensive they are</em>. Testing is the systematic activity that uncovers the
        difference between what the system <em>actually</em> does and what it <em>should</em> do.
        Testing can never prove that there are no bugs (Dijkstra: &ldquo;testing shows the presence,
        not the absence of bugs&rdquo;) — but it can build confidence and reduce risk.
      </p>
      <p>
        The cost of a bug typically grows dramatically the later it is discovered: a bug found by a
        developer's unit test costs minutes; the same bug found by a customer in production can cost
        days, data, money and reputation.
      </p>

      <h3>The seven classic testing principles (ISTQB)</h3>
      <ol>
        <li>Testing shows the presence of defects, not their absence.</li>
        <li>Exhaustive testing is impossible — we prioritize based on risk.</li>
        <li>Early testing saves time and money (&ldquo;shift left&rdquo;).</li>
        <li>Defects cluster together (Pareto: roughly 80% of the defects in 20% of the code).</li>
        <li>The pesticide paradox: the same tests eventually find no new bugs.</li>
        <li>Testing depends on context — a banking app is tested differently than a game.</li>
        <li>&ldquo;No defects found&rdquo; is a fallacy if the system does not fulfil the need.</li>
      </ol>

      <h2>2. Defect testing vs. functional testing</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Defect testing</th>
            <th>Functional testing (validation)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Goal</td>
            <td>Find defects — try to make the system fail</td>
            <td>Show that the requirements are met</td>
          </tr>
          <tr>
            <td>Mindset</td>
            <td>&ldquo;How can I break it?&rdquo;</td>
            <td>&ldquo;Does it do what was agreed?&rdquo;</td>
          </tr>
          <tr>
            <td>Typical input</td>
            <td>Invalid, boundary values, empty, huge, malicious</td>
            <td>Valid scenarios from requirements and user stories</td>
          </tr>
          <tr>
            <td>Example</td>
            <td>Enter <code>&apos; OR 1=1 --</code> in the login field</td>
            <td>A user with correct login gets to the front page</td>
          </tr>
          <tr>
            <td>Derived from</td>
            <td>Experience, risk analysis, defect patterns</td>
            <td>Requirements specification, acceptance criteria</td>
          </tr>
        </tbody>
      </table>
      <p>
        In practice the two complement each other: functional tests protect what we already know
        must work, while defect testing (e.g. exploratory testing and negative test cases) looks for
        what nobody has thought of.
      </p>

      <h2>3. Map of test types</h2>
      <MermaidDiagram chart={typeMap} />

      <h3>Functional tests</h3>
      <ul>
        <li>
          <strong>Unit test</strong> — a single method/class in isolation. Fast and precise. See{' '}
          <Link to="/test/unit">Unit testing</Link>.
        </li>
        <li>
          <strong>Integration test</strong> — several components together (API + database, service +
          service). See <Link to="/test/integration">Integration testing</Link>.
        </li>
        <li>
          <strong>System test / E2E</strong> — the whole system seen from the outside, e.g. via HTTP
          or a browser. See <Link to="/test/bruno-e2e">Bruno and E2E</Link>.
        </li>
        <li>
          <strong>Acceptance test (UAT)</strong> — the customer/user decides whether the solution is
          &ldquo;good enough&rdquo; to be taken into use.
        </li>
        <li>
          <strong>Smoke and regression tests</strong> — a quick sanity check and &ldquo;has anything
          broken?&rdquo;. See <Link to="/test/metodikker">Testing methodologies</Link>.
        </li>
      </ul>

      <h3>Non-functional tests</h3>
      <ul>
        <li>
          <strong>Performance</strong> — speed and stability under load. See{' '}
          <Link to="/test/performance">Performance</Link>.
        </li>
        <li>
          <strong>Security testing</strong> — resistance to attacks (see section 5).
        </li>
        <li>
          <strong>Usability/UX testing</strong> — how easy and pleasant it is to use. See{' '}
          <Link to="/test/ux">UX testing</Link>.
        </li>
        <li>
          <strong>Compatibility</strong> — browsers, devices, OS, screen sizes.
        </li>
        <li>
          <strong>Accessibility</strong> — can users with disabilities use the solution (WCAG).
        </li>
      </ul>

      <h2>4. The test pyramid</h2>
      <Split
        mediaFirst
        media={
          <Figure
            src="/images/commons/testing-pyramid.png"
            alt="Test pyramid with many unit tests at the base and few end-to-end tests at the top"
            caption="The test pyramid: many unit tests, fewer integration tests, few E2E tests"
            sourceUrl="https://commons.wikimedia.org/wiki/File:Testing_Pyramid.png"
            sourceLabel="Wikimedia Commons"
            size="sm"
          />
        }
      >
        <p>
          Mike Cohn&apos;s test pyramid is a rule of thumb for the <em>distribution</em> of automated
          tests. The higher up, the more realistic — but also the slower, more brittle and more
          expensive to maintain.
        </p>
        <MermaidDiagram chart={pyramid} />
      </Split>

      <table>
        <thead>
          <tr>
            <th>Layer</th>
            <th>Speed</th>
            <th>Cost/maintenance</th>
            <th>Fault localization</th>
            <th>Realism</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unit</td>
            <td>Milliseconds</td>
            <td>Low</td>
            <td>Precise (one method)</td>
            <td>Low</td>
          </tr>
          <tr>
            <td>Integration</td>
            <td>Seconds</td>
            <td>Medium</td>
            <td>A couple of components</td>
            <td>Medium</td>
          </tr>
          <tr>
            <td>E2E</td>
            <td>Seconds–minutes</td>
            <td>High</td>
            <td>Unclear (the whole stack)</td>
            <td>High</td>
          </tr>
        </tbody>
      </table>

      <Callout type="warn">
        <strong>Anti-pattern: the ice cream cone.</strong> Many manual and E2E tests, few unit
        tests. It gives slow feedback, flaky tests and a high maintenance burden. Aim for a broad
        base of fast tests.
      </Callout>

      <h3>AAA — a common template for all layers</h3>
      <p>
        Regardless of layer, a good automated test follows the pattern <strong>Arrange – Act –
        Assert</strong>. It makes the test readable and focused on one thing.
      </p>
      <CodeBlock language="csharp">{aaaExample}</CodeBlock>

      <h2>5. Introduction to web security</h2>
      <p>
        Security testing is a non-functional form of testing: a system can fulfil all functional
        requirements and still be open to attack. A web application is particularly exposed because
        it is accessible from the internet and handles input from unknown parties. Security is not a
        layer you &ldquo;bolt on at the end&rdquo; — it must be built into design, code, testing and
        operations (<em>security by design</em>).
      </p>

      <h3>The CIA triad</h3>
      <ul>
        <li>
          <strong>Confidentiality</strong> — only authorized users see data.
        </li>
        <li>
          <strong>Integrity</strong> — data is only changed in legitimate ways.
        </li>
        <li>
          <strong>Availability</strong> — the system is up when it needs to be used.
        </li>
      </ul>

      <h3>Security topics on this site</h3>
      <table>
        <thead>
          <tr>
            <th>Topic</th>
            <th>Core idea</th>
            <th>Read more</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Encryption</td>
            <td>Protect data in transit (TLS/SSL) and at rest</td>
            <td>
              <Link to="/sikkerhed/kryptering">/sikkerhed/kryptering</Link>
            </td>
          </tr>
          <tr>
            <td>Standards</td>
            <td>OWASP Top 10, CVE/CWE, known vulnerabilities</td>
            <td>
              <Link to="/sikkerhed/standarder">/sikkerhed/standarder</Link>
            </td>
          </tr>
          <tr>
            <td>Authentication</td>
            <td>Who are you? OAuth2/OIDC, JWT, MFA</td>
            <td>
              <Link to="/sikkerhed/authentication">/sikkerhed/authentication</Link>
            </td>
          </tr>
          <tr>
            <td>Hashing</td>
            <td>Store passwords securely (bcrypt/Argon2, not MD5)</td>
            <td>
              <Link to="/sikkerhed/hashing">/sikkerhed/hashing</Link>
            </td>
          </tr>
          <tr>
            <td>Attacks</td>
            <td>SQL injection, XSS, CSRF and others, and defenses</td>
            <td>
              <Link to="/sikkerhed/angreb">/sikkerhed/angreb</Link>
            </td>
          </tr>
          <tr>
            <td>Security tools</td>
            <td>OWASP ZAP, Burp, SAST/DAST, dependency scanning</td>
            <td>
              <Link to="/sikkerhed/tools">/sikkerhed/tools</Link>
            </td>
          </tr>
          <tr>
            <td>GDPR and cookies</td>
            <td>Controller, principles, consent, privacy and cookie policy</td>
            <td>
              <Link to="/sikkerhed/gdpr">/sikkerhed/gdpr</Link>
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Security as a testable requirement</h3>
      <p>
        Security can and must be tested concretely. Examples of security test cases that can be
        automated alongside functional tests:
      </p>
      <ul>
        <li>A call to a protected endpoint without a token returns 401.</li>
        <li>A user with the wrong role gets 403 (not 200 and not 404).</li>
        <li>
          Input such as <code>&lt;script&gt;alert(1)&lt;/script&gt;</code> is encoded in the output.
        </li>
        <li>Parameterized queries — injection strings do not cause SQL errors or data leaks.</li>
        <li>HTTP is redirected to HTTPS, and security headers (HSTS, CSP) are set.</li>
      </ul>

      <Callout type="info">
        Security testing fits perfectly into CI/CD: run dependency scanning and a DAST baseline
        (e.g. ZAP) automatically on every build. See <Link to="/test/ci-cd">CI/CD</Link> and{' '}
        <Link to="/sikkerhed/tools">Security tools</Link>.
      </Callout>

      <h2>6. How the site is organized</h2>
      <p>
        The module follows a natural order from planning to operations. Each page corresponds to
        one or more <Link to="/maalpinde">objectives</Link>.
      </p>
      <MermaidDiagram chart={flow} />

      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Objective</th>
            <th>Focus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <Link to="/test/testplan">Test plan</Link>
            </td>
            <td>#2</td>
            <td>Plan tests based on functional requirements</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/metodikker">Testing methodologies</Link>
            </td>
            <td>#3</td>
            <td>Black/white box, exploratory, regression, etc.</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/unit">Unit</Link> /{' '}
              <Link to="/test/integration">Integration</Link>
            </td>
            <td>—</td>
            <td>Practical technique in .NET</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/release">Release</Link>
            </td>
            <td>#4</td>
            <td>When is it tested enough?</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/bruno-e2e">Bruno/E2E</Link>
            </td>
            <td>#5</td>
            <td>Scripted tests of API/web</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/ci-cd">CI/CD</Link>
            </td>
            <td>#6</td>
            <td>Automate in the development cycle</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/performance">Performance</Link>
            </td>
            <td>#7</td>
            <td>Performance tables and bottlenecks</td>
          </tr>
          <tr>
            <td>
              <Link to="/test/ux">UX</Link>
            </td>
            <td>#8</td>
            <td>The customer experience</td>
          </tr>
          <tr>
            <td>Security</td>
            <td>#9–14 + GDPR</td>
            <td>Encryption, standards, auth, hashing, attacks, tools, GDPR</td>
          </tr>
        </tbody>
      </table>

      <h2>Exercise</h2>
      <ol>
        <li>
          Pick a small function in a project you know (e.g. login or a price calculation). Write{' '}
          <strong>three functional tests</strong> (valid scenarios) and{' '}
          <strong>three defect tests</strong> (invalid/malicious input) as text.
        </li>
        <li>
          Place each test in the pyramid: unit, integration or E2E — and justify the choice.
        </li>
        <li>
          Pick two of the security topics above and formulate one concrete, automatable security
          test for each.
        </li>
        <li>
          Draw your own version of the test pyramid for the project you are working on now: how many
          tests do you have on each layer? Does it look like a pyramid or an ice cream cone?
        </li>
      </ol>

      <Callout type="tip">
        Continue to <Link to="/test/testplan">Test plan</Link> to learn how to turn requirements
        into a structured plan.
      </Callout>
    </LessonLayout>
  )
}
