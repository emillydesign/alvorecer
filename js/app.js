import { $, $$, esc, md, uid, today, ym, weekday, fmtDay, fmtShort, fmtMonth, holiday, isRestDay, setStudyDays, getStudyDays, prevStudyDay, weekStart, addDays, daysBetween, norm, schedule, isDue, shuffle } from './util.js';
import { DemoStore, SupabaseStore, defaultState } from './store.js?v=63';
import { ic, icoOf, initFx } from './fx.js?v=63';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY, GOOGLE_ENABLED, SITE_URL } from './config.js?v=63';
let sb = null;
const authStorage = {
  _s: () => { try { return localStorage.getItem('pg_remember') === '0' ? sessionStorage : localStorage; } catch { return null; } },
  getItem(k) { try { return this._s()?.getItem(k) ?? null; } catch { return null; } },
  setItem(k, v) { try { this._s()?.setItem(k, v); } catch { } },
  removeItem(k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch { } }
};
import { makeAI, NoKeyError } from './ai.js?v=64';
import { speak, stopSpeaking, pauseSpeaking, resumeSpeaking, onSpeechState, speechState, listen, canListen, canSpeak } from './speech.js?v=69';
import { initSaude, cuidar, startAgua } from './saude.js?v=72';
import { PIX_KEY, PIX_NOME, PIX_CIDADE, CONTATO, LIMITE_IA } from './config.js?v=63';

let C, S, AI;
const app = $('#app');
const LS = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { } } };

// ---------- helpers ----------
function toast(msg, ms = 3200) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(t._t); t._t = setTimeout(() => t.hidden = true, ms); }
const grad = g => `background:linear-gradient(160deg,${g[0]},${g[1]})`;
const ESPERA = ['Pensando com carinho no seu conteúdo…', 'Organizando as ideias…', 'Quase lá, só mais um pouquinho…', 'Dando os últimos retoques…'];
const spinner = (txt, passos = ESPERA) => `<div class="espera" role="status" aria-live="polite"><div class="espera-orb"><i></i><i></i><i></i><b></b></div><div class="espera-txt">${esc(txt)}</div><div class="espera-steps">${passos.slice(0, 4).map((t, i) => `<span style="--i:${i}">${esc(t)}</span>`).join('')}</div><div class="espera-sk"><i></i><i></i><i></i></div></div>`;
const PASSOS_AULA = ['Escolhendo bons exemplos para você…', 'Montando a explicação passo a passo…', 'Criando os exercícios…', 'Revisando tudo antes de mostrar…'];
const errBox = (e) => `<div class="panel" style="margin-top:20px"><p><b>Ops.</b> ${esc(e.message || e)}</p>${e instanceof NoKeyError ? '<a class="btn btn-pink btn-sm" href="#/ajustes">Ir para Ajustes</a>' : '<button class="btn btn-ghost btn-sm" data-reload>Tentar de novo</button>'}</div>`;
const lang = id => C.languages.find(l => l.id === id) || (S?.state?.customLangs || []).find(l => l.id === id);
const LOC = { hindi: 'hi-IN', holandes: 'nl-NL', sueco: 'sv-SE', grego: 'el-GR', hebraico: 'he-IL', polones: 'pl-PL', tailandes: 'th-TH', vietnamita: 'vi-VN', indonesio: 'id-ID', ucraniano: 'uk-UA', turco: 'tr-TR', 'portugues de portugal': 'pt-PT', catalao: 'ca-ES', dinamarques: 'da-DK', noruegues: 'nb-NO', finlandes: 'fi-FI', tcheco: 'cs-CZ', hungaro: 'hu-HU', romeno: 'ro-RO', malaio: 'ms-MY', filipino: 'fil-PH', tagalo: 'fil-PH', bengali: 'bn-IN', urdu: 'ur-PK', persa: 'fa-IR', suaili: 'sw-KE', latim: 'it-IT', guarani: 'es-PY', libras: 'pt-BR', irlandes: 'ga-IE', galego: 'gl-ES', basco: 'eu-ES', islandes: 'is-IS', croata: 'hr-HR', servio: 'sr-RS', bulgaro: 'bg-BG', eslovaco: 'sk-SK', lituano: 'lt-LT', estoniano: 'et-EE', afrikaans: 'af-ZA', tamil: 'ta-IN', punjabi: 'pa-IN', canto: 'zh-HK', cantones: 'zh-HK' };
function addCustomLang(name) {
  name = String(name || '').trim().slice(0, 40); if (!name) return null;
  const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z ]/g, '').trim();
  if (!slug || /(porn|sexo|nazi)/.test(slug)) return null;
  const known = C.languages.find(l => l.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') === slug);
  if (known) return known.id;
  const id = 'x-' + slug.replace(/ /g, '-');
  const list = (S.state.customLangs ||= []);
  if (!list.find(l => l.id === id)) list.push({ id, name: name[0].toUpperCase() + name.slice(1), native: name, art: name, icon: 'languages', pat: 'waves', locale: LOC[slug] || 'en-US', start: 'A1', g: ['#5eead4', '#6366f1'], custom: true });
  return id;
}
const comp = id => C.complementary.find(c => c.id === id);
function trk(id) { for (const [tid, t] of Object.entries(C.tracks)) { const c = t.courses.find(x => x.id === id); if (c) return { ...c, track: tid }; } }
const lvIdx = lv => C.levels.indexOf(lv);
const lvName = lv => C.levelNames[lv] || lv;

function course(key) {
  const [kind, id] = key.split(':');
  if (kind === 'lang') { const L = lang(id); return { key, kind, id, title: L.name, sub: L.native, art: L.art, icon: L.icon, flag: L.flag, pat: L.pat, g: L.g, locale: L.locale, lang: L }; }
  if (kind === 'comp') { const c = comp(id), L = lang(c.lang); return { key, kind, id, title: c.title, sub: L.name, art: c.art, icon: c.icon, flag: c.flag, pat: c.pat, ctx: c.ctx, g: c.g, locale: L.locale, lang: L, base: c.lessons }; }
  const cl = contentLangOf(key);
  const CL = cl === 'pt' ? { id: 'pt', name: 'Português', native: 'Português', locale: 'pt-BR' } : lang(cl);
  if (kind === 'cus') {
    const c = (S.state.custom || []).find(x => x.id === id);
    if (!c) throw new Error('Curso não encontrado.');
    return { key, kind, id, title: c.title, sub: c.sub, art: c.icon || '✦', icon: c.icon || '✦', pat: c.pat, ctx: c.ctx, g: c.g, locale: CL.locale, lang: CL, contentLang: cl, base: c.lessons, track: 'seu' };
  }
  const t = trk(id);
  if (!t) throw new Error('Curso não encontrado.');
  return { key, kind, id, title: t.title, sub: t.sub, art: t.art, icon: t.icon, pat: t.pat, ctx: t.ctx, g: t.g, locale: CL.locale, lang: CL, contentLang: cl, base: t.lessons, track: t.track, ia: !!t.ia };
}
function contentLangOf(key) { const s = S.state.courses[key]; return s?.contentLang || (s?.inEnglish ? 'en' : '') || S.state.profile?.prefs?.contentLang || 'pt'; }
const visibleEv = e => { const st = S.state; return (!st.historyFrom || e.date >= st.historyFrom) && !(st.hiddenCourses || []).includes(e.course); };
function cs(key) {
  const c = S.state.courses;
  if (!c[key]) {
    const [kind, id] = key.split(':');
    c[key] = kind === 'lang' ? { level: lang(id).start, cycle: 1, plans: {}, done: {}, levels: {} } : { done: {}, extra: [] };
  }
  return c[key];
}
const planKey = key => { const s = cs(key); return s.level + (s.cycle > 1 ? '#' + s.cycle : ''); };
function lessonsOf(key) {
  const d = course(key), s = cs(key);
  if (d.kind === 'lang') {
    const pk = planKey(key), p = s.plans[pk];
    if (!p) return null;
    return p.lessons.map((o, i) => { const id = `${pk}-${i}`.replace('#', '_'); return { id, cacheId: id + (o.v ? '_v' + o.v : ''), n: lvIdx(s.level) * C.lessonsPerLevel + i + 1, title: o.title, sub: [o.target, o.grammar].filter(Boolean).join(' · '), outline: o }; });
  }
  const sfx = d.contentLang && d.contentLang !== 'pt' ? '_' + d.contentLang : '';
  return d.base.concat(s.extra || []).map((t, i) => ({ id: String(i), cacheId: String(i) + sfx, n: i + 1, title: t, sub: '', outline: { title: t } }));
}
function nextLesson(key) { const ls = lessonsOf(key); if (!ls) return null; const s = cs(key); return ls.find(l => !s.done[l.id]) || null; }
function progress(key) {
  const d = course(key), s = cs(key), ls = lessonsOf(key);
  if (d.kind === 'lang') { const doneLv = ls ? ls.filter(l => s.done[l.id]).length : 0; return Math.min(1, (lvIdx(s.level) * C.lessonsPerLevel + doneLv) / (C.levels.length * C.lessonsPerLevel)); }
  return ls.length ? ls.filter(l => s.done[l.id]).length / ls.length : 0;
}
const started = key => { const s = S.state.courses[key]; return s && (Object.keys(s.done || {}).length || Object.keys(s.plans || {}).length); };
function todaysCourse() { const p = S.state.plan; return 'lang:' + ((p.secondDays || []).includes(weekday()) && p.second ? p.second : p.main); }

async function events(months = 1) {
  const all = [];
  let m = ym();
  for (let i = 0; i < months; i++) { all.push(...(await S.month(m))); const [y, mm] = m.split('-').map(Number); m = mm === 1 ? `${y - 1}-12` : `${y}-${String(mm - 1).padStart(2, '0')}`; }
  return all.filter(visibleEv);
}
function loadedEvents() { return Object.values(S.months).flat().filter(visibleEv); }
function recentErrors(key, n = 15) {
  return loadedEvents().filter(e => e.course === key && e.errors?.length).sort((a, b) => b.ts.localeCompare(a.ts))
    .flatMap(e => e.errors.map(x => `${x.yours || x.original || x.q} → ${x.correct || x.better}`)).slice(0, n);
}
function touchStreak() {
  const s = S.state.streak, t = today();
  if (s.last === t) return;
  s.count = s.last && (s.last === prevStudyDay(t) || (isRestDay(t) && daysBetween(s.last, t) <= 3)) ? s.count + 1 : 1;
  s.last = t; s.best = Math.max(s.best || 0, s.count);
}
function streakNow() { const s = S.state.streak; if (!s.last) return 0; const t = today(); return (s.last === t || s.last === prevStudyDay(t) || (isRestDay(t) && daysBetween(s.last, t) <= 3)) ? s.count : 0; }
function addCards(list, key, source) {
  let n = 0;
  for (const c of list) {
    if (!c.front || !c.back) continue;
    if (S.srs.some(x => x.course === key && norm(x.front) === norm(c.front))) continue;
    S.srs.push({ id: uid(), course: key, front: c.front, back: c.back, note: c.note || '', source, created: today(), due: today(), ease: 2.5, interval: 0, reps: 0, lapses: 0 });
    n++;
  }
  if (n) S.saveSrs();
  return n;
}

// ---------- roteamento ----------
const routes = { tempo: async () => { const m = await import('./tempo.js?v=2'); m.initTempo({ S, AI, app, toast }); return m.tempo(); }, agenda: async (t) => { const m = await import('./agenda.js?v=72'); m.initAgenda({ S, AI, app, toast, setCleanup: f => cleanup = f }); return m.agenda(t); }, 'boas-vindas': boasVindas, nivelamento, cronograma, mentoria, seu, cuidar: (s) => cuidar(s), cuidados: async (s) => { const m = await import('./cuidados.js?v=72'); m.initCuidados({ S, AI, app, toast, setCleanup: f => cleanup = f }); return m.cuidados(s); }, sobre, apoiar, '': home, idiomas, cursos, trilha, curso, aula, conversa, memorizacao, revisao, teste, historico, ajustes, guia };
let cleanup = null;
async function router() {
  cleanup?.(); cleanup = null; stopSpeaking(); closeAreas(); aplicarDias();
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  const fn = routes[parts[0]] || home;
  let navKey = parts[0] || 'home';
  if (parts[0] === 'trilha') navKey = parts[1] === 'tech' ? 'tech' : 'area';
  else if (['curso', 'aula', 'conversa', 'nivelamento'].includes(parts[0])) { const k = parts[1] || ''; navKey = k.startsWith('trk:') ? (trk(k.slice(4))?.track === 'tech' ? 'tech' : 'area') : k.startsWith('cus:') ? 'seu' : 'idiomas'; }
  else if (['revisao', 'teste'].includes(parts[0])) navKey = 'memorizacao';
  else if (parts[0] === 'cronograma') navKey = 'idiomas';
  else if (parts[0] === 'mentoria') navKey = 'tech';
  else if (parts[0] === 'cuidar' || parts[0] === 'cuidados' || parts[0] === 'agenda') navKey = 'seu';
  if (parts[0] === 'trilha' && parts[1] && parts[1] !== 'tech' && C.tracks[parts[1]]?.area && S.state.area !== parts[1]) { S.state.area = parts[1]; S.saveState(); }
  updateAreaTab();
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === navKey || (a.dataset.nav === 'cursos' && ['tech', 'area', 'seu'].includes(navKey))));
  $('#areasBtn')?.classList.toggle('on', navKey === 'seu');
  window.scrollTo(0, 0);
  app.classList.remove('enter'); void app.offsetWidth; app.classList.add('enter');
  if (S.readonly && (['aula', 'conversa', 'revisao', 'teste', 'nivelamento', 'boas-vindas'].includes(parts[0]) || (parts[0] === 'mentoria' && parts[1] === 'sessao'))) { app.innerHTML = lockedHTML(); return; }
  try { await fn(...parts.slice(1)); } catch (e) { console.error(e); app.innerHTML = errBox(e); }
}
function updateAreaTab() { const id = C.tracks[S.state.area]?.area ? S.state.area : 'design'; const t = C.tracks[id]; const el = $('#areaTab'); if (el) { el.textContent = t.name; el.href = '#/trilha/' + id; } }
function closeAreas() { $('#areasPop')?.remove(); $('#popOv')?.remove(); }
function openAreas() {
  if ($('#areasPop')) return closeAreas();
  const areas = Object.entries(C.tracks).filter(([, t]) => t.area);
  const cur = C.tracks[S.state.area]?.area ? S.state.area : 'design';
  const nCus = (S.state.custom || []).length;
  document.body.insertAdjacentHTML('beforeend', `<div class="pop-overlay" id="popOv"></div><div class="areas-pop" id="areasPop">
    <div class="row"><h3>Áreas de interesse</h3><span class="spacer"></span><button class="iconbtn" id="apX">✕</button></div>
    <p class="small muted">Escolha a área que aparece no seu menu. Tecnologia &amp; IA e Idiomas ficam sempre lá. Quer algo mais específico? Peça ao IAlvorecer e o curso vai para <b>Seu Alvorecer</b>.</p>
    <div class="atiles">${areas.map(([id, t]) => `<button class="atile pat-dots ${id === cur ? 'on' : ''}" data-area="${id}" style="${grad(t.g)}"><i>${icoOf(t.icon)}</i><div><b>${esc(t.name)}</b><br><small>${t.courses.length} cursos</small></div></button>`).join('')}
      <a class="atile pat-rings" href="#/seu" style="background:linear-gradient(150deg,#fcd34d,#14b8a6)"><i>✦</i><div><b>Seu Alvorecer</b><br><small>${nCus} ${nCus === 1 ? 'curso personalizado' : 'cursos personalizados'}</small></div></a>
      <a class="atile pat-waves" href="#/cuidar" style="background:linear-gradient(150deg,#86efac,#6366f1)"><i>${icoOf('heart-handshake')}</i><div><b>Cuidar de mim</b><br><small>desabafo, alimentação, treino</small></div></a>
      <a class="atile pat-dots" href="#/cuidados" style="background:linear-gradient(150deg,#fbcfe8,#14b8a6)"><i>${icoOf('sparkles')}</i><div><b>Cuidados</b><br><small>pele, unhas, cabelo, cheiro</small></div></a>
      <a class="atile pat-grid" href="#/agenda" style="background:linear-gradient(150deg,#fde68a,#0ea5e9)"><i>${icoOf('calendar-check')}</i><div><b>Agenda</b><br><small>rotina e checklist do dia</small></div></a>
      <button class="atile pat-grid" id="apAsk" style="background:linear-gradient(150deg,#a5b4fc,#0ea5e9)"><i>＋</i><div><b>Pedir um curso</b><br><small>pelo IAlvorecer</small></div></button>
    </div></div>`);
  $('#apX').onclick = closeAreas; $('#popOv').onclick = closeAreas;
  $$('[data-area]', $('#areasPop')).forEach(b => b.onclick = () => { S.state.area = b.dataset.area; S.saveState(); closeAreas(); location.hash = '#/trilha/' + b.dataset.area; });
  $('#apAsk').onclick = () => { closeAreas(); openAssistant('Quero um curso de '); };
}

