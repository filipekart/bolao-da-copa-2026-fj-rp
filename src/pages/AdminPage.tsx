import { useState } from 'react';
import { useMatches } from '@/hooks/useMatches';
import { useTeams } from '@/hooks/useTeams';
import {
  usePendingUsers,
  useApproveUser,
  useUpdateMatchResult,
  useUpdateMatchTeams,
  useRecalculateScores,
  useUpdateUserName,
  useFetchFifaResults,
  useDeleteUser,
  useManagedProfilesAdmin,
  useCreateManagedProfile,
  useDeleteManagedProfile,
} from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Users, Trophy, RefreshCw, Globe, Loader2, Check, X, Wallet, Copy, Pencil, Trash2, Link2, Users2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTranslatedTeamName } from '@/hooks/useTranslatedTeamName';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function InlineNameEditor({
  userId,
  displayName,
  isEditing,
  editValue,
  onEditStart,
  onEditChange,
  onEditCancel,
  onEditSave,
  prefix,
}: {
  userId: string;
  displayName: string;
  isEditing: boolean;
  editValue: string;
  onEditStart: () => void;
  onEditChange: (val: string) => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  prefix?: React.ReactNode;
}) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={e => onEditChange(e.target.value)}
          className="h-7 text-sm bg-secondary border-border"
          autoFocus
        />
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onEditSave}>
          <Check className="w-3.5 h-3.5 text-primary" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={onEditCancel}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      {prefix}
      <span className="text-sm font-medium text-foreground">{displayName}</span>
      <button onClick={onEditStart} className="text-muted-foreground hover:text-foreground">
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  );
}

