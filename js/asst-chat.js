// Conversa do chat do IAlvorecer: balões, histórico salvo, edição com versões e ações das mensagens. Só carrega quando o chat abre.
import { esc } from './util.js';

const ARQ = 'chat.json', LOCAL = 'ia_chat_visita';
const OPCOES = ['Modificar meu cronograma', 'Criar um curso personalizado', 'Reiniciar um curso', 'Ajustar meu perfil'];
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC = {
  copiar: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
  sim: '<path d="M7 11v10H3V11zM7 11l4-8a3 3 0 0 1 3 3v3h5a2 2 0 0 1 2 2.3l-1.4 8a2 2 0 0 1-2 1.7H7"/>',
  nao: '<path d="M17 13V3h4v10zM17 13l-4 8a3 3 0 0 1-3-3v-3H5a2 2 0 0 1-2-2.3l1.4-8a2 2 0 0 1 2-1.7H17"/>',
  editar: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  voltar: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',
  seta: '<path d="M5 12h14M13 6l6 6-6 6"/>'
};
let D = null, msgs = [], pronto = false, ocupado = false, editando = -1, dono = null;

const local = () => D.S.readonly || D.S.isDemo;
function salvar() {
  const dados = { msgs: msgs.filter(m => m.role !== 'typing') };
  try { if (local()) localStorage.setItem(LOCAL, JSON.stringify(dados)); else Promise.resolve(D.S.write(ARQ, dados)).catch(() => { }); } catch { }
}
async function ler() {
  try { return (local() ? JSON.parse(localStorage.getItem(LOCAL)) : await D.S.read(ARQ))?.msgs || []; } catch { return []; }
}
export async function iniciar(deps) {
  D = deps; editando = -1;
  if (dono !== D.S) { dono = D.S; pronto = false; msgs = []; }
  if (!pronto) { const m = await ler(); if (!pronto) { msgs = m; pronto = true; } }
  if (!msgs.length) {
    msgs = [{ role: 'typing' }]; desenhar();
    await new Promise(r => setTimeout(r, 1800));
    const nome = D.S.state.profile.name;
    msgs = [{ role: 'ai', inicio: true, text: `Oi${nome ? ', ' + nome : ''}! Eu sou o IAlvorecer. Posso tirar dúvidas e ajustar seus estudos. Por onde quer começar?` }];
    salvar();
  }
  desenhar();
}

