import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'

const hashVsEncrypt = `
flowchart LR
    subgraph K["Encryption - two-way"]
        P1["Plaintext"] -->|"key"| C1["Ciphertext"]
        C1 -->|"key"| P1b["Plaintext again"]
    end
    subgraph H1["Hashing - one-way"]
        P2["Input"] -->|"hash function"| H["Hash of fixed length"]
        H -.->|"cannot be reversed"| X["Input"]
    end
`

const loginChart = `
sequenceDiagram
    participant U as User
    participant API as API
    participant DB as Database
    Note over U,DB: Registration
    U->>API: username + password
    API->>API: hash = bcrypt or Argon2 - with built-in salt and cost
    API->>DB: Store ONLY the hash
    Note over U,DB: Login
    U->>API: username + password
    API->>DB: Fetch stored hash
    API->>API: Verify - hash the password with the same salt and cost and compare
    API->>U: OK or rejected
`

const sha256Example = `using System.Security.Cryptography;

// 1) Integrity of a file: is the download unchanged?
static string Sha256OfFile(string path)
{
    using var stream = File.OpenRead(path);
    byte[] hash = SHA256.HashData(stream);
    return Convert.ToHexString(hash).ToLowerInvariant();
}

string expected = "a3f5...from-the-publishers-website"; // published by the publisher via a trusted channel
string actual = Sha256OfFile("installer.zip");

// Compare in constant time (avoids timing differences)
bool ok = CryptographicOperations.FixedTimeEquals(
    Convert.FromHexString(actual), Convert.FromHexString(expected));

// 2) Hash of a short string (e.g. for a cache key or ETag - NOT for passwords)
byte[] digest = SHA256.HashData("Hello world"u8);
Console.WriteLine(Convert.ToHexString(digest));`

const hmacExample = `using System.Security.Cryptography;

// HMAC = hash + secret key => integrity AND authenticity
// Used e.g. to verify webhooks ("does the message really come from Stripe/GitHub?")
static bool VerifyWebhook(byte[] body, string signatureHex, byte[] secret)
{
    byte[] expected = HMACSHA256.HashData(secret, body);
    byte[] actual = Convert.FromHexString(signatureHex);
    return CryptographicOperations.FixedTimeEquals(expected, actual);
}`

const bcryptExample = `// dotnet add package BCrypt.Net-Next
using BCrypt.Net;

public class PasswordService
{
    // Cost (work factor): every +1 doubles the work. Choose so one hash takes about 100-300 ms on your server.
    private const int WorkFactor = 12;

    public string Hash(string password) =>
        BCrypt.Net.BCrypt.EnhancedHashPassword(password, WorkFactor, HashType.SHA384);
        // The salt is generated automatically and lives inside the returned string

    public bool Verify(string password, string storedHash) =>
        BCrypt.Net.BCrypt.EnhancedVerify(password, storedHash, HashType.SHA384);

    // When the cost is raised, old hashes can be upgraded on the next successful login
    public bool NeedsRehash(string storedHash) =>
        BCrypt.Net.BCrypt.PasswordNeedsRehash(storedHash, WorkFactor);
}

// The result looks like this (60 characters) - algorithm, cost, salt and hash in one:
// $2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW`

const identityHasher = `using Microsoft.AspNetCore.Identity;

// ASP.NET Core Identity has a built-in, well-tested password hasher (PBKDF2 with HMAC-SHA512, random salt, many iterations).
// It is the simplest secure solution if you do not use an external IdP.
var hasher = new PasswordHasher<AppUser>();
var user = new AppUser { Email = "test@example.dk" };

string hash = hasher.HashPassword(user, "My-long-and-unique-password");

PasswordVerificationResult result = hasher.VerifyHashedPassword(user, hash, "My-long-and-unique-password");
switch (result)
{
    case PasswordVerificationResult.Success:
        break; // login OK
    case PasswordVerificationResult.SuccessRehashNeeded:
        user.PasswordHash = hasher.HashPassword(user, "My-long-and-unique-password"); // upgrade the stored hash
        break;
    case PasswordVerificationResult.Failed:
        // reject - and return the same generic error whether or not the user exists
        break;
}

public class AppUser { public string Email { get; set; } = ""; public string? PasswordHash { get; set; } }`

