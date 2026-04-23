import { useState, useEffect, useLayoutEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/SplashScreen';
import logoImage from '@/assets/logo.png';
import AppIntroduction from '@/components/AppIntroduction';
import AuthScreen from '@/components/AuthScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import BottomNav from '@/components/BottomNav';
import AppRatingPrompt from '@/components/AppRatingPrompt';
import FloatingTimerWidget from '@/components/FloatingTimerWidget';
import { useUserStore } from '@/store/userStore';
import { isNative } from '@/lib/native';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceToken } from '@/hooks/useDeviceToken';
import { useForceUpdate } from '@/hooks/useForceUpdate';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { resetAppScrollPosition } from '@/lib/scroll';
import { initDeeplinkListener, ParsedDeeplink } from '@/lib/deeplink';

// Lazy load heavy screens
const Dashboard = lazy(() => import('@/components/Dashboard'));
const PartnerDashboard = lazy(() => import('@/components/PartnerDashboard'));
const ToolsHub = lazy(() => import('@/components/ToolsHub'));
const AIChatScreen = lazy(() => import('@/components/AIChatScreen'));
const PartnerAIChatScreen = lazy(() => import('@/components/PartnerAIChatScreen'));
const PartnerChatScreen = lazy(() => import('@/components/partner/PartnerChatScreen'));
const ShopScreen = lazy(() => import('@/components/ShopScreen'));
const CakesScreen = lazy(() => import('@/components/CakesScreen'));
const ProfileScreen = lazy(() => import('@/components/ProfileScreen'));
const PartnerProfileScreen = lazy(() => import('@/components/PartnerProfileScreen'));
const NotificationsScreen = lazy(() => import('@/components/NotificationsScreen'));
const SettingsScreen = lazy(() => import('@/components/SettingsScreen'));
const CalendarScreen = lazy(() => import('@/components/CalendarScreen'));
const AdminPanel = lazy(() => import('@/components/AdminPanel'));
const MotherChatScreen = lazy(() => import('@/components/MotherChatScreen'));
const MessagesScreen = lazy(() => import('@/components/MessagesScreen'));
const CommunityScreen = lazy(() => import('@/components/community/CommunityScreen'));
const ProfileEditScreen = lazy(() => import('@/components/ProfileEditScreen'));
const HelpScreen = lazy(() => import('@/components/HelpScreen'));
const PrivacyScreen = lazy(() => import('@/components/PrivacyScreen'));
const PartnerPrivacyScreen = lazy(() => import('@/components/PartnerPrivacyScreen'));
const AppearanceScreen = lazy(() => import('@/components/AppearanceScreen'));
const UserProfileScreen = lazy(() => import('@/components/community/UserProfileScreen'));
const BillingScreen = lazy(() => import('@/components/BillingScreen'));
const BlogScreen = lazy(() => import('@/components/BlogScreen'));
const LegalScreen = lazy(() => import('@/components/LegalScreen'));
const NameVotingScreen = lazy(() => import('@/components/partner/NameVotingScreen'));
const PartnerHospitalBagScreen = lazy(() => import('@/components/partner/PartnerHospitalBagScreen'));
const DailySummaryScreen = lazy(() => import('@/components/partner/DailySummaryScreen'));
const SOSAlertReceiverModule = lazy(() => import('@/components/partner/SOSButton').then(m => ({ default: m.SOSAlertReceiver })));

const suspenseFallback = (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <img src={logoImage} alt="Anacan" className="w-16 h-16 object-contain animate-pulse" />
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
);

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

