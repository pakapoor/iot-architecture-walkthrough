// Generated from pres/timeline2p.js by vid/build.py.
// ============ one-ball, stop-by-stop presenter engine ============
const E = id => document.getElementById(id);
const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const lerp = (a, b, f) => a + (b - a) * f;
const prog = (t, a, b) => b <= a ? (t >= b ? 1 : 0) : Math.max(0, Math.min(1, (t - a) / (b - a)));
function env(t, a, b, r = 0.3) { if (t < a || t > b) return 0; return Math.min(1, (t - a) / r, (b - t) / r); }
const QS = new URLSearchParams(location.search);
const PROPOSAL = window.PROPOSAL || null;
const VER = QS.get('ver') || 'int';
const P = VER === 'pres'
  ? { hold: { pass: 0.45, core: 0.55, deep: 1.4 }, hop: 1.3, hopPx: 1100, zoom: 2.4, intro: 0.6, recap: 1.2, endHold: 1.0 }
  : VER === 'li'
  ? { hold: { pass: 1.0, core: 1.35, deep: 1.75 }, hop: 0.8, hopPx: 1800, zoom: 1.8, intro: 2.0, recap: 3.0, endHold: 3.0 }
  : { hold: { pass: 3.5, core: 5.5, deep: 8.0 }, hop: 1.6, hopPx: 900, zoom: 2.6, intro: 3.0, recap: 6.0, endHold: 4.0 };
const HOOK_R = 2.6;
const COL = { g: ['#16A34A', 'rgba(22,163,74,.55)'], r: ['#EF4444', 'rgba(239,68,68,.6)'], y: ['#F5B70A', 'rgba(245,183,10,.6)'], v: ['#7C5CFA', 'rgba(124,92,250,.6)'], b: ['#2563EB', 'rgba(37,99,235,.55)'], o: ['#F08A1C', 'rgba(240,138,28,.6)'] };
const BASE = { arch: [1.08, 96, 0], sceneB: [1.125, 60, 0], sceneD: [1, 0, 0], sceneW: [1, 0, 0], sceneM: [1, 0, 0], sceneC: [1, 0, 0] };
const LAYER = { a: 'arch', b: 'sceneB', w: 'sceneW', d: 'sceneD', m: 'sceneM', c: 'sceneC' };
const BALL = { a: 40, b: 40, w: 48, d: 48, m: 48, c: 48 };
let SW = 1920, SH = 1080, OX = 0, OY = 0;   // reflowed stage size + offset of the 1920×1080 viewport     // local diameter

// ---------- anchors (measured once, layers are untransformed at load) ----------
const STG = E('stage').getBoundingClientRect();
function rectOf(id) { const r = E(id).getBoundingClientRect(); return { x: r.left - STG.left, y: r.top - STG.top, w: r.width, h: r.height }; }
function anchor(id, corner, L) {
  const r = rectOf(id), ins = BALL[L] / 2 + 10;
  const x = corner[1] === 'r' ? r.x + r.w - ins : r.x + ins; const y = corner[0] === 'b' ? r.y + r.h - ins : r.y + ins;
  return [x, y, r.x + r.w / 2, r.y + r.h / 2];
}

if (E('alist')) E('alist').innerHTML = '<div class="al" style="height:62px"></div><div class="al" style="height:62px"></div>';
// ---------- flows ----------
const isRed = VID === 1 || VID === 2 || VID === 5;
let STOPS = [], TRS = [], RECAP = {}, BASE_STATE;
const red = ['#FEE2E2', '#DC2626', '#FCA5A5'], grn = ['#DCFCE7', '#15803D', '#86EFAC'], yel = ['#FFFBEB', '#B7791F', '#FCD34D'], org = ['#FFEDD5', '#C2620A', '#FDBA74'], gry = ['#EEF2F7', '#33465C'];
function st(L, id, corner, w, col, cap, fx, opts = {}) { STOPS.push(Object.assign({ L, id, corner, w, col, cap, fx }, opts)); }
function zoomIn(i, cap) { STOPS.push({ zoom: 'in', tr: i, cap }); }

BASE_STATE = () => ({ aBadge: null, chip: null, laneR: 0, laneY: 0, rows: 0, bSteps: ['', '', '', ''], bChip: ['no ticket', ...gry],
  wSteps: ['', '', '', ''], wl: [null, null, null, null], act: { 'act-sn': ['no ticket', ...gry], 'act-oc': ['idle', ...gry], 'act-x': VID !== 2 ? ['idle', ...gry] : ['🔴 offline', red[0], red[1]] },
  wstat: ['● Running', '#EDE7FF', '#5B3FD9'], devs: {}, tiles: [48, 48, 0, 0], alerts: 'ok', toastT: null, detT: null, cursor: null, sleep: null, bBadge: null, mT: 0, mAlert: 'ok', mAnn: 0, obsBad: 0, cst: {}, obsT: null });

const ARCH_HEAD = (who) => {
  st('a', 'a-edge', 'br', 'core', 'g', who[0]);
  st('a', 'a-gw', 'br', 'pass', 'g', 'Cloud Gateway: mTLS device identity · per-tenant quotas · rate limiting', null, { li: false });
  st('a', 'a-ing', 'br', 'pass', 'g', 'Ingestion: stateless autoscaled pool · validates & tags tenant · heartbeats prioritised', null, { li: false });
  st('a', 'a-kafka', 'br', 'deep', 'g', 'Kafka: separate <b>heartbeats</b> + <b>telemetry</b> topics · partitioned by <b>tenant + device</b> → per-device order · replayable');
};

