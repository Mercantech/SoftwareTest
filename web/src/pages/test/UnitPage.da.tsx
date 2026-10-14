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
  E2E -. "få, sekunder/minutter" .-> Dyr["Dyr men realistisk"]
`

const slowEarlyChart = `
flowchart LR
  A["Uge 1<br/>Skriv test + kode"] --> B["Uge 2-3<br/>Ekstra arbejde<br/>(oplevet som langsomt)"]
  B --> C["Uge 4+<br/>Refaktorering uden frygt"]
  C --> D["Måned 3+<br/>Fejl fanges af tests<br/>i stedet for af brugere"]
  M["Uden tests"] --> N["Hurtigt i starten"]
  N --> O["Manuel gentest hver gang"]
  O --> P["Bugs og frygt for at røre koden"]
`

const tddChart = `
flowchart LR
  Red["RED<br/>Skriv en test der fejler"] --> Green["GREEN<br/>Skriv mindst mulig kode<br/>så testen består"]
  Green --> Refactor["REFACTOR<br/>Ryd op - testen holder dig ærlig"]
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
          <ObjectiveBadge level="H3" /> Lærlingen kan anvende forskellige relevante testmetodikker og
          gennemføre automatiserede tests på kode.
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
        alt="Forside på Unit Testing Principles, Practices, and Patterns"
        caption="Vladimir Khorikov: Unit Testing Principles, Practices, and Patterns"
      />

      <h2>Læringsmål</h2>
      <p>
        Efter denne lektion (Dag 26) skal du kunne tre ting. De er bevidst formuleret som handlinger –
        du skal kunne <em>gøre</em> dem, ikke bare genkende dem:
      </p>
      <ul>
        <li>
          Forklare, <strong>hvad en unit-test er</strong>, og hvorfor den adskiller sig fra
          integrations- og E2E-tests (isolation, hastighed, ansvar).
        </li>
        <li>
          Skrive en unit-test efter <strong>Arrange – Act – Assert</strong> i NUnit og bruge{' '}
          <strong>Moq</strong> til at erstatte afhængigheder bag interfaces.
        </li>
        <li>
          Vurdere kode skrevet af andre: Er den testbar? Hvilke tests mangler? Kan du skrive dem
          uden at ændre produktionskoden mere end højst nødvendigt?
        </li>
      </ul>

      <h2>Bogen bag lektionen</h2>
      <p>
        Pensum læner sig op ad <strong>Vladimir Khorikov – Unit Testing Principles, Practices, and
        Patterns</strong> (Manning, 2020). Bogen er skrevet til .NET-udviklere og er kendt for at
        stille et ubehageligt, men vigtigt spørgsmål: <em>hvad gør en unit-test god?</em> Khorikov
        peger på fire søjler, som vi vender tilbage til i hele faget:
      </p>
      <ol>
        <li>
          <strong>Beskyttelse mod regressioner</strong> – fanger testen rent faktisk fejl, når kode
          ændres?
        </li>
        <li>
          <strong>Modstandsdygtighed over for refaktorering</strong> – går testen kun rød, når
          adfærden er forkert, og ikke bare fordi du omdøbte en privat metode?
        </li>
        <li>
          <strong>Hurtig feedback</strong> – kan hele suiten køre på sekunder?
        </li>
        <li>
          <strong>Vedligeholdelighed</strong> – er testen let at læse og let at køre?
        </li>
      </ol>
      <Callout type="info">
        Du skal ikke have læst hele bogen. Brug den som opslagsværk og som kilde, når du i
        eksamen eller på jobbet skal <em>begrunde</em>, hvorfor en test er god eller dårlig.
      </Callout>

      <h2>Teststrategi: unit nu – integration og E2E senere</h2>
      <p>
        En teststrategi er en plan for, <em>hvilke typer tests</em> du skriver, <em>hvor mange</em>,
        og <em>hvornår</em>. I pensum arbejder vi i tre lag. Vi starter i bunden med unit-tests, fordi
        de er hurtigst at skrive og køre, og fordi de tvinger dig til at designe kode med klare
        grænseflader. Integrationstests (lektionen om integration) og end-to-end-tests (lektionen
        om Bruno og E2E) kommer senere i forløbet og bygger ovenpå.
      </p>
      <Figure
        src="/images/test-strategy.png"
        alt="Oversigt over teststrategi: unit, integration og E2E"
        caption="Teststrategi: mange hurtige tests i bunden, få realistiske tests i toppen."
      />
      <MermaidDiagram chart={strategyChart} />
      <Figure
        src="/images/test-pyramid-coverage.png"
        alt="Testpyramide med dækningsgrad"
        caption="Pyramiden fortæller om mængde. Dækningsgrad (code coverage) fortæller kun, hvilke linjer der blev kørt – ikke om de blev testet godt."
      />
      <Callout type="warn">
        Høj <strong>code coverage</strong> er ikke det samme som gode tests. En test uden asserts
        kan give 100 % coverage og ingen beskyttelse. Brug coverage til at finde <em>blinde
        pletter</em> – ikke som mål i sig selv.
      </Callout>

      <h2>Hvad er en unit-test?</h2>
      <p>
        Khorikov definerer en unit-test ved tre egenskaber: den verificerer en lille stump adfærd
        (en <em>unit</em>), den gør det hurtigt, og den gør det i <strong>isolation</strong> fra andre
        tests. Den klassiske skole (Detroit/classicist) betragter en unit som en <em>adfærd</em> og
        isolerer tests fra hinanden. London-skolen (mockist) isolerer i stedet klassen fra alle dens
        afhængigheder med mocks. Vi bruger en pragmatisk blanding: rigtige objekter, hvor de er
        simple og hurtige, og Moq, hvor afhængigheden er langsom, uforudsigelig eller har
        bivirkninger (mail, database, netværk, tid).
      </p>

      <h2>AAA-mønsteret: Arrange – Act – Assert</h2>
      <p>
        Næsten alle gode unit-tests har samme tredelte form. <strong>Arrange</strong> opsætter det,
        der skal testes (objekter, testdata, mocks). <strong>Act</strong> kalder præcis den ene
        operation, du vil teste. <strong>Assert</strong> kontrollerer resultatet. Hold de tre
        blokke adskilt med en tom linje, og lad Act være <em>én linje</em> – hvis du skal bruge
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
        Navngiv tests efter mønsteret <code>Metode_Scenarie_ForventetResultat</code>. Når en test
        fejler i CI, skal navnet alene fortælle dig, hvad der er galt – uden at åbne filen.
      </Callout>

      <h3>Assert.That (constraint model) vs. classic NUnit</h3>
      <p>
        NUnit har to stilarter. Den <strong>classic model</strong> (<code>Assert.AreEqual</code>,{' '}
        <code>Assert.IsTrue</code> osv.) er den gamle; den er flyttet til en separat namespace og
        nye features tilføjes ikke til den. Den <strong>constraint model</strong> (
        <code>Assert.That(actual, Is.EqualTo(expected))</code>) er anbefalet i dag: den læses som
        en sætning, har bedre fejlbeskeder og kan kombineres (<code>Is.Not.Null.And.Length.GreaterThan(3)</code>).
      </p>
      <CodeBlock language="csharp">{`// CLASSIC (undgå i ny kode) - rækkefølgen (expected, actual) er let at bytte om
Assert.AreEqual(180m, result);
Assert.IsTrue(user.IsActive);
Assert.IsNotNull(user.Email);

// CONSTRAINT MODEL (anbefalet) - actual først, så en læsbar constraint
Assert.That(result, Is.EqualTo(180m));
Assert.That(user.IsActive, Is.True);
Assert.That(user.Email, Is.Not.Null.And.Contains("@"));

// Flere asserts i samme test uden at stoppe ved første fejl
Assert.Multiple(() =>
{
    Assert.That(order.Total, Is.EqualTo(250m));
    Assert.That(order.Lines, Has.Count.EqualTo(2));
    Assert.That(order.Status, Is.EqualTo(OrderStatus.Created));
});`}</CodeBlock>
      <p>
        Ved fejl giver constraint-modellen en besked som <code>Expected: 180 But was: 200</code> –
        classic-modellen gør det også, men fejler du på rækkefølgen af argumenterne, bliver
        beskeden direkte misvisende. Det er en lille ting, der sparer meget fejlsøgning.
      </p>

      <h2>Interfaces og Moq – eksempel fra h4-mags (IMailService)</h2>
      <p>
        Hvis en klasse selv opretter sine afhængigheder (<code>new SmtpClient()</code>), kan du ikke
        teste den uden at sende rigtige mails. Løsningen er at lade klassen <em>modtage</em> et
        interface via konstruktøren (<strong>Dependency Injection</strong>). I h4-mags bruges et{' '}
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
            throw new ArgumentException("E-mail er påkrævet", nameof(email));

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
        // Arrange - ingen opsætning nødvendig, Moq returnerer completed Task som standard

        // Act
        await _sut.RegisterAsync("anna@example.com", "Anna");

        // Assert - verificér at kollaboratøren blev kaldt med de rigtige data
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
        // Arrange - Setup lader os simulere en fejl, der er svær at fremprovokere i virkeligheden
        _mail.Setup(m => m.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
             .ThrowsAsync(new InvalidOperationException("SMTP nede"));

        // Act + Assert
        Assert.ThrowsAsync<InvalidOperationException>(
            () => _sut.RegisterAsync("anna@example.com", "Anna"));
    }
}`}</CodeBlock>
      <Callout type="info">
        <strong>Stub vs. mock.</strong> En <em>stub</em> leverer data til koden (<code>Setup</code>{' '}
        + <code>Returns</code>) – du asserter ikke på kaldet. En <em>mock</em> verificerer et udgående
        kald (<code>Verify</code>). Khorikov råder: mock kun <em>udgående</em> kald, der er
        observerbare uden for din applikation (som en mail). Verificér ikke interne kald mellem
        egne klasser – det gør testen skrøbelig over for refaktorering.
      </Callout>

      <h3>Tabel over interfaces (testsømme)</h3>
      <p>
        Interfaces er de <em>sømme</em> i koden, hvor du kan skille systemet ad og indsætte en
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
            <td>Må ikke sende rigtige mails; langsom og har bivirkninger</td>
            <td>Mock (Verify)</td>
          </tr>
          <tr>
            <td>
              <code>IUserRepository</code>
            </td>
            <td>Henter/gemmer brugere i databasen</td>
            <td>Database er langsom og kræver opsætning</td>
            <td>Stub / fake in-memory</td>
          </tr>
          <tr>
            <td>
              <code>IDateTimeProvider</code>
            </td>
            <td>Leverer nuværende tid</td>
            <td>Tid er ikke deterministisk – tests ville fejle i weekender eller ved midnat</td>
            <td>Stub (fast tidspunkt)</td>
          </tr>
          <tr>
            <td>
              <code>IPaymentGateway</code>
            </td>
            <td>Kalder ekstern betalingstjeneste</td>
            <td>Netværk, penge og rate limits</td>
            <td>Mock / stub</td>
          </tr>
          <tr>
            <td>
              <code>IHttpClientFactory</code> / API-klient
            </td>
            <td>Kalder tredjeparts-API</td>
            <td>Afhænger af netværk og andres oppetid</td>
            <td>Stub med fast respons</td>
          </tr>
          <tr>
            <td>
              <code>ILogger&lt;T&gt;</code>
            </td>
            <td>Logning</td>
            <td>Sjældent relevant – brug en NullLogger i stedet for mock</td>
            <td>Null object</td>
          </tr>
        </tbody>
      </table>

      <h2>Principper: isolation, hastighed og Dependency Injection</h2>
      <Figure
        src="/images/isolation.png"
        alt="Illustration af isolation i unit-tests"
        caption="Én test, én adfærd – ingen delt tilstand mellem tests."
      />
      <h3>Isolation</h3>
      <p>
        Hver test skal kunne køre <strong>alene, i vilkårlig rækkefølge og parallelt</strong> og give
        samme resultat. Det betyder: ingen delt statisk tilstand, ingen fælles database, ingen
        afhængighed af, at en anden test har kørt først. Brug <code>[SetUp]</code> til at bygge friske
        objekter til hver test, så ingen tests arver rod fra hinanden. Bryder du isolationen, får
        du de værste tests: dem, der kun fejler nogle gange (<em>flaky tests</em>).
      </p>
      <h3>Hastighed</h3>
      <p>
        En unit-test bør tage <strong>millisekunder</strong>. Hundredvis af tests skal kunne
        køre på få sekunder, så du faktisk kører dem efter hver lille ændring. Rammer en test
        filsystem, netværk eller database, er den ikke længere en unit-test – den er en
        integrationstest, og den hører til i et andet lag, der kører sjældnere.
      </p>
      <h3>Dependency Injection (DI)</h3>
      <p>
        DI er forudsætningen for begge dele. Når klassen får sine afhængigheder udefra (via
        konstruktøren), kan testen indsætte falske versioner; i produktion indsætter ASP.NET Cores
        DI-container (<code>builder.Services.AddScoped&lt;IMailService, SmtpMailService&gt;()</code>)
        de rigtige. Samme klasse, to verdener – og det uden at ændre en linje i klassen.
      </p>
      <Callout type="danger">
        Kald aldrig <code>DateTime.Now</code>, <code>new HttpClient()</code> eller{' '}
        <code>new SqlConnection()</code> dybt inde i forretningslogik. Det er skjulte afhængigheder,
        og de gør koden næsten umulig at unit-teste.
      </Callout>

      <h2>Hvorfor føles tests langsomme i starten?</h2>
      <Figure
        src="/images/tests-save-time.png"
        alt="Graf over hvordan tests sparer tid på sigt"
        caption="Tests koster tid i dag og sparer tid i morgen."
      />
      <MermaidDiagram chart={slowEarlyChart} />
      <p>
        Figuren viser to forløb. <strong>Med tests</strong> bruger du ekstra tid i begyndelsen: du
        skal lære værktøjerne, skrive testkode ved siden af produktionskode og tænke over design,
        så koden bliver testbar. Det <em>føles</em> langsomt, fordi du sammenligner med at "bare
        skrive koden". <strong>Uden tests</strong> er du hurtig i de første dage – men hver ny
        ændring kræver manuel gentest af alt, der kunne være påvirket. Efterhånden som
        systemet vokser, vokser den manuelle gentest hurtigere end din kode, og du ender med at
        undgå at røre ved noget af frygt for at ødelægge det.
      </p>
      <p>
        Skæringspunktet kommer typisk efter uger, ikke dage. Tests er en <em>investering med
        forrentning</em>: dyr i dag, billig bagefter. Netop derfor er det en udfordring at holde
        fast i dem under deadline-pres – og derfor har CI (se lektionen om CI/CD) så stor værdi: den
        kører testene for dig, hver gang.
      </p>

      <h2>TDD: red – green – refactor</h2>
      <Figure
        src="/images/tdd.png"
        alt="TDD-cyklus: red, green, refactor"
        caption="Test-Driven Development i tre små skridt."
      />
      <MermaidDiagram chart={tddChart} />
      <p>
        <strong>Test-Driven Development</strong> vender rækkefølgen om: du skriver testen først. I{' '}
        <strong>Red</strong> skriver du en test for adfærd, der ikke findes endnu, og ser den fejle
        (så ved du, at testen kan fejle). I <strong>Green</strong> skriver du den <em>mindst
        mulige</em> kode, der får testen til at bestå – også hvis den er grim. I <strong>Refactor</strong>{' '}
        rydder du op i både kode og test, mens testene vogter dig mod at ødelægge noget. Så starter
        du forfra med næste lille krav.
      </p>
      <table>
        <thead>
          <tr>
            <th>Brug TDD, når…</th>
            <th>Spring TDD over, når…</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Forretningsreglerne er klare (beregninger, validering, tilstandsmaskiner)</td>
            <td>Du udforsker et ukendt API eller laver en hurtig prototype/spike</td>
          </tr>
          <tr>
            <td>Du retter en bug: skriv først en test der gengiver den, så ret den</td>
            <td>Koden er ren UI-opsætning, konfiguration eller "limkode" uden logik</td>
          </tr>
          <tr>
            <td>Du er usikker på design – testen tvinger dig til at bruge din egen API</td>
            <td>Kravene ændrer sig time for time, og testene ville blive smidt ud</td>
          </tr>
          <tr>
            <td>Koden er kritisk (penge, sikkerhed, sundhed)</td>
            <td>Du arver legacy-kode uden test – start med karakteriserende tests i stedet</td>
          </tr>
        </tbody>
      </table>
      <Callout type="tip">
        TDD er et værktøj, ikke en religion. Mange erfarne udviklere skriver tests <em>lige
        efter</em> koden, mens detaljerne stadig er friske. Det vigtige er, at tests skrives –
        og at koden er designet, så den <em>kan</em> testes.
      </Callout>

      <h2>Øvelse: skriv tests på andres kode</h2>
      <p>
        At teste din egen kode er svært, fordi du kender den for godt og ubevidst tester de
        scenarier, du allerede har tænkt på. At teste <strong>andres</strong> kode tvinger dig til at læse
        kontrakten og stille kritiske spørgsmål. Gør følgende i par:
      </p>
      <ol>
        <li>
          Byt repository med en makker (eller brug h4-mags). Vælg <strong>én klasse med
          forretningslogik</strong> – ikke en controller eller en DbContext.
        </li>
        <li>
          Læs koden og skriv en liste over <strong>mindst 5 scenarier</strong>: normalforløb,
          grænseværdier (0, tom streng, <code>null</code>), ugyldige input og fejl fra afhængigheder.
        </li>
        <li>
          Opret et NUnit-testprojekt (<code>dotnet new nunit</code>), tilføj Moq (
          <code>dotnet add package Moq</code>) og skriv testene efter AAA.
        </li>
        <li>
          Er klassen svær at teste (statiske kald, <code>new</code> på afhængigheder)? Notér hvorfor,
          og foreslå et interface, der ville løse det. Det er en lige så værdifuld aflevering som
          selve testene.
        </li>
        <li>
          Kør <code>dotnet test</code>. Fandt I en bug? Fortæl makkeren – det er hele pointen.
        </li>
      </ol>
      <CodeBlock language="bash">{`dotnet new nunit -n Shop.Tests
cd Shop.Tests
dotnet add package Moq
dotnet add reference ../Shop/Shop.csproj
dotnet test`}</CodeBlock>

      <h3>Tjekliste til en god unit-test</h3>
      <ul>
        <li>Tester den adfærd, ikke implementering?</li>
        <li>Har den ét tydeligt Act og klare asserts?</li>
        <li>Kan den køre alene, parallelt og på under en halv sekund?</li>
        <li>Fejler den, hvis jeg indsætter en bevidst fejl i koden (mutation i hovedet)?</li>
        <li>Overlever den, hvis jeg refaktorerer uden at ændre adfærd?</li>
        <li>Fortæller navnet, hvad der er galt, når den fejler?</li>
      </ul>
    </LessonLayout>
  )
}
