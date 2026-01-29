import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Shield, Timer, Scale, Baby, Briefcase, 
  Volume2, Heart, Footprints, ChevronRight,
  Utensils, Activity, ArrowLeft, Camera, Lock, ShoppingCart, LucideIcon, Wrench, BookOpen, ChefHat,
  Stethoscope, Droplet, ImagePlus, Package, Mic, Scan, CloudSun, Gauge, Store,
  MapPin, Gamepad2, ShieldAlert, BookHeart, Stars, Crown
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
import { PremiumModal } from './PremiumModal';
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
      // Fallback while loading
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
    // Check stage restriction
    if (tool.stages && !tool.stages.includes(lifeStage || '')) {
      return false;
    }
    // Check week restriction for bump stage
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

    // Check if tool is locked for this phase (requires premium)
    if (tool.isLocked && !isPremium) {
      setShowPremiumModal(true);
      return;
    }

    // Check premium restrictions
    if (tool.isPremium && !isPremium) {
      if (tool.premiumType === 'premium_only') {
        setShowPremiumModal(true);
        return;
      }
      // For limited types, let the tool handle usage tracking
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
  if (activeTool === 'affiliate' || activeTool === 'affiliate-products') return <AffiliateProducts onBack={handleBack} />;

  return (
    <div className="pb-4 pt-3 px-3">
      {/* Header */}
      <motion.div className="mb-2" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-lg font-black text-foreground">Alətlər</h1>
        <p className="text-muted-foreground text-xs">Sizin üçün faydalı alətlər</p>
      </motion.div>

      {/* Search */}
      <motion.div className="relative mb-2" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Axtarış..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-sm transition-all outline-none"
        />
      </motion.div>

      {/* Top Banner Slot */}
      <BannerSlot placement="tools_top" onNavigate={() => {}} onToolOpen={setActiveTool} className="mb-2" />

      {/* Featured Tool - Full Width Photoshoot Banner */}
      <motion.button
        onClick={() => setActiveTool('photoshoot')}
        className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 p-4 shadow-elevated text-left mb-2"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-4 bottom-2 opacity-20">
          <Camera className="w-16 h-16 text-white" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Körpə Fotosessiyası</h3>
            <p className="text-white/80 text-xs">AI ilə unikal körpə fotoları yaradın</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60 ml-auto" />
        </div>
      </motion.button>

      {/* Featured Tool - Recipes Banner */}
      <motion.button
        onClick={() => setActiveTool('recipes')}
        className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 p-4 shadow-elevated text-left mb-2"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute right-4 bottom-2 opacity-20">
          <ChefHat className="w-16 h-16 text-white" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Reseptlər</h3>
            <p className="text-white/80 text-xs">Sağlam və ləzzətli yeməklər</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60 ml-auto" />
        </div>
      </motion.button>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredTools.map((tool, index) => {
          const Icon = tool.icon;
          const available = isToolAvailable(tool);
          const needsPremium = (tool.isLocked || (tool.isPremium && tool.premiumType === 'premium_only')) && !isPremium;
          
          return (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleToolClick(tool)}
              className={`bg-card rounded-2xl p-3 text-left shadow-card border border-border/50 relative ${!available ? 'opacity-50' : ''}`}
              whileHover={available ? { scale: 1.02, y: -2 } : {}}
              whileTap={available ? { scale: 0.98 } : {}}
            >
              {/* Premium badge */}
              {tool.isPremium && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                </div>
              )}
              
              {/* Locked indicator */}
              {needsPremium && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-amber-500/20 px-1.5 py-0.5 rounded-full">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <Crown className="w-3 h-3 text-amber-500" />
                </div>
              )}

              {/* Week restriction lock */}
              {!available && tool.minWeek && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              
              {/* Uniform icon background for all tools */}
              <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-2">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-foreground text-sm mb-0.5">{tool.name}</h3>
              <p className="text-[10px] text-muted-foreground leading-tight">{tool.description}</p>
              {tool.minWeek && lifeStage === 'bump' && !available && (
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {tool.minWeek}. həftədən aktiv
                </p>
              )}
              {tool.isPremium && tool.premiumType === 'limited_total' && (
                <p className="text-[9px] text-amber-600 mt-0.5">
                  İlk {tool.premiumLimit} istifadə pulsuz
                </p>
              )}
              {tool.isPremium && tool.premiumType === 'limited_monthly' && (
                <p className="text-[9px] text-amber-600 mt-0.5">
                  Ayda {tool.premiumLimit} pulsuz
                </p>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Banner Slot */}
      <BannerSlot placement="tools_bottom" onNavigate={() => {}} onToolOpen={setActiveTool} className="mt-4" />

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
