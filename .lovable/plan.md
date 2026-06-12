## Diagnóstico

- Hoje a planilha é gerada pela função `export-match-predictions` quando ela é chamada.
- O texto do admin diz “geradas automaticamente no kickoff”, mas não há uma chamada automática garantida no app; por isso alguns jogos, como Coreia do Sul x República Tcheca, podem ficar sem registro em `match_export_log`.
- O jogo Coreia do Sul x República Tcheca está cadastrado como jogo 2, mas ainda não tem planilha salva.

## Plano

1. **Criar geração automática no backend**
   - Adicionar um agendamento/cron para chamar `export-match-predictions` periodicamente.
   - A função já busca jogos cujo `kickoff_at <= agora` e ainda não têm planilha, então ela funciona bem para “recuperar atrasados” também.

2. **Tornar a função mais robusta**
   - Manter idempotência: se a planilha já existe, não duplica.
   - Registrar falhas por jogo no retorno para facilitar diagnóstico.
   - Garantir que jogos recém-iniciados e jogos esquecidos sejam processados na próxima execução.

3. **Adicionar botão de recuperação geral no Admin**
   - Além do botão individual “Regenerar”, incluir uma ação tipo “Gerar pendentes”.
   - Isso chama a função sem `match_id` e cria todas as planilhas faltantes de jogos já iniciados.

4. **Melhorar a mensagem da aba Planilhas**
   - Explicar que as planilhas são geradas automaticamente e que o botão “Gerar pendentes” força uma varredura manual caso algo não apareça.

## Resultado esperado

- A planilha do jogo Coreia do Sul x República Tcheca será criada automaticamente assim que o agendamento rodar, desde que o horário do jogo já tenha passado.
- Se por algum motivo o agendamento falhar, o admin consegue corrigir clicando em “Gerar pendentes”, sem precisar regenerar jogo por jogo.