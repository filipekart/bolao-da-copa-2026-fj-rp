Alvaro Jorge usa o email **alvarojorge@terra.com.br**.

Vou alterar a senha dele para `papai1957` via migration SQL direta em `auth.users` (mesma abordagem usada anteriormente para a BNC Realty), garantindo também que `email_change` fique como `''` para evitar o erro de GoTrue no login.

### SQL da migration

```sql
UPDATE auth.users
SET encrypted_password = crypt('papai1957', gen_salt('bf')),
    email_change = COALESCE(NULLIF(email_change, NULL), ''),
    updated_at = now()
WHERE id = '22885271-db77-4c0a-99d3-bb51bec95a29';
```

Após executar, aviso para o Alvaro tentar logar com a nova senha.