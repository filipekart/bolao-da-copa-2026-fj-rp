import { useState } from 'react';
import { useMyPredictions } from '@/hooks/usePredictions';
import { Loader2, History, Clock, MapPin, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

function formatDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function MyBetsPage() {
  const { data: predictions, isLoading } = useMyPredictions();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) ?? 'pt';

  const ruleLabels: Record<string, { label: string; color: string }> = {
    EXACT_SCORE: { label: t('bets.rules.EXACT_SCORE'), color: 'text-primary' },
    WINNER_AND_WINNER_GOALS: { label: t('bets.rules.WINNER_AND_WINNER_GOALS'), color: 'text-primary' },
    WINNER_AND_LOSER_GOALS: { label: t('bets.rules.WINNER_AND_LOSER_GOALS'), color: 'text-primary' },
    RESULT_ONLY: { label: t('bets.rules.RESULT_ONLY'), color: 'text-accent' },
    DRAW_RESULT_ONLY: { label: t('bets.rules.DRAW_RESULT_ONLY'), color: 'text-accent' },
    MISS: { label: t('bets.rules.MISS'), color: 'text-destructive' },
    PENDING: { label: t('bets.rules.PENDING'), color: 'text-muted-foreground' },
  };

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
        <History className="w-5 h-5 text-primary" /> {t('bets.title')}
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('bets.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {!predictions?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t('bets.noPredictions')}</p>
        </div>
      ) : (
        (() => {
          const q = search.toLowerCase().trim();
          const filtered = predictions.filter(p => {
            if (!q) return true;
            const m = p.match;
            return m?.home_team_name?.toLowerCase().includes(q) ||
                   m?.away_team_name?.toLowerCase().includes(q);
          });

          const sorted = [...filtered].sort((a, b) => {
            const da = a.match?.kickoff_at ? new Date(a.match.kickoff_at).getTime() : 0;
            const db = b.match?.kickoff_at ? new Date(b.match.kickoff_at).getTime() : 0;
            return da - db;
          });

          const groups = new Map<string, typeof sorted>();
          for (const p of sorted) {
            const groupName = (p.match as any)?.group_name ?? 'Outros';
            if (!groups.has(groupName)) groups.set(groupName, []);
            groups.get(groupName)!.push(p);
          }

          const sortedKeys = [...groups.keys()].sort((a, b) => {
            if (a === 'Outros') return 1;
            if (b === 'Outros') return -1;
            return a.localeCompare(b);
          });

          return (
            <div className="space-y-6">
              {sortedKeys.map(groupName => (
                <div key={groupName}>
                  <h2 className="text-sm font-bold text-primary mb-2">
                    {t('bets.group')} {groupName}
                  </h2>
                  <div className="space-y-3">
                    {groups.get(groupName)!.map((p) => {
                      const rule = ruleLabels[p.rule_applied] ?? ruleLabels.PENDING;
                      const match = p.match;
                      const isFinished = match?.status === 'FINISHED';

                      return (
                        <button
                          key={p.id}
                          onClick={() => navigate(`/match/${p.match_id}`)}
                          className="w-full glass rounded-xl p-4 text-left space-y-3"
                        >
                          {match && (
                            <>
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>{t(`match.stages.${match.stage}`, match.stage?.replace(/_/g, ' '))}</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(match.kickoff_at!, lang)}
                                </div>
                              </div>

                              {match.venue && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  {match.venue}{match.city ? `, ${match.city}` : ''}
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {match.home_team_flag_url && (
                                    <img src={match.home_team_flag_url} alt="" className="w-6 h-4 rounded-sm" />
                                  )}
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {match.home_team_name}
                                  </span>
                                </div>

                                <div className="px-3 text-center">
                                  {isFinished ? (
                                    <span className="text-sm font-bold text-foreground">
                                      {match.official_home_score} × {match.official_away_score}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">vs</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {match.away_team_name}
                                  </span>
                                  {match.away_team_flag_url && (
                                    <img src={match.away_team_flag_url} alt="" className="w-6 h-4 rounded-sm" />
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border/50">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {t('bets.yourPrediction')}:{' '}
                                <span className="text-foreground font-semibold">
                                  {p.predicted_home_score} × {p.predicted_away_score}
                                </span>
                              </p>
                              <p className={`text-xs mt-0.5 ${rule.color}`}>{rule.label}</p>
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
                </div>
              ))}
            </div>
          );
        })()
      )}
    </div>
  );
}
