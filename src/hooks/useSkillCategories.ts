import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SkillCategory {
  id: string;
  skill_key: string;
  label: string;
  label_az: string | null;
  emoji: string;
  icon_name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export const useSkillCategories = () => {
  return useQuery({
    queryKey: ['skill-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []) as SkillCategory[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const FALLBACK_SKILL_CATEGORIES = [
  { skill_key: 'motor', label_az: 'Motor Bacarıqları', emoji: '🏃', color: 'bg-blue-500' },
  { skill_key: 'sensory', label_az: 'Hissi İnkişaf', emoji: '👁️', color: 'bg-purple-500' },
  { skill_key: 'cognitive', label_az: 'İdrak', emoji: '🧠', color: 'bg-amber-500' },
  { skill_key: 'language', label_az: 'Dil', emoji: '💬', color: 'bg-green-500' },
  { skill_key: 'social', label_az: 'Sosial', emoji: '👥', color: 'bg-pink-500' },
];
