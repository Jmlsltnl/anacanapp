import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MoreVertical, Shield, User, Trash2, Edit, Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  life_stage: string | null;
  partner_code: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator' | 'user'>('user');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    fetchUserRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Xəta',
        description: 'İstifadəçilər yüklənə bilmədi',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const getUserRole = (userId: string): 'admin' | 'moderator' | 'user' => {
    const role = userRoles.find(r => r.user_id === userId);
    if (role?.role === 'admin') return 'admin';
    if (role?.role === 'moderator') return 'moderator';
    return 'user';
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Uğurlu',
        description: 'İstifadəçi məlumatları yeniləndi'
      });

      fetchUsers();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Xəta',
        description: 'İstifadəçi yenilənə bilmədi',
        variant: 'destructive'
      });
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;

    try {
      // Check if user already has a role entry
      const existingRole = userRoles.find(r => r.user_id === selectedUser.user_id);

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: selectedRole })
          .eq('user_id', selectedUser.user_id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: selectedUser.user_id, role: selectedRole }]);

        if (error) throw error;
      }

      toast({
        title: 'Uğurlu',
        description: `${selectedUser.name} üçün ${getRoleLabel(selectedRole)} rolu təyin edildi`
      });

      fetchUserRoles();
      setRoleDialogOpen(false);
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Xəta',
        description: 'Rol təyin edilə bilmədi',
        variant: 'destructive'
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLifeStageLabel = (stage: string | null) => {
    switch (stage) {
      case 'flow': return 'Menstruasiya';
      case 'bump': return 'Hamiləlik';
      case 'mommy': return 'Analıq';
      case 'partner': return 'Partnyor';
      default: return 'Müəyyən edilməyib';
    }
  };

  const getLifeStageColor = (stage: string | null) => {
    switch (stage) {
      case 'flow': return 'bg-pink-500/10 text-pink-500';
      case 'bump': return 'bg-purple-500/10 text-purple-500';
      case 'mommy': return 'bg-green-500/10 text-green-500';
      case 'partner': return 'bg-blue-500/10 text-blue-500';
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'moderator': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-3 h-3" />;
      case 'moderator': return <Shield className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">İstifadəçilər</h1>
          <p className="text-muted-foreground">Bütün istifadəçiləri idarə edin</p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {users.length} istifadəçi
        </Badge>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ad və ya email ilə axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">İstifadəçi</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Mərhələ</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Rol</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Partner Kodu</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Tarix</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Yüklənir...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    İstifadəçi tapılmadı
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const userRole = getUserRole(user.user_id);
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getLifeStageColor(user.life_stage)}>
                          {getLifeStageLabel(user.life_stage)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={`${getRoleColor(userRole)} flex items-center gap-1 w-fit`}>
                          {getRoleIcon(userRole)}
                          {getRoleLabel(userRole)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {user.partner_code || '-'}
                        </code>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('az-AZ')}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setEditDialogOpen(true);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Redaktə et
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedUser(user);
                              setSelectedRole(getUserRole(user.user_id));
                              setRoleDialogOpen(true);
                            }}>
                              <Shield className="w-4 h-4 mr-2" />
                              Rol təyin et
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İstifadəçini Redaktə Et</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Ad</label>
                <Input
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Mərhələ</label>
                <Select
                  value={selectedUser.life_stage || ''}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, life_stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mərhələ seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flow">Menstruasiya</SelectItem>
                    <SelectItem value="bump">Hamiləlik</SelectItem>
                    <SelectItem value="mommy">Analıq</SelectItem>
                    <SelectItem value="partner">Partnyor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => handleUpdateUser(selectedUser.id, {
                  name: selectedUser.name,
                  life_stage: selectedUser.life_stage
                })}
              >
                Yadda saxla
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Role Assignment Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rol Təyin Et</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">
                    {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Rol seçin</label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as 'admin' | 'moderator' | 'user')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        İstifadəçi
                      </div>
                    </SelectItem>
                    <SelectItem value="moderator">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        Moderator
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-red-500" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ Admin rollu istifadəçilər bütün sistem funksiyalarına tam giriş əldə edəcək.
                </p>
              </div>

              <Button className="w-full" onClick={handleAssignRole}>
                Rolu Təyin Et
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