// ---------- INÍCIO ----------
async function home() {
  const evs = await events(1);
  const t = today(), todayEv = evs.filter(e => e.date === t);
  const key = todaysCourse(), d = course(key), nx = nextLesson(key);
  const due = S.srs.filter(c => isDue(c)).length;
  const h = new Date().getHours();
  const hello = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const did = type => todayEv.some(e => e.type === type);
  if (nx && !did('lesson')) setTimeout(() => prefetchNext(key), 2500); // a aula do dia já vai sendo preparada enquanto a pessoa olha o início
  const rest = isRestDay(t), hol = holiday(t);
  const name = S.state.profile.name || '';
  const nCourses = C.languages.length + C.complementary.length + Object.values(C.tracks).reduce((a, x) => a + x.courses.length, 0);
  const areaId = C.tracks[S.state.area]?.area ? S.state.area : 'design';
  const A = C.tracks[areaId];
  const areas = [
    { t: 'Idiomas', s: `${C.languages.length} idiomas, do zero ao fluente`, i: 'languages', href: '#/idiomas', g: ['#2dd4bf', '#2563eb'], items: ['Aulas personalizadas do A1 ao C2', 'Conversação por voz com correção', 'Cronograma e prova de nível'] },
    { t: 'Tecnologia & IA', s: 'Rumo ao trabalho dos sonhos', i: 'cpu', href: '#/trilha/tech', g: ['#38bdf8', '#4f46e5'], items: ['IA no dia a dia e IAs grátis', 'Currículo, entrevistas e portfólio', 'Mentoria de carreira'] },
    { t: A.name, s: 'Sua área de interesse', i: A.icon, href: '#/trilha/' + areaId, g: A.g, items: A.courses.slice(0, 3).map(c => c.title) }
  ];
  const cr = S.state.career;
  const noLang = S.state.profile.prefs?.noLang;
  app.innerHTML = `
  <section class="home-topo" id="homeTopo"></section>

  <section class="section" data-bloco="ia"><div class="section-head"><div><div class="eyebrow">Sua IA</div><h2 style="margin-top:8px">Como funciona o seu limite de IA</h2></div><button class="btn btn-ghost btn-sm" data-iainfo>Entender tudo</button></div>
    <div class="grid g3">
      <div class="panel"><h3>Seu uso hoje</h3><div style="margin-top:14px">${iaMeterHTML()}</div><p class="small muted" style="margin-top:12px">O IAlvorecer é gratuito para todo mundo, então cada pessoa tem uma quantidade de usos por dia. Renova todo dia à meia-noite.</p></div>
      <div class="panel"><h3>O que gasta</h3><div style="margin-top:12px">${CUSTOS.slice(0, 4).map(([a, c, i]) => `<div class="row small" style="padding:7px 0;border-bottom:1px solid var(--line)"><span>${i} ${a}</span><span class="spacer"></span><b>${c}</b></div>`).join('')}</div><button class="btn btn-ghost btn-sm" data-iainfo style="margin-top:12px">Ver tudo</button></div>
      <div class="panel"><h3>Quer usar mais?</h3><p class="small muted" style="margin:10px 0 14px">Conecte a sua própria IA (Google Gemini, grátis) e use sem o limite do site. Leva 2 minutos e ela continua tão carinhosa e inteligente quanto aqui.</p><button class="btn btn-pink btn-sm" data-iainfo="conectar">Conectar minha IA</button></div>
    </div></section>

        <section class="section" data-bloco="explore"><div class="section-head"><div><div class="eyebrow">Explore</div><h2 style="margin-top:8px">O que você pode aprender aqui</h2></div><span class="small dim">${nCourses} cursos</span></div>
    <div class="grid g3">${areas.map((a, i) => `<a class="area pat-${['rings', 'grid', 'dots'][i]}" href="${a.href}" style="${grad(a.g)}"><div><span class="aic">${icoOf(a.i)}</span><h3>${esc(a.t)}</h3><p>${esc(a.s)}</p><ul>${a.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div><span class="btn btn-pink btn-sm" style="align-self:flex-start;margin-top:18px">Explorar</span></a>`).join('')}</div></section>

  <section class="section" data-bloco="areas"><div class="section-head"><div><div class="eyebrow">Áreas de interesse</div><h2 style="margin-top:8px">Escolha o que faz sentido para você</h2></div><button class="btn btn-ghost btn-sm" id="homeAreas">▦ Todas as áreas</button></div>
    <p class="muted" style="max-width:720px;margin-bottom:22px">Além de Idiomas e Tecnologia &amp; IA, uma área de interesse aparece no seu menu. Troque quando quiser no botão Áreas do topo, ou peça ao IAlvorecer.</p>
    <div class="atiles" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">${Object.entries(C.tracks).filter(([, x]) => x.area).map(([id, x]) => `<button class="atile pat-dots ${id === areaId ? 'on' : ''}" data-harea="${id}" style="${grad(x.g)}"><i>${icoOf(x.icon)}</i><div><b>${esc(x.name)}</b><br><small>${x.courses.length} cursos</small></div></button>`).join('')}</div>
  </section>

  <section class="section" data-bloco="curso"><div class="cta-band"><span class="ci">✦</span><div style="flex:1;min-width:220px"><h3 style="font-size:21px">Não achou o seu curso?</h3><p class="muted" style="margin:6px 0 0">Peça ao IAlvorecer e ele cria um curso completo só para você, em Seu Alvorecer.</p></div><button class="btn btn-ghost" id="seuInfo">Como funciona</button><button class="btn btn-pink" id="homeAsk">✦ Pedir um curso</button></div></section>

  <section class="section" data-bloco="metodo"><div class="section-head"><div><div class="eyebrow">Método</div><h2 style="margin-top:8px">Como funciona</h2></div></div>
    <div class="grid g4 how">
      <div class="step"><b>1</b><h4>Receba o convite</h4><p>No horário que você escolher, chega um e-mail com a aula do dia (se você quiser).</p></div>
      <div class="step"><b>2</b><h4>Aprenda e pratique</h4><p>Aula curta, vocabulário com áudio e exercícios corrigidos na hora pelo IAlvorecer.</p></div>
      <div class="step"><b>3</b><h4>Converse</h4><p>${convMin()} minutos de conversa por voz. O IAlvorecer corrige e faz um relatório.</p></div>
      <div class="step"><b>4</b><h4>Lembre para sempre</h4><p>Palavras e erros viram cartões de revisão. Toda sexta tem teste da semana.</p></div>
    </div></section>

  <section class="section feature" data-bloco="assistente">
    <div><div class="eyebrow">Falar com o IAlvorecer</div><h2 style="margin:12px 0 12px">Precisa de algo? É só pedir.</h2>
      <p class="muted">Tire dúvidas, mude o cronograma, troque o nível, deixe as aulas mais curtas, pause os e-mails ou abra a mentoria de carreira. Tudo com botão de desfazer.</p>
      <button class="btn btn-pink" id="homeAsst" style="margin-top:20px">✦ Falar com o IAlvorecer</button></div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div class="msg me" style="align-self:flex-end;max-width:90%">Quero estudar espanhol às terças e quintas</div>
      <div class="msg ai" style="max-width:90%">Fechado! Inglês na seg, qua e sex e espanhol na ter e qui. Posso aplicar?</div>
      <div class="act" style="max-width:90%">✓ Plano atualizado · ↶ Desfazer</div>
    </div>
  </section>

  <section class="section feature" data-bloco="mentoria">
    <div><div class="eyebrow">Mentoria de carreira</div><h2 style="margin:12px 0 12px">Do trabalho de hoje ao trabalho dos sonhos</h2>
      <p class="muted">Converse com o IAlvorecer sobre seus objetivos, medos, o salário que você quer e seus sonhos. A conversa fica salva e o plano se atualiza a cada sessão.</p>
      <a class="btn btn-pink" href="#/mentoria" style="margin-top:20px">${cr?.plan ? 'Ver meu plano de carreira' : 'Começar mentoria'}</a></div>
    <div class="area pat-rings" style="background:linear-gradient(150deg,#2dd4bf,#4f46e5);min-height:220px"><span class="aic">${ic('compass')}</span><div>${cr?.plan ? `<div class="small" style="opacity:.85">Agora</div><b>${esc(cr.plan.agora || '')}</b>` : '<b>Agora → em 1–2 anos → o sonho</b>'}</div></div>
  </section>

  <section class="section" data-bloco="cuidar"><a class="cta-band" href="#/cuidar"><span class="ci">${ic('heart-handshake')}</span><div style="flex:1;min-width:220px"><h3 style="font-size:21px">Cuidar de mim</h3><p class="muted" style="margin:6px 0 0">Desabafo, alimentação, água e treino com apoio de IA, para quem não pode pagar esses profissionais agora. Com carinho e honestidade, sem substituir profissionais.</p></div><span class="btn btn-pink">Abrir</span></a></section>
  <section class="section feature" data-bloco="sobre"><div><div class="eyebrow">Sobre o IAlvorecer</div><h2 style="margin:12px 0 12px">Um novo dia, uma nova chance</h2><p class="muted">O IAlvorecer é feito com IA para quem não tem condições de pagar cursos, nutricionista, personal trainer ou psicólogo. É uma base para ajudar: pode errar e não substitui profissionais qualificados.</p><div class="row" style="margin-top:20px"><a class="btn btn-ghost" href="#/sobre">Conhecer a história</a><a class="btn btn-pink" href="#/apoiar">Apoiar com Pix</a></div></div>
    <div style="display:flex;flex-direction:column;gap:10px"><button class="task" data-fb="avaliacao" style="text-align:left;width:100%"><span class="ck">⭐</span><span><div class="t">Avaliar o IAlvorecer</div><div class="s">Sua opinião chega direto para a criadora</div></span></button><button class="task" data-fb="erro" style="text-align:left;width:100%"><span class="ck">⚠️</span><span><div class="t">Reportar um erro</div><div class="s">Algo não funcionou? Conte pra gente</div></span></button></div></section>
  <section class="section" data-bloco="numeros"><div class="stats">
    <div class="stat"><b>${S.state.stats.lessons}</b><span>aulas feitas</span></div>
    <div class="stat"><b>${S.state.stats.conversations}</b><span>conversações (${S.state.stats.minutes} min)</span></div>
    <div class="stat"><b>${S.srs.length}</b><span>palavras na memória</span></div>
    <div class="stat"><b>${S.state.streak.best || 0}</b><span>recorde de dias seguidos</span></div>
  </div></section>`;
  import('./essencial.js?v=12').then(E => { const el = $('#homeTopo'); if (el) { el.innerHTML = E.homeHTML({ C, S, esc, icoOf, grad, saudacao: hello + (name ? ', ' + name : ''), dia: fmtDay(t) + (rest ? (hol ? ' · ' + hol + ': ' : ' · ') + 'dia de descanso' : '') }); const b = $('#homeStart3'); if (b) b.onclick = () => abrirComecar(); E.ligarHome(el); } }).catch(() => { });
  window.IAPers && IAPers.home();
  $('#homeAsst').onclick = () => openAssistant();
  $('#homeAreas').onclick = () => openAreas();
  $('#homeAsk').onclick = () => openAssistant('Quero um curso de ');
  $('#seuInfo').onclick = () => seuInfo();
  $$('[data-harea]').forEach(b => b.onclick = () => { S.state.area = b.dataset.harea; S.saveState(); location.hash = '#/trilha/' + b.dataset.harea; });
}
function lastDoneId(key) { const s = cs(key); const ids = Object.entries(s.done).sort((a, b) => (b[1].date || '').localeCompare(a[1].date || '')); return ids[0]?.[0]; }

function cardHTML(key, small) {
  const d = course(key), s = S.state.courses[key];
  const pct = s ? Math.round(progress(key) * 100) : 0;
  const tag = d.kind === 'lang' ? (s ? `${s.level} · ${lvName(s.level)}` : 'Novo idioma') : d.kind === 'comp' ? `Complementar · ${d.sub}` : (C.tracks[d.track]?.name || 'Seu Alvorecer');
  const count = d.kind === 'lang' ? '6 níveis · 120 aulas' : `${d.base.length + (s?.extra?.length || 0)} aulas`;
  return `<a class="ccard ${small ? 'small' : ''} pat-${d.pat || 'dots'}" href="#/curso/${key}" style="${grad(d.g)}">
    <div class="art">${esc(d.art)}</div>
    <div class="ctop"><span class="tag">${esc(tag)}</span>${d.flag ? `<span class="cicon flag" style="background-image:url(https://flagcdn.com/w80/${d.flag}.png)"></span>` : `<span class="cicon">${icoOf(d.icon)}</span>`}</div>${d.kind === 'cus' ? `<button class="del" data-del="${key}" title="Excluir curso">🗑</button>` : ''}
    <div><h3>${esc(d.title)}</h3>${d.kind !== 'comp' && d.sub ? `<div class="sub">${esc(d.sub)}</div>` : ''}
      <div class="meta"><span>${count}</span>${d.kind === 'lang' ? '<span>🎙 conversação</span>' : d.ctx ? '<span>passo a passo</span>' : ''}</div>
      ${s && pct ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}
      <div class="foot"><span class="mini">${s && pct ? pct + '% concluído' : ''}</span><span class="btn btn-pink btn-sm">${s && pct ? 'Continuar' : 'Iniciar'}</span></div></div>
  </a>`;
}


// ---------- IDIOMAS ----------
async function idiomas() {
  const evs = await events(1);
  const t = today(), todayEv = evs.filter(e => e.date === t);
  const key = todaysCourse(), d = course(key), s = cs(key), nx = nextLesson(key);
  const due = S.srs.filter(c => isDue(c)).length;
  const did = type => todayEv.some(e => e.type === type);
  const weekTest = evs.some(e => e.type === 'test' && e.kind === 'semana' && e.date >= weekStart());
  const tasks = [
    { done: did('lesson'), t: 'Aula do dia', s: nx ? `${d.title} · Aula ${nx.n}: ${nx.title}` : `${d.title}: montar plano do nível ${s.level}`, href: nx ? `#/aula/${key}/${nx.id}` : `#/curso/${key}` },
    { done: due === 0 || did('review'), t: 'Revisão de memória', s: due ? `${due} cartões para revisar (5 min)` : 'Tudo revisado por hoje', href: '#/revisao' },
    { done: did('conversation'), t: 'Conversação', s: `${convMin()} minutos conversando com o IAlvorecer`, href: `#/conversa/${key}${lastDoneId(key) ? '/' + lastDoneId(key) : ''}` }
  ];
  if (weekday() === 5) tasks.push({ done: weekTest, t: 'Teste da semana', s: 'Será que você lembra de tudo?', href: '#/teste/semana' });
  const pct = Math.round(progress(key) * 100);
  const order = ['en', 'es', 'fr', 'it', 'de', 'zh', 'ja', 'ar', 'ru', 'ko'];
  const langs = [...order, ...(S.state.customLangs || []).map(l => l.id)].map(id => 'lang:' + id);
  const active = langs.filter(k => S.state.courses[k]);
  const others = langs.filter(k => !S.state.courses[k]);
  const byLang = {};
  for (const c of C.complementary) (byLang[c.lang] ||= []).push('comp:' + c.id);
  setTimeout(() => $('#idiStart')?.addEventListener('click', () => window.scrollTo({ top: 520, behavior: 'smooth' })), 0);
  app.innerHTML = `
  <div class="eyebrow">Idiomas</div><h1 style="margin:6px 0 18px">Sua rota para falar com o mundo</h1>
  <div class="idi-top"><a class="streak" href="#/historico"><span class="streak-n">${streakNow()}</span><span class="streak-t"><b>${streakNow() === 1 ? 'dia seguido' : 'dias seguidos'}</b><small>${streakNow() ? 'Continue, não quebre a sequência' : 'Comece hoje a sua sequência'}</small></span><i class="streak-ic">${ic('flame')}</i></a>
    ${active.length ? `<a class="btn btn-pink" href="${nx ? `#/aula/${key}/${nx.id}` : `#/curso/${key}`}">${nx ? `Continuar: aula ${nx.n} de ${esc(d.title)}` : `Abrir ${esc(d.title)}`}</a>` : `<button class="btn btn-pink" id="idiStart">Escolher um idioma para começar</button>`}</div>
  <div class="journey">
    <a class="journey-card pat-${d.pat || 'rings'}" href="${nx ? `#/aula/${key}/${nx.id}` : `#/curso/${key}`}" style="${grad(d.g)}">
      <div class="art">${esc(d.art)}</div>
      <div><div class="eyebrow" style="color:#fff;opacity:.9">Seu curso principal</div>
        <h2 style="margin-top:8px">Curso: ${esc(d.title)}</h2>
        <div class="small" style="opacity:.92;margin-top:4px">Nível ${esc(s.level)} · ${esc(lvName(s.level))}</div></div>
      <div>
        <div class="small" style="margin-bottom:8px">${pct}% do curso concluído</div>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="row" style="margin-top:18px;justify-content:space-between">
          <div class="small" style="max-width:60%"><span style="opacity:.85">Estudando agora:</span><br><b>${nx ? `Aula ${nx.n}: ${esc(nx.title)}` : 'Montar plano do nível'}</b></div>
          <span class="btn btn-pink">Continuar</span>
        </div>
      </div>
    </a>
    <div class="panel today">
      <h3 style="margin-bottom:6px">Hoje</h3>
      ${tasks.map(x => `<a class="task ${x.done ? 'done' : ''}" href="${x.href}"><span class="ck">${x.done ? '✓' : ''}</span><span><div class="t">${esc(x.t)}</div><div class="s">${esc(x.s)}</div></span></a>`).join('')}
    </div>
  </div>
  <div class="row" style="margin-top:16px">
    <a class="btn btn-ghost" href="#/cronograma">📅 Ver cronograma</a>
    <button class="btn btn-ghost" id="chgSched">✦ Mudar algo no cronograma</button>
    <a class="btn btn-ghost" href="#/nivelamento/${key}">🧪 Teste de nivelamento</a>
  </div>
  <div class="section"><div class="section-head"><h2>Em andamento</h2></div><div class="cards">${active.map(k => cardHTML(k)).join('')}</div></div>
  <div class="section"><div class="section-head"><h2>Próximos idiomas</h2><span class="small dim">na ordem recomendada</span></div><div class="cards">${others.map(k => cardHTML(k, true)).join('')}</div></div>
  <div class="section"><div class="cta-band"><span class="ci">🌎</span><div style="flex:1;min-width:220px"><h3 style="font-size:21px">Quer outro idioma?</h3><p class="muted" style="margin:6px 0 0">Dá pra aprender qualquer idioma que exista: Hindi, Holandês, Turco, Libras…</p></div><input id="newLang" placeholder="Nome do idioma" style="max-width:220px"><button class="btn btn-pink" id="addLang">Adicionar</button></div></div>
  ${Object.entries(byLang).map(([l, ks]) => `<div class="section"><div class="section-head"><h2>Complementares de ${esc(lang(l).name)}</h2></div><div class="cards">${ks.map(k => cardHTML(k, true)).join('')}</div></div>`).join('')}`;
  $('#chgSched').onclick = () => openAssistant('Quero mudar meu cronograma: ');
  $('#addLang').onclick = () => { if (S.readonly) return toast('Modo visitante: crie sua conta para adicionar idiomas.'); const id = addCustomLang($('#newLang').value); if (!id) return toast('Digite o nome de um idioma.'); cs('lang:' + id); S.saveState(); toast('Idioma adicionado ✓'); location.hash = '#/curso/lang:' + id; };
}

// ---------- TRILHAS ----------
async function trilha(tid = 'design') {
  const t = C.tracks[tid] || C.tracks.design;
  const cr = S.state.career;
  app.innerHTML = `<div class="eyebrow">${esc(t.name)}</div><h1 style="margin:6px 0 6px">${esc(t.name)}</h1><p class="muted">${esc(t.intro)} Cada curso pode ser feito em português, inglês ou espanhol (botão PT / EN / ES na página do curso).</p>
  ${tid === 'tech' ? `<a class="feature section" href="#/mentoria"><div><div class="eyebrow">Mentoria de carreira</div><h2 style="margin:8px 0">O IAlvorecer te ajuda a conseguir o trabalho certo</h2><p class="muted">Sessões de conversa sobre seus objetivos, o salário que você quer e seus sonhos. Ela monta um plano em etapas: o passo possível agora e o caminho até o sonho.</p><span class="btn btn-pink" style="margin-top:12px">${cr?.plan ? 'Ver meu plano' : 'Começar mentoria'}</span></div><div class="area pat-rings" style="background:linear-gradient(150deg,#5eead4,#6366f1);min-height:190px"><div style="font-size:40px">🧭</div><b>${cr?.plan ? esc(cr.plan.agora || '') : 'Agora → em 1–2 anos → o sonho'}</b></div></a>` : ''}
  <div class="section"><div class="cards">${t.courses.map(c => cardHTML('trk:' + c.id)).join('')}</div></div>`;
}
async function cursos() {
  const areas = Object.entries(C.tracks).filter(([, t]) => t.area);
  const nCus = (S.state.custom || []).length;
  app.innerHTML = `<div class="eyebrow">Cursos</div><h1 style="margin:6px 0 18px">Tudo o que dá pra aprender</h1>
  <div class="atiles" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
    <a class="atile pat-grid" href="#/trilha/tech" style="${grad(C.tracks.tech.g)}"><i>${icoOf('cpu')}</i><div><b>Tecnologia &amp; IA</b><br><small>${C.tracks.tech.courses.length} cursos + mentoria</small></div></a>
    ${areas.map(([id, t]) => `<a class="atile pat-dots" href="#/trilha/${id}" style="${grad(t.g)}"><i>${icoOf(t.icon)}</i><div><b>${esc(t.name)}</b><br><small>${t.courses.length} cursos</small></div></a>`).join('')}
    <a class="atile pat-rings" href="#/seu" style="background:linear-gradient(150deg,#fcd34d,#14b8a6)"><i>✦</i><div><b>Seu Alvorecer</b><br><small>${nCus} personalizados</small></div></a>
  </div>`;
}

// ---------- CURSO ----------
async function curso(key) {
  const d = course(key), s = cs(key);
  const ls = lessonsOf(key);
  const nx = nextLesson(key);
  const pct = Math.round(progress(key) * 100);
  const isLang = d.kind === 'lang';
  const allDone = ls && !nx;
  app.innerHTML = `
  <div class="chead pat-${d.pat || 'dots'}" style="${grad(d.g)}">
    <div class="art">${esc(d.art)}</div>
    <div class="small" style="opacity:.85">${esc(d.kind === 'lang' ? 'Idioma' : d.kind === 'comp' ? 'Curso complementar · ' + d.sub : (C.tracks[d.track]?.name || 'Seu Alvorecer'))}</div>
    <h1>${esc(d.title)}</h1>
    ${isLang ? `<div class="levels">${C.levels.map(l => `<span class="lv ${l === s.level ? 'on' : lvIdx(l) < lvIdx(s.level) ? 'past' : ''}">${l}${lvIdx(l) < lvIdx(s.level) ? ' ✓' : ''}</span>`).join('')}</div>` : ''}
    <div style="max-width:420px"><div class="small" style="margin-bottom:6px">${pct}% concluído${isLang && s.cycle > 1 ? ` · ciclo ${s.cycle}` : ''}</div><div class="progress"><i style="width:${pct}%"></i></div></div>
    <div class="row" style="margin-top:8px">
      ${nx ? `<a class="btn btn-pink" href="#/aula/${key}/${nx.id}">${Object.keys(s.done).length ? 'Continuar' : 'Começar'}: Aula ${nx.n}</a>` : ''}
      <a class="btn btn-ghost" href="#/conversa/${key}">🎙 Conversar</a>
      ${isLang ? `<button class="btn btn-ghost" data-agenda="${esc(d.id)}">Marcar conversação</button>` : ''}
      ${isLang ? `<button class="btn btn-ghost" id="mkmain">${S.state.plan.main === d.id ? '★ Curso principal' : 'Tornar principal'}</button>` : ''}
      ${d.kind === 'trk' || d.kind === 'cus' ? `<div class="langsel" title="Idioma das aulas deste curso">${[['pt', 'PT'], ['en', 'EN'], ['es', 'ES']].map(([v, l]) => `<button data-cl="${v}" class="${d.contentLang === v ? 'on' : ''}">${l}</button>`).join('')}</div>` : ''}${d.kind === 'cus' ? '<button class="btn btn-ghost" id="delCus">🗑 Excluir curso</button>' : ''}
    </div>
  </div>
  ${isLang && !ls ? `<div class="panel section"><h3>Vamos montar seu plano do nível ${s.level} (${esc(lvName(s.level))})</h3><p class="muted" style="margin-top:8px">O IAlvorecer monta 20 aulas para este nível e vai ajustando cada uma ao que você já sabe e aos seus erros. É na hora.</p><button class="btn btn-pink" id="plan">Montar meu plano</button></div>` : ''}
  ${allDone ? `<div class="panel section">${isLang ? `<h3>Você terminou as aulas do nível ${s.level}! 🎉</h3><p class="muted" style="margin-top:8px">Faça a prova de nível. Com 70% ou mais você sobe de nível, e tudo o que fez continua no histórico.</p><a class="btn btn-pink" href="#/teste/nivel/${key}">Fazer prova do nível ${s.level}</a>` : `<h3>Curso concluído! 🎉</h3><p class="muted" style="margin-top:8px">Quer continuar? O IAlvorecer cria mais 8 aulas, mais avançadas, a partir do que você já fez.</p><button class="btn btn-pink" id="more">Gerar mais aulas</button>`}</div>` : ''}
  ${ls ? `<div class="section"><div class="section-head"><h2>Aulas${isLang ? ` do nível ${s.level}` : ''}</h2>${isLang ? `<a class="small muted" href="#/teste/nivel/${key}">já sei isso? fazer prova de nível →</a>` : ''}</div>
    <div class="lessons">${ls.map(l => { const dn = s.done[l.id]; const cur = nx && nx.id === l.id; return `<a class="lesson ${cur ? 'current' : ''}" href="#/aula/${key}/${l.id}"><span class="n">Aula ${l.n}</span><span class="ti">${esc(l.title)}${l.sub ? `<small>${esc(l.sub)}</small>` : ''}</span>${dn ? `<span class="st ok">✓ ${dn.score ?? ''}%</span>` : cur ? '<span class="st next">Próxima</span>' : ''}</a>`; }).join('')}</div></div>` : ''}
  ${isLang ? `<div class="section panel"><h3>Ajustar nível</h3><p class="muted small" style="margin:6px 0 12px">Se as aulas estiverem fáceis ou difíceis demais, troque o nível. Seu histórico não se perde.</p>
    <div class="row"><select id="lvsel" style="max-width:260px">${C.levels.map(l => `<option ${l === s.level ? 'selected' : ''} value="${l}">${l} · ${lvName(l)}</option>`).join('')}</select><button class="btn btn-ghost btn-sm" id="lvgo">Trocar nível</button><a class="btn btn-ghost btn-sm" href="#/nivelamento/${key}">Fazer teste de nivelamento</a></div></div>` : ''}`;
  $('#plan')?.addEventListener('click', async e => {
    e.target.disabled = true; e.target.innerHTML = '<span class="spin"></span> Montando…';
    try { await makePlan(key); curso(key); } catch (er) { app.insertAdjacentHTML('beforeend', errBox(er)); e.target.disabled = false; e.target.textContent = 'Montar meu plano'; }
  });
  $('#more')?.addEventListener('click', async e => {
    e.target.disabled = true; e.target.innerHTML = '<span class="spin"></span> Criando…';
    try { const r = await AI.extendTrack({ course: { title: d.title, sub: d.sub }, doneTitles: ls.map(l => l.title) }); s.extra = (s.extra || []).concat(r.lessons || []); S.saveState(); curso(key); }
    catch (er) { app.insertAdjacentHTML('beforeend', errBox(er)); }
  });
  $('#mkmain')?.addEventListener('click', () => { if (S.state.plan.main !== d.id) { if (S.state.plan.second === d.id) S.state.plan.second = S.state.plan.main; S.state.plan.main = d.id; S.saveState(); toast(`${d.title} agora é seu curso principal.`); curso(key); } });
  $$('[data-cl]').forEach(b => b.onclick = () => { s.contentLang = b.dataset.cl; delete s.inEnglish; S.saveState(); toast({ pt: 'As aulas deste curso agora vêm em português.', en: 'As aulas deste curso agora vêm em inglês.', es: 'As aulas deste curso agora vêm em espanhol.' }[b.dataset.cl]); curso(key); });
  $('#delCus') && ($('#delCus').onclick = () => deleteCustom(key));
  if (ls && nx) setTimeout(() => prefetchNext(key), 400); // prepara a próxima aula enquanto a pessoa olha o curso
  $('#lvgo')?.addEventListener('click', () => { const v = $('#lvsel').value; if (v !== s.level) { s.level = v; s.cycle = 1; S.saveState(); S.addEvent({ type: 'level', course: key, title: `Nível ajustado para ${v}`, level: v, manual: true }); curso(key); } });
}
async function makePlan(key, wishes) {
  const d = course(key), s = cs(key), pk = planKey(key);
  const covered = Object.values(s.plans).flatMap(p => p.lessons.map(l => l.grammar));
  const ask = () => AI.planLevel({ lang: d.lang, level: s.level, themes: C.levelThemes[s.level], cycle: s.cycle, errors: recentErrors(key), covered, wishes });
  if (!wishes) { // plano instantâneo (temas do catálogo); a IA refina em segundo plano, sem a pessoa esperar
    const base = { created: today(), lessons: C.levelThemes[s.level].slice(0, C.lessonsPerLevel).map(t => ({ title: t })) };
    s.plans[pk] = base; S.saveState();
    if (!S.isDemo) ask().then(r => {
      if (s.plans[pk] !== base || !r?.lessons?.length) return;
      base.lessons = base.lessons.map((o, i) => s.done[`${pk}-${i}`.replace('#', '_')] || o.opened || !r.lessons[i] ? o : r.lessons[i]);
      S.saveState();
    }).catch(() => { });
    return;
  }
  const r = await ask();
  if (!r.lessons?.length) throw new Error('O plano veio vazio. Tente de novo.');
  s.plans[pk] = { created: today(), lessons: r.lessons.slice(0, C.lessonsPerLevel) };
  S.saveState();
}
async function replanLevel(key, wishes) {
  const d = course(key), s = cs(key), pk = planKey(key), old = s.plans[pk];
  if (!old) return makePlan(key, wishes);
  const r = await AI.planLevel({ lang: d.lang, level: s.level, themes: C.levelThemes[s.level], cycle: s.cycle, errors: recentErrors(key), covered: [], wishes });
  const fresh = r.lessons || [];
  old.lessons = old.lessons.map((o, i) => s.done[`${pk}-${i}`.replace('#', '_')] ? o : { ...(fresh[i] || o), v: (o.v || 0) + 1 });
}

// ---------- AULA ----------
const lessonMem = {}, lessonJobs = {}; // aulas já lidas nesta visita e aulas sendo criadas agora
async function cachedLesson(key, L) { // aula pronta (memória ou arquivo salvo); null se ainda precisa ser criada
  const d = course(key), s = cs(key), isLangC = d.kind === 'lang' || d.kind === 'comp', id = L.cacheId || L.id, mk = key + '|' + id;
  let lesson = lessonMem[mk] || await S.getLesson(key, id);
  if (lesson && !isLangC && (lesson.v || 0) < 3 && !s.done[L.id]) lesson = null; // aula no formato antigo (ainda não feita): refaz com Termos e texto novo
  if (lesson) lessonMem[mk] = lesson;
  return lesson;
}
let diasMod; const dias = () => diasMod ||= import('./dias.js?v=63'); // arquivo à parte: só carrega ao escolher os dias
let comecarMod; const comecar = () => comecarMod ||= import('./comecar.js?v=63'); // arquivo à parte: só carrega ao clicar em Começar
const DIAS_ABR = [[1, 'seg'], [2, 'ter'], [3, 'qua'], [4, 'qui'], [5, 'sex'], [6, 'sáb'], [0, 'dom']];
function diasResumo(c = S?.state?.profile?.prefs?.studyDays) { const d = (c?.days || [1, 2, 3, 4, 5]).map(Number), h = !!c?.holidays; return DIAS_ABR.filter(([n]) => d.includes(n)).map(([, l]) => l).join(', ') + (h ? ' e feriados' : d.includes(0) || d.includes(6) ? '' : ' (fins de semana e feriados: descanso)'); }
function aplicarDias() { setStudyDays(S?.state?.profile?.prefs?.studyDays); }
async function abrirDiasEstudo(aoSalvar) { const D = await dias(); D.abrirDias({ S, openInfo, toast, aplicar: setStudyDays, aoSalvar }); }
async function abrirComecar() { const M = await comecar(); M.abrirComecar({ C, S, openInfo, esc, icoOf, grad, onDias: () => abrirDiasEstudo(), onPedir: () => openAssistant('Quero um curso de ') }); }
let preparoMod; const preparo = () => preparoMod ||= import('./preparo.js?v=63'); // arquivo à parte: só carrega quando uma aula ou curso abre
function lessonFor(key, L) { // cria a aula (uma só vez, mesmo que peçam duas vezes) e salva
  const d = course(key), s = cs(key), id = L.cacheId || L.id, mk = key + '|' + id;
  if (!lessonJobs[mk]) {
    L.outline.opened = true; // o plano não troca mais o tema desta aula
    lessonJobs[mk] = preparo().then(P => {
      const ls = lessonsOf(key) || [], shared = P.aberto(d); // curso pronto = aula igual para todos, criada uma vez só e compartilhada
      const c = P.continuidade(ls, ls.findIndex(l => l.id === L.id), { shared, mem: lessonMem, key });
      return AI.lesson({ kind: d.kind, course: d, outline: L.outline, level: s.level, lang: d.lang, errors: recentErrors(key), contentLang: d.contentLang, shared, before: c.before, next: c.next, cacheKey: shared ? key + '|' + id + '|c3' : null });
    })
      .then(x => { x.generated = today(); x.v = 3; lessonMem[mk] = x; S.putLesson(key, id, x); return x; })
      .finally(() => { delete lessonJobs[mk]; });
  }
  return lessonJobs[mk];
}
async function prefetchNext(key, after) { // deixa pronta a aula seguinte, em silêncio (se falhar, ela é criada na hora de abrir)
  try {
    if (!(await preparo()).podePreparar(S, LIMITE_IA)) return;
    const ls = lessonsOf(key); if (!ls) return;
    const s = cs(key), i = after ? ls.findIndex(l => l.id === after.id) + 1 : ls.findIndex(l => !s.done[l.id]);
    const nx = i > 0 || !after ? ls[i] : null; if (!nx || s.done[nx.id]) return;
    if (await cachedLesson(key, nx)) return;
    await lessonFor(key, nx);
  } catch { }
}
async function aula(key, id) {
  const d = course(key), s = cs(key);
  let ls = lessonsOf(key);
  if (!ls) { await makePlan(key); ls = lessonsOf(key); }
  const L = ls.find(l => l.id === id) || nextLesson(key) || ls[0];
  const isLangC = d.kind === 'lang' || d.kind === 'comp';
  let lesson = await cachedLesson(key, L);
  if (!lesson) {
    app.innerHTML = spinner(lessonJobs[key + '|' + (L.cacheId || L.id)] ? 'Sua aula já está quase pronta…' : 'Preparando sua aula…', PASSOS_AULA);
    lesson = await lessonFor(key, L);
  }
  prefetchNext(key, L); // já deixa a próxima aula pronta enquanto a pessoa estuda esta
  const loc = d.locale;
  const sayBtn = t => canSpeak ? `<button class="say" data-say="${esc(t)}" title="Ouvir">🔊</button>` : '';
  let convJob = null; // conversação da aula: gerada à parte, salva junto da aula
  const convFor = () => convJob ||= AI.conversationFor({ lang: d.lang, level: s.level, title: lesson.title || L.title, terms: (lesson.vocab || []).map(v => v.term), contentLang: d.contentLang })
    .then(c => { lesson.conversation = c; S.putLesson(key, L.cacheId || L.id, lesson); }).finally(() => { convJob = null; });
  if (isLangC && !lesson.conversation) setTimeout(() => { if (!lesson.conversation && location.hash.includes('/aula/')) preparo().then(P => P.podePreparar(S, LIMITE_IA) && convFor()).catch(() => { }); }, 2500); // já deixa a conversação pronta enquanto a pessoa lê a aula
  let step = 0;
  const tabs = isLangC ? [['aula', 'Aula'], ['vocab', 'Vocabulário'], ['ex', 'Exercícios'], ['conv', 'Conversação'], ['mais', 'Para ir além']] : [['aula', 'Aula'], ['vocab', 'Termos'], ['ex', 'Exercícios'], ['valor', 'Seu valor'], ...(d.ia ? [['economia', 'Economia de uso']] : []), ['mais', 'Para ir além']];
  const bodyLoc = !isLangC && d.contentLang && d.contentLang !== 'pt' ? loc : 'pt-BR';
  const plain = t => String(t || '').replace(/```[\s\S]*?```/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, '').replace(/[`*_#>|]/g, '').replace(/\s+/g, ' ').trim();
  function lessonSegments() { // o que a IA lê quando a pessoa toca em "Ouvir a aula"
    const segs = [], add = (t, l = bodyLoc) => { t = plain(t); if (t) segs.push({ t, l }); };
    add((lesson.title || L.title) + '.'); add(lesson.goal);
    if (lesson.warmup) { add('Aquecimento.'); add(lesson.warmup, isLangC ? loc : bodyLoc); }
    (lesson.sections || []).forEach(sec => { add(sec.heading + '.'); add(sec.body); (sec.examples || []).forEach(x => add(x.t, isLangC ? loc : bodyLoc)); });
    if (lesson.tip) { add('Dica.'); add(lesson.tip); }
    return segs;
  }
  function primeirosPassos(list) { // pop-up: baixar apps, criar conta e entrar (para quem nunca usou)
    const itens = (list || []).slice(0, 6).map(x => `<h3 style="margin:18px 0 6px">${esc(x.title)}</h3><ol style="padding-left:20px">${(x.steps || []).slice(0, 10).map(t => `<li style="margin:6px 0">${esc(String(t).replace(/^\s*\d+[.)]\s*/, ''))}</li>`).join('')}</ol>`).join('');
    openInfo(`<div class="eyebrow">Antes de começar</div><h2 style="margin:8px 0 6px">Como criar contas e baixar os apps</h2><p class="muted">Passo a passo simples, do zero. Os planos grátis bastam.</p><div class="prose">${itens}</div><div class="row" style="margin-top:22px"><button class="btn btn-ghost" data-close>Fechar</button></div>`);
  }
  async function saibaMais(i) { // pop-up com a explicação aprofundada de um termo
    const v = (lesson.vocab || [])[i]; if (!v) return;
    const ov = openInfo(`<div class="eyebrow">Termo da aula</div><h2 style="margin:8px 0 6px">${esc(v.term)}</h2><p class="muted" style="margin-bottom:16px">${esc(v.meaning)}</p><div class="prose" id="sm-body">${v.more ? md(v.more) : '<span class="spin"></span> Preparando a explicação…'}</div><div class="row" style="margin-top:22px"><button class="btn btn-ghost" data-close>Fechar</button></div>`);
    if (v.more) return;
    const box = () => ov.isConnected && ov.querySelector('#sm-body');
    try {
      const r = await AI.explainTerm({ term: v.term, meaning: v.meaning, courseTitle: d.title, lessonTitle: lesson.title || L.title });
      v.more = String(r?.more || '').slice(0, 2500);
      if (v.more) S.putLesson(key, L.cacheId || L.id, lesson);
      if (box()) box().innerHTML = v.more ? md(v.more) : '<p class="muted">Não consegui montar a explicação agora. Tente de novo em instantes.</p>';
    } catch (e) { if (box()) box().innerHTML = '<p class="muted">Não consegui montar a explicação agora. Tente de novo em instantes.</p>'; }
  }
  function render() {
    const done = s.done[L.id], tab = tabs[step][0];
    app.innerHTML = `
    <a class="back" href="#/curso/${key}">${esc(d.title)}</a>
    <div class="eyebrow" style="margin-top:14px">Aula ${L.n}${d.kind === 'lang' ? ` · ${s.level}` : ''}${done ? ` · feita (${done.score}%)` : ''}</div>
    <h1 style="margin-top:6px">${esc(lesson.title || L.title)}</h1>
    ${lesson.subtitle ? `<p class="muted" style="margin-top:6px">${esc(lesson.subtitle)}</p>` : ''}
    <div class="steps">${tabs.map((t, i) => `<button data-step="${i}" class="${i === step ? 'on' : ''}">${i + 1}. ${t[1]}</button>`).join('')}</div>
    <div id="stepbody"></div>`;
    const body = $('#stepbody');
    if (tab === 'aula') {
      body.innerHTML = `<div class="prose">
        ${canSpeak ? `<div class="row" style="margin-bottom:16px"><button class="btn btn-ghost btn-sm" data-listen><i data-lucide="volume-2"></i> Ouvir a aula</button></div>` : ''}
        ${!isLangC && lesson.start?.length ? `<div class="row" style="margin-bottom:16px"><button class="btn btn-ghost btn-sm" data-start><i data-lucide="user-plus"></i> Como criar contas e baixar os apps</button></div>` : ''}
        ${lesson.goal ? `<div class="notice" style="background:#e9fbf5;border-color:#bfeee0;color:#0f5446;margin-bottom:18px">🎯 ${esc(lesson.goal)}</div>` : ''}
        ${lesson.warmup ? `<p><b>Aquecimento:</b> ${esc(lesson.warmup)} ${sayBtn(lesson.warmup)}</p>` : ''}
        ${(lesson.sections || []).map(sec => `<h3>${esc(sec.heading)}</h3>${md(sec.body)}${(sec.examples || []).map(x => `<div class="ex"><div class="tg">${esc(x.t)} ${d.kind === 'lang' || d.kind === 'comp' || d.contentLang !== 'pt' ? sayBtn(x.t) : ''}</div>${x.pt ? `<div class="pt">${esc(x.pt)}</div>` : ''}</div>`).join('')}`).join('')}
        ${lesson.tip ? `<h3>💡 Dica</h3><p>${esc(lesson.tip)}</p>` : ''}
        <div class="row" style="margin-top:26px"><button class="btn btn-pink" data-step="1">${tabs[1][1]}</button></div></div>`;
    } else if (tab === 'vocab') {
      body.innerHTML = isLangC ? `<p class="muted" style="margin-bottom:14px">Estas palavras vão para a sua Memorização quando você concluir a aula.</p>
        <div class="vocab">${(lesson.vocab || []).map(v => `<div class="vcard"><b>${esc(v.term)}</b> ${sayBtn(v.term)}<div class="muted small" style="margin-top:4px">${esc(v.meaning)}</div>${v.example ? `<div class="small" style="margin-top:8px;font-style:italic">${esc(v.example)}</div>` : ''}</div>`).join('')}</div>
        <div class="row" style="margin-top:26px"><button class="btn btn-pink" data-step="2">${tabs[2][1]}</button></div>`
        : `<p class="muted" style="margin-bottom:14px">Estes termos vão para a sua Memorização quando você concluir a aula. Toque em <b>Saiba mais</b> para ver uma explicação mais completa.</p>
        <div class="vocab">${(lesson.vocab || []).map((v, i) => `<div class="vcard"><b>${esc(v.term)}</b> ${d.contentLang !== 'pt' ? sayBtn(v.term) : ''}<div class="muted small" style="margin-top:4px">${esc(v.meaning)}</div>${v.example ? `<div class="small" style="margin-top:8px;font-style:italic">${esc(v.example)}</div>` : ''}<button class="btn btn-ghost btn-sm" data-more="${i}" style="margin-top:12px">Saiba mais</button></div>`).join('')}</div>
        <div class="row" style="margin-top:26px"><button class="btn btn-pink" data-step="2">${tabs[2][1]}</button></div>`;
    } else if (tab === 'ex') {
      exercisesUI(body, limparExercicios(lesson.exercises), { langName: d.lang.name, onDone: res => finish(res) });
    } else if (tab === 'valor') {
      body.innerHTML = '<span class="spin"></span>';
      import('./valor.js?v=63').then(V => { if (body.isConnected) body.innerHTML = V.valorHTML(d.track) + `<div class="row" style="margin-top:26px"><button class="btn btn-pink" data-step="${tabs.length - 1}">${tabs[tabs.length - 1][1]}</button></div>`; $$('[data-step]').forEach(b => b.onclick = () => { step = +b.dataset.step; render(); window.scrollTo(0, 0); }); }).catch(() => { if (body.isConnected) body.innerHTML = '<p class="muted">Não consegui abrir agora. Tente de novo.</p>'; });
    } else if (tab === 'economia') { // arquivo à parte: só carrega quando a pessoa abre esta aba
      body.innerHTML = '<span class="spin"></span>';
      import('./economia.js?v=1').then(E => { if (body.isConnected) body.innerHTML = E.economiaHTML() + `<div class="row" style="margin-top:26px"><button class="btn btn-pink" data-step="${tabs.length - 1}">${tabs[tabs.length - 1][1]}</button></div>`; $$('[data-step]').forEach(b => b.onclick = () => { step = +b.dataset.step; render(); window.scrollTo(0, 0); }); }).catch(() => { if (body.isConnected) body.innerHTML = '<p class="muted">Não consegui abrir agora. Tente de novo.</p>'; });
    } else if (tab === 'mais') {
      body.innerHTML = extraHTML(lesson, d);
    } else {
      if (!lesson.conversation) { // a conversação é criada à parte (não atrasa a aula); se ainda não ficou pronta, mostra a espera e completa sozinha
        body.innerHTML = spinner('Preparando sua conversação…', ['Pensando em perguntas para puxar conversa…', 'Ajustando ao seu nível…', 'Quase pronto…', 'Só mais um instante…']);
        convFor().then(() => { if (step === 3) render(); }).catch(er => { if (step === 3) body.innerHTML = errBox(er); });
        return;
      }
      const cv = lesson.conversation || {};
      body.innerHTML = `<div class="panel"><div class="eyebrow">Conversação</div><h2 style="margin:8px 0">${esc(cv.topic || lesson.title)}</h2><p class="muted">${esc(cv.goal || '')}</p>
        <ul class="prose" style="font-size:15px">${(cv.questions || []).map(q => `<li>${esc(q)}</li>`).join('')}</ul>
        <a class="btn btn-pink" href="#/conversa/${key}/${L.id}">🎙 Começar conversação</a></div>`;
    }
    $$('[data-step]').forEach(b => b.onclick = () => { step = +b.dataset.step; render(); window.scrollTo(0, 0); });
    $$('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say, loc));
    $$('[data-more]').forEach(b => b.onclick = () => saibaMais(+b.dataset.more));
    $$('[data-start]').forEach(b => b.onclick = () => primeirosPassos(lesson.start));
    $$('[data-listen]').forEach(b => b.onclick = () => speak(lessonSegments(), bodyLoc));
  }
  async function finish(res) {
    const first = !s.done[L.id];
    s.done[L.id] = { score: res.score, date: today() };
    if (first) S.state.stats.lessons++;
    touchStreak(); S.saveState();
    const nCards = addCards((lesson.vocab || []).map(v => ({ front: v.term, back: v.meaning, note: v.example })), key, 'aula');
    addCards(res.errors.slice(0, 6).map(e => ({ front: `Corrija: ${e.yours || '(em branco)'}${e.q ? ' — ' + e.q : ''}`.slice(0, 220), back: e.correct, note: e.why })), key, 'erro');
    await S.addEvent({ type: 'lesson', course: key, lessonId: L.id, n: L.n, title: lesson.title || L.title, level: s.level, score: res.score, errors: res.errors, vocab: (lesson.vocab || []).map(v => v.term) });
    const nx = nextLesson(key);
    app.innerHTML = `<div class="panel" style="max-width:640px;margin:30px auto;text-align:center">
      <div class="eyebrow">Aula ${L.n} concluída</div><div class="score">${res.score}%</div>
      <p class="muted">${res.score >= 85 ? 'Excelente! 🔥' : res.score >= 60 ? 'Muito bom, os erros já foram para a sua revisão.' : 'Normal errar: é assim que se aprende. Os erros viraram cartões de revisão.'}</p>
      <p class="small dim">${nCards} ${isLangC ? 'palavras novas' : 'termos novos'} na Memorização · 🔥 ${streakNow()} dias seguidos</p>
      <div class="row" style="justify-content:center;margin-top:18px">
        ${isLangC ? `<a class="btn btn-pink" href="#/conversa/${key}/${L.id}">🎙 Conversar sobre o tema</a>` : ''}
        ${nx ? `<a class="btn btn-ghost" href="#/aula/${key}/${nx.id}">Próxima aula</a>` : `<a class="btn btn-ghost" href="#/curso/${key}">Ver curso</a>`}
        <a class="btn btn-ghost" href="#/">Início</a>
      </div></div>`;
  }
  render();
}

// Garante que todo exercício tenha enunciado e alternativas válidas (protege também aulas antigas já salvas)
function limparExercicios(list) {
  return (Array.isArray(list) ? list : []).map(q => {
    const txt = String(q.q ?? q.question ?? q.pergunta ?? q.enunciado ?? q.prompt ?? '').trim();
    return { ...q, q: txt };
  }).filter(q => {
    if (q.q.replace(/^\d+[.)]?\s*/, '').length < 8) return false;
    if (q.type !== 'mcq') return true;
    const o = q.options || [];
    return o.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < o.length;
  });
}

