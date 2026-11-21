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

let ov = null, foco = null, slot = 'a', cores = null, quadro = 0;

if (T) {
  document.addEventListener('click', e => { if (e.target.closest('[data-tema-open]')) { e.preventDefault(); abrir(); } });
  window.addEventListener('ia-tema', rotular);
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
  const slots = CAMPOS.map(([k, nome]) => `<button type="button" class="tm-slot" data-slot="${k}" aria-pressed="false"><span class="tm-dot"></span>${nome}</button>`).join('');
  const grp = (g, nome) => `<div class="tm-grp"><span>${nome}</span>${GRUPOS[g].campos.map((f, i) => `<input type="number" inputmode="numeric" data-g="${g}" data-f="${f}" min="0" max="${GRUPOS[g].max[i]}" step="1" aria-label="${nome} ${f.toUpperCase()}">`).join('')}</div>`;
  ov = document.createElement('div');
  ov.className = 'tm-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'tmTitulo');
  ov.innerHTML = `<div class="tm-box">
    <button type="button" class="iconbtn tm-x" data-tm-fechar aria-label="Fechar"><i data-lucide="x"></i></button>
    <div class="eyebrow">Aparência</div>
    <h2 id="tmTitulo" style="margin:10px 0 6px">Cores do site</h2>
    <p class="muted small">Escolha uma paleta pronta ou crie a sua. A escolha fica salva só neste aparelho.</p>
    <div class="tm-grid">${cards}</div>
    <button type="button" class="tm-custom" data-tm-toggle aria-expanded="false"><span class="tm-custom-ic"><i data-lucide="palette"></i></span><span class="tm-custom-tx"><b>Personalizar cores</b><small>Crie a sua própria paleta</small></span></button>
    <div class="tm-ed" hidden>
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
    <div class="tm-foot"><button type="button" class="btn btn-ghost btn-sm" data-tm-reset><i data-lucide="rotate-ccw"></i> Restaurar padrão</button><button type="button" class="btn btn-pink btn-sm" data-tm-fechar>Concluir</button></div>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', clique);
  ov.addEventListener('input', digitou);
  ov.addEventListener('keydown', teclado);
  const wh = ov.querySelector('#tmWheel'); let arr = false;
  wh.addEventListener('pointerdown', e => { arr = true; wh.setPointerCapture(e.pointerId); daRoda(e); });
  wh.addEventListener('pointermove', e => { if (arr) daRoda(e); });
  wh.addEventListener('pointerup', () => { arr = false; });
  wh.addEventListener('pointercancel', () => { arr = false; });
  wh.addEventListener('keydown', e => {
    const m = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 0.04], ArrowDown: [0, -0.04] }[e.key]; if (!m) return;
    e.preventDefault(); hsv[0] = (hsv[0] + m[0] + 360) % 360; hsv[1] = Math.max(0, Math.min(1, hsv[1] + m[1])); mudou(hexDeHsv(...hsv), 'roda');
  });
  document.addEventListener('keydown', esc);
  marcarCards(); pintarEditor();
  (ov.querySelector('.tm-card.on') || ov.querySelector('.tm-card'))?.focus();
}

function fechar() {
  if (!ov) return;
  document.removeEventListener('keydown', esc);
  cancelAnimationFrame(quadro);
  ov.remove(); ov = null;
  rotular();
  if (foco && document.contains(foco)) foco.focus();
}
function esc(e) { if (e.key === 'Escape') fechar(); }
function teclado(e) {
  if (e.key !== 'Tab') return;
  const f = [...ov.querySelectorAll('button:not([hidden]), input:not([type=hidden])')].filter(x => x.offsetParent !== null);
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
  const tg = e.target.closest('[data-tm-toggle]');
  if (tg) { const ed = ov.querySelector('.tm-ed'), abrirEd = ed.hidden; ed.hidden = !abrirEd; tg.setAttribute('aria-expanded', String(abrirEd)); if (abrirEd) { pintarEditor(); avaliar(); } return; }
  const sl = e.target.closest('[data-slot]');
  if (sl) { slot = sl.dataset.slot; pintarEditor(); }
}

function marcarCards() {
  const id = T.atual().id;
  ov.querySelectorAll('[data-tid]').forEach(b => { const on = b.dataset.tid === id; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
}

// escreve nos campos o valor da cor do slot; "exceto" é o campo que a pessoa está digitando (não sobrescrever)
function pintarEditor(exceto) {
  if (!ov) return;
  const hex = cores[slot];
  ov.querySelectorAll('[data-slot]').forEach(b => {
    b.classList.toggle('on', b.dataset.slot === slot); b.setAttribute('aria-pressed', String(b.dataset.slot === slot));
    b.querySelector('.tm-dot').style.background = cores[b.dataset.slot];
  });
  const hexIn = ov.querySelector('#tmHex');
  if (exceto !== 'roda') hsv = hsvDe(hex);
  const wh = ov.querySelector('#tmWheel'), rad = hsv[1] * 50, ang = hsv[0] * Math.PI / 180;
  wh.style.setProperty('--tm-cor', hex); wh.style.setProperty('--tm-esc', String(1 - hsv[2]));
  wh.style.setProperty('--tm-x', (50 + rad * Math.cos(ang)) + '%'); wh.style.setProperty('--tm-y', (50 + rad * Math.sin(ang)) + '%');
  const vl = ov.querySelector('#tmVal'); if (exceto !== 'val') vl.value = Math.round(hsv[2] * 100);
  vl.style.background = `linear-gradient(90deg,#000,${hexDeHsv(hsv[0], hsv[1], 1)})`;
  if (exceto !== 'hex') { hexIn.value = hex.toUpperCase(); hexIn.removeAttribute('aria-invalid'); }
  for (const g in GRUPOS) {
    if (g === exceto) continue;
    const v = GRUPOS[g].de(hex);
    GRUPOS[g].campos.forEach((f, i) => { const el = ov.querySelector(`[data-g="${g}"][data-f="${f}"]`); el.value = v[i]; el.removeAttribute('aria-invalid'); });
  }
  const pv = ov.querySelector('.tm-prev');
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
  const G = GRUPOS[g], vals = G.campos.map(f => ov.querySelector(`[data-g="${g}"][data-f="${f}"]`));
  const n = vals.map(x => x.value.trim() === '' ? NaN : Number(x.value));
  const ok = n.every((v, i) => Number.isFinite(v) && v >= 0 && v <= G.max[i]);
  vals.forEach((x, i) => { if (Number.isFinite(n[i]) && n[i] >= 0 && n[i] <= G.max[i]) x.removeAttribute('aria-invalid'); else x.setAttribute('aria-invalid', 'true'); });
  if (ok) mudou(G.para(n), g);
}

function daRoda(e) {
  const wh = ov.querySelector('#tmWheel'), r = wh.getBoundingClientRect(), R = r.width / 2;
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
  const p = ov && ov.querySelector('.tm-warn'); if (!p) return;
  if (!lg) { p.className = 'tm-warn'; p.textContent = ''; return; }
  const t = num(lg.texto.toFixed(1));
  let msg, cls = lg.nivel;
  if (lg.nivel === 'ok') msg = `Legibilidade boa: contraste do texto de ${t}:1.`;
  else if (lg.nivel === 'atencao') msg = `Atenção: o texto está pouco legível (contraste de ${t}:1; o ideal é 4,5:1 ou mais). Clareie o texto ou escureça o fundo.`;
  else msg = `O texto quase não aparece (contraste de ${t}:1), então essa combinação não foi aplicada. Clareie o texto ou escureça o fundo.`;
  if (lg.destaqueFraco && aplicado !== false) { msg += ' O destaque está quase sumindo no fundo.'; if (cls === 'ok') cls = 'atencao'; }
  p.className = 'tm-warn ' + cls; p.textContent = msg;
}
