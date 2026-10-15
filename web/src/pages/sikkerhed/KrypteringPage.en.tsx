import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const handshakeChart = `
sequenceDiagram
    participant B as Browser
    participant S as Server
    B->>S: ClientHello - supported cipher suites, TLS version, key share
    S->>B: ServerHello - chosen cipher suite, key share
    S->>B: Certificate + signature
    Note over B: Validates certificate chain, domain name and expiry date
    B->>S: Finished - now encrypted with the session key
    S->>B: Finished
    B->>S: HTTP request - encrypted
    S->>B: HTTP response - encrypted
`

const hybridChart = `
flowchart LR
    A["Asymmetric encryption - slow, used for key exchange and identity"] --> B["A shared session key is agreed"]
    B --> C["Symmetric encryption - fast, used for the data itself"]
`

const chainChart = `
flowchart TD
    R["Root CA - lives in the browser's/OS trust store"] --> I["Intermediate CA"]
    I --> L["Server certificate for e.g. app.mercantec.tech"]
    L --> V["The browser trusts the server if the whole chain can be validated"]
`

const aesExample = `using System.Security.Cryptography;

// AES-GCM: authenticated encryption (confidentiality + integrity in one).
// The example uses the READY-MADE primitives in .NET - not home-grown algorithms.
public static class SimpleCrypto
{
    public static byte[] Encrypt(byte[] plaintext, byte[] key, out byte[] nonce, out byte[] tag)
    {
        nonce = RandomNumberGenerator.GetBytes(AesGcm.NonceByteSizes.MaxSize); // 12 bytes, NEVER reuse with the same key
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
        aes.Decrypt(nonce, ciphertext, tag, plaintext); // throws CryptographicException if data was altered
        return plaintext;
    }
}

// The key (32 bytes = AES-256) must come from a secret store / environment variable - never from source code.
// var key = Convert.FromBase64String(Environment.GetEnvironmentVariable("DATA_KEY")!);`

const rsaExample = `using System.Security.Cryptography;

// Asymmetric: a key pair. The public key may be shared - the private key must NEVER leave its owner.
using var rsa = RSA.Create(3072);

byte[] data = "Hello world"u8.ToArray();

// Signing: proof of sender + that data has not been altered
byte[] signature = rsa.SignData(data, HashAlgorithmName.SHA256, RSASignaturePadding.Pss);

// Verification can be done with ONLY the public key
using var publicOnly = RSA.Create();
publicOnly.ImportRSAPublicKey(rsa.ExportRSAPublicKey(), out _);
bool ok = publicOnly.VerifyData(data, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pss);

Console.WriteLine(ok); // True`

const kestrelProgram = `var builder = WebApplication.CreateBuilder(args);

// Kestrel reads certificate and ports from configuration (appsettings / environment variables)
// Example environment variables (Docker/Compose):
//   ASPNETCORE_URLS=https://+:8443;http://+:8080
//   ASPNETCORE_Kestrel__Certificates__Default__Path=/https/app.pfx
//   ASPNETCORE_Kestrel__Certificates__Default__Password=<from secret store>
builder.WebHost.ConfigureKestrel(options =>
{
    options.ConfigureHttpsDefaults(https =>
    {
        // Let the OS pick secure defaults; only set explicitly if you have a requirement
        https.SslProtocols = System.Security.Authentication.SslProtocols.Tls12
                           | System.Security.Authentication.SslProtocols.Tls13;
    });
});

// HSTS: the browser remembers that the site may ONLY be accessed via HTTPS
builder.Services.AddHsts(o =>
{
    o.MaxAge = TimeSpan.FromDays(365);
    o.IncludeSubDomains = true;
    // o.Preload = true; // only if you deliberately want to join the browsers' preload list
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts(); // sends the Strict-Transport-Security header
}

app.UseHttpsRedirection(); // 307/308 from http:// to https://

app.MapGet("/", () => "Hello over TLS!");
app.Run();`

const devCert = `# Local development certificate for ASP.NET (self-signed, ONLY for development)
dotnet dev-certs https --trust

# Export for use in a container during development
dotnet dev-certs https -ep ./https/aspnetapp.pfx -p <password-for-dev-only>`

