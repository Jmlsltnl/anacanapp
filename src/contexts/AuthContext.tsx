import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
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
  baby_count: number | null;
  multiples_type: 'single' | 'twins' | 'triplets' | 'quadruplets' | null;
  start_weight: number | null;
  is_premium: boolean | null;
  premium_until: string | null;
  badge_type: string | null;
  bio: string | null;
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
  signInWithApple: () => Promise<{ data: any; error: any }>;
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
    setLinkedPartnerId,
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

      // Sync linked partner ID
      setLinkedPartnerId(profileData.linked_partner_id);

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
    [setOnboarded, setPartnerCode, setLastPeriodDate, setCycleLength, setPeriodLength, setDueDate, setBabyData, setRole, setLifeStage, setLinkedPartnerId]
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
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      return { data: result, error: null };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { data: null, error };
    }
  };

  const signInWithApple = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth('apple', {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      return { data: result, error: null };
    } catch (error) {
      console.error('Apple sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      // Ignore AuthSessionMissingError - session already gone
      if (error && error.name !== 'AuthSessionMissingError') {
        console.error('Sign out error:', error);
      }
    } catch (error: any) {
      // Still clear state even if signOut throws
      if (error?.name !== 'AuthSessionMissingError') {
        console.error('Sign out error:', error);
      }
    } finally {
      // Always clear local state regardless of server response
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);
      storeLogout();
    }
    return { error: null };
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
    let bootstrapTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const clearBootstrapTimeout = () => {
      if (bootstrapTimeoutId) {
        clearTimeout(bootstrapTimeoutId);
        bootstrapTimeoutId = null;
      }
    };

    const finishLoading = () => {
      if (!mounted) return;
      clearBootstrapTimeout();
      setLoading(false);
    };

    // Failsafe: never let the app stay stuck behind a global loading spinner.
    bootstrapTimeoutId = setTimeout(() => {
      if (!mounted) return;
      console.warn('Auth bootstrap timeout - forcing loading=false');
      finishLoading();
    }, 5000);

    const hydrateUser = async (u: User) => {
      try {
        const [profileRes, roleRes] = await Promise.allSettled([
          fetchProfile(u.id),
          fetchUserRole(u.id),
        ]);

        if (!mounted) return;

        const profileData = profileRes.status === 'fulfilled' ? profileRes.value : null;
        const roleData = roleRes.status === 'fulfilled' ? roleRes.value : null;

        setProfile(profileData);
        setUserRole(roleData);

        setAuth(
          true,
          u.id,
          u.email || '',
          profileData?.name || u.user_metadata?.name || 'İstifadəçi'
        );
        syncProfileToStore(profileData);
      } catch (error) {
        console.error('Error hydrating user:', error);
        // Don't clear user/session on hydration error - keep the session alive
      }
    };

    // Single source of truth: only onAuthStateChange handles auth state.
    // No separate initializeAuth / getSession call to avoid race conditions.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event, currentSession?.user?.email);
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
        setUserRole(null);
        storeLogout();
        finishLoading();
        return;
      }

      if (event === 'INITIAL_SESSION') {
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          // Set auth immediately so UI doesn't flash to login
          setAuth(
            true,
            currentSession.user.id,
            currentSession.user.email || '',
            currentSession.user.user_metadata?.name || 'İstifadəçi'
          );
          finishLoading();
          // Hydrate profile data in the background
          void hydrateUser(currentSession.user);
        } else {
          // No session on initial load - user is truly not logged in
          storeLogout();
          finishLoading();
        }
        return;
      }

      if (event === 'SIGNED_IN') {
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          setAuth(
            true,
            currentSession.user.id,
            currentSession.user.email || '',
            currentSession.user.user_metadata?.name || 'İstifadəçi'
          );
          finishLoading();
          void hydrateUser(currentSession.user);
        }
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        if (currentSession?.user) {
          // Silently update session - don't re-hydrate to avoid flickering
          setSession(currentSession);
          setUser(currentSession.user);
        }
        // Do NOT call storeLogout if token refresh comes back without a session
        // The session might still be recoverable
        return;
      }

      // USER_UPDATED and other events
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        finishLoading();
        void hydrateUser(currentSession.user);
      }
    });

    return () => {
      mounted = false;
      clearBootstrapTimeout();
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        signInWithApple,
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
