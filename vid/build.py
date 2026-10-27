import os
import re, json, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = f'{ROOT}/'
iot = open(SRC + 'iot.html').read()
svc = open(SRC + 'svcnow.html').read()

# ---------- CSS ----------
css = svc.split('<style>')[1].split('</style>')[0]
css = css.replace('#c{width:1600px;height:960px;', '.cv{')
css = css.replace('.cards{top:742px;grid-template-columns:repeat(4,1fr)}', '#sceneB .cards{top:742px;grid-template-columns:repeat(4,1fr)}')
css = css.replace('.rhead{top:714px}', '#sceneB .rhead{top:714px}')
css = css.replace('#pk{', '.pk{')
css += '''
html,body{margin:0;background:#EEF3F9}
#stage{width:1920px;height:1080px;position:relative;overflow:hidden;background:#EEF3F9;font-family:Inter,"Segoe UI",Helvetica,Arial,sans-serif}
.layer{position:absolute;left:0;top:0;transform-origin:0 0}
.pk{display:none}
.sdot{position:absolute;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;z-index:2;display:none}
.badge{position:absolute;z-index:7;font-size:13px;font-weight:700;border-radius:7px;padding:4px 9px;display:none;white-space:nowrap}
#cap{position:absolute;left:50%;bottom:26px;transform:translateX(-50%);background:rgba(11,31,63,.94);color:#fff;border-radius:14px;padding:13px 26px;font-size:27px;font-weight:600;white-space:nowrap;z-index:50;box-shadow:0 10px 30px rgba(11,31,63,.3);display:none}
#cap .k{color:#FFD23F;margin-right:12px;font-weight:800}
#cap b{color:#9CC3FF}
.full{position:absolute;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:radial-gradient(1200px 700px at 50% 40%,#FFFFFF 0%,#E9F0F8 75%)}
.full .kk{font-size:20px;letter-spacing:5px;color:#E07A10;font-weight:800}
.full h1{font-size:76px;font-weight:800;color:#0B1F3F;margin:18px 0 10px;letter-spacing:-1px}
.full p{font-size:32px;color:#4A5B70;font-weight:500}
.full .lg{position:absolute;bottom:56px}
.full .band2{position:absolute;top:0;left:0;right:0;height:10px;background:linear-gradient(90deg,#FF9933 0 33.3%,#E8ECF2 33.3% 66.6%,#22A33A 66.6%)}
/* workflow scene */
.wf{position:absolute;left:100px;top:160px;width:1050px;height:800px;background:#fff;border:1.5px solid #7C5CFA;border-top:7px solid #7C5CFA;border-radius:18px;box-shadow:0 20px 60px rgba(15,30,51,.12);z-index:3}
.wh{position:absolute;left:30px;right:30px;top:28px;display:flex;align-items:center;gap:14px;font-size:26px;color:#0B1F3F}
.wh code{font-family:"JetBrains Mono",Consolas,monospace;font-size:16px;background:#0B1F3F;color:#FFD23F;border-radius:8px;padding:6px 12px}
.wstat{margin-left:auto;font-size:17px;font-weight:800;border-radius:999px;padding:7px 16px;background:#EDE7FF;color:#5B3FD9}
.wst{position:absolute;left:30px;right:30px;height:140px;border:2px solid #DFE6EF;background:#F7F9FC;border-radius:14px;display:flex;align-items:center;gap:20px;padding:0 24px}
.wst .n{width:46px;height:46px;border-radius:50%;background:#E4E9F1;color:#33465C;font-weight:800;font-size:20px;display:flex;align-items:center;justify-content:center;flex:none}
.wst .tt{font-size:25px;font-weight:800;color:#0B1F3F}
.wst .dd{font-size:17px;color:#4A5B70;margin-top:4px}
.wst .lv{font-size:16px;font-weight:700;margin-top:6px;min-height:20px;color:#C2620A}
.wst .tg{margin-left:auto;font-size:12.5px;font-weight:800;letter-spacing:1px;color:#5B3FD9;background:#F3EFFF;border:1px solid #D9CCFF;border-radius:8px;padding:5px 10px;white-space:nowrap;align-self:flex-start;margin-top:18px}
.wst .bd{min-width:0}
.wst.on{border-color:#7C5CFA;background:#F6F3FF;box-shadow:0 0 26px rgba(124,92,250,.35)}
.wst.on .n{background:#7C5CFA;color:#fff}
.wst.done .n{background:#16A34A;color:#fff}
.ast{position:absolute;left:24px;bottom:22px;font-size:20px;font-weight:800;border-radius:10px;padding:8px 16px;background:#EEF2F7;color:#33465C}
/* dashboard */
#sceneD .hd{position:absolute;left:120px;top:38px}
#sceneD .hd .k{font-size:16px;letter-spacing:4px;color:#E07A10;font-weight:700}
#sceneD .hd h1{font-size:44px;font-weight:800;color:#0B1F3F;margin-top:4px}
#sceneD .hd h1 span{color:#2563EB;font-weight:700}
.app{position:absolute;left:120px;top:150px;width:1680px;height:800px;background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(15,30,51,.14);border:1px solid #D3DDEA;overflow:hidden}
.topb{height:60px;border-bottom:1px solid #E3E9F1;display:flex;align-items:center;justify-content:space-between;padding:0 24px;font-size:17px;color:#4A5B70}
.topb b{color:#0B1F3F}
.live{display:inline-flex;align-items:center;gap:8px;background:#ECFDF3;color:#15803D;border:1px solid #A7E3BC;border-radius:999px;padding:5px 14px;font-weight:700;font-size:15px}
.live i{width:9px;height:9px;border-radius:50%;background:#16A34A;display:inline-block}
.side{position:absolute;left:0;top:60px;bottom:0;width:270px;background:#F6F8FB;border-right:1px solid #E3E9F1;padding:20px 16px}
.side .tn{font-weight:800;color:#0B1F3F;font-size:19px;margin-bottom:4px}
.side .sub{font-size:13px;color:#7A8BA0;margin-bottom:16px;letter-spacing:1px}
.site{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:9px;font-size:15px;color:#33465C;margin-bottom:4px}
.site.sel{background:#E5EDFF;color:#1D4ED8;font-weight:700}
.sd{width:10px;height:10px;border-radius:50%;display:inline-block}
.g{background:#16A34A}.y{background:#F5B70A}.r{background:#EF4444}
.main{position:absolute;left:270px;top:60px;width:900px;bottom:0;padding:22px 26px}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.tile{border:1px solid #E3E9F1;border-radius:12px;padding:12px 16px}
.tile .l{font-size:13px;color:#7A8BA0;font-weight:600;letter-spacing:.5px}
.tile .v{font-size:32px;font-weight:800;color:#0B1F3F;margin-top:2px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:20px}
.dev{border:1.5px solid #E3E9F1;border-radius:12px;padding:12px 14px;height:132px;position:relative;background:#fff}
.dev .nm{font-weight:800;color:#0B1F3F;font-size:16px;display:flex;justify-content:space-between;align-items:center}
.dev .ty{font-size:13px;color:#7A8BA0;margin-top:2px}
.dev .mt{font-size:14px;color:#33465C;margin-top:12px;font-weight:600}
.dev .st{position:absolute;left:14px;bottom:12px;font-size:12px;font-weight:800;letter-spacing:.5px;border-radius:6px;padding:3px 8px}
.st.g2{background:#ECFDF3;color:#15803D}.st.y2{background:#FFFBEB;color:#B7791F}.st.r2{background:#FEF2F2;color:#DC2626}
.dev.yel{border-color:#F5B70A;background:#FFFDF5}.dev.red{border-color:#EF4444;background:#FFF8F8}
.panel{position:absolute;left:1170px;top:60px;right:0;bottom:0;border-left:1px solid #E3E9F1;padding:22px 24px}
.panel h3{font-size:18px;color:#0B1F3F;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}
.al{border:1px solid #E3E9F1;border-radius:10px;padding:11px 14px;margin-bottom:10px;font-size:14.5px;color:#33465C;display:flex;gap:10px;align-items:flex-start}
.al b{color:#0B1F3F}
.al small{display:block;color:#7A8BA0;font-size:12.5px;margin-top:2px}
.toast{position:absolute;right:40px;bottom:36px;background:#0B1F3F;color:#fff;border-radius:12px;padding:14px 20px;font-size:17px;font-weight:600;box-shadow:0 12px 30px rgba(11,31,63,.3);opacity:0}
.toast small{display:block;font-weight:500;color:#B9C8DA;font-size:14px;margin-top:3px}
.ring{position:absolute;inset:-6px;border-radius:16px;border:3px solid #F5B70A;opacity:0}
#cursor{position:absolute;z-index:40;width:34px;height:34px;display:none}
#ripple{position:absolute;z-index:39;border-radius:50%;border:3px solid #2563EB;display:none}
.det .row{display:flex;gap:10px;margin-bottom:12px}
.det .kv{flex:1;border:1px solid #E3E9F1;border-radius:10px;padding:8px 12px;font-size:12.5px;color:#7A8BA0}
.det .kv b{display:block;color:#0B1F3F;font-size:16px;margin-top:2px}
.chart{border:1px solid #E3E9F1;border-radius:12px;padding:10px 14px;margin-bottom:12px}
.chart .ct{font-size:13.5px;color:#4A5B70;font-weight:700;display:flex;justify-content:space-between}
.chart .ct b{color:#0B1F3F;font-size:15px}

/* monitoring scene */
#sceneM .hd{position:absolute;left:100px;top:34px}
.mapp{position:absolute;left:100px;top:140px;width:1720px;height:880px;background:#fff;border-radius:18px;border:1px solid #D3DDEA;box-shadow:0 20px 60px rgba(15,30,51,.14);overflow:hidden}
.mtop{height:62px;border-bottom:1px solid #E3E9F1;display:flex;align-items:center;gap:18px;padding:0 26px;font-size:18px;color:#4A5B70}
.mtop b{color:#0B1F3F}
.mtop .rng{margin-left:auto;border:1px solid #D3DDEA;border-radius:8px;padding:5px 12px;font-size:15px}
.mmon{font-size:16px;font-weight:800;border-radius:999px;padding:7px 16px;background:#DCFCE7;color:#15803D}
.mp{position:absolute;width:818px;height:322px;border:1.5px solid #E3E9F1;border-radius:14px;background:#fff;padding:14px 18px}
.mp .mh{display:flex;justify-content:space-between;align-items:baseline;font-size:17px;font-weight:700;color:#33465C}
.mp .mh b{font-size:24px;color:#0B1F3F}
.mp .sub{font-size:13.5px;color:#7A8BA0;margin-top:2px}
.mp svg{position:absolute;left:18px;top:78px}
.mev{position:absolute;left:24px;right:24px;top:800px;display:flex;gap:12px;align-items:center;font-size:15px;color:#7A8BA0}
.mev .e{border:1.5px solid #E3E9F1;border-radius:10px;padding:7px 14px;font-weight:700;color:#33465C;background:#F7F9FC;opacity:.25}
.mev .e.on{opacity:1;border-color:#7C5CFA;background:#F6F3FF;color:#4C2FC9}
.mev .e.ok.on{border-color:#16A34A;background:#ECFDF3;color:#15803D}
.mev .e.bad.on{border-color:#EF4444;background:#FEF2F2;color:#DC2626}

/* observability panel (replaces design cards when shown) */
#a-obsp{position:absolute;left:60px;right:60px;top:712px;display:none;z-index:6}
#a-obsp .oh{font-size:14px;letter-spacing:3px;font-weight:800;color:#632CA6}
#a-obsp .tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-top:14px}
.otile{background:#fff;border:1px solid #D3DDEA;border-top:4px solid #632CA6;border-radius:12px;padding:12px 14px;box-shadow:0 6px 18px rgba(15,30,51,.06);cursor:zoom-in}
.otile .ot{font-size:15px;font-weight:800;color:#0B1F3F}
.otile .ov{font-size:22px;font-weight:800;color:#15803D;margin-top:6px}
.otile .on{font-size:12.5px;color:#7A8BA0;margin-top:4px;line-height:1.35}
.otile.bad{border-top-color:#EF4444;background:#FFF8F8}.otile.bad .ov{color:#DC2626}
#stage.obs #a-obsp{display:block}
#a-stor .tbl{gap:3px!important;margin-top:4px!important}
#a-stor .tbl div{padding:2px 10px!important;line-height:1.3!important;font-size:12.5px!important;min-height:0!important;height:auto!important}
#stage.nowhy .rhead,#stage.nowhy .cards{display:none}
#stage.obs:not(.nowhy) .rhead{top:866px}
#stage.obs:not(.nowhy) .cards{top:894px}
.card.ddc{cursor:pointer}.card.ddc:hover{box-shadow:0 0 0 3px rgba(37,99,235,.35),0 6px 18px rgba(15,30,51,.08)}
.card.ddc .p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.card.ddc .mo{font-size:11.5px;font-weight:700;color:#2563EB;margin-top:6px}
#stage.tall.obs:not(.nowhy) .rhead{display:block;top:884px}
#stage.tall.obs:not(.nowhy) .cards{display:grid;top:912px}
#stage.clean .foot{visibility:hidden}
#arch .logo{position:absolute;top:44px;right:60px;display:flex;align-items:center;z-index:4;mix-blend-mode:multiply}
#stage.nocap #cap{visibility:hidden}

/* CI/CD scene */
#sceneC .hd{position:absolute;left:100px;top:34px}
.crow{position:absolute;left:60px;font-size:15px;letter-spacing:3px;font-weight:800;color:#6E6E73}
.cb{position:absolute;height:190px;background:#fff;border:1.5px solid #DCE3EC;border-radius:16px;padding:16px 16px 0;box-shadow:0 6px 18px rgba(15,30,51,.06)}
.cb .ct{font-size:19px;font-weight:800;color:#0B1F3F;display:flex;gap:8px;align-items:center}
.cb .cd{font-size:14.5px;color:#4A5B70;margin-top:8px;line-height:1.4}
.cb .cs{position:absolute;left:16px;bottom:14px;font-size:13px;font-weight:800;border-radius:999px;padding:4px 12px;background:#F2F2F7;color:#6E6E73}
.cb.run{border-color:#0071E3;box-shadow:0 0 0 4px rgba(0,113,227,.12)}.cb.run .cs{background:#E5F1FF;color:#0071E3}
.cb.ok .cs{background:#E8F8EC;color:#1E8E3E}.cb.ok{border-color:#9AD9AB}
.cb.bad .cs{background:#FFECEB;color:#D70015}.cb.bad{border-color:#FF9F99}
.cfoot{position:absolute;height:150px;border-radius:16px;padding:16px 18px;font-size:15px;line-height:1.45}
'''

