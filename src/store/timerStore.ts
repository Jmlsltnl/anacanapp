// Persistent Timer Store - keeps timers running across page navigation
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TimerType = 'sleep' | 'feeding' | 'diaper' | 'white-noise';

export interface ActiveTimer {
  id: string;
  type: TimerType;
  feedType?: 'left' | 'right';
  label?: string;
  startTime: number; // timestamp
}

interface TimerState {
  activeTimers: ActiveTimer[];
  startTimer: (type: TimerType, feedType?: 'left' | 'right', label?: string) => string;
  stopTimer: (id: string) => { durationSeconds: number } | null;
  getActiveTimer: (type: TimerType, feedType?: 'left' | 'right') => ActiveTimer | undefined;
  getElapsedSeconds: (id: string) => number;
  hasAnyActiveTimer: () => boolean;
  clearAllTimers: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTimers: [],
      
      startTimer: (type, feedType, label) => {
        const id = `${type}-${feedType || 'main'}-${Date.now()}`;
        const timer: ActiveTimer = {
          id,
          type,
          feedType,
          label,
          startTime: Date.now(),
        };
        
        set((state) => ({
          activeTimers: [...state.activeTimers, timer]
        }));
        
        return id;
      },
      
      stopTimer: (id) => {
        const timer = get().activeTimers.find(t => t.id === id);
        if (!timer) return null;
        
        const durationSeconds = Math.floor((Date.now() - timer.startTime) / 1000);
        
        set((state) => ({
          activeTimers: state.activeTimers.filter(t => t.id !== id)
        }));
        
        return { durationSeconds };
      },
      
      getActiveTimer: (type, feedType) => {
        return get().activeTimers.find(t => 
          t.type === type && 
          (feedType === undefined || t.feedType === feedType)
        );
      },
      
      getElapsedSeconds: (id) => {
        const timer = get().activeTimers.find(t => t.id === id);
        if (!timer) return 0;
        return Math.floor((Date.now() - timer.startTime) / 1000);
      },
      
      hasAnyActiveTimer: () => {
        return get().activeTimers.length > 0;
      },
      
      clearAllTimers: () => {
        set({ activeTimers: [] });
      },
    }),
    {
      name: 'anacan-timers',
    }
  )
);
