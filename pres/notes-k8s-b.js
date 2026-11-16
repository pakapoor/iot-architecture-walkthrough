// Kubernetes flows 30 · Kafka & Flink on Kubernetes and 31 · EKS vs ECS (Kubernetes & platform).
// Each flow owns its stops (FLOWDEF, see pres/timeline2p.js) and its notes (registerFlow, see pres/notes.js).
// Inside views use the close-up SVG coordinates in tools/svgs.py: K8S, XD 'ops' / 'ecs', KAFKA, FLINK, ING, REG, OBS.
// Panel blocks: 'WHAT: ' plain-English concept · 'TRADE: ' highlighted trade-off · 'ASK: question | answer' follow-up.
{
// main-diagram corridors (arch px): x 1130 runs between the Kafka/Storage and Flink/Action columns; y 425 between rows; y 870 above the platform row
const UP = [[1130, 870], [1130, 425]];

// ---------- 30 · Kafka & Flink on Kubernetes ----------
FLOWDEF[30] = h => {
  const { st, blu, vio, grn, org } = h;
  st('a', 'a-k8s', 'tr', 'deep', 'b', 'Kafka and Flink keep <b>state</b> · can they live on a platform built for replaceable pods?', S => { S.aBadge = ['📦 stateful workloads on EKS', ...blu]; });
  st('a', 'a-kafka', 'br', 'deep', 'o', 'Strimzi: the Kafka cluster is a <b>YAML resource in Git</b> · an operator makes it real and keeps it that way', S => { S.aBadge = ['⇶ Kafka resource → Strimzi', ...org]; }, { via: UP });
  st('a', 'a-kafka', 'br', 'deep', 'o', 'StatefulSet + disks: <b>broker-0, 1, 2</b> keep their name and their own volume · replicas spread over 3 AZs', null, { stay: true });
  st('a', 'a-kafka', 'br', 'deep', 'o', 'Rolling upgrade: one broker at a time · the next waits until every partition is back in sync · PDB: max 1 down', S => { S.aBadge = ['↻ rolling · 1 broker at a time', ...org]; }, { stay: true });
  st('a', 'a-flink', 'br', 'deep', 'v', 'Flink Kubernetes Operator: a <b>FlinkDeployment</b> → JobManager (HA) + TaskManagers', S => { S.chip = ['🧠 FlinkDeployment · operator-managed', ...vio]; });
  st('a', 'a-flink', 'br', 'deep', 'v', 'Checkpoints and savepoints go to <b>S3</b>, not to the pod · a lost pod loses no state', S => { S.chip = ['💾 checkpoints → S3', ...vio]; }, { stay: true });
  st('a', 'a-flink', 'br', 'deep', 'v', 'Job upgrade = <b>savepoint → new version → restore</b> · same state, same Kafka offsets', S => { S.chip = ['⤴ savepoint → v2 → restore', ...vio]; }, { stay: true });
  st('a', 'a-k8s', 'tr', 'deep', 'g', 'A node dies: pods are rescheduled · the broker re-attaches its disk in the same AZ · TaskManagers restore from S3', S => { S.chip = null; S.aBadge = ['♻ node lost · pods replaced', ...grn]; }, { via: [[1506, 425], [1130, 425], [1130, 870]] });
  st('a', 'a-k8s', 'tr', 'core', 'b', 'Argo CD syncs Kafka, topics and Flink jobs from Git · drift is corrected automatically', S => { S.aBadge = ['⟳ Git = the cluster', ...blu]; }, { stay: true });
  st('a', 'a-obsp', 'tl', 'deep', 'g', 'Datadog watches what operators cannot judge: <b>under-replicated partitions</b>, consumer lag, checkpoint age', S => { S.obsT = { 0: ['● 0 under-replicated', 0], 2: ['● checkpoint age OK', 0] }; }, { pt: h.obsPt(2), via: [[1040, 870], [700, 870]] });
  return { cap: 'Stateful on Kubernetes: operators · stable identity + disks · replicas across AZs · state in S3 · savepoint upgrades 📦', badge: ['✅ stateful, still replaceable', ...grn], boxes: ['a-k8s', 'a-kafka', 'a-flink', 'a-obsp'] };
};

const K = {   // K8S close-up regions
  stateless: [36, 92, 1048, 96], kafka: [36, 202, 1048, 96], flink: [36, 312, 1048, 96], system: [36, 422, 1048, 96],
  azA: [250, 56, 268, 476], azB: [532, 56, 268, 476], azC: [814, 56, 268, 476], loops: [1120, 14, 380, 300], guard: [1120, 330, 380, 216] };
const OPS = {   // XD 'ops' regions
  kres: [40, 58, 220, 96], strimzi: [306, 58, 200, 96], sts: [552, 58, 180, 96],
  b0: [40, 182, 212, 34], b1: [272, 182, 212, 34], b2: [504, 182, 212, 34], d0: [80, 226, 132, 70], d1: [312, 226, 132, 70], d2: [544, 226, 132, 70],
  rack: [36, 312, 700, 26], roll: [36, 340, 700, 46], pdb: [36, 394, 700, 26],
  fdep: [790, 58, 220, 96], fop: [1056, 58, 200, 96], jm: [790, 186, 330, 34], tm: [1140, 186, 340, 34], s3: [1000, 236, 280, 80],
  upg: [786, 328, 700, 26], dies: [786, 354, 700, 26], lives: [786, 380, 700, 26] };

registerFlow(30, {
  name: 'Kafka & Flink on Kubernetes',
  intro: { h: 'Kafka and Flink keep state. Can they run on Kubernetes?', b: [
    'Kubernetes was built for <b>replaceable</b> pods; Kafka brokers and Flink jobs hold data that must survive a restart.',
    'We run both on <b>EKS</b>, next to the stateless services, in every region.',
    'Watch for one idea: <b>operators</b> carry the expert knowledge, and state lives where a pod restart cannot lose it.'] },
  steps: [
    ['a-k8s', 'Kafka and Flink keep state. Can they live on Kubernetes?', [
      'WHAT: A <b>stateful</b> workload keeps data that must survive a restart. A stateless one can be killed and replaced at any time.',
      'The stateless services were easy. Kafka brokers and Flink jobs are the hard part.',
      'They get their <b>own node pools</b>, so a noisy stateless deploy cannot starve them.',
      'TRADE: One platform for everything, but we own running stateful systems on it. The alternative is managed Kafka and Flink (flow 31).']],
    ['a-kafka', 'Strimzi: the Kafka cluster is a resource in Git.', [
      'WHAT: An <b>operator</b> is a controller that knows how to run one system. It compares what Git asks for with what runs, and fixes the difference.',
      'We describe brokers, topics and users in a <b>Kafka</b> resource; <b>Strimzi</b> creates and maintains them.',
      'Scaling, config changes and certificates become a <b>commit</b>, not a runbook.',
      'ASK: Why not plain Deployments? | Brokers need stable names, their own disks and ordered restarts. Deployments give none of these.']],
    ['a-kafka', 'StatefulSet + disks: every broker keeps its name and its volume.', [
      'WHAT: A <b>StatefulSet</b> gives pods stable names (broker-0, 1, 2). A <b>PVC</b> is a claim on a disk that outlives the pod.',
      'Each broker has its own <b>EBS volume</b>; a restarted broker comes back with its data.',
      'Brokers are <b>rack-aware</b>: every partition has replicas in 3 AZs.',
      'TRADE: Cross-AZ replication costs network money and adds latency to every acknowledged write. We pay it to survive losing an AZ.']],
    ['a-kafka', 'Rolling upgrade: one broker at a time, never two.', [
      'Strimzi restarts brokers <b>one by one</b>; the next waits until every partition is fully in sync again.',
      'WHAT: A <b>PodDisruptionBudget</b> (PDB) limits how many pods can be down at once. Ours: max 1 broker.',
      'A node drain during the upgrade <b>waits</b> on the PDB instead of taking a second broker.',
      'TRADE: A cluster upgrade takes longer, e.g. hours, but partitions never lose their quorum.',
      'ASK: What if a broker never catches up? | The roll pauses and Datadog alerts. A human decides; nothing proceeds on a guess.']],
    ['a-flink', 'Flink Kubernetes Operator: a job is a resource too.', [
      'A <b>FlinkDeployment</b> says which jar, which version and how much parallelism.',
      'WHAT: The <b>JobManager</b> coordinates the job; <b>TaskManagers</b> do the work. HA keeps a standby JobManager ready.',
      'The operator deploys, upgrades and rescales the job for us.',
      'ASK: What if the JobManager dies? | The standby takes leadership and the job resumes from the last checkpoint.']],
    ['a-flink', 'Checkpoints and savepoints live in S3, not on the pod.', [
      'WHAT: A <b>checkpoint</b> is an automatic snapshot of all state and timers. A <b>savepoint</b> is one we take on purpose, before a change.',
      'Both go to <b>S3</b>, together with the Kafka offsets they match.',
      'So a TaskManager pod can die at any time: its state is not on it.',
      'TRADE: Restores read state back from S3, so a large state restores in minutes, not seconds.']],
    ['a-flink', 'Job upgrade = savepoint → new version → restore.', [
      'Take a savepoint of v1, start v2 from it: <b>same state, same offsets</b>.',
      'Operator IDs and state schema are compatibility-tested first; rollback is the same move in reverse (flow 25).',
      'TRADE: The job pauses briefly during the restart, so lag rises and then drains. A rolling update would mix two versions on one state.',
      'ASK: Why not a rolling update like a web service? | A Flink job is one consistent graph over shared state. Two versions at once would split it.']],
    ['a-k8s', 'A node dies; the pods are replaceable.', [
      'Kubernetes <b>reschedules</b> the lost pods; Karpenter adds a node if there is no room.',
      'The broker re-attaches its <b>EBS volume</b>; TaskManagers restore from the last checkpoint in S3.',
      'TRADE: An EBS volume is tied to one AZ, so a broker can only move within its AZ. That is why every partition has replicas in all 3.',
      'ASK: What if the whole AZ goes? | The other two AZs still hold replicas of every partition; flow 29 walks through it.']],
    ['a-k8s', 'Argo CD keeps the cluster equal to Git.', [
      'Kafka resources, topics and FlinkDeployments are all <b>in Git</b>, like every other service.',
      'Argo CD applies changes and <b>reverts drift</b>: a hand-edit in the cluster does not survive.',
      'The same repo deploys every region, including isolated China.',
      'TRADE: Every change, even an urgent topic tweak, goes through a commit and review. Slower in a crisis, but never undocumented.']],
    ['a-obsp', 'Datadog watches what the operators cannot judge.', [
      'Operators keep things <b>running</b>; they cannot tell whether the data is healthy.',
      'We alert on <b>under-replicated partitions</b>, consumer lag and completed-checkpoint age.',
      'A rolling upgrade or node loss shows up here first, as a short spike that drains.',
      'ASK: Which single Kafka alert matters most? | Under-replicated partitions: it means you are one failure away from losing writes.']]
  ],
  recap: { h: 'Stateful, and still replaceable.', b: [
    '<b>Operators</b> run Kafka (Strimzi) and Flink (Flink Operator) from resources in Git.',
    '<b>Stable identity + disks</b>: StatefulSets and PVCs; replicas across 3 AZs.',
    '<b>Safe changes</b>: one broker at a time under a PDB; savepoint → upgrade → restore for Flink.',
    '<b>State off the pod</b>: Kafka disks and S3 checkpoints, so a pod or a node can die.',
    'TRADE: We own running stateful systems: upgrades, disks and AZ-bound volumes are our job, not a vendor\'s.'] }
}, {
  1: { steps: [   // K8S close-up
    { h: 'One cluster per region; every workload has a pool.', hl: [K.stateless, K.kafka, K.flink, K.system], at: [1060, 140], b: [
      'Stateless services, Kafka, Flink and add-ons each run in their <b>own node pool</b>.'] },
    { h: 'Stateless pods: replace them freely.', hl: [K.stateless], path: [[1060, 140], [560, 140]], lab: [[600, 160, 'any pod can die', '#1D4ED8']], b: [
      'Gateway, ingestion and dashboards keep nothing that a restart can lose.'] },
    { h: 'Kafka and Flink keep state: these are the hard part.', hl: [K.kafka, K.flink], path: [[560, 140], [560, 250], [560, 360]], lab: [[680, 258, 'data on disk', '#B45309'], [680, 368, 'state + timers', '#5B3FD9']], b: [
      'Brokers hold the log; Flink holds per-device state and timers.',
      'TRADE: One platform for all of it, and we own running the stateful part.'] }] },
  2: { steps: [   // XD ops · Strimzi
    { svg: 'ops', h: 'The Kafka cluster is described in Git.', hl: [OPS.kres], at: [240, 136], b: [
      'Brokers, topics and users: one <b>Kafka</b> resource, reviewed like code.'] },
    { svg: 'ops', h: 'Strimzi watches it and makes it so.', hl: [OPS.kres, OPS.strimzi], path: [[240, 136], [300, 106], [480, 136]], lab: [[318, 160, 'desired vs actual', '#B45309']], b: [
      'WHAT: The operator loops forever: compare what Git asks for with what runs, fix the difference.'] },
    { svg: 'ops', h: 'It creates the StatefulSet.', hl: [OPS.strimzi, OPS.sts], path: [[480, 136], [546, 106], [710, 136]], b: [
      'A config change or a new broker is a <b>commit</b>; Strimzi rolls it out.'] }] },
  3: { steps: [   // XD ops · StatefulSet + PVC
    { svg: 'ops', h: 'Stable names: broker-0, 1, 2.', hl: [OPS.sts, OPS.b0, OPS.b1, OPS.b2], at: [710, 136], b: [
      'A restarted broker comes back as <b>the same broker</b>, with the same ID.'] },
    { svg: 'ops', h: 'Each broker owns its disk.', hl: [OPS.b0, OPS.d0, OPS.b1, OPS.d1, OPS.b2, OPS.d2], path: [[710, 136], [700, 199], [610, 270]], lab: [[460, 300, 'PVC outlives the pod', '#B45309']], b: [
      'WHAT: A <b>PVC</b> claims an EBS volume that survives pod restarts.'] },
    { svg: 'ops', h: 'Replicas sit in three AZs.', hl: [OPS.b0, OPS.b1, OPS.b2, OPS.rack], path: [[610, 270], [236, 199], [468, 199], [700, 199]], b: [
      'Every partition has a replica in each AZ: losing one AZ loses no data.',
      'TRADE: Cross-AZ traffic costs money and adds write latency.'] }] },
  4: { steps: [   // XD ops · rolling upgrade
    { svg: 'ops', h: 'broker-0 restarts first.', hl: [OPS.b0, OPS.roll], at: [236, 199], lab: [[40, 140, 'broker-0 · restarting', '#B45309']], b: [
      'One broker at a time; the other two keep serving.'] },
    { svg: 'ops', h: 'Wait until every partition is in sync again.', hl: [OPS.b0, OPS.b1, OPS.b2, OPS.roll], at: [236, 199], lab: [[272, 140, 'in sync ✓', '#15803D']], b: [
      'Only then does Strimzi move to broker-1.'] },
    { svg: 'ops', h: 'The PDB blocks a second broker going down.', hl: [OPS.pdb, OPS.b1], path: [[236, 199], [468, 199]], b: [
      'A node drain during the roll <b>waits</b>; it cannot take a second broker.',
      'TRADE: Slower upgrades, but quorum is never lost.'] }] },
  5: { steps: [   // XD ops · Flink operator
    { svg: 'ops', h: 'A FlinkDeployment describes the job.', hl: [OPS.fdep], at: [990, 136], b: [
      'Jar, version and parallelism, in Git.'] },
    { svg: 'ops', h: 'The operator deploys it.', hl: [OPS.fdep, OPS.fop], path: [[990, 136], [1050, 106], [1236, 136]], b: [
      'It also upgrades and rescales the job later.'] },
    { svg: 'ops', h: 'A JobManager with a standby, and TaskManagers.', hl: [OPS.jm, OPS.tm], path: [[1236, 136], [1156, 176], [1100, 203]], lab: [[800, 140, 'leader + standby', '#5B3FD9']], b: [
      'WHAT: JobManager = coordinator · TaskManagers = workers.'] }] },
  6: { steps: [   // XD ops · checkpoints to S3
    { svg: 'ops', h: 'Checkpoints are written to S3.', hl: [OPS.tm, OPS.s3], path: [[1300, 203], [1250, 220], [1250, 250]], lab: [[1024, 300, 'state + offsets', '#33465C']], b: [
      'Every checkpoint stores all keyed state, timers and the matching Kafka offsets.'] },
    { svg: 'ops', h: 'The pod holds nothing it cannot rebuild.', hl: [OPS.lives], at: [1250, 250], b: [
      'A TaskManager can die at any time; its state is in S3.'] },
    { svg: 'ops', h: 'A savepoint is a checkpoint we take on purpose.', hl: [OPS.s3, OPS.upg], at: [1140, 277], b: [
      'Taken before an upgrade or a rescale.',
      'TRADE: Large state restores in minutes, not seconds.'] }] },
  7: { steps: [   // FLINK close-up then ops: upgrade
    { svg: 'ops', h: 'Savepoint of v1.', hl: [OPS.s3, OPS.upg], at: [1140, 277], lab: [[1024, 240, 'savepoint · v1', '#5B3FD9']], b: [
      'State and offsets are frozen together.'] },
    { svg: 'ops', h: 'The operator starts v2 from that savepoint.', hl: [OPS.fop, OPS.jm, OPS.tm], path: [[1140, 277], [1156, 176], [1156, 136]], lab: [[1056, 20, 'v2 · restored', '#15803D']], b: [
      'Same state, same Kafka offsets: nothing lost, nothing doubled.'] },
    { svg: '', h: 'The job catches up on Kafka.', hl: [[20, 40, 170, 200], [736, 20, 300, 240]], path: [[160, 100], [380, 140], [900, 140]], b: [
      'A short lag spike drains; rollback is the same move in reverse.',
      'TRADE: A brief pause beats two versions on one state.'] }] },
  8: { steps: [   // K8S close-up · node loss
    { h: 'A node in AZ-b dies.', hl: [K.azB], at: [602, 249], lab: [[560, 180, 'node lost', '#DC2626']], b: [
      'broker-1 and two TaskManagers disappear with it.'] },
    { h: 'Pods are rescheduled; the broker re-attaches its disk.', hl: [K.azB, K.kafka], at: [602, 249], lab: [[700, 266, 'same AZ · same EBS', '#B45309']], b: [
      'TRADE: The EBS volume is AZ-bound, so broker-1 restarts in AZ-b only.'] },
    { h: 'TaskManagers restore from the last checkpoint.', hl: [K.flink, K.loops], path: [[602, 249], [602, 359], [1460, 290]], lab: [[1132, 280, 'Karpenter: new node', '#15803D']], b: [
      'Karpenter adds a node if there is no room left.'] }] },
  9: { steps: [   // K8S close-up · Argo CD
    { h: 'Argo CD runs in the system pool.', hl: [K.system], at: [290, 469], b: [
      'One of the few add-ons we run on purpose.'] },
    { h: 'Git is the source of truth.', hl: [K.loops, K.kafka, K.flink], path: [[290, 469], [1460, 290]], lab: [[1132, 250, 'Git → cluster', '#1D4ED8']], b: [
      'Kafka, topics and Flink jobs sync from the same repo as every service.'] },
    { h: 'Drift is reverted.', hl: [K.kafka, K.flink], path: [[1460, 290], [900, 250], [900, 360]], b: [
      'A hand-edit in the cluster does not survive the next sync.'] }] },
  10: { steps: [   // OBS close-up
    { h: 'Signals come from Kafka and Flink.', hl: [[20, 30, 190, 300]], at: [190, 160], b: [
      'Broker, consumer-group and checkpoint metrics flow into Datadog.'] },
    { h: 'Lag and checkpoint age.', hl: [[240, 30, 310, 140], [900, 30, 310, 140]], path: [[190, 160], [520, 140], [1180, 140]], lab: [[260, 186, 'under-replicated: 0', '#15803D']], b: [
      'Under-replicated partitions sit next to lag on the Kafka dashboard.'] },
    { h: 'A breach pages the pipeline owner.', hl: [[900, 190, 310, 140]], path: [[1180, 140], [1180, 300]], b: [
      'Operators fix pods; humans fix what operators cannot judge.'] }] }
});

// ---------- 31 · EKS vs ECS ----------
FLOWDEF[31] = h => {
  const { st, blu, vio, grn, org, gry } = h;
  st('a', 'a-ing', 'br', 'core', 'b', 'The stateless half: gateway, ingestion, dashboards, action workers · <b>any</b> container platform runs these', S => { S.aBadge = ['⚖ the platform decision', ...blu]; });
  st('a', 'a-kafka', 'br', 'deep', 'o', 'The stateful half: Kafka brokers and Flink jobs need stable identity, disks and careful upgrades', S => { S.aBadge = ['⇶ stateful: the deciding half', ...org]; });
  st('a', 'a-reg', 'tr', 'deep', 'v', 'Many regions, China isolated: the <b>same deployment</b> must work everywhere', S => { S.aBadge = ['🌐 same manifests, every region', ...vio]; }, { via: [[1130, 425], [1130, 870], [1300, 870]] });
  st('a', 'a-k8s', 'tr', 'deep', 'o', 'What ECS offers: AWS runs the control plane · Fargate removes nodes · simpler to learn and run', S => { S.aBadge = ['ECS: simpler, AWS-managed', ...gry]; });
  st('a', 'a-flink', 'br', 'deep', 'r', 'Where ECS falls short for us: no operators · lag-based scaling and stateful failover would be hand-built', S => { S.chip = ['✕ on ECS: hand-built failover + upgrades', ...h.red]; }, { via: [[1130, 870], [1130, 425], [1506, 425]] });
  st('a', 'a-k8s', 'tr', 'deep', 'g', 'Why EKS: operators for Kafka + Flink · KEDA, HPA, Karpenter · same manifests in every region', S => { S.chip = null; S.aBadge = ['✅ EKS chosen', ...grn]; }, { via: [[1506, 425], [1130, 425], [1130, 870]] });
  st('a', 'a-k8s', 'tr', 'deep', 'o', 'The cost we accepted, and how we contained it: upgrades, add-ons, skills · few add-ons, Argo CD, a rehearsed upgrade runbook', S => { S.aBadge = ['⚖ we run the platform', ...org]; }, { stay: true });
  st('a', 'a-kafka', 'br', 'deep', 'v', 'Also considered: managed Kafka + Flink · v2 ran on them · we moved to self-managed on Kubernetes', S => { S.aBadge = ['⚖ managed vs self-managed', ...vio]; }, { via: UP });
  st('a', 'a-ing', 'br', 'core', 'g', 'When ECS is the right call: a few stateless services, a small team, AWS only · not this workload', S => { S.aBadge = ['✅ chosen on purpose', ...grn]; });
  return { cap: 'EKS over ECS: operators for the stateful half · lag-based scaling · one deployment for every region · the price: we run the platform ⚖', badge: ['✅ one platform, chosen on purpose', ...grn], boxes: ['a-ing', 'a-kafka', 'a-flink', 'a-k8s', 'a-reg'] };
};

const ECS = {   // XD 'ecs' regions: a row i is y = 62 + 58 i
  row: i => [20, 62 + 58 * i, 1480, 52], eks: i => [140, 62 + 58 * i, 670, 52], ecs: i => [820, 62 + 58 * i, 680, 52],
  won: [20, 360, 730, 96], when: [770, 360, 730, 96], head: [20, 14, 1480, 40] };
const yRow = i => 88 + 58 * i;

registerFlow(31, {
  name: 'EKS vs ECS',
  intro: { h: 'EKS or ECS? The platform decision, and what it cost us.', b: [
    'Both run containers on AWS. <b>ECS</b> is simpler; <b>EKS</b> is Kubernetes.',
    'We walk the decision over the architecture: what each box needs from the platform.',
    'Watch the <b>trade-off</b> boxes: every reason for EKS has a price, and we say it out loud.'] },
  steps: [
    ['a-ing', 'The stateless half: any platform can run it.', [
      'Gateway, ingestion, dashboards and action workers keep <b>no state</b> in the pod.',
      'They scale out, die and come back freely; ECS or EKS would both be fine here.',
      'So the decision is made by the <b>other half</b>.']],
    ['a-kafka', 'The stateful half decides it.', [
      'Kafka brokers and Flink jobs need <b>stable identity</b>, their own disks and <b>ordered</b> upgrades.',
      'On Kubernetes, <b>operators</b> exist for both: Strimzi and the Flink Kubernetes Operator.',
      'ASK: Couldn\'t you just use managed Kafka and Flink? | We did, in v2. Step 8 covers why we moved.']],
    ['a-reg', 'Many regions, China isolated: one deployment model.', [
      'Every region, including isolated China, runs the <b>same stack</b> from the same Git repo.',
      'Kubernetes manifests run anywhere Kubernetes runs; ECS task definitions are AWS-only APIs.',
      'TRADE: Portability is insurance we may never cash in, and we pay for it in platform work every week.']],
    ['a-k8s', 'What ECS offers: less to run.', [
      'WHAT: <b>ECS</b> is AWS\'s own container scheduler. <b>Fargate</b> runs containers without you managing any servers.',
      'AWS runs the control plane; there are no cluster upgrades or add-ons to own.',
      'It is <b>simpler to learn</b>: a small team is productive in days.',
      'ASK: So why not ECS? | For the stateless half, it would be fine. The stateful half and multi-region decided it.']],
    ['a-flink', 'Where ECS falls short for us.', [
      'No operators: broker replacement, rolling restarts and Flink savepoint upgrades would be <b>our own code</b>.',
      'Scaling on <b>Kafka lag</b> and stateful failover would be hand-built too.',
      'TRADE: ECS saves platform work, then spends it again on bespoke tooling for Kafka and Flink, the riskiest part of the system.']],
    ['a-k8s', 'Why EKS: one platform, run by operators.', [
      '<b>Operators</b> run Kafka and Flink: upgrades, failover and scaling are written once, by experts.',
      '<b>KEDA</b> scales on Kafka lag, <b>HPA</b> on CPU, <b>Karpenter</b> adds nodes (flow 28).',
      'The <b>same manifests</b> deploy every region through Argo CD.',
      'ASK: Isn\'t Kubernetes overkill? | For three stateless services, yes. For stateful streaming in many regions, it removes more work than it adds.']],
    ['a-k8s', 'The cost we accepted, and how we contained it.', [
      'TRADE: We run the platform: <b>cluster upgrades</b>, add-ons and node images are our job.',
      'TRADE: The team needs <b>Kubernetes skills</b>; on-call must understand pods, nodes and operators.',
      'Contained: <b>few add-ons</b>, managed node groups + Karpenter, Argo CD for every change.',
      'Contained: cluster upgrades follow a <b>rehearsed runbook</b>, one region at a time, behind the same gates as a deploy.']],
    ['a-kafka', 'Also considered: managed Kafka and Flink.', [
      'Version 2 ran on <b>managed Kafka and managed Flink</b>; the current platform is self-managed on Kubernetes.',
      'Self-managed gives us control of versions and tuning, and <b>one deployment model</b> in every region, including China.',
      'TRADE: Managed services mean less to operate. We gave that up for control and consistency, and we pay in on-call and upgrade work.',
      'ASK: Would you choose that again? | For this scale and multi-region footprint, yes. For one region and a small team, managed is the better default.']],
    ['a-ing', 'When ECS is the right call.', [
      'A few <b>stateless</b> services, a small team, AWS only: <b>ECS + Fargate</b> is simpler, and I would pick it.',
      'Our workload is the opposite: stateful streaming, many regions, scaling on lag.',
      'The decision follows the <b>hardest</b> workload, not the most common one.']]
  ],
  recap: { h: 'One platform, chosen on purpose.', b: [
    '<b>Stateless half</b>: any platform works.',
    '<b>Stateful half</b>: operators for Kafka and Flink only exist on Kubernetes.',
    '<b>Every region</b>: the same manifests, deployed by Argo CD.',
    'TRADE: We run the platform ourselves, contained by few add-ons and a rehearsed upgrade runbook.',
    'TRADE: ECS + Fargate stays the right call for a small, stateless, AWS-only service.'] }
}, {
  1: { steps: [   // ING close-up
    { h: 'A stateless pool.', hl: [[255, 20, 560, 300]], at: [790, 60], b: [
      'Validate, unpack, route: nothing is kept in the pod.'] },
    { h: 'Any pod can die.', hl: [[630, 80, 168, 48]], at: [714, 104], lab: [[630, 190, 'replace freely', '#1D4ED8']], b: [
      'Scale out on CPU and lag; kill and replace at will.'] },
    { svg: 'ecs', h: 'Either platform runs this half.', hl: [ECS.head], at: [760, 34], b: [
      'ECS or EKS: no difference for stateless services.'] }] },
  2: { steps: [   // XD ecs · Kafka + Flink row
    { svg: 'ecs', h: 'Kafka + Flink: the deciding row.', hl: [ECS.row(0)], at: [90, yRow(0)], b: [
      'Stable identity, disks, ordered upgrades.'] },
    { svg: 'ecs', h: 'On EKS, operators run them.', hl: [ECS.eks(0)], path: [[90, yRow(0)], [560, yRow(0)]], lab: [[420, 120, 'Strimzi · Flink Operator', '#15803D']], b: [
      'Upgrades and failover are written once, by experts.'] },
    { svg: 'ecs', h: 'On ECS, we would build them.', hl: [ECS.ecs(0)], path: [[560, yRow(0)], [1200, yRow(0)]], b: [
      'Broker replacement and savepoint upgrades: our own code.'] }] },
  3: { steps: [   // REG close-up, then the portability row
    { h: 'Every zone runs the full stack.', hl: [[20, 100, 470, 248], [510, 100, 470, 248], [1000, 100, 500, 248]], at: [740, 300], b: [
      'EU, US and isolated China: one stack, one repo.'] },
    { svg: 'ecs', h: 'Portability.', hl: [ECS.row(2)], at: [90, yRow(2)], b: [
      'Same manifests in every region, beyond AWS.'] },
    { svg: 'ecs', h: 'ECS ties the deployment to AWS APIs.', hl: [ECS.ecs(2)], path: [[90, yRow(2)], [1200, yRow(2)]], b: [
      'TRADE: Portability is insurance we pay for every week.'] }] },
  4: { steps: [   // XD ecs · what ECS offers
    { svg: 'ecs', h: 'Who runs it: AWS, on ECS.', hl: [ECS.ecs(3)], at: [1200, yRow(3)], b: [
      'No control plane, no cluster upgrades to own.'] },
    { svg: 'ecs', h: 'Simpler to learn.', hl: [ECS.ecs(4)], path: [[1200, yRow(3)], [1200, yRow(4)]], b: [
      'A small team is productive in days.'] },
    { svg: 'ecs', h: 'Where ECS shines.', hl: [ECS.when], path: [[1200, yRow(4)], [1135, 408]], b: [
      'A few stateless services, AWS only: ECS + Fargate.'] }] },
  5: { steps: [   // XD ecs · ECS falls short
    { svg: 'ecs', h: 'No operators on ECS.', hl: [ECS.ecs(0)], at: [1200, yRow(0)], lab: [[1100, 120, 'build it ourselves', '#DC2626']], b: [
      'Broker replacement, rolling restarts, savepoint upgrades: bespoke.'] },
    { svg: 'ecs', h: 'Scaling on Kafka lag: hand-wired.', hl: [ECS.ecs(1)], path: [[1200, yRow(0)], [1200, yRow(1)]], b: [
      'CloudWatch metrics, custom glue for lag-based scaling.'] },
    { svg: '', h: 'The riskiest part, rebuilt by hand.', hl: [[736, 20, 300, 240]], at: [1006, 230], b: [
      'TRADE: Saved platform work comes back as tooling for Kafka and Flink.'] }] },
  6: { steps: [   // XD ecs · why EKS, then the K8S loops
    { svg: 'ecs', h: 'Why EKS won.', hl: [ECS.won], at: [385, 408], b: [
      'One platform for stateful + stateless, run by operators, the same in every region.'] },
    { svg: 'ecs', h: 'Scaling that understands Kafka.', hl: [ECS.eks(1)], path: [[385, 408], [560, yRow(1)]], b: [
      'KEDA on lag, HPA on CPU, Karpenter for nodes.'] },
    { svg: '', h: 'The control loops on the cluster.', hl: [[1120, 14, 380, 300]], at: [1460, 290], b: [
      'They run in every regional cluster, deployed by Argo CD.'] }] },
  7: { steps: [   // XD ecs · cost rows, then the K8S system pool
    { svg: 'ecs', h: 'Who runs it: we do.', hl: [ECS.eks(3)], at: [560, yRow(3)], lab: [[420, 178, 'our job: upgrades + add-ons', '#B45309']], b: [
      'TRADE: Cluster upgrades and add-ons are ours.'] },
    { svg: 'ecs', h: 'Kubernetes skills needed.', hl: [ECS.eks(4)], path: [[560, yRow(3)], [560, yRow(4)]], b: [
      'TRADE: On-call must understand pods, nodes and operators.'] },
    { svg: '', h: 'Contained: few add-ons, everything in Git.', hl: [[36, 422, 1048, 96], [1120, 330, 380, 216]], at: [290, 469], b: [
      'A small system pool, guardrails on every pod, a rehearsed upgrade runbook.'] }] },
  8: { steps: [   // KAFKA close-up, then XD ops
    { h: 'v2: managed Kafka and Flink.', hl: [[240, 14, 820, 306], [1110, 14, 370, 306]], at: [1050, 300], lab: [[258, 300, 'v2 · managed', '#56667C']], b: [
      'Less to operate, less control.'] },
    { svg: 'ops', h: 'Now: self-managed on Kubernetes.', hl: [[20, 14, 730, 420], [770, 14, 730, 420]], at: [760, 225], b: [
      'Operators give us control of versions and tuning, the same in every region.'] },
    { svg: 'ops', h: 'The price: we own it.', hl: [OPS.roll, OPS.upg], at: [760, 360], b: [
      'TRADE: Upgrades and on-call are ours, not a vendor\'s.'] }] },
  9: { steps: [   // XD ecs · when ECS is right
    { svg: 'ecs', h: 'When ECS is the right call.', hl: [ECS.when], at: [1135, 408], b: [
      'A few stateless services, a small team, AWS only.'] },
    { svg: 'ecs', h: 'Not this workload.', hl: [ECS.row(0), ECS.row(2)], path: [[1135, 408], [760, yRow(2)], [760, yRow(0)]], b: [
      'Stateful streaming and many regions push us to EKS.'] },
    { svg: 'ecs', h: 'The decision follows the hardest workload.', hl: [ECS.won], path: [[760, yRow(0)], [385, 408]], b: [
      'Chosen on purpose, with the price written down.'] }] }
});
}
