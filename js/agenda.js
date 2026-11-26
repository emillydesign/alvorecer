// Agenda: rotina do dia, checklist diário, férias e folgas. Arquivo à parte: só carrega quando a pessoa abre #/agenda.
import { $, $$, esc, uid, today, weekday, addDays, fmtDay, fmtShort } from './util.js';
import { listen, canListen } from './speech.js?v=69';

let X; // contexto: { S, AI, app, toast, setCleanup }
export function initAgenda(ctx) { X = ctx; }

const TIPOS = {
  trabalho: { n: 'Trabalho', i: 'briefcase' }, estudo: { n: 'Estudo', i: 'book-open' }, transporte: { n: 'Transporte', i: 'bus' },
  refeicao: { n: 'Refeição', i: 'utensils' }, treino: { n: 'Treino', i: 'dumbbell' }, agua: { n: 'Água', i: 'droplets' },
  sono: { n: 'Sono', i: 'moon' }, cuidado: { n: 'Cuidado', i: 'sparkles' }, aula: { n: 'Aula', i: 'graduation-cap' }, outro: { n: 'Outro', i: 'circle' }
};
const LINKS = { treino: ['#/cuidar', 'Abrir treino'], refeicao: ['#/cuidar', 'Ver cardápio'], aula: ['#/', 'Ir para a aula'], cuidado: ['#/cuidados', 'Abrir cuidados'], agua: ['#/cuidar', 'Água de hoje'] };
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const TODOS = [0, 1, 2, 3, 4, 5, 6], UTEIS = [1, 2, 3, 4, 5];
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/, DATA = /^\d{4}-\d{2}-\d{2}$/;

const A = () => (X.S.state.agenda ||= { perfil: null, itens: [], ferias: [], folgas: [], feitos: {} });
const save = () => X.S.saveState();
const livre = () => { if (X.S.readonly) { X.toast('Modo visitante: crie sua conta para salvar sua agenda.'); return false; } return true; };
const min = h => +h.slice(0, 2) * 60 + +h.slice(3);
const hhmm = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const hojeNoFeriasOuFolga = (d, data) => d.ferias.some(f => data >= f.de && data <= f.ate) || d.folgas.includes(data);
const ehCompromisso = t => t === 'trabalho' || t === 'estudo' || t === 'transporte';
const itensDoDia = (data = today()) => {
  const d = A(), w = weekday(data), parado = hojeNoFeriasOuFolga(d, data);
  return d.itens.filter(i => i.dias.includes(w) && !(parado && ehCompromisso(i.tipo))).sort((a, b) => a.hora.localeCompare(b.hora));
};
const metaAgua = () => { const p = X.S.state.health?.profile || {}; const w = +p.peso; return w > 0 ? Math.round(35 * w / 50) * 50 : 2000; };

