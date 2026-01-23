import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, Check, Clock, Heart, Sparkles, 
  Calendar, Star, ChefHat, Music, Camera,
  Flower2, MapPin, MessageCircle, ShoppingBag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/lib/native';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePartnerData } from '@/hooks/usePartnerData';

interface SurpriseIdea {
  id: string;
  title: string;
  description: string;
  emoji: string;
  icon: any;
  category: 'romantic' | 'care' | 'adventure' | 'gift';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

const SURPRISE_IDEAS: SurpriseIdea[] = [
  { 
    id: '1', 
    title: 'Romantik şam yeməyi', 
    description: 'Evdə xüsusi bir axşam yeməyi hazırla. Şamlar, gözəl musiqi və sevimli yeməklər.', 
    emoji: '🕯️',
    icon: ChefHat,
    category: 'romantic',
    difficulty: 'medium',
    points: 50
  },
  { 
    id: '2', 
    title: 'Spa günü', 
    description: 'Evdə masaj və baxım seansi düzəlt. Üz maskaları, ayaq masajı və rahatlatıcı musiqi.', 
    emoji: '💆‍♀️',
    icon: Heart,
    category: 'care',
    difficulty: 'easy',
    points: 30
  },
  { 
    id: '3', 
    title: 'Sürpriz hədiyyə', 
    description: 'Kiçik amma mənalı bir hədiyyə al - həmişə istədiyi bir şey.', 
    emoji: '🎁',
    icon: ShoppingBag,
    category: 'gift',
    difficulty: 'easy',
    points: 25
  },
  { 
    id: '4', 
    title: 'Romantik gəzinti', 
    description: 'Parkda, sahildə və ya şəhərin gözəl yerində romantik gəzinti.', 
    emoji: '🌅',
    icon: MapPin,
    category: 'adventure',
    difficulty: 'easy',
    points: 20
  },
  { 
    id: '5', 
    title: 'Sevgi məktubu', 
    description: 'Hisslərini kağıza tök. Əl yazısı məktub daha xüsusi olacaq.', 
    emoji: '💌',
    icon: MessageCircle,
    category: 'romantic',
    difficulty: 'easy',
    points: 35
  },
  { 
    id: '6', 
    title: 'Çiçək sürprizi', 
    description: 'Gözəl bir buket çiçək al və işdən evə gəldiyində sürpriz et.', 
    emoji: '💐',
    icon: Flower2,
    category: 'gift',
    difficulty: 'easy',
    points: 20
  },
  { 
    id: '7', 
    title: 'Film gecəsi', 
    description: 'Sevimli filmlər, popcorn və rahat bir axşam planla.', 
    emoji: '🎬',
    icon: Star,
    category: 'romantic',
    difficulty: 'easy',
    points: 15
  },
  { 
    id: '8', 
    title: 'Səhər yeməyi sürprizi', 
    description: 'Erkən qalx və yataqda gözəl bir səhər yeməyi hazırla.', 
    emoji: '🥐',
    icon: ChefHat,
    category: 'care',
    difficulty: 'medium',
    points: 40
  },
  { 
    id: '9', 
    title: 'Fotosessiya', 
    description: 'Hamiləlik dövrünün xatirəsi üçün peşəkar fotosessiya təşkil et.', 
    emoji: '📸',
    icon: Camera,
    category: 'adventure',
    difficulty: 'hard',
    points: 75
  },
  { 
    id: '10', 
    title: 'Musiqi playlistи', 
    description: 'Birgə dinlədiyiniz mahnılardan playlist hazırla.', 
    emoji: '🎵',
    icon: Music,
    category: 'romantic',
    difficulty: 'easy',
    points: 15
  },
];

interface PlannedSurprise {
  id: string;
  surpriseId: string;
  plannedDate: string;
  status: 'planned' | 'completed';
  notes?: string;
}

const SurpriseTab = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { partnerProfile } = usePartnerData();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [plannedSurprises, setPlannedSurprises] = useState<PlannedSurprise[]>([]);
  const [selectedSurprise, setSelectedSurprise] = useState<SurpriseIdea | null>(null);
  const [planningDate, setPlanningDate] = useState('');
  const [planningNotes, setPlanningNotes] = useState('');

  const categories = [
    { id: 'all', label: 'Hamısı', emoji: '✨' },
    { id: 'romantic', label: 'Romantik', emoji: '❤️' },
    { id: 'care', label: 'Qayğı', emoji: '🤗' },
    { id: 'adventure', label: 'Macəra', emoji: '🌟' },
    { id: 'gift', label: 'Hədiyyə', emoji: '🎁' },
  ];

