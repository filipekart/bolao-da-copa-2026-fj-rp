import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, User, Wallet, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [pixKey, setPixKey] = useState('');

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
