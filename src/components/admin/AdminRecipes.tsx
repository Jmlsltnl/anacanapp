import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Plus, Pencil, Trash2, Search, Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAdminRecipesAdmin, AdminRecipe } from '@/hooks/useAdminRecipes';
import UnsavedChangesDialog from './UnsavedChangesDialog';

const categories = [
  { id: 'pregnancy', label: 'Hamiləlik' },
  { id: 'postpartum', label: 'Doğuşdan sonra' },
  { id: 'baby', label: 'Körpə' },
  { id: 'general', label: 'Ümumi' },
];

const AdminRecipes = () => {
  const { data: recipes = [], isLoading, create, update, remove } = useAdminRecipesAdmin();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminRecipe | null>(null);
  const [formData, setFormData] = useState<Partial<AdminRecipe>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const initialFormDataRef = useRef<string>('');

  // Check if form has unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(formData) !== initialFormDataRef.current;
  }, [formData]);

  // Handle modal close with unsaved changes check
  const handleModalClose = useCallback((open: boolean) => {
    if (!open && hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      setShowModal(open);
    }
  }, [hasUnsavedChanges]);

  // Force close modal (discard changes)
  const handleDiscardChanges = useCallback(() => {
    setShowModal(false);
    setShowUnsavedDialog(false);
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    const initialData = {
      title: '',
      description: '',
      category: 'pregnancy',
      prep_time: 15,
      cook_time: 30,
      servings: 4,
      ingredients: [],
      instructions: [],
      image_url: '',
      is_active: true,
    };
    setFormData(initialData);
    initialFormDataRef.current = JSON.stringify(initialData);
    setShowModal(true);
  };

  const openEditModal = (item: AdminRecipe) => {
    setEditingItem(item);
    setFormData({ ...item });
    initialFormDataRef.current = JSON.stringify({ ...item });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editingItem) {
      await update.mutateAsync({ id: editingItem.id, ...formData });
    } else {
      await create.mutateAsync(formData);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    await remove.mutateAsync(id);
  };

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reseptlər</h1>
          <p className="text-muted-foreground">Hamiləlik və analıq reseptlərini idarə edin</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Resept
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recipes.length}</p>
              <p className="text-xs text-muted-foreground">Ümumi</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <UtensilsCrossed className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recipes.filter(r => r.is_active).length}</p>
              <p className="text-xs text-muted-foreground">Aktiv</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <UtensilsCrossed className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recipes.filter(r => r.category === 'pregnancy').length}</p>
              <p className="text-xs text-muted-foreground">Hamiləlik</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <UtensilsCrossed className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recipes.filter(r => r.category === 'baby').length}</p>
              <p className="text-xs text-muted-foreground">Körpə</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Resept axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Recipes List */}
      <Card>
        <CardHeader>
          <CardTitle>Reseptlər ({filteredRecipes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Resept tapılmadı</div>
          ) : (
            <div className="space-y-3">
              {filteredRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {recipe.image_url ? (
                      <img src={recipe.image_url} alt={recipe.title} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UtensilsCrossed className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{recipe.title}</p>
                        <Badge variant={recipe.is_active ? 'default' : 'secondary'}>
                          {recipe.is_active ? 'Aktiv' : 'Deaktiv'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{recipe.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {(recipe.prep_time || 0) + (recipe.cook_time || 0)} dəq
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {recipe.servings} porsiya
                        </span>
                        <Badge variant="outline">{categories.find(c => c.id === recipe.category)?.label}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(recipe)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(recipe.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Resept Redaktə Et' : 'Yeni Resept'}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <Input
                placeholder="Başlıq"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Təsvir"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Select
                value={formData.category || 'pregnancy'}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="number"
                  placeholder="Hazırlıq (dəq)"
                  value={formData.prep_time || ''}
                  onChange={(e) => setFormData({ ...formData, prep_time: parseInt(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Bişirmə (dəq)"
                  value={formData.cook_time || ''}
                  onChange={(e) => setFormData({ ...formData, cook_time: parseInt(e.target.value) })}
                />
                <Input
                  type="number"
                  placeholder="Porsiya"
                  value={formData.servings || ''}
                  onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) })}
                />
              </div>
              <Input
                placeholder="Şəkil URL"
                value={formData.image_url || ''}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
              <Textarea
                placeholder="İnqrediyentlər (hər sətirdə bir)"
                value={(formData.ingredients || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value.split('\n').filter(Boolean) })}
                rows={5}
              />
              <Textarea
                placeholder="Təlimatlar (hər sətirdə bir addım)"
                value={(formData.instructions || []).join('\n')}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value.split('\n').filter(Boolean) })}
                rows={5}
              />
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active ?? true}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <span className="text-sm">Aktiv</span>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleModalClose(false)}>
              Ləğv et
            </Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              {editingItem ? 'Yenilə' : 'Əlavə et'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onSave={async () => {
          await handleSave();
          setShowUnsavedDialog(false);
        }}
      />
    </div>
  );
};

export default AdminRecipes;
