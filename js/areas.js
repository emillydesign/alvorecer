// Áreas: grupos em colunas, busca e "continuar de onde parou". Usado no botão Áreas e na página de cursos (só carrega quando abre).
// Conteúdo e busca são locais: não chamam a IA. Só "Criar curso" conversa com o assistente.
const PAL = [['#4a8fe0', '#13467a'], ['#34c28a', '#0f5e55'], ['#4fb6d6', '#0f5f78'], ['#5fc79a', '#1a6f86'], ['#3fb3e8', '#1d6a9c'], ['#4fd1b5', '#17756f'], ['#60a5fa', '#0f766e'], ['#6cc27a', '#1f7a5a'], ['#2fbfa8', '#0e6270'], ['#5b9be8', '#157a80'], ['#58c79e', '#1f7f78'], ['#3f86c8', '#12476f']];
const tom = i => { const k = i % 12; return `background:linear-gradient(160deg,var(--k${k}a,${PAL[k][0]}),var(--k${k}b,${PAL[k][1]}))`; };
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const VAZIAS = new Set(['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'e', 'em', 'no', 'na', 'para', 'pra', 'com', 'um', 'uma', 'curso', 'cursos', 'aula', 'aulas', 'quero', 'aprender', 'estudar', 'sobre']);

function dados({ C, S }) {
  const it = (h, ic, t, d, extra) => ({ h, ic, t, d: d || '', extra });
  const trilhas = Object.entries(C.tracks), nC = n => `${n} ${n === 1 ? 'curso' : 'cursos'}`;
  const achar = k => { const id = k.replace(/^trk:/, ''); for (const [, t] of trilhas) { const c = t.courses.find(x => x.id === id); if (c) return c; } return null; };
  const nCus = (S.state.custom || []).length;
  const curso = c => it('#/curso/trk:' + c.id, c.icon || 'book-open', c.title, c.sub, (c.lessons || []).map(l => typeof l === 'string' ? l : l?.title).join(' '));
  const grupos = [
    { id: 'aprender', ic: 'graduation-cap', t: 'Aprender', sec: [['', [
      it('#/idiomas', 'languages', 'Idiomas', `${C.languages.length} idiomas, do zero ao fluente`),
      it('#/trilha/tech', 'cpu', C.tracks.tech.name, `${nC(C.tracks.tech.courses.length)} + mentoria`),
      ...trilhas.filter(([, t]) => t.area).map(([id, t]) => it('#/trilha/' + id, t.icon, t.name, nC(t.courses.length))),
      it('#/seu', 'sparkles', 'Cursos personalizados', nCus ? `${nC(nCus)} seus` : 'peça o que quiser')
    ]]] },
    { id: 'todos', ic: 'layout-grid', t: 'Todos os cursos', sec: [
      ...((S.state.custom || []).length ? [['Feitos para você', S.state.custom.map(c => it('#/curso/cus:' + c.id, 'sparkles', c.title, c.sub))]] : []),
      ...trilhas.map(([, t]) => [t.name, t.courses.map(curso)]),
      ['Idiomas', [...C.languages, ...(S.state.customLangs || [])].map(l => it('#/curso/lang:' + l.id, 'languages', l.name, l.native || ''))]
    ] },
    { id: 'essencial', ic: 'compass', t: 'Essenciais', sec: [
      ['Cursos essenciais', (C.essencial?.itens || []).map(x => achar(x.k)).filter(Boolean).map(curso)],
      ['Cuidados, em etapas', (C.cuidadosEssenciais?.etapas || []).map(e => it(e.h, e.i || 'circle', e.curto || e.t, e.t))]
    ] },
    { id: 'cuidar', ic: 'heart-handshake', t: 'Cuidar de você', sec: [['', [
      it('#/cuidar', 'heart-handshake', 'Cuidar de mim', 'desabafo, alimentação, treino'),
      it('#/cuidar/desabafo', 'message-circle-heart', 'Desabafo', 'um espaço para ser ouvida(o)'),
      it('#/cuidar/alimentacao', 'salad', 'Alimentação & água', 'plano, água do dia, foto do prato'),
      it('#/cuidar/treino', 'dumbbell', 'Treino', 'em casa ou na academia', 'exercicio musculacao academia'),
      it('#/cuidados', 'sparkles', 'Cuidados', 'pele, unhas, cabelo, cheiro'),
      it('#/cuidados/pele', 'sparkles', 'Pele', 'rotina, ácidos e protetor', 'skincare acne espinha'),
      it('#/cuidados/unhas', 'hand', 'Unhas', 'cuidados e fortalecimento', 'esmalte'),
      it('#/cuidados/cabelo', 'scissors', 'Cabelo', 'do seu tipo de fio'),
      it('#/cuidados/higiene', 'droplets', 'Higiene e cheiro', 'banho, desodorante, hálito'),
      it('#/cuidados/perfumes', 'spray-can', 'Perfumes', 'notas olfativas'),
      it('#/cuidados/estilo', 'shirt', 'Estilo e moda', 'o seu jeito de se vestir', 'roupas'),
      it('#/cuidados/musica', 'music', 'Música', 'descobertas para o seu gosto')
    ]]] },
    { id: 'rotina', ic: 'calendar-check', t: 'Rotina e carreira', sec: [['', [
      it('#/agenda', 'calendar-check', 'Agenda', 'rotina e checklist do dia'),
      it('#/cronograma', 'calendar-days', 'Cronograma', 'seus dias de estudo'),
      it('#/tempo', 'hourglass', 'Mais tempo para você', 'trabalho melhor, mais tempo livre'),
      it('#/mentoria', 'compass', 'Mentoria de carreira', 'gratuita, com a IA', 'emprego trabalho')
    ]]] },
    { id: 'site', ic: 'info', t: 'Sobre o site', sec: [['', [
      it('#/guia', 'book-open', 'Guia', 'como usar o IAlvorecer'),
      it('#/sobre', 'info', 'Sobre', 'quem faz e por quê'),
      it('#/apoiar', 'heart', 'Apoiar', 'ajude o projeto a continuar', 'pix doacao'),
      it('#/ajustes', 'settings', 'Ajustes', 'conta, e-mails e aparência')
    ]]] }
  ];
  return grupos;
}

// busca por nome, descrição e temas das aulas; tolera começo de palavra e uma letra errada
export function buscar(q, lista) {
  const toks = norm(q).split(' ').filter(t => t && !VAZIAS.has(t)), frase = toks.join(' ');
  if (!toks.length) return [];
  const perto = (a, b) => { // uma letra trocada, a mais ou a menos
    if (a.length < 5 || Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, e = 0;
    while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++e > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
    return e + (a.length - i) + (b.length - j) <= 1;
  };
  return lista.map(x => {
    const t = norm(x.t).split(' '), d = norm(x.d).split(' '), ex = norm(x.extra).split(' ');
    let p = 0;
    for (const k of toks) {
      const bate = (w, n) => w === k ? n : k.length > 1 && w.startsWith(k) ? n * .8 : perto(k, w) ? n * .6 : 0;
      const m = Math.max(0, ...t.map(w => bate(w, 10)), ...d.map(w => bate(w, 4)), ...(k.length > 3 ? ex.map(w => bate(w, 2)) : []));
      if (!m) return null; // todas as palavras precisam aparecer
      p += m;
    }
    if (norm(x.t).includes(frase)) p += 6;
    return { x, p };
  }).filter(Boolean).sort((a, b) => b.p - a.p).map(r => r.x);
}

// "quero aprender curso de violão" vira "violão"
const tema = t => t.replace(/^(?:(?:eu )?(?:quero|queria|gostaria de)\s+)?(?:(?:aprender|estudar|fazer)\s+)?(?:(?:um |uma )?(?:curso|aula)s?\s+)?(?:(?:de|sobre)\s+)?/i, '') || t;

export function montar(root, ctx, { fechar = () => { }, pop = false } = {}) {
  const { C, S, esc, icoOf, recentes, criar } = ctx, grupos = dados(ctx);
  let g = grupos[0].id, q = '', n = 0;
  const vistos = new Set(), tudo = [];
  grupos.forEach(x => x.sec.forEach(([, l]) => l.forEach(i => { if (!vistos.has(i.h)) { vistos.add(i.h); tudo.push(i); } })));
  (C.complementary || []).forEach(c => tudo.push({ h: '#/curso/comp:' + c.id, ic: c.icon || 'book-open', t: c.title, d: c.sub || 'Curso complementar' }));
  tudo.push({ h: '#/memorizacao', ic: 'repeat-2', t: 'Memorização', d: 'revisar o que você aprendeu', extra: 'cartoes revisao' });
  const tile = i => `<a class="atile ax-it" href="${esc(i.h)}" style="${tom(n++)}"><i>${icoOf(i.ic)}</i><div><b>${esc(i.t)}</b>${i.d ? `<small>${esc(i.d)}</small>` : ''}</div></a>`;
  const rec = recentes();
  root.innerHTML = `<div class="ax${pop ? ' ax-pop' : ''}">
    <div class="ax-topo"><label class="ax-busca"><i data-lucide="search"></i><input type="search" maxlength="60" placeholder="O que você quer aprender?" aria-label="Buscar curso ou área" autocomplete="off" spellcheck="false"></label>${pop ? '<button type="button" class="iconbtn" data-ax-x title="Fechar" aria-label="Fechar"><i data-lucide="x"></i></button>' : ''}</div>
    ${rec.length ? `<div class="ax-rec"><small>Continuar de onde parou</small><div>${rec.map(r => `<a href="${esc(r.h)}"><span><b>${esc(r.t)}</b><small>${esc(r.d)}</small></span><em>${r.pct}%</em><u style="width:${r.pct}%"></u></a>`).join('')}</div></div>` : ''}
    <div class="ax-corpo"><div class="ax-nav" role="tablist" aria-label="Grupos">${grupos.map(x => `<button type="button" role="tab" data-g="${x.id}"><i data-lucide="${x.ic}"></i><span>${esc(x.t)}</span></button>`).join('')}</div><div class="ax-lista" role="tabpanel" aria-live="polite"></div></div>
    ${pop ? `<span class="dv-po ax-po" aria-hidden="true">${[6, 22, 38, 55, 71, 88].map((l, i) => `<i style="left:${l}%;animation-delay:-${i * 1.3}s;animation-duration:${6 + i % 3}s"></i>`).join('')}</span>` : ''}
  </div>`;
  const el = s => root.querySelector(s), lista = el('.ax-lista'), campo = el('input');
  const pedir = t => `<button type="button" class="ax-criar" data-ax-criar><i data-lucide="sparkles"></i><span><b>Criar um curso de “${esc(tema(t))}”</b><small>O IAlvorecer monta as aulas para você, do básico ao avançado</small></span></button>`;
  function pintar() {
    n = 0;
    root.querySelectorAll('[data-g]').forEach(b => { const on = !q && b.dataset.g === g; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
    if (q) {
      const r = buscar(q, tudo).slice(0, 24);
      lista.innerHTML = r.length ? `<h4>${r.length === 1 ? '1 resultado' : r.length + ' resultados'}</h4><div class="ax-grid">${r.map(tile).join('')}</div><p class="ax-nao">Não era bem isso?</p>${pedir(q)}` : `<div class="ax-vazio"><h3>Ainda não temos esse curso</h3><p class="muted">Mas ele pode ser criado agora, de graça e do seu jeito.</p>${pedir(q)}</div>`;
    } else {
      const x = grupos.find(y => y.id === g);
      lista.innerHTML = x.sec.filter(([, l]) => l.length).map(([t, l]) => `${t ? `<h4>${esc(t)}</h4>` : ''}<div class="ax-grid">${l.map(tile).join('')}</div>`).join('') + (g === 'aprender' || g === 'todos' ? `<button type="button" class="ax-criar" data-ax-criar><i data-lucide="sparkles"></i><span><b>Criar um curso</b><small>Não achou o que queria? Peça ao IAlvorecer</small></span></button>` : '');
    }
    lista.scrollTop = 0;
    try { window.lucide?.createIcons(); } catch { }
  }
  campo.oninput = () => { q = campo.value.trim().replace(/\s+/g, ' '); if (!norm(q)) q = ''; pintar(); };
  campo.onkeydown = e => { if (e.key === 'Escape' && campo.value) { e.stopPropagation(); e.preventDefault(); campo.value = ''; q = ''; pintar(); } else if (e.key === 'Enter' && q) { const a = lista.querySelector('a.ax-it'); if (a) a.click(); else lista.querySelector('[data-ax-criar]')?.focus(); } };
  root.onclick = e => {
    const b = e.target.closest('[data-g]');
    if (b) { g = b.dataset.g; q = ''; campo.value = ''; return pintar(); }
    if (e.target.closest('[data-ax-x]')) return fechar();
    if (e.target.closest('[data-ax-criar]')) { const t = q && tema(q); fechar(); return criar(t); }
    const a = e.target.closest('a[href]'); if (a && a.getAttribute('href') === location.hash) fechar();
  };
  pintar();
  if (pop && matchMedia('(hover:hover)').matches) campo.focus();
}
