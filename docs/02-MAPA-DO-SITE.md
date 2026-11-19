# 02 · Mapa do site

## Arquivos do repositório `alvorecer`
| Arquivo | Para que serve |
|---|---|
| `index.html` | casca da página: menu do topo (`mainnav`), rodapé (`site-foot`), política de segurança (`Content-Security-Policy`), versões `?v=` |
| `css/app.css` | visual. O tema atual ("aurora tech") está no **fim** do arquivo e vale por cima do resto |
| `js/app.js` | todas as telas (ver seções abaixo) |
| `js/ai.js` | o que a IA recebe de instrução: `ALMA` (personalidade), aulas, testes, conversa, assistente |
| `js/saude.js` | Cuidar de mim: `ETICA`, desabafo, alimentação, água, foto do prato, treino |
| `js/store.js` | salvar e ler os dados da pessoa no Supabase; chama a função `ia` |
| `js/config.js` | endereço do Supabase, Pix, `LIMITE_IA`, `CONTATO` (iaalvorecer@gmail.com) |
| `js/fx.js` | ícones (Lucide) e animações |
| `js/speech.js` | voz (falar e ouvir) do navegador |
| `js/util.js` | ajudantes: datas, feriados, `esc()` (proteção de texto), `md()` (formatação segura) |
| `js/demo.js` | dados e IA de mentirinha do modo demonstração |
| `data/catalog.json` | idiomas, níveis, áreas, trilhas e cursos |
| `guia.html` + `guia/*.jpg` | guia de uso que aparece no site (Ajustes → Guia de uso) |
| `supabase/banco.sql` | cópia de TODO o SQL do banco (tabelas, regras, travas) |
| `supabase/ia/index.ts` | cópia do código da função `ia` do Supabase |
| `supabase/emails/*.html` | modelos dos e-mails de confirmação e de nova senha |
| `docs/` | estes guias |
| `PROMPT-CLAUDE.md` | o prompt para colar no Claude antes de editar |

## Seções do `js/app.js` (procure com Ctrl+F pelo título)
| Procure | O que é |
|---|---|
| `// ---------- helpers` | funções pequenas usadas em tudo |
| `// ---------- roteamento` | lista de páginas (`const routes`) e o que acontece ao trocar de página |
| `// ---------- INÍCIO` | página inicial |
| `// ---------- IDIOMAS` | lista de idiomas |
| `// ---------- TRILHAS` | Tecnologia & IA e áreas de interesse |
| `// ---------- CURSO` | página de um curso (botões Conversar, Marcar conversação, Tornar principal) |
| `// ---------- AULA` | a aula com exercícios |
| `// ---------- CONVERSAÇÃO` | conversa por voz |
| `// ---------- MEMORIZAÇÃO` / `TESTES` | cartões e provas |
| `// ---------- HISTÓRICO` | histórico |
| `// ---------- AJUSTES` | Ajustes (conta, IA, e-mails, conversação, ajuda) |
| `// ---------- CRONOGRAMA` | cronograma dos idiomas |
| `// ---------- ASSISTENTE` | "Falar com o IAlvorecer" (muda coisas com Aplicar/Desfazer) |
| `// ---------- SEU ALVORECER` | cursos personalizados pedidos à IA |
| `// ---------- MENTORIA DE CARREIRA` | mentoria |
| `// ---------- USO DE IA` | medidor de uso e "conectar a própria IA" |
| `// ---------- AVALIAÇÕES, ERROS E CONTATO` | janelas de avaliar / reportar erro / falar com a Emilly |
| `// ---------- MARCAR CONVERSAÇÃO` | janela de marcar conversação (`openAgendaConversa`, `convCfg`, `convResumo`) |
| `// ---------- SOBRE E APOIAR` | Sobre e Pix |
| `// ---------- NIVELAMENTO E PREFERÊNCIAS` | boas-vindas e nivelamento |
| `// ---------- LOGIN` | tela de entrada, visitar, criar conta |
| `// ---------- INÍCIO DO APP` | liga tudo quando a página abre (inclui o "clique global" de `data-fb`, `data-agenda`, `data-copy`…) |

## Endereços das páginas (rotas)
`#/` início · `#/idiomas` · `#/cronograma` · `#/trilha/tech` · `#/trilha/design` (e outras áreas) · `#/curso/lang:en` · `#/aula/<curso>/<aula>` · `#/conversa/<curso>` · `#/memorizacao` · `#/revisao` · `#/teste/...` · `#/historico` · `#/seu` · `#/cuidar` · `#/mentoria` · `#/ajustes` · `#/sobre` · `#/apoiar` · `#/guia` · `#/boas-vindas`

## Os dados de cada pessoa
Ficam na tabela `arquivos` do Supabase, um "arquivo" JSON por linha, e só a própria pessoa enxerga os dela.

| Arquivo | O que guarda |
|---|---|
| `config.json` | preferências: `emailsOn`, `emailHoraAula`, `pauseUntil`, `conversa`, `geminiKey` (IA própria), `model` |
| `state.json` | perfil, plano de idiomas, cursos e progresso, sequência, cursos personalizados |
| `srs.json` | cartões de memorização |
| `history/AAAA-MM.json` | histórico do mês |
| `conversas/...` | conversas salvas (ex.: rascunho da mentoria) |

O campo `conversa` em `config.json`:
```json
{ "modo": "livre | diario | agendada | nenhuma", "hora": 19, "agenda": [{ "d": "2026-11-25", "h": 20 }], "lembrete": false }
```
- Só **uma** conversação por dia na `agenda` (o site impede duas no mesmo dia).
- `lembrete: true` só vale para `diario` e `agendada`.

## Catálogo (`data/catalog.json`)
- `languages`: idiomas (id, nome, bandeira, nível inicial)
- `levels`: A1 → C2
- `tracks`: trilhas (Tecnologia & IA e as áreas). Cada uma tem `courses`.
- Adicionar um curso: copie um curso da mesma trilha e mude `id` (único, sem acento/espaço), `title`, `sub`, `icon` (lucide.dev/icons), `g` (duas cores), `lessons`.
- JSON exige aspas duplas e vírgula entre itens. Depois de editar, peça ao Claude: "confira se este JSON está válido".
