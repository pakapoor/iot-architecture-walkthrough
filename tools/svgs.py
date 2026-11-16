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
b.append(box(20,130,170,100,'n','Ingestion',['key = tenant + device']))
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
b.append(lab(446,160,'hash(tenant + device): Acme CAM-14 → P2 · Beta SNS-07 → P0','#1D4ED8',13.5))
b.append(lab(446,296,'offsets grow left → right · retention keeps days of history',fs=13.5,wgt=400))
b.append(box(240,334,820,58,'o',None,[]) + hd(258,358,'FAIRNESS IS ENFORCED BEFORE KAFKA','o')+lab(258,380,'per-tenant quotas at the gateway · tenant_id on every message · no topic per tenant','#9A4A0C',13.5,400))
b.append(f'<rect x="1110" y="14" width="370" height="306" rx="14" fill="#F6F3FF" stroke="#C4B5FD" stroke-width="1.6"/>'+hd(1128,40,'FLINK · CONSUMER GROUP','v'))
for yy,l in [(66,'Reader 1 ← P0'),(126,'Reader 2 ← P1'),(186,'Reader 3 ← P2')]: b.append(f'<rect x="1128" y="{yy}" width="334" height="46" rx="10" fill="#fff" stroke="#C4B5FD"/>'+lab(1146,yy+29,l,'#3B2A8C',15,700))
b.append(lab(1128,262,'source readers ≤ partitions','#5B3FD9',13.5)+lab(1128,284,'downstream keyed parallelism is separate',fs=13.5,wgt=400))
b.append(box(1110,334,370,58,'g',None,[])+hd(1128,358,'REPLAY','g')+lab(1128,380,'bug or outage → rewind the offset → reprocess','#166534',13.5,400))
OUT['KAFKA']=svg(1500,400,''.join(b))
# ---------- EDGE (tenant level: two example sites; click a site for its network) ----------
b=[]
b.append(f'<rect x="20" y="14" width="1010" height="392" rx="16" fill="#F0FDFA" stroke="#99F6E4" stroke-width="1.6"/>'+hd(40,42,'TENANT · ACME RETAIL · 214 SITES','t'))
# small store
o=f'<rect x="40" y="60" width="400" height="300" rx="14" fill="#fff" stroke="#99F6E4" stroke-width="1.6"/>'+lab(58,88,'Site-07 · Noida','#0B1F3F',17,800)+lab(58,110,'Small store · e.g. 48 devices','#0F766E',13.5,600)
for i,(ic,n) in enumerate([('📷','12 cameras'),('🖥','8 displays'),('🌡','12 thermo.'),('👣','16 sensors')]):
    x=58+i*94; o+=f'<rect x="{x}" y="128" width="86" height="60" rx="10" fill="#F0FDFA" stroke="#99F6E4"/><text x="{x+10}" y="156" font-size="18">{ic}</text>'+lab(x+10,178,n,'#0F766E',11.5,700)
o+=arr('M240 192 V226')+lab(252,214,'LAN · Wi-Fi · Zigbee/BLE bridge',fs=11.5)
o+=box(110,230,260,76,'t','Edge pair',['A active · B standby'],fs=13,tfs=15)+lab(420,344,'Open site →','#2563EB',13,800,'end')
b.append(f'<g data-site="small" style="cursor:pointer">{o}</g>')
# large flagship
o=f'<rect x="460" y="60" width="400" height="300" rx="14" fill="#fff" stroke="#99F6E4" stroke-width="1.6"/>'+lab(478,88,'Flagship store','#0B1F3F',17,800)+lab(478,110,'Large store · e.g. ~500 devices','#0F766E',13.5,600)
for i,n in enumerate(['Sales floor','Aisles','Cold rooms']):
    x=478+i*128; o+=f'<rect x="{x}" y="128" width="116" height="40" rx="10" fill="#F0FDFA" stroke="#99F6E4"/>'+lab(x+58,153,n,'#0F766E',12,700,'middle')+f'<path d="M{x+58} 168 V182" stroke="#7A8BA0" stroke-width="2"/>'
