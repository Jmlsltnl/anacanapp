import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ===========================================
// SAFETY LOOKUP HOOKS
// ===========================================

export const useSafetyCategories = () => {
  return useQuery({
    queryKey: ['safety-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('safety_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
};

export const useSafetyItems = (categoryId?: string) => {
  return useQuery({
    queryKey: ['safety-items', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('safety_items')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (categoryId && categoryId !== 'all') {
        query = query.eq('category', categoryId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// ===========================================
// SHOP CATEGORIES HOOKS
// ===========================================

export const useShopCategories = () => {
  return useQuery({
    queryKey: ['shop-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
};

// ===========================================
// NUTRITION HOOKS
// ===========================================

export const useNutritionTargets = () => {
  return useQuery({
    queryKey: ['nutrition-targets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutrition_targets')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });
};

export const useMealTypes = (lifeStage?: string) => {
  return useQuery({
    queryKey: ['meal-types', lifeStage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      
      if (lifeStage && data) {
        return data.filter(m => m.life_stages?.includes(lifeStage));
      }
      return data;
    },
  });
};

export const useRecipeCategories = (lifeStage?: string) => {
  return useQuery({
    queryKey: ['recipe-categories', lifeStage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipe_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      
      if (lifeStage && data) {
        return data.filter(c => !c.life_stage || c.life_stage === lifeStage);
      }
      return data;
    },
  });
};

// ===========================================
// PHOTOSHOOT HOOKS
// ===========================================

export const usePhotoshootBackgrounds = (gender?: string) => {
  return useQuery({
    queryKey: ['photoshoot-backgrounds', gender],
    queryFn: async () => {
      let query = supabase
        .from('photoshoot_backgrounds')
        .select('*')
        .eq('is_active', true)
        .order('category_id')
        .order('sort_order');
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (gender && gender !== 'unisex' && data) {
        return data.filter(bg => bg.gender === gender || bg.gender === 'unisex');
      }
      return data;
    },
  });
};

export const usePhotoshootEyeColors = () => {
  return useQuery({
    queryKey: ['photoshoot-eye-colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photoshoot_eye_colors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
};

export const usePhotoshootHairColors = () => {
  return useQuery({
    queryKey: ['photoshoot-hair-colors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photoshoot_hair_colors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
};

export const usePhotoshootHairStyles = () => {
  return useQuery({
    queryKey: ['photoshoot-hair-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photoshoot_hair_styles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
};

export const usePhotoshootOutfits = (gender?: string) => {
  return useQuery({
    queryKey: ['photoshoot-outfits', gender],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photoshoot_outfits')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      
      if (gender && gender !== 'unisex' && data) {
        return data.filter(o => o.gender === gender || o.gender === 'unisex');
      }
      return data;
    },
  });
};
