import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AppleNotificationPayload {
  payload: string; // JWT token from Apple
}

interface AppleNotificationEvent {
  iss: string;
  aud: string;
  iat: number;
  jti: string;
  events: string; // JSON string containing the event details
}

interface AppleEventData {
  type: string;
  sub: string; // Apple user ID
  email?: string;
  is_private_email?: boolean;
  event_time: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Apple sends notifications as application/x-www-form-urlencoded
    const contentType = req.headers.get("content-type") || "";
    
    let payload: string;
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      payload = formData.get("payload") as string;
    } else if (contentType.includes("application/json")) {
      const body: AppleNotificationPayload = await req.json();
      payload = body.payload;
    } else {
      // Try to read as text
      payload = await req.text();
    }

    if (!payload) {
      console.error("No payload received");
      return new Response(
        JSON.stringify({ error: "No payload received" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode JWT payload (Apple sends a signed JWT)
    // Note: In production, you should verify the JWT signature using Apple's public keys
    const parts = payload.split(".");
    if (parts.length !== 3) {
      console.error("Invalid JWT format");
      return new Response(
        JSON.stringify({ error: "Invalid JWT format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const decodedPayload = JSON.parse(atob(parts[1])) as AppleNotificationEvent;
    const events = JSON.parse(decodedPayload.events) as AppleEventData;

    console.log("Apple notification received:", {
      type: events.type,
      sub: events.sub,
      event_time: events.event_time,
    });

    // Log the notification
    await supabase.from("apple_auth_notifications").insert({
      apple_user_id: events.sub,
      event_type: events.type,
      email: events.email || null,
      is_private_email: events.is_private_email || null,
      event_time: new Date(events.event_time * 1000).toISOString(),
      raw_payload: payload,
    });

    // Handle different event types
    switch (events.type) {
      case "email-disabled":
        // User stopped sharing their email with your app
        console.log(`User ${events.sub} disabled email forwarding`);
        await handleEmailDisabled(supabase, events.sub);
        break;

      case "email-enabled":
        // User started sharing their email with your app
        console.log(`User ${events.sub} enabled email forwarding`);
        await handleEmailEnabled(supabase, events.sub, events.email);
        break;

      case "consent-revoked":
        // User revoked consent for your app
        console.log(`User ${events.sub} revoked consent`);
        await handleConsentRevoked(supabase, events.sub);
        break;

      case "account-delete":
        // User deleted their Apple account or removed your app
        console.log(`User ${events.sub} deleted account`);
        await handleAccountDelete(supabase, events.sub);
        break;

      default:
        console.log(`Unknown event type: ${events.type}`);
    }

    return new Response(
      JSON.stringify({ success: true, event_type: events.type }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing Apple notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleEmailDisabled(supabase: any, appleUserId: string) {
  // Update user profile to reflect email is no longer available
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("apple_user_id", appleUserId)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({ apple_email_enabled: false })
      .eq("apple_user_id", appleUserId);
  }
}

async function handleEmailEnabled(supabase: any, appleUserId: string, email?: string) {
  // Update user profile with new email preferences
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("apple_user_id", appleUserId)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({ 
        apple_email_enabled: true,
        email: email || undefined 
      })
      .eq("apple_user_id", appleUserId);
  }
}

async function handleConsentRevoked(supabase: any, appleUserId: string) {
  // User revoked consent - you might want to notify them or clean up
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("apple_user_id", appleUserId)
    .single();

  if (profile) {
    // Create a notification for the user
    await supabase.from("notifications").insert({
      user_id: profile.user_id,
      title: "Apple hesab bağlantısı ləğv edildi",
      message: "Apple ID ilə bağlantınız ləğv edilmişdir.",
      notification_type: "system",
    });
  }
}

async function handleAccountDelete(supabase: any, appleUserId: string) {
  // User deleted their Apple account or removed the app
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("apple_user_id", appleUserId)
    .single();

  if (profile) {
    // Mark the account as needing attention or handle deletion
    await supabase
      .from("profiles")
      .update({ 
        apple_user_id: null,
        apple_email_enabled: null 
      })
      .eq("apple_user_id", appleUserId);

    // Create a notification
    await supabase.from("notifications").insert({
      user_id: profile.user_id,
      title: "Apple hesab silindi",
      message: "Apple ID hesabınız silinmişdir. Zəhmət olmasa yeni giriş üsulu seçin.",
      notification_type: "system",
    });
  }
}
