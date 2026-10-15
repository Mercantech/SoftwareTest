import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import Figure from '../../components/Figure'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const hashVsEncrypt = `
flowchart LR
    subgraph K["Kryptering - to-vejs"]
        P1["Klartekst"] -->|"nøgle"| C1["Chiffertekst"]
        C1 -->|"nøgle"| P1b["Klartekst igen"]
    end
    subgraph H1["Hashing - envejs"]
        P2["Input"] -->|"hashfunktion"| H["Hash med fast længde"]
        H -.->|"kan ikke vendes"| X["Input"]
    end
`

const loginChart = `
sequenceDiagram
    participant U as Bruger
    participant API as API
    participant DB as Database
    Note over U,DB: Registrering
    U->>API: brugernavn + adgangskode
    API->>API: hash = bcrypt eller Argon2 - med indbygget salt og cost
    API->>DB: Gem KUN hash
    Note over U,DB: Login
    U->>API: brugernavn + adgangskode
    API->>DB: Hent gemt hash
    API->>API: Verify - hash adgangskoden med samme salt og cost og sammenlign
    API->>U: OK eller afvist
`

const sha256Example = `using System.Security.Cryptography;

// 1) Integritet af en fil: er downloaden uændret?
static string Sha256OfFile(string path)
{
    using var stream = File.OpenRead(path);
    byte[] hash = SHA256.HashData(stream);
    return Convert.ToHexString(hash).ToLowerInvariant();
}

string expected = "a3f5...fra-udgiverens-hjemmeside"; // offentliggjort af udgiveren via en betroet kanal
string actual = Sha256OfFile("installer.zip");

// Sammenlign i konstant tid (undgår timing-forskelle)
bool ok = CryptographicOperations.FixedTimeEquals(
    Convert.FromHexString(actual), Convert.FromHexString(expected));

// 2) Hash af en kort streng (fx til cache-nøgle eller ETag - IKKE til adgangskoder)
byte[] digest = SHA256.HashData("Hej verden"u8);
Console.WriteLine(Convert.ToHexString(digest));`

const hmacExample = `using System.Security.Cryptography;

// HMAC = hash + hemmelig nøgle => integritet OG ægthed
// Bruges fx til at verificere webhooks ("kommer beskeden virkelig fra Stripe/GitHub?")
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
    // Cost (work factor): hver +1 fordobler arbejdet. Vælg så ét hash tager ca. 100-300 ms på jeres server.
    private const int WorkFactor = 12;

    public string Hash(string password) =>
        BCrypt.Net.BCrypt.EnhancedHashPassword(password, WorkFactor, HashType.SHA384);
        // Salt genereres automatisk og ligger inde i den returnerede streng

    public bool Verify(string password, string storedHash) =>
        BCrypt.Net.BCrypt.EnhancedVerify(password, storedHash, HashType.SHA384);

    // Når cost hæves, kan gamle hashes opgraderes ved næste vellykkede login
    public bool NeedsRehash(string storedHash) =>
        BCrypt.Net.BCrypt.PasswordNeedsRehash(storedHash, WorkFactor);
}

// Resultatet ser sådan ud (60 tegn) - algoritme, cost, salt og hash i ét:
// $2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW`

const identityHasher = `using Microsoft.AspNetCore.Identity;

// ASP.NET Core Identity har en indbygget, gennemtestet password hasher (PBKDF2 med HMAC-SHA512, tilfældigt salt, mange iterationer).
// Det er den enkleste sikre løsning, hvis I ikke bruger en ekstern IdP.
var hasher = new PasswordHasher<AppUser>();
var user = new AppUser { Email = "test@example.dk" };

string hash = hasher.HashPassword(user, "Min-lange-og-unikke-kode");

PasswordVerificationResult result = hasher.VerifyHashedPassword(user, hash, "Min-lange-og-unikke-kode");
switch (result)
{
    case PasswordVerificationResult.Success:
        break; // login OK
    case PasswordVerificationResult.SuccessRehashNeeded:
        user.PasswordHash = hasher.HashPassword(user, "Min-lange-og-unikke-kode"); // opgradér lagret hash
        break;
    case PasswordVerificationResult.Failed:
        // afvis - og returnér samme generiske fejl uanset om brugeren findes
        break;
}

public class AppUser { public string Email { get; set; } = ""; public string? PasswordHash { get; set; } }`

