import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Crown, User, Calendar, MoreHorizontal, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addMonths, addYears } from 'date-fns';

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  is_premium: boolean;
  premium_until: string | null;
  badge_type: string;
  life_stage: string;
  created_at: string;
}

const AdminSubscriptions = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'premium' | 'free'>('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [premiumDuration, setPremiumDuration] = useState<'1_month' | '3_months' | '1_year' | 'lifetime'>('1_month');

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const grantPremium = async () => {
    if (!selectedUser) return;

    let premiumUntil: Date | null = null;
    switch (premiumDuration) {
      case '1_month':
        premiumUntil = addMonths(new Date(), 1);
        break;
      case '3_months':
        premiumUntil = addMonths(new Date(), 3);
        break;
      case '1_year':
        premiumUntil = addYears(new Date(), 1);
        break;
      case 'lifetime':
        premiumUntil = null; // null means lifetime
        break;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_until: premiumUntil?.toISOString() || null,
        badge_type: 'premium',
      })
      .eq('id', selectedUser.id);

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uğurlu', description: `${selectedUser.name} üçün Premium aktivləşdirildi` });
      setShowModal(false);
      setSelectedUser(null);
      fetchUsers();
    }
  };

  const revokePremium = async (user: UserProfile) => {
    if (!confirm(`${user.name} üçün Premium-u ləğv etmək istəyirsiniz?`)) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        is_premium: false,
        premium_until: null,
        badge_type: 'user',
      })
      .eq('id', user.id);

    if (error) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Uğurlu', description: `${user.name} üçün Premium ləğv edildi` });
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'premium') return matchesSearch && user.is_premium;
    if (filter === 'free') return matchesSearch && !user.is_premium;
    return matchesSearch;
  });

  const premiumCount = users.filter(u => u.is_premium).length;
  const freeCount = users.filter(u => !u.is_premium).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold">Abunəlik İdarəetməsi</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ümumi</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Premium</p>
              <p className="text-2xl font-bold">{premiumCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pulsuz</p>
              <p className="text-2xl font-bold">{freeCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İstifadəçi axtar..."
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'premium', 'free'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f as any)}
              size="sm"
            >
              {f === 'all' ? 'Hamısı' : f === 'premium' ? 'Premium' : 'Pulsuz'}
            </Button>
          ))}
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-4 border border-border flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                user.is_premium ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {user.name?.charAt(0) || 'İ'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{user.name}</h3>
                  {user.is_premium && (
                    <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                {user.premium_until && (
                  <p className="text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Bitmə: {format(new Date(user.premium_until), 'dd.MM.yyyy')}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user.is_premium ? (
                    <DropdownMenuItem onClick={() => revokePremium(user)} className="text-red-600">
                      <X className="w-4 h-4 mr-2" />
                      Premium Ləğv Et
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowModal(true); }}>
                      <Crown className="w-4 h-4 mr-2 text-amber-500" />
                      Premium Ver
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}
        </div>
      )}

      {/* Grant Premium Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premium Aktivləşdir</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-muted-foreground">
              <strong>{selectedUser?.name}</strong> üçün Premium abunəlik müddəti seçin:
            </p>
            <Select value={premiumDuration} onValueChange={(v: any) => setPremiumDuration(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1_month">1 Ay</SelectItem>
                <SelectItem value="3_months">3 Ay</SelectItem>
                <SelectItem value="1_year">1 İl</SelectItem>
                <SelectItem value="lifetime">Ömürlük</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Ləğv et
              </Button>
              <Button onClick={grantPremium} className="flex-1 bg-gradient-to-r from-amber-400 to-amber-600">
                <Crown className="w-4 h-4 mr-2" />
                Premium Ver
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;
