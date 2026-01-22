import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Milestone definitions
export const MILESTONES = [
  { id: 'first_smile', week: 1, label: 'İlk təbəssüm', emoji: '😊', description: 'Körpə ilk dəfə təbəssüm etdi' },
  { id: 'head_control', week: 4, label: 'Başını tutur', emoji: '👶', description: 'Körpə başını tutmağa başladı' },
  { id: 'first_laugh', week: 8, label: 'Gülür', emoji: '😄', description: 'Körpə səsli gülməyə başladı' },
  { id: 'reaching', week: 12, label: 'Əl uzadır', emoji: '🤲', description: 'Körpə əşyalara əl uzadır' },
  { id: 'rolling', week: 16, label: 'Dönür', emoji: '🔄', description: 'Körpə dönə bilir' },
  { id: 'sitting', week: 24, label: 'Oturur', emoji: '🪑', description: 'Körpə dəstəksiz oturur' },
  { id: 'crawling', week: 32, label: 'Sürünür', emoji: '🐛', description: 'Körpə sürünməyə başladı' },
  { id: 'standing', week: 40, label: 'Ayağa durur', emoji: '🧍', description: 'Körpə ayağa durur' },
  { id: 'first_steps', week: 48, label: 'İlk addımlar', emoji: '👟', description: 'Körpə ilk addımlarını atdı' },
  { id: 'first_words', week: 52, label: 'İlk sözlər', emoji: '💬', description: 'Körpə ilk sözlərini dedi' },
];

export interface BabyMilestone {
  id: string;
  user_id: string;
  milestone_id: string;
  achieved_at: string;
  notes: string | null;
  created_at: string;
}

export const useBabyMilestones = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<BabyMilestone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMilestones = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('baby_milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('achieved_at', { ascending: false });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMilestones();

    // Subscribe to realtime updates
    if (user) {
      const channel = supabase
        .channel('milestones-channel')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'baby_milestones',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchMilestones();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchMilestones]);

  const toggleMilestone = useCallback(async (milestoneId: string, notes?: string) => {
    if (!user) return;

    const existing = milestones.find(m => m.milestone_id === milestoneId);

    try {
      if (existing) {
        // Remove milestone
        const { error } = await supabase
          .from('baby_milestones')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;

        setMilestones(prev => prev.filter(m => m.id !== existing.id));
        toast({
          title: 'Mərhələ silindi',
          description: 'İnkişaf mərhələsi silindi',
        });
      } else {
        // Add milestone
        const { data, error } = await supabase
          .from('baby_milestones')
          .insert({
            user_id: user.id,
            milestone_id: milestoneId,
            notes: notes || null,
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setMilestones(prev => [data, ...prev]);
          const milestoneDetails = MILESTONES.find(m => m.id === milestoneId);
          toast({
            title: `🎉 ${milestoneDetails?.label || 'Mərhələ'} qeyd edildi!`,
            description: milestoneDetails?.description,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling milestone:', error);
      toast({
        title: 'Xəta',
        description: 'Mərhələ qeyd edilə bilmədi',
        variant: 'destructive',
      });
    }
  }, [user, milestones, toast]);

  const isMilestoneAchieved = useCallback((milestoneId: string) => {
    return milestones.some(m => m.milestone_id === milestoneId);
  }, [milestones]);

  const getMilestoneDate = useCallback((milestoneId: string) => {
    const milestone = milestones.find(m => m.milestone_id === milestoneId);
    return milestone?.achieved_at ? new Date(milestone.achieved_at) : null;
  }, [milestones]);

  return {
    milestones,
    loading,
    toggleMilestone,
    isMilestoneAchieved,
    getMilestoneDate,
    refetch: fetchMilestones,
    MILESTONES,
  };
};
