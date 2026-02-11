import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Star, Filter, Plus, Check, Baby, Heart, Car, 
  Utensils, Building2, TreePine, Train, Pill, PlayCircle, X, Phone,
  Navigation, Sparkles, ChevronRight, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useMomFriendlyPlaces, useAddPlace, useAddReview, usePlaceReviews, MomFriendlyPlace } from '@/hooks/useMomFriendlyPlaces';
import { Textarea } from '@/components/ui/textarea';
import { usePlaceCategories, usePlaceAmenities, FALLBACK_CATEGORIES, FALLBACK_AMENITIES } from '@/hooks/usePlacesConfig';
import { toast } from 'sonner';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface MomFriendlyMapProps {
  onBack: () => void;
}

// Icon mapping for dynamic categories
const ICON_MAP: Record<string, any> = {
  MapPin, Utensils, Building2, TreePine, Heart, Train, Pill, PlayCircle,
};

const MomFriendlyMap = ({ onBack }: MomFriendlyMapProps) => {
  useScrollToTop();
  
  // Fetch dynamic categories and amenities
  const { data: dbCategories = [] } = usePlaceCategories();
  const { data: dbAmenities = [] } = usePlaceAmenities();
  
  // Map to component format
  const CATEGORIES = useMemo(() => {
    if (dbCategories.length > 0) {
      return dbCategories.map(c => ({
        value: c.category_key,
        label: c.label_az || c.label,
        icon: ICON_MAP[c.icon_name] || MapPin,
        color: c.color_gradient,
      }));
    }
    return FALLBACK_CATEGORIES.map(c => ({
      value: c.category_key,
      label: c.label_az,
      icon: ICON_MAP[c.icon_name] || MapPin,
      color: c.color_gradient,
    }));
  }, [dbCategories]);

  const AMENITIES = useMemo(() => {
    if (dbAmenities.length > 0) {
      return dbAmenities.map(a => ({
        key: a.amenity_key,
        label: a.label_az || a.label,
        icon: a.emoji,
      }));
    }
    return FALLBACK_AMENITIES.map(a => ({
      key: a.amenity_key,
      label: a.label_az,
      icon: a.emoji,
    }));
  }, [dbAmenities]);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<MomFriendlyPlace | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: places = [], isLoading } = useMomFriendlyPlaces({
    category: selectedCategory,
    amenities: selectedAmenities,
  });

  const { data: placeReviews = [] } = usePlaceReviews(selectedPlace?.id || '');

  const addPlaceMutation = useAddPlace();
  const addReviewMutation = useAddReview();

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [newPlace, setNewPlace] = useState({
    name: '',
    name_az: '',
    address_az: '',
    category: 'cafe' as const,
    latitude: 40.4093,
    longitude: 49.8671,
    has_breastfeeding_room: false,
    has_changing_table: false,
    has_elevator: false,
    has_ramp: false,
    has_stroller_access: false,
    has_kids_menu: false,
    has_play_area: false,
    has_high_chair: false,
    has_parking: false,
  });

  const handleAddPlace = async () => {
    if (!newPlace.name) {
      toast.error('Məkan adı tələb olunur');
      return;
    }
    
    await addPlaceMutation.mutateAsync(newPlace);
    setShowAddPlace(false);
    setNewPlace({
      name: '',
      name_az: '',
      address_az: '',
      category: 'cafe',
      latitude: 40.4093,
      longitude: 49.8671,
      has_breastfeeding_room: false,
      has_changing_table: false,
      has_elevator: false,
      has_ramp: false,
      has_stroller_access: false,
      has_kids_menu: false,
      has_play_area: false,
      has_high_chair: false,
      has_parking: false,
    });
  };

  const toggleAmenity = (key: string) => {
    setSelectedAmenities(prev => 
      prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]
    );
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  const getPlaceAmenities = (place: MomFriendlyPlace) => {
    return AMENITIES.filter(a => (place as any)[a.key]);
  };

  const filteredPlaces = places.filter(place => 
    (place.name_az || place.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (place.address_az || place.address || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Statistics
  const verifiedCount = places.filter(p => p.is_verified).length;
  const avgRating = places.length > 0 
    ? (places.reduce((sum, p) => sum + (p.avg_rating || 0), 0) / places.length).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border/50 px-4 py-3 safe-area-top">
        <div className="flex items-center gap-3 mb-3 relative z-30">
          <Button variant="ghost" size="icon" onClick={onBack} className="relative z-30">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Ana Dostu Məkanlar</h1>
            <p className="text-xs text-muted-foreground">Körpənizlə rahat yerlər</p>
          </div>
          <Button
            variant={showFilters || selectedAmenities.length > 0 ? "default" : "ghost"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters || selectedAmenities.length > 0 ? "bg-rose-500 hover:bg-rose-600" : ""}
          >
            <Filter className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowAddPlace(true)}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Məkan axtar..."
            className="pl-10 h-10 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary/30"
          />
        </div>

        {/* Mini Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <strong className="text-foreground">{places.length}</strong> məkan
          </span>
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3 text-emerald-500" />
            <strong className="text-foreground">{verifiedCount}</strong> təsdiqlənmiş
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-500 fill-current" />
            <strong className="text-foreground">{avgRating}</strong> orta reytinq
          </span>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Category Pills */}
        <motion.div
          className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {CATEGORIES.map((cat, index) => (
            <motion.button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                selectedCategory === cat.value
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-card text-foreground border border-border'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <cat.icon className="w-4 h-4" />
              <span className="text-sm">{cat.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Amenity Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-rose-500" />
                      İmkanlara görə süz
                    </h3>
                    {selectedAmenities.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAmenities([])}
                        className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                      >
                        Təmizlə
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(amenity => (
                      <motion.button
                        key={amenity.key}
                        onClick={() => toggleAmenity(amenity.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          selectedAmenities.includes(amenity.key)
                            ? 'bg-rose-500 text-white shadow-md'
                            : 'bg-muted text-foreground hover:bg-muted/80'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>{amenity.icon}</span>
                        <span>{amenity.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Places List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPlaces.length === 0 ? (
          <Card className="border-dashed border-border">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 dark:bg-rose-900/20 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Məkan tapılmadı</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bu filtrlərə uyğun məkan yoxdur
              </p>
              <Button onClick={() => setShowAddPlace(true)} className="bg-rose-500 hover:bg-rose-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                İlk məkanı əlavə et
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPlaces.map((place, index) => {
              const catInfo = getCategoryInfo(place.category);
              const amenities = getPlaceAmenities(place);
              
              return (
                <motion.div
                  key={place.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                    onClick={() => setSelectedPlace(place)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-rose-500 flex items-center justify-center shrink-0">
                          <catInfo.icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground truncate">{place.name_az || place.name}</h3>
                            {place.is_verified && (
                              <Badge className="shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-0 text-xs">
                                <Check className="w-3 h-3 mr-1" /> Təsdiqlənib
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {place.address_az || place.address || 'Ünvan göstərilməyib'}
                          </p>
                          
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-current" />
                              <span className="font-bold text-sm">{place.avg_rating?.toFixed(1) || '–'}</span>
                              <span className="text-xs text-muted-foreground">({place.review_count})</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {amenities.slice(0, 5).map(a => (
                              <span 
                                key={a.key} 
                                className="text-sm bg-muted/50 px-1.5 py-0.5 rounded" 
                                title={a.label}
                              >
                                {a.icon}
                              </span>
                            ))}
                            {amenities.length > 5 && (
                              <span className="text-xs text-muted-foreground px-1.5 py-0.5">
                                +{amenities.length - 5}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 self-center group-hover:text-foreground transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Place Modal */}
      <Dialog open={showAddPlace} onOpenChange={setShowAddPlace}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              Yeni Məkan Əlavə Et
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-sm font-medium">Məkan adı *</Label>
              <Input
                value={newPlace.name}
                onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value, name_az: e.target.value })}
                placeholder="Məsələn: Port Baku Mall"
                className="mt-1.5 bg-muted/50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Ünvan</Label>
              <Input
                value={newPlace.address_az || ''}
                onChange={(e) => setNewPlace({ ...newPlace, address_az: e.target.value })}
                placeholder="Bakı, Neftçilər prospekti"
                className="mt-1.5 bg-muted/50"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Kateqoriya</Label>
              <Select
                value={newPlace.category}
                onValueChange={(v) => setNewPlace({ ...newPlace, category: v as any })}
              >
                <SelectTrigger className="mt-1.5 bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-3 block">İmkanlar</Label>
              <div className="grid grid-cols-1 gap-2">
                {AMENITIES.map(amenity => (
                  <div 
                    key={amenity.key} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-xl"
                  >
                    <span className="text-sm flex items-center gap-2">
                      <span className="text-lg">{amenity.icon}</span>
                      {amenity.label}
                    </span>
                    <Switch
                      checked={(newPlace as any)[amenity.key]}
                      onCheckedChange={(checked) => setNewPlace({ ...newPlace, [amenity.key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700" 
              onClick={handleAddPlace}
              disabled={addPlaceMutation.isPending}
            >
              {addPlaceMutation.isPending ? 'Əlavə edilir...' : 'Məkan Əlavə Et'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Place Detail Modal */}
      <Dialog open={!!selectedPlace} onOpenChange={(open) => !open && setSelectedPlace(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0">
          {selectedPlace && (
            <>
              {/* Hero */}
              <div className={`relative h-32 bg-gradient-to-br ${getCategoryInfo(selectedPlace.category).color}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  {(() => {
                    const CatIcon = getCategoryInfo(selectedPlace.category).icon;
                    return <CatIcon className="w-16 h-16 text-white/30" />;
                  })()}
                </div>
                <motion.button
                  onClick={() => setSelectedPlace(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4 text-white" />
                </motion.button>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-bold text-foreground">{selectedPlace.name_az || selectedPlace.name}</h2>
                    {selectedPlace.is_verified && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0">
                        <Check className="w-3 h-3 mr-1" /> Təsdiqlənib
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{selectedPlace.address_az || selectedPlace.address}</p>
                </div>

                {/* Rating Card */}
                <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-900/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Star className="w-6 h-6 text-white fill-current" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-foreground">{selectedPlace.avg_rating?.toFixed(1) || '–'}</p>
                        <p className="text-sm text-muted-foreground">{selectedPlace.review_count} rəy</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Amenities */}
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-500" />
                    İmkanlar
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {getPlaceAmenities(selectedPlace).map(a => (
                      <div key={a.key} className="flex items-center gap-2 text-sm bg-muted/50 p-2.5 rounded-xl">
                        <span className="text-lg">{a.icon}</span>
                        <span>{a.label}</span>
                      </div>
                    ))}
                  </div>
                  {getPlaceAmenities(selectedPlace).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">İmkan göstərilməyib</p>
                  )}
                </div>

                {/* Contact */}
                {selectedPlace.phone && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${selectedPlace.phone}`} className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {selectedPlace.phone}
                    </a>
                  </Button>
                )}

                {/* Reviews Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      Rəylər ({placeReviews.length})
                    </h4>
                    <Button
                      size="sm"
                      variant={showReviewForm ? "outline" : "default"}
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className={!showReviewForm ? "bg-rose-500 hover:bg-rose-600 text-white" : ""}
                    >
                      {showReviewForm ? 'Ləğv et' : 'Rəy yaz'}
                    </Button>
                  </div>

                  {/* Review Form */}
                  {showReviewForm && (
                    <Card className="mb-3 border-rose-200 dark:border-rose-900/30">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Qiymətləndirmə</p>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => setReviewRating(star)}
                                className="p-1"
                              >
                                <Star className={`w-7 h-7 transition-colors ${star <= reviewRating ? 'text-amber-500 fill-current' : 'text-muted-foreground'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Şərh (istəyə bağlı)</p>
                          <Textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Təcrübənizi paylaşın..."
                            className="bg-muted/50 resize-none"
                            rows={3}
                          />
                        </div>
                        <Button
                          className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                          disabled={reviewRating === 0 || addReviewMutation.isPending}
                          onClick={async () => {
                            if (!selectedPlace) return;
                            await addReviewMutation.mutateAsync({
                              place_id: selectedPlace.id,
                              rating: reviewRating,
                              comment: reviewComment || undefined,
                            });
                            setReviewRating(0);
                            setReviewComment('');
                            setShowReviewForm(false);
                          }}
                        >
                          {addReviewMutation.isPending ? 'Göndərilir...' : 'Rəy göndər'}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reviews List */}
                  {placeReviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Hələ rəy yoxdur. İlk rəyi siz yazın!</p>
                  ) : (
                    <div className="space-y-2">
                      {placeReviews.map(review => (
                        <div key={review.id} className="bg-muted/30 rounded-xl p-3">
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-500 fill-current' : 'text-muted-foreground'}`} />
                            ))}
                            <span className="text-xs text-muted-foreground ml-2">
                              {new Date(review.created_at).toLocaleDateString('az-AZ')}
                            </span>
                          </div>
                          {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MomFriendlyMap;
