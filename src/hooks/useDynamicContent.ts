import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/store/userStore';
import { mapRowsTranslation } from '@/lib/tr';

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
  tips?: any;
}

// Hooks for fetching dynamic content
export const useRecipes = () => {
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['recipes', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_recipes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = mapRowsTranslation(data, language, ['title', 'description', 'category', 'ingredients', 'instructions', 'tags']);
      // Map DB data to our interface with defaults for missing fields
      return mapped.map(item => ({
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
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['safety_items', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('safety_items')
        .select('*')
        .eq('is_active', true)
        .order('name_az', { ascending: true });

      if (error) throw error;
      return mapRowsTranslation(data, language, ['name', 'description']) as SafetyItem[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useBabyNames = () => {
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['baby_names', language],
    queryFn: async () => {
      let query = supabase
        .from('baby_names_db')
        .select('*')
        .eq('is_active', true);

      if (language === 'en') {
        query = query.not('origin_en', 'is', null);
      } else {
        query = query.is('origin_en', null);
      }

      const { data, error } = await query.order('popularity', { ascending: false });

      if (error) throw error;
      return mapRowsTranslation(data, language, ['meaning', 'origin']) as BabyName[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useHospitalBagTemplates = () => {
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['hospital_bag_templates', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospital_bag_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return mapRowsTranslation(data, language, ['item_name']) as HospitalBagItem[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useNutritionTips = () => {
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['nutrition_tips', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_tips')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped = mapRowsTranslation(data, language, ['title', 'content']);
      // Map DB data to our interface with defaults
      return mapped.map(item => ({
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
  const language = useUserStore((state) => state.language);
  return useQuery({
    queryKey: ['weekly_tips', weekNumber, lifeStage, language],
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
      return mapRowsTranslation(data, language, ['title', 'content', 'tips']) as WeeklyTip[];
    },
    staleTime: 1000 * 60 * 5,
  });
};
