// Dados de demonstração (só para ver o site funcionando, nada é salvo)
import { today, addDays, ym, uid } from './util.js';

const PLAN_EN = [
  ['Nuances: quando "big" não serve', 'Shades of meaning', 'Register & connotation', 'Adjetivos de intensidade'],
  ['Falar como nativo: collocations', 'Sounding natural', 'Collocations & phrasal verbs', 'Trabalho e rotina'],
  ['Expressões que ninguém ensina', 'Idioms in the wild', 'Idioms in context', 'Séries e games'],
  ['Convencer sem forçar', 'The art of persuasion', 'Hedging & softening', 'Argumentação'],
  ['Conduzindo reuniões', 'Running the room', 'Modal verbs for diplomacy', 'Reuniões'],
  ['A entrevista dos sonhos', 'Nailing the interview', 'Narrative tenses', 'Carreira'],
  ['Relatórios que todo mundo lê', 'Writing that lands', 'Cohesion & linkers', 'Escrita profissional'],
  ['A internet fala assim', 'Internet & gaming slang', 'Informal register', 'Gírias'],
  ['Ritmo e reduções', 'Rhythm & reductions', 'Connected speech', 'Pronúncia'],
  ['Debates complexos', 'Tackling big topics', 'Cleft sentences', 'Opinião'],
  ['Feedback sem drama', 'Tough conversations', 'Indirect questions', 'Comunicação'],
  ['Sarcasmo e duplo sentido', 'Reading between the lines', 'Irony markers', 'Humor'],
  ['IA e o futuro do trabalho', 'AI & the future of work', 'Future forms & speculation', 'Tecnologia'],
  ['Sotaques do mundo', 'Accents around the world', 'Regional variation', 'Cultura'],
  ['Negociação avançada', 'Getting to yes', 'Conditionals (mixed)', 'Negócios'],
  ['Escrita criativa', 'Telling stories', 'Inversion for effect', 'Narrativa'],
  ['Pensamento crítico na mídia', 'Media literacy', 'Reporting verbs', 'Notícias'],
  ['Erros fixos de quem aprendeu de ouvido', 'Fossilized mistakes', 'Common errors review', 'Revisão'],
  ['Small talk e networking', 'Small talk that works', 'Question tags & fillers', 'Networking'],
  ['Revisão: discurso persuasivo', 'Your persuasive speech', 'Integrated review', 'Projeto']
].map(([title, target, grammar, vocab]) => ({ title, target, grammar, vocab, can: 'Usar isso numa conversa real.' }));

const PLAN_ES = ['Opinar sem medo', 'Contando histórias', 'E se...? Hipóteses', 'Dando conselhos', 'Reclamações', 'Entrevista de emprego', 'Notícias', 'Meio ambiente', 'Filmes, séries e games', 'Educação']
  .concat(['Amizade', 'Morar fora', 'Dinheiro', 'Saúde', 'Redes sociais', 'Viagem longa', 'Processos', 'Desejos', 'Projetos', 'Revisão'])
  .map((t, i) => ({ title: t, target: '', grammar: ['Subjuntivo presente', 'Pretérito indefinido x imperfecto', 'Condicional', 'Imperativo'][i % 4], vocab: '', can: '' }));

