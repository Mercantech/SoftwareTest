import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'

const vulnLifecycle = `
flowchart LR
    A["Sårbarhed findes i et bibliotek"] --> B["Opdages af forsker/leverandør"]
    B --> C["Ansvarlig offentliggørelse - patch udvikles"]
    C --> D["CVE-ID tildeles og publiceres"]
    D --> E["NVD tilføjer CVSS-score og berørte versioner"]
    E --> F["Værktøjer og advisories advarer udviklere"]
    F --> G["Vi opdaterer afhængigheden og deployer"]
`

const sdlChart = `
flowchart LR
    R["Krav og trusselsmodel"] --> D["Design"]
    D --> I["Implementering - secure coding"]
    I --> T["Test - SAST, DAST, dependency scan"]
    T --> Rel["Release"]
    Rel --> M["Drift og overvågning"]
    M -->|"nye sårbarheder"| R
`

const depPipeline = `# .github/workflows/security.yml - eksempel på automatisk afhængighedstjek i CI
name: security
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "0 6 * * 1"   # ugentligt - nye CVE'er dukker op uden at jeres kode ændrer sig

jobs:
  dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: .NET - sårbare pakker
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "9.0.x"
      - run: dotnet list package --vulnerable --include-transitive

      - name: npm - sårbare pakker
        working-directory: web
        run: npm audit --audit-level=high`

const dependabot = `# .github/dependabot.yml - automatiske opdateringsforslag som pull requests
version: 2
updates:
  - package-ecosystem: "nuget"
    directory: "/api"
    schedule:
      interval: "weekly"
  - package-ecosystem: "npm"
    directory: "/web"
    schedule:
      interval: "weekly"
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"`

const cliLookup = `# Hvilke af mine NuGet-pakker har kendte sårbarheder? (inkl. indirekte afhængigheder)
dotnet list package --vulnerable --include-transitive

# Er der opdateringer til rådighed?
dotnet list package --outdated

# Samme spørgsmål for JavaScript/Node
npm audit
npm outdated`

