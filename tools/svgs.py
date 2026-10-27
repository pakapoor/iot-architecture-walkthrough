import html
F='Inter,Segoe UI,Arial,sans-serif'
def svg(w,h,body): return f'<svg viewBox="0 0 {w} {h}" width="100%" style="display:block" font-family="{F}"><defs><marker id="qa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="#7A8BA0" stroke-width="1.6"/></marker><marker id="qg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="#16A34A" stroke-width="1.8"/></marker></defs>{body}</svg>'
P={'v':('#5B3FD9','#F6F3FF','#C4B5FD'),'b':('#1D4ED8','#F4F8FF','#93B4F5'),'o':('#B45309','#FFF7ED','#FDBA74'),'g':('#15803D','#ECFDF3','#86EFAC'),'r':('#DC2626','#FEF2F2','#FCA5A5'),'t':('#0F766E','#F0FDFA','#99F6E4'),'n':('#33465C','#F6F8FB','#B9C6D8'),'p':('#BE185D','#FDF2F8','#F9A8D4')}
def e(t): return html.escape(t, quote=False)
def box(x,y,w,h,c,title=None,lines=(),fs=15,tfs=16,attrs=''):
    fg,bg,bd=P[c]; o=f'<g {attrs}><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" fill="{bg}" stroke="{bd}" stroke-width="1.6"/>'
    yy=y+26
    if title: o+=f'<text x="{x+14}" y="{yy}" font-size="{tfs}" font-weight="800" fill="{fg}">{e(title)}</text>'; yy+=tfs+6
    for l in lines: o+=f'<text x="{x+14}" y="{yy}" font-size="{fs}" fill="#24364E">{e(l)}</text>'; yy+=fs+6
    return o+'</g>'
def tag(x,y,t,c): fg,bg,bd=P[c]; w=len(t)*8.2+20; return f'<rect x="{x}" y="{y}" width="{w}" height="24" rx="12" fill="#fff" stroke="{bd}"/><text x="{x+10}" y="{y+16.5}" font-size="12" font-weight="800" letter-spacing="1.2" fill="{fg}">{e(t)}</text>'
def hd(x,y,t,c): return f'<text x="{x}" y="{y}" font-size="13" font-weight="800" letter-spacing="2" fill="{P[c][0]}">{e(t)}</text>'
def arr(d,c='#7A8BA0',m='qa',dash=''): return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="2" {"stroke-dasharray=%s"%chr(34)+dash+chr(34) if dash else ""} marker-end="url(#{m})"/>'
def lab(x,y,t,c='#56667C',fs=13,wgt=600,anchor='start'): return f'<text x="{x}" y="{y}" font-size="{fs}" font-weight="{wgt}" fill="{c}" text-anchor="{anchor}">{e(t)}</text>'
def cyl(x,y,w,h,c,title,sub,attrs=''):
    fg,bg,bd=P[c]; ry=12
    return (f'<g {attrs}><path d="M{x} {y+ry} V{y+h-ry} A{w/2} {ry} 0 0 0 {x+w} {y+h-ry} V{y+ry}" fill="{bg}" stroke="{bd}" stroke-width="1.6"/>'
            f'<ellipse cx="{x+w/2}" cy="{y+ry}" rx="{w/2}" ry="{ry}" fill="#fff" stroke="{bd}" stroke-width="1.6"/>'
            f'<text x="{x+w/2}" y="{y+h/2+6}" text-anchor="middle" font-size="16" font-weight="800" fill="{fg}">{e(title)}</text>'
            f'<text x="{x+w/2}" y="{y+h/2+26}" text-anchor="middle" font-size="13" fill="#33465C">{e(sub)}</text></g>')
OUT={}
# ---------- KAFKA (shared topics) ----------
b=[]
b.append(box(20,130,170,100,'n','Ingestion',['key = deviceId']))
b.append(arr('M190 180 H232'))
b.append(box(20,290,170,70,'o','Schema registry',['Avro contracts'],fs=13,tfs=15))
b.append(f'<rect x="240" y="14" width="820" height="306" rx="14" fill="#F6F8FB" stroke="#B9C6D8" stroke-width="1.6"/>'+hd(258,40,'SHARED TOPICS · ALL TENANTS','n'))
def topic(y,name,t,tc):
    o=lab(258,y,name,'#0B1F3F',16,700)+lab(258,y+20,t,tc,12.5,800)
    for pi in range(3):
        yy=y-14+pi*30; o+=lab(420,yy+15,f'P{pi}','#56667C',13,700)
        for c in range(14):
            x=446+c*30; f='#DCE6F3' if c<(11 if pi!=1 else 9) else '#FFFFFF'; o+=f'<rect x="{x}" y="{yy}" width="26" height="20" rx="4" fill="{f}" stroke="#C9D5E5"/>'
        o+=f'<path d="M866 {yy+10} H1100" stroke="#C9D5E5" stroke-width="1.2"/>'
    return o
