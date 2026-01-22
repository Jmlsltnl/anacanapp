import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for dynamic content - matching database schema
export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  category: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  ingredients: string[] | null;
  instructions: string[] | null;
  image_url: string | null;
  is_active: boolean;
  // Frontend-only properties (not in DB but used for display)
  emoji?: string;
  calories?: number;
  stage?: string;
  benefits?: string[];
}

export interface SafetyItem {
  id: string;
  name: string;
  name_az: string | null;
  category: string;
  safety_level: 'safe' | 'warning' | 'danger';
  description: string | null;
  description_az: string | null;
  is_active: boolean;
}

export interface BabyName {
  id: string;
  name: string;
  gender: 'boy' | 'girl' | 'unisex';
  origin: string | null;
  meaning: string | null;
  meaning_az: string | null;
  popularity: number | null;
  is_active: boolean;
}

export interface HospitalBagItem {
  id: string;
  item_name: string;
  item_name_az: string | null;
  category: string;
  is_essential: boolean;
  sort_order: number | null;
  is_active: boolean;
}

export interface NutritionTip {
  id: string;
  title: string;
  content: string | null;
  category: string;
  trimester: number | null;
  calories: number | null;
  nutrients: string[] | null;
  is_active: boolean;
  // Frontend display helpers
  emoji?: string;
  benefits?: string[];
}

export interface WeeklyTip {
  id: string;
  week_number: number;
  life_stage: string;
  title: string;
  content: string | null;
  is_active: boolean;
}

// Hooks for fetching dynamic content
export const useRecipes = () => {
  return useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_recipes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map DB data to our interface with defaults for missing fields
      return (data || []).map(item => ({
        ...item,
        ingredients: Array.isArray(item.ingredients) ? item.ingredients as string[] : [],
        instructions: Array.isArray(item.instructions) ? item.instructions as string[] : [],
        emoji: '🍽️', // Default emoji
        calories: 0,
        stage: item.category,
        benefits: [],
      })) as Recipe[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSafetyItems = () => {
  return useQuery({
    queryKey: ['safety_items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('safety_items')
        .select('*')
        .eq('is_active', true)
        .order('name_az', { ascending: true });

      if (error) throw error;
      return (data || []) as SafetyItem[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useBabyNames = () => {
  return useQuery({
    queryKey: ['baby_names'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('baby_names_db')
        .select('*')
        .eq('is_active', true)
        .order('popularity', { ascending: false });

      if (error) throw error;
      return (data || []) as BabyName[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useHospitalBagTemplates = () => {
  return useQuery({
    queryKey: ['hospital_bag_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospital_bag_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data || []) as HospitalBagItem[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useNutritionTips = () => {
  return useQuery({
    queryKey: ['nutrition_tips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_tips')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map DB data to our interface with defaults
      return (data || []).map(item => ({
        ...item,
        nutrients: Array.isArray(item.nutrients) ? item.nutrients as string[] : [],
        emoji: '🍎', // Default emoji
        benefits: Array.isArray(item.nutrients) ? item.nutrients as string[] : [],
      })) as NutritionTip[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useWeeklyTips = (weekNumber?: number, lifeStage?: string) => {
  return useQuery({
    queryKey: ['weekly_tips', weekNumber, lifeStage],
    queryFn: async () => {
      let query = supabase
        .from('weekly_tips')
        .select('*')
        .eq('is_active', true);

      if (weekNumber) {
        query = query.eq('week_number', weekNumber);
      }
      if (lifeStage) {
        query = query.eq('life_stage', lifeStage);
      }

      const { data, error } = await query.order('week_number', { ascending: true });

      if (error) throw error;
      return (data || []) as WeeklyTip[];
    },
    staleTime: 1000 * 60 * 5,
  });
};
