import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Smile, Thermometer, Droplets, Baby, Timer, Scale, CalendarHeart, Milk, Flower2, ShieldCheck, Unlink, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePartnerSharing, type SharingKey } from '@/hooks/usePartnerSharing';
import { supabase } from '@/integrations/supabase/client';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { tr } from '@/lib/tr';

/**
 * Ana tÉ™rÉ™fi â€” "Partnyor nÉ™lÉ™ri gÃ¶rÃ¼r?" paylaÅŸÄ±m ayarlarÄ± + baÄŸlantÄ±nÄ± kÉ™smÉ™k.
 */

interface Props {
  onBack: () => void;
}

const SWITCH_CLS = "data-[state=checked]:bg-[var(--a-peach-2)]";

interface ToggleRow {
  key: SharingKey;
  icon: any;
  bg: string;
  ink: string;
  title: string;
  sub: string;
}

const PartnerSharingScreen = ({ onBack }: Props) => {
  useScrollToTop();
  const { settings, updateSetting, loading, available } = usePartnerSharing();
  const { toast } = useToast();
  const [showUnlink, setShowUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const rows: ToggleRow[] = [
  { key: 'share_mood', icon: Smile, bg: 'var(--a-yellow-1)', ink: 'var(--a-yellow-ink)', title: tr('partnerv2_sh_ehval', 'Æhval'), sub: tr('partnerv2_sh_ehval_sub', 'GÃ¼ndÉ™lik É™hval-ruhiyyÉ™niz') },
  { key: 'share_symptoms', icon: Thermometer, bg: 'var(--a-pink-1)', ink: 'var(--a-pink-ink)', title: tr('partnerv2_sh_simptomlar', 'Simptomlar'), sub: tr('partnerv2_sh_simptomlar_sub', 'Qeyd etdiyiniz simptomlar') },
  { key: 'share_water', icon: Droplets, bg: 'var(--a-blue-1)', ink: 'var(--a-blue-ink)', title: tr('partnerv2_sh_su', 'Su qÉ™bulu'), sub: tr('partnerv2_sh_su_sub', 'GÃ¼nlÃ¼k su miqdarÄ± vÉ™ hÉ™dÉ™f') },
  { key: 'share_kicks', icon: Baby, bg: 'var(--a-pink-1)', ink: 'var(--a-pink-ink)', title: tr('partnerv2_sh_tepikler', 'TÉ™piklÉ™r'), sub: tr('partnerv2_sh_tepikler_sub', 'TÉ™pik sayÄŸacÄ± bildiriÅŸlÉ™ri') },
  { key: 'share_contractions', icon: Timer, bg: 'var(--a-lav-1)', ink: 'var(--a-lav-ink)', title: tr('partnerv2_sh_sancilar', 'SancÄ±lar'), sub: tr('partnerv2_sh_sancilar_sub', 'SancÄ± taymeri vÉ™ 5-1-1 xÉ™bÉ™rdarlÄ±ÄŸÄ±') },
  { key: 'share_weight', icon: Scale, bg: 'var(--a-surface-soft)', ink: 'var(--a-ink-soft)', title: tr('partnerv2_sh_ceki', 'Ã‡É™ki'), sub: tr('partnerv2_sh_ceki_sub', 'Ã‡É™ki qeydlÉ™riniz (standart: baÄŸlÄ±)') },
  { key: 'share_appointments', icon: CalendarHeart, bg: 'var(--a-blue-1)', ink: 'var(--a-blue-ink)', title: tr('partnerv2_sh_randevular', 'Randevular'), sub: tr('partnerv2_sh_randevular_sub', 'HÉ™kim vizitlÉ™ri vÉ™ xatÄ±rlatmalar') },
  { key: 'share_baby_logs', icon: Milk, bg: 'var(--a-green-1)', ink: 'var(--a-green-ink)', title: tr('partnerv2_sh_korpe', 'KÃ¶rpÉ™ qeydlÉ™ri'), sub: tr('partnerv2_sh_korpe_sub', 'YemÉ™, yuxu vÉ™ bez qeydlÉ™ri') },
  { key: 'share_cycle', icon: Flower2, bg: 'var(--a-pink-1)', ink: 'var(--a-pink-ink)', title: tr('partnerv2_sh_tsikl', 'Tsikl fazasÄ±'), sub: tr('partnerv2_sh_tsikl_sub', 'Faza vÉ™ nÃ¶vbÉ™ti period mÉ™lumatÄ±') }];


  const handleToggle = async (key: SharingKey, value: boolean) => {
    const ok = await updateSetting(key, value);
    if (!ok) {
      toast({ title: tr('partnerv2_sh_xeta', 'Yadda saxlanÄ±lmadÄ±'), description: tr('partnerv2_sh_xeta_sub', 'YenidÉ™n cÉ™hd edin.'), variant: 'destructive' });
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const { error } = await (supabase.rpc as any)('unlink_partners');
      if (error) throw error;
      toast({ title: tr('partnerv2_baglanti_kesildi', 'BaÄŸlantÄ± kÉ™sildi'), description: tr('partnerv2_baglanti_kesildi_sub', 'Partnyor artÄ±q mÉ™lumatlarÄ±nÄ±zÄ± gÃ¶rmÃ¼r.') });
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      console.error(e);
      toast({ title: tr('partnerv2_sh_xeta', 'Yadda saxlanÄ±lmadÄ±'), variant: 'destructive' });
      setUnlinking(false);
      setShowUnlink(false);
    }
  };

  return (
    <div className="a-scope safe-top min-h-screen pb-24 overflow-y-auto" style={{ background: 'var(--a-bg)' }}>
      <div className="a-shell">
        <header className="a-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.button onClick={onBack} className="a-icon-btn" whileTap={{ scale: 0.95 }} aria-label={tr('common_geri', 'Geri')}>
              <ArrowLeft className="rtl:rotate-180" size={16} strokeWidth={2} />
            </motion.button>
            <div>
              <p className="a-eyebrow">{tr('partnerv2_siz_idare_edirsiniz', 'Siz idarÉ™ edirsiniz')}</p>
              <p className="a-wordmark" style={{ fontSize: 16 }}>{tr('partnerv2_partnyor_nleri_gorur', 'Partnyor nÉ™lÉ™ri gÃ¶rÃ¼r?')}</p>
            </div>
          </div>
        </header>

        <div className="space-y-3.5">
          {/* Ä°zah */}
          <div className="flex items-start gap-2.5" style={{ background: 'var(--a-disclaimer-bg)', border: '1px solid var(--a-disclaimer-border)', borderRadius: 16, padding: 13 }}>
            <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: 'var(--a-disclaimer-strong)' }} />
            <p style={{ fontSize: 11.5, color: 'var(--a-disclaimer-ink)', lineHeight: 1.5 }}>
              {tr('partnerv2_sh_izah', 'ÅžÉ™xsi qeydlÉ™riniz, gÃ¼ndÉ™liyiniz vÉ™ AI sÃ¶hbÉ™tlÉ™riniz heÃ§ vaxt paylaÅŸÄ±lmÄ±r. AÅŸaÄŸÄ±dakÄ± kateqoriyalarÄ± istÉ™nilÉ™n vaxt aÃ§a/baÄŸlaya bilÉ™rsiniz â€” dÉ™rhal qÃ¼vvÉ™yÉ™ minir.')}
            </p>
          </div>

          {!available &&
          <div style={{ background: 'var(--a-yellow-1)', borderRadius: 14, padding: '10px 13px' }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--a-warn-ink)' }}>
                {tr('partnerv2_sh_migration_yox', 'Ayarlar bazasÄ± hazÄ±r deyil â€” hazÄ±rda standart paylaÅŸÄ±m aktivdir.')}
              </p>
            </div>
          }

          {/* Toggles */}
          <div style={{ background: 'var(--a-surface)', borderRadius: 'var(--a-radius-md)', boxShadow: 'var(--a-card-shadow)', overflow: 'hidden', padding: '6px 0' }}>
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.key} className="flex items-center gap-3" style={{ padding: '11px 16px' }}>
                  <div className="w-9 h-9 flex items-center justify-center shrink-0" style={{ borderRadius: 12, background: row.bg }}>
                    <Icon size={16} style={{ color: row.ink }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--a-ink)' }}>{row.title}</p>
                    <p style={{ fontSize: 10.5, color: 'var(--a-ink-soft)' }}>{row.sub}</p>
                  </div>
                  <Switch
                    className={SWITCH_CLS}
                    checked={settings[row.key]}
                    disabled={loading || !available}
                    onCheckedChange={(checked) => handleToggle(row.key, checked)} />
                </div>);
            })}
          </div>

          {/* BaÄŸlantÄ±nÄ± kÉ™s */}
          <motion.button
            onClick={() => setShowUnlink(true)}
            className="w-full flex items-center gap-4 text-start"
            style={{ padding: 14, borderRadius: 16, background: 'var(--a-alert-bg)' }}
            whileTap={{ scale: 0.98 }}>
            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ borderRadius: 13, background: 'var(--a-chip-overlay)' }}>
              <Unlink size={17} style={{ color: 'var(--a-alert-ink)' }} />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--a-alert-ink)' }}>{tr('partnerv2_baglantini_kes', 'BaÄŸlantÄ±nÄ± kÉ™s')}</p>
              <p style={{ fontSize: 11, color: 'var(--a-alert-soft)' }}>{tr('partnerv2_baglantini_kes_sub', 'Partnyor bÃ¼tÃ¼n giriÅŸini itirÉ™cÉ™k')}</p>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Unlink tÉ™sdiqi */}
      <Dialog open={showUnlink} onOpenChange={setShowUnlink}>
        <DialogContent className="a-scope rounded-[22px]">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--a-alert-ink)' }}>{tr('partnerv2_baglantini_kes', 'BaÄŸlantÄ±nÄ± kÉ™s')}?</DialogTitle>
            <DialogDescription>
              {tr('partnerv2_unlink_tesdiq_izah', 'Partnyorunuz artÄ±q heÃ§ bir mÉ™lumatÄ±nÄ±zÄ± gÃ¶rmÉ™yÉ™cÉ™k vÉ™ partnyor paneli baÄŸlanacaq. YenidÉ™n baÄŸlanmaq Ã¼Ã§Ã¼n kodu tÉ™krar paylaÅŸmalÄ±sÄ±nÄ±z.')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowUnlink(false)} className="flex-1 rounded-full">
              {tr('common_legv_et', 'LÉ™ÄŸv et')}
            </Button>
            <Button variant="destructive" onClick={handleUnlink} disabled={unlinking} className="flex-1 rounded-full">
              {unlinking ? <Loader2 className="w-4 h-4 animate-spin" /> : tr('partnerv2_beli_kes', 'BÉ™li, kÉ™s')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default PartnerSharingScreen;
