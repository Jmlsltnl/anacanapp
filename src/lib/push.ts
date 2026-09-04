import { tr } from "@/lib/tr";import { supabase } from '@/integrations/supabase/client';

export interface SendPushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** Diaqnostika üçün: xəta reportlarında görünən qısa ad (məs. 'community_like') */
  kind?: string;
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
  const kind = payload.kind || String((payload.data as any)?.type || 'push');
  const report = (reason: string, extra?: Record<string, unknown>) => {
    // Admin → Crash Reports-da görünsün ("pushlar getmir"in dəqiq səbəbi)
    import('@/lib/crashReporter').
    then((m) => m.reportPushFailure(kind, reason, extra)).
    catch(() => {});
  };

  try {
    // kind server-ə getməsin (payload şərtnaməsi dəyişməz qalır)
    const { kind: _k, ...body } = payload;
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body
    });

    if (error) {
      console.error('[Push] invoke error:', error);
      report(`invoke error: ${(error as any)?.message || String(error)}`);
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
      // "no_device_tokens" ən çox rast gəlinən real səbəbdir — o da reportlanır
      // ki, admin hansı istifadəçilərin tokensiz qaldığını görsün
      report(String(reason), { response: data });
      return { ok: false, sent: 0, skipped: reason, data };
    }

    return { ok: true, sent, data };
  } catch (err) {
    console.error('[Push] exception:', err);
    report(`exception: ${(err as any)?.message || String(err)}`);
    return { ok: false, sent: 0, error: err };
  }
}