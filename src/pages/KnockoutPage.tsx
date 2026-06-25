import { useGroupStandings, GroupStanding } from '@/hooks/useGroupStandings';
import { useMatches } from '@/hooks/useMatches';
import { Loader2, Trophy, Calendar, Info, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTranslatedTeamName } from '@/hooks/useTranslatedTeamName';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useActiveProfile } from '@/lib/activeProfile';
import { toast } from 'sonner';

import { Flag } from '@/components/Flag';
const R32_BRACKET = [
  { matchNum: 73, home: '2ºA', away: '2ºB', homeLabel: '2º Grupo A', awayLabel: '2º Grupo B' },
  { matchNum: 74, home: '1ºE', away: '3º A/B/C/D/F', homeLabel: '1º Grupo E', awayLabel: 'Melhor 3º' },
  { matchNum: 75, home: '1ºF', away: '2ºC', homeLabel: '1º Grupo F', awayLabel: '2º Grupo C' },
  { matchNum: 76, home: '1ºC', away: '2ºF', homeLabel: '1º Grupo C', awayLabel: '2º Grupo F' },
  { matchNum: 77, home: '1ºI', away: '3º C/D/F/G/H', homeLabel: '1º Grupo I', awayLabel: 'Melhor 3º' },
  { matchNum: 78, home: '2ºE', away: '2ºI', homeLabel: '2º Grupo E', awayLabel: '2º Grupo I' },
  { matchNum: 79, home: '1ºA', away: '3º C/E/F/H/I', homeLabel: '1º Grupo A', awayLabel: 'Melhor 3º' },
  { matchNum: 80, home: '1ºL', away: '3º E/H/I/J/K', homeLabel: '1º Grupo L', awayLabel: 'Melhor 3º' },
  { matchNum: 81, home: '1ºD', away: '3º B/E/F/I/J', homeLabel: '1º Grupo D', awayLabel: 'Melhor 3º' },
  { matchNum: 82, home: '1ºG', away: '3º A/E/H/I/J', homeLabel: '1º Grupo G', awayLabel: 'Melhor 3º' },
  { matchNum: 83, home: '2ºK', away: '2ºL', homeLabel: '2º Grupo K', awayLabel: '2º Grupo L' },
  { matchNum: 84, home: '1ºH', away: '2ºJ', homeLabel: '1º Grupo H', awayLabel: '2º Grupo J' },
  { matchNum: 85, home: '1ºB', away: '3º E/F/G/I/J', homeLabel: '1º Grupo B', awayLabel: 'Melhor 3º' },
  { matchNum: 86, home: '1ºJ', away: '2ºH', homeLabel: '1º Grupo J', awayLabel: '2º Grupo H' },
  { matchNum: 87, home: '1ºK', away: '3º D/E/I/J/L', homeLabel: '1º Grupo K', awayLabel: 'Melhor 3º' },
  { matchNum: 88, home: '2ºD', away: '2ºG', homeLabel: '2º Grupo D', awayLabel: '2º Grupo G' },
];

const R16_BRACKET = [
  { matchNum: 89, home: 'V74', away: 'V77', homeLabel: 'Vencedor 74', awayLabel: 'Vencedor 77' },
  { matchNum: 90, home: 'V73', away: 'V75', homeLabel: 'Vencedor 73', awayLabel: 'Vencedor 75' },
  { matchNum: 91, home: 'V76', away: 'V78', homeLabel: 'Vencedor 76', awayLabel: 'Vencedor 78' },
  { matchNum: 92, home: 'V79', away: 'V80', homeLabel: 'Vencedor 79', awayLabel: 'Vencedor 80' },
  { matchNum: 93, home: 'V83', away: 'V84', homeLabel: 'Vencedor 83', awayLabel: 'Vencedor 84' },
  { matchNum: 94, home: 'V81', away: 'V82', homeLabel: 'Vencedor 81', awayLabel: 'Vencedor 82' },
  { matchNum: 95, home: 'V86', away: 'V88', homeLabel: 'Vencedor 86', awayLabel: 'Vencedor 88' },
  { matchNum: 96, home: 'V85', away: 'V87', homeLabel: 'Vencedor 85', awayLabel: 'Vencedor 87' },
];

