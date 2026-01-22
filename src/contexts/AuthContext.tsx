import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/store/userStore';
import type { User, Session } from '@supabase/supabase-js';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  life_stage: 'flow' | 'bump' | 'mommy' | 'partner' | null;
  partner_code: string | null;
  linked_partner_id: string | null;
  avatar_url: string | null;
  cycle_length: number;
  period_length: number;
  last_period_date: string | null;
  due_date: string | null;
  baby_birth_date: string | null;
  baby_name: string | null;
  baby_gender: 'boy' | 'girl' | null;
  start_weight: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  role: 'admin' | 'user' | 'moderator';
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: any; error: any }>;
  linkPartner: (partnerCode: string) => Promise<{ error: any }>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─────────────────────────────────────────
// Provider
// ─────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    setAuth,
    setRole,
    setLifeStage,
    setOnboarded,
    setLastPeriodDate,
    setCycleLength,
    setPeriodLength,
    setDueDate,
    setBabyData,
    setPartnerCode,
    logout: storeLogout,
  } = useUserStore();

  // ─────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  const fetchUserRole = useCallback(async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const rolesPriority = ['admin', 'moderator', 'user'];
      const highestRole = rolesPriority.find((r) => data.some((d) => d.role === r));
      return highestRole ? { role: highestRole as UserRole['role'] } : null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  }, []);

  const syncProfileToStore = useCallback(
    (profileData: Profile | null) => {
      if (!profileData) {
        setOnboarded(false);
        return;
      }

      if (profileData.partner_code) setPartnerCode(profileData.partner_code);
      if (profileData.last_period_date) setLastPeriodDate(new Date(profileData.last_period_date));
      if (profileData.cycle_length) setCycleLength(profileData.cycle_length);
      if (profileData.period_length) setPeriodLength(profileData.period_length);
      if (profileData.due_date) setDueDate(new Date(profileData.due_date));

      if (profileData.baby_birth_date && profileData.baby_name && profileData.baby_gender) {
        setBabyData(new Date(profileData.baby_birth_date), profileData.baby_name, profileData.baby_gender);
      }

      if (profileData.life_stage === 'partner') {
        setRole('partner');
      } else {
        setRole('woman');
      }

      if (profileData.life_stage) {
        setLifeStage(profileData.life_stage as any);
        setOnboarded(true);
      } else {
        setOnboarded(false);
      }
    },
    [setOnboarded, setPartnerCode, setLastPeriodDate, setCycleLength, setPeriodLength, setDueDate, setBabyData, setRole, setLifeStage]
  );

  // ─────────────────────────────────────────
  // Auth actions
  // ─────────────────────────────────────────
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { name },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);
      storeLogout();
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: 'No user logged in' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      const newProfile = data as Profile;
      setProfile(newProfile);
      syncProfileToStore(newProfile);
      return { data: newProfile, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  };

  const linkPartner = async (partnerCode: string) => {
    if (!user) return { error: 'No user logged in' };
    try {
      const { data: partnerProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('partner_code', partnerCode)
        .maybeSingle();

      if (findError || !partnerProfile) return { error: 'Partner code not found' };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ linked_partner_id: partnerProfile.id, life_stage: 'partner' as const })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { data: myProfile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
      if (myProfile) {
        await supabase.from('profiles').update({ linked_partner_id: myProfile.id }).eq('user_id', partnerProfile.user_id);
      }

      const newProfile = await fetchProfile(user.id);
      setProfile(newProfile);
      syncProfileToStore(newProfile);
      return { error: null };
    } catch (error) {
      console.error('Link partner error:', error);
      return { error };
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const [profileData, roleData] = await Promise.all([fetchProfile(user.id), fetchUserRole(user.id)]);
    setProfile(profileData);
    setUserRole(roleData);
    syncProfileToStore(profileData);
  }, [user, fetchProfile, fetchUserRole, syncProfileToStore]);

  // ─────────────────────────────────────────
  // Init & listener
  // ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);

          const [profileData, roleData] = await Promise.all([
            fetchProfile(initialSession.user.id),
            fetchUserRole(initialSession.user.id),
          ]);

          if (!mounted) return;

          setProfile(profileData);
          setUserRole(roleData);
          setAuth(
            true,
            initialSession.user.id,
            initialSession.user.email || '',
            profileData?.name || initialSession.user.user_metadata?.name || 'İstifadəçi'
          );
          syncProfileToStore(profileData);
        } else {
          storeLogout();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event, currentSession?.user?.email);
      if (!mounted) return;

      try {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const [profileData, roleData] = await Promise.all([
            fetchProfile(currentSession.user.id),
            fetchUserRole(currentSession.user.id),
          ]);

          if (!mounted) return;

          setProfile(profileData);
          setUserRole(roleData);
          setAuth(
            true,
            currentSession.user.id,
            currentSession.user.email || '',
            profileData?.name || currentSession.user.user_metadata?.name || 'İstifadəçi'
          );
          syncProfileToStore(profileData);
        } else {
          setProfile(null);
          setUserRole(null);
          storeLogout();
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchUserRole, setAuth, syncProfileToStore, storeLogout]);

  const isAdmin = userRole?.role === 'admin';
  const isModerator = userRole?.role === 'moderator' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        userRole,
        loading,
        isAdmin,
        isModerator,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        linkPartner,
        fetchProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────
// Hook
// ─────────────────────────────────────────
export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
};
