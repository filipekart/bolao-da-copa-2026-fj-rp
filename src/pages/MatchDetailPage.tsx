import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatch } from '@/hooks/useMatches';
import { useMatchPrediction, useSubmitPrediction } from '@/hooks/usePredictions';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, MapPin, Lock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTranslatedTeamName } from '@/hooks/useTranslatedTeamName';
import { isMatchRevealed } from '@/lib/matchVisibility';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchPredictionsList } from '@/components/MatchPredictionsList';
import { MatchStatsPanel } from '@/components/MatchStatsPanel';

function formatDateTime(iso: string, lang: string) {
  const locale = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { data: match, isLoading: matchLoading } = useMatch(matchId!);
  const { data: prediction, isLoading: predLoading } = useMatchPrediction(matchId!);
  const submitPrediction = useSubmitPrediction();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) ?? 'pt';
  const tt = useTranslatedTeamName();

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  // Real-time clock for bet locking — updates every 30s
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const ruleLabels: Record<string, string> = {
    EXACT_SCORE: t('bets.rules.EXACT_SCORE'),
    WINNER_AND_WINNER_GOALS: t('bets.rules.WINNER_AND_WINNER_GOALS'),
    WINNER_AND_LOSER_GOALS: t('bets.rules.WINNER_AND_LOSER_GOALS'),
    RESULT_ONLY: t('bets.rules.RESULT_ONLY'),
    DRAW_RESULT_ONLY: t('bets.rules.DRAW_RESULT_ONLY'),
    MISS: t('bets.rules.MISS'),
    PENDING: t('bets.rules.PENDING'),
  };

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

  const isLocked = new Date(match.kickoff_at) <= now;
  const isFinished = match.status === 'FINISHED';
  const revealed = isMatchRevealed(match);

  const handleSubmit = () => {
    submitPrediction.mutate({
      matchId: match.id,
      homeScore,
      awayScore,
    });
  };

  const renderMyPrediction = () => (
    <>
      {isLocked ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Lock className="w-4 h-4" />
          <span>{t('match.predictionsLocked')}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">{tt(match.home_team_id, match.home_team_name)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
              disabled={isLocked}
              className="w-10 h-10 rounded-lg bg-secondary text-foreground font-bold text-lg disabled:opacity-50"
            >−</button>
            <span className="w-10 text-center text-2xl font-display font-bold text-foreground">{homeScore}</span>
            <button
              onClick={() => setHomeScore(homeScore + 1)}
              disabled={isLocked}
              className="w-10 h-10 rounded-lg bg-secondary text-foreground font-bold text-lg disabled:opacity-50"
            >+</button>
          </div>
        </div>

        <span className="text-muted-foreground text-xl mt-5">×</span>

        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">{tt(match.away_team_id, match.away_team_name)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
              disabled={isLocked}
              className="w-10 h-10 rounded-lg bg-secondary text-foreground font-bold text-lg disabled:opacity-50"
            >−</button>
            <span className="w-10 text-center text-2xl font-display font-bold text-foreground">{awayScore}</span>
            <button
              onClick={() => setAwayScore(awayScore + 1)}
              disabled={isLocked}
              className="w-10 h-10 rounded-lg bg-secondary text-foreground font-bold text-lg disabled:opacity-50"
            >+</button>
          </div>
        </div>
      </div>

      {!isLocked && (
        <Button
          onClick={handleSubmit}
          disabled={submitPrediction.isPending}
          className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
        >
          {submitPrediction.isPending ? t('match.saving') : prediction ? t('match.updatePrediction') : t('match.savePrediction')}
        </Button>
      )}

      {prediction && (
        <div className="mt-3 p-3 rounded-lg bg-secondary text-sm">
          <p className="text-muted-foreground">
            {t('match.prediction')}: <span className="text-foreground font-medium">{prediction.predicted_home_score} × {prediction.predicted_away_score}</span>
          </p>
          {prediction.rule_applied !== 'PENDING' && (
            <p className="mt-1 text-foreground font-medium">
              {ruleLabels[prediction.rule_applied] ?? prediction.rule_applied}
            </p>
          )}
          {prediction.points_awarded > 0 && (
            <p className="text-primary font-bold mt-1">+{prediction.points_awarded} {t('match.points')}</p>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground text-sm">
        <ArrowLeft className="w-4 h-4" /> {t('match.back')}
      </button>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t(`match.stages.${match.stage}`, match.stage.replace(/_/g, ' '))}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDateTime(match.kickoff_at, lang)}
          </div>
        </div>

        {match.venue && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {match.venue}{match.city ? `, ${match.city}` : ''}
          </div>
        )}

        <div className="flex items-center justify-between py-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            {match.home_team_flag_url && (
              <img src={match.home_team_flag_url} alt="" loading="lazy" className="w-10 h-7 rounded object-cover" />
            )}
            <span className="text-sm font-medium text-foreground text-center">{tt(match.home_team_id, match.home_team_name)}</span>
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
              <img src={match.away_team_flag_url} alt="" loading="lazy" className="w-10 h-7 rounded object-cover" />
            )}
            <span className="text-sm font-medium text-foreground text-center">{tt(match.away_team_id, match.away_team_name)}</span>
          </div>
        </div>
      </div>

      {revealed ? (
        <Tabs defaultValue="my-prediction" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="my-prediction" className="flex-1">{t('match.yourPrediction')}</TabsTrigger>
            <TabsTrigger value="all-predictions" className="flex-1">{t('match.allPredictions', 'Palpites')}</TabsTrigger>
          </TabsList>

          <TabsContent value="my-prediction">
            <div className="glass rounded-2xl p-5 space-y-4">
              {renderMyPrediction()}
            </div>
          </TabsContent>

          <TabsContent value="all-predictions">
            <div className="glass rounded-2xl p-5">
              <MatchPredictionsList
                matchId={match.id}
                isFinished={isFinished}
                homeFlagUrl={match.home_team_flag_url}
                awayFlagUrl={match.away_team_flag_url}
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="glass rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-display font-semibold text-foreground">{t('match.yourPrediction')}</h2>
          {renderMyPrediction()}
        </div>
      )}
    </div>
  );
}
