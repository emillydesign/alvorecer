// IAlvorecer · painel "Cores do site" (módulo próprio: não depende do app.js).
// Abre com qualquer elemento que tenha data-tema-open. Usa window.IATema (js/tema.js).
const T = window.IATema;

const CAMPOS = [['a', 'Fundo 1'], ['b', 'Fundo 2'], ['c', 'Fundo 3'], ['text', 'Texto'], ['accent', 'Destaque']];
const GRUPOS = {
  rgb: { campos: ['r', 'g', 'b'], max: [255, 255, 255], de: hex => T.hexToRgb(hex), para: v => T.rgbToHex(v[0], v[1], v[2]) },
  hsl: { campos: ['h', 's', 'l'], max: [360, 100, 100], de: hex => T.rgbToHsl(...T.hexToRgb(hex)), para: v => T.rgbToHex(...T.hslToRgb(v[0], v[1], v[2])) },
  cmyk: { campos: ['c', 'm', 'y', 'k'], max: [100, 100, 100, 100], de: hex => T.rgbToCmyk(...T.hexToRgb(hex)), para: v => T.rgbToHex(...T.cmykToRgb(v[0], v[1], v[2], v[3])) }
};

function hsvDe(hex) { const [r, g, b] = T.hexToRgb(hex).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)); else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; } return [h, mx ? d / mx : 0, mx]; }
function hexDeHsv(h, s, v) { const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return T.rgbToHex(f(5) * 255, f(3) * 255, f(1) * 255); }
let hsv = [0, 0, 1];

let ov = null, ov2 = null, foco2 = null, foco = null, slot = 'a', cores = null, quadro = 0;

if (T) {
  document.addEventListener('click', e => { if (e.target.closest('[data-tema-open]')) { e.preventDefault(); abrir(); } });
  window.addEventListener('ia-tema', rotular);
}