// ---------- rotina inicial a partir das respostas ----------
function gerarRotina(p) {
  // Só entra o que a pessoa informou. Nada de café, jantar, água ou sono "de brinde".
  const it = [], add = (hora, titulo, tipo, dias, ml) => it.push({ id: uid(), hora, titulo, tipo, dias, ...(ml ? { ml } : {}) });
  const trab = p.ocupacao !== 'nenhum';
  const dias = trab ? UTEIS : TODOS, nome = p.ocupacao === 'estudo' ? 'estudo' : 'trabalho';
  const ida = p.transporte || 0, volta = p.transporteVolta ?? ida;
  if (p.acordar) add(p.acordar, 'Acordar', 'sono', TODOS);
  if (trab) {
    const ini = min(p.inicio), fim = min(p.fim);
    if (ida) add(hhmm(ini - ida), `Sair de casa (${ida} min de ida)`, 'transporte', dias);
    add(p.inicio, nome === 'estudo' ? 'Início das aulas' : 'Chegada no trabalho', nome, dias);
    if (p.almoco) add(p.almoco, 'Almoço', 'refeicao', dias);
    add(p.fim, nome === 'estudo' ? 'Fim das aulas' : 'Saída do trabalho', nome, dias);
    if (volta) add(hhmm(fim + volta), `Chegada em casa (${volta} min de volta)`, 'transporte', dias);
  } else if (p.almoco) add(p.almoco, 'Almoço', 'refeicao', TODOS);
  if (p.higieneSono && p.dormir) add(hhmm(min(p.dormir) - 30), 'Higiene do sono (sem telas, luz baixa)', 'sono', TODOS);
  if (p.dormir) add(p.dormir, 'Dormir', 'sono', TODOS);
  return it;
}
// completa a água até a meta, nos maiores intervalos do dia, sem mexer nos horários de trabalho
function completarAgua(itens, p) {
  const alvo = Math.ceil(metaAgua() / 250), tem = () => itens.reduce((s, i) => s + (i.dias.includes(1) && i.ml ? i.ml / 250 : 0), 0);
  let guarda = 0;
  while (tem() < alvo && guarda++ < 12) {
    const marcos = itens.filter(i => i.dias.includes(1) && (i.ml || i.tipo === 'sono' && i.titulo === 'Dormir')).map(i => min(i.hora)).sort((a, b) => a - b);
    const lim = [min(p.acordar), ...marcos.filter(m => m > min(p.acordar) && m < min(p.dormir) - 60), min(p.dormir) - 60];
    let melhor = 0, onde = null;
    for (let k = 0; k < lim.length - 1; k++) if (lim[k + 1] - lim[k] > melhor) { melhor = lim[k + 1] - lim[k]; onde = Math.round((lim[k] + lim[k + 1]) / 2); }
    if (!onde || melhor < 90) break;
    itens.push({ id: uid(), hora: hhmm(onde), titulo: 'Beber água', tipo: 'agua', dias: TODOS, ml: 250 });
  }
  return itens;
}

