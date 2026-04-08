import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCustomRankings, CustomRanking } from '@/hooks/useCustomRankings';
import { useRanking } from '@/hooks/useRanking';
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

// Inline filtered ranking list (simplified)
function FilteredRankingList({ ranking, memberIds, userId, t, extrasRevealed }: any) {
  const filtered = ranking?.filter((r: any) => memberIds.includes(r.user_id))
    .sort((a: any, b: any) => (b.points_total ?? 0) - (a.points_total ?? 0)) ?? [];

  if (!filtered.length) return <p className="text-sm text-muted-foreground py-4 text-center">{t('ranking.noParticipants')}</p>;

  return (
    <div className="space-y-2 mt-2">
      {filtered.map((entry: any, idx: number) => {
        const isMe = entry.user_id === userId;
        const position = idx + 1;
        return (
          <div key={entry.user_id} className={`glass rounded-xl p-3 flex items-center gap-3 ${isMe ? 'ring-1 ring-primary' : ''}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs ${
              position === 1 ? 'gradient-gold text-accent-foreground' :
              position === 2 ? 'bg-muted text-foreground' :
              position === 3 ? 'bg-secondary text-accent' :
              'bg-secondary text-muted-foreground'
            }`}>{position}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {entry.display_name}
                {isMe && <span className="text-primary ml-1">{t('ranking.you')}</span>}
              </p>
              <div className="flex gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <span>{t('ranking.matches')}: {entry.points_matches}</span>
                <span>{t('ranking.exact')}: {entry.exact_hits ?? 0}</span>
                {(extrasRevealed || isMe) && entry.champion_flag_url && (
                  <span className="flex items-center gap-1">🏆 <img src={entry.champion_flag_url} alt="" className="w-4 h-3 rounded-sm" /></span>
                )}
              </div>
            </div>
            <span className="text-lg font-display font-bold text-gradient-gold">{entry.points_total ?? 0}</span>
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
              <p className="font-medium text-foreground">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.members.length} {t('ranking.members')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={e => { e.stopPropagation(); openEdit(r); }}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); setDeletingId(r.id); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              {expanded === r.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>
          {expanded === r.id && (
            <div className="px-4 pb-4">
              <FilteredRankingList
                ranking={ranking}
                memberIds={r.members.map(m => m.user_id)}
                userId={user?.id}
                t={t}
                extrasRevealed={extrasRevealed}
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
    </div>
  );
}
