import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, Loader2 } from 'lucide-react';

interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'color' | 'boolean';
}

interface ConfigTableProps {
  tableName: string;
  title: string;
  columns: ColumnConfig[];
  defaultValues: Record<string, any>;
}

function ConfigTable({ tableName, title, columns, defaultValues }: ConfigTableProps) {
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<Record<string, any> | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>(defaultValues);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: [tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Record<string, any>[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (item: Record<string, any>) => {
      if (editItem) {
        const { error } = await supabase.from(tableName as any).update(item).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from(tableName as any).insert(item);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
      toast.success(editItem ? 'Yeniləndi' : 'Əlavə edildi');
      setIsDialogOpen(false);
      setEditItem(null);
      setFormData(defaultValues);
    },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tableName] });
      toast.success('Silindi');
    },
    onError: () => toast.error('Xəta baş verdi'),
  });

  const openEdit = (item: Record<string, any>) => {
    setEditItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditItem(null);
    setFormData(defaultValues);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> Əlavə et
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Redaktə et' : 'Yeni əlavə et'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {columns.map((col) => (
                <div key={col.key} className="space-y-2">
                  <Label>{col.label}</Label>
                  {col.type === 'boolean' ? (
                    <Switch
                      checked={!!formData[col.key]}
                      onCheckedChange={(v) => setFormData({ ...formData, [col.key]: v })}
                    />
                  ) : col.type === 'color' ? (
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={formData[col.key] as string || '#000000'}
                        onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={formData[col.key] as string || ''}
                        onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                        placeholder="#RRGGBB"
                      />
                    </div>
                  ) : (
                    <Input
                      type={col.type === 'number' ? 'number' : 'text'}
                      value={formData[col.key] ?? ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        [col.key]: col.type === 'number' ? Number(e.target.value) : e.target.value 
                      })}
                    />
                  )}
                </div>
              ))}
              <Button 
                onClick={() => saveMutation.mutate(formData)} 
                className="w-full"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Saxla
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.slice(0, 4).map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-24">Əməliyyatlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                {columns.slice(0, 4).map((col) => (
                  <TableCell key={col.key}>
                    {col.type === 'color' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: item[col.key] as string }} />
                        <span className="text-xs">{item[col.key]}</span>
                      </div>
                    ) : col.type === 'boolean' ? (
                      item[col.key] ? '✓' : '✗'
                    ) : (
                      String(item[col.key] ?? '')
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

const AdminToolsConfig = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alət Konfiqurasiyaları</h1>
        <p className="text-muted-foreground">Alətlər üçün label, emoji, rəng və digər konfiqurasiyaları idarə edin</p>
      </div>

      <Tabs defaultValue="cry" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="cry" className="text-xs py-2 px-3">Ağlama</TabsTrigger>
          <TabsTrigger value="poop" className="text-xs py-2 px-3">Nəcis</TabsTrigger>
          <TabsTrigger value="market" className="text-xs py-2 px-3">Bazar</TabsTrigger>
          <TabsTrigger value="providers" className="text-xs py-2 px-3">Həkim</TabsTrigger>
          <TabsTrigger value="horoscope" className="text-xs py-2 px-3">Bürclər</TabsTrigger>
          <TabsTrigger value="weather" className="text-xs py-2 px-3">Hava</TabsTrigger>
        </TabsList>

        <TabsContent value="cry" className="space-y-4">
          <ConfigTable
            tableName="cry_type_labels"
            title="Ağlama Tipləri"
            columns={[
              { key: 'cry_type', label: 'Tip Kodu' },
              { key: 'label_az', label: 'Azərbaycanca' },
              { key: 'emoji', label: 'Emoji' },
              { key: 'color', label: 'Rəng', type: 'color' },
              { key: 'description_az', label: 'Təsvir' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ cry_type: '', label_az: '', emoji: '😢', color: '#EF4444', sort_order: 0 }}
          />
        </TabsContent>

        <TabsContent value="poop" className="space-y-4">
          <ConfigTable
            tableName="poop_color_labels"
            title="Nəcis Rəngləri"
            columns={[
              { key: 'color_key', label: 'Rəng Kodu' },
              { key: 'label_az', label: 'Azərbaycanca' },
              { key: 'emoji', label: 'Emoji' },
              { key: 'hex_color', label: 'HEX Rəng', type: 'color' },
              { key: 'status', label: 'Status' },
              { key: 'description_az', label: 'Təsvir' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ color_key: '', label_az: '', emoji: '💩', hex_color: '#8B4513', status: 'normal', sort_order: 0 }}
          />
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <ConfigTable
            tableName="marketplace_categories"
            title="Bazar Kateqoriyaları"
            columns={[
              { key: 'category_key', label: 'Kateqoriya Kodu' },
              { key: 'label_az', label: 'Azərbaycanca' },
              { key: 'emoji', label: 'Emoji' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ category_key: '', label_az: '', emoji: '📦', sort_order: 0 }}
          />

          <ConfigTable
            tableName="product_conditions"
            title="Məhsul Vəziyyətləri"
            columns={[
              { key: 'condition_key', label: 'Vəziyyət Kodu' },
              { key: 'label_az', label: 'Azərbaycanca' },
              { key: 'emoji', label: 'Emoji' },
              { key: 'color', label: 'Rəng', type: 'color' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ condition_key: '', label_az: '', emoji: '✨', color: '#22C55E', sort_order: 0 }}
          />

          <ConfigTable
            tableName="age_ranges"
            title="Yaş Aralıqları"
            columns={[
              { key: 'range_key', label: 'Aralıq Kodu' },
              { key: 'label_az', label: 'Azərbaycanca' },
              { key: 'min_months', label: 'Min Ay', type: 'number' },
              { key: 'max_months', label: 'Max Ay', type: 'number' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ range_key: '', label_az: '', min_months: 0, max_months: 12, sort_order: 0 }}
          />
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <ConfigTable
            tableName="provider_types"
            title="Provayder Tipləri"
            columns={[
              { key: 'type_key', label: 'Tip Kodu' },
              { key: 'label_az', label: 'Azərbaycanca' },
              { key: 'emoji', label: 'Emoji' },
              { key: 'color', label: 'Rəng', type: 'color' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ type_key: '', label_az: '', emoji: '🏥', color: '#3B82F6', sort_order: 0 }}
          />

          <ConfigTable
            tableName="day_labels"
            title="Gün Adları"
            columns={[
              { key: 'day_key', label: 'Gün Kodu' },
              { key: 'label_az', label: 'Tam Ad' },
              { key: 'short_label_az', label: 'Qısa Ad' },
              { key: 'day_number', label: 'Gün Nömrəsi', type: 'number' },
            ]}
            defaultValues={{ day_key: '', label_az: '', short_label_az: '', day_number: 0 }}
          />
        </TabsContent>

        <TabsContent value="horoscope" className="space-y-4">
          <ConfigTable
            tableName="horoscope_elements"
            title="Element Konfiqurasiyası"
            columns={[
              { key: 'element_key', label: 'Element Kodu' },
              { key: 'name_az', label: 'Azərbaycanca' },
              { key: 'icon', label: 'İkon' },
              { key: 'color', label: 'Rəng', type: 'color' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ element_key: '', name_az: '', icon: 'Sparkles', color: '#8B5CF6', sort_order: 0 }}
          />

          <ConfigTable
            tableName="horoscope_loading_steps"
            title="Yüklənmə Addımları"
            columns={[
              { key: 'step_key', label: 'Addım Kodu' },
              { key: 'label_az', label: 'Azərbaycanca Mətn' },
              { key: 'icon', label: 'İkon' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ step_key: '', label_az: '', icon: 'Star', sort_order: 0 }}
          />

          <ConfigTable
            tableName="time_options"
            title="Vaxt Seçimləri"
            columns={[
              { key: 'option_key', label: 'Seçim Kodu' },
              { key: 'label_az', label: 'Azərbaycanca' },
              { key: 'hour_value', label: 'Saat Dəyəri', type: 'number' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ option_key: '', label_az: '', hour_value: 12, sort_order: 0 }}
          />
        </TabsContent>

        <TabsContent value="weather" className="space-y-4">
          <ConfigTable
            tableName="temperature_emojis"
            title="Temperatur Emojilər"
            columns={[
              { key: 'min_temp', label: 'Min °C', type: 'number' },
              { key: 'max_temp', label: 'Max °C', type: 'number' },
              { key: 'emoji', label: 'Emoji' },
              { key: 'label_az', label: 'Azərbaycanca' },
              { key: 'clothing_tip_az', label: 'Geyim Məsləhəti' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ min_temp: 0, max_temp: 10, emoji: '🌡️', label_az: '', clothing_tip_az: '', sort_order: 0 }}
          />

          <ConfigTable
            tableName="exercise_daily_tips"
            title="Məşq Günlük Məsləhətləri"
            columns={[
              { key: 'tip_az', label: 'Məsləhət (AZ)' },
              { key: 'emoji', label: 'Emoji' },
              { key: 'sort_order', label: 'Sıra', type: 'number' },
            ]}
            defaultValues={{ tip_az: '', emoji: '💡', sort_order: 0 }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminToolsConfig;