// ---------- entrada da rota ----------
export async function agenda(tab = 'hoje') {
  const d = A();
  if (!d.perfil && !d.itens.length) return perguntas();
  const abas = [['hoje', 'Hoje'], ['adaptar', 'Adaptar minha rotina'], ['rotina', 'Minha rotina'], ['ajustar', 'Falar com o IAlvorecer'], ['ferias', 'Férias e folgas']];
  if (!abas.some(a => a[0] === tab)) tab = 'hoje';
  X.app.innerHTML = `<div class="eyebrow">Agenda</div><h1 style="margin:10px 0 18px">Sua rotina, do seu jeito</h1>
    <div class="tabs">${abas.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div><div id="ag"></div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => { location.hash = '#/agenda/' + b.dataset.tab; });
  ({ hoje, rotina, ajustar, ferias, adaptar })[tab]();
}

// ---------- adaptar a rotina (js/rotina-ajuda.js, sem gastar IA) ----------
function adaptar() {
  import('./rotina-ajuda.js?v=2').then(M => { const el = $('#ag'); if (el) M.abrir(el, { S: X.S, toast: X.toast, salvar: save, voltar: () => { location.hash = '#/agenda/hoje'; } }); })
    .catch(() => X.toast('Não consegui abrir agora. Tente de novo.'));
}
const convite = () => `<a class="ra-convite" href="#/agenda/adaptar"><span class="ra-ic"><i data-lucide="sparkles"></i></span><span><b>Adaptar minha rotina</b><small>Responda perguntas rápidas e receba horários para treino, água, pausas e sono, do seu jeito</small></span><span class="btn btn-pink btn-sm">Começar</span></a>`;

// ---------- perguntas iniciais ----------
function perguntas() {
  const opt = (v, l) => `<option value="${v}">${esc(l)}</option>`;
  const hora = (id, rot, v) => `<div class="field"><label>${rot}</label><input type="time" id="q-${id}" value="${v}"><label class="check small" style="margin-top:6px;gap:6px"><input type="checkbox" id="q-${id}-sem" style="width:auto"> Sem horário específico</label></div>`;
  X.app.innerHTML = `<div class="eyebrow">Agenda</div><h1 style="margin:10px 0 10px">Vamos montar a sua rotina</h1>
    <p class="muted" style="max-width:720px">Responda o que fizer sentido. Eu só coloco na rotina o que você me contar: nada vem pré-definido. Você muda tudo depois.</p>
    <div class="panel" style="max-width:640px;margin-top:20px">
      <div class="field"><label>Você trabalha ou estuda?</label><select id="q-oc">${opt('trabalho', 'Trabalho')}${opt('estudo', 'Estudo')}${opt('nenhum', 'Nenhum dos dois agora')}</select></div>
      <div id="q-hor">
        <div class="row" style="gap:12px;flex-wrap:wrap">
          <div class="field"><label>Começa às</label><input type="time" id="q-ini" value="09:00"></div>
          <div class="field"><label>Termina às</label><input type="time" id="q-fim" value="18:00"></div>
        </div>
        <div class="row" style="gap:12px;flex-wrap:wrap">
          <div class="field"><label>Deslocamento de ida, em minutos</label><input type="number" id="q-tr" min="0" max="240" value="30"></div>
          <div class="field"><label>Deslocamento de volta, em minutos</label><input type="number" id="q-tv" min="0" max="240" value="30"></div>
        </div>
        <p class="small muted" style="margin:-4px 0 14px">Se não se desloca, deixe 0.</p>
      </div>
      <div class="row" style="gap:12px;flex-wrap:wrap">${hora('ac', 'Acorda às', '07:00')}${hora('al', 'Almoça às', '12:00')}${hora('do', 'Dorme às', '22:30')}</div>
      <div class="notice" style="margin:8px 0 14px"><label class="check" style="gap:8px"><input type="checkbox" id="q-hs" style="width:auto"> <span><b>Incluir higiene do sono (opcional)</b><br><span class="small">É importante para melhorar a qualidade do sono e conseguir dormir no horário certo. Precisa de um horário de dormir.</span></span></label><button type="button" class="btn btn-ghost btn-sm" id="q-hs-info" style="margin-top:8px">Quero aprender como funciona</button></div>
      <div class="row" style="margin-top:8px"><button class="btn btn-pink" id="q-ok">Montar minha rotina</button></div>
    </div>`;
  const oc = $('#q-oc');
  oc.onchange = () => { $('#q-hor').hidden = oc.value === 'nenhum'; };
  ['ac', 'al', 'do'].forEach(k => { const s = $('#q-' + k + '-sem'); s.onchange = () => { $('#q-' + k).disabled = s.checked; if (k === 'do' && s.checked) $('#q-hs').checked = false; }; });
  $('#q-hs').onchange = () => { if ($('#q-hs').checked && $('#q-do-sem').checked) { $('#q-hs').checked = false; X.toast('Para a higiene do sono, informe o horário de dormir.'); } };
  $('#q-hs-info').onclick = infoSono;
  $('#q-ok').onclick = () => {
    if (!livre()) return;
    const h = k => ($('#q-' + k + '-sem').checked ? '' : $('#q-' + k).value);
    const p = { ocupacao: oc.value, inicio: $('#q-ini').value, fim: $('#q-fim').value, transporte: Math.max(0, Math.min(240, +$('#q-tr').value || 0)), transporteVolta: Math.max(0, Math.min(240, +$('#q-tv').value || 0)), acordar: h('ac'), almoco: h('al'), dormir: h('do'), higieneSono: $('#q-hs').checked };
    if (![p.acordar, p.almoco, p.dormir].every(x => x === '' || HORA.test(x)) || (p.ocupacao !== 'nenhum' && !(HORA.test(p.inicio) && HORA.test(p.fim)))) return X.toast('Confira os horários.');
    if (p.ocupacao !== 'nenhum' && min(p.fim) <= min(p.inicio)) return X.toast('O fim precisa ser depois do início.');
    const d = A(); d.perfil = p; d.itens = gerarRotina(p); save(); location.hash = '#/agenda/adaptar';
  };
}
function infoSono() {
  document.querySelector('.modal-ov')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-ov"><div class="modal-box"><button class="iconbtn x">✕</button>
    <div class="eyebrow">Higiene do sono</div><h2 style="margin:10px 0 12px">O que é e por que ajuda</h2>
    <p>Higiene do sono não é sobre limpeza: são hábitos simples antes de dormir que avisam ao corpo que está na hora de desacelerar. Eles ajudam a pegar no sono mais fácil, dormir no horário certo e acordar mais descansado.</p>
    <ul style="margin:12px 0 12px 18px"><li>Horários parecidos para dormir e acordar, até no fim de semana.</li><li>Cerca de 30 minutos antes de dormir: luz baixa e sem telas (a luz do celular atrasa o sono).</li><li>Evitar cafeína no fim do dia e refeições pesadas perto da hora de dormir.</li><li>Quarto escuro, silencioso e fresco.</li></ul>
    <p class="small muted">Se você incluir, aparece um lembrete 30 minutos antes do seu horário de dormir. Se tiver insônia frequente, procure a UBS: o IAlvorecer não substitui um profissional.</p>
    <div class="row" style="margin-top:18px"><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-close>Entendi</button></div></div></div>`);
  const ov = document.querySelector('.modal-ov'); ov.onclick = e => { if (e.target === ov || e.target.closest('.x') || e.target.closest('[data-close]')) ov.remove(); };
}

