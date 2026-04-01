import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Shield, Timer, Scale, Baby, Briefcase, 
  Volume2, Heart, Footprints, ChevronRight,
  Utensils, Activity, ArrowLeft, Camera, Lock, ShoppingCart, LucideIcon, Wrench, BookOpen, ChefHat,
  Stethoscope, Droplet, ImagePlus, Package, Mic, Scan, CloudSun, Gauge, Store,
  MapPin, Gamepad2, ShieldAlert, BookHeart, Stars, Crown, Ruler, Sparkles, TrendingUp, Zap,
  Pill
} from 'lucide-react';
import BlogScreen from '@/components/BlogScreen';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
const SafetyLookup = lazy(() => import('./tools/SafetyLookup'));
const KickCounter = lazy(() => import('./tools/KickCounter'));
const ContractionTimer = lazy(() => import('./tools/ContractionTimer'));
const WeightTracker = lazy(() => import('./tools/WeightTracker'));
const WhiteNoise = lazy(() => import('./tools/WhiteNoise'));
const BabyNames = lazy(() => import('./tools/BabyNames'));
const HospitalBag = lazy(() => import('./tools/HospitalBag'));
const Nutrition = lazy(() => import('./tools/Nutrition'));
const Exercises = lazy(() => import('./tools/Exercises'));
const MoodDiary = lazy(() => import('./tools/MoodDiary'));
const BabyPhotoshoot = lazy(() => import('./tools/BabyPhotoshoot'));
const ShoppingList = lazy(() => import('./tools/ShoppingList'));
const Recipes = lazy(() => import('./tools/Recipes'));
const DoctorsHospitals = lazy(() => import('./tools/DoctorsHospitals'));
const BloodSugarTracker = lazy(() => import('./tools/BloodSugarTracker'));
const PregnancyAlbum = lazy(() => import('./tools/PregnancyAlbum'));
const AffiliateProducts = lazy(() => import('./tools/AffiliateProducts'));
const CryTranslator = lazy(() => import('./tools/CryTranslator'));
const PoopScanner = lazy(() => import('./tools/PoopScanner'));
const WeatherClothing = lazy(() => import('./tools/WeatherClothing'));
const NoiseMeter = lazy(() => import('./tools/NoiseMeter'));
const SecondHandMarket = lazy(() => import('./tools/SecondHandMarket'));
const MomFriendlyMap = lazy(() => import('./tools/MomFriendlyMap'));
const SmartPlayBox = lazy(() => import('./tools/SmartPlayBox'));
const MentalHealthTracker = lazy(() => import('./tools/MentalHealthTracker'));
const FirstAidGuide = lazy(() => import('./tools/FirstAidGuide'));
const FairyTaleGenerator = lazy(() => import('./tools/FairyTaleGenerator'));
const HoroscopeCompatibility = lazy(() => import('./tools/HoroscopeCompatibility'));
const BabyGrowthTracker = lazy(() => import('./tools/BabyGrowthTracker'));
const MaternityCalculator = lazy(() => import('./tools/MaternityCalculator'));
const TeethingTracker = lazy(() => import('./tools/TeethingTracker'));
const VitaminTracker = lazy(() => import('./tools/VitaminTracker'));
const BabyMonthlyAlbum = lazy(() => import('./baby/BabyMonthlyAlbum'));
import { PremiumModal } from './PremiumModal';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { useToolConfigs, ToolConfig } from '@/hooks/useDynamicTools';
import BannerSlot from '@/components/banners/BannerSlot';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  minWeek?: number;
  stages?: string[];
  isPremium?: boolean;
  premiumType?: string;
  premiumLimit?: number;
  isLocked?: boolean;
}

// Icon mapping for dynamic tool configs
const iconMap: Record<string, LucideIcon> = {
  'Ruler': Ruler,
  'Camera': Camera,
  'Utensils': Utensils,
  'ShoppingCart': ShoppingCart,
  'Shield': Shield,
  'Footprints': Footprints,
  'Timer': Timer,
  'Scale': Scale,
  'Baby': Baby,
  'Briefcase': Briefcase,
  'Volume2': Volume2,
  'Activity': Activity,
  'Heart': Heart,
  'Wrench': Wrench,
  'BookOpen': BookOpen,
  'ChefHat': ChefHat,
  'Stethoscope': Stethoscope,
  'Droplet': Droplet,
  'ImagePlus': ImagePlus,
  'Package': Package,
  'Mic': Mic,
  'Scan': Scan,
  'CloudSun': CloudSun,
  'Gauge': Gauge,
  'Store': Store,
  'MapPin': MapPin,
  'Gamepad2': Gamepad2,
  'ShieldAlert': ShieldAlert,
  'BookHeart': BookHeart,
  'Stars': Stars,
  'Calculator': Calculator,
  'Pill': Pill,
};

