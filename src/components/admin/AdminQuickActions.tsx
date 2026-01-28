import { useState } from 'react';
import { useAllQuickActions, useQuickActionsMutations, QuickAction } from '@/hooks/useQuickActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const ICONS = ['Baby', 'Thermometer', 'Music', 'AlertCircle', 'Sparkles', 'BookOpen', 'Camera', 'Stethoscope', 'Heart', 'Star'];
const AGE_GROUPS = ['newborn', 'infant', 'older', 'all'];
const LIFE_STAGES = ['mommy', 'bump', 'flow'];

const AdminQuickActions = () => {
  const { data: actions = [], isLoading } = useAllQuickActions();
  const { createAction, updateAction, deleteAction } = useQuickActionsMutations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<QuickAction>>({});

  const handleCreate = () => {
    createAction.mutate({
      life_stage: 'mommy',
      age_group: 'all',
      icon: 'Star',
      label: 'New Action',
      label_az: 'Yeni',
      tool_key: 'new-tool',
      color_from: 'blue-400',
      color_to: 'blue-600',
      sort_order: actions.length + 1,
      is_active: true,
    }, {
      onSuccess: () => toast.success('Əlavə edildi'),
      onError: () => toast.error('Xəta baş verdi'),
    });
  };

  const handleUpdate = (id: string) => {
    updateAction.mutate({ id, ...formData }, {
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
      deleteAction.mutate(id, {
        onSuccess: () => toast.success('Silindi'),
        onError: () => toast.error('Xəta baş verdi'),
      });
    }
  };

  const startEdit = (action: QuickAction) => {
    setEditingId(action.id);
    setFormData(action);
  };

  if (isLoading) return <div className="p-4">Yüklənir...</div>;

  // Group by life_stage and age_group
  const grouped = actions.reduce((acc, action) => {
    const key = `${action.life_stage}-${action.age_group}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sürətli Keçidlər</h2>
        <Button onClick={handleCreate} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Yeni
        </Button>
      </div>

      {Object.entries(grouped).map(([key, groupActions]) => (
        <Card key={key}>
          <CardHeader className="py-3">
            <CardTitle className="text-lg capitalize">
              {key.replace('-', ' → ')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupActions.map((action) => (
              <div key={action.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {editingId === action.id ? (
                  <>
                    <Select
                      value={formData.icon || action.icon}
                      onValueChange={(v) => setFormData({ ...formData, icon: v })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={formData.label_az ?? action.label_az ?? ''}
                      onChange={(e) => setFormData({ ...formData, label_az: e.target.value })}
                      placeholder="Azərbaycanca"
                      className="flex-1"
                    />
                    <Input
                      value={formData.tool_key ?? action.tool_key}
                      onChange={(e) => setFormData({ ...formData, tool_key: e.target.value })}
                      placeholder="Tool key"
                      className="w-32"
                    />
                    <Select
                      value={formData.age_group || action.age_group}
                      onValueChange={(v) => setFormData({ ...formData, age_group: v })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_GROUPS.map((ag) => (
                          <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={formData.sort_order ?? action.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                      className="w-16"
                    />
                    <Button size="sm" onClick={() => handleUpdate(action.id)}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${action.color_from} to-${action.color_to} flex items-center justify-center text-white text-xs font-bold`}>
                      {action.icon.slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{action.label_az || action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.tool_key}</p>
                    </div>
                    <span className="text-xs bg-primary/10 px-2 py-1 rounded">{action.age_group}</span>
                    <Switch
                      checked={action.is_active}
                      onCheckedChange={(checked) => updateAction.mutate({ id: action.id, is_active: checked })}
                    />
                    <Button size="sm" variant="ghost" onClick={() => startEdit(action)}>
                      Redaktə
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(action.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminQuickActions;
