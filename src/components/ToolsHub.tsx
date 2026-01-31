import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Shield, Timer, Scale, Baby, Briefcase, 
  Volume2, Heart, Footprints, ChevronRight,
  Utensils, Activity, ArrowLeft, Camera, Lock, ShoppingCart, LucideIcon, Wrench, BookOpen, ChefHat,
  Stethoscope, Droplet, ImagePlus, Package, Mic, Scan, CloudSun, Gauge, Store,
  MapPin, Gamepad2, ShieldAlert, BookHeart, Stars, Crown, Ruler, Sparkles, TrendingUp, Zap
} from 'lucide-react';
import BlogScreen from '@/components/BlogScreen';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import SafetyLookup from './tools/SafetyLookup';
import KickCounter from './tools/KickCounter';
import ContractionTimer from './tools/ContractionTimer';
import WeightTracker from './tools/WeightTracker';
import WhiteNoise from './tools/WhiteNoise';
import BabyNames from './tools/BabyNames';
import HospitalBag from './tools/HospitalBag';
import Nutrition from './tools/Nutrition';
import Exercises from './tools/Exercises';
import MoodDiary from './tools/MoodDiary';
import BabyPhotoshoot from './tools/BabyPhotoshoot';
import ShoppingList from './tools/ShoppingList';
import Recipes from './tools/Recipes';
import DoctorsHospitals from './tools/DoctorsHospitals';
import BloodSugarTracker from './tools/BloodSugarTracker';
import PregnancyAlbum from './tools/PregnancyAlbum';
import AffiliateProducts from './tools/AffiliateProducts';
import CryTranslator from './tools/CryTranslator';
import PoopScanner from './tools/PoopScanner';
import WeatherClothing from './tools/WeatherClothing';
import NoiseMeter from './tools/NoiseMeter';
import SecondHandMarket from './tools/SecondHandMarket';
import MomFriendlyMap from './tools/MomFriendlyMap';
import SmartPlayBox from './tools/SmartPlayBox';
import MentalHealthTracker from './tools/MentalHealthTracker';
import FirstAidGuide from './tools/FirstAidGuide';
import FairyTaleGenerator from './tools/FairyTaleGenerator';
import HoroscopeCompatibility from './tools/HoroscopeCompatibility';
import BabyGrowthTracker from './tools/BabyGrowthTracker';
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
};

interface ToolsHubProps {
  initialTool?: string | null;
  onBack?: () => void;
}

