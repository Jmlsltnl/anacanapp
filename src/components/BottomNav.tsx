import { motion } from 'framer-motion';
import { Home, Compass, MessageCircle, User, Users, BookOpen } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isPartner?: boolean;
}

const womanTabs = [
  { id: 'home', label: 'Əsas', icon: Home },
  { id: 'tools', label: 'Alətlər', icon: Compass },
  { id: 'community', label: 'Cəmiyyət', icon: Users },
  { id: 'ai', label: 'Anacan.AI', icon: MessageCircle },
  { id: 'blog', label: 'Bloq', icon: BookOpen },
  { id: 'profile', label: 'Profil', icon: User },
];

const partnerTabs = [
  { id: 'home', label: 'Əsas', icon: Home },
  { id: 'chat', label: 'Mesajlar', icon: MessageCircle },
  { id: 'ai', label: 'Məsləhət', icon: Compass },
  { id: 'profile', label: 'Profil', icon: User },
];

const BottomNav = ({ activeTab, onTabChange, isPartner = false }: BottomNavProps) => {
  const { lifeStage } = useUserStore();
  const { unreadCount } = useUnreadMessages();
  
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
      {/* Solid background to prevent content showing through */}
      <div className="absolute inset-0 bg-card border-t border-border/50" />
      
      <div className="relative safe-bottom">
        <div className="flex items-center justify-around py-1.5 px-1">
          {(isPartner ? partnerTabs : womanTabs).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            // Show badge on chat tab for unread messages (both partner and woman)
            const showBadge = (tab.id === 'chat' || (tab.id === 'home' && !isPartner)) && unreadCount > 0;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-col items-center gap-0.5 py-1.5 px-2 relative min-w-0"
                whileTap={{ scale: 0.9 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className={`absolute -top-0.5 w-8 h-0.5 rounded-full ${getGradientClass()}`}
                    transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                  />
                )}
                
                {/* Icon container */}
                <motion.div
                  className="relative"
                  animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
                >
                  {isActive && (
                    <motion.div
                      className={`absolute inset-0 rounded-full ${getGradientClass()} opacity-20 blur-md`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.5 }}
                    />
                  )}
                  <Icon 
                    className={`w-5 h-5 relative z-10 transition-colors duration-200 ${
                      isActive ? getActiveColor() : 'text-muted-foreground'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {/* Unread badge */}
                  {showBadge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-destructive rounded-full text-[8px] font-bold text-white flex items-center justify-center z-20"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </motion.div>
                
                <motion.span 
                  className={`text-[9px] font-semibold transition-colors duration-200 truncate max-w-full ${
                    isActive ? getActiveColor() : 'text-muted-foreground'
                  }`}
                  animate={isActive ? { scale: 1.02 } : { scale: 1 }}
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
