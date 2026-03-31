import { useMatches } from '@/hooks/useMatches';
import { MatchCard } from '@/components/MatchCard';
import { Trophy, Loader2 } from 'lucide-react';

export default function HomePage() {
  const { data: matches, isLoading } = useMatches();

  const now = new Date();
  const upcoming = matches?.filter(m => new Date(m.kickoff_at) > now && m.status === 'SCHEDULED') ?? [];
  const live = matches?.filter(m => m.status === 'LIVE') ?? [];
  const finished = matches?.filter(m => m.status === 'FINISHED')?.slice(-5)?.reverse() ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="gradient-pitch rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-primary-foreground" />
          <div>
            <h1 className="text-xl font-display font-bold text-primary-foreground">Copa 2026</h1>
            <p className="text-primary-foreground/80 text-sm">Faça seus palpites!</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {live.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            Ao vivo
          </h2>
          <div className="space-y-3">
            {live.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-foreground mb-3">Próximos jogos</h2>
          <div className="space-y-3">
            {upcoming.slice(0, 10).map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h2 className="text-lg font-display font-semibold text-foreground mb-3">Resultados recentes</h2>
          <div className="space-y-3">
            {finished.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        </section>
      )}

      {!isLoading && !matches?.length && (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum jogo cadastrado ainda.</p>
          <p className="text-sm mt-1">Aguarde o admin sincronizar as partidas.</p>
        </div>
      )}
    </div>
  );
}
