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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-24">
      {/* Premium Header */}
      <div className="sticky top-0 z-20 isolate overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${stageInfo.color} pointer-events-none`} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10 pointer-events-none" />
        
        <div className="relative px-4 pt-4 pb-5 safe-area-top">
          <div className="flex items-center justify-between mb-4 relative z-30">
            <div>
              <motion.h1 
                className="text-2xl font-black text-white flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Sparkles className="w-6 h-6" />
                Alətlər
              </motion.h1>
              <motion.p 
                className="text-white/80 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {stageInfo.emoji} {stageInfo.label} dövrü üçün
              </motion.p>
            </div>
            <motion.div 
              className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-2xl px-4 py-2"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span className="text-white text-sm font-bold">{tools.length}</span>
              <span className="text-white/70 text-xs">alət</span>
            </motion.div>
          </div>

          {/* Stats Row */}
          <motion.div 
            className="grid grid-cols-3 gap-3 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <p className="text-lg font-black text-white">{filteredTools.filter(t => isToolAvailable(t)).length}</p>
              <p className="text-[10px] text-white/70">Aktiv</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center">
              <Crown className="w-5 h-5 mx-auto mb-1 text-amber-300" />
              <p className="text-lg font-black text-white">{tools.filter(t => t.isPremium).length}</p>
              <p className="text-[10px] text-white/70">Premium</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center">
              <Heart className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <p className="text-lg font-black text-white">AI</p>
              <p className="text-[10px] text-white/70">Dəstəkli</p>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            className="relative z-20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              placeholder="Alət axtarın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 text-base outline-none focus:bg-white/30 transition-colors"
            />
          </motion.div>
        </div>
      </div>

      <div className="px-4 -mt-2">
        {/* Top Banner Slot */}
        <BannerSlot placement="tools_top" onNavigate={() => {}} onToolOpen={setActiveTool} className="mb-4" />

        {/* Featured Tools Section */}
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Öndə Seçilənlər
          </h2>
          
          <div className="space-y-3">
            {/* AI Photoshoot Banner */}
            <motion.button
              onClick={() => setActiveTool('photoshoot')}
              className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 p-5 shadow-xl text-left"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute right-4 bottom-2 opacity-30">
                <Camera className="w-20 h-20 text-white" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center shadow-lg">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-white/25 text-white text-[10px] font-bold">AI</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-100 text-[10px] font-bold flex items-center gap-1">
                      <Crown className="w-3 h-3" /> Premium
                    </span>
                  </div>
                  <h3 className="text-white font-bold text-lg">Körpə Fotosessiyası</h3>
                  <p className="text-white/80 text-sm">AI ilə unikal körpə fotoları yaradın</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.button>

            {/* Recipes Banner */}
            <motion.button
              onClick={() => setActiveTool('recipes')}
              className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 p-5 shadow-xl text-left"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute right-4 bottom-2 opacity-30">
                <ChefHat className="w-20 h-20 text-white" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center shadow-lg">
                  <ChefHat className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">Sağlam Reseptlər</h3>
                  <p className="text-white/80 text-sm">Hamiləlik və analıq üçün yeməklər</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* All Tools Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-muted-foreground" />
            Bütün Alətlər
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {filteredTools.length}
            </span>
          </h2>

          {/* Tools Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredTools.map((tool, index) => {
              const Icon = tool.icon;
              const available = isToolAvailable(tool);
              const needsPremium = (tool.isLocked || (tool.isPremium && tool.premiumType === 'premium_only')) && !isPremium;
              
              return (
                <motion.button
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.35 + index * 0.03, 0.6) }}
                  onClick={() => handleToolClick(tool)}
                  className={`bg-card rounded-2xl p-4 text-left shadow-sm border border-border/50 relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/20 ${!available ? 'opacity-50' : ''}`}
                  whileHover={available ? { scale: 1.02, y: -2 } : {}}
                  whileTap={available ? { scale: 0.98 } : {}}
                >
                  {/* Background Glow for Premium */}
                  {needsPremium && (
                    <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-400/10 blur-2xl" />
                  )}

                  {/* Premium/Locked badge */}
                  {needsPremium ? (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm px-2 py-1 rounded-full border border-amber-500/30">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <Crown className="w-3 h-3 text-amber-400" />
                    </div>
                  ) : tool.isPremium && (
                    <div className="absolute top-2.5 right-2.5">
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-400 blur-sm opacity-40 rounded-full" />
                        <Crown className="relative w-4 h-4 text-amber-500 drop-shadow-md" />
                      </div>
                    </div>
                  )}

                  {/* Week restriction lock */}
                  {!available && tool.minWeek && (
                    <div className="absolute top-2.5 right-2.5">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Enhanced icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 relative overflow-hidden shadow-inner ${
                    needsPremium 
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30' 
                      : 'bg-gradient-to-br from-primary/15 to-primary/25 dark:from-primary/20 dark:to-primary/30'
                  }`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent dark:from-white/10" />
                    <Icon className={`w-6 h-6 relative z-10 ${needsPremium ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`} />
                  </div>
                  
                  <h3 className="font-bold text-foreground text-sm mb-1">{tool.name}</h3>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">{tool.description}</p>
                  
                  {tool.minWeek && lifeStage === 'bump' && !available && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {tool.minWeek}. həftədən aktiv
                    </p>
                  )}
                  {tool.isPremium && tool.premiumType === 'limited_total' && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      İlk {tool.premiumLimit} pulsuz
                    </p>
                  )}
                  {tool.isPremium && tool.premiumType === 'limited_monthly' && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Ayda {tool.premiumLimit} pulsuz
                    </p>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredTools.length === 0 && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="font-bold text-foreground mb-1">Alət tapılmadı</p>
              <p className="text-sm text-muted-foreground">"{searchQuery}" ilə uyğun alət yoxdur</p>
            </motion.div>
          )}
        </motion.div>

        {/* Bottom Banner Slot */}
        <BannerSlot placement="tools_bottom" onNavigate={() => {}} onToolOpen={setActiveTool} className="mt-6" />
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
