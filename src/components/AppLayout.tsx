import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, History, Swords, Medal, User, Shield, Star } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useMatchReminders } from '@/hooks/useMatchReminders';
import { usePushSubscription } from '@/hooks/usePushSubscription';

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();
  useMatchReminders();
  usePushSubscription();

  const tabs = [
    { path: '/', icon: Home, label: 'Jogos' },
    { path: '/bets', icon: History, label: 'Palpites' },
    { path: '/knockout', icon: Swords, label: '2ª Fase' },
    { path: '/extras', icon: Star, label: 'Extras' },
    { path: '/ranking', icon: Medal, label: 'Ranking' },
    { path: '/profile', icon: User, label: 'Perfil' },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen gradient-dark flex flex-col">
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-24">
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
