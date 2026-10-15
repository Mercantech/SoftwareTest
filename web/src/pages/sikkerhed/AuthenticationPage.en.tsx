import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const aaaChart = `
flowchart LR
    I["Identification - who do you claim to be?"] --> A["Authentication - can you prove it?"]
    A --> Z["Authorization - what are you allowed to do?"]
`

const sessionChart = `
sequenceDiagram
    participant B as Browser
    participant S as Server
    participant D as Session store
    B->>S: POST /login with username and password
    S->>D: Create session with user ID
    S->>B: Set-Cookie session-id - HttpOnly, Secure, SameSite
    B->>S: GET /profile with cookie
    S->>D: Look up session ID
    D->>S: User ID
    S->>B: 200 OK
`

const jwtChart = `
sequenceDiagram
    participant C as Client - SPA
    participant A as Auth server
    participant API as API
    C->>A: Login - receives access token as JWT
    C->>API: GET /api/data with Authorization Bearer token
    Note over API: Validates signature against JWKS, plus iss, aud and exp - no lookup in a session store
    API->>C: 200 OK
`

const pkceChart = `
sequenceDiagram
    participant U as User
    participant SPA as SPA - public client
    participant A as Mercantec Auth
    participant API as Your API
    SPA->>SPA: Generate code_verifier, code_challenge S256 and state - store in sessionStorage
    SPA->>A: Full browser navigation to /oauth/authorize with client_id, redirect_uri, code_challenge, state
    A->>U: Login page - optionally MFA or passkey
    U->>A: User signs in
    A->>SPA: Redirect to redirect_uri with code and state
    SPA->>SPA: Verify that state matches the stored one
    SPA->>A: POST /oauth/token with code, code_verifier, client_id, redirect_uri
    A->>SPA: access_token, refresh_token, expires_in
    SPA->>API: Authorization Bearer access_token
    API->>API: Validate JWT against JWKS - iss, aud, exp, kid
    API->>SPA: Data
`

const pkceGen = `// auth/pkce.ts - PKCE helper functions (the browser's Web Crypto API)
function base64Url(bytes: Uint8Array): string {
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')
}

export function randomString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes) // cryptographically secure randomness - NOT Math.random()
  return base64Url(bytes)
}

export async function challengeS256(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}`

const loginStart = `// auth/login.ts - start login (authorization code + PKCE)
import { challengeS256, randomString } from './pkce'

const AUTH_BASE = 'https://auth.mercantec.tech'
const CLIENT_ID = import.meta.env.VITE_AUTH_CLIENT_ID as string
const REDIRECT_URI = window.location.origin + '/callback' // must be registered EXACTLY with Auth

export async function startLogin() {
  const verifier = randomString(48)
  const state = randomString(16)

  // Temporary - cleared after the callback. sessionStorage, not localStorage.
  sessionStorage.setItem('pkce_verifier', verifier)
  sessionStorage.setItem('oauth_state', state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_challenge: await challengeS256(verifier),
    code_challenge_method: 'S256',
    state,
    // scope: see the Mercantec Auth manifest for allowed scopes
  })

  // FULL browser navigation - not fetch(). The user must see Auth's own login page.
  window.location.assign(AUTH_BASE + '/oauth/authorize?' + params.toString())
}`

const callback = `// auth/callback.ts - called on /callback
const AUTH_BASE = 'https://auth.mercantec.tech'

export async function handleCallback() {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')

  const expectedState = sessionStorage.getItem('oauth_state')
  const verifier = sessionStorage.getItem('pkce_verifier')

  // 1) Validate state - protects against CSRF on the callback
  if (!code || !returnedState || returnedState !== expectedState || !verifier) {
    throw new Error('Invalid login response')
  }

  // 2) Exchange code + verifier for tokens
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    client_id: import.meta.env.VITE_AUTH_CLIENT_ID as string,
    redirect_uri: window.location.origin + '/callback',
  })

  const res = await fetch(AUTH_BASE + '/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error('Token exchange failed')

  const tokens = await res.json()
  saveTokens(tokens)

  // 3) Clear temporary values - they must not be reused
  sessionStorage.removeItem('pkce_verifier')
  sessionStorage.removeItem('oauth_state')
  window.history.replaceState({}, '', '/') // remove the code from the URL
}

function saveTokens(t: { access_token: string; refresh_token: string; expires_in: number }) {
  sessionStorage.setItem('access_token', t.access_token)
  sessionStorage.setItem('refresh_token', t.refresh_token) // rotates - always store the newest
  sessionStorage.setItem('expires_at', String(Date.now() + t.expires_in * 1000))
}`

