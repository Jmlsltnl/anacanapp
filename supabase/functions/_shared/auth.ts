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

function parseSecretValues(raw?: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((value): value is string => typeof value === 'string' && value.length > 0);
    }
    if (parsed && typeof parsed === 'object') {
      return Object.values(parsed).filter((value): value is string => typeof value === 'string' && value.length > 0);
    }
  } catch {
    // Fall back to delimiter-based parsing.
  }

  return raw
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const normalized = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

function isProjectRoleKey(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const projectUrl = Deno.env.get('SUPABASE_URL');
  if (!payload || !projectUrl) return false;

  let projectRef = '';
  try {
    projectRef = new URL(projectUrl).hostname.split('.')[0] || '';
  } catch {
    return false;
  }

  return payload.iss === 'supabase'
    && payload.ref === projectRef
    && (payload.role === 'anon' || payload.role === 'service_role');
}

export function requireCronSecret(req: Request): Response | null {
  // Accept EITHER:
  //   1) x-cron-secret header matching CRON_SECRET env, OR
  //   2) Authorization/apikey matching the project's publishable or service key
  //      (pg_cron / net.http_post sends this format)
  const expected = Deno.env.get('CRON_SECRET');
  const got = req.headers.get('x-cron-secret');
  if (expected && got && got === expected) return null;

  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
  const token = (authHeader.replace(/^Bearer\s+/i, '').trim() || req.headers.get('apikey') || '').trim();
  const acceptedKeys = new Set([
    ...parseSecretValues(Deno.env.get('SUPABASE_ANON_KEY')),
    ...parseSecretValues(Deno.env.get('SUPABASE_PUBLISHABLE_KEY')),
    ...parseSecretValues(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')),
    ...parseSecretValues(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')),
    ...parseSecretValues(Deno.env.get('SUPABASE_SECRET_KEYS')),
  ]);

  if (token && (acceptedKeys.has(token) || isProjectRoleKey(token))) return null;

  return new Response(JSON.stringify({ error: 'Unauthorized (cron)' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
