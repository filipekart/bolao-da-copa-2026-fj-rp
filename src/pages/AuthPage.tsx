import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Mail, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const { t } = useTranslation();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(t('auth.enterEmail'));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success(t('auth.resetEmailSent'));
      setIsForgot(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('auth.emailSendError'));
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
          toast.error(t('auth.nameRequired'));
          setLoading(false);
          return;
        }
        const nameRegex = /^[a-zA-ZÀ-ÿ0-9 ]+$/;
        if (!nameRegex.test(trimmed)) {
          toast.error(t('auth.nameInvalid'));
          setLoading(false);
          return;
        }
        try {
          await signUp(email, password, trimmed);
        } catch (signUpErr: unknown) {
          const msg = signUpErr instanceof Error ? signUpErr.message : '';
          if (msg.includes('profiles_display_name_unique') || msg.includes('duplicate key')) {
            toast.error(t('auth.nameInUse'));
            setLoading(false);
            return;
          }
          throw signUpErr;
        }
        toast.success(t('auth.accountCreated'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.authError');
      if (msg.toLowerCase().includes('invalid login credentials')) {
        toast.error(t('auth.invalidCredentials'));
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
          <img
            src="/icon-192.png"
            alt="Bolão Copa 2026 FJ | RP"
            className="w-20 h-20 rounded-2xl mb-4 shadow-lg"
          />
          <h1 className="text-2xl font-display font-bold text-foreground text-center">Bolão Copa 2026 FJ | RP</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('app.subtitle')}</p>
          <div className="mt-3">
            <LanguageSelector variant="compact" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          {isForgot ? (
            <>
              <button
                onClick={() => setIsForgot(false)}
                className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t('auth.backToLogin')}
              </button>
              <h2 className="text-lg font-display font-bold text-foreground mb-1">{t('auth.forgotTitle')}</h2>
              <p className="text-sm text-muted-foreground mb-4">{t('auth.forgotDescription')}</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground text-sm">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.emailPlaceholder')}
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
                  {loading ? t('auth.sending') : t('auth.sendResetLink')}
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
                  {t('auth.login')}
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    !isLogin ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t('auth.signup')}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground text-sm">{t('auth.name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={t('auth.namePlaceholder')}
                        className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground text-sm">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.emailPlaceholder')}
                      className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground text-sm">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsForgot(true)}
                      className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
                >
                  {loading ? t('auth.loading') : isLogin ? t('auth.login') : t('auth.createAccount')}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