# ---------- arch markup ----------
arch = iot.split('<div id="c">')[1].split('<script>')[0].rstrip()
arch = arch[:arch.rfind('</div>')]
arch = arch.replace('<!-- moving packets -->\n<div id="dots"></div>', '')
for k, pos in {'edge': 'left:60px;top:190px', 'gw': 'left:350px;top:190px', 'ing': 'left:620px;top:190px',
               'kafka': 'left:890px;top:190px', 'flink': 'left:1160px;top:190px', 'ctrl': 'left:60px;top:448px',
               'dash': 'left:420px;top:448px', 'stor': 'left:770px;top:448px', 'act': 'left:1160px;top:448px'}.items():
    arch = re.sub(r'<div class="box([^"]*)" style="' + pos, f'<div id="a-{k}" class="box\\1" style="' + pos, arch, count=1)
    if f'id="a-{k}"' not in arch:
        arch = arch.replace('<div class="box" style="' + pos, f'<div id="a-{k}" class="box" style="' + pos, 1)
arch = arch.replace('<div class="obs">', '<div class="obs" id="a-obs">')
arch = arch.replace('<span class="chip">', '<span class="chip" id="a-chip">')
arch = arch.replace('<div class="lane r">', '<div class="lane r" id="a-laneR" style="animation:none">')
arch = arch.replace('<div class="lane y">', '<div class="lane y" id="a-laneY">')
arch = arch.replace('src="sdi_logo_v2_crop.png"', 'src="../sdi_logo_v2_crop.png"')
arch += '<div id="a-obsp"><div class="oh">OBSERVABILITY · DATADOG</div><div class="tiles"><div class="otile" id="a-ob0"><div class="ot">Consumer lag</div><div class="ov" id="a-ov0">● OK</div><div class="on">Kafka messages waiting for Flink</div></div><div class="otile" id="a-ob1"><div class="ot">Freshness p99</div><div class="ov" id="a-ov1">● OK</div><div class="on">event age when processed · alert > 2 min</div></div><div class="otile" id="a-ob2"><div class="ot">Flink checkpoints</div><div class="ov" id="a-ov2">● OK</div><div class="on">duration + failures · state health</div></div><div class="otile" id="a-ob3"><div class="ot">Throughput</div><div class="ov" id="a-ov3">● 200K/s</div><div class="on">msgs/sec in · per tenant</div></div><div class="otile" id="a-ob4"><div class="ot">Traces</div><div class="ov" id="a-ov4">● OK</div><div class="on">one trace ID: edge → ticket</div></div></div></div>'
arch += '<div id="a-badge" class="badge" style="left:72px;top:372px"></div><div id="a-pk" class="pk"></div><div id="a-streams"></div>'
for k in ['edge','gw','ing','kafka','flink','ctrl','dash','stor','act']:
    assert f'id="a-{k}"' in arch, k