b.append(topic(70,'heartbeats','⚡ PRIORITY TOPIC','#B45309')); b.append(topic(190,'telemetry','BULK','#56667C'))
for k,c in enumerate([3,7,10]): x=446+c*30; b.append(f'<rect x="{x}" y="116" width="26" height="20" rx="4" fill="#2563EB"/><text x="{x+13}" y="131" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">{k+1}</text>')
for k,c in enumerate([2,5,9]): x=446+c*30; b.append(f'<rect x="{x}" y="56" width="26" height="20" rx="4" fill="#F08A1C"/><text x="{x+13}" y="71" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">{k+1}</text>')
b.append(lab(446,160,'hash(deviceId): Acme CAM-14 → P2 · Beta SNS-07 → P0 · each device stays in order','#1D4ED8',13.5))
b.append(lab(446,296,'offsets grow left → right · retention keeps days of history',fs=13.5,wgt=400))
b.append(box(240,334,820,58,'o',None,[]) + hd(258,358,'FAIRNESS IS ENFORCED BEFORE KAFKA','o')+lab(258,380,'per-tenant quotas at the gateway · tenant_id on every message · no topic per tenant','#9A4A0C',13.5,400))
b.append(f'<rect x="1110" y="14" width="370" height="306" rx="14" fill="#F6F3FF" stroke="#C4B5FD" stroke-width="1.6"/>'+hd(1128,40,'FLINK · CONSUMER GROUP','v'))
for yy,l in [(66,'Worker 1 ← P0'),(126,'Worker 2 ← P1'),(186,'Worker 3 ← P2')]: b.append(f'<rect x="1128" y="{yy}" width="334" height="46" rx="10" fill="#fff" stroke="#C4B5FD"/>'+lab(1146,yy+29,l,'#3B2A8C',15,700))
b.append(lab(1128,262,'parallelism ≤ partitions','#5B3FD9',13.5)+lab(1128,284,'one partition → one worker → keyed state per device',fs=13.5,wgt=400))
b.append(box(1110,334,370,58,'g',None,[])+hd(1128,358,'REPLAY','g')+lab(1128,380,'bug or outage → rewind the offset → reprocess','#166534',13.5,400))
OUT['KAFKA']=svg(1500,400,''.join(b))
# ---------- EDGE ----------
b=[]
b.append(f'<rect x="20" y="14" width="900" height="380" rx="16" fill="#F0FDFA" stroke="#99F6E4" stroke-width="1.6"/>'+hd(40,42,'RETAIL SITE · SITE-07','t'))
for i,(ic,n) in enumerate([('📷','Cameras'),('🌡','Thermostats'),('👣','Footfall sensors'),('🖥','Displays')]):
    y=64+i*76; b.append(f'<rect x="40" y="{y}" width="210" height="60" rx="12" fill="#fff" stroke="#99F6E4"/><text x="58" y="{y+38}" font-size="22">{ic}</text>'+lab(92,y+37,n,'#0B1F3F',15.5,700))
    b.append(arr(f'M250 {y+30} H338'))
b.append(lab(262,52,'MQTT / CoAP','#0F766E',13,800))
b.append(box(345,64,280,170,'t','Gateway A · ACTIVE',['Batches per site','(1 heartbeat / device / min)','Local spool on disk + retry','Firmware agent: apply / rollback'],fs=14))
b.append(box(345,250,280,120,'n','Gateway B · STANDBY',['Takes over if A fails','Same spool + identity'],fs=14))
b.append(arr('M485 234 V248','#7A8BA0')+lab(495,246,'failover',fs=12))
b.append(box(650,64,250,150,'o','When the cloud is down',['Spool fills on disk','Nothing is dropped','Flush on reconnect →','a burst (see queue depth)'],fs=13.5,tfs=15))
b.append(box(650,230,250,140,'p','Firmware',['Canary % first','Status back via telemetry','Auto-rollback on failure'],fs=13.5,tfs=15))
b.append(arr('M625 150 H640 V150','#7A8BA0'))
b.append(arr('M920 200 H1010','#1D4ED8')+lab(930,190,'mTLS · batches','#1D4ED8',13,800))
b.append(box(1015,120,240,160,'b','Cloud Gateway',['Device identity check','Per-tenant quotas'],fs=14))
b.append(box(1280,14,220,380,'n','Why batch here',['100M devices × 1/min','≈ 1.7M msgs/sec','per-site batching →','200K msgs/sec','normal peak (batched)','','Spool = no data loss','in site outages'],fs=14))
OUT['EDGE']=svg(1520,410,''.join(b))
# ---------- GATEWAY ----------
b=[]
b.append(hd(20,30,'MANY SITES · MANY TENANTS','n'))
for i,(t,c) in enumerate([('Acme · Site-07','b'),('Acme · Site-12','b'),('Beta · Site-03 (buggy firmware)','o')]):
    y=46+i*70; b.append(box(20,y,250,54,c,None,[])+lab(36,y+33,t,P[c][0],14.5,700)); b.append(arr(f'M270 {y+27} H318'))