const nginxConf = `# nginx as TLS termination in front of the api (the web container in our Docker setup)
server {
    listen 80;
    server_name app.example.dk;
    return 301 https://$host$request_uri;       # force HTTPS
}

server {
    listen 443 ssl;
    http2 on;
    server_name app.example.dk;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;  # server + intermediate
    ssl_certificate_key /etc/nginx/certs/privkey.pem;    # NEVER in git

    ssl_protocols TLSv1.2 TLSv1.3;                       # no SSLv3 / TLS 1.0 / 1.1
    ssl_prefer_server_ciphers off;                       # modern clients choose sensibly themselves
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /api/ {
        proxy_pass http://api:8080/api/;                 # internal network - see the Docker/Dokploy rules
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`

const forwardedHeaders = `// When TLS is terminated in a proxy (nginx/Traefik), Kestrel only sees HTTP.
// Tell ASP.NET to trust X-Forwarded-* from the proxy so that Request.Scheme becomes "https".
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    // In production: restrict to your proxy via KnownProxies/KnownNetworks
});

var app = builder.Build();
app.UseForwardedHeaders();`

const opensslCheck = `# See which certificate a server presents (read-only, on your OWN domains)
openssl s_client -connect app.example.dk:443 -servername app.example.dk </dev/null 2>/dev/null \\
  | openssl x509 -noout -subject -issuer -dates

# See the expiry date of a local certificate file
openssl x509 -in fullchain.pem -noout -enddate`

