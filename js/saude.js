// Cuidar de mim: desabafo, alimentação + água + foto do prato, treino.
// IA de apoio: NÃO substitui psicólogo, nutricionista, educador físico ou médico.
import { $, $$, esc, md, today, uid, addDays } from './util.js';
import { listen, canListen, stopSpeaking } from './speech.js?v=57';

let X; // contexto: { S, AI, app, toast, spinner, errBox, setCleanup }
export function initSaude(ctx) { X = ctx; }

const ETICA = `Você é o IAlvorecer: uma IA (nunca se apresente com nome humano) que faz de tudo para as coisas darem certo e ajuda cada pessoa a se planejar e conquistar o que quer. Foi criado pela designer Emilly Urbano para ajudar quem não pode pagar profissionais. Você é uma IA de apoio, não um profissional de saúde: seja uma base sólida e honesta.
JEITO DE SER: humana, calorosa, carinhosa e esforçada para entender de verdade. Nada de respostas robóticas de atendimento. Se faltar alguma informação, faça a melhor suposição razoável, diga qual foi e siga ajudando; pergunte no máximo uma coisa por vez.
HONESTIDADE: não passe pano para o que prejudica a pessoa ou os outros, mas sem julgamento nem sermão. Não diga que está tudo bem quando não está, e não concorde só para agradar.
SEM TERRORISMO: não diagnostique, não rotule (nada de "você é psicopata/manipulador/depressivo") e não transforme algo leve em algo grave.
SAÚDE FÍSICA: para dor, lesão, sintomas, remédios ou exames, oriente com calma a procurar a UBS/posto de saúde (atendimento gratuito pelo SUS) para avaliação. Emergência (dor no peito, falta de ar, desmaio, sangramento forte, pensamentos de se machucar): oriente ajuda imediata — SAMU 192, UPA, CVV 188.
CONDIÇÕES ESPECIAIS (diabetes, problemas de tireoide, doença celíaca, hipertensão, doença renal, gestação, transtorno alimentar etc.): dê orientações gerais e seguras e reforce acompanhamento profissional gratuito (UBS, nutricionista do SUS, clínicas-escola de universidades).
NUNCA: dietas abaixo da taxa metabólica basal sem acompanhamento, remédios ou suplementos para emagrecer, treinos perigosos para iniciantes.
Escreva em português do Brasil, claro e acolhedor. Lembre, quando fizer sentido (sem repetir toda hora), que você é uma IA e pode errar.`;

const H = () => (X.S.state.health ||= { profile: {}, water: {}, food: {}, workouts: {} });
const save = () => X.S.saveState();
const P = () => H().profile;

// ---------- cálculos ----------
export function calc(p = P()) {
  const w = +p.peso, h = +p.altura, a = +p.idade;
  if (!w || !h || !a) return null;
  const base = 10 * w + 6.25 * h - 5 * a;
  const tmb = Math.round(base + (p.sexo === 'masculino' ? 5 : p.sexo === 'feminino' ? -161 : -78));
  const f = { sedentaria: 1.2, leve: 1.375, moderada: 1.55, intensa: 1.725 }[p.atividade || 'leve'];
  const gasto = Math.round(tmb * f);
  const meta = p.objetivo === 'emagrecer' ? Math.max(tmb, Math.round(gasto - Math.min(500, gasto * 0.15))) : p.objetivo === 'ganhar' ? Math.round(gasto * 1.1) : gasto;
  const agua = Math.round((35 * w + (['moderada', 'intensa'].includes(p.atividade) ? 500 : 0)) / 50) * 50;
  const imc = +(w / ((h / 100) ** 2)).toFixed(1);
  return { tmb, gasto, meta, agua, imc };
}

const TABELA = [
  ['1 ovo cozido', 70], ['1 colher de sopa de óleo', 108], ['1 colher de sopa de azeite', 108], ['1 colher de chá de manteiga', 35], ['1 colher de sopa de açúcar', 48],
  ['4 colheres de sopa de arroz (100 g)', 128], ['1 concha de feijão (100 g)', 76], ['1 pão francês (50 g)', 140], ['1 fatia de pão de forma', 65], ['1 tapioca média (goma 50 g)', 170],
  ['100 g de macarrão cozido', 158], ['100 g de cuscuz', 112], ['100 g de peito de frango grelhado', 165], ['100 g de carne bovina (patinho)', 220], ['1 fatia de queijo mussarela (20 g)', 60],
  ['1 fatia de presunto (15 g)', 20], ['1 copo de leite integral (200 ml)', 120], ['1 iogurte natural (170 g)', 110], ['1 banana média', 90], ['1 maçã média', 70],
  ['2 colheres de sopa de aveia (20 g)', 75], ['1 lata de refrigerante (350 ml)', 140], ['1 lata de cerveja (350 ml)', 150], ['1 fatia de pizza', 280], ['1 hambúrguer de lanchonete', 500],
  ['100 g de batata frita', 310], ['1 barra pequena de chocolate (25 g)', 135], ['1 coxinha média', 220]
];

