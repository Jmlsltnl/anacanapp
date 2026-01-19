import { motion } from 'framer-motion';
import { Home, Compass, MessageCircle, ShoppingBag, User, Heart } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isPartner?: boolean;
}

const womanTabs = [
  { id: 'home', label: 'Ana səhifə', icon: Home },
  { id: 'tools', label: 'Alətlər', icon: Compass },
  { id: 'ai', label: 'Dr. Anacan', icon: MessageCircle },
  { id: 'shop', label: 'Mağaza', icon: ShoppingBag },
  { id: 'profile', label: 'Profil', icon: User },
];

const partnerTabs = [
  { id: 'home', label: 'Əsas', icon: Home },
  { id: 'ai', label: 'Məsləhət', icon: MessageCircle },
  { id: 'shop', label: 'Mağaza', icon: ShoppingBag },
  { id: 'profile', label: 'Profil', icon: User },
];

const BottomNav = ({ activeTab, onTabChange, isPartner = false }: BottomNavProps) => {
  const { lifeStage } = useUserStore();
  
  const getActiveColor = () => {
    switch (lifeStage) {
      case 'flow': return 'text-flow';
      case 'bump': return 'text-bump';
      case 'mommy': return 'text-mommy';
      case 'partner': return 'text-partner';
      default: return 'text-primary';
    }
  };

  const getGradientClass = () => {
    switch (lifeStage) {
      case 'flow': return 'gradient-flow';
      case 'bump': return 'gradient-bump';
      case 'mommy': return 'gradient-mommy';
      case 'partner': return 'gradient-partner';
      default: return 'gradient-primary';
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass background */}
      <div className="absolute inset-0 bg-card/80 backdrop-blur-xl border-t border-border/50" />
      
      <div className="relative safe-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {(isPartner ? partnerTabs : womanTabs).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center gap-1 py-2 px-4 relative"
                whileTap={{ scale: 0.9 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className={`absolute -top-1 w-12 h-1 rounded-full ${getGradientClass()}`}
                    transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                  />
                )}
                
                {/* Icon container */}
                <motion.div
                  className={`relative ${isActive ? '' : ''}`}
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
                >
                  {isActive && (
                    <motion.div
                      className={`absolute inset-0 rounded-full ${getGradientClass()} opacity-20 blur-lg`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 2 }}
                    />
                  )}
                  <Icon 
                    className={`w-6 h-6 relative z-10 transition-colors duration-200 ${
                      isActive ? getActiveColor() : 'text-muted-foreground'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </motion.div>
                
                <motion.span 
                  className={`text-[10px] font-bold transition-colors duration-200 ${
                    isActive ? getActiveColor() : 'text-muted-foreground'
                  }`}
                  animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                >
                  {tab.label}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
