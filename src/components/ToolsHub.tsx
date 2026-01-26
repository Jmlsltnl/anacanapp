import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Shield, Timer, Scale, Baby, Briefcase, 
  Volume2, Heart, Footprints, ChevronRight,
  Utensils, Activity, ArrowLeft, Camera, Lock, ShoppingCart, LucideIcon, Wrench, BookOpen
} from 'lucide-react';
import BlogScreen from '@/components/BlogScreen';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
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
import { useToast } from '@/hooks/use-toast';
import { useToolConfigs } from '@/hooks/useDynamicTools';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  minWeek?: number;
  stages?: string[];
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
};

interface ToolsHubProps {
  initialTool?: string | null;
  onBack?: () => void;
}

const ToolsHub = ({ initialTool = null, onBack }: ToolsHubProps = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(initialTool);
  const { lifeStage, getPregnancyData } = useUserStore();
  const { profile } = useAuth();
  const { toast } = useToast();
  const pregData = getPregnancyData();
  const { data: toolConfigs = [], isLoading: toolsLoading } = useToolConfigs();
  
  const hasPartner = !!profile?.linked_partner_id;

  // Build tools from DB configs
  const tools: Tool[] = useMemo(() => {
    if (toolConfigs.length === 0) {
      // Fallback while loading
      return [];
    }
    
    return toolConfigs.map(config => {
      const name = hasPartner && config.requires_partner && config.partner_name_az
        ? config.partner_name_az
        : config.name_az || config.name;
      
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
      };
    });
  }, [toolConfigs, hasPartner]);

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

  return (
    <div className="pb-24 pt-1 px-3">
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

      {/* Featured Tools - Photoshoot & Blog */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <motion.button
          onClick={() => setActiveTool('photoshoot')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 p-3 shadow-elevated text-left"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-white font-bold text-xs">Körpə Fotosessiyası</h3>
            <p className="text-white/80 text-[10px]">AI ilə fotoları yaradın</p>
          </div>
        </motion.button>

        <motion.button
          onClick={() => setActiveTool('blog')}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-3 shadow-elevated text-left"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-white font-bold text-xs">Bloqlar</h3>
            <p className="text-white/80 text-[10px]">Faydalı məqalələr</p>
          </div>
        </motion.button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 gap-2">
        {filteredTools.map((tool, index) => {
          const Icon = tool.icon;
          const available = isToolAvailable(tool);
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
              {!available && (
                <div className="absolute top-2 right-2">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <div className={`w-10 h-10 rounded-xl ${tool.bgColor} flex items-center justify-center mb-2`}>
                <Icon className={`w-5 h-5 ${tool.color}`} />
              </div>
              <h3 className="font-bold text-foreground text-sm mb-0.5">{tool.name}</h3>
              <p className="text-[10px] text-muted-foreground leading-tight">{tool.description}</p>
              {tool.minWeek && lifeStage === 'bump' && !available && (
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {tool.minWeek}. həftədən aktiv
                </p>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ToolsHub;