export const SAMPLE_LESSON = {
  title: 'Falar como nativo: collocations',
  subtitle: 'Por que "make a decision" soa natural e "do a decision" não.',
  goal: 'Usar 12 collocations de trabalho e rotina sem traduzir do português.',
  warmup: 'What was the last big decision you made at work?',
  sections: [
    { heading: 'What are collocations?', body: 'Collocations are words that **naturally go together**. Natives don\'t think about them, they just *sound right*.\n\nVocê já usa muitas sem perceber (você aprendeu de ouvido!), mas algumas viraram **erros fixos** porque o português empurra para outra combinação.', examples: [{ t: 'I need to make a decision by Friday.', pt: 'Preciso tomar uma decisão até sexta.' }, { t: 'She paid attention to every detail.', pt: 'Ela prestou atenção em cada detalhe.' }] },
    { heading: 'MAKE vs DO', body: '- **make**: create, produce, decide → make a decision, make a mistake, make progress\n- **do**: tasks, work, routine → do research, do the dishes, do me a favor\n\nTip: if it\'s an *action you perform*, it\'s usually **do**. If it\'s *something new that comes out of it*, it\'s **make**.', examples: [{ t: 'We\'ve made a lot of progress this sprint.', pt: 'Avançamos muito neste sprint.' }, { t: 'I did some user research last week.', pt: 'Fiz uma pesquisa com usuários semana passada.' }] },
    { heading: 'Strong adjectives', body: 'Natives say **heavy rain** (not *strong rain*), **strong coffee** (not *heavy coffee*), **high expectations**, **deeply sorry**.', examples: [{ t: 'Sorry I\'m late, there was heavy traffic.', pt: 'Desculpa o atraso, o trânsito estava pesado.' }] }
  ],
  tip: 'Quando aprender uma palavra nova, aprenda o "parceiro" dela junto. Não decore "decision"; decore "make a decision".',
  vocab: [
    { term: 'make a decision', meaning: 'tomar uma decisão', example: 'We need to make a decision today.' },
    { term: 'pay attention', meaning: 'prestar atenção', example: 'Pay attention to the details.' },
    { term: 'do research', meaning: 'pesquisar', example: 'I did some research before the meeting.' },
    { term: 'heavy traffic', meaning: 'trânsito pesado', example: 'There was heavy traffic downtown.' },
    { term: 'meet a deadline', meaning: 'cumprir um prazo', example: 'We barely met the deadline.' },
    { term: 'take a break', meaning: 'fazer uma pausa', example: 'Let\'s take a 10-minute break.' },
    { term: 'run a meeting', meaning: 'conduzir uma reunião', example: 'Who\'s running the meeting?' },
    { term: 'raise a concern', meaning: 'levantar uma preocupação', example: 'She raised a concern about the budget.' },
    { term: 'high expectations', meaning: 'expectativas altas', example: 'The client has high expectations.' },
    { term: 'deeply sorry', meaning: 'profundamente arrependido', example: 'I\'m deeply sorry for the delay.' }
  ],
  exercises: [
    { type: 'mcq', q: 'Choose the natural option: "We need to ___ a decision."', options: ['do', 'make', 'take', 'have'], answer: 1, explain: '"Make a decision" é a collocation padrão. "Take a decision" existe no inglês britânico, mas é menos comum.' },
    { type: 'mcq', q: '"Sorry, there was ___ traffic."', options: ['strong', 'big', 'heavy', 'hard'], answer: 2, explain: 'Trânsito intenso = heavy traffic.' },
    { type: 'mcq', q: '"Can you ___ me a favor?"', options: ['make', 'do', 'give', 'take'], answer: 1, explain: 'Do someone a favor.' },
    { type: 'fill', q: 'I need to ___ some research before the meeting.', answer: 'do', accept: [], explain: 'Do research.' },
    { type: 'fill', q: 'We have to ___ the deadline no matter what.', answer: 'meet', accept: [], explain: 'Meet a deadline = cumprir prazo.' },
    { type: 'translate', q: 'Ela levantou uma preocupação sobre o prazo.', answer: 'She raised a concern about the deadline.', explain: '' },
    { type: 'translate', q: 'Vamos fazer uma pausa de 10 minutos.', answer: 'Let\'s take a 10-minute break.', explain: '' },
    { type: 'write', q: 'Write 3 sentences about your work week using at least 3 collocations from today.' }
  ],
  conversation: { topic: 'Decisions at work', goal: 'Usar make/do e as collocations da aula falando do seu trabalho.', questions: ['What was the hardest decision you made this year?', 'How do you deal with tight deadlines?', 'Do you prefer running meetings or just attending them?'] }
};

