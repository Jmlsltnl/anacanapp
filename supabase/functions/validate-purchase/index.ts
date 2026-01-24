import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseValidationRequest {
  transactionId: string;
  productId: string;
  receipt?: string;
  purchaseToken?: string;
  platform: 'ios' | 'android';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body: PurchaseValidationRequest = await req.json();
    const { transactionId, productId, receipt, purchaseToken, platform } = body;

    console.log(`Validating purchase for user ${user.id}:`, {
      transactionId,
      productId,
      platform,
    });

    // Here you would implement actual receipt validation with Apple/Google
    // For now, we'll just log and trust the client-side validation
    
    // iOS: Validate with Apple's verifyReceipt endpoint
    // Android: Validate with Google Play Developer API
    
    // For production, you should:
    // 1. For iOS: Send receipt to Apple's verifyReceipt endpoint
    // 2. For Android: Use Google Play Developer API to verify purchaseToken

    let isValid = true;
    let validationDetails: any = {};

    if (platform === 'ios' && receipt) {
      // TODO: Implement Apple receipt validation
      // const appleResponse = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     'receipt-data': receipt,
      //     'password': Deno.env.get('APPLE_SHARED_SECRET'),
      //   }),
      // });
      // const appleData = await appleResponse.json();
      // isValid = appleData.status === 0;
      validationDetails = { method: 'ios_receipt', transactionId };
    } else if (platform === 'android' && purchaseToken) {
      // TODO: Implement Google Play validation
      // Requires OAuth2 authentication with Google Play Developer API
      validationDetails = { method: 'android_token', transactionId };
    }

    // Log the validation attempt
    console.log(`Purchase validation result for ${user.id}:`, {
      isValid,
      productId,
      ...validationDetails,
    });

    // Store validation record (optional - for audit purposes)
    await supabaseClient
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        feature_type: 'iap_validation',
        usage_count: 1,
        usage_seconds: 0,
      });

    return new Response(
      JSON.stringify({
        success: true,
        isValid,
        message: 'Purchase validated',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
