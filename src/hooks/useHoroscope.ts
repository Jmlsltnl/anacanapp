import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export interface ZodiacSign {
  id: string;
  name: string;
  name_az: string;
  symbol: string;
  start_date: string;
  end_date: string;
  element: string | null;
  ruling_planet: string | null;
  characteristics_az: string[] | null;
  color: string | null;
}

export interface ZodiacCompatibility {
  id: string;
  sign1: string;
  sign2: string;
  compatibility_score: number;
  relationship_type: string;
  description: string | null;
  description_az: string | null;
}

export interface HoroscopeReading {
  id: string;
  user_id: string;
  baby_sign: string | null;
  mom_sign: string | null;
  dad_sign: string | null;
  compatibility_result: Record<string, any> | null;
  shared_count: number;
  created_at: string;
}

export const useZodiacSigns = () => {
  return useQuery({
    queryKey: ['zodiac-signs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zodiac_signs')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as ZodiacSign[];
    },
    staleTime: 1000 * 60 * 60,
  });
};

export const useZodiacCompatibility = () => {
  return useQuery({
    queryKey: ['zodiac-compatibility'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('zodiac_compatibility')
        .select('*');

      if (error) throw error;
      return data as ZodiacCompatibility[];
    },
    staleTime: 1000 * 60 * 60,
  });
};

export const useHoroscopeReadings = () => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['horoscope-readings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('horoscope_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HoroscopeReading[];
    },
    enabled: !!user?.id,
  });
};

export const useSaveHoroscopeReading = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (reading: {
      baby_sign?: string;
      mom_sign?: string;
      dad_sign?: string;
      compatibility_result: Record<string, any>;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('horoscope_readings')
        .insert({
          user_id: user.id,
          ...reading,
        })
        .select()
        .single();

      if (error) throw error;
      return data as HoroscopeReading;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horoscope-readings'] });
    },
  });
};

// Get zodiac sign from date
export const getZodiacSign = (date: Date, signs: ZodiacSign[]): ZodiacSign | null => {
  const monthDay = format(date, 'MM-dd');

  for (const sign of signs) {
    const start = sign.start_date;
    const end = sign.end_date;

    // Handle signs that cross year boundary (e.g., Capricorn: 12-22 to 01-19)
    if (start > end) {
      if (monthDay >= start || monthDay <= end) {
        return sign;
      }
    } else {
      if (monthDay >= start && monthDay <= end) {
        return sign;
      }
    }
  }

  return null;
};

// Calculate compatibility between two signs
export const calculateCompatibility = (
  sign1: string,
  sign2: string,
  compatibilities: ZodiacCompatibility[],
  relationshipType: string = 'parent_child'
): ZodiacCompatibility | null => {
  const match = compatibilities.find(c => 
    ((c.sign1 === sign1 && c.sign2 === sign2) ||
     (c.sign1 === sign2 && c.sign2 === sign1)) &&
    c.relationship_type === relationshipType
  );

  return match || null;
};

// Generate compatibility description based on elements
export const getElementCompatibility = (element1: string, element2: string): {
  score: number;
  description_az: string;
} => {
  const compatibilityMap: Record<string, Record<string, { score: number; description_az: string }>> = {
    fire: {
      fire: { score: 85, description_az: 'Çox enerjili və dinamik bir əlaqə! Birlikdə hər şeyi bacararsınız.' },
      air: { score: 90, description_az: 'Mükəmməl harmoniya! Hava odu daha da alovlandırır.' },
      earth: { score: 60, description_az: 'Fərqli yanaşmalar, amma bir-birinizi tamamlaya bilərsiniz.' },
      water: { score: 50, description_az: 'Bəzən çətin olsa da, dərin emosional bağ qura bilərsiniz.' },
    },
    earth: {
      fire: { score: 60, description_az: 'Fərqli yanaşmalar, amma bir-birinizi tamamlaya bilərsiniz.' },
      air: { score: 55, description_az: 'Praktik və nəzəri düşüncənin maraqlı birləşməsi.' },
      earth: { score: 95, description_az: 'Çox sabit və etibarlı əlaqə! Birlikdə dağları yerindən tərpədərsiniz.' },
      water: { score: 85, description_az: 'Gözəl harmoniya! Su torpağı canlandırır.' },
    },
    air: {
      fire: { score: 90, description_az: 'Mükəmməl harmoniya! Hava odu daha da alovlandırır.' },
      air: { score: 80, description_az: 'Çox ünsiyyətcil və yaradıcı əlaqə!' },
      earth: { score: 55, description_az: 'Praktik və nəzəri düşüncənin maraqlı birləşməsi.' },
      water: { score: 65, description_az: 'Emosional dərinlik və intellektual ünsiyyətin birləşməsi.' },
    },
    water: {
      fire: { score: 50, description_az: 'Bəzən çətin olsa da, dərin emosional bağ qura bilərsiniz.' },
      air: { score: 65, description_az: 'Emosional dərinlik və intellektual ünsiyyətin birləşməsi.' },
      earth: { score: 85, description_az: 'Gözəl harmoniya! Su torpağı canlandırır.' },
      water: { score: 90, description_az: 'Dərin emosional bağ! Bir-birinizi mükəmməl anlayırsınız.' },
    },
  };

  return compatibilityMap[element1]?.[element2] || { score: 70, description_az: 'Unikal və maraqlı əlaqə!' };
};
