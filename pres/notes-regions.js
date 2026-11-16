// Presenter notes + stops: multi-region along the edge → ingestion path.
// 26 · Data residency (Correctness & trade-offs) and 27 · Region outage → failover (When things break).
// Stops are defined here with FLOWDEF (see timeline2p.js); notes and inside views with registerFlow (see pres/notes.js).
// Inside views use close-up SVG coordinates from tools/svgs.py: XD 'edgepath' (1520×590), EDGE (1520×620), GW (1520×590),
// REG, K8S, XD 'scale', KAFKA, FLINK, ACT, STOR, CTRL, OBS.
{
const RIGHT = [[1556, 425]];   // ball route up the right margin, between the platform row and the top row

// ---------- 26 · Data residency ----------
FLOWDEF[26] = h => {
  h.st('a', 'a-ctrl', 'tr', 'core', 'b', 'Onboarding: Acme gets home region <b>Frankfurt</b> · the global layer stores only tenant → home region', S => { S.aBadge = ['🌐 Acme · home region Frankfurt', ...h.blu]; });
  h.st('a', 'a-edge', 'br', 'core', 'b', 'Site ops activate a device · PKI issues a cert carrying <b>tenant + site + region</b>', null, { via: [[175, 430]] });
  h.st('a', 'a-edge', 'br', 'core', 'b', 'Filtering drops unknown devices · the edge pair holds an ordered endpoint list: <b>Frankfurt, then Ireland</b>', null, { stay: true });
  h.st('a', 'a-gw', 'br', 'deep', 'b', 'Tenant-pinned DNS: <b>acme.eu.ingest…</b> resolves to Frankfurt · never "the nearest region"');
  h.st('a', 'a-gw', 'br', 'deep', 'b', 'The Frankfurt gateway trusts only the EU issuing CA and admits only EU-homed tenants', null, { stay: true });
  h.st('a', 'a-gw', 'br', 'deep', 'r', 'A wrong-region gateway is <b>refused</b> and pointed home · nothing it sent is stored', S => { S.aBadge = ['🚫 US tenant at Frankfurt · refused', ...org]; }, { stay: true });
  h.st('a', 'a-ing', 'br', 'core', 'b', 'The Frankfurt load balancer spreads over <b>3 AZs</b> · ingestion validates, tags, publishes in Frankfurt', S => { S.aBadge = null; });
  h.st('a', 'a-flink', 'br', 'core', 'b', 'Kafka topics, Flink state, timers and incident IDs exist <b>only in Frankfurt</b>', null, { via: [[1030, 160]] });
  h.st('a', 'a-act', 'tr', 'core', 'b', 'Pages, Temporal workflows and ServiceNow tickets are raised from the home cell');
  h.st('a', 'a-stor', 'tr', 'core', 'b', 'Stores, backups and dashboards stay in the EU zone · platform views get <b>aggregates only</b>');
  h.st('a', 'a-reg', 'tr', 'deep', 'r', 'China is fully isolated: its own control plane copy, its own PKI, its own DR', S => { S.aBadge = ['🔒 China · isolated', ...red]; }, { via: [[1082, 860]] });
  h.st('a', 'a-reg', 'tr', 'deep', 'v', 'Residency by placement, not by filter · the cost: capacity per zone, planned tenant moves', S => { S.aBadge = ['🌐 residency by placement', ...h.vio]; }, { stay: true });
  return { cap: 'Residency by placement: home region in the cert · tenant-pinned DNS · region gateway refuses strangers · data stays in-zone 🌐', badge: ['✅ data stays in its zone', ...h.grn], boxes: ['a-ctrl', 'a-edge', 'a-gw', 'a-ing', 'a-flink', 'a-act', 'a-stor', 'a-reg'] };
};

registerFlow(26, {
  name: 'Data residency',
  intro: { h: 'One platform, many jurisdictions. Where does each tenant\'s data live?', b: [
    'Some tenants must keep their data <b>inside a legal region</b>: for example the EU, the US, or China.',
    'We follow <b>Acme Retail</b>, homed in Frankfurt, from onboarding a device to its dashboards.',
    'The hard part is the <b>edge → ingestion path</b>: how does a device reach the right region, and only that region?',
    'Watch for one idea: residency comes from <b>where data is placed</b>, not from a filter on a shared store.'] },
  steps: [
    ['a-ctrl', 'Onboarding gives Acme a home region.', [
      'WHAT: A <b>home region</b> is the one region that owns a tenant\'s devices, data and incidents.',
      'The platform admin onboards Acme with home region <b>Frankfurt</b>.',
      'The global layer stores <b>tenant → home region</b>, and nothing else.',
      'ASK: Is the global layer a single point of failure? | It has one writable primary and read replicas in every region, so routing keeps working if the primary is down.']],
    ['a-edge', 'Activating a device gives it a certificate that names its region.', [
      'WHAT: <b>PKI</b> is the system that issues and revokes certificates. A certificate proves who a device is.',
      'Site ops activate the device in the <b>Edge Dashboard</b>.',
      'The issuing CA signs a cert carrying <b>tenant + site + region</b>.',
      'ASK: Why put the region in the cert? | A gateway can check the home region at the handshake, with no cross-region lookup.']],
    ['a-edge', 'The site filters locally and knows where to send data.', [
      '<b>Filtering</b> drops devices that are not on the allow-list, and enforces quotas and device limits.',
      'The edge pair holds an <b>ordered endpoint list</b>: Frankfurt first, then Ireland, its same-zone standby.',
      'Both endpoints are in the EU zone, so even failover keeps data inside the border.']],
    ['a-gw', 'DNS is pinned to the tenant, never to the nearest region.', [
      'The gateway resolves <b>acme.eu.ingest…</b>, a name that always points at Acme\'s home cell.',
      'Latency-based DNS could send a device across a border on a bad day.',
      'TRADE: A device far from its home region pays extra latency. Residency beats a few milliseconds.']],
    ['a-gw', 'The Frankfurt gateway admits only EU-homed tenants.', [
      'WHAT: An <b>issuing CA</b> signs certificates for one region. One offline root CA signs every issuing CA.',
      'Frankfurt trusts only the <b>EU issuing CA</b>, and checks the region in the cert.',
      'Then the usual checks: tenant from the registry, per-tenant quotas.',
      'We rejected a <b>global front door</b> that ends TLS outside the region: the data would be decrypted across the border.']],
    ['a-gw', 'A gateway in the wrong region is refused, and nothing is stored.', [
      'A US tenant\'s gateway reaching Frankfurt fails the region check at the gateway.',
      'It is <b>pointed at its home endpoint</b>; no byte reaches Frankfurt\'s Kafka.',
      'ASK: Why not forward it to the right region? | Forwarding means Frankfurt has already decrypted it. Refusing keeps the border clean.']],
    ['a-ing', 'Inside Frankfurt, load is spread over three availability zones.', [
      'WHAT: An <b>availability zone</b> (AZ) is a separate data centre inside one region.',
      'The load balancer spreads gateways and ingest pods over <b>3 AZs</b>, sized N+1.',
      'Ingestion validates, tags the tenant and publishes to <b>Frankfurt\'s Kafka</b>.']],
    ['a-flink', 'Telemetry, state, timers and incident decisions stay in Frankfurt.', [
      'Acme\'s Kafka topics and Flink keyed state exist <b>only in Frankfurt</b>.',
      'Silence timers, the graded ladder and incident IDs run there.',
      'One owner per device keeps ordering and "one incident, one ticket" simple.']],
    ['a-act', 'Pages, workflows and tickets are raised from the home cell.', [
      'The Temporal incident workflow runs in <b>Frankfurt</b>.',
      'PagerDuty pages and ServiceNow tickets are sent from the home cell, with the same idempotent upsert.',
      'Integrations are tenant configuration, so they follow the tenant.']],
    ['a-stor', 'Every store and dashboard for Acme stays in the zone.', [
      'Redis, ClickHouse, MongoDB and the archive run in <b>Frankfurt</b>; replicas and backups stay in <b>Ireland</b>.',
      'Acme\'s admins are served by the Frankfurt dashboard service, with RBAC on every call.',
      'The platform admin\'s cross-region view shows <b>aggregates only</b>: health and counts.']],
    ['a-reg', 'China is fully isolated.', [
      'China runs its <b>own control plane copy</b>, its own issuing CA and its own standby.',
      'Nothing replicates out: no telemetry, no routing records.',
      'Deployed from the same Git repo by Argo CD, but run as a separate platform.']],
    ['a-reg', 'Residency comes from placement. Here is what it costs.', [
      'We rejected <b>one global cluster with per-row region tags</b>: a filter is not a border.',
      'Trade-off: every zone needs its own <b>capacity, standby and operations</b>.',
      'Trade-off: moving a tenant\'s home region is a <b>planned migration</b>, never a config flip.',
      'ASK: How do you move a tenant to another region? | Copy its data, drain its sites, switch the routing record and DNS, then delete the old copy. Planned and rehearsed.']]
  ],
  recap: { h: 'Residency by placement, not by filter.', b: [
    '<b>Home region in the cert</b>: tenant + site + region, signed by the region\'s issuing CA.',
    '<b>Tenant-pinned DNS</b>: never "nearest region".',
    '<b>Region gateway</b>: admits only its own tenants; strangers are refused, nothing stored.',
    '<b>Everything downstream stays in-zone</b>, and the global layer holds routing only.',
    'TRADE: Capacity in every zone, and tenant moves are planned migrations.'] }
}, {
  1: { steps: [   // Control plane close-up (CTRL_SVG 1560×470)
    { h: 'The platform admin onboards Acme.', hl: [[20, 14, 350, 330]], at: [330, 322], b: [
      'Onboarding tenants is a <b>platform admin</b> action.'] },
    { h: 'Acme → Frankfurt is recorded as routing metadata.', hl: [[36, 104, 330, 30]], at: [330, 322], lab: [[20, 392, 'acme → home region Frankfurt']], b: [
      'The global layer stores <b>tenant → home region</b>, nothing more.',
      'One writable primary, <b>read replicas</b> in every region.'] },
    { svg: 'edgepath', h: 'That record decides where Acme\'s sites connect.', hl: [[20, 14, 330, 420], [650, 14, 410, 420]], at: [330, 70], lab: [[40, 444, 'acme · home = Frankfurt', '#0F766E']], b: [
      'Every Acme site will be routed to <b>Frankfurt</b>.'] }] },
  2: { steps: [   // Edge close-up (EDGE_SVG 1520×620), onboarding row
    { h: 'Site ops activate a device in the Edge Dashboard.', hl: [[40, 466, 210, 118]], at: [225, 560], b: [
      'Connect, onboard, activate: one place for site ops.'] },
    { h: 'PKI issues its certificate.', hl: [[298, 466, 250, 118]], path: [[225, 560], [292, 525], [525, 560]], lab: [[310, 432, 'cert: acme · site-07 · EU', '#5B3FD9']], b: [
      'The cert carries <b>tenant + site + region</b>.',
      'It is short-lived and rotated by the edge agent.'] },
    { h: 'Activation pushes the allow-list to Filtering.', hl: [[858, 466, 300, 118]], path: [[525, 560], [525, 600], [1008, 600], [1008, 584]], b: [
      'The device is now known at the site, so Filtering lets it through.'] }] },
  3: { steps: [   // Edge close-up, then the edge path
    { h: 'Devices send to Filtering.', hl: [[620, 466, 190, 118], [858, 466, 300, 118]], path: [[715, 560], [852, 525], [1130, 560]], b: [
      'Unknown or excess traffic is <b>dropped at the site</b>, before the WAN.'] },
    { h: 'The edge pair batches and buffers.', hl: [[1206, 466, 280, 118]], path: [[1130, 560], [1200, 525], [1460, 560]], b: [
      'Active publishes; standby takes over if it fails.'] },
    { svg: 'edgepath', h: 'It holds an ordered endpoint list.', hl: [[40, 146, 290, 150]], at: [310, 270], lab: [[56, 300, 'Frankfurt, then Ireland', '#0F766E']], b: [
      '<b>Frankfurt</b> first, then <b>Ireland</b>, the same-zone standby.',
      'It switches only when told, never on a single failed request.'] }] },
  4: { steps: [   // edge path (XD edgepath)
    { svg: 'edgepath', h: 'The edge pair looks up its endpoint.', hl: [[40, 146, 290, 150], [380, 150, 240, 150]], path: [[310, 220], [376, 220], [600, 270]], b: [
      'One DNS name per tenant and zone: <b>acme.eu.ingest…</b>'] },
    { svg: 'edgepath', h: 'DNS answers with the home cell, Frankfurt.', hl: [[380, 150, 240, 150], [668, 58, 374, 84]], path: [[600, 270], [620, 200], [646, 200], [1020, 120]], lab: [[400, 116, 'tenant-pinned', '#5B3FD9']], b: [
      'Pinned to the tenant, <b>never to the nearest region</b>.'] },
    { svg: 'edgepath', h: 'Ireland is the standby, not a second answer.', hl: [[1080, 14, 410, 420]], at: [1020, 120], b: [
      'DNS points at Ireland only after a <b>failover decision</b>.'] }] },
  5: { steps: [   // Cloud Gateway close-up (GW_SVG 1520×590)
    { h: 'mTLS: the cert is checked at the handshake.', hl: [[325, 46, 200, 194]], at: [495, 210], b: [
      'The gateway terminates TLS <b>inside Frankfurt</b>.'] },
    { h: 'Frankfurt trusts only the EU issuing CA.', hl: [[20, 410, 560, 170], [325, 46, 200, 194]], path: [[495, 210], [425, 246], [425, 410], [540, 540]], lab: [[40, 370, 'EU issuing CA only', '#5B3FD9']], b: [
      'One offline root CA; an <b>issuing CA per region</b>.',
      'A revoked cert is refused at the handshake.'] },
    { h: 'Region check, then tenant and quotas.', hl: [[570, 46, 200, 194], [815, 30, 330, 226]], path: [[540, 540], [600, 300], [740, 210], [808, 143], [1115, 226]], lab: [[582, 250, 'acme · home Frankfurt ✓', '#15803D']], b: [
      'Region in the cert = Frankfurt ✓. Tenant from the registry. Quotas as usual.'] }] },
  6: { steps: [   // edge path (XD edgepath)
    { svg: 'edgepath', h: 'A US tenant\'s gateway reaches Frankfurt.', hl: [[20, 484, 600, 90], [668, 58, 374, 84]], at: [1020, 120], lab: [[668, 14, 'region in cert: US ✕', '#DC2626']], b: [
      'Misconfigured DNS, or an old endpoint list.'] },
    { svg: 'edgepath', h: 'Refused at the gateway; nothing stored.', hl: [[668, 58, 374, 84], [668, 330, 374, 84]], at: [1020, 120], lab: [[690, 300, 'no byte reaches Kafka', '#DC2626']], b: [
      'The region check fails before any data is accepted.'] },
    { svg: 'edgepath', h: 'It is pointed at its home endpoint.', hl: [[20, 484, 600, 90]], path: [[1020, 120], [640, 120], [600, 530]], b: [
      'The response names the <b>US home endpoint</b>; the gateway retries there.'] }] },
  7: { steps: [   // Ingestion close-up (ING_SVG 1520×400), then the edge path
    { h: 'Envelopes arrive from the Frankfurt gateway.', hl: [[20, 120, 180, 110]], at: [180, 210], b: [
      'The load balancer spreads them over pods in <b>3 AZs</b>.'] },
    { h: 'A stateless pool, sized N+1.', hl: [[255, 20, 560, 300]], path: [[180, 175], [248, 175], [440, 100]], lab: [[630, 190, 'pods in 3 AZs · N+1', '#33465C']], b: [
      'Losing an AZ is handled <b>inside the region</b>, with no failover.'] },
    { svg: 'edgepath', h: 'Ingestion publishes to Frankfurt\'s Kafka.', hl: [[668, 246, 374, 64], [668, 330, 374, 84]], path: [[1020, 190], [1020, 290], [1020, 400]], b: [
      'Validate, tag the tenant, publish keyed by <b>tenant + device</b>.'] }] },
  8: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'Acme\'s topics exist only in Frankfurt.', hl: [[20, 40, 170, 90], [20, 150, 170, 90]], at: [160, 100], b: [
      'Heartbeats and telemetry are written to <b>Frankfurt\'s Kafka</b>.'] },
    { h: 'Keyed state and timers live in the home cell.', hl: [[232, 40, 170, 200], [736, 20, 300, 240]], path: [[170, 85], [226, 85], [382, 140], [438, 140], [664, 140], [730, 140], [1006, 230]], lab: [[750, 178, 'acme:CAM-14 · Frankfurt']], b: [
      'Silence timers and the graded ladder run <b>in Frankfurt</b>.'] },
    { h: 'Checkpoints stay in the zone too.', hl: [[20, 360, 1010, 40]], at: [1006, 230], b: [
      'Checkpoints go to object storage replicated <b>inside the zone</b>, to Ireland.'] }] },
  9: { steps: [   // Action Execution close-up (ACT_SVG)
    { h: 'Incidents arrive from Frankfurt\'s Flink.', hl: [[20, 120, 150, 110]], at: [150, 210], b: [
      'The incident ID is <b>tenant + device + outage generation</b>.'] },
    { h: 'The workflow runs in the home cell.', hl: [[880, 14, 390, 300]], path: [[150, 160], [226, 160], [400, 165], [436, 169], [630, 169], [666, 169], [840, 169], [876, 169], [1240, 66]], b: [
      'Temporal runs in <b>Frankfurt</b>; its history is replicated in-zone.'] },
    { h: 'Pages and tickets are sent from Frankfurt.', hl: [[440, 24, 190, 82], [1310, 24, 190, 130]], path: [[1240, 66], [1270, 90], [1306, 90], [1480, 138]], b: [
      'PagerDuty and ServiceNow calls leave <b>from the home cell</b>.'] }] },
  10: { steps: [   // Storage close-up (STOR_SVG)
    { h: 'Every store for Acme is in Frankfurt.', hl: [[272, 20, 250, 82], [272, 112, 250, 82], [272, 204, 250, 82], [272, 388, 250, 82]], at: [500, 90], b: [
      'Redis, ClickHouse and MongoDB for Acme run <b>in Frankfurt</b>.'] },
    { h: 'The archive and backups follow the same rule.', hl: [[272, 296, 250, 82]], at: [500, 360], b: [
      'Archives and backups stay <b>in the EU zone</b>.'] },
    { h: 'Dashboards read in-region.', hl: [[830, 20, 300, 450]], path: [[500, 360], [800, 215], [1100, 215]], b: [
      'The dashboard service reads the <b>Frankfurt</b> stores only; platform views get aggregates.'] }] },
  11: { steps: [   // Regions close-up (REG_SVG)
    { h: 'China runs as a separate platform.', hl: [[1000, 100, 500, 248]], at: [1218, 272], b: [
      'A home cell <b>and</b> a standby, both in China.'] },
    { h: 'Its own control plane copy; nothing replicates out.', hl: [[1018, 136, 464, 44]], at: [1218, 272], b: [
      'No tenant data and no routing records leave China.'] },
    { h: 'Same Git repo, separate operation.', hl: [[1018, 192, 220, 100], [1262, 192, 220, 100]], path: [[1218, 272], [1462, 272]], b: [
      'Argo CD deploys it from the same repo; <b>DR stays in China</b>.'] }] },
  12: { steps: [   // Regions close-up, then the edge path
    { h: 'Rejected: one global cluster with region tags.', hl: [[380, 14, 760, 64]], at: [1110, 60], b: [
      'A per-row region tag is a <b>filter</b>, not a border.'] },
    { svg: 'edgepath', h: 'Rejected: a global front door ending TLS.', hl: [[380, 150, 240, 150], [668, 58, 374, 84]], at: [1020, 120], b: [
      'TLS ends <b>inside the home region</b>, so data is never decrypted across a border.'] },
    { svg: '', h: 'Each zone costs its own capacity.', hl: [[20, 100, 470, 248], [510, 100, 470, 248]], at: [452, 272], b: [
      'TRADE: Every zone needs its own cells, standby and operations.'] }] }
});

