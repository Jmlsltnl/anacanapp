import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Bell, Moon, Sun, Globe, Lock, 
  Smartphone, Database, Trash2, ChevronRight,
  Volume2, Vibrate, Clock, Calendar, Droplets, Dumbbell, Pill,
  BellOff, Heart, MessageCircle, Users
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useSilentHours } from '@/hooks/useSilentHours';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { toast } from 'sonner';

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
  const [showTimeEdit, setShowTimeEdit] = useState(false);

  // Initialize reminders on mount
  useEffect(() => {
    initializeReminders();
  }, []);

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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="gradient-primary px-3 pt-3 pb-4">
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
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Məxfilik</h2>
          </div>
          <SettingRow icon={Lock} label="Şifrə ilə qoruma" description="Tətbiqi qoruyun" onClick={() => toast.info('Tezliklə əlavə olunacaq')}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SettingRow>
          <SettingRow icon={Database} label="Məlumat ixracı" description="Bütün məlumatlarınızı yükləyin" onClick={() => toast.info('Tezliklə əlavə olunacaq')}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SettingRow>
          <SettingRow 
            icon={Trash2} 
            label="Hesabı sil" 
            description="Bütün məlumatları silin" 
            onClick={() => toast.error('Bu əməliyyat geri qaytarıla bilməz!')}
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
    </div>
  );
};

export default SettingsScreen;
