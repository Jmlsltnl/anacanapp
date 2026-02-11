import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trash2, Check, AlertTriangle, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminPlaces = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const queryClient = useQueryClient();

  // Fetch places
  const { data: places = [], isLoading } = useQuery({
    queryKey: ['admin-places', filter],
    queryFn: async () => {
      let query = supabase
        .from('mom_friendly_places')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filter === 'pending') query = query.eq('is_verified', false);
      else if (filter === 'approved') query = query.eq('is_verified', true);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch all reviews (including unverified)
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['admin-place-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('place_reviews')
        .select('*, mom_friendly_places(name, name_az)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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
      toast.success('Məkan təsdiqləndi');
    },
  });

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
      toast.success('Məkan silindi');
    },
  });

  const approveReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('place_reviews')
        .update({ is_verified: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-place-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['mom-friendly-places'] });
      toast.success('Rəy təsdiqləndi');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('place_reviews')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-place-reviews'] });
      toast.success('Rəy silindi');
    },
  });

  const pendingPlaces = places.filter(p => !p.is_verified).length;
  const pendingReviews = reviews.filter((r: any) => !r.is_verified).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cafe': return '☕';
      case 'restaurant': return '🍽️';
      case 'park': return '🌳';
      case 'mall': return '🛍️';
      case 'hospital': return '🏥';
      case 'pharmacy': return '💊';
      case 'playground': return '🎮';
      default: return '📍';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" />
          Ana Dostu Məkanlar
        </h2>
        <p className="text-sm text-muted-foreground">Məkanlar və rəylərin idarə edilməsi</p>
      </div>

      <Tabs defaultValue="places">
        <TabsList>
          <TabsTrigger value="places" className="relative">
            Məkanlar
            {pendingPlaces > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                {pendingPlaces}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="relative">
            Rəylər
            {pendingReviews > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                {pendingReviews}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Places Tab */}
        <TabsContent value="places" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Cəmi', count: places.length, f: 'all' as const, color: '' },
              { label: 'Gözləyən', count: pendingPlaces, f: 'pending' as const, color: 'text-orange-500' },
              { label: 'Təsdiqlənmiş', count: places.filter(p => p.is_verified).length, f: 'approved' as const, color: 'text-green-500' },
            ].map(s => (
              <Card key={s.f} className="cursor-pointer" onClick={() => setFilter(s.f)}>
                <CardContent className="p-4">
                  <div className={`text-2xl font-bold ${filter === s.f ? 'text-primary' : s.color}`}>{s.count}</div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-8">Yüklənir...</div>
          ) : places.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Bu filtrdə heç bir məkan yoxdur</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {places.map((place, index) => (
                <motion.div key={place.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-2xl shrink-0">
                            {getCategoryIcon(place.category)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold">{place.name}</h3>
                              {place.is_verified ? (
                                <Badge className="bg-green-500">Təsdiqlənmiş</Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-500 border-orange-500">
                                  <AlertTriangle className="w-3 h-3 mr-1" />Gözləyir
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{place.address}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {place.has_breastfeeding_room && <Badge variant="secondary" className="text-xs">🤱 Əmizdirmə</Badge>}
                              {place.has_changing_table && <Badge variant="secondary" className="text-xs">👶 Dəyişdirmə</Badge>}
                              {place.has_stroller_access && <Badge variant="secondary" className="text-xs">🚼 Araba</Badge>}
                              {place.has_kids_menu && <Badge variant="secondary" className="text-xs">🍽️ Uşaq menyusu</Badge>}
                              {place.has_play_area && <Badge variant="secondary" className="text-xs">🎮 Oyun sahəsi</Badge>}
                            </div>
                            {place.avg_rating > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                <span className="text-yellow-500">★</span>
                                <span className="text-sm font-medium">{place.avg_rating}</span>
                                <span className="text-xs text-muted-foreground">({place.review_count} rəy)</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!place.is_verified && (
                            <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => approveMutation.mutate(place.id)}>
                              <Check className="w-4 h-4 mr-1" />Təsdiqlə
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteMutation.mutate(place.id)}>
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
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-500">{pendingReviews}</div>
                <p className="text-sm text-muted-foreground">Gözləyən rəy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-500">{reviews.filter((r: any) => r.is_verified).length}</div>
                <p className="text-sm text-muted-foreground">Təsdiqlənmiş rəy</p>
              </CardContent>
            </Card>
          </div>

          {reviewsLoading ? (
            <div className="text-center py-8">Yüklənir...</div>
          ) : reviews.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Hələ rəy yoxdur</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((review: any, index: number) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-sm">{review.mom_friendly_places?.name_az || review.mom_friendly_places?.name || 'Naməlum məkan'}</h3>
                            {review.is_verified ? (
                              <Badge className="bg-green-500 text-xs">Təsdiqlənmiş</Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />Gözləyir
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                            ))}
                          </div>
                          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                          <p className="text-xs text-muted-foreground mt-1">{new Date(review.created_at).toLocaleDateString('az-AZ')}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!review.is_verified && (
                            <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => approveReviewMutation.mutate(review.id)}>
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="text-destructive" onClick={() => deleteReviewMutation.mutate(review.id)}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPlaces;
