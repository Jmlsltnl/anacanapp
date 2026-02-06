import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Save, X, ExternalLink, Package, Image, Video, Star, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useAppSetting, useUpdateAppSetting } from '@/hooks/useAppSettings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// CSV Template headers
const CSV_HEADERS = [
  'name*', 'name_az*', 'affiliate_url*', 'category', 'platform', 'price', 'original_price', 
  'currency', 'image_url', 'images', 'video_url', 'store_name', 'store_logo_url', 
  'description', 'description_az', 'rating', 'review_count', 'review_summary_az',
  'life_stages', 'is_featured', 'is_active', 'pros', 'cons', 'tags', 'specifications'
];

const CSV_TEMPLATE = `name*,name_az*,affiliate_url*,category,platform,price,original_price,currency,image_url,images,video_url,store_name,store_logo_url,description,description_az,rating,review_count,review_summary_az,life_stages,is_featured,is_active,pros,cons,tags,specifications
Baby Stroller,Uşaq arabası,https://example.com/product1,baby_gear,trendyol,199.99,249.99,AZN,https://example.com/img.jpg,"https://img1.jpg|https://img2.jpg",,Trendyol,,High quality stroller,Yüksək keyfiyyətli araba,4.5,120,Əla məhsuldur,bump|mommy,true,true,"Rahat|Möhkəm","Ağır",körpə|araba,"{""Çəki"":""8kg"",""Rəng"":""Qara""}"`;

const parseCSV = (text: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace('*', ''));
  const products = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const product: Record<string, any> = {};
    headers.forEach((header, index) => {
      const value = values[index] || '';
      product[header] = value;
    });
    products.push(product);
  }
  
  return products;
};

const AdminAffiliateProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Section enabled toggle
  const sectionEnabled = useAppSetting('affiliate_section_enabled') !== false;
  const updateSetting = useUpdateAppSetting();
  
  const [formData, setFormData] = useState({
    name: '', name_az: '', description: '', description_az: '',
    category: 'general', category_az: '', price: '', original_price: '',
    currency: 'AZN', affiliate_url: '', platform: 'other', 
    image_url: '', images: '', video_url: '',
    store_name: '', store_logo_url: '',
    rating: '', review_count: '', review_summary_az: '',
    life_stages: ['bump'], is_featured: false, is_active: true,
    pros: '', cons: '', tags: '', specifications: ''
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-affiliate-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_products')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      // Parse arrays and JSON
      const imagesArray = data.images ? data.images.split('\n').filter(Boolean) : [];
      const prosArray = data.pros ? data.pros.split('\n').filter(Boolean) : [];
      const consArray = data.cons ? data.cons.split('\n').filter(Boolean) : [];
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      
      let specsObj = {};
      if (data.specifications) {
        try {
          specsObj = JSON.parse(data.specifications);
        } catch {
          // Try to parse as key:value lines
          data.specifications.split('\n').forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) (specsObj as Record<string, string>)[key] = value;
          });
        }
      }

      const payload = {
        name: data.name,
        name_az: data.name_az || null,
        description: data.description || null,
        description_az: data.description_az || null,
        category: data.category,
        category_az: data.category_az || null,
        price: data.price ? parseFloat(data.price) : null,
        original_price: data.original_price ? parseFloat(data.original_price) : null,
        currency: data.currency,
        affiliate_url: data.affiliate_url,
        platform: data.platform,
        image_url: data.image_url || null,
        images: imagesArray,
        video_url: data.video_url || null,
        store_name: data.store_name || null,
        store_logo_url: data.store_logo_url || null,
        rating: data.rating ? parseFloat(data.rating) : 0,
        review_count: data.review_count ? parseInt(data.review_count) : 0,
        review_summary_az: data.review_summary_az || null,
        life_stages: data.life_stages,
        is_featured: data.is_featured,
        is_active: data.is_active,
        pros: prosArray.length > 0 ? prosArray : null,
        cons: consArray.length > 0 ? consArray : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        specifications: Object.keys(specsObj).length > 0 ? specsObj : {},
        price_updated_at: new Date().toISOString(),
      };

      if (data.id) {
        const { error } = await supabase.from('affiliate_products').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('affiliate_products').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-products'] });
      resetForm();
      toast({ title: 'Yadda saxlanıldı' });
    },
    onError: (err) => {
      toast({ title: 'Xəta', description: String(err), variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('affiliate_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-products'] });
      toast({ title: 'Silindi' });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (products: Record<string, any>[]) => {
      const errors: string[] = [];
      let successCount = 0;
      
      for (const product of products) {
        try {
          if (!product.name || !product.affiliate_url) {
            errors.push(`Sətir atlandı: name və ya affiliate_url yoxdur`);
            continue;
          }

          const payload = {
            name: product.name,
            name_az: product.name_az || null,
            description: product.description || null,
            description_az: product.description_az || null,
            category: product.category || 'general',
            category_az: product.category_az || null,
            price: product.price ? parseFloat(product.price) : null,
            original_price: product.original_price ? parseFloat(product.original_price) : null,
            currency: product.currency || 'AZN',
            affiliate_url: product.affiliate_url,
            platform: product.platform || 'other',
            image_url: product.image_url || null,
            images: product.images ? product.images.split('|').filter(Boolean) : [],
            video_url: product.video_url || null,
            store_name: product.store_name || null,
            store_logo_url: product.store_logo_url || null,
            rating: product.rating ? parseFloat(product.rating) : 0,
            review_count: product.review_count ? parseInt(product.review_count) : 0,
            review_summary_az: product.review_summary_az || null,
            life_stages: product.life_stages ? product.life_stages.split('|').filter(Boolean) : ['bump'],
            is_featured: product.is_featured === 'true' || product.is_featured === true,
            is_active: product.is_active !== 'false' && product.is_active !== false,
            pros: product.pros ? product.pros.split('|').filter(Boolean) : null,
            cons: product.cons ? product.cons.split('|').filter(Boolean) : null,
            tags: product.tags ? product.tags.split('|').filter(Boolean) : null,
            specifications: product.specifications ? JSON.parse(product.specifications) : {},
            price_updated_at: new Date().toISOString(),
          };

          const { error } = await supabase.from('affiliate_products').insert(payload);
          if (error) throw error;
          successCount++;
        } catch (e: any) {
          errors.push(`"${product.name || 'Unknown'}": ${e.message}`);
        }
      }
      
      return { successCount, errors };
    },
    onSuccess: ({ successCount, errors }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-affiliate-products'] });
      setImporting(false);
      if (errors.length > 0) {
        toast({ 
          title: `${successCount} məhsul əlavə edildi`, 
          description: `${errors.length} xəta: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
          variant: errors.length > successCount ? 'destructive' : 'default'
        });
      } else {
        toast({ title: `${successCount} məhsul uğurla əlavə edildi` });
      }
    },
    onError: (err) => {
      setImporting(false);
      toast({ title: 'İmport xətası', description: String(err), variant: 'destructive' });
    },
  });

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const products = parseCSV(text);
      
      if (products.length === 0) {
        setImporting(false);
        toast({ title: 'CSV boşdur və ya formatı səhvdir', variant: 'destructive' });
        return;
      }
      
      bulkImportMutation.mutate(products);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const downloadCSVTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'affiliate_products_template.csv';
    link.click();
  };

  const resetForm = () => {
    setFormData({
      name: '', name_az: '', description: '', description_az: '',
      category: 'general', category_az: '', price: '', original_price: '',
      currency: 'AZN', affiliate_url: '', platform: 'other',
      image_url: '', images: '', video_url: '',
      store_name: '', store_logo_url: '',
      rating: '', review_count: '', review_summary_az: '',
      life_stages: ['bump'], is_featured: false, is_active: true,
      pros: '', cons: '', tags: '', specifications: ''
    });
    setEditingId(null);
    setShowAddForm(false);
    setActiveTab('basic');
  };

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name || '',
      name_az: product.name_az || '',
      description: product.description || '',
      description_az: product.description_az || '',
      category: product.category || 'general',
      category_az: product.category_az || '',
      price: product.price?.toString() || '',
      original_price: product.original_price?.toString() || '',
      currency: product.currency || 'AZN',
      affiliate_url: product.affiliate_url || '',
      platform: product.platform || 'other',
      image_url: product.image_url || '',
      images: (product.images || []).join('\n'),
      video_url: product.video_url || '',
      store_name: product.store_name || '',
      store_logo_url: product.store_logo_url || '',
      rating: product.rating?.toString() || '',
      review_count: product.review_count?.toString() || '',
      review_summary_az: product.review_summary_az || '',
      life_stages: product.life_stages || ['bump'],
      is_featured: product.is_featured || false,
      is_active: product.is_active !== false,
      pros: (product.pros || []).join('\n'),
      cons: (product.cons || []).join('\n'),
      tags: (product.tags || []).join(', '),
      specifications: product.specifications ? JSON.stringify(product.specifications, null, 2) : '',
    });
    setEditingId(product.id);
    setShowAddForm(true);
  };

  const toggleLifeStage = (stage: string) => {
    setFormData(prev => ({
      ...prev,
      life_stages: prev.life_stages.includes(stage)
        ? prev.life_stages.filter(s => s !== stage)
        : [...prev.life_stages, stage]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Affiliate Məhsulları</h2>
          <p className="text-sm text-muted-foreground">Tövsiyyə olunan məhsulları tam idarə edin</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm">Bölmə aktiv:</span>
            <Switch 
              checked={sectionEnabled}
              onCheckedChange={(checked) => updateSetting.mutate({ key: 'affiliate_section_enabled', value: checked })}
            />
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
            />
            <Button variant="outline" onClick={downloadCSVTemplate}>
              <Download className="w-4 h-4 mr-2" /> CSV Şablon
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload className="w-4 h-4 mr-2" /> {importing ? 'Yüklənir...' : 'CSV İmport'}
            </Button>
            <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
              <Plus className="w-4 h-4 mr-2" /> Əlavə et
            </Button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{editingId ? 'Redaktə et' : 'Yeni məhsul'}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Əsas</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="details">Detallar</TabsTrigger>
              <TabsTrigger value="reviews">Rəylər</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Ad (EN)" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Ad (AZ) *" value={formData.name_az} onChange={(e) => setFormData(p => ({ ...p, name_az: e.target.value }))} />
                <Input placeholder="Affiliate URL *" value={formData.affiliate_url} onChange={(e) => setFormData(p => ({ ...p, affiliate_url: e.target.value }))} className="col-span-2" />
                
                <select value={formData.platform} onChange={(e) => setFormData(p => ({ ...p, platform: e.target.value }))} className="h-10 rounded-md border bg-background px-3">
                  <option value="trendyol">Trendyol</option>
                  <option value="amazon">Amazon</option>
                  <option value="aliexpress">AliExpress</option>
                  <option value="other">Digər</option>
                </select>
                
                <select value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} className="h-10 rounded-md border bg-background px-3">
                  <option value="baby_gear">Körpə əşyaları</option>
                  <option value="maternity">Hamiləlik geyimləri</option>
                  <option value="health">Sağlamlıq</option>
                  <option value="nutrition">Qidalanma</option>
                  <option value="skincare">Dəri qulluğu</option>
                  <option value="general">Ümumi</option>
                </select>

                <Input placeholder="Mağaza adı" value={formData.store_name} onChange={(e) => setFormData(p => ({ ...p, store_name: e.target.value }))} />
                <Input placeholder="Mağaza logo URL" value={formData.store_logo_url} onChange={(e) => setFormData(p => ({ ...p, store_logo_url: e.target.value }))} />
                
                <Input type="number" placeholder="Qiymət" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))} />
                <Input type="number" placeholder="Köhnə qiymət (endirim)" value={formData.original_price} onChange={(e) => setFormData(p => ({ ...p, original_price: e.target.value }))} />
                
                <select value={formData.currency} onChange={(e) => setFormData(p => ({ ...p, currency: e.target.value }))} className="h-10 rounded-md border bg-background px-3">
                  <option value="AZN">AZN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="TRY">TRY</option>
                </select>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">Life stages:</span>
                  {['flow', 'bump', 'mommy'].map(stage => (
                    <Badge 
                      key={stage}
                      variant={formData.life_stages.includes(stage) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleLifeStage(stage)}
                    >
                      {stage}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Textarea placeholder="Təsvir (AZ)" value={formData.description_az} onChange={(e) => setFormData(p => ({ ...p, description_az: e.target.value }))} rows={3} />
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Əsas şəkil URL</label>
                  <Input placeholder="https://..." value={formData.image_url} onChange={(e) => setFormData(p => ({ ...p, image_url: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Əlavə şəkillər (hər sətirdə bir URL)</label>
                  <Textarea placeholder="https://image1.jpg&#10;https://image2.jpg" value={formData.images} onChange={(e) => setFormData(p => ({ ...p, images: e.target.value }))} rows={4} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Video URL</label>
                  <Input placeholder="https://video.mp4" value={formData.video_url} onChange={(e) => setFormData(p => ({ ...p, video_url: e.target.value }))} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Üstünlükləri (hər sətirdə bir)</label>
                  <Textarea placeholder="Keyfiyyətli material&#10;Uzunömürlü" value={formData.pros} onChange={(e) => setFormData(p => ({ ...p, pros: e.target.value }))} rows={4} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Çatışmazlıqları (hər sətirdə bir)</label>
                  <Textarea placeholder="Bahalıdır&#10;Çatdırılma uzun çəkir" value={formData.cons} onChange={(e) => setFormData(p => ({ ...p, cons: e.target.value }))} rows={4} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Teqlər (vergüllə ayırın)</label>
                <Input placeholder="hamiləlik, körpə, yeni" value={formData.tags} onChange={(e) => setFormData(p => ({ ...p, tags: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Xüsusiyyətlər (JSON və ya key:value)</label>
                <Textarea placeholder='{"Çəki": "500g", "Rəng": "Ağ"}' value={formData.specifications} onChange={(e) => setFormData(p => ({ ...p, specifications: e.target.value }))} rows={4} />
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input type="number" placeholder="Reytinq (0-5)" value={formData.rating} onChange={(e) => setFormData(p => ({ ...p, rating: e.target.value }))} step="0.1" max="5" min="0" />
                <Input type="number" placeholder="Rəy sayı" value={formData.review_count} onChange={(e) => setFormData(p => ({ ...p, review_count: e.target.value }))} />
              </div>
              <Textarea placeholder="Rəy xülasəsi (AZ)" value={formData.review_summary_az} onChange={(e) => setFormData(p => ({ ...p, review_summary_az: e.target.value }))} rows={3} />
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-4 pt-4 border-t">
            <label className="flex items-center gap-2">
              <Switch checked={formData.is_featured} onCheckedChange={(c) => setFormData(p => ({ ...p, is_featured: c }))} /> 
              <Star className="w-4 h-4 text-amber-500" />
              Tövsiyyə olunan
            </label>
            <label className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData(p => ({ ...p, is_active: c }))} /> 
              Aktiv
            </label>
          </div>
          
          <Button 
            onClick={() => saveMutation.mutate({ ...formData, id: editingId || undefined })} 
            disabled={!formData.name_az || !formData.affiliate_url || saveMutation.isPending}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" /> {saveMutation.isPending ? 'Saxlanılır...' : 'Yadda saxla'}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <p className="text-muted-foreground">Yüklənir...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Hələ heç bir məhsul yoxdur</p>
          </div>
        ) : (
          products.map((product: any) => (
            <div key={product.id} className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.name_az || product.name}</span>
                    {product.is_featured && <Badge className="text-[10px] bg-amber-500/10 text-amber-600">⭐</Badge>}
                    {!product.is_active && <Badge variant="secondary" className="text-[10px]">Deaktiv</Badge>}
                    {(product.images?.length > 0 || product.video_url) && (
                      <div className="flex gap-1">
                        {product.images?.length > 0 && <Image className="w-3 h-3 text-muted-foreground" />}
                        {product.video_url && <Video className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {product.store_name || product.platform} • {product.price ? `${product.price} ${product.currency}` : 'Qiymət yoxdur'}
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-red-500 ml-2">(-{Math.round((1 - product.price/product.original_price) * 100)}%)</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => window.open(product.affiliate_url, '_blank')}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleEdit(product)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(product.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminAffiliateProducts;
