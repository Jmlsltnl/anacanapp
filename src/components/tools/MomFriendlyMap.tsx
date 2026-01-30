import { useState } from 'react';
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
import { useMomFriendlyPlaces, useAddPlace, useAddReview, MomFriendlyPlace } from '@/hooks/useMomFriendlyPlaces';
import { toast } from 'sonner';

interface MomFriendlyMapProps {
  onBack: () => void;
}

const CATEGORIES = [
  { value: 'all', label: 'Hamısı', icon: MapPin, color: 'from-pink-500 to-rose-600' },
  { value: 'cafe', label: 'Kafe', icon: Utensils, color: 'from-amber-500 to-orange-600' },
  { value: 'restaurant', label: 'Restoran', icon: Utensils, color: 'from-red-500 to-rose-600' },
  { value: 'mall', label: 'Mall', icon: Building2, color: 'from-blue-500 to-indigo-600' },
  { value: 'park', label: 'Park', icon: TreePine, color: 'from-emerald-500 to-green-600' },
  { value: 'hospital', label: 'Xəstəxana', icon: Heart, color: 'from-rose-500 to-pink-600' },
  { value: 'metro', label: 'Metro', icon: Train, color: 'from-violet-500 to-purple-600' },
  { value: 'pharmacy', label: 'Aptek', icon: Pill, color: 'from-cyan-500 to-teal-600' },
  { value: 'playground', label: 'Oyun Meydançası', icon: PlayCircle, color: 'from-fuchsia-500 to-pink-600' },
];

const AMENITIES = [
  { key: 'has_breastfeeding_room', label: 'Əmizdirmə otağı', icon: '🤱' },
  { key: 'has_changing_table', label: 'Dəyişdirmə masası', icon: '👶' },
  { key: 'has_elevator', label: 'Lift', icon: '🛗' },
  { key: 'has_ramp', label: 'Pandus', icon: '♿' },
  { key: 'has_stroller_access', label: 'Araba ilə giriş', icon: '🚼' },
  { key: 'has_kids_menu', label: 'Uşaq menyusu', icon: '🍽️' },
  { key: 'has_play_area', label: 'Oyun guşəsi', icon: '🎠' },
  { key: 'has_high_chair', label: 'Uşaq oturacağı', icon: '🪑' },
  { key: 'has_parking', label: 'Parkinq', icon: '🅿️' },
];

const MomFriendlyMap = ({ onBack }: MomFriendlyMapProps) => {
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

  const addPlaceMutation = useAddPlace();

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
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-600" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-5 right-10 w-40 h-40 rounded-full bg-pink-300/20 blur-3xl" />
        </div>
        
        <div className="relative px-4 pt-4 pb-8 safe-area-top">
          <div className="flex items-center gap-3 mb-4">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Ana Dostu Məkanlar</h1>
              <p className="text-white/80 text-sm">Körpənizlə rahat yerlər</p>
            </div>
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center ${
                showFilters || selectedAmenities.length > 0 ? 'bg-white text-pink-600' : 'bg-white/20'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <Filter className={`w-5 h-5 ${showFilters || selectedAmenities.length > 0 ? 'text-pink-600' : 'text-white'}`} />
            </motion.button>
            <motion.button
              onClick={() => setShowAddPlace(true)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Məkan axtar..."
              className="pl-12 h-12 rounded-2xl bg-white/95 dark:bg-card/95 backdrop-blur-md border-0 shadow-lg"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-2xl font-black text-white">{places.length}</p>
              <p className="text-xs text-white/70">Məkan</p>
            </motion.div>
            <motion.div
              className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="text-2xl font-black text-white">{verifiedCount}</p>
              <p className="text-xs text-white/70">Təsdiqlənmiş</p>
            </motion.div>
            <motion.div
              className="bg-white/20 backdrop-blur-md rounded-xl p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-300 fill-current" />
                <p className="text-2xl font-black text-white">{avgRating}</p>
              </div>
              <p className="text-xs text-white/70">Orta reytinq</p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
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
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${
                selectedCategory === cat.value
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                  : 'bg-card text-foreground border border-border/50'
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
              <Card className="border-pink-200 dark:border-pink-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-500" />
                      İmkanlara görə süz
                    </h3>
                    {selectedAmenities.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAmenities([])}
                        className="text-pink-600 hover:text-pink-700"
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
                            ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg'
                            : 'bg-muted hover:bg-muted/80 text-foreground'
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
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Məkan tapılmadı</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bu filtrlərə uyğun məkan yoxdur
              </p>
              <Button onClick={() => setShowAddPlace(true)} className="bg-gradient-to-r from-pink-500 to-rose-600">
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
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${catInfo.color} flex items-center justify-center shrink-0`}>
                          <catInfo.icon className="w-6 h-6 text-white" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground truncate">{place.name_az || place.name}</h3>
                            {place.is_verified && (
                              <Badge className="shrink-0 bg-emerald-500/10 text-emerald-600 border-0 text-xs">
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
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{selectedPlace.verified_count} təsdiq</p>
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
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MomFriendlyMap;
