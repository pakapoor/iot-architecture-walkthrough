// Presenter notes: multi-region, a design extension of the global + isolated China deployment.
// 26 · Data residency (Correctness & trade-offs) and 27 · Region outage → failover (When things break).
// Format: see pres/notes.js (flow 1) and registerFlow(). Inside views use the close-up SVG coordinates in tools/svgs.py (REG, CTRL, EDGE, GW, KAFKA, FLINK, ACT, STOR, DASH, OBS).
{
const REG_ZONES = { h: 'Residency zones, each with full regional cells.', hl: [[20, 100, 470, 248], [510, 100, 470, 248]], at: [208, 272], b: [
  'Each zone runs <b>complete cells</b>: gateway, ingestion, Kafka, Flink, Temporal, storage and dashboards.',
  'The regions shown are <b>examples</b>; this extends the global + China deployment.'] };

// ---------- 26 · Data residency ----------
registerFlow(26, {
  name: 'Data residency',
  intro: { h: 'One platform, many jurisdictions. Where does each tenant\'s data live?', b: [
    'Some tenants must keep their data <b>inside a legal region</b>: for example the EU, the US, or China.',
    'This is a <b>design extension</b>: the platform today runs a global region and an isolated China region; the extra regions are examples.',
    'We follow <b>Acme Retail</b>, homed in an example EU region, from onboarding to its dashboards.',
    'Watch for one idea: residency comes from <b>where data is placed</b>, not from a filter on a shared store.'] },
  steps: [
    ['a-reg', 'Every residency zone runs full regional cells; each tenant has one home region.', [
      'A <b>cell</b> is a complete copy of the platform: gateway, ingestion, Kafka, Flink, Temporal, storage and dashboards.',
      'Each tenant is pinned to one <b>home region</b>; its devices, state and incidents live there.',
      'Each home cell has a <b>paired standby</b> in the same zone, for disaster recovery.',
      'Example zones: EU and US, with <b>China</b> fully separate.']],
    ['a-ctrl', 'Onboarding gives Acme its home region; only that routing fact is global.', [
      'The platform admin onboards Acme with home region <b>EU-1</b>.',
      'The global control plane stores <b>tenant → home region</b>: routing metadata, not telemetry.',
      'It has one <b>writable primary</b> and read replicas in every region, so routing survives a primary outage.',
      'Device data, readings and incidents never pass through the global layer.']],
    ['a-edge', 'Acme\'s site gateways connect to their home cell, and only there.', [
      'Each site gateway resolves its endpoint through the <b>registry and DNS</b>.',
      'For Acme, that is the <b>EU-1</b> cell; devices still never reach the cloud directly.',
      'If the WAN drops, the site spools locally, exactly as before.']],
    ['a-gw', 'The EU-1 gateway admits only tenants homed in EU-1.', [
      'mTLS and the registry identify the site gateway and its tenant, as in every flow.',
      'The gateway also checks the tenant\'s <b>home region</b>: a device registered elsewhere is refused.',
      'So a misrouted site cannot quietly write its data into the wrong jurisdiction.']],
    ['a-flink', 'Telemetry, state, timers and incident decisions stay in the home cell.', [
      'Acme\'s Kafka topics and Flink keyed state exist <b>only in EU-1</b>.',
      'Silence timers, the graded ladder and incident IDs run there too.',
      'One owner per device keeps ordering and "one incident, one ticket" simple.']],
    ['a-act', 'Pages, workflows and tickets are raised from the home cell.', [
      'The Temporal incident workflow runs in <b>EU-1</b>.',
      'PagerDuty pages and ServiceNow tickets are sent <b>from the home cell</b>, with the same idempotent upsert.',
      'Tenant integrations are configured per tenant, so they follow the tenant\'s region.']],
    ['a-stor', 'Every store for Acme lives inside the zone.', [
      'Redis live state, ClickHouse history, MongoDB records and the archive are all in <b>EU-1</b>.',
      'The replicated copies for disaster recovery stay in the <b>same zone</b> (EU-2).',
      'Example design: backups and archives follow the same residency rule.']],
    ['a-dash', 'Dashboards are served from the home region; cross-region views use aggregates.', [
      'Acme\'s admins are routed to the <b>EU-1</b> dashboard service, with RBAC on every call.',
      'The platform admin\'s cross-region view shows <b>aggregates only</b>: health and counts, not tenant data.',
      'So even the platform view does not pull raw data across a border.']],
    ['a-reg', 'China is fully isolated.', [
      'China runs its <b>own control plane copy</b>; nothing replicates out.',
      'Its disaster recovery stays <b>inside China</b>, with its own standby.',
      'It is deployed from the same Git repo, but run as a separate platform.']],
    ['a-reg', 'We rejected residency by filter; moving a tenant is a planned migration.', [
      'We rejected <b>one global cluster with per-row region tags</b>: a filter is not a border.',
      'Trade-off: every zone needs its own <b>capacity and operations</b>.',
      'Trade-off: moving a tenant\'s home region is a <b>planned migration</b>, never a config flip.',
      'Residency comes from <b>placement</b>.']]
  ],
  recap: { h: 'Residency by placement, not by filter.', b: [
    '<b>Home region</b>: every tenant has one, and its data stays there.',
    '<b>Global routing only</b>: tenant → home region, with replicas in every region.',
    '<b>In-zone recovery</b>: the paired standby stays in the same zone.',
    '<b>China isolated</b>: own control plane copy, own DR.',
    '<b>Honest cost</b>: per-zone capacity, and planned tenant moves.'] }
}, {
  1: { steps: [   // Regions close-up (REG_SVG)
    REG_ZONES,
    { h: 'Each tenant has one home region.', hl: [[20, 362, 1480, 50], [38, 136, 190, 156]], path: [[1470, 388], [208, 272]], b: [
      'Example: Acme → <b>EU-1</b>, Beta → <b>US-1</b>.',
      'The home cell is the <b>only owner</b> of that tenant\'s devices.'] },
    { h: 'A paired standby in the same zone.', hl: [[282, 136, 190, 156]], path: [[208, 272], [452, 272]], lab: [[38, 304, 'replicated in-zone', '#15803D']], b: [
      'EU-2 is a <b>warm standby</b> for EU-1, inside the EU zone.',
      'It is what disaster recovery fails over to.'] }] },
  2: { steps: [   // Control plane close-up (CTRL_SVG)
    { h: 'The platform admin onboards Acme.', hl: [[20, 14, 350, 330]], at: [330, 322], b: [
      'Onboarding tenants is a <b>platform admin</b> action.',
      'The new tenant gets its <b>home region</b> at onboarding.'] },
    { h: 'Acme → EU-1 is recorded as routing metadata.', hl: [[36, 104, 330, 30]], at: [330, 322], lab: [[20, 392, 'acme → home region EU-1']], b: [
      'The global layer stores <b>tenant → home region</b>, nothing more.',
      'One writable primary, <b>read replicas</b> in every region.'] },
    { h: 'China tenants are onboarded in China\'s own copy.', hl: [[1160, 230, 380, 114]], at: [1510, 330], b: [
      'China tenants use the <b>isolated region</b>, with its own control plane copy.',
      'RBAC still scopes every call by tenant.'] }] },
  3: { steps: [   // tenant view (EDGE_SVG), then the small site
    { h: 'Acme\'s sites, all homed in EU-1.', hl: [[40, 60, 400, 300], [460, 60, 400, 300]], at: [345, 268], b: [
      'Every Acme site has its own <b>edge pair</b>.',
      'All of them belong to a tenant homed in <b>EU-1</b>.'] },
    { svg: 'small', h: 'The gateway resolves its home cell.', hl: [[490, 60, 300, 180]], at: [760, 212], lab: [[504, 194, 'registry + DNS → EU-1']], b: [
      'The site gateway looks up its endpoint through the <b>registry and DNS</b>.',
      'The answer is Acme\'s home cell: <b>EU-1</b>.'] },
    { svg: 'small', h: 'The batch goes to EU-1 only.', hl: [[490, 60, 300, 180], [910, 90, 220, 130]], path: [[760, 212], [790, 150], [904, 150], [1100, 190]], lab: [[922, 176, 'EU-1 cell']], b: [
      'mTLS over the WAN, as always, but to the <b>home cell</b>.',
      'If the WAN drops, the spool keeps the data <b>on site</b>.'] }] },
  4: { steps: [   // Cloud Gateway close-up (GW_SVG)
    { h: 'An Acme envelope arrives at EU-1.', hl: [[20, 46, 250, 54]], at: [240, 73], b: [
      'Envelopes from Acme\'s sites arrive at the <b>EU-1</b> gateway.'] },
    { h: 'mTLS and the registry: tenant and home region.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], path: [[240, 73], [318, 73], [495, 210], [740, 210]], lab: [[582, 196, 'acme · home EU-1 ✓']], b: [
      'The registry gives the tenant <b>and its home region</b>.',
      'A device registered to another region is <b>refused</b>, not processed here.'] },
    { h: 'Quotas, then the EU-1 ingestion pool.', hl: [[815, 30, 330, 226], [1378, 40, 130, 206]], path: [[740, 210], [808, 143], [1115, 226], [1183, 143], [1310, 143], [1478, 135]], b: [
      'Per-tenant quotas apply as usual.',
      'Only EU-homed traffic reaches the <b>EU-1</b> pipeline.'] }] },
  5: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'Acme\'s topics exist only in EU-1.', hl: [[20, 40, 170, 90], [20, 150, 170, 90]], at: [160, 100], b: [
      'Heartbeats and telemetry for Acme are written to <b>EU-1\'s Kafka</b>.'] },
    { h: 'Keyed state and timers live in the home cell.', hl: [[232, 40, 170, 200], [736, 20, 300, 240]], path: [[170, 85], [226, 85], [382, 140], [438, 140], [664, 140], [730, 140], [1006, 230]], lab: [[750, 178, 'acme:CAM-14 · EU-1']], b: [
      'Silence timers and the graded ladder run <b>in EU-1</b>.',
      'One owner per device keeps ordering simple.'] },
    { h: 'Checkpoints stay in the zone too.', hl: [[20, 360, 1010, 40]], at: [1006, 230], b: [
      'Checkpoints go to object storage that is replicated <b>inside the zone</b>.',
      'That is what the EU-2 standby restores from.'] }] },
  6: { steps: [   // Action Execution close-up (ACT_SVG)
    { h: 'Incidents arrive from EU-1\'s Flink.', hl: [[20, 120, 150, 110]], at: [150, 210], b: [
      'The incident ID is <b>tenant + device + outage generation</b>, as everywhere.'] },
    { h: 'The workflow runs in the home cell.', hl: [[880, 14, 390, 300]], path: [[150, 160], [226, 160], [400, 165], [436, 169], [630, 169], [666, 169], [840, 169], [876, 169], [1240, 66]], b: [
      'Temporal runs in <b>EU-1</b>; its history is replicated in-zone.'] },
    { h: 'Pages and tickets are sent from EU-1.', hl: [[440, 24, 190, 82], [1310, 24, 190, 130]], path: [[1240, 66], [1270, 90], [1306, 90], [1480, 138]], b: [
      'PagerDuty and ServiceNow calls leave <b>from the home cell</b>.',
      'Integrations are tenant configuration, so they follow the tenant.'] }] },
  7: { steps: [   // Storage close-up (STOR_SVG)
    { h: 'Every store for Acme is in EU-1.', hl: [[272, 20, 250, 82], [272, 112, 250, 82], [272, 204, 250, 82], [272, 388, 250, 82]], at: [500, 90], b: [
      'Redis, ClickHouse and MongoDB for Acme run <b>in EU-1</b>.'] },
    { h: 'The archive follows the same rule.', hl: [[272, 296, 250, 82]], at: [500, 360], b: [
      'Archives and backups stay <b>in the zone</b>.'] },
    { h: 'Dashboards read in-region.', hl: [[830, 20, 300, 450]], path: [[500, 360], [800, 215], [1100, 215]], b: [
      'The dashboard service reads the <b>EU-1</b> stores only.'] }] },
  8: { steps: [   // Dashboards close-up (DASH_SVG)
    { h: 'Acme\'s admins are routed to EU-1.', hl: [[470, 20, 360, 370]], at: [780, 140], b: [
      'The dashboard service for Acme runs in the <b>home region</b>.'] },
    { h: 'RBAC on every call, as always.', hl: [[490, 284, 320, 90]], path: [[780, 140], [780, 340]], b: [
      'Role + tenant + sites scope every query, <b>on the server</b>.'] },
    { h: 'Cross-region platform views use aggregates.', hl: [[880, 20, 300, 370]], path: [[780, 340], [830, 300], [1150, 300]], lab: [[898, 290, 'aggregates only', '#5B3FD9']], b: [
      'The platform admin sees health and counts per region, <b>not tenant data</b>.'] }] },
  9: { steps: [   // Regions close-up (REG_SVG)
    { h: 'China runs as a separate platform.', hl: [[1000, 100, 500, 248]], at: [1218, 272], b: [
      'A full home cell <b>and</b> a standby, both in China.'] },
    { h: 'Its own control plane copy; nothing replicates out.', hl: [[1018, 136, 464, 44]], at: [1218, 272], b: [
      'No tenant data and no routing records leave China.'] },
    { h: 'Same Git repo, separate operation.', hl: [[1018, 192, 220, 100], [1262, 192, 220, 100]], path: [[1218, 272], [1462, 272]], b: [
      'Argo CD deploys it from the same repo; <b>DR stays in China</b>.'] }] },
  10: { steps: [   // Regions close-up (REG_SVG)
    { h: 'Rejected: one global cluster with region tags.', hl: [[380, 14, 760, 64]], at: [1110, 60], b: [
      'A per-row region tag is a <b>filter</b>, not a border.',
      'The global layer holds <b>routing metadata only</b>.'] },
    { h: 'Each zone costs its own capacity.', hl: [[20, 100, 470, 248], [510, 100, 470, 248]], at: [452, 272], b: [
      'Every zone needs its own cells, standby and operations.'] },
    { h: 'Moving a home region is a planned migration.', hl: [[20, 362, 1480, 50]], at: [1470, 388], b: [
      'Re-homing a tenant moves its data and routing <b>in a planned, drained cutover</b>.'] }] }
});

