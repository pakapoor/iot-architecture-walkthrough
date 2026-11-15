// Presenter notes: Queue depth rising (6), Alert storm (16), Flink job crash (17), Hot partition (18), Sustained 10× traffic (19). Format: see pres/notes.js (flow 1) and registerFlow().

// ---------- 6 · Queue depth rising ----------
registerFlow(6, {
  name: 'Queue depth rising',
  intro: { h: 'Lag is climbing. Alerts are late.', b: [
    'A regional outage has just ended, and about <b>2,000 site gateways</b> reconnect at once.',
    'Each one flushes <b>hours of spooled telemetry</b>, so traffic jumps far above normal peak.',
    'We follow the burst through the gateway, Kafka and Flink, then zoom into the <b>Datadog</b> dashboard.',
    'Watch for three things: <b>lag, not loss</b>; heartbeats that stay fresh; and automation first, humans past the guardrails.'] },
  steps: [
    ['a-edge', 'A regional outage ends, and about 2,000 site gateways reconnect and flush hours of spooled telemetry.', [
      'While the WAN was down, every site gateway <b>spooled to disk</b> and kept retrying.',
      'The spool is <b>bounded and alarmed</b>; infinite buffering is not a guarantee.',
      'When the region comes back, all those spools <b>flush at once</b>.',
      'Spooled heartbeats are <b>history</b>: they do not refresh a device\'s current health.']],
    ['a-gw', 'At the Cloud Gateway, per-tenant rate limits absorb part of the burst.', [
      'Every envelope still passes <b>mTLS</b> and tenant lookup.',
      '<b>Per-tenant quotas</b> cap each tenant, so one tenant\'s flush cannot crowd out everyone else.',
      'Heartbeat capacity is <b>reserved</b>, so bulk traffic cannot starve liveness.',
      'Quotas absorb only <b>part</b> of it: the legitimate backlog still has to flow downstream.']],
    ['a-ing', 'Ingestion autoscales, and heartbeats go to their own priority topic.', [
      'Ingestion is a <b>stateless</b> pool, so it <b>scales out</b> on CPU and lag.',
      'It unpacks each site batch into device readings, keyed by <b>tenant + device</b>.',
      '<b>Heartbeats go to the priority topic</b>; the telemetry backlog goes to the bulk topic.',
      'A separate topic alone is not enough: heartbeat capacity is reserved <b>end to end</b>.']],
    ['a-kafka', 'Kafka absorbs the burst, and consumer lag starts climbing.', [
      'Kafka is the <b>shock absorber</b>: it accepts the burst and stores it durably.',
      'Flink cannot keep up yet, so the gap between written and read grows: that is <b>consumer lag</b>.',
      'A burst becomes <b>lag, not loss</b>, as long as it fits within retention.',
      'The alternative, pushing straight into processing, means <b>dropping data</b> on overload.',
      'Trade-off: data is <b>delayed</b> during the burst.']],
    ['a-flink', 'Flink falls behind, so telemetry alerts would now arrive late.', [
      'Flink reads as fast as it can, and its operators show <b>backpressure</b>.',
      'Every event is processed later than it happened, so <b>freshness</b> slips.',
      'Any alert that depends on that telemetry would now <b>arrive late</b>.',
      'Liveness must not wait behind it. Example: <b>separate heartbeat jobs or slots</b> and independent sinks.']],
    ['a-obsp', 'In Datadog, the lag, freshness and throughput tiles turn red.', [
      'Datadog watches the pipeline itself: <b>consumer lag, freshness p99, checkpoints and throughput</b>.',
      'Lag counts waiting messages; <b>freshness</b> is how old an event is when Flink processes it.',
      'Let\'s zoom into that dashboard and watch the incident play out.']],
    ['m-ingest', 'Spools flush: gateway ingress rises from the 200K normal peak toward a designed-for 500K envelopes per second.', [
      'Top left is <b>gateway ingress</b>, in envelopes per second; normal peak is about <b>200K</b>.',
      'The flush pushes it toward a <b>designed-for 500K envelopes/sec</b> burst: a design target, not a measured benchmark.',
      'Each envelope is a site batch; Kafka carries the <b>unpacked device readings</b>.']],
    ['m-lag', 'Consumer lag climbs, but Kafka buffers within retention, so nothing is lost.', [
      'Top right is <b>Kafka consumer lag</b>: messages waiting for Flink.',
      'It climbs because arrivals are faster than Flink can process them.',
      'Retention must cover the outage, the backlog and the <b>catch-up time</b>.',
      'Within that window, lag is a delay, <b>not data loss</b>.']],
    ['m-mon', 'The monitor fires on freshness p99 above two minutes, and on-call is paged.', [
      'The monitor fires on <b>freshness p99 over 2 minutes</b>, plus lag.',
      'Freshness is the <b>event age</b> at the moment Flink processes it.',
      'Lag is a count; <b>freshness is what users feel</b>.',
      'Trade-off: freshness needs <b>event timestamps you can trust</b>.']],
    ['m-fresh', 'Telemetry freshness keeps climbing, but heartbeats stay fresh, so DEAD detection is protected.', [
      'Bottom left: <b>orange</b> is telemetry freshness, <b>green</b> is heartbeats.',
      'Telemetry falls minutes behind; heartbeats stay <b>fresh</b>.',
      'That is the <b>priority topic plus reserved heartbeat processing</b>.',
      'Decide in advance <b>what must never wait</b>.',
      'If liveness itself went stale, devices would show <b>UNKNOWN</b> instead of paging as DEAD.']],
    ['m-bp', 'Automatic fix one: the autoscaler sees Flink falling behind and adds workers, 24 to 48, with nobody clicking anything.', [
      'Bottom right is <b>Flink backpressure</b>, with the worker count in the label.',
      'The autoscaler takes Flink from <b>24 to 48 workers</b>; no human is involved.',
      'It has a <b>cooldown</b>, so it does not flap.',
      'The <b>partition count caps</b> useful source readers; keyed operators scale separately.']],
    ['m-e2', 'Automatic fix two: the writer flushes every second or every 50K rows, so in a burst its chunks grow on their own.', [
      'Many small writes would overload <b>ClickHouse</b> during a burst.',
      'The sink flushes on <b>1 s or 50K rows</b>, whichever comes first.',
      'Under load it hits 50K rows first, so writes <b>batch up on their own</b>.',
      'Trade-off: a little extra latency when traffic is low.']],
    ['m-mon', 'DevOps checks the dashboard: heartbeats are fresh and the autoscaler is under its limit, so no action, just watch.', [
      'The human checks two things: are <b>heartbeats fresh</b>, and is the autoscaler <b>under its limit</b>?',
      'Both are yes, so the system is handling the expected burst: they <b>watch, not act</b>.',
      'Automation for the expected; <b>humans past the guardrails</b>.']],
    ['m-mon', 'Still not draining? With the autoscaler at its max, raise the limit or add Kubernetes nodes.', [
      'If lag keeps growing with the autoscaler <b>at its max</b>, a human raises the limit.',
      'More source readers help only <b>up to the partition count</b>; keyed operators scale separately.',
      'If the cluster itself is full, <b>add Kubernetes nodes</b>.',
      'More pods alone cannot fix <b>disk, sink or hot-key</b> limits.']],
    ['m-mon', 'Is ClickHouse the bottleneck? Scale ClickHouse, and never add Kafka partitions mid-incident, because it breaks per-device order.', [
      'If the sink is the slow part, <b>scale ClickHouse</b>, not Flink.',
      'Adding Kafka partitions looks like a quick fix, but it <b>remaps device IDs</b>.',
      'A device\'s new events could land on a new partition while older ones are unread: <b>order breaks</b>.',
      'Partition headroom is <b>planned up front</b>, never added during an incident.']],
    ['m-lag', 'Lag drains, freshness is back under two minutes, and the monitor resolves.', [
      'With more workers and bigger write chunks, processing outpaces arrivals and the backlog <b>drains</b>.',
      '<b>Freshness</b> falls back under 2 minutes, and the monitor <b>resolves</b> on its own.',
      'Nothing was dropped: Kafka held the backlog until Flink caught up.']],
    ['m-fresh', 'The takeaway: automation handles the expected burst, humans step in past the guardrails, and we alert on freshness.', [
      'Kafka turned a burst into <b>lag, not loss</b>.',
      'Heartbeats were protected, so <b>DEAD detection</b> stayed fresh.',
      'Two automatic fixes handled it; the runbook covers what happens <b>past the guardrails</b>.',
      'And the page fired on <b>freshness</b>, the thing users actually feel.']]
  ],
  recap: { h: 'A burst becomes lag, not loss.', b: [
    '<b>Buffer</b>: Kafka absorbs the burst within retention.',
    '<b>Detect</b>: alert on freshness p99, not just lag.',
    '<b>Protect</b>: heartbeats have their own topic and reserved processing.',
    '<b>Scale</b>: the autoscaler and the size-or-time writer handle the expected burst.',
    '<b>Guardrails</b>: humans step in past the limits, and never add partitions mid-incident.'] }
}, {
  1: { steps: [   // tenant view, then Site-07 (small) as the example site
    { h: 'Every site has one edge pair and one uplink.', hl: [[40, 60, 400, 300], [460, 60, 400, 300], [230, 374, 840, 34]], at: [1060, 300], b: [
      'Devices never reach the cloud directly; each site\'s <b>edge pair</b> holds its only uplink.',
      'A regional outage cuts many of those uplinks at once: here, about <b>2,000 site gateways</b>.',
      'Each site keeps its data locally while the WAN is down.'] },
    { svg: 'small', h: 'While the WAN was down, Gateway A spooled to disk.', hl: [[490, 60, 300, 180], [910, 240, 220, 132]], path: [[760, 212], [850, 212], [850, 300], [1100, 345]], lab: [[920, 338, 'spool · hours', '#B45309']], b: [
      'Gateway A <b>spools to disk</b> and keeps retrying.',
      'The spool is <b>bounded</b>, with alarms as it fills.',
      'Example durability contract: delete a spooled record only after the cloud confirms <b>Kafka accepted it</b>.'] },
    { h: 'The WAN returns: hours of spool flush as one burst.', hl: [[490, 60, 300, 180], [910, 90, 220, 130]], path: [[760, 212], [790, 150], [904, 150], [1100, 190]], lab: [[922, 176, 'burst · flush', '#B45309']], b: [
      'Every reconnecting site <b>flushes at once</b>, on top of its live traffic.',
      'Gateway ingress rises from <b>200K</b> normal peak toward a <b>designed-for 500K</b> envelopes/sec.',
      'Flushed heartbeats are history: they do <b>not</b> refresh current health.'] }] },
  2: { steps: [   // Cloud Gateway close-up (GW_SVG)
    { h: 'Reconnecting sites flush at once.', hl: [[20, 46, 250, 194]], at: [240, 143], lab: [[34, 262, 'reconnect burst · spooled + live', '#B45309']], b: [
      'About <b>2,000 site gateways</b> reconnect together, from many tenants.',
      'Each envelope carries live readings plus hours of <b>spooled</b> history.'] },
    { h: 'Every envelope still passes mTLS and tenant lookup.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], path: [[240, 143], [318, 143], [495, 210], [740, 210]], b: [
      'A burst gets <b>no shortcut</b>: identity comes from the certificate, the tenant from the registry.',
      'Every reading is tagged with its <b>tenant_id</b>.'] },
    { h: 'Per-tenant quotas cap each tenant\'s flush.', hl: [[815, 30, 330, 226]], path: [[740, 210], [808, 143], [1115, 226]], b: [
      'Each tenant has its own budget, so one tenant\'s flush <b>cannot crowd out</b> everyone else.',
      'Heartbeat capacity is <b>reserved</b>, so the bulk backlog cannot starve liveness.',
      'Budgets are shared across gateway replicas, so scaling the gateway does not raise them.'] },
    { h: 'Quotas absorb only part of it.', hl: [[1190, 46, 150, 194], [1378, 40, 130, 206]], path: [[1115, 226], [1183, 143], [1310, 143], [1478, 135]], b: [
      'The <b>legitimate backlog</b> still has to flow downstream.',
      'Next, ingestion <b>scales out</b> and Kafka absorbs the rest as lag, not loss.'] }] },
  3: { steps: [
    { h: 'The burst arrives from the gateway.', hl: [[20, 120, 180, 110]], at: [170, 200], b: [
      'Envelopes arrive authenticated and <b>tenant-tagged</b>, many times the normal rate.',
      'Each one is a site batch, often full of <b>spooled</b> readings.'] },
    { h: 'The stateless pool scales out.', hl: [[620, 70, 190, 110]], path: [[170, 200], [248, 175], [580, 95]], lab: [[630, 190, 'scaling out', '#1D4ED8']], b: [
      'Pods hold <b>no state</b>, so new ones can start taking traffic straight away.',
      'The pool <b>scales out</b> on CPU and lag.',
      'That is what lets ingestion absorb a <b>reconnect burst</b>.'] },
    { h: 'Heartbeats still go to the priority topic.', hl: [[275, 218, 330, 58], [905, 60, 300, 100]], path: [[580, 95], [580, 171], [580, 247], [605, 258], [860, 258], [860, 110], [900, 110], [1175, 130]], b: [
      'Each reading is unpacked and routed: <b>heartbeats</b> to the priority topic, the backlog to <b>telemetry</b>.',
      'A delayed heartbeat can raise a <b>false DEAD</b>; a late chart point cannot.',
      'The topic alone is not enough: heartbeat capacity is reserved <b>end to end</b>.'] }] },
  4: { steps: [
    { h: 'Ingestion publishes the burst.', hl: [[20, 130, 170, 100]], at: [160, 200], b: [
      'Ingestion publishes far more readings than normal, all keyed by <b>tenant + device</b>.',
      'Kafka does not push back on Flink\'s behalf; it just <b>accepts and stores</b>.'] },
    { h: 'Kafka appends it all to the telemetry log.', hl: [[250, 164, 620, 100]], path: [[160, 200], [232, 180], [420, 246], [850, 246]], lab: [[880, 172, 'burst appended', '#B45309']], b: [
      'Every reading is <b>appended</b> to its partition and stored durably.',
      'Each device\'s events stay <b>in order</b> within its partition.',
      'Kafka is the <b>shock absorber</b> between the burst and processing.'] },
    { h: 'Flink\'s readers fall behind: that gap is lag.', hl: [[250, 164, 620, 100], [1128, 66, 334, 166]], path: [[850, 246], [1100, 246], [1440, 209]], lab: [[880, 172, 'lag climbing', '#DC2626']], b: [
      'Writes arrive faster than the source readers consume them.',
      'The distance between the newest offset and the readers\' position is <b>consumer lag</b>.',
      'Flink catches up <b>at its own pace</b>.'] },
    { h: 'Heartbeats keep their own topic.', hl: [[250, 44, 620, 100]], at: [850, 126], lab: [[880, 60, 'priority · fresh', '#15803D']], b: [
      'Heartbeats are on the <b>priority topic</b>, not behind the telemetry backlog.',
      'They also get <b>reserved processing</b> in Flink, so they stay fresh.',
      'A separate topic alone cannot protect shared CPU, disk or a downstream operator.'] },
    { h: 'Retention is the safety margin.', hl: [[440, 280, 430, 24], [1110, 334, 370, 58]], b: [
      'Within retention, a burst is <b>lag, not loss</b>.',
      'Retention must cover the outage, the backlog <b>and</b> the catch-up time.',
      '<b>Never add partitions</b> mid-incident: it remaps device IDs and breaks per-device order.'] }] },
  5: { steps: [
    { h: 'Telemetry backs up through the job.', hl: [[20, 150, 170, 90], [232, 40, 170, 200], [444, 30, 250, 220]], at: [160, 215], lab: [[456, 170, 'backpressure', '#B45309']], b: [
      'Operators are <b>blocked</b> waiting on the next stage: that is backpressure.',
      'Every telemetry event is processed later, so its <b>freshness</b> slips.',
      'Alerts that depend on telemetry would now arrive <b>late</b>.'] },
    { h: 'Heartbeats must not wait behind it.', hl: [[20, 40, 170, 90], [736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'heartbeats · fresh', '#15803D']], b: [
      'The device <b>timers</b> depend on heartbeats arriving on time.',
      'Example: <b>separate heartbeat jobs or slots</b> and independent sinks keep bulk backpressure away from liveness.',
      'If liveness did go stale, devices would show <b>UNKNOWN</b> and the pipeline owner would be paged.'] },
    { h: 'The ClickHouse writer flushes on size or time.', hl: [[1104, 218, 300, 56]], path: [[1010, 238], [1036, 140], [1070, 140], [1070, 246], [1374, 246]], b: [
      'Raw telemetry is written to <b>ClickHouse hot</b> in chunks.',
      'The writer flushes every <b>1 s or 50K rows</b>, whichever comes first.',
      'In a burst it hits 50K first, so chunks <b>grow on their own</b> and ClickHouse sees fewer, larger writes.'] }] },
  6: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'Datadog watches the pipeline itself.', hl: [[20, 30, 190, 300]], at: [180, 300], b: [
      'Signals come from every stage: <b>gateway, ingestion, Kafka, Flink and actions</b>.',
      'It watches the platform, not the devices: is the observer healthy?'] },
    { h: 'Consumer lag climbs.', hl: [[240, 30, 310, 140]], path: [[180, 300], [236, 180], [520, 140]], lab: [[254, 136, '▲ lag climbing', '#DC2626']], b: [
      'Lag counts the messages <b>waiting</b> for Flink.',
      'The reconnect burst arrives faster than Flink can drain it.'] },
    { h: 'Freshness slips, and gateway ingress jumps.', hl: [[570, 30, 310, 140], [240, 190, 310, 140]], path: [[520, 140], [850, 140]], lab: [[584, 136, '▲ freshness slipping', '#DC2626'], [254, 296, '▲ ingress spike', '#B45309']], b: [
      '<b>Freshness</b> is how old an event is when Flink processes it.',
      'Heartbeats are tracked <b>apart</b> from telemetry, so a telemetry backlog does not look like dead devices.',
      'Ingress shows the flush arriving at the gateway.'] },
    { h: 'A monitor fires; automation goes first.', hl: [[900, 190, 310, 140], [1250, 30, 250, 300]], path: [[850, 140], [880, 300], [1180, 300], [1240, 180], [1470, 300]], b: [
      'A freshness or lag breach raises a <b>monitor</b>.',
      'Autoscaling acts first; humans step in only <b>past the guardrails</b>.',
      'Next, we zoom into that dashboard and watch the incident play out.'] }] }
});