// ---------- layout comum ----------
const AVISO = `<div class="notice" style="margin:18px 0 26px">💡 Esta é uma IA de apoio do IAlvorecer: ajuda como base, mas <b>não substitui</b> psicólogo, nutricionista, educador físico ou médico, e pode errar. Em emergência: <b>SAMU 192</b> · Apoio emocional 24h e gratuito: <b>CVV 188</b> (ou chat em cvv.org.br) · Avaliação gratuita: UBS/posto de saúde (SUS).</div>`;
const head = (eyebrow, title, sub) => `<a class="back" href="#/cuidar">← Cuidar de mim</a><div class="eyebrow" style="margin-top:22px">${eyebrow}</div><h1 style="margin:10px 0 10px">${title}</h1>${sub ? `<p class="muted" style="max-width:720px">${sub}</p>` : ''}`;

// ---------- HUB ----------
export async function cuidar(sub) {
  if (sub === 'desabafo') return desabafo();
  if (sub === 'alimentacao') return alimentacao();
  if (sub === 'treino') return treino();
  const c = calc();
  const water = H().water[today()] || 0;
  X.app.innerHTML = `<div class="eyebrow">Seu Alvorecer · Cuidar de mim</div><h1 style="margin:10px 0 12px">Cuidar de você também é aprender</h1>
  <p class="muted" style="max-width:760px">Um espaço para desabafar, comer melhor, beber água e treinar com segurança, feito para quem não pode pagar por esses profissionais agora. Com carinho e honestidade: sem terror, sem enganação.</p>
  ${AVISO}
  <div class="grid g3">
    ${[['desabafo', 'message-circle-heart', 'Desabafo', 'Fale com o IAlvorecer quando precisar ser ouvida(o). Acolhimento de verdade, com honestidade.', ['#5eead4', '#6366f1']],
       ['alimentacao', 'salad', 'Alimentação & Água', 'Calorias sem neura, plano alimentar do seu jeito, água do dia e foto do prato.', ['#86efac', '#0ea5e9']],
       ['treino', 'dumbbell', 'Treino', 'Treino montado para o seu objetivo, corpo e rotina, em casa ou na academia.', ['#7dd3fc', '#4f46e5']]]
      .map(([id, i, t, s, g]) => `<a class="area pat-rings" href="#/cuidar/${id}" style="background:linear-gradient(150deg,${g[0]},${g[1]})"><div><span class="aic"><i data-lucide="${i}"></i></span><h3>${t}</h3><p>${s}</p></div><span class="btn btn-pink btn-sm" style="align-self:flex-start;margin-top:18px">Abrir</span></a>`).join('')}
  </div>
  <div class="section panel"><div class="row"><h3>Seu perfil de saúde</h3><span class="spacer"></span>${c ? `<span class="small muted">IMC ${c.imc} · gasto ~${c.gasto} kcal/dia · água ~${(c.agua / 1000).toFixed(1)} L/dia</span>` : ''}</div>
    <p class="small muted" style="margin:6px 0 18px">Usado pela alimentação e pelo treino. Fica só na sua conta. Preencha o que quiser.</p>${perfilForm()}</div>
  ${c ? `<div class="section panel"><h3>Hoje</h3><div class="stats" style="margin-top:14px"><div class="stat"><b>${(water / 1000).toFixed(1)} / ${(c.agua / 1000).toFixed(1)} L</b><span>água</span></div><div class="stat"><b>${(H().food[today()] || []).reduce((a, x) => a + (+x.kcal || 0), 0)} / ${c.meta}</b><span>kcal estimadas</span></div><div class="stat"><b>${Object.keys(H().workouts).filter(d => d >= addDays(today(), -6)).length}</b><span>treinos nos últimos 7 dias</span></div></div></div>` : ''}`;
  bindPerfil();
}
function perfilForm() {
  const p = P();
  const opt = (id, v, l) => `<option value="${v}" ${p[id] === v ? 'selected' : ''}>${l}</option>`;
  const conds = ['Diabetes', 'Pré-diabetes', 'Hipotireoidismo', 'Hipertensão', 'Doença celíaca', 'Intolerância à lactose', 'SOP', 'Gestante', 'Vegetariana(o)', 'Vegana(o)'];
  return `<div class="grid g4">
    <div class="field"><label>Idade</label><input id="hp-idade" type="number" min="12" max="110" value="${esc(p.idade || '')}"></div>
    <div class="field"><label>Altura (cm)</label><input id="hp-altura" type="number" min="100" max="230" value="${esc(p.altura || '')}"></div>
    <div class="field"><label>Peso (kg)</label><input id="hp-peso" type="number" min="25" max="300" step="0.1" value="${esc(p.peso || '')}"></div>
    <div class="field"><label>Sexo (para os cálculos)</label><select id="hp-sexo">${opt('sexo', '', 'Prefiro não dizer')}${opt('sexo', 'feminino', 'Feminino')}${opt('sexo', 'masculino', 'Masculino')}</select></div>
    <div class="field"><label>Atividade física</label><select id="hp-atividade">${opt('atividade', 'sedentaria', 'Quase nenhuma')}${opt('atividade', 'leve', 'Leve (1–2x/sem)')}${opt('atividade', 'moderada', 'Moderada (3–4x/sem)')}${opt('atividade', 'intensa', 'Intensa (5x+/sem)')}</select></div>
    <div class="field"><label>Objetivo</label><select id="hp-objetivo">${opt('objetivo', 'saude', 'Mais saúde e energia')}${opt('objetivo', 'emagrecer', 'Emagrecer')}${opt('objetivo', 'manter', 'Manter o peso')}${opt('objetivo', 'ganhar', 'Ganhar massa')}</select></div>
    <div class="field"><label>Acorda às</label><input id="hp-acorda" type="time" value="${esc(p.acorda || '07:00')}"></div>
    <div class="field"><label>Dorme às</label><input id="hp-dorme" type="time" value="${esc(p.dorme || '23:00')}"></div>
  </div>
  <div class="field"><label>Condições e restrições</label><div class="chips">${conds.map(c => `<button class="chip ${(p.condicoes || []).includes(c) ? 'on' : ''}" data-cond="${esc(c)}">${c}</button>`).join('')}</div></div>
  <div class="grid g2"><div class="field"><label>Alergias ou intolerâncias</label><input id="hp-alergias" value="${esc(p.alergias || '')}" placeholder="Ex.: camarão, amendoim, glúten…"></div>
  <div class="field"><label>Outras observações de saúde</label><input id="hp-obs" value="${esc(p.obs || '')}" placeholder="Ex.: dor no joelho, remédio para pressão…"></div></div>
  <button class="btn btn-pink btn-sm" id="hp-save">Salvar perfil</button>`;
}
function bindPerfil() {
  $$('[data-cond]').forEach(b => b.onclick = () => b.classList.toggle('on'));
  $('#hp-save') && ($('#hp-save').onclick = () => {
    if (X.S.readonly) return X.toast('Modo visitante: crie sua conta para salvar.');
    const p = P();
    for (const k of ['idade', 'altura', 'peso', 'sexo', 'atividade', 'objetivo', 'acorda', 'dorme', 'alergias', 'obs']) p[k] = $('#hp-' + k).value.trim();
    p.condicoes = $$('[data-cond]').filter(b => b.classList.contains('on')).map(b => b.dataset.cond);
    save(); X.toast('Perfil salvo ✓'); X.rerender();
  });
}
const perfilTxt = () => { const p = P(), c = calc(); return JSON.stringify({ ...p, calculos: c, nome: X.S.state.profile.name }); };

