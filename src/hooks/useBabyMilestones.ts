import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useBabyMilestonesDB } from './useDynamicConfig';

// Fallback milestone definitions (used while DB loads)
const FALLBACK_MILESTONES = [
  { id: 'first_smile', milestone_key: 'first_smile', week_number: 1, label: 'İlk təbəssüm', label_az: 'İlk təbəssüm', emoji: '😊', description: 'Körpə ilk dəfə təbəssüm etdi', description_az: 'Körpə ilk dəfə təbəssüm etdi' },
  { id: 'head_control', milestone_key: 'head_control', week_number: 4, label: 'Başını tutur', label_az: 'Başını tutur', emoji: '👶', description: 'Körpə başını tutmağa başladı', description_az: 'Körpə başını tutmağa başladı' },
  { id: 'first_laugh', milestone_key: 'first_laugh', week_number: 8, label: 'Gülür', label_az: 'Gülür', emoji: '😄', description: 'Körpə səsli gülməyə başladı', description_az: 'Körpə səsli gülməyə başladı' },
  { id: 'reaching', milestone_key: 'reaching', week_number: 12, label: 'Əl uzadır', label_az: 'Əl uzadır', emoji: '🤲', description: 'Körpə əşyalara əl uzadır', description_az: 'Körpə əşyalara əl uzadır' },
  { id: 'rolling', milestone_key: 'rolling', week_number: 16, label: 'Dönür', label_az: 'Dönür', emoji: '🔄', description: 'Körpə dönə bilir', description_az: 'Körpə dönə bilir' },
  { id: 'sitting', milestone_key: 'sitting', week_number: 24, label: 'Oturur', label_az: 'Oturur', emoji: '🪑', description: 'Körpə dəstəksiz oturur', description_az: 'Körpə dəstəksiz oturur' },
  { id: 'crawling', milestone_key: 'crawling', week_number: 32, label: 'Sürünür', label_az: 'Sürünür', emoji: '🐛', description: 'Körpə sürünməyə başladı', description_az: 'Körpə sürünməyə başladı' },
  { id: 'standing', milestone_key: 'standing', week_number: 40, label: 'Ayağa durur', label_az: 'Ayağa durur', emoji: '🧍', description: 'Körpə ayağa durur', description_az: 'Körpə ayağa durur' },
  { id: 'first_steps', milestone_key: 'first_steps', week_number: 48, label: 'İlk addımlar', label_az: 'İlk addımlar', emoji: '👟', description: 'Körpə ilk addımlarını atdı', description_az: 'Körpə ilk addımlarını atdı' },
  { id: 'first_words', milestone_key: 'first_words', week_number: 52, label: 'İlk sözlər', label_az: 'İlk sözlər', emoji: '💬', description: 'Körpə ilk sözlərini dedi', description_az: 'Körpə ilk sözlərini dedi' },
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
  const { data: dbMilestones, isLoading: dbLoading } = useBabyMilestonesDB();

  // Map DB milestones to the format expected by components
  const MILESTONES = useMemo(() => {
    if (!dbMilestones || dbMilestones.length === 0) {
      return FALLBACK_MILESTONES.map(m => ({
        id: m.milestone_key,
        week: m.week_number,
        label: m.label_az || m.label,
        emoji: m.emoji,
        description: m.description_az || m.description,
      }));
    }
    return dbMilestones.map(m => ({
      id: m.milestone_key,
      week: m.week_number,
      label: m.label_az || m.label,
      emoji: m.emoji,
      description: m.description_az || m.description,
    }));
  }, [dbMilestones]);

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
  }, [user, milestones, toast, MILESTONES]);

  const isMilestoneAchieved = useCallback((milestoneId: string) => {
    return milestones.some(m => m.milestone_id === milestoneId);
  }, [milestones]);

  const getMilestoneDate = useCallback((milestoneId: string) => {
    const milestone = milestones.find(m => m.milestone_id === milestoneId);
    return milestone?.achieved_at ? new Date(milestone.achieved_at) : null;
  }, [milestones]);

  return {
    milestones,
    loading: loading || dbLoading,
    toggleMilestone,
    isMilestoneAchieved,
    getMilestoneDate,
    refetch: fetchMilestones,
    MILESTONES,
  };
};