import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, ChefHat, Lightbulb, Shield, Baby, Briefcase, Apple, X, Upload, Image, FileUp } from 'lucide-react';
import UnsavedChangesDialog from './UnsavedChangesDialog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BulkTipsImport from './BulkTipsImport';

type ContentType = 'recipes' | 'tips' | 'safety' | 'names' | 'hospital' | 'nutrition';

interface ContentItem {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  category?: string;
  is_active?: boolean;
  image_url?: string;
  [key: string]: any;
}

const AdminContentManager = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ContentType>('recipes');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showNamesImport, setShowNamesImport] = useState(false);
  const [namesImportData, setNamesImportData] = useState<any[]>([]);
  const [namesImporting, setNamesImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const namesFileInputRef = useRef<HTMLInputElement>(null);
  const initialFormDataRef = useRef<string>('');

  const contentConfig = {
    recipes: {
      table: 'admin_recipes',
      title: 'Reseptlər',
      icon: ChefHat,
      fields: ['title', 'description', 'category', 'prep_time', 'cook_time', 'servings', 'ingredients', 'instructions', 'image_url', 'is_active'],
      categories: ['pregnancy', 'breastfeeding', 'baby_food', 'healthy'],
      hasImage: true,
    },
    tips: {
      table: 'weekly_tips',
      title: 'Həftəlik Tövsiyələr',
      icon: Lightbulb,
      fields: ['week_number', 'life_stage', 'title', 'content', 'is_active'],
      categories: ['pregnancy', 'postpartum', 'baby'],
      hasImage: false,
    },
    safety: {
      table: 'safety_items',
      title: 'Təhlükəsizlik',
      icon: Shield,
      fields: ['name', 'name_az', 'category', 'safety_level', 'description', 'description_az', 'is_active'],
      categories: ['food', 'drink', 'activity', 'beauty', 'medicine'],
      hasImage: false,
    },
    names: {
      table: 'baby_names_db',
      title: 'Körpə Adları',
      icon: Baby,
      fields: ['name', 'gender', 'origin', 'meaning', 'meaning_az', 'popularity', 'is_active'],
      categories: ['boy', 'girl', 'unisex'],
      hasImage: false,
    },
    hospital: {
      table: 'hospital_bag_templates',
      title: 'Xəstəxana Çantası',
      icon: Briefcase,
      fields: ['item_name', 'item_name_az', 'category', 'priority', 'notes', 'is_essential', 'sort_order', 'is_active'],
      categories: ['mom', 'baby', 'documents'],
      hasImage: false,
    },
    nutrition: {
      table: 'nutrition_tips',
      title: 'Qidalanma Tövsiyələri',
      icon: Apple,
      fields: ['title', 'content', 'category', 'trimester', 'calories', 'is_active'],
      categories: ['pregnancy', 'breastfeeding', 'baby'],
      hasImage: false,
    },
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `recipe-${Date.now()}.${fileExt}`;
      const filePath = `recipes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      toast({ title: 'Şəkil yükləndi!' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    const config = contentConfig[activeTab];
    
    const { data, error } = await supabase
      .from(config.table as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      setItems((data as unknown as ContentItem[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  // CSV parsing helper for baby names
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

  const handleNamesCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        'Ad': 'name',
        'Cins': 'gender',
        'Mənşə': 'origin',
        'Məna': 'meaning',
        'Məna (AZ)': 'meaning_az',
        'Populyarlıq': 'popularity',
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
            
            if (dbField === 'gender') {
              // Map Azerbaijani gender names to DB values
              const genderMap: Record<string, string> = {
                'Qız': 'girl',
                'Oğlan': 'boy',
                'Unisex': 'unisex',
              };
              value = genderMap[value] || value.toLowerCase();
            } else if (dbField === 'popularity') {
              // Parse popularity percentage to number
              const numValue = parseInt(value.replace('%', ''));
              row[dbField] = isNaN(numValue) ? 50 : numValue;
              return;
            }
            
            row[dbField] = value;
          }
        });

        if (row.name) {
          parsedData.push(row);
        }
      }

      if (parsedData.length === 0) {
        toast({ title: 'Xəta', description: 'Heç bir ad tapılmadı', variant: 'destructive' });
        return;
      }

      setNamesImportData(parsedData);
      setShowNamesImport(true);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleNamesImport = async () => {
    if (namesImportData.length === 0) return;

    setNamesImporting(true);
    try {
      const { error } = await supabase
        .from('baby_names_db')
        .insert(namesImportData);

      if (error) throw error;

      toast({ 
        title: 'Uğurlu!', 
        description: `${namesImportData.length} ad əlavə edildi` 
      });
      setShowNamesImport(false);
      setNamesImportData([]);
      fetchItems();
    } catch (error: any) {
      toast({ 
        title: 'Xəta', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setNamesImporting(false);
    }
  };

  const handleSave = async () => {
    const config = contentConfig[activeTab];
    
    try {
      if (editingItem?.id) {
        const { error } = await supabase
          .from(config.table as any)
          .update(formData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast({ title: 'Uğurlu', description: 'Məlumat yeniləndi' });
      } else {
        const { error } = await supabase
          .from(config.table as any)
          .insert(formData);
        
        if (error) throw error;
        toast({ title: 'Uğurlu', description: 'Yeni məlumat əlavə edildi' });
      }
      
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
      fetchItems();
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Silmək istədiyinizdən əminsiniz?')) return;
    
    const config = contentConfig[activeTab];
    
    const { error } = await supabase
      .from(config.table as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uğurlu', description: 'Məlumat silindi' });
      fetchItems();
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    const initialData = { is_active: true };
    setFormData(initialData);
    initialFormDataRef.current = JSON.stringify(initialData);
    setShowModal(true);
  };

  const openEditModal = (item: ContentItem) => {
    setEditingItem(item);
    setFormData(item);
    initialFormDataRef.current = JSON.stringify(item);
    setShowModal(true);
  };

  const hasUnsavedChanges = () => {
    if (!showModal) return false;
    return JSON.stringify(formData) !== initialFormDataRef.current;
  };

  const handleModalClose = () => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
    }
  };

  const handleDiscardChanges = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const filteredItems = items.filter(item => {
    const searchLower = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(searchLower) ||
      item.name?.toLowerCase().includes(searchLower) ||
      item.item_name?.toLowerCase().includes(searchLower) ||
      item.item_name_az?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.content?.toLowerCase().includes(searchLower)
    );
  });

  const config = contentConfig[activeTab];
  const Icon = config.icon;

  const renderFormField = (field: string) => {
    switch (field) {
      case 'image_url':
        return (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              className="hidden"
            />
            {formData.image_url ? (
              <div className="relative">
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className="w-full h-40 object-cover rounded-xl"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setFormData({ ...formData, image_url: '' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-24 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6" />
                    <span className="text-sm">Şəkil yüklə</span>
                  </div>
                )}
              </Button>
            )}
          </div>
        );
      case 'category':
      case 'life_stage':
      case 'gender':
      case 'safety_level':
        const options = field === 'safety_level' 
          ? ['safe', 'warning', 'danger']
          : field === 'gender'
          ? ['boy', 'girl', 'unisex']
          : config.categories;
        return (
          <Select value={formData[field] || ''} onValueChange={(v) => setFormData({ ...formData, [field]: v })}>
            <SelectTrigger>
              <SelectValue placeholder={`${field} seçin`} />
            </SelectTrigger>
            <SelectContent>
              {options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'priority':
        return (
          <Select value={String(formData[field] || 2)} onValueChange={(v) => setFormData({ ...formData, [field]: parseInt(v) })}>
            <SelectTrigger>
              <SelectValue placeholder="Prioritet seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Yüksək</SelectItem>
              <SelectItem value="2">Orta</SelectItem>
              <SelectItem value="3">Aşağı</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'notes':
        return (
          <Textarea 
            value={formData[field] || ''} 
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            placeholder="Qısa açıqlama və ya məlumat"
            rows={2}
          />
        );
      case 'is_active':
      case 'is_essential':
        return (
          <div className="flex items-center gap-2">
            <Switch 
              checked={formData[field] || false} 
              onCheckedChange={(v) => setFormData({ ...formData, [field]: v })}
            />
            <span className="text-sm">{field === 'is_active' ? 'Aktiv' : 'Vacib'}</span>
          </div>
        );
      case 'description':
      case 'content':
      case 'description_az':
        return (
          <Textarea 
            value={formData[field] || ''} 
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            placeholder={field}
            rows={4}
          />
        );
      case 'week_number':
      case 'prep_time':
      case 'cook_time':
      case 'servings':
      case 'trimester':
      case 'calories':
      case 'popularity':
      case 'sort_order':
        return (
          <Input 
            type="number"
            value={formData[field] || ''} 
            onChange={(e) => setFormData({ ...formData, [field]: parseInt(e.target.value) || 0 })}
            placeholder={field}
          />
        );
      case 'ingredients':
      case 'instructions':
        const arrayValue = Array.isArray(formData[field]) ? formData[field] : [];
        return (
          <div className="space-y-2">
            <Textarea 
              value={arrayValue.join('\n')} 
              onChange={(e) => {
                const lines = e.target.value.split('\n').filter(line => line.trim());
                setFormData({ ...formData, [field]: lines });
              }}
              placeholder={field === 'ingredients' ? 'Hər sətirdə bir inqredient' : 'Hər sətirdə bir addım'}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              {field === 'ingredients' ? 'Hər inqrediyenti yeni sətirdə yazın' : 'Hər addımı yeni sətirdə yazın'}
            </p>
          </div>
        );
      default:
        return (
          <Input 
            value={formData[field] || ''} 
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            placeholder={field}
          />
        );
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      title: 'Başlıq',
      name: 'Ad',
      name_az: 'Ad (AZ)',
      description: 'Təsvir',
      description_az: 'Təsvir (AZ)',
      content: 'Məzmun',
      category: 'Kateqoriya',
      life_stage: 'Həyat Mərhələsi',
      week_number: 'Həftə Nömrəsi',
      gender: 'Cins',
      origin: 'Mənşə',
      meaning: 'Məna',
      meaning_az: 'Məna (AZ)',
      popularity: 'Populyarlıq',
      safety_level: 'Təhlükəsizlik Səviyyəsi',
      item_name: 'Element Adı',
      item_name_az: 'Element Adı (AZ)',
      is_essential: 'Vacib',
      sort_order: 'Sıralama',
      priority: 'Prioritet',
      notes: 'Qeyd',
      prep_time: 'Hazırlıq Vaxtı (dəq)',
      cook_time: 'Bişirmə Vaxtı (dəq)',
      servings: 'Porsiya',
      trimester: 'Trimester',
      calories: 'Kalori',
      is_active: 'Aktiv',
      image_url: 'Şəkil',
      ingredients: 'İnqredientlər',
      instructions: 'Hazırlanma Qaydası',
    };
    return labels[field] || field;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Kontent İdarəetməsi</h1>
        </div>
        <div className="flex gap-2">
          {activeTab === 'tips' && (
            <Button onClick={() => setShowBulkImport(true)} variant="outline" className="gap-2">
              <FileUp className="w-4 h-4" />
              Toplu İmport
            </Button>
          )}
          {activeTab === 'names' && (
            <>
              <input
                type="file"
                ref={namesFileInputRef}
                accept=".csv"
                onChange={handleNamesCSVUpload}
                className="hidden"
              />
              <Button onClick={() => namesFileInputRef.current?.click()} variant="outline" className="gap-2">
                <FileUp className="w-4 h-4" />
                CSV İmport
              </Button>
            </>
          )}
          <Button onClick={openCreateModal} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Əlavə Et
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentType)}>
        <TabsList className="grid grid-cols-6 w-full mb-6">
          <TabsTrigger value="recipes" className="flex items-center gap-1">
            <ChefHat className="w-4 h-4" />
            <span className="hidden md:inline">Reseptlər</span>
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center gap-1">
            <Lightbulb className="w-4 h-4" />
            <span className="hidden md:inline">Tövsiyələr</span>
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            <span className="hidden md:inline">Təhlükəsizlik</span>
          </TabsTrigger>
          <TabsTrigger value="names" className="flex items-center gap-1">
            <Baby className="w-4 h-4" />
            <span className="hidden md:inline">Adlar</span>
          </TabsTrigger>
          <TabsTrigger value="hospital" className="flex items-center gap-1">
            <Briefcase className="w-4 h-4" />
            <span className="hidden md:inline">Çanta</span>
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-1">
            <Apple className="w-4 h-4" />
            <span className="hidden md:inline">Qidalanma</span>
          </TabsTrigger>
        </TabsList>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Axtar..."
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Heç bir məlumat tapılmadı</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-4 border border-border flex items-center gap-4"
                >
                  {/* Show image if available (for recipes) */}
                  {item.image_url ? (
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image_url} 
                        alt={item.title || 'Şəkil'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.title || item.name || item.item_name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.description || item.content || item.meaning || item.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.is_active ? 'Aktiv' : 'Deaktiv'}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </Tabs>

      {/* Edit/Create Modal */}
      <Dialog open={showModal} onOpenChange={(open) => {
        if (!open) handleModalClose();
        else setShowModal(open);
      }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Redaktə et' : 'Yeni əlavə et'} - {config.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {config.fields.map(field => (
              <div key={field} className="space-y-2">
                <label className="text-sm font-medium">{getFieldLabel(field)}</label>
                {renderFormField(field)}
              </div>
            ))}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleModalClose} className="flex-1">
                Ləğv et
              </Button>
              <Button onClick={handleSave} className="flex-1 gradient-primary">
                Yadda saxla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Tips Import Modal */}
      <BulkTipsImport
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={fetchItems}
      />

      {/* Baby Names CSV Import Modal */}
      <Dialog open={showNamesImport} onOpenChange={setShowNamesImport}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-primary" />
              CSV İmport - {namesImportData.length} ad tapıldı
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-3 py-4">
            {namesImportData.slice(0, 20).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <span className={`text-lg ${item.gender === 'girl' ? 'text-pink-500' : item.gender === 'boy' ? 'text-blue-500' : 'text-purple-500'}`}>
                  {item.gender === 'girl' ? '👧' : item.gender === 'boy' ? '👦' : '👶'}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.origin && `${item.origin} • `}
                    {item.meaning_az || item.meaning}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {item.popularity}%
                  </span>
                </div>
              </div>
            ))}
            {namesImportData.length > 20 && (
              <p className="text-center text-sm text-muted-foreground py-2">
                və daha {namesImportData.length - 20} ad...
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => { setShowNamesImport(false); setNamesImportData([]); }} 
              className="flex-1"
              disabled={namesImporting}
            >
              Ləğv et
            </Button>
            <Button 
              onClick={handleNamesImport} 
              className="flex-1 gradient-primary"
              disabled={namesImporting}
            >
              {namesImporting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                `${namesImportData.length} Ad Əlavə Et`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
      />
    </div>
  );
};

export default AdminContentManager;
