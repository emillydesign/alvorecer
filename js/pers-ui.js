// IAlvorecer · painel "Personalizar o site" (módulo próprio: só carrega quando a pessoa abre).
// Edita ordem, cor e presença dos cards da página inicial, botões do cabeçalho e o botão flutuante do assistente.
// Não mexe em textos, imagens nem na ordem ou no conteúdo dos cursos.
const P = window.IAPers, T = window.IATema;
const NOMES = Object.fromEntries(P.BLOCOS);
const SWATCHES = ['#1d5b7b', '#175244', '#2a4a7a', '#3b2a63', '#5a2a45', '#6b3a1e', '#1f4d4a', '#4a2f55', '#143b46', '#5b4a1a'];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let ov = null, foco = null, abertoCor = null;

function corTexto() { try { return T ? T.coresAtuais().text : '#DCEEE8'; } catch { return '#DCEEE8'; } }
function contraste(hex) { try { return T ? T.contraste(hex, corTexto()) : 7; } catch { return 7; } }

export function abrir() {
  if (ov) return;
  foco = document.activeElement;
  ov = document.createElement('div');
  ov.className = 'tm-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'psTitulo');
  document.body.appendChild(ov);
  ov.addEventListener('click', clique);
  ov.addEventListener('input', digitou);
  document.addEventListener('keydown', tecla);
  desenhar();
  ov.querySelector('[data-ps-fechar]')?.focus();
}

function fechar() {
  if (!ov) return;
  ov.remove(); ov = null; abertoCor = null;
  document.removeEventListener('keydown', tecla);
  foco?.focus?.();
}
function tecla(e) { if (e.key === 'Escape') fechar(); }

function desenhar(refoco) {
  const p = P.ler(), ord = P.ordenados(p);
  const vis = ord.filter(id => !p.ocultos.includes(id)), rem = ord.filter(id => p.ocultos.includes(id));
  const linha = (id, i) => {
    const cor = p.cores[id];
    const sw = SWATCHES.map(c => { const ok = contraste(c) >= 4.5; return `<button type="button" class="ps-sw${cor === c ? ' on' : ''}" data-ps="cor" data-id="${id}" data-cor="${c}" style="background:${c}" aria-label="Cor ${c}"${ok ? '' : ' disabled'}></button>`; }).join('');
    return `<li class="ps-row" data-bloco-id="${id}">
      <span class="ps-nome"><span class="ps-dot" style="${cor ? `background:${cor}` : ''}"></span>${esc(NOMES[id])}</span>
      <span class="ps-act">
        <button type="button" class="iconbtn" data-ps="sobe" data-id="${id}" aria-label="Subir ${esc(NOMES[id])}"${i === 0 ? ' disabled' : ''}><i data-lucide="chevron-up"></i></button>
        <button type="button" class="iconbtn" data-ps="desce" data-id="${id}" aria-label="Descer ${esc(NOMES[id])}"${i === vis.length - 1 ? ' disabled' : ''}><i data-lucide="chevron-down"></i></button>
        <button type="button" class="iconbtn" data-ps="paleta" data-id="${id}" aria-label="Cor de ${esc(NOMES[id])}" aria-expanded="${abertoCor === id}"><i data-lucide="palette"></i></button>
        <button type="button" class="iconbtn" data-ps="oculta" data-id="${id}" aria-label="Remover ${esc(NOMES[id])}"><i data-lucide="eye-off"></i></button>
      </span>
      ${abertoCor === id ? `<div class="ps-cores">${sw}<label class="ps-pick"><input type="color" data-ps-input="${id}" value="${cor || '#175244'}" aria-label="Escolher outra cor"></label><button type="button" class="btn btn-ghost btn-sm" data-ps="semcor" data-id="${id}">Cor original</button><p class="small muted ps-aviso" data-ps-aviso></p></div>` : ''}
    </li>`;
  };
  const topo = P.TOPO.map(([id, nome]) => `<label class="ps-chk"><input type="checkbox" data-ps-topo="${id}"${p.topo.includes(id) ? '' : ' checked'}><span>${esc(nome)}</span></label>`).join('');
  ov.innerHTML = `<div class="tm-box ps-box">
    <button type="button" class="iconbtn tm-x" data-ps-fechar aria-label="Fechar"><i data-lucide="x"></i></button>
    <div class="eyebrow">Aparência</div>
    <h2 id="psTitulo" style="margin:10px 0 6px">Personalizar o site</h2>
    <p class="muted small">Deixe o IAlvorecer com a sua cara: mude a ordem e a cor dos cards, tire o que não usa e escolha o que aparece no topo. Os textos e a ordem dos cursos não mudam. Fica salvo só neste aparelho.</p>

    <h3 class="ps-h">Cards da página inicial</h3>
    <ul class="ps-lista">${vis.map(linha).join('') || '<li class="muted small">Todos os cards foram removidos. Coloque de volta abaixo.</li>'}</ul>
    ${rem.length ? `<h3 class="ps-h">Cards removidos</h3><ul class="ps-lista">${rem.map(id => `<li class="ps-row"><span class="ps-nome">${esc(NOMES[id])}</span><button type="button" class="btn btn-ghost btn-sm" data-ps="volta" data-id="${id}"><i data-lucide="undo-2"></i> Colocar de volta</button></li>`).join('')}</ul>` : ''}

    <h3 class="ps-h">Cabeçalho</h3>
    <div class="ps-chks">${topo}</div>
    <p class="small muted" style="margin-top:8px">O botão da sua conta (IA.) fica sempre visível, para você chegar nos Ajustes.</p>

    <h3 class="ps-h">Assistente</h3>
    <label class="ps-chk"><input type="checkbox" data-ps-fab${p.fab ? ' checked' : ''}><span>Mostrar o botão flutuante "Falar com o IAlvorecer"</span></label>

    <div class="tm-foot"><button type="button" class="btn btn-ghost btn-sm" data-ps="padrao"><i data-lucide="rotate-ccw"></i> Voltar ao padrão</button><button type="button" class="btn btn-pink btn-sm" data-ps-fechar>Concluir</button></div>
  </div>`;
  if (refoco) ov.querySelector(refoco)?.focus();
}

