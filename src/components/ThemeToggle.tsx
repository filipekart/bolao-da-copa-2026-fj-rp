import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t('profile.themeLight') : t('profile.themeDark')}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl glass hover:ring-1 hover:ring-primary transition-all text-sm text-foreground ${className}`}
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-accent" />
          <span>{t('profile.themeLight')}</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-primary" />
          <span>{t('profile.themeDark')}</span>
        </>
      )}
    </button>
  );
}