// Exercícios (usado nas aulas e nos testes)
function exercisesUI(el, list, { langName, onDone, doneLabel = 'Concluir' }) {
  const ans = list.map(() => null);
  el.innerHTML = list.map((q, i) => `<div class="q" data-q="${i}">
    <div class="qt">${i + 1}. ${q.type === 'translate' ? 'Traduza: ' : ''}${esc(q.q)}</div>
    ${q.type === 'mcq' ? `<div class="opts">${(q.options || []).map((o, j) => `<button class="opt" data-o="${j}">${esc(o)}</button>`).join('')}</div>`
      : q.type === 'fill' ? `<input data-in placeholder="Sua resposta">`
        : `<textarea data-in placeholder="${q.type === 'write' ? 'Escreva aqui…' : 'Sua tradução'}"></textarea>`}
    <div class="fbx"></div></div>`).join('') + `<div class="row" style="margin-top:10px"><button class="btn btn-pink" id="check">Corrigir</button><span class="small dim" id="checkmsg"></span></div>`;
  $$('.q', el).forEach(qe => {
    const i = +qe.dataset.q;
    $$('.opt', qe).forEach(b => b.onclick = () => { if (qe.dataset.locked) return; $$('.opt', qe).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); ans[i] = +b.dataset.o; });
    const inp = $('[data-in]', qe); if (inp) inp.oninput = () => ans[i] = inp.value;
  });
  $('#check', el).onclick = async (e) => {
    const btn = e.target; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Corrigindo…';
    const res = list.map((q, i) => {
      const a = ans[i];
      if (q.type === 'mcq') return { ok: a === q.answer, score: a === q.answer ? 1 : 0, yours: a == null ? '' : q.options[a], correct: q.options[q.answer], why: q.explain };
      if (q.type === 'fill') { const ok = [q.answer, ...(q.accept || [])].some(x => norm(x) === norm(a)); return { ok, score: ok ? 1 : 0, yours: a || '', correct: q.answer, why: q.explain, ai: !ok && a }; }
      return { ok: false, score: 0, yours: a || '', correct: q.answer || '', why: q.explain, ai: !!(a && a.trim()) };
    });
    const pend = res.map((r, i) => r.ai ? i : -1).filter(i => i >= 0);
    let aiFail = false;
    if (pend.length) {
      try {
        const g = await AI.grade({ langName, items: pend.map(i => ({ type: list[i].type, task: list[i].q, model: list[i].answer || null, yours: res[i].yours })) });
        pend.forEach((i, k) => { const x = g.results?.[k]; if (!x) return; res[i].ok = !!x.ok; res[i].score = Math.max(0, Math.min(1, +x.score || (x.ok ? 1 : 0))); res[i].correct = x.corrected || res[i].correct; res[i].why = x.explain || res[i].why; });
      } catch (er) {
        aiFail = true;
        pend.forEach(i => { const q = list[i]; if (q.type === 'write') { res[i].ok = true; res[i].score = 1; } else if (q.type === 'translate') { res[i].ok = norm(res[i].yours) === norm(q.answer); res[i].score = res[i].ok ? 1 : 0.5; } });
        $('#checkmsg', el).textContent = 'Correção automática da IA indisponível agora (' + er.message + '). Compare com as respostas modelo.';
      }
    }
    $$('.q', el).forEach(qe => {
      const i = +qe.dataset.q, r = res[i], q = list[i]; qe.dataset.locked = 1;
      if (q.type === 'mcq') $$('.opt', qe).forEach(b => { const j = +b.dataset.o; if (j === q.answer) b.classList.add('right'); else if (j === ans[i]) b.classList.add('wrong'); });
      $('.fbx', qe).innerHTML = `<div class="fb ${r.ok ? 'ok' : 'no'}">${r.ok ? '✓ ' : '✗ '}${!r.ok || q.type !== 'mcq' ? (r.correct ? `<b>${esc(r.correct)}</b><br>` : '') : ''}${esc(r.why || '')}</div>`;
    });
    const score = Math.round(100 * res.reduce((a, r) => a + r.score, 0) / Math.max(1, res.length));
    const errors = res.map((r, i) => ({ ...r, q: list[i].q })).filter(r => !r.ok || r.score < 0.7).map(r => ({ q: r.q, yours: r.yours, correct: r.correct, why: r.why }));
    btn.outerHTML = `<button class="btn btn-pink" id="fin">${doneLabel}: ${score}%</button>`;
    $('#fin', el).onclick = () => onDone({ score, errors, aiFail, results: res });
  };
}

