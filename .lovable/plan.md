

## Plano: Adicionar política de leitura admin em match_predictions

### O que será feito
Criar uma migração SQL que adiciona uma política RLS permitindo que administradores leiam todos os registros da tabela `match_predictions`.

### Alteração

**Nova migração SQL:**
```sql
CREATE POLICY "admins can read all match_predictions"
  ON public.match_predictions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
```

### Resultado
- Admins poderão consultar todos os palpites para auditoria e pontuação
- Usuários comuns continuam vendo apenas seus próprios palpites
- O finding de segurança `match_predictions_admin_read_missing` será resolvido

Nenhuma alteração de código frontend é necessária.

