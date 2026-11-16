"""Generate pres/hld.html: the global HLD (all regional deployments) and one regional HLD per deployment.

Global view: AWS (US East ↔ US West, EU Frankfurt ↔ EU Ireland) and an independent China deployment on Alibaba Cloud,
each connected to its sites, with the global control plane coordinating the AWS regions.
Clicking a deployment opens its regional HLD; its big "Show detail" button opens the LLD (the architecture diagram).
Run: python3 tools/hld.py   (tools/build.sh runs it)
"""
import html, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = 'Inter,Segoe UI,Arial,sans-serif'
e = lambda t: html.escape(t, quote=False)
P = {'b': ('#1D4ED8', '#F4F8FF', '#93B4F5'), 'v': ('#5B3FD9', '#F6F3FF', '#C4B5FD'), 'g': ('#15803D', '#ECFDF3', '#86EFAC'),
     'o': ('#B45309', '#FFF7ED', '#FDBA74'), 'r': ('#DC2626', '#FEF2F2', '#FCA5A5'), 't': ('#0F766E', '#F0FDFA', '#99F6E4'),
     'n': ('#33465C', '#F6F8FB', '#B9C6D8'), 'aws': ('#B45309', '#FFFBF5', '#F7B267'), 'ali': ('#C2410C', '#FFF7F2', '#FB923C')}
DEFS = ('<defs>' + ''.join(f'<marker id="m{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="{c}" stroke-width="1.8"/></marker>'
        for k, c in [('a', '#7A8BA0'), ('b', '#1D4ED8'), ('v', '#7C5CFA'), ('t', '#0F766E'), ('g', '#16A34A')]) + '</defs>')
def svg(w, h, body): return f'<svg viewBox="0 0 {w} {h}" width="100%" font-family="{F}" role="img">{DEFS}{body}</svg>'
def lab(x, y, t, c='#33465C', fs=14, wgt=600, anchor='start'): return f'<text x="{x}" y="{y}" font-size="{fs}" font-weight="{wgt}" fill="{c}" text-anchor="{anchor}">{e(t)}</text>'
def hd(x, y, t, c): return f'<text x="{x}" y="{y}" font-size="13" font-weight="800" letter-spacing="2" fill="{c}">{e(t)}</text>'
def frame(x, y, w, h, c, dash=''): fg, bg, bd = P[c]; return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="{bg}" stroke="{bd}" stroke-width="1.8" {"stroke-dasharray=%s" % chr(34) + dash + chr(34) if dash else ""}/>'
def box(x, y, w, h, c, title, lines=(), fs=13.5, tfs=15.5):
    fg, bg, bd = P[c]; o = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{bg}" stroke="{bd}" stroke-width="1.6"/>' + lab(x + 14, y + 25, title, fg, tfs, 800)
    for i, l in enumerate(lines): o += lab(x + 14, y + 47 + i * (fs + 6), l, '#24364E', fs, 400)
    return o
def arr(d, c='a', dash=''): col = {'a': '#7A8BA0', 'b': '#1D4ED8', 'v': '#7C5CFA', 't': '#0F766E', 'g': '#16A34A'}[c]; return f'<path d="{d}" fill="none" stroke="{col}" stroke-width="2.2" {"stroke-dasharray=%s" % chr(34) + dash + chr(34) if dash else ""} marker-end="url(#m{c})"/>'
def pill(x, y, t, c): fg, bg, bd = P[c]; w = len(t) * 7.6 + 22; return f'<rect x="{x}" y="{y}" width="{w}" height="24" rx="12" fill="#fff" stroke="{bd}"/>' + lab(x + 11, y + 16.5, t, fg, 11.5, 800)

