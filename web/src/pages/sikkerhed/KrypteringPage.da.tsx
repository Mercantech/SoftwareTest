import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'

const handshakeChart = `
sequenceDiagram
    participant B as Browser
    participant S as Server
    B->>S: ClientHello - understøttede cipher suites, TLS-version, key share
    S->>B: ServerHello - valgt cipher suite, key share
    S->>B: Certifikat + signatur
    Note over B: Validerer certifikatkæde, domænenavn og udløbsdato
    B->>S: Finished - nu krypteret med sessionsnøgle
    S->>B: Finished
    B->>S: HTTP-request - krypteret
    S->>B: HTTP-response - krypteret
`

const hybridChart = `
flowchart LR
    A["Asymmetrisk kryptering - langsom, bruges til nøgleudveksling og identitet"] --> B["Fælles sessionsnøgle aftales"]
    B --> C["Symmetrisk kryptering - hurtig, bruges til selve dataene"]
`

const chainChart = `
flowchart TD
    R["Root CA - ligger i browserens/OS' trust store"] --> I["Intermediate CA"]
    I --> L["Server-certifikat for fx app.mercantec.tech"]
    L --> V["Browseren stoler på serveren hvis hele kæden kan valideres"]
`

const aesExample = `using System.Security.Cryptography;

// AES-GCM: autentificeret kryptering (fortrolighed + integritet i ét).
// Eksemplet viser at man bruger de FÆRDIGE primitiver i .NET - ikke selvopfundne algoritmer.
public static class SimpleCrypto
{
    public static byte[] Encrypt(byte[] plaintext, byte[] key, out byte[] nonce, out byte[] tag)
    {
        nonce = RandomNumberGenerator.GetBytes(AesGcm.NonceByteSizes.MaxSize); // 12 bytes, ALDRIG genbrug med samme nøgle
        tag = new byte[AesGcm.TagByteSizes.MaxSize];                           // 16 bytes
        var ciphertext = new byte[plaintext.Length];

        using var aes = new AesGcm(key, tag.Length);
        aes.Encrypt(nonce, plaintext, ciphertext, tag);
        return ciphertext;
    }

    public static byte[] Decrypt(byte[] ciphertext, byte[] key, byte[] nonce, byte[] tag)
    {
        var plaintext = new byte[ciphertext.Length];
        using var aes = new AesGcm(key, tag.Length);
        aes.Decrypt(nonce, ciphertext, tag, plaintext); // kaster CryptographicException hvis data er ændret
        return plaintext;
    }
}

// Nøglen (32 bytes = AES-256) skal komme fra en secret store / miljøvariabel - aldrig fra kildekoden.
// var key = Convert.FromBase64String(Environment.GetEnvironmentVariable("DATA_KEY")!);`

const rsaExample = `using System.Security.Cryptography;

// Asymmetrisk: en nøglepar. Den offentlige nøgle må deles - den private må ALDRIG forlade ejeren.
using var rsa = RSA.Create(3072);

byte[] data = "Hej verden"u8.ToArray();

// Signering: bevis for afsender + at data ikke er ændret
byte[] signature = rsa.SignData(data, HashAlgorithmName.SHA256, RSASignaturePadding.Pss);

// Verifikation kan ske med KUN den offentlige nøgle
using var publicOnly = RSA.Create();
publicOnly.ImportRSAPublicKey(rsa.ExportRSAPublicKey(), out _);
bool ok = publicOnly.VerifyData(data, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pss);

Console.WriteLine(ok); // True`

