import { format } from 'date-fns';
import { az } from 'date-fns/locale';

/**
 * Format date to Azerbaijani format: "18 Fevral" or "18 Fevral 2025"
 */
export const formatDateAz = (date: Date | string, includeYear = false): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const formatStr = includeYear ? 'd MMMM yyyy' : 'd MMMM';
  return format(d, formatStr, { locale: az });
};

/**
 * Format date with time: "18 Fevral, 14:30"
 */
export const formatDateTimeAz = (date: Date | string, includeYear = false): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const formatStr = includeYear ? 'd MMMM yyyy, HH:mm' : 'd MMMM, HH:mm';
  return format(d, formatStr, { locale: az });
};

/**
 * Format time only: "14:30"
 */
export const formatTimeAz = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  return format(d, 'HH:mm', { locale: az });
};

/**
 * Format relative date: "Bu gün", "Dünən", or full date
 */
export const formatRelativeDateAz = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) {
    return `Bu gün, ${formatTimeAz(d)}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Dünən, ${formatTimeAz(d)}`;
  }
  
  return formatDateTimeAz(d);
};

/**
 * Symptom translation map - English to Azerbaijani
 */
export const symptomTranslations: Record<string, string> = {
  // Common symptoms
  'headache': 'Başağrısı',
  'Headache': 'Başağrısı',
  'tired': 'Yorğunluq',
  'Tired': 'Yorğunluq',
  'fatigue': 'Yorğunluq',
  'Fatigue': 'Yorğunluq',
  'nausea': 'Ürəkbulanma',
  'Nausea': 'Ürəkbulanma',
  'cramps': 'Sancı',
  'Cramps': 'Sancı',
  'bloating': 'Şişkinlik',
  'Bloating': 'Şişkinlik',
  'back_pain': 'Bel ağrısı',
  'backpain': 'Bel ağrısı',
  'Back Pain': 'Bel ağrısı',
  'mood_swings': 'Əhval dəyişikliyi',
  'Mood Swings': 'Əhval dəyişikliyi',
  'insomnia': 'Yuxusuzluq',
  'Insomnia': 'Yuxusuzluq',
  'appetite_changes': 'İştah dəyişikliyi',
  'Appetite Changes': 'İştah dəyişikliyi',
  'breast_tenderness': 'Döş həssaslığı',
  'Breast Tenderness': 'Döş həssaslığı',
  'acne': 'Sızanaq',
  'Acne': 'Sızanaq',
  'dizziness': 'Başgicəllənmə',
  'Dizziness': 'Başgicəllənmə',
  'anxiety': 'Narahatlıq',
  'Anxiety': 'Narahatlıq',
  'stress': 'Stress',
  'Stress': 'Stress',
  'swelling': 'Şişlik',
  'Swelling': 'Şişlik',
  'constipation': 'Qəbizlik',
  'Constipation': 'Qəbizlik',
  'heartburn': 'Köpükləmə',
  'Heartburn': 'Köpükləmə',
  'frequent_urination': 'Tez-tez sidikə getmə',
  'Frequent Urination': 'Tez-tez sidikə getmə',
  'hot_flashes': 'İstiliklər',
  'Hot Flashes': 'İstiliklər',
  'cravings': 'İştah artımı',
  'Cravings': 'İştah artımı',
  // Flow specific
  'bas_agrisi': 'Başağrısı',
  'sanci': 'Sancı',
  'yorgunluq': 'Yorğunluq',
  'siskinlik': 'Şişkinlik',
  'bel_agrisi': 'Bel ağrısı',
  'ehval_deyisikliyi': 'Əhval dəyişikliyi',
};

/**
 * Translate symptom to Azerbaijani
 */
export const translateSymptom = (symptom: string): string => {
  // First check exact match
  if (symptomTranslations[symptom]) {
    return symptomTranslations[symptom];
  }
  
  // Check lowercase
  const lowerSymptom = symptom.toLowerCase();
  if (symptomTranslations[lowerSymptom]) {
    return symptomTranslations[lowerSymptom];
  }
  
  // Return original if no translation found (already in Azerbaijani)
  return symptom;
};

/**
 * Translate array of symptoms
 */
export const translateSymptoms = (symptoms: string[]): string[] => {
  return symptoms.map(translateSymptom);
};
