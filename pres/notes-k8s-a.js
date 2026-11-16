// Kubernetes flows: 28 · Traffic spike scales out and 29 · Node / AZ dies.
// Stops: FLOWDEF[n] (see the hook in pres/timeline2p.js). Notes + inside views: registerFlow (see pres/notes.js).
// Inside views use close-up SVG coordinates from tools/svgs.py: K8S, GW, ING, KAFKA, FLINK, ACT, OBS, DASH, and XD 'scale' / 'ops'.
// Panel blocks: 'WHAT: ' plain-English definition · 'TRADE: ' the highlighted trade-off · 'ASK: question | answer'.
{
// ---------- 28 · Traffic spike scales out ----------
FLOWDEF[28] = h => {
  h.st('a', 'a-edge', 'br', 'core', 'o', 'Legitimate traffic doubles in ten minutes · e.g. 200K → 400K gateway envelopes/sec', S => { S.aBadge = ['📈 traffic × 2 · legitimate', ...h.org]; S.obsT = { 3: ['▲ 400K/s (e.g.)', 1] }; });
  h.st('a', 'a-gw', 'br', 'deep', 'b', 'Gateway pods run hot · <b>HPA</b> adds gateway pods on CPU · quotas still apply per tenant');
  h.st('a', 'a-ing', 'br', 'core', 'b', 'Ingestion is stateless · HPA adds pods · any pod can take any batch');
  h.st('a', 'a-kafka', 'br', 'deep', 'o', 'Kafka absorbs the burst · consumer lag starts to climb', S => { S.obsT = { 0: ['▲ lag rising', 1], 3: ['▲ 400K/s (e.g.)', 1] }; });
  h.st('a', 'a-k8s', 'tr', 'deep', 'b', '<b>KEDA</b> reads queue depth and lag · scales the queue consumers before CPU even moves', S => { S.aBadge = ['☸ KEDA · consumers scaling out', ...h.blu]; });
  h.st('a', 'a-k8s', 'tr', 'deep', 'y', 'New pods are <b>Pending</b>: no room on current nodes · <b>Karpenter</b> launches nodes in ~1–2 min', S => { S.aBadge = ['⏳ pods pending → Karpenter adds nodes', ...h.gry, '#B9C6D8']; }, { stay: true });
  h.st('a', 'a-flink', 'br', 'deep', 'v', 'Flink needs more parallelism · the <b>Flink Operator</b> takes a savepoint and restarts wider · partitions set the ceiling', S => { S.aBadge = null; S.chip = ['💾 savepoint → restart · parallelism 24 → 48 (e.g.)', ...h.vio]; });
  h.st('a', 'a-gw', 'br', 'core', 'y', 'Guard the edges: max replicas and per-tenant quotas cap the cost of a bad spike', S => { S.chip = null; S.aBadge = ['🚧 caps: max replicas · tenant quotas', ...h.yel]; }, { via: [[1150, 425], [560, 425]] });
  h.st('a', 'a-obsp', 'tl', 'deep', 'g', 'Datadog: lag drains · freshness p99 back under 2 min', S => { S.aBadge = null; S.obsT = { 0: ['▼ draining', 0], 1: ['● < 2 min', 0], 3: ['400K/s · absorbed', 0] }; }, { pt: h.obsPt(0) });
  h.st('a', 'a-k8s', 'tr', 'core', 'g', 'Scale back in slowly: a cooldown window · Karpenter consolidates empty nodes', S => { S.aBadge = ['✅ scaled out, then back in', ...h.grn]; S.obsT = {}; });
  return { cap: 'Traffic × 2 → HPA on CPU · KEDA on lag → Karpenter adds nodes → Flink rescales by savepoint → caps hold → drains → scales in 📈', badge: ['✅ absorbed, no data lost', ...h.grn], boxes: ['a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-obsp', 'a-k8s'] };
};

registerFlow(28, {
  name: 'Traffic spike scales out',
  intro: { h: 'Traffic doubles in ten minutes. Who adds the pods, and who adds the machines?', b: [
    'Real traffic, not a bug: e.g. a big tenant switches on thousands of sites.',
    'Three control loops respond, in order: <b>HPA</b>, <b>KEDA</b>, then <b>Karpenter</b>.',
    'Flink scales differently: by <b>savepoint and restart</b>.',
    'Watch for one idea: Kafka buys time while the platform grows.'] },
  steps: [
    ['a-edge', 'Real traffic doubles in ten minutes.', [
      'E.g. a big tenant switches on thousands of sites at once.',
      'Gateway envelopes go from about 200K to 400K per second.',
      'This is legitimate load. We must <b>grow</b>, not throttle.']],
    ['a-gw', 'Gateway pods get busy, and HPA adds more.', [
      'WHAT: <b>HPA</b> (Horizontal Pod Autoscaler) adds or removes pods to hold a target, e.g. 60% CPU.',
      'Gateway pods are stateless, so new pods take traffic at once.',
      'Per-tenant quotas still apply: growth never means "anything goes".',
      'ASK: Why CPU for the gateway? | Its work is TLS and checks: CPU tracks load closely.']],
    ['a-ing', 'Ingestion scales the same way.', [
      'Ingestion is a <b>stateless</b> pool: validate, unpack, publish.',
      'HPA adds pods on CPU. Any pod can handle any batch.',
      'TRADE: we keep <b>headroom</b> (e.g. 60% target CPU), so we pay for idle capacity on a normal day.']],
    ['a-kafka', 'Kafka absorbs the burst. Lag starts to climb.', [
      'Producers keep writing. Kafka stores everything durably.',
      'Consumers fall behind: <b>consumer lag</b> rises.',
      'WHAT: <b>consumer lag</b> = messages written but not yet processed.',
      'Lag is fine for a while. It is a <b>signal to scale</b>, not data loss.']],
    ['a-k8s', 'KEDA scales the consumers on lag.', [
      'WHAT: <b>KEDA</b> scales pods on an external signal: Kafka lag or SQS queue depth.',
      'It scales the queue-driven services, e.g. the action workers, before their CPU moves.',
      'TRADE: lag is a better signal than CPU for consumers, but one more component to run and tune.',
      'ASK: Why not CPU for consumers? | A consumer can be idle on CPU while its backlog grows.']],
    ['a-k8s', 'New pods are Pending. Karpenter adds nodes.', [
      'WHAT: a <b>Pending</b> pod is waiting for a node with enough room.',
      'WHAT: <b>Karpenter</b> sees Pending pods and launches right-sized nodes.',
      'New nodes take about <b>1–2 minutes</b>. Kafka holds the data meanwhile.',
      'TRADE: Karpenter is fast and right-sizes nodes, but spikes still outrun it: we keep spare node headroom.']],
    ['a-flink', 'Flink scales by savepoint and restart.', [
      'Flink keeps state per device, so it cannot just add pods.',
      'The <b>Flink Operator</b> takes a savepoint, then restarts with more TaskManagers.',
      'Source readers cannot exceed <b>Kafka partitions</b>: partitions set the ceiling.',
      'TRADE: each rescale <b>pauses</b> processing briefly, so we rescale rarely and keep headroom.',
      'ASK: Why not autoscale Flink every minute? | Each change is a restart. Flapping would cost more than it saves.']],
    ['a-gw', 'Guard the edges: caps stop a bad spike.', [
      'Every deployment has a <b>max replicas</b> limit.',
      'Per-tenant quotas cap one tenant, even if its traffic looks real.',
      'TRADE: a real spike above the cap gets throttled (429), and sites retry from their spool. We accept delay to protect everyone.']],
    ['a-obsp', 'Datadog shows the lag draining.', [
      'Consumer lag falls back to normal.',
      'Freshness p99 drops back <b>under 2 minutes</b>.',
      'No data lost: Kafka held it until we caught up.']],
    ['a-k8s', 'Scale back in, slowly.', [
      'HPA waits through a <b>cooldown window</b> before removing pods.',
      'Karpenter <b>consolidates</b>: it moves pods off and removes empty nodes.',
      'PodDisruptionBudgets keep enough replicas running during the move.',
      'TRADE: slow scale-in costs a little money, but stops pods flapping up and down.']]
  ],
  recap: { h: 'Kafka buys time. Three loops grow the platform.', b: [
    '<b>HPA</b>: CPU → more gateway and ingestion pods.',
    '<b>KEDA</b>: lag and queue depth → more consumers.',
    '<b>Karpenter</b>: Pending pods → new nodes in minutes.',
    '<b>Flink</b>: savepoint → restart wider, up to the partition count.',
    'TRADE: headroom and caps cost money and can delay a real spike. We pay that for predictability.'] }
}, {
  1: { steps: [   // Edge close-up (EDGE_SVG)
    { h: 'Thousands of sites start sending at once.', hl: [[40, 60, 400, 300], [460, 60, 400, 300]], at: [345, 268], lab: [[880, 30, 'e.g. +30K sites switched on']], b: [
      'Each site still sends <b>one batch stream</b> through its edge pair.'] },
    { h: 'All batches go to the Cloud Gateway.', hl: [[1080, 150, 200, 130]], path: [[345, 306], [345, 384], [1060, 384], [1060, 215], [1100, 215]], lab: [[1080, 300, '200K → 400K envelopes/sec']], b: [
      'The cloud sees envelopes per second <b>double</b>.'] }] },
  2: { steps: [   // Cloud Gateway close-up (GW_SVG)
    { h: 'The gateway pods run hot.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], at: [495, 210], lab: [[325, 250, 'CPU 85% · target 60%', '#B45309']], b: [
      'mTLS and tenant lookup cost CPU on every envelope.'] },
    { svg: 'scale', h: 'HPA adds gateway and ingestion pods.', hl: [[520, 48, 224, 124]], at: [700, 150], b: [
      'WHAT: HPA compares CPU to its target and changes the replica count.'] },
    { svg: '', h: 'Quotas still apply to every tenant.', hl: [[815, 30, 330, 226]], path: [[495, 210], [808, 143], [1115, 226]], b: [
      'Scaling adds capacity. Quotas still decide <b>who</b> may use it.'] }] },
  3: { steps: [   // Ingestion close-up (ING_SVG)
    { h: 'More batches arrive from the gateway.', hl: [[20, 120, 180, 110]], at: [180, 210], b: [
      'Each batch is tenant-tagged by the gateway.'] },
    { h: 'More pods join the stateless pool.', hl: [[630, 80, 168, 48]], at: [780, 110], lab: [[610, 190, '3 → 6 pods (e.g.)', '#1D4ED8']], b: [
      'No state in a pod: a new pod is useful immediately.'] },
    { h: 'Validate, unpack, publish, as before.', hl: [[275, 66, 330, 210]], path: [[200, 175], [248, 175], [440, 95], [440, 171], [440, 247]], b: [
      'The work per batch does not change. Only the <b>pod count</b> does.'] }] },
  4: { steps: [   // Kafka close-up (KAFKA_SVG)
    { h: 'Producers write twice as fast.', hl: [[240, 14, 820, 306]], at: [860, 130], lab: [[446, 268, 'new messages pile up →', '#B45309']], b: [
      'Kafka writes them durably to every partition.'] },
    { h: 'The consumer group falls behind.', hl: [[1110, 14, 370, 306]], path: [[860, 130], [1100, 130], [1300, 210]], lab: [[1128, 236, 'lag ▲ e.g. 2M msgs', '#B45309']], b: [
      'WHAT: lag = the gap between the newest offset and the consumer\'s offset.'] },
    { h: 'Retention keeps the backlog safe.', hl: [[1110, 334, 370, 58]], at: [1300, 362], b: [
      'Kafka keeps days of data. A few minutes of lag loses nothing.'] }] },
  5: { steps: [   // Kubernetes close-up (K8S_SVG; the card is sized by the first diagram), then the scaling chain
    { h: 'KEDA watches the lag.', hl: [[1120, 14, 380, 300]], at: [1470, 120], lab: [[1132, 250, 'lag > e.g. 50K for 1 min', '#B45309']], b: [
      'WHAT: KEDA feeds the lag to Kubernetes as a scaling metric.'] },
    { svg: 'scale', h: 'Lag crosses the threshold, KEDA scales out.', hl: [[20, 48, 224, 124], [270, 48, 224, 124]], path: [[200, 150], [244, 110], [270, 110], [450, 150]], b: [
      'It scales the consumers before their CPU even moves.'] },
    { svg: '', h: 'More consumers in every AZ.', hl: [[36, 92, 1048, 96]], at: [1060, 160], lab: [[260, 160, 'e.g. 3 → 9 consumer pods', '#1D4ED8']], b: [
      'New pods spread across all three AZs.'] }] },
  6: { steps: [   // Kubernetes close-up (K8S_SVG), then the scaling chain
    { svg: 'scale', h: 'Pods are Pending: no room on current nodes.', hl: [[770, 48, 224, 124]], at: [970, 150], b: [
      'The scheduler cannot place them yet.'] },
    { h: 'Karpenter launches new nodes.', hl: [[1020, 48, 224, 124]], path: [[970, 150], [994, 110], [1016, 110], [1220, 150]], lab: [[1020, 186, '~1–2 min', '#15803D']], b: [
      'It picks a node size that fits the Pending pods.'] },
    { h: 'Pods run. Headroom covers the gap.', hl: [[1270, 48, 224, 124], [770, 196, 730, 150]], at: [1470, 150], b: [
      'Spare capacity carries the spike for those first minutes.'] }] },
  7: { steps: [   // Flink close-up (FLINK_SVG), then the operators
    { h: 'Flink falls behind on keyed work.', hl: [[232, 40, 170, 200], [444, 30, 250, 220]], at: [670, 230], lab: [[444, 260, 'busy · backpressure', '#5B3FD9']], b: [
      'State per device means scaling is a <b>restart</b>, not just more pods.'] },
    { svg: 'ops', h: 'The operator takes a savepoint, then restarts wider.', hl: [[770, 14, 730, 420]], at: [1140, 277], lab: [[790, 236, 'parallelism 24 → 48', '#5B3FD9']], b: [
      'State goes to S3, then is restored into more TaskManagers.'] },
    { svg: 'scale', h: 'Partitions set the ceiling.', hl: [[20, 196, 730, 150]], at: [720, 320], b: [
      'TRADE: more partitions raise the ceiling, but moving keys later is hard. Size partitions for growth up front.'] }] },
  8: { steps: [   // Cloud Gateway close-up (GW_SVG), then the scaling chain
    { h: 'Per-tenant quotas cap one tenant.', hl: [[815, 30, 330, 226]], at: [1115, 226], b: [
      'One tenant cannot take all the new capacity.'] },
    { svg: 'scale', h: 'Max replicas cap the cost.', hl: [[770, 196, 730, 150]], at: [1470, 320], b: [
      'A runaway signal cannot scale us into a huge bill.'] }] },
  9: { steps: [   // Observability close-up (OBS_SVG)
    { h: 'Consumer lag falls.', hl: [[240, 30, 310, 140]], at: [530, 150], lab: [[254, 102, 'lag ▼ draining', '#15803D']], b: [
      'The bigger consumer group catches up.'] },
    { h: 'Freshness p99 recovers.', hl: [[570, 30, 310, 140]], path: [[530, 150], [860, 150]], lab: [[584, 102, 'p99 < 2 min', '#15803D']], b: [
      'Heartbeats are fresh again, so DEAD verdicts are trustworthy.'] },
    { h: 'Automation did the work.', hl: [[1250, 30, 250, 300]], path: [[860, 150], [1240, 180], [1470, 300]], b: [
      'No one was paged: the loops stayed inside their guardrails.'] }] },
  10: { steps: [   // Kubernetes close-up (K8S_SVG)
    { h: 'HPA waits, then removes pods.', hl: [[1120, 14, 380, 300]], at: [1470, 120], b: [
      'A cooldown window stops pods flapping up and down.'] },
    { h: 'Karpenter consolidates nodes.', hl: [[36, 92, 1048, 96]], at: [1060, 160], lab: [[260, 160, 'empty nodes removed', '#15803D']], b: [
      'Pods move off nearly-empty nodes, then those nodes go.'] },
    { h: 'Guardrails keep the move safe.', hl: [[1120, 330, 380, 216]], at: [1470, 520], b: [
      'Disruption budgets keep enough replicas running throughout.'] }] }
});

