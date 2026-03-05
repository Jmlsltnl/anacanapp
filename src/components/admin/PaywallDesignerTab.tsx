import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Loader2, Crown, Palette, Type, MousePointer, FileText, Sparkles, icons } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePaywallConfig, useUpdatePaywallConfig, defaultPaywallConfig, PaywallConfig } from '@/hooks/usePaywallConfig';

const PaywallDesignerTab = () => {
  const paywallConfig = usePaywallConfig();
  const { update, isPending } = useUpdatePaywallConfig();
  const { toast } = useToast();
  const [config, setConfig] = useState<PaywallConfig>(defaultPaywallConfig);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setConfig(paywallConfig);
  }, [JSON.stringify(paywallConfig)]);

  const updateField = <K extends keyof PaywallConfig>(key: K, value: PaywallConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updatePill = (index: number, field: 'icon' | 'text', value: string) => {
    const newPills = [...config.pills];
    newPills[index] = { ...newPills[index], [field]: value };
    updateField('pills', newPills);
  };

  const addPill = () => {
    updateField('pills', [...config.pills, { icon: 'Star', text: 'Yeni' }]);
  };

  const removePill = (index: number) => {
    updateField('pills', config.pills.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await update(config);
      toast({ title: 'Paywall konfiqurasiyası saxlanıldı ✓' });
      setHasChanges(false);
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setConfig(defaultPaywallConfig);
    setHasChanges(true);
  };

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-card rounded-xl border p-4 space-y-3">
      <h4 className="font-semibold text-sm flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h4>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          <Palette className="w-4 h-4 inline mr-1 text-amber-500" />
          Premium Paywall səhifəsindəki bütün mətnləri, rəngləri və elementləri buradan idarə edin.
        </p>
      </div>

      {/* Branding */}
      <Section title="Başlıq və Alt Başlıq" icon={Type}>
        <div>
          <Label>Səhifə Başlığı</Label>
          <Input value={config.title} onChange={e => updateField('title', e.target.value)} placeholder="Anacan Premium" />
        </div>
        <div>
          <Label>Alt Başlıq</Label>
          <Input value={config.subtitle} onChange={e => updateField('subtitle', e.target.value)} placeholder="Tam təcrübə · Sınırsız imkanlar" />
        </div>
      </Section>

      {/* Gradient Colors */}
      <Section title="Gradient Rəngləri" icon={Palette}>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Başlanğıc</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.gradient_from} onChange={e => updateField('gradient_from', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              <Input value={config.gradient_from} onChange={e => updateField('gradient_from', e.target.value)} className="text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Orta</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.gradient_via} onChange={e => updateField('gradient_via', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              <Input value={config.gradient_via} onChange={e => updateField('gradient_via', e.target.value)} className="text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Son</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.gradient_to} onChange={e => updateField('gradient_to', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              <Input value={config.gradient_to} onChange={e => updateField('gradient_to', e.target.value)} className="text-xs" />
            </div>
          </div>
        </div>
        {/* Preview */}
        <div className="h-12 rounded-xl" style={{ background: `linear-gradient(to right, ${config.gradient_from}, ${config.gradient_via}, ${config.gradient_to})` }} />
      </Section>

      {/* Benefit Pills */}
      <Section title="Üstünlük Etiketləri" icon={Sparkles}>
        <div className="space-y-2">
          {config.pills.map((pill, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={pill.icon} onChange={e => updatePill(i, 'icon', e.target.value)} className="w-24" placeholder="Icon adı" />
              <Input value={pill.text} onChange={e => updatePill(i, 'text', e.target.value)} className="flex-1" placeholder="Mətn" />
              <Button variant="ghost" size="icon" onClick={() => removePill(i)} className="shrink-0">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addPill}>
            <Plus className="w-3 h-3 mr-1" />Etiket əlavə et
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">İkon adları: Zap, Shield, Sparkles, Star, Crown, Heart və s. (Lucide icon adları)</p>
      </Section>

      {/* CTA Texts */}
      <Section title="Düymə Mətnləri" icon={MousePointer}>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Yeni istifadəçi üçün CTA</Label>
            <Input value={config.cta_new_user} onChange={e => updateField('cta_new_user', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Yüksəltmə CTA</Label>
            <Input value={config.cta_upgrade} onChange={e => updateField('cta_upgrade', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">İllik plana keçid CTA</Label>
            <Input value={config.cta_switch_yearly} onChange={e => updateField('cta_switch_yearly', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Emal edilir mətni</Label>
            <Input value={config.purchasing_text} onChange={e => updateField('purchasing_text', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Plan Labels */}
      <Section title="Plan Etiketləri" icon={Crown}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">İllik etiket</Label>
            <Input value={config.yearly_label} onChange={e => updateField('yearly_label', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Aylıq etiket</Label>
            <Input value={config.monthly_label} onChange={e => updateField('monthly_label', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Qənaət badge</Label>
            <Input value={config.savings_badge} onChange={e => updateField('savings_badge', e.target.value)} placeholder="{percent}% QƏNAƏT" />
          </div>
          <div>
            <Label className="text-xs">İllik suffix</Label>
            <Input value={config.yearly_suffix} onChange={e => updateField('yearly_suffix', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Aylıq suffix</Label>
            <Input value={config.monthly_suffix} onChange={e => updateField('monthly_suffix', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">İllik cəm suffix</Label>
            <Input value={config.yearly_total_suffix} onChange={e => updateField('yearly_total_suffix', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Footer & Legal */}
      <Section title="Alt Hissə və Hüquqi" icon={FileText}>
        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Funksiya kilidi mətni</Label>
            <Input value={config.feature_lock_text} onChange={e => updateField('feature_lock_text', e.target.value)} placeholder="{feature} üçün Premium lazımdır" />
            <p className="text-[10px] text-muted-foreground mt-0.5">{'{feature}'} — funksiya adı ilə əvəz olunur</p>
          </div>
          <div>
            <Label className="text-xs">Bərpa düyməsi</Label>
            <Input value={config.restore_text} onChange={e => updateField('restore_text', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Şərtlər etiketi</Label>
              <Input value={config.terms_label} onChange={e => updateField('terms_label', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Məxfilik etiketi</Label>
              <Input value={config.privacy_label} onChange={e => updateField('privacy_label', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Ləğv bildirişi</Label>
            <Input value={config.cancel_notice} onChange={e => updateField('cancel_notice', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">App Store bildirişi (native olmayan)</Label>
            <Input value={config.non_native_notice} onChange={e => updateField('non_native_notice', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Action buttons */}
      <div className="flex gap-2 sticky bottom-0 bg-background py-3 border-t">
        <Button variant="outline" className="flex-1" onClick={handleReset}>
          Defolt-a qaytar
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={isPending || !hasChanges}>
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isPending ? 'Saxlanılır...' : 'Saxla'}
        </Button>
      </div>
    </div>
  );
};

export default PaywallDesignerTab;
