import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Shield, Lock, Eye, EyeOff, Trash2,
  Download, UserX, AlertTriangle, Check } from
'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { tr } from "@/lib/tr";

interface PrivacyScreenProps {
  onBack: () => void;
}

const PrivacyScreen = ({ onBack }: PrivacyScreenProps) => {
  useScrollToTop();

  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    showInCommunity: true,
    allowMessages: true,
    shareAnalytics: false
  });

  const handleToggle = (key: keyof typeof privacySettings) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({ title: tr("privacyscreen_ayar_yenilendi_f0f876", 'Ayar yeniləndi') });
  };

  const handleExportData = async () => {
    if (!user) return;

    toast({ title: tr("privacyscreen_melumatlar_hazirlanir_482381", 'Məlumatlar hazırlanır...'), description: tr("privacyscreen_bu_bir_nece_saniye_ceke_biler_49b373", 'Bu bir neçə saniyə çəkə bilər.') });

    try {
      // Fetch user data
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      const { data: dailyLogs } = await supabase.from('daily_logs').select('*').eq('user_id', user.id);
      const { data: appointments } = await supabase.from('appointments').select('*').eq('user_id', user.id);
      const { data: notifications } = await supabase.from('notifications').select('*').eq('user_id', user.id);

      const exportData = {
        profile,
        dailyLogs,
        appointments,
        notifications,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anacan-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: tr("privacyscreen_melumatlar_yuklendi_f04800", 'Məlumatlar yükləndi!') });
    } catch (error: any) {
      toast({ title: tr("privacyscreen_xeta_3cdbb6", 'Xəta'), description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      // Delete user data from various tables
      await supabase.from('daily_logs').delete().eq('user_id', user.id);
      await supabase.from('notifications').delete().eq('user_id', user.id);
      await supabase.from('appointments').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);

      // Sign out
      await signOut();

      toast({ title: 'Hesab silindi', description: tr("privacyscreen_melumatlariniz_birdefelik_silindi_8f69e7", 'Məlumatlarınız birdəfəlik silindi.') });
    } catch (error: any) {
      toast({ title: tr("privacyscreen_xeta_3cdbb6", 'Xəta'), description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const privacyOptions = [
  {
    icon: Eye,
    title: tr("privacyscreen_profil_gorunurluyu_deeea5", 'Profil görünürlüyü'),
    description: tr("privacyscreen_diger_istifadeciler_profilinizi_gore_bil_f3544c", 'Digər istifadəçilər profilinizi görə bilər'),
    key: 'profileVisible' as const
  },
  {
    icon: UserX,
    title: tr("privacyscreen_cemiyyetde_goster_3e9674", 'Cəmiyyətdə göstər'),
    description: tr("privacyscreen_post_ve_story_leriniz_digerlerine_gorunu_cf12e6", 'Post və story-ləriniz digərlərinə görünür'),
    key: 'showInCommunity' as const
  },
  {
    icon: Lock,
    title: tr("privacyscreen_mesajlara_icaze_ver_99d96f", 'Mesajlara icazə ver'),
    description: tr("privacyscreen_diger_istifadeciler_size_mesaj_gondere_b_c1b1fc", 'Digər istifadəçilər sizə mesaj göndərə bilər'),
    key: 'allowMessages' as const
  },
  {
    icon: Shield,
    title: tr("privacyscreen_analitik_melumat_paylas_7971ff", 'Analitik məlumat paylaş'),
    description: tr("privacyscreen_anonim_istifade_melumatlarini_paylasin_835e3a", 'Anonim istifadə məlumatlarını paylaşın'),
    key: 'shareAnalytics' as const
  }];


  return (
    <div className="min-h-screen bg-background pb-28 overflow-y-auto">
      {/* Header with safe area */}
      <div className="gradient-primary px-5 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}>
            
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{tr("privacyscreen_gizlilik_tehlukesizlik_67bec6", "Gizlilik & Təhlükəsizlik")}</h1>
            <p className="text-white/80 text-sm">{tr("privacyscreen_melumatlarinizi_idare_edin_efbcdb", "Məlumatlarınızı idarə edin")}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-6 -mt-4">
        {/* Privacy Settings */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}>
          
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            {tr("privacyscreen_gizlilik_ayarlari_4055d3", "Gizlilik Ayarlar\u0131")}
          </h3>
          
          <div className="space-y-4">
            {privacyOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{option.title}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings[option.key]}
                    onCheckedChange={() => handleToggle(option.key)} />
                  
                </div>);

            })}
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}>
          
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {tr("privacyscreen_melumat_i_dareetmesi_19f40f", "M\u0259lumat \u0130dar\u0259etm\u0259si")}
          </h3>
          
          <div className="space-y-3">
            <motion.button
              onClick={handleExportData}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
              whileTap={{ scale: 0.98 }}>
              
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{tr("privacyscreen_melumatlari_yukle_5cee89", "Məlumatları Yüklə")}</p>
                <p className="text-xs text-muted-foreground">{tr("privacyscreen_butun_melumatlarinizi_json_formatinda_yu_0c02e5", "Bütün məlumatlarınızı JSON formatında yükləyin")}</p>
              </div>
            </motion.button>

            <motion.button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors"
              whileTap={{ scale: 0.98 }}>
              
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-destructive">{tr("privacyscreen_hesabi_sil_6abf24", "Hesabı Sil")}</p>
                <p className="text-xs text-muted-foreground">{tr("privacyscreen_butun_melumatlarinizi_birdefelik_silin_41a068", "Bütün məlumatlarınızı birdəfəlik silin")}</p>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Privacy Policy Link */}
        <motion.div
          className="bg-muted/50 rounded-2xl p-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}>
          
          <p className="text-sm text-muted-foreground text-center">
            {tr("privacyscreen_gizlilik_siyasetimiz_ve_istifa_8c585b", "Gizlilik siyas\u0259timiz v\u0259 istifad\u0259 \u015F\u0259rtl\u0259rimiz haqq\u0131nda \u0259trafl\u0131 m\u0259lumat \xFC\xE7\xFCn")}{' '}
            <a href="#" className="text-primary font-medium">{tr("privacyscreen_buraya_klikleyin_c20d44", "buraya klikləyin")}</a>.
          </p>
        </motion.div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {tr("privacyscreen_hesabi_silmek_6d444c", "Hesab\u0131 Silm\u0259k")}
            </DialogTitle>
            <DialogDescription className="text-left">
              {tr("privacyscreen_bu_emeliyyat_geri_qaytarila_bi_fdaca8", "Bu \u0259m\u0259liyyat geri qaytar\u0131la bilm\u0259z. B\xFCt\xFCn m\u0259lumatlar\u0131n\u0131z, o c\xFCml\u0259d\u0259n:")}
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{tr("privacyscreen_profil_melumatlari_82c76c", "Profil məlumatları")}</li>
                <li>{tr("privacyscreen_gundelik_qeydler_285ea0", "Gündəlik qeydlər")}</li>
                <li>{tr("privacyscreen_gorusler_a729f1", "Görüşlər")}</li>
                <li>{tr("privacyscreen_bildirisler_54eb88", "Bildirişlər")}</li>
              </ul>
              {tr("privacyscreen_birdefelik_silinecek_d977cc", "bird\u0259f\u0259lik silin\u0259c\u0259k.")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
              {tr("privacyscreen_legv_et_b5e49c", "L\u0259\u011Fv et")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="flex-1"
              disabled={deleting}>
              
              {deleting ? 'Silinir...' : tr("privacyscreen_beli_sil_fd44c5", "B\u0259li, Sil")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default PrivacyScreen;