import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bug, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Diagnostic panel for push notifications.
 * Lets the admin trigger the real `send-daily-notifications` pipeline targeted ONLY at their own user
 * (skipping dedup) and view the full edge function response for debugging.
 *
 * No bulk pushes are ever sent from this panel.
 */
const PushDiagnosticsCard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<null | 'me-daily' | 'me-flow' | 'check-tokens'>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  const sendDailyToMe = async () => {
    if (!user) {
      toast.error('Giriş etməlisiniz');
      return;
    }
    setLoading('me-daily');
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-notifications', {
        body: { manual: true, userId: user.id, skipDedup: true },
      });
      if (error) throw error;
      setLastResult({ kind: 'send-daily-notifications', payload: data });
      const sent = data?.sent ?? 0;
      if (sent > 0) {
        toast.success(`${sent} dinamik push göndərildi (sənin cihazına)`);
      } else {
        toast.warning('Push hazırlandı, amma 0 göndərildi. Detalları aşağıda gör.');
      }
    } catch (err: any) {
      console.error(err);
      setLastResult({ kind: 'error', payload: err?.message || String(err) });
      toast.error('Xəta: ' + (err?.message || 'naməlum'));
    } finally {
      setLoading(null);
    }
  };

  const sendFlowToMe = async () => {
    if (!user) {
      toast.error('Giriş etməlisiniz');
      return;
    }
    setLoading('me-flow');
    setLastResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-flow-reminders', {
        body: { manual: true },
      });
      if (error) throw error;
      setLastResult({ kind: 'send-flow-reminders', payload: data });
      toast.success('Flow reminders icra edildi. Detallar aşağıda.');
    } catch (err: any) {
      console.error(err);
      setLastResult({ kind: 'error', payload: err?.message || String(err) });
      toast.error('Xəta: ' + (err?.message || 'naməlum'));
    } finally {
      setLoading(null);
    }
  };

  const checkMyTokens = async () => {
    if (!user) return;
    setLoading('check-tokens');
    setLastResult(null);
    try {
      const { data, error } = await supabase
        .from('device_tokens')
        .select('platform, device_name, updated_at, token')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      const masked = (data || []).map((t: any) => ({
        platform: t.platform,
        device_name: t.device_name,
        updated_at: t.updated_at,
        tokenSuffix: '...' + (t.token || '').slice(-12),
      }));
      setLastResult({ kind: 'my-device-tokens', count: masked.length, payload: masked });
      if (masked.length === 0) {
        toast.warning('Heç bir cihaz tokeni yoxdur. Mobil tətbiqi aç və icazə ver.');
      } else {
        toast.success(`${masked.length} aktiv token tapıldı`);
      }
    } catch (err: any) {
      setLastResult({ kind: 'error', payload: err?.message });
      toast.error('Xəta: ' + (err?.message || 'naməlum'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="p-4 border-2 border-dashed border-primary/40 bg-primary/5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Push Diaqnostika</h3>
            <p className="text-xs text-muted-foreground">
              Yalnız sənin öz cihazına test push göndərir. Heç kimə kütləvi göndərilmir.
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={checkMyTokens}
            disabled={loading !== null}
          >
            {loading === 'check-tokens' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Tokenlərimi yoxla
          </Button>
          <Button
            size="sm"
            onClick={sendDailyToMe}
            disabled={loading !== null}
          >
            {loading === 'me-daily' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Mənə dinamik push göndər
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={sendFlowToMe}
            disabled={loading !== null}
          >
            {loading === 'me-flow' ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Flow reminderlərini icra et
          </Button>
        </div>
      </div>

      {lastResult && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{lastResult.kind}</Badge>
            {typeof lastResult.count === 'number' && (
              <Badge variant="secondary">{lastResult.count} qeyd</Badge>
            )}
          </div>
          <pre className="text-xs bg-background border rounded p-3 max-h-80 overflow-auto whitespace-pre-wrap break-words">
            {JSON.stringify(lastResult.payload, null, 2)}
          </pre>
        </div>
      )}
    </Card>
  );
};

export default PushDiagnosticsCard;