// ---------- 27 · Region outage → failover ----------
FLOWDEF[27] = h => {
  h.st('a', 'a-reg', 'tr', 'core', 'r', 'Acme\'s home region <b>Frankfurt</b> goes dark', S => { S.aBadge = ['🌩 Frankfurt · region outage', ...h.red]; });
  h.st('a', 'a-edge', 'br', 'core', 'r', 'Edge pairs fail their health checks · they <b>spool to disk</b> and keep retrying Frankfurt, without flapping', null, { via: RIGHT.concat([[175, 425]]) });
  h.st('a', 'a-obsp', 'tl', 'deep', 'r', 'Region monitors page once, about <b>the region</b> · devices show UNKNOWN, not DEAD', S => { S.obsT = { 1: ['▲ Frankfurt unreachable', 1], 3: ['▼ Frankfurt ingress 0', 1] }; }, { pt: h.obsPt(3) });
  h.st('a', 'a-reg', 'tr', 'deep', 'o', 'Failover decision: human-approved, or automated with guardrails · target the same-zone standby <b>Ireland</b>', S => { S.aBadge = ['↪ failover → Ireland', ...h.org]; });
  h.st('a', 'a-gw', 'br', 'core', 'o', 'DNS and the endpoint list move Acme to Ireland · same certs, same tenant identity', null, { via: RIGHT });
  h.st('a', 'a-k8s', 'tr', 'deep', 'o', 'Ireland scales up: HPA + KEDA add pods, Karpenter adds nodes · quotas bound the spool burst', null, { via: [[570, 425], [570, 870]] });
  h.st('a', 'a-kafka', 'br', 'deep', 'o', 'Ireland already holds the replicated topics (MirrorMaker 2) · consumer offsets are translated', S => { S.chip = null; }, { via: RIGHT.concat([[1082, 425]]) });
  h.st('a', 'a-flink', 'br', 'deep', 'o', 'Flink restores the checkpoint from replicated S3 · devices stay <b>UNKNOWN</b> until caught up', S => { S.chip = ['❔ UNKNOWN · catching up', ...h.yel]; });
  h.st('a', 'a-act', 'tr', 'deep', 'o', 'Temporal history is replicated · open incidents continue with the <b>same incident IDs</b>');
  h.st('a', 'a-edge', 'br', 'core', 'g', 'Spools flush to Ireland · Flink dedup absorbs replays · fresh heartbeats clear UNKNOWN', S => { S.chip = null; S.aBadge = ['✅ serving from Ireland', ...h.grn]; }, { via: [[1082, 425], [175, 425]] });
  h.st('a', 'a-obsp', 'tl', 'deep', 'v', '<b>RPO</b> = the replication-lag window · <b>RTO</b> = time to serve fresh data again · define both, rehearse both', S => { S.obsT = { 1: ['✓ freshness recovered', 0], 3: ['Ireland serving', 0] }; }, { pt: h.obsPt(1) });
  h.st('a', 'a-reg', 'tr', 'deep', 'g', 'Fail back to Frankfurt as a planned, drained move · never mid-incident', S => { S.aBadge = ['✅ back home · Frankfurt', ...h.grn]; });
  return { cap: 'Region lost → spools buffer → UNKNOWN, not DEAD → DNS moves sites in-zone → Ireland scales → same incident IDs → planned fail-back 🌩', badge: ['✅ no page storm · no duplicate tickets', ...h.grn], boxes: ['a-reg', 'a-edge', 'a-gw', 'a-k8s', 'a-kafka', 'a-flink', 'a-act', 'a-obsp'] };
};

