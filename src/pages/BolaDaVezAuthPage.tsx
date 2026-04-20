import { useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';
import heroImage from '@/assets/boladavez-hero.jpeg';

function detectInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|FB_IAB|Instagram|Line|WhatsApp|Snapchat|Twitter|TikTok|MicroMessenger|MiuiBrowser/i.test(ua);
}

function isNetworkError(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed') || m.includes('network request failed');
}

export default function BolaDaVezAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const isInApp = useMemo(() => detectInAppBrowser(), []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado!');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

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
      const msg = err instanceof Error ? err.message : t('auth.emailSendError');
      if (isNetworkError(msg)) {
        toast.error(t('auth.networkError'), { duration: 10000 });
      } else {
        toast.error(msg);
      }
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
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { display_name: trimmed, signup_source: 'boladavez' },
              emailRedirectTo: `${window.location.origin}/boladavez`,
            },
          });
          if (error) throw error;
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
      if (isNetworkError(msg)) {
        toast.error(t('auth.networkError'), { duration: 10000 });
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        toast.error(t('auth.invalidCredentials'));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-dark flex flex-col items-center p-4">
      <div className="w-full max-w-sm animate-fade-in pt-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-full rounded-2xl overflow-hidden shadow-lg mb-4 border border-border">
            <img
              src={heroImage}
              alt="Bolão Bola da Vez - Copa do Mundo 2026"
              className="w-full h-auto block"
            />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground text-center">Bolão Bola da Vez</h1>
          <p className="text-muted-foreground text-sm mt-1">by Bilhões da Virada</p>
          <div className="mt-3">
            <LanguageSelector variant="compact" />
          </div>
        </div>

        {isInApp && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-foreground flex gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
            <div className="space-y-2 flex-1">
              <p className="leading-snug">{t('auth.inAppBrowserWarning')}</p>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground underline hover:text-primary transition-colors"
              >
                <Copy className="w-3 h-3" /> Copiar link
              </button>
            </div>
          </div>
        )}

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