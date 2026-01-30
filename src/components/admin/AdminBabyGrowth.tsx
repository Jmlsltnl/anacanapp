import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Ruler, Scale, Brain, TrendingUp, Search, 
  Trash2, Eye, Calendar, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface BabyGrowthEntry {
  id: string;
  user_id: string;
  weight_kg: number | null;
  height_cm: number | null;
  head_cm: number | null;
  entry_date: string;
  notes: string | null;
  created_at: string;
  profiles?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const AdminBabyGrowth = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all baby growth entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['admin-baby-growth'],
    queryFn: async () => {
      // First get growth entries
      const { data: growthData, error: growthError } = await supabase
        .from('baby_growth')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (growthError) throw growthError;
      
      // Get unique user IDs
      const userIds = [...new Set((growthData || []).map(e => e.user_id))];
      
      // Fetch profiles separately
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);
      
      // Create a map of profiles
      const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
      
      // Combine data
      return (growthData || []).map(entry => ({
        ...entry,
        profiles: profilesMap.get(entry.user_id) || null
      })) as BabyGrowthEntry[];
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('baby_growth')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-baby-growth'] });
      toast({
        title: 'Silindi',
        description: 'Qeyd uğurla silindi',
      });
    }
  });

  // Stats
  const stats = {
    totalEntries: entries.length,
    uniqueUsers: new Set(entries.map(e => e.user_id)).size,
    avgWeight: entries.filter(e => e.weight_kg).reduce((acc, e) => acc + (e.weight_kg || 0), 0) / 
      (entries.filter(e => e.weight_kg).length || 1),
    avgHeight: entries.filter(e => e.height_cm).reduce((acc, e) => acc + (e.height_cm || 0), 0) / 
      (entries.filter(e => e.height_cm).length || 1),
  };

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const searchLower = searchQuery.toLowerCase();
    const userName = entry.profiles?.name?.toLowerCase() || '';
    const userEmail = entry.profiles?.email?.toLowerCase() || '';
    return userName.includes(searchLower) || userEmail.includes(searchLower);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Böyümə İzləmə</h1>
          <p className="text-muted-foreground">Körpə böyümə qeydlərini idarə edin</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ümumi Qeydlər</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalEntries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unikal İstifadəçilər</p>
                <p className="text-2xl font-bold text-foreground">{stats.uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ort. Çəki</p>
                <p className="text-2xl font-bold text-foreground">{stats.avgWeight.toFixed(1)} kq</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-200 dark:border-violet-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Ruler className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ort. Boy</p>
                <p className="text-2xl font-bold text-foreground">{stats.avgHeight.toFixed(1)} sm</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="İstifadəçi axtar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-rose-500" />
            Böyümə Qeydləri
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Ruler className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Qeyd tapılmadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">İstifadəçi</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tarix</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Çəki (kq)</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Boy (sm)</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Baş (sm)</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Qeyd</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEntries.map((entry) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {entry.profiles?.name || 'İsimsiz'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.profiles?.email || entry.user_id.slice(0, 8)}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(entry.entry_date).toLocaleDateString('az-AZ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {entry.weight_kg ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded-full text-sm font-medium">
                            <Scale className="w-3 h-3" />
                            {entry.weight_kg}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {entry.height_cm ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                            <Ruler className="w-3 h-3" />
                            {entry.height_cm}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {entry.head_cm ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 rounded-full text-sm font-medium">
                            <Brain className="w-3 h-3" />
                            {entry.head_cm}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {entry.notes || '—'}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Bu qeydi silmək istədiyinizə əminsiniz?')) {
                              deleteMutation.mutate(entry.id);
                            }
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBabyGrowth;