# ---------- svc markup ----------
sv = svc.split('<div id="c">')[1].split('\n<div id="pk">')[0].rstrip()
sv = sv[:sv.rfind('</div>')]
sv = re.sub(r'<div class="stats">.*?</div></div>\n', '', sv, flags=re.S)
sv = sv.replace('src="sdi_logo_v2_crop.png"', 'src="../sdi_logo_v2_crop.png"')
sv += '<div id="b-pk" class="pk"></div><div id="b-badge" class="badge" style="left:1030px;top:150px;font-size:16px;padding:6px 14px"></div>'

def dash_markup(v):
    devs = [('CAM-11','Camera · Entrance','99.9% uptime'),('CAM-12','Camera · Billing','99.8% uptime'),('CAM-14','Camera · Aisle 4','99.7% uptime'),('GW-A','Edge gateway · active','1.2k msg/s'),
            ('SNS-01','Footfall sensor','lat 140 ms'),('SNS-02','Footfall sensor','lat 155 ms'),('SNS-03','Footfall sensor','lat 160 ms'),('GW-B','Edge gateway · standby','standby'),
            ('TH-05','Thermostat · Aisle 3','22.4 °C'),('TH-06','Thermostat · Cold room','4.1 °C'),('DSP-01','Display · Window','on'),('DSP-02','Display · Counter','on')]
    cards = ''
    for n, ty, mt in devs:
        cards += f'<div class="dev" id="d-{n}"><div class="ring"></div><div class="nm">{n}<span class="sd g"></span></div><div class="ty">{ty}</div><div class="mt">{mt}</div><div class="st g2">ONLINE</div></div>'
    sites = [('Site-07 · Noida', 'g', True), ('Site-12 · Gurugram', 'g', False), ('Site-03 · Pune', 'g', False), ('Site-21 · Bengaluru', 'g', False), ('Site-09 · Mumbai', 'g', False), ('Site-15 · Hyderabad', 'g', False)]
    side = ''.join(f'<div class="site{" sel" if s else ""}">{n}<span class="sd {c}" {"id=site7dot" if s else ""}></span></div>' for n, c, s in sites)
    return f'''
<div class="band"></div>
<img src="../sdi_logo_v2_crop.png" style="mix-blend-mode:multiply;position:absolute;right:120px;top:46px;height:54px"><div class="hd"><div class="k">ZOOM-IN · TENANT DASHBOARD</div><h1>Live device health <span>· tenant → site → device</span></h1></div>
<div class="app">
 <div class="topb"><div><b>Acme Retail</b> &nbsp;›&nbsp; Site-07 · Noida &nbsp;›&nbsp; Devices</div><div class="live" id="livepill"><i id="livedot"></i>LIVE · SSE</div></div>
 <div class="side"><div class="tn">Acme Retail</div><div class="sub">TENANT · 214 SITES</div>{side}</div>
 <div class="main">
  <div class="tiles"><div class="tile"><div class="l">DEVICES</div><div class="v">48</div></div><div class="tile"><div class="l">ONLINE</div><div class="v" id="t-on" style="color:#15803D">48</div></div>
  <div class="tile"><div class="l">DEGRADED</div><div class="v" id="t-deg" style="color:#B7791F">0</div></div><div class="tile"><div class="l">DOWN</div><div class="v" id="t-down" style="color:#DC2626">0</div></div></div>
  <div class="grid">{cards}</div>
 </div>
 <div class="panel" id="p-alerts"><h3>Site alerts <span style="font-size:13px;color:#7A8BA0;font-weight:600">last 24 h</span></h3><div id="alist"></div></div>
 <div class="panel det" id="p-det" style="opacity:0;background:#fff">
  <h3>TH-05 · Thermostat · Aisle 3 <span class="live" style="font-size:12px;padding:3px 10px"><i></i>LIVE</span></h3>
  <div class="row"><div class="kv">Status<b style="color:#15803D">● Online</b></div><div class="kv">Last heartbeat<b id="lhb">2 s ago</b></div><div class="kv">Firmware<b>4.2.1</b></div></div>
  <div class="chart"><div class="ct">Temperature (°C) <b id="v1">22.4</b></div><svg width="440" height="150" id="c1"></svg></div>
  <div class="chart"><div class="ct">Heartbeat latency (ms) <b id="v2">140</b></div><svg width="440" height="120" id="c2"></svg></div>
 </div>
 <div class="toast" id="toast">📧 Site-07 digest sent · Email + Slack<small>15-min window · quiet hours respected</small></div>
</div>
<svg id="cursor" viewBox="0 0 24 24"><path d="M3 2 L3 20 L8 15 L11.5 22 L14.5 20.6 L11 13.8 L18 13.8 Z" fill="#0B1F3F" stroke="#fff" stroke-width="1.4"/></svg>
<div id="ripple"></div>
<div id="d-pk" class="pk"></div>
'''