// ---------- CONVERSAÇÃO ----------
async function conversa(key, lessonId) {
  const d = course(key), s = cs(key), isTrack = d.kind === 'trk' || d.kind === 'cus';
  let topic = 'Conversa livre', goal = '', questions = [], words = [];
  if (lessonId) {
    const les = await S.getLesson(key, lessonId);
    if (les) { topic = les.conversation?.topic || les.title; goal = les.conversation?.goal || ''; questions = les.conversation?.questions || []; words = (les.vocab || []).map(v => v.term).slice(0, 10); }
  }
  const tutor = 'IAlvorecer';
  const prefs = { voice: LS.get('pg_voice') !== '0', hide: LS.get('pg_hide') === '1' };
  app.innerHTML = `<a class="back" href="#/curso/${key}">${esc(d.title)}</a>
  <div class="panel" style="max-width:720px;margin:20px auto">
    <div class="eyebrow">${isTrack ? 'Discussão com mentor' : 'Aula de conversação'} · ${esc(d.title)}${isTrack ? '' : ' · ' + s.level}</div>
    <h2 style="margin:10px 0 6px">${esc(topic)}</h2>
    <p class="muted">Com o IAlvorecer, que conversa com você e te ajuda a evoluir. ${canListen ? 'Fale pelo microfone 🎙 ou digite.' : 'Digite suas respostas (este navegador não tem microfone por voz; no PC use Chrome ou Edge).'} Ela corrige seus erros na hora e, no final, você recebe um relatório que vai para o histórico.</p>
    <div class="field" style="margin-top:16px"><label>Tema (pode mudar)</label><input id="tp" value="${esc(topic)}"></div>
    <label class="check small" style="margin-bottom:8px"><input type="checkbox" id="pv" style="width:auto" ${prefs.voice ? 'checked' : ''}> Ler as respostas em voz alta</label>
    <label class="check small" style="margin-bottom:18px"><input type="checkbox" id="ph" style="width:auto" ${prefs.hide ? 'checked' : ''}> Modo desafio: esconder o texto do IAlvorecer (só ouvir)</label>
    <button class="btn btn-pink" id="go">Começar</button>
    <p class="small dim" style="margin-top:14px">Dica: use fone de ouvido para o microfone não captar a voz do IAlvorecer.</p>
  </div>`;
  $('#go').onclick = () => {
    prefs.voice = $('#pv').checked; prefs.hide = $('#ph').checked; LS.set('pg_voice', prefs.voice ? '1' : '0'); LS.set('pg_hide', prefs.hide ? '1' : '0');
    const tp = $('#tp').value.trim() || topic;
    if (tp !== topic) { topic = tp; goal = ''; questions = []; }
    runChat();
  };

  function runChat() {
    const system = AI.chatSystem({ lang: d.lang, level: s.level, topic, goal, questions, words, errors: recentErrors(key, 8), isTrack, contentLang: d.contentLang, tutor });
    const hist = []; const corrections = []; const newWords = [];
    const t0 = Date.now(); let stopMic = null, busy = false, ended = false;
    app.innerHTML = `<div class="chat">
      <div class="chat-top"><div class="avatar" style="width:42px;height:42px">IA</div><div><b>${tutor}</b><div class="small muted">${esc(topic)}</div></div><div class="spacer"></div><span class="small dim" id="timer">0:00</span><button class="btn btn-ghost btn-sm" id="end">Encerrar aula</button></div>
      <div class="msgs" id="msgs"></div>
      <div class="composer">${canListen ? '<button class="mic" id="mic" title="Falar">🎙</button>' : ''}<textarea id="txt" rows="1" placeholder="${canListen ? 'Toque no microfone e fale, ou digite…' : 'Digite sua resposta…'}"></textarea><button class="send" id="send">➤</button></div>
    </div>`;
    const msgs = $('#msgs'), txt = $('#txt');
    const goalMin = convMin(); let warned = false;
    const timer = setInterval(() => { const sec = Math.floor((Date.now() - t0) / 1000); $('#timer') && ($('#timer').textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} / ${goalMin} min`); if (!warned && sec >= goalMin * 60) { warned = true; toast(`Meta de ${goalMin} minutos cumprida! 🎉 Encerre quando quiser.`, 7000); } }, 1000);
    cleanup = () => { clearInterval(timer); stopMic?.(); stopSpeaking(); };
    const scroll = () => msgs.scrollTop = msgs.scrollHeight;
    function addMsg(role, text, hidden) {
      const div = document.createElement('div'); div.className = 'msg ' + role;
      if (hidden) { div.innerHTML = `<span class="dim">🔊 (texto escondido)</span> <button class="say" title="Mostrar">👁</button>`; div.querySelector('button').onclick = () => div.textContent = text; }
      else { div.textContent = text; if (role === 'ai' && canSpeak) { const b = document.createElement('button'); b.className = 'say'; b.textContent = '🔊'; b.onclick = () => speak(text, d.locale); div.append(' ', b); } }
      msgs.append(div); scroll();
    }
    async function turn() {
      busy = true;
      const typing = document.createElement('div'); typing.className = 'typing'; typing.textContent = 'O IAlvorecer está pensando…'; msgs.append(typing); scroll();
      try {
        const r = await AI.chat({ system, history: hist.slice(-30) });
        typing.remove();
        if (r.correction && hist.length && hist[hist.length - 1].role === 'me') {
          corrections.push(r.correction);
          const c = document.createElement('div'); c.className = 'corr';
          c.innerHTML = `✏️ <s>${esc(r.correction.original)}</s> → <b>${esc(r.correction.better)}</b><br><span>${esc(r.correction.why || '')}</span>`;
          msgs.append(c);
        }
        (r.words || []).forEach(w => w?.term && newWords.push(w));
        const reply = r.reply || '…';
        hist.push({ role: 'ai', text: reply });
        addMsg('ai', reply, prefs.hide);
        if (prefs.voice) await speak(reply, d.locale);
      } catch (er) { typing.remove(); const e2 = document.createElement('div'); e2.className = 'corr'; e2.textContent = '⚠️ ' + er.message; msgs.append(e2); }
      busy = false; scroll();
    }
    async function send() {
      const t = txt.value.trim(); if (!t || busy || ended) return;
      stopMic?.(); stopMic = null; $('#mic')?.classList.remove('rec');
      txt.value = ''; hist.push({ role: 'me', text: t }); addMsg('me', t); await turn();
    }
    $('#send').onclick = send;
    txt.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    $('#mic') && ($('#mic').onclick = () => {
      if (stopMic) { stopMic(); stopMic = null; $('#mic').classList.remove('rec'); setTimeout(send, 250); return; }
      stopSpeaking(); const base = txt.value ? txt.value + ' ' : '';
      $('#mic').classList.add('rec');
      stopMic = listen(d.locale, { onText: (f, i) => txt.value = base + f + (i ? ' ' + i : ''), onError: m => { toast(m); $('#mic')?.classList.remove('rec'); stopMic = null; } });
    });
    $('#end').onclick = async () => {
      if (ended) return; ended = true; cleanup();
      const minutes = Math.max(1, Math.round((Date.now() - t0) / 60000));
      if (hist.filter(m => m.role === 'me').length < 2) { toast('Conversa curta demais para gerar relatório.'); location.hash = `#/curso/${key}`; return; }
      app.innerHTML = spinner('Gerando seu relatório da aula…');
      let rep;
      try { rep = await AI.summarize({ langName: d.lang.name, transcript: hist.map(m => `${m.role === 'me' ? 'ALUNA' : tutor.toUpperCase()}: ${m.text}`), corrections, isTrack }); }
      catch (er) { rep = { summary: 'Relatório indisponível (' + er.message + ').', score: null, strengths: [], errors: corrections, vocab: newWords.map(w => ({ term: w.term, meaning: w.meaning })), next: '' }; }
      const cid = `${today()}-${uid()}`;
      S.putConvo(cid, { id: cid, course: key, topic, tutor, date: today(), minutes, history: hist, corrections, report: rep });
      S.state.stats.conversations++; S.state.stats.minutes += minutes; touchStreak(); S.saveState();
      addCards((rep.vocab || []).map(v => ({ front: v.term, back: v.meaning, note: v.example })), key, 'conversa');
      addCards((rep.errors || []).slice(0, 6).map(e => ({ front: `Diga melhor: ${e.original}`, back: e.better, note: e.why })), key, 'erro');
      await S.addEvent({ type: 'conversation', course: key, title: topic, minutes, score: rep.score, summary: rep.summary, convoId: cid, errors: (rep.errors || []).map(e => ({ yours: e.original, correct: e.better, why: e.why })), strengths: rep.strengths, next: rep.next });
      app.innerHTML = `<div style="max-width:760px;margin:0 auto">
        <div class="eyebrow">Relatório da conversação · ${minutes} min</div><h1 style="margin:8px 0 14px">${esc(topic)}</h1>
        ${rep.score != null ? `<div class="score">${rep.score}</div>` : ''}
        <p>${esc(rep.summary)}</p>
        ${rep.strengths?.length ? `<h3 style="margin:22px 0 10px">Pontos fortes</h3><ul>${rep.strengths.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${rep.errors?.length ? `<h3 style="margin:22px 0 10px">Para corrigir</h3>${rep.errors.map(e => `<div class="err"><div class="y">✗ ${esc(e.original)}</div><div class="c">✓ ${esc(e.better)}</div><div class="small muted">${esc(e.why || '')}</div></div>`).join('')}` : ''}
        ${rep.vocab?.length ? `<h3 style="margin:22px 0 10px">Vocabulário para revisar</h3><div class="vocab">${rep.vocab.map(v => `<div class="vcard"><b>${esc(v.term)}</b><div class="small muted">${esc(v.meaning)}</div></div>`).join('')}</div>` : ''}
        ${rep.next ? `<div class="notice" style="margin-top:22px">Próximo foco: ${esc(rep.next)}</div>` : ''}
        <div class="row" style="margin-top:24px"><a class="btn btn-pink" href="#/">Voltar ao início</a><a class="btn btn-ghost" href="#/historico">Ver histórico</a></div></div>`;
    };
    turn();
  }
}

// ---------- MEMORIZAÇÃO ----------
async function memorizacao() {
  const evs = await events(2);
  const due = S.srs.filter(c => isDue(c));
  const by = {};
  for (const c of S.srs) { const b = (by[c.course] ||= { total: 0, due: 0, learned: 0 }); b.total++; if (isDue(c)) b.due++; if ((c.interval || 0) >= 21) b.learned++; }
  const tests = evs.filter(e => e.type === 'test').sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 5);
  app.innerHTML = `
  <div class="eyebrow">Memorização</div><h1 style="margin:6px 0 6px">Lembrar para sempre</h1>
  <p class="muted">Repetição espaçada: cada palavra volta no momento certo, logo antes de você esquecer. Erros das aulas e conversas também viram cartões.</p>
  <div class="journey section">
    <div class="journey-card" style="background:linear-gradient(150deg,#14b8a6,#0ea5e9 60%,#6366f1)"><div class="art">◎</div>
      <div><div class="eyebrow" style="color:#fff;opacity:.85">Revisão de hoje</div><h2 style="margin-top:8px">${due.length ? `${due.length} cartões esperando` : 'Tudo em dia!'}</h2><p style="opacity:.85;margin-top:6px">${due.length ? `Leva uns ${Math.max(2, Math.round(due.length / 6))} minutos.` : 'Volte amanhã para novos cartões.'}</p></div>
      <div>${due.length ? '<a class="btn btn-pink" href="#/revisao">Revisar agora</a>' : ''}</div></div>
    <div class="panel today"><h3>Testes de memória</h3>
      <a class="task" href="#/teste/semana"><span class="ck">7</span><span><div class="t">Teste da semana</div><div class="s">Tudo o que você viu nos últimos 7 dias</div></span></a>
      <a class="task" href="#/teste/mes"><span class="ck">30</span><span><div class="t">Teste do mês</div><div class="s">Palavras e erros dos últimos 30 dias</div></span></a>
      ${tests.length ? `<div class="small muted" style="margin-top:6px">Últimos: ${tests.map(t => `${fmtShort(t.date)} ${t.kind} ${t.score}%`).join(' · ')}</div>` : ''}
    </div>
  </div>
  <div class="section"><div class="section-head"><h2>Por curso</h2></div>
    ${Object.keys(by).length ? `<div class="grid g3">${Object.entries(by).map(([k, b]) => { const d = course(k); return `<div class="panel"><div class="row"><b>${esc(d.title)}</b><span class="spacer"></span>${b.due ? `<a class="btn btn-pink btn-sm" href="#/revisao/${k}">Revisar ${b.due}</a>` : '<span class="pill">em dia</span>'}</div><div class="small muted" style="margin-top:8px">${b.total} cartões · ${b.learned} bem memorizados</div></div>`; }).join('')}</div>` : '<div class="empty">Seus cartões aparecem aqui depois da primeira aula.</div>'}
  </div>`;
}

async function revisao(key) {
  const cards = shuffle(S.srs.filter(c => isDue(c) && (!key || c.course === key))).slice(0, 40);
  if (!cards.length) { app.innerHTML = `<div class="empty" style="margin-top:40px">Nada para revisar agora. 🎉<br><br><a class="btn btn-ghost" href="#/memorizacao">Voltar</a></div>`; return; }
  let i = 0, right = 0;
  const show = (reveal) => {
    const c = cards[i], d = course(c.course);
    app.innerHTML = `<div class="flash"><div class="row small muted"><a href="#/memorizacao">Sair</a><span class="spacer"></span>${i + 1} / ${cards.length}</div>
      <div class="progress" style="margin:12px 0 20px"><i style="width:${(i / cards.length) * 100}%;background:var(--pink)"></i></div>
      <div class="fcard"><div class="small" style="opacity:.75">${esc(d.title)}${c.source === 'erro' ? ' · seu erro' : ''}</div>
        <div class="front">${esc(c.front)} ${canSpeak && d.kind !== 'trk' && c.source !== 'erro' ? `<button class="say" id="sf">🔊</button>` : ''}</div>
        ${reveal ? `<div class="back">${esc(c.back)}</div>${c.note ? `<div class="note">${esc(c.note)}</div>` : ''}` : ''}</div>
      ${reveal ? `<div class="grades"><button class="g0" data-g="0">Errei<small>de novo hoje</small></button><button data-g="1">Difícil<small>em breve</small></button><button data-g="2">Bom<small>alguns dias</small></button><button class="g3" data-g="3">Fácil<small>bem depois</small></button></div>`
        : `<button class="btn btn-pink" id="rv" style="margin-top:18px">Mostrar resposta</button><p class="small dim" style="margin-top:10px">Tente lembrar (ou falar em voz alta) antes de virar.</p>`}</div>`;
    $('#sf') && ($('#sf').onclick = () => speak(c.front, d.locale));
    $('#rv') && ($('#rv').onclick = () => show(true));
    $$('[data-g]').forEach(b => b.onclick = () => {
      const g = +b.dataset.g; if (g > 0) right++;
      const idx = S.srs.findIndex(x => x.id === c.id); S.srs[idx] = schedule(S.srs[idx], g);
      if (g === 0) cards.push(c);
      i++; S.saveSrs();
      if (i >= cards.length) end(); else show(false);
    });
  };
  const end = async () => {
    S.state.stats.reviews++; touchStreak(); S.saveState();
    await S.addEvent({ type: 'review', course: key || null, title: 'Revisão de memória', count: cards.length, score: Math.round(100 * right / cards.length) });
    app.innerHTML = `<div class="panel" style="max-width:560px;margin:40px auto;text-align:center"><div class="eyebrow">Revisão concluída</div><div class="score">${Math.round(100 * right / cards.length)}%</div><p class="muted">${cards.length} cartões revisados.</p><a class="btn btn-pink" href="#/">Voltar ao início</a></div>`;
  };
  show(false);
}

// ---------- TESTES ----------
async function teste(kind = 'semana', key) {
  const isLevel = kind === 'nivel';
  if (!key) {
    const opts = [...new Set(S.srs.map(c => c.course))];
    const main = 'lang:' + S.state.plan.main;
    if (!opts.length) { app.innerHTML = `<div class="empty" style="margin-top:40px">Faça algumas aulas primeiro: o teste usa o que você estudou.<br><br><a class="btn btn-ghost" href="#/">Início</a></div>`; return; }
    if (opts.length > 1) {
      app.innerHTML = `<div class="panel" style="max-width:560px;margin:30px auto"><div class="eyebrow">Teste ${kind === 'mes' ? 'do mês' : 'da semana'}</div><h2 style="margin:8px 0 16px">De qual curso?</h2><div class="today">${opts.map(k => `<a class="task" href="#/teste/${kind}/${k}"><span class="ck">→</span><span class="t">${esc(course(k).title)}</span></a>`).join('')}</div></div>`;
      return;
    }
    key = opts.includes(main) ? main : opts[0];
  }
  const d = course(key), s = cs(key);
  const days = kind === 'mes' ? 30 : 7;
  const since = addDays(today(), -days);
  await events(2);
  const cards = isLevel ? S.srs.filter(c => c.course === key) : S.srs.filter(c => c.course === key && c.created >= since);
  const errs = loadedEvents().filter(e => e.course === key && (isLevel || e.date >= since)).flatMap(e => (e.errors || []).map(x => `${x.yours} → ${x.correct}`));
  const n = isLevel ? 20 : kind === 'mes' ? 25 : 15;
  const title = isLevel ? `a prova do nível ${s.level} (${lvName(s.level)})` : kind === 'mes' ? 'o teste do mês' : 'o teste da semana';
  app.innerHTML = spinner('Montando seu teste…');
  let qs;
  try {
    const r = await AI.test({ title, langName: d.lang.name, level: d.kind === 'lang' ? s.level : null, n, cards, errors: errs, scope: isLevel ? `Prova de proficiência do nível ${s.level}: cubra a gramática e o vocabulário típicos de ${s.level} (QECR), não só o que ela estudou.` : '' });
    qs = limparExercicios(r.questions);
  } catch (er) {
    if (isLevel || cards.length < 4) throw er;
    qs = shuffle(cards).slice(0, n).map(c => { const wrong = shuffle(S.srs.filter(x => x.id !== c.id && x.back !== c.back)).slice(0, 3).map(x => x.back); const options = shuffle([c.back, ...wrong]); return { type: 'mcq', q: c.front, options, answer: options.indexOf(c.back), explain: c.note }; });
    toast('Sem IA agora: teste montado só com seus cartões.');
  }
  app.innerHTML = `<a class="back" href="#/memorizacao">Voltar</a><div class="eyebrow" style="margin-top:14px">${esc(d.title)}</div><h1 style="margin:6px 0 20px">${isLevel ? `Prova do nível ${s.level}` : kind === 'mes' ? 'Teste do mês' : 'Teste da semana'}</h1>${isLevel ? '<p class="muted" style="margin-bottom:18px">Com 70% ou mais você sobe de nível.</p>' : ''}<div id="tb"></div>`;
  exercisesUI($('#tb'), qs, {
    langName: d.lang.name, doneLabel: 'Salvar resultado', onDone: async res => {
      S.state.stats.tests++; touchStreak();
      addCards(res.errors.slice(0, 8).map(e => ({ front: `Corrija: ${e.yours || '(em branco)'} — ${e.q}`.slice(0, 220), back: e.correct, note: e.why })), key, 'erro');
      await S.addEvent({ type: 'test', kind, course: key, title: isLevel ? `Prova do nível ${s.level}` : kind === 'mes' ? 'Teste do mês' : 'Teste da semana', level: s.level, score: res.score, errors: res.errors });
      let msg = '';
      if (isLevel && res.score >= 70) {
        const from = s.level; s.levels[from] = { passed: today(), score: res.score };
        if (from === 'C2') { s.cycle = (s.cycle || 1) + 1; msg = `Você domina o C2! Um novo ciclo de aprofundamento (ciclo ${s.cycle}) foi liberado.`; }
        else { s.level = C.levels[lvIdx(from) + 1]; s.cycle = 1; msg = `Parabéns! Você subiu do ${from} para o ${s.level}. 🎉`; }
        await S.addEvent({ type: 'level', course: key, title: msg, level: s.level, score: res.score });
      } else if (isLevel) msg = 'Ainda não foi desta vez. Revise os erros (já estão na Memorização) e tente de novo quando quiser.';
      S.saveState();
      app.innerHTML = `<div class="panel" style="max-width:600px;margin:30px auto;text-align:center"><div class="eyebrow">Resultado</div><div class="score">${res.score}%</div><p>${esc(msg || (res.score >= 80 ? 'Sua memória está ótima!' : 'Os erros viraram cartões de revisão.'))}</p><div class="row" style="justify-content:center;margin-top:16px"><a class="btn btn-pink" href="#/curso/${key}">Ver curso</a><a class="btn btn-ghost" href="#/historico">Histórico</a></div></div>`;
    }
  });
}

// ---------- HISTÓRICO ----------
async function historico(tab = 'linha') {
  app.innerHTML = spinner('Carregando seu histórico…');
  const months = await S.listMonths();
  if (!months.includes(ym())) months.unshift(ym());
  let shown = Math.min(2, months.length);
  for (const m of months.slice(0, shown)) await S.month(m);
  const ICON = { lesson: '📘', conversation: '🎙', review: '◎', test: '📝', level: '🏆', mentoria: '🧭' };
  const LBL = { lesson: 'Aula', conversation: 'Conversação', review: 'Revisão', test: 'Teste', level: 'Nível', mentoria: 'Mentoria' };
  const draw = () => {
    const evs = months.slice(0, shown).flatMap(m => S.months[m] || []).filter(visibleEv).sort((a, b) => b.ts.localeCompare(a.ts));
    const courseOpts = [...new Set(evs.map(e => e.course).filter(Boolean))];
    let body = '';
    if (tab === 'linha') {
      const byDay = {}; evs.forEach(e => (byDay[e.date] ||= []).push(e));
      body = Object.keys(byDay).length ? Object.entries(byDay).map(([day, list]) => `<div class="day"><h4>${esc(fmtDay(day))}</h4>${list.map(e => `
        <details class="ev"><summary><span class="ic">${ICON[e.type] || '•'}</span><span style="flex:1"><b>${esc(e.title || LBL[e.type])}</b><div class="small muted">${LBL[e.type] || ''}${e.course ? ' · ' + esc(course(e.course).title) : ''}${e.n ? ' · Aula ' + e.n : ''}${e.minutes ? ' · ' + e.minutes + ' min' : ''}${e.count ? ' · ' + e.count + ' cartões' : ''}</div></span>${e.score != null ? `<span class="pill">${e.score}%</span>` : ''}</summary>
        <div class="body">${e.summary ? `<p>${esc(e.summary)}</p>` : ''}${e.next ? `<p class="small muted">Próximo foco: ${esc(e.next)}</p>` : ''}
          ${(e.errors || []).length ? e.errors.map(x => `<div class="err"><div class="y">✗ ${esc(x.yours || '(em branco)')}</div><div class="c">✓ ${esc(x.correct)}</div>${x.why ? `<div class="small muted">${esc(x.why)}</div>` : ''}</div>`).join('') : (e.type === 'lesson' || e.type === 'test') ? '<p class="small muted">Nenhum erro. 👏</p>' : ''}
          ${e.vocab?.length ? `<p class="small muted">Vocabulário: ${esc(e.vocab.join(', '))}</p>` : ''}
          ${e.convoId ? `<button class="btn btn-ghost btn-sm" data-convo="${esc(e.convoId)}">Ver conversa completa</button><div data-cv="${esc(e.convoId)}"></div>` : ''}
          ${e.type === 'lesson' && e.lessonId ? `<a class="btn btn-ghost btn-sm" href="#/aula/${e.course}/${e.lessonId}">Rever aula</a>` : ''}
        </div></details>`).join('')}</div>`).join('') : '<div class="empty">Seu histórico começa na primeira aula.</div>';
    } else if (tab === 'erros') {
      const f = LS.get('pg_errf') || '';
      const errs = evs.filter(e => !f || e.course === f).flatMap(e => (e.errors || []).map(x => ({ ...x, date: e.date, course: e.course, from: LBL[e.type] })));
      body = `<div class="row" style="margin-bottom:16px"><select id="errf" style="max-width:280px"><option value="">Todos os cursos</option>${courseOpts.map(k => `<option value="${k}" ${k === f ? 'selected' : ''}>${esc(course(k).title)}</option>`).join('')}</select><span class="small muted">${errs.length} erros registrados</span></div>
        ${errs.length ? errs.map(x => `<div class="err"><div class="small dim">${fmtShort(x.date)} · ${esc(course(x.course).title)} · ${x.from}</div>${x.q ? `<div class="small muted">${esc(x.q)}</div>` : ''}<div class="y">✗ ${esc(x.yours || '(em branco)')}</div><div class="c">✓ ${esc(x.correct)}</div>${x.why ? `<div class="small muted">${esc(x.why)}</div>` : ''}</div>`).join('') : '<div class="empty">Nenhum erro por aqui.</div>'}`;
    } else if (tab === 'vocab') {
      body = `<input id="vq" placeholder="Buscar palavra…" style="max-width:360px;margin-bottom:16px"><div class="vocab" id="vl"></div>`;
    } else if (tab === 'niveis') {
      const lv = evs.filter(e => e.type === 'level' || (e.type === 'test' && e.kind === 'nivel'));
      body = `<div class="grid g3" style="margin-bottom:24px">${Object.keys(S.state.courses).filter(k => k.startsWith('lang:')).map(k => { const s = cs(k); return `<div class="panel"><b>${esc(course(k).title)}</b><div class="score" style="font-size:40px">${s.level}</div><div class="small muted">${esc(lvName(s.level))} · ${Math.round(progress(k) * 100)}% do curso</div>${Object.entries(s.levels || {}).length ? `<div class="small dim" style="margin-top:8px">Aprovada em: ${Object.entries(s.levels).map(([l, v]) => `${l} (${fmtShort(v.passed)}, ${v.score}%)`).join(', ')}</div>` : ''}</div>`; }).join('')}</div>
        ${lv.length ? lv.map(e => `<div class="ev"><b>${esc(e.title)}</b><div class="small muted">${fmtDay(e.date)} · ${esc(course(e.course).title)}${e.score != null ? ' · ' + e.score + '%' : ''}</div></div>`).join('') : '<div class="empty">Provas de nível e mudanças aparecem aqui.</div>'}`;
    }
    const totalErr = evs.reduce((a, e) => a + (e.errors?.length || 0), 0);
    app.innerHTML = `<div class="eyebrow">Histórico</div><h1 style="margin:6px 0 18px">Tudo o que você já fez</h1>
      <div class="stats" style="margin-bottom:24px"><div class="stat"><b>${S.state.stats.lessons}</b><span>aulas</span></div><div class="stat"><b>${S.state.stats.conversations}</b><span>conversações (${S.state.stats.minutes} min)</span></div><div class="stat"><b>${S.srs.length}</b><span>palavras</span></div><div class="stat"><b>${totalErr}</b><span>erros corrigidos (${months.slice(0, shown).length} ${shown > 1 ? 'meses' : 'mês'})</span></div></div>
      <div class="tabs">${[['linha', 'Linha do tempo'], ['erros', 'Meus erros'], ['vocab', 'Vocabulário'], ['niveis', 'Níveis']].map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
      ${body}
      ${tab !== 'vocab' && tab !== 'niveis' && shown < months.length ? `<div class="row" style="justify-content:center;margin-top:20px"><button class="btn btn-ghost" id="moreM">Carregar ${fmtMonth(months[shown])}</button></div>` : ''}`;
    $$('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; history.replaceState(null, '', '#/historico/' + tab); draw(); });
    $('#moreM') && ($('#moreM').onclick = async () => { await S.month(months[shown]); shown++; draw(); });
    $('#errf') && ($('#errf').onchange = e => { LS.set('pg_errf', e.target.value); draw(); });
    $$('[data-convo]').forEach(b => b.onclick = async () => {
      const box = $(`[data-cv="${b.dataset.convo}"]`); box.innerHTML = '<span class="spin"></span>';
      const c = await S.getConvo(b.dataset.convo);
      box.innerHTML = c ? `<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">${c.history.map(m => `<div class="msg ${m.role}" style="max-width:100%">${esc(m.text)}</div>`).join('')}</div>` : '<p class="small muted">Conversa não encontrada.</p>';
      b.remove();
    });
    if (tab === 'vocab') {
      const list = () => { const q = norm($('#vq').value); $('#vl').innerHTML = S.srs.filter(c => !q || norm(c.front + ' ' + c.back).includes(q)).slice().reverse().slice(0, 300).map(c => `<div class="vcard"><b>${esc(c.front)}</b><div class="small muted">${esc(c.back)}</div><div class="small dim" style="margin-top:6px">${esc(course(c.course).title)} · ${c.interval >= 21 ? 'memorizada ✓' : c.due ? 'revisar em ' + fmtShort(c.due) : 'nova'}</div></div>`).join('') || '<div class="empty">Nada encontrado.</div>'; };
      $('#vq').oninput = list; list();
    }
  };
  draw();
}

// ---------- AJUSTES ----------
function temaNome() { const T = window.IATema; if (!T) return 'Manhã'; return T.nome(T.atual().id); }
async function ajustes() {
  const st = S.state, cf = S.config;
  const langOpts = sel => C.languages.map(l => `<option value="${l.id}" ${l.id === sel ? 'selected' : ''}>${l.name}</option>`).join('');
  const days = [[1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [0, 'Dom']].filter(([n]) => getStudyDays().days.includes(n) || (st.plan.secondDays || []).includes(n));
  app.innerHTML = `<div style="max-width:760px">
  <div class="eyebrow">Ajustes</div><h1 style="margin:6px 0 22px">Seu curso, do seu jeito</h1>
  ${S.isDemo ? '<div class="notice" style="margin-bottom:18px">Modo demonstração: nada é salvo.</div>' : ''}
  <div class="panel" style="margin-bottom:18px"><h3 style="margin-bottom:14px">Perfil</h3>
    <div class="grid g2"><div class="field"><label>Seu nome</label><input id="nm" value="${esc(st.profile.name)}"></div><div class="field"><label>Sua área profissional</label><input id="ar" value="${esc(st.profile.area)}"></div></div>
    <div class="field"><label>Idioma das aulas (Tecnologia, áreas de interesse e Seu Alvorecer) e do IAlvorecer</label><select id="cl">${[['pt', 'Português'], ['en', 'Inglês (English)'], ['es', 'Espanhol (Español)']].map(([v, l]) => `<option value="${v}" ${(st.profile.prefs?.contentLang || 'pt') === v ? 'selected' : ''}>${l}</option>`).join('')}</select><div class="help">Dá pra mudar só de um curso no topo da página dele (PT / EN / ES). Os cursos de idiomas seguem o seu nível.</div></div></div>
  <div class="panel" style="margin-bottom:18px"><h3 style="margin-bottom:6px">Aparência</h3><p class="small muted" style="margin-bottom:14px">Escolha as cores do site: paletas prontas (Nascer do sol, Manhã, Meio-dia e outras) ou as suas. Fica salvo só neste aparelho.</p><div class="row" style="gap:14px;align-items:center"><button type="button" class="btn btn-ghost" data-tema-open><i data-lucide="palette"></i> Personalizar cores</button><button type="button" class="btn btn-ghost" data-pers-open><i data-lucide="layout-dashboard"></i> Personalizar o site</button><span class="small muted">Tema atual: <b data-tema-nome>${esc(temaNome())}</b></span></div></div>
  <div class="panel" style="margin-bottom:18px"><h3 style="margin-bottom:6px">Dias de estudo</h3><p class="small muted" style="margin-bottom:14px">Fins de semana e feriados são de descanso por padrão. Quem trabalha muito pode escolher só os dias que cabem na rotina. Lembre: ter pelo menos 1 dia de descanso do trabalho e/ou dos estudos ajuda o conteúdo a fixar melhor.</p><div class="row" style="gap:14px;align-items:center"><button type="button" class="btn btn-ghost" id="diasOpen">Escolher dias de estudo</button><span class="small muted" id="diasRes">${esc(diasResumo())}</span></div></div>
  <div class="panel" style="margin-bottom:18px"><h3 style="margin-bottom:6px">Plano de estudos</h3><p class="small muted" style="margin-bottom:14px">O e-mail da manhã e a tela inicial seguem isto. Nos dias marcados, a aula do dia é do idioma secundário.</p>
    <div class="grid g2"><div class="field"><label>Idioma principal</label><select id="pm">${langOpts(st.plan.main)}</select></div>
    <div class="field"><label>Idioma secundário</label><select id="ps"><option value="">Nenhum</option>${langOpts(st.plan.second)}</select></div></div>
    <div class="field"><label>Dias do idioma secundário</label><div class="row">${days.map(([n, l]) => `<label class="check small" style="gap:6px"><input type="checkbox" data-day="${n}" style="width:auto" ${(st.plan.secondDays || []).includes(n) ? 'checked' : ''}>${l}</label>`).join('')}</div></div></div>
  <div class="panel" style="margin-bottom:18px"><h3 style="margin-bottom:6px">Sua IA</h3><p class="small muted" style="margin-bottom:14px">O IAlvorecer já vem ligado de graça, com um limite diário por pessoa. Se quiser usar sem limite, conecte a sua própria IA (Gemini, grátis): a chave fica salva só na sua conta.</p>
    <div style="margin-bottom:16px">${iaMeterHTML()}</div><button class="btn btn-ghost btn-sm" data-iainfo style="margin-bottom:16px">Como funciona e como conectar</button>
    <div class="field"><label>Chave do Gemini</label><input id="gk" type="password" value="${esc(cf.geminiKey || '')}" placeholder="Cole sua chave aqui"><div class="help">Crie em aistudio.google.com → Get API key.</div></div>
    <div class="field"><label>Modelo</label><input id="gm" value="${esc(cf.model || '')}" placeholder="automático (recomendado)"><div class="help">Deixe vazio: o site escolhe sozinho o modelo mais atual do Google.</div></div>
    <button class="btn btn-ghost btn-sm" id="tst">Testar IA</button> <span class="small" id="tstm"></span></div>
  <div id="memAj"></div>
  <div class="panel" style="margin-bottom:18px"><h3 style="margin-bottom:6px">E-mails</h3><p class="small muted" style="margin-bottom:14px">Um e-mail por dia, de segunda a sexta (fora feriados), com tudo o que você precisa: a aula do dia, as revisões e a sua conversação. Lembrete extra só se você marcar uma conversação e pedir o aviso.</p>
    <div class="field"><label>E-mail que recebe as aulas</label><input id="em" value="${esc(S.user?.email || cf.email || '')}" readonly><div class="help">Os e-mails vão sempre para o e-mail da sua conta.</div></div>
    <label class="check small" style="margin-bottom:10px"><input type="checkbox" id="eon" style="width:auto" ${cf.emailsOn !== false ? 'checked' : ''}> Enviar e-mails</label>
    <div class="grid g2" style="margin-top:4px"><div class="field"><label>Horário do e-mail do dia</label><select id="hA">${Array.from({ length: 17 }, (_, i) => i + 6).map(h => `<option value="${h}" ${(cf.emailHoraAula ?? 8) === h ? 'selected' : ''}>${h}h</option>`).join('')}</select></div>
    <div class="field"><label>Conversação com o IAlvorecer</label><div class="small" id="convRes" style="margin-bottom:8px">${esc(convResumo())}</div><button class="btn btn-ghost btn-sm" data-agenda>Marcar conversação</button></div></div>
    <div class="field" style="margin-top:4px"><label>Pausa (férias): sem e-mails até</label><input type="date" id="pz" value="${esc(cf.pauseUntil || '')}" style="max-width:220px"></div></div>
  ${(st.backups || []).length ? `<div class="panel" style="margin-bottom:18px"><h3 style="margin-bottom:6px">Alterações feitas pelo IAlvorecer</h3><p class="small muted" style="margin-bottom:12px">Arrependeu? Desfaça a última (pode repetir para voltar mais).</p>${st.backups.slice(0, 5).map(b => `<div class="small" style="padding:6px 0;border-bottom:1px solid var(--line)">${esc(new Date(b.ts).toLocaleString('pt-BR'))} · ${esc(b.label)}</div>`).join('')}<button class="btn btn-ghost btn-sm" id="undo1" style="margin-top:12px">↶ Desfazer a última</button></div>` : ''}
  <div class="row"><button class="btn btn-pink" id="save">Salvar ajustes</button><span class="spacer"></span><a class="btn btn-ghost btn-sm" href="#/boas-vindas">Nivelamento e preferências</a><a class="btn btn-ghost btn-sm" href="#/guia">Guia de uso</a><button class="btn btn-ghost btn-sm" id="out">Sair da conta</button></div>
  <div class="panel" style="margin-top:22px"><h3 style="margin-bottom:6px">Ajuda e contato</h3><p class="small muted" style="margin-bottom:14px">O IAlvorecer é feito por uma única designer com utilização de IA: podem ocorrer erros. Se algo der errado, conte pra gente.</p>
    <div class="row"><button class="btn btn-ghost btn-sm" data-fb="erro">⚠️ Reportar erro</button><button class="btn btn-ghost btn-sm" data-fb="avaliacao">⭐ Avaliar o IAlvorecer</button><button class="btn btn-ghost btn-sm" data-fb="contato">💬 Falar com a Emilly</button><a class="btn btn-ghost btn-sm" href="#/sobre">Sobre</a><a class="btn btn-ghost btn-sm" href="#/apoiar">Apoiar com Pix</a></div></div>
  <div class="panel" style="margin-top:22px"><h3 style="margin-bottom:6px">Sua conta</h3><p class="small muted" style="margin-bottom:14px">${S.isDemo ? 'Demonstração (nada é salvo).' : `Conectada como <b>${esc(S.user?.email || '')}</b>. Seus dados ficam guardados na sua conta e só você tem acesso.`}</p>
    <div class="row"><button class="btn btn-ghost btn-sm" id="wipe">🧹 Apagar todos os meus dados</button><button class="btn btn-ghost btn-sm" id="delAcc" style="color:#c0353a">⚠️ Excluir minha conta</button></div>
    <p class="help" style="margin-top:10px">"Apagar dados" zera tudo e recomeça do zero, mas mantém o login. "Excluir conta" apaga os dados e o seu e-mail do IAlvorecer para sempre.</p></div></div>`;
  $('#diasOpen').onclick = () => abrirDiasEstudo(() => router());
  $('#save').onclick = async () => {
    if (S.readonly) return toast('Modo visitante: crie sua conta para salvar seus ajustes.');
    st.profile.name = $('#nm').value.trim() || st.profile.name; st.profile.area = $('#ar').value.trim();
    st.profile.prefs = { ...(st.profile.prefs || {}), contentLang: $('#cl').value };
    st.plan.main = $('#pm').value; st.plan.second = $('#ps').value === st.plan.main ? '' : $('#ps').value;
    st.plan.secondDays = $$('[data-day]').filter(c => c.checked).map(c => +c.dataset.day);
    cs('lang:' + st.plan.main); if (st.plan.second) cs('lang:' + st.plan.second);
    const k = $('#gk').value.trim(); if (k !== cf.geminiKey) { cf.geminiKey = k; delete cf.noThinkCfg; delete cf.modelChains; }
    if ($('#gm').value.trim()) cf.model = $('#gm').value.trim(); else delete cf.model;
    cf.email = S.user?.email || cf.email; cf.emailHoraAula = +$('#hA').value; cf.emailsOn = $('#eon').checked; cf.pauseUntil = $('#pz').value || null;
    S.saveState(); S.saveConfig(); await S.flush(); $('#avatar').textContent = (st.profile.name || 'E')[0].toUpperCase(); toast('Ajustes salvos ✓');
  };
  import('./memoria.js?v=1').then(M => { const r = $('#memAj'); if (r) { r.innerHTML = M.memoriaHTML(S); M.ligar(r, { S, openInfo, toast }); } }).catch(() => { });
  $('#tst').onclick = async () => {
    S.config.geminiKey = $('#gk').value.trim(); if ($('#gm').value.trim()) S.config.model = $('#gm').value.trim(); else delete S.config.model;
    $('#tstm').innerHTML = '<span class="spin"></span>';
    try { const r = await AI.gen({ prompt: 'Diga "olá" em 3 idiomas. JSON: {"ok":true,"msg":"..."}', fast: true }); $('#tstm').textContent = '✓ Funcionando: ' + (r.msg || 'ok') + ' (' + S.config.model + ')'; }
    catch (e) { $('#tstm').textContent = '✗ ' + e.message; }
  };
  $('#undo1') && ($('#undo1').onclick = () => doUndo());
  $('#wipe').onclick = async () => {
    if (S.isDemo) return toast('Na demonstração não há dados para apagar.');
    if (prompt('Isso apaga TODO o seu progresso, histórico, cartões e cursos (o login continua). Para confirmar, digite APAGAR') !== 'APAGAR') return;
    await S.flush(); await S.wipe(); toast('Dados apagados. Recomeçando…'); setTimeout(() => { location.hash = ''; location.reload(); }, 900);
  };
  $('#delAcc').onclick = async () => {
    if (S.isDemo) return toast('Na demonstração não há conta para excluir.');
    if (prompt('Isso exclui sua conta e TODOS os dados para sempre, sem volta. Para confirmar, digite EXCLUIR') !== 'EXCLUIR') return;
    const { error } = await sb.rpc('delete_my_account');
    if (error) return toast('⚠️ ' + error.message, 6000);
    await sb.auth.signOut(); LS.set('pg_remember', null); location.hash = ''; location.reload();
  };
  $('#out').onclick = async () => { if (S.isDemo) return toast('Na demonstração não há conta.'); if (confirm('Sair desta conta neste aparelho? Seus dados continuam salvos.')) { await S.flush(); LS.set('ia_asst_rascunho', null); await sb.auth.signOut(); location.hash = ''; location.reload(); } };
}

// ---------- GUIA ----------
async function guia() {
  const r = await fetch('guia.html?v=' + Date.now()); app.innerHTML = `<div class="guide" style="max-width:820px">${await r.text()}</div>`;
}

// ---------- CRONOGRAMA ----------
async function cronograma() {
  const plan = S.state.plan, t = today();
  const keys = ['lang:' + plan.main, ...(plan.second ? ['lang:' + plan.second] : [])];
  const evs = await events(1);
  const didToday = evs.some(e => e.date === t && e.type === 'lesson');
  const Q = {}, info = {};
  for (const k of keys) {
    const s = cs(k), ls = lessonsOf(k);
    Q[k] = ls ? ls.filter(l => !s.done[l.id]) : Array.from({ length: C.lessonsPerLevel }, (_, i) => ({ n: lvIdx(s.level) * C.lessonsPerLevel + i + 1, title: 'tema definido quando o plano for montado' }));
    info[k] = { level: s.level, left: Q[k].length, planned: !!ls };
  }
  const secondDays = plan.second ? (plan.secondDays || []) : [];
  const nEst = getStudyDays().days.length, perWeek = { ['lang:' + plan.main]: Math.max(1, nEst - secondDays.length) };
  if (plan.second) perWeek['lang:' + plan.second] = secondDays.length;
  const weeks = {};
  for (let i = 0; i < 28; i++) {
    const day = addDays(t, i), w = weekday(day), ws = weekStart(day);
    const row = { day, items: [] };
    if (isRestDay(day)) { row.rest = true; row.items.push(holiday(day) ? `🌴 ${holiday(day)}: descanso` : '🌴 Descanso'); }
    else {
      const k = secondDays.includes(w) && plan.second ? 'lang:' + plan.second : 'lang:' + plan.main;
      const name = course(k).title;
      if (i === 0 && didToday) row.items.push('✓ Aula de hoje feita');
      else if (Q[k].length) { const l = Q[k].shift(); row.items.push(`📘 ${name} · Aula ${l.n}: ${l.title}`); }
      else if (!info[k].test) { info[k].test = true; row.items.push(`🏆 Prova do nível ${info[k].level} de ${name}`); }
      else row.items.push(`📋 ${name}: começa o próximo nível`);
      row.items.push(`◎ Revisão · 🎙 Conversação de ${convMin()} min às 20h`);
      if (w === 5) row.items.push('📝 Teste da semana');
    }
    (weeks[ws] ||= []).push(row);
  }
  app.innerHTML = `<a class="back" href="#/idiomas">Idiomas</a>
  <div class="eyebrow" style="margin-top:14px">Cronograma</div><h1 style="margin:6px 0 10px">Suas próximas 4 semanas</h1>
  <p class="muted" style="max-width:720px">O cronograma se ajusta sozinho conforme você avança. Quer mudar os dias, o ritmo, os temas ou pular alguma aula? Peça ao IAlvorecer (dá pra desfazer depois).</p>
  <div class="grid g${Math.min(keys.length + 1, 3)}" style="margin:20px 0 26px">
    ${keys.map(k => { const r = perWeek[k] || 1; const wk = Math.ceil(info[k].left / Math.max(1, r)); return `<div class="panel"><b>${esc(course(k).title)} · ${info[k].level}</b><div class="small muted" style="margin-top:6px">${r} aula(s) por semana · faltam ${info[k].left} aulas no nível<br>Prova do ${info[k].level} prevista para ~${fmtShort(addDays(t, wk * 7))}</div></div>`; }).join('')}
    <div class="panel"><b>Mudar algo?</b><div class="small muted" style="margin:6px 0 12px">Ex.: "quero espanhol às quartas", "pula a aula 90", "aulas de 15 minutos".</div><button class="btn btn-pink btn-sm" id="schAsst">✦ Pedir ao IAlvorecer</button></div>
  </div>
  ${Object.entries(weeks).map(([ws, rows], wi) => `<div class="week"><h4>${wi === 0 ? 'Esta semana' : wi === 1 ? 'Próxima semana' : 'Semana de ' + fmtShort(ws)}</h4>${rows.map(r => `<div class="dayrow ${r.rest ? 'rest' : ''} ${r.day === t ? 'today' : ''}"><div class="d">${r.day === t ? 'Hoje' : esc(parseDay(r.day))}</div><div class="it">${r.items.map(x => `<div>${esc(x)}</div>`).join('')}</div></div>`).join('')}</div>`).join('')}`;
  $('#schAsst').onclick = () => openAssistant('Quero mudar meu cronograma: ');
}
const parseDay = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }); };

