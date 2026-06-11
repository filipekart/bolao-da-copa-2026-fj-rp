import { Trophy, Target, Award, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useExtraPredictionsStats, type CategoryStats, type ExtraCategory } from '@/hooks/useExtraPredictionsStats';
import { Flag } from '@/components/Flag';
import { useTeamNameByCode } from '@/hooks/useTranslatedTeamName';
import { useTeams } from '@/hooks/useTeams';
import { Skeleton } from '@/components/ui/skeleton';

const TOP_N = 5;

function pct(n: number, total: number) {
  if (!total) return 0;
  return (n / total) * 100;
}

function formatPct(p: number) {
  return p >= 10 ? p.toFixed(0) : p.toFixed(1);
}

interface BlockProps {
  category: ExtraCategory;
  title: string;
  icon: React.ReactNode;
  stats: CategoryStats;
  translateTeam: (name: string, fifa: string | null | undefined) => string;
  teamFifaById: Map<string, string | null>;
  t: (k: string, opts?: any) => string;
}

function StatsBlock({ category, title, icon, stats, translateTeam, teamFifaById, t }: BlockProps) {
  const top = stats.options.slice(0, TOP_N);
  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-display font-bold text-foreground">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {t('extras.stats.totalBets', { count: stats.total })}
        </span>
      </div>

      {stats.total === 0 ? (
        <p className="text-xs text-muted-foreground italic">{t('extras.stats.noData')}</p>
      ) : (
        <div className="space-y-2">
          {top.map((row, idx) => {
            const percent = pct(row.total_apostas, stats.total);
            const displayName = category === 'champion'
              ? translateTeam(row.opcao_nome ?? '', teamFifaById.get(row.opcao_id) ?? null)
              : (row.opcao_nome ?? '—');
            return (
              <div key={row.opcao_id} className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-muted-foreground font-mono">{idx + 1}</span>
                  {row.flag_url && <Flag src={row.flag_url} alt="" className="w-5 h-3.5 rounded-sm flex-shrink-0" />}
                  <span className="flex-1 min-w-0 truncate text-foreground">
                    {displayName}
                    {category !== 'champion' && row.team_name && (
                      <span className="text-muted-foreground"> · {row.team_name}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                    {row.total_apostas} <span className="opacity-70">({formatPct(percent)}%)</span>
                  </span>
                </div>
                <div className="h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full gradient-pitch"
                    style={{ width: `${Math.max(percent, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ExtrasStatsPanel() {
  const { t } = useTranslation();
  const { data, isLoading } = useExtraPredictionsStats();
  const translateTeam = useTeamNameByCode();
  const { data: teams } = useTeams();

  const teamFifaById = new Map<string, string | null>();
  teams?.forEach((tm) => teamFifaById.set(tm.id, tm.fifa_code));

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BarChart3 className="w-3.5 h-3.5" />
        <span>{t('extras.stats.heading')}</span>
      </div>
      <StatsBlock
        category="champion"
        title={t('extras.champion')}
        icon={<Trophy className="w-4 h-4 text-accent" />}
        stats={data.champion}
        translateTeam={translateTeam}
        teamFifaById={teamFifaById}
        t={t}
      />
      <StatsBlock
        category="top_scorer"
        title={t('extras.topScorer')}
        icon={<Target className="w-4 h-4 text-accent" />}
        stats={data.top_scorer}
        translateTeam={translateTeam}
        teamFifaById={teamFifaById}
        t={t}
      />
      <StatsBlock
        category="mvp"
        title={t('extras.mvp')}
        icon={<Award className="w-4 h-4 text-accent" />}
        stats={data.mvp}
        translateTeam={translateTeam}
        teamFifaById={teamFifaById}
        t={t}
      />
    </div>
  );
}