def wf_markup(v):
    if v == 5:
        steps = [('Upsert ticket', 'Create the ServiceNow incident — retries with exponential backoff', 'ACTIVITY · RETRY POLICY'),
                 ('Park the incident', 'Retries exhausted → status PARKED · ops alerted', 'DLQ · PARKED INCIDENTS'),
                 ('Wait for ops replay', 'Durable wait for a human "replay" signal — minutes or days', 'SIGNAL · HUMAN IN LOOP'),
                 ('Replay → continue', 'Upsert again (idempotent) → ack timer → escalate', 'ACTIVITY')]
        actors = [('act-sn', '🎫', 'ServiceNow', 'Incident tickets', 'no ticket', 200), ('act-oc', '🧑‍💻', 'Ops engineer', 'Parked list · Replay button', 'idle', 440), ('act-x', '📟', 'On-call (L2)', 'Paged via PagerDuty', 'idle', 680)]
        pairs = [(360, 305, 1205), (516, 545, 1230), (672, 545, 1255), (828, 305, 1270)]
        return wf_render(steps, actors, pairs)
    steps = [('Upsert ticket', 'Create the ServiceNow incident — idempotent by workflowId', 'ACTIVITY · RETRY + BACKOFF'),
             ('Wait for on-call ack', 'Durable 30-min timer, or an "ack" signal — whichever comes first', 'DURABLE TIMER'),
             ('Escalate', 'Page L2 on-call · raise ticket to P1', 'ACTIVITY'),
             (('Wait for field fix', 'Sleep until ServiceNow signals "ticket closed" — even for days', 'SIGNAL · DAYS-LONG WAIT') if v == 1 else
              ('Auto-resolve', '"Device recovered" signal → resolve ticket · stand down on-call', 'SIGNAL → ACTIVITY'))]
    third = ('act-x', '🔧', 'Field technician', 'Dispatched by ServiceNow', 'idle') if v == 1 else ('act-x', '📷', 'Device CAM-14', 'Recovery seen by Flink → signal', '🔴 offline')
    actors = [('act-sn', '🎫', 'ServiceNow', 'Incident tickets', 'no ticket', 200), ('act-oc', '📟', 'On-call (L2)', 'Pager rotation', 'idle', 440), third + (680,)]
    pairs = [(360, 305, 1205), (672, 545, 1230), (672, 305, 1255), (828, 305, 1270), (828, 785, 1215)]
    return wf_render(steps, actors, pairs)