// ---------- 16 · Alert storm ----------
registerFlow(16, {
  name: 'Alert storm',
  intro: { h: '200 devices down at once.', b: [
    'A power cut at Acme <b>Site-07</b> takes out 200 devices and the site gateways in one moment.',
    'Paging once per device would mean <b>200 pages</b> and 200 tickets for a single root cause.',
    'We follow how Flink <b>correlates</b> the failures to the site, pages once, and then auto-resolves.',
    'Watch for one idea: <b>page on causes, not symptoms</b>.'] },
  steps: [
    ['a-edge', 'A power cut at Acme Site-07 silences 200 devices at once, and the gateways too.', [
      'Every device at Site-07 loses power, and so does the <b>edge pair</b>.',
      'With the gateways down too, nothing is spooled or sent: the whole site <b>goes silent</b>.',
      'From the cloud, this looks like 200 separate failures <b>unless we correlate</b>.']],
    ['a-gw', 'The cloud sees the whole site go quiet.', [
      'No envelopes arrive from Site-07; its <b>connection simply stops</b>.',
      'Nothing is rejected or throttled: there is <b>no traffic</b> to check.',
      'Silence is not something the gateway flags; detection happens in <b>Flink</b>.']],
    ['a-kafka', 'No heartbeats arrive for any Site-07 device.', [
      'The heartbeats topic keeps flowing for <b>every other site</b>.',
      'Only Site-07\'s device keys stop appearing.',
      'There is no message to react to, so detection depends on <b>timers</b>.']],
    ['a-flink', 'Site-07 turns yellow at 10 minutes; at 20, device and gateway timers produce DEAD candidates, and they can arrive in a different order.', [
      'Each of the 200 devices has its own <b>timer</b>, and so does the gateway.',
      'At <b>10 minutes</b> they all turn <b>SILENT</b>: yellow on the dashboard, nobody paged yet.',
      'At <b>20 minutes</b> they fire again, and each one produces a <b>DEAD candidate</b>, not a page.',
      'Arrival order can differ: device timers may fire <b>before</b> the gateway timer.',
      'Silence only counts if the pipeline itself is <b>fresh</b>; a stale pipeline is not a site outage.']],
    ['a-flink', 'In this example, a bounded site correlation window joins gateway state and device candidates before paging.', [
      'Example: a correlation stage keyed by <b>tenant and site</b> buffers the device candidates.',
      'The window is <b>short and bounded</b>, and its pending state is durable.',
      'It combines <b>gateway state and topology</b>: the gateway is down, and all 200 devices sit behind it.',
      'Root cause: <b>SITE-07 DOWN</b>, one incident instead of 200.',
      'Trade-off: the window adds a <b>small, bounded delay</b> before the page.']],
    ['a-act', 'Suppression: one SITE-DOWN incident pages on-call, and the 200 device alerts are grouped under it.', [
      'On-call gets <b>one page</b>: Site-07 is down.',
      'The 200 device alerts are <b>grouped under</b> the site incident, not thrown away.',
      'Paging is also <b>rate-limited</b> per on-call rotation; excess alerts batch into a summary.',
      'A flooded pager is an <b>ignored pager</b>.']],
    ['a-act', 'At minute 30, with the site still down, there is one ServiceNow ticket for the site, and device tickets are held.', [
      '<b>One ticket per root cause</b>: at minute 30, a single SITE-DOWN ticket in ServiceNow.',
      'Device tickets are <b>held</b>, and released only if a device outlives the site outage.',
      'The alternative is 200 tickets, <b>closed by hand</b> later.',
      'Trade-off: a real device fault during a site outage is <b>noticed later</b>.']],
    ['a-dash', 'The dashboard shows Site-07 as SITE DOWN with 200 affected devices, not a wall of red.', [
      'The tenant admin sees <b>one site-level status</b>: SITE DOWN, 200 affected devices.',
      'Not 200 red tiles: the screen tells the <b>same story</b> as the page and the ticket.',
      'Changes are pushed live over <b>SSE</b>, so every open dashboard updates at once.']],
    ['a-edge', 'Power returns and the gateways reconnect; once fresh heartbeats stay stable, the site incident auto-resolves, and devices that are still silent get their own alerts.', [
      'Power returns, the edge pair reconnects, and <b>fresh heartbeats</b> start flowing.',
      'Example: the site resolves only after <b>stable, fresh</b> gateway and site recovery.',
      'Old spooled heartbeats do <b>not</b> count as recovery.',
      'Devices <b>still silent</b> become their own incidents, keeping their original failure time.',
      'Close what closed itself: <b>no human</b> has to close the site incident.']]
  ],
  recap: { h: 'Page on causes, not symptoms.', b: [
    '<b>Detect</b>: device and gateway timers produce candidates, not pages.',
    '<b>Correlate</b>: an example bounded site window finds one root cause.',
    '<b>Suppress</b>: one page and one ticket, with device alerts grouped under the site.',
    '<b>Auto-resolve</b>: stable recovery closes the site; still-silent devices get their own alerts.'] }
}, {
  1: { steps: [   // tenant view, then Site-07 (small)
    { h: 'One of Acme\'s 214 sites goes dark.', hl: [[40, 60, 400, 300]], lab: [[58, 312, 'power cut', '#DC2626']], b: [
      'Acme has <b>214 sites</b>; only Site-07 loses power.',
      'The rest of Acme\'s sites keep reporting normally.',
      'That contrast is what lets Flink say "this is a <b>site</b> problem".'] },
    { svg: 'small', h: 'Inside Site-07: devices and both gateways lose power.', hl: [[40, 60, 230, 260], [490, 60, 300, 180], [490, 262, 300, 110]], lab: [[504, 338, 'power cut · all dark', '#DC2626']], b: [
      'Every device at the site stops sending; the device counts here are an <b>example topology</b>.',
      'Gateway A <b>and</b> Gateway B are down, so there is no failover and no spool.',
      'Nothing moves: no heartbeat, no batch, no uplink.'] },
    { h: 'The cloud sees only silence.', hl: [[910, 90, 220, 130]], lab: [[922, 176, 'Site-07 · silent', '#DC2626']], b: [
      'The Cloud Gateway simply stops hearing from Site-07.',
      'Device timers and the gateway\'s own timer will all expire, <b>independently</b>.',
      'Without correlation, that becomes <b>200 pages</b>.'] }] },
  2: { steps: [   // Cloud Gateway close-up (GW_SVG)
    { h: 'Envelopes keep arriving from every other site.', hl: [[20, 116, 250, 124]], path: [[240, 143], [318, 143], [495, 210], [740, 210]], b: [
      'Acme\'s other sites, and other tenants, send as normal.',
      'They pass mTLS, tenant lookup and quotas as usual.'] },
    { h: 'Nothing arrives from Site-07.', hl: [[20, 46, 250, 54]], lab: [[34, 262, 'Site-07 · no envelopes', '#DC2626']], b: [
      'Site-07\'s connection <b>simply stops</b>: no envelopes, no errors.',
      'There is nothing to reject or throttle, because there is <b>no traffic</b>.'] },
    { h: 'The gateway does not flag silence.', hl: [[325, 46, 820, 210]], b: [
      'Every check here acts on traffic that <b>arrives</b>; silence passes through unseen.',
      'Detection happens in <b>Flink</b>, where per-device and gateway timers keep counting.'] }] },
  3: { steps: [   // Kafka close-up (KAFKA_SVG)
    { h: 'Heartbeats keep arriving for every other site.', hl: [[20, 130, 170, 100], [250, 44, 620, 100]], path: [[160, 200], [232, 180], [420, 126], [789, 126]], b: [
      'The <b>heartbeats</b> topic keeps flowing for every other site and tenant.',
      'Partitions fill as usual: nothing looks wrong in aggregate.'] },
    { h: 'Site-07\'s device keys stop appearing.', hl: [[250, 44, 620, 100]], at: [789, 126], lab: [[880, 92, 'Site-07 · no new records', '#DC2626']], b: [
      'Site-07\'s keys still hash to their usual partitions, but <b>no new records</b> arrive.',
      'Kafka never stores an absence: there is <b>nothing to read</b>.'] },
    { h: 'Nothing to consume, so timers decide.', hl: [[1110, 14, 370, 306]], path: [[789, 126], [866, 126], [1100, 126], [1440, 209]], b: [
      'Flink\'s readers keep consuming every other site.',
      'There is no message to react to, so detection depends on per-device <b>timers</b> in Flink: the next step.'] }] },
  4: { steps: [
    { h: 'No heartbeat from any Site-07 device.', hl: [[20, 40, 170, 90], [736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'Site-07 · silent {timer} / 20:00']], timer: [0, 1199], b: [
      'Heartbeats keep arriving for every other site.',
      'For Site-07\'s devices, nothing resets their <b>timers</b>.',
      'The gateway has a timer too, counting in parallel.'] },
    { h: 'Device timers fire: 200 failure candidates.', hl: [[736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, '200 device candidates', '#DC2626']], b: [
      'SILENT at 10 minutes; at <b>20 minutes</b> each device timer fires again and the device becomes a <b>DEAD candidate</b>.',
      'A candidate is not yet a page.',
      'Paging now would mean <b>200 pages</b> for one power cut.'] },
    { h: 'The gateway candidate can arrive later.', hl: [[736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, '+ gateway · later', '#B45309']], b: [
      'Device and gateway timers can fire in <b>either order</b>.',
      'So Flink cannot decide on the first candidate it sees.',
      'It needs a short wait to see the <b>whole picture</b>.'] },
    { h: 'Is the observer healthy?', hl: [[20, 360, 1010, 40]], at: [1010, 238], lab: [[40, 328, 'pipeline freshness OK', '#15803D']], b: [
      'Silence is evidence only if the <b>pipeline itself</b> is fresh.',
      'A stale monitoring pipeline must not be mistaken for a <b>site outage</b>.',
      'If it were stale, devices would show <b>UNKNOWN</b> and the pipeline owner would be paged.'] }] },
  5: { steps: [
    { h: 'Example: candidates wait in a site window.', hl: [[736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'window · acme + Site-07', '#B45309']], b: [
      'Example: a correlation stage is keyed by <b>tenant + site</b>.',
      'It buffers device candidates for a <b>short, bounded</b> window.',
      'Pending candidates are kept in <b>durable state</b>, so a restart does not lose them.'] },
    { h: 'Gateway state and topology explain the silence.', hl: [[444, 30, 250, 220], [736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'root cause: SITE-07 DOWN', '#DC2626']], b: [
      'Device metadata says which <b>site</b> each device belongs to.',
      'The gateway is down and every candidate sits behind it.',
      'One root cause: <b>SITE-07 DOWN</b>.'] },
    { h: 'One site incident goes to the critical lane.', hl: [[1104, 20, 300, 56]], path: [[1010, 238], [1036, 140], [1070, 140], [1070, 48], [1374, 48]], b: [
      '<b>One</b> SITE-DOWN incident pages on-call now; its ticket follows at minute 30.',
      'The 200 device candidates travel <b>under</b> it, not as their own pages.',
      'Trade-off: a small, bounded delay before the page.'] }] },
  6: { steps: [   // Action Execution close-up (ACT_SVG): suppression
    { h: 'One SITE-DOWN incident arrives from Flink.', hl: [[20, 120, 150, 110]], at: [140, 200], lab: [[24, 244, 'SITE-07 DOWN · 1 incident', '#DC2626']], b: [
      'Flink emits <b>one</b> site incident; the 200 device alerts travel <b>under</b> it.',
      'They are grouped, not thrown away.'] },
    { h: 'SNS fans it out: one page to on-call.', hl: [[230, 120, 170, 90], [440, 24, 190, 82]], path: [[140, 200], [170, 160], [226, 160], [315, 120], [315, 70], [600, 76]], b: [
      'On-call gets <b>one page</b>: Site-07 is down.',
      'Paging is also <b>rate-limited</b> per on-call rotation; excess alerts batch into a summary.',
      'A flooded pager is an <b>ignored pager</b>.'] },
    { h: 'The same incident starts one workflow.', hl: [[440, 124, 190, 90], [670, 124, 170, 90], [898, 90, 354, 46]], path: [[400, 165], [436, 165], [600, 184], [666, 169], [810, 184], [876, 169], [1222, 120]], b: [
      'SQS and the ticket starter open <b>one IncidentWorkflow</b> for the site incident.',
      'Its durable timer runs toward a <b>ticket at minute 30</b>, if the site is still down.'] }] },
  7: { steps: [   // Action Execution close-up (ACT_SVG): one ticket for the site
    { h: 'Minute 30: the site is still down.', hl: [[898, 90, 354, 46]], at: [1222, 120], b: [
      'The workflow\'s durable timer fires at <b>minute 30</b>.',
      'Nothing has recovered, so the ticket goes ahead.'] },
    { h: 'One ServiceNow ticket for the site.', hl: [[1310, 24, 190, 130]], path: [[1222, 120], [1270, 90], [1306, 90], [1470, 124]], b: [
      '<b>One ticket per root cause</b>: a single SITE-DOWN ticket.',
      'It is idempotent by <b>correlation ID</b>: a retry updates it, never duplicates it.'] },
    { h: 'Device tickets are held.', hl: [[880, 14, 390, 300]], at: [1470, 124], b: [
      'Device tickets are <b>held</b>, and released only if a device outlives the site outage.',
      'The alternative is 200 tickets, <b>closed by hand</b> later.',
      'Trade-off: a real device fault during a site outage is <b>noticed later</b>.'] }] },
  8: { steps: [   // Dashboards close-up (DASH_SVG)
    { h: 'Flink pushes one site status change.', hl: [[240, 14, 190, 54], [490, 64, 320, 96]], path: [[410, 41], [430, 41], [458, 41], [458, 100], [486, 100], [780, 130]], b: [
      'Only <b>state changes</b> leave Flink: Site-07 is now SITE DOWN.',
      'The SSE stream hub pushes it to every open dashboard.'] },
    { h: 'RBAC scopes it to Acme.', hl: [[490, 284, 320, 90]], path: [[780, 130], [780, 344]], b: [
      'Only Acme admins with access to <b>Site-07</b> receive the update.',
      'Every subscription and query is scoped by <b>tenant and site</b>.'] },
    { h: 'One site-level status, not a wall of red.', hl: [[1240, 116, 252, 40]], path: [[780, 344], [860, 330], [1196, 330], [1222, 136]], lab: [[1390, 124, 'SITE DOWN', '#DC2626']], b: [
      'The tenant admin sees <b>SITE DOWN</b>, with 200 affected devices.',
      'Not 200 red tiles: the screen tells the <b>same story</b> as the page and the ticket.'] }] },
  9: { steps: [
    { svg: 'small', h: 'Power returns: devices and gateways boot.', hl: [[40, 60, 230, 260], [490, 60, 300, 180]], at: [250, 88], b: [
      'Devices start sending heartbeats again.',
      'Gateway A comes back as the <b>active</b> gateway and batches the site.'] },
    { h: 'Fresh heartbeats must stay stable.', hl: [[490, 60, 300, 180], [910, 90, 220, 130]], path: [[760, 212], [790, 150], [904, 150], [1100, 190]], lab: [[922, 176, 'fresh · stable', '#15803D']], b: [
      'Example: the site resolves only after <b>stable, fresh</b> gateway and site recovery.',
      'Old spooled heartbeats do <b>not</b> count as recovery.',
      'Flapping suppression stops a <b>flickering</b> site from opening and closing incidents.'] },
    { h: 'A device still silent gets its own incident.', hl: [[40, 60, 230, 56]], lab: [[292, 104, 'e.g. still silent', '#DC2626']], b: [
      'The site incident <b>auto-resolves</b>.',
      'Devices that are <b>still silent</b> are released as their own incidents.',
      'They keep their <b>original failure time</b>; the hold time for them is bounded.'] }] }
});

