// Avaliações do chat: viram exemplos curtos para a IA se adaptar a cada pessoa. Ficam na conta dela, junto da conversa.
export const MOTIVOS = ['Não entendeu', 'Informação errada', 'Muito longa', 'Muito curta', 'Confusa', 'Não ajudou'];
const MAX = 30;
const corta = (t, n) => String(t || '').replace(/\s+/g, ' ').trim().slice(0, n);

export function registrar(lista, m, pedido) {
  const resto = lista.filter(x => x.id !== m.aid);
  if (!m.voto) return resto;
  return [...resto, { id: m.aid, v: m.voto, motivo: m.motivo || '', pedido: corta(pedido, 160), resposta: corta(m.text, 260) }].slice(-MAX);
}
// mensagens excluídas: os trechos somem; só o motivo da negativa continua
export function esquecer(lista, excluidas) {
  const ids = new Set(), ver = ms => ms.forEach(m => { if (m.aid) ids.add(m.aid); (m.vers || []).forEach(v => ver(v?.resto || [])); });
  ver(excluidas);
  return lista.map(x => ids.has(x.id) ? { ...x, pedido: '', resposta: '' } : x).filter(x => x.resposta || x.motivo);
}
export function paraIA(lista) {
  if (!lista.length) return null;
  const motivos = {};
  lista.forEach(x => { if (x.v === -1 && MOTIVOS.includes(x.motivo)) motivos[x.motivo] = (motivos[x.motivo] || 0) + 1; });
  const ex = v => lista.filter(x => x.v === v && x.resposta).slice(-4).map(({ motivo, pedido, resposta }) => ({ pedido, resposta, ...(motivo ? { motivo } : {}) }));
  return { positivas: ex(1), negativas: ex(-1), motivos_negativos: motivos };
}