const fetchWrapper = `// auth/apiFetch.ts - fetch with Bearer and one refresh attempt
const AUTH_BASE = 'https://auth.mercantec.tech'

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const send = () =>
    fetch(input, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: 'Bearer ' + sessionStorage.getItem('access_token'),
      },
    })

  let res = await send()

  if (res.status === 401 && (await tryRefresh())) {
    res = await send() // exactly ONE new attempt
  }
  if (res.status === 401) {
    logoutLocal() // refresh failed - send the user to the app's login page
  }
  return res
}

async function tryRefresh(): Promise<boolean> {
  const refresh = sessionStorage.getItem('refresh_token')
  if (!refresh) return false

  const res = await fetch(AUTH_BASE + '/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh,
      client_id: import.meta.env.VITE_AUTH_CLIENT_ID as string,
    }),
  })
  if (!res.ok) return false

  const t = await res.json()
  sessionStorage.setItem('access_token', t.access_token)
  sessionStorage.setItem('refresh_token', t.refresh_token) // refresh tokens rotate
  return true
}

// Logout in our apps: LOCAL only
export function logoutLocal() {
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
  sessionStorage.removeItem('expires_at')
  window.location.assign('/login') // the app's OWN login page
}`

const apiAuth = `// Program.cs - JWT validation in the API against Mercantec Auth
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Values come from the environment (AUTH_ISSUER, AUTH_AUDIENCE) - not hard-coded in compose/code
var issuer   = builder.Configuration["AUTH_ISSUER"]   ?? "https://auth.mercantec.tech";
var audience = builder.Configuration["AUTH_AUDIENCE"] ?? "mercantec-apps";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Authority => .NET fetches OIDC discovery and JWKS (public keys) and caches them.
        // There is NO shared secret: only the server can sign, everyone can verify.
        // JWKS: https://auth.mercantec.tech/.well-known/jwks.json (JWKS_URI in the environment)
        options.Authority = issuer;
        options.MapInboundClaims = false; // keep claim names such as sub and role

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,           ValidIssuer = issuer,
            ValidateAudience = true,         ValidAudience = audience,
            ValidateLifetime = true,         ClockSkew = TimeSpan.FromSeconds(30),
            ValidateIssuerSigningKey = true, // signature + kid are validated against JWKS
            ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256 }, // RS256
            NameClaimType = "name",
            RoleClaimType = "role"
        };
    });

builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("Admin", p => p.RequireRole("admin"));
});

var app = builder.Build();
app.UseAuthentication();   // 401 on missing/invalid token
app.UseAuthorization();    // 403 on missing role

// Authentication: [requires valid token]  Authorization: [requires role]
app.MapGet("/api/me", (ClaimsPrincipal user) =>
{
    // sub (GUID) is the user's stable ID - NEVER use e-mail as a key in the database
    var userId = user.FindFirst("sub")?.Value
              ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    return Results.Ok(new { userId });
}).RequireAuthorization();

app.MapDelete("/api/admin/items/{id}", (int id) => Results.NoContent())
   .RequireAuthorization("Admin");

app.Run();`

const ownership = `// Authorization is more than roles: also check OWNERSHIP of the object (avoid "Broken Access Control")
app.MapGet("/api/notes/{id:guid}", async (Guid id, ClaimsPrincipal user, AppDb db) =>
{
    var userId = Guid.Parse(user.FindFirst("sub")!.Value);

    var note = await db.Notes.FirstOrDefaultAsync(n => n.Id == id && n.OwnerId == userId);
    return note is null ? Results.NotFound() : Results.Ok(note); // 404 rather than 403: does not reveal that the id exists
}).RequireAuthorization();`

const cookieLogin = `// Classic server-rendered login with cookie session (ASP.NET Core Identity / cookie auth)
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.HttpOnly = true;                           // JavaScript cannot read the cookie
        o.Cookie.SecurePolicy = CookieSecurePolicy.Always;  // only over HTTPS
        o.Cookie.SameSite = SameSiteMode.Lax;               // basic CSRF protection
        o.ExpireTimeSpan = TimeSpan.FromHours(8);
        o.SlidingExpiration = true;
    });`

