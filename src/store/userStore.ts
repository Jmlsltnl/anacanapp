import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LifeStage, UserRole, DailyLog, CycleData, PregnancyData, BabyData } from '@/types/anacan';
import { FRUIT_SIZES } from '@/types/anacan';

interface UserState {
  isAuthenticated: boolean;
  isOnboarded: boolean;
  userId: string | null;
  email: string | null;
  name: string | null;
  role: UserRole;
  lifeStage: LifeStage | null;
  partnerCode: string | null;
  linkedPartnerId: string | null;
  
  // Life stage specific data
  lastPeriodDate: Date | null;
  cycleLength: number;
  periodLength: number;
  dueDate: Date | null;
  babyBirthDate: Date | null;
  babyName: string | null;
  babyGender: 'boy' | 'girl' | null;
  babyCount: number;
  multiplesType: 'single' | 'twins' | 'triplets' | 'quadruplets' | null;
  
  // Partner's woman data (for partner mode)
  partnerWomanData: {
    name: string;
    lifeStage: LifeStage;
    mood?: number;
    symptoms?: string[];
  } | null;
  
  // Actions
  setAuth: (isAuth: boolean, userId?: string, email?: string, name?: string) => void;
  setOnboarded: (isOnboarded: boolean) => void;
  setLifeStage: (stage: LifeStage) => void;
  setRole: (role: UserRole) => void;
  setLastPeriodDate: (date: Date) => void;
  setCycleLength: (length: number) => void;
  setPeriodLength: (length: number) => void;
  setDueDate: (date: Date) => void;
  setBabyData: (birthDate: Date, name: string, gender: 'boy' | 'girl', babyCount?: number, multiplesType?: 'single' | 'twins' | 'triplets' | 'quadruplets') => void;
  setPartnerCode: (code: string) => void;
  setPartnerWomanData: (data: UserState['partnerWomanData']) => void;
  setMultiplesData: (babyCount: number, multiplesType: 'single' | 'twins' | 'triplets' | 'quadruplets') => void;
  logout: () => void;
  
  // Computed
  getCycleData: () => CycleData | null;
  getPregnancyData: () => PregnancyData | null;
  getBabyData: () => BabyData | null;
}

const generatePartnerCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'ANACAN-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isOnboarded: false,
      userId: null,
      email: null,
      name: null,
      role: 'woman',
      lifeStage: null,
      partnerCode: null,
      linkedPartnerId: null,
      lastPeriodDate: null,
      cycleLength: 28,
      periodLength: 5,
      dueDate: null,
      babyBirthDate: null,
      babyName: null,
      babyGender: null,
      babyCount: 1,
      multiplesType: null,
      partnerWomanData: null,

      setAuth: (isAuth, userId, email, name) => set({
        isAuthenticated: isAuth,
        userId: userId || null,
        email: email || null,
        name: name || null,
        partnerCode: isAuth ? generatePartnerCode() : null,
      }),

      setOnboarded: (isOnboarded) => set({ isOnboarded }),

      setLifeStage: (stage) => set({ lifeStage: stage }),

      setRole: (role) => set({ role }),

      setLastPeriodDate: (date) => set({ lastPeriodDate: date }),

      setCycleLength: (length) => set({ cycleLength: length }),

      setPeriodLength: (length) => set({ periodLength: length }),

      setDueDate: (date) => set({ dueDate: date }),

      setBabyData: (birthDate, name, gender, babyCount = 1, multiplesType = 'single') => set({
        babyBirthDate: birthDate,
        babyName: name,
        babyGender: gender,
        babyCount,
        multiplesType,
      }),

      setMultiplesData: (babyCount, multiplesType) => set({ babyCount, multiplesType }),

      setPartnerCode: (code) => set({ partnerCode: code }),

      setPartnerWomanData: (data) => set({ partnerWomanData: data }),

      logout: () => set({
        isAuthenticated: false,
        isOnboarded: false,
        userId: null,
        email: null,
        name: null,
        role: 'woman',
        lifeStage: null,
        partnerCode: null,
        linkedPartnerId: null,
        lastPeriodDate: null,
        dueDate: null,
        babyBirthDate: null,
        babyName: null,
        babyGender: null,
        babyCount: 1,
        multiplesType: null,
        partnerWomanData: null,
      }),

      getCycleData: () => {
        const { lastPeriodDate, cycleLength, periodLength } = get();
        if (!lastPeriodDate) return null;

        const today = new Date();
        const lastPeriod = new Date(lastPeriodDate);
        const daysSincePeriod = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
        const currentDay = (daysSincePeriod % cycleLength) + 1;
        
        let phase: CycleData['phase'];
        if (currentDay <= periodLength) {
          phase = 'menstrual';
        } else if (currentDay <= 13) {
          phase = 'follicular';
        } else if (currentDay <= 16) {
          phase = 'ovulation';
        } else {
          phase = 'luteal';
        }

        const ovulationDay = cycleLength - 14;
        const fertileStart = new Date(lastPeriod);
        fertileStart.setDate(fertileStart.getDate() + ovulationDay - 5);
        const fertileEnd = new Date(lastPeriod);
        fertileEnd.setDate(fertileEnd.getDate() + ovulationDay + 1);

        const nextPeriodDate = new Date(lastPeriod);
        nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);

        return {
          lastPeriodDate: lastPeriod,
          cycleLength,
          periodLength,
          currentDay,
          phase,
          fertileWindow: { start: fertileStart, end: fertileEnd },
          nextPeriodDate,
        };
      },

      getPregnancyData: () => {
        const { lastPeriodDate, dueDate } = get();
        if (!lastPeriodDate) return null;

        const today = new Date();
        const lastPeriod = new Date(lastPeriodDate);
        const daysSinceLMP = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.floor(daysSinceLMP / 7);
        const currentDay = daysSinceLMP % 7;

        let trimester: 1 | 2 | 3;
        if (currentWeek < 13) {
          trimester = 1;
        } else if (currentWeek < 27) {
          trimester = 2;
        } else {
          trimester = 3;
        }

        const fruitWeek = Object.keys(FRUIT_SIZES)
          .map(Number)
          .filter(w => w <= currentWeek)
          .pop() || 4;
        
        const babySize = FRUIT_SIZES[fruitWeek] || FRUIT_SIZES[4];

        const calculatedDueDate = dueDate || new Date(lastPeriod.getTime() + 280 * 24 * 60 * 60 * 1000);

        return {
          dueDate: calculatedDueDate,
          lastPeriodDate: lastPeriod,
          currentWeek,
          currentDay,
          trimester,
          babySize: {
            fruit: babySize.fruit,
            lengthCm: babySize.lengthCm,
            weightG: babySize.weightG,
          },
        };
      },

      getBabyData: () => {
        const { babyBirthDate, babyName, babyGender } = get();
        if (!babyBirthDate || !babyName || !babyGender) return null;

        const today = new Date();
        const birthDate = new Date(babyBirthDate);
        const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
        const ageInMonths = Math.floor(ageInDays / 30.44);

        return {
          id: 'baby-1',
          name: babyName,
          birthDate,
          gender: babyGender,
          ageInDays,
          ageInMonths,
        };
      },
    }),
    {
      name: 'anacan-user-store',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
        userId: state.userId,
        email: state.email,
        name: state.name,
        role: state.role,
        lifeStage: state.lifeStage,
        partnerCode: state.partnerCode,
        lastPeriodDate: state.lastPeriodDate,
        cycleLength: state.cycleLength,
        periodLength: state.periodLength,
        dueDate: state.dueDate,
        babyBirthDate: state.babyBirthDate,
        babyName: state.babyName,
        babyGender: state.babyGender,
        babyCount: state.babyCount,
        multiplesType: state.multiplesType,
      }),
    }
  )
);
