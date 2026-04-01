import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Loader2, Lock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useState, ReactNode, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useTeamNameByCode } from '@/hooks/useTranslatedTeamName';

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

function usePlayers(teamId: string | null) {
  return useQuery({
    queryKey: ['players', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId!)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
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
  const { t } = useTranslation();
  const tn = useTeamNameByCode();

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

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState('');
  const [showTeamPicker, setShowTeamPicker] = useState(false);

  const [playerName, setPlayerName] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);

  const { data: players, isLoading: playersLoading } = usePlayers(selectedTeamId);

  const isLocked = firstKickoff ? new Date() >= firstKickoff : false;

  const selectedTeam = teams?.find(t => t.id === selectedTeamId);

  const filteredTeams = useMemo(
    () => teams?.filter(t => tn(t.name, t.fifa_code).toLowerCase().includes(teamSearch.toLowerCase())) ?? [],
    [teams, teamSearch, tn]
  );

  const filteredPlayers = useMemo(
    () => players?.filter(p => p.name.toLowerCase().includes(playerSearch.toLowerCase())) ?? [],
    [players, playerSearch]
  );

  const hasPlayers = (players?.length ?? 0) > 0;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!playerName.trim()) throw new Error(t('extras.playerRequired'));
      if (!selectedTeamId) throw new Error(t('extras.teamRequired'));

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
      toast.success(t('extras.predictionSaved', { title }));
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

  return (
    <div className="space-y-4">
      <p
        className="text-sm text-muted-foreground"
        dangerouslySetInnerHTML={{
          __html: description.replace(
            /(\d+ pontos!|\d+ points!|\d+ puntos!)/i,
            '<span class="text-accent font-bold">$1</span>'
          ),
        }}
      />

      {isLocked && (
        <div className="glass rounded-xl p-4 flex items-center gap-3 border border-accent/30">
          <Lock className="w-5 h-5 text-accent shrink-0" />
          <p className="text-sm text-muted-foreground">
            {t('extras.cupStarted')}
          </p>
        </div>
      )}

      {prediction && (
        <div className="glass rounded-xl p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">{t('extras.currentPrediction')}</p>
          <div className="flex items-center gap-3">
            {(prediction as any).teams?.flag_url && (
              <img src={(prediction as any).teams.flag_url} alt="" className="w-8 h-6 rounded-sm" />
            )}
            <div>
              <span className="text-lg font-display font-bold text-foreground">
                {prediction.player_name}
              </span>
              <p className="text-xs text-muted-foreground">
                {(prediction as any).teams?.name ? tn((prediction as any).teams.name, (prediction as any).teams?.fifa_code) : ''}
              </p>
            </div>
            <div className="ml-auto">{icon}</div>
          </div>
        </div>
      )}

      {!isLocked && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm text-foreground font-medium">{t('extras.selectTeam')}</label>
            {selectedTeam ? (
              <button
                onClick={() => {
                  setSelectedTeamId(null);
                  setPlayerName('');
                  setPlayerSearch('');
                  setShowTeamPicker(true);
                  setShowPlayerPicker(false);
                }}
                className="w-full glass rounded-xl px-4 py-3 flex items-center gap-3 ring-1 ring-primary"
              >
                {selectedTeam.flag_url && (
                  <img src={selectedTeam.flag_url} alt="" className="w-6 h-4 rounded-sm" />
                )}
                <span className="text-sm text-foreground font-medium">{tn(selectedTeam.name, selectedTeam.fifa_code)}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{t('extras.change')}</span>
              </button>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t('extras.searchTeam')}
                    value={teamSearch}
                    onChange={e => {
                      setTeamSearch(e.target.value);
                      setShowTeamPicker(true);
                    }}
                    onFocus={() => setShowTeamPicker(true)}
                    className="w-full glass rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {showTeamPicker && (
                  <div className="space-y-1 max-h-[30vh] overflow-y-auto">
                    {filteredTeams.map(team => (
                      <button
                        key={team.id}
                        onClick={() => {
                          setSelectedTeamId(team.id);
                          setShowTeamPicker(false);
                          setTeamSearch('');
                          setPlayerName('');
                          setPlayerSearch('');
                          setShowPlayerPicker(false);
                        }}
                        className="w-full glass rounded-xl px-4 py-2.5 flex items-center gap-3 transition-all hover:ring-1 hover:ring-primary"
                      >
                        {team.flag_url && (
                          <img src={team.flag_url} alt="" className="w-6 h-4 rounded-sm" />
                        )}
                        <span className="text-sm text-foreground">{tn(team.name, team.fifa_code)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {selectedTeamId && (
            <div className="space-y-2">
              <label className="text-sm text-foreground font-medium">{t('extras.selectPlayer')}</label>

              {playersLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : hasPlayers ? (
                <>
                  {playerName ? (
                    <button
                      onClick={() => {
                        setPlayerName('');
                        setPlayerSearch('');
                        setShowPlayerPicker(true);
                      }}
                      className="w-full glass rounded-xl px-4 py-3 flex items-center gap-3 ring-1 ring-primary"
                    >
                      <span className="text-sm text-foreground font-medium">{playerName}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{t('extras.change')}</span>
                    </button>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder={t('extras.searchPlayer')}
                          value={playerSearch}
                          onChange={e => {
                            setPlayerSearch(e.target.value);
                            setShowPlayerPicker(true);
                          }}
                          onFocus={() => setShowPlayerPicker(true)}
                          className="w-full glass rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      {showPlayerPicker && (
                        <div className="space-y-1 max-h-[30vh] overflow-y-auto">
                          {filteredPlayers.length > 0 ? (
                            filteredPlayers.map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setPlayerName(p.name);
                                  setShowPlayerPicker(false);
                                  setPlayerSearch('');
                                }}
                                className="w-full glass rounded-xl px-4 py-2.5 flex items-center gap-3 transition-all hover:ring-1 hover:ring-primary"
                              >
                                <span className="text-sm text-foreground">{p.name}</span>
                                {p.position && (
                                  <span className="text-[10px] text-muted-foreground ml-auto">
                                    {p.position}
                                  </span>
                                )}
                              </button>
                            ))
                          ) : (
                            <p className="text-xs text-muted-foreground text-center py-3">
                              {t('extras.noPlayerFound')}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder={t('extras.typePlayerName')}
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    className="w-full glass rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    {t('extras.squadNotAvailable')}
                  </p>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || !playerName.trim() || !selectedTeamId}
            className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t('extras.confirm', { title })
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
