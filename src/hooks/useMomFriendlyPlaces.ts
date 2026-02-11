import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MomFriendlyPlace {
  id: string;
  name: string;
  name_az: string | null;
  description: string | null;
  description_az: string | null;
  category: 'cafe' | 'restaurant' | 'park' | 'mall' | 'hospital' | 'metro' | 'pharmacy' | 'playground';
  latitude: number;
  longitude: number;
  address: string | null;
  address_az: string | null;
  phone: string | null;
  website: string | null;
  image_url: string | null;
  has_breastfeeding_room: boolean;
  has_changing_table: boolean;
  has_elevator: boolean;
  has_ramp: boolean;
  has_stroller_access: boolean;
  has_kids_menu: boolean;
  has_play_area: boolean;
  has_high_chair: boolean;
  has_parking: boolean;
  avg_rating: number;
  review_count: number;
  verified_count: number;
  is_verified: boolean;
  created_by: string | null;
  created_at: string;
}

export interface PlaceReview {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  cleanliness_rating: number | null;
  accessibility_rating: number | null;
  staff_rating: number | null;
  is_verified: boolean;
  created_at: string;
}

export const useMomFriendlyPlaces = (filters?: {
  category?: string;
  amenities?: string[];
}) => {
  return useQuery({
    queryKey: ['mom-friendly-places', filters],
    queryFn: async () => {
      let query = supabase
        .from('mom_friendly_places')
        .select('*')
        .eq('is_active', true)
        .order('avg_rating', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category as MomFriendlyPlace['category']);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      let places = data as MomFriendlyPlace[];
      
      // Filter by amenities client-side for flexibility
      if (filters?.amenities?.length) {
        places = places.filter(place => 
          filters.amenities!.every(amenity => (place as any)[amenity] === true)
        );
      }
      
      return places;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const usePlaceReviews = (placeId: string) => {
  return useQuery({
    queryKey: ['place-reviews', placeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_reviews')
        .select('*')
        .eq('place_id', placeId)
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PlaceReview[];
    },
    enabled: !!placeId,
  });
};

export const useAddPlace = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (place: Omit<Partial<MomFriendlyPlace>, 'id' | 'created_at' | 'created_by'>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('mom_friendly_places')
        .insert({
          name: place.name || '',
          latitude: place.latitude || 0,
          longitude: place.longitude || 0,
          category: place.category || 'cafe',
          ...place,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mom-friendly-places'] });
      toast.success('Məkan əlavə edildi! Admin təsdiqindən sonra görünəcək.');
    },
    onError: () => {
      toast.error('Məkan əlavə edilə bilmədi');
    },
  });
};

export const useAddReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (review: {
      place_id: string;
      rating: number;
      comment?: string;
      cleanliness_rating?: number;
      accessibility_rating?: number;
      staff_rating?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('place_reviews')
        .insert({
          ...review,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['place-reviews', variables.place_id] });
      queryClient.invalidateQueries({ queryKey: ['mom-friendly-places'] });
      toast.success('Rəyiniz göndərildi! Admin təsdiqindən sonra görünəcək.');
    },
    onError: () => {
      toast.error('Rəy əlavə edilə bilmədi');
    },
  });
};

export const useVerifyAmenity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (verification: {
      place_id: string;
      amenity_verified: string;
      is_confirmed: boolean;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('place_verifications')
        .upsert({
          ...verification,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mom-friendly-places'] });
      toast.success('Təsdiqiniz üçün təşəkkürlər!');
    },
  });
};
