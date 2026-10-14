import LessonLayout from '../../components/LessonLayout'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import MermaidDiagram from '../../components/MermaidDiagram'
import Figure from '../../components/Figure'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import LinkTrio from '../../components/LinkTrio'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'
import { useLanguage } from '../../i18n/LanguageContext'

const strategyChart = `
flowchart LR
  Kode["Din kode"] --> Unit["Unit-tests<br/>NU - hurtige og isolerede"]
  Unit --> Integration["Integrationstests<br/>SENERE - flere dele sammen"]
  Integration --> E2E["E2E-tests<br/>SENERE - hele flowet udefra"]
  Unit -. "mange, millisekunder" .-> Billig["Billig og hurtig feedback"]
  E2E -. "fÃ¥, sekunder/minutter" .-> Dyr["Dyr men realistisk"]
`

const slowEarlyChart = `
flowchart LR
  A["Uge 1<br/>Skriv test + kode"] --> B["Uge 2-3<br/>Ekstra arbejde<br/>(oplevet som langsomt)"]
  B --> C["Uge 4+<br/>Refaktorering uden frygt"]
  C --> D["MÃ¥ned 3+<br/>Fejl fanges af tests<br/>i stedet for af brugere"]
  M["Uden tests"] --> N["Hurtigt i starten"]
  N --> O["Manuel gentest hver gang"]
  O --> P["Bugs og frygt for at rÃ¸re koden"]
`

const tddChart = `
flowchart LR
  Red["RED<br/>Skriv en test der fejler"] --> Green["GREEN<br/>Skriv mindst mulig kode<br/>sÃ¥ testen bestÃ¥r"]
  Green --> Refactor["REFACTOR<br/>Ryd op - testen holder dig Ã¦rlig"]
  Refactor --> Red
`

