import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ManagedProfile {
  id: string;
  managed_id: string;
  display_name: string;
}

interface ActiveProfileContextType {
  activeUserId: string;
  setActiveUserId: (id: string) => void;
  isActingAsOther: boolean;
  activeDisplayName: string | null;
  managedProfiles: ManagedProfile[];
  isLoadingManaged: boolean;
}

const ActiveProfileContext = createContext<ActiveProfileContextType | null>(null);

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  const effectiveUserId = activeUserId ?? user?.id ?? '';

  const { data: managedProfiles = [], isLoading: isLoadingManaged } = useQuery({
    queryKey: ['managed-profiles', user?.id],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from('managed_profiles')
        .select('id, managed_id')
        .eq('manager_id', user!.id);
      if (error) throw error;
      if (!links?.length) return [];

      const managedIds = links.map(l => l.managed_id);
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', managedIds);
      if (profErr) throw profErr;

      return links.map(l => {
        const prof = profiles?.find(p => p.id === l.managed_id);
        return {
          id: l.id,
          managed_id: l.managed_id,
          display_name: prof?.display_name ?? 'Unknown',
        };
      });
    },
    enabled: !!user,
  });

  const activeDisplayName = useMemo(() => {
    if (!activeUserId || activeUserId === user?.id) return null;
    return managedProfiles.find(p => p.managed_id === activeUserId)?.display_name ?? null;
  }, [activeUserId, user?.id, managedProfiles]);

  const value = useMemo(() => ({
    activeUserId: effectiveUserId,
    setActiveUserId: (id: string) => setActiveUserId(id === user?.id ? null : id),
    isActingAsOther: !!activeUserId && activeUserId !== user?.id,
    activeDisplayName,
    managedProfiles,
    isLoadingManaged,
  }), [effectiveUserId, activeUserId, user?.id, activeDisplayName, managedProfiles, isLoadingManaged]);

  return (
    <ActiveProfileContext.Provider value={value}>
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile() {
  const ctx = useContext(ActiveProfileContext);
  if (!ctx) throw new Error('useActiveProfile must be used within ActiveProfileProvider');
  return ctx;
}
