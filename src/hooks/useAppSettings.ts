import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AppSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
}

export const useAppSettings = () => {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('key');

      if (error) {
        console.error('Error fetching app settings:', error);
        return [];
      }

      return data as AppSetting[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAppSetting = (key: string) => {
  const { data: settings = [] } = useAppSettings();
  const setting = settings.find(s => s.key === key);
  
  // Parse boolean strings
  if (setting?.value === 'true') return true;
  if (setting?.value === 'false') return false;
  if (typeof setting?.value === 'string') {
    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  }
  return setting?.value;
};

export const useUpdateAppSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      // First check if setting exists
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('key', key)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: typeof value === 'string' ? value : JSON.stringify(value) })
          .eq('key', key);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_settings')
          .insert({ 
            key, 
            value: typeof value === 'string' ? value : JSON.stringify(value) 
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    },
  });
};

// Convenience hooks for specific settings
export const useLifeStageEnabled = (stage: 'flow' | 'bump' | 'mommy') => {
  const value = useAppSetting(`${stage}_mode_enabled`);
  return value !== false; // Default to true if not set
};

export const useDarkModeEnabled = () => {
  const value = useAppSetting('dark_mode_enabled');
  return value !== false; // Default to true if not set
};
