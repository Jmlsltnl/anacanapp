import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandReportArgs, type AdBrand, type BrandFilters, type BrandReport } from '@/lib/brand-ads';
import { useBrandAuth } from './Auth';
import { BRAND_SOURCE_ORIGIN } from './client';

export interface BrandMember { user_id: string; email: string; is_active: boolean; managed: boolean }
export interface BrandWorkspace { brands: AdBrand[]; members: BrandMember[]; banners: { id: string; title: string; placement: string; brand_id: string | null; is_active: boolean }[] }
export function usePortalReport(brand: AdBrand | undefined, filters: BrandFilters) {
  const { client, session, access } = useBrandAuth();
  return useQuery({ queryKey: ['brand-portal-report', BRAND_SOURCE_ORIGIN, session?.user.id, brand?.id, filters],
    enabled: !!session && !!brand && !!access?.allowed, staleTime: 15000, gcTime: 0, retry: false,
    queryFn: async ({ signal }) => {
      const { data, error } = await client.rpc('brand_ad_report_v1', brandReportArgs(brand!.id, filters)).abortSignal(signal);
      if (error) throw error;
      if (data?.brand?.id !== brand!.id || data.protocol !== 'anacan-brand-ads-v1' || data.backend !== 'source') throw new Error('BRAND_PORTAL_REPORT_MISMATCH');
      return data as BrandReport;
    } });
}
export function usePortalWorkspace(brand: string | null) {
  const { client, session, access } = useBrandAuth();
  return useQuery({ queryKey: ['brand-portal-admin', BRAND_SOURCE_ORIGIN, session?.user.id, brand], enabled: !!access?.admin,
    staleTime: 0, gcTime: 0, retry: false, queryFn: async ({ signal }) => {
      const { data, error } = await client.rpc('admin_brand_workspace_v1', { p_brand: brand }).abortSignal(signal);
      if (error) throw error; return data as BrandWorkspace;
    } });
}
export function usePortalAdminAction() {
  const { client } = useBrandAuth(), queries = useQueryClient();
  return useMutation({ mutationFn: async (args: { action: string; brand: string | null; target?: string | null; payload: Record<string, unknown>; request?: string }) => {
    const { data, error } = await client.rpc('admin_brand_action_v1', { p_action: args.action, p_brand: args.brand, p_target: args.target ?? null, p_payload: args.payload, p_request: args.request || crypto.randomUUID() });
    if (error) throw error; return data;
  }, onSuccess: () => queries.invalidateQueries({ predicate: query => String(query.queryKey[0]).startsWith('brand-portal-') }) });
}