# ---------------- deployments ----------------
DEPLOY = {
  'use1': dict(name='US East', code='us-east-1', zone='US', law='CCPA', role='home', cloud='aws', pair='usw2'),
  'usw2': dict(name='US West', code='us-west-2', zone='US', law='CCPA', role='standby', cloud='aws', pair='use1'),
  'euc1': dict(name='EU Frankfurt', code='eu-central-1', zone='EU', law='GDPR', role='home', cloud='aws', pair='euw1'),
  'euw1': dict(name='EU Ireland', code='eu-west-1', zone='EU', law='GDPR', role='standby', cloud='aws', pair='euc1'),
  'cnsh': dict(name='China Shanghai', code='cn-shanghai', zone='China', law='PIPL', role='home', cloud='ali', pair='cnbj'),
  'cnbj': dict(name='China Beijing', code='cn-beijing', zone='China', law='PIPL', role='standby', cloud='ali', pair='cnsh'),
}
def card(k, x, y, w=300, h=166):
    d = DEPLOY[k]; home = d['role'] == 'home'; c = 'b' if home else 'n'; fg, bg, bd = P[c]
    k8s = 'ACK · 3 zones' if d['cloud'] == 'ali' else 'EKS · 3 AZs'
    o = f'<g class="dep" data-dep="{k}" tabindex="0" role="button" aria-label="{e(d["name"])}: open the regional design">'
    o += f'<rect class="hit" x="{x}" y="{y}" width="{w}" height="{h}" rx="14" fill="#fff" stroke="{bd}" stroke-width="{2.4 if home else 1.6}"/>'
    o += lab(x + 16, y + 28, d['name'], '#0B1F3F', 17, 800) + lab(x + 16, y + 48, d['code'] + ' · ' + k8s, '#56667C', 12.5, 600)
    o += pill(x + w - (108 if home else 124), y + 12, 'HOME' if home else 'STANDBY', 'b' if home else 'n')
    cw = (w - 38) / 2
    for i, t in enumerate(['Gateway', 'Kafka + Flink', 'Stores', 'Dashboards']):
        cx = x + 16 + (i % 2) * (cw + 6); cy = y + 62 + (i // 2) * 34
        o += f'<rect x="{cx}" y="{cy}" width="{cw}" height="28" rx="8" fill="{bg}" stroke="{bd}"/>' + lab(cx + cw / 2, cy + 19, t, fg, 12, 700, 'middle')
    o += lab(x + 16, y + 150, ('serves its tenants\' sites' if home else 'warm standby · replicated'), '#33465C', 12.5, 500)
    o += lab(x + w - 16, y + 150, 'open →', '#2563EB', 12.5, 800, 'end') + '</g>'
    return o
def sites(x, y, n, label, c='t'):
    fg, bg, bd = P[c]; o = ''
    for i in range(n): o += f'<rect x="{x + i * 64}" y="{y}" width="54" height="44" rx="10" fill="{bg}" stroke="{bd}"/><text x="{x + i * 64 + 27}" y="{y + 29}" font-size="18" text-anchor="middle">🏬</text>'
    return o + lab(x, y + 64, label, fg, 12.5, 700)

# ---------------- global HLD ----------------
b = []
b.append(lab(40, 50, 'Global deployment', '#0B1F3F', 30, 800) + lab(40, 78, 'Every region is a full, independent copy of the platform · each tenant\'s data stays in its home region', '#4A5B70', 15, 500))
# AWS frame
b.append(frame(30, 100, 1110, 772, 'aws') + hd(52, 128, 'AMAZON WEB SERVICES', P['aws'][0]))
# global control plane
b.append(f'<g class="dep" data-dep="cp" tabindex="0" role="button" aria-label="Global control plane">' + box(250, 142, 670, 74, 'v', 'Global control plane · primary in US East, read replicas in every AWS region', ['tenant → home region · tenants, sites, RBAC · rules · firmware catalog'], fs=13.5) + '</g>')
# US zone
b.append(frame(52, 250, 520, 410, 'b', '7 5') + hd(72, 276, 'US ZONE', P['b'][0]) + pill(470, 262, 'CCPA', 'b'))
b.append(card('use1', 72, 296, 230) + card('usw2', 322, 296, 230))
b.append(arr('M302 379 H318', 'g', '5 4') + lab(330, 484, 'DR: replicated East → West,', '#15803D', 12.5, 700) + lab(330, 502, 'inside the US', '#15803D', 12.5, 700))
b.append(sites(84, 560, 6, 'US sites · mTLS to US East · fail over to US West'))
b.append(arr('M150 560 V466', 'b'))
# EU zone
b.append(frame(598, 250, 520, 410, 'b', '7 5') + hd(618, 276, 'EU ZONE', P['b'][0]) + pill(1016, 262, 'GDPR', 'b'))
b.append(card('euc1', 618, 296, 230) + card('euw1', 868, 296, 230))
b.append(arr('M848 379 H864', 'g', '5 4') + lab(876, 484, 'DR: Frankfurt → Ireland,', '#15803D', 12.5, 700) + lab(876, 502, 'never outside the EU', '#15803D', 12.5, 700))
b.append(sites(630, 560, 6, 'EU sites · mTLS to Frankfurt · fail over to Ireland'))
b.append(arr('M696 560 V466', 'b'))
# coordination: config out, aggregates in
for x in (187, 437, 733, 983):
    b.append(arr(f'M{x} 216 V292', 'v', '6 5'))
for x in (215, 761):
    b.append(arr(f'M{x} 292 V220', 't', '3 4'))
b.append(lab(60, 700, 'What crosses regions', '#0B1F3F', 15, 800))
for i, (c, dash, t) in enumerate([('v', '6 5', 'Config out: routing, tenants, rules, firmware catalog (global → regions)'),
                                   ('t', '3 4', 'Aggregates in: device counts, health, SLOs, no raw data (regions → global)'),
                                   ('g', '5 4', 'DR replication: only to the standby in the same zone'),
                                   ('b', '', 'Site traffic: each site talks only to its home region')]):
    y = 724 + i * 28; b.append(arr(f'M60 {y} H110', c, dash) + lab(124, y + 5, t, '#24364E', 13.5, 500))
b.append(box(700, 690, 418, 140, 'r', 'Never crosses a border', ['telemetry · device state · incidents', 'tickets · dashboards · personal data', 'Topics are labelled local / aggregate / config;', 'replication only copies the allowed labels.'], fs=13))
# Alibaba / China
b.append(frame(1170, 100, 400, 772, 'ali') + hd(1192, 128, 'ALIBABA CLOUD', P['ali'][0]))
b.append(frame(1190, 250, 360, 500, 'r', '7 5') + hd(1210, 276, 'CHINA · INDEPENDENT', P['r'][0]) + pill(1478, 262, 'PIPL', 'r'))
b.append(box(1210, 142, 320, 74, 'v', 'Own control plane copy', ['separate accounts, nothing replicates out'], fs=13))
b.append(card('cnsh', 1210, 296, 320) + card('cnbj', 1210, 486, 320))
b.append(arr('M1290 216 V292', 'v', '6 5'))
b.append(arr('M1370 462 V482', 'g', '5 4'))
b.append(sites(1210, 668, 5, '', 't') + lab(1210, 734, 'China sites → Shanghai · fail over to Beijing', P['t'][0], 12.5, 700))
b.append(arr('M1210 690 H1198 V380 H1206', 'b'))
b.append(box(1190, 762, 360, 98, 'n', 'Same code, different cloud', ['ACK (Kubernetes) · OSS storage · SLB', 'Kafka + Flink run on ACK, same Helm charts', 'Deployed from the same Git repo, run apart'], fs=13))
b.append('<path d="M1155 110 V862" stroke="#DC2626" stroke-width="3" stroke-dasharray="10 8"/>' + lab(1155, 886, 'no link', '#DC2626', 12, 800, 'middle'))
GLOBAL = svg(1600, 890, ''.join(b))

# ---------------- regional HLD ----------------
def regional(k):
    d = DEPLOY[k]; ali = d['cloud'] == 'ali'; home = d['role'] == 'home'; pair = DEPLOY[d['pair']]
    K = 'ACK cluster · 3 zones' if ali else 'EKS cluster · 3 availability zones'
    obj = 'OSS' if ali else 'S3'; lb = 'SLB' if ali else 'NLB'
    b = [lab(40, 50, f'{d["name"]} · {d["code"]}', '#0B1F3F', 30, 800),
         lab(40, 78, f'{"Home region" if home else "Standby region"} in the {d["zone"]} zone · {d["law"]} · {"Alibaba Cloud" if ali else "AWS"}', '#4A5B70', 15, 500)]
    b.append(frame(30, 100, 1540, 600, 'ali' if ali else 'aws') + hd(52, 128, ('ALIBABA CLOUD · ' if ali else 'AWS · ') + d['code'].upper(), P['ali' if ali else 'aws'][0]))
    # sites
    b.append(box(52, 160, 190, 300, 't', 'Sites', ['devices → Filtering', '→ edge pair', '(active / standby)', '', 'buffers to disk', 'if the region', 'is unreachable'], fs=13))
    b.append(arr('M242 310 H282', 'b') + lab(246, 300, 'mTLS', '#1D4ED8', 12, 800))
    # cluster
    b.append(frame(288, 146, 1060, 420, 'b', '6 5') + hd(308, 172, K.upper(), P['b'][0]))
    row = [('Cloud Gateway', ['mTLS · tenant', 'quotas', f'{lb} over 3 zones']), ('Ingestion', ['validate · tag', 'publish', 'autoscaled pods']),
           ('Kafka', ['heartbeats +', 'telemetry topics', '3 brokers, 3 zones']), ('Flink', ['per-device timers', 'rules · rollups', 'checkpoints → ' + obj])]
    for i, (t, ls) in enumerate(row):
        x = 308 + i * 205; b.append(box(x, 190, 185, 130, 'b' if home else 'n', t, ls, fs=13))
        if i < 3: b.append(arr(f'M{x + 185} 255 H{x + 201}'))
    b.append(box(308, 346, 245, 110, 'r' if home else 'n', 'Action Execution', ['pages · digests', 'Temporal → tickets'], fs=13))
    b.append(box(573, 346, 245, 110, 'o' if home else 'n', 'Stores', ['Redis · ClickHouse', f'MongoDB · {obj} archive'], fs=13))
    b.append(box(838, 346, 245, 110, 'g' if home else 'n', 'Dashboards', ['live (SSE) + history', 'RBAC on every call'], fs=13))
    b.append(arr('M1006 320 V336 H430 V342') + arr('M1006 336 H695 V342') + arr('M1006 336 H960 V342'))
    b.append(box(1128, 190, 200, 130, 'v', 'Control plane', ['global replica:' if not ali else 'China\'s own copy:', 'tenants, rules,', 'firmware catalog'], fs=13))
    b.append(box(1128, 346, 200, 110, 'n', 'Monitoring' if ali else 'Datadog', ['lag · freshness', 'checkpoints · traces'] if not ali else ['same signals,', 'stack runs in China'], fs=13))
    b.append(lab(308, 490, 'Platform: Kubernetes with operators (Strimzi, Flink Operator) · HPA + KEDA scale pods · node autoscaling · Argo CD from Git', '#33465C', 13.5, 600))
    b.append(lab(308, 514, 'Every tier spread over 3 zones and sized N+1: losing a zone loses no data', '#33465C', 13.5, 500))
    # outside: integrations, users, coordination, DR
    b.append(box(1372, 160, 180, 130, 'r', 'Integrations', (['paging + ITSM', '(China providers)'] if ali else ['PagerDuty', 'ServiceNow']) + ['← Action Execution'], fs=13))
    b.append(box(1372, 310, 180, 130, 'g', 'Users', ['tenant admins', 'platform admins', '→ Dashboards'], fs=13))
    if ali:
        b.append(box(52, 600, 700, 84, 'r', 'Independent', ['No coordination with the AWS regions. Same code and Helm charts,', 'deployed separately; data never leaves China.'], fs=13))
    else:
        b.append(box(52, 600, 700, 84, 'v', 'Coordination with the global control plane', ['config in: routing, tenants, rules · aggregates out: counts, health, SLOs', 'no telemetry, state, incidents or personal data leave the region'], fs=13))
    b.append(box(772, 600, 776, 84, 'g', ('DR → ' + pair['name']) if home else ('DR ← ' + pair['name']),
                 (['Kafka topics (MirrorMaker 2), Flink checkpoints and Temporal history', 'replicated to the standby in the same zone'] if home else
                  ['Warm: receives replication from ' + pair['name'] + '; on failover, DNS moves', 'the sites here and the cluster scales up']), fs=13))
    return svg(1600, 710, ''.join(b))

REGIONAL = {k: regional(k) for k in DEPLOY}

page = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Global deployment · IoT monitoring</title>
<style>
html,body{margin:0;height:100%;background:#EEF3F9;font-family:Inter,"Segoe UI",Helvetica,Arial,sans-serif;color:#0B1F3F;overflow:hidden}
#wrap{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:18px 24px 96px;box-sizing:border-box}
#view{width:100%;max-height:100%;aspect-ratio:1600/890}
#view svg{display:block;width:100%;height:100%}
.dep{cursor:zoom-in;outline:none}
.dep:hover .hit,.dep:focus-visible .hit{stroke:#2563EB;stroke-width:3;filter:drop-shadow(0 6px 16px rgba(37,99,235,.25))}
.dep:focus-visible rect:first-child{stroke:#2563EB;stroke-width:3}
#bar{position:absolute;left:0;right:0;bottom:22px;display:flex;justify-content:center;gap:14px;pointer-events:none}
#bar button{pointer-events:auto;font:700 18px Inter,"Segoe UI",Arial;border-radius:999px;padding:13px 24px;cursor:pointer;border:0}
#back{background:#fff;color:#0B1F3F;box-shadow:0 0 0 1.5px #0B1F3F inset}
#detail{background:#2563EB;color:#fff;font-size:22px!important;padding:18px 40px!important;box-shadow:0 12px 30px rgba(37,99,235,.35)}
#detail:hover{background:#1D4ED8}
#hint{position:absolute;left:0;right:0;bottom:30px;text-align:center;font-size:15px;color:#56667C}
button:focus-visible{outline:3px solid #0071E3;outline-offset:3px}
[hidden]{display:none!important}
</style></head><body>
<div id="wrap"><div id="view"></div></div>
<div id="hint">Click a deployment to open its design</div>
<div id="bar"><button id="back" type="button" hidden>← Global view</button><button id="detail" type="button" hidden>🔍 Show detail · full architecture</button></div>
<script>
const GLOBAL = __GLOBAL__, REGIONAL = __REGIONAL__;
const view = document.getElementById('view'), back = document.getElementById('back'), detail = document.getElementById('detail'), hint = document.getElementById('hint');
const EMBED = new URLSearchParams(location.search).has('embed');
function show(k) {
  const g = !k || !REGIONAL[k]; view.innerHTML = g ? GLOBAL : REGIONAL[k]; view.style.aspectRatio = g ? '1600/890' : '1600/710';
  back.hidden = detail.hidden = g; hint.hidden = !g; view.dataset.dep = g ? '' : k;
  view.querySelectorAll('.dep').forEach(el => { const go = () => show(el.dataset.dep === 'cp' ? 'use1' : el.dataset.dep);
    el.addEventListener('click', go); el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } }); });
  if (!g) setTimeout(() => detail.focus({ preventScroll: true }), 30);
  try { parent.postMessage({ type: 'hld', dep: g ? null : k }, location.origin === 'null' ? '*' : location.origin); } catch (_) {}
}
back.onclick = () => show(null);
detail.onclick = () => { if (EMBED) parent.postMessage({ type: 'detail', dep: view.dataset.dep }, location.origin === 'null' ? '*' : location.origin); else location.href = 'flow4.html?idle=1'; };
addEventListener('keydown', e => { if (e.key === 'Escape' && view.dataset.dep) show(null); });
show(new URLSearchParams(location.search).get('dep'));
</script></body></html>'''
page = page.replace('__GLOBAL__', json.dumps(GLOBAL, ensure_ascii=False)).replace('__REGIONAL__', json.dumps(REGIONAL, ensure_ascii=False))
open(f'{ROOT}/pres/hld.html', 'w').write(page)
print('hld built')
