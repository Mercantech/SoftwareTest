import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const rolesChart = `
flowchart TB
  DS["Den registrerede<br/>personen hvis data det er"]
  DA["Dataansvarlig<br/>bestemmer formål og midler"]
  DB["Databehandler<br/>behandler data på vegne af dataansvarlig"]
  DPO["DPO / databeskyttelsesrådgiver<br/>rådgiver og fører tilsyn"]
  TIL["Datatilsynet<br/>tilsynsmyndighed"]

  DS -->|"rettigheder: indsigt, sletning, indsigelse …"| DA
  DA -->|"databehandleraftale"| DB
  DA -->|"rådgivning / tilsyn"| DPO
  DS -->|"klage"| TIL
  TIL -->|"kontrol og sanktioner"| DA
`

const consentFlow = `
flowchart LR
  A["Bruger lander på siden"] --> B{"Er der kun<br/>nødvendige cookies?"}
  B -->|Ja| C["Ingen banner krævet<br/>informér i politik"]
  B -->|Nej| D["Cookie-banner<br/>før ikke-nødvendige cookies"]
  D --> E{"Bruger vælger"}
  E -->|Afvis| F["Kun nødvendige<br/>ingen tracking"]
  E -->|Tilpas| G["Kategorier on/off<br/>gem præference"]
  E -->|Acceptér alle| H["Funktionelle + statistik<br/>+ marketing efter valg"]
  F --> I["Politik + indstillinger<br/>altid tilgængelige"]
  G --> I
  H --> I
`

const policyMap = `
flowchart TB
  subgraph site["Hjemmeside – synlige GDPR-flader"]
    B["Cookie-banner<br/>første besøg"]
    F["Footer-links<br/>Privatliv · Cookies · Kontakt"]
    S["Indstillinger<br/>ændr samtykke senere"]
    P["Privatlivspolitik<br/>fuld tekst"]
    C["Cookiepolitik<br/>eller afsnit i privatliv"]
  end
  B --> P
  B --> C
  F --> P
  F --> C
  F --> S
  S --> B
`

