// Preparo das aulas: continuidade entre aulas e quando vale a pena criar a próxima antes de a pessoa pedir.
// Arquivo à parte: só é carregado quando uma aula ou um curso é aberto.

// Curso pronto (trilhas): igual para qualquer pessoa, então a aula é criada uma vez só e servida pronta para os outros.
export const aberto = d => d.kind === 'trk';

// Texto de continuidade para a IA. ls = aulas do curso; i = posição da aula que será criada.
// Em curso aberto usa só os TÍTULOS do curso (iguais para todos, senão o cache compartilhado não funciona).
// Em curso pessoal usa também os termos que a pessoa viu na aula anterior (mem = aulas já carregadas).
export function continuidade(ls, i, { shared = false, mem = {}, key = '' } = {}) {
  if (!ls || i < 0) return { before: '', next: '' };
  const prev = ls.slice(Math.max(0, i - 2), i);
  const before = prev.length
    ? 'Aulas anteriores: ' + prev.map(p => {
        const les = shared ? null : mem[key + '|' + (p.cacheId || p.id)];
        const termos = (les?.vocab || []).slice(0, 6).map(v => v.term).filter(Boolean);
        return `"${p.title}"${termos.length ? ` (viu: ${termos.join(', ')})` : ''}`;
      }).join('; ') + '.'
    : '';
  return { before, next: ls[i + 1]?.title || '' };
}

// Criar a próxima aula antes pede uma chamada de IA; não vale se a pessoa já está perto do limite do dia.
export function podePreparar(S, limite) {
  if (S.isDemo || !navigator.onLine) return false;
  return (S.iaUso?.n || 0) < limite - 10;
}