if (isRed) {
  ARCH_HEAD(['Edge site: camera <b>CAM-14</b> heartbeats every minute · the gateway batches them per site']);
  st('a', 'a-flink', 'br', 'deep', 'g', 'Flink: a per-device timer resets on every heartbeat — no polling 100M rows');
  st('a', 'a-flink', 'br', 'deep', 'g', 'Then <b>CAM-14</b> goes silent… its per-device timer keeps counting', (S, t, s) => {
    S.aBadge = ['📷 CAM-14 · no heartbeat', ...red]; const el = Math.min(299, Math.floor(300 * prog(t, s.ta, s.te)));
    S.chip = [`⏱ CAM-14 · silent for ${Math.floor(el / 60)}:${String(el % 60).padStart(2, '0')} / 5:00`, '#FFF7ED', '#C2620A', '#F08A1C']; }, { stay: true });
  st('a', 'a-flink', 'br', 'core', 'r', '5 min with no heartbeat → timer fires → <b>DEAD</b> · incident emitted', (S) => { S.chip = ['🔴 CAM-14 → DEAD · incident emitted', ...red]; }, { stay: true });
  st('a', 'a-act', 'tr', 'core', 'r', 'Action Execution: <b>critical</b> lane — skips batching, straight to paging + ticketing', (S) => { S.laneR = 1; });
  zoomIn(0, 'Zooming in: ServiceNow + Temporal 🔍');
  st('b', 'b-flink', 'br', 'pass', 'r', 'Flink publishes the DEAD incident event', null, { li: false, pop: true });
  if (VID === 5) st('b', 'b-sns', 'br', 'core', 'r', 'SNS fans it out · <b>PagerDuty pages on-call now</b> — the page never waits on ServiceNow', (S) => { S.bBadge = ['📟 On-call paged via PagerDuty', ...red]; S.act['act-x'] = ['📟 paged at minute 1', red[0], red[1]]; }, { popIfFirst: true });
  else st('b', 'b-sns', 'br', 'core', 'r', 'SNS fans it out · <b>PagerDuty pages on-call now</b> · the ticket path follows', null, { popIfFirst: true });
  st('b', 'b-sqs', 'br', VID === 5 ? 'core' : 'pass', 'r', VID === 5 ? 'SQS: if the starter fails, it redelivers after the visibility timeout · SQS DLQ after N receives' : 'SQS buffers it · at-least-once delivery');
  st('b', 'b-start', 'br', 'core', 'v', 'Ticket starter: signalWithStart(<b>tenant + device + outage generation</b>) → one workflow per incident');
  st('b', 'b-tmp', 'tr', 'deep', 'v', 'Temporal: one durable workflow now owns the whole incident');
  zoomIn(1, 'Zooming in: inside the Temporal workflow 🔍');
  if (VID === 5) {
  st('w', 'ws1', 'br', 'deep', 'v', 'Step 1 · Activity: upsert the ServiceNow ticket — idempotent by incident ID (unique correlation_id)', (S) => { S.wSteps[0] = 'on'; }, { pop: true });
  st('w', 'act-sn', 'tr', 'core', 'r', 'Attempt 1 → <b>503</b> · Temporal backs off, retries in 2 s', (S) => {
    S.act['act-sn'] = ['503 · unavailable', red[0], red[1]]; S.wl[0] = ['⚠ attempt 1 · 503 · retry in 2 s', '#DC2626']; });
  st('w', 'act-sn', 'tr', 'core', 'r', 'Attempt 2 → <b>timeout</b> · the ticket <b>may</b> have been created anyway', (S) => {
    S.act['act-sn'] = ['⏱ timeout', org[0], org[1]]; S.wl[0] = ['⚠ attempt 2 · timeout · retry in 4 s', '#DC2626']; }, { stay: true });
  st('w', 'act-sn', 'tr', 'core', 'r', 'Attempts 3–5 → 503 / 429 · backoff grows 8 s → 16 s → 32 s', (S, t, s) => {
    const n = 3 + Math.min(2, Math.floor(3 * prog(t, s.ta, s.te - 0.2))); S.act['act-sn'] = ['503 · still down', red[0], red[1]];
    S.wl[0] = n < 5 ? [`⚠ attempt ${n} · failed · backing off`, '#DC2626'] : ['✗ attempt 5 / 5 failed · retries exhausted', '#DC2626']; }, { stay: true });
  st('w', 'ws2', 'br', 'deep', 'y', 'Step 2 · Retries exhausted → the workflow does <b>not</b> fail: status = <b>PARKED</b>', (S) => {
    S.wSteps[0] = ''; S.wSteps[1] = 'on'; S.wstat = ['⏸ Parked', '#FFEDD5', '#C2620A']; S.wl[1] = ['⏸ PARKED · listed in "DLQ · parked incidents"', '#C2620A']; });
  st('w', 'act-oc', 'tr', 'core', 'y', 'Ops alerted · ticket creation is parked; acknowledgement/recovery signals and the original page deadline remain active', (S) => { S.act['act-oc'] = ['🔔 alerted · 1 parked', org[0], org[1]]; });
  st('w', 'ws3', 'br', 'deep', 'y', 'Step 3 · Durable wait for a human "replay" signal — minutes or days, no state lost', (S, t, s) => {
    S.wSteps[1] = 'done'; S.wSteps[2] = 'on'; const m = Math.min(42, Math.floor(43 * prog(t, s.ta, s.te))); S.wl[2] = [`⏳ waiting for ops · ${m} min`, '#C2620A']; });
  st('w', 'act-x', 'tr', 'core', 'r', 'No ack at the original 30-min deadline → L2 is paged while ticket creation remains parked', S => { S.act['act-x'] = ['📟 L2 paged · original deadline', red[0], red[1]]; });
  st('w', 'act-sn', 'tr', 'core', 'g', 'ServiceNow recovers · ops checks it is healthy before replaying', (S) => { S.act['act-sn'] = ['🟢 healthy again', grn[0], grn[1]]; S.wl[2] = ['⏳ waiting for ops · 42 min', '#C2620A']; });
  st('w', 'act-oc', 'tr', 'deep', 'g', 'Ops clicks <b>Replay</b> → signal to the same workflow · a human approval step inside a long-running workflow', (S) => {
    S.act['act-oc'] = ['▶ Replay sent', grn[0], grn[1]]; S.wl[2] = ['✓ "replay" signal received', '#15803D']; });
  st('w', 'ws4', 'br', 'core', 'v', 'Step 4 · Replay: upsert again — idempotent by incident ID', (S) => {
    S.wSteps[2] = 'done'; S.wSteps[3] = 'on'; S.wstat = ['● Running', '#EDE7FF', '#5B3FD9']; });
  st('w', 'act-sn', 'tr', 'deep', 'g', 'Exactly one ticket <b>INC-1042</b> · P1 reflects the original escalation deadline, even if an earlier attempt landed', (S) => {
    S.act['act-sn'] = ['INC-1042 · Open · P1', org[0], org[1]]; S.wl[3] = ['✓ INC-1042 · exactly one ticket', '#15803D']; });
  st('w', 'act-x', 'tr', 'core', 'g', 'Reconcile current ack/recovery state · the original paging deadline survives parking; recovered devices get no stale open ticket', (S) => {
    S.wSteps[3] = 'done'; S.wSteps[0] = 'done'; S.wl[0] = ['✓ recovered via replay', '#15803D']; S.wl[1] = ['✓ un-parked', '#15803D'];
    S.wstat = ['● Running · escalated', '#EDE7FF', '#5B3FD9']; S.bChip = ['INC-1042 · Open', org[0], org[1]]; });
  RECAP = { cap: 'ServiceNow outage → retries → parked → human replay → one ticket ✅', badge: ['📷 CAM-14 · INC-1042 open', ...red], boxes: ['a-edge', 'a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-act'] };
  } else {
  st('w', 'ws1', 'br', 'deep', 'v', 'Step 1 · Activity: upsert the ServiceNow ticket — idempotent by incident ID (unique correlation_id)', (S) => { S.wSteps[0] = 'on'; }, { pop: true });
  st('w', 'act-sn', 'tr', 'core', 'v', 'ServiceNow is down (503) → Temporal retries with backoff', (S) => {
    S.act['act-sn'] = ['503 · unavailable', red[0], red[1]]; S.wl[0] = ['⚠ ServiceNow 503 · retry 1 in 2 s (backoff)', '#DC2626']; });
  st('w', 'act-sn', 'tr', 'core', 'v', 'Retry succeeds → <b>INC-1042</b> created · idempotent by incident ID', (S) => {
    S.act['act-sn'] = ['INC-1042 · Open · P3', org[0], org[1]]; S.wl[0] = ['✓ INC-1042 created on attempt 2', '#15803D']; }, { stay: true });
  st('w', 'ws2', 'br', 'deep', 'v', 'Step 2 · Durable ack deadline: 30 min from the original page; retries do not reset it', (S, t, s) => {
    S.wSteps[0] = 'done'; S.wSteps[1] = 'on'; S.act['act-oc'] = ['waiting for ack…', org[0], org[1]];
    const m = Math.floor(30 * prog(t, s.ta, s.te - 0.3)); S.wl[1] = m < 30 ? [`⏱ waiting for ack · ${m} / 30 min`, '#C2620A'] : ['⌛ no ack in 30 min → timer fired', '#DC2626'];
  });
  st('w', 'ws3', 'br', 'core', 'v', 'Step 3 · No ack → escalate', (S) => { S.wSteps[1] = 'done'; S.wSteps[2] = 'on'; });
  st('w', 'act-oc', 'tr', 'core', 'v', 'L2 on-call paged · ticket raised to <b>P1</b>', (S) => {
    S.act['act-oc'] = ['📟 L2 paged · P1', red[0], red[1]]; S.act['act-sn'] = ['INC-1042 · Escalated · P1', red[0], red[1]]; S.wl[2] = ['✓ L2 paged · ticket now P1', '#15803D']; });
  if (VID === 1) {
    st('w', 'ws4', 'br', 'deep', 'v', 'Step 4 · Still down → ServiceNow dispatches a field tech · workflow waits for "ticket closed"', (S) => {
      S.wSteps[2] = 'done'; S.wSteps[3] = 'on'; S.act['act-sn'] = ['INC-1042 · Tech dispatched', org[0], org[1]]; S.act['act-x'] = ['🔧 dispatched · ETA 2 days', org[0], org[1]]; });
    st('w', 'act-x', 'tr', 'deep', 'v', 'The workflow sleeps durably for days — survives deploys & crashes', (S, t, s) => {
      const hrs = Math.min(47, Math.floor(48 * prog(t, s.ta, s.te))); S.sleep = `💤 Sleeping · ${Math.floor(hrs / 24)}d ${hrs % 24}h`;
      S.wl[3] = [`💤 sleeping durably · ${Math.floor(hrs / 24)}d ${hrs % 24}h elapsed`, '#4338CA']; });
    st('w', 'act-x', 'tr', 'core', 'v', '2 days later… the technician replaces the camera', (S) => {
      S.sleep = '💤 Sleeping · 2d 0h'; S.wl[3] = ['💤 slept durably · 2 days', '#4338CA']; S.act['act-x'] = ['✅ camera replaced', grn[0], grn[1]]; }, { stay: true });
    st('w', 'act-sn', 'tr', 'core', 'g', 'Tech closes the ticket → ServiceNow signals the workflow', (S) => { S.sleep = null; S.act['act-sn'] = ['INC-1042 · Closed ✅', grn[0], grn[1]]; S.wl[3] = ['✓ "ticket closed" signal received', '#15803D']; });
    st('w', 'ws4', 'br', 'core', 'g', 'Workflow complete ✅ · opened → escalated → fixed → closed', (S) => {
      S.wSteps[3] = 'done'; S.act['act-oc'] = ['✅ stood down', grn[0], grn[1]]; S.wstat = ['✅ Completed', '#DCFCE7', '#15803D']; S.bSteps = ['done', 'done', 'done', 'done']; S.bChip = ['INC-1042 · Closed ✅', grn[0], grn[1]]; });
    RECAP = { cap: 'Full loop: camera down → Flink → Temporal → ServiceNow → field fix → closed ✅', badge: ['📷 CAM-14 · replaced ✅', ...grn], boxes: ['a-edge', 'a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-act'] };
  } else {
    st('w', 'act-x', 'tr', 'deep', 'g', '<b>CAM-14</b> is back and stays healthy (e.g. 5 min) → Flink signals the <b>same</b> incident workflow', (S) => { S.wSteps[2] = 'done'; S.act['act-x'] = ['🟢 back online', grn[0], grn[1]]; });
    st('w', 'ws4', 'br', 'core', 'g', 'Step 4 · Auto-resolve: signal received → resolve the ticket', (S) => { S.wSteps[3] = 'on'; S.wl[3] = ['✓ signal received → resolving ticket', '#15803D']; });
    st('w', 'act-sn', 'tr', 'core', 'g', 'Ticket <b>INC-1042</b> auto-resolved ✅', (S) => { S.act['act-sn'] = ['INC-1042 · Resolved ✅', grn[0], grn[1]]; });
    st('w', 'act-oc', 'tr', 'pass', 'g', 'On-call stood down — no human needed. Workflow complete ✅', (S) => {
      S.wSteps[3] = 'done'; S.act['act-oc'] = ['✅ stood down', grn[0], grn[1]]; S.wstat = ['✅ Completed', '#DCFCE7', '#15803D']; S.bSteps = ['done', 'done', 'done', 'done']; S.bChip = ['INC-1042 · Resolved ✅', grn[0], grn[1]]; });
    RECAP = { cap: 'Full loop: camera down → Flink → Temporal → ServiceNow → back online → auto-resolved ✅', badge: ['📷 CAM-14 · back online ✅', ...grn], boxes: ['a-edge', 'a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-act'] };
  }
  }
  TRS = [{ child: 'sceneB', box: [1350, 559, 380] }, { child: 'sceneW', box: [1285, 375, 510] }];
}
if (VID === 3) {
  ARCH_HEAD(['Edge site: footfall sensor <b>SNS-03</b> reports telemetry every minute']);
  st('a', 'a-flink', 'br', 'deep', 'g', 'Flink: <b>SNS-03</b> latency is 3.2 s… the rule watches a 10-min window', (S, t, s) => {
    S.aBadge = ['🌡 SNS-03 · latency 3.2 s', ...yel]; const m = Math.min(9, Math.floor(10 * prog(t, s.ta, s.te))); S.chip = [`⏱ SNS-03 slow for ${m} / 10 min`, ...yel]; });
  st('a', 'a-flink', 'br', 'core', 'y', 'Rule fires → <b>SLOW</b> (minor)', (S) => { S.chip = ['⚠ SNS-03 slow for 10 min → SLOW (minor)', ...yel]; }, { stay: true });
  st('a', 'a-act', 'tr', 'core', 'y', 'Minor lane: batched into a 15-min site digest · nobody gets paged', (S) => { S.laneY = 1; });
  st('a', 'a-dash', 'tr', 'core', 'y', 'Alert status is pushed to the tenant dashboard', null, { via: [[1510, 690], [692, 690]] });
  zoomIn(0, 'Zooming in: the tenant dashboard 🔍');
  st('d', 'd-SNS-03', 'br', 'core', 'y', 'Site-07 dashboard: <b>SNS-03</b> turns 🟡 DEGRADED', (S) => { S.devs['SNS-03'] = 'y'; S.tiles = [48, 47, 1, 0]; }, { pop: true });
  st('d', 'alist', 'br', 'core', 'y', 'It lands in the site alert feed — minor, no page', (S) => { S.alerts = 'y'; });
  st('d', 'toast', 'tr', 'deep', 'y', 'One 15-min digest goes out by Email + Slack — not 50 pings', (S, t, s) => { S.toastT = s.h0; }, { early: true });
  RECAP = { cap: 'Full loop: slow sensor → Flink → minor lane → digest + dashboard 🟡', badge: ['🌡 SNS-03 · flagged · in site digest', ...yel], boxes: ['a-edge', 'a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-act', 'a-dash'] };
  TRS = [{ child: 'sceneD', box: [570, 559, 300] }];
}
if (VID === 4) {
  ARCH_HEAD(['Edge site: thermostat <b>TH-05</b> sends telemetry every minute']);
  st('a', 'a-flink', 'br', 'deep', 'g', 'Flink: dedups, enriches, rolls up 1-hour aggregates');
  st('a', 'a-stor', 'tr', 'deep', 'g', 'History in ClickHouse: raw <b>hot</b> for 7 days · rollups <b>warm</b> for 6 months · S3 cold archive', (S) => { S.rows = 1; }, { via: [[1514, 425], [1082, 425]] });
  st('a', 'a-dash', 'tr', 'core', 'g', 'Live path: Flink also pushes each update straight to the <b>dashboard service</b> → SSE · charts refresh instantly', (S) => { S.rows = 0; });
  zoomIn(0, 'Zooming in: the tenant dashboard 🔍');
  st('d', 'livepill', 'bl', 'core', 'g', 'Site-07 view: every device, live status over SSE', null, { pop: true, pt: () => { const r = rectOf('livepill'); return [r.x - 26, r.y + r.h / 2, r.x + r.w / 2, r.y + r.h / 2]; } });
  st('d', 'd-TH-05', 'br', 'core', 'g', 'Click a device…', (S, t, s) => { S.detT = s.ta + 0.4; });
  st('d', 'p-det', 'br', 'deep', 'g', '…live telemetry streams in over SSE · history from the hot store', null);
  RECAP = { cap: 'Full loop: sensor → Kafka → Flink → live push (SSE) to the dashboard · history in ClickHouse ⚡', badge: null, boxes: ['a-edge', 'a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-stor', 'a-dash'] };
  TRS = [{ child: 'sceneD', box: [570, 559, 300] }];
}

