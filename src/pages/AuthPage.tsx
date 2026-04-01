import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Informe seu email');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Email de redefinição enviado! Verifique sua caixa de entrada.');
      setIsForgot(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        const trimmed = displayName.trim();
        if (!trimmed) {
          toast.error('Informe seu nome');
          setLoading(false);
          return;
        }
        const nameRegex = /^[a-zA-ZÀ-ÿ0-9 ]+$/;
        if (!nameRegex.test(trimmed)) {
          toast.error('O nome não pode conter caracteres especiais');
          setLoading(false);
          return;
        }
        try {
          await signUp(email, password, trimmed);
        } catch (signUpErr: unknown) {
          const msg = signUpErr instanceof Error ? signUpErr.message : '';
          if (msg.includes('profiles_display_name_unique') || msg.includes('duplicate key')) {
            toast.error('Este nome já está em uso. Escolha outro.');
            setLoading(false);
            return;
          }
          throw signUpErr;
        }
        toast.success('Conta criada! Verifique seu email.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        toast.error('Email ou senha incorretos. Verifique seus dados e tente novamente.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-pitch flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Bolão Copa 2026</h1>
          <p className="text-muted-foreground text-sm mt-1">Faça seus palpites e dispute com amigos</p>
        </div>

        <div className="glass rounded-2xl p-6">
          {isForgot ? (
            <>
              <button
                onClick={() => setIsForgot(false)}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar ao login
              </button>
              <h2 className="text-lg font-display font-bold text-foreground mb-1">Esqueci minha senha</h2>
              <p className="text-sm text-muted-foreground mb-4">Informe seu email para receber o link de redefinição.</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
                >
                  {loading ? 'Enviando...' : 'Enviar link de redefinição'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex gap-1 mb-6 p-1 bg-secondary rounded-xl">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    isLogin ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    !isLogin ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  Cadastrar
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground text-sm">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Nome e Sobrenome"
                        className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground text-sm">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgot(true)}
                      className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
                >
                  {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
