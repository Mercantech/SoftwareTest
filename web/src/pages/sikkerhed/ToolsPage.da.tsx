import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const toolMap = `
flowchart LR
    subgraph K["Kode"]
        SAST["SAST - statisk analyse af egen kode"]
        SEC["Secret scanning"]
    end
    subgraph A["Afhængigheder"]
        SCA["SCA - dotnet list package, npm audit, Dependabot"]
    end
    subgraph R["Kørende app"]
        DAST["DAST - OWASP ZAP"]
        HDR["Header-checks"]
        TLS["TLS-test - SSL Labs"]
    end
    subgraph C["Container og infrastruktur"]
        IMG["Image-scanning - Trivy"]
    end
    K --> CI["CI-pipeline"]
    A --> CI
    C --> CI
    CI --> DAST
`

const ciFlow = `
sequenceDiagram
    participant Dev as Udvikler
    participant CI as CI-pipeline
    participant Test as Test-miljø
    Dev->>CI: Push / pull request
    CI->>CI: Build + enhedstest
    CI->>CI: Dependency scan, SAST og secret scan
    CI->>Test: Deploy til test-miljø
    CI->>Test: ZAP baseline scan
    Test->>CI: Rapport
    CI->>Dev: Fejl hvis alvorlige fund
`

const depCommands = `# .NET: kendte sårbarheder i NuGet-pakker (også transitive)
dotnet list package --vulnerable --include-transitive

# .NET: forældede pakker
dotnet list package --outdated

# Node/npm (frontend)
npm audit                       # rapport
npm audit --audit-level=high    # exit-kode != 0 ved high/critical (godt til CI)
npm audit fix                   # forsøger kompatible opdateringer - gennemgå diff og kør tests!`

const dotnetNuGetAudit = `<!-- .csproj: lad NuGet advare om sårbare pakker allerede ved restore/build -->
<PropertyGroup>
  <NuGetAudit>true</NuGetAudit>
  <NuGetAuditMode>all</NuGetAuditMode>      <!-- inkl. transitive afhængigheder -->
  <NuGetAuditLevel>low</NuGetAuditLevel>
  <!-- <TreatWarningsAsErrors> eller WarningsAsErrors: NU1901;NU1902;NU1903;NU1904 kan få CI til at fejle -->
</PropertyGroup>`

const owaspDc = `# OWASP Dependency-Check (kan scanne mange økosystemer mod NVD)
# Kører som CLI eller Docker - kun mod EGEN kode
docker run --rm -v "$(pwd):/src" owasp/dependency-check \\
  --scan /src --format HTML --out /src/reports --project "SoftwareTest"`

const zapBaseline = `# OWASP ZAP baseline scan: passiv scanning, ingen aktive angreb
# Kør KUN mod dit eget test-miljø (eller et system du har skriftlig tilladelse til at teste)
docker run --rm -v "$(pwd)/zap:/zap/wrk:rw" \\
  ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \\
  -t https://test.dit-eget-domæne.dk \\
  -r zap-rapport.html`

const zapCi = `# GitHub Actions: ZAP baseline mod test-miljø efter deploy
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
          target: "https://test.dit-eget-domæne.dk"   # eget miljø!
          fail_action: false                          # start med at kigge, stram senere`

const headerCheck = `# Se dine egne svar-headers (read-only HTTP-kald mod dit eget domæne)
curl -sI https://app.dit-eget-domæne.dk

# Forventede headers - eksempler:
#   Strict-Transport-Security: max-age=31536000; includeSubDomains
#   Content-Security-Policy: default-src 'self'; ...
#   X-Content-Type-Options: nosniff
#   Referrer-Policy: strict-origin-when-cross-origin
#   Permissions-Policy: camera=(), microphone=(), geolocation=()`

const trivy = `# Trivy: scan et Docker-image for kendte sårbarheder i OS-pakker og afhængigheder
trivy image mit-image:latest

# Scan filsystem/repo (afhængigheder, secrets, IaC-misconfig)
trivy fs .`

const gitleaks = `# Find ved et uheld committede secrets (API-nøgler, tokens) i repo + historik
gitleaks detect --source . --verbose`

