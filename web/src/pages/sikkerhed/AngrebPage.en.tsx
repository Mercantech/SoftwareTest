import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const rootCause = `
flowchart LR
    A["Untrusted input from a user"] --> B{"Is the input treated as DATA or as CODE?"}
    B -->|"Mixed into command text"| C["Injection vulnerability"]
    B -->|"Kept separate - parameters and encoding"| D["Safe"]
`

const defenseLayers = `
flowchart TD
    I["Input"] --> V["1. Validation - allowlist of type, length, format"]
    V --> P["2. Safe API - parameters / ORM / framework escaping"]
    P --> O["3. Output encoding in the right context"]
    O --> H["4. Headers - CSP, cookies HttpOnly and SameSite"]
    H --> L["5. Least privilege - DB user, tokens"]
    L --> M["6. Logging and monitoring"]
`

const badSql = `// ❌ AVOID: SQL is built by concatenating text from the user with the query.
// The user's input can then change the STRUCTURE of the query - this is the root of SQL injection.
var sql = "SELECT * FROM Users WHERE Email = '" + email + "'";
using var cmd = new SqlCommand(sql, connection);

// The same problem with string interpolation and string.Format:
var sql2 = $"SELECT * FROM Users WHERE Email = '{email}'";`

const goodAdo = `// ✅ Parameterised query (ADO.NET)
// The SQL text is FIXED. The value is sent separately as DATA and can never become SQL code.
using var cmd = new SqlCommand(
    "SELECT Id, Name FROM Users WHERE Email = @email", connection);
cmd.Parameters.Add("@email", SqlDbType.NVarChar, 256).Value = email;

using var reader = await cmd.ExecuteReaderAsync();`

const goodNpgsql = `// ✅ Npgsql (PostgreSQL - our standard database)
await using var cmd = new NpgsqlCommand(
    "SELECT id, name FROM users WHERE email = @email", dataSource.CreateConnection());
cmd.Parameters.AddWithValue("email", email);`

const goodEf = `// ✅ Entity Framework Core: LINQ parameterises automatically
var user = await db.Users
    .Where(u => u.Email == email)
    .Select(u => new { u.Id, u.Name })
    .FirstOrDefaultAsync();

// ✅ Raw SQL in EF - use FromSql (interpolation becomes PARAMETERS, not text)
var users = await db.Users
    .FromSql($"SELECT * FROM users WHERE email = {email}")
    .ToListAsync();

// ❌ FromSqlRaw with concatenated text is dangerous - only use FromSqlRaw with explicit parameters:
// db.Users.FromSqlRaw("SELECT * FROM users WHERE email = {0}", email)  // OK: {0} is a parameter`

const dynamicSort = `// Dynamic ORDER BY / column names can NOT be parameterised - use an allowlist
static readonly HashSet<string> AllowedSort = new() { "name", "created", "email" };

var sortBy = AllowedSort.Contains(requested) ? requested : "name";
query = sortBy switch
{
    "created" => query.OrderBy(u => u.Created),
    "email"   => query.OrderBy(u => u.Email),
    _         => query.OrderBy(u => u.Name),
};`

const validationExample = `// Validation on the server (minimal API + DataAnnotations)
public record CreateCommentRequest(
    [property: Required, StringLength(500, MinimumLength = 1)] string Text,
    [property: Range(1, 5)] int Rating);

app.MapPost("/api/comments", (CreateCommentRequest req) =>
{
    // Validate (here: manually) - reject with 400 if invalid
    var ctx = new ValidationContext(req);
    var errors = new List<ValidationResult>();
    if (!Validator.TryValidateObject(req, ctx, errors, validateAllProperties: true))
        return Results.BadRequest(errors.Select(e => e.ErrorMessage));

    // ... store (parameterised / EF)
    return Results.Created();
}).RequireAuthorization();`

const leastPriv = `-- The principle of least privilege: the application's DB user may only do what it needs to
CREATE ROLE app_user LOGIN PASSWORD '<from secret store>';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
-- No DROP, no CREATE, not superuser.
-- Migrations run with a SEPARATE user with more privileges.`

