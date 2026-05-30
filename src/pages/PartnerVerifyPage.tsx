import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Sparkles, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StatusData {
  status: string;
  expires_at?: string;
  verified_at?: string;
  venue_name?: string;
  venue_logo_url?: string;
  discount_label?: string;
  user_name?: string;
  is_premium?: boolean;
}

export default function PartnerVerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState<StatusData | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('partner-redemption-status', { body: { token } });
        if (error) throw error;
        setStatus(data as StatusData);
        if ((data as StatusData)?.status === 'verified') setVerified(data as StatusData);
      } catch (e: any) {
        setError(e?.message || 'Xəta');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || !token) return;
    setSubmitting(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('partner-verify-redemption', { body: { token, pin } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setVerified(data as StatusData);
    } catch (e: any) {
      const msg = e?.message || 'Xəta';
      const map: Record<string, string> = {
        invalid_pin: 'PIN səhvdir',
        invalid_token: 'QR yanlışdır',
        expired: 'QR-ın müddəti bitib',
        already_verified: 'Bu QR artıq istifadə olunub',
      };
      setError(map[msg] || msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-500 text-white p-6 text-center">
        <CheckCircle2 className="w-24 h-24 mb-4" strokeWidth={2.5} />
        <h1 className="text-4xl font-black mb-2">TƏSDİQLƏNDİ</h1>
        <p className="text-2xl font-bold mb-1">{verified.discount_label}</p>
        <p className="text-lg opacity-90 mb-6">{verified.venue_name}</p>
        <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-4 mb-3">
          <p className="text-sm opacity-80 mb-1">İstifadəçi</p>
          <p className="text-xl font-bold">{verified.user_name}</p>
          {verified.is_premium && (
            <div className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full mt-2">
              <Sparkles className="w-3 h-3" /> PREMIUM
            </div>
          )}
        </div>
        <p className="text-xs opacity-70 mt-4">Anacan Partnyor Sistemi</p>
      </div>
    );
  }

  if (status?.status === 'expired' || error === 'QR-ın müddəti bitib') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-destructive text-white p-6 text-center">
        <XCircle className="w-20 h-20 mb-4" />
        <h1 className="text-3xl font-bold">Müddəti bitib</h1>
        <p className="opacity-90 mt-2">Müştəri tətbiqində yeni QR yaratmalıdır.</p>
      </div>
    );
  }

  if (status?.status === 'cancelled') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted p-6 text-center">
        <XCircle className="w-20 h-20 mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Ləğv edilib</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-lg">
        <div className="flex flex-col items-center text-center mb-6">
          {status?.venue_logo_url ? (
            <img src={status.venue_logo_url} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-border" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
          )}
          <h1 className="text-xl font-bold mt-3">{status?.venue_name}</h1>
          <p className="text-sm text-muted-foreground">{status?.discount_label}</p>
          <div className="mt-3 bg-muted rounded-xl px-4 py-2 text-sm">
            Müştəri: <strong>{status?.user_name}</strong>
            {status?.is_premium && <span className="ml-2 text-amber-600">★ Premium</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm font-medium text-foreground flex items-center gap-1">
            <Shield className="w-4 h-4" /> Məkan PIN kodu
          </label>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            className="w-full h-14 text-center text-2xl tracking-widest font-bold border-2 border-input rounded-xl bg-background focus:border-primary focus:outline-none"
            maxLength={12}
          />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !pin}
            className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Təsdiqlə
          </button>
        </form>

        <p className="text-[10px] text-muted-foreground text-center mt-4">Anacan Partnyor Endirim Sistemi</p>
      </div>
    </div>
  );
}
