import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Bell, Shield, HelpCircle, LogOut, 
  ChevronRight, Crown, Copy, Share2,
  Heart, Calendar, Palette, ShieldCheck, Edit, CreditCard, Info, ArrowLeft, X,
  MessageCircle, Baby, ShoppingCart, TrendingUp, Gift, Plus, Trash2, Users,
  FileText, Scale, AlertCircle, RotateCcw, Database
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useChildren, Child } from '@/hooks/useChildren';
import { PremiumModal } from '@/components/PremiumModal';
import { nativeShare } from '@/lib/native';
import BannerSlot from '@/components/banners/BannerSlot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProfileScreenProps {
  onNavigate?: (screen: string) => void;
}

const ProfileScreen = ({ onNavigate }: ProfileScreenProps) => {
  useScrollToTop();
  
  const { name, email, lifeStage, role } = useUserStore();
  const { signOut, profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const { unreadCount } = useNotifications();
  const { children, addChild, updateChild, deleteChild, getChildAge } = useChildren();
  const [partnerCode] = useState(profile?.partner_code || 'ANACAN-XXXX');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showPartnerInfo, setShowPartnerInfo] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [childForm, setChildForm] = useState<{ name: string; birth_date: string; gender: 'boy' | 'girl' }>({ name: '', birth_date: '', gender: 'boy' });

  const genderOptions = [
    { value: 'boy', label: 'Oğlan', emoji: '👦' },
    { value: 'girl', label: 'Qız', emoji: '👧' },
  ];

  const handleAddChild = async () => {
    if (!childForm.name || !childForm.birth_date) {
      toast({ title: 'Ad və doğum tarixi tələb olunur', variant: 'destructive' });
      return;
    }
    const child = await addChild({
      name: childForm.name,
      birth_date: childForm.birth_date,
      gender: childForm.gender,
      avatar_emoji: genderOptions.find(g => g.value === childForm.gender)?.emoji || '👶',
    });
    if (child) {
      toast({ title: `${childForm.name} əlavə edildi` });
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
      avatar_emoji: genderOptions.find(g => g.value === childForm.gender)?.emoji || '👶',
    });
    if (success) {
      toast({ title: 'Yeniləndi' });
      setEditingChild(null);
      setChildForm({ name: '', birth_date: '', gender: 'boy' });
    }
  };

  const handleDeleteChild = async (child: Child) => {
    if (confirm(`${child.name} silinsin?`)) {
      await deleteChild(child.id);
      toast({ title: 'Silindi' });
    }
  };

  const openEditChild = (child: Child) => {
    setChildForm({ name: child.name, birth_date: child.birth_date, gender: child.gender === 'unknown' ? 'boy' : child.gender });
    setEditingChild(child);
  };

  const menuItems = [
    { id: 'billing', icon: CreditCard, label: 'Abunəliyim' },
    { id: 'notifications', icon: Bell, label: 'Bildirişlər', badge: unreadCount > 0 ? String(unreadCount) : undefined },
    { id: 'appearance', icon: Palette, label: 'Görünüş' },
    { id: 'calendar', icon: Calendar, label: 'Təqvim Ayarları' },
    { id: 'privacy', icon: Shield, label: 'Gizlilik' },
    { id: 'help', icon: HelpCircle, label: 'Yardım' },
    ...(isAdmin ? [
      { id: 'shop', icon: ShoppingCart, label: 'Mağaza (Test)', badge: 'Beta' },
      { id: 'admin', icon: ShieldCheck, label: 'Admin Panel', badge: 'Admin' }
    ] : []),
  ];

  const copyPartnerCode = async () => {
    await nativeShare({
      title: 'Partnyor Kodu',
      text: `Partnyor kodum: ${partnerCode}`,
    });
  };

  const sharePartnerCode = async () => {
    const shareText = `Anacan tətbiqinə qoşul və hamiləlik səyahətimizdə mənə dəstək ol! Partnyor kodum: ${partnerCode}\n\nTətbiqi yüklə: https://anacanapp.lovable.app`;
    
    const success = await nativeShare({
      title: 'Partnyor Kodu',
      text: shareText
    });

    if (success) {
      toast({
        title: 'Paylaşıldı!',
        description: 'Partnyor kodu uğurla paylaşıldı.',
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Çıxış edildi',
      description: 'Uğurla çıxış etdiniz.',
    });
  };

  const getStageInfo = () => {
    switch (lifeStage) {
      case 'flow': return { name: 'Menstruasiya', emoji: '🌸', color: 'flow' };
      case 'bump': return { name: 'Hamiləlik', emoji: '🤰', color: 'bump' };
      case 'mommy': return { name: 'Analıq', emoji: '👶', color: 'mommy' };
      default: return { name: 'Seçilməyib', emoji: '✨', color: 'primary' };
    }
  };

  const stageInfo = getStageInfo();

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
    <div className="pb-24 pt-1 px-3">
      {/* Top Banner Slot */}
      <BannerSlot placement="profile_top" onNavigate={onNavigate} className="mb-3" />

      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-3"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-lg font-black text-foreground">Profil</h1>
        <motion.button 
          onClick={() => onNavigate?.('settings')}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </motion.button>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl gradient-primary p-4 mb-3 shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/5 blur-xl" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-3xl shadow-lg">
            {stageInfo.emoji}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-white">{profile?.name || name || 'İstifadəçi'}</h2>
            <p className="text-white/80 font-medium text-xs">{profile?.email || email || 'email@example.com'}</p>
            <div className="mt-2 flex gap-2">
              <span className="inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold">
                {stageInfo.name}
              </span>
              {isAdmin && (
                <span className="inline-flex items-center px-3 py-1 bg-amber-500/80 rounded-full text-white text-xs font-bold">
                  👑 Admin
                </span>
              )}
            </div>
          </div>
          <motion.button
            onClick={() => onNavigate?.('edit-profile')}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Edit className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </motion.div>

      {/* Premium Banner - opens modal */}
      <motion.button
        onClick={() => setShowPremiumModal(true)}
        className="w-full bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-4 mb-3 border border-amber-100 dark:border-amber-900/50 text-left"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">Anacan Premium</h3>
            <p className="text-sm text-muted-foreground">Bütün xüsusiyyətləri açın</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </motion.button>

      {/* Partner Code */}
      {role === 'woman' && (
        <motion.div
          className="bg-card rounded-2xl p-4 mb-3 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-partner/10 flex items-center justify-center">
                <Heart className="w-4 h-4 text-partner" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Partnyor Kodu</h3>
                <p className="text-[10px] text-muted-foreground">Həyat yoldaşınızla paylaşın</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted rounded-2xl">
            <code className="flex-1 text-center font-mono font-bold text-lg tracking-wider text-foreground">
              {partnerCode}
            </code>
            <motion.button
              onClick={copyPartnerCode}
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Copy className="w-5 h-5 text-primary" />
            </motion.button>
            <motion.button
              onClick={sharePartnerCode}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Share2 className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Partner Info Button */}
          <motion.button
            onClick={() => setShowPartnerInfo(true)}
            className="w-full mt-3 p-3 rounded-xl bg-partner/5 border border-partner/20 flex items-center gap-3"
            whileTap={{ scale: 0.98 }}
          >
            <Info className="w-5 h-5 text-partner" />
            <span className="flex-1 text-left text-sm font-medium text-foreground">Partnyor nələr görə və edə bilər?</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </motion.div>
      )}

      {/* Partner Info Modal */}
      <AnimatePresence>
        {showPartnerInfo && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPartnerInfo(false)}
          >
            <motion.div
              className="bg-card w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-card p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Partnyor Rejimi Haqqında</h2>
                <motion.button
                  onClick={() => setShowPartnerInfo(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
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
                    Partnyor kodu ilə həyat yoldaşınız tətbiqə qoşularaq hamiləlik səyahətinizə dəstək ola bilər.
                  </p>
                </div>

                {/* What partner can see */}
                <div>
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    👁️ Partnyor nələri görə bilər?
                  </h3>
                  <div className="space-y-2">
                    {[
                      { icon: Baby, text: 'Körpənin həftəlik inkişafı və ölçüləri' },
                      { icon: TrendingUp, text: 'Sizin gündəlik əhvalınız və simptomlarınız' },
                      { icon: Calendar, text: 'Həkim görüşləri və vacib tarixlər' },
                      { icon: Heart, text: 'Təpik sayğacı və büzüşmə izləyicisi məlumatları' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <item.icon className="w-5 h-5 text-primary" />
                        <span className="text-sm text-foreground">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* What partner can do */}
                <div>
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    ✨ Partnyor nələr edə bilər?
                  </h3>
                  <div className="space-y-2">
                    {[
                      { icon: MessageCircle, text: 'Sizə sevgi mesajları və dəstək göndərə bilər' },
                      { icon: ShoppingCart, text: 'Ortaq alış-veriş siyahısına əlavə edə bilər' },
                      { icon: Gift, text: 'Sürprizlər planlaşdırıb xallar toplaya bilər' },
                      { icon: TrendingUp, text: 'Missiyaları yerinə yetirib səviyyə qazana bilər' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <item.icon className="w-5 h-5 text-partner" />
                        <span className="text-sm text-foreground">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy note */}
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    🔒 <strong className="text-foreground">Gizlilik:</strong> Partnyor sizin şəxsi qeydlərinizi, gündəlik mesajlarınızı və ya AI söhbətlərinizi görə bilməz.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children Management Section - Only for mommy stage */}
      {lifeStage === 'mommy' && (
        <motion.div
          className="bg-card rounded-2xl p-4 mb-3 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.28 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm">Uşaqlarım</h3>
                <p className="text-[10px] text-muted-foreground">
                  {children.length === 0 ? 'Uşaq əlavə et' : `${children.length} uşaq`}
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => {
                setChildForm({ name: '', birth_date: '', gender: 'boy' });
                setShowChildModal(true);
              }}
              className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus className="w-4 h-4 text-pink-600" />
            </motion.button>
          </div>

          {children.length > 0 && (
            <div className="space-y-2">
              {children.map((child) => {
                const age = getChildAge(child);
                return (
                  <div
                    key={child.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                  >
                    <span className="text-2xl">{child.avatar_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{child.name}</p>
                      <p className="text-xs text-muted-foreground">{age.displayText}</p>
                    </div>
                    <motion.button
                      onClick={() => openEditChild(child)}
                      className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </motion.button>
                  </div>
                );
              })}
            </div>
          )}

          {children.length === 0 && (
            <button
              onClick={() => {
                setChildForm({ name: '', birth_date: '', gender: 'boy' });
                setShowChildModal(true);
              }}
              className="w-full p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center gap-2 text-muted-foreground hover:border-pink-400 hover:text-pink-500 transition-colors"
            >
              <Baby className="w-8 h-8" />
              <span className="text-sm font-medium">İlk uşağı əlavə et</span>
            </button>
          )}
        </motion.div>
      )}

      {/* Add/Edit Child Modal */}
      <Dialog open={showChildModal || !!editingChild} onOpenChange={(open) => {
        if (!open) {
          setShowChildModal(false);
          setEditingChild(null);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingChild ? 'Uşaq Redaktə Et' : 'Uşaq Əlavə Et'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ad</label>
              <Input
                value={childForm.name}
                onChange={(e) => setChildForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Körpənin adı"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Doğum tarixi</label>
              <Input
                type="date"
                value={childForm.birth_date}
                onChange={(e) => setChildForm(p => ({ ...p, birth_date: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cins</label>
              <div className="flex gap-2 mt-2">
                {genderOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setChildForm(p => ({ ...p, gender: opt.value as 'boy' | 'girl' }))}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      childForm.gender === opt.value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingChild ? handleEditChild : handleAddChild} className="flex-1">
                {editingChild ? 'Yadda saxla' : 'Əlavə et'}
              </Button>
              {editingChild && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    handleDeleteChild(editingChild);
                    setEditingChild(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Items */}
      <motion.div
        className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/50"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              variants={itemVariants}
              onClick={() => onNavigate?.(item.id)}
              className={`w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-border/50' : ''
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                item.id === 'admin' ? 'bg-amber-100 dark:bg-amber-900/30' : 
                item.id === 'billing' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
              }`}>
                <Icon className={`w-4 h-4 ${
                  item.id === 'admin' ? 'text-amber-600' : 
                  item.id === 'billing' ? 'text-green-600' : 'text-muted-foreground'
                }`} />
              </div>
              <span className="flex-1 text-left font-medium text-foreground text-sm">{item.label}</span>
              {item.badge && (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  item.id === 'admin' 
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' 
                    : 'bg-destructive text-white'
                }`}>
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          );
        })}
      </motion.div>

      {/* Logout */}
      <motion.button
        onClick={handleLogout}
        className="w-full mt-3 p-3 rounded-xl bg-destructive/10 text-destructive font-bold flex items-center justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <LogOut className="w-5 h-5" />
        Çıxış
      </motion.button>

      {/* Legal Links */}
      <motion.div
        className="mt-4 bg-card rounded-2xl overflow-hidden shadow-card border border-border/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
      >
        <div className="px-3 pt-3 pb-1">
          <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hüquqi</h2>
        </div>
        {[
          { id: 'legal/privacy_policy', icon: FileText, label: 'Gizlilik Siyasəti' },
          { id: 'legal/terms_of_service', icon: Scale, label: 'İstifadə Şərtləri' },
          { id: 'legal/disclaimer', icon: AlertCircle, label: 'Məsuliyyətdən İmtina Bəyanatı' },
          { id: 'legal/refund_policy', icon: RotateCcw, label: 'Geri Qaytarma Siyasəti' },
          { id: 'legal/gdpr_ccpa', icon: Shield, label: 'GDPR / CCPA' },
          { id: 'legal/data_usage', icon: Database, label: 'Məlumat İstifadəsi' },
        ].map((item, index, arr) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 transition-colors ${
                index !== arr.length - 1 ? 'border-b border-border/30' : ''
              }`}
              whileTap={{ scale: 0.99 }}
            >
              <div className="w-7 h-7 rounded-lg bg-muted/70 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left text-xs font-medium text-muted-foreground">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </motion.button>
          );
        })}
      </motion.div>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground mt-3">
        Anacan v1.0.0 • Azərbaycan 🇦🇿
      </p>

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};

export default ProfileScreen;
