import { motion } from 'framer-motion';
import { 
  Search, Shield, Timer, Scale, Baby, Briefcase, 
  Volume2, Camera, Heart, Footprints, ChevronRight,
  Utensils, Activity, Thermometer
} from 'lucide-react';
import { useState } from 'react';
import { useUserStore } from '@/store/userStore';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  category: 'pregnancy' | 'baby' | 'health' | 'fun';
}

const tools: Tool[] = [
  {
    id: 'safety',
    name: 'Təhlükəsizlik',
    description: 'Qida və fəaliyyət yoxlayın',
    icon: Shield,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    category: 'health',
  },
  {
    id: 'kick',
    name: 'Təpik Sayğacı',
    description: 'Körpə hərəkətlərini izləyin',
    icon: Footprints,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    category: 'pregnancy',
  },
  {
    id: 'contraction',
    name: 'Sancı Ölçən',
    description: '5-1-1 qaydası ilə izləyin',
    icon: Timer,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    category: 'pregnancy',
  },
  {
    id: 'weight',
    name: 'Çəki İzləyici',
    description: 'AI analiz ilə çəki takibi',
    icon: Scale,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    category: 'health',
  },
  {
    id: 'names',
    name: 'Körpə Adları',
    description: 'Azərbaycan adları',
    icon: Baby,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    category: 'fun',
  },
  {
    id: 'hospital',
    name: 'Xəstəxana Çantası',
    description: 'Doğuş üçün hazırlıq',
    icon: Briefcase,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    category: 'pregnancy',
  },
  {
    id: 'whitenoise',
    name: 'Bəyaz Küylər',
    description: 'Körpəni sakitləşdirin',
    icon: Volume2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    category: 'baby',
  },
  {
    id: 'photoshoot',
    name: 'AI Fotosessiya',
    description: 'Körpə şəkilləri yaradın',
    icon: Camera,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    category: 'fun',
  },
  {
    id: 'nutrition',
    name: 'Qidalanma',
    description: 'Sağlam qida planı',
    icon: Utensils,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    category: 'health',
  },
  {
    id: 'exercise',
    name: 'Məşqlər',
    description: 'Hamiləlik məşqləri',
    icon: Activity,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    category: 'health',
  },
  {
    id: 'temperature',
    name: 'Temperatur',
    description: 'Bazal temperatur izləyici',
    icon: Thermometer,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    category: 'health',
  },
  {
    id: 'mood',
    name: 'Əhval Gündəliyi',
    description: 'Emosiyalarınızı izləyin',
    icon: Heart,
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50',
    category: 'health',
  },
];

const categories = [
  { id: 'all', name: 'Hamısı' },
  { id: 'pregnancy', name: 'Hamiləlik' },
  { id: 'baby', name: 'Körpə' },
  { id: 'health', name: 'Sağlamlıq' },
  { id: 'fun', name: 'Əyləncə' },
];

const ToolsHub = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { lifeStage } = useUserStore();

  const filteredTools = tools.filter(tool => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="pb-28 pt-2 px-5">
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-2xl font-black text-foreground">Alətlər</h1>
        <p className="text-muted-foreground mt-1">Sizin üçün faydalı alətlər</p>
      </motion.div>

      {/* Search */}
      <motion.div 
        className="relative mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Axtarış..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-4 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base transition-all outline-none"
        />
      </motion.div>

      {/* Categories */}
      <motion.div 
        className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === category.id
                ? 'gradient-primary text-white shadow-button'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {category.name}
          </button>
        ))}
      </motion.div>

      {/* Featured Tool */}
      <motion.div
        className="relative overflow-hidden rounded-3xl gradient-primary p-5 mb-6 shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">Təhlükəsizlik Sorğusu</h3>
            <p className="text-white/80 text-sm">Qida və fəaliyyətlərin təhlükəsizliyini yoxlayın</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/60" />
        </div>
      </motion.div>

      {/* Tools Grid */}
      <motion.div 
        className="grid grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.button
              key={tool.id}
              variants={itemVariants}
              className="bg-card rounded-3xl p-5 text-left shadow-card border border-border/50 hover:shadow-elevated transition-shadow"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`w-14 h-14 rounded-2xl ${tool.bgColor} flex items-center justify-center mb-4`}>
                <Icon className={`w-7 h-7 ${tool.color}`} />
              </div>
              <h3 className="font-bold text-foreground mb-1">{tool.name}</h3>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </motion.button>
          );
        })}
      </motion.div>

      {filteredTools.length === 0 && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-muted-foreground">Heç bir alət tapılmadı</p>
        </motion.div>
      )}
    </div>
  );
};

export default ToolsHub;