registerFlow(27, {
  name: 'Region outage → failover',
  intro: { h: 'A whole region goes dark. Do a million devices page on-call?', b: [
    'Each home region has a <b>paired standby</b> in the same residency zone.',
    'We follow Acme\'s home region, <b>Frankfurt</b>, through an outage, a failover to <b>Ireland</b>, and the way back.',
    'The interesting part is the <b>edge → ingestion path</b>: how do thousands of sites move, safely?',
    'Watch for three things: UNKNOWN instead of DEAD, the same incident IDs, and <b>rehearsed</b> RPO and RTO.'] },
  steps: [
    ['a-reg', 'Acme\'s home region, Frankfurt, goes dark.', [
      'The <b>whole Frankfurt cell</b> is unreachable: gateway, ingestion, Kafka, Flink, Temporal, stores.',
      'The paired standby <b>Ireland</b>, in the same EU zone, is healthy.',
      'Other zones, and China, are unaffected.']],
    ['a-edge', 'Edge pairs cannot reach Frankfurt, so they spool and keep retrying.', [
      'Health checks to Frankfurt fail. Every Acme site <b>spools to disk</b>, bounded and alarmed.',
      'They keep retrying <b>Frankfurt</b>. They do not jump to Ireland on their own.',
      'TRADE: Sites wait for a decision instead of failing over alone. Slower, but no split brain and no flapping.']],
    ['a-obsp', 'One page about the region; devices show UNKNOWN.', [
      'Datadog sees <b>Frankfurt ingress at zero</b>. On-call gets <b>one page about the region</b>.',
      'The observer is down, so device silence proves nothing: devices show <b>UNKNOWN</b>, not DEAD.',
      'ASK: Why not page for each silent device? | The pipeline is the thing that failed. A million device pages would bury the real signal.']],
    ['a-reg', 'The failover decision targets the same-zone standby.', [
      'Failover is <b>human-approved</b>, or automated with guardrails such as a minimum outage time.',
      'The target is <b>Ireland</b>, so Acme\'s data stays in the EU zone.',
      'We rejected <b>active-active per device</b>: it would need cross-region agreement on every heartbeat.']],
    ['a-gw', 'DNS and the endpoint list move Acme\'s sites to Ireland.', [
      'The routing record and <b>tenant DNS</b> now point at Ireland; edge pairs move to entry 2 of their list.',
      'Same certificates, same tenant identity: Ireland trusts the same EU issuing CA.',
      'ASK: Do devices need new certificates? | No. The cert names the zone, not one region, so both EU regions accept it.']],
    ['a-k8s', 'Ireland scales up before the burst arrives.', [
      'WHAT: <b>KEDA</b> scales pods on a metric like Kafka lag; <b>Karpenter</b> adds nodes when pods have nowhere to run.',
      'HPA and KEDA add gateway, ingest and consumer pods; Karpenter adds nodes in a minute or two.',
      'Per-tenant quotas bound the <b>spool burst</b>, so Ireland is not flattened.',
      'TRADE: A warm standby costs capacity that sits mostly idle. Cheaper than an outage that waits for cold capacity.']],
    ['a-kafka', 'Ireland already holds the replicated topics.', [
      'WHAT: <b>MirrorMaker 2</b> continuously copies Kafka topics from one cluster to another.',
      'Topics were replicated from Frankfurt; consumer offsets are <b>translated</b> to Ireland\'s log.',
      'What had not replicated yet is the <b>replication-lag window</b>: the RPO.']],
    ['a-flink', 'Flink restores the last checkpoint; devices stay UNKNOWN until caught up.', [
      'Flink starts in Ireland from the last checkpoint in <b>replicated S3</b>.',
      'After the gap every timer would fire at once, so health is held at <b>UNKNOWN</b>.',
      'UNKNOWN clears only when the pipeline is <b>fresh</b> again. No page storm.']],
    ['a-act', 'Temporal history is replicated, so open incidents simply continue.', [
      'Open workflows resume in Ireland with the <b>same incident IDs</b>: tenant + device + outage generation.',
      'The ServiceNow upsert is idempotent by that ID, so <b>no duplicate tickets</b>.']],
    ['a-edge', 'Spools flush to Ireland, and health resumes.', [
      'Sites flush their spools as a <b>bounded burst</b>.',
      'Some readings may already be in Ireland via replication; <b>Flink dedup</b> by event ID drops the copies.',
      'Fresh heartbeats clear UNKNOWN. A device still silent now gets a real alert.']],
    ['a-obsp', 'RPO and RTO are targets to define and rehearse.', [
      'WHAT: <b>RPO</b> is how much data you can lose. <b>RTO</b> is how long until you serve again.',
      'RPO = the replication-lag window. RTO = time until Ireland serves <b>fresh</b> data.',
      'We do not assume them: they are <b>measured in failover drills</b>, region by region.']],
    ['a-reg', 'Fail back to Frankfurt as a planned, drained move.', [
      'When Frankfurt is healthy, it catches up from Ireland first.',
      'Fail-back is <b>planned and drained</b>, never during an open incident storm.',
      'ASK: Why not fail back automatically? | Two moves in a row double the risk. A planned move picks a quiet time and can be stopped.']]
  ],
  recap: { h: 'A region outage is an observer failure first.', b: [
    '<b>Buffer at the edge</b>: spools hold data; sites wait for a decision.',
    '<b>UNKNOWN, not DEAD</b>: one page about the region, no device storm.',
    '<b>Move by DNS + endpoint list</b>, in-zone, same certs; Ireland scales on Kubernetes.',
    '<b>Same incident IDs</b>: replicated topics, checkpoints and workflow history.',
    'TRADE: A warm standby costs idle capacity; RPO and RTO are rehearsed, not assumed.'] }
}, {
  1: { steps: [   // Regions close-up (REG_SVG)
    { h: 'Each zone has a home cell and a standby.', hl: [[20, 100, 470, 248]], at: [208, 272], b: [
      'Frankfurt is Acme\'s home; Ireland is its paired standby.'] },
    { h: 'Frankfurt, Acme\'s home cell, goes dark.', hl: [[38, 136, 190, 156]], at: [208, 272], lab: [[52, 250, 'Frankfurt · down', '#DC2626']], b: [
      'The whole cell is unreachable.'] },
    { h: 'Ireland and the other zones are healthy.', hl: [[282, 136, 190, 156], [510, 100, 470, 248], [1000, 100, 500, 248]], at: [208, 272], b: [
      'The standby in the <b>same zone</b> is ready.'] }] },
  2: { steps: [   // edge path (XD edgepath)
    { svg: 'edgepath', h: 'Health checks to Frankfurt fail.', hl: [[40, 146, 290, 150], [650, 14, 410, 420]], at: [310, 220], lab: [[668, 444, 'Frankfurt · unreachable', '#DC2626']], b: [
      'Every Acme site sees the same thing.'] },
    { svg: 'edgepath', h: 'The edge pair spools to disk.', hl: [[40, 312, 290, 104]], path: [[310, 220], [310, 380]], lab: [[56, 278, 'spool · bounded · alarmed', '#B45309']], b: [
      'Heartbeats are recorded <b>on site</b>; the spool has alarms as it fills.'] },
    { svg: 'edgepath', h: 'It keeps retrying Frankfurt, and waits.', hl: [[40, 146, 290, 150]], at: [310, 380], b: [
      'Entry 2 of the list is used <b>only when told</b>. No flapping between regions.'] }] },
  3: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'Ingress from Frankfurt drops to zero.', hl: [[240, 190, 310, 140]], at: [530, 310], b: [
      'Gateway ingress for the region falls off a cliff.'] },
    { h: 'Freshness is unknown, not bad devices.', hl: [[570, 30, 310, 140]], path: [[530, 310], [560, 180], [860, 150]], b: [
      'Nothing is being processed, so device silence proves nothing.'] },
    { h: 'One page, about the region.', hl: [[900, 190, 310, 140]], path: [[860, 150], [890, 180], [1190, 310]], b: [
      'The monitor pages the <b>platform operators</b> once, about Frankfurt.'] }] },
  4: { steps: [   // Regions close-up (REG_SVG)
    { h: 'The decision: fail over, or wait?', hl: [[38, 136, 190, 156]], at: [208, 272], b: [
      'A human approves, or automation acts within <b>guardrails</b>.'] },
    { h: 'The target is the paired standby, Ireland.', hl: [[282, 136, 190, 156]], path: [[208, 272], [452, 272]], lab: [[296, 250, 'taking over', '#B45309']], b: [
      'Same zone, so <b>residency holds</b> during the outage.'] },
    { h: 'The routing record changes.', hl: [[380, 14, 760, 64]], path: [[452, 272], [452, 90], [1110, 60]], b: [
      'Acme → <b>Ireland</b>; the global layer has read replicas everywhere.'] }] },
  5: { steps: [   // edge path (XD edgepath)
    { svg: 'edgepath', h: 'Tenant DNS now answers Ireland.', hl: [[380, 150, 240, 150]], at: [600, 270], lab: [[400, 116, 'acme.eu → Ireland', '#B45309']], b: [
      'Same name, new answer. The edge pair also moves to <b>entry 2</b>.'] },
    { svg: 'edgepath', h: 'Sites reconnect to Ireland\'s gateway.', hl: [[1098, 58, 374, 84]], path: [[600, 270], [636, 260], [636, 448], [1286, 448], [1286, 142], [1450, 120]], b: [
      'The dashed path: DNS and the endpoint list move Acme together.'] },
    { svg: 'edgepath', h: 'Same certs, same tenant identity.', hl: [[1098, 58, 374, 84], [650, 484, 850, 90]], at: [1450, 120], lab: [[1098, 14, 'trusts the EU issuing CA ✓', '#15803D']], b: [
      'Both EU regions trust the <b>EU issuing CA</b>, so no re-enrolment.'] }] },
  6: { steps: [   // Kubernetes close-up (K8S_SVG), then scaling loops
    { h: 'Ireland runs the same EKS platform, warm.', hl: [[36, 92, 1048, 96]], at: [1060, 140], b: [
      'Same manifests from Git; fewer pods while it waits.'] },
    { h: 'HPA and KEDA add pods across 3 AZs.', hl: [[1120, 14, 380, 300], [36, 92, 1048, 96]], at: [1060, 140], lab: [[260, 196, 'gateway · ingest · consumers ↑', '#1D4ED8']], b: [
      'HPA on CPU for gateways and ingest; KEDA on Kafka lag for consumers.'] },
    { svg: 'scale', h: 'Karpenter adds nodes; quotas bound the burst.', hl: [[770, 48, 474, 124], [770, 196, 730, 150]], path: [[790, 110], [1240, 110]], b: [
      'New nodes take a minute or two, so Ireland keeps <b>headroom</b>.',
      'Per-tenant quotas cap the spool flush.'] }] },
  7: { steps: [   // Kafka close-up (KAFKA_SVG)
    { h: 'Ireland already has the replicated topics.', hl: [[240, 14, 820, 306]], at: [789, 126], b: [
      'Topics were replicated continuously from Frankfurt with <b>MirrorMaker 2</b>.'] },
    { h: 'Consumer offsets are translated.', hl: [[1110, 14, 370, 306]], path: [[789, 126], [866, 126], [1100, 126], [1440, 209]], b: [
      'Flink\'s readers resume at the <b>translated offsets</b> in Ireland\'s log.'] },
    { h: 'The unreplicated tail is the RPO.', hl: [[1110, 334, 370, 58]], at: [1450, 363], lab: [[1128, 300, 'replication-lag window', '#B45309']], b: [
      'Events not yet replicated before the outage are the <b>loss window</b>.'] }] },
  8: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'Restore from the last checkpoint.', hl: [[20, 360, 1010, 40]], at: [160, 100], b: [
      'Checkpoints live in <b>replicated S3</b>, so Ireland can restore them.'] },
    { h: 'Timers would all fire at once.', hl: [[736, 20, 300, 240]], path: [[160, 100], [226, 85], [382, 140], [438, 140], [664, 140], [730, 140], [1006, 230]], lab: [[750, 178, 'held · UNKNOWN', '#B45309']], b: [
      'After the gap, every device looks silent, so health is held at <b>UNKNOWN</b>.'] },
    { h: 'No DEAD pages until fresh again.', hl: [[1104, 20, 300, 56]], at: [1006, 230], b: [
      'UNKNOWN clears when freshness recovers; only then can a timer page.'] }] },
  9: { steps: [   // Action Execution close-up (ACT_SVG)
    { h: 'Workflow history is already in Ireland.', hl: [[880, 14, 390, 300]], at: [1240, 300], b: [
      'Temporal replicated the history to the standby.'] },
    { h: 'Same workflow ID, same incident.', hl: [[898, 52, 354, 28]], at: [1240, 300], b: [
      'The workflow ID is <b>tenant + device + outage generation</b>; it did not change.'] },
    { h: 'The ticket is upserted, not duplicated.', hl: [[1310, 24, 190, 130]], path: [[1240, 300], [1270, 90], [1306, 90], [1480, 138]], b: [
      'Idempotent by correlation ID, so ServiceNow keeps <b>one ticket</b>.'] }] },
  10: { steps: [   // edge path (XD edgepath)
    { svg: 'edgepath', h: 'Spools flush to Ireland.', hl: [[40, 312, 290, 104], [1098, 58, 374, 84]], path: [[310, 380], [636, 448], [1286, 448], [1286, 142], [1450, 120]], lab: [[56, 278, 'flush · bounded burst', '#15803D']], b: [
      'The backlog arrives through the same gateway checks and quotas.'] },
    { svg: 'edgepath', h: 'Duplicates are dropped.', hl: [[1098, 246, 374, 64], [1098, 330, 374, 84]], path: [[1450, 120], [1450, 290], [1450, 400]], lab: [[1098, 444, 'dedup by event ID', '#15803D']], b: [
      'A reading that arrived by replication <b>and</b> by spool is counted once.'] },
    { svg: 'edgepath', h: 'Fresh heartbeats clear UNKNOWN.', hl: [[1080, 14, 410, 420]], at: [1450, 400], b: [
      'A device still silent after catch-up gets its own, real alert.'] }] },
  11: { steps: [   // Datadog close-up (OBS_SVG)
    { h: 'RPO: the replication-lag window.', hl: [[240, 30, 310, 140]], at: [530, 150], b: [
      'Replication lag is monitored like consumer lag; it <b>is</b> the possible loss.'] },
    { h: 'RTO: time until fresh data again.', hl: [[570, 30, 310, 140]], path: [[530, 150], [860, 150]], b: [
      'Measured from the outage to <b>freshness recovered</b> in Ireland.'] },
    { h: 'Both are rehearsed, region by region.', hl: [[1250, 30, 250, 300], [240, 346, 1260, 50]], path: [[860, 150], [1230, 150], [1480, 310]], b: [
      'Failover drills prove the targets.'] }] },
  12: { steps: [   // Regions close-up (REG_SVG)
    { h: 'Frankfurt recovers and catches up from Ireland.', hl: [[38, 136, 190, 156], [282, 136, 190, 156]], at: [452, 272], b: [
      'Replication runs in reverse until Frankfurt is current.'] },
    { h: 'A planned, drained cutover home.', hl: [[38, 136, 190, 156]], path: [[452, 272], [208, 272]], lab: [[52, 250, 'Frankfurt · home again', '#15803D']], b: [
      'Fail-back is scheduled and drained, <b>never mid-incident</b>.'] },
    { h: 'The same rules, every time.', hl: [[20, 362, 1480, 50]], at: [1470, 388], b: [
      'In-zone, same identities, rehearsed.'] }] }
});
}
