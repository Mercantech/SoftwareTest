import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'

const loadShapes = `
flowchart LR
  subgraph LOAD["Load test"]
    L1["Ramp up to expected load<br/>hold 10-30 min<br/>ramp down"]
  end
  subgraph STRESS["Stress test"]
    S1["Increase load beyond expected level<br/>until the system breaks<br/>observe failures and recovery"]
  end
  subgraph SOAK["Soak / endurance"]
    K1["Moderate load for many hours<br/>find memory leaks, connection leaks"]
  end
  subgraph SPIKE["Spike test"]
    P1["Sudden large increase<br/>e.g. a campaign or news story"]
  end
`

const testDesignFlow = `
flowchart TD
  A["Define goals and SLA"] --> B["Analyse traffic<br/>users, requests/s, peak"]
  B --> C["Design scenarios and test data"]
  C --> D["Prepare environment<br/>production-like hardware"]
  D --> E["Run baseline<br/>single user"]
  E --> F["Run load, stress, soak"]
  F --> G["Monitor CPU, RAM, IO, DB, network"]
  G --> H["Analyse and find the bottleneck"]
  H --> I{"SLA met?"}
  I -- No --> J["Optimise and repeat"]
  J --> F
  I -- Yes --> K["Report and document capacity"]
`

const arch = `
flowchart LR
  LG["Load generator<br/>k6 / NBomber"] -->|HTTP| LB["Traefik / nginx"]
  LB --> API["API (.NET)"]
  API --> DB[("PostgreSQL")]
  API --> CACHE[("Redis")]
  MON["Prometheus + Grafana"] -.-> API
  MON -.-> DB
  MON -.-> LB
`

const littles = `
flowchart LR
  A["Arrivals: λ = 100 req/s"] --> S["System"]
  S --> B["Response time W = 0.2 s"]
  S --> C["Concurrent in the system<br/>L = λ × W = 20"]
`

const k6Script = `
// k6 script (JavaScript): load test with ramp-up, thresholds and checks
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // ramp up to 50 virtual users
    { duration: '10m', target: 50 },   // hold the load
    { duration: '1m', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_failed:   ['rate<0.01'],           // < 1 % errors
    http_req_duration: ['p(95)<500', 'p(99)<1500'], // SLA: p95 < 500 ms, p99 < 1.5 s
  },
};

export default function () {
  const res = http.get(__ENV.BASE_URL + '/api/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response under 800 ms': (r) => r.timings.duration < 800,
  });
  sleep(1);   // think time: real users wait between actions
}

// Run:  k6 run -e BASE_URL=https://staging.example.dk script.js
`

const k6Stress = `
// Stress: step up until the system breaks
export const options = {
  stages: [
    { duration: '2m',  target: 100 },
    { duration: '2m',  target: 200 },
    { duration: '2m',  target: 400 },
    { duration: '2m',  target: 800 },   // where does it break?
    { duration: '3m',  target: 0 },     // recovery: does the system recover?
  ],
};
`

const nbomber = `
// NBomber (C#): load test written in the same language as the system
using NBomber.CSharp;
using NBomber.Http.CSharp;

var httpClient = new HttpClient();

var scenario = Scenario.Create("hent_produkter", async context =>
{
    var request = Http.CreateRequest("GET", "https://staging.example.dk/api/products");
    var response = await Http.Send(httpClient, request);
    return response;
})
.WithWarmUpDuration(TimeSpan.FromSeconds(10))
.WithLoadSimulations(
    Simulation.RampingInject(rate: 50, interval: TimeSpan.FromSeconds(1),
                             during: TimeSpan.FromMinutes(2)),
    Simulation.Inject(rate: 50, interval: TimeSpan.FromSeconds(1),
                      during: TimeSpan.FromMinutes(10))
);

NBomberRunner
    .RegisterScenarios(scenario)
    .Run();
`

const compose = `
# docker-compose.loadtest.yml - limited resources make capacity measurable and reproducible
services:
  api:
    build: ./api
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 1G
  db:
    image: postgres:16-alpine
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2G
    shm_size: 256mb
  k6:
    image: grafana/k6
    volumes:
      - ./loadtest:/scripts
    command: run /scripts/script.js
    environment:
      BASE_URL: http://api:8080
    depends_on:
      - api
`

