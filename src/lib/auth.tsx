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

  const fetchProfileData = async (userId: string) => {
    setProfileLoading(true);
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('approved').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin'),
      ]);
      setIsApproved(profileRes.data?.approved ?? false);
      setIsAdmin((roleRes.data?.length ?? 0) > 0);
    } catch {
      setIsApproved(false);
      setIsAdmin(false);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    // Use a flag to avoid double fetchProfileData on mount
    let initialSessionHandled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        // Skip if getSession already handled this
        if (!initialSessionHandled) {
          initialSessionHandled = true;
          setTimeout(() => fetchProfileData(session.user.id), 0);
        }
      } else {
        setIsAdmin(false);
        setIsApproved(false);
        setProfileLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (initialSessionHandled) return; // onAuthStateChange already fired
      initialSessionHandled = true;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchProfileData(session.user.id);
      } else {
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
