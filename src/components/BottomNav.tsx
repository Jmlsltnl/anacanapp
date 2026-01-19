import { motion } from 'framer-motion';
import { Home, Compass, MessageCircle, ShoppingBag, User } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Ana səhifə', icon: Home },
  { id: 'tools', label: 'Alətlər', icon: Compass },
  { id: 'ai', label: 'Dr. Anacan', icon: MessageCircle },
  { id: 'shop', label: 'Mağaza', icon: ShoppingBag },
  { id: 'profile', label: 'Profil', icon: User },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const { lifeStage } = useUserStore();
  
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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center gap-1 py-2 px-3 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full ${getGradientClass()}`}
                />
              )}
              <Icon 
                className={`w-6 h-6 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`} 
              />
              <span className={`text-xs font-medium ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
