import { tr } from "@/lib/tr";import { format } from 'date-fns';
import { az, enUS } from 'date-fns/locale';
import { getPersistedLanguage } from './tr';

export const getCurrentDateLocale = () => {
  const lang = getPersistedLanguage();
  return lang === 'en' ? enUS : az;
};
/**
 * Format date to Azerbaijani format: "18 Fevral" or "18 Fevral 2025"
 */
export const getTranslatedMonth = (monthIndex: number): string => {
  const months = [
    tr('month_january', 'Yanvar'),
    tr('month_february', 'Fevral'),
    tr('month_march', 'Mart'),
    tr('month_april', 'Aprel'),
    tr('month_may', 'May'),
    tr('month_june', 'İyun'),
    tr('month_july', 'İyul'),
    tr('month_august', 'Avqust'),
    tr('month_september', 'Sentyabr'),
    tr('month_october', 'Oktyabr'),
    tr('month_november', 'Noyabr'),
    tr('month_december', 'Dekabr')
  ];
  return months[monthIndex] || '';
};

/**
 * Format date to Azerbaijani format: "18 Fevral" or "18 Fevral 2025"
 */
export const formatDateAz = (date: Date | string, includeYear = false): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const day = d.getDate();
  const month = getTranslatedMonth(d.getMonth());
  const year = d.getFullYear();
  return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
};

/**
 * Format date with time: "18 Fevral, 14:30"
 */
export const formatDateTimeAz = (date: Date | string, includeYear = false): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const day = d.getDate();
  const month = getTranslatedMonth(d.getMonth());
  const year = d.getFullYear();
  const time = format(d, 'HH:mm');
  return includeYear ? `${day} ${month} ${year}, ${time}` : `${day} ${month}, ${time}`;
};

/**
 * Format time only: "14:30"
 */
