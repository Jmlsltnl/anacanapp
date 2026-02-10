import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, Pill, Check, X, Leaf } from 'lucide-react';
import { useVitaminsAdmin, Vitamin } from '@/hooks/useVitamins';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const AdminVitamins = () => {
  const { vitamins, isLoading, createVitamin, updateVitamin, deleteVitamin } = useVitaminsAdmin();
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVitamin, setEditingVitamin] = useState<Vitamin | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_az: '',
    description_az: '',
    benefits: '',
    food_sources: '',
    dosage: '',
    week_start: '',
    week_end: '',
    trimesters: [] as number[],
    life_stage: 'bump',
    importance: 'recommended',
    icon_emoji: '💊',
    is_active: true,
    sort_order: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      name_az: '',
      description_az: '',
      benefits: '',
      food_sources: '',
      dosage: '',
      week_start: '',
      week_end: '',
      trimesters: [],
      life_stage: 'bump',
      importance: 'recommended',
      icon_emoji: '💊',
      is_active: true,
      sort_order: 0,
    });
    setEditingVitamin(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (vitamin: Vitamin) => {
    setEditingVitamin(vitamin);
    setFormData({
      name: vitamin.name,
      name_az: vitamin.name_az || '',
      description_az: vitamin.description_az || '',
      benefits: vitamin.benefits?.join('\n') || '',
      food_sources: vitamin.food_sources?.join('\n') || '',
      dosage: vitamin.dosage || '',
      week_start: vitamin.week_start?.toString() || '',
      week_end: vitamin.week_end?.toString() || '',
      trimesters: vitamin.trimester || [],
      life_stage: vitamin.life_stage || 'bump',
      importance: vitamin.importance || 'recommended',
      icon_emoji: vitamin.icon_emoji || '💊',
      is_active: vitamin.is_active,
      sort_order: vitamin.sort_order || 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const vitaminData: Record<string, any> = {
        name: formData.name,
        name_az: formData.name_az || null,
        description: formData.description_az || null,
        description_az: formData.description_az || null,
        benefits: formData.benefits ? formData.benefits.split('\n').filter(b => b.trim()) : null,
        food_sources: formData.food_sources ? formData.food_sources.split('\n').filter(f => f.trim()) : null,
        dosage: formData.dosage || null,
        week_start: formData.week_start ? parseInt(formData.week_start) : null,
        week_end: formData.week_end ? parseInt(formData.week_end) : null,
        trimester: formData.trimesters.length > 0 ? formData.trimesters : null,
        life_stage: formData.life_stage,
        importance: formData.importance,
        icon_emoji: formData.icon_emoji,
        is_active: formData.is_active,
        sort_order: formData.sort_order,
      };

      if (editingVitamin) {
        await updateVitamin.mutateAsync({ id: editingVitamin.id, ...vitaminData });
        toast.success('Vitamin yeniləndi');
      } else {
        await createVitamin.mutateAsync(vitaminData);
        toast.success('Vitamin əlavə edildi');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu vitamini silmək istədiyinizə əminsiniz?')) return;
    try {
      await deleteVitamin.mutateAsync(id);
      toast.success('Vitamin silindi');
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const filteredVitamins = vitamins.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.name_az?.toLowerCase().includes(search.toLowerCase());
    const matchesStage = filterStage === 'all' || v.life_stage === filterStage;
    return matchesSearch && matchesStage;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Vitaminlər
          </h1>
          <p className="text-sm text-muted-foreground">Həftəlik vitamin tövsiyələrini idarə edin</p>
        </div>
        <Button onClick={openCreateModal} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Əlavə et
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Axtar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Mərhələ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hamısı</SelectItem>
            <SelectItem value="bump">Hamiləlik</SelectItem>
            <SelectItem value="mommy">Anacan</SelectItem>
            <SelectItem value="flow">Ümumi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vitamins List */}
      <div className="grid gap-3">
        {filteredVitamins.map((vitamin, index) => (
          <motion.div
            key={vitamin.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`bg-card border rounded-xl p-3 ${!vitamin.is_active ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                {vitamin.icon_emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{vitamin.name_az || vitamin.name}</h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    vitamin.importance === 'essential' 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}>
                    {vitamin.importance === 'essential' ? 'Vacib' : 'Tövsiyə'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {vitamin.description_az || vitamin.description}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                  <span className="px-1.5 py-0.5 bg-muted rounded">
                    {vitamin.life_stage === 'bump' ? 'Hamiləlik' : vitamin.life_stage === 'mommy' ? 'Anacan' : 'Ümumi'}
                  </span>
                  {vitamin.trimester && vitamin.trimester.length === 3 && (
                    <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-700 dark:text-purple-400">Hər üç trimester</span>
                  )}
                  {vitamin.trimester && vitamin.trimester.length > 0 && vitamin.trimester.length < 3 && (
                    <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-700 dark:text-purple-400">
                      Trimester {vitamin.trimester.join(', ')}
                    </span>
                  )}
                  {vitamin.week_start && vitamin.week_end && (
                    <span>Həftə {vitamin.week_start}-{vitamin.week_end}</span>
                  )}
                  {vitamin.dosage && (
                    <span>• {vitamin.dosage}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModal(vitamin)}>
                  <Edit className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(vitamin.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredVitamins.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Leaf className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Vitamin tapılmadı</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVitamin ? 'Vitamini Redaktə Et' : 'Yeni Vitamin'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ad (EN)</label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Vitamin D"
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Ad (AZ)</label>
                <Input
                  value={formData.name_az}
                  onChange={e => setFormData({ ...formData, name_az: e.target.value })}
                  placeholder="D vitamini"
                  className="h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Təsvir (AZ)</label>
              <Textarea
                value={formData.description_az}
                onChange={e => setFormData({ ...formData, description_az: e.target.value })}
                placeholder="Vitaminin faydaları haqqında..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Faydaları (hər sətirdə 1)</label>
                <Textarea
                  value={formData.benefits}
                  onChange={e => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Sümük sağlamlığı&#10;İmmun sistem dəstəyi"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Qida mənbələri (hər sətirdə 1)</label>
                <Textarea
                  value={formData.food_sources}
                  onChange={e => setFormData({ ...formData, food_sources: e.target.value })}
                  placeholder="Süd məhsulları&#10;Balıq&#10;Yumurta"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Dozaj</label>
                <Input
                  value={formData.dosage}
                  onChange={e => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="400 IU/gün"
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Emoji</label>
                <Input
                  value={formData.icon_emoji}
                  onChange={e => setFormData({ ...formData, icon_emoji: e.target.value })}
                  placeholder="💊"
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sıra</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Həftə (başlanğıc)</label>
                <Input
                  type="number"
                  value={formData.week_start}
                  onChange={e => setFormData({ ...formData, week_start: e.target.value })}
                  placeholder="1"
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Həftə (son)</label>
                <Input
                  type="number"
                  value={formData.week_end}
                  onChange={e => setFormData({ ...formData, week_end: e.target.value })}
                  placeholder="40"
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Trimestrlər</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 1, label: '1-ci' },
                    { value: 2, label: '2-ci' },
                    { value: 3, label: '3-cü' },
                  ].map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        const current = formData.trimesters;
                        const updated = current.includes(t.value)
                          ? current.filter(v => v !== t.value)
                          : [...current, t.value].sort();
                        setFormData({ ...formData, trimesters: updated });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        formData.trimesters.includes(t.value)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {formData.trimesters.length === 3 && (
                  <p className="text-[10px] text-primary mt-1">✓ Hər üç trimester seçildi</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Mərhələ</label>
                <Select value={formData.life_stage} onValueChange={v => setFormData({ ...formData, life_stage: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bump">Hamiləlik</SelectItem>
                    <SelectItem value="mommy">Anacan</SelectItem>
                    <SelectItem value="flow">Ümumi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Əhəmiyyət</label>
                <Select value={formData.importance} onValueChange={v => setFormData({ ...formData, importance: v })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="essential">Vacib</SelectItem>
                    <SelectItem value="recommended">Tövsiyə</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={v => setFormData({ ...formData, is_active: v })}
                />
                <span className="text-sm">Aktiv</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  <X className="w-4 h-4 mr-1" />
                  Ləğv et
                </Button>
                <Button onClick={handleSave} disabled={!formData.name}>
                  <Check className="w-4 h-4 mr-1" />
                  Yadda saxla
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVitamins;
