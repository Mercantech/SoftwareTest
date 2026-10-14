import { Link } from 'react-router-dom'
import Callout from '../../components/Callout'
import CodeBlock from '../../components/CodeBlock'
import LessonLayout from '../../components/LessonLayout'
import LinkTrio from '../../components/LinkTrio'
import MermaidDiagram from '../../components/MermaidDiagram'
import ObjectiveBadge from '../../components/ObjectiveBadge'
import { getObjectiveByPath, objectiveTitle } from '../../data/objectives'

const k6Output = `
     checks.........................: 97.82% ✓ 58680     ✗ 1308
     data_received..................: 412 MB 1.4 MB/s
     http_req_duration..............: avg=182ms  min=8ms  med=96ms  max=9.8s  p(90)=311ms p(95)=842ms p(99)=3.4s
     http_req_failed................: 2.18%  ✓ 1308      ✗ 58680
     http_reqs......................: 59988  199.9/s
     iterations.....................: 59988  199.9/s
     vus............................: 200    min=0       max=200
`

const methodology = `
flowchart TD
  A["Symptom: slow / timeouts"] --> B["Reproduce and measure<br/>baseline and under load"]
  B --> C["Which layer?<br/>client, network, web, API, DB"]
  C --> D["USE method per resource<br/>Utilization, Saturation, Errors"]
  D --> E["Find the bottleneck<br/>profiling, traces, slow query log"]
  E --> F["Form a hypothesis"]
  F --> G["Change ONE thing"]
  G --> H["Measure again"]
  H --> I{"Improved?"}
  I -- No --> F
  I -- Yes --> J{"SLA met?"}
  J -- No --> C
  J -- Yes --> K["Document"]
`

const request = `
sequenceDiagram
  participant B as Browser
  participant N as nginx / Traefik
  participant A as API
  participant C as Cache
  participant D as Database
  B->>N: GET /api/orders
  Note over B,N: DNS + TLS + network
  N->>A: proxy
  A->>C: look up in cache
  C-->>A: miss
  A->>D: SELECT orders
  loop for each order (N+1)
    A->>D: SELECT lines WHERE order_id = ?
  end
  D-->>A: rows
  A-->>N: JSON
  N-->>B: 200 OK
`

const flamegraphConcept = `
flowchart TB
  subgraph FG["Flamegraph (read from the bottom up)"]
    direction TB
    R["Main / request pipeline  100 %"]
    R --> C1["OrdersController.Get  95 %"]
    C1 --> S1["OrderService.GetAll  90 %"]
    S1 --> Q1["EF Core: ToList  70 %"]
    S1 --> J1["JSON serialisation  18 %"]
    Q1 --> N1["Npgsql: waiting for DB  65 %"]
  end
`

const nplus1Bad = `
// N+1: 1 query for orders + N queries for lines (100 orders = 101 queries)
var orders = await db.Orders.ToListAsync();
foreach (var order in orders)
{
    // Lazy loading or an explicit load triggers one query PER order
    order.Lines = await db.OrderLines
        .Where(l => l.OrderId == order.Id)
        .ToListAsync();
}
`

const nplus1Good = `
// Solution 1: eager loading with Include (1-2 queries)
var orders = await db.Orders
    .Include(o => o.Lines)
    .AsSplitQuery()          // avoid a Cartesian explosion with large Include trees
    .ToListAsync();

// Solution 2: projection - fetch only what is needed (less data, no tracking)
var dtos = await db.Orders
    .AsNoTracking()
    .Select(o => new OrderDto(
        o.Id,
        o.CustomerEmail,
        o.Lines.Select(l => new LineDto(l.Sku, l.Quantity)).ToList()))
    .ToListAsync();
`

const logSql = `
// See the actual SQL calls in EF Core (dev/test only)
builder.Services.AddDbContext<AppDbContext>(o => o
    .UseNpgsql(connectionString)
    .LogTo(Console.WriteLine, LogLevel.Information)
    .EnableSensitiveDataLogging());
`

const explain = `
-- PostgreSQL: understand why a query is slow
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE customer_email = 'anna@test.dk' ORDER BY created_at DESC LIMIT 20;

-- Typical bad sign:    Seq Scan on orders  (cost=0.00..18334.00 rows=1 ...)  Rows Removed by Filter: 999999
-- Solution: an index
CREATE INDEX CONCURRENTLY ix_orders_customer_created
    ON orders (customer_email, created_at DESC);
`

