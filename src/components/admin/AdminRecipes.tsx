import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Plus, Pencil, Trash2, Search, Clock, Users, FileUp, Download, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAdminRecipesAdmin, AdminRecipe } from '@/hooks/useAdminRecipes';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const categories = [
  { id: 'pregnancy', label: 'Hamiləlik' },
  { id: 'postpartum', label: 'Doğuşdan sonra' },
  { id: 'baby', label: 'Körpə' },
  { id: 'general', label: 'Ümumi' },
];

const AdminRecipes = () => {
  const { toast } = useToast();
  const { data: recipes = [], isLoading, create, update, remove, refetch } = useAdminRecipesAdmin();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminRecipe | null>(null);
  const [formData, setFormData] = useState<Partial<AdminRecipe>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const initialFormDataRef = useRef<string>('');
  
  // CSV Import states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  
  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Xəta', description: 'Yalnız şəkil faylları yüklənə bilər', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Xəta', description: 'Şəkil 5MB-dan böyük ola bilməz', variant: 'destructive' });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `recipe-${Date.now()}.${fileExt}`;
      const filePath = `recipes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: 'Şəkil yükləndi' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: '' });
  };

  // CSV parsing helper
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // CSV Upload Handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({ title: 'Xəta', description: 'CSV faylı boşdur', variant: 'destructive' });
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const headerMap: Record<string, string> = {
        'Başlıq': 'title',
        'Təsvir': 'description',
        'Kateqoriya': 'category',
        'Hazırlıq (dəq)': 'prep_time',
        'Bişirmə (dəq)': 'cook_time',
        'Porsiya': 'servings',
        'İnqredientlər': 'ingredients',
        'Hazırlanma': 'instructions',
        'Şəkil URL': 'image_url',
      };

      const parsedData: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < 2) continue;

        const row: any = { is_active: true };
        
        headers.forEach((header, idx) => {
          const dbField = headerMap[header.trim()];
          if (dbField && values[idx]) {
            let value = values[idx].trim().replace(/^"|"$/g, '');
            
            if (dbField === 'prep_time' || dbField === 'cook_time' || dbField === 'servings') {
              const numValue = parseInt(value);
              row[dbField] = isNaN(numValue) ? 0 : numValue;
            } else if (dbField === 'ingredients' || dbField === 'instructions') {
              const items = value.split(/[;|\n]/).map(s => s.trim()).filter(s => s);
              row[dbField] = items;
            } else {
              row[dbField] = value;
            }
          }
        });

        if (row.title) {
          if (!row.category) row.category = 'general';
          parsedData.push(row);
        }
      }

      if (parsedData.length === 0) {
        toast({ title: 'Xəta', description: 'Heç bir resept tapılmadı', variant: 'destructive' });
        return;
      }

      setImportData(parsedData);
      setShowImportModal(true);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // Import recipes to database
  const handleImport = async () => {
    if (importData.length === 0) return;

    setImporting(true);
    try {
      const { error } = await supabase
        .from('admin_recipes')
        .insert(importData);

      if (error) throw error;

      toast({ 
        title: 'Uğurlu!', 
        description: `${importData.length} resept əlavə edildi` 
      });
      setShowImportModal(false);
      setImportData([]);
      refetch();
    } catch (error: any) {
      toast({ 
        title: 'Xəta', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setImporting(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    window.open('/templates/reseptler_numune.csv', '_blank');
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
        <div className="flex gap-2">
          <input
            type="file"
            ref={csvFileInputRef}
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <Button onClick={downloadTemplate} variant="ghost" size="sm" className="gap-1">
            <Download className="w-4 h-4" />
            Şablon
          </Button>
          <Button onClick={() => csvFileInputRef.current?.click()} variant="outline" className="gap-2">
            <FileUp className="w-4 h-4" />
            CSV İmport
          </Button>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="w-4 h-4" />
            Yeni Resept
          </Button>
        </div>
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
              <div className="space-y-2">
                <Label>Resept şəkli</Label>
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {formData.image_url ? (
                  <div className="relative">
                    <img 
                      src={formData.image_url} 
                      alt="Resept şəkli" 
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-muted-foreground">Yüklənir...</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Şəkil yükləmək üçün klikləyin</span>
                        <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (max 5MB)</span>
                      </>
                    )}
                  </div>
                )}
              </div>
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

      {/* CSV Import Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              CSV İmport - {importData.length} resept tapıldı
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="space-y-2 pr-4">
              {importData.map((recipe, idx) => (
                <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{recipe.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{recipe.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{categories.find(c => c.id === recipe.category)?.label || recipe.category}</Badge>
                      <span>{recipe.prep_time || 0}+{recipe.cook_time || 0} dəq</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportModal(false)}>
              Ləğv et
            </Button>
            <Button onClick={handleImport} disabled={importing} className="gap-2">
              {importing ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileUp className="w-4 h-4" />
              )}
              {importing ? 'Yüklənir...' : `${importData.length} Resept İmport Et`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRecipes;