// ---------- 17 · Flink job crash ----------
registerFlow(17, {
  name: 'Flink job crash',
  intro: { h: 'The Flink job just crashed.', b: [
    'A Kubernetes node dies and takes a Flink <b>TaskManager</b> with it.',
    'That job holds the <b>timers and state</b> for 100M devices.',
    'We follow the recovery: <b>restore</b> a checkpoint, <b>replay</b> from Kafka, and make repeated actions harmless.',
    'Watch for: <b>nothing lost, nothing doubled</b>, and no human needed to restart it.'] },
  steps: [
    ['a-flink', 'A Kubernetes node dies, so the Flink job loses a TaskManager and fails.', [
      'Flink runs on Kubernetes as a set of <b>TaskManagers</b>.',
      'When a node dies, its TaskManager goes with it, and the <b>job fails</b>.',
      'Ingestion and Kafka keep accepting data, so <b>lag starts rising</b>.',
      'A crashed job must not forget <b>100M devices\' timers</b>.']],
    ['a-flink', 'Kubernetes reschedules it, and Flink restores state and timers from the last completed checkpoint, whose age we monitor.', [
      '<b>Kubernetes reschedules</b> the pod, and Flink\'s restart strategy restarts the job.',
      'Checkpoints hold <b>keyed state, configuration versions and timers</b> in durable storage.',
      'Recovery resumes from the <b>last completed</b> checkpoint.',
      'So alarm on <b>completed-checkpoint age</b> and recovery time, not just the configured interval.',
      'Crash loops need a limit, then <b>escalate</b> to a human.']],
    ['a-kafka', 'Kafka still holds everything since that checkpoint, so Flink rewinds its offsets and replays.', [
      'The checkpoint also recorded Flink\'s <b>Kafka offsets</b>.',
      'Flink <b>rewinds</b> to them and reprocesses everything that arrived since.',
      'Durable log plus snapshot: <b>time travel</b>.',
      'Retention must cover the <b>outage, backlog and catch-up</b>; a checkpoint cannot recover expired records.',
      'Past retention, only the archive is left, and a <b>sampled</b> archive cannot recreate every raw event.']],
    ['a-flink', 'Replayed transitions may be sent again, and example recovery gates hold overdue-timer pages until pipeline freshness recovers.', [
      'Replay can re-emit a transition that was <b>already sent</b> before the crash.',
      'Its incident ID comes from keyed state, so the repeat carries the <b>same ID</b>.',
      'Timers that went overdue during the downtime could page <b>every device</b> at once.',
      'Example: a processing-time <b>recovery gate</b> holds those pages until pipeline freshness recovers.',
      'The gate is <b>bounded</b>: a short delay for fewer false pages, never hiding a real outage.']],
    ['a-act', 'Idempotent actions: the same correlation ID means no duplicate pages and no duplicate tickets.', [
      'Every external action is keyed by the <b>incident ID</b>.',
      'A repeated transition lands on the <b>same correlation ID</b>: no second page, no second ticket.',
      'Exactly-once state in Flink does not make <b>external systems</b> atomic; each needs its own replay contract.',
      'Examples: version-checked <b>Redis</b> transitions, stable <b>ClickHouse</b> event IDs, unique ticket keys.',
      'Assume duplicates, and <b>make them harmless</b>.']],
    ['a-obsp', 'In Datadog, lag spikes and drains in minutes, and a restart alert tells the team it happened.', [
      '<b>Consumer lag</b> spikes while the job is down, then drains as replay catches up.',
      'A <b>restart alert</b> tells the team; nobody had to act.',
      'Humans <b>investigate</b>; machines recover.',
      'A crash should cost a minute, not a morning.']]
  ],
  recap: { h: 'Nothing lost, nothing doubled.', b: [
    '<b>Restart</b>: Kubernetes and Flink recover without a human.',
    '<b>Restore</b>: state and timers come back from the last completed checkpoint.',
    '<b>Replay</b>: Kafka retention covers the gap, from the checkpoint\'s offsets.',
    '<b>Gate</b>: example recovery gates stop a restart from paging every overdue timer.',
    '<b>Idempotent effects</b>: the same incident ID means no duplicate pages or tickets.'] }
}, {
  1: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'Flink runs as TaskManagers on Kubernetes.', hl: [[232, 40, 170, 200], [444, 30, 250, 220], [736, 20, 300, 240], [20, 360, 1010, 40]], at: [1010, 238], b: [
      'Keyed state and timers for every device are spread across the <b>TaskManagers</b>.',
      'Checkpoints snapshot all of it to <b>durable storage</b>.'] },
    { h: 'A node dies, and the job fails.', hl: [[20, 360, 1010, 40]], at: [1010, 238], lab: [[40, 328, 'node lost · job failed', '#DC2626']], b: [
      'When a node dies, its TaskManager goes with it.',
      'The <b>job fails</b>, and processing stops.'] },
    { h: 'Kafka keeps accepting data, so lag rises.', hl: [[20, 40, 170, 90], [20, 150, 170, 90]], lab: [[30, 104, 'lag rising', '#B45309'], [30, 214, 'lag rising', '#B45309']], b: [
      'Ingestion and Kafka keep accepting data; it waits in Kafka as <b>lag</b>.',
      'Nothing is lost yet, but a crashed job must not forget <b>100M devices\' timers</b>.'] }] },
  2: { steps: [
    { h: 'Kubernetes reschedules the TaskManager.', hl: [[20, 360, 1010, 40]], lab: [[40, 328, 'rescheduled · restoring', '#1D4ED8']], b: [
      'Kubernetes starts a replacement pod on a healthy node.',
      'Flink\'s <b>restart strategy</b> restarts the job automatically.',
      'Crash loops need a limit, then <b>escalate</b>.'] },
    { h: 'State and timers come back from the checkpoint.', hl: [[232, 40, 170, 200], [444, 30, 250, 220], [736, 20, 300, 240]], lab: [[240, 186, 'keyed state ✓', '#15803D'], [750, 186, 'timers restored ✓', '#15803D']], b: [
      'Every device\'s <b>keyed state</b> is restored: status, dedup window and incident IDs.',
      'Every device\'s <b>timer</b> comes back too, with its original deadline.',
      'Without this, the job would have to rebuild state for 100M devices from scratch.'] },
    { h: 'Watch the completed-checkpoint age.', hl: [[20, 360, 1010, 40]], lab: [[40, 328, 'alarm on completed-checkpoint age', '#B45309']], b: [
      'Recovery starts from the <b>last completed</b> checkpoint, not the last attempted one.',
      'Its age depends on checkpoints <b>succeeding</b>, not on the configured interval.',
      'The checkpoint also holds the <b>Kafka offsets</b>: that is the next step.'] }] },
  3: { steps: [
    { h: 'Writes kept arriving while Flink was down.', hl: [[20, 130, 170, 100], [250, 44, 620, 224]], at: [160, 200], lab: [[880, 172, 'unread · retained', '#B45309']], b: [
      'Ingestion kept publishing; Kafka kept <b>appending</b>.',
      'Nothing was read, so everything since the checkpoint is still in the log.'] },
    { h: 'Flink rewinds to the checkpoint\'s offsets.', hl: [[1128, 66, 334, 166], [1110, 334, 370, 58]], at: [1450, 363], b: [
      'Each source reader resets to the <b>offset recorded</b> in the checkpoint.',
      'State and input position now match: the job is back to a consistent moment.',
      'Durable log plus snapshot: <b>time travel</b>.'] },
    { h: 'Replay catches up from there.', hl: [[250, 44, 620, 224], [1128, 66, 334, 166]], path: [[560, 246], [850, 246], [1100, 246], [1440, 209]], lab: [[880, 172, 'catching up', '#1D4ED8']], b: [
      'Flink reprocesses everything since the checkpoint, <b>in order</b> per partition.',
      'Some of that work was already done before the crash, so effects may <b>repeat</b>.',
      'That is why actions downstream must be <b>idempotent</b>.'] },
    { h: 'Retention is the limit.', hl: [[440, 280, 430, 24]], b: [
      'Retention must cover the <b>outage, backlog and catch-up</b> time.',
      'A checkpoint cannot bring back records that have <b>already expired</b>.',
      'Past retention, only the <b>sampled</b> archive remains.'] }] },
  4: { steps: [
    { h: 'Replay re-runs events Flink already saw.', hl: [[232, 40, 170, 200], [444, 30, 250, 220], [736, 20, 300, 240]], path: [[160, 100], [226, 85], [382, 222], [438, 140], [664, 238], [730, 140], [1010, 238]], b: [
      'Events since the checkpoint are processed <b>a second time</b>.',
      'A transition sent before the crash may be <b>emitted again</b>.',
      'Its incident ID lives in keyed state, so the repeat carries the <b>same ID</b>.'] },
    { h: 'Example: a recovery gate holds overdue pages.', hl: [[736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'gate: hold until fresh', '#B45309']], b: [
      'During the downtime, many device timers became <b>overdue</b>.',
      'Without a gate, the restart would page <b>every one of them</b> at once.',
      'Example: a processing-time <b>recovery gate</b> holds those pages until freshness recovers.'] },
    { h: 'Freshness recovers: the gate opens.', hl: [[20, 360, 1010, 40], [1104, 20, 300, 56]], path: [[1010, 238], [1036, 140], [1070, 140], [1070, 48], [1374, 48]], lab: [[40, 328, 'pipeline freshness OK', '#15803D']], b: [
      'Once the pipeline is fresh, a device that is <b>still silent</b> pages as normal.',
      'The gate is <b>bounded</b>: it must never hide a real outage indefinitely.',
      'Repeated transitions reach Action Execution with the <b>same incident ID</b>.'] }] },
  5: { steps: [   // Action Execution close-up (ACT_SVG): idempotent effects
    { h: 'A replayed transition arrives again.', hl: [[20, 120, 150, 110]], at: [140, 200], lab: [[24, 244, 'same incident ID', '#B45309']], b: [
      'Replay re-emits a transition that was <b>already sent</b> before the crash.',
      'It carries the <b>same incident ID</b>, restored from keyed state.'] },
    { h: 'No second page.', hl: [[230, 120, 170, 90], [440, 24, 190, 82]], path: [[140, 200], [170, 160], [226, 160], [315, 120], [315, 70], [600, 76]], b: [
      'The page carries the incident ID as its <b>dedup key</b>, so on-call is not paged twice.',
      'Assume duplicates, and <b>make them harmless</b>.'] },
    { h: 'The ticket starter finds the same workflow.', hl: [[440, 124, 190, 90], [670, 124, 170, 90], [880, 14, 390, 300]], path: [[400, 165], [436, 165], [600, 184], [666, 169], [810, 184], [876, 169], [1222, 66]], b: [
      '<b>signalWithStart</b> on the same workflowId: the running workflow gets a signal, no second workflow starts.',
      'workflowId = <b>tenant + device + outage generation</b>.'] },
    { h: 'ServiceNow upserts, never duplicates.', hl: [[1310, 24, 190, 130]], path: [[1222, 66], [1270, 90], [1306, 90], [1470, 124]], b: [
      'The unique <b>correlation ID</b> means the same ticket is updated.',
      'Exactly-once state in Flink does not make external systems atomic; each needs its <b>own replay contract</b>.',
      'Examples elsewhere: version-checked <b>Redis</b> transitions, stable <b>ClickHouse</b> event IDs.'] }] },
  6: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'Lag spiked while the job was down.', hl: [[240, 30, 310, 140]], at: [520, 140], lab: [[254, 136, '▲ lag spiked', '#DC2626']], b: [
      '<b>Consumer lag</b> rose while no TaskManager was reading.',
      'Freshness slipped with it.'] },
    { h: 'Replay drains it in minutes.', hl: [[240, 30, 310, 140], [900, 30, 310, 140]], path: [[520, 140], [880, 160], [1180, 140]], lab: [[254, 136, '▼ draining', '#15803D'], [914, 136, '✓ checkpoints completing', '#15803D']], b: [
      'Replay catches up and lag <b>drains</b>.',
      'Checkpoints <b>complete</b> again, so the completed-checkpoint age falls back to normal.'] },
    { h: 'A restart alert tells the team.', hl: [[900, 190, 310, 140], [1250, 30, 250, 300]], path: [[1180, 140], [1180, 300], [1240, 180], [1470, 300]], b: [
      'Nobody had to act: <b>humans investigate</b>; machines recover.',
      'A crash should cost a minute, not a morning.'] }] }
});

