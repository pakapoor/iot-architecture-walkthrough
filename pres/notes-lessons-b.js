// Presenter notes: the Correctness & trade-offs deep dives (23–25), shown as flows on the main diagram.
// Format: see pres/notes.js (flow 1) and registerFlow(). Inside views use the close-up SVG coordinates in tools/svgs.py.

// ---------- 23 · Tenant isolation ----------
registerFlow(23, {
  name: 'Tenant isolation',
  intro: { h: 'Thousands of tenants share one platform. Is a dashboard filter enough to keep them apart?', b: [
    'Ingestion, Kafka, Flink state, workflows, caches and replay are all <b>shared</b> between tenants.',
    'A <code>WHERE tenant_id = …</code> on the dashboard protects one read path, and nothing else.',
    'We follow <b>Acme Retail</b> and <b>Beta Mart</b> through every hop where their data could mix.',
    'Watch for two contracts: <b>who can see what</b>, and <b>who can use how much</b>.'] },
  steps: [
    ['a-edge', 'Acme and Beta share everything after their own sites.', [
      'Each tenant has its own sites and edge pairs; from the Cloud Gateway on, <b>everything is shared</b>.',
      'Sharing is what keeps the platform affordable at thousands of tenants.',
      'So isolation cannot come from separate hardware; it has to travel <b>with the data</b>.',
      'The question is where tenant identity is decided, and whether every hop respects it.']],
    ['a-gw', 'The authenticated gateway decides identity once, at the door.', [
      'The certificate binds a <b>site gateway</b> to its allowed tenant, sites and devices.',
      'The registry checks <b>every device inside a batch</b>, not just the envelope.',
      'Every reading is tagged with the tenant the gateway resolved.',
      'Example design: identity is bound here, and every later hop trusts only this tag.']],
    ['a-gw', 'A payload that claims tenant = beta is ignored.', [
      'A payload can say anything; a buggy or hostile device could claim another tenant.',
      'Identity comes from the <b>certificate and the registry</b>, never from the payload.',
      'We rejected trusting <b>payload tenant tags</b>, and treating per-request rate limits as complete isolation.',
      'Quotas bound how much a tenant can send; they say nothing about whose data it is.']],
    ['a-kafka', 'Kafka topics are shared; keys are tenant-qualified.', [
      'Two shared topics for every tenant: <b>heartbeats</b> and <b>telemetry</b>.',
      'The key is <b>tenant + device</b>, and every message carries its tenant_id.',
      'No topic per tenant: fairness was already enforced at the gateway.',
      'Replay reads the same tagged messages, so a rewind cannot mix tenants either.']],
    ['a-flink', 'Flink state, timers and incident IDs all include the tenant.', [
      'Keyed state is keyed by <b>tenant + device</b>, so timers are too.',
      '<b>acme:CAM-14</b> and <b>beta:CAM-14</b> are different keys, even with the same device name.',
      'Incident IDs are <b>tenant + device + outage generation</b>.',
      'Rules are per tenant as well: overrides come from the control plane.']],
    ['a-act', 'Workflows and tickets carry the same identity.', [
      'The Temporal workflow ID is <b>tenant + device + outage generation</b>.',
      'Two tenants can never land on the same workflow, or update each other\'s ticket.',
      'Integrations, quiet hours and digests are <b>tenant configuration</b>, not global settings.']],
    ['a-stor', 'Caches and stores are shared; every key and query is scoped.', [
      'Redis keys and channels carry the tenant: <code>dev:{acme:site-07}:CAM-14</code>, <code>live:acme</code>.',
      'Every ClickHouse and MongoDB query <b>starts with tenant_id</b>, and so does every sort key and index.',
      'Shared tables, no per-tenant partitions: isolation <b>by design</b>, not a filter added later.',
      'A cache key without the tenant is a cross-tenant leak waiting to happen.']],
    ['a-dash', 'Reads and replay are authorized on the server.', [
      'Every REST call resolves <b>role + tenant + sites</b> and scopes the query server-side.',
      '<b>SSE subscriptions and replay cursors</b> are authorized the same way as queries.',
      'A client-side filter is <b>not a boundary</b>: the server never sends another tenant\'s data.',
      'Trade-off: test cross-tenant access at <b>every</b> boundary, not just the dashboard.']],
    ['a-obsp', 'Resource budgets: performance isolation is a separate contract.', [
      'Distributed <b>byte and reading quotas</b> bound admission; <b>query and stream budgets</b> bound dashboards.',
      'Authorization isolation and performance isolation are <b>different contracts</b>.',
      'We measure <b>per-tenant freshness</b> to prove one tenant is not slowing another.',
      'Exceptional workloads may need a <b>separate capacity cell</b>.']]
  ],
  recap: { h: 'Identity scope follows the data through every hop.', b: [
    '<b>Decide identity once</b>: certificate and registry at the gateway, never the payload.',
    '<b>Carry it everywhere</b>: Kafka keys, Flink state, workflow IDs, cache keys, queries.',
    '<b>Authorize on the server</b>: REST, SSE subscriptions and replay cursors.',
    '<b>Budget the shared capacity</b>, and measure freshness per tenant.'] }
}, {
  1: { steps: [   // tenant-level edge close-up (EDGE_SVG)
    { h: 'Acme Retail: 214 sites, one edge pair each.', hl: [[40, 60, 400, 300], [460, 60, 400, 300]], at: [345, 268], b: [
      'Every Acme site connects through its own <b>edge pair</b>.',
      'Devices never reach the cloud directly.'] },
    { h: 'Beta Mart\'s sites follow the same pattern.', hl: [[880, 60, 150, 300]], lab: [[890, 300, 'Beta Mart · same pattern', '#B45309']], b: [
      'Beta\'s sites, and every other tenant\'s, connect the same way.',
      'Up to here, nothing is shared.'] },
    { h: 'Every uplink ends at one shared Cloud Gateway.', hl: [[1080, 150, 200, 130]], path: [[345, 268], [240, 306], [240, 384], [1060, 384], [1060, 215], [1180, 215]], b: [
      'From here on, Acme and Beta share <b>every component</b>.',
      'So tenant identity has to be decided here, and carried from here.'] }] },
  2: { steps: [   // Cloud Gateway close-up (GW_SVG)
    { h: 'Acme Site-07\'s envelope arrives.', hl: [[20, 46, 250, 54]], at: [240, 73], b: [
      'Envelopes arrive from many tenants at the same gateway.',
      'This one comes from <b>Acme Site-07</b>.'] },
    { h: '1 · mTLS: the certificate names the site gateway.', hl: [[325, 46, 200, 194]], path: [[240, 73], [318, 73], [495, 210]], lab: [[337, 196, 'cert ✓ Site-07']], b: [
      'The certificate identifies the <b>site gateway</b> and the devices it may speak for.',
      'An unknown certificate never gets further.'] },
    { h: '2 · The registry checks every device in the batch.', hl: [[570, 46, 200, 194]], path: [[495, 210], [740, 210]], lab: [[582, 196, 'tenant = acme']], b: [
      'Each device inside the batch is mapped to its tenant <b>from the registry</b>.',
      'A device not allowed for this gateway is rejected, even inside a valid envelope.'] }] },
  3: { steps: [
    { h: 'A batch claims tenant = beta in its payload.', hl: [[20, 46, 250, 54]], at: [240, 73], lab: [[34, 262, 'payload says: tenant = beta', '#DC2626']], b: [
      'A buggy or hostile device writes another tenant\'s name into its payload.',
      'If any hop trusted that field, Beta\'s data could be overwritten.'] },
    { h: 'The certificate and registry decide instead.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], path: [[240, 73], [318, 73], [495, 210], [740, 210]], lab: [[582, 196, 'tenant = acme']], b: [
      'The resolved tenant is <b>acme</b>, whatever the payload says.',
      'We rejected trusting <b>payload tenant tags</b>.'] },
    { h: 'Rate limits are not isolation either.', hl: [[815, 30, 330, 226], [20, 280, 740, 110]], path: [[740, 210], [808, 143], [1115, 226]], b: [
      'Quotas bound <b>how much</b> a tenant can send.',
      'They say nothing about <b>whose data</b> it is: that is authorization.',
      'We rejected treating per-request rate limits as complete isolation.'] }] },
  4: { steps: [   // Kafka close-up (KAFKA_SVG)
    { h: 'Tenant-tagged readings arrive from ingestion.', hl: [[20, 130, 170, 100]], at: [160, 200], b: [
      'Every reading carries the tenant the gateway resolved.',
      'Ingestion builds the key <b>tenant + device</b>.'] },
    { h: 'Shared topics, tenant-qualified keys.', hl: [[240, 14, 820, 306]], path: [[160, 200], [232, 180], [420, 126], [789, 126]], b: [
      'Acme and Beta share the <b>heartbeats</b> and <b>telemetry</b> topics.',
      'In this example, Acme CAM-14 hashes to <b>P2</b> and Beta SNS-07 to <b>P0</b>.',
      'Every message carries its <b>tenant_id</b>.'] },
    { h: 'Fairness was enforced before Kafka.', hl: [[240, 334, 820, 58]], at: [789, 126], b: [
      'Per-tenant quotas at the gateway: <b>no topic per tenant</b>.',
      'A replay reads the same tagged messages, so it cannot mix tenants.'] }] },
  5: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'keyBy: every key includes the tenant.', hl: [[232, 40, 170, 200]], path: [[170, 85], [226, 85], [382, 140]], lab: [[246, 262, 'key = acme + CAM-14']], b: [
      'Keyed state is partitioned by <b>tenant + device</b>.',
      'Two tenants can use the same device name without ever sharing state.'] },
    { h: 'Timers and rules follow the same key.', hl: [[736, 20, 300, 240], [444, 268, 250, 74]], path: [[382, 140], [438, 140], [664, 140], [730, 140], [1006, 230]], lab: [[750, 178, 'acme:CAM-14 · Acme\'s rules']], b: [
      'CAM-14\'s timer belongs to <b>acme:CAM-14</b>.',
      'The rule engine applies <b>Acme\'s</b> overrides, broadcast from the control plane.'] },
    { h: 'Incident IDs carry the tenant too.', hl: [[1104, 20, 300, 56]], path: [[1006, 230], [1036, 140], [1070, 140], [1070, 48], [1374, 48]], b: [
      'The incident ID is <b>tenant + device + outage generation</b>.',
      'Every downstream system inherits that scope.'] }] },
  6: { steps: [   // Action Execution close-up (ACT_SVG)
    { h: 'The incident arrives with its tenant-qualified identity.', hl: [[20, 120, 150, 110]], at: [150, 210], b: [
      'Flink emits the transition with its <b>tenant-qualified</b> incident ID.'] },
    { h: 'The workflow ID includes the tenant.', hl: [[880, 14, 390, 300], [898, 52, 354, 28]], path: [[150, 160], [226, 160], [400, 165], [436, 169], [630, 169], [666, 169], [840, 169], [876, 169], [1240, 66]], b: [
      'workflowId = <b>tenant + device + outage generation</b>.',
      'Two tenants can never share a workflow, even for the same device name.'] },
    { h: 'Tickets and integrations stay per tenant.', hl: [[1310, 24, 190, 130], [1310, 184, 190, 130]], path: [[1240, 66], [1270, 90], [1306, 90], [1480, 138]], b: [
      'The ticket upsert is idempotent by a correlation ID that includes the tenant.',
      'Quiet hours, digests and integrations are <b>tenant configuration</b>.'] }] },
  7: { steps: [   // Storage close-up (STOR_SVG) and store details
    { h: 'One shared storage layer for every tenant.', hl: [[272, 20, 250, 82], [272, 112, 250, 82], [272, 204, 250, 82], [272, 388, 250, 82]], b: [
      'Redis, ClickHouse and MongoDB are <b>shared</b> by all tenants.',
      'Every row, key and document carries <b>tenant_id</b>.'] },
    { svg: 'redis', h: 'Redis keys and channels carry the tenant.', hl: [[20, 44, 900, 170]], b: [
      'Keys like <code>dev:{acme:site-07}:CAM-14</code> and channels like <code>live:acme</code> are tenant-scoped.',
      'A cache key without the tenant would serve one tenant\'s value to another.'] },
    { svg: 'chhot', h: 'ClickHouse: the sort key leads with tenant_id.', hl: [[24, 234, 692, 22], [750, 10, 760, 196]], b: [
      'A scoped query reads only that tenant\'s blocks.',
      'Scoping is done by <b>server-side authorization</b>, not by the client.'] },
    { svg: 'mongo', h: 'MongoDB: every index starts with tenant_id.', hl: [[680, 10, 830, 230], [680, 260, 830, 130]], b: [
      'Device, site and rule lookups all begin with <b>tenant_id</b>.',
      'Isolation <b>by design</b>, not a filter added later.'] }] },
  8: { steps: [   // Dashboards close-up (DASH_SVG)
    { h: 'Every call resolves role, tenant and sites.', hl: [[490, 284, 320, 90]], at: [780, 340], b: [
      'The token gives <b>role + tenant + sites</b>.',
      'That scope is applied to every query, <b>on the server</b>.'] },
    { h: 'SSE subscriptions and replay cursors are authorized too.', hl: [[490, 64, 320, 96]], path: [[780, 340], [780, 140]], b: [
      'The stream hub subscribes <b>per tenant</b>.',
      'A replay cursor is checked like a query: it cannot reach another tenant\'s events.'] },
    { h: 'Acme\'s admin only ever sees Acme.', hl: [[1200, 20, 310, 370]], path: [[780, 140], [830, 120], [1196, 120], [1470, 186]], b: [
      'A client-side filter is <b>not a boundary</b>: other tenants\' data is never in the response.',
      'Cross-tenant access is tested at every boundary.'] }] },
  9: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'Admission budgets, measured per tenant.', hl: [[240, 190, 310, 140]], at: [530, 310], b: [
      'Distributed <b>byte and reading quotas</b> bound what each tenant can send.',
      'Query and stream budgets bound what each tenant can read.'] },
    { h: 'Freshness per tenant proves performance isolation.', hl: [[570, 30, 310, 140], [240, 346, 1260, 50]], path: [[530, 310], [560, 180], [860, 150]], b: [
      'Averages hide the tenant who is slowed down.',
      'Per-tenant p99 freshness shows Acme is still on time while Beta is busy.'] },
    { h: 'Exceptional workloads may need their own cell.', hl: [[900, 190, 310, 140], [1250, 30, 250, 300]], path: [[860, 150], [890, 180], [1190, 310]], b: [
      'Authorization isolation and performance isolation are <b>different contracts</b>.',
      'A tenant that outgrows shared headroom can move to a <b>separate capacity cell</b>.'] }] }
});