// ---------- hoje: checklist ----------
function hoje() {
  const d = A(), t = today(), lista = itensDoDia(t), feitos = (d.feitos[t] ||= {});
  const agora = hhmm(new Date().getHours() * 60 + new Date().getMinutes());
  const nFeitos = lista.filter(i => feitos[i.id]).length, prox = lista.find(i => !feitos[i.id] && i.hora >= agora);
  const ml = lista.filter(i => feitos[i.id]).reduce((s, i) => s + (i.ml || 0), 0), mlTotal = lista.reduce((s, i) => s + (i.ml || 0), 0);
  const parado = hojeNoFeriasOuFolga(d, t);
  $('#ag').innerHTML = `${d.adaptar ? '' : convite()}<p class="muted" style="margin:0 0 14px">${esc(fmtDay(t))}${parado ? ' · hoje você está de folga ou férias, então trabalho e estudo ficam de fora' : ''}</p>
    <div class="panel" style="margin-bottom:18px"><div class="row"><b>${nFeitos} de ${lista.length} feitos</b><span class="spacer"></span>${mlTotal ? `<span class="small muted">Água: ${ml} de ${mlTotal} ml planejados · meta do dia ${(metaAgua() / 1000).toFixed(1)} L</span>` : ''}</div>
      <div style="height:8px;border-radius:99px;background:var(--line);margin-top:12px;overflow:hidden"><div style="height:100%;width:${lista.length ? Math.round(nFeitos / lista.length * 100) : 0}%;background:var(--mint)"></div></div></div>
    ${lista.length ? lista.map(i => `<label class="panel check" style="margin-bottom:10px;padding:14px 18px;gap:14px;${prox?.id === i.id ? 'outline:2px solid var(--mint)' : ''}">
      <input type="checkbox" data-id="${esc(i.id)}" ${feitos[i.id] ? 'checked' : ''}>
      <b style="min-width:56px">${esc(i.hora)}</b>
      <span style="flex:1;${feitos[i.id] ? 'opacity:.55;text-decoration:line-through' : ''}">${esc(i.titulo)}${i.ml ? ` <span class="small muted">· ${i.ml} ml de água</span>` : ''}${cardapioDe(i)}</span>
      ${LINKS[i.tipo] ? `<a class="btn btn-ghost btn-sm" href="${LINKS[i.tipo][0]}">${esc(LINKS[i.tipo][1])}</a>` : ''}</label>`).join('') : '<div class="panel muted">Nada marcado para hoje. Adicione itens em "Minha rotina" ou peça ao IAlvorecer.</div>'}`;
  $$('[data-id]').forEach(c => c.onchange = () => { if (!livre()) { c.checked = !c.checked; return; } feitos[c.dataset.id] = c.checked; if (!c.checked) delete feitos[c.dataset.id]; for (const k of Object.keys(d.feitos)) if (k < addDays(t, -30)) delete d.feitos[k]; save(); hoje(); });
}

