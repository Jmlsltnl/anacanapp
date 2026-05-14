import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { FavoriteName } from './useFavoriteNames';

export const usePartnerFavoriteNames = () => {
  const { profile } = useAuth();
  const [partnerFavorites, setPartnerFavorites] = useState<FavoriteName[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.linked_partner_id) {
      setPartnerFavorites([]);
      setLoading(false);
      return;
    }
    try {
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', profile.linked_partner_id)
        .single();

      if (!partnerProfile?.user_id) {
        setPartnerFavorites([]);
        return;
      }

      const { data, error } = await supabase
        .from('favorite_names')
        .select('*')
        .eq('user_id', partnerProfile.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartnerFavorites((data || []) as FavoriteName[]);
    } catch (e) {
      console.error('Partner favorites fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [profile?.linked_partner_id]);

  useEffect(() => {
    fetch();

    if (!profile?.linked_partner_id) return;
    const channel = supabase
      .channel(`partner_favorite_names_${profile.linked_partner_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorite_names' }, () => fetch())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.linked_partner_id, fetch]);

  return { partnerFavorites, loading, refetch: fetch };
};
