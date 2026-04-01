import { useGroupStandings, GroupStanding } from '@/hooks/useGroupStandings';
import { useMatches } from '@/hooks/useMatches';
import { Loader2, Trophy, Calendar, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslatedTeamName } from '@/hooks/useTranslatedTeamName';

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
  { matchNum: 89, home: 'V73', away: 'V74', homeLabel: 'Vencedor 73', awayLabel: 'Vencedor 74' },
  { matchNum: 90, home: 'V75', away: 'V76', homeLabel: 'Vencedor 75', awayLabel: 'Vencedor 76' },
  { matchNum: 91, home: 'V77', away: 'V78', homeLabel: 'Vencedor 77', awayLabel: 'Vencedor 78' },
  { matchNum: 92, home: 'V79', away: 'V80', homeLabel: 'Vencedor 79', awayLabel: 'Vencedor 80' },
  { matchNum: 93, home: 'V81', away: 'V82', homeLabel: 'Vencedor 81', awayLabel: 'Vencedor 82' },
  { matchNum: 94, home: 'V83', away: 'V84', homeLabel: 'Vencedor 83', awayLabel: 'Vencedor 84' },
  { matchNum: 95, home: 'V85', away: 'V86', homeLabel: 'Vencedor 85', awayLabel: 'Vencedor 86' },
  { matchNum: 96, home: 'V87', away: 'V88', homeLabel: 'Vencedor 87', awayLabel: 'Vencedor 88' },
];

const QF_BRACKET = [
  { matchNum: 97, home: 'V89', away: 'V90', homeLabel: 'Vencedor 89', awayLabel: 'Vencedor 90' },
  { matchNum: 98, home: 'V91', away: 'V92', homeLabel: 'Vencedor 91', awayLabel: 'Vencedor 92' },
  { matchNum: 99, home: 'V93', away: 'V94', homeLabel: 'Vencedor 93', awayLabel: 'Vencedor 94' },
  { matchNum: 100, home: 'V95', away: 'V96', homeLabel: 'Vencedor 95', awayLabel: 'Vencedor 96' },
];

const SF_BRACKET = [
  { matchNum: 101, home: 'V97', away: 'V98', homeLabel: 'Vencedor 97', awayLabel: 'Vencedor 98' },
  { matchNum: 102, home: 'V99', away: 'V100', homeLabel: 'Vencedor 99', awayLabel: 'Vencedor 100' },
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
                      {s.flag_url && <img src={s.flag_url} alt="" className="w-4 h-3 rounded-sm" />}
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
}: {
  entry: BracketEntry;
  realMatch?: any;
  t: any;
  lang: string;
  tt: (teamId: string | null | undefined, fallbackName?: string) => string;
}) {
  const hasRealMatch = realMatch && realMatch.home_team_name;
  const isFinished = realMatch?.status === 'FINISHED';

  return (
    <div className="glass rounded-xl p-3 space-y-1.5">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-medium">{t('knockout.game')} {entry.matchNum}</span>
        {hasRealMatch && realMatch.kickoff_at && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(realMatch.kickoff_at).toLocaleDateString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short' })}
            {' '}
            {new Date(realMatch.kickoff_at).toLocaleTimeString(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasRealMatch && realMatch.home_team_flag_url && (
            <img src={realMatch.home_team_flag_url} alt="" className="w-5 h-4 rounded-sm shrink-0" />
          )}
          <div className="min-w-0">
            <span className="text-sm text-foreground font-medium truncate block">
              {hasRealMatch ? realMatch.home_team_name : entry.home}
            </span>
            {hasRealMatch && (
              <span className="text-[9px] text-muted-foreground">{entry.homeLabel}</span>
            )}
          </div>
        </div>
        <div className="px-2 text-sm font-bold text-foreground shrink-0">
          {isFinished
            ? `${realMatch.official_home_score} × ${realMatch.official_away_score}`
            : 'vs'}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end text-right">
          <div className="min-w-0">
            <span className="text-sm text-foreground font-medium truncate block">
              {hasRealMatch ? realMatch.away_team_name : entry.away}
            </span>
            {hasRealMatch && (
              <span className="text-[9px] text-muted-foreground">{entry.awayLabel}</span>
            )}
          </div>
          {hasRealMatch && realMatch.away_team_flag_url && (
            <img src={realMatch.away_team_flag_url} alt="" className="w-5 h-4 rounded-sm shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function KnockoutPage() {
  const { data: standings, isLoading: standingsLoading } = useGroupStandings();
  const { data: allMatches, isLoading: matchesLoading } = useMatches();
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket'>('bracket');
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) ?? 'pt';

  const KNOCKOUT_STAGES = [
    { key: 'ROUND_OF_32', label: t('knockout.stages.ROUND_OF_32'), bracket: R32_BRACKET },
    { key: 'ROUND_OF_16', label: t('knockout.stages.ROUND_OF_16'), bracket: R16_BRACKET },
    { key: 'QUARTER_FINAL', label: t('knockout.stages.QUARTER_FINAL'), bracket: QF_BRACKET },
    { key: 'SEMI_FINAL', label: t('knockout.stages.SEMI_FINAL'), bracket: SF_BRACKET },
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
                {stage.bracket.map(entry => (
                  <BracketMatchCard
                    key={entry.matchNum}
                    entry={entry}
                    realMatch={matchByNumber.get(entry.matchNum)}
                    t={t}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
