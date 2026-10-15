import LessonLayout from '../../components/LessonLayout'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import MermaidDiagram from '../../components/MermaidDiagram'
import Figure from '../../components/Figure'
import Split from '../../components/Split'

const strategyChart = `
flowchart LR
  Kode["Your code"] --> Unit["Unit tests<br/>NOW - fast and isolated"]
  Unit --> Integration["Integration tests<br/>LATER - several parts together"]
  Integration --> E2E["E2E tests<br/>LATER - the whole flow from outside"]
  Unit -. "many, milliseconds" .-> Billig["Cheap and fast feedback"]
  E2E -. "few, seconds/minutes" .-> Dyr["Expensive but realistic"]
`

const slowEarlyChart = `
flowchart LR
  A["Week 1<br/>Write test + code"] --> B["Week 2-3<br/>Extra work<br/>(feels slow)"]
  B --> C["Week 4+<br/>Refactoring without fear"]
  C --> D["Month 3+<br/>Bugs caught by tests<br/>instead of by users"]
  M["Without tests"] --> N["Fast at first"]
  N --> O["Manual retest every time"]
  O --> P["Bugs and fear of touching the code"]
`

const tddChart = `
flowchart LR
  Red["RED<br/>Write a failing test"] --> Green["GREEN<br/>Write the least code possible<br/>to make the test pass"]
  Green --> Refactor["REFACTOR<br/>Clean up - the test keeps you honest"]
  Refactor --> Red
`

