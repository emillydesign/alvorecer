// Pop-up "Começar": a pessoa escolhe a categoria e o curso que quiser. Arquivo à parte: só carrega ao clicar em "Começar".
export function abrirComecar({ C, S, openInfo, esc, icoOf, grad, onDias, onPedir }) {
  const idiomas = [...C.languages, ...(S.state.customLangs || [])];
  const custom = S.state.custom || [];
  const cats = [
    { id: 'idiomas', t: 'Idiomas', s: `${idiomas.length} idiomas`, i: 'languages', g: ['#2dd4bf', '#2563eb'], itens: idiomas.map(l => ({ t: l.name, s: l.native || '', h: '#/curso/lang:' + l.id })) },
    ...Object.entries(C.tracks).map(([id, t]) => ({ id, t: t.name, s: `${t.courses.length} cursos`, i: t.icon, g: t.g || ['#38bdf8', '#4f46e5'], itens: t.courses.map(c => ({ t: c.title, s: c.sub || '', h: '#/curso/trk:' + c.id })) })),
    { id: 'seu', t: 'Seu Alvorecer', s: custom.length ? `${custom.length} ${custom.length === 1 ? 'curso seu' : 'cursos seus'}` : 'cursos sob medida', i: 'sparkles', g: ['#fcd34d', '#14b8a6'], itens: custom.map(c => ({ t: c.title, s: c.sub || '', h: '#/curso/cus:' + c.id })), pedir: true },
    { id: 'cuidar', t: 'Cuidar de mim', s: 'desabafo, alimentação, treino', i: 'heart-handshake', g: ['#86efac', '#6366f1'], h: '#/cuidar' }
  ];

  const topo = `<div class="eyebrow">Começar</div><h2 style="margin:10px 0 8px">Comece por onde você quiser</h2>
    <p class="muted" style="margin-bottom:18px">Não existe ordem certa. Escolha o que der mais vontade hoje: um idioma, uma carreira, uma área nova. Um passo pequeno já é começar, e dá para trocar quando quiser.</p>`;
  const rodape = `<div class="row" style="margin-top:22px;gap:10px"><button class="btn btn-ghost btn-sm" data-dias-open>Escolher meus dias de estudo</button><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-close>Fechar</button></div>`;

  const tela = cat => {
    if (!cat) return `${topo}<div class="atiles">${cats.map(c => `<${c.h ? 'a href="' + esc(c.h) + '" data-close' : 'button type="button" data-cat="' + esc(c.id) + '"'} class="atile pat-dots" style="${grad(c.g)}"><i>${icoOf(c.i)}</i><div><b>${esc(c.t)}</b><br><small>${esc(c.s)}</small></div></${c.h ? 'a' : 'button'}>`).join('')}</div>${rodape}`;
    return `<div class="eyebrow">Começar</div><h2 style="margin:10px 0 8px">${esc(cat.t)}</h2>
      <p class="muted" style="margin-bottom:16px">Escolha o curso para começar agora.</p>
      <div style="display:flex;flex-direction:column;gap:10px">${cat.itens.map(x => `<a class="task" href="${esc(x.h)}" data-close style="text-align:left;width:100%"><span><div class="t">${esc(x.t)}</div>${x.s ? `<div class="s">${esc(x.s)}</div>` : ''}</span></a>`).join('')}
      ${cat.pedir ? `<button type="button" class="task" data-pedir style="text-align:left;width:100%"><span><div class="t">Pedir um curso novo ao IAlvorecer</div><div class="s">Ele cria um curso completo só para você</div></span></button>` : ''}</div>
      <div class="row" style="margin-top:22px"><button class="btn btn-ghost btn-sm" data-voltar>Voltar às categorias</button><span class="spacer"></span><button class="btn btn-ghost btn-sm" data-close>Fechar</button></div>`;
  };

  const ov = openInfo('<div id="cmcBody"></div>');
  const corpo = ov.querySelector('#cmcBody');
  const mostra = cat => { corpo.innerHTML = tela(cat); ov.querySelector('.modal-box').scrollTop = 0; };
  mostra(null);
  ov.addEventListener('click', e => {
    const c = e.target.closest('[data-cat]'); if (c) return mostra(cats.find(x => x.id === c.dataset.cat));
    if (e.target.closest('[data-voltar]')) return mostra(null);
    if (e.target.closest('[data-dias-open]')) { ov.remove(); return onDias(); }
    if (e.target.closest('[data-pedir]')) { ov.remove(); return onPedir(); }
  });
}
