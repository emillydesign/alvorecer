// Cuidados: pele, unhas, cabelo e higiene/cheiro. Arquivo à parte: só carrega quando a pessoa abre #/cuidados.
// IA de apoio: NÃO substitui dermatologista, médico ou outros profissionais.
import { $, $$, esc, md } from './util.js';

let X; // contexto: { S, AI, app, toast, setCleanup }
export function initCuidados(ctx) { X = ctx; }

const ETICA = `Você é o IAlvorecer: uma IA (nunca se apresente com nome humano) que ajuda cada pessoa a cuidar de si, criada pela designer Emilly Urbano para quem não pode pagar profissionais. Você é uma base de apoio, não um profissional de saúde.
HONESTIDADE E CIÊNCIA: passe apenas informação verdadeira e consensual. Nunca invente estudos, autores, títulos, números ou porcentagens. Se algo for incerto ou depender da pessoa, diga isso. Sem terrorismo (alimentar ou outro) e sem promessas milagrosas: seja realista, gentil e sem julgamento.
SEGURANÇA: não diagnostique. Acne que inflama muito, dói, deixa cicatriz ou não melhora, manchas ou pintas que mudam, queda de cabelo forte, unhas com sinais de infecção e qualquer dor ou sintoma: oriente avaliação com dermatologista (UBS/SUS e clínicas-escola de universidades atendem de graça ou com baixo custo). Nunca incentive estourar espinhas ou cravos. Ácidos e ativos: explique uso gradual, teste em pequena área, protetor solar diário e cuidado em gestação e pele sensível.
Escreva em português do Brasil, claro e acolhedor. Lembre, sem repetir toda hora, que você é uma IA, pode errar e que o ideal é consultar um profissional.`;

const AVISO_LAZER = `<div class="notice" style="margin:18px 0 26px">Esta é uma IA de apoio e pode errar. Gosto é pessoal: use as sugestões como ponto de partida e teste o que combina com você.</div>`;
const AVISO = `<div class="notice" style="margin:18px 0 26px">Esta é uma IA de apoio: ajuda como base, mas <b>não substitui</b> dermatologista, médico ou outros profissionais, e pode errar. Para avaliação gratuita, procure a UBS/posto de saúde (SUS). Emergência: <b>SAMU 192</b>.</div>`;

