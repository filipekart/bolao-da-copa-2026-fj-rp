import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '@/hooks/useMatches';
import { useMatchPrediction, useSubmitPrediction } from '@/hooks/usePredictions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, MapPin, Lock, Loader2 } from 'lucide-react';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const ruleLabels: Record<string, string> = {
  EXACT_SCORE: '🎯 Placar exato! +25',
  WINNER_AND_WINNER_GOALS: '✅ Vencedor + gols do vencedor! +18',
  WINNER_AND_LOSER_GOALS: '✅ Vencedor + gols do perdedor! +12',
  RESULT_ONLY: '👍 Resultado certo! +10',
  DRAW_RESULT_ONLY: '👍 Empate certo! +10',
  MISS: '❌ Errou',
  PENDING: '⏳ Aguardando resultado',
};

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { data: match, isLoading: matchLoading } = useMatch(matchId!);
  const { data: prediction, isLoading: predLoading } = useMatchPrediction(matchId!);
  const submitPrediction = useSubmitPrediction();

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  useEffect(() => {
    if (prediction) {
      setHomeScore(prediction.predicted_home_score);
      setAwayScore(prediction.predicted_away_score);
    }
  }, [prediction]);

  if (matchLoading || predLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) return null;

  const isLocked = new Date(match.kickoff_at) <= new Date();
  const isFinished = match.status === 'FINISHED';

  const handleSubmit = () => {
    submitPrediction.mutate({
      matchId: match.id,
      homeScore,
      awayScore,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{match.stage.replace(/_/g, ' ')}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateTime(match.kickoff_at)}
          </div>
        </div>

        {match.venue && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {match.venue}{match.city ? `, ${match.city}` : ''}
          </div>
        )}

        {/* Teams & Score */}
        <div className="flex items-center justify-between py-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            {match.home_team_flag_url && (
              <img src={match.home_team_flag_url} alt="" className="w-10 h-7 rounded object-cover" />
            )}
            <span className="text-sm font-medium text-foreground text-center">{match.home_team_name}</span>
          </div>

          <div className="px-4">
            {isFinished ? (
              <div className="flex items-center gap-2">
                <span className="text-3xl font-display font-bold text-foreground">{match.official_home_score}</span>
                <span className="text-muted-foreground">×</span>
                <span className="text-3xl font-display font-bold text-foreground">{match.official_away_score}</span>
              </div>
            ) : (
              <span className="text-xl font-display text-muted-foreground">vs</span>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            {match.away_team_flag_url && (
              <img src={match.away_team_flag_url} alt="" className="w-10 h-7 rounded object-cover" />
            )}
            <span className="text-sm font-medium text-foreground text-center">{match.away_team_name}</span>
          </div>
        </div>
      </div>

      {/* Prediction Form */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <h2 className="text-lg font-display font-semibold text-foreground">Seu palpite</h2>

        {isLocked ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Lock className="w-4 h-4" />
            <span>Palpites encerrados para esta partida</span>
          </div>
        ) : null}

        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">{match.home_team_name}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                disabled={isLocked}
                className="w-10 h-10 rounded-lg bg-secondary text-foreground font-bold text-lg disabled:opacity-50"
              >
                −
              </button>
              <span className="w-10 text-center text-2xl font-display font-bold text-foreground">{homeScore}</span>
              <button
                onClick={() => setHomeScore(homeScore + 1)}
                disabled={isLocked}
                className="w-10 h-10 rounded-lg bg-secondary text-foreground font-bold text-lg disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          <span className="text-muted-foreground text-xl mt-5">×</span>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-muted-foreground">{match.away_team_name}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                disabled={isLocked}
                className="w-10 h-10 rounded-lg bg-secondary text-foreground font-bold text-lg disabled:opacity-50"
              >
                −
              </button>
              <span className="w-10 text-center text-2xl font-display font-bold text-foreground">{awayScore}</span>
              <button
                onClick={() => setAwayScore(awayScore + 1)}
                disabled={isLocked}
                className="w-10 h-10 rounded-lg bg-secondary text-foreground font-bold text-lg disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {!isLocked && (
          <Button
            onClick={handleSubmit}
            disabled={submitPrediction.isPending}
            className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
          >
            {submitPrediction.isPending ? 'Salvando...' : prediction ? 'Atualizar palpite' : 'Salvar palpite'}
          </Button>
        )}

        {prediction && (
          <div className="mt-3 p-3 rounded-lg bg-secondary text-sm">
            <p className="text-muted-foreground">
              Palpite: <span className="text-foreground font-medium">{prediction.predicted_home_score} × {prediction.predicted_away_score}</span>
            </p>
            {prediction.rule_applied !== 'PENDING' && (
              <p className="mt-1 text-foreground font-medium">
                {ruleLabels[prediction.rule_applied] ?? prediction.rule_applied}
              </p>
            )}
            {prediction.points_awarded > 0 && (
              <p className="text-primary font-bold mt-1">+{prediction.points_awarded} pontos</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