const ToolsHub = ({ initialTool = null, onBack }: ToolsHubProps = {}) => {
  useScrollToTop();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(initialTool);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { lifeStage, getPregnancyData } = useUserStore();
  const { profile } = useAuth();
  const { isPremium } = useSubscription();
  const { toast } = useToast();
  const pregData = getPregnancyData();
  const { data: toolConfigs = [], isLoading: toolsLoading } = useToolConfigs(lifeStage || undefined);
  
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

  // Effect to set initial tool from props
  useEffect(() => {
    if (initialTool) {
      setActiveTool(initialTool);
    }
  }, [initialTool]);

  const isToolAvailable = (tool: Tool) => {
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
      setShowPremiumModal(true);
      return;
    }

    if (tool.isPremium && !isPremium) {
      if (tool.premiumType === 'premium_only') {
        setShowPremiumModal(true);
        return;
      }
    }

    setActiveTool(tool.id);
  };

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBack = () => {
    if (activeTool) {
      setActiveTool(null);
    } else if (onBack) {
      onBack();
    }
  };

  // Render active tool
  if (activeTool === 'photoshoot') return <BabyPhotoshoot onBack={handleBack} />;
  if (activeTool === 'nutrition') return <Nutrition onBack={handleBack} />;
  if (activeTool === 'shopping') return <ShoppingList onBack={handleBack} />;
  if (activeTool === 'safety') return <SafetyLookup onBack={handleBack} />;
  if (activeTool === 'kick') return <KickCounter onBack={handleBack} />;
  if (activeTool === 'contraction') return <ContractionTimer onBack={handleBack} />;
  if (activeTool === 'weight') return <WeightTracker onBack={handleBack} />;
  if (activeTool === 'whitenoise') return <WhiteNoise onBack={handleBack} />;
  if (activeTool === 'names') return <BabyNames onBack={handleBack} />;
  if (activeTool === 'hospital') return <HospitalBag onBack={handleBack} />;
  if (activeTool === 'exercise' || activeTool === 'exercises') return <Exercises onBack={handleBack} />;
  if (activeTool === 'mood' || activeTool === 'mood-diary') return <MoodDiary onBack={handleBack} />;
  if (activeTool === 'blog') return <BlogScreen onBack={handleBack} />;
  if (activeTool === 'recipes') return <Recipes onBack={handleBack} />;
  if (activeTool === 'doctors') return <DoctorsHospitals onBack={handleBack} />;
  if (activeTool === 'blood-sugar') return <BloodSugarTracker onBack={handleBack} />;
  if (activeTool === 'pregnancy-album') return <PregnancyAlbum onBack={handleBack} />;
  if (activeTool === 'cry-translator') return <CryTranslator onBack={handleBack} />;
  if (activeTool === 'poop-scanner') return <PoopScanner onBack={handleBack} />;
  if (activeTool === 'weather-clothing') return <WeatherClothing onBack={handleBack} />;
  if (activeTool === 'noise-meter') return <NoiseMeter onBack={handleBack} />;
  if (activeTool === 'secondhand-market' || activeTool === 'second-hand-market') return <SecondHandMarket onBack={handleBack} />;
  if (activeTool === 'mom-friendly-map') return <MomFriendlyMap onBack={handleBack} />;
  if (activeTool === 'smart-play-box') return <SmartPlayBox onBack={handleBack} />;
  if (activeTool === 'mental-health') return <MentalHealthTracker onBack={handleBack} />;
  if (activeTool === 'first-aid') return <FirstAidGuide onBack={handleBack} />;
  if (activeTool === 'fairy-tale') return <FairyTaleGenerator onBack={handleBack} />;
  if (activeTool === 'horoscope') return <HoroscopeCompatibility onBack={handleBack} />;
  if (activeTool === 'baby-growth' || activeTool === 'growth-tracker') return <BabyGrowthTracker onBack={handleBack} />;
  if (activeTool === 'affiliate' || activeTool === 'affiliate-products') return <AffiliateProducts onBack={handleBack} />;

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
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border/50 safe-area-top">
        <div className="px-4 py-3">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stageInfo.color} flex items-center justify-center shadow-lg`}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Alətlər</h1>
                <p className="text-xs text-muted-foreground">{stageInfo.emoji} {stageInfo.label}</p>
              </div>
            </div>
            
            {/* Stats Pills */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-2.5 py-1">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">{filteredTools.filter(t => isToolAvailable(t)).length}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-500/10 rounded-full px-2.5 py-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-600">{tools.filter(t => t.isPremium).length}</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Alət axtarın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground text-sm outline-none focus:bg-muted focus:border-primary/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Top Banner */}
        <BannerSlot placement="tools_top" onNavigate={() => {}} onToolOpen={setActiveTool} className="mb-4" />

        {/* Quick Access - Horizontal Scroll */}
        <motion.div 
          className="mb-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Stars className="w-4 h-4 text-amber-500" />
              Populyar
            </h2>
          </div>
          
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {/* AI Photo Card */}
            <motion.button
              onClick={() => setActiveTool('photoshoot')}
              className="flex-shrink-0 relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-3.5 w-36 text-left shadow-lg"
              whileTap={{ scale: 0.96 }}
            >
              <div className="absolute -right-4 -bottom-4 opacity-20">
                <Camera className="w-16 h-16 text-white" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <Camera className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-white font-semibold text-xs leading-tight">Körpə Fotosessiyası</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] text-white font-medium">AI</span>
                <Crown className="w-3 h-3 text-amber-300" />
              </div>
            </motion.button>

            {/* Recipes Card */}
            <motion.button
              onClick={() => setActiveTool('recipes')}
              className="flex-shrink-0 relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-3.5 w-36 text-left shadow-lg"
              whileTap={{ scale: 0.96 }}
            >
              <div className="absolute -right-4 -bottom-4 opacity-20">
                <ChefHat className="w-16 h-16 text-white" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <ChefHat className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-white font-semibold text-xs leading-tight">Sağlam Reseptlər</p>
              <p className="text-white/70 text-[9px] mt-1">Faydalı yeməklər</p>
            </motion.button>

            {/* Safety Card */}
            <motion.button
              onClick={() => setActiveTool('safety')}
              className="flex-shrink-0 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3.5 w-36 text-left shadow-lg"
              whileTap={{ scale: 0.96 }}
            >
              <div className="absolute -right-4 -bottom-4 opacity-20">
                <Shield className="w-16 h-16 text-white" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-white font-semibold text-xs leading-tight">Təhlükəsizlik</p>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[9px] text-white font-medium">AI</span>
              </div>
            </motion.button>

            {/* First Aid Card */}
            <motion.button
              onClick={() => setActiveTool('first-aid')}
              className="flex-shrink-0 relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 p-3.5 w-36 text-left shadow-lg"
              whileTap={{ scale: 0.96 }}
            >
              <div className="absolute -right-4 -bottom-4 opacity-20">
                <ShieldAlert className="w-16 h-16 text-white" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <ShieldAlert className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-white font-semibold text-xs leading-tight">Həyat Qurtaran SOS</p>
              <p className="text-white/70 text-[9px] mt-1">İlk yardım</p>
            </motion.button>
          </div>
        </motion.div>

        {/* All Tools Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              Bütün Alətlər
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {filteredTools.length}
            </span>
          </div>

          {/* Tools Grid - More Compact */}
          <div className="grid grid-cols-3 gap-2.5">
            {filteredTools.map((tool, index) => {
              const Icon = tool.icon;
              const available = isToolAvailable(tool);
              const needsPremium = (tool.isLocked || (tool.isPremium && tool.premiumType === 'premium_only')) && !isPremium;
              
              return (
                <motion.button
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(0.05 + index * 0.02, 0.3) }}
                  onClick={() => handleToolClick(tool)}
                  className={`bg-card rounded-2xl p-3 text-center border border-border/40 relative overflow-hidden transition-all hover:shadow-md hover:border-primary/20 active:scale-95 ${!available ? 'opacity-50' : ''}`}
                >
                  {/* Premium Indicator */}
                  {needsPremium && (
                    <div className="absolute top-1.5 right-1.5">
                      <Lock className="w-3 h-3 text-amber-500" />
                    </div>
                  )}
                  {!needsPremium && tool.isPremium && (
                    <div className="absolute top-1.5 right-1.5">
                      <Crown className="w-3 h-3 text-amber-400" />
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl mx-auto mb-2 flex items-center justify-center ${
                    needsPremium 
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30' 
                      : 'bg-gradient-to-br from-primary/10 to-primary/20'
                  }`}>
                    <Icon className={`w-5 h-5 ${needsPremium ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`} />
                  </div>
                  
                  <h3 className="font-medium text-foreground text-[11px] leading-tight line-clamp-2">{tool.name}</h3>
                  
                  {/* Limited badge */}
                  {tool.isPremium && (tool.premiumType === 'limited_total' || tool.premiumType === 'limited_monthly') && (
                    <div className="flex justify-center mt-1">
                      <span className="text-[8px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                        {tool.premiumType === 'limited_total' ? `${tool.premiumLimit} pulsuz` : `Ayda ${tool.premiumLimit}`}
                      </span>
                    </div>
                  )}
                  
                  {tool.minWeek && lifeStage === 'bump' && !available && (
                    <p className="text-[8px] text-muted-foreground mt-1">{tool.minWeek}. həftədən</p>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredTools.length === 0 && (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground text-sm mb-1">Alət tapılmadı</p>
              <p className="text-xs text-muted-foreground">"{searchQuery}" ilə uyğun alət yoxdur</p>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom Banner */}
        <BannerSlot placement="tools_bottom" onNavigate={() => {}} onToolOpen={setActiveTool} className="mt-5" />
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
