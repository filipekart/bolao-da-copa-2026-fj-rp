import { useEffect, useMemo, useState } from 'react';
import { useMyPredictions } from '@/hooks/usePredictions';
import { Loader2, History, Clock, MapPin, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { formatStageLabel } from '@/lib/stageLabel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useTranslatedTeamName } from '@/hooks/useTranslatedTeamName';
import { Flag } from '@/components/Flag';

type TabKey = 'upcoming' | 'today' | 'finished';
type RuleFilter = 'exact' | 'partial' | 'miss';

const PARTIAL_RULES = new Set([
  'WINNER_AND_WINNER_GOALS',
  'WINNER_AND_LOSER_GOALS',
  'DRAW_RESULT_ONLY',
  'RESULT_ONLY',
]);

const STORAGE_KEY = 'bets-active-tab';
const DAY_MS = 24 * 60 * 60 * 1000;

function formatCountdown(ms: number, nowLabel: string): string {
  if (ms <= 0) return nowLabel;
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatDate(iso: string, lang: string) {
  const locale = lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : lang === 'fr' ? 'fr-FR' : 'en-US';
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function MyBetsPage() {
  const { data: predictions, isLoading } = useMyPredictions();
  const [search, setSearch] = useState('');
  const [ruleFilters, setRuleFilters] = useState<Set<RuleFilter>>(new Set());
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.substring(0, 2) ?? 'pt';
  const tt = useTranslatedTeamName();

  // Tick to refresh countdowns
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Stored active tab
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
  const [tabInitialized, setTabInitialized] = useState(false);

  const ruleLabels: Record<string, { label: string; color: string }> = {
    EXACT_SCORE: { label: t('bets.rules.EXACT_SCORE'), color: 'text-primary' },
    WINNER_AND_WINNER_GOALS: { label: t('bets.rules.WINNER_AND_WINNER_GOALS'), color: 'text-primary' },
    WINNER_AND_LOSER_GOALS: { label: t('bets.rules.WINNER_AND_LOSER_GOALS'), color: 'text-primary' },
    RESULT_ONLY: { label: t('bets.rules.RESULT_ONLY'), color: 'text-accent' },
    DRAW_RESULT_ONLY: { label: t('bets.rules.DRAW_RESULT_ONLY'), color: 'text-accent' },
    MISS: { label: t('bets.rules.MISS'), color: 'text-destructive' },
    PENDING: { label: t('bets.rules.PENDING'), color: 'text-muted-foreground' },
  };

  // Bucket predictions per tab (raw, no search applied yet)
  const buckets = useMemo(() => {
    const upcoming: typeof predictions = [];
    const today: typeof predictions = [];
    const finished: typeof predictions = [];
    for (const p of predictions ?? []) {
      const m = p.match;
      const ko = m?.kickoff_at ? new Date(m.kickoff_at).getTime() : null;
      const isFinished = m?.status === 'FINISHED';
      if (isFinished) {
        finished!.push(p);
      } else if (ko !== null && ko - now <= DAY_MS) {
        // in progress or kicks off within 24h
        today!.push(p);
      } else {
        upcoming!.push(p);
      }
    }
    return { upcoming: upcoming!, today: today!, finished: finished! };
  }, [predictions, now]);

  // Initialize active tab once data is loaded (default to today if has games, else upcoming)
  useEffect(() => {
    if (tabInitialized || !predictions) return;
    const stored = typeof window !== 'undefined' ? (localStorage.getItem(STORAGE_KEY) as TabKey | null) : null;
    if (stored && ['upcoming', 'today', 'finished'].includes(stored)) {
      setActiveTab(stored);
    } else if (buckets.today.length > 0) {
      setActiveTab('today');
    } else {
      setActiveTab('upcoming');
    }
    setTabInitialized(true);
  }, [predictions, buckets.today.length, tabInitialized]);

  const handleTabChange = (v: string) => {
    const k = v as TabKey;
    setActiveTab(k);
    try { localStorage.setItem(STORAGE_KEY, k); } catch { /* noop */ }
  };

  // Search predicate (name or score like "2x1")
  const matchesSearch = (p: NonNullable<typeof predictions>[number]) => {
    const raw = search.trim();
    if (!raw) return true;
    const q = raw.toLowerCase();
    const m = p.match;
    const nameMatch =
      m?.home_team_name?.toLowerCase().includes(q) ||
      m?.away_team_name?.toLowerCase().includes(q);
    const nums = raw.match(/\d+/g)?.map(Number) ?? [];
    const hasLetters = /[a-zà-ÿ]/i.test(raw);
    let scoreMatch = false;
    const isFin = m?.status === 'FINISHED';
    const h = isFin ? m?.official_home_score : p.predicted_home_score;
    const a = isFin ? m?.official_away_score : p.predicted_away_score;
    if (nums.length >= 2) {
      scoreMatch = h === nums[0] && a === nums[1];
    } else if (nums.length === 1) {
      scoreMatch = h === nums[0] || a === nums[0];
    }
    if (nums.length > 0 && !hasLetters) return !!scoreMatch;
    if (hasLetters && nums.length === 0) return !!nameMatch;
    return !!(nameMatch || scoreMatch);
  };

  const matchesRuleFilter = (rule: string) => {
    if (ruleFilters.size === 0) return true;
    if (ruleFilters.has('exact') && rule === 'EXACT_SCORE') return true;
    if (ruleFilters.has('partial') && PARTIAL_RULES.has(rule)) return true;
    if (ruleFilters.has('miss') && rule === 'MISS') return true;
    return false;
  };

  const toggleRuleFilter = (f: RuleFilter) => {
    setRuleFilters(prev => {
      const n = new Set(prev);
      if (n.has(f)) n.delete(f); else n.add(f);
      return n;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Renders a single prediction card. `highlight` adds the gold ring + countdown.
  const renderCard = (
    p: NonNullable<typeof predictions>[number],
    opts: { highlight?: boolean; live?: boolean } = {},
  ) => {
    const rule = ruleLabels[p.rule_applied] ?? ruleLabels.PENDING;
    const match = p.match;
    const isFinished = match?.status === 'FINISHED';
    const ko = match?.kickoff_at ? new Date(match.kickoff_at).getTime() : null;
    const showCountdown = opts.highlight && ko !== null && ko > now;
    return (
      <button
        key={p.id}
        onClick={() => navigate(`/match/${p.match_id}`)}
        className={`w-full glass rounded-xl p-4 text-left space-y-3 transition ${
          opts.highlight ? 'ring-1 ring-primary shadow-[0_0_24px_-8px_hsl(var(--primary)/0.6)]' : ''
        }`}
      >
        {match && (
          <>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-2">
                {formatStageLabel(t, match.stage, (match as any).match_number)}
                {opts.live && (
                  <span className="inline-flex items-center gap-1 text-destructive font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                    {t('bets.live', 'AO VIVO')}
                  </span>
                )}
                {showCountdown && (
                  <span className="text-primary font-semibold">
                    {t('bets.in', 'em')} {formatCountdown(ko! - now, t('bets.now', 'agora'))}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(match.kickoff_at!, lang)}
              </div>
            </div>

            {match.venue && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {match.venue}{match.city ? `, ${match.city}` : ''}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {match.home_team_flag_url && (
                  <Flag src={match.home_team_flag_url} alt="" className="w-6 h-4 rounded-sm" />
                )}
                <span className="text-sm font-medium text-foreground truncate">
                  {tt(match.home_team_id, match.home_team_name)}
                </span>
              </div>

              <div className="px-3 text-center">
                {isFinished ? (
                  <span className="text-sm font-bold text-foreground">
                    {match.official_home_score} × {match.official_away_score}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">vs</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span className="text-sm font-medium text-foreground truncate">
                  {tt(match.away_team_id, match.away_team_name)}
                </span>
                {match.away_team_flag_url && (
                  <Flag src={match.away_team_flag_url} alt="" className="w-6 h-4 rounded-sm" />
                )}
              </div>
            </div>
          </>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground">
              {t('bets.yourPrediction')}:{' '}
              <span className="text-foreground font-semibold">
                {p.predicted_home_score} × {p.predicted_away_score}
              </span>
            </p>
            <p className={`text-xs mt-0.5 ${rule.color}`}>{rule.label}</p>
          </div>
          {p.points_awarded > 0 && (
            <span className="text-lg font-display font-bold text-primary">
              +{p.points_awarded}
            </span>
          )}
        </div>
      </button>
    );
  };

  // Group a list by match.stage (with translated label)
  const groupByStage = (list: NonNullable<typeof predictions>) => {
    const groups = new Map<string, typeof list>();
    for (const p of list) {
      const stage = p.match?.stage ?? 'OTHER';
      const groupName = stage === 'GROUP_STAGE'
        ? `${t('bets.group')} ${(p.match as any)?.group_name ?? '—'}`
        : formatStageLabel(t, stage, (p.match as any)?.match_number);
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName)!.push(p);
    }
    return groups;
  };

  const renderUpcoming = () => {
    const list = buckets.upcoming.filter(matchesSearch).sort((a, b) => {
      const da = a.match?.kickoff_at ? new Date(a.match.kickoff_at).getTime() : 0;
      const db = b.match?.kickoff_at ? new Date(b.match.kickoff_at).getTime() : 0;
      return da - db;
    });
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {t('bets.empty.upcoming', 'Nenhum jogo pendente — você está em dia! 🎯')}
        </div>
      );
    }
    const groups = groupByStage(list);
    const keys = [...groups.keys()];
    const firstId = list[0]?.id;
    return (
      <div className="space-y-6">
        {keys.map(name => (
          <div key={name}>
            <h2 className="text-sm font-bold text-primary mb-2">{name}</h2>
            <div className="space-y-3">
              {groups.get(name)!.map(p => renderCard(p, { highlight: p.id === firstId }))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderToday = () => {
    const list = buckets.today.filter(matchesSearch).sort((a, b) => {
      const da = a.match?.kickoff_at ? new Date(a.match.kickoff_at).getTime() : 0;
      const db = b.match?.kickoff_at ? new Date(b.match.kickoff_at).getTime() : 0;
      return da - db;
    });
    if (list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {t('bets.empty.today', 'Nenhum jogo nas próximas 24h')}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {list.map(p => {
          const ko = p.match?.kickoff_at ? new Date(p.match.kickoff_at).getTime() : null;
          const live = ko !== null && ko <= now;
          return renderCard(p, { highlight: true, live });
        })}
      </div>
    );
  };

  const renderFinished = () => {
    const list = buckets.finished
      .filter(matchesSearch)
      .filter(p => matchesRuleFilter(p.rule_applied))
      .filter(p => {
        if (stageFilter === 'ALL') return true;
        if (stageFilter.startsWith('GROUP:')) {
          const g = stageFilter.slice(6);
          return p.match?.stage === 'GROUP_STAGE' && (p.match as any)?.group_name === g;
        }
        return p.match?.stage === stageFilter;
      })
      .sort((a, b) => {
        const da = a.match?.kickoff_at ? new Date(a.match.kickoff_at).getTime() : 0;
        const db = b.match?.kickoff_at ? new Date(b.match.kickoff_at).getTime() : 0;
        return db - da;
      });

    // Stage filter options. FIFA 2026 has 12 groups (A–L).
    const groupLetters = ['A','B','C','D','E','F','G','H','I','J','K','L'];
    const knockoutStages = ['ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];

    const chip = (key: RuleFilter, label: string, activeCls: string) => {
      const active = ruleFilters.has(key);
      return (
        <button
          type="button"
          onClick={() => toggleRuleFilter(key)}
          className={`text-xs px-3 py-1 rounded-full border transition ${
            active ? activeCls : 'border-border text-muted-foreground hover:bg-secondary/50'
          }`}
        >
          {label}
        </button>
      );
    };

    return (
      <div className="space-y-4">
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder={t('bets.filters.stage', 'Filtrar por fase')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('bets.filters.allStages', 'Todas as fases')}</SelectItem>
            {groupLetters.map(g => (
              <SelectItem key={`GROUP:${g}`} value={`GROUP:${g}`}>
                {t('bets.group')} {g}
              </SelectItem>
            ))}
            {knockoutStages.map(s => (
              <SelectItem key={s} value={s}>
                {t(`match.stages.${s}`, s.replace(/_/g, ' '))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-2">
          {chip('exact', t('bets.filters.exact', 'Placar exato'), 'border-primary bg-primary/15 text-primary')}
          {chip('partial', t('bets.filters.partial', 'Acerto parcial'), 'border-accent bg-accent/15 text-accent')}
          {chip('miss', t('bets.filters.miss', 'Errou'), 'border-destructive bg-destructive/15 text-destructive')}
          {ruleFilters.size > 0 && (
            <button
              type="button"
              onClick={() => setRuleFilters(new Set())}
              className="text-xs px-2 py-1 rounded-full text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" /> {t('bets.filters.clear', 'Limpar')}
            </button>
          )}
        </div>

        {list.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {t('bets.empty.finished', 'Nenhum jogo finalizado ainda')}
          </div>
        ) : (
          (() => {
            const groups = groupByStage(list);
            return (
              <div className="space-y-6">
                {[...groups.keys()].map(name => (
                  <div key={name}>
                    <h2 className="text-sm font-bold text-primary mb-2">{name}</h2>
                    <div className="space-y-3">
                      {groups.get(name)!.map(p => renderCard(p))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <History className="w-5 h-5 text-primary" /> {t('bets.title')}
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('bets.searchPlaceholderExt', 'Buscar por time ou placar (ex: 2x1)')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!predictions?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t('bets.noPredictions')}</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
              {t('bets.tabs.upcoming', 'Próximos')}
              <span className="ml-1.5 text-[10px] opacity-70">{buckets.upcoming.length}</span>
            </TabsTrigger>
            <TabsTrigger value="today" className="text-xs sm:text-sm">
              {t('bets.tabs.today', 'Hoje')}
              <span className="ml-1.5 text-[10px] opacity-70">{buckets.today.length}</span>
            </TabsTrigger>
            <TabsTrigger value="finished" className="text-xs sm:text-sm">
              {t('bets.tabs.finished', 'Finalizados')}
              <span className="ml-1.5 text-[10px] opacity-70">{buckets.finished.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">{renderUpcoming()}</TabsContent>
          <TabsContent value="today" className="mt-4">{renderToday()}</TabsContent>
          <TabsContent value="finished" className="mt-4">{renderFinished()}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