export default function KrypteringPageEn() {

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Encryption, SSL and TLS</h1>
<h2>Why encryption?</h2>
      <p>
        Data in a web application travels through many hops: the user's browser, Wi-Fi, the internet provider,
        load balancer, API, database and backups. Without encryption, anyone who can see the traffic or get hold of
        the storage medium can read the content. Encryption gives us three things, often called the pillars of
        security (<strong>CIA</strong>):
      </p>
      <ul>
        <li>
          <strong>Confidentiality</strong> – only the right parties can read the data.
        </li>
        <li>
          <strong>Integrity</strong> – the data has not been altered along the way.
        </li>
        <li>
          <strong>Availability</strong> – the system works when it should. Encryption contributes indirectly
          (e.g. by protecting against tampered responses), but it is not the main tool here.
        </li>
      </ul>
      <p>
        We distinguish between encryption <strong>in transit</strong> (data on its way across the network, e.g. TLS)
        and <strong>at rest</strong> (data stored on disk/in a database, e.g. encrypted disks or columns).
        A web application needs both.
      </p>

      <h2>Symmetric encryption</h2>
      <p>
        The <strong>same key</strong> is used to encrypt and decrypt. It is fast and well suited to large amounts of
        data. The big challenge is <em>key distribution</em>: how do the two parties get the shared key without
        anyone else intercepting it?
      </p>
      <ul>
        <li>
          <strong>AES</strong> (Advanced Encryption Standard) is today's standard. Key length 128, 192 or 256 bit.
        </li>
        <li>
          The <strong>mode of operation</strong> is crucial: use an <em>authenticated</em> mode such as{' '}
          <strong>AES-GCM</strong> (or ChaCha20-Poly1305). It provides both confidentiality and integrity.
          The old ECB mode reveals patterns in the data and must never be used.
        </li>
        <li>
          A <strong>nonce/IV</strong> must be unique for every encryption with the same key.
        </li>
        <li>
          Obsolete: DES, 3DES, RC4. They exist in old systems but must be phased out.
        </li>
      </ul>
      <CodeBlock language="csharp">{aesExample}</CodeBlock>

      <h2>Asymmetric encryption</h2>
      <p>
        Here there is a <strong>key pair</strong>: a <em>public</em> key that anyone may have, and a{' '}
        <em>private</em> key that only the owner knows. This solves the distribution problem, but it is slow
        and is therefore used for small tasks:
      </p>
      <ul>
        <li>
          <strong>Encrypting to a recipient</strong>: the sender encrypts with the recipient's public key – only the private key can open it.
        </li>
        <li>
          <strong>Digital signature</strong>: the owner signs with their private key – anyone can verify with the public key.
          This is how JWTs (RS256) and certificates work.
        </li>
        <li>
          <strong>Key agreement</strong> (Diffie-Hellman / ECDHE): two parties derive a shared secret over an open channel.
        </li>
      </ul>
      <p>Well-known algorithms: RSA (min. 2048 bit, preferably 3072), elliptic curves (ECDSA, Ed25519, X25519).</p>
      <CodeBlock language="csharp">{rsaExample}</CodeBlock>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>Symmetric</th>
            <th>Asymmetric</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Keys</td>
            <td>One shared secret key</td>
            <td>Public + private key pair</td>
          </tr>
          <tr>
            <td>Speed</td>
            <td>Very fast</td>
            <td>Slow (100-1000x)</td>
          </tr>
          <tr>
            <td>Typical use</td>
            <td>The data encryption itself (files, database, TLS traffic)</td>
            <td>Key exchange, signatures, identity</td>
          </tr>
          <tr>
            <td>Examples</td>
            <td>AES-GCM, ChaCha20-Poly1305</td>
            <td>RSA, ECDSA, Ed25519, ECDH</td>
          </tr>
        </tbody>
      </table>

      <h3>Hybrid – how they are used in practice</h3>
      <p>
        Almost all practical encryption is <strong>hybrid</strong>: asymmetric cryptography is used to agree on a key
        and prove identity, after which fast symmetric encryption takes over. That is exactly what TLS does.
      </p>
      <MermaidDiagram chart={hybridChart} />

      <Callout type="danger">
        <strong>Never roll your own cryptography.</strong> Do not invent your own algorithms, and do not combine
        primitives on your own (e.g. "XOR with a key" or "Base64 is almost encryption"). Use well-established libraries
        (<code>System.Security.Cryptography</code>, libsodium, TLS) in their recommended modes. Remember: <em>Base64 is
        encoding, not encryption</em> – anyone can decode it without a key.
      </Callout>

      <h2>SSL, TLS and HTTPS – what is the difference?</h2>
      <p>
        <strong>SSL</strong> (Secure Sockets Layer) was developed by Netscape in the 1990s. SSL 2.0 and 3.0 turned out to have
        serious weaknesses (including the POODLE attack against SSL 3.0), and the protocol was replaced by{' '}
        <strong>TLS</strong> (Transport Layer Security). The name "SSL" lingers in everyday speech and in learning objectives like this one –
        when someone says "SSL certificate", they in practice mean a TLS certificate.
      </p>
      <table>
        <thead>
          <tr>
            <th>Protocol</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>SSL 2.0 / 3.0</td>
            <td>Insecure – must be disabled</td>
          </tr>
          <tr>
            <td>TLS 1.0 / 1.1</td>
            <td>Deprecated (officially retired in 2021) – disable</td>
          </tr>
          <tr>
            <td>TLS 1.2</td>
            <td>Secure when configured correctly – still widespread</td>
          </tr>
          <tr>
            <td>TLS 1.3</td>
            <td>Current standard: faster handshake, only modern ciphers, forward secrecy by default</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>HTTPS</strong> is simply HTTP running on top of TLS (port 443 instead of 80). It gives three guarantees:
        encrypted traffic, integrity (no one can change the content without it being detected) and <em>authenticity</em> (you are talking
        to the right server – thanks to the certificate).
      </p>

      <h2>The TLS handshake at a glance</h2>
      <MermaidDiagram chart={handshakeChart} />
      <p>
        During the handshake the protocol version and cipher suite are agreed, the server proves its identity with a certificate,
        and the parties derive a shared session key via (EC)DHE. <strong>Forward secrecy</strong> means that
        the session keys are ephemeral: even if the server's private key is leaked later, previously recorded traffic cannot be decrypted.
      </p>

      <h2>Certificates and chains of trust</h2>
      <p>
        An X.509 certificate binds a <strong>public key</strong> to an <strong>identity</strong> (domain name) and is
        signed by a <strong>Certificate Authority (CA)</strong>. The browser has a list of CAs it trusts
        (the trust store) and validates the whole chain:
      </p>
      <MermaidDiagram chart={chainChart} />
      <p>The browser checks, among other things:</p>
      <ul>
        <li>Is the certificate signed by a trusted chain?</li>
        <li>Does the domain (Subject Alternative Name) match what the user is visiting?</li>
        <li>Is the certificate within its validity period?</li>
        <li>Has it been revoked?</li>
      </ul>
      <p>Types and issuance:</p>
      <ul>
        <li>
          <strong>Let's Encrypt</strong> issues free, automated certificates (the ACME protocol) with a short lifetime, which are renewed automatically.
        </li>
        <li>
          <strong>Wildcard</strong> (<code>*.mercantec.tech</code>) covers all subdomains one level down.
        </li>
        <li>
          <strong>Self-signed</strong> certificates provide encryption but no trust – for development and testing only.
        </li>
        <li>
          In our hosting setup, <strong>Cloudflare</strong> or <strong>Traefik</strong> (Dokploy) can handle
          TLS termination, so the application only speaks HTTP internally on a closed network.
        </li>
      </ul>

      <Callout type="warn">
        An expiring certificate is a classic operations error: users meet a big red warning. Automate renewal
        (ACME) and monitor expiry dates. And <strong>never click "proceed anyway"</strong> as a habit – and never turn off
        certificate validation in code (e.g. <code>ServerCertificateCustomValidationCallback = (...) =&gt; true</code>)
        just to "make it work".
      </Callout>

      <h2>HSTS and other HTTPS reinforcements</h2>
      <ul>
        <li>
          <strong>HTTP → HTTPS redirect</strong>: all http:// requests are forwarded to https://.
        </li>
        <li>
          <strong>HSTS</strong> (<code>Strict-Transport-Security</code>): a header that tells the browser "this site may only be
          accessed via HTTPS for the next N seconds". It prevents <em>SSL stripping</em>, where a
          man-in-the-middle tries to downgrade the connection to HTTP. The first visit is still vulnerable – which is why{' '}
          <strong>HSTS preload</strong> exists.
        </li>
        <li>
          <strong>Secure flag on cookies</strong>: the cookie is only sent over HTTPS. Combine with <code>HttpOnly</code> and{' '}
          <code>SameSite</code>.
        </li>
        <li>
          <strong>Mixed content</strong>: HTTPS pages must not load scripts/images over HTTP – browsers block it.
        </li>
      </ul>
      <CodeBlock language="http">{`HTTP/1.1 200 OK
Strict-Transport-Security: max-age=31536000; includeSubDomains
Set-Cookie: session=...; Secure; HttpOnly; SameSite=Lax`}</CodeBlock>

      <Callout type="warn">
        Start HSTS with a short <code>max-age</code> (e.g. one day) and increase it gradually. If you enable a long HSTS
        and then cannot deliver HTTPS (e.g. an expired certificate), the site becomes unavailable to users.
      </Callout>

      <h2>TLS in ASP.NET / Kestrel</h2>
      <p>
        Kestrel can terminate TLS itself, but in practice a reverse proxy often sits in front. Either way,
        HTTPS redirection and HSTS must be in place. During development a local development certificate is used:
      </p>
      <CodeBlock language="bash">{devCert}</CodeBlock>
      <CodeBlock language="csharp">{kestrelProgram}</CodeBlock>

      <h3>When TLS is terminated by a proxy</h3>
      <p>
        In our standard setup (Cloudflare → Traefik → nginx in <code>web</code>) HTTPS ends out at the edge, while
        traffic inside the Docker network runs as HTTP. ASP.NET then needs to know that the original
        request was HTTPS – otherwise it produces e.g. wrong redirect URLs:
      </p>
      <CodeBlock language="csharp">{forwardedHeaders}</CodeBlock>

      <h2>TLS in nginx</h2>
      <p>
        If nginx terminates TLS itself (e.g. on a VPS without Traefik), a solid minimum configuration looks like this.
        Use Mozilla's <em>SSL Configuration Generator</em> as a reference for current recommendations instead of copying
        old blog posts.
      </p>
      <CodeBlock language="nginx">{nginxConf}</CodeBlock>

      <Callout type="info">
        <strong>Keep private keys secret.</strong> <code>privkey.pem</code>, <code>.pfx</code> files and
        passwords belong in a secret store, Docker secrets or the Dokploy environment – never in git. Rotate them if
        compromise is suspected.
      </Callout>

      <h2>Encryption at rest (briefly)</h2>
      <ul>
        <li>
          <strong>Disk/volume encryption</strong> (BitLocker, LUKS, the cloud provider's encryption) protects against theft of physical media.
        </li>
        <li>
          <strong>Column/field encryption</strong> for particularly sensitive fields (e.g. national ID numbers) – use AES-GCM and a
          key from a secret store/KMS, not in the same database as the data.
        </li>
        <li>
          <strong>Backups</strong> must also be encrypted.
        </li>
        <li>
          <strong>Passwords are not encrypted – they are hashed</strong> (see the lesson on hashing).
        </li>
      </ul>

      <h2>Practical checks – on your own systems</h2>
      <p>
        You can always see what your own server presents. Only use these commands on domains you own or have permission
        to test.
      </p>
      <CodeBlock language="bash">{opensslCheck}</CodeBlock>
      <p>
        An external assessment of the TLS configuration is available via e.g. <strong>SSL Labs</strong> – see the lesson on security tools.
      </p>

      <h2>Common mistakes</h2>
      <table>
        <thead>
          <tr>
            <th>Mistake</th>
            <th>Consequence</th>
            <th>Fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>HTTP without redirect to HTTPS</td>
            <td>Traffic can be eavesdropped on/tampered with</td>
            <td>Redirect + HSTS</td>
          </tr>
          <tr>
            <td>Old protocols (TLS 1.0/1.1) enabled</td>
            <td>Known weaknesses, poor score</td>
            <td>Only TLS 1.2 and 1.3</td>
          </tr>
          <tr>
            <td>Certificate validation turned off in client code</td>
            <td>Man-in-the-middle becomes trivial</td>
            <td>Install the correct CA/cert instead</td>
          </tr>
          <tr>
            <td>Hard-coded keys/passwords in the repo</td>
            <td>Anyone with repo access can decrypt</td>
            <td>Secret store, environment variables</td>
          </tr>
          <tr>
            <td>Home-made "encryption algorithm"</td>
            <td>Typically broken within minutes</td>
            <td>AES-GCM / TLS from the standard library</td>
          </tr>
          <tr>
            <td>Expired certificate</td>
            <td>Downtime / warnings</td>
            <td>Automatic renewal + monitoring</td>
          </tr>
        </tbody>
      </table>

      <h2>Summary</h2>
      <ul>
        <li>Symmetric = fast, one key. Asymmetric = key pair, used for key exchange and signatures. TLS uses both.</li>
        <li>SSL is historical and insecure; we use TLS 1.2/1.3, but still say "SSL certificate".</li>
        <li>HTTPS = HTTP over TLS. Certificates create trust via a CA chain.</li>
        <li>Enable redirect, HSTS and Secure cookies. Keep keys out of git.</li>
        <li>Never roll your own cryptography.</li>
      </ul>

      <h2>Exercises</h2>
      <ol>
        <li>Open an HTTPS site in the browser, find the certificate and note the issuer, expiry date and SAN list.</li>
        <li>Explain in your own words why TLS uses both asymmetric and symmetric encryption.</li>
        <li>Add <code>UseHsts</code> and <code>UseHttpsRedirection</code> to an ASP.NET project and check the header in the browser's devtools (Network tab).</li>
        <li>Create a local development certificate with <code>dotnet dev-certs</code> and run the API over HTTPS.</li>
        <li>Discussion: what is the difference between encrypting a password and hashing it? Why do we choose one over the other?</li>
      </ol>
    </LessonLayout>
  )
}
