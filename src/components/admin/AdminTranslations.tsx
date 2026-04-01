import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BookOpen, Download, Upload, Save, Search, Filter, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface TranslationRow {
  id: string;
  key: string;
  lang: string;
  value: string;
  namespace: string;
}

const NAMESPACES = [
  'common', 'nav', 'tools', 'dashboard', 'settings', 'auth',
  'community', 'blog', 'partner', 'ai', 'admin', 'onboarding', 'ai_prompts',
];

const AdminTranslations = () => {
  const queryClient = useQueryClient();
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'empty' | 'filled'>('all');
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState({ key: '', namespace: 'common', defaultValue: '' });
  const [showAddKey, setShowAddKey] = useState(false);

  // Fetch available languages (non-az)
  const { data: languages = [] } = useQuery({
    queryKey: ['admin-languages-for-translations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_languages')
        .select('code, native_name')
        .neq('code', 'az')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch translations for selected language
  const { data: translations = [], isLoading } = useQuery({
    queryKey: ['admin-translations', selectedLang],
    queryFn: async () => {
      let query = supabase
        .from('translations')
        .select('*')
        .eq('lang', selectedLang)
        .order('namespace')
        .order('key');
      
      const allData: TranslationRow[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await query.range(from, from + batchSize - 1);
        if (error) throw error;
        if (data) allData.push(...(data as TranslationRow[]));
        hasMore = (data?.length ?? 0) === batchSize;
        from += batchSize;
      }
      
      return allData;
    },
    enabled: !!selectedLang,
  });

  const filtered = useMemo(() => {
    let result = translations;
    if (selectedNamespace !== 'all') {
      result = result.filter(t => t.namespace === selectedNamespace);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.key.toLowerCase().includes(q) || t.value.toLowerCase().includes(q));
    }
    if (filterMode === 'empty') {
      result = result.filter(t => !t.value);
    } else if (filterMode === 'filled') {
      result = result.filter(t => !!t.value);
    }
    return result;
  }, [translations, selectedNamespace, searchQuery, filterMode]);

  const saveTranslation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const { error } = await supabase
        .from('translations')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-translations', selectedLang] });
    },
  });

  const saveAll = async () => {
    const entries = Object.entries(editedValues);
    if (entries.length === 0) return;
    
    let saved = 0;
    for (const [id, value] of entries) {
      try {
        await saveTranslation.mutateAsync({ id, value });
        saved++;
      } catch { /* skip */ }
    }
    setEditedValues({});
    toast.success(`${saved} tərcümə yadda saxlanıldı`);
  };

  const addTranslationKey = useMutation({
    mutationFn: async () => {
      // Add for all non-az languages
      const langs = languages.map(l => l.code);
      const inserts = langs.map(lang => ({
        key: newKey.key.trim(),
        lang,
        value: '',
        namespace: newKey.namespace,
      }));
      const { error } = await supabase.from('translations').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-translations'] });
      setShowAddKey(false);
      setNewKey({ key: '', namespace: 'common', defaultValue: '' });
      toast.success('Açar əlavə edildi');
    },
    onError: (err) => toast.error((err as Error).message),
  });

  // CSV Export
  const handleExport = () => {
    const rows = [['key', 'namespace', 'value'].join(',')];
    translations.forEach(t => {
      rows.push([
        `"${t.key}"`,
        `"${t.namespace}"`,
        `"${(t.value || '').replace(/"/g, '""')}"`,
      ].join(','));
    });
    const blob = new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translations_${selectedLang}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV Import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').slice(1); // skip header
      let imported = 0;
      
      for (const line of lines) {
        if (!line.trim()) continue;
        // Simple CSV parse: key,namespace,value
        const match = line.match(/^"?([^",]+)"?,\s*"?([^",]+)"?,\s*"?(.*)"?$/);
        if (!match) continue;
        
        const [, key, namespace, value] = match;
        const cleanValue = value.replace(/""/g, '"').replace(/"$/, '');
        
        const { error } = await supabase
          .from('translations')
          .upsert(
            { key: key.trim(), lang: selectedLang, value: cleanValue, namespace: namespace.trim() },
            { onConflict: 'key,lang' }
          );
        if (!error) imported++;
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin-translations', selectedLang] });
      toast.success(`${imported} tərcümə idxal edildi`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filledCount = translations.filter(t => !!t.value).length;
  const totalCount = translations.length;
  const progress = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Tərcümələr</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAddKey(!showAddKey)}>
            <Plus className="w-4 h-4 mr-1" /> Açar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> CSV İxrac
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span><Upload className="w-4 h-4 mr-1" /> CSV İdxal</span>
            </Button>
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          {Object.keys(editedValues).length > 0 && (
            <Button size="sm" onClick={saveAll}>
              <Save className="w-4 h-4 mr-1" /> Hamısını Saxla ({Object.keys(editedValues).length})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-40">
          <Label>Dil</Label>
          <Select value={selectedLang} onValueChange={setSelectedLang}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {languages.map(l => (
                <SelectItem key={l.code} value={l.code}>{l.native_name} ({l.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Label>Namespace</Label>
          <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hamısı</SelectItem>
              {NAMESPACES.map(ns => (
                <SelectItem key={ns} value={ns}>{ns}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Label>Filtr</Label>
          <Select value={filterMode} onValueChange={(v) => setFilterMode(v as typeof filterMode)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Hamısı</SelectItem>
              <SelectItem value="empty">Boş</SelectItem>
              <SelectItem value="filled">Dolu</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <Label>Axtar</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Açar və ya dəyər axtar..." />
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-sm text-muted-foreground font-medium">{filledCount}/{totalCount} ({progress}%)</span>
      </div>

      {/* Add Key Form */}
      {showAddKey && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Açar</Label>
                <Input value={newKey.key} onChange={e => setNewKey(p => ({ ...p, key: e.target.value }))} placeholder="nav.home" />
              </div>
              <div>
                <Label>Namespace</Label>
                <Select value={newKey.namespace} onValueChange={v => setNewKey(p => ({ ...p, namespace: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NAMESPACES.map(ns => <SelectItem key={ns} value={ns}>{ns}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>AZ Dəyəri (referans)</Label>
                <Input value={newKey.defaultValue} onChange={e => setNewKey(p => ({ ...p, defaultValue: e.target.value }))} placeholder="Əsas" />
              </div>
            </div>
            <Button onClick={() => addTranslationKey.mutate()} disabled={!newKey.key} size="sm">
              Bütün dillərə əlavə et
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Translation List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Tərcümə tapılmadı</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => (
            <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{t.key}</code>
                  <Badge variant="outline" className="text-[10px]">{t.namespace}</Badge>
                </div>
                <Textarea
                  className="text-sm min-h-[36px] resize-none"
                  value={editedValues[t.id] !== undefined ? editedValues[t.id] : t.value}
                  onChange={e => setEditedValues(prev => ({ ...prev, [t.id]: e.target.value }))}
                  placeholder="Tərcüməni daxil edin..."
                  rows={1}
                />
              </div>
              {editedValues[t.id] !== undefined && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await saveTranslation.mutateAsync({ id: t.id, value: editedValues[t.id] });
                    setEditedValues(prev => {
                      const next = { ...prev };
                      delete next[t.id];
                      return next;
                    });
                    toast.success('Saxlanıldı');
                  }}
                >
                  <Save className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTranslations;
