// "My role" dialog, opened from the sidebar (or the R key). Allowed markup: <b>, <i>.
// Facts only: role, team, duration, scale and outcomes come from the presenter; decisions match the walkthrough.
// Sections start collapsed in the dialog. Result first: why → outcomes → role → decisions → stories → evolution → reflection.
// Stories open with the result, name the teams involved, and stay readable for a non-technical listener.
const ROLE = {
  kicker: 'My role',
  title: 'Chief architect · hands-on · technical lead',
  lead: 'Thousands of tenants rely on this platform to know when a camera or sensor at one of their sites stops working, and to get it fixed. I was its chief architect, end to end: I made the architecture decisions and owned their consequences in production, built the backend core myself, and led our team of 8 technically for 16 months.',
  facts: [['Team', '8'], ['Duration', '16 months'], ['Devices', '100M+'], ['Throughput', '200K messages/sec'], ['Uptime', '99.9%']],
  sections: [
    { h: 'Why it mattered', items: [
      '<b>For customers</b>: thousands of tenants across 100K+ sites need to know when a device fails, and to get it fixed, without drowning in alerts.',
      '<b>The problem</b>: the first generation could not keep up as the fleet grew, could not re-process data after a bug, and mishandled readings that arrived late or out of order.',
      '<b>The bar</b>: 100M+ devices and 200K messages/sec at normal peak (site-batched envelopes), at 99.9% uptime, with every tenant isolated and an isolated China region.'] },
    { h: 'Outcomes', items: [
      '<b>200K messages/sec at 99.9% uptime</b>, for 100M+ devices.',
      '<b>Alert floods ended</b>: short blips stay yellow on dashboards, confirmed outages page on-call, and minor issues arrive as 15-minute site summaries.',
      '<b>No duplicate tickets</b>: ServiceNow tickets created reliably, with retries and a DLQ.',
      '<b>Tenants isolated</b> by quotas, tenant-scoped data and RBAC.'] },
    { h: 'What I owned', items: [
      '<b>The architecture, end to end</b>: from the edge gateway to the ServiceNow ticket, across three generations of the platform.',
      '<b>Every major decision, and its consequences</b>: I made the calls and carried them into production.',
      '<b>The backend core, hands-on</b>: I built the Kafka setup, the Flink jobs and the data stores myself.',
      '<b>Technical leadership</b> of the team of 8, from first design to production.'] },
    { h: 'Decisions I made, and what they cost', items: [
      '<b>Per-device Flink timers over Kinesis + Lambda.</b> No scanning 100M last-seen rows, no lock-in to one cloud. The cost: we took on running stateful stream processing, with checkpoints and savepoints.',
      '<b>Graded alerts, in two lanes</b>, instead of paging on every silence. A silent device turns yellow at 10 minutes, pages on-call at 20 and opens a ticket at 30; minor issues become 15-minute site digests. The cost: two paths to build, test and operate, and thresholds to tune per device type.',
      '<b>One incident identity, end to end</b> (tenant + device + outage generation), with idempotent upserts, instead of matching alerts by time window. The cost: every integration must honour that key, and recovery needs reconciliation.',
      '<b>Temporal for the incident lifecycle</b>, replacing handlers and cron jobs. The cost: workflow versioning discipline, with replay tests and versioned workers.',
      '<b>Shared topics, with fairness enforced at the gateway</b>, instead of a topic per tenant. The cost: shared capacity needs measured headroom and per-tenant freshness monitoring.'] },
    { h: 'How I led: three stories', items: [
      '<b>Changing the foundation, across three teams and two geographies.</b> Result: the platform moved to Kafka + Flink and now runs 200K messages/sec at 99.9% uptime. The first generation, RabbitMQ microservices, could not keep up with the fleet, re-process data or handle late readings. I made the case with a proof of concept on real load data, then worked through the China engineering and DevOps teams\' operational concerns until they backed the move, and my team delivered the migration.',
      '<b>Ending alert floods without missing outages.</b> Result: short blips no longer wake anyone, and confirmed outages still page at once. On-call people were being flooded with alerts. I designed two lanes, critical pages and site digests, and graded silence: yellow at 10 minutes, a page at 20, a ticket at 30.',
      '<b>Leading from the code, designing for failure.</b> Result: bursts, crashes, hot partitions and alert storms were designed for up front, not discovered in a post-mortem. I led the team technically while building the backend core alongside them.'] },
    { h: 'How the architecture evolved', ordered: true, items: [
      '<b>RabbitMQ + Docker microservices</b>: the first generation. Separate telemetry, heartbeat and rules services, with device state and timestamps in MongoDB.',
      '<b>Managed Kafka + Flink</b>: we moved for <b>higher scale</b>, <b>replay</b> from Kafka\'s durable log, and <b>better out-of-order handling</b> with Flink\'s event time and keyed state.',
      '<b>Self-managed Kafka + Flink on Kubernetes</b>: the platform in this walkthrough.'] },
    { h: 'In hindsight', items: [
      'I would start on Kafka + Flink from day one, instead of RabbitMQ microservices.',
      'Scale, replay and out-of-order handling were the reasons we migrated. For a fleet like this they are <b>day-one needs</b>, so starting there would have saved a full migration.'] }
  ]
};
