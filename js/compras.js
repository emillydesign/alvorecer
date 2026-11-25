// "Comprar bem": como escolher produtos ideais gastando pouco. Conteúdo fixo (não chama a IA, não gasta nada) e sem indicar marcas ou lojas.
import { esc } from './util.js';

const GUIAS = {
  pele: {
    nome: 'produtos para a pele', un: 'ml ou g',
    basico: ['Um sabonete suave para o rosto', 'Um hidratante simples, em gel se a pele for oleosa ou em creme se for seca', 'Protetor solar FPS 30 ou mais', 'Só depois, se precisar, um único ativo de tratamento'],
    rotulo: ['Procure no rótulo a regularização na Anvisa e a validade. Desconfie de produto fracionado, sem caixa ou sem lote.', 'Compare o nome do ativo e a porcentagem, não a promessa da frente. Niacinamida ou ácido salicílico de marcas simples podem cumprir o mesmo papel.', 'Ácidos: comece com um só, em concentração baixa e poucas noites por semana. Use protetor de dia e pare se arder forte, descascar muito ou inchar.', 'Grávidas, quem amamenta, quem usa remédio para acne ou tem doença de pele: fale com um profissional antes de comprar ácidos ou retinoides.'],
    economize: ['Teste em uma área pequena antes e escolha a embalagem menor na primeira compra.', 'Não compre vários ácidos juntos: além de gastar mais, irrita e você não descobre qual funcionou.', 'Tônico, água termal, esfoliante e sérum caro são opcionais.'],
    evite: ['Receitas com limão, bicarbonato ou pasta de dente', 'Promessas de resultado em poucos dias', 'Ácidos fortes de uso profissional para aplicar em casa']
  },
  sol: {
    nome: 'protetor solar', un: 'ml ou g',
    basico: ['FPS 30 ou mais, com proteção UVA indicada no rótulo', 'Resistência à água se você sua, pratica esporte ou vai à praia', 'Uma textura que você goste: o melhor protetor é o que você usa todo dia', 'Chapéu, sombra e roupa, que protegem por muito tempo sem precisar recomprar'],
    rotulo: ['Confira a regularização na Anvisa, a validade e a embalagem lacrada.', 'O mesmo protetor pode servir para rosto e corpo, desde que não irrite nem deixe a pele do rosto oleosa.', 'Cor, perfume e efeito de maquiagem encarecem. A cor só faz diferença em alguns casos, como manchas.', 'Para bebês com menos de 6 meses, fale com o pediatra: a proteção principal é sombra e roupa.'],
    economize: ['Compare o preço por ml: o frasco grande muitas vezes compensa se for usado antes de vencer.', 'Não economize na quantidade: pouco produto protege bem menos. Reaplique a cada 2 horas no sol e depois de nadar ou suar.', 'Um FPS muito alto não substitui quantidade e reaplicação.'],
    evite: ['Protetor caseiro', 'Produto vencido ou que ficou no carro quente', 'Óleo bronzeador no lugar do protetor']
  },
  unhas: {
    nome: 'produtos para as unhas', un: 'ml ou unidades',
    basico: ['Lixa e cortador próprios', 'Um creme para mãos, que também hidrata as cutículas', 'Base e um esmalte que combine com tudo', 'Removedor, se usar esmalte'],
    rotulo: ['Veja validade e regularização na Anvisa.', 'Para gel, a cabine precisa ser compatível com o produto; remover errado estraga a unha.', 'Coceira, vermelhidão ou inchaço: pare de usar, pois pode ser alergia.'],
    economize: ['Comece com poucas cores e feche bem a tampa para durar.', 'Um óleo vegetal simples pode ajudar na hidratação das cutículas.', 'Some preço, manutenção e remoção antes de escolher gel.'],
    evite: ['Compartilhar alicate sem esterilizar', 'Kits de gel sem procedência', 'Arrancar esmalte em gel']
  },
  cabelo: {
    nome: 'produtos para o cabelo', un: 'ml ou g',
    basico: ['Shampoo adequado ao couro cabeludo', 'Condicionador adequado ao comprimento', 'Um creme de pentear ou uma máscara, se o fio precisar', 'Protetor térmico, se usar calor'],
    rotulo: ['Escolha o shampoo pela raiz e o condicionador pelas pontas.', 'A maioria dos produtos melhora o aspecto do fio: promessa de reconstruir tudo é marketing.', 'Alisante precisa ser regularizado na Anvisa. Nunca use formol.', 'Caspa forte, feridas ou queda intensa: procure a UBS ou dermatologista antes de gastar.'],
    economize: ['Não é preciso comprar a linha inteira.', 'Compare o preço por ml e use a máscara só no comprimento.', 'Um bom creme pode servir para pentear e finalizar, se o rótulo permitir.'],
    evite: ['Tônico milagroso para crescer cabelo', 'Progressiva sem rótulo', 'Trocar tudo de uma vez']
  },
  higiene: {
    nome: 'produtos de higiene', un: 'ml, g ou unidades',
    basico: ['Sabonete suave', 'Escova macia, creme dental com flúor e fio dental', 'Desodorante, ou antitranspirante se o suor incomodar', 'Hidratante simples'],
    rotulo: ['Desodorante trata o cheiro; antitranspirante reduz o suor.', 'Creme dental para adultos: procure flúor entre 1000 e 1500 ppm.', 'Enxaguante não substitui escova e fio.'],
    economize: ['Compare rolos, barras e refis pelo preço por unidade.', 'A UBS pode orientar sobre atendimento odontológico gratuito.', 'Aproveite promoções só do que vai usar até vencer.'],
    evite: ['Ducha ou sabonete dentro da região íntima', 'Bicarbonato puro nos dentes ou nas axilas', 'Perfume para esconder cheiro que persiste']
  },
  perfumes: {
    nome: 'perfumes', un: 'ml',
    basico: ['Teste na pele e espere algumas horas', 'Escolha um cheiro versátil antes de ter vários', 'Comece por um frasco pequeno', 'Hidratante sem cheiro ajuda a durar'],
    rotulo: ['Eau de parfum costuma durar mais que eau de toilette e body splash, mas varia.', 'Confira fabricante, lote, validade e regularização na Anvisa.', 'Preço muito abaixo do normal pode ser falsificação.'],
    economize: ['Compare por ml e também por quantas borrifadas você usa.', 'Perfumaria nacional e versões inspiradas, de fabricante regularizado, podem custar bem menos.', 'Guarde longe de luz e calor.'],
    evite: ['Comprar só pelo frasco ou pela fama', 'Comprar sem testar', 'Vendedor sem nota ou sem troca']
  },
  estilo: {
    nome: 'roupas', un: 'vezes que vai usar', custo: true,
    basico: ['Veja primeiro o que já tem e anote o que falta de verdade', 'Prefira peças que combinem com pelo menos três que você tem', 'Escolha pelo caimento, não pelo número', 'Confira o tecido e como lavar'],
    rotulo: ['Olhe costuras, zíper e transparência contra a luz.', 'Compare medidas com uma roupa sua antes de comprar online.', 'Em compras online, a lei dá 7 dias para desistir após receber.'],
    economize: ['Brechós, trocas com amigos e pequenos consertos rendem muito.', 'Pense no custo por uso: preço dividido pelas vezes que vai usar.', 'Espere 48 horas antes de comprar por impulso.'],
    evite: ['Peça que só serve "quando eu mudar"', 'Parcelar roupa de uma única ocasião', 'Promoção de algo que você não precisava']
  },
  alimentacao: {
    nome: 'alimentos', un: 'g, kg, ml ou litros',
    basico: ['Arroz, feijão, ovos e verduras da estação', 'Frutas da época', 'Aveia, mandioca, batata ou milho', 'Proteínas em promoção que você vai mesmo usar'],
    rotulo: ['A lista de ingredientes vem em ordem de quantidade: o primeiro é o que mais tem.', 'A lupa na frente avisa excesso de açúcar adicionado, gordura saturada ou sódio.', 'Compare o preço por quilo ou litro.'],
    economize: ['Planeje a semana e faça lista antes de sair.', 'Feira perto do fim costuma ter preço melhor.', 'Congele porções e aproveite talos e cascas comestíveis, bem lavados.', 'Suplementos não são necessários para todo mundo: peça orientação antes.'],
    evite: ['Produto "fit" só pelo nome', 'Comprar demais e deixar estragar', 'Chá ou remédio para emagrecer']
  },
  treino: {
    nome: 'itens de treino', un: 'vezes que vai usar', custo: true,
    basico: ['Roupa confortável', 'Um tênis confortável e firme', 'Garrafa de água que você já tem', 'Tapete ou toalha para o chão'],
    rotulo: ['Teste o tênis no fim do dia, com a meia que vai usar.', 'Em elásticos e pesos, confira resistência e acabamento.', 'Equipamento usado: veja rachaduras, folgas e ferrugem.'],
    economize: ['Comece com o peso do corpo e só compre depois de criar o hábito.', 'Praças e academias ao ar livre são gratuitas.', 'Compre usado ou divida com alguém.'],
    evite: ['Aparelho que promete perder barriga', 'Pesos improvisados que podem vazar ou soltar', 'Suplemento sem orientação']
  }
};
const CURSOS = { 'trk:sol-protetor': 'sol', 'trk:cozinhar-basico': 'alimentacao' };
export const guiaDoCurso = key => CURSOS[key] || '';
export const temCompras = id => Object.prototype.hasOwnProperty.call(GUIAS, id);

