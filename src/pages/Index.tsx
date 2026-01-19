import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/SplashScreen';
import AuthScreen from '@/components/AuthScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import Dashboard from '@/components/Dashboard';
import PartnerDashboard from '@/components/PartnerDashboard';
import ToolsHub from '@/components/ToolsHub';
import AIChatScreen from '@/components/AIChatScreen';
import PartnerAIChatScreen from '@/components/PartnerAIChatScreen';
import ShopScreen from '@/components/ShopScreen';
import ProfileScreen from '@/components/ProfileScreen';
import PartnerProfileScreen from '@/components/PartnerProfileScreen';
import NotificationsScreen from '@/components/NotificationsScreen';
import SettingsScreen from '@/components/SettingsScreen';
import CalendarScreen from '@/components/CalendarScreen';
import DoctorReportScreen from '@/components/DoctorReportScreen';
import AdminPanel from '@/components/AdminPanel';
import BottomNav from '@/components/BottomNav';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [activeScreen, setActiveScreen] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const { isAuthenticated, isOnboarded, role } = useUserStore();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (!isOnboarded && role === 'woman') {
    return <OnboardingScreen />;
  }

  // Show Admin Panel
  if (showAdmin && isAdmin) {
    return <AdminPanel onExit={() => setShowAdmin(false)} />;
  }

  // Handle sub-screens
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
  // Handle admin screen navigation
  useEffect(() => {
    if (activeScreen === 'admin' && isAdmin) {
      setShowAdmin(true);
      setActiveScreen(null);
    }
  }, [activeScreen, isAdmin]);

  const renderContent = () => {
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
            <motion.div key="partner-ai" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
              <PartnerAIChatScreen />
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
            <motion.div key="partner-profile" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <PartnerProfileScreen onNavigate={setActiveScreen} />
            </motion.div>
          );
        default:
          return null;
      }
    }

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
