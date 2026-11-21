// Voz: o navegador ouve (microfone → texto) e fala (texto → voz). Grátis, sem servidor.
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = !!SR;
export const canSpeak = 'speechSynthesis' in window;

let voices = [];
function loadVoices() { voices = canSpeak ? speechSynthesis.getVoices() : []; }
if (canSpeak) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

function bestVoice(locale) {
  const lang = locale.slice(0, 2);
  const cands = voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(lang));
  const score = v => (v.lang.replace('_', '-') === locale ? 4 : 0) + (/natural|neural|online|google|premium|enhanced/i.test(v.name) ? 3 : 0) + (/female|samantha|aria|jenny|zira|paulina|monica/i.test(v.name) ? 1 : 0);
  return cands.sort((a, b) => score(b) - score(a))[0];
}

// ---- Fala com pausa: lê em pedaços curtos, então dá para pausar, continuar e parar em qualquer navegador ----
let session = 0, queue = [], idx = 0, cfg = { locale: 'pt-BR', rate: 1 }, finishCb = null, state = 'idle';
const listeners = new Set();
const setState = st => { state = st; listeners.forEach(f => { try { f(st); } catch { } }); };
export const onSpeechState = f => { listeners.add(f); return () => listeners.delete(f); };
export const speechState = () => state;

// aceita um texto, ou uma lista de { t: texto, l: idioma } para misturar idiomas na mesma leitura
function toChunks(input, locale) {
  const segs = Array.isArray(input) ? input : [{ t: input, l: locale }];
  const out = [];
  for (const sg of segs) {
    const txt = String(sg.t || '').replace(/\s+/g, ' ').trim();
    if (!txt) continue;
    const parts = txt.match(/[^.!?…;:]+[.!?…;:]*\s*/g) || [txt];
    let buf = '';
    for (const p of parts) {
      if (buf && (buf + p).length > 180) { out.push({ t: buf.trim(), l: sg.l || locale }); buf = p; } else buf += p;
    }
    if (buf.trim()) out.push({ t: buf.trim(), l: sg.l || locale });
  }
  return out;
}
function finish(my) { if (my !== session) return; const cb = finishCb; finishCb = null; setState('idle'); cb?.(); }
function next(my) {
  if (my !== session || state !== 'playing') return;
  if (idx >= queue.length) return finish(my);
  const c = queue[idx];
  const u = new SpeechSynthesisUtterance(c.t);
  u.lang = c.l; const v = bestVoice(c.l); if (v) u.voice = v;
  u.rate = cfg.rate;
  const adv = () => { if (my === session && state === 'playing') { idx++; next(my); } };
  u.onend = adv;
  u.onerror = e => { if (e.error !== 'canceled' && e.error !== 'interrupted') adv(); };
  speechSynthesis.speak(u);
}
export function speak(text, locale, rate = 1) {
  if (!canSpeak || !text) return Promise.resolve();
  stopSpeaking();
  const my = ++session;
  queue = toChunks(text, locale); idx = 0; cfg = { locale, rate };
  if (!queue.length) return Promise.resolve();
  return new Promise(res => { finishCb = res; setState('playing'); next(my); });
}
export function pauseSpeaking() {
  if (!canSpeak || state !== 'playing') return;
  setState('paused'); speechSynthesis.cancel(); // volta ao começo da frase atual ao continuar
}
export function resumeSpeaking() {
  if (!canSpeak || state !== 'paused') return;
  setState('playing'); next(session);
}
export function stopSpeaking() {
  if (!canSpeak) return;
  session++; queue = []; idx = 0;
  speechSynthesis.cancel();
  const cb = finishCb; finishCb = null;
  if (state !== 'idle') setState('idle');
  cb?.();
}

// Liga o microfone. onText(textoFinal, textoParcial). Retorna função para parar.
export function listen(locale, { onText, onEnd, onError }) {
  if (!SR) { onError?.('Seu navegador não ouve áudio. Use Chrome ou Edge (no celular: Chrome no Android, Safari no iPhone).'); return () => {}; }
  const rec = new SR();
  rec.lang = locale; rec.continuous = true; rec.interimResults = true;
  let finalText = '', stopped = false;
  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript + ' '; else interim += r[0].transcript;
    }
    onText?.(finalText.trim(), interim);
  };
  rec.onerror = e => { if (e.error === 'not-allowed') onError?.('Permita o uso do microfone para este site.'); else if (e.error !== 'no-speech' && e.error !== 'aborted') onError?.('Erro no microfone: ' + e.error); };
  rec.onend = () => { if (!stopped) { try { rec.start(); return; } catch { } } onEnd?.(finalText.trim()); };
  try { rec.start(); } catch (e) { onError?.(String(e)); }
  return () => { stopped = true; try { rec.stop(); } catch { } };
}
