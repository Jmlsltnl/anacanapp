import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, Star, MapPin, Phone, Globe, Clock,
  Stethoscope, Building2, User, ChevronRight, Filter, Heart,
  Mail, DollarSign, Calendar, X, GraduationCap, Award, Briefcase, Languages } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import ProviderReviews from './doctors/ProviderReviews';
import { tr, mapRowsTranslation } from "@/lib/tr";
import { useUserStore } from '@/store/userStore';

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

const providerTypeLabels: Record<string, {label: string;icon: typeof Stethoscope;}> = {
  hospital: { label: tr("doctorshospitals_xestexana_04539b", 'Xəstəxana'), icon: Building2 },
  clinic: { label: tr("doctorshospitals_klinika_3c7a2d", "Klinika"), icon: Building2 },
  doctor: { label: tr("doctorshospitals_hekim_c127f7", 'Həkim'), icon: User }
};

const specialtyCategories = [
{ id: 'all', label: tr("doctorshospitals_hamisi_c73c4d", 'Hamısı'), emoji: '✨' },
{ id: 'hospital', label: tr("doctorshospitals_xestexana_04539b", 'Xəstəxana'), emoji: '🏥' },
{ id: 'gynecology', label: tr("common_ginekologiya", 'Ginekologiya'), emoji: '👩‍⚕️' },
{ id: 'ivf', label: 'IVF', emoji: '🔬' },
{ id: 'pediatrics', label: tr("common_pediatriya", 'Pediatriya'), emoji: '👶' },
{ id: 'mammology', label: tr("common_mamologiya", 'Mamologiya'), emoji: '🩺' }];


const dayLabels: Record<string, string> = {
  monday: tr("doctorshospitals_bazar_ertesi_4c733b", "Bazar ert\u0259si"),
  tuesday: tr("doctorshospitals_cersenbe_axsami_01435c", "\xC7\u0259r\u015F\u0259nb\u0259 ax\u015Fam\u0131"),
  wednesday: tr("doctorshospitals_cersenbe_50bb90", "\xC7\u0259r\u015F\u0259nb\u0259"),
  thursday: tr("doctorshospitals_cume_axsami_8a8cf4", "C\xFCm\u0259 ax\u015Fam\u0131"),
  friday: tr("doctorshospitals_cume_faba24", "C\xFCm\u0259"),
  saturday: tr("doctorshospitals_senbe_02045c", "\u015E\u0259nb\u0259"),
  sunday: tr("common_bazar", 'Bazar')
};

const parseDescription = (text: string) => {
  if (!text) return { basicDescription: '' };
  
  const result: any = {
    experience: '',
    languages: '',
    education: '',
    master: '',
    interests: '',
    servicesList: '',
    basicDescription: ''
  };

  const lines = text.split('\n');
  const remainingLines: string[] = [];
  
  let parsingHeaders = true;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (parsingHeaders) {
      if (line.startsWith('Təcrübə:')) result.experience = line.replace('Təcrübə:', '').trim();
      else if (line.startsWith('Dillər:')) result.languages = line.replace('Dillər:', '').trim();
      else if (line.startsWith('Təhsil:')) result.education = line.replace('Təhsil:', '').trim();
      else if (line.startsWith('Magistr:')) result.master = line.replace('Magistr:', '').trim();
      else if (line.startsWith('Maraq sahələri:')) result.interests = line.replace('Maraq sahələri:', '').trim();
      else if (line.startsWith('Xidmətlər:')) result.servicesList = line.replace('Xidmətlər:', '').trim();
      else if (line === '') {
         // skip empty lines
      } else {
         parsingHeaders = false;
         remainingLines.push(line);
      }
    } else {
       remainingLines.push(line);
    }
  }
  
  result.basicDescription = remainingLines.join('\n').trim();
  
  if (!result.experience && !result.languages && !result.education && !result.interests && !result.servicesList) {
    return { basicDescription: text };
  }
  
  return result;
};

