// Anacan Type Definitions

export type LifeStage = 'flow' | 'bump' | 'mommy' | 'partner';

export type UserRole = 'woman' | 'partner';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  lifeStage: LifeStage;
  avatarUrl?: string;
  partnerCode?: string;
  linkedPartnerId?: string;
  createdAt: Date;
}

export interface CycleData {
  lastPeriodDate: Date;
  cycleLength: number;
  periodLength: number;
  currentDay: number;
  phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
  fertileWindow: { start: Date; end: Date };
  nextPeriodDate: Date;
}

export interface PregnancyData {
  dueDate: Date;
  lastPeriodDate: Date;
  currentWeek: number;
  currentDay: number;
  trimester: 1 | 2 | 3;
  babySize: {
    fruit: string;
    lengthCm: number;
    weightG: number;
  };
}

export interface BabyData {
  id: string;
  name: string;
  birthDate: Date;
  gender: 'boy' | 'girl';
  ageInDays: number;
  ageInMonths: number;
  avatarUrl?: string;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: Date;
  mood?: 1 | 2 | 3 | 4 | 5;
  symptoms?: string[];
  waterIntake?: number;
  temperature?: number;
  notes?: string;
  bleeding?: 'light' | 'medium' | 'heavy' | 'spotting';
}

export interface BabyLog {
  id: string;
  babyId: string;
  type: 'sleep' | 'feed' | 'diaper';
  startTime: Date;
  endTime?: Date;
  feedSide?: 'left' | 'right' | 'bottle';
  diaperType?: 'wet' | 'dirty' | 'both';
  notes?: string;
}

export interface PartnerMission {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  basedOn?: string; // symptom that triggered this mission
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  stages: LifeStage[];
}

export const SYMPTOMS = [
  { id: 'headache', label: 'Baş ağrısı', icon: '🤕' },
  { id: 'cramps', label: 'Sancı', icon: '😣' },
  { id: 'bloating', label: 'Şişkinlik', icon: '🫄' },
  { id: 'fatigue', label: 'Yorğunluq', icon: '😴' },
  { id: 'mood_swings', label: 'Əhval dəyişikliyi', icon: '🎭' },
  { id: 'nausea', label: 'Ürək bulanması', icon: '🤢' },
  { id: 'back_pain', label: 'Bel ağrısı', icon: '🔙' },
  { id: 'breast_tenderness', label: 'Döş həssaslığı', icon: '💗' },
  { id: 'acne', label: 'Sızanaq', icon: '😖' },
  { id: 'cravings', label: 'İştah', icon: '🍫' },
];

export const MOODS = [
  { value: 1, label: 'Çox pis', emoji: '😢' },
  { value: 2, label: 'Pis', emoji: '😔' },
  { value: 3, label: 'Normal', emoji: '😐' },
  { value: 4, label: 'Yaxşı', emoji: '😊' },
  { value: 5, label: 'Əla', emoji: '🥰' },
];

export const FRUIT_SIZES: Record<number, { fruit: string; emoji: string; lengthCm: number; weightG: number }> = {
  4: { fruit: 'Xaşxaş toxumu', emoji: '🌱', lengthCm: 0.1, weightG: 0.04 },
  5: { fruit: 'Susam', emoji: '🫘', lengthCm: 0.2, weightG: 0.1 },
  6: { fruit: 'Mərci', emoji: '🫛', lengthCm: 0.4, weightG: 0.2 },
  7: { fruit: 'Moruq', emoji: '🫐', lengthCm: 1.0, weightG: 1 },
  8: { fruit: 'Noxud', emoji: '🟢', lengthCm: 1.6, weightG: 2 },
  9: { fruit: 'Gilas', emoji: '🍒', lengthCm: 2.3, weightG: 4 },
  10: { fruit: 'Qoz', emoji: '🌰', lengthCm: 3.1, weightG: 7 },
  11: { fruit: 'Əncir', emoji: '🫒', lengthCm: 4.1, weightG: 10 },
  12: { fruit: 'Limon', emoji: '🍋', lengthCm: 5.4, weightG: 14 },
  13: { fruit: 'Şaftalı', emoji: '🍑', lengthCm: 7.4, weightG: 23 },
  14: { fruit: 'Limon', emoji: '🍋', lengthCm: 8.7, weightG: 43 },
  15: { fruit: 'Alma', emoji: '🍎', lengthCm: 10.1, weightG: 70 },
  16: { fruit: 'Avokado', emoji: '🥑', lengthCm: 11.6, weightG: 100 },
  17: { fruit: 'Armud', emoji: '🍐', lengthCm: 13, weightG: 140 },
  18: { fruit: 'Bibər', emoji: '🫑', lengthCm: 14.2, weightG: 190 },
  19: { fruit: 'Pomidor', emoji: '🍅', lengthCm: 15.3, weightG: 240 },
  20: { fruit: 'Banan', emoji: '🍌', lengthCm: 16.4, weightG: 300 },
  24: { fruit: 'Qarğıdalı', emoji: '🌽', lengthCm: 21.3, weightG: 600 },
  28: { fruit: 'Badımcan', emoji: '🍆', lengthCm: 25.4, weightG: 1000 },
  32: { fruit: 'Çiyələk', emoji: '🍓', lengthCm: 27.4, weightG: 1700 },
  36: { fruit: 'Kəşniş', emoji: '🥬', lengthCm: 34, weightG: 2600 },
  40: { fruit: 'Qarpız', emoji: '🍉', lengthCm: 36, weightG: 3400 },
};
