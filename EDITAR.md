# Como editar o IAlvorecer (com o Claude grátis)

O site é HTML + CSS + JavaScript puro: não precisa instalar nada nem "compilar". Você edita os arquivos aqui no GitHub e, em ~1 minuto, o site atualiza sozinho.

## Como editar (passo a passo)
1. Abra o repositório **github.com/emillydesign/alvorecer**.
2. Aperte a tecla **.** (ponto) → abre o **github.dev**, um editor no navegador.
3. Abra o arquivo, use **Ctrl+F** para achar o trecho, cole a mudança.
4. No ícone de "ramificação" (Source Control) à esquerda → escreva o que mudou → **Commit & Push**.

## Como pedir ao Claude grátis (o jeito que funciona)
Os arquivos grandes (principalmente `js/app.js`) não cabem inteiros numa resposta. Então **cole só o trecho** que você quer mudar e use um pedido assim:

```
Este é um trecho do js/app.js do meu site (HTML/CSS/JS puro, sem framework).
[cole o trecho]
Quero: [o que você quer mudar].
Me devolva SÓ o trecho alterado, completo, para eu substituir com Ctrl+F.
Não mude nomes de funções nem a estrutura.
```

Dica: para achar o trecho certo, use Ctrl+F no github.dev procurando um texto que aparece na tela (ex.: "Por qual idioma").

## Onde fica cada coisa
| O que você quer mudar | Arquivo | Procure por |
|---|---|---|
| Cursos, aulas, áreas de interesse, idiomas | `data/catalog.json` | o nome do curso |
| Cores, fontes, espaçamentos, animações | `css/app.css` | o fim do arquivo tem o tema "aurora tech" |
| Textos da página inicial | `js/app.js` | `async function home()` |
| Cadastro inicial (perguntas) | `js/app.js` | `async function boasVindas()` |
| Tela de entrada (visitar/entrar) | `js/app.js` | `function login(` |
| Menu do topo / rodapé | `index.html` | `mainnav` / `site-foot` |
| Jeito de ser da IA, aulas, testes, assistente | `js/ai.js` | `ALMA`, `lesson(`, `assistant(` |
| Cuidar de mim (desabafo, alimentação, treino) | `js/saude.js` | `ETICA`, `desabafo`, `alimentacao`, `treino` |
| Pix, limite de IA, e-mail de contato | `js/config.js` | — |
| E-mails diários | repositório **alvorecer-dados** → `scripts/email_diario.py` | — |
| Limite diário de IA no servidor | Supabase → Edge Functions → **ia** → Code | `LIMITE_DIARIO` (mude também `LIMITE_IA` em `js/config.js`) |

## Adicionar um curso (o mais fácil)
Em `data/catalog.json`, dentro de `"tracks"` → a área (ex.: `"design"`) → `"courses"`, copie um curso existente e mude:
```json
{"id": "meu-curso", "title": "Nome do curso", "sub": "Subtítulo curto", "art": "Aa", "icon": "book-open", "pat": "dots",
 "g": ["#5eead4", "#2563eb"], "lessons": ["Aula 1", "Aula 2", "Aula 3"]}
```
- `id`: sem espaços e sem acento, único.
- `icon`: nome de um ícone de lucide.dev/icons (ex.: `camera`, `music`, `code-xml`).
- `g`: as duas cores do degradê do card.
- As aulas são criadas pela IA na primeira vez que alguém abre.

**Atenção ao JSON:** vírgula entre os cursos, aspas duplas. Se der erro, peça ao Claude: "confira se este JSON está válido".

## Coisas maiores (nova aba, nova tela)
Dá para fazer com o Claude grátis, mas em partes. Peça primeiro um plano ("quero uma aba X; me diga quais trechos de quais arquivos mudar"), depois peça trecho por trecho. Sempre teste no site depois de cada mudança. Se algo quebrar, no GitHub dá para voltar uma versão (History → o commit anterior → "Revert").

## Onde ficam as chaves (nunca no código)
- Chave do Gemini: Supabase → Edge Functions → Secrets → `GEMINI_API_KEY`
- E-mails: GitHub → alvorecer-dados → Settings → Secrets → `GMAIL_APP_PASSWORD` e `SUPABASE_SERVICE_KEY`
- A chave `sb_publishable_...` em `js/config.js` é pública de propósito (a segurança está nas regras do banco).
