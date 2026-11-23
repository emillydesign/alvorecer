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

// Início do site: UMA seção em quadrantes com carrossel. Cursos essenciais nos cantos (que "rolam" para os próximos),
// diferencial no centro e, embaixo, a faixa dos cuidados essenciais.
export function homeHTML({ C, S, esc, icoOf, grad, saudacao, dia }) {
  const E = C.essencial, CE = C.cuidadosEssenciais; if (!E) return '';
  const achar = k => { const id = k.replace(/^trk:/, ''); for (const t of Object.values(C.tracks)) { const c = t.courses.find(x => x.id === id); if (c) return c; } return null; };
  const feitas = k => Object.keys(S.state.courses?.[k]?.done || {}).length;
  const lista = E.itens.map((it, i) => ({ ...it, i, c: achar(it.k) })).filter(x => x.c);
  const POS = ['tl', 'tr', 'bl', 'br'];
  const curso = (x, pos) => { const f = feitas(x.k), n = (x.c.lessons || []).length, pct = n ? Math.round(f / n * 100) : 0;
    return `<a class="hx-card hx-${pos}" href="#/curso/${esc(x.k)}" style="${grad(x.c.g)}"><span class="hx-wm">${icoOf(x.c.icon)}</span>
      <span class="hx-tag">Curso essencial</span><b>${esc(x.c.title)}</b><span class="hx-d">${esc(x.por)}</span>
      <span class="hx-meta"><span>${n} aulas${f ? ' · ' + pct + '%' : ''}</span><i>${f ? 'Continuar' : 'Começar'}</i></span><span class="hx-bar" style="width:${pct}%"></span></a>`; };
  const extra = (pos, ic, t, d, h, g) => `<a class="hx-card hx-${pos} hx-extra" href="${h}" style="${grad(g)}"><span class="hx-wm">${icoOf(ic)}</span><span class="hx-tag">E mais</span><b>${esc(t)}</b><span class="hx-d">${esc(d)}</span><span class="hx-meta"><span>&nbsp;</span><i>Abrir</i></span></a>`;
  const paginas = [];
  for (let i = 0; i < lista.length; i += 4) paginas.push(lista.slice(i, i + 4).map((x, k) => curso(x, POS[k])));
  const ult = paginas[paginas.length - 1], falt = 4 - ult.length;
  const ex = [['layout-grid', 'Ver todas as áreas', 'Idiomas, tecnologia, saúde, finanças e muito mais para explorar.', '#/cursos', ['#6366f1', '#14b8a6']], ['languages', 'Idiomas', 'Do zero ao fluente, com conversação e correção.', '#/idiomas', ['#2dd4bf', '#2563eb']], ['sparkles', 'Peça um curso', 'O IAlvorecer cria um curso do seu jeito.', '#/seu', ['#f59e0b', '#14b8a6']], ['heart-handshake', 'Cuidar de mim', 'Desabafo, alimentação e treino.', '#/cuidar', ['#86efac', '#6366f1']]];
  for (let k = 0; k < falt; k++) { const e = ex[k]; ult.push(extra(POS[4 - falt + k], e[0], e[1], e[2], e[3], e[4])); }
  const nomes = paginas.map((_, n) => n === 0 ? 'Os mais essenciais' : n === paginas.length - 1 ? 'E mais para explorar' : 'Continue depois');
  const curtos = paginas.map((_, n) => n === 0 ? 'Essenciais' : n === paginas.length - 1 ? 'Explorar' : 'Continue depois');
  const pg = paginas.map((p, n) => `<div class="hx-pag${n ? ' next' : ' on'}" data-pag="${n}">${p.join('')}</div>`).join('');
  return `
  <div class="hx-cuid"><div class="hx-cuid-t"><b>${esc(CE.eyebrow)}</b><span>o básico, em ordem</span></div><div class="hx-cuid-l">${CE.etapas.map((e, i) => `<a class="hx-cu" href="${esc(e.h)}" title="${esc(e.por)}"><span class="hx-cu-i">${icoOf(e.i || 'circle')}</span><span class="hx-cu-n">${i + 1}</span><b>${esc(e.curto || e.t)}</b></a>`).join('')}</div></div>
  <div class="hx-stage"><div class="hx-grid">${pg}
    <div class="hx-centro"><span class="hx-c-ic">${icoOf('sunrise')}</span><div class="hx-c-t">Nosso diferencial</div><h2>Encontre o trabalho ideal para você</h2><p>Mentoria de carreira gratuita para descobrir e conquistar um trabalho que combine com o seu tempo e os seus cuidados. Ele orienta, você decide.</p><a class="hx-c-b1" href="#/tempo">Montar meu caminho</a><a class="hx-c-b2" href="#/mentoria">Conhecer a mentoria</a></div>
  </div></div>
  <div class="hx-ctrl"><button type="button" class="hx-sq" id="hxPrev" aria-label="Cursos anteriores" disabled>${icoOf('chevron-left')}</button><div class="hx-tabs" role="tablist">${paginas.map((_, n) => `<button type="button" role="tab" class="hx-tab${n ? '' : ' on'}" data-go="${n}" aria-label="Cursos ${n + 1} de ${paginas.length}"></button>`).join('')}</div><button type="button" class="hx-sq hx-sq-go" id="hxNext" aria-label="Próximos cursos">${icoOf('chevron-right')}</button><span id="hxNome" data-nomes="${esc(JSON.stringify(nomes))}" hidden></span></div>`;
}

export function ligarHome(root) {
  const pags = [...root.querySelectorAll('.hx-pag')], dots = [...root.querySelectorAll('.hx-tab')], nome = root.querySelector('#hxNome');
  if (!pags.length) return;
  const nomes = JSON.parse(nome.dataset.nomes || '[]'); let at = 0;
  const prev = root.querySelector('#hxPrev'), next = root.querySelector('#hxNext');
  const ir = n => {
    n = Math.max(0, Math.min(pags.length - 1, n)); at = n;
    pags.forEach((p, i) => { p.classList.toggle('on', i === n); p.classList.toggle('prev', i < n); p.classList.toggle('next', i > n); });
    dots.forEach((d, i) => d.classList.toggle('on', i === n)); nome.textContent = nomes[n] || '';
    prev.disabled = n === 0;
  };
  dots.forEach(d => d.onclick = () => ir(+d.dataset.go));
  next.onclick = () => ir(at === pags.length - 1 ? 0 : at + 1);
  prev.onclick = () => ir(at - 1);
  let x0 = null; const st = root.querySelector('.hx-grid');
  st.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  st.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) ir(at + (dx < 0 ? 1 : -1)); x0 = null; });
}
