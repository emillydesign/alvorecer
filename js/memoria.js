// Memória geral: o IAlvorecer pode usar o que a pessoa já contou em um curso ou área nos outros.
// Arquivo à parte: só carrega quando precisa (Ajustes, boas-vindas, assistente ou Cuidados).
// A pessoa escolhe: ligada ou desligada. Quando desligada, nada é cruzado entre cursos.
import { esc } from './util.js';

export const memoriaLigada = S => S?.config?.memoria === true;

// Resumo curto do que a pessoa contou, para a IA usar como contexto. Só os gostos e objetivos, nunca fotos nem senhas.
export function resumo(S) {
  if (!memoriaLigada(S)) return null;
  const P = S.state?.profile || {}, pr = P.prefs || {};
  const r = {};
  if (pr.goals?.length) r.objetivos = pr.goals;
  if (pr.interests?.length) r.interesses = pr.interests;
  if (P.area) r.area_ou_profissao = P.area;
  const cu = S.state?.cuidados || {}, c = {};
  for (const [id, a] of Object.entries(cu)) { const x = a?.resp; if (x && Object.keys(x).length) { const { extra, ...resto } = x; const f = Object.fromEntries(Object.entries(resto).filter(([, v]) => v && v.length)); if (extra) f.observacao = String(extra).slice(0, 300); if (Object.keys(f).length) c[id] = f; } }
  if (Object.keys(c).length) r.cuidados_e_gostos = c;
  if (S.config?.sobreMim) r.sobre_mim_escrito_pela_pessoa = String(S.config.sobreMim).slice(0, 1200);
  return Object.keys(r).length ? r : null;
}
export const linhaParaPrompt = S => { const r = resumo(S); return r ? `\nMEMÓRIA GERAL (a pessoa autorizou usar o que contou em outros cursos e áreas; use com naturalidade e só quando ajudar, sem repetir tudo): ${JSON.stringify(r)}` : ''; };

const TEXTO_CURTO = 'Deixe o IAlvorecer lembrar do que você conta em um curso ou conversa para ajudar melhor nos outros. Você escolhe.';

export function entenda(openInfo) {
  openInfo(`<div class="eyebrow">Memória geral</div><h2 style="margin:10px 0 12px">Como funciona</h2>
    <p>Quando ligada, o IAlvorecer junta o que você já contou (seus objetivos, interesses, gostos e respostas das áreas de Cuidados, como tipo de pele ou músicas que você ama) e usa isso como contexto nas outras conversas e cursos. Assim você não precisa explicar tudo de novo.</p>
    <ul style="margin:12px 0 12px 18px"><li>Nada é vendido nem compartilhado: fica só na sua conta.</li><li>Fotos e senhas nunca entram na memória.</li><li>Você pode desligar quando quiser, e o que o IAlvorecer cruza entre cursos para na hora.</li><li>Se quiser puxar algo de outro curso, é só mencionar na conversa.</li></ul>
    <p class="small muted">Se você usa a sua própria IA (por exemplo Gemini), o IAlvorecer não consegue ler as conversas antigas dela. Por isso existe o campo “Sobre mim”: cole ali o resumo que você já usa e ele entra como contexto, se a memória estiver ligada.</p>
    <div class="row" style="margin-top:18px"><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-close>Entendi</button></div>`);
}

// Bloco de escolha (Ajustes e boas-vindas)
export function memoriaHTML(S, { compacto = false } = {}) {
  const on = memoriaLigada(S), cf = S.config || {};
  return `<div class="panel" style="margin-bottom:18px"><h3 style="margin-bottom:6px">Memória geral</h3>
    <p class="small muted" style="margin-bottom:12px">${esc(TEXTO_CURTO)} <button type="button" class="linklike" data-mem-info style="text-decoration:underline;background:none;color:inherit;font-size:inherit">Entenda mais</button></p>
    <label class="check small" style="margin-bottom:10px"><input type="checkbox" id="memOn" style="width:auto" ${on ? 'checked' : ''}> Lembrar do que eu conto entre cursos e conversas</label>
    ${compacto ? '' : `<div class="field" id="memSobre" ${on ? '' : 'hidden'}><label>Sobre mim (opcional)</label><textarea id="memTxt" rows="3" placeholder="Ex.: sou designer, estudo à noite, já uso IA no trabalho e prefiro explicações curtas…">${esc(cf.sobreMim || '')}</textarea><div class="help">Se você já usa outra IA, cole aqui o resumo que ela tem de você, para não explicar tudo de novo. Também vale para quem trabalha com IA e quer ir direto ao ponto.</div></div>`}</div>`;
}
export function ligar(root, { S, openInfo, toast }) {
  const guardar = () => { try { S.saveConfig(); } catch { } };
  root.querySelector('[data-mem-info]')?.addEventListener('click', () => entenda(openInfo));
  const chk = root.querySelector('#memOn');
  chk?.addEventListener('change', () => { S.config.memoria = chk.checked; const b = root.querySelector('#memSobre'); if (b) b.hidden = !chk.checked; guardar(); toast(chk.checked ? 'Memória geral ligada' : 'Memória geral desligada'); });
  const t = root.querySelector('#memTxt');
  t?.addEventListener('change', () => { S.config.sobreMim = t.value.trim().slice(0, 1200); guardar(); });
}