const reactSafe = `// ✅ React encodes by default - text is displayed as text
function Comment({ text }: { text: string }) {
  return <p>{text}</p>   // <-- safe, even if 'text' contains HTML characters
}

// ❌ dangerouslySetInnerHTML BYPASSES the protection. The name is a warning.
// <div dangerouslySetInnerHTML={{ __html: userHtml }} />

// ✅ If you MUST display rich text/HTML from users: sanitise with a dedicated library (e.g. DOMPurify)
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userHtml)
// <div dangerouslySetInnerHTML={{ __html: clean }} />
// ...and still combine it with a strict CSP.

// ❌ Also avoid inserting user data into href/src without checking the protocol
function SafeLink({ url, children }: { url: string; children: React.ReactNode }) {
  const ok = /^https?:\\/\\//i.test(url) // only http(s) - not e.g. javascript:
  return ok ? <a href={url} rel="noopener noreferrer">{children}</a> : <span>{children}</span>
}`

const razorEncoding = `@* Razor/Blazor encodes automatically: *@
<p>@Model.Comment</p>            @* ✅ HTML-encoded *@

@* ❌ Html.Raw turns encoding off - only for content you control yourself *@
@Html.Raw(Model.Comment)

// In C# code (e.g. when generating HTML in e-mails) - encode explicitly:
var safe = System.Net.WebUtility.HtmlEncode(userText);`

const cspHeader = `# A strict Content-Security-Policy for an SPA (nginx)
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://auth.mercantec.tech; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;`

const cspAspNet = `// ASP.NET: set security headers as middleware
app.Use(async (ctx, next) =>
{
    var h = ctx.Response.Headers;
    h["Content-Security-Policy"] =
        "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
    h["X-Content-Type-Options"] = "nosniff";
    h["Referrer-Policy"] = "strict-origin-when-cross-origin";
    await next();
});`

const cookieFlags = `// Cookies: make them hard to abuse
options.Cookie.HttpOnly = true;                          // JS cannot read it (limits damage from XSS)
options.Cookie.SecurePolicy = CookieSecurePolicy.Always; // HTTPS only
options.Cookie.SameSite = SameSiteMode.Lax;              // not sent on cross-site POST (CSRF defence)`

const antiforgery = `// ASP.NET Core: anti-forgery tokens for cookie-based forms
builder.Services.AddAntiforgery();
app.UseAntiforgery();

// Razor Pages/MVC validate automatically with [ValidateAntiForgeryToken] / AutoValidateAntiforgeryToken.
// APIs with a Bearer token in the Authorization header are not vulnerable in the same way,
// because the browser does not attach the header automatically.`

const errorHandling = `// Error handling: log details on the server, give a generic message to the client
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async ctx =>
    {
        var feature = ctx.Features.Get<IExceptionHandlerFeature>();
        logger.LogError(feature?.Error, "Unexpected error"); // details only in the log
        ctx.Response.StatusCode = StatusCodes.Status500InternalServerError;
        await ctx.Response.WriteAsJsonAsync(new { error = "An error occurred" }); // no stack trace / SQL text
    });
});`

