import { useState } from 'react';
import { useTrimesterTipsAdmin, TrimesterTip } from '@/hooks/useTrimesterTips';
import { useTrimesterInfo, FALLBACK_TRIMESTER_INFO } from '@/hooks/useTrimesterInfo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminTrimesterTips = () => {
  const { data: dbTrimesterInfo = [] } = useTrimesterInfo();
  const TRIMESTER_INFO = dbTrimesterInfo.length > 0 
    ? dbTrimesterInfo.map(t => ({ value: t.trimester_number, label: t.label_az || t.label, emoji: t.emoji, color: t.color_class }))
    : FALLBACK_TRIMESTER_INFO.map(t => ({ value: t.trimester_number, label: t.label_az, emoji: t.emoji, color: t.color_class }));

  const { tips, isLoading, createTip, updateTip, deleteTip } = useTrimesterTipsAdmin();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TrimesterTip>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newTip, setNewTip] = useState<Partial<TrimesterTip>>({
    trimester: 1,
    icon: '💡',
    tip_text: '',
    sort_order: 0,
    is_active: true,
  });

  const handleCreate = async () => {
    if (!newTip.tip_text?.trim()) {
      toast({ title: 'Xəta', description: 'Tövsiyə mətni boş ola bilməz', variant: 'destructive' });
      return;
    }

    try {
      await createTip.mutateAsync(newTip);
      toast({ title: 'Uğurlu', description: 'Tövsiyə əlavə edildi' });
      setNewTip({ trimester: 1, icon: '💡', tip_text: '', sort_order: 0, is_active: true });
      setIsAdding(false);
    } catch (error) {
      toast({ title: 'Xəta', description: 'Tövsiyə əlavə edilmədi', variant: 'destructive' });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateTip.mutateAsync({ id, ...editForm });
      toast({ title: 'Uğurlu', description: 'Tövsiyə yeniləndi' });
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      toast({ title: 'Xəta', description: 'Tövsiyə yenilənmədi', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu tövsiyəni silmək istədiyinizə əminsiniz?')) return;
    
    try {
      await deleteTip.mutateAsync(id);
      toast({ title: 'Uğurlu', description: 'Tövsiyə silindi' });
    } catch (error) {
      toast({ title: 'Xəta', description: 'Tövsiyə silinmədi', variant: 'destructive' });
    }
  };

  const startEdit = (tip: TrimesterTip) => {
    setEditingId(tip.id);
    setEditForm(tip);
  };

  const getTipsByTrimester = (trimester: number) => tips.filter(t => t.trimester === trimester);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trimester Tövsiyələri</h2>
          <p className="text-muted-foreground">Hər trimester üçün xüsusi tövsiyələri idarə edin</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Tövsiyə
        </Button>
      </div>

      {/* Add New Tip Form */}
      {isAdding && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Yeni Tövsiyə Əlavə Et</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Trimester</Label>
                <Select
                  value={String(newTip.trimester)}
                  onValueChange={(v) => setNewTip({ ...newTip, trimester: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIMESTER_INFO.map((t) => (
                      <SelectItem key={t.value} value={String(t.value)}>
                        {t.emoji} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>İkon (emoji)</Label>
                <Input
                  value={newTip.icon}
                  onChange={(e) => setNewTip({ ...newTip, icon: e.target.value })}
                  placeholder="💡"
                />
              </div>
              <div className="space-y-2">
                <Label>Sıralama</Label>
                <Input
                  type="number"
                  value={newTip.sort_order}
                  onChange={(e) => setNewTip({ ...newTip, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tövsiyə Mətni</Label>
              <Textarea
                value={newTip.tip_text}
                onChange={(e) => setNewTip({ ...newTip, tip_text: e.target.value })}
                placeholder="Tövsiyə mətnini daxil edin..."
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newTip.is_active}
                onCheckedChange={(checked) => setNewTip({ ...newTip, is_active: checked })}
              />
              <Label>Aktiv</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createTip.isPending}>
                {createTip.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Yadda Saxla
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4 mr-2" />
                Ləğv Et
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips by Trimester Tabs */}
      <Tabs defaultValue="1">
        <TabsList className="grid w-full grid-cols-3">
          {TRIMESTER_INFO.map((t) => (
            <TabsTrigger key={t.value} value={String(t.value)} className="gap-2">
              <span>{t.emoji}</span>
              <span className="hidden sm:inline">{t.label}</span>
              <span className="text-xs text-muted-foreground">({getTipsByTrimester(t.value).length})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {TRIMESTER_INFO.map((trimesterInfo) => (
          <TabsContent key={trimesterInfo.value} value={String(trimesterInfo.value)} className="space-y-3 mt-4">
            {getTipsByTrimester(trimesterInfo.value).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Bu trimester üçün heç bir tövsiyə yoxdur
                </CardContent>
              </Card>
            ) : (
              getTipsByTrimester(trimesterInfo.value).map((tip) => (
                <Card key={tip.id} className={`${trimesterInfo.color} ${!tip.is_active ? 'opacity-50' : ''}`}>
                  <CardContent className="py-3">
                    {editingId === tip.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">İkon</Label>
                            <Input
                              value={editForm.icon}
                              onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Sıralama</Label>
                            <Input
                              type="number"
                              value={editForm.sort_order}
                              onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Mətn</Label>
                          <Textarea
                            value={editForm.tip_text}
                            onChange={(e) => setEditForm({ ...editForm, tip_text: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editForm.is_active}
                            onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                          />
                          <Label className="text-xs">Aktiv</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdate(tip.id)} disabled={updateTip.isPending}>
                            {updateTip.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">{tip.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{tip.tip_text}</p>
                          <p className="text-xs text-muted-foreground mt-1">Sıra: {tip.sort_order}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(tip)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(tip.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminTrimesterTips;