const dockerStats = `
# See live resource usage during the test
docker stats

# On a Linux host: deeper analysis
top -H                 # CPU per thread
free -m                # memory
iostat -x 1            # disk IO (utilization, await)
ss -s                  # network connections
dotnet-counters monitor --process-id 1234 System.Runtime   # .NET: GC, threadpool, requests
`

export default function TrykPageEn() {
  const objective = getObjectiveByPath('/test/tryk')

  return (
    <LessonLayout module="test">
      <header>
        {objective ? (
          <p>
            <ObjectiveBadge level={objective.level} />{' '}
            <strong>Objective {objective.id}:</strong> {objectiveTitle(objective, 'en')}
          </p>
        ) : null}
        {objective ? (
          <LinkTrio
            sitePath={objective.sitePath}
            notionUrl={objective.notionUrl}
            repoUrl={objective.repoUrl}
          />
        ) : null}
      </header>

      <h1>Stress testing: load, stress and hardware</h1>

      <p>
        A <strong>stress test</strong> (performance or load test) investigates how the
        system behaves when many people use it at the same time. Functional tests answer
        &ldquo;does it work?&rdquo;; stress tests answer &ldquo;does it work{' '}
        <em>fast enough, stably enough and for long enough</em> — on the hardware we
        have?&rdquo;
      </p>

      <h2>Learning objectives</h2>
      <ul>
        <li>Distinguish between load, stress, soak and spike tests and choose the right one.</li>
        <li>Define measurable requirements (SLA/SLO) and turn them into thresholds.</li>
        <li>Design a stress test with realistic scenarios and test data.</li>
        <li>Write a simple k6 script and explain an NBomber example in C#.</li>
        <li>Include hardware (CPU, RAM, IO, network) in test design and capacity planning.</li>
      </ul>

      <h2>1. Types of stress tests</h2>
      <MermaidDiagram chart={loadShapes} />
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Question</th>
            <th>Load</th>
            <th>Duration</th>
            <th>Finds</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Smoke/baseline</td>
            <td>Does the script work, and what is the reference?</td>
            <td>1–5 users</td>
            <td>Minutes</td>
            <td>Errors in the test itself, baseline timings</td>
          </tr>
          <tr>
            <td>Load</td>
            <td>Do we meet the SLA at the expected load?</td>
            <td>Normal to peak</td>
            <td>10–60 min</td>
            <td>Slow endpoints, wrong settings</td>
          </tr>
          <tr>
            <td>Stress</td>
            <td>Where does it break, and how does it fail?</td>
            <td>Above peak, until failure</td>
            <td>30–60 min</td>
            <td>Limits, graceful degradation, recovery</td>
          </tr>
          <tr>
            <td>Soak (endurance)</td>
            <td>Does it hold up over time?</td>
            <td>70–80 % of peak</td>
            <td>4–24+ hours</td>
            <td>Memory leaks, connection leaks, logs/disk filling up</td>
          </tr>
          <tr>
            <td>Spike</td>
            <td>Do we survive sudden traffic?</td>
            <td>Sudden 10×</td>
            <td>Short bursts</td>
            <td>Autoscaling delay, queue breakdown</td>
          </tr>
          <tr>
            <td>Capacity test</td>
            <td>How many users can a single node handle?</td>
            <td>Stepwise increase</td>
            <td>Hours</td>
            <td>Scaling and sizing data</td>
          </tr>
        </tbody>
      </table>

      <h2>2. Requirements: SLA, SLO and SLI</h2>
      <p>
        Without goals you can neither pass nor fail a stress test. Use these terms:
      </p>
      <ul>
        <li>
          <strong>SLI</strong> (Service Level Indicator) — what you measure: latency,
          error rate, throughput.
        </li>
        <li>
          <strong>SLO</strong> (Objective) — internal target: &ldquo;99 % of calls under
          300 ms&rdquo;.
        </li>
        <li>
          <strong>SLA</strong> (Agreement) — contractual promise to the customer, often
          with a penalty: &ldquo;99.9 % uptime per month&rdquo;.
        </li>
      </ul>
      <table>
        <thead>
          <tr>
            <th>Uptime</th>
            <th>Allowed downtime per year</th>
            <th>per month</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>99 %</td>
            <td>3.65 days</td>
            <td>7.2 hours</td>
          </tr>
          <tr>
            <td>99.9 % (&ldquo;three nines&rdquo;)</td>
            <td>8.76 hours</td>
            <td>43.8 min</td>
          </tr>
          <tr>
            <td>99.99 %</td>
            <td>52.6 min</td>
            <td>4.4 min</td>
          </tr>
        </tbody>
      </table>
      <Callout type="tip">
        Phrase requirements as <strong>percentiles</strong>, not averages:{' '}
        &ldquo;p95 &lt; 500 ms at 200 req/s and under 1 % errors.&rdquo; Averages hide the
        slow users. See <Link to="/test/performance">Performance</Link> for how to
        interpret percentiles.
      </Callout>

      <h2>3. Test design: from requirement to scenario</h2>
      <MermaidDiagram chart={testDesignFlow} />

      <h3>A realistic load profile</h3>
      <ul>
        <li>
          <strong>Usage patterns:</strong> use analytics/log files to find the distribution
          (e.g. 70 % browsing, 25 % search, 5 % checkout). Don&apos;t just test a single
          endpoint.
        </li>
        <li>
          <strong>Think time:</strong> real users pause. Without pauses you are testing
          &ldquo;requests per second&rdquo;, not &ldquo;users&rdquo;.
        </li>
        <li>
          <strong>Test data:</strong> varied, realistic data (not the same product every
          time — then everything hits the cache). Enough data in the database (e.g.
          millions of rows), otherwise indexes and queries won&apos;t show their real
          behaviour.
        </li>
        <li>
          <strong>Open vs. closed model:</strong> <em>closed</em> = a fixed number of users
          (who wait for a response); <em>open</em> = new arrivals per second regardless of
          response time (more realistic for the web and reveals queueing).
        </li>
        <li>
          <strong>Warm-up:</strong> discard the first few minutes (JIT, caches, connection
          pools).
        </li>
      </ul>

      <h3>Little&apos;s law — a useful rule of thumb</h3>
      <MermaidDiagram chart={littles} />
      <p>
        <code>L = λ × W</code>: number of concurrent requests = arrival rate × average
        response time. If the response time rises (a bottleneck), the queue grows
        proportionally — and suddenly the system is full even though the arrival rate is
        unchanged.
      </p>

      <h2>4. Tools</h2>
      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>Language</th>
            <th>Strengths</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>k6 (Grafana)</td>
            <td>JavaScript scripts, Go core</td>
            <td>Easy to get started, thresholds, CI-friendly, low resource usage</td>
          </tr>
          <tr>
            <td>NBomber</td>
            <td>C# / F#</td>
            <td>Same language as the .NET system, can test non-HTTP (gRPC, queues)</td>
          </tr>
          <tr>
            <td>JMeter</td>
            <td>GUI + XML</td>
            <td>Mature, many plugins, broad protocol support</td>
          </tr>
          <tr>
            <td>Locust</td>
            <td>Python</td>
            <td>Code as scenarios, distributed</td>
          </tr>
          <tr>
            <td>Bombardier / wrk / hey</td>
            <td>CLI</td>
            <td>Fast quick-checks of a single endpoint</td>
          </tr>
        </tbody>
      </table>

      <h3>k6 — load test with thresholds</h3>
      <CodeBlock language="javascript">{k6Script}</CodeBlock>
      <p>
        Thresholds turn the test into an <strong>automatic gate</strong>: k6 exits with an
        error code if the SLA is breached, and the pipeline goes red (cf.{' '}
        <Link to="/test/ci-cd">CI/CD</Link>).
      </p>

      <h3>k6 — stress profile</h3>
      <CodeBlock language="javascript">{k6Stress}</CodeBlock>

      <h3>NBomber — C# example</h3>
      <CodeBlock language="csharp">{nbomber}</CodeBlock>

      <Callout type="warn">
        <strong>Remember the load generator itself.</strong> If the test machine runs out
        of CPU or network, you are measuring the generator&apos;s limits — not the
        system&apos;s. Monitor it too, and spread the load across several generators if
        needed. Never run a stress test against production without an agreement, and never
        against systems you don&apos;t own.
      </Callout>

      <h2>5. Hardware in the test design</h2>
      <p>
        Performance is an interplay between code and hardware. A test without knowledge of
        the environment says almost nothing: &ldquo;200 req/s&rdquo; on a laptop tells you
        nothing about the production server.
      </p>
      <MermaidDiagram chart={arch} />

      <table>
        <thead>
          <tr>
            <th>Resource</th>
            <th>Typical symptoms when lacking</th>
            <th>What do you monitor?</th>
            <th>Typical remedies</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>CPU</td>
            <td>High latency, CPU near 100 %, queues</td>
            <td>CPU %, run queue, throttling in containers</td>
            <td>Optimise code, cache, more cores/instances</td>
          </tr>
          <tr>
            <td>RAM</td>
            <td>Swapping, GC pauses, OOM kills</td>
            <td>Working set, GC time, memory growth</td>
            <td>Find leaks, smaller objects, more RAM</td>
          </tr>
          <tr>
            <td>Disk IO</td>
            <td>Slow queries, high iowait</td>
            <td>IOPS, latency (await), queue depth</td>
            <td>SSD/NVMe, indexes, batched writes</td>
          </tr>
          <tr>
            <td>Network</td>
            <td>Timeouts, packet loss, saturated bandwidth</td>
            <td>Bandwidth, retransmissions, open connections</td>
            <td>Compression, CDN, fewer/smaller calls</td>
          </tr>
          <tr>
            <td>Database</td>
            <td>Connection pool exhausted, locks, slow queries</td>
            <td>Active connections, slow query log, lock waits</td>
            <td>Indexes, query tuning, read replicas, pool size</td>
          </tr>
          <tr>
            <td>Threads/connections</td>
            <td>Thread pool starvation, socket exhaustion</td>
            <td>Thread pool queue, TIME_WAIT</td>
            <td>Async all the way, HttpClientFactory</td>
          </tr>
        </tbody>
      </table>

      <h3>Principles</h3>
      <ul>
        <li>
          <strong>Production-like environment:</strong> same hardware class, same
          configuration, same versions. If you test on a smaller machine, extrapolate the
          result cautiously — performance rarely scales linearly.
        </li>
        <li>
          <strong>Isolate:</strong> no other processes or &ldquo;noisy neighbours&rdquo; on
          the same VM during the measurement.
        </li>
        <li>
          <strong>Resource limits:</strong> set CPU/RAM limits in Docker to make the test
          reproducible (see below).
        </li>
        <li>
          <strong>Measure all layers at the same time:</strong> load generator, load
          balancer, API, database. The bottleneck is rarely where you think it is.
        </li>
        <li>
          <strong>Document the environment</strong> in the test report: CPU model, cores,
          RAM, disk type, network, OS, runtime version, config.
        </li>
      </ul>
      <CodeBlock language="yaml">{compose}</CodeBlock>
      <CodeBlock language="bash">{dockerStats}</CodeBlock>

      <h3>Capacity planning</h3>
      <p>
        When the test shows that a single instance (2 vCPU, 1 GB) handles 300 req/s within
        the SLA, and the expected peak is 1000 req/s with a 30 % safety margin (1300),
        you need <code>⌈1300 / 300⌉ = 5</code> instances — provided that the database can
        keep up too. This is exactly where hardware becomes part of the test: the numbers
        turn into concrete purchasing and scaling decisions.
      </p>

      <h2>6. Reporting</h2>
      <p>A good test report contains:</p>
      <ul>
        <li>Goals/SLA, test type, scenarios and load profile.</li>
        <li>Environment description (hardware and versions).</li>
        <li>Results: throughput, p50/p95/p99, error rate, resource usage over time.</li>
        <li>Findings: where did the bottleneck occur? Evidence (graphs, profiling output).</li>
        <li>Conclusion: pass/fail; recommendations; next steps.</li>
      </ul>
      <p>
        Interpretation and the hunt for the root cause are described on the{' '}
        <Link to="/test/performance">Performance</Link> page.
      </p>

      <h2>Exercise</h2>
      <ol>
        <li>
          Pick an endpoint in one of your projects and define an SLA (e.g. p95 &lt; 300 ms
          at 50 concurrent users).
        </li>
        <li>Install k6 and write a load script with thresholds. Run it locally.</li>
        <li>
          Start the API in Docker with <code>cpus: 1</code> and <code>memory: 512M</code>.
          Run a stress script and find the point where p95 exceeds the SLA.
        </li>
        <li>
          Repeat with <code>cpus: 2</code>. Did capacity scale linearly? Why/why not?
        </li>
        <li>
          Observe <code>docker stats</code> during the test. Which resource saturates
          first?
        </li>
        <li>Write a one-page test report using the template above.</li>
      </ol>
    </LessonLayout>
  )
}