o+='<path d="M536 196 H664" stroke="#1D4ED8" stroke-width="2.5"/><path d="M664 196 H792" stroke="#1D4ED8" stroke-width="2.5" stroke-dasharray="6 5"/>'
for cx in (536,664,792): o+=f'<circle cx="{cx}" cy="196" r="14" fill="#fff" stroke="#1D4ED8" stroke-width="2"/>'+lab(cx,201,'R','#1D4ED8',12,800,'middle')
o+=arr('M664 210 V226')+box(530,230,260,76,'t','Edge pair',['A active · B standby'],fs=13,tfs=15)
o+=lab(478,330,'Wired backbone + Wi-Fi mesh',fs=11.5)+lab(840,344,'Open site →','#2563EB',13,800,'end')
b.append(f'<g data-site="large" style="cursor:pointer">{o}</g>')
# the other sites
for x,y in [(896,60),(888,68),(880,76)]: b.append(f'<rect x="{x}" y="{y}" width="130" height="284" rx="14" fill="#fff" stroke="#B9C6D8" stroke-width="1.4"/>')
b.append(lab(945,214,'+ 212 more sites','#56667C',14,700,'middle')+lab(945,236,'same pattern',fs=12,wgt=400,anchor='middle'))
# one uplink per site
b.append(arr('M240 306 V384 H1060 V215 H1074','#1D4ED8')+'<path d="M660 306 V384" fill="none" stroke="#1D4ED8" stroke-width="2"/>'+lab(470,400,'WAN · mTLS · one uplink per site','#1D4ED8',12.5,800))
b.append(box(1080,150,200,130,'b','Cloud Gateway',['mTLS identity','Per-tenant quotas'],fs=14))
b.append(box(1300,14,200,392,'n','One edge pair per site',['Devices never reach','the cloud directly','','The edge pair batches,','spools and runs the','firmware agent','','100M devices × 1/min','≈ 1.7M readings/sec','→ ~200K envelopes/sec'],fs=13.5,tfs=15))
# onboarding + filtering at the site (row added below; coordinates above unchanged)
b.append(f'<rect x="20" y="424" width="1480" height="190" rx="16" fill="#FFFBF5" stroke="#FDBA74" stroke-width="1.6"/>'+hd(40,450,'ONBOARDING + FILTERING · AT EVERY SITE','o'))
b.append(box(40,466,210,118,'t','Edge Dashboard',['site ops: connect,','onboard, activate'],fs=13.5,tfs=15))
b.append(arr('M250 525 H292'))
b.append(box(298,466,250,118,'v','Device Identity & PKI',['issues the cert:','tenant + site + region'],fs=13.5,tfs=15))
b.append(box(620,466,190,118,'n','Devices',['MQTT / CoAP','on the site LAN'],fs=13.5,tfs=15))
b.append(arr('M810 525 H852'))
b.append(box(858,466,300,118,'o','Filtering',['allow / block list of devices','per-tenant quota · max devices','drops unknown or excess'],fs=13.5,tfs=15))
b.append(arr('M1158 525 H1200'))
b.append(box(1206,466,280,118,'t','Edge pair',['active publishes + buffers','standby takes over'],fs=13.5,tfs=15))
b.append(arr('M145 584 V600 H1008 V590','#B45309',dash='5 4')+lab(330,598,'activation pushes the allow-list to Filtering','#B45309',12.5,700))
OUT['EDGE']=svg(1520,620,''.join(b))
# ---------- EDGE site details (level 2): example topologies ----------
ED={}
b=[f'<rect x="20" y="14" width="800" height="392" rx="16" fill="#F0FDFA" stroke="#99F6E4" stroke-width="1.6"/>'+hd(40,42,'SITE-07 · NOIDA · SMALL STORE · EXAMPLE TOPOLOGY','t')]
for i,(ic,n,sub) in enumerate([('📷','Cameras','e.g. 12 · PoE Ethernet'),('🖥','Displays','e.g. 8 · Wi-Fi'),('🌡','Thermostats','e.g. 12 · Zigbee'),('👣','Footfall sensors','e.g. 16 · BLE')]):
    y=60+i*68; b.append(f'<rect x="40" y="{y}" width="230" height="56" rx="12" fill="#fff" stroke="#99F6E4"/><text x="54" y="{y+36}" font-size="20">{ic}</text>'+lab(88,y+24,n,'#0B1F3F',15,700)+lab(88,y+44,sub,'#0F766E',12.5,600))
b.append(lab(292,78,'MQTT / CoAP over IP','#0F766E',12,700))
b.append(arr('M270 88 H484')+arr('M270 156 H484')+arr('M270 224 H296')+arr('M270 292 H296')+arr('M450 258 H484'))
b.append(box(300,196,150,124,'o','Zigbee / BLE',['bridge → IP','MQTT over LAN'],fs=12.5,tfs=14))
b.append(box(490,60,300,180,'t','Gateway A · ACTIVE',['Batches heartbeats per site','Local spool on disk + retry','Firmware agent: apply / rollback','mTLS client certificate'],fs=14))
b.append(box(490,262,300,110,'n','Gateway B · STANDBY',['Takes over if A fails','Recoverable spool (e.g.)'],fs=14))
b.append(arr('M640 240 V258')+lab(650,254,'failover',fs=12))
b.append(arr('M790 150 H904','#1D4ED8')+lab(800,140,'WAN · mTLS · batches','#1D4ED8',12.5,800))
b.append(box(910,90,220,130,'b','Cloud Gateway',['Device identity check','Per-tenant quotas'],fs=14))
b.append(arr('M790 200 H850 V300 H904','#B45309',dash='5 4'))
b.append(box(910,240,220,132,'o','If the WAN drops',['Gateway A spools to disk','Bounded, with alarms','Flushes as a burst'],fs=13,tfs=15))
b.append(box(1160,14,340,392,'n','Small site · example',['e.g. 48 devices, one edge pair','IP devices speak MQTT / CoAP','BLE and Zigbee need a bridge to IP','1 heartbeat / device / min','→ one batch per interval','Durability is bounded by','spool size + failover'],fs=14,tfs=16))
ED['small']=('Site-07 · small store',svg(1520,420,''.join(b)))
b=[f'<rect x="20" y="14" width="880" height="392" rx="16" fill="#F0FDFA" stroke="#99F6E4" stroke-width="1.6"/>'+hd(40,42,'FLAGSHIP STORE · LARGE SITE · EXAMPLE TOPOLOGY','t')]
for i,(n,cnt,link) in enumerate([('Sales floor','e.g. 140 cameras · 80 displays','PoE Ethernet · Wi-Fi'),('Aisles & entrances','e.g. 160 footfall sensors','BLE → bridge'),('Cold rooms & HVAC','e.g. 120 thermostats','Zigbee → bridge')]):
    y=60+i*112; b.append(f'<rect x="40" y="{y}" width="240" height="96" rx="12" fill="#fff" stroke="#99F6E4"/>'+lab(56,y+26,n,'#0B1F3F',15,700)+lab(56,y+48,cnt,'#33465C',12.5,400)+lab(56,y+70,link,'#0F766E',12.5,600))
    b.append(arr(f'M280 {y+48} H316')+f'<rect x="320" y="{y+20}" width="130" height="56" rx="10" fill="#fff" stroke="#B9C6D8" stroke-width="1.6"/>'+lab(336,y+44,f'Router R{i+1}','#33465C',14,700)+lab(336,y+64,'non-edge · relays','#56667C',12,400))
