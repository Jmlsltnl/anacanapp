import { tr } from '@/lib/tr';

/**
 * Qan təzyiqi təsnifatı — AHA + hamiləlik (preeklampsiya) hədləri.
 * Hamiləlikdə: ≥140/90 = hipertenziya (həkim), ≥160/110 = ağır (təcili).
 */

export type BpCategory =
'low' // <90/60
| 'normal' // <120/80
| 'elevated' // 120-129 / <80
| 'stage1' // 130-139 / 80-89
| 'stage2' // ≥140 / ≥90
| 'crisis'; // ≥180 / ≥120

export interface BpAssessment {
  category: BpCategory;
  label: string;
  emoji: string;
  /** a-* palitra tint/ink */
  bg: string;
  ink: string;
  guidance: string;
  /** Hamiləlikdə xüsusi xəbərdarlıq (preeklampsiya) */
  pregnancyAlert: 'none' | 'warning' | 'urgent';
}

export function classifyBp(systolic: number, diastolic: number, isPregnant: boolean): BpAssessment {
  let category: BpCategory;
  if (systolic >= 180 || diastolic >= 120) category = 'crisis';else
  if (systolic >= 140 || diastolic >= 90) category = 'stage2';else
  if (systolic >= 130 || diastolic >= 80) category = 'stage1';else
  if (systolic >= 120) category = 'elevated';else
  if (systolic < 90 || diastolic < 60) category = 'low';else
  category = 'normal';

  // Hamiləlik overlay-i
  let pregnancyAlert: BpAssessment['pregnancyAlert'] = 'none';
  if (isPregnant) {
    if (systolic >= 160 || diastolic >= 110) pregnancyAlert = 'urgent';else
    if (systolic >= 140 || diastolic >= 90) pregnancyAlert = 'warning';
  }

  const META: Record<BpCategory, Omit<BpAssessment, 'category' | 'pregnancyAlert'>> = {
    low: {
      label: tr('bp_cat_low', 'Aşağı'),
      emoji: '🥶',
      bg: 'var(--a-blue-1)', ink: 'var(--a-blue-ink)',
      guidance: tr('bp_guide_low', 'Başgicəllənmə hiss edirsinizsə oturun, su için. Təkrarlanırsa həkimə bildirin.')
    },
    normal: {
      label: tr('bp_cat_normal', 'Normal'),
      emoji: '💚',
      bg: 'var(--a-green-1)', ink: 'var(--a-green-ink)',
      guidance: tr('bp_guide_normal', 'Əla! Təzyiqiniz sağlam aralıqdadır.')
    },
    elevated: {
      label: tr('bp_cat_elevated', 'Yüksəlmiş'),
      emoji: '🟡',
      bg: 'var(--a-yellow-1)', ink: 'var(--a-yellow-ink)',
      guidance: tr('bp_guide_elevated', 'Duz qəbulunu azaldın, istirahət edin və müntəzəm ölçün.')
    },
    stage1: {
      label: tr('bp_cat_stage1', 'Hipertenziya I'),
      emoji: '🟠',
      bg: 'var(--a-peach-1)', ink: 'var(--a-accent-ink)',
      guidance: tr('bp_guide_stage1', 'Bir neçə gün ardıcıl yüksəkdirsə həkiminizlə məsləhətləşin.')
    },
    stage2: {
      label: tr('bp_cat_stage2', 'Hipertenziya II'),
      emoji: '🔴',
      bg: 'var(--a-alert-bg)', ink: 'var(--a-alert-ink)',
      guidance: tr('bp_guide_stage2', 'Bu gün həkiminizlə əlaqə saxlayın.')
    },
    crisis: {
      label: tr('bp_cat_crisis', 'Hipertonik böhran'),
      emoji: '🚨',
      bg: 'var(--a-alert-bg)', ink: 'var(--a-alert-ink)',
      guidance: tr('bp_guide_crisis', 'DƏRHAL təcili yardıma (103) müraciət edin!')
    }
  };

  return { category, pregnancyAlert, ...META[category] };
}
