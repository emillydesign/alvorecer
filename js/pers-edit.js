// IAlvorecer · modo de edição do visual: os controles aparecem em cima do próprio site (só carrega quando a pessoa edita).
// Muda ordem, cor e presença dos blocos. Não mexe em textos, avisos de saúde, nem na ordem ou no conteúdo dos cursos.
const P = window.IAPers, T = window.IATema;
const SWATCHES = ['#1d5b7b', '#175244', '#2a4a7a', '#3b2a63', '#5a2a45', '#6b3a1e', '#1f4d4a', '#4a2f55', '#143b46', '#5b4a1a'];
const AREA = '#app,#topbar,#tabbar,#dock,#sitefoot';
const CLARAS = ['#ffffff', '#dceee8', '#7ef0cf', '#8ccfff', '#ffd58a', '#b9b6ff', '#f9a8d4', '#bef264', '#fdba74', '#a5f3fc'];
const ITEM = '[data-pb],[data-pc],[data-pg]';
let flu = null, sel = null, pular = false, tocava = false, pop = null, arr = null, passos = [], corAlvo = null, bar = null;

const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC = {
  pega: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  sobe: '<path d="m6 15 6-6 6 6"/>', desce: '<path d="m6 9 6 6 6-6"/>',
  esq: '<path d="m15 6-6 6 6 6"/>', dir: '<path d="m9 6 6 6-6 6"/>', pai: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
  cor: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2 0-1.500-1-1.500-1-2.500s1-1.500 2-1.500h2a4 4 0 0 0 4-4c0-4.500-4-8-9-8Z"/><circle cx="7.500" cy="11" r=".6"/><circle cx="11" cy="7" r=".6"/><circle cx="16" cy="8.500" r=".6"/>',
  olho: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  some: '<path d="M4 4l16 16M9.500 5.300A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.700M6.200 6.600A17 17 0 0 0 2 12s4 7 10 7a10 10 0 0 0 4.500-1.100"/>'
};
const botao = (a, ic, t) => `<button type="button" data-pe="${a}" title="${t}" aria-label="${t}">${svg(IC[ic])}</button>`;

export function iniciar(hash) {
  if (!P.grupo) { // o navegador misturou arquivos antigos e novos: atualiza a página uma vez
    let ja = true; try { ja = sessionStorage.getItem('ia_pers_rec'); sessionStorage.setItem('ia_pers_rec', '1'); } catch { }
    if (!ja) location.reload(); return;
  }
  try { window.dispatchEvent(new CustomEvent('ia-painel', { detail: 'editar' })); } catch { }
  if (typeof hash === 'string' && hash !== location.hash) location.hash = hash;
  else if (!P.pagina()) location.hash = '#/';
  if (bar) { pintar(); return; }
  passos = []; tocava = !!document.querySelector('#hxPlay.on'); if (tocava) document.querySelector('#hxPausa')?.click(); // pausa o carrossel enquanto edita
  bar = document.createElement('div');
  bar.className = 'pe-bar'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Edição do visual');
  bar.innerHTML = `<div class="pe-l"><b>Editando</b><select data-pe-pagina aria-label="Área que você está editando"></select></div>
    <p class="pe-dica" role="status">Toque em qualquer coisa para mudar a cor, mover ou esconder. Alguns itens também podem ser arrastados.</p>
    <div class="pe-l"><button type="button" data-pe-b="desfaz">Desfazer</button><button type="button" data-pe-b="padrao">Voltar ao padrão</button><button type="button" class="ok" data-pe-b="fim">Concluir</button></div>`;
  document.body.appendChild(bar);
  document.body.classList.add('pers-edit');
  bar.addEventListener('click', e => { const b = e.target.closest('[data-pe-b]'); if (b) acaoBarra(b.dataset.peB); });
  bar.querySelector('select').onchange = e => { location.hash = e.target.value; };
  document.addEventListener('click', clique, true);
  document.addEventListener('pointerdown', pega, true);
  document.addEventListener('keydown', tecla);
  document.addEventListener('dragstart', semArrasto, true);
  window.addEventListener('scroll', lugar, { passive: true }); window.addEventListener('resize', lugar);
  window.addEventListener('ia-pers-dom', pintar);
  window.addEventListener('hashchange', pintar);
  P.aplicar(); pintar();
}
export function sair() {
  if (!bar) return;
  soltar(); fecharCor(); soltarSel();
  document.removeEventListener('dragstart', semArrasto, true);
  window.removeEventListener('scroll', lugar); window.removeEventListener('resize', lugar);
  document.removeEventListener('click', clique, true);
  document.removeEventListener('pointerdown', pega, true);
  document.removeEventListener('keydown', tecla);
  window.removeEventListener('ia-pers-dom', pintar);
  window.removeEventListener('hashchange', pintar);
  document.body.classList.remove('pers-edit');
  bar.remove(); bar = null;
  document.querySelectorAll('.pe-tb').forEach(x => x.remove());
  document.querySelectorAll('.pe-item').forEach(x => x.classList.remove('pe-item'));
  document.querySelectorAll('.pe-alvo').forEach(x => x.classList.remove('pe-alvo'));
  if (tocava) { tocava = false; document.querySelector('#hxPlay')?.click(); }
}
function semArrasto(e) { if (e.target.closest?.(AREA)) e.preventDefault(); }
function tecla(e) {
  if (e.key !== 'Escape') return;
  if (arr) soltar(); else if (pop) fecharCor(); else if (sel) soltarSel(); else sair();
}

