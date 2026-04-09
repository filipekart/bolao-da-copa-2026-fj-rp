import { useNavigate } from 'react-router-dom';
import { type MatchWithTeams } from '@/hooks/useMatches';
import { Clock, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTranslatedTeamName } from '@/hooks/useTranslatedTeamName';

function getLocale(lang: string) {
  return lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US';
}

function formatDate(iso: string, lang: string) {
  return new Date(iso).toLocaleDateString(getLocale(lang), { day: '2-digit', month: 'short' });
}

function formatTime(iso: string, lang: string) {
  return new Date(iso).toLocaleTimeString(getLocale(lang), { hour: '2-digit', minute: '2-digit' });
}

export function MatchCard({ match }: { match: MatchWithTeams }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) ?? 'pt';
  const tt = useTranslatedTeamName();
  const isFinished = match.status === 'FINISHED';
  const isLive = match.status === 'LIVE';
  const isPast = new Date(match.kickoff_at) <= new Date();

  return (
    <button
      onClick={() => navigate(`/match/${match.id}`)}
      className="w-full glass rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">
          {t(`match.stages.${match.stage}`, match.stage)}
        </span>
        {isLive && (
          <span className="text-xs font-semibold text-destructive flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            {t('match.live')}
          </span>
        )}
        {isFinished && (
          <span className="text-xs font-medium text-primary">{t('match.finished')}</span>
        )}
        {!isFinished && !isLive && !isPast && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDate(match.kickoff_at, lang)} · {formatTime(match.kickoff_at, lang)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {match.home_team_flag_url && (
            <img src={match.home_team_flag_url} alt="" loading="lazy" className="w-6 h-4 rounded-sm object-cover" />
          )}
          <span className="text-sm font-medium text-foreground truncate">{tt(match.home_team_id, match.home_team_name)}</span>
        </div>

        <div className="px-3 flex items-center gap-2">
          {isFinished || isLive ? (
            <div className="flex items-center gap-1">
              <span className="text-lg font-display font-bold text-foreground">{match.official_home_score}</span>
              <span className="text-muted-foreground text-sm">×</span>
              <span className="text-lg font-display font-bold text-foreground">{match.official_away_score}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm font-medium">vs</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium text-foreground truncate">{tt(match.away_team_id, match.away_team_name)}</span>
          {match.away_team_flag_url && (
            <img src={match.away_team_flag_url} alt="" loading="lazy" className="w-6 h-4 rounded-sm object-cover" />
          )}
        </div>
      </div>

      {match.venue && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          {match.venue}{match.city ? `, ${match.city}` : ''}
        </div>
      )}
    </button>
  );
}
