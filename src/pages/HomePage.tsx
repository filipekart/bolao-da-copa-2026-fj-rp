import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMatches, MatchWithTeams } from '@/hooks/useMatches';
import { useTeams } from '@/hooks/useTeams';
import { useAuth } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculatePredictedStandings, deriveQualifiedTeams, PredictedMatch } from '@/lib/standings';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2, Check, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { translateTeamName } from '@/lib/teamTranslations';

type Scores = Record<string, { home: number; away: number }>;

function formatDate(iso: string, lang = 'pt') {
  const locale = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function MatchRow({
  match,
  score,
  onChange,
  locked,
  teamNames,
}: {
  match: MatchWithTeams;
  score: { home: number; away: number };
  onChange: (home: number, away: number) => void;
  locked: boolean;
  teamNames?: Map<string, string>;
}) {
  const isFinished = match.status === 'FINISHED';
  const homeName = teamNames?.get(match.home_team_id) ?? match.home_team_name;
  const awayName = teamNames?.get(match.away_team_id) ?? match.away_team_name;

  return (
    <div className="flex items-center gap-1 py-2">
      {/* Home team */}
      <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
        <span className="text-xs text-foreground truncate text-right">{homeName}</span>
        {match.home_team_flag_url && (
          <img src={match.home_team_flag_url} alt="" className="w-5 h-3.5 rounded-sm flex-shrink-0" />
        )}
      </div>

      {/* Score inputs */}
      <div className="flex items-center gap-1 px-1 flex-shrink-0">
        {locked ? (
          <div className="flex items-center gap-1">
            <span className="w-7 text-center text-sm font-bold text-foreground bg-secondary rounded px-1 py-0.5">
              {score.home}
            </span>
            <span className="text-muted-foreground text-xs">×</span>
            <span className="w-7 text-center text-sm font-bold text-foreground bg-secondary rounded px-1 py-0.5">
              {score.away}
            </span>
            <Lock className="w-3 h-3 text-muted-foreground ml-0.5" />
          </div>
        ) : (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onChange(Math.max(0, score.home - 1), score.away)}
              className="w-6 h-6 rounded bg-secondary text-foreground text-xs font-bold"
            >−</button>
            <span className="w-6 text-center text-sm font-bold text-foreground">{score.home}</span>
            <button
              onClick={() => onChange(score.home + 1, score.away)}
              className="w-6 h-6 rounded bg-secondary text-foreground text-xs font-bold"
            >+</button>
            <span className="text-muted-foreground text-xs mx-0.5">×</span>
            <button
              onClick={() => onChange(score.home, Math.max(0, score.away - 1))}
              className="w-6 h-6 rounded bg-secondary text-foreground text-xs font-bold"
            >−</button>
            <span className="w-6 text-center text-sm font-bold text-foreground">{score.away}</span>
            <button
              onClick={() => onChange(score.home, score.away + 1)}
              className="w-6 h-6 rounded bg-secondary text-foreground text-xs font-bold"
            >+</button>
          </div>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {match.away_team_flag_url && (
          <img src={match.away_team_flag_url} alt="" className="w-5 h-3.5 rounded-sm flex-shrink-0" />
        )}
        <span className="text-xs text-foreground truncate">{awayName}</span>
      </div>
    </div>
  );
}

function PredictedStandingsTable({
  standings,
  teamNames,
  teamFlags,
}: {
  standings: ReturnType<typeof calculatePredictedStandings>;
  teamNames: Map<string, string>;
  teamFlags: Map<string, string | null>;
}) {
  const { t } = useTranslation();
  if (!standings.length) return null;

  return (
    <div className="mt-2 rounded-lg bg-secondary/50 overflow-hidden">
      <div className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
        {t('home.predictedStandings')}
      </div>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-t border-border/30">
            <th className="text-left px-2 py-1 text-muted-foreground">#</th>
            <th className="text-left px-1 py-1 text-muted-foreground">Time</th>
            <th className="text-center px-1 py-1 text-muted-foreground">P</th>
            <th className="text-center px-1 py-1 text-muted-foreground">SG</th>
            <th className="text-center px-1 py-1 text-muted-foreground font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, idx) => {
            const pos = idx + 1;
            const borderClass =
              pos <= 2 ? 'border-l-2 border-l-primary' :
              pos === 3 ? 'border-l-2 border-l-accent' : '';
            return (
              <tr key={s.teamId} className={`border-t border-border/20 ${borderClass}`}>
                <td className="px-2 py-1 text-muted-foreground">{pos}</td>
                <td className="px-1 py-1">
                  <div className="flex items-center gap-1">
                    {teamFlags.get(s.teamId) && (
                      <img src={teamFlags.get(s.teamId)!} alt="" className="w-4 h-3 rounded-sm" />
                    )}
                    <span className="text-foreground truncate max-w-[70px]">
                      {teamNames.get(s.teamId) ?? '?'}
                    </span>
                  </div>
                </td>
                <td className="text-center px-1 py-1 text-muted-foreground">{s.played}</td>
                <td className="text-center px-1 py-1 text-foreground">
                  {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                </td>
                <td className="text-center px-1 py-1 text-foreground font-bold">{s.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GroupCard({
  groupName,
  matches,
  scores,
  onScoreChange,
  onSave,
  saving,
  teamNames,
  teamFlags,
  existingPredictionIds,
}: {
  groupName: string;
  matches: MatchWithTeams[];
  scores: Scores;
  onScoreChange: (matchId: string, home: number, away: number) => void;
  onSave: () => void;
  saving: boolean;
  teamNames: Map<string, string>;
  teamFlags: Map<string, string | null>;
  existingPredictionIds: Set<string>;
  hasUpcoming24h?: boolean;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(!!hasUpcoming24h);

  const now = new Date();
  const allLocked = matches.every(m => new Date(m.kickoff_at) <= now);
  const allHavePredictions = matches.every(m => existingPredictionIds.has(m.id));
  const hasChanges = matches.some(m => {
    const s = scores[m.id];
    return s !== undefined && !allLocked;
  });

  // Calculate predicted standings from current scores
  const predictedMatches: PredictedMatch[] = matches.map(m => ({
    homeTeamId: m.home_team_id,
    awayTeamId: m.away_team_id,
    homeScore: scores[m.id]?.home ?? 0,
    awayScore: scores[m.id]?.away ?? 0,
  }));
  const standings = calculatePredictedStandings(predictedMatches);

  // Get unique teams in this group, seed (first match home team) first
  const groupTeamIds = useMemo(() => {
    const ids = new Set<string>();
    matches.forEach(m => { ids.add(m.home_team_id); ids.add(m.away_team_id); });
    // The first match's home team is typically the head seed
    const seedId = matches[0]?.home_team_id;
    const arr = Array.from(ids);
    if (seedId) {
      arr.sort((a, b) => (a === seedId ? -1 : b === seedId ? 1 : 0));
    }
    return arr;
  }, [matches]);

  return (
    <div className={`glass rounded-xl overflow-hidden ${hasUpcoming24h ? 'ring-1 ring-primary/50' : ''}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-display font-bold text-foreground shrink-0">{t('home.group')} {groupName}</span>
          {hasUpcoming24h && (
            <span className="text-[10px] font-semibold text-destructive shrink-0">🔴 {t('home.next24h')}</span>
          )}
          <span className="text-muted-foreground text-xs shrink-0">(</span>
          <div className="flex items-center gap-1 overflow-hidden">
            {groupTeamIds.map((id, i) => (
              <div key={id} className="flex items-center gap-0.5 shrink-0">
                {teamFlags.get(id) && (
                  <img src={teamFlags.get(id)!} alt="" className="w-4 h-3 rounded-sm" />
                )}
                <span className="text-[10px] text-muted-foreground truncate max-w-[50px]">
                  {teamNames.get(id) ?? '?'}
                </span>
                {i < groupTeamIds.length - 1 && <span className="text-muted-foreground text-[10px]">,</span>}
              </div>
            ))}
          </div>
          <span className="text-muted-foreground text-xs shrink-0">)</span>
          {allHavePredictions && (
            <Check className="w-4 h-4 text-primary shrink-0" />
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-1">
          {/* Match dates */}
          {matches.map((m, idx) => {
            const locked = new Date(m.kickoff_at) <= now;
            return (
              <div key={m.id}>
                {(idx === 0 || formatDate(matches[idx - 1].kickoff_at) !== formatDate(m.kickoff_at)) && (
                  <p className="text-[10px] text-muted-foreground mt-2 mb-1">
                    {formatDate(m.kickoff_at)}
                    {m.venue && ` · ${m.venue}`}
                  </p>
                )}
                <MatchRow
                  match={m}
                  score={scores[m.id] ?? { home: 0, away: 0 }}
                  onChange={(home, away) => onScoreChange(m.id, home, away)}
                  locked={locked}
                  teamNames={teamNames}
                />
              </div>
            );
          })}

          {/* Predicted standings */}
          <PredictedStandingsTable
            standings={standings}
            teamNames={teamNames}
            teamFlags={teamFlags}
          />

          {/* Save button */}
          {!allLocked && (
            <Button
              onClick={onSave}
              disabled={saving}
              className="w-full mt-3 gradient-pitch text-primary-foreground font-semibold h-9 text-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('home.savePredictions')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { data: matches, isLoading: matchesLoading } = useMatches('GROUP_STAGE');
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Scores>({});
  const [saving, setSaving] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) || 'pt';

  // Fetch user's existing predictions
  const { data: existingPredictions } = useQuery({
    queryKey: ['all-predictions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_predictions')
        .select('match_id, predicted_home_score, predicted_away_score')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Initialize scores from existing predictions
  useEffect(() => {
    if (existingPredictions && matches) {
      const initial: Scores = {};
      for (const m of matches) {
        const pred = existingPredictions.find(p => p.match_id === m.id);
        initial[m.id] = pred
          ? { home: pred.predicted_home_score, away: pred.predicted_away_score }
          : { home: 0, away: 0 };
      }
      setScores(initial);
    }
  }, [existingPredictions, matches]);

  // Team lookup maps
  const teamNames = useMemo(() => {
    const map = new Map<string, string>();
    teams?.forEach(t => map.set(t.id, translateTeamName(t.name, t.fifa_code, lang)));
    return map;
  }, [teams, lang]);

  const teamFlags = useMemo(() => {
    const map = new Map<string, string | null>();
    teams?.forEach(t => map.set(t.id, t.flag_url));
    return map;
  }, [teams]);

  const teamGroups = useMemo(() => {
    const map = new Map<string, string>();
    teams?.forEach(t => { if (t.group_name) map.set(t.id, t.group_name); });
    return map;
  }, [teams]);

  // Group matches by group
  const matchesByGroup = useMemo(() => {
    const groups = new Map<string, MatchWithTeams[]>();
    if (!matches || !teamGroups.size) return groups;
    for (const m of matches) {
      const group = teamGroups.get(m.home_team_id) ?? '?';
      const arr = groups.get(group) || [];
      arr.push(m);
      groups.set(group, arr);
    }
    return new Map(Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)));
  }, [matches, teamGroups]);

  // Determine which groups have matches in the next 24h
  const upcoming24hGroups = useMemo(() => {
    const now = new Date();
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const set = new Set<string>();
    for (const [groupName, groupMatches] of matchesByGroup) {
      if (groupMatches.some(m => {
        const k = new Date(m.kickoff_at);
        return k > now && k <= in24h;
      })) {
        set.add(groupName);
      }
    }
    return set;
  }, [matchesByGroup]);

  // Sort groups: upcoming 24h first, then alphabetical
  const sortedGroupEntries = useMemo(() => {
    return Array.from(matchesByGroup.entries()).sort(([a], [b]) => {
      const aUp = upcoming24hGroups.has(a);
      const bUp = upcoming24hGroups.has(b);
      if (aUp && !bUp) return -1;
      if (!aUp && bUp) return 1;
      return a.localeCompare(b);
    });
  }, [matchesByGroup, upcoming24hGroups]);

  const existingPredictionIds = useMemo(() => {
    return new Set(existingPredictions?.map(p => p.match_id) ?? []);
  }, [existingPredictions]);

  const handleScoreChange = useCallback((matchId: string, home: number, away: number) => {
    setScores(prev => ({ ...prev, [matchId]: { home, away } }));
  }, []);

  // Save predictions for a group and auto-derive knockout predictions
  const handleSaveGroup = useCallback(async (groupName: string) => {
    const groupMatches = matchesByGroup.get(groupName);
    if (!groupMatches || !user) return;

    setSaving(groupName);
    const now = new Date();

    try {
      // Save each match prediction (skip locked matches)
      const promises = groupMatches
        .filter(m => new Date(m.kickoff_at) > now)
        .map(m => {
          const s = scores[m.id] ?? { home: 0, away: 0 };
          return supabase.rpc('submit_match_prediction', {
            p_match_id: m.id,
            p_predicted_home_score: s.home,
            p_predicted_away_score: s.away,
          });
        });

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length) {
        toast.error(t('home.errorCount', { count: errors.length, message: errors[0].error!.message }));
      } else {
        toast.success(t('home.savedSuccess', { group: groupName }));
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['all-predictions'] });
      queryClient.invalidateQueries({ queryKey: ['my-predictions'] });

      // Auto-derive knockout predictions if all groups have predictions
      await deriveAndSaveKnockoutPredictions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('home.saveError'));
    } finally {
      setSaving(null);
    }
  }, [matchesByGroup, scores, user, queryClient]);

  const deriveAndSaveKnockoutPredictions = useCallback(async () => {
    if (!matches || !user || !teamGroups.size) return;

    // Calculate predicted standings for each group from current scores
    const groupStandings = new Map<string, ReturnType<typeof calculatePredictedStandings>>();

    for (const [groupName, groupMatches] of matchesByGroup) {
      // Only derive if ALL matches in group have predictions
      const allHaveScores = groupMatches.every(m => scores[m.id] !== undefined);
      if (!allHaveScores) continue;

      const predictedMatches: PredictedMatch[] = groupMatches.map(m => ({
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        homeScore: scores[m.id]?.home ?? 0,
        awayScore: scores[m.id]?.away ?? 0,
      }));
      groupStandings.set(groupName, calculatePredictedStandings(predictedMatches));
    }

    // Only proceed if we have standings for all 12 groups
    if (groupStandings.size < matchesByGroup.size) return;

    const qualifiedTeamIds = deriveQualifiedTeams(groupStandings);
    if (qualifiedTeamIds.length === 0) return;

    // Delete existing R32 knockout predictions for this user
    await supabase
      .from('knockout_predictions')
      .delete()
      .eq('user_id', user.id)
      .eq('stage', 'ROUND_OF_32' as any);

    // Insert new R32 predictions
    const inserts = qualifiedTeamIds.map(teamId => ({
      user_id: user.id,
      stage: 'ROUND_OF_32' as any,
      team_id: teamId,
    }));

    const { error } = await supabase
      .from('knockout_predictions')
      .insert(inserts);

    if (error) {
      console.error('Error saving knockout predictions:', error);
    } else {
      queryClient.invalidateQueries({ queryKey: ['knockout-predictions'] });
    }
  }, [matches, user, teamGroups, matchesByGroup, scores, queryClient]);

  if (matchesLoading || teamsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Live and finished matches for summary
  const liveMatches = matches?.filter(m => m.status === 'LIVE') ?? [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="gradient-pitch rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-7 h-7 text-primary-foreground" />
          <div>
         <h1 className="text-lg font-display font-bold text-primary-foreground">{t('home.title')}</h1>
            <p className="text-primary-foreground/80 text-xs">{t('home.subtitle')}</p>
          </div>
        </div>
      </div>

      {liveMatches.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            {t('home.liveNow')}
          </h2>
          {liveMatches.map(m => (
            <div key={m.id} className="glass rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {m.home_team_flag_url && <img src={m.home_team_flag_url} alt="" className="w-5 h-3.5 rounded-sm" />}
                <span className="text-xs text-foreground">{teamNames.get(m.home_team_id) ?? m.home_team_name}</span>
              </div>
              <span className="text-sm font-bold text-foreground">
                {m.official_home_score ?? 0} × {m.official_away_score ?? 0}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-foreground">{teamNames.get(m.away_team_id) ?? m.away_team_name}</span>
                {m.away_team_flag_url && <img src={m.away_team_flag_url} alt="" className="w-5 h-3.5 rounded-sm" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group betting cards */}
      <div className="space-y-3">
        {Array.from(matchesByGroup.entries()).map(([groupName, groupMatches]) => (
          <GroupCard
            key={groupName}
            groupName={groupName}
            matches={groupMatches}
            scores={scores}
            onScoreChange={handleScoreChange}
            onSave={() => handleSaveGroup(groupName)}
            saving={saving === groupName}
            teamNames={teamNames}
            teamFlags={teamFlags}
            existingPredictionIds={existingPredictionIds}
          />
        ))}
      </div>
    </div>
  );
}
