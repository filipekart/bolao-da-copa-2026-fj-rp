

## Plano: Atualizar times da repescagem nos grupos

### Resultados da repescagem
- **Pathway 1 (IC1) → Grupo K**: **RD Congo** (DR Congo) — venceu Jamaica 1-0 na prorrogação
- **Pathway 2 (IC2) → Grupo I**: **Iraque** (Iraq) — venceu Bolívia 2-1

### Alterações

**1. Migração SQL — atualizar os 2 times placeholder**

Atualizar nome, short_name, fifa_code e flag_url dos times "Vencedor Repescagem IC 1" e "Vencedor Repescagem IC 2":

- `IC1` → nome: "RD Congo", short_name: "COD", fifa_code: "COD", flag_url: bandeira do Congo
- `IC2` → nome: "Iraque", short_name: "IRQ", fifa_code: "IRQ", flag_url: bandeira do Iraque

**2. Atualizar `src/lib/teamTranslations.ts`**

Substituir as entradas IC1 e IC2 por:
- `COD`: { pt: 'RD Congo', en: 'DR Congo', es: 'RD Congo', fr: 'RD Congo' }
- `IRQ`: { pt: 'Iraque', en: 'Iraq', es: 'Irak', fr: 'Irak' }

Remover as entradas IC1 e IC2.

### Resultado
- Os grupos K e I mostrarão os nomes e bandeiras corretos dos times classificados
- Todas as partidas associadas a esses times serão atualizadas automaticamente (usam o mesmo team_id)
- Palpites existentes de campeão feitos para IC1/IC2 continuarão válidos pois referenciam o UUID