export default function StandarderPageDa() {
  const objective = getObjectiveByPath('/sikkerhed/standarder')

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Sikkerhedsstandarder og kendte sårbarheder{' '}
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

      <h2>Hvorfor standarder?</h2>
      <p>
        Sikkerhed er et felt, hvor man ikke skal opfinde alting selv. Andre har allerede systematiseret, hvilke fejl der
        oftest rammer webapplikationer, og hvordan man undgår dem. Målet med denne lektion er, at du kan{' '}
        <strong>finde</strong> og <strong>anvende</strong> viden om sikkerhedsstandarder og kendte sårbarheder – så du
        ikke gætter, men slår op.
      </p>
      <p>Der er tre slags kilder, du skal kende forskel på:</p>
      <ul>
        <li>
          <strong>Standarder og frameworks</strong> – hvad bør vi gøre? (OWASP Top 10, OWASP ASVS, ISO 27001, NIST, CIS Controls)
        </li>
        <li>
          <strong>Sårbarhedsdatabaser</strong> – hvad er konkret galt i software, der findes? (CVE, NVD, GitHub Advisory Database)
        </li>
        <li>
          <strong>Værktøjer</strong> – hvordan opdager vi det automatisk? (dependency scanning, SAST, DAST – se lektionen om tools)
        </li>
      </ul>

      <h2>OWASP</h2>
      <p>
        <strong>OWASP</strong> (Open Worldwide Application Security Project) er en non-profit fond, der udgiver gratis,
        åbne ressourcer om softwaresikkerhed. De mest kendte er:
      </p>
      <ul>
        <li>
          <strong>OWASP Top 10</strong> – de ti mest kritiske risikoområder for webapplikationer. Et bevidsthedsdokument, ikke en komplet standard.
        </li>
        <li>
          <strong>ASVS</strong> (Application Security Verification Standard) – detaljeret kravliste i niveauer (1-3), som kan bruges som testgrundlag.
        </li>
        <li>
          <strong>Cheat Sheet Series</strong> – korte, praktiske guides pr. emne (authentication, password storage, SQL injection prevention m.fl.).
        </li>
        <li>
          <strong>OWASP ZAP</strong> – et testværktøj (se tools-lektionen).
        </li>
      </ul>

      <h2>OWASP Top 10 – overblik (2021)</h2>
      <p>
        Listen opdateres med års mellemrum på baggrund af data fra virkelige applikationer. Tjek altid owasp.org for den
        nyeste version. Oversigten her bygger på 2021-udgaven, som stadig er den mest udbredte reference i undervisning.
      </p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Kategori</th>
            <th>Kort forklaring</th>
            <th>Forsvar (hovedtræk)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A01</td>
            <td>Broken Access Control</td>
            <td>Brugere kan se/ændre ting, de ikke har ret til (fx ændre ID i URL'en og se andres data).</td>
            <td>Tjek rettigheder på serveren pr. request, deny by default, brug <code>sub</code> som ejer-nøgle.</td>
          </tr>
          <tr>
            <td>A02</td>
            <td>Cryptographic Failures</td>
            <td>Manglende/svag kryptering af følsomme data i transit eller at rest.</td>
            <td>TLS, stærke algoritmer, korrekt password-hashing, ingen hårdkodede nøgler.</td>
          </tr>
          <tr>
            <td>A03</td>
            <td>Injection</td>
            <td>Utroværdigt input tolkes som kommando (SQL, OS, LDAP) eller kode (XSS indgår her).</td>
            <td>Parameteriserede forespørgsler, output-encoding, validering, CSP.</td>
          </tr>
          <tr>
            <td>A04</td>
            <td>Insecure Design</td>
            <td>Fejl i selve designet – ikke kun i implementeringen.</td>
            <td>Trusselsmodellering, sikre designmønstre, misbrugs-use cases.</td>
          </tr>
          <tr>
            <td>A05</td>
            <td>Security Misconfiguration</td>
            <td>Standardkonti, åbne debug-sider, for detaljerede fejlbeskeder, manglende headers.</td>
            <td>Hærdede, ens konfigurationer; infrastructure as code; minimal eksponering.</td>
          </tr>
          <tr>
            <td>A06</td>
            <td>Vulnerable and Outdated Components</td>
            <td>Brug af biblioteker/frameworks med kendte sårbarheder.</td>
            <td>Dependency scanning, opdateringsrutine, SBOM.</td>
          </tr>
          <tr>
            <td>A07</td>
            <td>Identification and Authentication Failures</td>
            <td>Svag login, manglende MFA, dårlig session-håndtering.</td>
            <td>Central auth (OIDC), MFA, rate limiting, sikre sessioner/tokens.</td>
          </tr>
          <tr>
            <td>A08</td>
            <td>Software and Data Integrity Failures</td>
            <td>Utroværdige opdateringer, CI/CD-pipelines eller serialiseret data uden integritetskontrol.</td>
            <td>Signering, låste afhængigheder (lockfiles), beskyttede pipelines.</td>
          </tr>
          <tr>
            <td>A09</td>
            <td>Security Logging and Monitoring Failures</td>
            <td>Angreb opdages ikke, fordi der ikke logges eller overvåges.</td>
            <td>Log login-forsøg og adgangsfejl (uden følsomme data), alarmer, log-review.</td>
          </tr>
          <tr>
            <td>A10</td>
            <td>Server-Side Request Forgery (SSRF)</td>
            <td>Serveren narres til at hente URL'er på angriberens vegne, fx interne tjenester.</td>
            <td>Allowlist over tilladte mål, netværkssegmentering, ingen frie URL'er fra brugere.</td>
          </tr>
        </tbody>
      </table>
      <Callout type="info">
        Top 10 er <em>kategorier</em>, ikke enkelte fejl. Brug dem som tjekliste ved code review og som struktur for
        jeres sikkerhedstest: "Har vi tænkt over A01-A10 i denne feature?"
      </Callout>

      <h3>Kobling til resten af modulet</h3>
      <ul>
        <li>A02 → lektionen om <strong>kryptering</strong> og <strong>hashing</strong></li>
        <li>A03 → lektionen om <strong>SQL injection og XSS</strong></li>
        <li>A07 → lektionen om <strong>authentication</strong></li>
        <li>A06 og A05 → lektionen om <strong>tools</strong> (dependency scanning, header-checks)</li>
      </ul>

      <h2>CVE og NVD</h2>
      <p>
        Når der opdages en sårbarhed i et stykke software, skal alle kunne tale om netop <em>den</em> sårbarhed. Derfor findes:
      </p>
      <ul>
        <li>
          <strong>CVE</strong> (Common Vulnerabilities and Exposures) – et unikt ID til en kendt sårbarhed, fx{' '}
          <code>CVE-2021-44228</code> (Log4Shell). Format: <code>CVE-ÅR-NUMMER</code>. Vedligeholdes af MITRE.
        </li>
        <li>
          <strong>NVD</strong> (National Vulnerability Database, drevet af NIST) – beriger CVE'er med beskrivelse,{' '}
          <strong>CVSS</strong>-score, berørte produkter/versioner (CPE) og klassifikation (CWE).
        </li>
        <li>
          <strong>CWE</strong> (Common Weakness Enumeration) – kategorier af <em>svagheder</em> (fx CWE-89: SQL Injection,
          CWE-79: XSS). CVE = konkret forekomst, CWE = type fejl.
        </li>
        <li>
          <strong>CVSS</strong> – score 0-10 for alvorlighed: Low (0.1-3.9), Medium (4-6.9), High (7-8.9), Critical (9-10).
        </li>
        <li>
          <strong>Øvrige kilder</strong>: GitHub Advisory Database, <code>npm audit</code>-advisories, Microsoft Security Response Center,
          CERT-teams (fx <em>Center for Cybersikkerhed</em> i Danmark), leverandørers egne bulletins.
        </li>
      </ul>
      <MermaidDiagram chart={vulnLifecycle} />

      <h3>Sådan læser du en CVE-post</h3>
      <ol>
        <li><strong>Beskrivelse</strong> – hvad er problemet, hvilke komponenter og versioner er berørt?</li>
        <li><strong>CVSS-vektor</strong> – angrebsvej (netværk/lokalt), kompleksitet, krævede rettigheder, påvirkning på C/I/A.</li>
        <li><strong>Berørte versioner</strong> – kører <em>vi</em> en af dem? Tjek vores faktiske version, også indirekte afhængigheder.</li>
        <li><strong>Fix/mitigering</strong> – opdatér til version X, eller konfigurationsændring som midlertidig afhjælpning.</li>
        <li><strong>Eksploiteres det aktivt?</strong> – se fx CISA's <em>Known Exploited Vulnerabilities</em>-katalog. Aktivt udnyttede sårbarheder prioriteres først.</li>
      </ol>
      <Callout type="tip">
        CVSS alene er ikke hele sandheden. En "Critical" sårbarhed i en funktion I aldrig kalder, er mindre presserende end
        en "Medium" i jeres login-flow. Vurdér <em>risiko = sandsynlighed x konsekvens</em> i jeres kontekst.
      </Callout>

      <h2>Eksempler på kendte sårbarheder (læring, ikke opskrift)</h2>
      <table>
        <thead>
          <tr>
            <th>Navn</th>
            <th>Hvad gik galt (overordnet)</th>
            <th>Lektie</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Heartbleed (2014, OpenSSL)</td>
            <td>Fejl i et udbredt kryptobibliotek kunne afsløre hukommelsesindhold fra servere.</td>
            <td>Selv "sikkerhedskode" har fejl – hold biblioteker opdateret og kend jeres afhængigheder.</td>
          </tr>
          <tr>
            <td>Equifax (2017)</td>
            <td>Et kendt, allerede rettet hul i et webframework blev ikke patchet i tide.</td>
            <td>Patch management og asset-overblik er afgørende.</td>
          </tr>
          <tr>
            <td>Log4Shell (2021)</td>
            <td>Logging-bibliotek behandlede visse logbeskeder som instruktioner. Ramte enormt mange systemer.</td>
            <td>Transitive afhængigheder – man kan bruge et sårbart bibliotek uden at vide det. SBOM hjælper.</td>
          </tr>
          <tr>
            <td>left-pad / event-stream (npm)</td>
            <td>Supply chain: pakker blev fjernet eller overtaget af ondsindede vedligeholdere.</td>
            <td>Lås versioner, gennemgå nye afhængigheder, brug så få som muligt.</td>
          </tr>
        </tbody>
      </table>

      <h2>Afhængighedsscanning (dependency scanning)</h2>
      <p>
        De fleste moderne applikationer består af langt mere tredjepartskode end egenudviklet kode. Et nyt .NET-projekt
        trækker tiere af NuGet-pakker ind, et React-projekt hundredvis af npm-pakker (transitivt). Hver er en potentiel
        sårbarhed – OWASP A06.
      </p>
      <p>Konceptet er enkelt:</p>
      <ol>
        <li>Værktøjet læser jeres <em>afhængighedsliste</em> (<code>.csproj</code>/<code>package-lock.json</code>).</li>
        <li>Den sammenligner pakkenavn + version med sårbarhedsdatabaser (NVD, GitHub Advisories).</li>
        <li>Den rapporterer matches med alvorlighed og anbefalet fix-version.</li>
        <li>I opdaterer – og kører tests for at se, at intet gik i stykker.</li>
      </ol>
      <CodeBlock language="bash">{cliLookup}</CodeBlock>
      <p>Automatisér det, så det kører uden at nogen skal huske det:</p>
      <CodeBlock language="yaml">{depPipeline}</CodeBlock>
      <CodeBlock language="yaml">{dependabot}</CodeBlock>

      <Callout type="warn">
        Scanning finder kun <em>kendte</em> sårbarheder. Den fortæller intet om fejl i jeres egen kode eller helt nye
        sårbarheder (zero-days). Den er et lag i forsvaret, ikke hele forsvaret.
      </Callout>

      <h3>SBOM og supply chain</h3>
      <p>
        En <strong>SBOM</strong> (Software Bill of Materials) er en maskinlæsbar liste over alle komponenter i jeres software
        (formater: CycloneDX, SPDX). Når næste Log4Shell rammer, kan I på minutter svare: "bruger vi det?". Hertil kommer:
      </p>
      <ul>
        <li><strong>Lockfiles</strong> (<code>package-lock.json</code>, <code>packages.lock.json</code>) – reproducerbare builds.</li>
        <li><strong>Minimér afhængigheder</strong> – hver pakke er angrebsflade.</li>
        <li><strong>Basis-images</strong> til Docker skal også scannes og opdateres.</li>
      </ul>

      <h2>Secure coding – tjekliste</h2>
      <p>
        Brug listen ved design, code review og før release. Den er en forkortet udgave inspireret af OWASP's Secure Coding
        Practices og ASVS.
      </p>
      <table>
        <thead>
          <tr>
            <th>Område</th>
            <th>Spørgsmål at stille</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Input</td>
            <td>Valideres alt input på serveren (type, længde, format, allowlist)? Er klientvalidering kun til UX?</td>
          </tr>
          <tr>
            <td>Output</td>
            <td>Encodes data korrekt i HTML/JS/URL-konteksten? Bruger vi frameworkets sikre standarder?</td>
          </tr>
          <tr>
            <td>Database</td>
            <td>Bruges parameteriserede forespørgsler/ORM overalt? Har DB-brugeren mindst mulige rettigheder?</td>
          </tr>
          <tr>
            <td>Authentication</td>
            <td>Bruger vi central auth (Mercantec Auth) i stedet for egen løsning? Valideres tokens (iss, aud, exp, signatur)?</td>
          </tr>
          <tr>
            <td>Authorization</td>
            <td>Tjekkes rettigheder på hvert endpoint og pr. objekt (ejer)? Deny by default?</td>
          </tr>
          <tr>
            <td>Hemmeligheder</td>
            <td>Ligger nøgler, connection strings og tokens uden for git (env/secret store)?</td>
          </tr>
          <tr>
            <td>Kryptering</td>
            <td>HTTPS overalt? HSTS? Passwords hashet med bcrypt/Argon2 – ikke krypteret eller MD5?</td>
          </tr>
          <tr>
            <td>Fejlhåndtering</td>
            <td>Returneres generiske fejl til klienten, mens detaljer logges på serveren? Ingen stack traces i produktion?</td>
          </tr>
          <tr>
            <td>Logging</td>
            <td>Logges login-fejl og adgangsafvisninger? Logges der aldrig passwords/tokens/persondata?</td>
          </tr>
          <tr>
            <td>Afhængigheder</td>
            <td>Scannes de i CI? Er der en opdateringsrutine? Er lockfiles committet?</td>
          </tr>
          <tr>
            <td>Konfiguration</td>
            <td>Er debug slået fra i produktion? Er CORS begrænset til kendte origins? Sikkerheds-headers sat?</td>
          </tr>
          <tr>
            <td>Rate limiting</td>
            <td>Er login og dyre endpoints beskyttet mod gentagne kald (brute force, misbrug)?</td>
          </tr>
        </tbody>
      </table>

      <h3>Principper bag listen</h3>
      <ul>
        <li><strong>Least privilege</strong> – giv kun de rettigheder, der er nødvendige.</li>
        <li><strong>Defense in depth</strong> – flere lag; ét lag må gerne fejle.</li>
        <li><strong>Secure by default</strong> – den sikre indstilling er standarden.</li>
        <li><strong>Fail securely</strong> – ved fejl nægtes adgang, ikke gives.</li>
        <li><strong>Never trust input</strong> – alt fra klienten, også headers og cookies, er utroværdigt.</li>
        <li><strong>Keep it simple</strong> – kompleksitet er sikkerhedens fjende.</li>
      </ul>

      <h2>Sikkerhed i udviklingsprocessen</h2>
      <p>
        Sikkerhed bliver billigst, hvis den tænkes ind fra start ("shift left") – ikke klistres på til sidst. Det kaldes ofte
        SDL/DevSecOps:
      </p>
      <MermaidDiagram chart={sdlChart} />

      <h2>Bredere standarder (kort)</h2>
      <table>
        <thead>
          <tr>
            <th>Standard</th>
            <th>Fokus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ISO/IEC 27001</td>
            <td>Ledelsessystem for informationssikkerhed (ISMS) – certificerbar, organisationsniveau.</td>
          </tr>
          <tr>
            <td>NIST Cybersecurity Framework</td>
            <td>Identify, Protect, Detect, Respond, Recover – risikobaseret ramme.</td>
          </tr>
          <tr>
            <td>CIS Controls / Benchmarks</td>
            <td>Konkrete hærdningsvejledninger til systemer, containere og cloud.</td>
          </tr>
          <tr>
            <td>GDPR</td>
            <td>Lovkrav til persondata: "security by design", kryptering, dataminimering, anmeldelse af brud.</td>
          </tr>
          <tr>
            <td>PCI DSS</td>
            <td>Krav hvis I håndterer kortdata (i praksis: brug en betalingsudbyder som Stripe, så er I ude af det meste).</td>
          </tr>
        </tbody>
      </table>

      <Callout type="info">
        GDPR er ikke en "teknisk" standard, men har direkte konsekvenser for udviklere: I skal kunne argumentere for, at jeres
        tekniske foranstaltninger (kryptering, adgangsstyring, logning) står i et rimeligt forhold til risikoen.
      </Callout>

      <h2>Opsummering</h2>
      <ul>
        <li>OWASP Top 10 giver overblikket over de hyppigste risikoområder – brug det som tjekliste.</li>
        <li>CVE identificerer konkrete sårbarheder; NVD tilføjer CVSS, versioner og detaljer; CWE beskriver fejltypen.</li>
        <li>Afhængighedsscanning i CI finder kendte sårbarheder i tredjepartskode – OWASP A06.</li>
        <li>Opdatér regelmæssigt, lås versioner og hold styr på, hvad I bruger (SBOM).</li>
        <li>Secure coding er en vane, støttet af en tjekliste og automatiske værktøjer.</li>
      </ul>

      <h2>Øvelser</h2>
      <ol>
        <li>Slå <code>CVE-2021-44228</code> op i NVD. Notér CVSS-score, berørte versioner og anbefalet fix. Hvilken CWE er knyttet til den?</li>
        <li>Kør <code>dotnet list package --vulnerable --include-transitive</code> og <code>npm audit</code> på et af jeres egne projekter. Hvad finder I, og hvad gør I ved det?</li>
        <li>Vælg tre af OWASP Top 10-kategorierne og find ét sted i jeres egen applikation, hvor de er relevante. Hvordan er det håndteret?</li>
        <li>Gennemgå secure coding-tjeklisten for jeres eget projekt og lav en prioriteret liste over de tre vigtigste mangler.</li>
        <li>Opsæt Dependabot (eller tilsvarende) i jeres repository og se den første pull request komme ind.</li>
      </ol>
    </LessonLayout>
  )
}
