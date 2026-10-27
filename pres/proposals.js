// Generated from vid/proposal_data.py by tools/build.sh.
const PROPOSALS = {
  "20": {
    "page": 20,
    "slug": "predictive",
    "name": "Predictive maintenance",
    "components": [
      [
        "Feature windows",
        "Flink candidate job · heat / resets / gaps",
        "Check coverage · failure labels for offline evaluation",
        "E.g. CAM-14 has well-covered readings above 80°C for 24 h. Flink builds rolling features and emits a candidate; confirmed failure/repair outcomes support offline evaluation, not future-data leakage."
      ],
      [
        "Decision service · Jev",
        "Temporal activity → official Jev API",
        "Noul: failure in 7 days? · shadow mode first",
        "Decision service calls the Jev API (candidates only, fallback to rules). Noul asks about failure within 7 days; e.g. 0.90 is illustrative and unvalidated. Validate on our outcomes before treating it as fleet risk."
      ],
      [
        "Grounded GenAI",
        "Explain evidence + similar repairs with citations",
        "Cannot reveal Jev reasoning or invent a score",
        "GenAI cites observed heat exposure and similar repairs, then explains uncertainty. Jev returns typed values, not its reasoning; the narrative cannot claim to reveal its internal decision drivers."
      ],
      [
        "Preventive review",
        "Ops reviews a daytime maintenance queue",
        "Deduplicate cases · recheck freshness",
        "Ops checks evidence and inspection capacity before approving daytime work. If AI is unavailable, use existing rules with no AI recommendation. Critical thermal alerts keep their immediate lane."
      ]
    ],
    "jev": {
      "role": "Internal decision service → official TypeSafe Jev API",
      "request": "Compact redacted features and pseudonymous case IDs; no raw logs or PII. Default budgets: 64k tokens/request and 32k for state + any question. Require a vendor DPA before enablement.",
      "recovery": "Temporal activity with timeout, bounded retries and circuit breaker. Unavailable, stale or malformed answer → existing rules + no AI recommendation. Critical DEAD/thermal alerts never wait.",
      "evaluation": "Shadow mode first. Pin model/question versions; validate and calibrate on real outcomes, device cohorts and time holdouts; monitor drift, false positives and bias.",
      "residency": "China-region tenants: disabled by proposed policy; existing rules remain active. Apply the same regional policy to GenAI; do not send a fallback request to another external model.",
      "audit": "Retain the exact redacted state, typed answer/probabilities, versions and human outcome under tenant access and retention limits. Human acceptance is feedback, not proof that the diagnosis was correct.",
      "about": "Jev is a proprietary discriminative model from TypeSafe AI, released in limited early access in September 2026. It returns typed answers rather than text. Synthetic training does not establish calibration on this fleet; speed and cost figures are vendor-reported, not benchmarks for this design.",
      "limits": "A 2026 preprint found anchoring, answer-order and probability-judgment weaknesses in Jev 1.13. Evaluate the pinned version on our own cases; neither a typed answer nor a high probability proves the diagnosis.",
      "portability": "An adapter can put alternative models behind our decision-service contract; TypeSafe publishes a client-compatible LLM adapter, but switching models still requires re-evaluation rather than assuming equivalent probabilities or an identical hosted /v1/systemone API.",
      "sources": [
        [
          "Jev types and answers",
          "https://docs.typesafe.ai/introduction"
        ],
        [
          "API and context limits",
          "https://docs.typesafe.ai/models"
        ],
        [
          "Early-access launch",
          "https://typesafe.ai/blog/introducing-system-one-models-and-jev"
        ],
        [
          "Bias study · Jev 1.13",
          "https://arxiv.org/abs/2610.19619"
        ],
        [
          "Alternative-model adapter",
          "https://github.com/typesafe-ai/system-one-adapter-python"
        ]
      ]
    },
    "question": "Noul: will this device fail within the next 7 days?",
    "options": "Binary outcome, defined by confirmed failure labels. E.g. 0.90 is an illustrative, unvalidated probability; Score is an ordered rubric, not P(failure)."
  },
  "21": {
    "page": 21,
    "slug": "security",
    "name": "Fleet security triage",
    "components": [
      [
        "Cohort anomaly detector",
        "Flink candidate job · statistical deviation",
        "Added network / auth data · comparable peers",
        "E.g. twelve routers show new destinations and auth failures. Add network/auth collection, attach recent firmware changes, and compare similar peers. Jev receives this summary; it is not a raw time-series detector."
      ],
      [
        "Decision service · Jev",
        "Temporal activity → official Jev API",
        "Choice: compromise / rollout / other causes",
        "Decision service calls the Jev API (candidates only, fallback to rules). Choice compares compromise, rollout, misconfiguration, benign and insufficient evidence; returned probabilities require local validation."
      ],
      [
        "GenAI security brief",
        "Retrieve scoped evidence · cite alternatives",
        "Untrusted logs · corroborate independently",
        "GenAI retrieves tenant-authorized logs and firmware changes to explain the leading choices with citations. Corroborate with independent network evidence: an authenticated compromised router can still report false data."
      ],
      [
        "Analyst decision",
        "Human investigation + audited approvals",
        "No autonomous quarantine or config writes",
        "The analyst verifies the evidence before escalation. Deduplicate repeated cases and recheck freshness; quarantine requires separate authorization. Without AI, retain rule alerts and manual investigation."
      ]
    ],
    "jev": {
      "role": "Internal decision service → official TypeSafe Jev API",
      "request": "Compact redacted features and pseudonymous case IDs; no raw logs or PII. Default budgets: 64k tokens/request and 32k for state + any question. Require a vendor DPA before enablement.",
      "recovery": "Temporal activity with timeout, bounded retries and circuit breaker. Unavailable, stale or malformed answer → existing rules + no AI recommendation. Critical DEAD/thermal alerts never wait.",
      "evaluation": "Shadow mode first. Pin model/question versions; validate and calibrate on real outcomes, device cohorts and time holdouts; monitor drift, false positives and bias.",
      "residency": "China-region tenants: disabled by proposed policy; existing rules remain active. Apply the same regional policy to GenAI; do not send a fallback request to another external model.",
      "audit": "Retain the exact redacted state, typed answer/probabilities, versions and human outcome under tenant access and retention limits. Human acceptance is feedback, not proof that the diagnosis was correct.",
      "about": "Jev is a proprietary discriminative model from TypeSafe AI, released in limited early access in September 2026. It returns typed answers rather than text. Synthetic training does not establish calibration on this fleet; speed and cost figures are vendor-reported, not benchmarks for this design.",
      "limits": "A 2026 preprint found anchoring, answer-order and probability-judgment weaknesses in Jev 1.13. Evaluate the pinned version on our own cases; neither a typed answer nor a high probability proves the diagnosis.",
      "portability": "An adapter can put alternative models behind our decision-service contract; TypeSafe publishes a client-compatible LLM adapter, but switching models still requires re-evaluation rather than assuming equivalent probabilities or an identical hosted /v1/systemone API.",
      "sources": [
        [
          "Jev types and answers",
          "https://docs.typesafe.ai/introduction"
        ],
        [
          "API and context limits",
          "https://docs.typesafe.ai/models"
        ],
        [
          "Early-access launch",
          "https://typesafe.ai/blog/introducing-system-one-models-and-jev"
        ],
        [
          "Bias study · Jev 1.13",
          "https://arxiv.org/abs/2610.19619"
        ],
        [
          "Alternative-model adapter",
          "https://github.com/typesafe-ai/system-one-adapter-python"
        ]
      ]
    },
    "question": "Choice: which explanation best fits this summarized candidate?",
    "options": "Compromise / firmware rollout / misconfiguration / benign / insufficient evidence. Return probabilities over these supplied options; these are hypotheses, not proof."
  },
  "22": {
    "page": 22,
    "slug": "root-cause",
    "name": "Cross-site root-cause assistant",
    "components": [
      [
        "Cohort / topology join",
        "Flink candidate job · sites / provider / firmware",
        "Compare affected and unaffected cohorts",
        "E.g. twelve sites degrade after firmware 4.3.0. Join symptoms with versioned topology and change history; compare unaffected cohorts and clock alignment before creating a candidate."
      ],
      [
        "Decision service · Jev",
        "Temporal activity → official Jev API",
        "Choice: firmware / network / cell / independent",
        "Decision service calls the Jev API (candidates only, fallback to rules). Choice ranks firmware cohort, provider, cloud cell, independent failures or insufficient evidence. Correlation remains a hypothesis."
      ],
      [
        "GenAI cause explanation",
        "Cite supporting and contrary observations",
        "State what would disprove the top choice",
        "GenAI explains the leading choice with authorized evidence and counter-evidence. A recent deployment is a lead, not proof; stale topology, missing observations or uncertain clocks must remain visible."
      ],
      [
        "Operator verification",
        "Read-only checks before incident updates",
        "Critical faults remain independently actionable",
        "Ops verifies before linking incidents and resolves only after observed recovery. With weak evidence or unavailable AI, keep cases separate and use existing dashboards; independent critical faults remain actionable."
      ]
    ],
    "jev": {
      "role": "Internal decision service → official TypeSafe Jev API",
      "request": "Compact redacted features and pseudonymous case IDs; no raw logs or PII. Default budgets: 64k tokens/request and 32k for state + any question. Require a vendor DPA before enablement.",
      "recovery": "Temporal activity with timeout, bounded retries and circuit breaker. Unavailable, stale or malformed answer → existing rules + no AI recommendation. Critical DEAD/thermal alerts never wait.",
      "evaluation": "Shadow mode first. Pin model/question versions; validate and calibrate on real outcomes, device cohorts and time holdouts; monitor drift, false positives and bias.",
      "residency": "China-region tenants: disabled by proposed policy; existing rules remain active. Apply the same regional policy to GenAI; do not send a fallback request to another external model.",
      "audit": "Retain the exact redacted state, typed answer/probabilities, versions and human outcome under tenant access and retention limits. Human acceptance is feedback, not proof that the diagnosis was correct.",
      "about": "Jev is a proprietary discriminative model from TypeSafe AI, released in limited early access in September 2026. It returns typed answers rather than text. Synthetic training does not establish calibration on this fleet; speed and cost figures are vendor-reported, not benchmarks for this design.",
      "limits": "A 2026 preprint found anchoring, answer-order and probability-judgment weaknesses in Jev 1.13. Evaluate the pinned version on our own cases; neither a typed answer nor a high probability proves the diagnosis.",
      "portability": "An adapter can put alternative models behind our decision-service contract; TypeSafe publishes a client-compatible LLM adapter, but switching models still requires re-evaluation rather than assuming equivalent probabilities or an identical hosted /v1/systemone API.",
      "sources": [
        [
          "Jev types and answers",
          "https://docs.typesafe.ai/introduction"
        ],
        [
          "API and context limits",
          "https://docs.typesafe.ai/models"
        ],
        [
          "Early-access launch",
          "https://typesafe.ai/blog/introducing-system-one-models-and-jev"
        ],
        [
          "Bias study · Jev 1.13",
          "https://arxiv.org/abs/2610.19619"
        ],
        [
          "Alternative-model adapter",
          "https://github.com/typesafe-ai/system-one-adapter-python"
        ]
      ]
    },
    "question": "Choice: which candidate cause best explains this incident group?",
    "options": "Firmware cohort / network provider / cloud cell / independent failures / insufficient evidence. These alternatives are a hypothesis set, not an exhaustive causal model."
  },
  "23": {
    "page": 23,
    "slug": "runbook",
    "name": "Runbook copilot",
    "components": [
      [
        "Incident + runbook context",
        "Flink candidate + approved procedure index",
        "Retain owner, revision and applicability",
        "E.g. Kafka lag and event age rise while sink latency stays normal. Add an index of approved versioned runbooks; build an authorized shortlist with incident facts and service ownership."
      ],
      [
        "Decision service · Jev",
        "Temporal activity → official Jev API",
        "Choice: runbook / none · Score: review priority",
        "Decision service calls the Jev API (candidates only, fallback to rules). Choice selects an approved runbook or none applies. Score can rank review need; deterministic policy, never the score, decides required approvals."
      ],
      [
        "GenAI investigation plan",
        "Draft only from the selected approved runbook",
        "Cite sources · abstain when none applies",
        "GenAI drafts ordered checks only from the selected procedure, with revision links. Treat documents and logs as untrusted; if no runbook applies, abstain and route to the owner instead of inventing commands."
      ],
      [
        "Read-only tool gate",
        "Allowlist + schema / access / cost checks",
        "No write credentials · audit each diagnostic",
        "A separate service validates tool names, arguments and access, then runs bounded read-only diagnostics. Show results to Ops; production changes need explicit approval in the existing process, outside the copilot."
      ]
    ],
    "jev": {
      "role": "Internal decision service → official TypeSafe Jev API",
      "request": "Compact redacted features and pseudonymous case IDs; no raw logs or PII. Default budgets: 64k tokens/request and 32k for state + any question. Require a vendor DPA before enablement.",
      "recovery": "Temporal activity with timeout, bounded retries and circuit breaker. Unavailable, stale or malformed answer → existing rules + no AI recommendation. Critical DEAD/thermal alerts never wait.",
      "evaluation": "Shadow mode first. Pin model/question versions; validate and calibrate on real outcomes, device cohorts and time holdouts; monitor drift, false positives and bias.",
      "residency": "China-region tenants: disabled by proposed policy; existing rules remain active. Apply the same regional policy to GenAI; do not send a fallback request to another external model.",
      "audit": "Retain the exact redacted state, typed answer/probabilities, versions and human outcome under tenant access and retention limits. Human acceptance is feedback, not proof that the diagnosis was correct.",
      "about": "Jev is a proprietary discriminative model from TypeSafe AI, released in limited early access in September 2026. It returns typed answers rather than text. Synthetic training does not establish calibration on this fleet; speed and cost figures are vendor-reported, not benchmarks for this design.",
      "limits": "A 2026 preprint found anchoring, answer-order and probability-judgment weaknesses in Jev 1.13. Evaluate the pinned version on our own cases; neither a typed answer nor a high probability proves the diagnosis.",
      "portability": "An adapter can put alternative models behind our decision-service contract; TypeSafe publishes a client-compatible LLM adapter, but switching models still requires re-evaluation rather than assuming equivalent probabilities or an identical hosted /v1/systemone API.",
      "sources": [
        [
          "Jev types and answers",
          "https://docs.typesafe.ai/introduction"
        ],
        [
          "API and context limits",
          "https://docs.typesafe.ai/models"
        ],
        [
          "Early-access launch",
          "https://typesafe.ai/blog/introducing-system-one-models-and-jev"
        ],
        [
          "Bias study · Jev 1.13",
          "https://arxiv.org/abs/2610.19619"
        ],
        [
          "Alternative-model adapter",
          "https://github.com/typesafe-ai/system-one-adapter-python"
        ]
      ]
    },
    "question": "Choice: which approved runbook applies, including none applies?",
    "options": "Authorized runbook IDs plus none applies. Optional Score rates review need for a supplied approved step on a low→high rubric. It cannot assess an unseen draft or grant execution authority."
  }
};
