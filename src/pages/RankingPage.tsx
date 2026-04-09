import { forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { useRanking } from '@/hooks/useRanking';
import { useGroupRanking } from '@/hooks/useGroupRanking';
import { useRoundRanking } from '@/hooks/useRoundRanking';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trophy, Medal, Search, X, MapPin } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import CustomRankingsTab from '@/components/ranking/CustomRankingsTab';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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

const RankingList = forwardRef<HTMLDivElement, { ranking: any[] | undefined; userId: string | undefined; showField: 'points_total' | 'group_points' | 'round_points'; t: any; extrasRevealed: boolean }>(({ ranking, userId, showField, t, extrasRevealed }, ref) => {
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
                    🏆 <img src={entry.champion_flag_url} alt={entry.champion_team_name ?? ''} loading="lazy" className="w-4 h-3 rounded-sm" />
                  </span>
                )}
                {(extrasRevealed || isMe) && entry.top_scorer_name && (
                  <span className="flex items-center gap-1" title={`${t('extras.topScorer')}: ${entry.top_scorer_name}`}>
                    ⚽ {entry.top_scorer_flag_url && <img src={entry.top_scorer_flag_url} alt="" loading="lazy" className="w-4 h-3 rounded-sm" />}
                    <span className="truncate max-w-[60px]">{entry.top_scorer_name}</span>
                  </span>
                )}
                {(extrasRevealed || isMe) && entry.mvp_name && (
                  <span className="flex items-center gap-1" title={`${t('extras.mvp')}: ${entry.mvp_name}`}>
                    ⭐ {entry.mvp_flag_url && <img src={entry.mvp_flag_url} alt="" loading="lazy" className="w-4 h-3 rounded-sm" />}
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

const RankingPage = forwardRef<HTMLDivElement>(function RankingPage(_props, ref) {
  const [activeTab, setActiveTab] = useState('geral');
  const { data: ranking, isLoading } = useRanking();
  const { data: groupRanking, isLoading: groupLoading } = useGroupRanking(activeTab === 'grupos');
  const { data: round1, isLoading: r1Loading } = useRoundRanking('round1', activeTab === 'round1');
  const { data: round2, isLoading: r2Loading } = useRoundRanking('round2', activeTab === 'round2');
  const { data: round3, isLoading: r3Loading } = useRoundRanking('round3', activeTab === 'round3');
  const { data: knockout, isLoading: koLoading } = useRoundRanking('knockout', activeTab === 'knockout');
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: extrasRevealed = false } = useExtrasRevealed();

  const mergeExtras = (entries: any[] | undefined) =>
    entries?.map(e => {
      const general = ranking?.find(r => r.user_id === e.user_id);
      return {
        ...e,
        champion_team_name: general?.champion_team_name,
        champion_flag_url: general?.champion_flag_url,
        top_scorer_name: general?.top_scorer_name,
        top_scorer_flag_url: general?.top_scorer_flag_url,
        mvp_name: general?.mvp_name,
        mvp_flag_url: general?.mvp_flag_url,
      };
    });

  if (isLoading) {
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="flex w-max bg-secondary gap-1 p-1">
            <TabsTrigger value="geral" className="flex-shrink-0 text-xs">{t('ranking.general')}</TabsTrigger>
            <TabsTrigger value="grupos" className="flex-shrink-0 text-xs">{t('ranking.groupStage')}</TabsTrigger>
            <TabsTrigger value="round1" className="flex-shrink-0 text-xs">{t('ranking.round1')}</TabsTrigger>
            <TabsTrigger value="round2" className="flex-shrink-0 text-xs">{t('ranking.round2')}</TabsTrigger>
            <TabsTrigger value="round3" className="flex-shrink-0 text-xs">{t('ranking.round3')}</TabsTrigger>
            <TabsTrigger value="knockout" className="flex-shrink-0 text-xs">{t('ranking.knockout')}</TabsTrigger>
            <TabsTrigger value="custom" className="flex-shrink-0 text-xs">⭐ {t('ranking.myRankings')}</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="geral" className="mt-4">
          <RankingList ranking={ranking} userId={user?.id} showField="points_total" t={t} extrasRevealed={extrasRevealed} />
        </TabsContent>
        <TabsContent value="grupos" className="mt-4">
          {groupLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> :
            <RankingList ranking={mergeExtras(groupRanking)} userId={user?.id} showField="group_points" t={t} extrasRevealed={extrasRevealed} />}
        </TabsContent>
        <TabsContent value="round1" className="mt-4">
          {r1Loading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> :
            <RankingList ranking={mergeExtras(round1)} userId={user?.id} showField="round_points" t={t} extrasRevealed={extrasRevealed} />}
        </TabsContent>
        <TabsContent value="round2" className="mt-4">
          {r2Loading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> :
            <RankingList ranking={mergeExtras(round2)} userId={user?.id} showField="round_points" t={t} extrasRevealed={extrasRevealed} />}
        </TabsContent>
        <TabsContent value="round3" className="mt-4">
          {r3Loading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> :
            <RankingList ranking={mergeExtras(round3)} userId={user?.id} showField="round_points" t={t} extrasRevealed={extrasRevealed} />}
        </TabsContent>
        <TabsContent value="knockout" className="mt-4">
          {koLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> :
            <RankingList ranking={mergeExtras(knockout)} userId={user?.id} showField="round_points" t={t} extrasRevealed={extrasRevealed} />}
        </TabsContent>
        <TabsContent value="custom" className="mt-4">
          <CustomRankingsTab extrasRevealed={extrasRevealed} />
        </TabsContent>
      </Tabs>
    </div>
  );
});
RankingPage.displayName = 'RankingPage';
export default RankingPage;
