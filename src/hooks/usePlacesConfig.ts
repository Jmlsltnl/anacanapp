import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PlaceCategory {
  id: string;
  category_key: string;
  label: string;
  label_az: string | null;
  icon_name: string;
  color_gradient: string;
  sort_order: number;
  is_active: boolean;
}

export interface PlaceAmenity {
  id: string;
  amenity_key: string;
  label: string;
  label_az: string | null;
  emoji: string;
  sort_order: number;
  is_active: boolean;
}

export const usePlaceCategories = () => {
  return useQuery({
    queryKey: ['place-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []) as PlaceCategory[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const usePlaceAmenities = () => {
  return useQuery({
    queryKey: ['place-amenities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_amenities')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []) as PlaceAmenity[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

// Fallbacks for offline/loading
export const FALLBACK_CATEGORIES = [
  { category_key: 'all', label_az: 'Hamısı', icon_name: 'MapPin', color_gradient: 'from-pink-500 to-rose-600' },
  { category_key: 'cafe', label_az: 'Kafe', icon_name: 'Utensils', color_gradient: 'from-amber-500 to-orange-600' },
  { category_key: 'restaurant', label_az: 'Restoran', icon_name: 'Utensils', color_gradient: 'from-red-500 to-rose-600' },
  { category_key: 'mall', label_az: 'Mall', icon_name: 'Building2', color_gradient: 'from-blue-500 to-indigo-600' },
  { category_key: 'park', label_az: 'Park', icon_name: 'TreePine', color_gradient: 'from-emerald-500 to-green-600' },
];

export const FALLBACK_AMENITIES = [
  { amenity_key: 'has_breastfeeding_room', label_az: 'Əmizdirmə otağı', emoji: '🤱' },
  { amenity_key: 'has_changing_table', label_az: 'Dəyişdirmə masası', emoji: '👶' },
  { amenity_key: 'has_elevator', label_az: 'Lift', emoji: '🛗' },
];