b.append('<path d="M450 108 H500 V220" fill="none" stroke="#1D4ED8" stroke-width="2.5"/><path d="M450 220 H500" fill="none" stroke="#1D4ED8" stroke-width="2.5"/><path d="M450 332 H500 V220" fill="none" stroke="#1D4ED8" stroke-width="2.5" stroke-dasharray="6 5"/>')
b.append(arr('M500 220 H574','#1D4ED8'))
b.append(box(580,120,300,200,'t','Edge pair · A active / B standby',['Only box with the WAN uplink','Batches the whole site','Spool on disk + retry','Firmware agent'],fs=14,tfs=15))
b.append('<path d="M40 394 H70" stroke="#1D4ED8" stroke-width="2.5"/>'+lab(78,398,'wired Ethernet backbone (IoT VLAN)',fs=12)+'<path d="M330 394 H360" stroke="#1D4ED8" stroke-width="2.5" stroke-dasharray="6 5"/>'+lab(368,398,'Wi-Fi mesh where cabling is impractical',fs=12))
b.append(arr('M880 220 H974','#1D4ED8')+lab(888,210,'WAN · mTLS','#1D4ED8',12.5,800))
b.append(box(980,150,200,130,'b','Cloud Gateway',['Device identity check','Per-tenant quotas'],fs=14))
b.append(box(1210,14,290,392,'n','Large site · example',['e.g. ~500 devices, 3 zones','Non-edge routers relay','inside the site only','Wired backbone first;','Wi-Fi mesh where no cable','Still one edge pair,','one uplink, one batch stream'],fs=14,tfs=16))
ED['large']=('Flagship store · large site',svg(1520,420,''.join(b)))
OUT_ED=ED
# ---------- GATEWAY ----------
b=[]
b.append(hd(20,30,'MANY SITES · MANY TENANTS','n'))
for i,(t,c) in enumerate([('Acme · Site-07','b'),('Acme · Site-12','b'),('Beta · Site-03 (buggy firmware)','o')]):
    y=46+i*70; b.append(box(20,y,250,54,c,None,[])+lab(36,y+33,t,P[c][0],14.5,700)); b.append(arr(f'M270 {y+27} H318'))
b.append(box(325,46,200,194,'b','1 · mTLS',['Terminate TLS','Cert → gateway','allowed devices'],fs=14))
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
b.append(box(20,280,740,110,'r','Why quotas live here',['Tenant/device budgets bound bytes and readings across replicas.','Reserve heartbeats; shared capacity still needs measured headroom.'],fs=15))
b.append(box(780,280,728,110,'n','Also at the gateway',['Auth + tenant resolution for every request','Health checks on the ingestion tier · rate limits per device'],fs=15))
# PKI + multi-AZ load balancing (row added below; coordinates above unchanged)
b.append(box(20,410,560,170,'v','Device Identity & PKI',['Offline root CA · one issuing CA per region','Cert issued at activation: tenant + site + region','Short-lived certs, rotated by the edge agent','Revoked cert → refused at the handshake'],fs=14,tfs=16))
b.append(arr('M425 410 V246','#5B3FD9',dash='5 4')+lab(434,300,'trust + revocation','#5B3FD9',12.5,700))
b.append(f'<rect x="600" y="410" width="908" height="170" rx="14" fill="#F6F8FB" stroke="#B9C6D8" stroke-width="1.6"/>'+hd(618,436,'4 · LOAD BALANCER SPREADS OVER 3 AVAILABILITY ZONES','n'))
for i,az in enumerate(['AZ-a','AZ-b','AZ-c']):
    x=618+i*296; b.append(f'<rect x="{x}" y="448" width="280" height="84" rx="10" fill="#fff" stroke="#B9C6D8"/>'+lab(x+12,470,az,'#33465C',13,800))
    for k in range(3): b.append(f'<rect x="{x+12+k*88}" y="482" width="78" height="38" rx="8" fill="#F4F8FF" stroke="#93B4F5"/>'+lab(x+51+k*88,506,'ingest','#1D4ED8',12,700,'middle'))
b.append(lab(618,556,'Lose one AZ → the other two carry the load · sized N+1, so one AZ down still fits',fs=13.5,c='#33465C',wgt=600))
OUT['GW']=svg(1520,590,''.join(b))
# ---------- INGESTION ----------
b=[]
b.append(box(20,120,180,110,'b','From gateway',['tenant-tagged','batches'],fs=14))
b.append(arr('M200 175 H248'))
b.append(f'<rect x="255" y="20" width="560" height="300" rx="16" fill="#F6F8FB" stroke="#B9C6D8" stroke-width="1.6"/>'+hd(275,46,'STATELESS POOL · KUBERNETES · AUTOSCALED','n'))
for i,t in enumerate(['1 · Validate (Avro schema)','2 · Unpack · tenant/device key','3 · Route by type']):
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
b.append(box(232,40,170,200,'v','keyBy(identity)',['tenant + device','keys own state','event time handles','late telemetry'],fs=13.5,tfs=15))
b.append(arr('M402 140 H438'))
b.append(box(444,30,250,220,'v','Dedup + enrich',['keyed state per device:','boot/session + stream + seq','bounded seen-event window','join device metadata','(type, tenant, site)'],fs=13.5,tfs=15))
b.append(arr('M694 140 H730'))
b.append(box(736,20,300,240,'v','Rule engine (CEP)',['per-device TIMER:','reset on every heartbeat','10 min → SILENT · 20 → DEAD','SLOW: below threshold N min','OVERHEATING: temp rising fast','tenant overrides applied'],fs=13.5,tfs=15))
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

# ---------- ACTION EXECUTION (two lanes, Temporal, ServiceNow) ----------
b=[]
b.append(box(20,120,150,110,'v','Flink rules',['DEAD · SLOW · HOT','+ recovery'],fs=13.5,tfs=15))
b.append(arr('M170 160 H226','#DC2626')+lab(174,150,'critical','#DC2626',12,800))
b.append(box(230,120,170,90,'o','SNS',['alert fan-out','one event → many'],fs=13,tfs=15))
b.append(arr('M315 120 V70 H436','#DC2626'))
b.append(box(440,24,190,82,'r','PagerDuty',['pages on-call now','no batching'],fs=13,tfs=15))
b.append(arr('M400 165 H436'))
b.append(box(440,124,190,90,'o','SQS · tickets',['buffers bursts','at-least-once'],fs=13,tfs=15))
b.append(arr('M630 169 H666'))
b.append(box(670,124,170,90,'b','Ticket starter',['stateless worker','signalWithStart'],fs=13,tfs=15))
b.append(arr('M535 214 V272 H666','#DC2626',dash='5 4')+lab(546,250,'poison msgs','#DC2626',12,800))
b.append(box(670,236,170,72,'r','DLQ',['alarm + replay tool'],fs=13,tfs=15))
b.append(arr('M840 169 H876'))
b.append(f'<rect x="880" y="14" width="390" height="300" rx="14" fill="#F6F3FF" stroke="#C4B5FD" stroke-width="1.6"/>'+hd(898,40,'TEMPORAL · INCIDENT WORKFLOW','v'))
b.append(f'<rect x="898" y="52" width="354" height="28" rx="7" fill="#0B1F3F"/>'+lab(910,71,'workflowId = tenant + device + outage generation','#FCD34D',12.5,700))
for i,(t,d) in enumerate([('1 · Ticket at minute 30','10-min durable timer, then upsert'),('2 · Wait for ack','30-min deadline from the page'),('3 · Escalate','no ack → page L2, raise priority'),('4 · Resolve','recovery or fix → close the ticket')]):
    y=90+i*54; b.append(f'<rect x="898" y="{y}" width="354" height="46" rx="9" fill="#fff" stroke="#C4B5FD"/>'+lab(912,y+20,t,'#3B2A8C',14,800)+lab(912,y+38,d,'#33465C',12.5,400))