type SwipeRestoreState =
  | { type: 'screen'; value: string }
  | { type: 'tool'; value: string; fromDashboard: boolean }
  | { type: 'mother-chat' }
  | { type: 'user-profile'; value: string }
  | null;

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [activeScreen, setActiveScreen] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showMotherChat, setShowMotherChat] = useState(false);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolOpenedFromDashboard, setToolOpenedFromDashboard] = useState(false);
  const [toolsResetKey, setToolsResetKey] = useState(0);
  const { isAuthenticated, isOnboarded, role, hasSeenIntro, setHasSeenIntro, lifeStage, hasCompletedFunnel, setFunnelCompleted } = useUserStore();
  const { isAdmin, loading, profile } = useAuth();
  const { forceUpdate, isLoading: forceUpdateLoading } = useForceUpdate();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const swipeRestoreRef = useRef<SwipeRestoreState>(null);

  // Reset scroll to top when tab or screen changes
  // Screen name mapping for clean GA reports
  const SCREEN_NAME_MAP: Record<string, string> = {
    home: 'Dashboard', tools: 'ToolsHub', ai: 'AIChat', shop: 'Shop',
    cakes: 'Cakes', profile: 'Profile', community: 'Community',
  };

  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    resetAppScrollPosition();

    const rafId = requestAnimationFrame(() => {
      resetAppScrollPosition();
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    });

    const timeoutId = window.setTimeout(() => {
      resetAppScrollPosition();
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }, 80);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [activeTab, activeScreen, activeTool]);

  useEffect(() => {
    // Track screen/tab views with proper naming
    const rawName = activeScreen || activeTool || activeTab;
    const screenName = SCREEN_NAME_MAP[rawName || ''] || rawName;
    const screenClass = activeScreen ? 'Screen' : activeTool ? 'Tools' : 'Tab';
    if (screenName && isAuthenticated) {
      import('@/lib/analytics').then(m => m.analytics.logScreenView(screenName, screenClass)).catch(() => {});
    }
  }, [activeTab, activeScreen, activeTool, isAuthenticated]);

  // Initialize push notification token registration for native apps
  useDeviceToken();

  // ─── Deeplink handler ───
  const handleDeeplink = useCallback((parsed: ParsedDeeplink) => {
    console.log('[Deeplink] Handling:', parsed);
    switch (parsed.action) {
      case 'tab':
        setActiveTab(parsed.params.tab);
        setActiveTool(null);
        setActiveScreen(null);
        break;
      case 'tool':
        setActiveTab('tools');
        setActiveTool(parsed.params.tool_id);
        setToolOpenedFromDashboard(false);
        break;
      case 'screen':
        setActiveScreen(parsed.params.screen);
        break;
      case 'messages':
        setShowMotherChat(true);
        break;
      case 'user-profile':
        setViewingUserId(parsed.params.user_id);
        break;
      case 'community-post':
        setActiveTab('community');
        // Community screen will handle post_id via state if needed
        break;
    }
  }, []);

  useEffect(() => {
    const cleanup = initDeeplinkListener(handleDeeplink);
    return cleanup;
  }, [handleDeeplink]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Show intro if user hasn't seen it
      if (!hasSeenIntro) {
        setShowIntro(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [hasSeenIntro]);

  // Handle tool navigation from Dashboard
  const handleNavigateToTool = (tool: string) => {
    // Cakes has its own tab, navigate directly
    if (tool === 'cakes') {
      setActiveTab('cakes');
      return;
    }
    setActiveTool(tool);
    setToolOpenedFromDashboard(true);
    setActiveTab('tools');
  };

  // Handle back from tool - go to Dashboard if opened from there
  const handleToolBack = () => {
    if (toolOpenedFromDashboard) {
      setActiveTool(null);
      setToolOpenedFromDashboard(false);
      setActiveTab('home');
    } else {
      setActiveTool(null);
    }
  };

  // Handle tab change - reset tool state when clicking Tools tab
  const handleTabChange = (tab: string) => {
    // If clicking Tools tab while already on tools, reset to tools list
    if (tab === 'tools') {
      setActiveTool(null);
      setToolOpenedFromDashboard(false);
      // Increment key to force ToolsHub to reset
      setToolsResetKey(prev => prev + 1);
    }
    setActiveTab(tab);
  };

  // iOS-style swipe navigation — only navigates back/forward in the current stack, never switches tabs
  const handleSwipeBack = useCallback(() => {
    if (activeScreen) {
      swipeRestoreRef.current = { type: 'screen', value: activeScreen };
      setActiveScreen(null);
      return;
    }

    if (viewingUserId) {
      swipeRestoreRef.current = { type: 'user-profile', value: viewingUserId };
      setViewingUserId(null);
      return;
    }

    if (showMotherChat) {
      swipeRestoreRef.current = { type: 'mother-chat' };
      setShowMotherChat(false);
      return;
    }

    if (activeTool && activeTab === 'tools') {
      swipeRestoreRef.current = { type: 'tool', value: activeTool, fromDashboard: toolOpenedFromDashboard };
      handleToolBack();
      return;
    }
  }, [activeScreen, viewingUserId, showMotherChat, activeTool, activeTab, toolOpenedFromDashboard, handleToolBack]);

  const handleSwipeForward = useCallback(() => {
    const restore = swipeRestoreRef.current;
    if (!restore) return;

    if (restore.type === 'screen') {
      setActiveScreen(restore.value);
    } else if (restore.type === 'user-profile') {
      setViewingUserId(restore.value);
    } else if (restore.type === 'mother-chat') {
      setShowMotherChat(true);
    } else if (restore.type === 'tool') {
      setActiveTab('tools');
      setActiveTool(restore.value);
      setToolOpenedFromDashboard(restore.fromDashboard);
    }

    swipeRestoreRef.current = null;
  }, []);

  // Enable edge-only swipe navigation for back/forward
  useSwipeNavigation({
    onSwipeBack: handleSwipeBack,
    onSwipeForward: handleSwipeForward,
    edgeWidth: 55,
    threshold: 35,
    enabled: isAuthenticated && !showSplash && !showIntro && !showAdmin
  });

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
              <PartnerDashboard onNavigate={setActiveScreen} />
            </motion.div>
          );
        case 'chat':
          return (
            <motion.div key="partner-chat" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full">
              <PartnerChatScreen onBack={() => setActiveTab('home')} />
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
            <Dashboard onOpenChat={() => setShowMotherChat(true)} onNavigateToTool={handleNavigateToTool} onNavigate={setActiveScreen} />
          </motion.div>
        );
      case 'tools':
        return (
          <motion.div key="tools" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ToolsHub key={toolsResetKey} initialTool={activeTool} onBack={handleToolBack} />
          </motion.div>
        );
      case 'cakes':
        return (
          <motion.div key="cakes" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <CakesScreen />
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <img src={logoImage} alt="Anacan" className="w-16 h-16 object-contain animate-pulse" />
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Force Update check
  if (!forceUpdateLoading && forceUpdate?.enabled) {
    const ForceUpdateScreen = lazy(() => import('@/components/ForceUpdateScreen'));
    return (
      <Suspense fallback={suspenseFallback}>
        <ForceUpdateScreen
          title={forceUpdate.title}
          message={forceUpdate.message}
          androidUrl={forceUpdate.android_url}
          iosUrl={forceUpdate.ios_url}
        />
      </Suspense>
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

  // Reverse Trial Funnel - only dev/web, not partner, not native
  if (!hasCompletedFunnel && !isNative && role !== 'partner') {
    const ReverseTrialFunnel = lazy(() => import('@/components/funnel/ReverseTrialFunnel'));
    return (
      <Suspense fallback={suspenseFallback}>
        <ReverseTrialFunnel onComplete={() => setFunnelCompleted(true)} />
      </Suspense>
    );
  }

  // Admin Panel
  if (showAdmin && isAdmin) {
    return <Suspense fallback={suspenseFallback}><AdminPanel onExit={() => setShowAdmin(false)} /></Suspense>;
  }

  // User Profile View (Community)
  if (viewingUserId) {
    return <Suspense fallback={suspenseFallback}><UserProfileScreen userId={viewingUserId} onBack={() => setViewingUserId(null)} /></Suspense>;
  }

  // Sub-screens
  if (activeScreen === 'notifications') return <Suspense fallback={suspenseFallback}><NotificationsScreen onBack={() => setActiveScreen(null)} onNavigateToCommunity={() => { setActiveScreen(null); setActiveTab('community'); }} /></Suspense>;
  if (activeScreen === 'settings') return <Suspense fallback={suspenseFallback}><SettingsScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'calendar') return <Suspense fallback={suspenseFallback}><CalendarScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'edit-profile') return <Suspense fallback={suspenseFallback}><ProfileEditScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'help') return <Suspense fallback={suspenseFallback}><HelpScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'privacy') return <Suspense fallback={suspenseFallback}><PrivacyScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'partner-privacy') return <Suspense fallback={suspenseFallback}><PartnerPrivacyScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'appearance') return <Suspense fallback={suspenseFallback}><AppearanceScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'billing') return <Suspense fallback={suspenseFallback}><BillingScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'legal' || activeScreen?.startsWith('legal/')) {
    const initialDocType = activeScreen?.startsWith('legal/') ? activeScreen.replace('legal/', '') : undefined;
    return <Suspense fallback={suspenseFallback}><LegalScreen onBack={() => setActiveScreen(null)} initialDocument={initialDocType} /></Suspense>;
  }
  if (activeScreen === 'blog' || activeScreen?.startsWith('blog/')) {
    const initialSlug = activeScreen?.startsWith('blog/') ? activeScreen.replace('blog/', '') : undefined;
    return <Suspense fallback={suspenseFallback}><BlogScreen onBack={() => setActiveScreen(null)} initialSlug={initialSlug} lifeStage={lifeStage} /></Suspense>;
  }
  if (activeScreen === 'shop' && isAdmin) return <Suspense fallback={suspenseFallback}><ShopScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'name-voting' && role === 'partner') return <Suspense fallback={suspenseFallback}><NameVotingScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'partner-hospital-bag' && role === 'partner') return <Suspense fallback={suspenseFallback}><PartnerHospitalBagScreen onBack={() => setActiveScreen(null)} /></Suspense>;
  if (activeScreen === 'daily-summary' && role === 'partner') return <Suspense fallback={suspenseFallback}><DailySummaryScreen onBack={() => setActiveScreen(null)} /></Suspense>;

  // Messages screen (unified: partner + community DMs)
  if (showMotherChat) {
    return (
      <Suspense fallback={suspenseFallback}>
        <MessagesScreen 
          onBack={() => setShowMotherChat(false)} 
          partnerId={profile?.linked_partner_id}
        />
      </Suspense>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* App Rating Prompt */}
      <AppRatingPrompt />
      
      {/* SOS Alert Receiver for partners */}
      {role === 'partner' && <Suspense fallback={null}><SOSAlertReceiverModule /></Suspense>}
      
      {/* Status bar area - fills with card background */}
      <div 
        className="bg-card flex-shrink-0" 
        style={{ height: 'env(safe-area-inset-top)' }} 
      />
      
      {/* Main scrollable content area */}
      <div ref={scrollContainerRef} data-scroll-container className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none pb-16">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </Suspense>
      </div>
      
      {/* Floating timer widget - above bottom nav */}
      <FloatingTimerWidget />
      
      {/* Bottom navigation with safe area */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} isPartner={role === 'partner'} />
    </div>
  );
};

export default Index;
