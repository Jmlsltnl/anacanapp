/**
 * Centralized pregnancy calculation utilities
 * All pregnancy-related date calculations should use these functions
 * to ensure consistency across the entire platform.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const PREGNANCY_DURATION_DAYS = 280; // Standard pregnancy duration from LMP

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get effective due date.
 * Platform rule: if LMP exists, it is the single source of truth (LMP + 280 days).
 * Only fall back to an explicit due date when LMP is missing.
 */
export const getEffectiveDueDate = (
  lastPeriodDate: Date | string | null,
  explicitDueDate?: Date | string | null
): Date | null => {
  if (lastPeriodDate) return calculateDueDate(lastPeriodDate);
  if (explicitDueDate) return startOfDay(new Date(explicitDueDate));
  return null;
};

/**
 * Calculate pregnancy day (1-280) from Last Menstrual Period date
 * Day 1 is the first day of LMP
 */
export const getPregnancyDay = (lastPeriodDate: Date | string | null): number => {
  if (!lastPeriodDate) return 0;
  
  const lmp = new Date(lastPeriodDate);
  const today = new Date();
  
  // Reset time to start of day for accurate day calculation
  lmp.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const daysSinceLMP = Math.floor((today.getTime() - lmp.getTime()) / MS_PER_DAY);
  
  // Pregnancy day is 1-indexed (day 1 = first day of LMP)
  // Clamp between 1 and 280
  return Math.max(1, Math.min(PREGNANCY_DURATION_DAYS, daysSinceLMP + 1));
};

/**
 * Calculate pregnancy week (0-40) from Last Menstrual Period date
 */
export const getPregnancyWeek = (lastPeriodDate: Date | string | null): number => {
  if (!lastPeriodDate) return 0;
  
  const lmp = new Date(lastPeriodDate);
  const today = new Date();
  
  lmp.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const daysSinceLMP = Math.floor((today.getTime() - lmp.getTime()) / MS_PER_DAY);
  
  return Math.max(0, Math.min(40, Math.floor(daysSinceLMP / 7)));
};

/**
 * Calculate day within current week (0-6, where 0 = first day of week)
 */
export const getDayInWeek = (lastPeriodDate: Date | string | null): number => {
  if (!lastPeriodDate) return 0;
  
  const lmp = new Date(lastPeriodDate);
  const today = new Date();
  
  lmp.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const daysSinceLMP = Math.floor((today.getTime() - lmp.getTime()) / MS_PER_DAY);
  
  return daysSinceLMP % 7;
};

/**
 * Calculate days remaining until due date
 */
export const getDaysUntilDue = (
  lastPeriodDate: Date | string | null, 
  dueDate?: Date | string | null
): number => {
  const today = startOfDay(new Date());
  const effectiveDueDate = getEffectiveDueDate(lastPeriodDate, dueDate);
  if (!effectiveDueDate) return 0;

  const daysLeft = Math.ceil((effectiveDueDate.getTime() - today.getTime()) / MS_PER_DAY);
  return Math.max(0, daysLeft);
};

/**
 * Calculate due date from Last Menstrual Period
 */
export const calculateDueDate = (lastPeriodDate: Date | string | null): Date | null => {
  if (!lastPeriodDate) return null;
  
  const lmp = new Date(lastPeriodDate);
  lmp.setHours(0, 0, 0, 0);
  
  return new Date(lmp.getTime() + PREGNANCY_DURATION_DAYS * MS_PER_DAY);
};

/**
 * Get trimester (1, 2, or 3) from pregnancy week
 */
export const getTrimester = (weekNumber: number): 1 | 2 | 3 => {
  if (weekNumber < 13) return 1;
  if (weekNumber < 27) return 2;
  return 3;
};

/**
 * Calculate days elapsed in pregnancy (0-280)
 */
export const getDaysElapsed = (lastPeriodDate: Date | string | null): number => {
  if (!lastPeriodDate) return 0;
  
  const lmp = new Date(lastPeriodDate);
  const today = new Date();
  
  lmp.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const daysSinceLMP = Math.floor((today.getTime() - lmp.getTime()) / MS_PER_DAY);
  
  return Math.max(0, Math.min(PREGNANCY_DURATION_DAYS, daysSinceLMP));
};

/**
 * Calculate progress percentage (0-100) through pregnancy
 */
export const getPregnancyProgress = (lastPeriodDate: Date | string | null): number => {
  const daysElapsed = getDaysElapsed(lastPeriodDate);
  return Math.min(100, (daysElapsed / PREGNANCY_DURATION_DAYS) * 100);
};

/**
 * Get formatted week and day string (e.g., \"3 həftə 5 gün\")
 */
export const getWeekDayString = (lastPeriodDate: Date | string | null): string => {
  const week = getPregnancyWeek(lastPeriodDate);
  const day = getDayInWeek(lastPeriodDate);
  
  return `${week} həftə ${day} gün`;
};

/**
 * Get all pregnancy data in one call
 */
export const getFullPregnancyData = (
  lastPeriodDate: Date | string | null,
  explicitDueDate?: Date | string | null
) => {
  const pregnancyDay = getPregnancyDay(lastPeriodDate);
  const pregnancyWeek = getPregnancyWeek(lastPeriodDate);
  const dayInWeek = getDayInWeek(lastPeriodDate);
  const daysUntilDue = getDaysUntilDue(lastPeriodDate, explicitDueDate);
  const daysElapsed = getDaysElapsed(lastPeriodDate);
  const progressPercent = getPregnancyProgress(lastPeriodDate);
  const trimester = getTrimester(pregnancyWeek);
  const dueDate = getEffectiveDueDate(lastPeriodDate, explicitDueDate);
  
  return {
    pregnancyDay,
    pregnancyWeek,
    dayInWeek,
    daysUntilDue,
    daysElapsed,
    progressPercent,
    trimester,
    dueDate,
    totalDays: PREGNANCY_DURATION_DAYS,
  };
};
