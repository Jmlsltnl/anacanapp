import { useQuery } from '@tanstack/react-query';
import {
  isHealthAvailable, isHealthConnected, isNativeHealthPlatform,
  getDailySteps, getDailyCalories, getDailyMindfulness, getRecentWorkouts } from
'@/lib/health';

/**
 * Apple Health / Health Connect məlumat hook-ları.
 * Yalnız native + qoşulu olduqda işləyir; RQ persist sayəsində offline-da son dəyərlər görünür.
 */

export const useHealthAvailability = () => {
  return useQuery({
    queryKey: ['health-available'],
    queryFn: isHealthAvailable,
    enabled: isNativeHealthPlatform(),
    staleTime: 60 * 1000
  });
};

export const useHealthDaily = (days = 7, connected = isHealthConnected()) => {
  return useQuery({
    queryKey: ['health-daily', days],
    queryFn: async () => {
      const [steps, calories, mindfulness] = await Promise.all([
      getDailySteps(days),
      getDailyCalories(days),
      getDailyMindfulness(days)]
      );
      return { steps, calories, mindfulness };
    },
    enabled: isNativeHealthPlatform() && connected,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  });
};

export const useHealthWorkouts = (days = 7, connected = isHealthConnected()) => {
  return useQuery({
    queryKey: ['health-workouts', days],
    queryFn: () => getRecentWorkouts(days),
    enabled: isNativeHealthPlatform() && connected,
    staleTime: 5 * 60 * 1000
  });
};