if (VID === 6) {
  const mT = (a, b) => (S, t, s) => { S.mT = a + (b - a) * prog(t, s.ta, s.te); };
  st('a', 'a-edge', 'br', 'core', 'g', 'Regional outage ends · ~2,000 site gateways reconnect and flush hours of spooled telemetry', (S) => { S.aBadge = ['📡 2,000 sites flushing spools', ...org]; });
  st('a', 'a-gw', 'br', 'pass', 'g', 'Gateway: per-tenant rate limits absorb part of the burst');
  st('a', 'a-ing', 'br', 'pass', 'g', 'Ingestion autoscales · heartbeats go to their own <b>priority topic</b>');
  st('a', 'a-kafka', 'br', 'core', 'y', 'Kafka absorbs the burst · consumer lag starts climbing', (S) => { S.obsBad = 1; });
  st('a', 'a-flink', 'br', 'core', 'y', 'Flink falls behind · telemetry alerts would now arrive late', (S) => { S.chip = ['⚠ backpressure · falling behind', ...org]; });
  st('a', 'a-obsp', 'tl', 'core', 'y', 'Observability: Datadog tiles turn red — lag, freshness, throughput', null, { pt: () => { const r = rectOf('a-ob0'); return [r.x - 26, r.y + r.h / 2, r.x + r.w / 2, r.y + r.h / 2]; } });
  zoomIn(0, 'Zooming in: the Datadog dashboard 🔍');
  st('m', 'm-ingest', 'tr', 'core', 'y', 'Spools flush: gateway ingress rises from 200K envelopes/sec normal peak to a designed-for 500K envelopes/sec burst; Kafka carries the unpacked device readings', mT(0.04, 0.12), { pop: true });
  st('m', 'm-lag', 'tr', 'core', 'y', 'Consumer lag climbs · Kafka buffers within retention, so nothing is lost', mT(0.12, 0.14));
  st('m', 'm-mon', 'bl', 'core', 'r', 'Monitor fires: freshness p99 > 2 min → on-call paged', (S) => { S.mT = 0.14; S.mAlert = 'fire'; S.mAnn = 1; }, { pt: () => { const r = rectOf('m-mon'); return [r.x - 30, r.y + r.h / 2, r.x + r.w / 2, r.y + r.h / 2]; } });
  st('m', 'm-fresh', 'tr', 'deep', 'y', 'Telemetry freshness climbs… <b>heartbeats stay fresh</b> — a priority topic plus reserved heartbeat processing protects DEAD detection', (S, t, s) => { S.mAlert = 'fire'; S.mAnn = 1; mT(0.14, 0.48)(S, t, s); });
  st('m', 'm-bp', 'tr', 'deep', 'v', '🤖 <b>Automatic fix 1</b> · the autoscaler sees Flink falling behind → adds workers 24 → 48 · nobody clicks anything', (S, t, s) => { S.mAnn = 2; mT(0.48, 0.62)(S, t, s); });
  st('m', 'm-e2', 'tr', 'deep', 'v', '🤖 <b>Automatic fix 2</b> · the writer flushes every 1 s <b>or</b> 50K rows → in a burst, chunks grow on their own', (S, t, s) => { S.mAnn = 3; mT(0.62, 0.72)(S, t, s); });
  st('m', 'm-mon', 'bl', 'deep', 'v', '👩‍💻 <b>DevOps</b> checks the dashboard · heartbeats fresh, autoscaler under its limit → no action, just watch', null, { pt: () => { const r = rectOf('m-mon'); return [r.x - 30, r.y + r.h / 2, r.x + r.w / 2, r.y + r.h / 2]; } });
  st('m', 'm-mon', 'bl', 'deep', 'v', '👩‍💻 Still not draining? Autoscaler at its max → raise the limit (source readers up to the partition count; keyed operators scale separately) or add K8s nodes', null, { stay: true });
  st('m', 'm-mon', 'bl', 'deep', 'v', '👩‍💻 ClickHouse the bottleneck? Scale ClickHouse · <b>never</b> add Kafka partitions mid-incident — it breaks per-device order', null, { stay: true });
  st('m', 'm-lag', 'tr', 'deep', 'g', 'Lag drains · freshness back under 2 min · monitor resolves', (S, t, s) => { mT(0.72, 1)(S, t, s); if (S.mT > 0.9) { S.mAlert = 'ok'; S.mAnn = 4; S.obsBad = 0; } });
  st('m', 'm-fresh', 'tr', 'core', 'g', 'Takeaway: automation handles the expected burst · humans step in past the guardrails · alert on <b>freshness</b>', (S) => { S.mT = 1; S.mAlert = 'ok'; S.mAnn = 4; S.obsBad = 0; });
  RECAP = { cap: 'Burst → Kafka buffers → detect → protect heartbeats → scale → drain ✅', badge: ['📡 burst absorbed · lag drained ✅', ...grn], boxes: ['a-edge', 'a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-obsp'] };
  TRS = [{ child: 'sceneM', box: [800, 806, 560] }];
}

