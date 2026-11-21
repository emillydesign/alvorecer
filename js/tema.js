/* IAlvorecer · temas de cor
   Script clássico, carregado no <head>: aplica o tema salvo ANTES de a página pintar (sem piscar).
   Expõe window.IATema. O tema fica salvo só neste aparelho (localStorage "ia_tema").
   Morning é o padrão: seus valores moram no :root de css/app.css; aplicar Morning só remove as variáveis inline. */
(function (root) {
  'use strict';
  var KEY = 'ia_tema';
  var HEX = /^#[0-9a-f]{6}$/i;
  var CAMPOS = ['a', 'b', 'c', 'text', 'accent', 'sky'];
  var ORDEM = ['sunrise', 'morning', 'noon', 'afternoon', 'evening', 'night', 'dusk', 'twilight', 'midnight', 'predawn', 'sunset', 'goldenhour'];

  // a, b, c = três cores do degradê do fundo · text = texto · accent/sky = destaques (verde-menta e azul no Morning)
  var PRESETS = {
    sunrise:   { nome: 'Sunrise',   c: { a: '#0e292f', b: '#4f331c', c: '#245060', text: '#f4eee1', accent: '#edb66e', sky: '#8cd0d9' } },
    morning:   { nome: 'Morning',   c: { a: '#0a2b2d', b: '#175244', c: '#1d5b7b', text: '#DCEEE8', accent: '#76B89A', sky: '#82B0C3' } },
    noon:      { nome: 'Noon',      c: { a: '#052742', b: '#0b5260', c: '#186253', text: '#e6f2f4', accent: '#71d6b4', sky: '#7bd6f4' } },
    afternoon: { nome: 'Afternoon', c: { a: '#3a170a', b: '#7a3a0e', c: '#74480f', text: '#f8efe2', accent: '#fbb350', sky: '#f58a62' } },
    evening:   { nome: 'Evening',   c: { a: '#251132', b: '#491f51', c: '#5d2849', text: '#f5eaf5', accent: '#e892c2', sky: '#c7a8e6' } },
    night:     { nome: 'Night',     c: { a: '#140d3a', b: '#2c1f66', c: '#33307f', text: '#ebecfa', accent: '#a094f9', sky: '#9fb4f3' } },
    dusk:      { nome: 'Dusk',      c: { a: '#241238', b: '#53285a', c: '#7a2f62', text: '#f0eaf5', accent: '#ee9ccd', sky: '#f7b3a8' } },
    twilight:  { nome: 'Twilight',  c: { a: '#0e2539', b: '#1f3b5c', c: '#2c3168', text: '#e9f1f7', accent: '#89c1e6', sky: '#efbeca' } },
    midnight:  { nome: 'Midnight',  c: { a: '#03112a', b: '#0c2855', c: '#143f71', text: '#e8f0f7', accent: '#79abec', sky: '#94d4f0' } },
    predawn:    { nome: 'Predawn',     c: { a: '#02040c', b: '#071330', c: '#0d2250', text: '#e6edf9', accent: '#7fa6f0', sky: '#9cc2f5' } },
    sunset:     { nome: 'Sunset',      c: { a: '#2a0508', b: '#6b0f12', c: '#8a2410', text: '#fbeceb', accent: '#ffb27a', sky: '#ff8a6b' } },
    goldenhour: { nome: 'Golden Hour', c: { a: '#2e1c04', b: '#5c4008', c: '#74500f', text: '#fbf3dc', accent: '#ffd25e', sky: '#ffb84a' } }
  };

  var VARS = ['--bg-a', '--bg-b', '--bg-c', '--bg', '--bg2', '--bg-rgb', '--text-rgb', '--modal-rgb', '--text', '--muted', '--dim',
    '--mint', '--violet', '--pink2', '--mint-rgb', '--sky', '--blue', '--sky-rgb', '--blue-rgb'];

  /* ---------- conversões de cor ---------- */
  function hexToRgb(h) { if (typeof h !== 'string' || !HEX.test(h)) return null; var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbToHex(r, g, b) { return '#' + [r, g, b].map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, h = 0, s = 0, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    }
    return [Math.round(h) % 360, Math.round(s * 100), Math.round(l * 100)];
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r, g, b;
    if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; } else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; } else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function rgbToCmyk(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var k = 1 - Math.max(r, g, b);
    if (k >= 1) return [0, 0, 0, 100];
    return [Math.round((1 - r - k) / (1 - k) * 100), Math.round((1 - g - k) / (1 - k) * 100), Math.round((1 - b - k) / (1 - k) * 100), Math.round(k * 100)];
  }
  function cmykToRgb(c, m, y, k) {
    c /= 100; m /= 100; y /= 100; k /= 100;
    return [Math.round(255 * (1 - c) * (1 - k)), Math.round(255 * (1 - m) * (1 - k)), Math.round(255 * (1 - y) * (1 - k))];
  }
  function lum(rgb) {
    var f = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  }
  function contraste(h1, h2) {
    var a = lum(hexToRgb(h1)), b = lum(hexToRgb(h2)), hi = Math.max(a, b), lo = Math.min(a, b);
    return (hi + 0.05) / (lo + 0.05);
  }
  function mix(x, y, t) { return [0, 1, 2].map(function (i) { return Math.round(x[i] * (1 - t) + y[i] * t); }); }
  function skyDe(hex) { var c = rgbToHsl.apply(null, hexToRgb(hex)), r = hslToRgb(c[0] + 30, Math.round(c[1] * 0.9), Math.min(88, c[2] + 5)); return rgbToHex(r[0], r[1], r[2]); }

  /* ---------- validação ---------- */
  function limpar(c) {
    if (!c || typeof c !== 'object') return null;
    var o = {};
    for (var i = 0; i < CAMPOS.length; i++) {
      var k = CAMPOS[i], v = c[k];
      if (typeof v !== 'string' || !HEX.test(v)) { if (k === 'sky') continue; return null; }
      o[k] = v.toLowerCase();
    }
    if (!o.sky) o.sky = skyDe(o.accent);
    return o;
  }

  /* ---------- de 6 cores para todas as variáveis do CSS ---------- */
  function derivar(c) {
    var A = hexToRgb(c.a), B = hexToRgb(c.b), C = hexToRgb(c.c), T = hexToRgb(c.text), M = hexToRgb(c.accent), S = hexToRgb(c.sky);
    var d = {};
    d['--bg-a'] = c.a; d['--bg-b'] = c.b; d['--bg-c'] = c.c;
    d['--bg'] = rgbToHex.apply(null, mix(A, B, 0.2)); d['--bg2'] = rgbToHex.apply(null, mix(A, B, 0.8));
    d['--bg-rgb'] = A.join(','); d['--text-rgb'] = T.join(',');
    d['--modal-rgb'] = mix(A, [0, 0, 0], 0.2).join(',');
    d['--text'] = c.text; d['--muted'] = rgbToHex.apply(null, mix(T, A, 0.22)); d['--dim'] = rgbToHex.apply(null, mix(T, A, 0.42));
    d['--mint'] = c.accent; d['--violet'] = c.accent; d['--pink2'] = c.accent; d['--mint-rgb'] = M.join(',');
    d['--sky'] = c.sky; d['--blue'] = c.sky; d['--sky-rgb'] = S.join(',');
    d['--blue-rgb'] = mix(C, S, 0.45).join(',');
    return d;
  }

  /* legibilidade: texto contra as 3 cores do fundo; destaque contra o fundo */
  function legibilidade(c) {
    var t = Math.min(contraste(c.text, c.a), contraste(c.text, c.b), contraste(c.text, c.c));
    var d = Math.min(contraste(c.accent, c.a), contraste(c.accent, c.b), contraste(c.accent, c.c));
    return { texto: t, destaque: d, nivel: t < 3 ? 'bloqueado' : t < 4.5 ? 'atencao' : 'ok', destaqueFraco: d < 3 };
  }

  /* ---------- aplicar / salvar ---------- */
  function aplicar(id, custom) {
    var spec = null;
    if (id === 'custom') spec = limpar(custom);
    else if (id !== 'morning' && PRESETS[id]) spec = PRESETS[id].c;
    if (id === 'custom' && !spec) id = 'morning';
    if (typeof document === 'undefined') return spec;
    var el = document.documentElement, st = el.style;
    VARS.forEach(function (v) { st.removeProperty(v); });
    if (spec) { var d = derivar(spec); for (var k in d) if (Object.prototype.hasOwnProperty.call(d, k)) st.setProperty(k, d[k]); }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', (spec || PRESETS.morning.c).a);
    el.setAttribute('data-tema', spec ? id : 'morning');
    return spec;
  }
  function ler() {
    try {
      var o = JSON.parse(root.localStorage.getItem(KEY));
      if (!o || typeof o.id !== 'string') return null;
      if (o.id === 'custom') { var c = limpar(o.c); return c ? { id: 'custom', c: c } : null; }
      return PRESETS[o.id] ? { id: o.id } : null;
    } catch (e) { return null; }
  }
  function gravar(o) { try { root.localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { } }
  function avisar(id) { try { root.dispatchEvent(new root.CustomEvent('ia-tema', { detail: { id: id } })); } catch (e) { } }

  function atual() { var s = ler(); return s || { id: 'morning' }; }
  function coresAtuais() { var s = atual(); return s.id === 'custom' ? s.c : PRESETS[s.id].c; }
  function usarPreset(id) {
    if (!PRESETS[id]) return false;
    aplicar(id); if (id === 'morning') { try { root.localStorage.removeItem(KEY); } catch (e) { } } else gravar({ id: id });
    avisar(id); return true;
  }
  function usarPersonalizado(c) {
    var o = limpar(c); if (!o) return { ok: false, motivo: 'cor-invalida' };
    var lg = legibilidade(o);
    if (lg.nivel === 'bloqueado') return { ok: false, motivo: 'ilegivel', lg: lg };
    aplicar('custom', o); gravar({ id: 'custom', c: o }); avisar('custom');
    return { ok: true, lg: lg };
  }
  function restaurar() { return usarPreset('morning'); }

  var API = {
    PRESETS: PRESETS, ORDEM: ORDEM, CAMPOS: CAMPOS, HEX: HEX,
    hexToRgb: hexToRgb, rgbToHex: rgbToHex, rgbToHsl: rgbToHsl, hslToRgb: hslToRgb, rgbToCmyk: rgbToCmyk, cmykToRgb: cmykToRgb,
    contraste: contraste, legibilidade: legibilidade, skyDe: skyDe, limpar: limpar, derivar: derivar,
    aplicar: aplicar, atual: atual, coresAtuais: coresAtuais, usarPreset: usarPreset, usarPersonalizado: usarPersonalizado, restaurar: restaurar
  };
  root.IATema = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;

  // aplica o tema salvo agora, antes da primeira pintura
  if (typeof document !== 'undefined') { var s = ler(); if (s) aplicar(s.id, s.c); }
})(typeof window !== 'undefined' ? window : globalThis);
