import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Briefcase, Baby, User, Share2 } from 'lucide-react';

interface ChecklistItem {
  id: string;
  name: string;
  category: 'mom' | 'baby' | 'documents';
  checked: boolean;
}

const initialChecklist: ChecklistItem[] = [
  // Ana üçün
  { id: '1', name: 'Gecə köynəyi (2-3 ədəd)', category: 'mom', checked: false },
  { id: '2', name: 'Xalat', category: 'mom', checked: false },
  { id: '3', name: 'Ayaqqabı (terlik)', category: 'mom', checked: false },
  { id: '4', name: 'Diş fırçası və pasta', category: 'mom', checked: false },
  { id: '5', name: 'Şampun və sabun', category: 'mom', checked: false },
  { id: '6', name: 'Əmzirmə südqəbi (2-3 ədəd)', category: 'mom', checked: false },
  { id: '7', name: 'Doğuşdan sonra gigiyenik bezlər', category: 'mom', checked: false },
  { id: '8', name: 'Rahat alt paltarları', category: 'mom', checked: false },
  { id: '9', name: 'Dodaq balzamı', category: 'mom', checked: false },
  { id: '10', name: 'Telefon şarj cihazı', category: 'mom', checked: false },
  
  // Körpə üçün
  { id: '11', name: 'Körpə paltarları (3-4 dəst)', category: 'baby', checked: false },
  { id: '12', name: 'Corablar', category: 'baby', checked: false },
  { id: '13', name: 'Papaq', category: 'baby', checked: false },
  { id: '14', name: 'Əlcəklər', category: 'baby', checked: false },
  { id: '15', name: 'Bezlər (yenidoğulmuş ölçüsü)', category: 'baby', checked: false },
  { id: '16', name: 'Yaş salfetlər', category: 'baby', checked: false },
  { id: '17', name: 'Körpə yağı/losyonu', category: 'baby', checked: false },
  { id: '18', name: 'Körpə yorğanı', category: 'baby', checked: false },
  { id: '19', name: 'Avtomobil oturacağı', category: 'baby', checked: false },
  
  // Sənədlər
  { id: '20', name: 'Şəxsiyyət vəsiqəsi', category: 'documents', checked: false },
  { id: '21', name: 'Tibbi sığorta kartı', category: 'documents', checked: false },
  { id: '22', name: 'Doğuş planı', category: 'documents', checked: false },
  { id: '23', name: 'Həkim kontaktları', category: 'documents', checked: false },
  { id: '24', name: 'Xəstəxana qeydiyyatı', category: 'documents', checked: false },
];

interface HospitalBagProps {
  onBack: () => void;
}

const HospitalBag = ({ onBack }: HospitalBagProps) => {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [activeCategory, setActiveCategory] = useState<'all' | 'mom' | 'baby' | 'documents'>('all');

  const toggleItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const categories = [
    { id: 'all', label: 'Hamısı', icon: Briefcase, emoji: '👜' },
    { id: 'mom', label: 'Ana', icon: User, emoji: '👩' },
    { id: 'baby', label: 'Körpə', icon: Baby, emoji: '👶' },
    { id: 'documents', label: 'Sənədlər', icon: Briefcase, emoji: '📄' },
  ];

  const filteredItems = activeCategory === 'all' 
    ? checklist 
    : checklist.filter(item => item.category === activeCategory);

  const checkedCount = checklist.filter(item => item.checked).length;
  const progress = (checkedCount / checklist.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-10 safe-top">
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
            <h1 className="text-xl font-bold text-white">Xəstəxana Çantası</h1>
            <p className="text-white/80 text-sm">Doğuş üçün hazırlıq</p>
          </div>
          <motion.button
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* Progress */}
        <div className="bg-white/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/90 font-medium">Hazırlıq</span>
            <span className="text-white font-bold">{checkedCount}/{checklist.length}</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-4 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'gradient-primary text-white shadow-button'
                  : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Checklist */}
        <div className="space-y-3 pb-8">
          {filteredItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => toggleItem(item.id)}
              className={`w-full p-4 rounded-2xl text-left flex items-center gap-4 transition-all ${
                item.checked
                  ? 'bg-primary/10 border-2 border-primary/30'
                  : 'bg-card border-2 border-border/50 shadow-card'
              }`}
            >
              <motion.div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  item.checked ? 'gradient-primary' : 'bg-muted'
                }`}
                animate={item.checked ? { scale: [1, 1.2, 1] } : {}}
              >
                {item.checked && <Check className="w-5 h-5 text-white" />}
              </motion.div>
              <span className={`flex-1 font-medium transition-all ${
                item.checked ? 'text-primary line-through' : 'text-foreground'
              }`}>
                {item.name}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                item.category === 'mom' ? 'bg-pink-100 text-pink-700' :
                item.category === 'baby' ? 'bg-blue-100 text-blue-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {item.category === 'mom' ? '👩' : item.category === 'baby' ? '👶' : '📄'}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Completion Message */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-center text-white mb-8"
          >
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold">Təbrik edirik!</h3>
            <p className="text-white/80 mt-1">Çantanız hazırdır. Xoşbəxt doğuş!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HospitalBag;