// ---------- ASSISTENTE ----------
const asst = { msgs: [] };
const validKey = k => { try { return !!(k && course(k).title); } catch { return false; } };
const ctitle = k => { try { return course(k).title; } catch { return k; } };
function asstContext() {
  const st = S.state;
  const cursos = Object.entries(st.courses).map(([k, s]) => {
    if (!validKey(k)) return null;
    const ls = lessonsOf(k), nx = nextLesson(k);
    return { key: k, titulo: ctitle(k), nivel: s.level, aulas_feitas: Object.keys(s.done || {}).length, proxima: nx ? `Aula ${nx.n}: ${nx.title}` : null, proximas: ls ? ls.filter(l => !s.done[l.id]).slice(0, 8).map(l => `Aula ${l.n}: ${l.title}`) : 'plano ainda não montado' };
  }).filter(Boolean);
  return { memoria_geral: memMod ? memMod.resumo(S) : undefined, hoje: today(), perfil: st.profile, plano: st.plan, cursos, emails: { ligados: S.config.emailsOn !== false, conversacao: convCfg(), pausa_ate: S.config.pauseUntil || null }, historico_visivel_desde: st.historyFrom || 'início', alteracoes_que_podem_ser_desfeitas: (st.backups || []).length,
    areas_disponiveis: Object.entries(C.tracks).filter(([, t]) => t.area).map(([id, t]) => `${id} = ${t.name}`), area_atual: st.area || 'design', idioma_das_aulas: st.profile?.prefs?.contentLang || 'pt',
    cursos_personalizados: (st.custom || []).map(c => `cus:${c.id} = ${c.title}`),
    cursos_disponiveis: [...C.languages.map(l => `lang:${l.id} = ${l.name}`), ...C.complementary.map(c => `comp:${c.id} = ${c.title}`), ...Object.values(C.tracks).flatMap(t => t.courses.map(c => `trk:${c.id} = ${c.title}`)), ...(st.custom || []).map(c => `cus:${c.id} = ${c.title}`)] };
}
const DAYN = ['', 'seg', 'ter', 'qua', 'qui', 'sex'];
function describeAction(a) {
  switch (a.type) {
    case 'set_plan': return `Plano: ${a.main ? 'principal ' + (lang(a.main)?.name || a.main) : ''}${'second' in a ? (a.main ? ', ' : '') + 'secundário ' + (a.second ? lang(a.second)?.name || a.second : 'nenhum') : ''}${a.secondDays ? ` (dias: ${a.secondDays.map(d => DAYN[d]).join(', ') || 'nenhum'})` : ''}`;
    case 'set_level': return `${ctitle(a.course)}: mudar para o nível ${a.level}`;
    case 'set_prefs': return 'Preferências: ' + Object.entries(a).filter(([k]) => k !== 'type').map(([k, v]) => `${{ minutes: 'aula', convMinutes: 'conversação', style: 'estilo', explain: 'explicações', interests: 'interesses' }[k] || k} = ${Array.isArray(v) ? v.join(', ') : v}${/inutes/.test(k) ? ' min' : ''}`).join('; ');
    case 'emails': return `E-mails: ${a.on === false ? 'desligados' : 'ligados'}${a.evening === false ? ', sem lembrete de conversação' : a.evening === true ? ', com lembrete de conversação' : ''}${a.pauseUntil ? `, pausa até ${fmtShort(a.pauseUntil)}` : a.pauseUntil === null ? ', sem pausa' : ''}`;
    case 'skip_lessons': return `${ctitle(a.course)}: pular ${a.count} aula(s)`;
    case 'edit_lesson': return `${ctitle(a.course)}: Aula ${a.n} vira "${a.title || 'mesmo tema'}"${a.notes ? ` (foco: ${a.notes})` : ''}`;
    case 'replan_level': return `${ctitle(a.course)}: refazer as próximas aulas do nível (${a.wishes || 'novo plano'}). Aulas já feitas ficam.`;
    case 'start_course': return `Começar o curso ${ctitle(a.course)}`;
    case 'reset_course': return `Reiniciar ${ctitle(a.course)}${a.level ? ' no ' + a.level : ''} (o histórico continua salvo)`;
    case 'clear_history': return `Limpar o histórico até hoje${a.resetStats ? ', zerar estatísticas' : ''}${a.resetCards ? ', apagar cartões de memória' : ''}`;
    case 'reset_all': return 'Recomeçar tudo do zero (seu perfil fica)';
    case 'set_area': return `Área de interesse no menu: ${C.tracks[a.area]?.name || a.area}`;
    case 'set_content_lang': return `Idioma das aulas${a.course ? ' de ' + ctitle(a.course) : ' (padrão do site)'}: ${{ pt: 'português', en: 'inglês', es: 'espanhol' }[a.lang] || a.lang}`;
    case 'create_course': return `Criar o curso "${a.title}" (${(a.lessons || []).length} aulas) em Seu Alvorecer`;
    case 'delete_course': return `Excluir o curso ${ctitle(a.course)} e todo o progresso dele`;
    case 'add_language': return `Adicionar o idioma ${a.name}${a.main ? ' como principal' : ''}`;
    case 'undo': return 'Desfazer a última alteração';
    default: return a.type;
  }
}
async function snapshot(label) {
  const id = uid();
  const snap = { ts: new Date().toISOString(), label, state: JSON.parse(JSON.stringify(S.state)), srs: S.srs, config: { emailsOn: S.config.emailsOn, conversa: S.config.conversa, pauseUntil: S.config.pauseUntil || null } };
  await S.write(`backups/${id}.json`, snap);
  S.state.backups = [{ id, label, ts: snap.ts }, ...(S.state.backups || [])].slice(0, 20);
}
async function doUndo() {
  const b = (S.state.backups || [])[0];
  if (!b) return toast('Não há alterações para desfazer.');
  const snap = await S.read(`backups/${b.id}.json`);
  if (!snap) return toast('Não encontrei essa cópia de segurança.');
  const rest = S.state.backups.slice(1);
  S.state = snap.state; S.state.backups = rest; S.srs = snap.srs || [];
  Object.assign(S.config, snap.config || {});
  S.saveState(); S.saveSrs(); S.saveConfig(); await S.flush();
  toast('↶ Desfeito: ' + b.label); refreshView();
}
function refreshView() { const r = location.hash.replace(/^#\/?/, '').split('/')[0]; if (!['aula', 'conversa', 'teste', 'revisao', 'boas-vindas', 'nivelamento'].includes(r) && !(r === 'mentoria' && location.hash.includes('sessao'))) router(); }
async function applyActions(actions) {
  if (actions.length === 1 && actions[0].type === 'undo') return doUndo();
  for (const a of actions) if (a.type === 'create_course') await checkSafe(a);
  await snapshot(actions.map(describeAction).join(' · ').slice(0, 140));
  const st = S.state, P = st.profile;
  for (const a of actions) {
    if (a.course && !validKey(a.course)) continue;
    switch (a.type) {
      case 'set_plan':
        if (a.main && lang(a.main)) { st.plan.main = a.main; cs('lang:' + a.main); }
        if ('second' in a) { st.plan.second = a.second && lang(a.second) && a.second !== st.plan.main ? a.second : ''; if (st.plan.second) cs('lang:' + st.plan.second); }
        if (Array.isArray(a.secondDays)) st.plan.secondDays = a.secondDays.map(Number).filter(d => d >= 1 && d <= 5);
        if (st.plan.second && !(st.plan.secondDays || []).length) st.plan.secondDays = [2, 4];
        break;
      case 'set_level': if (C.levels.includes(a.level)) { const s = cs(a.course); s.level = a.level; s.cycle = 1; S.addEvent({ type: 'level', course: a.course, title: `Nível ajustado para ${a.level} (IAlvorecer)`, level: a.level }); } break;
      case 'set_prefs': { const { type, ...rest } = a; P.prefs = { ...(P.prefs || {}), ...rest }; break; }
      case 'emails': if ('on' in a) S.config.emailsOn = !!a.on; if ('evening' in a) S.config.conversa = { ...convCfg(), lembrete: !!a.evening }; if ('pauseUntil' in a) S.config.pauseUntil = a.pauseUntil || null; break;
      case 'skip_lessons': { const s = cs(a.course); (lessonsOf(a.course) || []).filter(l => !s.done[l.id]).slice(0, Math.max(1, +a.count || 1)).forEach(l => s.done[l.id] = { score: null, skipped: true, date: today() }); break; }
      case 'edit_lesson': { const s = cs(a.course), ls = lessonsOf(a.course) || []; const L = ls.find(l => l.n === +a.n); if (L) { if (a.title) L.outline.title = a.title; if (a.notes) L.outline.notes = a.notes; L.outline.v = (L.outline.v || 0) + 1; if (course(a.course).kind !== 'lang') { const ex = s.extra || []; } } break; }
      case 'replan_level': toast('Refazendo o plano… (uns 20 segundos)', 8000); await replanLevel(a.course, a.wishes || ''); break;
      case 'start_course': cs(a.course); break;
      case 'reset_course': { delete st.courses[a.course]; const s = cs(a.course); if (a.level && C.levels.includes(a.level)) s.level = a.level; break; }
      case 'clear_history': st.historyFrom = today(); if (a.resetStats) { st.stats = { lessons: 0, conversations: 0, reviews: 0, tests: 0, minutes: 0 }; st.streak = { count: 0, best: 0, last: null }; } if (a.resetCards) S.srs = []; break;
      case 'set_area': if (C.tracks[a.area]?.area) st.area = a.area; break;
      case 'set_content_lang': if (['pt', 'en', 'es'].includes(a.lang)) { if (a.course && validKey(a.course)) { const s = cs(a.course); s.contentLang = a.lang; delete s.inEnglish; } else P.prefs = { ...(P.prefs || {}), contentLang: a.lang }; } break;
      case 'create_course': createCustom(a); break;
      case 'delete_course': if (String(a.course).startsWith('cus:')) removeCustom(a.course); break;
      case 'add_language': { const id = addCustomLang(a.name); if (id) { cs('lang:' + id); if (a.main) st.plan.main = id; } break; }
      case 'reset_all': { const keep = { profile: st.profile, onboarded: st.onboarded, backups: st.backups, career: st.career }; S.state = { ...defaultState(C), ...keep, historyFrom: today() }; S.srs = []; break; }
    }
  }
  S.saveState(); S.saveSrs(); S.saveConfig(); await S.flush();
  refreshView();
}
// Personalização visual por conta: o que vale agora (cores e site) e os saves (até 5 de cada) ficam em state.visual
function visualConta() {
  const P = window.IAPers, T = window.IATema;
  window.IAConta = {
    readonly: !!S.readonly,
    ler: () => S.state.visual || null,
    gravar(fn) { if (S.readonly) return false; const v = S.state.visual = S.state.visual || { saves: { pers: [], tema: [] } }; fn(v); S.saveState(); return true; }
  };
  let trava = true;
  const v = S.state.visual;
  try {
    if (v && 'pers' in v && P) { v.pers ? P.gravar(v.pers) : P.padrao(); P.tudo(); }
    if (v && 'tema' in v && T) { if (!v.tema) T.restaurar(); else if (v.tema.id === 'custom') T.usarPersonalizado(v.tema.c); else T.usarPreset(v.tema.id); }
  } catch { }
  trava = false;
  const sync = tipo => {
    if (trava || S.readonly) return;
    IAConta.gravar(x => {
      if (tipo === 'pers') { let tem = null; try { tem = localStorage.getItem('ia_pers'); } catch { } x.pers = tem ? P.ler() : null; }
      else { const a = T.atual(); x.tema = a.id === 'morning' ? null : a; }
    });
  };
  window.addEventListener('ia-pers', () => sync('pers'));
  window.addEventListener('ia-tema', () => sync('tema'));
}
let memMod; // memória geral (arquivo à parte), carregada quando o assistente abre
const carregaMem = () => memMod ? Promise.resolve(memMod) : import('./memoria.js?v=1').then(m => memMod = m).catch(() => null);
let vozMod; // arquivo à parte: só carrega quando a pessoa clica no botão de voz
async function abrirVozAssistente() {
  await carregaMem();
  try { vozMod ||= await import('./voz.js?v=69'); } catch { return toast('Não consegui abrir o assistente de voz agora. Tente de novo.'); }
  vozMod.abrirVoz({ C, S, AI, esc, md, toast, asstContext, applyActions, describeAction });
}
function closeAssistant() { $('#asst')?.remove(); if (asst.onKey) { document.removeEventListener('keydown', asst.onKey); asst.onKey = null; } }
function toggleAssistant() { if ($('#asst')) { closeAssistant(); return; } openAssistant(); }
function openAssistant(prefill = '') {
  carregaMem();
  if (!$('#asst')) {
    document.body.insertAdjacentHTML('beforeend', `<div class="asst" id="asst"><div class="asst-h"><span class="avatar" style="width:36px;height:36px">✦</span><div><b>IAlvorecer</b><div class="small muted">Faz de tudo para dar certo: tira dúvidas, planeja e ajusta seus estudos</div></div><span class="spacer"></span><button class="iconbtn" id="asstUndo" title="Desfazer a última alteração">↶</button><button class="iconbtn" id="asstX" title="Fechar">✕</button></div><div class="asst-m" id="asstM"></div><div class="asst-c"><textarea id="asstT" rows="1" placeholder="Pergunte ou peça uma mudança…"></textarea><button id="asstS">➤</button></div></div>`);
    $('#asstX').onclick = e => { e.stopPropagation(); closeAssistant(); };
    asst.onKey = e => { if (e.key === 'Escape' && $('#asst')) closeAssistant(); };
    document.addEventListener('keydown', asst.onKey);
    import('./asst-rascunho.js?v=1').then(R => { if ($('#asstT')) asst.rasc = R.iniciarRascunho({ ta: $('#asstT'), prefill }); }).catch(() => { });
    $('#asstUndo').onclick = () => doUndo();
    $('#asstS').onclick = asstSend;
    $('#asstT').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); asstSend(); } };
    if (!asst.msgs.length) asst.msgs.push({ role: 'ai', text: `Oi${S.state.profile.name ? ', ' + S.state.profile.name : ''}! Posso tirar dúvidas sobre o IAlvorecer ou mudar seus estudos: cronograma, dias, nível, temas das aulas, e-mails… Tudo o que eu mudar pode ser desfeito no botão ↶.`, sugs: ['Mudar os dias do meu cronograma', 'Quero aulas de 15 minutos', 'Pausar e-mails até segunda', 'Como funciona a prova de nível?', 'Reiniciar o curso de inglês'] });
    asstRender();
  }
  if (prefill && !LS.get('ia_asst_rascunho')) { const t = $('#asstT'); t.value = prefill; t.focus(); t.setSelectionRange(prefill.length, prefill.length); }
}
function asstRender() {
  const box = $('#asstM'); if (!box) return;
  box.innerHTML = asst.msgs.map((m, i) => {
    if (m.role === 'me') return `<div class="msg me">${esc(m.text)}</div>`;
    if (m.role === 'typing') return '<div class="typing">Pensando…</div>';
    return `<div class="msg ai">${esc(m.text)}</div>${m.sugs ? `<div class="sugs">${m.sugs.map(s => `<button data-sug="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}${m.actions?.length ? `<div class="act"><b>${m.applied ? '✓ Feito' : m.canceled ? 'Cancelado' : 'Posso fazer isto:'}</b><ul>${m.actions.map(a => `<li>${esc(describeAction(a))}</li>`).join('')}</ul>${m.applied ? `<button class="btn btn-ghost btn-sm" data-undo="${i}">↶ Desfazer</button>` : m.canceled ? '' : `<div class="row"><button class="btn btn-pink btn-sm" data-apply="${i}">Aplicar</button><button class="btn btn-ghost btn-sm" data-cancel="${i}">Cancelar</button></div>`}</div>` : ''}`;
  }).join('');
  box.scrollTop = box.scrollHeight;
  $$('[data-sug]', box).forEach(b => b.onclick = () => { $('#asstT').value = b.dataset.sug; asstSend(); });
  $$('[data-apply]', box).forEach(b => b.onclick = async () => { const m = asst.msgs[+b.dataset.apply]; b.disabled = true; b.innerHTML = '<span class="spin"></span>'; try { await applyActions(m.actions); m.applied = true; toast('Alteração aplicada ✓'); } catch (e) { toast('⚠️ ' + e.message, 6000); } asstRender(); });
  $$('[data-cancel]', box).forEach(b => b.onclick = () => { asst.msgs[+b.dataset.cancel].canceled = true; asstRender(); });
  $$('[data-undo]', box).forEach(b => b.onclick = async () => { await doUndo(); asst.msgs[+b.dataset.undo].applied = false; asst.msgs[+b.dataset.undo].canceled = true; asstRender(); });
}
async function asstSend() {
  const t = $('#asstT'), text = t.value.trim(); if (!text) return;
  if (S.readonly) { t.value = ''; asst.msgs.push({ role: 'me', text }, { role: 'ai', text: 'No modo visitante dá pra explorar tudo, mas para conversar comigo, fazer aulas e salvar seu progresso é preciso criar uma conta grátis. É rapidinho!' }); return asstRender(); }
  t.value = ''; asst.rasc?.depoisDeEnviar(); asst.msgs.forEach(m => delete m.sugs);
  asst.msgs.push({ role: 'me', text }); asst.msgs.push({ role: 'typing' }); asstRender();
  try {
    const hist = asst.msgs.filter(m => m.role === 'me' || m.role === 'ai').slice(-16);
    const r = await AI.assistant({ history: hist, context: asstContext() });
    asst.msgs = asst.msgs.filter(m => m.role !== 'typing');
    const acts = (r.actions || []).filter(a => a && a.type);
    const go = acts.find(a => a.type === 'open_page');
    const PAGES = { cuidar: '#/cuidar', desabafo: '#/cuidar/desabafo', alimentacao: '#/cuidar/alimentacao', treino: '#/cuidar/treino', sobre: '#/sobre', apoiar: '#/apoiar', mentoria_sessao: '#/mentoria/sessao', mentoria: '#/mentoria', cronograma: '#/cronograma', seu: '#/seu', ajustes: '#/ajustes', historico: '#/historico', idiomas: '#/idiomas', memorizacao: '#/memorizacao' };
    asst.msgs.push({ role: 'ai', text: r.reply || 'Certo!', actions: acts.filter(a => a.type !== 'open_page') });
    if (go && PAGES[go.page]) { location.hash = PAGES[go.page]; if (go.page === 'mentoria_sessao') closeAssistant(); }
  } catch (e) { asst.msgs = asst.msgs.filter(m => m.role !== 'typing'); asst.msgs.push({ role: 'ai', text: '⚠️ ' + e.message }); }
  asstRender();
}

// ---------- SEU ALVORECER (cursos personalizados) ----------
const BLOCK = /(porn|sexo|sexual|erotic|nude|nudez|fetiche|onlyfans|\+ ?18|cocaina|heroina|metanfetamina|arma de fogo|armas caseiras|explosiv|bomba caseira|hackear|invadir conta|invasao de sistema|malware|ransomware|clonar cartao|lavagem de dinheiro|falsifica|sonegar|pirataria|cassino|apostas esportivas|tigrinho|assassin|suicid|automutil|nazis|terroris)/;
const CUS_G = [['#5eead4', '#0ea5e9'], ['#86efac', '#0d9488'], ['#7dd3fc', '#6366f1'], ['#a7f3d0', '#2563eb'], ['#99f6e4', '#7c3aed'], ['#bbf7d0', '#0369a1']];
async function checkSafe(a) {
  const text = [a.title, a.sub, a.ctx, ...(a.lessons || [])].join(' | ');
  const plain = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (BLOCK.test(plain)) throw new Error('Esse curso não pode ser criado: o IAlvorecer só permite conteúdo educativo, seguro e legal.');
  const r = await AI.moderate({ text });
  if (r && r.allowed === false) throw new Error('Esse curso não pode ser criado: ' + (r.reason || 'conteúdo não permitido.'));
}
function createCustom(a) {
  const id = uid(), lessons = (a.lessons || []).map(String).filter(Boolean).slice(0, 24);
  if (lessons.length < 3) throw new Error('O curso precisa de pelo menos 3 aulas.');
  S.state.custom = [...(S.state.custom || []), { id, title: String(a.title || 'Meu curso').slice(0, 80), sub: String(a.sub || '').slice(0, 120), icon: a.icon || '✦', lessons, ctx: String(a.ctx || '').slice(0, 800), g: CUS_G[Math.floor(Math.random() * CUS_G.length)], pat: ['dots', 'grid', 'rings', 'diag', 'blob', 'waves'][Math.floor(Math.random() * 6)], created: today() }];
  cs('cus:' + id);
  return 'cus:' + id;
}
function removeCustom(key) {
  const id = key.slice(4);
  S.state.custom = (S.state.custom || []).filter(c => c.id !== id);
  delete S.state.courses[key];
  S.state.hiddenCourses = [...new Set([...(S.state.hiddenCourses || []), key])];
  S.srs = S.srs.filter(c => c.course !== key);
}
async function deleteCustom(key) {
  if (S.readonly) return toast('Modo visitante: crie sua conta para personalizar.');
  if (!confirm(`Excluir "${ctitle(key)}" e todo o progresso dele, como se nunca tivesse existido? (Dá pra desfazer em Ajustes ou falando com o IAlvorecer.)`)) return;
  await snapshot('Excluir o curso ' + ctitle(key));
  removeCustom(key);
  S.saveState(); S.saveSrs(); await S.flush();
  toast('Curso excluído'); if (location.hash.includes(key)) location.hash = '#/seu'; else refreshView();
}
async function seu() {
  const list = (S.state.custom || []).map(c => 'cus:' + c.id);
  const ideas = ['Fotografia com celular', 'Excel do zero', 'Libras básico', 'Violão para iniciantes', 'Canva para redes sociais', 'Oratória para tímidos', 'Organização da casa', 'Primeiros socorros (noções)'];
  app.innerHTML = `<div class="eyebrow">Seu Alvorecer</div><h1 style="margin:6px 0 10px">Cursos feitos sob medida para você</h1>
  <p class="muted" style="max-width:760px">Quer aprender algo que não está no catálogo? Peça ao IAlvorecer (ex.: "quero um curso de fotografia com celular"). Ele monta o curso com aulas do básico ao avançado, e você estuda igual aos outros: aulas, exercícios corrigidos, conversa com o mentor, progresso e histórico. Pode excluir quando quiser, como se nunca tivesse pedido.</p>
  <p class="small dim" style="margin-top:8px">Por segurança, o IAlvorecer não cria cursos com conteúdo adulto (+18), perigoso, ilegal ou antiético.</p>
  <a class="cta-band" href="#/cuidar" style="margin-top:26px"><span class="ci">${ic('heart-handshake')}</span><div style="flex:1;min-width:220px"><h3 style="font-size:21px">Cuidar de mim</h3><p class="muted" style="margin:6px 0 0">Desabafo, alimentação, água e treino, sempre com o IAlvorecer. Apoio gratuito, com carinho e honestidade.</p></div><span class="btn btn-pink">Abrir</span></a>
  <div class="row" style="margin:28px 0 6px"><button class="btn btn-pink" id="newCus">✦ Pedir um curso novo</button></div>
  ${list.length ? `<div class="section"><div class="cards">${list.map(k => cardHTML(k)).join('')}</div></div>` : `<div class="section panel"><h3>Ideias para começar</h3><div class="sugs" style="margin-top:12px">${ideas.map(i => `<button data-idea="${esc(i)}">${esc(i)}</button>`).join('')}</div></div>`}`;
  $('#newCus').onclick = () => openAssistant('Quero um curso de ');
  $$('[data-idea]').forEach(b => b.onclick = () => { openAssistant(`Quero um curso de ${b.dataset.idea}`); });
  $$('[data-del]').forEach(b => b.onclick = e => { e.preventDefault(); e.stopPropagation(); deleteCustom(b.dataset.del); });
}
const jobLinks = j => {
  const q = encodeURIComponent(j.palavras || j.titulo || ''), loc = encodeURIComponent(j.local || '');
  const L = [['LinkedIn', `https://www.linkedin.com/jobs/search/?keywords=${q}${j.local ? `&location=${loc}` : ''}${j.remoto ? '&f_WT=2' : ''}`]];
  if (j.internacional) L.push(['We Work Remotely', `https://weworkremotely.com/remote-jobs/search?term=${q}`], ['Indeed (EUA)', `https://www.indeed.com/jobs?q=${q}&l=${j.remoto ? 'Remote' : loc}`]);
  else L.push(['Gupy', `https://portal.gupy.io/job-search/term=${q}`], ['Indeed', `https://br.indeed.com/empregos?q=${q}${j.remoto ? '+remoto' : ''}`]);
  L.push(['Google Vagas', `https://www.google.com/search?q=${q}+${j.remoto ? 'remoto' : loc}+vagas&ibp=htl;jobs`]);
  return L;
};

// ---------- MENTORIA DE CARREIRA ----------
async function mentoria(sub) {
  if (sub === 'sessao') return mentorSession();
  const cr = S.state.career || {};
  const pl = cr.plan, pf = cr.profile || {};
  const draft = await S.read('conversas/mentoria-rascunho.json');
  const hasDraft = !!draft?.history?.length;
  app.innerHTML = `<div class="eyebrow">Mentoria de carreira</div><h1 style="margin:6px 0 10px">Seu caminho profissional</h1>
  <p class="muted" style="max-width:720px">Converse com o IAlvorecer sobre onde você está, o salário que quer e seus sonhos. A cada sessão ele atualiza o seu plano: o passo possível agora, o próximo e o sonho lá na frente.</p>
  <div class="row" style="margin:18px 0 26px"><a class="btn btn-pink" href="#/mentoria/sessao">${hasDraft ? `💬 Continuar a conversa de ${fmtShort(draft.started || today())}` : `🧭 ${pl ? 'Nova sessão de mentoria' : 'Começar primeira sessão'}`}</a>${hasDraft ? '<span class="small muted" style="align-self:center">Sua conversa fica salva: pode fechar e voltar outro dia.</span>' : ''}</div>
  ${pl ? `
  <div class="grid g3">
    <div class="area pat-dots" style="background:linear-gradient(150deg,#2dd4bf,#0ea5e9);min-height:170px"><div class="small" style="opacity:.9">AGORA (próximos meses)</div><h3 style="font-size:19px">${esc(pl.agora || '')}</h3></div>
    <div class="area pat-grid" style="background:linear-gradient(150deg,#38bdf8,#6366f1);min-height:170px"><div class="small" style="opacity:.9">EM 1–2 ANOS</div><h3 style="font-size:19px">${esc(pl.medio || '')}</h3></div>
    <div class="area pat-rings" style="background:linear-gradient(150deg,#fbbf24,#14b8a6);min-height:170px"><div class="small" style="opacity:.9">O SONHO</div><h3 style="font-size:19px">${esc(pl.longo || pf.sonho || '')}</h3></div>
  </div>
  <div class="grid g2 section">
    <div class="panel"><h3>Estratégia</h3><p style="margin-top:10px">${esc(pl.estrategia || '')}</p>
      ${pf.salarioAtual || pf.salarioMeta ? `<div class="stats" style="margin-top:14px"><div class="stat"><b style="font-size:18px">${esc(pf.salarioAtual || '—')}</b><span>salário hoje</span></div><div class="stat"><b style="font-size:18px">${esc(pf.salarioMeta || '—')}</b><span>meta</span></div></div>` : ''}</div>
    <div class="panel"><h3>Esta semana</h3><ul style="margin-top:10px;padding-left:18px">${(cr.weekly || []).map(x => `<li style="margin:6px 0">${esc(x)}</li>`).join('')}</ul></div>
  </div>
  <div class="panel section"><h3>Sobre você</h3><div class="grid g3" style="margin-top:12px">${[['Quer trabalhar com', pf.areaDesejada], ['Experiência', pf.experiencia || pf.atual], ['Medos e desafios', pf.medos]].map(([l, v]) => `<div><div class="small dim">${l}</div><div>${esc(v || '— conte ao IAlvorecer na próxima sessão')}</div></div>`).join('')}</div></div>
  <div class="section"><div class="section-head"><h2>Próximos passos</h2><span class="small dim">marque o que for fazendo</span></div>
    <div class="today">${(cr.steps || []).map((s, i) => `<button class="task ${s.done ? 'done' : ''}" data-step="${i}" style="text-align:left;width:100%"><span class="ck">${s.done ? '✓' : ''}</span><span class="t">${esc(s.t)}</span></button>`).join('')}</div></div>
  ${(cr.courses || []).filter(validKey).length ? `<div class="section"><div class="section-head"><h2>Cursos recomendados para você</h2></div><div class="cards">${cr.courses.filter(validKey).map(k => cardHTML(k, true)).join('')}</div></div>` : ''}
  ${jobsAndLinkedIn(cr)}
  ${(cr.sessions || []).length ? `<div class="section"><div class="section-head"><h2>Sessões</h2></div>${cr.sessions.map(s => `<div class="ev"><b>${esc(fmtDay(s.date))}</b><p class="small muted" style="margin-top:6px">${esc(s.summary || '')}</p>${s.convoId ? `<button class="btn btn-ghost btn-sm" data-mcv="${esc(s.convoId)}" style="margin-top:8px">💬 Ver a conversa</button><div data-mbox="${esc(s.convoId)}"></div>` : ''}</div>`).join('')}</div>` : ''}` : `
  <div class="grid g3">
    <div class="how"><div class="step"><b>1</b><h4>Onde você está</h4><p>Trabalho atual, experiência, salário e o que você já sabe fazer.</p></div></div>
    <div class="how"><div class="step"><b>2</b><h4>Aonde quer chegar</h4><p>Salário desejado, tipo de trabalho e sonhos (como morar nos EUA ou no Japão).</p></div></div>
    <div class="how"><div class="step"><b>3</b><h4>O plano em etapas</h4><p>O passo realista agora (ex.: home office ganhando melhor) e o caminho até o sonho.</p></div></div>
  </div>`}${pl ? '' : jobsAndLinkedIn(cr)}`;
  $$('[data-step]').forEach(b => b.onclick = () => { const s = cr.steps[+b.dataset.step]; s.done = !s.done; S.state.career = cr; S.saveState(); mentoria(); });
  bindLinkedIn(cr);
  $$('[data-mcv]').forEach(b => b.onclick = async () => { const box = $(`[data-mbox="${b.dataset.mcv}"]`); box.innerHTML = '<span class="spin"></span>'; const c = await S.getConvo(b.dataset.mcv); box.innerHTML = c ? `<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">${c.history.map(m => `<div class="msg ${m.role}" style="max-width:100%">${esc(m.text)}</div>`).join('')}</div>` : '<p class="small muted">Conversa não encontrada.</p>'; b.remove(); });
}
function lockedHTML() {
  return `<div class="lock panel"><div class="ci">🔒</div><h2>Crie sua conta grátis para começar</h2><p class="muted" style="margin:12px 0 24px">No modo visitante você explora o IAlvorecer à vontade. Para fazer aulas, conversar, revisar e salvar seu progresso, é só criar uma conta.</p><div class="row" style="justify-content:center"><a class="btn btn-pink" href="./">Criar minha conta</a><button class="btn btn-ghost" data-back>Continuar visitando</button></div></div>`;
}
function openInfo(html) {
  document.querySelector('.modal-ov')?.remove();
  document.body.insertAdjacentHTML('beforeend', `<div class="modal-ov"><div class="modal-box"><button class="iconbtn x">✕</button>${html}</div></div>`);
  const ov = document.querySelector('.modal-ov');
  ov.onclick = e => { if (e.target === ov || e.target.closest('.x') || e.target.closest('[data-close]')) ov.remove(); };
  return ov;
}
function comoEntrar() {
  const dentro = !$('#topbar').hidden;
  openInfo(`<div class="eyebrow">Como entrar</div><h2 style="margin:10px 0 8px">Seu primeiro acesso ao IAlvorecer</h2><p class="muted">Você escolhe o jeito que preferir. Não precisa instalar nada.</p>
    <div class="msteps">
      <div class="mstep"><b>1</b><div><strong>Só quer conhecer?</strong><div class="small muted">Toque em Visitar o IAlvorecer e explore sem criar conta.</div></div></div>
      <div class="mstep"><b>2</b><div><strong>Criar conta grátis</strong><div class="small muted">Use um e-mail e uma senha (mínimo 8 caracteres). Depois, abra o link de confirmação que chega no seu e-mail (veja também o spam).</div></div></div>
      <div class="mstep"><b>3</b><div><strong>Já tem conta?</strong><div class="small muted">Toque em Entrar com e-mail e use o mesmo e-mail e senha. Esqueceu a senha? Use "Esqueci minha senha".</div></div></div>
    </div>
    <p class="small dim">O passo a passo completo, com fotos, está no Guia.</p>
    <div class="row" style="margin-top:20px"><a class="btn btn-pink" href="${dentro ? '#/guia' : '?visita=1#/guia'}" data-close>Abrir o guia completo</a></div>`);
}
function seuInfo() {
  const ov = openInfo(`<div class="eyebrow">Seu Alvorecer</div><h2 style="margin:10px 0 8px">Cursos feitos sob medida para você</h2><p class="muted">Não achou o que queria aprender? O IAlvorecer cria um curso completo só para você.</p>
    <div class="msteps">
      <div class="mstep"><b>1</b><div><strong>Peça ao IAlvorecer</strong><div class="small muted">Ex.: "quero um curso de Excel do zero" ou "fotografia com celular".</div></div></div>
      <div class="mstep"><b>2</b><div><strong>Confira e aplique</strong><div class="small muted">Ele mostra as aulas, do básico ao avançado. Você clica em Aplicar (e pode desfazer).</div></div></div>
      <div class="mstep"><b>3</b><div><strong>Estude como qualquer curso</strong><div class="small muted">Aulas, exercícios corrigidos, conversa, progresso e histórico, tudo salvo em Seu Alvorecer.</div></div></div>
    </div>
    <p class="small dim">Por segurança, nunca são criados cursos com conteúdo adulto, perigoso, ilegal ou antiético.</p>
    <div class="row" style="margin-top:20px"><button class="btn btn-pink" id="miAsk">✦ Pedir um curso</button><a class="btn btn-ghost" href="#/seu" data-close>Ver Seu Alvorecer</a></div>`);
  ov.querySelector('#miAsk').onclick = () => { ov.remove(); openAssistant('Quero um curso de '); };
}
function jobsAndLinkedIn(cr) {
  const li = cr.linkedin || {};
  return `<div class="section"><div class="section-head"><h2>Vagas para você</h2><button class="btn btn-ghost btn-sm" id="jobsUp">↻ Atualizar sugestões</button></div>
    ${(cr.jobs || []).length ? `<div class="jobs">${cr.jobs.map(j => `<div class="job"><b>${esc(j.titulo)}</b><div class="small muted">${esc(j.porque || '')}</div><div class="links">${jobLinks(j).map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${n} ↗</a>`).join('')}</div></div>`).join('')}</div>` : '<div class="empty">Faça uma sessão de mentoria (ou cole seu LinkedIn abaixo) e clique em "Atualizar sugestões" para ver buscas de vagas feitas para você.</div>'}
    <p class="small dim" style="margin-top:8px">Os links abrem buscas prontas nos sites de vagas. O IAlvorecer não se conecta direto ao LinkedIn (o LinkedIn não permite), então as vagas são sempre as atuais de cada site.</p></div>
  <div class="section panel"><h3>Seu LinkedIn (opcional)</h3><p class="small muted" style="margin:6px 0 14px">Para o IAlvorecer e as sugestões de vagas ficarem mais certeiras: no LinkedIn, abra seu perfil → <b>Mais</b> → <b>Salvar como PDF</b>, abra o PDF, copie o texto e cole aqui (ou copie as seções Sobre, Experiência e Competências).</p>
    <div class="field"><label>Link do seu perfil</label><input id="liUrl" value="${esc(li.url || '')}" placeholder="https://www.linkedin.com/in/…"></div>
    <div class="field"><label>Texto do perfil</label><textarea id="liTxt" rows="5" placeholder="Cole aqui…">${esc(li.text || '')}</textarea></div>
    <button class="btn btn-ghost btn-sm" id="liSave">Salvar LinkedIn</button>${li.text ? ' <span class="small dim">✓ salvo, o IAlvorecer já usa</span>' : ''}</div>`;
}
function bindLinkedIn(cr) {
  $('#liSave') && ($('#liSave').onclick = () => { cr.linkedin = { url: $('#liUrl').value.trim(), text: $('#liTxt').value.trim().slice(0, 8000), saved: today() }; S.state.career = cr; S.saveState(); toast('LinkedIn salvo ✓'); mentoria(); });
  $('#jobsUp') && ($('#jobsUp').onclick = async e => {
    e.target.disabled = true; e.target.innerHTML = '<span class="spin"></span> Buscando…';
    try { const r = await AI.jobSearches({ career: { profile: cr.profile, plan: cr.plan, linkedin: cr.linkedin?.text?.slice(0, 4000), area: S.state.profile.area } }); cr.jobs = r.jobs || []; S.state.career = cr; S.saveState(); mentoria(); }
    catch (er) { toast('⚠️ ' + er.message, 6000); e.target.disabled = false; e.target.textContent = '↻ Atualizar sugestões'; }
  });
}
async function mentorSession() {
  const cr = S.state.career || {};
  const DRAFT = 'conversas/mentoria-rascunho.json';
  const draft = await S.read(DRAFT);
  const langs = Object.entries(S.state.courses).filter(([k]) => k.startsWith('lang:')).map(([k, s]) => `${ctitle(k)} ${s.level}`).join(', ');
  const system = AI.mentorSystem({ career: { profile: cr.profile, plan: cr.plan, steps: (cr.steps || []).map(s => s.t), linkedin: cr.linkedin?.text?.slice(0, 4000), sessoes_anteriores: (cr.sessions || []).slice(0, 5).map(s => `${s.date}: ${s.summary}`) }, langs });
  const hist = draft?.history?.length ? draft.history : [];
  const started = (hist.length && draft.started) || today();
  const t0 = Date.now(); let stopMic = null, busy = false, ended = false;
  const voice = { on: LS.get('pg_mvoice') === '1' };
  app.innerHTML = `<div class="chat">
    <div class="chat-top"><div class="avatar" style="width:42px;height:42px">IA</div><div><b>IAlvorecer</b><div class="small muted">${hist.length ? `Continuando a conversa de ${fmtShort(started)}` : 'Mentoria de carreira · nova sessão'}</div></div><div class="spacer"></div><label class="check small"><input type="checkbox" id="mv" ${voice.on ? 'checked' : ''}> voz</label><a class="btn btn-ghost btn-sm" href="#/mentoria" title="A conversa fica salva">Salvar e sair</a><button class="btn btn-pink btn-sm" id="end">Encerrar e atualizar plano</button></div>
    <div class="msgs" id="msgs"></div>
    <div class="composer">${canListen ? '<button class="mic" id="mic" title="Falar">🎙</button>' : ''}<textarea id="txt" rows="1" placeholder="Escreva ou fale…"></textarea><button class="send" id="send">➤</button></div></div>`;
  const msgs = $('#msgs'), txt = $('#txt');
  cleanup = () => { stopMic?.(); stopSpeaking(); };
  const saveDraft = () => S.write(DRAFT, { started, updated: new Date().toISOString(), history: hist });
  $('#mv').onchange = e => { voice.on = e.target.checked; LS.set('pg_mvoice', voice.on ? '1' : '0'); if (!voice.on) stopSpeaking(); };
  const add = (role, text) => { const d = document.createElement('div'); d.className = 'msg ' + role; d.textContent = text; msgs.append(d); msgs.scrollTop = msgs.scrollHeight; };
  hist.forEach(m => add(m.role, m.text));
  async function turn() {
    busy = true; const ty = document.createElement('div'); ty.className = 'typing'; ty.textContent = 'O IAlvorecer está pensando…'; msgs.append(ty);
    try { const r = await AI.chat({ system, history: hist.slice(-30) }); ty.remove(); hist.push({ role: 'ai', text: r.reply || '…' }); add('ai', r.reply || '…'); saveDraft(); if (voice.on) speak(r.reply, 'pt-BR'); }
    catch (e) { ty.remove(); add('ai', '⚠️ ' + e.message); }
    busy = false;
  }
  async function send() { const t = txt.value.trim(); if (!t || busy || ended) return; stopMic?.(); stopMic = null; $('#mic')?.classList.remove('rec'); txt.value = ''; hist.push({ role: 'me', text: t }); add('me', t); saveDraft(); await turn(); }
  $('#send').onclick = send;
  txt.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  $('#mic') && ($('#mic').onclick = () => {
    if (stopMic) { stopMic(); stopMic = null; $('#mic').classList.remove('rec'); setTimeout(send, 250); return; }
    stopSpeaking(); const base = txt.value ? txt.value + ' ' : ''; $('#mic').classList.add('rec');
    stopMic = listen('pt-BR', { onText: (f, i) => txt.value = base + f + (i ? ' ' + i : ''), onError: m => { toast(m); $('#mic')?.classList.remove('rec'); stopMic = null; } });
  });
  $('#end').onclick = async () => {
    if (ended) return; ended = true; cleanup();
    if (hist.filter(m => m.role === 'me').length < 2) { toast('Converse um pouco mais antes de encerrar (a conversa fica salva).'); ended = false; return; }
    app.innerHTML = spinner('Atualizando seu plano de carreira…');
    try {
      const r = await AI.mentorUpdate({ transcript: hist.map(m => `${m.role === 'me' ? 'ALUNA' : 'IALVORECER'}: ${m.text}`), career: { profile: cr.profile, plan: cr.plan, steps: (cr.steps || []).map(s => s.t), linkedin: cr.linkedin?.text?.slice(0, 4000) } });
      const old = cr.steps || [];
      const nsteps = (r.steps || []).map(t => ({ t, done: !!old.find(o => norm(o.t) === norm(t))?.done }));
      const cid = `${today()}-mentoria-${uid()}`;
      S.putConvo(cid, { id: cid, type: 'mentoria', date: started, history: hist, report: r });
      S.state.career = { ...cr, profile: { ...(cr.profile || {}), ...(r.profile || {}) }, plan: r.plan || cr.plan, steps: [...nsteps, ...old.filter(o => o.done && !nsteps.some(n => norm(n.t) === norm(o.t)))], weekly: r.weekly || cr.weekly, jobs: r.jobs?.length ? r.jobs : cr.jobs, courses: (r.courses || []).filter(validKey), sessions: [{ date: started, summary: r.summary, convoId: cid }, ...(cr.sessions || [])] };
      touchStreak(); S.saveState(); S.write(DRAFT, { history: [] });
      await S.addEvent({ type: 'mentoria', title: 'Sessão de mentoria de carreira', summary: r.summary, convoId: cid, minutes: Math.max(1, Math.round((Date.now() - t0) / 60000)) });
      location.hash = '#/mentoria';
    } catch (e) { app.innerHTML = errBox(e); }
  };
  if (!hist.length) turn();
}

// ---------- USO DE IA: medidor, explicação e conectar a própria IA ----------
const CUSTOS = [
  ['Cada mensagem numa conversa', '1 uso', '💬'], ['Criar uma aula nova', '1 uso', '📘'], ['Corrigir exercícios', '1 uso', '✏️'], ['Foto do prato', '1 uso', '📷'],
  ['Relatório ao encerrar uma conversa', '1 uso', '📝'], ['Plano alimentar, treino ou plano de nível', '1 uso', '📋'], ['Teste de nivelamento ou da semana', '1–2 usos', '🧪'],
  ['Aula de curso que já está pronta', 'grátis', '⭐'], ['Revisar cartões, ver histórico e cronograma', 'grátis', '◎']
];
function iaMeterHTML() {
  if (S?.config?.geminiKey && !S.isDemo) return `<div class="ia-meter"><div class="row"><b>✓ Usando a sua própria IA</b></div><div class="small muted" style="margin-top:6px">Sem o limite do site. Os usos contam na sua cota grátis do Google.</div></div>`;
  const n = Math.min(S?.iaUso?.n || 0, LIMITE_IA), pct = Math.round(n / LIMITE_IA * 100), resto = LIMITE_IA - n;
  return `<div class="ia-meter"><div class="row"><b style="font-size:26px;font-family:var(--h)">${resto}</b><span class="muted small" style="align-self:end;margin-bottom:5px">usos disponíveis hoje</span><span class="spacer"></span><span class="small dim">${n} de ${LIMITE_IA} usados</span></div>
    <div class="progress" style="margin-top:10px;background:rgba(255,255,255,.08)"><i style="width:${pct}%;background:${pct > 85 ? 'linear-gradient(90deg,#ffc876,#ff7a85)' : 'linear-gradient(90deg,var(--mint),var(--sky))'}"></i></div>${S?.isDemo ? '<div class="small dim" style="margin-top:6px">(exemplo)</div>' : ''}</div>`;
}
function iaInfo(foco) {
  const ov = openInfo(`<div class="eyebrow">Sua IA</div><h2 style="margin:10px 0 8px">Como funciona o seu limite de IA</h2>
    <p class="muted">O IAlvorecer usa uma IA de verdade (o Gemini, do Google) para criar aulas, corrigir, conversar e cuidar de você. Ela é <b>gratuita para todo mundo</b>, mas tem um limite de uso por dia que é dividido entre todas as pessoas. Por isso cada conta tem <b>${LIMITE_IA} usos por dia</b>, que renovam à meia-noite.</p>
    <div class="panel" style="margin:18px 0;padding:20px">${iaMeterHTML()}</div>
    <h3>O que gasta mais e o que gasta menos</h3>
    <div style="margin:10px 0 6px">${CUSTOS.map(([a, c, i]) => `<div class="row small" style="padding:8px 0;border-bottom:1px solid var(--line)"><span>${i} ${a}</span><span class="spacer"></span><b>${c}</b></div>`).join('')}</div>
    <p class="small muted" style="margin-bottom:20px">💡 O que mais gasta são as <b>conversas</b>, porque cada mensagem conta. Uma conversa de 30 minutos usa uns 20 a 30. Dica: mande mensagens mais completas em vez de várias curtinhas.</p>
    <div id="conectar"><h3>Quer usar mais? Conecte a sua própria IA (grátis)</h3>
    <p class="small muted" style="margin:8px 0 14px">Com a sua própria chave do Gemini, você usa a sua cota grátis do Google em vez da do site, sem o limite de ${LIMITE_IA} por dia. <b>A IA continua igualzinha</b>: carinhosa, honesta e com o mesmo jeito do IAlvorecer, porque todas as instruções de como ela deve agir são do site, não da chave.</p>
    <div class="msteps">
      <div class="mstep"><b>1</b><div><strong>Abra o Google AI Studio</strong><div class="small muted">Entre com a sua conta Google (a mesma do Gmail). <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--mint)">Abrir aistudio.google.com/apikey ↗</a></div></div></div>
      <div class="mstep"><b>2</b><div><strong>Crie a chave</strong><div class="small muted">Clique em <b>Create API key</b> (ou "Criar chave de API"), aceite os termos se pedir e copie a chave (ela pode começar com <code>AIza</code> ou <code>AQ.</code>).</div></div></div>
      <div class="mstep"><b>3</b><div><strong>Cole aqui e pronto</strong><div class="small muted">Ela fica salva só na sua conta. Para voltar ao limite do site, é só apagar.</div></div></div>
    </div>
    <div class="row"><input id="ik" type="password" placeholder="Cole sua chave aqui" value="${S?.isDemo ? '' : esc(S?.config?.geminiKey || '')}" style="flex:1;min-width:200px"><button class="btn btn-pink" id="iks">Conectar</button>${S?.config?.geminiKey && !S.isDemo ? '<button class="btn btn-ghost" id="ikx">Desconectar</button>' : ''}</div>
    <p class="small" id="ikm" style="margin-top:10px"></p></div>`);
  if (foco === 'conectar') setTimeout(() => ov.querySelector('#conectar').scrollIntoView({ behavior: 'smooth' }), 300);
  const salvar = async k => {
    if (S.readonly || S.isDemo) return toast('Crie sua conta para conectar a sua IA.');
    const m = ov.querySelector('#ikm'); m.innerHTML = '<span class="spin"></span> Testando…';
    const antes = S.config.geminiKey; S.config.geminiKey = k; delete S.config.noThinkCfg; delete S.config.model; delete S.config.modelChains;
    if (k) { try { await AI.gen({ prompt: 'Responda JSON {"ok":true}', fast: true }); } catch (e) { S.config.geminiKey = antes; m.textContent = '✗ ' + e.message; return; } }
    S.saveConfig(); await S.flush(); m.textContent = k ? '✓ Sua IA está conectada! Agora você usa sem o limite do site.' : 'Desconectada. Você voltou a usar o IAlvorecer do site.';
    window.dispatchEvent(new Event('ia-uso'));
  };
  ov.querySelector('#iks').onclick = () => { const k = ov.querySelector('#ik').value.trim(); if (k.length < 30 || /\s/.test(k)) return toast('Confira se copiou a chave inteira, sem espaços.'); salvar(k); };
  ov.querySelector('#ikx') && (ov.querySelector('#ikx').onclick = () => salvar(''));
}

// ---------- PARA IR ALÉM (conteúdo extra da aula) ----------
function extraHTML(lesson, d) {
  const ex = lesson.extra || {};
  const notas = ex.notas?.length ? ex.notas : (lesson.sections || []).map(s => s.heading);
  return `<div class="panel"><h3>📝 Anotações da aula</h3><ul style="margin:12px 0;padding-left:18px">${notas.map(n => `<li style="margin:6px 0">${esc(n)}</li>`).join('')}</ul><button class="btn btn-ghost btn-sm" data-copy="${esc(notas.map(n => '• ' + n).join('\n'))}">Copiar anotações</button></div>
  ${ex.desafio ? `<div class="panel section"><h3>🎯 Desafio extra (opcional)</h3><p style="margin-top:10px">${esc(ex.desafio)}</p></div>` : ''}`;
}

// ---------- AVALIAÇÕES, ERROS E CONTATO ----------
let sbPub = null;
const getSb = () => sb || (sbPub ||= createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } }));
// ---------- MARCAR CONVERSAÇÃO ----------
const convOrd = (a, b) => (a.d + String(a.h).padStart(2, '0')).localeCompare(b.d + String(b.h).padStart(2, '0'));
function convLangs() {
  const st = S?.state || {}, ativos = [st.plan?.main, st.plan?.second, ...Object.keys(st.courses || {}).filter(k => k.startsWith('lang:')).map(k => k.slice(5)), ...(st.customLangs || []).map(l => l.id)].filter(Boolean);
  const meus = [...new Set(ativos)].map(lang).filter(Boolean), outros = C.languages.filter(l => !meus.some(m => m.id === l.id));
  return { meus, outros };
}
const convLangName = id => lang(id)?.name || id;
function convCfg() { const c = S?.config?.conversa || {}; const l0 = (lang(c.lang) && c.lang) || S?.state?.plan?.main || 'en'; return { modo: c.modo || 'livre', hora: c.hora ?? 19, lang: l0, agenda: (c.agenda || []).filter(x => x.d >= today()).sort(convOrd).filter((x, i, arr) => arr.findIndex(y => y.d === x.d) === i).slice(0, 60).map(x => ({ ...x, l: (lang(x.l) && x.l) || l0 })), lembrete: !!c.lembrete, dias: Array.isArray(c.dias) ? c.dias : [1, 2, 3, 4, 5], feriados: !!c.feriados }; }
function convResumo() {
  const c = convCfg(), av = c.lembrete && S.config.emailsOn !== false ? ', com e-mail de lembrete' : ', sem e-mail de lembrete';
  if (c.modo === 'nenhuma') return 'Sem conversação por enquanto';
  if (c.modo === 'diario') return `${convLangName(c.lang)}, ${diasResumo({ days: c.dias, holidays: c.feriados })} às ${c.hora}h${av}`;
  if (c.modo === 'agendada') return c.agenda.length ? `Próxima: ${convLangName(c.agenda[0].l)}, ${fmtShort(c.agenda[0].d)} às ${c.agenda[0].h}h${c.agenda.length > 1 ? ` (e mais ${c.agenda.length - 1})` : ''}${av}` : 'Nenhum dia marcado ainda';
  return `${convLangName(c.lang)}, quando você quiser, sem lembrete`;
}
async function openAgendaConversa(pre = '') {
  const D = await dias();
  const c = convCfg(); if (pre && lang(pre)) c.lang = pre; const agenda = [...c.agenda];
  const horas = sel => Array.from({ length: 18 }, (_, i) => i + 6).map(h => `<option value="${h}" ${sel === h ? 'selected' : ''}>${h}h</option>`).join('');
  const op = (v, t, d) => `<label class="check" style="align-items:flex-start;gap:10px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;margin-bottom:8px;cursor:pointer"><input type="radio" name="cm" value="${v}" style="width:auto;margin-top:3px" ${c.modo === v ? 'checked' : ''}><span><b>${t}</b><br><span class="small muted">${d}</span></span></label>`;
  const ov = openInfo(`<div class="eyebrow">Conversação</div><h2 style="margin:10px 0 8px">Marcar conversação com o IAlvorecer</h2><p class="muted" style="margin-bottom:16px">Escolha o que combina com a sua rotina. Mesmo com horário marcado, você pode conversar a qualquer hora.</p>
    ${op('livre', 'Iniciar quando eu estiver disponível', 'Sem dia nem horário marcado e sem e-mail de lembrete.')}
    ${op('diario', 'Mesmo horário nos dias que eu escolher', 'Por padrão, de segunda a sexta. Fins de semana e feriados só se você marcar.')}
    ${op('agendada', 'Dia e horário específicos', 'Uma conversação por dia. Marque um ou mais dias.')}
    ${op('nenhuma', 'Não quero fazer conversação agora', 'Ela sai do seu e-mail do dia. Dá para voltar quando quiser.')}
    <div id="cmI" class="field" style="margin-top:12px"><label>Idioma da conversação</label><select id="cmLang" style="max-width:260px">${(() => { const { meus, outros } = convLangs(); const o = l => `<option value="${esc(l.id)}" ${l.id === c.lang ? 'selected' : ''}>${esc(l.name)}</option>`; return (meus.length ? `<optgroup label="Seus idiomas">${meus.map(o).join('')}</optgroup>` : '') + (outros.length ? `<optgroup label="Outros idiomas do site">${outros.map(o).join('')}</optgroup>` : ''); })()}</select><div class="help">Pode ser diferente do idioma das suas aulas. No modo de dias específicos, cada dia guarda o idioma escolhido na hora de adicionar.</div></div>
    <div id="cmD" class="field" style="margin-top:12px"><label>Dias da conversação</label>${D.caixinhas('cv', { days: c.dias, holidays: c.feriados })}<label style="margin-top:14px;display:block">Horário</label><select id="cmH" style="max-width:160px">${horas(c.hora)}</select></div>
    <div id="cmA" style="margin-top:12px"><div class="row" style="gap:8px;align-items:flex-end"><div class="field" style="margin:0"><label>Dia</label><input type="date" id="cmDia" min="${today()}" value="${today()}"></div><div class="field" style="margin:0"><label>Horário</label><select id="cmHA">${horas(19)}</select></div><button class="btn btn-ghost btn-sm" id="cmAdd">Adicionar</button></div><div id="cmList" style="margin-top:10px"></div></div>
    <label class="check" id="cmL" style="margin-top:14px;gap:10px"><input type="checkbox" id="cmLemb" style="width:auto" ${c.lembrete ? 'checked' : ''}> Quero receber um e-mail de lembrete no horário marcado</label>
    <p class="help" id="cmOff" style="margin-top:6px"></p><p class="help" style="margin-top:4px">Só dá para marcar uma conversação por dia. Se o horário passar e você não conseguir, pode remarcar para mais tarde no mesmo dia, mas o e-mail de lembrete é enviado só uma vez por dia (não chega de novo no novo horário).</p>
    <button class="btn btn-pink" id="cmSave" style="margin-top:14px">Salvar</button>`);
  const q = x => ov.querySelector(x), modo = () => (ov.querySelector('[name=cm]:checked') || {}).value || 'livre';
  const lista = () => {
    q('#cmList').innerHTML = agenda.length ? agenda.map((a, i) => `<div class="row small" style="padding:6px 0;border-bottom:1px solid var(--line)"><span>${esc(fmtDay(a.d))} às ${a.h}h · ${esc(convLangName(a.l))}</span><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-rm="${i}">Remover</button></div>`).join('') : '<p class="small muted">Nenhum dia marcado.</p>';
    q('#cmList').querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { agenda.splice(+b.dataset.rm, 1); lista(); });
  };
  const vis = () => {
    const m = modo(), marca = ['diario', 'agendada'].includes(m);
    q('#cmD').hidden = m !== 'diario'; q('#cmI').hidden = m === 'nenhuma'; q('#cmA').hidden = m !== 'agendada'; q('#cmL').hidden = !marca;
    q('#cmOff').textContent = marca && S.config.emailsOn === false ? 'Seus e-mails estão desligados em Ajustes: o lembrete só chega se você ligar "Enviar e-mails".' : '';
  };
  ov.querySelectorAll('[name=cm]').forEach(r => r.onchange = vis); vis(); lista(); D.vigiar(ov, 'cv');
  q('#cmAdd').onclick = () => {
    const d = q('#cmDia').value, h = +q('#cmHA').value, l = q('#cmLang').value;
    if (!d || d < today()) return toast('Escolha um dia de hoje em diante.');
    const ja = agenda.find(a => a.d === d); if (ja) { ja.h = h; ja.l = l; toast('Esse dia já tinha conversação: troquei para ' + convLangName(l) + ' às ' + h + 'h (uma por dia).', 5000); } else { if (agenda.length >= 60) return toast('Você já tem muitos dias marcados. Remova alguns antes.'); agenda.push({ d, h, l }); }
    agenda.sort(convOrd); lista();
  };
  q('#cmSave').onclick = async () => {
    if (S.readonly) return toast('Modo visitante: crie sua conta para marcar a conversação.');
    const m = modo();
    if (m === 'agendada' && !agenda.length) return toast('Adicione pelo menos um dia, ou escolha outra opção.');
    const dv = D.ler(ov, 'cv'); if (m === 'diario' && !dv.days.length) return toast('Marque pelo menos um dia para a conversação.');
    S.config.conversa = { modo: m, hora: +q('#cmH').value, lang: q('#cmLang').value, dias: dv.days.length ? dv.days : [1, 2, 3, 4, 5], feriados: dv.holidays, agenda, lembrete: ['diario', 'agendada'].includes(m) && q('#cmLemb').checked };
    S.saveConfig(); if (S.flush) await S.flush();
    ov.remove(); const r = $('#convRes'); if (r) r.textContent = convResumo();
    toast('Conversação salva: ' + convResumo(), 5000);
  };
}

function openFeedback(kind = 'avaliacao') {
  const T = { avaliacao: ['Avaliar o IAlvorecer', 'Sua opinião chega direto para a Emilly, a criadora. Ela lê tudo.'], erro: ['Reportar um erro', 'Conte o que aconteceu e onde. Isso ajuda muito a melhorar o site.'], contato: ['Falar com a Emilly', 'Antes, vale falar com o IAlvorecer ✦: ele se esforça ao máximo para resolver. Se mesmo assim precisar, escreva aqui ou mande um e-mail para ' + CONTATO + '.'] }[kind];
  let nota = 0;
  const ov = openInfo(`<div class="eyebrow">${kind === 'erro' ? 'Suporte' : kind === 'contato' ? 'Contato' : 'Avaliação'}</div><h2 style="margin:10px 0 8px">${T[0]}</h2><p class="muted">${esc(T[1])}</p>
    ${kind === 'avaliacao' ? `<div class="row" id="stars" style="margin:18px 0;gap:6px">${[1, 2, 3, 4, 5].map(n => `<button class="iconbtn" data-n="${n}" style="width:44px;height:44px;font-size:20px">☆</button>`).join('')}</div>` : ''}
    <div class="field" style="margin-top:16px"><label>${kind === 'avaliacao' ? 'Quer contar mais? (opcional)' : 'Mensagem'}</label><textarea id="fbm" rows="5" maxlength="4000" placeholder="${kind === 'erro' ? 'Ex.: cliquei em Corrigir na aula 12 e apareceu um erro…' : 'Escreva aqui…'}"></textarea></div>
    <div class="field"><label>Seu e-mail (para a Emilly poder responder, opcional)</label><input id="fbe" type="email" value="${esc(S?.user?.email || '')}"></div>
    <button class="btn btn-pink" id="fbs">Enviar</button>`);
  ov.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { nota = +b.dataset.n; ov.querySelectorAll('[data-n]').forEach(x => { x.classList.toggle('sel', +x.dataset.n <= nota); x.textContent = +x.dataset.n <= nota ? '★' : '☆'; }); });
  ov.querySelector('#fbs').onclick = async e => {
    const msg = ov.querySelector('#fbm').value.trim();
    if (kind === 'avaliacao' && !nota) return toast('Escolha de 1 a 5 estrelas.');
    if (kind !== 'avaliacao' && !msg) return toast('Escreva sua mensagem.');
    e.target.disabled = true; e.target.innerHTML = '<span class="spin"></span>';
    const { error } = await getSb().from('feedback').insert({ tipo: kind, nota: nota || null, mensagem: msg || null, email: ov.querySelector('#fbe').value.trim() || null, pagina: location.hash.slice(0, 120) });
    if (error) { e.target.disabled = false; e.target.textContent = 'Enviar'; return toast('Não consegui enviar agora. Tente de novo ou escreva para ' + CONTATO, 7000); }
    ov.querySelector('.modal-box').innerHTML = `<div class="lock" style="margin:10px auto"><div class="ci">💛</div><h2>Obrigada!</h2><p class="muted" style="margin-top:10px">Sua mensagem chegou para a Emilly. Ela quer muito poder ajudar e melhorar o IAlvorecer para todo mundo.</p><button class="btn btn-pink" data-close style="margin-top:18px">Fechar</button></div>`;
  };
}

// ---------- SOBRE E APOIAR ----------
async function sobre() {
  app.innerHTML = `<div class="eyebrow">Sobre</div><h1 style="margin:10px 0 18px">Um novo dia, uma nova chance</h1>
  <div class="grid g2"><div class="panel prose" style="max-width:none"><p>O <b>IAlvorecer</b> é um site feito com integração de IA para pessoas que não têm condições de pagar por nutricionistas, personal trainers, psicólogos ou cursos específicos.</p>
    <p>Quem faz o trabalho é o próprio <b>IAlvorecer</b>: uma IA que faz de tudo para as coisas darem certo e ajuda cada pessoa a se planejar e conquistar o que quer. Não há personagens nem nomes inventados: é sempre o IAlvorecer.</p><p>O nome junta <b>IA</b> e <b>alvorecer</b>: o começo de um novo dia. Um recomeço, novas chances para aprender, se cuidar e ter uma vida melhor.</p>
    <p>Foi criado pela designer <b>Emilly Urbano</b>, que sabe como é não ter acesso a esse tipo de ajuda, e quis construir um lugar onde todo mundo possa aprender e se cuidar, de graça.</p></div>
    <div class="panel"><h3>Avisos importantes</h3><ul class="small" style="margin-top:12px;padding-left:18px;line-height:1.7">
      <li>O IAlvorecer é um meio de ajuda para quem precisa. <b>Pode conter erros</b> por ser feito por IA, e os ensinamentos não são 100% precisos.</li>
      <li><b>Não substitui profissionais qualificados</b>: é apenas uma base para ajudar.</li>
      <li>O IAlvorecer é feito por uma única designer com utilização de IA, então podem ocorrer erros. Se tiver problemas técnicos, reporte em Ajustes → <b>Reportar erro</b>.</li>
      <li>Emergências: SAMU 192 · Apoio emocional 24h: CVV 188 · Atendimento gratuito: UBS/posto de saúde (SUS).</li></ul>
      <div class="row" style="margin-top:18px"><button class="btn btn-ghost btn-sm" data-fb="avaliacao">⭐ Avaliar</button><button class="btn btn-ghost btn-sm" data-fb="erro">⚠️ Reportar erro</button><a class="btn btn-pink btn-sm" href="#/apoiar">Apoiar com Pix</a></div></div></div>`;
}
function crc16(s) { let c = 0xFFFF; for (let i = 0; i < s.length; i++) { c ^= s.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1; c &= 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, '0'); }
function pixPayload(valor) {
  const f = (id, v) => id + String(v.length).padStart(2, '0') + v;
  const clean = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  let p = f('00', '01') + f('26', f('00', 'br.gov.bcb.pix') + f('01', PIX_KEY)) + f('52', '0000') + f('53', '986') + (valor ? f('54', (+valor).toFixed(2)) : '') + f('58', 'BR') + f('59', clean(PIX_NOME).slice(0, 25)) + f('60', clean(PIX_CIDADE).slice(0, 15)) + f('62', f('05', '***')) + '6304';
  return p + crc16(p);
}
async function apoiar() {
  app.innerHTML = `<div class="eyebrow">Apoiar</div><h1 style="margin:10px 0 12px">Ajude o IAlvorecer a continuar de graça</h1>
  <p class="muted" style="max-width:720px">O IAlvorecer é feito por uma pessoa só e é gratuito para todo mundo. Se ele te ajudou e você puder, qualquer valor ajuda a manter o site no ar e a criar coisas novas. Se não puder, tudo bem: avaliar e indicar para alguém também ajuda muito. 💛</p>
  <div class="grid g2 section">${PIX_KEY ? `<div class="panel" style="text-align:center"><h3>Pix</h3><div id="qr" style="background:#fff;border-radius:18px;padding:14px;width:240px;margin:16px auto"></div>
    <div class="row" style="justify-content:center">${[5, 10, 20].map(v => `<button class="btn btn-ghost btn-sm" data-v="${v}">R$ ${v}</button>`).join('')}<button class="btn btn-ghost btn-sm" data-v="">Outro valor</button></div>
    <button class="btn btn-pink" id="copia" style="margin-top:16px">Copiar Pix copia e cola</button><p class="small dim" style="margin-top:12px">Pix para ${esc(PIX_NOME)} · ${esc(PIX_CIDADE)}</p></div>`
    : `<div class="panel"><h3>Pix</h3><p class="muted" style="margin-top:10px">A chave Pix está sendo configurada. Volte em breve!</p></div>`}
    <div class="panel"><h3>Outras formas de ajudar</h3><div class="today" style="margin-top:14px"><button class="task" data-fb="avaliacao" style="text-align:left;width:100%"><span class="ck">⭐</span><span class="t">Avaliar o IAlvorecer</span></button><button class="task" data-fb="erro" style="text-align:left;width:100%"><span class="ck">⚠️</span><span class="t">Reportar um erro</span></button><a class="task" href="#/sobre"><span class="ck">💬</span><span class="t">Conhecer a história</span></a></div></div></div>`;
  if (!PIX_KEY) return;
  if (!window.qrcode) await new Promise(r => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'; s.onload = r; document.head.append(s); });
  let payload = pixPayload('');
  const draw = () => { const q = window.qrcode(0, 'M'); q.addData(payload); q.make(); $('#qr').innerHTML = q.createSvgTag({ cellSize: 5, margin: 2 }); $('#qr svg').style.width = '100%'; $('#qr svg').style.height = 'auto'; };
  draw();
  $$('[data-v]').forEach(b => b.onclick = () => { payload = pixPayload(b.dataset.v); draw(); toast(b.dataset.v ? `QR de R$ ${b.dataset.v} pronto` : 'Valor livre: você escolhe no app do banco'); });
  $('#copia').onclick = () => { navigator.clipboard.writeText(payload); toast('Pix copia e cola copiado ✓'); };
}

// ---------- NIVELAMENTO E PREFERÊNCIAS ----------
const convMin = () => +(S.state.profile?.prefs?.convMinutes) || 30;
function placeLevel(qs, results) {
  let start = 'A1';
  for (const lv of C.levels) {
    const idx = qs.map((q, i) => q.level === lv ? i : -1).filter(i => i >= 0);
    if (!idx.length) continue;
    const acc = idx.filter(i => results[i]?.ok).length / idx.length;
    if (acc >= 0.66) start = C.levels[Math.min(C.levels.length - 1, lvIdx(lv) + 1)];
    else break;
  }
  return start;
}
async function runPlacement(box, L, onLevel) {
  box.innerHTML = spinner(`Montando o teste de ${L.name}…`);
  try {
    const r = await AI.placement({ lang: L });
    const qs = limparExercicios(r.questions).filter(q => q.type === 'mcq' || q.type === 'fill');
    box.innerHTML = `<p class="muted" style="margin-bottom:14px">Responda sem consultar nada. Se não souber, deixe em branco: isso também ajuda a achar o seu nível.</p><div id="pq"></div>`;
    exercisesUI($('#pq', box), qs, { langName: L.name, doneLabel: 'Ver meu nível', onDone: res => onLevel(placeLevel(qs, res.results), res.score) });
  } catch (e) { box.innerHTML = errBox(e); }
}
async function nivelamento(key) {
  const d = course(key), s = cs(key);
  app.innerHTML = `<a class="back" href="#/curso/${key}">${esc(d.title)}</a><div class="eyebrow" style="margin-top:14px">Teste de nivelamento</div><h1 style="margin:6px 0 18px">${esc(d.title)}: qual é o seu nível?</h1><div id="pl"></div>`;
  runPlacement($('#pl'), d.lang, async (lv, score) => {
    await S.addEvent({ type: 'test', kind: 'nivelamento', course: key, title: `Nivelamento de ${d.title}: ${lv}`, level: lv, score });
    app.innerHTML = `<div class="panel" style="max-width:600px;margin:30px auto;text-align:center"><div class="eyebrow">Seu nível sugerido</div><div class="score">${lv}</div><p class="muted">${esc(lvName(lv))} · você está no ${s.level} agora.</p>
      <div class="row" style="justify-content:center;margin-top:16px">${lv !== s.level ? `<button class="btn btn-pink" id="ap">Começar no ${lv}</button>` : ''}<a class="btn btn-ghost" href="#/curso/${key}">${lv !== s.level ? `Continuar no ${s.level}` : 'Voltar ao curso'}</a></div></div>`;
    $('#ap') && ($('#ap').onclick = () => { s.level = lv; s.cycle = 1; S.saveState(); S.addEvent({ type: 'level', course: key, title: `Nível definido pelo nivelamento: ${lv}`, level: lv }); location.hash = `#/curso/${key}`; });
  });
}
async function boasVindas() {
  const P = S.state.profile, pr = P.prefs || {};
  const o = {
    name: P.name || '', area: P.area || '', goals: pr.goals || ['Idiomas'], learned: pr.learned || '',
    langs: Object.keys(S.state.courses).filter(k => k.startsWith('lang:')).map(k => k.slice(5)), levels: {},
    style: pr.style || 'equilibrado', explain: pr.explain || 'auto', styles: pr.styles || ['recomendado'], noLang: !!pr.noLang, other: pr.other || '', minutes: pr.minutes || 30, convMinutes: pr.convMinutes || 30, interests: pr.interests || []
  };
  if (S.isNew) o.langs = [];
  o.langs.forEach(l => o.levels[l] = cs('lang:' + l).level);
  let step = 0;
  const chips = (name, opts, multi) => `<div class="chips">${opts.map(([v, l]) => `<button class="chip ${(multi ? o[name].includes(v) : o[name] == v) ? 'on' : ''}" data-c="${name}" data-v="${esc(v)}" data-m="${multi ? 1 : ''}">${l}</button>`).join('')}</div>`;
  const steps = [
    () => `<h1>Oi! Vamos montar o seu curso ☀️</h1><p class="muted" style="margin:10px 0 22px">Umas perguntas rápidas para o IAlvorecer te conhecer. Dá pra mudar tudo depois.</p>
      <div class="field"><label>Como você quer ser chamada(o)?</label><input id="o-name" value="${esc(o.name)}"></div>
      <div class="field"><label>Sua área ou profissão</label><input id="o-area" value="${esc(o.area)}" placeholder="ex.: UX Design, estudante, marketing…"></div><div id="memBoas"></div>`,
    () => `<h2>O que você quer aprender?</h2><p class="muted" style="margin:8px 0 16px">Escolha quantos quiser.</p>${chips('goals', [['Cuidar de mim', '💛 Cuidar de mim (desabafo, alimentação, treino)'], ['Idiomas', '🗣 Idiomas'], ['Tecnologia & IA', '🤖 Tecnologia & IA'], ['Carreira', '🧭 Carreira e mentoria'], ...Object.values(C.tracks).filter(t => t.area).map(t => [t.name, t.name]), ['Outro', '＋ Outro']], true)}${o.goals.includes('Outro') ? `<div class="field" style="margin-top:14px"><label>O que mais você quer aprender?</label><input id="o-other" value="${esc(o.other)}" placeholder="Ex.: violão, Excel, fotografia…"><div class="help">Depois é só pedir ao IAlvorecer: ele cria um curso personalizado para você em Seu Alvorecer.</div></div>` : ''}
      <h3 style="margin:28px 0 12px">Como você aprendeu o que já sabe de idiomas?</h3>${chips('learned', [['natural', 'Sozinha(o): séries, games, internet'], ['escola', 'Escola ou curso'], ['fora', 'Morando ou viajando fora'], ['zero', 'Estou começando agora']])}`,
    () => `<h2>Por qual idioma você quer começar?</h2><p class="muted" style="margin:8px 0 16px">Escolha um (ou mais). O primeiro escolhido vira o principal.</p><button class="chip ${o.noLang ? 'on' : ''}" id="o-nolang" style="margin-bottom:16px">${o.noLang ? '✓ ' : ''}Não quero aprender idiomas agora</button>${o.noLang ? '<p class="muted">Tudo bem! Quando quiser, é só abrir a aba Idiomas.</p>' : ''}<button class="btn btn-ghost btn-sm" id="o-zero" style="margin-bottom:16px">⏭ Pular nivelamento: começar do zero (A1)</button>${chips('langs', [...C.languages, ...(S.state.customLangs || [])].map(l => [l.id, l.flag ? `<img class="flagimg" src="https://flagcdn.com/w40/${l.flag}.png" alt="">${l.name}` : `🌎 ${l.name}`]), true)}<div class="row" style="margin-top:14px"><input id="o-otherlang" placeholder="Outro idioma? Ex.: Hindi, Holandês, Libras…" style="max-width:300px"><button class="btn btn-ghost btn-sm" id="o-addlang">＋ Adicionar</button></div>
      ${o.langs.length ? `<h3 style="margin:26px 0 6px">Qual você acha que é o seu nível?</h3><p class="small muted" style="margin-bottom:8px">Na próxima etapa dá pra confirmar com um teste.</p>${o.langs.map(id => `<div class="lvrow"><b>${esc(lang(id).name)}</b><select data-lv="${id}">${C.levels.map(l => `<option value="${l}" ${(o.levels[id] || 'A1') === l ? 'selected' : ''}>${l} · ${lvName(l)}</option>`).join('')}</select></div>`).join('')}` : ''}`,
    () => `<h2>Como você prefere aprender?</h2>
      <h3 style="margin:20px 0 6px">Do que você mais gosta nas aulas?</h3><p class="small muted" style="margin-bottom:10px">Escolha quantas quiser (as aulas se adaptam), ou fique no recomendado. Dá pra mudar depois em Ajustes.</p>${chips('styles', [['recomendado', '⭐ Recomendado'], ['conversa', '💬 Conversação'], ['exercicios', '✏️ Exercícios'], ['teoria', '📐 Teoria e regras'], ['anotacoes', '📝 Anotações']], true)}
      <h3 style="margin:24px 0 10px">Tempo por aula</h3>${chips('minutes', [[15, '15 min'], [30, '30 min'], [45, '45 min'], [60, '1 hora']])}
      <h3 style="margin:24px 0 10px">Conversação</h3>${chips('convMinutes', [[15, '15 min'], [20, '20 min'], [30, '30 min'], [45, '45 min']])}
      <h3 style="margin:24px 0 10px">Seus interesses</h3>${chips('interests', ['Games', 'Séries e filmes', 'Música', 'Viagens', 'Design', 'Tecnologia', 'Moda', 'Culinária', 'Esportes', 'Negócios', 'Arte', 'Natureza'].map(x => [x, x]), true)}`,
    () => `<h2>Teste de nivelamento</h2><p class="muted" style="margin:8px 0 16px">18 questões rápidas (uns 5 minutos) para começar no nível certo, sem aula fácil demais nem difícil demais.</p>
      ${o.skipTest ? '<div class="notice">Nivelamento pulado: você começa do zero (A1). Se quiser, faça o teste depois, na página do idioma.</div>' : o.langs.length ? ((S.config.geminiKey || S.aiProxy) ? o.langs.map(id => `<div class="lvrow"><b>${esc(lang(id).name)}</b><span class="spacer" style="flex:1">nível: <b id="lvv-${id}">${o.levels[id] || 'A1'}</b></span><button class="btn btn-ghost btn-sm" data-pt="${id}">Fazer teste</button></div>`).join('') + '<div id="o-pl" style="margin-top:20px"></div>' : '<div class="notice">Sem a IA ligada o teste não roda. Vou usar o nível que você escolheu; dá pra fazer o teste depois, na página do idioma.</div>') : '<p class="muted">Você não escolheu idiomas agora. Tudo bem!</p>'}`
  ];
  const draw = () => {
    app.innerHTML = `<div class="onb panel"><div class="dots">${steps.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div><div id="ob">${steps[step]()}</div>
      <div class="row" style="margin-top:28px">${step ? '<button class="btn btn-ghost" id="o-back">Voltar</button>' : ''}<span class="spacer"></span><button class="btn btn-pink" id="o-next">${step === steps.length - 1 || (step === steps.length - 2 && (!o.langs.length || o.noLang)) ? 'Começar' : 'Continuar'}</button></div></div>`;
    if (step === 0) import('./memoria.js?v=1').then(M => { const r = $('#memBoas'); if (!r) return; if (S.config.memoria === undefined) S.config.memoria = true; r.innerHTML = M.memoriaHTML(S, { compacto: true }).replace('class="panel" style="margin-bottom:18px"', 'class="panel" style="margin:8px 0 0"'); M.ligar(r, { S, openInfo, toast }); }).catch(() => { });
    $$('[data-c]').forEach(b => b.onclick = () => {
      const n = b.dataset.c, v = typeof o[n] === 'number' ? +b.dataset.v : b.dataset.v;
      if (b.dataset.m) { o[n] = o[n].includes(v) ? o[n].filter(x => x !== v) : [...o[n], v]; if (n === 'langs' && !o.levels[v]) o.levels[v] = cs('lang:' + v).level; if (n === 'styles') { if (v === 'recomendado' && o.styles.includes(v)) o.styles = ['recomendado']; else o.styles = o.styles.filter(x => x !== 'recomendado'); if (!o.styles.length) o.styles = ['recomendado']; } }
      else o[n] = v;
      collect(); draw();
    });
    $$('[data-lv]').forEach(s => s.onchange = () => o.levels[s.dataset.lv] = s.value);
    $('#o-nolang') && ($('#o-nolang').onclick = () => { o.noLang = !o.noLang; if (o.noLang) o.langs = []; draw(); });
    if (o.noLang) { $('#o-zero')?.remove(); $$('[data-c="langs"]')[0]?.closest('.chips')?.remove(); $('#o-otherlang')?.closest('.row')?.remove(); }
    $('#o-addlang') && ($('#o-addlang').onclick = () => { const id = addCustomLang($('#o-otherlang').value); if (!id) return toast('Digite o nome de um idioma.'); if (!o.langs.includes(id)) o.langs.push(id); o.levels[id] = o.levels[id] || 'A1'; draw(); });
    $('#o-zero') && ($('#o-zero').onclick = () => { if (!o.langs.length) o.langs = ['en']; o.langs.forEach(l => o.levels[l] = 'A1'); o.skipTest = true; step = 3; draw(); window.scrollTo(0, 0); });
    $('#o-test') && ($('#o-test').onclick = async () => { S.config.geminiKey = $('#o-key').value.trim(); $('#o-tm').innerHTML = '<span class="spin"></span>'; try { await AI.gen({ prompt: 'Responda JSON {"ok":true}', fast: true }); $('#o-tm').textContent = '✓ Funcionando!'; } catch (e) { $('#o-tm').textContent = '✗ ' + e.message; } });
    $$('[data-pt]').forEach(b => b.onclick = () => runPlacement($('#o-pl'), lang(b.dataset.pt), (lv, score) => {
      o.levels[b.dataset.pt] = lv; $('#o-pl').innerHTML = `<div class="notice">${esc(lang(b.dataset.pt).name)}: nível sugerido <b>${lv}</b> (${score}%). ✓</div>`; $(`#lvv-${b.dataset.pt}`).textContent = lv;
      S.addEvent({ type: 'test', kind: 'nivelamento', course: 'lang:' + b.dataset.pt, title: `Nivelamento de ${lang(b.dataset.pt).name}: ${lv}`, level: lv, score });
    }));
    $('#o-back') && ($('#o-back').onclick = () => { collect(); step--; draw(); });
    $('#o-next').onclick = async () => { collect(); if (step < steps.length - 1 && !(step === steps.length - 2 && (!o.langs.length || o.noLang))) { step++; draw(); window.scrollTo(0, 0); } else await finish(); };
  };
  const collect = () => {
    if ($('#o-name')) { o.name = $('#o-name').value.trim(); o.area = $('#o-area').value.trim(); }
    if ($('#o-other')) o.other = $('#o-other').value.trim();
    if ($('#o-key')) { const k = $('#o-key').value.trim(); if (k !== (S.config.geminiKey || '')) { S.config.geminiKey = k; delete S.config.noThinkCfg; } S.saveConfig(); }
  };
  const finish = async () => {
    P.name = o.name || P.name || 'Aluno'; P.area = o.area;
    if (o.goals.includes('Cuidar de mim') && !o.langs.length && !o.goals.includes('Idiomas')) S.state.area = S.state.area || 'saude';
    P.prefs = { ...(P.prefs?.studyDays ? { studyDays: P.prefs.studyDays } : {}), goals: o.goals, noLang: o.noLang, styles: o.styles, other: o.other, learned: o.learned, style: o.style, explain: o.explain, minutes: o.minutes, convMinutes: o.convMinutes, interests: o.interests };
    for (const id of o.langs) { const s = cs('lang:' + id); const lv = o.levels[id] || s.level; if (lv !== s.level) { s.level = lv; s.cycle = 1; } }
    if (o.langs.length) { S.state.plan.main = o.langs[0]; S.state.plan.second = o.langs[1] || ''; S.state.plan.secondDays = o.langs[1] ? [2, 4] : []; }
    S.state.onboarded = today(); S.isNew = false;
    S.saveState(); await S.flush();
    $('#avatar').textContent = (P.name || 'B')[0].toUpperCase();
    toast('Tudo pronto! Bons estudos ☀️'); location.hash = '#/';
  };
  draw();
}

