# 03 · E-mails

Existem dois tipos de e-mail, enviados por caminhos diferentes, os dois pelo Gmail **iaalvorecer@gmail.com**.

## A) E-mails de conta (Supabase)
Confirmação de cadastro e "esqueci minha senha".
- Textos: Supabase → Authentication → Emails → **Templates** (Confirm sign up, Reset password). Cópia em `supabase/emails/`.
- Envio: Supabase → Authentication → Emails → **SMTP Settings** (smtp.gmail.com, porta 465, usuário iaalvorecer@gmail.com, senha de app).
- Trava: Supabase → Authentication → **Rate Limits** → "Rate limit for sending emails" = **12 por hora**. Só aumente se o site crescer muito (veja "Limites" abaixo).
- No modelo, o link precisa continuar sendo `{{ .ConfirmationURL }}`. Sem ele a pessoa não consegue confirmar.

## B) E-mails do robô (GitHub `alvorecer-dados`)
Arquivo: `scripts/email_diario.py`. Roda de hora em hora (das 6h às 23h de Brasília) pelo arquivo `.github/workflows/emails.yml`.

### O que ele manda
| E-mail | Para quem | Quando |
|---|---|---|
| **E-mail do dia** (aula, expressão do dia, revisões, conversação) | alunos com "Enviar e-mails" ligado | nos dias de estudo escolhidos (padrão: seg a sex, fora feriados), no horário escolhido. **No máximo 1 por dia** |
| **Lembrete de conversação** | só quem marcou conversação (todo dia útil ou dia específico) **e** pediu o lembrete | no dia e hora marcados, no idioma escolhido para a conversação. **No máximo 1 por dia**, mesmo se a pessoa remarcar. Não vai se ela já conversou naquele dia |
| `⚠️ [SITE · ERRO]`, `⭐ [SITE · AVALIAÇÃO]`, `💬 [SITE · CONTATO]` | só para iaalvorecer@gmail.com | um por mensagem, até 15 por hora |
| `🌱 [SITE · NOVA CONTA]` | só para iaalvorecer@gmail.com | um resumo por hora |

Ninguém recebe nada se desligou "Enviar e-mails" ou se está em pausa (férias). Quem escolheu não aprender idiomas não recebe o e-mail do dia.

### Dias de envio escolhidos pela pessoa (fins de semana e feriados)
O site já salva, na configuração de cada aluno (`config`, lida pelo robô):
- `diasEstudo = { dias: [1,2,3,4,5], feriados: false }`: dias em que a pessoa quer estudar (0 = domingo … 6 = sábado). Padrão: segunda a sexta, sem feriados.
- `conversa.dias` e `conversa.feriados`: o mesmo, só para a conversação no modo diário.

Regra que o robô deve seguir: o **e-mail do dia** vai se o dia da semana de hoje (horário de Brasília) estiver em `diasEstudo.dias` e, se hoje for feriado, só se `diasEstudo.feriados` for verdadeiro. O **lembrete de conversação** (modo diário) usa `conversa.dias` / `conversa.feriados` do mesmo jeito. Se o campo não existir (conta antiga), vale o padrão: segunda a sexta, fora feriados. Todas as proteções abaixo continuam valendo: no máximo 1 por dia, só com "Enviar e-mails" ligado, nada em pausa (férias), `LIMITE_DIA`.

**Situação:** o site já grava esses campos, mas `scripts/email_diario.py` (repositório `alvorecer-dados`) ainda precisa passar a ler. Até lá, o robô segue enviando só de segunda a sexta, fora feriados.

### Proteções (não remova)
- **Sempre para o e-mail da própria conta.** O endereço vem da tabela `novas_contas` (o e-mail do login), não de algo que a pessoa digita. Assim ninguém consegue usar o site para mandar e-mail a outra pessoa.
- **Tabela `emails_enviados`** guarda quem já recebeu o quê no dia (`manha` = e-mail do dia, `noite` = lembrete). Por isso mudar o horário várias vezes não faz chegar e-mail repetido.
- **`LIMITE_DIA = 200`**: teto de e-mails para alunos por dia, somando todo mundo. O Gmail grátis aceita uns 500 por dia no total, e as confirmações de cadastro usam o mesmo Gmail.
- Se o robô não consegue checar a tabela, ele **não envia** (prefere faltar um e-mail a mandar repetido).

### Mudar o texto dos e-mails
Em `scripts/email_diario.py`, procure `def montar(`:
- `subject = ...` é o assunto.
- `title = ...` é o título grande.
- `body = ...` é o miolo (`modo == "noite"` é o lembrete; o resto é o e-mail do dia).
- `cta = ...` é o texto do botão (sem setas, padrão da marca).
- O visual fica em `page = f"""...`.

Python é sensível a **espaços no começo da linha**. Peça ao Claude para manter a indentação exatamente igual.

### Testar sem incomodar ninguém
GitHub → `alvorecer-dados` → **Actions** → "E-mails do IAlvorecer" → **Run workflow**:
- `tipo`: `manha` (e-mail do dia) ou `noite` (lembrete).
- `email`: o SEU e-mail. Só a conta com esse e-mail recebe o teste.

Depois abra a execução e veja o registro. "Enviado: manha emi***" = deu certo. Uma mensagem em vermelho = erro: copie e mande para o Claude.

### Limites e quando o site crescer
| Item | Onde | Valor |
|---|---|---|
| Teto diário do robô | `email_diario.py` → `LIMITE_DIA` | 200 |
| Avisos de feedback por hora | `email_diario.py` → `LIMITE_FEEDBACK` | 15 |
| Confirmações de cadastro por hora | Supabase → Auth → Rate Limits | 12 |

Se passar de ~150 alunos recebendo e-mail todo dia, o Gmail grátis fica pequeno. Aí o caminho é trocar o SMTP por um serviço de e-mail transacional com plano grátis (ex.: Brevo, 300/dia). Muda só o host, a porta, o usuário e a senha (no Supabase e nos secrets do robô), e o código continua o mesmo.

### Secrets do robô
GitHub → `alvorecer-dados` → Settings → Secrets and variables → Actions:
- `GMAIL_APP_PASSWORD`: senha de app do iaalvorecer@gmail.com (myaccount.google.com/apppasswords).
- `SUPABASE_SERVICE_KEY`: Supabase → Project Settings → API Keys → Secret keys (`sb_secret_...`). **Essa chave abre o banco inteiro: nunca cole no site, no chat ou em repositório público.**
