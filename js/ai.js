// Professor com IA (Google Gemini, plano gratuito). A chave fica no config.json do repositório privado.
export class NoKeyError extends Error { constructor() { super('Falta a chave do Gemini. Vá em Ajustes e cole sua chave (é grátis).'); } }

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export function makeAI(store) {
  // ---- Modelos: usa vários modelos grátis em sequência (cada um tem a própria cota diária) ----
  const ver = n => parseFloat((n.match(/-(\d+(\.\d+)?)/) || [])[1] || 0);
  const pref = (a, b) => (ver(b) - ver(a)) || (/preview/.test(a) - /preview/.test(b));
  function chainsFrom(names) {
    const ok = n => !/(image|tts|audio|live|embedding|exp|thinking|robotics|transcribe|e2b|e4b|banana)/.test(n);
    const lite = names.filter(n => /flash-lite/.test(n) && ok(n)).sort(pref);
    const gemma = names.filter(n => /^gemma-4/.test(n) && ok(n)).sort((a, b) => (/31b/.test(b) - /31b/.test(a)) || pref(a, b));
    const flash = names.filter(n => /flash/.test(n) && !/lite/.test(n) && ok(n)).sort(pref);
    return { full: [...lite, ...gemma, ...flash], fast: [...gemma, ...lite, ...flash], image: [...lite, ...flash, ...gemma] };
  }
  async function listChains(key) {
    const r = await fetch(`${BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } });
    if (!r.ok) throw new Error('Chave do Gemini inválida (confira em Ajustes).');
    const names = ((await r.json()).models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace('models/', ''));
    return { ...chainsFrom(names), v: 2, checked: new Date().toISOString().slice(0, 10) };
  }
  // Gemma não aceita "instrução de sistema" nem "modo JSON": junta tudo na mensagem
  function adapt(model, body) {
    if (!/^gemma/.test(model)) return body;
    const b = JSON.parse(JSON.stringify(body));
    const sys = (b.systemInstruction?.parts || []).map(p => p.text).join('\n'); delete b.systemInstruction;
    const wantJson = b.generationConfig?.responseMimeType === 'application/json';
    if (b.generationConfig) { delete b.generationConfig.responseMimeType; delete b.generationConfig.thinkingConfig; }
    const pos = wantJson ? '\n\nIMPORTANTE: responda APENAS com um JSON válido, sem nenhum texto antes ou depois e sem ```.' : '';
    const users = b.contents.filter(c => c.role === 'user');
    const first = users[0], last = users[users.length - 1];
    const tp = first?.parts?.find(p => typeof p.text === 'string');
    const pre = sys ? `INSTRUÇÕES (siga sempre):\n${sys}\n\n---\n\n` : '';
    if (tp) tp.text = pre + tp.text + (first === last ? pos : ''); else if (first) first.parts.unshift({ text: pre });
    if (last && last !== first) { const lp = last.parts.find(p => typeof p.text === 'string'); if (lp) lp.text += pos; }
    return b;
  }

  async function gen(args, _retry = 0) {
    const { system, contents, prompt, json = true, temperature = 0.7, fast = false, cache = null } = args;
    if (store.isDemo && store.demoAI) return store.demoAI({ system, contents, prompt, json });
    const key = store.config.geminiKey;
    if (!key && !store.aiProxy) throw new NoKeyError();
    const body = {
      contents: contents || [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, ...(json ? { responseMimeType: 'application/json' } : {}) }
    };
    if (system) body.systemInstruction = { parts: [{ text: system }] };
    const hasImage = body.contents.some(c => (c.parts || []).some(p => p.inlineData));
    let r;
    if (key) {
      let ch = store.config.modelChains;
      if (!ch || ch.v !== 2) { ch = await listChains(key); store.config.modelChains = ch; store.saveConfig(); }
      const list = store.config.model ? [store.config.model] : (hasImage ? ch.image : fast ? ch.fast : ch.full);
      for (const m of (list.length ? list : ['gemini-flash-lite-latest'])) {
        try { r = await fetch(`${BASE}/models/${m}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(adapt(m, body)) }); }
        catch { throw new Error('Sem conexão com a internet.'); }
        if (![429, 404, 503].includes(r.status) && !(r.status === 400 && /^gemma/.test(m))) break;
      }
      if (r.status === 404 && _retry < 1) { delete store.config.modelChains; delete store.config.model; return gen(args, _retry + 1); }
    } else {
      try { r = await store.aiProxy({ model: hasImage ? 'auto-image' : fast ? 'auto-fast' : 'auto-full', body, cache }); }
      catch { throw new Error('Sem conexão com a internet.'); }
      const u = r.headers?.get?.('x-ia-uso'); if (u) { store.iaUso = { ...(store.iaUso || {}), n: +u }; window.dispatchEvent(new Event('ia-uso')); }
    }
    if (r.status === 429) { let m = ''; try { m = (await r.json()).error?.message || ''; } catch { } throw new Error(/IAlvorecer/.test(m) ? m.replace('IAlvorecer: ', '') : 'O IAlvorecer está com muita gente agora (limite gratuito). Espere 1 minutinho e tente de novo.'); }
    if (r.status === 503 && _retry < 2) { await new Promise(s => setTimeout(s, 2500)); return gen(args, _retry + 1); }
    if (!r.ok) { const t = await r.text(); throw new Error(`A IA respondeu ${r.status}: ${t.slice(0, 160)}`); }
    const j = await r.json();
    const text = (j.candidates?.[0]?.content?.parts || []).filter(p => !p.thought).map(p => p.text || '').join('');
    if (!json) return text;
    try {
      const s = text.replace(/```(json)?/gi, '').trim();
      const a = s.indexOf('{'), b = s.lastIndexOf('}');
      return JSON.parse(a >= 0 && b > a ? s.slice(a, b + 1) : s);
    } catch { if (_retry < 1) return gen(args, _retry + 1); throw new Error('A IA respondeu num formato inesperado. Tente de novo.'); }
  }

  const prefs = () => store.state.profile?.prefs || {};
  const CLN = { pt: 'português do Brasil', en: 'inglês (English)', es: 'espanhol (español)' };
  const who = () => { const p = store.state.profile || {}; return `${p.name || 'o aluno'}, brasileiro(a)${p.area ? `, área profissional: ${p.area}` : ''}`; };
  const STYLE = { conversa: 'prefere MUITA prática e conversa, pouca teoria (teoria curta e direta)', equilibrado: 'prefere equilíbrio entre explicação e prática', estrutura: 'gosta de entender as regras: explique a estrutura com clareza, tabelas simples e passo a passo' };
  const LEARNED = { natural: 'aprendeu de forma natural (games, séries, internet): entende bem, mas não conhece as regras e tem erros fixos de quem aprendeu de ouvido', escola: 'estudou em escola/curso: conhece regras, mas precisa de fluência e naturalidade', fora: 'já morou/viajou para fora', zero: 'está começando agora' };
  const BACKGROUND = () => {
    const p = prefs();
    return `ALUNO(A): ${who()}. ${p.learned ? 'Histórico: ' + (LEARNED[p.learned] || p.learned) + '. ' : ''}${p.style ? 'Estilo: ' + (STYLE[p.style] || p.style) + '. ' : ''}${p.interests?.length ? 'Interesses (use nos exemplos): ' + p.interests.join(', ') + '. ' : ''}${p.goals?.length ? 'Objetivos: ' + p.goals.join(', ') + '. ' : ''}${p.styles?.length ? 'Como prefere aprender: ' + p.styles.map(s => STY[s] || s).join(', ') + '. ' : ''}Odeia aula entediante e repetitiva: seja direto, moderno, prático, com exemplos reais. Use só ferramentas e recursos gratuitos quando sugerir algo.
${ALMA}`;
  };
  const STY = { recomendado: 'equilibrado (um pouco de tudo)', conversa: 'conversação', exercicios: 'muitos exercícios', teoria: 'teoria e regras bem explicadas', anotacoes: 'resumos para anotar' };
  const ALMA = `ESPÍRITO DO IALVORECER: você é o IAlvorecer (uma IA, nunca se apresente com nome humano), que faz de tudo para as coisas darem certo e ajuda cada pessoa a se planejar e conquistar o que quer; uma IA de verdade que se esforça ao máximo para entender as pessoas e ajudar: humana, sensível, carinhosa e paciente, nunca um robô de atendimento. Se faltar informação, faça a melhor suposição razoável (diga qual foi) e ajude mesmo assim; pergunte no máximo uma coisa por vez. Seja honesta: não invente fatos; quando não tiver certeza, diga. O IAlvorecer foi criado pela designer Emilly Urbano para ajudar quem não pode pagar cursos e profissionais.`;
  const styleRule = () => { const s = prefs().styles || []; if (!s.length || s.includes('recomendado')) return 'ESTILO: equilibrado — um pouco de teoria, bastante prática, exercícios e conversa.'; return 'ESTILO PREFERIDO (adapte a aula): ' + s.map(x => ({ conversa: 'mais perguntas de conversação e diálogos', exercicios: 'mais exercícios e variados', teoria: 'explique as regras com profundidade e exemplos', anotacoes: 'termine com um resumo claro para anotar' }[x] || x)).join('; ') + '.'; };
  const size = () => { const m = +prefs().minutes || 30; return m <= 15 ? { sec: '2 a 3', ex: 6, voc: '6 a 8' } : m >= 45 ? { sec: '4 a 5', ex: 12, voc: '12 a 15' } : { sec: '3 a 4', ex: 9, voc: '10 a 12' }; };

  function langRule(level) {
    const e = prefs().explain;
    if (e === 'pt') return 'Explicações sempre em português do Brasil; exemplos na língua-alvo com tradução.';
    if (e === 'alvo' && !['A1'].includes(level)) return 'Explicações NA LÍNGUA-ALVO (imersão), simples para o nível, com notas curtas em português só quando necessário. Tradução dos exemplos em português.';
    if (['A1', 'A2'].includes(level)) return 'Explicações em português do Brasil, exemplos na língua-alvo com tradução.';
    if (['B1', 'B2'].includes(level)) return 'Explicações em português do Brasil, mas com bastante da língua-alvo; exemplos sempre na língua-alvo com tradução.';
    return 'Explicações NA LÍNGUA-ALVO (imersão), com notas curtas em português só quando ajudar muito. Tradução dos exemplos em português.';
  }

  const EX_SCHEMA = `Tipos de exercício permitidos:
{"type":"mcq","q":"pergunta","options":["a","b","c","d"],"answer":0,"explain":"por que (PT)"}
{"type":"fill","q":"frase com ___ no lugar da lacuna","answer":"resposta","accept":["outras respostas aceitas"],"explain":"(PT)"}
{"type":"translate","q":"frase em português","answer":"tradução modelo","explain":"(PT)"}
{"type":"write","q":"tarefa curta de produção (2 a 4 frases)"}`;

  return {
    gen,

    async assistant({ history, context }) {
      const system = `Você é o IAlvorecer: uma IA que faz de tudo para as coisas darem certo e ajuda cada pessoa a se planejar e conquistar o que quer. Você vive dentro da plataforma IAlvorecer, uma plataforma pessoal de estudos e cuidado (idiomas, tecnologia, IA, carreira e várias áreas de interesse). Fale em ${CLN[prefs().contentLang || 'pt']}, de forma calorosa, curta e clara (no máximo 5 frases, pode usar listas curtas).
SEGURANÇA (RIGOROSO): nunca crie, sugira ou ensine nada sexual/adulto (+18), violento, perigoso (armas, explosivos, drogas, automutilação), ilegal ou antiético (golpes, fraudes, invasão de sistemas, pirataria, apostas, discurso de ódio). Se pedirem, recuse com educação, sem a ação, e ofereça uma alternativa saudável. Temas de saúde e finanças: só conteúdo educativo geral.
ÁREAS DE INTERESSE disponíveis (o aluno troca no menu ▦ ou pedindo a você): ${JSON.stringify(context.areas_disponiveis || [])}.
CURSOS PERSONALIZADOS ("Seu Alvorecer"): se o aluno pedir um curso que não existe no catálogo, você pode criá-lo (create_course) com 8 a 16 aulas bem ordenadas do básico ao avançado. Todo curso criado fica aberto a qualquer pessoa interessada no tema: escreva título, subtítulo e "ctx" pensando em um público amplo (sem citar a profissão, o nome ou os objetivos pessoais de quem pediu, nem o que a pessoa "não quer ser"), em linguagem simples e começando pelos conceitos básicos. Prefira sempre um curso do catálogo se já existir um parecido.
Você ajuda com dúvidas sobre o site e PODE ALTERAR o cronograma e as configurações de estudo do aluno, mas NUNCA o código ou o sistema do site.
COMO O SITE FUNCIONA: Início (visão geral); Idiomas (curso principal, aula do dia, cronograma, conversação por voz à noite); Design & Criação e Tecnologia & IA (cursos com aulas geradas pelo IAlvorecer); Mentoria de carreira (sessões de mentoria com o IAlvorecer + plano de carreira); Memorização (cartões com repetição espaçada, teste da semana e do mês); Histórico (linha do tempo, erros, vocabulário, níveis); Ajustes (perfil, plano, chave do Gemini, e-mails, pausa). Cada nível de idioma tem 20 aulas; ao terminar, prova de nível (70% para subir). E-mails seg–sex 8h e lembrete 19h30, sem feriados. Toda alteração feita por você pode ser desfeita.
SITUAÇÃO ATUAL DO ALUNO (JSON): ${JSON.stringify(context)}
AÇÕES DISPONÍVEIS (use só quando o aluno pedir uma mudança; use apenas cursos que existem em "cursos_disponiveis"):
{"type":"set_plan","main":"en","second":"es ou vazio","secondDays":[2,4]}  (dias: 1=seg … 5=sex)
{"type":"set_level","course":"lang:en","level":"B2"}
{"type":"set_prefs","minutes":30,"convMinutes":30,"style":"conversa|equilibrado|estrutura","explain":"auto|pt|alvo","interests":["..."]}
{"type":"emails","on":true,"evening":true,"pauseUntil":"AAAA-MM-DD ou null"}
{"type":"skip_lessons","course":"lang:en","count":2}
{"type":"edit_lesson","course":"lang:en","n":88,"title":"novo tema","notes":"o que a aula deve focar"}
{"type":"replan_level","course":"lang:en","wishes":"o que o aluno quer no plano do nível atual (aulas já feitas são mantidas)"}
{"type":"start_course","course":"trk:figma"}
{"type":"reset_course","course":"lang:en","level":"A1 (opcional)"}
{"type":"clear_history","resetStats":true,"resetCards":false}
{"type":"reset_all"}
{"type":"set_area","area":"id da área"}
{"type":"set_content_lang","lang":"pt|en|es","course":"(opcional: só para um curso; sem course = padrão do site)"}
{"type":"create_course","title":"nome do curso","sub":"subtítulo curto","icon":"um emoji","lessons":["títulos das aulas"],"ctx":"como as aulas devem ser (público, nível, foco, ferramentas grátis)"}
{"type":"delete_course","course":"cus:id"}
{"type":"open_page","page":"mentoria_sessao|mentoria|cronograma|seu|cuidar|desabafo|alimentacao|treino|sobre|apoiar|ajustes|historico|idiomas|memorizacao"}  (ex.: "abrir mentoria de carreira" → mentoria_sessao; "falar com o IAlvorecer" é falar com você mesmo; "quero desabafar" → desabafo)
{"type":"add_language","name":"nome do idioma (qualquer idioma real que não esteja na lista)","main":false}
{"type":"undo"}
${ALMA}
COMO AGIR: se der para entender a intenção, já proponha a solução/ação em vez de pedir mais dados; só pergunte se for realmente ambíguo (uma pergunta só). Responda dúvidas de verdade, com explicação clara, nunca com "não tenho informações suficientes".
FALAR COM A EMILLY (criadora): deixe por último. Se a pessoa pedir para falar com ela, primeiro pergunte com carinho, uma vez, se você pode tentar resolver — diga que vai se esforçar ao máximo. Se ela insistir (ou for problema técnico que você não resolve), explique: Ajustes → "Falar com a Emilly" ou "Reportar erro", ou o e-mail de atendimento iaalvorecer@gmail.com (a Emilly, criadora, analisa pessoalmente os relatos de erro). Diga que a Emilly quer muito ajudar.
SAÚDE E EMOÇÕES: para desabafo, alimentação, água e treino existe "Cuidar de mim" (dentro de Seu Alvorecer); ofereça abrir (open_page). Se a pessoa estiver em sofrimento intenso ou falar em se machucar, acolha e indique CVV 188 (24h, gratuito) e SAMU 192.
Regras: Para ações que apagam ou reiniciam, explique a consequência e lembre que dá para desfazer. Não invente números de aula. Se só for uma dúvida, responda sem ações.
Responda SEMPRE em JSON: {"reply":"texto para o aluno","actions":[...]} (actions vazio se não houver mudança).`;
      const contents = history.map(m => ({ role: m.role === 'me' ? 'user' : 'model', parts: [{ text: m.role === 'me' ? m.text : JSON.stringify({ reply: m.text, actions: [] }) }] }));
      return gen({ system, contents, temperature: 0.4, fast: true });
    },

    mentorSystem({ career, langs }) {
      return `Você é o IAlvorecer no modo mentoria de carreira: experiente, empático e muito prático, numa sessão 1:1 com ${who()}. ${BACKGROUND()}
Idiomas e níveis atuais dela: ${langs}.
O que já sabemos (pode estar vazio): ${JSON.stringify(career || {})}.
SEU MÉTODO: entenda (1) situação atual: cargo, experiência, salário, rotina; (2) a ÁREA ESPECÍFICA em que quer trabalhar; (3) objetivos e sonhos (ex.: morar nos EUA ou no Japão); (4) MEDOS e inseguranças (acolha com empatia e transforme em passos concretos); (5) prazos e restrições; (6) habilidades, portfólio, idiomas. Se ainda não sabe algo disso, pergunte com naturalidade, uma coisa por vez. Depois construa uma ESTRATÉGIA EM ETAPAS realista: o sonho fica como norte, mas primeiro o passo possível agora (ex.: um trabalho remoto no Brasil ganhando melhor → trabalhar para empresas de fora morando no Brasil → mudança de país). Sugira ações concretas (onde procurar vagas, como se candidatar, o que estudar, números de salário de mercado aproximados e como confirmar).
Recomende cursos do site quando fizer sentido: Currículo perfeito, Entrevistas que dão certo, O melhor portfólio, Carreira: do emprego ao internacional, Inglês para entrevistas e trabalho, Figma, Sites com HTML/CSS e IA, Loja virtual sem gastar.
REGRAS: português do Brasil; respostas curtas (2 a 5 frases), uma pergunta por vez; honesta sobre o que é realista, mas encorajadora. Sem listas longas.
Responda JSON: {"reply":"..."}`;
    },

    async mentorUpdate({ transcript, career }) {
      return gen({
        prompt: `Você é o IAlvorecer no modo mentoria de carreira. Atualize o PLANO DE CARREIRA da aluna com base na sessão abaixo e no que já existia.
Plano anterior: ${JSON.stringify(career || {})}
Sessão: ${JSON.stringify(transcript)}
Inclua também "jobs": 4 a 6 BUSCAS DE VAGAS realistas para ela agora e no próximo passo, no formato {"titulo":"ex.: UX Designer remoto (Brasil)","palavras":"termos de busca curtos","local":"Brasil ou país","remoto":true,"internacional":false,"porque":"1 frase"}.
Responda JSON: {"jobs":[...],"summary":"resumo da sessão em 2–3 frases","profile":{"atual":"situação atual","areaDesejada":"área específica em que quer trabalhar","experiencia":"...","medos":"medos e inseguranças mencionados","salarioAtual":"...","salarioMeta":"...","sonho":"...","restricoes":"..."},"plan":{"agora":"objetivo realista para os próximos meses","medio":"objetivo de 1–2 anos","longo":"o sonho / norte","estrategia":"2–3 frases"},"steps":["próximos passos concretos (5 a 8)"],"weekly":["ações para esta semana (3 a 5)"],"courses":["ids de cursos recomendados entre: trk:curriculo, trk:entrevistas, trk:portfolio, trk:carreira, comp:en-trabalho, trk:figma, trk:web, trk:loja, trk:comunicacao, trk:negociacao"]}
Mantenha informações anteriores que continuam válidas.`, temperature: 0.4
      });
    },

    async jobSearches({ career }) {
      return gen({
        prompt: `Você é recrutadora experiente. Com base no perfil e plano de carreira abaixo (inclui texto do LinkedIn, se houver), proponha 6 BUSCAS DE VAGAS realistas: algumas para o passo de agora (ex.: remoto no Brasil) e algumas para o próximo passo (ex.: empresas de fora).
${JSON.stringify(career)}
Responda JSON: {"jobs":[{"titulo":"...","palavras":"termos de busca curtos (em inglês se for vaga internacional)","local":"Brasil ou país/região","remoto":true,"internacional":false,"porque":"1 frase"}]}`, temperature: 0.5, fast: true
      });
    },

    async moderate({ text }) {
      return gen({
        prompt: `Você é um moderador RIGOROSO de uma plataforma educativa usada por pessoas de todas as idades. Avalie se o pedido de curso abaixo é permitido.
PROIBIDO: conteúdo sexual/adulto (+18), nudez, fetiches; violência, armas, explosivos; drogas ilícitas e uso indevido de medicamentos; automutilação, distúrbios alimentares extremos; crimes, golpes, fraudes, invasão de sistemas/contas, malware, pirataria, falsificação, lavagem de dinheiro, sonegação; apostas e cassinos; discurso de ódio ou discriminação; perseguição/espionagem de pessoas; qualquer coisa antiética ou perigosa. Saúde/finanças: só educativo geral.
PERMITIDO: temas educativos, profissionais, criativos, de saúde geral e bem-estar, segurança e prevenção (ex.: "como se proteger de golpes").
Pedido: ${JSON.stringify(text)}
Responda JSON: {"allowed":true|false,"reason":"motivo curto em português"}`, temperature: 0, fast: true
      });
    },

    async planLevel({ lang, level, themes, cycle, errors, covered, wishes }) {
      return gen({
        prompt: `${BACKGROUND()}
Monte o plano de aulas do nível ${level} (QECR) de ${lang.name} (${lang.native})${cycle > 1 ? `, ciclo ${cycle} (aprofundamento, sem repetir temas anteriores)` : ''}.
Siga exatamente estes 20 temas, nesta ordem: ${themes.map((t, i) => `${i + 1}. ${t}`).join(' | ')}
Para cada tema, escolha o ponto de gramática/estrutura ideal para ${level} em ${lang.name}, numa progressão lógica. Personalize com os erros recentes dela: ${errors.slice(0, 15).join(' ; ') || 'nenhum ainda'}.
Já estudados (não repetir igual): ${covered.slice(-40).join(' ; ') || 'nada'}.
${wishes ? `PEDIDOS DO ALUNO PARA ESTE PLANO (prioridade, pode adaptar os temas): ${wishes}` : ''}
Responda JSON: {"lessons":[{"title":"título curto e atraente em português","target":"o título na língua-alvo","grammar":"ponto gramatical/estrutura","vocab":"campo de vocabulário","can":"Ao final, consigo… (PT)"}]} com exatamente 20 itens.`, temperature: 0.6
      });
    },

    async lesson({ kind, course, outline, level, lang, errors, contentLang = 'pt', cacheKey = null }) {
      const isLang = kind === 'lang' || kind === 'comp';
      const inEnglish = contentLang === 'en';
      const lessonLang = isLang ? `${lang.name} (${lang.native})` : contentLang === 'pt' ? 'português do Brasil' : `${CLN[contentLang]} (a aula INTEIRA nesse idioma, inclusive títulos, explicações e exercícios)`;
      const z = size();
      return gen({
        prompt: `${BACKGROUND()}
Crie uma AULA COMPLETA e envolvente (${prefs().minutes || 30} min) ${isLang ? `de ${lang.name}, nível ${level}` : `do curso "${course.title}" (${course.sub || ''}), escrita em ${lessonLang}`}.
${course.ctx ? `CONTEXTO DO CURSO (siga à risca): ${course.ctx}` : ''}
${isLang ? `Tema: ${outline.title}${outline.target ? ` (${outline.target})` : ''}. Gramática/estrutura: ${outline.grammar || 'a mais útil para o tema'}. Vocabulário: ${outline.vocab || 'do tema'}. Objetivo: ${outline.can || ''}${outline.notes ? `\nPEDIDO DO ALUNO PARA ESTA AULA: ${outline.notes}` : ''}
Regra de idioma: ${langRule(level)}
Inclua dicas de pronúncia quando fizer sentido e diferenças com o português (falsos amigos, interferências).` : `Aula: ${outline.title}. Seja prático, com passo a passo, exemplos reais e uma tarefa aplicável hoje.`}
Erros recentes dela para reciclar de forma natural: ${errors.slice(0, 10).join(' ; ') || 'nenhum'}.
${styleRule()}
${EX_SCHEMA}
Responda JSON:
{"title":"...","subtitle":"uma linha","goal":"o que ela vai conseguir fazer (PT)","warmup":"pergunta curta de aquecimento",
"sections":[{"heading":"...","body":"markdown com **negrito** e listas","examples":[{"t":"${isLang ? 'frase na língua-alvo' : 'exemplo'}","pt":"${isLang ? 'tradução' : 'comentário curto'}"}]}],
"tip":"${isLang ? 'dica de nativo/cultura' : 'dica de ouro'}",
${isLang ? '"vocab":[{"term":"...","meaning":"significado em PT","example":"exemplo de uso"}],' : '"vocab":[{"term":"termo ou conceito-chave","meaning":"explicação rápida em 1 frase simples, sem jargão","example":"exemplo curto do dia a dia"}],'}
"exercises":[...],
${isLang ? '"conversation":{"topic":"tema da conversação","goal":"objetivo (PT)","questions":["3 a 5 perguntas para puxar conversa"]},' : ''}
"extra":{"notas":["5 a 8 tópicos de resumo para anotar"],"desafio":"um mini desafio extra, opcional"}}
Regras: ${z.sec} seções ricas; ${isLang ? z.voc : '6 a 8'} ${isLang ? 'itens de vocabulário' : 'TERMOS (conceitos-chave da aula, cada um só com a explicação rápida; a explicação aprofundada é pedida depois, no botão "Saiba mais")'};${z.ex} exercícios misturando os tipos (pelo menos 3 mcq, 2 fill${isLang ? ', 2 translate' : ''}, 1 write), do mais fácil ao mais difícil.${isLang ? '' : ` COMO ESCREVER (importante): este curso é aberto a qualquer pessoa interessada no tema, de qualquer profissão e nível; nunca presuma quem está lendo, nunca fale de "quem não quer virar" algo nem de objetivos pessoais da pessoa. Linguagem simples e amigável, sem jargão: explique cada termo técnico na primeira vez que aparecer. Comece pela ideia geral (o que é e para que serve), use analogias do dia a dia, e só depois entre nos detalhes, do mais fácil ao mais completo. Não presuma conhecimento prévio. Quando o tema envolver IA, ensine primeiro o conceito e como a coisa funciona; use a IA como ferramenta para acelerar e facilitar, mostrando como pedir (prompts prontos em \`código\`) apenas quando já tiver explicado o necessário, sem começar a aula por prompts. Se for aula prática (Figma, código, projeto), as seções devem ser um PASSO A PASSO numerado e detalhado.`}${kind === 'cus' ? ' Este é um curso personalizado pedido pelo aluno: mantenha tudo educativo, seguro e legal; recuse qualquer conteúdo adulto, perigoso ou ilegal.' : ''}`, temperature: 0.8, cache: cacheKey
      });
    },

    // Explicação aprofundada de um termo (usada pelo "Saiba mais" quando a aula é antiga e não trouxe o texto)
    async explainTerm({ term, meaning, courseTitle, lessonTitle }) {
      return gen({
        prompt: `Explique o termo "${term}" (${meaning || 'conceito da aula'}) da aula "${lessonTitle || ''}" do curso "${courseTitle || ''}", em português do Brasil, para qualquer pessoa interessada, sem presumir conhecimento prévio nem profissão. Linguagem simples, sem jargão (se usar um termo técnico, explique). Em 4 a 6 frases: o que é, para que serve, uma analogia do dia a dia e um exemplo prático.
Responda JSON: {"more":"a explicação (markdown simples)"}`, temperature: 0.5, fast: true
      });
    },

    async grade({ items, langName }) {
      return gen({
        prompt: `Você corrige exercícios de ${langName} de uma aluna brasileira. Seja justo: aceite respostas corretas mesmo que diferentes do modelo; ignore maiúsculas e pontuação. Explique em português, curto e gentil.
Itens: ${JSON.stringify(items)}
Responda JSON: {"results":[{"ok":true,"score":1,"corrected":"versão correta/natural da resposta dela","explain":"explicação curta (PT)"}]} na mesma ordem, score de 0 a 1.`, temperature: 0.2, fast: true
      });
    },

    chatSystem({ lang, level, topic, goal, questions, words, errors, isTrack, contentLang = 'pt', tutor }) {
      const L = isTrack ? CLN[contentLang] : `${lang.native} (${lang.name})`;
      return `You are IAlvorecer (an AI — never give yourself a human name), a warm, witty and sharp ${isTrack ? 'mentor' : 'conversation tutor'} in a live 1:1 ${isTrack ? 'discussion' : 'speaking class'} with ${who()}.
${isTrack ? '' : `Student level: ${level} (CEFR). `}Topic: ${topic}. Goal: ${goal || 'conversa natural'}. Ideas to explore: ${(questions || []).join(' / ')}.
${words?.length ? `Naturally recycle these words/expressions: ${words.join(', ')}.` : ''}
${errors?.length ? `Her recent recurring mistakes (create chances to practice them): ${errors.slice(0, 8).join(' ; ')}.` : ''}
RULES:
- Speak ONLY ${L} in "reply"${isTrack ? '' : `, adapted to level ${level}`}. This is spoken (text-to-speech): 1–3 short sentences, no lists, no emojis, no markdown.
- Always end with a question or a mini-challenge. Be curious about her life, opinions, work, travels. React like a real person (humor welcome).
- Push her to elaborate; if she answers too short, ask for more detail. Occasionally introduce a useful new expression.
- ${isTrack ? 'If she says something incorrect about the topic, gently correct it in the reply.' : 'If her last message has a real mistake (grammar, wrong word, unnatural phrasing, false friend), fill "correction". Ignore punctuation/capitalization (speech-to-text). Do not nitpick the same small thing twice.'}
- If she writes in Portuguese, answer in ${L} and help her say it.
Return JSON only: {"reply":"...","correction":null or {"original":"what she said","better":"natural version","why":"explicação curta em português"},"words":[{"term":"useful word you used","meaning":"significado em PT"}]} (words: 0–2 items).`;
    },

    async chat({ system, history }) {
      const contents = history.map(m => ({ role: m.role === 'me' ? 'user' : 'model', parts: [{ text: m.role === 'me' ? m.text : JSON.stringify({ reply: m.text }) }] }));
      if (!contents.length || contents[0].role !== 'user') contents.unshift({ role: 'user', parts: [{ text: '[A aula começou. Cumprimente-a e abra a conversa.]' }] });
      return gen({ system, contents, temperature: 0.9, fast: true });
    },

    async summarize({ langName, transcript, corrections, isTrack }) {
      return gen({
        prompt: `Analise esta ${isTrack ? 'discussão' : 'aula de conversação'} (${langName}) de uma aluna brasileira e faça um relatório em português.
Transcrição: ${JSON.stringify(transcript)}
Correções já feitas: ${JSON.stringify(corrections)}
Responda JSON: {"summary":"2–3 frases do que conversaram e como ela foi","score":0-100,"strengths":["pontos fortes"],"errors":[{"original":"...","better":"...","why":"(PT)"}],"vocab":[{"term":"palavra/expressão útil para ela revisar","meaning":"PT","example":"..."}],"next":"o que focar na próxima vez"}
Liste até 8 erros reais (inclua os já corrigidos) e 4–8 itens de vocabulário.`, temperature: 0.3
      });
    },

    async test({ title, langName, level, n, cards, errors, scope }) {
      return gen({
        prompt: `${BACKGROUND()}
Crie ${title} de ${langName}${level ? `, nível ${level}` : ''} com ${n} questões. ${scope || ''}
Baseie-se no que ela estudou: vocabulário ${JSON.stringify(cards.slice(0, 60).map(c => c.front + ' = ' + c.back))}; erros dela ${JSON.stringify(errors.slice(0, 30))}.
Teste memória E uso real (não só tradução literal). Do fácil ao difícil.
${EX_SCHEMA}
Responda JSON: {"questions":[...]} só com os tipos mcq, fill e translate${n >= 20 ? ', mais 1 write no final' : ''}.`, temperature: 0.6
      });
    },

    async placement({ lang }) {
      return gen({
        prompt: `Crie um TESTE DE NIVELAMENTO de ${lang.name} (${lang.native}) para um brasileiro, com 18 questões: 3 de cada nível A1, A2, B1, B2, C1, C2 (QECR), em ordem crescente de dificuldade.
Avalie gramática, vocabulário e uso natural (não só tradução). Enunciados curtos.
Tipos: {"type":"mcq","level":"B1","q":"...","options":["a","b","c","d"],"answer":0,"explain":"(PT)"} ou {"type":"fill","level":"B2","q":"frase com ___","answer":"...","accept":[],"explain":"(PT)"}.
Responda JSON: {"questions":[...]}`, temperature: 0.4
      });
    },

    async extendTrack({ course, doneTitles }) {
      return gen({
        prompt: `${BACKGROUND()}
O curso "${course.title}" (${course.sub || ''}) terminou. Aulas feitas: ${doneTitles.join(' | ')}.
Proponha as próximas 8 aulas, mais avançadas e práticas, sem repetir. Responda JSON: {"lessons":["título 1", "..."]}`, temperature: 0.7
      });
    }
  };
}
