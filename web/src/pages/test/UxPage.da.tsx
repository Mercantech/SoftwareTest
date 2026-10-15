import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const uxVsUi = `
flowchart LR
  UX["UX: hele oplevelsen"] --> UI["UI: visuelt design<br/>farver, knapper, layout"]
  UX --> IA["Informationsarkitektur"]
  UX --> INT["Interaktion og flow"]
  UX --> PERF["Opfattet hastighed"]
  UX --> ACC["Tilgængelighed"]
  UX --> CONT["Indhold og sprog"]
  UX --> EMO["Følelser og tillid"]
`

const uxTestMap = `
flowchart TD
  Q{"Hvad vil du vide?"} -->|"Hvorfor har brugerne problemer?"| UT["Usability test<br/>kvalitativ, 5 brugere"]
  Q -->|"Hvad er galt på siden?"| HE["Heuristisk evaluering<br/>eksperter, hurtigt og billigt"]
  Q -->|"Hvilken version virker bedst?"| AB["A/B-test<br/>kvantitativ, mange brugere"]
  Q -->|"Kan alle bruge det?"| AC["Tilgængelighedstest<br/>WCAG, skærmlæser, tastatur"]
  Q -->|"Hvordan tænker de om indhold?"| CS["Card sorting / tree test"]
  Q -->|"Hvordan bruges det i virkeligheden?"| AN["Analytics, heatmaps, session replay"]
`

const usabilityProcess = `
flowchart LR
  A["Mål og hypoteser"] --> B["Rekruttér deltagere<br/>målgruppen"]
  B --> C["Skriv opgaver<br/>scenarier"]
  C --> D["Pilottest"]
  D --> E["Gennemfør sessioner<br/>think-aloud"]
  E --> F["Notér problemer<br/>alvorlighed"]
  F --> G["Prioritér og rapportér"]
  G --> H["Redesign og test igen"]
`

const abFlow = `
flowchart TD
  U["Besøgende"] --> R{"Tilfældig fordeling<br/>50/50"}
  R --> A["Variant A<br/>kontrol"]
  R --> B["Variant B<br/>udfordrer"]
  A --> MA["Konvertering A"]
  B --> MB["Konvertering B"]
  MA --> S{"Statistisk signifikans<br/>og praktisk effekt?"}
  MB --> S
  S -->|Ja| W["Rul vinderen ud"]
  S -->|Nej| N["Mere data eller nyt design"]
`

const abCode = `
// Deterministisk fordeling: samme bruger får altid samme variant
public static class Experiment
{
    public static string Variant(Guid userId, string experimentName)
    {
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(userId + ":" + experimentName));
        return hash[0] % 2 == 0 ? "A" : "B";
    }
}

// Log eksponering og konvertering, så du kan analysere bagefter
logger.LogInformation("experiment={Name} variant={Variant} user={User} event={Event}",
    "checkout-button", variant, userId, "purchase_completed");
`

const sampleSize = `
// Tommelfingerregel for antal besøgende pr. variant
// n ≈ 16 * p * (1 - p) / delta^2     (ca. 80 % power, 5 % signifikans)
//
// Eksempel: konvertering p = 5 %, ønsker at opdage forbedring delta = 1 procentpoint
// n ≈ 16 * 0.05 * 0.95 / 0.01^2  = 7 600 besøgende pr. variant
`

const a11yTest = `
// Automatisk tilgængelighedstest med Playwright + axe-core (JavaScript/TypeScript)
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('forsiden har ingen kritiske tilgængelighedsfejl', async ({ page }) => {
  await page.goto('https://staging.example.dk/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('login kan gennemføres kun med tastatur', async ({ page }) => {
  await page.goto('https://staging.example.dk/login');
  await page.keyboard.press('Tab');                 // fokus på email
  await page.keyboard.type('anna@test.dk');
  await page.keyboard.press('Tab');                 // fokus på kodeord
  await page.keyboard.type('Hemmelig123!');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/dashboard/);
});
`

const htmlGood = `
<!-- Tilgængelig formular: label, fejlbesked og fokus -->
<form novalidate>
  <label for="email">E-mail</label>
  <input id="email" name="email" type="email" autocomplete="email"
         aria-describedby="email-fejl" aria-invalid="true" required />
  <p id="email-fejl" role="alert">Indtast en gyldig e-mail, fx anna@test.dk</p>

  <button type="submit">Log ind</button>
</form>

<!-- Dårligt: ingen label, kun farve signalerer fejl, klikbart div -->
<!-- <input placeholder="E-mail" style="border:1px solid red"> -->
<!-- <div onclick="login()">Log ind</div> -->
`

