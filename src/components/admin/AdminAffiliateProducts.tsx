import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Save, X, ExternalLink, Package } from 'lucide-react';
import { useAppSetting, useUpdateAppSetting } from '@/hooks/useAppSettings';

const AdminAffiliateProducts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Section enabled toggle
  const sectionEnabled = useAppSetting('affiliate_section_enabled') !== false;
  const updateSetting = useUpdateAppSetting();
  
  const [formData, setFormData] = useState({
    name: '', name_az: '', description: '', description_az: '',
    category: 'general', category_az: '', price: '', original_price: '',
    currency: 'AZN', affiliate_url: '', platform: 'other', image_url: '',
    rating: '', review_count: '', review_summary_az: '',
    life_stages: ['bump'], is_featured: false, is_active: true
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
        rating: data.rating ? parseFloat(data.rating) : 0,
        review_count: data.review_count ? parseInt(data.review_count) : 0,
        review_summary_az: data.review_summary_az || null,
        life_stages: data.life_stages,
        is_featured: data.is_featured,
        is_active: data.is_active,
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

  const resetForm = () => {
    setFormData({
      name: '', name_az: '', description: '', description_az: '',
      category: 'general', category_az: '', price: '', original_price: '',
      currency: 'AZN', affiliate_url: '', platform: 'other', image_url: '',
      rating: '', review_count: '', review_summary_az: '',
      life_stages: ['bump'], is_featured: false, is_active: true
    });
    setEditingId(null);
    setShowAddForm(false);
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
      rating: product.rating?.toString() || '',
      review_count: product.review_count?.toString() || '',
      review_summary_az: product.review_summary_az || '',
      life_stages: product.life_stages || ['bump'],
      is_featured: product.is_featured || false,
      is_active: product.is_active !== false,
    });
    setEditingId(product.id);
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Affiliate Məhsulları</h2>
          <p className="text-sm text-muted-foreground">Tövsiyyə olunan məhsulları idarə edin</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Bölmə aktiv:</span>
            <Switch 
              checked={sectionEnabled}
              onCheckedChange={(checked) => updateSetting.mutate({ key: 'affiliate_section_enabled', value: checked })}
            />
          </div>
          <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
            <Plus className="w-4 h-4 mr-2" /> Əlavə et
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">{editingId ? 'Redaktə et' : 'Yeni məhsul'}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Ad (EN)" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Ad (AZ)" value={formData.name_az} onChange={(e) => setFormData(p => ({ ...p, name_az: e.target.value }))} />
            <Input placeholder="Affiliate URL *" value={formData.affiliate_url} onChange={(e) => setFormData(p => ({ ...p, affiliate_url: e.target.value }))} className="col-span-2" />
            <Input placeholder="Şəkil URL" value={formData.image_url} onChange={(e) => setFormData(p => ({ ...p, image_url: e.target.value }))} className="col-span-2" />
            
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
              <option value="general">Ümumi</option>
            </select>
            
            <Input type="number" placeholder="Qiymət" value={formData.price} onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))} />
            <Input type="number" placeholder="Köhnə qiymət" value={formData.original_price} onChange={(e) => setFormData(p => ({ ...p, original_price: e.target.value }))} />
            <Input type="number" placeholder="Reytinq (0-5)" value={formData.rating} onChange={(e) => setFormData(p => ({ ...p, rating: e.target.value }))} />
            <Input type="number" placeholder="Rəy sayı" value={formData.review_count} onChange={(e) => setFormData(p => ({ ...p, review_count: e.target.value }))} />
            
            <Textarea placeholder="Rəy xülasəsi (AZ)" value={formData.review_summary_az} onChange={(e) => setFormData(p => ({ ...p, review_summary_az: e.target.value }))} className="col-span-2" />
          </div>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><Switch checked={formData.is_featured} onCheckedChange={(c) => setFormData(p => ({ ...p, is_featured: c }))} /> Tövsiyyə olunan</label>
            <label className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(c) => setFormData(p => ({ ...p, is_active: c }))} /> Aktiv</label>
          </div>
          
          <Button onClick={() => saveMutation.mutate({ ...formData, id: editingId || undefined })} disabled={!formData.name || !formData.affiliate_url}>
            <Save className="w-4 h-4 mr-2" /> Yadda saxla
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {products.map((product: any) => (
          <div key={product.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
            <div className="flex items-center gap-3">
              {product.image_url ? (
                <img src={product.image_url} alt="" className="w-12 h-12 rounded object-cover" />
              ) : (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{product.name_az || product.name}</span>
                  {product.is_featured && <Badge className="text-[10px]">⭐</Badge>}
                  {!product.is_active && <Badge variant="secondary" className="text-[10px]">Deaktiv</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">{product.platform} • {product.price} {product.currency}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" onClick={() => window.open(product.affiliate_url, '_blank')}><ExternalLink className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => handleEdit(product)}><Edit className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(product.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAffiliateProducts;
