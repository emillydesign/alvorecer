// "Adaptar minha rotina": perguntas rápidas sobre energia, movimento, água, sono e comida,
// recomendações explicadas e horários sugeridos nos espaços livres da agenda.
// Funciona sem a IA (não gasta usos). Não substitui profissionais: orientações gerais e prudentes.
import { esc, uid } from './util.js';

const TODOS = [0, 1, 2, 3, 4, 5, 6], UTEIS = [1, 2, 3, 4, 5];
const min = h => +h.slice(0, 2) * 60 + +h.slice(3);
const hhmm = m => { m = ((Math.round(m / 5) * 5 % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const DIAS_TREINO = { 2: [2, 4], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6] };
const NOMES_DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

export const PERGUNTAS = [
  { id: 'energia', p: 'Em que parte do dia você costuma ter mais energia?', o: [['manha', 'De manhã'], ['tarde', 'À tarde'], ['noite', 'À noite'], ['varia', 'Varia muito']] },
  { id: 'cansa', p: 'Você sente que se esgota rápido ao longo do dia?', o: [['sim', 'Sim, chego cansado(a) no fim da tarde'], ['as-vezes', 'Às vezes'], ['nao', 'Não, aguento bem']] },
  { id: 'mover', p: 'Quer colocar exercício na sua rotina?', o: [['sim', 'Quero'], ['nao-gosto', 'Até quero, mas não gosto de treinar'], ['agora-nao', 'Agora não']] },
  { id: 'gosta', p: 'Do que você gosta ou toparia fazer?', multi: true, se: r => r.mover !== 'agora-nao', o: [['caminhar', 'Caminhar'], ['dancar', 'Dançar'], ['forca', 'Treino de força'], ['bike', 'Pedalar'], ['bola', 'Jogos e esportes'], ['alongar', 'Alongamento ou yoga'], ['nao-sei', 'Não sei ainda']] },
  { id: 'nivel', p: 'Quanto você já entende de treino?', se: r => r.mover !== 'agora-nao', o: [['nada', 'Nada, nunca treinei'], ['pouco', 'Já tentei algumas vezes'], ['bem', 'Treino ou já treinei bem']] },
  { id: 'onde', p: 'Onde seria mais fácil?', se: r => r.mover !== 'agora-nao', o: [['casa', 'Em casa'], ['rua', 'Na rua ou na praça'], ['academia', 'Na academia']] },
  { id: 'tempo', p: 'Quanto tempo cabe por dia?', se: r => r.mover !== 'agora-nao', o: [['15', '10 a 15 min'], ['25', '20 a 30 min'], ['45', '40 a 50 min'], ['60', '1 hora']] },
  { id: 'vezes', p: 'Quantos dias por semana parecem possíveis?', se: r => r.mover !== 'agora-nao', o: [['2', '2 dias'], ['3', '3 dias'], ['4', '4 dias'], ['5', '5 dias']] },
  { id: 'agua', p: 'E a água, como é para você?', o: [['esqueco', 'Eu esqueço de beber'], ['nao-gosto', 'Não gosto muito de beber água'], ['bem', 'Bebo bem']] },
  { id: 'sono', p: 'Como anda o seu sono?', o: [['bem', 'Durmo bem'], ['demora', 'Demoro para pegar no sono'], ['acordo', 'Acordo cansado(a)'], ['pouco', 'Durmo pouco']] },
  { id: 'comer', p: 'E as refeições?', multi: true, o: [['pulo-cafe', 'Pulo o café da manhã'], ['tarde', 'Como muito tarde da noite'], ['beliscos', 'Belisco o dia todo'], ['ok', 'Estão tranquilas']] },
  { id: 'sentado', p: 'Você passa muitas horas sentado(a)?', o: [['sim', 'Sim, quase o dia todo'], ['nao', 'Não muito']] }
];
export const visiveis = r => PERGUNTAS.filter(q => !q.se || q.se(r));

// ---------- horários livres ----------
// ocupações do dia (minutos) a partir da agenda: trabalho/estudo, deslocamentos, sono e o que já está marcado
function ocupado(itens, perfil, dia) {
  const p = perfil || {}, oc = [];
  const ac = min(p.acordar || '07:00'), dor = min(p.dormir || '22:30');
  oc.push([0, ac + 20], [dor - 30, 1440 + 60]);
  const trab = p.ocupacao && p.ocupacao !== 'nenhum' && p.inicio && p.fim && UTEIS.includes(dia);
  if (trab) oc.push([min(p.inicio) - (p.transporte || 0), min(p.fim) + (p.transporteVolta ?? p.transporte ?? 0)]);
  for (const i of itens) if (i.dias.includes(dia) && !i.rec && i.tipo !== 'agua') { const m = min(i.hora); oc.push([m - (i.tipo === 'refeicao' ? 0 : 10), m + (i.tipo === 'refeicao' ? 45 : i.tipo === 'treino' ? 60 : 20)]); }
  return { oc, ac, dor };
}
const livreEm = (oc, ini, dur) => oc.every(([a, b]) => ini + dur <= a || ini >= b);
// primeiro horário livre dentro das janelas, na ordem de preferência
function achar(oc, janelas, dur) {
  for (const [a, b] of janelas) for (let m = Math.ceil(a / 5) * 5; m + dur <= b; m += 5) if (livreEm(oc, m, dur)) return m;
  return null;
}

// ---------- recomendações ----------
export function recomendar(r, ag, saude) {
  const itens = ag.itens || [], p = ag.perfil || {}, recs = [];
  const diaRef = p.ocupacao && p.ocupacao !== 'nenhum' ? 1 : 2;
  const { oc, ac, dor } = ocupado(itens, p, diaRef);
  // cada recomendação ocupa o seu horário, para as próximas não ficarem por cima
  const add = o => { recs.push({ k: o.k, on: o.on !== false, ...o }); (o.itens || []).forEach(i => { if (i.tipo !== 'agua') { const m = min(i.hora); oc.push([m, m + (o.dur || 20)]); } }); };
  const perto = (alvo, dur, raio = 90) => achar(oc, [[alvo, alvo + raio], [alvo - raio, alvo], [ac, dor - 60]], dur) ?? alvo;
  const curtos = () => oc.filter(([a, b]) => b - a < 200); // refeições e itens marcados (sem o expediente)

  // movimento
  if (r.mover && r.mover !== 'agora-nao') {
    const dur = +r.tempo || 25, nao = r.mover === 'nao-gosto', gosta = [].concat(r.gosta || []);
    const manha = [ac + 20, ac + 240], tarde = [12 * 60, 18 * 60 + 30], noite = [18 * 60, dor - 150];
    let ord = r.cansa === 'sim' ? [manha, tarde, noite] : r.energia === 'noite' ? [noite, tarde, manha] : r.energia === 'tarde' ? [tarde, noite, manha] : [manha, noite, tarde];
    let m = achar(oc, ord, dur);
    if (m == null) m = achar(oc, [[ac, dor - 60]], dur);
    const atividade = nao ? (gosta.includes('dancar') ? 'Dançar' : gosta.includes('bola') ? 'Jogo ou esporte' : gosta.includes('bike') ? 'Pedalar' : 'Caminhada com música ou podcast')
      : gosta.includes('forca') || r.onde === 'academia' ? 'Treino de força' : gosta.includes('dancar') ? 'Dança' : gosta.includes('alongar') ? 'Alongamento ou yoga' : 'Caminhada';
    const vezes = +r.vezes || 3, dias = p.ocupacao === 'nenhum' ? (DIAS_TREINO[vezes] || [1, 3, 5]) : DIAS_TREINO[vezes] || [1, 3, 5];
    const porque = r.cansa === 'sim' ? 'Você disse que se esgota ao longo do dia: de manhã a energia ainda está alta, e o exercício cedo costuma dar mais disposição para o resto do dia.'
      : r.energia === 'noite' ? 'Você rende mais à noite. Deixei pelo menos 2 horas antes de dormir, para o treino não atrapalhar o sono.'
        : r.energia === 'tarde' ? 'Você tem mais energia à tarde, então coloquei o treino nesse período.' : 'Escolhi um horário livre em que você costuma ter energia.';
    const iniciante = r.nivel === 'nada' ? ' Como você está começando, a ideia é ir devagar: fazer pouco e sempre vale mais do que muito de vez em quando.' : '';
    add({
      k: 'treino', dur: dur + 10, ic: 'dumbbell', t: nao ? 'Movimento que não parece treino' : 'Seu horário de treino',
      txt: (nao ? 'Não precisa ser academia. Escolha algo que você gosta e comece com pouco: 10 a 15 minutos já contam. Colocar a sua música preferida ou fazer com alguém ajuda muito. ' : '') + porque + iniciante,
      dicas: nao ? ['Comece com 10 minutos: se quiser mais, continue.', 'Junte com algo bom: música, série, conversa.', 'Escadas, ir a pé ao mercado e brincar também contam.'] : r.nivel === 'nada' ? ['Primeira semana: só aprender os movimentos, sem peso.', 'Aqueça 5 minutos antes e alongue no fim.', 'Dor forte ou falta de ar: pare e procure a UBS.'] : ['Aumente aos poucos: um pouco mais de peso ou tempo por semana.', 'Durma bem nos dias de treino: é quando o corpo se recupera.'],
      itens: m == null ? [] : [{ hora: hhmm(m), titulo: `${atividade} (${dur} min)`, tipo: 'treino', dias }],
      sem: m == null ? 'Não achei um espaço livre de ' + dur + ' minutos na sua rotina. Tente um tempo menor ou ajuste a agenda.' : '',
      link: ['#/cuidar/treino', r.nivel === 'nada' || r.mover === 'nao-gosto' ? 'Montar um treino passo a passo' : 'Montar meu treino detalhado'],
      quando: `${hhmm(m ?? 0)} · ${dias.map(d => NOMES_DIAS[d]).join(', ')}`
    });
  }

  // energia ao longo do dia
  if (r.cansa === 'sim' || r.cansa === 'as-vezes' || r.sentado === 'sim') {
    const pausas = [];
    if (p.ocupacao && p.ocupacao !== 'nenhum' && p.inicio && p.fim) {
      const ini = min(p.inicio), fim = min(p.fim);
      for (let m = ini + 100; m < fim - 30 && pausas.length < 3; m += 120) { const x = achar(curtos(), [[m, m + 60], [m - 40, m]], 10); if (x != null && x < fim - 15) pausas.push(x); }
    } else [10 * 60 + 30, 15 * 60 + 30].forEach(m => { const x = achar(curtos(), [[m, m + 60]], 10); if (x != null) pausas.push(x); });
    add({
      k: 'pausa', ic: 'battery-charging', t: 'Pausas para recarregar', on: r.cansa === 'sim' || r.sentado === 'sim',
      txt: 'Pausas curtas de 5 minutos para levantar, alongar e olhar para longe ajudam a não chegar esgotado(a) no fim do dia, principalmente para quem fica muito sentado. Pegar luz do sol logo cedo também ajuda o corpo a entender que é dia.',
      dicas: ['Beba um copo de água em cada pausa.', 'Prefira um almoço mais leve: refeições pesadas dão sono à tarde.', 'Cansaço forte que não passa merece consulta na UBS (pode ser anemia, tireoide ou outra causa).'],
      itens: pausas.map(m => ({ hora: hhmm(m), titulo: 'Pausa: levantar, alongar e beber água', tipo: 'cuidado', dias: p.ocupacao && p.ocupacao !== 'nenhum' ? UTEIS : TODOS })),
      quando: pausas.map(hhmm).join(', ')
    });
  }

  // comida
  const cm = [].concat(r.comer || []);
  if (cm.includes('pulo-cafe')) add({ k: 'cafe', ic: 'coffee', t: 'Um café da manhã simples', txt: 'Não precisa ser grande: algo rápido, como fruta com iogurte, pão com ovo ou um copo de leite com aveia, ajuda a não chegar com muita fome no almoço.', dicas: ['Deixe pronto na noite anterior.', 'Se não sente fome cedo, coma algo leve até 2 horas depois de acordar.'], dur: 25, itens: [{ hora: hhmm(perto(ac + 30, 25)), titulo: 'Café da manhã', tipo: 'refeicao', dias: TODOS }], quando: '' });
  if (cm.includes('tarde') && p.dormir) add({ k: 'jantar', ic: 'utensils', t: 'Jantar um pouco mais cedo', txt: 'Comer muito perto de deitar pode atrapalhar o sono e a digestão. O ideal é jantar cerca de 2 a 3 horas antes de dormir.', dicas: ['Se a fome bater depois, prefira algo leve.'], dur: 40, itens: [{ hora: hhmm(perto(min(p.dormir) - 150, 40, 60)), titulo: 'Jantar', tipo: 'refeicao', dias: TODOS }], quando: '' });
  if (cm.includes('beliscos')) add({ k: 'lanche', ic: 'apple', t: 'Lanche com hora marcada', txt: 'Ter um lanche no meio da tarde, com horário, costuma diminuir os beliscos sem perceber.', dicas: ['Fruta, castanhas, iogurte ou pão integral são boas opções.', 'Beliscar às vezes é sede: tente um copo de água antes.'], dur: 20, itens: [{ hora: hhmm(achar(curtos(), [[16 * 60, 17 * 60], [15 * 60, 16 * 60]], 15) ?? 16 * 60), titulo: 'Lanche da tarde', tipo: 'refeicao', dias: TODOS }], quando: '' });
  // água
  if (r.agua && r.agua !== 'bem') {
    const peso = +saude?.profile?.peso, meta = peso > 0 ? Math.round(35 * peso / 50) * 50 : 2000, copos = Math.min(10, Math.ceil(meta / 250));
    const temAgua = itens.some(i => i.tipo === 'agua');
    const ganchos = [ac + 10, ...itens.filter(i => i.tipo === 'refeicao' && i.dias.includes(diaRef)).map(i => min(i.hora) - 20)];
    const slots = [];
    for (const g of ganchos) if (g > ac && g < dor - 60 && slots.every(s => Math.abs(s - g) >= 60)) slots.push(g);
    for (let m = ac + 90; slots.length < copos && m < dor - 60; m += 30) if (slots.every(s => Math.abs(s - m) >= 75)) slots.push(m);
    slots.sort((a, b) => a - b);
    add({
      k: 'agua', ic: 'droplets', t: r.agua === 'nao-gosto' ? 'Água de um jeito mais fácil' : 'Lembretes de água', on: !temAgua,
      txt: (r.agua === 'nao-gosto' ? 'Não precisa ser só água pura: chás sem açúcar e água com frutas também contam. ' : 'Ligar a água a coisas que você já faz funciona melhor do que lembrar sozinho(a). ') + `Sua meta é de cerca de ${(meta / 1000).toFixed(1).replace('.', ',')} L por dia${peso > 0 ? '' : ' (uma média; informe seu peso em Alimentação para calcular a sua)'}, dividida em copos de 250 ml.`,
      dicas: r.agua === 'nao-gosto' ? ['Coloque rodelas de limão, laranja, hortelã ou gengibre numa garrafa na geladeira.', 'Água bem gelada costuma ser mais fácil de beber.', 'Frutas como melancia e laranja também hidratam.'] : ['Deixe uma garrafa sempre à vista, na mesa ou na bolsa.', 'Um copo ao acordar e um antes de cada refeição.', 'Ligue os avisos de água em Alimentação & água.'],
      itens: slots.map(m => ({ hora: hhmm(m), titulo: 'Beber um copo de água', tipo: 'agua', dias: TODOS, ml: 250 })),
      link: ['#/cuidar/alimentacao', 'Calcular minha água e ligar avisos'],
      quando: `${slots.length} copos: ${slots.map(hhmm).join(', ')}`, sem: temAgua ? 'Você já tem horários de água: se marcar, eles são trocados por estes.' : ''
    });
  }

  // sono
  if (r.sono && r.sono !== 'bem' && p.dormir) {
    add({
      k: 'sono', ic: 'moon', t: 'Desacelerar antes de dormir', on: !itens.some(i => /higiene do sono/i.test(i.titulo)),
      txt: r.sono === 'pouco' ? 'Adultos costumam precisar de 7 a 9 horas. Um lembrete para começar a desacelerar ajuda a dormir na hora.' : r.sono === 'acordo' ? 'Acordar cansado(a) pode ter a ver com horários irregulares, telas e cafeína tarde. Um ritual simples antes de dormir ajuda.' : 'Para pegar no sono mais fácil, o corpo precisa de um aviso: luz baixa e sem telas por 30 minutos.',
      dicas: ['Tente dormir e acordar em horários parecidos, até no fim de semana.', 'Evite café, chá preto e refrigerante de cola depois das 16h.', 'Ronco forte ou insônia frequente: procure a UBS.'],
      itens: [{ hora: hhmm(min(p.dormir) - 30), titulo: 'Desacelerar: luz baixa e sem telas', tipo: 'sono', dias: TODOS }],
      quando: hhmm(min(p.dormir) - 30)
    });
  }

  return recs;
}

// coloca as recomendações escolhidas na agenda (as de antes são trocadas, sem mexer no resto)
export function aplicar(ag, recs, marcados) {
  let n = 0;
  for (const rec of recs) {
    if (!marcados.includes(rec.k) || !rec.itens.length) continue;
    ag.itens = ag.itens.filter(i => i.rec !== rec.k && !(rec.k === 'agua' && i.tipo === 'agua'));
    for (const i of rec.itens) { ag.itens.push({ id: uid(), ...i, rec: rec.k }); n++; }
  }
  return n;
}

// ---------- tela ----------
export function abrir(el, { S, toast, salvar, voltar }) {
  const ag = S.state.agenda, r = { ...(ag.adaptar || {}) };
  let passo = 0;
  const lista = () => visiveis(r);
  function pergunta() {
    const qs = lista(), q = qs[passo], marcado = v => [].concat(r[q.id] ?? []).includes(v);
    el.innerHTML = `<div class="ra"><div class="ra-topo"><span>Pergunta ${passo + 1} de ${qs.length}</span><div class="ra-barra"><i style="width:${Math.round(passo / qs.length * 100)}%"></i></div></div>
      <h2>${esc(q.p)}</h2>${q.multi ? '<p class="small muted">Pode escolher mais de uma.</p>' : ''}
      <div class="ra-ops">${q.o.map(([v, l]) => `<button type="button" class="ra-op${marcado(v) ? ' on' : ''}" data-v="${v}" aria-pressed="${marcado(v)}">${esc(l)}</button>`).join('')}</div>
      <div class="row ra-nav"><button type="button" class="btn btn-ghost" data-ra="volta">${passo ? 'Voltar' : 'Cancelar'}</button><span class="spacer"></span>${q.multi ? `<button type="button" class="btn btn-pink" data-ra="segue"${[].concat(r[q.id] || []).length ? '' : ' disabled'}>Continuar</button>` : ''}</div></div>`;
  }
  function resultado() {
    ag.adaptar = r; salvar();
    const recs = recomendar(r, ag, S.state.health || {});
    const marcados = new Set(recs.filter(x => x.on && x.itens.length).map(x => x.k));
    el.innerHTML = `<div class="ra"><div class="eyebrow">Suas recomendações</div><h2>Montei isto a partir das suas respostas</h2>
      <p class="muted">Marque o que você quer colocar na agenda. Os horários foram escolhidos nos seus espaços livres e você pode mudar tudo depois em "Minha rotina". São orientações gerais: não substituem um profissional de saúde.</p>
      ${recs.length ? recs.map(x => `<article class="ra-rec"><label class="ra-marca">${x.itens.length ? `<input type="checkbox" data-k="${x.k}"${marcados.has(x.k) ? ' checked' : ''}>` : ''}<span class="ra-ic"><i data-lucide="${x.ic}"></i></span><span><b>${esc(x.t)}</b>${x.itens.length ? `<small>${esc(x.quando || x.itens[0].hora)}</small>` : ''}</span></label>
        <p>${esc(x.txt)}</p>${x.sem ? `<p class="small ra-sem">${esc(x.sem)}</p>` : ''}<ul>${x.dicas.map(d => `<li>${esc(d)}</li>`).join('')}</ul>${x.link ? `<a class="btn btn-ghost btn-sm" href="${x.link[0]}">${esc(x.link[1])}</a>` : ''}</article>`).join('') : '<div class="panel muted">Pelas suas respostas, a sua rotina já está bem equilibrada. Se algo mudar, é só refazer.</div>'}
      <div class="row ra-nav"><button type="button" class="btn btn-ghost" data-ra="refaz">Refazer perguntas</button><span class="spacer"></span>${recs.some(x => x.itens.length) ? '<button type="button" class="btn btn-pink" data-ra="aplica">Colocar na minha agenda</button>' : ''}</div></div>`;
    el.onchange = e => { const c = e.target.closest('[data-k]'); if (c) c.checked ? marcados.add(c.dataset.k) : marcados.delete(c.dataset.k); };
    el.onclick = e => {
      const b = e.target.closest('[data-ra]'); if (!b) return;
      if (b.dataset.ra === 'refaz') { passo = 0; el.onchange = null; el.onclick = clique; return pergunta(); }
      if (S.readonly) return toast('Modo visitante: crie sua conta para salvar sua agenda.');
      const n = aplicar(ag, recs, [...marcados]); salvar();
      toast(n ? `${n} ${n === 1 ? 'horário adicionado' : 'horários adicionados'} à sua agenda ✓` : 'Marque pelo menos uma recomendação.');
      if (n) voltar();
    };
  }
  function clique(e) {
    const qs = lista(), q = qs[passo], op = e.target.closest('[data-v]'), nav = e.target.closest('[data-ra]');
    if (op) {
      const v = op.dataset.v;
      if (q.multi) {
        let l = [].concat(r[q.id] || []);
        l = l.includes(v) ? l.filter(x => x !== v) : v === 'ok' || v === 'nao-sei' ? [v] : [...l.filter(x => x !== 'ok' && x !== 'nao-sei'), v];
        r[q.id] = l; return pergunta();
      }
      r[q.id] = v; passo++;
      return passo >= lista().length ? resultado() : pergunta();
    }
    if (!nav) return;
    if (nav.dataset.ra === 'volta') { if (!passo) return voltar(); passo--; return pergunta(); }
    if (nav.dataset.ra === 'segue') { passo++; return passo >= lista().length ? resultado() : pergunta(); }
  }
  el.onclick = clique;
  pergunta();
}