const lighthouseCmd = `
# Lighthouse (indbygget i Chrome DevTools) - performance, tilgængelighed, best practices, SEO
npx lighthouse https://staging.example.dk --only-categories=accessibility,performance --view

# I CI: fejl hvis tilgængelighedsscore er for lav
npx lhci autorun --assert.assertions.categories:accessibility=error
`

const sus = `
System Usability Scale (SUS) - 10 udsagn, svar 1 (helt uenig) til 5 (helt enig)

1.  Jeg kunne tænke mig at bruge systemet ofte.
2.  Jeg synes, systemet er unødvendigt komplekst.
3.  Jeg synes, systemet er let at bruge.
4.  Jeg tror, jeg har brug for teknisk hjælp for at bruge det.
5.  Funktionerne i systemet er godt integrerede.
6.  Jeg synes, der er for meget inkonsistens i systemet.
7.  De fleste vil hurtigt lære at bruge systemet.
8.  Jeg synes, systemet er meget besværligt at bruge.
9.  Jeg følte mig sikker ved brug af systemet.
10. Jeg skulle lære meget, før jeg kunne komme i gang.

Beregning: ulige udsagn: (svar - 1), lige udsagn: (5 - svar). Summér alle og gang med 2,5.
Score 0-100.  Gennemsnit ca. 68.  > 80 = fremragende.  < 50 = alvorlige problemer.
`

