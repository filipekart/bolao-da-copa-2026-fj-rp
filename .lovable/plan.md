## Reset único da senha do BV010 (carollsmf92@gmail.com → `BV0101`)

Operação one-off. Nenhuma mudança permanente no app.

### Passos

1. **Criar edge function temporária** `admin-reset-password-oneshot` em `supabase/functions/admin-reset-password-oneshot/index.ts`:
   - Usa `SUPABASE_SERVICE_ROLE_KEY` (já disponível nos secrets)
   - Hardcoded: `user_id = 334a479e-47de-45f3-8091-01b55919c7f7`, `password = 'BV0101'`
   - Chama `supabase.auth.admin.updateUserById(user_id, { password })`
   - Retorna `{ success: true }` ou erro

2. **Deploy** via `supabase--deploy_edge_functions`

3. **Executar uma vez** via `supabase--curl_edge_functions` (POST)

4. **Apagar** o arquivo da edge function (`rm -rf supabase/functions/admin-reset-password-oneshot`) e chamar `supabase--delete_edge_functions` — sem endpoint inseguro deixado no projeto

### Resultado

- Senha da BV010 trocada para `BV0101`
- Avisar a usuária para trocar em Perfil depois
- Codebase volta exatamente como está agora