if (VID === 7) {
  ARCH_HEAD(['Edge site: camera <b>CAM-11</b> sends a heartbeat every minute · the gateway batches them per site']);
  STOPS[STOPS.length - 2].cap = 'Ingestion: heartbeats go to their own <b>priority topic</b> — never stuck behind bulk telemetry';
  st('a', 'a-flink', 'br', 'deep', 'g', 'Flink: the heartbeat <b>resets CAM-11\'s 5-min timer</b> · status stays ONLINE', (S) => { S.chip = ['✓ CAM-11 · timer reset · 0:00 / 5:00', ...grn]; });
  st('a', 'a-flink', 'br', 'core', 'g', 'No status change → no incident emitted · freshness updates continue separately; only transitions enter incident lanes', null, { stay: true });
  st('a', 'a-stor', 'tr', 'core', 'g', 'Latest status and counts land in <b>Redis</b> (live state)', null, { via: [[1514, 425], [1082, 425]] });
  st('a', 'a-dash', 'tr', 'core', 'g', 'Dashboard service reads Redis · Flink pushes changes live → SSE to every open page');
  zoomIn(0, 'Zooming in: the tenant dashboard 🔍');
  st('d', 'd-CAM-11', 'br', 'core', 'g', 'Site-07: <b>CAM-11 ONLINE</b> · last heartbeat just now', null, { pop: true });
  st('d', 't-on', 'br', 'core', 'g', 'Tiles come from the Redis cache — no counting 100M rows on every page load');
  st('d', 'livepill', 'bl', 'core', 'g', 'If CAM-11 ever goes quiet for 5 min, this card turns red — that\'s the red-alert flow', null, { pt: () => { const r = rectOf('livepill'); return [r.x - 26, r.y + r.h / 2, r.x + r.w / 2, r.y + r.h / 2]; } });
  RECAP = { cap: 'Full loop: heartbeat → priority topic → Flink timer reset → Redis → live status 💓', badge: null, boxes: ['a-edge', 'a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-stor', 'a-dash'] };
  TRS = [{ child: 'sceneD', box: [570, 559, 300] }];
}

if (VID === 8) {
  st('a', 'a-edge', 'br', 'core', 'o', 'Tenant <b>Beta Mart</b>: a buggy firmware floods 10× normal traffic', (S) => { S.aBadge = ['🌊 Beta Mart · 10× traffic', ...org]; });
  st('a', 'a-gw', 'br', 'deep', 'o', 'Gateway: Beta hits <b>its own quota</b> → throttled · the flood stops at the front door', (S) => { S.aBadge = ['🚫 Beta throttled at its quota', ...org]; });
  st('a', 'a-edge', 'br', 'core', 'b', 'Meanwhile tenant <b>Acme Retail</b>: camera CAM-14 heartbeats as normal', (S) => { S.aBadge = ['✅ Acme unaffected · own quota', ...grn]; });
  st('a', 'a-gw', 'br', 'core', 'b', 'Acme stays within its budget · distributed quotas bound Beta; shared resources still need capacity headroom');
  st('a', 'a-ing', 'br', 'core', 'b', 'Ingestion tags every message with its <b>tenant</b>');
  st('a', 'a-kafka', 'br', 'deep', 'b', 'Kafka: shared topics, partitioned by <b>tenant + device</b> · every message carries its tenant tag');
  st('a', 'a-flink', 'br', 'deep', 'b', 'Flink applies <b>Acme\'s rules</b>: DEAD after 5 min · another tenant can use 10', (S) => { S.chip = ['🏢 Acme rule · DEAD after 5:00', '#E5EDFF', '#1D4ED8', '#93B4F5']; });
  st('a', 'a-ctrl', 'tr', 'core', 'b', 'Control plane: tenants, sites, RBAC · rule overrides pushed live to Flink · China tenants in an isolated region', null, { via: [[1350, 425], [215, 425]] });
  st('a', 'a-stor', 'tr', 'core', 'b', 'Storage is shared too: every row has <b>tenant_id</b> · every query is scoped by tenant', null, { via: [[215, 690], [940, 690]] });
  st('a', 'a-dash', 'tr', 'core', 'b', 'Dashboards: <b>RBAC</b> · an admin only ever sees their own tenant');
  zoomIn(0, 'Zooming in: Acme\'s dashboard 🔍');
  st('d', 'livepill', 'bl', 'core', 'b', 'Acme\'s admin view: only Acme\'s 214 sites · Beta\'s data is never in the response', null, { pop: true, pt: () => { const r = rectOf('livepill'); return [r.x - 26, r.y + r.h / 2, r.x + r.w / 2, r.y + r.h / 2]; } });
  st('d', 'd-CAM-14', 'br', 'core', 'b', 'CAM-14 is healthy · Beta is limited at admission; per-tenant freshness verifies isolation');
  RECAP = { cap: 'Two tenants, one platform: own quotas · tenant tags · own rules · scoped queries · RBAC 🏢', badge: ['✅ Acme fine · Beta throttled', ...grn], boxes: ['a-edge', 'a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-ctrl', 'a-stor', 'a-dash'] };
  TRS = [{ child: 'sceneD', box: [570, 559, 300] }];
}

if (VID === 9) {
  st('a', 'a-ctrl', 'tr', 'core', 'v', 'Platform admin starts a rollout: camera firmware <b>4.3.0</b> · first wave = 1% canary');
  st('a', 'a-edge', 'br', 'core', 'v', 'Canary: 1% of cameras, spread across tenants, sites and models · gateway agents download 4.3.0', (S) => { S.aBadge = ['⬇ canary 1% · downloading 4.3.0', ...org]; }, { via: [[175, 426]] });
  st('a', 'a-edge', 'br', 'core', 'v', 'Agent installs into the spare slot (A/B) and reboots · the old image stays for rollback', (S) => { S.aBadge = ['🔁 rebooted into 4.3.0 · A/B slots', ...org]; }, { stay: true });
  st('a', 'a-gw', 'br', 'pass', 'g', 'Every heartbeat now carries the firmware version');
  st('a', 'a-ing', 'br', 'pass', 'g', 'Ingestion tags tenant, device model and firmware version');
  st('a', 'a-kafka', 'br', 'pass', 'g', 'Kafka: the same heartbeats + telemetry topics · no special pipeline for rollouts');
  st('a', 'a-flink', 'br', 'deep', 'g', 'Flink compares canary vs baseline per version: crash loops, heartbeat gaps, error rate', (S) => { S.chip = ['📊 4.3.0 vs 4.2.1 · comparing', '#E5EDFF', '#1D4ED8', '#93B4F5']; });
  st('a', 'a-flink', 'br', 'core', 'g', 'Healthy for 24 h → the health gate passes', (S) => { S.chip = ['✅ canary healthy · gate passed', ...grn]; }, { stay: true });
  st('a', 'a-ctrl', 'tr', 'core', 'v', 'Control plane widens the rollout: 1% → 10% · every wave waits for its own health gate', (S) => { S.aBadge = ['⬆ wave 2 · 10% on 4.3.0', ...org]; }, { via: [[1350, 425], [215, 425]] });
  st('a', 'a-flink', 'br', 'deep', 'r', 'Wave 2: camera model X2 shows heartbeat gaps 3× baseline → the gate fails', (S) => { S.chip = ['🔴 model X2 · gaps 3× baseline', ...red]; }, { via: [[215, 425], [1350, 425]] });
  st('a', 'a-ctrl', 'tr', 'core', 'r', 'Automatic halt: no new device gets 4.3.0 · platform admin alerted', (S) => { S.aBadge = ['⏸ rollout halted at wave 2', ...red]; }, { via: [[1350, 425], [215, 425]] });
  st('a', 'a-edge', 'br', 'core', 'r', 'Example: a local health-confirmation watchdog selects the old A/B slot, even when the camera cannot receive cloud commands', (S) => { S.aBadge = ['↩ X2 back on 4.2.1', ...grn]; }, { via: [[175, 426]] });
  st('a', 'a-dash', 'tr', 'core', 'g', 'Dashboards: wave progress and health per version · the fix ships later as 4.3.1 through the same waves', null, { via: [[175, 430], [570, 430]] });
  RECAP = { cap: 'Canary 1% → health gate → widen in waves · bad wave → auto-halt + rollback 🧪', badge: ['✅ fleet safe · fix ships as 4.3.1', ...grn], boxes: ['a-ctrl', 'a-edge', 'a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-dash'] };
  TRS = [];
}

if (VID >= 10 && VID <= 15 && window.CICD) {
  const D = window.CICD;
  const RUN = (id, txt) => (S, t, s) => { S.cst[id] = prog(t, s.ta, s.te) < 0.6 ? ['run', 'running…'] : ['ok', txt]; };
  st('a', D.start, 'br', 'core', 'v', D.change);
  zoomIn(0, 'Zooming in: how that change reaches production 🔍');
  D.r1.forEach(([cap, ok, w], i) => st('c', 'c' + (i + 1), 'br', w, 'v', cap, RUN('c' + (i + 1), ok), i === 0 ? { pop: true } : {}));
  D.r2.forEach(([cap, ok, w], i) => st('c', 'd' + (i + 1), 'br', w, i === 5 ? 'g' : 'v', cap, RUN('d' + (i + 1), ok), i === 0 ? { via: [[1701, 436], [191, 436]] } : {}));
  st('c', 'f1', 'tr', 'core', 'g', D.foot[0]);
  st('c', 'f2', 'tr', 'core', 'g', D.foot[1]);
  RECAP = { cap: D.recap, badge: null, boxes: [D.start] };
  TRS = [{ child: 'sceneC', box: D.box }];
}

