import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const overview = `
flowchart TB
  M["Testing methodologies"] --> D["Design techniques"]
  M --> S["Strategies / approaches"]
  M --> L["Levels"]
  D --> BB["Black box<br/>(specification-based)"]
  D --> WB["White box<br/>(structure-based)"]
  D --> EXP["Experience-based<br/>(exploratory)"]
  BB --> EQ["Equivalence classes"]
  BB --> BV["Boundary values"]
  BB --> DT["Decision tables"]
  WB --> ST["Statement / branch coverage"]
  S --> SM["Smoke"]
  S --> RG["Regression"]
  L --> U["Unit"]
  L --> I["Integration"]
  L --> E["E2E"]
`

const whichWhen = `
flowchart TD
  Q1{"New build ready?"} -->|Yes| SMK["1. Smoke test"]
  SMK -->|Fail| STOP["Stop and return build"]
  SMK -->|OK| REG["2. Regression suite in CI"]
  REG --> NEW{"New functionality?"}
  NEW -->|Yes| FT["3. New functional tests<br/>EP + BVA"]
  NEW --> EXPL["4. Exploratory session"]
  FT --> EXPL
  EXPL --> DONE["Release decision"]
`

const bvaCode = `
// Requirement: "The discount is 0% under 100, 10% from 100 up to and including 499, 20% from 500"
public static class Discount
{
    public static decimal Percent(decimal subtotal) => subtotal switch
    {
        < 0    => throw new ArgumentOutOfRangeException(nameof(subtotal)),
        < 100  => 0m,
        < 500  => 10m,
        _      => 20m
    };
}

public class DiscountTests
{
    // Equivalence classes: [0..99.99] -> 0, [100..499.99] -> 10, [500..] -> 20, [<0] -> error
    // Boundary values: just below, on and just above each boundary
    [Theory]
    [InlineData(0,      0)]    // lower bound of class 1
    [InlineData(99.99,  0)]    // just below 100
    [InlineData(100,    10)]   // ON the boundary
    [InlineData(100.01, 10)]
    [InlineData(499.99, 10)]   // just below 500
    [InlineData(500,    20)]   // ON the boundary
    [InlineData(10000,  20)]   // representative of the upper class
    public void Percent_GivesCorrectDiscount(double subtotal, double expected)
        => Assert.Equal((decimal)expected, Discount.Percent((decimal)subtotal));

    [Fact]
    public void Percent_NegativeSubtotal_Throws()
        => Assert.Throws<ArgumentOutOfRangeException>(() => Discount.Percent(-0.01m));
}
`

const whiteBoxCode = `
public static string Classify(int age, bool hasConsent)
{
    if (age < 0) return "invalid";                  // branch A
    if (age < 13) return "child";                   // branch B
    if (age < 18 && !hasConsent) return "rejected"; // branch C
    return "approved";                              // branch D
}

// Branch coverage (all decisions both true/false) requires at least:
// (-1, _)      -> A
// (10, _)      -> B
// (15, false)  -> C
// (15, true)   -> D  (combination that makes 'age<18 && !consent' false)
// (30, false)  -> D  (shows that 'age<18' being false alone is also enough)
`

const smokeYaml = `
# GitHub Actions: smoke test after deploy (short, runs in < 1 minute)
smoke:
  runs-on: ubuntu-latest
  steps:
    - name: Health check
      run: curl --fail --retry 5 --retry-delay 3 https://staging.example.dk/health
    - name: Front page responds
      run: curl --fail -s -o /dev/null https://staging.example.dk/
    - name: Login endpoint exists
      run: |
        code=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://staging.example.dk/api/login)
        test "$code" -ne 404
`

const regressionAttr = `
// Mark tests with traits, so they can be run selectively
[Trait("Category", "Smoke")]
[Fact]
public async Task Health_Returns200() { /* ... */ }

[Trait("Category", "Regression")]
[Fact]
public async Task Bug1234_OrderWithDiscountCode_CalculatesCorrectTotal() { /* ... */ }

// Run only smoke:       dotnet test --filter "Category=Smoke"
// Run regression:       dotnet test --filter "Category=Regression"
`

