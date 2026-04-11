import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  profileLoading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;
    let lastHandledUserId: string | null | undefined;

    const clearProfileState = () => {
      if (!isCurrent) return;
      setIsAdmin(false);
      setIsApproved(false);
      setProfileLoading(false);
    };

    const fetchProfileData = async (userId: string) => {
      if (!isCurrent) return;

      setProfileLoading(true);

      try {
        const [profileRes, roleRes] = await Promise.all([
          supabase.from('profiles').select('approved').eq('id', userId).single(),
          supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin'),
        ]);

        if (profileRes.error) throw profileRes.error;
        if (roleRes.error) throw roleRes.error;
        if (!isCurrent || lastHandledUserId !== userId) return;

        setIsApproved(profileRes.data?.approved ?? false);
        setIsAdmin((roleRes.data?.length ?? 0) > 0);
      } catch {
        if (!isCurrent || lastHandledUserId !== userId) return;
        setIsApproved(false);
        setIsAdmin(false);
      } finally {
        if (isCurrent && lastHandledUserId === userId) {
          setProfileLoading(false);
        }
      }
    };

    const handleSession = async (nextSession: Session | null) => {
      const nextUserId = nextSession?.user?.id ?? null;
      const shouldFetchProfile = lastHandledUserId !== nextUserId;

      lastHandledUserId = nextUserId;

      if (!isCurrent) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (!nextUserId) {
        clearProfileState();
        return;
      }

      if (shouldFetchProfile) {
        await fetchProfileData(nextUserId);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void handleSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      void handleSession(currentSession);
    });

    return () => {
      isCurrent = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profile-approval:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setIsApproved(Boolean(payload.new.approved));
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, isApproved, profileLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