if (VID === 16) {   // alert storm
  st('a', 'a-edge', 'br', 'core', 'r', 'Power cut at Acme <b>Site-07</b>: 200 devices go silent at once — gateways too', (S) => { S.aBadge = ['⚡ Site-07 · power cut · 200 devices', ...red]; S.obsT = { 3: ['▼ −200 devices', 1] }; });
  st('a', 'a-gw', 'br', 'pass', 'r', 'The cloud sees the whole site go quiet');
  st('a', 'a-kafka', 'br', 'pass', 'r', 'No heartbeats arrive for any Site-07 device');
  st('a', 'a-flink', 'br', 'deep', 'r', 'After 5 min, device and gateway timers produce failure candidates; arrival order can differ', (S) => { S.chip = ['🔴 200 × DEAD · Site-07', ...red]; });
  st('a', 'a-flink', 'br', 'deep', 'r', 'Example: a bounded site correlation window joins gateway state and device candidates before paging', (S) => { S.chip = ['🧩 root cause: SITE-07 DOWN', ...org]; }, { stay: true });
  st('a', 'a-act', 'tr', 'deep', 'r', 'Suppression: <b>one</b> SITE-DOWN incident pages on-call · the 200 device alerts are grouped under it', (S) => { S.laneR = 1; });
  st('a', 'a-act', 'tr', 'core', 'r', 'One ServiceNow ticket for the site · device tickets are held while the site is down', null, { stay: true });
  st('a', 'a-dash', 'tr', 'core', 'y', 'Dashboard: Site-07 shows SITE DOWN · 200 affected devices · no wall of red', null, { via: [[1350, 690], [570, 690]] });
  st('a', 'a-edge', 'br', 'deep', 'g', 'Power returns → gateways reconnect · fresh heartbeats stay stable → the site incident auto-resolves; devices still silent get their own alerts', (S) => { S.aBadge = ['✅ Site-07 back · auto-resolved', ...grn]; S.chip = null; S.laneR = 0; S.obsT = {}; }, { via: [[570, 430], [175, 430]] });
  RECAP = { cap: 'Power cut → 200 DEAD → correlated to one site → one page, one ticket → auto-resolves ⚡', badge: ['✅ Site-07 back online', ...grn], boxes: ['a-edge', 'a-flink', 'a-act', 'a-dash'] };
  TRS = [];
}
if (VID === 17) {   // Flink crash
  st('a', 'a-flink', 'br', 'deep', 'r', 'A Kubernetes node dies → the Flink job loses a TaskManager and fails', (S) => { S.chip = ['💥 job failed · restarting', ...red]; S.obsT = { 0: ['▲ lag rising', 1], 2: ['⟳ restoring', 1] }; });
  st('a', 'a-flink', 'br', 'deep', 'v', 'Kubernetes reschedules it · Flink restores state/timers from the last completed checkpoint; monitor its age', (S) => { S.chip = ['♻ restored from checkpoint', '#E5EDFF', '#1D4ED8', '#93B4F5']; }, { stay: true });
  st('a', 'a-kafka', 'br', 'deep', 'v', 'Kafka still holds everything since that checkpoint → Flink rewinds its offsets and replays', (S) => { S.obsT = { 0: ['▲ catching up', 1], 2: ['● OK', 0] }; });
  st('a', 'a-flink', 'br', 'core', 'v', 'Replayed transitions may be resent · example recovery gates suppress overdue-timer pages until pipeline freshness recovers', null, { });
  st('a', 'a-act', 'tr', 'deep', 'g', 'Idempotent actions: same correlation ID → no duplicate pages, no duplicate tickets');
  st('a', 'a-obsp', 'tl', 'core', 'g', 'Datadog: lag spikes and drains in minutes · a restart alert tells the team it happened', (S) => { S.obsT = {}; }, { pt: () => { const r = rectOf('a-ob0'); return [r.x - 26, r.y + r.h / 2, r.x + r.w / 2, r.y + r.h / 2]; } });
  RECAP = { cap: 'Crash → restore checkpoint → replay Kafka → idempotent actions · nothing lost, nothing doubled ♻', badge: null, boxes: ['a-kafka', 'a-flink', 'a-act', 'a-obsp'] };
  TRS = [];
}
if (VID === 18) {   // hot partition
  st('a', 'a-edge', 'br', 'core', 'r', 'A camera at Site-12 enters a crash loop: <b>1,000 msgs/sec</b> from a single device', (S) => { S.aBadge = ['🔥 CAM-77 · 1,000 msgs/sec', ...red]; });
  st('a', 'a-gw', 'br', 'pass', 'r', 'It\'s within the tenant\'s quota — Acme is big — so it gets through');
  st('a', 'a-kafka', 'br', 'deep', 'r', 'All of one device\'s messages hash to one partition: <b>P7</b> lags, the other 63 are fine', (S) => { S.obsT = { 0: ['▲ P7 only', 1] }; });
  st('a', 'a-flink', 'br', 'deep', 'r', 'P7 has one source reader; downstream keyBy can spread devices, but one hot device still has one keyed owner', (S) => { S.chip = ['🐢 worker 7 behind · P7', ...org]; S.obsT = { 0: ['▲ P7 only', 1], 1: ['▲ P7 devices late', 1] }; });
  st('a', 'a-obsp', 'tl', 'deep', 'y', 'Datadog lag <b>by partition</b>: one hot partition points to one hot key, not a capacity problem', null, { pt: () => { const r = rectOf('a-ob0'); return [r.x - 26, r.y + r.h / 2, r.x + r.w / 2, r.y + r.h / 2]; } });
  st('a', 'a-gw', 'br', 'deep', 'g', 'Fix: a <b>per-device</b> rate limit at the gateway caps CAM-77 · the excess is dropped and counted', (S) => { S.aBadge = ['🚫 CAM-77 capped at the gateway', ...org]; }, { via: [[60, 400]] });
  st('a', 'a-flink', 'br', 'core', 'g', 'P7 drains · Flink raises a "crash loop" alert for CAM-77 itself', (S) => { S.chip = ['✅ P7 drained · CAM-77 flagged', ...grn]; S.obsT = {}; });
  RECAP = { cap: 'Hot key → one partition lags → per-device limit at the gateway → drains 🔥', badge: ['✅ CAM-77 contained', ...grn], boxes: ['a-edge', 'a-gw', 'a-kafka', 'a-flink', 'a-obsp'] };
  TRS = [];
}

if (VID === 19) {
  st('a', 'a-edge', 'br', 'deep', 'v', 'Design scenario: legitimate fleet traffic stays 10× higher · 200K → an illustrative 2M batched envelopes/sec', S => { S.aBadge = ['10× sustained load · capacity exercise', ...org]; });
  st('a', 'a-obsp', 'tl', 'deep', 'y', 'Measure envelopes, bytes, readings and distinct devices separately · verify p99 freshness, backlog slope and completed-checkpoint age', S => { S.obsT = { 0: ['▲ growing steadily', 1], 1: ['▲ freshness slipping', 1], 3: ['10× sustained (example)', 1] }; });
  st('a', 'a-gw', 'br', 'deep', 'v', 'Reserve heartbeat capacity end to end · tenant/device budgets bound bytes and readings; queues buy time, not permanent capacity');
  st('a', 'a-ing', 'br', 'deep', 'v', 'Scale ingestion against measured CPU/network and Kafka produce latency · batch envelopes unpack before device-keyed routing');
  st('a', 'a-kafka', 'br', 'deep', 'v', 'Add broker disk/network and recovery headroom · adding partitions can move device keys, so protect ordering during the change');
  st('a', 'a-kafka', 'br', 'deep', 'v', 'Example bulk-topic cutover: fence old producers/retries → buffer arrivals durably → drain every old partition to its recorded boundary', null, { stay: true });
  st('a', 'a-flink', 'br', 'deep', 'v', 'Take a savepoint; preserve compatible keyed state and operator IDs. Start the new-topic source at explicit offsets; old-topic offsets do not transfer');
  st('a', 'a-flink', 'br', 'deep', 'v', 'Scale source readers and keyed operators separately · add slots/nodes, tune state/checkpoints, and isolate liveness from telemetry');
  st('a', 'a-stor', 'tr', 'deep', 'v', 'Scale ClickHouse writers/shards and retention budget · verify merge pressure and disk growth; reconcile versioned replayed writes', null, { via: [[1514, 425], [1082, 425]] });
  st('a', 'a-dash', 'tr', 'deep', 'v', 'Bound query concurrency and SSE fan-out · coalesce slow-viewer updates; reconnect through shared replay or a snapshot');
  st('a', 'a-gw', 'br', 'deep', 'y', 'Capacity still insufficient? Throttle bulk traffic with retry/backoff; sample only eligible telemetry, count drops, and keep heartbeat admission reserved');
  st('a', 'a-obsp', 'tl', 'deep', 'g', 'Soak-test sustained load and node-loss recovery · prove per-tenant freshness and catch-up within retention before raising quotas', S => { S.obsT = { 0: ['✓ capacity gate', 0], 1: ['✓ freshness gate', 0], 3: ['2M/s scenario · verify', 0] }; });
  RECAP = { cap: 'Sustained 10× growth → measure → provision each bottleneck → ordered migration → bounded admission → prove recovery', badge: ['Capacity scales by measured gates', ...grn], boxes: ['a-gw', 'a-ing', 'a-kafka', 'a-flink', 'a-stor', 'a-dash', 'a-obsp'] };
  TRS = [];
}

