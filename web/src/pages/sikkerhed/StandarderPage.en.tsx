import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import Figure from '../../components/Figure'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'
import Split from '../../components/Split'

const vulnLifecycle = `
flowchart LR
    A["A vulnerability exists in a library"] --> B["Discovered by a researcher/vendor"]
    B --> C["Responsible disclosure - patch is developed"]
    C --> D["CVE ID is assigned and published"]
    D --> E["NVD adds CVSS score and affected versions"]
    E --> F["Tools and advisories warn developers"]
    F --> G["We update the dependency and deploy"]
`

const sdlChart = `
flowchart LR
    R["Requirements and threat model"] --> D["Design"]
    D --> I["Implementation - secure coding"]
    I --> T["Test - SAST, DAST, dependency scan"]
    T --> Rel["Release"]
    Rel --> M["Operations and monitoring"]
    M -->|"new vulnerabilities"| R
`

const depPipeline = `# .github/workflows/security.yml - example of automatic dependency checks in CI
name: security
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: "0 6 * * 1"   # weekly - new CVEs appear without your code changing

jobs:
  dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: .NET - vulnerable packages
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "9.0.x"
      - run: dotnet list package --vulnerable --include-transitive

      - name: npm - vulnerable packages
        working-directory: web
        run: npm audit --audit-level=high`

const dependabot = `# .github/dependabot.yml - automatic update suggestions as pull requests
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

const cliLookup = `# Which of my NuGet packages have known vulnerabilities? (incl. indirect dependencies)
dotnet list package --vulnerable --include-transitive

# Are updates available?
dotnet list package --outdated

