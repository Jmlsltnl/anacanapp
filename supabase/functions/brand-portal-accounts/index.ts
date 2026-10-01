// supabase/functions/brand-portal-accounts/index.ts
import { createClient as createClient2 } from "npm:@supabase/supabase-js@2";

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

// supabase/functions/brand-portal-accounts/index.ts
var cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,apikey,x-client-info,content-type", "Cache-Control": "no-store" };
var uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
var json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (Deno.env.get("SUPABASE_URL") !== "https://tntbjulojatnrqmylorp.supabase.co") return json({ error: "source_backend_required" }, 503);
  const admin = await requireAdmin(req);
  if (admin.error) return admin.error;
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({ error: "invalid_request" }, 400);
    const body = JSON.parse(raw);
    const { action, brandId, userId, requestId } = body;
    const password = body.password;
    if (!["create", "reset_password"].includes(action) || !uuid.test(brandId || "") || !uuid.test(requestId || "") || typeof password !== "string" || password.length < 12 || password.length > 128 || !password.trim()) return json({ error: "invalid_request" }, 400);
    const url = Deno.env.get("SUPABASE_URL");
    const actor = createClient2(url, Deno.env.get("SUPABASE_ANON_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: req.headers.get("Authorization") } }
    });
    const { data: workspace, error: denied } = await actor.rpc("admin_brand_workspace_v1", { p_brand: brandId });
    if (denied || !workspace?.brands?.some((brand) => brand.id === brandId)) return json({ error: "brand_unavailable" }, 403);
    const service = createClient2(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
    if (action === "reset_password") {
      if (!uuid.test(userId || "") || !workspace.members?.some((member) => member.user_id === userId && member.managed)) return json({ error: "managed_brand_account_required" }, 403);
      const { data, error } = await service.auth.admin.getUserById(userId);
      if (error || data.user?.app_metadata?.brand_portal_managed !== true || data.user.app_metadata.brand_id !== brandId) return json({ error: "managed_brand_account_required" }, 403);
      const changed = await service.auth.admin.updateUserById(userId, { password });
      if (changed.error) return json({ error: "password_update_failed" }, 503);
      return json({ action: "password_updated", brandId, userId });
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json({ error: "invalid_request" }, 400);
    const previous = await service.auth.admin.getUserById(requestId);
    let created = previous.data?.user;
    const replay = !!created;
    if (created && (created.email?.toLowerCase() !== email || created.app_metadata?.brand_portal_managed !== true || created.app_metadata.brand_id !== brandId || created.app_metadata.provision_request !== requestId || created.app_metadata.provisioned_by !== admin.userId)) return json({ error: "request_conflict" }, 409);
    if (!created) {
      if (previous.error && previous.error.status !== 404) return json({ error: "account_service_unavailable" }, 503);
      const result = await service.auth.admin.createUser({
        id: requestId,
        email,
        password,
        email_confirm: true,
        app_metadata: { brand_portal_managed: true, brand_id: brandId, provision_request: requestId, provisioned_by: admin.userId },
        user_metadata: { name: workspace.brands.find((brand) => brand.id === brandId).name }
      });
      if (result.error) return json({ error: result.error.status === 422 || result.error.status === 409 ? "account_exists" : "account_creation_failed" }, result.error.status === 422 || result.error.status === 409 ? 409 : 503);
      created = result.data.user;
      if (!created || created.id !== requestId) return json({ error: "account_provision_pending" }, 503);
    }
    const linked = await actor.rpc("admin_brand_action_v1", { p_action: "add_member", p_brand: brandId, p_target: created.id, p_payload: { email }, p_request: requestId });
    if (linked.error || linked.data?.target_id !== created.id) return json({ error: "account_provision_pending" }, 503);
    return json({ action: "account_created", brandId, userId: created.id, email, replay });
  } catch {
    return json({ error: "account_operation_failed" }, 503);
  }
});