const profilingCmds = `
# .NET: collect and view profiling data
dotnet tool install -g dotnet-counters
dotnet tool install -g dotnet-trace
dotnet tool install -g dotnet-gcdump

dotnet-counters monitor --process-id <pid> System.Runtime Microsoft.AspNetCore.Hosting
dotnet-trace collect --process-id <pid> --duration 00:00:30 --format speedscope
# Open the .speedscope.json at https://www.speedscope.app for a flamegraph
`

const otelCode = `
// OpenTelemetry: traces show where the time goes per request
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddOtlpExporter())
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddRuntimeInstrumentation()
        .AddOtlpExporter());
`

const stopwatchCode = `
// Quick local measurement of a specific operation (in benchmark/dev)
var sw = Stopwatch.StartNew();
var result = await service.GetAllAsync();
sw.Stop();
logger.LogInformation("GetAll took {Ms} ms and returned {Count} rows",
    sw.ElapsedMilliseconds, result.Count);

// For precise micro-benchmarks: BenchmarkDotNet
// [MemoryDiagnoser] public class Bench { [Benchmark] public void Metode() { ... } }
`

export default function PerformancePageEn() {
  const objective = getObjectiveByPath('/test/performance')

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

      <h1>Performance: reading tables and finding bottlenecks</h1>

      <p>
        A stress test produces numbers. The value only appears when you can{' '}
        <strong>read</strong> them correctly and <strong>find the cause</strong> of why a
        complex system (browser, proxy, API, cache, database, third party) is slow. This
        page teaches you to read latency, throughput and percentile tables and to work
        systematically.
      </p>

      <h2>Learning objectives</h2>
      <ul>
        <li>Explain latency, throughput, error rate and concurrency — and how they relate.</li>
        <li>Read p50/p95/p99 and understand why averages are misleading.</li>
        <li>Interpret a stress-test table and point out symptoms of saturation.</li>
        <li>Find bottlenecks in the database, code (N+1) and network.</li>
        <li>Explain flamegraphs and distributed tracing, and apply a methodical troubleshooting process.</li>
      </ul>

      <h2>1. The four basic measurements</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Definition</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Latency / response time</td>
            <td>Time from the request being sent to the response being received</td>
            <td>ms</td>
          </tr>
          <tr>
            <td>Throughput</td>
            <td>Number of completed requests per unit of time</td>
            <td>req/s, RPS, TPS</td>
          </tr>
          <tr>
            <td>Error rate</td>
            <td>Share of requests that fail (5xx, timeout)</td>
            <td>%</td>
          </tr>
          <tr>
            <td>Saturation</td>
            <td>How full a resource is (queue, usage)</td>
            <td>%, queue length</td>
          </tr>
        </tbody>
      </table>
      <p>
        Good systems show <strong>constant latency</strong> while throughput grows
        linearly with the load. At the bottleneck the curve bends: throughput flattens out
        (or drops), and latency explodes (queueing).
      </p>

      <h2>2. Percentiles: p50, p95, p99</h2>
      <p>
        A <strong>percentile</strong> states that x % of all requests were faster than the
        value. <em>p95 = 842 ms</em> means: 95 % of users got a response in under 842 ms,
        but 5 % waited longer.
      </p>
      <table>
        <thead>
          <tr>
            <th>Measure</th>
            <th>Tells you</th>
            <th>Use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Average (avg)</td>
            <td>Hides extremes — affected by a few extremely slow calls</td>
            <td>Overview, but never on its own</td>
          </tr>
          <tr>
            <td>p50 (median)</td>
            <td>The &ldquo;typical&rdquo; user</td>
            <td>General feel</td>
          </tr>
          <tr>
            <td>p90 / p95</td>
            <td>Most users, including the fairly slow ones</td>
            <td>Standard in SLOs</td>
          </tr>
          <tr>
            <td>p99 / p99.9</td>
            <td>The tail (tail latency): rare but real waiting times</td>
            <td>Critical systems; many calls per page view</td>
          </tr>
          <tr>
            <td>max</td>
            <td>Worst single case</td>
            <td>Find timeouts and outliers</td>
          </tr>
        </tbody>
      </table>
      <Callout type="warn">
        <strong>Tail latency is amplified.</strong> If a page makes 20 backend calls, and
        each has a 1 % chance of being slow (p99), then{' '}
        <code>1 − 0.99²⁰ ≈ 18 %</code> of page views hit at least one slow call. p99
        therefore matters more than the number suggests.
      </Callout>

      <h3>Example: a k6 result</h3>
      <CodeBlock language="text">{k6Output}</CodeBlock>
      <p>Reading it:</p>
      <ul>
        <li>
          <strong>avg = 182 ms</strong> looks fine, but <strong>p95 = 842 ms</strong> and{' '}
          <strong>p99 = 3.4 s</strong> reveal a long tail.
        </li>
        <li>
          <strong>median (p50) = 96 ms</strong>: most are fast → the system is basically
          OK, but a minority hits something slow (lock, cold cache, GC pause, slow query).
        </li>
        <li>
          <strong>max = 9.8 s</strong> suggests timeouts/retries.
        </li>
        <li>
          <strong>2.18 % errors</strong> is above a typical requirement of &lt; 1 %.
        </li>
        <li>
          <strong>199.9 req/s</strong> with 200 virtual users: with Little&apos;s law
          (<code>L = λ × W</code>), 200 concurrent users at 0.182 s on average would
          theoretically give about 1100 req/s if the users didn&apos;t pause. We only
          reached 200, so either the script contains think time, or the users are sitting
          in a queue somewhere (see the table below for how to find where).
        </li>
      </ul>

      <h2>3. Reading a stepped load table</h2>
      <p>
        The most informative table is the result of a stepwise increase in load. Here you
        can see <em>when</em> the system changes character.
      </p>
      <table>
        <thead>
          <tr>
            <th>Users</th>
            <th>Throughput (req/s)</th>
            <th>p50</th>
            <th>p95</th>
            <th>p99</th>
            <th>Errors</th>
            <th>API CPU</th>
            <th>DB CPU</th>
            <th>DB connections</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>10</td>
            <td>95</td>
            <td>40 ms</td>
            <td>70 ms</td>
            <td>110 ms</td>
            <td>0 %</td>
            <td>12 %</td>
            <td>8 %</td>
            <td>4</td>
          </tr>
          <tr>
            <td>50</td>
            <td>470</td>
            <td>45 ms</td>
            <td>90 ms</td>
            <td>160 ms</td>
            <td>0 %</td>
            <td>45 %</td>
            <td>35 %</td>
            <td>18</td>
          </tr>
          <tr>
            <td>100</td>
            <td>880</td>
            <td>60 ms</td>
            <td>180 ms</td>
            <td>420 ms</td>
            <td>0.1 %</td>
            <td>72 %</td>
            <td>78 %</td>
            <td>38</td>
          </tr>
          <tr>
            <td>200</td>
            <td>910</td>
            <td>190 ms</td>
            <td>850 ms</td>
            <td>3.4 s</td>
            <td>2 %</td>
            <td>75 %</td>
            <td>99 %</td>
            <td>50 (max 50)</td>
          </tr>
          <tr>
            <td>400</td>
            <td>600</td>
            <td>1.2 s</td>
            <td>5.0 s</td>
            <td>timeout</td>
            <td>31 %</td>
            <td>60 %</td>
            <td>100 %</td>
            <td>50 (max 50)</td>
          </tr>
        </tbody>
      </table>

      <h3>How to read the table</h3>
      <ol>
        <li>
          <strong>The knee point:</strong> between 100 and 200 users the curve changes.
          Throughput flattens out at about 900 req/s, while latency rises sharply. The
          system&apos;s capacity is therefore about <strong>900 req/s</strong> — no more,
          regardless of the number of users.
        </li>
        <li>
          <strong>Who is the bottleneck?</strong> API CPU is only 75 %, but <strong>DB CPU
          is 99 %</strong> and the connection pool is full (50/50). The database saturates
          first. Adding more API instances doesn&apos;t help — it actually makes the
          database load worse.
        </li>
        <li>
          <strong>Above capacity, throughput drops</strong> (910 → 600): a classic{' '}
          <em>collapse</em> caused by queueing, retries and timeouts. The system should
          rather reject requests (load shedding, 429/503) than grind to a halt.
        </li>
        <li>
          <strong>Tail before average:</strong> p99 already rose at 100 users (420 ms) — an
          early warning sign before p50 moved.
        </li>
        <li>
          <strong>Error rate</strong> only becomes relevant at 200+, and is just as
          important as latency: a fast error response is not a good response.
        </li>
      </ol>

      <Callout type="info">
        <strong>Rule of thumb:</strong> When throughput no longer grows with the load, but
        latency does — a resource is saturated. Find the resource where utilization
        approaches 100 % or where the queue grows (connection pool, thread pool, disk
        queue).
      </Callout>

      <h2>4. Systematic troubleshooting</h2>
      <MermaidDiagram chart={methodology} />
      <p>
        The <strong>USE method</strong> (Brendan Gregg): for <em>each</em> resource (CPU,
        RAM, disk, network, connection pool, thread pool) ask about
        <strong> Utilization</strong>, <strong>Saturation</strong> and <strong>Errors</strong>.
        For services, use <strong>RED</strong>: Rate, Errors, Duration.
      </p>
      <p>
        <strong>Amdahl&apos;s law:</strong> optimise what takes up the most. If 70 % of the
        time is spent in the database, JSON serialisation that is 2× faster (18 %) can only
        give about 9 % overall improvement. Measure first — never guess.
      </p>

      <h2>5. Where the time goes in a request</h2>
      <MermaidDiagram chart={request} />
      <p>
        A request passes through many layers. Break down the response time:{' '}
        <em>network + TLS</em>, <em>proxy</em>, <em>API code</em>, <em>cache</em>,{' '}
        <em>database</em>, <em>third party</em>, <em>serialisation</em>. Distributed
        tracing (OpenTelemetry) makes it visible per request.
      </p>
      <CodeBlock language="csharp">{otelCode}</CodeBlock>

      <h2>6. Typical bottlenecks</h2>

      <h3>6.1 Database</h3>
      <ul>
        <li>
          <strong>Missing indexes</strong> → <em>Seq Scan</em> on large tables.
        </li>
        <li>
          <strong>Slow queries:</strong> use the slow query log and <code>EXPLAIN ANALYZE</code>.
        </li>
        <li>
          <strong>Locks and deadlocks:</strong> long transactions block others.
        </li>
        <li>
          <strong>Connection pool exhausted:</strong> requests wait for a connection (often
          mistaken for a slow DB).
        </li>
        <li>
          <strong>Overfetching:</strong> <code>SELECT *</code> and too many columns/rows
          (use projection and pagination).
        </li>
      </ul>
      <CodeBlock language="sql">{explain}</CodeBlock>

      <h3>6.2 The N+1 problem</h3>
      <p>
        One query fetches a list, and then one extra query is triggered <em>per
        element</em>. 100 rows give 101 queries. It is invisible with small test data and
        catastrophic in production. Symptoms: high DB latency even though each query is
        fast; many nearly identical queries in the log.
      </p>
      <CodeBlock language="csharp">{nplus1Bad}</CodeBlock>
      <CodeBlock language="csharp">{nplus1Good}</CodeBlock>
      <CodeBlock language="csharp">{logSql}</CodeBlock>
      <Callout type="tip">
        Write an integration test that counts the number of SQL calls for an endpoint and
        fails if the number goes up (a &ldquo;query count budget&rdquo;). That way CI
        catches N+1 in the future — see{' '}
        <Link to="/test/integration">Integration testing</Link>.
      </Callout>

      <h3>6.3 Network</h3>
      <ul>
        <li>
          <strong>Round-trip time (RTT):</strong> many small calls pile up — combine calls
          (batch) or use fewer, larger responses.
        </li>
        <li>
          <strong>Large payloads:</strong> enable gzip/brotli, paginate, avoid sending
          unused fields.
        </li>
        <li>
          <strong>TLS handshake and DNS:</strong> reuse connections (keep-alive, HTTP/2,{' '}
          <code>HttpClientFactory</code>).
        </li>
        <li>
          <strong>Third-party APIs:</strong> timeouts, retries with backoff and a circuit
          breaker (Polly) — a slow dependency can drag the whole system down.
        </li>
        <li>
          <strong>CDN and caching:</strong> static files and cacheable responses should not
          reach the API.
        </li>
      </ul>

      <h3>6.4 Application code and runtime</h3>
      <ul>
        <li>
          <strong>Synchronous blocking</strong> (<code>.Result</code>, <code>.Wait()</code>) →
          thread pool starvation. Use async all the way.
        </li>
        <li>
          <strong>Garbage collection:</strong> many allocations cause GC pauses (p99 spikes).
        </li>
        <li>
          <strong>CPU-heavy code:</strong> regex, serialisation, encryption (bcrypt is
          meant to be slow, but limit the number of concurrent logins).
        </li>
        <li>
          <strong>Missing caching</strong> of expensive, rarely changing data.
        </li>
        <li>
          <strong>Logging:</strong> synchronous, excessive logging can slow things down more
          than expected.
        </li>
      </ul>

      <h2>7. Flamegraphs</h2>
      <p>
        A <strong>flamegraph</strong> is a visualisation of profiling data (stack
        samples). Each bar is a function; the <strong>width</strong> shows what share of
        the time (CPU or waiting) the function — including the functions it calls — has
        used. The Y-axis is call depth (caller at the bottom, callees above). Hunt for the{' '}
        <strong>wide, flat &ldquo;plateaus&rdquo;</strong> at the top: those are hot spots.
      </p>
      <MermaidDiagram chart={flamegraphConcept} />
      <p>
        The diagram is a simplified sketch of the principle; real flamegraphs are
        generated by tools. In the example, 65 % of the time is spent{' '}
        <em>waiting for the database</em> — code optimisation won&apos;t help; the solution
        is queries/indexes.
      </p>
      <CodeBlock language="bash">{profilingCmds}</CodeBlock>
      <ul>
        <li>
          <strong>CPU flamegraph</strong> — what consumes CPU? (hot loops, serialisation).
        </li>
        <li>
          <strong>Off-CPU / wall-clock</strong> — what are we <em>waiting</em> for? (I/O,
          locks).
        </li>
        <li>
          <strong>Differential flamegraph</strong> — compare before/after a change.
        </li>
      </ul>
      <CodeBlock language="csharp">{stopwatchCode}</CodeBlock>

      <h2>8. From measurement to report</h2>
      <table>
        <thead>
          <tr>
            <th>Observation</th>
            <th>Probable cause</th>
            <th>Next step</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>p50 rises linearly with load</td>
            <td>CPU-bound code or an instance that is too small</td>
            <td>CPU profiling; scale up/out</td>
          </tr>
          <tr>
            <td>p50 OK, p99 very high</td>
            <td>GC, locks, cold cache, individual slow queries</td>
            <td>Traces for slow requests; GC counters</td>
          </tr>
          <tr>
            <td>Throughput flattens out, CPU low</td>
            <td>Waiting for something: DB, pool, threads, locks</td>
            <td>Pool metrics, DB wait, thread pool queue</td>
          </tr>
          <tr>
            <td>Throughput drops at higher load</td>
            <td>Collapse (timeouts, retries, thrashing)</td>
            <td>Load shedding, limit retries, backpressure</td>
          </tr>
          <tr>
            <td>Many near-identical queries</td>
            <td>N+1</td>
            <td>Include/projection; query-count test</td>
          </tr>
          <tr>
            <td>Memory rising over time (soak)</td>
            <td>Memory leak</td>
            <td>dotnet-gcdump before/after; remove static references</td>
          </tr>
          <tr>
            <td>Latency rises only for certain users/geographies</td>
            <td>Network, CDN, DNS</td>
            <td>Check RTT, edge caching, payload size</td>
          </tr>
        </tbody>
      </table>

      <p>
        See <Link to="/test/tryk">Stress testing</Link> for how to set up the test, and{' '}
        <Link to="/test/release">Release</Link> for how performance factors into the
        go/no-go decision.
      </p>

      <h2>Exercise</h2>
      <ol>
        <li>
          Use the table in section 3. Determine the capacity, the bottleneck and which
          optimisation you would try first. Justify it with numbers.
        </li>
        <li>
          Create an endpoint with N+1 (e.g. orders and lines), measure p95 with k6 at 50
          users, change it to <code>Include</code>/projection and measure again. How large
          was the improvement?
        </li>
        <li>
          Turn on SQL logging and count the queries per request before/after.
        </li>
        <li>
          Collect a trace with <code>dotnet-trace</code> and open it in speedscope. Which
          function is the widest?
        </li>
        <li>
          Write a short report: observation → hypothesis → change → measurement →
          conclusion.
        </li>
      </ol>
    </LessonLayout>
  )
}