export default function GdprPageDa() {
  return (
    <LessonLayout module="sikkerhed">
      <h1>GDPR, dataansvar og cookies</h1>
      <p>
        <em>Tværgående emne:</em> Persondata og samtykke hører med, når I bygger webapps – også når der ikke står
        &ldquo;GDPR&rdquo; i målpindene.
      </p>
<Callout type="info">
        Denne lektion er <strong>undervisning</strong>, ikke juridisk rådgivning. Ved tvivl om jeres konkrete løsning:
        spørg underviser, virksomhedens DPO eller Datatilsynet. Officiel vejledning:{' '}
        <a href="https://www.datatilsynet.dk/" target="_blank" rel="noreferrer">
          datatilsynet.dk
        </a>
        .
      </Callout>

      <h2>1. Hvad er GDPR – og hvorfor skal udviklere kende det?</h2>
      <p>
        <strong>GDPR</strong> (General Data Protection Regulation / databeskyttelsesforordningen) er EU-reglerne for
        behandling af <strong>personoplysninger</strong>. I Danmark suppleres den af databeskyttelsesloven. Reglerne
        gælder, når I behandle data om identificerbare personer – fx navn, e-mail, IP-adresse, login-ID, cookies der
        følger brugeren, eller billeder.
      </p>
      <p>Som udvikler påvirker GDPR jeres arbejde direkte:</p>
      <ul>
        <li>Hvilke felter I gemmer i databasen, og hvor længe</li>
        <li>Om I må bruge analytics, chatwidgets og marketing-pixels</li>
        <li>Hvordan login, logs og backups håndterer persondata</li>
        <li>Om I har databehandleraftaler med cloud, e-mail og hosting</li>
        <li>Om samtykke, cookie-banner og privatlivspolitik er ærlige og teknisk korrekte</li>
      </ul>

      <h2>2. Roller: dataansvarlig, databehandler og flere</h2>
      <MermaidDiagram chart={rolesChart} />

      <table>
        <thead>
          <tr>
            <th>Rolle</th>
            <th>Hvem?</th>
            <th>Typisk ansvar</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Dataansvarlig</strong>
            </td>
            <td>Virksomheden / skolen / app-ejeren der bestemmer <em>hvorfor</em> og <em>hvordan</em></td>
            <td>
              Formål, retsgrundlag, oplysning til brugere, rettigheder, sikkerhed, valg af databehandlere, anmeldelse
              ved brud
            </td>
          </tr>
          <tr>
            <td>
              <strong>Fælles dataansvarlige</strong>
            </td>
            <td>To parter bestemmer formål/midler sammen</td>
            <td>Skal aftale, hvem der gør hvad over for den registrerede</td>
          </tr>
          <tr>
            <td>
              <strong>Databehandler</strong>
            </td>
            <td>Leverandør der behandler data <em>på vegne af</em> dataansvarlig (hosting, e-mail, CRM, analytics)</td>
            <td>
              Kun følge instruks, have databehandleraftale (DPA), sikre data, hjælpe ved indsigt/sletning/brud
            </td>
          </tr>
          <tr>
            <td>
              <strong>Den registrerede</strong>
            </td>
            <td>Personen dataene handler om</td>
            <td>Har rettigheder (indsigt, berigtigelse, sletning, begrænsning, dataportabilitet, indsigelse …)</td>
          </tr>
          <tr>
            <td>
              <strong>DPO</strong>
            </td>
            <td>Databeskyttelsesrådgiver (påkrævet i nogle organisationer)</td>
            <td>Rådgiver, overvåger overholdelse, kontaktpunkt til Datatilsynet</td>
          </tr>
          <tr>
            <td>
              <strong>Datatilsynet</strong>
            </td>
            <td>Dansk tilsynsmyndighed</td>
            <td>Vejledning, tilsyn, påbud og bøder</td>
          </tr>
        </tbody>
      </table>

      <Callout type="warn">
        <strong>Klassisk fejl:</strong> At tro &ldquo;vi bruger bare Stripe / Cloudflare / Google Analytics, så er det
        deres problem&rdquo;. Ofte er <em>I</em> dataansvarlige for jeres app, og leverandøren er databehandler – eller I
        er begge ansvarlige på hver jeres måde. Det skal afklares og dokumenteres.
      </Callout>

      <h3>Dataansvarlig i praksis</h3>
      <p>Den dataansvarlige skal blandt andet kunne svare på:</p>
      <ul>
        <li>
          <strong>Hvad</strong> behandler vi? (kategorier af data)
        </li>
        <li>
          <strong>Hvorfor</strong>? (formål)
        </li>
        <li>
          <strong>På hvilket retsgrundlag</strong>? (samtykke, kontrakt, legitim interesse, lovpligt …)
        </li>
        <li>
          <strong>Hvor længe</strong> gemmer vi det?
        </li>
        <li>
          <strong>Hvem</strong> har adgang – inkl. underdatabehandlere og lande uden for EU/EØS?
        </li>
        <li>
          <strong>Hvordan</strong> kan brugeren udøve sine rettigheder?
        </li>
      </ul>
      <p>
        Mange organisationer fører en <strong>fortegnelse</strong> (artikel 30) over behandlingsaktiviteter. Som
        udvikler bidrager I med teknisk sandhed: hvilke tabeller, logs, cookies og integrationer der faktisk findes.
      </p>

      <h2>3. De syv grundprincipper</h2>
      <table>
        <thead>
          <tr>
            <th>Princip</th>
            <th>Betydning for en webapp</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Lovlighed, rimelighed, gennemsigtighed</td>
            <td>Klar politik, ærlige formål, intet skjult tracking</td>
          </tr>
          <tr>
            <td>Formålsbegrænsning</td>
            <td>Data indsamlet til login må ikke frit genbruges til reklame uden nyt grundlag</td>
          </tr>
          <tr>
            <td>Dataminimering</td>
            <td>Spørg kun om felter I har brug for – ikke &ldquo;nice to have&rdquo;-profiler</td>
          </tr>
          <tr>
            <td>Rigtighed</td>
            <td>Brugere skal kunne rette forkerte oplysninger</td>
          </tr>
          <tr>
            <td>Opbevaringsbegrænsning</td>
            <td>Slette-/retention-politik for konti, logs og backups</td>
          </tr>
          <tr>
            <td>Integritet og fortrolighed</td>
            <td>Adgangskontrol, kryptering, hashing, mindst privilegium</td>
          </tr>
          <tr>
            <td>Ansvarlighed</td>
            <td>I skal kunne <em>vise</em>, at I overholder reglerne (dokumentation, aftaler, logs af samtykke)</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Retsgrundlag – må vi behandle dataene?</h2>
      <p>Uden et gyldigt retsgrundlag må I ikke behandle personoplysninger. De mest almindelige i webapps:</p>
      <ul>
        <li>
          <strong>Kontrakt</strong> – nødvendigt for at levere tjenesten (fx oprette konto, sende ordrebekræftelse)
        </li>
        <li>
          <strong>Samtykke</strong> – frivilligt, specifikt, informeret og utvetydigt (og nemt at trække tilbage)
        </li>
        <li>
          <strong>Legitim interesse</strong> – kræver interesseafvejning; egner sig sjældent til tung marketing alene
        </li>
        <li>
          <strong>Retlig forpligtelse</strong> – fx bogføringsloven for fakturaer
        </li>
        <li>
          <strong>Vital interesse / offentlig myndighed</strong> – sjældnere i almindelige skoleprojekter
        </li>
      </ul>
      <Callout type="tip">
        <strong>Nødvendige cookies</strong> til login-session eller load balancing kræver typisk ikke samtykke, men I
        skal stadig informere. Statistik- og marketing-cookies kræver som udgangspunkt <strong>forudgående
        samtykke</strong> (ePrivacy / cookie-regler + GDPR).
      </Callout>

      <h2>5. Den registreredes rettigheder</h2>
      <p>Brugeren skal i praksis kunne:</p>
      <ul>
        <li>
          <strong>Få indsigt</strong> – hvad har I om mig?
        </li>
        <li>
          <strong>Få rettet</strong> forkerte data
        </li>
        <li>
          <strong>Blive glemt</strong> (sletning) – med lovlige undtagelser
        </li>
        <li>
          <strong>Begrænse</strong> behandling midlertidigt
        </li>
        <li>
          <strong>Få data med</strong> (dataportabilitet) i et almindeligt format
        </li>
        <li>
          <strong>Gøre indsigelse</strong> – fx mod direkte markedsføring
        </li>
        <li>
          <strong>Trække samtykke tilbage</strong> lige så nemt, som det blev givet
        </li>
      </ul>
      <p>
        For udviklere betyder det: design &ldquo;export my data&rdquo; og &ldquo;delete account&rdquo;, husk
        soft-delete vs. hard-delete, logs og backups, og at tredjepartssystemer også skal slettes.
      </p>

      <h2>6. Cookies: kategorier og samtykkeflow</h2>
      <MermaidDiagram chart={consentFlow} />

      <table>
        <thead>
          <tr>
            <th>Kategori</th>
            <th>Eksempel</th>
            <th>Samtykke?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Nødvendige / strengt nødvendige</strong>
            </td>
            <td>Session-cookie til login, CSRF-token, indkøbskurv, load balancer</td>
            <td>Nej (men oplys om dem)</td>
          </tr>
          <tr>
            <td>
              <strong>Funktionelle / præference</strong>
            </td>
            <td>Sprogvalg, tema (lys/mørk) gemt på tværs af sessioner</td>
            <td>Ofte ja – afhænger af, om de er nødvendige for en tjeneste brugeren eksplicit beder om</td>
          </tr>
          <tr>
            <td>
              <strong>Statistik / analytics</strong>
            </td>
            <td>Google Analytics, Plausible med cookies, heatmaps</td>
            <td>Som udgangspunkt ja, før scriptet sættes</td>
          </tr>
          <tr>
            <td>
              <strong>Marketing / tracking</strong>
            </td>
            <td>Facebook Pixel, retargeting, reklame-ID</td>
            <td>Ja – og afvis skal være lige så nem som accept</td>
          </tr>
        </tbody>
      </table>

      <Callout type="danger">
        <strong>Mørke mønstre er ikke OK.</strong> &ldquo;Acceptér alle&rdquo; i stor grøn knap og &ldquo;Afvis&rdquo;
        skjult bag tre klik, pre-tjekkede marketing-bokse, eller at trackere kører <em>før</em> valg, bryder ånden i
        reglerne og kan føre til påtaler. Lige valgmuligheder, ægte opt-in, og mulighed for at ændre valg senere.
      </Callout>

      <h2>7. Overblik: hvordan ser god cookie-/GDPR-politik ud på en hjemmeside?</h2>
      <MermaidDiagram chart={policyMap} />

      <h3>7.1 De synlige flader (UX)</h3>
      <div className="gdpr-wireframe" aria-hidden="true">
        <div className="gdpr-wireframe__browser">
          <div className="gdpr-wireframe__chrome">
            <span />
            <span />
            <span />
            <div className="gdpr-wireframe__url">https://eksempel.dk</div>
          </div>
          <div className="gdpr-wireframe__page">
            <div className="gdpr-wireframe__nav">Logo · Menu · Login</div>
            <div className="gdpr-wireframe__hero">Indhold / produkt</div>
            <div className="gdpr-wireframe__banner">
              <strong>Cookie-banner</strong>
              <p>Kort tekst + link til politik. Knapper: Afvis · Tilpas · Acceptér</p>
              <div className="gdpr-wireframe__actions">
                <span className="gdpr-wireframe__btn gdpr-wireframe__btn--ghost">Afvis</span>
                <span className="gdpr-wireframe__btn gdpr-wireframe__btn--ghost">Tilpas</span>
                <span className="gdpr-wireframe__btn">Acceptér</span>
              </div>
            </div>
            <div className="gdpr-wireframe__footer">
              Privatlivspolitik · Cookiepolitik · Cookie-indstillinger · Kontakt / DPO
            </div>
          </div>
        </div>
      </div>

      <ol>
        <li>
          <strong>Cookie-banner ved første besøg</strong> – før ikke-nødvendige scripts. Kort sprog, links til fulde
          politikker, ligeværdige knapper (afvis / tilpas / acceptér).
        </li>
        <li>
          <strong>Tilpasningspanel</strong> – kategorier med forklaring, hvem der sætter cookien, formål og levetid.
        </li>
        <li>
          <strong>Footer-links på alle sider</strong> – privatliv, cookies, kontakt til dataansvarlig / DPO.
        </li>
        <li>
          <strong>&ldquo;Cookie-indstillinger&rdquo;</strong> – brugeren kan ændre eller trække samtykke uden at slette
          browserdata manuelt.
        </li>
        <li>
          <strong>Tekniske politik-sider</strong> – fulde tekster der matcher det, sitet faktisk gør.
        </li>
      </ol>

      <h3>7.2 Privatlivspolitik – anbefalet indhold</h3>
      <table>
        <thead>
          <tr>
            <th>Afsnit</th>
            <th>Hvad skal stå</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Hvem er dataansvarlig</td>
            <td>Juridisk navn, CVR, adresse, e-mail – evt. DPO-kontakt</td>
          </tr>
          <tr>
            <td>Hvilke data</td>
            <td>Kategorier: konto, bestilling, logs, cookies, support …</td>
          </tr>
          <tr>
            <td>Formål og retsgrundlag</td>
            <td>Matchet pr. behandling (ikke én vag sætning til alt)</td>
          </tr>
          <tr>
            <td>Modtagere / databehandlere</td>
            <td>Hosting, e-mail, betaling, analytics – gerne med links</td>
          </tr>
          <tr>
            <td>Tredjelande</td>
            <td>Overførsler uden for EU/EØS og hvilket overførselsgrundlag</td>
          </tr>
          <tr>
            <td>Opbevaring</td>
            <td>Hvor længe – eller kriterier for sletning</td>
          </tr>
          <tr>
            <td>Rettigheder</td>
            <td>Hvordan man beder om indsigt, sletning, klage til Datatilsynet</td>
          </tr>
          <tr>
            <td>Sikkerhed</td>
            <td>Overordnet (TLS, adgangskontrol) – uden at afsløre angrebsflader</td>
          </tr>
          <tr>
            <td>Ændringer</td>
            <td>Hvordan I opdaterer politikken, og hvornår den sidst er ændret</td>
          </tr>
        </tbody>
      </table>

      <h3>7.3 Cookiepolitik – anbefalet indhold</h3>
      <ul>
        <li>Hvad er en cookie / lokal lagring (localStorage, pixels)</li>
        <li>Tabel pr. cookie: navn, udbyder, formål, type, udløb</li>
        <li>Hvordan man ændrer eller trækker samtykke</li>
        <li>Henvisning til privatlivspolitik for persondata bag cookien</li>
      </ul>

      <h3>7.4 Checkliste: god vs. dårlig praksis</h3>
      <table>
        <thead>
          <tr>
            <th>God praksis</th>
            <th>Dårlig praksis</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Scripts til analytics loades først efter accept</td>
            <td>Trackere i &lt;head&gt; før banneret</td>
          </tr>
          <tr>
            <td>Afvis er synlig og ét klik væk</td>
            <td>Kun &ldquo;OK&rdquo; eller afvis gemt i &ldquo;mere info&rdquo;</td>
          </tr>
          <tr>
            <td>Politik matcher koden (rigtige cookies og leverandører)</td>
            <td>Kopieret skabelon der nævner værktøjer I ikke bruger</td>
          </tr>
          <tr>
            <td>Samtykke logges med tidspunkt og version af tekst</td>
            <td>Ingen dokumentation for, hvem der sagde ja til hvad</td>
          </tr>
          <tr>
            <td>Databehandleraftaler med hosting og SaaS</td>
            <td>&ldquo;Vi har bare en konto hos dem&rdquo; uden aftale</td>
          </tr>
          <tr>
            <td>Sletning af konto fjerner også data hos integrationer</td>
            <td>Soft-delete lokalt, mens Mailchimp stadig har e-mailen</td>
          </tr>
        </tbody>
      </table>

      <h2>8. Brud på persondatasikkerheden</h2>
      <p>
        Hvis persondata utilsigtet lækkes, ændres eller bliver utilgængelige (fx ransomware, åben S3-bucket, SQL injection
        der eksponerer brugertabellen), skal dataansvarlig typisk:
      </p>
      <ol>
        <li>Begrænse skaden (luk hul, roter nøgler, vurdér omfang)</li>
        <li>Dokumentere hændelsen</li>
        <li>
          Anmelde til Datatilsynet inden for <strong>72 timer</strong>, hvis risikoen for de registrerede er reel
        </li>
        <li>Underrette de berørte, hvis risikoen er høj</li>
      </ol>
      <p>
        Det hænger sammen med sikkerhedslektionerne: hashing, kryptering, auth og angreb er også GDPR-sikkerhedsforanstaltninger
        (artikel 32).
      </p>

      <h2>9. Mini-øvelse til projektet</h2>
      <ol>
        <li>List alle persondata jeres app gemmer (inkl. logs og cookies).</li>
        <li>Markér for hver: formål, retsgrundlag, opbevaringstid, hvem der er databehandler.</li>
        <li>
          Skitsér cookie-banner + footer-links som i wireframen ovenfor – og beslut, hvilke scripts der først må køre
          efter samtykke.
        </li>
        <li>
          Skriv en kort privatlivspolitik (én side) med dataansvarlig, kategorier, rettigheder og kontakt – og tjek at
          den matcher koden.
        </li>
      </ol>

      <Callout type="tip">
        Næste skridt i pensum: se <Link to="/sikkerhed/kryptering">Kryptering</Link> og{' '}
        <Link to="/sikkerhed/authentication">Authentication</Link> for tekniske foranstaltninger, og{' '}
        <Link to="/sikkerhed/angreb">Angreb</Link> for hvordan læk ofte opstår.
      </Callout>
    </LessonLayout>
  )
}