const AREAS = {
  pele: {
    icon: 'sparkles', nome: 'Pele', g: ['#86efac', '#0ea5e9'],
    sub: 'Rotina, alimentação, água, ácidos de tratamento, hidratante e protetor solar. Sem terror e com ciência.',
    foco: 'cuidado da pele: rotina simples (limpar, tratar, hidratar, proteger), o que comer e beber de forma realista (o que a ciência mostra e o que ainda é incerto sobre alimentação, água e espinhas), ácidos e ativos (salicílico, glicólico, mandélico, lático, hialurônico, niacinamida, retinoides em linhas gerais, quando usar e como começar), hidratante e protetor solar, e por que nunca estourar espinhas e cravos. Explique que acne é uma doença da pele, com graus, e que casos inflamados ou persistentes precisam de dermatologista.',
    foto: true,
    perguntas: [
      { id: 'tipo', t: 'one', l: 'Como é a sua pele?', o: ['Oleosa', 'Seca', 'Mista', 'Normal', 'Não sei'] },
      { id: 'queixas', t: 'many', l: 'O que mais incomoda?', o: ['Espinhas', 'Cravos', 'Manchas', 'Oleosidade', 'Ressecamento', 'Poros dilatados', 'Sensibilidade', 'Olheiras', 'Linhas finas', 'Falta de brilho'] },
      { id: 'acne', t: 'one', l: 'Sobre espinhas', o: ['Não tenho', 'Poucas e leves', 'Várias, algumas inflamadas', 'Muitas, doloridas ou deixam marca'] },
      { id: 'sol', t: 'one', l: 'Protetor solar', o: ['Todo dia', 'Às vezes', 'Quase nunca'] }
    ]
  },
  unhas: {
    icon: 'hand', nome: 'Unhas', g: ['#fbcfe8', '#6366f1'],
    sub: 'Cuidar, pintar, esmalte comum, em gel ou com detalhes. Você escolhe o jeito e pode mudar quando quiser.',
    foco: 'cuidado das unhas: cutículas, hidratação, fortalecimento realista, como pintar passo a passo, se esmaltes, removedores, gel e acrigel estragam as unhas (o que depende do uso e da remoção, sem exagero), qual método combina com o que a pessoa quer, e como trocar de método sem agredir a unha. Alerte sobre sinais que pedem avaliação (manchas escuras que crescem, dor, pus, descolamento).',
    perguntas: [
      { id: 'jeito', t: 'many', l: 'Que jeito de unha você quer?', o: ['Natural e cuidada', 'Esmalte comum', 'Esmalte em gel', 'Unha de gel ou acrigel', 'Com detalhes e nail art', 'Curtinha e prática'] },
      { id: 'queixas', t: 'many', l: 'O que mais incomoda?', o: ['Quebram fácil', 'Descascam em camadas', 'Fracas e finas', 'Manchadas', 'Cutícula ressecada', 'Roo as unhas', 'Esmalte dura pouco'] },
      { id: 'freq', t: 'one', l: 'Com que frequência você mexe nelas?', o: ['Toda semana', 'A cada 15 dias', 'Raramente'] }
    ]
  },
  cabelo: {
    icon: 'scissors', nome: 'Cabelo', g: ['#fde68a', '#14b8a6'],
    sub: 'Cuidados para cabelos masculinos e femininos, do seu tipo de fio ao que mais incomoda você.',
    foco: 'cuidado dos cabelos (masculinos ou femininos, conforme a escolha): lavagem, frequência, hidratação, nutrição, finalização, couro cabeludo, calor e química, cronograma capilar realista, e o que causa frizz, oleosidade, falta de brilho e de maciez. Seja honesta sobre mitos de produtos e sobre queda de cabelo, que pede avaliação.',
    perguntas: [
      { id: 'publico', t: 'one', l: 'Cuidados para cabelo', o: ['Masculino', 'Feminino'] },
      { id: 'oleosidade', t: 'one', l: 'Como é o fio e o couro cabeludo?', o: ['Oleoso', 'Seco', 'Misto', 'Normal', 'Não sei'] },
      { id: 'textura', t: 'one', l: 'Textura', o: ['Liso', 'Ondulado', 'Cacheado', 'Crespo'] },
      { id: 'queixas', t: 'many', l: 'O que mais incomoda?', o: ['Frizz', 'Oleosidade', 'Falta de brilho', 'Falta de maciez', 'Pontas ressecadas', 'Caspa ou coceira', 'Queda', 'Pouco volume', 'Difícil de pentear'] },
      { id: 'quimica', t: 'many', l: 'Química e calor', o: ['Tintura', 'Alisamento ou progressiva', 'Descoloração', 'Chapinha ou secador', 'Nada disso'] }
    ]
  },
  higiene: {
    icon: 'droplets', nome: 'Higiene e cheiro', g: ['#7dd3fc', '#4f46e5'],
    sub: 'Higiene básica, mau hálito, suor e cheiro nas axilas, e como fazer o perfume durar mais.',
    foco: 'higiene e cheiro: banho, mau hálito (causas comuns, higiene da língua e fio dental, quando procurar dentista), suor e cheiro nas axilas (cecê) com desodorante x antitranspirante e hábitos, cuidado com pés, como fazer o perfume durar mais (onde aplicar, hidratação da pele, armazenamento), diferença entre perfume, eau de parfum, eau de toilette, colônia e body splash, e a importância de hidratante e protetor solar para a pele. Seja prática, sem constranger.',
    perguntas: [
      { id: 'foco', t: 'many', l: 'O que você quer melhorar?', o: ['Mau hálito', 'Suor e cheiro nas axilas', 'Cheiro nos pés', 'Fazer o perfume durar', 'Escolher entre perfume e body splash', 'Higiene básica do dia a dia', 'Hidratante e protetor solar'] },
      { id: 'banho', t: 'one', l: 'Sua rotina de higiene hoje', o: ['Bem completa', 'Básica', 'Preciso de ajuda para organizar'] }
    ]
  },
  perfumes: {
    icon: 'spray-can', nome: 'Perfumes e notas olfativas', g: ['#f9a8d4', '#7c3aed'], lazer: true,
    sub: 'Descubra de quais cheiros você gosta, aprenda as notas olfativas e saiba escolher e fazer o perfume durar.',
    foco: 'perfumaria: o que são notas de topo, coração e fundo, famílias olfativas (cítrica, floral, amadeirada, oriental, aquática, gourmand etc.), diferença entre perfume, eau de parfum, eau de toilette, colônia e body splash (concentração, duração e preço), como testar um perfume (pele, tempo, não esfregar o pulso), onde e como passar, como guardar e como fazer o cheiro durar mais, e como descobrir de quais notas a pessoa gosta a partir do que ela já usa e curte. Dê exemplos de famílias e de notas, e de tipos de perfume acessíveis; NÃO invente nomes de perfumes, marcas ou notas de produtos específicos e deixe claro que o gosto é pessoal e que vale testar no corpo',
    perguntas: [
      { id: 'gosto', t: 'many', l: 'De quais cheiros você gosta?', o: ['Cítrico e fresco', 'Floral', 'Doce e baunilhado', 'Amadeirado', 'Aquático e limpinho', 'Frutal', 'Especiado e quente', 'Cheiro de talco e roupa limpa', 'Café, chocolate e comida', 'Cheiro de terra e natureza'] },
      { id: 'uso', t: 'many', l: 'Para quando você quer perfume?', o: ['Dia a dia', 'Trabalho ou estudo', 'Noite e festa', 'Calor', 'Frio', 'Presente'] },
      { id: 'duracao', t: 'one', l: 'O que mais incomoda hoje?', o: ['Passa rápido', 'Muito forte', 'Dá dor de cabeça', 'Não sei escolher', 'Nada, só quero aprender'] }
    ],
    extraL: 'Perfumes que você já usa ou ama (opcional)', extraP: 'Ex.: o perfume que uso hoje, cheiros que me lembram algo bom…'
  },
  estilo: {
    icon: 'shirt', nome: 'Estilo e moda', g: ['#fdba74', '#ec4899'], lazer: true,
    sub: 'Descubra ou mude seu estilo, entenda seu tipo de corpo e aprenda a combinar roupas com conceitos de moda.',
    foco: 'estilo pessoal e moda: identificar o estilo da pessoa a partir das peças que ela gosta (casual, clássico, minimalista, esportivo, romântico, criativo, street etc.), conceitos profissionais de moda (teoria das cores, cartela de cores, proporções, silhueta, caimento, tecidos, guarda-roupa cápsula, peças-chave, combinação de estampas), tipos de corpo (ampulheta, triângulo, triângulo invertido, retângulo, oval) com a ressalva de que são apenas referências e todo corpo é válido, e como combinar roupas para ocasiões diferentes gastando pouco (brechó, reaproveitar, trocar). Sem padrões de beleza rígidos nem comentários negativos sobre o corpo',
    perguntas: [
      { id: 'objetivo', t: 'one', l: 'O que você quer?', o: ['Descobrir meu estilo', 'Mudar meu estilo', 'Montar looks com o que já tenho', 'Montar um guarda-roupa enxuto'] },
      { id: 'pecas', t: 'many', l: 'Peças que você já gosta de usar', o: ['Jeans', 'Alfaiataria', 'Camisetas básicas', 'Vestidos', 'Saias', 'Moletom', 'Camisa social', 'Roupas esportivas', 'Peças estampadas', 'Peças de tricô', 'Jaquetas', 'Acessórios marcantes'] },
      { id: 'corpo', t: 'one', l: 'Tipo de corpo (se quiser que eu ajude a identificar, escolha "Não sei")', o: ['Ampulheta', 'Triângulo (quadril mais largo)', 'Triângulo invertido (ombros mais largos)', 'Retângulo', 'Oval', 'Não sei'] },
      { id: 'ocasioes', t: 'many', l: 'Para quais ocasiões?', o: ['Dia a dia', 'Trabalho ou estudo', 'Festas e saídas', 'Eventos formais', 'Academia', 'Viagens'] }
    ],
    extraL: 'Algo mais sobre seu estilo ou orçamento? (opcional)', extraP: 'Ex.: cores que amo ou evito, quanto posso gastar, inspirações…'
  },
  musica: {
    icon: 'music', nome: 'Música', g: ['#a5b4fc', '#14b8a6'], lazer: true,
    sub: 'Descubra seu gosto musical e encontre músicas novas, não só as mais famosas.',
    foco: 'gosto musical: a partir de músicas, artistas e gêneros que a pessoa já gosta, ajudar a entender o que ela curte (ritmo, clima, letra, instrumentos, época) e sugerir artistas e músicas parecidos, incluindo artistas pouco conhecidos, independentes e de outros países e épocas, não só as famosas. REGRA: só sugira músicas e artistas que você tem certeza que existem; se não tiver certeza, diga e sugira buscar por gênero, clima e instrumentos em plataformas gratuitas (como YouTube ou Spotify). Nunca invente nome de música ou artista',
    perguntas: [
      { id: 'generos', t: 'many', l: 'Gêneros que você curte', o: ['Pop', 'Rock', 'MPB', 'Sertanejo', 'Funk', 'Rap e hip hop', 'Eletrônica', 'Jazz e blues', 'Clássica e trilhas', 'Indie', 'Forró e pagode', 'Música internacional', 'Lo-fi e calma', 'Metal'] },
      { id: 'clima', t: 'many', l: 'Em que clima você quer ouvir?', o: ['Para focar', 'Para treinar', 'Para relaxar', 'Para animar', 'Para sentir saudade', 'Para dançar', 'Para dormir'] },
      { id: 'novidade', t: 'one', l: 'Você prefere', o: ['Coisas parecidas com o que já amo', 'Misturar com algo novo', 'Surpreenda-me com algo bem diferente'] }
    ],
    extraL: 'Músicas e artistas que você já sabe que ama (quanto mais, melhor)', extraP: 'Ex.: nome das músicas e dos artistas que não saem da sua playlist…'
  }
};