if (PROPOSAL) {
  st('a', 'a-edge', 'br', 'core', 'b', 'Future proposal: ' + PROPOSAL.name + ' · follow one example from existing telemetry to an operator decision');
  st('a', 'a-ing', 'br', 'core', 'b', 'Existing ingestion checks gateway identity and device/tenant scope. Authentication identifies the sender; it does not prove that every reading is true.');
  st('a', 'a-kafka', 'br', 'core', 'b', 'Reuse retained telemetry for a separately budgeted Flink candidate job. Its compute and broker read/write quotas protect reserved critical capacity; bound candidate age and backlog.');
  st('a', 'a-flink', 'br', 'deep', 'b', 'Flink filters candidates into a durable topic; a separate consumer starts the decision workflow. Publish failures retry within that optional branch. Critical DEAD/thermal alerts never wait for candidate publication, Jev or GenAI.');
  st('a', 'a-stor', 'tr', 'deep', 'b', 'Reuse authorized ' + PROPOSAL.input.toLowerCase() + '. ' + PROPOSAL.new_source + ' must be integrated separately; these records are not assumed to exist in the current stores.', null, { via: [[1514, 425], [1082, 425]] });
  PROPOSAL.components.forEach((c, i) => st('a', 'a-ai' + (i + 1), 'br', 'deep', 'b', c[3]));
  st('a', 'a-act', 'br', 'deep', 'b', PROPOSAL.output + '. Carry a stable case/action key into an externally enforced idempotent write; reconcile ambiguous results before retrying external work.', null, { via: [[1570, 932], [1570, 700], [1350, 700]] });
  st('a', 'a-dash', 'br', 'core', 'g', 'Show authorized evidence, its age, the recommendation and review outcome. Expire stale suggestions; never display an unavailable AI assessment as a healthy device.');
  RECAP = { cap: 'Existing platform → proposed evidence/model/GenAI components → reviewed action · simulated future design', badge: null, boxes: ['a-flink', 'a-stor', 'a-ai1', 'a-ai2', 'a-ai3', 'a-ai4', 'a-act', 'a-dash'] };
  TRS = [];
}

// ---------- compile timeline ----------
const T0 = HOOK_R + P.intro;            // first stop arrival
let tcur = T0, prev = null, stepNo = 0; const CAPS = [[HOOK_R - 0.3, T0 - 0.1, '', 'Commercial IoT monitoring · 100M+ devices · 200K gateway envelopes/sec normal peak']];
STOPS = STOPS.filter(s => !(VER === 'li' && s.li === false));
STOPS.forEach((s, i) => {
  if (s.zoom) { const tr = TRS[s.tr]; tr.a = tcur + 0.2; tr.b = tr.a + P.zoom; CAPS.push([tr.a, tr.b, '', s.cap]); tcur = tr.b + 0.1; prev = null; return; }
  s.anc = s.pt ? s.pt() : anchor(s.id, s.corner, s.L);
  if (s.stay || !prev) { s.h0 = tcur; s.ta = tcur + (prev ? 0 : 0.45); }
  else { const pts = [prev.anc.slice(0, 2), ...(s.via || []), s.anc.slice(0, 2)]; let len = 0; for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    s.path = pts; s.h0 = tcur; s.ta = tcur + P.hop + len / P.hopPx; }
  s.te = s.ta + P.hold[s.w]; s.prevStop = prev; s.step = ++stepNo;
  CAPS.push([s.h0, s.te, String(s.step), s.cap]); tcur = s.te; prev = s;
});
const STORY_END = tcur;
{ let t0 = STORY_END + 0.5; for (let i = TRS.length - 1; i >= 0; i--) { TRS[i].c = t0; TRS[i].d = t0 + P.zoom; t0 += P.zoom + 0.2; } var RECAP_T = t0; }
if (TRS.length) CAPS.push([STORY_END + 0.4, RECAP_T, '', 'Zooming out: back to the big picture 🔭']); CAPS.push([RECAP_T, RECAP_T + P.recap, '', RECAP.cap]);
const EC = RECAP_T + P.recap; const TOTAL = EC + 0.8 + P.endHold;
const ARCH_STOP_IDS = [...new Set(STOPS.filter(s => s.L === 'a').map(s => s.id))];

// ---------- render helpers ----------
function setBadge(el, spec) { if (!spec) { el.style.display = 'none'; return; } el.style.display = 'block'; el.innerHTML = spec[0]; el.style.background = spec[1]; el.style.color = spec[2]; el.style.border = '1.5px solid ' + (spec[3] || spec[2]); }
function devState(id, s) {
  const d = E('d-' + id); if (!d) return; const dot = d.querySelector('.sd'), stt = d.querySelector('.st'), mt = d.querySelector('.mt');
  if (!d.dataset.mt) d.dataset.mt = mt.textContent;
  d.classList.remove('yel', 'red'); dot.className = 'sd g'; stt.className = 'st g2'; stt.textContent = 'ONLINE'; mt.textContent = d.dataset.mt;
  if (s === 'y') { d.classList.add('yel'); dot.className = 'sd y'; stt.className = 'st y2'; stt.textContent = 'DEGRADED · SLOW'; mt.textContent = 'lat 3.2 s'; }
  if (s === 'r') { d.classList.add('red'); dot.className = 'sd r'; stt.className = 'st r2'; stt.textContent = 'DOWN · 3 min'; mt.textContent = 'no heartbeat'; }
}
const AL = {
  y: '<div class="al" style="border-color:#F5B70A;background:#FFFDF5"><span class="sd y" style="margin-top:5px"></span><div><b>SNS-03 · SLOW</b> · latency 3.2 s<small>Minor · added to 15-min site digest · just now</small></div></div>',
  r: '<div class="al"><span class="sd r" style="margin-top:5px"></span><div><b>CAM-14 · DOWN</b> · no heartbeat<small>Critical · INC-1042 open · P1 · 3 min ago</small></div></div>',
  ok: '<div class="al" style="color:#15803D"><span class="sd g" style="margin-top:5px"></span><div><b>No active alerts</b><small>All 48 devices healthy</small></div></div>',
  ok2: '<div class="al" style="color:#15803D"><span class="sd g" style="margin-top:5px"></span><div><b>No critical alerts</b><small>47 of 48 devices healthy</small></div></div>'
};
function chart(svg, t, base, a1, a2, w, h, lo, hi, color) {
  const n = 60, pts = [];
  for (let i = 0; i < n; i++) { const x = i + t * 6; const v = base + a1 * Math.sin(x / 5.3) + a2 * Math.sin(x / 1.7 + 1.3); pts.push([i * w / (n - 1), h - 8 - (v - lo) / (hi - lo) * (h - 16), v]); }
  const line = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  svg.innerHTML = `<polygon points="0,${h} ${line} ${w},${h}" fill="${color}" opacity=".10"/><polyline points="${line}" fill="none" stroke="${color}" stroke-width="2.5"/><circle cx="${pts[n - 1][0]}" cy="${pts[n - 1][1]}" r="5" fill="${color}"/>`;
  return pts[n - 1][2];
}
function along(pts, f) { let L = [], tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  let r = f * tot; for (let i = 0; i < L.length; i++) { if (r <= L[i] || i == L.length - 1) { const k = L[i] ? Math.min(r / L[i], 1) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; } r -= L[i]; } }

const MSIM = (() => { const N = 121, SCALE = 66, SINK = 80, ing = [], lag = [], fr = [], hb = [], bp = [], ck = []; let L = 0;
  for (let i = 0; i < N; i++) { const up = Math.min(1, Math.max(0, (i - 8) / 6)), dn = Math.min(1, Math.max(0, (i - 40) / 10)); const x = 200 + 300 * up * (1 - dn) + 4 * Math.sin(i / 3);
    const cap = i < SCALE ? 260 : (i < SINK ? 470 : 600); L = Math.max(0, L + (x - cap) * 60 / 1000); ing.push(x); lag.push(L);
    fr.push(Math.max(0.05, L * 1000 / (cap * 60))); hb.push(0.07 + 0.01 * Math.sin(i / 2)); const b = L > 0.5 ? (i < SCALE ? 88 : (i < SINK ? 55 : 12)) : 4; bp.push(b + 3 * Math.sin(i)); ck.push(L > 0.5 ? (i < SCALE ? 48 : 20) : 6); }
  return { N, SCALE, SINK, ing, lag, fr, hb, bp, ck, lagMax: Math.max(...lag), frMax: Math.max(...fr) }; })();
