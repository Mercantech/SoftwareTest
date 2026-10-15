import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const toolMap = `
flowchart LR
    subgraph K["Code"]
        SAST["SAST - static analysis of your own code"]
        SEC["Secret scanning"]
    end
    subgraph A["Dependencies"]
        SCA["SCA - dotnet list package, npm audit, Dependabot"]
    end
    subgraph R["Running app"]
        DAST["DAST - OWASP ZAP"]
        HDR["Header checks"]
        TLS["TLS test - SSL Labs"]
    end
    subgraph C["Container and infrastructure"]
        IMG["Image scanning - Trivy"]
    end
    K --> CI["CI pipeline"]
    A --> CI
    C --> CI
    CI --> DAST
`

const ciFlow = `
sequenceDiagram
    participant Dev as Developer
    participant CI as CI pipeline
    participant Test as Test environment
    Dev->>CI: Push / pull request
    CI->>CI: Build + unit tests
    CI->>CI: Dependency scan, SAST and secret scan
    CI->>Test: Deploy to test environment
    CI->>Test: ZAP baseline scan
    Test->>CI: Report
    CI->>Dev: Fail if serious findings
`

const depCommands = `# .NET: known vulnerabilities in NuGet packages (including transitive)
dotnet list package --vulnerable --include-transitive

# .NET: outdated packages
dotnet list package --outdated

# Node/npm (frontend)
npm audit                       # report
npm audit --audit-level=high    # exit code != 0 on high/critical (good for CI)
npm audit fix                   # attempts compatible updates - review the diff and run tests!`

const dotnetNuGetAudit = `<!-- .csproj: let NuGet warn about vulnerable packages already at restore/build -->
<PropertyGroup>
  <NuGetAudit>true</NuGetAudit>
  <NuGetAuditMode>all</NuGetAuditMode>      <!-- incl. transitive dependencies -->
  <NuGetAuditLevel>low</NuGetAuditLevel>
  <!-- <TreatWarningsAsErrors> or WarningsAsErrors: NU1901;NU1902;NU1903;NU1904 can make CI fail -->
</PropertyGroup>`

const owaspDc = `# OWASP Dependency-Check (can scan many ecosystems against NVD)
# Runs as CLI or Docker - only against YOUR OWN code
docker run --rm -v "$(pwd):/src" owasp/dependency-check \\
  --scan /src --format HTML --out /src/reports --project "SoftwareTest"`

const zapBaseline = `# OWASP ZAP baseline scan: passive scanning, no active attacks
# Run ONLY against your own test environment (or a system you have written permission to test)
docker run --rm -v "$(pwd)/zap:/zap/wrk:rw" \\
  ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \\
  -t https://test.your-own-domain.example \\
  -r zap-report.html`

const zapCi = `# GitHub Actions: ZAP baseline against test environment after deploy
name: zap-baseline
on:
  workflow_dispatch:
  schedule:
    - cron: "0 5 * * 1"

jobs:
  zap:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP baseline scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: "https://test.your-own-domain.example"   # your own environment!
          fail_action: false                               # start by just looking, tighten later`

const headerCheck = `# See your own response headers (read-only HTTP request against your own domain)
curl -sI https://app.your-own-domain.example

# Expected headers - examples:
#   Strict-Transport-Security: max-age=31536000; includeSubDomains
#   Content-Security-Policy: default-src 'self'; ...
#   X-Content-Type-Options: nosniff
#   Referrer-Policy: strict-origin-when-cross-origin
#   Permissions-Policy: camera=(), microphone=(), geolocation=()`

const trivy = `# Trivy: scan a Docker image for known vulnerabilities in OS packages and dependencies
trivy image my-image:latest

# Scan filesystem/repo (dependencies, secrets, IaC misconfiguration)
trivy fs .`

const gitleaks = `# Find secrets (API keys, tokens) accidentally committed to the repo + history
gitleaks detect --source . --verbose`

const securityTest = `// A small integration test that enforces security headers - cheap and effective regression protection
public class SecurityHeadersTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    public SecurityHeadersTests(WebApplicationFactory<Program> f) => _client = f.CreateClient();

    [Fact]
    public async Task Responses_have_security_headers()
    {
        var res = await _client.GetAsync("/");

        Assert.True(res.Headers.Contains("X-Content-Type-Options"));
        Assert.Equal("nosniff", res.Headers.GetValues("X-Content-Type-Options").First());
        Assert.True(res.Headers.Contains("Content-Security-Policy"));
    }
}`

