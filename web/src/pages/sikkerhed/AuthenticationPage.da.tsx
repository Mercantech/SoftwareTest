import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const aaaChart = `
flowchart LR
    I["Identifikation - hvem påstår du at være?"] --> A["Authentication - kan du bevise det?"]
    A --> Z["Authorization - hvad må du gøre?"]
`

const sessionChart = `
sequenceDiagram
    participant B as Browser
    participant S as Server
    participant D as Session-store
    B->>S: POST /login med brugernavn og adgangskode
    S->>D: Opret session med bruger-ID
    S->>B: Set-Cookie session-id - HttpOnly, Secure, SameSite
    B->>S: GET /profil med cookie
    S->>D: Slå session-id op
    D->>S: Bruger-ID
    S->>B: 200 OK
`

const jwtChart = `
sequenceDiagram
    participant C as Klient - SPA
    participant A as Auth-server
    participant API as API
    C->>A: Login - får access token som JWT
    C->>API: GET /api/data med Authorization Bearer token
    Note over API: Validerer signatur mod JWKS, plus iss, aud og exp - ingen opslag i session-store
    API->>C: 200 OK
`

const pkceChart = `
sequenceDiagram
    participant U as Bruger
    participant SPA as SPA - public client
    participant A as Mercantec Auth
    participant API as Din API
    SPA->>SPA: Generér code_verifier, code_challenge S256 og state - gem i sessionStorage
    SPA->>A: Fuld browser-navigation til /oauth/authorize med client_id, redirect_uri, code_challenge, state
    A->>U: Login-side - evt. MFA eller passkey
    U->>A: Bruger logger ind
    A->>SPA: Redirect til redirect_uri med code og state
    SPA->>SPA: Validér at state matcher den gemte
    SPA->>A: POST /oauth/token med code, code_verifier, client_id, redirect_uri
    A->>SPA: access_token, refresh_token, expires_in
    SPA->>API: Authorization Bearer access_token
    API->>API: Validér JWT mod JWKS - iss, aud, exp, kid
    API->>SPA: Data
`

const pkceGen = `// auth/pkce.ts - PKCE-hjælpefunktioner (browserens Web Crypto API)
function base64Url(bytes: Uint8Array): string {
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '')
}

export function randomString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength)
  crypto.getRandomValues(bytes) // kryptografisk sikker tilfældighed - IKKE Math.random()
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
const REDIRECT_URI = window.location.origin + '/callback' // skal være registreret PRÆCIST hos Auth

export async function startLogin() {
  const verifier = randomString(48)
  const state = randomString(16)

  // Midlertidigt - ryddes efter callback. sessionStorage, ikke localStorage.
  sessionStorage.setItem('pkce_verifier', verifier)
  sessionStorage.setItem('oauth_state', state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_challenge: await challengeS256(verifier),
    code_challenge_method: 'S256',
    state,
    // scope: se Mercantec Auth-manifestet for tilladte scopes
  })

  // FULD browser-navigation - ikke fetch(). Brugeren skal se Auths egen login-side.
  window.location.assign(AUTH_BASE + '/oauth/authorize?' + params.toString())
}`

const callback = `// auth/callback.ts - kaldes på /callback
const AUTH_BASE = 'https://auth.mercantec.tech'

export async function handleCallback() {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')

  const expectedState = sessionStorage.getItem('oauth_state')
  const verifier = sessionStorage.getItem('pkce_verifier')

  // 1) Validér state - beskytter mod CSRF på callbacken
  if (!code || !returnedState || returnedState !== expectedState || !verifier) {
    throw new Error('Ugyldigt login-svar')
  }

  // 2) Byt code + verifier til tokens
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
  if (!res.ok) throw new Error('Token-udveksling fejlede')

  const tokens = await res.json()
  saveTokens(tokens)

  // 3) Ryd midlertidige værdier - de må ikke genbruges
  sessionStorage.removeItem('pkce_verifier')
  sessionStorage.removeItem('oauth_state')
  window.history.replaceState({}, '', '/') // fjern code fra URL'en
}

function saveTokens(t: { access_token: string; refresh_token: string; expires_in: number }) {
  sessionStorage.setItem('access_token', t.access_token)
  sessionStorage.setItem('refresh_token', t.refresh_token) // roterer - gem altid den nyeste
  sessionStorage.setItem('expires_at', String(Date.now() + t.expires_in * 1000))
}`