const FOCUS_AMT = id => /^[cdf]\d$/.test(id) ? 0.04 : id.startsWith('c-') ? 0.04 : id.startsWith('m-') ? 0.03 : id === 'a-obsp' ? 0.015 : id.startsWith('a-ob') ? 0.04 : id === 'b-tmp' ? 0.03 : (id.startsWith('ws') ? 0.03 : (id === 'alist' || id === 'p-det' || id === 'toast' || id === 'livepill' ? 0.04 : (id.startsWith('a-') ? 0.11 : 0.08)));
const ALL_FOCUS = [...new Set(STOPS.filter(s => s.id).map(s => s.id).concat(RECAP.boxes))];
const flinkChipOrig = E('a-chip').innerHTML;
const devRects = {}; document.querySelectorAll('.dev').forEach(d => { const r = rectOf(d.id); devRects[d.id] = [r.x + r.w / 2, r.y + r.h / 2]; });

// ---------- camera ----------
function camP(tr, t) { if (tr.c === undefined || t < tr.c) return ease(prog(t, tr.a, tr.b)); return ease(1 - prog(t, tr.c, tr.d)); }
function camera(t) {
  const chain = ['arch'].concat(TRS.map(x => x.child)); let outer = [OX, OY, 1]; const alphas = [];
  chain.forEach((lv, i) => {
    const [Sb, Tx, Ty] = BASE[lv]; let own = [Tx, Ty, Sb]; const tr = TRS[i]; let nextOuter = null, a2 = 0;
    if (tr) { const p = camP(tr, t); const [cx, cy, w] = tr.box; const z = 1920 / (Sb * w); const k = Math.pow(z, p);
      const P0 = [Tx + Sb * cx, Ty + Sb * cy]; const F = [(960 - z * P0[0]) / (1 - z), (540 - z * P0[1]) / (1 - z)];
      own = [F[0] * (1 - k) + k * Tx, F[1] * (1 - k) + k * Ty, k * Sb];
      const Bc = [F[0] + k * (P0[0] - F[0]), F[1] + k * (P0[1] - F[1])]; const g = (k * Sb * w) / 1920;
      nextOuter = [Bc[0] - g * 960, Bc[1] - g * 540, g]; a2 = Math.max(0, Math.min(1, (p - 0.52) / 0.12)); a2 = a2 * a2 * (3 - 2 * a2); }
    const fin = [outer[0] + outer[2] * own[0], outer[1] + outer[2] * own[1], outer[2] * own[2]];
    E(lv).style.transform = `translate(${fin[0]}px,${fin[1]}px) scale(${fin[2]})`; alphas.push(a2);
    if (nextOuter) outer = [outer[0] + outer[2] * nextOuter[0], outer[1] + outer[2] * nextOuter[1], outer[2] * nextOuter[2]];
  });
  let vis = 1; chain.forEach((lv, i) => { E(lv).style.opacity = (TRS[i] && camP(TRS[i], t) >= 0.999) ? 0 : vis; vis *= alphas[i]; });
}

