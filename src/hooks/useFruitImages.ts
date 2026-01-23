import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FRUIT_SIZES } from '@/types/anacan';

interface FruitImage {
  week_number: number;
  fruit_name: string;
  fruit_name_az: string | null;
  emoji: string;
  image_url: string | null;
  length_cm: number;
  weight_g: number;
}

export const useFruitImages = () => {
  return useQuery({
    queryKey: ['fruit-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fruit_size_images')
        .select('*')
        .order('week_number');

      if (error) {
        console.error('Error fetching fruit images:', error);
        return [];
      }

      return data as FruitImage[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Helper to get fruit data for a specific week
export const useFruitDataForWeek = (week: number) => {
  const { data: fruitImages = [] } = useFruitImages();
  
  // First check if there's custom data in the database
  const dbData = fruitImages.find(f => f.week_number === week);
  
  // Get static data from FRUIT_SIZES
  const staticData = FRUIT_SIZES[week];
  
  // Merge data - prefer database values for image, fallback to static for emoji
  return {
    fruit: dbData?.fruit_name || staticData?.fruit || 'Meyvə',
    emoji: dbData?.emoji || staticData?.emoji || '🍎',
    imageUrl: dbData?.image_url || null,
    lengthCm: dbData?.length_cm || staticData?.lengthCm || 0,
    weightG: dbData?.weight_g || staticData?.weightG || 0,
  };
};