const QF_BRACKET = [
  { matchNum: 97, home: 'V89', away: 'V90', homeLabel: 'Vencedor 89', awayLabel: 'Vencedor 90' },
  { matchNum: 98, home: 'V93', away: 'V94', homeLabel: 'Vencedor 93', awayLabel: 'Vencedor 94' },
  { matchNum: 99, home: 'V91', away: 'V92', homeLabel: 'Vencedor 91', awayLabel: 'Vencedor 92' },
  { matchNum: 100, home: 'V95', away: 'V96', homeLabel: 'Vencedor 95', awayLabel: 'Vencedor 96' },
];

const SF_BRACKET = [
  { matchNum: 101, home: 'V97', away: 'V98', homeLabel: 'Vencedor 97', awayLabel: 'Vencedor 98' },
  { matchNum: 102, home: 'V99', away: 'V100', homeLabel: 'Vencedor 99', awayLabel: 'Vencedor 100' },
];

const THIRD_PLACE_BRACKET = [
  { matchNum: 103, home: 'P101', away: 'P102', homeLabel: 'Perdedor 101', awayLabel: 'Perdedor 102' },
];

const FINAL_BRACKET = [
  { matchNum: 104, home: 'V101', away: 'V102', homeLabel: 'Vencedor 101', awayLabel: 'Vencedor 102' },
];

