import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Search, Filter, Heart, MessageCircle, MapPin, 
  Camera, X, Check, Loader2, Package, Tag, User, Clock, Send, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SecondHandMarketProps {
  onBack: () => void;
}

interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  is_free: boolean;
  age_range: string;
  images: string[];
  location_city: string;
  status: string;
  created_at: string;
  profile?: {
    name: string;
    avatar_url: string;
  };
}

const categories = [
  { id: 'clothing', label: 'Geyim', emoji: '👕' },
  { id: 'toys', label: 'Oyuncaqlar', emoji: '🧸' },
  { id: 'furniture', label: 'Mebel', emoji: '🛏️' },
  { id: 'stroller', label: 'Araba', emoji: '👶' },
  { id: 'feeding', label: 'Qidalanma', emoji: '🍼' },
  { id: 'hygiene', label: 'Gigiyena', emoji: '🛁' },
  { id: 'other', label: 'Digər', emoji: '📦' },
];

const conditions = [
  { id: 'new', label: 'Yeni', color: 'bg-green-500' },
  { id: 'like_new', label: 'Yeni kimi', color: 'bg-emerald-500' },
  { id: 'good', label: 'Yaxşı', color: 'bg-blue-500' },
  { id: 'fair', label: 'Normal', color: 'bg-yellow-500' },
];

const ageRanges = [
  '0-3 ay', '3-6 ay', '6-12 ay', '1-2 yaş', '2-3 yaş', '3+ yaş'
];

const SecondHandMarket = ({ onBack }: SecondHandMarketProps) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showMyListings, setShowMyListings] = useState(false);
  
  // Create form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'clothing',
    condition: 'good',
    price: 0,
    is_free: true,
    age_range: '',
    location_city: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadListings();
  }, [selectedCategory, showMyListings]);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      
      if (showMyListings && profile?.user_id) {
        query = query.eq('user_id', profile.user_id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      toast({
        title: 'Xəta',
        description: 'Elanlar yüklənə bilmədi',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateListing = async () => {
    if (!profile?.user_id) {
      toast({
        title: 'Xəta',
        description: 'Elan yaratmaq üçün daxil olun',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: 'Xəta',
        description: 'Başlıq daxil edin',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .insert({
          user_id: profile.user_id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          condition: formData.condition,
          price: formData.is_free ? 0 : formData.price,
          is_free: formData.is_free,
          age_range: formData.age_range,
          location_city: formData.location_city,
          status: 'pending' // All listings go to pending first
        });

      if (error) throw error;

      toast({
        title: 'Uğurlu!',
        description: 'Elan yaradıldı və təsdiq üçün göndərildi',
      });
      
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'clothing',
        condition: 'good',
        price: 0,
        is_free: true,
        age_range: '',
        location_city: '',
      });
      loadListings();
    } catch (error) {
      toast({
        title: 'Xəta',
        description: 'Elan yaradıla bilmədi',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryInfo = (catId: string) => {
    return categories.find(c => c.id === catId) || categories[6];
  };

  const getConditionInfo = (condId: string) => {
    return conditions.find(c => c.id === condId) || conditions[2];
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">İkinci Əl Bazarı</h1>
            <p className="text-xs text-muted-foreground">Analardan analara</p>
          </div>
          <Button size="icon" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="shrink-0"
          >
            Hamısı
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="shrink-0"
            >
              {cat.emoji} {cat.label}
            </Button>
          ))}
        </div>

        {/* Toggle My Listings */}
        <div className="flex gap-2">
          <Button
            variant={!showMyListings ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowMyListings(false)}
            className="flex-1"
          >
            Bütün elanlar
          </Button>
          <Button
            variant={showMyListings ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowMyListings(true)}
            className="flex-1"
          >
            Mənim elanlarım
          </Button>
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Hələ elan yoxdur</p>
              <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                İlk elanı yarat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredListings.map(listing => {
              const catInfo = getCategoryInfo(listing.category);
              const condInfo = getConditionInfo(listing.condition);
              
              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedListing(listing);
                    setShowDetailModal(true);
                  }}
                >
                  <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    {/* Image placeholder */}
                    <div className="aspect-square bg-muted flex items-center justify-center text-4xl">
                      {catInfo.emoji}
                    </div>
                    
                    <CardContent className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
                      
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`w-2 h-2 rounded-full ${condInfo.color}`} />
                        <span className="text-xs text-muted-foreground">{condInfo.label}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        {listing.is_free ? (
                          <span className="text-sm font-bold text-green-600">Pulsuz</span>
                        ) : (
                          <span className="text-sm font-bold">{listing.price} ₼</span>
                        )}
                        
                        {listing.age_range && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {listing.age_range}
                          </span>
                        )}
                      </div>
                      
                      {listing.location_city && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {listing.location_city}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni elan yarat</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Başlıq *</label>
              <Input
                placeholder="Məsələn: 0-3 ay oğlan geyimləri"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Təsvir</label>
              <Textarea
                placeholder="Əşya haqqında məlumat..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Kateqoriya</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={formData.category === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                  >
                    {cat.emoji} {cat.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Vəziyyət</label>
              <div className="flex flex-wrap gap-2">
                {conditions.map(cond => (
                  <Button
                    key={cond.id}
                    type="button"
                    variant={formData.condition === cond.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, condition: cond.id })}
                  >
                    <span className={`w-2 h-2 rounded-full ${cond.color} mr-1`} />
                    {cond.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Yaş aralığı</label>
              <div className="flex flex-wrap gap-2">
                {ageRanges.map(age => (
                  <Button
                    key={age}
                    type="button"
                    variant={formData.age_range === age ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, age_range: age })}
                  >
                    {age}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Qiymət</label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={formData.is_free ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, is_free: true, price: 0 })}
                >
                  Pulsuz
                </Button>
                <Button
                  type="button"
                  variant={!formData.is_free ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, is_free: false })}
                >
                  Pullu
                </Button>
              </div>
              {!formData.is_free && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">₼</span>
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Şəhər</label>
              <Input
                placeholder="Məsələn: Bakı"
                value={formData.location_city}
                onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleCreateListing}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Yaradılır...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Elan yarat
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Listing Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {selectedListing && (
            <>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-6xl mb-4">
                {getCategoryInfo(selectedListing.category).emoji}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedListing.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs ${getConditionInfo(selectedListing.condition).color} text-white`}>
                      {getConditionInfo(selectedListing.condition).label}
                    </span>
                    {selectedListing.age_range && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {selectedListing.age_range}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-2xl font-bold">
                  {selectedListing.is_free ? (
                    <span className="text-green-600">Pulsuz</span>
                  ) : (
                    <span>{selectedListing.price} ₼</span>
                  )}
                </div>
                
                {selectedListing.description && (
                  <p className="text-muted-foreground">{selectedListing.description}</p>
                )}
                
                {selectedListing.location_city && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {selectedListing.location_city}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {new Date(selectedListing.created_at).toLocaleDateString('az-AZ')}
                </div>
                
                <Button className="w-full" size="lg">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Satıcı ilə əlaqə
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecondHandMarket;