b.append(arr('M1270 90 H1306','#15803D','qg'))
b.append(box(1310,24,190,130,'g','ServiceNow',['incident tickets','idempotent by','correlation ID'],fs=13,tfs=15))
b.append(arr('M1306 250 H1274'))
b.append(box(1310,184,190,130,'n','Signals in',['ack · recovery','ticket status','ops replay'],fs=13,tfs=15))
b.append(arr('M95 230 V371 H226','#B45309')+lab(102,300,'minor','#B45309',12,800))
b.append(box(230,334,170,74,'o','SQS · notify',['minor alerts'],fs=13,tfs=15))
b.append(arr('M400 371 H436','#B45309'))
b.append(box(440,334,400,74,'o','Notification service',['15-min site digest · quiet hours · email / Slack'],fs=13,tfs=15))
b.append(box(880,334,620,74,'n',None,[])+hd(898,362,'WHY TWO LANES','n')+lab(898,386,'confirmed outages page now · minor issues are batched per site','#33465C',13.5,400))
OUT['ACT']=svg(1520,420,''.join(b))

# ---------- OBSERVABILITY (Datadog) ----------
b=[]
b.append(box(20,30,190,300,'n','Signals from',['edge gateways','gateway · ingestion','Kafka · Flink','Temporal · actions','dashboards'],fs=13.5,tfs=15))
b.append(arr('M210 180 H236'))
def spark(x,y,pts,c): return f'<polyline points="{" ".join(f"{x+i*28},{y-v}" for i,v in enumerate(pts))}" fill="none" stroke="{c}" stroke-width="2.4" stroke-linejoin="round"/>'
tiles=[('Consumer lag','messages waiting for Flink','by partition, not just total','#F08A1C',[2,2,3,10,22,30,26,14,4,2]),
       ('Freshness p99','event age when processed','alert > 2 min · heartbeats apart','#F08A1C',[2,2,2,8,18,24,20,10,3,2]),
       ('Flink checkpoints','duration · failures','age of last completed','#7C5CFA',[6,6,7,6,6,7,6,6,7,6]),
       ('Gateway ingress','envelopes/sec · per tenant','normal peak ≈ 200K','#2563EB',[10,10,11,24,26,25,12,10,11,10]),
       ('Traces','one trace ID','edge → Kafka → Flink → ticket','#16A34A',[8,9,8,8,9,8,8,9,8,8])]
