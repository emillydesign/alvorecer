// "Mais tempo para você": pesquisa de como a pessoa quer trabalhar e um plano para ter trabalho melhor e mais tempo livre.
// Arquivo à parte: só carrega quando a pessoa abre #/tempo.
import { $, $$, esc, md } from './util.js';

let X; // { S, AI, app, toast }
export function initTempo(ctx) { X = ctx; }

const ETICA = `Você é o IAlvorecer (uma IA, nunca com nome humano), criado pela designer Emilly Urbano para ajudar quem não pode pagar mentoria ou profissionais. Você ajuda a pessoa a planejar um trabalho melhor para ter mais tempo livre e uma vida com qualidade, na área que ela quer. Seja honesto e realista: NUNCA invente salários, estatísticas, vagas, empresas ou links. Dê faixas gerais só quando tiver segurança e diga que variam por cidade e experiência. Sugira só ferramentas e plataformas gratuitas ou com plano grátis. Não prometa resultados; mostre caminhos em passos pequenos. Nunca sugira nada ilegal, golpes, esquemas de dinheiro fácil ou conteúdo +18. Escreva em português do Brasil, caloroso, claro e sem jargão.`;

const PERGUNTAS = [
  { id: 'quando', t: 'one', l: 'Em qual horário você prefere trabalhar?', o: ['Manhã', 'Tarde', 'Noite', 'Horário comercial', 'Flexível, eu escolho'] },
  { id: 'horas', t: 'one', l: 'Quantas horas por dia você quer passar trabalhando?', o: ['Até 4 horas (meio período ou menos)', 'Cerca de 6 horas', 'Cerca de 8 horas', 'Tanto faz, o que paga melhor'] },
  { id: 'onde', t: 'one', l: 'Onde você quer trabalhar?', o: ['Home office', 'Híbrido', 'Presencial perto de casa', 'Presencial, tanto faz onde', 'Viajando ou de qualquer lugar'] }
];

const st = () => ((X.S.state.tempo ||= { resp: {}, plano: null }));
const save = () => X.S.saveState();

export async function tempo() {
  const d = st();
  X.app.innerHTML = `<a class="back" href="#/">Início</a><div class="eyebrow" style="margin-top:22px">Mais tempo para você</div>
    <h1 style="margin:10px 0 10px">Um trabalho melhor para ter mais tempo de se cuidar</h1>
    <p class="muted" style="max-width:760px">Muita gente não consegue dormir bem, treinar ou comer direito por causa das horas de trabalho e de transporte. Responda rapidinho e o IAlvorecer monta um caminho para um trabalho que pague bem e deixe tempo livre, na área que você quer.</p>
    <div class="notice" style="margin:18px 0 26px">É uma IA de apoio: ela mostra caminhos, mas pode errar e não promete resultados. Confira informações de vagas e valores em fontes reais.</div><div id="tp"></div>`;
  if (d.plano) return plano(); perguntas();
}

