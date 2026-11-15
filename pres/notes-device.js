// Presenter notes: Heartbeat (7), Telemetry (4), Multi-tenancy (8). Format: see pres/notes.js (flow 1) and registerFlow().

// ---------- shared inside-view pieces (close-up SVG coordinates, tools/svgs.py) ----------
// Edge site: tenant view, then the Site-07 example topology.
const DEV_EDGE_TENANT = (who) => ({ h: 'Acme Retail has 214 sites. ' + who + ' is at Site-07.', hl: [[40, 60, 400, 300]], at: [345, 268], b: [
  'One tenant, many sites: Acme has <b>214 stores</b>, each with its own devices.',
  'Sites range from <b>small stores</b> to <b>large flagships</b>; one of each is shown as an example.',
  'Every site connects through its own <b>edge pair</b>; devices never reach the cloud directly.'] });
const DEV_EDGE_WAN = { h: 'The batch crosses the WAN over mTLS.', hl: [[490, 60, 300, 180], [910, 90, 220, 130]], path: [[760, 212], [790, 150], [904, 150], [1100, 190]], b: [
  'The edge pair holds the site\'s <b>only uplink</b>.',
  'The envelope travels over <b>mTLS</b>: encrypted, and the gateway proves its identity with a certificate.',
  'If the WAN drops, Gateway A <b>spools to disk</b>, bounded and alarmed, and flushes later as a burst.'] };
const DEV_EDGE_CAMERA = (cam) => ({ steps: [
  DEV_EDGE_TENANT(cam),
  { svg: 'small', h: 'Inside Site-07: ' + cam + ' sends its heartbeat.', hl: [[40, 60, 230, 56]], at: [250, 88], b: [
    'Once a minute, ' + cam + ' sends a small <b>heartbeat</b>.',
    'Cameras are IP devices on <b>PoE Ethernet</b>, so they speak <b>MQTT or CoAP</b> directly.',
    'The link types are an <b>example</b>; the pattern is what matters.'] },
  { h: 'Gateway A batches the whole site.', hl: [[40, 60, 230, 260], [490, 60, 300, 180]], path: [[250, 88], [484, 88], [760, 212]], lab: [[506, 196, 'Site-07 · one batch']], b: [
    'Heartbeats from every device at the site reach the <b>active gateway</b>.',
    'It <b>batches them per site</b> instead of forwarding each one.',
    '100M devices × 1/min is about <b>1.7M readings/sec</b>; site batching makes it roughly <b>200K envelopes/sec</b>.',
    '<b>Gateway B</b> stands by and takes over if A fails.'] },
  DEV_EDGE_WAN] });
// Cloud Gateway: one tenant's envelope through mTLS, tenant lookup, quotas and the load balancer.
const DEV_GW = (what) => ({ steps: [
  { h: 'Acme Site-07\'s envelope arrives.', hl: [[20, 46, 250, 54]], at: [240, 73], b: [
    'Envelopes arrive from many sites and many tenants at once.',
    'This one is from <b>Acme Retail, Site-07</b>, carrying ' + what + '.',
    'Below it, Beta\'s Site-03 has <b>buggy firmware</b> and is flooding traffic.'] },
  { h: '1 · mTLS, then 2 · tenant lookup.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], path: [[240, 73], [318, 73], [495, 210], [740, 210]], lab: [[582, 196, 'tenant = acme']], b: [
    'The gateway <b>terminates TLS</b>; the certificate names the site gateway and the devices it may speak for.',
    'Each device is mapped to its <b>tenant from the registry</b> and tagged with <b>tenant_id</b>.',
    'It never trusts a tenant name written in the payload itself.'] },
  { h: '3 · Quotas: Acme is within budget, Beta is throttled.', hl: [[815, 30, 330, 226]], path: [[740, 210], [808, 143], [1115, 226]], b: [
    '<b>Acme\'s bucket</b> has room, so the envelope passes.',
    '<b>Beta\'s bucket</b> is empty: its excess gets <b>429 · throttled</b>, and only Beta is affected.',
    'Heartbeat capacity is <b>reserved</b>, so bulk traffic never starves liveness.'] },
  { h: '4 · Load balancer → an ingestion pod.', hl: [[1190, 46, 150, 194], [1378, 40, 130, 206]], path: [[1115, 226], [1183, 143], [1310, 143], [1478, 135]], b: [
    'The load balancer spreads envelopes across the <b>ingestion pool</b>.',
    'Any pod can take it: ingestion is <b>stateless</b>.'] }] });
// Ingestion: validate, unpack, route.
const DEV_ING_START = (tagLab) => ({ h: 'The envelope arrives, already tagged with its tenant.', hl: [[20, 120, 180, 110]], at: [170, 200], lab: tagLab ? [[30, 244, tagLab]] : undefined, b: [
  'It comes from the Cloud Gateway: authenticated and <b>tenant-tagged</b>.',
  'It still holds a whole site\'s batch of readings.'] });
const DEV_ING_VALIDATE = { h: '1 · Validate against the Avro schema.', hl: [[275, 66, 330, 58]], path: [[170, 200], [248, 175], [580, 95]], b: [
  'Every payload must match its <b>Avro schema</b> from the schema registry.',
  'Invalid data is <b>rejected, counted and alarmed</b> in Datadog, never passed on silently.'] };
const DEV_ING_UNPACK = (dev) => ({ h: '2 · Unpack: one key per reading.', hl: [[275, 142, 330, 58]], path: [[580, 95], [580, 171]], lab: [[620, 186, 'key = acme + ' + dev]], b: [
  'The site batch is split into <b>individual device readings</b>.',
  'Each reading gets the key <b>tenant + device</b>: here, acme + ' + dev + '.',
  'That key decides the Kafka partition, which keeps each device\'s events in order.'] });
const DEV_ING_HEARTBEAT = (dev) => ({ h: '3 · Route: the heartbeat goes to the priority topic.', hl: [[275, 218, 330, 58], [905, 60, 300, 100]], path: [[580, 171], [580, 247], [605, 258], [860, 258], [860, 110], [900, 110], [1175, 130]], b: [
  dev + '\'s heartbeat goes to the <b>heartbeats</b> topic; bulk readings go to <b>telemetry</b>.',
  'Why: a delayed heartbeat can raise a <b>false DEAD</b> and page someone; a late chart point cannot.',
  'A separate topic alone is not enough: heartbeat capacity is reserved <b>end to end</b>.'] });
// Kafka: arrival, append, replay, Flink reader.
const DEV_KAFKA_IN = (dev) => ({ h: 'The reading arrives from ingestion.', hl: [[20, 130, 170, 100]], at: [160, 200], b: [
  'Ingestion publishes ' + dev + '\'s reading with the key <b>tenant + device</b>.',
  'Message contracts are <b>Avro</b>, governed by the schema registry.'] });
