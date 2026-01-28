import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { subDays, format } from 'date-fns';

export interface MoodCheckin {
  id: string;
  user_id: string;
  mood_level: number;
  mood_type: string | null;
  notes: string | null;
  checked_at: string;
  created_at: string;
}

export interface EPDSAssessment {
  id: string;
  user_id: string;
  total_score: number;
  answers: Record<string, number>;
  risk_level: 'low' | 'moderate' | 'high';
  recommendation: string | null;
  completed_at: string;
}

export interface MentalHealthResource {
  id: string;
  name: string;
  name_az: string;
  description: string | null;
  description_az: string | null;
  resource_type: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  address_az: string | null;
  is_emergency: boolean;
}

// EPDS Questions in Azerbaijani
export const EPDS_QUESTIONS = [
  {
    id: 1,
    question: 'Son 7 gün ərzində gülmək və gülməli tərəfləri görmək mümkün oldu:',
    options: [
      { value: 0, label: 'Həmişəki kimi' },
      { value: 1, label: 'İndi o qədər də yox' },
      { value: 2, label: 'Əvvəlki kimi deyil' },
      { value: 3, label: 'Ümumiyyətlə yox' },
    ],
  },
  {
    id: 2,
    question: 'Son 7 gün ərzində gələcəyə həvəslə baxdım:',
    options: [
      { value: 0, label: 'Həmişəki qədər' },
      { value: 1, label: 'Əvvəlkindən bir az az' },
      { value: 2, label: 'Əvvəlkindən xeyli az' },
      { value: 3, label: 'Demək olar ki, heç' },
    ],
  },
  {
    id: 3,
    question: 'Son 7 gün ərzində nəsə səhv getdikdə özümü əsassız yerə günahlandırdım:',
    options: [
      { value: 3, label: 'Bəli, çox vaxt' },
      { value: 2, label: 'Bəli, bəzən' },
      { value: 1, label: 'Tez-tez deyil' },
      { value: 0, label: 'Xeyr, heç vaxt' },
    ],
  },
  {
    id: 4,
    question: 'Son 7 gün ərzində heç bir səbəb olmadan narahat və həyəcanlı oldum:',
    options: [
      { value: 0, label: 'Xeyr, ümumiyyətlə yox' },
      { value: 1, label: 'Demək olar ki, heç' },
      { value: 2, label: 'Bəli, bəzən' },
      { value: 3, label: 'Bəli, çox tez-tez' },
    ],
  },
  {
    id: 5,
    question: 'Son 7 gün ərzində heç bir səbəb olmadan qorxdum və ya panikaya düşdüm:',
    options: [
      { value: 3, label: 'Bəli, kifayət qədər çox' },
      { value: 2, label: 'Bəli, bəzən' },
      { value: 1, label: 'Xeyr, çox deyil' },
      { value: 0, label: 'Xeyr, ümumiyyətlə yox' },
    ],
  },
  {
    id: 6,
    question: 'Son 7 gün ərzində işlər məni çox yüklədi:',
    options: [
      { value: 3, label: 'Bəli, çox vaxt bacarmırdım' },
      { value: 2, label: 'Bəli, bəzən əvvəlki kimi bacarmırdım' },
      { value: 1, label: 'Xeyr, əksər vaxt yaxşı idarə edirdim' },
      { value: 0, label: 'Xeyr, həmişəki kimi idarə edirdim' },
    ],
  },
  {
    id: 7,
    question: 'Son 7 gün ərzində o qədər bədbəxt idim ki, yuxuya getməkdə çətinlik çəkirdim:',
    options: [
      { value: 3, label: 'Bəli, çox vaxt' },
      { value: 2, label: 'Bəli, bəzən' },
      { value: 1, label: 'Tez-tez deyil' },
      { value: 0, label: 'Xeyr, ümumiyyətlə yox' },
    ],
  },
  {
    id: 8,
    question: 'Son 7 gün ərzində özümü kədərli və ya bədbəxt hiss etdim:',
    options: [
      { value: 3, label: 'Bəli, çox vaxt' },
      { value: 2, label: 'Bəli, kifayət qədər tez-tez' },
      { value: 1, label: 'Tez-tez deyil' },
      { value: 0, label: 'Xeyr, ümumiyyətlə yox' },
    ],
  },
  {
    id: 9,
    question: 'Son 7 gün ərzində o qədər bədbəxt idim ki, ağlayırdım:',
    options: [
      { value: 3, label: 'Bəli, çox vaxt' },
      { value: 2, label: 'Bəli, kifayət qədər tez-tez' },
      { value: 1, label: 'Yalnız bəzən' },
      { value: 0, label: 'Xeyr, heç vaxt' },
    ],
  },
  {
    id: 10,
    question: 'Son 7 gün ərzində özümə zərər vermək fikri ağlıma gəldi:',
    options: [
      { value: 3, label: 'Bəli, kifayət qədər tez-tez' },
      { value: 2, label: 'Bəzən' },
      { value: 1, label: 'Demək olar ki, heç' },
      { value: 0, label: 'Heç vaxt' },
    ],
  },
];

