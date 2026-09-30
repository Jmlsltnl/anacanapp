// supabase/functions/_shared/auth.ts
import { createClient } from "npm:@supabase/supabase-js@2";
async function checkModerationAccess(userId, functionName = "source-authenticated-function") {
  const sourceRelease = Deno.env.get("SUPABASE_URL") === "https://tntbjulojatnrqmylorp.supabase.co";
  if (!sourceRelease && Deno.env.get("MODERATOR_ENFORCEMENT_REQUIRED") !== "true") return null;
  const denied = (unavailable) => new Response(JSON.stringify({ error: unavailable ? "moderation_unavailable" : "account_restricted" }), {
    status: unavailable ? 503 : 403,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const { data, error } = await admin.rpc("moderator_function_access_v1", { p_user: userId, p_function: functionName }).abortSignal(AbortSignal.timeout(5e3));
    return error ? denied(true) : data === true ? null : denied(false);
  } catch {
    return denied(true);
  }
}
async function requireUser(req, restrictedAccessPurpose) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      })
    };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    console.log("[auth] getUser failed:", error?.message);
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized", detail: error?.message }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      })
    };
  }
  const moderationError = await checkModerationAccess(data.user.id, restrictedAccessPurpose || Deno.env.get("SUPABASE_FUNCTION_SLUG"));
  if (moderationError) return { user: null, error: moderationError };
  return { user: { id: data.user.id, email: data.user.email ?? null }, error: null };
}
async function requireAdmin(req) {
  const r = await requireUser(req);
  if (r.error) return { userId: null, error: r.error };
  const admin = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { data, error } = await admin.from("user_roles").select("role").eq("user_id", r.user.id).eq("role", "admin").maybeSingle();
  if (error || !data) {
    return {
      userId: null,
      error: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      })
    };
  }
  return { userId: r.user.id, error: null };
}

// supabase/functions/admin-revenue-metrics/index.ts
var cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,apikey,x-client-info,content-type", "Cache-Control": "no-store" };
Deno.serve(async (req) => {
  const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const admin = await requireAdmin(req);
  if (admin.error) return admin.error;
  const checkedAt = (/* @__PURE__ */ new Date()).toISOString();
  const unavailable = (reason) => json({ available: false, scope: "project", checkedAt, reason });
  const key = Deno.env.get("REVENUECAT_SECRET_API_KEY");
  if (!key) return unavailable("not_configured");
  try {
    const response = await fetch("https://api.revenuecat.com/v2/projects/a3647ee8/metrics/overview", {
      headers: { Authorization: `Bearer ${key}` },
      redirect: "error",
      signal: AbortSignal.timeout(15e3)
    });
    if (response.status === 401 || response.status === 403) return unavailable("permission_required");
    if (!response.ok) return unavailable("provider_unavailable");
    const value = await response.json();
    if (!Array.isArray(value.metrics) || value.metrics.length > 50) return unavailable("invalid_provider_response");
    const metrics = value.metrics.filter((item) => typeof item.id === "string" && /^[a-z0-9_]{1,80}$/.test(item.id) && typeof item.name === "string" && Number.isFinite(item.value) && typeof item.unit === "string").map((item) => ({
      id: item.id,
      name: item.name.slice(0, 100),
      value: item.value,
      unit: item.unit.slice(0, 24),
      ...typeof item.description === "string" ? { description: item.description.slice(0, 400) } : {}
    }));
    if (!metrics.length) return unavailable("invalid_provider_response");
    return json({ available: true, scope: "project", checkedAt, metrics });
  } catch {
    return unavailable("provider_unavailable");
  }
});
