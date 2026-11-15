// "My role" dialog, opened from the sidebar (or the R key). Allowed markup: <b>, <i>.
// Facts only: role, team, duration, scale and outcomes come from the presenter; decisions match the walkthrough.
const ROLE = {
  kicker: 'My role',
  title: 'Chief architect · hands-on · technical lead',
  lead: 'I was the chief architect of this platform end to end. I made the architecture decisions and owned their consequences in production. I also built the backend core myself, and led the engineering team technically for the whole project.',
  facts: [['Team', '8'], ['Duration', '16 months'], ['Devices', '100M+'], ['Throughput', '200K messages/sec'], ['Uptime', '99.9%']],
  sections: [
    { h: 'What I owned', items: [
      '<b>The architecture, end to end</b>: from the edge gateway to the ServiceNow ticket, across three generations of the platform.',
      '<b>Every major decision, and its consequences</b>: I made the calls and carried them into production.',
      '<b>The backend core, hands-on</b>: I built the Kafka setup, the Flink jobs and the data stores myself.',
      '<b>Technical leadership</b> of the team of 8, from first design to production.'] },
    { h: 'Scale', items: [
      '<b>100M+ devices</b> across thousands of tenants and 100K+ sites.',
      '<b>200K messages/sec</b> at normal peak (site-batched gateway envelopes), at <b>99.9% uptime</b>.',
      'Late, duplicate and out-of-order telemetry handled by design.',
      'A global region plus an <b>isolated China region</b>.'] },
    { h: 'How the architecture evolved', ordered: true, items: [
      '<b>RabbitMQ + Docker microservices</b>: the first generation. Separate telemetry, heartbeat and rules services, with device state and timestamps in MongoDB.',
      '<b>Managed Kafka + Flink</b>: we moved for <b>higher scale</b>, <b>replay</b> from Kafka\'s durable log, and <b>better out-of-order handling</b> with Flink\'s event time and keyed state.',
      '<b>Self-managed Kafka + Flink on Kubernetes</b>: the platform in this walkthrough.'] },
    { h: 'Decisions I made, and what they cost', items: [
      '<b>Per-device Flink timers over Kinesis + Lambda.</b> No scanning 100M last-seen rows, no lock-in to one cloud. The cost: we took on running stateful stream processing, with checkpoints and savepoints.',
      '<b>Graded alerts, in two lanes.</b> A silent device turns yellow at 10 minutes, pages on-call at 20 and opens a ticket at 30; minor issues become 15-minute site digests. The cost: two paths to build, test and operate, and thresholds to tune per device type.',
      '<b>One incident identity, end to end</b> (tenant + device + outage generation), with idempotent upserts. The cost: every integration must honour that key, and recovery needs reconciliation.',
      '<b>Temporal for the incident lifecycle</b>, replacing handlers and cron jobs. The cost: workflow versioning discipline, with replay tests and versioned workers.',
      '<b>Shared topics, with fairness enforced at the gateway</b>, instead of a topic per tenant. The cost: shared capacity needs measured headroom and per-tenant freshness monitoring.'] },
    { h: 'How I led', items: [
      '<b>Alignment across geographies.</b> I won buy-in from the China engineering and DevOps teams for the Kafka + Flink move with a proof of concept, real load data and patient work on their operational concerns.',
      '<b>Led from the code.</b> I led the team technically while building the backend core alongside them.',
      '<b>Designed for failure up front.</b> Bursts, crashes, hot partitions and alert storms were designed for, not discovered in a post-mortem.'] },
    { h: 'Outcomes', items: [
      '<b>200K messages/sec at 99.9% uptime</b>, for 100M+ devices.',
      '<b>Alert floods ended</b>: short blips stay yellow on dashboards, confirmed outages page on-call, and minor issues arrive as 15-minute site summaries.',
      '<b>No duplicate tickets</b>: ServiceNow tickets created reliably, with retries and a DLQ.',
      '<b>Tenants isolated</b> by quotas, tenant-scoped data and RBAC.'] },
    { h: 'In hindsight', items: [
      'I would start on Kafka + Flink from day one, instead of RabbitMQ microservices.',
      'Scale, replay and out-of-order handling were the reasons we migrated. For a fleet like this they are <b>day-one needs</b>, so starting there would have saved a full migration.'] }
  ]
};