// ---------- controles sobre os blocos ----------
function pintar() {
  if (!bar) return;
  const se = bar.querySelector('select'), pg = P.pagina(), lista = P.PAGINAS.slice();
  if (pg && !lista.some(x => x[0] === pg)) lista.push([pg, document.querySelector('#app h1')?.textContent || 'Esta área']);
  const ops = (pg ? '' : '<option value="" selected disabled>Área sem edição</option>');
  if (se.dataset.pg !== String(pg) || !se.options.length) {
    se.innerHTML = ops; se.dataset.pg = String(pg);
    lista.forEach(([id, nome]) => { const o = document.createElement('option'); o.value = '#/' + (id === 'home' ? '' : id); o.textContent = nome; o.selected = id === pg; se.appendChild(o); });
  }
  bar.querySelector('[data-pe-b="desfaz"]').disabled = !passos.length;
  P.blocos().forEach(el => por(el, true));
  document.querySelectorAll('[data-pc],[data-pg]').forEach(el => el.classList.add('pe-item'));
  if (sel && (!sel.isConnected || !document.body.contains(sel))) soltarSel(); else if (sel) botoesSel();
  document.querySelectorAll('#app .pe-tb').forEach(tb => { const el = tb.parentElement; if (!el.hasAttribute('data-pb')) tb.remove(); });
}
function por(el, bloco) {
  el.classList.add('pe-alvo');
  const off = el.hasAttribute('data-pers-off');
  let tb = el.querySelector(':scope > .pe-tb');
  if (!tb) {
    tb = document.createElement('span'); tb.className = 'pe-tb';
    el.appendChild(tb);
  }
  if (tb.dataset.off === String(off)) return; // já está pintado
  tb.dataset.off = String(off);
  tb.innerHTML = (bloco ? botao('pega', 'pega', 'Arrastar') + botao('sobe', 'sobe', 'Subir') + botao('desce', 'desce', 'Descer') : '') + botao('cor', 'cor', 'Mudar a cor') + botao('some', off ? 'olho' : 'some', off ? 'Mostrar de novo' : 'Esconder');
}

