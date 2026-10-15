import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const decisionFlow = `
flowchart TD
  A["Release candidate built"] --> B{"All must-have<br/>tests green?"}
  B -- No --> X["NO-GO: fix and re-run"]
  B -- Yes --> C{"Open critical/high<br/>defects?"}
  C -- Yes --> X
  C -- No --> D{"Risk areas<br/>tested?"}
  D -- No --> X
  D -- Yes --> E{"Performance and<br/>security requirements met?"}
  E -- No --> X
  E -- Yes --> F{"Rollback and<br/>monitoring ready?"}
  F -- No --> X
  F -- Yes --> G["GO: release"]
`

const riskMatrix = `
flowchart TB
  subgraph HK["High impact"]
    direction LR
    A["Low likelihood<br/>Test thoughtfully<br/>e.g. login with MFA"]
    B["High likelihood<br/>Test thoroughly<br/>e.g. payment, new code"]
  end
  subgraph LK["Low impact"]
    direction LR
    C["Low likelihood<br/>Light testing<br/>e.g. profile picture"]
    D["High likelihood<br/>Automate the basics<br/>e.g. search, reports"]
  end
  HK ~~~ LK
  style B fill:#7f1d1d,stroke:#f87171,color:#fff
  style A fill:#78350f,stroke:#fbbf24,color:#fff
  style D fill:#1e3a5f,stroke:#60a5fa,color:#fff
  style C fill:#14532d,stroke:#4ade80,color:#fff
`

const flakyCycle = `
flowchart LR
  F["Test fails randomly"] --> D["Detect: same commit, different result"]
  D --> Q["Quarantine: tag it and remove it from the gate"]
  Q --> I["Investigate the root cause"]
  I --> FX["Fix the test or the code"]
  FX --> R["Reinstate in the suite"]
`

const dodChecklist = `
## Definition of Done (example for a user story)

- [ ] Acceptance criteria are met and demonstrated to the PO
- [ ] Unit tests for new logic (incl. boundary values and error paths)
- [ ] Integration test for new/changed endpoints (incl. 401/403)
- [ ] All tests are green in CI on the pull request
- [ ] Code has been reviewed by at least one other person
- [ ] No new warnings / lint errors / vulnerable dependencies
- [ ] Documentation and OpenAPI updated
- [ ] Migrations tested up and down
- [ ] Logging and error handling in place
- [ ] No secrets in code or commit history
`

const goNoGo = `
## Go/no-go checklist

QUALITY
- [ ] 100 % of must-have test cases executed, >= 95 % passed
- [ ] No open defects with severity Critical/High
- [ ] Known defects are documented, assessed and accepted by the PO
- [ ] Regression suite is green on the exact release commit

RISK
- [ ] High-risk areas (payment, auth, data) have exploratory tests + automated tests
- [ ] Changes since the last release have been reviewed and tested

NON-FUNCTIONAL
- [ ] Performance targets met (e.g. p95 < 500 ms at expected load)
- [ ] Security: dependency scan and DAST baseline without high-risk findings
- [ ] Accessibility: critical flows checked

OPERATIONS
- [ ] Rollback plan tested
- [ ] Monitoring, alerts and logs cover the new features
- [ ] Database migrations are backward compatible / have a plan
- [ ] Feature flags can switch the new features off

COMMUNICATION
- [ ] Release notes written
- [ ] Support and stakeholders informed
`

const coverageCmd = `
# Measure code coverage in .NET with Coverlet
dotnet test --collect:"XPlat Code Coverage"

# Generate a readable report
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:"**/coverage.cobertura.xml" -targetdir:coverage-report -reporttypes:Html
`

const coverageLie = `
// 100 % line coverage - but NO verification
[Fact]
public void Beregn_Koerer()
{
    var pris = new Prisberegner().MedRabat(200m);   // runs the code ...
    // ... but checks nothing (no Assert)!
}

// Better: same coverage, but the test has value
[Fact]
public void Beregn_Over100_Giver10ProcentRabat()
{
    var pris = new Prisberegner().MedRabat(200m);
    Assert.Equal(180m, pris);
}
`

const gate = `
# GitHub Actions: quality gate in the pipeline
- name: Test with coverage
  run: dotnet test --collect:"XPlat Code Coverage" --logger trx

- name: Fail if coverage drops below threshold (signal)
  run: |
    # example: use e.g. coverlet.msbuild: /p:Threshold=70 /p:ThresholdType=line
    dotnet test /p:CollectCoverage=true /p:Threshold=70 /p:ThresholdType=line
`

