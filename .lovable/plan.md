

## Corrigir Ranking Geral invisível para usuários não-admin

### Problema
A view `v_ranking` está com `security_invoker=on`. Ela faz `JOIN profiles p ON p.id = l.user_id WHERE p.approved = true`. Como a RLS de `profiles` só permite o próprio usuário ler sua linha (admins leem todas), para usuários comuns o JOIN filtra tudo exceto a própria linha — por isso só admins viam o ranking geral completo.

As outras abas (Grupos, Round1-3, Knockout) funcionam porque chamam o RPC `get_public_profiles` (SECURITY DEFINER), que ignora a RLS.

### Solução
Alterar a view `v_ranking` para `security_invoker=off` (definer mode), assim o JOIN com `profiles` é feito com privilégios do owner (postgres) e enxerga todos os perfis aprovados. A view já não expõe campos sensíveis (sem `pix_key`, sem email — apenas `display_name`, pontos, e info de extras já públicas).

### Migration
```sql
ALTER VIEW public.v_ranking SET (security_invoker = off);
```

Sem mudanças de código frontend — o hook `useRanking` continua igual e voltará a retornar todos os usuários aprovados.

### Validação
Após a migration, abrir a aba "Geral" como usuário comum e confirmar que todos os participantes aprovados aparecem com suas pontuações.

### Arquivos
- Nova migration SQL alterando a opção da view `v_ranking`.