function GroupTable({ group, standings }: { group: string; standings: GroupStanding[] }) {
  const { t } = useTranslation();
  const tt = useTranslatedTeamName();
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="gradient-pitch px-3 py-2">
        <h3 className="text-sm font-display font-bold text-primary-foreground">{t('home.group')} {group}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">#</th>
              <th className="text-left px-2 py-2 text-muted-foreground font-medium">Time</th>
              <th className="text-center px-1 py-2 text-muted-foreground font-medium">J</th>
              <th className="text-center px-1 py-2 text-muted-foreground font-medium">V</th>
              <th className="text-center px-1 py-2 text-muted-foreground font-medium">E</th>
              <th className="text-center px-1 py-2 text-muted-foreground font-medium">D</th>
              <th className="text-center px-1 py-2 text-muted-foreground font-medium">GP</th>
              <th className="text-center px-1 py-2 text-muted-foreground font-medium">GC</th>
              <th className="text-center px-1 py-2 text-muted-foreground font-medium">SG</th>
              <th className="text-center px-2 py-2 text-muted-foreground font-bold">P</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, idx) => {
              const position = idx + 1;
              const qualifyClass =
                position <= 2 ? 'border-l-2 border-l-primary' :
                position === 3 ? 'border-l-2 border-l-accent' : '';
              return (
                <tr key={s.team_id} className={`border-b border-border/50 ${qualifyClass}`}>
                  <td className="px-3 py-2 text-muted-foreground">{position}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      {s.flag_url && <Flag src={s.flag_url} alt="" className="w-4 h-3 rounded-sm" />}
                      <span className="text-foreground font-medium truncate max-w-[80px]">{tt(s.team_id, s.team_name)}</span>
                    </div>
                  </td>
                  <td className="text-center px-1 py-2 text-muted-foreground">{s.played}</td>
                  <td className="text-center px-1 py-2 text-muted-foreground">{s.wins}</td>
                  <td className="text-center px-1 py-2 text-muted-foreground">{s.draws}</td>
                  <td className="text-center px-1 py-2 text-muted-foreground">{s.losses}</td>
                  <td className="text-center px-1 py-2 text-muted-foreground">{s.goals_for}</td>
                  <td className="text-center px-1 py-2 text-muted-foreground">{s.goals_against}</td>
                  <td className="text-center px-1 py-2 text-foreground">{s.goal_difference > 0 ? `+${s.goal_difference}` : s.goal_difference}</td>
                  <td className="text-center px-2 py-2 text-foreground font-bold">{s.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type BracketEntry = { matchNum: number; home: string; away: string; homeLabel: string; awayLabel: string };

function BracketMatchCard({
  entry,
  realMatch,
  t,
  lang,
  tt,
  onClick,
  existingPrediction,
  canBet,
  activeUserId,
  isActingAsOther,
}: {
  entry: BracketEntry;
  realMatch?: any;
  t: any;
  lang: string;
  tt: (teamId: string | null | undefined, fallbackName?: string) => string;
  onClick?: () => void;
  existingPrediction?: { predicted_home_score: number; predicted_away_score: number } | null;
  canBet: boolean;
  activeUserId?: string | null;
  isActingAsOther: boolean;
}) {
  const queryClient = useQueryClient();
  const hasRealMatch = realMatch && realMatch.home_team_name;
  const isFinished = realMatch?.status === 'FINISHED';
  const isLocked = !canBet;
  const showInputs = hasRealMatch && canBet && !isFinished;

  const [home, setHome] = useState<number | null>(existingPrediction?.predicted_home_score ?? null);
  const [away, setAway] = useState<number | null>(existingPrediction?.predicted_away_score ?? null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const lastSavedRef = useRef<string>(
    existingPrediction
      ? `${existingPrediction.predicted_home_score}-${existingPrediction.predicted_away_score}`
      : ''
  );

  // Sync when server prediction loads/changes (e.g. acting-as switch)
  useEffect(() => {
    if (existingPrediction) {
      setHome(existingPrediction.predicted_home_score);
      setAway(existingPrediction.predicted_away_score);
      lastSavedRef.current = `${existingPrediction.predicted_home_score}-${existingPrediction.predicted_away_score}`;
    } else {
      setHome(null);
      setAway(null);
      lastSavedRef.current = '';
    }
  }, [existingPrediction?.predicted_home_score, existingPrediction?.predicted_away_score]);

  // Debounced auto-save when both scores set and changed
  useEffect(() => {
    if (!showInputs || !realMatch?.id) return;
    if (home === null || away === null) return;
    const key = `${home}-${away}`;
    if (key === lastSavedRef.current) return;

    const timer = setTimeout(async () => {
      setSaving(true);
      const { error } = await supabase.rpc('submit_match_prediction', {
        p_match_id: realMatch.id,
        p_predicted_home_score: home as number,
        p_predicted_away_score: away as number,
        ...(isActingAsOther && activeUserId ? { p_acting_as: activeUserId } : {}),
      });
      setSaving(false);
      if (error) {
        toast.error(error.message ?? 'Erro ao salvar palpite');
        return;
      }
      lastSavedRef.current = key;
      setSavedAt(Date.now());
      queryClient.invalidateQueries({ queryKey: ['knockout-match-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['my-predictions'] });
    }, 700);

    return () => clearTimeout(timer);
  }, [home, away, showInputs, realMatch?.id, isActingAsOther, activeUserId]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const isClickable = !!realMatch?.id && !!onClick;

  const Wrapper: any = isClickable ? 'div' : 'div';
  const wrapperProps: any = {
    onClick: isClickable ? onClick : undefined,
    className: `glass rounded-xl p-3 space-y-1.5 ${isClickable ? 'cursor-pointer hover:bg-secondary/40 transition-colors' : ''}`,
  };

  return (
    <Wrapper {...wrapperProps}>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-medium">{t('knockout.game')} {entry.matchNum}</span>
        {hasRealMatch && realMatch.kickoff_at && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(realMatch.kickoff_at).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' })}
            {' '}
            {new Date(realMatch.kickoff_at).toLocaleTimeString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 py-1">
        {/* Home team row */}
        <div className="flex items-center gap-2">
          {hasRealMatch && realMatch.home_team_flag_url ? (
            <Flag src={realMatch.home_team_flag_url} alt="" className="w-6 h-4 rounded-sm shrink-0" />
          ) : (
            <div className="w-6 h-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm text-foreground font-semibold leading-tight">
              {hasRealMatch ? tt(realMatch.home_team_id, realMatch.home_team_name) : entry.home}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">{entry.homeLabel}</div>
          </div>
        </div>

        {/* Score row */}
        <div className="flex items-center justify-center py-1 text-sm font-bold text-foreground">
          {isFinished ? (
            <span className="text-base">{realMatch.official_home_score} × {realMatch.official_away_score}</span>
          ) : showInputs ? (
            <div className="flex items-center gap-1" onClick={stop}>
              <button
                type="button"
                onClick={(e) => { stop(e); setHome(h => h === null ? 0 : Math.max(0, h - 1)); }}
                className="w-7 h-7 rounded bg-secondary text-foreground text-sm font-bold"
              >−</button>
              <span className={`w-6 text-center text-base font-bold ${home === null ? 'text-muted-foreground' : 'text-foreground'}`}>
                {home === null ? '–' : home}
              </span>
              <button
                type="button"
                onClick={(e) => { stop(e); setHome(h => (h ?? 0) + 1); }}
                className="w-7 h-7 rounded bg-secondary text-foreground text-sm font-bold"
              >+</button>
              <span className="text-muted-foreground text-sm mx-1">×</span>
              <button
                type="button"
                onClick={(e) => { stop(e); setAway(a => a === null ? 0 : Math.max(0, a - 1)); }}
                className="w-7 h-7 rounded bg-secondary text-foreground text-sm font-bold"
              >−</button>
              <span className={`w-6 text-center text-base font-bold ${away === null ? 'text-muted-foreground' : 'text-foreground'}`}>
                {away === null ? '–' : away}
              </span>
              <button
                type="button"
                onClick={(e) => { stop(e); setAway(a => (a ?? 0) + 1); }}
                className="w-7 h-7 rounded bg-secondary text-foreground text-sm font-bold"
              >+</button>
            </div>
          ) : isLocked && hasRealMatch && (home !== null && away !== null) ? (
            <span className="text-muted-foreground">{home} × {away}</span>
          ) : (
            <span className="text-muted-foreground">vs</span>
          )}
        </div>

        {/* Away team row */}
        <div className="flex items-center gap-2">
          {hasRealMatch && realMatch.away_team_flag_url ? (
            <Flag src={realMatch.away_team_flag_url} alt="" className="w-6 h-4 rounded-sm shrink-0" />
          ) : (
            <div className="w-6 h-4 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm text-foreground font-semibold leading-tight">
              {hasRealMatch ? tt(realMatch.away_team_id, realMatch.away_team_name) : entry.away}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">{entry.awayLabel}</div>
          </div>
        </div>
      </div>
      {isClickable && (
        <div className="flex items-center justify-between text-[10px] pt-0.5">
          <span className="text-primary font-medium">
            {t('knockout.openDetails', 'Detalhes / quem avança →')}
          </span>
          {showInputs && (
            <span className="text-muted-foreground flex items-center gap-1">
              {saving ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> {t('match.saving', 'Salvando...')}</>
              ) : savedAt ? (
                <><Check className="w-3 h-3 text-primary" /> {t('home.saved', 'Salvo')}</>
              ) : null}
            </span>
          )}
        </div>
      )}
    </Wrapper>
  );
}

export default function KnockoutPage() {
  const { data: standings, isLoading: standingsLoading } = useGroupStandings();
  const { data: allMatches, isLoading: matchesLoading } = useMatches();
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket'>('bracket');
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) ?? 'pt';
  const tt = useTranslatedTeamName();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeUserId, isActingAsOther } = useActiveProfile();

  const knockoutMatchIds = (allMatches ?? [])
    .filter(m => m.stage !== 'GROUP_STAGE')
    .map(m => m.id);

  const { data: knockoutPredictions } = useQuery({
    queryKey: ['knockout-match-predictions', activeUserId, knockoutMatchIds.length],
    queryFn: async () => {
      if (!activeUserId || knockoutMatchIds.length === 0) return [];
      const { data, error } = await supabase
        .from('match_predictions')
        .select('match_id, predicted_home_score, predicted_away_score')
        .eq('user_id', activeUserId)
        .in('match_id', knockoutMatchIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user && !!activeUserId && knockoutMatchIds.length > 0,
  });

  const predictionByMatchId = new Map(
    (knockoutPredictions ?? []).map(p => [p.match_id, p])
  );

  const KNOCKOUT_STAGES = [
    { key: 'ROUND_OF_32', label: t('knockout.stages.ROUND_OF_32'), bracket: R32_BRACKET },
    { key: 'ROUND_OF_16', label: t('knockout.stages.ROUND_OF_16'), bracket: R16_BRACKET },
    { key: 'QUARTER_FINAL', label: t('knockout.stages.QUARTER_FINAL'), bracket: QF_BRACKET },
    { key: 'SEMI_FINAL', label: t('knockout.stages.SEMI_FINAL'), bracket: SF_BRACKET },
    { key: 'THIRD_PLACE', label: 'Disputa do 3º lugar', bracket: THIRD_PLACE_BRACKET },
    { key: 'FINAL', label: t('knockout.stages.FINAL'), bracket: FINAL_BRACKET },
  ] as const;

  if (standingsLoading || matchesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const groups = new Map<string, GroupStanding[]>();
  standings?.forEach(s => {
    const arr = groups.get(s.group_name) || [];
    arr.push(s);
    groups.set(s.group_name, arr);
  });
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));

  const knockoutMatches = allMatches?.filter(m => m.stage !== 'GROUP_STAGE') ?? [];
  const matchByNumber = new Map<number, (typeof knockoutMatches)[0]>();
  knockoutMatches.forEach(m => {
    if (m.match_number) matchByNumber.set(m.match_number, m);
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <Trophy className="w-5 h-5 text-accent" /> {t('knockout.title')}
      </h1>

      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'groups' ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          {t('knockout.standings')}
        </button>
        <button
          onClick={() => setActiveTab('bracket')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'bracket' ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          {t('knockout.bracket')}
        </button>
      </div>

      {activeTab === 'groups' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-primary" />
              <span>{t('knockout.classified')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-accent" />
              <span>{t('knockout.possibleClassification')}</span>
            </div>
          </div>
          {sortedGroups.map(([group, teams]) => (
            <GroupTable key={group} group={group} standings={teams} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Alert className="border-primary/40 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-muted-foreground">
              {t(
                'knockout.scoreScopeNotice',
                'Os placares dos palpites consideram os 90 minutos + prorrogação (se houver). Pênaltis não contam no placar.'
              )}
            </AlertDescription>
          </Alert>
          {R32_BRACKET.some(e => !matchByNumber.get(e.matchNum)?.home_team_name) && (
            <Alert className="border-accent/50 bg-accent/10">
              <Info className="h-4 w-4 text-accent" />
              <AlertDescription className="text-sm text-muted-foreground">
                {t('knockout.predictionsNotice')}
              </AlertDescription>
            </Alert>
          )}
          {KNOCKOUT_STAGES.map(stage => (
            <div key={stage.key} className="space-y-2">
              <h2 className="text-sm font-display font-semibold text-foreground">{stage.label}</h2>
              <div className="space-y-2">
                {stage.bracket.map(entry => {
                  const real = matchByNumber.get(entry.matchNum);
                  const canBet = !!real && !!real.id && !!real.home_team_name
                    && real.status !== 'FINISHED'
                    && !!real.kickoff_at
                    && new Date(real.kickoff_at).getTime() > Date.now();
                  return (
                    <BracketMatchCard
                      key={entry.matchNum}
                      entry={entry}
                      realMatch={real}
                      t={t}
                      lang={lang}
                      tt={tt}
                      onClick={real?.id ? () => navigate(`/match/${real.id}`) : undefined}
                      existingPrediction={real ? predictionByMatchId.get(real.id) as any : null}
                      canBet={canBet}
                      activeUserId={activeUserId}
                      isActingAsOther={isActingAsOther}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
