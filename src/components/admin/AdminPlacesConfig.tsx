import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, X, Loader2, MapPin, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminPlacesConfig = () => {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingAmenity, setEditingAmenity] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState(false);
  const [newAmenity, setNewAmenity] = useState(false);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin-place-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch amenities
  const { data: amenities = [], isLoading: amenitiesLoading } = useQuery({
    queryKey: ['admin-place-amenities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_amenities')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Category mutations
  const saveCategory = useMutation({
    mutationFn: async (category: any) => {
      if (category.id) {
        const { id, ...data } = category;
        const { error } = await supabase.from('place_categories').update(data).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('place_categories').insert([category]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-place-categories'] });
      queryClient.invalidateQueries({ queryKey: ['place-categories'] });
      setEditingCategory(null);
      setNewCategory(false);
      toast.success('Kateqoriya yadda saxlanıldı');
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('place_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-place-categories'] });
      toast.success('Kateqoriya silindi');
    },
  });

  // Amenity mutations
  const saveAmenity = useMutation({
    mutationFn: async (amenity: any) => {
      if (amenity.id) {
        const { id, ...data } = amenity;
        const { error } = await supabase.from('place_amenities').update(data).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('place_amenities').insert([amenity]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-place-amenities'] });
      queryClient.invalidateQueries({ queryKey: ['place-amenities'] });
      setEditingAmenity(null);
      setNewAmenity(false);
      toast.success('İmkan yadda saxlanıldı');
    },
  });

  const deleteAmenity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('place_amenities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-place-amenities'] });
      toast.success('İmkan silindi');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-pink-500" />
          Ana Dostu Məkanlar Konfiqurasiyası
        </h2>
        <p className="text-muted-foreground">Kateqoriyalar və imkanları idarə edin</p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Kateqoriyalar ({categories.length})</TabsTrigger>
          <TabsTrigger value="amenities">İmkanlar ({amenities.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setNewCategory(true)} disabled={newCategory}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Kateqoriya
            </Button>
          </div>

          {newCategory && (
            <CategoryForm
              onSave={(data) => saveCategory.mutate(data)}
              onCancel={() => setNewCategory(false)}
              isLoading={saveCategory.isPending}
            />
          )}

          {categoriesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-3">
              {categories.map((cat: any) => (
                <Card key={cat.id} className={!cat.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    {editingCategory === cat.id ? (
                      <CategoryForm
                        category={cat}
                        onSave={(data) => saveCategory.mutate({ ...data, id: cat.id })}
                        onCancel={() => setEditingCategory(null)}
                        isLoading={saveCategory.isPending}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color_gradient} flex items-center justify-center text-white text-sm font-bold`}>
                            {cat.category_key[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{cat.label_az || cat.label}</p>
                            <p className="text-xs text-muted-foreground">Key: {cat.category_key} | Icon: {cat.icon_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={cat.is_active}
                            onCheckedChange={() => saveCategory.mutate({ id: cat.id, is_active: !cat.is_active })}
                          />
                          <Button variant="ghost" size="sm" onClick={() => setEditingCategory(cat.id)}>
                            Redaktə
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCategory.mutate(cat.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="amenities" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setNewAmenity(true)} disabled={newAmenity}>
              <Plus className="w-4 h-4 mr-2" /> Yeni İmkan
            </Button>
          </div>

          {newAmenity && (
            <AmenityForm
              onSave={(data) => saveAmenity.mutate(data)}
              onCancel={() => setNewAmenity(false)}
              isLoading={saveAmenity.isPending}
            />
          )}

          {amenitiesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-3">
              {amenities.map((amenity: any) => (
                <Card key={amenity.id} className={!amenity.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    {editingAmenity === amenity.id ? (
                      <AmenityForm
                        amenity={amenity}
                        onSave={(data) => saveAmenity.mutate({ ...data, id: amenity.id })}
                        onCancel={() => setEditingAmenity(null)}
                        isLoading={saveAmenity.isPending}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{amenity.emoji}</span>
                          <div>
                            <p className="font-semibold">{amenity.label_az || amenity.label}</p>
                            <p className="text-xs text-muted-foreground">Key: {amenity.amenity_key}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={amenity.is_active}
                            onCheckedChange={() => saveAmenity.mutate({ id: amenity.id, is_active: !amenity.is_active })}
                          />
                          <Button variant="ghost" size="sm" onClick={() => setEditingAmenity(amenity.id)}>
                            Redaktə
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteAmenity.mutate(amenity.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Category Form Component
const CategoryForm = ({ category, onSave, onCancel, isLoading }: any) => {
  const [form, setForm] = useState({
    category_key: category?.category_key || '',
    label: category?.label || '',
    label_az: category?.label_az || '',
    icon_name: category?.icon_name || 'MapPin',
    color_gradient: category?.color_gradient || 'from-pink-500 to-rose-600',
    sort_order: category?.sort_order || 0,
    is_active: category?.is_active ?? true,
  });

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Key" value={form.category_key} onChange={(e) => setForm({ ...form, category_key: e.target.value })} />
        <Input placeholder="Label (EN)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <Input placeholder="Label (AZ)" value={form.label_az} onChange={(e) => setForm({ ...form, label_az: e.target.value })} />
        <Input placeholder="Icon Name" value={form.icon_name} onChange={(e) => setForm({ ...form, icon_name: e.target.value })} />
        <Input placeholder="Color Gradient" value={form.color_gradient} onChange={(e) => setForm({ ...form, color_gradient: e.target.value })} />
        <Input type="number" placeholder="Sort Order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} disabled={isLoading || !form.category_key}>
          <Save className="w-4 h-4 mr-2" /> Yadda saxla
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" /> Ləğv et
        </Button>
      </div>
    </div>
  );
};

// Amenity Form Component
const AmenityForm = ({ amenity, onSave, onCancel, isLoading }: any) => {
  const [form, setForm] = useState({
    amenity_key: amenity?.amenity_key || '',
    label: amenity?.label || '',
    label_az: amenity?.label_az || '',
    emoji: amenity?.emoji || '✅',
    sort_order: amenity?.sort_order || 0,
    is_active: amenity?.is_active ?? true,
  });

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Key (has_...)" value={form.amenity_key} onChange={(e) => setForm({ ...form, amenity_key: e.target.value })} />
        <Input placeholder="Label (EN)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <Input placeholder="Label (AZ)" value={form.label_az} onChange={(e) => setForm({ ...form, label_az: e.target.value })} />
        <Input placeholder="Emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <Input type="number" placeholder="Sort Order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} disabled={isLoading || !form.amenity_key}>
          <Save className="w-4 h-4 mr-2" /> Yadda saxla
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" /> Ləğv et
        </Button>
      </div>
    </div>
  );
};

export default AdminPlacesConfig;
