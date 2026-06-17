import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Bell, Moon, Sun, Globe, Lock,
  Smartphone, Database, Trash2, ChevronRight,
  Volume2, Vibrate, Clock, Calendar, Droplets, Dumbbell, Pill,
  BellOff, Heart, MessageCircle, Users, Download, AlertTriangle, Loader2 } from
'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useSilentHours } from '@/hooks/useSilentHours';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics } from '@/hooks/useScreenAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { tr } from "@/lib/tr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
'@/components/ui/alert-dialog';
import LanguageSelector from '@/components/LanguageSelector';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  useScrollToTop();
  useScreenAnalytics('Settings', 'Settings');

  const {
    settings,
    loading,
    updateSetting,
    initializeReminders,
    isNative
  } = useNotificationSettings();

  const { settings: silentSettings, updateSettings: updateSilentSettings } = useSilentHours();
  const { settings: pushSettings, updateSetting: updatePushSetting, loading: pushLoading } = usePushNotifications();
  const { user, signOut } = useAuth();
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Initialize reminders on mount
  useEffect(() => {
    initializeReminders();
  }, []);

  // ── Data Export ──
  const handleDataExport = async () => {
    if (!user) return;
    setIsExporting(true);

    try {
      const tables = [
      { name: 'profiles', label: 'Profil' },
      { name: 'daily_logs', label: tr("settingsscreen_gundelik_qeydler_285ea0", 'Gündəlik qeydlər') },
      { name: 'appointments', label: 'Randevular' },
      { name: 'baby_growth', label: tr("settingsscreen_korpe_inkisafi_8816ce", 'Körpə inkişafı') },
      { name: 'baby_logs', label: tr("settingsscreen_korpe_qeydleri_8d99a2", 'Körpə qeydləri') },
      { name: 'weight_entries', label: tr("settingsscreen_ceki_qeydleri_43f237", 'Çəki qeydləri') },
      { name: 'cycle_history', label: 'Tsikl tarixi' },
      { name: 'kick_sessions', label: tr("settingsscreen_tepik_sessiyalari_87edad", 'Təpik sessiyaları') },
      { name: 'contractions', label: tr("settingsscreen_buzusmeler_1ec368", 'Büzüşmələr') },
      { name: 'blood_sugar_logs', label: tr("settingsscreen_qan_sekeri_c922e6", 'Qan şəkəri') }];


      const exportData: Record<string, any> = {
        export_date: new Date().toISOString(),
        user_email: user.email
      };

      for (const table of tables) {
        try {
          const { data } = await supabase.
          from(table.name as any).
          select('*').
          eq('user_id', user.id);
          if (data && data.length > 0) {
            exportData[table.name] = data;
          }
        } catch {

          // Skip tables that don't exist or have errors
        }}

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anacan-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(tr("settingsscreen_melumatlariniz_ugurla_yuklendi_80afed", "M\u0259lumatlar\u0131n\u0131z u\u011Furla y\xFCkl\u0259ndi!"));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(tr("settingsscreen_melumat_ixraci_zamani_xeta_bas_97bbb5", "M\u0259lumat ixrac\u0131 zaman\u0131 x\u0259ta ba\u015F verdi"));
    } finally {
      setIsExporting(false);
    }
  };

  // ── Delete Account ──
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== tr("settingsscreen_delete_confirm_keyword", "SİL")) return;
    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(tr("settingsscreen_sessiya_tapilmadi_2d6594", "Sessiya tap\u0131lmad\u0131"));
        return;
      }

      const { error } = await supabase.functions.invoke('delete-user-account', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;

      toast.success(tr("settingsscreen_hesabiniz_ugurla_silindi_a6ad6e", "Hesab\u0131n\u0131z u\u011Furla silindi"));
      await signOut();
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(tr("settingsscreen_hesab_silinerken_xeta_bas_verd_426be6", "Hesab silin\u0259rk\u0259n x\u0259ta ba\u015F verdi"));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const SettingRow = ({
    icon: Icon,
    label,
    description,
    children,
    onClick,
    danger = false







  }: {icon: any;label: string;description?: string;children?: React.ReactNode;onClick?: () => void;danger?: boolean;}) =>
  <motion.div
    className={`flex items-center gap-3 p-3 ${onClick ? 'cursor-pointer active:bg-muted/50' : ''}`}
    onClick={onClick}
    whileTap={onClick ? { scale: 0.99 } : undefined}>
    
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
    danger ? 'bg-destructive/10' : 'bg-muted'}`
    }>
        <Icon className={`w-4 h-4 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1">
        <p className={`font-medium text-sm ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        {description &&
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      }
      </div>
      {children}
    </motion.div>;


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background pb-24 overflow-y-auto">
      {/* Header with safe area */}
      <div className="gradient-primary px-3 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}>
            
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <h1 className="text-lg font-bold text-white">{tr("settingsscreen_tenzimlemeler_085659", "Tənzimləmələr")}</h1>
        </div>
      </div>

      <div className="px-3 pt-3 space-y-2">
        {/* Native App Indicator */}
        {!isNative &&
        <motion.div
          className="bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}>
          
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{tr("settingsscreen_web_rejiminde_calisirsiniz_157028", "Web rejimində çalışırsınız")}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">{tr("settingsscreen_bildirisler_yalniz_mobil_tetbiqde_isleyi_64cd56", "Bildirişlər yalnız mobil tətbiqdə işləyir")}</p>
              </div>
            </div>
          </motion.div>
        }

        {/* Notifications */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/50">
          <div className="px-3 pt-3 pb-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{tr("settingsscreen_bildirisler_54eb88", "Bildirişlər")}</h2>
          </div>
          <SettingRow icon={Bell} label={tr("settingsscreen_bildirisler_54eb88", "Bildirişlər")} description={tr("settingsscreen_butun_bildirisleri_aktivlesdirin_beb91d", "Bütün bildirişləri aktivləşdirin")}>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => updateSetting('notifications_enabled', checked)} />
            
          </SettingRow>
          <SettingRow icon={Volume2} label={tr("settingsscreen_ses_9b06b5", "Səs")} description={tr("settingsscreen_bildiris_sesleri_fc9269", "Bildiriş səsləri")}>
            <Switch
              checked={settings.sound_enabled}
              onCheckedChange={(checked) => updateSetting('sound_enabled', checked)}
              disabled={!settings.notifications_enabled} />
            
          </SettingRow>
          <SettingRow icon={Vibrate} label={tr("settingsscreen_titreme_6c5b87", "Titrəmə")} description={tr("settingsscreen_titreme_bildirisleri_bdf642", "Titrəmə bildirişləri")}>
            <Switch
              checked={settings.vibration_enabled}
              onCheckedChange={(checked) => updateSetting('vibration_enabled', checked)}
              disabled={!settings.notifications_enabled} />
            
          </SettingRow>
            
          </SettingRow>
        </div>

        {/* Silent Hours */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/50">
          <div className="px-3 pt-3 pb-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sakit saatlar</h2>
          </div>
          <SettingRow
            icon={BellOff}
            label="Sakit rejim"
            description={silentSettings.enabled ? `${silentSettings.startTime} - ${silentSettings.endTime} ${tr("settingsscreen_silent_hours_desc", "arası bildiriş yoxdur")}` : tr("settingsscreen_gece_saatlarinda_bildirisleri__45007d", "Gecə saatlarında bildirişləri söndür")}>
            
            <Switch
              checked={silentSettings.enabled}
              onCheckedChange={(checked) => {
                updateSilentSettings({ enabled: checked });
                toast.success(checked ? tr("settingsscreen_sakit_saatlar_aktivlesdirildi_2ab4f3", "Sakit saatlar aktivləşdirildi") : 'Sakit saatlar deaktiv edildi');
              }}
              disabled={!settings.notifications_enabled} />
            
          </SettingRow>
          {silentSettings.enabled &&
          <>
              <SettingRow
              icon={Moon}
              label={tr("settingsscreen_baslama_vaxti_b3791d", "Başlama vaxtı")}
              description={tr("settingsscreen_bildirisler_susacaq_c5cd6d", "Bildirişlər susacaq")}
              onClick={() => setShowTimeEdit(true)}>
              
                <div className="flex items-center gap-2">
                  <input
                  type="time"
                  value={silentSettings.startTime}
                  onChange={(e) => {
                    updateSilentSettings({ startTime: e.target.value });
                  }}
                  className="bg-muted rounded-lg px-2 py-1 text-sm font-medium" />
                
                </div>
              </SettingRow>
              <SettingRow
              icon={Sun}
              label={tr("settingsscreen_bitme_vaxti_624d01", "Bitmə vaxtı")}
              description={tr("settingsscreen_bildirisler_yeniden_baslayacaq_37c49d", "Bildirişlər yenidən başlayacaq")}>
              
                <div className="flex items-center gap-2">
                  <input
                  type="time"
                  value={silentSettings.endTime}
                  onChange={(e) => {
                    updateSilentSettings({ endTime: e.target.value });
                  }}
                  className="bg-muted rounded-lg px-2 py-1 text-sm font-medium" />
                
                </div>
              </SettingRow>
            </>
          }
        </div>

        {/* Reminders */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{tr("settingsscreen_xatirlatmalar_ddd8e7", "Xatırlatmalar")}</h2>
          </div>
          <SettingRow icon={Droplets} label={tr("settingsscreen_su_xatirlatmasi_ca127e", "Su xatırlatması")} description={tr("settingsscreen_her_2_saatda_bir_08_00_20_00_bc7ea9", "Hər 2 saatda bir (08:00-20:00)")}>
            <Switch
              checked={settings.water_reminder}
              onCheckedChange={(checked) => updateSetting('water_reminder', checked)}
              disabled={!settings.notifications_enabled} />
            
          </SettingRow>
          <SettingRow icon={Pill} label={tr("settingsscreen_vitamin_xatirlatmasi_531a3d", "Vitamin xatırlatması")} description={`${tr("settingsscreen_every_day_at", "Hər gün saat")} ${settings.vitamin_time}`}>
            <Switch
              checked={settings.vitamin_reminder}
              onCheckedChange={(checked) => updateSetting('vitamin_reminder', checked)}
              disabled={!settings.notifications_enabled} />
            
          </SettingRow>
          <SettingRow icon={Dumbbell} label={tr("settingsscreen_mesq_xatirlatmasi_399c4f", "Məşq xatırlatması")} description={tr("settingsscreen_b_e_c_c_gunleri_saat_10_00_40d25b", "B.e., Ç., C. günləri saat 10:00")}>
            <Switch
              checked={settings.exercise_reminder}
              onCheckedChange={(checked) => updateSetting('exercise_reminder', checked)}
              disabled={!settings.notifications_enabled} />
            
          </SettingRow>
        </div>

        {/* Push Notification Settings */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{tr("settingsscreen_push_bildirisleri_c44832", "Push Bildirişləri")}</h2>
          </div>
          <SettingRow icon={Bell} label={tr("settingsscreen_push_bildirisler_e7cb34", "Push bildirişlər")} description={tr("settingsscreen_tetbiq_bagli_olsa_bele_bildiris_alin_01f6eb", "Tətbiq bağlı olsa belə bildiriş alın")}>
            <Switch
              checked={pushSettings.push_enabled}
              onCheckedChange={(checked) => {
                updatePushSetting('push_enabled', checked);
                toast.success(checked ? tr("settingsscreen_push_bildirisler_aktivlesdiril_9147d9", "Push bildiri\u015Fl\u0259r aktivl\u0259\u015Fdirildi") : tr("settingsscreen_push_bildirisler_deaktiv_edild_e3832a", "Push bildiri\u015Fl\u0259r deaktiv edildi"));
              }} />
            
          </SettingRow>
          <SettingRow icon={MessageCircle} label={tr("settingsscreen_mesaj_bildirisleri_c8fd7b", "Mesaj bildirişləri")} description={tr("settingsscreen_yeni_mesajlar_ucun_bildiris_e7e1c9", "Yeni mesajlar üçün bildiriş")}>
            <Switch
              checked={pushSettings.push_messages}
              onCheckedChange={(checked) => updatePushSetting('push_messages', checked)}
              disabled={!pushSettings.push_enabled} />
            
          </SettingRow>
          <SettingRow icon={Heart} label={tr("settingsscreen_beyenme_bildirisleri_a6b18f", "Bəyənmə bildirişləri")} description={tr("settingsscreen_paylasimlariniza_beyenme_734537", "Paylaşımlarınıza bəyənmə")}>
            <Switch
              checked={pushSettings.push_likes}
              onCheckedChange={(checked) => updatePushSetting('push_likes', checked)}
              disabled={!pushSettings.push_enabled} />
            
          </SettingRow>
          <SettingRow icon={MessageCircle} label={tr("settingsscreen_serh_bildirisleri_6588b5", "Şərh bildirişləri")} description={tr("settingsscreen_paylasimlariniza_serhler_ad5c16", "Paylaşımlarınıza şərhlər")}>
            <Switch
              checked={pushSettings.push_comments}
              onCheckedChange={(checked) => updatePushSetting('push_comments', checked)}
              disabled={!pushSettings.push_enabled} />
            
          </SettingRow>
          <SettingRow icon={Users} label={tr("settingsscreen_cemiyyet_bildirisleri_fa4a16", "Cəmiyyət bildirişləri")} description={tr("settingsscreen_qrup_fealiyyetleri_4d13e7", "Qrup fəaliyyətləri")}>
            <Switch
              checked={pushSettings.push_community}
              onCheckedChange={(checked) => updatePushSetting('push_community', checked)}
              disabled={!pushSettings.push_enabled} />
            
          </SettingRow>
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{tr("settingsscreen_gorunus_165fe3", "Görünüş")}</h2>
          </div>
          <div className="px-3 pb-3">
            <LanguageSelector />
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{tr("settingsscreen_mexfilik_ve_melumat_f15bb1", "Məxfilik və Məlumat")}</h2>
          </div>
          <SettingRow icon={Lock} label={tr("settingsscreen_sifre_ile_qoruma_152a0e", "Şifrə ilə qoruma")} description={tr("settingsscreen_tetbiqi_qoruyun_bc5bce", "Tətbiqi qoruyun")} onClick={() => toast.info(tr("settingsscreen_tezlikle_elave_olunacaq_2eac45", "Tezlikl\u0259 \u0259lav\u0259 olunacaq"))}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SettingRow>
          <SettingRow
            icon={Download}
            label={tr("settingsscreen_melumat_ixraci_988684", "Məlumat ixracı")}
            description={tr("settingsscreen_butun_melumatlarinizi_json_formatinda_yu_0c02e5", "Bütün məlumatlarınızı JSON formatında yükləyin")}
            onClick={isExporting ? undefined : handleDataExport}>
            
            {isExporting ?
            <Loader2 className="w-5 h-5 text-primary animate-spin" /> :

            <ChevronRight className="w-5 h-5 text-muted-foreground" />
            }
          </SettingRow>
          <SettingRow
            icon={Trash2}
            label={tr("settingsscreen_hesabi_sil_95d759", "Hesabı sil")}
            description={tr("settingsscreen_butun_melumatlari_geri_donmez_sekilde_si_35b4d6", "Bütün məlumatları geri dönməz şəkildə silin")}
            onClick={() => setShowDeleteDialog(true)}
            danger>
            
            <ChevronRight className="w-5 h-5 text-destructive" />
          </SettingRow>
        </div>

        {/* App Info */}
        <div className="text-center pt-4 pb-8">
          <p className="text-sm text-muted-foreground">Anacan v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">Made with ❤️ in Azerbaijan</p>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-lg">{tr("settingsscreen_hesabi_sil_95d759", "Hesabı sil")}</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm space-y-3">
              <p>
                {tr("settingsscreen_bu_emeliyyat_61940b", "Bu \u0259m\u0259liyyat")} <strong className="text-destructive">{tr("settingsscreen_geri_qaytarila_bilmez_700864", "geri qaytarıla bilməz")}</strong>{tr("settingsscreen_hesabiniz_ve_butun_melumatlari_99630e", ". \n                Hesab\u0131n\u0131z v\u0259 b\xFCt\xFCn m\u0259lumatlar\u0131n\u0131z h\u0259mi\u015F\u0259lik silin\u0259c\u0259k:")}
              
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>{tr("settingsscreen_profil_melumatlari_82c76c", "Profil məlumatları")}</li>
                <li>{tr("settingsscreen_butun_qeydler_ve_izleme_tarixcesi_5544e4", "Bütün qeydlər və izləmə tarixçəsi")}</li>
                <li>{tr("settingsscreen_cemiyyet_paylasimlari_ve_serhler_655338", "Cəmiyyət paylaşımları və şərhlər")}</li>
                <li>{tr("settingsscreen_ai_sohbet_tarixcesi_9acf70", "AI söhbət tarixçəsi")}</li>
                <li>{tr("settingsscreen_premium_abunelik_eger_varsa_ce1645", "Premium abunəlik (əgər varsa)")}</li>
              </ul>
              <div className="pt-2">
                <p className="text-xs font-medium text-foreground mb-2">
                  {tr("settingsscreen_tesdiqlemek_ucun_fd471c", "T\u0259sdiql\u0259m\u0259k \xFC\xE7\xFCn")} <strong>{tr("settingsscreen_sil_27792d", "\"SİL\"")}</strong> {tr("settingsscreen_yazin_e343c0", "yaz\u0131n:")}
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={tr("settingsscreen_si_l_903c4d", "SİL")}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono text-center tracking-widest" />
                
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => setDeleteConfirmText('')}
              className="rounded-xl">
              {tr("settingsscreen_legv_et_b5e49c", "L\u0259\u011Fv et")}
            
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== tr("settingsscreen_delete_confirm_keyword", "SİL") || isDeleting}
              className="bg-destructive hover:bg-destructive/90 rounded-xl">
              
              {isDeleting ?
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> :

              <Trash2 className="w-4 h-4 mr-2" />
              }
              {tr("settingsscreen_hesabi_sil_95d759", "Hesab\u0131 sil")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

};

export default SettingsScreen;