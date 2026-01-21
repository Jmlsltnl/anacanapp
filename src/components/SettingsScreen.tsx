import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Bell, Moon, Sun, Globe, Lock, 
  Smartphone, Database, Trash2, ChevronRight,
  Volume2, Vibrate, Clock, Calendar, Droplets, Dumbbell, Pill
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { toast } from 'sonner';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  const { 
    settings, 
    loading, 
    updateSetting, 
    initializeReminders,
    isNative 
  } = useNotificationSettings();

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
      className={`flex items-center gap-4 p-4 ${onClick ? 'cursor-pointer active:bg-muted/50' : ''}`}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
        danger ? 'bg-destructive/10' : 'bg-muted'
      }`}>
        <Icon className={`w-5 h-5 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1">
        <p className={`font-medium ${danger ? 'text-destructive' : 'text-foreground'}`}>{label}</p>
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
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-6">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <h1 className="text-xl font-bold text-white">Tənzimləmələr</h1>
        </div>
      </div>

      <div className="px-5 pt-4 space-y-4">
        {/* Native App Indicator */}
        {!isNative && (
          <motion.div 
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Web rejimində çalışırsınız</p>
                <p className="text-xs text-amber-600">Bildirişlər yalnız mobil tətbiqdə işləyir</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Bildirişlər</h2>
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
