// Presenter notes for the explanation panel: one entry per stop, in timeline order.
// Each step is [stop id, heading, [bullets]]. The stop id must match the stop in pres/timeline2p.js;
// a mismatch is reported in the console and that step falls back to its caption.
// Allowed markup: <b>, <i>, <code>, <br>. Keep "example" / "designed-for" qualifiers where the design is illustrative.
const NOTES = {
  1: {
    name: 'Critical alert · field fix',
    intro: { h: 'A camera at a retail store dies at 3 AM. Nobody is watching it.', b: [
      'We follow one camera, <b>CAM-14</b> at Acme Retail Site-07, from going silent to a closed ticket.',
      'Three stages: <b>detect</b> the silence, <b>page</b> the right person, and <b>manage the incident</b> until the fix.',
      'The fix needs a technician on site, so the incident stays open for <b>two days</b>.',
      'The alert is <b>graded</b>: yellow at 10 minutes, a page at 20, a ticket at 30.',
      'Watch for three things: no polling, exactly <b>one ticket</b>, and escalation written as code.'] },
    steps: [
      ['a-edge', 'Every device checks in once a minute.', [
        'Cameras and sensors talk <b>MQTT / CoAP</b> to a local gateway at the store.',
        'Gateways run as an <b>active / standby</b> pair, so one failed gateway does not blind the site.',
        'The gateway <b>batches heartbeats per site</b>: 100M devices × 1/min is about 1.7M readings/sec, sent as roughly <b>200K envelopes/sec</b> at normal peak.',
        'If the cloud is unreachable, the gateway <b>spools to disk</b> and retries; the spool is bounded and alarmed.',
        'Each envelope travels to the cloud over <b>mTLS</b>.']],
      ['a-gw', 'The Cloud Gateway is the trust boundary.', [
        'It terminates <b>mTLS</b> and checks that the certificate belongs to a known gateway and its allowed devices.',
        'It resolves every device to its <b>tenant</b> from the registry, and tags the data with tenant_id.',
        'It enforces <b>per-tenant quotas</b> and per-device rate limits, with heartbeat capacity reserved.',
        'Rejecting excess traffic here is the cheapest place to stop it: one noisy tenant cannot flood everyone else.',
        'Finally it load-balances across the ingestion pool.']],
      ['a-ing', 'Ingestion validates, unpacks and routes.', [
        'A <b>stateless, autoscaled</b> pool on Kubernetes: any pod can die without losing anything.',
        'It validates each payload against its <b>Avro schema</b>; invalid data is rejected, counted and alarmed.',
        'It unpacks the site batch and keys every reading by <b>tenant + device</b>.',
        '<b>Heartbeats go to their own priority topic</b>, ahead of bulk telemetry.',
        'Why: losing one chart point is fine, but a delayed heartbeat can raise a <b>false DEAD</b> alert and wake someone up.']],
      ['a-kafka', 'Kafka is the durable backbone.', [
        'Two shared topics for all tenants: <b>heartbeats</b> (priority) and <b>telemetry</b> (bulk).',
        'The key is <b>tenant + device</b>, so all of one device\'s events land in one partition, <b>in order</b>.',
        'It is a <b>durable log</b> with retention: after a bug or an outage we rewind and <b>replay</b>.',
        'It absorbs bursts, so downstream processing runs at its own pace.',
        'Fairness is enforced at the gateway, not with a topic per tenant.']],
      ['a-flink', 'Flink keeps a timer for every device.', [
        'Each device has <b>keyed state</b> in Flink, and a <b>timer that resets on every heartbeat</b>.',
        'Nothing scans a table of 100M last-seen times looking for silent devices.',
        'This is why <b>Flink beat Kinesis + Lambda</b>: with Lambda you store last-seen in a database and poll it.',
        'Timers and state are <b>checkpointed</b>, so a restart does not forget them.',
        'A late heartbeat flushed from a spool is history: it does <b>not</b> refresh current health.']],
      ['a-flink', 'CAM-14 goes silent. Its timer keeps counting.', [
        'No heartbeat arrives, so nothing resets the timer; it simply runs.',
        'There is no polling job and no query: the <b>absence of an event</b> is what we detect.',
        'Silence only means something if the observer is healthy, so <b>pipeline freshness</b> is monitored separately.',
        'If the pipeline itself were behind, devices would show <b>UNKNOWN</b> instead of paging on-call for every device.']],
      ['a-flink', 'Ten minutes of silence: CAM-14 turns yellow, SILENT.', [
        'At <b>10 minutes</b> the timer fires, moves CAM-14 to <b>SILENT</b>, and re-arms for minute 20.',
        'SILENT shows on <b>dashboards only</b>: no page, no ticket.',
        'Why: most short silences are a <b>network blip</b> or a reboot, and they recover on their own.',
        'If a heartbeat arrives now, CAM-14 is back to ONLINE and <b>nobody was woken</b>.',
        'SILENT is not DEGRADED: a DEGRADED device is still talking, just slowly.']],
      ['a-flink', 'Twenty minutes of silence: the timer fires again, CAM-14 is DEAD.', [
        'The rule engine moves CAM-14 from SILENT to <b>DEAD</b>.',
        'The ladder: <b>10 min SILENT</b> on dashboards, <b>20 min DEAD</b> and a page, <b>30 min</b> a ticket.',
        'Only <b>state transitions</b> leave Flink; a healthy heartbeat that changes nothing is not forwarded.',
        'The transition gets a stable <b>incident ID: tenant + device + outage generation</b>.',
        'Thresholds are rules per device type, with <b>per-tenant overrides</b> pushed live from the control plane.']],
      ['a-act', 'Critical incidents take the fast lane.', [
        'Action Execution has <b>two lanes</b>: critical and minor.',
        '<b>Critical</b> skips batching: on-call is paged <b>now</b>, and a ticket follows at minute 30 if CAM-14 is still DEAD.',
        '<b>Minor</b> issues roll into a 15-minute digest per site, with quiet hours.',
        'Why two lanes: urgent problems must page now; minor ones must never wake anyone at 3 AM.',
        'Let\'s zoom in on what happens inside the critical lane.']],
      ['b-flink', 'Flink publishes the DEAD incident.', [
        'Flink emits incident events, <b>DEAD, SLOW, HOT</b>, and later the matching <b>recovery</b> events.',
        'The event carries the incident ID, so every later step refers to the <b>same incident</b>.',
        'Design example: publication is tied to Flink\'s checkpoint, so a crash cannot silently lose a decision.']],
      ['b-sns', 'SNS fans it out, and on-call is paged now.', [
        '<b>SNS</b> delivers one event to many consumers.',
        '<b>PagerDuty pages on-call now</b>, at minute 20, straight off SNS.',
        'The page never waits for ServiceNow: a ticketing outage only delays the <b>ticket</b>, never the alarm.',
        'The ticket path continues separately.']],
      ['b-sqs', 'SQS buffers the ticket request.', [
        'Each integration has its own <b>SQS queue</b>, so one slow integration cannot block another.',
        'SQS buffers bursts and gives <b>at-least-once delivery</b>.',
        'At-least-once means <b>duplicates are expected</b>, so everything downstream must be idempotent.',
        'Malformed "poison" messages go to a <b>DLQ</b> with an alarm and a replay tool.']],
      ['b-start', 'The ticket starter turns the event into one workflow.', [
        'A stateless worker calls Temporal <b>signalWithStart</b>.',
        'The workflow ID is the incident ID: <b>tenant + device + outage generation</b>.',
        'A duplicate alert lands on the <b>same workflow</b> and updates it, instead of opening a second incident.',
        'The starter acknowledges SQS only after Temporal has <b>durably accepted</b> the incident.',
        'A time-bucket ID would be worse: a bucket boundary can split one outage into two incidents.']],
      ['b-tmp', 'One durable workflow now owns the whole incident.', [
        'Temporal runs an <b>IncidentWorkflow</b> for this outage.',
        'Its state is durable: workers can crash and ServiceNow can be down for hours; it <b>resumes where it stopped</b>.',
        '<b>Before</b>: SQS, DLQ, a handler and cron jobs for retries and escalation.',
        '<b>After</b>: one workflow owns the lifecycle, from first page to closed ticket.',
        'Let\'s look inside the workflow.']],
      ['ws1', 'Step 1: a durable 10-minute timer before the ticket.', [
        'The workflow starts at minute 20, when CAM-14 is DEAD and on-call has been paged.',
        'It waits <b>10 more minutes</b> on a <b>durable timer</b> before raising a ticket.',
        'If CAM-14 recovers first, the recovery signal <b>cancels the timer</b>: the page resolves and <b>no ticket</b> is ever raised.',
        'Why: a ticket is work for a team, so we raise it only for an outage that persists.',
        'The timer lives in the workflow, so a crash or a deploy cannot lose it.']],
      ['ws1', 'Minute 30, still DEAD: upsert the ServiceNow ticket.', [
        'The first activity creates the ticket as an <b>idempotent upsert</b>.',
        'It uses a unique, tenant-qualified <b>correlation_id</b> equal to the incident ID.',
        'Every retry sends the <b>same key</b>, so retries cannot create a second ticket.',
        'Example integration: ServiceNow enforces that unique key atomically; that is the backstop against duplicates.']],
      ['act-sn', 'ServiceNow is down: Temporal retries with backoff.', [
        'The first attempt returns <b>503</b>.',
        'Temporal retries with <b>exponential backoff</b>: 2 s, then longer.',
        'Retries are <b>bounded</b>; retrying forever would hide an outage.',
        'On-call was already paged; acknowledgement and recovery signals still reach the workflow while it retries.']],
      ['act-sn', 'Attempt 2 succeeds: INC-1042 is created.', [
        'The retry succeeds and ServiceNow returns <b>INC-1042</b> at priority P3.',
        'A timed-out request might have created the ticket anyway; a timeout means <b>unknown</b>, not failed.',
        'If that happens, the uniqueness conflict becomes a lookup and update: still <b>exactly one ticket</b>.',
        'Temporal cannot cancel a remote request already in flight, so the external uniqueness contract matters.']],
      ['ws2', 'Step 2: a durable 30-minute acknowledgement deadline.', [
        'The workflow waits for on-call to acknowledge, with a <b>durable timer</b>.',
        'The 30 minutes run from the <b>original page</b> at minute 20, so the deadline is minute 50.',
        'The ticket at minute 30, and its retries, do not reset the clock.',
        'The timer lives inside the workflow, so it survives restarts and deploys.',
        'An acknowledgement signal stops the clock.']],
      ['ws3', 'Step 3: no acknowledgement, so the workflow escalates.', [
        'Thirty minutes pass with no acknowledgement; the <b>timer fires</b>.',
        'Before acting, the workflow checks the <b>latest incident state</b>, in case the ack arrived meanwhile.',
        'This is <b>escalation as code, not cron</b>: no polling job, no scheduler table.']],
      ['act-oc', 'L2 on-call is paged, and the ticket goes to P1.', [
        'The escalation activity pages <b>L2 on-call</b>.',
        'It raises the ServiceNow ticket from P3 to <b>P1</b>.',
        'The code reads like the runbook: "no ack in 30 minutes: page L2 and raise to P1".',
        'Every step is recorded in the workflow history: a full audit trail.']],
      ['ws4', 'Step 4: the camera is still down, so a technician is dispatched.', [
        'ServiceNow dispatches a <b>field technician</b>; the ETA is two days.',
        'The workflow now waits for a <b>"ticket closed"</b> signal from ServiceNow.',
        'Waiting is a first-class step in the workflow, not a background job.']],
      ['act-x', 'The workflow sleeps durably for days.', [
        'A sleeping workflow holds <b>no thread and no process</b>; Temporal stores its state.',
        'It survives <b>deploys and crashes</b> during those two days.',
        'Deploys are safe because <b>versioned workers</b> finish running workflows on the code that started them.',
        'CI <b>replays</b> recorded workflow histories against new code to catch breaking changes.']],
      ['act-x', 'Two days later, the technician replaces the camera.', [
        'The technician replaces CAM-14 on site.',
        'A closed ticket and a healthy device are <b>different facts</b>; the workflow defines which one completes it.',
        'In this flow, the ServiceNow "closed" status completes the incident.',
        'Design example: periodic reconciliation catches a missed webhook.']],
      ['act-sn', 'The technician closes the ticket: ServiceNow signals the workflow.', [
        'Closing <b>INC-1042</b> sends a status signal back to the <b>same workflow</b>.',
        'Signal handlers check the incident ID and version, so a stale signal cannot close a newer incident.',
        'Out-of-order signals are persisted, not dropped.']],
      ['ws4', 'Workflow complete: opened, escalated, fixed, closed.', [
        'The workflow finishes and <b>on-call stands down</b>.',
        'One incident, <b>one workflow, one ticket</b>, despite retries and a two-day wait.',
        'Every step is in the history: an audit trail from first page to closed ticket.']]
    ],
    recap: { h: 'The fix took two days. The workflow just waited.', b: [
      '<b>Detect</b>: a per-device Flink timer, no polling of 100M rows.',
      '<b>Grade the alert</b>: SILENT at 10 minutes, a page at 20, a ticket at 30; paging never waits on ticketing.',
      '<b>Own the incident</b>: one durable Temporal workflow per incident ID.',
      '<b>Survive failure</b>: bounded retries, idempotent upserts and timers that survive restarts.',
      '<b>No cron jobs, no duplicate tickets.</b>'] }
  }
};