  const filteredIdeas = selectedCategory === 'all' 
    ? SURPRISE_IDEAS 
    : SURPRISE_IDEAS.filter(s => s.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'hard': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'romantic': return 'from-pink-500 to-rose-600';
      case 'care': return 'from-violet-500 to-purple-600';
      case 'adventure': return 'from-amber-500 to-orange-600';
      case 'gift': return 'from-emerald-500 to-teal-600';
      default: return 'from-partner to-indigo-600';
    }
  };

  const planSurprise = async () => {
    if (!selectedSurprise || !planningDate) return;

    await hapticFeedback.medium();

    const newPlanned: PlannedSurprise = {
      id: Date.now().toString(),
      surpriseId: selectedSurprise.id,
      plannedDate: planningDate,
      status: 'planned',
      notes: planningNotes,
    };

    setPlannedSurprises(prev => [...prev, newPlanned]);

    // Send notification to partner
    if (profile && partnerProfile) {
      try {
        await supabase.from('partner_messages').insert({
          sender_id: profile.user_id,
          receiver_id: partnerProfile.user_id,
          message_type: 'surprise_planned',
          content: `🎁 Həyat yoldaşın sənin üçün xüsusi bir sürpriz planladı!`,
        });
      } catch (err) {
        console.error('Error sending surprise notification:', err);
      }
    }

    toast({
      title: 'Sürpriz planlandı! 🎉',
      description: `${selectedSurprise.title} - ${new Date(planningDate).toLocaleDateString('az-AZ')}`,
    });

    setSelectedSurprise(null);
    setPlanningDate('');
    setPlanningNotes('');
  };

  const completeSurprise = async (planned: PlannedSurprise) => {
    await hapticFeedback.heavy();

    setPlannedSurprises(prev => 
      prev.map(p => p.id === planned.id ? { ...p, status: 'completed' as const } : p)
    );

    const surprise = SURPRISE_IDEAS.find(s => s.id === planned.surpriseId);

    toast({
      title: `+${surprise?.points || 0} xal qazandın! 🏆`,
      description: `${surprise?.title || 'Sürpriz'} tamamlandı!`,
    });
  };

  const isPlanned = (surpriseId: string) => 
    plannedSurprises.some(p => p.surpriseId === surpriseId && p.status === 'planned');

  return (
    <motion.div
      key="surprise"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Sürpriz Planla</h2>
          <p className="text-sm text-muted-foreground">Onu xoşbəxt etmək üçün ideyalar</p>
        </div>
      </div>

      {/* Planned Surprises */}
      {plannedSurprises.filter(p => p.status === 'planned').length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-partner" />
            Planlanmış Sürprizlər
          </h3>
          {plannedSurprises.filter(p => p.status === 'planned').map(planned => {
            const surprise = SURPRISE_IDEAS.find(s => s.id === planned.surpriseId);
            if (!surprise) return null;
            
            return (
              <motion.div
                key={planned.id}
                className="bg-gradient-to-r from-partner/10 to-violet-500/10 rounded-2xl p-4 border border-partner/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{surprise.emoji}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{surprise.title}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(planned.plannedDate).toLocaleDateString('az-AZ')}
                    </p>
                  </div>
                  <motion.button
                    onClick={() => completeSurprise(planned)}
                    className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center"
                    whileTap={{ scale: 0.9 }}
                  >
                    <Check className="w-5 h-5" />
                  </motion.button>
                </div>
                {planned.notes && (
                  <p className="text-sm text-muted-foreground mt-2 pl-12">{planned.notes}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
        {categories.map(cat => (
          <motion.button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-partner text-white shadow-md'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <span>{cat.emoji}</span>
            <span className="text-sm font-medium">{cat.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Surprise Ideas Grid */}
      <div className="grid gap-4">
        {filteredIdeas.map((idea, index) => {
          const Icon = idea.icon;
          const planned = isPlanned(idea.id);
          
          return (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-card rounded-2xl p-4 shadow-lg border-2 transition-all ${
                planned ? 'border-partner/50 bg-partner/5' : 'border-border/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getCategoryColor(idea.category)} flex items-center justify-center shrink-0 shadow-md`}>
                  <span className="text-2xl">{idea.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{idea.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getDifficultyColor(idea.difficulty)}`}>
                      {idea.difficulty === 'easy' ? 'Asan' : idea.difficulty === 'medium' ? 'Orta' : 'Çətin'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-bold text-amber-600">+{idea.points} xal</span>
                    </div>
                    {planned ? (
                      <span className="text-xs text-partner font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Planlandı
                      </span>
                    ) : (
                      <motion.button
                        onClick={() => setSelectedSurprise(idea)}
                        className="px-4 py-2 bg-partner text-white text-sm font-medium rounded-xl flex items-center gap-1"
                        whileTap={{ scale: 0.95 }}
                      >
                        <Sparkles className="w-4 h-4" />
                        Planla
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Planning Modal */}
      <AnimatePresence>
        {selectedSurprise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedSurprise(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-6" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getCategoryColor(selectedSurprise.category)} flex items-center justify-center`}>
                  <span className="text-3xl">{selectedSurprise.emoji}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedSurprise.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedSurprise.description}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tarix seç</label>
                  <input
                    type="date"
                    value={planningDate}
                    onChange={(e) => setPlanningDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-12 px-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-partner/30 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Qeyd (istəyə bağlı)</label>
                  <textarea
                    value={planningNotes}
                    onChange={(e) => setPlanningNotes(e.target.value)}
                    placeholder="Xüsusi qeydlər..."
                    className="w-full h-24 px-4 py-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-partner/30 outline-none resize-none"
                  />
                </div>
                <motion.button
                  onClick={planSurprise}
                  disabled={!planningDate}
                  className="w-full h-14 bg-gradient-to-r from-partner to-violet-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                  whileTap={{ scale: 0.98 }}
                >
                  <Gift className="w-5 h-5" />
                  Sürprizi Planla
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips Section */}
      <motion.div
        className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-5 border border-pink-200 dark:border-pink-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <h3 className="font-bold text-pink-800 dark:text-pink-200">İpucu</h3>
        </div>
        <p className="text-sm text-pink-700 dark:text-pink-300">
          Kiçik və sadə jestlər çox vaxt ən yadda qalanlar olur. Gözlənilməz anlarda edilən sürprizlər daha xüsusidir! 💕
        </p>
      </motion.div>
    </motion.div>
  );
};

export default SurpriseTab;