const DEV_KAFKA_REPLAY = { h: 'If something goes wrong: rewind and replay.', hl: [[1110, 334, 370, 58]], b: [
  'Flink records its Kafka <b>offsets in each checkpoint</b>.',
  'After a crash or a bug fix, it <b>rewinds</b> to those offsets and reprocesses.',
  'In a burst, Kafka turns extra traffic into <b>lag, not loss</b>.'] };
// Flink: keyBy and dedup for one device.
const DEV_FLINK_KEY = (dev, from) => ({ h: 'keyBy sends it to ' + dev + '\'s own state.', hl: [[232, 40, 170, 200]], path: [from, [226, 85], [382, 222]], lab: [[240, 186, 'acme + ' + dev]], b: [
  'Flink partitions work by <b>tenant + device</b>: one owner for ' + dev + '.',
  'That owner keeps ' + dev + '\'s <b>state</b>: current status, timer and recent event IDs.',
  '<b>Event time</b> with watermarks handles telemetry that arrives out of order.'] });
const DEV_FLINK_DEDUP = (labText) => ({ h: 'Dedup + enrich.', hl: [[444, 30, 250, 220]], path: [[382, 222], [438, 140], [664, 238]], lab: [[456, 170, labText]], b: [
  'A duplicate check uses <b>boot/session + stream + sequence</b>, within a bounded window.',
  'Device metadata is joined in: <b>type, tenant, site</b>.'] });

