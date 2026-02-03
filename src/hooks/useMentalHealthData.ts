import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EPDSQuestion {
  id: string;
  question_number: number;
  question_text: string;
  question_text_az: string | null;
  options: { value: number; text: string; text_az: string }[];
  is_reverse_scored: boolean;
}

export interface MoodLevel {
  id: string;
  mood_value: number;
  label: string;
  label_az: string | null;
  emoji: string;
  color: string | null;
}

export interface BreathingExercise {
  id: string;
  name: string;
  name_az: string | null;
  description: string | null;
  description_az: string | null;
  icon: string | null;
  color: string | null;
  inhale_seconds: number;
  hold_seconds: number;
  exhale_seconds: number;
  hold_after_exhale_seconds: number;
  total_cycles: number;
  benefits_az: string[] | null;
}

export interface NoiseThreshold {
  id: string;
  threshold_key: string;
  min_db: number;
  max_db: number | null;
  label: string;
  label_az: string | null;
  color: string | null;
  emoji: string | null;
  description_az: string | null;
}

export const useEPDSQuestionsDB = () => {
  return useQuery({
    queryKey: ['epds-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epds_questions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return (data || []).map(q => ({
        ...q,
        options: (q.options as { value: number; text: string; text_az: string }[]) || [],
      })) as EPDSQuestion[];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useMoodLevelsDB = () => {
  return useQuery({
    queryKey: ['mood-levels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_levels')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as MoodLevel[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useBreathingExercisesDB = () => {
  return useQuery({
    queryKey: ['breathing-exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breathing_exercises')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as BreathingExercise[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

export const useNoiseThresholdsDB = () => {
  return useQuery({
    queryKey: ['noise-thresholds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('noise_thresholds')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as NoiseThreshold[];
    },
    staleTime: 1000 * 60 * 30,
  });
};

// Fallback data for when DB is empty
export const FALLBACK_MOOD_LEVELS: MoodLevel[] = [
  { id: '1', mood_value: 1, label: 'Very Bad', label_az: 'Çox pis', emoji: '😢', color: '#ef4444' },
  { id: '2', mood_value: 2, label: 'Bad', label_az: 'Pis', emoji: '😔', color: '#f97316' },
  { id: '3', mood_value: 3, label: 'Okay', label_az: 'Normal', emoji: '😐', color: '#eab308' },
  { id: '4', mood_value: 4, label: 'Good', label_az: 'Yaxşı', emoji: '😊', color: '#22c55e' },
  { id: '5', mood_value: 5, label: 'Great', label_az: 'Əla', emoji: '🥰', color: '#10b981' },
];

export const FALLBACK_BREATHING_EXERCISES: BreathingExercise[] = [
  { 
    id: '1', 
    name: '4-7-8 Breathing', 
    name_az: '4-7-8 Nəfəs',
    description: 'A relaxation technique that promotes calm and sleep',
    description_az: 'Sakitlik və yuxuya kömək edən relaksasiya texnikası',
    icon: 'Wind',
    color: '#8b5cf6',
    inhale_seconds: 4,
    hold_seconds: 7,
    exhale_seconds: 8,
    hold_after_exhale_seconds: 0,
    total_cycles: 4,
    benefits_az: ['Stressi azaldır', 'Yuxuya kömək edir']
  },
  { 
    id: '2', 
    name: 'Box Breathing', 
    name_az: 'Qutu Nəfəsi',
    description: 'A technique used by Navy SEALs for stress control',
    description_az: 'Stress nəzarəti üçün texnika',
    icon: 'Square',
    color: '#3b82f6',
    inhale_seconds: 4,
    hold_seconds: 4,
    exhale_seconds: 4,
    hold_after_exhale_seconds: 4,
    total_cycles: 4,
    benefits_az: ['Diqqəti artırır', 'Narahatlığı azaldır']
  },
];