const DoctorsHospitals = ({ onBack }: DoctorsHospitalsProps) => {
  useScrollToTop();
  useScreenAnalytics('DoctorsHospitals', 'Tools');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const language = useUserStore((state) => state.language);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['healthcare-providers', language],
    queryFn: async () => {
      const { data, error } = (await supabase.
      from('healthcare_providers').
      select('*').
      eq('is_active', true).
      order('is_featured', { ascending: false }).
      order('rating', { ascending: false })) as {data: HealthcareProvider[] | null;error: unknown;};
      if (error) throw error;
      
      const translated = mapRowsTranslation(data, language, ['name', 'specialty', 'description', 'address']) as HealthcareProvider[];
      return translated.map(p => {
        let services = p.services;
        if (Array.isArray(services)) {
          services = services.map((s: any) => ({
            ...s,
            name: language === 'az' ? (s.name_az ?? s.name) : (s[`name_${language}`] ?? s.name_az ?? s.name)
          }));
        }
        return {
          ...p,
          services
        };
      });
    }
  });

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch = (provider.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (provider.specialty || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = false;
    if (activeFilter === 'all') {
      matchesFilter = true;
    } else if (activeFilter === 'hospital') {
      matchesFilter = provider.provider_type === 'hospital' || provider.provider_type === 'clinic';
    } else if (activeFilter === 'gynecology') {
      matchesFilter = provider.provider_type === 'doctor' && (
      (provider.specialty || '').toLowerCase().includes('ginekoloq') ||
      (provider.specialty || '').toLowerCase().includes('mama'));
    } else if (activeFilter === 'ivf') {
      matchesFilter = provider.provider_type === 'doctor' && (
      (provider.specialty || '').toLowerCase().includes('ivf') ||
      (provider.specialty || '').toLowerCase().includes('fertillik'));
    } else if (activeFilter === 'pediatrics') {
      matchesFilter = provider.provider_type === 'doctor' && (
      (provider.specialty || '').toLowerCase().includes('pediatr') ||
      (provider.specialty || '').toLowerCase().includes('neonatoloq') ||
      (provider.specialty || '').toLowerCase().includes(tr("doctorshospitals_usaq_36b348", "u\u015Faq")));
    } else if (activeFilter === 'mammology') {
      matchesFilter = provider.provider_type === 'doctor' && (
      (provider.specialty || '').toLowerCase().includes('mamoloq') ||
      (provider.specialty || '').toLowerCase().includes('onkoloq'));
    }

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
        onReserve={handleReservation} />);


  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}>
              
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {tr("doctorshospitals_hekimler_ve_xestexanalar_b29ffa", "H\u0259kiml\u0259r v\u0259 X\u0259st\u0259xanalar")}
              </h1>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={tr("doctorshospitals_hekim_xestexana_axtar_be2094", "Həkim, xəstəxana axtar...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-muted border-0 text-sm transition-all outline-none focus:ring-2 focus:ring-primary/20" />
            
          </div>

          {/* Filter Tabs - Scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {specialtyCategories.map((filter) =>
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeFilter === filter.id ?
              'bg-primary text-primary-foreground shadow-md' :
              'bg-muted text-muted-foreground hover:bg-muted/80'}`
              }>
              
                <span>{filter.emoji}</span>
                {filter.label}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {isLoading ?
        Array(4).fill(0).map((_, i) =>
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
        ) :
        filteredProviders.length === 0 ?
        <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{tr("doctorshospitals_hec_bir_netice_tapilmadi_5745d9", "Heç bir nəticə tapılmadı")}</p>
          </div> :

        filteredProviders.map((provider, index) =>
        <motion.button
          key={provider.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => setSelectedProvider(provider)}
          className="w-full bg-card rounded-2xl p-4 border border-border/50 text-left hover:border-primary/30 transition-colors">
          
              <div className="flex gap-3">
                {/* Image */}
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                  {provider.image_url ?
              <img src={provider.image_url} alt={provider.name} className="w-full h-full object-cover" /> :

              <Building2 className="w-8 h-8 text-primary" />
              }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {provider.is_featured &&
                  <Badge className="mb-1 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
                          {tr("doctorshospitals_tovsiyye_olunan_626cbb", "\u2B50 T\xF6vsiyy\u0259 olunan")}
                        </Badge>
                  }
                      <h3 className="font-semibold text-sm line-clamp-1">{provider.name}</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    {(() => {
                  const TypeIcon = providerTypeLabels[provider.provider_type]?.icon || Building2;
                  return <TypeIcon className="w-3 h-3" />;
                })()}
                    <span>{providerTypeLabels[provider.provider_type]?.label || provider.provider_type}</span>
                    {provider.specialty &&
                <>
                        <span className="mx-1">•</span>
                        <span>{provider.specialty}</span>
                      </>
                }
                  </div>

                  {provider.address &&
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-1">{provider.address}</span>
                    </div>
              }

                  <div className="flex items-center gap-2 mt-2">
                    {provider.rating > 0 &&
                <div className="flex items-center gap-1 text-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{provider.rating.toFixed(1)}</span>
                        {provider.review_count > 0 &&
                  <span className="text-muted-foreground">({provider.review_count})</span>
                  }
                      </div>
                }
                  </div>
                </div>
              </div>
            </motion.button>
        )
        }
      </div>
    </div>);

};

