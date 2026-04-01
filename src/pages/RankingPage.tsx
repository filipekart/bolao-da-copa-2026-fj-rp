import { forwardRef } from 'react';
import { useRanking } from '@/hooks/useRanking';
import { useGroupRanking } from '@/hooks/useGroupRanking';
import { useAuth } from '@/lib/auth';
import { Loader2, Trophy, Medal } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const RankingList = forwardRef<HTMLDivElement, { ranking: any[] | undefined; userId: string | undefined; showField: 'points_total' | 'group_points' }>(({ ranking, userId, showField }, ref) => {
  if (!ranking?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Nenhum participante no ranking ainda.</p>
      </div>
    );
  }

  const sorted = [...ranking].sort((a, b) => (b[showField] ?? 0) - (a[showField] ?? 0));

  return (
    <div className="space-y-2">
      {sorted.map((entry, idx) => {
        const isMe = entry.user_id === userId;
        const position = idx + 1;
        const points = entry[showField] ?? 0;
        return (
          <div
            key={entry.user_id}
            className={`glass rounded-xl p-4 flex items-center gap-3 ${isMe ? 'ring-1 ring-primary' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm ${
              position === 1 ? 'gradient-gold text-accent-foreground' :
              position === 2 ? 'bg-muted text-foreground' :
              position === 3 ? 'bg-secondary text-accent' :
              'bg-secondary text-muted-foreground'
            }`}>
              {position}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {entry.display_name}
                {isMe && <span className="text-primary ml-1">(você)</span>}
              </p>
              <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 items-center flex-wrap">
                <span>Jogos: {showField === 'points_total' ? entry.points_matches : points}</span>
                <span>Exatos: {entry.exact_hits ?? 0}</span>
                {entry.champion_flag_url && (
                  <span className="flex items-center gap-1" title={`Campeão: ${entry.champion_team_name}`}>
                    🏆 <img src={entry.champion_flag_url} alt={entry.champion_team_name ?? ''} className="w-4 h-3 rounded-sm" />
                  </span>
                )}
                {entry.top_scorer_name && (
                  <span className="flex items-center gap-1" title={`Artilheiro: ${entry.top_scorer_name}`}>
                    ⚽ {entry.top_scorer_flag_url && <img src={entry.top_scorer_flag_url} alt="" className="w-4 h-3 rounded-sm" />}
                    <span className="truncate max-w-[60px]">{entry.top_scorer_name}</span>
                  </span>
                )}
                {entry.mvp_name && (
                  <span className="flex items-center gap-1" title={`MVP: ${entry.mvp_name}`}>
                    ⭐ {entry.mvp_flag_url && <img src={entry.mvp_flag_url} alt="" className="w-4 h-3 rounded-sm" />}
                    <span className="truncate max-w-[60px]">{entry.mvp_name}</span>
                  </span>
                )}
              </div>
            </div>

            <span className="text-lg font-display font-bold text-gradient-gold">
              {points}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function RankingPage() {
  const { data: ranking, isLoading } = useRanking();
  const { data: groupRanking, isLoading: groupLoading } = useGroupRanking();
  const { user } = useAuth();

  // Merge group ranking data with extras from general ranking
  const mergedGroupRanking = groupRanking?.map(gr => {
    const general = ranking?.find(r => r.user_id === gr.user_id);
    return {
      ...gr,
      champion_team_name: general?.champion_team_name,
      champion_flag_url: general?.champion_flag_url,
      top_scorer_name: general?.top_scorer_name,
      top_scorer_flag_url: general?.top_scorer_flag_url,
      mvp_name: general?.mvp_name,
      mvp_flag_url: general?.mvp_flag_url,
    };
  });

  const loading = isLoading || groupLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <Medal className="w-5 h-5 text-accent" /> Ranking
      </h1>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="grupos">Fase de Grupos</TabsTrigger>
        </TabsList>
        <TabsContent value="geral" className="mt-4">
          <RankingList ranking={ranking} userId={user?.id} showField="points_total" />
        </TabsContent>
        <TabsContent value="grupos" className="mt-4">
          <RankingList ranking={mergedGroupRanking} userId={user?.id} showField="group_points" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