// ---------- item tocado: botões flutuantes ----------
function selecionar(el) {
  soltarSel(); fecharCor(); sel = el; el.classList.add('pe-sel');
  flu = document.createElement('div'); flu.className = 'pe-tb pe-flu'; document.body.appendChild(flu);
  flu.onclick = e => { const b = e.target.closest('[data-pe]'); if (b) acaoBloco(b.dataset.pe, sel, b); };
  botoesSel();
}
function soltarSel() { sel?.classList.remove('pe-sel'); sel = null; flu?.remove(); flu = null; }
const pai = el => el.parentElement?.closest('[data-pc]');
function botoesSel() {
  if (!sel || !flu) return;
  const g = P.grupo(sel), i = g ? g.els.indexOf(sel) : -1;
  flu.innerHTML = (g ? botao('sobe', 'esq', 'Mover para antes') + botao('desce', 'dir', 'Mover para depois') : '') + botao('cor', 'cor', 'Mudar a cor') + botao('some', P.oculto(P.ler(), sel) ? 'olho' : 'some', P.oculto(P.ler(), sel) ? 'Mostrar de novo' : 'Esconder') + (pai(sel) ? botao('pai', 'pai', 'Selecionar o bloco em volta') : '');
  if (g) { if (i < 1) flu.querySelector('[data-pe="sobe"]').disabled = true; if (i === g.els.length - 1) flu.querySelector('[data-pe="desce"]').disabled = true; }
  lugar();
}
function lugar() {
  if (!sel || !flu) return;
  const r = sel.getBoundingClientRect(), w = flu.offsetWidth, h = flu.offsetHeight;
  flu.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
  flu.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8)) + 'px';
}
function dica(t) { const d = bar?.querySelector('.pe-dica'); if (d) { d.textContent = t; d.classList.add('viva'); } }

function mudar(fn) {
  const antes = JSON.stringify(P.ler()), p = P.ler();
  if (fn(p) === false) return false;
  passos.push(antes); if (passos.length > 40) passos.shift();
  P.gravar(p); P.tudo(); pintar();
  return true;
}
function acaoBarra(a) {
  if (a === 'fim') return sair();
  fecharCor();
  if (a === 'desfaz') { const s = passos.pop(); if (s) { P.gravar(JSON.parse(s)); P.tudo(); } return pintar(); }
  if (a === 'padrao' && confirm('Voltar todo o visual ao padrão, em todas as áreas? Você ainda pode desfazer enquanto estiver editando. As cores gerais do site não mudam.')) {
    passos.push(JSON.stringify(P.ler())); P.padrao(); pintar();
  }
}
const idDe = P.idDe;
// avisos de segurança e de saúde ficam sempre visíveis
const seguro = el => el.matches('.notice') || !!el.querySelector('.notice') || /\b(CVV|SAMU)\b/.test(el.textContent);

function clique(e) {
  const t = e.target;
  if (!t.closest || t.closest('.pe-bar,.pe-pop,.pe-flu')) return;
  if (pop && !t.closest('[data-pe="cor"]')) fecharCor();
  if (!t.closest(AREA)) return;
  if (pular) { pular = false; e.preventDefault(); e.stopPropagation(); return; }
  if (e.isTrusted === false || t.closest('#hxPrev,#hxNext,.hx-tab,.ax-nav button')) return; // trocar de grupo no carrossel continua funcionando
  e.preventDefault(); e.stopPropagation(); // editando: nada abre nem navega
  const b = t.closest('[data-pe]');
  if (b) return acaoBloco(b.dataset.pe, b.closest('.pe-alvo'), b);
  const it = t.closest(ITEM);
  if (it && !it.hasAttribute('data-pb')) { if (it === sel) soltarSel(); else selecionar(it); return; }
  soltarSel();
  const tab = t.closest('#tabbar [data-nav]'), par = tab && document.querySelector('#mainnav [data-nav="' + tab.dataset.nav + '"]');
  if (par?.hasAttribute('data-pg')) mudar(p => P.alternar(p, par));
}
function acaoBloco(a, el, b) {
  if (!el) return;
  const id = idDe(el);
  if (a === 'cor') return abrirCor(el, b);
  if (a === 'pai') { const x = pai(el); return x && selecionar(x); }
  if (a === 'some' && id === 'dock:cores') return dica('Este botão abre os Ajustes e a Aparência, por isso fica sempre visível.');
  if (a === 'some') { if (!P.oculto(P.ler(), el) && seguro(el)) return dica('Este item tem um aviso de segurança ou saúde, por isso fica sempre visível.'); return mudar(p => P.alternar(p, el)); }
  if (a === 'sobe' || a === 'desce') {
    const l = P.grupo(el)?.els || [], i = l.indexOf(el), alvo = l[a === 'sobe' ? i - 1 : i + 1];
    if (alvo && mover(el, alvo, a === 'desce') && el.hasAttribute('data-pb')) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.querySelector(`:scope > .pe-tb [data-pe="${a}"]`)?.focus({ preventScroll: true }); }
  }
}
function mover(el, alvo, depois) {
  return mudar(p => {
    const g = P.grupo(el); if (!g) return false;
    const ids = g.els.map(idDe), id = idDe(el), antes = ids.join('|'), l = ids.filter(x => x !== id);
    l.splice(l.indexOf(idDe(alvo)) + (depois ? 1 : 0), 0, id);
    if (l.join('|') === antes) return false;
    g.por(p, l);
  });
}

