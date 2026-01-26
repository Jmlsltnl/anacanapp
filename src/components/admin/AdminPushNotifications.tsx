import { useState } from 'react';
import { Bell, Plus, Trash2, Edit, Send, Users, Baby, Heart, Moon, Clock, Calendar, Zap, Search, ChevronLeft, ChevronRight, Loader2, Filter, RefreshCw } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useScheduledNotifications, 
  useCreateScheduledNotification, 
  useUpdateScheduledNotification, 
  useDeleteScheduledNotification,
  useTriggerDailyNotifications,
  ScheduledNotification 
} from '@/hooks/useScheduledNotifications';
import {
  usePregnancyDayNotifications,
  useCreatePregnancyDayNotification,
  useUpdatePregnancyDayNotification,
  useDeletePregnancyDayNotification,
  useBulkPushNotifications,
  useCreateBulkPushNotification,
  useSendBulkPushNotification,
  useAudienceStats,
} from '@/hooks/useAdvancedNotifications';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const audienceLabels: Record<string, { label: string; icon: any; color: string }> = {
  all: { label: 'Hamı', icon: Users, color: 'bg-blue-500' },
  flow: { label: 'Menstruasiya', icon: Moon, color: 'bg-pink-500' },
  bump: { label: 'Hamilə', icon: Baby, color: 'bg-orange-500' },
  mommy: { label: 'Ana', icon: Heart, color: 'bg-red-500' },
  partner: { label: 'Partnyor', icon: Users, color: 'bg-purple-500' },
};

const AdminPushNotifications = () => {
  const [activeTab, setActiveTab] = useState('scheduled');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Push Bildirişləri</h2>
        <p className="text-muted-foreground">
          Bütün push notification sistemini buradan idarə edin
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Gündəlik
          </TabsTrigger>
          <TabsTrigger value="pregnancy" className="flex items-center gap-2">
            <Baby className="h-4 w-4" />
            Hamiləlik Günləri
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Bulk Göndər
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scheduled" className="mt-6">
          <ScheduledNotificationsTab />
        </TabsContent>

        <TabsContent value="pregnancy" className="mt-6">
          <PregnancyDayNotificationsTab />
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <BulkPushTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ==================== SCHEDULED NOTIFICATIONS TAB ====================
const ScheduledNotificationsTab = () => {
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
        await updateNotification.mutateAsync({ id: editingNotification.id, ...form });
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
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Card className="p-4 bg-blue-500/10 border-blue-500/20 flex-1 mr-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-600 dark:text-blue-400">Avtomatik Göndərmə</h4>
              <p className="text-sm text-muted-foreground">09:00-00:00 arası, 2-3 saat fasilə ilə</p>
            </div>
          </div>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTriggerNow} disabled={triggerDaily.isPending}>
            <Send className="h-4 w-4 mr-2" />
            İndi Test Et
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni
          </Button>
        </div>
      </div>

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
                      <Badge variant="outline" className="text-xs">{audience.label}</Badge>
                      <Badge className={notification.is_active ? 'bg-green-500/10 text-green-600' : ''} variant={notification.is_active ? 'default' : 'secondary'}>
                        {notification.is_active ? 'Aktiv' : 'Deaktiv'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.body}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={notification.is_active ?? true} onCheckedChange={() => handleToggleActive(notification)} />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(notification)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setDeleteDialog(notification.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {notifications.length === 0 && <EmptyState onAdd={handleCreate} />}
      </div>

      <NotificationDialog
        open={editDialog}
        onOpenChange={setEditDialog}
        isEditing={!!editingNotification}
        form={form}
        setForm={setForm}
        onSave={handleSave}
        isLoading={createNotification.isPending || updateNotification.isPending}
      />

      <DeleteConfirmDialog
        open={deleteDialog !== null}
        onOpenChange={() => setDeleteDialog(null)}
        onConfirm={() => deleteDialog && handleDelete(deleteDialog)}
      />
    </div>
  );
};

