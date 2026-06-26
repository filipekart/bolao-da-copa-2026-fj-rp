Atualizar a data de kickoff dos jogos **Nova Zelândia x Bélgica** e **Paraguai x Irã** para **27 de junho de 2026**, mantendo o horário (hora/minuto) atual de cada jogo.

Via migration SQL:
```sql
UPDATE public.matches
SET kickoff_at = (DATE '2026-06-27' + kickoff_at::time) AT TIME ZONE 'UTC'
WHERE id IN (
  SELECT m.id FROM public.matches m
  JOIN public.teams h ON h.id = m.home_team_id
  JOIN public.teams a ON a.id = m.away_team_id
  WHERE (h.name ILIKE '%New Zealand%' AND a.name ILIKE '%Belgium%')
     OR (h.name ILIKE '%Paraguay%' AND a.name ILIKE '%Iran%')
);
```

Confirma?