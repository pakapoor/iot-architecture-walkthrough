#!/usr/bin/env bash
# Build the flow pages for the walkthrough.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/vid" && python3 build.py
for v in $(seq 1 31); do
  sed -e 's|../sdi_logo_v2_crop.png|sdi_logo.png|g' \
      -e 's|<script src="timeline2.js"></script>|<script src="icons.js"></script><script src="notes.js"></script><script src="notes-alerts.js"></script><script src="notes-device.js"></script><script src="notes-infra.js"></script><script src="notes-deploy.js"></script><script src="notes-lessons-a.js"></script><script src="notes-lessons-b.js"></script><script src="notes-regions.js"></script><script src="notes-k8s-a.js"></script><script src="notes-k8s-b.js"></script><script src="timeline2p.js"></script>|' \
      "v$v.html" > "$ROOT/pres/flow$v.html"
done
echo "pres/ updated: open pres/index.html"
