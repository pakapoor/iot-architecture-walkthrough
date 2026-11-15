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
      '<b>RabbitMQ microservices</b>: the first generation.',
      '<b>Managed Kafka + Flink</b>: device-partitioned streams and per-device state.',
      '<b>Self-managed Kafka + Flink on Kubernetes</b>: the platform in this walkthrough.'] },
    { h: 'Decisions I made, and what they cost', items: [
      '<b>Per-device Flink timers over Kinesis + Lambda.</b> No scanning 100M last-seen rows, no lock-in to one cloud. The cost: we took on running stateful stream processing, with checkpoints and savepoints.',
      '<b>Two alert lanes.</b> Critical issues page immediately; minor ones become 15-minute site digests. The cost: two paths to build, test and operate.',
      '<b>One incident identity, end to end</b> (tenant + device + outage generation), with idempotent upserts. The cost: every integration must honour that key, and recovery needs reconciliation.',
      '<b>Temporal for the incident lifecycle</b>, replacing handlers and cron jobs. The cost: workflow versioning discipline, with replay tests and versioned workers.',
      '<b>Shared topics, with fairness enforced at the gateway</b>, instead of a topic per tenant. The cost: shared capacity needs measured headroom and per-tenant freshness monitoring.'] },
    { h: 'How I led', items: [
      '<b>Alignment across geographies.</b> I won buy-in from the China engineering and DevOps teams for the Kafka + Flink move with a proof of concept, real load data and patient work on their operational concerns.',
      '<b>Led from the code.</b> I led the team technically while building the backend core alongside them.',
      '<b>Designed for failure up front.</b> Bursts, crashes, hot partitions and alert storms were designed for, not discovered in a post-mortem.'] },
    { h: 'Outcomes', items: [
      '<b>200K messages/sec at 99.9% uptime</b>, for 100M+ devices.',
      '<b>Alert floods ended</b>: critical issues page on-call instantly; minor issues arrive as 15-minute site summaries.',
      '<b>No duplicate tickets</b>: ServiceNow tickets created reliably, with retries and a DLQ.',
      '<b>Tenants isolated</b> by quotas, tenant-scoped data and RBAC.'] },
    { h: 'In hindsight', items: [
      'I would start on this streaming architecture from day one, instead of beginning with RabbitMQ microservices.'] }
  ]
};
