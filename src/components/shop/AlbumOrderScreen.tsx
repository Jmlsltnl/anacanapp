import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Loader2, Upload, Check, User, MapPin, FileText, CreditCard, Tag, Package, Info } from 'lucide-react';
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

const albumInfo = {
  pregnancy: {
    emoji: '📸',
    title: 'Hamiləlik Albomu',
    description: 'Hamiləlik dövründəki bütün xatirələriniz professional şəkildə çap edilərək fiziki albom halında sizə çatdırılacaq.',
    features: ['Yüksək keyfiyyətli çap', 'Premium qalın səhifələr', 'Davamlı üzlük', 'Fərdi dizayn'],
  },
  baby: {
    emoji: '👶',
    title: 'Körpə Albomu',
    description: 'Körpənizin ilk 12 ayındakı şəkilləri professional albom şəklində əbədiləşdirin.',
    features: ['12 aylıq xatirələr', 'Premium çap keyfiyyəti', 'Həssas rəng təsviri', 'Xüsusi qablaşdırma'],
  },
};

const AlbumOrderScreen = ({ albumType, onBack }: AlbumOrderScreenProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { methods: paymentMethods, loading: pmLoading } = usePaymentMethods();
  const { couponCode, setCouponCode, appliedCoupon, validating, validateCoupon, removeCoupon, recordUsage } = useCouponValidator('album');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bakı');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const activePaymentMethods = paymentMethods.filter(m => m.is_active);
  const info = albumInfo[albumType];

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Hesabınıza daxil olun', variant: 'destructive' });
      return;
    }
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Ad və telefon mütləq doldurulmalıdır', variant: 'destructive' });
      return;
    }
    if (!address.trim()) {
      toast({ title: 'Çatdırılma ünvanını daxil edin', variant: 'destructive' });
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
        delivery_address: `${city}, ${address}`,
        notes,
        payment_method: paymentMethod,
        payment_proof_url: proofUrl,
        total_price: 0,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      toast({ title: 'Xəta baş verdi', description: 'Yenidən cəhd edin', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }} className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-green-600" />
        </motion.div>
        <h2 className="text-xl font-bold mb-2">Sifarişiniz qəbul edildi! 🎉</h2>
        <p className="text-muted-foreground mb-1 text-sm">Sifariş nömrəniz tezliklə göndəriləcək.</p>
        <p className="text-muted-foreground mb-6 text-xs">Əlaqə saxlanılacaq və qiymət barədə məlumat veriləcək.</p>
        <Button onClick={onBack} className="rounded-xl px-8">Geri qayıt</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
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
        {/* Album Info Card */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{info.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-bold mb-1">{info.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{info.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {info.features.map((f, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Qiymət albom növü və səhifə sayına görə dəyişir. Sifarişdən sonra sizinlə əlaqə saxlanılacaq və dəqiq qiymət bildirilicək.
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Əlaqə Məlumatları
          </h2>
          <div>
            <Label className="text-xs text-muted-foreground">Ad, Soyad *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Adınızı daxil edin" className="rounded-xl mt-1 h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Telefon nömrəsi *</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+994 50 123 45 67" className="rounded-xl mt-1 h-11" />
          </div>
        </div>

        {/* Delivery Address */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Çatdırılma Ünvanı
          </h2>
          <div>
            <Label className="text-xs text-muted-foreground">Şəhər</Label>
            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Şəhər" className="rounded-xl mt-1 h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Ünvan (küçə, bina, mənzil) *</Label>
            <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Tam ünvanınızı yazın" className="rounded-xl mt-1" rows={2} />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Əlavə Qeydlər
          </h2>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Xüsusi istəklər, mesaj və s. (istəyə bağlı)" className="rounded-xl" rows={2} />
        </div>

        {/* Payment Methods */}
        {activePaymentMethods.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Ödəniş Üsulu
            </h2>
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
                  {paymentMethod === m.method_key && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Proof upload - only for card transfer */}
        {paymentMethod === 'c2c_transfer' && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ödəniş sübutu (şəkil/PDF)</Label>
            <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border/60 cursor-pointer hover:border-primary/40 transition-all bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Upload className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{proofFile ? proofFile.name : 'Fayl seçin'}</p>
                <p className="text-[10px] text-muted-foreground">JPG, PNG və ya PDF</p>
              </div>
              {proofFile && (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => setProofFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        )}

        {/* Coupon Code */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Kupon Kodu
          </h2>
          <CouponInput
            couponCode={couponCode}
            onCodeChange={setCouponCode}
            onApply={() => validateCoupon(couponCode, 0)}
            onRemove={removeCoupon}
            appliedCoupon={appliedCoupon}
            validating={validating}
          />
        </div>

        {/* Delivery Info */}
        <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Çatdırılma</p>
            <p className="text-[11px] text-muted-foreground">Bakı daxili pulsuz çatdırılma. Regionlar üçün əlavə haqqı bildiriləcək.</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 safe-bottom">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !name.trim() || !phone.trim() || !address.trim()}
          className="w-full h-12 rounded-2xl text-base font-bold"
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Göndərilir...</>
          ) : (
            'Sifarişi Göndər'
          )}
        </Button>
      </div>
    </div>
  );
};

export default AlbumOrderScreen;
