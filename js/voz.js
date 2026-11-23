// Assistente de voz do IAlvorecer. Arquivo à parte: só carrega quando a pessoa clica no botão de voz.
// Fala ou digita: abre cursos e áreas ("abra o curso de inglês"), conversa como num chat, e lê as respostas em voz alta.
import { listen, canListen, canSpeak, speak, stopSpeaking, pauseSpeaking, resumeSpeaking, speechState, onSpeechState, vozesDoIdioma, vozPref, salvarVozPref } from './speech.js?v=69';

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const LOCALE = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
const PAGINAS = [
  { n: ['agenda', 'minha rotina', 'checklist'], h: '#/agenda', t: 'Agenda', d: 'Aqui fica sua rotina do dia, com checklist, água, treino e horários.' },
  { n: ['cuidados', 'cuidar da pele', 'pele', 'unhas', 'cabelo', 'higiene'], h: '#/cuidados', t: 'Cuidados', d: 'Pele, unhas, cabelo, higiene e cheiro, com um guia feito para você.' },
  { n: ['cuidar de mim', 'desabafo', 'desabafar', 'alimentacao', 'treino', 'saude'], h: '#/cuidar', t: 'Cuidar de mim', d: 'Desabafo, alimentação, água e treino num só lugar.' },
  { n: ['cronograma'], h: '#/cronograma', t: 'Cronograma', d: 'Seus dias e horários de estudo.' },
  { n: ['memorizacao', 'revisar', 'cartoes', 'revisao'], h: '#/memorizacao', t: 'Memorização', d: 'Cartões para fixar o que você aprendeu, no tempo certo.' },
  { n: ['historico'], h: '#/historico', t: 'Histórico', d: 'Tudo o que você já fez, em ordem.' },
  { n: ['mentoria', 'carreira'], h: '#/mentoria', t: 'Mentoria de carreira', d: 'Conversas e um plano para sua carreira.' },
  { n: ['seu alvorecer', 'meus cursos', 'cursos que eu pedi'], h: '#/seu', t: 'Seu Alvorecer', d: 'Os cursos feitos sob medida para você.' },
  { n: ['ajustes', 'configuracoes', 'configuracao'], h: '#/ajustes', t: 'Ajustes', d: 'Conta, e-mails, dias de estudo e mais.' },
  { n: ['apoiar', 'doacao', 'pix'], h: '#/apoiar', t: 'Apoiar', d: 'Como ajudar o IAlvorecer a continuar gratuito.' },
  { n: ['sobre'], h: '#/sobre', t: 'Sobre', d: 'Quem faz o IAlvorecer e por quê.' },
  { n: ['inicio', 'pagina inicial', 'home'], h: '#/', t: 'Início', d: 'Sua página inicial.' }
];
const VERBO = /\b(abr[ae]|abrir|abro|ir para|va para|vai para|me leve|me leva|levar|quero ver|quero ir|mostre|mostra|onde fica|como (eu )?(abro|entro|acesso)|acessar|entrar no|entrar na)\b/;

function destinos({ C, S }) {
  const out = [];
  for (const l of [...C.languages, ...(S.state.customLangs || [])]) out.push({ n: [norm(l.name), norm(l.native)].filter(Boolean), h: '#/curso/lang:' + l.id, t: l.name, d: `Curso de ${l.name}: aulas, conversação e seu nível, tudo aqui.`, lang: true });
  for (const [id, t] of Object.entries(C.tracks)) {
    out.push({ n: [norm(t.name)], h: '#/trilha/' + id, t: t.name, d: `${t.courses.length} cursos nesta área. Escolha por onde começar.`, area: true });
    for (const c of t.courses) out.push({ n: [norm(c.title)], h: '#/curso/trk:' + c.id, t: c.title, d: c.sub || 'Curso aberto. Comece pela primeira aula.' });
  }
  for (const c of S.state.custom || []) out.push({ n: [norm(c.title)], h: '#/curso/cus:' + c.id, t: c.title, d: c.sub || 'Um curso feito para você.' });
  for (const p of PAGINAS) out.push({ n: p.n.map(norm), h: p.h, t: p.t, d: p.d });
  return out;
}
function acharDestino(txt, deps) {
  const u = ' ' + norm(txt) + ' ';
  if (!VERBO.test(norm(txt))) return null;
  let melhor = null, pontos = 0;
  for (const d of destinos(deps)) {
    for (const nome of d.n) {
      if (!nome) continue;
      let p = 0;
      if (u.includes(' ' + nome + ' ')) p = nome.length + 10;
      else {
        const toks = nome.split(' ').filter(w => w.length > 3);
        if (toks.length >= 2) { const ok = toks.filter(w => u.includes(' ' + w)).length; if (ok >= Math.max(2, Math.ceil(toks.length * .6))) p = ok * 3; }
      }
      if (p > pontos) { pontos = p; melhor = d; }
    }
  }
  return melhor;
}

