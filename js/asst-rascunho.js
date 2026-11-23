// Rascunho do chat do IAlvorecer: o que a pessoa escreveu fica salvo neste aparelho até ela enviar ou limpar.
// Arquivo à parte: só carrega quando o chat abre.
const KEY = 'ia_asst_rascunho';
const ler = () => { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } };
const gravar = v => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch { } };
export function limparRascunho() { gravar(''); }

export function iniciarRascunho({ ta, prefill, onClear }) {
  const salvo = ler();
  const bar = document.createElement('div'); bar.className = 'asst-rasc'; bar.hidden = true;
  ta.parentElement.parentElement.insertBefore(bar, ta.parentElement);
  const barra = () => {
    const tem = !!ta.value.trim();
    bar.hidden = !tem && !bar._aviso;
    bar.innerHTML = (bar._aviso ? `<span>${bar._aviso}</span>` : '<span class="muted small">Rascunho salvo neste aparelho</span>') + (bar._aviso ? '<button type="button" data-usar>Usar “Quero um curso de”</button>' : '') + (tem ? '<button type="button" data-limpar>Limpar mensagem</button>' : '');
  };
  const auto = () => { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight) + 'px'; };
  if (salvo && !prefill) { ta.value = salvo; auto(); }
  else if (salvo && prefill) { ta.value = salvo; bar._aviso = 'Você tem um rascunho guardado.'; bar._pref = prefill; auto(); }
  else if (prefill) { ta.value = prefill; }
  ta.addEventListener('input', () => { gravar(ta.value); bar._aviso = ''; auto(); barra(); });
  bar.addEventListener('click', e => {
    if (e.target.closest('[data-limpar]')) { ta.value = ''; gravar(''); bar._aviso = ''; auto(); barra(); ta.focus(); onClear?.(); }
    if (e.target.closest('[data-usar]')) { ta.value = bar._pref; gravar(ta.value); bar._aviso = ''; barra(); ta.focus(); }
  });
  barra();
  return { depoisDeEnviar() { gravar(''); bar._aviso = ''; auto(); barra(); } };
}