export default function UnitPageDa() {
  const { lang } = useLanguage()
  const objective = getObjectiveByPath('/test/unit')

  return (
    <LessonLayout module="test">
      <h1>Unit testing</h1>
      {objective ? (
        <p>
          <ObjectiveBadge level={objective.level} /> {objectiveTitle(objective, lang)}
        </p>
      ) : (
        <p>
          <ObjectiveBadge level="H3" /> LÃ¦rlingen kan anvende forskellige relevante testmetodikker og
          gennemfÃ¸re automatiserede tests pÃ¥ kode.
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
        src="/images/unit-book.png"
        alt="Forside pÃ¥ Unit Testing Principles, Practices, and Patterns"
        caption="Vladimir Khorikov: Unit Testing Principles, Practices, and Patterns"
      />

      <h2>LÃ¦ringsmÃ¥l</h2>
      <p>
        Efter denne lektion (Dag 26) skal du kunne tre ting. De er bevidst formuleret som handlinger â€“
        du skal kunne <em>gÃ¸re</em> dem, ikke bare genkende dem:
      </p>
      <ul>
        <li>
          Forklare, <strong>hvad en unit-test er</strong>, og hvorfor den adskiller sig fra
          integrations- og E2E-tests (isolation, hastighed, ansvar).
        </li>
        <li>
          Skrive en unit-test efter <strong>Arrange â€“ Act â€“ Assert</strong> i NUnit og bruge{' '}
          <strong>Moq</strong> til at erstatte afhÃ¦ngigheder bag interfaces.
        </li>
        <li>
          Vurdere kode skrevet af andre: Er den testbar? Hvilke tests mangler? Kan du skrive dem
          uden at Ã¦ndre produktionskoden mere end hÃ¸jst nÃ¸dvendigt?
        </li>
      </ul>

      <h2>Bogen bag lektionen</h2>
      <p>
        Pensum lÃ¦ner sig op ad <strong>Vladimir Khorikov â€“ Unit Testing Principles, Practices, and
        Patterns</strong> (Manning, 2020). Bogen er skrevet til .NET-udviklere og er kendt for at
        stille et ubehageligt, men vigtigt spÃ¸rgsmÃ¥l: <em>hvad gÃ¸r en unit-test god?</em> Khorikov
        peger pÃ¥ fire sÃ¸jler, som vi vender tilbage til i hele faget:
      </p>
      <ol>
        <li>
          <strong>Beskyttelse mod regressioner</strong> â€“ fanger testen rent faktisk fejl, nÃ¥r kode
          Ã¦ndres?
        </li>
        <li>
          <strong>Modstandsdygtighed over for refaktorering</strong> â€“ gÃ¥r testen kun rÃ¸d, nÃ¥r
          adfÃ¦rden er forkert, og ikke bare fordi du omdÃ¸bte en privat metode?
        </li>
        <li>
          <strong>Hurtig feedback</strong> â€“ kan hele suiten kÃ¸re pÃ¥ sekunder?
        </li>
        <li>
          <strong>Vedligeholdelighed</strong> â€“ er testen let at lÃ¦se og let at kÃ¸re?
        </li>
      </ol>
      <Callout type="info">
        Du skal ikke have lÃ¦st hele bogen. Brug den som opslagsvÃ¦rk og som kilde, nÃ¥r du i
        eksamen eller pÃ¥ jobbet skal <em>begrunde</em>, hvorfor en test er god eller dÃ¥rlig.
      </Callout>

      <h2>Teststrategi: unit nu â€“ integration og E2E senere</h2>
      <p>
        En teststrategi er en plan for, <em>hvilke typer tests</em> du skriver, <em>hvor mange</em>,
        og <em>hvornÃ¥r</em>. I pensum arbejder vi i tre lag. Vi starter i bunden med unit-tests, fordi
        de er hurtigst at skrive og kÃ¸re, og fordi de tvinger dig til at designe kode med klare
        grÃ¦nseflader. Integrationstests (lektionen om integration) og end-to-end-tests (lektionen
        om Bruno og E2E) kommer senere i forlÃ¸bet og bygger ovenpÃ¥.
      </p>
      <Figure
        src="/images/test-strategy.png"
        alt="Oversigt over teststrategi: unit, integration og E2E"
        caption="Teststrategi: mange hurtige tests i bunden, fÃ¥ realistiske tests i toppen."
      />
      <MermaidDiagram chart={strategyChart} />
      <Figure
        src="/images/test-pyramid-coverage.png"
        alt="Testpyramide med dÃ¦kningsgrad"
        caption="Pyramiden fortÃ¦ller om mÃ¦ngde. DÃ¦kningsgrad (code coverage) fortÃ¦ller kun, hvilke linjer der blev kÃ¸rt â€“ ikke om de blev testet godt."
      />
      <Callout type="warn">
        HÃ¸j <strong>code coverage</strong> er ikke det samme som gode tests. En test uden asserts
        kan give 100 % coverage og ingen beskyttelse. Brug coverage til at finde <em>blinde
        pletter</em> â€“ ikke som mÃ¥l i sig selv.
      </Callout>

      <h2>Hvad er en unit-test?</h2>
      <p>
        Khorikov definerer en unit-test ved tre egenskaber: den verificerer en lille stump adfÃ¦rd
        (en <em>unit</em>), den gÃ¸r det hurtigt, og den gÃ¸r det i <strong>isolation</strong> fra andre
        tests. Den klassiske skole (Detroit/classicist) betragter en unit som en <em>adfÃ¦rd</em> og
        isolerer tests fra hinanden. London-skolen (mockist) isolerer i stedet klassen fra alle dens
        afhÃ¦ngigheder med mocks. Vi bruger en pragmatisk blanding: rigtige objekter, hvor de er
        simple og hurtige, og Moq, hvor afhÃ¦ngigheden er langsom, uforudsigelig eller har
        bivirkninger (mail, database, netvÃ¦rk, tid).
      </p>

      <h2>AAA-mÃ¸nsteret: Arrange â€“ Act â€“ Assert</h2>
      <p>
        NÃ¦sten alle gode unit-tests har samme tredelte form. <strong>Arrange</strong> opsÃ¦tter det,
        der skal testes (objekter, testdata, mocks). <strong>Act</strong> kalder prÃ¦cis den ene
        operation, du vil teste. <strong>Assert</strong> kontrollerer resultatet. Hold de tre
        blokke adskilt med en tom linje, og lad Act vÃ¦re <em>Ã©n linje</em> â€“ hvis du skal bruge
        flere, er enheden sandsynligvis for stor, eller API'et for ubekvemt.
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

        // Act + Assert (exceptions testes samlet)
        Assert.Throws<ArgumentOutOfRangeException>(
            () => calculator.ApplyDiscount(100m, percent: -5));
    }
}`}</CodeBlock>
      <Callout type="tip">
        Navngiv tests efter mÃ¸nsteret <code>Metode_Scenarie_ForventetResultat</code>. NÃ¥r en test
        fejler i CI, skal navnet alene fortÃ¦lle dig, hvad der er galt â€“ uden at Ã¥bne filen.
      </Callout>

      <h3>Assert.That (constraint model) vs. classic NUnit</h3>
      <p>
        NUnit har to stilarter. Den <strong>classic model</strong> (<code>Assert.AreEqual</code>,{' '}
        <code>Assert.IsTrue</code> osv.) er den gamle; den er flyttet til en separat namespace og
        nye features tilfÃ¸jes ikke til den. Den <strong>constraint model</strong> (
        <code>Assert.That(actual, Is.EqualTo(expected))</code>) er anbefalet i dag: den lÃ¦ses som
        en sÃ¦tning, har bedre fejlbeskeder og kan kombineres (<code>Is.Not.Null.And.Length.GreaterThan(3)</code>).
      </p>
      <CodeBlock language="csharp">{`// CLASSIC (undgÃ¥ i ny kode) - rÃ¦kkefÃ¸lgen (expected, actual) er let at bytte om
Assert.AreEqual(180m, result);
Assert.IsTrue(user.IsActive);
Assert.IsNotNull(user.Email);

// CONSTRAINT MODEL (anbefalet) - actual fÃ¸rst, sÃ¥ en lÃ¦sbar constraint
Assert.That(result, Is.EqualTo(180m));
Assert.That(user.IsActive, Is.True);
Assert.That(user.Email, Is.Not.Null.And.Contains("@"));

// Flere asserts i samme test uden at stoppe ved fÃ¸rste fejl
Assert.Multiple(() =>
{
    Assert.That(order.Total, Is.EqualTo(250m));
    Assert.That(order.Lines, Has.Count.EqualTo(2));
    Assert.That(order.Status, Is.EqualTo(OrderStatus.Created));
});`}</CodeBlock>
      <p>
        Ved fejl giver constraint-modellen en besked som <code>Expected: 180 But was: 200</code> â€“
        classic-modellen gÃ¸r det ogsÃ¥, men fejler du pÃ¥ rÃ¦kkefÃ¸lgen af argumenterne, bliver
        beskeden direkte misvisende. Det er en lille ting, der sparer meget fejlsÃ¸gning.
      </p>

      <h2>Interfaces og Moq â€“ eksempel fra h4-mags (IMailService)</h2>
      <p>
        Hvis en klasse selv opretter sine afhÃ¦ngigheder (<code>new SmtpClient()</code>), kan du ikke
        teste den uden at sende rigtige mails. LÃ¸sningen er at lade klassen <em>modtage</em> et
        interface via konstruktÃ¸ren (<strong>Dependency Injection</strong>). I h4-mags bruges et{' '}
        <code>IMailService</code>, som produktionskoden implementerer med rigtig SMTP, og som testen
        erstatter med en <strong>Moq</strong>-mock.
      </p>
      <CodeBlock language="csharp">{`// Produktionskode: kontrakten
public interface IMailService
{
    Task SendAsync(string to, string subject, string body);
}

// Produktionskode: klassen der bruger den
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
            throw new ArgumentException("E-mail er pÃ¥krÃ¦vet", nameof(email));

        var user = new User { Email = email, Name = name };
        await _users.AddAsync(user);
        await _mail.SendAsync(email, "Velkommen", $"Hej {name}, tak fordi du oprettede dig!");
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
        // Arrange - ingen opsÃ¦tning nÃ¸dvendig, Moq returnerer completed Task som standard

        // Act
        await _sut.RegisterAsync("anna@example.com", "Anna");

        // Assert - verificÃ©r at kollaboratÃ¸ren blev kaldt med de rigtige data
        _mail.Verify(m => m.SendAsync(
            "anna@example.com",
            "Velkommen",
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
        // Arrange - Setup lader os simulere en fejl, der er svÃ¦r at fremprovokere i virkeligheden
        _mail.Setup(m => m.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
             .ThrowsAsync(new InvalidOperationException("SMTP nede"));

        // Act + Assert
        Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.RegisterAsync("anna@example.com", "Anna"));
    }
}`}</CodeBlock>
      <Callout type="info">
        <strong>Stub vs. mock.</strong> En <em>stub</em> leverer data til koden (<code>Setup</code>{' '}
        + <code>Returns</code>) â€“ du asserter ikke pÃ¥ kaldet. En <em>mock</em> verificerer et udgÃ¥ende
        kald (<code>Verify</code>). Khorikov rÃ¥der: mock kun <em>udgÃ¥ende</em> kald, der er
        observerbare uden for din applikation (som en mail). VerificÃ©r ikke interne kald mellem
        egne klasser â€“ det gÃ¸r testen skrÃ¸belig over for refaktorering.
      </Callout>

      <h3>Tabel over interfaces (testsÃ¸mme)</h3>
      <p>
        Interfaces er de <em>sÃ¸mme</em> i koden, hvor du kan skille systemet ad og indsÃ¦tte en
        testversion. Typiske kandidater i en webapplikation:
      </p>
      <table>
        <thead>
          <tr>
            <th>Interface</th>
            <th>Ansvar</th>
            <th>Hvorfor erstatte i unit-test?</th>
            <th>Typisk test-double</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>IMailService</code>
            </td>
            <td>Sender e-mails</td>
            <td>MÃ¥ ikke sende rigtige mails; langsom og har bivirkninger</td>
            <td>Mock (Verify)</td>
          </tr>
          <tr>
            <td>
              <code>IUserRepository</code>
            </td>
            <td>Henter/gemmer brugere i databasen</td>
            <td>Database er langsom og krÃ¦ver opsÃ¦tning</td>
            <td>Stub / fake in-memory</td>
          </tr>
          <tr>
            <td>
              <code>IDateTimeProvider</code>
            </td>
            <td>Leverer nuvÃ¦rende tid</td>
            <td>Tid er ikke deterministisk â€“ tests ville fejle i weekender eller ved midnat</td>
            <td>Stub (fast tidspunkt)</td>
          </tr>
          <tr>
            <td>
              <code>IPaymentGateway</code>
            </td>
            <td>Kalder ekstern betalingstjeneste</td>
            <td>NetvÃ¦rk, penge og rate limits</td>
            <td>Mock / stub</td>
          </tr>
          <tr>
            <td>
              <code>IHttpClientFactory</code> / API-klient
            </td>
            <td>Kalder tredjeparts-API</td>
            <td>AfhÃ¦nger af netvÃ¦rk og andres oppetid</td>
            <td>Stub med fast respons</td>
          </tr>
          <tr>
            <td>
              <code>ILogger&lt;T&gt;</code>
            </td>
            <td>Logning</td>
            <td>SjÃ¦ldent relevant â€“ brug en NullLogger i stedet for mock</td>
            <td>Null object</td>
          </tr>
        </tbody>
      </table>

      <h2>Principper: isolation, hastighed og Dependency Injection</h2>
      <Figure
        src="/images/isolation.png"
        alt="Illustration af isolation i unit-tests"
        caption="Ã‰n test, Ã©n adfÃ¦rd â€“ ingen delt tilstand mellem tests."
      />
      <h3>Isolation</h3>
      <p>
        Hver test skal kunne kÃ¸re <strong>alene, i vilkÃ¥rlig rÃ¦kkefÃ¸lge og parallelt</strong> og give
        samme resultat. Det betyder: ingen delt statisk tilstand, ingen fÃ¦lles database, ingen
        afhÃ¦ngighed af, at en anden test har kÃ¸rt fÃ¸rst. Brug <code>[SetUp]</code> til at bygge friske
        objekter til hver test, sÃ¥ ingen tests arver rod fra hinanden. Bryder du isolationen, fÃ¥r
        du de vÃ¦rste tests: dem, der kun fejler nogle gange (<em>flaky tests</em>).
      </p>
      <h3>Hastighed</h3>
      <p>
        En unit-test bÃ¸r tage <strong>millisekunder</strong>. Hundredvis af tests skal kunne
        kÃ¸re pÃ¥ fÃ¥ sekunder, sÃ¥ du faktisk kÃ¸rer dem efter hver lille Ã¦ndring. Rammer en test
        filsystem, netvÃ¦rk eller database, er den ikke lÃ¦ngere en unit-test â€“ den er en
        integrationstest, og den hÃ¸rer til i et andet lag, der kÃ¸rer sjÃ¦ldnere.
      </p>
      <h3>Dependency Injection (DI)</h3>
      <p>
        DI er forudsÃ¦tningen for begge dele. NÃ¥r klassen fÃ¥r sine afhÃ¦ngigheder udefra (via
        konstruktÃ¸ren), kan testen indsÃ¦tte falske versioner; i produktion indsÃ¦tter ASP.NET Cores
        DI-container (<code>builder.Services.AddScoped&lt;IMailService, SmtpMailService&gt;()</code>)
        de rigtige. Samme klasse, to verdener â€“ og det uden at Ã¦ndre en linje i klassen.
      </p>
      <Callout type="danger">
        Kald aldrig <code>DateTime.Now</code>, <code>new HttpClient()</code> eller{' '}
        <code>new SqlConnection()</code> dybt inde i forretningslogik. Det er skjulte afhÃ¦ngigheder,
        og de gÃ¸r koden nÃ¦sten umulig at unit-teste.
      </Callout>

      <h2>Hvorfor fÃ¸les tests langsomme i starten?</h2>
      <Figure
        src="/images/tests-save-time.png"
        alt="Graf over hvordan tests sparer tid pÃ¥ sigt"
        caption="Tests koster tid i dag og sparer tid i morgen."
      />
      <MermaidDiagram chart={slowEarlyChart} />
      <p>
        Figuren viser to forlÃ¸b. <strong>Med tests</strong> bruger du ekstra tid i begyndelsen: du
        skal lÃ¦re vÃ¦rktÃ¸jerne, skrive testkode ved siden af produktionskode og tÃ¦nke over design,
        sÃ¥ koden bliver testbar. Det <em>fÃ¸les</em> langsomt, fordi du sammenligner med at "bare
        skrive koden". <strong>Uden tests</strong> er du hurtig i de fÃ¸rste dage â€“ men hver ny
        Ã¦ndring krÃ¦ver manuel gentest af alt, der kunne vÃ¦re pÃ¥virket. EfterhÃ¥nden som
        systemet vokser, vokser den manuelle gentest hurtigere end din kode, og du ender med at
        undgÃ¥ at rÃ¸re ved noget af frygt for at Ã¸delÃ¦gge det.
      </p>
      <p>
        SkÃ¦ringspunktet kommer typisk efter uger, ikke dage. Tests er en <em>investering med
        forrentning</em>: dyr i dag, billig bagefter. Netop derfor er det en udfordring at holde
        fast i dem under deadline-pres â€“ og derfor har CI (se lektionen om CI/CD) sÃ¥ stor vÃ¦rdi: den
        kÃ¸rer testene for dig, hver gang.
      </p>

      <h2>TDD: red â€“ green â€“ refactor</h2>
      <Figure
        src="/images/tdd.png"
        alt="TDD-cyklus: red, green, refactor"
        caption="Test-Driven Development i tre smÃ¥ skridt."
      />
      <MermaidDiagram chart={tddChart} />
      <p>
        <strong>Test-Driven Development</strong> vender rÃ¦kkefÃ¸lgen om: du skriver testen fÃ¸rst. I{' '}
        <strong>Red</strong> skriver du en test for adfÃ¦rd, der ikke findes endnu, og ser den fejle
        (sÃ¥ ved du, at testen kan fejle). I <strong>Green</strong> skriver du den <em>mindst
        mulige</em> kode, der fÃ¥r testen til at bestÃ¥ â€“ ogsÃ¥ hvis den er grim. I <strong>Refactor</strong>{' '}
        rydder du op i bÃ¥de kode og test, mens testene vogter dig mod at Ã¸delÃ¦gge noget. SÃ¥ starter
        du forfra med nÃ¦ste lille krav.
      </p>
      <table>
        <thead>
          <tr>
            <th>Brug TDD, nÃ¥râ€¦</th>
            <th>Spring TDD over, nÃ¥râ€¦</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Forretningsreglerne er klare (beregninger, validering, tilstandsmaskiner)</td>
            <td>Du udforsker et ukendt API eller laver en hurtig prototype/spike</td>
          </tr>
          <tr>
            <td>Du retter en bug: skriv fÃ¸rst en test der gengiver den, sÃ¥ ret den</td>
            <td>Koden er ren UI-opsÃ¦tning, konfiguration eller "limkode" uden logik</td>
          </tr>
          <tr>
            <td>Du er usikker pÃ¥ design â€“ testen tvinger dig til at bruge din egen API</td>
            <td>Kravene Ã¦ndrer sig time for time, og testene ville blive smidt ud</td>
          </tr>
          <tr>
            <td>Koden er kritisk (penge, sikkerhed, sundhed)</td>
            <td>Du arver legacy-kode uden test â€“ start med karakteriserende tests i stedet</td>
          </tr>
        </tbody>
      </table>
      <Callout type="tip">
        TDD er et vÃ¦rktÃ¸j, ikke en religion. Mange erfarne udviklere skriver tests <em>lige
        efter</em> koden, mens detaljerne stadig er friske. Det vigtige er, at tests skrives â€“
        og at koden er designet, sÃ¥ den <em>kan</em> testes.
      </Callout>

      <h2>Ã˜velse: skriv tests pÃ¥ andres kode</h2>
      <p>
        At teste din egen kode er svÃ¦rt, fordi du kender den for godt og ubevidst tester de
        scenarier, du allerede har tÃ¦nkt pÃ¥. At teste <strong>andres</strong> kode tvinger dig til at lÃ¦se
        kontrakten og stille kritiske spÃ¸rgsmÃ¥l. GÃ¸r fÃ¸lgende i par:
      </p>
      <ol>
        <li>
          Byt repository med en makker (eller brug h4-mags). VÃ¦lg <strong>Ã©n klasse med
          forretningslogik</strong> â€“ ikke en controller eller en DbContext.
        </li>
        <li>
          LÃ¦s koden og skriv en liste over <strong>mindst 5 scenarier</strong>: normalforlÃ¸b,
          grÃ¦nsevÃ¦rdier (0, tom streng, <code>null</code>), ugyldige input og fejl fra afhÃ¦ngigheder.
        </li>
        <li>
          Opret et NUnit-testprojekt (<code>dotnet new nunit</code>), tilfÃ¸j Moq (
          <code>dotnet add package Moq</code>) og skriv testene efter AAA.
        </li>
        <li>
          Er klassen svÃ¦r at teste (statiske kald, <code>new</code> pÃ¥ afhÃ¦ngigheder)? NotÃ©r hvorfor,
          og foreslÃ¥ et interface, der ville lÃ¸se det. Det er en lige sÃ¥ vÃ¦rdifuld aflevering som
          selve testene.
        </li>
        <li>
          KÃ¸r <code>dotnet test</code>. Fandt I en bug? FortÃ¦l makkeren â€“ det er hele pointen.
        </li>
      </ol>
      <CodeBlock language="bash">{`dotnet new nunit -n Shop.Tests
cd Shop.Tests
dotnet add package Moq
dotnet add reference ../Shop/Shop.csproj
dotnet test`}</CodeBlock>

      <h3>Tjekliste til en god unit-test</h3>
      <ul>
        <li>Tester den adfÃ¦rd, ikke implementering?</li>
        <li>Har den Ã©t tydeligt Act og klare asserts?</li>
        <li>Kan den kÃ¸re alene, parallelt og pÃ¥ under en halv sekund?</li>
        <li>Fejler den, hvis jeg indsÃ¦tter en bevidst fejl i koden (mutation i hovedet)?</li>
        <li>Overlever den, hvis jeg refaktorerer uden at Ã¦ndre adfÃ¦rd?</li>
        <li>FortÃ¦ller navnet, hvad der er galt, nÃ¥r den fejler?</li>
      </ul>
    </LessonLayout>
  )
}
