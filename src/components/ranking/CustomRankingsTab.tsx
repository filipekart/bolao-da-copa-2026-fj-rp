import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCustomRankings, CustomRanking } from '@/hooks/useCustomRankings';
import { useRanking } from '@/hooks/useRanking';
import { useGroupRanking } from '@/hooks/useGroupRanking';
import { useRoundRanking } from '@/hooks/useRoundRanking';
import { useAuth } from '@/lib/auth';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

import { Flag } from '@/components/Flag';
import { computePositions } from '@/lib/rankingPositions';

type Phase = 'geral' | 'grupos' | 'round1' | 'round2' | 'round3' | 'knockout';

// Inline filtered ranking list (simplified)
function FilteredRankingList({ ranking, memberIds, userId, t, pointsField }: any) {
  const filtered = ranking?.filter((r: any) => memberIds.includes(r.user_id))
    .sort((a: any, b: any) => {
      const pointsDiff = (b[pointsField] ?? 0) - (a[pointsField] ?? 0);
      if (pointsDiff !== 0) return pointsDiff;
      const exactDiff = (b.exact_hits ?? 0) - (a.exact_hits ?? 0);
      if (exactDiff !== 0) return exactDiff;
      return (a.display_name ?? '').localeCompare(b.display_name ?? '', 'pt', { sensitivity: 'base' });
    }) ?? [];

  if (!filtered.length) return <p className="text-sm text-muted-foreground py-4 text-center">{t('ranking.noParticipants')}</p>;

  const positions = computePositions<any>(filtered, [pointsField, 'exact_hits']);

  return (
    <div className="space-y-2 mt-2">
      {filtered.map((entry: any, idx: number) => {
        const isMe = entry.user_id === userId;
        const position = positions[idx];
        return (
          <div key={entry.user_id} className={`glass rounded-xl p-3 flex items-center gap-2 ${isMe ? 'ring-1 ring-primary' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-sm shrink-0 ${
              position === 1 ? 'gradient-gold text-accent-foreground' :
              position === 2 ? 'bg-muted text-foreground' :
              position === 3 ? 'bg-secondary text-accent' :
              'bg-secondary text-muted-foreground'
            }`}>{position}</div>
            <p className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">
              {entry.display_name}
              {isMe && <span className="text-primary ml-1">{t('ranking.you')}</span>}
            </p>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground whitespace-nowrap shrink-0">
              PE: {entry.exact_hits ?? 0}
            </span>
            <span className="text-lg font-display font-bold text-gradient-gold shrink-0 min-w-[2ch] text-right">
              {entry[pointsField] ?? 0}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function CustomRankingsTab({ extrasRevealed }: { extrasRevealed: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: rankings, isLoading, createRanking, updateRanking, deleteRanking } = useCustomRankings();
  const { data: ranking } = useRanking();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [phaseByRanking, setPhaseByRanking] = useState<Record<string, Phase>>({});

  // Enable phase fetches only when at least one card uses them
  const activePhases = new Set(Object.values(phaseByRanking));
  const { data: groupRanking } = useGroupRanking(activePhases.has('grupos'));
  const { data: round1 } = useRoundRanking('round1', activePhases.has('round1'));
  const { data: round2 } = useRoundRanking('round2', activePhases.has('round2'));
  const { data: round3 } = useRoundRanking('round3', activePhases.has('round3'));
  const { data: knockout } = useRoundRanking('knockout', activePhases.has('knockout'));

  const getSource = (phase: Phase) => {
    switch (phase) {
      case 'grupos': return { source: groupRanking, field: 'group_points' as const };
      case 'round1': return { source: round1, field: 'round_points' as const };
      case 'round2': return { source: round2, field: 'round_points' as const };
      case 'round3': return { source: round3, field: 'round_points' as const };
      case 'knockout': return { source: knockout, field: 'round_points' as const };
      default: return { source: ranking, field: 'points_total' as const };
    }
  };

  const phaseOptions: { value: Phase; label: string }[] = [
    { value: 'geral', label: t('ranking.general') },
    { value: 'grupos', label: t('ranking.groupStage') },
    { value: 'round1', label: t('ranking.round1') },
    { value: 'round2', label: t('ranking.round2') },
    { value: 'round3', label: t('ranking.round3') },
    { value: 'knockout', label: t('ranking.knockout') },
  ];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRanking, setEditingRanking] = useState<CustomRanking | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { data: allProfiles } = useQuery({
    queryKey: ['public-profiles-for-custom-ranking'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_public_profiles');
      return (data ?? []).filter((p: any) => p.approved).sort((a: any, b: any) => a.display_name.localeCompare(b.display_name));
    },
  });

  const openCreate = () => {
    setEditingRanking(null);
    setName('');
    setSelectedMembers(user ? [user.id] : []);
    setDialogOpen(true);
  };

  const openEdit = (r: CustomRanking) => {
    setEditingRanking(r);
    setName(r.name);
    setSelectedMembers(r.members.map(m => m.user_id));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editingRanking) {
        await updateRanking.mutateAsync({ id: editingRanking.id, name: name.trim(), memberIds: selectedMembers });
        toast.success(t('ranking.rankingSaved'));
      } else {
        await createRanking.mutateAsync({ name: name.trim(), memberIds: selectedMembers });
        toast.success(t('ranking.rankingCreated'));
      }
      setDialogOpen(false);
    } catch {
      toast.error('Erro');
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteRanking.mutateAsync(deletingId);
      toast.success(t('ranking.rankingDeleted'));
    } catch {
      toast.error('Erro');
    }
    setDeletingId(null);
  };

  const toggleMember = (uid: string) => {
    if (uid === user?.id) return; // owner always included
    setSelectedMembers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  if (isLoading) return <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mt-8" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Star className="w-4 h-4 text-accent" /> {t('ranking.myRankings')}
        </h2>
        <Button size="sm" variant="outline" onClick={openCreate} className="gap-1">
          <Plus className="w-4 h-4" /> {t('ranking.createRanking')}
        </Button>
      </div>

      {!rankings?.length && (
        <p className="text-center text-muted-foreground text-sm py-8">{t('ranking.noCustomRankings')}</p>
      )}

      {rankings?.map(r => (
        <div key={r.id} className="glass rounded-xl overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{r.name}</p>
                {r.owner_id !== user?.id && (
                  <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                    {t('ranking.shared')}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{r.members.length} {t('ranking.members')}</p>
            </div>
            <div className="flex items-center gap-2">
              {r.owner_id === user?.id && (
                <>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(r); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); setDeletingId(r.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              {expanded === r.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>
          {expanded === r.id && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-1 mb-2">
                {phaseOptions.map(opt => {
                  const current = phaseByRanking[r.id] ?? 'geral';
                  const isActive = current === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setPhaseByRanking(prev => ({ ...prev, [r.id]: opt.value }))}
                      className={`text-[11px] px-2 py-1 rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <FilteredRankingList
                ranking={getSource(phaseByRanking[r.id] ?? 'geral').source}
                pointsField={getSource(phaseByRanking[r.id] ?? 'geral').field}
                memberIds={r.members.map(m => m.user_id)}
                userId={user?.id}
                t={t}
              />
            </div>
          )}
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRanking ? t('ranking.editRanking') : t('ranking.createRanking')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <Input
              placeholder={t('ranking.rankingName')}
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <p className="text-sm font-medium text-foreground">{t('ranking.selectMembers')}</p>
            <div className="flex-1 overflow-y-auto space-y-1 border rounded-lg p-2">
              {allProfiles?.map((p: any) => (
                <label key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-secondary cursor-pointer">
                  <Checkbox
                    checked={selectedMembers.includes(p.id)}
                    onCheckedChange={() => toggleMember(p.id)}
                    disabled={p.id === user?.id}
                  />
                  <span className="text-sm text-foreground">
                    {p.display_name}
                    {p.id === user?.id && <span className="text-primary ml-1">{t('ranking.you')}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={!name.trim() || createRanking.isPending || updateRanking.isPending}>
              {(createRanking.isPending || updateRanking.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingRanking ? t('ranking.save') : t('ranking.createRanking')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={open => { if (!open) setDeletingId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ranking.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('ranking.confirmDeleteMessage')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('ranking.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('ranking.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