b.append(box(325,46,200,194,'b','1 · mTLS',['Terminate TLS','Cert → device','identity'],fs=14))
b.append(arr('M525 143 H563'))
b.append(box(570,46,200,194,'b','2 · Tenant lookup',['device → tenant','(from registry)','tag tenant_id'],fs=14))
b.append(arr('M770 143 H808'))
b.append(f'<rect x="815" y="30" width="330" height="226" rx="14" fill="#FFF7ED" stroke="#FDBA74" stroke-width="1.6"/>'+hd(833,56,'3 · PER-TENANT QUOTAS','o'))
for i,(n,fill,st,c) in enumerate([('Acme bucket',0.6,'✓ within quota','#15803D'),('Beta bucket',0.0,'✕ 429 · throttled','#DC2626')]):
    y=74+i*86; b.append(lab(833,y+18,n,'#0B1F3F',15,700)+f'<rect x="833" y="{y+28}" width="190" height="24" rx="6" fill="#fff" stroke="#FDBA74"/><rect x="833" y="{y+28}" width="{max(4,190*fill)}" height="24" rx="6" fill="#FDBA74"/>'+lab(1032,y+46,st,c,13,800))
b.append(arr('M1145 143 H1183'))
b.append(box(1190,46,150,194,'n','4 · Load balancer',['spread over','the pool'],fs=14,tfs=15))
b.append(arr('M1340 143 H1372'))
b.append(f'<rect x="1378" y="40" width="130" height="206" rx="14" fill="#F6F8FB" stroke="#B9C6D8" stroke-width="1.6"/>'+lab(1392,64,'Ingestion pool','#33465C',13,800))
for i in range(4): b.append(f'<rect x="1394" y="{80+i*40}" width="98" height="30" rx="8" fill="#fff" stroke="#B9C6D8"/>'+lab(1406,100+i*40,f'pod {i+1}','#33465C',13,700))
b.append(box(20,280,740,110,'r','Why quotas live here',['Beta\'s flood is rejected before it costs anything downstream —','Kafka, Flink and storage never see it, and Acme is untouched.'],fs=15))
b.append(box(780,280,728,110,'n','Also at the gateway',['Auth + tenant resolution for every request','Health checks on the ingestion tier · rate limits per device'],fs=15))
OUT['GW']=svg(1520,400,''.join(b))
# ---------- INGESTION ----------
b=[]
b.append(box(20,120,180,110,'b','From gateway',['tenant-tagged','batches'],fs=14))
b.append(arr('M200 175 H248'))
b.append(f'<rect x="255" y="20" width="560" height="300" rx="16" fill="#F6F8FB" stroke="#B9C6D8" stroke-width="1.6"/>'+hd(275,46,'STATELESS POOL · KUBERNETES · AUTOSCALED','n'))
for i,t in enumerate(['1 · Validate (Avro schema)','2 · Tag tenant_id · deviceId key','3 · Route by type']):
    y=66+i*76; b.append(f'<rect x="275" y="{y}" width="330" height="58" rx="10" fill="#fff" stroke="#B9C6D8"/>'+lab(292,y+35,t,'#0B1F3F',15.5,700))
    if i<2: b.append(arr(f'M440 {y+58} V{y+74}'))
