// Aba "Seu valor": texto fixo (igual para todos), escrito para valorizar o estudo e o trabalho de quem usa IA.
// Arquivo à parte: só é carregado quando a pessoa abre essa aba.
const T = {
  design: ['No design, a IA cria rápido; o seu olhar escolhe o que fica bom.', ['Conhecer hierarquia, cor e tipografia ajuda você a pedir à IA exatamente o que imagina.', 'Saber usar Figma, Canva ou Photoshop permite ajustar à mão o que a IA não acertou.', 'Quem estuda design percebe o que está errado e sabe como corrigir.']],
  tech: ['A IA acelera a tecnologia; entender como as coisas funcionam é o que dá segurança.', ['Entender o conceito ajuda a pedir melhor e a conferir se a resposta faz sentido.', 'Quando algo dá errado, quem conhece a base sabe onde procurar o problema.', 'Seu estudo transforma uma ferramenta comum em resultado de qualidade.']],
  saude: ['A IA pode explicar e organizar; o cuidado com o seu corpo começa em entender como ele funciona.', ['Conhecer os conceitos ajuda a fazer boas perguntas e a entender as respostas.', 'Cada corpo é diferente: o que você aprende ajuda a perceber os seus sinais.', 'Em dúvidas de saúde, converse também com um profissional.']],
  negocios: ['A IA ajuda a produzir mais rápido; quem entende o negócio decide melhor.', ['Conhecer os conceitos mostra o que pedir e o que vale a pena aproveitar.', 'Seu conhecimento do cliente e do mercado é algo que a IA não tem.', 'Estudar dá segurança para ajustar, recusar e melhorar o que ela sugere.']],
  engenharia: ['A IA explica e calcula; você precisa entender para trabalhar com segurança.', ['Entender os princípios ajuda a conferir cada resposta antes de colocar em prática.', 'Em eletricidade e montagens, saber o porquê evita erros e acidentes.', 'Quem estuda aproveita melhor a IA e erra menos.']],
  financas: ['A IA ajuda a organizar números; as decisões com o seu dinheiro continuam sendo suas.', ['Conhecer os conceitos permite entender o que está sendo sugerido.', 'Estudar ajuda a perceber riscos e a não decidir no impulso.', 'Para decisões grandes, vale conversar também com um profissional.']],
  bemestar: ['A IA pode dar ideias e apoio; conhecer a si mesma é um trabalho seu.', ['Entender os conceitos ajuda a escolher o que combina com a sua rotina.', 'O estudo dá repertório para perguntar melhor e refletir com calma.', 'Em momentos difíceis, converse também com pessoas de confiança e profissionais.']],
  seu: ['Aprender é seu, e usar IA para facilitar o caminho não diminui o seu esforço.', ['Entender os conceitos ajuda a pedir melhor e a conferir o resultado.', 'Seu estudo é o que transforma uma resposta pronta em um trabalho de qualidade.', 'A IA agiliza; a decisão do que fica bom é sua.']],
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function valorHTML(track) {
  const [titulo, pontos] = T[track] || T.seu;
  return `<div class="panel"><div class="eyebrow">Seu valor</div><h2 style="margin:8px 0 10px">${esc(titulo)}</h2>
    <ul style="padding-left:18px">${pontos.map(p => `<li style="margin:8px 0">${esc(p)}</li>`).join('')}</ul>
    <p style="margin-top:16px"><b>Usar IA não tira o valor do seu trabalho.</b> Ela é um meio de agilizar e facilitar. Não é qualquer pessoa que consegue um resultado de qualidade só digitando pedidos: o que você estuda e entende é o que faz a diferença. Valorize o seu trabalho.</p></div>`;
}
