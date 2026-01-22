// Persistent Timer Store - keeps timers running across page navigation
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ActiveTimer {
  id: string;
  type: 'sleep' | 'feeding';
  feedType?: 'left' | 'right';
  startTime: number; // timestamp
}

interface TimerState {
  activeTimers: ActiveTimer[];
  startTimer: (type: 'sleep' | 'feeding', feedType?: 'left' | 'right') => string;
  stopTimer: (id: string) => { durationSeconds: number } | null;
  getActiveTimer: (type: 'sleep' | 'feeding', feedType?: 'left' | 'right') => ActiveTimer | undefined;
  getElapsedSeconds: (id: string) => number;
  clearAllTimers: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTimers: [],
      
      startTimer: (type, feedType) => {
        const id = `${type}-${feedType || 'main'}-${Date.now()}`;
        const timer: ActiveTimer = {
          id,
          type,
          feedType,
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
      
      clearAllTimers: () => {
        set({ activeTimers: [] });
      },
    }),
    {
      name: 'anacan-timers',
    }
  )
);
