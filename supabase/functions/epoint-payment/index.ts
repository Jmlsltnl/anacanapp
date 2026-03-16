import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Helper: create signature
async function createSignature(privateKey: string, data: string): Promise<string> {
  const sgnString = privateKey + data + privateKey;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(sgnString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray));
}

// Helper: base64 encode
function base64Encode(str: string): string {
  return btoa(str);
}

// Helper: base64 decode
function base64Decode(str: string): string {
  return atob(str);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'create';

    // Get Epoint keys from app_settings
    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['epoint_public_key', 'epoint_private_key', 'epoint_mode']);

    const settings: Record<string, string> = {};
    settingsData?.forEach((s: any) => {
      let val = s.value;
      if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch { /* keep as is */ }
      }
      settings[s.key] = String(val).replace(/^"|"$/g, '');
    });

    const publicKey = settings['epoint_public_key'];
    const privateKey = settings['epoint_private_key'];
    const isTestMode = settings['epoint_mode'] === 'test';

    if (!publicKey || !privateKey) {
      return new Response(JSON.stringify({ error: 'Epoint açarları konfiqurasiya olunmayıb' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = 'https://epoint.az/api/1';

    // ===== ACTION: CREATE PAYMENT =====
    if (action === 'create') {
      const body = await req.json();
      const { amount, orderType, orderReferenceId, description, userId, successUrl, errorUrl } = body;

      if (!amount || !userId) {
        return new Response(JSON.stringify({ error: 'Məbləğ və istifadəçi ID tələb olunur' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Generate unique order_id
      const orderId = `ANA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Create transaction record
      const { data: txn, error: txnError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          order_type: orderType || 'general',
          order_reference_id: orderReferenceId || null,
          order_id: orderId,
          amount: parseFloat(amount),
          currency: 'AZN',
          description: description || `Anacan ödənişi - ${orderId}`,
          status: 'pending',
        })
        .select()
        .single();

      if (txnError) {
        console.error('Transaction create error:', txnError);
        return new Response(JSON.stringify({ error: 'Əməliyyat yaradıla bilmədi' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build Epoint data
      const jsonString = JSON.stringify({
        public_key: publicKey,
        amount: parseFloat(amount).toFixed(2),
        currency: 'AZN',
        language: 'az',
        order_id: orderId,
        description: description || `Anacan ödənişi`,
        success_redirect_url: successUrl || undefined,
        error_redirect_url: errorUrl || undefined,
      });

      const data = base64Encode(jsonString);
      const signature = await createSignature(privateKey, data);

      // Send request to Epoint
      const formData = new URLSearchParams();
      formData.append('data', data);
      formData.append('signature', signature);

      const epointRes = await fetch(`${baseUrl}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      const epointResult = await epointRes.json();

      if (epointResult.status === 'success' && epointResult.redirect_url) {
        // Update transaction with Epoint transaction ID
        await supabase
          .from('payment_transactions')
          .update({
            epoint_transaction: epointResult.transaction || null,
            redirect_url: epointResult.redirect_url,
            status: 'processing',
          })
          .eq('id', txn.id);

        return new Response(JSON.stringify({
          success: true,
          redirectUrl: epointResult.redirect_url,
          transactionId: txn.id,
          orderId: orderId,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Update transaction as failed
        await supabase
          .from('payment_transactions')
          .update({
            status: 'error',
            error_message: epointResult.message || 'Epoint sorğusu uğursuz oldu',
          })
          .eq('id', txn.id);

        return new Response(JSON.stringify({
          success: false,
          error: epointResult.message || 'Ödəniş sorğusu uğursuz oldu',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ===== ACTION: CALLBACK (result_url) =====
    if (action === 'callback') {
      const formData = await req.formData();
      const data = formData.get('data') as string;
      const signature = formData.get('signature') as string;

      if (!data || !signature) {
        return new Response('Missing data or signature', { status: 400 });
      }

      // Verify signature
      const expectedSignature = await createSignature(privateKey, data);
      if (expectedSignature !== signature) {
        console.error('Signature mismatch!', { expected: expectedSignature, received: signature });
        return new Response('Invalid signature', { status: 403 });
      }

      // Decode data
      const resultJson = JSON.parse(base64Decode(data));
      console.log('Epoint callback result:', resultJson);

      const {
        order_id,
        status,
        code,
        message,
        transaction,
        bank_transaction,
        bank_response,
        operation_code,
        rrn,
        card_name,
        card_mask,
        amount,
      } = resultJson;

      // Update transaction
      const updateData: Record<string, any> = {
        status: status === 'success' ? 'success' : 'failed',
        epoint_transaction: transaction || null,
        bank_transaction: bank_transaction || null,
        bank_response: typeof bank_response === 'object' ? JSON.stringify(bank_response) : bank_response || null,
        card_mask: card_mask || null,
        card_name: card_name || null,
        rrn: rrn || null,
        operation_code: operation_code || null,
        error_code: code || null,
        error_message: status !== 'success' ? (message || null) : null,
        callback_received_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update(updateData)
        .eq('order_id', order_id);

      if (updateError) {
        console.error('Error updating transaction:', updateError);
      }

      // If payment successful, update the related order
      if (status === 'success' && order_id) {
        const { data: txnData } = await supabase
          .from('payment_transactions')
          .select('order_type, order_reference_id')
          .eq('order_id', order_id)
          .single();

        if (txnData?.order_reference_id) {
          if (txnData.order_type === 'cake') {
            await supabase
              .from('cake_orders')
              .update({ payment_status: 'paid', payment_method: 'epoint_card' })
              .eq('id', txnData.order_reference_id);
          } else if (txnData.order_type === 'album') {
            await supabase
              .from('album_orders')
              .update({ payment_status: 'paid', payment_method: 'epoint_card' })
              .eq('id', txnData.order_reference_id);
          }
          // Add more order types as needed
        }
      }

      return new Response('OK', { status: 200 });
    }

    // ===== ACTION: GET STATUS =====
    if (action === 'status') {
      const body = await req.json();
      const { transaction } = body;

      if (!transaction) {
        return new Response(JSON.stringify({ error: 'Əməliyyat ID tələb olunur' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const jsonString = JSON.stringify({
        public_key: publicKey,
        transaction: transaction,
      });

      const data = base64Encode(jsonString);
      const signature = await createSignature(privateKey, data);

      const formDataParams = new URLSearchParams();
      formDataParams.append('data', data);
      formDataParams.append('signature', signature);

      const statusRes = await fetch(`${baseUrl}/get-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formDataParams.toString(),
      });

      const statusResult = await statusRes.json();

      return new Response(JSON.stringify(statusResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== ACTION: REFUND =====
    if (action === 'refund') {
      const body = await req.json();
      const { transaction, amount: refundAmount } = body;

      if (!transaction) {
        return new Response(JSON.stringify({ error: 'Əməliyyat ID tələb olunur' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const jsonData: Record<string, any> = {
        public_key: publicKey,
        transaction: transaction,
      };

      if (refundAmount) {
        jsonData.amount = parseFloat(refundAmount).toFixed(2);
        jsonData.currency = 'AZN';
      }

      const jsonString = JSON.stringify(jsonData);
      const data = base64Encode(jsonString);
      const signature = await createSignature(privateKey, data);

      const formDataParams = new URLSearchParams();
      formDataParams.append('data', data);
      formDataParams.append('signature', signature);

      const refundRes = await fetch(`${baseUrl}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formDataParams.toString(),
      });

      const refundResult = await refundRes.json();

      // Update transaction status if refund successful
      if (refundResult.status === 'success') {
        await supabase
          .from('payment_transactions')
          .update({ status: 'returned' })
          .eq('epoint_transaction', transaction);
      }

      return new Response(JSON.stringify(refundResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Naməlum əməliyyat' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Epoint payment error:', error);
    return new Response(JSON.stringify({ error: 'Daxili xəta baş verdi' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