function perguntas() {
  const d = st();
  $('#tp').innerHTML = `<div class="panel"><h3>Como você quer trabalhar?</h3>
    ${PERGUNTAS.map(q => `<div class="field"><label>${esc(q.l)}</label><div class="chips">${q.o.map(o => `<button class="chip ${d.resp[q.id] === o ? 'on' : ''}" data-q="${q.id}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
    <div class="field"><label>Em qual área você quer trabalhar?</label><input id="tp-area" maxlength="80" value="${esc(d.resp.area || '')}" placeholder="Ex.: design, tecnologia, saúde…"><label class="check small" style="margin-top:8px;gap:6px"><input type="checkbox" id="tp-sem" style="width:auto" ${d.resp.semArea ? 'checked' : ''}> Não tenho uma área específica: recomende as que pagam melhor</label></div>
    <div class="field"><label>Conte um pouco da sua situação (opcional)</label><textarea id="tp-ctx" rows="3" placeholder="Ex.: hoje trabalho 10 horas e perco 2 horas no transporte; o que já sei fazer; o que me impede…">${esc(d.resp.extra || '')}</textarea></div>
    <button class="btn btn-pink" id="tp-ok">Montar meu caminho</button></div>`;
  $$('[data-q]').forEach(b => b.onclick = () => { $$(`[data-q="${b.dataset.q}"]`).forEach(x => x.classList.toggle('on', x === b)); });
  $('#tp-ok').onclick = async e => {
    if (X.S.readonly) return X.toast('Modo visitante: crie sua conta para montar seu caminho.');
    const resp = { extra: $('#tp-ctx').value.trim().slice(0, 800), area: $('#tp-area').value.trim().slice(0, 80), semArea: $('#tp-sem').checked };
    PERGUNTAS.forEach(q => { resp[q.id] = $$(`[data-q="${q.id}"]`).find(b => b.classList.contains('on'))?.dataset.v || ''; });
    if (!resp.horas || !resp.onde) return X.toast('Escolha pelo menos quantas horas e onde você quer trabalhar.');
    if (!resp.area && !resp.semArea) return X.toast('Diga a área ou marque que não tem uma específica.');
    d.resp = resp; e.target.disabled = true; e.target.innerHTML = '<span class="spin"></span> Montando seu caminho…';
    const parcial = /^Até 4/.test(resp.horas);
    try {
      const mem = await memoria();
      const r = await X.AI.gen({ prompt: `${ETICA}${mem}
Respostas da pessoa: ${JSON.stringify(resp)}
Monte um caminho realista para ela conseguir um trabalho melhor, com mais tempo livre e boa qualidade de vida. ${resp.semArea ? 'Ela não tem área definida: recomende 4 a 6 áreas que costumam pagar bem e combinar com o que ela contou, explicando por quê.' : 'Foque na área que ela escolheu.'} ${parcial ? 'Ela quer meio período ou menos: explique como funciona o trabalho freelancer (como começar, onde oferecer serviços de graça, como montar portfólio, precificar sem se desvalorizar, e divulgar o próprio trabalho em redes sociais), além de MEI.' : 'Se fizer sentido, cite também o freelancer como complemento.'} Considere o horário e o local que ela quer (home office, híbrido, presencial). Inclua um plano de 30/60/90 dias com passos pequenos, e como usar os cursos do IAlvorecer (currículo, entrevistas, portfólio, negociação, comunicação) e a mentoria de carreira.
Responda só JSON: {"resumo":"2 a 3 frases acolhedoras","caminhos":[{"titulo":"...","texto":"markdown curto","passos":["..."]}],"freelancer":"markdown sobre freelancer (ou vazio se não se aplica)","plano_90":[{"quando":"Primeiros 30 dias","passos":["..."]}],"tempo_livre":"dicas para ganhar tempo no dia a dia, incluindo transporte","aviso":"uma frase honesta lembrando que valores e vagas variam"}` , temperature: 0.4 });
      d.plano = { ...r, em: new Date().toISOString() }; save(); plano();
    } catch (err) { e.target.disabled = false; e.target.textContent = 'Tentar de novo'; X.toast(err.message || 'Não deu certo, tente de novo.'); }
  };
}

const memoria = async () => { try { const M = await import('./memoria.js?v=1'); return M.linhaParaPrompt(X.S); } catch { return ''; } };

function plano() {
  const p = st().plano;
  $('#tp').innerHTML = `<div class="panel"><p style="margin:0">${md(String(p.resumo || ''))}</p></div>
    ${(p.caminhos || []).map(c => `<div class="panel" style="margin-top:18px"><h3>${esc(c.titulo)}</h3>${md(String(c.texto || ''))}${(c.passos || []).length ? `<ol>${c.passos.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}</div>`).join('')}
    ${p.freelancer ? `<div class="panel" style="margin-top:18px"><h3>Trabalhar por conta própria (freelancer)</h3>${md(String(p.freelancer))}</div>` : ''}
    ${(p.plano_90 || []).length ? `<div class="panel" style="margin-top:18px"><h3>Seu plano de 90 dias</h3>${p.plano_90.map(f => `<h4 style="margin:12px 0 6px">${esc(f.quando)}</h4><ul>${(f.passos || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>`).join('')}</div>` : ''}
    ${p.tempo_livre ? `<div class="panel" style="margin-top:18px"><h3>Ganhando tempo no dia a dia</h3>${md(String(p.tempo_livre))}</div>` : ''}
    <div class="panel" style="margin-top:18px"><h3>Você não precisa passar por isso sozinha(o)</h3><p class="muted">Na mentoria de carreira você pode conversar sobre sua história de vida e, se estiver passando por algo difícil, desabafar. Ela também ajuda com currículo, entrevistas e seu plano de carreira.</p><div class="row" style="gap:10px;flex-wrap:wrap"><a class="btn btn-pink" href="#/mentoria">Ir para a mentoria de carreira</a><a class="btn btn-ghost" href="#/trilha/tech">Cursos de carreira</a><a class="btn btn-ghost" href="#/cuidar/desabafo">Desabafar</a></div></div>
    <p class="small muted" style="margin-top:16px">${esc(p.aviso || 'Valores, vagas e prazos variam por cidade e experiência. Use como ponto de partida.')}</p>
    <div class="row" style="margin-top:16px"><button class="btn btn-ghost btn-sm" id="tp-refaz">Refazer as perguntas</button></div>`;
  $('#tp-refaz').onclick = () => { st().plano = null; save(); perguntas(); };
}
