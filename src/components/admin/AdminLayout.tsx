import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Package, Settings, BarChart3, Shield, 
  ChevronLeft, Menu, LogOut, Bell, Search,
  Database, Key, MessageSquare, Home, Crown, FileText, AlertTriangle, Baby, Pill, Layers, Camera, Image, Scale, Send, ShoppingBag, Wrench, Store, ShieldAlert, BookHeart, MapPin, Gamepad2, Zap, Lightbulb, Megaphone, UtensilsCrossed, Heart, HelpCircle, Sparkles, ShoppingCart, Brain, Calculator, Calendar, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onExit: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'users', label: 'İstifadəçilər', icon: Users },
  { id: 'support', label: 'Dəstək Müraciətləri', icon: MessageSquare },
  { id: 'orders', label: 'Sifarişlər', icon: ShoppingCart },
  { id: 'blog', label: 'Bloq', icon: FileText },
  { id: 'community', label: 'Cəmiyyət', icon: MessageSquare },
  { id: 'moderation', label: 'Moderasiya', icon: AlertTriangle },
  { id: 'subscriptions', label: 'Abunəliklər', icon: Crown },
  { id: 'premium-config', label: 'Premium Səhifə Dizayneri', icon: Crown },
  { id: 'pregnancy', label: 'Hamiləlik Kontenti', icon: Baby },
  { id: 'fruit-images', label: 'Körpə Ölçüsü Şəkilləri', icon: Baby },
  { id: 'vitamins', label: 'Vitaminlər', icon: Pill },
  { id: 'trimester-tips', label: 'Trimester Tövsiyələri', icon: Baby },
  { id: 'flow-content', label: 'Menstruasiya Məzmunu', icon: Baby },
  { id: 'phase-tips', label: 'Faza Məsləhətləri', icon: Lightbulb },
  { id: 'photoshoot', label: 'Fotosessiya', icon: Camera },
  { id: 'dynamic-content', label: 'Dinamik Məzmun', icon: Layers },
  { id: 'recipes', label: 'Reseptlər', icon: UtensilsCrossed },
  { id: 'partner-tips', label: 'Partnyor Məsləhətləri', icon: Heart },
  { id: 'partner-config', label: 'Partner Konfiqurasiya', icon: Heart },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'onboarding', label: 'Qeydiyyat Mərhələləri', icon: Sparkles },
  { id: 'mental-health', label: 'Mental Sağlamlıq', icon: Brain },
  { id: 'tools-config', label: 'Alət Konfiqurasiyaları', icon: Settings },
  { id: 'tools', label: 'Alətlər Sıralaması', icon: Wrench },
  { id: 'default-shopping', label: 'Default Alışveriş Siyahısı', icon: ShoppingCart },
  { id: 'maternity', label: 'Dekret Kalkulyatoru', icon: Calculator },
  { id: 'baby-illustrations', label: 'Körpə İllustrasiyaları', icon: Baby },
  { id: 'crisis-calendar', label: 'Kriz Təqvimi', icon: Calendar },
  { id: 'content', label: 'Digər Kontent', icon: FileText },
  { id: 'products', label: 'Məhsullar', icon: Package },
  { id: 'affiliate', label: 'Affiliate Məhsullar', icon: ShoppingBag },
  { id: 'data', label: 'Məlumatlar', icon: Database },
  { id: 'messages', label: 'Mesajlar', icon: Key },
  { id: 'branding', label: 'Branding', icon: Image },
  { id: 'legal', label: 'Hüquqi Sənədlər', icon: Scale },
  { id: 'push-notifications', label: 'Push Bildirişləri', icon: Send },
  { id: 'marketplace', label: 'İkinci Əl Bazarı', icon: Store },
  { id: 'first-aid', label: 'İlk Yardım (SOS)', icon: ShieldAlert },
  { id: 'fairy-tales', label: 'Sehrli Nağılçı', icon: BookHeart },
  { id: 'places', label: 'Ana Dostu Məkanlar', icon: MapPin },
  { id: 'places-config', label: 'Məkan Konfiqurasiya', icon: MapPin },
  { id: 'healthcare-reviews', label: 'Həkim/Klinika Rəyləri', icon: Stethoscope },
  { id: 'play-activities', label: 'Ağıllı Oyun Qutusu', icon: Gamepad2 },
  { id: 'quick-actions', label: 'Sürətli Keçidlər', icon: Zap },
  { id: 'development-tips', label: 'İnkişaf Tövsiyələri', icon: Lightbulb },
  { id: 'banners', label: 'Bannerlər', icon: Megaphone },
  { id: 'baby-growth', label: 'Böyümə İzləmə', icon: Scale },
  { id: 'teething', label: 'Diş Çıxarma', icon: Sparkles },
  { id: 'settings', label: 'Tənzimləmələr', icon: Settings },
  { id: 'security', label: 'Təhlükəsizlik', icon: Shield },
];

const AdminLayout = ({ children, activeTab, onTabChange, onExit }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();

  // Close mobile sidebar on tab change
  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileSidebarOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    onExit();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: sidebarOpen ? 280 : 80,
          x: 0
        }}
        className={`bg-card border-r border-border flex flex-col fixed h-full z-50 
          max-lg:w-[280px] max-lg:transition-transform max-lg:duration-300
          ${mobileSidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">Admin Panel</h1>
                  <p className="text-xs text-muted-foreground">Anacan</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">
                {profile?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium text-foreground truncate">{profile?.name || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size={sidebarOpen ? "default" : "icon"}
              onClick={onExit}
              className="flex-1"
            >
              <Home className="w-4 h-4" />
              {sidebarOpen && <span className="ml-2">Tətbiqə qayıt</span>}
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size={sidebarOpen ? "default" : "icon"}
            onClick={handleLogout}
            className="w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">Çıxış</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 min-h-screen flex flex-col
        max-lg:ml-0
        ${sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-[80px]'}
      `}>
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden shrink-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Axtar..."
                className="pl-10 bg-muted/50 border-0"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </div>
        </header>

        {/* Page Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-6 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