// ======================================================================
// Flow 7 · Heartbeat
// ======================================================================
registerFlow(7, {
  name: 'Heartbeat',
  intro: { h: 'Is every device alive? We ask that question every minute, for 100M+ devices.', b: [
    'We follow one healthy camera, <b>CAM-11</b> at Acme Retail Site-07, through one ordinary heartbeat.',
    'Nothing goes wrong here: this is the <b>happy path</b>, running about 1.7M times a second.',
    'Watch for three things: heartbeats get <b>priority</b>, Flink keeps a <b>timer instead of polling</b>, and only <b>changes</b> go downstream.',
    'At the end, the dashboard shows CAM-11 ONLINE, with counts read from <b>Redis</b>.'] },
  steps: [
    ['a-edge', 'CAM-11 sends a heartbeat every minute, and the gateway batches them per site.', [
      'Once a minute, CAM-11 sends a small heartbeat over <b>MQTT / CoAP</b> to the store\'s edge gateway.',
      'The <b>active / standby</b> edge pair batches every device\'s heartbeat per site.',
      '100M devices × 1/min is about <b>1.7M readings/sec</b>, sent as roughly <b>200K envelopes/sec</b> at normal peak.',
      'Batching shrinks envelopes, not work: Kafka and Flink still process every <b>unpacked reading</b>.']],
    ['a-gw', 'The Cloud Gateway checks identity, then applies per-tenant quotas and rate limits.', [
      'It terminates <b>mTLS</b> and checks the certificate belongs to a known site gateway and its allowed devices.',
      'It maps each device to its <b>tenant</b> from the registry, never from the payload.',
      '<b>Per-tenant quotas</b> and per-device rate limits apply, with <b>heartbeat capacity reserved</b>.',
      'So bulk traffic, even from a noisy tenant, never starves the liveness signal.']],
    ['a-ing', 'Ingestion sends heartbeats to their own priority topic, never stuck behind bulk telemetry.', [
      'The <b>stateless, autoscaled</b> pool validates the batch against its <b>Avro schema</b> and unpacks it.',
      'Each reading is keyed by <b>tenant + device</b>: here, acme + CAM-11.',
      'Heartbeats go to the <b>heartbeats</b> topic; bulk readings go to <b>telemetry</b>.',
      'Why: a late chart point is harmless, but a delayed heartbeat can raise a <b>false DEAD</b> and page someone.',
      'A separate topic alone is not enough: heartbeat capacity is reserved <b>end to end</b>.']],
    ['a-kafka', 'Kafka keeps heartbeats and telemetry apart, in per-device order, and replayable.', [
      'Two shared topics for every tenant: <b>heartbeats</b> as priority, <b>telemetry</b> as bulk.',
      'The key <b>tenant + device</b> puts all of CAM-11\'s events in one partition, <b>in order</b>.',
      'It is a <b>durable log</b> with retention, so after a bug or an outage we rewind and <b>replay</b>.',
      'Fairness is enforced at the gateway, not with a topic per tenant.']],
    ['a-flink', 'In Flink, the heartbeat resets CAM-11\'s silence timer, so it stays ONLINE.', [
      'Flink routes the heartbeat to CAM-11\'s own <b>keyed state</b>, by tenant + device.',
      'The heartbeat <b>resets its silence timer</b>; it fires only if CAM-11 goes quiet: SILENT at 10 minutes, DEAD at 20.',
      'Nothing scans 100M last-seen rows: that is why <b>Flink beat Kinesis + Lambda</b>.',
      'Timers and state are <b>checkpointed</b>, so a restart does not forget them.',
      'An old heartbeat flushed from a spool is history: it does <b>not</b> refresh current health.']],
    ['a-flink', 'Nothing changed, so no incident is emitted: only transitions enter the incident lanes.', [
      'CAM-11 was ONLINE and is still ONLINE: <b>no transition</b>, so nothing goes to paging or digests.',
      'Only <b>state changes</b> leave Flink for the incident lanes.',
      'Freshness, the <b>last_seen</b> time, updates on a separate, <b>throttled</b> path.',
      'Why: forwarding 1.7M heartbeats a second would flood everything downstream.',
      'Trade-off: the freshness interval must meet the UI promise without pushing every heartbeat to every viewer.']],
    ['a-stor', 'The latest status and counts land in Redis, the live state.', [
      '<b>Redis</b> holds each device\'s latest status and the <b>site counts</b>: online, degraded, down.',
      'The throttled freshness update keeps CAM-11\'s <b>last_seen</b> current there.',
      'Example: a <b>version-checked Lua script</b> updates device state and site counts together, in one slot.',
      'Tenant totals roll up <b>asynchronously</b> and are reconciled, so they are eventually consistent.',
      'Redis is a <b>rebuildable cache</b>, not the source of truth.']],
    ['a-dash', 'The dashboard service reads Redis, and Flink pushes changes live over SSE to every open page.', [
      'The <b>dashboard service</b> reads current status and counts from Redis.',
      'Changes are <b>pushed</b>: the SSE stream hub sends them to every open page.',
      'Why push: thousands of dashboards polling the hot store waste queries; push sends <b>only what changed</b>.',
      'Why <b>SSE</b>: updates flow one way, over plain HTTP, with built-in reconnect.',
      '<b>RBAC on every call</b>: role, tenant and sites scope what each page receives.']],
    ['d-CAM-11', 'On Site-07, CAM-11 shows ONLINE, with its last heartbeat just now.', [
      'This is Acme\'s tenant dashboard: drill-down from <b>tenant → site → device</b>.',
      'CAM-11, the entrance camera, is <b>ONLINE</b> with a fresh heartbeat.',
      'The page did not ask for this; the state was <b>pushed</b> over SSE.']],
    ['t-on', 'The tiles come from the Redis cache, so nobody counts 100M rows on every page load.', [
      'Online, degraded and down are <b>pre-computed counts</b> in Redis.',
      'The alternative, <b>COUNT queries</b> against the hot store on every page load, grows with every viewer.',
      'A big tenant with 30 open dashboards needs <b>one Redis subscription</b>, pushed to all 30 pages.',
      'After cache loss, Redis is rebuilt from a <b>versioned snapshot</b> plus newer updates, with a stale indicator.']],
    ['livepill', 'If CAM-11 ever goes quiet, this card turns yellow at 10 minutes and red at 20: that is the red-alert flow.', [
      'The <b>LIVE · SSE</b> pill shows this page is on the push stream.',
      'If heartbeats stop, CAM-11 turns <b>SILENT</b> at 10 minutes, then <b>DEAD</b> at 20, and each transition reaches this card.',
      'Silence only counts if the <b>pipeline is healthy</b>; otherwise devices show <b>UNKNOWN</b>.',
      'The critical-alert flow follows that path, from silence to a closed ticket.']]
  ],
  recap: { h: 'One heartbeat, no polling, and nothing sent downstream unless something changes.', b: [
    '<b>Edge</b>: site batching turns 1.7M readings/sec into roughly 200K envelopes/sec.',
    '<b>Priority</b>: heartbeats get their own topic and reserved capacity end to end.',
    '<b>Detect</b>: one Flink timer per device, reset on every heartbeat.',
    '<b>Quiet by default</b>: only transitions go downstream; freshness is throttled.',
    '<b>Read cheap</b>: status and counts from Redis, pushed live over SSE.'] }
}, {
  1: DEV_EDGE_CAMERA('CAM-11'),
  2: DEV_GW('CAM-11\'s heartbeat'),
  3: { steps: [DEV_ING_START(), DEV_ING_VALIDATE, DEV_ING_UNPACK('CAM-11'), DEV_ING_HEARTBEAT('CAM-11')] },
  4: { steps: [
    DEV_KAFKA_IN('CAM-11'),
    { h: 'hash(acme + CAM-11) always picks the same heartbeats partition.', hl: [[250, 44, 620, 124]], path: [[160, 200], [232, 180], [420, 110], [729, 96]], b: [
      'The same key always hashes to the <b>same partition</b>, so CAM-11\'s events stay <b>in order</b>.',
      'The partition is shared with other devices; ordering is per device, not across the fleet.',
      'All tenants share these topics; every message carries its <b>tenant_id</b>.'] },
    { h: 'It is appended to a durable, replayable log.', hl: [[440, 80, 430, 32], [440, 280, 430, 24]], at: [729, 96], b: [
      'The heartbeat is <b>appended</b> at the end of its partition and gets the next offset.',
      'Retention keeps <b>days of history</b>, so the log can be replayed.'] },
    DEV_KAFKA_REPLAY] },
  5: { steps: [
    { h: 'The heartbeat arrives on the priority topic.', hl: [[20, 40, 170, 90]], at: [160, 100], b: [
      'CAM-11\'s heartbeat arrives from the <b>heartbeats</b> topic.',
      'Heartbeats have their own capacity, so bulk telemetry backpressure cannot delay them.'] },
    DEV_FLINK_KEY('CAM-11', [160, 100]),
    Object.assign(DEV_FLINK_DEDUP('new ✓ · camera · Site-07'), { b: [
      'A duplicate check uses <b>boot/session + stream + sequence</b>, within a bounded window.',
      'Device metadata is joined in: <b>type, tenant, site</b>.',
      'The heartbeat\'s age is checked: an old one flushed from a spool <b>does not refresh</b> current health.'] }),
    { h: 'Rule engine: CAM-11\'s silence timer is reset.', hl: [[736, 20, 300, 240]], path: [[664, 238], [730, 140], [1006, 230]], lab: [[750, 178, 'CAM-11 · timer reset · ONLINE', '#15803D']], b: [
      'Every heartbeat <b>resets</b> the device\'s timer; the timer fires only if the device goes quiet.',
      'The thresholds, SILENT at 10 minutes and DEAD at 20, are rules per device type, with <b>tenant overrides</b> pushed live.',
      'No scan, no polling: <b>100M timers</b>, each owned by its device\'s key.'] }] },
  6: { steps: [
    { h: 'CAM-11 was ONLINE and is still ONLINE.', hl: [[736, 20, 300, 240]], at: [1006, 230], lab: [[750, 178, 'CAM-11 · no transition']], b: [
      'The timer was reset, but the <b>status did not change</b>.',
      'No transition means there is nothing for the incident lanes.'] },
    { h: 'Nothing goes to the incident lanes.', hl: [[1104, 20, 300, 56], [1104, 86, 300, 56], [1110, 354, 300, 26]], at: [1006, 230], b: [
      'The <b>critical</b> and <b>minor</b> lanes only ever see state <b>changes</b>.',
      'That is how 1.7M heartbeats/sec avoid flooding paging, digests and tickets.'] },
    { h: 'Freshness travels a separate, throttled path.', hl: [[1104, 152, 300, 56]], path: [[1006, 230], [1036, 140], [1070, 140], [1070, 180], [1374, 180]], b: [
      'CAM-11\'s <b>last_seen</b> refresh goes to the dashboard service, <b>throttled</b>.',
      'Telemetry can still update live values on the same path.',
      'Suppressing incidents does <b>not</b> suppress every state update.'] }] },
  7: { steps: [
    { h: 'Flink writes the live state to Redis.', hl: [[20, 150, 170, 100], [272, 20, 250, 82]], path: [[170, 200], [230, 200], [230, 60], [255, 60]], b: [
      'Flink writes every tier <b>in parallel</b>; live state goes to <b>Redis</b>.',
      'Redis holds the <b>latest state, counts and pub/sub</b>.',
      'ClickHouse and S3 keep history; they are not on the live path.'] },
    { svg: 'redis', h: 'Example keys: device state and site counts share one slot.', hl: [[20, 74, 900, 28], [20, 130, 900, 28]], b: [
      'Each device has a <b>hash</b> with its status and last_seen; CAM-11 follows the same pattern as CAM-14 here.',
      'The site hash tag <code>{acme:site-07}</code> puts device state and site counts in <b>one Redis Cluster slot</b>.',
      'Site tags spread load; a tenant-wide tag would make one hot slot.'] },
    { h: 'Version-checked updates, and a rebuildable cache.', hl: [[950, 30, 560, 200]], b: [
      'Example: a <b>Lua script</b> applies only a newer state, and updates site counts with it.',
      'Tenant totals roll up <b>asynchronously</b>, with reconciliation.',
      'After a cache loss: <b>snapshot + applied cursor + later updates</b>, then publish.'] },
    { h: 'One update, many viewers.', hl: [[20, 250, 1490, 150]], b: [
      'When a status does change, one <b>PUBLISH</b> reaches the dashboard service.',
      'It fans out to every open page: <b>30 pages, one update</b>.',
      'Tenant totals are <b>eventually consistent</b>, so their freshness is shown.'] }] },
  8: { steps: [
    { h: 'Redis holds the state; Flink publishes changes.', hl: [[20, 40, 180, 110], [240, 14, 190, 54]], at: [220, 125], b: [
      '<b>Redis</b> holds live state and the pub/sub channel per tenant.',
      '<b>Flink</b> publishes live updates as they happen.'] },
    { h: 'The SSE stream hub pushes changes to open pages.', hl: [[490, 64, 320, 96]], path: [[220, 125], [220, 95], [470, 95], [480, 140], [785, 140]], b: [
      'The hub <b>subscribes per tenant</b> in Redis.',
      'It pushes <b>only what changed</b> to every open page.',
      'SSE is one-way, plain HTTP, with <b>built-in reconnect</b>.'] },
    { h: 'Acme\'s open pages update.', hl: [[1200, 20, 310, 370]], at: [1470, 186], b: [
      'The tenant view drills down <b>tenant → site → device</b>.',
      'A tenant admin <b>never sees another tenant</b>.'] },
    { h: 'RBAC on every call.', hl: [[490, 284, 320, 90], [1200, 20, 310, 370]], b: [
      'Every call resolves <b>role + tenant + sites</b>, and every query is scoped by them.',
      'REST serves history from ClickHouse; the live stream serves current state.'] }] }
});

