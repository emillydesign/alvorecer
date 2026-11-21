// IAlvorecer · painel "Cores do site" (módulo próprio: não depende do app.js).
// Abre com qualquer elemento que tenha data-tema-open. Usa window.IATema (js/tema.js).
const T = window.IATema;

const CAMPOS = [['a', 'Fundo 1'], ['b', 'Fundo 2'], ['c', 'Fundo 3'], ['text', 'Texto'], ['accent', 'Destaque']];
const GRUPOS = {
  rgb: { campos: ['r', 'g', 'b'], max: [255, 255, 255], de: hex => T.hexToRgb(hex), para: v => T.rgbToHex(v[0], v[1], v[2]) },
  hsl: { campos: ['h', 's', 'l'], max: [360, 100, 100], de: hex => T.rgbToHsl(...T.hexToRgb(hex)), para: v => T.rgbToHex(...T.hslToRgb(v[0], v[1], v[2])) },
  cmyk: { campos: ['c', 'm', 'y', 'k'], max: [100, 100, 100, 100], de: hex => T.rgbToCmyk(...T.hexToRgb(hex)), para: v => T.rgbToHex(...T.cmykToRgb(v[0], v[1], v[2], v[3])) }
};

let ov = null, foco = null, slot = 'a', cores = null, quadro = 0;

if (T) {
  document.addEventListener('click', e => { if (e.target.closest('[data-tema-open]')) { e.preventDefault(); abrir(); } });
  window.addEventListener('ia-tema', rotular);
}

function nomeAtual() { const a = T.atual(); return a.id === 'custom' ? 'Personalizado' : T.PRESETS[a.id].nome; }
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
  const cards = T.ORDEM.map(id => `<button type="button" class="tm-card" data-tid="${id}" aria-pressed="false"><img src="img/temas/${id}.webp" alt="" width="84" height="84" loading="lazy"><span class="tm-nome">${T.PRESETS[id].nome}</span>${id === 'morning' ? '<small>padrão</small>' : ''}<i class="tm-ok" data-lucide="check"></i></button>`).join('');
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
    <button type="button" class="btn btn-ghost btn-sm" data-tm-toggle aria-expanded="false"><i data-lucide="sliders-horizontal"></i> Personalizar cores</button>
    <div class="tm-ed" hidden>
      <div class="tm-slots">${slots}</div>
      <div class="tm-edrow">
        <label class="tm-wheel" title="Círculo cromático"><input type="color" id="tmPick" aria-label="Círculo cromático"></label>
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
  const pick = ov.querySelector('#tmPick'), hexIn = ov.querySelector('#tmHex');
  pick.value = hex; pick.parentElement.style.setProperty('--tm-cor', hex);
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
  if (el.id === 'tmPick') return mudou(el.value, null);
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
