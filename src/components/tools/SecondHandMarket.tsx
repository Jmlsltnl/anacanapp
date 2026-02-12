import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Search, Filter, Heart, MessageCircle, MapPin, 
  Camera, X, Check, Loader2, Package, Tag, User, Clock, Send, 
  ChevronRight, Sparkles, ImagePlus, Trash2, Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { useScrollToTop } from '@/hooks/useScrollToTop';

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
}

const categories = [
  { id: 'clothing', label: 'Geyim', emoji: '👕', color: 'from-pink-500 to-rose-600' },
  { id: 'toys', label: 'Oyuncaqlar', emoji: '🧸', color: 'from-amber-500 to-orange-600' },
  { id: 'furniture', label: 'Mebel', emoji: '🛏️', color: 'from-blue-500 to-indigo-600' },
  { id: 'stroller', label: 'Araba', emoji: '👶', color: 'from-violet-500 to-purple-600' },
  { id: 'feeding', label: 'Qidalanma', emoji: '🍼', color: 'from-emerald-500 to-green-600' },
  { id: 'hygiene', label: 'Gigiyena', emoji: '🛁', color: 'from-cyan-500 to-teal-600' },
  { id: 'other', label: 'Digər', emoji: '📦', color: 'from-gray-500 to-slate-600' },
];

