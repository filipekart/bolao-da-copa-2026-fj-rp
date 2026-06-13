import { Trophy, Target, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useExtraPredictionsStats, type ExtraCategory } from '@/hooks/useExtraPredictionsStats';
import { Flag } from '@/components/Flag';
import { useTeamNameByCode } from '@/hooks/useTranslatedTeamName';
import { useTeams } from '@/hooks/useTeams';
import { Skeleton } from '@/components/ui/skeleton';

const TOP_N_DEFAULT = 10;
const TOP_N_PLAYERS = 20;
const PIE_TOP = 5;
const PIE_COLORS = ['#16a34a', '#eab308', '#0ea5e9', '#a855f7', '#ef4444', '#64748b'];

function pct(n: number, total: number) {
  if (!total) return 0;
  return (n / total) * 100;
}

function formatPct(p: number) {
  return p >= 10 ? p.toFixed(0) : p.toFixed(1);
}

const ICONS: Record<ExtraCategory, React.ComponentType<{ className?: string }>> = {
  champion: Trophy,
  top_scorer: Target,
  mvp: Award,
};

const TITLE_KEYS: Record<ExtraCategory, string> = {
  champion: 'extras.champion',
  top_scorer: 'extras.topScorer',
  mvp: 'extras.mvp',
};

interface Props {
  category: ExtraCategory;
}

export default function ExtrasStatsPanel({ category }: Props) {
  const { t } = useTranslation();
  const { data, isLoading } = useExtraPredictionsStats();
  const translateTeam = useTeamNameByCode();
  const { data: teams } = useTeams();

  if (isLoading || !data) {
    return <Skeleton className="h-72 w-full rounded-xl" />;
  }

  const stats = data[category];
  const Icon = ICONS[category];
  const topN = category === 'champion' ? TOP_N_DEFAULT : TOP_N_PLAYERS;

  const teamFifaById = new Map<string, string | null>();
  teams?.forEach((tm) => teamFifaById.set(tm.id, tm.fifa_code));

  const displayName = (opcaoNome: string | null, opcaoId: string) =>
    category === 'champion'
      ? translateTeam(opcaoNome ?? '', teamFifaById.get(opcaoId) ?? null)
      : (opcaoNome ?? '—');

  const top = stats.options.slice(0, topN);

  // Pie: top 5 + "Outros" aggregated
  const pieTop = stats.options.slice(0, PIE_TOP);
  const restCount = stats.options.slice(PIE_TOP).reduce((s, r) => s + r.total_apostas, 0);
  const pieData = [
    ...pieTop.map((r) => ({
      name: displayName(r.opcao_nome, r.opcao_id),
      value: r.total_apostas,
    })),
    ...(restCount > 0 ? [{ name: t('extras.stats.others'), value: restCount }] : []),
  ];

  const renderLabel = ({ value }: { value: number }) => {
    const p = pct(value, stats.total);
    return p >= 5 ? `${formatPct(p)}%` : '';
  };

  return (
    <div className="glass rounded-xl p-4 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-display font-bold text-foreground">
            {t('extras.stats.distributionTitle', { category: t(TITLE_KEYS[category]) })}
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {t('extras.stats.totalBets', { count: stats.total })}
        </span>
      </div>

      {stats.total === 0 ? (
        <p className="text-xs text-muted-foreground italic">{t('extras.stats.noData')}</p>
      ) : (
        <>
          {/* Pie / trend chart */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              {t('extras.stats.trendTitle')}
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  dataKey="value"
                  label={renderLabel}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} (${formatPct(pct(value, stats.total))}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-1">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-sm"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="truncate max-w-[140px]">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 list */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">
              {t('extras.stats.topList', { count: Math.min(topN, stats.options.length) })}
            </h4>
            <div className="space-y-2">
              {top.map((row, idx) => {
                const percent = pct(row.total_apostas, stats.total);
                return (
                  <div key={row.opcao_id} className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-muted-foreground font-mono">{idx + 1}</span>
                      {row.flag_url && (
                        <Flag src={row.flag_url} alt="" className="w-5 h-3.5 rounded-sm flex-shrink-0" />
                      )}
                      <span className="flex-1 min-w-0 truncate text-foreground">
                        {displayName(row.opcao_nome, row.opcao_id)}
                        {category !== 'champion' && row.team_name && (
                          <span className="text-muted-foreground"> · {row.team_name}</span>
                        )}
                      </span>
                      <span className="text-muted-foreground tabular-nums whitespace-nowrap">
                        {row.total_apostas}{' '}
                        <span className="opacity-70">({formatPct(percent)}%)</span>
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
          </div>
        </>
      )}
    </div>
  );
}