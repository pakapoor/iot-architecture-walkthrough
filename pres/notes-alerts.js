// Presenter notes: Critical · auto-resolve (2), Critical · ServiceNow down (5), Minor · digest (3). Format: see pres/notes.js (flow 1) and registerFlow().
// Flows 2 and 5 share their opening stops with flow 1 (same camera, same captions), so those steps and their
// inside views are taken from flow 1 rather than copied; only the stops whose captions differ are written here.
{   // block scope: helper names stay local to this file
const F1 = n => NOTES[1].steps[n - 1].slice(0, 3);   // flow 1 step n: [id, heading, bullets]
const F1_INSIDE = { 1: INSIDE[1][1], 2: INSIDE[1][2], 3: INSIDE[1][3], 4: INSIDE[1][4], 5: INSIDE[1][5], 6: INSIDE[1][6], 7: INSIDE[1][7], 8: INSIDE[1][8], 9: { handoff: true } };

// ---------------------------------------------------------------- flow 2 · Critical · auto-resolve
registerFlow(2, {
  name: 'Critical · auto-resolve',
  intro: { h: 'A camera went offline, and then came back on its own.', b: [
    'Same start as before: <b>CAM-14</b> at Acme Retail Site-07 goes silent and is declared <b>DEAD</b>.',
    'On-call is paged at minute 20, a ticket is raised at minute 30, and the incident <b>escalates</b>.',
    'Then the camera <b>comes back on its own</b>, which devices often do.',
    'Watch for one thing: the <b>same workflow</b> that opened the incident is the one that closes it.'] },
  steps: [
    F1(1), F1(2), F1(3), F1(4), F1(5), F1(6), F1(7), F1(8), F1(9),
    F1(10), F1(11), F1(12), F1(13), F1(14),
    F1(15), F1(16), F1(17), F1(18), F1(19), F1(20), F1(21),
    ['act-x', 'CAM-14 is back and stays healthy, so Flink signals the same incident workflow.', [
      'CAM-14\'s heartbeats return, and Flink sees the device <b>recover</b>.',
      'Example policy: it must stay healthy for a <b>stable interval</b>, for example 5 minutes, before it counts.',
      'That interval is <b>hysteresis</b>: one good heartbeat does not resolve an incident.',
      'Flink signals the <b>same workflow ID</b>: tenant + device + outage generation.',
      'A real recurrence later gets a <b>new outage generation</b>, so an old recovery cannot close a new incident.',
      'Had CAM-14 come back <b>before minute 30</b>, the ticket timer would have been cancelled: no ticket at all.']],
    ['ws4', 'Step 4: the recovery signal arrives, and the workflow resolves the ticket.', [
      'The workflow receives the <b>"device recovered"</b> signal.',
      'Handlers check the incident ID and <b>version</b>, so a stale signal is rejected.',
      'Had recovery arrived during ticket retries, it would be <b>persisted</b> at once and reconciled.',
      'Alternative: a separate "resolved" event, matched up later. Instead, the workflow that opened it closes it.']],
    ['act-sn', 'Ticket INC-1042 is auto-resolved.', [
      'The workflow marks <b>INC-1042 resolved</b> in ServiceNow.',
      'The ticket carries the <b>full timeline</b>: page, escalation, recovery.',
      'Nobody had to close it by hand.']],
    ['act-oc', 'On-call is stood down, with no human needed, and the workflow completes.', [
      'Paging is resolved with the <b>same incident ID</b>, and on-call is stood down.',
      'The workflow <b>completes</b>; its history is the audit trail.',
      '<b>Self-healing</b>: humans only see what actually needs a human.',
      'Trade-off: we must define the recovery interval and the <b>reopen policy</b> carefully.']]
  ],
  recap: { h: 'The camera fixed itself, and so did the ticket.', b: [
    '<b>Detect</b>: a per-device Flink timer, no polling of 100M rows.',
    '<b>One incident ID</b>: tenant + device + outage generation, from first page to resolution.',
    '<b>Recovery is a signal</b> to the same workflow, not a new event matched up later.',
    '<b>Self-healing</b>: the ticket auto-resolves and on-call stands down.',
    'Humans only see what <b>actually needs a human</b>.'] }
}, F1_INSIDE);

// ---------------------------------------------------------------- flow 5 · Critical · ServiceNow down
registerFlow(5, {
  name: 'Critical · ServiceNow down',
  intro: { h: 'ServiceNow is down, at the moment a camera dies.', b: [
    'Same camera, same outage: <b>CAM-14</b> at Acme Retail Site-07 goes silent.',
    'This time <b>ServiceNow is down</b> just when the incident needs a ticket.',
    'We follow the ticket through <b>bounded retries</b>, a <b>parked</b> state and a <b>human replay</b>.',
    'Watch for three things: the page never waits, escalation keeps its deadline, and there is still exactly <b>one ticket</b>.'] },
  steps: [
    F1(1), F1(2), F1(3), F1(4), F1(5), F1(6), F1(7), F1(8), F1(9),
    F1(10),
    ['b-sns', 'SNS fans it out, and on-call is paged now: the page never waits on ServiceNow.', [
      '<b>SNS</b> delivers the DEAD event to many consumers.',
      '<b>PagerDuty pages on-call straight off SNS</b> at minute 20, the moment CAM-14 is DEAD.',
      'ServiceNow being down only delays the <b>ticket</b>, never the alarm.',
      'Ticketing is bookkeeping; <b>paging is the alarm</b>.',
      'Trade-off: two paths, paging and ticketing, to keep consistent.']],
    ['b-sqs', 'SQS redelivers if the starter fails, and sends a message to its DLQ after N receives.', [
      'SQS is the first retry layer: it retries <b>delivery</b> to the ticket starter.',
      'If the starter fails, the message is <b>redelivered</b> after the <b>visibility timeout</b>.',
      'The starter acknowledges SQS only after Temporal has <b>durably accepted</b> the incident.',
      'After <b>N receives</b>, the message goes to the <b>SQS DLQ</b>, with an alarm and a replay tool.',
      '<b>SQS handles delivery retries; Temporal handles business retries</b>, like a ServiceNow outage.']],
    F1(13), F1(14),
    F1(15), F1(16),
    ['act-sn', 'Attempt 1 gets a 503, and Temporal backs off and retries in 2 seconds.', [
      'At minute 30 the first attempt returns <b>503</b>: service unavailable.',
      'Temporal\'s retry policy backs off and retries in <b>2 seconds</b>.',
      'The workflow is not blocked: <b>acknowledgement and recovery signals</b> still reach it.',
      'On-call was already paged; only the ticket is waiting.']],
    ['act-sn', 'Attempt 2 times out, and the ticket may have been created anyway.', [
      'Attempt 2 <b>times out</b>; the next retry is in 4 seconds.',
      'A timeout means <b>unknown</b>, not failed: ServiceNow may have created the ticket.',
      'Temporal cannot stop a remote request that is already in flight.',
      'So every retry sends the <b>same correlation_id</b>; example integration: ServiceNow\'s unique key is the backstop.']],
    ['act-sn', 'Attempts 3 to 5 get 503 or 429, and the backoff grows to 8, 16, then 32 seconds.', [
      'Attempts 3 to 5 return <b>503</b> or <b>429</b>, too many requests.',
      'The backoff grows: <b>8 s, 16 s, then 32 s</b>.',
      'Retries are <b>bounded</b>: retrying forever hides an outage; a limit makes it visible.',
      'Attempt 5 of 5 fails, and the retries are exhausted.']],
    ['ws2', 'Step 2: retries are exhausted, but the workflow does not fail; it is PARKED.', [
      'Ticket creation moves to a durable <b>PARKED</b> state; the workflow keeps running.',
      'It shows up in the <b>"DLQ · parked incidents"</b> list for ops.',
      'Alternative: publish to a separate SQS DLQ. Parking keeps <b>one owner, one history</b>.',
      'The parked list and the SQS DLQ serve <b>different failures</b>: business work versus transport.',
      'Park, don\'t drop.']],
    ['act-oc', 'Ops is alerted; only ticket creation is parked, and the original page deadline is still running.', [
      'Ops is alerted: <b>one parked</b> incident.',
      'Only <b>ticket creation</b> is parked; the incident itself stays live.',
      '<b>Acknowledgement and recovery</b> signals are still accepted.',
      'The original 30-minute <b>paging deadline</b> is still running.',
      'Design example: alarm on the <b>oldest parked age</b>, so nothing sits there forgotten.']],
    ['ws3', 'Step 3: a durable wait for a human "replay" signal, for minutes or days, with no state lost.', [
      'The workflow now waits durably for a human <b>"replay"</b> signal.',
      'It can wait <b>minutes or days</b>; no state is lost.',
      'Why a human: replaying everything the moment ServiceNow recovers can <b>knock it over again</b>.']],
    ['act-x', 'No acknowledgement by the original 30-minute deadline, so L2 is paged while the ticket is still parked.', [
      'Thirty minutes after the <b>original page</b>, at minute 50, there is still no acknowledgement.',
      'The durable timer fires and <b>L2 is paged</b>, though ticket creation is still parked.',
      'Parking the ticket never pauses <b>escalation</b>.',
      'The deadline is anchored to the page time, so retries and parking cannot reset it.']],
    ['act-sn', 'ServiceNow recovers, and ops checks that it is healthy before replaying.', [
      'ServiceNow comes back and reports <b>healthy</b> again.',
      'Ops <b>checks integration health</b> before replaying anything.',
      'Alternative: automatic replay on a health check. A human decides <b>when</b> work resumes.',
      'Approval does not replace <b>backpressure, idempotency</b> or a current-state check.']],
    ['act-oc', 'Ops clicks Replay, which signals the same workflow: a human approval step inside a long-running workflow.', [
      'Ops clicks <b>Replay</b>, which sends a signal to the <b>same workflow</b>.',
      'This is a <b>human step</b> in the middle of a long-running flow; Temporal is built for that.',
      'Design example: parked incidents replay in <b>bounded batches</b>, within integration rate limits.',
      'So a recovered ServiceNow is not hit by a fleet-wide retry surge.']],
    ['ws4', 'Step 4: replay upserts again, idempotent by incident ID.', [
      'The workflow first <b>reconciles</b> the current acknowledgement and recovery state.',
      'Then it upserts again with the same <b>incident ID</b> as the correlation_id.',
      'If the timed-out attempt had landed, the uniqueness conflict becomes a <b>lookup and update</b>.']],
    ['act-sn', 'There is exactly one ticket, INC-1042, at P1, even if an earlier attempt landed.', [
      'ServiceNow holds <b>exactly one ticket: INC-1042</b>.',
      'It is <b>P1</b>, because the original escalation deadline has already passed.',
      'That holds even if the timed-out attempt had created the ticket.',
      'One incident, one ticket, however many retries.']],
    ['act-x', 'The workflow reconciles current state: the paging deadline survived parking, and recovered devices get no stale ticket.', [
      'The workflow is <b>un-parked</b> and running again, escalated, with INC-1042 open.',
      'The original paging deadline <b>survived parking</b>: L2 was paged on time.',
      'If CAM-14 had recovered while parked, replay would <b>not</b> open a stale ticket.',
      'Trade-off: an expired attempt can still finish remotely, so every hop needs a stable idempotency key.']]
  ],
  recap: { h: 'ServiceNow went down. On-call was still paged, and there is still one ticket.', b: [
    '<b>Page first</b>: PagerDuty fires straight off SNS; a ticketing outage only delays the ticket.',
    '<b>Two retry layers</b>: SQS retries delivery; Temporal retries the ServiceNow call.',
    '<b>Bounded retries, then PARKED</b>, not failed: signals and the original deadline stay live.',
    '<b>Human replay</b> after a health check, reconciling current state first.',
    '<b>Idempotent by incident ID</b>: exactly one ticket, even after a timeout.'] }
}, F1_INSIDE);

// ---------------------------------------------------------------- flow 3 · Minor · digest
registerFlow(3, {
  name: 'Minor · digest',
  intro: { h: 'A sensor is getting slow. It is worth knowing about, not worth waking anyone.', b: [
    'A footfall sensor, <b>SNS-03</b> at Acme Retail Site-07, starts responding slowly: <b>3.2 seconds</b>.',
    'It is not dead, so this is a <b>minor</b> issue, not an outage.',
    'We follow it from detection to a <b>site digest</b> and the <b>dashboard</b>.',
    'Watch for one thing: minor issues are <b>visible</b> at once, but they never <b>page</b> anyone.'] },
  steps: [
    ['a-edge', 'Footfall sensor SNS-03 reports telemetry every minute.', [
      'SNS-03 is a <b>footfall sensor</b>; it speaks <b>BLE</b> to a bridge that translates to IP.',
      'The site\'s edge gateway <b>batches</b> its readings with every other device at Site-07.',
      'Gateways run as an <b>active / standby</b> pair; if the cloud is unreachable, they <b>spool to disk</b>.',
      'Each batch travels to the cloud over <b>mTLS</b>.']],
    F1(2),
    ['a-ing', 'Ingestion validates, unpacks and routes SNS-03\'s reading.', [
      'A <b>stateless, autoscaled</b> pool validates each payload against its <b>Avro schema</b>.',
      'It unpacks the site batch and keys each reading by <b>tenant + device</b>.',
      'SNS-03\'s readings are bulk <b>telemetry</b>, so they go to the telemetry topic.',
      '<b>Heartbeats</b> keep their own priority topic, so bulk telemetry cannot delay liveness.']],
    F1(4),
    ['a-flink', 'Flink sees SNS-03\'s latency at 3.2 seconds, and the rule watches a 10-minute window.', [
      'Each device has <b>keyed state</b> in Flink, so SNS-03\'s recent readings live with its key.',
      'The <b>SLOW</b> rule fires only if the device stays slow for the whole window: here <b>10 minutes</b>.',
      'One slow reading is noise; ten slow minutes is a pattern.',
      'Thresholds are rules per device type, with <b>per-tenant overrides</b> pushed live from the control plane.',
      'Nothing polls a database: the rule runs on the stream.']],
    ['a-flink', 'Ten slow minutes: the rule fires, and SNS-03 is SLOW, a minor issue.', [
      'The rule engine moves SNS-03 to <b>SLOW</b>, which is <b>minor</b>.',
      'Only the <b>state transition</b> leaves Flink, not every slow reading.',
      'SLOW goes to the <b>minor lane</b>; a DEAD device would take the critical lane.',
      'The change is also pushed <b>live</b> to the dashboard service.']],
    ['a-act', 'The minor lane batches it into a 15-minute site digest, and nobody gets paged.', [
      'Minor alerts go over <b>SQS</b> to a <b>notification service</b>, not to PagerDuty.',
      'They roll into one <b>15-minute digest per site</b>, with <b>suppression</b> of repeats and <b>quiet hours</b>.',
      'Why: fifty minor alerts from one site should be <b>one message</b>, not fifty pings.',
      'Trade-off: up to <b>15 minutes of delay</b> on minor issues.',
      'The cheapest alert is the one nobody gets at 3 AM.']],
    ['a-dash', 'The alert status is pushed to the tenant dashboard.', [
      'Flink pushes the change to the <b>dashboard service</b>, which updates open pages over <b>SSE</b>.',
      'We batch the <b>notification</b>, never the <b>visibility</b>.',
      'Push, not polling: thousands of dashboards polling the hot store would waste queries.',
      'Every call is scoped by <b>RBAC</b>: Acme\'s admins see only Acme.',
      'Let\'s zoom into the tenant dashboard.']],
    ['d-SNS-03', 'On the Site-07 dashboard, SNS-03 turns yellow: DEGRADED.', [
      'The tenant admin drills down <b>tenant → site → device</b>: Acme Retail, Site-07, SNS-03.',
      'SNS-03\'s card shows <b>DEGRADED · SLOW</b>: latency 3.2 s, where it normally shows about 160 ms.',
      'The site tiles update live: <b>47 online, 1 degraded</b>.',
      'It arrived over the <b>SSE</b> stream; nobody refreshed the page.']],
    ['alist', 'It lands in the site alert feed: minor, and no page.', [
      'The site alert feed shows <b>SNS-03 · SLOW</b>, latency 3.2 s.',
      'It is marked <b>minor</b>, and added to the 15-minute site digest.',
      'Nothing is hidden: anyone looking sees it at once, and nobody is woken for it.',
      'Trade-off: two views of the same alert, the feed and the digest, to keep in sync.']],
    ['toast', 'One 15-minute digest goes out by Email and Slack, not fifty pings.', [
      'One <b>Site-07 digest</b> goes out by <b>Email and Slack</b> for the 15-minute window.',
      'It respects <b>quiet hours</b>, and repeats are folded together.',
      'Batch by where people act: the <b>site</b>.',
      'Trade-off: suppression and quiet-hour rules to maintain per tenant.']]
  ],
  recap: { h: 'A slow sensor got noticed, not escalated.', b: [
    '<b>Detect</b>: a Flink rule over a 10-minute window, not one slow reading.',
    '<b>Route by severity</b>: SLOW goes to the minor lane, never to paging.',
    '<b>Batch the notification</b>: one 15-minute digest per site, with quiet hours.',
    '<b>Never batch the visibility</b>: the dashboard turns yellow live, over SSE.',
    'Separate the urgent from the important, or people start ignoring both.'] }
}, {
  1: { steps: [   // tenant view, then Site-07 (small site): SNS-03 → BLE bridge → Gateway A → WAN
    { h: 'Acme Retail has 214 sites. SNS-03 is at Site-07.', hl: [[40, 60, 400, 300]], at: [408, 146], b: [
      'One tenant, many sites: Acme has <b>214 stores</b>, each with its own devices.',
      'SNS-03 is one of Site-07\'s <b>footfall sensors</b>.',
      'Every site connects through its own <b>edge pair</b>; devices never reach the cloud directly.'] },
    { svg: 'small', h: 'Inside Site-07: SNS-03 sends its reading.', hl: [[40, 264, 230, 56]], at: [250, 292], b: [
      'Once a minute, SNS-03 reports its <b>telemetry</b>.',
      'Footfall sensors speak <b>BLE</b>, which is not IP.',
      'The link types are an <b>example</b>; the pattern is what matters.'] },
    { h: 'The bridge translates to IP, and Gateway A batches the site.', hl: [[40, 264, 230, 56], [300, 196, 150, 124], [490, 60, 300, 180]], path: [[250, 292], [296, 292], [420, 300], [450, 258], [484, 258], [760, 212]], lab: [[506, 196, 'Site-07 · one batch']], b: [
      'A <b>Zigbee / BLE bridge</b> turns the reading into <b>MQTT over the LAN</b>.',
      'It reaches the <b>active gateway</b>, together with every other device at the site.',
      'The gateway <b>batches readings per site</b> instead of forwarding each one.',
      '<b>Gateway B</b> stands by and takes over if A fails.'] },
    { h: 'The batch crosses the WAN over mTLS.', hl: [[490, 60, 300, 180], [910, 90, 220, 130]], path: [[760, 212], [790, 150], [904, 150], [1100, 190]], b: [
      'The edge pair holds the site\'s <b>only uplink</b>.',
      'The envelope travels over <b>mTLS</b>: the gateway proves its identity with a certificate.',
      'If the WAN drops, Gateway A <b>spools to disk</b>, bounded and alarmed, and flushes on reconnect.'] }] },
  2: { steps: [
    { h: 'Acme Site-07\'s envelope arrives.', hl: [[20, 46, 250, 54]], at: [240, 73], b: [
      'Envelopes arrive from many sites and many tenants at once.',
      'This one is from <b>Acme Retail, Site-07</b>, carrying SNS-03\'s reading.',
      'Below it, Beta\'s Site-03 has <b>buggy firmware</b> and is flooding traffic.'] },
    { h: '1 · mTLS: who is sending?', hl: [[325, 46, 200, 194]], path: [[240, 73], [318, 73], [495, 210]], lab: [[337, 196, 'cert ✓ Site-07']], b: [
      'The gateway <b>terminates TLS</b> and reads the client certificate.',
      'The certificate identifies the <b>site gateway</b> and the devices it may speak for.',
      'Each device inside the batch is checked against that list.'] },
    { h: '2 · Tenant lookup: whose devices are these?', hl: [[570, 46, 200, 194]], path: [[495, 210], [740, 210]], lab: [[582, 196, 'tenant = acme']], b: [
      'Each device is mapped to its <b>tenant from the registry</b>.',
      'The gateway tags every reading with <b>tenant_id</b>.',
      'It never trusts a tenant name written in the payload itself.'] },
    { h: '3 · Quotas: Acme is within budget, Beta is throttled.', hl: [[815, 30, 330, 226]], path: [[740, 210], [808, 143], [1115, 226]], b: [
      '<b>Acme\'s bucket</b> has room, so the envelope passes.',
      '<b>Beta\'s bucket</b> is empty: its excess gets <b>429 · throttled</b>, and only Beta is affected.',
      'Budgets count <b>bytes and readings</b>, shared across all gateway replicas.'] },
    { h: '4 · Load balancer → an ingestion pod.', hl: [[1190, 46, 150, 194], [1378, 40, 130, 206]], path: [[1115, 226], [1183, 143], [1310, 143], [1478, 135]], b: [
      'The load balancer spreads envelopes across the <b>ingestion pool</b>.',
      'Any pod can take it: ingestion is <b>stateless</b>.'] }] },
  3: { steps: [
    { h: 'The envelope arrives, already tagged with its tenant.', hl: [[20, 120, 180, 110]], at: [170, 200], b: [
      'It comes from the Cloud Gateway: authenticated and <b>tenant-tagged</b>.',
      'It still holds a whole site\'s batch of readings.'] },
    { h: '1 · Validate against the Avro schema.', hl: [[275, 66, 330, 58]], path: [[170, 200], [248, 175], [580, 95]], b: [
      'Every payload must match its <b>Avro schema</b> from the schema registry.',
      'Invalid data is <b>rejected, counted and alarmed</b> in Datadog, never passed on silently.'] },
    { h: '2 · Unpack: one key per reading.', hl: [[275, 142, 330, 58]], path: [[580, 95], [580, 171]], lab: [[620, 186, 'key = acme + SNS-03']], b: [
      'The site batch is split into <b>individual device readings</b>.',
      'SNS-03\'s reading gets the key <b>tenant + device</b>.',
      'That key decides the Kafka partition, which keeps each device\'s events in order.'] },
    { h: '3 · Route: SNS-03\'s reading goes to the telemetry topic.', hl: [[275, 218, 330, 58], [905, 220, 300, 100]], path: [[580, 171], [580, 247], [605, 258], [860, 258], [860, 270], [900, 270], [1175, 290]], b: [
      'SNS-03\'s reading is bulk data, so it goes to the <b>telemetry</b> topic.',
      'Telemetry feeds charts and rollups; Flink reads both topics, so the rules see it too.',
      '<b>Heartbeats</b> stay on their own priority topic, so bulk traffic never delays liveness.'] },
    { h: 'Any pod can do this work.', hl: [[630, 80, 168, 48]], b: [
      'Ingestion pods hold <b>no state</b>, so any pod can die without losing data.',
      'The pool <b>scales out</b> on CPU and lag.'] }] },
  4: { steps: [
    { h: 'The reading arrives from ingestion.', hl: [[20, 130, 170, 100]], at: [160, 200], b: [
      'Ingestion publishes SNS-03\'s reading with the key <b>tenant + device</b>.',
      'Message contracts are <b>Avro</b>, governed by the schema registry.'] },
    { h: 'hash(acme + SNS-03) picks one partition of the telemetry topic.', hl: [[250, 166, 620, 98]], path: [[160, 200], [232, 180], [420, 216], [729, 216]], b: [
      'The same key always hashes to the <b>same partition</b>.',
      'So all of SNS-03\'s readings stay <b>in order</b>.',
      'The partition is shared with other devices; ordering is per device, not across the fleet.',
      'All tenants share these topics; every message carries its <b>tenant_id</b>.'] },
    { h: 'It is appended to a durable, replayable log.', hl: [[440, 200, 430, 32], [440, 280, 430, 24]], at: [729, 216], b: [
      'The reading is <b>appended</b> at the end of its partition and gets the next offset.',
      'Retention keeps <b>days of history</b>, so the log can be replayed.',
      'In a burst, Kafka turns extra traffic into <b>lag, not loss</b>.'] },
    { h: 'A Flink source reader picks it up.', hl: [[1128, 126, 334, 46]], path: [[729, 216], [866, 216], [1100, 216], [1440, 149]], b: [
      'In the Flink consumer group, <b>one reader</b> owns each partition.',
      'There can be at most one source reader per partition.',
      'After this, Flink\'s keyed operators scale <b>separately</b> from the readers.'] },
    { h: 'If something goes wrong: rewind and replay.', hl: [[1110, 334, 370, 58]], at: [1450, 363], b: [
      'Flink records its Kafka <b>offsets in each checkpoint</b>.',
      'After a crash or a bug fix, it <b>rewinds</b> to those offsets and reprocesses.'] }] },
  5: { steps: [
    { h: 'The reading arrives on the telemetry topic.', hl: [[20, 150, 170, 90]], at: [165, 215], b: [
      'SNS-03\'s reading arrives from the <b>telemetry</b> topic.',
      'It reports a latency of <b>3.2 seconds</b>.'] },
    { h: 'keyBy sends it to SNS-03\'s own state.', hl: [[232, 40, 170, 200]], path: [[165, 215], [226, 195], [382, 222]], lab: [[240, 186, 'acme + SNS-03']], b: [
      'Flink partitions work by <b>tenant + device</b>: one owner for SNS-03.',
      'That owner keeps SNS-03\'s <b>state</b>, including its recent readings.',
      '<b>Event time</b> with watermarks handles telemetry that arrives out of order.'] },
    { h: 'Dedup + enrich.', hl: [[444, 30, 250, 220]], path: [[382, 222], [438, 140], [664, 238]], lab: [[456, 170, 'new ✓ · footfall · Site-07']], b: [
      'A duplicate check uses <b>boot/session + stream + sequence</b>, within a bounded window.',
      'Device metadata is joined in: <b>type, tenant, site</b>.',
      'The device type decides which rules apply.'] },
    { h: 'Rule engine: SNS-03 has been slow for part of the 10-minute window.', hl: [[736, 20, 300, 240]], path: [[664, 238], [730, 140], [1006, 230]], lab: [[750, 186, 'SNS-03 · slow {timer} / 10:00', '#B45309']], timer: [0, 599], b: [
      'The <b>SLOW</b> rule needs the device to stay slow for a sustained window: here <b>10 minutes</b>.',
      'A single slow reading does not trigger it.',
      'No scan, no polling: the rule state lives with SNS-03\'s key.'] },
    { h: 'The rules come from the control plane.', hl: [[444, 268, 250, 74], [736, 20, 300, 240]], at: [1006, 230], lab: [[750, 186, 'SNS-03 · slow 9:59 / 10:00', '#B45309']], b: [
      'Rules are defined per <b>device type</b>, with <b>per-tenant overrides</b>.',
      'The control plane <b>broadcasts</b> them to Flink live, with no redeploy.'] }] },
  6: { steps: [
    { h: 'Ten minutes: the SLOW rule fires.', hl: [[736, 20, 300, 240]], at: [1006, 230], lab: [[750, 186, 'SNS-03 · 10:00 · SLOW (minor)', '#B45309']], b: [
      'SNS-03 has been slow for the whole <b>10-minute window</b>, so the rule fires.',
      'The rule engine moves SNS-03 to <b>SLOW</b>, which is <b>minor</b>.'] },
    { h: 'The transition goes to the minor lane.', hl: [[1104, 86, 300, 56]], path: [[1006, 230], [1036, 140], [1070, 140], [1070, 114], [1374, 114]], b: [
      'SLOW is minor, so it goes to the <b>minor lane</b> and the 15-minute digest.',
      'It never touches the critical lane, so <b>nobody is paged</b>.'] },
    { h: 'The dashboard sees it live.', hl: [[1104, 152, 300, 56], [1110, 354, 300, 26]], path: [[1374, 114], [1070, 114], [1070, 180], [1374, 180]], b: [
      'The change is pushed <b>live</b> to the dashboard service, which updates open pages over SSE.',
      'Only <b>state changes</b> go downstream, not every slow reading.'] }] },
  8: { steps: [
    { h: 'Flink pushes SNS-03\'s change to the dashboard service.', hl: [[240, 14, 190, 54], [490, 64, 320, 96]], path: [[458, 41], [458, 100], [780, 140]], lab: [[215, 140, 'SNS-03 → DEGRADED', '#B45309']], b: [
      'Flink sends the <b>live update</b> straight to the dashboard service.',
      'The <b>SSE stream hub</b> subscribes per tenant through <b>Redis</b>.',
      'It pushes <b>only what changed</b> to the pages that are open.'] },
    { h: 'RBAC scopes who receives it.', hl: [[490, 284, 320, 90]], path: [[780, 140], [780, 345]], b: [
      'Every call is checked for <b>role + tenant + sites</b>.',
      'Only Acme users with access to Site-07 receive this update.'] },
    { h: 'The Acme tenant admin sees Site-07 change.', hl: [[1200, 20, 310, 370]], path: [[780, 345], [1190, 330], [1466, 136]], b: [
      'The tenant admin view drills <b>tenant → site → device</b>.',
      'It never sees another tenant.',
      'Why SSE: updates flow one way, over plain HTTP, with built-in <b>reconnect and replay</b>.'] },
    { h: 'History comes from ClickHouse, on demand.', hl: [[20, 170, 180, 100], [490, 174, 320, 96]], path: [[1466, 136], [1190, 330], [780, 230]], b: [
      'Charts come through the <b>REST API</b>, from ClickHouse.',
      'The live change needed no query; polling thousands of dashboards would waste them.'] }] }
});
}