function montarSaves(raiz) {
  import('./saves.js?v=1').then(m => m.montar(raiz.querySelector('[data-saves]'), 'tema', {
    atual: () => T.atual(),
    carregar: d => { if (d && d.id === 'custom') T.usarPersonalizado(d.c); else if (d && d.id) T.usarPreset(d.id); },
    depois: () => { cores = { ...T.coresAtuais() }; marcarCards(); pintarEditor(); }
  }));
}
function nomeAtual() { return T.nome(T.atual().id); }
function rotular() { document.querySelectorAll('[data-tema-nome]').forEach(el => { el.textContent = nomeAtual(); }); }
function normHex(s) {
  s = String(s).trim().replace(/^#?/, '#');
  if (/^#[0-9a-f]{3}$/i.test(s)) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  return T.HEX.test(s) ? s.toLowerCase() : null;
}
const num = v => String(v).replace('.', ',');

function abrir() {
  if (ov) return;
  foco = document.activeElement;
  cores = { ...T.coresAtuais() };
  slot = 'a';
  const cards = T.ORDEM.map(id => `<button type="button" class="tm-card" data-tid="${id}" aria-pressed="false"><img src="img/temas/${id}.webp" alt="" width="84" height="84" loading="lazy"><span class="tm-nome">${T.nome(id)}</span>${id === 'morning' ? '<small>padrão</small>' : ''}<i class="tm-ok" data-lucide="check"></i></button>`).join('');
  ov = document.createElement('div');
  ov.className = 'tm-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'tmTitulo');
  ov.innerHTML = `<div class="tm-box">
    <button type="button" class="iconbtn tm-x" data-tm-fechar aria-label="Fechar"><i data-lucide="x"></i></button>
    <div class="eyebrow">Aparência</div>
    <h2 id="tmTitulo" style="margin:10px 0 6px">Cores do site</h2>
    <p class="muted small">Escolha uma paleta pronta ou crie a sua. A escolha fica salva só neste aparelho.</p>
    <div class="tm-grid">${cards}</div>
    <button type="button" class="tm-custom" data-tm-toggle aria-haspopup="dialog"><span class="tm-custom-ic"><i data-lucide="palette"></i></span><span class="tm-custom-tx"><b>Personalizar cores</b><small>Abra o círculo cromático e crie a sua paleta</small></span><i class="tm-custom-go" data-lucide="plus"></i></button>
    <div class="sv" data-saves></div>
    <div class="tm-foot"><button type="button" class="btn btn-ghost btn-sm" data-tm-reset><i data-lucide="rotate-ccw"></i> Restaurar padrão</button><button type="button" class="btn btn-pink btn-sm" data-tm-fechar>Concluir</button></div>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', clique);
  ov.addEventListener('input', digitou);
  ov.addEventListener('keydown', teclado);
  document.addEventListener('keydown', esc);
  marcarCards(); pintarEditor(); montarSaves(ov);
  (ov.querySelector('.tm-card.on') || ov.querySelector('.tm-card'))?.focus();
}

function abrirEditor() {
  if (ov2) return;
  foco2 = document.activeElement;
  const slots = CAMPOS.map(([k, nome]) => `<button type="button" class="tm-slot" data-slot="${k}" aria-pressed="false"><span class="tm-dot"></span>${nome}</button>`).join('');
  const grp = (g, nome) => `<div class="tm-grp"><span>${nome}</span>${GRUPOS[g].campos.map((f, i) => `<input type="number" inputmode="numeric" data-g="${g}" data-f="${f}" min="0" max="${GRUPOS[g].max[i]}" step="1" aria-label="${nome} ${f.toUpperCase()}">`).join('')}</div>`;
  slot = 'a'; cores = { ...T.coresAtuais() };
  ov2 = document.createElement('div');
  ov2.className = 'tm-ov tm-ov2'; ov2.setAttribute('role', 'dialog'); ov2.setAttribute('aria-modal', 'true'); ov2.setAttribute('aria-labelledby', 'tmTitulo2');
  ov2.innerHTML = `<div class="tm-box tm-box2">
    <button type="button" class="iconbtn tm-x" data-tm-fechar2 aria-label="Fechar"><i data-lucide="x"></i></button>
    <div class="eyebrow">Personalizar</div>
    <h2 id="tmTitulo2" style="margin:10px 0 14px">Círculo cromático</h2>
    <div class="tm-ed">
      <div class="tm-slots">${slots}</div>
      <div class="tm-edrow">
        <div class="tm-picker"><div class="tm-wheel" id="tmWheel" tabindex="0" role="application" aria-label="Círculo cromático: setas mudam matiz e intensidade"><span class="tm-shade"></span><span class="tm-thumb"></span></div><input type="range" id="tmVal" class="tm-val" min="0" max="100" step="1" aria-label="Brilho"></div>
        <div class="tm-fields">
          <label><span>HEX</span><input id="tmHex" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Código HEX"></label>
          ${grp('rgb', 'RGB')}${grp('hsl', 'HSL')}${grp('cmyk', 'CMYK')}
        </div>
      </div>
      <div class="tm-prev" aria-hidden="true"><b>Texto de exemplo</b><span class="tm-pdot"></span></div>
      <p class="tm-warn" role="status" aria-live="polite"></p>
    </div>
    <div class="sv" data-saves></div>
    <div class="tm-foot"><button type="button" class="btn btn-ghost btn-sm" data-tm-reset><i data-lucide="rotate-ccw"></i> Restaurar padrão</button><button type="button" class="btn btn-pink btn-sm" data-tm-fechar2>Concluir</button></div>
  </div>`;
  document.body.appendChild(ov2);
  montarSaves(ov2);
  ov2.addEventListener('click', e => {
    if (e.target === ov2 || e.target.closest('[data-tm-fechar2]')) return fecharEditor();
    if (e.target.closest('[data-tm-reset]')) { T.restaurar(); cores = { ...T.coresAtuais() }; marcarCards(); pintarEditor(); aviso(); return; }
    const sl = e.target.closest('[data-slot]'); if (sl) { slot = sl.dataset.slot; pintarEditor(); }
  });
  ov2.addEventListener('input', digitou);
  ov2.addEventListener('keydown', teclado);
  const wh = ov2.querySelector('#tmWheel'); let arr = false;
  wh.addEventListener('pointerdown', e => { arr = true; wh.setPointerCapture(e.pointerId); daRoda(e); });
  wh.addEventListener('pointermove', e => { if (arr) daRoda(e); });
  wh.addEventListener('pointerup', () => { arr = false; });
  wh.addEventListener('pointercancel', () => { arr = false; });
  wh.addEventListener('keydown', e => {
    const m = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 0.04], ArrowDown: [0, -0.04] }[e.key]; if (!m) return;
    e.preventDefault(); hsv[0] = (hsv[0] + m[0] + 360) % 360; hsv[1] = Math.max(0, Math.min(1, hsv[1] + m[1])); mudou(hexDeHsv(...hsv), 'roda');
  });
  pintarEditor(); avaliar();
  wh.focus();
}
function fecharEditor() {
  if (!ov2) return;
  cancelAnimationFrame(quadro);
  ov2.remove(); ov2 = null;
  marcarCards();
  if (foco2 && document.contains(foco2)) foco2.focus();
}

function fechar() {
  if (!ov) return;
  document.removeEventListener('keydown', esc);
  cancelAnimationFrame(quadro);
  fecharEditor();
  ov.remove(); ov = null;
  rotular();
  if (foco && document.contains(foco)) foco.focus();
}
function esc(e) { if (e.key === 'Escape') { if (ov2) fecharEditor(); else fechar(); } }
function teclado(e) {
  if (e.key !== 'Tab') return;
  const f = [...(ov2 || ov).querySelectorAll('button:not([hidden]), input:not([type=hidden])')].filter(x => x.offsetParent !== null);
  if (!f.length) return;
  const a = f[0], z = f[f.length - 1];
  if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
  else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
}

function clique(e) {
  if (e.target === ov || e.target.closest('[data-tm-fechar]')) return fechar();
  const card = e.target.closest('[data-tid]');
  if (card) { T.usarPreset(card.dataset.tid); cores = { ...T.coresAtuais() }; marcarCards(); pintarEditor(); aviso(); return; }
  if (e.target.closest('[data-tm-reset]')) { T.restaurar(); cores = { ...T.coresAtuais() }; marcarCards(); pintarEditor(); aviso(); return; }
  if (e.target.closest('[data-tm-toggle]')) return abrirEditor();
}

function marcarCards() {
  const id = T.atual().id;
  ov.querySelectorAll('[data-tid]').forEach(b => { const on = b.dataset.tid === id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
}

// escreve nos campos o valor da cor do slot; "exceto" é o campo que a pessoa está digitando (não sobrescrever)
function pintarEditor(exceto) {
  if (!ov2) return;
  const hex = cores[slot];
  ov2.querySelectorAll('[data-slot]').forEach(b => {
    b.classList.toggle('on', b.dataset.slot === slot); b.setAttribute('aria-pressed', String(b.dataset.slot === slot));
    b.querySelector('.tm-dot').style.background = cores[b.dataset.slot];
  });
  const hexIn = ov2.querySelector('#tmHex');
  if (exceto !== 'roda') hsv = hsvDe(hex);
  const wh = ov2.querySelector('#tmWheel'), rad = hsv[1] * 50, ang = hsv[0] * Math.PI / 180;
  wh.style.setProperty('--tm-cor', hex); 
  wh.style.setProperty('--tm-x', (50 + rad * Math.cos(ang)) + '%'); wh.style.setProperty('--tm-y', (50 + rad * Math.sin(ang)) + '%');
  const vl = ov2.querySelector('#tmVal'); if (exceto !== 'val') vl.value = Math.round(hsv[2] * 100);
  vl.style.background = `linear-gradient(90deg,#000,${hexDeHsv(hsv[0], hsv[1], 1)})`;
  if (exceto !== 'hex') { hexIn.value = hex.toUpperCase(); hexIn.removeAttribute('aria-invalid'); }
  for (const g in GRUPOS) {
    if (g === exceto) continue;
    const v = GRUPOS[g].de(hex);
    GRUPOS[g].campos.forEach((f, i) => { const el = ov2.querySelector(`[data-g="${g}"][data-f="${f}"]`); el.value = v[i]; el.removeAttribute('aria-invalid'); });
  }
  const pv = ov2.querySelector('.tm-prev');
  pv.style.background = `linear-gradient(170deg,${cores.a},${cores.b} 55%,${cores.c})`; pv.style.color = cores.text;
  pv.querySelector('.tm-pdot').style.background = cores.accent;
}

function digitou(e) {
  const el = e.target;
  if (el.id === 'tmVal') { hsv[2] = Number(el.value) / 100; return mudou(hexDeHsv(...hsv), 'val'); }
  if (el.id === 'tmHex') {
    const h = normHex(el.value);
    if (h) { el.removeAttribute('aria-invalid'); mudou(h, 'hex'); } else el.setAttribute('aria-invalid', String(el.value.replace('#', '').length >= 6));
    return;
  }
  const g = el.dataset.g;
  if (!g) return;
  const G = GRUPOS[g], vals = G.campos.map(f => ov2.querySelector(`[data-g="${g}"][data-f="${f}"]`));
  const n = vals.map(x => x.value.trim() === '' ? NaN : Number(x.value));
  const ok = n.every((v, i) => Number.isFinite(v) && v >= 0 && v <= G.max[i]);
  vals.forEach((x, i) => { if (Number.isFinite(n[i]) && n[i] >= 0 && n[i] <= G.max[i]) x.removeAttribute('aria-invalid'); else x.setAttribute('aria-invalid', 'true'); });
  if (ok) mudou(G.para(n), g);
}

function daRoda(e) {
  const wh = ov2.querySelector('#tmWheel'), r = wh.getBoundingClientRect(), R = r.width / 2;
  const dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R);
  hsv[0] = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360; hsv[1] = Math.min(1, Math.hypot(dx, dy) / R);
  mudou(hexDeHsv(...hsv), 'roda');
}
function mudou(hex, de) {
  hex = normHex(hex); if (!hex) return;
  cores[slot] = hex;
  if (slot === 'accent') cores.sky = T.skyDe(hex); // o segundo destaque acompanha o primeiro
  pintarEditor(de);
  cancelAnimationFrame(quadro);
  quadro = requestAnimationFrame(() => { const r = T.usarPersonalizado(cores); marcarCards(); aviso(r.lg, r.ok); });
}

function avaliar() { const c = T.limpar(cores); if (c) aviso(T.legibilidade(c), true); }

function aviso(lg, aplicado) {
  const p = ov2 && ov2.querySelector('.tm-warn'); if (!p) return;
  if (!lg) { p.className = 'tm-warn'; p.textContent = ''; return; }
  const t = num(lg.texto.toFixed(1));
  let msg, cls = lg.nivel;
  if (lg.nivel === 'ok') msg = `Legibilidade boa: contraste do texto de ${t}:1.`;
  else if (lg.nivel === 'atencao') msg = `Atenção: o texto está pouco legível (contraste de ${t}:1; o ideal é 4,5:1 ou mais). Clareie o texto ou escureça o fundo.`;
  else msg = `O texto quase não aparece (contraste de ${t}:1), então essa combinação não foi aplicada. Clareie o texto ou escureça o fundo.`;
  if (lg.destaqueFraco && aplicado !== false) { msg += ' O destaque está quase sumindo no fundo.'; if (cls === 'ok') cls = 'atencao'; }
  p.className = 'tm-warn ' + cls; p.textContent = msg;
}