export function demoData(C) {
  const t = today(), d = n => addDays(t, -n);
  const en = { level: 'C1', cycle: 1, plans: { C1: { created: d(12), lessons: PLAN_EN } }, done: {}, levels: { B2: { passed: d(14), score: 82 } } };
  [[0, 92, 10], [1, 85, 9], [2, 78, 8], [3, 88, 7], [4, 95, 4], [5, 70, 3], [6, 90, 1]].forEach(([i, s, ago]) => en.done['C1-' + i] = { score: s, date: d(ago) });
  const es = { level: 'B1', cycle: 1, plans: { B1: { created: d(9), lessons: PLAN_ES } }, done: { 'B1-0': { score: 80, date: d(8) }, 'B1-1': { score: 74, date: d(2) } }, levels: {} };
  const state = {
    version: 1, onboarded: d(14), profile: { name: 'Emilly', area: 'UX Design', prefs: { goals: ['Idiomas', 'Design & Criação'], learned: 'natural', style: 'conversa', explain: 'auto', minutes: 30, convMinutes: 30, interests: ['Games', 'Séries e filmes', 'Design', 'Viagens'] } }, plan: { main: 'en', second: '', secondDays: [] },
    courses: { 'cus:foto': { done: { 0: { score: 90, date: d(1) } }, extra: [] }, 'lang:en': en, 'lang:es': es, 'trk:figma': { done: { 0: { score: 100, date: d(6) }, 1: { score: 88, date: d(5) }, 2: { score: 92, date: d(2) } }, extra: [] }, 'trk:web': { done: { 0: { score: 95, date: d(4) } }, extra: [] }, 'trk:ux-ia': { done: { 0: { score: 90, date: d(3) } }, extra: [], inEnglish: true } },
    streak: { count: 6, best: 9, last: d(1) }, stats: { lessons: 12, conversations: 5, reviews: 8, tests: 1, minutes: 96 }, created: d(14),
    area: 'design',
    custom: [{ id: 'foto', title: 'Fotografia com celular', sub: 'Fotos lindas sem câmera profissional', icon: '📷', lessons: ['Conhecendo a câmera do seu celular', 'Luz natural: o segredo', 'Composição e regra dos terços', 'Retratos que valorizam', 'Fotos de produto', 'Fotos de comida', 'Edição grátis no celular', 'Projeto: ensaio de 10 fotos'], ctx: 'Prático, com exercícios para fazer com o próprio celular.', g: ['#5eead4', '#0ea5e9'], pat: 'rings', created: d(2) }],
    career: { linkedin: { url: 'https://www.linkedin.com/in/exemplo', text: 'UX Designer com 1 ano de experiência…' }, jobs: [{ titulo: 'UX Designer Júnior remoto (Brasil)', palavras: 'UX designer júnior', local: 'Brasil', remoto: true, internacional: false, porque: 'Seu passo de agora: ganhar mais sem sair de casa.' }, { titulo: 'Product Designer (startups)', palavras: 'product designer', local: 'Brasil', remoto: true, internacional: false, porque: 'Startups contratam muito remoto e valorizam portfólio.' }, { titulo: 'Junior UX Designer (remote, LATAM)', palavras: 'junior UX designer LATAM', local: 'Remote', remoto: true, internacional: true, porque: 'Próximo passo: receber em dólar morando no Brasil.' }], profile: { atual: 'UX designer júnior presencial', salarioAtual: 'R$ 3.200', salarioMeta: 'R$ 7.000 (e depois em dólar)', sonho: 'Morar e trabalhar nos EUA ou no Japão' }, plan: { agora: 'Vaga de UX remota no Brasil ganhando R$ 6–7 mil', medio: 'Trabalhar remoto para empresa de fora, recebendo em dólar', longo: 'Morar nos EUA ou no Japão trabalhando com design', estrategia: 'Fortalecer o portfólio com 3 cases e o inglês para entrevistas; candidaturas focadas em vagas remotas brasileiras; em 12 meses, começar a aplicar para empresas internacionais.' }, steps: [{ t: 'Refazer o currículo no padrão do curso Currículo perfeito', done: true }, { t: 'Publicar o portfólio com 3 case studies', done: false }, { t: 'Atualizar o LinkedIn em português e inglês', done: false }, { t: 'Aplicar para 5 vagas remotas por semana', done: false }, { t: 'Treinar "Tell me about yourself" na conversação', done: false }], weekly: ['Escolher os 3 projetos do portfólio', 'Fazer a aula 2 do curso de Currículo', 'Mandar 5 candidaturas bem feitas'], courses: ['trk:portfolio', 'trk:curriculo', 'comp:en-trabalho'], sessions: [{ date: d(3), summary: 'Mapeamos sua situação atual e o sonho de morar fora. Combinamos focar primeiro em uma vaga remota no Brasil ganhando melhor.' }] }
  };
  const words = SAMPLE_LESSON.vocab.map(v => [v.term, v.meaning, v.example]).concat([['get the hang of', 'pegar o jeito', ''], ['a no-brainer', 'algo óbvio', ''], ['to be swamped', 'estar atolada de trabalho', ''], ['ojalá', 'tomara', ''], ['echar de menos', 'sentir falta', ''], ['sin embargo', 'no entanto', '']]);
  const srs = words.map(([front, back, note], i) => ({ id: uid(), course: i > 12 ? 'lang:es' : 'lang:en', front, back, note, source: 'aula', created: d(i % 9), due: i % 3 ? t : addDays(t, 4), ease: 2.5, interval: i % 3 ? 2 : 6, reps: 1, lapses: 0 }));
  srs.push({ id: uid(), course: 'lang:en', front: 'Corrija: I have 26 years', back: 'I am 26 (years old)', note: 'Idade em inglês usa o verbo to be.', source: 'erro', created: d(3), due: t, interval: 1, ease: 2.3, reps: 0, lapses: 1 });
  const cid = `${d(1)}-demo`;
  const ev = (ago, e) => ({ id: uid(), date: d(ago), ts: new Date(Date.now() - ago * 864e5 - (e.h || 0) * 36e5).toISOString(), ...e });
  const history = [
    ev(10, { type: 'lesson', course: 'lang:en', lessonId: 'C1-0', n: 81, title: 'Nuances: quando "big" não serve', score: 92, errors: [{ q: 'A ___ mistake', yours: 'big', correct: 'huge / serious', why: '"Big mistake" existe, mas "serious mistake" é mais natural no trabalho.' }], vocab: ['subtle', 'nuance'] }),
    ev(9, { type: 'conversation', course: 'lang:en', title: 'Words that change everything', minutes: 18, score: 84, summary: 'Conversamos sobre palavras que mudam o tom de um e-mail. Ótima fluência; atenção a preposições.', errors: [{ yours: 'I am agree', correct: 'I agree', why: 'Agree já é verbo, não usa am.' }], h: -10 }),
    ev(4, { type: 'lesson', course: 'lang:en', lessonId: 'C1-4', n: 85, title: 'Conduzindo reuniões', score: 95, errors: [], vocab: ['run a meeting', 'table a topic'] }),
    ev(3, { type: 'lesson', course: 'trk:ux-ia', lessonId: '0', n: 1, title: 'Pesquisa com usuários assistida por IA', score: 90, errors: [] }),
    ev(2, { type: 'lesson', course: 'lang:es', lessonId: 'B1-1', n: 42, title: 'Contando histórias', score: 74, errors: [{ q: 'Ayer ___ (ir) al cine', yours: 'iba', correct: 'fui', why: 'Ação pontual e terminada: pretérito indefinido.' }, { q: 'Traduza: Eu sinto falta de você', yours: 'Yo siento falta de ti', correct: 'Te echo de menos', why: '"Sentir falta" = echar de menos (falso amigo!).' }] }),
    ev(1, { type: 'lesson', course: 'lang:en', lessonId: 'C1-6', n: 87, title: 'Relatórios que todo mundo lê', score: 90, errors: [{ q: 'Despite ___ tired, she finished.', yours: 'she was', correct: 'being', why: 'Despite + gerúndio (ou substantivo).' }], vocab: ['bottom line', 'key takeaway'] }),
    ev(1, { type: 'conversation', course: 'lang:en', title: 'Your dream job abroad', minutes: 22, score: 88, summary: 'Ela falou sobre trabalhar como UX designer em Lisboa ou Toronto. Muito natural; ainda confunde "make" e "do".', convoId: cid, errors: [{ yours: 'I did a big mistake', correct: 'I made a big mistake', why: 'Mistake usa make.' }, { yours: 'since 3 years', correct: 'for 3 years', why: 'Duração = for; ponto de início = since.' }], next: 'Collocations com make/do.', h: -11 }),
    ev(1, { type: 'review', title: 'Revisão de memória', count: 24, score: 83, h: -1 })
  ];
  const files = {}; for (const e of history) (files[`history/${e.date.slice(0, 7)}.json`] ||= []).push(e);
  files[`lessons/lang_en/C1-7.json`] = SAMPLE_LESSON;
  files[`conversas/${cid}.json`] = { id: cid, history: [{ role: 'ai', text: 'Hey Emilly! If you could work anywhere in the world, where would it be?' }, { role: 'me', text: 'I think Lisbon, because I love the vibe and I have friends there.' }, { role: 'ai', text: 'Lisbon is a great pick! What kind of UX projects would you like to work on there?' }] };
  return { config: { geminiKey: 'demo', email: 'voce@exemplo.com', emailsOn: true, conversa: { modo: 'livre', hora: 19, agenda: [], lembrete: false } }, state, srs, files };
}

