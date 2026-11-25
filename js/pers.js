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
    ['home', 'Início', '[data-nav="home"]'], ['tech', 'Tecnologia & IA', '[data-nav="tech"]'],
    ['idiomas', 'Idiomas', '[data-nav="idiomas"]'], ['memorizacao', 'Memorização', '[data-nav="memorizacao"]'],
    ['historico', 'Histórico', '[data-nav="historico"]'], ['area', 'Sua área de interesse', '[data-nav="area"]'],
    ['areas', 'Botão Áreas', '#areasBtn'], ['ajuda', 'Botão Como entrar', '#dock [data-comoentrar]'],
    ['cores', 'Botão Cores do site', '#dock [data-tema-open]']
  ];
  var IDS = BLOCOS.map(function (b) { return b[0]; }), TIDS = TOPO.map(function (t) { return t[0]; });

  var PAGINAS = [['home', 'Início'], ['idiomas', 'Idiomas'], ['trilha/tech', 'Tecnologia & IA'], ['cursos', 'Todas as áreas'], ['memorizacao', 'Memorização'], ['seu', 'Seu Alvorecer'], ['cuidar', 'Cuidar de mim'], ['cuidados', 'Cuidados'], ['mentoria', 'Mentoria de carreira'], ['sobre', 'Sobre']];
  var PAG = /^(idiomas|cursos|memorizacao|seu|cuidar|cuidados|mentoria|sobre|trilha\/[a-z0-9-]{1,40})$/;
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
    return p.pag[k] || (p.pag[k] = { ordem: [], ocultos: [], cores: {} });
  }
  function app() { return document.getElementById('app'); }
  function blocos() { var a = app(); return a ? [].slice.call(a.querySelectorAll(':scope > [data-pb]')) : []; }
  function cartoes() { var a = app(), k = pagina(); return a && k && k !== 'home' ? [].slice.call(a.querySelectorAll('[data-pc]')) : []; }
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
    if (k !== 'home') [].forEach.call(a.querySelectorAll('a.ccard[href],a.area[href],a.atile[href]'), function (el) { el.setAttribute('data-pc', 'card:' + el.getAttribute('href').slice(0, 140)); });
  }
  function pintar(el, id, q) {
    var c = q.cores[id];
    if (q.ocultos.indexOf(id) > -1) el.setAttribute('data-pers-off', ''); else el.removeAttribute('data-pers-off');
    if (c) { el.setAttribute('data-cor', '1'); el.style.setProperty('--pers-cor', c); } else { el.removeAttribute('data-cor'); el.style.removeProperty('--pers-cor'); }
  }
  function padraoObj() { return { ordem: [], ocultos: [], cores: {}, topo: [], fab: true, pag: {} }; }
  function ler() {
    var p = padraoObj(), o = null;
    try { o = JSON.parse(w.localStorage.getItem(KEY)); } catch (e) { }
    if (!o || typeof o !== 'object') return p;
    if (Array.isArray(o.ordem)) p.ordem = o.ordem.filter(function (id, i, a) { return IDS.indexOf(id) > -1 && a.indexOf(id) === i; });
    if (Array.isArray(o.ocultos)) p.ocultos = o.ocultos.filter(function (id, i, a) { return IDS.indexOf(id) > -1 && a.indexOf(id) === i; });
    if (o.cores && typeof o.cores === 'object') IDS.forEach(function (id) { if (typeof o.cores[id] === 'string' && HEX.test(o.cores[id])) p.cores[id] = o.cores[id].toLowerCase(); });
    if (Array.isArray(o.topo)) p.topo = o.topo.filter(function (id, i, a) { return TIDS.indexOf(id) > -1 && a.indexOf(id) === i; });
    p.fab = o.fab !== false;
    if (o.pag && typeof o.pag === 'object') Object.keys(o.pag).slice(0, 60).forEach(function (k) {
      var q = o.pag[k]; if (!PAG.test(k) || !q || typeof q !== 'object') return;
      var lim = function (a) { return Array.isArray(a) ? a.filter(function (id, i, l) { return idOk(id) && l.indexOf(id) === i; }).slice(0, 200) : []; };
      var e = { ordem: lim(q.ordem), ocultos: lim(q.ocultos), cores: {} };
      if (q.cores && typeof q.cores === 'object') Object.keys(q.cores).slice(0, 200).forEach(function (id) { if (idOk(id) && typeof q.cores[id] === 'string' && HEX.test(q.cores[id])) e.cores[id] = q.cores[id].toLowerCase(); });
      if (e.ordem.length || e.ocultos.length || Object.keys(e.cores).length) p.pag[k] = e;
    });
    return p;
  }
  function vazio(p) { return !p.ordem.length && !p.ocultos.length && !Object.keys(p.cores).length && !p.topo.length && p.fab && !Object.keys(p.pag || {}).length; }
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
    var p = ler(), q = k === 'home' ? p : (p.pag[k] || { ordem: [], ocultos: [], cores: {} }), els = blocos();
    var id = function (el) { return el.getAttribute('data-pb'); };
    var pos = function (el) { var i = q.ordem.indexOf(id(el)); return i < 0 ? 1000 + el._pi : i; };
    var ord = els.slice().sort(function (x, y) { return pos(x) - pos(y); });
    // só os blocos trocam de lugar entre si; títulos, avisos e o resto ficam onde estão
    if (ord.some(function (el, i) { return el !== els[i]; })) {
      var vagas = els.map(function (el) { var m = document.createComment('p'); el.parentNode.replaceChild(m, el); return m; });
      vagas.forEach(function (m, i) { m.parentNode.replaceChild(ord[i], m); });
    }
    els.forEach(function (el) { pintar(el, id(el), q); });
    cartoes().forEach(function (el) { pintar(el, el.getAttribute('data-pc'), q); });
    try { w.dispatchEvent(new w.CustomEvent('ia-pers-dom')); } catch (e) { }
  }
  function topo() {
    var p = ler();
    TOPO.forEach(function (t) {
      [].forEach.call(document.querySelectorAll(t[2]), function (el) { if (p.topo.indexOf(t[0]) > -1) el.setAttribute('data-pers-off', ''); else el.removeAttribute('data-pers-off'); });
    });
    var fab = document.getElementById('fab');
    if (fab) { if (p.fab) fab.removeAttribute('data-pers-off'); else fab.setAttribute('data-pers-off', ''); }
  }
  function tudo() { home(); topo(); try { w.dispatchEvent(new w.CustomEvent('ia-pers')); } catch (e) { } }
  function tudo2() { home(); topo(); }
  function padrao() { try { w.localStorage.removeItem(KEY); } catch (e) { } tudo(); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-pers-open]'); if (!b) return;
    e.preventDefault();
    editar(b.hasAttribute('data-pers-aqui') ? undefined : '#/');
  });
  function editar(hash) { return import('./pers-edit.js?v=1').then(function (m) { m.iniciar(hash); }).catch(function () { }); }

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

  w.IAPers = { BLOCOS: BLOCOS, TOPO: TOPO, ler: ler, gravar: gravar, ordenados: ordenados, home: home, topo: topo, tudo: tudo, padrao: padrao, aplicar: tudo2, PAGINAS: PAGINAS, pagina: pagina, estado: estado, blocos: blocos, cartoes: cartoes, editar: editar };
})(window);
