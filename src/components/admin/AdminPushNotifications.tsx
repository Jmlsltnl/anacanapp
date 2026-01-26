import { useState } from 'react';
import { Bell, Plus, Trash2, Edit, Send, Users, Baby, Heart, Moon, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  useScheduledNotifications, 
  useCreateScheduledNotification, 
  useUpdateScheduledNotification, 
  useDeleteScheduledNotification,
  useTriggerDailyNotifications,
  ScheduledNotification 
} from '@/hooks/useScheduledNotifications';
import { toast } from 'sonner';

const audienceLabels: Record<string, { label: string; icon: any; color: string }> = {
  all: { label: 'Hamı', icon: Users, color: 'bg-blue-500' },
  flow: { label: 'Menstruasiya', icon: Moon, color: 'bg-pink-500' },
  bump: { label: 'Hamilə', icon: Baby, color: 'bg-orange-500' },
  mommy: { label: 'Ana', icon: Heart, color: 'bg-red-500' },
  partner: { label: 'Partnyor', icon: Users, color: 'bg-purple-500' },
};

const AdminPushNotifications = () => {
  const { data: notifications = [], isLoading } = useScheduledNotifications();
  const createNotification = useCreateScheduledNotification();
  const updateNotification = useUpdateScheduledNotification();
  const deleteNotification = useDeleteScheduledNotification();
  const triggerDaily = useTriggerDailyNotifications();

  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [form, setForm] = useState({
    title: '',
    body: '',
    target_audience: 'all',
    notification_type: 'daily_tip',
    priority: 1,
    is_active: true,
  });

  const handleCreate = () => {
    setEditingNotification(null);
    setForm({
      title: '',
      body: '',
      target_audience: 'all',
      notification_type: 'daily_tip',
      priority: 1,
      is_active: true,
    });
    setEditDialog(true);
  };

  const handleEdit = (notification: ScheduledNotification) => {
    setEditingNotification(notification);
    setForm({
      title: notification.title,
      body: notification.body,
      target_audience: notification.target_audience,
      notification_type: notification.notification_type || 'daily_tip',
      priority: notification.priority || 1,
      is_active: notification.is_active ?? true,
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editingNotification) {
        await updateNotification.mutateAsync({
          id: editingNotification.id,
          ...form,
        });
        toast.success('Bildiriş yeniləndi');
      } else {
        await createNotification.mutateAsync(form);
        toast.success('Bildiriş yaradıldı');
      }
      setEditDialog(false);
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification.mutateAsync(id);
      toast.success('Bildiriş silindi');
      setDeleteDialog(null);
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const handleToggleActive = async (notification: ScheduledNotification) => {
    try {
      await updateNotification.mutateAsync({
        id: notification.id,
        is_active: !notification.is_active,
      });
      toast.success(notification.is_active ? 'Bildiriş deaktiv edildi' : 'Bildiriş aktivləşdirildi');
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const handleTriggerNow = async () => {
    try {
      await triggerDaily.mutateAsync();
      toast.success('Bildirişlər göndərildi!');
    } catch (error) {
      toast.error('Bildiriş göndərmə xətası');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Push Bildirişləri</h2>
          <p className="text-muted-foreground">
            Avtomatik gündəlik bildirişləri idarə edin (09:00 - 00:00 arası, 2-3 saat fasilə ilə)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTriggerNow} disabled={triggerDaily.isPending}>
            <Send className="h-4 w-4 mr-2" />
            İndi Göndər
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Bildiriş
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-600 dark:text-blue-400">Avtomatik Göndərmə Qaydaları</h4>
            <ul className="text-sm text-muted-foreground mt-1 space-y-1">
              <li>• Bildirişlər hər gün səhər 09:00-dan gecə 00:00-a qədər göndərilir</li>
              <li>• Hər istifadəçiyə ən azı 2-3 saat fasilə ilə bildiriş göndərilir</li>
              <li>• Push-a icazə vermiş istifadəçilərə göndərilir</li>
              <li>• Prioritet nömrəsi kiçik olan bildirişlər daha tez göndərilir</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="grid gap-4">
        {notifications.map((notification) => {
          const audience = audienceLabels[notification.target_audience] || audienceLabels.all;
          const Icon = audience.icon;

          return (
            <Card key={notification.id} className={`p-4 ${!notification.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${audience.color}/10`}>
                    <Icon className={`h-5 w-5 ${audience.color.replace('bg-', 'text-')}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{notification.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {audience.label}
                      </Badge>
                      {notification.is_active ? (
                        <Badge className="bg-green-500/10 text-green-600 text-xs">Aktiv</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Deaktiv</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.body}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Prioritet: {notification.priority}</span>
                      <span>Növ: {notification.notification_type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={notification.is_active ?? true}
                    onCheckedChange={() => handleToggleActive(notification)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(notification)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setDeleteDialog(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {notifications.length === 0 && (
          <Card className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Bildiriş Yoxdur</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Gündəlik avtomatik bildirişlər əlavə edin
            </p>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              İlk Bildirişi Yarat
            </Button>
          </Card>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNotification ? 'Bildirişi Redaktə Et' : 'Yeni Bildiriş'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Başlıq</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Günün Xatırlatması 💧"
              />
            </div>

            <div className="space-y-2">
              <Label>Mətn</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Su içməyi unutma!"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hədəf Auditoriya</Label>
                <Select value={form.target_audience} onValueChange={(v) => setForm({ ...form, target_audience: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Hamı</SelectItem>
                    <SelectItem value="flow">Menstruasiya (Flow)</SelectItem>
                    <SelectItem value="bump">Hamilə (Bump)</SelectItem>
                    <SelectItem value="mommy">Ana (Mommy)</SelectItem>
                    <SelectItem value="partner">Partnyor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioritet (1-10)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Bildiriş Növü</Label>
              <Input
                value={form.notification_type}
                onChange={(e) => setForm({ ...form, notification_type: e.target.value })}
                placeholder="daily_tip"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Label>Aktiv</Label>
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Ləğv et
            </Button>
            <Button onClick={handleSave} disabled={createNotification.isPending || updateNotification.isPending}>
              {editingNotification ? 'Yenilə' : 'Yarat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bildirişi Silmək?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu əməliyyat geri qaytarıla bilməz. Bildiriş həmişəlik silinəcək.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDialog && handleDelete(deleteDialog)} className="bg-red-500 hover:bg-red-600">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPushNotifications;