// ---------- LOGIN ----------
function login(msg, mode = 'inicio') {
  $('#topbar').hidden = true; $('#tabbar').hidden = true;
  if (mode === 'inicio') {
    app.innerHTML = `<div class="landing">
      <div class="brand" style="font-size:40px"><em>IA</em>lvorecer<span>.</span></div>
      <h1 style="margin:22px 0 14px">Um novo dia.<br><span class="grad">Uma nova chance.</span></h1>
      <p class="muted" style="font-size:18px;max-width:560px;margin:0 auto 30px">Uma IA que faz de tudo para as coisas darem certo e te ajuda a se planejar e conquistar o que você quer: idiomas, tecnologia, carreira, desabafo, alimentação e treino, de graça.</p>
      ${msg ? `<div class="notice" style="margin:0 auto 18px;max-width:520px">${esc(msg)}</div>` : ''}
      <div class="landing-btns">
        <a class="btn btn-pink" href="?visita=1" style="justify-content:center">👁 Visitar o IAlvorecer</a>
        ${GOOGLE_ENABLED ? `<button class="btn btn-ghost" id="gg" style="justify-content:center"><b style="color:#8ab4ff">G</b> Entrar com Google</button>` : ''}
        <button class="btn btn-ghost" data-mode="entrar" style="justify-content:center">Entrar com e-mail</button>
        <button class="btn btn-ghost" data-mode="criar" style="justify-content:center">Criar conta grátis</button>
        <button class="btn btn-ghost" data-comoentrar style="justify-content:center"><i data-lucide="circle-help"></i> Como entrar</button>
      </div>
      <p class="small dim" style="max-width:560px;margin:34px auto 0;line-height:1.6">O IAlvorecer é feito por uma única designer com utilização de IA: podem ocorrer erros e ele não substitui profissionais qualificados. Problemas técnicos? Reporte em Ajustes → "Reportar erro".</p>
    </div>`;
    $$('[data-mode]').forEach(b => b.onclick = () => login('', b.dataset.mode));
    $('#gg') && ($('#gg').onclick = async () => { const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: SITE_URL } }); if (error) login(error.message); });
    return;
  }
  let emails = true;
  const criar = mode === 'criar';
  app.innerHTML = `<div class="login panel">
    <button class="back" data-mode="inicio" style="margin-bottom:18px">Voltar</button>
    <div class="brand" style="font-size:30px"><em>IA</em>lvorecer<span>.</span></div>
    <p class="muted" style="margin:10px 0 18px">${criar ? 'Crie sua conta grátis. Seu progresso fica salvo e você entra de qualquer aparelho.' : 'Que bom te ver de novo.'}</p>
    ${msg ? `<div class="notice" style="margin-bottom:16px">${esc(msg)}</div>` : ''}
    ${GOOGLE_ENABLED ? `<button class="btn btn-ghost" id="gg" style="width:100%;justify-content:center;margin-bottom:6px"><b style="color:#8ab4ff">G</b> ${criar ? 'Criar conta' : 'Entrar'} com Google</button><div class="small dim" style="text-align:center;margin:8px 0 12px">ou com e-mail</div>` : ''}
    ${criar ? '<div class="field"><label>Como quer ser chamada(o)?</label><input id="nm" autocomplete="given-name"></div>' : ''}
    <div class="field"><label>E-mail</label><input id="em" type="email" autocomplete="email"></div>
    <div class="field"><label>Senha${criar ? ' (mínimo 8 caracteres)' : ''}</label><input id="pw" type="password" autocomplete="${criar ? 'new-password' : 'current-password'}"></div>
    ${criar ? `<div class="field"><label>Quer receber e-mails com a aula do dia e lembretes?</label><div class="chips"><button class="chip on" data-em="1">👍 Sim, quero</button><button class="chip" data-em="0">👎 Não, obrigada(o)</button></div><div class="help">Dá pra mudar quando quiser em Ajustes, inclusive os horários.</div></div>` : ''}
    <label class="check small" style="margin-bottom:16px"><input type="checkbox" id="rem" ${LS.get('pg_remember') === '0' ? '' : 'checked'}> Lembrar este aparelho (não pedir a senha de novo)</label>
    <button class="btn btn-pink" id="go" style="width:100%;justify-content:center">${criar ? 'Criar minha conta' : 'Entrar'}</button>
    <div class="row" style="justify-content:space-between;margin-top:16px">${criar ? '<a class="small muted" href="#" data-mode="entrar">Já tenho conta</a>' : '<a class="small muted" href="#" id="forgot">Esqueci minha senha</a>'}${criar ? '' : '<a class="small muted" href="#" data-mode="criar">Criar conta</a>'}</div>
    <p class="small dim" style="margin-top:16px">Dica: deixe o navegador salvar sua senha. No celular, ele preenche com a sua digital ou o seu rosto.</p>
  </div>`;
  $$('[data-mode]').forEach(b => b.onclick = e => { e.preventDefault(); login('', b.dataset.mode); });
  $$('[data-em]').forEach(b => b.onclick = () => { emails = b.dataset.em === '1'; $$('[data-em]').forEach(x => x.classList.toggle('on', x === b)); });
  const remember = () => LS.set('pg_remember', $('#rem').checked ? '1' : '0');
  const PT = m => /Invalid login/i.test(m) ? 'E-mail ou senha incorretos.' : /not confirmed/i.test(m) ? 'Confirme seu e-mail primeiro: abra o link que enviamos (veja também o spam).' : /already registered|already been registered/i.test(m) ? 'Este e-mail já tem conta. Use "Entrar" ou "Esqueci minha senha".' : /Password should be/i.test(m) ? 'A senha precisa ter pelo menos 8 caracteres.' : /rate limit/i.test(m) ? 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.' : m;
  $('#gg') && ($('#gg').onclick = async () => { remember(); const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: SITE_URL } }); if (error) login(PT(error.message), mode); });
  $('#forgot') && ($('#forgot').onclick = async e => { e.preventDefault(); const em = $('#em').value.trim(); if (!em) return toast('Digite seu e-mail primeiro.'); const { error } = await sb.auth.resetPasswordForEmail(em, { redirectTo: SITE_URL }); login(error ? PT(error.message) : `Enviamos um link para ${em}. Abra o e-mail para criar uma senha nova.`, 'entrar'); });
  $('#go').onclick = async () => {
    const em = $('#em').value.trim(), pw = $('#pw').value;
    if (!em || !pw) return toast('Preencha e-mail e senha.');
    remember(); $('#go').innerHTML = '<span class="spin"></span>';
    if (criar) {
      if (pw.length < 8) { $('#go').textContent = 'Criar minha conta'; return toast('A senha precisa ter pelo menos 8 caracteres.'); }
      const { data, error } = await sb.auth.signUp({ email: em, password: pw, options: { data: { name: $('#nm').value.trim(), emails }, emailRedirectTo: SITE_URL } });
      if (error) return login(PT(error.message), 'criar');
      if (data.session) return location.reload();
      return login(`Quase lá! Enviamos um e-mail de confirmação para ${em}. Clique no link (veja também o spam) e depois entre aqui.`, 'entrar');
    }
    const { error } = await sb.auth.signInWithPassword({ email: em, password: pw });
    if (error) return login(PT(error.message), 'entrar');
    location.reload();
  };
}
function newPasswordScreen() {
  $('#topbar').hidden = true; $('#tabbar').hidden = true;
  app.innerHTML = `<div class="login panel"><div class="brand" style="font-size:30px"><em>IA</em>lvorecer<span>.</span></div><h3 style="margin:16px 0 12px">Crie uma senha nova</h3>
    <div class="field"><label>Nova senha (mínimo 8 caracteres)</label><input id="np" type="password" autocomplete="new-password"></div>
    <button class="btn btn-pink" id="sv" style="width:100%;justify-content:center">Salvar senha</button></div>`;
  $('#sv').onclick = async () => { const p = $('#np').value; if (p.length < 8) return toast('Mínimo de 8 caracteres.'); const { error } = await sb.auth.updateUser({ password: p }); if (error) return toast('⚠️ ' + error.message, 6000); toast('Senha alterada ✓'); location.hash = '#/'; location.reload(); };
}