for i in range(3): b.append(f'<rect x="{630+i*60}" y="80" width="48" height="48" rx="10" fill="#fff" stroke="#B9C6D8"/>'+lab(654+i*60,110,'pod','#56667C',12,700,'middle'))
b.append(lab(630,150,'scale out on CPU + lag',fs=13)+lab(630,170,'no state → any pod can die',fs=13,wgt=400))
b.append(arr('M605 258 H860 V110 H900','#B45309')+arr('M605 258 H860 V270 H900','#56667C')+arr('M440 282 V340 H900','#DC2626',dash='5 4'))
b.append(box(905,60,300,100,'o','heartbeats topic',['⚡ priority · small, fast','drives DEAD detection'],fs=14))
b.append(box(905,220,300,100,'n','telemetry topic',['bulk readings','charts + rollups'],fs=14))
b.append(box(905,330,300,62,'r',None,[])+lab(921,358,'invalid → rejected + counted','#DC2626',14.5,700)+lab(921,380,'(alarm in Datadog)','#56667C',13,400))
b.append(box(1230,60,280,332,'n','Why prioritise heartbeats',['Losing one chart point','is fine.','','A delayed heartbeat','can raise a false DEAD','and page someone.'],fs=14.5))
OUT['ING']=svg(1520,400,''.join(b))
# ---------- FLINK ----------
b=[]
b.append(box(20,40,170,90,'o','heartbeats',['Kafka topic'],fs=13,tfs=15)); b.append(box(20,150,170,90,'n','telemetry',['Kafka topic'],fs=13,tfs=15))
b.append(arr('M190 85 H226')+arr('M190 195 H226'))
b.append(box(232,40,170,200,'v','keyBy(deviceId)',['all events of a','device go to the','same worker','→ in order'],fs=13.5,tfs=15))
b.append(arr('M402 140 H438'))
b.append(box(444,30,250,220,'v','Dedup + enrich',['keyed state per device:','last sequence seen','→ drop duplicates','join device metadata','(type, tenant, site)'],fs=13.5,tfs=15))
b.append(arr('M694 140 H730'))
b.append(box(736,20,300,240,'v','Rule engine (CEP)',['per-device TIMER:','reset on every heartbeat','fires after 5 min → DEAD','SLOW: below threshold N min','OVERHEATING: temp rising fast','tenant overrides applied'],fs=13.5,tfs=15))
b.append(box(444,268,250,74,'p',None,[])+lab(458,294,'Control plane → rules','#BE185D',14,800)+lab(458,316,'broadcast live, no redeploy','#33465C',13,400))
b.append(arr('M694 300 H760 V262','#BE185D'))
outs=[('Critical lane → paging','r',20),('Minor lane → digest','o',86),('Live → dashboard service','g',152),('Raw → ClickHouse hot','b',218),('1-hour rollups → warm','b',284)]
for t,c,y in outs: b.append(arr(f'M1036 140 H1070 V{y+28} H1098', P[c][0] if c!='b' else '#1D4ED8')); b.append(box(1104,y,300,56,c,None,[])+lab(1120,y+34,t,P[c][0],14.5,700))
b.append(lab(1120,370,'only state CHANGES go to the lanes','#56667C',13,600))
b.append(f'<rect x="20" y="360" width="1010" height="40" rx="10" fill="#F6F8FB" stroke="#B9C6D8"/>'+lab(36,386,'Runs on Kubernetes: N TaskManagers · checkpoints snapshot all keyed state + timers · on a crash: restore + replay Kafka from the checkpoint','#33465C',13.5,600))
OUT['FLINK']=svg(1420,410,''.join(b))
# ---------- DASHBOARDS ----------
b=[]
b.append(cyl(20,40,180,110,'g','Redis','live state · pub/sub')); b.append(cyl(20,170,180,100,'b','ClickHouse','history charts')); b.append(cyl(20,290,180,100,'v','MongoDB','device metadata'))
b.append(box(240,14,190,54,'v',None,[])+lab(256,47,'Flink · live updates','#5B3FD9',14.5,800))
b.append(arr('M430 41 H458 V100 H486','#16A34A','qg'))
b.append(f'<rect x="470" y="20" width="360" height="370" rx="16" fill="#F4F8FF" stroke="#93B4F5" stroke-width="1.6"/>'+hd(490,48,'DASHBOARD SERVICE','b'))
b.append(box(490,64,320,96,'g','SSE stream hub',['subscribes per tenant (Redis)','pushes changes to open pages'],fs=13.5,tfs=15))
b.append(box(490,174,320,96,'b','REST API',['history from ClickHouse','metadata from MongoDB'],fs=13.5,tfs=15))
b.append(box(490,284,320,90,'r','RBAC on every call',['role + tenant + sites','scopes every query'],fs=13.5,tfs=15))
b.append(arr('M200 95 H486','#16A34A','qg')+arr('M200 220 H486')+arr('M200 340 H470 V250 H486'))
b.append(f'<rect x="880" y="20" width="300" height="370" rx="16" fill="#F6F3FF" stroke="#C4B5FD" stroke-width="1.6"/>'+hd(898,48,'PLATFORM ADMIN VIEW','v'))
for i,(t,h) in enumerate([('Acme Retail','99.9%'),('Beta Mart','98.7%'),('Gamma Foods','99.8%'),('… 1000s of tenants','')]):
    y=66+i*58; b.append(f'<rect x="898" y="{y}" width="264" height="46" rx="10" fill="#fff" stroke="#C4B5FD"/>'+lab(912,y+29,t,'#3B2A8C',14.5,700)+(lab(1146,y+29,h,'#15803D',14,800,'end') if h else ''))
