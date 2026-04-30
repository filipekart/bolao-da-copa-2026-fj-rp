import { useMatchStats } from '@/hooks/useMatchStats';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Flag } from '@/components/Flag';

interface Props {
  matchId: string;
  isFinished: boolean;
  homeTeamName: string;
  awayTeamName: string;
  homeFlagUrl?: string | null;
  awayFlagUrl?: string | null;
}

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444']; // green, yellow, red

export function MatchStatsPanel({ matchId, isFinished, homeTeamName, awayTeamName, homeFlagUrl, awayFlagUrl }: Props) {
  const { data: stats, isLoading } = useMatchStats(matchId, true);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats || stats.total_predictions === 0) {
    return (
      <p className="text-center text-muted-foreground text-sm py-8">
        {t('match.noStats', 'Nenhum palpite registrado para gerar estatísticas.')}
      </p>
    );
  }

  const pieData = [
    { name: homeTeamName, value: stats.result_distribution.home_pct },
    { name: t('match.draw', 'Empate'), value: stats.result_distribution.draw_pct },
    { name: awayTeamName, value: stats.result_distribution.away_pct },
  ];

  const renderLabel = ({ value }: { value: number }) => (value > 0 ? `${value}%` : '');

  const exactPct = stats.total_predictions > 0
    ? Math.round((stats.exact_hits / stats.total_predictions) * 100)
    : 0;

  const pointsRows = [
    { emoji: '🟢', pts: 25, count: stats.points_breakdown.p25, label: 'acertos' },
    { emoji: '🔵', pts: 18, count: stats.points_breakdown.p18, label: 'acertos' },
    { emoji: '🔵', pts: 12, count: stats.points_breakdown.p12, label: 'acertos' },
    { emoji: '🟡', pts: 10, count: stats.points_breakdown.p10, label: 'acertos' },
    { emoji: '🔴', pts: 0, count: stats.points_breakdown.p0, label: 'erros' },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1 — Pie chart */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('match.predictionTrend', 'Tendência dos palpites')}
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i]} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              formatter={(value: string) => (
                <span className="text-xs text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Section 2 — Top scores */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('match.topScore', 'Placar mais apostado')}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {stats.top_scores.slice(0, 3).map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-secondary">
              <div className="flex items-center gap-1">
                {homeFlagUrl && <Flag src={homeFlagUrl} className="w-4 h-3 rounded-sm object-cover" width={16} height={12} />}
                <span className="text-lg font-bold text-foreground tabular-nums">
                  {s.home} × {s.away}
                </span>
                {awayFlagUrl && <Flag src={awayFlagUrl} className="w-4 h-3 rounded-sm object-cover" width={16} height={12} />}
              </div>
              <span className="text-xs text-muted-foreground">
                ({s.count} {s.count === 1 ? 'palpite' : 'palpites'})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sections 3 & 4 — Only when FINISHED */}
      {isFinished ? (
        <>
          {/* Section 3 — Acertos */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {t('match.exactHits', 'Acertos')}
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-foreground">
                Placar exato: <span className="font-bold">{stats.exact_hits}</span> participante{stats.exact_hits !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-muted-foreground">
                Total de palpites: {stats.total_predictions}
              </p>
              <div className="flex items-center gap-3">
                <Progress value={exactPct} className="flex-1 h-2" />
                <span className="text-xs font-medium text-muted-foreground w-10 text-right">{exactPct}%</span>
              </div>
            </div>
          </div>

          {/* Section 4 — Pontos distribuídos */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {t('match.pointsDistributed', 'Pontos distribuídos')}
            </h3>
            <p className="text-2xl font-bold text-primary mb-3">
              {stats.total_points_awarded} <span className="text-sm font-normal text-muted-foreground">pts</span>
            </p>
            <div className="space-y-1.5">
              {pointsRows.map((r) => (
                <div key={r.pts} className="flex items-center gap-2 text-sm">
                  <span>{r.emoji}</span>
                  <span className="font-semibold text-foreground w-12 tabular-nums">{r.pts}pts:</span>
                  <span className="text-muted-foreground">
                    {r.count} {r.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-muted-foreground text-sm py-4 bg-secondary rounded-xl">
          {t('match.availableAfterMatch', 'Disponível após o fim da partida')}
        </p>
      )}
    </div>
  );
}
