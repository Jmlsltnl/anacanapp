import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, Star, MapPin, Phone, Globe, Clock,
  Stethoscope, Building2, User, ChevronRight, Filter, Heart,
  Mail, DollarSign, Calendar, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Skeleton } from '@/components/ui/skeleton';

interface DoctorsHospitalsProps {
  onBack: () => void;
}

interface Service {
  name: string;
  name_az: string;
  price: number;
}

interface WorkingHours {
  [key: string]: string;
}

interface HealthcareProvider {
  id: string;
  name: string;
  name_az: string | null;
  provider_type: string;
  specialty: string | null;
  specialty_az: string | null;
  description: string | null;
  description_az: string | null;
  address: string | null;
  address_az: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  working_hours: unknown;
  services: unknown;
  image_url: string | null;
  rating: number;
  review_count: number;
  is_featured: boolean;
  accepts_reservations: boolean;
}

const providerTypeLabels: Record<string, { label: string; icon: typeof Stethoscope }> = {
  hospital: { label: 'Xəstəxana', icon: Building2 },
  clinic: { label: 'Klinika', icon: Building2 },
  doctor: { label: 'Həkim', icon: User },
};

const dayLabels: Record<string, string> = {
  monday: 'Bazar ertəsi',
  tuesday: 'Çərşənbə axşamı',
  wednesday: 'Çərşənbə',
  thursday: 'Cümə axşamı',
  friday: 'Cümə',
  saturday: 'Şənbə',
  sunday: 'Bazar',
};

const DoctorsHospitals = ({ onBack }: DoctorsHospitalsProps) => {
  useScrollToTop();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['healthcare-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('healthcare_providers')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false }) as { data: HealthcareProvider[] | null; error: unknown };
      if (error) throw error;
      return data as HealthcareProvider[];
    },
  });

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = (provider.name_az || provider.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (provider.specialty_az || provider.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || provider.provider_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Reservation handler - prepared but not active
  const handleReservation = (provider: HealthcareProvider) => {
    // This function is ready but disabled
    // setShowReservationModal(true);
    console.log('Reservation feature is disabled');
  };

  if (selectedProvider) {
    return (
      <ProviderDetail 
        provider={selectedProvider} 
        onBack={() => setSelectedProvider(null)}
        onReserve={handleReservation}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Həkimlər və Xəstəxanalar</h1>
            <p className="text-xs text-muted-foreground">Sizin üçün ən yaxşı seçimlər</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Həkim, xəstəxana və ya ixtisas axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-sm transition-all outline-none"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter}>
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="all" className="text-xs">Hamısı</TabsTrigger>
            <TabsTrigger value="hospital" className="text-xs">Xəstəxana</TabsTrigger>
            <TabsTrigger value="clinic" className="text-xs">Klinika</TabsTrigger>
            <TabsTrigger value="doctor" className="text-xs">Həkim</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-4 border border-border/50">
              <div className="flex gap-3">
                <Skeleton className="w-20 h-20 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          ))
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Heç bir nəticə tapılmadı</p>
          </div>
        ) : (
          filteredProviders.map((provider, index) => (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedProvider(provider)}
              className="w-full bg-card rounded-2xl p-4 border border-border/50 text-left hover:border-primary/30 transition-colors"
            >
              <div className="flex gap-3">
                {/* Image */}
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                  {provider.image_url ? (
                    <img src={provider.image_url} alt={provider.name_az || provider.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-primary" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {provider.is_featured && (
                        <Badge className="mb-1 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                          ⭐ Tövsiyyə olunan
                        </Badge>
                      )}
                      <h3 className="font-semibold text-sm line-clamp-1">{provider.name_az || provider.name}</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    {(() => {
                      const TypeIcon = providerTypeLabels[provider.provider_type]?.icon || Building2;
                      return <TypeIcon className="w-3 h-3" />;
                    })()}
                    <span>{providerTypeLabels[provider.provider_type]?.label || provider.provider_type}</span>
                    {provider.specialty_az && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{provider.specialty_az}</span>
                      </>
                    )}
                  </div>

                  {provider.address_az && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-1">{provider.address_az}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    {provider.rating > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{provider.rating.toFixed(1)}</span>
                        {provider.review_count > 0 && (
                          <span className="text-muted-foreground">({provider.review_count})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

interface ProviderDetailProps {
  provider: HealthcareProvider;
  onBack: () => void;
  onReserve: (provider: HealthcareProvider) => void;
}

const ProviderDetail = ({ provider, onBack, onReserve }: ProviderDetailProps) => {
  const TypeIcon = providerTypeLabels[provider.provider_type]?.icon || Building2;
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative h-48 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10">
        {provider.image_url && (
          <img 
            src={provider.image_url} 
            alt={provider.name_az || provider.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 -mt-12 relative z-10">
        {/* Main Card */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-lg mb-4">
          {provider.is_featured && (
            <Badge className="mb-2 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
              ⭐ Tövsiyyə olunan
            </Badge>
          )}
          
          <h1 className="text-xl font-bold mb-1">{provider.name_az || provider.name}</h1>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <TypeIcon className="w-4 h-4" />
            <span>{providerTypeLabels[provider.provider_type]?.label}</span>
            {provider.specialty_az && (
              <>
                <span>•</span>
                <span>{provider.specialty_az}</span>
              </>
            )}
          </div>

          {provider.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-4 h-4 ${star <= Math.round(provider.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <span className="font-semibold">{provider.rating.toFixed(1)}</span>
              {provider.review_count > 0 && (
                <span className="text-muted-foreground text-sm">({provider.review_count} rəy)</span>
              )}
            </div>
          )}

          {provider.description_az && (
            <p className="text-sm text-muted-foreground">{provider.description_az}</p>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4 space-y-3">
          <h2 className="font-semibold text-sm">Əlaqə məlumatları</h2>
          
          {provider.address_az && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ünvan</p>
                <p className="text-sm">{provider.address_az}, {provider.city}</p>
              </div>
            </div>
          )}

          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="text-sm text-primary">{provider.phone}</p>
              </div>
            </a>
          )}

          {provider.email && (
            <a href={`mailto:${provider.email}`} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-poçt</p>
                <p className="text-sm text-primary">{provider.email}</p>
              </div>
            </a>
          )}

          {provider.website && (
            <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vebsayt</p>
                <p className="text-sm text-primary">{provider.website}</p>
              </div>
            </a>
          )}
        </div>

        {/* Working Hours */}
        {provider.working_hours && typeof provider.working_hours === 'object' && Object.keys(provider.working_hours as Record<string, string>).length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">İş saatları</h2>
            </div>
            <div className="space-y-2">
              {Object.entries(provider.working_hours as Record<string, string>).map(([day, hours]) => (
                <div key={day} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{dayLabels[day] || day}</span>
                  <span className="font-medium">{hours}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {provider.services && Array.isArray(provider.services) && provider.services.length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Xidmətlər və qiymətlər</h2>
            </div>
            <div className="space-y-2">
              {(provider.services as Service[]).map((service, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm">{service.name_az || service.name}</span>
                  <Badge variant="secondary" className="font-semibold">
                    {service.price} AZN
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reserve Button - Disabled for now */}
        {provider.accepts_reservations && (
          <Button 
            className="w-full h-12 rounded-xl font-semibold"
            disabled={true}
            onClick={() => onReserve(provider)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Rezervasiya et (Tezliklə)
          </Button>
        )}
      </div>
    </div>
  );
};

export default DoctorsHospitals;
