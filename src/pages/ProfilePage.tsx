import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LogOut, User, Wallet, Loader2, Check, Bell, BellOff, ChevronDown, BookOpen } from 'lucide-react';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [pixKey, setPixKey] = useState('');
  const { subscribe } = usePushSubscription();
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied' | 'default'>('unknown');

  useEffect(() => {
    if ('Notification' in window) {
      setNotifStatus(Notification.permission as any);
    }
  }, []);

  const handleEnableNotifications = useCallback(async () => {
    localStorage.removeItem('push_banner_dismissed');
    await subscribe();
    if ('Notification' in window) {
      setNotifStatus(Notification.permission as any);
    }
    if (Notification.permission === 'granted') {
      toast.success('Notificações ativadas!');
    } else if (Notification.permission === 'denied') {
      toast.error('Notificações bloqueadas pelo navegador. Desbloqueie nas configurações do navegador.');
    }
  }, [subscribe]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('pix_key')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.pix_key != null) setPixKey(profile.pix_key);
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (pix: string) => {
      const trimmed = pix.trim() || null;
      const { error } = await supabase
        .from('profiles')
        .update({ pix_key: trimmed } as any)
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Chave PIX salva!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <User className="w-5 h-5 text-primary" /> Perfil
      </h1>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-pitch flex items-center justify-center">
            <User className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-foreground font-medium">
              {user?.user_metadata?.display_name ?? user?.email?.split('@')[0]}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Regras de Pontuação */}
      <Collapsible>
        <div className="glass rounded-2xl p-5">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              <h2 className="text-sm font-display font-bold text-foreground">Regras de Pontuação</h2>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4 text-sm">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">⚽ Palpites por Jogo</h3>
              <div className="space-y-1.5">
                {[
                  { label: 'Placar exato', points: 25, example: 'Palpite 2×1, Real 2×1' },
                  { label: 'Vencedor + gols do vencedor', points: 18, example: 'Palpite 3×1, Real 3×0' },
                  { label: 'Vencedor + gols do perdedor', points: 12, example: 'Palpite 2×1, Real 3×1' },
                  { label: 'Apenas resultado certo', points: 10, example: 'Palpite 1×0, Real 2×0' },
                  { label: 'Empate (não exato)', points: 10, example: 'Palpite 1×1, Real 0×0' },
                  { label: 'Errou', points: 0, example: 'Palpite 1×0, Real 0×1' },
                ].map(r => (
                  <div key={r.label} className="flex items-start justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium">{r.label}</p>
                      <p className="text-[11px] text-muted-foreground">{r.example}</p>
                    </div>
                    <span className="text-primary font-bold whitespace-nowrap">{r.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">🏆 Palpites Extras</h3>
              <div className="space-y-1.5">
                {[
                  { label: 'Campeão', points: 100 },
                  { label: 'Artilheiro', points: 50 },
                  { label: 'MVP', points: 50 },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-foreground">{r.label}</span>
                    <span className="text-primary font-bold">{r.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">📋 Regras Gerais</h3>
              <ul className="space-y-1 text-muted-foreground text-xs list-disc pl-4">
                <li>Apostas são bloqueadas no horário de início de cada jogo.</li>
                <li>Palpites de campeão, artilheiro e MVP são bloqueados após o início do primeiro jogo da Copa.</li>
                <li>No mata-mata, considere o placar do tempo regulamentar + prorrogação (sem pênaltis).</li>
              </ul>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* PIX */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-accent" />
          <h2 className="text-sm font-display font-bold text-foreground">Chave PIX</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Insira sua chave PIX para receber premiações. Pode ser CPF, e-mail, telefone ou chave aleatória.
        </p>
        <div className="flex gap-2">
          <Input
            value={pixKey}
            onChange={e => setPixKey(e.target.value)}
            placeholder="Sua chave PIX"
            maxLength={100}
            className="flex-1 bg-secondary border-border text-foreground"
          />
          <Button
            onClick={() => saveMutation.mutate(pixKey)}
            disabled={saveMutation.isPending || isLoading}
            size="icon"
            className="gradient-pitch text-primary-foreground shrink-0"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Notificações */}
      {'Notification' in window && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            {notifStatus === 'granted' ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <h2 className="text-sm font-display font-bold text-foreground">Notificações</h2>
          </div>
          {notifStatus === 'granted' ? (
            <p className="text-xs text-muted-foreground">
              ✅ Notificações ativadas. Você será avisado antes dos jogos e sobre palpites pendentes.
            </p>
          ) : notifStatus === 'denied' ? (
            <p className="text-xs text-muted-foreground">
              🚫 Notificações bloqueadas. Para reativar, acesse as configurações do seu navegador e permita notificações para este site.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Ative as notificações para receber alertas antes dos jogos e lembretes de palpites pendentes.
              </p>
              <Button onClick={handleEnableNotifications} size="sm" className="text-xs">
                <Bell className="w-4 h-4 mr-1" />
                Ativar notificações
              </Button>
            </div>
          )}
        </div>
      )}

      <Button
        onClick={signOut}
        variant="outline"
        className="w-full border-border text-foreground hover:bg-secondary"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair da conta
      </Button>
    </div>
  );
}
