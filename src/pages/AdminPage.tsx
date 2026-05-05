import { useState, useMemo } from 'react';
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
import { Shield, Users, Trophy, RefreshCw, Globe, Loader2, Check, X, Wallet, Copy, Pencil, Trash2, Link2, Users2, Star, Award, Target, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTranslatedTeamName, useTeamNameByCode } from '@/hooks/useTranslatedTeamName';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Flag } from '@/components/Flag';
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
  const { data: teams } = useTeams();
  const updateResult = useUpdateMatchResult();
  const updateTeams = useUpdateMatchTeams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [editingTeamsId, setEditingTeamsId] = useState<string | null>(null);
  const [homeTeamId, setHomeTeamId] = useState('');
  const [awayTeamId, setAwayTeamId] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'GROUP_STAGE' | 'KNOCKOUT'>('ALL');
  const { t } = useTranslation();
  const tt = useTranslatedTeamName();

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />;

  const sortedTeams = [...(teams ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = (matches ?? []).filter(m => {
    if (stageFilter === 'GROUP_STAGE') return m.stage === 'GROUP_STAGE';
    if (stageFilter === 'KNOCKOUT') return m.stage !== 'GROUP_STAGE';
    return true;
  });
  const sorted = [...filtered].sort((a, b) => {
    const aKnockout = a.stage !== 'GROUP_STAGE';
    const bKnockout = b.stage !== 'GROUP_STAGE';
    if (aKnockout && bKnockout) {
      return (a.match_number ?? 0) - (b.match_number ?? 0);
    }
    if (aKnockout !== bKnockout) {
      return aKnockout ? 1 : -1;
    }
    return new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime();
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
        <Trophy className="w-5 h-5 text-accent" /> {t('admin.matchResults')}
      </h2>

      <p className="text-xs text-muted-foreground">
        {t('admin.knockoutNote')}
      </p>

      <div className="flex gap-1 p-1 bg-secondary rounded-xl">
        {(['ALL', 'GROUP_STAGE', 'KNOCKOUT'] as const).map(f => (
          <button
            key={f}
            onClick={() => setStageFilter(f)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              stageFilter === f ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {f === 'ALL' ? 'Todos' : f === 'GROUP_STAGE' ? 'Grupos' : 'Mata-mata'}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {sorted.map(m => {
          const isEditing = editingId === m.id;
          const isEditingTeams = editingTeamsId === m.id;
          const isKnockout = m.stage !== 'GROUP_STAGE';
          return (
            <div key={m.id} className="glass rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {m.match_number ? `#${m.match_number} · ` : ''}
                  {m.match_number === 103
                    ? 'Disputa do 3º lugar'
                    : t(`match.stages.${m.stage}`, m.stage.replace(/_/g, ' '))}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  m.status === 'FINISHED' ? 'bg-primary/20 text-primary' :
                  m.status === 'LIVE' ? 'bg-destructive/20 text-destructive' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {m.status}
                </span>
              </div>

              {isEditingTeams ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Time mandante</label>
                    <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                      <SelectTrigger className="h-9 text-sm bg-secondary border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedTeams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {tt(team.id, team.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Time visitante</label>
                    <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                      <SelectTrigger className="h-9 text-sm bg-secondary border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedTeams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {tt(team.id, team.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gradient-pitch text-primary-foreground"
                      onClick={() => {
                        if (!homeTeamId || !awayTeamId) {
                          toast.error('Selecione os dois times');
                          return;
                        }
                        updateTeams.mutate(
                          { matchId: m.id, homeTeamId, awayTeamId },
                          { onSuccess: () => setEditingTeamsId(null) }
                        );
                      }}
                    >
                      Salvar times
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingTeamsId(null)}>
                      {t('admin.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {m.home_team_flag_url && <Flag src={m.home_team_flag_url} alt="" className="w-5 h-4 rounded-sm" />}
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
                    {m.away_team_flag_url && <Flag src={m.away_team_flag_url} alt="" className="w-5 h-4 rounded-sm" />}
                  </div>
                </div>
              )}

              {!isEditingTeams && (
                <div className="flex gap-2 flex-wrap">
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
                    <div className="flex gap-2 flex-wrap">
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
                      {isKnockout && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-accent"
                          onClick={() => {
                            setEditingTeamsId(m.id);
                            setHomeTeamId(m.home_team_id);
                            setAwayTeamId(m.away_team_id);
                          }}
                        >
                          <Users2 className="w-3 h-3 mr-1" />
                          Editar times
                        </Button>
                      )}
                      {isKnockout && m.home_team_id !== '00000000-0000-0000-0000-000000000000' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-destructive"
                          onClick={() => {
                            if (!confirm('Limpar times definidos e voltar para "A definir"?')) return;
                            updateTeams.mutate({
                              matchId: m.id,
                              homeTeamId: '00000000-0000-0000-0000-000000000000',
                              awayTeamId: '00000000-0000-0000-0000-000000000000',
                            });
                          }}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Limpar times
                        </Button>
                      )}
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
              )}
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

// ============================================================
// Extras Results Section (Champion / Top Scorer / MVP)
// ============================================================
interface OfficialExtras {
  champion_team_id: string | null;
  champion_team_name: string | null;
  champion_flag_url: string | null;
  top_scorer_name: string | null;
  top_scorer_team_id: string | null;
  top_scorer_flag_url: string | null;
  mvp_name: string | null;
  mvp_team_id: string | null;
  mvp_flag_url: string | null;
}

function useAdminPlayers(teamId: string | null) {
  return useQuery({
    queryKey: ['admin-players', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId!)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });
}

function TeamPicker({ teams, value, onChange, placeholder }: {
  teams: any[] | undefined;
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const tn = useTeamNameByCode();

  const selected = teams?.find(t => t.id === value);
  const filtered = useMemo(
    () => teams?.filter(t => tn(t.name, t.fifa_code).toLowerCase().includes(search.toLowerCase())) ?? [],
    [teams, search, tn]
  );

  if (selected) {
    return (
      <button
        onClick={() => { onChange(null); setOpen(true); setSearch(''); }}
        className="w-full glass rounded-xl px-4 py-3 flex items-center gap-3 ring-1 ring-primary"
      >
        {selected.flag_url && <Flag src={selected.flag_url} alt="" className="w-6 h-4 rounded-sm" />}
        <span className="text-sm text-foreground font-medium">{tn(selected.name, selected.fifa_code)}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">trocar</span>
      </button>
    );
  }

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full glass rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {open && (
        <div className="space-y-1 max-h-[30vh] overflow-y-auto">
          {filtered.map(team => (
            <button
              key={team.id}
              onClick={() => { onChange(team.id); setOpen(false); setSearch(''); }}
              className="w-full glass rounded-xl px-4 py-2.5 flex items-center gap-3 transition-all hover:ring-1 hover:ring-primary"
            >
              {team.flag_url && <Flag src={team.flag_url} alt="" className="w-6 h-4 rounded-sm" />}
              <span className="text-sm text-foreground">{tn(team.name, team.fifa_code)}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function PlayerPicker({ teamId, value, onChange }: {
  teamId: string | null;
  value: string;
  onChange: (name: string) => void;
}) {
  const { data: players, isLoading } = useAdminPlayers(teamId);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => players?.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) ?? [],
    [players, search]
  );

  if (!teamId) return null;
  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  if (!players?.length) {
    return (
      <div className="glass rounded-xl p-4 text-sm text-muted-foreground border border-muted/30">
        Elenco indisponível para este time.
      </div>
    );
  }

  if (value) {
    return (
      <button
        onClick={() => { onChange(''); setOpen(true); setSearch(''); }}
        className="w-full glass rounded-xl px-4 py-3 flex items-center gap-3 ring-1 ring-primary"
      >
        <span className="text-sm text-foreground font-medium">{value}</span>
        <span className="text-[10px] text-muted-foreground ml-auto">trocar</span>
      </button>
    );
  }

  return (
    <>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar jogador"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full glass rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {open && (
        <div className="space-y-1 max-h-[30vh] overflow-y-auto">
          {filtered.length > 0 ? filtered.map(p => (
            <button
              key={p.id}
              onClick={() => { onChange(p.name); setOpen(false); setSearch(''); }}
              className="w-full glass rounded-xl px-4 py-2.5 flex items-center gap-3 transition-all hover:ring-1 hover:ring-primary"
            >
              <span className="text-sm text-foreground">{p.name}</span>
              {p.position && <span className="text-[10px] text-muted-foreground ml-auto">{p.position}</span>}
            </button>
          )) : (
            <p className="text-xs text-muted-foreground text-center py-3">Nenhum jogador encontrado</p>
          )}
        </div>
      )}
    </>
  );
}

function ExtrasResultsSection() {
  const queryClient = useQueryClient();
  const { data: teams } = useTeams();
  const tn = useTeamNameByCode();

  const { data: official, isLoading } = useQuery({
    queryKey: ['official-extras'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_official_extras');
      if (error) throw error;
      return (data?.[0] ?? null) as OfficialExtras | null;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['official-extras'] });
    queryClient.invalidateQueries({ queryKey: ['ranking'] });
    queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
  };

  const setChampion = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase.rpc('admin_set_champion', { p_team_id: teamId });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Campeão registrado e ranking atualizado!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearChampion = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('admin_clear_champion');
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Campeão removido.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setExtra = useMutation({
    mutationFn: async ({ category, playerName, teamId }: { category: 'top_scorer_result' | 'mvp_result'; playerName: string; teamId: string | null }) => {
      const { error } = await supabase.rpc('admin_set_extra_result', {
        p_category: category,
        p_player_name: playerName,
        p_team_id: teamId,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Resultado registrado e ranking atualizado!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const clearExtra = useMutation({
    mutationFn: async (category: 'top_scorer_result' | 'mvp_result') => {
      const { error } = await supabase.rpc('admin_clear_extra_result', { p_category: category });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success('Resultado removido.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Form state
  const [championTeamId, setChampionTeamId] = useState<string | null>(null);
  const [scorerTeamId, setScorerTeamId] = useState<string | null>(null);
  const [scorerName, setScorerName] = useState('');
  const [mvpTeamId, setMvpTeamId] = useState<string | null>(null);
  const [mvpName, setMvpName] = useState('');

  if (isLoading) return <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Registre os resultados oficiais. O ranking é recalculado automaticamente. Pontos: Campeão = 100, Artilheiro = 50, MVP = 50.
      </p>

      {/* CAMPEÃO */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-accent" /> Campeão Oficial
        </h3>

        {official?.champion_team_id && (
          <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg p-2">
            <span className="text-[10px] text-muted-foreground uppercase">Atual:</span>
            {official.champion_flag_url && <Flag src={official.champion_flag_url} alt="" className="w-6 h-4 rounded-sm" />}
            <span className="font-medium text-foreground">{tn(official.champion_team_name ?? '', null)}</span>
            <Button size="sm" variant="ghost" className="ml-auto text-destructive h-7" onClick={() => clearChampion.mutate()} disabled={clearChampion.isPending}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <TeamPicker teams={teams} value={championTeamId} onChange={setChampionTeamId} placeholder="Buscar time campeão" />

        <Button
          onClick={() => { if (championTeamId) setChampion.mutate(championTeamId); }}
          disabled={!championTeamId || setChampion.isPending}
          className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
        >
          {setChampion.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Campeão'}
        </Button>
      </div>

      {/* ARTILHEIRO */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" /> Artilheiro Oficial
        </h3>

        {official?.top_scorer_name && (
          <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg p-2">
            <span className="text-[10px] text-muted-foreground uppercase">Atual:</span>
            {official.top_scorer_flag_url && <Flag src={official.top_scorer_flag_url} alt="" className="w-6 h-4 rounded-sm" />}
            <span className="font-medium text-foreground">{official.top_scorer_name}</span>
            <Button size="sm" variant="ghost" className="ml-auto text-destructive h-7" onClick={() => clearExtra.mutate('top_scorer_result')} disabled={clearExtra.isPending}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <TeamPicker teams={teams} value={scorerTeamId} onChange={(id) => { setScorerTeamId(id); setScorerName(''); }} placeholder="Buscar time do artilheiro" />
        {scorerTeamId && <PlayerPicker teamId={scorerTeamId} value={scorerName} onChange={setScorerName} />}

        <Button
          onClick={() => { if (scorerName && scorerTeamId) setExtra.mutate({ category: 'top_scorer_result', playerName: scorerName, teamId: scorerTeamId }); }}
          disabled={!scorerName || !scorerTeamId || setExtra.isPending}
          className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
        >
          {setExtra.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Artilheiro'}
        </Button>
      </div>

      {/* MVP */}
      <div className="glass rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
          <Award className="w-4 h-4 text-accent" /> MVP Oficial
        </h3>

        {official?.mvp_name && (
          <div className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg p-2">
            <span className="text-[10px] text-muted-foreground uppercase">Atual:</span>
            {official.mvp_flag_url && <Flag src={official.mvp_flag_url} alt="" className="w-6 h-4 rounded-sm" />}
            <span className="font-medium text-foreground">{official.mvp_name}</span>
            <Button size="sm" variant="ghost" className="ml-auto text-destructive h-7" onClick={() => clearExtra.mutate('mvp_result')} disabled={clearExtra.isPending}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <TeamPicker teams={teams} value={mvpTeamId} onChange={(id) => { setMvpTeamId(id); setMvpName(''); }} placeholder="Buscar time do MVP" />
        {mvpTeamId && <PlayerPicker teamId={mvpTeamId} value={mvpName} onChange={setMvpName} />}

        <Button
          onClick={() => { if (mvpName && mvpTeamId) setExtra.mutate({ category: 'mvp_result', playerName: mvpName, teamId: mvpTeamId }); }}
          disabled={!mvpName || !mvpTeamId || setExtra.isPending}
          className="w-full gradient-pitch text-primary-foreground font-semibold h-11"
        >
          {setExtra.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar MVP'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const recalculate = useRecalculateScores();
  const fetchFifa = useFetchFifaResults();
  const [activeTab, setActiveTab] = useState<'users' | 'matches' | 'profiles' | 'extras'>('users');
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

      <div className="flex gap-1 p-1 bg-secondary rounded-xl flex-wrap">
        {(['users', 'matches', 'profiles', 'extras'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-[80px] py-2 text-xs font-medium rounded-lg transition-all ${
              activeTab === tab ? 'gradient-pitch text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {tab === 'users' ? t('admin.users') : tab === 'matches' ? t('admin.results') : tab === 'profiles' ? t('admin.multiProfiles') : 'Extras'}
          </button>
        ))}
      </div>

      {activeTab === 'users' && <UserApprovalSection />}
      {activeTab === 'matches' && <MatchResultSection />}
      {activeTab === 'profiles' && <MultiProfileSection />}
      {activeTab === 'extras' && <ExtrasResultsSection />}
    </div>
  );
}
