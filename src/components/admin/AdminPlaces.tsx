import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Plus, Edit, Trash2, Save, X, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AdminPlaces = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch places
  const { data: places = [], isLoading } = useQuery({
    queryKey: ['admin-places', filter],
    queryFn: async () => {
      let query = supabase
        .from('mom_friendly_places')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filter === 'pending') {
        query = query.eq('is_verified', false);
      } else if (filter === 'approved') {
        query = query.eq('is_verified', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Approve place mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mom_friendly_places')
        .update({ is_verified: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-places'] });
      toast({ title: 'Məkan təsdiqləndi' });
    },
  });

  // Delete place mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mom_friendly_places')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-places'] });
      toast({ title: 'Məkan silindi' });
    },
  });

  // Stats
  const stats = {
    total: places.length,
    pending: places.filter(p => !p.is_verified).length,
    approved: places.filter(p => p.is_verified).length,
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cafe': return '☕';
      case 'restaurant': return '🍽️';
      case 'park': return '🌳';
      case 'mall': return '🛍️';
      case 'hospital': return '🏥';
      case 'pharmacy': return '💊';
      default: return '📍';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            Ana Dostu Məkanlar
          </h2>
          <p className="text-sm text-muted-foreground">
            Crowd-sourced məkan verilənləri
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="cursor-pointer" onClick={() => setFilter('all')}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${filter === 'all' ? 'text-primary' : ''}`}>
              {stats.total}
            </div>
            <p className="text-sm text-muted-foreground">Cəmi Məkan</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('pending')}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${filter === 'pending' ? 'text-orange-500' : 'text-orange-500'}`}>
              {stats.pending}
            </div>
            <p className="text-sm text-muted-foreground">Gözləyən</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter('approved')}>
          <CardContent className="p-4">
            <div className={`text-2xl font-bold ${filter === 'approved' ? 'text-green-500' : 'text-green-500'}`}>
              {stats.approved}
            </div>
            <p className="text-sm text-muted-foreground">Təsdiqlənmiş</p>
          </CardContent>
        </Card>
      </div>

      {/* Places List */}
      {isLoading ? (
        <div className="text-center py-8">Yüklənir...</div>
      ) : places.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Bu filtrdə heç bir məkan yoxdur
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {places.map((place, index) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                        {getCategoryIcon(place.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold">{place.name}</h3>
                          {place.is_verified ? (
                            <Badge className="bg-green-500">Təsdiqlənmiş</Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-500 border-orange-500">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Gözləyir
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{place.address}</p>
                        
                        {/* Amenities */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {place.has_breastfeeding_room && (
                            <Badge variant="secondary" className="text-xs">🤱 Əmizdirmə otağı</Badge>
                          )}
                          {place.has_changing_table && (
                            <Badge variant="secondary" className="text-xs">👶 Dəyişdirmə masası</Badge>
                          )}
                          {place.has_stroller_access && (
                            <Badge variant="secondary" className="text-xs">🚼 Araba girişi</Badge>
                          )}
                          {place.has_kids_menu && (
                            <Badge variant="secondary" className="text-xs">🍽️ Uşaq menyusu</Badge>
                          )}
                          {place.has_play_area && (
                            <Badge variant="secondary" className="text-xs">🎮 Oyun sahəsi</Badge>
                          )}
                        </div>
                        
                        {/* Rating */}
                        {place.avg_rating && (
                          <div className="flex items-center gap-1 mt-2">
                            <span className="text-yellow-500">★</span>
                            <span className="text-sm font-medium">{place.avg_rating}</span>
                            <span className="text-xs text-muted-foreground">({place.review_count} rəy)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!place.is_verified && (
                        <Button 
                          size="sm"
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => approveMutation.mutate(place.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Təsdiqlə
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(place.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPlaces;
