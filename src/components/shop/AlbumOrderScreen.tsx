import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Loader2, Upload, Check, User, MapPin, FileText, CreditCard, Tag, Package, Info, icons } from 'lucide-react';
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
import { tr } from "@/lib/tr";

interface AlbumOrderScreenProps {
  albumType: 'pregnancy' | 'baby';
  onBack: () => void;
}

const albumInfo = {
  pregnancy: {
    emoji: '📸',
    title: tr("albumorderscreen_hamilelik_albomu_6f1559", 'Hamiləlik Albomu'),
    description: tr("albumorderscreen_hamilelik_dovrundeki_butun_xatireleriniz_43538c", 'Hamiləlik dövründəki bütün xatirələriniz professional şəkildə çap edilərək fiziki albom halında sizə çatdırılacaq.'),
    features: [tr("albumorderscreen_yuksek_keyfiyyetli_cap_4b079f", "Y\xFCks\u0259k keyfiyy\u0259tli \xE7ap"), tr("albumorderscreen_premium_qalin_sehifeler_6932ed", "Premium qal\u0131n s\u0259hif\u0259l\u0259r"), tr("albumorderscreen_davamli_uzluk_74e0a0", "Davaml\u0131 \xFCzl\xFCk"), tr("albumorderscreen_ferdi_dizayn_efc700", "F\u0259rdi dizayn")]
  },
  baby: {
    emoji: '👶',
    title: tr("albumorderscreen_korpe_albomu_42d4c6", 'Körpə Albomu'),
    description: tr("albumorderscreen_korpenizin_ilk_12_ayindaki_sekilleri_pro_f7f19c", 'Körpənizin ilk 12 ayındakı şəkilləri professional albom şəklində əbədiləşdirin.'),
    features: [tr("albumorderscreen_12_ayliq_xatireler_961b3a", "12 ayl\u0131q xatir\u0259l\u0259r"), tr("albumorderscreen_premium_cap_keyfiyyeti_be5e01", "Premium \xE7ap keyfiyy\u0259ti"), tr("albumorderscreen_hessas_reng_tesviri_d6afd5", "H\u0259ssas r\u0259ng t\u0259sviri"), tr("albumorderscreen_xususi_qablasdirma_5e15a5", "X\xFCsusi qabla\u015Fd\u0131rma")]
  }
};

