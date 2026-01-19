import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Bell, ShoppingCart, MessageCircle, 
  Gift, Calendar, CheckCircle, Plus, ChevronRight,
  Sparkles, Baby, Clock, AlertCircle, Home,
  Coffee, Flower2, Stethoscope
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: any;
  points: number;
  isCompleted: boolean;
  category: 'care' | 'support' | 'surprise';
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  isChecked: boolean;
  addedBy: 'partner' | 'woman';
}

const PartnerDashboard = () => {
  const { partnerWomanData, name } = useUserStore();
  const [activeTab, setActiveTab] = useState<'home' | 'missions' | 'shopping'>('home');
  const [missions, setMissions] = useState<Mission[]>([
    { id: '1', title: 'Səhər çay hazırla', description: 'Zəncəfilli çay ürəkbulanmaya kömək edir', icon: Coffee, points: 10, isCompleted: false, category: 'care' },
    { id: '2', title: 'Ayaq masajı et', description: 'Axşam 15 dəqiqə rahatlatıcı masaj', icon: Heart, points: 20, isCompleted: true, category: 'care' },
    { id: '3', title: 'Gül gətir', description: 'Onu sürpriz etmək üçün', icon: Flower2, points: 15, isCompleted: false, category: 'surprise' },
    { id: '4', title: 'Həkim vizitinə götür', description: 'Bu həftəki USG randevusu', icon: Stethoscope, points: 25, isCompleted: false, category: 'support' },
  ]);
  
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([
    { id: '1', name: 'Süd', quantity: 2, isChecked: false, addedBy: 'woman' },
    { id: '2', name: 'Meyvələr', quantity: 1, isChecked: true, addedBy: 'woman' },
    { id: '3', name: 'Vitaminlər', quantity: 1, isChecked: false, addedBy: 'partner' },
    { id: '4', name: 'Krem', quantity: 1, isChecked: false, addedBy: 'woman' },
  ]);

  const [newItem, setNewItem] = useState('');

  // Mock partner's woman data
  const womanData = partnerWomanData || {
    name: 'Leyla',
    lifeStage: 'bump' as const,
    mood: 4,
    symptoms: ['tired', 'happy'],
  };

  const currentWeek = 24;
  const daysUntilDue = 112;
  const totalPoints = missions.filter(m => m.isCompleted).reduce((sum, m) => sum + m.points, 0);

  const toggleMission = (id: string) => {
    setMissions(missions.map(m => 
      m.id === id ? { ...m, isCompleted: !m.isCompleted } : m
    ));
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList(shoppingList.map(item =>
      item.id === id ? { ...item, isChecked: !item.isChecked } : item
    ));
  };

  const addShoppingItem = () => {
    if (newItem.trim()) {
      setShoppingList([...shoppingList, {
        id: Date.now().toString(),
        name: newItem,
        quantity: 1,
        isChecked: false,
        addedBy: 'partner'
      }]);
      setNewItem('');
    }
  };

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😢', '😔', '😐', '🙂', '😊'];
    return emojis[mood - 1] || '😊';
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-5 pt-6 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm">Partner Paneli</p>
            <h1 className="text-2xl font-black text-white">Salam, {name || 'Partner'}! 👋</h1>
          </div>
          <motion.div
            className="relative"
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-6 h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">2</span>
            </div>
          </motion.div>
        </div>

        {/* Partner Info Card */}
        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-pink-400/30 flex items-center justify-center text-2xl">
              🤰
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg">{womanData.name}</h2>
              <p className="text-white/70">Hamiləlik: {currentWeek}. həftə</p>
            </div>
            <div className="text-right">
              <p className="text-4xl">{getMoodEmoji(womanData.mood || 4)}</p>
              <p className="text-white/60 text-xs">Əhvalı</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Calendar className="w-5 h-5 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold">{daysUntilDue}</p>
              <p className="text-white/60 text-xs">Gün qaldı</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Baby className="w-5 h-5 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold">🥭</p>
              <p className="text-white/60 text-xs">Körpə ölçüsü</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Sparkles className="w-5 h-5 text-white/70 mx-auto mb-1" />
              <p className="text-white font-bold">{totalPoints}</p>
              <p className="text-white/60 text-xs">Xallarım</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-5 -mt-5">
        <div className="bg-card rounded-2xl p-1.5 flex gap-1 shadow-lg">
          {[
            { id: 'home', label: 'Əsas', icon: Home },
            { id: 'missions', label: 'Tapşırıqlar', icon: Gift },
            { id: 'shopping', label: 'Alış-veriş', icon: ShoppingCart },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Alert Card */}
              <motion.div
                className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-amber-800">Xatırlatma</h3>
                  <p className="text-sm text-amber-700">
                    {womanData.name} bu gün yorğunluq hiss edir. Ona dəstək olmağı unutma! 💪
                  </p>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <h2 className="font-bold text-lg pt-2">Sürətli Hərəkətlər</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: MessageCircle, label: 'Mesaj göndər', color: 'bg-blue-100 text-blue-600' },
                  { icon: Heart, label: 'Sevgi göndər', color: 'bg-pink-100 text-pink-600' },
                  { icon: Calendar, label: 'Randevu yarat', color: 'bg-violet-100 text-violet-600' },
                  { icon: Gift, label: 'Sürpriz planla', color: 'bg-amber-100 text-amber-600' },
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card rounded-2xl p-4 flex items-center gap-3 shadow-card border border-border/50"
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-sm">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Today's Tips */}
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-5 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-white" />
                  <h3 className="text-white font-bold">Günün Məsləhəti</h3>
                </div>
                <p className="text-white/90 text-sm">
                  {currentWeek}. həftədə körpə artıq səsləri eşidə bilir. 
                  Ona mahnı oxumaq və ya danışmaq əlaqənizi gücləndirir! 🎵
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'missions' && (
            <motion.div
              key="missions"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg">AI Tapşırıqları</h2>
                <span className="text-sm text-primary font-medium">
                  {missions.filter(m => m.isCompleted).length}/{missions.length} tamamlandı
                </span>
              </div>

              {missions.map((mission, index) => {
                const Icon = mission.icon;
                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-card rounded-2xl p-4 shadow-card border ${
                      mission.isCompleted ? 'border-green-300 bg-green-50/50' : 'border-border/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <motion.button
                        onClick={() => toggleMission(mission.id)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          mission.isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-indigo-100 text-indigo-600'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        {mission.isCompleted ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Icon className="w-6 h-6" />
                        )}
                      </motion.button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-semibold ${mission.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                            {mission.title}
                          </h3>
                          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                            +{mission.points} xal
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{mission.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="font-bold text-lg">Ortaq Alış-veriş Siyahısı</h2>
              
              {/* Add Item */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Yeni məhsul əlavə et..."
                  className="flex-1 h-12 px-4 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary/30 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addShoppingItem()}
                />
                <motion.button
                  onClick={addShoppingItem}
                  className="w-12 h-12 rounded-xl gradient-primary text-white flex items-center justify-center"
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Shopping List */}
              <div className="space-y-2">
                {shoppingList.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-card rounded-xl p-4 flex items-center gap-4 shadow-card border ${
                      item.isChecked ? 'border-green-300 bg-green-50/50' : 'border-border/50'
                    }`}
                  >
                    <motion.button
                      onClick={() => toggleShoppingItem(item.id)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                        item.isChecked 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : 'border-muted-foreground/30'
                      }`}
                      whileTap={{ scale: 0.9 }}
                    >
                      {item.isChecked && <CheckCircle className="w-5 h-5" />}
                    </motion.button>
                    <div className="flex-1">
                      <p className={`font-medium ${item.isChecked ? 'line-through text-muted-foreground' : ''}`}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.addedBy === 'woman' ? `${womanData.name} əlavə etdi` : 'Sən əlavə etdin'}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4 mt-4">
                <p className="text-sm text-center text-muted-foreground">
                  {shoppingList.filter(i => i.isChecked).length} / {shoppingList.length} məhsul alındı
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PartnerDashboard;
