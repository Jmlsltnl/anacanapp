import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Loader2, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useCouponValidator } from '@/hooks/useCoupons';
import CouponInput from './CouponInput';
import { useToast } from '@/hooks/use-toast';

interface AlbumOrderScreenProps {
  albumType: 'pregnancy' | 'baby';
  onBack: () => void;
}

const AlbumOrderScreen = ({ albumType, onBack }: AlbumOrderScreenProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { methods: paymentMethods, loading: pmLoading } = usePaymentMethods();
  const { couponCode, setCouponCode, appliedCoupon, validating, validateCoupon, removeCoupon, recordUsage } = useCouponValidator('album');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const activePaymentMethods = paymentMethods.filter(m => m.is_active);

  const handleSubmit = async () => {
    if (!user || !name.trim() || !phone.trim()) {
      toast({ title: 'Ad və telefon tələb olunur', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      let proofUrl: string | null = null;
      if (proofFile) {
        const ext = proofFile.name.split('.').pop();
        const path = `album-proofs/${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('assets').upload(path, proofFile);
        if (!uploadErr) {
          proofUrl = supabase.storage.from('assets').getPublicUrl(path).data.publicUrl;
        }
      }

      const { error } = await supabase.from('album_orders' as any).insert({
        user_id: user.id,
        album_type: albumType,
        customer_name: name,
        contact_phone: phone,
        delivery_address: address,
        notes,
        payment_method: paymentMethod,
        payment_proof_url: proofUrl,
        total_price: 0, // Admin sets price
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </motion.div>
        <h2 className="text-xl font-bold mb-2">Sifarişiniz qəbul edildi!</h2>
        <p className="text-muted-foreground mb-6 text-sm">Tezliklə sizinlə əlaqə saxlanılacaq.</p>
        <Button onClick={onBack} className="rounded-xl">Geri qayıt</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-3 safe-area-top flex items-center gap-3">
          <motion.button onClick={onBack} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center" whileTap={{ scale: 0.95 }}>
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Fiziki Albom Sifarişi
          </h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <p className="text-sm font-semibold mb-1">
            {albumType === 'pregnancy' ? '📸 Hamiləlik Albomu' : '👶 Körpə Albomu'}
          </p>
          <p className="text-xs text-muted-foreground">
            Bütün şəkilləriniz professional şəkildə çap edilərək fiziki albom şəklində çatdırılacaq.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-sm">Ad, Soyad *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Adınız" className="rounded-xl mt-1" />
          </div>
          <div>
            <Label className="text-sm">Telefon *</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+994 XX XXX XX XX" className="rounded-xl mt-1" />
          </div>
          <div>
            <Label className="text-sm">Çatdırılma ünvanı</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Ünvan" className="rounded-xl mt-1" />
          </div>
          <div>
            <Label className="text-sm">Qeydlər</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Əlavə qeydlər..." className="rounded-xl mt-1" rows={2} />
          </div>

          {/* Payment Methods */}
          {activePaymentMethods.length > 0 && (
            <div>
              <Label className="text-sm mb-2 block">Ödəniş üsulu</Label>
              <div className="space-y-2">
                {activePaymentMethods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.method_key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === m.method_key ? 'border-primary bg-primary/5' : 'border-border/50 bg-card'
                    }`}
                  >
                    <span className="text-lg">{m.icon || '💳'}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.label_az || m.label}</p>
                      {m.description_az && <p className="text-[11px] text-muted-foreground">{m.description_az}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Proof upload */}
          {paymentMethod && (
            <div>
              <Label className="text-sm">Ödəniş sübutu (şəkil)</Label>
              <label className="mt-1 flex items-center gap-2 p-3 rounded-xl border-2 border-dashed border-border/60 cursor-pointer hover:border-primary/40 transition-all">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{proofFile ? proofFile.name : 'Şəkil seçin'}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setProofFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          )}

          {/* Coupon Code */}
          <div>
            <Label className="text-sm mb-2 block">Kupon kodu</Label>
            <CouponInput
              couponCode={couponCode}
              onCodeChange={setCouponCode}
              onApply={() => validateCoupon(couponCode, 0)}
              onRemove={removeCoupon}
              appliedCoupon={appliedCoupon}
              validating={validating}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={submitting || !name || !phone} className="w-full h-12 rounded-2xl text-base font-bold">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sifariş et'}
        </Button>
      </div>
    </div>
  );
};

export default AlbumOrderScreen;
