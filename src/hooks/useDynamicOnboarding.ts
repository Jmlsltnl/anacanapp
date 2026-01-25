import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStage {
  id: string;
  stage_id: string;
  title: string;
  title_az: string | null;
  subtitle: string | null;
  subtitle_az: string | null;
  description: string | null;
  description_az: string | null;
  emoji: string;
  icon_name: string;
  bg_gradient: string;
  sort_order: number;
}

interface MultiplesOption {
  id: string;
  option_id: string;
  label: string;
  label_az: string | null;
  emoji: string;
  baby_count: number;
  sort_order: number;
}

// Fetch onboarding stages from database
export const useOnboardingStages = () => {
  return useQuery({
    queryKey: ['onboarding-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_stages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching onboarding stages:', error);
        return [];
      }

      return data as OnboardingStage[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Fetch multiples options from database
export const useMultiplesOptions = () => {
  return useQuery({
    queryKey: ['multiples-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('multiples_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error fetching multiples options:', error);
        return [];
      }

      return data as MultiplesOption[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

// Static fallbacks for when database is empty
export const FALLBACK_STAGES = [
  {
    stage_id: 'flow',
    title_az: 'Dövrümü izləmək',
    subtitle_az: 'Menstruasiya təqvimi',
    description_az: 'Dövrünüzü izləyin, ovulyasiyanı proqnozlaşdırın',
    emoji: '🌸',
    icon_name: 'Calendar',
    bg_gradient: 'from-rose-500 to-pink-600',
  },
  {
    stage_id: 'bump',
    title_az: 'Hamiləliyim',
    subtitle_az: 'Hamiləlik izləyicisi',
    description_az: 'Körpənizin inkişafını həftə-həftə izləyin',
    emoji: '🤰',
    icon_name: 'Heart',
    bg_gradient: 'from-violet-500 to-purple-600',
  },
  {
    stage_id: 'mommy',
    title_az: 'Körpəm var',
    subtitle_az: 'Analıq yardımçısı',
    description_az: 'Körpənizin qidalanma, yuxu və inkişafını izləyin',
    emoji: '👶',
    icon_name: 'Baby',
    bg_gradient: 'from-emerald-500 to-teal-600',
  },
];

export const FALLBACK_MULTIPLES = [
  { option_id: 'single', label_az: 'Tək uşaq', emoji: '👶', baby_count: 1 },
  { option_id: 'twins', label_az: 'Əkiz', emoji: '👶👶', baby_count: 2 },
  { option_id: 'triplets', label_az: 'Üçüz', emoji: '👶👶👶', baby_count: 3 },
  { option_id: 'quadruplets', label_az: 'Dördüz', emoji: '👶👶👶👶', baby_count: 4 },
];
