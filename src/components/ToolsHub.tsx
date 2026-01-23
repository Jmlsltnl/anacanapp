import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Shield, Timer, Scale, Baby, Briefcase, 
  Volume2, Heart, Footprints, ChevronRight,
  Utensils, Activity, ArrowLeft, Camera, ChefHat, Lock
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
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
import Recipes from './tools/Recipes';
import { useToast } from '@/hooks/use-toast';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  minWeek?: number; // Minimum pregnancy week required
  stages?: string[]; // Which stages this tool is available for
}

const tools: Tool[] = [
  { id: 'photoshoot', name: 'Fotosessiya', description: 'AI körpə fotoları', icon: Camera, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  { id: 'recipes', name: 'Sağlam Reseptlər', description: 'Hamiləlik reseptləri', icon: ChefHat, color: 'text-green-600', bgColor: 'bg-green-50' },
  { id: 'safety', name: 'Təhlükəsizlik', description: 'Qida və fəaliyyət yoxlayın', icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  { id: 'kick', name: 'Təpik Sayğacı', description: 'Körpə hərəkətlərini izləyin', icon: Footprints, color: 'text-pink-600', bgColor: 'bg-pink-50', minWeek: 16, stages: ['bump'] },
  { id: 'contraction', name: 'Sancı Ölçən', description: '5-1-1 qaydası ilə izləyin', icon: Timer, color: 'text-violet-600', bgColor: 'bg-violet-50', stages: ['bump'] },
  { id: 'weight', name: 'Çəki İzləyici', description: 'AI analiz ilə çəki takibi', icon: Scale, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'names', name: 'Körpə Adları', description: 'Azərbaycan adları', icon: Baby, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { id: 'hospital', name: 'Xəstəxana Çantası', description: 'Doğuş üçün hazırlıq', icon: Briefcase, color: 'text-teal-600', bgColor: 'bg-teal-50', stages: ['bump'] },
  { id: 'whitenoise', name: 'Bəyaz Küylər', description: 'Körpəni sakitləşdirin', icon: Volume2, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  { id: 'nutrition', name: 'Qidalanma', description: 'Sağlam qida planı', icon: Utensils, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { id: 'exercise', name: 'Məşqlər', description: 'Hamiləlik məşqləri', icon: Activity, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  { id: 'mood', name: 'Əhval Gündəliyi', description: 'Emosiyalarınızı izləyin', icon: Heart, color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50' },
];

interface ToolsHubProps {
  initialTool?: string | null;
  onBack?: () => void;
}

const ToolsHub = ({ initialTool = null, onBack }: ToolsHubProps = {}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(initialTool);
  const { lifeStage, getPregnancyData } = useUserStore();
  const { toast } = useToast();
  const pregData = getPregnancyData();

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
  if (activeTool === 'recipes') return <Recipes onBack={handleBack} />;
  if (activeTool === 'safety') return <SafetyLookup onBack={handleBack} />;
  if (activeTool === 'kick') return <KickCounter onBack={handleBack} />;
  if (activeTool === 'contraction') return <ContractionTimer onBack={handleBack} />;
  if (activeTool === 'weight') return <WeightTracker onBack={handleBack} />;
  if (activeTool === 'whitenoise') return <WhiteNoise onBack={handleBack} />;
  if (activeTool === 'names') return <BabyNames onBack={handleBack} />;
  if (activeTool === 'hospital') return <HospitalBag onBack={handleBack} />;
  if (activeTool === 'nutrition') return <Nutrition onBack={handleBack} />;
  if (activeTool === 'exercise' || activeTool === 'exercises') return <Exercises onBack={handleBack} />;
  if (activeTool === 'mood' || activeTool === 'mood-diary') return <MoodDiary onBack={handleBack} />;

  return (
    <div className="pb-28 pt-2 px-5">
      {/* Header */}
      <motion.div className="mb-6" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <h1 className="text-2xl font-black text-foreground">Alətlər</h1>
        <p className="text-muted-foreground mt-1">Sizin üçün faydalı alətlər</p>
      </motion.div>

      {/* Search */}
      <motion.div className="relative mb-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Axtarış..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base transition-all outline-none"
        />
      </motion.div>

      {/* Featured Tool - Photoshoot */}
      <motion.button
        onClick={() => setActiveTool('photoshoot')}
        className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 to-pink-600 p-5 mb-6 shadow-elevated text-left"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">Körpə Fotosessiyası</h3>
            <p className="text-white/80 text-sm">AI ilə sehrli körpə fotoları yaradın</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/60" />
        </div>
      </motion.button>

      {/* Tools Grid */}
      <div className="grid grid-cols-2 gap-4">
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
              className={`bg-card rounded-3xl p-5 text-left shadow-card border border-border/50 relative ${!available ? 'opacity-50' : ''}`}
              whileHover={available ? { scale: 1.02, y: -2 } : {}}
              whileTap={available ? { scale: 0.98 } : {}}
            >
              {!available && (
                <div className="absolute top-3 right-3">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div className={`w-14 h-14 rounded-2xl ${tool.bgColor} flex items-center justify-center mb-4`}>
                <Icon className={`w-7 h-7 ${tool.color}`} />
              </div>
              <h3 className="font-bold text-foreground mb-1">{tool.name}</h3>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
              {tool.minWeek && lifeStage === 'bump' && !available && (
                <p className="text-[10px] text-muted-foreground mt-1">
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
