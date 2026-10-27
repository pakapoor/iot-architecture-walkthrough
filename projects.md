# IoT Architecture Walkthrough — project changes

## Completed by Codex — 27 October 2026

Starting point: Claude's review-fix commit `19f7ddb`.

Implementation commits, committed and pushed to `main`:

- [`b674429`](https://github.com/pakapoor/iot-architecture-walkthrough/commit/b674429) — Complete walkthrough review, navigation and AI scenarios.
- [`6cc26b5`](https://github.com/pakapoor/iot-architecture-walkthrough/commit/6cc26b5) — Keep queued autoplay paused on mobile and behind dialogs.

Presentation: [GitHub Pages walkthrough](https://pakapoor.github.io/iot-architecture-walkthrough/pres/).

### Navigation and visual design

- Added collapsible **Flows**, **Infra issues**, **Deep dives**, and **Future enhancements** sections. The follow-up UI fix replaces nested dropdowns with direct item lists: expanding a section immediately shows the choices.
- Preserved existing flow categories through non-interactive group labels, direct links, keyboard shortcuts, explored progress and the selected scenario. Only one sidebar section opens at a time.
- Flows opens by default; the other sections start collapsed. Direct links open the relevant section.
- Kept the architecture overview sparse. Deeper answers use focused dialogs with a small diagram, step controls and expandable trade-offs.
- Added mobile access to deep dives and future scenarios, plus video highlighting/scrolling or a desktop-only note for linked architecture flows.

### Sustained 10× traffic scenario

Added the fifth infrastructure issue, **Sustained 10× traffic**, bringing the architecture presentation to 19 timelines.

The walkthrough covers sustained legitimate growth separately from a temporary backlog burst: capacity measurement by envelopes/readings/bytes/state, admission budgets, heartbeat reservation, independent bottleneck scaling, ordered Kafka topic migration, storage and dashboard limits, bounded overload and recovery/soak gates. The 2M-envelope/sec example is a design exercise, not a measured benchmark.

### Runnable interview deep dives

Added six visual, text-supported walkthroughs with Play, Next and Previous controls:

1. Delivery guarantees and replay.
2. Device failure versus monitoring-pipeline failure.
3. Incident identity and recovery races.
4. Tenant isolation.
5. Live and historical data consistency.
6. Safe upgrades and rollback.

These answers are available in the UI, including on phones.

### Runnable future AI scenarios

Added four explicitly labelled proposals, each with a runnable visual sequence, an identified GenAI component, example inputs, evidence, limitations and a human decision boundary:

1. **Predictive maintenance:** historical failure labels and rolling telemetry features feed a risk model; GenAI explains the evidence for daytime preventive review. The 80°C/24-hour/90% example is illustrative and unvalidated; critical alerts retain their immediate path.
2. **Fleet security triage:** anomaly detection flags router/cohort deviations; grounded GenAI evaluates evidence and competing explanations before a human investigation or quarantine decision.
3. **Cross-site root-cause assistant:** topology, telemetry cohorts and deployment history support cited hypotheses that an operator verifies.
4. **Runbook copilot:** retrieval of approved procedures supports a cited investigation plan and restricted read-only diagnostics; production changes remain a human decision.

These are browser simulations. No AI backend, live prediction service or infrastructure execution is connected.

### Architecture accuracy and recovery explanations

Reviewed all 31 original comments and updated the presentation with qualified examples covering:

- Shared SSE replay, expired-cursor snapshots and a versioned snapshot/stream handoff.
- Version-checked Redis state/count updates, cache reconstruction and separate heartbeat-freshness updates.
- Stable ClickHouse event identities, query-time deduplication, versioned rollups and verified export before deletion.
- Event-time disorder, boot/session-aware deduplication, timer restoration and pipeline-freshness gates.
- Bounded edge spooling, acknowledgement boundaries, standby recovery and durable incident publishing.
- Tenant/device outage generations, external ticket uniqueness, original acknowledgement deadlines and recovery while ticketing is parked.
- Asynchronous site correlation, versioned rule updates, tenant-qualified identity and distributed quota scope.
- Local firmware health watchdogs, expected-device canary cohorts, savepoint replay and external reconciliation.
- Correct schema-compatibility definitions, consistent capacity units, and the distinction between source readers, keyed parallelism and worker capacity.

Unconfirmed implementation mechanisms remain labelled as examples or design options. See the [review disposition and validation record](docs/validation.md) for the individual comments.

### Interaction and accessibility fixes

- Fixed connector SVGs intercepting clicks on design-decision cards.
- Completed keyboard activation, dialog focus containment, Escape handling and focus restoration to the invoking card or item.
- Preserved Claude's existing icon/check-mark freeze fix and verified its close-up interaction.
- Kept manual completion separate from automatic Up next progression; automatic completion offers a real five-second countdown after the final card.
- Hardened iframe sender/origin checks and dynamic text rendering.
- Guarded delayed autoplay so it cannot restart behind a topic dialog or after switching to phone layout.
- Checked longer captions, footers, schema diagrams and component-heading fit.

### Build, assets and validation

- Updated the build to generate all 19 flow pages, embed close-ups from `tools/svgs.py`, and derive the video timeline from the interactive timeline definitions.
- Added [browser regression checks](tools/browser_check.py) and [asset rendering](tools/render_assets.py).
- Regenerated `pres/arch_snapshot.png`, `pres/actions_detail.png`, `docs/og.png` and the vector `docs/architecture.svg` from HTML.
- Updated [README.md](README.md) with navigation, scenarios, build/check commands and scope qualifications.
- Browser-checked every pause in all 19 timelines, automatic completion for six representative scenarios, manual stepping, navigation lists, dialogs, light/dark layouts, mobile links/resizing, all ten visual lessons, message handling and the delayed-autoplay guard.
- Checked 57 JavaScript blocks/files, Python syntax, local asset references, duplicate HTML IDs, vector XML, storage SVG text bounds and deterministic regeneration. `git diff --check` passed.

### Remaining limitations

- The existing eight MP4s are earlier rendered snapshots; they were not re-rendered in this work. Current explanations and all new scenarios are available in the interactive UI.
- Browser verification used a local HTTP server mounted at the GitHub Pages project path. It does not establish production throughput, recovery guarantees or model calibration.
- Social platforms may retain cached link-preview images until their crawlers refresh them.
