import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface NotificationBannerProps {
  onAccept: () => void;
}

const DISMISSED_KEY = 'push_banner_dismissed';

export function NotificationBanner({ onAccept }: NotificationBannerProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  useState(() => {
    if (!('Notification' in window) || !('PushManager' in window)) return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(DISMISSED_KEY) === '1') return;
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }
    setVisible(true);
  });

  if (!visible) return null;

  const handleAccept = () => {
    setVisible(false);
    onAccept();
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="mx-auto max-w-lg mb-3 animate-in slide-in-from-top-2 duration-300">
      <div className="rounded-xl border border-primary/20 bg-card/80 backdrop-blur-sm p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">
              {t('notifications.bannerTitle')}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t('notifications.bannerDescription')}
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAccept} className="text-xs h-8">
                {t('notifications.activate')}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-xs h-8 text-muted-foreground">
                {t('notifications.notNow')}
              </Button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