interface ProviderDetailProps {
  provider: HealthcareProvider;
  onBack: () => void;
  onReserve: (provider: HealthcareProvider) => void;
}

const ProviderDetail = ({ provider, onBack, onReserve }: ProviderDetailProps) => {
  const TypeIcon = providerTypeLabels[provider.provider_type]?.icon || Building2;
  const queryClient = useQueryClient();

  // Subscribe to realtime updates for this provider's reviews
  useEffect(() => {
    const channel = supabase.
    channel(`provider-${provider.id}`).
    on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'healthcare_provider_reviews',
        filter: `provider_id=eq.${provider.id}`
      },
      () => {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['healthcare-providers'] });
        queryClient.invalidateQueries({ queryKey: ['provider-reviews', provider.id] });
      }
    ).
    subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [provider.id, queryClient]);

  // Fetch latest provider data for real-time rating updates
  const { data: latestProvider } = useQuery({
    queryKey: ['healthcare-provider', provider.id],
    queryFn: async () => {
      const { data, error } = await supabase.
      from('healthcare_providers').
      select('rating, review_count').
      eq('id', provider.id).
      single();
      if (error) throw error;
      return data;
    }
  });

  const currentRating = latestProvider?.rating ?? provider.rating;
  const currentReviewCount = latestProvider?.review_count ?? provider.review_count;

  const parsedDesc = parseDescription(provider.description || '');

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <div className="relative h-48 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10">
        {provider.image_url &&
        <img
          src={provider.image_url}
          alt={provider.name}
          className="w-full h-full object-cover" />

        }
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm">
          
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 -mt-12 relative z-10">
        {/* Main Card */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-lg mb-4">
          {provider.is_featured &&
          <Badge className="mb-2 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">
              {tr("doctorshospitals_tovsiyye_olunan_626cbb", "⭐ Tövsiyyə olunan")}
            </Badge>
          }
          
          <h1 className="text-xl font-bold mb-1">{provider.name}</h1>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <TypeIcon className="w-4 h-4" />
            <span>{providerTypeLabels[provider.provider_type]?.label}</span>
            {provider.specialty &&
            <>
                <span>•</span>
                <span>{provider.specialty}</span>
              </>
            }
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) =>
              <Star
                key={star}
                className={`w-4 h-4 ${star <= Math.round(currentRating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />

              )}
            </div>
            <span className="font-semibold">{currentRating > 0 ? currentRating.toFixed(1) : '0.0'}</span>
            <span className="text-muted-foreground text-sm">({currentReviewCount} {tr("doctorshospitals_rey_f2285f", "rəy)")}</span>
          </div>

          {/* Detailed Badges */}
          <div className="flex flex-wrap gap-2 mb-3 mt-3">
            {parsedDesc.experience &&
              <Badge variant="secondary" className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20">
                <Briefcase className="w-3 h-3" />
                {parsedDesc.experience}
              </Badge>
            }
            {parsedDesc.languages &&
              <Badge variant="secondary" className="flex items-center gap-1 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                <Languages className="w-3 h-3" />
                {parsedDesc.languages}
              </Badge>
            }
            {parsedDesc.education &&
              <Badge variant="secondary" className="flex items-center gap-1 bg-green-500/10 text-green-600 hover:bg-green-500/20">
                <GraduationCap className="w-3 h-3" />
                {parsedDesc.education}
              </Badge>
            }
          </div>

          {parsedDesc.basicDescription &&
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{parsedDesc.basicDescription}</div>
          }
        </div>

        {/* Interests and Services */}
        {parsedDesc.interests && (
          <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4 shadow-sm">
            <h2 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-primary" />
              {tr("doctorshospitals_maraq_saheleri", "Maraq sahələri")}
            </h2>
            <div className="flex flex-wrap gap-2">
              {parsedDesc.interests.split(',').map((interest: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs font-normal border-primary/20 bg-card">
                  {interest.trim()}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {parsedDesc.servicesList && (
          <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4 shadow-sm">
            <h2 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Stethoscope className="w-4 h-4 text-primary" />
              {tr("doctorshospitals_xidmetler", "Xidmətlər")}
            </h2>
            <ul className="space-y-2">
              {parsedDesc.servicesList.split(',').map((service: string, i: number) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                  <span>{service.trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4 space-y-3">
          <h2 className="font-semibold text-sm">{tr("doctorshospitals_elaqe_melumatlari_ddd442", "Əlaqə məlumatları")}</h2>
          
          {provider.address &&
          <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tr("doctorshospitals_unvan_b8651a", "Ünvan")}</p>
                <p className="text-sm">{provider.address}{provider.city ? `, ${provider.city}` : ''}</p>
              </div>
            </div>
          }

          {provider.phone &&
          <a href={`tel:${provider.phone}`} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tr("untranslated_telefon_vwjgg5", "Telefon")}</p>
                <p className="text-sm text-primary">{provider.phone}</p>
              </div>
            </a>
          }

          {provider.email &&
          <a href={`mailto:${provider.email}`} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tr("doctorshospitals_e_poct_f5c193", "E-poçt")}</p>
                <p className="text-sm text-primary">{provider.email}</p>
              </div>
            </a>
          }

          {provider.website &&
          <a href={provider.website} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{tr("untranslated_vebsayt_7bupzh", "Vebsayt")}</p>
                <p className="text-sm text-primary">{provider.website}</p>
              </div>
            </a>
          }
        </div>

        {/* Working Hours */}
        {provider.working_hours && typeof provider.working_hours === 'object' && Object.keys(provider.working_hours as Record<string, string>).length > 0 &&
        <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">{tr("doctorshospitals_is_saatlari_cfa6fe", "İş saatları")}</h2>
            </div>
            <div className="space-y-2">
              {Object.entries(provider.working_hours as Record<string, string>).map(([day, hours]) =>
            <div key={day} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{dayLabels[day] || day}</span>
                  <span className="font-medium">{hours}</span>
                </div>
            )}
            </div>
          </div>
        }

        {/* Services */}
        {provider.services && Array.isArray(provider.services) && provider.services.length > 0 &&
        <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">{tr("doctorshospitals_xidmetler_ve_qiymetler_8e63a7", "Xidmətlər və qiymətlər")}</h2>
            </div>
            <div className="space-y-2">
              {(provider.services as Service[]).map((service, index) =>
            <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm">{service.name}</span>
                  <Badge variant="secondary" className="font-semibold">
                    {service.price} AZN
                  </Badge>
                </div>
            )}
            </div>
          </div>
        }

        {/* Reviews Section */}
        <ProviderReviews providerId={provider.id} providerName={provider.name} />

        {/* Reserve Button - Disabled for now */}
        {provider.accepts_reservations &&
        <Button
          className="w-full h-12 rounded-xl font-semibold"
          disabled={true}
          onClick={() => onReserve(provider)}>
          
            <Calendar className="w-4 h-4 mr-2" />
            {tr("doctorshospitals_rezervasiya_et_tezlikle_225276", "Rezervasiya et (Tezlikl\u0259)")}
          </Button>
        }
      </div>
    </div>);

};

export default DoctorsHospitals;