const securityTest = `// En lille integrationstest, der håndhæver sikkerheds-headers - billig og effektiv regression
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

export default function ToolsPageDa() {

  return (
    <LessonLayout module="sikkerhed">
      <h1>
        Security tools</h1>
<Callout type="danger">
        <strong>Etik og lovgivning kommer først.</strong> Brug kun sikkerhedsværktøjer mod software og servere, som{' '}
        <strong>du selv ejer</strong>, eller hvor du har <strong>skriftlig tilladelse</strong> fra ejeren. At scanne fremmede
        systemer kan være ulovligt (i Danmark fx straffelovens §263 om uberettiget adgang) og kan skade tredjeparter eller
        skolens netværk. Test i et <em>testmiljø</em> med testdata – ikke i produktion og ikke med rigtige persondata. Er du i tvivl:
        spørg underviseren først.
      </Callout>

      <h2>Hvorfor værktøjer?</h2>
      <p>
        Man kan ikke gennemgå al kode og alle konfigurationer manuelt hver gang noget ændres. Sikkerhedsværktøjer finder de{' '}
        <em>typiske, kendte</em> fejl hurtigt, konsekvent og automatisk – og kan køre i CI, så problemer opdages, mens de er billige at
        rette. De erstatter ikke tænkning, code review og trusselsmodellering; de er et lag.
      </p>

      <h2>Landkort over værktøjstyper</h2>
      <MermaidDiagram chart={toolMap} />
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Hvad testes?</th>
            <th>Hvornår?</th>
            <th>Eksempler</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SCA</strong> (Software Composition Analysis / dependency scanning)</td>
            <td>Tredjepartsbiblioteker mod kendte sårbarheder (CVE)</td>
            <td>Hver build + ugentligt</td>
            <td><code>dotnet list package --vulnerable</code>, <code>npm audit</code>, Dependabot, OWASP Dependency-Check, Snyk</td>
          </tr>
          <tr>
            <td><strong>SAST</strong> (Static Application Security Testing)</td>
            <td>Egen kildekode – uden at køre den</td>
            <td>Ved commit/PR</td>
            <td>.NET analyzers, CodeQL, SonarQube, Semgrep</td>
          </tr>
          <tr>
            <td><strong>DAST</strong> (Dynamic Application Security Testing)</td>
            <td>Den kørende applikation udefra</td>
            <td>Mod testmiljø efter deploy</td>
            <td>OWASP ZAP, Burp Suite (kommerciel/community)</td>
          </tr>
          <tr>
            <td><strong>Secret scanning</strong></td>
            <td>Nøgler og tokens ved et uheld i git</td>
            <td>Pre-commit + CI</td>
            <td>GitHub secret scanning, gitleaks, trufflehog</td>
          </tr>
          <tr>
            <td><strong>Container-/image-scanning</strong></td>
            <td>OS-pakker og afhængigheder i Docker-images</td>
            <td>Efter image-build</td>
            <td>Trivy, Grype, Docker Scout</td>
          </tr>
          <tr>
            <td><strong>TLS-/header-tjek</strong></td>
            <td>HTTPS-konfiguration og sikkerheds-headers</td>
            <td>Efter ændringer i hosting</td>
            <td>SSL Labs, securityheaders.com, Mozilla Observatory</td>
          </tr>
        </tbody>
      </table>

      <h2>1. Afhængigheder: dotnet, npm og mere</h2>
      <p>
        Det mest lønsomme første skridt: tjek, om jeres biblioteker har kendte sårbarheder (OWASP A06). Kommandoerne er indbygget i
        værktøjerne – ingen installation nødvendig.
      </p>
      <CodeBlock language="bash">{depCommands}</CodeBlock>
      <CodeBlock language="xml">{dotnetNuGetAudit}</CodeBlock>
      <p>Sådan læser du et fund:</p>
      <ol>
        <li>Hvilken pakke og hvilken version bruger vi? Er det en <em>direkte</em> eller <em>transitiv</em> afhængighed?</li>
        <li>Hvilken alvorlighed (CVSS) og hvilken CVE? Slå den op i NVD/GitHub Advisory.</li>
        <li>Findes der en rettet version? Opgradér og kør testene.</li>
        <li>Hvis ikke: kan vi afbøde (konfiguration), udskifte biblioteket eller dokumentere en begrundet undtagelse?</li>
      </ol>
      <Callout type="warn">
        <code>npm audit fix --force</code> kan introducere brydende ændringer. Læs ændringerne og kør jeres tests, før I committer. Mange
        fund er "støj" (fx dev-afhængigheder, der aldrig kører i produktion) – vurdér risikoen, ignorér ikke blindt, og luk ikke alt uden tanke.
      </Callout>
      <p>
        <strong>OWASP Dependency-Check</strong> og <strong>Dependabot</strong> (GitHub) automatiserer arbejdet: Dependabot foreslår pull requests med
        opdateringer, så vedligehold bliver en vane og ikke en brandslukning.
      </p>
      <CodeBlock language="bash">{owaspDc}</CodeBlock>

      <h2>2. OWASP ZAP – scanning af egen webapp</h2>
      <p>
        <strong>ZAP</strong> (Zed Attack Proxy) er et gratis, open source-værktøj fra OWASP. Det fungerer som en <em>proxy</em> mellem browser og
        jeres app, så det kan observere trafik, og kan desuden scanne selv.
      </p>
      <h3>Tilstande</h3>
      <table>
        <thead>
          <tr><th>Tilstand</th><th>Hvad sker der?</th><th>Egnet til</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Passiv scanning / baseline</strong></td>
            <td>ZAP kigger kun på normale svar (headers, cookies, kendte mønstre) uden at sende ondsindede forespørgsler</td>
            <td>CI, hyppige kørsler, første skridt</td>
          </tr>
          <tr>
            <td><strong>Spider / AJAX spider</strong></td>
            <td>Kortlægger sidens URL'er, også JavaScript-baserede</td>
            <td>Forberedelse af en scanning</td>
          </tr>
          <tr>
            <td><strong>Aktiv scanning</strong></td>
            <td>Sender mange testforespørgsler for at finde sårbarheder – kan oprette/ændre data og belaste systemet</td>
            <td><strong>Kun eget testmiljø</strong> med tilladelse</td>
          </tr>
        </tbody>
      </table>

      <h3>Typisk arbejdsgang</h3>
      <ol>
        <li>Start et testmiljø med testdata (fx lokalt med <code>docker compose</code>).</li>
        <li>Åbn ZAP, og angiv dit eget testmiljøs URL som mål (<em>Automated Scan</em> eller baseline).</li>
        <li>Gennemgå fundene (Alerts): risiko (High/Medium/Low/Info), beskrivelse, hvor og hvordan det rettes.</li>
        <li>Vurdér hvert fund – der forekommer <em>falske positiver</em>. Ret de reelle, dokumentér de øvrige.</li>
        <li>Kør igen for at bekræfte rettelsen. Gem rapporten.</li>
      </ol>
      <CodeBlock language="bash">{zapBaseline}</CodeBlock>
      <CodeBlock language="yaml">{zapCi}</CodeBlock>
      <Callout type="tip">
        Hvis siden kræver login, kan ZAP konfigureres med en testbruger og token/kontekst. Brug aldrig rigtige brugerkonti, og gem aldrig
        credentials i konfigurationen i git – brug secrets.
      </Callout>
      <Callout type="info">
        Fund i ZAP er <em>indikationer</em>, ikke domme. Typiske resultater på en ny SPA: manglende CSP, manglende anti-clickjacking-header,
        cookies uden <code>SameSite</code>/<code>HttpOnly</code>, server-version afsløret i headers. Disse er oftest hurtige at rette.
      </Callout>

      <h2>3. Browser-sikkerhedsheaders – tjek</h2>
      <p>
        Mange sårbarheder kan forebygges eller afbødes med HTTP-headers. Du kan se dem i browserens devtools (Network → Response Headers), via{' '}
        <code>curl -I</code> eller med et online-værktøj:
      </p>
      <ul>
        <li>
          <strong>securityheaders.com</strong> – giver en karakter (A+ til F) og forklarer hver mangel.
        </li>
        <li>
          <strong>Mozilla Observatory</strong> – tester headers, cookies og TLS med konkrete anbefalinger.
        </li>
        <li>
          <strong>Browserens devtools</strong> – Security-fanen, Console (CSP-overtrædelser), Application (cookie-flags).
        </li>
      </ul>
      <table>
        <thead>
          <tr><th>Header</th><th>Formål</th></tr>
        </thead>
        <tbody>
          <tr><td><code>Strict-Transport-Security</code></td><td>Tving HTTPS (HSTS)</td></tr>
          <tr><td><code>Content-Security-Policy</code></td><td>Begræns hvor scripts/ressourcer må komme fra (XSS-forsvar)</td></tr>
          <tr><td><code>X-Content-Type-Options: nosniff</code></td><td>Forhindrer at browseren gætter forkert indholdstype</td></tr>
          <tr><td><code>Referrer-Policy</code></td><td>Begræn hvilke URL-oplysninger der lækkes til andre sider</td></tr>
          <tr><td><code>Permissions-Policy</code></td><td>Slå browserfunktioner fra (kamera, mikrofon, lokation), som siden ikke bruger</td></tr>
          <tr><td><code>frame-ancestors</code> (CSP) / <code>X-Frame-Options</code></td><td>Beskyt mod clickjacking</td></tr>
        </tbody>
      </table>
      <CodeBlock language="bash">{headerCheck}</CodeBlock>
      <p>Lav gerne en automatisk regressionstest, så en fremtidig ændring ikke fjerner headers ved et uheld:</p>
      <CodeBlock language="csharp">{securityTest}</CodeBlock>

      <h2>4. TLS-test – SSL Labs (koncept)</h2>
      <p>
        <strong>SSL Labs Server Test</strong> (Qualys) analyserer en offentligt tilgængelig HTTPS-server og giver en karakter fra A+ til F
        baseret på bl.a.:
      </p>
      <ul>
        <li>Understøttede protokolversioner (TLS 1.0/1.1 trækker ned; TLS 1.2/1.3 forventes).</li>
        <li>Cipher suites og forward secrecy.</li>
        <li>Certifikatkæde, udløbsdato og domænematch.</li>
        <li>HSTS og kendte TLS-sårbarheder.</li>
      </ul>
      <p>
        Brug det på <em>jeres egne</em> offentlige domæner efter hosting-ændringer. Står TLS terminert i Cloudflare eller Traefik, er det{' '}
        <em>deres</em> konfiguration, der testes – det kan være relevant at forstå, hvem der styrer hvad. Interne eller lokale servere kan
        testes med værktøjer som <code>testssl.sh</code> eller <code>nmap --script ssl-enum-ciphers</code> – igen kun på egne systemer.
      </p>
      <Callout type="info">
        SSL Labs-resultatet er en vejledning. En A+ betyder ikke, at hele applikationen er sikker – den siger kun noget om transportlaget.
      </Callout>

      <h2>5. Øvrige nyttige værktøjer</h2>
      <h3>Secret scanning</h3>
      <p>
        Nøgler og tokens i git er en af de hyppigste fejl. GitHub har indbygget <em>secret scanning</em> og <em>push protection</em>; lokalt kan
        gitleaks bruges. Er en secret først committet, skal den <strong>roteres</strong> – det er ikke nok at slette den i en ny commit.
      </p>
      <CodeBlock language="bash">{gitleaks}</CodeBlock>
      <h3>Container- og image-scanning</h3>
      <CodeBlock language="bash">{trivy}</CodeBlock>
      <h3>SAST – statisk analyse</h3>
      <p>
        .NET leveres med analyzers (Roslyn), som kan slås op til <code>AnalysisMode=All</code>; <strong>CodeQL</strong> (gratis til
        offentlige repos på GitHub) leder efter kendte sårbarhedsmønstre i koden, fx sammensatte SQL-strenge. Resultaterne vises som
        advarsler i pull requests.
      </p>
      <h3>Intercepting proxies og manuel test</h3>
      <p>
        Værktøjer som ZAP og Burp Suite lader en tester se og ændre HTTP-trafik mellem browser og server – nyttigt til at forstå, hvad jeres
        frontend egentlig sender, og til at kontrollere at serveren afviser ugyldige kald (fx forsøg på at hente en anden brugers data). Også her:
        egne systemer.
      </p>

      <h2>Integration i CI</h2>
      <p>
        Sikkerhedstests virker bedst, når de er automatiske og kører ved hver ændring ("shift left"):
      </p>
      <MermaidDiagram chart={ciFlow} />
      <ul>
        <li>Start med <strong>advarsler</strong>, og stram til "fail build" ved High/Critical, efterhånden som støj er ryddet op.</li>
        <li>Gem rapporter som artefakter, så fund kan dokumenteres og følges op.</li>
        <li>Kør tunge scanninger (aktiv ZAP) planlagt (fx natligt) mod et dedikeret testmiljø, ikke ved hver commit.</li>
        <li>Tildel ejerskab: hvem tager sig af et fund, og inden for hvilken tid?</li>
      </ul>

      <h2>Hvordan arbejder man etisk og ansvarligt?</h2>
      <ul>
        <li><strong>Scope</strong>: skriv ned hvilke systemer og URL'er, der må testes.</li>
        <li><strong>Tilladelse</strong>: ejerens skriftlige accept, før noget testes, der ikke er dit eget.</li>
        <li><strong>Testmiljø og testdata</strong>: aldrig rigtige persondata (GDPR) og ikke produktion.</li>
        <li><strong>Mindst mulig skade</strong>: undgå aktive scanninger, der kan oprette/slette data eller nedbryde tjenesten.</li>
        <li>
          <strong>Ansvarlig offentliggørelse</strong>: finder du en sårbarhed i andres system ved et tilfælde, så kontakt ejeren privat
          (kig efter <code>/.well-known/security.txt</code>) og giv tid til at rette, før noget offentliggøres.
        </li>
        <li><strong>Dokumentér</strong>: hvad blev testet, hvornår, hvordan, hvad blev fundet, hvad blev rettet.</li>
      </ul>

      <h2>Værktøjsvalg – oversigt</h2>
      <table>
        <thead>
          <tr><th>Jeg vil gerne…</th><th>Brug</th></tr>
        </thead>
        <tbody>
          <tr><td>…vide om mine NuGet-pakker er sårbare</td><td><code>dotnet list package --vulnerable --include-transitive</code>, NuGetAudit</td></tr>
          <tr><td>…vide om mine npm-pakker er sårbare</td><td><code>npm audit</code>, Dependabot</td></tr>
          <tr><td>…have automatiske opdateringsforslag</td><td>Dependabot / Renovate</td></tr>
          <tr><td>…scanne min kørende webapp (testmiljø)</td><td>OWASP ZAP baseline</td></tr>
          <tr><td>…tjekke mine sikkerheds-headers</td><td><code>curl -I</code>, securityheaders.com, Mozilla Observatory</td></tr>
          <tr><td>…vurdere min TLS-konfiguration</td><td>SSL Labs (offentlige domæner), <code>testssl.sh</code></td></tr>
          <tr><td>…finde secrets i git</td><td>GitHub secret scanning, gitleaks</td></tr>
          <tr><td>…scanne mine Docker-images</td><td>Trivy, Docker Scout</td></tr>
          <tr><td>…finde sårbare mønstre i egen kode</td><td>CodeQL, Roslyn analyzers, Semgrep</td></tr>
        </tbody>
      </table>

      <h2>Opsummering</h2>
      <ul>
        <li>Værktøjer finder kendte og typiske fejl hurtigt – de er et lag, ikke hele forsvaret.</li>
        <li>Start med dependency scanning, header- og TLS-tjek: størst gevinst for mindst indsats.</li>
        <li>ZAP baseline er et godt, sikkert første DAST-værktøj; aktiv scanning kun i eget testmiljø.</li>
        <li>Automatisér i CI, og vurdér fundene – falske positiver forekommer.</li>
        <li><strong>Test kun egen software eller med skriftlig tilladelse.</strong></li>
      </ul>

      <h2>Øvelser</h2>
      <ol>
        <li>Kør <code>dotnet list package --vulnerable --include-transitive</code> og <code>npm audit</code> på jeres projekt. Lav en kort handlingsplan for fundene.</li>
        <li>Kør jeres produktions-/testdomæne gennem securityheaders.com og SSL Labs. Hvilke tre forbedringer giver mest værdi?</li>
        <li>Start jeres app lokalt med testdata og kør en ZAP baseline scan. Vælg to fund, vurdér om de er reelle, og ret dem.</li>
        <li>Tilføj et sikkerhedsjob til jeres CI (dependency scan + gitleaks), og få bygget til at fejle ved High/Critical.</li>
        <li>Skriv en halv side om, hvordan I sikrer, at I arbejder etisk og lovligt med disse værktøjer i jeres team.</li>
      </ol>
    </LessonLayout>
  )
}