// memória geral (só se a pessoa ligou): gostos e objetivos de outros cursos entram como contexto
const memoria = async () => { try { const M = await import('./memoria.js?v=1'); return M.linhaParaPrompt(X.S); } catch { return ''; } };
const st = () => ((X.S.state.cuidados ||= {}));
const A = id => (st()[id] ||= { resp: {}, guia: null, hist: [] });
const save = () => X.S.saveState();

const head = (eyebrow, title, sub) => `<a class="back" href="#/cuidados">← Cuidados</a><div class="eyebrow" style="margin-top:22px">${eyebrow}</div><h1 style="margin:10px 0 10px">${title}</h1>${sub ? `<p class="muted" style="max-width:720px">${sub}</p>` : ''}`;

// ---------- entrada da rota ----------
export async function cuidados(sub) {
  if (AREAS[sub]) return area(sub);
  X.app.innerHTML = `<div class="eyebrow">Cuidados</div><h1 style="margin:10px 0 12px">Cuidar de você, por inteiro</h1>
  <p class="muted" style="max-width:760px">Escolha uma área, conte como você é e o que mais incomoda, e receba um guia só seu, com apoio de pesquisas científicas. Cada área funciona sozinha: uma não interfere na outra.</p>${AVISO}
  <div class="grid g3">${Object.entries(AREAS).map(([id, a]) => `<a class="area pat-rings" href="#/cuidados/${id}" style="background:linear-gradient(150deg,${a.g[0]},${a.g[1]})"><div><span class="aic"><i data-lucide="${a.icon}"></i></span><h3>${esc(a.nome)}</h3><p>${esc(a.sub)}</p></div><span class="btn btn-pink btn-sm" style="align-self:flex-start;margin-top:18px">Abrir</span></a>`).join('')}</div>`;
}

