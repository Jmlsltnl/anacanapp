import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PartnerAchievement {
  id: string;
  achievement_key: string;
  name: string;
  name_az: string | null;
  emoji: string;
  description: string | null;
  description_az: string | null;
  unlock_condition: string | null;
  unlock_threshold: number;
  sort_order: number;
  is_active: boolean;
}

export interface PartnerMenuItem {
  id: string;
  menu_key: string;
  label: string;
  label_az: string | null;
  icon_name: string;
  route: string;
  sort_order: number;
  is_active: boolean;
}

export interface SurpriseCategory {
  id: string;
  category_key: string;
  label: string;
  label_az: string | null;
  emoji: string;
  color_gradient: string;
  sort_order: number;
  is_active: boolean;
}

export const usePartnerAchievements = () => {
  return useQuery({
    queryKey: ['partner-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_achievements')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []) as PartnerAchievement[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const usePartnerMenuItems = () => {
  return useQuery({
    queryKey: ['partner-menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_menu_items')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []) as PartnerMenuItem[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useSurpriseCategories = () => {
  return useQuery({
    queryKey: ['surprise-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surprise_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []) as SurpriseCategory[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

// Fallbacks
export const FALLBACK_ACHIEVEMENTS = [
  { achievement_key: 'first_love', name_az: 'İlk Sevgi', emoji: '💕', unlock_condition: 'always_unlocked', unlock_threshold: 0 },
  { achievement_key: 'supporter', name_az: 'Dəstəkçi', emoji: '🤝', unlock_condition: 'always_unlocked', unlock_threshold: 0 },
  { achievement_key: 'caring', name_az: 'Qayğıkeş', emoji: '🌟', unlock_condition: 'completed_surprises', unlock_threshold: 3 },
  { achievement_key: 'super_partner', name_az: 'Super Partner', emoji: '🏆', unlock_condition: 'completed_surprises', unlock_threshold: 10 },
  { achievement_key: 'family_hero', name_az: 'Ailə Qəhrəmanı', emoji: '👑', unlock_condition: 'surprise_points', unlock_threshold: 500 },
];

export const FALLBACK_MENU_ITEMS = [
  { menu_key: 'notifications', label_az: 'Bildirişlər', icon_name: 'Bell', route: 'notifications' },
  { menu_key: 'partner-privacy', label_az: 'Gizlilik', icon_name: 'Shield', route: 'partner-privacy' },
  { menu_key: 'help', label_az: 'Yardım', icon_name: 'HelpCircle', route: 'help' },
];

export const FALLBACK_SURPRISE_CATEGORIES = [
  { category_key: 'romantic', label_az: 'Romantik', emoji: '❤️', color_gradient: 'from-pink-500 to-rose-600' },
  { category_key: 'care', label_az: 'Qayğı', emoji: '🤗', color_gradient: 'from-violet-500 to-purple-600' },
  { category_key: 'adventure', label_az: 'Macəra', emoji: '🌟', color_gradient: 'from-amber-500 to-orange-600' },
  { category_key: 'gift', label_az: 'Hədiyyə', emoji: '🎁', color_gradient: 'from-emerald-500 to-teal-600' },
];