// cardápio por horário: pega a refeição do plano alimentar (Cuidar de mim) mais perto do horário do item
function cardapioDe(item) {
  if (item.tipo !== 'refeicao') return '';
  const ref = X.S.state.health?.planoAlimentar?.refeicoes; if (!Array.isArray(ref) || !ref.length) return '';
  const h = min(item.hora); let melhor = null, dist = 1e9;
  for (const r of ref) { if (!/^\d{1,2}:\d{2}/.test(String(r.hora || ''))) continue; const m = min(String(r.hora).padStart(5, '0')); const dd = Math.abs(m - h); if (dd < dist) { dist = dd; melhor = r; } }
  if (!melhor || dist > 120) return '';
  const ops = (melhor.opcoes || []).slice(0, 2).join(' ou ');
  return `<div class="small muted" style="margin-top:4px">Do seu plano: ${esc(melhor.nome || '')}${ops ? ': ' + esc(ops) : ''}</div>`;
}

// ---------- minha rotina ----------
function rotina() {
  const d = A(), itens = [...d.itens].sort((a, b) => a.hora.localeCompare(b.hora));
  const chips = (sel) => TODOS.map(n => `<button type="button" class="chip ${sel.includes(n) ? 'on' : ''}" data-dia="${n}">${DIAS[n]}</button>`).join('');
  const sa = X.S.state.health || {}, temAgua = +sa.profile?.peso > 0, temPlano = Array.isArray(sa.planoAlimentar?.refeicoes) && sa.planoAlimentar.refeicoes.length;
  $('#ag').innerHTML = `<div class="notice" style="margin-bottom:18px"><b>Integrada com os seus cursos.</b> Aqui só aparece o que você colocar. Você também pode trazer coisas dos cursos de alimentação, água, cuidados e dos cursos que escolher fazer.<div class="row" style="gap:10px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-ghost btn-sm" id="i-agua">${temAgua ? 'Trazer os horários de água' : 'Calcular minha água'}</button><button class="btn btn-ghost btn-sm" id="i-ref">${temPlano ? 'Trazer refeições do meu plano alimentar' : 'Montar meu plano alimentar'}</button><a class="btn btn-ghost btn-sm" href="#/cuidados">Cuidados</a></div></div>
    <div class="panel" style="margin-bottom:18px"><div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-end">
      <div class="field" style="margin:0"><label>Horário</label><input type="time" id="n-h" value="08:00"></div>
      <div class="field" style="margin:0;flex:1;min-width:180px"><label>O que é?</label><input type="text" id="n-t" maxlength="80" placeholder="Ex.: Treino de pernas"></div>
      <div class="field" style="margin:0"><label>Tipo</label><select id="n-tp">${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}">${esc(v.n)}</option>`).join('')}</select></div></div>
      <div class="tabs" id="n-dias" style="margin:14px 0 0">${chips(UTEIS)}</div>
      <div class="row" style="margin-top:12px"><button class="btn btn-pink btn-sm" id="n-ok">Adicionar</button><span class="spacer"></span><button class="btn btn-ghost btn-sm" id="n-ref">Refazer perguntas iniciais</button></div></div>
    ${itens.length ? itens.map(i => `<div class="panel" style="margin-bottom:10px;padding:14px 18px"><div class="row" style="gap:14px"><b style="min-width:56px">${esc(i.hora)}</b><span style="flex:1">${esc(i.titulo)}${i.ml ? ` <span class="small muted">· ${i.ml} ml</span>` : ''}<br>${i.rec ? '<span class="ra-tag">recomendado</span> ' : ''}<span class="small muted">${esc(TIPOS[i.tipo]?.n || 'Outro')} · ${i.dias.length === 7 ? 'todos os dias' : i.dias.map(n => DIAS[n]).join(', ')}</span></span><button class="btn btn-ghost btn-sm" data-del="${esc(i.id)}">Remover</button></div></div>`).join('') : '<div class="panel muted">Sua rotina está vazia.</div>'}`;
  let dias = [...UTEIS];
  $$('#n-dias [data-dia]').forEach(b => b.onclick = () => { const n = +b.dataset.dia; dias = dias.includes(n) ? dias.filter(x => x !== n) : [...dias, n]; b.classList.toggle('on'); });
  $('#n-ok').onclick = () => {
    if (!livre()) return;
    const hora = $('#n-h').value, titulo = $('#n-t').value.trim().slice(0, 80), tipo = $('#n-tp').value;
    if (!HORA.test(hora) || !titulo || !dias.length) return X.toast('Preencha horário, nome e pelo menos um dia.');
    d.itens.push({ id: uid(), hora, titulo, tipo: TIPOS[tipo] ? tipo : 'outro', dias: [...dias].sort() }); save(); rotina();
  };
  $$('[data-del]').forEach(b => b.onclick = () => { if (!livre()) return; d.itens = d.itens.filter(i => i.id !== b.dataset.del); save(); rotina(); });
  $('#i-agua').onclick = () => {
    if (!temAgua) { location.hash = '#/cuidar/alimentacao'; return X.toast('Preencha seu peso e veja a aba Água para calcular quanto você precisa.', 5000); }
    if (!livre()) return;
    d.itens = d.itens.filter(i => i.tipo !== 'agua');
    const pp = d.perfil || {}; completarAgua(d.itens, { acordar: pp.acordar || '07:00', dormir: pp.dormir || '22:00' }); save(); X.toast('Horários de água adicionados ✓'); rotina();
  };
  $('#i-ref').onclick = () => {
    if (!temPlano) { location.hash = '#/cuidar/alimentacao'; return X.toast('Monte seu plano alimentar e depois traga as refeições para cá.', 5000); }
    if (!livre()) return;
    let n = 0;
    for (const r of sa.planoAlimentar.refeicoes) { const hr = String(r.hora || '').padStart(5, '0').slice(0, 5); if (!HORA.test(hr) || !r.nome) continue; if (d.itens.some(i => i.tipo === 'refeicao' && i.hora === hr && i.titulo === r.nome)) continue; d.itens.push({ id: uid(), hora: hr, titulo: String(r.nome).slice(0, 80), tipo: 'refeicao', dias: [...TODOS] }); n++; }
    save(); X.toast(n ? n + ' refeições adicionadas ✓' : 'Suas refeições já estão aqui.'); rotina();
  };
  $('#n-ref').onclick = () => { if (!livre()) return; if (confirm('Refazer as perguntas e montar uma rotina nova? Isso troca a rotina atual.')) { d.perfil = null; d.itens = []; save(); perguntas(); } };
}

// ---------- férias e folgas ----------
function ferias() {
  const d = A(), t = today();
  d.ferias = d.ferias.filter(f => f.ate >= addDays(t, -30)); d.folgas = d.folgas.filter(f => f >= addDays(t, -30));
  $('#ag').innerHTML = `<div class="panel" style="margin-bottom:18px"><h3 style="margin:0 0 6px">Férias</h3><p class="small muted" style="margin:0 0 12px">Nesses dias, trabalho, estudo e deslocamento saem do seu checklist. O resto (água, refeições, treino, sono) continua.</p>
      <div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-end"><div class="field" style="margin:0"><label>De</label><input type="date" id="f-de" value="${t}"></div><div class="field" style="margin:0"><label>Até</label><input type="date" id="f-ate" value="${addDays(t, 7)}"></div><button class="btn btn-pink btn-sm" id="f-ok">Salvar férias</button></div>
      ${d.ferias.map((f, k) => `<div class="row" style="margin-top:12px"><span>${esc(fmtShort(f.de))} até ${esc(fmtShort(f.ate))}</span><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-fdel="${k}">Remover</button></div>`).join('')}</div>
    <div class="panel"><h3 style="margin:0 0 6px">Folga em um dia</h3><p class="small muted" style="margin:0 0 12px">Por exemplo: hoje você não foi trabalhar.</p>
      <div class="row" style="gap:12px;flex-wrap:wrap;align-items:flex-end"><div class="field" style="margin:0"><label>Dia</label><input type="date" id="g-d" value="${t}"></div><button class="btn btn-pink btn-sm" id="g-ok">Marcar folga</button></div>
      ${d.folgas.sort().map(f => `<div class="row" style="margin-top:12px"><span>${esc(fmtDay(f))}</span><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-gdel="${esc(f)}">Remover</button></div>`).join('')}</div>`;
  $('#f-ok').onclick = () => { if (!livre()) return; const de = $('#f-de').value, ate = $('#f-ate').value; if (!DATA.test(de) || !DATA.test(ate) || ate < de) return X.toast('Confira as datas.'); d.ferias.push({ de, ate }); save(); ferias(); };
  $$('[data-fdel]').forEach(b => b.onclick = () => { if (!livre()) return; d.ferias.splice(+b.dataset.fdel, 1); save(); ferias(); });
  $('#g-ok').onclick = () => { if (!livre()) return; const g = $('#g-d').value; if (!DATA.test(g)) return X.toast('Escolha o dia.'); if (!d.folgas.includes(g)) d.folgas.push(g); save(); ferias(); };
  $$('[data-gdel]').forEach(b => b.onclick = () => { if (!livre()) return; d.folgas = d.folgas.filter(f => f !== b.dataset.gdel); save(); ferias(); });
}

// ---------- falar com o IAlvorecer (texto ou voz) ----------
const SISTEMA = () => {
  const d = A(), t = today();
  return `Você é o IAlvorecer (uma IA, nunca se apresente com nome humano), ajudando a pessoa a organizar a agenda e a rotina dela. Escreva em português do Brasil, curto, acolhedor e prático.
