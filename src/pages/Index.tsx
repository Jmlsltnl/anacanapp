import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import SplashScreen from '@/components/SplashScreen';
import AuthScreen from '@/components/AuthScreen';
import OnboardingScreen from '@/components/OnboardingScreen';
import Dashboard from '@/components/Dashboard';
import BottomNav from '@/components/BottomNav';
import { useUserStore } from '@/store/userStore';

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
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

  return (
    <div className="min-h-screen bg-background safe-top">
      <AnimatePresence mode="wait">
        {activeTab === 'home' && <Dashboard key="home" />}
        {activeTab === 'tools' && (
          <div className="p-5 pb-24 text-center text-muted-foreground">Alətlər tezliklə...</div>
        )}
        {activeTab === 'ai' && (
          <div className="p-5 pb-24 text-center text-muted-foreground">Dr. Anacan tezliklə...</div>
        )}
        {activeTab === 'shop' && (
          <div className="p-5 pb-24 text-center text-muted-foreground">Mağaza tezliklə...</div>
        )}
        {activeTab === 'profile' && (
          <div className="p-5 pb-24 text-center text-muted-foreground">Profil tezliklə...</div>
        )}
      </AnimatePresence>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