// ---------- 24 · Live & history consistency ----------
registerFlow(24, {
  name: 'Live & history consistency',
  intro: { h: 'The live chart shows a point that history does not have yet. Or a reconnect lands on a different pod.', b: [
    'Flink sends each reading two ways: a <b>live push</b> to open dashboards, and a <b>history write</b> to ClickHouse.',
    'Those two writes are <b>not atomic</b>; each becomes visible at its own time.',
    'We follow thermostat <b>TH-05</b> at Acme Site-07 into an open dashboard, through a race, a reconnect and a late correction.',
    'Watch for one idea: a <b>snapshot plus a cursor</b> bridges history and the live stream.'] },
  steps: [
    ['a-flink', 'TH-05\'s reading reaches Flink, and two writes go out in parallel.', [
      'Flink deduplicates and enriches the reading, then fans it out.',
      'The <b>live update</b> goes to the dashboard service; the <b>raw row</b> goes to ClickHouse.',
      'They run in parallel: neither waits for the other.',
      'Every update carries a <b>stable event ID</b> and a <b>version</b>.']],
    ['a-stor', 'Parallel writes are not atomic.', [
      'ClickHouse may make the row visible <b>later</b> than the live stream delivers it.',
      'So for a moment, the live chart and the history query disagree.',
      'We rejected assuming parallel writes <b>become visible together</b>, or that Pub/Sub stores missed events.']],
    ['a-dash', 'The race: load history, then subscribe, and lose what fell in between.', [
      'A page opens: it loads history over REST, then opens the SSE stream.',
      'An update that lands <b>between the two</b> is in neither: a silent gap.',
      'A plain pub/sub channel only delivers to listeners connected <b>right now</b>.']],
    ['a-dash', 'The fix: a consistent snapshot, published with its exact stream position.', [
      'Example: each snapshot is one consistent version, with the <b>exact stream position</b> it already includes.',
      'The client subscribes from that position and replays <b>only later events</b>.',
      'A partitioned stream may need <b>several positions</b>, one per partition.',
      'Never pair an old snapshot with the <b>latest</b> cursor: that skips updates.']],
    ['a-stor', 'A retained, shared event stream serves the replay.', [
      'Example: a retained <b>Redis Stream</b> holds recent live updates for each tenant.',
      'Because it is shared, <b>any dashboard pod</b> can replay from a position.',
      'Retention defines how far back a reconnect can resume.']],
    ['a-dash', 'A reconnect lands on another pod, and resumes where it left off.', [
      'The browser reconnects with <b>Last-Event-ID</b>; a different pod picks it up.',
      'That pod replays from the shared stream: no gap, no duplicate.',
      'If the position has <b>expired</b>, the client gets a new consistent snapshot first.',
      'Slow clients get bounded queues and <b>coalesced</b> updates.']],
    ['a-flink', 'A late reading arrives, and a correction writes a new version.', [
      'Flink allows bounded lateness, <b>e.g. 30 seconds</b>; later events take a correction path.',
      'The correction writes a <b>new version</b> of the affected rollup.',
      'Stable event IDs and <b>monotonic versions</b> mean an older value never overwrites a newer one.']],
    ['a-stor', 'History reads deduplicate, and pick the latest revision.', [
      'Replayed raw rows share a <b>stable event ID</b>, so reads deduplicate them.',
      'Rollups carry a <b>version</b>; queries select the latest revision.',
      'A <b>late-correction horizon</b> bounds how far back corrections can reach.',
      'A sampled archive cannot recreate complete raw history.']],
    ['a-dash', 'The UI shows freshness, so staleness is never hidden.', [
      'Live values show their <b>age</b>; history shows when it was last corrected.',
      'Late corrections <b>converge</b>, and the user can see when data is behind.',
      'Trade-off: define retention, a correction horizon and slow-client limits up front.']]
  ],
  recap: { h: 'A snapshot plus a cursor bridges history and the live stream.', b: [
    '<b>Not atomic</b>: live and history become visible at different times.',
    '<b>Snapshot + exact position</b>, then replay only later events.',
    '<b>Shared, retained stream</b>: any pod can resume; an expired cursor gets a new snapshot.',
    '<b>Stable IDs and versions</b>: deduplicated history, no regressions.',
    '<b>Show freshness</b>, never hide staleness.'] }
}, {
  1: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'TH-05\'s reading is deduplicated and enriched.', hl: [[20, 150, 170, 90], [444, 30, 250, 220]], path: [[170, 195], [226, 195], [382, 140], [438, 140], [664, 200]], b: [
      'Duplicates are dropped by <b>boot/session + stream + sequence</b>.',
      'Device metadata is joined in: type, tenant, site.'] },
    { h: 'Two outputs leave at once: live and raw.', hl: [[1104, 152, 300, 56], [1104, 218, 300, 56]], path: [[664, 200], [694, 140], [1036, 140], [1070, 140], [1070, 180], [1374, 180]], b: [
      'The <b>live update</b> goes to the dashboard service; the <b>raw row</b> to ClickHouse.',
      'Two writes, <b>not one transaction</b>.'] },
    { h: 'Each update carries a stable event ID and a version.', hl: [[1104, 152, 300, 56]], at: [1374, 180], lab: [[740, 300, 'stable event ID · version 1', '#1D4ED8']], b: [
      'The same ID and version travel on both paths.',
      'That is what lets the two sides be reconciled later.'] }] },
  2: { steps: [   // Storage close-up (STOR_SVG)
    { h: 'Flink writes every tier in parallel.', hl: [[20, 150, 170, 100], [272, 20, 250, 82], [272, 112, 250, 82]], path: [[170, 200], [230, 200], [230, 152], [255, 152]], b: [
      'Live state goes to <b>Redis</b>; raw rows go to <b>ClickHouse hot</b>.',
      'Each store makes data visible on its own schedule.'] },
    { h: 'The live path can run ahead of history.', hl: [[848, 64, 264, 90], [848, 170, 264, 90]], at: [1090, 140], b: [
      '<b>Live (SSE)</b> may already show the point; <b>Charts (REST)</b> may not.',
      'For a moment, the two views disagree.'] },
    { h: 'We rejected assuming the writes appear together.', hl: [[272, 20, 250, 82], [272, 112, 250, 82]], at: [500, 150], b: [
      'Parallel writes do not become visible <b>atomically</b>.',
      'And Pub/Sub does not store events for listeners who were not connected.'] }] },
  3: { steps: [   // Dashboards close-up (DASH_SVG)
    { h: 'A page opens: history first, over REST.', hl: [[490, 174, 320, 96], [20, 170, 180, 100]], path: [[200, 220], [486, 220], [785, 222]], b: [
      'The page loads TH-05\'s recent history from ClickHouse.'] },
    { h: 'Then it subscribes to the live stream.', hl: [[490, 64, 320, 96]], path: [[785, 222], [785, 140]], b: [
      'The SSE hub starts pushing <b>new</b> updates.'] },
    { h: 'An update in between is lost.', hl: [[20, 40, 180, 110], [490, 64, 320, 96]], at: [785, 140], lab: [[240, 120, 'update lost in the gap', '#DC2626']], b: [
      'An update published after the history read but before the subscription is in <b>neither</b>.',
      'Nothing errors: the chart is just <b>silently wrong</b>.'] }] },
  4: { steps: [
    { h: 'The snapshot carries the exact position it includes.', hl: [[490, 174, 320, 96]], at: [785, 222], lab: [[240, 250, 'snapshot · includes position P', '#15803D']], b: [
      'Example: the snapshot is one consistent version, read together with its stream position.'] },
    { h: 'The client replays everything after that position.', hl: [[490, 64, 320, 96]], path: [[785, 222], [785, 140]], lab: [[240, 120, 'replay after P', '#15803D']], b: [
      'The subscription starts at P, so the gap is <b>closed</b>.',
      'Events already in the snapshot are not applied twice.'] },
    { h: 'A partitioned stream may need several positions.', hl: [[490, 64, 320, 96], [490, 174, 320, 96]], at: [785, 140], b: [
      'One position per partition, all from the <b>same</b> snapshot version.',
      'Never pair an old snapshot with the latest cursor: that <b>skips updates</b>.'] }] },
  5: { steps: [   // Storage close-up (STOR_SVG)
    { h: 'Updates are kept in a retained stream.', hl: [[272, 20, 250, 82]], at: [500, 60], b: [
      'Example: a retained <b>Redis Stream</b> per tenant, next to the live state.',
      'Retention defines how far back a client can resume.'] },
    { h: 'Any dashboard pod can read it.', hl: [[830, 20, 300, 450]], path: [[500, 60], [760, 60], [844, 60], [1090, 108]], b: [
      'The stream is <b>shared</b>, not held in one pod\'s memory.',
      'So a reconnect does not depend on reaching the same pod.'] },
    { h: 'One read still serves many viewers.', hl: [[1160, 20, 350, 450]], path: [[1090, 108], [1130, 200], [1335, 200]], b: [
      'Thirty open pages still cost <b>one</b> subscription.',
      'Replay is only needed by clients that missed something.'] }] },
  6: { steps: [   // Dashboards close-up (DASH_SVG)
    { h: 'The browser reconnects, and lands on another pod.', hl: [[1200, 20, 310, 370]], at: [1470, 186], b: [
      'A network blip drops the SSE connection; the load balancer picks a <b>different pod</b>.'] },
    { h: 'It resumes from Last-Event-ID.', hl: [[490, 64, 320, 96], [20, 40, 180, 110]], path: [[1470, 186], [1196, 120], [830, 112], [785, 112]], b: [
      'SSE sends <b>Last-Event-ID</b> automatically on reconnect.',
      'The new pod replays from the shared stream after that ID.'] },
    { h: 'An expired position gets a new snapshot.', hl: [[490, 174, 320, 96]], path: [[785, 112], [785, 222]], b: [
      'If the ID is older than retention, the client loads a <b>new consistent snapshot</b> first.',
      'Slow clients get bounded queues and coalesced updates.'] }] },
  7: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'A late reading arrives for an earlier hour.', hl: [[20, 150, 170, 90], [232, 40, 170, 200]], path: [[170, 195], [226, 195], [382, 200]], lab: [[246, 262, 'late reading · earlier hour', '#5B3FD9']], b: [
      'Flink uses <b>event time</b>, so the reading belongs to the hour it was taken.'] },
    { h: 'Bounded lateness, then a correction path.', hl: [[444, 30, 250, 220]], path: [[382, 200], [438, 140], [664, 140]], b: [
      'Within the bounded lateness, e.g. 30 seconds, it simply joins its window.',
      'Later than that, it takes the <b>correction path</b>.'] },
    { h: 'The rollup is rewritten as a new revision.', hl: [[1104, 284, 300, 56]], path: [[664, 140], [694, 140], [1036, 140], [1070, 140], [1070, 312], [1374, 312]], lab: [[740, 300, 'rollup · revision 2', '#5B3FD9']], b: [
      'The corrected hour gets a <b>higher version</b>.',
      'Monotonic versions mean an older value can never win.'] }] },
  8: { steps: [   // ClickHouse store details
    { svg: 'chhot', h: 'Replayed rows keep their stable event ID.', hl: [[20, 10, 700, 280]], b: [
      'event_id is <b>device + boot ID + sequence</b>, so a replayed row has the same ID.',
      'ReplacingMergeTree collapses duplicates at background merge.'] },
    { svg: 'chhot', h: 'Reads deduplicate before the merge.', hl: [[750, 10, 760, 196]], b: [
      'Until the merge runs, queries use <b>FINAL</b> or deduplicate on read.',
      'So a replay never double-counts a point.'] },
    { svg: 'chwarm', h: 'Rollups: the latest revision wins.', hl: [[20, 10, 700, 280], [750, 10, 760, 190]], b: [
      'Each hourly row carries a <b>version</b>; queries select the latest.',
      'A delayed older aggregate never overrides a newer one.'] }] },
  9: { steps: [   // Dashboards close-up (DASH_SVG)
    { h: 'Charts read corrected history over REST.', hl: [[490, 174, 320, 96], [20, 170, 180, 100]], path: [[200, 220], [486, 220], [785, 222]], b: [
      'History queries return the <b>latest revision</b>, deduplicated.'] },
    { h: 'Live values come with their age.', hl: [[1200, 20, 310, 370]], path: [[785, 222], [830, 222], [1196, 222], [1470, 186]], b: [
      'The page shows <b>how fresh</b> each value is.',
      'If the pipeline is behind, the user can see it.'] },
    { h: 'Corrections converge; staleness stays visible.', hl: [[1200, 20, 310, 370], [490, 64, 320, 96]], at: [1470, 186], b: [
      'A late correction updates the chart through the same stream.',
      'A snapshot plus a cursor bridges history and the live stream.'] }] }
});