export default function ToolsPageEn() {

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Security tools</h1>
<Callout type="danger">
        <strong>Ethics and the law come first.</strong> Only use security tools against software and servers that{' '}
        <strong>you own yourself</strong>, or where you have <strong>written permission</strong> from the owner. Scanning other
        people's systems can be illegal (in Denmark, e.g. section 263 of the Criminal Code on unauthorised access) and can harm third parties or
        the school's network. Test in a <em>test environment</em> with test data – not in production and not with real personal data. If in doubt:
        ask your teacher first.
      </Callout>

      <h2>Why tools?</h2>
      <p>
        You cannot review all code and all configurations manually every time something changes. Security tools find the{' '}
        <em>typical, known</em> flaws quickly, consistently and automatically – and can run in CI, so problems are detected while they are cheap to
        fix. They do not replace thinking, code review and threat modelling; they are one layer.
      </p>

      <h2>A map of tool types</h2>
      <MermaidDiagram chart={toolMap} />
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>What is tested?</th>
            <th>When?</th>
            <th>Examples</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SCA</strong> (Software Composition Analysis / dependency scanning)</td>
            <td>Third-party libraries against known vulnerabilities (CVE)</td>
            <td>Every build + weekly</td>
            <td><code>dotnet list package --vulnerable</code>, <code>npm audit</code>, Dependabot, OWASP Dependency-Check, Snyk</td>
          </tr>
          <tr>
            <td><strong>SAST</strong> (Static Application Security Testing)</td>
            <td>Your own source code – without running it</td>
            <td>On commit/PR</td>
            <td>.NET analyzers, CodeQL, SonarQube, Semgrep</td>
          </tr>
          <tr>
            <td><strong>DAST</strong> (Dynamic Application Security Testing)</td>
            <td>The running application from the outside</td>
            <td>Against a test environment after deploy</td>
            <td>OWASP ZAP, Burp Suite (commercial/community)</td>
          </tr>
          <tr>
            <td><strong>Secret scanning</strong></td>
            <td>Keys and tokens accidentally in git</td>
            <td>Pre-commit + CI</td>
            <td>GitHub secret scanning, gitleaks, trufflehog</td>
          </tr>
          <tr>
            <td><strong>Container/image scanning</strong></td>
            <td>OS packages and dependencies in Docker images</td>
            <td>After image build</td>
            <td>Trivy, Grype, Docker Scout</td>
          </tr>
          <tr>
            <td><strong>TLS/header checks</strong></td>
            <td>HTTPS configuration and security headers</td>
            <td>After changes to hosting</td>
            <td>SSL Labs, securityheaders.com, Mozilla Observatory</td>
          </tr>
        </tbody>
      </table>

      <h2>1. Dependencies: dotnet, npm and more</h2>
      <p>
        The most worthwhile first step: check whether your libraries have known vulnerabilities (OWASP A06). The commands are built into
        the tools – no installation necessary.
      </p>
      <CodeBlock language="bash">{depCommands}</CodeBlock>
      <CodeBlock language="xml">{dotnetNuGetAudit}</CodeBlock>
      <p>How to read a finding:</p>
      <ol>
        <li>Which package and which version are we using? Is it a <em>direct</em> or <em>transitive</em> dependency?</li>
        <li>What severity (CVSS) and which CVE? Look it up in NVD/GitHub Advisory.</li>
        <li>Is there a fixed version? Upgrade and run the tests.</li>
        <li>If not: can we mitigate (configuration), replace the library or document a justified exception?</li>
      </ol>
      <Callout type="warn">
        <code>npm audit fix --force</code> can introduce breaking changes. Read the changes and run your tests before you commit. Many
        findings are "noise" (e.g. dev dependencies that never run in production) – assess the risk, do not ignore blindly, and do not close everything without thought.
      </Callout>
      <p>
        <strong>OWASP Dependency-Check</strong> and <strong>Dependabot</strong> (GitHub) automate the work: Dependabot proposes pull requests with
        updates, so maintenance becomes a habit and not firefighting.
      </p>
      <CodeBlock language="bash">{owaspDc}</CodeBlock>

      <h2>2. OWASP ZAP – scanning your own web app</h2>
      <p>
        <strong>ZAP</strong> (Zed Attack Proxy) is a free, open-source tool from OWASP. It acts as a <em>proxy</em> between the browser and
        your app, so it can observe traffic, and it can also scan on its own.
      </p>
      <h3>Modes</h3>
      <table>
        <thead>
          <tr><th>Mode</th><th>What happens?</th><th>Suitable for</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Passive scanning / baseline</strong></td>
            <td>ZAP only looks at normal responses (headers, cookies, known patterns) without sending malicious requests</td>
            <td>CI, frequent runs, a first step</td>
          </tr>
          <tr>
            <td><strong>Spider / AJAX spider</strong></td>
            <td>Maps the site's URLs, including JavaScript-based ones</td>
            <td>Preparing a scan</td>
          </tr>
          <tr>
            <td><strong>Active scanning</strong></td>
            <td>Sends many test requests to find vulnerabilities – can create/change data and put load on the system</td>
            <td><strong>Only your own test environment</strong> with permission</td>
          </tr>
        </tbody>
      </table>

      <h3>Typical workflow</h3>
      <ol>
        <li>Start a test environment with test data (e.g. locally with <code>docker compose</code>).</li>
        <li>Open ZAP and enter your own test environment's URL as the target (<em>Automated Scan</em> or baseline).</li>
        <li>Review the findings (Alerts): risk (High/Medium/Low/Info), description, where and how to fix it.</li>
        <li>Assess each finding – <em>false positives</em> occur. Fix the real ones, document the rest.</li>
        <li>Run again to confirm the fix. Save the report.</li>
      </ol>
      <CodeBlock language="bash">{zapBaseline}</CodeBlock>
      <CodeBlock language="yaml">{zapCi}</CodeBlock>
      <Callout type="tip">
        If the site requires login, ZAP can be configured with a test user and token/context. Never use real user accounts, and never store
        credentials in the configuration in git – use secrets.
      </Callout>
      <Callout type="info">
        Findings in ZAP are <em>indications</em>, not verdicts. Typical results on a new SPA: missing CSP, missing anti-clickjacking header,
        cookies without <code>SameSite</code>/<code>HttpOnly</code>, server version revealed in headers. These are usually quick to fix.
      </Callout>

      <h2>3. Browser security headers – checking</h2>
      <p>
        Many vulnerabilities can be prevented or mitigated with HTTP headers. You can see them in the browser's devtools (Network → Response Headers), via{' '}
        <code>curl -I</code> or with an online tool:
      </p>
      <ul>
        <li>
          <strong>securityheaders.com</strong> – gives a grade (A+ to F) and explains each shortcoming.
        </li>
        <li>
          <strong>Mozilla Observatory</strong> – tests headers, cookies and TLS with concrete recommendations.
        </li>
        <li>
          <strong>The browser's devtools</strong> – the Security tab, Console (CSP violations), Application (cookie flags).
        </li>
      </ul>
      <table>
        <thead>
          <tr><th>Header</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td><code>Strict-Transport-Security</code></td><td>Force HTTPS (HSTS)</td></tr>
          <tr><td><code>Content-Security-Policy</code></td><td>Restrict where scripts/resources may come from (XSS defence)</td></tr>
          <tr><td><code>X-Content-Type-Options: nosniff</code></td><td>Prevents the browser from guessing the wrong content type</td></tr>
          <tr><td><code>Referrer-Policy</code></td><td>Limit which URL information leaks to other sites</td></tr>
          <tr><td><code>Permissions-Policy</code></td><td>Turn off browser features (camera, microphone, location) that the site does not use</td></tr>
          <tr><td><code>frame-ancestors</code> (CSP) / <code>X-Frame-Options</code></td><td>Protect against clickjacking</td></tr>
        </tbody>
      </table>
      <CodeBlock language="bash">{headerCheck}</CodeBlock>
      <p>Do write an automatic regression test, so a future change does not remove headers by accident:</p>
      <CodeBlock language="csharp">{securityTest}</CodeBlock>

      <h2>4. TLS testing – SSL Labs (concept)</h2>
      <p>
        <strong>SSL Labs Server Test</strong> (Qualys) analyses a publicly accessible HTTPS server and gives a grade from A+ to F
        based on, among other things:
      </p>
      <ul>
        <li>Supported protocol versions (TLS 1.0/1.1 pull the grade down; TLS 1.2/1.3 are expected).</li>
        <li>Cipher suites and forward secrecy.</li>
        <li>Certificate chain, expiry date and domain match.</li>
        <li>HSTS and known TLS vulnerabilities.</li>
      </ul>
      <p>
        Use it on <em>your own</em> public domains after hosting changes. If TLS is terminated in Cloudflare or Traefik, it is{' '}
        <em>their</em> configuration that is tested – it can be relevant to understand who controls what. Internal or local servers can be
        tested with tools such as <code>testssl.sh</code> or <code>nmap --script ssl-enum-ciphers</code> – again only on your own systems.
      </p>
      <Callout type="info">
        The SSL Labs result is guidance. An A+ does not mean the whole application is secure – it only says something about the transport layer.
      </Callout>

      <h2>5. Other useful tools</h2>
      <h3>Secret scanning</h3>
      <p>
        Keys and tokens in git are one of the most frequent mistakes. GitHub has built-in <em>secret scanning</em> and <em>push protection</em>; locally,
        gitleaks can be used. Once a secret has been committed, it must be <strong>rotated</strong> – it is not enough to delete it in a new commit.
      </p>
      <CodeBlock language="bash">{gitleaks}</CodeBlock>
      <h3>Container and image scanning</h3>
      <CodeBlock language="bash">{trivy}</CodeBlock>
      <h3>SAST – static analysis</h3>
      <p>
        .NET ships with analyzers (Roslyn), which can be turned up to <code>AnalysisMode=All</code>; <strong>CodeQL</strong> (free for
        public repos on GitHub) looks for known vulnerability patterns in the code, e.g. concatenated SQL strings. The results appear as
        warnings in pull requests.
      </p>
      <h3>Intercepting proxies and manual testing</h3>
      <p>
        Tools such as ZAP and Burp Suite let a tester see and modify HTTP traffic between browser and server – useful for understanding what your
        frontend actually sends, and for checking that the server rejects invalid calls (e.g. attempts to fetch another user's data). Here too:
        your own systems.
      </p>

      <h2>Integration in CI</h2>
      <p>
        Security tests work best when they are automatic and run on every change ("shift left"):
      </p>
      <MermaidDiagram chart={ciFlow} />
      <ul>
        <li>Start with <strong>warnings</strong>, and tighten to "fail build" on High/Critical as the noise is cleaned up.</li>
        <li>Save reports as artefacts, so findings can be documented and followed up.</li>
        <li>Run heavy scans (active ZAP) on a schedule (e.g. nightly) against a dedicated test environment, not on every commit.</li>
        <li>Assign ownership: who takes care of a finding, and within what time frame?</li>
      </ul>

      <h2>How do you work ethically and responsibly?</h2>
      <ul>
        <li><strong>Scope</strong>: write down which systems and URLs may be tested.</li>
        <li><strong>Permission</strong>: the owner's written acceptance before anything is tested that is not your own.</li>
        <li><strong>Test environment and test data</strong>: never real personal data (GDPR) and not production.</li>
        <li><strong>Least possible harm</strong>: avoid active scans that can create/delete data or bring down the service.</li>
        <li>
          <strong>Responsible disclosure</strong>: if you find a vulnerability in someone else's system by chance, contact the owner privately
          (look for <code>/.well-known/security.txt</code>) and allow time to fix it before anything is published.
        </li>
        <li><strong>Document</strong>: what was tested, when, how, what was found, what was fixed.</li>
      </ul>

      <h2>Tool selection – overview</h2>
      <table>
        <thead>
          <tr><th>I would like to…</th><th>Use</th></tr>
        </thead>
        <tbody>
          <tr><td>…know whether my NuGet packages are vulnerable</td><td><code>dotnet list package --vulnerable --include-transitive</code>, NuGetAudit</td></tr>
          <tr><td>…know whether my npm packages are vulnerable</td><td><code>npm audit</code>, Dependabot</td></tr>
          <tr><td>…get automatic update suggestions</td><td>Dependabot / Renovate</td></tr>
          <tr><td>…scan my running web app (test environment)</td><td>OWASP ZAP baseline</td></tr>
          <tr><td>…check my security headers</td><td><code>curl -I</code>, securityheaders.com, Mozilla Observatory</td></tr>
          <tr><td>…assess my TLS configuration</td><td>SSL Labs (public domains), <code>testssl.sh</code></td></tr>
          <tr><td>…find secrets in git</td><td>GitHub secret scanning, gitleaks</td></tr>
          <tr><td>…scan my Docker images</td><td>Trivy, Docker Scout</td></tr>
          <tr><td>…find vulnerable patterns in my own code</td><td>CodeQL, Roslyn analyzers, Semgrep</td></tr>
        </tbody>
      </table>

      <h2>Summary</h2>
      <ul>
        <li>Tools find known and typical flaws quickly – they are one layer, not the whole defence.</li>
        <li>Start with dependency scanning, header and TLS checks: the biggest gain for the least effort.</li>
        <li>ZAP baseline is a good, safe first DAST tool; active scanning only in your own test environment.</li>
        <li>Automate in CI, and assess the findings – false positives occur.</li>
        <li><strong>Only test your own software, or with written permission.</strong></li>
      </ul>

      <h2>Exercises</h2>
      <ol>
        <li>Run <code>dotnet list package --vulnerable --include-transitive</code> and <code>npm audit</code> on your project. Make a short action plan for the findings.</li>
        <li>Run your production/test domain through securityheaders.com and SSL Labs. Which three improvements give the most value?</li>
        <li>Start your app locally with test data and run a ZAP baseline scan. Pick two findings, assess whether they are real, and fix them.</li>
        <li>Add a security job to your CI (dependency scan + gitleaks), and make the build fail on High/Critical.</li>
        <li>Write half a page on how you ensure that you work ethically and lawfully with these tools in your team.</li>
      </ol>
    </LessonLayout>
  )
}
