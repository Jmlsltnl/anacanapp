// Azure köçürülməsi üçün: storage bucket-lərindəki faylları (RLS-i keçərək)
// endirmək üçün "körpü" funksiyası. Yalnız SECURITY-critical deyil, çünki
// aşağıdakı gizli açarla qorunur — heç kim təsadüfən bu funksiyaya çata bilməz.
//
// NİYƏ EDGE FUNCTION (SQL yox): storage.objects cədvəli faylın YALNIZ
// METADATASINI saxlayır (bax: migration_export_storage_objects SQL funksiyası).
// Faylın özü (bytes) Storage backend-də saxlanılır və YALNIZ Storage API
// vasitəsilə (service_role ilə RLS-i keçərək) əldə edilə bilər. Edge function-lar
// avtomatik olaraq SUPABASE_SERVICE_ROLE_KEY-ə access-ə malikdir (istifadəçi
// bu açarı Dashboard-da GÖRMƏSƏ belə) — elə buna görə bu, RLS-dən asılı
// olmadan işləyir.
//
// İstifadə (azure-migration/scripts/migrate-storage.mjs tərəfindən çağırılır):
//   POST /functions/v1/migration-download-file
//   Body: { "bucket": "baby-photos", "path": "user-id/photo.jpg", "secret": "..." }
//   Cavab: fayl bytes-ları birbaşa (Content-Type faylın öz tipi ilə)
//
// MİQRASİYA BİTDİKDƏN SONRA BU FUNKSİYANI SİLİN (təhlükəsizlik təmizliyi):
//   supabase/functions/migration-download-file qovluğunu silin və yenidən deploy edin.

import { createClient } from 'npm:@supabase/supabase-js@2';

const MIGRATION_SECRET = '6ca762ee4bd6abb13876179607498c2fce4a8f383489d0d84cf38c5c5567a5f2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { bucket?: string; path?: string; secret?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (body.secret !== MIGRATION_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { bucket, path } = body;
  if (!bucket || !path) {
    return new Response(JSON.stringify({ error: 'bucket and path are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message ?? 'Download failed', bucket, path }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(data, {
    headers: {
      ...corsHeaders,
      'Content-Type': data.type || 'application/octet-stream',
    },
  });
});
