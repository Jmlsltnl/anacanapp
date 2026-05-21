import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tr } from '@/lib/tr';
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
    question: tr("usementalhealth_son_7_gun_erzinde_gulmek_ve_gulmeli_tere_69e031", "Son 7 gün ərzində gülmək və gülməli tərəfləri görmək mümkün oldu:"),
    options: [
      { value: 0, label: tr("usementalhealth_hemiseki_kimi_e708ee", "Həmişəki kimi") },
      { value: 1, label: tr("usementalhealth_indi_o_qeder_de_yox_91ad4a", "İndi o qədər də yox") },
      { value: 2, label: tr("usementalhealth_evvelki_kimi_deyil_e73285", "Əvvəlki kimi deyil") },
      { value: 3, label: tr("usementalhealth_umumiyyetle_yox_6e0c1c", "Ümumiyyətlə yox") },
    ],
  },
  {
    id: 2,
    question: tr("usementalhealth_son_7_gun_erzinde_geleceye_hevesle_baxdi_191d48", "Son 7 gün ərzində gələcəyə həvəslə baxdım:"),
    options: [
      { value: 0, label: tr("usementalhealth_hemiseki_qeder_be9ff8", "Həmişəki qədər") },
      { value: 1, label: tr("usementalhealth_evvelkinden_bir_az_az_aa492a", "Əvvəlkindən bir az az") },
      { value: 2, label: tr("usementalhealth_evvelkinden_xeyli_az_b06dd4", "Əvvəlkindən xeyli az") },
      { value: 3, label: tr("usementalhealth_demek_olar_ki_hec_7d8e43", "Demək olar ki, heç") },
    ],
  },
  {
    id: 3,
    question: tr("usementalhealth_son_7_gun_erzinde_nese_sehv_getdikde_ozu_7020d6", "Son 7 gün ərzində nəsə səhv getdikdə özümü əsassız yerə günahlandırdım:"),
    options: [
      { value: 3, label: tr("usementalhealth_beli_cox_vaxt_b3c387", "Bəli, çox vaxt") },
      { value: 2, label: tr("usementalhealth_beli_bezen_3972c9", "Bəli, bəzən") },
      { value: 1, label: 'Tez-tez deyil' },
      { value: 0, label: tr("usementalhealth_xeyr_hec_vaxt_b57661", "Xeyr, heç vaxt") },
    ],
  },
  {
    id: 4,
    question: tr("usementalhealth_son_7_gun_erzinde_hec_bir_sebeb_olmadan__d8ad78", "Son 7 gün ərzində heç bir səbəb olmadan narahat və həyəcanlı oldum:"),
    options: [
      { value: 0, label: tr("usementalhealth_xeyr_umumiyyetle_yox_e2352c", "Xeyr, ümumiyyətlə yox") },
      { value: 1, label: tr("usementalhealth_demek_olar_ki_hec_7d8e43", "Demək olar ki, heç") },
      { value: 2, label: tr("usementalhealth_beli_bezen_3972c9", "Bəli, bəzən") },
      { value: 3, label: tr("usementalhealth_beli_cox_tez_tez_39ed8b", "Bəli, çox tez-tez") },
    ],
  },
  {
    id: 5,
    question: tr("usementalhealth_son_7_gun_erzinde_hec_bir_sebeb_olmadan__ae94a6", "Son 7 gün ərzində heç bir səbəb olmadan qorxdum və ya panikaya düşdüm:"),
    options: [
      { value: 3, label: tr("usementalhealth_beli_kifayet_qeder_cox_b2f3c8", "Bəli, kifayət qədər çox") },
      { value: 2, label: tr("usementalhealth_beli_bezen_3972c9", "Bəli, bəzən") },
      { value: 1, label: tr("usementalhealth_xeyr_cox_deyil_eb8671", "Xeyr, çox deyil") },
      { value: 0, label: tr("usementalhealth_xeyr_umumiyyetle_yox_e2352c", "Xeyr, ümumiyyətlə yox") },
    ],
  },
  {
    id: 6,
    question: tr("usementalhealth_son_7_gun_erzinde_isler_meni_cox_yukledi_ee4b49", "Son 7 gün ərzində işlər məni çox yüklədi:"),
    options: [
      { value: 3, label: tr("usementalhealth_beli_cox_vaxt_bacarmirdim_fe6629", "Bəli, çox vaxt bacarmırdım") },
      { value: 2, label: tr("usementalhealth_beli_bezen_evvelki_kimi_bacarmirdim_b5945c", "Bəli, bəzən əvvəlki kimi bacarmırdım") },
      { value: 1, label: tr("usementalhealth_xeyr_ekser_vaxt_yaxsi_idare_edirdim_e2b859", "Xeyr, əksər vaxt yaxşı idarə edirdim") },
      { value: 0, label: tr("usementalhealth_xeyr_hemiseki_kimi_idare_edirdim_02a4c9", "Xeyr, həmişəki kimi idarə edirdim") },
    ],
  },
  {
    id: 7,
    question: tr("usementalhealth_son_7_gun_erzinde_o_qeder_bedbext_idim_k_1f093c", "Son 7 gün ərzində o qədər bədbəxt idim ki, yuxuya getməkdə çətinlik çəkirdim:"),
    options: [
      { value: 3, label: tr("usementalhealth_beli_cox_vaxt_b3c387", "Bəli, çox vaxt") },
      { value: 2, label: tr("usementalhealth_beli_bezen_3972c9", "Bəli, bəzən") },
      { value: 1, label: 'Tez-tez deyil' },
      { value: 0, label: tr("usementalhealth_xeyr_umumiyyetle_yox_e2352c", "Xeyr, ümumiyyətlə yox") },
    ],
  },
  {
    id: 8,
    question: tr("usementalhealth_son_7_gun_erzinde_ozumu_kederli_ve_ya_be_e00f93", "Son 7 gün ərzində özümü kədərli və ya bədbəxt hiss etdim:"),
    options: [
      { value: 3, label: tr("usementalhealth_beli_cox_vaxt_b3c387", "Bəli, çox vaxt") },
      { value: 2, label: tr("usementalhealth_beli_kifayet_qeder_tez_tez_784be6", "Bəli, kifayət qədər tez-tez") },
      { value: 1, label: 'Tez-tez deyil' },
      { value: 0, label: tr("usementalhealth_xeyr_umumiyyetle_yox_e2352c", "Xeyr, ümumiyyətlə yox") },
    ],
  },
  {
    id: 9,
    question: tr("usementalhealth_son_7_gun_erzinde_o_qeder_bedbext_idim_k_4a4ad7", "Son 7 gün ərzində o qədər bədbəxt idim ki, ağlayırdım:"),
    options: [
      { value: 3, label: tr("usementalhealth_beli_cox_vaxt_b3c387", "Bəli, çox vaxt") },
      { value: 2, label: tr("usementalhealth_beli_kifayet_qeder_tez_tez_784be6", "Bəli, kifayət qədər tez-tez") },
      { value: 1, label: tr("usementalhealth_yalniz_bezen_5e5a2a", "Yalnız bəzən") },
      { value: 0, label: tr("usementalhealth_xeyr_hec_vaxt_b57661", "Xeyr, heç vaxt") },
    ],
  },
  {
    id: 10,
    question: tr("usementalhealth_son_7_gun_erzinde_ozume_zerer_vermek_fik_fabedb", "Son 7 gün ərzində özümə zərər vermək fikri ağlıma gəldi:"),
    options: [
      { value: 3, label: tr("usementalhealth_beli_kifayet_qeder_tez_tez_784be6", "Bəli, kifayət qədər tez-tez") },
      { value: 2, label: tr("usementalhealth_bezen_6f3d8f", "Bəzən") },
      { value: 1, label: tr("usementalhealth_demek_olar_ki_hec_7d8e43", "Demək olar ki, heç") },
      { value: 0, label: tr("usementalhealth_hec_vaxt_7a641b", "Heç vaxt") },
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
