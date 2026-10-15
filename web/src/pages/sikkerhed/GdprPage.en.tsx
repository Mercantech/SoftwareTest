import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import { NOTION_FAG } from '../../data/objectives'

const rolesChart = `
flowchart TB
  DS["Data subject<br/>the person the data is about"]
  DA["Controller<br/>decides purposes and means"]
  DB["Processor<br/>processes data on behalf of the controller"]
  DPO["DPO<br/>advises and monitors"]
  TIL["Supervisory authority<br/>e.g. Datatilsynet in DK"]

  DS -->|"rights: access, erasure, objection …"| DA
  DA -->|"data processing agreement"| DB
  DA -->|"advice / oversight"| DPO
  DS -->|"complaint"| TIL
  TIL -->|"supervision and sanctions"| DA
`

const consentFlow = `
flowchart LR
  A["User lands on the site"] --> B{"Only strictly<br/>necessary cookies?"}
  B -->|Yes| C["No banner required<br/>inform in the policy"]
  B -->|No| D["Cookie banner<br/>before non-essential cookies"]
  D --> E{"User chooses"}
  E -->|Reject| F["Necessary only<br/>no tracking"]
  E -->|Customise| G["Categories on/off<br/>store preference"]
  E -->|Accept all| H["Functional + analytics<br/>+ marketing as chosen"]
  F --> I["Policy + settings<br/>always available"]
  G --> I
  H --> I
`

const policyMap = `
flowchart TB
  subgraph site["Website – visible GDPR surfaces"]
    B["Cookie banner<br/>first visit"]
    F["Footer links<br/>Privacy · Cookies · Contact"]
    S["Settings<br/>change consent later"]
    P["Privacy policy<br/>full text"]
    C["Cookie policy<br/>or section in privacy"]
  end
  B --> P
  B --> C
  F --> P
  F --> C
  F --> S
  S --> B
`

