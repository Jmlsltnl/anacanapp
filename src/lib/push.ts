import { tr } from "@/lib/tr";import { supabase } from '@/integrations/supabase/client';

export interface SendPushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendPushResult {
  ok: boolean;
  sent: number;
  skipped?: string;
  data?: Record<string, unknown>;
  error?: unknown;
}

/**
 * Invokes send-push-notification and logs actionable failures (no tokens, FCM missing, etc.).
 */
export async function invokeSendPush(payload: SendPushPayload): Promise<SendPushResult> {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: payload
    });

    if (error) {
      console.error('[Push] invoke error:', error);
      return { ok: false, sent: 0, error };
    }

    const sent = typeof data?.sent === 'number' ? data.sent : 0;
    const skipped = data?.skipped as string | undefined;

    if (sent === 0) {
      const reason =
      skipped ||
      data?.message || (
      data?.error ? String(data.error) : tr("push_push_gonderilmedi_sent_0_7d1a2a", "Push g\xF6nd\u0259rilm\u0259di (sent: 0)"));
      console.warn('[Push] not delivered:', reason, data);
      return { ok: false, sent: 0, skipped: reason, data };
    }

    return { ok: true, sent, data };
  } catch (err) {
    console.error('[Push] exception:', err);
    return { ok: false, sent: 0, error: err };
  }
}