// Voz dentro do chat do IAlvorecer: microfone para falar e fone para ouvir as respostas. Só carrega quando o chat abre.
import { listen, canListen, canSpeak, speak, stopSpeaking, pauseSpeaking, resumeSpeaking, speechState, onSpeechState, vozPref } from './speech.js?v=69';
export { acharDestino } from './voz.js?v=70';

const IC = {
  fone: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  pausa: '<path d="M9 5v14M15 5v14"/>', play: '<path d="M7 4l12 8-12 8z"/>'
};
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
let atual = null, parar = null, off = null; // mensagem sendo lida e microfone ativo

export function pintar() {
  const e = speechState();
  document.querySelectorAll('#asstM [data-ouvir]').forEach(b => {
    const meu = atual && b.dataset.texto === atual;
    const k = meu && e === 'playing' ? 'pausa' : meu && e === 'paused' ? 'play' : 'fone';
    b.innerHTML = svg(IC[k]); b.title = k === 'pausa' ? 'Pausar' : k === 'play' ? 'Continuar' : 'Ouvir'; b.setAttribute('aria-label', b.title);
  });
}
export function ouvir(texto, idioma) {
  const e = speechState();
  if (atual === texto && e === 'playing') return pauseSpeaking();
  if (atual === texto && e === 'paused') return resumeSpeaking();
  atual = texto; speak(texto, idioma).then(() => { if (atual === texto) { atual = null; pintar(); } }); pintar();
}
export function iniciar({ mic, ta, idioma, enviar, toast }) {
  off?.(); off = onSpeechState(pintar);
  mic.onclick = () => {
    if (parar) return parar();
    if (!canListen) return toast('Seu navegador não ouve áudio. Use Chrome ou Edge (no iPhone, Safari). Você pode digitar.', 6000);
    stopSpeaking(); const antes = ta.placeholder; ta.value = ''; ta.placeholder = 'Estou ouvindo…'; mic.classList.add('on');
    let ultimo = '', ant = '', t = 0;
    const fim = () => { clearInterval(iv); parar = null; mic.classList.remove('on'); ta.placeholder = antes; };
    const stop = listen(idioma, {
      onText: (f, p) => { ultimo = f; ta.value = (f + ' ' + p).trim(); },
      onEnd: f => { fim(); if (!ta.isConnected) return; const txt = (f || ultimo || ta.value).trim(); if (txt) { ta.value = txt; enviar(); } },
      onError: m => { fim(); toast(m, 5000); }
    });
    // para sozinho depois de uma pausa na fala
    const iv = setInterval(() => { if (!ta.isConnected) return parar?.(); if (ta.value && ta.value === ant) { if (++t >= 3) parar?.(); } else t = 0; ant = ta.value; }, 700);
    parar = stop;
  };
}
export const lerSempre = () => !!vozPref().sempre;
export function desligar() { stopSpeaking(); parar?.(); off?.(); off = null; atual = null; }
