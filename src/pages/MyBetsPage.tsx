import { useMyPredictions } from '@/hooks/usePredictions';
import { Loader2, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ruleLabels: Record<string, { label: string; color: string }> = {
  EXACT_SCORE: { label: '🎯 Exato', color: 'text-primary' },
  WINNER_AND_WINNER_GOALS: { label: '✅ Vencedor+gols', color: 'text-primary' },
  WINNER_AND_LOSER_GOALS: { label: '✅ Vencedor+gols', color: 'text-primary' },
  RESULT_ONLY: { label: '👍 Resultado', color: 'text-accent' },
  DRAW_RESULT_ONLY: { label: '👍 Empate', color: 'text-accent' },
  MISS: { label: '❌ Errou', color: 'text-destructive' },
  PENDING: { label: '⏳ Pendente', color: 'text-muted-foreground' },
};

export default function MyBetsPage() {
  const { data: predictions, isLoading } = useMyPredictions();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <History className="w-5 h-5 text-primary" /> Meus Palpites
      </h1>

      {!predictions?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Você ainda não fez nenhum palpite.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((p) => {
            const rule = ruleLabels[p.rule_applied] ?? ruleLabels.PENDING;
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/match/${p.match_id}`)}
                className="w-full glass rounded-xl p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground font-medium">
                      Palpite: {p.predicted_home_score} × {p.predicted_away_score}
                    </p>
                    <p className={`text-xs mt-1 ${rule.color}`}>{rule.label}</p>
                  </div>
                  {p.points_awarded > 0 && (
                    <span className="text-lg font-display font-bold text-primary">
                      +{p.points_awarded}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