const kestrelProgram = `var builder = WebApplication.CreateBuilder(args);

// Kestrel læser certifikat og porte fra konfiguration (appsettings / miljøvariabler)
// Eksempel på miljøvariabler (Docker/Compose):
//   ASPNETCORE_URLS=https://+:8443;http://+:8080
//   ASPNETCORE_Kestrel__Certificates__Default__Path=/https/app.pfx
//   ASPNETCORE_Kestrel__Certificates__Default__Password=<fra secret store>
builder.WebHost.ConfigureKestrel(options =>
{
    options.ConfigureHttpsDefaults(https =>
    {
        // Lad OS vælge sikre standarder; sæt kun eksplicit hvis I har et krav
        https.SslProtocols = System.Security.Authentication.SslProtocols.Tls12
                           | System.Security.Authentication.SslProtocols.Tls13;
    });
});

// HSTS: browseren husker at siden KUN må tilgås via HTTPS
builder.Services.AddHsts(o =>
{
    o.MaxAge = TimeSpan.FromDays(365);
    o.IncludeSubDomains = true;
    // o.Preload = true; // kun hvis I bevidst vil på browsernes preload-liste
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts(); // sender Strict-Transport-Security headeren
}

app.UseHttpsRedirection(); // 307/308 fra http:// til https://

app.MapGet("/", () => "Hej over TLS!");
app.Run();`

const devCert = `# Lokalt udviklingscertifikat til ASP.NET (selvsigneret, KUN til udvikling)
dotnet dev-certs https --trust

# Eksportér til brug i container under udvikling
dotnet dev-certs https -ep ./https/aspnetapp.pfx -p <kodeord-kun-til-dev>`

const nginxConf = `# nginx som TLS-terminering foran api (web-containeren i vores Docker-opsætning)
server {
    listen 80;
    server_name app.example.dk;
    return 301 https://$host$request_uri;       # tving HTTPS
}

server {
    listen 443 ssl;
    http2 on;
    server_name app.example.dk;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;  # server + intermediate
    ssl_certificate_key /etc/nginx/certs/privkey.pem;    # ALDRIG i git

    ssl_protocols TLSv1.2 TLSv1.3;                       # ingen SSLv3 / TLS 1.0 / 1.1
    ssl_prefer_server_ciphers off;                       # moderne klienter vælger selv fornuftigt
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /api/ {
        proxy_pass http://api:8080/api/;                 # internt net - se Docker/Dokploy-reglerne
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`

const forwardedHeaders = `// Når TLS termineres i en proxy (nginx/Traefik), ser Kestrel kun HTTP.
// Fortæl ASP.NET at den skal stole på X-Forwarded-* fra proxyen, så Request.Scheme bliver "https".
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // I produktion: begræns til jeres proxy via KnownProxies/KnownNetworks
});

var app = builder.Build();
app.UseForwardedHeaders();`

const opensslCheck = `# Se hvilket certifikat en server præsenterer (read-only, på dine EGNE domæner)
openssl s_client -connect app.example.dk:443 -servername app.example.dk </dev/null 2>/dev/null \\
  | openssl x509 -noout -subject -issuer -dates

# Se udløbsdato på en lokal certifikatfil
openssl x509 -in fullchain.pem -noout -enddate`