function mudar(fn, refoco) { const p = P.ler(); fn(p); P.gravar(p); P.tudo(); desenhar(refoco); }
const sel = (a, id) => `[data-ps="${a}"][data-id="${id}"]`;

function clique(e) {
  if (e.target === ov || e.target.closest('[data-ps-fechar]')) { fechar(); return; }
  const b = e.target.closest('[data-ps]'); if (!b) return;
  const a = b.dataset.ps, id = b.dataset.id;
  if (a === 'padrao') { abertoCor = null; P.padrao(); desenhar('[data-ps-fechar]'); return; }
  if (a === 'paleta') { abertoCor = abertoCor === id ? null : id; desenhar(sel('paleta', id)); return; }
  if (a === 'cor') { aplicarCor(id, b.dataset.cor); return; }
  if (a === 'semcor') { mudar(p => { delete p.cores[id]; }, sel('semcor', id)); return; }
  if (a === 'oculta') { mudar(p => { p.ordem = P.ordenados(p); if (!p.ocultos.includes(id)) p.ocultos.push(id); }, '[data-ps="oculta"]'); return; }
  if (a === 'volta') { mudar(p => { p.ocultos = p.ocultos.filter(x => x !== id); }, sel('oculta', id)); return; }
  if (a === 'sobe' || a === 'desce') {
    mudar(p => {
      const ord = P.ordenados(p), vis = ord.filter(x => !p.ocultos.includes(x)), i = vis.indexOf(id), j = a === 'sobe' ? i - 1 : i + 1;
      if (j < 0 || j >= vis.length) return;
      const ia = ord.indexOf(vis[i]), ib = ord.indexOf(vis[j]);
      [ord[ia], ord[ib]] = [ord[ib], ord[ia]];
      p.ordem = ord;
    }, null);
    ov.querySelector(sel(a, id) + ':not([disabled])')?.focus() || ov.querySelector(sel(a === 'sobe' ? 'desce' : 'sobe', id))?.focus();
  }
}

function aplicarCor(id, hex) {
  const c = contraste(hex), aviso = ov.querySelector('[data-ps-aviso]');
  if (c < 3) { if (aviso) aviso.textContent = 'Essa cor deixaria o texto difícil de ler. Escolha uma mais escura.'; return false; }
  mudar(p => { p.cores[id] = hex.toLowerCase(); }, null);
  const av = ov.querySelector('[data-ps-aviso]');
  if (av) av.textContent = c < 4.5 ? 'Atenção: o texto pode ficar um pouco apagado nessa cor.' : '';
  ov.querySelector(`[data-ps-input="${id}"]`)?.focus();
  return true;
}

function digitou(e) {
  const t = e.target;
  if (t.dataset.psInput) { if (/^#[0-9a-f]{6}$/i.test(t.value)) { const id = t.dataset.psInput, ok = aplicarCor(id, t.value); if (!ok) t.value = P.ler().cores[id] || '#175244'; } return; }
  if (t.dataset.psTopo) { const id = t.dataset.psTopo; mudar(p => { p.topo = p.topo.filter(x => x !== id); if (!t.checked) p.topo.push(id); }, `[data-ps-topo="${id}"]`); return; }
  if ('psFab' in t.dataset) mudar(p => { p.fab = t.checked; }, '[data-ps-fab]');
}