const argon2Example = `// dotnet add package Konscious.Security.Cryptography.Argon2   (eller libsodium-baseret pakke)
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
            Iterations = 3,        // tid
            MemorySize = 64 * 1024 // 64 MiB - hukommelseskrævende, gør GPU-gætning dyr
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
// Gem salt + parametre + hash sammen (fx i PHC-format), så parametre kan hæves senere.
// Parametre bør følge OWASP's aktuelle anbefaling - se Password Storage Cheat Sheet.`

const wrongWays = `// ❌ FORKERT - alle disse er uegnede til adgangskoder:
MD5.HashData(Encoding.UTF8.GetBytes(password));       // knækket, ekstremt hurtig
SHA256.HashData(Encoding.UTF8.GetBytes(password));    // for hurtig, intet salt/cost
SHA256.HashData(Encoding.UTF8.GetBytes(password + "hemmeligt-fast-salt")); // fast salt = næsten intet salt
Convert.ToBase64String(Encoding.UTF8.GetBytes(password)); // kodning, ikke hashing!
AesEncrypt(password);                                  // kryptering kan vendes - nøglen kan lække`

const checksumNote = `# Kontrollér integritet af en download (PowerShell)
Get-FileHash .\\installer.zip -Algorithm SHA256

# Linux/macOS
sha256sum installer.zip`