// ---------- arrastar ----------
function pega(e) {
  pular = false;
  if (arr || e.button > 0 || !e.target.closest) return;
  const b = e.target.closest('[data-pe="pega"]'), it = b ? b.closest('.pe-alvo') : e.target.closest('[data-pg],.hx-card,.hx-cu');
  if (!it || e.target.closest('.pe-bar,.pe-pop,.pe-flu')) return;
  if (b) e.preventDefault();
  arr = { ok: !!b, x0: e.clientX, y0: e.clientY, el: it, id: e.pointerId, alvo: null, depois: false, x: e.clientX, y: e.clientY, q: 0 };
  if (arr.ok) arr.el.classList.add('pe-arr');
  document.addEventListener('pointermove', move); document.addEventListener('pointerup', solta); document.addEventListener('pointercancel', soltar);
  rolar();
}
function move(e) { if (!arr || e.pointerId !== arr.id) return; arr.x = e.clientX; arr.y = e.clientY; if (!arr.ok) { if (Math.hypot(arr.x - arr.x0, arr.y - arr.y0) < 9) return; arr.ok = true; soltarSel(); fecharCor(); arr.el.classList.add('pe-arr'); } mirar(); }
function mirar() {
  limpar();
  const l = (P.grupo(arr.el)?.els || []).filter(x => x !== arr.el);
  if (!arr.el.hasAttribute('data-pb')) return mirarItem(l);
  let alvo = null, dist = Infinity;
  l.forEach(x => { const r = x.getBoundingClientRect(), d = arr.y < r.top ? r.top - arr.y : arr.y > r.bottom ? arr.y - r.bottom : 0; if (r.height && d < dist) { dist = d; alvo = x; } });
  if (!alvo) return;
  const r = alvo.getBoundingClientRect();
  arr.alvo = alvo; arr.depois = arr.y > r.top + r.height / 2;
  alvo.classList.add(arr.depois ? 'pe-depois' : 'pe-antes');
}
function mirarItem(l) { // itens lado a lado: vale o mais perto do dedo ou do mouse
  let alvo = null, dist = Infinity, rr = null;
  l.forEach(x => {
    const r = x.getBoundingClientRect(); if (!r.width || r.right < 0 || r.left > innerWidth || getComputedStyle(x.parentElement).opacity === '0') return;
    const d = Math.hypot(arr.x - Math.max(r.left, Math.min(r.right, arr.x)), arr.y - Math.max(r.top, Math.min(r.bottom, arr.y)));
    if (d < dist) { dist = d; alvo = x; rr = r; }
  });
  if (!alvo || dist > 160) { arr.alvo = null; return; }
  const els = P.grupo(arr.el).els;
  arr.alvo = alvo;
  arr.depois = alvo.classList.contains('hx-card') ? els.indexOf(alvo) > els.indexOf(arr.el) : arr.x > rr.left + rr.width / 2;
  alvo.classList.add('pe-mira');
}
function rolar() { // perto da borda da tela, a página anda sozinha
  if (!arr) return;
  const h = window.innerHeight, v = !arr.ok || arr.el.hasAttribute('data-pg') ? 0 : arr.y < 130 ? -10 : arr.y > h - 110 ? 10 : 0;
  if (v) { window.scrollBy(0, v); mirar(); }
  arr.q = requestAnimationFrame(rolar);
}
function limpar() { document.querySelectorAll('.pe-antes,.pe-depois,.pe-mira').forEach(x => x.classList.remove('pe-antes', 'pe-depois', 'pe-mira')); }
function soltar() {
  if (!arr) return;
  cancelAnimationFrame(arr.q); limpar(); arr.el.classList.remove('pe-arr'); arr = null;
  document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', solta); document.removeEventListener('pointercancel', soltar);
}
function solta(e) {
  if (!arr || e.pointerId !== arr.id) return;
  const { el, alvo, depois, ok } = arr; soltar();
  if (!ok) return;
  pular = true; setTimeout(() => { pular = false; }, 80); // o toque que termina o arrasto não seleciona
  if (alvo && el.isConnected && alvo.isConnected) mover(el, alvo, depois);
}