const CHAT = [
  { reply: 'Hey Emilly! Great to see you tonight. So, tell me: what was the last big decision you made at work?', correction: null, words: [] },
  { reply: 'Oh, that sounds like a tough call! How did you feel after you made it? Any regrets?', correction: { original: 'I did a decision about the new layout', better: 'I made a decision about the new layout', why: 'Decision usa "make", nunca "do".' }, words: [{ term: 'a tough call', meaning: 'uma decisão difícil' }] },
  { reply: 'I love that attitude. Last question: how do you usually deal with tight deadlines?', correction: null, words: [{ term: 'tight deadline', meaning: 'prazo apertado' }] }
];
let ci = 0;
function demoLesson(prompt) {
  const t = (prompt.match(/Tema: (.+?)(?: \(|\. Gramática)/) || prompt.match(/Aula: (.+?)\. Seja/) || [])[1]?.trim() || 'Aula de exemplo';
  const es = /de Espanhol, nível/.test(prompt);
  return {
    title: t, subtitle: '(Demonstração) No site de verdade, o IAlvorecer cria esta aula completa na hora.',
    goal: es ? 'Usar o tema da aula numa conversa real em espanhol.' : 'Entender o tema e aplicar hoje mesmo.',
    warmup: es ? '¿Qué sabes ya sobre este tema?' : 'O que você já sabe sobre este tema?',
    sections: es ? [{ heading: 'Para empezar', body: 'Esta é uma **aula de demonstração**. Na versão real, as explicações do espanhol vêm no seu nível, com exemplos e pronúncia.', examples: [{ t: '¿Qué te parece la idea?', pt: 'O que você acha da ideia?' }, { t: 'Me encantaría probarlo.', pt: 'Eu adoraria experimentar.' }] }]
      : [{ heading: 'Visão geral', body: 'Esta é uma **aula de demonstração**. Na versão real, o IAlvorecer monta a aula completa, com passo a passo, exemplos e exercícios, no idioma que você escolher (PT, EN ou ES).', examples: [{ t: 'Passo 1: entender o conceito', pt: 'Com exemplos do seu dia a dia.' }, { t: 'Passo 2: praticar', pt: 'Com exercícios corrigidos na hora.' }] }],
    tip: 'Fale com o IAlvorecer para pedir mudanças no tema ou no ritmo das aulas.',
    vocab: es ? [{ term: 'me encantaría', meaning: 'eu adoraria', example: 'Me encantaría viajar a México.' }, { term: 'echar de menos', meaning: 'sentir falta', example: 'Echo de menos a mi familia.' }] : [{ term: 'Conceito-chave', meaning: 'O ponto principal da aula', example: '' }],
    exercises: es ? [{ type: 'mcq', q: '"Sentir falta" em espanhol é…', options: ['sentir falta', 'echar de menos', 'faltar', 'extrañar mucho'], answer: 1, explain: 'Na Espanha se usa "echar de menos"; na América Latina também "extrañar".' }] : [{ type: 'mcq', q: 'Esta é uma aula de…', options: ['demonstração', 'verdade'], answer: 0, explain: 'No site real a aula é completa.' }],
    conversation: { topic: t, goal: 'Conversar sobre o tema', questions: es ? ['¿Qué opinas de este tema?'] : ['O que você aprendeu hoje?'] }
  };
}
let mi = 0;
const MENTOR = ['Oi! Que bom te ver de novo. Desde a última sessão, como andam as candidaturas para vagas remotas?', 'Ótimo começo! E o portfólio: você já escolheu os 3 projetos que quer mostrar?', 'Perfeito. Minha sugestão: comece pelo projeto do app, que tem o melhor resultado. Quer que eu monte um roteiro do case com você?'];
export async function demoAI({ prompt, contents, system }) {
  await new Promise(r => setTimeout(r, 700));
  const lastUser = contents ? (contents[contents.length - 1]?.parts?.[0]?.text || '') : '';
  if (contents && /plataforma pessoal de estudos/.test(system || '') && /curso/i.test(lastUser)) return { reply: 'Ótima ideia! Montei um curso de 8 aulas, do básico ao avançado. Posso criar em Seu Alvorecer?', actions: [{ type: 'create_course', title: 'Excel do zero', sub: 'Planilhas sem medo', icon: '📊', lessons: ['Conhecendo o Excel', 'Fórmulas básicas', 'Formatação que ajuda', 'Filtros e classificação', 'PROCV e PROCX', 'Tabelas dinâmicas', 'Gráficos', 'Projeto: controle financeiro'], ctx: 'Para iniciantes, com exercícios práticos.' }] };
  if (contents && /plataforma pessoal de estudos/.test(system || '')) return { reply: 'Fechado! Inglês continua na segunda, quarta e sexta, e o espanhol entra na terça e na quinta. Posso aplicar?', actions: [{ type: 'set_plan', second: 'es', secondDays: [2, 4] }] };
  if (contents && /modo mentoria de carreira/.test(system || '')) return { reply: MENTOR[Math.min(mi++, MENTOR.length - 1)] };
  if (contents) return CHAT[Math.min(ci++, CHAT.length - 1)];
  if (/Monte o plano/.test(prompt)) return { lessons: PLAN_EN };
  if (/moderador RIGOROSO/.test(prompt)) return { allowed: true, reason: '' };
  if (/BUSCAS DE VAGAS/.test(prompt)) return { jobs: [{ titulo: 'UX Designer Pleno remoto', palavras: 'UX designer pleno', local: 'Brasil', remoto: true, internacional: false, porque: 'Combina com seu objetivo de agora.' }, { titulo: 'UX/UI Designer (remote)', palavras: 'UX UI designer', local: 'Remote', remoto: true, internacional: true, porque: 'Próximo passo, em dólar.' }] };
  if (/Crie uma AULA/.test(prompt)) return /de Inglês, nível/.test(prompt) ? SAMPLE_LESSON : demoLesson(prompt);
  if (/Você corrige/.test(prompt)) { const n = (prompt.match(/"yours"/g) || []).length; return { results: Array.from({ length: n }, (_, i) => ({ ok: i % 2 === 0, score: i % 2 ? 0.5 : 1, corrected: 'She raised a concern about the deadline.', explain: i % 2 ? '"Levantar uma preocupação" = raise a concern (não "lift").' : 'Perfeito!' })) }; }
  if (/Analise esta/.test(prompt)) return { summary: 'Ótima conversa sobre decisões no trabalho. Você se expressou com naturalidade e usou bem "tough call".', score: 86, strengths: ['Fluência e ritmo natural', 'Boa variedade de vocabulário'], errors: [{ original: 'I did a decision', better: 'I made a decision', why: 'Decision usa make.' }], vocab: [{ term: 'a tough call', meaning: 'uma decisão difícil', example: 'It was a tough call.' }], next: 'Phrasal verbs de trabalho.' };
  if (/Crie /.test(prompt)) return { questions: SAMPLE_LESSON.exercises.filter(e => e.type !== 'write') };
  return { ok: true, msg: 'Hello · Hola · Bonjour', lessons: ['Aula extra 1', 'Aula extra 2'] };
}
