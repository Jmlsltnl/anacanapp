import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Crown, Save, X, Check, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAdminPremiumConfig, PremiumFeature, PremiumPlan } from '@/hooks/usePremiumConfig';
import UnsavedChangesDialog from './UnsavedChangesDialog';

const AdminPremiumConfig = () => {
  const { features, plans, loading, createFeature, updateFeature, deleteFeature, updatePlan } = useAdminPremiumConfig();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('features');
  
  // Feature modal state
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PremiumFeature | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const initialFormDataRef = useRef<string>('');
  
  const [featureForm, setFeatureForm] = useState({
    title: '',
    title_az: '',
    description: '',
    description_az: '',
    icon: '✨',
    is_included_free: false,
    is_included_premium: true,
    is_included_premium_plus: true,
    sort_order: 0,
    is_active: true,
  });

  // Plan modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PremiumPlan | null>(null);
  const initialPlanFormRef = useRef<string>('');
  
  const [planForm, setPlanForm] = useState({
    name: '',
    name_az: '',
    description: '',
    description_az: '',
    price_monthly: 0,
    price_yearly: 0,
    currency: 'AZN',
    badge_text: '',
    badge_text_az: '',
    is_popular: false,
    is_active: true,
  });

  const hasUnsavedChanges = () => {
    if (showFeatureModal) {
      return JSON.stringify(featureForm) !== initialFormDataRef.current;
    }
    if (showPlanModal) {
      return JSON.stringify(planForm) !== initialPlanFormRef.current;
    }
    return false;
  };

  const handleFeatureModalClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      closeFeatureModal();
    }
  };

  const closeFeatureModal = () => {
    setShowFeatureModal(false);
    setEditingFeature(null);
    setFeatureForm({
      title: '',
      title_az: '',
      description: '',
      description_az: '',
      icon: '✨',
      is_included_free: false,
      is_included_premium: true,
      is_included_premium_plus: true,
      sort_order: 0,
      is_active: true,
    });
  };

  const openFeatureModal = (feature?: PremiumFeature) => {
    const data = feature ? {
      title: feature.title,
      title_az: feature.title_az || '',
      description: feature.description || '',
      description_az: feature.description_az || '',
      icon: feature.icon,
      is_included_free: feature.is_included_free,
      is_included_premium: feature.is_included_premium,
      is_included_premium_plus: feature.is_included_premium_plus,
      sort_order: feature.sort_order,
      is_active: feature.is_active,
    } : {
      title: '',
      title_az: '',
      description: '',
      description_az: '',
      icon: '✨',
      is_included_free: false,
      is_included_premium: true,
      is_included_premium_plus: true,
      sort_order: features.length,
      is_active: true,
    };
    setFeatureForm(data);
    initialFormDataRef.current = JSON.stringify(data);
    setEditingFeature(feature || null);
    setShowFeatureModal(true);
  };

  const handleSaveFeature = async () => {
    if (!featureForm.title.trim()) {
      toast({ title: 'Başlıq daxil edin', variant: 'destructive' });
      return;
    }

    let result;
    if (editingFeature) {
      result = await updateFeature(editingFeature.id, featureForm);
    } else {
      result = await createFeature(featureForm);
    }

    if (result.error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    } else {
      toast({ title: editingFeature ? 'Yeniləndi' : 'Əlavə edildi' });
      closeFeatureModal();
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    const result = await deleteFeature(id);
    if (result.error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    } else {
      toast({ title: 'Silindi' });
    }
  };

  // Plan functions
  const handlePlanModalClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      closePlanModal();
    }
  };

  const closePlanModal = () => {
    setShowPlanModal(false);
    setEditingPlan(null);
  };

  const openPlanModal = (plan: PremiumPlan) => {
    const data = {
      name: plan.name,
      name_az: plan.name_az || '',
      description: plan.description || '',
      description_az: plan.description_az || '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      currency: plan.currency,
      badge_text: plan.badge_text || '',
      badge_text_az: plan.badge_text_az || '',
      is_popular: plan.is_popular,
      is_active: plan.is_active,
    };
    setPlanForm(data);
    initialPlanFormRef.current = JSON.stringify(data);
    setEditingPlan(plan);
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    
    const result = await updatePlan(editingPlan.id, planForm);
    if (result.error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    } else {
      toast({ title: 'Yeniləndi' });
      closePlanModal();
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Yüklənir...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="w-6 h-6 text-amber-500" />
          Premium Səhifə Dizayneri
        </h2>
        <p className="text-muted-foreground">
          Premium planlar və funksiyaları idarə edin
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="features">Funksiyalar</TabsTrigger>
          <TabsTrigger value="plans">Qiymət Planları</TabsTrigger>
          <TabsTrigger value="preview">Önizləmə</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openFeatureModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Funksiya
            </Button>
          </div>

          <div className="grid gap-3">
            {features.map((feature) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-card rounded-xl border"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <p className="font-medium">{feature.title_az || feature.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {feature.is_included_free && <Badge variant="outline" className="text-xs">Free</Badge>}
                      {feature.is_included_premium && <Badge className="text-xs bg-primary">Premium</Badge>}
                      {feature.is_included_premium_plus && <Badge className="text-xs bg-amber-500">Premium+</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openFeatureModal(feature)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteFeature(feature.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative p-6 bg-card rounded-xl border-2 ${plan.is_popular ? 'border-primary' : 'border-border'}`}
              >
                {plan.is_popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Populyar
                  </Badge>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold">{plan.name_az || plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">{plan.price_monthly}</span>
                    <span className="text-muted-foreground"> {plan.currency}/ay</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.price_yearly} {plan.currency}/il
                  </p>
                  <Button className="mt-4 w-full" variant="outline" onClick={() => openPlanModal(plan)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Redaktə Et
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-center mb-6">Premium Planlar Önizləmə</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-3">Funksiya</th>
                    {plans.map(plan => (
                      <th key={plan.id} className="text-center p-3">
                        {plan.name_az || plan.name}
                        <div className="text-sm font-normal text-muted-foreground">
                          {plan.price_monthly} {plan.currency}/ay
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map(feature => (
                    <tr key={feature.id} className="border-t">
                      <td className="p-3">
                        <span className="mr-2">{feature.icon}</span>
                        {feature.title_az || feature.title}
                      </td>
                      <td className="text-center p-3">
                        {feature.is_included_free ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                      <td className="text-center p-3">
                        {feature.is_included_premium ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                      <td className="text-center p-3">
                        {feature.is_included_premium_plus ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Modal */}
      <Dialog open={showFeatureModal} onOpenChange={handleFeatureModalClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFeature ? 'Funksiyanı Redaktə Et' : 'Yeni Funksiya'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label>İkon</Label>
                <Input
                  value={featureForm.icon}
                  onChange={(e) => setFeatureForm({ ...featureForm, icon: e.target.value })}
                  className="text-center text-xl"
                />
              </div>
              <div className="col-span-3">
                <Label>Başlıq (EN)</Label>
                <Input
                  value={featureForm.title}
                  onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Başlıq (AZ)</Label>
              <Input
                value={featureForm.title_az}
                onChange={(e) => setFeatureForm({ ...featureForm, title_az: e.target.value })}
              />
            </div>

            <div>
              <Label>Açıqlama (AZ)</Label>
              <Textarea
                value={featureForm.description_az}
                onChange={(e) => setFeatureForm({ ...featureForm, description_az: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-3 pt-2">
              <Label>Planlara daxildir:</Label>
              <div className="flex items-center justify-between">
                <span>Free</span>
                <Switch
                  checked={featureForm.is_included_free}
                  onCheckedChange={(v) => setFeatureForm({ ...featureForm, is_included_free: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Premium</span>
                <Switch
                  checked={featureForm.is_included_premium}
                  onCheckedChange={(v) => setFeatureForm({ ...featureForm, is_included_premium: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Premium+</span>
                <Switch
                  checked={featureForm.is_included_premium_plus}
                  onCheckedChange={(v) => setFeatureForm({ ...featureForm, is_included_premium_plus: v })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label>Aktiv</Label>
              <Switch
                checked={featureForm.is_active}
                onCheckedChange={(v) => setFeatureForm({ ...featureForm, is_active: v })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleFeatureModalClose}>
                <X className="w-4 h-4 mr-2" />
                Ləğv et
              </Button>
              <Button className="flex-1" onClick={handleSaveFeature}>
                <Save className="w-4 h-4 mr-2" />
                Saxla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={handlePlanModalClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Planı Redaktə Et</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Ad (AZ)</Label>
              <Input
                value={planForm.name_az}
                onChange={(e) => setPlanForm({ ...planForm, name_az: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Aylıq Qiymət</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={planForm.price_monthly}
                  onChange={(e) => setPlanForm({ ...planForm, price_monthly: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>İllik Qiymət</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={planForm.price_yearly}
                  onChange={(e) => setPlanForm({ ...planForm, price_yearly: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Valyuta</Label>
              <Input
                value={planForm.currency}
                onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
              />
            </div>

            <div>
              <Label>Badge Mətni (AZ)</Label>
              <Input
                value={planForm.badge_text_az}
                onChange={(e) => setPlanForm({ ...planForm, badge_text_az: e.target.value })}
                placeholder="Məs: Ən sərfəli"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Populyar</Label>
              <Switch
                checked={planForm.is_popular}
                onCheckedChange={(v) => setPlanForm({ ...planForm, is_popular: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Aktiv</Label>
              <Switch
                checked={planForm.is_active}
                onCheckedChange={(v) => setPlanForm({ ...planForm, is_active: v })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={handlePlanModalClose}>
                <X className="w-4 h-4 mr-2" />
                Ləğv et
              </Button>
              <Button className="flex-1" onClick={handleSavePlan}>
                <Save className="w-4 h-4 mr-2" />
                Saxla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={() => {
          if (showFeatureModal) closeFeatureModal();
          if (showPlanModal) closePlanModal();
        }}
      />
    </div>
  );
};

export default AdminPremiumConfig;
