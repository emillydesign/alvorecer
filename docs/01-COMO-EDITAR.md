# 01 · Como editar o IAlvorecer sem quebrar nada

Este é o guia principal. Os outros guias desta pasta explicam cada parte do sistema:

| Guia | Quando usar |
|---|---|
| `01-COMO-EDITAR.md` (este) | Qualquer edição: o passo a passo seguro |
| `02-MAPA-DO-SITE.md` | Onde fica cada tela, cada arquivo e cada dado |
| `03-EMAILS.md` | Mudar textos, horários ou regras dos e-mails |
| `04-BANCO-E-IA.md` | Supabase (login, banco, limites) e a função de IA |
| `05-SEGURANCA.md` | Regras que nunca podem ser quebradas + checklist antes de publicar |
| `06-PROBLEMAS.md` | Algo deu errado: como descobrir e como voltar atrás |

## Os 3 lugares onde o IAlvorecer mora
1. **GitHub `emillydesign/alvorecer`** (público): o site. Tudo que muda aqui vai para o ar em ~1 minuto (GitHub Pages).
2. **GitHub `emillydesign/alvorecer-dados`** (privado): o robô que manda os e-mails (GitHub Actions, de hora em hora).
3. **Supabase, projeto `alvorecer`**: login, banco de dados, limites e a função `ia` (que conversa com o Google Gemini).

## Por que os arquivos são "pesados"
O site é HTML + CSS + JavaScript puro, sem framework e sem build. É simples de hospedar e de graça, mas as telas ficam todas em poucos arquivos grandes:

| Arquivo | Tamanho | O que tem |
|---|---|---|
| `js/app.js` | ~170 KB (~1.600 linhas) | todas as telas |
| `css/app.css` | ~45 KB | todo o visual |
| `data/catalog.json` | ~42 KB | cursos, idiomas, áreas |
| `js/saude.js` | ~37 KB | Cuidar de mim |
| `js/ai.js` | ~30 KB | instruções da IA |

Um Claude gratuito **não consegue ler nem devolver o `app.js` inteiro**. Por isso a regra de ouro é: **trabalhar por trechos**. Você cola o trecho, ele devolve só o trecho alterado.

## Passo a passo de qualquer edição
1. **Descubra o trecho.** Use o `02-MAPA-DO-SITE.md` ou procure (Ctrl+F) um texto que aparece na tela.
2. **Abra o editor:** no repositório, aperte `.` (ponto). Abre o github.dev no navegador.
3. **Copie o trecho** (a função inteira, de `function nome(` até o `}` que fecha) e cole no Claude com o pedido.
4. **Cole de volta** o trecho que o Claude devolveu, no lugar exato.
5. **Aumente a versão** se mexeu em JS ou CSS: troque TODOS os `?v=NÚMERO` por um número maior, em `index.html` **e** `js/app.js` (Ctrl+H no github.dev, "substituir tudo"). Sem isso, as pessoas continuam vendo a versão antiga.
6. **Commit & Push** (ícone de ramificação à esquerda). Escreva o que mudou.
7. **Teste** depois de ~1 minuto, em janela anônima: modo visitante **e** logada na sua conta. Abra a tela que mudou e a página inicial.
8. Quebrou? Veja `06-PROBLEMAS.md` → "Voltar uma versão". Leva 1 minuto.

## Tamanho das mudanças
- **Pequena** (texto, cor, um botão): um trecho, um commit.
- **Média** (uma tela nova, uma opção nova em Ajustes): peça primeiro um **plano** ("quais trechos de quais arquivos"), depois um trecho por vez, testando a cada commit.
- **Grande** (mexer nos e-mails, no banco, na função de IA, no login): siga o guia específico (03 ou 04) e o checklist do `05-SEGURANCA.md`. Uma parte por vez. Nunca várias de uma vez só.

## Testar sem estragar o site de todo mundo
- **Modo visitante** (`?visita=1`) mostra as telas sem salvar nada.
- **Demonstração** (`?demo=1`) usa dados de exemplo e uma IA de mentirinha (não gasta nada).
- Para mudanças grandes, faça em horário de pouco uso e teste logo em seguida.

## Onde ficam as chaves (nunca no código)
- Gemini: Supabase → Edge Functions → Secrets → `GEMINI_API_KEY`
- E-mails: GitHub → `alvorecer-dados` → Settings → Secrets → `GMAIL_APP_PASSWORD` e `SUPABASE_SERVICE_KEY`
- Gmail das confirmações de cadastro: Supabase → Authentication → Emails → SMTP Settings
- A chave `sb_publishable_...` em `js/config.js` é pública de propósito: quem protege os dados são as regras do banco (RLS).