for i,(t,a,c2,col,pts) in enumerate(tiles):
    x=240+(i%3)*330; y=30+(i//3)*160
    b.append(f'<rect x="{x}" y="{y}" width="310" height="140" rx="12" fill="#fff" stroke="#C9D5E5" stroke-width="1.6"/>'+lab(x+14,y+26,t,'#0B1F3F',15,800)+lab(x+14,y+46,a,'#56667C',12.5,400)+lab(x+14,y+64,c2,'#56667C',12.5,400)+spark(x+20,y+124,pts,col))
b.append(box(900,190,310,140,'r','Monitors → page',['freshness or lag breach','checkpoint age too high','→ the pipeline owner'],fs=13.5,tfs=15))
b.append(arr('M1210 180 H1246'))
b.append(box(1250,30,250,300,'g','Automation first',['autoscale Flink + ingestion','annotate the dashboards','humans step in past','the guardrails'],fs=13.5,tfs=15))
b.append(box(240,346,1260,50,'v',None,[])+hd(258,368,'PER TENANT AND PER PARTITION','v')+lab(258,388,'averages hide the outlier: freshness per tenant, lag per partition','#3B2A8C',13.5,400))
OUT['OBS']=svg(1520,410,''.join(b))

# ---------- REGIONS (design extension: residency zones, home cells, paired standby) ----------
b=[]
b.append(box(380,14,760,64,'v','Global control plane · routing metadata, config, aggregates',['primary in US East · read replicas in every AWS region · China keeps its own copy'],fs=13.5,tfs=15))
b.append(arr('M440 78 V96','#5B3FD9',dash='5 4')+arr('M760 78 V96','#5B3FD9',dash='5 4'))
for zx,name,h,s in [(20,'EU ZONE · AWS · GDPR','Frankfurt','Ireland'),(510,'US ZONE · AWS · CCPA','US East','US West')]:
    b.append(f'<rect x="{zx}" y="100" width="470" height="248" rx="14" fill="#F4F8FF" stroke="#93B4F5" stroke-width="1.6"/>'+hd(zx+18,124,name,'b'))
    b.append(box(zx+18,136,190,156,'b',f'{h} · home',['gateway · ingestion','Kafka · Flink','Temporal · storage','dashboards'],fs=13,tfs=15))
    b.append(box(zx+262,136,190,156,'n',f'{s} · standby',['warm · same stack','replicated topics','checkpoints, history','scales up on failover'],fs=13,tfs=15))
    b.append(arr(f'M{zx+208} 214 H{zx+258}','#15803D','qg',dash='5 4'))
    b.append(lab(zx+18,318,'replicated: Kafka topics · Flink checkpoints · Temporal history','#15803D',12.5,600))
    b.append(lab(zx+18,338,'Redis is rebuilt from the log after a failover','#56667C',12.5,400))
b.append('<rect x="1000" y="100" width="500" height="248" rx="14" fill="#FEF2F2" stroke="#FCA5A5" stroke-width="1.6" stroke-dasharray="7 5"/>'+hd(1018,124,'CHINA · ALIBABA CLOUD · PIPL','r'))
b.append(box(1018,136,464,44,'r',None,[])+lab(1032,164,'own control plane copy · nothing replicates out','#DC2626',13.5,700))
b.append(box(1018,192,220,100,'b','Shanghai · home',['full stack, in China'],fs=13,tfs=15))
b.append(box(1262,192,220,100,'n','Beijing · standby',['DR stays in China'],fs=13,tfs=15))
b.append(arr('M1238 242 H1258','#15803D','qg',dash='5 4'))
b.append(lab(1018,318,'deployed from the same Git repo, run separately','#56667C',12.5,400))
b.append(box(20,362,1480,50,'n',None,[])+hd(38,384,'SITES CONNECT TO THEIR HOME CELL','n')+lab(38,404,"registry + DNS route each tenant's gateways · e.g. Acme → Frankfurt, Beta → US East · telemetry, state, incidents and tickets stay in the zone",'#33465C',13,400))
OUT['REG']=svg(1520,420,''.join(b))
# ---------- STORAGE level 1 ----------
b=[]
b.append(box(20,150,170,100,'v','Flink',['writes in parallel'],fs=13,tfs=16))
st=[('redis','Redis','g','LIVE · now','latest state · counts · pub/sub',20),('chhot','ClickHouse hot','b','7 DAYS','raw telemetry',112),('chwarm','ClickHouse warm','b','6 MONTHS','1-hour rollups',204),('s3','S3 cold','n','ARCHIVE','export verified before expiry',296)]
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
b=[code(20,10,700,["CREATE TABLE telemetry_raw (","  tenant_id  LowCardinality(String),","  device_id  String,","  event_id   String,   -- device + boot ID + sequence","  metric     LowCardinality(String),","  ts         DateTime64(3),","  value      Float64",") ENGINE = ReplacingMergeTree","PARTITION BY toYYYYMMDD(ts)","ORDER BY (tenant_id, device_id, metric, ts, event_id)","TTL ts + INTERVAL 7 DAY      -- export before expiry"],'EXAMPLE SCHEMA · CLICKHOUSE HOT'),
   table(20,350,['tenant_id','device_id','metric','ts','value'],[['acme','TH-05','temp_c','10:42:00','22.4'],['acme','TH-05','temp_c','10:43:00','22.6'],['acme','TH-05','temp_c','10:44:00','22.5'],['beta','SNS-07','lat_ms','10:42:00','160']],700,hl={0,1,2}),
   f'<rect x="750" y="10" width="760" height="196" rx="12" fill="#F4F8FF" stroke="#93B4F5"/>'+hd(768,38,'HOW THE INDEX WORKS','b'),
   lab(768,64,'Sorted on disk by (tenant, device, metric, time).',fs=14.5,c='#24364E',wgt=400),lab(768,88,'A sparse primary index keeps one entry per 8,192 rows.',fs=14.5,c='#24364E',wgt=400),
   lab(768,112,'"TH-05, last hour" → jumps straight to a few blocks;',fs=14.5,c='#24364E',wgt=400),lab(768,136,'no full scan, even with billions of rows.',fs=14.5,c='#24364E',wgt=400),
   lab(768,160,'Stable event_id: use FINAL (or dedup on read) before merge.',fs=14.5,c='#24364E',wgt=400),
   lab(768,186,'Daily partitions make the 7-day TTL a cheap drop.',fs=14.5,c='#1D4ED8',wgt=700),
   chart(750,214,760,236,raw,21.5,23.3,'#F08A1C',title='TH-05 · temp_c · last 40 min (raw points)')]
D['chhot']=('ClickHouse hot · raw telemetry, 7 days',svg(1520,510,''.join(b)))
b=[code(20,10,700,["CREATE TABLE telemetry_1h (","  tenant_id  LowCardinality(String),","  device_id  String,","  metric     LowCardinality(String),","  hour       DateTime,","  min Float64, max Float64,","  avg Float64, cnt UInt32,","  version    UInt64",") ENGINE = ReplacingMergeTree(version)","ORDER BY (tenant_id, device_id, metric, hour)","TTL hour + INTERVAL 6 MONTH  -- export before expiry"],'EXAMPLE SCHEMA · CLICKHOUSE WARM'),
   table(20,370,['device_id','hour','min','max','avg'],[['TH-05','09:00','21.9','23.1','22.4'],['TH-05','10:00','22.0','23.4','22.6'],['TH-05','11:00','21.8','23.0','22.3']],700),
   f'<rect x="750" y="10" width="760" height="190" rx="12" fill="#F4F8FF" stroke="#93B4F5"/>'+hd(768,38,'WHY THIS SHAPE','b'),
   lab(768,64,'Flink computes each hour once and writes it here.',fs=14.5,c='#24364E',wgt=400),lab(768,88,'Duplicates collapse at background merge; dashboard queries',fs=14.5,c='#24364E',wgt=400),
   lab(768,112,'use FINAL (or argMax by version), so a delayed older',fs=14.5,c='#24364E',wgt=400),lab(768,136,'aggregate never overrides a newer one.',fs=14.5,c='#24364E',wgt=400),lab(768,172,'6 months × 24 rows/day per metric — tiny vs raw.',fs=14.5,c='#1D4ED8',wgt=700),
   chart(750,214,760,236,avg,20.5,24.5,'#2563EB',band=hourly,title='TH-05 · temp_c · last 24 h (avg with min–max band)')]
D['chwarm']=('ClickHouse warm · hourly rollups, 6 months',svg(1520,510,''.join(b)))
b=[hd(20,30,'EXAMPLE KEYS · REDIS','g'),
   table(20,44,['key','type','value'],[['dev:{acme:site-07}:CAM-14','HASH','status=ONLINE  last_seen=10:42:07'],['dev:{acme:site-07}:TH-05','HASH','status=ONLINE  temp=22.4'],['cnt:{acme:site-07}','HASH','online=47  degraded=1  down=0'],['cnt:acme','HASH','async tenant rollup; reconciled'],['live:acme','PUB/SUB','channel → dashboard service']],900,hl={4}),
   f'<rect x="950" y="30" width="560" height="200" rx="12" fill="#ECFDF3" stroke="#86EFAC"/>'+hd(968,58,'HOW IT IS USED','g'),
   lab(968,86,'Lua: newer device state + site counts, one slot.',fs=14.5,c='#24364E',wgt=400),lab(968,110,'Site tags spread load; a tenant-wide tag is hot.',fs=14.5,c='#24364E',wgt=400),
   lab(968,134,'Tenant totals: async rollup + reconciliation.',fs=14.5,c='#24364E',wgt=400),lab(968,170,'A rebuildable cache, not the source of truth:',fs=14.5,c='#15803D',wgt=700),lab(968,194,'snapshot + applied cursor + subsequent updates.',fs=14.5,c='#15803D',wgt=700),
   f'<rect x="20" y="250" width="1490" height="150" rx="12" fill="#fff" stroke="#C9D5E5"/>'+hd(38,278,'ONE UPDATE, MANY VIEWERS','t')]
for i,t in enumerate(['Flink: CAM-14 → DEAD','Lua: state + site counts','PUBLISH live:acme','dashboard service','30 open pages update']):
    x=38+i*296; b.append(f'<rect x="{x}" y="290" width="270" height="68" rx="10" fill="#F0FDFA" stroke="#99F6E4"/>'+lab(x+14,329,t,'#0F766E',13.5,700))
    if i<4: b.append(arr(f'M{x+270} 324 H{x+294}','#16A34A','qg'))
b.append(lab(38,384,"E.g. dev:{acme:site-07}:CAM-14 + cnt:{acme:site-07} share a slot; tenant totals are eventually consistent.",fs=14,c='#0F766E',wgt=600))
D['redis']=('Redis · live state and counts',svg(1520,410,''.join(b)))
b=[code(20,10,620,['{','  "_id": "CAM-14",','  "tenant_id": "acme",','  "site_id": "site-07",','  "type": "camera",','  "firmware": "4.2.1",','  "location": "Aisle 4",','  "created": "2025-03-14"','}'],'EXAMPLE DOCUMENT · devices'),
   code(20,270,620,['{ "tenant_id": "beta",','  "device_type": "camera",','  "silent_min": 15, "dead_min": 30 }'],'EXAMPLE DOCUMENT · rule_overrides'),
   f'<rect x="680" y="10" width="830" height="230" rx="12" fill="#F6F3FF" stroke="#C4B5FD"/>'+hd(698,38,'INDEXES (EXAMPLE)','v')]
for i,(ix,why) in enumerate([('{ _id }','device lookup by id (unique)'),('{ tenant_id: 1, site_id: 1 }','"all devices of a site" for dashboards'),('{ tenant_id: 1, type: 1 }','rule targeting + firmware rollouts'),('{ tenant_id: 1, device_type: 1 } on rule_overrides','Flink loads overrides per tenant')]):
    y=58+i*44; b.append(f'<rect x="698" y="{y}" width="794" height="36" rx="8" fill="#fff" stroke="#C4B5FD"/><text x="712" y="{y+24}" font-size="13.5" fill="#3B2A8C" font-family="IBM Plex Mono,Consolas,monospace">{e(ix)}</text>'+lab(1480,y+24,why,'#56667C',13,400,'end'))
b.append(f'<rect x="680" y="260" width="830" height="130" rx="12" fill="#fff" stroke="#C9D5E5"/>'+hd(698,288,'WHY A DOCUMENT STORE HERE','n'))
for i,t in enumerate(['Low-volume, config-shaped data that changes rarely.','Device types differ in fields — documents fit naturally.','Every query starts with tenant_id → tenant isolation by design.']): b.append(lab(698,316+i*24,t,fs=14.5,c='#24364E',wgt=400))
D['mongo']=('MongoDB · registry, configs, rules',svg(1520,400,''.join(b)))
b=[hd(20,30,'EXAMPLE LAYOUT · S3 COLD ARCHIVE','n'),
   code(20,44,760,['s3://iot-archive/','  dt=2026-10-26/','    tenant=acme/  part-0001.parquet','    tenant=beta/  part-0001.parquet','  dt=2026-10-27/ …'],None),
   f'<rect x="820" y="20" width="690" height="220" rx="12" fill="#F6F8FB" stroke="#B9C6D8"/>'+hd(838,48,'WHAT GOES HERE','n')]
for i,t in enumerate(['Sampled telemetry exported before 7-day expiry','Rollups exported before 6-month expiry','Columnar files, partitioned by date and tenant','Lifecycle rules move old data to cheaper storage','Export Parquet and verify it before deletion','Delay expiry if export falls behind (example policy)']): b.append(lab(838,78+i*26,'• '+t,fs=14.5,c='#24364E',wgt=400))
b.append(f'<rect x="20" y="240" width="1490" height="130" rx="12" fill="#fff" stroke="#C9D5E5"/>'+hd(38,268,'NOT ON THE READ PATH','n'))
for i,t in enumerate(['Dashboards never read S3. It is for audits, long-term analysis and reprocessing.','Sampled archives support bounded analysis, not full-fidelity raw replay.']): b.append(lab(38,298+i*26,t,fs=14.5,c='#24364E',wgt=400))
D['s3']=('S3 cold · sampled archive',svg(1520,380,''.join(b)))
OUT_D=D

# ================= Kubernetes platform + multi-region edge path =================
XD={}
def pod(x,y,t,c='b',w=78):
    fg,bg,bd=P[c]; return f'<rect x="{x}" y="{y}" width="{w}" height="34" rx="8" fill="#fff" stroke="{bd}" stroke-width="1.5"/>'+lab(x+w/2,y+22,t,fg,12,700,'middle')
# ---------- K8S: one EKS cluster per region ----------
b=[f'<rect x="20" y="14" width="1080" height="532" rx="16" fill="#F4F8FF" stroke="#93B4F5" stroke-width="1.6"/>'+hd(40,42,'EKS CLUSTER · ONE PER REGION · NODES SPREAD OVER 3 AZs','b')]
for i,az in enumerate(['AZ-a','AZ-b','AZ-c']):
    x=250+i*282; b.append(f'<rect x="{x}" y="56" width="268" height="476" rx="12" fill="#fff" fill-opacity=".55" stroke="#C7D7F5" stroke-dasharray="6 5"/>'+lab(x+134,76,az,'#1D4ED8',13,800,'middle'))
pools=[('Stateless pool','Deployments · HPA / KEDA','b',[('gateway','b'),('ingest','b'),('dash','b')]),
       ('Kafka pool','Strimzi · StatefulSet + disks','o',[('broker','o')]),
       ('Flink pool','Flink Operator','v',[('TM','v'),('TM','v')]),
       ('System pool','add-ons · DaemonSets','n',[('argo','n'),('keda','n'),('dd-agent','n')])]
for r,(name,sub,c,pods) in enumerate(pools):
    y=92+r*110; fg,bg,bd=P[c]
    b.append(f'<rect x="36" y="{y}" width="1048" height="96" rx="12" fill="{bg}" fill-opacity=".55" stroke="{bd}" stroke-width="1.4"/>'+lab(52,y+38,name,fg,15,800)+lab(52,y+60,sub,'#33465C',12.5,500))
    for i in range(3):
        x=250+i*282+10
        if name=='Kafka pool': b.append(pod(x,y+30,f'broker-{i}','o',120)+lab(x+130,y+52,'+ EBS volume','#B45309',11.5,600))
        elif name=='Flink pool': b.append(pod(x,y+30,'JobManager' if i==0 else 'TaskMgr','v',110)+pod(x+120,y+30,'TaskMgr','v',110))
        else:
            for k,(t,cc) in enumerate(pods): b.append(pod(x+k*84,y+30,t,cc))
b.append(box(1120,14,380,300,'n','Control loops',['HPA','  CPU → more gateway pods','KEDA','  Kafka lag → more consumers','Karpenter','  pending pods → new nodes','PDB · at most 1 broker down','Argo CD · Git → cluster'],fs=15,tfs=17))
b.append(box(1120,330,380,216,'g','Guardrails',['Requests + limits on every pod','Anti-affinity: replicas in different AZs','NetworkPolicies: deny by default','IRSA: one IAM role per service','Liveness + readiness probes'],fs=14,tfs=16))
OUT['K8S']=svg(1520,560,''.join(b))
# ---------- scaling chain ----------
b=[hd(20,30,'A TRAFFIC SPIKE · THREE CONTROL LOOPS, IN ORDER','b')]
steps=[('o','Kafka lag rises','consumer group behind','e.g. > 50K msgs'),('b','KEDA','reads the lag metric','scales consumer pods'),('b','HPA','reads pod CPU','scales gateway + ingest'),('n','Pods pending','no room on','current nodes'),('g','Karpenter','launches right-sized','nodes in ~1–2 min'),('g','Pods run','lag drains','then scale down slowly')]
for i,(c,t,a,bb) in enumerate(steps):
    x=20+i*250; b.append(box(x,48,224,124,c,t,[a,bb],fs=13.5,tfs=16))
    if i<5: b.append(arr(f'M{x+224} 110 H{x+246}'))
b.append(box(20,196,730,150,'v','Flink scales differently',['Parallelism change = savepoint → restart with more TaskManagers','Source readers ≤ Kafka partitions: partitions set the ceiling','Flink Operator (or its autoscaler) runs that restart for us'],fs=14,tfs=16))
b.append(box(770,196,730,150,'o','Guard the edges',['Max replicas + per-tenant quotas cap the cost of a bad spike','Scale-down cooldown so pods do not flap','Keep headroom: Karpenter needs minutes, a spike needs seconds'],fs=14,tfs=16))
XD['scale']=('Scaling on Kubernetes · three loops',svg(1520,360,''.join(b)))
# ---------- stateful on Kubernetes: operators ----------
b=[f'<rect x="20" y="14" width="730" height="420" rx="16" fill="#FFF7ED" stroke="#FDBA74" stroke-width="1.6"/>'+hd(40,42,'KAFKA · STRIMZI OPERATOR','o')]
b.append(box(40,58,220,96,'o','Kafka resource',['YAML in Git:','brokers, topics, users'],fs=13,tfs=15))
b.append(arr('M260 106 H300'))
b.append(box(306,58,200,96,'o','Strimzi',['watches it,','makes it so'],fs=13,tfs=15))
b.append(arr('M506 106 H546'))
b.append(box(552,58,180,96,'o','StatefulSet',['stable names','broker-0, 1, 2'],fs=13,tfs=15))
for i in range(3):
    x=40+i*232; b.append(pod(x,182,f'broker-{i} · AZ-{"abc"[i]}','o',212)+cyl(x+40,226,132,70,'o','disk',f'PVC {i}'))
b.append(lab(40,330,'Rack-aware: each partition has replicas in 3 AZs',fs=14,c='#9A4A0C',wgt=700))
b.append(lab(40,356,'Rolling restart: one broker at a time; the next starts',fs=14,c='#24364E',wgt=400)+lab(40,378,'only when every partition is fully in sync again',fs=14,c='#24364E',wgt=400))
b.append(lab(40,412,'PDB: max 1 broker unavailable · node drains wait for it',fs=14,c='#B45309',wgt=700))
b.append(f'<rect x="770" y="14" width="730" height="420" rx="16" fill="#F6F3FF" stroke="#C4B5FD" stroke-width="1.6"/>'+hd(790,42,'FLINK · FLINK KUBERNETES OPERATOR','v'))
b.append(box(790,58,220,96,'v','FlinkDeployment',['job jar, version,','parallelism'],fs=13,tfs=15))
b.append(arr('M1010 106 H1050'))
b.append(box(1056,58,200,96,'v','Operator',['deploys, upgrades,','rescales'],fs=13,tfs=15))
b.append(arr('M1156 154 V180'))
b.append(pod(790,186,'JobManager · HA (leader + standby)','v',330)+pod(1140,186,'TaskManager ×N','v',340))
b.append(cyl(1000,240,280,74,'n','S3','checkpoints + savepoints'))
b.append(arr('M1250 220 V244','#7A8BA0')+arr('M955 220 V277 H996','#7A8BA0'))
b.append(lab(790,344,'Upgrade = savepoint → new version → restore state',fs=14,c='#3B2A8C',wgt=700))
b.append(lab(790,370,'Pod dies → restart from the last checkpoint in S3',fs=14,c='#24364E',wgt=400))
b.append(lab(790,396,'State lives in S3, not on the pod: pods stay replaceable',fs=14,c='#24364E',wgt=400))
XD['ops']=('Stateful on Kubernetes · operators',svg(1520,450,''.join(b)))
# ---------- EKS vs ECS ----------
b=[f'<rect x="20" y="14" width="1480" height="40" rx="10" fill="#0B1F3F"/>'+lab(40,40,'QUESTION',  '#FFD23F',13,800)+lab(150,40,'EKS (chosen)','#fff',15,800)+lab(830,40,'ECS (rejected)','#fff',15,800)]
rows=[('Kafka + Flink','Operators run them: Strimzi, Flink Operator','No operators: we would build failover and upgrades'),
      ('Scaling','HPA + KEDA on Kafka lag · Karpenter nodes','Service auto scaling on CloudWatch metrics'),
      ('Portability','Same manifests in every region, beyond AWS','AWS-only APIs and task definitions'),
      ('Who runs it','We run upgrades and add-ons','AWS runs the control plane: less to operate'),
      ('Team skills','Kubernetes skills needed','Simpler to learn')]
for i,(q,a,c) in enumerate(rows):
    y=62+i*58; fill='#fff' if i%2==0 else '#F6F8FB'
    b.append(f'<rect x="20" y="{y}" width="1480" height="52" rx="8" fill="{fill}" stroke="#E3E9F1"/>'+lab(40,y+32,q,'#0B1F3F',15,800)+lab(150,y+32,a,'#15803D' if i<3 else '#B45309',15,600)+lab(830,y+32,c,'#B45309' if i<3 else '#15803D',15,600))
b.append(box(20,360,730,96,'g','Why EKS won',['One platform for stateful + stateless, run by operators,','the same in every region.'],fs=14.5,tfs=16))
b.append(box(770,360,730,96,'o','When ECS is the right call',['A few stateless services, a small team, AWS only:','ECS + Fargate is simpler. Not our workload.'],fs=14.5,tfs=16))
XD['ecs']=('EKS vs ECS · the decision',svg(1520,470,''.join(b)))
# ---------- multi-region edge path ----------
b=[f'<rect x="20" y="14" width="330" height="420" rx="16" fill="#F0FDFA" stroke="#99F6E4" stroke-width="1.6"/>'+hd(40,42,'ACME SITE · HOME = Frankfurt','t')]
b.append(box(40,58,290,64,'n','Devices → Filtering',['allow-list · quotas'],fs=13,tfs=15))
b.append(arr('M185 122 V142'))
b.append(box(40,146,290,150,'t','Edge pair',['cert: acme · site-07 · EU','endpoints, in order:','1. Frankfurt (home)','2. Ireland (same-zone standby)'],fs=13,tfs=15))
b.append(box(40,312,290,104,'o','Region unreachable?',['spool to disk, keep retrying','switch only when told'],fs=13,tfs=15))
b.append(box(380,150,240,150,'v','DNS · tenant-pinned',['acme.eu.ingest…','→ Frankfurt today','never "nearest region"'],fs=13,tfs=15))
b.append(arr('M330 220 H376','#1D4ED8'))
for k,(x,name,c,st) in enumerate([(650,'Frankfurt · home','b','serving'),(1080,'Ireland · standby','n','warm')]):
    fg,bg,bd=P[c]
    b.append(f'<rect x="{x}" y="14" width="410" height="420" rx="16" fill="{bg}" stroke="{bd}" stroke-width="1.6"/>'+hd(x+18,42,name.upper()+' · '+st.upper(),c))
    b.append(box(x+18,58,374,84,c,'Cloud Gateway',['mTLS · trusts the EU issuing CA','admits EU-homed tenants only'],fs=13,tfs=15))
    b.append(arr(f'M{x+205} 142 V158'))
    b.append(box(x+18,162,374,64,c,'Load balancer · 3 AZs',[ 'health-checked ingest pods'],fs=13,tfs=15))
    b.append(arr(f'M{x+205} 226 V242'))
    b.append(box(x+18,246,374,64,c,'Ingestion pool',['validate · tag · publish'],fs=13,tfs=15))
    b.append(arr(f'M{x+205} 310 V326'))
    b.append(box(x+18,330,374,84,c,'Kafka',['keyed tenant + device'] + (['→ replicated to Ireland'] if k==0 else ['replica of Frankfurt topics']),fs=13,tfs=15))
b.append(arr('M620 200 H646','#1D4ED8')+arr('M620 260 H636 V448 H1286 V438','#7A8BA0',dash='6 5')+lab(660,462,'failover: DNS + endpoint list move Acme to Ireland · same certs, same tenant identity','#56667C',13,600))
b.append(arr('M1060 372 H1094','#15803D','qg',dash='5 4'))
b.append(box(20,484,600,90,'r','Wrong region? Refused, not stored',['A US tenant\'s gateway reaching Frankfurt is refused at the','gateway and pointed at its home endpoint.'],fs=13.5,tfs=15))
b.append(box(650,484,850,90,'v','PKI per region',['One offline root CA; an issuing CA per region. The cert carries tenant +','region, so a gateway can verify the home region without a cross-region call.'],fs=13.5,tfs=15))
XD['edgepath']=('Multi-region · edge to ingestion',svg(1520,590,''.join(b)))
OUT_XD=XD