// ---------- 29 · Node / AZ dies ----------
FLOWDEF[29] = h => {
  h.st('a', 'a-k8s', 'tr', 'deep', 'r', 'AZ-b loses power · one third of the nodes go <b>NotReady</b>', S => { S.aBadge = ['⚡ AZ-b down · 1/3 of nodes', ...h.red]; });
  h.st('a', 'a-gw', 'br', 'core', 'o', 'Load balancer health checks drop AZ-b targets · traffic flows to AZ-a and AZ-c', S => { S.obsT = { 3: ['▼ dip, recovering', 1] }; });
  h.st('a', 'a-k8s', 'tr', 'deep', 'v', 'Stateless pods reschedule to AZ-a/c · replicas were already spread, and N+1 sizing absorbs the load', S => { S.aBadge = ['♻ pods rescheduled · AZ-a + AZ-c', ...h.vio]; });
  h.st('a', 'a-kafka', 'br', 'deep', 'o', 'Kafka: partition leaders move to in-sync replicas in AZ-a/c · acks=all, so no acknowledged write is lost', S => { S.aBadge = ['⚡ AZ-b down · running on AZ-a + AZ-c', ...h.org]; });
  h.st('a', 'a-flink', 'br', 'deep', 'r', 'Flink loses its TaskManagers in AZ-b · the job fails', S => { S.chip = ['💥 job failed · TaskManagers lost', ...h.red]; S.obsT = { 0: ['▲ lag rising', 1], 2: ['⟳ restoring', 1] }; });
  h.st('a', 'a-flink', 'br', 'deep', 'v', 'Restart from the last checkpoint in S3 · Kafka replays everything since', S => { S.chip = ['♻ restored from checkpoint · replaying', ...h.blu]; }, { stay: true });
  h.st('a', 'a-obsp', 'tl', 'deep', 'y', 'Freshness is behind · the gate shows delayed devices as <b>UNKNOWN</b>, not DEAD', S => { S.chip = ['❔ UNKNOWN · data delayed', ...h.gry, '#B9C6D8']; S.obsT = { 0: ['▲ catching up', 1], 1: ['▲ freshness > 2 min', 1], 2: ['● restored', 0] }; }, { pt: h.obsPt(1) });
  h.st('a', 'a-act', 'tr', 'deep', 'g', 'Replayed decisions reuse incident IDs · no duplicate pages, no duplicate tickets', S => { S.chip = null; });
  h.st('a', 'a-k8s', 'tr', 'deep', 'y', 'Karpenter replaces capacity in AZ-a/c · broker-1 waits: its disk lives in AZ-b', S => { S.aBadge = ['⏳ broker-1 waits for AZ-b · 2 of 3 replicas', ...h.yel]; S.obsT = { 0: ['● OK', 0], 1: ['● OK', 0] }; });
  h.st('a', 'a-kafka', 'br', 'core', 'g', 'AZ-b returns · broker-1 catches up · leaders rebalance back', S => { S.aBadge = ['✅ AZ-b back · 3 of 3 replicas', ...h.grn]; S.obsT = {}; });
  h.st('a', 'a-k8s', 'tr', 'core', 'g', 'Pods spread back over 3 AZs · disruption budgets keep every move safe');
  return { cap: 'AZ lost → health checks reroute → pods reschedule → Kafka replicas lead → Flink restores → UNKNOWN, not DEAD → no duplicates → AZ returns ⚡', badge: ['✅ lost a zone, lost nothing', ...h.grn], boxes: ['a-k8s', 'a-gw', 'a-kafka', 'a-flink', 'a-obsp', 'a-act'] };
};