export default function GdprPageEn() {
  return (
    <LessonLayout module="sikkerhed">
      <h1>GDPR, controllers and cookies</h1>
      <p>
        <em>Cross-cutting topic:</em> Personal data and consent matter when you build web apps – even when GDPR is not
        listed as a separate learning objective.
      </p>
      <LinkTrio
        sitePath="/sikkerhed/gdpr"
        notionUrl={NOTION_FAG}
        repoUrl="https://github.com/Mercantech/SoftwareTest"
      />

      <Callout type="info">
        This lesson is <strong>teaching material</strong>, not legal advice. For a concrete product: ask your teacher,
        the organisation&apos;s DPO, or the supervisory authority. Official Danish guidance:{' '}
        <a href="https://www.datatilsynet.dk/" target="_blank" rel="noreferrer">
          datatilsynet.dk
        </a>
        .
      </Callout>

      <h2>1. What is GDPR – and why developers should care</h2>
      <p>
        <strong>GDPR</strong> (General Data Protection Regulation) is the EU framework for processing{' '}
        <strong>personal data</strong>. In Denmark it is supplemented by the national data protection act. It applies
        when you process data about identifiable people – names, emails, IP addresses, login IDs, tracking cookies,
        photos, and similar.
      </p>
      <p>As a developer it affects you directly:</p>
      <ul>
        <li>Which fields you store, and for how long</li>
        <li>Whether you may use analytics, chat widgets and marketing pixels</li>
        <li>How login, logs and backups handle personal data</li>
        <li>Whether you have processor agreements with cloud, email and hosting</li>
        <li>Whether consent, cookie banners and privacy text are honest and technically accurate</li>
      </ul>

      <h2>2. Roles: controller, processor and more</h2>
      <MermaidDiagram chart={rolesChart} />

      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Who?</th>
            <th>Typical responsibility</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Controller</strong> (dataansvarlig)
            </td>
            <td>The company / school / app owner that decides <em>why</em> and <em>how</em></td>
            <td>
              Purposes, legal basis, informing users, rights, security, choosing processors, breach notification
            </td>
          </tr>
          <tr>
            <td>
              <strong>Joint controllers</strong>
            </td>
            <td>Two parties decide purposes/means together</td>
            <td>Must agree who does what towards the data subject</td>
          </tr>
          <tr>
            <td>
              <strong>Processor</strong> (databehandler)
            </td>
            <td>A vendor that processes data <em>on behalf of</em> the controller (hosting, email, CRM, analytics)</td>
            <td>
              Follow instructions only, have a DPA, secure data, help with access/erasure/breaches
            </td>
          </tr>
          <tr>
            <td>
              <strong>Data subject</strong>
            </td>
            <td>The person the data is about</td>
            <td>Has rights (access, rectification, erasure, restriction, portability, objection …)</td>
          </tr>
          <tr>
            <td>
              <strong>DPO</strong>
            </td>
            <td>Data Protection Officer (required in some organisations)</td>
            <td>Advises, monitors compliance, contact point for the authority</td>
          </tr>
          <tr>
            <td>
              <strong>Supervisory authority</strong>
            </td>
            <td>In Denmark: Datatilsynet</td>
            <td>Guidance, supervision, orders and fines</td>
          </tr>
        </tbody>
      </table>

      <Callout type="warn">
        <strong>Common mistake:</strong> Thinking &ldquo;we just use Stripe / Cloudflare / Google Analytics, so it is
        their problem&rdquo;. Often <em>you</em> are the controller for your app, and the vendor is a processor – or
        both are responsible in different ways. That must be clarified and documented.
      </Callout>

      <h3>The controller in practice</h3>
      <p>The controller should be able to answer:</p>
      <ul>
        <li>
          <strong>What</strong> do we process? (categories of data)
        </li>
        <li>
          <strong>Why</strong>? (purposes)
        </li>
        <li>
          <strong>On which legal basis</strong>? (consent, contract, legitimate interest, legal obligation …)
        </li>
        <li>
          <strong>How long</strong> do we keep it?
        </li>
        <li>
          <strong>Who</strong> has access – including sub-processors and countries outside the EU/EEA?
        </li>
        <li>
          <strong>How</strong> can the user exercise their rights?
        </li>
      </ul>
      <p>
        Many organisations keep a <strong>record of processing activities</strong> (Article 30). Developers contribute
        the technical truth: which tables, logs, cookies and integrations actually exist.
      </p>

      <h2>3. The seven principles</h2>
      <table>
        <thead>
          <tr>
            <th>Principle</th>
            <th>Meaning for a web app</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Lawfulness, fairness, transparency</td>
            <td>Clear policy, honest purposes, no hidden tracking</td>
          </tr>
          <tr>
            <td>Purpose limitation</td>
            <td>Data collected for login is not freely reused for ads without a new basis</td>
          </tr>
          <tr>
            <td>Data minimisation</td>
            <td>Only ask for fields you need – not &ldquo;nice to have&rdquo; profiles</td>
          </tr>
          <tr>
            <td>Accuracy</td>
            <td>Users must be able to correct wrong data</td>
          </tr>
          <tr>
            <td>Storage limitation</td>
            <td>Retention / deletion for accounts, logs and backups</td>
          </tr>
          <tr>
            <td>Integrity and confidentiality</td>
            <td>Access control, encryption, hashing, least privilege</td>
          </tr>
          <tr>
            <td>Accountability</td>
            <td>You must be able to <em>demonstrate</em> compliance (docs, contracts, consent logs)</td>
          </tr>
        </tbody>
      </table>

      <h2>4. Legal basis – may we process the data?</h2>
      <p>Without a valid legal basis you must not process personal data. Common bases in web apps:</p>
      <ul>
        <li>
          <strong>Contract</strong> – necessary to deliver the service (create account, send order confirmation)
        </li>
        <li>
          <strong>Consent</strong> – freely given, specific, informed and unambiguous (and easy to withdraw)
        </li>
        <li>
          <strong>Legitimate interest</strong> – requires a balancing test; rarely enough for heavy marketing alone
        </li>
        <li>
          <strong>Legal obligation</strong> – e.g. bookkeeping rules for invoices
        </li>
        <li>
          <strong>Vital interests / public task</strong> – less common in ordinary school projects
        </li>
      </ul>
      <Callout type="tip">
        <strong>Strictly necessary cookies</strong> for a login session or load balancing typically do not need consent,
        but you must still inform. Analytics and marketing cookies generally need <strong>prior consent</strong>{' '}
        (ePrivacy / cookie rules + GDPR).
      </Callout>

      <h2>5. Data subject rights</h2>
      <p>In practice the user should be able to:</p>
      <ul>
        <li>
          <strong>Access</strong> – what do you hold about me?
        </li>
        <li>
          <strong>Rectify</strong> incorrect data
        </li>
        <li>
          <strong>Be forgotten</strong> (erasure) – with lawful exceptions
        </li>
        <li>
          <strong>Restrict</strong> processing temporarily
        </li>
        <li>
          <strong>Port data</strong> in a common format
        </li>
        <li>
          <strong>Object</strong> – e.g. to direct marketing
        </li>
        <li>
          <strong>Withdraw consent</strong> as easily as it was given
        </li>
      </ul>
      <p>
        For developers that means: design &ldquo;export my data&rdquo; and &ldquo;delete account&rdquo;, think about
        soft-delete vs. hard-delete, logs and backups, and deleting data in third-party systems too.
      </p>

      <h2>6. Cookies: categories and consent flow</h2>
      <MermaidDiagram chart={consentFlow} />

      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Example</th>
            <th>Consent?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Necessary / strictly necessary</strong>
            </td>
            <td>Session cookie for login, CSRF token, shopping cart, load balancer</td>
            <td>No (but disclose them)</td>
          </tr>
          <tr>
            <td>
              <strong>Functional / preference</strong>
            </td>
            <td>Language, theme (light/dark) stored across sessions</td>
            <td>Often yes – depends on whether they are needed for a service the user explicitly requests</td>
          </tr>
          <tr>
            <td>
              <strong>Statistics / analytics</strong>
            </td>
            <td>Google Analytics, Plausible with cookies, heatmaps</td>
            <td>Generally yes, before the script runs</td>
          </tr>
          <tr>
            <td>
              <strong>Marketing / tracking</strong>
            </td>
            <td>Facebook Pixel, retargeting, ad IDs</td>
            <td>Yes – and reject must be as easy as accept</td>
          </tr>
        </tbody>
      </table>

      <Callout type="danger">
        <strong>Dark patterns are not OK.</strong> A large green &ldquo;Accept all&rdquo; with &ldquo;Reject&rdquo;
        hidden behind three clicks, pre-ticked marketing boxes, or trackers running <em>before</em> a choice, breaks the
        spirit of the rules and can lead to enforcement. Equal choices, real opt-in, and a way to change the choice later.
      </Callout>

      <h2>7. Overview: what does a good cookie / GDPR setup look like on a website?</h2>
      <MermaidDiagram chart={policyMap} />

      <h3>7.1 Visible surfaces (UX)</h3>
      <div className="gdpr-wireframe" aria-hidden="true">
        <div className="gdpr-wireframe__browser">
          <div className="gdpr-wireframe__chrome">
            <span />
            <span />
            <span />
            <div className="gdpr-wireframe__url">https://example.com</div>
          </div>
          <div className="gdpr-wireframe__page">
            <div className="gdpr-wireframe__nav">Logo · Menu · Login</div>
            <div className="gdpr-wireframe__hero">Content / product</div>
            <div className="gdpr-wireframe__banner">
              <strong>Cookie banner</strong>
              <p>Short text + link to policy. Buttons: Reject · Customise · Accept</p>
              <div className="gdpr-wireframe__actions">
                <span className="gdpr-wireframe__btn gdpr-wireframe__btn--ghost">Reject</span>
                <span className="gdpr-wireframe__btn gdpr-wireframe__btn--ghost">Customise</span>
                <span className="gdpr-wireframe__btn">Accept</span>
              </div>
            </div>
            <div className="gdpr-wireframe__footer">
              Privacy policy · Cookie policy · Cookie settings · Contact / DPO
            </div>
          </div>
        </div>
      </div>

      <ol>
        <li>
          <strong>Cookie banner on first visit</strong> – before non-essential scripts. Plain language, links to full
          policies, equal buttons (reject / customise / accept).
        </li>
        <li>
          <strong>Preferences panel</strong> – categories with who sets the cookie, purpose and lifetime.
        </li>
        <li>
          <strong>Footer links on every page</strong> – privacy, cookies, controller / DPO contact.
        </li>
        <li>
          <strong>&ldquo;Cookie settings&rdquo;</strong> – change or withdraw consent without manually clearing the
          browser.
        </li>
        <li>
          <strong>Policy pages</strong> – full text that matches what the site actually does.
        </li>
      </ol>

      <h3>7.2 Privacy policy – recommended contents</h3>
      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>What to include</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Who is the controller</td>
            <td>Legal name, company ID, address, email – DPO contact if any</td>
          </tr>
          <tr>
            <td>Which data</td>
            <td>Categories: account, orders, logs, cookies, support …</td>
          </tr>
          <tr>
            <td>Purposes and legal bases</td>
            <td>Matched per processing (not one vague sentence for everything)</td>
          </tr>
          <tr>
            <td>Recipients / processors</td>
            <td>Hosting, email, payments, analytics – preferably with links</td>
          </tr>
          <tr>
            <td>Third countries</td>
            <td>Transfers outside the EU/EEA and the transfer mechanism</td>
          </tr>
          <tr>
            <td>Retention</td>
            <td>How long – or criteria for deletion</td>
          </tr>
          <tr>
            <td>Rights</td>
            <td>How to request access, erasure, complaint to the authority</td>
          </tr>
          <tr>
            <td>Security</td>
            <td>High level (TLS, access control) – without exposing attack surface</td>
          </tr>
          <tr>
            <td>Changes</td>
            <td>How you update the policy and when it was last changed</td>
          </tr>
        </tbody>
      </table>

      <h3>7.3 Cookie policy – recommended contents</h3>
      <ul>
        <li>What a cookie / local storage is (localStorage, pixels)</li>
        <li>Table per cookie: name, provider, purpose, type, expiry</li>
        <li>How to change or withdraw consent</li>
        <li>Link to the privacy policy for personal data behind the cookie</li>
      </ul>

      <h3>7.4 Checklist: good vs. bad practice</h3>
      <table>
        <thead>
          <tr>
            <th>Good practice</th>
            <th>Bad practice</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Analytics scripts load only after accept</td>
            <td>Trackers in &lt;head&gt; before the banner</td>
          </tr>
          <tr>
            <td>Reject is visible and one click away</td>
            <td>Only &ldquo;OK&rdquo;, or reject buried under &ldquo;more info&rdquo;</td>
          </tr>
          <tr>
            <td>Policy matches the code (real cookies and vendors)</td>
            <td>Copied template naming tools you do not use</td>
          </tr>
          <tr>
            <td>Consent logged with timestamp and text version</td>
            <td>No record of who agreed to what</td>
          </tr>
          <tr>
            <td>DPAs with hosting and SaaS</td>
            <td>&ldquo;We just have an account with them&rdquo; and no agreement</td>
          </tr>
          <tr>
            <td>Account deletion also clears data in integrations</td>
            <td>Soft-delete locally while Mailchimp still has the email</td>
          </tr>
        </tbody>
      </table>

      <h2>8. Personal data breaches</h2>
      <p>
        If personal data is accidentally disclosed, altered or made unavailable (e.g. ransomware, open bucket, SQL
        injection exposing the user table), the controller typically must:
      </p>
      <ol>
        <li>Contain the damage (close the hole, rotate keys, assess scope)</li>
        <li>Document the incident</li>
        <li>
          Notify the supervisory authority within <strong>72 hours</strong> if there is a real risk to individuals
        </li>
        <li>Notify affected people if the risk is high</li>
      </ol>
      <p>
        This connects to the security lessons: hashing, encryption, auth and attacks are also GDPR security measures
        (Article 32).
      </p>

      <h2>9. Mini exercise for your project</h2>
      <ol>
        <li>List all personal data your app stores (including logs and cookies).</li>
        <li>For each: purpose, legal basis, retention, who is a processor.</li>
        <li>
          Sketch a cookie banner + footer links as in the wireframe – and decide which scripts may only run after
          consent.
        </li>
        <li>
          Write a short privacy policy (one page) with controller, categories, rights and contact – and check that it
          matches the code.
        </li>
      </ol>

      <Callout type="tip">
        Next in the curriculum: see <Link to="/sikkerhed/kryptering">Encryption</Link> and{' '}
        <Link to="/sikkerhed/authentication">Authentication</Link> for technical measures, and{' '}
        <Link to="/sikkerhed/angreb">Attacks</Link> for how leaks often happen.
      </Callout>
    </LessonLayout>
  )
}
