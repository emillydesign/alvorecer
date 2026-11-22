// Dias de estudo e de conversação. Arquivo à parte: só carrega quando a pessoa abre essa escolha.
import { esc } from './util.js';

export const NOMES = [[1, 'Segunda'], [2, 'Terça'], [3, 'Quarta'], [4, 'Quinta'], [5, 'Sexta'], [6, 'Sábado'], [0, 'Domingo']];
export const PADRAO = { days: [1, 2, 3, 4, 5], holidays: false };
export const AVISO = 'É importante ter pelo menos 1 dia de descanso do trabalho e/ou dos estudos: é no descanso que o conteúdo fixa melhor.';

export function normalizar(c) {
  const days = Array.isArray(c?.days) ? [...new Set(c.days.map(Number).filter(n => n >= 0 && n <= 6))] : [...PADRAO.days];
  return { days, holidays: !!c?.holidays };
}

export function resumo(c) {
  const { days, holidays } = normalizar(c);
  const nomes = NOMES.filter(([n]) => days.includes(n)).map(([, l]) => l.slice(0, 3).toLowerCase());
  if (!nomes.length) return 'Nenhum dia escolhido';
  const fim = days.includes(6) || days.includes(0);
  return `${nomes.join(', ')}${holidays ? ', feriados incluídos' : fim ? '' : ' (fins de semana e feriados são de descanso)'}`;
}

// Caixinhas de dias da semana + feriados. `id` separa uma escolha da outra na mesma tela.
export function caixinhas(id, c) {
  const { days, holidays } = normalizar(c);
  return `<div class="dias-grid">${NOMES.map(([n, l]) => `<label class="dia-chk"><input type="checkbox" data-dias="${esc(id)}" value="${n}" ${days.includes(n) ? 'checked' : ''}> ${l}</label>`).join('')}
    <label class="dia-chk"><input type="checkbox" data-feriados="${esc(id)}" ${holidays ? 'checked' : ''}> Feriados</label></div>
    <p class="help dias-aviso" data-aviso="${esc(id)}" style="margin-top:10px">${esc(AVISO)}</p>`;
}

export function ler(root, id) {
  const days = [...root.querySelectorAll(`[data-dias="${id}"]`)].filter(i => i.checked).map(i => +i.value);
  const holidays = !!root.querySelector(`[data-feriados="${id}"]`)?.checked;
  return { days, holidays };
}

// Atualiza o aviso conforme a pessoa marca ou desmarca (sem dia de descanso, pede cuidado).
export function vigiar(root, id) {
  const av = root.querySelector(`[data-aviso="${id}"]`); if (!av) return;
  const atualiza = () => {
    const { days, holidays } = ler(root, id);
    av.textContent = days.length === 7 && holidays ? 'Assim você ficaria sem nenhum dia de descanso. Tente deixar pelo menos 1 dia livre: o descanso ajuda o conteúdo a fixar melhor.' : days.length === 0 ? 'Marque pelo menos um dia para estudar. ' + AVISO : AVISO;
    av.classList.toggle('alerta', (days.length === 7 && holidays) || days.length === 0);
  };
  root.querySelectorAll(`[data-dias="${id}"],[data-feriados="${id}"]`).forEach(i => i.addEventListener('change', atualiza));
  atualiza();
}

// Janela "Dias de estudo" (abre em Ajustes e no pop-up Começar).
export function abrirDias({ S, openInfo, toast, aplicar, aoSalvar }) {
  const atual = normalizar(S.state.profile?.prefs?.studyDays);
  const ov = openInfo(`<div class="eyebrow">Dias de estudo</div><h2 style="margin:10px 0 8px">Em quais dias você quer estudar?</h2>
    <p class="muted" style="margin-bottom:16px">Por padrão, fins de semana e feriados são de descanso: pensado para quem trabalha muito e só tem tempo de estudar durante a semana. Marque as caixinhas dos dias que combinam com você. As aulas, o cronograma e os lembretes seguem essa escolha.</p>
    ${caixinhas('est', atual)}
    <p class="help" style="margin-top:12px">A conversação tem os próprios dias, que você escolhe em "Marcar conversação".</p>
    <div class="row" style="margin-top:20px"><button class="btn btn-pink" id="dsSave">Salvar</button><button class="btn btn-ghost" data-close>Cancelar</button></div>`);
  vigiar(ov, 'est');
  ov.querySelector('#dsSave').onclick = async () => {
    if (S.readonly) return toast('Modo visitante: crie sua conta para salvar seus dias de estudo.');
    const c = ler(ov, 'est');
    if (!c.days.length) return toast('Marque pelo menos um dia para estudar.');
    const P = S.state.profile ||= {};
    P.prefs = { ...(P.prefs || {}), studyDays: c };
    S.config.diasEstudo = { dias: c.days, feriados: c.holidays }; // cópia para os e-mails
    aplicar(c); S.saveState(); S.saveConfig(); if (S.flush) await S.flush();
    ov.remove(); aoSalvar?.(c);
    toast('Dias de estudo salvos: ' + resumo(c), 5000);
  };
}
