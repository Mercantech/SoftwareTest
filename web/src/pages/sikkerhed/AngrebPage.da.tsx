import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'

const rootCause = `
flowchart LR
    A["Utroværdigt input fra bruger"] --> B{"Behandles input som DATA eller som KODE?"}
    B -->|"Blandes ind i kommando-tekst"| C["Injection-sårbarhed"]
    B -->|"Holdes adskilt - parametre og encoding"| D["Sikkert"]
`

const defenseLayers = `
flowchart TD
    I["Input"] --> V["1. Validering - allowlist af type, længde, format"]
    V --> P["2. Sikker API - parametre / ORM / frameworks escaping"]
    P --> O["3. Output-encoding i den rigtige kontekst"]
    O --> H["4. Headers - CSP, cookies HttpOnly og SameSite"]
    H --> L["5. Mindste rettigheder - DB-bruger, tokens"]
    L --> M["6. Logging og overvågning"]
`

const badSql = `// ❌ UNDGÅ: SQL bygges ved at sætte tekst fra brugeren sammen med forespørgslen.
// Brugerens input kan dermed ændre forespørgslens STRUKTUR - det er roden til SQL injection.
var sql = "SELECT * FROM Users WHERE Email = '" + email + "'";
using var cmd = new SqlCommand(sql, connection);

// Samme problem med string interpolation og string.Format:
var sql2 = $"SELECT * FROM Users WHERE Email = '{email}'";`

const goodAdo = `// ✅ Parameteriseret forespørgsel (ADO.NET)
// SQL-teksten er FAST. Værdien sendes separat som DATA og kan aldrig blive til SQL-kode.
using var cmd = new SqlCommand(
    "SELECT Id, Name FROM Users WHERE Email = @email", connection);
cmd.Parameters.Add("@email", SqlDbType.NVarChar, 256).Value = email;

using var reader = await cmd.ExecuteReaderAsync();`

const goodNpgsql = `// ✅ Npgsql (PostgreSQL - vores standard-database)
await using var cmd = new NpgsqlCommand(
    "SELECT id, name FROM users WHERE email = @email", dataSource.CreateConnection());
cmd.Parameters.AddWithValue("email", email);`

const goodEf = `// ✅ Entity Framework Core: LINQ parameteriserer automatisk
var user = await db.Users
    .Where(u => u.Email == email)
    .Select(u => new { u.Id, u.Name })
    .FirstOrDefaultAsync();

// ✅ Rå SQL i EF - brug FromSql (interpolation bliver til PARAMETRE, ikke tekst)
var users = await db.Users
    .FromSql($"SELECT * FROM users WHERE email = {email}")
    .ToListAsync();

// ❌ FromSqlRaw med sammensat tekst er farligt - brug kun FromSqlRaw med eksplicitte parametre:
// db.Users.FromSqlRaw("SELECT * FROM users WHERE email = {0}", email)  // OK: {0} er parameter`

const dynamicSort = `// Dynamisk ORDER BY / kolonnenavne kan IKKE parameteriseres - brug en allowlist
static readonly HashSet<string> AllowedSort = new() { "name", "created", "email" };

var sortBy = AllowedSort.Contains(requested) ? requested : "name";
query = sortBy switch
{
    "created" => query.OrderBy(u => u.Created),
    "email"   => query.OrderBy(u => u.Email),
    _         => query.OrderBy(u => u.Name),
};`

const validationExample = `// Validering på serveren (minimal API + DataAnnotations)
public record CreateCommentRequest(
    [property: Required, StringLength(500, MinimumLength = 1)] string Text,
    [property: Range(1, 5)] int Rating);

app.MapPost("/api/comments", (CreateCommentRequest req) =>
{
    // Validér (her: manuelt) - afvis med 400 hvis ugyldigt
    var ctx = new ValidationContext(req);
    var errors = new List<ValidationResult>();
    if (!Validator.TryValidateObject(req, ctx, errors, validateAllProperties: true))
        return Results.BadRequest(errors.Select(e => e.ErrorMessage));

    // ... gem (parameteriseret / EF)
    return Results.Created();
}).RequireAuthorization();`

