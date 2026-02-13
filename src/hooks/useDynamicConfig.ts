import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ============ EXERCISES ============
export interface Exercise {
  id: string;
  name: string;
  name_az: string | null;
  duration_minutes: number;
  calories: number;
  level: 'easy' | 'medium' | 'hard';
  trimester: number[];
  icon: string;
  description: string | null;
  steps: string[];
  is_active: boolean;
  sort_order: number;
}

export const useExercises = () => {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []).map(e => ({
        ...e,
        steps: Array.isArray(e.steps) ? e.steps : JSON.parse(e.steps as string || '[]')
      })) as Exercise[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ============ WHITE NOISE SOUNDS ============
export interface WhiteNoiseSound {
  id: string;
  name: string;
  name_az: string | null;
  emoji: string;
  color_gradient: string;
  audio_url: string | null;
  is_active: boolean;
  sort_order: number;
  noise_type: string;
  description: string | null;
  description_az: string | null;
}

export const useWhiteNoiseSounds = () => {
  return useQuery({
    queryKey: ['white-noise-sounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('white_noise_sounds')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as WhiteNoiseSound[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ============ PHOTOSHOOT THEMES ============
export interface PhotoshootTheme {
  id: string;
  category: 'background' | 'outfit' | 'accessory';
  name: string;
  name_az: string | null;
  emoji: string | null;
  prompt_text: string | null;
  preview_url: string | null;
  is_premium: boolean;
  is_active: boolean;
  sort_order: number;
}

export const usePhotoshootThemes = (category?: string) => {
  return useQuery({
    queryKey: ['photoshoot-themes', category],
    queryFn: async () => {
      let query = supabase
        .from('photoshoot_themes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PhotoshootTheme[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ============ SURPRISE IDEAS ============
export interface SurpriseIdea {
  id: string;
  surprise_key?: string;
  title: string;
  title_az?: string | null;
  description: string | null;
  description_az?: string | null;
  emoji: string;
  icon: string;
  category: string;
  difficulty: string;
  points: number;
  is_active: boolean;
  sort_order: number;
}

export const useSurpriseIdeas = () => {
  return useQuery({
    queryKey: ['surprise-ideas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surprise_ideas')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as SurpriseIdea[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ============ BABY MILESTONES ============
export interface BabyMilestoneDB {
  id: string;
  milestone_key: string;
  week_number: number;
  label: string;
  label_az: string | null;
  emoji: string;
  description: string | null;
  description_az: string | null;
  is_active: boolean;
  sort_order: number;
}

export const useBabyMilestonesDB = () => {
  return useQuery({
    queryKey: ['baby-milestones-db'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('baby_milestones_db')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as BabyMilestoneDB[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ============ SYMPTOMS ============
export interface Symptom {
  id: string;
  symptom_key: string;
  label: string;
  label_az: string | null;
  icon: string;
  life_stages: string[];
  is_active: boolean;
  sort_order: number;
}

export const useSymptoms = (lifeStage?: string) => {
  return useQuery({
    queryKey: ['symptoms', lifeStage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      
      let symptoms = data as Symptom[];
      if (lifeStage) {
        symptoms = symptoms.filter(s => s.life_stages.includes(lifeStage));
      }
      return symptoms;
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ============ MOOD OPTIONS ============
export interface MoodOption {
  id: string;
  value: number;
  label: string;
  label_az: string | null;
  emoji: string;
  color_class: string | null;
  is_active: boolean;
}

export const useMoodOptions = () => {
  return useQuery({
    queryKey: ['mood-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_options')
        .select('*')
        .eq('is_active', true)
        .order('value');
      
      if (error) throw error;
      return data as MoodOption[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ============ COMMON FOODS ============
export interface CommonFood {
  id: string;
  name: string;
  name_az: string | null;
  calories: number;
  emoji: string;
  category: string;
  meal_types: string[] | null;
  is_active: boolean;
  sort_order: number;
}

export const useCommonFoods = () => {
  return useQuery({
    queryKey: ['common-foods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('common_foods')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as CommonFood[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ============ SHOP CATEGORIES ============
export interface ShopCategory {
  id: string;
  category_key: string;
  name: string;
  name_az: string | null;
  emoji: string;
  is_active: boolean;
  sort_order: number;
}

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
      return data as ShopCategory[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ============ ADMIN HOOKS ============
export const useExercisesAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['exercises-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data.map(e => ({
        ...e,
        steps: Array.isArray(e.steps) ? e.steps : JSON.parse(e.steps as string || '[]')
      })) as Exercise[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<Exercise>) => {
      const { error } = await supabase.from('exercises').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises-admin'] });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({ title: 'Məşq əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<Exercise> & { id: string }) => {
      const { error } = await supabase.from('exercises').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises-admin'] });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({ title: 'Məşq yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises-admin'] });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({ title: 'Məşq silindi' });
    },
  });

  return { ...query, create, update, remove };
};

export const useWhiteNoiseSoundsAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['white-noise-sounds-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('white_noise_sounds')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as WhiteNoiseSound[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<WhiteNoiseSound>) => {
      const { error } = await supabase.from('white_noise_sounds').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['white-noise-sounds-admin'] });
      queryClient.invalidateQueries({ queryKey: ['white-noise-sounds'] });
      toast({ title: 'Səs əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<WhiteNoiseSound> & { id: string }) => {
      const { error } = await supabase.from('white_noise_sounds').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['white-noise-sounds-admin'] });
      queryClient.invalidateQueries({ queryKey: ['white-noise-sounds'] });
      toast({ title: 'Səs yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('white_noise_sounds').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['white-noise-sounds-admin'] });
      queryClient.invalidateQueries({ queryKey: ['white-noise-sounds'] });
      toast({ title: 'Səs silindi' });
    },
  });

  return { ...query, create, update, remove };
};

export const useSurpriseIdeasAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['surprise-ideas-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surprise_ideas')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as SurpriseIdea[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<SurpriseIdea>) => {
      const { error } = await supabase.from('surprise_ideas').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surprise-ideas-admin'] });
      queryClient.invalidateQueries({ queryKey: ['surprise-ideas'] });
      toast({ title: 'Sürpriz əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<SurpriseIdea> & { id: string }) => {
      const { error } = await supabase.from('surprise_ideas').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surprise-ideas-admin'] });
      queryClient.invalidateQueries({ queryKey: ['surprise-ideas'] });
      toast({ title: 'Sürpriz yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('surprise_ideas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surprise-ideas-admin'] });
      queryClient.invalidateQueries({ queryKey: ['surprise-ideas'] });
      toast({ title: 'Sürpriz silindi' });
    },
  });

  return { ...query, create, update, remove };
};

export const useBabyMilestonesDBAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['baby-milestones-db-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('baby_milestones_db')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as BabyMilestoneDB[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<BabyMilestoneDB>) => {
      const { error } = await supabase.from('baby_milestones_db').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-milestones-db-admin'] });
      queryClient.invalidateQueries({ queryKey: ['baby-milestones-db'] });
      toast({ title: 'Mərhələ əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<BabyMilestoneDB> & { id: string }) => {
      const { error } = await supabase.from('baby_milestones_db').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-milestones-db-admin'] });
      queryClient.invalidateQueries({ queryKey: ['baby-milestones-db'] });
      toast({ title: 'Mərhələ yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('baby_milestones_db').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baby-milestones-db-admin'] });
      queryClient.invalidateQueries({ queryKey: ['baby-milestones-db'] });
      toast({ title: 'Mərhələ silindi' });
    },
  });

  return { ...query, create, update, remove };
};

export const useSymptomsAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['symptoms-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Symptom[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<Symptom>) => {
      const { error } = await supabase.from('symptoms').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms-admin'] });
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      toast({ title: 'Simptom əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<Symptom> & { id: string }) => {
      const { error } = await supabase.from('symptoms').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms-admin'] });
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      toast({ title: 'Simptom yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('symptoms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['symptoms-admin'] });
      queryClient.invalidateQueries({ queryKey: ['symptoms'] });
      toast({ title: 'Simptom silindi' });
    },
  });

  return { ...query, create, update, remove };
};

export const useCommonFoodsAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['common-foods-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('common_foods')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as CommonFood[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<CommonFood>) => {
      const { error } = await supabase.from('common_foods').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['common-foods-admin'] });
      queryClient.invalidateQueries({ queryKey: ['common-foods'] });
      toast({ title: 'Qida əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<CommonFood> & { id: string }) => {
      const { error } = await supabase.from('common_foods').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['common-foods-admin'] });
      queryClient.invalidateQueries({ queryKey: ['common-foods'] });
      toast({ title: 'Qida yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('common_foods').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['common-foods-admin'] });
      queryClient.invalidateQueries({ queryKey: ['common-foods'] });
      toast({ title: 'Qida silindi' });
    },
  });

  return { ...query, create, update, remove };
};

export const useShopCategoriesAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['shop-categories-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shop_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as ShopCategory[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<ShopCategory>) => {
      const { error } = await supabase.from('shop_categories').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['shop-categories'] });
      toast({ title: 'Kateqoriya əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<ShopCategory> & { id: string }) => {
      const { error } = await supabase.from('shop_categories').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['shop-categories'] });
      toast({ title: 'Kateqoriya yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('shop_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-categories-admin'] });
      queryClient.invalidateQueries({ queryKey: ['shop-categories'] });
      toast({ title: 'Kateqoriya silindi' });
    },
  });

  return { ...query, create, update, remove };
};

export const usePhotoshootThemesAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['photoshoot-themes-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photoshoot_themes')
        .select('*')
        .order('category')
        .order('sort_order');
      if (error) throw error;
      return data as PhotoshootTheme[];
    },
  });

  const create = useMutation({
    mutationFn: async (item: Partial<PhotoshootTheme>) => {
      const { error } = await supabase.from('photoshoot_themes').insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoshoot-themes-admin'] });
      queryClient.invalidateQueries({ queryKey: ['photoshoot-themes'] });
      toast({ title: 'Mövzu əlavə edildi' });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<PhotoshootTheme> & { id: string }) => {
      const { error } = await supabase.from('photoshoot_themes').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoshoot-themes-admin'] });
      queryClient.invalidateQueries({ queryKey: ['photoshoot-themes'] });
      toast({ title: 'Mövzu yeniləndi' });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('photoshoot_themes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoshoot-themes-admin'] });
      queryClient.invalidateQueries({ queryKey: ['photoshoot-themes'] });
      toast({ title: 'Mövzu silindi' });
    },
  });

  return { ...query, create, update, remove };
};

export const useMoodOptionsAdmin = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ['mood-options-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_options')
        .select('*')
        .order('value');
      if (error) throw error;
      return data as MoodOption[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: Partial<MoodOption> & { id: string }) => {
      const { error } = await supabase.from('mood_options').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-options-admin'] });
      queryClient.invalidateQueries({ queryKey: ['mood-options'] });
      toast({ title: 'Əhval yeniləndi' });
    },
  });

  return { ...query, update };
};
