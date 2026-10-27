# Presentation validation

Validated on 27 October 2026 against a local HTTP server mounted at the GitHub Pages project path, `/iot-architecture-walkthrough/`.

This is a static educational presentation. Recovery mechanisms introduced during review are explicitly examples; future AI scenarios are simulations and proposals. Browser checks do not verify the production IoT platform, service configurations, model calibration or advertised fleet throughput.

## Browser coverage

Run `python3 tools/browser_check.py` after `./tools/build.sh`. Results and inspection screenshots are written to `/tmp/iot-browser-checks/` by default.

- Every pause in all 23 architecture timelines renders without JavaScript exceptions.
- Flow and infrastructure section headers reveal direct item lists, preserving selection, shortcuts and direct links. No nested selection dropdown is required. Opening a section closes the other sidebar sections.
- Design-decision cards open with a real mouse click and Enter. Dialog focus, Tab/Shift+Tab containment, Escape and focus restoration are checked.
- The Cloud Gateway close-up exercises the previous icon/check-mark freeze case.
- Manual arrow stepping records completion without automatic navigation.
- Automatic playback reaches the final card, displays a real five-second countdown and advances for `cicd-svc`, `cicd-dash`, `telemetry`, `storm`, `red-snow`, `growth`, and the four future architecture scenarios. Timeline frame time is accelerated in this regression check; countdown time is not.
- Light and dark themes are checked at desktop, narrow desktop and phone sizes. Phone links highlight/scroll videos or show a desktop note, and widening initializes the selected interactive flow.
- All six deep dives and four future AI scenarios run through their UI steps. Future scenarios open the existing architecture with four proposed components, data/action connectors and main-stage playback; their detail dialogs retain problem/alternative/trade-off explanations. Future diagrams explicitly identify GenAI components. Playback ends, stops on close and returns focus to its triggering item.
- Sender checks reject unrelated shell messages; dynamic design-card text escapes executable HTML.
- Raw/warm storage schemas, Redis and the S3 detail SVGs were inspected for text beyond their view boxes. Architecture typography and refreshed images were visually inspected.

## Original review disposition

| Comment | Presentation change |
|---|---|
| 1 — SSE recovery | Shared replay and expired-cursor snapshot handoff are explained; live/history deep dive runs in the UI. |
| 2 — Redis replay counts | Version-checked atomic transitions replace unconditional increment examples; cluster-key scope is qualified. |
| 3 — Cache reconstruction | Versioned snapshot, subsequent transitions and cache-generation swap are described. |
| 4 — Last-seen freshness | Incident transitions and throttled freshness updates are distinguished. |
| 5 — Raw ClickHouse duplicates | Stable event IDs, replacing engine and deduplicated reads before merges are explained. |
| 6 — Warm rollup duplicates | Versioned replacement and FINAL/argMax query semantics are shown. |
| 7 — Archive versus TTL | Verified export precedes expiry; falling behind requires a retention/deletion gate. |
| 8 — Ordering versus lateness | Shared partitions are distinguished from event time, watermarks and late corrections. |
| 9 — Sequence reset | Boot/session, stream and sequence identity with bounded deduplication is explained. |
| 10 — Liveness clock/restart | Historical replay, overdue timers, pipeline freshness and a bounded recovery gate are covered. |
| 11 — Heartbeat priority | End-to-end liveness capacity isolation is distinguished from a separate topic alone. |
| 12 — Edge durability | Bounded spool, durable acknowledgement, standby recovery and overflow policy are explained. |
| 13 — Incident delivery | Durable/checkpoint-coordinated publication and publish-failure handling are illustrated. |
| 14 — Incident identity | Tenant/device outage generation replaces a time-bucket identity in the walkthrough. |
| 15 — Ticket uniqueness | External atomic uniqueness is the backstop; timed-out requests may still finish. |
| 16 — Parked workflow signals | Original paging deadline, acknowledgement and recovery remain active; the replay scenario reflects escalation. |
| 17 — Site correlation | A bounded durable correlation window handles asynchronous gateway/device candidates. |
| 18 — Live rules | Rule versions, effective time, existing deadlines and historical replay are covered. |
| 19 — Tenant identity | Tenant scope follows batched identity, keyed state, workflows, caches and replay. |
| 20 — Quotas | Distributed byte/reading budgets are distinguished from access isolation and shared-resource headroom. |
| 21 — Capacity units | Normal batched-envelope peak, per-reading work, designed-for burst and illustrative sustained growth are distinguished. |
| 22 — Firmware rollback | A local health watchdog and expected-device denominator are illustrated. |
| 23 — Flink rollback | Savepoint replay and external reconciliation replace the no-reprocessing claim. |
| 24 — Schema compatibility | Backward/forward definitions are corrected; FULL_TRANSITIVE is an example policy, with semantic checks separate. |
| 25 — Parallelism | Source readers, downstream keyed operators, hot keys and worker capacity are distinguished. |
| 26 — Completion timing | Completion is emitted after the final pause; only automatic completion starts Up next. |
| 27 — Messages/HTML | Sender/origin checks and constrained text rendering protect iframe messages. |
| 28 — Responsive stage | Breakpoint changes initialize the frame and stop hidden playback. |
| 29 — Mobile links | Video highlighting/scrolling, interactive-only notes and mobile topic playback are available. |
| 30 — Keyboard access | Diagram activation, modal focus containment and exact triggering-card restoration are checked. |
| 31 — Build permission | `tools/build.sh` remains executable and regenerates all 23 flows. |

## Assets and repeatability

`tools/render_assets.py` refreshes `pres/arch_snapshot.png`, `pres/actions_detail.png`, `docs/og.png`, the four `pres/future-*.png` architecture previews, and the vector `docs/architecture.svg` from HTML. Social services may cache older previews until their crawler refreshes them. The repository's earlier MP4 snapshots have not been re-rendered; current explanations and all new scenarios are available in the UI.

The build embeds close-ups from `tools/svgs.py` and derives the video timeline from the interactive source. A second build must produce no changes. HTML references, duplicate IDs, JavaScript/Python syntax and `git diff --check` are checked separately before syncing.