// ---------- INÍCIO DO APP ----------
// Barra da leitura em voz alta: aparece sempre que a IA está lendo e deixa pausar, continuar ou parar
function vozBar() {
  let bar = null;
  onSpeechState(st => {
    if (st === 'idle') { bar?.remove(); bar = null; return; }
    if (!bar) {
      document.body.insertAdjacentHTML('beforeend', `<div class="vozbar" role="region" aria-label="Leitura em voz alta"><span class="vz-txt"></span><button class="btn btn-pink btn-sm" data-vz="toggle"></button><button class="btn btn-ghost btn-sm" data-vz="stop"><i data-lucide="square"></i> Parar</button></div>`);
      bar = document.body.lastElementChild;
      bar.addEventListener('click', e => {
        const b = e.target.closest('[data-vz]'); if (!b) return;
        if (b.dataset.vz === 'stop') stopSpeaking(); else if (speechState() === 'paused') resumeSpeaking(); else pauseSpeaking();
      });
    }
    bar.querySelector('.vz-txt').textContent = st === 'paused' ? 'Leitura pausada' : 'Lendo em voz alta…';
    bar.querySelector('[data-vz="toggle"]').innerHTML = st === 'paused' ? '<i data-lucide="play"></i> Continuar' : '<i data-lucide="pause"></i> Pausar';
  });
}

