import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Save, X, Loader2, Trophy, Menu, Gift } from 'lucide-react';
import { toast } from 'sonner';

const AdminPartnerConfig = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('achievements');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['admin-partner-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_achievements').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ['admin-partner-menu-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_menu_items').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch surprise categories
  const { data: surpriseCategories = [], isLoading: surpriseLoading } = useQuery({
    queryKey: ['admin-surprise-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('surprise_categories').select('*').order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Generic save mutation
  const saveMutation = useMutation({
    mutationFn: async ({ table, data }: { table: string; data: any }) => {
      if (data.id) {
        const { id, ...rest } = data;
        const { error } = await (supabase.from(table as any) as any).update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from(table as any) as any).insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partner-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['admin-surprise-categories'] });
      queryClient.invalidateQueries({ queryKey: ['partner-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['partner-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['surprise-categories'] });
      setEditingId(null);
      setIsAdding(false);
      toast.success('Yadda saxlanıldı');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ table, id }: { table: string; id: string }) => {
      const { error } = await (supabase.from(table as any) as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-achievements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-partner-menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['admin-surprise-categories'] });
      toast.success('Silindi');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-indigo-500" />
          Partner Konfiqurasiyası
        </h2>
        <p className="text-muted-foreground">Nailiyyətlər, menyu və sürpriz kateqoriyaları</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setIsAdding(false); setEditingId(null); }}>
        <TabsList>
          <TabsTrigger value="achievements">Nailiyyətlər ({achievements.length})</TabsTrigger>
          <TabsTrigger value="menu">Menyu ({menuItems.length})</TabsTrigger>
          <TabsTrigger value="surprises">Sürpriz Növləri ({surpriseCategories.length})</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Nailiyyət
            </Button>
          </div>

          {isAdding && (
            <AchievementForm
              onSave={(data) => saveMutation.mutate({ table: 'partner_achievements', data })}
              onCancel={() => setIsAdding(false)}
              isLoading={saveMutation.isPending}
            />
          )}

          {achievementsLoading ? (
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          ) : (
            <div className="grid gap-3">
              {achievements.map((item: any) => (
                <Card key={item.id} className={!item.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    {editingId === item.id ? (
                      <AchievementForm
                        item={item}
                        onSave={(data) => saveMutation.mutate({ table: 'partner_achievements', data: { ...data, id: item.id } })}
                        onCancel={() => setEditingId(null)}
                        isLoading={saveMutation.isPending}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{item.emoji}</span>
                          <div>
                            <p className="font-semibold">{item.name_az || item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Şərt: {item.unlock_condition} | Hədd: {item.unlock_threshold}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={() => saveMutation.mutate({ table: 'partner_achievements', data: { id: item.id, is_active: !item.is_active } })}
                          />
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(item.id)}>Redaktə</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate({ table: 'partner_achievements', id: item.id })}>
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

        {/* Menu Items Tab */}
        <TabsContent value="menu" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Menyu
            </Button>
          </div>

          {isAdding && (
            <MenuItemForm
              onSave={(data) => saveMutation.mutate({ table: 'partner_menu_items', data })}
              onCancel={() => setIsAdding(false)}
              isLoading={saveMutation.isPending}
            />
          )}

          {menuLoading ? (
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          ) : (
            <div className="grid gap-3">
              {menuItems.map((item: any) => (
                <Card key={item.id} className={!item.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    {editingId === item.id ? (
                      <MenuItemForm
                        item={item}
                        onSave={(data) => saveMutation.mutate({ table: 'partner_menu_items', data: { ...data, id: item.id } })}
                        onCancel={() => setEditingId(null)}
                        isLoading={saveMutation.isPending}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Menu className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">{item.label_az || item.label}</p>
                            <p className="text-xs text-muted-foreground">Route: {item.route} | Icon: {item.icon_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={() => saveMutation.mutate({ table: 'partner_menu_items', data: { id: item.id, is_active: !item.is_active } })}
                          />
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(item.id)}>Redaktə</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate({ table: 'partner_menu_items', id: item.id })}>
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

        {/* Surprise Categories Tab */}
        <TabsContent value="surprises" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Sürpriz Növü
            </Button>
          </div>

          {isAdding && (
            <SurpriseCategoryForm
              onSave={(data) => saveMutation.mutate({ table: 'surprise_categories', data })}
              onCancel={() => setIsAdding(false)}
              isLoading={saveMutation.isPending}
            />
          )}

          {surpriseLoading ? (
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          ) : (
            <div className="grid gap-3">
              {surpriseCategories.map((item: any) => (
                <Card key={item.id} className={!item.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4">
                    {editingId === item.id ? (
                      <SurpriseCategoryForm
                        item={item}
                        onSave={(data) => saveMutation.mutate({ table: 'surprise_categories', data: { ...data, id: item.id } })}
                        onCancel={() => setEditingId(null)}
                        isLoading={saveMutation.isPending}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <div>
                            <p className="font-semibold">{item.label_az || item.label}</p>
                            <p className="text-xs text-muted-foreground">Key: {item.category_key}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={() => saveMutation.mutate({ table: 'surprise_categories', data: { id: item.id, is_active: !item.is_active } })}
                          />
                          <Button variant="ghost" size="sm" onClick={() => setEditingId(item.id)}>Redaktə</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate({ table: 'surprise_categories', id: item.id })}>
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

// Form Components
const AchievementForm = ({ item, onSave, onCancel, isLoading }: any) => {
  const [form, setForm] = useState({
    achievement_key: item?.achievement_key || '',
    name: item?.name || '',
    name_az: item?.name_az || '',
    emoji: item?.emoji || '🏆',
    unlock_condition: item?.unlock_condition || 'always_unlocked',
    unlock_threshold: item?.unlock_threshold || 0,
    sort_order: item?.sort_order || 0,
    is_active: item?.is_active ?? true,
  });

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Key" value={form.achievement_key} onChange={(e) => setForm({ ...form, achievement_key: e.target.value })} />
        <Input placeholder="Emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <Input placeholder="Name (EN)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Name (AZ)" value={form.name_az} onChange={(e) => setForm({ ...form, name_az: e.target.value })} />
        <Input placeholder="Unlock Condition" value={form.unlock_condition} onChange={(e) => setForm({ ...form, unlock_condition: e.target.value })} />
        <Input type="number" placeholder="Threshold" value={form.unlock_threshold} onChange={(e) => setForm({ ...form, unlock_threshold: parseInt(e.target.value) || 0 })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} disabled={isLoading}><Save className="w-4 h-4 mr-2" /> Yadda saxla</Button>
        <Button variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" /> Ləğv et</Button>
      </div>
    </div>
  );
};

const MenuItemForm = ({ item, onSave, onCancel, isLoading }: any) => {
  const [form, setForm] = useState({
    menu_key: item?.menu_key || '',
    label: item?.label || '',
    label_az: item?.label_az || '',
    icon_name: item?.icon_name || 'Settings',
    route: item?.route || '',
    sort_order: item?.sort_order || 0,
    is_active: item?.is_active ?? true,
  });

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Key" value={form.menu_key} onChange={(e) => setForm({ ...form, menu_key: e.target.value })} />
        <Input placeholder="Label (EN)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <Input placeholder="Label (AZ)" value={form.label_az} onChange={(e) => setForm({ ...form, label_az: e.target.value })} />
        <Input placeholder="Icon Name" value={form.icon_name} onChange={(e) => setForm({ ...form, icon_name: e.target.value })} />
        <Input placeholder="Route" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} />
        <Input type="number" placeholder="Sort Order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} disabled={isLoading}><Save className="w-4 h-4 mr-2" /> Yadda saxla</Button>
        <Button variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" /> Ləğv et</Button>
      </div>
    </div>
  );
};

const SurpriseCategoryForm = ({ item, onSave, onCancel, isLoading }: any) => {
  const [form, setForm] = useState({
    category_key: item?.category_key || '',
    label: item?.label || '',
    label_az: item?.label_az || '',
    emoji: item?.emoji || '🎁',
    color_gradient: item?.color_gradient || 'from-pink-500 to-rose-600',
    sort_order: item?.sort_order || 0,
    is_active: item?.is_active ?? true,
  });

  return (
    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Key" value={form.category_key} onChange={(e) => setForm({ ...form, category_key: e.target.value })} />
        <Input placeholder="Emoji" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
        <Input placeholder="Label (EN)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <Input placeholder="Label (AZ)" value={form.label_az} onChange={(e) => setForm({ ...form, label_az: e.target.value })} />
        <Input placeholder="Color Gradient" value={form.color_gradient} onChange={(e) => setForm({ ...form, color_gradient: e.target.value })} />
        <Input type="number" placeholder="Sort Order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} disabled={isLoading}><Save className="w-4 h-4 mr-2" /> Yadda saxla</Button>
        <Button variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" /> Ləğv et</Button>
      </div>
    </div>
  );
};

export default AdminPartnerConfig;