export default function HashingPageDa() {

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Hashing</h1>
<Callout type="danger">
        <strong>Vigtig advarsel om MD5.</strong> Målpinden nævner MD5 som eksempel, og I vil møde det i gamle systemer,
        tutorials og databaser. Men <strong>MD5 er kryptografisk knækket og må ikke bruges til sikkerhed</strong> – hverken til
        adgangskoder, signaturer eller integritetskontrol mod en aktiv modstander. Vi gennemgår MD5 for at forstå
        historikken og for at kunne genkende og <em>migrere væk fra</em> det. Til nye systemer bruger vi{' '}
        <strong>Argon2/bcrypt</strong> til adgangskoder og <strong>SHA-256 (eller bedre)</strong> til integritet.
      </Callout>

      <h2>Hvad er en hashfunktion?</h2>
      <Figure
        src="/images/commons/crypto-hash.svg"
        alt="Kryptografisk hashfunktion: små ændringer i input giver helt forskellige digests"
        caption="Avalanche-effekten: næsten ens input → helt forskellige hashes"
        sourceUrl="https://commons.wikimedia.org/wiki/File:Cryptographic_Hash_Function.svg"
        sourceLabel="Wikimedia Commons"
      />
      <p>
        En <strong>hashfunktion</strong> tager data af vilkårlig størrelse og beregner en <em>fast længde</em> "fingeraftryk"
        (digest). Ændres blot ét bit i input, ændrer outputtet sig fuldstændigt (<em>avalanche-effekt</em>).
      </p>
      <CodeBlock language="text">{`SHA-256("hej")  = 1ab8e5...f2c9   (64 hex-tegn = 256 bit)
SHA-256("hej.") = 7d0c41...a1e3   (helt anderledes)`}</CodeBlock>
      <p>Kryptografiske hashfunktioner skal have disse egenskaber:</p>
      <ul>
        <li><strong>Determinisme</strong> – samme input giver altid samme hash.</li>
        <li><strong>Envejs (preimage resistance)</strong> – man kan ikke regne fra hash tilbage til input.</li>
        <li><strong>Kollisionsmodstand</strong> – det skal være praktisk umuligt at finde to forskellige input med samme hash.</li>
        <li><strong>Avalanche</strong> – små ændringer giver store forskelle.</li>
      </ul>

      <h2>Hashing er ikke kryptering</h2>
      <MermaidDiagram chart={hashVsEncrypt} />
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Kryptering</th>
            <th>Hashing</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Retning</td><td>To-vejs (kan dekrypteres med nøgle)</td><td>Envejs</td></tr>
          <tr><td>Nøgle</td><td>Ja</td><td>Nej (undtagen HMAC)</td></tr>
          <tr><td>Outputlængde</td><td>Følger inputtets længde</td><td>Fast</td></tr>
          <tr><td>Formål</td><td>Fortrolighed – data skal kunne læses igen</td><td>Integritet, verificering, opslag, adgangskoder</td></tr>
          <tr><td>Eksempler</td><td>AES-GCM, RSA</td><td>SHA-256, bcrypt, Argon2</td></tr>
        </tbody>
      </table>
      <Callout type="info">
        <strong>Base64 og URL-encoding er hverken hashing eller kryptering</strong> – de er blot kodninger, som alle kan
        vende uden nøgle. Det er en klassisk misforståelse i begynderprojekter.
      </Callout>

      <h2>To vidt forskellige formål</h2>
      <p>
        Det vigtigste at forstå på denne lektion: der findes <strong>to familier</strong> af hashing, og de optimerer til hver
        sin ting.
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Checksum / integritet</th>
            <th>Password hashing</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Mål</td><td>Hurtigt at beregne</td><td>Bevidst <strong>langsomt</strong> og dyrt</td></tr>
          <tr><td>Eksempler</td><td>SHA-256, SHA-512, SHA-3, BLAKE3, HMAC</td><td>Argon2id, bcrypt, scrypt, PBKDF2</td></tr>
          <tr><td>Salt</td><td>Nej (ikke relevant)</td><td>Ja – unikt pr. bruger</td></tr>
          <tr><td>Trussel</td><td>Ændring af data</td><td>Gætning af adgangskoder efter databaselæk</td></tr>
          <tr><td>Brug</td><td>Filer, downloads, commits, cache-nøgler, signaturer</td><td>Lagring af adgangskoder</td></tr>
        </tbody>
      </table>
      <p>
        Hastighed er en <em>fordel</em> til checksums og en <em>fejl</em> til adgangskoder: en moderne grafikkortsrig kan beregne
        milliarder af hurtige hashes i sekundet, så en angriber med en lækket database kan prøve enorme mængder
        adgangskoder. Password-hashfunktioner er designet til at være langsomme og hukommelseskrævende for at gøre det dyrt.
      </p>

      <h2>MD5 – kun historik</h2>
      <p>
        <strong>MD5</strong> blev designet af Ronald Rivest i 1991 og giver et 128-bit hash (32 hex-tegn). Den var i årevis
        standard til både checksums og adgangskoder. I dag er den knækket til sikkerhedsformål:
      </p>
      <ul>
        <li>
          <strong>Kollisioner</strong> kan konstrueres på kort tid på almindelig hardware (første praktiske kollisioner ca. 2004).
          Det betyder, at to forskellige filer kan få samme MD5 – så MD5 beviser ikke, at en fil er uændret over for en modstander.
          Kollisionsangreb er blevet brugt i virkelige hændelser mod certifikater og signaturer.
        </li>
        <li>
          <strong>Hastighed</strong>: MD5 er så hurtig, at færdige tabeller og brute force gør de fleste MD5-adgangskoder
          til klartekst på sekunder, når en database lækkes.
        </li>
        <li>
          Anbefalingerne fra NIST, OWASP og browserudviklerne er klare: <strong>brug ikke MD5 til sikkerhed</strong>.
        </li>
      </ul>
      <p>Hvor man stadig kan se MD5, og hvordan man forholder sig til det:</p>
      <table>
        <thead>
          <tr><th>Situation</th><th>Vurdering</th></tr>
        </thead>
        <tbody>
          <tr><td>Adgangskoder i en gammel database</td><td>Migrér: hash ved næste login med bcrypt/Argon2 (se nedenfor), eller "wrap" eksisterende hashes</td></tr>
          <tr><td>Checksum til at opdage tilfældige transportfejl</td><td>Acceptabelt, men SHA-256 koster næsten ingenting – brug den alligevel</td></tr>
          <tr><td>Integritet/ægthed mod en modstander</td><td>Aldrig MD5 – brug SHA-256 + signatur/HMAC</td></tr>
          <tr><td>Legacy-protokoller/ETag hos tredjepart</td><td>Isolér, dokumentér og udfas</td></tr>
        </tbody>
      </table>
      <Callout type="warn">
        Det samme gælder <strong>SHA-1</strong>: praktiske kollisioner er demonstreret (2017), og den er udfaset i certifikater og
        git's sikkerhedsmodel. Brug SHA-256 eller SHA-3 som standard.
      </Callout>

      <h2>Hashing til integritet – SHA-2 og HMAC</h2>
      <p>
        Når formålet er at opdage ændringer, er <strong>SHA-256</strong> (en del af SHA-2-familien) den pragmatiske standard.
        Typiske anvendelser: kontrol af downloads, git-commits og container-images (content-addressable), Subresource Integrity i
        HTML, og som byggesten i digitale signaturer.
      </p>
      <CodeBlock language="csharp">{sha256Example}</CodeBlock>
      <CodeBlock language="powershell">{checksumNote}</CodeBlock>

      <Callout type="tip">
        Et hash <em>alene</em> beviser ikke ægthed: hvis angriberen kan ændre både filen og hashen, passer de stadig sammen. Hashen
        skal komme fra en <strong>anden, betroet kanal</strong> – eller du skal bruge en <strong>digital signatur</strong> eller{' '}
        <strong>HMAC</strong> (hash + hemmelig nøgle).
      </Callout>
      <CodeBlock language="csharp">{hmacExample}</CodeBlock>

      <h2>Adgangskoder – hvorfor almindelige hashes ikke er nok</h2>
      <p>Trusselsbilledet: en angriber får fat i jeres brugertabel (SQL injection, backup-læk, en uforsigtig medarbejder). Hvad ligger der?</p>
      <ul>
        <li><strong>Klartekst</strong> – katastrofe; brugere genbruger adgangskoder, så andre tjenester kompromitteres.</li>
        <li><strong>Krypteret</strong> – hvis nøglen følger med (og det gør den ofte), er det klartekst alligevel.</li>
        <li><strong>Hurtig hash uden salt</strong> – <em>rainbow tables</em> og opslag knækker de fleste på sekunder; ens adgangskoder får ens hash.</li>
        <li><strong>Hurtig hash med salt</strong> – bedre, men stadig billigt at brute-force'e svage adgangskoder.</li>
        <li><strong>Langsom password-hash med unikt salt</strong> – det er målet.</li>
      </ul>

      <h3>Salt, pepper og cost</h3>
      <ul>
        <li>
          <strong>Salt</strong>: tilfældig værdi, <em>unik pr. adgangskode</em>, gemt ved siden af hashen. Det ødelægger forudberegnede
          tabeller og skjuler, at to brugere har samme adgangskode. Bibliotekerne laver og gemmer det selv.
        </li>
        <li>
          <strong>Cost / work factor</strong>: parameter, der gør hashingen langsommere og kan øges, efterhånden som hardware bliver hurtigere.
        </li>
        <li>
          <strong>Pepper</strong> (valgfrit): en hemmelighed, der ligger <em>uden for</em> databasen (secret store/HSM), og som blandes ind
          (fx via HMAC). Giver ekstra forsvar, hvis kun databasen lækker.
        </li>
      </ul>

      <MermaidDiagram chart={loginChart} />

      <h3>Valg af algoritme</h3>
      <table>
        <thead>
          <tr><th>Algoritme</th><th>Vurdering</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Argon2id</strong></td><td>Anbefalet førstevalg (vinder af Password Hashing Competition). Hukommelseskrævende → modstandsdygtig mod GPU/ASIC.</td></tr>
          <tr><td><strong>bcrypt</strong></td><td>Solid, udbredt og simpel. Maks. 72 bytes input (derfor "enhanced" med fx SHA-384 forbehandling).</td></tr>
          <tr><td><strong>scrypt</strong></td><td>Hukommelseskrævende; god, men sværere at tune.</td></tr>
          <tr><td><strong>PBKDF2</strong></td><td>Godkendt (FIPS), bruges af ASP.NET Identity; kræver mange iterationer (hundredtusinder).</td></tr>
          <tr><td>MD5 / SHA-1 / SHA-256 alene</td><td><strong>Ikke egnet</strong> til adgangskoder.</td></tr>
        </tbody>
      </table>
      <p>
        Hold dig til OWASP's <em>Password Storage Cheat Sheet</em> for aktuelle parametre – anbefalingerne ændres over tid.
      </p>

      <h2>C#: bcrypt</h2>
      <CodeBlock language="csharp">{bcryptExample}</CodeBlock>

      <h2>C#: ASP.NET Core Identity PasswordHasher</h2>
      <CodeBlock language="csharp">{identityHasher}</CodeBlock>

      <h2>C#: Argon2id (princip)</h2>
      <CodeBlock language="csharp">{argon2Example}</CodeBlock>

      <h3>Hvad I aldrig skal gøre</h3>
      <CodeBlock language="csharp">{wrongWays}</CodeBlock>

      <Callout type="info">
        Har I <strong>Mercantec Auth</strong> som login-kilde (se lektionen om authentication), gemmer <em>jeres</em> app slet ikke
        adgangskoder – Auth-serveren gør det. Det er den bedste løsning: ingen adgangskoder at lække. I jeres egen DB gemmer I kun{' '}
        <code>sub</code>. Viden om password-hashing er alligevel nødvendig for at kunne vurdere og bygge systemer uden central IdP.
      </Callout>

      <h2>Migrér væk fra gamle hashes (MD5 → bcrypt/Argon2)</h2>
      <p>I kan ikke "vende" en MD5-hash til en bcrypt-hash uden at kende adgangskoden. Der er to gængse strategier:</p>
      <ol>
        <li>
          <strong>Opgradér ved login</strong>: verificér med den gamle metode; hvis det lykkes, beregn en ny hash med bcrypt/Argon2, gem den og
          markér rækken som migreret.
        </li>
        <li>
          <strong>Wrap</strong>: beregn <code>bcrypt(md5hash)</code> for alle eksisterende rækker med det samme, så databasen straks er stærkere,
          og opgradér til ren bcrypt ved næste login.
        </li>
      </ol>
      <CodeBlock language="csharp">{`// Opgradér-ved-login (forenklet)
public bool VerifyAndUpgrade(User user, string password)
{
    if (user.HashAlgorithm == "md5-legacy")
    {
        // Samme sammenligning som det gamle system lavede - kun for at kunne migrere
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

      <h2>Øvrige gode vaner for adgangskoder</h2>
      <ul>
        <li>Tillad lange adgangskoder/passphrases (min. 12-15 tegn); undgå urimelige kompleksitetsregler.</li>
        <li>Tjek mod lister over kendte lækkede adgangskoder (fx Have I Been Pwned's k-anonymitets-API).</li>
        <li>Rate limiting og midlertidig lockout mod gætteangreb.</li>
        <li>Tilbyd MFA/passkeys.</li>
        <li>Returnér ens fejlbesked for "forkert bruger" og "forkert adgangskode".</li>
        <li>Log aldrig adgangskoder – heller ikke i fejlbeskeder eller request-logs.</li>
        <li>Send aldrig adgangskoder i e-mail; brug tidsbegrænsede reset-links.</li>
      </ul>

      <h2>Opsummering</h2>
      <ul>
        <li>Hashing er envejs; kryptering er to-vejs. Adgangskoder <strong>hashes</strong>, de krypteres ikke.</li>
        <li>MD5 (og SHA-1) er knækket til sikkerhedsformål – nævnes kun som historik og migrations-case.</li>
        <li>Integritet: SHA-256 (+ signatur/HMAC for ægthed). Adgangskoder: Argon2id eller bcrypt med unikt salt og passende cost.</li>
        <li>Brug biblioteker eller ASP.NET Identity's PasswordHasher – rul ikke selv.</li>
        <li>Planlæg migrering af gamle hashes og hæv cost over tid.</li>
      </ul>

      <h2>Øvelser</h2>
      <ol>
        <li>Beregn SHA-256 af en tekstfil, ændr ét tegn og beregn igen. Hvad observerer du (avalanche)?</li>
        <li>Hash samme adgangskode to gange med bcrypt. Hvorfor bliver resultaterne forskellige, og hvordan kan <code>Verify</code> alligevel virke?</li>
        <li>Mål, hvor lang tid <code>BCrypt.HashPassword</code> tager ved cost 10, 12 og 14 på din maskine. Hvilket vil du vælge i produktion, og hvorfor?</li>
        <li>Forklar med egne ord, hvorfor "SHA-256 + salt" stadig er et dårligt valg til adgangskoder.</li>
        <li>Skitsér en migrationsplan for en database med MD5-adgangskoder.</li>
      </ol>
    </LessonLayout>
  )
}