Hoje é ${t} (dia da semana ${weekday(t)}; 0 = domingo). Perfil: ${JSON.stringify(d.perfil || {})}.
Rotina atual (id, hora, título, tipo, dias): ${JSON.stringify(d.itens.map(i => ({ id: i.id, hora: i.hora, titulo: i.titulo, tipo: i.tipo, dias: i.dias })))}.
Férias: ${JSON.stringify(d.ferias)}. Folgas: ${JSON.stringify(d.folgas)}. Hoje restam estes itens: ${JSON.stringify(itensDoDia(t).map(i => i.hora + ' ' + i.titulo))}.
Se a pessoa pedir mudanças (acrescentar, mover, tirar, férias, folga), faça-as em "ops". Se pedir sugestão de horário (ex.: "hoje não fui trabalhar, qual o melhor horário para treinar?"), proponha UM horário que caiba nos intervalos livres e depois das refeições, explique em 1 frase e só adicione em "ops" se ela aceitar ou pedir para marcar.
Se for sobre saúde (treino, comida, água), seja prudente e lembre que não substitui profissional quando fizer sentido.
Tipos válidos: ${Object.keys(TIPOS).join(', ')}. Formato dos ops: {"op":"add","hora":"HH:MM","titulo":"...","tipo":"...","dias":[0-6]} | {"op":"edit","id":"...","hora":"HH:MM","titulo":"...","dias":[0-6]} | {"op":"remove","id":"..."} | {"op":"ferias","de":"AAAA-MM-DD","ate":"AAAA-MM-DD"} | {"op":"folga","data":"AAAA-MM-DD"}.
Responda JSON apenas: {"reply":"...","ops":[]}`;
};
function aplicarOps(ops) {
  const d = A(), feito = [];
  const dias = v => Array.isArray(v) ? [...new Set(v.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6))].sort() : null;
  for (const o of (Array.isArray(ops) ? ops : []).slice(0, 8)) {
    if (!o || typeof o !== 'object') continue;
    if (o.op === 'add' && HORA.test(o.hora) && typeof o.titulo === 'string' && o.titulo.trim()) {
      const dd = dias(o.dias); d.itens.push({ id: uid(), hora: o.hora, titulo: o.titulo.trim().slice(0, 80), tipo: TIPOS[o.tipo] ? o.tipo : 'outro', dias: dd?.length ? dd : [weekday()] }); feito.push(`Adicionei ${o.hora} · ${o.titulo.trim().slice(0, 80)}`);
    } else if (o.op === 'edit') {
      const i = d.itens.find(x => x.id === o.id); if (!i) continue;
      if (HORA.test(o.hora)) i.hora = o.hora; if (typeof o.titulo === 'string' && o.titulo.trim()) i.titulo = o.titulo.trim().slice(0, 80); const dd = dias(o.dias); if (dd?.length) i.dias = dd;
      feito.push(`Mudei "${i.titulo}" (${i.hora})`);
    } else if (o.op === 'remove') {
      const i = d.itens.find(x => x.id === o.id); if (!i) continue; d.itens = d.itens.filter(x => x !== i); feito.push(`Removi "${i.titulo}"`);
    } else if (o.op === 'ferias' && DATA.test(o.de) && DATA.test(o.ate) && o.ate >= o.de) { d.ferias.push({ de: o.de, ate: o.ate }); feito.push(`Férias de ${fmtShort(o.de)} até ${fmtShort(o.ate)}`); }
    else if (o.op === 'folga' && DATA.test(o.data)) { if (!d.folgas.includes(o.data)) d.folgas.push(o.data); feito.push(`Folga em ${fmtShort(o.data)}`); }
  }
  if (feito.length) save();
  return feito;
}
function ajustar() {
  const hist = [];
  $('#ag').innerHTML = `<p class="muted" style="margin:0 0 14px;max-width:720px">Conte o que mudou ou o que você quer encaixar. Exemplos: "hoje não fui trabalhar, qual horário é melhor para treinar?", "entrei de férias até dia 30", "troque o jantar para 20h".</p>
    <div class="panel" id="ag-log" style="min-height:120px;margin-bottom:14px"></div>
    <div class="row" style="gap:10px;align-items:flex-end"><textarea id="ag-t" rows="2" maxlength="600" style="flex:1" placeholder="Escreva ou use o microfone"></textarea>${canListen ? '<button class="btn btn-ghost" id="ag-mic">Falar</button>' : ''}<button class="btn btn-pink" id="ag-go">Enviar</button></div>`;
  const log = $('#ag-log'), txt = $('#ag-t'); let busy = false, parar = null;
  const add = (cls, html) => { log.insertAdjacentHTML('beforeend', `<div style="margin:0 0 12px;${cls === 'me' ? 'text-align:right;opacity:.8' : ''}">${html}</div>`); log.scrollTop = log.scrollHeight; };
  add('ai', 'Oi! O que você quer ajustar na sua agenda?');
  X.setCleanup(() => { parar?.(); });
  const enviar = async () => {
    const t = txt.value.trim(); if (!t || busy) return; if (!livre()) return;
    busy = true; txt.value = ''; hist.push({ role: 'me', text: t }); add('me', esc(t));
    try {
      const r = await X.AI.chat({ system: SISTEMA(), history: hist.slice(-12) });
      const feito = aplicarOps(r.ops), resp = String(r.reply || '…').slice(0, 1200); hist.push({ role: 'ai', text: resp });
      add('ai', esc(resp) + (feito.length ? `<div class="small muted" style="margin-top:6px">${feito.map(f => '· ' + esc(f)).join('<br>')}</div>` : ''));
    } catch (e) { add('ai', 'Não consegui responder agora: ' + esc(e.message)); }
    busy = false;
  };
  $('#ag-go').onclick = enviar;
  txt.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); } };
  const mic = $('#ag-mic');
  if (mic) mic.onclick = () => {
    if (parar) { parar(); parar = null; mic.textContent = 'Falar'; return; }
    mic.textContent = 'Parar';
    parar = listen('pt-BR', { onText: (f, i) => { txt.value = (f + ' ' + i).trim(); }, onEnd: () => { parar = null; mic.textContent = 'Falar'; }, onError: m => X.toast(m) });
  };
}