// ---------- 25 · Safe upgrades & rollback ----------
registerFlow(25, {
  name: 'Safe upgrades & rollback',
  intro: { h: 'The new job ran, and sent real actions, before its gate failed. What does rollback actually restore?', b: [
    'We upgrade the <b>Flink job</b> from v1 to v2, and the metric gate fails only after v2 has processed traffic.',
    'Restoring state is the easy half; v2 may already have <b>paged someone or updated a ticket</b>.',
    'This is the lesson behind the Deployment flows; <i>Flink jobs</i> and <i>Temporal + Action services</i> show the pipelines.',
    'Watch for one line: <b>rollback restores execution state; it does not unsend a page</b>.'] },
  steps: [
    ['a-flink', 'Before the release: take a savepoint of v1, and test compatibility.', [
      'A <b>savepoint</b> captures keyed state, timers and Kafka source offsets.',
      'Compatibility is tested first: stable <b>operator UIDs</b>, a compatible <b>state schema</b>.',
      'Kafka retention must cover the whole <b>rollback window</b>.',
      'Example design: these checks run in CI, before anything reaches production.']],
    ['a-flink', 'v2 restores that savepoint and starts processing.', [
      'v2 starts from <b>the same state and the same offsets</b>: no gap, no double count.',
      'Canary and shadow outputs are <b>isolated</b>, so a test run cannot act on its own.',
      'Even so, a real canary makes real decisions for its share of traffic.']],
    ['a-act', 'v2 has already sent real actions.', [
      'Under v2\'s decisions, some pages went out and some tickets were updated.',
      'These are <b>external effects</b>: PagerDuty and ServiceNow have already acted.',
      'We rejected treating a <b>Git revert</b> as undoing every effect of a release.']],
    ['a-obsp', 'The gate fails: freshness and checkpoints regress.', [
      'The gate compares v2 against the baseline: <b>freshness, checkpoint duration, action rates</b>.',
      'Freshness and checkpoints regress, so the release is <b>rejected</b>.',
      'The gate caught it; the question is what rolling back can restore.']],
    ['a-flink', 'Rollback: restore v1 from the compatible savepoint.', [
      'v1 restarts from the savepoint: <b>state and source offsets go back together</b>.',
      'Timers are restored with the state, so no device loses its deadline.',
      'This restores <b>execution state</b> only.']],
    ['a-kafka', 'Kafka replays the retained traffic since the savepoint.', [
      'Kafka still holds everything since the savepoint, so v1 <b>replays</b> it.',
      'Nothing is lost: the traffic v2 saw is reprocessed by v1.',
      'That only works if retention outlives the rollback window.']],
    ['a-act', 'Replayed decisions reuse recorded incident identities.', [
      'Replay produces decisions again; they reuse the <b>recorded incident IDs</b>.',
      'Ticket upserts and workflow signals deduplicate by <b>correlation ID</b>.',
      'So the replay itself creates no duplicate tickets.']],
    ['a-act', 'Rollback does not unsend a page.', [
      'Some of v2\'s actions were <b>wrong</b>, and they already happened.',
      'They need <b>reconciliation</b>: compare the intended state with the external result.',
      'Or <b>compensation</b>: correct the ticket, notify the person who was paged.']],
    ['a-act', 'Temporal: pinned versions, and workers kept until workflows drain.', [
      'Example: with <b>Pinned</b> workflow versioning, each workflow stays on the version it started with.',
      'Keep compatible workers running until their <b>in-flight workflows drain</b>.',
      'Temporal <b>Auto-Upgrade</b> is a different policy: it needs replay-compatible code changes.']],
    ['a-obsp', 'Next time: rehearse failure and recovery before the release.', [
      'Validate operator UIDs, state schema, retained input and external effect contracts.',
      'Test <b>failure and recovery</b>, including decisions and actions already published by a rejected release.',
      'Rollback restores execution state; it does not unsend a page.']]
  ],
  recap: { h: 'Rollback restores execution state; it does not unsend a page.', b: [
    '<b>Compatible savepoint</b>: state and offsets recoverable, retention covers the window.',
    '<b>Gated new version</b>: freshness, checkpoints and action rates against a baseline.',
    '<b>Restore + replay</b>, with stable IDs for repeated writes and signals.',
    '<b>Reconcile side effects</b> the rejected version already sent.'] }
}, {
  1: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'v1 is running: take a savepoint.', hl: [[20, 360, 1010, 40]], at: [1000, 380], b: [
      'The savepoint captures <b>keyed state, timers and source offsets</b>.'] },
    { h: 'Check compatibility before the release.', hl: [[232, 40, 170, 200], [444, 30, 250, 220], [736, 20, 300, 240]], at: [1006, 230], lab: [[740, 300, 'operator UIDs · state schema', '#5B3FD9']], b: [
      'Each operator keeps a <b>stable UID</b>, so its state maps across versions.',
      'The state schema must be readable by v2, and by v1 again on rollback.'] },
    { h: 'Retention must cover the rollback window.', hl: [[20, 40, 170, 90], [20, 150, 170, 90]], at: [170, 85], b: [
      'Rollback replays from Kafka, so input since the savepoint must <b>still exist</b>.'] }] },
  2: { steps: [
    { h: 'v2 starts from v1\'s savepoint.', hl: [[20, 360, 1010, 40], [232, 40, 170, 200]], at: [382, 222], lab: [[246, 262, 'v2 · from savepoint', '#B45309']], b: [
      'Same state, same offsets: v2 continues exactly where v1 stopped.'] },
    { h: 'No gap, no double count.', hl: [[444, 30, 250, 220], [736, 20, 300, 240]], path: [[382, 140], [438, 140], [664, 140], [730, 140], [1006, 230]], b: [
      'Timers carry over, so every device keeps its deadline.'] },
    { h: 'Canary and shadow outputs are isolated.', hl: [[1104, 20, 300, 56], [1104, 86, 300, 56]], path: [[1006, 230], [1036, 140], [1070, 140], [1070, 48], [1374, 48]], lab: [[740, 300, 'v2 · canary outputs', '#B45309']], b: [
      'Shadow output never reaches a real lane.',
      'A real canary does: it acts for its share of traffic.'] }] },
  3: { steps: [   // Action Execution close-up (ACT_SVG)
    { h: 'v2\'s decisions reach the critical lane.', hl: [[20, 120, 150, 110], [230, 120, 170, 90]], path: [[150, 160], [226, 160], [380, 165]], b: [
      'The canary emits incidents like any version would.'] },
    { h: 'A page goes out.', hl: [[440, 24, 190, 82]], path: [[380, 165], [315, 120], [315, 70], [436, 70], [610, 66]], b: [
      'PagerDuty has <b>already paged</b> someone on v2\'s decision.'] },
    { h: 'A ticket is updated.', hl: [[1310, 24, 190, 130]], path: [[610, 66], [630, 169], [840, 169], [1240, 66], [1306, 90], [1480, 138]], b: [
      'ServiceNow has acted too: these are <b>external effects</b>.',
      'A Git revert cannot reach them.'] }] },
  4: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'The gate compares v2 with the baseline.', hl: [[570, 30, 310, 140], [900, 30, 310, 140]], at: [860, 150], b: [
      'Freshness, checkpoint duration and action rates, against v1.'] },
    { h: 'Freshness and checkpoint duration regress.', hl: [[570, 30, 310, 140], [900, 30, 310, 140]], path: [[860, 150], [1190, 150]], b: [
      'Both move beyond the baseline: v2 is <b>worse</b>.'] },
    { h: 'The release is rejected.', hl: [[900, 190, 310, 140]], path: [[1190, 150], [1190, 310]], b: [
      'The monitor fires and the release owner rolls back.',
      'The gate failed only <b>after</b> v2 had acted.'] }] },
  5: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'Restore v1 from the compatible savepoint.', hl: [[20, 360, 1010, 40]], at: [1000, 380], b: [
      'v1 restarts from the savepoint taken before the release.'] },
    { h: 'State and offsets go back together.', hl: [[232, 40, 170, 200], [736, 20, 300, 240]], at: [1006, 230], lab: [[740, 300, 'v1 · restored', '#1D4ED8']], b: [
      'Keyed state, timers and source offsets all return to the savepoint.'] },
    { h: 'What rollback does not restore.', hl: [[1104, 20, 300, 56]], path: [[1006, 230], [1036, 140], [1070, 140], [1070, 48], [1374, 48]], b: [
      'Decisions v2 already <b>published</b> are outside Flink.',
      'They are handled next, by identity and reconciliation.'] }] },
  6: { steps: [   // Kafka close-up (KAFKA_SVG)
    { h: 'Flink rewinds to the savepoint\'s offsets.', hl: [[1110, 334, 370, 58]], at: [1450, 363], b: [
      'The offsets came back with the savepoint.'] },
    { h: 'Retained traffic replays through v1.', hl: [[240, 14, 820, 306]], path: [[1450, 363], [1100, 363], [1100, 126], [789, 126]], b: [
      'Everything since the savepoint is <b>still in Kafka</b>.',
      'v1 reprocesses what v2 saw: nothing is lost.'] },
    { h: 'Retention must outlive the rollback window.', hl: [[240, 14, 820, 306], [1128, 66, 334, 166]], path: [[789, 126], [866, 126], [1100, 126], [1440, 209]], b: [
      'If input had expired, the savepoint could not be caught up.'] }] },
  7: { steps: [   // Action Execution close-up (ACT_SVG)
    { h: 'Replayed decisions carry recorded incident identities.', hl: [[880, 14, 390, 300], [898, 52, 354, 28]], at: [1240, 66], b: [
      'The same outage gets the <b>same incident ID</b> on replay.'] },
    { h: 'The ticket upsert is idempotent.', hl: [[1310, 24, 190, 130]], path: [[1240, 66], [1270, 90], [1306, 90], [1480, 138]], b: [
      'ServiceNow updates the existing ticket by <b>correlation ID</b>.'] },
    { h: 'Signals deduplicate the same way.', hl: [[670, 124, 170, 90], [1310, 184, 190, 130]], at: [1480, 138], b: [
      'signalWithStart reaches the <b>same workflow</b>, not a new one.',
      'Replay itself creates no duplicates.'] }] },
  8: { steps: [
    { h: 'Some of v2\'s actions were wrong.', hl: [[440, 24, 190, 82], [1310, 24, 190, 130]], at: [1480, 138], b: [
      'A page and a ticket update happened on a bad decision.'] },
    { h: 'Reconcile: compare intended and actual.', hl: [[898, 90, 354, 208]], path: [[1480, 138], [1306, 90], [1240, 200]], b: [
      'Compare the final incident state with the <b>external result</b>.'] },
    { h: 'Compensate what cannot be unsent.', hl: [[1310, 24, 190, 130], [1310, 184, 190, 130]], path: [[1240, 200], [1274, 250], [1480, 250]], b: [
      'Correct the ticket; tell the person who was paged.',
      'Rollback restores execution state; it does not unsend a page.'] }] },
  9: { steps: [
    { h: 'Some incident workflows started on v2.', hl: [[880, 14, 390, 300]], at: [1240, 280], b: [
      'They are <b>in flight</b>: waiting on timers, acks or tickets.'] },
    { h: 'Pinned: each workflow stays on its version.', hl: [[898, 90, 354, 208]], at: [1240, 200], b: [
      'Compatible workers stay up until those workflows <b>drain</b>.'] },
    { h: 'Auto-Upgrade is a different policy.', hl: [[880, 14, 390, 300]], at: [1240, 66], b: [
      'It moves running workflows to new code, so changes must be <b>replay-compatible</b>.',
      'Replay tests in CI catch the incompatible ones.'] }] },
  10: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'Gate on freshness, checkpoints and action rates.', hl: [[570, 30, 310, 140], [900, 30, 310, 140]], at: [860, 150], b: [
      'The same signals the failed gate used.'] },
    { h: 'Rehearse failure and recovery before the release.', hl: [[1250, 30, 250, 300]], path: [[860, 150], [1230, 150], [1480, 300]], b: [
      'Test the rollback, including decisions a rejected version already <b>published</b>.'] },
    { h: 'Watch per tenant, not only in aggregate.', hl: [[240, 346, 1260, 50]], at: [1480, 370], b: [
      'A regression can hit one tenant first; averages hide it.'] }] }
});