const fetchWrapper = `// auth/apiFetch.ts - fetch med Bearer og ét refresh-forsøg
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
    res = await send() // netop ÉT nyt forsøg
  }
  if (res.status === 401) {
    logoutLocal() // refresh fejlede - send brugeren til appens login-side
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
  sessionStorage.setItem('refresh_token', t.refresh_token) // refresh-tokens roterer
  return true
}

// Logout i vores apps: KUN lokalt
export function logoutLocal() {
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
  sessionStorage.removeItem('expires_at')
  window.location.assign('/login') // appens EGEN login-side
}`

const apiAuth = `// Program.cs - JWT-validering i API'et mod Mercantec Auth
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Værdier kommer fra miljøet (AUTH_ISSUER, AUTH_AUDIENCE) - ikke hårdkodet i compose/kode
var issuer   = builder.Configuration["AUTH_ISSUER"]   ?? "https://auth.mercantec.tech";
var audience = builder.Configuration["AUTH_AUDIENCE"] ?? "mercantec-apps";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Authority => .NET henter OIDC-discovery og JWKS (offentlige nøgler) og cacher dem.
        // Der er INGEN delt secret: kun serveren kan signere, alle kan verificere.
        // JWKS: https://auth.mercantec.tech/.well-known/jwks.json (JWKS_URI i miljøet)
        options.Authority = issuer;
        options.MapInboundClaims = false; // behold claim-navne som sub og role

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,           ValidIssuer = issuer,
            ValidateAudience = true,         ValidAudience = audience,
            ValidateLifetime = true,         ClockSkew = TimeSpan.FromSeconds(30),
            ValidateIssuerSigningKey = true, // signatur + kid valideres mod JWKS
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
app.UseAuthentication();   // 401 ved manglende/ugyldig token
app.UseAuthorization();    // 403 ved manglende rolle

// Authentication: [kræver gyldig token]  Authorization: [kræver rolle]
app.MapGet("/api/me", (ClaimsPrincipal user) =>
{
    // sub (GUID) er brugerens stabile ID - brug ALDRIG e-mail som nøgle i databasen
    var userId = user.FindFirst("sub")?.Value
              ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    return Results.Ok(new { userId });
}).RequireAuthorization();

app.MapDelete("/api/admin/items/{id}", (int id) => Results.NoContent())
   .RequireAuthorization("Admin");

app.Run();`

const ownership = `// Authorization er mere end roller: tjek også EJERSKAB af objektet (undgå "Broken Access Control")
app.MapGet("/api/notes/{id:guid}", async (Guid id, ClaimsPrincipal user, AppDb db) =>
{
    var userId = Guid.Parse(user.FindFirst("sub")!.Value);

    var note = await db.Notes.FirstOrDefaultAsync(n => n.Id == id && n.OwnerId == userId);
    return note is null ? Results.NotFound() : Results.Ok(note); // 404 frem for 403: afslører ikke at id'et findes
}).RequireAuthorization();`

const cookieLogin = `// Klassisk server-rendered login med cookie-session (ASP.NET Core Identity / cookie auth)
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.HttpOnly = true;                           // JavaScript kan ikke læse cookien
        o.Cookie.SecurePolicy = CookieSecurePolicy.Always;  // kun over HTTPS
        o.Cookie.SameSite = SameSiteMode.Lax;               // basal CSRF-beskyttelse
        o.ExpireTimeSpan = TimeSpan.FromHours(8);
        o.SlidingExpiration = true;
    });`