function UserApprovalSection() {
  const { data: users, isLoading } = usePendingUsers();
  const approveUser = useApproveUser();
  const deleteUser = useDeleteUser();
  const updateName = useUpdateUserName();
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { t } = useTranslation();

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />;

  const pending = users?.filter(u => !u.approved) ?? [];
  const approved = (users?.filter(u => u.approved) ?? []).sort((a, b) => a.display_name.localeCompare(b.display_name));

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
                <InlineNameEditor
                  userId={u.id}
                  displayName={u.display_name}
                  isEditing={editingNameId === u.id}
                  editValue={newName}
                  onEditStart={() => { setEditingNameId(u.id); setNewName(u.display_name); }}
                  onEditChange={setNewName}
                  onEditCancel={() => setEditingNameId(null)}
                  onEditSave={() => {
                    const trimmed = newName.trim();
                    if (!trimmed) { toast.error(t('admin.nameEmpty')); return; }
                    const nameRegex = /^[a-zA-ZÀ-ÿ0-9 ]+$/;
                    if (!nameRegex.test(trimmed)) { toast.error(t('admin.nameInvalid')); return; }
                    updateName.mutate({ userId: u.id, displayName: trimmed });
                    setEditingNameId(null);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={() => approveUser.mutate({ userId: u.id, approved: true })}
                  className="gradient-pitch text-primary-foreground"
                >
                  <Check className="w-4 h-4" />
                </Button>
                {deletingId === u.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-destructive">{t('admin.confirmDelete')}</span>
                    <Button size="sm" variant="ghost" className="h-7 px-1.5 text-destructive" onClick={() => {
                      deleteUser.mutate(u.id);
                      setDeletingId(null);
                    }}>
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => setDeletingId(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingId(u.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
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
                <InlineNameEditor
                  userId={u.id}
                  displayName={u.display_name}
                  isEditing={editingNameId === u.id}
                  editValue={newName}
                  onEditStart={() => { setEditingNameId(u.id); setNewName(u.display_name); }}
                  onEditChange={setNewName}
                  onEditCancel={() => setEditingNameId(null)}
                  onEditSave={() => {
                    const trimmed = newName.trim();
                    if (!trimmed) { toast.error(t('admin.nameEmpty')); return; }
                    const nameRegex = /^[a-zA-ZÀ-ÿ0-9 ]+$/;
                    if (!nameRegex.test(trimmed)) { toast.error(t('admin.nameInvalid')); return; }
                    updateName.mutate({ userId: u.id, displayName: trimmed });
                    setEditingNameId(null);
                  }}
                  prefix={<Check className="w-4 h-4 text-primary shrink-0" />}
                />
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
                className="text-muted-foreground hover:text-destructive shrink-0"
                title={t('admin.pending')}
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
  const tt = useTranslatedTeamName();

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
                  {m.home_team_flag_url && <img src={m.home_team_flag_url} alt="" loading="lazy" className="w-5 h-4 rounded-sm" />}
                  <span className="text-sm text-foreground truncate">{tt(m.home_team_id, m.home_team_name)}</span>
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
                  <span className="text-sm text-foreground truncate">{tt(m.away_team_id, m.away_team_name)}</span>
                  {m.away_team_flag_url && <img src={m.away_team_flag_url} alt="" loading="lazy" className="w-5 h-4 rounded-sm" />}
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
                  <div className="flex gap-2">
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
                    {m.official_home_score !== null && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-destructive"
                        onClick={() => {
                          updateResult.mutate({
                            matchId: m.id,
                            homeScore: null as any,
                            awayScore: null as any,
                            status: 'SCHEDULED',
                          });
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {t('admin.clearResult', 'Limpar')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MultiProfileSection() {
  const { data: links, isLoading } = useManagedProfilesAdmin();
  const createLink = useCreateManagedProfile();
  const deleteLink = useDeleteManagedProfile();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [managerId, setManagerId] = useState('');
  const [managedId, setManagedId] = useState('');
  const { t } = useTranslation();

  const { data: allProfiles } = useQuery({
    queryKey: ['public-profiles'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_public_profiles');
      return (data ?? []).filter(p => p.approved).sort((a, b) => a.display_name.localeCompare(b.display_name));
    },
  });

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />;

  const handleCreate = () => {
    if (!managerId || !managedId || managerId === managedId) return;
    createLink.mutate({ managerId, managedId });
    setManagerId('');
    setManagedId('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
        <Link2 className="w-5 h-5 text-primary" /> {t('admin.multiProfiles')}
      </h2>

      <div className="glass rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('admin.manager')}</label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger className="h-9 text-sm bg-secondary border-border">
                <SelectValue placeholder={t('admin.selectUser')} />
              </SelectTrigger>
              <SelectContent>
                {allProfiles?.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t('admin.managed')}</label>
            <Select value={managedId} onValueChange={setManagedId}>
              <SelectTrigger className="h-9 text-sm bg-secondary border-border">
                <SelectValue placeholder={t('admin.selectUser')} />
              </SelectTrigger>
              <SelectContent>
                {allProfiles?.filter(p => p.id !== managerId).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!managerId || !managedId || managerId === managedId || createLink.isPending}
          className="w-full gradient-pitch text-primary-foreground"
        >
          {createLink.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4 mr-1" />}
          {t('admin.linkProfile')}
        </Button>
      </div>

      {links && links.length > 0 ? (
        <div className="space-y-2">
          {links.map(l => (
            <div key={l.id} className="glass rounded-xl p-3 flex items-center justify-between">
              <div className="text-sm text-foreground">
                <span className="font-medium">{l.manager_name}</span>
                <span className="text-muted-foreground mx-2">→</span>
                <span>{l.managed_name}</span>
              </div>
              {deletingId === l.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-destructive">{t('admin.confirmUnlink')}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-1.5 text-destructive" onClick={() => {
                    deleteLink.mutate(l.id);
                    setDeletingId(null);
                  }}>
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-1.5" onClick={() => setDeletingId(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setDeletingId(l.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">{t('admin.noLinks')}</p>
      )}
    </div>
  );
}

export default function AdminPage() {
  const recalculate = useRecalculateScores();
  const fetchFifa = useFetchFifaResults();
  const [activeTab, setActiveTab] = useState<'users' | 'matches' | 'profiles'>('users');
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
        {(['users', 'matches', 'profiles'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {tab === 'users' ? t('admin.users') : tab === 'matches' ? t('admin.results') : t('admin.multiProfiles')}
          </button>
        ))}
      </div>

      {activeTab === 'users' && <UserApprovalSection />}
      {activeTab === 'matches' && <MatchResultSection />}
      {activeTab === 'profiles' && <MultiProfileSection />}
    </div>
  );
}