const argon2Example = `// dotnet add package Konscious.Security.Cryptography.Argon2   (or a libsodium-based package)
using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

public static class Argon2Password
{
    public static (byte[] Salt, byte[] Hash) Hash(string password)
    {
        byte[] salt = RandomNumberGenerator.GetBytes(16);

        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = 2,
            Iterations = 3,        // time
            MemorySize = 64 * 1024 // 64 MiB - memory-hard, makes GPU guessing expensive
        };
        return (salt, argon2.GetBytes(32));
    }

    public static bool Verify(string password, byte[] salt, byte[] expected)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt, DegreeOfParallelism = 2, Iterations = 3, MemorySize = 64 * 1024
        };
        return CryptographicOperations.FixedTimeEquals(argon2.GetBytes(32), expected);
    }
}
// Store salt + parameters + hash together (e.g. in PHC format) so parameters can be raised later.
// Parameters should follow OWASP's current recommendation - see the Password Storage Cheat Sheet.`

const wrongWays = `// ❌ WRONG - all of these are unsuitable for passwords:
MD5.HashData(Encoding.UTF8.GetBytes(password));       // broken, extremely fast
SHA256.HashData(Encoding.UTF8.GetBytes(password));    // too fast, no salt/cost
SHA256.HashData(Encoding.UTF8.GetBytes(password + "secret-fixed-salt")); // fixed salt = almost no salt
Convert.ToBase64String(Encoding.UTF8.GetBytes(password)); // encoding, not hashing!
AesEncrypt(password);                                  // encryption can be reversed - the key can leak`

const checksumNote = `# Verify the integrity of a download (PowerShell)
Get-FileHash .\\installer.zip -Algorithm SHA256

# Linux/macOS
sha256sum installer.zip`

