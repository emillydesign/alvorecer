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

// Início do site: UMA seção em quadrantes. Cursos essenciais nos cantos (com páginas), mentoria de carreira no centro
// e, embaixo, uma faixa horizontal com os cuidados essenciais.
export function homeHTML({ C, S, esc, icoOf, grad, saudacao, dia }) {
  const E = C.essencial, CE = C.cuidadosEssenciais; if (!E) return '';
  const achar = k => { const id = k.replace(/^trk:/, ''); for (const t of Object.values(C.tracks)) { const c = t.courses.find(x => x.id === id); if (c) return c; } return null; };
  const feitas = k => Object.keys(S.state.courses?.[k]?.done || {}).length;
  const lista = E.itens.map((it, i) => ({ ...it, i, c: achar(it.k) })).filter(x => x.c);
  const prog = x => { const f = feitas(x.k), n = (x.c.lessons || []).length; return f > 0 ? `${f}/${n} aulas` : 'Começar'; };
  const card = (x, pos) => `<a class="qd-card qd-${pos}" href="#/curso/${esc(x.k)}" style="${grad(x.c.g)}"><span class="qd-n">${x.i + 1}</span><span class="qd-ic">${icoOf(x.c.icon)}</span><b>${esc(x.c.title)}</b><small>${esc(x.por)}</small><em>${esc(prog(x))}</em></a>`;
  const todas = pos => `<button type="button" class="qd-card qd-${pos} qd-todas" id="homeStart3"><span class="qd-ic">${icoOf('layout-grid')}</span><b>Ver todas as áreas e cursos</b><small>Idiomas, tecnologia, saúde, finanças e muito mais</small><em>Explorar</em></button>`;
  const POS = ['tl', 'tr', 'bl', 'br'];
  const paginas = [];
  for (let i = 0; i < lista.length; i += 4) paginas.push(lista.slice(i, i + 4));
  const ult = paginas[paginas.length - 1];
  if (ult.length < 4) ult.push({ todas: true });
  const pg = paginas.map((p, n) => `<div class="qd-pag${n ? '' : ' on'}" data-pag="${n}">${p.map((x, k) => x.todas ? todas(POS[k]) : card(x, POS[k])).join('')}</div>`).join('');
  const nomes = paginas.map((_, n) => n === 0 ? 'Os mais essenciais' : n === paginas.length - 1 ? 'E mais para aprender' : 'Continue depois');
  return `
  <div class="qd-top"><div class="eyebrow">${esc(dia)}</div><h1 class="qd-h">${esc(saudacao)}. <span class="grad">Comece por aqui.</span></h1></div>
  <div class="qd-wrap">
    <div class="qd-grid">${pg}
      <div class="qd-centro"><div class="eyebrow">Nosso diferencial</div><h2>Encontre o trabalho ideal para você</h2><p>Mentoria de carreira gratuita: o IAlvorecer ajuda você a descobrir e conquistar um trabalho que combine com o seu tempo e os seus cuidados. Ele orienta, você decide.</p><div class="qd-btns"><a class="btn btn-pink btn-sm" href="#/tempo">Montar meu caminho</a><a class="btn btn-ghost btn-sm" href="#/mentoria">Mentoria</a></div></div>
    </div>
    <div class="qd-pager"><span class="qd-nome" id="qdNome" data-nomes="${esc(JSON.stringify(nomes))}">${esc(nomes[0])}</span><span class="qd-dots">${paginas.map((_, n) => `<button type="button" class="qd-dot${n ? '' : ' on'}" data-go="${n}" aria-label="Página ${n + 1}"></button>`).join('')}</span><button type="button" class="btn btn-ghost btn-sm" id="qdMais">Ver mais cursos essenciais</button></div>
  </div>
  <div class="cuid-faixa"><div class="cuid-faixa-t">${esc(CE.eyebrow)}<small>em ordem</small></div><div class="cuid-faixa-l">${CE.etapas.map((e, i) => `<a class="cf-item" href="${esc(e.h)}" title="${esc(e.por)}"><b>${i + 1}</b><span>${esc(e.t)}</span></a>`).join('')}</div></div>`;
}

export function ligarHome(root) {
  const pags = [...root.querySelectorAll('.qd-pag')], dots = [...root.querySelectorAll('.qd-dot')], nome = root.querySelector('#qdNome');
  if (!pags.length) return;
  const nomes = JSON.parse(nome.dataset.nomes || '[]'); let at = 0;
  const ir = n => { at = (n + pags.length) % pags.length; pags.forEach((p, i) => p.classList.toggle('on', i === at)); dots.forEach((d, i) => d.classList.toggle('on', i === at)); nome.textContent = nomes[at] || ''; };
  dots.forEach(d => d.onclick = () => ir(+d.dataset.go));
  const mais = root.querySelector('#qdMais'); if (mais) mais.onclick = () => ir(at + 1);
}
