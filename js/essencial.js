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
  // Cores dos cards: só tons de verde e azul (combinam com o fundo), uma dupla para cada curso, todas na mesma faixa de luminosidade
  const PAL = { 'dinheiro-basico': ['#34c28a', '#0f5e55'], 'primeiros-socorros': ['#4fb6d6', '#0f5f78'], 'direitos-cidadania': ['#60a5fa', '#0f766e'], 'saude-emocional': ['#4fd1b5', '#17756f'], 'pensamento-critico': ['#4a8fe0', '#13467a'], 'comunicacao': ['#5fc79a', '#1a6f86'], 'cozinhar-basico': ['#6cc27a', '#1f7a5a'], 'decisoes': ['#3fb3e8', '#1d6a9c'], 'planeta-comunidade': ['#2fbfa8', '#0e6270'] };
  const FALL = [['#34c28a', '#0f5e55'], ['#4fb6d6', '#0f5f78'], ['#4a8fe0', '#13467a'], ['#5fc79a', '#1a6f86']];
  const cor = (x, i) => PAL[x.c.id] || FALL[i % FALL.length];
  const curso = (x, pos) => { const f = feitas(x.k), n = (x.c.lessons || []).length, pct = n ? Math.round(f / n * 100) : 0;
    return `<a class="hx-card hx-${pos}${cor(x, x.i)[2] ? ' hx-lt' : ''}" href="#/curso/${esc(x.k)}" style="${grad(cor(x, x.i))}"><span class="hx-wm">${icoOf(x.c.icon)}</span>
      <span class="hx-tag">Curso essencial</span><b>${esc(x.c.title)}</b><span class="hx-d">${esc(x.por)}</span>
      <span class="hx-meta"><span>${n} aulas${f ? ' · ' + pct + '%' : ''}</span><i>${f ? 'Continuar' : 'Começar'}</i></span><span class="hx-bar" style="width:${pct}%"></span></a>`; };
  const extra = (pos, ic, t, d, h, g) => `<a class="hx-card hx-${pos} hx-extra${g[2] ? ' hx-lt' : ''}" href="${h}" style="${grad(g)}"><span class="hx-wm">${icoOf(ic)}</span><span class="hx-tag">E mais</span><b>${esc(t)}</b><span class="hx-d">${esc(d)}</span><span class="hx-meta"><span>&nbsp;</span><i>Abrir</i></span></a>`;
  const paginas = [];
  for (let i = 0; i < lista.length; i += 4) paginas.push(lista.slice(i, i + 4).map((x, k) => curso(x, POS[k])));
  const ult = paginas[paginas.length - 1], falt = 4 - ult.length;
  const ex = [['layout-grid', 'Ver todas as áreas', 'Idiomas, tecnologia, saúde, finanças e muito mais para explorar.', '#/cursos', ['#5b9be8', '#157a80']], ['languages', 'Idiomas', 'Do zero ao fluente, com conversação e correção.', '#/idiomas', ['#3f86c8', '#12476f']], ['sparkles', 'Peça um curso', 'O IAlvorecer cria um curso do seu jeito.', '#/seu', ['#58c79e', '#1f7f78']], ['heart-handshake', 'Cuidar de mim', 'Desabafo, alimentação e treino.', '#/cuidar', ['#3fc47a', '#0e7490']]];
  for (let k = 0; k < falt; k++) { const e = ex[k]; ult.push(extra(POS[4 - falt + k], e[0], e[1], e[2], e[3], e[4])); }
  const nomes = paginas.map((_, n) => n === 0 ? 'Os mais essenciais' : n === paginas.length - 1 ? 'E mais para explorar' : 'Continue depois');
  const curtos = paginas.map((_, n) => n === 0 ? 'Essenciais' : n === paginas.length - 1 ? 'Explorar' : 'Continue depois');
  const pg = paginas.map((p, n) => `<div class="hx-pag${n ? ' next' : ' on'}" data-pag="${n}">${p.join('')}</div>`).join('');
  return `
  <div class="hx-cuid"><div class="hx-cuid-t"><b>${esc(CE.eyebrow)}</b><span>o básico, em ordem</span></div><div class="hx-cuid-l">${CE.etapas.map((e, i) => `<a class="hx-cu" href="${esc(e.h)}" title="${esc(e.por)}"><span class="hx-cu-i">${icoOf(e.i || 'circle')}</span><span class="hx-cu-n">${i + 1}</span><b>${esc(e.curto || e.t)}</b></a>`).join('')}</div></div>
  <div class="hx-stage"><div class="hx-grid">${pg}
    <div class="hx-centro"><span class="hx-dust" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => `<i style="left:${(i * 37 + 8) % 96}%;animation-delay:-${(i * 2.3) % 14}s;animation-duration:${9 + (i * 5) % 8}s"></i>`).join('')}</span><span class="hx-c-ic">${icoOf('compass')}</span><h2>Encontre o trabalho ideal para você</h2><a class="hx-c-b1" href="#/mentoria">Conheça a mentoria gratuita</a></div>
  </div></div>
  <div class="hx-ctrl carregando"><div class="hx-bar2"><button type="button" class="hx-sq" id="hxPrev" aria-label="Cursos anteriores">${icoOf('chevron-left')}</button><div class="hx-tabs" role="tablist">${paginas.map((_, n) => `<button type="button" role="tab" class="hx-tab${n ? '' : ' on'}" data-go="${n}" aria-label="Cursos ${n + 1} de ${paginas.length}"></button>`).join('')}</div><button type="button" class="hx-sq hx-sq-go" id="hxNext" aria-label="Próximos cursos">${icoOf('chevron-right')}</button></div><div class="hx-bar2 hx-bar-pp"><button type="button" class="hx-sq hx-pp" id="hxPausa" aria-label="Pausar a troca automática" title="Pausar">${icoOf('pause')}</button><button type="button" class="hx-sq hx-pp" id="hxPlay" aria-label="Retomar a troca automática" title="Continuar">${icoOf('play')}</button></div><span id="hxNome" data-nomes="${esc(JSON.stringify(nomes))}" hidden></span></div>`;
}

