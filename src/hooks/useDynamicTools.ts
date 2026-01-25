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
      
      // Filter by gender: 'all' or 'unisex' means universal, otherwise match specific gender
      if (gender && data) {
        return data.filter(bg => bg.gender === 'all' || bg.gender === 'unisex' || bg.gender === gender);
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
      
      // Filter by gender: 'all' or 'unisex' means universal, otherwise match specific gender
      if (gender && data) {
        return data.filter(o => o.gender === 'all' || o.gender === 'unisex' || o.gender === gender);
      }
      return data;
    },
  });
};

// ===========================================
// HELP CENTER HOOKS
// ===========================================

export interface FAQ {
  id: string;
  question: string;
  question_az: string | null;
  answer: string;
  answer_az: string | null;
  category: string;
  sort_order: number;
  is_active: boolean;
}

export interface SupportCategory {
  id: string;
  category_key: string;
  name: string;
  name_az: string | null;
  emoji: string;
  sort_order: number;
  is_active: boolean;
}

export interface WeightRecommendation {
  id: string;
  trimester: number;
  bmi_category: string;
  min_gain_kg: number;
  max_gain_kg: number;
  weekly_gain_kg: number | null;
  description: string | null;
  description_az: string | null;
  is_active: boolean;
}

export const useFaqs = () => {
  return useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as FAQ[];
    },
  });
};

export const useSupportCategories = () => {
  return useQuery({
    queryKey: ['support-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as SupportCategory[];
    },
  });
};

export const useWeightRecommendations = (trimester?: number) => {
  return useQuery({
    queryKey: ['weight-recommendations', trimester],
    queryFn: async () => {
      let query = supabase
        .from('weight_recommendations')
        .select('*')
        .eq('is_active', true);
      
      if (trimester) {
        query = query.eq('trimester', trimester);
      }
      
      const { data, error } = await query.order('trimester');
      if (error) throw error;
      return data as WeightRecommendation[];
    },
  });
};

// ===========================================
// AI SUGGESTED QUESTIONS HOOKS
// ===========================================

export interface AISuggestedQuestion {
  id: string;
  life_stage: string;
  user_type: 'mother' | 'partner';
  question: string;
  question_az: string | null;
  icon: string;
  color_from: string;
  color_to: string;
  sort_order: number;
  is_active: boolean;
}

export const useAISuggestedQuestions = (lifeStage: string, userType: 'mother' | 'partner') => {
  return useQuery({
    queryKey: ['ai-suggested-questions', lifeStage, userType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_suggested_questions')
        .select('*')
        .eq('is_active', true)
        .eq('life_stage', lifeStage)
        .eq('user_type', userType)
        .order('sort_order');
      if (error) throw error;
      return data as AISuggestedQuestion[];
    },
  });
};

// ===========================================
// TOOL CONFIGS HOOKS
// ===========================================

export interface ToolConfig {
  id: string;
  tool_id: string;
  name: string;
  name_az: string | null;
  description: string | null;
  description_az: string | null;
  icon: string;
  color: string;
  bg_color: string;
  min_week: number | null;
  life_stages: string[];
  requires_partner: boolean;
  partner_name: string | null;
  partner_name_az: string | null;
  partner_description: string | null;
  partner_description_az: string | null;
  sort_order: number;
  is_active: boolean;
}

export const useToolConfigs = () => {
  return useQuery({
    queryKey: ['tool-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tool_configs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as ToolConfig[];
    },
  });
};

// ===========================================
// PHOTOSHOOT IMAGE STYLES HOOKS
// ===========================================

export interface PhotoshootImageStyle {
  id: string;
  style_id: string;
  style_name: string;
  style_name_az: string | null;
  emoji: string;
  prompt_modifier: string | null;
  sort_order: number;
  is_active: boolean;
}

export const usePhotoshootImageStyles = () => {
  return useQuery({
    queryKey: ['photoshoot-image-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photoshoot_image_styles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as PhotoshootImageStyle[];
    },
  });
};

// ===========================================
// HOSPITAL BAG TEMPLATES HOOKS
// ===========================================

export interface HospitalBagTemplate {
  id: string;
  item_name: string;
  item_name_az: string | null;
  category: string;
  is_essential: boolean;
  sort_order: number;
  is_active: boolean;
}

export const useHospitalBagTemplates = () => {
  return useQuery({
    queryKey: ['hospital-bag-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hospital_bag_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as HospitalBagTemplate[];
    },
  });
};
