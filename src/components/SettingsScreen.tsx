import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Bell, Moon, Sun, Globe, Lock, 
  Smartphone, Database, Trash2, ChevronRight,
  Volume2, Vibrate, Clock, Calendar, Droplets, Dumbbell, Pill,
  BellOff, Heart, MessageCircle, Users, Download, AlertTriangle, Loader2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useSilentHours } from '@/hooks/useSilentHours';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  useScrollToTop();
  
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
        { name: 'daily_logs', label: 'Gündəlik qeydlər' },
        { name: 'appointments', label: 'Randevular' },
        { name: 'baby_growth', label: 'Körpə inkişafı' },
        { name: 'baby_logs', label: 'Körpə qeydləri' },
        { name: 'weight_entries', label: 'Çəki qeydləri' },
        { name: 'cycle_history', label: 'Siklus tarixi' },
        { name: 'kick_sessions', label: 'Təpik sessiyaları' },
        { name: 'contractions', label: 'Büzüşmələr' },
        { name: 'blood_sugar_logs', label: 'Qan şəkəri' },
      ];

      const exportData: Record<string, any> = {
        export_date: new Date().toISOString(),
        user_email: user.email,
      };

      for (const table of tables) {
        try {
          const { data } = await supabase
            .from(table.name as any)
            .select('*')
            .eq('user_id', user.id);
          if (data && data.length > 0) {
            exportData[table.name] = data;
          }
        } catch {
          // Skip tables that don't exist or have errors
        }
      }

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

      toast.success('Məlumatlarınız uğurla yükləndi!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Məlumat ixracı zamanı xəta baş verdi');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Delete Account ──
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SİL') return;
    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessiya tapılmadı');
        return;
      }

      const { error } = await supabase.functions.invoke('delete-user-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast.success('Hesabınız uğurla silindi');
      await signOut();
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error('Hesab silinərkən xəta baş verdi');
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
  }: { 
    icon: any; 
    label: string; 
    description?: string;
    children?: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
  }) => (
    <motion.div
      className={`flex items-center gap-3 p-3 ${onClick ? 'cursor-pointer active:bg-muted/50' : ''}`}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
        danger ? 'bg-destructive/10' : 'bg-muted'
      }`}>
        <Icon className={`w-4 h-4 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1">
        <p className={`font-medium text-sm ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 overflow-y-auto">
      {/* Header with safe area */}
      <div className="gradient-primary px-3 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <h1 className="text-lg font-bold text-white">Tənzimləmələr</h1>
        </div>
      </div>

      <div className="px-3 pt-3 space-y-2">
        {/* Native App Indicator */}
        {!isNative && (
          <motion.div 
            className="bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Web rejimində çalışırsınız</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">Bildirişlər yalnız mobil tətbiqdə işləyir</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/50">
          <div className="px-3 pt-3 pb-1">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bildirişlər</h2>
          </div>
          <SettingRow icon={Bell} label="Bildirişlər" description="Bütün bildirişləri aktivləşdirin">
            <Switch 
              checked={settings.notifications_enabled} 
              onCheckedChange={(checked) => updateSetting('notifications_enabled', checked)} 
            />
          </SettingRow>
          <SettingRow icon={Volume2} label="Səs" description="Bildiriş səsləri">
            <Switch 
              checked={settings.sound_enabled} 
              onCheckedChange={(checked) => updateSetting('sound_enabled', checked)} 
              disabled={!settings.notifications_enabled}
            />
          </SettingRow>
          <SettingRow icon={Vibrate} label="Titrəmə" description="Titrəmə bildirişləri">
            <Switch 
              checked={settings.vibration_enabled} 
              onCheckedChange={(checked) => updateSetting('vibration_enabled', checked)} 
              disabled={!settings.notifications_enabled}
            />
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
            description={silentSettings.enabled ? `${silentSettings.startTime} - ${silentSettings.endTime} arası bildiriş yoxdur` : "Gecə saatlarında bildirişləri söndür"}
          >
            <Switch 
              checked={silentSettings.enabled} 
              onCheckedChange={(checked) => {
                updateSilentSettings({ enabled: checked });
                toast.success(checked ? 'Sakit saatlar aktivləşdirildi' : 'Sakit saatlar deaktiv edildi');
              }} 
              disabled={!settings.notifications_enabled}
            />
          </SettingRow>
          {silentSettings.enabled && (
            <>
              <SettingRow 
                icon={Moon} 
                label="Başlama vaxtı" 
                description="Bildirişlər susacaq"
                onClick={() => setShowTimeEdit(true)}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={silentSettings.startTime}
                    onChange={(e) => {
                      updateSilentSettings({ startTime: e.target.value });
                    }}
                    className="bg-muted rounded-lg px-2 py-1 text-sm font-medium"
                  />
                </div>
              </SettingRow>
              <SettingRow 
                icon={Sun} 
                label="Bitmə vaxtı" 
                description="Bildirişlər yenidən başlayacaq"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={silentSettings.endTime}
                    onChange={(e) => {
                      updateSilentSettings({ endTime: e.target.value });
                    }}
                    className="bg-muted rounded-lg px-2 py-1 text-sm font-medium"
                  />
                </div>
              </SettingRow>
            </>
          )}
        </div>

        {/* Reminders */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Xatırlatmalar</h2>
          </div>
          <SettingRow icon={Droplets} label="Su xatırlatması" description="Hər 2 saatda bir (08:00-20:00)">
            <Switch 
              checked={settings.water_reminder} 
              onCheckedChange={(checked) => updateSetting('water_reminder', checked)} 
              disabled={!settings.notifications_enabled}
            />
          </SettingRow>
          <SettingRow icon={Pill} label="Vitamin xatırlatması" description={`Hər gün saat ${settings.vitamin_time}`}>
            <Switch 
              checked={settings.vitamin_reminder} 
              onCheckedChange={(checked) => updateSetting('vitamin_reminder', checked)} 
              disabled={!settings.notifications_enabled}
            />
          </SettingRow>
          <SettingRow icon={Dumbbell} label="Məşq xatırlatması" description="B.e., Ç., C. günləri saat 10:00">
            <Switch 
              checked={settings.exercise_reminder} 
              onCheckedChange={(checked) => updateSetting('exercise_reminder', checked)} 
              disabled={!settings.notifications_enabled}
            />
          </SettingRow>
        </div>

        {/* Push Notification Settings */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Push Bildirişləri</h2>
          </div>
          <SettingRow icon={Bell} label="Push bildirişlər" description="Tətbiq bağlı olsa belə bildiriş alın">
            <Switch 
              checked={pushSettings.push_enabled} 
              onCheckedChange={(checked) => {
                updatePushSetting('push_enabled', checked);
                toast.success(checked ? 'Push bildirişlər aktivləşdirildi' : 'Push bildirişlər deaktiv edildi');
              }}
            />
          </SettingRow>
          <SettingRow icon={MessageCircle} label="Mesaj bildirişləri" description="Yeni mesajlar üçün bildiriş">
            <Switch 
              checked={pushSettings.push_messages} 
              onCheckedChange={(checked) => updatePushSetting('push_messages', checked)} 
              disabled={!pushSettings.push_enabled}
            />
          </SettingRow>
          <SettingRow icon={Heart} label="Bəyənmə bildirişləri" description="Paylaşımlarınıza bəyənmə">
            <Switch 
              checked={pushSettings.push_likes} 
              onCheckedChange={(checked) => updatePushSetting('push_likes', checked)} 
              disabled={!pushSettings.push_enabled}
            />
          </SettingRow>
          <SettingRow icon={MessageCircle} label="Şərh bildirişləri" description="Paylaşımlarınıza şərhlər">
            <Switch 
              checked={pushSettings.push_comments} 
              onCheckedChange={(checked) => updatePushSetting('push_comments', checked)} 
              disabled={!pushSettings.push_enabled}
            />
          </SettingRow>
          <SettingRow icon={Users} label="Cəmiyyət bildirişləri" description="Qrup fəaliyyətləri">
            <Switch 
              checked={pushSettings.push_community} 
              onCheckedChange={(checked) => updatePushSetting('push_community', checked)} 
              disabled={!pushSettings.push_enabled}
            />
          </SettingRow>
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Görünüş</h2>
          </div>
          <SettingRow icon={Globe} label="Dil" description="Azərbaycan dili" onClick={() => toast.info('Tezliklə digər dillər əlavə olunacaq')}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SettingRow>
        </div>

        {/* Privacy & Data */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Məxfilik və Məlumat</h2>
          </div>
          <SettingRow icon={Lock} label="Şifrə ilə qoruma" description="Tətbiqi qoruyun" onClick={() => toast.info('Tezliklə əlavə olunacaq')}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SettingRow>
          <SettingRow 
            icon={Download} 
            label="Məlumat ixracı" 
            description="Bütün məlumatlarınızı JSON formatında yükləyin" 
            onClick={isExporting ? undefined : handleDataExport}
          >
            {isExporting ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            )}
          </SettingRow>
          <SettingRow 
            icon={Trash2} 
            label="Hesabı sil" 
            description="Bütün məlumatları geri dönməz şəkildə silin" 
            onClick={() => setShowDeleteDialog(true)}
            danger
          >
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
              <AlertDialogTitle className="text-lg">Hesabı sil</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm space-y-3">
              <p>
                Bu əməliyyat <strong className="text-destructive">geri qaytarıla bilməz</strong>. 
                Hesabınız və bütün məlumatlarınız həmişəlik silinəcək:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                <li>Profil məlumatları</li>
                <li>Bütün qeydlər və izləmə tarixçəsi</li>
                <li>Cəmiyyət paylaşımları və şərhlər</li>
                <li>AI söhbət tarixçəsi</li>
                <li>Premium abunəlik (əgər varsa)</li>
              </ul>
              <div className="pt-2">
                <p className="text-xs font-medium text-foreground mb-2">
                  Təsdiqləmək üçün <strong>"SİL"</strong> yazın:
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="SİL"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono text-center tracking-widest"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={() => setDeleteConfirmText('')}
              className="rounded-xl"
            >
              Ləğv et
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== 'SİL' || isDeleting}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Hesabı sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsScreen;