import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import MermaidDiagram from '../../components/MermaidDiagram'

const uxVsUi = `
flowchart LR
  UX["UX: the whole experience"] --> UI["UI: visual design<br/>colours, buttons, layout"]
  UX --> IA["Information architecture"]
  UX --> INT["Interaction and flow"]
  UX --> PERF["Perceived speed"]
  UX --> ACC["Accessibility"]
  UX --> CONT["Content and language"]
  UX --> EMO["Emotions and trust"]
`

const uxTestMap = `
flowchart TD
  Q{"What do you want to know?"} -->|"Why do users have problems?"| UT["Usability test<br/>qualitative, 5 users"]
  Q -->|"What is wrong with the page?"| HE["Heuristic evaluation<br/>experts, quick and cheap"]
  Q -->|"Which version works best?"| AB["A/B test<br/>quantitative, many users"]
  Q -->|"Can everyone use it?"| AC["Accessibility test<br/>WCAG, screen reader, keyboard"]
  Q -->|"How do they think about content?"| CS["Card sorting / tree test"]
  Q -->|"How is it used in reality?"| AN["Analytics, heatmaps, session replay"]
`

const usabilityProcess = `
flowchart LR
  A["Goals and hypotheses"] --> B["Recruit participants<br/>the target group"]
  B --> C["Write tasks<br/>scenarios"]
  C --> D["Pilot test"]
  D --> E["Run sessions<br/>think-aloud"]
  E --> F["Record problems<br/>severity"]
  F --> G["Prioritise and report"]
  G --> H["Redesign and test again"]
`

const abFlow = `
flowchart TD
  U["Visitors"] --> R{"Random allocation<br/>50/50"}
  R --> A["Variant A<br/>control"]
  R --> B["Variant B<br/>challenger"]
  A --> MA["Conversion A"]
  B --> MB["Conversion B"]
  MA --> S{"Statistical significance<br/>and practical effect?"}
  MB --> S
  S -->|Yes| W["Roll out the winner"]
  S -->|No| N["More data or a new design"]
`

const abCode = `
// Deterministic allocation: the same user always gets the same variant
public static class Experiment
{
    public static string Variant(Guid userId, string experimentName)
    {
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(userId + ":" + experimentName));
        return hash[0] % 2 == 0 ? "A" : "B";
    }
}

// Log exposure and conversion so you can analyse afterwards
logger.LogInformation("experiment={Name} variant={Variant} user={User} event={Event}",
    "checkout-button", variant, userId, "purchase_completed");
`

const sampleSize = `
// Rule of thumb for the number of visitors per variant
// n ≈ 16 * p * (1 - p) / delta^2     (approx. 80 % power, 5 % significance)
//
// Example: conversion p = 5 %, want to detect an improvement delta = 1 percentage point
// n ≈ 16 * 0.05 * 0.95 / 0.01^2  = 7,600 visitors per variant
`

const a11yTest = `
// Automated accessibility test with Playwright + axe-core (JavaScript/TypeScript)
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('the front page has no critical accessibility violations', async ({ page }) => {
  await page.goto('https://staging.example.dk/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('login can be completed using the keyboard only', async ({ page }) => {
  await page.goto('https://staging.example.dk/login');
  await page.keyboard.press('Tab');                 // focus on email
  await page.keyboard.type('anna@test.dk');
  await page.keyboard.press('Tab');                 // focus on password
  await page.keyboard.type('Hemmelig123!');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/dashboard/);
});
`

const htmlGood = `
<!-- Accessible form: label, error message and focus -->
<form novalidate>
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email"
         aria-describedby="email-error" aria-invalid="true" required />
  <p id="email-error" role="alert">Enter a valid email, e.g. anna@test.dk</p>

  <button type="submit">Log in</button>
</form>

<!-- Bad: no label, only colour signals the error, clickable div -->
<!-- <input placeholder="Email" style="border:1px solid red"> -->
<!-- <div onclick="login()">Log in</div> -->
`

const lighthouseCmd = `
# Lighthouse (built into Chrome DevTools) - performance, accessibility, best practices, SEO
npx lighthouse https://staging.example.dk --only-categories=accessibility,performance --view

# In CI: fail if the accessibility score is too low
npx lhci autorun --assert.assertions.categories:accessibility=error
`

const sus = `
System Usability Scale (SUS) - 10 statements, answer 1 (strongly disagree) to 5 (strongly agree)

1.  I think that I would like to use this system frequently.
2.  I found the system unnecessarily complex.
3.  I thought the system was easy to use.
4.  I think that I would need technical support to be able to use this system.
5.  I found the various functions in this system were well integrated.
6.  I thought there was too much inconsistency in this system.
7.  I would imagine that most people would learn to use this system very quickly.
8.  I found the system very cumbersome to use.
9.  I felt very confident using the system.
10. I needed to learn a lot of things before I could get going with this system.

Calculation: odd statements: (answer - 1), even statements: (5 - answer). Add them all up and multiply by 2.5.
Score 0-100.  Average approx. 68.  > 80 = excellent.  < 50 = serious problems.
`

export default function UxPageEn() {

  return (
    <LessonLayout module="test">

<h1>UX testing: the customer experience</h1>

      <p>
        A system can pass all functional tests, have excellent performance and still{' '}
        <strong>fail with users</strong>: they don&apos;t understand where to click, they
        abandon the purchase, or they can&apos;t use the solution at all. UX (User
        Experience) testing examines the experience — not only whether the features work,
        but whether people <em>can, want to, and like to</em> use them.
      </p>

      <h2>Learning objectives</h2>
      <ul>
        <li>Explain the difference between UX and UI, and between UX testing and functional testing.</li>
        <li>Plan and run a usability test with think-aloud.</li>
        <li>Perform a heuristic evaluation using Nielsen&apos;s 10 heuristics.</li>
        <li>Explain A/B testing and when the results are trustworthy.</li>
        <li>Apply basic accessibility principles (WCAG) and simple tests.</li>
        <li>Choose the right UX testing method for a given question.</li>
      </ul>

      <h2>1. UX vs. UI — and UX testing vs. UI testing</h2>
      <MermaidDiagram chart={uxVsUi} />
      <p>
        <strong>UI</strong> (User Interface) is what the user sees and touches: buttons,
        colours, typography, layout. <strong>UX</strong> is the overall experience over
        time: from the first impression until the task is solved — including speed, trust,
        language and emotions.
      </p>

      <Callout type="warn">
        <strong>Don&apos;t confuse the terms &ldquo;UI test&rdquo; and &ldquo;UX
        test&rdquo;.</strong>{' '}
        In software testing, a <em>UI test</em> often means an <em>automated test of the
        user interface</em> (e.g. Playwright/Selenium clicking around and checking that
        elements exist). A <em>UX test</em> is a <em>human evaluation</em> of whether the
        solution is understandable and effective.
      </Callout>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>UI test (automated)</th>
            <th>UX test (user-oriented)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Question</td>
            <td>&ldquo;Does the button work and does the page show the right text?&rdquo;</td>
            <td>&ldquo;Does the user understand what the button does, and do they reach their goal?&rdquo;</td>
          </tr>
          <tr>
            <td>Performed by</td>
            <td>Scripts (Playwright, Cypress, Selenium)</td>
            <td>Real users, designers, UX researchers</td>
          </tr>
          <tr>
            <td>Result</td>
            <td>Pass/fail</td>
            <td>Insight, problems with severity, scores (e.g. SUS)</td>
          </tr>
          <tr>
            <td>Finds</td>
            <td>Regression defects in the UI</td>
            <td>Confusing flows, incomprehensible texts, barriers</td>
          </tr>
          <tr>
            <td>Can be automated?</td>
            <td>Yes</td>
            <td>Only partially (analytics, accessibility checks)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Functional testing (see <Link to="/test/oversigt">Overview</Link> and{' '}
        <Link to="/test/metodikker">Methodologies</Link>) proves that the system does what
        the requirements say. UX testing examines whether the requirements were the right
        ones in the first place — and whether the solution is usable for the actual users.
      </p>

      <h2>2. Methods — what should we use when?</h2>
      <MermaidDiagram chart={uxTestMap} />
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Qualitative/quantitative</th>
            <th>When</th>
            <th>Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Heuristic evaluation</td>
            <td>Qualitative (expert)</td>
            <td>Early, on prototypes and existing sites</td>
            <td>Low</td>
          </tr>
          <tr>
            <td>Usability test</td>
            <td>Qualitative</td>
            <td>Continuously during design and before release</td>
            <td>Medium</td>
          </tr>
          <tr>
            <td>A/B test</td>
            <td>Quantitative</td>
            <td>When the system is live with enough traffic</td>
            <td>Medium (requires traffic/analytics)</td>
          </tr>
          <tr>
            <td>Accessibility test</td>
            <td>Both</td>
            <td>All the way through — automated in CI + manual</td>
            <td>Low–medium</td>
          </tr>
          <tr>
            <td>Questionnaire (SUS, NPS, CSAT)</td>
            <td>Quantitative</td>
            <td>After a usability test or in production</td>
            <td>Low</td>
          </tr>
          <tr>
            <td>Card sorting / tree testing</td>
            <td>Both</td>
            <td>Designing navigation and information architecture</td>
            <td>Low</td>
          </tr>
          <tr>
            <td>Analytics / heatmaps / session replay</td>
            <td>Quantitative</td>
            <td>Production: where do users drop off?</td>
            <td>Low</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Usability testing</h2>
      <p>
        In a usability test, <strong>representative users</strong> are given tasks to solve
        in the solution while you observe. You are testing the <em>system</em>, not the
        user — if the user fails, it is the design&apos;s fault.
      </p>
      <MermaidDiagram chart={usabilityProcess} />

      <h3>Key elements</h3>
      <ul>
        <li>
          <strong>Participants:</strong> 5 users uncover about 85 % of the biggest
          problems (Nielsen). Run several small rounds rather than one large one. Recruit
          from the target group — not colleagues.
        </li>
        <li>
          <strong>Tasks as scenarios:</strong> &ldquo;You need a new jacket for the winter
          and want to pay at most 800 DKK. Find one and buy it.&rdquo; — not &ldquo;Click
          Add to cart&rdquo; (that leads the user).
        </li>
        <li>
          <strong>Think-aloud:</strong> the participant says out loud what they are
          thinking and expecting.
        </li>
        <li>
          <strong>Facilitator:</strong> neutral. Don&apos;t help. Ask &ldquo;What would you
          do now?&rdquo;.
        </li>
        <li>
          <strong>Moderated vs. unmoderated</strong> and <strong>remote vs. in
          person</strong>: weigh depth against scale and cost.
        </li>
        <li>
          <strong>Consent and GDPR:</strong> inform about recording, anonymise, store
          securely.
        </li>
      </ul>

      <h3>Measurements</h3>
      <table>
        <thead>
          <tr>
            <th>Measurement</th>
            <th>Explanation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Task success rate</td>
            <td>Share who complete the task (effectiveness)</td>
          </tr>
          <tr>
            <td>Time on task</td>
            <td>How long it takes (efficiency)</td>
          </tr>
          <tr>
            <td>Errors and detours</td>
            <td>Number of wrong clicks, back-button use, searching for help</td>
          </tr>
          <tr>
            <td>Satisfaction</td>
            <td>SUS, SEQ (Single Ease Question), NPS</td>
          </tr>
          <tr>
            <td>Severity per problem</td>
            <td>0 = not a problem … 4 = catastrophe (Nielsen&apos;s scale)</td>
          </tr>
        </tbody>
      </table>
      <p>
        ISO 9241-11 defines usability as <strong>effectiveness, efficiency and
        satisfaction</strong> in a given context of use — those are the three things you
        measure.
      </p>
      <CodeBlock language="text">{sus}</CodeBlock>

      <h2>4. Heuristic evaluation (Nielsen&apos;s 10 heuristics)</h2>
      <p>
        1–5 experts go through the interface independently and assess it against
        recognised rules of thumb. Quick and cheap — but it finds <em>presumed</em>
        problems; it does not replace tests with real users.
      </p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Heuristic</th>
            <th>Example of a violation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Visibility of system status</td>
            <td>No spinner/feedback after clicking &ldquo;Pay&rdquo;</td>
          </tr>
          <tr>
            <td>2</td>
            <td>Match between system and the real world</td>
            <td>Error code &ldquo;ERR 0x80004005&rdquo; instead of understandable language</td>
          </tr>
          <tr>
            <td>3</td>
            <td>User control and freedom</td>
            <td>No undo/cancel; can&apos;t go back from a step</td>
          </tr>
          <tr>
            <td>4</td>
            <td>Consistency and standards</td>
            <td>&ldquo;Save&rdquo; is called three different things on three pages</td>
          </tr>
          <tr>
            <td>5</td>
            <td>Error prevention</td>
            <td>A delete button without confirmation placed next to &ldquo;Save&rdquo;</td>
          </tr>
          <tr>
            <td>6</td>
            <td>Recognition rather than recall</td>
            <td>The user has to remember a code from the previous page</td>
          </tr>
          <tr>
            <td>7</td>
            <td>Flexibility and efficiency of use</td>
            <td>No shortcuts or autofill for experienced users</td>
          </tr>
          <tr>
            <td>8</td>
            <td>Aesthetic and minimalist design</td>
            <td>A screen with 40 equally important elements</td>
          </tr>
          <tr>
            <td>9</td>
            <td>Help users recognise, diagnose and recover from errors</td>
            <td>&ldquo;Something went wrong&rdquo; with no explanation or solution</td>
          </tr>
          <tr>
            <td>10</td>
            <td>Help and documentation</td>
            <td>No contextual help or FAQ</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Procedure:</strong> define scenarios → each evaluator goes through the
        interface alone and records problems (which heuristic, where, severity) → joint
        review and prioritisation → report with recommendations.
      </p>

      <h2>5. A/B testing</h2>
      <p>
        Compare two (or more) variants by showing them to random, evenly distributed groups
        of real users and measuring a <strong>business metric</strong> (e.g. conversion,
        clicks, time on task). It is a controlled experiment and can document the{' '}
        <em>effect</em> — but not <em>why</em>.
      </p>
      <MermaidDiagram chart={abFlow} />
      <CodeBlock language="csharp">{abCode}</CodeBlock>
      <h3>How to avoid fallacies</h3>
      <ul>
        <li>
          Define the <strong>hypothesis and primary metric</strong> before the test starts.
        </li>
        <li>
          Calculate the <strong>sample size</strong> in advance and don&apos;t
          &ldquo;peek&rdquo; for an early win (peeking increases false positives).
        </li>
        <li>
          Run long enough to cover whole weeks (behaviour varies with the day of the week).
        </li>
        <li>Change only <strong>one thing at a time</strong>, otherwise you don&apos;t know what worked.</li>
        <li>
          Check <strong>guardrail metrics</strong> (e.g. return rate, support requests) so
          you don&apos;t increase conversion at the expense of quality.
        </li>
        <li>
          Statistical significance ≠ practical significance: a 0.1 % improvement can be
          worthless.
        </li>
        <li>Ethics: avoid manipulative &ldquo;dark patterns&rdquo;.</li>
      </ul>
      <CodeBlock language="text">{sampleSize}</CodeBlock>

      <h2>6. Accessibility (a11y)</h2>
      <p>
        Accessibility means that <strong>everyone</strong> can use the solution — including
        people who are blind, have low vision, are colour-blind, deaf, have motor
        impairments or cognitive challenges. It is also a legal requirement for public
        sites in the EU (Web Accessibility Directive) and, from 2025, many private services
        (European Accessibility Act). The standard is called <strong>WCAG</strong> (Web
        Content Accessibility Guidelines).
      </p>
      <h3>The POUR principles</h3>
      <ul>
        <li>
          <strong>Perceivable:</strong> alternative text for images, captions, sufficient
          contrast (min. 4.5:1 for normal text).
        </li>
        <li>
          <strong>Operable:</strong> everything can be used with a keyboard, visible focus
          indicator, no time traps, no flashing.
        </li>
        <li>
          <strong>Understandable:</strong> clear language, predictable navigation, helpful
          error messages.
        </li>
        <li>
          <strong>Robust:</strong> correct, semantic HTML and ARIA, so that screen readers
          and other assistive technologies can interpret the page.
        </li>
      </ul>
      <CodeBlock language="html">{htmlGood}</CodeBlock>

      <h3>How to test accessibility</h3>
      <ol>
        <li>
          <strong>Automated:</strong> axe-core, Lighthouse and WAVE find about 30–40 % of
          the problems (missing alt text, contrast, labels).
        </li>
        <li>
          <strong>Keyboard:</strong> can you complete all flows using only Tab, Shift+Tab,
          Enter, space and the arrow keys? Is focus always visible?
        </li>
        <li>
          <strong>Screen reader:</strong> try NVDA (Windows), VoiceOver (macOS/iOS) or
          TalkBack (Android). Does the page make sense when read aloud?
        </li>
        <li>
          <strong>Zoom and responsiveness:</strong> 200 % zoom and small screens without
          losing content.
        </li>
        <li>
          <strong>Users with disabilities:</strong> the most valuable test.
        </li>
      </ol>
      <CodeBlock language="javascript">{a11yTest}</CodeBlock>
      <CodeBlock language="bash">{lighthouseCmd}</CodeBlock>

      <Callout type="tip">
        Combine UI automation and UX: let Playwright/axe run in CI and catch accessibility
        regressions, and hold regular human usability tests for what scripts can&apos;t
        see. See <Link to="/test/ci-cd">CI/CD</Link>.
      </Callout>

      <h2>7. UX testing and security</h2>
      <p>
        UX and security are often at odds — but poor UX can <em>create</em> insecurity. If
        password rules are incomprehensible, users write the password on a sticky note. So
        also test security flows (login, MFA, forgotten password) with real users. Read
        more about <Link to="/sikkerhed/authentication">Authentication</Link>.
      </p>

      <h2>8. Perceived performance</h2>
      <p>
        UX is also about <em>perceived</em> speed: skeleton screens, optimistic updates and
        progress indicators make waiting feel shorter. Combine this with real measurements
        (Core Web Vitals: LCP, INP, CLS) from{' '}
        <Link to="/test/performance">Performance</Link>.
      </p>

      <h2>Exercise</h2>
      <ol>
        <li>
          Pick a web app (your own or a well-known one). Carry out a{' '}
          <strong>heuristic evaluation</strong> against Nielsen&apos;s 10 heuristics: find
          at least 8 problems and give each a severity of 0–4.
        </li>
        <li>
          Write 3 task scenarios. Run a usability test with 3–5 people using think-aloud.
          Record task success, time and problems.
        </li>
        <li>
          Calculate a SUS score from the participants&apos; answers. What does it tell you?
        </li>
        <li>
          Run Lighthouse and axe on the app. Fix the three most important accessibility
          issues and measure again.
        </li>
        <li>
          Design an A/B experiment: hypothesis, metric, variants and estimated sample size.
        </li>
        <li>
          Write a short report: what was the difference between what the UX test revealed
          and what your functional tests already covered?
        </li>
      </ol>
    </LessonLayout>
  )
}
