import { useState, useRef } from 'react';
import { useBabyDailyInfoAdmin, BabyDailyInfo } from '@/hooks/useBabyDailyInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, X, Upload, Download, Search } from 'lucide-react';
import { toast } from 'sonner';

const AdminBabyDailyInfo = () => {
  const { data, isLoading, createInfo, updateInfo, deleteInfo, bulkImport } = useBabyDailyInfoAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BabyDailyInfo>>({});
  const [searchDay, setSearchDay] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = searchDay
    ? data.filter(d => d.day_number.toString().includes(searchDay))
    : data;

  const handleCreate = () => {
    const nextDay = data.length > 0 ? Math.max(...data.map(d => d.day_number)) + 1 : 1;
    createInfo.mutate(
      { day_number: nextDay, info: 'Yeni gün məlumatı' },
      {
        onSuccess: () => toast.success('Əlavə edildi'),
        onError: (e: any) => toast.error(e.message || 'Xəta'),
      }
    );
  };

  const handleUpdate = (id: string) => {
    updateInfo.mutate(
      { id, ...formData },
      {
        onSuccess: () => { toast.success('Yeniləndi'); setEditingId(null); setFormData({}); },
        onError: () => toast.error('Xəta'),
      }
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    deleteInfo.mutate(id, {
      onSuccess: () => toast.success('Silindi'),
      onError: () => toast.error('Xəta'),
    });
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const items: { day_number: number; info: string }[] = [];

        // Parse CSV with support for quoted multi-line fields
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const nextChar = text[i + 1];

          if (inQuotes) {
            if (char === '"' && nextChar === '"') {
              currentField += '"';
              i++; // skip escaped quote
            } else if (char === '"') {
              inQuotes = false;
            } else {
              currentField += char;
            }
          } else {
            if (char === '"') {
              inQuotes = true;
            } else if (char === ',') {
              currentRow.push(currentField.trim());
              currentField = '';
            } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
              currentRow.push(currentField.trim());
              if (currentRow.some(f => f.length > 0)) {
                rows.push(currentRow);
              }
              currentRow = [];
              currentField = '';
              if (char === '\r') i++;
            } else {
              currentField += char;
            }
          }
        }
        // Last row
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.some(f => f.length > 0)) {
            rows.push(currentRow);
          }
        }

        // Skip header
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const dayNum = parseInt(row[0]);
          const info = row[1] || '';

          if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 1460 && info.length > 0) {
            items.push({ day_number: dayNum, info });
          }
        }

        if (items.length === 0) {
          toast.error('CSV-dən heç bir məlumat oxunmadı');
          return;
        }

        bulkImport.mutate(items, {
          onSuccess: (result) => {
            toast.success(`${result.success} məlumat idxal edildi${result.failed > 0 ? `, ${result.failed} uğursuz` : ''}`);
          },
          onError: () => toast.error('İdxal xətası'),
        });
      } catch (err) {
        toast.error('CSV oxunma xətası');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Yüklənir...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={handleCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Yeni gün
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-1" /> CSV İdxal
        </Button>
        <a href="/templates/gunluk_melumat_numune.csv" download>
          <Button variant="ghost" size="sm">
            <Download className="w-4 h-4 mr-1" /> Nümunə CSV
          </Button>
        </a>
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />

        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Gün axtar..."
            value={searchDay}
            onChange={(e) => setSearchDay(e.target.value)}
            className="w-32 h-8 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground">{data.length} / 1460 gün</span>
      </div>

      <div className="space-y-2 max-h-[70vh] overflow-y-auto">
        {filteredData.map((item) => (
          <Card key={item.id} className="border">
            <CardContent className="p-3">
              {editingId === item.id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium w-12">Gün:</label>
                    <Input
                      type="number"
                      min={1}
                      max={1460}
                      value={formData.day_number ?? item.day_number}
                      onChange={(e) => setFormData({ ...formData, day_number: parseInt(e.target.value) })}
                      className="w-24 h-8 text-sm"
                    />
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-xs">Aktiv:</span>
                      <Switch
                        checked={formData.is_active ?? item.is_active}
                        onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                      />
                    </div>
                  </div>
                  <Textarea
                    value={formData.info ?? item.info}
                    onChange={(e) => setFormData({ ...formData, info: e.target.value })}
                    rows={4}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(item.id)}>
                      <Save className="w-3 h-3 mr-1" /> Saxla
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setFormData({}); }}>
                      <X className="w-3 h-3 mr-1" /> Ləğv et
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-14 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{item.day_number}</span>
                  </div>
                  <p className="flex-1 text-sm text-foreground leading-relaxed line-clamp-3">{item.info}</p>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!item.is_active && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">Deaktiv</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setEditingId(item.id); setFormData({}); }}
                    >
                      Redaktə
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchDay ? 'Nəticə tapılmadı' : 'Hələ məlumat yoxdur. CSV idxal edin və ya yeni gün əlavə edin.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBabyDailyInfo;
