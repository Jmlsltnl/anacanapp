import { useState } from 'react';
import { useAllDevelopmentTips, useDevelopmentTipsMutations, DevelopmentTip } from '@/hooks/useDevelopmentTips';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const AGE_GROUPS = [
  { value: 'newborn', label: 'Yenidoğan (0-3 ay)' },
  { value: 'infant', label: 'Körpə (3-6 ay)' },
  { value: 'older', label: 'Böyük (6+ ay)' },
];

const EMOJIS = ['👁️', '🎵', '🤲', '🧸', '📖', '🎶', '🥣', '🚶', '🗣️', '💪', '🌟', '❤️'];

const AdminDevelopmentTips = () => {
  const { data: tips = [], isLoading } = useAllDevelopmentTips();
  const { createTip, updateTip, deleteTip } = useDevelopmentTipsMutations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DevelopmentTip>>({});

  const handleCreate = () => {
    createTip.mutate({
      age_group: 'newborn',
      emoji: '🌟',
      title: 'New Tip',
      title_az: 'Yeni Tövsiyə',
      content: 'Tip content',
      content_az: 'Tövsiyə mətni',
      sort_order: tips.length + 1,
      is_active: true,
    }, {
      onSuccess: () => toast.success('Əlavə edildi'),
      onError: () => toast.error('Xəta baş verdi'),
    });
  };

  const handleUpdate = (id: string) => {
    updateTip.mutate({ id, ...formData }, {
      onSuccess: () => {
        toast.success('Yeniləndi');
        setEditingId(null);
        setFormData({});
      },
      onError: () => toast.error('Xəta baş verdi'),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Silmək istədiyinizə əminsiniz?')) {
      deleteTip.mutate(id, {
        onSuccess: () => toast.success('Silindi'),
        onError: () => toast.error('Xəta baş verdi'),
      });
    }
  };

  const startEdit = (tip: DevelopmentTip) => {
    setEditingId(tip.id);
    setFormData(tip);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  if (isLoading) return <div className="p-4">Yüklənir...</div>;

  // Group by age_group
  const grouped = tips.reduce((acc, tip) => {
    if (!acc[tip.age_group]) acc[tip.age_group] = [];
    acc[tip.age_group].push(tip);
    return acc;
  }, {} as Record<string, DevelopmentTip[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">İnkişaf Tövsiyələri</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Yeni
        </Button>
      </div>

      {AGE_GROUPS.map(({ value, label }) => (
        <Card key={value}>
          <CardHeader className="py-3">
            <CardTitle className="text-lg">{label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(grouped[value] || []).map((tip) => (
              <div key={tip.id} className="p-3 bg-muted/50 rounded-lg">
                {editingId === tip.id ? (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Select
                        value={formData.emoji || tip.emoji}
                        onValueChange={(v) => setFormData({ ...formData, emoji: v })}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMOJIS.map((e) => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={formData.title_az ?? tip.title_az ?? ''}
                        onChange={(e) => setFormData({ ...formData, title_az: e.target.value })}
                        placeholder="Başlıq (AZ)"
                        className="flex-1"
                      />
                      <Select
                        value={formData.age_group || tip.age_group}
                        onValueChange={(v) => setFormData({ ...formData, age_group: v })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_GROUPS.map((ag) => (
                            <SelectItem key={ag.value} value={ag.value}>{ag.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      value={formData.content_az ?? tip.content_az ?? ''}
                      onChange={(e) => setFormData({ ...formData, content_az: e.target.value })}
                      placeholder="Mətn (AZ)"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.sort_order ?? tip.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                        className="w-20"
                        placeholder="Sıra"
                      />
                      <Button size="sm" onClick={() => handleUpdate(tip.id)}>
                        <Save className="w-4 h-4 mr-1" />
                        Yadda saxla
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{tip.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium">{tip.title_az || tip.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tip.content_az || tip.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">#{tip.sort_order}</span>
                      <Switch
                        checked={tip.is_active}
                        onCheckedChange={(checked) => updateTip.mutate({ id: tip.id, is_active: checked })}
                      />
                      <Button size="sm" variant="ghost" onClick={() => startEdit(tip)}>
                        Redaktə
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(tip.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {(!grouped[value] || grouped[value].length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Bu yaş qrupu üçün tövsiyə yoxdur
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminDevelopmentTips;
