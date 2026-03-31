import { useGroupStandings, GroupStanding } from '@/hooks/useGroupStandings';
import { useMatches } from '@/hooks/useMatches';
import { Loader2, Trophy, Calendar } from 'lucide-react';
import { useState } from 'react';

const KNOCKOUT_STAGES = [
  { key: 'ROUND_OF_32', label: 'Fase de 32' },
  { key: 'ROUND_OF_16', label: 'Oitavas de Final' },
  { key: 'QUARTER_FINAL', label: 'Quartas de Final' },
  { key: 'SEMI_FINAL', label: 'Semifinal' },
  { key: 'FINAL', label: 'Final' },
] as const;

function GroupTable({ group, standings }: { group: string; standings: GroupStanding[] }) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="gradient-pitch px-3 py-2">
        <h3 className="text-sm font-display font-bold text-primary-foreground">Grupo {group}</h3>
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
              // Top 2 qualify directly, 3rd might qualify as best 3rd
              const qualifyClass =
                position <= 2 ? 'border-l-2 border-l-primary' :
                position === 3 ? 'border-l-2 border-l-accent' : '';
              return (
                <tr key={s.team_id} className={`border-b border-border/50 ${qualifyClass}`}>
                  <td className="px-3 py-2 text-muted-foreground">{position}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      {s.flag_url && <img src={s.flag_url} alt="" className="w-4 h-3 rounded-sm" />}
                      <span className="text-foreground font-medium truncate max-w-[80px]">{s.team_name}</span>
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

function KnockoutBracket({ stage, matches }: { stage: string; matches: any[] }) {
  if (!matches.length) {
    return (
      <div className="glass rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">Jogos ainda não definidos</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map(m => {
        const kickoff = new Date(m.kickoff_at);
        const isFinished = m.status === 'FINISHED';
        return (
          <div key={m.id} className="glass rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {kickoff.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                {' '}
                {kickoff.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {m.venue && <span>{m.venue}</span>}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {m.home_team_flag_url && <img src={m.home_team_flag_url} alt="" className="w-5 h-4 rounded-sm" />}
                <span className="text-sm text-foreground truncate">
                  {m.home_team_name || 'A definir'}
                </span>
              </div>
              <div className="px-3 text-sm font-bold text-foreground">
                {isFinished
                  ? `${m.official_home_score} × ${m.official_away_score}`
                  : 'vs'}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span className="text-sm text-foreground truncate">
                  {m.away_team_name || 'A definir'}
                </span>
                {m.away_team_flag_url && <img src={m.away_team_flag_url} alt="" className="w-5 h-4 rounded-sm" />}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function KnockoutPage() {
  const { data: standings, isLoading: standingsLoading } = useGroupStandings();
  const { data: allMatches, isLoading: matchesLoading } = useMatches();
  const [activeTab, setActiveTab] = useState<'groups' | 'bracket'>('groups');

  if (standingsLoading || matchesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Group standings by group
  const groups = new Map<string, GroupStanding[]>();
  standings?.forEach(s => {
    const arr = groups.get(s.group_name) || [];
    arr.push(s);
    groups.set(s.group_name, arr);
  });
  const sortedGroups = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));

  // Knockout matches by stage
  const knockoutMatches = allMatches?.filter(m => m.stage !== 'GROUP_STAGE') ?? [];
  const matchesByStage = new Map<string, typeof knockoutMatches>();
  knockoutMatches.forEach(m => {
    const arr = matchesByStage.get(m.stage) || [];
    arr.push(m);
    matchesByStage.set(m.stage, arr);
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <Trophy className="w-5 h-5 text-accent" /> 2ª Fase
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'groups' ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          Classificação
        </button>
        <button
          onClick={() => setActiveTab('bracket')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'bracket' ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          Chave
        </button>
      </div>

      {activeTab === 'groups' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-primary" />
              <span>Classificado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm bg-accent" />
              <span>Possível classificação (melhor 3º)</span>
            </div>
          </div>
          {sortedGroups.map(([group, teams]) => (
            <GroupTable key={group} group={group} standings={teams} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {KNOCKOUT_STAGES.map(stage => {
            const stageMatches = matchesByStage.get(stage.key) ?? [];
            return (
              <div key={stage.key} className="space-y-2">
                <h2 className="text-sm font-display font-semibold text-foreground">{stage.label}</h2>
                <KnockoutBracket stage={stage.key} matches={stageMatches} />
              </div>
            );
          })}
          {knockoutMatches.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Os jogos da 2ª fase serão definidos conforme a fase de grupos se encerrar.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