export const useMoodCheckins = (days: number = 14) => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['mood-checkins', user?.id, days],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('mood_checkins')
        .select('*')
        .eq('user_id', user.id)
        .gte('checked_at', startDate)
        .order('checked_at', { ascending: false });

      if (error) throw error;
      return data as MoodCheckin[];
    },
    enabled: !!user?.id,
  });
};

export const useTodayMoodCheckin = () => {
  const { user } = useAuthContext();
  const today = format(new Date(), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['mood-checkin-today', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('mood_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('checked_at', today)
        .maybeSingle();

      if (error) throw error;
      return data as MoodCheckin | null;
    },
    enabled: !!user?.id,
  });
};

export const useAddMoodCheckin = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (checkin: {
      mood_level: number;
      mood_type?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('mood_checkins')
        .upsert({
          user_id: user.id,
          checked_at: today,
          ...checkin,
        }, {
          onConflict: 'user_id,checked_at',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['mood-checkin-today'] });
    },
  });
};

export const useEPDSAssessments = () => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['epds-assessments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('epds_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data as EPDSAssessment[];
    },
    enabled: !!user?.id,
  });
};

export const useSubmitEPDS = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthContext();

  return useMutation({
    mutationFn: async (answers: Record<string, number>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
      
      let riskLevel: 'low' | 'moderate' | 'high' = 'low';
      let recommendation = '';

      if (totalScore >= 13) {
        riskLevel = 'high';
        recommendation = 'Nəticələriniz yüksək risk göstərir. Zəhmət olmasa mütəxəssislə əlaqə saxlayın.';
      } else if (totalScore >= 10) {
        riskLevel = 'moderate';
        recommendation = 'Nəticələriniz orta səviyyədə risk göstərir. Həkiminizlə danışmağı tövsiyə edirik.';
      } else {
        recommendation = 'Nəticələriniz normal səviyyədədir. Özünüzə qayğı göstərməyə davam edin.';
      }

      const { data, error } = await supabase
        .from('epds_assessments')
        .insert({
          user_id: user.id,
          total_score: totalScore,
          answers,
          risk_level: riskLevel,
          recommendation,
        })
        .select()
        .single();

      if (error) throw error;
      return data as EPDSAssessment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epds-assessments'] });
    },
  });
};

export const useMentalHealthResources = () => {
  return useQuery({
    queryKey: ['mental-health-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mental_health_resources')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as MentalHealthResource[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

// Check if user should be prompted for EPDS
export const useShouldShowEPDSPrompt = () => {
  const { data: checkins } = useMoodCheckins(14);

  if (!checkins?.length) return false;

  const lowMoodCount = checkins.filter(c => c.mood_level <= 2).length;
  const consecutiveLowDays = getConsecutiveLowMoodDays(checkins);

  return lowMoodCount >= 7 || consecutiveLowDays >= 5;
};

function getConsecutiveLowMoodDays(checkins: MoodCheckin[]): number {
  let maxConsecutive = 0;
  let current = 0;

  const sorted = [...checkins].sort((a, b) => 
    new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()
  );

  for (const checkin of sorted) {
    if (checkin.mood_level <= 2) {
      current++;
      maxConsecutive = Math.max(maxConsecutive, current);
    } else {
      current = 0;
    }
  }

  return maxConsecutive;
}
