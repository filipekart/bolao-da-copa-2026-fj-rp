import { useState } from 'react';
import { useMatches } from '@/hooks/useMatches';
import {
  usePendingUsers,
  useApproveUser,
  useUpdateMatchResult,
  useRecalculateScores,
  useUpdateUserName,
  useFetchFifaResults,
} from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Users, Trophy, RefreshCw, Globe, Loader2, Check, X, Wallet, Copy, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

function UserApprovalSection() {
  const { data: users, isLoading } = usePendingUsers();
  const approveUser = useApproveUser();
  const updateName = useUpdateUserName();
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const { t } = useTranslation();

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />;

  const pending = users?.filter(u => !u.approved) ?? [];
  const approved = users?.filter(u => u.approved) ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" /> {t('admin.userApproval')}
      </h2>

      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('admin.pending')} ({pending.length})</p>
          {pending.map(u => (
            <div key={u.id} className="glass rounded-xl p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {editingNameId === u.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="h-7 text-sm bg-secondary border-border"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                      const trimmed = newName.trim();
                      if (!trimmed) { toast.error(t('admin.nameEmpty')); return; }
                      const nameRegex = /^[a-zA-ZÀ-ÿ0-9 ]+$/;
                      if (!nameRegex.test(trimmed)) { toast.error(t('admin.nameInvalid')); return; }
                      updateName.mutate({ userId: u.id, displayName: trimmed });
                      setEditingNameId(null);
                    }}><Check className="w-3.5 h-3.5 text-primary" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingNameId(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground">{u.display_name}</p>
                    <button onClick={() => { setEditingNameId(u.id); setNewName(u.display_name); }} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => approveUser.mutate({ userId: u.id, approved: true })}
                  className="gradient-pitch text-primary-foreground"
                >
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{t('admin.approved')} ({approved.length})</p>
          {approved.map(u => (
            <div key={u.id} className="glass rounded-xl p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {editingNameId === u.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="h-7 text-sm bg-secondary border-border"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                      const trimmed = newName.trim();
                      if (!trimmed) { toast.error(t('admin.nameEmpty')); return; }
                      const nameRegex = /^[a-zA-ZÀ-ÿ0-9 ]+$/;
                      if (!nameRegex.test(trimmed)) { toast.error(t('admin.nameInvalid')); return; }
                      updateName.mutate({ userId: u.id, displayName: trimmed });
                      setEditingNameId(null);
                    }}><Check className="w-3.5 h-3.5 text-primary" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingNameId(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{u.display_name}</span>
                    <button onClick={() => { setEditingNameId(u.id); setNewName(u.display_name); }} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {u.pix_key && (
                  <div className="flex items-center gap-1.5 mt-1 ml-6">
                    <Wallet className="w-3 h-3 text-accent" />
                    <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{u.pix_key}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(u.pix_key!);
                        toast.success(t('admin.pixCopied'));
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => approveUser.mutate({ userId: u.id, approved: false })}
                className="text-destructive hover:text-destructive shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!users?.length && (
        <p className="text-sm text-muted-foreground text-center py-4">{t('admin.noUsers')}</p>
      )}
    </div>
  );
}

function MatchResultSection() {
  const { data: matches, isLoading } = useMatches();
  const updateResult = useUpdateMatchResult();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const { t } = useTranslation();

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />;

  const sorted = [...(matches ?? [])].sort((a, b) =>
    new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
        <Trophy className="w-5 h-5 text-accent" /> {t('admin.matchResults')}
      </h2>

      <p className="text-xs text-muted-foreground">
        {t('admin.knockoutNote')}
      </p>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {sorted.map(m => {
          const isEditing = editingId === m.id;
          return (
            <div key={m.id} className="glass rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t(`match.stages.${m.stage}`, m.stage.replace(/_/g, ' '))}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  m.status === 'FINISHED' ? 'bg-primary/20 text-primary' :
                  m.status === 'LIVE' ? 'bg-destructive/20 text-destructive' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {m.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {m.home_team_flag_url && <img src={m.home_team_flag_url} alt="" className="w-5 h-4 rounded-sm" />}
                  <span className="text-sm text-foreground truncate">{m.home_team_name}</span>
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-1 px-2">
                    <Input
                      type="number"
                      min={0}
                      value={homeScore}
                      onChange={e => setHomeScore(Number(e.target.value))}
                      className="w-12 h-8 text-center text-sm bg-secondary border-border"
                    />
                    <span className="text-muted-foreground text-xs">×</span>
                    <Input
                      type="number"
                      min={0}
                      value={awayScore}
                      onChange={e => setAwayScore(Number(e.target.value))}
                      className="w-12 h-8 text-center text-sm bg-secondary border-border"
                    />
                  </div>
                ) : (
                  <div className="px-3 text-sm font-medium text-foreground">
                    {m.official_home_score !== null ? `${m.official_home_score} × ${m.official_away_score}` : '– × –'}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                  <span className="text-sm text-foreground truncate">{m.away_team_name}</span>
                  {m.away_team_flag_url && <img src={m.away_team_flag_url} alt="" className="w-5 h-4 rounded-sm" />}
                </div>
              </div>

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      size="sm"
                      className="flex-1 gradient-pitch text-primary-foreground"
                      onClick={() => {
                        updateResult.mutate({
                          matchId: m.id,
                          homeScore,
                          awayScore,
                          status: 'FINISHED',
                        });
                        setEditingId(null);
                      }}
                    >
                      {t('admin.saveFinished')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      {t('admin.cancel')}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground"
                    onClick={() => {
                      setEditingId(m.id);
                      setHomeScore(m.official_home_score ?? 0);
                      setAwayScore(m.official_away_score ?? 0);
                    }}
                  >
                    {t('admin.editResult')}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const recalculate = useRecalculateScores();
  const fetchFifa = useFetchFifaResults();
  const [activeTab, setActiveTab] = useState<'users' | 'matches'>('users');
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
        <Shield className="w-5 h-5 text-accent" /> {t('admin.title')}
      </h1>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchFifa.mutate()}
          disabled={fetchFifa.isPending}
          className="flex-1"
        >
          {fetchFifa.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          <span className="ml-1 text-xs">{t('admin.fetchFifa')}</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => recalculate.mutate()}
          disabled={recalculate.isPending}
          className="flex-1"
        >
          {recalculate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-1 text-xs">{t('admin.recalculate')}</span>
        </Button>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'users' ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          {t('admin.users')}
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'matches' ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
          }`}
        >
          {t('admin.results')}
        </button>
      </div>

      {activeTab === 'users' ? <UserApprovalSection /> : <MatchResultSection />}
    </div>
  );
}
