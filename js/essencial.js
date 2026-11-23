// "O essencial para aprender primeiro": plano básico na tela inicial. Arquivo à parte: só carrega quando a tela inicial abre.
export function essencialHTML({ C, S, esc, icoOf, grad }) {
  const E = C.essencial; if (!E) return '';
  const achar = k => { const id = k.replace(/^trk:/, ''); for (const t of Object.values(C.tracks)) { const c = t.courses.find(x => x.id === id); if (c) return c; } return null; };
  const feitas = k => Object.keys(S.state.courses?.[k]?.done || {}).length;
  const itens = E.itens.map((it, i) => { const c = achar(it.k); if (!c) return ''; const f = feitas(it.k), n = (c.lessons || []).length, ini = f > 0;
    return `<a class="task" href="#/curso/${esc(it.k)}" style="text-align:left;display:flex;gap:14px;align-items:center"><span class="aic" style="${grad(c.g)};width:44px;height:44px;border-radius:14px;display:grid;place-items:center;flex:none">${icoOf(c.icon)}</span><span style="flex:1;min-width:0"><div class="t"><span class="dim">${i + 1}.</span> ${esc(c.title)}</div><div class="s">${esc(it.por)}</div></span><span class="small dim" style="flex:none">${ini ? f + '/' + n + ' aulas' : 'Começar'}</span></a>`; }).join('');
  return `<div class="section-head"><div><div class="eyebrow">Comece por aqui</div><h2 style="margin-top:8px">${esc(E.titulo)}</h2></div></div>
    <p class="muted" style="max-width:720px;margin-bottom:18px">${esc(E.texto)}</p><div style="display:flex;flex-direction:column;gap:10px">${itens}</div>`;
}
