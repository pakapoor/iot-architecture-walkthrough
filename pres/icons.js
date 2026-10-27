/* SVG line icons that replace emoji at runtime: crisp at any zoom, consistent stroke, theme-aware (currentColor). */
(function(){
const P={
 alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
 siren:'<path d="M7 18v-6a5 5 0 0 1 10 0v6"/><path d="M5 21h14v-3H5z"/><path d="M12 2v2M4.2 5.2l1.4 1.4M19.8 5.2l-1.4 1.4M2 12h2M20 12h2"/>',
 bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
 megaphone:'<path d="m3 11 15-6v14L3 13z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
 check:'<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 hourglass:'<path d="M5 22h14M5 2h14"/><path d="M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22"/><path d="M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
 chart:'<path d="M3 3v18h18"/><path d="M8 17v-5M13 17V8M18 17v-9"/>',
 trend:'<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
 zap:'<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
 building:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
 repeat:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
 refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
 wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
 cpu:'<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
 radio:'<path d="M4.9 19.1a10 10 0 0 1 0-14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M19.1 4.9a10 10 0 0 1 0 14.2"/><circle cx="12" cy="12" r="2"/>',
 db:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
 lock:'<rect x="4" y="11" width="16" height="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>',
 coins:'<circle cx="12" cy="12" r="10"/><path d="M15.5 8.5A3 3 0 0 0 12.8 7H11a2.5 2.5 0 0 0 0 5h2a2.5 2.5 0 0 1 0 5h-2a3 3 0 0 1-2.6-1.5M12 5v2M12 17v2"/>',
 buoy:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.9 4.9 4.3 4.3M14.8 14.8l4.3 4.3M14.8 9.2l4.3-4.3M14.8 9.2l3.6-3.6M4.9 19.1l4.3-4.3"/>',
 rocket:'<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1"/><path d="m12 15-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
 phone:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>',
 monitor:'<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
 laptop:'<rect x="4" y="4" width="16" height="11" rx="2"/><path d="M2 20h20"/>',
 mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
 camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
 search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/>',
 flask:'<path d="M9 2v7.3L4.2 18a2 2 0 0 0 1.8 3h12a2 2 0 0 0 1.8-3L15 9.3V2"/><path d="M8 2h8M7 15h10"/>',
 ticket:'<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
 tag:'<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1"/>',
 branch:'<circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 9v6M18 9a9 9 0 0 1-9 9"/>',
 box:'<path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
 blocks:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
 folder:'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9l-.8-1.2A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
 inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1"/>',
 pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
 moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/>',
 bot:'<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8V4H8M2 14h1M21 14h1M9 13v2M15 13v2"/>',
 gauge:'<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
 target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
 flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.3 1.6 1.3 2.8 2.5 2.8"/>',
 pulse:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
 thermo:'<path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 doc:'<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v5h6M8 13h8M8 17h8M8 9h2"/>',
 ban:'<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
 globe:'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
 flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
 rewind:'<path d="m11 19-9-7 9-7zM22 19l-9-7 9-7z"/>',
 traffic:'<rect x="7" y="2" width="10" height="20" rx="3"/><circle cx="12" cy="7" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="17" r="1.5"/>',
 link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.8 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
 waves:'<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1"/>',
 down:'<path d="M12 5v14M19 12l-7 7-7-7"/>',
 up:'<path d="M12 19V5M5 12l7-7 7 7"/>',
 home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 puzzle:'<path d="M19.4 14.5a2.5 2.5 0 1 0 0-5H18V6a2 2 0 0 0-2-2h-3.5v1.4a2.5 2.5 0 1 1-5 0V4H4a2 2 0 0 0-2 2v3.5h1.4a2.5 2.5 0 1 1 0 5H2V18a2 2 0 0 0 2 2h3.5v-1.4a2.5 2.5 0 1 1 5 0V20H16a2 2 0 0 0 2-2v-3.5z"/>',
 crown:'<path d="m2 7 5 5 5-8 5 8 5-5-2 12H4z"/>',
 dumbbell:'<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',
 bird:'<path d="M16 7h.01"/><path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.3-2.3L2 20"/><path d="m20 7 2 .5-2 .5M10 18v3M14 17.8V21"/>',
 dot:'<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>'
};
const M={'🚨':'siren','🔴':['dot','#DC2626'],'🟢':['dot','#16A34A'],'🟡':['dot','#D97706'],'⚠':'alert','🔥':'flame','💥':'zap','🚩':'flag','⚑':'flag','🔔':'bell','📣':'megaphone',
 '✅':['check','#16A34A'],'⏱':'clock','⏰':'clock','⏳':'hourglass','⌛':'hourglass','📊':'chart','📈':'trend','⚡':'zap','🏢':'building',
 '🔁':'repeat','🔄':'refresh','♻':'refresh','⚙':'gear','🔧':'wrench','🧯':'buoy','🧠':'cpu','📡':'radio','🗄':'db','💾':'db','🔐':'lock','🛡':'shield',
 '💰':'coins','🛟':'buoy','🚀':'rocket','📟':'phone','🖥':'monitor','💻':'laptop','📧':'mail','✉':'mail','📷':'camera','🔍':'search','🔭':'search','👀':'eye',
 '🧪':'flask','🧫':'flask','🎫':'ticket','🏷':'tag','🔀':'branch','📦':'box','🧱':'blocks','🧩':'puzzle','🗂':'folder','📥':'inbox','⏸':'pause','💤':'moon','😴':'moon',
 '🤖':'bot','🐢':'gauge','🎯':'target','💓':'pulse','🩺':'pulse','🌡':'thermo','👩':'user','🧑':'user','👤':'user','👣':'pulse','👑':'crown','📜':'doc','📝':'doc',
 '🚫':'ban','🌐':'globe','🏋':'dumbbell','🐤':'bird','➕':'plus','✂':'scissors','⏪':'rewind','🚦':'traffic','🔗':'link','🌊':'waves','⬇':'down','⬆':'up','⌂':'home'};
const RX=/(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}])️?/gu;
const KEEP=new Set(['✓','✕','✗','✔','⏎']);
function def(ch){const k=ch.replace(/️/g,'');return M[k];}
function svgStr(ch,sz){const d=def(ch);if(!d)return '';const [n,c]=Array.isArray(d)?d:[d,null];
 return `<svg class="emi" viewBox="0 0 24 24" width="${sz||'1em'}" height="${sz||'1em'}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${c?` style="color:${c}"`:''} aria-hidden="true">${P[n]}</svg>`;}