export default function UnitPageEn() {

  return (
    <LessonLayout module="test">
      <h1>Unit testing</h1>

      <h2>Learning objectives</h2>
      <Split
        media={
          <Figure
            src="/images/unit-book.png"
            alt="Cover of Unit Testing Principles, Practices, and Patterns"
            caption="Vladimir Khorikov: Unit Testing Principles, Practices, and Patterns"
            size="sm"
          />
        }
      >
        <p>
          After this lesson (Day 26) you should be able to do three things. They are deliberately
          phrased as actions – you should be able to <em>do</em> them, not just recognize them:
        </p>
        <ul>
          <li>
            Explain <strong>what a unit test is</strong> and why it differs from integration and E2E
            tests (isolation, speed, responsibility).
          </li>
          <li>
            Write a unit test following <strong>Arrange – Act – Assert</strong> in NUnit and use{' '}
            <strong>Moq</strong> to replace dependencies behind interfaces.
          </li>
          <li>
            Assess code written by others: Is it testable? Which tests are missing? Can you write them
            without changing the production code more than absolutely necessary?
          </li>
        </ul>
      </Split>

      <h2>The book behind the lesson</h2>
      <p>
        The curriculum leans on <strong>Vladimir Khorikov – Unit Testing Principles, Practices, and
        Patterns</strong> (Manning, 2020). The book is written for .NET developers and is known for
        asking an uncomfortable but important question: <em>what makes a unit test good?</em> Khorikov
        points to four pillars, which we will return to throughout the course:
      </p>
      <ol>
        <li>
          <strong>Protection against regressions</strong> – does the test actually catch bugs when
          code changes?
        </li>
        <li>
          <strong>Resistance to refactoring</strong> – does the test only turn red when the behavior
          is wrong, and not just because you renamed a private method?
        </li>
        <li>
          <strong>Fast feedback</strong> – can the whole suite run in seconds?
        </li>
        <li>
          <strong>Maintainability</strong> – is the test easy to read and easy to run?
        </li>
      </ol>
      <Callout type="info">
        You do not need to have read the whole book. Use it as a reference and as a source when, in
        the exam or on the job, you need to <em>justify</em> why a test is good or bad.
      </Callout>

      <h2>Test strategy: unit now – integration and E2E later</h2>
      <p>
        A test strategy is a plan for <em>which types of tests</em> you write, <em>how many</em>, and{' '}
        <em>when</em>. In the curriculum we work in three layers. We start at the bottom with unit
        tests, because they are the fastest to write and run, and because they force you to design
        code with clear interfaces. Integration tests (the lesson on integration) and end-to-end
        tests (the lesson on Bruno and E2E) come later in the course and build on top.
      </p>
      <div className="duo">
        <Figure
          src="/images/test-strategy.png"
          alt="Overview of test strategy: unit, integration and E2E"
          caption="Test strategy: many fast tests at the bottom, few realistic tests at the top."
          size="lg"
        />
        <Figure
          src="/images/test-pyramid-coverage.png"
          alt="Test pyramid with coverage"
          caption="The pyramid tells you about quantity. Coverage only tells you which lines were executed – not whether they were tested well."
          size="lg"
        />
      </div>
      <MermaidDiagram chart={strategyChart} />
      <Callout type="warn">
        High <strong>code coverage</strong> is not the same as good tests. A test without asserts
        can give 100% coverage and no protection. Use coverage to find <em>blind spots</em> – not as
        a goal in itself.
      </Callout>

      <h2>What is a unit test?</h2>
      <p>
        Khorikov defines a unit test by three properties: it verifies a small piece of behavior (a{' '}
        <em>unit</em>), it does so quickly, and it does so in <strong>isolation</strong> from other
        tests. The classical school (Detroit/classicist) regards a unit as a <em>behavior</em> and
        isolates tests from each other. The London school (mockist) instead isolates the class from
        all of its dependencies using mocks. We use a pragmatic mix: real objects where they are
        simple and fast, and Moq where the dependency is slow, unpredictable or has side effects
        (mail, database, network, time).
      </p>

      <h2>The AAA pattern: Arrange – Act – Assert</h2>
      <p>
        Almost all good unit tests share the same three-part shape. <strong>Arrange</strong> sets up
        what is to be tested (objects, test data, mocks). <strong>Act</strong> calls exactly the one
        operation you want to test. <strong>Assert</strong> checks the result. Keep the three blocks
        separated by a blank line, and let Act be <em>a single line</em> – if you need more, the
        unit is probably too large, or the API too awkward.
      </p>
      <CodeBlock language="csharp">{`using NUnit.Framework;

namespace Shop.Tests;

public class PriceCalculatorTests
{
    [Test]
    public void ApplyDiscount_TenPercent_ReturnsReducedPrice()
    {
        // Arrange
        var calculator = new PriceCalculator();
        var originalPrice = 200m;

        // Act
        var result = calculator.ApplyDiscount(originalPrice, percent: 10);

        // Assert
        Assert.That(result, Is.EqualTo(180m));
    }

    [Test]
    public void ApplyDiscount_NegativePercent_ThrowsArgumentOutOfRange()
    {
        // Arrange
        var calculator = new PriceCalculator();

        // Act + Assert (exceptions are tested together)
        Assert.Throws<ArgumentOutOfRangeException>(
            () => calculator.ApplyDiscount(100m, percent: -5));
    }
}`}</CodeBlock>
      <Callout type="tip">
        Name tests using the pattern <code>Method_Scenario_ExpectedResult</code>. When a test fails
        in CI, the name alone should tell you what is wrong – without opening the file.
      </Callout>

      <h3>Assert.That (constraint model) vs. classic NUnit</h3>
      <p>
        NUnit has two styles. The <strong>classic model</strong> (<code>Assert.AreEqual</code>,{' '}
        <code>Assert.IsTrue</code>, etc.) is the old one; it has been moved to a separate namespace
        and no new features are added to it. The <strong>constraint model</strong> (
        <code>Assert.That(actual, Is.EqualTo(expected))</code>) is recommended today: it reads like
        a sentence, has better failure messages and can be combined (<code>Is.Not.Null.And.Length.GreaterThan(3)</code>).
      </p>
      <CodeBlock language="csharp">{`// CLASSIC (avoid in new code) - the order (expected, actual) is easy to mix up
Assert.AreEqual(180m, result);
Assert.IsTrue(user.IsActive);
Assert.IsNotNull(user.Email);

// CONSTRAINT MODEL (recommended) - actual first, then a readable constraint
Assert.That(result, Is.EqualTo(180m));
Assert.That(user.IsActive, Is.True);
Assert.That(user.Email, Is.Not.Null.And.Contains("@"));

// Multiple asserts in the same test without stopping at the first failure
Assert.Multiple(() =>
{
    Assert.That(order.Total, Is.EqualTo(250m));
    Assert.That(order.Lines, Has.Count.EqualTo(2));
    Assert.That(order.Status, Is.EqualTo(OrderStatus.Created));
});`}</CodeBlock>
      <p>
        On failure, the constraint model gives a message like <code>Expected: 180 But was: 200</code>{' '}
        – the classic model does too, but if you get the argument order wrong, the message becomes
        directly misleading. It is a small thing that saves a lot of debugging.
      </p>

      <h2>Interfaces and Moq – example from h4-mags (IMailService)</h2>
      <p>
        If a class creates its own dependencies (<code>new SmtpClient()</code>), you cannot test it
        without sending real emails. The solution is to let the class <em>receive</em> an interface
        through its constructor (<strong>Dependency Injection</strong>). In h4-mags an{' '}
        <code>IMailService</code> is used, which the production code implements with real SMTP, and
        which the test replaces with a <strong>Moq</strong> mock.
      </p>
      <CodeBlock language="csharp">{`// Production code: the contract
public interface IMailService
{
    Task SendAsync(string to, string subject, string body);
}

// Production code: the class that uses it
public class UserRegistrationService
{
    private readonly IUserRepository _users;
    private readonly IMailService _mail;

    public UserRegistrationService(IUserRepository users, IMailService mail)
    {
        _users = users;
        _mail = mail;
    }

    public async Task<User> RegisterAsync(string email, string name)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email is required", nameof(email));

        var user = new User { Email = email, Name = name };
        await _users.AddAsync(user);
        await _mail.SendAsync(email, "Welcome", $"Hi {name}, thanks for signing up!");
        return user;
    }
}`}</CodeBlock>
      <CodeBlock language="csharp">{`using Moq;
using NUnit.Framework;

public class UserRegistrationServiceTests
{
    private Mock<IUserRepository> _users = null!;
    private Mock<IMailService> _mail = null!;
    private UserRegistrationService _sut = null!;   // sut = system under test

    [SetUp]
    public void SetUp()
    {
        _users = new Mock<IUserRepository>();
        _mail = new Mock<IMailService>();
        _sut = new UserRegistrationService(_users.Object, _mail.Object);
    }

    [Test]
    public async Task RegisterAsync_ValidInput_SendsWelcomeMail()
    {
        // Arrange - no setup needed, Moq returns a completed Task by default

        // Act
        await _sut.RegisterAsync("anna@example.com", "Anna");

        // Assert - verify that the collaborator was called with the right data
        _mail.Verify(m => m.SendAsync(
            "anna@example.com",
            "Welcome",
            It.Is<string>(body => body.Contains("Anna"))),
            Times.Once);
    }

    [Test]
    public void RegisterAsync_EmptyEmail_ThrowsAndSendsNoMail()
    {
        // Act + Assert
        Assert.ThrowsAsync<ArgumentException>(() => _sut.RegisterAsync("", "Anna"));

        _mail.Verify(m => m.SendAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()),
            Times.Never);
    }

    [Test]
    public void RegisterAsync_MailServerDown_PropagatesException()
    {
        // Arrange - Setup lets us simulate a failure that is hard to provoke in reality
        _mail.Setup(m => m.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
             .ThrowsAsync(new InvalidOperationException("SMTP down"));

        // Act + Assert
        Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.RegisterAsync("anna@example.com", "Anna"));
    }
}`}</CodeBlock>
      <Callout type="info">
        <strong>Stub vs. mock.</strong> A <em>stub</em> supplies data to the code (<code>Setup</code>{' '}
        + <code>Returns</code>) – you do not assert on the call. A <em>mock</em> verifies an outgoing
        call (<code>Verify</code>). Khorikov's advice: only mock <em>outgoing</em> calls that are
        observable outside your application (like an email). Do not verify internal calls between
        your own classes – it makes the test brittle against refactoring.
      </Callout>

      <h3>Table of interfaces (test seams)</h3>
      <p>
        Interfaces are the <em>seams</em> in the code where you can take the system apart and insert
        a test version. Typical candidates in a web application:
      </p>
      <table>
        <thead>
          <tr>
            <th>Interface</th>
            <th>Responsibility</th>
            <th>Why replace in a unit test?</th>
            <th>Typical test double</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>IMailService</code>
            </td>
            <td>Sends emails</td>
            <td>Must not send real emails; slow and has side effects</td>
            <td>Mock (Verify)</td>
          </tr>
          <tr>
            <td>
              <code>IUserRepository</code>
            </td>
            <td>Reads/saves users in the database</td>
            <td>The database is slow and requires setup</td>
            <td>Stub / in-memory fake</td>
          </tr>
          <tr>
            <td>
              <code>IDateTimeProvider</code>
            </td>
            <td>Provides the current time</td>
            <td>Time is not deterministic – tests would fail on weekends or at midnight</td>
            <td>Stub (fixed point in time)</td>
          </tr>
          <tr>
            <td>
              <code>IPaymentGateway</code>
            </td>
            <td>Calls an external payment service</td>
            <td>Network, money and rate limits</td>
            <td>Mock / stub</td>
          </tr>
          <tr>
            <td>
              <code>IHttpClientFactory</code> / API client
            </td>
            <td>Calls a third-party API</td>
            <td>Depends on the network and on other people's uptime</td>
            <td>Stub with a fixed response</td>
          </tr>
          <tr>
            <td>
              <code>ILogger&lt;T&gt;</code>
            </td>
            <td>Logging</td>
            <td>Rarely relevant – use a NullLogger instead of a mock</td>
            <td>Null object</td>
          </tr>
        </tbody>
      </table>

      <h2>Principles: isolation, speed and Dependency Injection</h2>
      <Split
        mediaFirst
        media={
          <Figure
            src="/images/isolation.png"
            alt="Illustration of isolation in unit tests"
            caption="One test, one behavior – no shared state between tests."
            size="sm"
          />
        }
      >
        <h3>Isolation</h3>
        <p>
          Each test must be able to run <strong>alone, in any order and in parallel</strong> and give
          the same result. That means: no shared static state, no shared database, no dependency on
          another test having run first. Use <code>[SetUp]</code> to build fresh objects for every
          test, so no test inherits a mess from another. If you break isolation, you get the worst
          tests: the ones that only fail sometimes (<em>flaky tests</em>).
        </p>
      </Split>
      <h3>Speed</h3>
      <p>
        A unit test should take <strong>milliseconds</strong>. Hundreds of tests should be able to
        run in a few seconds, so that you actually run them after every small change. If a test
        touches the file system, network or database, it is no longer a unit test – it is an
        integration test, and it belongs in a different layer that runs less often.
      </p>
      <h3>Dependency Injection (DI)</h3>
      <p>
        DI is the prerequisite for both. When the class receives its dependencies from the outside
        (via the constructor), the test can insert fake versions; in production, ASP.NET Core's DI
        container (<code>builder.Services.AddScoped&lt;IMailService, SmtpMailService&gt;()</code>)
        inserts the real ones. Same class, two worlds – and without changing a single line in the
        class.
      </p>
      <Callout type="danger">
        Never call <code>DateTime.Now</code>, <code>new HttpClient()</code> or{' '}
        <code>new SqlConnection()</code> deep inside business logic. These are hidden dependencies,
        and they make the code almost impossible to unit test.
      </Callout>

      <h2>Why do tests feel slow at first?</h2>
      <Split
        media={
          <Figure
            src="/images/tests-save-time.png"
            alt="Graph of how tests save time in the long run"
            caption="Tests cost time today and save time tomorrow."
            size="sm"
          />
        }
      >
        <MermaidDiagram chart={slowEarlyChart} />
        <p>
          The figure shows two paths. <strong>With tests</strong> you spend extra time at the start: you
          have to learn the tools, write test code alongside production code and think about design so
          the code becomes testable. It <em>feels</em> slow because you compare it with &ldquo;just writing
          the code&rdquo;. <strong>Without tests</strong> you are fast in the first few days – but every new
          change requires manually retesting everything that could be affected. As the system grows,
          the manual retesting grows faster than your code, and you end up avoiding touching anything
          for fear of breaking it.
        </p>
      </Split>
      <p>
        The break-even point typically comes after weeks, not days. Tests are an <em>investment with
        interest</em>: expensive today, cheap afterwards. That is exactly why it is a challenge to
        stick with them under deadline pressure – and why CI (see the lesson on CI/CD) is so
        valuable: it runs the tests for you, every time.
      </p>

      <h2>TDD: red – green – refactor</h2>
      <Split
        mediaFirst
        media={
          <Figure
            src="/images/tdd.png"
            alt="TDD cycle: red, green, refactor"
            caption="Test-Driven Development in three small steps."
            size="sm"
          />
        }
      >
        <MermaidDiagram chart={tddChart} />
      </Split>
      <p>
        <strong>Test-Driven Development</strong> reverses the order: you write the test first. In{' '}
        <strong>Red</strong> you write a test for behavior that does not exist yet and watch it fail
        (so you know the test can fail). In <strong>Green</strong> you write the <em>least possible</em>{' '}
        code that makes the test pass – even if it is ugly. In <strong>Refactor</strong> you clean up
        both code and test while the tests guard you against breaking something. Then you start over
        with the next small requirement.
      </p>
      <table>
        <thead>
          <tr>
            <th>Use TDD when…</th>
            <th>Skip TDD when…</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>The business rules are clear (calculations, validation, state machines)</td>
            <td>You are exploring an unknown API or building a quick prototype/spike</td>
          </tr>
          <tr>
            <td>You are fixing a bug: first write a test that reproduces it, then fix it</td>
            <td>The code is pure UI setup, configuration or "glue code" without logic</td>
          </tr>
          <tr>
            <td>You are unsure about the design – the test forces you to use your own API</td>
            <td>The requirements change hour by hour, and the tests would be thrown away</td>
          </tr>
          <tr>
            <td>The code is critical (money, security, health)</td>
            <td>You inherit legacy code without tests – start with characterization tests instead</td>
          </tr>
        </tbody>
      </table>
      <Callout type="tip">
        TDD is a tool, not a religion. Many experienced developers write tests <em>right after</em>{' '}
        the code, while the details are still fresh. What matters is that tests get written – and
        that the code is designed so it <em>can</em> be tested.
      </Callout>

      <h2>Exercise: write tests for other people's code</h2>
      <p>
        Testing your own code is hard because you know it too well and unconsciously test the
        scenarios you have already thought of. Testing <strong>other people's</strong> code forces
        you to read the contract and ask critical questions. Do the following in pairs:
      </p>
      <ol>
        <li>
          Swap repositories with a partner (or use h4-mags). Pick <strong>one class with business
          logic</strong> – not a controller or a DbContext.
        </li>
        <li>
          Read the code and write a list of <strong>at least 5 scenarios</strong>: the normal flow,
          boundary values (0, empty string, <code>null</code>), invalid input and errors from
          dependencies.
        </li>
        <li>
          Create an NUnit test project (<code>dotnet new nunit</code>), add Moq (
          <code>dotnet add package Moq</code>) and write the tests following AAA.
        </li>
        <li>
          Is the class hard to test (static calls, <code>new</code> on dependencies)? Note why, and
          suggest an interface that would solve it. That is just as valuable a deliverable as the
          tests themselves.
        </li>
        <li>
          Run <code>dotnet test</code>. Did you find a bug? Tell your partner – that is the whole
          point.
        </li>
      </ol>
      <CodeBlock language="bash">{`dotnet new nunit -n Shop.Tests
cd Shop.Tests
dotnet add package Moq
dotnet add reference ../Shop/Shop.csproj
dotnet test`}</CodeBlock>

      <h3>Checklist for a good unit test</h3>
      <ul>
        <li>Does it test behavior, not implementation?</li>
        <li>Does it have one clear Act and clear asserts?</li>
        <li>Can it run alone, in parallel and in under half a second?</li>
        <li>Does it fail if I deliberately introduce a bug in the code (mutation in my head)?</li>
        <li>Does it survive if I refactor without changing behavior?</li>
        <li>Does the name tell me what is wrong when it fails?</li>
      </ul>
    </LessonLayout>
  )
}