const botao = (acao, i, titulo, icone, extra = '') => `<button type="button" data-a="${acao}" data-i="${i}" title="${titulo}" aria-label="${titulo}" ${extra}>${icone ? svg(IC[icone]) : ''}</button>`;
function versoes(i) { // setas de versão: aparecem na resposta que veio depois de uma mensagem editada
  const p = msgs[i - 1]; if (p?.role !== 'me' || !(p.vers?.length > 1)) return '';
  return `<span class="msg-vers"><button type="button" data-a="ver" data-i="${i - 1}" data-d="-1" aria-label="Versão anterior" ${p.cur ? '' : 'disabled'}>‹</button><span title="Outras versões">${p.cur + 1}/${p.vers.length}</span><button type="button" data-a="ver" data-i="${i - 1}" data-d="1" aria-label="Próxima versão" ${p.cur < p.vers.length - 1 ? '' : 'disabled'}>›</button></span>`;
}
function html(m, i) {
  if (m.role === 'typing') return '<div class="msg ai digitando" role="status" aria-label="IAlvorecer está digitando"><i></i><i></i><i></i></div>';
  if (m.role === 'me') {
    if (i === editando) return `<div class="msg-edit"><textarea id="msgEdit" rows="3">${esc(m.text)}</textarea><div><button type="button" data-a="cancela-edit">Cancelar</button><button type="button" class="ok" data-a="salva-edit" data-i="${i}">Enviar</button></div></div>`;
    return `<div class="msg me">${esc(m.text)}</div><div class="msg-acoes me">${botao('editar', i, 'Editar', 'editar')}${botao('copiar', i, 'Copiar', 'copiar')}${botao('voltar', i, 'Voltar ao que era antes desta mensagem', 'voltar')}</div>`;
  }
  const acts = m.actions?.length ? `<div class="act"><b>${m.applied ? '✓ Feito' : m.canceled ? 'Cancelado' : 'Posso fazer isto:'}</b><ul>${m.actions.map(a => `<li>${esc(D.describeAction(a))}</li>`).join('')}</ul>${m.applied || m.canceled ? '' : `<div class="row"><button class="btn btn-pink btn-sm" data-a="aplicar" data-i="${i}">Aplicar</button><button class="btn btn-ghost btn-sm" data-a="cancelar" data-i="${i}">Agora não</button></div>`}</div>` : '';
  const ops = m.inicio ? `<div class="opcoes"><small>Toque em uma opção para enviar</small>${OPCOES.map(o => `<button type="button" data-a="opcao" data-t="${esc(o)}"><span>${o}</span>${svg(IC.seta)}</button>`).join('')}</div>` : '';
  const ouvir = D.voz() ? '<button type="button" data-ouvir></button>' : '';
  return `<div class="msg ai">${esc(m.text)}</div><div class="msg-acoes">${botao('copiar', i, 'Copiar', 'copiar')}${ouvir}${botao('sim', i, 'Gostei', 'sim', `aria-pressed="${m.voto === 1}"`)}${botao('nao', i, 'Não gostei', 'nao', `aria-pressed="${m.voto === -1}"`)}${versoes(i)}</div>${acts}${ops}`;
}
export function desenhar() {
  const box = document.getElementById('asstM'); if (!box) return;
  box.innerHTML = msgs.map(html).join('');
  const ia = msgs.filter(m => m.role === 'ai'), V = D.voz();
  box.querySelectorAll('[data-ouvir]').forEach((b, i) => { b.dataset.texto = ia[i].text; b.onclick = () => V.ouvir(ia[i].text, D.idioma()); });
  V?.pintar();
  box.onclick = clique;
  box.scrollTop = box.scrollHeight;
}
async function clique(e) {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const a = b.dataset.a, i = +b.dataset.i, m = msgs[i];
  if (a === 'copiar') return navigator.clipboard?.writeText(m.text).then(() => D.toast('Mensagem copiada ✓'), () => D.toast('Não consegui copiar.'));
  if (ocupado) return;
  if (a === 'opcao') return enviar(b.dataset.t);
  if (a === 'sim' || a === 'nao') { const v = a === 'sim' ? 1 : -1; m.voto = m.voto === v ? 0 : v; }
  else if (a === 'editar') editando = i;
  else if (a === 'cancela-edit') editando = -1;
  else if (a === 'salva-edit') {
    const novo = document.getElementById('msgEdit').value.trim(); editando = -1;
    if (novo && novo !== m.text) {
      const vers = m.vers || [{}]; const cur = m.cur || 0;
      vers[cur] = { text: m.text, resto: msgs.slice(i + 1) };
      msgs = msgs.slice(0, i);
      return responder(novo, { vers: [...vers, {}], cur: vers.length });
    }
  } else if (a === 'ver') {
    const k = m.cur + +b.dataset.d; if (!m.vers[k]) return;
    m.vers[m.cur] = { text: m.text, resto: msgs.slice(i + 1) };
    const v = m.vers[k]; m.text = v.text; m.cur = k; msgs = [...msgs.slice(0, i + 1), ...v.resto];
  } else if (a === 'voltar') return confirmar(i);
  else if (a === 'cancelar') m.canceled = true;
  else if (a === 'aplicar') {
    ocupado = true; b.disabled = true; b.innerHTML = '<span class="spin"></span>';
    try { const antes = D.S.state.backups?.[0]?.id; await D.applyActions(m.actions); m.applied = true; const id = D.S.state.backups?.[0]?.id; if (id !== antes) m.backup = id; D.toast('Alteração aplicada ✓'); }
    catch (err) { D.toast('⚠️ ' + err.message, 6000); }
    ocupado = false;
  }
  salvar(); desenhar();
}
function confirmar(i) {
  const cx = document.getElementById('asst'); if (!cx || cx.querySelector('.asst-conf')) return;
  const feito = msgs.slice(i).find(m => m.backup && m.applied);
  cx.insertAdjacentHTML('beforeend', `<div class="asst-conf" role="alertdialog" aria-label="Voltar ao que era antes"><div><b>Voltar ao que era antes?</b><p>Esta mensagem e as que vieram depois serão excluídas. ${feito ? 'A página volta a como estava antes das mudanças feitas a partir dela, inclusive o progresso registrado depois.' : 'Nenhuma mudança foi feita na página a partir dela.'} <strong>Isso não pode ser desfeito.</strong></p><div><button type="button" data-n>Cancelar</button><button type="button" class="ok" data-s>Voltar</button></div></div></div>`);
  const c = cx.querySelector('.asst-conf');
  c.querySelector('[data-n]').onclick = () => c.remove();
  c.querySelector('[data-s]').onclick = async () => {
    c.remove(); ocupado = true;
    try {
      if (feito && !(await D.restaurar(feito.backup))) { D.toast('Não encontrei a cópia anterior da página, então nada foi alterado.', 6000); ocupado = false; return; }
      msgs = msgs.slice(0, i); salvar();
    } catch (err) { D.toast('⚠️ ' + err.message, 6000); }
    ocupado = false; desenhar();
  };
}
export function enviar(texto, porVoz) {
  const t = document.getElementById('asstT'), text = String(texto ?? t?.value ?? '').trim();
  if (!text || ocupado || !pronto || msgs.some(m => m.role === 'typing')) return;
  if (texto === undefined || porVoz) { t.value = ''; D.limpar(); }
  return responder(text, {}, porVoz);
}
async function responder(text, extra, porVoz) {
  ocupado = true;
  const minha = { role: 'me', text, ...extra };
  msgs.push(minha, { role: 'typing' }); desenhar();
  let r;
  const d = D.destino(text);
  if (d) { location.hash = d.h; r = { text: `Abrindo ${d.t}. ${d.d}` }; }
  else if (D.S.readonly) r = { text: 'No modo visitante dá pra explorar tudo, mas para conversar comigo, fazer aulas e salvar seu progresso é preciso criar uma conta grátis. É rapidinho!' };
  else {
    try { r = await D.perguntar(msgs.filter(m => m.role === 'me' || m.role === 'ai').slice(-16).map(m => ({ role: m.role, text: m.text }))); }
    catch (err) { r = { text: '⚠️ ' + err.message }; }
  }
  msgs = msgs.filter(m => m.role !== 'typing'); msgs.push({ role: 'ai', ...r });
  if (minha.vers) minha.vers[minha.cur] = { text, resto: [] };
  ocupado = false; salvar(); desenhar();
  const V = D.voz(); if (V && (porVoz || V.lerSempre())) V.ouvir(r.text, D.idioma());
}
