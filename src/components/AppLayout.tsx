import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, History, Swords, Medal, User, Shield, Star, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useMatchReminders } from '@/hooks/useMatchReminders';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { NotificationBanner } from '@/components/NotificationBanner';
import { InstallBanner } from '@/components/InstallBanner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTranslation } from 'react-i18next';
import { useActiveProfile } from '@/lib/activeProfile';

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const { isActingAsOther, activeDisplayName, setActiveUserId, activeUserId } = useActiveProfile();
  const { user } = useAuth();
  useMatchReminders();
  const { subscribe } = usePushSubscription();

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      subscribe();
    }
  }, [subscribe]);

  const tabs = [
    { path: '/', icon: Home, label: t('nav.games') },
    { path: '/bets', icon: History, label: t('nav.bets') },
    { path: '/knockout', icon: Swords, label: t('nav.knockout') },
    { path: '/extras', icon: Star, label: t('nav.extras') },
    { path: '/ranking', icon: Medal, label: t('nav.ranking') },
    { path: '/profile', icon: User, label: t('nav.profile') },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: t('nav.admin') }] : []),
  ];

  return (
    <div className="min-h-screen gradient-dark flex flex-col">
      <div
        className="max-w-lg mx-auto w-full px-4"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <InstallBanner />
        <NotificationBanner onAccept={subscribe} />
        {isActingAsOther && activeDisplayName && (
          <div className="flex items-center justify-between gap-2 px-4 py-2 rounded-xl bg-accent/20 border border-accent/30 mt-2">
            <span className="text-xs text-accent font-medium">
              {t('profile.actingAs', { name: activeDisplayName })}
            </span>
            <button
              onClick={() => setActiveUserId(user?.id ?? '')}
              className="text-[10px] text-accent underline font-medium"
            >
              {t('profile.backToMyProfile')}
            </button>
          </div>
        )}
      </div>
      <main
        className="flex-1 max-w-lg mx-auto w-full px-4"
        style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}
      >
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 glass border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around" style={{ height: '56px' }}>
          {tabs.map(tab => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-1 rounded-lg transition-all ${
                  isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                }`}
                style={{ paddingTop: '6px', paddingBottom: '4px', paddingLeft: '8px', paddingRight: '8px' }}
              >
                <tab.icon style={{ width: '20px', height: '20px' }} />
                <span style={{ fontSize: '10px' }} className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
