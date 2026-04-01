import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trophy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const type = params.get('type');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error && type === 'recovery') {
          setIsRecovery(true);
        }
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error(t('reset.passwordsMismatch'));
      return;
    }
    if (password.length < 6) {
      toast.error(t('reset.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t('reset.success'));
      navigate('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('reset.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-sm text-center space-y-4">
          <Trophy className="w-12 h-12 text-primary mx-auto" />
          <h2 className="text-lg font-display font-bold text-foreground">{t('reset.invalidLink')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('reset.linkExpired')}
          </p>
          <button onClick={() => navigate('/auth')} className="text-sm text-primary underline">
            {t('reset.backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-pitch flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">{t('reset.title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('reset.subtitle')}</p>
          <div className="mt-3">
            <LanguageSelector variant="compact" />
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground text-sm">{t('reset.newPassword')}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground text-sm">{t('reset.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
            >
              {loading ? t('reset.loading') : t('reset.submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
