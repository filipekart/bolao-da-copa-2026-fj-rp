import { useMatches } from '@/hooks/useMatches';
import { useTeams } from '@/hooks/useTeams';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Swords, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Database } from '@/integrations/supabase/types';

type KnockoutStage = Database['public']['Enums']['knockout_stage'];

const stages: { key: KnockoutStage; label: string; points: number }[] = [
  { key: 'ROUND_OF_16', label: 'Oitavas de Final', points: 8 },
  { key: 'QUARTER_FINAL', label: 'Quartas de Final', points: 10 },
  { key: 'SEMI_FINAL', label: 'Semifinal', points: 12 },
  { key: 'FINAL', label: 'Final', points: 25 },
  { key: 'CHAMPION', label: 'Campeão', points: 50 },
];

export default function KnockoutPage() {
  const { user } = useAuth();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = useState<KnockoutStage>('ROUND_OF_16');
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const { data: myKnockoutPredictions, isLoading: predsLoading } = useQuery({
    queryKey: ['knockout-predictions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knockout_predictions')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: knockoutResults } = useQuery({
    queryKey: ['knockout-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knockout_results')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const savePrediction = useMutation({
    mutationFn: async ({ stage, teamId }: { stage: KnockoutStage; teamId: string }) => {
      const { error } = await supabase
        .from('knockout_predictions')
        .insert({ user_id: user!.id, stage, team_id: teamId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knockout-predictions'] });
      toast.success('Palpite salvo!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removePrediction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knockout_predictions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knockout-predictions'] });
    },
  });

  if (teamsLoading || predsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const stagePredictions = myKnockoutPredictions?.filter(p => p.stage === selectedStage) ?? [];
  const stageResults = knockoutResults?.filter(r => r.stage === selectedStage) ?? [];

  const isTeamCorrect = (teamId: string) => {
    return stageResults.some(r => r.team_id === teamId);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <Swords className="w-5 h-5 text-accent" /> Mata-mata
      </h1>

      {/* Stage tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {stages.map(s => (
          <button
            key={s.key}
            onClick={() => setSelectedStage(s.key)}
            className={`whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              selectedStage === s.key
                ? 'gradient-pitch text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {s.label} ({s.points}pts)
          </button>
        ))}
      </div>

      {/* Selected predictions */}
      {stagePredictions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Seus palpites</h3>
          {stagePredictions.map(p => {
            const team = teams?.find(t => t.id === p.team_id);
            const correct = stageResults.length > 0 ? isTeamCorrect(p.team_id) : null;
            return (
              <div key={p.id} className="glass rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {team?.flag_url && <img src={team.flag_url} alt="" className="w-5 h-4 rounded-sm" />}
                  <span className="text-sm text-foreground">{team?.name}</span>
                  {correct === true && <Check className="w-4 h-4 text-primary" />}
                  {correct === false && <X className="w-4 h-4 text-destructive" />}
                </div>
                <button
                  onClick={() => removePrediction.mutate(p.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Team selector */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Selecionar time</h3>
        <div className="grid grid-cols-2 gap-2">
          {teams?.map(team => {
            const alreadyPicked = stagePredictions.some(p => p.team_id === team.id);
            return (
              <button
                key={team.id}
                disabled={alreadyPicked}
                onClick={() => savePrediction.mutate({ stage: selectedStage, teamId: team.id })}
                className={`glass rounded-lg p-3 flex items-center gap-2 text-left text-sm ${
                  alreadyPicked ? 'opacity-40' : 'hover:ring-1 hover:ring-primary'
                }`}
              >
                {team.flag_url && <img src={team.flag_url} alt="" className="w-5 h-4 rounded-sm" />}
                <span className="text-foreground truncate">{team.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
