# IoT Architecture Walkthrough — project changes

## Completed by Codex — 27 October 2026

Starting point: Claude's review-fix commit `19f7ddb`.

Implementation commits, committed and pushed to `main`:

- [`b674429`](https://github.com/pakapoor/iot-architecture-walkthrough/commit/b674429) — Complete walkthrough review, navigation and AI scenarios.
- [`6cc26b5`](https://github.com/pakapoor/iot-architecture-walkthrough/commit/6cc26b5) — Keep queued autoplay paused on mobile and behind dialogs.
- [`76781fa`](https://github.com/pakapoor/iot-architecture-walkthrough/commit/76781fa) — Reveal navigation items directly when a section opens.
- [`bfbf1ac`](https://github.com/pakapoor/iot-architecture-walkthrough/commit/bfbf1ac) — Integrate future components into the existing architecture and tighten recovery explanations.
- [`b44611f`](https://github.com/pakapoor/iot-architecture-walkthrough/commit/b44611f) — Correct throughput layers, Redis slots and tenant/device naming.
- [`cdffdc5`](https://github.com/pakapoor/iot-architecture-walkthrough/commit/cdffdc5) — Add Jev behind the proposed decision service in all four future scenarios.

Presentation: [GitHub Pages walkthrough](https://pakapoor.github.io/iot-architecture-walkthrough/pres/).

### Navigation and visual design

- Added collapsible **Flows**, **Infra issues**, **Deep dives**, and **Future enhancements** sections. The follow-up UI fix replaces nested dropdowns with direct item lists: expanding a section immediately shows the choices.
- Preserved existing flow categories through non-interactive group labels, direct links, keyboard shortcuts, explored progress and the selected scenario. Only one sidebar section opens at a time.
- Flows opens by default; the other sections start collapsed. Direct links open the relevant section.
- Kept the architecture overview sparse. Deeper answers use focused dialogs with a small diagram, step controls and expandable trade-offs.
- Added mobile access to deep dives and future scenarios, plus video highlighting/scrolling or a desktop-only note for linked architecture flows.

### Sustained 10× traffic scenario

Added the fifth infrastructure issue, **Sustained 10× traffic**, bringing infrastructure scenarios to five; the complete build now includes 23 architecture timelines.

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

1. **Predictive maintenance:** rolling features produce candidates; Jev Noul supplies an unvalidated failure-risk estimate that must be calibrated against confirmed outcomes. GenAI summarizes evidence for daytime review. E.g. 80°C/24 hours/90% remains illustrative; critical alerts retain their immediate path.
2. **Fleet security triage:** statistical anomaly detection flags router/cohort deviations; Jev Choice compares explanations, and GenAI cites evidence before a human investigation or quarantine decision.
3. **Cross-site root-cause assistant:** topology, telemetry cohorts and deployment history supply Jev Choice hypotheses; GenAI presents supporting/contrary evidence for an operator to verify.
4. **Runbook copilot:** Jev Choice selects an approved procedure or abstains; GenAI drafts a cited plan and restricted read-only diagnostics collect evidence. Score is advisory; deterministic policy and humans control production changes.

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

- Updated the build to generate all 23 flow pages, embed close-ups from `tools/svgs.py`, and derive the video timeline from the interactive timeline definitions.
- Added [browser regression checks](tools/browser_check.py) and [asset rendering](tools/render_assets.py).
- Regenerated `pres/arch_snapshot.png`, `pres/actions_detail.png`, `docs/og.png` and the vector `docs/architecture.svg` from HTML.
- Updated [README.md](README.md) with navigation, scenarios, build/check commands and scope qualifications.
- Browser-checked every pause in all 23 timelines, automatic completion for six representative scenarios, manual stepping, navigation lists, dialogs, light/dark layouts, mobile links/resizing, all ten visual lessons, message handling and the delayed-autoplay guard.
- Checked JavaScript/Python syntax, local asset references, duplicate HTML IDs, vector XML, storage SVG text bounds and deterministic regeneration. `git diff --check` passed.

### Remaining limitations

- The existing eight MP4s are earlier rendered snapshots; they were not re-rendered in this work. Current explanations and all new scenarios are available in the interactive UI.
- Browser verification used a local HTTP server mounted at the GitHub Pages project path. It does not establish production throughput, recovery guarantees or model calibration.
- Social platforms may retain cached link-preview images until their crawlers refresh them.


## Follow-up — direct lists and integrated future architectures

- Published `76781fa` to remove the redundant nested selection controls. Opening Flows, Infra issues, Deep dives or Future enhancements now immediately lists its items; only one sidebar section stays open. Mobile topic lists follow the same pattern.
- Future scenarios now open full main-stage architectures, preserving the existing ingestion/Kafka/Flink/storage/dashboard/action components and adding four clearly marked proposed components with actual connectors.
- Added architecture timelines 20–23 for predictive maintenance, security triage, root-cause assistance and the runbook copilot. Main Play/Next controls trace the integrated data, model/GenAI and human-reviewed action path. Proposed components support keyboard/mouse close-ups.
- Problem, alternatives and trade-offs remain accessible through the scenario details button. Detail/mobile playback highlights the relevant proposed component on the full architecture preview instead of replacing it with a detached mini-pipeline.
- Added `vid/proposal_data.py` as the component/timeline source, generated `pres/proposals.js`, and four architecture preview assets. The build now produces 23 timelines.
- Reviewed the new content for technical correctness and clarity: made topic-cutover state/offset handling explicit, distinguished heartbeat event time from receipt time, specified consistent snapshot/replay boundaries, and clarified incident identity and Temporal versioning contracts.
- Proposed AI paths use an independent Kafka consumer and capacity budget, identify additional evidence sources, preserve critical alerts, and explain missing-evidence/AI-outage handling. Numeric predictions remain illustrative until validated against real outcomes.


## Review follow-up — units, heartbeat clock and Redis slots

- Labelled the 200K normal and designed-for 500K burst rates as gateway envelopes/sec; Kafka, Flink and ClickHouse capacity is measured in unpacked device readings and bytes (about 1.7M heartbeat readings/sec at one/minute for 100M devices).
- Preserved the liveness explanation that validates heartbeat event age and clock bounds: late spooled heartbeats are history, not renewed health.
- Scoped Redis atomic device/site-count transitions to a site hash tag, with asynchronous, reconciled tenant totals; explained the hot-slot risk of a tenant-wide tag.
- Aligned partition/key titles to tenant + device identity and corrected current build/validation descriptions to 23 timelines.

## Jev decision service — future proposals

- All four future architectures retain four components: a separately budgeted Flink candidate job, an internal decision service calling the official Jev API, cited GenAI assistance, and human review or a restricted diagnostic gate.
- Corrected the brief against official API semantics: Noul supplies a yes/no probability; Score rates an ordered rubric. Default context limits are 64k/request and 32k/state plus any question. Alternative models require an adapter and re-evaluation.
- Added question types/options, candidate-only Temporal activities, bounded retries/timeouts, circuit breaking and rule fallback to the UI and component close-ups. Critical alerts stay independent.
- UI trade-offs explain DPA/redaction, regional disablement, shadow evaluation, calibration, drift/bias and scoped audit retention, with primary documentation links. Runbook scores never authorize production writes.
- These remain simulations; no external model API or infrastructure tool is connected.

## Final integration checks

- Played sustained growth and all four Jev scenarios through the final card, countdown and next-flow transition. Checked every pause in all 23 timelines.
- Opened all four Jev close-ups and supporting dialogs in light/dark themes; verified text/viewport fit after animation, Escape and focus restoration. All six deep dives and four future lessons also complete on phone layout.
- Regenerated architecture/social previews, checked Python/JavaScript syntax, local references and unique HTML IDs, and confirmed a deterministic rebuild. Browser console and `git diff --check` are clean.
- Content review clarified trigger, evidence, typed decision, uncertainty, action owner and fallback in the UI. Proposed throughput and risk numbers remain explicitly illustrative or designed-for.

## 15 November 2026 — presenter mode, inside views, sidebar and My role (Claude)

Context: the presentation is the presenter's keystone project for an L7 leadership round; the changes favour presenting live.

- **Explanation panel:** a left panel shows each step as a spoken heading plus bullets (`pres/notes.js`); the diagram moves right and scales to fit. It follows the step the ball rests on (the old bottom caption ran one step ahead). The Captions toggle became Explanation panel. Critical alert · field fix (flow 1) has full notes; other flows fall back to their captions until written.
- **Playback:** Play runs at 40% of stepping speed and dwells 4 s per stop (`PLAY_SPEED` in `pres/timeline2p.js`). A ■ Stop button / S key halts playback on the current step and cancels Up next.
- **Inside views:** clicking the component the ball rests on opens an animated view of what happens inside it, over the component's close-up SVG (highlights, ball path, live labels, own controls, panel text per sub-step). Flow 1 steps 1–7 have sequences; step 8 hands off to the Temporal zoom. Other tiles keep the static close-up.
- **Sidebar:** Flows (device data, alerts, multi-tenancy) · Deep dives ("When things break" infra issues + "Correctness & trade-offs" lessons) · Deployment & upgrades (collapsed, last). Up next follows that order; shortcuts unchanged.
- **Future enhancements removed:** the four AI scenarios (flows 20–23, Jev decision service), their assets, generator (`vid/proposal_data.py`) and tests. 19 timelines remain; old `?future=` links fall back to the architecture. Recoverable from git history before this change.
- **My role:** a sidebar dialog (`pres/role.js`, R key) with role, team of 8, 16 months, scale, three architecture generations, decisions and their costs, leadership and outcomes. The company is intentionally not named anywhere.
- **Validation:** `tools/browser_check.py` updated for the new structure (16 checks, all passing); one flaky check now waits for its async dialog.
- **Simplified controls (later the same day):** the Observability, Design decisions and Explanation panel switches were removed. Observability tiles are always shown, the explanation panel appears in every flow (not on the overview), and design decisions were removed entirely: the cards under the diagram, their dialogs, the 📄 Description & trade-offs button and the D key. The deep-dive lessons keep their own dialog.
- **Edge Site:** the close-up is now a tenant view (Acme, 214 sites) with two clickable example sites: Site-07 (small store, e.g. 48 devices, one edge pair, Zigbee/BLE bridge) and a flagship (large, e.g. ~500 devices, non-edge routers on a wired backbone plus Wi-Fi mesh, still one edge pair and one uplink). Link types are labelled as examples. Flow 1's Edge inside view walks tenant → Site-07 → WAN → spool what-if → flagship (inside views can switch diagram per sub-step).
- **Presenter notes for every flow:** all 19 flows now have read-aloud notes (intro, one heading + bullets per step, recap), written in parallel per group (`pres/notes-alerts.js`, `notes-device.js`, `notes-infra.js`, `notes-deploy.js`, registered with `registerFlow`). Flows 2 and 5 reuse flow 1's opening steps and inside views by reference. Every [a]-layer tile that has a close-up has an inside view; facts come only from the captions and close-ups, with example/designed-for labels kept.
- **Stay-stop fix:** at a pause, a following "stay" stop starts at exactly the pause time, so the panel, inside-view trigger and scene state showed the next step early (e.g. the DEAD chip while still counting). All three now treat a stop as reached strictly after its start.
- **Graded silence alerts (decision):** a silent device turns 🟡 **SILENT** at 10 minutes (dashboards only: no page, no ticket), becomes 🔴 **DEAD** at 20 minutes (incident emitted, on-call paged at once), and gets a ServiceNow ticket at minute 30 if still DEAD. Flink runs the 10/20 rungs on the same per-device timer; the Temporal workflow owns the minute-30 rung as a durable timer, so a recovery before then cancels it and no ticket is raised. The ack deadline stays 30 minutes from the page (minute 50 → L2). SILENT is distinct from DEGRADED (slow but talking). Tenant overrides apply to the ladder (example: another tenant 15/30). Rationale: a 5-minute DEAD threshold paged on brief network blips. Applied consistently to flows 1, 2, 5, 7, 8 and 16 (site power cut: one site page at 20, one site ticket at 30), the Flink and MongoDB close-ups and the Flink/Action tile descriptions, the workflow step labels, `svcnow.html`, `iot.html` and My role. Re-rendered `pres/actions_detail.png`, `pres/arch_snapshot.png`, `docs/og.png` and `docs/architecture.svg` from the updated sources.
- **My role:** "How the architecture evolved" now names the first generation (RabbitMQ + Docker microservices with MongoDB) and why we moved to Kafka + Flink (scale, replay, out-of-order handling); "In hindsight" says the presenter would start on Kafka + Flink from day one.

## 15 November 2026 — My role: collapsible, and review round 1 against Atlassian's values (Claude)

- **Collapsible sections:** My role shows the lead and fact chips; each section is a collapsed `<details>` with its item count, plus Expand all / Collapse all. Browser test covers default-collapsed and expand/collapse all.
- **Research basis (round 1, web, verified 2-of-3):** Atlassian's five values are unchanged (atlassian.com/company/values, checked 2026-11-15). The loop has a separate ~45-minute values interview (behavioural/situational, often by someone outside the hiring team) and a manager interview that asks for a past project: who you worked with, technical challenges, business reason, collaboration style, and "if you don't know, say so". Anecdotal but repeated: strong technical candidates, including principal level, are rejected or down-levelled for thin, abstract leadership/values examples. No official L7 rubric is published.
- **Changes (facts already supplied by the presenter only):** the lead now opens with the customer reason and says "our team of 8"; new **Why it mattered** (customers, the first-generation problem, the bar), replacing Scale; **How I led** became three short stories (the Kafka + Flink move won across geographies; ending alert floods with graded alerts; leading from the code and designing for failure); sections reordered why → role → decisions → stories → evolution → outcomes → hindsight.
- **Not added (needs the presenter's own facts):** a story about growing an engineer, a disagreement handled without overriding someone, customer/business metrics (e.g. time to detect, tickets avoided), and a failure the presenter owned.

## 15 November 2026 — My role: review round 2 (Claude)

- **Research basis (round 2, web, verified 2-of-3):** Atlassian's published engineering career framework (Project Pascal, 2021; post since taken down, read from an archive) has four pillars — Lead and Inspire, Master the Craft, Drive Outcomes, Have Customer Impact — and stresses measurable outcomes over output. Practitioner guidance (former big-tech hiring managers; not Atlassian policy): at Staff+ the leadership rounds decide the level, story scope (multi-team) is the main signal, lead with the result and business impact, and make alternatives and decision criteria explicit. The values interviewer may be non-technical. The March 2026 restructuring did not visibly change senior loops; no official AI-in-interview policy is published.
- **Changes:** Outcomes moved up, right after Why it mattered (result first). Each story now opens with its result and names its scope ("three teams and two geographies"). Two decisions name the rejected alternative (paging on every silence; matching alerts by time window). The problem statement is in plain language for a non-technical values interviewer.
- **Still needs the presenter's own facts:** growing an engineer; a disagreement over direction with another team or leader; customer/business numbers; a decision that turned out wrong.

## 16 November 2026 — Correctness deep dives become flows (Claude)

- **Sidebar:** the six *Correctness & trade-offs* deep dives (Delivery & replay, Device or pipeline failure?, Incident recovery races, Tenant isolation, Live & history consistency, Safe upgrades & rollback) now open as flows 20–25 on the main architecture diagram, like the *When things break* flows: selection, explored ticks, share links (`?flow=`), up-next order and Back to architecture all work. Old `?deep=<slug>` links open the matching flow.
- **Removed:** the lesson pop-up (its own box diagram, which rendered as black boxes in dark mode and let text overflow), with its Play/Next controls and styling; the dialog now serves My role only. On phones, a *Deep dives* list shows each infra and correctness deep dive's card ("open on desktop for the interactive walkthrough").
- **Validation:** `tools/browser_check.py` covers 25 timelines, the lesson flows from the sidebar, old `?deep=` links and the phone list; the lesson-dialog checks were retired.
- **Inside views everywhere:** every architecture stop in all 25 flows now opens a step-through inside view instead of a static close-up. New generated diagrams for Action Execution (two lanes, Temporal, ServiceNow, DLQ) and Datadog (tiles, monitors, automation) make that possible; any Datadog tile opens the panel's inside view. The six lesson flows (20–25) carry over each lesson's problem, decision, rejected alternative, trade-off and closing line. `pres/deep-dives.js` was removed.
- **Fixes:** inside-view cards are taller so the control bar no longer covers the diagram's bottom row; the Control Plane close-up's override example now reads "SILENT 15 · DEAD 30" (it said "DEAD after 10 min"); the flow 21 hook no longer invents a device count.
- **Git:** work goes straight to `main` (the `presenter-mode` branch was merged and deleted); GitHub Pages builds the live site from `main`.

## 16 November 2026 — Multi-region: residency and disaster recovery (Claude)

- **Framing:** a design extension of the existing global + isolated China deployment; extra regions are examples ("e.g."), and My role is unchanged. No RPO/RTO numbers: they are named as targets to define and rehearse.
- **Main diagram:** a small clickable "Regions · design extension" box (top right) with its own generated close-up (residency zones with home and paired-standby cells, a global control plane holding routing metadata only, China isolated) and inside views.
- **Flow 26 · Data residency** (Correctness & trade-offs): a home region per tenant, registry + DNS routing, in-region processing, tickets, stores and dashboards, aggregates-only cross-region views, China isolated; rejected one global cluster with per-row region tags.
- **Flow 27 · Region outage → failover** (When things break): spools buffer, one region page and devices held UNKNOWN instead of DEAD, in-zone failover with replicated Kafka (offsets translated), Flink checkpoints and Temporal history, same incident IDs so no duplicate tickets, Redis rebuilt from the log, rehearsed RPO/RTO and a planned fail-back; rejected active-active per device.
- **Fixes:** in flows without a zoom, the recap badge no longer replaces the last stops' own badges before the story ends; the Control Plane close-up's tenant override example reads "e.g. 15 / 30 min".