export function cartaoCompras(id) {
  if (!temCompras(id)) return '';
  return `<a class="cp-card" href="#/compras/${id}"><span class="cp-ic"><i data-lucide="shopping-bag"></i></span><span class="cp-t"><b>Comprar bem, gastando pouco</b><small>Aprenda a escolher ${esc(GUIAS[id].nome)} sem cair em promessas caras.</small></span><span class="cp-go">Aprender</span></a>`;
}
export function comprasHTML(id) {
  if (!temCompras(id)) return '';
  const g = GUIAS[id], li = a => `<ul>${a.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  const bloco = (ic, t, a, c = '') => `<section class="cp-bloco ${c}"><h3><i data-lucide="${ic}"></i>${t}</h3>${li(a)}</section>`;
  const campo = (k, l) => `<label>${l}<input type="number" inputmode="decimal" min="0" step="any" data-cp="${k}"></label>`;
  return `<div class="cp"><div class="eyebrow">Comprar bem</div><h2>Como escolher ${esc(g.nome)} sem gastar muito</h2>
  <p class="muted">Primeiro veja o que você já tem. Aqui não há propaganda, marcas nem links de loja.</p>
  <div class="cp-grid">${bloco('list-checks', 'O que basta para começar', g.basico)}${bloco('search-check', 'Como escolher', g.rotulo)}${bloco('piggy-bank', 'Onde economizar', g.economize)}${bloco('shield-alert', 'Melhor evitar', g.evite, 'cp-evite')}</div>
  <section class="cp-bloco cp-calc"><h3><i data-lucide="calculator"></i>Qual compensa mais?</h3><p class="small muted">Use a mesma medida nos dois (${esc(g.un)}).</p>
  <div class="cp-dois">${['A', 'B'].map(x => `<fieldset><legend>Opção ${x}</legend>${campo('p' + x, 'Preço (R$)')}${campo('q' + x, g.custo ? 'Usos previstos' : 'Quantidade')}</fieldset>`).join('')}</div><p class="cp-res" role="status">Preencha os quatro campos para comparar.</p></section></div>`;
}
export function comparar(pA, qA, pB, qB) {
  if (![pA, qA, pB, qB].every(n => Number.isFinite(n) && n > 0)) return 'Preencha os quatro campos para comparar.';
  const a = pA / qA, b = pB / qB;
  if (Math.abs(a - b) < 1e-9) return 'As duas opções custam o mesmo. Escolha a que você vai usar melhor.';
  return `A opção ${a < b ? 'A' : 'B'} sai ${Math.round((1 - Math.min(a, b) / Math.max(a, b)) * 100) || 'menos de 1'}% mais barata pela mesma medida. Só compensa se você for usar tudo.`;
}
export function ligarCompras(el) {
  const c = el.querySelector('.cp-calc'); if (!c) return;
  const n = k => parseFloat(c.querySelector(`[data-cp="${k}"]`).value);
  c.oninput = () => { c.querySelector('.cp-res').textContent = comparar(n('pA'), n('qA'), n('pB'), n('qB')); };
}
export function paginaCompras(app, id) {
  if (!temCompras(id)) { location.hash = '#/cuidados'; return; }
  const volta = id === 'sol' ? ['#/curso/trk:sol-protetor', 'Sol e protetor'] : id === 'alimentacao' ? ['#/cuidar/alimentacao', 'Alimentação'] : id === 'treino' ? ['#/cuidar/treino', 'Treino'] : ['#/cuidados/' + id, 'Cuidados'];
  app.innerHTML = `<a class="back" href="${volta[0]}">${volta[1]}</a><div style="margin-top:22px">${comprasHTML(id)}</div>`;
  ligarCompras(app);
}
