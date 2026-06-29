import { forwardRef, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRanking } from '@/hooks/useRanking';
import { useGroupRanking } from '@/hooks/useGroupRanking';
import { useRoundRanking, KnockoutSubStage } from '@/hooks/useRoundRanking';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trophy, Medal, Search, X, MapPin, ChevronDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import CustomRankingsTab from '@/components/ranking/CustomRankingsTab';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { computePositions } from '@/lib/rankingPositions';
import { useUserExactHits } from '@/hooks/useUserExactHits';
import { formatStageLabel } from '@/lib/stageLabel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Flag } from '@/components/Flag';
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

type HitFilter = (hit: any) => boolean;

function ExactHitsPanel({ targetUserId, t, filter }: { targetUserId: string; t: any; filter?: HitFilter }) {
  const { data, isLoading } = useUserExactHits(targetUserId, true);
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="w-3 h-3 animate-spin" /> {t('ranking.loadingHits')}
      </div>
    );
  }
  const filtered = (data ?? []).filter(h => (filter ? filter(h) : true));
  if (!filtered.length) {
    return <p className="text-xs text-muted-foreground py-2">{t('ranking.noExactHits')}</p>;
  }
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
  );
  return (
    <ul className="space-y-1.5">
      {sorted.map((hit) => (
        <li key={hit.match_id} className="flex items-center gap-2 text-xs">
          <span className="text-[10px] text-muted-foreground w-20 shrink-0 truncate">
            {formatStageLabel(t, hit.stage, hit.match_number)}
          </span>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {hit.home_flag_url && <Flag src={hit.home_flag_url} alt="" className="w-4 h-3 rounded-sm shrink-0" />}
            <span className="truncate">{hit.home_team_name}</span>
            <span className="font-display font-bold text-accent whitespace-nowrap">
              {hit.official_home_score} x {hit.official_away_score}
            </span>
            <span className="truncate">{hit.away_team_name}</span>
            {hit.away_flag_url && <Flag src={hit.away_flag_url} alt="" className="w-4 h-3 rounded-sm shrink-0" />}
          </div>
        </li>
      ))}
    </ul>
  );
}