// ======================================================================
// Flow 4 · Telemetry
// ======================================================================
registerFlow(4, {
  name: 'Telemetry',
  intro: { h: '100M+ devices. One dashboard that stays live.', b: [
    'We follow one thermostat, <b>TH-05</b> at Acme Retail Site-07, from a reading to a live chart.',
    'Two paths leave Flink: a <b>live push</b> to open dashboards, and <b>history</b> in tiered storage.',
    'Watch for three things: <b>roll up in the stream</b>, <b>pay for what\'s hot</b>, and <b>push, don\'t poll</b>.'] },
  steps: [
    ['a-edge', 'Thermostat TH-05 sends telemetry every minute.', [
      'In this example, TH-05 is a <b>Zigbee</b> thermostat, so it reaches the IP network through a <b>bridge</b>.',
      'The bridge speaks <b>MQTT</b> over the LAN to the site\'s edge pair.',
      'Readings leave the site over its single uplink, over <b>mTLS</b>; devices never reach the cloud directly.',
      'If the WAN drops, the gateway <b>spools to disk</b> and flushes later as a burst.',
      'The link types are an <b>example</b>; the pattern is what matters.']],
    ['a-gw', 'The Cloud Gateway checks identity, then applies per-tenant quotas and rate limits.', [
      'It terminates <b>mTLS</b> and resolves each device to its <b>tenant</b> from the registry.',
      'Budgets count <b>bytes and readings</b>, shared across all gateway replicas.',
      'Telemetry is bulk; <b>heartbeat capacity is reserved</b>, so bulk traffic never starves liveness.',
      'Rejecting excess here is cheapest: one noisy tenant\'s telemetry cannot flood the pipeline.']],
    ['a-ing', 'Ingestion is a stateless, autoscaled pool: it validates, tags the tenant, and puts heartbeats first.', [
      'Each payload is validated against its <b>Avro schema</b>; invalid data is rejected, counted and alarmed.',
      'The batch is unpacked and each reading keyed <b>tenant + device</b>: here, acme + TH-05.',
      'TH-05\'s reading goes to the bulk <b>telemetry</b> topic; heartbeats take the priority topic.',
      'Pods hold <b>no state</b>, so the pool scales out on CPU and lag.']],
    ['a-kafka', 'Kafka keeps heartbeats and telemetry apart, in per-device order, and replayable.', [
      'Two shared topics for every tenant: <b>heartbeats</b> as priority, <b>telemetry</b> as bulk.',
      'The key <b>tenant + device</b> keeps all of TH-05\'s readings in one partition, <b>in order</b>.',
      'Flink uses <b>event time</b> with watermarks, so a reading that arrives late still lands in the right hour.',
      'It is a <b>durable log</b>: a burst becomes <b>lag, not loss</b>, and we can replay after a bug.']],
    ['a-flink', 'Flink dedups, enriches, and rolls up one-hour aggregates.', [
      'Duplicates are dropped using <b>boot/session + stream + sequence</b>, within a bounded window.',
      'Device metadata is joined in: <b>type, tenant, site</b>.',
      'Flink computes <b>1-hour rollups</b> as data flows, so 6-month charts never scan raw rows.',
      'Late data: bounded lateness, <b>e.g. 30 seconds</b>; later events take a correction path and write a new version.',
      'Longer periods are averaged from <b>sum and count</b>, never by averaging hourly averages.']],
    ['a-stor', 'History lands in ClickHouse: raw hot for seven days, rollups warm for six months, and an S3 cold archive.', [
      '<b>Hot</b>: raw telemetry for <b>7 days</b>, sorted by tenant, device, metric and time.',
      '<b>Warm</b>: 1-hour rollups for <b>6 months</b>; 24 rows a day per metric is tiny next to raw.',
      '<b>Cold</b>: a <b>sampled</b> archive in S3, for audits and reprocessing; it is never on the read path.',
      'Why tiers: the requirement was 7-day detail and 6-month history; all-hot would grow cost per device with the fleet.',
      'Trade-off: a sampled archive cannot rebuild full raw history, and export is <b>verified before deletion</b>.']],
    ['a-dash', 'On the live path, Flink pushes each update straight to the dashboard service, and SSE refreshes the charts instantly.', [
      'Flink writes history and publishes live changes <b>in parallel</b>; databases only serve history.',
      'The <b>SSE stream hub</b> pushes to every open page; no dashboard polls the hot store.',
      'Why SSE: updates flow <b>one way</b>; a WebSocket is two-way, more than a feed needs.',
      'Example: a retained <b>Redis Stream</b> serves <b>Last-Event-ID</b>, so a reconnect can land on any pod.',
      'Trade-off: live and history can become visible at different times, so we use versions and <b>show freshness</b>.']],
    ['livepill', 'The Site-07 view shows every device, with live status over SSE.', [
      'This is Acme\'s tenant dashboard: drill-down from <b>tenant → site → device</b>.',
      'The <b>LIVE · SSE</b> pill means the page is subscribed; changes arrive without a refresh.',
      'Status and counts come from <b>Redis</b>, not from counting rows on each load.',
      'On reconnect, the page resumes after its <b>last event</b>, or takes a fresh snapshot if that cursor expired.']],
    ['d-TH-05', 'Now we click a device.', [
      'Clicking TH-05 drills down from the site to <b>one device</b>.',
      'Device names and sites come from the <b>MongoDB</b> registry.',
      '<b>RBAC</b> is checked on this call too: an Acme user only gets Acme devices.']],
    ['p-det', 'Live telemetry streams in over SSE, and the history comes from the hot store.', [
      'The temperature chart, <b>22.4 °C</b> here, updates <b>live</b> as each reading arrives.',
      'The recent history behind it comes from <b>ClickHouse hot</b>: raw points for the last 7 days.',
      'Older ranges switch to <b>warm rollups</b>; no dashboard ever reads S3.',
      'The sparse primary index jumps straight to TH-05\'s blocks: <b>no full scan</b>, even with billions of rows.']]
  ],
  recap: { h: 'Live comes from the stream; history comes from the store.', b: [
    '<b>Process once</b>: Flink dedups, enriches and rolls up while the data passes by.',
    '<b>Pay for what\'s hot</b>: 7 days raw, 6 months of rollups, a sampled cold archive.',
    '<b>Push, don\'t poll</b>: SSE sends only what changed to every open page.',
    '<b>Per-device order</b>: tenant + device keys, with event time for late data.'] }
}, {
  1: { steps: [
    DEV_EDGE_TENANT('TH-05'),
    { svg: 'small', h: 'Inside Site-07: TH-05 sends a reading.', hl: [[40, 196, 230, 56], [300, 196, 150, 124]], at: [283, 224], b: [
      'Once a minute, TH-05 sends a <b>temperature reading</b>.',
      'Thermostats here use <b>Zigbee</b>, so a bridge translates to IP.',
      'Cameras on <b>PoE Ethernet</b> speak MQTT or CoAP directly; the link types are an <b>example</b>.'] },
    { h: 'The bridge hands it to Gateway A.', hl: [[300, 196, 150, 124], [490, 60, 300, 180]], path: [[283, 224], [290, 300], [440, 300], [467, 258], [760, 212]], lab: [[506, 196, 'Site-07 · one batch']], b: [
      'The bridge sends <b>MQTT over the LAN</b> to the active gateway.',
      'The gateway batches the site and keeps a <b>local spool</b> on disk with retry.',
      '<b>Gateway B</b> stands by and takes over if A fails.'] },
    DEV_EDGE_WAN] },
  2: DEV_GW('TH-05\'s reading'),
  3: { steps: [DEV_ING_START(), DEV_ING_VALIDATE, DEV_ING_UNPACK('TH-05'),
    { h: '3 · Route: the reading goes to the telemetry topic.', hl: [[275, 218, 330, 58], [905, 220, 300, 100]], path: [[580, 171], [580, 247], [605, 258], [860, 258], [860, 270], [900, 270], [1175, 300]], b: [
      'TH-05\'s temperature is a bulk reading, so it goes to the <b>telemetry</b> topic.',
      'Telemetry feeds <b>charts and rollups</b>; heartbeats take the priority topic.',
      'Losing one chart point is fine; a delayed heartbeat is not.'] }] },
  4: { steps: [
    DEV_KAFKA_IN('TH-05'),
    { h: 'hash(acme + TH-05) always picks the same telemetry partition.', hl: [[250, 164, 620, 100]], path: [[160, 200], [232, 186], [789, 186]], b: [
      'The same key always hashes to the <b>same partition</b>, so TH-05\'s readings stay <b>in order</b>.',
      'Order only matters per device, so we partition per device.',
      'All tenants share these topics; every message carries its <b>tenant_id</b>.'] },
    { h: 'Appended to a durable, replayable log.', hl: [[440, 170, 430, 32], [440, 280, 430, 24]], at: [789, 186], b: [
      'The reading is <b>appended</b> and gets the next offset; retention keeps <b>days of history</b>.',
      'Readings can still arrive late; Flink handles that with <b>event time</b> and watermarks.'] },
    { h: 'A Flink source reader picks it up.', hl: [[1128, 66, 334, 46]], path: [[789, 186], [866, 186], [1100, 150], [1440, 89]], b: [
      'One <b>source reader</b> owns each partition; readers can never outnumber partitions.',
      'Flink\'s keyed operators scale <b>separately</b> from the readers.'] },
    DEV_KAFKA_REPLAY] },
  5: { steps: [
    { h: 'The reading arrives on the telemetry topic.', hl: [[20, 150, 170, 90]], at: [160, 215], b: [
      'TH-05\'s reading arrives from the bulk <b>telemetry</b> topic.',
      'Telemetry can arrive <b>out of order and sometimes twice</b>, for example after a spool flush.'] },
    DEV_FLINK_KEY('TH-05', [160, 215]),
    DEV_FLINK_DEDUP('new ✓ · TH-05 · Site-07'),
    { h: 'Raw goes hot; the hour\'s rollup goes warm.', hl: [[1104, 218, 300, 56], [1104, 284, 300, 56]], at: [1066, 279], lab: [[780, 300, 'TH-05 · 10:00 hour · avg 22.6']], b: [
      'Raw readings go to <b>ClickHouse hot</b>; Flink computes the <b>1-hour rollup</b> and writes it warm.',
      'Each hour is computed <b>once</b>, in event time, so history charts never scan raw rows.',
      'A late correction writes a <b>new aggregate version</b>; queries read the latest one.'] },
    { h: 'In parallel, the live update goes to the dashboard service.', hl: [[1104, 152, 300, 56]], path: [[1066, 279], [1066, 180], [1374, 180]], b: [
      'The same reading is pushed <b>live</b> to the dashboard service.',
      'Live comes from the <b>stream</b>; history comes from the <b>store</b>.'] }] },
  6: { steps: [
    { h: 'Flink writes the history tiers in parallel.', hl: [[20, 150, 170, 100], [272, 112, 250, 82], [272, 204, 250, 82]], path: [[170, 200], [230, 200], [230, 152], [255, 152]], b: [
      'Raw readings go to <b>ClickHouse hot</b> for <b>7 days</b>.',
      '1-hour rollups go to <b>ClickHouse warm</b> for <b>6 months</b>.',
      'Charts read the last 7 days from hot and <b>older ranges from warm</b>.'] },
    { svg: 'chhot', h: 'Hot: TH-05\'s raw readings, kept for 7 days.', hl: [[20, 350, 700, 114]], b: [
      'Example schema: one row per reading, with a <b>stable event_id</b>.',
      '<b>ReplacingMergeTree</b> plus FINAL, or dedup on read, removes duplicates.',
      'Daily partitions make the <b>7-day TTL</b> a cheap drop.'] },
    { h: 'The sort key makes "TH-05, last hour" cheap.', hl: [[750, 10, 760, 196], [750, 214, 760, 236]], b: [
      'Data is sorted on disk by <b>tenant, device, metric, time</b>.',
      'A sparse primary index keeps one entry per <b>8,192 rows</b>.',
      'A device query jumps to a few blocks: <b>no full scan</b>, even with billions of rows.'] },
    { svg: 'chwarm', h: 'Warm: hourly rollups, kept for 6 months.', hl: [[20, 370, 700, 114], [750, 10, 760, 190]], b: [
      'Flink computes each hour <b>once</b> and writes min, max, avg and count.',
      'A <b>version</b> column means a delayed older aggregate never overrides a newer one.',
      '6 months × 24 rows a day per metric: <b>tiny</b> next to raw.'] },
    { svg: 's3', h: 'Cold: a sampled archive in S3.', hl: [[820, 20, 690, 220], [20, 240, 1490, 130]], b: [
      'Sampled telemetry and rollups are exported as <b>Parquet</b> before they expire.',
      'Export is <b>verified before deletion</b>; TTL expiry alone does not create an archive.',
      'Dashboards <b>never read S3</b>: it is for audits, analysis and reprocessing.'] }] },
  7: { steps: [
    { h: 'Flink pushes TH-05\'s update to the dashboard service.', hl: [[240, 14, 190, 54], [490, 64, 320, 96]], path: [[444, 41], [458, 41], [458, 100], [480, 140], [785, 140]], b: [
      'Flink publishes the live update <b>in parallel</b> with the history write.',
      'The <b>SSE stream hub</b> subscribes per tenant and pushes changes to open pages.'] },
    { h: 'Every open Acme page gets the new value.', hl: [[1200, 20, 310, 370]], at: [1470, 236], b: [
      'TH-05\'s card and chart refresh <b>instantly</b>; nobody polls.',
      'SSE is one-way, plain HTTP, with <b>reconnect and replay</b>.',
      'Slow viewers get <b>coalesced</b> updates or resynchronise.'] },
    { h: 'History comes over REST from ClickHouse.', hl: [[20, 170, 180, 100], [490, 174, 320, 96]], at: [440, 220], b: [
      'Opening a chart asks the <b>REST API</b> for history.',
      'History comes from <b>ClickHouse</b>; device metadata from <b>MongoDB</b>.'] },
    { h: 'RBAC on every call.', hl: [[490, 284, 320, 90]], b: [
      'Every call resolves <b>role + tenant + sites</b>, and every query is scoped by them.',
      'The same scope applies to SSE subscriptions and replay.'] }] }
});