registerFlow(29, {
  name: 'Node / AZ dies',
  intro: { h: 'A whole availability zone goes dark. What does Kubernetes do, and what must we design?', b: [
    'WHAT: an <b>availability zone</b> (AZ) is a separate data centre inside one region.',
    'Kubernetes reschedules pods for us. It cannot fix a design that put everything in one AZ.',
    'We follow the loss of <b>AZ-b</b> through every layer.',
    'Watch for one idea: <b>spread, replicate, and size for N+1</b>.'] },
  steps: [
    ['a-k8s', 'AZ-b loses power.', [
      'One third of the nodes go <b>NotReady</b>.',
      'Every pod on them is gone: gateway, ingestion, a Kafka broker, Flink TaskManagers.',
      'The other two AZs keep running.']],
    ['a-gw', 'The load balancer stops sending traffic to AZ-b.', [
      'Health checks fail for AZ-b targets within seconds.',
      'Traffic flows to the healthy pods in AZ-a and AZ-c.',
      'Sites see a brief blip. Their gateways retry, or spool if needed.']],
    ['a-k8s', 'Stateless pods reschedule to the surviving AZs.', [
      'WHAT: <b>anti-affinity</b> (topology spread) tells Kubernetes to put replicas in different AZs.',
      'So two thirds of every service was already running elsewhere.',
      'TRADE: <b>N+1 sizing</b> means each AZ runs at most ~2/3 full (e.g.), so we pay for spare capacity every day.',
      'ASK: Why not run everything in one AZ? | Cheaper and faster, but one power cut takes the whole region down.']],
    ['a-kafka', 'Kafka elects new leaders from in-sync replicas.', [
      'Every partition has <b>3 replicas</b>, one per AZ (rack-aware).',
      'WHAT: an <b>in-sync replica</b> has every acknowledged write.',
      'With <b>acks=all</b> and min.insync.replicas=2, a write is acknowledged only once 2 AZs have it.',
      'TRADE: acks=all adds write latency. We accept it: no acknowledged heartbeat is ever lost.']],
    ['a-flink', 'Flink loses TaskManagers. The job fails.', [
      'TaskManagers in AZ-b held part of the keyed state.',
      'Flink fails the whole job, by design: partial state is never trusted.',
      'Consumer lag starts to grow.']],
    ['a-flink', 'Flink restarts from the last checkpoint.', [
      'The JobManager runs in <b>HA</b> mode: a standby takes over if the leader was in AZ-b.',
      'State and timers are restored from the last checkpoint in <b>S3</b>, which spans AZs.',
      'Kafka replays everything since that checkpoint.',
      'TRADE: frequent checkpoints shorten the replay but cost I/O. E.g. every minute is a balance.']],
    ['a-obsp', 'Delayed devices show UNKNOWN, not DEAD.', [
      'Freshness p99 is above 2 minutes while Flink catches up.',
      'The gate holds DEAD verdicts: a timer firing on <b>delayed</b> data is not proof of a dead device.',
      'One page goes to the <b>platform owner</b>, not one per device.',
      'ASK: Why not page per device? | Thousands of false pages, and on-call would stop trusting them.']],
    ['a-act', 'Replayed decisions reuse their incident IDs.', [
      'The incident ID is <b>tenant + device + outage generation</b>.',
      'A replayed DEAD decision finds the existing incident.',
      'No duplicate pages. No duplicate tickets.']],
    ['a-k8s', 'Karpenter replaces lost capacity. Kafka waits.', [
      'Karpenter launches nodes in AZ-a and AZ-c for the stateless pods.',
      'broker-1 cannot move: its <b>EBS disk is tied to AZ-b</b>.',
      'Kafka keeps serving with 2 of 3 replicas, and we alarm on under-replication.',
      'TRADE: AZ-bound disks are fast and simple, but a broker must wait for its AZ, or be rebuilt and re-replicated.']],
    ['a-kafka', 'AZ-b returns. Kafka heals itself.', [
      'broker-1 starts, copies what it missed, and rejoins the in-sync set.',
      'Leaders move back to their preferred brokers, so load is even again.',
      'Under-replicated partitions go back to zero.']],
    ['a-k8s', 'Pods spread back over three AZs.', [
      'New pods land in AZ-b as the scheduler rebalances.',
      'WHAT: a <b>PodDisruptionBudget</b> limits how many replicas can be down during a planned move, e.g. 1 broker.',
      'We rehearse AZ loss in <b>game days</b>, so this is routine, not a surprise.']]
  ],
  recap: { h: 'Spread. Replicate. Size for N+1.', b: [
    '<b>Stateless</b>: replicas in every AZ · health checks reroute in seconds.',
    '<b>Kafka</b>: 3 replicas across AZs · acks=all · new leaders in seconds.',
    '<b>Flink</b>: HA JobManager · restore from S3 · replay from Kafka.',
    '<b>Correctness</b>: UNKNOWN, not DEAD · same incident IDs, no duplicates.',
    'TRADE: N+1 capacity and acks=all cost money and latency every day. That is the price of losing a zone without losing data.'] }
}, {
  1: { steps: [   // Kubernetes close-up (K8S_SVG)
    { h: 'AZ-b goes dark.', hl: [[532, 56, 268, 476]], at: [666, 300], lab: [[548, 88, 'AZ-b · nodes NotReady', '#DC2626']], b: [
      'Every pod in this column is gone at once.'] },
    { h: 'AZ-a and AZ-c keep running.', hl: [[250, 56, 268, 476], [814, 56, 268, 476]], at: [384, 300], b: [
      'Two thirds of every pool is still up.'] }] },
  2: { steps: [   // Cloud Gateway close-up (GW_SVG)
    { h: 'Health checks fail for AZ-b.', hl: [[914, 448, 280, 84]], at: [1054, 500], lab: [[914, 540, 'AZ-b · unhealthy', '#DC2626']], b: [
      'The load balancer marks those targets out.'] },
    { h: 'Traffic goes to AZ-a and AZ-c.', hl: [[618, 448, 280, 84], [1210, 448, 280, 84]], path: [[1265, 143], [1265, 380], [758, 380], [758, 500]], b: [
      'Sized N+1, so two AZs carry the load.'] }] },
  3: { steps: [   // Kubernetes close-up (K8S_SVG)
    { h: 'Replicas were already spread.', hl: [[36, 92, 1048, 96]], at: [384, 140], b: [
      'Anti-affinity put gateway, ingestion and dashboard pods in all three AZs.'] },
    { h: 'Replacements start in AZ-a and AZ-c.', hl: [[250, 92, 268, 96], [814, 92, 268, 96]], path: [[666, 140], [948, 140]], lab: [[260, 196 - 8, 'replacement pods scheduled', '#5B3FD9']], b: [
      'The scheduler places new pods where there is room.'] },
    { h: 'Guardrails made this safe.', hl: [[1120, 330, 380, 216]], at: [1470, 520], b: [
      'Requests, limits and probes keep a crowded node healthy.'] }] },
  4: { steps: [   // Kafka close-up (KAFKA_SVG), then the operators
    { svg: 'ops', h: 'broker-1 in AZ-b is gone.', hl: [[272, 182, 212, 34]], at: [378, 199], lab: [[260, 300, 'broker-1 · offline', '#DC2626']], b: [
      'Its partitions still have replicas on broker-0 and broker-2.'] },
    { h: 'New leaders come from in-sync replicas.', hl: [[40, 182, 212, 34], [504, 182, 212, 34]], path: [[378, 199], [146, 199]], lab: [[40, 140 + 120, 'leaders → AZ-a, AZ-c', '#15803D']], b: [
      'Producers and Flink reconnect to the new leaders.'] },
    { svg: '', h: 'acks=all: nothing acknowledged is lost.', hl: [[240, 14, 820, 306]], at: [860, 130], b: [
      'Every acknowledged write was already in at least 2 AZs.'] }] },
  5: { steps: [   // Flink close-up (FLINK_SVG)
    { h: 'TaskManagers in AZ-b die.', hl: [[20, 360, 1010, 40]], at: [520, 380], lab: [[444, 300, 'TaskManagers lost', '#DC2626']], b: [
      'Part of the keyed state was on those TaskManagers.'] },
    { h: 'The whole job fails, by design.', hl: [[232, 40, 170, 200], [444, 30, 250, 220], [736, 20, 300, 240]], at: [1006, 230], b: [
      'Partial state is never trusted. The job restarts as one unit.'] }] },
  6: { steps: [   // Flink close-up, then the operators
    { svg: 'ops', h: 'The standby JobManager takes over.', hl: [[790, 186, 330, 34]], at: [955, 203], b: [
      'HA mode: leader election picks the survivor.'] },
    { h: 'State comes back from the last checkpoint.', hl: [[1000, 240, 280, 74], [1140, 186, 340, 34]], path: [[955, 220], [955, 277], [1000, 277], [1250, 220]], lab: [[1000, 330, 'restore · S3 spans AZs', '#5B3FD9']], b: [
      'TaskManagers restart in AZ-a and AZ-c and load their state.'] },
    { svg: '', h: 'Kafka replays since the checkpoint.', hl: [[20, 40, 170, 90], [20, 150, 170, 90]], path: [[1006, 230], [160, 100]], b: [
      'Nothing is lost: Kafka kept every message.'] }] },
  7: { steps: [   // Observability close-up (OBS_SVG)
    { h: 'Freshness p99 is above 2 minutes.', hl: [[570, 30, 310, 140]], at: [860, 150], lab: [[584, 102, 'p99 > 2 min', '#B45309']], b: [
      'Heartbeats are delayed, not missing.'] },
    { h: 'One page, to the platform owner.', hl: [[900, 190, 310, 140]], path: [[860, 150], [1055, 180], [1190, 310]], b: [
      'Devices show UNKNOWN on dashboards until data is fresh.'] }] },
  8: { steps: [   // Action Execution close-up (ACT_SVG)
    { h: 'A replayed decision arrives.', hl: [[20, 120, 150, 110]], at: [150, 210], b: [
      'The same DEAD transition, decided again after the restore.'] },
    { h: 'Same workflow ID, same incident.', hl: [[898, 52, 354, 28]], path: [[150, 160], [226, 160], [400, 165], [630, 169], [840, 169], [1075, 66]], lab: [[898, 290, 'already exists → no-op', '#15803D']], b: [
      'The workflow already exists, so nothing new starts.'] },
    { h: 'ServiceNow sees no duplicate.', hl: [[1310, 24, 190, 130]], path: [[1075, 66], [1270, 90], [1480, 130]], b: [
      'The ticket upsert is idempotent by correlation ID.'] }] },
  9: { steps: [   // Kubernetes close-up (K8S_SVG)
    { h: 'Karpenter launches replacement nodes.', hl: [[250, 92, 268, 96], [814, 92, 268, 96]], at: [1060, 160], lab: [[260, 160, 'new nodes · AZ-a + AZ-c', '#15803D']], b: [
      'Stateless pods get their room back within minutes.'] },
    { h: 'broker-1 waits for AZ-b.', hl: [[532, 202, 268, 96]], at: [780, 250], lab: [[548, 280, 'disk tied to AZ-b', '#B45309']], b: [
      'Its EBS volume lives in AZ-b, so it cannot move.'] },
    { h: 'Kafka runs on 2 of 3 replicas.', hl: [[36, 202, 1048, 96]], at: [1060, 250], b: [
      'Still within min.insync.replicas=2: writes continue.'] }] },
  10: { steps: [   // Kafka close-up, then the operators
    { svg: 'ops', h: 'broker-1 comes back with its disk.', hl: [[272, 182, 212, 34], [312, 226, 132, 70]], at: [378, 199], b: [
      'It copies what it missed from the leaders.'] },
    { h: 'It rejoins the in-sync set.', hl: [[20, 14, 730, 420]], at: [700, 400], lab: [[40, 290, 'ISR · 3 of 3', '#15803D']], b: [
      'Preferred leaders move back, so the load is even again.'] }] },
  11: { steps: [   // Kubernetes close-up (K8S_SVG)
    { h: 'Pods land in AZ-b again.', hl: [[532, 56, 268, 476]], at: [666, 300], lab: [[548, 88, 'AZ-b · Ready', '#15803D']], b: [
      'The scheduler rebalances across all three AZs.'] },
    { h: 'Disruption budgets guard every move.', hl: [[1120, 14, 380, 300]], at: [1470, 260], b: [
      'E.g. at most 1 broker down at a time during drains.'] }] }
});
}
