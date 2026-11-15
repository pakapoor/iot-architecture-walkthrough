// Presenter notes: the Correctness & trade-offs deep dives (20–22), shown as flows on the main diagram.
// Format: see pres/notes.js (flow 1) and registerFlow(). These are design examples, not fleet benchmarks.
{   // block scope: these helpers must not clash with other notes files
const LANE_CRIT = [[1010, 238], [1036, 140], [1070, 140], [1070, 48], [1374, 48]];   // Flink rule engine → critical lane
const LANE_LIVE = [[1010, 238], [1036, 140], [1070, 140], [1070, 180], [1374, 180]];  // Flink rule engine → live updates
const FLINK_IN = [[170, 85], [226, 85], [402, 140], [694, 140], [1010, 238]];         // heartbeats topic → rule engine
const DASH_IN = { h: 'The update reaches the dashboard service.', hl: [[240, 14, 190, 54], [490, 64, 320, 96]], path: [[410, 41], [458, 41], [458, 100], [790, 100]] };

// ---------- 20 · Delivery & replay ----------
registerFlow(20, {
  name: 'Delivery & replay',
  intro: { h: 'Flink crashes after an external write already succeeded. What stops a duplicate, or a missing incident?', b: [
    'We follow one incident, <b>INC-1042</b> for CAM-14, through two failures: an ambiguous timeout and a rollback.',
    'Exactly-once inside Flink does <b>not</b> make PagerDuty, ServiceNow or Redis exactly-once.',
    'This is a <b>design example</b>: the boundary between Flink and the outside world.',
    'Watch for three things: <b>committed</b> decisions, a <b>stable identity</b>, and <b>reconciliation</b>.'] },
  steps: [
    ['a-flink', 'CAM-14 turns DEAD, and Flink writes the decision to a transactional Kafka sink.', [
      'At minute 20 the timer fires and CAM-14 is <b>DEAD</b>; the decision gets incident ID <b>INC-1042</b>.',
      'Example: the decision goes out through a <b>transactional Kafka sink</b>, not straight to PagerDuty.',
      'Until the next checkpoint completes, it is <b>pending</b>: nobody downstream can see it.',
      'Why: if Flink crashes now, its state and the pending decision <b>roll back together</b>.']],
    ['a-kafka', 'The checkpoint completes, the transaction commits, and fan-out reads committed decisions only.', [
      'Checkpoint completion <b>commits</b> the transaction, so the decision becomes visible.',
      'Fan-out consumers read <b>committed records only</b>; an aborted decision never pages anyone.',
      'Trade-off: pending publication is part of checkpoint recovery, so it <b>cannot be fire-and-forget</b>.',
      'Kafka transaction timeouts must cover <b>checkpoint and recovery time</b>.']],
    ['a-act', 'The page and the ServiceNow upsert go out; the write succeeds, the reply times out, and the worker crashes before its ack.', [
      'On-call is paged, and the ticket worker upserts the ServiceNow ticket for INC-1042.',
      'ServiceNow <b>accepts</b> the write, but the reply never arrives.',
      'The worker crashes before acknowledging the SQS message: an <b>ambiguous</b> outcome.',
      'Did the write happen? From the worker\'s side, there is no way to know.']],
    ['a-act', 'SQS redelivers, the same action key finds the open ticket, and there is still one ticket.', [
      'SQS <b>redelivers</b> the unacknowledged message to another worker.',
      'The retry carries the <b>same action key</b>: INC-1042.',
      'ServiceNow enforces a <b>unique correlation ID</b>, so the upsert updates the open ticket.',
      'An ambiguous timeout is harmless when the retry <b>repeats the same key</b>.']],
    ['a-flink', 'Later, a bad deploy is rolled back to an older checkpoint, and Flink decides the DEAD transition again.', [
      'A different failure: a bad deploy, <b>rolled back</b> to an earlier checkpoint.',
      'Flink replays from that point and reaches CAM-14\'s DEAD transition <b>a second time</b>.',
      'If identity were minted fresh here, the same outage would get a <b>new incident</b>.',
      'We rejected assuming that a successful checkpoint makes every <b>external side effect</b> exactly-once.']],
    ['a-flink', 'The retained decision register returns the original incident ID: INC-1042 again, never a new one.', [
      'Example: a <b>decision register</b> maps each tenant/device outage transition to its incident ID.',
      'The replayed decision looks it up and gets <b>INC-1042</b> back.',
      'Identities are allocated <b>retry-safely</b> and retained for the whole <b>rollback window</b>.',
      'Same identity means every downstream system can recognise the repeat.']],
    ['a-stor', 'Storage replays safely too: Redis rejects older versions, and ClickHouse reads deduplicate event IDs.', [
      '<b>Redis</b> applies a state change only if its version is <b>newer</b>; an older replay is ignored.',
      '<b>ClickHouse</b> rows carry stable event IDs, and reads <b>deduplicate</b> them.',
      'So live status never regresses and history never double-counts.',
      'Each external system needs <b>its own</b> replay contract.']],
    ['a-obsp', 'Reconciliation compares the final incident state with ServiceNow, and a mismatch alarms.', [
      'Idempotency covers the retries we expect; <b>reconciliation</b> catches the rest.',
      'It compares the workflow\'s final incident state with the <b>external result</b>.',
      'A mismatch raises an <b>alarm</b> for a human to look at.',
      'We also <b>test crashes</b> around every acknowledgement, not just the happy path.']]
  ],
  recap: { h: 'A replay-safe boundary is defined by acknowledgement, identity and recovery.', b: [
    '<b>Commit first</b>: decisions become visible only when the checkpoint completes.',
    '<b>Same key on retry</b>: an ambiguous timeout repeats the same action, not a new one.',
    '<b>Stable identity</b>: the decision register survives rollback.',
    '<b>Versioned stores</b>: Redis and ClickHouse ignore repeats.',
    '<b>Reconcile</b>: compare final state with the external result, and test crashes at every ack.'] }
}, {
  1: { steps: [
    { h: 'CAM-14\'s timer fires: DEAD.', hl: [[736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'CAM-14 · DEAD', '#DC2626']], b: [
      'No heartbeat for 20 minutes, so the rule engine moves CAM-14 to <b>DEAD</b>.',
      'This is a <b>state transition</b>, so it leaves Flink.'] },
    { h: 'The decision gets its incident ID.', hl: [[444, 30, 250, 220]], at: [1010, 238], lab: [[458, 200, 'INC-1042', '#5B3FD9']], b: [
      'The incident ID comes from <b>keyed state</b>: tenant + device + outage generation.',
      'It is the key every downstream system will use.'] },
    { h: 'It goes to a transactional sink, still pending.', hl: [[1104, 20, 300, 56]], path: LANE_CRIT, lab: [[40, 328, 'pending · invisible until the checkpoint', '#B45309']], b: [
      'The decision is written inside an <b>open Kafka transaction</b>.',
      'Downstream consumers cannot see it yet.',
      'A crash now rolls back state and decision <b>together</b>.'] }] },
  2: { steps: [
    { h: 'The decision waits in an open transaction.', hl: [[240, 14, 820, 306]], at: [789, 126], lab: [[880, 172, 'pending · uncommitted', '#B45309']], b: [
      'The record is in the log, but marked as part of an <b>uncommitted</b> transaction.',
      'Committed-only readers skip it.'] },
    { h: 'The checkpoint completes, and the transaction commits.', hl: [[240, 14, 820, 306]], at: [789, 126], lab: [[880, 172, 'committed ✓', '#15803D']], b: [
      'Checkpoint completion and the commit are <b>tied together</b>.',
      'Now fan-out consumers can read INC-1042.',
      'They read <b>committed records only</b>.'] },
    { h: 'A crash before the commit rolls both back.', hl: [[1110, 334, 370, 58]], at: [1450, 363], b: [
      'Flink restores the last completed checkpoint and <b>aborts</b> the open transaction.',
      'The decision is made again from restored state, so nothing is lost.',
      'Transaction timeouts must outlast <b>checkpoint and recovery</b> time.'] }] },
  3: { steps: [
    { h: 'The committed decision fans out.', hl: [[20, 120, 150, 110], [230, 120, 170, 90]], path: [[150, 200], [226, 160], [380, 190]], b: [
      'SNS fans the critical decision out to its consumers.',
      'Each consumer acts on the <b>same incident ID</b>.'] },
    { h: 'On-call is paged, and the ticket worker starts.', hl: [[440, 24, 190, 82], [440, 124, 190, 90], [670, 124, 170, 90]], path: [[380, 190], [400, 165], [600, 195], [820, 195]], b: [
      'PagerDuty pages on-call <b>now</b>.',
      'SQS buffers the ticket request; a worker picks it up.'] },
    { h: 'ServiceNow accepts the upsert, but the reply times out.', hl: [[880, 14, 390, 300], [1310, 24, 190, 130]], path: [[820, 195], [880, 169], [1250, 110], [1306, 90], [1480, 130]], lab: [[1318, 158, 'reply timed out', '#B45309']], b: [
      'The ticket is created in ServiceNow.',
      'The response is lost on the way back: an <b>ambiguous</b> result.'] },
    { h: 'The worker crashes before its ack.', hl: [[440, 124, 190, 90]], at: [600, 195], b: [
      'The SQS message was never <b>acknowledged</b>.',
      'So SQS will <b>redeliver</b> it after the visibility timeout.'] }] },
  4: { steps: [
    { h: 'SQS redelivers the same message.', hl: [[440, 124, 190, 90], [670, 124, 170, 90]], path: [[600, 195], [820, 195]], b: [
      'Another worker receives the <b>same message</b>.',
      'Its action key is still <b>INC-1042</b>.'] },
    { h: 'Same key: the same workflow.', hl: [[898, 52, 354, 28]], path: [[820, 195], [880, 169], [1240, 66]], b: [
      'The workflow ID is the incident identity, so this is <b>not</b> a new workflow.',
      'signalWithStart lands on the one that already exists.'] },
    { h: 'The upsert finds the open ticket.', hl: [[1310, 24, 190, 130]], path: [[1240, 66], [1270, 90], [1306, 90], [1480, 130]], lab: [[1318, 158, 'still one ticket', '#15803D']], b: [
      'ServiceNow enforces a <b>unique correlation ID</b>.',
      'The retry <b>updates</b> the open ticket; it does not create a second one.'] }] },
  5: { steps: [
    { h: 'A bad deploy is rolled back to an older checkpoint.', hl: [[20, 360, 1010, 40]], lab: [[40, 328, 'restored · older checkpoint', '#B45309']], b: [
      'The job restarts from an <b>earlier</b> checkpoint, with its Kafka offsets.',
      'Everything after that point will be <b>processed again</b>.'] },
    { h: 'Replay reaches CAM-14\'s DEAD transition again.', hl: [[20, 40, 170, 90], [736, 20, 300, 240]], path: FLINK_IN, lab: [[750, 186, 'DEAD · decided again', '#DC2626']], b: [
      'The same silence produces the <b>same transition</b> a second time.',
      'Minted fresh, its identity would be a <b>new incident</b>.'] },
    { h: 'Without a register, a duplicate incident follows.', hl: [[1104, 20, 300, 56]], path: LANE_CRIT, b: [
      'A new ID would mean a <b>second page</b> and a <b>second ticket</b> for one outage.',
      'So identity must survive the rollback: next step.'] }] },
  6: { steps: [
    { h: 'The decision register holds every outage transition.', hl: [[444, 30, 250, 220]], at: [1010, 238], lab: [[458, 200, 'register · INC-1042', '#5B3FD9']], b: [
      'Example: a retained map from tenant/device outage transition to <b>incident ID</b>.',
      'It is written <b>retry-safely</b> when the identity is first allocated.'] },
    { h: 'It returns the original incident ID.', hl: [[444, 30, 250, 220], [736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'INC-1042 again', '#1D4ED8']], b: [
      'The replayed decision carries <b>INC-1042</b>, not a new ID.',
      'Downstream, it lands on the same workflow and the same ticket.'] },
    { h: 'Kept for the whole rollback window.', hl: [[20, 360, 1010, 40]], lab: [[40, 328, 'retained for the rollback window', '#5B3FD9']], b: [
      'Entries live at least as long as any checkpoint we might <b>roll back to</b>.',
      'Trade-off: more retained state, in exchange for <b>stable identity</b>.'] }] },
  7: { steps: [
    { h: 'The replayed transition reaches storage.', hl: [[20, 150, 170, 100]], at: [170, 230], b: [
      'Flink writes live state and history <b>in parallel</b>.',
      'Some of these writes already happened before the rollback.'] },
    { h: 'Redis rejects the older version.', hl: [[272, 20, 250, 82]], path: [[170, 200], [230, 200], [230, 60], [500, 60]], b: [
      'Each device state carries a <b>version</b>.',
      'Redis applies a change only if it is <b>newer</b>, so live status never goes backwards.'] },
    { h: 'ClickHouse reads deduplicate by event ID.', hl: [[272, 112, 250, 82]], path: [[500, 60], [230, 60], [230, 152], [500, 152]], b: [
      'Rows carry a <b>stable event ID</b>, so a replayed row is the same row.',
      'Reads deduplicate before the background merge does.'] },
    { h: 'Dashboards never regress or double-count.', hl: [[848, 64, 264, 90], [848, 170, 264, 90]], at: [1090, 215], b: [
      'Live view and charts both read <b>versioned, deduplicated</b> data.',
      'A replay is invisible to the people watching.'] }] },
  8: { steps: [
    { h: 'Reconciliation looks at both sides.', hl: [[20, 30, 190, 300]], at: [190, 300], b: [
      'The workflow knows the <b>final incident state</b>.',
      'ServiceNow knows the <b>external result</b>.'] },
    { h: 'A mismatch raises an alarm.', hl: [[900, 190, 310, 140]], path: [[190, 300], [236, 180], [1190, 310]], lab: [[914, 300, 'mismatch → alarm', '#DC2626']], b: [
      'Example: an open incident with no ticket, or a closed ticket for an open incident.',
      'Reconciliation catches what idempotency did not <b>expect</b>.'] },
    { h: 'Test crashes around every acknowledgement.', hl: [[1250, 30, 250, 300]], at: [1480, 310], b: [
      'Crash <b>before</b> and <b>after</b> each write and each ack, in tests.',
      'Humans investigate only the <b>real</b> mismatches.'] }] }
});

// ---------- 21 · Device or pipeline failure? ----------
registerFlow(21, {
  name: 'Device or pipeline failure?',
  intro: { h: 'Many devices look silent while the heartbeat consumer is behind. Should every device page on-call?', b: [
    'The devices are fine; the <b>observer</b> is the one in trouble.',
    'If every expired timer pages, one pipeline problem becomes a <b>storm of false device pages</b>.',
    'This is a <b>design example</b> of telling observation failure from device failure.',
    'Watch for three things: <b>fresh</b> heartbeats, a <b>healthy</b> observer, and a <b>bounded</b> hold.'] },
  steps: [
    ['a-edge', 'Devices are healthy, and every one still heartbeats once a minute.', [
      'At every site, devices keep sending their <b>once-a-minute</b> heartbeat.',
      'Edge pairs batch them and send them on, as normal.',
      'Nothing at the edge is wrong; remember that as the silence starts.']],
    ['a-ing', 'Heartbeats keep their reserved capacity, on the priority topic, end to end.', [
      'Ingestion routes heartbeats to their own <b>priority topic</b>.',
      'Heartbeat capacity is <b>reserved</b> at admission, Kafka, Flink and the action lane.',
      'So bulk telemetry cannot crowd liveness out, but a stalled consumer still can.']],
    ['a-kafka', 'Heartbeats land in Kafka, but the Flink consumer falls behind and lag grows.', [
      'Heartbeats are <b>safely stored</b> in Kafka.',
      'The Flink job reading them is behind, so <b>consumer lag</b> grows.',
      'From Flink\'s point of view, those heartbeats have <b>not arrived yet</b>.',
      'Lag, not loss: the data is there, just unread.']],
    ['a-flink', 'Device timers expire for many devices at once, and they become DEAD candidates, not pages.', [
      'Timers keep running while heartbeats sit unread, so <b>many expire together</b>.',
      'Each expiry is a <b>candidate</b>, not proof of failure.',
      'We rejected interpreting every timer expiry as proof of a <b>separate device failure</b>.',
      'Silence is evidence only when the observer is healthy.']],
    ['a-obsp', 'Is the observer healthy? Freshness p99 and completed-checkpoint age say no, so this is a pipeline problem.', [
      'Pipeline freshness is monitored <b>independently</b> of device timers.',
      '<b>Freshness p99</b> is over its 2-minute alert, and consumer lag is climbing.',
      '<b>Completed-checkpoint age</b> is growing: checkpoints are not finishing.',
      'Verdict: the <b>pipeline</b> is behind; the devices are probably fine.']],
    ['a-flink', 'A recovery gate holds the candidates and shows them as UNKNOWN; the hold is short and bounded.', [
      'Example: a bounded recovery/correlation gate <b>holds</b> the candidates.',
      'Their status is <b>UNKNOWN</b> while observation is stale, not DEAD.',
      'The hold is <b>bounded</b>: it must never hide a real outage indefinitely.',
      'Trade-off: a short detection delay, for far fewer false device pages.']],
    ['a-act', 'One page goes to the pipeline owner now, not one page per device.', [
      'The page goes to the <b>pipeline owner</b> immediately.',
      'One incident for one cause, instead of one per device.',
      'No device tickets are opened while status is UNKNOWN.']],
    ['a-dash', 'Dashboards show UNKNOWN and data delayed, not a wall of red.', [
      'Tenant admins see <b>UNKNOWN · data delayed</b> for affected devices.',
      'Platform admins see the <b>pipeline incident</b>.',
      'Nobody is told their cameras are dead when they are not.']],
    ['a-flink', 'Freshness recovers: fresh heartbeats clear their devices, and a still-silent device becomes DEAD and pages as normal.', [
      'The consumer catches up, and freshness and checkpoint age return to normal.',
      'Heartbeat <b>event age</b> is checked within declared <b>clock-skew</b> bounds.',
      'A freshly forwarded <b>old</b> heartbeat is still history; it does not refresh health.',
      'Devices with fresh heartbeats clear; a device <b>still silent</b> is DEAD and pages as normal.',
      'Healthy monitoring localises the problem; it does not prove the hardware failed.']]
  ],
  recap: { h: 'Silence is evidence only when the observer is healthy.', b: [
    '<b>Reserve</b> heartbeat capacity end to end.',
    '<b>Measure the observer</b>: freshness p99 and completed-checkpoint age, independently.',
    '<b>Hold, bounded</b>: candidates show UNKNOWN while observation is stale.',
    '<b>Page the cause</b>: the pipeline owner, now, once.',
    '<b>Check event age</b>: an old heartbeat forwarded late is still history.'] }
}, {
  1: { steps: [
    { h: 'Every site is reporting normally.', hl: [[40, 60, 400, 300]], at: [345, 268], b: [
      'Acme\'s sites, and every other tenant\'s, are online.',
      'Each site sends through its own <b>edge pair</b>.'] },
    { svg: 'small', h: 'Devices heartbeat once a minute.', hl: [[40, 60, 230, 260]], at: [250, 88], b: [
      'Cameras, thermostats and sensors all check in <b>once a minute</b>.',
      'The device mix is an <b>example topology</b>.'] },
    { svg: 'small', h: 'The edge pair batches and sends them.', hl: [[490, 60, 300, 180], [910, 90, 220, 130]], path: [[250, 88], [484, 88], [760, 212], [790, 150], [904, 150], [1100, 190]], lab: [[922, 176, 'fresh · on time', '#15803D']], b: [
      'Gateway A batches the site and sends it over <b>mTLS</b>.',
      'These heartbeats are <b>fresh</b>: they left the site seconds ago.'] }] },
  2: { steps: [
    { h: 'Heartbeats arrive with the rest of the batch.', hl: [[20, 120, 180, 110]], at: [170, 200], b: [
      'Authenticated and <b>tenant-tagged</b> by the gateway.',
      'Each batch is unpacked into device readings.'] },
    { h: 'They go to the priority topic.', hl: [[275, 218, 330, 58], [905, 60, 300, 100]], path: [[170, 200], [248, 175], [580, 95], [580, 171], [580, 247], [605, 258], [860, 258], [860, 110], [900, 110], [1175, 130]], b: [
      'Heartbeats go to <b>heartbeats</b>; bulk readings go to telemetry.',
      'A delayed heartbeat can raise a <b>false DEAD</b>.'] },
    { h: 'Reserved capacity, end to end.', hl: [[1230, 60, 280, 332]], at: [1175, 130], b: [
      'The topic alone is not enough: capacity is reserved at <b>every stage</b>.',
      'That protects heartbeats from bulk load, not from a <b>stalled consumer</b>.'] }] },
  3: { steps: [
    { h: 'Heartbeats keep arriving.', hl: [[20, 130, 170, 100], [240, 14, 820, 306]], path: [[160, 200], [232, 180], [420, 126], [789, 126]], b: [
      'Ingestion keeps publishing, and Kafka keeps <b>appending</b>.',
      'Every heartbeat is stored durably.'] },
    { h: 'The Flink readers fall behind.', hl: [[1110, 14, 370, 306]], at: [789, 126], lab: [[880, 172, 'unread · lag growing', '#B45309']], b: [
      'The heartbeat consumer is not keeping up.',
      'Unread heartbeats pile up as <b>consumer lag</b>.'] },
    { h: 'Lag, not loss.', hl: [[1110, 334, 370, 58]], at: [1450, 363], b: [
      'The heartbeats are still in the log, within retention.',
      'Flink will read them; for now, it just <b>has not</b>.'] }] },
  4: { steps: [
    { h: 'Heartbeats reach Flink late.', hl: [[20, 40, 170, 90]], at: [170, 85], lab: [[40, 328, 'processing behind · freshness slipping', '#B45309']], b: [
      'Flink is processing heartbeats from minutes ago.',
      'Recent ones are still <b>waiting in Kafka</b>.'] },
    { h: 'Device timers expire.', hl: [[736, 20, 300, 240]], path: FLINK_IN, lab: [[750, 186, 'many timers expired', '#DC2626']], b: [
      'Nothing resets the timers, so <b>many expire together</b>.',
      'Each looks exactly like a silent device.'] },
    { h: 'Candidates, not pages.', hl: [[736, 20, 300, 240], [1104, 20, 300, 56]], at: [1010, 238], b: [
      'Each expiry is a <b>DEAD candidate</b>.',
      'Before paging, Flink needs to know whether its own view is <b>fresh</b>.'] }] },
  5: { steps: [
    { h: 'Check the observer first.', hl: [[240, 30, 310, 140]], at: [530, 150], b: [
      '<b>Consumer lag</b> on the heartbeats topic is climbing.',
      'Lag is measured <b>per partition</b>, not just in total.'] },
    { h: 'Freshness p99 is over 2 minutes.', hl: [[570, 30, 310, 140]], path: [[530, 150], [860, 150]], lab: [[584, 110, 'p99 > 2 min', '#DC2626']], b: [
      'Freshness is the age of an event when Flink processes it.',
      'Heartbeat freshness is tracked <b>separately</b> from telemetry.'] },
    { h: 'Checkpoints are not completing.', hl: [[900, 30, 310, 140]], path: [[860, 150], [1190, 150]], lab: [[914, 110, 'checkpoint age rising', '#DC2626']], b: [
      'The age of the <b>last completed</b> checkpoint keeps growing.',
      'The job is unhealthy, whatever the devices are doing.'] },
    { h: 'Verdict: the pipeline, not the devices.', hl: [[900, 190, 310, 140]], at: [1190, 310], lab: [[914, 300, 'page the pipeline owner', '#DC2626']], b: [
      'Monitors fire on <b>freshness and checkpoint age</b>.',
      'The responsible owner is the <b>pipeline</b> team.'] }] },
  6: { steps: [
    { h: 'Candidates are held.', hl: [[736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'held · UNKNOWN', '#56667C']], b: [
      'Example: a recovery gate <b>holds</b> candidates while observation is stale.',
      'Held candidates are kept in <b>durable state</b>.'] },
    { h: 'Status shows UNKNOWN.', hl: [[1104, 152, 300, 56]], path: LANE_LIVE, b: [
      'The live update says <b>UNKNOWN</b>, not DEAD.',
      'It reaches dashboards; it does not reach PagerDuty.'] },
    { h: 'The hold is bounded.', hl: [[20, 360, 1010, 40]], lab: [[40, 328, 'bounded hold · never indefinite', '#5B3FD9']], b: [
      'The gate has a <b>maximum</b> hold time.',
      'Past it, candidates are released, so a real outage is <b>never hidden</b>.'] }] },
  7: { steps: [
    { h: 'One pipeline incident.', hl: [[20, 120, 150, 110]], at: [150, 200], b: [
      'One cause, so <b>one</b> incident.',
      'It names the pipeline, not a device.'] },
    { h: 'Page the pipeline owner, now.', hl: [[230, 120, 170, 90], [440, 24, 190, 82]], path: [[150, 200], [226, 160], [315, 140], [315, 70], [600, 70]], b: [
      'The page goes out <b>immediately</b>.',
      'Suppression of device pages must never delay the pipeline page.'] },
    { h: 'No device tickets.', hl: [[440, 124, 190, 90], [880, 14, 390, 300]], at: [600, 70], b: [
      'No device incidents start while status is UNKNOWN.',
      'Ticket queues stay clean for <b>real</b> failures.'] }] },
  8: { steps: [
    DASH_IN,
    { h: 'Tenant admins see UNKNOWN, data delayed.', hl: [[1200, 20, 310, 370]], at: [1480, 186], b: [
      'Affected devices show <b>UNKNOWN</b>, not DEAD.',
      'Tenants are not told their cameras are dead.'] },
    { h: 'Platform admins see the pipeline incident.', hl: [[880, 20, 300, 370]], at: [1150, 186], b: [
      'The platform view shows the <b>cause</b>: the pipeline is behind.',
      'No wall of red, anywhere.'] }] },
  9: { steps: [
    { h: 'Freshness recovers.', hl: [[20, 360, 1010, 40]], lab: [[40, 328, 'observer healthy again', '#15803D']], b: [
      'The consumer catches up; freshness and checkpoint age are back to normal.',
      'Held candidates can now be <b>judged</b>.'] },
    { h: 'Check event age within clock-skew bounds.', hl: [[232, 40, 170, 200], [444, 30, 250, 220]], lab: [[458, 200, 'event age ✓ within skew', '#15803D']], b: [
      'Each heartbeat\'s <b>event time</b> is checked, not just its arrival.',
      'A freshly forwarded <b>old</b> heartbeat is still history.'] },
    { h: 'Fresh heartbeats clear their devices.', hl: [[736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'cleared · ONLINE', '#15803D']], b: [
      'Most candidates had fresh heartbeats waiting in Kafka.',
      'They go back to <b>ONLINE</b>, and nobody was paged.'] },
    { h: 'A still-silent device is DEAD, and pages.', hl: [[1104, 20, 300, 56]], path: LANE_CRIT, b: [
      'A device with <b>no</b> fresh heartbeat is a real failure.',
      'It pages as normal, with its <b>original</b> failure time.'] }] }
});

// ---------- 22 · Incident recovery races ----------
registerFlow(22, {
  name: 'Incident recovery races',
  intro: { h: 'A device recovers while ticket creation is parked, then fails again before an old recovery signal arrives.', b: [
    'We follow CAM-14 through <b>two outages</b>, A and B, with ServiceNow down in between.',
    'The danger: a <b>stale ticket</b> for A, or a late signal for A closing B.',
    'This is a <b>design example</b> of incident identity under races.',
    'Watch for three things: <b>outage generations</b>, <b>versioned signals</b>, and <b>reconcile before retry</b>.'] },
  steps: [
    ['a-flink', 'CAM-14 is DEAD at minute 20, and Flink stores outage generation A in durable state; the incident ID includes it.', [
      'The graded ladder runs: <b>SILENT</b> at 10 minutes, <b>DEAD</b> at 20.',
      'On the healthy-to-failed transition, Flink allocates <b>outage generation A</b>.',
      'It lives in <b>durable state</b>, so a restart does not forget it.',
      'The incident ID is <b>tenant + device + outage generation</b>.']],
    ['a-act', 'On-call is paged now; at minute 30 ServiceNow is down, so ticket creation for A is parked.', [
      'The page goes out <b>immediately</b>; paging never waits on ticketing.',
      'Workflow A starts, and at minute 30 tries to raise the ticket.',
      'ServiceNow is down: bounded retries run out and the ticket step is <b>parked</b>.',
      'The ack deadline stays anchored to the <b>original page time</b>.']],
    ['a-edge', 'CAM-14 comes back, with fresh heartbeats again.', [
      'The camera reboots and starts heartbeating.',
      'Its heartbeats are <b>fresh</b>, not old spooled data.',
      'Outage A is over, but its ticket step is still parked.']],
    ['a-flink', 'Recovery is recorded for A, with a version; the workflow\'s signal handler stays active while the ticket is parked.', [
      'The recovery event carries <b>A\'s incident ID</b> and a <b>version</b>.',
      'Recovery is recorded <b>even though</b> ticket creation is unavailable.',
      'Signal handlers stay active during retries, so workflow A <b>hears</b> it.',
      'A stable-recovery duration avoids closing on a flicker.']],
    ['a-act', 'Before replaying the parked ticket, the workflow reconciles: A has recovered, so no stale ticket is opened.', [
      'ServiceNow comes back, and ops can <b>replay</b> parked work.',
      'Before replaying, workflow A <b>reconciles</b> the current state.',
      'A has recovered, so it does <b>not</b> open a stale ticket for a fixed outage.',
      'The timeline of A is kept for audit.']],
    ['a-edge', 'Minutes later, CAM-14 fails again.', [
      'CAM-14 goes silent <b>again</b>.',
      'Same device, same tenant, but a <b>different outage</b>.',
      'Somewhere, a delayed recovery signal for A is still in flight.']],
    ['a-flink', 'A new outage gets generation B, with a new incident ID and a new workflow.', [
      'SILENT at 10 minutes, DEAD at 20, as always.',
      'The healthy-to-failed transition allocates <b>generation B</b>.',
      'So B has its <b>own incident ID</b> and its own workflow.',
      'We rejected matching incidents by a <b>time bucket</b>, or starting a workflow for every signal.']],
    ['a-act', 'A delayed recovery signal for A arrives; it carries A\'s ID and version, so it cannot resolve B.', [
      'The late signal names <b>outage A</b>, not "whatever is open for CAM-14".',
      'Its ID and version do not match B, so it is <b>rejected</b> as stale.',
      'B stays open, its page stands, and escalation continues on B\'s own timers.',
      'Trade-off: we must define stale-signal rejection, workflow ID reuse and <b>reopen policy</b>.']],
    ['a-dash', 'Dashboard: one open incident, B, and A is closed with its full timeline.', [
      'Acme\'s view shows <b>one open incident</b>: B.',
      'A appears in history, <b>closed</b>, with every step recorded.',
      'The event refers to one incident, not whichever incident is currently open.']]
  ],
  recap: { h: 'The event refers to one incident, not whichever incident is currently open.', b: [
    '<b>Outage generations</b>: each healthy-to-failed transition gets its own identity.',
    '<b>Versioned signals</b>: ack, recovery and ticket status carry the incident ID.',
    '<b>Listen while parked</b>: signal handlers stay active during retries.',
    '<b>Reconcile before retry</b>: never open a stale ticket for a recovered outage.',
    '<b>Reject stale signals</b>: a late event for A can never close B.'] }
}, {
  1: { steps: [
    { h: 'CAM-14\'s timer fires at minute 20.', hl: [[736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'CAM-14 · DEAD', '#DC2626']], b: [
      'SILENT at 10 minutes, then <b>DEAD</b> at 20.',
      'A healthy-to-failed <b>transition</b>.'] },
    { h: 'Flink allocates outage generation A.', hl: [[444, 30, 250, 220]], at: [1010, 238], lab: [[458, 200, 'outage generation A', '#DC2626']], b: [
      'The generation is stored in CAM-14\'s <b>keyed state</b>.',
      'Checkpointed, so a restart keeps it.'] },
    { h: 'The incident ID includes the generation.', hl: [[1104, 20, 300, 56]], path: LANE_CRIT, lab: [[40, 328, 'ID = tenant + device + generation', '#5B3FD9']], b: [
      'The critical lane carries incident <b>A</b>.',
      'Every later event about it will carry the same ID.'] }] },
  2: { steps: [
    { h: 'On-call is paged now.', hl: [[230, 120, 170, 90], [440, 24, 190, 82]], path: [[150, 200], [226, 160], [315, 140], [315, 70], [600, 70]], b: [
      'PagerDuty pages <b>immediately</b>.',
      'Paging never waits on ticketing.'] },
    { h: 'Workflow A starts.', hl: [[440, 124, 190, 90], [670, 124, 170, 90], [898, 52, 354, 28]], path: [[600, 70], [535, 124], [535, 169], [820, 169], [880, 169], [1240, 66]], b: [
      'The workflow ID is A\'s <b>incident identity</b>.',
      'Its first step waits for minute 30.'] },
    { h: 'At minute 30, ServiceNow is down: the ticket is parked.', hl: [[898, 90, 354, 46], [1310, 24, 190, 130]], at: [1240, 112], lab: [[1318, 158, 'down · ticket parked', '#DC2626']], b: [
      'Bounded retries run out.',
      'The ticket step is <b>parked</b>, waiting for a human replay.'] },
    { h: 'The ack deadline stays anchored to the page.', hl: [[898, 144, 354, 46]], at: [1240, 166], b: [
      'The 30-minute ack deadline counts from the <b>original page</b>.',
      'A parked ticket does not move it.'] }] },
  3: { steps: [
    { h: 'Back at Acme Site-07.', hl: [[40, 60, 400, 300]], at: [345, 268], b: [
      'CAM-14 is one of Site-07\'s devices.'] },
    { svg: 'small', h: 'CAM-14 boots and heartbeats.', hl: [[40, 60, 230, 56]], at: [250, 88], b: [
      'The camera is back on the network.',
      'Its heartbeat leaves the site seconds later.'] },
    { svg: 'small', h: 'Fresh heartbeats reach the cloud.', hl: [[490, 60, 300, 180], [910, 90, 220, 130]], path: [[250, 88], [484, 88], [760, 212], [790, 150], [904, 150], [1100, 190]], lab: [[922, 176, 'fresh · CAM-14', '#15803D']], b: [
      'Gateway A batches it with the site.',
      'These are <b>fresh</b> heartbeats, not spool history.'] }] },
  4: { steps: [
    { h: 'Fresh heartbeats reset CAM-14\'s timer.', hl: [[20, 40, 170, 90], [736, 20, 300, 240]], path: FLINK_IN, lab: [[750, 186, 'CAM-14 · recovered', '#15803D']], b: [
      'CAM-14 is <b>ONLINE</b> again.',
      'Recovery must be <b>stable</b> for a while before it counts.'] },
    { h: 'Recovery is tagged with A and a version.', hl: [[444, 30, 250, 220]], at: [1010, 238], lab: [[458, 200, 'recovery · gen A', '#1D4ED8']], b: [
      'The event names <b>outage A</b> explicitly.',
      'A version orders it against other events for A.'] },
    { h: 'The signal goes to workflow A.', hl: [[1104, 152, 300, 56], [1104, 20, 300, 56]], path: LANE_CRIT, b: [
      'Recovery travels as a <b>signal</b> to A\'s workflow.',
      'It is recorded even while the ticket is parked.'] }] },
  5: { steps: [
    { h: 'The recovery signal reaches workflow A.', hl: [[1310, 184, 190, 130], [880, 14, 390, 300]], path: [[1400, 300], [1306, 250], [1240, 220]], b: [
      'Signals come in with A\'s <b>incident ID</b>.',
      'They land on A\'s workflow, nowhere else.'] },
    { h: 'The handler runs, even while the ticket is parked.', hl: [[898, 252, 354, 46]], at: [1240, 275], b: [
      'Signal handlers stay <b>active during retries</b>.',
      'Workflow A now knows the outage is over.'] },
    { h: 'Reconcile before replaying.', hl: [[898, 90, 354, 46]], path: [[1240, 275], [1240, 112]], lab: [[1318, 158, 'no stale ticket for A', '#15803D']], b: [
      'When ops replays parked work, the workflow checks <b>current state</b> first.',
      'A is recovered, so no ticket is opened for it.'] }] },
  6: { steps: [
    { svg: 'small', h: 'CAM-14 goes silent again.', hl: [[40, 60, 230, 56]], lab: [[292, 104, 'silent again', '#DC2626']], b: [
      'Same camera, a <b>new</b> outage.'] },
    { svg: 'small', h: 'The rest of the site is fine.', hl: [[40, 128, 230, 192], [490, 60, 300, 180]], b: [
      'Other devices keep heartbeating.',
      'This is CAM-14 alone, not a site problem.'] },
    { svg: 'small', h: 'No CAM-14 heartbeats reach the cloud.', hl: [[910, 90, 220, 130]], lab: [[922, 176, 'no CAM-14', '#DC2626']], b: [
      'Its timer starts counting again in Flink.',
      'A late signal for A is still in flight.'] }] },
  7: { steps: [
    { h: 'SILENT at 10, DEAD at 20, again.', hl: [[736, 20, 300, 240]], at: [1010, 238], lab: [[750, 186, 'CAM-14 · DEAD again', '#DC2626']], b: [
      'The same graded ladder runs for the new outage.',
      'Another healthy-to-failed <b>transition</b>.'] },
    { h: 'A new generation: B.', hl: [[444, 30, 250, 220]], at: [1010, 238], lab: [[458, 200, 'outage generation B', '#DC2626']], b: [
      'The generation counter moves on to <b>B</b>.',
      'Stored in durable state, like A.'] },
    { h: 'A new incident ID and a new workflow.', hl: [[1104, 20, 300, 56]], path: LANE_CRIT, lab: [[40, 328, 'new generation → new incident ID', '#5B3FD9']], b: [
      'B is paged and gets <b>its own</b> workflow.',
      'Nothing about A can be confused with B.'] }] },
  8: { steps: [
    { h: 'Workflow B runs its own timers.', hl: [[880, 14, 390, 300]], at: [1240, 66], b: [
      'B has its own ticket timer and its own <b>ack deadline</b>.',
      'Its ID differs from A\'s only in the <b>generation</b>.'] },
    { h: 'A delayed signal for A arrives.', hl: [[1310, 184, 190, 130]], at: [1480, 300], lab: [[1318, 286, 'late · gen A', '#B45309']], b: [
      'A recovery signal for <b>outage A</b> finally shows up.',
      'It names A, not "the open incident".'] },
    { h: 'Its ID and version do not match B: rejected.', hl: [[898, 52, 354, 28], [1310, 184, 190, 130]], path: [[1480, 300], [1306, 250], [1240, 220]], lab: [[1318, 158, 'B stays open', '#1D4ED8']], b: [
      'The signal is <b>rejected</b> as stale for B.',
      'B\'s page stands, and its escalation continues.'] }] },
  9: { steps: [
    DASH_IN,
    { h: 'Acme sees one open incident: B.', hl: [[1200, 20, 310, 370]], at: [1480, 186], b: [
      'The tenant view shows CAM-14 with <b>incident B</b> open.',
      'No ghost incidents, no wrongly closed ones.'] },
    { h: 'A is closed, with its full timeline.', hl: [[490, 174, 320, 96]], at: [790, 220], b: [
      'History shows A: paged, parked, recovered, <b>closed</b>.',
      'Every step is recorded by its workflow.'] }] }
});
}
