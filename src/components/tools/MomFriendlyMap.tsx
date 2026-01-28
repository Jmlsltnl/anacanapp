import { useState } from 'react';
import { ArrowLeft, MapPin, Star, Filter, Plus, Check, Baby, Heart, Car, Utensils, Building2, TreePine, Train, Pill, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMomFriendlyPlaces, useAddPlace, useAddReview, MomFriendlyPlace } from '@/hooks/useMomFriendlyPlaces';
import { toast } from 'sonner';

interface MomFriendlyMapProps {
  onBack: () => void;
}

const CATEGORIES = [
  { value: 'all', label: 'Hamısı', icon: MapPin },
  { value: 'cafe', label: 'Kafe', icon: Utensils },
  { value: 'restaurant', label: 'Restoran', icon: Utensils },
  { value: 'mall', label: 'Mall', icon: Building2 },
  { value: 'park', label: 'Park', icon: TreePine },
  { value: 'hospital', label: 'Xəstəxana', icon: Heart },
  { value: 'metro', label: 'Metro', icon: Train },
  { value: 'pharmacy', label: 'Aptek', icon: Pill },
  { value: 'playground', label: 'Oyun Meydançası', icon: PlayCircle },
];

const AMENITIES = [
  { key: 'has_breastfeeding_room', label: 'Əmizdirmə otağı', icon: '🤱' },
  { key: 'has_changing_table', label: 'Dəyişdirmə masası', icon: '👶' },
  { key: 'has_elevator', label: 'Lift', icon: '🛗' },
  { key: 'has_ramp', label: 'Pandus', icon: '♿' },
  { key: 'has_stroller_access', label: 'Arabası ilə giriş', icon: '🚼' },
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

  const { data: places = [], isLoading } = useMomFriendlyPlaces({
    category: selectedCategory,
    amenities: selectedAmenities,
  });

  const addPlaceMutation = useAddPlace();
  const addReviewMutation = useAddReview();

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

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? <cat.icon className="h-4 w-4" /> : <MapPin className="h-4 w-4" />;
  };

  const getPlaceAmenities = (place: MomFriendlyPlace) => {
    return AMENITIES.filter(a => (place as any)[a.key]);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 safe-area-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Ana Dostu Məkanlar</h1>
            <p className="text-xs text-white/80">{places.length} məkan tapıldı</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-5 w-5" />
          </Button>
          <Dialog open={showAddPlace} onOpenChange={setShowAddPlace}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yeni Məkan Əlavə Et</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Məkan adı</Label>
                  <Input
                    value={newPlace.name}
                    onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value, name_az: e.target.value })}
                    placeholder="Məsələn: Port Baku Mall"
                  />
                </div>
                <div>
                  <Label>Ünvan</Label>
                  <Input
                    value={newPlace.address_az || ''}
                    onChange={(e) => setNewPlace({ ...newPlace, address_az: e.target.value })}
                    placeholder="Bakı, Neftçilər prospekti"
                  />
                </div>
                <div>
                  <Label>Kateqoriya</Label>
                  <Select
                    value={newPlace.category}
                    onValueChange={(v) => setNewPlace({ ...newPlace, category: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>İmkanlar</Label>
                  {AMENITIES.map(amenity => (
                    <div key={amenity.key} className="flex items-center justify-between">
                      <span className="text-sm">{amenity.icon} {amenity.label}</span>
                      <Switch
                        checked={(newPlace as any)[amenity.key]}
                        onCheckedChange={(checked) => setNewPlace({ ...newPlace, [amenity.key]: checked })}
                      />
                    </div>
                  ))}
                </div>
                <Button 
                  className="w-full bg-pink-500 hover:bg-pink-600" 
                  onClick={handleAddPlace}
                  disabled={addPlaceMutation.isPending}
                >
                  {addPlaceMutation.isPending ? 'Əlavə edilir...' : 'Məkan Əlavə Et'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Pills */}
      <div className="p-4 overflow-x-auto">
        <div className="flex gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-pink-500 text-white'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <cat.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amenity Filters */}
      {showFilters && (
        <div className="px-4 pb-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">İmkanlara görə süz</h3>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(amenity => (
                  <button
                    key={amenity.key}
                    onClick={() => toggleAmenity(amenity.key)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedAmenities.includes(amenity.key)
                        ? 'bg-pink-500 text-white'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span>{amenity.icon}</span>
                    <span>{amenity.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Places List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
        ) : places.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Bu filtrlərə uyğun məkan tapılmadı</p>
            <Button
              variant="link"
              className="mt-2 text-pink-500"
              onClick={() => setShowAddPlace(true)}
            >
              İlk məkanı siz əlavə edin!
            </Button>
          </div>
        ) : (
          places.map(place => (
            <Card 
              key={place.id} 
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedPlace(place)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600">
                    {getCategoryIcon(place.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{place.name_az || place.name}</h3>
                      {place.is_verified && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                          <Check className="h-3 w-3 mr-1" /> Təsdiqlənib
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{place.address_az || place.address}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{place.avg_rating?.toFixed(1) || '–'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">({place.review_count} rəy)</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {getPlaceAmenities(place).slice(0, 4).map(a => (
                        <span key={a.key} className="text-sm" title={a.label}>{a.icon}</span>
                      ))}
                      {getPlaceAmenities(place).length > 4 && (
                        <span className="text-xs text-muted-foreground">+{getPlaceAmenities(place).length - 4}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Place Detail Modal */}
      <Dialog open={!!selectedPlace} onOpenChange={(open) => !open && setSelectedPlace(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedPlace && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPlace.name_az || selectedPlace.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(selectedPlace.category)}
                  <span className="capitalize">{CATEGORIES.find(c => c.value === selectedPlace.category)?.label}</span>
                  {selectedPlace.is_verified && (
                    <Badge className="bg-green-100 text-green-700">Təsdiqlənib</Badge>
                  )}
                </div>
                
                {selectedPlace.address_az && (
                  <p className="text-sm text-muted-foreground">{selectedPlace.address_az}</p>
                )}

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-bold text-lg">{selectedPlace.avg_rating?.toFixed(1) || '–'}</span>
                  </div>
                  <span className="text-muted-foreground">{selectedPlace.review_count} rəy</span>
                  <span className="text-muted-foreground">{selectedPlace.verified_count} təsdiq</span>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">İmkanlar</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {getPlaceAmenities(selectedPlace).map(a => (
                      <div key={a.key} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                        <span>{a.icon}</span>
                        <span>{a.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPlace.phone && (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${selectedPlace.phone}`}>📞 {selectedPlace.phone}</a>
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