def wf_render(steps, actors, pairs):
    rows = ''
    for i, (t, d, tag) in enumerate(steps):
        rows += f'<div class="wst" id="ws{i+1}" style="top:{130 + i*156}px"><div class="n">{i+1}</div><div class="bd"><div class="tt">{t}</div><div class="dd">{d}</div><div class="lv" id="wl{i+1}"></div></div><div class="tg">{tag}</div></div>'
    acts = ''
    for aid, ic, nm, sub, st, top in actors:
        acts += f'<div class="box wact" id="{aid}" style="left:1290px;top:{top}px;width:530px;height:210px"><div class="t" style="font-size:24px"><span class="ic" style="width:40px;height:40px;font-size:22px;background:#EEF2F7">{ic}</span>{nm}</div><div class="s" style="font-size:17px">{sub}</div><div class="ast" id="s-{aid}">{st}</div></div>'
    paths = ''.join(f'<path d="M1150 {a} H{x} V{b} H1290" />' for a, b, x in pairs)
    title = 'Inside the workflow <span>· durable, coordinating the outside world</span>'
    return f'''<div id="sceneW" class="layer" style="width:1920px;height:1080px;opacity:0;background:radial-gradient(1200px 700px at 40% 30%,#fff 0%,#EEF3F9 70%)">
<div class="band"></div>
<div class="hd" style="position:absolute;left:100px;top:34px"><div style="font-size:16px;letter-spacing:4px;color:#E07A10;font-weight:700">ZOOM-IN · TEMPORAL WORKFLOW ↔ OUTSIDE WORLD</div>
<h1 style="font-size:42px;font-weight:800;color:#0B1F3F;margin-top:4px">{title.replace('<span>', '<span style="color:#2563EB;font-weight:700">')}</h1></div>
<svg width="1920" height="1080" style="position:absolute;left:0;top:0;z-index:1"><g fill="none" stroke="#B9C6D8" stroke-width="2.4" stroke-dasharray="7 6">{paths}</g></svg>
<div class="wf"><div class="wh"><span style="font-size:26px">⏳</span><b>IncidentWorkflow</b><code>workflowId = "cam-14 : 03:10 window"</code><span class="wstat" id="wstat">● Running</span></div>{rows}</div>
{acts}
<img src="../sdi_logo_v2_crop.png" style="mix-blend-mode:multiply;position:absolute;right:100px;top:46px;height:54px">
<div id="w-pk" class="pk" style="width:18px;height:18px;margin:-9px 0 0 -9px"></div>
</div>'''

