import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Bell, Moon, Sun, Globe, Lock, 
  Smartphone, Database, Trash2, ChevronRight,
  Volume2, Vibrate, Clock, Calendar
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    sound: true,
    vibration: true,
    reminderWater: true,
    reminderPills: true,
    reminderExercise: false,
    language: 'az',
    cycleLength: 28,
    periodLength: 5,
  });

  const updateSetting = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
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
        {/* Appearance */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Görünüş</h2>
          </div>
          <SettingRow icon={settings.darkMode ? Moon : Sun} label="Qaranlıq rejim" description="Gecə görünüşü aktivləşdirin">
            <Switch 
              checked={settings.darkMode} 
              onCheckedChange={(checked) => updateSetting('darkMode', checked)} 
            />
          </SettingRow>
          <SettingRow icon={Globe} label="Dil" description="Azərbaycan dili" onClick={() => {}}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SettingRow>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Bildirişlər</h2>
          </div>
          <SettingRow icon={Bell} label="Bildirişlər" description="Bütün bildirişləri aktivləşdirin">
            <Switch 
              checked={settings.notifications} 
              onCheckedChange={(checked) => updateSetting('notifications', checked)} 
            />
          </SettingRow>
          <SettingRow icon={Volume2} label="Səs" description="Bildiriş səsləri">
            <Switch 
              checked={settings.sound} 
              onCheckedChange={(checked) => updateSetting('sound', checked)} 
            />
          </SettingRow>
          <SettingRow icon={Vibrate} label="Titrəmə" description="Titrəmə bildirişləri">
            <Switch 
              checked={settings.vibration} 
              onCheckedChange={(checked) => updateSetting('vibration', checked)} 
            />
          </SettingRow>
        </div>

        {/* Reminders */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Xatırlatmalar</h2>
          </div>
          <SettingRow icon={Clock} label="Su xatırlatması" description="Hər 2 saatda bir">
            <Switch 
              checked={settings.reminderWater} 
              onCheckedChange={(checked) => updateSetting('reminderWater', checked)} 
            />
          </SettingRow>
          <SettingRow icon={Clock} label="Vitamin xatırlatması" description="Hər gün səhər">
            <Switch 
              checked={settings.reminderPills} 
              onCheckedChange={(checked) => updateSetting('reminderPills', checked)} 
            />
          </SettingRow>
          <SettingRow icon={Clock} label="Məşq xatırlatması" description="Həftədə 3 dəfə">
            <Switch 
              checked={settings.reminderExercise} 
              onCheckedChange={(checked) => updateSetting('reminderExercise', checked)} 
            />
          </SettingRow>
        </div>

        {/* Cycle Settings */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Dövrə Ayarları</h2>
          </div>
          <SettingRow icon={Calendar} label="Dövrə uzunluğu" description={`${settings.cycleLength} gün`} onClick={() => {}}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SettingRow>
          <SettingRow icon={Calendar} label="Menstruasiya uzunluğu" description={`${settings.periodLength} gün`} onClick={() => {}}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SettingRow>
        </div>

        {/* Privacy & Data */}
        <div className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50">
          <div className="px-4 pt-4 pb-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Məxfilik</h2>
          </div>
          <SettingRow icon={Lock} label="Şifrə ilə qoruma" description="Tətbiqi qoruyun" onClick={() => {}}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SettingRow>
          <SettingRow icon={Database} label="Məlumat ixracı" description="Bütün məlumatlarınızı yükləyin" onClick={() => {}}>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </SettingRow>
          <SettingRow 
            icon={Trash2} 
            label="Hesabı sil" 
            description="Bütün məlumatları silin" 
            onClick={() => {}}
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
