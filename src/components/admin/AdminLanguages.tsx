import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Globe, Plus, Save, Trash2, Languages } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface LanguageRow {
  id: string;
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
  regions: string[];
  disabled_tools: string[];
  sort_order: number;
  icon_url: string | null;
}

const AdminLanguages = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLang, setNewLang] = useState({ code: '', name: '', native_name: '', regions: '', disabled_tools: '' });
  const [showAdd, setShowAdd] = useState(false);

  const { data: languages = [], isLoading } = useQuery({
    queryKey: ['admin-languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_languages')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as LanguageRow[];
    },
  });

  // Get translation counts per language
  const { data: translationCounts = {} } = useQuery({
    queryKey: ['admin-translation-counts'],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const lang of languages.filter(l => l.code !== 'az')) {
        const { count, error } = await supabase
          .from('translations')
          .select('*', { count: 'exact', head: true })
          .eq('lang', lang.code)
          .neq('value', '');
        if (!error) counts[lang.code] = count ?? 0;
      }
      return counts;
    },
    enabled: languages.length > 0,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('app_languages')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-languages'] });
      toast.success('Dil statusu yeniləndi');
    },
  });

  const updateLanguage = useMutation({
    mutationFn: async (lang: Partial<LanguageRow> & { id: string }) => {
      const { error } = await supabase
        .from('app_languages')
        .update(lang)
        .eq('id', lang.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-languages'] });
      setEditingId(null);
      toast.success('Dil yeniləndi');
    },
  });

  const addLanguage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('app_languages')
        .insert({
          code: newLang.code.trim(),
          name: newLang.name.trim(),
          native_name: newLang.native_name.trim(),
          regions: JSON.parse(`[${newLang.regions.split(',').map(r => `"${r.trim()}"`).join(',')}]`),
          disabled_tools: newLang.disabled_tools ? JSON.parse(`[${newLang.disabled_tools.split(',').map(t => `"${t.trim()}"`).join(',')}]`) : [],
          sort_order: languages.length + 1,
          is_active: false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-languages'] });
      setShowAdd(false);
      setNewLang({ code: '', name: '', native_name: '', regions: '', disabled_tools: '' });
      toast.success('Yeni dil əlavə edildi');
    },
    onError: (err) => toast.error('Xəta: ' + (err as Error).message),
  });

  const deleteLang = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('app_languages').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-languages'] });
      toast.success('Dil silindi');
    },
  });

  const [editForm, setEditForm] = useState<Record<string, string>>({});

  if (isLoading) return <div className="p-4">Yüklənir...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Dil İdarəetməsi</h2>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Yeni Dil
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kod (az, en, tr...)</Label>
                <Input value={newLang.code} onChange={e => setNewLang(p => ({ ...p, code: e.target.value }))} placeholder="en" />
              </div>
              <div>
                <Label>Ad (English)</Label>
                <Input value={newLang.name} onChange={e => setNewLang(p => ({ ...p, name: e.target.value }))} placeholder="English" />
              </div>
              <div>
                <Label>Yerli Ad (English)</Label>
                <Input value={newLang.native_name} onChange={e => setNewLang(p => ({ ...p, native_name: e.target.value }))} placeholder="English" />
              </div>
              <div>
                <Label>Bölgələr (vergüllə)</Label>
                <Input value={newLang.regions} onChange={e => setNewLang(p => ({ ...p, regions: e.target.value }))} placeholder="US,GB,AU" />
              </div>
              <div className="col-span-2">
                <Label>Deaktiv alətlər (vergüllə, boş saxlaya bilərsiniz)</Label>
                <Input value={newLang.disabled_tools} onChange={e => setNewLang(p => ({ ...p, disabled_tools: e.target.value }))} placeholder="cakes,maternity" />
              </div>
            </div>
            <Button onClick={() => addLanguage.mutate()} disabled={!newLang.code || !newLang.name}>
              <Save className="w-4 h-4 mr-1" /> Əlavə et
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {languages.map(lang => (
          <Card key={lang.id} className={lang.is_active ? 'border-primary/30' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Languages className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{lang.native_name}</span>
                      <Badge variant="outline">{lang.code}</Badge>
                      {lang.is_active && <Badge className="bg-green-500/20 text-green-700">Aktiv</Badge>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Bölgələr: {(lang.regions as string[])?.join(', ') || '—'}
                      {lang.code !== 'az' && (
                        <span className="ml-3">
                          Tərcümə: <strong>{translationCounts[lang.code] ?? 0}</strong> açar
                        </span>
                      )}
                    </div>
                    {(lang.disabled_tools as string[])?.length > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        Deaktiv alətlər: {(lang.disabled_tools as string[]).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {lang.code !== 'az' && (
                    <>
                      <Switch
                        checked={lang.is_active}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: lang.id, is_active: checked })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm(`"${lang.native_name}" dilini silmək istəyirsiniz?`)) {
                            deleteLang.mutate(lang.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminLanguages;
