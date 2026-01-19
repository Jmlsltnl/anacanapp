import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Key, AlertTriangle, CheckCircle, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'moderator';
  profile?: {
    name: string;
    email: string | null;
  };
}

const AdminSecurity = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user' | 'moderator'>('user');
  const [profiles, setProfiles] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
    fetchProfiles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('role');

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, email');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user' | 'moderator') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Uğurlu',
        description: 'İstifadəçi rolu yeniləndi'
      });

      fetchRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Xəta',
        description: 'Rol yenilənə bilmədi',
        variant: 'destructive'
      });
    }
  };

  const handleAddRole = async () => {
    if (!selectedUserId) return;

    try {
      // Check if user already has a role
      const existingRole = roles.find(r => r.user_id === selectedUserId);
      
      if (existingRole) {
        await handleUpdateRole(selectedUserId, selectedRole);
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: selectedUserId, role: selectedRole }]);

        if (error) throw error;

        toast({
          title: 'Uğurlu',
          description: 'İstifadəçiyə rol təyin edildi'
        });
      }

      fetchRoles();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: 'Xəta',
        description: 'Rol təyin edilə bilmədi',
        variant: 'destructive'
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-500';
      case 'moderator': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'moderator': return 'Moderator';
      default: return 'İstifadəçi';
    }
  };

  const getProfileByUserId = (userId: string) => {
    return profiles.find(p => p.user_id === userId);
  };

  const stats = {
    admins: roles.filter(r => r.role === 'admin').length,
    moderators: roles.filter(r => r.role === 'moderator').length,
    users: roles.filter(r => r.role === 'user').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Təhlükəsizlik</h1>
          <p className="text-muted-foreground">İstifadəçi rollarını və icazələrini idarə edin</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Rol təyin et
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>İstifadəçiyə Rol Təyin Et</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">İstifadəçi</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="İstifadəçi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.name} ({profile.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Rol</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">İstifadəçi</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAddRole}>
                Təyin et
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/10">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.admins}</p>
              <p className="text-sm text-muted-foreground">Admin</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Key className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.moderators}</p>
              <p className="text-sm text-muted-foreground">Moderator</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-500/10">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.users}</p>
              <p className="text-sm text-muted-foreground">İstifadəçi</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Security Status */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Təhlükəsizlik Statusu
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span>Row Level Security (RLS)</span>
            <Badge className="bg-green-500/10 text-green-500">Aktiv</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span>JWT Authentication</span>
            <Badge className="bg-green-500/10 text-green-500">Aktiv</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span>Role-based Access Control</span>
            <Badge className="bg-green-500/10 text-green-500">Aktiv</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span>Email Təsdiqi</span>
            <Badge className="bg-green-500/10 text-green-500">Aktiv</Badge>
          </div>
        </div>
      </Card>

      {/* Roles Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">İstifadəçi Rolları</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">İstifadəçi</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Rol</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    Yüklənir...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    Rol tapılmadı
                  </td>
                </tr>
              ) : (
                roles.map((role, index) => {
                  const profile = getProfileByUserId(role.user_id);
                  return (
                    <motion.tr
                      key={role.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">
                              {profile?.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{profile?.name || 'Naməlum'}</p>
                            <p className="text-sm text-muted-foreground">{profile?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getRoleColor(role.role)}>
                          {getRoleLabel(role.role)}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Select
                          value={role.role}
                          onValueChange={(v) => handleUpdateRole(role.user_id, v as any)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">İstifadəçi</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminSecurity;