# The same questions for JavaScript/Node
npm audit
npm outdated`

export default function StandarderPageEn() {

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Security standards and known vulnerabilities{' '}</h1>
<h2>Why standards?</h2>
      <p>
        Security is a field where you should not invent everything yourself. Others have already systematised which
        mistakes most often hit web applications and how to avoid them. The goal of this lesson is that you can{' '}
        <strong>find</strong> and <strong>apply</strong> knowledge about security standards and known vulnerabilities – so you
        look things up instead of guessing.
      </p>
      <p>There are three kinds of sources you need to tell apart:</p>
      <ul>
        <li>
          <strong>Standards and frameworks</strong> – what should we do? (OWASP Top 10, OWASP ASVS, ISO 27001, NIST, CIS Controls)
        </li>
        <li>
          <strong>Vulnerability databases</strong> – what is concretely wrong in software that exists? (CVE, NVD, GitHub Advisory Database)
        </li>
        <li>
          <strong>Tools</strong> – how do we detect it automatically? (dependency scanning, SAST, DAST – see the lesson on tools)
        </li>
      </ul>

      <h2>OWASP</h2>
      <p>
        <strong>OWASP</strong> (Open Worldwide Application Security Project) is a non-profit foundation that publishes free,
        open resources on software security. The best known are:
      </p>
      <ul>
        <li>
          <strong>OWASP Top 10</strong> – the ten most critical risk areas for web applications. An awareness document, not a complete standard.
        </li>
        <li>
          <strong>ASVS</strong> (Application Security Verification Standard) – a detailed list of requirements in levels (1-3), which can be used as a basis for testing.
        </li>
        <li>
          <strong>Cheat Sheet Series</strong> – short, practical guides per topic (authentication, password storage, SQL injection prevention, etc.).
        </li>
        <li>
          <strong>OWASP ZAP</strong> – a testing tool (see the tools lesson).
        </li>
      </ul>

      <h2>OWASP Top 10 – overview (2021)</h2>
      <p>
        The list is updated every few years based on data from real applications. Always check owasp.org for the
        latest version. The overview here is based on the 2021 edition, which is still the most widely used reference in teaching.
      </p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Category</th>
            <th>Short explanation</th>
            <th>Defence (key points)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A01</td>
            <td>Broken Access Control</td>
            <td>Users can see/change things they have no right to (e.g. changing the ID in the URL and seeing other people's data).</td>
            <td>Check permissions on the server per request, deny by default, use <code>sub</code> as the owner key.</td>
          </tr>
          <tr>
            <td>A02</td>
            <td>Cryptographic Failures</td>
            <td>Missing/weak encryption of sensitive data in transit or at rest.</td>
            <td>TLS, strong algorithms, correct password hashing, no hard-coded keys.</td>
          </tr>
          <tr>
            <td>A03</td>
            <td>Injection</td>
            <td>Untrusted input is interpreted as a command (SQL, OS, LDAP) or code (XSS is included here).</td>
            <td>Parameterised queries, output encoding, validation, CSP.</td>
          </tr>
          <tr>
            <td>A04</td>
            <td>Insecure Design</td>
            <td>Flaws in the design itself – not just in the implementation.</td>
            <td>Threat modelling, secure design patterns, abuse cases.</td>
          </tr>
          <tr>
            <td>A05</td>
            <td>Security Misconfiguration</td>
            <td>Default accounts, open debug pages, overly detailed error messages, missing headers.</td>
            <td>Hardened, consistent configurations; infrastructure as code; minimal exposure.</td>
          </tr>
          <tr>
            <td>A06</td>
            <td>Vulnerable and Outdated Components</td>
            <td>Use of libraries/frameworks with known vulnerabilities.</td>
            <td>Dependency scanning, update routine, SBOM.</td>
          </tr>
          <tr>
            <td>A07</td>
            <td>Identification and Authentication Failures</td>
            <td>Weak login, missing MFA, poor session handling.</td>
            <td>Central auth (OIDC), MFA, rate limiting, secure sessions/tokens.</td>
          </tr>
          <tr>
            <td>A08</td>
            <td>Software and Data Integrity Failures</td>
            <td>Untrusted updates, CI/CD pipelines or serialised data without integrity checks.</td>
            <td>Signing, locked dependencies (lockfiles), protected pipelines.</td>
          </tr>
          <tr>
            <td>A09</td>
            <td>Security Logging and Monitoring Failures</td>
            <td>Attacks go undetected because nothing is logged or monitored.</td>
            <td>Log login attempts and access failures (without sensitive data), alerts, log review.</td>
          </tr>
          <tr>
            <td>A10</td>
            <td>Server-Side Request Forgery (SSRF)</td>
            <td>The server is tricked into fetching URLs on an attacker's behalf, e.g. internal services.</td>
            <td>Allowlist of permitted targets, network segmentation, no free-form URLs from users.</td>
          </tr>
        </tbody>
      </table>
      <Callout type="info">
        The Top 10 are <em>categories</em>, not individual bugs. Use them as a checklist during code review and as a structure for
        your security testing: "Have we thought about A01-A10 in this feature?"
      </Callout>

      <h3>Connection to the rest of the module</h3>
      <ul>
        <li>A02 → the lessons on <strong>encryption</strong> and <strong>hashing</strong></li>
        <li>A03 → the lesson on <strong>SQL injection and XSS</strong></li>
        <li>A07 → the lesson on <strong>authentication</strong></li>
        <li>A06 and A05 → the lesson on <strong>tools</strong> (dependency scanning, header checks)</li>
      </ul>

      <h2>CVE and NVD</h2>
      <p>
        When a vulnerability is discovered in a piece of software, everyone must be able to talk about precisely <em>that</em> vulnerability. That is why these exist:
      </p>
      <ul>
        <li>
          <strong>CVE</strong> (Common Vulnerabilities and Exposures) – a unique ID for a known vulnerability, e.g.{' '}
          <code>CVE-2021-44228</code> (Log4Shell). Format: <code>CVE-YEAR-NUMBER</code>. Maintained by MITRE.
        </li>
        <li>
          <strong>NVD</strong> (National Vulnerability Database, run by NIST) – enriches CVEs with a description,{' '}
          <strong>CVSS</strong> score, affected products/versions (CPE) and classification (CWE).
        </li>
        <li>
          <strong>CWE</strong> (Common Weakness Enumeration) – categories of <em>weaknesses</em> (e.g. CWE-89: SQL Injection,
          CWE-79: XSS). CVE = concrete occurrence, CWE = type of flaw.
        </li>
        <li>
          <strong>CVSS</strong> – a 0-10 severity score: Low (0.1-3.9), Medium (4-6.9), High (7-8.9), Critical (9-10).
        </li>
        <li>
          <strong>Other sources</strong>: GitHub Advisory Database, <code>npm audit</code> advisories, Microsoft Security Response Center,
          CERT teams (e.g. the <em>Center for Cybersikkerhed</em> in Denmark), vendors' own bulletins.
        </li>
      </ul>
      <MermaidDiagram chart={vulnLifecycle} />

      <h3>How to read a CVE entry</h3>
      <ol>
        <li><strong>Description</strong> – what is the problem, which components and versions are affected?</li>
        <li><strong>CVSS vector</strong> – attack vector (network/local), complexity, required privileges, impact on C/I/A.</li>
        <li><strong>Affected versions</strong> – are <em>we</em> running one of them? Check our actual version, including indirect dependencies.</li>
        <li><strong>Fix/mitigation</strong> – update to version X, or a configuration change as a temporary workaround.</li>
        <li><strong>Is it being actively exploited?</strong> – see e.g. CISA's <em>Known Exploited Vulnerabilities</em> catalogue. Actively exploited vulnerabilities are prioritised first.</li>
      </ol>
      <Callout type="tip">
        CVSS alone is not the whole truth. A "Critical" vulnerability in a function you never call is less urgent than
        a "Medium" one in your login flow. Assess <em>risk = likelihood x impact</em> in your own context.
      </Callout>

      <h2>Examples of known vulnerabilities (for learning, not a recipe)</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>What went wrong (high level)</th>
            <th>Lesson</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Heartbleed (2014, OpenSSL)</td>
            <td>A flaw in a widely used crypto library could reveal memory contents from servers.</td>
            <td>Even "security code" has bugs – keep libraries updated and know your dependencies.</td>
          </tr>
          <tr>
            <td>Equifax (2017)</td>
            <td>A known, already fixed hole in a web framework was not patched in time.</td>
            <td>Patch management and an overview of your assets are crucial.</td>
          </tr>
          <tr>
            <td>Log4Shell (2021)</td>
            <td>A logging library treated certain log messages as instructions. Hit an enormous number of systems.</td>
            <td>Transitive dependencies – you can use a vulnerable library without knowing it. An SBOM helps.</td>
          </tr>
          <tr>
            <td>left-pad / event-stream (npm)</td>
            <td>Supply chain: packages were removed or taken over by malicious maintainers.</td>
            <td>Lock versions, review new dependencies, use as few as possible.</td>
          </tr>
        </tbody>
      </table>

      <h2>Dependency scanning</h2>
      <p>
        Most modern applications consist of far more third-party code than self-developed code. A new .NET project
        pulls in dozens of NuGet packages, a React project hundreds of npm packages (transitively). Each is a potential
        vulnerability – OWASP A06.
      </p>
      <p>The concept is simple:</p>
      <ol>
        <li>The tool reads your <em>dependency list</em> (<code>.csproj</code>/<code>package-lock.json</code>).</li>
        <li>It compares package name + version with vulnerability databases (NVD, GitHub Advisories).</li>
        <li>It reports matches with severity and recommended fix version.</li>
        <li>You update – and run tests to make sure nothing broke.</li>
      </ol>
      <CodeBlock language="bash">{cliLookup}</CodeBlock>
      <p>Automate it so it runs without anyone having to remember it:</p>
      <CodeBlock language="yaml">{depPipeline}</CodeBlock>
      <CodeBlock language="yaml">{dependabot}</CodeBlock>

      <Callout type="warn">
        Scanning only finds <em>known</em> vulnerabilities. It tells you nothing about flaws in your own code or brand-new
        vulnerabilities (zero-days). It is one layer of the defence, not the whole defence.
      </Callout>

      <h3>SBOM and supply chain</h3>
      <p>
        An <strong>SBOM</strong> (Software Bill of Materials) is a machine-readable list of all components in your software
        (formats: CycloneDX, SPDX). When the next Log4Shell hits, you can answer within minutes: "do we use it?". In addition:
      </p>
      <ul>
        <li><strong>Lockfiles</strong> (<code>package-lock.json</code>, <code>packages.lock.json</code>) – reproducible builds.</li>
        <li><strong>Minimise dependencies</strong> – every package is attack surface.</li>
        <li><strong>Base images</strong> for Docker must also be scanned and updated.</li>
      </ul>

      <h2>Secure coding – checklist</h2>
      <p>
        Use the list during design, code review and before release. It is an abbreviated version inspired by OWASP's Secure Coding
        Practices and ASVS.
      </p>
      <table>
        <thead>
          <tr>
            <th>Area</th>
            <th>Questions to ask</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Input</td>
            <td>Is all input validated on the server (type, length, format, allowlist)? Is client-side validation only for UX?</td>
          </tr>
          <tr>
            <td>Output</td>
            <td>Is data encoded correctly in the HTML/JS/URL context? Are we using the framework's secure defaults?</td>
          </tr>
          <tr>
            <td>Database</td>
            <td>Are parameterised queries/ORM used everywhere? Does the DB user have the least possible privileges?</td>
          </tr>
          <tr>
            <td>Authentication</td>
            <td>Do we use central auth (Mercantec Auth) instead of our own solution? Are tokens validated (iss, aud, exp, signature)?</td>
          </tr>
          <tr>
            <td>Authorization</td>
            <td>Are permissions checked on every endpoint and per object (owner)? Deny by default?</td>
          </tr>
          <tr>
            <td>Secrets</td>
            <td>Are keys, connection strings and tokens kept outside git (env/secret store)?</td>
          </tr>
          <tr>
            <td>Encryption</td>
            <td>HTTPS everywhere? HSTS? Passwords hashed with bcrypt/Argon2 – not encrypted or MD5?</td>
          </tr>
          <tr>
            <td>Error handling</td>
            <td>Are generic errors returned to the client while details are logged on the server? No stack traces in production?</td>
          </tr>
          <tr>
            <td>Logging</td>
            <td>Are login failures and access denials logged? Are passwords/tokens/personal data never logged?</td>
          </tr>
          <tr>
            <td>Dependencies</td>
            <td>Are they scanned in CI? Is there an update routine? Are lockfiles committed?</td>
          </tr>
          <tr>
            <td>Configuration</td>
            <td>Is debug turned off in production? Is CORS limited to known origins? Are security headers set?</td>
          </tr>
          <tr>
            <td>Rate limiting</td>
            <td>Are login and expensive endpoints protected against repeated calls (brute force, abuse)?</td>
          </tr>
        </tbody>
      </table>

      <h3>Principles behind the list</h3>
      <ul>
        <li><strong>Least privilege</strong> – grant only the permissions that are necessary.</li>
        <li><strong>Defense in depth</strong> – multiple layers; one layer may fail.</li>
        <li><strong>Secure by default</strong> – the secure setting is the default.</li>
        <li><strong>Fail securely</strong> – on error, access is denied, not granted.</li>
        <li><strong>Never trust input</strong> – everything from the client, including headers and cookies, is untrusted.</li>
        <li><strong>Keep it simple</strong> – complexity is the enemy of security.</li>
      </ul>

      <h2>Security in the development process</h2>
      <Split
        media={
          <Figure
            src="/images/commons/sdlc-ssdlc.png"
            alt="From traditional SDLC to secure SDLC with rising cost of late defects"
            caption="The later a security defect is found, the more expensive it usually is to fix"
            sourceUrl="https://commons.wikimedia.org/wiki/File:From_SDLC_to_SSDLC.png"
            sourceLabel="Wikimedia Commons"
            size="md"
          />
        }
      >
        <p>
          Security is cheapest when it is considered from the start (&ldquo;shift left&rdquo;) – not bolted on at the end. This is often called
          SDL/DevSecOps:
        </p>
        <MermaidDiagram chart={sdlChart} />
      </Split>

      <h2>Broader standards (briefly)</h2>
      <table>
        <thead>
          <tr>
            <th>Standard</th>
            <th>Focus</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ISO/IEC 27001</td>
            <td>Management system for information security (ISMS) – certifiable, organisation level.</td>
          </tr>
          <tr>
            <td>NIST Cybersecurity Framework</td>
            <td>Identify, Protect, Detect, Respond, Recover – a risk-based framework.</td>
          </tr>
          <tr>
            <td>CIS Controls / Benchmarks</td>
            <td>Concrete hardening guides for systems, containers and cloud.</td>
          </tr>
          <tr>
            <td>GDPR</td>
            <td>Legal requirements for personal data: "security by design", encryption, data minimisation, breach notification.</td>
          </tr>
          <tr>
            <td>PCI DSS</td>
            <td>Requirements if you handle card data (in practice: use a payment provider such as Stripe, and you are out of most of it).</td>
          </tr>
        </tbody>
      </table>

      <Callout type="info">
        GDPR is not a "technical" standard, but it has direct consequences for developers: you must be able to argue that your
        technical measures (encryption, access control, logging) are proportionate to the risk.
      </Callout>

      <h2>Summary</h2>
      <ul>
        <li>The OWASP Top 10 gives an overview of the most frequent risk areas – use it as a checklist.</li>
        <li>CVE identifies concrete vulnerabilities; NVD adds CVSS, versions and details; CWE describes the type of flaw.</li>
        <li>Dependency scanning in CI finds known vulnerabilities in third-party code – OWASP A06.</li>
        <li>Update regularly, lock versions and keep track of what you use (SBOM).</li>
        <li>Secure coding is a habit, supported by a checklist and automated tools.</li>
      </ul>

      <h2>Exercises</h2>
      <ol>
        <li>Look up <code>CVE-2021-44228</code> in NVD. Note the CVSS score, affected versions and recommended fix. Which CWE is linked to it?</li>
        <li>Run <code>dotnet list package --vulnerable --include-transitive</code> and <code>npm audit</code> on one of your own projects. What do you find, and what do you do about it?</li>
        <li>Pick three of the OWASP Top 10 categories and find one place in your own application where they are relevant. How is it handled?</li>
        <li>Go through the secure coding checklist for your own project and make a prioritised list of the three most important gaps.</li>
        <li>Set up Dependabot (or equivalent) in your repository and watch the first pull request come in.</li>
      </ol>
    </LessonLayout>
  )
}
