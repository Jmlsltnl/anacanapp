import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Calculator, Save, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAdminMaternityBenefits, MaternityConfigItem, MaternityGuideline } from '@/hooks/useMaternityBenefits';
import UnsavedChangesDialog from './UnsavedChangesDialog';

const AdminMaternityBenefits = () => {
  const { configItems, guidelines, loading, updateConfigValue, createGuideline, updateGuideline, deleteGuideline } = useAdminMaternityBenefits();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('config');
  
  // Config editing
  const [editingConfig, setEditingConfig] = useState<MaternityConfigItem | null>(null);
  const [configValue, setConfigValue] = useState('');
  
  // Guideline modal
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [editingGuide, setEditingGuide] = useState<MaternityGuideline | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const initialFormDataRef = useRef<string>('');
  
  const [guideForm, setGuideForm] = useState({
    title: '',
    title_az: '',
    content: '',
    content_az: '',
    category: 'general',
    icon: '📋',
    sort_order: 0,
    is_active: true,
  });

  const hasUnsavedChanges = () => {
    if (!showGuideModal) return false;
    return JSON.stringify(guideForm) !== initialFormDataRef.current;
  };

  const handleGuideModalClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      closeGuideModal();
    }
  };

  const closeGuideModal = () => {
    setShowGuideModal(false);
    setEditingGuide(null);
    setGuideForm({
      title: '',
      title_az: '',
      content: '',
      content_az: '',
      category: 'general',
      icon: '📋',
      sort_order: 0,
      is_active: true,
    });
  };

  const openGuideModal = (guide?: MaternityGuideline) => {
    const data = guide ? {
      title: guide.title,
      title_az: guide.title_az || '',
      content: guide.content,
      content_az: guide.content_az || '',
      category: guide.category,
      icon: guide.icon,
      sort_order: guide.sort_order,
      is_active: guide.is_active,
    } : {
      title: '',
      title_az: '',
      content: '',
      content_az: '',
      category: 'general',
      icon: '📋',
      sort_order: guidelines.length,
      is_active: true,
    };
    setGuideForm(data);
    initialFormDataRef.current = JSON.stringify(data);
    setEditingGuide(guide || null);
    setShowGuideModal(true);
  };

  const handleSaveConfig = async () => {
    if (!editingConfig) return;
    const value = parseFloat(configValue);
    if (isNaN(value)) {
      toast({ title: 'Düzgün rəqəm daxil edin', variant: 'destructive' });
      return;
    }
    
    const result = await updateConfigValue(editingConfig.id, value);
    if (result.error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    } else {
      toast({ title: 'Yeniləndi' });
      setEditingConfig(null);
    }
  };

  const handleSaveGuide = async () => {
    if (!guideForm.title.trim() || !guideForm.content.trim()) {
      toast({ title: 'Başlıq və məzmun daxil edin', variant: 'destructive' });
      return;
    }

    let result;
    if (editingGuide) {
      result = await updateGuideline(editingGuide.id, guideForm);
    } else {
      result = await createGuideline(guideForm);
    }

    if (result.error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    } else {
      toast({ title: editingGuide ? 'Yeniləndi' : 'Əlavə edildi' });
      closeGuideModal();
    }
  };

  const handleDeleteGuide = async (id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    const result = await deleteGuideline(id);
    if (result.error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    } else {
      toast({ title: 'Silindi' });
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Yüklənir...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-500" />
          Dekret Kalkulyatoru
        </h2>
        <p className="text-muted-foreground">
          Dekret ödənişi konfiqurasiyası və bələdçilər
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="config">Konfiqurasiya</TabsTrigger>
          <TabsTrigger value="guidelines">Bələdçilər</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Bu dəyərlər Azərbaycan qanunvericiliyinə əsasən tənzimlənir
            </p>
          </div>

          <div className="grid gap-3">
            {configItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-card rounded-xl border"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.label_az || item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description_az || item.description}</p>
                </div>
                
                {editingConfig?.id === item.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={configValue}
                      onChange={(e) => setConfigValue(e.target.value)}
                      className="w-32"
                    />
                    <Button size="sm" onClick={handleSaveConfig}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingConfig(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-primary">{item.value}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingConfig(item);
                        setConfigValue(item.value.toString());
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openGuideModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Yeni Bələdçi
            </Button>
          </div>

          <div className="grid gap-3">
            {guidelines.map((guide) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-card rounded-xl border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{guide.icon}</span>
                  <div>
                    <p className="font-medium">{guide.title_az || guide.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Kateqoriya: {guide.category} | Sıra: {guide.sort_order}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openGuideModal(guide)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteGuide(guide.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Guideline Modal */}
      <Dialog open={showGuideModal} onOpenChange={handleGuideModalClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGuide ? 'Bələdçini Redaktə Et' : 'Yeni Bələdçi'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label>İkon</Label>
                <Input
                  value={guideForm.icon}
                  onChange={(e) => setGuideForm({ ...guideForm, icon: e.target.value })}
                  className="text-center text-xl"
                />
              </div>
              <div className="col-span-3">
                <Label>Başlıq (EN)</Label>
                <Input
                  value={guideForm.title}
                  onChange={(e) => setGuideForm({ ...guideForm, title: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Başlıq (AZ)</Label>
              <Input
                value={guideForm.title_az}
                onChange={(e) => setGuideForm({ ...guideForm, title_az: e.target.value })}
              />
            </div>

            <div>
              <Label>Məzmun (EN)</Label>
              <Textarea
                value={guideForm.content}
                onChange={(e) => setGuideForm({ ...guideForm, content: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label>Məzmun (AZ) - Markdown dəstəklənir</Label>
              <Textarea
                value={guideForm.content_az}
                onChange={(e) => setGuideForm({ ...guideForm, content_az: e.target.value })}
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kateqoriya</Label>
                <Input
                  value={guideForm.category}
                  onChange={(e) => setGuideForm({ ...guideForm, category: e.target.value })}
                />
              </div>
              <div>
                <Label>Sıra</Label>
                <Input
                  type="number"
                  value={guideForm.sort_order}
                  onChange={(e) => setGuideForm({ ...guideForm, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Aktiv</Label>
              <Switch
                checked={guideForm.is_active}
                onCheckedChange={(v) => setGuideForm({ ...guideForm, is_active: v })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleGuideModalClose}>
                <X className="w-4 h-4 mr-2" />
                Ləğv et
              </Button>
              <Button className="flex-1" onClick={handleSaveGuide}>
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
        onDiscard={closeGuideModal}
      />
    </div>
  );
};

export default AdminMaternityBenefits;
