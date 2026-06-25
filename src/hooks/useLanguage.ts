import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/store/userStore';
import { useCallback, useEffect, useMemo } from 'react';
import { loadTranslations, clearTranslationCache } from '@/lib/i18n';

export function useLanguage() {
  const language = useUserStore(state => state.language);
  const setLanguage = useUserStore(state => state.setLanguage);
  
  // Fetch active languages from DB
  const { data: languages = [], isLoading } = useQuery({
    queryKey: ['app-languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_languages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 min cache
  });
  
  // Load translations when language changes
  useEffect(() => {
    if (language !== 'az') {
      loadTranslations(language);
    }
  }, [language]);
  
  const changeLanguage = useCallback((lang: string) => {
    if (lang === language) return;
    clearTranslationCache();
    setLanguage(lang);
  }, [language, setLanguage]);

  // Extract disabled_tools for the current language
  const disabledTools: string[] = useMemo(() => {
    const currentLang = languages.find((l: any) => l.code === language);
    if (!currentLang) return [];
    const dt = (currentLang as any).disabled_tools;
    return Array.isArray(dt) ? dt : [];
  }, [languages, language]);
  
  return {
    language,
    languages,
    isLoading,
    changeLanguage,
    disabledTools,
  };
}
