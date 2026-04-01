import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'pt', label: '🇧🇷 PT', full: 'Português' },
  { code: 'en', label: '🇺🇸 EN', full: 'English' },
  { code: 'es', label: '🇪🇸 ES', full: 'Español' },
];

export function LanguageSelector({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  const { i18n } = useTranslation();

  if (variant === 'full') {
    return (
      <div className="flex gap-2">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              i18n.language?.startsWith(lang.code)
                ? 'gradient-pitch text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Globe className="w-3.5 h-3.5 text-muted-foreground" />
      {LANGUAGES.map(lang => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-all ${
            i18n.language?.startsWith(lang.code)
              ? 'text-primary font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {lang.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
