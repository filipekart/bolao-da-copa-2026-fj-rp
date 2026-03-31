import { useRanking } from '@/hooks/useRanking';
import { useAuth } from '@/lib/auth';
import { Loader2, Trophy, Medal } from 'lucide-react';

export default function RankingPage() {
  const { data: ranking, isLoading } = useRanking();
  const { user } = useAuth();

  if (isLoading) {
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

      {!ranking?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum participante no ranking ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ranking.map((entry, idx) => {
            const isMe = entry.user_id === user?.id;
            const position = idx + 1;
            return (
              <div
                key={entry.user_id}
                className={`glass rounded-xl p-4 flex items-center gap-3 ${
                  isMe ? 'ring-1 ring-primary' : ''
                }`}
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
                  <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                    <span>Jogos: {entry.points_matches}</span>
                    <span>Campeão: {entry.points_knockout}</span>
                    <span>Exatos: {entry.exact_hits}</span>
                  </div>
                </div>

                <span className="text-lg font-display font-bold text-gradient-gold">
                  {entry.points_total}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
