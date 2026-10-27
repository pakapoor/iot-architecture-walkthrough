// Generated from vid/proposal_data.py by tools/build.sh.
const PROPOSALS = {
  "20": {
    "page": 20,
    "slug": "predictive",
    "name": "Predictive maintenance",
    "components": [
      [
        "Telemetry features",
        "Independent AI job · rolling temperature / resets",
        "Check coverage · add confirmed failure labels",
        "CAM-14 has 24 h of well-covered temperature readings above 80°C. An independent AI job builds features; confirmed failure times and repair records supply offline training labels."
      ],
      [
        "Failure-risk model",
        "Offline training → versioned online scoring",
        "7-day failure risk · validate calibration first",
        "Train on past outcomes; score current features with the released model. A 90% seven-day risk is demo data, not a validated result. The LLM does not calculate this probability."
      ],
      [
        "Grounded GenAI",
        "Explain model inputs using cited repair evidence",
        "Separate observed facts from possible causes",
        "GenAI explains the model inputs and retrieved repairs. Similar repairs support an inspection, not proof of failure. If GenAI is unavailable, show the model result and evidence without its summary."
      ],
      [
        "Preventive review",
        "Ops reviews a daytime maintenance queue",
        "Limit repeated recommendations · recheck freshness",
        "Ops checks current evidence and inspection capacity before approving daytime work. Merge repeated recommendations for the same case; urgent thermal alarms keep their immediate path."
      ]
    ]
  },
  "21": {
    "page": 21,
    "slug": "security",
    "name": "Fleet security triage",
    "components": [
      [
        "Cohort anomaly detector",
        "Independent AI job · baseline + comparable peers",
        "Requires added network / authentication signals",
        "Twelve routers contact new destinations and show auth failures. Proposed network/DNS/auth collection is required; generic telemetry alone cannot reveal these patterns. Compare similar model, role and firmware cohorts."
      ],
      [
        "Scoped evidence retrieval",
        "Fetch authorized logs + firmware changes",
        "Corroborate with independent network evidence",
        "Retrieve tenant-authorized history and firmware changes. Check independent firewall or network logs: an authenticated but compromised router can still report false data."
      ],
      [
        "GenAI security triage",
        "Cited hypotheses: compromise or benign change?",
        "Anomaly score ≠ probability of compromise",
        "GenAI compares compromise with rollout or firmware explanations and cites evidence. It must distinguish facts from hypotheses and abstain when evidence is weak; it cannot authorize quarantine."
      ],
      [
        "Analyst decision",
        "Human investigation + audited approvals",
        "No autonomous quarantine or config writes",
        "The analyst verifies the evidence and escalates a case if warranted. Deduplicate repeated findings; recheck freshness. Quarantine requires separate authorization; detector findings remain available if GenAI fails."
      ]
    ]
  },
  "22": {
    "page": 22,
    "slug": "root-cause",
    "name": "Cross-site root-cause assistant",
    "components": [
      [
        "Site correlation",
        "Independent AI job · site / provider / firmware",
        "Keep independent critical alerts visible",
        "Twelve sites degrade after firmware 4.3.0. Group symptoms by time, provider and firmware; record affected and unaffected sites. Grouping suggests a shared cause but does not establish one."
      ],
      [
        "Evidence retrieval",
        "Join versioned topology + deployment history",
        "Check clock alignment and missing observations",
        "Add topology snapshots and deployment history from their owning systems. Compare rollout timing with symptoms and unaffected cohorts; stale topology or missing clocks can invalidate the comparison."
      ],
      [
        "GenAI hypotheses",
        "Rank explanations with supporting / contrary facts",
        "State what evidence would disprove each cause",
        "GenAI ranks rollout, provider and cloud-cell hypotheses with citations and counter-evidence. A recent deployment is a lead, not proof; show uncertainty rather than invented confidence percentages."
      ],
      [
        "Operator verification",
        "Read-only checks before incident updates",
        "Human owns diagnosis and remediation",
        "Ops checks the leading hypothesis before linking incidents. Resolve only after independently observed recovery. Without enough evidence or AI availability, keep cases separate and use existing dashboards."
      ]
    ]
  },
  "23": {
    "page": 23,
    "slug": "runbook",
    "name": "Runbook copilot",
    "components": [
      [
        "Approved runbook index",
        "New index of approved, versioned procedures",
        "Retain owner, revision and applicability",
        "Index approved runbooks from their owning repository. Keep source links, revisions and supported service versions so a superseded procedure cannot silently become the investigation plan."
      ],
      [
        "Scoped retrieval",
        "Authorized incident facts + matching procedures",
        "Enforce access and redact secrets before prompts",
        "Example: Kafka lag and event age rise while sink latency stays normal. Retrieve matching procedures and authorized facts; enforce tenant access outside the LLM and redact secrets before prompting."
      ],
      [
        "GenAI investigation plan",
        "Propose ordered checks with procedure citations",
        "No applicable source? Abstain and name the owner",
        "GenAI proposes cited partition and consumer checks. Logs and documents are untrusted input; generated tool requests need validation. With no applicable procedure, abstain and route to the service owner."
      ],
      [
        "Read-only tool gate",
        "Allowlisted diagnostics · schema / access checks",
        "Bound cost / time · audit · no write credentials",
        "A separate service validates tool names, arguments and access, then runs bounded read-only checks. Show results to the operator; production changes use the existing approval process, outside the copilot."
      ]
    ]
  }
};