// Inside views: what happens inside the active component at a step, shown when the presenter clicks the tile
// the ball rests on. Keyed by flow, then by step number (1-based). Each sub-step uses the component close-up's
// SVG coordinates (tools/svgs.py): hl = [x, y, w, h] regions to light up, path = ball route, at = ball rest point,
// lab = [x, y, text, colour] live labels ({timer} counts through `timer` [from, to] seconds). handoff = go to the next stop.
const INSIDE = {
  1: {
    1: { steps: [   // tenant view, then Site-07 (small) and the flagship (large) example topologies
      { h: 'Acme Retail has 214 sites. CAM-14 is at Site-07.', hl: [[40, 60, 400, 300]], at: [345, 268], b: [
        'One tenant, many sites: Acme has <b>214 stores</b>, each with its own devices.',
        'Sites range from <b>small stores</b> to <b>large flagships</b>; one of each is shown as an example.',
        'Every site connects through its own <b>edge pair</b>; devices never reach the cloud directly.'] },
      { svg: 'small', h: 'Inside Site-07: CAM-14 sends its heartbeat.', hl: [[40, 60, 230, 56]], at: [250, 88], b: [
        'Once a minute, CAM-14 sends a small <b>heartbeat</b>.',
        'Cameras are IP devices on <b>PoE Ethernet</b>, so they speak <b>MQTT or CoAP</b> directly.',
        'Thermostats and footfall sensors use <b>Zigbee or BLE</b>, through a bridge that translates to IP.',
        'The link types are an <b>example</b>; the pattern is what matters.'] },
      { h: 'Gateway A batches the whole site.', hl: [[40, 60, 230, 260], [300, 196, 150, 124], [490, 60, 300, 180]], path: [[250, 88], [484, 88], [760, 212]], lab: [[506, 196, 'Site-07 · one batch']], b: [
        'Heartbeats from every device, direct or through the bridge, reach the <b>active gateway</b>.',
        'It <b>batches them per site</b> instead of forwarding each one.',
        '100M devices × 1/min is about <b>1.7M readings/sec</b>; site batching makes it roughly <b>200K envelopes/sec</b>.',
        '<b>Gateway B</b> stands by and takes over if A fails.'] },
      { h: 'The batch crosses the WAN over mTLS.', hl: [[490, 60, 300, 180], [910, 90, 220, 130]], path: [[760, 212], [790, 150], [904, 150], [1100, 190]], b: [
        'The edge pair holds the site\'s <b>only uplink</b>.',
        'The envelope travels over <b>mTLS</b>: encrypted, and the gateway proves its identity with a certificate.',
        'The <b>Cloud Gateway</b> checks identity and quotas next.'] },
      { h: 'What if the WAN drops?', hl: [[490, 60, 300, 180], [910, 240, 220, 132]], path: [[760, 212], [850, 212], [850, 300], [1100, 345]], b: [
        'Gateway A <b>spools heartbeats to disk</b> and keeps retrying.',
        'The spool is <b>bounded</b>, with alarms as it fills.',
        'On reconnect it <b>flushes as a burst</b>: the Queue depth rising scenario.',
        'Design example: Gateway B can take over only with a <b>recoverable spool</b>.'] },
      { svg: 'large', h: 'A large site adds a router network, not more uplinks.', hl: [[320, 80, 130, 280], [580, 120, 300, 200]], at: [850, 290], b: [
        'A flagship store has <b>hundreds of devices</b> across zones.',
        '<b>Non-edge routers</b> relay traffic inside the site over a <b>wired backbone</b>, with Wi-Fi mesh where cabling is impractical.',
        'There is still <b>one edge pair</b> with the only uplink, so the site still sends one batch stream.'] }] },
    2: { steps: [
      { h: 'Acme Site-07\'s envelope arrives.', hl: [[20, 46, 250, 54]], at: [240, 73], b: [
        'Envelopes arrive from many sites and many tenants at once.',
        'This one is from <b>Acme Retail, Site-07</b>, carrying CAM-14\'s heartbeat.',
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
        'Budgets count <b>bytes and readings</b>, shared across all gateway replicas.',
        'Heartbeat capacity is <b>reserved</b>, so bulk traffic never starves liveness.'] },
      { h: '4 · Load balancer → an ingestion pod.', hl: [[1190, 46, 150, 194], [1378, 40, 130, 206]], path: [[1115, 226], [1183, 143], [1310, 143], [1478, 135]], b: [
        'The load balancer spreads envelopes across the <b>ingestion pool</b>.',
        'Health checks keep traffic away from unhealthy pods.',
        'Any pod can take it: ingestion is <b>stateless</b>.'] }] },
    3: { steps: [
      { h: 'The envelope arrives, already tagged with its tenant.', hl: [[20, 120, 180, 110]], at: [170, 200], b: [
        'It comes from the Cloud Gateway: authenticated and <b>tenant-tagged</b>.',
        'It still holds a whole site\'s batch of readings.'] },
      { h: '1 · Validate against the Avro schema.', hl: [[275, 66, 330, 58]], path: [[170, 200], [248, 175], [580, 95]], b: [
        'Every payload must match its <b>Avro schema</b> from the schema registry.',
        'Invalid data is <b>rejected, counted and alarmed</b> in Datadog, never passed on silently.',
        'Schema changes are checked for compatibility in CI before they ship.'] },
      { h: '2 · Unpack: one key per reading.', hl: [[275, 142, 330, 58]], path: [[580, 95], [580, 171]], lab: [[620, 186, 'key = acme + CAM-14']], b: [
        'The site batch is split into <b>individual device readings</b>.',
        'Each reading gets the key <b>tenant + device</b>.',
        'That key decides the Kafka partition, which keeps each device\'s events in order.'] },
      { h: '3 · Route: the heartbeat goes to the priority topic.', hl: [[275, 218, 330, 58], [905, 60, 300, 100]], path: [[580, 171], [580, 247], [605, 258], [860, 258], [860, 110], [900, 110], [1175, 130]], b: [
        'CAM-14\'s heartbeat goes to the <b>heartbeats</b> topic; bulk readings go to <b>telemetry</b>.',
        'Why: a delayed heartbeat can raise a <b>false DEAD</b> and page someone; a late chart point cannot.',
        'A separate topic alone is not enough: heartbeat capacity is reserved <b>end to end</b>.'] },
      { h: 'Any pod can do this work.', hl: [[630, 80, 168, 48]], b: [
        'Ingestion pods hold <b>no state</b>, so any pod can die without losing data.',
        'The pool <b>scales out</b> on CPU and lag.',
        'That is what lets ingestion absorb a reconnect burst.'] }] },
    4: { steps: [
      { h: 'The reading arrives from ingestion.', hl: [[20, 130, 170, 100]], at: [160, 200], b: [
        'Ingestion publishes CAM-14\'s heartbeat with the key <b>tenant + device</b>.',
        'Message contracts are <b>Avro</b>, governed by the schema registry.'] },
      { h: 'hash(acme + CAM-14) picks partition P2 of the heartbeats topic.', hl: [[250, 44, 620, 124]], path: [[160, 200], [232, 180], [420, 126], [789, 126]], b: [
        'The same key always hashes to the <b>same partition</b>: CAM-14 → P2.',
        'So all of CAM-14\'s events stay <b>in order</b>.',
        'P2 is shared with other devices; ordering is per device, not across the fleet.',
        'All tenants share these topics; every message carries its <b>tenant_id</b>.'] },
      { h: 'It is appended to a durable, replayable log.', hl: [[440, 110, 430, 32], [440, 280, 430, 24]], at: [789, 126], b: [
        'The heartbeat is <b>appended</b> at the end of P2 and gets the next offset.',
        'Retention keeps <b>days of history</b>, so the log can be replayed.',
        'In a burst, Kafka turns extra traffic into <b>lag, not loss</b>.'] },
      { h: 'A Flink source reader picks it up.', hl: [[1128, 186, 334, 46]], path: [[789, 126], [866, 126], [1100, 126], [1440, 209]], b: [
        'In the Flink consumer group, <b>reader 3</b> owns P2.',
        'There can be at most one source reader per partition.',
        'After this, Flink\'s keyed operators scale <b>separately</b> from the readers.'] },
      { h: 'If something goes wrong: rewind and replay.', hl: [[1110, 334, 370, 58]], at: [1450, 363], b: [
        'Flink records its Kafka <b>offsets in each checkpoint</b>.',
        'After a crash or a bug fix, it <b>rewinds</b> to those offsets and reprocesses.',
        'Retention must cover the outage <b>and</b> the catch-up time.'] }] },
    5: { steps: [
      { h: 'The heartbeat arrives on the priority topic.', hl: [[20, 40, 170, 90]], at: [160, 100], b: [
        'CAM-14\'s heartbeat arrives from the <b>heartbeats</b> topic.',
        'Heartbeats have their own capacity, so bulk telemetry backpressure cannot delay them.'] },
      { h: 'keyBy sends it to CAM-14\'s own state.', hl: [[232, 40, 170, 200]], path: [[160, 100], [226, 85], [382, 222]], lab: [[240, 186, 'acme + CAM-14']], b: [
        'Flink partitions work by <b>tenant + device</b>: one owner for CAM-14.',
        'That owner keeps CAM-14\'s <b>state</b>: current status, timer and recent event IDs.',
        '<b>Event time</b> with watermarks handles telemetry that arrives out of order.'] },
      { h: 'Dedup + enrich.', hl: [[444, 30, 250, 220]], path: [[382, 222], [438, 140], [664, 238]], lab: [[456, 170, 'new ✓ · camera · Site-07']], b: [
        'A duplicate check uses <b>boot/session + stream + sequence</b>, within a bounded window.',
        'Device metadata is joined in: <b>type, tenant, site</b>.',
        'The heartbeat\'s event age is checked: an old one flushed from a spool <b>does not refresh</b> current health.'] },
      { h: 'Rule engine: CAM-14\'s silence timer is reset.', hl: [[736, 20, 300, 240]], path: [[664, 238], [730, 140], [1006, 230]], lab: [[750, 186, 'CAM-14 · timer reset · ONLINE']], b: [
        'Every heartbeat <b>resets</b> the device\'s timer; the timer fires only if the device goes quiet.',
        'The thresholds, SILENT at 10 minutes and DEAD at 20, are rules per device type, with <b>tenant overrides</b> pushed live.',
        'No scan, no polling: <b>100M timers</b>, each owned by its device\'s key.'] },
      { h: 'No change, so nothing goes downstream.', hl: [[1104, 20, 300, 320], [1110, 354, 300, 26]], at: [1006, 230], b: [
        'CAM-14 was ONLINE and is still ONLINE: <b>no transition</b>, nothing for the lanes.',
        'Only <b>state changes</b> go to paging, digests and the dashboard.',
        'Freshness (last seen) is updated separately and <b>throttled</b>.',
        'That is how 1.7M heartbeats/sec avoid flooding everything downstream.'] }] },
    6: { steps: [
      { h: 'Nothing arrives from CAM-14.', hl: [[20, 40, 170, 90]], at: [1006, 230], lab: [[750, 186, 'CAM-14 · last heartbeat 10:42:07']], b: [
        'Other devices keep sending; CAM-14\'s partition keeps flowing.',
        'Only CAM-14\'s heartbeats have stopped.',
        'There is nothing to process, and that is the point: the <b>timer</b> notices.'] },
      { h: 'CAM-14\'s timer keeps counting.', hl: [[736, 20, 300, 240]], at: [1006, 230], lab: [[750, 186, 'CAM-14 · silent {timer} / 10:00']], timer: [0, 599], b: [
        'The timer runs inside Flink\'s keyed state; <b>no job polls</b> a database.',
        'Flink fires it automatically when the deadline passes.',
        'Timers are part of every <b>checkpoint</b>, so a restart does not lose them.'] },
      { h: 'Is the observer healthy?', hl: [[20, 360, 1010, 40], [20, 40, 170, 90]], at: [1006, 230], lab: [[40, 328, 'pipeline freshness OK · checkpoints current', '#15803D']], b: [
        'Silence is evidence only if the <b>pipeline itself is healthy</b>.',
        'Consumer freshness and checkpoint age are monitored <b>separately</b>.',
        'If the pipeline were behind, devices would show <b>UNKNOWN</b> and the pipeline owner would be paged, not on-call for every device.'] }] },
    7: { steps: [
      { h: 'Ten minutes: the timer fires, CAM-14 is SILENT.', hl: [[736, 20, 300, 240]], at: [1006, 230], lab: [[750, 186, 'CAM-14 → SILENT · 10:00', '#B7791F']], b: [
        'The first rung: CAM-14 moves to <b>SILENT</b>, and the timer re-arms for minute 20.',
        'Still no incident: no incident ID, no page, no ticket.'] },
      { h: 'SILENT goes to the dashboard only.', hl: [[1104, 152, 300, 56]], path: [[1006, 230], [1036, 140], [1070, 140], [1070, 180], [1374, 180]], b: [
        'The change is pushed <b>live</b> to the dashboard service, and CAM-14 turns yellow over SSE.',
        'The <b>critical lane</b> is not touched: nobody is paged.',
        'A heartbeat now returns CAM-14 to ONLINE, and the episode ends there.'] },
      { h: 'The timer keeps counting toward DEAD.', hl: [[736, 20, 300, 240]], at: [1006, 230], lab: [[750, 186, 'CAM-14 · SILENT {timer} / 20:00', '#B7791F']], timer: [600, 1199], b: [
        'Same timer, next deadline: <b>20 minutes</b>.',
        'The ladder thresholds are rules per device type, with <b>tenant overrides</b>.'] }] },
    8: { steps: [
      { h: 'Twenty minutes: the timer fires again.', hl: [[736, 20, 300, 240]], at: [1006, 230], lab: [[750, 186, 'CAM-14 · 20:00 · timer fired', '#DC2626']], b: [
        'CAM-14 has been silent for <b>twenty minutes</b>, so its timer fires again.',
        'Pipeline freshness is healthy, so the silence counts as evidence.'] },
      { h: 'SILENT → DEAD: a new incident identity.', hl: [[736, 20, 300, 240]], at: [1006, 230], lab: [[750, 186, 'CAM-14 → DEAD · outage-42', '#DC2626']], b: [
        'The rule engine moves CAM-14 from SILENT to <b>DEAD</b>.',
        'It allocates the incident ID: <b>tenant + device + outage generation</b>, here acme:cam-14:outage-42.',
        'The ID is kept in CAM-14\'s state; the recovery signal later carries the <b>same ID</b>.',
        'A future outage of the same camera gets a new generation.'] },
      { h: 'The transition goes to the critical lane.', hl: [[1104, 20, 300, 56]], path: [[1006, 230], [1036, 140], [1070, 140], [1070, 48], [1374, 48]], b: [
        'DEAD is critical, so it goes to the <b>critical lane</b>: an immediate page, then a ticket at minute 30.',
        'A SLOW device would go to the minor lane and the 15-minute digest instead.',
        'Design example: publication is tied to Flink\'s checkpoint, so a crash cannot lose the decision.'] },
      { h: 'The dashboard and history see it too.', hl: [[1104, 152, 300, 56], [1104, 218, 300, 56]], path: [[1374, 48], [1070, 48], [1070, 180], [1374, 180]], b: [
        'The change is pushed <b>live</b> to the dashboard service, which updates open pages over SSE.',
        'Redis gets the new state and <b>site counts</b>.',
        'The event is also written to ClickHouse for history.'] }] },
    9: { handoff: true }   // Action Execution: the flow itself zooms into the ServiceNow + Temporal scene next
  }
};
for (const [flow, byStep] of Object.entries(INSIDE)) for (const [n, v] of Object.entries(byStep)) if (NOTES[flow] && NOTES[flow].steps[n - 1]) NOTES[flow].steps[n - 1][3] = v;

// Other flows register themselves from pres/notes-<group>.js (loaded after this file):
//   registerFlow(7, { name, intro, steps: [[id, heading, [bullets]], ...], recap }, { 1: { steps: [...] }, ... });
function registerFlow(flow, notes, inside) {
  NOTES[flow] = notes;
  for (const [n, v] of Object.entries(inside || {})) if (notes.steps[n - 1]) notes.steps[n - 1][3] = v;
}
