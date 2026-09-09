// Azure köçürülməsi üçün: storage bucket-lərindəki faylları (RLS-i keçərək)
// endirmək üçün "körpü" funksiyası. Gizli açarla qorunur.
//
// İstifadə:
//   POST /functions/v1/migration-download-file
//   Body: { "bucket": "baby-photos", "path": "user-id/photo.jpg", "secret": "..." }
//
// MİQRASİYA BİTDİKDƏN SONRA BU FUNKSİYANI SİLİN.

import { createClient } from 'npm:@supabase/supabase-js@2';

const MIGRATION_SECRET = '385f081d6b8a827c0fa66e6198d4068e92ab8bd4e868b2cc6886d71a944173de';

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