// ---------- 18 · Hot partition ----------
registerFlow(18, {
  name: 'Hot partition',
  intro: { h: 'One device, one hot partition.', b: [
    'A camera, <b>CAM-77</b> at Acme Site-12, enters a crash loop and sends <b>1,000 messages a second</b>.',
    'One partition falls behind while the rest are fine, and the instinct is to <b>add workers</b>.',
    'We follow why that does not help, and where the fix really belongs.',
    'Watch for three things: <b>lag by partition</b>, one keyed owner, and a per-device limit at the door.'] },
  steps: [
    ['a-edge', 'A camera at Site-12 enters a crash loop and sends 1,000 messages a second from a single device.', [
      '<b>CAM-77</b> is stuck in a crash loop.',
      'One device sends <b>1,000 msgs/sec</b>; the rest of the site behaves normally.',
      'The edge pair forwards it like any other traffic.']],
    ['a-gw', 'It is within the tenant\'s quota, because Acme is big, so it gets through.', [
      'Identity checks pass: CAM-77 is a real, registered Acme device.',
      'Acme is a big tenant, so its <b>tenant quota</b> has plenty of room.',
      'A big tenant\'s quota is large enough to <b>hide one runaway device</b>.',
      'Tenant quotas protect tenants from each other; they do not protect a <b>partition</b> from one device.']],
    ['a-kafka', 'All of one device\'s messages hash to one partition, so P7 lags while the other 63 are fine.', [
      'The key is <b>tenant + device</b>, so every CAM-77 message lands on the <b>same partition</b>.',
      'That keeps CAM-77\'s events <b>in order</b>, but it also concentrates the flood.',
      '<b>P7</b> lags; the other <b>63 partitions</b> are fine.',
      'Total lag hides this: the aggregate can <b>look fine</b> while one partition burns.',
      'Fine-grained keys spread load, but you still <b>measure skew</b> rather than assume equal traffic.']],
    ['a-flink', 'P7 has one source reader, and although keyBy downstream can spread devices, one hot device still has one keyed owner.', [
      'In a consumer group, each partition has <b>one source reader</b>.',
      'After <b>keyBy</b>, the other devices from P7 can spread across downstream subtasks.',
      'But CAM-77 itself has a <b>single keyed-state owner</b>, and that cannot be split.',
      'Other devices <b>sharing its partition</b> may be delayed too.',
      'So adding Flink workers <b>does not help</b>: diagnose the stage first.']],
    ['a-obsp', 'Datadog shows lag by partition, and one hot partition points to one hot key, not a capacity problem.', [
      'Datadog shows <b>consumer lag per partition</b>, not just the total.',
      'One outlier partition points to a <b>hot key</b>, not a capacity problem.',
      'Averages hide the <b>outlier</b> you care about.',
      'Find the hot key <b>before</b> you buy more hardware.']],
    ['a-gw', 'The fix: a per-device rate limit at the gateway caps CAM-77, and the excess is dropped and counted.', [
      'The gateway limits <b>each device</b>, not just each tenant.',
      'CAM-77 is capped; the excess is <b>dropped and counted</b>, so the loss is visible.',
      'Heartbeat capacity stays <b>reserved</b> while the device is limited.',
      'Fairness at every level: <b>tenant and device</b>.',
      'Trade-off: limits must still allow <b>legitimate bursts</b>.']],
    ['a-flink', 'P7 drains, and Flink raises a crash-loop alert for CAM-77 itself.', [
      'With CAM-77 capped, <b>P7 drains</b> and the devices sharing it catch up.',
      'The flood is a symptom; Flink raises a <b>crash loop</b> alert for CAM-77 itself.',
      'The platform contained it at the door, with <b>no new hardware</b>.']]
  ],
  recap: { h: 'Scaling won\'t fix a hot key.', b: [
    '<b>Hot key</b>: one device floods one partition, within its tenant\'s quota.',
    '<b>Diagnose</b>: lag by partition points to a key, not to capacity.',
    '<b>One owner</b>: one reader per partition, one keyed owner per device.',
    '<b>Fix at the door</b>: a per-device limit at the gateway; the excess is dropped and counted.'] }
}, {
  1: { steps: [   // tenant view: the "+ 212 more sites" stack stands in for Site-12
    { h: 'Site-12 is one of Acme\'s 214 sites.', hl: [[880, 60, 150, 300]], at: [1000, 330], lab: [[890, 290, 'Site-12 · CAM-77', '#DC2626']], b: [
      'Acme is a <b>big tenant</b>: 214 sites, each behind its own edge pair.',
      'Every site connects the same way; Site-12 is one of the stack here.'] },
    { h: 'CAM-77 enters a crash loop: 1,000 msgs/sec.', hl: [[880, 60, 150, 300]], at: [1000, 330], lab: [[890, 290, 'CAM-77 · 1,000 msgs/sec', '#DC2626']], b: [
      'One camera is stuck in a <b>crash loop</b>, sending <b>1,000 msgs/sec</b>.',
      'The rest of Site-12 behaves normally; this is <b>one device</b>, not the site.'] },
    { h: 'The edge pair forwards it like any other traffic.', hl: [[230, 374, 840, 34], [1080, 150, 200, 130]], path: [[1000, 330], [1000, 384], [1060, 384], [1060, 215], [1074, 215], [1180, 250]], b: [
      'The edge pair batches CAM-77\'s messages with the rest of the site.',
      'Nothing at the edge marks them as abnormal; they travel the <b>same uplink</b> to the Cloud Gateway.'] }] },
  2: { steps: [   // Cloud Gateway close-up (GW_SVG), before the fix
    { h: 'CAM-77\'s flood arrives from Acme Site-12.', hl: [[20, 116, 250, 54]], at: [240, 143], lab: [[34, 262, 'CAM-77 · 1,000 msgs/sec', '#DC2626']], b: [
      'One crash-looping camera sends <b>1,000 msgs/sec</b> through Site-12\'s gateway.',
      'The rest of the site, and every other tenant, behaves normally.'] },
    { h: 'Identity and tenant checks pass.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], path: [[240, 143], [318, 143], [495, 210], [740, 210]], lab: [[582, 196, 'tenant = acme']], b: [
      'The certificate is valid and CAM-77 is a <b>registered Acme device</b>.',
      'Nothing about its identity is wrong; only its <b>volume</b> is.'] },
    { h: 'Acme is big, so its tenant quota has room.', hl: [[815, 30, 330, 226]], path: [[740, 210], [808, 143], [1115, 226]], b: [
      'Acme\'s <b>tenant bucket</b> is far from empty, so the flood passes.',
      'A big tenant\'s quota is large enough to <b>hide one runaway device</b>.',
      'Tenant quotas protect tenants from each other, not a <b>partition</b> from one device.'] },
    { h: 'On to ingestion, and to a single partition.', hl: [[1190, 46, 150, 194], [1378, 40, 130, 206]], path: [[1115, 226], [1183, 143], [1310, 143], [1478, 135]], b: [
      'Ingestion keys every message by <b>tenant + device</b>.',
      'So all of CAM-77\'s traffic heads for <b>one Kafka partition</b>, as we see next.'] }] },
  3: { steps: [   // the diagram draws P0–P2; one telemetry row stands in for the hot partition
    { h: 'CAM-77\'s flood arrives with a single key.', hl: [[20, 130, 170, 100]], at: [160, 200], b: [
      'Ingestion keys every message by <b>tenant + device</b>: acme + CAM-77.',
      'At 1,000 msgs/sec, that one key carries far more than any normal device.'] },
    { h: 'hash(acme + CAM-77) always picks the same partition.', hl: [[440, 170, 428, 32]], path: [[160, 200], [232, 180], [420, 186], [850, 186]], lab: [[880, 172, 'e.g. P7 · CAM-77', '#DC2626']], b: [
      'One row here stands in for <b>P7</b>, the hot partition.',
      'The same key always hashes to the <b>same partition</b>, which keeps CAM-77 in order.',
      'So the whole flood piles up on <b>one partition</b>.'] },
    { h: 'Every other partition is fine.', hl: [[440, 200, 428, 62], [440, 50, 428, 92]], at: [850, 186], lab: [[880, 232, 'others · normal', '#15803D']], b: [
      'The other <b>63 partitions</b> carry normal traffic and keep up.',
      'Total lag can look fine: <b>watch lag per partition</b>.'] },
    { h: 'One reader owns the hot partition.', hl: [[440, 170, 428, 32], [1128, 66, 334, 46]], path: [[850, 186], [1100, 186], [1440, 89]], b: [
      'In the consumer group, exactly <b>one source reader</b> reads that partition.',
      'Source readers are capped by the partition count; adding more does not split one partition.',
      'And adding partitions mid-incident would <b>break per-device order</b>.'] }] },
  4: { steps: [
    { h: 'P7\'s single reader feeds the job.', hl: [[20, 40, 170, 200]], at: [160, 215], b: [
      'One source reader brings P7\'s backlog into Flink.',
      'Most of it is CAM-77; the rest is the devices that share P7.'] },
    { h: 'keyBy can spread P7\'s other devices.', hl: [[232, 40, 170, 200]], path: [[160, 215], [226, 195], [382, 222]], lab: [[240, 186, 'acme + CAM-77']], b: [
      'After <b>keyBy</b>, each device goes to the subtask that owns its key.',
      'The other devices from P7 can land on <b>different subtasks</b>.',
      'Downstream keyed parallelism is <b>separate</b> from the source readers.'] },
    { h: 'CAM-77 still has exactly one keyed owner.', hl: [[232, 40, 170, 200], [444, 30, 250, 220]], path: [[382, 222], [438, 140], [664, 238]], lab: [[456, 170, 'CAM-77 · one owner', '#DC2626']], b: [
      'All of CAM-77\'s state lives with <b>one owner</b>: dedup, enrichment and rules.',
      'That owner has to process every one of its 1,000 msgs/sec.',
      'Other devices on the same owner or partition may be <b>delayed too</b>.'] },
    { h: 'More workers will not fix it.', hl: [[20, 360, 1010, 40]], at: [664, 238], b: [
      'The instinct is to add <b>TaskManagers</b>.',
      'Extra workers cannot split <b>one hot key</b>.',
      'The fix belongs at <b>admission</b>: limit the device at the gateway.'] }] },
  5: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'Consumer lag, shown by partition.', hl: [[240, 30, 310, 140]], at: [530, 50], lab: [[254, 120, 'P7 · lag climbing', '#DC2626']], b: [
      'Datadog shows <b>consumer lag per partition</b>, not just the total.',
      'One partition, <b>P7</b>, keeps climbing while the others stay flat.'] },
    { h: 'The total can look fine while one partition burns.', hl: [[240, 346, 1260, 50]], path: [[530, 50], [530, 180], [1480, 180], [1480, 370]], b: [
      '<b>Averages hide the outlier</b> you care about.',
      'So lag is watched per partition, and freshness per tenant.'] },
    { h: 'Ingress is normal, so this is not a capacity problem.', hl: [[240, 190, 310, 140]], path: [[1480, 370], [1480, 336], [530, 336], [530, 210]], lab: [[254, 280, 'ingress · normal', '#15803D']], b: [
      'Gateway ingress per tenant is within its normal range.',
      'One outlier partition points to a <b>hot key</b>, not to missing capacity.'] },
    { h: 'Find the hot key before buying hardware.', hl: [[1250, 30, 250, 300]], path: [[530, 210], [1230, 180], [1480, 50]], b: [
      'Autoscaling Flink would add workers that <b>cannot split one key</b>.',
      'The fix belongs at <b>admission</b>: a per-device limit at the gateway.'] }] },
  6: { steps: [
    { h: 'CAM-77\'s traffic arrives from Acme Site-12.', hl: [[20, 116, 250, 54]], at: [240, 143], b: [
      'The flood comes in through Site-12\'s gateway, like any other envelope.',
      'Other Acme sites, and other tenants, keep sending normally.'] },
    { h: 'Identity and tenant checks pass.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], path: [[240, 143], [318, 143], [495, 210], [740, 210]], lab: [[582, 196, 'tenant = acme']], b: [
      'The certificate is valid and CAM-77 is a registered Acme device.',
      'Nothing about its <b>identity</b> is wrong; only its volume is.'] },
    { h: 'Acme\'s tenant quota still has room.', hl: [[815, 30, 330, 226]], path: [[740, 210], [808, 143], [990, 114]], b: [
      'Acme is big, so its <b>tenant bucket</b> is far from empty.',
      'A tenant quota alone lets the runaway device through.'] },
    { h: 'A per-device limit caps CAM-77.', hl: [[815, 30, 330, 226], [780, 280, 728, 110]], at: [990, 114], lab: [[833, 222, 'CAM-77 · capped', '#DC2626']], b: [
      'The gateway also applies <b>rate limits per device</b>.',
      'CAM-77\'s excess is <b>dropped and counted</b>.',
      'Heartbeat capacity stays reserved; limits must still allow legitimate bursts.'] },
    { h: 'Traffic under the cap flows on.', hl: [[1190, 46, 150, 194], [1378, 40, 130, 206]], path: [[990, 114], [1160, 143], [1310, 143], [1478, 135]], b: [
      'CAM-77\'s traffic <b>under the cap</b> still reaches ingestion.',
      'P7 is no longer flooded, so it can <b>drain</b>.',
      'Flink still sees CAM-77, which is how the crash loop gets flagged next.'] }] },
  7: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'P7 drains.', hl: [[20, 40, 170, 200]], at: [160, 215], lab: [[30, 262, 'P7 · draining', '#15803D']], b: [
      'With CAM-77 capped at the gateway, P7\'s backlog <b>shrinks</b>.',
      'The devices that share P7 <b>catch up</b>.'] },
    { h: 'CAM-77\'s capped stream still reaches its keyed owner.', hl: [[232, 40, 170, 200], [444, 30, 250, 220]], path: [[160, 215], [226, 195], [382, 222], [438, 140], [664, 238]], lab: [[456, 200, 'CAM-77 · capped', '#B45309']], b: [
      'Traffic under the cap still flows, so Flink keeps <b>seeing CAM-77</b>.',
      'Its keyed owner now has a load it can keep up with.'] },
    { h: 'The rule engine flags a crash loop.', hl: [[736, 20, 300, 240]], path: [[664, 238], [730, 140], [1006, 238]], lab: [[750, 200, 'CAM-77 · crash loop', '#DC2626']], b: [
      'The flood was a <b>symptom</b>; the cause is a camera stuck in a crash loop.',
      'Flink raises an alert for <b>CAM-77 itself</b>.'] },
    { h: 'Only that state change leaves Flink.', hl: [[1104, 20, 300, 122]], path: [[1006, 238], [1070, 140], [1070, 48], [1384, 48]], b: [
      'The alert goes out through the action lanes, like any other device issue.',
      'The platform contained the flood at the door, with <b>no new hardware</b>.'] }] }
});

