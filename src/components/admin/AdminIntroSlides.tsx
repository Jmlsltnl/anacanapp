import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, GripVertical, Save, X } from 'lucide-react';

interface IntroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon_name: string;
  gradient: string;
  bg_decor: string | null;
  sort_order: number;
  is_active: boolean;
}

const ICON_OPTIONS = [
  'Heart', 'Baby', 'Calendar', 'MessageCircle', 'Users',
  'Sparkles', 'Star', 'Shield', 'Smile', 'Sun',
  'Moon', 'Flower2', 'Music', 'Camera', 'Gift',
];

const GRADIENT_OPTIONS = [
  { label: 'Çəhrayı', value: 'from-pink-500 to-rose-600' },
  { label: 'Bənövşəyi', value: 'from-purple-500 to-violet-600' },
  { label: 'Mavi', value: 'from-blue-500 to-cyan-600' },
  { label: 'Yaşıl', value: 'from-emerald-500 to-teal-600' },
  { label: 'Narıncı', value: 'from-orange-500 to-amber-600' },
  { label: 'Qırmızı', value: 'from-red-500 to-rose-600' },
  { label: 'İndiqo', value: 'from-indigo-500 to-blue-600' },
  { label: 'Sarı', value: 'from-yellow-500 to-orange-600' },
];

const emptySlide: Partial<IntroSlide> = {
  title: '',
  subtitle: '',
  description: '',
  icon_name: 'Heart',
  gradient: 'from-pink-500 to-rose-600',
  bg_decor: 'bg-pink-100 dark:bg-pink-900/20',
  sort_order: 0,
  is_active: true,
};

const AdminIntroSlides = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<IntroSlide | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<IntroSlide>>(emptySlide);

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['admin-intro-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intro_slides')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as IntroSlide[];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-intro-slides'] });
    queryClient.invalidateQueries({ queryKey: ['intro-slides'] });
  };

  const saveMutation = useMutation({
    mutationFn: async (item: Partial<IntroSlide>) => {
      if (editing) {
        const { error } = await supabase.from('intro_slides').update(item).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('intro_slides').insert([item as any]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast({ title: editing ? 'Slayd yeniləndi' : 'Slayd əlavə edildi' });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('intro_slides').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Slayd silindi' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('intro_slides').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const resetForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptySlide);
  };

  const startEdit = (slide: IntroSlide) => {
    setEditing(slide);
    setCreating(true);
    setForm(slide);
  };

  const handleSave = () => {
    if (!form.title) {
      toast({ title: 'Başlıq tələb olunur', variant: 'destructive' });
      return;
    }
    const { id, created_at, updated_at, ...rest } = form as any;
    saveMutation.mutate(rest);
  };

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Yüklənir...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Qarşılama Ekranları</h2>
          <p className="text-muted-foreground text-sm">İlk dəfə daxil olan istifadəçilərə göstərilən tanıtım slaydları</p>
        </div>
        {!creating && (
          <Button onClick={() => { setCreating(true); setForm({ ...emptySlide, sort_order: slides.length + 1 }); }}>
            <Plus className="w-4 h-4 mr-2" /> Yeni Slayd
          </Button>
        )}
      </div>

      {creating && (
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <CardTitle>{editing ? 'Slaydu Redaktə Et' : 'Yeni Slayd'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Başlıq *</label>
                <Input value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Alt başlıq</label>
                <Input value={form.subtitle || ''} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Təsvir</label>
              <Textarea value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">İkon</label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={form.icon_name || 'Heart'}
                  onChange={e => setForm(p => ({ ...p, icon_name: e.target.value }))}
                >
                  {ICON_OPTIONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Gradient</label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={form.gradient || ''}
                  onChange={e => setForm(p => ({ ...p, gradient: e.target.value }))}
                >
                  {GRADIENT_OPTIONS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Sıra</label>
                <Input type="number" value={form.sort_order || 0} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-muted/50 flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${form.gradient} flex items-center justify-center text-white text-2xl shrink-0`}>
                {form.icon_name?.charAt(0) || '?'}
              </div>
              <div>
                <div className="font-bold">{form.title || 'Başlıq'}</div>
                <div className="text-sm text-muted-foreground">{form.subtitle}</div>
                <div className="text-xs text-muted-foreground mt-1">{form.description}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saveMutation.isPending}>
                <Save className="w-4 h-4 mr-2" /> Saxla
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" /> Ləğv et
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {slides.map((slide, i) => (
          <Card key={slide.id} className={!slide.is_active ? 'opacity-50' : ''}>
            <CardContent className="p-4 flex items-center gap-4">
              <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center text-white font-bold shrink-0`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{slide.title}</div>
                <div className="text-sm text-muted-foreground truncate">{slide.subtitle}</div>
                <div className="text-xs text-muted-foreground">İkon: {slide.icon_name} | Sıra: {slide.sort_order}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={slide.is_active}
                  onCheckedChange={checked => toggleMutation.mutate({ id: slide.id, is_active: checked })}
                />
                <Button variant="ghost" size="icon" onClick={() => startEdit(slide)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(slide.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {slides.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Heç bir slayd yoxdur</div>
        )}
      </div>
    </div>
  );
};

export default AdminIntroSlides;
