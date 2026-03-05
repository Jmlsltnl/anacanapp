import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, Loader2, Crown, Palette, Type, MousePointer, FileText, Sparkles, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useBillingConfig, useUpdateBillingConfig, defaultBillingConfig, BillingConfig } from '@/hooks/usePaywallConfig';

const BillingDesignerTab = () => {
  const billingConfig = useBillingConfig();
  const { update, isPending } = useUpdateBillingConfig();
  const { toast } = useToast();
  const [config, setConfig] = useState<BillingConfig>(defaultBillingConfig);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setConfig(billingConfig);
  }, [JSON.stringify(billingConfig)]);

  const updateField = <K extends keyof BillingConfig>(key: K, value: BillingConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateFeature = (index: number, field: 'icon' | 'text', value: string) => {
    const newFeatures = [...config.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    updateField('features', newFeatures);
  };

  const addFeature = () => {
    updateField('features', [...config.features, { icon: 'Star', text: 'Yeni' }]);
  };

  const removeFeature = (index: number) => {
    updateField('features', config.features.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await update(config);
      toast({ title: 'Abunəlik səhifəsi konfiqurasiyası saxlanıldı ✓' });
      setHasChanges(false);
    } catch {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setConfig(defaultBillingConfig);
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
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-sm text-muted-foreground">
          <CreditCard className="w-4 h-4 inline mr-1 text-primary" />
          Abunəliyim səhifəsindəki bütün mətnləri, rəngləri və elementləri buradan idarə edin.
        </p>
      </div>

      {/* Header */}
      <Section title="Başlıq və Plan Adları" icon={Type}>
        <div>
          <Label>Səhifə Başlığı</Label>
          <Input value={config.page_title} onChange={e => updateField('page_title', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Pulsuz plan adı</Label>
            <Input value={config.free_plan_name} onChange={e => updateField('free_plan_name', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Aylıq plan adı</Label>
            <Input value={config.premium_monthly_name} onChange={e => updateField('premium_monthly_name', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">İllik plan adı</Label>
            <Input value={config.premium_yearly_name} onChange={e => updateField('premium_yearly_name', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Status Badges */}
      <Section title="Status Etiketləri" icon={Crown}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Aktiv badge</Label>
            <Input value={config.active_badge} onChange={e => updateField('active_badge', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Ləğv badge</Label>
            <Input value={config.cancelled_badge} onChange={e => updateField('cancelled_badge', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Date Labels */}
      <Section title="Tarix Etiketləri" icon={FileText}>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Başlama</Label>
            <Input value={config.start_date_label} onChange={e => updateField('start_date_label', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Yenilənmə</Label>
            <Input value={config.renewal_label} onChange={e => updateField('renewal_label', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Bitmə</Label>
            <Input value={config.expiry_label} onChange={e => updateField('expiry_label', e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Ləğv bildirişi</Label>
          <Input value={config.cancelled_notice} onChange={e => updateField('cancelled_notice', e.target.value)} />
          <p className="text-[10px] text-muted-foreground mt-0.5">{'{date}'} — tarix ilə əvəz olunur</p>
        </div>
      </Section>

      {/* Features */}
      <Section title="Üstünlüklər" icon={Sparkles}>
        <div>
          <Label className="text-xs">Bölmə başlığı</Label>
          <Input value={config.features_title} onChange={e => updateField('features_title', e.target.value)} />
        </div>
        <div className="space-y-2">
          {config.features.map((feat, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={feat.icon} onChange={e => updateFeature(i, 'icon', e.target.value)} className="w-24" placeholder="Icon" />
              <Input value={feat.text} onChange={e => updateFeature(i, 'text', e.target.value)} className="flex-1" placeholder="Mətn" />
              <Button variant="ghost" size="icon" onClick={() => removeFeature(i)} className="shrink-0">
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addFeature}>
            <Plus className="w-3 h-3 mr-1" />Əlavə et
          </Button>
        </div>
      </Section>

      {/* CTA Buttons */}
      <Section title="Düymə Mətnləri" icon={MousePointer}>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Yüksəltmə CTA</Label>
              <Input value={config.upgrade_cta} onChange={e => updateField('upgrade_cta', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Qənaət mətni</Label>
              <Input value={config.upgrade_savings} onChange={e => updateField('upgrade_savings', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Bərpa CTA</Label>
              <Input value={config.restore_cta} onChange={e => updateField('restore_cta', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Ləğv CTA</Label>
              <Input value={config.cancel_cta} onChange={e => updateField('cancel_cta', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Premium-a keç CTA</Label>
            <Input value={config.get_premium_cta} onChange={e => updateField('get_premium_cta', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Payment & Support */}
      <Section title="Ödəniş və Dəstək" icon={CreditCard}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Ödəniş başlığı</Label>
            <Input value={config.payment_title} onChange={e => updateField('payment_title', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Ödənildi mətni</Label>
            <Input value={config.paid_label} onChange={e => updateField('paid_label', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Dəstək mətni</Label>
            <Input value={config.support_text} onChange={e => updateField('support_text', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Dəstək email</Label>
            <Input value={config.support_email} onChange={e => updateField('support_email', e.target.value)} />
          </div>
        </div>
      </Section>

      {/* Gradient Colors */}
      <Section title="Header Rəngləri" icon={Palette}>
        <p className="text-xs text-muted-foreground mb-2">Premium istifadəçi üçün</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Başlanğıc</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.header_gradient_from} onChange={e => updateField('header_gradient_from', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              <Input value={config.header_gradient_from} onChange={e => updateField('header_gradient_from', e.target.value)} className="text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Orta</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.header_gradient_via} onChange={e => updateField('header_gradient_via', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              <Input value={config.header_gradient_via} onChange={e => updateField('header_gradient_via', e.target.value)} className="text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Son</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.header_gradient_to} onChange={e => updateField('header_gradient_to', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              <Input value={config.header_gradient_to} onChange={e => updateField('header_gradient_to', e.target.value)} className="text-xs" />
            </div>
          </div>
        </div>
        <div className="h-10 rounded-xl" style={{ background: `linear-gradient(to right, ${config.header_gradient_from}, ${config.header_gradient_via}, ${config.header_gradient_to})` }} />

        <p className="text-xs text-muted-foreground mb-2 mt-3">Pulsuz istifadəçi üçün</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Başlanğıc</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.header_free_from} onChange={e => updateField('header_free_from', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              <Input value={config.header_free_from} onChange={e => updateField('header_free_from', e.target.value)} className="text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Orta</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.header_free_via} onChange={e => updateField('header_free_via', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              <Input value={config.header_free_via} onChange={e => updateField('header_free_via', e.target.value)} className="text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Son</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={config.header_free_to} onChange={e => updateField('header_free_to', e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              <Input value={config.header_free_to} onChange={e => updateField('header_free_to', e.target.value)} className="text-xs" />
            </div>
          </div>
        </div>
        <div className="h-10 rounded-xl" style={{ background: `linear-gradient(to right, ${config.header_free_from}, ${config.header_free_via}, ${config.header_free_to})` }} />
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

export default BillingDesignerTab;
