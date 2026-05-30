import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PartnerVenue {
  id: string;
  name: string;
  slug: string | null;
  category_key: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  gallery_urls: string[] | null;
  address: string | null;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  working_hours: any;
  discount_label: string;
  discount_value: number | null;
  discount_terms: string | null;
  redemption_cooldown_hours: number;
  redemption_lifetime_limit: number | null;
  qr_ttl_seconds: number;
  is_featured: boolean;
  sort_order: number;
}

export interface PartnerCategory {
  id: string;
  key: string;
  label_az: string;
  icon: string;
  sort_order: number;
}

export const usePartnerCategories = () => {
  return useQuery({
    queryKey: ['partner-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_venue_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as PartnerCategory[];
    },
    staleTime: 1000 * 60 * 10,
  });
};

export const usePartnerVenues = (categoryKey?: string) => {
  return useQuery({
    queryKey: ['partner-venues', categoryKey || 'all'],
    queryFn: async () => {
      let q = supabase
        .from('partner_venues_public')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('sort_order');
      if (categoryKey && categoryKey !== 'all') q = q.eq('category_key', categoryKey);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PartnerVenue[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const usePartnerVenue = (id: string | null) => {
  return useQuery({
    queryKey: ['partner-venue', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_venues_public')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data as PartnerVenue | null;
    },
  });
};

export interface RedemptionResponse {
  token: string;
  verify_url: string;
  expires_at: string;
  ttl_seconds: number;
  venue_name: string;
  discount_label: string;
}

export async function createRedemption(venueId: string): Promise<RedemptionResponse> {
  const { data, error } = await supabase.functions.invoke('partner-create-redemption', {
    body: { venue_id: venueId },
  });
  if (error) throw error;
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as RedemptionResponse;
}