// ---------- 27 · Region outage → failover ----------
registerFlow(27, {
  name: 'Region outage → failover',
  intro: { h: 'A whole region goes dark. Do a million devices page on-call?', b: [
    'A <b>design extension</b>: each home region has a paired standby in the same residency zone; the regions are examples.',
    'We follow Acme\'s home region, <b>EU-1</b>, through an outage, a failover to <b>EU-2</b>, and the way back.',
    'Two traps: a <b>page storm</b> for devices that are fine, and <b>duplicate tickets</b> after the move.',
    'Watch for three things: UNKNOWN instead of DEAD, the same incident IDs, and <b>rehearsed</b> RPO and RTO.'] },
  steps: [
    ['a-reg', 'Acme\'s home region, EU-1, goes dark.', [
      'Design example: the <b>whole EU-1 cell</b> is unreachable: gateway, Kafka, Flink, Temporal, stores.',
      'The paired standby <b>EU-2</b>, in the same EU zone, is healthy.',
      'Other zones, and China, are unaffected.']],
    ['a-edge', 'Site gateways cannot reach EU-1, so they spool and retry.', [
      'Every Acme site keeps collecting heartbeats and <b>spools to disk</b>.',
      'The spool is <b>bounded and alarmed</b>; it buys time, not forever.',
      'Spooled heartbeats are history: they will not refresh current health on their own.']],
    ['a-obsp', 'Region health monitors page the operators about the region.', [
      'Datadog sees <b>EU-1 ingress at zero</b> and the region unreachable.',
      'On-call gets <b>one page about the region</b>, not one per device.',
      'The observer is broken, so device silence is not evidence: the lesson from "Device or pipeline failure?".']],
    ['a-reg', 'The failover decision targets the paired standby in the same zone.', [
      'Failover is <b>human-approved</b>, or automated with guardrails such as a minimum outage time.',
      'The target is <b>EU-2</b>, so Acme\'s data stays in the EU zone.',
      'We rejected <b>active-active per device</b>: it would need cross-region agreement on every heartbeat.']],
    ['a-gw', 'Registry and DNS move Acme\'s gateways to EU-2.', [
      'The registry points Acme\'s sites at <b>EU-2</b>, and DNS follows.',
      'Same certificates, same tenant identity: the EU-2 gateway admits them.',
      'Quotas still apply, so the reconnect burst is bounded.']],
    ['a-kafka', 'EU-2 already holds the replicated topics.', [
      'Kafka topics are replicated continuously, for example with <b>MirrorMaker 2 or cluster linking</b>.',
      'Consumer group offsets are <b>translated</b> to EU-2\'s copy of the log.',
      'Whatever had not replicated yet is the <b>replication-lag window</b>: the RPO.']],
    ['a-flink', 'Flink restores the last checkpoint; devices stay UNKNOWN until caught up.', [
      'Flink starts in EU-2 from the last checkpoint in <b>replicated object storage</b>.',
      'Every timer would fire at once after the gap, so health is held at <b>UNKNOWN</b>, not DEAD.',
      'UNKNOWN clears only when the pipeline is <b>fresh</b> again.',
      'No page storm for devices that were never down.']],
    ['a-act', 'Temporal history is replicated, so open incidents simply continue.', [
      'Temporal history is replicated to EU-2, for example with <b>multi-cluster replication</b>.',
      'Open workflows resume with the <b>same incident IDs</b>: tenant + device + outage generation.',
      'The ServiceNow upsert is idempotent by that ID, so <b>no duplicate tickets</b>.']],
    ['a-edge', 'Spools flush to EU-2, fresh heartbeats arrive, and health resumes.', [
      'Sites flush their spools to <b>EU-2</b> as a bounded burst.',
      'Fresh heartbeats reset the timers; devices leave UNKNOWN.',
      'A device that is still silent now gets its own, real alert.']],
    ['a-stor', 'Redis is rebuilt from the log; ClickHouse replicas keep history.', [
      'Redis live state is <b>rebuilt from the event log</b>, not copied across.',
      'ClickHouse <b>replicas</b> in EU-2 keep history available for dashboards.',
      'Replayed writes carry stable event IDs, so history does not double count.']],
    ['a-obsp', 'RPO and RTO are targets to define and rehearse.', [
      '<b>RPO</b>: how much data can be lost, set by the replication-lag window.',
      '<b>RTO</b>: how long until EU-2 is serving fresh data again.',
      'We do not assume them: they are <b>measured in rehearsals</b>, region by region.',
      'Trade-off: a warm standby costs <b>capacity that sits mostly idle</b>.']],
    ['a-reg', 'Fail back to EU-1 as a planned, drained move.', [
      'When EU-1 is healthy, it catches up from EU-2 first.',
      'Fail-back is <b>planned and drained</b>, never during an open incident storm.',
      'The same rules apply: in-zone, same identities, rehearsed.']]
  ],
  recap: { h: 'A region outage is an observer failure first.', b: [
    '<b>Buffer</b>: site spools hold data while the region is gone.',
    '<b>UNKNOWN, not DEAD</b>: one page about the region, no device storm.',
    '<b>Fail over in-zone</b>: replicated topics, checkpoints and workflow history.',
    '<b>Same incident IDs</b>: no duplicate tickets after the move.',
    '<b>Rehearse</b>: RPO and RTO are measured, then fail back as a planned move.'] }
}, {
  1: { steps: [   // Regions close-up (REG_SVG)
    REG_ZONES,
    { h: 'EU-1, Acme\'s home cell, goes dark.', hl: [[38, 136, 190, 156]], at: [208, 272], lab: [[52, 250, 'EU-1 · down', '#DC2626']], b: [
      'The whole cell is unreachable in this example.'] },
    { h: 'EU-2 and the other zones are healthy.', hl: [[282, 136, 190, 156], [510, 100, 470, 248], [1000, 100, 500, 248]], at: [208, 272], b: [
      'The standby in the <b>same zone</b> is ready.',
      'Other tenants\' home regions keep running.'] }] },
  2: { steps: [   // tenant view (EDGE_SVG), then the small site
    { h: 'Every Acme site loses its cloud endpoint.', hl: [[40, 60, 400, 300], [460, 60, 400, 300]], at: [345, 268], b: [
      'All of Acme\'s sites point at EU-1, so all of them are affected.'] },
    { svg: 'small', h: 'Gateway A spools to disk.', hl: [[490, 60, 300, 180], [910, 240, 220, 132]], path: [[760, 212], [850, 212], [850, 300], [1100, 345]], lab: [[920, 338, 'spool · EU-1 down', '#B45309']], b: [
      'The spool is <b>bounded</b>, with alarms as it fills.',
      'Heartbeats keep being recorded <b>on site</b>.'] },
    { svg: 'small', h: 'It keeps retrying.', hl: [[910, 90, 220, 130]], at: [1100, 190], lab: [[922, 176, 'EU-1 · unreachable', '#DC2626']], b: [
      'Retries with backoff until the registry points somewhere healthy.'] }] },
  3: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'Ingress from EU-1 drops to zero.', hl: [[240, 190, 310, 140]], at: [530, 310], b: [
      'Gateway ingress for the region falls off a cliff.'] },
    { h: 'Freshness is unknown, not bad devices.', hl: [[570, 30, 310, 140]], path: [[530, 310], [560, 180], [860, 150]], b: [
      'Nothing is being processed, so device silence proves nothing.'] },
    { h: 'One page, about the region.', hl: [[900, 190, 310, 140]], path: [[860, 150], [890, 180], [1190, 310]], b: [
      'The monitor pages the <b>platform operators</b> once, about EU-1.'] }] },
  4: { steps: [   // Regions close-up (REG_SVG)
    { h: 'The decision: fail over, or wait?', hl: [[38, 136, 190, 156]], at: [208, 272], b: [
      'A human approves, or automation acts within <b>guardrails</b>.'] },
    { h: 'The target is the paired standby, EU-2.', hl: [[282, 136, 190, 156]], path: [[208, 272], [452, 272]], lab: [[296, 250, 'taking over', '#B45309']], b: [
      'Same zone, so <b>residency holds</b> during the outage.'] },
    { h: 'The registry records the move.', hl: [[380, 14, 760, 64]], path: [[452, 272], [452, 90], [1110, 60]], b: [
      'Routing for Acme now points at <b>EU-2</b>; the global layer has replicas everywhere.'] }] },
  5: { steps: [   // Cloud Gateway close-up (GW_SVG)
    { h: 'Acme\'s sites reconnect, now to EU-2.', hl: [[20, 46, 250, 54], [20, 116, 250, 54]], at: [240, 143], lab: [[34, 262, 'reconnect → EU-2', '#B45309']], b: [
      'DNS and the registry send Acme\'s gateways to <b>EU-2</b>.'] },
    { h: 'Same certificates, same tenant.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], path: [[240, 143], [318, 143], [495, 210], [740, 210]], lab: [[582, 196, 'acme · serving EU-2']], b: [
      'Identity does not change with the region.'] },
    { h: 'Quotas bound the reconnect burst.', hl: [[815, 30, 330, 226]], path: [[740, 210], [808, 143], [1115, 226]], b: [
      'Spools will flush soon; per-tenant quotas keep it bounded.'] }] },
  6: { steps: [   // Kafka close-up (KAFKA_SVG)
    { h: 'EU-2 already has the replicated topics.', hl: [[240, 14, 820, 306]], at: [789, 126], b: [
      'Topics were replicated continuously from EU-1, for example with <b>MirrorMaker 2</b>.'] },
    { h: 'Consumer offsets are translated.', hl: [[1110, 14, 370, 306]], path: [[789, 126], [866, 126], [1100, 126], [1440, 209]], b: [
      'Flink\'s readers resume at the <b>translated offsets</b> in EU-2\'s log.'] },
    { h: 'The unreplicated tail is the RPO.', hl: [[1110, 334, 370, 58]], at: [1450, 363], lab: [[1128, 324, 'replication-lag window', '#B45309']], b: [
      'Events that had not replicated before the outage are the <b>loss window</b>.'] }] },
  7: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'Restore from the last checkpoint.', hl: [[20, 360, 1010, 40]], at: [160, 100], b: [
      'Checkpoints live in <b>replicated object storage</b>, so EU-2 can restore them.'] },
    { h: 'Timers would all fire at once.', hl: [[736, 20, 300, 240]], path: [[160, 100], [226, 85], [382, 140], [438, 140], [664, 140], [730, 140], [1006, 230]], lab: [[750, 178, 'held · UNKNOWN', '#B45309']], b: [
      'After the gap, every device looks silent, so health is held at <b>UNKNOWN</b>.'] },
    { h: 'No DEAD pages until fresh again.', hl: [[1104, 20, 300, 56]], at: [1006, 230], b: [
      'UNKNOWN clears when freshness recovers; only then can a timer page.'] }] },
  8: { steps: [   // Action Execution close-up (ACT_SVG)
    { h: 'Workflow history is already in EU-2.', hl: [[880, 14, 390, 300]], at: [1240, 300], b: [
      'Temporal replicated the history, for example with <b>multi-cluster replication</b>.'] },
    { h: 'Same workflow ID, same incident.', hl: [[898, 52, 354, 28]], at: [1240, 300], b: [
      'The workflow ID is <b>tenant + device + outage generation</b>; it did not change.'] },
    { h: 'The ticket is upserted, not duplicated.', hl: [[1310, 24, 190, 130]], path: [[1240, 300], [1270, 90], [1306, 90], [1480, 138]], b: [
      'Idempotent by correlation ID, so ServiceNow keeps <b>one ticket</b>.'] }] },
  9: { steps: [   // small site (EDGE_D small)
    { svg: 'small', h: 'Spools flush to EU-2.', hl: [[490, 60, 300, 180], [910, 90, 220, 130]], path: [[760, 212], [790, 150], [904, 150], [1100, 190]], lab: [[922, 176, 'flush · EU-2', '#15803D']], b: [
      'The backlog arrives as a <b>bounded burst</b>.'] },
    { svg: 'small', h: 'Fresh heartbeats reset the timers.', hl: [[40, 60, 230, 260]], at: [250, 88], b: [
      'Live heartbeats, not spooled ones, bring devices out of UNKNOWN.'] },
    { svg: 'small', h: 'Still silent? Now it is real.', hl: [[1160, 14, 340, 392]], at: [250, 88], b: [
      'A device that stays silent after catch-up gets its own alert.'] }] },
  10: { steps: [   // Storage close-up (STOR_SVG)
    { h: 'Redis is rebuilt from the log.', hl: [[272, 20, 250, 82]], at: [500, 90], b: [
      'Live state is <b>derived</b>, so EU-2 rebuilds it instead of copying it.'] },
    { h: 'ClickHouse replicas keep history.', hl: [[272, 112, 250, 82], [272, 204, 250, 82]], at: [500, 260], b: [
      'History stays queryable from the <b>EU-2 replicas</b>.'] },
    { h: 'Replays do not double count.', hl: [[830, 20, 300, 450]], path: [[500, 260], [800, 215], [1100, 215]], b: [
      'Stable event IDs and versions deduplicate replayed writes.'] }] },
  11: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'RPO: the replication-lag window.', hl: [[240, 30, 310, 140]], at: [530, 150], b: [
      'Replication lag is monitored like consumer lag; it <b>is</b> the possible loss.'] },
    { h: 'RTO: time until fresh data again.', hl: [[570, 30, 310, 140]], path: [[530, 150], [860, 150]], b: [
      'Measured from the outage to <b>freshness recovered</b> in EU-2.'] },
    { h: 'Both are rehearsed, region by region.', hl: [[1250, 30, 250, 300], [240, 346, 1260, 50]], path: [[860, 150], [1230, 150], [1480, 310]], b: [
      'Failover drills prove the targets; a warm standby is the <b>price</b>.'] }] },
  12: { steps: [   // Regions close-up (REG_SVG)
    { h: 'EU-1 recovers and catches up from EU-2.', hl: [[38, 136, 190, 156], [282, 136, 190, 156]], at: [452, 272], b: [
      'Replication runs in reverse until EU-1 is current.'] },
    { h: 'A planned, drained cutover home.', hl: [[38, 136, 190, 156]], path: [[452, 272], [208, 272]], lab: [[52, 250, 'EU-1 · home again', '#15803D']], b: [
      'Fail-back is scheduled and drained, <b>never mid-incident</b>.'] },
    { h: 'The same rules, every time.', hl: [[20, 362, 1480, 50]], at: [1470, 388], b: [
      'In-zone, same identities, rehearsed.'] }] }
});
}