b.append(lab(898,316,'all tenants · health · quotas',fs=13.5)+lab(898,338,'firmware rollouts',fs=13.5))
b.append(f'<rect x="1200" y="20" width="310" height="370" rx="16" fill="#F4F8FF" stroke="#93B4F5" stroke-width="1.6"/>'+hd(1218,48,'TENANT ADMIN · ACME ONLY','b'))
for i,(t,ind) in enumerate([('Acme Retail',0),('Site-07 · Noida',1),('CAM-14 · ONLINE',2),('TH-05 · 22.4 °C',2),('Site-12 · Gurugram',1)]):
    y=66+i*50; b.append(f'<rect x="{1218+ind*22}" y="{y}" width="{274-ind*22}" height="40" rx="9" fill="#fff" stroke="#93B4F5"/>'+lab(1232+ind*22,y+26,t,'#1D4ED8',14,700))
b.append(lab(1218,342,'tenant → site → device',fs=13.5)+lab(1218,364,'never sees another tenant',fs=13.5))
b.append(arr('M830 120 H876','#16A34A','qg')+arr('M1180 330 H1196','#16A34A','qg'))
OUT['DASH']=svg(1520,400,''.join(b))
# ---------- STORAGE level 1 ----------
b=[]
b.append(box(20,150,170,100,'v','Flink',['writes in parallel'],fs=13,tfs=16))
st=[('redis','Redis','g','LIVE · now','latest state · counts · pub/sub',20),('chhot','ClickHouse hot','b','7 DAYS','raw telemetry',112),('chwarm','ClickHouse warm','b','6 MONTHS','1-hour rollups',204),('s3','S3 cold','n','ARCHIVE','sampled, after TTL',296)]
for k,n,c,t,s,y in st:
    b.append(arr(f'M190 200 H230 V{y+40} H268', '#16A34A' if k=='redis' else '#7A8BA0','qg' if k=='redis' else 'qa'))
    b.append(f'<g data-store="{k}" style="cursor:pointer">'+cyl(272,y,250,82,c,n,s)+tag(536,y+28,t,c)+lab(700,y+46,'tables →','#2563EB',13,800)+'</g>')
