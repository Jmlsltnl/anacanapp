import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Check, AlertTriangle, X, Sparkles } from 'lucide-react';

interface SafetyItem {
  name: string;
  status: 'safe' | 'warning' | 'danger';
  description: string;
  category: string;
}

const safetyData: SafetyItem[] = [
  { name: 'Suşi', status: 'danger', description: 'Çiy balıq listerioza səbəb ola bilər', category: 'food' },
  { name: 'Pasta', status: 'safe', description: 'Tam bişmiş pasta təhlükəsizdir', category: 'food' },
  { name: 'Kofe', status: 'warning', description: 'Gündə 200mg-dan az kofein təhlükəsizdir', category: 'drink' },
  { name: 'Yaşıl çay', status: 'warning', description: 'Mülayim miqdarda içmək olar', category: 'drink' },
  { name: 'Üzgüçülük', status: 'safe', description: 'Hamiləlik üçün əla məşqdir', category: 'activity' },
  { name: 'Sauna', status: 'danger', description: 'Yüksək temperatur körpəyə zərər verə bilər', category: 'activity' },
  { name: 'Yoga', status: 'safe', description: 'Prenatal yoga çox faydalıdır', category: 'activity' },
  { name: 'Pendir (yumşaq)', status: 'danger', description: 'Brie, Camembert kimi yumşaq pendirlər təhlükəlidir', category: 'food' },
  { name: 'Bişmiş yumurta', status: 'safe', description: 'Tam bişmiş yumurta təhlükəsizdir', category: 'food' },
  { name: 'Bal', status: 'safe', description: 'Hamiləlik zamanı bal yemək olar', category: 'food' },
  { name: 'Saç boyası', status: 'warning', description: '2-ci trimesterdən sonra istifadə edin', category: 'beauty' },
  { name: 'Təyyarə səyahəti', status: 'warning', description: '36 həftəyə qədər adətən təhlükəsizdir', category: 'activity' },
];

const categories = [
  { id: 'all', name: 'Hamısı', emoji: '✨' },
  { id: 'food', name: 'Qida', emoji: '🍽️' },
  { id: 'drink', name: 'İçki', emoji: '🥤' },
  { id: 'activity', name: 'Fəaliyyət', emoji: '🏃‍♀️' },
  { id: 'beauty', name: 'Gözəllik', emoji: '💄' },
];

interface SafetyLookupProps {
  onBack: () => void;
}

const SafetyLookup = ({ onBack }: SafetyLookupProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<SafetyItem | null>(null);

  const filteredItems = safetyData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: SafetyItem['status']) => {
    switch (status) {
      case 'safe': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-red-500';
    }
  };

  const getStatusBg = (status: SafetyItem['status']) => {
    switch (status) {
      case 'safe': return 'bg-emerald-50 border-emerald-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'danger': return 'bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = (status: SafetyItem['status']) => {
    switch (status) {
      case 'safe': return <Check className="w-5 h-5 text-emerald-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'danger': return <X className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusText = (status: SafetyItem['status']) => {
    switch (status) {
      case 'safe': return 'Təhlükəsiz';
      case 'warning': return 'Ehtiyatlı olun';
      case 'danger': return 'Təhlükəli';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-8 safe-top">
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Təhlükəsizlik Sorğusu</h1>
            <p className="text-white/80 text-sm">Qida və fəaliyyətləri yoxlayın</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          <input
            type="text"
            placeholder="Nə yoxlamaq istəyirsiniz?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/20 border border-white/20 text-white placeholder:text-white/60 text-base outline-none focus:bg-white/30 transition-colors"
          />
        </div>
      </div>

      <div className="px-5 -mt-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-button'
                  : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="space-y-3 pb-8">
          {filteredItems.map((item, index) => (
            <motion.button
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${getStatusBg(item.status)}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${getStatusColor(item.status)} flex items-center justify-center`}>
                  {getStatusIcon(item.status)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  item.status === 'safe' ? 'bg-emerald-100 text-emerald-700' :
                  item.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {getStatusText(item.status)}
                </span>
              </div>
            </motion.button>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-muted-foreground">Heç nə tapılmadı</p>
              <p className="text-sm text-muted-foreground mt-1">Başqa bir şey axtarın</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card rounded-t-3xl p-6 safe-bottom"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
              
              <div className={`w-20 h-20 rounded-2xl ${getStatusColor(selectedItem.status)} flex items-center justify-center mx-auto mb-4`}>
                {selectedItem.status === 'safe' && <Check className="w-10 h-10 text-white" />}
                {selectedItem.status === 'warning' && <AlertTriangle className="w-10 h-10 text-white" />}
                {selectedItem.status === 'danger' && <X className="w-10 h-10 text-white" />}
              </div>

              <h2 className="text-2xl font-black text-center text-foreground mb-2">{selectedItem.name}</h2>
              <p className={`text-center font-bold mb-4 ${
                selectedItem.status === 'safe' ? 'text-emerald-600' :
                selectedItem.status === 'warning' ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {getStatusText(selectedItem.status)}
              </p>
              <p className="text-center text-muted-foreground mb-6">{selectedItem.description}</p>

              <button
                onClick={() => setSelectedItem(null)}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold shadow-button"
              >
                Bağla
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SafetyLookup;