const flakyExample = `
// Typical causes of flakiness and their fixes
[Fact]
public async Task FlakyEksempel_Daarligt()
{
    await _client.PostAsJsonAsync("/api/jobs", job);
    await Task.Delay(500);                     // guess-sleep: sometimes too short
    var status = await GetStatus();
    Assert.Equal("Done", status);
}

[Fact]
public async Task FlakyEksempel_Bedre()
{
    await _client.PostAsJsonAsync("/api/jobs", job);

    // Poll with a timeout instead of guessing
    var status = await Poll.UntilAsync(
        () => GetStatus(),
        s => s == "Done",
        timeout: TimeSpan.FromSeconds(10));

    Assert.Equal("Done", status);
}
`

export default function ReleasePageEn() {

  return (
    <LessonLayout module="test">

<h1>Release: when is it tested enough?</h1>

      <p>
        The hardest question in testing is not &ldquo;how do we test?&rdquo; but{' '}
        <strong>&ldquo;when are we done?&rdquo;</strong>. Because exhaustive testing is
        impossible, a release decision is always a <em>risk assessment</em> — a balance
        between time, cost and the damage a defect can do. This page gives you the tools
        to make and defend that decision.
      </p>

      <h2>Learning objectives</h2>
      <ul>
        <li>Formulate a Definition of Done and exit criteria that are measurable.</li>
        <li>Interpret code coverage correctly: as a signal, not as a goal.</li>
        <li>Apply risk-based testing to prioritise the effort.</li>
        <li>Use a go/no-go checklist to decide on a release.</li>
        <li>Recognise, handle and prevent flaky tests.</li>
      </ul>

      <h2>1. Why can&apos;t you test &ldquo;everything&rdquo;?</h2>
      <p>
        A function with just two 32-bit inputs has 2<sup>64</sup> combinations. Add time,
        state, browsers, networks and data, and the number is astronomical. That is why
        &ldquo;sufficiently tested&rdquo; means that the <strong>residual risk is
        acceptable</strong> to the people who have to bear it (customer, business, users).
      </p>

      <h2>2. Definition of Done (DoD) and acceptance criteria</h2>
      <p>
        The <strong>Definition of Done</strong> is the team&apos;s shared, explicit list of
        what must be satisfied before something can be called finished.{' '}
        <strong>Acceptance criteria</strong> apply to the individual user story. The DoD
        applies to <em>all</em> of them. Testing is an integral part of &ldquo;done&rdquo;
        — not a phase after development.
      </p>
      <CodeBlock language="markdown">{dodChecklist}</CodeBlock>

      <h3>Exit criteria at release level</h3>
      <p>
        Exit criteria are the measurable conditions in the{' '}
        <Link to="/test/testplan">test plan</Link> that must be met to conclude testing:
        executed test cases, pass rate, open defects by severity, performance targets,
        security scans, and so on.
      </p>

      <h2>3. Code coverage: a signal, not a goal</h2>
      <p>
        Code coverage measures how large a share of the code was <em>executed</em> during
        testing. That is <strong>not</strong> the same as the code being
        <em> verified</em>.
      </p>
      <CodeBlock language="csharp">{coverageLie}</CodeBlock>
      <Callout type="warn">
        <strong>Goodhart&apos;s law:</strong> &ldquo;When a measure becomes a target, it
        ceases to be a good measure.&rdquo; Demand 90 % coverage and you get tests without
        asserts. Use coverage to <em>find gaps</em> (red areas in critical code), not as a
        KPI you chase.
      </Callout>
      <table>
        <thead>
          <tr>
            <th>Coverage tells you</th>
            <th>Coverage does NOT tell you</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Here is code that tests never execute</td>
            <td>That the executed lines are tested correctly</td>
          </tr>
          <tr>
            <td>Low coverage in a critical module = risk</td>
            <td>That high coverage = high quality</td>
          </tr>
          <tr>
            <td>Trend: does coverage drop noticeably in a PR?</td>
            <td>That requirements are met, or that edge cases have been thought through</td>
          </tr>
        </tbody>
      </table>
      <p>
        A better complement is <strong>mutation testing</strong> (e.g. Stryker.NET): the
        tool deliberately changes the code (<code>&gt;</code> → <code>&gt;=</code>) and
        checks whether at least one test fails. If the mutant survives, the test is too
        weak.
      </p>
      <CodeBlock language="bash">{coverageCmd}</CodeBlock>
      <CodeBlock language="yaml">{gate}</CodeBlock>

      <h2>4. Risk-based testing</h2>
      <p>
        Risk = <strong>likelihood of failure × impact</strong>. Use it to decide{' '}
        <em>where</em> the testing hours do the most good.
      </p>
      <MermaidDiagram chart={riskMatrix} />
      <h3>How to identify risks</h3>
      <ul>
        <li>
          <strong>Business value:</strong> what does it cost if it goes down? (payment,
          login, personal data).
        </li>
        <li>
          <strong>Complexity and change frequency:</strong> lots of new/changed code =
          more likely defects (&ldquo;code churn&rdquo;).
        </li>
        <li>
          <strong>History:</strong> where have we had defects before? Defects cluster.
        </li>
        <li>
          <strong>Dependencies:</strong> external systems, a new framework, a new team.
        </li>
        <li>
          <strong>Security and compliance:</strong> GDPR, payment data, authorisation.
        </li>
      </ul>
      <p>
        Use a simple 1–5 scale for both dimensions and multiply. Areas scoring above, say,
        12 get thorough testing (several levels + exploratory), 6–12 get automated basic
        tests, and below 6 get minimal testing.
      </p>

      <h2>5. The go/no-go decision</h2>
      <MermaidDiagram chart={decisionFlow} />
      <CodeBlock language="markdown">{goNoGo}</CodeBlock>
      <Callout type="tip">
        A <strong>no-go</strong> is not a defeat — it is exactly what the checklist is for.
        Always document the reasoning. If you release with known defects anyway, the
        decision must be made by the product owner, and the defects must be known and
        accepted (&ldquo;known issues&rdquo;).
      </Callout>

      <h3>What if time runs out?</h3>
      <ol>
        <li>Cut scope (fewer features) rather than cutting testing.</li>
        <li>Release behind a <strong>feature flag</strong> to a small group of users (canary).</li>
        <li>Improve observability and rollback so defects are cheaper to fix in production.</li>
        <li>Be honest: communicate the residual risk to the product owner and the customer.</li>
      </ol>

      <h2>6. Flaky tests</h2>
      <p>
        A <strong>flaky test</strong> passes and fails on the same code without any
        changes. They are dangerous because the team learns to ignore red builds — and then
        the real defects get overlooked. An unreliable suite is almost worse than no suite.
      </p>
      <MermaidDiagram chart={flakyCycle} />

      <table>
        <thead>
          <tr>
            <th>Cause</th>
            <th>Example</th>
            <th>Solution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Timing/async</td>
            <td>
              <code>Thread.Sleep(500)</code> and hope
            </td>
            <td>Polling with a timeout; await a real event</td>
          </tr>
          <tr>
            <td>Shared state</td>
            <td>Tests read/write the same database row</td>
            <td>Isolate data per test; Respawn; unique GUIDs</td>
          </tr>
          <tr>
            <td>Ordering</td>
            <td>Test B requires that test A has run</td>
            <td>Independent tests; random order in CI</td>
          </tr>
          <tr>
            <td>Time and randomness</td>
            <td>
              <code>DateTime.Now</code>, <code>Random</code>
            </td>
            <td>
              Inject <code>TimeProvider</code> / seed
            </td>
          </tr>
          <tr>
            <td>External services</td>
            <td>Calls to a real third-party API</td>
            <td>Stubs/mocks, contract tests</td>
          </tr>
          <tr>
            <td>Environment differences</td>
            <td>&ldquo;Works on my machine&rdquo;</td>
            <td>Container-based environment (Docker/Testcontainers)</td>
          </tr>
          <tr>
            <td>UI tests</td>
            <td>Element not loaded yet</td>
            <td>Auto-wait, stable selectors (data-testid)</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock language="csharp">{flakyExample}</CodeBlock>
      <p>
        Policy: at the first suspicion → <strong>quarantine</strong> (run it, but don&apos;t
        block merging), create a task with an owner and a deadline, then fix or delete it.
        Track the share of flaky tests as a quality metric.
      </p>

      <h2>7. Other signals of test maturity</h2>
      <ul>
        <li>
          <strong>Defect detection trend:</strong> new defects per day/week decline towards
          0 (not just because we stop looking).
        </li>
        <li>
          <strong>Escaped defects:</strong> how many defects reach production? (DDP =
          defects found before release ÷ all defects found).
        </li>
        <li>
          <strong>MTTR and change failure rate</strong> (DORA metrics): how quickly do we
          fix things, and how often does a release go wrong?
        </li>
        <li>
          <strong>Test suite speed:</strong> if feedback takes more than 10 minutes, tests
          get avoided.
        </li>
      </ul>
      <p>
        Also read about <Link to="/test/ci-cd">CI/CD</Link> to automate gates, and{' '}
        <Link to="/test/performance">Performance</Link> to verify non-functional
        requirements before release.
      </p>

      <h2>Exercise</h2>
      <ol>
        <li>
          Write a Definition of Done for your own project (at least 8 items). Which of them
          can be verified automatically in CI?
        </li>
        <li>
          Make a risk table for 6 features (likelihood 1–5 × impact 1–5). Plan the testing
          effort accordingly.
        </li>
        <li>
          Measure code coverage in a project. Find one module with low coverage — is it a
          problem, or is the code non-critical?
        </li>
        <li>
          Run a fictional go/no-go meeting using the checklist: which items would stop your
          next release?
        </li>
        <li>
          Find a flaky test (or write one with <code>Task.Delay</code>) and make it
          deterministic.
        </li>
      </ol>
    </LessonLayout>
  )
}