// ======================================================================
// Flow 8 · Multi-tenancy
// ======================================================================
registerFlow(8, {
  name: 'Multi-tenancy',
  intro: { h: 'Two tenants. One platform. One of them is misbehaving.', b: [
    'Tenant <b>Beta Mart</b> ships a buggy firmware that floods <b>10× normal traffic</b>.',
    'Tenant <b>Acme Retail</b> shares the same gateway, Kafka, Flink and storage.',
    'The question: does Acme notice? Watch <b>quotas, tenant tags, per-tenant rules, scoped queries and RBAC</b>.',
    'Isolation has two halves: who can <b>see</b> the data, and who can <b>use</b> the capacity.'] },
  steps: [
    ['a-edge', 'Tenant Beta Mart\'s buggy firmware floods ten times its normal traffic.', [
      'A firmware bug makes Beta\'s devices send <b>10× normal traffic</b>.',
      'Beta\'s sites send through their own edge pairs, so the flood arrives at the shared <b>Cloud Gateway</b>.',
      'This is the classic <b>noisy neighbour</b>: one tenant\'s bug could become everyone\'s problem.',
      'Fairness is not left to the devices: it is enforced at the <b>front door</b>.']],
    ['a-gw', 'At the gateway, Beta hits its own quota and is throttled: the flood stops at the front door.', [
      'Each tenant has its own <b>budget</b>; Beta\'s is used up, so its excess gets <b>429 · throttled</b>.',
      'Budgets count <b>bytes and unpacked readings</b>, not just envelopes, so bigger batches cannot bypass them.',
      'They are <b>distributed</b>: shared across gateway replicas, so autoscaling does not multiply a tenant\'s quota.',
      'Heartbeat capacity is <b>reserved</b>, so bulk traffic never starves liveness.',
      'Why here: rejecting excess at the edge of the cloud is the <b>cheapest</b> place to stop it.']],
    ['a-edge', 'Meanwhile, at tenant Acme Retail, camera CAM-14 heartbeats as normal.', [
      'Acme\'s Site-07 is untouched: CAM-14 sends its heartbeat every minute, as always.',
      'The site\'s edge pair batches the site and sends it over <b>mTLS</b>.',
      'Acme changes nothing; isolation is the platform\'s job, not the tenant\'s.']],
    ['a-gw', 'Acme stays within its budget; distributed quotas bound Beta, but shared resources still need headroom.', [
      '<b>Acme\'s bucket</b> has room, so its envelopes pass straight through.',
      'Beta is limited by <b>its own</b> quota, not by a global limit that would throttle everyone.',
      'Honest trade-off: rate limits reduce blast radius; they do not promise <b>zero interference</b> on shared brokers, disks or queries.',
      'So we track <b>per-tenant freshness</b> and keep measured <b>capacity headroom</b>.']],
    ['a-ing', 'Ingestion tags every message with its tenant.', [
      'The tenant comes from the <b>registry lookup</b> at the gateway, never from a name in the payload.',
      'Every reading is keyed <b>tenant + device</b>: here, acme + CAM-14.',
      'Tenant-qualified keys <b>isolate keyed state and deduplication</b> downstream.',
      'A device ID alone would be safe only if it were <b>globally unique</b>.']],
    ['a-kafka', 'Kafka uses shared topics, partitioned by tenant + device, and every message carries its tenant tag.', [
      'All tenants share the same two topics: <b>heartbeats</b> and <b>telemetry</b>.',
      'The key gives per-device order: in this example, Acme CAM-14 lands in P2 and Beta SNS-07 in P0.',
      'Why not a <b>topic per tenant</b>? With thousands of tenants, we keep the pipe simple and enforce fairness at the front door.',
      'Trade-off: shared brokers still need headroom, which is why the gateway bounds admission.']],
    ['a-flink', 'Flink applies Acme\'s rules: SILENT at 10 minutes and DEAD at 20, while another tenant can use 15 and 30.', [
      'Rules are defined <b>per device type</b>, with <b>per-tenant overrides</b>.',
      'For Acme, a silent camera turns <b>SILENT at 10 minutes</b> and <b>DEAD at 20</b>; another tenant can choose <b>15 and 30</b>.',
      'Overrides are pushed <b>live</b> from the control plane: no redeploy.',
      'Rules are <b>versioned</b>; tightening DEAD from 30 to 20 minutes after 25 minutes of silence may fire immediately, by declared policy.',
      'Each incident decision stores its <b>rule version</b>, so a replay knows which rule applied.']],
    ['a-ctrl', 'The control plane owns tenants, sites and RBAC, pushes rule overrides live to Flink, and keeps China tenants in an isolated region.', [
      'The <b>control plane</b> manages tenants, sites, devices, roles and rules.',
      'It is a separate path: config is <b>low-volume and needs consistency</b>; telemetry is high-volume.',
      'Rules flow <b>default → tenant override → pushed live to Flink</b>, with no redeploy.',
      'Three example roles, each seeing less: <b>platform admin</b>, <b>tenant admin</b>, <b>tenant user</b>.',
      '<b>Data residency</b>: China tenants run in an isolated region; the cost is two regions to deploy and operate.']],
    ['a-stor', 'Storage is shared too: every row has a tenant_id, and every query is scoped by tenant.', [
      'Shared tables, <b>no per-tenant partitions</b>: every row carries <b>tenant_id</b>.',
      'Authorisation happens on the <b>server</b>, which scopes every query by tenant.',
      'The same scope applies to <b>cache keys, workflow IDs, replay cursors, exports and SSE</b>.',
      'Trade-off: identity isolation is not performance isolation; query budgets and tenant-specific <b>cells</b> cover exceptional workloads.']],
    ['a-dash', 'Dashboards enforce RBAC: an admin only ever sees their own tenant.', [
      'Every call carries a token that resolves to <b>role + tenant + sites</b>.',
      'The API scopes REST queries, <b>SSE subscriptions</b> and replay cursors on the server.',
      'A <b>platform admin</b> sees all tenants; a <b>tenant admin</b> sees only their own.',
      'Every new endpoint must enforce it, so CI calls each endpoint as the <b>wrong tenant</b>.']],
    ['livepill', 'Acme\'s admin view shows only Acme\'s 214 sites; Beta\'s data is never in the response.', [
      'This is the <b>Acme tenant admin</b> view: 214 sites, drill-down tenant → site → device.',
      'Beta\'s data is not hidden by the browser; it is <b>never sent</b>.',
      'The <b>LIVE · SSE</b> stream is scoped too: the subscription is authorised for Acme\'s sites only.']],
    ['d-CAM-14', 'CAM-14 is healthy: Beta is limited at admission, and per-tenant freshness verifies the isolation.', [
      'CAM-14 shows <b>ONLINE</b>; Acme never saw Beta\'s flood.',
      'Beta was limited <b>at admission</b>, before Kafka, so its excess never entered the pipeline.',
      'We do not just assume isolation: <b>per-tenant freshness</b> shows Acme\'s data is still on time.']]
  ],
  recap: { h: 'Two tenants, one platform: Beta\'s bug stayed Beta\'s problem.', b: [
    '<b>Own quotas</b>: distributed budgets throttle a tenant at the front door.',
    '<b>Tenant tags</b>: tenant + device keys in Kafka, state and storage.',
    '<b>Own rules</b>: per-tenant overrides pushed live from the control plane.',
    '<b>Scoped reads + RBAC</b>: the server decides what each admin can see.',
    '<b>Honest limit</b>: quotas bound the noise; shared capacity still needs measured headroom.'] }
}, {
  1: { steps: [
    { h: 'Every tenant\'s sites follow the same pattern.', hl: [[880, 60, 150, 300], [1300, 14, 200, 392]], b: [
      'This is Acme\'s tenant view; every site on the platform connects the same way.',
      'One <b>edge pair</b> per site batches, spools and runs the firmware agent.',
      'Devices <b>never reach the cloud directly</b>.'] },
    { h: 'Beta\'s flood rides its uplinks to the shared Cloud Gateway.', hl: [[1080, 150, 200, 130]], path: [[1060, 384], [1060, 215], [1074, 215], [1180, 250]], lab: [[1080, 302, 'Beta Mart · 10× traffic', '#B45309']], b: [
      'Beta\'s buggy firmware sends <b>10× normal traffic</b> up its uplinks.',
      'Everything lands at the same <b>Cloud Gateway</b> that Acme uses.'] },
    { h: 'Per-tenant quotas decide what gets in.', hl: [[1080, 150, 200, 130]], at: [1180, 250], b: [
      'The Cloud Gateway checks <b>identity</b> and <b>per-tenant quotas</b>.',
      'That is where Beta\'s flood is bounded, as we see next.'] }] },
  2: { steps: [
    { h: 'Beta\'s Site-03 envelopes arrive alongside Acme\'s.', hl: [[20, 186, 250, 54]], at: [240, 213], b: [
      'Beta\'s <b>buggy firmware</b> is flooding from Site-03.',
      'Acme\'s sites send through the <b>same gateway</b>.'] },
    { h: 'mTLS and tenant lookup: these devices belong to Beta.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], path: [[240, 213], [318, 213], [495, 210], [740, 210]], lab: [[582, 196, 'tenant = beta', '#B45309']], b: [
      'The certificate identifies Beta\'s site gateway and the devices it may speak for.',
      'The registry maps each device to <b>Beta</b>; the payload\'s own claims are ignored.'] },
    { h: 'Beta\'s bucket is empty: 429, throttled.', hl: [[815, 30, 330, 226]], path: [[740, 210], [808, 143], [1100, 236]], b: [
      'Beta\'s excess gets <b>429 · throttled</b>; Acme\'s bucket is untouched.',
      'Only <b>Beta</b> is affected by Beta\'s bug.'] },
    { h: 'Why quotas live here.', hl: [[20, 280, 740, 110]], b: [
      'Tenant and device budgets bound <b>bytes and readings</b> across all replicas.',
      'Heartbeats are <b>reserved</b>; shared capacity still needs measured headroom.',
      'Autoscaling gateway replicas must <b>not multiply</b> a tenant\'s quota.'] }] },
  3: DEV_EDGE_CAMERA('CAM-14'),
  4: { steps: [
    { h: 'Acme Site-07\'s envelope arrives.', hl: [[20, 46, 250, 54]], at: [240, 73], b: [
      'Acme\'s envelope, carrying CAM-14\'s heartbeat, arrives at the <b>same gateway</b> as Beta\'s flood.'] },
    { h: 'mTLS and tenant lookup: Acme.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], path: [[240, 73], [318, 73], [495, 210], [740, 210]], lab: [[582, 196, 'tenant = acme']], b: [
      'Identity comes from the <b>certificate</b> and the <b>registry</b>, never the payload.'] },
    { h: 'Acme is within its quota.', hl: [[815, 30, 330, 226]], path: [[740, 210], [808, 143], [1115, 226]], b: [
      '<b>Acme\'s bucket</b> has room, so the envelope passes.',
      'Beta\'s empty bucket has no effect on Acme\'s.'] },
    { h: 'On to an ingestion pod.', hl: [[1190, 46, 150, 194], [1378, 40, 130, 206]], path: [[1115, 226], [1183, 143], [1310, 143], [1478, 135]], b: [
      'The load balancer spreads envelopes across the <b>stateless</b> ingestion pool.',
      'Shared capacity behind the gateway still needs <b>measured headroom</b>.'] }] },
  5: { steps: [DEV_ING_START('tenant_id = acme'), DEV_ING_VALIDATE, DEV_ING_UNPACK('CAM-14'), DEV_ING_HEARTBEAT('CAM-14')] },
  6: { steps: [
    DEV_KAFKA_IN('CAM-14'),
    { h: 'Shared topics for every tenant, keyed by tenant + device.', hl: [[240, 14, 820, 306]], path: [[160, 200], [232, 180], [420, 126], [789, 126]], b: [
      'Acme and Beta share the same <b>heartbeats</b> and <b>telemetry</b> topics.',
      'In this example, Acme CAM-14 hashes to <b>P2</b> and Beta SNS-07 to <b>P0</b>.',
      'Every message carries its <b>tenant_id</b>.'] },
    { h: 'Fairness is enforced before Kafka.', hl: [[240, 334, 820, 58]], at: [789, 126], b: [
      'Per-tenant quotas at the gateway: <b>no topic per tenant</b>.',
      'Admission budgets reject excess <b>before</b> it reaches the brokers.'] },
    { h: 'A Flink source reader picks it up.', hl: [[1128, 186, 334, 46]], path: [[789, 126], [866, 126], [1100, 126], [1440, 209]], b: [
      'In the Flink consumer group, <b>reader 3</b> owns P2.',
      'Readers can never outnumber partitions.'] }] },
  7: { steps: [
    DEV_FLINK_KEY('CAM-14', [160, 100]),
    { h: 'The control plane broadcasts rules live.', hl: [[444, 268, 250, 74]], b: [
      'Rules arrive as <b>broadcast configuration</b>, with no redeploy.',
      'Versioned rules have <b>effective times</b>, applied deterministically.'] },
    { h: 'The rule engine applies Acme\'s rule.', hl: [[736, 20, 300, 240]], path: [[382, 222], [438, 140], [664, 238], [730, 140], [1006, 230]], lab: [[750, 178, 'Acme · SILENT 10:00 · DEAD 20:00']], b: [
      'CAM-14\'s timer uses <b>Acme\'s</b> ladder: SILENT at 10 minutes, DEAD at 20.',
      'Its heartbeat resets the timer; CAM-14 stays <b>ONLINE</b>.'] },
    { h: 'Another tenant can use 15 and 30 minutes.', hl: [[736, 20, 300, 240], [444, 268, 250, 74]], at: [1006, 230], lab: [[750, 178, 'other tenant · SILENT 15:00 · DEAD 30:00', '#5B3FD9']], b: [
      'The same rule engine, a <b>different override</b> per tenant.',
      'Changing a threshold recalculates existing deadlines from the <b>last fresh heartbeat</b>.',
      'The rule version is stored with each <b>incident decision</b>.'] }] },
  8: { steps: [
    { h: 'Platform admin: all tenants.', hl: [[20, 14, 350, 330]], b: [
      'Onboards tenants, sets device types and default rules, runs <b>firmware rollouts</b>.',
      'Manages <b>quotas</b> and platform health, with a cross-tenant view.'] },
    { h: 'Tenant admin: own tenant only.', hl: [[400, 14, 350, 330]], b: [
      'Manages their <b>sites, devices, users and roles</b>.',
      'Sets <b>rule overrides</b>, for example SILENT at 15 minutes and DEAD at 30.',
      'Quiet hours, digests and integrations are per tenant too.'] },
    { h: 'Tenant user: assigned sites.', hl: [[780, 14, 350, 330]], b: [
      'Sees the live dashboard for <b>their sites</b>, acknowledges alerts, sees ticket status.',
      '<b>No config changes</b>. Each level sees less; the permissions are examples.'] },
    { h: 'How rules reach Flink.', hl: [[1160, 14, 380, 200]], path: [[1480, 82], [1480, 130], [1480, 178]], b: [
      '<b>Default rule</b> per device type, then a <b>tenant override</b>.',
      'Pushed <b>live</b> to Flink: configuration is data, not a deploy.'] },
    { h: 'RBAC on every call, and an isolated region for China.', hl: [[1160, 230, 380, 114]], at: [1500, 290], b: [
      'A token resolves to <b>role + tenant + sites</b>; the API scopes every query by tenant_id.',
      '<b>China tenants</b> run in an isolated region for data residency.'] }] },
  9: { steps: [
    { h: 'One shared storage layer for every tenant.', hl: [[272, 20, 250, 82], [272, 112, 250, 82], [272, 204, 250, 82], [272, 388, 250, 82]], b: [
      'Redis, ClickHouse and MongoDB are <b>shared</b> by all tenants.',
      'Shared tables, no per-tenant partitions: every row carries <b>tenant_id</b>.'] },
    { svg: 'chhot', h: 'ClickHouse: Acme and Beta rows in one table.', hl: [[20, 350, 700, 142]], b: [
      'Example rows: <b>acme</b> TH-05 and <b>beta</b> SNS-07 side by side.',
      'Sharing the storage is fine; sharing the <b>results</b> never is.'] },
    { h: 'Every query starts with tenant_id.', hl: [[24, 234, 692, 22], [750, 10, 760, 196]], b: [
      'The sort key leads with <b>tenant_id</b>, so a scoped query reads only that tenant\'s blocks.',
      'Scoping is done by <b>server-side authorisation</b>, not by the client.'] },
    { svg: 'mongo', h: 'MongoDB: every index starts with tenant_id.', hl: [[680, 10, 830, 230], [680, 260, 830, 130]], b: [
      'Device, site and rule lookups all begin with <b>tenant_id</b>.',
      'Tenant isolation <b>by design</b>, not by a filter added later.'] },
    { svg: 'redis', h: 'Redis keys and channels carry the tenant too.', hl: [[20, 44, 900, 170]], b: [
      'Keys like <code>dev:{acme:site-07}:CAM-14</code> and channels like <code>live:acme</code> are tenant-scoped.',
      'So caches and live streams follow the same scope as queries.'] }] },
  10: { steps: [
    { h: 'Every call resolves role, tenant and sites.', hl: [[490, 284, 320, 90]], at: [780, 340], b: [
      '<b>RBAC on every call</b>: the token gives role + tenant + sites.',
      'That scope is applied to <b>every query</b>, server-side.'] },
    { h: 'A platform admin sees all tenants.', hl: [[880, 20, 300, 370]], b: [
      'Health, quotas and firmware rollouts across <b>all tenants</b>.',
      'That is the only role with a cross-tenant view.'] },
    { h: 'Acme\'s tenant admin sees only Acme.', hl: [[1200, 20, 310, 370]], at: [1470, 186], b: [
      'Drill-down <b>tenant → site → device</b>, within Acme only.',
      'A tenant admin <b>never sees another tenant</b>.'] },
    { h: 'Live streams are scoped the same way.', hl: [[490, 64, 320, 96], [1200, 20, 310, 370]], b: [
      'The SSE hub <b>subscribes per tenant</b>, so Acme\'s pages only get Acme\'s changes.',
      'Replay cursors and snapshots are authorised by the same tenant and sites.'] }] }
});
