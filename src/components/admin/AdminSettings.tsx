import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Key, Sparkles, Settings2, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AppSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
}

const aiModels = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (Tövsiyyə olunan)' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
  { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini' },
  { id: 'openai/gpt-5', name: 'GPT-5' },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      
      setSettings(data || []);
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      setLocalSettings(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(localSettings)) {
        const { error } = await supabase
          .from('app_settings')
          .update({ value: JSON.stringify(value) })
          .eq('key', key);

        if (error) throw error;
      }

      toast({
        title: 'Uğurlu',
        description: 'Tənzimləmələr yadda saxlanıldı'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Xəta',
        description: 'Tənzimləmələr yadda saxlanıla bilmədi',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tənzimləmələr</h1>
          <p className="text-muted-foreground">Tətbiq konfiqurasiyalarını idarə edin</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Yadda saxla
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* AI Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Tənzimləmələri</h3>
                  <p className="text-sm text-muted-foreground">Dr. Anacan AI modeli və parametrləri</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">AI Model</label>
                  <Select
                    value={localSettings['ai_model'] || 'google/gemini-2.5-flash'}
                    onValueChange={(value) => updateSetting('ai_model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aiModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dr. Anacan AI chat üçün istifadə olunan model
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* App Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Settings2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Tətbiq Tənzimləmələri</h3>
                  <p className="text-sm text-muted-foreground">Ümumi tətbiq parametrləri</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tətbiq Versiyası</label>
                  <Input
                    value={localSettings['app_version'] || '1.0.0'}
                    onChange={(e) => updateSetting('app_version', e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Təmir Rejimi</label>
                    <p className="text-xs text-muted-foreground">
                      Aktiv olduqda istifadəçilər tətbiqə daxil ola bilməz
                    </p>
                  </div>
                  <Switch
                    checked={localSettings['maintenance_mode'] === true}
                    onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Maksimum Günlük Qeyd</label>
                  <Input
                    type="number"
                    value={localSettings['max_daily_logs'] || 30}
                    onChange={(e) => updateSetting('max_daily_logs', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Hər istifadəçi üçün saxlanılacaq maksimum günlük qeyd sayı
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* API Keys Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Key className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">API Açarları</h3>
                  <p className="text-sm text-muted-foreground">Xarici xidmət inteqrasiyaları</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Lovable AI Gateway</p>
                      <p className="text-sm text-muted-foreground">AI funksionallığı üçün</p>
                    </div>
                    <span className="text-sm text-green-500 font-medium">✓ Aktiv</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Supabase</p>
                      <p className="text-sm text-muted-foreground">Database və Auth</p>
                    </div>
                    <span className="text-sm text-green-500 font-medium">✓ Aktiv</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  API açarları təhlükəsizlik səbəbindən burada göstərilmir. 
                  Yeni API açarı əlavə etmək üçün Edge Functions istifadə edin.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
