// Aba "Economia de uso" das aulas de cursos que usam IA.
// Arquivo à parte: só carrega quando a pessoa abre a aba. Conteúdo fixo (sem chamar a IA, não gasta nada).
import { esc } from './util.js';

// Etiquetas: gratis = plano grátis completo; limite = grátis com limites; pago = precisa de assinatura ou uso por crédito
const ROT = { gratis: 'Grátis', limite: 'Grátis com limites', pago: 'Pago' };
const FERRAMENTAS = [
  { n: 'Claude', t: 'limite', d: 'Conversa, escreve e edita código e textos. Projetos guardam o contexto.' },
  { n: 'ChatGPT', t: 'limite', d: 'Conversa e cria textos, imagens e código. Também tem projetos.' },
  { n: 'Gemini', t: 'limite', d: 'IA do Google, integrada ao Gmail, Docs e ao Google AI Studio.' },
  { n: 'Codex (OpenAI)', t: 'pago', d: 'Agente de código: edita arquivos e roda tarefas sozinho. Tem uso grátis bem limitado; para valer, plano pago.' },
  { n: 'GitHub Copilot', t: 'limite', d: 'Sugere código dentro do editor (VS Code). O plano grátis tem cota mensal.' },
  { n: 'Gemini CLI', t: 'limite', d: 'Agente de código pelo terminal, grátis com limite diário.' },
  { n: 'Claude Code', t: 'pago', d: 'Agente de código do Claude, usado no terminal ou no editor. Exige plano pago.' },
  { n: 'Cursor', t: 'limite', d: 'Editor de código com IA embutida. O plano grátis é limitado.' }
];

const DICAS = [
  { h: 'Crie um projeto e guarde o contexto nele', p: 'Em IAs com projetos (como Claude e ChatGPT), crie um projeto e, no primeiro chat dele, explique o essencial: o que você está fazendo, o que quer no fim, o estilo e as regras importantes. Depois, abra um chat novo dentro do projeto para cada pedido. A IA lembra do contexto geral e não precisa reler uma conversa enorme, o que gasta bem menos.' },
  { h: 'Um assunto por chat', p: 'Conversas longas ficam pesadas: a cada mensagem a IA relê tudo o que já foi dito. Terminou um pedido? Comece outro chat. Se precisar levar algo, peça um resumo curto e cole no chat novo.' },
  { h: 'Escolha o modelo e o esforço certos', p: 'Modelos maiores e o modo "pensar mais" gastam mais do seu limite. Para tarefas simples (corrigir texto, trocar uma cor, tirar uma dúvida), use o modelo leve ou rápido. Deixe o modelo mais forte e o esforço alto só para o que é difícil, como planejar um projeto ou achar um erro complicado.' },
  { h: 'Em ferramentas com agente, use o plano antes', p: 'Agentes de código (como Codex ou Claude Code) trabalham sozinhos e consomem muito. Peça primeiro um plano curto, confira, e só então mande executar. Isso evita refazer trabalho.' },
  { h: 'Faça pedidos completos e pequenos', p: 'Um pedido claro (o que mudar, onde e como deve ficar) vale mais que cinco tentativas vagas. Dividir um projeto grande em passos pequenos também evita respostas longas jogadas fora.' },
  { h: 'Envie só o necessário', p: 'Em vez de colar o arquivo inteiro, cole só o trecho que vai mudar e diga o que ele faz. Anexos e imagens grandes pesam: use apenas quando ajudarem de verdade.' },
  { h: 'Corrija com precisão', p: 'Em vez de "ficou ruim, refaz", diga exatamente o que ajustar ("deixe o título maior e o botão azul"). Se a IA errou, vale editar sua mensagem original em vez de empilhar correções.' },
  { h: 'Desligue o que não precisa', p: 'Pesquisa na web, modo de raciocínio longo e ferramentas extras gastam mais. Ligue só quando o pedido exigir.' },
  { h: 'Tenha um plano B', p: 'Acabou o limite? Costuma voltar em algumas horas. Enquanto isso, use outra IA grátis ou avance no que não depende dela. Você não precisa pagar para aprender.' }
];

const selo = t => `<span class="chip" style="padding:3px 10px;font-size:12px;margin-left:8px">${esc(ROT[t])}</span>`;

export function economiaHTML() {
  const ferr = FERRAMENTAS.map(f => `<li style="margin:10px 0"><b>${esc(f.n)}</b>${selo(f.t)}<br><span class="muted">${esc(f.d)}</span></li>`).join('');
  const dicas = DICAS.map(x => `<div class="panel section"><h3>${esc(x.h)}</h3><p style="margin-top:10px">${esc(x.p)}</p></div>`).join('');
  return `<div class="eyebrow">Economia de uso</div>
  <h2 style="margin:8px 0 6px">Fazer mais gastando menos</h2>
  <p class="muted">Toda IA tem um limite de uso (tokens ou mensagens). Estas dicas valem para qualquer uma, e você escolhe a que preferir.</p>
  ${dicas}
  <div class="panel section"><h3>Ferramentas que você pode usar</h3>
  <p class="muted" style="margin-top:8px">Planos e limites mudam com o tempo: confira no site de cada uma.</p>
  <ul style="margin:12px 0;padding-left:0;list-style:none">${ferr}</ul></div>`;
}
