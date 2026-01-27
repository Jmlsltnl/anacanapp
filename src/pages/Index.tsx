import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/SplashScreen';
import AppIntroduction from '@/components/AppIntroduction';
import AuthScreen from '@/components/AuthScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import Dashboard from '@/components/Dashboard';
import PartnerDashboard from '@/components/PartnerDashboard';
import ToolsHub from '@/components/ToolsHub';
import AIChatScreen from '@/components/AIChatScreen';
import PartnerAIChatScreen from '@/components/PartnerAIChatScreen';
import PartnerMessagesScreen from '@/components/partner/PartnerMessagesScreen';
import ShopScreen from '@/components/ShopScreen';
import ProfileScreen from '@/components/ProfileScreen';
import PartnerProfileScreen from '@/components/PartnerProfileScreen';
import NotificationsScreen from '@/components/NotificationsScreen';
import SettingsScreen from '@/components/SettingsScreen';
import CalendarScreen from '@/components/CalendarScreen';
import AdminPanel from '@/components/AdminPanel';
import BottomNav from '@/components/BottomNav';
import MotherChatScreen from '@/components/MotherChatScreen';
import CommunityScreen from '@/components/community/CommunityScreen';
import ProfileEditScreen from '@/components/ProfileEditScreen';
import HelpScreen from '@/components/HelpScreen';
import PrivacyScreen from '@/components/PrivacyScreen';
import PartnerPrivacyScreen from '@/components/PartnerPrivacyScreen';
import AppearanceScreen from '@/components/AppearanceScreen';
import UserProfileScreen from '@/components/community/UserProfileScreen';
import BillingScreen from '@/components/BillingScreen';
import BlogScreen from '@/components/BlogScreen';
import LegalScreen from '@/components/LegalScreen';
import { useUserStore } from '@/store/userStore';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceToken } from '@/hooks/useDeviceToken';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [activeScreen, setActiveScreen] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMotherChat, setShowMotherChat] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const { isAuthenticated, isOnboarded, role, hasSeenIntro, setHasSeenIntro } = useUserStore();
  const { isAdmin, loading } = useAuth();
  
  // Ref for scroll container to reset position on navigation
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Reset scroll to top when tab or screen changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [activeTab, activeScreen, activeTool]);
  
  // Initialize push notification token registration for native apps
  useDeviceToken();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Show intro if user hasn't seen it
      if (!hasSeenIntro) {
        setShowIntro(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [hasSeenIntro]);

  // Handle tool navigation from Dashboard
  const handleNavigateToTool = (tool: string) => {
    setActiveTool(tool);
    setActiveTab('tools');
  };

  useEffect(() => {
    if (activeScreen === 'admin' && isAdmin) {
      setShowAdmin(true);
      setActiveScreen(null);
    }
  }, [activeScreen, isAdmin]);

  const handleUserClick = (userId: string) => {
    setViewingUserId(userId);
  };

  const renderContent = () => {
    if (role === 'partner') {
      switch (activeTab) {
        case 'home':
          return (
            <motion.div key="partner-home" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <PartnerDashboard />
            </motion.div>
          );
        case 'chat':
          return (
            <motion.div key="partner-chat" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
              <PartnerMessagesScreen />
            </motion.div>
          );
        case 'ai':
          return (
            <motion.div key="partner-ai" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
              <PartnerAIChatScreen />
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
            <Dashboard onOpenChat={() => setShowMotherChat(true)} onNavigateToTool={handleNavigateToTool} />
          </motion.div>
        );
      case 'tools':
        return (
          <motion.div key="tools" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ToolsHub initialTool={activeTool} onBack={() => setActiveTool(null)} />
          </motion.div>
        );
      case 'community':
        return (
          <motion.div key="community" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <CommunityScreen />
          </motion.div>
        );
      case 'ai':
        return (
          <motion.div key="ai" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
            <AIChatScreen />
          </motion.div>
        );
      // Blog is now accessed via Tools, remove from nav tabs
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

  // Splash screen
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // App introduction (first time users)
  if (showIntro) {
    return (
      <AppIntroduction 
        onComplete={() => {
          setShowIntro(false);
          setHasSeenIntro(true);
        }} 
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auth screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // Onboarding - Partners skip onboarding (they don't need phase selection)
  if (!isOnboarded && role !== 'partner') {
    return <OnboardingScreen />;
  }

  // Admin Panel
  if (showAdmin && isAdmin) {
    return <AdminPanel onExit={() => setShowAdmin(false)} />;
  }

  // User Profile View (Community)
  if (viewingUserId) {
    return <UserProfileScreen userId={viewingUserId} onBack={() => setViewingUserId(null)} />;
  }

  // Sub-screens
  if (activeScreen === 'notifications') {
    return <NotificationsScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'settings') {
    return <SettingsScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'calendar') {
    return <CalendarScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'edit-profile') {
    return <ProfileEditScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'help') {
    return <HelpScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'privacy') {
    return <PrivacyScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'partner-privacy') {
    return <PartnerPrivacyScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'appearance') {
    return <AppearanceScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'billing') {
    return <BillingScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'legal') {
    return <LegalScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'blog') {
    return <BlogScreen onBack={() => setActiveScreen(null)} />;
  }
  if (activeScreen === 'shop' && isAdmin) {
    return <ShopScreen onBack={() => setActiveScreen(null)} />;
  }

  // Mother chat overlay (for woman role)
  if (showMotherChat && role === 'woman') {
    return <MotherChatScreen onBack={() => setShowMotherChat(false)} />;
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Status bar area - fills with card background */}
      <div 
        className="bg-card flex-shrink-0" 
        style={{ height: 'env(safe-area-inset-top)' }} 
      />
      
      {/* Main scrollable content area */}
      <div ref={scrollContainerRef} data-scroll-container className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
      
      {/* Bottom navigation with safe area */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isPartner={role === 'partner'} />
    </div>
  );
};

export default Index;
