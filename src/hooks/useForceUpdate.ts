import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ForceUpdateConfig {
  enabled: boolean;
  min_version: string;
  title: string;
  message: string;
  android_url: string;
  ios_url: string;
}

export function useForceUpdate() {
  const { data, isLoading } = useQuery({
    queryKey: ['force-update-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'force_update')
        .maybeSingle();
      return data?.value as unknown as ForceUpdateConfig | null;
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  return { forceUpdate: data ?? null, isLoading };
}