export default function UxPageDa() {

  return (
    <LessonLayout module="test">

<h1>UX-test: kundeoplevelsen</h1>

      <p>
        Et system kan bestå alle funktionstests, have fremragende performance og
        alligevel <strong>fejle hos brugerne</strong>: de forstår ikke, hvor de skal
        klikke, opgiver købet, eller kan slet ikke bruge løsningen. UX-test (User
        Experience) undersøger oplevelsen — ikke kun om funktionerne virker, men om
        mennesker <em>kan, vil og kan lide</em> at bruge dem.
      </p>

      <h2>Læringsmål</h2>
      <ul>
        <li>Redegøre for forskellen på UX og UI og på UX-test og funktionel test.</li>
        <li>Planlægge og gennemføre en usability-test med think-aloud.</li>
        <li>Udføre en heuristisk evaluering efter Nielsens 10 heuristikker.</li>
        <li>Forklare A/B-test og hvornår resultater er troværdige.</li>
        <li>Anvende grundlæggende tilgængelighedsprincipper (WCAG) og simple tests.</li>
        <li>Vælge den rette UX-testmetode til et givet spørgsmål.</li>
      </ul>

      <h2>1. UX vs. UI — og UX-test vs. UI-test</h2>
      <MermaidDiagram chart={uxVsUi} />
      <p>
        <strong>UI</strong> (User Interface) er det, brugeren ser og rører ved: knapper,
        farver, typografi, layout. <strong>UX</strong> er den samlede oplevelse over tid:
        fra første indtryk til opgaven er løst — inklusive hastighed, tillid, sprog og
        følelser.
      </p>

      <Callout type="warn">
        <strong>Forveksl ikke begreberne &ldquo;UI-test&rdquo; og &ldquo;UX-test&rdquo;.</strong>{' '}
        I software-test betyder <em>UI-test</em> ofte en <em>automatiseret test af
        brugergrænsefladen</em> (fx Playwright/Selenium klikker rundt og tjekker, at
        elementer findes). <em>UX-test</em> er en <em>menneskelig evaluering</em> af, om
        løsningen er forståelig og effektiv.
      </Callout>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>UI-test (automatiseret)</th>
            <th>UX-test (brugerorienteret)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Spørgsmål</td>
            <td>&ldquo;Virker knappen og viser siden den rigtige tekst?&rdquo;</td>
            <td>&ldquo;Forstår brugeren, hvad knappen gør, og når de deres mål?&rdquo;</td>
          </tr>
          <tr>
            <td>Udføres af</td>
            <td>Scripts (Playwright, Cypress, Selenium)</td>
            <td>Rigtige brugere, designere, UX-forskere</td>
          </tr>
          <tr>
            <td>Resultat</td>
            <td>Bestået/fejlet</td>
            <td>Indsigt, problemer med alvorlighed, scores (fx SUS)</td>
          </tr>
          <tr>
            <td>Finder</td>
            <td>Regressionsfejl i UI</td>
            <td>Forvirrende flows, uforståelige tekster, barrierer</td>
          </tr>
          <tr>
            <td>Kan automatiseres?</td>
            <td>Ja</td>
            <td>Kun delvist (analytics, tilgængelighedstjek)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Funktionstest (se <Link to="/test/oversigt">Oversigt</Link> og{' '}
        <Link to="/test/metodikker">Metodikker</Link>) beviser, at systemet gør det,
        kravene siger. UX-test undersøger, om kravene overhovedet var de rigtige — og om
        løsningen er brugbar for de faktiske brugere.
      </p>

      <h2>2. Metoder — hvad skal vi bruge hvornår?</h2>
      <MermaidDiagram chart={uxTestMap} />
      <table>
        <thead>
          <tr>
            <th>Metode</th>
            <th>Kvalitativ/kvantitativ</th>
            <th>Hvornår</th>
            <th>Omkostning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Heuristisk evaluering</td>
            <td>Kvalitativ (ekspert)</td>
            <td>Tidligt, på prototyper og eksisterende sites</td>
            <td>Lav</td>
          </tr>
          <tr>
            <td>Usability-test</td>
            <td>Kvalitativ</td>
            <td>Løbende i design og før release</td>
            <td>Middel</td>
          </tr>
          <tr>
            <td>A/B-test</td>
            <td>Kvantitativ</td>
            <td>Når systemet er live med nok trafik</td>
            <td>Middel (kræver trafik/analytics)</td>
          </tr>
          <tr>
            <td>Tilgængelighedstest</td>
            <td>Begge</td>
            <td>Hele vejen — automatisk i CI + manuel</td>
            <td>Lav–middel</td>
          </tr>
          <tr>
            <td>Spørgeskema (SUS, NPS, CSAT)</td>
            <td>Kvantitativ</td>
            <td>Efter usability-test eller i produktion</td>
            <td>Lav</td>
          </tr>
          <tr>
            <td>Card sorting / tree testing</td>
            <td>Begge</td>
            <td>Design af navigation og informationsarkitektur</td>
            <td>Lav</td>
          </tr>
          <tr>
            <td>Analytics / heatmaps / session replay</td>
            <td>Kvantitativ</td>
            <td>Produktion: hvor hopper brugerne fra?</td>
            <td>Lav</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Usability-test</h2>
      <p>
        I en usability-test får <strong>repræsentative brugere</strong> opgaver at løse i
        løsningen, mens du observerer. Du tester <em>systemet</em>, ikke brugeren — hvis
        brugeren fejler, er det designets fejl.
      </p>
      <MermaidDiagram chart={usabilityProcess} />

      <h3>Vigtige elementer</h3>
      <ul>
        <li>
          <strong>Deltagere:</strong> 5 brugere afslører ca. 85 % af de største problemer
          (Nielsen). Kør hellere flere små runder end én stor. Rekruttér fra målgruppen —
          ikke kollegaer.
        </li>
        <li>
          <strong>Opgaver som scenarier:</strong> &ldquo;Du skal bruge en ny jakke til
          vinteren og vil betale max 800 kr. Find en og køb den.&rdquo; — ikke &ldquo;Klik på
          Tilføj til kurv&rdquo; (det leder brugeren).
        </li>
        <li>
          <strong>Think-aloud:</strong> deltageren siger højt, hvad de tænker og forventer.
        </li>
        <li>
          <strong>Facilitator:</strong> neutral. Hjælp ikke. Spørg &ldquo;Hvad ville du gøre nu?&rdquo;.
        </li>
        <li>
          <strong>Moderated vs. unmoderated</strong> og <strong>remote vs. in person</strong>:
          afvej dybde mod skala og pris.
        </li>
        <li>
          <strong>Samtykke og GDPR:</strong> informér om optagelse, anonymisér, gem
          sikkert.
        </li>
      </ul>

      <h3>Målinger</h3>
      <table>
        <thead>
          <tr>
            <th>Måling</th>
            <th>Forklaring</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Task success rate</td>
            <td>Andel der gennemfører opgaven (effektivitet)</td>
          </tr>
          <tr>
            <td>Time on task</td>
            <td>Hvor lang tid det tager (effektivitet)</td>
          </tr>
          <tr>
            <td>Fejl og omveje</td>
            <td>Antal forkerte klik, tilbage-knap, hjælp-søgning</td>
          </tr>
          <tr>
            <td>Tilfredshed</td>
            <td>SUS, SEQ (Single Ease Question), NPS</td>
          </tr>
          <tr>
            <td>Alvorlighed pr. problem</td>
            <td>0 = ikke et problem … 4 = katastrofe (Nielsens skala)</td>
          </tr>
        </tbody>
      </table>
      <p>
        ISO 9241-11 definerer usability som <strong>effektivitet, produktivitet og
        tilfredshed</strong> i en given brugskontekst — det er de tre ting, du måler.
      </p>
      <CodeBlock language="text">{sus}</CodeBlock>

      <h2>4. Heuristisk evaluering (Nielsens 10 heuristikker)</h2>
      <p>
        1–5 eksperter gennemgår grænsefladen uafhængigt og vurderer den mod anerkendte
        tommelfingerregler. Hurtig og billig — men finder <em>formodede</em> problemer;
        den erstatter ikke tests med rigtige brugere.
      </p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Heuristik</th>
            <th>Eksempel på overtrædelse</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Synlig systemstatus</td>
            <td>Ingen spinner/feedback efter klik på &ldquo;Betal&rdquo;</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Match mellem system og den virkelige verden</td>
            <td>Fejlkode &ldquo;ERR 0x80004005&rdquo; i stedet for forståeligt sprog</td>
          </tr>
          <tr>
            <td>3</td>
            <td>Brugerkontrol og frihed</td>
            <td>Ingen fortryd/annuller; kan ikke komme tilbage fra et trin</td>
          </tr>
          <tr>
            <td>4</td>
            <td>Konsistens og standarder</td>
            <td>&ldquo;Gem&rdquo; hedder tre forskellige ting på tre sider</td>
          </tr>
          <tr>
            <td>5</td>
            <td>Fejlforebyggelse</td>
            <td>Slet-knap uden bekræftelse placeret ved siden af &ldquo;Gem&rdquo;</td>
          </tr>
          <tr>
            <td>6</td>
            <td>Genkendelse frem for erindring</td>
            <td>Bruger skal huske kode fra forrige side</td>
          </tr>
          <tr>
            <td>7</td>
            <td>Fleksibilitet og effektivitet</td>
            <td>Ingen genveje eller autoudfyld for erfarne brugere</td>
          </tr>
          <tr>
            <td>8</td>
            <td>Æstetisk og minimalistisk design</td>
            <td>Skærm med 40 lige vigtige elementer</td>
          </tr>
          <tr>
            <td>9</td>
            <td>Hjælp brugere med at genkende, diagnosticere og rette fejl</td>
            <td>&ldquo;Noget gik galt&rdquo; uden forklaring eller løsning</td>
          </tr>
          <tr>
            <td>10</td>
            <td>Hjælp og dokumentation</td>
            <td>Ingen kontekstuel hjælp eller FAQ</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Fremgangsmåde:</strong> definér scenarier → hver evaluator gennemgår
        alene og noterer problemer (hvilken heuristik, hvor, alvorlighed) → samlet
        gennemgang og prioritering → rapport med anbefalinger.
      </p>

      <h2>5. A/B-test</h2>
      <p>
        Sammenlign to (eller flere) varianter ved at vise dem til tilfældige, ens fordelte
        grupper af rigtige brugere og måle en <strong>forretningsmetrik</strong> (fx
        konvertering, klik, tid på opgave). Det er et kontrolleret eksperiment og kan
        dokumentere <em>effekt</em> — men ikke <em>hvorfor</em>.
      </p>
      <MermaidDiagram chart={abFlow} />
      <CodeBlock language="csharp">{abCode}</CodeBlock>
      <h3>Sådan undgår du fejlslutninger</h3>
      <ul>
        <li>
          Definér <strong>hypotese og primær metrik</strong> før testen starter.
        </li>
        <li>
          Beregn <strong>stikprøvestørrelse</strong> på forhånd og &ldquo;kig&rdquo; ikke
          efter tidlig sejr (peeking øger falske positive).
        </li>
        <li>
          Kør længe nok til at dække hele uger (adfærd varierer med ugedag).
        </li>
        <li>Skift kun <strong>én ting ad gangen</strong>, ellers ved du ikke hvad der virkede.</li>
        <li>
          Tjek <strong>guardrail-metrikker</strong> (fx retur-rate, supporthenvendelser) så
          du ikke øger konvertering på bekostning af kvalitet.
        </li>
        <li>
          Statistisk signifikans ≠ praktisk betydning: 0,1 % forbedring kan være værdiløs.
        </li>
        <li>Etik: undgå manipulerende &ldquo;dark patterns&rdquo;.</li>
      </ul>
      <CodeBlock language="text">{sampleSize}</CodeBlock>

      <h2>6. Tilgængelighed (accessibility, a11y)</h2>
      <p>
        Tilgængelighed betyder, at <strong>alle</strong> kan bruge løsningen — herunder
        blinde, svagsynede, farveblinde, døve, motorisk handicappede og kognitivt
        udfordrede. Det er også lovkrav for offentlige sites i EU (Web Accessibility
        Directive) og fra 2025 mange private tjenester (European Accessibility Act).
        Standarden hedder <strong>WCAG</strong> (Web Content Accessibility Guidelines).
      </p>
      <h3>POUR-principperne</h3>
      <ul>
        <li>
          <strong>Perceivable (Mulig at opfatte):</strong> alternative tekster til
          billeder, undertekster, tilstrækkelig kontrast (min. 4,5:1 for normal tekst).
        </li>
        <li>
          <strong>Operable (Mulig at betjene):</strong> alt kan bruges med tastatur,
          synlig fokusmarkering, ingen tidsfælder, ingen blink.
        </li>
        <li>
          <strong>Understandable (Forståelig):</strong> klart sprog, forudsigelig
          navigation, hjælpsomme fejlbeskeder.
        </li>
        <li>
          <strong>Robust:</strong> korrekt, semantisk HTML og ARIA, så skærmlæsere og
          andre hjælpemidler kan fortolke siden.
        </li>
      </ul>
      <CodeBlock language="html">{htmlGood}</CodeBlock>

      <h3>Sådan tester du tilgængelighed</h3>
      <ol>
        <li>
          <strong>Automatisk:</strong> axe-core, Lighthouse, WAVE finder ca. 30–40 % af
          problemerne (manglende alt-tekst, kontrast, labels).
        </li>
        <li>
          <strong>Tastatur:</strong> kan du udføre alle flows med kun Tab, Shift+Tab, Enter,
          mellemrum og piletaster? Er fokus altid synligt?
        </li>
        <li>
          <strong>Skærmlæser:</strong> prøv NVDA (Windows), VoiceOver (macOS/iOS) eller
          TalkBack (Android). Giver siden mening, når den læses op?
        </li>
        <li>
          <strong>Zoom og responsivitet:</strong> 200 % zoom og små skærme uden at miste
          indhold.
        </li>
        <li>
          <strong>Brugere med handicap:</strong> den mest værdifulde test.
        </li>
      </ol>
      <CodeBlock language="javascript">{a11yTest}</CodeBlock>
      <CodeBlock language="bash">{lighthouseCmd}</CodeBlock>

      <Callout type="tip">
        Kombinér UI-automatisering og UX: lad Playwright/axe køre i CI og fange
        regressioner i tilgængelighed, og hold regelmæssige menneskelige usability-tests
        for det, scripts ikke kan se. Se <Link to="/test/ci-cd">CI/CD</Link>.
      </Callout>

      <h2>7. UX-tests og sikkerhed</h2>
      <p>
        UX og sikkerhed er ofte i spænd — men dårlig UX kan <em>skabe</em> usikkerhed.
        Hvis password-regler er uforståelige, skriver brugere kodeordet på en post-it. Test
        derfor også sikkerhedsflows (login, MFA, glemt kodeord) med rigtige brugere. Læs
        mere om <Link to="/sikkerhed/authentication">Authentication</Link>.
      </p>

      <h2>8. Opfattet performance</h2>
      <p>
        UX handler også om <em>opfattet</em> hastighed: skeleton screens, optimistiske
        opdateringer og progress-indikatorer får ventetid til at føles kortere. Kombinér
        med reelle målinger (Core Web Vitals: LCP, INP, CLS) fra{' '}
        <Link to="/test/performance">Performance</Link>.
      </p>

      <h2>Øvelse</h2>
      <ol>
        <li>
          Vælg en webapp (din egen eller en kendt). Udfør en <strong>heuristisk
          evaluering</strong> mod Nielsens 10 heuristikker: find mindst 8 problemer og
          giv hver en alvorlighed 0–4.
        </li>
        <li>
          Skriv 3 opgavescenarier. Gennemfør en usability-test med 3–5 personer med
          think-aloud. Notér task success, tid og problemer.
        </li>
        <li>
          Beregn en SUS-score ud fra deltagernes svar. Hvad fortæller den?
        </li>
        <li>
          Kør Lighthouse og axe på appen. Ret de tre vigtigste tilgængelighedsfejl og mål
          igen.
        </li>
        <li>
          Design et A/B-eksperiment: hypotese, metrik, varianter og estimeret
          stikprøvestørrelse.
        </li>
        <li>
          Skriv en kort rapport: hvad var forskellen på det, UX-testen afslørede, og det
          jeres funktionstests allerede dækkede?
        </li>
      </ol>
    </LessonLayout>
  )
}
