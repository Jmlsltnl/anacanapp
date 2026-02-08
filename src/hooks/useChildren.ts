import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

export const useChildren = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

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

      if (!error && data) {
        setChildren(data as Child[]);
        // Auto-select first child if none selected
        if (data.length > 0 && !selectedChild) {
          setSelectedChild(data[0] as Child);
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedChild]);

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
      const { data, error } = await supabase
        .from('user_children')
        .insert({
          user_id: user.id,
          name: childData.name,
          birth_date: childData.birth_date,
          gender: childData.gender || 'unknown',
          avatar_emoji: childData.avatar_emoji || '👶',
          sort_order: children.length,
        })
        .select()
        .single();

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
    const birth = new Date(child.birth_date);
    const now = new Date();
    
    const diffMs = now.getTime() - birth.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30.44);
    const weeks = Math.floor(diffDays / 7);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    return {
      days: diffDays,
      weeks,
      months,
      years,
      remainingMonths,
      displayText: years > 0 
        ? `${years} yaş ${remainingMonths > 0 ? remainingMonths + ' ay' : ''}`
        : months > 0 
          ? `${months} aylıq`
          : `${weeks} həftəlik`,
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
