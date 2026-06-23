import { useState, useMemo } from 'react';
import { tr } from '@/lib/tr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BookOpen, Download, Upload, Save, Search, Filter, Plus, Database, AlertCircle, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TranslationRow {
  id: string;
  key: string;
  lang: string;
  value: string;
  namespace: string;
}

const NAMESPACES = [
'common', 'nav', 'tools', 'dashboard', 'settings', 'auth',
'community', 'blog', 'partner', 'ai', 'admin', 'onboarding', 'ai_prompts'];


const AdminTranslations = () => {
  const queryClient = useQueryClient();
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'empty' | 'filled'>('all');
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [newKey, setNewKey] = useState({ key: '', namespace: 'common', defaultValue: '' });
  const [showAddKey, setShowAddKey] = useState(false);

  // States for DB Translation Uploader
  const [uploadTable, setUploadTable] = useState('translations');
  const [uploadLang, setUploadLang] = useState('en');
  const [uploadJson, setUploadJson] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Fetch ALL available languages
  const { data: allLanguages = [] } = useQuery({
    queryKey: ['admin-all-languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_languages')
        .select('code, native_name')
        .order('sort_order');
      if (error) throw error;
      return data;
    }
  });

  const getSampleJson = () => {
    switch (uploadTable) {
      case 'translations':
        return `[
  {
    "key": "common.save",
    "value": "Save",
    "namespace": "common"
  },
  {
    "key": "nav.home",
    "value": "Home",
    "namespace": "nav"
  }
]`;
      case 'mommy_daily_messages':
        return `[
  {
    "day_number": 1,
    "message_en": "Welcome to motherhood! You are doing great."
  },
  {
    "day_number": 2,
    "message_en": "Remember to rest as much as possible today."
  }
]`;
      case 'baby_daily_info':
        return `[
  {
    "day_number": 1,
    "info_en": "Your newborn's stomach is only the size of a cherry."
  },
  {
    "day_number": 2,
    "info_en": "Your baby starts adjusting to life outside the womb."
  }
]`;
      case 'pregnancy_daily_content':
        return `[
  {
    "pregnancy_day": 1,
    "baby_development_en": "The fertilized egg is dividing.",
    "baby_message_en": "I am starting my journey!",
    "mother_tips_en": "Take prenatal vitamins.",
    "mother_warnings_en": "Avoid alcohol and smoking.",
    "nutrition_tip_en": "Eat folate-rich foods.",
    "exercise_tip_en": "Keep active with gentle walks."
  }
]`;
      default:
        return '';
    }
  };

  const handleDbUpload = async () => {
    if (!uploadJson.trim()) {
      toast.error('Zəhmət olmasa JSON məlumatı daxil edin');
      return;
    }

    let items: any[];
    try {
      items = JSON.parse(uploadJson);
      if (!Array.isArray(items)) {
        throw new Error('Məlumat bir JSON array olmalıdır.');
      }
    } catch (e: any) {
      toast.error(`JSON formatı səhvdir: ${e.message}`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadResults({
      total: items.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    });

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      if (uploadTable === 'translations') {
        const { data: dbData, error: dbErr } = await supabase
          .from('translations')
          .select('key, value, namespace')
          .eq('lang', uploadLang);
        
        if (dbErr) throw dbErr;
        const dbMap = new Map(dbData?.map(r => [r.key, r.value || '']) || []);

        const batchSize = 100;
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const toInsert: any[] = [];
          const toUpdate: any[] = [];

          for (const item of batch) {
            const key = item.key?.trim();
            const val = (item.value !== undefined ? item.value : item[`value_${uploadLang}`] || item.defaultValue || '').trim();
            const ns = (item.namespace || 'common').trim();

            if (!key) {
              failed++;
              errors.push(`Mətndə açar tapılmadı`);
              continue;
            }

            if (dbMap.has(key)) {
              const dbVal = dbMap.get(key);
              if (!dbVal && val) {
                toUpdate.push({ key, value: val, namespace: ns });
              } else {
                skipped++;
              }
            } else {
              toInsert.push({ key, lang: uploadLang, value: val, namespace: ns });
            }
          }

          if (toInsert.length > 0) {
            const { error: insErr } = await supabase.from('translations').insert(toInsert);
            if (insErr) {
              failed += toInsert.length;
              errors.push(`Insert xətası: ${insErr.message}`);
            } else {
              inserted += toInsert.length;
            }
          }

          if (toUpdate.length > 0) {
            const updatePromises = toUpdate.map(async (up) => {
              const { error: updErr } = await supabase
                .from('translations')
                .update({ value: up.value, updated_at: new Date().toISOString() })
                .eq('key', up.key)
                .eq('lang', uploadLang);
              if (updErr) {
                failed++;
                errors.push(`Update xətası (key: ${up.key}): ${updErr.message}`);
              } else {
                updated++;
              }
            });
            await Promise.all(updatePromises);
          }

          setUploadProgress(Math.min(100, Math.round(((i + batch.length) / items.length) * 100)));
          setUploadResults({
            total: items.length,
            inserted,
            updated,
            skipped,
            failed,
            errors: errors.slice(0, 10)
          });
        }
      } 
      else if (uploadTable === 'mommy_daily_messages') {
        const langCol = `message_${uploadLang}`;
        const { data: dbData, error: dbErr } = await supabase
          .from('mommy_daily_messages')
          .select(`id, day_number, message, ${langCol}`);
        
        if (dbErr) throw dbErr;
        const dbMap = new Map(dbData?.map(r => [r.day_number, r]) || []);

        const batchSize = 100;
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const toInsert: any[] = [];
          const toUpdate: any[] = [];

          for (const item of batch) {
            const dayNum = parseInt(item.day_number);
            const msgVal = (item[langCol] || item.message || item.message_en || '').trim();

            if (isNaN(dayNum)) {
              failed++;
              errors.push(`Sətirdə day_number düzgün deyil`);
              continue;
            }

            if (dbMap.has(dayNum)) {
              const dbRow = dbMap.get(dayNum);
              const dbVal = dbRow[langCol];
              if (!dbVal && msgVal) {
                toUpdate.push({ id: dbRow.id, [langCol]: msgVal });
              } else {
                skipped++;
              }
            } else {
              toInsert.push({
                day_number: dayNum,
                message: item.message || '',
                [langCol]: msgVal,
                is_active: item.is_active !== false
              });
            }
          }

          if (toInsert.length > 0) {
            const { error: insErr } = await supabase.from('mommy_daily_messages').insert(toInsert);
            if (insErr) {
              failed += toInsert.length;
              errors.push(`Insert xətası: ${insErr.message}`);
            } else {
              inserted += toInsert.length;
            }
          }

          if (toUpdate.length > 0) {
            const updatePromises = toUpdate.map(async (up) => {
              const { error: updErr } = await supabase
                .from('mommy_daily_messages')
                .update({ [langCol]: up[langCol], updated_at: new Date().toISOString() })
                .eq('id', up.id);
              if (updErr) {
                failed++;
                errors.push(`Update xətası (day: ${up.day_number}): ${updErr.message}`);
              } else {
                updated++;
              }
            });
            await Promise.all(updatePromises);
          }

          setUploadProgress(Math.min(100, Math.round(((i + batch.length) / items.length) * 100)));
          setUploadResults({
            total: items.length,
            inserted,
            updated,
            skipped,
            failed,
            errors: errors.slice(0, 10)
          });
        }
      }
      else if (uploadTable === 'baby_daily_info') {
        const langCol = `info_${uploadLang}`;
        const { data: dbData, error: dbErr } = await supabase
          .from('baby_daily_info')
          .select(`id, day_number, info, ${langCol}`);
        
        if (dbErr) throw dbErr;
        const dbMap = new Map(dbData?.map(r => [r.day_number, r]) || []);

        const batchSize = 100;
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const toInsert: any[] = [];
          const toUpdate: any[] = [];

          for (const item of batch) {
            const dayNum = parseInt(item.day_number);
            const infoVal = (item[langCol] || item.info || item.info_en || '').trim();

            if (isNaN(dayNum)) {
              failed++;
              errors.push(`Sətirdə day_number düzgün deyil`);
              continue;
            }

            if (dbMap.has(dayNum)) {
              const dbRow = dbMap.get(dayNum);
              const dbVal = dbRow[langCol];
              if (!dbVal && infoVal) {
                toUpdate.push({ id: dbRow.id, [langCol]: infoVal });
              } else {
                skipped++;
              }
            } else {
              toInsert.push({
                day_number: dayNum,
                info: item.info || '',
                [langCol]: infoVal,
                is_active: item.is_active !== false
              });
            }
          }

          if (toInsert.length > 0) {
            const { error: insErr } = await supabase.from('baby_daily_info').insert(toInsert);
            if (insErr) {
              failed += toInsert.length;
              errors.push(`Insert xətası: ${insErr.message}`);
            } else {
              inserted += toInsert.length;
            }
          }

          if (toUpdate.length > 0) {
            const updatePromises = toUpdate.map(async (up) => {
              const { error: updErr } = await supabase
                .from('baby_daily_info')
                .update({ [langCol]: up[langCol], updated_at: new Date().toISOString() })
                .eq('id', up.id);
              if (updErr) {
                failed++;
                errors.push(`Update xətası (day: ${up.day_number}): ${updErr.message}`);
              } else {
                updated++;
              }
            });
            await Promise.all(updatePromises);
          }

          setUploadProgress(Math.min(100, Math.round(((i + batch.length) / items.length) * 100)));
          setUploadResults({
            total: items.length,
            inserted,
            updated,
            skipped,
            failed,
            errors: errors.slice(0, 10)
          });
        }
      }
      else if (uploadTable === 'pregnancy_daily_content') {
        const suffix = `_${uploadLang}`;
        const transFields = [
          'baby_development',
          'baby_message',
          'mother_tips',
          'mother_warnings',
          'nutrition_tip',
          'exercise_tip'
        ];
        
        const selectCols = ['id', 'pregnancy_day', ...transFields.map(f => `${f}${suffix}`)];
        const { data: dbData, error: dbErr } = await supabase
          .from('pregnancy_daily_content')
          .select(selectCols.join(', '));
        
        if (dbErr) throw dbErr;
        const dbMap = new Map(dbData?.map(r => [r.pregnancy_day, r]) || []);

        const batchSize = 50;
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const toInsert: any[] = [];
          const toUpdate: any[] = [];

          for (const item of batch) {
            const pDay = parseInt(item.pregnancy_day);
            if (isNaN(pDay)) {
              failed++;
              errors.push(`Sətirdə pregnancy_day düzgün deyil`);
              continue;
            }

            const transValues: Record<string, string> = {};
            let hasNewTrans = false;

            transFields.forEach(f => {
              const colName = `${f}${suffix}`;
              const val = (item[colName] || item[f] || '').trim();
              if (val) {
                transValues[colName] = val;
              }
            });

            if (dbMap.has(pDay)) {
              const dbRow = dbMap.get(pDay);
              const individualUpdate: Record<string, string> = {};
              
              transFields.forEach(f => {
                const colName = `${f}${suffix}`;
                if (!dbRow[colName] && transValues[colName]) {
                  individualUpdate[colName] = transValues[colName];
                  hasNewTrans = true;
                }
              });

              if (hasNewTrans) {
                toUpdate.push({ id: dbRow.id, pregnancy_day: pDay, ...individualUpdate });
              } else {
                skipped++;
              }
            } else {
              toInsert.push({
                pregnancy_day: pDay,
                week_number: item.week_number || Math.ceil(pDay / 7),
                day_number: item.day_number || (pDay % 7 === 0 ? 7 : pDay % 7),
                ...transValues,
                is_active: item.is_active !== false
              });
            }
          }

          if (toInsert.length > 0) {
            const { error: insErr } = await supabase.from('pregnancy_daily_content').insert(toInsert);
            if (insErr) {
              failed += toInsert.length;
              errors.push(`Insert xətası: ${insErr.message}`);
            } else {
              inserted += toInsert.length;
            }
          }

          if (toUpdate.length > 0) {
            const updatePromises = toUpdate.map(async (up) => {
              const { id, pregnancy_day, ...fieldsToUpdate } = up;
              const { error: updErr } = await supabase
                .from('pregnancy_daily_content')
                .update({ ...fieldsToUpdate, updated_at: new Date().toISOString() })
                .eq('id', id);
              if (updErr) {
                failed++;
                errors.push(`Update xətası (day: ${pregnancy_day}): ${updErr.message}`);
              } else {
                updated++;
              }
            });
            await Promise.all(updatePromises);
          }

          setUploadProgress(Math.min(100, Math.round(((i + batch.length) / items.length) * 100)));
          setUploadResults({
            total: items.length,
            inserted,
            updated,
            skipped,
            failed,
            errors: errors.slice(0, 10)
          });
        }
      }
      toast.success('Yükləmə tamamlandı!');
    } catch (err: any) {
      console.error(err);
      toast.error(`Xəta baş verdi: ${err.message}`);
      errors.push(err.message);
    } finally {
      setUploading(false);
      queryClient.invalidateQueries();
    }
  };

  // Fetch available languages (non-az)
  const { data: languages = [] } = useQuery({
    queryKey: ['admin-languages-for-translations'],
    queryFn: async () => {
      const { data, error } = await supabase.
      from('app_languages').
      select('code, native_name').
      neq('code', 'az').
      order('sort_order');
      if (error) throw error;
      return data;
    }
  });

  // Fetch translations for selected language
  const { data: translations = [], isLoading } = useQuery({
    queryKey: ['admin-translations', selectedLang],
    queryFn: async () => {
      let query = supabase.
      from('translations').
      select('*').
      eq('lang', selectedLang).
      order('namespace').
      order('key');

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
    enabled: !!selectedLang
  });

  const filtered = useMemo(() => {
    let result = translations;
    if (selectedNamespace !== 'all') {
      result = result.filter((t) => t.namespace === selectedNamespace);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.key.toLowerCase().includes(q) || t.value.toLowerCase().includes(q));
    }
    if (filterMode === 'empty') {
      result = result.filter((t) => !t.value);
    } else if (filterMode === 'filled') {
      result = result.filter((t) => !!t.value);
    }
    return result;
  }, [translations, selectedNamespace, searchQuery, filterMode]);

  const saveTranslation = useMutation({
    mutationFn: async ({ id, value }: {id: string;value: string;}) => {
      const { error } = await supabase.
      from('translations').
      update({ value, updated_at: new Date().toISOString() }).
      eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-translations', selectedLang] });
    }
  });

  const saveAll = async () => {
    const entries = Object.entries(editedValues);
    if (entries.length === 0) return;

    let saved = 0;
    for (const [id, value] of entries) {
      try {
        await saveTranslation.mutateAsync({ id, value });
        saved++;
      } catch {/* skip */}
    }
    setEditedValues({});
    toast.success(`${saved} tərcümə yadda saxlanıldı`);
  };

  const addTranslationKey = useMutation({
    mutationFn: async () => {
      // Add for all non-az languages
      const langs = languages.map((l) => l.code);
      const inserts = langs.map((lang) => ({
        key: newKey.key.trim(),
        lang,
        value: '',
        namespace: newKey.namespace
      }));
      const { error } = await supabase.from('translations').insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-translations'] });
      setShowAddKey(false);
      setNewKey({ key: '', namespace: 'common', defaultValue: '' });
      toast.success(tr("admintranslations_acar_elave_edildi_15fb4c", "A\xE7ar \u0259lav\u0259 edildi"));
    },
    onError: (err) => toast.error((err as Error).message)
  });

  // CSV Export
  const handleExport = () => {
    const rows = [['key', 'namespace', 'value'].join(',')];
    translations.forEach((t) => {
      rows.push([
      `"${t.key}"`,
      `"${t.namespace}"`,
      `"${(t.value || '').replace(/"/g, '""')}"`].
      join(','));
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

        const { error } = await supabase.
        from('translations').
        upsert(
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

  const filledCount = translations.filter((t) => !!t.value).length;
  const totalCount = translations.length;
  const progress = totalCount > 0 ? Math.round(filledCount / totalCount * 100) : 0;

  return (
    <Tabs defaultValue="list" className="space-y-6">
      <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
        <TabsList>
          <TabsTrigger value="list">{tr("admintranslations_tercume_siyahisi_tab", "Tərcümə Siyahısı")}</TabsTrigger>
          <TabsTrigger value="upload">{tr("admintranslations_verilenler_bazasi_yukle_tab", "Verilənlər Bazasına Dil Yüklə")}</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="list" className="space-y-6 mt-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">{tr("admintranslations_tercumeler_f31ad6", "Tərcümələr")}</h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowAddKey(!showAddKey)}>
                <Plus className="w-4 h-4 mr-1" /> {tr("admintranslations_acar_644193", "Açarlar")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" /> CSV İxrac
              </Button>
              <label>
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="w-4 h-4 mr-1" />{tr("admintranslations_csv_idxal_f88021", "CSV İdxal")}</span>
                </Button>
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
              </label>
              {Object.keys(editedValues).length > 0 &&
              <Button size="sm" onClick={saveAll}>
                  <Save className="w-4 h-4 mr-1" /> {tr("admintranslations_hamisini_saxla_7a6f24", "Hamısını Saxla (")}{Object.keys(editedValues).length})
                </Button>
              }
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-40">
              <Label>Dil</Label>
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {languages.map((l) =>
                  <SelectItem key={l.code} value={l.code}>{l.native_name} ({l.code})</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label>Namespace</Label>
              <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr("admintranslations_hamisi_c73c4d", "Hamısı")}</SelectItem>
                  {NAMESPACES.map((ns) =>
                  <SelectItem key={ns} value={ns}>{ns}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label>Filtr</Label>
              <Select value={filterMode} onValueChange={(v) => setFilterMode(v as typeof filterMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr("admintranslations_hamisi_c73c4d", "Hamısı")}</SelectItem>
                  <SelectItem value="empty">{tr("admintranslations_bos_485510", "Boş")}</SelectItem>
                  <SelectItem value="filled">Dolu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Axtar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={tr("admintranslations_acar_ve_ya_deyer_axtar_7422e0", "Açar və ya dəyər axtar...")} />
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
          {showAddKey &&
          <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>{tr("admintranslations_acar_644193", "Açar")}</Label>
                    <Input value={newKey.key} onChange={(e) => setNewKey((p) => ({ ...p, key: e.target.value }))} placeholder="nav.home" />
                  </div>
                  <div>
                    <Label>Namespace</Label>
                    <Select value={newKey.namespace} onValueChange={(v) => setNewKey((p) => ({ ...p, namespace: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NAMESPACES.map((ns) => <SelectItem key={ns} value={ns}>{ns}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{tr("admintranslations_az_deyeri_referans_814983", "AZ Dəyəri (referans)")}</Label>
                    <Input value={newKey.defaultValue} onChange={(e) => setNewKey((p) => ({ ...p, defaultValue: e.target.value }))} placeholder={tr("admintranslations_esas_6d87f7", "Əsas")} />
                  </div>
                </div>
                <Button onClick={() => addTranslationKey.mutate()} disabled={!newKey.key} size="sm">
                  {tr("admintranslations_butun_dillere_elave_et_422b49", "Bütün dillərə əlavə et")}
                </Button>
              </CardContent>
            </Card>
          }

          {/* Translation List */}
          {isLoading ?
          <div className="text-center py-8 text-muted-foreground">{tr("admintranslations_yuklenir_5557de", "Yüklənir...")}</div> :
          filtered.length === 0 ?
          <div className="text-center py-8 text-muted-foreground">{tr("admintranslations_tercume_tapilmadi_6b4f34", "Tərcümə tapılmadı")}</div> :

          <div className="space-y-2">
              {filtered.map((t) =>
            <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{t.key}</code>
                      <Badge variant="outline" className="text-[10px]">{t.namespace}</Badge>
                    </div>
                    <Textarea
                  className="text-sm min-h-[36px] resize-none"
                  value={editedValues[t.id] !== undefined ? editedValues[t.id] : t.value}
                  onChange={(e) => setEditedValues((prev) => ({ ...prev, [t.id]: e.target.value }))}
                  placeholder={tr("admintranslations_tercumeni_daxil_edin_3e150c", "Tərcüməni daxil edin...")}
                  rows={1} />
                
                  </div>
                  {editedValues[t.id] !== undefined &&
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await saveTranslation.mutateAsync({ id: t.id, value: editedValues[t.id] });
                  setEditedValues((prev) => {
                    const next = { ...prev };
                    delete next[t.id];
                    return next;
                  });
                  toast.success(tr("admintranslations_saxlanildi_66ffe7", "Saxlanıldı"));
                }}>
                
                      <Save className="w-4 h-4" />
                    </Button>
              }
                </div>
            )}
            </div>
          }
        </div>
      </TabsContent>

      <TabsContent value="upload" className="mt-0">
        <Card className="border-border/50">
          <CardContent className="pt-6 space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-xl text-sm flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Mühüm Xəbərdarlıq ("Eyni olanlara dəyməsin")</h4>
                <p className="leading-relaxed">
                  Bu alət verilənlər bazasındakı mövcud yazıları qoruyur. Seçilmiş dil sütununda (məsələn, <code>message_en</code> və ya <code>info_en</code>) artıq mətn varsa, o dəyişdirilməyəcək (üzərindən yazılmayacaq). Yalnız həmin sütun boş (NULL və ya boş sətir) olduqda və ya yeni sətir əlavə edildikdə məlumat yazılacaq.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hədəf Cədvəl</Label>
                <Select value={uploadTable} onValueChange={setUploadTable}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="translations">translations (UI tərcümələri)</SelectItem>
                    <SelectItem value="mommy_daily_messages">mommy_daily_messages (Anaya gündəlik mesaj)</SelectItem>
                    <SelectItem value="baby_daily_info">baby_daily_info (Körpə üçün günlük məlumatlar)</SelectItem>
                    <SelectItem value="pregnancy_daily_content">pregnancy_daily_content (Hamiləlik günlük kontenti)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hədəf Dil</Label>
                <Select value={uploadLang} onValueChange={setUploadLang}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allLanguages.map((l: any) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.native_name} ({l.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>JSON Məlumatı (Array formatında)</Label>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs text-primary"
                  onClick={() => setUploadJson(getSampleJson())}
                >
                  Nümunəni doldur
                </Button>
              </div>
              <Textarea
                value={uploadJson}
                onChange={(e) => setUploadJson(e.target.value)}
                placeholder={getSampleJson()}
                rows={10}
                className="font-mono text-xs"
              />
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Yüklənir...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            {uploadResults && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-muted/40 rounded-xl">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Cəmi</div>
                  <div className="text-lg font-bold">{uploadResults.total}</div>
                </div>
                <div className="text-center text-emerald-600 dark:text-emerald-400">
                  <div className="text-xs text-muted-foreground">Yeni yaradılan</div>
                  <div className="text-lg font-bold">{uploadResults.inserted}</div>
                </div>
                <div className="text-center text-blue-600 dark:text-blue-400">
                  <div className="text-xs text-muted-foreground font-semibold">Yenilənən sütun</div>
                  <div className="text-lg font-bold">{uploadResults.updated}</div>
                </div>
                <div className="text-center text-amber-600 dark:text-amber-400">
                  <div className="text-xs text-muted-foreground">Dəyişməyən (Keçilən)</div>
                  <div className="text-lg font-bold">{uploadResults.skipped}</div>
                </div>
                <div className="text-center text-destructive">
                  <div className="text-xs text-muted-foreground">Uğursuz</div>
                  <div className="text-lg font-bold">{uploadResults.failed}</div>
                </div>
              </div>
            )}

            {uploadResults && uploadResults.errors.length > 0 && (
              <div className="space-y-1 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs">
                <div className="font-semibold mb-1">Xətalar (Maks 10):</div>
                {uploadResults.errors.map((err, idx) => (
                  <div key={idx}>• {err}</div>
                ))}
              </div>
            )}

            <Button
              onClick={handleDbUpload}
              disabled={uploading || !uploadJson.trim()}
              className="w-full gradient-primary gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Yüklənir...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Verilənlər Bazasına Göndər
                </>
              )}
            </Button>
          </CardContent>
        </Card>

};

export default AdminTranslations;