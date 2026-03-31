import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useState, ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  category: 'top_scorer' | 'mvp';
  title: string;
  description: string;
  icon: ReactNode;
}

function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').order('name');
      if (error) throw error;
      return data;
    },
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

export default function PlayerPredictionTab({ category, title, description, icon }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: firstKickoff, isLoading: kickoffLoading } = useFirstMatchKickoff();

  const { data: prediction, isLoading: predLoading } = useQuery({
    queryKey: ['extra-prediction', category, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extra_predictions')
        .select('*, teams(name, flag_url)')
        .eq('user_id', user!.id)
        .eq('category', category)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [playerName, setPlayerName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState('');
  const [showTeamPicker, setShowTeamPicker] = useState(false);

  const isLocked = firstKickoff ? new Date() >= firstKickoff : false;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!playerName.trim()) throw new Error('Informe o nome do jogador');
      if (!selectedTeamId) throw new Error('Selecione a seleção do jogador');

      const { error } = await supabase
        .from('extra_predictions')
        .upsert(
          {
            user_id: user!.id,
            category,
            player_name: playerName.trim(),
            team_id: selectedTeamId,
            submitted_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,category' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extra-prediction', category] });
      toast.success(`Palpite de ${title} salvo!`);
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

  const selectedTeam = teams?.find(t => t.id === selectedTeamId);
  const filteredTeams = teams?.filter(t => t.name.toLowerCase().includes(teamSearch.toLowerCase())) ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: description.replace(/(\d+ pontos!)/, '<span class="text-accent font-bold">$1</span>') }} />

      {isLocked && (
        <div className="glass rounded-xl p-4 flex items-center gap-3 border border-accent/30">
          <Lock className="w-5 h-5 text-accent shrink-0" />
          <p className="text-sm text-muted-foreground">
            A Copa já começou. Não é mais possível alterar este palpite.
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
            <div>
              <span className="text-lg font-display font-bold text-foreground">
                {prediction.player_name}
              </span>
              <p className="text-xs text-muted-foreground">
                {(prediction as any).teams?.name}
              </p>
            </div>
            <div className="ml-auto">{icon}</div>
          </div>
        </div>
      )}

      {/* Form */}
      {!isLocked && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm text-foreground font-medium">Nome do jogador</label>
            <Input
              placeholder="Ex: Mbappé"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-foreground font-medium">Seleção</label>
            {selectedTeam ? (
              <button
                onClick={() => { setSelectedTeamId(null); setShowTeamPicker(true); }}
                className="w-full glass rounded-xl px-4 py-3 flex items-center gap-3 ring-1 ring-primary"
              >
                {selectedTeam.flag_url && <img src={selectedTeam.flag_url} alt="" className="w-6 h-4 rounded-sm" />}
                <span className="text-sm text-foreground font-medium">{selectedTeam.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">trocar</span>
              </button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Buscar seleção..."
                  value={teamSearch}
                  onChange={e => { setTeamSearch(e.target.value); setShowTeamPicker(true); }}
                  onFocus={() => setShowTeamPicker(true)}
                  className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                />
                {showTeamPicker && (
                  <div className="space-y-1 max-h-[30vh] overflow-y-auto">
                    {filteredTeams.map(team => (
                      <button
                        key={team.id}
                        onClick={() => {
                          setSelectedTeamId(team.id);
                          setShowTeamPicker(false);
                          setTeamSearch('');
                        }}
                        className="w-full glass rounded-xl px-4 py-2.5 flex items-center gap-3 transition-all hover:ring-1 hover:ring-primary"
                      >
                        {team.flag_url && <img src={team.flag_url} alt="" className="w-6 h-4 rounded-sm" />}
                        <span className="text-sm text-foreground">{team.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || !playerName.trim() || !selectedTeamId}
            className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
          >
            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : `Confirmar ${title}`}
          </Button>
        </div>
      )}
    </div>
  );
}