export default function AuthenticationPageEn() {

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Authentication</h1>
<h2>Identification, authentication and authorization</h2>
      <p>
        The three terms are often mixed up – but they answer three different questions:
      </p>
      <MermaidDiagram chart={aaaChart} />
      <table>
        <thead>
          <tr>
            <th>Term</th>
            <th>Question</th>
            <th>Example</th>
            <th>HTTP error on failure</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Identification</td>
            <td>Who do you claim to be?</td>
            <td>Providing an e-mail or username</td>
            <td>–</td>
          </tr>
          <tr>
            <td>Authentication (AuthN)</td>
            <td>Can you prove it?</td>
            <td>Password, passkey, MFA, valid token</td>
            <td><strong>401 Unauthorized</strong> (really "unauthenticated")</td>
          </tr>
          <tr>
            <td>Authorization (AuthZ)</td>
            <td>What are you allowed to do?</td>
            <td>The "admin" role, owner of the object</td>
            <td><strong>403 Forbidden</strong></td>
          </tr>
        </tbody>
      </table>
      <p>
        There are three classic types of proof ("factors"): something you <strong>know</strong> (password), something you{' '}
        <strong>have</strong> (phone, security key) and something you <strong>are</strong> (fingerprint, face).{' '}
        <strong>MFA</strong> (multi-factor authentication) combines at least two different types and stops the vast majority of
        account takeovers.
      </p>

      <Callout type="danger">
        <strong>Do not roll your own login solution.</strong> Password reset, MFA, brute-force protection, hashing, account lockout and
        session handling each have their own pitfalls. Use a proven identity provider (OIDC/OAuth2) – at our school and
        company that is <strong>Mercantec Auth</strong>.
      </Callout>

      <h2>Sessions vs. tokens (JWT)</h2>
      <h3>Server-side sessions (cookies)</h3>
      <p>
        The server remembers who is logged in, in a session store (memory, Redis, database). The browser only gets a
        random session ID in a cookie.
      </p>
      <MermaidDiagram chart={sessionChart} />
      <CodeBlock language="csharp">{cookieLogin}</CodeBlock>
      <ul>
        <li>
          <strong>Pros:</strong> easy to revoke (delete the session), nothing sensitive in the client, fits server-rendered pages.
        </li>
        <li>
          <strong>Cons:</strong> state on the server (scaling/sticky sessions), CSRF must be handled, less obvious for
          APIs used by mobile/SPA across domains.
        </li>
      </ul>

      <h3>Tokens – JWT</h3>
      <p>
        A <strong>JWT</strong> (JSON Web Token) is a signed package of <em>claims</em>: <code>header.payload.signature</code>.
        The server can verify the token <em>without</em> a lookup, simply by checking the signature. The payload is{' '}
        <strong>Base64-encoded, not encrypted</strong> – never put secrets in it.
      </p>
      <MermaidDiagram chart={jwtChart} />
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>iss</code></td><td>Issuer – who issued the token (<code>https://auth.mercantec.tech</code>)</td></tr>
          <tr><td><code>aud</code></td><td>Audience – who the token is for (<code>mercantec-apps</code>)</td></tr>
          <tr><td><code>sub</code></td><td>Subject – the user's unique, stable ID (GUID)</td></tr>
          <tr><td><code>exp</code> / <code>iat</code></td><td>Expiry time / issued-at time</td></tr>
          <tr><td><code>role</code></td><td>Role(s) for authorization</td></tr>
        </tbody>
      </table>
      <ul>
        <li>
          <strong>Pros:</strong> stateless, scales easily, works across services/domains.
        </li>
        <li>
          <strong>Cons:</strong> hard to revoke before expiry (hence short lifetimes + refresh tokens), and incorrect
          validation is a classic source of bugs.
        </li>
      </ul>

      <Callout type="warn">
        <strong>Always validate</strong> the signature (against JWKS), <code>iss</code>, <code>aud</code>, <code>exp</code> and algorithm.
        Never accept <code>alg: none</code>, and never decode a JWT "just to read it" without verifying it on the server.
        The client's own reading of claims is for display only – not for security decisions.
      </Callout>

      <h3>What should I choose?</h3>
      <table>
        <thead>
          <tr><th>Situation</th><th>Typical choice</th></tr>
        </thead>
        <tbody>
          <tr><td>Server-rendered app (MVC/Razor) with its own login</td><td>Cookie session</td></tr>
          <tr><td>SPA + API, several apps, central login</td><td>OAuth2/OIDC with access token (JWT) + refresh token</td></tr>
          <tr><td>Machine-to-machine</td><td>Client credentials / API keys with restricted permissions</td></tr>
        </tbody>
      </table>

      <h2>OAuth 2.0 – authorization code + PKCE</h2>
      <p>
        <strong>OAuth 2.0</strong> is a protocol for delegated access; <strong>OpenID Connect (OIDC)</strong> builds
        identity (login) on top of it. The principle: your app <em>never</em> handles the user's password – the user signs in
        at the auth server, and your app gets a token back.
      </p>
      <p>
        The <strong>Authorization Code Flow</strong> is the recommended flow. For public clients (SPAs and mobile apps that
        cannot keep a secret secret) it is extended with <strong>PKCE</strong> (Proof Key for Code Exchange, pronounced "pixy"):
      </p>
      <ul>
        <li>The client generates a random <code>code_verifier</code> and at the start only sends its hash (<code>code_challenge</code>, S256).</li>
        <li>When the <code>code</code> is exchanged for tokens, the original <code>code_verifier</code> is sent. The auth server compares them.</li>
        <li>An attacker who intercepts the code on the way lacks the verifier and cannot use the code.</li>
      </ul>
      <Callout type="info">
        <strong>Ruled out:</strong> the <em>implicit flow</em> (tokens in the URL – deprecated) and <em>resource owner password
        credentials</em> (the app receives the password – breaks the whole idea). Do not use these.
      </Callout>

      <h2>Example: Mercantec Auth</h2>
      <p>
        Mercantec Auth is the central auth platform we use in all apps. It is an OAuth 2.0 server with PKCE,
        JWT (RS256) and rotating refresh tokens. It supports several login methods (password, passkey, external
        providers such as Microsoft/GitHub/Google) and opt-in MFA, configured per OAuth client.
      </p>
      <table>
        <thead>
          <tr><th>Property</th><th>Value</th></tr>
        </thead>
        <tbody>
          <tr><td>Base URL / issuer (<code>iss</code>)</td><td><code>https://auth.mercantec.tech</code></td></tr>
          <tr><td>Audience (<code>aud</code>)</td><td><code>mercantec-apps</code></td></tr>
          <tr><td>Authorize</td><td><code>/oauth/authorize</code> (full browser navigation)</td></tr>
          <tr><td>Token</td><td><code>/oauth/token</code> (POST, <code>application/x-www-form-urlencoded</code>)</td></tr>
          <tr><td>JWKS</td><td><code>/.well-known/jwks.json</code></td></tr>
          <tr><td>OIDC discovery</td><td><code>/.well-known/openid-configuration</code></td></tr>
          <tr><td>Signature</td><td>RS256 – validated against JWKS, never a shared secret</td></tr>
          <tr><td>Access token</td><td>Short lifetime (typically about 15 minutes)</td></tr>
          <tr><td>Refresh token</td><td>Rotating – always store the newest</td></tr>
        </tbody>
      </table>
      <p>
        Authoritative description: <code>https://auth.mercantec.tech/.well-known/mercantec-auth.json</code>. You must have
        a <code>client_id</code> and the <strong>exact</strong> redirect URIs registered with the administrator
        (mags@mercantec.dk).
      </p>

      <h3>The flow step by step</h3>
      <MermaidDiagram chart={pkceChart} />

      <h3>1) Start login (SPA)</h3>
      <CodeBlock language="ts">{pkceGen}</CodeBlock>
      <CodeBlock language="ts">{loginStart}</CodeBlock>

      <h3>2) Callback – validate state and exchange the code for tokens</h3>
      <CodeBlock language="ts">{callback}</CodeBlock>

      <h3>3) Call the API with Bearer and one refresh attempt</h3>
      <CodeBlock language="ts">{fetchWrapper}</CodeBlock>

      <Callout type="warn">
        <strong>Token storage in an SPA:</strong> use <code>sessionStorage</code> or memory – <strong>not</strong>{' '}
        <code>localStorage</code>, which survives closing the tab and is more exposed to XSS. Neither is immune to XSS, so
        XSS defences (CSP, output encoding) are still crucial. Keep access tokens short-lived.
      </Callout>

      <h3>Logout – local only</h3>
      <p>
        In our apps, "log out" means: <strong>clear tokens locally and send the user to the app's own login page</strong> (see{' '}
        <code>logoutLocal()</code> above). <strong>Never</strong> call <code>https://auth.mercantec.tech/signout</code> from
        an SPA – it signs the user out of the entire Auth session and thereby out of all other Mercantec apps. Full signout is
        only for an explicit "log out everywhere" feature.
      </p>

      <h2>Backend: validate the JWT</h2>
      <p>
        The frontend is a <em>public PKCE client</em>; the backend does <strong>not</strong> run the login flow, but simply validates
        every incoming token. Return <strong>401</strong> for an invalid/missing token and <strong>403</strong> for a
        missing role.
      </p>
      <CodeBlock language="csharp">{apiAuth}</CodeBlock>
      <Callout type="tip">
        Use <code>sub</code> (GUID) as the user key in your own database – <strong>never e-mail</strong>, which can change
        and is not unique over time.
      </Callout>
      <Callout type="info">
        The code is an abbreviated illustration. The point is always the same: <em>validate against JWKS, check iss/aud/exp/kid, no shared
        secret</em>. The configuration is read from the environment (<code>AUTH_ISSUER</code>, <code>AUTH_AUDIENCE</code>,{' '}
        <code>JWKS_URI</code>) – never hard-coded. With <code>MapInboundClaims = false</code> the role claim is called{' '}
        <code>role</code>; with .NET's default mapping it becomes the long claim type{' '}
        <code>http://schemas.microsoft.com/ws/2008/06/identity/claims/role</code>.
      </Callout>

      <h3>Authorization in practice: roles and ownership</h3>
      <CodeBlock language="csharp">{ownership}</CodeBlock>

      <h2>Common mistakes</h2>
      <table>
        <thead>
          <tr><th>Mistake</th><th>Why is it bad?</th><th>Better</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Own login/JWT implementation with a shared secret</td>
            <td>Hard to make secure; if the secret leaks, anyone can forge tokens</td>
            <td>Central IdP + asymmetric signature (JWKS)</td>
          </tr>
          <tr>
            <td>Token in <code>localStorage</code></td>
            <td>Persists; easy to steal via XSS</td>
            <td><code>sessionStorage</code>/memory, short-lived tokens</td>
          </tr>
          <tr>
            <td>Missing <code>state</code> validation</td>
            <td>Login CSRF</td>
            <td>Store and compare <code>state</code></td>
          </tr>
          <tr>
            <td>Client-side-only access control</td>
            <td>A hidden button is not protection – the API can be called directly</td>
            <td>Always check permissions on the server</td>
          </tr>
          <tr>
            <td>Skipping the <code>aud</code>/<code>iss</code> checks</td>
            <td>Tokens from other systems are accepted</td>
            <td>Validate all claims</td>
          </tr>
          <tr>
            <td>E-mail as user ID</td>
            <td>Can change/be reused → account mix-ups</td>
            <td><code>sub</code> (GUID)</td>
          </tr>
          <tr>
            <td>No rate limiting on login</td>
            <td>Brute force and credential stuffing</td>
            <td>Lockout, rate limits, MFA</td>
          </tr>
        </tbody>
      </table>

      <h2>Summary</h2>
      <ul>
        <li>Identification = claim; authentication = proof (401); authorization = permission (403).</li>
        <li>Sessions keep state on the server; JWTs are stateless and require strict validation.</li>
        <li>Authorization code + PKCE is the standard for SPAs – no implicit flow, no password grant.</li>
        <li>Mercantec Auth: iss <code>https://auth.mercantec.tech</code>, aud <code>mercantec-apps</code>, RS256 via JWKS.</li>
        <li>SPA: tokens in sessionStorage, validate state, one refresh attempt, local logout only.</li>
        <li>Backend: validate the JWT, use <code>sub</code> as the key, check both role and ownership.</li>
      </ul>

      <h2>Exercises</h2>
      <ol>
        <li>Explain the difference between 401 and 403 with a concrete endpoint in your project.</li>
        <li>Draw the PKCE flow yourself. What would an attacker who intercepts the <code>code</code> be missing in order to use it?</li>
        <li>Paste an access token into a JWT decoder (e.g. jwt.io) – <em>a test token only</em> – and find <code>iss</code>, <code>aud</code>, <code>sub</code>, <code>exp</code>. Why is it okay that the contents can be read?</li>
        <li>Implement <code>logoutLocal()</code> in your SPA and verify that other Mercantec apps are still logged in.</li>
        <li>Add an ownership check on an endpoint so that user A cannot fetch user B's data via ID, and write a test that documents it.</li>
      </ol>
    </LessonLayout>
  )
}
