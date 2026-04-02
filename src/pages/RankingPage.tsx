import { forwardRef, useState, useRef, useEffect } from 'react';
import { useRanking } from '@/hooks/useRanking';
import { useGroupRanking } from '@/hooks/useGroupRanking';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trophy, Medal, Search, X, MapPin } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';

function useExtrasRevealed() {
  return useQuery({
    queryKey: ['first-match-kickoff'],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select('kickoff_at')
        .order('kickoff_at', { ascending: true })
        .limit(1)
        .single();
      return data?.kickoff_at ?? null;
    },
    select: (kickoff) => kickoff ? new Date(kickoff) <= new Date() : false,
  });
}

const RankingList = forwardRef<HTMLDivElement, { ranking: any[] | undefined; userId: string | undefined; showField: 'points_total' | 'group_points'; t: any; extrasRevealed: boolean }>(({ ranking, userId, showField, t, extrasRevealed }, ref) => {
  const [search, setSearch] = useState('');
  const highlightRef = useRef<HTMLDivElement>(null);
  const myRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (search && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [search]);

  if (!ranking?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{t('ranking.noParticipants')}</p>
      </div>
    );
  }

  const sorted = [...ranking].sort((a, b) => (b[showField] ?? 0) - (a[showField] ?? 0));
  const searchLower = search.toLowerCase().trim();
  const matchedId = searchLower
    ? sorted.find(e => e.display_name?.toLowerCase().includes(searchLower))?.user_id
    : null;

  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('ranking.searchPlaceholder')}
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {userId && (
          <button
            onClick={() => {
              setSearch('');
              setTimeout(() => myRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            title={t('ranking.findMe')}
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">{t('ranking.findMe')}</span>
          </button>
        )}
      </div>
      {sorted.map((entry, idx) => {
        const isMe = entry.user_id === userId;
        const isHighlighted = entry.user_id === matchedId;
        const position = idx + 1;
        const points = entry[showField] ?? 0;
        const nameMatch = searchLower && entry.display_name?.toLowerCase().includes(searchLower);
        return (
          <div
            key={entry.user_id}
            ref={isHighlighted ? highlightRef : isMe ? myRef : undefined}
            className={`glass rounded-xl p-4 flex items-center gap-3 transition-all ${isMe ? 'ring-1 ring-primary' : ''} ${isHighlighted ? 'ring-2 ring-accent shadow-lg' : ''} ${searchLower && !nameMatch ? 'opacity-40' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm ${
              position === 1 ? 'gradient-gold text-accent-foreground' :
              position === 2 ? 'bg-muted text-foreground' :
              position === 3 ? 'bg-secondary text-accent' :
              'bg-secondary text-muted-foreground'
            }`}>
              {position}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {entry.display_name}
                {isMe && <span className="text-primary ml-1">{t('ranking.you')}</span>}
              </p>
              <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 items-center flex-wrap">
                <span>{t('ranking.matches')}: {showField === 'points_total' ? entry.points_matches : points}</span>
                <span>{t('ranking.exact')}: {entry.exact_hits ?? 0}</span>
                {(extrasRevealed || isMe) && entry.champion_flag_url && (
                  <span className="flex items-center gap-1" title={`${t('extras.champion')}: ${entry.champion_team_name}`}>
                    🏆 <img src={entry.champion_flag_url} alt={entry.champion_team_name ?? ''} className="w-4 h-3 rounded-sm" />
                  </span>
                )}
                {(extrasRevealed || isMe) && entry.top_scorer_name && (
                  <span className="flex items-center gap-1" title={`${t('extras.topScorer')}: ${entry.top_scorer_name}`}>
                    ⚽ {entry.top_scorer_flag_url && <img src={entry.top_scorer_flag_url} alt="" className="w-4 h-3 rounded-sm" />}
                    <span className="truncate max-w-[60px]">{entry.top_scorer_name}</span>
                  </span>
                )}
                {(extrasRevealed || isMe) && entry.mvp_name && (
                  <span className="flex items-center gap-1" title={`${t('extras.mvp')}: ${entry.mvp_name}`}>
                    ⭐ {entry.mvp_flag_url && <img src={entry.mvp_flag_url} alt="" className="w-4 h-3 rounded-sm" />}
                    <span className="truncate max-w-[60px]">{entry.mvp_name}</span>
                  </span>
                )}
              </div>
            </div>

            <span className="text-lg font-display font-bold text-gradient-gold">
              {points}
            </span>
          </div>
        );
      })}
    </div>
  );
});

RankingList.displayName = 'RankingList';

export default function RankingPage() {
  const { data: ranking, isLoading } = useRanking();
  const { data: groupRanking, isLoading: groupLoading } = useGroupRanking();
  const { user } = useAuth();
  const { t } = useTranslation();

  const mergedGroupRanking = groupRanking?.map(gr => {
    const general = ranking?.find(r => r.user_id === gr.user_id);
    return {
      ...gr,
      champion_team_name: general?.champion_team_name,
      champion_flag_url: general?.champion_flag_url,
      top_scorer_name: general?.top_scorer_name,
      top_scorer_flag_url: general?.top_scorer_flag_url,
      mvp_name: general?.mvp_name,
      mvp_flag_url: general?.mvp_flag_url,
    };
  });

  const loading = isLoading || groupLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <Medal className="w-5 h-5 text-accent" /> {t('ranking.title')}
      </h1>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="geral">{t('ranking.general')}</TabsTrigger>
          <TabsTrigger value="grupos">{t('ranking.groupStage')}</TabsTrigger>
        </TabsList>
        <TabsContent value="geral" className="mt-4">
          <RankingList ranking={ranking} userId={user?.id} showField="points_total" t={t} />
        </TabsContent>
        <TabsContent value="grupos" className="mt-4">
          <RankingList ranking={mergedGroupRanking} userId={user?.id} showField="group_points" t={t} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