export default function HashingPageEn() {
  const objective = getObjectiveByPath('/sikkerhed/hashing')

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Hashing {objective ? <ObjectiveBadge level={objective.level} /> : null}
      </h1>
      {objective ? (
        <>
          <p>
            <em>Learning objective #{objective.id}:</em> {objectiveTitle(objective, 'en')}
          </p>
          <LinkTrio
            sitePath={objective.sitePath}
            notionUrl={objective.notionUrl}
            repoUrl={objective.repoUrl}
          />
        </>
      ) : null}

      <Callout type="danger">
        <strong>Important warning about MD5.</strong> The learning objective mentions MD5 as an example, and you will meet it in old systems,
        tutorials and databases. But <strong>MD5 is cryptographically broken and must not be used for security</strong> – not for
        passwords, signatures or integrity checks against an active adversary. We cover MD5 to understand
        the history and to be able to recognise and <em>migrate away from</em> it. For new systems we use{' '}
        <strong>Argon2/bcrypt</strong> for passwords and <strong>SHA-256 (or better)</strong> for integrity.
      </Callout>

      <h2>What is a hash function?</h2>
      <p>
        A <strong>hash function</strong> takes data of arbitrary size and computes a <em>fixed-length</em> "fingerprint"
        (digest). If even a single bit of the input changes, the output changes completely (the <em>avalanche effect</em>).
      </p>
      <CodeBlock language="text">{`SHA-256("hej")  = 1ab8e5...f2c9   (64 hex characters = 256 bits)
SHA-256("hej.") = 7d0c41...a1e3   (completely different)`}</CodeBlock>
      <p>Cryptographic hash functions must have these properties:</p>
      <ul>
        <li><strong>Determinism</strong> – the same input always gives the same hash.</li>
        <li><strong>One-way (preimage resistance)</strong> – you cannot compute from the hash back to the input.</li>
        <li><strong>Collision resistance</strong> – it must be practically impossible to find two different inputs with the same hash.</li>
        <li><strong>Avalanche</strong> – small changes give large differences.</li>
      </ul>

      <h2>Hashing is not encryption</h2>
      <MermaidDiagram chart={hashVsEncrypt} />
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Encryption</th>
            <th>Hashing</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Direction</td><td>Two-way (can be decrypted with the key)</td><td>One-way</td></tr>
          <tr><td>Key</td><td>Yes</td><td>No (except HMAC)</td></tr>
          <tr><td>Output length</td><td>Follows the input length</td><td>Fixed</td></tr>
          <tr><td>Purpose</td><td>Confidentiality – the data must be readable again</td><td>Integrity, verification, lookup, passwords</td></tr>
          <tr><td>Examples</td><td>AES-GCM, RSA</td><td>SHA-256, bcrypt, Argon2</td></tr>
        </tbody>
      </table>
      <Callout type="info">
        <strong>Base64 and URL encoding are neither hashing nor encryption</strong> – they are merely encodings that anyone can
        reverse without a key. It is a classic misunderstanding in beginner projects.
      </Callout>

      <h2>Two very different purposes</h2>
      <p>
        The most important thing to understand in this lesson: there are <strong>two families</strong> of hashing, and they each
        optimise for something different.
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Checksum / integrity</th>
            <th>Password hashing</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Goal</td><td>Fast to compute</td><td>Deliberately <strong>slow</strong> and expensive</td></tr>
          <tr><td>Examples</td><td>SHA-256, SHA-512, SHA-3, BLAKE3, HMAC</td><td>Argon2id, bcrypt, scrypt, PBKDF2</td></tr>
          <tr><td>Salt</td><td>No (not relevant)</td><td>Yes – unique per user</td></tr>
          <tr><td>Threat</td><td>Modification of data</td><td>Guessing passwords after a database leak</td></tr>
          <tr><td>Use</td><td>Files, downloads, commits, cache keys, signatures</td><td>Storing passwords</td></tr>
        </tbody>
      </table>
      <p>
        Speed is an <em>advantage</em> for checksums and a <em>flaw</em> for passwords: a modern GPU rig can compute
        billions of fast hashes per second, so an attacker with a leaked database can try enormous numbers of
        passwords. Password hash functions are designed to be slow and memory-hungry to make this expensive.
      </p>

      <h2>MD5 – history only</h2>
      <p>
        <strong>MD5</strong> was designed by Ronald Rivest in 1991 and produces a 128-bit hash (32 hex characters). For years it was the
        standard for both checksums and passwords. Today it is broken for security purposes:
      </p>
      <ul>
        <li>
          <strong>Collisions</strong> can be constructed in a short time on ordinary hardware (the first practical collisions around 2004).
          This means two different files can get the same MD5 – so MD5 does not prove that a file is unchanged against an adversary.
          Collision attacks have been used in real incidents against certificates and signatures.
        </li>
        <li>
          <strong>Speed</strong>: MD5 is so fast that precomputed tables and brute force turn most MD5 passwords
          into plaintext within seconds when a database leaks.
        </li>
        <li>
          The recommendations from NIST, OWASP and the browser vendors are clear: <strong>do not use MD5 for security</strong>.
        </li>
      </ul>
      <p>Where you may still see MD5, and how to deal with it:</p>
      <table>
        <thead>
          <tr><th>Situation</th><th>Assessment</th></tr>
        </thead>
        <tbody>
          <tr><td>Passwords in an old database</td><td>Migrate: hash with bcrypt/Argon2 on next login (see below), or "wrap" existing hashes</td></tr>
          <tr><td>Checksum to detect accidental transmission errors</td><td>Acceptable, but SHA-256 costs almost nothing – use it anyway</td></tr>
          <tr><td>Integrity/authenticity against an adversary</td><td>Never MD5 – use SHA-256 + signature/HMAC</td></tr>
          <tr><td>Legacy protocols/ETag at a third party</td><td>Isolate, document and phase out</td></tr>
        </tbody>
      </table>
      <Callout type="warn">
        The same applies to <strong>SHA-1</strong>: practical collisions have been demonstrated (2017), and it has been phased out in certificates and
        git's security model. Use SHA-256 or SHA-3 as the default.
      </Callout>

      <h2>Hashing for integrity – SHA-2 and HMAC</h2>
      <p>
        When the purpose is to detect changes, <strong>SHA-256</strong> (part of the SHA-2 family) is the pragmatic standard.
        Typical uses: verifying downloads, git commits and container images (content-addressable), Subresource Integrity in
        HTML, and as a building block in digital signatures.
      </p>
      <CodeBlock language="csharp">{sha256Example}</CodeBlock>
      <CodeBlock language="powershell">{checksumNote}</CodeBlock>

      <Callout type="tip">
        A hash <em>alone</em> does not prove authenticity: if the attacker can change both the file and the hash, they still match. The hash
        must come from a <strong>different, trusted channel</strong> – or you must use a <strong>digital signature</strong> or{' '}
        <strong>HMAC</strong> (hash + secret key).
      </Callout>
      <CodeBlock language="csharp">{hmacExample}</CodeBlock>

      <h2>Passwords – why ordinary hashes are not enough</h2>
      <p>The threat picture: an attacker gets hold of your user table (SQL injection, backup leak, a careless employee). What is in it?</p>
      <ul>
        <li><strong>Plaintext</strong> – a disaster; users reuse passwords, so other services are compromised.</li>
        <li><strong>Encrypted</strong> – if the key comes along (and it often does), it is plaintext anyway.</li>
        <li><strong>Fast hash without salt</strong> – <em>rainbow tables</em> and lookups crack most within seconds; identical passwords get identical hashes.</li>
        <li><strong>Fast hash with salt</strong> – better, but still cheap to brute-force weak passwords.</li>
        <li><strong>Slow password hash with unique salt</strong> – this is the goal.</li>
      </ul>

      <h3>Salt, pepper and cost</h3>
      <ul>
        <li>
          <strong>Salt</strong>: a random value, <em>unique per password</em>, stored next to the hash. It defeats precomputed
          tables and hides the fact that two users have the same password. The libraries create and store it themselves.
        </li>
        <li>
          <strong>Cost / work factor</strong>: a parameter that makes hashing slower and can be increased as hardware gets faster.
        </li>
        <li>
          <strong>Pepper</strong> (optional): a secret that lives <em>outside</em> the database (secret store/HSM) and is mixed in
          (e.g. via HMAC). Gives extra defence if only the database leaks.
        </li>
      </ul>

      <MermaidDiagram chart={loginChart} />

      <h3>Choosing an algorithm</h3>
      <table>
        <thead>
          <tr><th>Algorithm</th><th>Assessment</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Argon2id</strong></td><td>Recommended first choice (winner of the Password Hashing Competition). Memory-hard → resistant to GPU/ASIC.</td></tr>
          <tr><td><strong>bcrypt</strong></td><td>Solid, widespread and simple. Max. 72 bytes of input (hence "enhanced" with e.g. SHA-384 pre-processing).</td></tr>
          <tr><td><strong>scrypt</strong></td><td>Memory-hard; good, but harder to tune.</td></tr>
          <tr><td><strong>PBKDF2</strong></td><td>Approved (FIPS), used by ASP.NET Identity; requires many iterations (hundreds of thousands).</td></tr>
          <tr><td>MD5 / SHA-1 / SHA-256 alone</td><td><strong>Not suitable</strong> for passwords.</td></tr>
        </tbody>
      </table>
      <p>
        Stick to OWASP's <em>Password Storage Cheat Sheet</em> for current parameters – the recommendations change over time.
      </p>

      <h2>C#: bcrypt</h2>
      <CodeBlock language="csharp">{bcryptExample}</CodeBlock>

      <h2>C#: ASP.NET Core Identity PasswordHasher</h2>
      <CodeBlock language="csharp">{identityHasher}</CodeBlock>

      <h2>C#: Argon2id (principle)</h2>
      <CodeBlock language="csharp">{argon2Example}</CodeBlock>

      <h3>What you must never do</h3>
      <CodeBlock language="csharp">{wrongWays}</CodeBlock>

      <Callout type="info">
        If you have <strong>Mercantec Auth</strong> as your login source (see the lesson on authentication), <em>your</em> app does not store
        passwords at all – the Auth server does. That is the best solution: no passwords to leak. In your own DB you only store{' '}
        <code>sub</code>. Knowledge of password hashing is still necessary to assess and build systems without a central IdP.
      </Callout>

      <h2>Migrating away from old hashes (MD5 → bcrypt/Argon2)</h2>
      <p>You cannot "convert" an MD5 hash into a bcrypt hash without knowing the password. There are two common strategies:</p>
      <ol>
        <li>
          <strong>Upgrade on login</strong>: verify with the old method; if it succeeds, compute a new hash with bcrypt/Argon2, store it and
          mark the row as migrated.
        </li>
        <li>
          <strong>Wrap</strong>: compute <code>bcrypt(md5hash)</code> for all existing rows right away, so the database is immediately stronger,
          and upgrade to plain bcrypt on the next login.
        </li>
      </ol>
      <CodeBlock language="csharp">{`// Upgrade-on-login (simplified)
public bool VerifyAndUpgrade(User user, string password)
{
    if (user.HashAlgorithm == "md5-legacy")
    {
        // The same comparison the old system did - only to be able to migrate
        var legacy = Convert.ToHexString(MD5.HashData(Encoding.UTF8.GetBytes(password)));
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(legacy.ToLowerInvariant()),
                Encoding.ASCII.GetBytes(user.PasswordHash.ToLowerInvariant())))
            return false;

        user.PasswordHash = passwordService.Hash(password); // bcrypt/Argon2
        user.HashAlgorithm = "bcrypt";
        db.SaveChanges();
        return true;
    }
    return passwordService.Verify(password, user.PasswordHash);
}`}</CodeBlock>

      <h2>Other good habits for passwords</h2>
      <ul>
        <li>Allow long passwords/passphrases (min. 12-15 characters); avoid unreasonable complexity rules.</li>
        <li>Check against lists of known leaked passwords (e.g. Have I Been Pwned's k-anonymity API).</li>
        <li>Rate limiting and temporary lockout against guessing attacks.</li>
        <li>Offer MFA/passkeys.</li>
        <li>Return the same error message for "wrong user" and "wrong password".</li>
        <li>Never log passwords – not even in error messages or request logs.</li>
        <li>Never send passwords by e-mail; use time-limited reset links.</li>
      </ul>

      <h2>Summary</h2>
      <ul>
        <li>Hashing is one-way; encryption is two-way. Passwords are <strong>hashed</strong>, not encrypted.</li>
        <li>MD5 (and SHA-1) are broken for security purposes – mentioned only as history and a migration case.</li>
        <li>Integrity: SHA-256 (+ signature/HMAC for authenticity). Passwords: Argon2id or bcrypt with a unique salt and suitable cost.</li>
        <li>Use libraries or ASP.NET Identity's PasswordHasher – do not roll your own.</li>
        <li>Plan the migration of old hashes and raise the cost over time.</li>
      </ul>

      <h2>Exercises</h2>
      <ol>
        <li>Compute the SHA-256 of a text file, change one character and compute again. What do you observe (avalanche)?</li>
        <li>Hash the same password twice with bcrypt. Why do the results differ, and how can <code>Verify</code> still work?</li>
        <li>Measure how long <code>BCrypt.HashPassword</code> takes at cost 10, 12 and 14 on your machine. Which would you choose in production, and why?</li>
        <li>Explain in your own words why "SHA-256 + salt" is still a poor choice for passwords.</li>
        <li>Sketch a migration plan for a database with MD5 passwords.</li>
      </ol>
    </LessonLayout>
  )
}
