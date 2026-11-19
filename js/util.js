// Utilidades: HTML, datas, feriados, markdown, repetição espaçada
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---------- datas ----------
const pad = n => String(n).padStart(2, '0');
export const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const ym = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
export const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
export const today = () => ymd();
export const weekday = (s = today()) => parseYmd(s).getDay(); // 0 dom … 6 sáb
export const fmtDay = s => parseYmd(s).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
export const fmtShort = s => parseYmd(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
export const fmtMonth = s => { const [y, m] = s.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }); };
export const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 864e5);

function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return ymd(new Date(y, month - 1, day));
}
const HOL_FIXED = { '01-01': 'Confraternização Universal', '04-21': 'Tiradentes', '05-01': 'Dia do Trabalho', '09-07': 'Independência', '10-12': 'Nossa Senhora Aparecida', '11-02': 'Finados', '11-15': 'Proclamação da República', '11-20': 'Consciência Negra', '12-24': 'Véspera de Natal', '12-25': 'Natal', '12-31': 'Véspera de Ano-Novo' };
export function holiday(s) {
  const md = s.slice(5);
  if (HOL_FIXED[md]) return HOL_FIXED[md];
  const e = easter(+s.slice(0, 4));
  if (s === addDays(e, -48) || s === addDays(e, -47)) return 'Carnaval';
  if (s === addDays(e, -2)) return 'Sexta-feira Santa';
  if (s === addDays(e, 60)) return 'Corpus Christi';
  return null;
}
export const isRestDay = (s = today()) => { const w = weekday(s); return w === 0 || w === 6 || !!holiday(s); };
export function prevStudyDay(s) { let d = addDays(s, -1); for (let i = 0; i < 20 && isRestDay(d); i++) d = addDays(d, -1); return d; }
export function weekStart(s = today()) { const w = weekday(s); return addDays(s, -((w + 6) % 7)); } // segunda

// ---------- markdown mínimo ----------
export function md(src) {
  if (!src) return '';
  const inline = t => esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  const lines = String(src).replace(/\r/g, '').split('\n');
  let out = '', list = null;
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  for (const raw of lines) {
    const l = raw.trimEnd();
    let m;
    if (!l.trim()) { close(); continue; }
    if ((m = l.match(/^#{1,4}\s+(.*)/))) { close(); out += `<h3>${inline(m[1])}</h3>`; continue; }
    if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { if (list !== 'ul') { close(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { close(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(m[1])}</li>`; continue; }
    close(); out += `<p>${inline(l)}</p>`;
  }
  close();
  return out;
}

// ---------- comparação de respostas ----------
export const norm = s => String(s ?? '').toLowerCase().normalize('NFKC').replace(/[’‘]/g, "'").replace(/[.,!?¡¿;:"“”()]/g, '').replace(/\s+/g, ' ').trim();

// ---------- repetição espaçada (SM-2 simplificado) ----------
// grade: 0 errei, 1 difícil, 2 bom, 3 fácil
export function schedule(card, grade, day = today()) {
  const c = { ease: 2.5, interval: 0, reps: 0, lapses: 0, ...card };
  if (grade === 0) { c.reps = 0; c.lapses++; c.interval = 1; c.ease = Math.max(1.3, c.ease - 0.2); }
  else {
    c.reps++;
    if (c.reps === 1) c.interval = grade === 3 ? 4 : grade === 1 ? 1 : 2;
    else if (c.reps === 2) c.interval = grade === 3 ? 8 : grade === 1 ? 3 : 6;
    else c.interval = Math.round(c.interval * (grade === 1 ? 1.2 : grade === 3 ? c.ease * 1.3 : c.ease));
    c.ease = Math.max(1.3, c.ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
  }
  c.due = addDays(day, c.interval);
  c.last = day;
  return c;
}
export const isDue = (card, day = today()) => !card.due || card.due <= day;
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