// ---------- CHAT reutilizável (com conversa salva) ----------
function chat({ box, name, avatar, system, draft, placeholder, onReply }) {
  box.innerHTML = `<div class="chat" style="height:min(620px,calc(100vh - 220px))"><div class="chat-top"><div class="avatar" style="width:42px;height:42px">${avatar}</div><div><b>${name}</b><div class="small muted" id="ch-sub">A conversa fica salva só na sua conta</div></div><span class="spacer"></span><button class="btn btn-ghost btn-sm" id="ch-clear">🗑 Apagar conversa</button></div>
    <div class="msgs" id="ch-msgs"></div>
    <div class="composer">${canListen ? '<button class="mic" id="ch-mic">🎙</button>' : ''}<textarea id="ch-txt" rows="1" placeholder="${placeholder}"></textarea><button class="send" id="ch-send">➤</button></div></div>`;
  let hist = [], busy = false, stopMic = null;
  const msgs = $('#ch-msgs', box), txt = $('#ch-txt', box);
  const add = (role, text) => { const d = document.createElement('div'); d.className = 'msg ' + role; if (role === 'ai') d.innerHTML = md(text); else d.textContent = text; msgs.append(d); msgs.scrollTop = msgs.scrollHeight; };
  const store = () => !X.S.readonly && X.S.write(draft, { updated: new Date().toISOString(), history: hist.slice(-80) });
  X.setCleanup(() => { stopMic?.(); stopSpeaking(); });
  async function turn() {
    busy = true; const ty = document.createElement('div'); ty.className = 'typing'; ty.textContent = `O ${name} está escrevendo…`; msgs.append(ty);
    try {
      const r = await X.AI.chat({ system: system(), history: hist.slice(-30) });
      ty.remove(); const reply = r.reply || '…'; hist.push({ role: 'ai', text: reply }); add('ai', reply); onReply?.(r); store();
    } catch (e) { ty.remove(); add('ai', '⚠️ ' + e.message); }
    busy = false;
  }
  async function send() {
    const t = txt.value.trim(); if (!t || busy) return;
    if (X.S.readonly) { txt.value = ''; add('me', t); add('ai', 'No modo visitante dá pra conhecer tudo, mas para conversar comigo é preciso criar uma conta grátis. Vai ser um prazer te ouvir. 💛'); return; }
    stopMic?.(); stopMic = null; $('#ch-mic', box)?.classList.remove('rec');
    txt.value = ''; hist.push({ role: 'me', text: t }); add('me', t); store(); await turn();
  }
  $('#ch-send', box).onclick = send;
  txt.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  $('#ch-mic', box) && ($('#ch-mic', box).onclick = () => {
    if (stopMic) { stopMic(); stopMic = null; $('#ch-mic', box).classList.remove('rec'); setTimeout(send, 250); return; }
    const base = txt.value ? txt.value + ' ' : ''; $('#ch-mic', box).classList.add('rec');
    stopMic = listen('pt-BR', { onText: (f, i) => txt.value = base + f + (i ? ' ' + i : ''), onError: m => { X.toast(m); $('#ch-mic', box)?.classList.remove('rec'); stopMic = null; } });
  });
  $('#ch-clear', box).onclick = () => { if (!confirm('Apagar esta conversa? Não dá pra desfazer.')) return; hist = []; msgs.innerHTML = ''; store(); turn(); };
  (async () => {
    const d = X.S.readonly ? null : await X.S.read(draft);
    hist = d?.history || [];
    hist.forEach(m => add(m.role, m.text));
    if (hist.length) $('#ch-sub', box).textContent = 'Continuando de onde vocês pararam · salva só na sua conta';
    else if (!X.S.readonly) turn(); else add('ai', `Oi! Eu sou o ${name}. Crie sua conta grátis para conversarmos. 💛`);
  })();
}

