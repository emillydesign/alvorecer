# 06 · Quando algo dá errado

## Voltar uma versão (o mais importante)
1. No GitHub, abra o repositório (`alvorecer` ou `alvorecer-dados`) → clique em **Commits** (o relógio perto do botão verde "Code").
2. Ache o último commit que estava funcionando e clique nele.
3. No commit que quebrou, use **Revert** (ou, no github.dev, desfaça a mudança e faça Commit & Push).
4. Se não achar o botão: abra o arquivo no commit bom → **Raw** → copie tudo → cole no arquivo atual no github.dev → Commit & Push.
5. Mexeu em JS/CSS? Aumente o `?v=` de novo.

Funções do Supabase e SQL **não** voltam pelo GitHub: para a função `ia`, cole de novo a versão boa de `supabase/ia/index.ts` e faça Deploy.

## Site em branco ou "Algo deu errado"
- Quase sempre é erro de digitação em `js/app.js` (vírgula, crase, chave `}` faltando).
- No computador, aperte **F12 → Console**. A mensagem vermelha diz o arquivo e a linha. Copie para o Claude junto com o trecho.
- Mudou e nada aconteceu? Faltou aumentar o `?v=`, ou espere 1–2 minutos (GitHub Pages).

## Ícones ou fontes sumiram
- Provavelmente uma biblioteca nova foi bloqueada pela `Content-Security-Policy`. No F12 aparece "Refused to load…". Adicione só aquele endereço na política do `index.html` (veja `05-SEGURANCA.md`, regra 4).

## IA não responde
| Mensagem | O que é |
|---|---|
| "usou os 120 usos de IA de hoje" | limite diário da pessoa; libera no dia seguinte |
| "muitos pedidos em menos de um minuto" | trava por minuto; esperar um pouco |
| "muita gente agora (limite gratuito)" | os modelos grátis do Google lotaram; tentar em 1 minuto |
| "ainda não foi ligado (falta GEMINI_API_KEY)" | o Secret sumiu ou a chave venceu: gere outra no AI Studio |
| 401 / "Entre na sua conta" | a pessoa não está logada |

Para ver detalhes: Supabase → Edge Functions → `ia` → **Logs**.

## E-mails não chegaram
1. A pessoa está com "Enviar e-mails" ligado e sem pausa? É dia útil?
2. GitHub → `alvorecer-dados` → **Actions**: a última execução está verde? Abra e leia o registro.
3. "Teto diário de e-mails atingido": o `LIMITE_DIA` foi alcançado (veja `03-EMAILS.md`).
4. Erro de login no Gmail: a senha de app foi revogada. Gere outra e atualize `GMAIL_APP_PASSWORD` (e também no Supabase → SMTP Settings).
5. Caiu no spam: peça para a pessoa marcar "Não é spam".

## Confirmação de cadastro não chega
- Supabase → Authentication → Emails → SMTP Settings: confira usuário/senha.
- Supabase → Authentication → Rate Limits: o limite de 12/hora pode ter sido alcançado; espere 1 hora.
- Supabase → Authentication → URL Configuration: o endereço do site precisa estar certo.

## Supabase "pausado"
Projetos grátis pausam após 7 dias sem uso. O robô de e-mails acessa o banco de hora em hora justamente para evitar isso. Se pausar, entre no painel e clique em **Restore**.
