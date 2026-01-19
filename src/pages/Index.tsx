import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/SplashScreen';
import AuthScreen from '@/components/AuthScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import Dashboard from '@/components/Dashboard';
import PartnerDashboard from '@/components/PartnerDashboard';
import ToolsHub from '@/components/ToolsHub';
import AIChatScreen from '@/components/AIChatScreen';
import ShopScreen from '@/components/ShopScreen';
import ProfileScreen from '@/components/ProfileScreen';
import NotificationsScreen from '@/components/NotificationsScreen';
import SettingsScreen from '@/components/SettingsScreen';
import CalendarScreen from '@/components/CalendarScreen';
import DoctorReportScreen from '@/components/DoctorReportScreen';
import BottomNav from '@/components/BottomNav';
import { useUserStore } from '@/store/userStore';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [activeScreen, setActiveScreen] = useState<string | null>(null);
  const { isAuthenticated, isOnboarded, role } = useUserStore();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (!isOnboarded && role === 'woman') {
    return <OnboardingScreen />;
  }

  // Handle sub-screens from profile menu
  if (activeScreen === 'notifications') {
    return <NotificationsScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'settings') {
    return <SettingsScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'calendar') {
    return <CalendarScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'report') {
    return <DoctorReportScreen onBack={() => setActiveScreen(null)} />;
  }

  const renderContent = () => {
    // Partner role shows Partner Dashboard
    if (role === 'partner') {
      switch (activeTab) {
        case 'home':
          return (
            <motion.div key="partner-home" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <PartnerDashboard />
            </motion.div>
          );
        case 'ai':
          return (
            <motion.div key="ai" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
              <AIChatScreen />
            </motion.div>
          );
        case 'shop':
          return (
            <motion.div key="shop" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ShopScreen />
            </motion.div>
          );
        case 'profile':
          return (
            <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <ProfileScreen onNavigate={setActiveScreen} />
            </motion.div>
          );
        default:
          return null;
      }
    }

    // Woman role shows full navigation
    switch (activeTab) {
      case 'home':
        return (
          <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <Dashboard />
          </motion.div>
        );
      case 'tools':
        return (
          <motion.div key="tools" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ToolsHub />
          </motion.div>
        );
      case 'ai':
        return (
          <motion.div key="ai" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
            <AIChatScreen />
          </motion.div>
        );
      case 'shop':
        return (
          <motion.div key="shop" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ShopScreen />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ProfileScreen onNavigate={setActiveScreen} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top overflow-x-hidden">
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isPartner={role === 'partner'} />
    </div>
  );
};

export default Index;