export default function KrypteringPageDa() {
  const objective = getObjectiveByPath('/sikkerhed/kryptering')

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Kryptering, SSL og TLS {objective ? <ObjectiveBadge level={objective.level} /> : null}
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

      <h2>Hvorfor kryptering?</h2>
      <p>
        Data på en webapplikation bevæger sig gennem mange led: brugerens browser, Wi-Fi, internetudbyder,
        load balancer, API, database og backup. Uden kryptering kan alle, der kan se trafikken eller
        få fat i lagringsmediet, læse indholdet. Kryptering giver os tre ting, som ofte kaldes
        sikkerhedens grundpiller (<strong>CIA</strong>):
      </p>
      <ul>
        <li>
          <strong>Confidentiality (fortrolighed)</strong> – kun de rette kan læse data.
        </li>
        <li>
          <strong>Integrity (integritet)</strong> – data er ikke ændret undervejs.
        </li>
        <li>
          <strong>Availability (tilgængelighed)</strong> – systemet virker, når det skal. Kryptering
          bidrager indirekte (fx ved at beskytte mod manipulerede svar), men er ikke hovedværktøjet her.
        </li>
      </ul>
      <p>
        Vi skelner mellem kryptering <strong>i transit</strong> (data på vej over netværket, fx TLS) og{' '}
        <strong>at rest</strong> (data gemt på disk/i database, fx krypterede diske eller kolonner).
        En webapplikation har brug for begge dele.
      </p>

      <h2>Symmetrisk kryptering</h2>
      <p>
        Her bruges <strong>samme nøgle</strong> til at kryptere og dekryptere. Det er hurtigt og egner sig til
        store datamængder. Den store udfordring er <em>nøgledistribution</em>: hvordan får de to parter den
        fælles nøgle uden at andre opsnapper den?
      </p>
      <ul>
        <li>
          <strong>AES</strong> (Advanced Encryption Standard) er standarden i dag. Nøglelængde 128, 192 eller 256 bit.
        </li>
        <li>
          <strong>Driftsmodus</strong> er afgørende: brug en <em>autentificeret</em> modus som{' '}
          <strong>AES-GCM</strong> (eller ChaCha20-Poly1305). Den giver både fortrolighed og integritet.
          Den gamle ECB-modus afslører mønstre i data og må aldrig bruges.
        </li>
        <li>
          Et <strong>nonce/IV</strong> skal være unikt for hver kryptering med samme nøgle.
        </li>
        <li>
          Forældede: DES, 3DES, RC4. De findes i gamle systemer, men skal udfases.
        </li>
      </ul>
      <CodeBlock language="csharp">{aesExample}</CodeBlock>

      <h2>Asymmetrisk kryptering</h2>
      <p>
        Her findes et <strong>nøglepar</strong>: en <em>offentlig</em> nøgle, som alle må få, og en{' '}
        <em>privat</em> nøgle, som kun ejeren kender. Det løser distributionsproblemet, men er langsomt
        og bruges derfor til små opgaver:
      </p>
      <ul>
        <li>
          <strong>Kryptering til modtager</strong>: afsender krypterer med modtagerens offentlige nøgle – kun den private kan åbne.
        </li>
        <li>
          <strong>Digital signatur</strong>: ejeren signerer med sin private nøgle – alle kan verificere med den offentlige.
          Det er sådan JWT'er (RS256) og certifikater virker.
        </li>
        <li>
          <strong>Nøgleaftale</strong> (Diffie-Hellman / ECDHE): to parter udleder en fælles hemmelighed over en åben linje.
        </li>
      </ul>
      <p>Kendte algoritmer: RSA (min. 2048 bit, helst 3072), elliptiske kurver (ECDSA, Ed25519, X25519).</p>
      <CodeBlock language="csharp">{rsaExample}</CodeBlock>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>Symmetrisk</th>
            <th>Asymmetrisk</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nøgler</td>
            <td>Én fælles hemmelig nøgle</td>
            <td>Offentlig + privat nøglepar</td>
          </tr>
          <tr>
            <td>Hastighed</td>
            <td>Meget hurtig</td>
            <td>Langsom (100-1000x)</td>
          </tr>
          <tr>
            <td>Typisk brug</td>
            <td>Selve datakrypteringen (filer, database, TLS-trafik)</td>
            <td>Nøgleudveksling, signaturer, identitet</td>
          </tr>
          <tr>
            <td>Eksempler</td>
            <td>AES-GCM, ChaCha20-Poly1305</td>
            <td>RSA, ECDSA, Ed25519, ECDH</td>
          </tr>
        </tbody>
      </table>

      <h3>Hybrid – sådan bruges de i praksis</h3>
      <p>
        Næsten al praktisk kryptering er <strong>hybrid</strong>: asymmetrisk kryptografi bruges til at
        aftale en nøgle og bevise identitet, hvorefter hurtig symmetrisk kryptering tager over. Det er præcis det, TLS gør.
      </p>
      <MermaidDiagram chart={hybridChart} />

      <Callout type="danger">
        <strong>Rul aldrig din egen kryptografi.</strong> Opfind ikke egne algoritmer, og kombiner ikke primitiver
        på egen hånd (fx "XOR med en nøgle" eller "Base64 er jo næsten kryptering"). Brug veletablerede biblioteker
        (<code>System.Security.Cryptography</code>, libsodium, TLS) i deres anbefalede modes. Husk: <em>Base64 er
        kodning, ikke kryptering</em> – alle kan afkode det uden nøgle.
      </Callout>

      <h2>SSL, TLS og HTTPS – hvad er forskellen?</h2>
      <p>
        <strong>SSL</strong> (Secure Sockets Layer) blev udviklet af Netscape i 1990'erne. SSL 2.0 og 3.0 viste sig at have
        alvorlige svagheder (bl.a. POODLE-angrebet mod SSL 3.0), og protokollen blev afløst af{' '}
        <strong>TLS</strong> (Transport Layer Security). Navnet "SSL" hænger dog ved i daglig tale og i målpinde som denne –
        når nogen siger "SSL-certifikat", mener de i praksis et TLS-certifikat.
      </p>
      <table>
        <thead>
          <tr>
            <th>Protokol</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SSL 2.0 / 3.0</td>
            <td>Usikre – skal være slået fra</td>
          </tr>
          <tr>
            <td>TLS 1.0 / 1.1</td>
            <td>Forældede (officielt udfaset 2021) – slå fra</td>
          </tr>
          <tr>
            <td>TLS 1.2</td>
            <td>Sikker ved korrekt konfiguration – stadig udbredt</td>
          </tr>
          <tr>
            <td>TLS 1.3</td>
            <td>Nuværende standard: hurtigere handshake, kun moderne ciphers, forward secrecy som standard</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>HTTPS</strong> er blot HTTP kørt oven på TLS (port 443 i stedet for 80). Det giver tre garantier:
        krypteret trafik, integritet (ingen kan ændre indholdet uden at det opdages) og <em>autenticitet</em> (du taler
        med den rigtige server – takket være certifikatet).
      </p>

      <h2>TLS-handshake i overblik</h2>
      <MermaidDiagram chart={handshakeChart} />
      <p>
        Under handshake'en aftales protokolversion og cipher suite, serveren beviser sin identitet med et certifikat,
        og parterne udleder en fælles sessionsnøgle via (EC)DHE. <strong>Forward secrecy</strong> betyder, at
        sessionsnøglerne er flygtige: selv hvis serverens private nøgle senere lækkes, kan gammel optaget trafik ikke dekrypteres.
      </p>

      <h2>Certifikater og tillidskæder</h2>
      <p>
        Et X.509-certifikat binder en <strong>offentlig nøgle</strong> til en <strong>identitet</strong> (domænenavn) og er
        signeret af en <strong>Certificate Authority (CA)</strong>. Browseren har en liste over CA'er, den stoler på
        (trust store), og validerer hele kæden:
      </p>
      <MermaidDiagram chart={chainChart} />
      <p>Browseren tjekker bl.a.:</p>
      <ul>
        <li>Er certifikatet signeret af en betroet kæde?</li>
        <li>Matcher domænet (Subject Alternative Name) det, brugeren besøger?</li>
        <li>Er certifikatet inden for gyldighedsperioden?</li>
        <li>Er det tilbagekaldt (revocation)?</li>
      </ul>
      <p>Typer og udstedelse:</p>
      <ul>
        <li>
          <strong>Let's Encrypt</strong> udsteder gratis, automatiserede certifikater (ACME-protokollen) med kort levetid, som fornys automatisk.
        </li>
        <li>
          <strong>Wildcard</strong> (<code>*.mercantec.tech</code>) dækker alle underdomæner på ét niveau.
        </li>
        <li>
          <strong>Selvsignerede</strong> certifikater giver kryptering, men ingen tillid – kun til udvikling og test.
        </li>
        <li>
          I vores hosting-setup kan <strong>Cloudflare</strong> eller <strong>Traefik</strong> (Dokploy) stå for
          TLS-termineringen, så applikationen kun taler HTTP internt på et lukket netværk.
        </li>
      </ul>

      <Callout type="warn">
        Et certifikat der udløber, er en klassisk driftsfejl: brugerne møder en stor rød advarsel. Automatisér fornyelse
        (ACME) og overvåg udløbsdatoer. Og <strong>klik aldrig "fortsæt alligevel"</strong> som vane – og slå aldrig
        certifikatvalidering fra i kode (fx <code>ServerCertificateCustomValidationCallback = (...) =&gt; true</code>)
        for at "få det til at virke".
      </Callout>

      <h2>HSTS og andre HTTPS-forstærkere</h2>
      <ul>
        <li>
          <strong>HTTP → HTTPS redirect</strong>: alle http://-kald sendes videre til https://.
        </li>
        <li>
          <strong>HSTS</strong> (<code>Strict-Transport-Security</code>): en header, der fortæller browseren "denne site må kun
          tilgås via HTTPS i de næste N sekunder". Det forhindrer <em>SSL-stripping</em>, hvor en
          man-in-the-middle forsøger at nedgradere forbindelsen til HTTP. Første besøg er stadig sårbart – derfor findes{' '}
          <strong>HSTS preload</strong>.
        </li>
        <li>
          <strong>Secure-flag på cookies</strong>: cookien sendes kun over HTTPS. Kombinér med <code>HttpOnly</code> og{' '}
          <code>SameSite</code>.
        </li>
        <li>
          <strong>Mixed content</strong>: HTTPS-sider må ikke indlæse scripts/billeder over HTTP – browsere blokerer det.
        </li>
      </ul>
      <CodeBlock language="http">{`HTTP/1.1 200 OK
Strict-Transport-Security: max-age=31536000; includeSubDomains
Set-Cookie: session=...; Secure; HttpOnly; SameSite=Lax`}</CodeBlock>

      <Callout type="warn">
        Start HSTS med en kort <code>max-age</code> (fx en dag), og øg gradvist. Hvis I aktiverer en lang HSTS og
        derefter ikke kan levere HTTPS (fx udløbet certifikat), bliver siden utilgængelig for brugerne.
      </Callout>

      <h2>TLS i ASP.NET / Kestrel</h2>
      <p>
        Kestrel kan terminere TLS selv, men i praksis står ofte en reverse proxy foran. Uanset hvad skal
        HTTPS-omdirigering og HSTS være på plads. Under udvikling bruges et lokalt udviklingscertifikat:
      </p>
      <CodeBlock language="bash">{devCert}</CodeBlock>
      <CodeBlock language="csharp">{kestrelProgram}</CodeBlock>

      <h3>Når TLS termineres af en proxy</h3>
      <p>
        I vores standardopsætning (Cloudflare → Traefik → nginx i <code>web</code>) afsluttes HTTPS ude i kanten, mens
        trafikken internt i Docker-netværket kører som HTTP. Så skal ASP.NET have at vide, at den oprindelige
        forespørgsel var HTTPS – ellers laver den fx forkerte redirect-URL'er:
      </p>
      <CodeBlock language="csharp">{forwardedHeaders}</CodeBlock>

      <h2>TLS i nginx</h2>
      <p>
        Hvis nginx selv terminerer TLS (fx på en VPS uden Traefik), ser en solid minimumskonfiguration sådan ud.
        Brug Mozillas <em>SSL Configuration Generator</em> som reference for aktuelle anbefalinger frem for at kopiere
        gamle blogindlæg.
      </p>
      <CodeBlock language="nginx">{nginxConf}</CodeBlock>

      <Callout type="info">
        <strong>Hold private nøgler hemmelige.</strong> <code>privkey.pem</code>, <code>.pfx</code>-filer og
        kodeord hører hjemme i en secret store, Docker secrets eller Dokploy-miljøet – aldrig i git. Roter dem, hvis
        de mistænkes kompromitteret.
      </Callout>

      <h2>Kryptering at rest (kort)</h2>
      <ul>
        <li>
          <strong>Disk-/volumekryptering</strong> (BitLocker, LUKS, cloud-udbyderens encryption) beskytter mod tyveri af fysiske medier.
        </li>
        <li>
          <strong>Kolonne-/felt-kryptering</strong> til særligt følsomme felter (fx CPR-nummer) – brug AES-GCM og en
          nøgle fra en secret store/KMS, ikke i samme database som data.
        </li>
        <li>
          <strong>Backups</strong> skal også være krypterede.
        </li>
        <li>
          <strong>Adgangskoder krypteres ikke – de hashes</strong> (se lektionen om hashing).
        </li>
      </ul>

      <h2>Praktisk kontrol – på egne systemer</h2>
      <p>
        Du kan altid se, hvad din egen server præsenterer. Brug kun disse kommandoer på domæner, du selv ejer eller har lov
        til at teste.
      </p>
      <CodeBlock language="bash">{opensslCheck}</CodeBlock>
      <p>
        Ekstern vurdering af TLS-konfigurationen kan fås via fx <strong>SSL Labs</strong> – se lektionen om security tools.
      </p>

      <h2>Typiske fejl</h2>
      <table>
        <thead>
          <tr>
            <th>Fejl</th>
            <th>Konsekvens</th>
            <th>Rettelse</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HTTP uden redirect til HTTPS</td>
            <td>Trafik kan aflyttes/manipuleres</td>
            <td>Redirect + HSTS</td>
          </tr>
          <tr>
            <td>Gamle protokoller (TLS 1.0/1.1) aktive</td>
            <td>Kendte svagheder, dårlig score</td>
            <td>Kun TLS 1.2 og 1.3</td>
          </tr>
          <tr>
            <td>Certifikatvalidering slået fra i klientkode</td>
            <td>Man-in-the-middle bliver triviel</td>
            <td>Installér korrekt CA/cert i stedet</td>
          </tr>
          <tr>
            <td>Hårdkodede nøgler/kodeord i repo</td>
            <td>Alle med adgang til repo kan dekryptere</td>
            <td>Secret store, miljøvariabler</td>
          </tr>
          <tr>
            <td>Egen "krypteringsalgoritme"</td>
            <td>Brydes typisk på minutter</td>
            <td>AES-GCM / TLS fra standardbibliotek</td>
          </tr>
          <tr>
            <td>Udløbet certifikat</td>
            <td>Nedetid / advarsler</td>
            <td>Automatisk fornyelse + monitorering</td>
          </tr>
        </tbody>
      </table>

      <h2>Opsummering</h2>
      <ul>
        <li>Symmetrisk = hurtig, én nøgle. Asymmetrisk = nøglepar, bruges til nøgleudveksling og signaturer. TLS bruger begge.</li>
        <li>SSL er historisk og usikkert; vi bruger TLS 1.2/1.3, men siger stadig "SSL-certifikat".</li>
        <li>HTTPS = HTTP over TLS. Certifikater skaber tillid via en CA-kæde.</li>
        <li>Aktivér redirect, HSTS og Secure-cookies. Hold nøgler uden for git.</li>
        <li>Rul aldrig din egen kryptografi.</li>
      </ul>

      <h2>Øvelser</h2>
      <ol>
        <li>Åbn en HTTPS-side i browseren, find certifikatet og notér udsteder, udløbsdato og SAN-liste.</li>
        <li>Forklar med egne ord, hvorfor TLS bruger både asymmetrisk og symmetrisk kryptering.</li>
        <li>Tilføj <code>UseHsts</code> og <code>UseHttpsRedirection</code> til et ASP.NET-projekt og kontrollér headeren i browserens devtools (Network-fanen).</li>
        <li>Opret et lokalt udviklingscertifikat med <code>dotnet dev-certs</code> og kør API'et over HTTPS.</li>
        <li>Diskussion: hvad er forskellen på at kryptere en adgangskode og at hashe den? Hvorfor vælger vi det ene?</li>
      </ol>
    </LessonLayout>
  )
}
