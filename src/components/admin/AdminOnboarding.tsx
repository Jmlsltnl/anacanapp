import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Plus, Pencil, Trash2, Search, Baby } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  useAdminOnboardingStages, 
  useAdminMultiplesOptions,
  OnboardingStage,
  MultiplesOption 
} from '@/hooks/useAdminOnboarding';

const AdminOnboarding = () => {
  const stages = useAdminOnboardingStages();
  const multiples = useAdminMultiplesOptions();
  
  const [activeTab, setActiveTab] = useState('stages');
  const [showStageModal, setShowStageModal] = useState(false);
  const [showMultipleModal, setShowMultipleModal] = useState(false);
  const [editingStage, setEditingStage] = useState<OnboardingStage | null>(null);
  const [editingMultiple, setEditingMultiple] = useState<MultiplesOption | null>(null);
  const [stageFormData, setStageFormData] = useState<Partial<OnboardingStage>>({});
  const [multipleFormData, setMultipleFormData] = useState<Partial<MultiplesOption>>({});

  // Stage handlers
  const openCreateStageModal = () => {
    setEditingStage(null);
    setStageFormData({
      stage_id: '',
      title: '',
      title_az: '',
      subtitle: '',
      subtitle_az: '',
      description: '',
      description_az: '',
      emoji: '👶',
      icon_name: 'Baby',
      bg_gradient: 'from-purple-500 to-pink-600',
      sort_order: 0,
      is_active: true,
    });
    setShowStageModal(true);
  };

  const openEditStageModal = (item: OnboardingStage) => {
    setEditingStage(item);
    setStageFormData({ ...item });
    setShowStageModal(true);
  };

  const handleSaveStage = async () => {
    if (editingStage) {
      await stages.update.mutateAsync({ id: editingStage.id, ...stageFormData });
    } else {
      await stages.create.mutateAsync(stageFormData);
    }
    setShowStageModal(false);
  };

  const handleDeleteStage = async (id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    await stages.remove.mutateAsync(id);
  };

  // Multiple handlers
  const openCreateMultipleModal = () => {
    setEditingMultiple(null);
    setMultipleFormData({
      option_id: '',
      label: '',
      label_az: '',
      emoji: '👶',
      baby_count: 1,
      sort_order: 0,
      is_active: true,
    });
    setShowMultipleModal(true);
  };

  const openEditMultipleModal = (item: MultiplesOption) => {
    setEditingMultiple(item);
    setMultipleFormData({ ...item });
    setShowMultipleModal(true);
  };

  const handleSaveMultiple = async () => {
    if (editingMultiple) {
      await multiples.update.mutateAsync({ id: editingMultiple.id, ...multipleFormData });
    } else {
      await multiples.create.mutateAsync(multipleFormData);
    }
    setShowMultipleModal(false);
  };

  const handleDeleteMultiple = async (id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    await multiples.remove.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Qeydiyyat Mərhələləri</h1>
          <p className="text-muted-foreground">Onboarding seçimlərini idarə edin</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stages.data?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Mərhələlər</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Baby className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{multiples.data?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Çoxluq Seçimləri</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Sparkles className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stages.data?.filter(s => s.is_active).length || 0}</p>
              <p className="text-xs text-muted-foreground">Aktiv Mərhələ</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Baby className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{multiples.data?.filter(m => m.is_active).length || 0}</p>
              <p className="text-xs text-muted-foreground">Aktiv Çoxluq</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="stages">Həyat Mərhələləri</TabsTrigger>
          <TabsTrigger value="multiples">Çoxluq Seçimləri</TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateStageModal} className="gap-2">
              <Plus className="w-4 h-4" />
              Yeni Mərhələ
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Həyat Mərhələləri ({stages.data?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {stages.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
              ) : (stages.data?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Mərhələ tapılmadı</div>
              ) : (
                <div className="space-y-3">
                  {stages.data?.map((stage, index) => (
                    <motion.div
                      key={stage.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.bg_gradient} flex items-center justify-center text-2xl text-white`}>
                          {stage.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{stage.title_az || stage.title}</p>
                            <Badge variant={stage.is_active ? 'default' : 'secondary'}>
                              {stage.is_active ? 'Aktiv' : 'Gizli'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{stage.subtitle_az || stage.subtitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{stage.stage_id}</Badge>
                            <span className="text-xs text-muted-foreground">Sıra: {stage.sort_order}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditStageModal(stage)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStage(stage.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multiples" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreateMultipleModal} className="gap-2">
              <Plus className="w-4 h-4" />
              Yeni Seçim
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Çoxluq Seçimləri ({multiples.data?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {multiples.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
              ) : (multiples.data?.length || 0) === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Seçim tapılmadı</div>
              ) : (
                <div className="space-y-3">
                  {multiples.data?.map((option, index) => (
                    <motion.div
                      key={option.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                          {option.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{option.label_az || option.label}</p>
                            <Badge variant={option.is_active ? 'default' : 'secondary'}>
                              {option.is_active ? 'Aktiv' : 'Gizli'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{option.baby_count} uşaq</Badge>
                            <span className="text-xs text-muted-foreground">Sıra: {option.sort_order}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditMultipleModal(option)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteMultiple(option.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stage Modal */}
      <Dialog open={showStageModal} onOpenChange={setShowStageModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Mərhələ Redaktə Et' : 'Yeni Mərhələ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Stage ID (flow, bump, mommy)"
                value={stageFormData.stage_id || ''}
                onChange={(e) => setStageFormData({ ...stageFormData, stage_id: e.target.value })}
              />
              <Input
                placeholder="Emoji"
                value={stageFormData.emoji || ''}
                onChange={(e) => setStageFormData({ ...stageFormData, emoji: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Başlıq (EN)"
                value={stageFormData.title || ''}
                onChange={(e) => setStageFormData({ ...stageFormData, title: e.target.value })}
              />
              <Input
                placeholder="Başlıq (AZ)"
                value={stageFormData.title_az || ''}
                onChange={(e) => setStageFormData({ ...stageFormData, title_az: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Alt başlıq (EN)"
                value={stageFormData.subtitle || ''}
                onChange={(e) => setStageFormData({ ...stageFormData, subtitle: e.target.value })}
              />
              <Input
                placeholder="Alt başlıq (AZ)"
                value={stageFormData.subtitle_az || ''}
                onChange={(e) => setStageFormData({ ...stageFormData, subtitle_az: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Təsvir (AZ)"
              value={stageFormData.description_az || ''}
              onChange={(e) => setStageFormData({ ...stageFormData, description_az: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="İkon adı (Baby, Heart, Calendar)"
                value={stageFormData.icon_name || ''}
                onChange={(e) => setStageFormData({ ...stageFormData, icon_name: e.target.value })}
              />
              <Input
                placeholder="Gradient (from-purple-500 to-pink-600)"
                value={stageFormData.bg_gradient || ''}
                onChange={(e) => setStageFormData({ ...stageFormData, bg_gradient: e.target.value })}
              />
            </div>
            <Input
              type="number"
              placeholder="Sıra"
              value={stageFormData.sort_order || 0}
              onChange={(e) => setStageFormData({ ...stageFormData, sort_order: parseInt(e.target.value) })}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={stageFormData.is_active ?? true}
                onCheckedChange={(v) => setStageFormData({ ...stageFormData, is_active: v })}
              />
              <span className="text-sm">Aktiv</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStageModal(false)}>
              Ləğv et
            </Button>
            <Button onClick={handleSaveStage} disabled={stages.create.isPending || stages.update.isPending}>
              {editingStage ? 'Yenilə' : 'Əlavə et'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multiple Modal */}
      <Dialog open={showMultipleModal} onOpenChange={setShowMultipleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingMultiple ? 'Seçim Redaktə Et' : 'Yeni Seçim'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Option ID (single, twins)"
                value={multipleFormData.option_id || ''}
                onChange={(e) => setMultipleFormData({ ...multipleFormData, option_id: e.target.value })}
              />
              <Input
                placeholder="Emoji"
                value={multipleFormData.emoji || ''}
                onChange={(e) => setMultipleFormData({ ...multipleFormData, emoji: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Label (EN)"
                value={multipleFormData.label || ''}
                onChange={(e) => setMultipleFormData({ ...multipleFormData, label: e.target.value })}
              />
              <Input
                placeholder="Label (AZ)"
                value={multipleFormData.label_az || ''}
                onChange={(e) => setMultipleFormData({ ...multipleFormData, label_az: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Uşaq sayı"
                value={multipleFormData.baby_count || 1}
                onChange={(e) => setMultipleFormData({ ...multipleFormData, baby_count: parseInt(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Sıra"
                value={multipleFormData.sort_order || 0}
                onChange={(e) => setMultipleFormData({ ...multipleFormData, sort_order: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={multipleFormData.is_active ?? true}
                onCheckedChange={(v) => setMultipleFormData({ ...multipleFormData, is_active: v })}
              />
              <span className="text-sm">Aktiv</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMultipleModal(false)}>
              Ləğv et
            </Button>
            <Button onClick={handleSaveMultiple} disabled={multiples.create.isPending || multiples.update.isPending}>
              {editingMultiple ? 'Yenilə' : 'Əlavə et'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOnboarding;