export default function AngrebPageEn() {

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Attacks and defence: SQL injection and XSS{' '}</h1>
<Callout type="info">
        <strong>The focus of this lesson is defence.</strong> We explain <em>how the vulnerabilities arise at a conceptual level</em>, and
        how to build your own application so that they cannot occur. We do not show ready-made attack strings or step-by-step procedures.
        Only test on systems you own yourself or have explicit permission to test (see the lesson on tools).
      </Callout>

      <h2>The common root: data becomes code</h2>
      <p>
        The vast majority of "injection" attacks – SQL injection, XSS, command injection, LDAP injection – have the same cause:
        the application mixes <strong>untrusted input</strong> into a text string that is later interpreted by an interpreter
        (database, browser, shell). If the interpreter cannot tell the difference between "the code the developer wrote" and "the data the user sent", the
        user can influence the meaning of the code.
      </p>
      <MermaidDiagram chart={rootCause} />
      <p>
        The defence follows directly from the cause: <strong>keep code and data separate</strong>, and bring the data in through a mechanism that never
        interprets it as code (parameters, encoding).
      </p>

      <h2>SQL injection</h2>
      <h3>What is it – and what can it cost?</h3>
      <p>
        SQL injection (CWE-89) occurs when an SQL query is built by concatenating text from the user with SQL. An attacker can then
        change the meaning of the query and potentially read, modify or delete data, bypass login or, at worst, gain access to the
        database server. It is one of the most destructive and at the same time most <em>preventable</em> vulnerabilities – and it falls under{' '}
        <strong>A03: Injection</strong> in the OWASP Top 10.
      </p>

      <h3>The pattern to avoid</h3>
      <CodeBlock language="csharp">{badSql}</CodeBlock>
      <Callout type="danger">
        If you see <code>"..." + variable + "..."</code> or <code>$"... {'{'}variable{'}'} ..."</code> inside an SQL text, it is a red flag in code review.
      </Callout>

      <h3>Defence 1: Parameterised queries (primary defence)</h3>
      <p>
        The database receives the SQL text and the values <em>separately</em>. The structure of the query is fixed before the values are inserted, so values
        can never change the structure.
      </p>
      <CodeBlock language="csharp">{goodAdo}</CodeBlock>
      <CodeBlock language="csharp">{goodNpgsql}</CodeBlock>

      <h3>Defence 2: An ORM such as Entity Framework Core</h3>
      <p>
        LINQ queries in EF Core are parameterised automatically. Be careful when you write raw SQL.
      </p>
      <CodeBlock language="csharp">{goodEf}</CodeBlock>
      <Callout type="warn">
        An ORM is not a guarantee. Raw SQL, dynamically concatenated <code>FromSqlRaw</code> calls and stored procedures that build SQL from text themselves
        can still be vulnerable.
      </Callout>

      <h3>Defence 3: Allowlist for what cannot be parameterised</h3>
      <p>
        Table and column names, <code>ORDER BY</code> direction and the like cannot be sent as parameters. Never let the user supply them directly;
        choose from a fixed list instead.
      </p>
      <CodeBlock language="csharp">{dynamicSort}</CodeBlock>

      <h3>Defence 4: Validation, least privilege and error handling</h3>
      <ul>
        <li>
          <strong>Input validation</strong> (allowlist of type, length, format) is an extra layer – <em>not</em> an alternative to parameters.
          Blacklists and "strip dangerous characters" filters are unreliable.
        </li>
        <li>
          <strong>Least privilege</strong>: the application's database user must not be owner/superuser. Then the damage is limited if something goes wrong anyway.
        </li>
        <li>
          <strong>Hide technical errors</strong>: never show SQL errors or stack traces to the user – they reveal the structure of your database.
        </li>
        <li>
          <strong>Monitoring</strong>: log unusual errors and abnormal patterns; a WAF can help as an extra layer, but does not replace secure code.
        </li>
      </ul>
      <CodeBlock language="csharp">{validationExample}</CodeBlock>
      <CodeBlock language="sql">{leastPriv}</CodeBlock>
      <CodeBlock language="csharp">{errorHandling}</CodeBlock>

      <h2>XSS – Cross-Site Scripting</h2>
      <h3>What is it?</h3>
      <p>
        XSS (CWE-79) occurs when an application displays untrusted content in a web page <em>without correct encoding</em>, so the browser
        interprets it as part of the page (HTML/JavaScript) rather than as plain text. The script then runs in the visitor's browser with
        the page's privileges: it can, for example, read data on the page, perform actions on the user's behalf or try to get hold of tokens.
      </p>
      <p>There are three main types:</p>
      <table>
        <thead>
          <tr><th>Type</th><th>Short explanation</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Stored (persistent)</strong></td><td>The content is stored (e.g. a comment) and later shown to other users.</td></tr>
          <tr><td><strong>Reflected</strong></td><td>Content from the request (e.g. a search parameter) is echoed directly in the response.</td></tr>
          <tr><td><strong>DOM-based</strong></td><td>Client-side JavaScript writes untrusted data into the DOM in an unsafe way.</td></tr>
        </tbody>
      </table>
      <Callout type="info">
        In an SPA with a stateless API, <em>stored</em> and <em>DOM-based</em> XSS are the relevant risks: the server stores user content, and
        the frontend displays it. If tokens live in the browser, the consequence of XSS is especially large – which is why the defence is so important.
      </Callout>

      <h3>Defence 1: Output encoding (primary defence)</h3>
      <p>
        <strong>Encode data when you write it out, adapted to the context</strong> where it ends up: HTML text, HTML attribute, JavaScript,
        URL or CSS. Modern frameworks do this automatically – <em>as long as you do not actively bypass it</em>.
      </p>
      <table>
        <thead>
          <tr><th>Context</th><th>What do you do?</th></tr>
        </thead>
        <tbody>
          <tr><td>HTML text</td><td>HTML-encode (<code>&amp;lt;</code> for &lt; etc.) – the framework's default</td></tr>
          <tr><td>HTML attribute</td><td>Attribute-encode; always quote attribute values</td></tr>
          <tr><td>URL (href/src)</td><td>Only allow expected protocols (<code>https:</code>), URL-encode parameters</td></tr>
          <tr><td>JavaScript</td><td>Never insert user data into inline script – pass it as JSON/data attributes</td></tr>
        </tbody>
      </table>

      <h3>React (frontend)</h3>
      <CodeBlock language="tsx">{reactSafe}</CodeBlock>
      <ul>
        <li>Avoid <code>dangerouslySetInnerHTML</code>, <code>innerHTML</code>, <code>document.write</code> and <code>eval</code> with user data.</li>
        <li>If rich text is necessary, use Markdown renderers with sanitisation or DOMPurify.</li>
        <li>Validate URLs before they are used in <code>href</code>/<code>src</code>.</li>
      </ul>

      <h3>ASP.NET / Razor (backend)</h3>
      <CodeBlock language="razor">{razorEncoding}</CodeBlock>
      <p>
        A JSON API that returns <code>Content-Type: application/json</code> and <code>X-Content-Type-Options: nosniff</code> is not in itself
        an XSS problem – the danger arises when the <em>frontend</em> displays the data unsafely.
      </p>

      <h3>Defence 2: Content Security Policy (CSP)</h3>
      <p>
        CSP is an HTTP header that tells the browser which sources of scripts, images, connections etc. are allowed. Even if
        an XSS flaw exists, a strict CSP can prevent injected script from running, or data from being sent to foreign servers.
        CSP is a <strong>safety net</strong> (defense in depth), not a replacement for encoding.
      </p>
      <CodeBlock language="nginx">{cspHeader}</CodeBlock>
      <CodeBlock language="csharp">{cspAspNet}</CodeBlock>
      <ul>
        <li>Start in <code>Content-Security-Policy-Report-Only</code> mode, and see what would be blocked before you enforce.</li>
        <li>Avoid <code>'unsafe-inline'</code> and <code>'unsafe-eval'</code> in <code>script-src</code>; use nonces/hashes if inline scripts are necessary.</li>
        <li><code>frame-ancestors 'none'</code> also protects against clickjacking.</li>
      </ul>

      <h3>Defence 3: Cookies and tokens</h3>
      <CodeBlock language="csharp">{cookieFlags}</CodeBlock>
      <p>
        Never store tokens in <code>localStorage</code> (see the authentication lesson). <code>HttpOnly</code> cookies cannot be read by JavaScript, which
        limits the damage from XSS – but XSS can still perform actions as the user, so the goal is to prevent XSS altogether.
      </p>

      <h3>Defense in depth – the layers combined</h3>
      <MermaidDiagram chart={defenseLayers} />

      <h2>CSRF – briefly</h2>
      <p>
        <strong>Cross-Site Request Forgery</strong> makes a logged-in user's browser unknowingly send a request to an
        application where the user has a cookie session. The browser automatically attaches cookies – even to requests triggered from a
        foreign site. What follows is <em>a defence against abuse of automatically attached credentials</em>.
      </p>
      <ul>
        <li><strong>SameSite cookies</strong> (<code>Lax</code>/<code>Strict</code>) – modern browsers do not send them on cross-site POST.</li>
        <li><strong>Anti-forgery tokens</strong> – an unpredictable token per form/session, which the server checks.</li>
        <li><strong>Check <code>Origin</code>/<code>Referer</code></strong> and use CORS with an explicit list of allowed origins.</li>
        <li><strong>State-changing actions only via POST/PUT/DELETE</strong> – never via GET.</li>
        <li>
          <strong>A Bearer token in the Authorization header</strong> (as in our SPA + API) is not exposed in the same way, because the browser does not
          send it automatically.
        </li>
      </ul>
      <CodeBlock language="csharp">{antiforgery}</CodeBlock>

      <h2>Other forms of injection (briefly)</h2>
      <ul>
        <li>
          <strong>Command injection</strong>: do not call the shell with concatenated strings. Use APIs that take arguments as a list, and an allowlist of permitted values.
        </li>
        <li>
          <strong>Path traversal</strong>: never use user input directly in file paths; normalise and check that the path lies within the permitted folder.
        </li>
        <li>
          <strong>SSRF</strong>: do not let users specify arbitrary URLs that the server calls; use an allowlist.
        </li>
        <li>
          <strong>NoSQL/LDAP injection</strong>: the same principle – use parameters/typed APIs rather than concatenated queries.
        </li>
      </ul>

      <h2>Checklist: how to secure your own app</h2>
      <table>
        <thead>
          <tr><th>✔</th><th>Item</th></tr>
        </thead>
        <tbody>
          <tr><td>☐</td><td>All database queries are parameterised (ADO.NET parameters or EF/LINQ)</td></tr>
          <tr><td>☐</td><td>No concatenated SQL strings with user input; allowlist for dynamic columns/sorting</td></tr>
          <tr><td>☐</td><td>Server-side validation of all input (type, length, format)</td></tr>
          <tr><td>☐</td><td>No use of <code>dangerouslySetInnerHTML</code>/<code>Html.Raw</code> with user data (or sanitisation + CSP)</td></tr>
          <tr><td>☐</td><td>CSP, <code>X-Content-Type-Options</code>, <code>Referrer-Policy</code> and <code>frame-ancestors</code> are set</td></tr>
          <tr><td>☐</td><td>Cookies are <code>HttpOnly</code>, <code>Secure</code> and <code>SameSite</code>; tokens not in localStorage</td></tr>
          <tr><td>☐</td><td>CSRF protection on cookie-based endpoints; CORS with an explicit origin list</td></tr>
          <tr><td>☐</td><td>DB user with the least possible privileges</td></tr>
          <tr><td>☐</td><td>Generic error messages to the client; details only in the server log</td></tr>
          <tr><td>☐</td><td>Automated tests/scans in CI (SAST, dependency scan, ZAP baseline against your own test environment)</td></tr>
        </tbody>
      </table>

      <h2>Test your defence – ethically</h2>
      <p>
        Write <strong>automated tests</strong> that document that your defence works – without having to know "attack strings" by heart:
      </p>
      <ul>
        <li>
          <strong>Unit test</strong>: a search with special characters (e.g. an apostrophe, a percent sign, HTML characters in the text) gives a correct result – neither an error nor
          unexpected data.
        </li>
        <li>
          <strong>Rendering test</strong>: a comment with HTML characters is displayed as <em>text</em>, not as markup.
        </li>
        <li>
          <strong>Header test</strong>: an integration test that checks that CSP and cookie flags are set.
        </li>
        <li>
          <strong>Scanner against your own test environment</strong>: OWASP ZAP and similar tools (see the tools lesson) find typical flaws systematically.
        </li>
        <li>
          <strong>Code review and SAST</strong>: search for string concatenation in SQL, <code>Html.Raw</code>, <code>innerHTML</code>.
        </li>
      </ul>
      <Callout type="warn">
        Never test security against systems you do not own or do not have written permission to test – it can be illegal (in Denmark, section 263 of the Criminal Code on
        unauthorised access to data). Use your own test environment, not production, and never real personal data.
      </Callout>

      <h2>Summary</h2>
      <ul>
        <li>Injection occurs when data is interpreted as code. Keep them separate.</li>
        <li><strong>SQL injection</strong>: parameterised queries/EF; allowlist for structures; least privilege; hide errors.</li>
        <li><strong>XSS</strong>: output encoding in the right context; avoid bypassing the framework's protection; sanitise rich text; CSP as a safety net.</li>
        <li><strong>CSRF</strong>: SameSite cookies, anti-forgery tokens, Bearer in a header, strict CORS.</li>
        <li>Several layers are better than one: validation + secure APIs + encoding + headers + monitoring.</li>
      </ul>

      <h2>Exercises</h2>
      <ol>
        <li>Go through your codebase and search for SQL text built with <code>+</code> or <code>$"..."</code>. Rewrite each occurrence to use parameters.</li>
        <li>Explain in your own words why a parameterised query cannot "change meaning", even if the value contains SQL characters.</li>
        <li>Find all places in your React code with <code>dangerouslySetInnerHTML</code>. Is the content sanitised, and is it necessary?</li>
        <li>Add a CSP in Report-Only mode to your web container and see which violations are reported in the browser console.</li>
        <li>Write an integration test that checks that your API sets <code>X-Content-Type-Options: nosniff</code> and that login cookies are <code>HttpOnly</code>/<code>Secure</code>.</li>
      </ol>
    </LessonLayout>
  )
}