export function ligarHome(root) {
  const pags = [...root.querySelectorAll('.hx-pag')], dots = [...root.querySelectorAll('.hx-tab')], nome = root.querySelector('#hxNome');
  if (!pags.length) return;
  if (root._hxFim) root._hxFim(); // se a tela inicial for desenhada de novo, encerra o relógio da vez anterior (evita trocas duplicadas e rápidas)
  const N = pags.length, PARADA = 7000; // tempo parado em cada grupo de cursos (ms)
  const nomes = JSON.parse(nome.dataset.nomes || '[]'); let at = 0, saindo = -1;
  const prev = root.querySelector('#hxPrev'), next = root.querySelector('#hxNext'), pausa = root.querySelector('#hxPausa'), play = root.querySelector('#hxPlay');
  const lado = (p, d) => { p.classList.remove('prev', 'next'); p.classList.add(d > 0 ? 'next' : 'prev'); };
  // d > 0: anda para a direita (o grupo novo entra pela direita); d < 0: só quando a pessoa clica para voltar
  const ir = (n, d) => {
    n = (n + N) % N; if (n === at || N < 2) return;
    d = d || 1; const velho = at; at = n;
    // quem vai entrar (e os escondidos) espera do lado de onde vem, sem animar; assim nunca "volta" voando de um lado a outro
    pags.forEach((p, i) => { if (i !== velho && (i === n || i !== saindo)) { p.classList.add('sem-anim'); lado(p, d); } });
    void root.offsetWidth;
    pags.forEach(p => p.classList.remove('sem-anim'));
    pags.forEach((p, i) => { p.classList.toggle('on', i === n); if (i === n) p.classList.remove('prev', 'next'); else if (i === velho) lado(p, -d); });
    saindo = velho;
    dots.forEach((x, i) => x.classList.toggle('on', i === n)); nome.textContent = nomes[n] || '';
  };
  // Troca automática: para sempre para a direita, com pausa longa entre um grupo e outro
  let rodando = false, t = 0, suspenso = false;
  const celular = () => window.matchMedia('(max-width:900px)').matches;
  const reduz = () => window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  const agendar = () => { clearTimeout(t); if (rodando && !suspenso) t = setTimeout(passo, PARADA); };
  const passo = () => {
    if (!root.isConnected || !pags[0].isConnected) return fim();
    if (document.hidden || suspenso) return;
    rodar(() => ir(at + 1, 1)); agendar();
  };
  const marcar = () => {
    pausa.classList.toggle('on', !rodando); play.classList.toggle('on', rodando);
    pausa.setAttribute('aria-pressed', String(!rodando)); play.setAttribute('aria-pressed', String(rodando));
  };
  const definir = (v, salvar) => {
    rodando = !!v && N > 1; marcar();
    if (salvar) { try { localStorage.setItem('ia_home_auto', rodando ? '1' : '0'); } catch (e) { } }
    agendar();
  };
  const vis = () => { if (!root.isConnected) return fim(); if (document.hidden) clearTimeout(t); else agendar(); };
  const fim = () => { clearTimeout(t); document.removeEventListener('visibilitychange', vis); };
  root._hxFim = fim; document.addEventListener('visibilitychange', vis);
  // manual: o clique move na hora e reinicia a contagem da pausa (se estiver pausado, continua pausado)
  let ocupado = false; const fila = [];
  const rodar = fn => { if (ocupado) { if (fila.length < 4) fila.push(fn); return; } ocupado = true; fn(); setTimeout(() => { ocupado = false; const f = fila.shift(); if (f) rodar(f); }, 750); };
  const manual = fn => { rodar(fn); agendar(); };
  dots.forEach(d => d.onclick = () => manual(() => { const n = +d.dataset.go; ir(n, n > at ? 1 : -1); }));
  next.onclick = () => manual(() => ir(at + 1, 1));
  prev.onclick = () => manual(() => ir(at - 1, -1));
  pausa.onclick = () => definir(false, true);
  play.onclick = () => definir(true, true);
  // parado enquanto o mouse ou o dedo estão sobre os cursos (sobre os botões não: senão o Play pareceria não funcionar)
  const palco = root.querySelector('.hx-stage');
  palco.addEventListener('mouseenter', () => { suspenso = true; clearTimeout(t); });
  palco.addEventListener('mouseleave', () => { suspenso = false; agendar(); });
  let salvo = null; try { salvo = localStorage.getItem('ia_home_auto'); } catch (e) { }
  marcar();
  const inicial = salvo ? salvo === '1' : !(celular() || reduz()); // começa rodando, exceto no celular (sem efeito de slide) ou com "reduzir movimento"
  const ctrl = root.querySelector('.hx-ctrl'); let tent = 0;
  const revelar = () => { // os botões só aparecem quando a página terminou de carregar e os ícones existem (no máximo 5 s de espera)
    if (!root.isConnected || root._hxFim !== fim) return;
    const pronto = document.readyState === 'complete' && [...ctrl.querySelectorAll('.hx-sq')].every(b => b.querySelector('svg'));
    if (pronto || ++tent > 50) { ctrl.classList.remove('carregando'); definir(inicial, false); } else setTimeout(revelar, 100);
  };
  revelar();
  let x0 = null, y0 = null, arrastou = false; const st = root.querySelector('.hx-grid');
  st.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; suspenso = true; clearTimeout(t); }, { passive: true });
  st.addEventListener('touchend', e => {
    suspenso = false; if (x0 == null) return agendar();
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { arrastou = true; setTimeout(() => { arrastou = false; }, 400); manual(() => ir(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1)); } else agendar();
  });
  st.addEventListener('click', e => { if (arrastou) { e.preventDefault(); e.stopPropagation(); } }, true); // deslizar o dedo não deve abrir um curso sem querer
}
