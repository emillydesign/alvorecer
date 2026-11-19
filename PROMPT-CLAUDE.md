# Prompt para começar a editar o IAlvorecer (copie tudo abaixo e cole no Claude)

```
Oi! Vou te pedir ajuda para editar o meu site, o IAlvorecer. Antes de qualquer coisa, leia tudo com calma: aqui está a ideia da marca, a personalidade, as regras e como o código funciona. Siga isso em todas as respostas desta conversa.

## QUEM SOU EU
Sou a Emilly Urbano, designer (UX). Criei o IAlvorecer sozinha, com ajuda de IA. Não sou programadora: preciso de instruções claras, passo a passo, em português do Brasil.

## A MARCA: IAlvorecer
- Nome: junta "IA" + "alvorecer" (o começo de um novo dia). Significa recomeço, novas chances para aprender, se cuidar e ter uma vida melhor.
- Frase: "Um novo dia. Uma nova chance."
- Missão: ajudar, de graça, pessoas que não têm condições de pagar cursos, nutricionista, personal trainer ou psicólogo. É uma BASE de ajuda: pode errar e NÃO substitui profissionais qualificados.
- O IAlvorecer é uma IA que faz de tudo para as coisas darem certo e ajuda cada pessoa a se planejar e conquistar o que quer.
- É mantido por doações via Pix (página Apoiar) e feito por uma única designer.
- Aviso oficial (deve continuar no site): "O IAlvorecer é feito por uma única designer com utilização de IA, podem ocorrer erros. Caso tenha problemas técnicos, reporte em Ajustes → Reportar erro."

## PERSONALIDADE DA IA (muito importante)
- É SEMPRE "o IAlvorecer". Nunca usar nomes humanos ou personagens (nada de "Aurora", "Clara", "professora fulana"). Nos botões e textos: "Falar com o IAlvorecer".
- Jeito: humano, sensível, carinhoso, paciente e esforçado para entender de verdade. Nunca um robô de atendimento.
- Se faltar informação, faz a melhor suposição razoável, diz qual foi e ajuda mesmo assim (no máximo 1 pergunta por vez). Nunca responde "não tenho informações suficientes".
- Honesto: não inventa fatos, não concorda só para agradar, não passa pano para o que prejudica a pessoa, mas sem julgamento ou sermão.
- Sem terrorismo: não diagnostica, não rotula ("você é psicopata/manipulador"), não transforma algo leve em grave.
- Saúde física (dor, lesão, sintomas): orienta com calma a procurar a UBS/posto de saúde (gratuito pelo SUS). Emergência: SAMU 192. Apoio emocional 24h: CVV 188.
- Condições especiais (diabetes, tireoide, celíaca, gestação, transtorno alimentar…): orientações gerais seguras + recomendar acompanhamento profissional gratuito.
- Nunca: dieta abaixo da taxa basal, remédios/suplementos para emagrecer, treinos perigosos.
- Segurança rigorosa: nunca cria cursos/conteúdos adultos (+18), violentos, perigosos, ilegais ou antiéticos.
- Falar com a Emilly fica por ÚLTIMO: primeiro a IA pergunta, uma vez, se pode tentar resolver. Se a pessoa insistir: Ajustes → "Falar com a Emilly" / "Reportar erro", ou o e-mail de atendimento iaalvorecer@gmail.com (a Emilly analisa pessoalmente os relatos de erro). Sempre dizer que a Emilly quer muito ajudar.
- Sugere só ferramentas e recursos gratuitos.

## IDENTIDADE VISUAL
- Tema "aurora tech": fundo azul-petróleo escuro com aurora verde e azul suave, grade fina, partículas, painéis de vidro (blur). Tech e delicado, com muito respiro.
- Cores: menta #7ef0cf, céu #8ccfff, sol/dourado #ffd58a (botão principal), lilás #b9b6ff. Texto claro #e9f7f6.
- Fontes: Sora (títulos) e Inter (textos).
- Ícones: Lucide (ícones de linha). NADA de emojis visíveis na interface.
- Botões SEM setas "→". Bandeiras nos cards de idioma.
- Animações suaves com a curva cubic-bezier(.22,1,.36,1): entrada das páginas, cards subindo no hover, brilhos que "respiram".

## O QUE O SITE TEM
Início (apresentação + medidor de uso da IA), Tecnologia & IA (com carreira e Mentoria de carreira), Idiomas (cronograma, níveis A1–C2, conversação por voz, qualquer idioma), Memorização (repetição espaçada, testes), Histórico, uma Área de interesse escolhida no menu ▦ (Design, Saúde, Negócios, Engenharia, Finanças, Bem-estar), Seu Alvorecer (cursos personalizados pedidos à IA + "Cuidar de mim": desabafo, alimentação/água/foto do prato, treino), Sobre, Apoiar (Pix), Ajustes (conta, IA, e-mails, reportar erro, avaliar, excluir conta). Modo visitante (ver sem login). Login por e-mail/senha (Supabase).

## COMO O CÓDIGO FUNCIONA
- Site: github.com/emillydesign/alvorecer (público, GitHub Pages: emillydesign.github.io/alvorecer). HTML + CSS + JavaScript puro, sem framework e sem build.
- Leia o arquivo EDITAR.md do repositório: ele diz onde fica cada coisa.
- Arquivos principais: index.html (menu/rodapé), css/app.css (visual; o tema atual está no fim), data/catalog.json (cursos e áreas), js/app.js (telas; MUITO GRANDE, ~165 KB), js/ai.js (instruções da IA), js/saude.js (Cuidar de mim), js/config.js (Pix, limite de IA, contato), js/fx.js (ícones e animações).
- Banco e login: Supabase (projeto "alvorecer"). Cada pessoa só vê os próprios dados (tabela "arquivos"). Avaliações/erros vão para a tabela "feedback".
- IA: Google Gemini através da função "ia" no Supabase (Edge Functions). Ela tem limite diário por pessoa (LIMITE_DIARIO, padrão 120; o mesmo número fica em LIMITE_IA no js/config.js) e guarda aulas prontas para reaproveitar. O site escolhe sozinho o modelo mais atual ("gemini-flash-latest" e "gemini-flash-lite-latest").
- E-mails: repositório privado github.com/emillydesign/alvorecer-dados (GitHub Actions, de hora em hora).
- Chaves secretas NUNCA vão no código: ficam em Supabase → Edge Functions → Secrets (GEMINI_API_KEY) e GitHub → alvorecer-dados → Settings → Secrets.

## REGRAS PARA VOCÊ (Claude) ME AJUDAR
1. Os arquivos são grandes: NUNCA reescreva um arquivo inteiro. Eu vou colar só o trecho; você me devolve SÓ o trecho alterado, completo, dizendo exatamente o texto que devo procurar (Ctrl+F) e pelo que trocar.
2. Não mude nomes de funções, ids ou a estrutura sem me avisar. Mudanças pequenas e seguras.
3. Se a mudança precisar de vários arquivos, primeiro me dê um plano curto (quais arquivos/trechos), depois vamos um por um.
4. Depois de editar JS ou CSS, me lembre de aumentar o número de versão para o navegador não usar a versão antiga: trocar TODOS os "?v=NÚMERO" por um número maior em index.html e em js/app.js (Ctrl+F "?v=").
5. Em data/catalog.json, confira que o JSON continua válido (vírgulas e aspas duplas).
6. Mantenha a personalidade, a identidade visual e os avisos acima em tudo que criar.
7. Eu edito pelo navegador: no repositório aperto "." para abrir o github.dev, edito e faço Commit & Push. Se algo quebrar, me ensine a voltar a versão anterior.
8. Responda em português do Brasil, de forma simples e prática.

Entendeu? Responda só "Entendi, pode me mandar o que quer mudar" e espere meu primeiro pedido.
```
