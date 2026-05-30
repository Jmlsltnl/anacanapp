import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { X, RefreshCw, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { createRedemption, RedemptionResponse } from '@/hooks/usePartnerVenues';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
}

export default function RedemptionQRSheet({ open, onClose, venueId, venueName }: Props) {
  const [data, setData] = useState<RedemptionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const r = await createRedemption(venueId);
      setData(r);
    } catch (e: any) {
      const msg = e?.message || 'Xəta';
      const map: Record<string, string> = {
        premium_required: 'Bu funksiya yalnız Premium üzvlər üçündür.',
        cooldown: 'Bu məkanda hələ endirim istifadə etmisiniz. Bir az gözləyin.',
        lifetime_limit_reached: 'Bu məkan üçün endirim limiti dolub.',
        venue_inactive: 'Məkan müvəqqəti olaraq aktiv deyil.',
        venue_not_found: 'Məkan tapılmadı.',
      };
      setError(map[msg] || msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) generate();
    else { setData(null); setError(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, venueId]);

  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [open]);

  const expiresMs = data ? new Date(data.expires_at).getTime() : 0;
  const remainingSec = Math.max(0, Math.floor((expiresMs - now) / 1000));
  const expired = data && remainingSec <= 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[92vh] overflow-y-auto">
        <div className="p-5 pb-8 flex flex-col items-center text-center">
          <div className="w-12 h-1.5 bg-muted rounded-full mb-4" />
          <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Anacan Endirimi</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">{venueName}</h2>
          {data && <p className="text-sm text-muted-foreground mb-4">{data.discount_label}</p>}

          {loading && (
            <div className="py-10">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">QR yaradılır...</p>
            </div>
          )}

          {error && !loading && (
            <div className="w-full bg-destructive/10 border border-destructive/30 rounded-2xl p-5 my-4 flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button onClick={generate} variant="outline" size="sm">Yenidən cəhd et</Button>
            </div>
          )}

          {data && !error && (
            <>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white p-5 rounded-3xl shadow-lg border-4 border-primary/20 my-3"
              >
                <QRCodeSVG value={data.verify_url} size={240} level="M" includeMargin={false} />
              </motion.div>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${
                expired ? 'bg-destructive/15 text-destructive' :
                remainingSec < 60 ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
              }`}>
                {expired ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {expired ? 'Müddəti bitdi' : `Qalan vaxt: ${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, '0')}`}
              </div>

              <p className="text-xs text-muted-foreground max-w-xs mt-4 leading-relaxed">
                Kassir telefonun kamerası ilə bu QR-ı oxuyacaq və PIN kodunu daxil edərək təsdiqləyəcək.
              </p>

              {expired && (
                <Button onClick={generate} className="mt-4 w-full" size="lg">
                  <RefreshCw className="w-4 h-4 mr-2" /> Yeni QR yarat
                </Button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