const leastPriv = `-- Princippet om mindst mulige rettigheder: applikationens DB-bruger må kun det, den skal
CREATE ROLE app_user LOGIN PASSWORD '<fra secret store>';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- Ingen DROP, ingen CREATE, ikke superuser.
-- Migrationer kører med en SEPARAT bruger med flere rettigheder.`

const reactSafe = `// ✅ React encoder som standard - tekst bliver vist som tekst
function Comment({ text }: { text: string }) {
  return <p>{text}</p>   // <-- sikkert, selvom 'text' indeholder HTML-tegn
}

// ❌ dangerouslySetInnerHTML OMGÅR beskyttelsen. Navnet er en advarsel.
// <div dangerouslySetInnerHTML={{ __html: userHtml }} />

// ✅ Hvis I SKAL vise rig tekst/HTML fra brugere: sanitér med et dedikeret bibliotek (fx DOMPurify)
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userHtml)
// <div dangerouslySetInnerHTML={{ __html: clean }} />
// ...og kombinér stadig med en stram CSP.

// ❌ Undgå også at indsætte brugerdata i href/src uden at tjekke protokollen
function SafeLink({ url, children }: { url: string; children: React.ReactNode }) {
  const ok = /^https?:\\/\\//i.test(url) // kun http(s) - ikke fx javascript:
  return ok ? <a href={url} rel="noopener noreferrer">{children}</a> : <span>{children}</span>
}`

const razorEncoding = `@* Razor/Blazor encoder automatisk: *@
<p>@Model.Comment</p>            @* ✅ HTML-encodet *@

@* ❌ Html.Raw slår encoding fra - kun til indhold I selv kontrollerer *@
@Html.Raw(Model.Comment)

// I C# kode (fx ved generering af HTML i e-mails) - encode eksplicit:
var safe = System.Net.WebUtility.HtmlEncode(userText);`

const cspHeader = `# En stram Content-Security-Policy for en SPA (nginx)
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://auth.mercantec.tech; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;`

const cspAspNet = `// ASP.NET: sæt sikkerheds-headers som middleware
app.Use(async (ctx, next) =>
{
    var h = ctx.Response.Headers;
    h["Content-Security-Policy"] =
        "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
    h["X-Content-Type-Options"] = "nosniff";
    h["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});`

const cookieFlags = `// Cookies: gør dem svære at misbruge
options.Cookie.HttpOnly = true;                          // JS kan ikke læse den (begrænser skade ved XSS)
options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // kun HTTPS
options.Cookie.SameSite = SameSiteMode.Lax;              // sendes ikke ved cross-site POST (CSRF-forsvar)`

const antiforgery = `// ASP.NET Core: anti-forgery tokens til cookie-baserede formularer
builder.Services.AddAntiforgery();
app.UseAntiforgery();

// Razor Pages/MVC validerer automatisk med [ValidateAntiForgeryToken] / AutoValidateAntiforgeryToken.
// API'er med Bearer-token i Authorization-headeren er ikke sårbare på samme måde,
// fordi browseren ikke vedhæfter headeren automatisk.`

const errorHandling = `// Fejlhåndtering: log detaljer på serveren, giv generisk besked til klienten
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async ctx =>
    {
        var feature = ctx.Features.Get<IExceptionHandlerFeature>();
        logger.LogError(feature?.Error, "Uventet fejl"); // detaljer kun i log
        ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await ctx.Response.WriteAsJsonAsync(new { error = "Der opstod en fejl" }); // ingen stack trace / SQL-tekst
    });
});`