export default function AuthenticationPageDa() {

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Authentication</h1>
<h2>Identifikation, authentication og authorization</h2>
      <p>
        De tre begreber bliver ofte blandet sammen – men de svarer på tre forskellige spørgsmål:
      </p>
      <MermaidDiagram chart={aaaChart} />
      <table>
        <thead>
          <tr>
            <th>Begreb</th>
            <th>Spørgsmål</th>
            <th>Eksempel</th>
            <th>HTTP-fejl ved svigt</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Identifikation</td>
            <td>Hvem påstår du at være?</td>
            <td>Angive e-mail eller brugernavn</td>
            <td>–</td>
          </tr>
          <tr>
            <td>Authentication (AuthN)</td>
            <td>Kan du bevise det?</td>
            <td>Adgangskode, passkey, MFA, gyldigt token</td>
            <td><strong>401 Unauthorized</strong> (egentlig "unauthenticated")</td>
          </tr>
          <tr>
            <td>Authorization (AuthZ)</td>
            <td>Hvad må du gøre?</td>
            <td>Rolle "admin", ejer af objektet</td>
            <td><strong>403 Forbidden</strong></td>
          </tr>
        </tbody>
      </table>
      <p>
        Der er tre klassiske bevis-typer ("faktorer"): noget du <strong>ved</strong> (adgangskode), noget du{' '}
        <strong>har</strong> (telefon, sikkerhedsnøgle) og noget du <strong>er</strong> (fingeraftryk, ansigt).{' '}
        <strong>MFA</strong> (multi-factor authentication) kombinerer mindst to forskellige typer og stopper langt de fleste
        kontoovertagelser.
      </p>

      <Callout type="danger">
        <strong>Rul ikke din egen login-løsning.</strong> Password-reset, MFA, brute-force-beskyttelse, hashing, kontosperring og
        session-håndtering har hver deres faldgruber. Brug en gennemprøvet identity provider (OIDC/OAuth2) – i vores skole og
        virksomhed er det <strong>Mercantec Auth</strong>.
      </Callout>

      <h2>Sessioner vs. tokens (JWT)</h2>
      <h3>Server-side sessioner (cookies)</h3>
      <p>
        Serveren husker, hvem der er logget ind, i en session-store (hukommelse, Redis, database). Browseren får kun et
        tilfældigt session-ID i en cookie.
      </p>
      <MermaidDiagram chart={sessionChart} />
      <CodeBlock language="csharp">{cookieLogin}</CodeBlock>
      <ul>
        <li>
          <strong>Fordele:</strong> let at tilbagekalde (slet sessionen), intet følsomt i klienten, passer til server-rendered sider.
        </li>
        <li>
          <strong>Ulemper:</strong> state på serveren (skalering/sticky sessions), CSRF skal håndteres, mindre oplagt til
          API'er brugt af mobil/SPA på tværs af domæner.
        </li>
      </ul>

      <h3>Tokens – JWT</h3>
      <p>
        Et <strong>JWT</strong> (JSON Web Token) er en signeret pakke af <em>claims</em>: <code>header.payload.signature</code>.
        Serveren kan verificere tokenet <em>uden</em> opslag, blot ved at tjekke signaturen. Payload er{' '}
        <strong>Base64-kodet, ikke krypteret</strong> – læg aldrig hemmeligheder i den.
      </p>
      <MermaidDiagram chart={jwtChart} />
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Betydning</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>iss</code></td><td>Issuer – hvem har udstedt tokenet (<code>https://auth.mercantec.tech</code>)</td></tr>
          <tr><td><code>aud</code></td><td>Audience – hvem er tokenet til (<code>mercantec-apps</code>)</td></tr>
          <tr><td><code>sub</code></td><td>Subject – brugerens unikke, stabile ID (GUID)</td></tr>
          <tr><td><code>exp</code> / <code>iat</code></td><td>Udløbstidspunkt / udstedelsestidspunkt</td></tr>
          <tr><td><code>role</code></td><td>Rolle(r) til autorisation</td></tr>
        </tbody>
      </table>
      <ul>
        <li>
          <strong>Fordele:</strong> stateless, skalerer let, fungerer på tværs af tjenester/domæner.
        </li>
        <li>
          <strong>Ulemper:</strong> svære at tilbagekalde før udløb (derfor korte levetider + refresh tokens), og forkert
          validering er en klassisk fejlkilde.
        </li>
      </ul>

      <Callout type="warn">
        <strong>Validér altid</strong> signatur (mod JWKS), <code>iss</code>, <code>aud</code>, <code>exp</code> og algoritme.
        Accepter aldrig <code>alg: none</code>, og dekod aldrig et JWT "bare for at læse det" uden at verificere det på serveren.
        Klientens egen læsning af claims er kun til visning – ikke til sikkerhedsbeslutninger.
      </Callout>

      <h3>Hvad skal jeg vælge?</h3>
      <table>
        <thead>
          <tr><th>Situation</th><th>Typisk valg</th></tr>
        </thead>
        <tbody>
          <tr><td>Server-rendered app (MVC/Razor) med eget login</td><td>Cookie-session</td></tr>
          <tr><td>SPA + API, flere apps, central login</td><td>OAuth2/OIDC med access token (JWT) + refresh token</td></tr>
          <tr><td>Maskine-til-maskine</td><td>Client credentials / API-nøgler med rettighedsbegrænsning</td></tr>
        </tbody>
      </table>

      <h2>OAuth 2.0 – authorization code + PKCE</h2>
      <p>
        <strong>OAuth 2.0</strong> er en protokol til delegeret adgang; <strong>OpenID Connect (OIDC)</strong> bygger
        identitet (login) ovenpå. Princippet: din app håndterer <em>aldrig</em> brugerens adgangskode – brugeren logger ind
        hos auth-serveren, og din app får et token tilbage.
      </p>
      <p>
        <strong>Authorization Code Flow</strong> er det anbefalede flow. For offentlige klienter (SPA'er og mobil-apps, der
        ikke kan holde en secret hemmelig) udvides det med <strong>PKCE</strong> (Proof Key for Code Exchange, udtales "pixy"):
      </p>
      <ul>
        <li>Klienten genererer en tilfældig <code>code_verifier</code> og sender kun dens hash (<code>code_challenge</code>, S256) i starten.</li>
        <li>Når <code>code</code> byttes til tokens, sendes den originale <code>code_verifier</code>. Auth-serveren sammenligner.</li>
        <li>En angriber, der opsnapper koden undervejs, mangler verifier'en og kan ikke bruge koden.</li>
      </ul>
      <Callout type="info">
        <strong>Fravalgt:</strong> <em>implicit flow</em> (tokens i URL'en – forældet) og <em>resource owner password
        credentials</em> (appen modtager adgangskoden – bryder hele ideen). Brug ikke disse.
      </Callout>

      <h2>Eksempel: Mercantec Auth</h2>
      <p>
        Mercantec Auth er den centrale auth-platform, vi bruger i alle apps. Det er en OAuth 2.0-server med PKCE,
        JWT (RS256) og roterende refresh tokens. Den understøtter flere loginmetoder (adgangskode, passkey, eksterne
        udbydere som Microsoft/GitHub/Google) og opt-in MFA, konfigureret pr. OAuth-klient.
      </p>
      <table>
        <thead>
          <tr><th>Egenskab</th><th>Værdi</th></tr>
        </thead>
        <tbody>
          <tr><td>Base URL / issuer (<code>iss</code>)</td><td><code>https://auth.mercantec.tech</code></td></tr>
          <tr><td>Audience (<code>aud</code>)</td><td><code>mercantec-apps</code></td></tr>
          <tr><td>Authorize</td><td><code>/oauth/authorize</code> (fuld browser-navigation)</td></tr>
          <tr><td>Token</td><td><code>/oauth/token</code> (POST, <code>application/x-www-form-urlencoded</code>)</td></tr>
          <tr><td>JWKS</td><td><code>/.well-known/jwks.json</code></td></tr>
          <tr><td>OIDC discovery</td><td><code>/.well-known/openid-configuration</code></td></tr>
          <tr><td>Signatur</td><td>RS256 – valideres mod JWKS, aldrig delt secret</td></tr>
          <tr><td>Access token</td><td>Kort levetid (typisk ca. 15 minutter)</td></tr>
          <tr><td>Refresh token</td><td>Roterende – gem altid det nyeste</td></tr>
        </tbody>
      </table>
      <p>
        Autoritativ beskrivelse: <code>https://auth.mercantec.tech/.well-known/mercantec-auth.json</code>. Du skal have
        registreret et <code>client_id</code> og de <strong>eksakte</strong> redirect-URI'er hos administratoren
        (mags@mercantec.dk).
      </p>

      <h3>Flowet trin for trin</h3>
      <MermaidDiagram chart={pkceChart} />

      <h3>1) Start login (SPA)</h3>
      <CodeBlock language="ts">{pkceGen}</CodeBlock>
      <CodeBlock language="ts">{loginStart}</CodeBlock>

      <h3>2) Callback – validér state og byt kode til tokens</h3>
      <CodeBlock language="ts">{callback}</CodeBlock>

      <h3>3) Kald API'et med Bearer og ét refresh-forsøg</h3>
      <CodeBlock language="ts">{fetchWrapper}</CodeBlock>

      <Callout type="warn">
        <strong>Token-opbevaring i SPA:</strong> brug <code>sessionStorage</code> eller hukommelse – <strong>ikke</strong>{' '}
        <code>localStorage</code>, der overlever faneluk og er mere eksponeret ved XSS. Ingen af delene er immune mod XSS, så
        XSS-forsvar (CSP, output-encoding) er stadig afgørende. Hold access tokens korte.
      </Callout>

      <h3>Logout – kun lokalt</h3>
      <p>
        I vores apps betyder "log ud": <strong>ryd tokens lokalt og send brugeren til appens egen login-side</strong> (se{' '}
        <code>logoutLocal()</code> ovenfor). Kald <strong>aldrig</strong> <code>https://auth.mercantec.tech/signout</code> fra
        en SPA – det logger brugeren ud af hele Auth-sessionen og dermed ud af alle andre Mercantec-apps. Fuld signout er
        kun til en eksplicit "log ud overalt"-funktion.
      </p>

      <h2>Backend: validér JWT'et</h2>
      <p>
        Frontenden er en <em>offentlig PKCE-klient</em>; backend laver <strong>ikke</strong> login-flowet, men validerer blot
        hvert indkommende token. Returnér <strong>401</strong> ved ugyldigt/manglende token og <strong>403</strong> ved
        manglende rolle.
      </p>
      <CodeBlock language="csharp">{apiAuth}</CodeBlock>
      <Callout type="tip">
        Brug <code>sub</code> (GUID) som bruger-nøgle i jeres egen database – <strong>aldrig e-mail</strong>, som kan ændres
        og ikke er unik over tid.
      </Callout>
      <Callout type="info">
        Koden er en forkortet illustration. Pointen er altid den samme: <em>valider mod JWKS, tjek iss/aud/exp/kid, ingen delt
        secret</em>. Konfigurationen hentes fra miljøet (<code>AUTH_ISSUER</code>, <code>AUTH_AUDIENCE</code>,{' '}
        <code>JWKS_URI</code>) – aldrig hårdkodet. Med <code>MapInboundClaims = false</code> hedder rolle-claim'et{' '}
        <code>role</code>; med .NET's standard-mapping bliver det til den lange claim-type{' '}
        <code>http://schemas.microsoft.com/ws/2008/06/identity/claims/role</code>.
      </Callout>

      <h3>Authorization i praksis: roller og ejerskab</h3>
      <CodeBlock language="csharp">{ownership}</CodeBlock>

      <h2>Almindelige fejl</h2>
      <table>
        <thead>
          <tr><th>Fejl</th><th>Hvorfor er det slemt?</th><th>Bedre</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Egen login/JWT-implementering med delt secret</td>
            <td>Svær at gøre sikkert; secret lækker = alle kan forfalske tokens</td>
            <td>Central IdP + asymmetrisk signatur (JWKS)</td>
          </tr>
          <tr>
            <td>Token i <code>localStorage</code></td>
            <td>Bliver stående; let at stjæle ved XSS</td>
            <td><code>sessionStorage</code>/hukommelse, korte tokens</td>
          </tr>
          <tr>
            <td>Mangler <code>state</code>-validering</td>
            <td>Login-CSRF</td>
            <td>Gem og sammenlign <code>state</code></td>
          </tr>
          <tr>
            <td>Kun klient-side adgangskontrol</td>
            <td>Skjult knap er ikke beskyttelse – API'et kan kaldes direkte</td>
            <td>Tjek altid rettigheder på serveren</td>
          </tr>
          <tr>
            <td>Springer <code>aud</code>/<code>iss</code>-tjek over</td>
            <td>Tokens fra andre systemer accepteres</td>
            <td>Validér alle claims</td>
          </tr>
          <tr>
            <td>E-mail som bruger-ID</td>
            <td>Kan ændres/genbruges → kontosammenblanding</td>
            <td><code>sub</code> (GUID)</td>
          </tr>
          <tr>
            <td>Ingen rate limiting på login</td>
            <td>Brute force og credential stuffing</td>
            <td>Lockout, rate limits, MFA</td>
          </tr>
        </tbody>
      </table>

      <h2>Opsummering</h2>
      <ul>
        <li>Identifikation = påstand; authentication = bevis (401); authorization = rettighed (403).</li>
        <li>Sessioner holder tilstand på serveren; JWT er stateless og kræver streng validering.</li>
        <li>Authorization code + PKCE er standarden for SPA'er – ingen implicit flow, ingen password grant.</li>
        <li>Mercantec Auth: iss <code>https://auth.mercantec.tech</code>, aud <code>mercantec-apps</code>, RS256 via JWKS.</li>
        <li>SPA: tokens i sessionStorage, validér state, ét refresh-forsøg, kun lokal logout.</li>
        <li>Backend: valider JWT, brug <code>sub</code> som nøgle, tjek både rolle og ejerskab.</li>
      </ul>

      <h2>Øvelser</h2>
      <ol>
        <li>Forklar forskellen på 401 og 403 med et konkret endpoint i jeres projekt.</li>
        <li>Tegn selv PKCE-flowet. Hvad ville en angriber, der opsnapper <code>code</code>, mangle for at bruge den?</li>
        <li>Indsæt et access token i en JWT-dekoder (fx jwt.io) – <em>kun et testtoken</em> – og find <code>iss</code>, <code>aud</code>, <code>sub</code>, <code>exp</code>. Hvorfor er det okay at kunne læse indholdet?</li>
        <li>Implementér <code>logoutLocal()</code> i jeres SPA og verificér, at andre Mercantec-apps stadig er logget ind.</li>
        <li>Tilføj ejerskabskontrol på et endpoint, så bruger A ikke kan hente bruger B's data via ID, og skriv en test, der dokumenterer det.</li>
      </ol>
    </LessonLayout>
  )
}
