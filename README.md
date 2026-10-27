# IoT Architecture Walkthrough

An interactive, click-to-advance walkthrough of a commercial IoT monitoring platform: **100M+ devices, 200K msgs/sec at peak, 99.9% uptime**. By System-Design.in.

### ▶ [Open the interactive walkthrough](https://pakapoor.github.io/iot-architecture-walkthrough/)

![Commercial IoT Monitoring System architecture](docs/architecture.svg)

## How to use it
Pick a flow or an infra issue in the side panel, then press play, or step through with the arrow keys. Click any component for a graphical close-up. In Tiered Storage, click a store to drill down to its tables and indexes. Two toggles add extra layers:
- **Observability** overlays the Datadog view.
- **Design decisions** adds the trade-offs behind each step.

## Flows
| Group | Flow | What it shows |
|---|---|---|
| Device data | Heartbeat | heartbeat → priority topic → Flink per-device timer → Redis → live status |
| | Telemetry | sensor → Kafka → Flink → live push over SSE + ClickHouse history |
| Alerts | Critical · field fix | DEAD → PagerDuty + Temporal → ServiceNow → escalate → field fix |
| | Critical · auto-resolve | device recovers → signal → ticket closes itself |
| | Critical · ServiceNow down | bounded retries → parked workflow → human replay → one ticket |
| | Minor · digest | SLOW → minor lane → 15-min digest per site |
| Multi-tenancy | Noisy neighbour | tenant throttled at its own quota, others untouched; RBAC by role |
| Deployment & upgrades | Device firmware | canary 1% → health gates → waves → auto-halt + A/B rollback |
| | Gateway + Ingestion | stateless services, canary by traffic |
| | Flink jobs | stateful jobs upgraded via savepoints |
| | Temporal + Action services | new workflow versions never break running workflows |
| | Dashboard service + UI | feature flags, CDN and graceful SSE reconnects |
| | Data stores | zero-downtime schema change: expand → migrate → contract |
| | Kafka + platform | infrastructure as code, rolled one broker at a time |

| Infra issue | What it shows |
|---|---|
| Queue depth rising | burst → Datadog alert → automatic fix → DevOps runbook if it persists |
| Alert storm | one root cause, one page: correlate · suppress · auto-resolve |
| Flink job crash | checkpoint restore → Kafka replay → idempotent actions |
| Hot partition | contained at the door: per-device limits · lag by partition |

## Videos
Walkthrough videos of the first eight flows (720p), in [`videos/`](videos):

| | |
|---|---|
| [Critical alert · field fix](https://pakapoor.github.io/iot-architecture-walkthrough/videos/IoT_1_Red_Alert_Field_Fix.mp4) | [Critical alert · auto-resolve](https://pakapoor.github.io/iot-architecture-walkthrough/videos/IoT_2_Red_Alert_Auto_Resolve.mp4) |
| [Minor alert · digest](https://pakapoor.github.io/iot-architecture-walkthrough/videos/IoT_3_Yellow_Alert_Dashboard.mp4) | [Live telemetry dashboard](https://pakapoor.github.io/iot-architecture-walkthrough/videos/IoT_4_Live_Telemetry_Dashboard.mp4) |
| [ServiceNow down · parked + replay](https://pakapoor.github.io/iot-architecture-walkthrough/videos/IoT_5_ServiceNow_Down_Parked_Replay.mp4) | [Queue depth rising](https://pakapoor.github.io/iot-architecture-walkthrough/videos/IoT_6_Backlog_Lag_Rising.mp4) |
| [Health check](https://pakapoor.github.io/iot-architecture-walkthrough/videos/IoT_7_Health_Check.mp4) | [Multi-tenancy](https://pakapoor.github.io/iot-architecture-walkthrough/videos/IoT_8_Multi_Tenancy.mp4) |

## Repository layout
```
index.html                entry point for GitHub Pages (opens pres/)
pres/index.html           the one-page shell: side panel, toggles, design decisions, phone layout
pres/timeline2p.js        presenter engine: stops, camera, controls, close-ups, reflow
pres/icons.js             SVG line icons (replace emoji at runtime)
pres/flow*.html           one page per flow (generated)
iot.html, svcnow.html     the architecture diagram and ServiceNow/Temporal scene (source of truth)
vid/build.py              assembles each flow page; vid/cicd_data.py holds the CI/CD scenes
vid/render.py             renders a flow to MP4:  python3 vid/render.py <1-8> li
tools/build.sh            regenerates pres/flow*.html
tools/svgs.py             generator for the graphical close-ups (embedded in timeline2p.js)
docs/architecture.svg     vector diagram for this README
videos/                   rendered walkthrough videos
```

## Build
```bash
./tools/build.sh                     # regenerate the flow pages
pip install playwright && python3 -m playwright install chromium   # only for videos / PNG
```
It's plain static files, so it runs on GitHub Pages, Netlify or any web server, or you can open `pres/index.html` locally.

## Notes
- Operational scenarios are the failure modes the system was **designed for**.
- Database schemas, keys, role permissions and CI/CD tooling in the close-ups are **examples**, labelled as such.