export default function AngrebPageDa() {
  const objective = getObjectiveByPath('/sikkerhed/angreb')

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Angreb og forsvar: SQL injection og XSS{' '}
        {objective ? <ObjectiveBadge level={objective.level} /> : null}
      </h1>
      {objective ? (
        <>
          <p>
            <em>Målpind #{objective.id}:</em> {objectiveTitle(objective, 'da')}
          </p>
          <LinkTrio
            sitePath={objective.sitePath}
            notionUrl={objective.notionUrl}
            repoUrl={objective.repoUrl}
          />
        </>
      ) : null}

      <Callout type="info">
        <strong>Fokus i denne lektion er forsvar.</strong> Vi forklarer <em>hvordan sårbarhederne opstår på konceptniveau</em>, og
        hvordan du bygger din egen applikation, så de ikke kan opstå. Vi viser ikke færdige angrebsstrenge eller trin-for-trin-fremgangsmåder.
        Test kun på systemer, du selv ejer eller eksplicit har tilladelse til at teste (se lektionen om tools).
      </Callout>

      <h2>Fælles rod: data bliver til kode</h2>
      <p>
        Langt de fleste "injection"-angreb – SQL injection, XSS, kommando-injection, LDAP-injection – har samme årsag:
        applikationen blander <strong>utroværdigt input</strong> ind i en tekststreng, som senere fortolkes af en interpreter
        (database, browser, shell). Hvis interpreteren ikke kan se forskel på "den kode, udvikleren skrev" og "de data, brugeren sendte", kan
        brugeren påvirke kodens betydning.
      </p>
      <MermaidDiagram chart={rootCause} />
      <p>
        Forsvaret følger direkte af årsagen: <strong>hold kode og data adskilt</strong>, og bring dataene ind via en mekanisme, der aldrig
        fortolker dem som kode (parametre, encoding).
      </p>

      <h2>SQL injection</h2>
      <h3>Hvad er det – og hvad kan det koste?</h3>
      <p>
        SQL injection (CWE-89) opstår, når en SQL-forespørgsel bygges ved at sætte tekst fra brugeren sammen med SQL. En angriber kan så
        ændre forespørgslens betydning og potentielt læse, ændre eller slette data, omgå login eller i værste fald få adgang til
        databaseserveren. Det er en af de mest ødelæggende og samtidig mest <em>forebyggelige</em> sårbarheder – og står under{' '}
        <strong>A03: Injection</strong> i OWASP Top 10.
      </p>

      <h3>Mønsteret man skal undgå</h3>
      <CodeBlock language="csharp">{badSql}</CodeBlock>
      <Callout type="danger">
        Hvis du ser <code>"..." + variabel + "..."</code> eller <code>$"... {'{'}variabel{'}'} ..."</code> inde i en SQL-tekst, er det et rødt flag i code review.
      </Callout>

      <h3>Forsvar 1: Parameteriserede forespørgsler (primært forsvar)</h3>
      <p>
        Databasen får SQL-teksten og værdierne <em>adskilt</em>. Forespørgslens struktur er fastlagt, før værdierne indsættes, så værdier
        aldrig kan ændre strukturen.
      </p>
      <CodeBlock language="csharp">{goodAdo}</CodeBlock>
      <CodeBlock language="csharp">{goodNpgsql}</CodeBlock>

      <h3>Forsvar 2: ORM som Entity Framework Core</h3>
      <p>
        LINQ-forespørgsler i EF Core parameteriseres automatisk. Pas på, når du skriver rå SQL.
      </p>
      <CodeBlock language="csharp">{goodEf}</CodeBlock>
      <Callout type="warn">
        En ORM er ikke en garanti. Rå SQL, dynamisk sammensatte <code>FromSqlRaw</code>-kald og stored procedures, der selv bygger SQL af tekst,
        kan stadig være sårbare.
      </Callout>

      <h3>Forsvar 3: Allowlist til det, der ikke kan parameteriseres</h3>
      <p>
        Tabel- og kolonnenavne, <code>ORDER BY</code>-retning og lignende kan ikke sendes som parametre. Lad aldrig brugeren levere dem direkte;
        vælg i stedet fra en fast liste.
      </p>
      <CodeBlock language="csharp">{dynamicSort}</CodeBlock>

      <h3>Forsvar 4: Validering, mindste rettigheder og fejlhåndtering</h3>
      <ul>
        <li>
          <strong>Inputvalidering</strong> (allowlist af type, længde, format) er et ekstra lag – <em>ikke</em> et alternativ til parametre.
          Blacklists og "fjern farlige tegn"-filtre er upålidelige.
        </li>
        <li>
          <strong>Mindste rettigheder</strong>: applikationens database-bruger må ikke være ejer/superuser. Så er skaden begrænset, hvis noget alligevel går galt.
        </li>
        <li>
          <strong>Skjul tekniske fejl</strong>: vis aldrig SQL-fejl eller stack traces til brugeren – de afslører strukturen i jeres database.
        </li>
        <li>
          <strong>Overvågning</strong>: log usædvanlige fejl og unormale mønstre; en WAF kan hjælpe som ekstra lag, men erstatter ikke sikker kode.
        </li>
      </ul>
      <CodeBlock language="csharp">{validationExample}</CodeBlock>
      <CodeBlock language="sql">{leastPriv}</CodeBlock>
      <CodeBlock language="csharp">{errorHandling}</CodeBlock>

      <h2>XSS – Cross-Site Scripting</h2>
      <h3>Hvad er det?</h3>
      <p>
        XSS (CWE-79) opstår, når en applikation viser utroværdigt indhold i en webside <em>uden korrekt encoding</em>, så browseren
        tolker det som en del af siden (HTML/JavaScript) frem for som ren tekst. Scriptet kører så i den besøgendes browser med
        sidens rettigheder: det kan fx læse data på siden, udføre handlinger på brugerens vegne eller forsøge at få fat i tokens.
      </p>
      <p>Der findes tre hovedtyper:</p>
      <table>
        <thead>
          <tr><th>Type</th><th>Kort forklaring</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Stored (persistent)</strong></td><td>Indholdet gemmes (fx kommentar) og vises senere til andre brugere.</td></tr>
          <tr><td><strong>Reflected</strong></td><td>Indhold fra requesten (fx søgeparameter) gengives direkte i svaret.</td></tr>
          <tr><td><strong>DOM-based</strong></td><td>Klient-side JavaScript skriver utroværdige data ind i DOM'en på en usikker måde.</td></tr>
        </tbody>
      </table>
      <Callout type="info">
        I en SPA med et stateless API er <em>stored</em> og <em>DOM-based</em> XSS de relevante risici: serveren gemmer brugerindhold, og
        frontenden viser det. Hvis tokens ligger i browseren, er konsekvensen af XSS ekstra stor – derfor er forsvaret så vigtigt.
      </Callout>

      <h3>Forsvar 1: Output-encoding (primært forsvar)</h3>
      <p>
        <strong>Encode data, når du skriver dem ud, tilpasset konteksten</strong> hvor de havner: HTML-tekst, HTML-attribut, JavaScript,
        URL eller CSS. Moderne frameworks gør det automatisk – <em>så længe man ikke aktivt omgår det</em>.
      </p>
      <table>
        <thead>
          <tr><th>Kontekst</th><th>Hvad gør I?</th></tr>
        </thead>
        <tbody>
          <tr><td>HTML-tekst</td><td>HTML-encode (<code>&amp;lt;</code> for &lt; osv.) – frameworkets standard</td></tr>
          <tr><td>HTML-attribut</td><td>Attribut-encode; citér altid attributværdier</td></tr>
          <tr><td>URL (href/src)</td><td>Tillad kun forventede protokoller (<code>https:</code>), URL-encode parametre</td></tr>
          <tr><td>JavaScript</td><td>Indsæt aldrig brugerdata i inline script – send dem som JSON/data-attributter</td></tr>
        </tbody>
      </table>

      <h3>React (frontend)</h3>
      <CodeBlock language="tsx">{reactSafe}</CodeBlock>
      <ul>
        <li>Undgå <code>dangerouslySetInnerHTML</code>, <code>innerHTML</code>, <code>document.write</code> og <code>eval</code> med brugerdata.</li>
        <li>Er rig tekst nødvendig, så brug Markdown-renderere med sanitering eller DOMPurify.</li>
        <li>Valider URL'er, før de bruges i <code>href</code>/<code>src</code>.</li>
      </ul>

      <h3>ASP.NET / Razor (backend)</h3>
      <CodeBlock language="razor">{razorEncoding}</CodeBlock>
      <p>
        Et JSON-API, der returnerer <code>Content-Type: application/json</code> og <code>X-Content-Type-Options: nosniff</code>, er i sig selv
        ikke et XSS-problem – faren opstår, når <em>frontenden</em> viser dataene usikkert.
      </p>

      <h3>Forsvar 2: Content Security Policy (CSP)</h3>
      <p>
        CSP er en HTTP-header, der fortæller browseren, hvilke kilder til scripts, billeder, forbindelser osv. der er tilladt. Selv hvis der
        findes en XSS-fejl, kan en stram CSP forhindre, at injiceret script kører, eller at data sendes til fremmede servere.
        CSP er et <strong>sikkerhedsnet</strong> (defense in depth), ikke en erstatning for encoding.
      </p>
      <CodeBlock language="nginx">{cspHeader}</CodeBlock>
      <CodeBlock language="csharp">{cspAspNet}</CodeBlock>
      <ul>
        <li>Start i <code>Content-Security-Policy-Report-Only</code>-tilstand, og se hvad der ville blive blokeret, før I håndhæver.</li>
        <li>Undgå <code>'unsafe-inline'</code> og <code>'unsafe-eval'</code> i <code>script-src</code>; brug nonces/hashes hvis inline scripts er nødvendige.</li>
        <li><code>frame-ancestors 'none'</code> beskytter desuden mod clickjacking.</li>
      </ul>

      <h3>Forsvar 3: Cookies og tokens</h3>
      <CodeBlock language="csharp">{cookieFlags}</CodeBlock>
      <p>
        Gem aldrig tokens i <code>localStorage</code> (se authentication-lektionen). <code>HttpOnly</code>-cookies kan ikke læses af JavaScript, hvilket
        begrænser skaden ved XSS – men XSS kan stadig udføre handlinger som brugeren, så målet er at forhindre XSS helt.
      </p>

      <h3>Defense in depth – lagene samlet</h3>
      <MermaidDiagram chart={defenseLayers} />

      <h2>CSRF – kort</h2>
      <p>
        <strong>Cross-Site Request Forgery</strong> får en indlogget brugers browser til ubevidst at sende en forespørgsel til en
        applikation, hvor brugeren har en cookie-session. Browseren vedhæfter automatisk cookies – også til forespørgsler, der udløses fra en
        fremmed side. Det er <em>et forsvar mod misbrug af automatisk vedhæftede legitimationer</em>.
      </p>
      <ul>
        <li><strong>SameSite-cookies</strong> (<code>Lax</code>/<code>Strict</code>) – moderne browsere sender dem ikke ved cross-site POST.</li>
        <li><strong>Anti-forgery tokens</strong> – et uforudsigeligt token pr. formular/session, som serveren kontrollerer.</li>
        <li><strong>Tjek <code>Origin</code>/<code>Referer</code></strong> og brug CORS med en eksplicit liste over tilladte origins.</li>
        <li><strong>Ændrende handlinger kun via POST/PUT/DELETE</strong> – aldrig via GET.</li>
        <li>
          <strong>Bearer-token i Authorization-headeren</strong> (som i vores SPA + API) er ikke udsat på samme måde, fordi browseren ikke
          sender den automatisk.
        </li>
      </ul>
      <CodeBlock language="csharp">{antiforgery}</CodeBlock>

      <h2>Øvrige injection-former (kort)</h2>
      <ul>
        <li>
          <strong>Kommando-injection</strong>: kald ikke shell med sammensatte strenge. Brug API'er, der tager argumenter som liste, og allowlist af tilladte værdier.
        </li>
        <li>
          <strong>Sti-manipulation (path traversal)</strong>: brug aldrig brugerinput direkte i filstier; normalisér og tjek, at stien ligger i den tilladte mappe.
        </li>
        <li>
          <strong>SSRF</strong>: lad ikke brugere angive vilkårlige URL'er, serveren kalder; brug allowlist.
        </li>
        <li>
          <strong>NoSQL/LDAP-injection</strong>: samme princip – brug parametre/typede API'er frem for sammensatte forespørgsler.
        </li>
      </ul>

      <h2>Tjekliste: sådan sikrer du din egen app</h2>
      <table>
        <thead>
          <tr><th>✔</th><th>Punkt</th></tr>
        </thead>
        <tbody>
          <tr><td>☐</td><td>Alle databaseforespørgsler er parameteriserede (ADO.NET-parametre eller EF/LINQ)</td></tr>
          <tr><td>☐</td><td>Ingen sammensatte SQL-strenge med brugerinput; allowlist til dynamiske kolonner/sortering</td></tr>
          <tr><td>☐</td><td>Server-side validering af alle input (type, længde, format)</td></tr>
          <tr><td>☐</td><td>Ingen brug af <code>dangerouslySetInnerHTML</code>/<code>Html.Raw</code> med brugerdata (eller sanitering + CSP)</td></tr>
          <tr><td>☐</td><td>CSP, <code>X-Content-Type-Options</code>, <code>Referrer-Policy</code> og <code>frame-ancestors</code> er sat</td></tr>
          <tr><td>☐</td><td>Cookies er <code>HttpOnly</code>, <code>Secure</code> og <code>SameSite</code>; tokens ikke i localStorage</td></tr>
          <tr><td>☐</td><td>CSRF-beskyttelse på cookie-baserede endpoints; CORS med eksplicit origin-liste</td></tr>
          <tr><td>☐</td><td>DB-bruger med mindst mulige rettigheder</td></tr>
          <tr><td>☐</td><td>Generiske fejlbeskeder til klienten; detaljer kun i server-log</td></tr>
          <tr><td>☐</td><td>Automatiske tests/scan i CI (SAST, dependency scan, ZAP baseline mod egen test-miljø)</td></tr>
        </tbody>
      </table>

      <h2>Test dit forsvar – på en etisk måde</h2>
      <p>
        Skriv <strong>automatiske tests</strong>, der dokumenterer, at jeres forsvar virker – uden at skulle kende "angrebsstrenge" udenad:
      </p>
      <ul>
        <li>
          <strong>Enhedstest</strong>: en søgning med specialtegn (fx apostrof, procenttegn, HTML-tegn i teksten) giver et korrekt resultat – hverken fejl eller
          uventede data.
        </li>
        <li>
          <strong>Rendering-test</strong>: en kommentar med HTML-tegn vises som <em>tekst</em>, ikke som markup.
        </li>
        <li>
          <strong>Header-test</strong>: integrationstest, der kontrollerer, at CSP og cookie-flags er sat.
        </li>
        <li>
          <strong>Scanner mod eget testmiljø</strong>: OWASP ZAP og lignende værktøjer (se tools-lektionen) finder typiske fejl systematisk.
        </li>
        <li>
          <strong>Code review og SAST</strong>: søg efter strengsammensætning i SQL, <code>Html.Raw</code>, <code>innerHTML</code>.
        </li>
      </ul>
      <Callout type="warn">
        Test aldrig sikkerhed mod systemer, du ikke ejer eller har skriftlig tilladelse til at teste – det kan være ulovligt (straffeloven §263 om
        uberettiget adgang til data). Brug eget testmiljø, ikke produktion, og aldrig rigtige persondata.
      </Callout>

      <h2>Opsummering</h2>
      <ul>
        <li>Injection opstår, når data fortolkes som kode. Hold dem adskilt.</li>
        <li><strong>SQL injection</strong>: parameteriserede forespørgsler/EF; allowlist til strukturer; mindste rettigheder; skjul fejl.</li>
        <li><strong>XSS</strong>: output-encoding i rigtig kontekst; undgå at omgå frameworkets beskyttelse; sanitér rig tekst; CSP som sikkerhedsnet.</li>
        <li><strong>CSRF</strong>: SameSite-cookies, anti-forgery tokens, Bearer i header, stram CORS.</li>
        <li>Flere lag er bedre end ét: validering + sikre API'er + encoding + headers + overvågning.</li>
      </ul>

      <h2>Øvelser</h2>
      <ol>
        <li>Gennemgå jeres kodebase og søg efter SQL-tekst bygget med <code>+</code> eller <code>$"..."</code>. Omskriv hver forekomst til parametre.</li>
        <li>Forklar med egne ord, hvorfor en parameteriseret forespørgsel ikke kan "ændre betydning", selv om værdien indeholder SQL-tegn.</li>
        <li>Find i jeres React-kode alle steder med <code>dangerouslySetInnerHTML</code>. Er indholdet sanitéret, og er det nødvendigt?</li>
        <li>Tilføj en CSP i Report-Only-tilstand til jeres web-container og se, hvilke overtrædelser der rapporteres i browserens konsol.</li>
        <li>Skriv en integrationstest, der kontrollerer, at jeres API sætter <code>X-Content-Type-Options: nosniff</code> og at login-cookies er <code>HttpOnly</code>/<code>Secure</code>.</li>
      </ol>
    </LessonLayout>
  )
}
