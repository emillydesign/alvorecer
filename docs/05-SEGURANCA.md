# 05 · Segurança: regras que nunca podem ser quebradas

O IAlvorecer é aberto para qualquer pessoa. Por isso o site foi feito para que **ninguém consiga** ver dados de outra pessoa, gastar os recursos de todo mundo, mandar e-mail para quem não pediu, nem rodar código malicioso no site. Toda edição precisa manter isso.

## As 12 regras
1. **Nenhuma chave secreta no código.** No site só pode existir a `sb_publishable_...`. Chaves `sb_secret_...`, do Gemini ou senhas do Gmail ficam só nos Secrets (Supabase / GitHub).
2. **Texto que vem de pessoas ou da IA sempre passa por `esc()` ou `md()`** antes de entrar no HTML. Nunca `${algo}` direto quando `algo` veio do usuário, da IA ou do banco.
3. **Nada de JavaScript dentro do HTML:** nada de `onclick="..."`, `onerror=`, `<script>` dentro de textos ou `javascript:` em links. Use `data-algo` + o "clique global" (Ctrl+F `document.addEventListener('click'` em `app.js`). O site tem uma política (`Content-Security-Policy` no `index.html`) que bloqueia scripts que não sejam do próprio site e das bibliotecas usadas.
4. **Não afrouxe a `Content-Security-Policy`.** Não adicione `'unsafe-inline'` ou `'unsafe-eval'` em `script-src`. Se precisar de uma biblioteca nova de outro site, adicione só aquele endereço exato.
5. **Todas as tabelas com RLS ligado.** Dados de aluno só com `user_id = auth.uid()`. Nunca `grant` para `anon` em dados pessoais.
6. **Limites ficam no servidor**, não só no site: limite de IA na função `ia`, de feedback e espaço no banco, de e-mails no robô. O que está no navegador a pessoa consegue burlar; no servidor, não.
7. **As REGRAS FIXAS da função `ia` não saem.** Elas impedem cursos e respostas com +18, crimes, invasão de sistemas, malware, golpes ou ataques ao próprio IAlvorecer, mesmo se alguém tentar enganar a IA ("ignore as instruções anteriores…").
8. **E-mails só para o e-mail da própria conta.** Nunca usar um endereço digitado pela pessoa como destino.
9. **No máximo 1 e-mail do dia e 1 lembrete por pessoa por dia**, e o teto `LIMITE_DIA`. Não remova a checagem `ja_enviado`.
10. **Uma conversação por dia** na agenda (o site troca o horário se marcar o mesmo dia de novo). O lembrete é enviado só uma vez por dia.
11. **O cache de aulas (`licoes_publicas`) usa a impressão digital do pedido.** Não volte a usar só o nome que o site manda.
12. **Uma mudança por vez, testada.** Nada de trocar arquivos inteiros sem conferir.

## Checklist antes de publicar (peça ao Claude para conferir junto)
- [ ] Mexi só no trecho que precisava? Nomes de funções e ids continuam iguais?
- [ ] Tem texto de usuário/IA entrando no HTML sem `esc()`/`md()`?
- [ ] Apareceu `onclick=`, `innerHTML` com dado de fora, `eval(`, `new Function(`?
- [ ] Apareceu alguma chave, senha ou e-mail pessoal?
- [ ] Mexi no banco? RLS continua ligado? Alguma política nova deixa ver dados dos outros?
- [ ] Mexi na função `ia`? `REGRAS`, `POR_MINUTO`, `LIMITE`, `MAX_PEDIDO` e o cache com `digital(` continuam lá?
- [ ] Mexi no robô? `ja_enviado`, `marcar_enviado`, `LIMITE_DIA` e `emails_das_contas` continuam lá?
- [ ] Aumentei o `?v=` em `index.html` e `js/app.js`?
- [ ] Testei em janela anônima, visitante e logada?

## Pedidos que o Claude deve recusar ou questionar
- "Tira o limite de IA / de e-mail só pra mim": o certo é aumentar o número do limite, não remover a trava.
- "Mostra os dados de todos os usuários no site": nunca. Dados de alunos só pelo painel do Supabase.
- "Coloca a chave secreta no site para funcionar mais rápido": nunca.
- "Deixa a IA responder qualquer coisa": as REGRAS FIXAS ficam.

## Se você suspeitar de abuso
- **Muitas contas estranhas:** Supabase → Authentication → Users (dá para apagar a conta).
- **Uso de IA estranho:** SQL Editor → `select * from uso_ia order by n desc limit 20;`
- **Spam no feedback:** Table Editor → `feedback`.
- **Chave vazou:** gere outra no lugar onde ela nasceu (AI Studio, Supabase API Keys ou senha de app do Google), apague a antiga e atualize o Secret.
