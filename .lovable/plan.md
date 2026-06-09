## Objetivo
Gerar um arquivo Excel (.xlsx) com a lista completa de participantes do bolão, contendo apenas duas colunas: **Nome** e **Email**.

## Fonte dos dados
- `public.profiles.display_name` (nome)
- `auth.users.email` (email), join por `id`
- Ordenação alfabética por nome
- Inclui todos os usuários cadastrados (aprovados e pendentes)

## Entrega
Arquivo salvo em `/mnt/documents/participantes-bolao.xlsx`, disponível para download direto no chat via `<presentation-artifact>`.

## Observações
- Nenhuma alteração de código no app.
- Artefato pontual; se quiser uma página de admin para exportar isso recorrentemente, posso planejar separado.