const RankingList = forwardRef<HTMLDivElement, { ranking: any[] | undefined; userId: string | undefined; showField: 'points_total' | 'group_points' | 'round_points'; t: any; extrasRevealed: boolean; collapsible?: boolean; hitsFilter?: HitFilter; showExtras?: boolean }>(({ ranking, userId, showField, t, extrasRevealed, collapsible = false, hitsFilter, showExtras = true }, ref) => {
  const [search, setSearch] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const myRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(
    () => ranking?.length
      ? [...ranking].sort((a, b) => {
          const pointsDiff = (b[showField] ?? 0) - (a[showField] ?? 0);
          if (pointsDiff !== 0) return pointsDiff;
          const exactDiff = (b.exact_hits ?? 0) - (a.exact_hits ?? 0);
          if (exactDiff !== 0) return exactDiff;
          return (a.display_name ?? '').localeCompare(b.display_name ?? '', 'pt', { sensitivity: 'base' });
        })
      : [],
    [ranking, showField]
  );

  const positions = useMemo(
    () => computePositions(sorted, [showField, 'exact_hits']),
    [sorted, showField]
  );

  if (!ranking?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>{t('ranking.noParticipants')}</p>
      </div>
    );
  }
  const searchLower = search.toLowerCase().trim();
  const visible = searchLower
    ? sorted
        .map((entry, idx) => ({ entry, position: positions[idx] }))
        .filter(({ entry }) => entry.display_name?.toLowerCase().includes(searchLower))
    : sorted.map((entry, idx) => ({ entry, position: positions[idx] }));

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
      {visible.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t('ranking.noSearchResults', 'Nenhum participante encontrado')}
        </div>
      )}
      {visible.map(({ entry, position }) => {
        const isMe = entry.user_id === userId;
        const points = entry[showField] ?? 0;
        const isExpanded = collapsible && expandedUserId === entry.user_id;
        const showChampion = (extrasRevealed || isMe) && entry.champion_flag_url;

        if (collapsible) {
          return (
            <div
              key={entry.user_id}
              ref={isMe ? myRef : undefined}
              className={`glass rounded-xl transition-all ${isMe ? 'ring-1 ring-primary' : ''}`}
            >
              <button
                type="button"
                onClick={() => setExpandedUserId(isExpanded ? null : entry.user_id)}
                aria-expanded={isExpanded}
                className="w-full p-3 flex items-center gap-2 text-left"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                  position === 1 ? 'gradient-gold text-accent-foreground' :
                  position === 2 ? 'bg-muted text-foreground' :
                  position === 3 ? 'bg-secondary text-accent' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {position}
                </div>
                <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
                  {entry.display_name}
                  {isMe && <span className="text-primary ml-1">{t('ranking.you')}</span>}
                </p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground whitespace-nowrap shrink-0">
                  PE: {entry.exact_hits ?? 0}
                </span>
                <span className="text-lg font-display font-bold text-gradient-gold shrink-0 min-w-[2ch] text-right">
                  {points}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-2 animate-fade-in">
                  {showExtras && (extrasRevealed || isMe) && (showChampion || entry.top_scorer_name || entry.mvp_name) && (
                    <div className="flex flex-col gap-1 pt-2 text-xs">
                      {showChampion && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">🏆 {t('extras.champion')}:</span>
                          <Flag src={entry.champion_flag_url} alt="" className="w-4 h-3 rounded-sm" />
                          <span className="text-foreground">{entry.champion_team_name}</span>
                        </div>
                      )}
                      {entry.top_scorer_name && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">⚽ {t('extras.topScorer')}:</span>
                          {entry.top_scorer_flag_url && <Flag src={entry.top_scorer_flag_url} alt="" className="w-4 h-3 rounded-sm" />}
                          <span className="text-foreground">{entry.top_scorer_name}</span>
                        </div>
                      )}
                      {entry.mvp_name && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">⭐ {t('extras.mvp')}:</span>
                          {entry.mvp_flag_url && <Flag src={entry.mvp_flag_url} alt="" className="w-4 h-3 rounded-sm" />}
                          <span className="text-foreground">{entry.mvp_name}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pt-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
                      {t('ranking.exactHitsList')}
                    </p>
                    <ExactHitsPanel targetUserId={entry.user_id} t={t} filter={hitsFilter} />
                  </div>
                </div>
              )}
            </div>
          );
        }

        return (
          <div
            key={entry.user_id}
            ref={isMe ? myRef : undefined}
            className={`glass rounded-xl p-3 flex items-center gap-2 transition-all ${isMe ? 'ring-1 ring-primary' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0 ${
              position === 1 ? 'gradient-gold text-accent-foreground' :
              position === 2 ? 'bg-muted text-foreground' :
              position === 3 ? 'bg-secondary text-accent' :
              'bg-secondary text-muted-foreground'
            }`}>
              {position}
            </div>
            <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
              {entry.display_name}
              {isMe && <span className="text-primary ml-1">{t('ranking.you')}</span>}
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground whitespace-nowrap shrink-0">
              PE: {entry.exact_hits ?? 0}
            </span>
            <span className="text-lg font-display font-bold text-gradient-gold shrink-0 min-w-[2ch] text-right">
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
  const [knockoutStageFilter, setKnockoutStageFilter] = useState<KnockoutSubStage>('all');
  const { data: ranking, isLoading } = useRanking();
  const { data: groupRanking, isLoading: groupLoading } = useGroupRanking(activeTab === 'grupos');
  const { data: round1, isLoading: r1Loading } = useRoundRanking('round1', activeTab === 'round1');
  const { data: round2, isLoading: r2Loading } = useRoundRanking('round2', activeTab === 'round2');
  const { data: round3, isLoading: r3Loading } = useRoundRanking('round3', activeTab === 'round3');
  const { data: knockout, isLoading: koLoading } = useRoundRanking('knockout', activeTab === 'knockout', knockoutStageFilter);
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: extrasRevealed = false } = useExtrasRevealed();

  const extrasMap = useMemo(
    () => new Map(ranking?.map(r => [r.user_id, r]) ?? []),
    [ranking]
  );

  const mergeExtras = useCallback(
    (entries: any[] | undefined) =>
      entries?.map(e => {
        const general = extrasMap.get(e.user_id);
        return {
          ...e,
          champion_team_name: general?.champion_team_name,
          champion_flag_url: general?.champion_flag_url,
          top_scorer_name: general?.top_scorer_name,
          top_scorer_flag_url: general?.top_scorer_flag_url,
          mvp_name: general?.mvp_name,
          mvp_flag_url: general?.mvp_flag_url,
        };
      }),
    [extrasMap]
  );

  const knockoutStageFilterOptions = [
    { value: 'all', label: t('knockout.filterAll', 'Todas as fases') },
    { value: 'ROUND_OF_32', label: t('knockout.stages.ROUND_OF_32') },
    { value: 'ROUND_OF_16', label: t('knockout.stages.ROUND_OF_16') },
    { value: 'QUARTER_FINAL', label: t('knockout.stages.QUARTER_FINAL') },
    { value: 'SEMI_FINAL', label: t('knockout.stages.SEMI_FINAL') },
    { value: 'FINAL_GROUP', label: t('knockout.filterFinalGroup', 'Final e 3º lugar') },
  ] as { value: KnockoutSubStage; label: string }[];

  const knockoutHitsFilter = useCallback((h: any) => {
    if (h.stage === 'GROUP_STAGE') return false;
    if (knockoutStageFilter === 'all') return true;
    if (knockoutStageFilter === 'FINAL_GROUP') return h.match_number >= 103 && h.match_number <= 104;
    const ranges: Record<Exclude<KnockoutSubStage, 'all' | 'FINAL_GROUP'>, [number, number]> = {
      ROUND_OF_32: [73, 88],
      ROUND_OF_16: [89, 96],
      QUARTER_FINAL: [97, 100],
      SEMI_FINAL: [101, 102],
    };
    const [min, max] = ranges[knockoutStageFilter];
    return h.match_number >= min && h.match_number <= max;
  }, [knockoutStageFilter]);

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
            <TabsTrigger value="knockout" className="flex-shrink-0 text-xs">{t('ranking.knockout')}</TabsTrigger>
            <TabsTrigger value="custom" className="flex-shrink-0 text-xs">⭐ {t('ranking.myRankings')}</TabsTrigger>
            <TabsTrigger value="round1" className="flex-shrink-0 text-xs">{t('ranking.round1')}</TabsTrigger>
            <TabsTrigger value="round2" className="flex-shrink-0 text-xs">{t('ranking.round2')}</TabsTrigger>
            <TabsTrigger value="round3" className="flex-shrink-0 text-xs">{t('ranking.round3')}</TabsTrigger>
            <TabsTrigger value="grupos" className="flex-shrink-0 text-xs">{t('ranking.groupStage')}</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <TabsContent value="geral" className="mt-4">
          <RankingList ranking={ranking} userId={user?.id} showField="points_total" t={t} extrasRevealed={extrasRevealed} collapsible />
        </TabsContent>
        <TabsContent value="knockout" className="mt-4">
          {koLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> :
            <RankingList ranking={mergeExtras(knockout)} userId={user?.id} showField="round_points" t={t} extrasRevealed={extrasRevealed} />}
        </TabsContent>
        <TabsContent value="custom" className="mt-4">
          <CustomRankingsTab extrasRevealed={extrasRevealed} />
        </TabsContent>
        <TabsContent value="round1" className="mt-4">
          {r1Loading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> :
            <RankingList ranking={mergeExtras(round1)} userId={user?.id} showField="round_points" t={t} extrasRevealed={extrasRevealed} collapsible showExtras={false} hitsFilter={(h) => h.stage === 'GROUP_STAGE' && h.match_number <= 24} />}
        </TabsContent>
        <TabsContent value="round2" className="mt-4">
          {r2Loading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> :
            <RankingList ranking={mergeExtras(round2)} userId={user?.id} showField="round_points" t={t} extrasRevealed={extrasRevealed} collapsible showExtras={false} hitsFilter={(h) => h.stage === 'GROUP_STAGE' && h.match_number > 24 && h.match_number <= 48} />}
        </TabsContent>
        <TabsContent value="round3" className="mt-4">
          {r3Loading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> :
            <RankingList ranking={mergeExtras(round3)} userId={user?.id} showField="round_points" t={t} extrasRevealed={extrasRevealed} collapsible showExtras={false} hitsFilter={(h) => h.stage === 'GROUP_STAGE' && h.match_number > 48 && h.match_number <= 72} />}
        </TabsContent>
        <TabsContent value="grupos" className="mt-4">
          {groupLoading ? <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /> :
            <RankingList ranking={mergeExtras(groupRanking)} userId={user?.id} showField="group_points" t={t} extrasRevealed={extrasRevealed} collapsible showExtras={false} hitsFilter={(h) => h.stage === 'GROUP_STAGE'} />}
        </TabsContent>
      </Tabs>
    </div>
  );
});
RankingPage.displayName = 'RankingPage';
export default RankingPage;
