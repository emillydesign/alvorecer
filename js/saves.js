// IAlvorecer · "Meus saves": até 5 versões guardadas na conta, para cada painel (personalização do site e cores).
// Módulo próprio, só carrega quando um painel de personalização abre. Usa a ponte window.IAConta (js/app.js).
const MAX = 5;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dia = t => { try { return new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); } catch { return ''; } };
let aviso = '';

// el: elemento onde o bloco aparece · tipo: 'pers' | 'tema'
// o.atual(): o que está valendo agora · o.carregar(dados): aplica um save · o.depois(): atualiza o painel
export function montar(el, tipo, o) {
  if (!el) return;
  const C = window.IAConta;
  let pend = null;
  const lista = () => (C && C.ler()?.saves?.[tipo]) || [];
  function desenhar() {
    if (!C || C.readonly) { el.innerHTML = '<p class="small muted">Para guardar versões na sua conta, entre ou crie a sua conta.</p>'; return; }
    const l = lista();
    el.innerHTML = `<div class="sv-head"><b>Meus saves</b><span class="small muted">${l.length} de ${MAX}</span></div>
      <ul class="sv-lista">${l.map(s => `<li class="sv-row"><span class="sv-nome">${esc(s.nome)}<small>${esc(dia(s.em))}</small></span><span class="sv-act">
        <button type="button" class="btn btn-ghost btn-sm" data-sv="usa" data-id="${esc(s.id)}">Usar</button>
        ${pend === s.id ? `<button type="button" class="btn btn-ghost btn-sm" data-sv="apaga" data-id="${esc(s.id)}">Confirmar apagar</button>` : `<button type="button" class="iconbtn" data-sv="apaga" data-id="${esc(s.id)}" aria-label="Apagar ${esc(s.nome)}"><i data-lucide="trash-2"></i></button>`}
      </span></li>`).join('') || '<li class="small muted">Nenhum save ainda. Salve o que está agora para poder voltar depois.</li>'}</ul>
      ${l.length < MAX ? `<div class="sv-novo"><input class="sv-in" maxlength="30" placeholder="Nome do save (opcional)" aria-label="Nome do save" data-sv-nome><button type="button" class="btn btn-pink btn-sm" data-sv="salva">Salvar o que está agora</button></div>` : '<p class="small muted">Você chegou a 5 saves. Apague um para salvar outro.</p>'}
      <p class="small muted sv-msg" role="status" aria-live="polite">${esc(aviso)}</p>`;
    aviso = '';
  }
  el.onclick = e => {
    const b = e.target.closest('[data-sv]'); if (!b) return;
    const a = b.dataset.sv, id = b.dataset.id;
    if (a === 'salva') {
      const nome = (el.querySelector('[data-sv-nome]')?.value || '').trim().slice(0, 30);
      const ok = C.gravar(v => {
        v.saves = v.saves || { pers: [], tema: [] };
        const arr = v.saves[tipo] = v.saves[tipo] || [];
        if (arr.length >= MAX) return;
        arr.push({ id: Date.now().toString(36), nome: nome || 'Save ' + (arr.length + 1), em: Date.now(), d: JSON.parse(JSON.stringify(o.atual())) });
      });
      aviso = ok ? 'Salvo na sua conta.' : 'Não foi possível salvar agora.'; pend = null; desenhar(); return;
    }
    if (a === 'usa') {
      const s = lista().find(x => x.id === id); if (!s) return;
      aviso = 'Save "' + s.nome + '" aplicado.';
      o.carregar(s.d); desenhar(); o.depois && o.depois(); return;
    }
    if (a === 'apaga') {
      if (pend !== id) { pend = id; desenhar(); el.querySelector(`[data-sv="apaga"][data-id="${id}"]`)?.focus(); return; }
      C.gravar(v => { v.saves[tipo] = (v.saves[tipo] || []).filter(x => x.id !== id); });
      pend = null; aviso = 'Save apagado.'; desenhar();
    }
  };
  desenhar();
}
