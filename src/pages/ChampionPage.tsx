import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Loader2, Trophy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

function useChampionPrediction() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['champion-prediction', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knockout_predictions')
        .select('*, teams(name, flag_url)')
        .eq('user_id', user!.id)
        .eq('stage', 'CHAMPION')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

function useFirstMatchKickoff() {
  return useQuery({
    queryKey: ['first-match-kickoff'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('kickoff_at')
        .order('kickoff_at', { ascending: true })
        .limit(1)
        .single();
      if (error) throw error;
      return data?.kickoff_at ? new Date(data.kickoff_at) : null;
    },
  });
}

export default function ChampionPage() {
  const { user } = useAuth();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: prediction, isLoading: predLoading } = useChampionPrediction();
  const { data: firstKickoff, isLoading: kickoffLoading } = useFirstMatchKickoff();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const isLocked = firstKickoff ? new Date() >= firstKickoff : false;

  const submitMutation = useMutation({
    mutationFn: async (teamId: string) => {
      // Delete existing champion prediction if any
      await supabase
        .from('knockout_predictions')
        .delete()
        .eq('user_id', user!.id)
        .eq('stage', 'CHAMPION');

      const { error } = await supabase
        .from('knockout_predictions')
        .insert({
          user_id: user!.id,
          team_id: teamId,
          stage: 'CHAMPION' as const,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['champion-prediction'] });
      toast.success('Palpite de campeão salvo!');
      setSelectedTeamId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (teamsLoading || predLoading || kickoffLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const filteredTeams = teams?.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  // Group teams by group
  const groupedTeams = new Map<string, typeof filteredTeams>();
  filteredTeams.forEach(t => {
    const g = t.group_name || 'Sem grupo';
    const arr = groupedTeams.get(g) || [];
    arr.push(t);
    groupedTeams.set(g, arr);
  });
  const sortedGroups = Array.from(groupedTeams.entries()).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <Trophy className="w-5 h-5 text-accent" /> Campeão
      </h1>

      <p className="text-sm text-muted-foreground">
        Escolha quem será o campeão da Copa 2026. Vale <span className="text-accent font-bold">50 pontos</span>!
      </p>

      {isLocked && (
        <div className="glass rounded-xl p-4 flex items-center gap-3 border border-accent/30">
          <Lock className="w-5 h-5 text-accent shrink-0" />
          <p className="text-sm text-muted-foreground">
            A Copa já começou. Não é mais possível alterar o palpite de campeão.
          </p>
        </div>
      )}

      {/* Current prediction */}
      {prediction && (
        <div className="glass rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Seu palpite atual:</p>
          <div className="flex items-center gap-3">
            {(prediction as any).teams?.flag_url && (
              <img src={(prediction as any).teams.flag_url} alt="" className="w-8 h-6 rounded-sm" />
            )}
            <span className="text-lg font-display font-bold text-foreground">
              {(prediction as any).teams?.name ?? 'Time desconhecido'}
            </span>
            <Trophy className="w-5 h-5 text-accent ml-auto" />
          </div>
        </div>
      )}

      {/* Team selector */}
      {!isLocked && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Buscar seleção..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
            {sortedGroups.map(([group, groupTeams]) => (
              <div key={group}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">Grupo {group}</p>
                <div className="space-y-1">
                  {groupTeams.map(team => {
                    const isSelected = selectedTeamId === team.id;
                    const isCurrent = prediction?.team_id === team.id;
                    return (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeamId(isSelected ? null : team.id)}
                        className={`w-full glass rounded-xl px-4 py-3 flex items-center gap-3 transition-all ${
                          isSelected ? 'ring-2 ring-primary' :
                          isCurrent ? 'ring-1 ring-accent' : ''
                        }`}
                      >
                        {team.flag_url && <img src={team.flag_url} alt="" className="w-6 h-4 rounded-sm" />}
                        <span className="text-sm text-foreground font-medium">{team.name}</span>
                        {isCurrent && <span className="text-[10px] text-accent ml-auto">atual</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {selectedTeamId && selectedTeamId !== prediction?.team_id && (
            <button
              onClick={() => submitMutation.mutate(selectedTeamId)}
              disabled={submitMutation.isPending}
              className="w-full gradient-gold text-accent-foreground font-display font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
            >
              {submitMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                'Confirmar Campeão'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
