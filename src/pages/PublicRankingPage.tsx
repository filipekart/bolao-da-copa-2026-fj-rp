import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Medal } from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type Row = { position: number; name: string; points: number };

export default function PublicRankingPage() {
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    document.title = 'Ranking — Bolão FJ | RP';
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
  }, []);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-ranking', token],
    queryFn: async () => {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/public-ranking?token=${encodeURIComponent(token ?? '')}`,
        { headers: { apikey: SUPABASE_ANON_KEY } },
      );
      if (res.status === 401) throw new Error('invalid');
      if (!res.ok) throw new Error('error');
      return (await res.json()) as { ranking: Row[]; updated_at: string };
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: false,
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    const invalid = (error as Error)?.message === 'invalid';
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-sm text-center space-y-2">
          <h1 className="text-lg font-display font-bold text-foreground">
            {invalid ? 'Link inválido ou expirado' : 'Erro ao carregar ranking'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {invalid ? 'Solicite um novo link ao organizador.' : 'Tente novamente em instantes.'}
          </p>
        </div>
      </div>
    );
  }

  const rows = data?.ranking ?? [];
  const updated = data?.updated_at ? new Date(data.updated_at) : null;

  return (
    <div className="min-h-screen gradient-dark py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center justify-center gap-2">
            <Medal className="w-6 h-6 text-accent" /> Ranking — Bolão FJ | RP
          </h1>
          <p className="text-xs text-muted-foreground">
            Atualização automática a cada 30s
            {updated && ` • última: ${updated.toLocaleTimeString('pt-BR')}`}
          </p>
        </header>

        <div className="glass rounded-xl overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_80px] gap-2 px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
            <span>Pos.</span>
            <span>Nome</span>
            <span className="text-right">Pontos</span>
          </div>
          {rows.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">Sem participantes ainda.</p>
          )}
          {rows.map((r, idx) => (
            <div
              key={`${r.position}-${r.name}-${idx}`}
              className="grid grid-cols-[60px_1fr_80px] gap-2 px-4 py-3 items-center border-b border-border/40 last:border-b-0"
            >
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm ${
                  r.position === 1 ? 'gradient-gold text-accent-foreground' :
                  r.position === 2 ? 'bg-muted text-foreground' :
                  r.position === 3 ? 'bg-secondary text-accent' :
                  'bg-secondary text-muted-foreground'
                }`}
              >
                {r.position}
              </span>
              <span className="text-sm text-foreground truncate">{r.name}</span>
              <span className="text-right text-lg font-display font-bold text-gradient-gold">{r.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}