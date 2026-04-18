import { useState, useMemo } from 'react';
import { useMatchPredictions, type MatchPrediction } from '@/hooks/useMatchPredictions';
import { useAuth } from '@/lib/auth';
import { Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

const ruleBadge: Record<string, { label: string; cls: string }> = {
  EXACT_SCORE: { label: '25pts', cls: 'bg-green-600/20 text-green-400' },
  WINNER_AND_WINNER_GOALS: { label: '18pts', cls: 'bg-blue-600/20 text-blue-400' },
  WINNER_AND_LOSER_GOALS: { label: '12pts', cls: 'bg-blue-600/20 text-blue-400' },
  DRAW_RESULT_ONLY: { label: '16pts', cls: 'bg-teal-600/20 text-teal-400' },
  RESULT_ONLY: { label: '10pts', cls: 'bg-yellow-600/20 text-yellow-400' },
  MISS: { label: '0pts', cls: 'bg-red-600/20 text-red-400' },
  PENDING: { label: '—', cls: 'bg-muted text-muted-foreground' },
};

interface Props {
  matchId: string;
  isFinished: boolean;
  homeFlagUrl?: string | null;
  awayFlagUrl?: string | null;
}

export function MatchPredictionsList({ matchId, isFinished, homeFlagUrl, awayFlagUrl }: Props) {
  const { data, isLoading } = useMatchPredictions(matchId, true);
  const { user } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((p) => p.display_name.toLowerCase().includes(q));
  }, [data, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-8">
        {t('match.noPredictions', 'Nenhum palpite registrado para esta partida.')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('match.searchParticipant', 'Buscar participante...')}
          className="pl-9 pr-9 h-9 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-1">
        {filtered.map((p) => {
          const isMe = p.user_id === user?.id;
          const badge = ruleBadge[p.rule_applied] ?? ruleBadge.PENDING;
          return (
            <div
              key={p.user_id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isMe ? 'ring-1 ring-primary bg-primary/5' : 'hover:bg-secondary/50'}`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                {p.display_name.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">
                {p.display_name}
              </span>

              {/* Score with flags */}
              <div className="flex items-center gap-1 shrink-0">
                {homeFlagUrl && <img src={homeFlagUrl} alt="" className="w-4 h-3 rounded-sm object-cover" />}
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {p.predicted_home_score} × {p.predicted_away_score}
                </span>
                {awayFlagUrl && <img src={awayFlagUrl} alt="" className="w-4 h-3 rounded-sm object-cover" />}
              </div>

              {/* Points badge */}
              {isFinished && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge.cls}`}>
                  {badge.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