// ---------- cor de um bloco ----------
const texto = el => el.matches('h1,h2,h3,p,.eyebrow');
const contraste = (hex, el) => { try { const k = T.coresAtuais(); return el && texto(el) ? Math.min(T.contraste(hex, k.a), T.contraste(hex, k.b), T.contraste(hex, k.c)) : T.contraste(hex, k.text); } catch { return 7; } };
function fecharCor() { pop?.remove(); pop = null; corAlvo = null; }
function abrirCor(el, b) {
  if (corAlvo === el) return fecharCor();
  fecharCor(); corAlvo = el;
  const id = idDe(el), pg = P.pagina(), atual = P.estDe(P.ler(), el).cores[id];
  pop = document.createElement('div'); pop.className = 'pe-pop'; pop.setAttribute('role', 'group'); pop.setAttribute('aria-label', 'Cor deste bloco');
  pop.innerHTML = `<b>${texto(el) ? 'Cor deste texto' : 'Cor deste item'}</b><div class="pe-sws">${(texto(el) ? CLARAS : SWATCHES).map(c => `<button type="button" class="ps-sw${c === atual ? ' on' : ''}" data-cor="${c}" style="background:${c}" aria-label="Cor ${c}"${contraste(c, el) >= 4.5 ? '' : ' disabled'}></button>`).join('')}<label class="ps-pick" title="Outra cor"><input type="color" value="${atual || (texto(el) ? '#dceee8' : '#175244')}" aria-label="Escolher outra cor"></label></div><button type="button" class="pe-orig">Cor original</button><p class="pe-aviso" role="status"></p>`;
  document.body.appendChild(pop);
  const r = b.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px';
  pop.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.bottom + 8)) + 'px';
  const usar = hex => {
    if (P.pagina() !== pg) return fecharCor();
    const c = contraste(hex, el), av = pop.querySelector('.pe-aviso');
    if (c < 3) { av.textContent = 'Essa cor deixaria o texto difícil de ler. Escolha outra.'; return; }
    mudar(p => { P.estDe(p, el).cores[id] = hex.toLowerCase(); });
    av.textContent = c < 4.5 ? 'Atenção: o texto pode ficar um pouco apagado.' : '';
    pop.querySelectorAll('[data-cor]').forEach(x => x.classList.toggle('on', x.dataset.cor === hex));
  };
  pop.onclick = e => {
    const s = e.target.closest('[data-cor]'); if (s) return usar(s.dataset.cor);
    if (e.target.closest('.pe-orig')) { if (P.pagina() === pg) mudar(p => { delete P.estDe(p, el).cores[id]; }); fecharCor(); }
  };
  pop.querySelector('input').onchange = e => usar(e.target.value);
}
