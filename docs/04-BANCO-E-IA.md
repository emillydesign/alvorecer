# 04 · Banco (Supabase) e função de IA

Painel: supabase.com → projeto **alvorecer**. Todo o SQL do banco tem cópia em `supabase/banco.sql`, e o código da função de IA em `supabase/ia/index.ts`. **Sempre que mudar algo no Supabase, atualize a cópia no GitHub também.**

## Tabelas
| Tabela | Para quê | Quem acessa |
|---|---|---|
| `arquivos` | dados de cada pessoa (config, progresso, histórico) | só a própria pessoa (RLS) + robô |
| `feedback` | avaliações, erros e contatos | qualquer pessoa só **envia**; ninguém lê pelo site |
| `uso_ia` | quantos usos de IA cada pessoa fez no dia e no minuto | só o servidor |
| `licoes_publicas` | aulas já prontas, reaproveitadas (economia) | só o servidor |
| `novas_contas` | e-mail de cada conta criada (aviso e destino dos e-mails) | só o servidor |
| `emails_enviados` | controle de 1 e-mail do dia + 1 lembrete por pessoa por dia | só o servidor |

## Travas que já existem (não remova)
- **RLS** em todas as tabelas: cada pessoa só vê os próprios dados.
- **Feedback:** até 5 mensagens por hora por pessoa e 40 por hora no total (`limitar_feedback`).
- **Espaço:** cada arquivo até 3 MB, até 3.000 arquivos e 50 MB por conta (`limitar_arquivos`, `arquivo_tamanho`).
- **IA:** 120 usos por dia (`LIMITE_DIARIO`) e 12 por minuto (`POR_MINUTO`) por pessoa (`registrar_uso_ia`).
- **Cadastro:** limites do Supabase em Authentication → Rate Limits.
- **Excluir conta:** função `delete_my_account` (a pessoa só apaga a própria).

## Rodar SQL (com segurança)
1. Supabase → **SQL Editor** → New query.
2. Cole o SQL que o Claude preparou. Antes, pergunte a ele: "isso apaga dados? isso abre alguma tabela para todo mundo?".
3. Run. Se aparecer "Potential issue detected", leia: só confirme se o que vai ser apagado é o que você queria.
4. Cole o mesmo SQL no fim de `supabase/banco.sql` no GitHub (para ficar registrado).

Regras para qualquer tabela nova:
- `alter table ... enable row level security;` **sempre**.
- Dados de aluno: política `user_id = auth.uid()`.
- Coisas que só o robô/servidor usam: RLS ligado e **nenhuma** política (só a chave secreta acessa).
- Nunca `grant ... to anon` em tabela com dados pessoais.

## Função de IA (`ia`)
Supabase → **Edge Functions** → `ia`. O que ela faz, em ordem:
1. Confere se a pessoa está logada.
2. Recusa pedidos grandes demais (`MAX_PEDIDO`) ou mal formados.
3. Se for uma aula já pronta, devolve do cache sem gastar nada. A chave do cache inclui uma "impressão digital" do pedido inteiro, então ninguém consegue trocar a aula dos outros.
4. Conta o uso (`registrar_uso_ia`): passa de 12 por minuto ou de 120 no dia → mensagem amigável.
5. Junta as **REGRAS FIXAS** (`const REGRAS`: nada +18, crimes, invasão de sistemas, malware, ataques ao próprio IAlvorecer...) **antes** de qualquer instrução do site. Nenhum texto de usuário consegue tirar essas regras.
6. Limita o tamanho da resposta (`maxOutputTokens` 8192).
7. Tenta os modelos grátis em fila: Flash Lite → Gemma 4 → Flash. Quando um lota, passa para o próximo.

### Mudar a função (passo a passo)
1. Abra `supabase/ia/index.ts` no GitHub e peça ao Claude a mudança **no trecho**.
2. Supabase → Edge Functions → `ia` → **Code** → selecione tudo (Ctrl+A) → cole o arquivo completo atualizado.
3. **Deploy updates** → confirmar.
4. Salve o mesmo arquivo no GitHub (`supabase/ia/index.ts`).
5. Teste no site logada: abra uma aula nova ou fale com o IAlvorecer.
6. Em Edge Functions → `ia` → **Settings**, "Verify JWT with legacy secret" fica **desligado**. A própria função confere o login.

### Mudar o limite diário de IA
- Supabase → Edge Functions → **Secrets** → `LIMITE_DIARIO` (se não existir, o padrão é 120).
- E também `LIMITE_IA` em `js/config.js` (é o número que aparece no medidor do site).

### Chaves
- `GEMINI_API_KEY` (Supabase → Edge Functions → Secrets): a chave do Google AI Studio que atende todo mundo.
- Quem conecta a própria IA usa a chave dela direto do navegador para o Google, com os mesmos modelos e as mesmas instruções do site. Essa chave fica só na conta da pessoa.

## Login
- Authentication → Sign In / Providers: só **e-mail e senha** (Google desligado de propósito).
- Authentication → URL Configuration: Site URL e Redirect `https://emillydesign.github.io/alvorecer/**`. Se um dia mudar o endereço do site, mude aqui também, senão o link de confirmação quebra.
