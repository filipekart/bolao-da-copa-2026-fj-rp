import { useState } from 'react';
import { Star, Trophy, Target, Award } from 'lucide-react';
import ChampionTab from '@/components/extras/ChampionTab';
import PlayerPredictionTab from '@/components/extras/PlayerPredictionTab';
import { useTranslation } from 'react-i18next';

export default function ExtrasPage() {
  const { t } = useTranslation();

  const SUB_TABS = [
    { key: 'champion' as const, label: t('extras.champion'), icon: Trophy },
    { key: 'top_scorer' as const, label: t('extras.topScorer'), icon: Target },
    { key: 'mvp' as const, label: t('extras.mvp'), icon: Award },
  ];

  const [activeTab, setActiveTab] = useState<'champion' | 'top_scorer' | 'mvp'>('champion');

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <Star className="w-5 h-5 text-accent" /> {t('extras.title')}
      </h1>

      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        {SUB_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab.key
                ? 'gradient-pitch text-primary-foreground'
                : 'text-muted-foreground'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'champion' && <ChampionTab />}
      {activeTab === 'top_scorer' && (
        <PlayerPredictionTab
          category="top_scorer"
          title={t('extras.topScorer')}
          description={t('extras.topScorerDesc')}
          icon={<Target className="w-5 h-5 text-accent" />}
        />
      )}
      {activeTab === 'mvp' && (
        <PlayerPredictionTab
          category="mvp"
          title={t('extras.mvp')}
          description={t('extras.mvpDesc')}
          icon={<Award className="w-5 h-5 text-accent" />}
        />
      )}
    </div>
  );
}