// ---------- DESABAFO ----------
async function desabafo() {
  X.app.innerHTML = head('Desabafo', 'Aqui você pode falar', 'O IAlvorecer escuta de verdade, ajuda a entender o que você sente e a encontrar caminhos, com carinho e honestidade. Se for algo pesado ou que dura muito tempo, ele vai te ajudar a achar apoio profissional gratuito.') + AVISO + '<div id="box"></div>';
  chat({
    box: $('#box'), name: 'IAlvorecer', avatar: 'IA', draft: 'conversas/desabafo.json', placeholder: 'Escreva o que está sentindo…',
    system: () => `${ETICA}
Você está no modo de escuta acolhedora do IAlvorecer (você não é psicólogo). Pessoa: ${perfilTxt()}.
COMO CONVERSAR: escute de verdade, valide o sentimento (não necessariamente a atitude), faça perguntas abertas, ajude a nomear emoções, ofereça técnicas simples quando fizer sentido (respiração 4-7-8, aterramento 5-4-3-2-1, escrever, pausas, rotina de sono), ajude a ver outras perspectivas com gentileza — inclusive a parte de responsabilidade da própria pessoa, sem culpa. Incentive a rede de apoio. Respostas curtas e humanas (2 a 6 frases), sem listas longas.
Se for algo persistente, intenso ou que atrapalhe a vida: sugira, sem alarme, apoio gratuito — UBS/CAPS, clínicas-escola de psicologia de universidades, CVV 188.
RISCO: se a pessoa falar em querer morrer, se machucar ou machucar alguém, ou estiver em perigo, acolha imediatamente, pergunte se está em segurança agora, indique CVV 188 (24h, gratuito), SAMU 192 ou 190 se houver perigo imediato, e continue presente na conversa.
Primeira mensagem (se a conversa estiver vazia): apresente-se como o IAlvorecer em 2 frases calorosas e pergunte como a pessoa está se sentindo hoje.
Responda JSON: {"reply":"..."}`
  });
}

