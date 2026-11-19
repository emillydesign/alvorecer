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

export function speak(text, locale, rate = 1) {
  if (!canSpeak || !text) return Promise.resolve();
  speechSynthesis.cancel();
  return new Promise(res => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale; const v = bestVoice(locale); if (v) u.voice = v;
    u.rate = rate; u.onend = u.onerror = () => res();
    speechSynthesis.speak(u);
  });
}
export const stopSpeaking = () => canSpeak && speechSynthesis.cancel();

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
