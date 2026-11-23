/* IAlvorecer · personalização do site (parte leve).
   Só aplica o que a pessoa escolheu: ordem, cor e remoção dos cards da página inicial,
   botões do cabeçalho e botão flutuante do assistente. O painel de edição fica em
   js/pers-ui.js e só carrega quando a pessoa o abre. Salvo só neste aparelho (localStorage "ia_pers").
   Não permite trocar textos, imagens nem a ordem/conteúdo dos cursos. */
(function (w) {
  var KEY = 'ia_pers', HEX = /^#[0-9a-f]{6}$/i;
  var BLOCOS = [
    ['ia', 'Seu limite de IA'], ['explore', 'O que você pode aprender'], ['areas', 'Áreas de interesse'],
    ['curso', 'Não achou o seu curso?'], ['metodo', 'Como funciona'], ['assistente', 'Falar com o IAlvorecer'],
    ['mentoria', 'Mentoria de carreira'], ['cuidar', 'Cuidar de mim'], ['sobre', 'Sobre o IAlvorecer'], ['numeros', 'Seus números']
  ];
  var TOPO = [
    ['home', 'Início', '[data-nav="home"]'], ['tech', 'Tecnologia & IA', '[data-nav="tech"]'],
    ['idiomas', 'Idiomas', '[data-nav="idiomas"]'], ['memorizacao', 'Memorização', '[data-nav="memorizacao"]'],
    ['historico', 'Histórico', '[data-nav="historico"]'], ['area', 'Sua área de interesse', '[data-nav="area"]'],
    ['areas', 'Botão Áreas', '#areasBtn'], ['ajuda', 'Botão Como entrar', '.topright [data-comoentrar]'],
    ['cores', 'Botão Cores do site', '.topright [data-tema-open]']
  ];
  var IDS = BLOCOS.map(function (b) { return b[0]; }), TIDS = TOPO.map(function (t) { return t[0]; });

  function padraoObj() { return { ordem: [], ocultos: [], cores: {}, topo: [], fab: true }; }
  function ler() {
    var p = padraoObj(), o = null;
    try { o = JSON.parse(w.localStorage.getItem(KEY)); } catch (e) { }
    if (!o || typeof o !== 'object') return p;
    if (Array.isArray(o.ordem)) p.ordem = o.ordem.filter(function (id, i, a) { return IDS.indexOf(id) > -1 && a.indexOf(id) === i; });
    if (Array.isArray(o.ocultos)) p.ocultos = o.ocultos.filter(function (id, i, a) { return IDS.indexOf(id) > -1 && a.indexOf(id) === i; });
    if (o.cores && typeof o.cores === 'object') IDS.forEach(function (id) { if (typeof o.cores[id] === 'string' && HEX.test(o.cores[id])) p.cores[id] = o.cores[id].toLowerCase(); });
    if (Array.isArray(o.topo)) p.topo = o.topo.filter(function (id, i, a) { return TIDS.indexOf(id) > -1 && a.indexOf(id) === i; });
    p.fab = o.fab !== false;
    return p;
  }
  function vazio(p) { return !p.ordem.length && !p.ocultos.length && !Object.keys(p.cores).length && !p.topo.length && p.fab; }
  function gravar(p) { try { if (vazio(p)) w.localStorage.removeItem(KEY); else w.localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { } }
  function ordenados(p) {
    p = p || ler();
    var pos = function (id) { var i = p.ordem.indexOf(id); return i < 0 ? 1000 + IDS.indexOf(id) : i; };
    return IDS.slice().sort(function (a, b) { return pos(a) - pos(b); });
  }

  function home() {
    var app = document.getElementById('app'); if (!app) return;
    var els = [].slice.call(app.querySelectorAll(':scope > [data-bloco]')); if (!els.length) return;
    var p = ler(), ord = ordenados(p), por = {};
    els.forEach(function (el) { por[el.getAttribute('data-bloco')] = el; });
    var marca = document.createComment('pers'); els[0].parentNode.insertBefore(marca, els[0]);
    ord.forEach(function (id) { if (por[id]) marca.parentNode.insertBefore(por[id], marca); });
    marca.parentNode.removeChild(marca);
    els.forEach(function (el) {
      var id = el.getAttribute('data-bloco'), c = p.cores[id];
      if (p.ocultos.indexOf(id) > -1) el.setAttribute('data-pers-off', ''); else el.removeAttribute('data-pers-off');
      if (c) { el.setAttribute('data-cor', '1'); el.style.setProperty('--pers-cor', c); } else { el.removeAttribute('data-cor'); el.style.removeProperty('--pers-cor'); }
    });
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
  function padrao() { try { w.localStorage.removeItem(KEY); } catch (e) { } tudo(); }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-pers-open]'); if (!b) return;
    e.preventDefault();
    import('./pers-ui.js?v=2').then(function (m) { m.abrir(); }).catch(function () { });
  });

  w.IAPers = { BLOCOS: BLOCOS, TOPO: TOPO, ler: ler, gravar: gravar, ordenados: ordenados, home: home, topo: topo, tudo: tudo, padrao: padrao };
})(window);
