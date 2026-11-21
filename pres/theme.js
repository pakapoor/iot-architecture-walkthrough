// Dark theme for the generated pages (flow pages and the HLD). Loaded first, in <head>.
// The theme is "dark" unless the shell's toggle stored "light" (localStorage 'iot-theme', or ?theme=light|dark).
// Instead of a second hand-written palette, every colour keeps its hue and has its lightness mirrored:
// white cards become navy, navy text becomes soft light, accents (blue, green, red, amber) stay recognisable.
// Stylesheets are remapped rule by rule (so class changes keep working); inline styles and SVG colour attributes
// are remapped when they appear or change, which also covers colours the engine writes every frame.
(function () {
  let theme = 'dark';
  try { theme = localStorage.getItem('iot-theme') || 'dark'; } catch (_) {}
  const q = new URLSearchParams(location.search).get('theme'); if (q === 'light' || q === 'dark') theme = q;
  window.THEME = theme;
  if (theme !== 'dark') return;
  document.documentElement.classList.add('dark');
  const base = document.createElement('style');   // avoid a white flash before the full pass runs
  base.textContent = 'html,body{background:#0E1626!important;color-scheme:dark}img{mix-blend-mode:screen!important;filter:invert(1) hue-rotate(180deg) brightness(1.05)}';
  document.head.appendChild(base);

  // ---------- colour mapping ----------
  const OUT = new Set(), CACHE = new Map();
  function hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l]; }
  function rgb(h, s, l) { const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [f(0), f(8), f(4)].map(v => Math.round(v * 255)); }
  function mapRGB(r, g, b) {
    let [h, s, l] = hsl(r, g, b); let L = 0.10 + 0.80 * (1 - l), S = s;
    if (s < 0.08) { h = 220; S = 0.30; }               // neutral white/grey → navy, neutral dark → soft light
    if (L > 0.68) S = Math.min(S, 0.35);                // light text: no neon
    if (L < 0.25) S = Math.min(S, 0.45);                // dark surfaces: muted tints
    return rgb(h, S, L);
  }
  function parse(c) {
    let m = /^#([0-9a-f]{3,8})$/i.exec(c);
    if (m) { let x = m[1]; if (x.length <= 4) x = [...x].map(ch => ch + ch).join('');
      return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16), x.length === 8 ? parseInt(x.slice(6, 8), 16) / 255 : 1]; }
    m = /^rgba?\(([^)]+)\)$/i.exec(c);
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    if (/^white$/i.test(c)) return [255, 255, 255, 1]; if (/^black$/i.test(c)) return [0, 0, 0, 1];
    return null;
  }
  function mapColor(c, minAlpha) {
    const key = c + '|' + minAlpha; if (CACHE.has(key)) return CACHE.get(key);
    let out = c; const p = parse(c.trim());
    if (p && !OUT.has(c.trim().toLowerCase()) && p[3] >= minAlpha) {
      const [r, g, b] = mapRGB(p[0], p[1], p[2]);
      out = p[3] < 1 ? `rgba(${r}, ${g}, ${b}, ${p[3]})` : `rgb(${r}, ${g}, ${b})`;
      OUT.add(out.toLowerCase());
    }
    CACHE.set(key, out); return out;
  }
  const COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black)\b/gi;
  // shadows: only opaque colours are remapped (e.g. the white spacer of stacked cards); soft dark shadows stay dark
  const mapValue = (prop, v) => (!v || !/#|rgb|white|black/i.test(v)) ? v : v.replace(COLOR_RE, c => mapColor(c, /shadow/.test(prop) ? 1 : 0));

  function mapDecl(st) {
    for (let i = 0; i < st.length; i++) { const p = st[i], v = st.getPropertyValue(p), m = mapValue(p, v);
      if (m !== v) st.setProperty(p, m, st.getPropertyPriority(p)); }
  }
  const SHEETS = new WeakSet([base.sheet]);   // the base style is already dark: never remap it
  function mapSheet(sheet) {
    if (!sheet || SHEETS.has(sheet)) return; SHEETS.add(sheet);
    let rules; try { rules = sheet.cssRules; } catch (_) { return; }
    const walk = list => { for (const r of list) { if (r.style) mapDecl(r.style); if (r.cssRules) walk(r.cssRules); } };
    walk(rules);
  }
  const LAST = new WeakMap(), ATTRS = ['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'];
  function mapEl(el) {
    if (el.nodeType !== 1) return;
    if (el.tagName === 'STYLE' || el.tagName === 'LINK') { mapSheet(el.sheet); return; }
    const rec = LAST.get(el) || {};
    if (el.style && el.style.length && el.getAttribute('style') !== rec.style) { mapDecl(el.style); rec.style = el.getAttribute('style'); }
    for (const a of ATTRS) { const v = el.getAttribute(a); if (v && v !== rec[a]) { const m = mapValue(a, v); if (m !== v) el.setAttribute(a, m); rec[a] = el.getAttribute(a); } }
    LAST.set(el, rec);
  }
  const mapTree = root => { mapEl(root); if (root.querySelectorAll) root.querySelectorAll('*').forEach(mapEl); };

  function start() {
    for (const s of document.styleSheets) mapSheet(s);
    mapTree(document.documentElement);
    new MutationObserver(list => { for (const m of list) {
      if (m.type === 'childList') m.addedNodes.forEach(n => mapTree(n));
      else mapEl(m.target);
    } }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', ...ATTRS] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  window.THEME_MAP = mapColor;
})();
