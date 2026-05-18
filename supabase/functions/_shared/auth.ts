// Shared auth helpers for edge functions.
import { createClient } from 'npm:@supabase/supabase-js@2';

export async function requireUser(req: Request): Promise<
  | { user: { id: string; email?: string | null }; error: null }
  | { user: null; error: Response }
> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }),
    };
  }
  const token = authHeader.replace('Bearer ', '');
  // Use service role client + getUser(token) — works regardless of JWT signing-key configuration.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    console.log('[auth] getUser failed:', error?.message);
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Unauthorized', detail: error?.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }),
    };
  }
  return { user: { id: data.user.id, email: data.user.email ?? null }, error: null };
}

export async function requireAdmin(req: Request): Promise<
  | { userId: string; error: null }
  | { userId: null; error: Response }
> {
  const r = await requireUser(req);
  if (r.error) return { userId: null, error: r.error };
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const { data, error } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', r.user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (error || !data) {
    return {
      userId: null,
      error: new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }),
    };
  }
  return { userId: r.user.id, error: null };
}

export function requireCronSecret(req: Request): Response | null {
  // Accept EITHER:
  //   1) x-cron-secret header matching CRON_SECRET env, OR
  //   2) Authorization: Bearer <SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY>
  //      (pg_cron / net.http_post sends this format)
  const expected = Deno.env.get('CRON_SECRET');
  const got = req.headers.get('x-cron-secret');
  if (expected && got && got === expected) return null;

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (token && (token === anonKey || token === serviceKey)) return null;

  return new Response(JSON.stringify({ error: 'Unauthorized (cron)' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