// Import Calculator icon
import { Calculator } from 'lucide-react';

interface ToolsHubProps {
  initialTool?: string | null;
  onBack?: () => void;
}

const ToolsHub = ({ initialTool = null, onBack }: ToolsHubProps = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(initialTool);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useScrollToTop([activeTool]);

  const openTool = (toolId: string) => {
    setActiveTool(toolId);
  };
  const { lifeStage, getPregnancyData } = useUserStore();
  const { profile, isAdmin } = useAuth();
  const { isPremium } = useSubscription();
  const { toast } = useToast();
  const pregData = getPregnancyData();
  // Admins see ALL tools regardless of life stage
  const { data: toolConfigs = [], isLoading: toolsLoading } = useToolConfigs(isAdmin ? undefined : (lifeStage || undefined));
  
  const hasPartner = !!profile?.linked_partner_id;

  // Get locked field based on life stage
  const getLockedStatus = (config: ToolConfig): boolean => {
    if (lifeStage === 'flow') return config.flow_locked || false;
    if (lifeStage === 'bump') return config.bump_locked || false;
    if (lifeStage === 'mommy') return config.mommy_locked || false;
    return false;
  };

  // Build tools from DB configs
  const tools: Tool[] = useMemo(() => {
    if (toolConfigs.length === 0) {
      return [];
    }
    
    return toolConfigs.map(config => {
      const name = hasPartner && config.requires_partner && config.partner_name_az
        ? config.partner_name_az
        : (config as any).display_name_az || config.name_az || config.name;
      
      const description = hasPartner && config.requires_partner && config.partner_description_az
        ? config.partner_description_az
        : config.description_az || config.description || '';
      
      return {
        id: config.tool_id,
        name,
        description,
        icon: iconMap[config.icon] || Wrench,
        color: config.color,
        bgColor: config.bg_color,
        minWeek: config.min_week || undefined,
        stages: config.life_stages,
        isPremium: config.is_premium || false,
        premiumType: config.premium_type || 'none',
        premiumLimit: config.premium_limit || 0,
        isLocked: getLockedStatus(config),
      };
    });
  }, [toolConfigs, hasPartner, lifeStage]);

  // Set initial tool from props on mount
  useEffect(() => {
    if (initialTool) {
      setActiveTool(initialTool);
    }
  }, []);

  const isToolAvailable = (tool: Tool) => {
    // Admins have full access to everything
    if (isAdmin) return true;
    
    if (tool.stages && !tool.stages.includes(lifeStage || '')) {
      return false;
    }
    if (tool.minWeek && lifeStage === 'bump') {
      const currentWeek = pregData?.currentWeek || 0;
      if (currentWeek < tool.minWeek) {
        return false;
      }
    }
    return true;
  };

  const handleToolClick = (tool: Tool) => {
    // Admins bypass all restrictions
    if (isAdmin) {
      openTool(tool.id);
      return;
    }

    if (!isToolAvailable(tool)) {
      if (tool.minWeek && lifeStage === 'bump') {
        toast({
          title: `${tool.name} hələ aktiv deyil`,
          description: `Bu alət ${tool.minWeek}. həftədən sonra aktivləşəcək`,
          variant: 'destructive',
        });
      } else if (tool.stages) {
        toast({
          title: `${tool.name} mövcud deyil`,
          description: `Bu alət yalnız hamiləlik dövründə istifadə oluna bilər`,
          variant: 'destructive',
        });
      }
      return;
    }

    if (tool.isLocked && !isPremium) {
      import('@/lib/analytics').then(m => m.analytics.logPaywallShown(tool.id)).catch(() => {});
      setShowPremiumModal(true);
      return;
    }

    if (tool.isPremium && !isPremium) {
      import('@/lib/analytics').then(m => m.analytics.logPaywallShown(tool.id)).catch(() => {});
      setShowPremiumModal(true);
      return;
    }

    // Track tool opened
    import('@/lib/analytics').then(m => m.analytics.logToolOpened(tool.id, tool.name)).catch(() => {});
    openTool(tool.id);
  };

  // Filter by search and category
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleBack = () => {
    if (activeTool) {
      // If opened from Dashboard (onBack exists and we have initialTool), go back to Dashboard
      if (onBack && initialTool) {
        onBack();
      } else {
        setActiveTool(null);
      }
    } else if (onBack) {
      onBack();
    }
  };

  const toolFallback = (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // Render active tool
  const toolComponent = (() => {
    switch (activeTool) {
      case 'photoshoot': return <BabyPhotoshoot onBack={handleBack} />;
      case 'nutrition': return <Nutrition onBack={handleBack} />;
      case 'shopping': return <ShoppingList onBack={handleBack} />;
      case 'safety': return <SafetyLookup onBack={handleBack} />;
      case 'kick': return <KickCounter onBack={handleBack} />;
      case 'contraction': return <ContractionTimer onBack={handleBack} />;
      case 'weight': return <WeightTracker onBack={handleBack} />;
      case 'whitenoise': case 'white-noise': return <WhiteNoise onBack={handleBack} />;
      case 'names': return <BabyNames onBack={handleBack} />;
      case 'hospital': return <HospitalBag onBack={handleBack} />;
      case 'exercise': case 'exercises': return <Exercises onBack={handleBack} />;
      case 'mood': case 'mood-diary': return <MoodDiary onBack={handleBack} />;
      case 'blog': return <BlogScreen onBack={handleBack} />;
      case 'recipes': return <Recipes onBack={handleBack} />;
      case 'doctors': return <DoctorsHospitals onBack={handleBack} />;
      case 'blood-sugar': return <BloodSugarTracker onBack={handleBack} />;
      case 'pregnancy-album': return <PregnancyAlbum onBack={handleBack} />;
      case 'baby-album': return <BabyMonthlyAlbum onBack={handleBack} />;
      case 'cry-translator': return <CryTranslator onBack={handleBack} />;
      case 'poop-scanner': return <PoopScanner onBack={handleBack} />;
      case 'weather-clothing': return <WeatherClothing onBack={handleBack} />;
      case 'noise-meter': return <NoiseMeter onBack={handleBack} />;
      case 'secondhand-market': case 'second-hand-market': return <SecondHandMarket onBack={handleBack} />;
      case 'mom-friendly-map': return <MomFriendlyMap onBack={handleBack} />;
      case 'smart-play-box': return <SmartPlayBox onBack={handleBack} />;
      case 'mental-health': return <MentalHealthTracker onBack={handleBack} />;
      case 'first-aid': return <FirstAidGuide onBack={handleBack} />;
      case 'fairy-tale': return <FairyTaleGenerator onBack={handleBack} />;
      case 'horoscope': return <HoroscopeCompatibility onBack={handleBack} />;
      case 'baby-growth': case 'growth-tracker': return <BabyGrowthTracker onBack={handleBack} />;
      case 'affiliate': case 'affiliate-products': return <AffiliateProducts onBack={handleBack} />;
      case 'maternity-calculator': case 'maternity': return <MaternityCalculator onBack={handleBack} />;
      case 'teething': case 'teething-tracker': return <TeethingTracker onBack={handleBack} />;
      case 'vitamin-tracker': case 'vitamins': return <VitaminTracker onBack={handleBack} />;
      default: return null;
    }
  })();

  if (toolComponent) {
    return <Suspense fallback={toolFallback}>{toolComponent}</Suspense>;
  }

  const getLifeStageInfo = () => {
    switch (lifeStage) {
      case 'flow': return { label: 'Dövriyyə', emoji: '🌸', color: 'from-pink-500 to-rose-600' };
      case 'bump': return { label: 'Hamiləlik', emoji: '🤰', color: 'from-primary to-orange-500' };
      case 'mommy': return { label: 'Analıq', emoji: '👶', color: 'from-teal-500 to-cyan-600' };
      default: return { label: 'Alətlər', emoji: '✨', color: 'from-primary to-orange-500' };
    }
  };

  const stageInfo = getLifeStageInfo();

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background pb-24">
      {/* Minimal Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl safe-area-top">
        <div className="px-4 pt-2 pb-2">
          {/* Search Bar with integrated title */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stageInfo.color} flex items-center justify-center shadow-md flex-shrink-0`}>
              <span className="text-lg">{stageInfo.emoji}</span>
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Alət axtarın..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/60 text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

        </div>
      </div>

      <div className="px-4 pt-3">
        {/* Top Banner */}
        <BannerSlot placement="tools_top" onNavigate={() => {}} onToolOpen={openTool} className="mb-4" />

        {/* Featured AI Tool - only show if photoshoot is active */}
        {toolConfigs.some(t => t.tool_id === 'photoshoot') && (
          <motion.button
            onClick={() => openTool('photoshoot')}
            className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-4 mb-4 text-left shadow-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="absolute right-0 bottom-0 opacity-10">
              <Camera className="w-32 h-32 text-white -mr-6 -mb-6" />
            </div>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] text-white font-semibold">✨ AI</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/30 text-[10px] text-amber-200 font-semibold flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Premium
                  </span>
                </div>
                <h3 className="text-white font-bold text-base">Körpə Fotosessiyası</h3>
                <p className="text-white/70 text-xs">AI ilə unikal körpə şəkilləri yaradın</p>
              </div>
              <ChevronRight className="w-6 h-6 text-white/60" />
            </div>
          </motion.button>
        )}

        {/* Recipes Banner */}
        <motion.button
          onClick={() => openTool('recipes')}
          className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-4 mb-4 text-left shadow-xl"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute right-0 bottom-0 opacity-10">
            <ChefHat className="w-32 h-32 text-white -mr-6 -mb-6" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] text-white font-semibold">🍽️ Reseptlər</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/30 text-[10px] text-amber-200 font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </span>
              </div>
              <h3 className="text-white font-bold text-base">Sağlam Reseptlər</h3>
              <p className="text-white/70 text-xs">Hamiləlik və analıq üçün ləzzətli yeməklər</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/60" />
          </div>
        </motion.button>

        {/* Quick Access Row - only show active tools */}
        {(() => {
          const quickAccessItems = [
            { id: 'safety', icon: Shield, label: 'Təhlükəsizlik', gradient: 'from-emerald-500 to-teal-500' },
            { id: 'first-aid', icon: ShieldAlert, label: 'İlk Yardım', gradient: 'from-red-500 to-rose-500' },
            { id: 'doctors', icon: Stethoscope, label: 'Həkimlər', gradient: 'from-blue-500 to-cyan-500' },
          ].filter(item => toolConfigs.some(t => t.tool_id === item.id));
          
          return quickAccessItems.length > 0 ? (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              {quickAccessItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => openTool(item.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r ${item.gradient} shadow-lg`}
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-semibold">{item.label}</span>
                </motion.button>
              ))}
            </div>
          ) : null;
        })()}

        {/* Tools Count Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Bütün Alətlər
          </h2>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
            {filteredTools.length} alət
          </span>
        </div>

        {/* Tools Grid - 2 Columns with Description */}
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredTools.map((tool, index) => {
              const Icon = tool.icon;
              const available = isToolAvailable(tool);
              const needsPremium = (tool.isLocked || tool.isPremium) && !isPremium;
              
              return (
                <motion.button
                  key={tool.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.02, 0.2) }}
                  onClick={() => handleToolClick(tool)}
                  className={`bg-card rounded-2xl p-3.5 text-left border border-border/40 relative overflow-hidden transition-all active:scale-95 ${!available ? 'opacity-40' : 'hover:shadow-lg hover:border-primary/20'}`}
                >
                  {/* Premium/Lock indicator */}
                  {needsPremium && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-amber-500" />
                    </div>
                  )}
                  {!needsPremium && tool.isPremium && (
                    <div className="absolute top-2.5 right-2.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl mb-2.5 flex items-center justify-center ${
                    needsPremium 
                      ? 'bg-gradient-to-br from-amber-500/15 to-orange-500/15' 
                      : 'bg-gradient-to-br from-primary/10 to-primary/20'
                  }`}>
                    <Icon className={`w-6 h-6 ${needsPremium ? 'text-amber-500' : 'text-primary'}`} />
                  </div>
                  
                  <h3 className="font-semibold text-foreground text-sm mb-1 pr-6">{tool.name}</h3>
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{tool.description}</p>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="font-semibold text-foreground mb-1">Alət tapılmadı</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? `"${searchQuery}" ilə uyğun alət yoxdur` : 'Bu kateqoriyada alət yoxdur'}
            </p>
            <motion.button
              onClick={() => { setSearchQuery(''); }}
              className="mt-4 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
              whileTap={{ scale: 0.95 }}
            >
              Hamısını göstər
            </motion.button>
          </motion.div>
        )}

        {/* Bottom Banner */}
        <BannerSlot placement="tools_bottom" onNavigate={() => {}} onToolOpen={openTool} className="mt-6" />
      </div>

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
        feature="tool"
      />
    </div>
  );
};

export default ToolsHub;