let st = null; // estado da janela (uma só)

export function abrirVoz(deps) {
  if (document.getElementById('voz')) return fechar();
  const { S, esc, md, toast, AI, asstContext, applyActions, describeAction } = deps;
  const pref = () => vozPref();
  const idioma = () => LOCALE[S.state?.profile?.prefs?.contentLang || 'pt'] || 'pt-BR';
  st = { msgs: [], ouvindo: false, parar: null, falando: -1, deps };
  document.body.insertAdjacentHTML('beforeend', `<div class="voz" id="voz" role="dialog" aria-label="Assistente de voz">
    <div class="voz-h"><span class="voz-orb" aria-hidden="true"></span><div><b>Assistente de voz</b><div class="small muted">Fale ou digite o que precisar</div></div><span class="spacer"></span>
      <button class="iconbtn" id="vozCfg" title="Voz e leitura" aria-label="Voz e leitura">⚙</button><button class="iconbtn" id="vozX" title="Fechar" aria-label="Fechar">✕</button></div>
    <div class="voz-cfg" id="vozCfgBox" hidden></div>
    <div class="voz-m" id="vozM"></div>
    <div class="voz-in"><button class="voz-mic" id="vozMic" title="Falar" aria-label="Falar"><span>🎤</span></button><textarea id="vozT" rows="1" placeholder="Fale ou digite aqui…"></textarea><button class="voz-send" id="vozS" aria-label="Enviar">➤</button></div></div>`);
  const $ = s => document.querySelector(s);
  st.msgs.push({ role: 'ai', text: `Oi${S.state?.profile?.name ? ', ' + S.state.profile.name : ''}! Eu sou o assistente de voz do IAlvorecer e posso ajudar com o que você precisar. É só falar ou digitar. Por exemplo: “abra o curso de inglês”, “como funciona a Agenda?” ou só desabafar comigo.`, sem: true });
  st.fecha = e => { if (e.key === 'Escape') fechar(); };
  document.addEventListener('keydown', st.fecha);
  $('#vozX').onclick = fechar;
  $('#vozS').onclick = () => enviar($('#vozT').value, false);
  $('#vozT').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar($('#vozT').value, false); } };
  $('#vozMic').onclick = alternarMic;
  $('#vozCfg').onclick = () => { const b = $('#vozCfgBox'); b.hidden = !b.hidden; if (!b.hidden) cfgRender(); };
  st.off = onSpeechState(() => render());

  function cfgRender() {
    const b = $('#vozCfgBox'), vs = vozesDoIdioma(idioma()), p = pref();
    b.innerHTML = `<label>Idioma da fala<select id="cfgL"><option value="pt">Português</option><option value="en">English</option><option value="es">Español</option></select></label>
      <label>Voz<select id="cfgV"><option value="">Automática (a mais natural)</option>${vs.map(v => `<option value="${esc(v.name)}"${p.nome === v.name ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label>
      <label>Velocidade<select id="cfgR">${[['0.85', 'Mais devagar'], ['1', 'Normal'], ['1.15', 'Mais rápida']].map(([v, t]) => `<option value="${v}"${String(p.rate || 1) === v ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="chk"><input type="checkbox" id="cfgA"${p.sempre ? ' checked' : ''}> Ler as respostas sempre em voz alta</label>`;
    const cur = Object.entries(LOCALE).find(([, v]) => v === idioma())?.[0] || 'pt'; $('#cfgL').value = cur;
    $('#cfgL').onchange = e => { const prefs = { ...(S.state.profile.prefs || {}), contentLang: e.target.value }; S.state.profile.prefs = prefs; S.saveState(); cfgRender(); };
    $('#cfgV').onchange = e => salvarVozPref({ nome: e.target.value });
    $('#cfgR').onchange = e => salvarVozPref({ rate: +e.target.value });
    $('#cfgA').onchange = e => salvarVozPref({ sempre: e.target.checked });
  }

  function render() {
    const box = $('#vozM'); if (!box) return;
    const est = speechState();
    box.innerHTML = st.msgs.map((m, i) => {
      if (m.role === 'me') return `<div class="msg me">${esc(m.text)}</div>`;
      if (m.role === 'typing') return '<div class="typing">Pensando…</div>';
      const ouv = canSpeak ? `<button class="voz-ouvir" data-ouvir="${i}" aria-label="Ouvir esta resposta" title="${st.falando === i && est === 'playing' ? 'Pausar' : st.falando === i && est === 'paused' ? 'Continuar' : 'Ouvir'}">${st.falando === i && est === 'playing' ? '⏸' : st.falando === i && est === 'paused' ? '▶' : '🎧'}</button>${st.falando === i && est !== 'idle' ? '<button class="voz-ouvir" data-parar aria-label="Parar a leitura" title="Parar">⏹</button>' : ''}` : '';
      const acts = m.actions?.length ? `<div class="act"><b>${m.applied ? '✓ Feito' : m.canceled ? 'Cancelado' : 'Posso fazer isto:'}</b><ul>${m.actions.map(a => `<li>${esc(describeAction(a))}</li>`).join('')}</ul>${m.applied || m.canceled ? '' : `<div class="row"><button class="btn btn-pink btn-sm" data-aplicar="${i}">Aplicar</button><button class="btn btn-ghost btn-sm" data-cancelar="${i}">Não</button></div>`}</div>` : '';
      return `<div class="msg ai">${md(m.text)}<div class="voz-tools">${ouv}</div></div>${acts}`;
    }).join('');
    box.scrollTop = box.scrollHeight;
    box.querySelectorAll('[data-ouvir]').forEach(b => b.onclick = () => ouvir(+b.dataset.ouvir));
    box.querySelectorAll('[data-parar]').forEach(b => b.onclick = () => { stopSpeaking(); st.falando = -1; render(); });
    box.querySelectorAll('[data-cancelar]').forEach(b => b.onclick = () => { st.msgs[+b.dataset.cancelar].canceled = true; render(); });
    box.querySelectorAll('[data-aplicar]').forEach(b => b.onclick = async () => { const m = st.msgs[+b.dataset.aplicar]; b.disabled = true; try { await applyActions(m.actions); m.applied = true; toast('Alteração aplicada ✓'); } catch (e) { toast('⚠️ ' + e.message, 6000); } render(); });
    const mic = $('#vozMic'); if (mic) { mic.classList.toggle('on', st.ouvindo); mic.setAttribute('aria-pressed', st.ouvindo ? 'true' : 'false'); }
  }
  function ouvir(i) {
    const est = speechState();
    if (st.falando === i && est === 'playing') return pauseSpeaking();
    if (st.falando === i && est === 'paused') return resumeSpeaking();
    st.falando = i; speak(st.msgs[i].text, idioma()).then(() => { if (st.falando === i) { st.falando = -1; render(); } });
    render();
  }
  function alternarMic() {
    if (st.ouvindo) { st.parar?.(); return; }
    if (!canListen) { toast('Seu navegador não ouve áudio. Use Chrome ou Edge (no celular: Chrome no Android, Safari no iPhone). Você pode digitar.', 6000); return; }
    stopSpeaking(); st.ouvindo = true; render();
    const t = $('#vozT'); t.value = ''; t.placeholder = 'Estou ouvindo…';
    let ultimo = '';
    st.parar = listen(idioma(), {
      onText: (fin, parc) => { ultimo = fin; t.value = (fin + ' ' + parc).trim(); },
      onEnd: fin => { st.ouvindo = false; st.parar = null; const tt = $('#vozT'); if (!tt) return; tt.placeholder = 'Fale ou digite aqui…'; const txt = (fin || ultimo || tt.value).trim(); if (txt) enviar(txt, true); else render(); },
      onError: m => { st.ouvindo = false; st.parar = null; toast(m, 5000); render(); }
    });
    // para sozinho depois de uma pausa na fala
    let tick = 0; const iv = setInterval(() => { if (!st || !st.ouvindo) return clearInterval(iv); const atual = ($('#vozT')?.value || ''); if (atual && atual === st._ant) { if (++tick >= 3) { clearInterval(iv); st.parar?.(); } } else tick = 0; st._ant = atual; }, 700);
  }
  async function enviar(texto, porVoz) {
    const text = String(texto || '').trim(); if (!text) return;
    $('#vozT').value = ''; stopSpeaking(); st.falando = -1;
    st.msgs.push({ role: 'me', text });
    // 1) pedidos de abrir algo: resolvidos aqui, sem gastar IA
    const d = acharDestino(text, deps);
    if (d) {
      const resp = `Abrindo ${d.t}. ${d.d}`;
      st.msgs.push({ role: 'ai', text: resp }); render();
      location.hash = d.h;
      barra(d.t, d.d);
      if (porVoz || pref().sempre) ouvir(st.msgs.length - 1);
      return;
    }
    // 2) conversa: o mesmo cérebro do assistente de texto
    if (S.readonly) { st.msgs.push({ role: 'ai', text: 'No modo visitante dá para explorar tudo, mas para conversar comigo é preciso criar uma conta grátis. É rapidinho!' }); return render(); }
    st.msgs.push({ role: 'typing' }); render();
    try {
      const hist = st.msgs.filter(m => m.role === 'me' || m.role === 'ai').slice(-16).map(m => ({ role: m.role, text: m.text }));
      const r = await AI.assistant({ history: hist, context: asstContext() });
      st.msgs = st.msgs.filter(m => m.role !== 'typing');
      const acts = (r.actions || []).filter(a => a && a.type);
      const go = acts.find(a => a.type === 'open_page');
      const PAGES = { cuidar: '#/cuidar', desabafo: '#/cuidar/desabafo', alimentacao: '#/cuidar/alimentacao', treino: '#/cuidar/treino', sobre: '#/sobre', apoiar: '#/apoiar', mentoria: '#/mentoria', cronograma: '#/cronograma', seu: '#/seu', ajustes: '#/ajustes', historico: '#/historico', idiomas: '#/idiomas', memorizacao: '#/memorizacao' };
      st.msgs.push({ role: 'ai', text: r.reply || 'Certo!', actions: acts.filter(a => a.type !== 'open_page') });
      if (go && PAGES[go.page]) { location.hash = PAGES[go.page]; barra(go.page, (r.reply || '').slice(0, 220)); }
      render();
      if (porVoz || pref().sempre) ouvir(st.msgs.length - 1);
    } catch (e) { st.msgs = st.msgs.filter(m => m.role !== 'typing'); st.msgs.push({ role: 'ai', text: '⚠️ ' + e.message }); render(); }
  }
  render();
  $('#vozT').focus();
}

// barra curta embaixo da tela, como nos assistentes de voz
function barra(titulo, texto) {
  const { esc } = st.deps;
  document.getElementById('vozBar')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="voz-bar" id="vozBar" role="status"><div><b>${esc(titulo)}</b><div class="small">${esc(texto)}</div></div><button class="iconbtn" aria-label="Fechar aviso">✕</button></div>`);
  const b = document.getElementById('vozBar'); b.querySelector('button').onclick = () => b.remove();
  setTimeout(() => b.remove(), 14000);
  // no celular a janela de voz sai da frente para a pessoa ver a página aberta
  if (window.innerWidth < 700) { const p = document.getElementById('voz'); if (p) { p.classList.add('voz-min'); const v = document.createElement('button'); v.className = 'btn btn-ghost btn-sm'; v.textContent = 'Voltar ao assistente'; v.onclick = () => { p.classList.remove('voz-min'); b.remove(); }; b.appendChild(v); } }
}
function fechar() {
  stopSpeaking(); try { st?.parar?.(); } catch { }
  st?.off?.(); if (st?.fecha) document.removeEventListener('keydown', st.fecha);
  document.getElementById('voz')?.remove(); document.getElementById('vozBar')?.remove();
  st = null;
}