const AlbumOrderScreen = ({ albumType, onBack }: AlbumOrderScreenProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { methods: paymentMethods, loading: pmLoading } = usePaymentMethods();
  const { couponCode, setCouponCode, appliedCoupon, validating, validateCoupon, removeCoupon, recordUsage } = useCouponValidator('album');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(tr("albumorderscreen_baki_998629", "Bak\u0131"));
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const activePaymentMethods = paymentMethods.filter((m) => m.is_active);
  const info = albumInfo[albumType];

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: tr("albumorderscreen_hesabiniza_daxil_olun_2c437b", 'Hesabınıza daxil olun'), variant: 'destructive' });
      return;
    }
    if (!name.trim() || !phone.trim()) {
      toast({ title: tr("albumorderscreen_ad_ve_telefon_mutleq_doldurulmalidir_7fdd41", 'Ad və telefon mütləq doldurulmalıdır'), variant: 'destructive' });
      return;
    }
    if (!address.trim()) {
      toast({ title: tr("albumorderscreen_catdirilma_unvanini_daxil_edin_895f4d", 'Çatdırılma ünvanını daxil edin'), variant: 'destructive' });
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
        total_price: 0
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      toast({ title: tr("albumorderscreen_xeta_bas_verdi_f22fba", 'Xəta baş verdi'), description: tr("albumorderscreen_yeniden_cehd_edin_0040c9", 'Yenidən cəhd edin'), variant: 'destructive' });
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
        <h2 className="text-xl font-bold mb-2">{tr("albumorderscreen_sifarisiniz_qebul_edildi_8a131d", "Sifarişiniz qəbul edildi! 🎉")}</h2>
        <p className="text-muted-foreground mb-1 text-sm">{tr("albumorderscreen_sifaris_nomreniz_tezlikle_gonderilecek_9398b5", "Sifariş nömrəniz tezliklə göndəriləcək.")}</p>
        <p className="text-muted-foreground mb-6 text-xs">{tr("albumorderscreen_elaqe_saxlanilacaq_ve_qiymet_barede_melu_0b90e4", "Əlaqə saxlanılacaq və qiymət barədə məlumat veriləcək.")}</p>
        <Button onClick={onBack} className="rounded-xl px-8">{tr("albumorderscreen_geri_qayit_ff66c2", "Geri qayıt")}</Button>
      </div>);

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
            {tr("albumorderscreen_fiziki_albom_sifarisi_c27c8a", "Fiziki Albom Sifari\u015Fi")}
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
                {info.features.map((f, i) =>
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    ✓ {f}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50 border border-border/50">
          <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {tr("albumorderscreen_qiymet_albom_novu_ve_sehife_sa_1b53a3", "Qiym\u0259t albom n\xF6v\xFC v\u0259 s\u0259hif\u0259 say\u0131na g\xF6r\u0259 d\u0259yi\u015Fir. Sifari\u015Fd\u0259n sonra sizinl\u0259 \u0259laq\u0259 saxlan\u0131lacaq v\u0259 d\u0259qiq qiym\u0259t bildirilic\u0259k.")}
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {tr("albumorderscreen_elaqe_melumatlari_8a7aae", "\u018Flaq\u0259 M\u0259lumatlar\u0131")}
          </h2>
          <div>
            <Label className="text-xs text-muted-foreground">{tr("untranslated_ad_soyad_lm5srh", "Ad, Soyad *")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={tr("albumorderscreen_adinizi_daxil_edin_bd2b57", "Adınızı daxil edin")} className="rounded-xl mt-1 h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{tr("albumorderscreen_telefon_nomresi_b26dbc", "Telefon nömrəsi *")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994 50 123 45 67" className="rounded-xl mt-1 h-11" />
          </div>
        </div>

        {/* Delivery Address */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {tr("albumorderscreen_catdirilma_unvani_10ea11", "\xC7atd\u0131r\u0131lma \xDCnvan\u0131")}
          </h2>
          <div>
            <Label className="text-xs text-muted-foreground">{tr("albumorderscreen_seher_5f373c", "Şəhər")}</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={tr("albumorderscreen_seher_5f373c", "Şəhər")} className="rounded-xl mt-1 h-11" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">{tr("albumorderscreen_unvan_kuce_bina_menzil_9cfd36", "Ünvan (küçə, bina, mənzil) *")}</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder={tr("albumorderscreen_tam_unvaninizi_yazin_0106c0", "Tam ünvanınızı yazın")} className="rounded-xl mt-1" rows={2} />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            {tr("albumorderscreen_elave_qeydler_49e1f1", "\u018Flav\u0259 Qeydl\u0259r")}
          </h2>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tr("albumorderscreen_xususi_istekler_mesaj_ve_s_isteye_bagli_ba89dd", "Xüsusi istəklər, mesaj və s. (istəyə bağlı)")} className="rounded-xl" rows={2} />
        </div>

        {/* Payment Methods */}
        {activePaymentMethods.length > 0 &&
        <div className="space-y-2">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              {tr("albumorderscreen_odenis_usulu_1ce843", "\xD6d\u0259ni\u015F \xDCsulu")}
            </h2>
            <div className="space-y-2">
              {activePaymentMethods.map((m) =>
            <button
              key={m.id}
              onClick={() => setPaymentMethod(m.method_key)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              paymentMethod === m.method_key ? 'border-primary bg-primary/5' : 'border-border/50 bg-card'}`
              }>
              
                  {(() => {
                const IconComp = m.icon && icons[m.icon as keyof typeof icons];
                return IconComp ? <IconComp className="w-5 h-5 text-primary" /> : <CreditCard className="w-5 h-5 text-primary" />;
              })()}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.label_az || m.label}</p>
                    {m.description_az && <p className="text-[11px] text-muted-foreground">{m.description_az}</p>}
                  </div>
                  {paymentMethod === m.method_key &&
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
              }
                </button>
            )}
            </div>
          </div>
        }

        {/* Proof upload - only for card transfer */}
        {paymentMethod === 'c2c_transfer' &&
        <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{tr("albumorderscreen_odenis_subutu_sekil_pdf_4e1fa5", "Ödəniş sübutu (şəkil/PDF)")}</Label>
            <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-border/60 cursor-pointer hover:border-primary/40 transition-all bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Upload className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{proofFile ? proofFile.name : tr("albumorderscreen_fayl_secin_6b7641", "Fayl se\xE7in")}</p>
                <p className="text-[10px] text-muted-foreground">{tr("albumorderscreen_jpg_png_ve_ya_pdf_db04d6", "JPG, PNG və ya PDF")}</p>
              </div>
              {proofFile &&
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
            }
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        }

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
            validating={validating} />
          
        </div>

        {/* Delivery Info */}
        <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{tr("albumorderscreen_catdirilma_e955cf", "Çatdırılma")}</p>
            <p className="text-[11px] text-muted-foreground">{tr("albumorderscreen_baki_daxili_pulsuz_catdirilma_regionlar__2851a6", "Bakı daxili pulsuz çatdırılma. Regionlar üçün əlavə haqqı bildiriləcək.")}</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 safe-bottom">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !name.trim() || !phone.trim() || !address.trim()}
          className="w-full h-12 rounded-2xl text-base font-bold">
          
          {submitting ?
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" />{tr("albumorderscreen_gonderilir_1d548c", "Göndərilir...")}</> : tr("albumorderscreen_sifarisi_gonder_41d5a1", "Sifari\u015Fi G\xF6nd\u0259r")


          }
        </Button>
      </div>
    </div>);

};

export default AlbumOrderScreen;