// ==================== PREGNANCY DAY NOTIFICATIONS TAB ====================
const PregnancyDayNotificationsTab = () => {
  const { data: notifications = [], isLoading } = usePregnancyDayNotifications();
  const createNotification = useCreatePregnancyDayNotification();
  const updateNotification = useUpdatePregnancyDayNotification();
  const deleteNotification = useDeletePregnancyDayNotification();

  const [searchDay, setSearchDay] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    day_number: 0,
    title: '',
    body: '',
    emoji: '👶',
    is_active: true,
  });

  const DAYS_PER_PAGE = 28; // 4 weeks per page
  const totalPages = Math.ceil(281 / DAYS_PER_PAGE);

  // Create a map of existing notifications
  const notificationMap = new Map(notifications.map(n => [n.day_number, n]));

  // Generate days for current page
  const startDay = currentPage * DAYS_PER_PAGE;
  const endDay = Math.min(startDay + DAYS_PER_PAGE, 281);
  const daysInPage = Array.from({ length: endDay - startDay }, (_, i) => startDay + i);

  // Search filter
  const filteredDays = searchDay
    ? [parseInt(searchDay)].filter(d => d >= 0 && d <= 280)
    : daysInPage;

  const handleCreate = (dayNumber: number) => {
    setEditingId(null);
    setForm({
      day_number: dayNumber,
      title: `Hamiləliyin ${dayNumber}-ci günü 🌟`,
      body: '',
      emoji: '👶',
      is_active: true,
    });
    setEditDialog(true);
  };

  const handleEdit = (notification: any) => {
    setEditingId(notification.id);
    setForm({
      day_number: notification.day_number,
      title: notification.title,
      body: notification.body,
      emoji: notification.emoji || '👶',
      is_active: notification.is_active ?? true,
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.body) {
      toast.error('Başlıq və mətn tələb olunur');
      return;
    }
    try {
      if (editingId) {
        await updateNotification.mutateAsync({ id: editingId, ...form });
        toast.success('Bildiriş yeniləndi');
      } else {
        await createNotification.mutateAsync(form);
        toast.success('Bildiriş yaradıldı');
      }
      setEditDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Xəta baş verdi');
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

  const getWeekNumber = (day: number) => Math.floor(day / 7) + 1;
  const getTrimester = (day: number) => {
    if (day < 84) return { num: 1, color: 'bg-pink-500' };
    if (day < 182) return { num: 2, color: 'bg-orange-500' };
    return { num: 3, color: 'bg-purple-500' };
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{notifications.length}</div>
          <div className="text-sm text-muted-foreground">Əlavə Edilib</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-orange-500">281</div>
          <div className="text-sm text-muted-foreground">Toplam Gün</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-500">{notifications.filter(n => n.is_active).length}</div>
          <div className="text-sm text-muted-foreground">Aktiv</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-muted-foreground">{281 - notifications.length}</div>
          <div className="text-sm text-muted-foreground">Boş Gün</div>
        </Card>
      </div>

      {/* Search & Pagination */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Gün nömrəsi axtar (0-280)..."
            value={searchDay}
            onChange={(e) => setSearchDay(e.target.value.replace(/\D/g, ''))}
            className="max-w-[200px]"
            type="number"
            min={0}
            max={280}
          />
          {searchDay && (
            <Button variant="ghost" size="sm" onClick={() => setSearchDay('')}>
              Sıfırla
            </Button>
          )}
        </div>

        {!searchDay && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[100px] text-center">
              Gün {startDay} - {endDay - 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Days Grid */}
      <ScrollArea className="h-[500px]">
        <div className="grid grid-cols-7 gap-2">
          {filteredDays.map((day) => {
            const notification = notificationMap.get(day);
            const trimester = getTrimester(day);
            const week = getWeekNumber(day);

            return (
              <Card
                key={day}
                className={`p-3 cursor-pointer transition-all hover:scale-105 ${
                  notification
                    ? notification.is_active
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-muted/30 border-dashed'
                }`}
                onClick={() => notification ? handleEdit(notification) : handleCreate(day)}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Badge variant="outline" className={`text-[10px] px-1 ${trimester.color}/10 border-0`}>
                      H{week}
                    </Badge>
                  </div>
                  <div className="text-lg font-bold">{day}</div>
                  {notification ? (
                    <div className="text-xl">{notification.emoji}</div>
                  ) : (
                    <div className="text-xl opacity-30">+</div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
          <span>Əlavə Edilib</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30" />
          <span>Deaktiv</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/30 border border-dashed" />
          <span>Boş</span>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-orange-500" />
              Gün {form.day_number} - Həftə {getWeekNumber(form.day_number)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gün Nömrəsi</Label>
                <Input
                  type="number"
                  min={0}
                  max={280}
                  value={form.day_number}
                  onChange={(e) => setForm({ ...form, day_number: parseInt(e.target.value) || 0 })}
                  disabled={!!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label>Emoji</Label>
                <Input
                  value={form.emoji}
                  onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                  placeholder="👶"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Başlıq</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Hamiləliyin 14-cü günü 🌟"
              />
            </div>

            <div className="space-y-2">
              <Label>Mətn</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Bu gün körpəniz inkişaf edir..."
                rows={4}
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

          <DialogFooter className="flex justify-between">
            {editingId && (
              <Button
                variant="destructive"
                onClick={() => {
                  setEditDialog(false);
                  setDeleteDialog(editingId);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialog(false)}>Ləğv et</Button>
              <Button onClick={handleSave} disabled={createNotification.isPending || updateNotification.isPending}>
                {editingId ? 'Yenilə' : 'Yarat'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteDialog !== null}
        onOpenChange={() => setDeleteDialog(null)}
        onConfirm={() => deleteDialog && handleDelete(deleteDialog)}
      />
    </div>
  );
};

// ==================== BULK PUSH TAB ====================
const BulkPushTab = () => {
  const { data: history = [], isLoading, refetch: refetchHistory } = useBulkPushNotifications();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAudienceStats();
  const createBulk = useCreateBulkPushNotification();
  const sendBulk = useSendBulkPushNotification();

  const [form, setForm] = useState({
    title: '',
    body: '',
    target_audience: 'all',
  });
  const [isSending, setIsSending] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const getTargetStats = (audience: string) => {
    if (!stats) return { users: 0, tokens: 0 };
    return stats.by_audience[audience as keyof typeof stats.by_audience] || { users: 0, tokens: 0 };
  };

  const currentTargetStats = getTargetStats(form.target_audience);

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const { data, error } = await supabase
        .from('device_tokens')
        .select(`
          id,
          token,
          platform,
          device_name,
          created_at,
          updated_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get profile info for each device
      const userIds = [...new Set(data?.map(d => d.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, life_stage, role')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      setDevices(data?.map(d => ({
        ...d,
        profile: profileMap.get(d.user_id) || null
      })) || []);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Cihaz siyahısı yüklənmədi');
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleRefreshStats = async () => {
    await Promise.all([refetchStats(), refetchHistory()]);
    toast.success('Statistika yeniləndi');
  };

  const handleSendNow = async () => {
    if (!form.title || !form.body) {
      toast.error('Başlıq və mətn tələb olunur');
      return;
    }

    if (currentTargetStats.tokens === 0) {
      toast.error('Seçilmiş auditoriyada heç bir qeydiyyatlı cihaz yoxdur!');
      return;
    }

    setIsSending(true);
    try {
      // Create the bulk notification record
      const notification = await createBulk.mutateAsync(form);
      
      // Trigger send
      const result = await sendBulk.mutateAsync(notification.id);
      
      if (result.sent > 0) {
        toast.success(`${result.sent} cihaza göndərildi!`);
      } else {
        toast.warning('Heç bir cihaza göndərilə bilmədi. Qeydiyyatlı cihaz yoxdur.');
      }
      setForm({ title: '', body: '', target_audience: 'all' });
      refetchHistory();
    } catch (error: any) {
      toast.error(error.message || 'Göndərmə xətası');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading || statsLoading) {
    return <LoadingSpinner />;
  }

  const audienceOptions = [
    { value: 'all', label: '🌍 Hamı', color: 'bg-blue-500' },
    { value: 'flow', label: '🌙 Menstruasiya', color: 'bg-pink-500' },
    { value: 'bump', label: '🤰 Hamilə', color: 'bg-orange-500' },
    { value: 'mommy', label: '👩‍👧 Ana', color: 'bg-red-500' },
    { value: 'partner', label: '💑 Partnyor', color: 'bg-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Global Stats */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Push Statistikası</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => { setShowDevices(!showDevices); if (!showDevices) loadDevices(); }}
          >
            📱 Cihazlar ({stats?.users_with_tokens || 0})
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshStats}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Yenilə
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary">{stats?.total_users || 0}</div>
          <div className="text-sm text-muted-foreground">Ümumi İstifadəçi</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-green-500">{stats?.users_with_tokens || 0}</div>
          <div className="text-sm text-muted-foreground">Qeydiyyatlı Cihaz</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-yellow-500">
            {stats?.total_users ? Math.round((stats.users_with_tokens / stats.total_users) * 100) : 0}%
          </div>
          <div className="text-sm text-muted-foreground">Əhatə Dairəsi</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-blue-500">{history.length}</div>
          <div className="text-sm text-muted-foreground">Göndərilmiş Kampaniya</div>
        </Card>
      </div>

      {/* Device List */}
      {showDevices && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Qeydiyyatlı Cihazlar</h4>
            <Button variant="ghost" size="sm" onClick={loadDevices} disabled={loadingDevices}>
              {loadingDevices ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          {loadingDevices ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Heç bir cihaz qeydiyyatda deyil</p>
              <p className="text-xs mt-1">İstifadəçilər mobil tətbiqi açmalı və bildiriş icazəsi verməlidir</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {device.platform === 'ios' ? '🍎' : '🤖'}
                      </span>
                      <div>
                        <div className="font-medium">{device.profile?.name || 'İsimsiz'}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {device.profile?.life_stage || 'unknown'}
                          </Badge>
                          <span>{device.platform}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>Token: ...{device.token.slice(-8)}</div>
                      <div>{new Date(device.created_at).toLocaleDateString('az-AZ')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </Card>
      )}

      {/* Audience Breakdown */}
      <Card className="p-4">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Auditoriya Statistikası
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {audienceOptions.map(({ value, label, color }) => {
            const audienceStats = getTargetStats(value);
            const percentage = audienceStats.users > 0 ? Math.round((audienceStats.tokens / audienceStats.users) * 100) : 0;
            return (
              <div 
                key={value} 
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  form.target_audience === value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-transparent bg-muted/50 hover:bg-muted'
                }`}
                onClick={() => setForm({ ...form, target_audience: value })}
              >
                <div className="text-sm font-medium mb-1">{label}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{audienceStats.users} 👤</span>
                  <span className="text-green-500">{audienceStats.tokens} 📱</span>
                </div>
                <Progress value={percentage} className="h-1 mt-2" />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Send Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Bulk Push Göndər
        </h3>

        <div className="space-y-4">
          {/* Target Preview */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {form.target_audience === 'all' ? '🌍' : 
                 form.target_audience === 'flow' ? '🌙' :
                 form.target_audience === 'bump' ? '🤰' :
                 form.target_audience === 'mommy' ? '👩‍👧' : '💑'}
              </div>
              <div>
                <div className="font-medium">
                  {audienceOptions.find(a => a.value === form.target_audience)?.label || 'Hamı'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentTargetStats.tokens > 0 
                    ? `${currentTargetStats.tokens} cihaza göndəriləcək`
                    : '⚠️ Bu auditoriyada qeydiyyatlı cihaz yoxdur!'
                  }
                </div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentTargetStats.tokens > 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
            }`}>
              {currentTargetStats.tokens} 📱
            </div>
          </div>

          <div className="space-y-2">
            <Label>Hədəf Auditoriya</Label>
            <Select value={form.target_audience} onValueChange={(v) => setForm({ ...form, target_audience: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audienceOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label} ({getTargetStats(value).tokens} cihaz)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Başlıq</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="🎉 Xüsusi Xəbər!"
            />
          </div>

          <div className="space-y-2">
            <Label>Mətn</Label>
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Bütün istifadəçilərə göndəriləcək mesaj..."
              rows={4}
            />
          </div>

          <Button 
            className="w-full" 
            size="lg" 
            onClick={handleSendNow}
            disabled={isSending || !form.title || !form.body || currentTargetStats.tokens === 0}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Göndərilir...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {currentTargetStats.tokens} Cihaza Göndər
              </>
            )}
          </Button>

          {currentTargetStats.tokens === 0 && (
            <p className="text-sm text-center text-amber-500">
              ⚠️ Bu auditoriyada push notification almaq üçün qeydiyyatdan keçmiş cihaz yoxdur. 
              İstifadəçilər tətbiqi mobil cihazlarından açmalı və bildiriş icazəsi verməlidir.
            </p>
          )}
        </div>
      </Card>

      {/* History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Göndərilmə Tarixçəsi</h3>
        
        {history.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Hələ heç bir bulk bildiriş göndərilməyib</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((item: any) => {
              const total = item.total_sent + item.total_failed;
              const successRate = total > 0 ? Math.round((item.total_sent / total) * 100) : 0;
              
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge variant="outline">
                          {audienceLabels[item.target_audience]?.label || 'Hamı'}
                        </Badge>
                        <Badge className={
                          item.status === 'sent' ? 'bg-green-500/10 text-green-600' :
                          item.status === 'sending' ? 'bg-yellow-500/10 text-yellow-600' :
                          item.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                          'bg-muted text-muted-foreground'
                        }>
                          {item.status === 'sent' ? 'Göndərildi' :
                           item.status === 'sending' ? 'Göndərilir...' :
                           item.status === 'failed' ? 'Xəta' : 'Gözləyir'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.body}</p>
                      
                      {/* Statistics */}
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-green-600">✅ {item.total_sent} göndərildi</span>
                        {item.total_failed > 0 && (
                          <span className="text-red-500">❌ {item.total_failed} uğursuz</span>
                        )}
                        {total > 0 && (
                          <span className="text-muted-foreground">
                            📊 {successRate}% uğurlu
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          🕐 {new Date(item.created_at).toLocaleString('az-AZ')}
                        </span>
                      </div>
                      
                      {/* Progress bar for large sends */}
                      {total > 0 && (
                        <div className="mt-2">
                          <Progress value={successRate} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== SHARED COMPONENTS ====================
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const EmptyState = ({ onAdd }: { onAdd: () => void }) => (
  <Card className="p-8 text-center">
    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h3 className="font-medium mb-2">Bildiriş Yoxdur</h3>
    <p className="text-sm text-muted-foreground mb-4">Gündəlik avtomatik bildirişlər əlavə edin</p>
    <Button onClick={onAdd}>
      <Plus className="h-4 w-4 mr-2" />
      İlk Bildirişi Yarat
    </Button>
  </Card>
);

const NotificationDialog = ({
  open,
  onOpenChange,
  isEditing,
  form,
  setForm,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  form: any;
  setForm: (form: any) => void;
  onSave: () => void;
  isLoading: boolean;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Bildirişi Redaktə Et' : 'Yeni Bildiriş'}</DialogTitle>
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
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Hamı</SelectItem>
                <SelectItem value="flow">Menstruasiya</SelectItem>
                <SelectItem value="bump">Hamilə</SelectItem>
                <SelectItem value="mommy">Ana</SelectItem>
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

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <Label>Aktiv</Label>
          <Switch
            checked={form.is_active}
            onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Ləğv et</Button>
        <Button onClick={onSave} disabled={isLoading}>
          {isEditing ? 'Yenilə' : 'Yarat'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const DeleteConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Bildirişi Silmək?</AlertDialogTitle>
        <AlertDialogDescription>Bu əməliyyat geri qaytarıla bilməz.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Ləğv et</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-red-500 hover:bg-red-600">Sil</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default AdminPushNotifications;