async function boot() {
  initFx();
  vozBar();
  document.addEventListener('click', e => { const b = e.target.closest('[data-fb]'); if (b) { e.preventDefault(); openFeedback(b.dataset.fb); } if (e.target.closest('[data-reload]')) location.reload(); if (e.target.closest('[data-back]')) history.back(); const cp = e.target.closest('[data-copy]'); if (cp) { navigator.clipboard.writeText(cp.dataset.copy); cp.textContent = 'Copiado ✓'; } const ag = e.target.closest('[data-agenda]'); if (ag) { e.preventDefault(); openAgendaConversa(ag.dataset.agenda || ''); } const ii = e.target.closest('[data-iainfo]'); if (ii) { e.preventDefault(); iaInfo(ii.dataset.iainfo); } if (e.target.closest('[data-comoentrar]')) { e.preventDefault(); comoEntrar(); } });
  window.addEventListener('ia-uso', () => document.querySelectorAll('.ia-meter').forEach(el => el.outerHTML = iaMeterHTML()));
  C = await (await fetch('data/catalog.json', { cache: 'no-cache' })).json();
  const qs = new URLSearchParams(location.search);
  const demo = qs.has('demo') || qs.has('visita');
  if (demo) {
    const { demoData, demoAI } = await import('./demo.js?v=63');
    S = new DemoStore(() => demoData(C)); S.demoAI = demoAI;
    if (qs.has('visita')) S.readonly = true;
    document.body.insertAdjacentHTML('beforeend', S.readonly ? '<a class="demo-badge" href="./">👁 Modo visitante · Criar conta</a>' : '<div class="demo-badge">DEMONSTRAÇÃO</div>');
  } else {
    sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storage: authStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    let recovering = /type=recovery/.test(location.hash);
    sb.auth.onAuthStateChange(ev => { if (ev === 'PASSWORD_RECOVERY') { recovering = true; newPasswordScreen(); } });
    const { data: { session } } = await sb.auth.getSession();
    if (/access_token|error_description|type=/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search + '#/');
    if (recovering && session) return newPasswordScreen();
    if (!session) { const err = new URLSearchParams(location.hash.slice(1)).get('error_description'); return login(err || ''); }
    S = new SupabaseStore(sb, session.user);
    S.onError = e => toast('⚠️ ' + e.message, 6000);
  }
  await S.load(C);
  if (S.readonly) { S.state.profile.name = ''; S.state.career = null; }
  S.iaUso = { n: S.isDemo ? 12 : 0 };
  if (sb && !S.isDemo) { try { const { data } = await sb.rpc('meu_uso_ia'); S.iaUso.n = +data || 0; } catch { } }
  if (sb && !S.isDemo) { S.sbUrl = SUPABASE_URL; S.sbKey = SUPABASE_KEY; } else S.aiProxy = null;
  AI = makeAI(S);
  initSaude({ S, AI, app, toast, spinner, errBox, setCleanup: f => cleanup = f, rerender: () => router() });
  setTimeout(startAgua, 2000);
  // (cliques de avaliação/erro tratados no início do boot)
  $('#topbar').hidden = false; $('#tabbar').hidden = false;
  document.body.insertAdjacentHTML('beforeend', '<button class="fab" id="fab">✦ Falar com o IAlvorecer</button>');
  $('#fab').onclick = () => toggleAssistant();
  { const tr = $('.topright'); if (tr) { tr.insertAdjacentHTML('afterbegin', '<button type="button" class="iconbtn" id="vozBtn" title="Assistente de voz" aria-label="Assistente de voz"><i data-lucide="mic"></i></button>'); $('#vozBtn').onclick = abrirVozAssistente; try { lucide.createIcons(); } catch { } } }
  visualConta();
  window.IAPers && IAPers.topo();
  $('#areasBtn').onclick = () => openAreas();
  $('#avatar').textContent = (S.state.profile.name || 'A')[0].toUpperCase();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') S.flush(); });
  window.addEventListener('beforeunload', e => { if (Object.keys(S.timers).length) { S.flush(); e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('hashchange', router);
  if (S.isNew && !location.hash.includes('boas-vindas')) location.hash = '#/boas-vindas';
  router();
}
boot().catch(e => { console.error(e); app.innerHTML = errBox(e); });