def mon_markup():
    def panel(pid, x, y, title, sub, vid, extra=''):
        return f'<div class="mp" id="{pid}" style="left:{x}px;top:{y}px"><div class="mh">{title}<b id="{vid}">–</b></div><div class="sub">{sub}{extra}</div><svg id="{pid}-c" width="782" height="226"></svg></div>'
    p = (panel('m-ingest', 24, 84, 'Ingest rate', 'msgs/sec into Kafka · normal peak ≈ 200K (batched)', 'm-v1') +
         panel('m-lag', 878, 84, 'Kafka consumer lag', 'messages waiting for Flink', 'm-v2') +
         panel('m-fresh', 24, 444, 'Freshness p99', 'age of an event when Flink processes it · alert > 2 min', 'm-v3',
               ' · <span style="color:#F08A1C;font-weight:700">telemetry</span> vs <span style="color:#16A34A;font-weight:700">heartbeats</span>') +
         panel('m-bp', 878, 444, 'Flink backpressure', 'share of time operators are blocked · worker count in label', 'm-v4'))
    ev = ''.join(f'<div class="e {c}" id="m-e{i}">{t}</div>' for i, (t, c) in enumerate([
        ('🔴 Monitor: freshness p99 > 2 min', 'bad'), ('🤖 Autoscaler: Flink 24 → 48 workers', ''), ('🤖 Writer: bigger chunks (1 s or 50K rows)', ''), ('✅ Monitor resolved', 'ok')]))
    return f'''<div id="sceneM" class="layer" style="width:1920px;height:1080px;opacity:0;background:radial-gradient(1200px 700px at 40% 30%,#fff 0%,#EEF3F9 70%)">
<div class="band"></div>
<div class="hd"><div style="font-size:16px;letter-spacing:4px;color:#E07A10;font-weight:700">ZOOM-IN · OBSERVABILITY (DATADOG)</div>
<h1 style="font-size:42px;font-weight:800;color:#0B1F3F;margin-top:4px">Ingest pipeline health <span style="color:#2563EB;font-weight:700">· one dashboard, four signals</span></h1></div>
<img src="../sdi_logo_v2_crop.png" style="mix-blend-mode:multiply;position:absolute;right:100px;top:46px;height:54px">
<div class="mapp"><div class="mtop">📊 <b>Ingest pipeline · prod</b> · global region<span class="rng">Past 2 hours</span><span class="mmon" id="m-mon">● Monitors OK</span></div>
{p}<div class="mev" id="m-events">Events:{ev}</div></div>
<div id="m-pk" class="pk"></div>
</div>'''

import json as _json, re as _re
from cicd_data import CICD
FOOTC = {'b': ('#F4F8FF', '#93B4F5', '#1D4ED8'), 'g': ('#ECFDF3', '#86EFAC', '#15803D'), 'v': ('#F6F3FF', '#C4B5FD', '#5B3FD9'),
         't': ('#F0FDFA', '#99F6E4', '#0F766E'), 'r': ('#FEF2F2', '#FCA5A5', '#DC2626'), 'n': ('#F6F8FB', '#B9C6D8', '#33465C')}