// ---------- frame ----------
function setT(t) {
  // opening + ending
  const hp = ease(prog(t, 1.8, 2.6)); const hk = E('hook');
  hk.style.display = hp >= 1 ? 'none' : 'flex'; hk.style.opacity = 1 - hp; hk.style.filter = hp > 0 ? `blur(${16 * hp}px)` : ''; hk.style.transform = `scale(${1 + 0.06 * hp})`;
  E('veil').style.opacity = 1 - hp; E('veil').style.display = hp >= 1 ? 'none' : 'block';
  const dz = prog(t, EC, EC + 0.8), ap = ease(prog(t, EC + 0.6, EC + 1.4));
  const ecd = E('endc'); ecd.style.opacity = ap; ecd.style.filter = ap < 1 ? `blur(${(1 - ap) * 18}px)` : ''; ecd.style.transform = `scale(${0.88 + 0.12 * ap})`;
  const bl = Math.max(12 * (1 - hp), 22 * ease(dz), window.CLOSE_BLUR || 0); document.querySelectorAll('#stage .layer').forEach(l => { l.style.filter = bl > 0.05 ? `blur(${bl}px)` : ''; });
  E('fx').style.opacity = ease(dz); E('fx').style.display = dz > 0 ? 'block' : 'none';
  camera(t);

  // state = base + effects of every stop already reached
  const S = BASE_STATE(); let cur = null;
  for (const s of STOPS) { if (s.zoom) continue; if (t >= s.h0) cur = s; if (t >= (s.early ? s.h0 : s.ta) && s.fx) s.fx(S, t, s); }
  { const cs = STOPS.find(s => s.id === 'd-TH-05'); if (cs && t >= cs.h0) S.cursor = cs; }
  if (t >= RECAP_T - P.zoom) { if (RECAP.badge) S.aBadge = RECAP.badge; S.chip = null; S.laneR = S.laneY = 0; }

  // ball: exactly one, in the current stop's layer
  ['a', 'b', 'w', 'd', 'm', 'c'].forEach(l => { const p = E(l + '-pk'); if (p) p.style.display = 'none'; });
  const inZoom = TRS.some(tr => (t > tr.a && t < tr.b) || (tr.c !== undefined && t > tr.c - 0.3));
  if (cur && !(t > STORY_END + 0.2)) {
    const pk = E(cur.L + '-pk'); const D = BALL[cur.L]; let x, y, sc = 1;
    const boxScale = id => 1 + FOCUS_AMT(id) * focusEnv(id, t);
    if (t < cur.ta && cur.path) { const f = ease(prog(t, cur.h0, cur.ta)); [x, y] = along(cur.path, f); sc = 1 + 0.55 * Math.sin(Math.PI * f); }
    else { const [ax, ay, cx, cy] = cur.anc; const k = boxScale(cur.id); x = cx + (ax - cx) * k; y = cy + (ay - cy) * k;
      if (t < cur.ta) sc = ease(prog(t, cur.h0, cur.ta)); else sc = window.PAUSED ? 1 + 0.16 * Math.abs(Math.sin((window.IDLE || 0) * 3.2)) : 1 + 0.06 * Math.sin((t - cur.ta) * 4); }
    // keep the ball inside its layer while a zoom is taking it away
    const col = COL[(S.ballBy === cur && S.ball) ? S.ball : cur.col];
    Object.assign(pk.style, { display: 'block', left: x + 'px', top: y + 'px', width: D + 'px', height: D + 'px', margin: `-${D / 2}px 0 0 -${D / 2}px`,
      transform: `scale(${sc})`, background: `radial-gradient(circle at 35% 35%, #fff 0 12%, ${col[0]} 45%)`, boxShadow: window.PAUSED ? `0 0 0 4px rgba(255,255,255,.95), 0 0 ${18 + 22 * Math.abs(Math.sin((window.IDLE || 0) * 3.2))}px ${6 + 8 * Math.abs(Math.sin((window.IDLE || 0) * 3.2))}px ${col[1]}` : `0 0 0 4px rgba(255,255,255,.9), 0 0 22px 6px ${col[1]}`, cursor: 'pointer', pointerEvents: 'auto', zIndex: 9, borderRadius: '50%' });
  }

  // focus
  ALL_FOCUS.forEach(id => { const el = E(id); if (!el) return; const e = focusEnv(id, t); const isBox = el.classList.contains('box') || el.classList.contains('wst') || el.classList.contains('dev');
    el.style.transform = e > 0 ? `scale(${1 + FOCUS_AMT(id) * e})` : ''; el.style.zIndex = e > 0 ? 6 : '';
    el.style.boxShadow = e > 0 ? `0 ${10 + 12 * e}px ${26 + 24 * e}px rgba(15,30,51,${0.10 + 0.16 * e}), 0 0 0 ${4 * e}px rgba(37,99,235,${0.28 * e})` : (isBox ? '' : ''); });

  // captions
  const cap = E('cap'); const cc = CAPS.filter(([a, b]) => t >= a && t < b).pop();
  if (cc && t < EC + 0.3 && t > HOOK_R - 0.3) { cap.style.display = 'block'; cap.style.opacity = Math.min(1 - prog(t, EC, EC + 0.3), prog(t, HOOK_R - 0.3, HOOK_R + 0.2));
    cap.innerHTML = cc[3].replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '').trim(); } else cap.style.display = 'none';

  // arch state
  setBadge(E('a-badge'), S.aBadge);
  const ch = E('a-chip'); if (S.chip) { ch.innerHTML = S.chip[0]; Object.assign(ch.style, { background: S.chip[1], color: S.chip[2], borderColor: S.chip[3], borderStyle: 'solid', fontWeight: 700 }); } else { ch.innerHTML = flinkChipOrig; ch.removeAttribute('style'); }
  [['a-laneR', S.laneR, 'rgba(239,68,68,.65)'], ['a-laneY', S.laneY, 'rgba(245,183,10,.7)']].forEach(([id, on, c]) => { E(id).style.boxShadow = on ? `0 0 22px ${c}` : 'none'; });
  document.querySelectorAll('#a-stor .tbl div').forEach((r, i) => { const on = S.rows && i >= 1 && i < 3; r.style.borderColor = on ? '#F08A1C' : ''; r.style.background = on ? 'rgba(240,138,28,.12)' : ''; });
  // scene B
  if (E('sceneB')) { setBadge(E('b-badge'), S.bBadge); for (let i = 0; i < 4; i++) { const el = E('st' + (i + 1)); el.classList.toggle('on', S.bSteps[i] === 'on'); el.classList.toggle('done', S.bSteps[i] === 'done'); }
    const sc = E('snchip'); sc.textContent = S.bChip[0]; sc.style.background = S.bChip[1]; sc.style.color = S.bChip[2]; }
  // scene W
  if (E('sceneW')) {
    for (let i = 0; i < 4; i++) { const el = E('ws' + (i + 1)); el.classList.toggle('on', S.wSteps[i] === 'on'); el.classList.toggle('done', S.wSteps[i] === 'done');
      const lv = E('wl' + (i + 1)); if (S.wl[i]) { lv.textContent = S.wl[i][0]; lv.style.color = S.wl[i][1]; } else lv.textContent = ''; }
    for (const id in S.act) { const el = E('s-' + id); if (el) { el.textContent = S.act[id][0]; el.style.background = S.act[id][1]; el.style.color = S.act[id][2]; } }
    const we = E('wstat'); if (S.sleep) { we.textContent = S.sleep; we.style.background = '#EEF2FF'; we.style.color = '#4338CA'; } else { we.textContent = S.wstat[0]; we.style.background = S.wstat[1]; we.style.color = S.wstat[2]; }
  }
  // observability tiles on the architecture
  if (E('a-obsp')) { [0, 1].forEach(i => { E('a-ob' + i).classList.toggle('bad', !!S.obsBad); });
    E('a-ov2').textContent = E('a-ov4').textContent = '● OK'; E('a-ob2').classList.remove('bad'); E('a-ob4').classList.remove('bad');
    E('a-ov0').textContent = S.obsBad ? '▲ lag rising' : '● OK'; E('a-ov1').textContent = S.obsBad ? '▲ p99 > 2 min' : '● OK'; E('a-ov3').textContent = S.obsBad ? '▲ 500K/s' : '● 200K/s'; E('a-ob3').classList.toggle('bad', !!S.obsBad); }
  if (E('a-obsp') && S.obsT) { const base = ['● OK', '● OK', '● OK', '● 200K/s', '● OK'];
    for (let i = 0; i < 5; i++) { const o = S.obsT[i]; if (o) { E('a-ov' + i).textContent = o[0]; E('a-ob' + i).classList.toggle('bad', !!o[1]); } } }
  // scene C (CI/CD)
  if (E('sceneC')) { document.querySelectorAll('#sceneC .cb').forEach(el => { const v = S.cst[el.id]; el.classList.remove('run', 'ok', 'bad');
      const tx = E(el.id + '-s'); if (v) { el.classList.add(v[0]); tx.textContent = v[1]; } else tx.textContent = 'waiting'; }); }
  // scene M (monitoring)
  if (E('sceneM')) {
    const n = Math.max(1, Math.round((S.mT || 0) * (MSIM.N - 1)));
    const draw = (id, series, lo, hi, thr, fmtv) => {
      const svg = E(id + '-c'), w = 782, h = 226, X = i => i * w / (MSIM.N - 1), Y = v => h - 10 - (v - lo) / (hi - lo) * (h - 20);
      let g = `<line x1="0" x2="${w}" y1="${h - 10}" y2="${h - 10}" stroke="#E3E9F1"/>`;
      if (thr !== null) g += `<line x1="0" x2="${w}" y1="${Y(thr)}" y2="${Y(thr)}" stroke="#EF4444" stroke-dasharray="6 5" opacity=".7"/>`;
      [[MSIM.SCALE, '#7C5CFA', S.mAnn >= 2], [MSIM.SINK, '#7C5CFA', S.mAnn >= 3]].forEach(([i, c, on]) => { if (on) g += `<line x1="${X(i)}" x2="${X(i)}" y1="0" y2="${h - 10}" stroke="${c}" stroke-dasharray="4 4" opacity=".6"/>`; });
      series.forEach(([arr, col]) => { const pts = arr.slice(0, n).map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
        g += `<polygon points="0,${h - 10} ${pts} ${X(n - 1).toFixed(1)},${h - 10}" fill="${col}" opacity=".08"/><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="3"/><circle cx="${X(n - 1)}" cy="${Y(arr[n - 1])}" r="5.5" fill="${col}"/>`; });
      svg.innerHTML = g; };
    draw('m-ingest', [[MSIM.ing, '#2563EB']], 0, 560, null); E('m-v1').textContent = Math.round(MSIM.ing[n - 1]) + 'K/s';
    draw('m-lag', [[MSIM.lag, '#F08A1C']], 0, MSIM.lagMax * 1.1, null); E('m-v2').textContent = (MSIM.lag[n - 1]).toFixed(MSIM.lag[n - 1] < 10 ? 1 : 0) + 'M';
    draw('m-fresh', [[MSIM.fr, '#F08A1C'], [MSIM.hb, '#16A34A']], 0, MSIM.frMax * 1.1, 2); E('m-v3').textContent = MSIM.fr[n - 1] < 1 ? Math.round(MSIM.fr[n - 1] * 60) + ' s' : MSIM.fr[n - 1].toFixed(1) + ' min';
    draw('m-bp', [[MSIM.bp, '#DC2626']], 0, 100, null); E('m-v4').textContent = Math.round(MSIM.bp[n - 1]) + '% · ' + (n - 1 < MSIM.SCALE ? 24 : 48) + ' workers';
    const mm = E('m-mon'); if (S.mAlert === 'fire') { mm.textContent = '🔴 1 monitor alerting'; mm.style.background = '#FEE2E2'; mm.style.color = '#DC2626'; }
    else if (S.mAnn >= 4) { mm.textContent = '✅ Monitor resolved'; mm.style.background = '#DCFCE7'; mm.style.color = '#15803D'; } else { mm.textContent = '● Monitors OK'; mm.style.background = '#DCFCE7'; mm.style.color = '#15803D'; }
    for (let i = 0; i < 4; i++) E('m-e' + i).classList.toggle('on', S.mAnn > i);
  }
  // scene D
  if (E('sceneD')) {
    const base4 = VID === 4 ? { 'CAM-14': 'r', 'SNS-03': 'y' } : {};
    ['CAM-11','CAM-12','CAM-14','GW-A','SNS-01','SNS-02','SNS-03','GW-B','TH-05','TH-06','DSP-01','DSP-02'].forEach(id => devState(id, S.devs[id] || base4[id] || 'g'));
    const tiles = VID === 4 ? [48, 46, 1, 1] : S.tiles; E('t-on').textContent = tiles[1]; E('t-deg').textContent = tiles[2]; E('t-down').textContent = tiles[3];
    E('alist').innerHTML = VID === 4 ? AL.r + AL.y.replace('just now', '12 min ago') : (S.alerts === 'y' ? AL.y + AL.ok2 : AL.ok);
    const tp = S.toastT !== null ? ease(prog(t, S.toastT, S.toastT + 0.6)) : 0; E('toast').style.opacity = tp; if (tp < 1) E('toast').style.transform = `translateY(${(1 - tp) * 30}px)`;
    const po = S.detT !== null ? ease(prog(t, S.detT, S.detT + 0.6)) : 0; E('p-det').style.opacity = po; if (!focusEnv('p-det', t)) E('p-det').style.transform = `translateX(${(1 - po) * 50}px)`;
    const cur2 = E('cursor'), rip = E('ripple');
    if (S.cursor) { const s = S.cursor; const tg = devRects['d-TH-05']; const p = ease(prog(t, s.h0, s.ta)); const x = lerp(1560, tg[0], p), y = lerp(1000, tg[1], p);
      Object.assign(cur2.style, { display: 'block', left: (x - 6) + 'px', top: (y - 3) + 'px' });
      if (t >= s.ta && t < s.ta + 0.6) { const q = prog(t, s.ta, s.ta + 0.6); const rr = 10 + 50 * q; Object.assign(rip.style, { display: 'block', left: (tg[0] - rr) + 'px', top: (tg[1] - rr) + 'px', width: 2 * rr + 'px', height: 2 * rr + 'px', opacity: 1 - q }); } else rip.style.display = 'none';
      const th = E('d-TH-05'); if (t >= s.ta) { th.style.borderColor = '#2563EB'; } } else { cur2.style.display = 'none'; rip.style.display = 'none'; E('d-TH-05').style.borderColor = ''; }
    if (VID === 4) { const tt = t + (window.IDLE || 0); const v1 = chart(E('c1'), tt, 22.4, 0.6, 0.25, 440, 150, 20.5, 24.5, '#F08A1C'); E('v1').textContent = v1.toFixed(1) + ' °C';
      const v2 = chart(E('c2'), tt + 3, 140, 18, 9, 440, 120, 90, 190, '#2563EB'); E('v2').textContent = Math.round(v2) + ' ms'; E('lhb').textContent = (1 + Math.floor((t * 1.3) % 3)) + ' s ago'; }
  }
  document.getAnimations().forEach(a => { a.pause(); a.currentTime = t * 1000; });
}
function focusEnv(id, t) {
  let e = 0;
  for (const s of STOPS) if (s.id === id && !s.zoom) e = Math.max(e, env(t, s.ta - 0.15, s.te + 0.5, 0.35));
  if (RECAP.boxes.includes(id)) e = Math.max(e, 0.6 * env(t, RECAP_T, RECAP_T + P.recap, 0.4));
  return e;
}
window.TOTAL = TOTAL; window.STOPS_INFO = STOPS.map(s => s.zoom ? ['zoom', s.tr] : [s.id, +s.h0.toFixed(2), +s.ta.toFixed(2), +s.te.toFixed(2)]);
window.MARKS = STOPS.filter(s => !s.zoom).map(s => s.ta);
setT(0);
