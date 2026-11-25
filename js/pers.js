/* IAlvorecer · personalização do site (parte leve).
   Só aplica o que a pessoa escolheu: ordem, cor e remoção dos cards da página inicial,
   botões do cabeçalho e botão flutuante do assistente. O modo de edição fica em
   js/pers-edit.js e só carrega quando a pessoa o abre. Salvo só neste aparelho (localStorage "ia_pers").
   Não permite trocar textos, imagens nem a ordem/conteúdo dos cursos. */
(function (w) {
  var KEY = 'ia_pers', HEX = /^#[0-9a-f]{6}$/i;
  var BLOCOS = [
    ['ia', 'Seu limite de IA'], ['essencial', 'O essencial para aprender primeiro'], ['cuidados', 'Cuidados essenciais em etapas'], ['tempo', 'Mais tempo para você'], 
    ['metodo', 'Como funciona'], ['assistente', 'Falar com o IAlvorecer'],
    ['cuidar', 'Cuidar de mim'], ['sobre', 'Sobre o IAlvorecer'], ['numeros', 'Seus números']
  ];
  var TOPO = [
    ['home', 'Início', '[data-nav="home"]'], ['historico', 'Histórico', '[data-nav="historico"]'], ['agenda', 'Agenda', '[data-nav="agenda"]'],
    ['areas', 'Botão Áreas', '#areasBtn'], ['ajuda', 'Botão Como entrar', '#dock [data-comoentrar]'],
    ['cores', 'Botão Ajustes e aparência', '#dock [data-tema-open]']
  ];
  var IDS = BLOCOS.map(function (b) { return b[0]; }), TIDS = TOPO.map(function (t) { return t[0]; });

  var PAGINAS = [['home', 'Início'], ['idiomas', 'Idiomas'], ['trilha/tech', 'Tecnologia & IA'], ['cursos', 'Todas as áreas'], ['memorizacao', 'Memorização'], ['seu', 'Seu Alvorecer'], ['cuidar', 'Cuidar de mim'], ['cuidados', 'Cuidados'], ['mentoria', 'Mentoria de carreira'], ['sobre', 'Sobre'], ['historico', 'Histórico'], ['agenda', 'Agenda'], ['cronograma', 'Cronograma'], ['cuidar/alimentacao', 'Alimentação & água'], ['cuidar/treino', 'Treino'], ['apoiar', 'Apoiar']];
  var PAG = /^(home|idiomas|cursos|memorizacao|seu|cuidar|cuidar\/(alimentacao|treino)|cuidados(\/[a-z]{1,20})?|compras\/[a-z]{1,20}|mentoria|sobre|historico|agenda|cronograma|tempo|apoiar|trilha\/[a-z0-9-]{1,40}|curso\/[a-z]{2,5}:[\w-]{1,60})$/;
  var ITENS = 'h1,h2,h3,.eyebrow,p.muted,.btn,.panel,.stat,.step,.task,.lesson,.ccard,.area,.atile,.cta-band,.feature,.journey-card,.streak,.act,.tabs,.chip,.chead,.ia-cx,.cp-card,.cp-bloco,.back,.row';
  var DOCK = [['uso', '.dock-tag'], ['ajuda', '[data-comoentrar]'], ['cores', '[data-tema-open]'], ['fab', '#fab']];
  function idOk(id) { return typeof id === 'string' && id.length > 0 && id.length <= 160 && id !== '__proto__'; }
  // área aberta agora: 'home', uma das áreas editáveis ou '' (sem edição)
  function pagina(h) {
    h = (h === undefined ? w.location.hash : h).replace(/^#\/?/, '');
    if (!h) return 'home';
    if (h === 'trilha') h = 'trilha/design';
    return PAG.test(h) ? h : '';
  }
  // trecho das escolhas que vale para a área aberta
  function estado(p) {
    var k = pagina();
    if (k === 'home' || !k) return p;
    return p.pag[k] || (p.pag[k] = novo());
  }
  // onde ficam guardadas as escolhas de um elemento: bloco, item da tela ou item fixo (topo e botões de baixo)
  function idDe(el) { return el.getAttribute('data-pb') || el.getAttribute('data-pg') || el.getAttribute('data-pc'); }
  function estDe(p, el) {
    if (el.hasAttribute('data-pb')) return estado(p);
    if (el.hasAttribute('data-pg')) return p.geral;
    var k = pagina(); return p.pag[k] || (p.pag[k] = novo());
  }
  function oculto(p, el) {
    var id = idDe(el), m = /^topo:(.+)$/.exec(id);
    if (el.hasAttribute('data-pg')) { if (m) return p.topo.indexOf(m[1]) > -1; if (id === 'dock:fab') return !p.fab; if (id === 'dock:ajuda' || id === 'dock:cores') return p.topo.indexOf(id.slice(5)) > -1; }
    return estDe(p, el).ocultos.indexOf(id) > -1;
  }
  function alternar(p, el) {
    var id = idDe(el), m = /^topo:(.+)$/.exec(id), troca = function (o, c, x) { o[c] = o[c].indexOf(x) > -1 ? o[c].filter(function (y) { return y !== x; }) : o[c].concat([x]); };
    if (el.hasAttribute('data-pg')) { if (m) return troca(p, 'topo', m[1]); if (id === 'dock:fab') { p.fab = !p.fab; return; } if (id === 'dock:ajuda' || id === 'dock:cores') return troca(p, 'topo', id.slice(5)); }
    troca(estDe(p, el), 'ocultos', id);
  }
  // irmãos que podem trocar de lugar com este elemento
  function grupo(el) {
    if (el.hasAttribute('data-pb')) return { els: blocos(), por: function (p, l) { estado(p).ordem = l; } };
    var g = el.getAttribute('data-pgr'); if (!g) return null;
    return { els: [].slice.call(document.querySelectorAll('[data-pgr="' + g + '"]')), por: function (p, l) { estDe(p, el).grupos[g] = l; } };
  }
  function ordenar(els, ordem, hx) {
    els.forEach(function (el, i) { if (el._pg === undefined) el._pg = i; });
    var pos = function (el) { var i = ordem.indexOf(idDe(el)); return i < 0 ? 1000 + el._pg : i; };
    var ord = els.slice().sort(function (x, y) { return pos(x) - pos(y); });
    if (!ord.some(function (el, i) { return el !== els[i]; })) return;
    var CL = ['hx-tl', 'hx-tr', 'hx-bl', 'hx-br'], lug = hx && els.map(function (el) { return CL.filter(function (c) { return el.classList.contains(c); })[0]; });
    var vagas = els.map(function (el) { var m = document.createComment('p'); el.parentNode.replaceChild(m, el); return m; });
    vagas.forEach(function (m, i) { m.parentNode.replaceChild(ord[i], m); if (hx && lug[i]) { CL.forEach(function (c) { ord[i].classList.remove(c); }); ord[i].classList.add(lug[i]); } });
  }
  function app() { return document.getElementById('app'); }
  function blocos() { var a = app(); return a ? [].slice.call(a.querySelectorAll(':scope > [data-pb]')) : []; }
  function cartoes() { var a = app(), k = pagina(); return a && k ? [].slice.call(a.querySelectorAll('[data-pc]')) : []; }
  function slug(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').trim().replace(/ +/g, '-').slice(0, 60); }
  // dá um nome estável a cada bloco e cartão da tela (pela estrutura e pelo título)
  function marcar(k) {
    var a = app(), usados = {}, n = 0;
    [].forEach.call(a.children, function (el) {
      if (k === 'home') { var b = el.getAttribute('data-bloco'); if (b) { el.setAttribute('data-pb', b); if (el._pi === undefined) el._pi = IDS.indexOf(b); } return; }
      if (!el.matches('.section,.journey,.idi-top,.cta-band,.feature,.panel,.grid,.cards,.stats')) return;
      var id = el.getAttribute('data-pb');
      if (!id) {
        var h = el.matches('.section,.panel') ? el.querySelector('h2,h3') : null;
        id = (h && slug(h.textContent)) || el.classList[0];
      }
      var base = id, i = 2; while (usados[id]) id = base + '--' + i++;
      usados[id] = 1; el.setAttribute('data-pb', id);
      if (el._pi === undefined) el._pi = n; n++;
    });
    var vis = {}, dar = function (el, id, gr) {
      if (el.hasAttribute('data-pc')) { vis[el.getAttribute('data-pc')] = 1; return; }
      var base = id.slice(0, 145), x = base, i = 2; while (vis[x]) x = base + '--' + i++;
      vis[x] = 1; el.setAttribute('data-pc', x); if (gr) el.setAttribute('data-pgr', gr);
    };
    // nomes que já estão em uso primeiro, para ninguém repetir
    [].forEach.call(a.querySelectorAll('[data-pc]'), function (el) { vis[el.getAttribute('data-pc')] = 1; });
    if (k === 'home') {
      [].forEach.call(a.querySelectorAll('#homeTopo > .hx-cuid,#homeTopo > .hx-stage,#homeTopo > .hx-ctrl'), function (el) { dar(el, 'hx:' + el.classList[0], 'hxparte'); });
      [].forEach.call(a.querySelectorAll('.hx-cu'), function (el) { dar(el, 'cu:' + el.getAttribute('href'), 'hxcu'); });
      [].forEach.call(a.querySelectorAll('.hx-card'), function (el) { dar(el, 'hx:' + el.getAttribute('href'), 'hxcard'); });
      [].forEach.call(a.querySelectorAll('.hx-centro,.hx-cuid-t,.hx-c-b1'), function (el) { dar(el, 'hx:' + el.classList[0]); });
    }
    [].forEach.call(a.querySelectorAll(ITENS), function (el) {
      if (el.hasAttribute('data-pb') || el.closest('#homeTopo,.notice,.msgs,.composer,.pe-tb')) return;
      var href = el.matches('a.ccard,a.area,a.atile') && el.getAttribute('href');
      if (href) return dar(el, 'card:' + href);
      var b = el.parentElement.closest('[data-pb]');
      dar(el, (b ? b.getAttribute('data-pb') : 'tela') + '/' + el.tagName.toLowerCase() + '.' + (el.classList[0] || '') + '.' + slug(el.textContent).slice(0, 40));
    });
  }
  function pintar(el, id, q) {
    var c = q.cores[id];
    if (q.ocultos.indexOf(id) > -1) el.setAttribute('data-pers-off', ''); else el.removeAttribute('data-pers-off');
    if (c) { el.setAttribute('data-cor', '1'); el.style.setProperty('--pers-cor', c); } else { el.removeAttribute('data-cor'); el.style.removeProperty('--pers-cor'); }
  }
  function padraoObj() { return { ordem: [], ocultos: [], cores: {}, topo: [], fab: true, pag: {}, geral: { grupos: {}, ocultos: [], cores: {} } }; }
  function ler() {
    var p = padraoObj(), o = null;
    try { o = JSON.parse(w.localStorage.getItem(KEY)); } catch (e) { }
    if (!o || typeof o !== 'object') return p;
    if (Array.isArray(o.ordem)) p.ordem = o.ordem.filter(function (id, i, a) { return IDS.indexOf(id) > -1 && a.indexOf(id) === i; });
    if (Array.isArray(o.ocultos)) p.ocultos = o.ocultos.filter(function (id, i, a) { return IDS.indexOf(id) > -1 && a.indexOf(id) === i; });
    if (o.cores && typeof o.cores === 'object') IDS.forEach(function (id) { if (typeof o.cores[id] === 'string' && HEX.test(o.cores[id])) p.cores[id] = o.cores[id].toLowerCase(); });
    if (Array.isArray(o.topo)) p.topo = o.topo.filter(function (id, i, a) { return id !== 'cores' && TIDS.indexOf(id) > -1 && a.indexOf(id) === i; }); // o botão de ajustes e aparência fica sempre visível
    p.fab = o.fab !== false;
    if (o.pag && typeof o.pag === 'object') Object.keys(o.pag).slice(0, 60).forEach(function (k) {
      var q = o.pag[k]; if (!PAG.test(k) || !q || typeof q !== 'object') return;
      var e = limpo(q); if (cheio(e)) p.pag[k] = e;
    });
    if (o.geral && typeof o.geral === 'object') { var g = limpo(o.geral); p.geral = { grupos: g.grupos, ocultos: g.ocultos, cores: g.cores }; }
    return p;
  }
  function limpo(q) {
    var lim = function (a) { return Array.isArray(a) ? a.filter(function (id, i, l) { return idOk(id) && l.indexOf(id) === i; }).slice(0, 300) : []; };
    var e = { ordem: lim(q.ordem), ocultos: lim(q.ocultos), cores: {}, grupos: {} };
    if (q.cores && typeof q.cores === 'object') Object.keys(q.cores).slice(0, 300).forEach(function (id) { if (idOk(id) && typeof q.cores[id] === 'string' && HEX.test(q.cores[id])) e.cores[id] = q.cores[id].toLowerCase(); });
    if (q.grupos && typeof q.grupos === 'object') ['topo', 'dock', 'hxparte', 'hxcu', 'hxcard'].forEach(function (k) { var l = lim(q.grupos[k]); if (l.length) e.grupos[k] = l; });
    return e;
  }
  function novo() { return { ordem: [], ocultos: [], cores: {}, grupos: {} }; }
  function cheio(q) { return !!(q && ((q.ordem || []).length || q.ocultos.length || Object.keys(q.cores).length || Object.keys(q.grupos || {}).length)); }
  function vazio(p) { return !p.ordem.length && !p.ocultos.length && !Object.keys(p.cores).length && !p.topo.length && p.fab && !Object.keys(p.pag || {}).some(function (k) { return cheio(p.pag[k]); }) && !cheio(p.geral); }
  function gravar(p) { try { if (vazio(p)) w.localStorage.removeItem(KEY); else w.localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { } }
  function ordenados(p) {
    p = p || ler();
    var pos = function (id) { var i = p.ordem.indexOf(id); return i < 0 ? 1000 + IDS.indexOf(id) : i; };
    return IDS.slice().sort(function (a, b) { return pos(a) - pos(b); });
  }

  function home() {
    var k = pagina(), a = app(); if (!k || !a || !a.firstElementChild) return;
    if (k === 'home' && !a.querySelector(':scope > [data-bloco]')) return;
    marcar(k);
    var p = ler(), q = k === 'home' ? p : (p.pag[k] || novo()), els = blocos(), itens = p.pag[k] || novo();
    var id = function (el) { return el.getAttribute('data-pb'); };
    var pos = function (el) { var i = q.ordem.indexOf(id(el)); return i < 0 ? 1000 + el._pi : i; };
    var ord = els.slice().sort(function (x, y) { return pos(x) - pos(y); });
    // só os blocos trocam de lugar entre si; títulos, avisos e o resto ficam onde estão
    if (ord.some(function (el, i) { return el !== els[i]; })) {
      var vagas = els.map(function (el) { var m = document.createComment('p'); el.parentNode.replaceChild(m, el); return m; });
      vagas.forEach(function (m, i) { m.parentNode.replaceChild(ord[i], m); });
    }
    els.forEach(function (el) { pintar(el, id(el), q); });
    if (k === 'home') ['hxparte', 'hxcu', 'hxcard'].forEach(function (g) { ordenar([].slice.call(document.querySelectorAll('[data-pgr="' + g + '"]')), itens.grupos[g] || [], g === 'hxcard'); });
    cartoes().forEach(function (el) { pintar(el, el.getAttribute('data-pc'), itens); });
    try { w.dispatchEvent(new w.CustomEvent('ia-pers-dom')); } catch (e) { }
  }
  function topo() {
    var p = ler();
    TOPO.forEach(function (t) {
      [].forEach.call(document.querySelectorAll(t[2]), function (el) { if (p.topo.indexOf(t[0]) > -1) el.setAttribute('data-pers-off', ''); else el.removeAttribute('data-pers-off'); });
    });
    var fab = document.getElementById('fab');
    if (fab) { if (p.fab) fab.removeAttribute('data-pers-off'); else fab.setAttribute('data-pers-off', ''); }
    var fixo = function (el, id, g) { if (!el) return; el.setAttribute('data-pg', id); el.setAttribute('data-pgr', g); };
    TOPO.forEach(function (t) { if (t[2].indexOf('#dock') < 0) fixo(document.querySelector('#mainnav ' + t[2]), 'topo:' + t[0], 'topo'); });
    DOCK.forEach(function (d) { fixo(document.querySelector('#dock > ' + d[1]), 'dock:' + d[0], 'dock'); });
    ['topo', 'dock'].forEach(function (g) {
      var els = [].slice.call(document.querySelectorAll('[data-pgr="' + g + '"]'));
      ordenar(els, p.geral.grupos[g] || []);
      els.forEach(function (el) {
        var c = p.geral.cores[idDe(el)];
        if (oculto(p, el)) el.setAttribute('data-pers-off', ''); else el.removeAttribute('data-pers-off');
        if (c) { el.setAttribute('data-cor', '1'); el.style.setProperty('--pers-cor', c); } else { el.removeAttribute('data-cor'); el.style.removeProperty('--pers-cor'); }
      });
    });
  }
  function tudo() { home(); topo(); try { w.dispatchEvent(new w.CustomEvent('ia-pers')); } catch (e) { } }
  function tudo2() { home(); topo(); }
  function padrao() { try { w.localStorage.removeItem(KEY); } catch (e) { } tudo(); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-pers-open]'); if (!b) return;
    e.preventDefault();
    editar(b.hasAttribute('data-pers-aqui') ? undefined : '#/');
  });
  function editar(hash) { return import('./pers-edit.js?v=5').then(function (m) { m.iniciar(hash); }).catch(function () { }); }

  // as telas são desenhadas de novo a cada visita: reaplica o que a pessoa escolheu
  var espera = false;
  function ligar() {
    if (!app()) return;
    new MutationObserver(function () {
      if (espera || !pagina()) return;
      espera = true;
      w.requestAnimationFrame(function () { espera = false; home(); });
    }).observe(app(), { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligar); else ligar();

  w.IAPers = { BLOCOS: BLOCOS, TOPO: TOPO, ler: ler, gravar: gravar, ordenados: ordenados, home: home, topo: topo, tudo: tudo, padrao: padrao, aplicar: tudo2, idDe: idDe, estDe: estDe, oculto: oculto, alternar: alternar, grupo: grupo, PAGINAS: PAGINAS, pagina: pagina, estado: estado, blocos: blocos, cartoes: cartoes, editar: editar };
})(window);
