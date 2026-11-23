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

// Cuidados essenciais em etapas (sono, água, comida, exercício, sol, estresse, depois pele e rotina)
export function cuidadosHTML({ C, esc }) {
  const E = C.cuidadosEssenciais; if (!E) return '';
  return `<div class="section-head"><div><div class="eyebrow">${esc(E.eyebrow)}</div><h2 style="margin-top:8px">${esc(E.titulo)}</h2></div></div>
    <p class="muted" style="max-width:720px;margin-bottom:18px">${esc(E.texto)}</p>
    <div style="display:flex;flex-direction:column;gap:10px">${E.etapas.map((e, i) => `<a class="task" href="${esc(e.h)}" style="text-align:left;display:flex;gap:14px;align-items:center"><b style="width:34px;height:34px;border-radius:50%;display:grid;place-items:center;flex:none;border:1px solid var(--line2)">${i + 1}</b><span style="flex:1;min-width:0"><div class="t">${esc(e.t)}</div><div class="s">${esc(e.por)}</div></span></a>`).join('')}</div>`;
}
// Destaque: tempo livre e trabalho melhor + mentoria de carreira
export function tempoHTML({ C, esc }) {
  const T = C.tempo; if (!T) return '';
  return `<div class="cta-band" style="display:block"><div class="eyebrow">${esc(T.eyebrow)}</div><h2 style="margin:8px 0 10px">${esc(T.titulo)}</h2><p class="muted" style="max-width:760px;margin-bottom:18px">${esc(T.texto)}</p>
    <div class="row" style="gap:10px;flex-wrap:wrap"><a class="btn btn-pink" href="#/tempo">Montar meu caminho para mais tempo livre</a><a class="btn btn-ghost" href="#/mentoria">Mentoria de carreira</a><a class="btn btn-ghost" href="#/agenda">Minha agenda</a></div></div>`;
}

// Início do site, em coluna: os cursos mais essenciais em destaque, cuidados essenciais, o diferencial no meio e a continuação.
export function homeHTML({ C, S, esc, icoOf, grad, saudacao, dia }) {
  const E = C.essencial, CE = C.cuidadosEssenciais, T = C.tempo; if (!E) return '';
  const achar = k => { const id = k.replace(/^trk:/, ''); for (const t of Object.values(C.tracks)) { const c = t.courses.find(x => x.id === id); if (c) return c; } return null; };
  const feitas = k => Object.keys(S.state.courses?.[k]?.done || {}).length;
  const lista = E.itens.map((it, i) => ({ ...it, i, c: achar(it.k) })).filter(x => x.c);
  const topo = lista.slice(0, 3), resto = lista.slice(3);
  const prog = x => { const f = feitas(x.k), n = (x.c.lessons || []).length; return f > 0 ? `${f}/${n} aulas` : 'Começar'; };
  const grande = x => `<a class="ess-big" href="#/curso/${esc(x.k)}" style="${grad(x.c.g)}"><span class="ess-n">${x.i + 1}</span><span class="ess-ic">${icoOf(x.c.icon)}</span><span class="ess-tx"><b>${esc(x.c.title)}</b><small>${esc(x.por)}</small></span><span class="ess-go">${esc(prog(x))}</span></a>`;
  const leve = x => `<a class="ess-low" href="#/curso/${esc(x.k)}"><span class="ess-n2">${x.i + 1}</span><span class="ess-ic2">${icoOf(x.c.icon)}</span><span class="ess-tx2"><b>${esc(x.c.title)}</b><small>${esc(x.por)}</small></span><span class="ess-go2">${esc(prog(x))}</span></a>`;
  return `
  <div class="home-in">
    <div class="eyebrow">${esc(dia)}</div>
    <h1 class="home-h">${esc(saudacao)}.<br><span class="grad">Comece por aqui.</span></h1>
    <p class="home-lead">${esc(E.texto)}</p>
  </div>
  <div class="home-bloco"><div class="ess-grande">${topo.map(grande).join('')}</div></div>

  <div class="home-liga">Mas aprender não basta: o corpo e a mente precisam estar bem. Veja o básico, nesta ordem.</div>

  <div class="home-bloco">
    <div class="eyebrow">${esc(CE.eyebrow)}</div><h2 class="home-h2">${esc(CE.titulo)}</h2>
    <div class="cuid-lista">${CE.etapas.map((e, i) => `<a class="cuid-item" href="${esc(e.h)}"><b class="cuid-n">${i + 1}</b><span><span class="cuid-t">${esc(e.t)}</span><small>${esc(e.por)}</small></span></a>`).join('')}</div>
  </div>

  <div class="home-liga">E nada disso funciona se não sobra tempo. É aqui que o IAlvorecer faz a diferença.</div>

  <div class="home-dif">
    <div class="eyebrow">${esc(T.eyebrow)}</div>
    <h2>${esc(T.titulo)}</h2>
    <p>${esc(T.texto)}</p>
    <div class="row" style="gap:12px;flex-wrap:wrap"><a class="btn btn-pink" href="#/tempo">Montar meu caminho para mais tempo livre</a><a class="btn btn-ghost" href="#/mentoria">Mentoria de carreira</a></div>
  </div>

  <div class="home-bloco home-cont">
    <div class="eyebrow">Continue depois</div><h3 class="home-h3">Quando estiver pronto, siga com estes</h3>
    <div class="ess-baixo">${resto.map(leve).join('')}</div>
    <div class="row" style="margin-top:18px"><button class="btn btn-ghost" id="homeStart3">Ver todas as áreas e cursos</button></div>
  </div>`;
}
