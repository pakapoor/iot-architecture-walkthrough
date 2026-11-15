// Presenter notes: Device firmware (9) and the CI/CD flows (10–15). Format: see pres/notes.js (flow 1) and registerFlow().
(() => {
  // ---------- shared CI/CD steps (same stage in several pipelines) ----------
  const PR = (what) => ['c1', 'It starts as a pull request on Git, where code and config live together and a review is required.', [
    what,
    'Code and its <b>config</b> change in the same pull request.',
    'A <b>review is required</b> before anything merges.',
    'Git becomes the record of <b>who changed what, and when</b>.']];
  const UNIT = ['c2', 'CI builds and runs the unit tests in parallel, and fails fast.', [
    'Build and unit tests run as <b>parallel jobs</b>.',
    '<b>Fail fast</b>: a broken change stops here, before any slower stage runs.']];
  const SCAN = ['c5', 'A security scan checks the dependencies, the image and secrets.', [
    '<b>Dependencies</b>, the <b>container image</b> and <b>secrets</b> are all scanned.',
    'The stage passes only with <b>no critical findings</b>.']];
  const IMG = ['c6', 'The output is a signed, immutable image, tagged with the commit SHA and pushed to the registry.', [
    'The image is <b>signed</b> and <b>immutable</b>.',
    'Its tag is the <b>commit SHA</b>, so what runs traces back to exactly one commit.']];
  const GIT = ['d1', 'CD is GitOps: CI bumps the version in the deploy repo, and Git is the source of truth.', [
    'CI does not touch the cluster; it <b>commits a version bump</b> to the deploy repo.',
    'Every deploy is a commit, so Git answers <b>who changed production, when, and what is running</b>.',
    'Example tooling: <b>GitHub Actions + Argo CD + Helm</b>.',
    'Trade-off: two repos, code and deploy, to keep in step.']];
  const ARGO = ['d2', 'Argo CD sees the commit and syncs the cluster to match Git; nobody runs kubectl by hand.', [
    '<b>Argo CD</b> continuously syncs each cluster to match the deploy repo.',
    '<b>Nobody runs kubectl by hand</b>, and CI never pushes straight to a cluster.',
    'Rollback is the same Git operation: <b>revert the commit</b>, and Argo CD rolls back.',
    '<b>If it isn\'t in Git, it isn\'t in production.</b>']];
  const REGIONS = (id) => [id, 'Argo CD syncs the global cluster and the isolated China cluster from the same Git repo.', [
    'One deploy repo drives <b>both regions</b>: the global cluster and the isolated <b>China</b> cluster.',
    'Each region has its own <b>registry mirror</b> and its own <b>Datadog gate</b>.',
    'Why: China tenants run in an isolated region, for <b>data residency</b>.',
    'Trade-off: two regions to deploy and operate.']];

  // ---------- 9 · Device firmware ----------
  registerFlow(9, {
    name: 'Device firmware',
    intro: { h: 'New firmware for 1M cameras. Ship it to everyone at once? Never.', b: [
      'We follow camera firmware <b>4.3.0</b> from a 1% canary to a wave that fails its health gate.',
      'A bad firmware on 100M devices is a <b>fleet-wide outage</b>, so we limit the blast radius first.',
      'The rollout is measured by the platform\'s <b>own pipeline</b>: no special reporting channel.',
      'Watch for three things: <b>canary then waves</b>, a <b>baseline comparison</b>, and an <b>automatic halt</b> with rollback on the device.'] },
    steps: [
      ['a-ctrl', 'The platform admin starts a rollout: camera firmware 4.3.0, with a 1% canary as the first wave.', [
        'Rollouts are configured in the <b>control plane</b>, by the platform admin.',
        'The plan is <b>1% → 10% → 50% → 100%</b>, and every wave must pass its own health gate.',
        'Why: <b>limit the blast radius</b> before you know the release is safe.',
        'We rejected shipping to everyone at once, or rolling out by hand per tenant.',
        'Trade-off: a full rollout takes <b>days instead of hours</b>.']],
      ['a-edge', 'The canary is 1% of cameras, spread across tenants, sites and models, and the gateway agents download 4.3.0.', [
        'The 1% is <b>sampled across tenants, sites and device models</b>.',
        'Why: a canary of one site can <b>miss problems, or invent them</b>. A canary should look like the fleet.',
        'The <b>firmware agent</b> on each site\'s gateway downloads 4.3.0.',
        'Trade-off: a bug can reach several tenants at once, but only in <b>small numbers</b>.']],
      ['a-edge', 'The agent installs into the spare A/B slot and reboots, and the old image stays for rollback.', [
        'Example: the agent verifies a <b>signed image</b>, then installs it into the <b>spare slot</b>.',
        'The camera reboots into 4.3.0; the previous image <b>stays in the other slot</b>.',
        'Why: a bricked device needs a <b>truck roll</b>. Every update ships with its own undo.',
        'The rejected alternative was overwriting in place, which leaves no way back.']],
      ['a-gw', 'From now on, every heartbeat carries the firmware version.', [
        'Upgraded cameras keep sending their <b>normal heartbeats</b>, now carrying their firmware version.',
        'The Cloud Gateway handles them exactly as before: mTLS, tenant lookup, quotas.',
        'Trade-off: the version must be in <b>every message schema</b>.']],
      ['a-ing', 'Ingestion tags each reading with tenant, device model and firmware version.', [
        'Ingestion adds the tags the health comparison needs: <b>tenant, device model and firmware version</b>.',
        'Those tags let Flink compare versions within the same <b>model and site cohorts</b>.',
        'Validation, keying and routing are unchanged.']],
      ['a-kafka', 'Kafka carries the same heartbeat and telemetry topics; there is no special pipeline for rollouts.', [
        'No new topic, no side channel: rollout data rides the <b>same heartbeats and telemetry</b>.',
        'Why: <b>if the platform can see a device, it can judge its firmware</b>.',
        'The rejected alternative was a separate reporting channel just for updates.']],
      ['a-flink', 'Flink compares canary and baseline per version: crash loops, heartbeat gaps, error rate.', [
        'Flink compares <b>4.3.0 against 4.2.1</b> within the same device-model and site cohorts.',
        'The signals are <b>crash loops, heartbeat gaps and error rate</b>.',
        'Why a baseline: is a 0.3% crash rate good or bad? It <b>depends on the device</b>.',
        'Example: the denominator includes <b>every expected canary device</b>, including the silent ones.',
        'If pipeline freshness is unhealthy, the gate <b>pauses</b>; missing data never counts as success.']],
      ['a-flink', 'The canary stays healthy for 24 hours, so the health gate passes.', [
        'After <b>24 hours</b> with no regression against the baseline, the gate passes.',
        'Promotion needs <b>enough samples</b> and a stable observation time.',
        'Fixed thresholds per device type were the alternative; we <b>judge a release against what it replaces</b>.']],
      ['a-ctrl', 'The control plane widens the rollout from 1% to 10%, and every wave waits for its own health gate.', [
        'Wave 2 takes the rollout to <b>10%</b> of cameras.',
        'Each wave has its <b>own health gate</b>; passing one wave does not approve the next.',
        'Later waves go to <b>50%</b>, then <b>100%</b>, under the same rule.']],
      ['a-flink', 'In wave 2, camera model X2 shows heartbeat gaps at three times the baseline, so the gate fails.', [
        'Wave 2 reaches more devices, and one model, <b>X2</b>, starts missing heartbeats.',
        'Its heartbeat gaps are <b>3× the baseline</b>, so the gate fails.',
        'The canary passed, so a larger wave surfaced what 1% did not.',
        'Silent devices count against the release; they are never quietly dropped from the sample.']],
      ['a-ctrl', 'The rollout halts automatically: no new device gets 4.3.0, and the platform admin is alerted.', [
        'A failed gate stops the rollout <b>immediately</b>; no new device receives 4.3.0.',
        'Why automatic: at 10%, every minute of a bad rollout <b>adds affected devices</b>.',
        'The <b>platform admin</b> is alerted and decides what happens next: fix, resume or roll back.',
        '<b>Machines stop the bleeding; people decide the cure.</b>',
        'Trade-off: false alarms pause good rollouts, so the gates need careful tuning.']],
      ['a-edge', 'For example, a local watchdog selects the old A/B slot, even if the camera cannot hear the cloud.', [
        'Example: a new boot must pass a <b>local health-confirmation deadline</b> before it is marked good.',
        'If the camera fails to boot or cannot <b>regain required connectivity</b>, it reselects the previous slot.',
        'Why local: a cloud halt stops new installs, but it <b>cannot send a rollback</b> to an unreachable device.',
        'A/B storage alone cannot catch a firmware that boots but <b>stops networking</b>; the watchdog does.']],
      ['a-dash', 'Dashboards show wave progress and health per version, and the fix ships later as 4.3.1 through the same waves.', [
        'Admins see <b>wave progress</b> and <b>health per firmware version</b>.',
        'The fix ships later as <b>4.3.1</b>, starting again with a canary and the same waves.',
        'A fix is just another release: it earns its way through the <b>same gates</b>.']]
    ],
    recap: { h: 'A bad wave stopped itself, and the devices undid it locally.', b: [
      '<b>Canary 1%</b>, spread across tenants, sites and device models.',
      '<b>Health gate per wave</b>, judged against the previous version, counting silent devices.',
      '<b>Automatic halt</b> on a failed gate; a person decides what happens next.',
      '<b>A/B slots + a local watchdog</b>: the device can undo an update without the cloud.',
      'No side channel: the version rides on <b>normal heartbeats</b>.'] }
  }, {
    1: { steps: [   // control plane close-up (CTRL_SVG)
      { h: 'Rollouts are a platform-admin action.', hl: [[20, 14, 350, 330]], at: [330, 322], b: [
        'The <b>platform admin</b> works across <b>all tenants</b>; firmware rollouts are one of their controls.',
        'Tenant admins manage their own sites, devices and rules; firmware is not on their list.',
        'The permissions shown are <b>examples</b>; the split between levels is the point.'] },
      { h: 'The plan: a canary first, then waves.', hl: [[36, 186, 330, 30]], at: [330, 322], lab: [[20, 392, 'camera 4.3.0 · 1% → 10% → 50% → 100%']], b: [
        'Wave 1 is a <b>1% canary</b>; then <b>10%, 50% and 100%</b>.',
        'Each wave must pass a <b>health gate</b> before the next one starts.',
        'Trade-off: a full rollout takes <b>days instead of hours</b>.'] },
      { h: 'Wave 1 is chosen to look like the fleet.', hl: [[36, 270, 330, 30]], at: [330, 322], lab: [[20, 392, 'wave 1 · 1% · across tenants, sites, models']], b: [
        'The platform admin has the <b>cross-tenant view</b>, so the canary can span tenants.',
        'It is sampled across <b>tenants, sites and device models</b>, not one friendly tenant.',
        'So one site\'s quirk can neither <b>pass nor fail</b> a release.'] },
      { h: 'Config goes down this path; health comes back through telemetry.', hl: [[20, 14, 350, 330]], at: [330, 322], lab: [[20, 392, 'status comes back via telemetry']], b: [
        'Config changes like tenants, rules and firmware are <b>low-volume</b> and need <b>consistency</b>.',
        'Telemetry is high-volume: <b>different paths, different scaling</b>.',
        'Rollout status returns through the <b>normal telemetry</b> pipeline, not a side channel.'] }] },
    2: { steps: [   // tenant view, then the small site
      { h: 'The canary: 1% of cameras, sampled like the fleet.', hl: [[40, 60, 400, 300], [460, 60, 400, 300], [880, 60, 146, 300]], at: [405, 268], lab: [[58, 318, 'canary · 1% of cameras']], b: [
        'The 1% is sampled across <b>tenants, sites and device models</b>.',
        'Small stores and flagships alike: the canary should <b>look like the fleet</b>.'] },
      { h: 'Why not one friendly site?', hl: [[880, 60, 146, 300]], at: [405, 268], b: [
        'A canary of one site can <b>miss problems, or invent them</b>.',
        'Trade-off: a bug can reach several tenants at once, but only in <b>small numbers</b>.'] },
      { svg: 'small', h: 'Each site\'s edge pair downloads 4.3.0.', hl: [[490, 60, 300, 180]], at: [760, 212], lab: [[506, 196, 'firmware agent · downloading 4.3.0']], b: [
        'The <b>firmware agent</b> on the active gateway downloads the image.',
        'Next it installs it on the camera, with a way back.'] }] },
    3: { steps: [   // tenant view, then the small site
      { h: 'Canary cameras sit at many sites, across tenants.', hl: [[40, 60, 400, 300], [460, 60, 400, 300]], at: [405, 268], lab: [[58, 318, 'downloading 4.3.0']], b: [
        'The 1% is spread across <b>sites, tenants and models</b>, small stores and flagships alike.',
        'Every site has <b>one edge pair</b>; that pair runs the <b>firmware agent</b>.',
        'Let\'s open a small site to see the install.'] },
      { svg: 'small', h: 'Gateway A runs the firmware agent.', hl: [[490, 60, 300, 180]], at: [760, 212], lab: [[506, 196, 'firmware agent · 4.3.0']], b: [
        'The active gateway\'s <b>firmware agent</b> applies updates and rolls back on failure.',
        'Example: it first <b>verifies the signed image</b>.',
        'The same gateway already batches heartbeats and holds the <b>mTLS</b> identity.'] },
      { h: 'Install into the spare slot, then reboot.', hl: [[490, 60, 300, 180], [40, 60, 230, 56]], path: [[760, 212], [484, 88], [250, 88]], lab: [[40, 340, 'spare slot ← 4.3.0 · old image kept']], b: [
        'The camera has <b>two slots</b>: the running image and a spare.',
        '4.3.0 goes into the <b>spare slot</b>, and the camera reboots into it.',
        'The <b>old image stays</b> in the other slot: every update ships with its own undo.',
        'Overwriting in place would turn a bad image into a <b>truck roll</b>.'] },
      { h: 'The new boot must prove itself locally.', hl: [[40, 60, 230, 56]], at: [250, 88], lab: [[40, 340, 'health-confirmation deadline']], b: [
        'Example: a <b>local watchdog</b> and a health-confirmation deadline run after the reboot.',
        'Only a confirmed boot is <b>marked good</b>.',
        'Failing to boot or to <b>regain connectivity</b> reselects the previous slot.'] }] },
    4: { steps: [   // Cloud Gateway close-up (GW_SVG)
      { h: 'An upgraded camera\'s heartbeat arrives.', hl: [[20, 46, 250, 54]], at: [240, 73], lab: [[34, 262, 'heartbeat · firmware 4.3.0']], b: [
        'Upgraded cameras send their <b>normal heartbeats</b>, now carrying the firmware version.',
        'The canary is spread across tenants; this one is an Acme camera at Site-07.'] },
      { h: 'Same checks as before: mTLS and tenant lookup.', hl: [[325, 46, 200, 194], [570, 46, 200, 194]], path: [[240, 73], [318, 73], [495, 210], [740, 210]], lab: [[582, 196, 'tenant = acme']], b: [
        'A new firmware version changes <b>nothing</b> about identity: the certificate and registry decide.',
        'There is <b>no special lane</b> for rollout traffic.'] },
      { h: 'Quotas as usual, then on to ingestion.', hl: [[815, 30, 330, 226], [1190, 46, 150, 194], [1378, 40, 130, 206]], path: [[740, 210], [808, 143], [1115, 226], [1183, 143], [1310, 143], [1478, 135]], b: [
        'The heartbeat passes quotas and is load-balanced to an ingestion pod.',
        'Trade-off: the version must be in <b>every message schema</b>.'] }] },
    5: { steps: [   // Ingestion close-up
      { h: 'Upgraded heartbeats arrive from the gateway.', hl: [[20, 120, 180, 110]], at: [170, 200], b: [
        'Authenticated and <b>tenant-tagged</b>, like every other envelope.',
        'Each heartbeat now carries the <b>firmware version</b>.'] },
      { h: 'Validate and unpack, as always.', hl: [[275, 66, 330, 58], [275, 142, 330, 58]], path: [[170, 200], [248, 175], [580, 95], [580, 171]], b: [
        'The <b>Avro schema</b> already includes the version field.',
        'Trade-off: the version must be in <b>every message schema</b>.'] },
      { h: 'Tag: tenant, device model, firmware version.', hl: [[275, 142, 330, 58]], at: [580, 171], lab: [[620, 186, 'tags: tenant · model · 4.3.0']], b: [
        'These are the tags the <b>health comparison</b> needs.',
        'They let Flink compare versions within the same <b>model and site cohorts</b>.'] },
      { h: 'Route as usual: heartbeats to the priority topic.', hl: [[275, 218, 330, 58], [905, 60, 300, 100]], path: [[580, 171], [580, 247], [605, 258], [860, 258], [860, 110], [900, 110], [1175, 130]], b: [
        'Validation, keying and routing are <b>unchanged</b>.',
        'There is no special lane for rollout traffic.'] }] },
    6: { steps: [   // Kafka close-up
      { h: 'Same topics, no side channel.', hl: [[20, 130, 170, 100], [240, 14, 820, 306]], path: [[160, 200], [232, 180], [420, 126], [789, 126]], b: [
        'Rollout data rides the <b>same heartbeats and telemetry</b> topics.',
        'Keys stay <b>tenant + device</b>, so each camera\'s events stay in order.'] },
      { h: 'Why no separate reporting channel.', hl: [[250, 44, 800, 100]], at: [789, 126], b: [
        '<b>If the platform can see a device, it can judge its firmware.</b>',
        'The rejected alternative was a separate channel just for updates: more to build, and it could <b>disagree</b> with the real data.'] },
      { h: 'Flink reads it like any other heartbeat.', hl: [[1128, 186, 334, 46]], path: [[789, 126], [866, 126], [1100, 126], [1440, 209]], b: [
        'The Flink consumer group picks it up as usual.',
        'The comparison happens there, next.'] }] },
    7: { steps: [   // Flink close-up
      { h: 'Heartbeats arrive carrying their firmware version.', hl: [[20, 40, 170, 90]], at: [160, 100], lab: [[36, 280, 'tagged: tenant · model · version']], b: [
        'These are the <b>same heartbeats</b> as always, from the same topic.',
        'Ingestion has tagged each one with <b>tenant, device model and firmware version</b>.'] },
      { h: 'Enrich: each device lands in its cohort.', hl: [[444, 30, 250, 220]], path: [[160, 100], [226, 85], [382, 222], [438, 140], [664, 238]], lab: [[36, 280, 'cohort: device model + site']], b: [
        'Keyed by <b>tenant + device</b>, then joined with device metadata: type, tenant, site.',
        'Versions are compared <b>within device-model and site cohorts</b>.',
        'So a camera is compared with cameras like it, not with the whole fleet.'] },
      { h: 'Canary versus baseline, per version.', hl: [[736, 20, 300, 240]], path: [[664, 238], [730, 140], [1006, 230]], lab: [[750, 186, '4.3.0 vs 4.2.1 · comparing']], b: [
        'The rule engine tracks <b>crash loops, heartbeat gaps and error rate</b> per version.',
        '4.3.0 is judged against <b>4.2.1</b>, the version it replaces.',
        'Fixed thresholds were the alternative; the right rate <b>depends on the device</b>.'] },
      { h: 'Silent devices count, and stale data pauses the gate.', hl: [[736, 20, 300, 240], [20, 360, 1010, 40]], at: [1006, 230], lab: [[750, 186, 'silent devices count too'], [36, 280, 'stale pipeline → gate pauses', '#B45309']], b: [
        'Example: the denominator includes <b>every expected canary device</b>, silent ones too.',
        'A cohort of only reporting devices would <b>hide the failed ones</b>.',
        'If pipeline freshness is unhealthy, the gate <b>pauses</b> instead of passing on missing data.',
        'Promotion also needs <b>enough samples</b> and a stable observation time.'] }] },
    8: { steps: [   // Flink close-up
      { h: '24 hours of canary data, compared with the baseline.', hl: [[736, 20, 300, 240]], at: [1006, 230], lab: [[750, 186, '24 h · no regression', '#15803D']], b: [
        'After <b>24 hours</b> with no regression against 4.2.1, the gate passes.',
        'Crash loops, heartbeat gaps and error rate all match the baseline.'] },
      { h: 'Enough samples, a stable observation time.', hl: [[444, 30, 250, 220]], path: [[1006, 230], [720, 250], [664, 238]], b: [
        'Promotion needs <b>enough samples</b> in each model and site cohort.',
        'Silent canary devices still count; missing data never counts as success.'] },
      { h: 'The gate passes; the control plane may widen.', hl: [[444, 268, 250, 74]], path: [[664, 238], [694, 300]], b: [
        'The <b>control plane</b> owns the rollout plan, so it starts the next wave.',
        'Fixed thresholds per device type were the alternative; we judge a release <b>against what it replaces</b>.'] }] },
    9: { steps: [   // control plane close-up (CTRL_SVG)
      { h: 'Wave 2: 10% of cameras.', hl: [[36, 186, 330, 30]], at: [330, 322], lab: [[20, 392, 'wave 2 · 10% · its own health gate']], b: [
        'The rollout widens from the 1% canary to <b>10%</b>.',
        'It is still sampled across tenants, sites and models.'] },
      { h: 'Every wave waits for its own gate.', hl: [[20, 14, 350, 330]], at: [330, 322], lab: [[20, 392, '1% ✓ → 10% (gate) → 50% → 100%']], b: [
        'Passing one wave does <b>not</b> approve the next.',
        'Later waves go to <b>50%</b>, then <b>100%</b>, under the same rule.'] },
      { h: 'The gate decides, not someone watching.', hl: [[36, 228, 330, 30]], at: [330, 322], lab: [[20, 392, 'platform health · per wave']], b: [
        'The platform admin can follow every wave in <b>platform health</b>.',
        'But promotion is decided by the gate, so nobody has to watch at 3 AM.'] }] },
    10: { steps: [   // Flink close-up
      { h: 'Wave 2 reaches more devices, and more models.', hl: [[20, 40, 170, 90]], at: [160, 100], lab: [[36, 280, 'wave 2 · 10% of cameras']], b: [
        'Ten times as many cameras are now on 4.3.0.',
        'A larger wave can surface what the 1% canary did not.'] },
      { h: 'Model X2: heartbeat gaps at three times the baseline.', hl: [[736, 20, 300, 240]], path: [[160, 100], [226, 85], [382, 222], [438, 140], [730, 140], [1006, 230]], lab: [[750, 186, 'X2 · gaps 3×', '#DC2626']], b: [
        'One model, <b>X2</b>, starts missing heartbeats.',
        'Compared within its cohort, the gap rate is <b>3× the baseline</b>.'] },
      { h: 'The gate fails.', hl: [[736, 20, 300, 240], [444, 268, 250, 74]], at: [1006, 230], lab: [[750, 186, 'gate FAILED', '#DC2626']], b: [
        'Silent devices count <b>against</b> the release; they are never dropped from the sample.',
        'The failed gate goes to the control plane, which halts the rollout next.'] }] },
    11: { steps: [   // control plane: automatic halt
      { h: 'The gate failed, so the rollout stops itself.', hl: [[36, 186, 330, 30]], at: [330, 322], lab: [[20, 392, 'rollout halted at wave 2', '#DC2626']], b: [
        'The failed health gate <b>halts the rollout immediately</b>.',
        'No new device receives 4.3.0; nobody had to be watching a dashboard.'] },
      { h: 'Why the halt is automatic.', hl: [[36, 186, 330, 30]], at: [330, 322], lab: [[20, 392, 'wave 2 · 10% · every minute counts', '#DC2626']], b: [
        'At 10%, every minute of a bad rollout <b>adds affected devices</b>.',
        'The rejected alternative: humans watch dashboards and <b>stop it by hand</b>.',
        'Trade-off: false alarms pause good rollouts, so <b>tune the gates carefully</b>.'] },
      { h: 'The platform admin decides what happens next.', hl: [[20, 14, 350, 330]], at: [330, 322], lab: [[20, 392, 'admin decides: fix · resume · roll back']], b: [
        'The <b>platform admin</b> is alerted.',
        'A person chooses to <b>fix, resume or roll back</b>.',
        '<b>Halt is automatic, resume is human.</b>'] }] },
    12: { steps: [   // tenant view, then the small site
      { h: 'The halt stops new installs, but cannot reach every device.', hl: [[40, 60, 400, 300], [460, 60, 400, 300]], at: [405, 268], lab: [[58, 318, 'halt: no new installs', '#DC2626']], b: [
        'The cloud halt means <b>no new device</b> gets 4.3.0.',
        'But a halt cannot deliver a rollback command to a camera that <b>cannot hear the cloud</b>.',
        'So the undo has to live <b>on the device</b>.'] },
      { svg: 'small', h: 'The camera\'s watchdog falls back to the old slot.', hl: [[40, 60, 230, 56]], at: [250, 88], lab: [[40, 340, 'watchdog → previous slot · 4.2.1', '#15803D']], b: [
        'Example: the boot never passed its <b>health-confirmation deadline</b>.',
        'The local watchdog <b>reselects the previous slot</b> and the camera boots 4.2.1.',
        'No cloud command was needed.'] },
      { h: 'Heartbeats resume on the old version.', hl: [[40, 60, 230, 56], [490, 60, 300, 180]], path: [[250, 88], [484, 88], [760, 212]], lab: [[506, 196, 'X2 back on 4.2.1', '#15803D']], b: [
        'The camera\'s heartbeats now carry <b>4.2.1</b> again.',
        'The same pipeline that caught the problem <b>confirms the rollback</b>.'] }] },
    13: { steps: [   // Dashboards close-up
      { h: 'Rollout status arrives like any other change.', hl: [[240, 14, 190, 54], [490, 64, 320, 96]], path: [[458, 41], [458, 100], [780, 140]], lab: [[215, 140, '4.3.0 · halted at wave 2', '#DC2626']], b: [
        'Flink pushes health per version to the <b>dashboard service</b>.',
        'Open pages update over <b>SSE</b>; nobody refreshes.'] },
      { h: 'The platform admin sees waves and health per version.', hl: [[880, 20, 300, 370]], path: [[780, 140], [860, 140], [1150, 330]], b: [
        'Admins see <b>wave progress</b> and <b>health per firmware version</b>.',
        'X2 is visible as the model that failed, back on 4.2.1.'] },
      { h: 'The fix ships as 4.3.1, through the same waves.', hl: [[880, 20, 300, 370]], at: [1150, 330], b: [
        'The fix starts again with a <b>canary</b>, then the same waves.',
        'A fix is just another release: it earns its way through the <b>same gates</b>.'] }] }
  });

  // ---------- 10 · Flink jobs ----------
  registerFlow(10, {
    name: 'Flink jobs',
    intro: { h: 'A rule change, live in production: from a Git commit to 100M devices, safely.', b: [
      'A developer changes the Flink rule engine to add new <b>OVERHEATING</b> logic.',
      'Flink is <b>stateful</b>: it holds a timer and state for every device, and a redeploy must not lose them.',
      'We follow the change through <b>CI</b>, then <b>GitOps</b>, then a <b>savepoint</b> upgrade in production.',
      'Watch for: schema contracts, replayed traffic, and what rollback means for a stateful job.'] },
    steps: [
      ['a-flink', 'A developer changes the Flink rule engine with new OVERHEATING logic.', [
        'OVERHEATING is a <b>temperature rate-of-change</b> rule, next to DEAD and SLOW.',
        'The job holds <b>keyed per-device state and timers</b> for every device.',
        'So this deploy is not just new code: it must carry <b>every device\'s state</b> across versions.',
        'Let\'s zoom in on how that change reaches production.']],
      PR('Here the change is new rule logic in the Flink job.'),
      UNIT,
      ['c3', 'The contract check uses an example schema policy, FULL_TRANSITIVE, so old and new events stay readable both ways.', [
        'Example schema policy: <b>FULL_TRANSITIVE</b> in the schema registry.',
        'New consumers read old events (<b>backward</b>), and old consumers read new events (<b>forward</b>).',
        'Why: a new event field can break <b>every consumer downstream</b>. Break the build, not the consumers.',
        'Trade-off: schema compatibility is not semantic compatibility, so <b>application behaviour is checked separately</b>.']],
      ['c4', 'Integration tests run real Kafka and Flink in containers, and replay recorded device traffic through the new rules.', [
        '<b>Real Kafka and Flink</b> run in containers.',
        '<b>Recorded device traffic</b> is replayed through the new OVERHEATING rules.',
        'Why: <b>test with real traffic</b>, not only hand-written cases.']],
      SCAN,
      IMG,
      GIT,
      ARGO,
      ['d3', 'Staging uses the same chart, with smoke tests and a replayed slice of production traffic.', [
        'Staging deploys the <b>same chart</b> as production.',
        '<b>Smoke tests</b> run, plus a <b>replayed slice of production traffic</b>.']],
      ['d4', 'In production, the job stops with a savepoint, and the new version starts from that savepoint, so no state is lost.', [
        '<b>Stop-with-savepoint</b> captures every device\'s state and timers, plus the Kafka offsets.',
        'The new job version <b>starts from that savepoint</b>, so no state is lost.',
        'Why: <b>upgrade a stateful job like moving house, not rebuilding it</b>.',
        'We rejected restarting from scratch and rebuilding state from Kafka.',
        'Trade-off: operator UIDs, state and schema compatibility, and retention must all be tested.']],
      ['d5', 'A Datadog gate compares consumer lag, checkpoint time and alert rates with the previous version, for 30 minutes.', [
        'For <b>30 minutes</b>, Datadog compares the new version with the previous one.',
        'The signals are <b>consumer lag, checkpoint time and alert rates</b>.',
        'Why: some bugs only show under production load. <b>Let the metrics, not a person, say go.</b>',
        'Trade-off: slower releases, and it needs good baseline metrics.']],
      ['d6', 'If the gate passes, we keep it; if it fails, the old version restarts from the same savepoint.', [
        'Gate passes: the new version <b>stays</b>.',
        'Gate fails: the <b>old version restarts from the same savepoint</b>.',
        'Rollback restores execution state; <b>it does not unsend a page</b>.',
        'Wrong actions already sent by the rejected version need <b>reconciliation</b>.']],
      REGIONS('f1'),
      ['f2', 'Stateful upgrades: timers and per-device state move across versions inside the savepoint.', [
        '<b>Timers and per-device state</b> travel inside the savepoint, forward or back.',
        'Rollback means <b>restarting the old version from its savepoint</b>.',
        'Kafka <b>replays from the savepoint\'s offsets</b>, so no input is skipped.',
        'Downstream writes and actions are <b>idempotent</b>; side effects of the rejected version are reconciled.',
        'Idempotency prevents duplicates; it does not undo a wrong page or ticket already sent.']]
    ],
    recap: { h: 'A stateful job, upgraded without losing a single timer.', b: [
      '<b>CI</b>: review, parallel tests, a schema contract and replayed device traffic.',
      '<b>CD</b>: a signed image, GitOps, and Argo CD syncing clusters to Git.',
      '<b>Production</b>: a savepoint upgrade, judged by a 30-minute Datadog gate.',
      '<b>Rollback</b>: the old version from the same savepoint, with Kafka replay and reconciled side effects.'] }
  }, {
    1: { steps: [   // Flink close-up
      { h: 'The change: a new OVERHEATING rule.', hl: [[736, 20, 300, 240]], at: [1006, 230], lab: [[750, 186, 'new: OVERHEATING', '#B45309']], b: [
        'OVERHEATING is a <b>temperature rate-of-change</b> rule, next to SILENT, DEAD and SLOW.',
        'The developer changes the rule engine inside the Flink job.'] },
      { h: 'The job holds state for every device.', hl: [[232, 40, 170, 200], [444, 30, 250, 220]], path: [[1006, 230], [720, 250], [664, 238]], b: [
        'Every device has <b>keyed state and a timer</b>: its silence countdown, its dedup window.',
        'So this deploy is not just new code: it must carry <b>every device\'s state</b> across versions.'] },
      { h: 'Checkpoints and savepoints carry that state.', hl: [[20, 360, 1010, 40]], at: [990, 380], b: [
        'A <b>savepoint</b> upgrade stops the old job and starts the new one from the same state.',
        'Restarting from nothing would lose every timer, and with it every silence in progress.',
        'Let\'s zoom in on how that change reaches production.'] }] }
  });

  // ---------- 11 · Gateway + Ingestion ----------
  registerFlow(11, {
    name: 'Gateway + Ingestion',
    intro: { h: 'Shipping a change safely: a stateless service, from a Git commit to production.', b: [
      'The change: <b>stricter validation</b> for a new device type in the ingestion service.',
      'A bad ingestion build could <b>reject or corrupt everyone\'s data</b>.',
      'But ingestion is <b>stateless</b>, so it can canary by traffic and roll back instantly.',
      'Watch for: a load test at peak rate, a <b>5% canary</b>, and connection draining.'] },
    steps: [
      ['a-ing', 'A change to the ingestion service: stricter validation for a new device type.', [
        'Ingestion validates every payload against its <b>Avro schema</b>; this change tightens it for one device type.',
        'It sits on the path of <b>every reading</b>, from every tenant.',
        'It is a <b>stateless, autoscaled</b> pool on Kubernetes, and that shapes how we deploy it.',
        'Let\'s zoom in on how that change reaches production.']],
      PR('Here the change is stricter validation in the ingestion service.'),
      UNIT,
      ['c3', 'The contract check: the Avro schemas it produces must stay compatible with the registry.', [
        'Ingestion is a <b>producer</b>: Flink and every other consumer read what it writes.',
        'The <b>Avro schemas</b> it publishes are checked against the schema registry in CI.',
        'So a deploy <b>cannot break its consumers</b>.']],
      ['c4', 'A load test at peak rate replays 200K envelopes per second, then a 500K-per-second recovery burst, in a perf environment.', [
        'Replay the <b>200K gateway envelopes/sec</b> normal peak in a perf environment.',
        'Then a <b>500K envelopes/sec recovery burst</b>, like sites flushing their spools after an outage.',
        'Check the <b>unpacked</b> reading and byte load, throughput and reject rate, not just envelopes.',
        'Why: some problems only show at peak, so this runs <b>before every release</b>.']],
      SCAN,
      IMG,
      GIT,
      ARGO,
      ['d3', 'Staging uses the same chart, and a synthetic device fleet connects over mTLS and sends real-shaped traffic.', [
        'Staging deploys the <b>same chart</b> as production.',
        'A <b>synthetic device fleet</b> connects over <b>mTLS</b>, the way real site gateways do.',
        'It sends <b>real-shaped traffic</b>, so the new validation sees realistic payloads.']],
      ['d4', 'The production canary: new pods take 5% of traffic and old pods keep the rest, using Argo Rollouts.', [
        '<b>Argo Rollouts</b> sends <b>5%</b> of traffic to the new pods.',
        'The stable pods keep the rest until the gate passes.',
        'Why: <b>expose a little traffic, learn, then expose more</b>.',
        'The rejected alternative: a rolling update with no pause.']],
      ['d5', 'A Datadog gate compares error rate, reject rate and Kafka produce latency against the stable pods.', [
        'The canary is judged against the <b>stable pods</b>, running at the same time.',
        'The signals are <b>error rate, reject rate and Kafka produce latency</b>.',
        'For a validation change, <b>reject rate</b> is the telling one: too strict means good data is refused.']],
      ['d6', 'If the gate passes, traffic steps to 25, 50 and 100%; if it fails, traffic shifts back instantly, with no state to undo.', [
        'Traffic steps <b>25% → 50% → 100%</b>, with a Datadog gate at each step.',
        'If a gate fails, traffic <b>shifts back</b> to the stable pods instantly.',
        'There is <b>no state to migrate back</b>: statelessness is what makes rollback cheap.',
        'Trade-off: a slower full rollout, and the old ReplicaSet stays until the release is promoted.']],
      ['f1', 'Zero downtime: readiness probes gate traffic, old pods drain connections, and PodDisruptionBudgets keep capacity.', [
        '<b>Readiness probes</b> gate traffic: a pod leaves rotation before it stops.',
        'Old pods <b>drain</b> device connections and finish in-flight work before exiting.',
        'Site gateways <b>reconnect with backoff</b>.',
        '<b>PodDisruptionBudgets</b> keep enough capacity while pods roll.',
        'Why: killing a pod mid-request drops device batches. <b>A deploy should be invisible to devices.</b>']],
      REGIONS('f2')
    ],
    recap: { h: 'Stateless means rollback is just moving traffic back.', b: [
      '<b>CI</b>: a producer schema contract, and a load test at peak rate plus a recovery burst.',
      '<b>CD</b>: GitOps, a synthetic fleet in staging, then a <b>5% canary</b> by traffic.',
      '<b>Gate</b>: errors, rejects and produce latency against the stable pods, at every step to 100%.',
      '<b>Zero downtime</b>: readiness probes, connection draining and PodDisruptionBudgets.'] }
  }, {
    1: { steps: [   // Ingestion close-up
      { h: 'The change: stricter validation for one device type.', hl: [[275, 66, 330, 58]], path: [[170, 200], [248, 175], [580, 95]], lab: [[620, 186, 'changing: validation rule']], b: [
        'Ingestion validates every payload against its <b>Avro schema</b>.',
        'This change tightens it for one <b>new device type</b>.'] },
      { h: 'Every reading, from every tenant, passes here.', hl: [[20, 120, 180, 110], [905, 60, 300, 100], [905, 220, 300, 100]], at: [580, 95], b: [
        'Heartbeats and telemetry for <b>every tenant</b> go through this step.',
        'A bad build could <b>reject or corrupt everyone\'s data</b>.'] },
      { h: 'Too strict means good data is rejected.', hl: [[905, 330, 300, 62]], path: [[580, 95], [440, 130], [440, 340], [880, 361]], b: [
        'Rejected readings are <b>counted and alarmed</b>, never dropped silently.',
        'That alarm is what a canary gate watches.'] },
      { h: 'Stateless, so it can canary by traffic.', hl: [[630, 80, 168, 48]], at: [780, 104], b: [
        'Pods hold <b>no state</b>: a new version can take a slice of traffic first.',
        'Rollback is just <b>moving traffic back</b>.',
        'Let\'s zoom in on how that change reaches production.'] }] }
  });

  // ---------- 12 · Temporal + Action services ----------
  registerFlow(12, {
    name: 'Temporal + Action services',
    intro: { h: 'Shipping a change safely, while incidents are still running.', b: [
      'The change: add a <b>"notify site manager"</b> step to the incident workflow.',
      'An incident can wait <b>days</b> for a field fix, so some workflows are always mid-flight.',
      'Temporal rebuilds a workflow by <b>replaying its history</b>; changing the step order breaks running ones.',
      'Watch for: <b>replay tests</b> in CI and <b>versioned workers</b> in production.'] },
    steps: [
      ['a-act', 'A change to the incident workflow adds a "notify site manager" step.', [
        'Action Execution runs each incident\'s lifecycle as a durable <b>Temporal workflow</b>.',
        'Right now, some of those incidents are <b>waiting days</b> for a technician.',
        'The new step must apply to <b>new</b> incidents without changing the running ones.',
        'Let\'s zoom in on how that change reaches production.']],
      PR('Here the change is a new step in the incident workflow.'),
      ['c2', 'CI runs unit tests for workflows and activities on a time-skipping test server.', [
        'Workflows and activities each have their own <b>unit tests</b>.',
        'A <b>time-skipping test server</b> runs durable timers, like the 30-minute ack deadline, without waiting.']],
      ['c3', 'The determinism check replays thousands of recorded workflow histories against the new code; any mismatch fails the build.', [
        'CI replays <b>thousands of recorded histories</b> against the new code.',
        'Any <b>non-determinism</b> fails the build.',
        'Why: <b>test new code against old executions</b>, not just new ones.',
        'Trade-off: histories must be <b>collected and kept fresh</b>.']],
      ['c4', 'Integration tests use Temporal, SQS and a ServiceNow sandbox, end to end from DEAD to closed.', [
        'Real <b>Temporal and SQS</b>, plus a <b>ServiceNow sandbox</b>.',
        'One incident runs <b>end to end</b>, from the DEAD event to a closed ticket.']],
      SCAN,
      IMG,
      GIT,
      ARGO,
      ['d3', 'In staging, test incidents are left running across the deploy, to prove they survive it.', [
        'Long-running <b>test incidents</b> are started before the deploy.',
        'They are still open when the new build lands, and must <b>finish correctly</b> afterwards.',
        'It is the staging version of a two-day field fix.']],
      ['d4', 'Versioned workers: new incidents start on the new code, and in-flight ones finish on the old workers.', [
        'Workers are <b>versioned by build</b>.',
        '<b>New</b> workflows go to the new build; running ones stay on the <b>build that started them</b>.',
        '<b>Never change the rules of a game already in progress.</b>',
        'We rejected upgrading every worker at once.',
        'Trade-off: <b>two worker versions</b> run side by side for a while.']],
      ['d5', 'A Datadog gate compares workflow failures, task latency and ticket errors with the previous build.', [
        'The signals are <b>workflow failures, task latency and ticket errors</b>.',
        'The baseline is the <b>previous build</b>, which is still running the older incidents.']],
      ['d6', 'Old workers retire once no running workflow needs them; rollback routes new workflows back to the old build.', [
        'Datadog tracks <b>running workflows per build</b>; the old build retires at <b>zero</b>.',
        'Rollback: route <b>new</b> workflows back to the old build.',
        'Why: removing old workers too early <b>strands in-flight incidents</b>.',
        'Trade-off: old builds can live for <b>days</b>; a fixed retirement after N days was rejected.']],
      ['f1', 'Why this matters: an incident can wait days for a field fix, so a deploy must never change a running workflow.', [
        'A field fix can take <b>days</b>, like the two-day camera replacement.',
        'A deploy during that wait must never change the <b>steps of a workflow already running</b>.',
        'Hence two safeguards: <b>replay tests</b> before the merge, <b>versioned workers</b> after it.']],
      ['f2', 'Also as code: SNS topics, SQS queues with their DLQs, and alarms live in Terraform, through the same pipeline.', [
        'Topics, queues, <b>DLQs</b> and alarms are defined in <b>Terraform</b>.',
        'They are reviewed and applied through the <b>same pipeline</b> as the code.',
        'Why: hand-made queues <b>drift between regions</b>.',
        'Trade-off: infra changes need the same review discipline as code.']]
    ],
    recap: { h: 'Deploy any day, even with incidents mid-flight.', b: [
      '<b>Replay tests</b> catch non-deterministic changes before the merge.',
      '<b>Versioned workers</b>: new incidents on new code, running ones on the code that started them.',
      '<b>Datadog gate</b> on workflow failures, task latency and ticket errors.',
      'Old workers retire only when <b>no running workflow</b> needs them.'] }
  }, {
    1: { steps: [   // Action Execution close-up (ACT_SVG)
      { h: 'Each incident runs as one Temporal workflow.', hl: [[880, 14, 390, 300]], at: [1240, 290], b: [
        'Action Execution runs each incident\'s lifecycle as a durable <b>Temporal workflow</b>.',
        'Ticket, wait for ack, escalate, resolve: the steps are <b>code</b>.'] },
      { h: 'Some workflows are mid-flight for days.', hl: [[898, 252, 354, 46]], at: [1240, 290], b: [
        'Right now, some incidents are <b>waiting days</b> for a technician.',
        'Temporal rebuilds a workflow by <b>replaying its history</b>, so changing the step order breaks running ones.'] },
      { h: 'The new step: notify the site manager.', hl: [[898, 90, 354, 100]], path: [[1240, 290], [1260, 190], [1240, 136]], b: [
        'The new step must apply to <b>new</b> incidents without changing the running ones.',
        'Replay tests against real histories prove it, before anything ships.',
        'Let\'s zoom in on how that change reaches production.'] }] }
  });

  // ---------- 13 · Dashboard service + UI ----------
  registerFlow(13, {
    name: 'Dashboard service + UI',
    intro: { h: 'Shipping a change safely to the screens people are watching.', b: [
      'The change: a new <b>per-site uptime chart</b> on the dashboard.',
      'Two risks: a <b>tenant data leak</b>, and breaking live screens in the middle of a deploy.',
      'Watch for: isolation tests that block the merge, <b>assets first, index last</b>, a <b>feature flag</b>, and SSE across deploys.'] },
    steps: [
      ['a-dash', 'A new dashboard feature: a per-site uptime chart.', [
        'Dashboards serve <b>platform and tenant admins</b>, drilling down tenant → site → device.',
        'Live views update over <b>SSE</b>; historical queries go to ClickHouse.',
        'This feature changes both the <b>API</b> and the <b>UI</b>.',
        'Let\'s zoom in on how that change reaches production.']],
      PR('Here the change touches the dashboard API and the UI.'),
      ['c2', 'CI builds and unit-tests the API and the UI in parallel.', [
        'The <b>API</b> and the <b>UI</b> build and test as parallel jobs.',
        'A failure in either one stops the pipeline.']],
      ['c3', 'Contract and RBAC tests call every endpoint as the wrong tenant, and any leak fails the build.', [
        'Automated tests call each endpoint with <b>another tenant\'s token</b>.',
        'Any data returned <b>fails the build</b>.',
        'Why: a tenant data leak is the <b>worst possible bug</b>; code review alone is not enough.',
        'Trade-off: the tests must cover <b>every new endpoint</b>, including this chart\'s.']],
      ['c4', 'End-to-end browser tests run on staging data: drill-down, live updates and charts.', [
        'Real browser journeys run on <b>staging data</b>.',
        'They cover <b>drill-down, live updates and charts</b>, the paths admins actually use.']],
      SCAN,
      ['c6', 'The artifacts are a signed API image and a versioned UI bundle, sent to the registry and the asset store.', [
        'The API ships as a <b>signed image</b> to the registry.',
        'The UI ships as a <b>versioned bundle</b> to the asset store.',
        'Versioned assets are what make the next CDN step safe.']],
      GIT,
      ARGO,
      ['d3', 'For the UI, new versioned assets go to the CDN first and the index switches last, so nobody gets a half-deployed app.', [
        'New versioned assets reach the <b>CDN first</b>.',
        'The <b>index switches last</b>, once everything it references is already there.',
        'Why: users must <b>never get a half-deployed app</b>.']],
      ['d4', 'The new chart ships dark behind a feature flag, and is switched on for an internal tenant first.', [
        'The code is deployed, but the chart is <b>hidden behind a flag</b>.',
        'The flag goes on for an <b>internal tenant first</b>.',
        'Why: <b>separate deploying code from releasing features</b>.',
        'Trade-off: flags need <b>cleanup</b> after the rollout.']],
      ['d5', 'A Datadog gate watches API errors, SSE reconnect rate and real-user page load.', [
        'Three signals: <b>API errors</b>, <b>SSE reconnect rate</b> and <b>real-user page load</b>.',
        'Real-user page load measures what admins actually feel.']],
      ['d6', 'If the gate passes, the flag goes on for everyone; rollback is flag off in seconds, with no redeploy.', [
        'Gate passes: the flag goes on for <b>all tenants</b>.',
        'Rollback is <b>flag off in seconds</b>, with <b>no redeploy</b>.']],
      ['f1', 'SSE across deploys: new pods take new streams while old pods drain, and a short replay buffer covers reconnects.', [
        'New pods accept new streams while old pods <b>drain</b>.',
        'SSE pods hold <b>no state</b>, so a client can reconnect to any pod.',
        'A short shared replay buffer, e.g. a <b>Redis Stream</b> of a few minutes, serves <b>Last-Event-ID</b>.',
        'If the ID is older than the buffer, the client reloads a <b>state snapshot</b> and resumes live.',
        'Trade-off: the replay buffer is extra state to size and run.']],
      ['f2', 'Tenant safety: isolation tests block the merge, and a data leak is a failed build, not a bug report.', [
        'Tenant-isolation tests <b>block the merge</b>.',
        '<b>A leak is treated as a failed build, not a bug report.</b>']]
    ],
    recap: { h: 'Deploying and releasing are separate steps.', b: [
      '<b>CI</b>: wrong-tenant tests on every endpoint, plus browser journeys.',
      '<b>UI</b>: assets first, index last, so there is never a half-deployed app.',
      '<b>Release</b>: dark behind a flag, an internal tenant first, everyone after the Datadog gate.',
      '<b>Rollback</b>: flag off in seconds, and live streams survive deploys.'] }
  }, {
    1: { steps: [   // Dashboards close-up
      { h: 'The change: a per-site uptime chart.', hl: [[1200, 20, 310, 370]], at: [1466, 136], b: [
        'Tenant admins drill down <b>tenant → site → device</b>.',
        'The new chart belongs to the <b>site</b> level.'] },
      { h: 'It changes the API and the UI.', hl: [[490, 174, 320, 96], [20, 170, 180, 100]], path: [[1466, 136], [1190, 330], [780, 230]], b: [
        'History comes through the <b>REST API</b>, from ClickHouse.',
        'The UI and the API change together, so they must stay <b>compatible</b> mid-deploy.'] },
      { h: 'Risk one: a tenant data leak.', hl: [[490, 284, 320, 90]], path: [[780, 230], [780, 345]], b: [
        'Every call is scoped by <b>role + tenant + sites</b>.',
        'A new endpoint that skips that check would show one tenant another\'s sites.'] },
      { h: 'Risk two: breaking live screens mid-deploy.', hl: [[490, 64, 320, 96]], path: [[780, 345], [780, 140]], b: [
        'Open pages hold <b>SSE</b> streams to the dashboard service.',
        'A deploy must drain them, and clients must reconnect cleanly.',
        'Let\'s zoom in on how that change reaches production.'] }] }
  });

  // ---------- 14 · Data stores ----------
  registerFlow(14, {
    name: 'Data stores',
    intro: { h: 'Shipping a schema change, with no downtime.', b: [
      'The change: add <b>firmware_version</b> to telemetry rows and to device documents.',
      'Schema changes are the <b>classic cause of deploy downtime</b>.',
      'The pattern is <b>expand → migrate → contract</b>: add the new, move the data, remove the old last.',
      'Watch for: every step until the last one is <b>reversible</b>.'] },
    steps: [
      ['a-stor', 'A schema change adds firmware_version to telemetry rows and device documents.', [
        'Telemetry rows live in <b>ClickHouse</b>; device documents live in <b>MongoDB</b>.',
        'It is the version the firmware rollout compares: health <b>per version</b>.',
        'Old and new code will run side by side, so <b>both must work at every step</b>.',
        'Let\'s zoom in on how that change reaches production.']],
      ['c1', 'The pull request versions the migration scripts in Git, next to the code that needs them.', [
        '<b>Migration scripts</b> are versioned in Git next to the code that needs them.',
        'The schema change and the code that uses it are <b>reviewed together</b>.']],
      ['c2', 'A dry run on a copy of a production snapshot checks timing and locks.', [
        'The migration runs on a <b>copy of a production snapshot</b>.',
        'It measures <b>timing</b> and checks for <b>locks</b>.',
        'Why: one giant UPDATE <b>locks tables and spikes load</b>; better to find that here.']],
      ['c3', 'Compatibility: the current code must keep working on the new schema, which a safe rollout requires.', [
        'The code running <b>today</b> must keep working on the <b>new</b> schema.',
        'That is what lets a code release roll forward, and <b>roll back</b>, safely.']],
      ['c4', 'Integration tests check that the new code reads both the old and the new shape of every row and document.', [
        'The new code must read <b>both shapes</b>: with and without firmware_version.',
        'Until the backfill finishes, <b>both shapes exist</b> in production.']],
      ['c5', 'Data changes need a second approval, from the data owner.', [
        'For data, code review is not enough: the <b>data owner</b> approves too.']],
      ['c6', 'The output is a versioned, ordered and resumable migration bundle.', [
        '<b>Versioned</b> and <b>ordered</b>: every environment applies the same steps in the same order.',
        '<b>Resumable</b>: an interrupted migration continues where it stopped.']],
      ['d1', 'Expand: add the new column and field as nullable; ClickHouse ADD COLUMN is metadata-only, and MongoDB needs no DDL.', [
        'The new column and field are <b>nullable</b>, so existing data stays valid.',
        'In ClickHouse, <b>ADD COLUMN</b> is metadata-only.',
        'MongoDB needs <b>no DDL</b>: documents simply gain the field.',
        'Like every step until contract, this one is <b>reversible</b>.']],
      ['d2', 'Ship code that writes the new field and reads both shapes.', [
        'The new code <b>writes</b> firmware_version on new rows and documents.',
        'It <b>reads both shapes</b>, because older data does not have the field yet.']],
      ['d3', 'Backfill in throttled, resumable batches; MongoDB documents can also migrate lazily when read.', [
        'A resumable job walks the data in <b>small, throttled batches</b>.',
        'MongoDB documents can also migrate <b>lazily, when read</b>.',
        'Why: production load stays flat. <b>Slow and steady never pages anyone.</b>',
        'Trade-off: backfills take <b>hours, not minutes</b>.']],
      ['d4', 'Indexes build online, from MongoDB 4.2, and very large ones build one replica-set member at a time.', [
        'Indexes build <b>online</b> (MongoDB 4.2+), without blocking reads or writes.',
        'Very large indexes build <b>one replica-set member at a time</b>.']],
      ['d5', 'Verify in Datadog: query latency, error rate and backfill completeness.', [
        '<b>Query latency</b> and <b>error rate</b> show the new shape is healthy.',
        '<b>Backfill completeness</b> must reach 100% before anything is removed.']],
      ['d6', 'Contract: remove the old field and the old read path, only after every reader uses the new one.', [
        'Only now do we remove the <b>old field</b> and the <b>old read path</b>.',
        'It waits until <b>every reader</b> uses the new shape.',
        'This is the one step that is <b>not reversible</b>, so it comes last.',
        'Trade-off: <b>more releases per change</b>, instead of one big-bang migration in a maintenance window.']],
      ['f1', 'Zero downtime by design: never rename or drop in place, and Redis uses versioned keys.', [
        '<b>Never rename or drop in place</b>.',
        'Every step until <b>contract</b> is reversible.',
        'Redis uses <b>versioned keys</b>, like v2:…, and old keys simply <b>expire</b>.',
        '<b>Change the schema the way you change a tyre on a moving car: one bolt at a time.</b>']],
      ['f2', 'Version upgrades roll through the MongoDB replica set: secondaries first, then the primary steps down.', [
        'Upgrade <b>secondaries one by one</b>, then <b>step down the primary</b>.',
        'The election takes <b>a few seconds</b>, and <b>retryable writes</b> absorb it.',
        'Trade-off: it requires <b>replica sets everywhere</b>. Zero downtime is a design choice, not a feature.']]
    ],
    recap: { h: 'Expand, migrate, contract: a schema change with no downtime.', b: [
      '<b>CI</b>: a dry run on a production snapshot, compatibility checks, and a data-owner approval.',
      '<b>Expand</b> with nullable fields, ship <b>dual-read</b> code, and <b>backfill</b> slowly.',
      '<b>Online indexes</b> and a <b>Datadog</b> check before anything is removed.',
      '<b>Contract last</b>: until then, every step can be undone.'] }
  }, {
    1: { steps: [   // Storage close-up (STOR_SVG)
      { h: 'The change: firmware_version on telemetry rows.', hl: [[272, 112, 250, 82]], path: [[160, 230], [230, 200], [230, 152], [500, 170]], b: [
        'Raw telemetry lives in <b>ClickHouse hot</b>, written by Flink.',
        'The new column lets dashboards show health <b>per firmware version</b>.'] },
      { h: 'And on device documents in MongoDB.', hl: [[272, 388, 250, 82]], path: [[500, 170], [240, 250], [240, 430], [500, 450]], b: [
        'Device documents live in the <b>MongoDB</b> registry.',
        'It is the version the firmware rollout compares.'] },
      { h: 'Old and new code run side by side.', hl: [[848, 170, 264, 90], [848, 276, 264, 90]], path: [[500, 450], [800, 321], [1090, 320]], b: [
        'During the deploy, old and new readers and writers coexist.',
        'So <b>both must work at every step</b>: expand → migrate → contract.',
        'Let\'s zoom in on how that change reaches production.'] }] }
  });

  // ---------- 15 · Kafka + platform ----------
  registerFlow(15, {
    name: 'Kafka + platform',
    intro: { h: 'Shipping a platform change: upgrade the backbone while it carries everything.', b: [
      'The change: a <b>new Kafka version</b> and <b>longer retention</b> on the telemetry topic.',
      'Kafka is the <b>durable backbone</b>; every reading passes through it.',
      'So the upgrade runs <b>one broker at a time</b>, with producers and consumers still running.',
      'Watch for: <b>infrastructure as code</b>, policy checks, replica gates and a late point of no return.'] },
    steps: [
      ['a-kafka', 'A platform upgrade: a new Kafka version, plus longer retention on the telemetry topic.', [
        'Retention decides how far back we can <b>replay</b>; it must cover an outage and the catch-up.',
        'Every reading, from every tenant, flows through these brokers.',
        'So the cluster must <b>stay available</b> while it is upgraded.',
        'Let\'s zoom in on how that change reaches production.']],
      ['c1', 'The pull request goes to the infra repo, where Terraform, Helm and topic config are all code.', [
        'Brokers, topics and configs live in Git as <b>Terraform</b>, <b>Helm</b> and topic config.',
        'Why: hand-edited brokers <b>drift</b>, and nobody knows why.',
        'Trade-off: slower for "quick fixes", <b>on purpose</b>.']],
      ['c2', 'The plan is a reviewed diff of exactly what will change, broker by broker and topic by topic.', [
        'Reviewers see <b>exactly what will change</b>, broker by broker and topic by topic.',
        '<b>The plan is the change log.</b>']],
      ['c3', 'Policy checks: replication at least 3, min in-sync at least 2, no partition decrease, and retention within bounds.', [
        'Policy as code: <b>unsafe settings fail the pipeline</b>.',
        'The rules: <b>replication ≥ 3</b>, <b>min in-sync ≥ 2</b>, no partition decrease, retention within bounds.',
        'The new retention value has to pass that bounds check too.']],
      ['c4', 'In a rehearsal, the same upgrade runs on a staging cluster under replayed load.', [
        'The <b>same upgrade</b> runs on a staging cluster first.',
        'It runs under <b>replayed load</b>, not an idle cluster.']],
      SCAN,
      ['c6', 'The output is a versioned platform release.', [
        'The upgrade is packaged as a <b>versioned platform release</b>, like any other artifact.',
        'What was planned, checked and rehearsed is exactly what ships.']],
      ['d1', 'Topic config, here the retention, applies through GitOps, with no hand-edited brokers.', [
        'The retention change applies <b>through GitOps</b>, like any deploy.',
        '<b>No hand-edited brokers</b>: what Git says is what runs.']],
      ['d2', 'The rolling upgrade goes one broker at a time, while producers and consumers keep running.', [
        'Brokers are upgraded <b>one at a time</b>.',
        '<b>Producers and consumers keep running</b> throughout.',
        'The rejected alternative: restarting all brokers together.',
        'Trade-off: a full upgrade takes <b>hours</b>.']],
      ['d3', 'Between brokers, we wait until under-replicated partitions reach zero before touching the next one.', [
        'After each restart, the broker must catch up and rejoin the <b>in-sync replicas</b>.',
        'Only when <b>under-replicated partitions = 0</b> does the next broker restart.',
        'Why: restarting too fast leaves partitions <b>without replicas</b>.',
        '<b>Never take away the safety net you\'re relying on.</b>']],
      ['d4', 'With KRaft, the cluster metadata.version stays at the old level until every broker and controller runs the new release.', [
        'In <b>KRaft</b>, the cluster\'s <b>metadata.version</b> stays at the old level.',
        'So old and new brokers stay <b>compatible</b> while the cluster is mixed.',
        'It waits until <b>every broker and controller</b> runs the new release.',
        'Why: <b>keep the way back open as long as possible</b>.']],
      ['d5', 'A Datadog gate checks consumer lag, in-sync replicas and request latency across the cluster.', [
        'The signals are <b>consumer lag, in-sync replicas and request latency</b>.',
        'They are checked <b>across the whole cluster</b>, now that every broker runs the new release.']],
      ['d6', 'Finalize: bump metadata.version with kafka-features; a binary rollback is possible right up to this step.', [
        'Finalizing bumps <b>metadata.version</b> with the <b>kafka-features</b> tool.',
        'Up to this step, a <b>binary rollback</b> is still possible.',
        'This is the <b>point of no return</b>, so it comes last.',
        'Trade-off: two steps instead of one.']],
      ['f1', 'Safe by construction: replication 3, min in-sync 2, acknowledged writes, and upgrades in a maintenance window, never at peak.', [
        'Example: <b>replication 3</b>, <b>min in-sync 2</b> and <b>acknowledged writes</b>.',
        'So one broker restarting still leaves <b>two in-sync copies</b>.',
        'Healthy replicas are <b>verified before each restart</b>.',
        'Upgrades run in a <b>maintenance window per region</b>, never at peak.']],
      ['f2', 'Partition growth is planned capacity work, never added during an incident.', [
        'Adding partitions <b>remaps tenant + device keys</b> to different partitions.',
        'That breaks <b>per-device order</b>: later events can land elsewhere while earlier ones are unread.',
        'So partition growth is <b>planned capacity work</b>, never an incident fix.']]
    ],
    recap: { h: 'Upgrade the backbone without stopping the data.', b: [
      '<b>Infra as code</b>: a reviewed plan and policy checks before anything changes.',
      '<b>Rehearse</b> the same upgrade on staging under replayed load.',
      '<b>Roll</b> one broker at a time, gated on zero under-replicated partitions.',
      '<b>Finalize last</b>: the metadata.version bump is the point of no return.'] }
  }, {
    1: { steps: [   // Kafka close-up
      { h: 'The change: longer retention on the telemetry topic.', hl: [[250, 166, 800, 100]], at: [840, 226], b: [
        'Retention decides how far back we can <b>replay</b>.',
        'It must cover an outage <b>and</b> the catch-up after it.'] },
      { h: 'Replay depends on it.', hl: [[1110, 334, 370, 58]], path: [[840, 226], [1080, 300], [1450, 363]], b: [
        'After a bug or an outage we <b>rewind the offset</b> and reprocess.',
        'Longer retention means more broker <b>disk</b>, planned in advance.'] },
      { h: 'Every reading flows through these brokers.', hl: [[240, 14, 820, 306]], path: [[1450, 363], [1100, 180], [789, 126]], b: [
        'Both topics, every tenant: the cluster must <b>stay available</b> during the upgrade.',
        'So brokers upgrade <b>one at a time</b>, with producers and consumers running.',
        'Let\'s zoom in on how that change reaches production.'] }] }
  });
})();
