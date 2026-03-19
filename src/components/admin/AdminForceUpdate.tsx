import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Save, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ForceUpdateConfig {
  enabled: boolean;
  min_version: string;
  title: string;
  message: string;
  android_url: string;
  ios_url: string;
}

const defaultConfig: ForceUpdateConfig = {
  enabled: false,
  min_version: '1.0.0',
  title: 'Yeniləmə tələb olunur',
  message: 'Tətbiqin yeni versiyası mövcuddur. Davam etmək üçün tətbiqi yeniləyin.',
  android_url: 'https://play.google.com/store/apps/details?id=com.atlasoon.anacan',
  ios_url: 'https://apps.apple.com/app/anacan/id6745406124',
};

const AdminForceUpdate = () => {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['force-update-config'],
    queryFn: async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('key', 'force_update')
        .maybeSingle();
      return data ? (data.value as unknown as ForceUpdateConfig) : defaultConfig;
    },
  });

  const [form, setForm] = useState<ForceUpdateConfig | null>(null);
  const current = form ?? config ?? defaultConfig;

  const saveMutation = useMutation({
    mutationFn: async (values: ForceUpdateConfig) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key: 'force_update', value: values as any, description: 'Force update configuration' }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['force-update-config'] });
      toast.success('Force Update konfiqurasiyası saxlanıldı');
    },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const update = (patch: Partial<ForceUpdateConfig>) => setForm({ ...current, ...patch });

  if (isLoading) return <div className="p-4 text-muted-foreground">Yüklənir...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Force Update
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Aktiv edildikdə istifadəçilər tətbiqi yeniləmədən davam edə bilməzlər
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Force Update Statusu</span>
            <Switch
              checked={current.enabled}
              onCheckedChange={(v) => update({ enabled: v })}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Minimum versiya</Label>
            <Input
              value={current.min_version}
              onChange={(e) => update({ min_version: e.target.value })}
              placeholder="1.2.0"
            />
          </div>

          <div className="space-y-2">
            <Label>Başlıq</Label>
            <Input
              value={current.title}
              onChange={(e) => update({ title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Mesaj</Label>
            <Textarea
              value={current.message}
              onChange={(e) => update({ message: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Android (Play Store) linki
            </Label>
            <Input
              value={current.android_url}
              onChange={(e) => update({ android_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> iOS (App Store) linki
            </Label>
            <Input
              value={current.ios_url}
              onChange={(e) => update({ ios_url: e.target.value })}
            />
          </div>

          <Button
            onClick={() => saveMutation.mutate(current)}
            disabled={saveMutation.isPending}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saxlanılır...' : 'Saxla'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminForceUpdate;