export const formatTimeAz = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  return format(d, 'HH:mm', { locale: getCurrentDateLocale() });
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
    return `${tr("dateutils_today", "Bu gün")}, ${formatTimeAz(d)}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `${tr("dateutils_yesterday", "Dünən")}, ${formatTimeAz(d)}`;
  }

  return formatDateTimeAz(d);
};

/**
 * Symptom translation map - English to Azerbaijani
 */
export const symptomTranslations: Record<string, string> = {
  // Common symptoms
  'headache': tr("dateutils_basagrisi_9e17a3", "Ba\u015Fa\u011Fr\u0131s\u0131"),
  'Headache': tr("dateutils_basagrisi_9e17a3", "Ba\u015Fa\u011Fr\u0131s\u0131"),
  'tired': tr("dateutils_yorgunluq_c68d62", "Yor\u011Funluq"),
  'Tired': tr("dateutils_yorgunluq_c68d62", "Yor\u011Funluq"),
  'fatigue': tr("dateutils_yorgunluq_c68d62", "Yor\u011Funluq"),
  'Fatigue': tr("dateutils_yorgunluq_c68d62", "Yor\u011Funluq"),
  'nausea': tr("dateutils_urekbulanma_a42830", "\xDCr\u0259kbulanma"),
  'Nausea': tr("dateutils_urekbulanma_a42830", "\xDCr\u0259kbulanma"),
  'cramps': tr("dateutils_sanci_350c2d", "Sanc\u0131"),
  'Cramps': tr("dateutils_sanci_350c2d", "Sanc\u0131"),
  'bloating': tr("dateutils_siskinlik_7c7923", "\u015Ei\u015Fkinlik"),
  'Bloating': tr("dateutils_siskinlik_7c7923", "\u015Ei\u015Fkinlik"),
  'back_pain': tr("dateutils_bel_agrisi_9e824e", "Bel a\u011Fr\u0131s\u0131"),
  'backpain': tr("dateutils_bel_agrisi_9e824e", "Bel a\u011Fr\u0131s\u0131"),
  'Back Pain': tr("dateutils_bel_agrisi_9e824e", "Bel a\u011Fr\u0131s\u0131"),
  'mood_swings': tr("dateutils_ehval_deyisikliyi_9fa36f", "\u018Fhval d\u0259yi\u015Fikliyi"),
  'Mood Swings': tr("dateutils_ehval_deyisikliyi_9fa36f", "\u018Fhval d\u0259yi\u015Fikliyi"),
  'insomnia': tr("dateutils_yuxusuzluq_68d6ab", "Yuxusuzluq"),
  'Insomnia': tr("dateutils_yuxusuzluq_68d6ab", "Yuxusuzluq"),
  'appetite_changes': tr("dateutils_i_stah_deyisikliyi_fea8a7", "\u0130\u015Ftah d\u0259yi\u015Fikliyi"),
  'Appetite Changes': tr("dateutils_i_stah_deyisikliyi_fea8a7", "\u0130\u015Ftah d\u0259yi\u015Fikliyi"),
  'breast_tenderness': tr("dateutils_dos_hessasligi_326b6d", "D\xF6\u015F h\u0259ssasl\u0131\u011F\u0131"),
  'Breast Tenderness': tr("dateutils_dos_hessasligi_326b6d", "D\xF6\u015F h\u0259ssasl\u0131\u011F\u0131"),
  'acne': tr("dateutils_sizanaq_0b0664", "S\u0131zanaq"),
  'Acne': tr("dateutils_sizanaq_0b0664", "S\u0131zanaq"),
  'dizziness': tr("dateutils_basgicellenme_9e0b89", "Ba\u015Fgic\u0259ll\u0259nm\u0259"),
  'Dizziness': tr("dateutils_basgicellenme_9e0b89", "Ba\u015Fgic\u0259ll\u0259nm\u0259"),
  'anxiety': tr("dateutils_narahatliq_33f05c", "Narahatl\u0131q"),
  'Anxiety': tr("dateutils_narahatliq_33f05c", "Narahatl\u0131q"),
  'stress': 'Stress',
  'Stress': 'Stress',
  'swelling': tr("dateutils_sislik_cd02e0", "\u015Ei\u015Flik"),
  'Swelling': tr("dateutils_sislik_cd02e0", "\u015Ei\u015Flik"),
  'constipation': tr("dateutils_qebizlik_aef088", "Q\u0259bizlik"),
  'Constipation': tr("dateutils_qebizlik_aef088", "Q\u0259bizlik"),
  'heartburn': tr("dateutils_kopukleme_2d7a33", "K\xF6p\xFCkl\u0259m\u0259"),
  'Heartburn': tr("dateutils_kopukleme_2d7a33", "K\xF6p\xFCkl\u0259m\u0259"),
  'frequent_urination': tr("dateutils_tez_tez_sidike_getme_bfc357", "Tez-tez sidik\u0259 getm\u0259"),
  'Frequent Urination': tr("dateutils_tez_tez_sidike_getme_bfc357", "Tez-tez sidik\u0259 getm\u0259"),
  'hot_flashes': tr("dateutils_i_stilikler_9c6091", "\u0130stilikl\u0259r"),
  'Hot Flashes': tr("dateutils_i_stilikler_9c6091", "\u0130stilikl\u0259r"),
  'cravings': tr("dateutils_i_stah_artimi_2b1e0b", "\u0130\u015Ftah art\u0131m\u0131"),
  'Cravings': tr("dateutils_i_stah_artimi_2b1e0b", "\u0130\u015Ftah art\u0131m\u0131"),
  // Flow specific
  'bas_agrisi': tr("dateutils_basagrisi_9e17a3", "Ba\u015Fa\u011Fr\u0131s\u0131"),
  'sanci': tr("dateutils_sanci_350c2d", "Sanc\u0131"),
  'yorgunluq': tr("dateutils_yorgunluq_c68d62", "Yor\u011Funluq"),
  'siskinlik': tr("dateutils_siskinlik_7c7923", "\u015Ei\u015Fkinlik"),
  'bel_agrisi': tr("dateutils_bel_agrisi_9e824e", "Bel a\u011Fr\u0131s\u0131"),
  'ehval_deyisikliyi': tr("dateutils_ehval_deyisikliyi_9fa36f", "\u018Fhval d\u0259yi\u015Fikliyi")
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