import { useState } from 'react';
import { Star, Trophy, Target, Award } from 'lucide-react';
import ChampionTab from '@/components/extras/ChampionTab';
import PlayerPredictionTab from '@/components/extras/PlayerPredictionTab';

const SUB_TABS = [
  { key: 'champion', label: 'Campeão', icon: Trophy },
  { key: 'top_scorer', label: 'Artilheiro', icon: Target },
  { key: 'mvp', label: 'MVP', icon: Award },
] as const;

type TabKey = (typeof SUB_TABS)[number]['key'];

export default function ExtrasPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('champion');

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <Star className="w-5 h-5 text-accent" /> Extras
      </h1>

      {/* Sub-tabs */}
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
          title="Artilheiro"
          description="Escolha quem será o artilheiro da Copa 2026. Vale 50 pontos!"
          icon={<Target className="w-5 h-5 text-accent" />}
        />
      )}
      {activeTab === 'mvp' && (
        <PlayerPredictionTab
          category="mvp"
          title="MVP"
          description="Escolha quem será o melhor jogador (MVP) da Copa 2026. Vale 50 pontos!"
          icon={<Award className="w-5 h-5 text-accent" />}
        />
      )}
    </div>
  );
}