const NS='http://www.w3.org/2000/svg';
function tint(svg){const ic=svg.closest('.ic');if(!ic||svg.style.color)return;
 const box=ic.closest('.box,.card,.node,.cu,.st,[class*=card]')||ic.parentElement; const cs=getComputedStyle(box);
 let c=cs.borderTopColor; if(!c||/rgba?\(0, 0, 0, 0\)|rgb\(2[0-9]{2}, 2[0-9]{2}, 2[0-9]{2}\)/.test(c)) c=getComputedStyle(ic).color; svg.style.color=c;}
function doText(tn){
 const s=tn.nodeValue; RX.lastIndex=0; if(!RX.test(s))return; RX.lastIndex=0;
 const par=tn.parentNode; if(!par)return;
 if(par.namespaceURI===NS){ // inside SVG <text>/<tspan>
  const lone=s.replace(RX,'').trim()==='';
  const m=s.match(RX); const txt=par.closest('text')||par;
  if(lone&&m&&def(m[0])&&txt.tagName==='text'){
   const fs=parseFloat(txt.getAttribute('font-size')||getComputedStyle(txt).fontSize)||16;
   const x=parseFloat(txt.getAttribute('x')||0),y=parseFloat(txt.getAttribute('y')||0);
   const anc=txt.getAttribute('text-anchor')||getComputedStyle(txt).textAnchor;
   const g=document.createElementNS(NS,'svg'); const z=fs*1.05;
   g.setAttribute('x',anc==='middle'?x-z/2:(anc==='end'?x-z:x)); g.setAttribute('y',y-z*0.85);
   g.setAttribute('width',z);g.setAttribute('height',z);g.setAttribute('viewBox','0 0 24 24');g.setAttribute('fill','none');
   g.setAttribute('stroke',txt.getAttribute('fill')&&txt.getAttribute('fill')!=='none'?txt.getAttribute('fill'):'currentColor');
   g.setAttribute('stroke-width','2');g.setAttribute('stroke-linecap','round');g.setAttribute('stroke-linejoin','round');g.setAttribute('class','emi');
   const d=def(m[0]); const n=Array.isArray(d)?d[0]:d; g.innerHTML=P[n];
   if(Array.isArray(d)) g.setAttribute('stroke',d[1]);
   txt.parentNode.insertBefore(g,txt); txt.remove(); return;
  }
  tn.nodeValue=s.replace(RX,m=>KEEP.has(m)?m:'').replace(/^\s+/,''); return;
 }
 if(par.closest&&par.closest('script,style,textarea,.noemi'))return;
 const frag=document.createDocumentFragment(); let last=0; RX.lastIndex=0; let m, changed=false;
 while((m=RX.exec(s))){ if(KEEP.has(m[0]))continue; const html=svgStr(m[0]);
  frag.appendChild(document.createTextNode(s.slice(last,m.index)));
  if(html){const t=document.createElement('template');t.innerHTML=html;frag.appendChild(t.content.firstChild);}
  else { /* unknown emoji: drop it and one following space */ if(s[m.index+m[0].length]===' ') RX.lastIndex++; }
  last=RX.lastIndex; changed=true; }
 if(!changed)return; frag.appendChild(document.createTextNode(s.slice(last)));
 const svgs=[...frag.querySelectorAll('svg')]; par.replaceChild(frag,tn); svgs.forEach(tint);
}
function iconize(root){ if(!root)return; if(root.nodeType===3){doText(root);return;}
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); const list=[]; let n; while((n=w.nextNode()))list.push(n); list.forEach(doText); }
window.ICONS={P,M,svgStr,iconize};
function start(){ iconize(document.body);
 let q=new Set(),pend=false;
 new MutationObserver(ms=>{ for(const m of ms){ if(m.type==='characterData')q.add(m.target); else m.addedNodes.forEach(x=>q.add(x)); }
  if(!pend){pend=true;queueMicrotask(()=>{pend=false;const a=[...q];q.clear();a.forEach(x=>x.isConnected&&iconize(x));});}
 }).observe(document.body,{childList:true,subtree:true,characterData:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start); else start();
})();
(function(){const st=document.createElement('style');st.textContent='svg.emi{display:inline-block;vertical-align:-.14em;flex:none}.ic svg.emi{width:62%;height:62%;vertical-align:0}';(document.head||document.documentElement).appendChild(st);})();
