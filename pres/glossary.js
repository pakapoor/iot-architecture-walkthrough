// "Glossary" dialog, opened from the sidebar (or the G key). Allowed markup: <b>, <i>.
// Each term: [term, plain-English meaning, why it matters here, optional flow slug].
const GLOSSARY = {
  kicker: 'Glossary',
  title: 'Terms used in this walkthrough',
  lead: 'One plain sentence per term, and why it matters in this system.',
  groups: [
    { h: 'Kubernetes', items: [
      ['Pod', 'The smallest unit Kubernetes runs: one or more containers that live and die together.', 'Gateway, ingestion and Flink TaskManagers all run as pods.'],
      ['Node', 'A machine (here an EC2 instance) that runs pods.', 'Nodes sit in different availability zones.', 'k8s-az'],
      ['Deployment', 'Runs N identical, replaceable pods and replaces any that die.', 'Used for stateless services: gateway, ingestion, dashboards.'],
      ['StatefulSet', 'Like a Deployment, but each pod keeps a stable name and its own disk.', 'Kafka brokers need stable identity: broker-0, broker-1, broker-2.', 'k8s-stateful'],
      ['PVC (persistent volume claim)', 'A request for a disk that outlives the pod using it.', 'A restarted Kafka broker reattaches its own data.', 'k8s-stateful'],
      ['DaemonSet', 'Runs one copy of a pod on every node.', 'The Datadog agent runs this way.'],
      ['Service / load balancer', 'A stable address that spreads traffic over healthy pods.', 'Ingestion pods come and go; the address stays.'],
      ['HPA (Horizontal Pod Autoscaler)', 'Adds or removes pods based on a metric such as CPU.', 'Scales the gateway and ingestion pools.', 'k8s-scale'],
      ['KEDA', 'Event-driven autoscaling: scales pods on external signals such as Kafka lag.', 'Consumers scale on lag, the real signal of falling behind.', 'k8s-scale'],
      ['Karpenter', 'Adds right-sized nodes when pods cannot be scheduled, and removes idle ones.', 'Pods scale in seconds; nodes take a minute or two.', 'k8s-scale'],
      ['PDB (PodDisruptionBudget)', 'A limit on how many pods of a group may be down at once during planned work.', 'At most one Kafka broker down during a node drain.', 'k8s-stateful'],
      ['Operator / CRD', 'A controller that runs a complex system for you, driven by a custom resource (CRD) you write in YAML.', 'Strimzi runs Kafka; the Flink Operator runs Flink jobs.', 'k8s-stateful'],
      ['Probes', 'Liveness restarts a stuck pod; readiness keeps traffic away until a pod is ready.', 'No traffic reaches an ingestion pod that is still starting.'],
      ['Requests and limits', 'The CPU and memory a pod is guaranteed, and the most it may use.', 'Stops one service starving its neighbours on a node.'],
      ['Anti-affinity', 'A rule that keeps replicas apart, e.g. on different nodes or zones.', 'Losing one zone never takes every replica.', 'k8s-az'],
      ['NetworkPolicy', 'A firewall rule between pods; deny by default, allow what is needed.', 'A compromised pod cannot reach everything.'],
      ['IRSA', 'IAM Roles for Service Accounts: each service gets its own narrow AWS role.', 'No shared, all-powerful credentials.'],
      ['Argo CD', 'GitOps: keeps each cluster matching what is in Git.', 'Every change is a reviewed commit, and rollback is a revert.', 'cicd'],
      ['Helm', 'A packaging tool: templated Kubernetes YAML per service.', 'One chart, values per region.'],
      ['EKS', 'Amazon\'s managed Kubernetes: AWS runs the control plane, we run the workloads.', 'Our platform, one cluster per region.', 'eks-ecs'],
      ['ECS', 'Amazon\'s simpler container service, without Kubernetes.', 'Considered and rejected: no operators for Kafka and Flink.', 'eks-ecs'],
      ['Fargate', 'Serverless compute for containers: no nodes to manage.', 'Fine for small stateless services; not for Kafka brokers.', 'eks-ecs']
    ] },
    { h: 'Streaming', items: [
      ['Partition', 'One ordered slice of a Kafka topic.', 'Keyed by tenant + device, so each device stays in order.', 'hot'],
      ['Consumer lag', 'How many messages are waiting for a consumer to read them.', 'The first sign the pipeline is falling behind.', 'lag'],
      ['Offset', 'A message\'s position in its partition.', 'Rewind the offset to replay.'],
      ['Replay', 'Reprocessing messages Kafka still holds.', 'Recovers from a crash or a bug without data loss.', 'replay'],
      ['Checkpoint', 'A periodic, automatic snapshot of Flink state and Kafka offsets.', 'A crashed job resumes from it.', 'crash'],
      ['Savepoint', 'A snapshot you take on purpose, for upgrades and rescaling.', 'Upgrade a Flink job without losing timers or state.', 'upgrades'],
      ['Watermark', 'Flink\'s estimate of how far event time has progressed.', 'Handles late and out-of-order readings.'],
      ['Keyed state', 'Data Flink keeps per key, e.g. per device.', 'Holds each device\'s silence timer.', 'health'],
      ['Idempotent', 'Safe to repeat: doing it twice has the same effect as once.', 'Retries never create a second ticket.', 'replay']
    ] },
    { h: 'Reliability and security', items: [
      ['Availability zone (AZ)', 'An isolated data centre within a region.', 'We spread over 3 and survive losing one.', 'k8s-az'],
      ['Region', 'A geographic area with its own set of zones.', 'Each tenant has a home region.', 'residency'],
      ['RPO', 'Recovery point objective: how much recent data you can afford to lose.', 'Set by replication lag to the standby.', 'region'],
      ['RTO', 'Recovery time objective: how long recovery may take.', 'Time to fail over and catch up.', 'region'],
      ['mTLS', 'Mutual TLS: both sides prove who they are with certificates.', 'Every site gateway proves its identity.'],
      ['PKI / issuing CA', 'The system that issues and revokes certificates; an issuing CA signs them under an offline root.', 'One issuing CA per region.', 'residency'],
      ['Quota', 'A per-tenant or per-device budget of traffic.', 'Stops a noisy neighbour at the gateway.', 'hot'],
      ['DLQ (dead-letter queue)', 'Where messages go after retries are exhausted, for inspection and replay.', 'Failed ticket calls are kept, never lost.', 'red-snow']
    ] }
  ]
};