def cicd_markup(v):
    d = CICD[v]
    o='<div class="band"></div><div class="hd"><div style="font-size:16px;letter-spacing:4px;color:#E07A10;font-weight:700">ZOOM-IN · DEPLOYMENT &amp; UPGRADES</div><h1 style="font-size:42px;font-weight:800;color:#0B1F3F;margin-top:4px">' + d['title'].replace('<span>', '<span style="color:#2563EB;font-weight:700">') + '</h1></div>'
    o+='<img src="../sdi_logo_v2_crop.png" style="mix-blend-mode:multiply;position:absolute;right:100px;top:46px;height:54px">'
    o+='<div class="crow" style="top:150px">CONTINUOUS INTEGRATION · ON EVERY PULL REQUEST</div><div class="crow" style="top:460px">' + ('ROLLOUT' if v in (14, 15) else 'CONTINUOUS DELIVERY · GITOPS') + '</div>'
    svg='<svg width="1920" height="1080" style="position:absolute;left:0;top:0"><g fill="none" stroke="#B9C6D8" stroke-width="2.4" stroke-dasharray="7 6">'
    for row, (pre, top) in enumerate([('c', 186), ('d', 496)]):
        for i, (ic, t, de, cap, ok, w) in enumerate(d['r1'] if row == 0 else d['r2']):
            x = 60 + i * 302
            o += f'<div class="cb" id="{pre}{i+1}" style="left:{x}px;top:{top}px;width:262px"><div class="ct"><span>{ic}</span>{t}</div><div class="cd">{de}</div><div class="cs" id="{pre}{i+1}-s">waiting</div></div>'
            if i < 5: svg += f'<path d="M{x+262} {top+95} H{x+302}"/>'
    svg += '<path d="M1701 376 V436 H191 V496"/></g></svg>'
    o += svg
    for k, (t, txt, c) in enumerate(d['foot']):
        bg, bd, fg = FOOTC[c]; x = 60 if k == 0 else 960; w = 860 if k == 0 else 902
        o += f'<div class="cfoot" id="f{k+1}" style="left:{x}px;top:740px;width:{w}px;background:{bg};border:1.5px solid {bd}"><b style="color:{fg};letter-spacing:2px;font-size:14px">{t}</b><br>{txt}</div>'
    o += '<div id="c-pk" class="pk"></div>'
    data = {k: d[k] for k in ('start', 'box', 'change', 'recap')}
    data['r1'] = [[x[3], x[4], x[5]] for x in d['r1']]; data['r2'] = [[x[3], x[4], x[5]] for x in d['r2']]
    data['foot'] = [_re.sub('<[^>]+>', '', f[1]) for f in d['foot']]
    return f'<div id="sceneC" class="layer" style="width:1920px;height:1080px;opacity:0;background:radial-gradient(1200px 700px at 40% 30%,#fff 0%,#EEF3F9 70%)">{o}</div><script>window.CICD = {_json.dumps(data, ensure_ascii=False)};</script>'

HOOK = {16: ('200 devices down at once. ⚡', 'One power cut — how many pages?'), 17: ('The Flink job just crashed. 💥', 'Lost data? Duplicate tickets?'), 18: ('One device, one hot partition. 🔥', 'Why adding workers won\'t help.'), 12: ('Shipping a change safely. 🚀', 'From a Git commit to production.'), 13: ('Shipping a change safely. 🚀', 'From a Git commit to production.'), 14: ('Shipping a change safely. 🚀', 'From a Git commit to production.'), 15: ('Shipping a change safely. 🚀', 'From a Git commit to production.'), 11: ('Shipping a change safely. 🚀', 'From a Git commit to production.'), 10: ('A rule change, live in production. 🚀', 'From a Git commit to 100M devices — safely.'), 9: ('New firmware for 1M cameras. 🧪', 'Ship it to everyone at once? Never.'), 8: ('Two tenants. One platform. 🏢', 'One tenant floods the system. The other never notices.'), 7: ('Is every device alive? 💓', '100M+ devices check in every minute. Here\'s how the platform knows.'), 6: ('Lag is climbing. Alerts are late. 📈', 'A regional outage just ended — 2,000 sites flush at once.'), 5: ('ServiceNow is down. 🎫', 'A camera just died. Will the incident get lost?'), 1: ('A camera at a retail store just died. 📷', 'Nobody is watching it at 3 AM. Here\'s how the platform handles it.'),
        2: ('A camera went offline… and came back. 📷', 'Watch the ticket open, escalate and close itself.'),
        3: ('A sensor is getting slow. 🐢', 'Not an emergency — but someone should know.'),
        4: ('100M+ devices. One dashboard.', 'Follow a heartbeat from a sensor to your screen.')}