export default function MetodikkerPageEn() {

  return (
    <LessonLayout module="test">

<h1>Testing methodologies</h1>

      <p>
        A <strong>testing methodology</strong> is a systematic way of finding, designing and running
        tests. Different methodologies find different kinds of defects — which is why professional
        testers combine them. This page gives you the toolbox and helps you choose the right tool
        for the job.
      </p>

      <h2>Learning objectives</h2>
      <ul>
        <li>Explain the difference between black box, white box and experience-based testing.</li>
        <li>Apply equivalence classes and boundary value analysis to a requirement.</li>
        <li>Describe exploratory testing, smoke testing and regression testing — and when they are used.</li>
        <li>Link methodologies to the test levels unit, integration and E2E.</li>
        <li>Choose a suitable combination of methodologies in a given project.</li>
      </ul>

      <h2>1. Overview</h2>
      <MermaidDiagram chart={overview} />
      <p>
        Note that the categories are <em>orthogonal</em>: a unit test can be black box (the test only
        knows the method's contract), and a regression test can be E2E or unit. You choose
        technique, strategy and level independently of each other.
      </p>

      <h2>2. Black box testing</h2>
      <p>
        The tester only knows the <strong>specification</strong> (input → expected output), not the
        implementation. Test cases are derived from requirements, user stories and API contracts.
      </p>
      <ul>
        <li>
          <strong>Advantages:</strong> independent of code; can be written before the code; finds
          missing or misunderstood requirements.
        </li>
        <li>
          <strong>Disadvantages:</strong> cannot see whether all code has been executed; can miss
          defects in hidden branches.
        </li>
        <li>
          <strong>Used for:</strong> functional testing, system testing, acceptance testing, API
          testing.
        </li>
      </ul>

      <h3>Equivalence partitioning</h3>
      <p>
        Divide the input into classes in which the system is expected to behave the same way. Test
        one representative per class — that way you avoid testing every value. Remember both
        <em> valid</em> and <em>invalid</em> classes.
      </p>
      <table>
        <thead>
          <tr>
            <th>Input: age (requirement 18–65 years)</th>
            <th>Class</th>
            <th>Representative</th>
            <th>Expected</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>&lt; 18</td>
            <td>Invalid (too young)</td>
            <td>10</td>
            <td>Rejected</td>
          </tr>
          <tr>
            <td>18–65</td>
            <td>Valid</td>
            <td>40</td>
            <td>Accepted</td>
          </tr>
          <tr>
            <td>&gt; 65</td>
            <td>Invalid (too old)</td>
            <td>80</td>
            <td>Rejected</td>
          </tr>
          <tr>
            <td>Not a number</td>
            <td>Invalid (type)</td>
            <td>&quot;abc&quot;</td>
            <td>Validation error</td>
          </tr>
        </tbody>
      </table>

      <h3>Boundary value analysis</h3>
      <p>
        Defects most often occur <strong>at the boundaries</strong> (<code>&lt;</code> vs{' '}
        <code>&lt;=</code>, off-by-one). Test the value just below, on and just above each boundary.
        For 18–65 that gives: 17, 18, 19 and 64, 65, 66.
      </p>
      <CodeBlock language="csharp">{bvaCode}</CodeBlock>

      <h3>Other black box techniques</h3>
      <ul>
        <li>
          <strong>Decision tables</strong> — combinations of conditions → action (e.g. discount
          depends on customer type × amount × campaign code).
        </li>
        <li>
          <strong>State transitions</strong> — order: Created → Paid → Shipped → Delivered; test
          valid and invalid transitions.
        </li>
        <li>
          <strong>Use case/scenario testing</strong> — entire user flows from start to finish.
        </li>
        <li>
          <strong>Pairwise testing</strong> — cover all pairs of parameters with fewer tests than all
          combinations.
        </li>
      </ul>

      <h2>3. White box testing</h2>
      <p>
        The tester knows and uses the <strong>code</strong> to design test cases. The goal is to
        exercise specific paths and branches.
      </p>
      <table>
        <thead>
          <tr>
            <th>Coverage measure</th>
            <th>Meaning</th>
            <th>Strength</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Statement/line coverage</td>
            <td>Every line executed at least once</td>
            <td>Weak</td>
          </tr>
          <tr>
            <td>Branch/decision coverage</td>
            <td>Every if/else/switch branch both true and false</td>
            <td>Medium</td>
          </tr>
          <tr>
            <td>Condition coverage</td>
            <td>Every sub-condition in an expression both true/false</td>
            <td>Stronger</td>
          </tr>
          <tr>
            <td>Path coverage</td>
            <td>All possible paths through the code</td>
            <td>Strongest — but explosive in practice</td>
          </tr>
        </tbody>
      </table>
      <CodeBlock language="csharp">{whiteBoxCode}</CodeBlock>
      <Callout type="info">
        <strong>Grey box</strong> is a middle ground: the tester knows the architecture and data
        model (e.g. can see the database), but still tests through the external interface. Many
        integration tests are grey box.
      </Callout>

      <h2>4. Experience-based and exploratory testing</h2>
      <p>
        Here tests are designed and executed <strong>at the same time</strong> based on the tester's
        experience, curiosity and knowledge of typical defects. It is not &ldquo;random
        clicking&rdquo; — good exploratory testing is structured in <strong>sessions</strong>:
      </p>
      <ol>
        <li>
          <strong>Charter</strong> — a short mission: &ldquo;Explore the payment flow with a focus
          on dropped connections.&rdquo;
        </li>
        <li>
          <strong>Timebox</strong> — typically 60–90 minutes.
        </li>
        <li>
          <strong>Notes</strong> — what was tested, what was found, new questions.
        </li>
        <li>
          <strong>Debrief</strong> — share findings; create bug reports; turn good findings into
          automated regression tests.
        </li>
      </ol>
      <p>
        Techniques: <em>error guessing</em> (empty fields, special characters, emojis, very long
        strings, double-click, back button), <em>checklists</em> and <em>tours</em> (e.g.
        &ldquo;the saboteur&rdquo; tries to break things, &ldquo;the impatient user&rdquo; clicks
        quickly).
      </p>
      <Callout type="tip">
        Exploratory testing is the best antidote to the <em>pesticide paradox</em>: when automated
        tests always run the same paths, a human finds the new ones.
      </Callout>

      <h2>5. Smoke testing</h2>
      <p>
        A small, fast suite that answers: <em>&ldquo;Is the build even worth testing
        further?&rdquo;</em> The name comes from hardware: switch on the power — does it smoke?
        Typically 5–20 tests covering the most important flows: the application starts, the health
        endpoint responds, login works, the front page loads.
      </p>
      <CodeBlock language="yaml">{smokeYaml}</CodeBlock>
      <p>
        Sanity testing is related: a very narrow check after a specific fix (&ldquo;does the bug we
        just fixed work?&rdquo;).
      </p>

      <h2>6. Regression testing</h2>
      <p>
        <strong>Regression</strong> = something that used to work has stopped working after a
        change. Regression testing re-runs existing tests to catch it. Ground rules:
      </p>
      <ul>
        <li>
          <strong>Every fixed bug gets a test</strong> that failed before the fix and passes after.
          That way the bug never comes back.
        </li>
        <li>Automate — regression testing is repetition, which machines are good at.</li>
        <li>Run quickly in CI on every commit; run the full suite nightly if it is heavy.</li>
        <li>
          Use <em>test impact analysis</em> / risk-based selection when the suite gets too large.
        </li>
      </ul>
      <CodeBlock language="csharp">{regressionAttr}</CodeBlock>

      <h2>7. When do you use what?</h2>
      <table>
        <thead>
          <tr>
            <th>Situation</th>
            <th>Recommended methodology</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>New requirement with numeric ranges</td>
            <td>Black box: equivalence classes + boundary values</td>
          </tr>
          <tr>
            <td>Complex business rule with many conditions</td>
            <td>Decision table + white box branch coverage on the implementation</td>
          </tr>
          <tr>
            <td>New build from CI</td>
            <td>Smoke → regression</td>
          </tr>
          <tr>
            <td>Bug fixed</td>
            <td>Write a regression test + sanity check</td>
          </tr>
          <tr>
            <td>New, unclear feature without good requirements</td>
            <td>Exploratory testing with a charter</td>
          </tr>
          <tr>
            <td>Before release to the customer</td>
            <td>Acceptance test (scenarios) + exploratory + regression</td>
          </tr>
          <tr>
            <td>Security-critical area</td>
            <td>Negative tests, fuzzing, security tools (see <Link to="/sikkerhed/tools">Tools</Link>)</td>
          </tr>
        </tbody>
      </table>
      <MermaidDiagram chart={whichWhen} />

      <h2>8. Link to test levels</h2>
      <table>
        <thead>
          <tr>
            <th>Level</th>
            <th>Typical methodology</th>
            <th>Read more</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Unit</td>
            <td>White box (knowledge of branches) + black box EP/BVA on the method's contract</td>
            <td>
              <Link to="/test/unit">Unit testing</Link>
            </td>
          </tr>
          <tr>
            <td>Integration</td>
            <td>Grey box; contract tests; scenarios across components</td>
            <td>
              <Link to="/test/integration">Integration testing</Link>
            </td>
          </tr>
          <tr>
            <td>E2E / system</td>
            <td>Black box scenarios, smoke and regression, exploratory</td>
            <td>
              <Link to="/test/bruno-e2e">Bruno and E2E</Link>
            </td>
          </tr>
          <tr>
            <td>Acceptance</td>
            <td>Scenarios from the customer, BDD (Given/When/Then)</td>
            <td>
              <Link to="/test/testplan">Test plan</Link>
            </td>
          </tr>
        </tbody>
      </table>

      <Callout type="warn">
        One hundred percent code coverage does not mean that all requirements are tested. Black box
        and white box <strong>complement</strong> each other: coverage shows what has <em>not</em>{' '}
        been run, requirement-based tests show what is <em>missing</em>.
      </Callout>

      <h2>Exercise</h2>
      <ol>
        <li>
          Requirement: &ldquo;A password must be 8–64 characters and contain at least one
          digit.&rdquo; Find equivalence classes and boundary values, and write an xUnit{' '}
          <code>[Theory]</code> with at least 8 data rows.
        </li>
        <li>
          Write a function with three <code>if</code> statements and find the minimum number of tests
          for 100% branch coverage. Measure with <code>dotnet test --collect:&quot;XPlat Code Coverage&quot;</code>.
        </li>
        <li>
          Create an exploratory charter (60 min) for a web app and take 5 notes. Which findings can
          become regression tests?
        </li>
        <li>
          Define a smoke suite of 5 tests for your project. Why exactly those five?
        </li>
      </ol>
    </LessonLayout>
  )
}
