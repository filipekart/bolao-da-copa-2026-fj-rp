import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, History, Swords, Medal, User, Shield, Star, Trophy } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useMatchReminders } from '@/hooks/useMatchReminders';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { NotificationBanner } from '@/components/NotificationBanner';
import { InstallBanner } from '@/components/InstallBanner';
import { useTranslation } from 'react-i18next';

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
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
      <div className="max-w-lg mx-auto w-full px-4 pt-12">
        <InstallBanner />
        <NotificationBanner onAccept={subscribe} />
      </div>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {tabs.map(tab => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