const conditions = [
  { id: 'new', label: 'Yeni', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  { id: 'like_new', label: 'Yeni kimi', color: 'bg-green-500', textColor: 'text-green-600' },
  { id: 'good', label: 'Yaxşı', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { id: 'fair', label: 'Normal', color: 'bg-amber-500', textColor: 'text-amber-600' },
];

const ageRanges = [
  '0-3 ay', '3-6 ay', '6-12 ay', '1-2 yaş', '2-3 yaş', '3+ yaş'
];

const SecondHandMarket = ({ onBack }: SecondHandMarketProps) => {
  useScrollToTop();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showMyListings, setShowMyListings] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactListing, setContactListing] = useState<Listing | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Image upload state
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  const { profile, user } = useAuth();

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    
    setUploadingImages(true);
    const newImages: string[] = [];
    
    try {
      for (let i = 0; i < Math.min(files.length, 5 - uploadedImages.length); i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('community-media')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('community-media')
          .getPublicUrl(fileName);
        
        newImages.push(publicUrl);
      }
      
      setUploadedImages(prev => [...prev, ...newImages]);
      toast({ title: 'Şəkillər yükləndi!' });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: 'Xəta',
        description: 'Şəkil yüklənə bilmədi',
        variant: 'destructive'
      });
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
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
          images: uploadedImages,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Uğurlu!',
        description: 'Elan yaradıldı və təsdiq üçün göndərildi',
      });
      
      setShowCreateModal(false);
      resetForm();
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

  const resetForm = () => {
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
    setUploadedImages([]);
  };

  // Load messages for a listing contact
  const loadContactMessages = async (listing: Listing) => {
    if (!profile?.user_id) return;
    const { data } = await supabase
      .from('marketplace_messages')
      .select('*')
      .eq('listing_id', listing.id)
      .or(`sender_id.eq.${profile.user_id},receiver_id.eq.${profile.user_id}`)
      .order('created_at', { ascending: true });
    setContactMessages(data || []);
  };

  useEffect(() => {
    if (showContactModal && contactListing) {
      loadContactMessages(contactListing);
    }
  }, [showContactModal, contactListing]);

  const handleSendMessage = async () => {
    if (!contactMessage.trim() || !contactListing || !profile?.user_id) return;
    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('marketplace_messages')
        .insert({
          listing_id: contactListing.id,
          sender_id: profile.user_id,
          receiver_id: contactListing.user_id,
          content: contactMessage.trim(),
        });
      if (error) throw error;
      setContactMessage('');
      await loadContactMessages(contactListing);
    } catch (error) {
      toast({
        title: 'Xəta',
        description: 'Mesaj göndərilə bilmədi',
        variant: 'destructive'
      });
    } finally {
      setSendingMessage(false);
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

  // Stats
  const freeCount = listings.filter(l => l.is_free).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-500" />
                İkinci Əl Bazarı
              </h1>
            </div>
            <motion.button
              onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 text-primary-foreground" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-2xl bg-muted/50 border-border"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div
            className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-3 text-center border border-emerald-100 dark:border-emerald-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{listings.length}</p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-medium">Elan</p>
          </motion.div>
          <motion.div
            className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-3 text-center border border-amber-100 dark:border-amber-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{freeCount}</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">Pulsuz</p>
          </motion.div>
          <motion.div
            className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-3 text-center border border-violet-100 dark:border-violet-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{categories.length}</p>
            <p className="text-xs text-violet-600/70 dark:text-violet-400/70 font-medium">Kateqoriya</p>
          </motion.div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Category Filter */}
        <motion.div
          className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <motion.button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              selectedCategory === null
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-card text-foreground border border-border/50'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4" />
            Hamısı
          </motion.button>
          {categories.map(cat => (
            <motion.button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? `bg-gradient-to-r ${cat.color} text-white shadow-lg` 
                  : 'bg-card text-foreground border border-border/50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Toggle My Listings */}
        <div className="flex gap-2">
          <Button
            variant={!showMyListings ? 'default' : 'outline'}
            className={`flex-1 ${!showMyListings ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : ''}`}
            onClick={() => setShowMyListings(false)}
          >
            Bütün elanlar
          </Button>
          <Button
            variant={showMyListings ? 'default' : 'outline'}
            className={`flex-1 ${showMyListings ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : ''}`}
            onClick={() => setShowMyListings(true)}
          >
            Mənim elanlarım
          </Button>
        </div>

        {/* Listings */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                <Package className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="font-bold text-foreground mb-1">Hələ elan yoxdur</h3>
              <p className="text-sm text-muted-foreground mb-4">
                İlk elanı siz yerləşdirin!
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                İlk elanı yarat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredListings.map((listing, index) => {
              const catInfo = getCategoryInfo(listing.category);
              const condInfo = getConditionInfo(listing.condition);
              
              return (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedListing(listing);
                    setShowDetailModal(true);
                  }}
                >
                  <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
                    {/* Image */}
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {listing.images && listing.images.length > 0 ? (
                        <img 
                          src={listing.images[0]} 
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${catInfo.color} flex items-center justify-center`}>
                          <span className="text-5xl">{catInfo.emoji}</span>
                        </div>
                      )}
                      
                      {/* Price badge */}
                      <div className="absolute top-2 left-2">
                        {listing.is_free ? (
                          <Badge className="bg-emerald-500 text-white border-0 shadow-lg">
                            Pulsuz
                          </Badge>
                        ) : (
                          <Badge className="bg-white/90 dark:bg-card/90 text-foreground border-0 shadow-lg">
                            {listing.price} ₼
                          </Badge>
                        )}
                      </div>
                      
                      {/* Image count */}
                      {listing.images && listing.images.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg text-white text-xs flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {listing.images.length}
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-3">
                      <h3 className="font-bold text-sm line-clamp-1 text-foreground">{listing.title}</h3>
                      
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`w-2 h-2 rounded-full ${condInfo.color}`} />
                        <span className="text-xs text-muted-foreground">{condInfo.label}</span>
                        {listing.age_range && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{listing.age_range}</span>
                          </>
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
      <Dialog open={showCreateModal} onOpenChange={(open) => { if (!open) resetForm(); setShowCreateModal(open); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              Yeni elan yarat
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Image Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">Şəkillər (maks. 5)</label>
              <div className="grid grid-cols-5 gap-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="aspect-square relative rounded-xl overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <motion.button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-3 h-3" />
                    </motion.button>
                  </div>
                ))}
                
                {uploadedImages.length < 5 && (
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    {uploadingImages ? (
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">Əlavə et</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Başlıq *</label>
              <Input
                placeholder="Məsələn: 0-3 ay oğlan geyimləri"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-muted/50"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Təsvir</label>
              <Textarea
                placeholder="Əşya haqqında məlumat..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-muted/50"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Kateqoriya</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <motion.button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.id })}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                      formData.category === cat.id 
                        ? `bg-gradient-to-r ${cat.color} text-white shadow-lg` 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {cat.emoji} {cat.label}
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Vəziyyət</label>
              <div className="flex flex-wrap gap-2">
                {conditions.map(cond => (
                  <motion.button
                    key={cond.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, condition: cond.id })}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                      formData.condition === cond.id 
                        ? `${cond.color} text-white shadow-lg` 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={`w-2 h-2 rounded-full ${formData.condition === cond.id ? 'bg-white' : cond.color}`} />
                    {cond.label}
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Yaş aralığı</label>
              <div className="flex flex-wrap gap-2">
                {ageRanges.map(age => (
                  <motion.button
                    key={age}
                    type="button"
                    onClick={() => setFormData({ ...formData, age_range: age })}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      formData.age_range === age 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {age}
                  </motion.button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Qiymət</label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={formData.is_free ? 'default' : 'outline'}
                  className={formData.is_free ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : ''}
                  onClick={() => setFormData({ ...formData, is_free: true, price: 0 })}
                >
                  Pulsuz
                </Button>
                <Button
                  type="button"
                  variant={!formData.is_free ? 'default' : 'outline'}
                  className={!formData.is_free ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : ''}
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
                    className="w-24 bg-muted/50"
                  />
                  <span className="text-muted-foreground">₼</span>
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Şəhər</label>
              <Input
                placeholder="Məsələn: Bakı"
                value={formData.location_city}
                onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                className="bg-muted/50"
              />
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" 
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
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
          {selectedListing && (
            <>
              {/* Image Gallery */}
              <div className="relative">
                {selectedListing.images && selectedListing.images.length > 0 ? (
                  <div className="aspect-video bg-muted">
                    <img 
                      src={selectedListing.images[0]} 
                      alt={selectedListing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`aspect-video bg-gradient-to-br ${getCategoryInfo(selectedListing.category).color} flex items-center justify-center`}>
                    <span className="text-7xl">{getCategoryInfo(selectedListing.category).emoji}</span>
                  </div>
                )}
                
                <motion.button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-4 h-4 text-white" />
                </motion.button>

                {/* Image thumbnails */}
                {selectedListing.images && selectedListing.images.length > 1 && (
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-x-auto">
                    {selectedListing.images.map((img, i) => (
                      <div key={i} className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 border-white/50">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedListing.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${getConditionInfo(selectedListing.condition).color} text-white border-0`}>
                      {getConditionInfo(selectedListing.condition).label}
                    </Badge>
                    {selectedListing.age_range && (
                      <Badge variant="secondary">{selectedListing.age_range}</Badge>
                    )}
                  </div>
                </div>
                
                {/* Price Card */}
                <Card className={`${selectedListing.is_free ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-900/30' : 'bg-muted/50'}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Qiymət</p>
                      <p className={`text-2xl font-black ${selectedListing.is_free ? 'text-emerald-600' : 'text-foreground'}`}>
                        {selectedListing.is_free ? 'Pulsuz' : `${selectedListing.price} ₼`}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedListing.is_free ? 'bg-emerald-500' : 'bg-muted'}`}>
                      <Tag className={`w-6 h-6 ${selectedListing.is_free ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                  </CardContent>
                </Card>
                
                {selectedListing.description && (
                  <div>
                    <h4 className="font-bold mb-2">Təsvir</h4>
                    <p className="text-muted-foreground">{selectedListing.description}</p>
                  </div>
                )}
                
                {selectedListing.location_city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {selectedListing.location_city}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {format(new Date(selectedListing.created_at), 'd MMMM yyyy', { locale: az })}
                </div>
                
              <Button 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" 
                size="lg"
                onClick={() => {
                  setShowDetailModal(false);
                  if (selectedListing) {
                    setContactListing(selectedListing);
                    setShowContactModal(true);
                  }
                }}
                disabled={selectedListing?.user_id === profile?.user_id}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {selectedListing?.user_id === profile?.user_id ? 'Öz elanınızdır' : 'Satıcı ilə əlaqə'}
              </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Seller Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              Satıcı ilə əlaqə
            </DialogTitle>
          </DialogHeader>
          
          {contactListing && (
            <div className="space-y-4 mt-2">
              {/* Listing info */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                {contactListing.images?.[0] ? (
                  <img src={contactListing.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryInfo(contactListing.category).color} flex items-center justify-center`}>
                    <span className="text-xl">{getCategoryInfo(contactListing.category).emoji}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{contactListing.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {contactListing.is_free ? 'Pulsuz' : `${contactListing.price} ₼`}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="max-h-60 overflow-y-auto space-y-2 p-2">
                {contactMessages.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Hələ mesaj yoxdur</p>
                    <p className="text-xs text-muted-foreground">Satıcıya mesaj göndərin</p>
                  </div>
                ) : (
                  contactMessages.map(msg => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.sender_id === profile?.user_id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                        msg.sender_id === profile?.user_id 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-muted rounded-bl-sm'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.sender_id === profile?.user_id ? 'text-primary-foreground/60' : 'text-muted-foreground'
                        }`}>
                          {format(new Date(msg.created_at), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Mesajınızı yazın..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!contactMessage.trim() || sendingMessage}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600"
                >
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecondHandMarket;