b.append(f'<g data-store="mongo" style="cursor:pointer">'+cyl(272,392,250,0+0,'v','','') + '</g>' if False else '')
b.append(box(20,300,170,90,'p','Control plane',['tenants · rules','devices'],fs=13,tfs=15))
b.append(arr('M190 345 H220 V420 H268','#BE185D'))
b.append(f'<g data-store="mongo" style="cursor:pointer">'+cyl(272,388,250,82,'v','MongoDB','registry · configs · rules')+tag(536,416,'METADATA','v')+lab(700,434,'collections →','#2563EB',13,800)+'</g>')
b.append(f'<rect x="830" y="20" width="300" height="450" rx="16" fill="#F4F8FF" stroke="#93B4F5" stroke-width="1.6"/>'+hd(848,48,'DASHBOARD SERVICE','b'))
b.append(box(848,64,264,90,'g','Live (SSE)',['from Redis pub/sub','+ Flink live updates'],fs=13,tfs=15))
b.append(box(848,170,264,90,'b','Charts (REST)',['last 7 days → hot','older → warm rollups'],fs=13,tfs=15))
b.append(box(848,276,264,90,'v','Metadata',['device names, sites','from MongoDB'],fs=13,tfs=15))
b.append(lab(848,400,'S3 is not on the read path:',fs=13)+lab(848,420,'audits / reprocessing only',fs=13,wgt=400))
b.append(arr('M760 60 H844','#16A34A','qg')+arr('M760 152 H800 V215 H844')+arr('M760 244 H800 V215')+arr('M760 430 H800 V321 H844'))
b.append(f'<rect x="1160" y="20" width="350" height="450" rx="16" fill="#F0FDFA" stroke="#99F6E4" stroke-width="1.6"/>'+hd(1178,48,'30 VIEWERS, ONE READ','t'))
for i in range(6): b.append(f'<rect x="{1180+(i%3)*108}" y="{70+(i//3)*84}" width="96" height="68" rx="10" fill="#fff" stroke="#99F6E4"/>'+lab(1228+(i%3)*108,110+(i//3)*84,'🖥 page','#0F766E',13,700,'middle'))
b.append(lab(1178,272,'Big tenant, 30 open dashboards:',fs=14,c='#0F766E',wgt=700))
for i,t in enumerate(['one Redis subscription','→ pushed to all 30 pages','no 30× repeated ClickHouse','queries for "current status"']): b.append(lab(1178,300+i*24,t,fs=14,wgt=400,c='#24364E'))
b.append(arr('M1130 200 H1156','#16A34A','qg'))
b.append(lab(272,15+0,'',fs=1))
b.append(lab(20,488,'Click a store to see its tables, keys and indexes · example schema, designed to fit this system',c='#7A8BA0',fs=13))
OUT['STOR']=svg(1520,500,''.join(b))
# ---------- STORE DETAILS (level 2) ----------
def table(x,y,cols,rows,w,hl=None):
    cw=w/len(cols); o=f'<rect x="{x}" y="{y}" width="{w}" height="{30+len(rows)*28}" rx="10" fill="#fff" stroke="#C9D5E5"/>'
    o+=f'<rect x="{x}" y="{y}" width="{w}" height="30" rx="10" fill="#EEF3F9"/>'
    for i,c in enumerate(cols): o+=lab(x+10+i*cw,y+20,c,'#33465C',12.5,800)
    for r,row in enumerate(rows):
        yy=y+30+r*28
        if hl is not None and r in hl: o+=f'<rect x="{x+1}" y="{yy}" width="{w-2}" height="28" fill="#EFF5FF"/>'
        for i,v in enumerate(row): o+=f'<text x="{x+10+i*cw}" y="{yy+19}" font-size="13" fill="#24364E" font-family="IBM Plex Mono,Consolas,monospace">{e(v)}</text>'
    return o
def code(x,y,w,lines,title=None):
    h=24+len(lines)*21+(24 if title else 0); o=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="#0B1F3F"/>'
    yy=y+26
    if title: o+=lab(x+14,yy,title,'#FFD23F',12.5,800); yy+=24
    for l in lines: o+=f'<text x="{x+14}" y="{yy}" font-size="13.5" fill="#E7EEF8" font-family="IBM Plex Mono,Consolas,monospace" xml:space="preserve">{e(l)}</text>'; yy+=21
    return o
def chart(x,y,w,h,vals,lo,hi,color,band=None,title=''):
    o=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="#fff" stroke="#C9D5E5"/>'+lab(x+12,y+22,title,'#33465C',13,800)
    X=lambda i: x+16+i*(w-32)/(len(vals)-1); Y=lambda v: y+h-14-(v-lo)/(hi-lo)*(h-48)
    if band:
        pts=' '.join(f'{X(i):.1f},{Y(b[1]):.1f}' for i,b in enumerate(band))+' '+' '.join(f'{X(i):.1f},{Y(b[0]):.1f}' for i,b in reversed(list(enumerate(band))))
        o+=f'<polygon points="{pts}" fill="{color}" opacity=".15"/>'
    o+=f'<polyline points="{" ".join(f"{X(i):.1f},{Y(v):.1f}" for i,v in enumerate(vals))}" fill="none" stroke="{color}" stroke-width="2.5"/>'
    return o
import math
raw=[22.4+0.5*math.sin(i/2.3)+0.2*math.sin(i*1.7) for i in range(40)]
hourly=[(21.2+0.8*math.sin(i/3),23.6+0.6*math.sin(i/3+1)) for i in range(24)]; avg=[(a+b_)/2 for a,b_ in hourly]
D={}
b=[code(20,10,700,["CREATE TABLE telemetry_raw (","  tenant_id  LowCardinality(String),","  device_id  String,","  event_id   String,   -- device + boot ID + sequence","  metric     LowCardinality(String),","  ts         DateTime64(3),","  value      Float64",") ENGINE = ReplacingMergeTree","PARTITION BY toYYYYMMDD(ts)","ORDER BY (tenant_id, device_id, metric, ts, event_id)","TTL ts + INTERVAL 7 DAY      -- then rolled off"],'EXAMPLE SCHEMA · CLICKHOUSE HOT'),
   table(20,300,['tenant_id','device_id','metric','ts','value'],[['acme','TH-05','temp_c','10:42:00','22.4'],['acme','TH-05','temp_c','10:43:00','22.6'],['acme','TH-05','temp_c','10:44:00','22.5'],['beta','SNS-07','lat_ms','10:42:00','160']],700,hl={0,1,2}),
   f'<rect x="750" y="10" width="760" height="196" rx="12" fill="#F4F8FF" stroke="#93B4F5"/>'+hd(768,38,'HOW THE INDEX WORKS','b'),
   lab(768,64,'Sorted on disk by (tenant, device, metric, time).',fs=14.5,c='#24364E',wgt=400),lab(768,88,'A sparse primary index keeps one entry per 8,192 rows.',fs=14.5,c='#24364E',wgt=400),
   lab(768,112,'"TH-05, last hour" → jumps straight to a few blocks;',fs=14.5,c='#24364E',wgt=400),lab(768,136,'no full scan, even with billions of rows.',fs=14.5,c='#24364E',wgt=400),
   lab(768,160,'A replayed event keeps its event_id, so it collapses at merge.',fs=14.5,c='#24364E',wgt=400),
   lab(768,186,'Daily partitions make the 7-day TTL a cheap drop.',fs=14.5,c='#1D4ED8',wgt=700),
   chart(750,214,760,236,raw,21.5,23.3,'#F08A1C',title='TH-05 · temp_c · last 40 min (raw points)')]
D['chhot']=('ClickHouse hot · raw telemetry, 7 days',svg(1520,460,''.join(b)))
b=[code(20,10,700,["CREATE TABLE telemetry_1h (","  tenant_id  LowCardinality(String),","  device_id  String,","  metric     LowCardinality(String),","  hour       DateTime,","  min Float64, max Float64,","  avg Float64, cnt UInt32,","  version    UInt64",") ENGINE = ReplacingMergeTree(version)","ORDER BY (tenant_id, device_id, metric, hour)","TTL hour + INTERVAL 6 MONTH  -- then archived"],'EXAMPLE SCHEMA · CLICKHOUSE WARM'),
   table(20,320,['device_id','hour','min','max','avg'],[['TH-05','09:00','21.9','23.1','22.4'],['TH-05','10:00','22.0','23.4','22.6'],['TH-05','11:00','21.8','23.0','22.3']],700),
   f'<rect x="750" y="10" width="760" height="190" rx="12" fill="#F4F8FF" stroke="#93B4F5"/>'+hd(768,38,'WHY THIS SHAPE','b'),
   lab(768,64,'Flink computes each hour once and writes it here.',fs=14.5,c='#24364E',wgt=400),lab(768,88,'Duplicates collapse at background merge; dashboard queries',fs=14.5,c='#24364E',wgt=400),
   lab(768,112,'use FINAL (or argMax by version), so a delayed older',fs=14.5,c='#24364E',wgt=400),lab(768,136,'aggregate never overrides a newer one.',fs=14.5,c='#24364E',wgt=400),lab(768,172,'6 months × 24 rows/day per metric — tiny vs raw.',fs=14.5,c='#1D4ED8',wgt=700),
   chart(750,214,760,236,avg,20.5,24.5,'#2563EB',band=hourly,title='TH-05 · temp_c · last 24 h (avg with min–max band)')]
D['chwarm']=('ClickHouse warm · hourly rollups, 6 months',svg(1520,460,''.join(b)))
b=[hd(20,30,'EXAMPLE KEYS · REDIS','g'),
   table(20,44,['key','type','value'],[['dev:acme:CAM-14','HASH','status=ONLINE  last_seen=10:42:07'],['dev:acme:TH-05','HASH','status=ONLINE  temp=22.4'],['cnt:acme:site-07','HASH','online=47  degraded=1  down=0'],['cnt:acme','HASH','online=10,212  down=14'],['live:acme','PUB/SUB','channel → dashboard service']],900,hl={4}),
   f'<rect x="950" y="30" width="560" height="200" rx="12" fill="#ECFDF3" stroke="#86EFAC"/>'+hd(968,58,'HOW IT IS USED','g'),
   lab(968,86,'Flink writes on every state change.',fs=14.5,c='#24364E',wgt=400),lab(968,110,'Dashboard tiles read cnt:* — one call, instant.',fs=14.5,c='#24364E',wgt=400),
   lab(968,134,'live:<tenant> fans out to every open page.',fs=14.5,c='#24364E',wgt=400),lab(968,170,'A cache, not the source of truth:',fs=14.5,c='#15803D',wgt=700),lab(968,194,'rebuildable from Flink state if lost.',fs=14.5,c='#15803D',wgt=700),
   f'<rect x="20" y="250" width="1490" height="150" rx="12" fill="#fff" stroke="#C9D5E5"/>'+hd(38,278,'ONE UPDATE, MANY VIEWERS','t')]
for i,t in enumerate(['Flink: CAM-14 → DEAD','Lua: HINCRBY only if changed','PUBLISH live:acme','dashboard service','30 open pages update']):
    x=38+i*296; b.append(f'<rect x="{x}" y="290" width="270" height="68" rx="10" fill="#F0FDFA" stroke="#99F6E4"/>'+lab(x+14,329,t,'#0F766E',13.5,700))
    if i<4: b.append(arr(f'M{x+270} 324 H{x+294}','#16A34A','qg'))
b.append(lab(38,384,"One atomic Lua script: HINCRBY the counts only if the status actually changed. A replayed DEAD doesn't double-count.",fs=14,c='#0F766E',wgt=600))
D['redis']=('Redis · live state and counts',svg(1520,410,''.join(b)))
b=[code(20,10,620,['{','  "_id": "CAM-14",','  "tenant_id": "acme",','  "site_id": "site-07",','  "type": "camera",','  "firmware": "4.2.1",','  "location": "Aisle 4",','  "created": "2025-03-14"','}'],'EXAMPLE DOCUMENT · devices'),
   code(20,270,620,['{ "tenant_id": "acme",','  "device_type": "camera",','  "rule": "DEAD", "after_min": 10 }'],'EXAMPLE DOCUMENT · rule_overrides'),
   f'<rect x="680" y="10" width="830" height="230" rx="12" fill="#F6F3FF" stroke="#C4B5FD"/>'+hd(698,38,'INDEXES (EXAMPLE)','v')]
for i,(ix,why) in enumerate([('{ _id }','device lookup by id (unique)'),('{ tenant_id: 1, site_id: 1 }','"all devices of a site" for dashboards'),('{ tenant_id: 1, type: 1 }','rule targeting + firmware rollouts'),('{ tenant_id: 1, device_type: 1 } on rule_overrides','Flink loads overrides per tenant')]):
    y=58+i*44; b.append(f'<rect x="698" y="{y}" width="794" height="36" rx="8" fill="#fff" stroke="#C4B5FD"/><text x="712" y="{y+24}" font-size="13.5" fill="#3B2A8C" font-family="IBM Plex Mono,Consolas,monospace">{e(ix)}</text>'+lab(1480,y+24,why,'#56667C',13,400,'end'))
b.append(f'<rect x="680" y="260" width="830" height="130" rx="12" fill="#fff" stroke="#C9D5E5"/>'+hd(698,288,'WHY A DOCUMENT STORE HERE','n'))
for i,t in enumerate(['Low-volume, config-shaped data that changes rarely.','Device types differ in fields — documents fit naturally.','Every query starts with tenant_id → tenant isolation by design.']): b.append(lab(698,316+i*24,t,fs=14.5,c='#24364E',wgt=400))
D['mongo']=('MongoDB · registry, configs, rules',svg(1520,400,''.join(b)))
b=[hd(20,30,'EXAMPLE LAYOUT · S3 COLD ARCHIVE','n'),
   code(20,44,760,['s3://iot-archive/','  dt=2026-10-26/','    tenant=acme/  part-0001.parquet','    tenant=beta/  part-0001.parquet','  dt=2026-10-27/ …'],None),
   f'<rect x="820" y="20" width="690" height="200" rx="12" fill="#F6F8FB" stroke="#B9C6D8"/>'+hd(838,48,'WHAT GOES HERE','n')]
for i,t in enumerate(['Sampled telemetry after the 7-day TTL','Rollups after the 6-month TTL','Columnar files, partitioned by date and tenant','Lifecycle rules move old data to cheaper storage','An export job writes Parquet to S3 and verifies it before TTL drops the partition']): b.append(lab(838,78+i*26,'• '+t,fs=14.5,c='#24364E',wgt=400))
b.append(f'<rect x="20" y="240" width="1490" height="130" rx="12" fill="#fff" stroke="#C9D5E5"/>'+hd(38,268,'NOT ON THE READ PATH','n'))
for i,t in enumerate(['Dashboards never read S3. It is for audits, long-term analysis and reprocessing.','Cost per device stays flat: old data lives in the cheapest tier.']): b.append(lab(38,298+i*26,t,fs=14.5,c='#24364E',wgt=400))
D['s3']=('S3 cold · sampled archive',svg(1520,380,''.join(b)))
OUT_D=D