// ---------- 19 · Sustained 10× traffic ----------
registerFlow(19, {
  name: 'Sustained 10× traffic',
  intro: { h: 'Traffic stays 10× higher.', b: [
    'This is a <b>design exercise</b>: legitimate fleet traffic rises ten times and stays there.',
    'A burst drains on its own; a queue that grows every hour will <b>eventually fill</b>.',
    'We walk each layer: measure, scale the bottleneck, migrate partitions safely, bound overload, then prove it.',
    'The 2M envelopes/sec figure is <b>illustrative</b>, not a fleet benchmark.'] },
  steps: [
    ['a-edge', 'In this design scenario, legitimate fleet traffic stays 10 times higher: 200K becomes an illustrative 2M batched envelopes per second.', [
      'Unlike a reconnect burst, this load is <b>sustained</b> and legitimate.',
      'The <b>200K</b> normal peak becomes an <b>illustrative 2M</b> envelopes/sec.',
      'Neither the original hardware nor ten times as many workers is <b>assumed</b> to handle it.',
      'Queues buy time; arrivals above capacity <b>never drain by themselves</b>.']],
    ['a-obsp', 'Measure envelopes, bytes, readings and distinct devices separately, and verify p99 freshness, backlog slope and completed-checkpoint age.', [
      'First, <b>measure before scaling</b>.',
      'Count <b>envelopes, bytes, readings and distinct devices</b> separately.',
      'Ten times the readings is different from ten times the <b>devices and timers</b>.',
      'Then watch <b>p99 freshness</b>, <b>backlog slope</b> and <b>completed-checkpoint age</b>.']],
    ['a-gw', 'Reserve heartbeat capacity end to end; tenant and device budgets bound bytes and readings, and queues buy time, not permanent capacity.', [
      'Heartbeat capacity is reserved <b>end to end</b>: admission, Kafka, Flink and the action lane.',
      'Distributed <b>tenant and device budgets</b> bound bytes and readings.',
      'Queues <b>buy time</b>; they are not permanent capacity.',
      'A heartbeat topic alone gives <b>no reservation</b> on shared CPU, network or storage.']],
    ['a-ing', 'Scale ingestion against measured CPU, network and Kafka produce latency; batch envelopes unpack before device-keyed routing.', [
      'Scale ingestion on <b>measured</b> CPU, network and <b>Kafka produce latency</b>.',
      'Each batch envelope <b>unpacks</b> into readings before routing by device key.',
      'So measure <b>readings per envelope</b>, not just envelopes.',
      'Adding pods helps little if <b>Kafka disk</b> or ClickHouse is already saturated.']],
    ['a-kafka', 'Add broker disk, network and recovery headroom; adding partitions can move device keys, so protect ordering during the change.', [
      'Brokers need more <b>disk and network</b>, plus headroom to recover from a node failure.',
      'More partitions allow more source readers, but adding them can <b>move device keys</b>.',
      'A device\'s later events could land on a new partition while earlier ones are <b>still unread</b>.',
      'So partition growth is a <b>planned migration</b>, not a quick fix.']],
    ['a-kafka', 'In an example bulk-topic cutover, fence old producers and retries, buffer arrivals durably, and drain every old partition to its recorded boundary.', [
      'Example: prepare a <b>larger, versioned</b> bulk topic.',
      '<b>Fence</b> the old producers and their retries.',
      '<b>Buffer</b> new arrivals durably, then <b>drain</b> every old partition to its recorded boundary.',
      'Cutover uses bounded buffer capacity and may <b>interrupt bulk freshness</b>; the heartbeat path stays available.']],
    ['a-flink', 'Take a savepoint and preserve compatible keyed state and operator IDs; start the new-topic source at explicit offsets, because old-topic offsets do not transfer.', [
      'Next, take a <b>savepoint</b>.',
      'Restore compatible <b>keyed state</b> with stable <b>operator IDs</b>.',
      'Replace the old source state deliberately, and start the new source at <b>explicit new-topic offsets</b>.',
      'Old-topic offsets do <b>not</b> identify positions in the new topic.',
      'Preserve business state; initialize the new input <b>explicitly</b>.']],
    ['a-flink', 'Scale source readers and keyed operators separately, add slots and nodes, tune state and checkpoints, and isolate liveness from telemetry.', [
      '<b>Source readers</b> and <b>keyed operators</b> have different limits; scale each on its own.',
      'Add <b>slots and nodes</b> for TaskManager capacity.',
      'More devices means more <b>state and timers</b>, so tune state and checkpoints too.',
      'Keep <b>liveness isolated</b> from telemetry, so bulk load cannot delay DEAD detection.',
      'Extra workers still cannot split <b>one hot keyed owner</b>.']],
    ['a-stor', 'Scale ClickHouse writers, shards and retention budget, verify merge pressure and disk growth, and reconcile versioned replayed writes.', [
      '<b>ClickHouse</b> needs more writers and shards, and a bigger <b>retention budget</b>.',
      'Verify <b>merge pressure</b> and disk growth, not just the insert rate.',
      'Replayed writes carry <b>stable event IDs and versions</b>, so history reads deduplicate.',
      'Tiered retention keeps <b>hot-storage cost</b> bounded per device.']],
    ['a-dash', 'Bound query concurrency and SSE fan-out, coalesce updates for slow viewers, and reconnect through shared replay or a snapshot.', [
      'Dashboards get <b>query and stream budgets</b>: bounded concurrency and SSE fan-out.',
      'Slow viewers get <b>coalesced</b> updates, so their queues stay bounded.',
      'A reconnect resumes from a <b>shared replay</b> buffer; an expired cursor gets a new <b>snapshot</b>.',
      'Never pair an old snapshot with the latest cursor: that <b>skips updates</b>.']],
    ['a-gw', 'If capacity is still insufficient, throttle bulk traffic with retry and backoff, sample only eligible telemetry, count drops, and keep heartbeat admission reserved.', [
      'If arrivals still exceed capacity, <b>bound the overload</b>.',
      'Reject bulk traffic with <b>retry and backoff</b>, once declared edge and Kafka buffer limits are used.',
      'Sample only telemetry <b>explicitly eligible</b> for loss, and <b>count</b> every drop.',
      'Heartbeat admission stays <b>reserved</b> throughout.',
      'Protect liveness and <b>make overload visible</b>.']],
    ['a-obsp', 'Soak-test sustained load and node-loss recovery, and prove per-tenant freshness and catch-up within retention before raising quotas.', [
      'A short peak test can pass while <b>retention, recovery or one tenant\'s freshness</b> fails later.',
      'So run a <b>sustained soak</b>, reconnect bursts and <b>node-loss recovery</b> at the proposed rate.',
      'Gate on <b>per-tenant p99 freshness</b>, backlog slope, checkpoint age and catch-up before input expires.',
      'Raise quotas <b>in stages</b>, only after the gates pass.',
      'A soak is evidence for the tested conditions; it does not by itself prove <b>99.9%</b>.']]
  ],
  recap: { h: 'Capacity includes recovery while new traffic keeps arriving.', b: [
    '<b>Measure</b>: envelopes, readings, bytes and devices are different loads.',
    '<b>Scale the bottleneck</b>, then measure again; each layer can be the next limit.',
    '<b>Migrate partitions in order</b>: fence, drain, savepoint, explicit new offsets.',
    '<b>Bound overload</b>: reserve heartbeats, throttle bulk, count drops.',
    '<b>Prove it</b>: soak and recovery gates before raising quotas.'] }
}, {
  1: { steps: [   // tenant view: every site sends more
    { h: 'Every site sends more, and it is legitimate.', hl: [[40, 60, 400, 300], [460, 60, 400, 300], [880, 60, 150, 300]], at: [1000, 330], lab: [[560, 26, 'illustrative 10× · sustained', '#B45309']], b: [
      'This is not a reconnect burst: the fleet\'s normal traffic <b>stays</b> ten times higher.',
      'Small stores and flagships alike; the same pattern repeats across all sites.'] },
    { h: 'One uplink per site carries ten times the batches.', hl: [[230, 374, 840, 34], [1080, 150, 200, 130]], path: [[1000, 330], [1000, 384], [1060, 384], [1060, 215], [1074, 215], [1180, 250]], b: [
      'Site batching still applies; there are simply ten times as many envelopes.',
      'The <b>200K</b> normal peak becomes an <b>illustrative 2M</b> envelopes/sec at the Cloud Gateway.'] },
    { h: 'Queues buy time; sustained load never drains by itself.', hl: [[1300, 14, 200, 392]], at: [1180, 250], b: [
      'The normal-peak math: 100M devices × 1/min ≈ 1.7M readings/sec, about 200K envelopes/sec.',
      'At 10×, neither the original hardware nor ten times the workers is <b>assumed</b> to cope.',
      'Arrivals above capacity <b>never drain</b> on their own; capacity has to change.'] }] },
  2: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'First, measure before scaling.', hl: [[20, 30, 190, 300]], at: [190, 50], b: [
      'Every layer reports into Datadog: gateway, ingestion, Kafka, Flink, actions.',
      'Scaling blindly moves the bottleneck without finding it.'] },
    { h: 'Envelopes, readings, bytes and devices are different loads.', hl: [[240, 190, 310, 140]], path: [[190, 50], [220, 180], [530, 210]], lab: [[254, 280, '10× sustained (example)', '#B45309']], b: [
      'Count <b>envelopes, bytes, readings and distinct devices</b> separately.',
      'Ten times the readings is different from ten times the <b>devices and timers</b>.'] },
    { h: 'Freshness and backlog slope show whether we keep up.', hl: [[240, 30, 310, 140], [570, 30, 310, 140]], path: [[530, 210], [530, 180], [860, 180], [860, 50]], lab: [[254, 120, '▲ growing steadily', '#DC2626'], [584, 120, '▲ freshness slipping', '#DC2626']], b: [
      'Watch <b>p99 freshness</b>: how old events are when Flink processes them.',
      'A steadily rising <b>backlog slope</b> means arrivals exceed capacity.'] },
    { h: 'Checkpoint age shows whether Flink can still recover.', hl: [[900, 30, 310, 140]], path: [[860, 50], [880, 180], [1190, 50]], b: [
      'Track the <b>age of the last completed checkpoint</b>, not just its duration.',
      'If checkpoints fall behind, a crash would replay far more input.'] }] },
  3: { steps: [   // Cloud Gateway close-up (GW_SVG): budgets and reservation
    { h: 'Traffic is now ten times higher, and legitimate.', hl: [[20, 46, 250, 194]], at: [240, 143], lab: [[34, 262, 'illustrative 2M envelopes/sec', '#B45309']], b: [
      'Every tenant\'s fleet is sending more: this is <b>sustained</b> load, not a burst.',
      'The 2M figure is <b>illustrative</b>.'] },
    { h: 'Tenant and device budgets bound bytes and readings.', hl: [[815, 30, 330, 226]], path: [[240, 143], [318, 143], [495, 210], [740, 210], [808, 143], [1115, 226]], b: [
      'Distributed <b>tenant and device budgets</b> bound bytes and readings, not just envelopes.',
      'They are shared across gateway replicas, so adding replicas does <b>not multiply</b> a quota.'] },
    { h: 'Heartbeat capacity is reserved end to end.', hl: [[20, 280, 740, 110]], at: [1115, 226], b: [
      'Reserved at <b>admission, Kafka, Flink and the action lane</b>.',
      'A heartbeat topic alone gives <b>no reservation</b> on shared CPU, network or storage.'] },
    { h: 'Queues buy time, not permanent capacity.', hl: [[1190, 46, 150, 194], [1378, 40, 130, 206]], path: [[1115, 226], [1183, 143], [1310, 143], [1478, 135]], b: [
      'Whatever passes still needs <b>measured capacity</b> downstream.',
      'Next we scale each bottleneck: ingestion, Kafka, Flink, storage, dashboards.'] }] },
  4: { steps: [   // Ingestion close-up (ING_SVG)
    { h: 'Ten times the envelopes arrive.', hl: [[20, 120, 180, 110]], at: [170, 200], lab: [[34, 262, 'illustrative 2M envelopes/sec', '#B45309']], b: [
      'Each one is a <b>site batch</b>, authenticated and tenant-tagged by the gateway.',
      'The figure is <b>illustrative</b>, not a fleet benchmark.'] },
    { h: 'Each envelope unpacks into many readings.', hl: [[275, 142, 330, 58]], path: [[170, 200], [248, 175], [580, 95], [580, 171]], lab: [[620, 200, 'readings per envelope', '#1D4ED8']], b: [
      'Every batch <b>unpacks</b> into device readings before routing by device key.',
      'So measure <b>readings per envelope</b>, not just envelopes.'] },
    { h: 'Scale the pool on measured signals.', hl: [[620, 70, 190, 110]], at: [580, 171], lab: [[630, 190, 'scaling out', '#1D4ED8']], b: [
      'Scale on <b>measured</b> CPU, network and <b>Kafka produce latency</b>.',
      'Pods hold no state, so new ones take traffic straight away.'] },
    { h: 'More pods help only if Kafka can take the writes.', hl: [[905, 60, 300, 100], [905, 220, 300, 100]], path: [[580, 171], [580, 247], [605, 258], [860, 258], [860, 270], [900, 270], [1175, 290]], b: [
      'Adding pods helps little if <b>Kafka disk</b> or ClickHouse is already saturated.',
      'Heartbeats still go to their own topic, with capacity reserved <b>end to end</b>.'] }] },
  5: { steps: [   // Kafka close-up (KAFKA_SVG)
    { h: 'Ten times the writes reach the brokers.', hl: [[20, 130, 170, 100]], at: [160, 200], b: [
      'Ingestion publishes far more readings, still keyed by <b>tenant + device</b>.',
      'Every broker sees more bytes on disk and on the network.'] },
    { h: 'Brokers need disk, network and recovery headroom.', hl: [[240, 14, 820, 306]], path: [[160, 200], [232, 180], [850, 126]], lab: [[880, 290, 'disk · network · headroom', '#B45309']], b: [
      'Add broker <b>disk and network</b> for the higher write rate.',
      'Keep headroom to <b>recover from a node failure</b> while new traffic keeps arriving.'] },
    { h: 'More partitions allow more source readers.', hl: [[1128, 66, 334, 166]], path: [[850, 126], [1100, 126], [1440, 209]], b: [
      'Source readers can never outnumber partitions.',
      'So more Flink read parallelism needs <b>more partitions</b>.'] },
    { h: 'But adding partitions can move device keys.', hl: [[250, 164, 620, 100]], path: [[1440, 209], [1100, 186], [850, 186]], lab: [[880, 172, 'e.g. a key moves P2 → P5', '#DC2626']], b: [
      'A device\'s later events could land on a new partition while earlier ones are <b>still unread</b>.',
      'That would break per-device order, so partition growth is a <b>planned migration</b>.'] }] },
  6: { steps: [   // example cutover on the Kafka close-up; the telemetry rows stand in for the old bulk topic
    { h: 'Fence the old producers.', hl: [[20, 130, 170, 100]], at: [160, 200], b: [
      'Example: ingestion stops writing to the old bulk topic.',
      'Its <b>retries</b> are fenced too, so no late write slips into the old topic.',
      'A larger, versioned topic is already prepared.'] },
    { h: 'Arrivals buffer durably while the old topic drains.', hl: [[250, 164, 620, 100]], at: [160, 200], lab: [[880, 172, 'e.g. old bulk topic', '#B45309']], b: [
      'New arrivals are <b>buffered durably</b> instead of written to the old topic.',
      'That buffer is <b>bounded</b>, so the cutover has a time budget.',
      'Bulk freshness may pause; it is a planned cost.'] },
    { h: 'Drain every old partition to its recorded boundary.', hl: [[250, 164, 620, 100], [1128, 66, 334, 166]], path: [[560, 246], [850, 246], [1100, 246], [1440, 209]], lab: [[880, 172, 'drain to boundary', '#1D4ED8']], b: [
      'Each old partition\'s final offset is <b>recorded</b>.',
      'Flink reads every partition up to that boundary, so no device has <b>unread</b> older events.',
      'Only then can a device\'s new events safely go to a <b>different</b> partition.'] },
    { h: 'Savepoint, then start the new topic at explicit offsets.', hl: [[1128, 66, 334, 166], [1110, 334, 370, 58]], at: [1450, 363], b: [
      'Take a <b>savepoint</b>; keyed state carries over with stable operator IDs.',
      'Old-topic offsets <b>do not transfer</b>; the new source starts at explicit offsets.',
      'Buffered writes resume with <b>stable event IDs</b>, and retries are deduplicated.'] },
    { h: 'The heartbeat path stays available.', hl: [[250, 44, 620, 100]], at: [850, 126], lab: [[880, 60, 'stays available', '#15803D']], b: [
      'This example cutover is for the <b>bulk</b> topic.',
      'The separate <b>heartbeat path</b> keeps flowing, so DEAD detection is not interrupted.',
      'Once the new route has accepted events, <b>re-plan recovery</b> around it.'] }] },
  7: { steps: [   // Flink close-up (FLINK_SVG): savepoint across the topic change
    { h: 'Take a savepoint.', hl: [[20, 360, 1010, 40]], at: [1000, 380], b: [
      'A <b>savepoint</b> captures all keyed state and timers, like a checkpoint you control.',
      'The job restarts from it on the new topology.'] },
    { h: 'Keyed state carries over, with stable operator IDs.', hl: [[232, 40, 170, 200], [444, 30, 250, 220], [736, 20, 300, 240]], path: [[1000, 380], [1006, 238], [664, 238]], b: [
      'Restore compatible <b>keyed state</b>: dedup windows, device state, timers.',
      '<b>Stable operator IDs</b> let each piece of state find its operator again.'] },
    { h: 'The new source starts at explicit new-topic offsets.', hl: [[20, 150, 170, 90]], path: [[664, 238], [438, 140], [382, 222], [160, 215]], lab: [[30, 262, 'new topic · explicit offsets', '#1D4ED8']], b: [
      'Old-topic offsets do <b>not</b> identify positions in the new topic.',
      'Replace the old source state deliberately; <b>initialize the new input explicitly</b>.'] }] },
  8: { steps: [   // Flink close-up (FLINK_SVG): scaling the job
    { h: 'Source readers and keyed operators scale separately.', hl: [[20, 40, 170, 200], [232, 40, 170, 200]], at: [160, 215], b: [
      'Source readers are bounded by partitions; keyed operators by state and CPU.',
      'Scale each <b>on its own</b> measured limit.'] },
    { h: 'More devices means more state and timers.', hl: [[444, 30, 250, 220], [736, 20, 300, 240]], path: [[160, 215], [226, 195], [382, 222], [438, 140], [664, 238], [730, 140], [1006, 238]], lab: [[750, 200, 'more devices → more timers', '#B45309']], b: [
      'Every new device brings <b>keyed state and a timer</b>.',
      'So tune the state backend and checkpoints, not just CPU.'] },
    { h: 'Add slots and nodes; checkpoints must keep up.', hl: [[20, 360, 1010, 40]], at: [1000, 380], b: [
      'Add <b>slots and nodes</b> for TaskManager capacity.',
      'Bigger state means longer checkpoints; watch completed-checkpoint age.'] },
    { h: 'Liveness stays isolated from telemetry.', hl: [[20, 40, 170, 90], [1104, 20, 300, 56]], path: [[1000, 380], [1070, 140], [1070, 48], [1384, 48]], b: [
      'Bulk load must not delay <b>DEAD detection</b>.',
      'Extra workers still cannot split <b>one hot keyed owner</b>.'] }] },
  9: { steps: [   // Storage close-up (STOR_SVG)
    { h: 'Ten times the rows head for ClickHouse.', hl: [[20, 150, 170, 100], [272, 112, 250, 82]], path: [[170, 200], [230, 200], [230, 152], [255, 152]], b: [
      'Raw telemetry lands in <b>ClickHouse hot</b>; it needs more writers and shards.',
      'The 7-day hot window now holds ten times the rows.'] },
    { h: 'Watch merge pressure and disk growth.', hl: [[272, 112, 250, 82], [272, 204, 250, 82]], at: [500, 152], lab: [[560, 200, 'merges · disk growth', '#B45309']], b: [
      'Verify <b>merge pressure</b> and disk growth, not just the insert rate.',
      'Grow the <b>retention budget</b> with the data, or retention breaks first.'] },
    { h: 'Replayed writes deduplicate on read.', hl: [[272, 112, 250, 82]], at: [500, 152], b: [
      'A migration or recovery can <b>replay</b> writes.',
      'They carry <b>stable event IDs and versions</b>, so history reads deduplicate.'] },
    { h: 'Tiered retention keeps hot cost bounded.', hl: [[272, 204, 250, 82], [272, 296, 250, 82]], path: [[500, 152], [500, 244], [500, 336]], b: [
      'Rollups go warm for 6 months; sampled exports go to S3.',
      'Hot-storage cost stays <b>bounded per device</b>, even at ten times the load.'] }] },
  10: { steps: [   // Dashboards close-up (DASH_SVG)
    { h: 'Budgets on queries and streams.', hl: [[490, 64, 320, 96], [490, 174, 320, 96]], at: [790, 84], b: [
      'Dashboards get <b>bounded query concurrency</b> and a cap on SSE fan-out.',
      'More traffic must not turn into unbounded load on ClickHouse.'] },
    { h: 'Slow viewers get coalesced updates.', hl: [[490, 64, 320, 96], [1200, 20, 310, 370]], path: [[790, 84], [830, 120], [1196, 120], [1490, 300]], lab: [[1218, 300, 'slow viewer · coalesced', '#B45309']], b: [
      'A slow page gets <b>coalesced</b> updates instead of every change.',
      'Its queue stays <b>bounded</b>, so one viewer cannot back up the hub.'] },
    { h: 'A reconnect resumes from shared replay, or a snapshot.', hl: [[490, 64, 320, 96], [20, 40, 180, 110]], path: [[1490, 300], [830, 120], [200, 95]], b: [
      'A reconnect resumes from a <b>shared replay</b> buffer.',
      'An expired cursor gets a new consistent <b>snapshot</b>.'] },
    { h: 'Never pair an old snapshot with the latest cursor.', hl: [[490, 174, 320, 96]], path: [[200, 95], [486, 220], [790, 250]], lab: [[504, 262, 'old snapshot + new cursor = gap', '#DC2626']], b: [
      'That combination <b>skips updates</b> in between.',
      'Snapshot and cursor must come from the <b>same position</b>.'] }] },
  11: { steps: [   // Cloud Gateway close-up (GW_SVG): bounded overload
    { h: 'Arrivals still exceed capacity.', hl: [[20, 46, 250, 194]], at: [240, 143], lab: [[34, 262, 'arrivals > capacity', '#DC2626']], b: [
      'Scaling has not caught up, and the declared edge and Kafka buffers are used.',
      'Arrivals above capacity <b>never drain by themselves</b>.'] },
    { h: 'Bulk traffic is rejected, with retry and backoff.', hl: [[815, 30, 330, 226]], path: [[240, 143], [318, 143], [495, 210], [740, 210], [808, 143], [1115, 226]], lab: [[833, 240, 'bulk · 429 · retry + backoff', '#DC2626']], b: [
      'The gateway <b>rejects bulk traffic</b>; senders retry with backoff.',
      'This starts only once the <b>declared buffer limits</b> are used.'] },
    { h: 'Sample only eligible telemetry, and count every drop.', hl: [[815, 30, 330, 226], [780, 280, 728, 110]], at: [1115, 226], lab: [[833, 240, 'drops counted', '#B45309']], b: [
      'Only telemetry <b>explicitly eligible</b> for loss is sampled.',
      'Every drop is <b>counted</b>, so overload is visible, never silent.'] },
    { h: 'Heartbeat admission stays reserved.', hl: [[20, 280, 740, 110], [1378, 40, 130, 206]], path: [[1115, 226], [1183, 143], [1310, 143], [1478, 135]], b: [
      'Heartbeats keep flowing, so DEAD detection stays <b>accurate</b>.',
      'Protect liveness and <b>make overload visible</b>.'] }] },
  12: { steps: [   // Datadog close-up (OBS_SVG): soak and recovery gates
    { h: 'Soak at the proposed rate.', hl: [[240, 190, 310, 140]], at: [530, 210], lab: [[254, 280, '2M/s scenario · verify', '#B45309']], b: [
      'Run a <b>sustained soak</b>, reconnect bursts and <b>node-loss recovery</b> at the proposed rate.',
      'A short peak test can pass while retention, recovery or one tenant\'s freshness fails later.'] },
    { h: 'Gate on per-tenant freshness and backlog slope.', hl: [[240, 30, 310, 140], [570, 30, 310, 140], [240, 346, 1260, 50]], path: [[530, 210], [530, 180], [860, 180], [860, 50]], lab: [[254, 120, '✓ capacity gate', '#15803D'], [584, 120, '✓ freshness gate', '#15803D']], b: [
      'Gate on <b>per-tenant p99 freshness</b>, not the fleet average.',
      'The backlog slope must stay flat at the new rate.'] },
    { h: 'Checkpoints and catch-up, before input expires.', hl: [[900, 30, 310, 140]], path: [[860, 50], [880, 180], [1190, 50]], b: [
      'Completed-checkpoint age stays healthy under the soak.',
      'After a node loss, the job must <b>catch up before Kafka retention</b> expires its input.'] },
    { h: 'Raise quotas in stages.', hl: [[1250, 30, 250, 300]], path: [[1190, 50], [1230, 180], [1480, 50]], b: [
      'Raise quotas <b>in stages</b>, only after the gates pass.',
      'A soak is evidence for the tested conditions; it does not by itself prove <b>99.9%</b>.'] }] }
});