END = {16: ('One root cause, one page. ✅', 'Correlate · suppress · auto-resolve.'), 17: ('Nothing lost, nothing doubled. ✅', 'Checkpoint · replay · idempotent actions.'), 18: ('Contained at the door. ✅', 'Per-device limits · lag by partition.'), 12: ('Shipped. Gated. Reversible. ✅', 'Every step checked, every step undoable.'), 13: ('Shipped. Gated. Reversible. ✅', 'Every step checked, every step undoable.'), 14: ('Shipped. Gated. Reversible. ✅', 'Every step checked, every step undoable.'), 15: ('Shipped. Gated. Reversible. ✅', 'Every step checked, every step undoable.'), 11: ('Shipped. Gated. Reversible. ✅', 'Every step checked, every step undoable.'), 10: ('Shipped. Gated. Reversible. ✅', 'Git · CI checks · GitOps · canary · metric gate · rollback.'), 9: ('Bad wave caught. Fleet safe. ✅', 'Canary · health gates · waves · auto-halt · A/B rollback.'), 8: ('Noisy neighbour contained. ✅', 'Own quotas · tenant tags · own rules · scoped queries · RBAC.'), 7: ('Alive, and you can see it. 💓', 'Priority topic · timer reset · Redis counts · live push.'), 6: ('Burst absorbed. Nothing lost. ✅', 'Kafka buffers · heartbeats protected · scale · drain.'), 5: ('Nothing lost. No duplicate tickets. ✅', 'Bounded retries → parked → human replay → one ticket.'), 1: ('The fix took 2 days. The workflow just waited. ✅', 'Durable timers, retries & escalation — no cron jobs, no duplicate tickets.'),
       2: ('Opened. Escalated. Closed itself. ✅', 'One incident → one workflow → one ticket.'),
       3: ('Minor issues don\'t page anyone at 3 AM. 😴', 'Batched digests + live dashboard badges.'),
       4: ('From sensor to screen in near real time. ⚡', 'Kafka → Flink → live push (SSE).')}

def page(v):
    scene = ''
    if v in (1, 2, 5):
        s = sv
        if v in (1, 5):
            s = s.replace('Self-healing ServiceNow ticketing <span>· with Temporal</span>', 'Incident lifecycle <span>· ServiceNow + Temporal</span>')
            s = re.sub(r'<b>Auto-resolve</b> ✅<br>.*?</div>', '<b>Field fix</b> 🔧<br>Tech dispatched → device replaced → ticket closed.</div>', s, flags=re.S)
            s = s.replace('✅ Closes its own loop</div><div class="p">Device comes back → Flink signals the workflow → ticket auto-resolves, with an audit trail of every step.',
                          '💤 Waits days, not seconds</div><div class="p">A field fix can take 2 days. The workflow sleeps durably until ServiceNow says "closed".')
            s = s.replace('<path class="flow" d="M165 330 V545 H1030" stroke="#16A34A"', '<path class="flow" d="M165 330 V545 H1030" stroke="#16A34A" opacity=".15"')
            s = s.replace('<div class="lbl" style="left:560px;top:534px;', '<div class="lbl" style="opacity:.2;left:560px;top:534px;')
        if v == 5:
            s = s.replace('<b>Field fix</b> 🔧<br>Tech dispatched → device replaced → ticket closed.</div>', '<b>Park + replay</b> ⏸<br>Retries exhausted → parked → ops replays.</div>')
            s = s.replace('💤 Waits days, not seconds</div><div class="p">A field fix can take 2 days. The workflow sleeps durably until ServiceNow says "closed".',
                          '⏸ Never loses an incident</div><div class="p">ServiceNow down? Bounded retries, then park and wait for a human replay. No duplicates.')
        scene = f'<div id="sceneB" class="layer cv" style="width:1600px;height:960px;opacity:0">{s}</div>' + wf_markup(v)
    elif v == 6:
        scene = mon_markup()
    elif 10 <= v <= 15:
        scene = cicd_markup(v)
    else:
        scene = f'<div id="sceneD" class="layer" style="width:1920px;height:1080px;opacity:0;background:radial-gradient(1200px 700px at 60% 30%,#fff 0%,#EEF3F9 70%)">{dash_markup(v)}</div>'
    h, e = HOOK[v], END[v]
    STAGECLS = 'obs' if v in (6, 16, 17, 18) else ''
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>
<div id="stage" class="{STAGECLS}">
<div id="arch" class="layer cv" style="width:1600px;height:1000px">{arch}</div>
{scene}
<div id="veil" style="position:absolute;inset:0;z-index:59;background:radial-gradient(1100px 650px at 50% 45%,rgba(255,255,255,.88),rgba(238,243,249,.72))"></div>
<div id="hook" class="full" style="background:transparent"><img src="../sdi_logo_v2_crop.png" style="mix-blend-mode:multiply;height:96px;margin-bottom:34px"><div class="kk">COMMERCIAL IOT MONITORING SYSTEM · 100M+ DEVICES</div><h1>{h[0]}</h1><p>{h[1]}</p><div style="position:absolute;bottom:52px;font-size:19px;letter-spacing:3px;color:#7A8BA0;font-weight:700">SYSTEM-DESIGN.IN · REAL-WORLD ARCHITECTURE SERIES</div></div>
<div id="endc" class="full" style="opacity:0"><div class="band2"></div><div class="kk">REAL-WORLD ARCHITECTURE</div><h1>{e[0]}</h1><p>{e[1]}</p><img src="../sdi_logo_v2_crop.png" style="mix-blend-mode:multiply;height:120px;margin-top:56px"></div>
<div id="fx" style="position:absolute;inset:0;z-index:55;display:none;background:radial-gradient(1200px 700px at 50% 45%,rgba(255,255,255,.95),rgba(233,240,248,.98))"></div>
<div id="cap"></div>
</div>
<script>const VID={v};</script>
<script src="timeline2.js"></script>
</body></html>'''

for v in range(1, 19):
    open(f'{ROOT}/vid/v{v}.html', 'w').write(page(v))
print('built')
