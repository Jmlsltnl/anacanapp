import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Bell, Shield, HelpCircle, LogOut,
  ChevronRight, Crown, Copy, Share2,
  Heart, Calendar, Palette, ShieldCheck, Edit, CreditCard, Info, ArrowLeft, X,
  MessageCircle, Baby, ShoppingCart, TrendingUp, Gift, Plus, Trash2, Users,
  FileText, Scale, AlertCircle, RotateCcw, Database, Sparkles } from
'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics } from '@/hooks/useScreenAnalytics';
import { useChildren, Child } from '@/hooks/useChildren';
import { PremiumModal } from '@/components/PremiumModal';
import { useSubscription } from '@/hooks/useSubscription';
import { nativeShare } from '@/lib/native';
import BannerSlot from '@/components/banners/BannerSlot';
import LanguageSelector from '@/components/LanguageSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import countriesData from '../../countries.json';
import { tr } from "@/lib/tr";

interface ProfileScreenProps {
  onNavigate?: (screen: string) => void;
}

const ProfileScreen = ({ onNavigate }: ProfileScreenProps) => {
  useScrollToTop();
  useScreenAnalytics('Profile', 'Profile');

  const { name, email, lifeStage, role } = useUserStore();
  const { signOut, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const { unreadCount } = useNotifications();
  const { children, addChild, updateChild, deleteChild, getChildAge } = useChildren();
  const { isPremium } = useSubscription();
  const [partnerCode] = useState(profile?.partner_code || 'ANACAN-XXXX');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [childForm, setChildForm] = useState<{name: string;birth_date: string;gender: 'boy' | 'girl';}>({ name: '', birth_date: '', gender: 'boy' });

  const genderOptions = [
  { value: 'boy', label: tr("profilescreen_oglan_e9715e", 'Oğlan'), emoji: '👦' },
  { value: 'girl', label: tr("profilescreen_qiz_79bf6b", 'Qız'), emoji: '👧' }];


  const handleAddChild = async () => {
    if (!childForm.name || !childForm.birth_date) {
      toast({ title: tr("profilescreen_ad_ve_dogum_tarixi_teleb_olunur_bdab04", 'Ad və doğum tarixi tələb olunur'), variant: 'destructive' });
      return;
    }
    const child = await addChild({
      name: childForm.name,
      birth_date: childForm.birth_date,
      gender: childForm.gender,
      avatar_emoji: genderOptions.find((g) => g.value === childForm.gender)?.emoji || '👶'
    });
    if (child) {
      toast({ title: `${childForm.name} ${tr("profile_child_added", "əlavə edildi")}` });
      setShowChildModal(false);
      setChildForm({ name: '', birth_date: '', gender: 'boy' });
    }
  };

  const handleEditChild = async () => {
    if (!editingChild || !childForm.name || !childForm.birth_date) return;
    const success = await updateChild(editingChild.id, {
      name: childForm.name,
      birth_date: childForm.birth_date,
      gender: childForm.gender,
      avatar_emoji: genderOptions.find((g) => g.value === childForm.gender)?.emoji || '👶'
    });
    if (success) {
      toast({ title: tr("profilescreen_yenilendi_d10a01", 'Yeniləndi') });
      setEditingChild(null);
      setChildForm({ name: '', birth_date: '', gender: 'boy' });
    }
  };

  const handleDeleteChild = async (child: Child) => {
    if (confirm(`${child.name} ${tr("profilescreen_silinsin_question", "silinsin?")}`)) {
      await deleteChild(child.id);
      toast({ title: tr("common_silindi", 'Silindi') });
    }
  };

  const openEditChild = (child: Child) => {
    setChildForm({ name: child.name, birth_date: child.birth_date, gender: child.gender === 'unknown' ? 'boy' : child.gender });
    setEditingChild(child);
  };

  const menuItems = [
  { id: 'billing', icon: CreditCard, label: tr("profilescreen_abuneliyim_f6c8ed", 'Abunəliyim') },
  { id: 'referral', icon: Gift, label: tr("profilescreen_referral", 'Dostunu dəvət et'), badge: tr("profilescreen_referral_badge", '+7 gün') },
  { id: 'partners', icon: Sparkles, label: tr("profilescreen_partnyor_endirimleri_e44036", "Partnyor Endirimləri"), badge: tr("profilescreen_badge_yeni", "Yeni") },
  { id: 'notifications', icon: Bell, label: tr("profilescreen_bildirisler_54eb88", 'Bildirişlər'), badge: unreadCount > 0 ? String(unreadCount) : undefined },
  { id: 'doctor-report', icon: FileText, label: tr("profilescreen_hekim_hesabati", 'Həkim Hesabatı (PDF)') },
  { id: 'appearance', icon: Palette, label: tr("profilescreen_gorunus_165fe3", 'Görünüş') },
  { id: 'calendar', icon: Calendar, label: tr("profilescreen_teqvim_ayarlari_012790", 'Təqvim Ayarları') },
  { id: 'privacy', icon: Shield, label: tr("profilescreen_gizlilik", "Gizlilik") },
  { id: 'help', icon: HelpCircle, label: tr("profilescreen_yardim_da857a", 'Yardım') },
  ...(isAdmin ? [
  { id: 'shop', icon: ShoppingCart, label: tr("profilescreen_magaza_test_72b060", 'Mağaza (Test)'), badge: 'Beta' },
  { id: 'admin', icon: ShieldCheck, label: tr("profilescreen_admin_panel", "Admin Panel"), badge: 'Admin' }] :
  [])];


  const copyPartnerCode = async () => {
    await nativeShare({
      title: tr("profile_partnyor_kodu", 'Partnyor Kodu'),
      text: `${tr("profile_partnyor_kodum", 'Partnyor kodum')}: ${partnerCode}`
    });
  };

  const sharePartnerCode = async () => {
    const shareText = `${tr("profile_share_partner_text", "Anacan tətbiqinə qoşul və hamiləlik səyahətimizdə mənə dəstək ol! Partnyor kodum:")} ${partnerCode}\n\n${tr("profile_download_app", "Tətbiqi yüklə:")} https://anacanapp.lovable.app`;

    const success = await nativeShare({
      title: tr("profile_partnyor_kodu", 'Partnyor Kodu'),
      text: shareText
    });

    if (success) {
      toast({
        title: tr("profilescreen_paylasildi_c7d9ef", 'Paylaşıldı!'),
        description: tr("profilescreen_partnyor_kodu_ugurla_paylasildi_d66277", 'Partnyor kodu uğurla paylaşıldı.')
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: tr("profilescreen_cixis_edildi_fb4a43", 'Çıxış edildi'),
      description: tr("profilescreen_ugurla_cixis_etdiniz_9e8d3c", 'Uğurla çıxış etdiniz.')
    });
  };

  const getStageInfo = () => {
    switch (lifeStage) {
      case 'flow':return { name: 'Menstruasiya', emoji: '🌸', color: 'flow' };
      case 'bump':return { name: tr("profilescreen_hamilelik_e86feb", "Hamiləlik"), emoji: '🤰', color: 'bump' };
      case 'mommy':return { name: tr("profilescreen_analiq_9e762d", "Analıq"), emoji: '👶', color: 'mommy' };
      default:return { name: tr("profilescreen_secilmeyib_11e27e", "Seçilməyib"), emoji: '✨', color: 'primary' };
    }
  };

  const stageInfo = getStageInfo();
  
  const userCountry = countriesData.find(c => c.isoAlpha2 === (profile as any)?.country_code);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className="a-scope pb-8" style={{ background: 'var(--a-bg)', minHeight: '100%' }}>
      <div className="a-shell">
      {/* Top bar */}
      <motion.header
        className="a-topbar"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}>
        
        <div>
          <p className="a-eyebrow">{stageInfo.name}</p>
          <p className="a-wordmark" style={{ fontSize: 18 }}>{tr("untranslated_profil_v8b0sk", "Profil")}</p>
        </div>
        <div className="a-topbar-actions">
          <motion.button
            onClick={() => onNavigate?.('settings')}
            className="a-icon-btn"
            whileTap={{ scale: 0.9 }}>
            
            <Settings size={16} strokeWidth={2} />
          </motion.button>
        </div>
      </motion.header>

      {/* Top Banner Slot */}
      <BannerSlot placement="profile_top" onNavigate={onNavigate} className="mb-3" />

      {/* Profile Card (anacan-demo CTA hero) */}
      <motion.div
        className="a-cta a-fade-in"
        style={{ background: 'var(--a-grad-peach)' }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}>
        
        <span className="a-cta-shape" style={{ width: 140, height: 140, top: -50, right: -40, background: 'rgba(255,255,255,0.35)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-14 h-14 flex items-center justify-center text-3xl overflow-hidden flex-shrink-0"
            style={{ borderRadius: 16, background: 'var(--a-chip-overlay)', boxShadow: '0 8px 16px -8px rgba(138, 69, 20, 0.4)' }}>
            {profile?.avatar_url ?
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> :

            stageInfo.emoji
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="a-heading" style={{ margin: 0, fontSize: 17, color: 'var(--a-cta-ink)' }}>{profile?.name || name || tr("profilescreen_i_stifadeci_b6bdd6", "\u0130stifad\u0259\xE7i")}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, fontWeight: 600, color: 'var(--a-cta-ink)', opacity: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.email || email || 'email@example.com'}</p>
            <div className="mt-2 flex gap-1.5 flex-wrap">
              <span className="a-cta-badge" style={{ background: 'var(--a-chip-overlay)', color: 'var(--a-cta-ink)', padding: '4px 9px', fontSize: 10 }}>
                {stageInfo.emoji} {stageInfo.name}
              </span>
              {userCountry && (
                <span className="a-cta-badge" style={{ background: 'var(--a-chip-overlay)', color: 'var(--a-cta-ink)', padding: '4px 9px', fontSize: 10 }}>
                  <img src={userCountry.flag.startsWith('data:') ? userCountry.flag : `data:image/png;base64,${userCountry.flag}`} alt="" style={{ width: 14, height: 10, objectFit: 'cover', borderRadius: 2 }} />
                  {userCountry.name}
                </span>
              )}
              {isAdmin && (
                <span className="a-cta-badge" style={{ background: 'var(--a-chip-overlay)', color: 'var(--a-cta-ink)', padding: '4px 9px', fontSize: 10 }}>
                  👑 Admin
                </span>
              )}
            </div>
          </div>
          <motion.button
            onClick={() => onNavigate?.('edit-profile')}
            className="a-icon-btn"
            style={{ flexShrink: 0 }}
            whileTap={{ scale: 0.9 }}>
            
            <Edit size={15} strokeWidth={2} />
          </motion.button>
        </div>
      </motion.div>

      {/* Premium Banner */}
      <motion.button
        onClick={() => isPremium ? onNavigate?.('billing') : setShowPremiumModal(true)}
        className="a-card a-fade-in"
        style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '14px 18px', marginTop: 12 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.98 }}>
        
        <div className="a-rank-row" style={{ borderTop: 'none', padding: 0 }}>
          <span className="a-rank-avatar" style={{ background: 'var(--a-grad-yellow)', color: 'var(--a-warn-ink)' }}>
            <Crown size={18} strokeWidth={2} />
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="a-rank-title">{isPremium ? 'Anacan Premium ✨' : 'Anacan Premium'}</p>
            <p className="a-rank-sub">
              {isPremium ? tr("profilescreen_premium_abuneliyiniz_aktivdir_9f6e62", "Premium abunəliyiniz aktivdir") : tr("profilescreen_butun_xususiyyetleri_acin_a7583b", "Bütün xüsusiyyətləri açın")}
            </p>
          </div>
          <ChevronRight className="a-list-chevron" style={{ marginLeft: 'auto' }} size={18} />
        </div>
      </motion.button>

      {/* Partner Code */}
      {role === 'woman' &&
      <motion.div
        className="a-card a-fade-in"
        style={{ marginTop: 12 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}>
        
          <div className="a-list-row" style={{ padding: '0 0 12px', borderTop: 'none' }}>
            <span className="a-list-icon" style={{ background: 'var(--a-grad-pink)', color: 'var(--a-berry-ink)' }}>
              <Heart size={17} strokeWidth={2} />
            </span>
            <div>
              <p className="a-list-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {tr("profile_partnyor_kodu", "Partnyor Kodu")}
                {!isPremium && <Crown size={13} style={{ color: 'var(--a-yellow-2)' }} />}
              </p>
              <p className="a-list-sub">
                {isPremium ? tr("profilescreen_heyat_yoldasinizla_paylasin_49ec6d", "H\u0259yat yolda\u015F\u0131n\u0131zla payla\u015F\u0131n") : tr("profilescreen_premium_ile_partnyorunuzu_deve_d6917f", "Premium il\u0259 partnyorunuzu d\u0259v\u0259t edin")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 relative" style={{ padding: 12, borderRadius: 16, background: 'var(--a-surface-soft)' }}>
            <code
            className={`flex-1 text-center font-mono font-bold text-lg tracking-wider ${
            !isPremium ? 'blur-sm select-none' : ''}`
            }
            style={{ color: 'var(--a-ink)' }}>
            
              {partnerCode}
            </code>
            {isPremium ?
          <>
                <motion.button
              onClick={copyPartnerCode}
              className="a-icon-btn"
              whileTap={{ scale: 0.9 }}>
              
                  <Copy size={16} strokeWidth={2} />
                </motion.button>
                <motion.button
              onClick={sharePartnerCode}
              className="a-icon-btn"
              style={{ background: 'var(--a-peach-2)', color: '#fff', border: 'none' }}
              whileTap={{ scale: 0.9 }}>
              
                  <Share2 size={16} strokeWidth={2} />
                </motion.button>
              </> :

          <motion.button
            onClick={() => setShowPremiumModal(true)}
            className="absolute inset-0 flex items-center justify-center gap-2"
            style={{ borderRadius: 16, background: 'var(--a-grad-yellow)', color: 'var(--a-warn-ink)', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer' }}
            whileTap={{ scale: 0.97 }}>
            
                <Crown size={15} strokeWidth={2.2} />
                {tr("profilescreen_premium_ile_ac_7aa6ba", "Premium il\u0259 a\xE7")}
              </motion.button>
          }
          </div>

          {/* Partner Info Button */}
          <motion.button
          onClick={() => setShowPartnerInfo(true)}
          className="a-teaser w-full"
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px dashed var(--a-line-strong)', cursor: 'pointer' }}
          whileTap={{ scale: 0.98 }}>
          
            <Info size={15} style={{ color: 'var(--a-pink-2)', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{tr("profilescreen_partnyor_neler_gore_ve_ede_biler_3fa7fa", "Partnyor nələr görə və edə bilər?")}</span>
            <ChevronRight size={15} className="a-list-chevron" />
          </motion.button>

          {/* Paylaşım ayarları — yalnız bağlı partnyor olduqda */}
          {profile?.linked_partner_id &&
          <motion.button
          onClick={() => onNavigate?.('partner-sharing')}
          className="a-teaser w-full"
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', background: 'none', border: 'none', borderTop: '1px dashed var(--a-line-strong)', cursor: 'pointer' }}
          whileTap={{ scale: 0.98 }}>

              <Shield size={15} style={{ color: 'var(--a-blue-2)', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{tr("partnerv2_partnyor_nleri_gorur", "Partnyor nələri görür?")}</span>
              <ChevronRight size={15} className="a-list-chevron" />
            </motion.button>
          }
        </motion.div>
      }

      {/* Partner Info Modal */}
      <AnimatePresence>
        {showPartnerInfo &&
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowPartnerInfo(false)}>
          
            <motion.div
            className="bg-card w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            onClick={(e) => e.stopPropagation()}>
            
              {/* Header */}
              <div className="sticky top-0 bg-card p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{tr("profilescreen_partnyor_rejimi_haqqinda_7eeca8", "Partnyor Rejimi Haqqında")}</h2>
                <motion.button
                onClick={() => setShowPartnerInfo(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                whileTap={{ scale: 0.9 }}>
                
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="p-5 pb-24 space-y-6">
                {/* Intro */}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-partner/10 flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-8 h-8 text-partner" />
                  </div>
                  <p className="text-muted-foreground">
                    {tr("profilescreen_partnyor_kodu_ile_heyat_yoldas_2bcf5d", "Partnyor kodu il\u0259 h\u0259yat yolda\u015F\u0131n\u0131z t\u0259tbiq\u0259 qo\u015Fularaq hamil\u0259lik s\u0259yah\u0259tiniz\u0259 d\u0259st\u0259k ola bil\u0259r.")}
                  </p>
                </div>

                {/* What partner can see */}
                <div>
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    {tr("profilescreen_partnyor_neleri_gore_biler_c11f93", "\uD83D\uDC41\uFE0F Partnyor n\u0259l\u0259ri g\xF6r\u0259 bil\u0259r?")}
                  </h3>
                  <div className="space-y-2">
                    {[
                  { icon: Baby, text: tr("profilescreen_korpenin_heftelik_inkisafi_ve_olculeri_0474b5", "Körpənin həftəlik inkişafı və ölçüləri") },
                  { icon: TrendingUp, text: tr("profilescreen_sizin_gundelik_ehvaliniz_ve_simptomlarin_8fde56", "Sizin gündəlik əhvalınız və simptomlarınız") },
                  { icon: Calendar, text: tr("profilescreen_hekim_gorusleri_ve_vacib_tarixler_a345c4", "Həkim görüşləri və vacib tarixlər") },
                  { icon: Heart, text: tr("profilescreen_tepik_saygaci_ve_buzusme_izleyicisi_melu_7f7ba1", "Təpik sayğacı və büzüşmə izləyicisi məlumatları") }].
                  map((item, i) =>
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <item.icon className="w-5 h-5 text-primary" />
                        <span className="text-sm text-foreground">{item.text}</span>
                      </div>
                  )}
                  </div>
                </div>

                {/* What partner can do */}
                <div>
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    {tr("profilescreen_partnyor_neler_ede_biler_44c3d7", "\u2728 Partnyor n\u0259l\u0259r ed\u0259 bil\u0259r?")}
                  </h3>
                  <div className="space-y-2">
                    {[
                  { icon: MessageCircle, text: tr("profilescreen_size_sevgi_mesajlari_ve_destek_gondere_b_7c91fb", "Sizə sevgi mesajları və dəstək göndərə bilər") },
                  { icon: ShoppingCart, text: tr("profilescreen_ortaq_alis_veris_siyahisina_elave_ede_bi_8dd341", "Ortaq alış-veriş siyahısına əlavə edə bilər") },
                  { icon: Gift, text: tr("profilescreen_surprizler_planlasdirib_xallar_toplaya_b_9fe114", "Sürprizlər planlaşdırıb xallar toplaya bilər") },
                  { icon: TrendingUp, text: tr("profilescreen_missiyalari_yerine_yetirib_seviyye_qazan_719718", "Missiyaları yerinə yetirib səviyyə qazana bilər") }].
                  map((item, i) =>
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <item.icon className="w-5 h-5 text-partner" />
                        <span className="text-sm text-foreground">{item.text}</span>
                      </div>
                  )}
                  </div>
                </div>

                {/* Privacy note */}
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    🔒 <strong className="text-foreground">{tr("profilescreen_gizlilik", "Gizlilik")}:</strong> {tr("profilescreen_partnyor_sizin_sexsi_qeydlerin_3abbaa", "Partnyor sizin \u015F\u0259xsi qeydl\u0259rinizi, g\xFCnd\u0259lik mesajlar\u0131n\u0131z\u0131 v\u0259 ya AI s\xF6hb\u0259tl\u0259rinizi g\xF6r\u0259 bilm\u0259z.")}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Children Management Section - Only for mommy stage */}
      {lifeStage === 'mommy' &&
      <motion.div
        className="a-card a-fade-in"
        style={{ marginTop: 12 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.28 }}>
        
          <div className="a-card-head" style={{ marginBottom: children.length > 0 ? 4 : 12 }}>
            <div className="a-list-row" style={{ padding: 0, borderTop: 'none', gap: 10 }}>
              <span className="a-list-icon" style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--a-pink-1)', color: 'var(--a-berry-ink)' }}>
                <Users size={15} strokeWidth={2} />
              </span>
              <div>
                <h3 className="a-card-title a-heading">{tr("profilescreen_usaqlarim_d988f7", "Uşaqlarım")}</h3>
                <p className="a-list-sub">
                  {children.length === 0 ? tr("profilescreen_usaq_elave_et_48f1f0", "U\u015Faq \u0259lav\u0259 et") : children.length === 1 ? tr("profilescreen_one_child_count", "1 uşaq") : `${children.length} ${tr("profilescreen_child_plural_suffix", "uşaq")}`}
                </p>
              </div>
            </div>
            <motion.button
            onClick={() => {
              setChildForm({ name: '', birth_date: '', gender: 'boy' });
              setShowChildModal(true);
            }}
            className="a-icon-btn"
            style={{ width: 32, height: 32 }}
            whileTap={{ scale: 0.9 }}>
            
              <Plus size={15} strokeWidth={2.4} />
            </motion.button>
          </div>

          {children.length > 0 &&
        <div>
              {children.map((child) => {
            const age = getChildAge(child);
            return (
              <div key={child.id} className="a-rank-row">
                    <span className="a-rank-avatar" style={{ background: 'var(--a-surface-soft)', fontSize: 20 }}>{child.avatar_emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <p className="a-rank-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{child.name}</p>
                      <p className="a-rank-sub">{age.displayText}</p>
                    </div>
                    <motion.button
                  onClick={() => openEditChild(child)}
                  className="a-icon-btn"
                  style={{ width: 30, height: 30, marginLeft: 'auto' }}
                  whileTap={{ scale: 0.9 }}>
                  
                      <Edit size={13} strokeWidth={2} />
                    </motion.button>
                  </div>);

          })}
            </div>
        }

          {children.length === 0 &&
        <button
          onClick={() => {
            setChildForm({ name: '', birth_date: '', gender: 'boy' });
            setShowChildModal(true);
          }}
          className="w-full flex flex-col items-center gap-2"
          style={{ padding: 16, borderRadius: 16, border: '2px dashed var(--a-line-strong)', background: 'none', cursor: 'pointer', color: 'var(--a-ink-soft)' }}>
          
              <Baby size={28} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{tr("profilescreen_ilk_usagi_elave_et_251a77", "İlk uşağı əlavə et")}</span>
            </button>
        }
        </motion.div>
      }

      {/* Add/Edit Child Modal */}
      <Dialog open={showChildModal || !!editingChild} onOpenChange={(open) => {
        if (!open) {
          setShowChildModal(false);
          setEditingChild(null);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingChild ? tr("profilescreen_usaq_redakte_et_53eb46", "U\u015Faq Redakt\u0259 Et") : tr("profilescreen_usaq_elave_et_d57c06", "U\u015Faq \u018Flav\u0259 Et")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{tr("untranslated_ad_i34vkg", "Ad")}</label>
              <Input
                value={childForm.name}
                onChange={(e) => setChildForm((p) => ({ ...p, name: e.target.value }))}
                placeholder={tr("profilescreen_korpenin_adi_8a4e9e", "Körpənin adı")} />
              
            </div>
            <div>
              <label className="text-sm font-medium">{tr("profilescreen_dogum_tarixi_d96907", "Doğum tarixi")}</label>
              <Input
                type="date"
                value={childForm.birth_date}
                onChange={(e) => setChildForm((p) => ({ ...p, birth_date: e.target.value }))}
                max={new Date().toISOString().split('T')[0]} />
              
            </div>
            <div>
              <label className="text-sm font-medium">{tr("untranslated_cins_f3ymi9", "Cins")}</label>
              <div className="flex gap-2 mt-2">
                {genderOptions.map((opt) =>
                <button
                  key={opt.value}
                  onClick={() => setChildForm((p) => ({ ...p, gender: opt.value as 'boy' | 'girl' }))}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                  childForm.gender === opt.value ?
                  'border-primary bg-primary/10' :
                  'border-muted hover:border-muted-foreground/30'}`
                  }>
                  
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingChild ? handleEditChild : handleAddChild} className="flex-1">
                {editingChild ? tr("childselector_save", "Yadda saxla") : tr("profilescreen_elave_et_6e1b9b", "\u018Flav\u0259 et")}
              </Button>
              {editingChild &&
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  handleDeleteChild(editingChild);
                  setEditingChild(null);
                }}>
                
                  <Trash2 className="w-4 h-4" />
                </Button>
              }
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Items */}
      <motion.div
        className="a-list-card a-fade-in"
        style={{ marginTop: 12 }}
        variants={containerVariants}
        initial="hidden"
        animate="visible">
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              variants={itemVariants}
              onClick={() => onNavigate?.(item.id)}
              className="a-list-row w-full"
              style={{ width: '100%', textAlign: 'left', background: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', cursor: 'pointer' }}>
              
              <span className="a-list-icon" style={{ background: 'var(--a-surface-soft)', color: 'var(--a-ink-soft)' }}>
                <Icon size={17} strokeWidth={2} />
              </span>
              <p className="a-list-title" style={{ flex: 1 }}>{item.label}</p>
              {item.badge &&
              <span className="a-tag on" style={{ cursor: 'default', padding: '4px 9px', fontSize: 10 }}>
                  {item.badge}
                </span>
              }
              <ChevronRight size={16} className="a-list-chevron" />
            </motion.button>);

        })}
      </motion.div>

      {/* Dil seçimi — əlçatan yerdə (Settings-də deyil) */}
      <motion.div
        style={{ marginTop: 12 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}>
        <LanguageSelector />
      </motion.div>

      {/* Logout */}
      <motion.button
        onClick={handleLogout}
        className="a-cta-btn"
        style={{ width: '100%', justifyContent: 'center', marginTop: 12, background: 'var(--a-pink-1)', color: 'var(--a-pink-ink)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.98 }}>
        
        <LogOut size={16} strokeWidth={2.2} />
        {tr("profilescreen_cixis_c2de5c", "\xC7\u0131x\u0131\u015F")}
      </motion.button>

      {/* Legal Links */}
      <section className="a-section">
        <div className="a-section-head">
          <h2 className="a-section-title a-heading" style={{ fontSize: 15 }}>{tr("profilescreen_huquqi_ceb5d3", "Hüquqi")}</h2>
        </div>
        <motion.div
          className="a-list-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}>
          
          {[
          { id: 'legal/privacy_policy', icon: FileText, label: tr("profilescreen_gizlilik_siyaseti_dc3f28", 'Gizlilik Siyasəti') },
          { id: 'legal/terms_of_service', icon: Scale, label: tr("profilescreen_i_stifade_sertleri_fbbe3d", 'İstifadə Şərtləri') },
          { id: 'legal/disclaimer', icon: AlertCircle, label: tr("profilescreen_mesuliyyetden_i_mtina_beyanati_857abd", 'Məsuliyyətdən İmtina Bəyanatı') },
          { id: 'legal/refund_policy', icon: RotateCcw, label: tr("profilescreen_geri_qaytarma_siyaseti_767324", 'Geri Qaytarma Siyasəti') },
          { id: 'legal/gdpr_ccpa', icon: Shield, label: 'GDPR / CCPA' },
          { id: 'legal/data_usage', icon: Database, label: tr("profilescreen_melumat_i_stifadesi_af1211", 'Məlumat İstifadəsi') }].
          map((item) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className="a-list-row w-full"
                style={{ width: '100%', textAlign: 'left', background: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', cursor: 'pointer', padding: '11px 16px' }}
                whileTap={{ scale: 0.99 }}>
                
                <span className="a-list-icon" style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--a-surface-soft)', color: 'var(--a-ink-soft)' }}>
                  <Icon size={13} strokeWidth={2} />
                </span>
                <p className="a-list-sub" style={{ flex: 1, margin: 0, fontWeight: 600 }}>{item.label}</p>
                <ChevronRight size={14} className="a-list-chevron" />
              </motion.button>);

          })}
        </motion.div>
      </section>

      {/* Version */}
      <div className="flex flex-col items-center gap-2 mt-3">
        <div className="text-center select-none px-6 py-2" style={{ fontSize: 11, color: 'var(--a-on-bg-soft)', fontWeight: 600 }}>
          {tr("profilescreen_anacan_v1_0_0_azerbaycan_68472e", "Anacan v1.0.0 \u2022 Az\u0259rbaycan \uD83C\uDDE6\uD83C\uDDFF")}
        </div>
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)} />
      
      </div>
    </div>);

};

export default ProfileScreen;