import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useChildStore } from '@/store/childStore';
import { getRealCalendarAge } from '@/lib/pregnancy-utils';

export interface Child {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  gender: 'boy' | 'girl' | 'unknown';
  avatar_emoji: string;
  is_active: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

// MODUL-səviyyəli guard: useChildren bir neçə komponentdə paralel işləyir —
// per-instans ref yarışa səbəb olub eyni uşağı təkrar yaradırdı
const seedAttemptedUsers = new Set<string>();

export const useChildren = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use Zustand store for global selectedChildId
  const { selectedChildId, setSelectedChildId } = useChildStore();
  
  // Derive selectedChild from children array and store's selectedChildId
  const selectedChild = children.find(c => c.id === selectedChildId) || children[0] || null;
  
  // Wrapper to set selected child - updates the store
  const setSelectedChild = useCallback((child: Child | null) => {
    setSelectedChildId(child?.id || null);
  }, [setSelectedChildId]);

  const fetchChildren = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_children')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      const rows = (data || []) as Child[];

      // Backfill: if this user has baby fields on profile (from onboarding) but no user_children rows yet,
      // create the first child automatically so Profile/Tools can show it.
      // Guard modul-səviyyəlidir + upsert ignoreDuplicates → paralel instansiyalar dublikat yarada bilməz.
      if (rows.length === 0 && !seedAttemptedUsers.has(user.id)) {
        seedAttemptedUsers.add(user.id);

        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('baby_name, baby_birth_date, baby_gender')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profileError && profileRow?.baby_name && profileRow?.baby_birth_date) {
          const normalizedGender: 'boy' | 'girl' =
            profileRow.baby_gender === 'girl' || profileRow.baby_gender === 'boy'
              ? profileRow.baby_gender
              : 'boy';

          const avatarEmoji = normalizedGender === 'girl' ? '👧' : '👦';

          const { error: insertError } = await supabase
            .from('user_children')
            .upsert({
              user_id: user.id,
              name: profileRow.baby_name,
              birth_date: profileRow.baby_birth_date,
              gender: normalizedGender,
              avatar_emoji: avatarEmoji,
              is_active: true,
              sort_order: 0,
            }, { onConflict: 'user_id,name,birth_date', ignoreDuplicates: true });

          if (insertError) {
            console.error('Error seeding first child from profile:', insertError);
          } else {
            // Yenidən oxu — istər biz yaratmışıq, istər paralel instansiya
            const { data: reread } = await supabase
              .from('user_children')
              .select('*')
              .eq('user_id', user.id)
              .eq('is_active', true)
              .order('sort_order');
            const seededRows = (reread || []) as Child[];
            if (seededRows.length > 0) {
              setChildren(seededRows);
              if (!seededRows.some(c => c.id === selectedChildId)) {
                setSelectedChildId(seededRows[0].id);
              }
              setLoading(false);
              return;
            }
          }
        } else if (profileError) {
          console.error('Error fetching profile for child seeding:', profileError);
        }
      }

      setChildren(rows);

      // Auto-select first child if none selected or selected child is not in the list
      if (rows.length > 0) {
        const currentlySelectedExists = rows.some(c => c.id === selectedChildId);
        if (!currentlySelectedExists) {
          setSelectedChildId(rows[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedChildId, setSelectedChildId]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const addChild = useCallback(async (childData: {
    name: string;
    birth_date: string;
    gender?: 'boy' | 'girl' | 'unknown';
    avatar_emoji?: string;
  }) => {
    if (!user) return null;

    try {
      const normalizedGender: 'boy' | 'girl' =
        childData.gender === 'girl' || childData.gender === 'boy' ? childData.gender : 'boy';

      const avatarEmoji = childData.avatar_emoji ?? (normalizedGender === 'girl' ? '👧' : '👦');

      const { data, error } = await supabase
        .from('user_children')
        .insert({
          user_id: user.id,
          name: childData.name,
          birth_date: childData.birth_date,
          gender: normalizedGender,
          avatar_emoji: avatarEmoji,
          is_active: true,
          sort_order: children.length,
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        await fetchChildren();
        return data as Child;
      }
    } catch (error) {
      console.error('Error adding child:', error);
    }
    return null;
  }, [user, children.length, fetchChildren]);

  const updateChild = useCallback(async (childId: string, updates: Partial<Child>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_children')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', childId)
        .eq('user_id', user.id);

      if (!error) {
        await fetchChildren();
        return true;
      }
    } catch (error) {
      console.error('Error updating child:', error);
    }
    return false;
  }, [user, fetchChildren]);

  const deleteChild = useCallback(async (childId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_children')
        .update({ is_active: false })
        .eq('id', childId)
        .eq('user_id', user.id);

      if (!error) {
        if (selectedChild?.id === childId) {
          setSelectedChild(null);
        }
        await fetchChildren();
        return true;
      }
    } catch (error) {
      console.error('Error deleting child:', error);
    }
    return false;
  }, [user, selectedChild, fetchChildren]);

  const getChildAge = useCallback((child: Child) => {
    const age = getRealCalendarAge(child.birth_date);
    const weeks = Math.floor(age.totalDays / 7);

    return {
      days: age.totalDays,
      weeks,
      months: age.months,
      years: age.years,
      remainingMonths: age.remainingMonths,
      remainingDays: age.days,
      displayText: age.displayText,
    };
  }, []);

  return {
    children,
    selectedChild,
    setSelectedChild,
    loading,
    addChild,
    updateChild,
    deleteChild,
    getChildAge,
    refetch: fetchChildren,
    hasChildren: children.length > 0,
    hasMultipleChildren: children.length > 1,
  };
};
