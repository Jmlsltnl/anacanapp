import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ShoppingCart, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAdminDefaultShoppingItems, DefaultShoppingItem } from '@/hooks/useDefaultShoppingItems';
import UnsavedChangesDialog from './UnsavedChangesDialog';

const categories = [
  { value: 'baby_care', label: 'Körpə Baxımı' },
  { value: 'feeding', label: 'Qidalanma' },
  { value: 'clothing', label: 'Geyim' },
  { value: 'bedding', label: 'Yataq' },
  { value: 'health', label: 'Sağlamlıq' },
  { value: 'safety', label: 'Təhlükəsizlik' },
  { value: 'transport', label: 'Nəqliyyat' },
  { value: 'general', label: 'Ümumi' },
];

const lifeStages = [
  { value: 'all', label: 'Hamısı' },
  { value: 'pregnant', label: 'Hamilə' },
  { value: 'baby', label: 'Körpə (0-12 ay)' },
  { value: 'toddler', label: 'Toddler (1-3 yaş)' },
];

const priorities = [
  { value: 'high', label: 'Yüksək', color: 'bg-red-500' },
  { value: 'medium', label: 'Orta', color: 'bg-yellow-500' },
  { value: 'low', label: 'Aşağı', color: 'bg-green-500' },
];

const AdminDefaultShoppingItems = () => {
  const { items, loading, createItem, updateItem, deleteItem } = useAdminDefaultShoppingItems();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DefaultShoppingItem | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const initialFormDataRef = useRef<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    name_az: '',
    category: 'general',
    priority: 'medium' as 'low' | 'medium' | 'high',
    life_stage: 'all',
    is_active: true,
    sort_order: 0,
  });

  const hasUnsavedChanges = () => {
    if (!showModal) return false;
    return JSON.stringify(formData) !== initialFormDataRef.current;
  };

  const handleModalClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      closeModal();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: '',
      name_az: '',
      category: 'general',
      priority: 'medium',
      life_stage: 'all',
      is_active: true,
      sort_order: 0,
    });
  };

  const openCreateModal = () => {
    const initialData = {
      name: '',
      name_az: '',
      category: 'general',
      priority: 'medium' as const,
      life_stage: 'all',
      is_active: true,
      sort_order: items.length,
    };
    setFormData(initialData);
    initialFormDataRef.current = JSON.stringify(initialData);
    setEditingItem(null);
    setShowModal(true);
  };

  const openEditModal = (item: DefaultShoppingItem) => {
    const data = {
      name: item.name,
      name_az: item.name_az || '',
      category: item.category,
      priority: item.priority,
      life_stage: item.life_stage,
      is_active: item.is_active,
      sort_order: item.sort_order,
    };
    setFormData(data);
    initialFormDataRef.current = JSON.stringify(data);
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Ad daxil edin', variant: 'destructive' });
      return;
    }

    let result;
    if (editingItem) {
      result = await updateItem(editingItem.id, formData);
    } else {
      result = await createItem(formData);
    }

    if (result.error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    } else {
      toast({ title: editingItem ? 'Yeniləndi' : 'Əlavə edildi' });
      closeModal();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    
    const result = await deleteItem(id);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Default Alışveriş Məhsulları
          </h2>
          <p className="text-muted-foreground">
            Platformanın tövsiyə etdiyi məhsullar
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Məhsul
        </Button>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 bg-card rounded-xl border"
          >
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${priorities.find(p => p.value === item.priority)?.color}`} />
              <div>
                <p className="font-medium">{item.name_az || item.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {categories.find(c => c.value === item.category)?.label}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {lifeStages.find(l => l.value === item.life_stage)?.label}
                  </Badge>
                  {!item.is_active && (
                    <Badge variant="secondary" className="text-xs">Deaktiv</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => openEditModal(item)}>
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </motion.div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Heç bir məhsul yoxdur
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Məhsulu Redaktə Et' : 'Yeni Məhsul'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Ad (EN)</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Baby diapers"
              />
            </div>

            <div>
              <Label>Ad (AZ)</Label>
              <Input
                value={formData.name_az}
                onChange={(e) => setFormData({ ...formData, name_az: e.target.value })}
                placeholder="Körpə bezləri"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kateqoriya</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioritet</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Həyat Mərhələsi</Label>
              <Select
                value={formData.life_stage}
                onValueChange={(v) => setFormData({ ...formData, life_stage: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lifeStages.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sıra</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Aktiv</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleModalClose}>
                <X className="w-4 h-4 mr-2" />
                Ləğv et
              </Button>
              <Button className="flex-1" onClick={handleSave}>
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
        onDiscard={closeModal}
      />
    </div>
  );
};

export default AdminDefaultShoppingItems;