// ---------- ALIMENTAÇÃO & ÁGUA ----------
let aguaTimer = null;
async function alimentacao(tab = 'plano') {
  const c = calc(), h = H();
  const hoje = h.food[today()] || [];
  const total = hoje.reduce((a, x) => a + (+x.kcal || 0), 0);
  X.app.innerHTML = head('Alimentação & Água', 'Comer bem, do seu jeito', 'Sem dieta da moda e sem cortar o que você gosta: a ideia é entender, ajustar aos poucos e criar hábitos que duram.') + AVISO +
    (c ? '' : `<div class="panel" style="margin-bottom:24px"><h3>Primeiro, seu perfil</h3><p class="small muted" style="margin:6px 0 16px">Com idade, altura, peso e rotina eu consigo calcular suas calorias e sua água.</p>${perfilForm()}</div>`) +
    `<div class="tabs">${[['plano', 'Plano alimentar'], ['foto', 'Foto do prato'], ['calorias', 'Aprender calorias'], ['agua', 'Água'], ['chat', 'Falar com o IAlvorecer']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div><div id="nt"></div>`;
  if (!c) bindPerfil();
  $$('[data-tab]').forEach(b => b.onclick = () => alimentacao(b.dataset.tab));
  const el = $('#nt');
  if (tab === 'plano') {
    const pl = h.planoAlimentar;
    el.innerHTML = `${c ? `<div class="stats" style="margin-bottom:22px"><div class="stat"><b>${c.meta}</b><span>kcal/dia para o seu objetivo</span></div><div class="stat"><b>${c.tmb}</b><span>kcal mínimas (taxa basal)</span></div><div class="stat"><b>${total}</b><span>kcal estimadas hoje</span></div></div>` : ''}
      <div class="panel"><h3>Como é a sua alimentação hoje?</h3><p class="small muted" style="margin:6px 0 14px">Conte do seu jeito: horários, o que costuma comer, se come pouco ou muitas vezes, se prefere lanche a almoço… Quanto mais real, melhor o plano.</p>
      <textarea id="rotina" rows="4" placeholder="Ex.: acordo 7h e tomo só café; almoço 13h arroz, feijão e frango; à tarde belisco bolacha; à noite prefiro um sanduíche…">${esc(h.rotinaAlimentar || '')}</textarea>
      <button class="btn btn-pink" id="gerar" style="margin-top:14px">${pl ? 'Refazer meu plano' : 'Montar meu plano'}</button></div>
      <div id="planobox" class="section" style="margin-top:28px">${pl ? planoHTML(pl) : ''}</div>`;
    $('#gerar').onclick = async e => {
      if (X.S.readonly) return X.toast('Modo visitante: crie sua conta para montar seu plano.');
      h.rotinaAlimentar = $('#rotina').value.trim(); e.target.disabled = true; e.target.innerHTML = '<span class="spin"></span> Montando…';
      try {
        const r = await X.AI.gen({ prompt: `${ETICA}\nVocê está no modo de apoio à alimentação do IAlvorecer (você não é nutricionista). Monte um PLANO ALIMENTAR realista e gostoso para esta pessoa: ${perfilTxt()}\nRotina e preferências: ${h.rotinaAlimentar || 'não informou'}.\nRegras: respeite o que ela gosta (ex.: se prefere sanduíche, mostre como deixá-lo mais nutritivo em vez de proibir); ajuste horários à rotina; comidas brasileiras e baratas; nunca abaixo da taxa basal; considere alergias e condições (e reforce acompanhamento quando houver).\nResponda JSON: {"resumo":"2-3 frases","kcal":numero,"refeicoes":[{"hora":"07:30","nome":"Café da manhã","opcoes":["opção 1 com quantidades caseiras","opção 2"],"kcal":numero}],"trocas":["trocas inteligentes"],"dicas":["dicas práticas"],"avisos":["avisos importantes, se houver"]}` });
        h.planoAlimentar = r; save(); $('#planobox').innerHTML = planoHTML(r);
      } catch (er) { X.toast('⚠️ ' + er.message, 6000); }
      e.target.disabled = false; e.target.textContent = 'Refazer meu plano';
    };
  } else if (tab === 'foto') {
    el.innerHTML = `<div class="grid g2"><div class="panel"><h3>Descubra as calorias do seu prato</h3><p class="small muted" style="margin:6px 0 16px">Tire ou envie uma foto. É uma <b>estimativa</b>: sem pesar, não dá para saber com certeza. Uma descrição ajuda muito (opcional).</p>
      <input type="file" id="foto" accept="image/*" capture="environment" style="margin-bottom:12px"><img id="prev" style="max-width:100%;border-radius:16px;display:none;margin-bottom:12px">
      <div class="field"><label>Descrição (opcional)</label><textarea id="fdesc" rows="2" placeholder="Ex.: 3 colheres de arroz, 1 concha de feijão, 1 filé de frango grelhado"></textarea></div>
      <button class="btn btn-pink" id="estimar">Estimar calorias</button></div>
      <div class="panel" id="res"><h3>Resultado</h3><p class="small muted" style="margin-top:6px">Envie uma foto ou só a descrição.</p></div></div>
      ${hoje.length ? `<div class="section panel"><h3>Seu dia</h3>${hoje.map(x => `<div class="row small" style="padding:8px 0;border-bottom:1px solid var(--line)"><span>${esc(x.desc)}</span><span class="spacer"></span><b>~${x.kcal} kcal</b></div>`).join('')}<div class="row" style="margin-top:10px"><b>Total estimado</b><span class="spacer"></span><b>~${total}${c ? ' / ' + c.meta : ''} kcal</b></div></div>` : ''}`;
    let img = null;
    $('#foto').onchange = async e => { const f = e.target.files[0]; if (!f) return; img = await compress(f); $('#prev').src = 'data:image/jpeg;base64,' + img; $('#prev').style.display = 'block'; };
    $('#estimar').onclick = async e => {
      if (X.S.readonly) return X.toast('Modo visitante: crie sua conta para usar.');
      const desc = $('#fdesc').value.trim(); if (!img && !desc) return X.toast('Envie uma foto ou descreva o prato.');
      e.target.disabled = true; e.target.innerHTML = '<span class="spin"></span> Analisando…';
      try {
        const parts = [{ text: `${ETICA}\nEstime as calorias desta refeição para uma pessoa brasileira. ${desc ? 'Descrição da pessoa: ' + desc : 'Sem descrição: estime porções típicas pela imagem.'}\nSeja honesta sobre a incerteza. Responda JSON: {"itens":[{"alimento":"...","porcao":"quantidade estimada","kcal":numero}],"total_min":numero,"total_max":numero,"observacao":"o que pode mudar a conta (óleo, molho, tamanho)","dica":"uma dica gentil, sem culpa"}` }];
        if (img) parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
        const r = await X.AI.gen({ contents: [{ role: 'user', parts }], temperature: 0.3 });
        const media = Math.round(((+r.total_min || 0) + (+r.total_max || 0)) / 2);
        $('#res').innerHTML = `<h3>Estimativa: ${r.total_min}–${r.total_max} kcal</h3><div style="margin:12px 0">${(r.itens || []).map(i => `<div class="row small" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${esc(i.alimento)} <span class="dim">· ${esc(i.porcao)}</span></span><span class="spacer"></span><b>${i.kcal}</b></div>`).join('')}</div><p class="small muted">${esc(r.observacao || '')}</p><p class="small" style="margin-top:8px">💡 ${esc(r.dica || '')}</p><button class="btn btn-ghost btn-sm" id="addday" style="margin-top:12px">＋ Adicionar ~${media} kcal ao meu dia</button>`;
        $('#addday').onclick = () => { (h.food[today()] ||= []).push({ desc: desc || (r.itens || []).map(i => i.alimento).join(', ').slice(0, 80) || 'Refeição', kcal: media }); save(); X.toast('Adicionado ✓'); alimentacao('foto'); };
      } catch (er) { X.toast('⚠️ ' + er.message, 6000); }
      e.target.disabled = false; e.target.textContent = 'Estimar calorias';
    };
  } else if (tab === 'calorias') {
    el.innerHTML = `<div class="grid g2"><div class="panel prose" style="max-width:none"><h3 style="margin-top:0">O básico, sem neura</h3>
      <p><b>Caloria</b> é a energia que a comida dá ao corpo. O corpo gasta energia o tempo todo, até dormindo.</p>
      <ul><li><b>Taxa basal${c ? ` (a sua: ~${c.tmb} kcal)` : ''}:</b> o mínimo que o corpo gasta só para funcionar. Ficar abaixo disso por muito tempo, sem acompanhamento, não é saudável.</li>
      <li><b>Gasto do dia${c ? ` (o seu: ~${c.gasto} kcal)` : ''}:</b> a basal mais o que você se movimenta.</li>
      <li>Comer <b>mais</b> do que gasta, com o tempo, faz engordar. Comer <b>um pouco menos</b> faz emagrecer. Comer parecido mantém o peso.</li>
      <li>Não precisa contar tudo para sempre: aprender a noção das porções já muda muito.</li></ul>
      <p class="small muted">Valores médios e aproximados; marcas e preparos variam.</p></div>
      <div class="panel"><h3>Calorias de coisas comuns</h3><input id="tq" placeholder="Buscar…" style="margin:12px 0"><div id="tl"></div></div></div>`;
    const draw = () => { const q = $('#tq').value.toLowerCase(); $('#tl').innerHTML = TABELA.filter(([n]) => n.toLowerCase().includes(q)).map(([n, k]) => `<div class="row small" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${n}</span><span class="spacer"></span><b>~${k} kcal</b></div>`).join(''); };
    $('#tq').oninput = draw; draw();
  } else if (tab === 'agua') {
    const meta = c?.agua || 2000, bebido = h.water[today()] || 0;
    const rot = h.aguaRotina || {};
    const horas = aguaHorarios();
    el.innerHTML = `<div class="grid g2"><div class="panel"><h3>Água de hoje</h3><div class="score" style="font-size:52px">${(bebido / 1000).toFixed(2)} L</div><p class="muted">Sua meta: ~${(meta / 1000).toFixed(1)} L por dia${c ? ' (35 ml por kg, mais um pouco se você treina)' : ''}. Em dias quentes ou de treino, beba um pouco mais.</p>
      <div class="progress" style="margin:14px 0;background:rgba(255,255,255,.08)"><i style="width:${Math.min(100, bebido / meta * 100)}%;background:linear-gradient(90deg,var(--mint),var(--sky))"></i></div>
      <div class="row">${[200, 300, 500].map(ml => `<button class="btn btn-ghost btn-sm" data-ml="${ml}">＋ ${ml} ml</button>`).join('')}<button class="btn btn-ghost btn-sm" data-ml="-200">− 200 ml</button></div></div>
      <div class="panel"><h3>Rotina de água</h3><p class="small muted" style="margin:6px 0 12px">Distribuí seus copos entre a hora que você acorda e a que dorme (pode mudar no seu perfil).</p>
      <div class="sugs" style="margin-bottom:14px">${horas.map(x => `<button>${x}</button>`).join('')}</div>
      <label class="check small" style="margin-bottom:10px"><input type="checkbox" id="notif" ${rot.on ? 'checked' : ''}> Avisar aqui no site nesses horários (com o site aberto)</label>
      <div class="notice small">⭐ Dica: o jeito mais confiável é colocar esses horários como <b>alarmes no relógio do celular</b>. O site só consegue avisar enquanto estiver aberto.</div></div></div>`;
    $$('[data-ml]').forEach(b => b.onclick = () => { if (X.S.readonly) return X.toast('Modo visitante: crie sua conta para registrar.'); h.water[today()] = Math.max(0, bebido + +b.dataset.ml); save(); alimentacao('agua'); });
    $('#notif').onchange = async e => {
      if (e.target.checked && 'Notification' in window && Notification.permission !== 'granted') { const p = await Notification.requestPermission(); if (p !== 'granted') { e.target.checked = false; return X.toast('Permita as notificações no navegador para receber os avisos.'); } }
      h.aguaRotina = { on: e.target.checked }; save(); startAgua(); X.toast(e.target.checked ? 'Avisos ligados enquanto o site estiver aberto 💧' : 'Avisos desligados');
    };
  } else {
    const box = document.createElement('div'); el.append(box);
    chat({ box, name: 'IAlvorecer', avatar: 'IA', draft: 'conversas/nutri.json', placeholder: 'Pergunte sobre comida, calorias ou peça para mudar seu plano…',
      system: () => `${ETICA}\nVocê está no modo de apoio à alimentação do IAlvorecer (você não é nutricionista). Pessoa: ${perfilTxt()}. Rotina: ${h.rotinaAlimentar || '—'}. Plano atual: ${JSON.stringify(h.planoAlimentar || null)}.\nResponda dúvidas (ex.: calorias de um alimento, trocas, como lidar com vontade de doce) de forma prática e gentil. Se a pessoa pedir para MUDAR o plano, devolva também "plano" completo no mesmo formato do plano atual. Primeira mensagem (se vazio): apresente-se e pergunte em que pode ajudar.\nResponda JSON: {"reply":"...","plano":null}`,
      onReply: r => { if (r.plano?.refeicoes) { h.planoAlimentar = r.plano; save(); X.toast('Seu plano alimentar foi atualizado ✓'); } } });
  }
}
function planoHTML(p) {
  return `<div class="panel"><div class="row"><h3>Seu plano (~${p.kcal} kcal)</h3></div><p class="muted" style="margin:8px 0 18px">${esc(p.resumo || '')}</p>
    <div class="grid g2">${(p.refeicoes || []).map(r => `<div class="job"><b>${esc(r.hora)} · ${esc(r.nome)}</b><span class="small dim">~${r.kcal} kcal</span><ul class="small" style="margin:8px 0 0;padding-left:18px">${(r.opcoes || []).map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>`).join('')}</div>
    ${p.trocas?.length ? `<h4 style="margin:22px 0 8px">Trocas inteligentes</h4><ul class="small">${p.trocas.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${p.dicas?.length ? `<h4 style="margin:18px 0 8px">Dicas</h4><ul class="small">${p.dicas.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${p.avisos?.length ? `<div class="notice" style="margin-top:16px">${p.avisos.map(esc).join('<br>')}</div>` : ''}</div>`;
}
function aguaHorarios() {
  const p = P(); const [ah, am] = (p.acorda || '07:00').split(':').map(Number); const [dh, dm] = (p.dorme || '23:00').split(':').map(Number);
  let a = ah * 60 + am + 30, d = dh * 60 + dm - 60; if (d <= a) d += 24 * 60;
  const n = 8, out = [];
  for (let i = 0; i < n; i++) { const t = Math.round(a + (d - a) * i / (n - 1)) % (24 * 60); out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60 - (t % 60) % 5).padStart(2, '0')}`); }
  return out;
}
export function startAgua() {
  clearInterval(aguaTimer);
  if (!X?.S || X.S.readonly || !X.S.state.health?.aguaRotina?.on) return;
  const avisados = new Set();
  aguaTimer = setInterval(() => {
    const now = new Date(); const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (aguaHorarios().includes(hm) && !avisados.has(hm)) { avisados.add(hm); try { new Notification('💧 Hora de beber água', { body: 'Um copo agora. Seu corpo agradece!' }); } catch { } X.toast('💧 Hora de beber água!', 6000); }
  }, 30000);
}
function compress(file) {
  return new Promise((res, rej) => {
    const img = new Image(); img.onload = () => { const s = Math.min(1, 900 / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = img.width * s; cv.height = img.height * s; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); res(cv.toDataURL('image/jpeg', 0.8).split(',')[1]); URL.revokeObjectURL(img.src); };
    img.onerror = rej; img.src = URL.createObjectURL(file);
  });
}

// ---------- TREINO ----------
async function treino(tab = 'plano') {
  const h = H(), t = h.treinoPerfil || {};
  X.app.innerHTML = head('Treino', 'Movimento que cabe na sua vida', 'Treino montado para o seu objetivo, corpo, tempo e lugar, com segurança e progressão.') + AVISO +
    `<div class="tabs">${[['plano', 'Meu treino'], ['chat', 'Falar com o IAlvorecer']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div><div id="tr"></div>`;
  $$('[data-tab]').forEach(b => b.onclick = () => treino(b.dataset.tab));
  const el = $('#tr');
  if (tab === 'chat') {
    const box = document.createElement('div'); el.append(box);
    return chat({ box, name: 'IAlvorecer', avatar: 'IA', draft: 'conversas/treino.json', placeholder: 'Pergunte sobre exercícios ou peça para mudar seu treino…',
      system: () => `${ETICA}\nVocê está no modo de apoio ao treino do IAlvorecer (você não é educador físico). Pessoa: ${perfilTxt()}. Preferências de treino: ${JSON.stringify(t)}. Treino atual: ${JSON.stringify(h.treinoPlano || null)}.\nTire dúvidas de execução, motivação e progressão. Dor ou lesão: não diagnostique; oriente parar o exercício que dói e procurar a UBS para avaliação, sem alarmismo. Se pedirem para MUDAR o treino, devolva "treino" completo no mesmo formato. Primeira mensagem (se vazio): apresente-se e pergunte o objetivo de hoje.\nResponda JSON: {"reply":"...","treino":null}`,
      onReply: r => { if (r.treino?.dias) { h.treinoPlano = r.treino; save(); X.toast('Seu treino foi atualizado ✓'); } } });
  }
  const opt = (id, v, l) => `<option value="${v}" ${t[id] === v ? 'selected' : ''}>${l}</option>`;
  el.innerHTML = `${calc() ? '' : `<div class="panel" style="margin-bottom:24px"><h3>Seu perfil</h3><p class="small muted" style="margin:6px 0 16px">Idade, altura e peso ajudam a montar algo seguro.</p>${perfilForm()}</div>`}
    <div class="panel"><h3>Como vai ser o seu treino?</h3><div class="grid g4" style="margin-top:14px">
      <div class="field"><label>Onde</label><select id="t-local">${opt('local', 'casa', 'Em casa')}${opt('local', 'academia', 'Academia')}${opt('local', 'livre', 'Ar livre')}</select></div>
      <div class="field"><label>Dias por semana</label><select id="t-dias">${[2, 3, 4, 5, 6].map(n => `<option ${+t.dias === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Minutos por treino</label><select id="t-min">${[20, 30, 45, 60, 90].map(n => `<option ${+t.min === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="field"><label>Experiência</label><select id="t-nivel">${opt('nivel', 'iniciante', 'Iniciante')}${opt('nivel', 'intermediario', 'Intermediária')}${opt('nivel', 'avancado', 'Avançada')}</select></div></div>
      <div class="grid g2"><div class="field"><label>Objetivo do treino</label><input id="t-obj" value="${esc(t.obj || '')}" placeholder="Ex.: ganhar força, glúteos, emagrecer, correr 5 km…"></div>
      <div class="field"><label>Limitações ou dores (opcional)</label><input id="t-lim" value="${esc(t.lim || '')}" placeholder="Ex.: joelho sensível, lombar…"></div></div>
      <button class="btn btn-pink" id="t-gerar">${h.treinoPlano ? 'Refazer meu treino' : 'Montar meu treino'}</button></div>
    <div id="tbox" class="section" style="margin-top:28px">${h.treinoPlano ? treinoHTML(h.treinoPlano) : ''}</div>`;
  if (!calc()) bindPerfil();
  bindTreino();
  $('#t-gerar').onclick = async e => {
    if (X.S.readonly) return X.toast('Modo visitante: crie sua conta para montar seu treino.');
    h.treinoPerfil = { local: $('#t-local').value, dias: +$('#t-dias').value, min: +$('#t-min').value, nivel: $('#t-nivel').value, obj: $('#t-obj').value.trim(), lim: $('#t-lim').value.trim() }; save();
    e.target.disabled = true; e.target.innerHTML = '<span class="spin"></span> Montando…';
    try {
      const r = await X.AI.gen({ prompt: `${ETICA}\nVocê está no modo de apoio ao treino do IAlvorecer (você não é educador físico). Monte um TREINO seguro e eficiente para: ${perfilTxt()}\nPreferências: ${JSON.stringify(h.treinoPerfil)}.\nRegras: progressão gradual, técnica antes de carga, respeite limitações (se houver dor, evite o movimento e sugira avaliação na UBS), sem nada perigoso para iniciantes.\nResponda JSON: {"resumo":"2-3 frases","aquecimento":"...","dias":[{"nome":"Treino A","foco":"...","exercicios":[{"nome":"...","series":"3","reps":"10-12","descanso":"60s","dica":"execução"}]}],"progressao":"como evoluir nas próximas semanas","cuidados":["..."],"beneficios":["benefícios reais desse tipo de treino"]}` });
      h.treinoPlano = r; save(); $('#tbox').innerHTML = treinoHTML(r); bindTreino();
    } catch (er) { X.toast('⚠️ ' + er.message, 6000); }
    e.target.disabled = false; e.target.textContent = 'Refazer meu treino';
  };
}
function treinoHTML(p) {
  return `<div class="panel"><h3>Seu treino</h3><p class="muted" style="margin:8px 0 14px">${esc(p.resumo || '')}</p>${p.aquecimento ? `<p class="small"><b>Aquecimento:</b> ${esc(p.aquecimento)}</p>` : ''}
    <div class="grid g2" style="margin-top:16px">${(p.dias || []).map((d, i) => `<div class="job"><div class="row"><b>${esc(d.nome)}</b><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-feito="${i}">✓ Fiz hoje</button></div><div class="small dim">${esc(d.foco || '')}</div>
      ${(d.exercicios || []).map(x => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><div class="row small"><b>${esc(x.nome)}</b><span class="spacer"></span><span>${esc(x.series)}x ${esc(x.reps)} · ${esc(x.descanso)}</span></div>${x.dica ? `<div class="small dim">${esc(x.dica)}</div>` : ''}</div>`).join('')}</div>`).join('')}</div>
    ${p.progressao ? `<p class="small" style="margin-top:16px"><b>Progressão:</b> ${esc(p.progressao)}</p>` : ''}
    ${p.beneficios?.length ? `<h4 style="margin:18px 0 8px">Por que vale a pena</h4><ul class="small">${p.beneficios.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${p.cuidados?.length ? `<div class="notice" style="margin-top:16px">${p.cuidados.map(esc).join('<br>')}</div>` : ''}</div>`;
}
function bindTreino() {
  $$('[data-feito]').forEach(b => b.onclick = () => { if (X.S.readonly) return X.toast('Modo visitante.'); H().workouts[today()] = b.dataset.feito; save(); X.toast('Treino registrado 💪'); });
}