// ---------- área ----------
function area(id, tab = 'guia') {
  const a = AREAS[id], d = A(id);
  const tabs = d.guia ? [['guia', 'Seu guia'], ...(a.lazer ? [] : [['estudos', 'Pesquisas científicas']]), ['chat', 'Conversar'], ['perfil', 'Refazer perguntas']] : [];
  X.app.innerHTML = head('Cuidados', esc(a.nome), esc(a.sub)) + (a.lazer ? AVISO_LAZER : AVISO) +
    (d.guia ? `<div class="tabs">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>` : '') + '<div id="ct"></div>';
  $$('[data-tab]').forEach(b => b.onclick = () => area(id, b.dataset.tab));
  const el = $('#ct');
  if (!d.guia || tab === 'perfil') return perguntas(id, el);
  if (tab === 'estudos') return estudos(id, el);
  if (tab === 'chat') return conversa(id, el);
  guia(id, el);
}

function perguntas(id, el) {
  const a = AREAS[id], d = A(id);
  el.innerHTML = `<div class="panel"><h3>Conte um pouco sobre você</h3><p class="small muted" style="margin:6px 0 16px">Responda o que quiser. Quanto mais você contar, mais o guia fica com a sua cara.</p>
    ${a.perguntas.map(q => `<div class="field"><label>${esc(q.l)}</label><div class="chips">${q.o.map(o => `<button class="chip ${[].concat(d.resp[q.id] || []).includes(o) ? 'on' : ''}" data-q="${q.id}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
    <div class="field"><label>${esc(a.extraL || 'Algo mais que a IA deva saber? (opcional)')}</label><textarea id="cx" rows="3" placeholder="${esc(a.extraP || 'Ex.: minha rotina atual, produtos que uso, alergias, o que já tentei…')}">${esc(d.resp.extra || '')}</textarea></div>
    ${a.foto ? `<div class="field"><label>Foto da pele (opcional)</label><p class="small muted" style="margin:0 0 8px">Uma foto com boa luz ajuda a IA a sugerir cuidados. Ela não faz diagnóstico, e a foto não fica guardada.</p><input type="file" id="cf" accept="image/*" capture="user"><img id="cp" alt="" style="max-width:240px;border-radius:16px;display:none;margin-top:10px"></div>` : ''}
    <button class="btn btn-pink" id="cg">${d.guia ? 'Refazer meu guia' : 'Montar meu guia'}</button></div>`;
  $$('[data-q]', el).forEach(b => b.onclick = () => {
    const q = a.perguntas.find(x => x.id === b.dataset.q);
    if (q.t === 'one') $$(`[data-q="${q.id}"]`, el).forEach(x => x.classList.toggle('on', x === b && !x.classList.contains('on')));
    else b.classList.toggle('on');
  });
  let img = null;
  $('#cf', el) && ($('#cf', el).onchange = async e => { const f = e.target.files[0]; if (!f) return; img = await compress(f); const p = $('#cp', el); p.src = 'data:image/jpeg;base64,' + img; p.style.display = 'block'; });
  $('#cg', el).onclick = async e => {
    if (X.S.readonly) return X.toast('Modo visitante: crie sua conta para montar seu guia.');
    const resp = { extra: $('#cx', el).value.trim() };
    a.perguntas.forEach(q => { const on = $$(`[data-q="${q.id}"]`, el).filter(b => b.classList.contains('on')).map(b => b.dataset.v); resp[q.id] = q.t === 'one' ? (on[0] || '') : on; });
    d.resp = resp; e.target.disabled = true; e.target.innerHTML = '<span class="spin"></span> Montando seu guia…';
    try {
      const mem = await memoria();
      const parts = [{ text: `${ETICA}${mem}\nÁrea: ${a.nome}. Assunto: ${a.foco}\nRespostas da pessoa: ${JSON.stringify(resp)}${img ? '\nHá uma foto anexada: descreva só o que é visível, sem diagnosticar, e adapte as dicas.' : ''}
Monte um guia personalizado, realista e sem terrorismo. ${a.lazer ? 'Esta área não é de saúde: deixe "estudos" como lista vazia e não use colchetes duplos.' : 'Se algum termo tiver base científica, escreva-o no texto entre colchetes duplos, como [[ácido salicílico]], e liste o mesmo termo em "estudos".'}
Responda só JSON: {"resumo":"2 a 3 frases acolhedoras","secoes":[{"titulo":"...","texto":"markdown curto com passos e dicas","passos":["..."]}],"quando_procurar_profissional":"quando e por que procurar ajuda profissional","estudos":[{"termo":"mesmo termo usado em [[ ]]","busca":"consulta curta em inglês para o PubMed","mostra":"uma frase honesta sobre o que a literatura em geral indica, sem números inventados"}]}
Regras de "estudos": NUNCA invente título, autor, ano ou link; só termos de busca reais. ${a.lazer ? '' : 'De 4 a 8 itens.'}` }];
      if (img) parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
      const r = await X.AI.gen({ contents: [{ role: 'user', parts }], temperature: 0.4 });
      d.guia = { ...r, quando: r.quando_procurar_profissional, em: new Date().toISOString() }; save(); area(id, 'guia');
    } catch (err) { e.target.disabled = false; e.target.textContent = 'Tentar de novo'; X.toast(err.message || 'Não deu certo, tente de novo.'); }
  };
}

// termos [[assim]] viram link de pesquisa no PubMed quando existem em "estudos"
const pubmed = q => 'https://pubmed.ncbi.nlm.nih.gov/?term=' + encodeURIComponent(q);
function comDestaques(texto, estudos) {
  const mapa = new Map((estudos || []).map(s => [esc(String(s.termo || '')).toLowerCase(), s.busca]));
  return md(String(texto || '')).replace(/\[\[(.+?)\]\]/g, (m, t) => {
    const b = mapa.get(t.toLowerCase());
    return b ? `<a class="sci" href="${esc(pubmed(b))}" target="_blank" rel="noopener noreferrer" title="Ver pesquisas sobre isso">${t}</a>` : t;
  });
}

function guia(id, el) {
  const g = A(id).guia, aguda = id === 'pele' && /doloridas|inflamadas/.test(A(id).resp.acne || '');
  el.innerHTML = `${aguda ? `<div class="notice" style="margin-bottom:20px"><b>Atenção:</b> acne com muitas lesões inflamadas, doloridas ou que deixam marca é uma doença da pele e merece tratamento com <b>dermatologista</b>. Procure a UBS (SUS) ou clínicas-escola de universidades. Enquanto isso, não estoure nada.</div>` : ''}
    <div class="panel"><p style="margin:0">${comDestaques(g.resumo, g.estudos)}</p></div>
    ${(g.secoes || []).map(s => `<div class="panel" style="margin-top:18px"><h3>${esc(s.titulo)}</h3>${comDestaques(s.texto, g.estudos)}${(s.passos || []).length ? `<ol>${s.passos.map(p => `<li>${comDestaques(p, g.estudos)}</li>`).join('')}</ol>` : ''}</div>`).join('')}
    ${id === 'pele' ? `<div class="panel" style="margin-top:18px"><h3>Para todo mundo: não estoure espinhas e cravos</h3><p>Mexer pode piorar a inflamação, espalhar bactérias e deixar manchas e cicatrizes. Se incomoda muito, limpe com cuidado e procure um profissional para fazer a extração do jeito certo.</p></div>` : ''}
    ${AREAS[id].lazer ? '' : `<div class="panel" style="margin-top:18px"><h3>Quando procurar um profissional</h3>${md(String(g.quando || 'Se algo piorar, doer ou não melhorar, procure a UBS ou um profissional de saúde.'))}</div>
    <p class="small muted" style="margin-top:16px">Palavras sublinhadas têm pesquisas científicas ligadas a elas (veja a aba Pesquisas científicas).</p>`}`;
}

function estudos(id, el) {
  const e = A(id).guia.estudos || [];
  el.innerHTML = `<div class="panel"><h3>Pesquisas científicas</h3><p class="small muted" style="margin:6px 0 16px">Cada link abre uma busca no PubMed, a base de pesquisas em saúde da biblioteca dos EUA. Os links levam a estudos reais, mas a IA não escolhe um artigo específico: confira o que cada um diz e converse com um profissional.</p>
    ${e.length ? e.map(s => `<div style="margin:0 0 16px"><a class="sci" href="${esc(pubmed(s.busca || s.termo))}" target="_blank" rel="noopener noreferrer"><b>${esc(s.termo)}</b></a><div class="small muted">${esc(s.mostra || '')}</div></div>`).join('') : '<p class="small muted">Nenhuma pesquisa listada neste guia.</p>'}</div>`;
}

function conversa(id, el) {
  const a = AREAS[id], d = A(id);
  el.innerHTML = `<div class="chat" style="height:min(560px,calc(100vh - 260px))"><div class="msgs" id="cm"></div><div class="composer"><textarea id="ctx" rows="1" placeholder="Pergunte sobre ${esc(a.nome.toLowerCase())}…"></textarea><button class="send" id="cs">Enviar</button></div></div>`;
  const msgs = $('#cm', el), txt = $('#ctx', el); let busy = false;
  const add = (role, t) => { const m = document.createElement('div'); m.className = 'msg ' + role; if (role === 'ai') m.innerHTML = md(String(t).replace(/\[\[|\]\]/g, '')); else m.textContent = t; msgs.append(m); msgs.scrollTop = msgs.scrollHeight; };
  d.hist.forEach(m => add(m.role, m.text));
  if (!d.hist.length) add('ai', `Oi! Pode me perguntar o que quiser sobre ${a.nome.toLowerCase()}. Sou uma IA de apoio, então para casos sérios o ideal é um profissional.`);
  const send = async () => {
    const t = txt.value.trim(); if (!t || busy) return;
    if (X.S.readonly) return X.toast('Modo visitante: crie sua conta para conversar.');
    busy = true; txt.value = ''; d.hist.push({ role: 'me', text: t }); add('me', t);
    try {
      const mem = await memoria();
      const r = await X.AI.chat({ system: `${ETICA}${mem}\nÁrea: ${a.nome}. Assunto: ${a.foco}\nPerfil da pessoa: ${JSON.stringify(d.resp)}\nResponda curto (2 a 6 frases) e humano. Responda JSON: {"reply":"..."}`, history: d.hist.slice(-20) });
      const rp = r.reply || '…'; d.hist.push({ role: 'ai', text: rp }); add('ai', rp); d.hist = d.hist.slice(-40); save();
    } catch (err) { add('ai', 'Não consegui responder agora: ' + err.message); }
    busy = false;
  };
  $('#cs', el).onclick = send;
  txt.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
}

function compress(f) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => { const s = Math.min(1, 900 / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = img.width * s; cv.height = img.height * s; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); res(cv.toDataURL('image/jpeg', 0.8).split(',')[1]); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(f);
  });
}
