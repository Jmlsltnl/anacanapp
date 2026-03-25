import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Package, Settings, BarChart3, Shield, 
  ChevronLeft, Menu, LogOut, Bell, Search,
  Database, Key, MessageSquare, Home, Crown, FileText, AlertTriangle, Baby, Pill, Layers, Camera, Image, Scale, Send, ShoppingBag, Wrench, Store, ShieldAlert, BookHeart, MapPin, Gamepad2, Zap, Lightbulb, Megaphone, UtensilsCrossed, Heart, HelpCircle, Sparkles, ShoppingCart, Brain, Calculator, Calendar, Stethoscope, Tag, CreditCard, ChevronDown, LayoutDashboard, PenTool, Cog, MapPinned, DollarSign, Palette, Globe, BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onExit: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface MenuGroup {
  id: string;
  label: string;
  emoji: string;
  icon: React.ElementType;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    id: 'main',
    label: 'Əsas Panel & Analitika',
    emoji: '📊',
    icon: LayoutDashboard,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'analytics', label: 'Analitika', icon: BarChart3 },
      { id: 'quick-actions', label: 'Sürətli Keçidlər', icon: Zap },
    ],
  },
  {
    id: 'users',
    label: 'İstifadəçilər & İcma',
    emoji: '👥',
    icon: Users,
    items: [
      { id: 'users', label: 'İstifadəçilər', icon: Users },
      { id: 'community', label: 'Cəmiyyət', icon: MessageSquare },
      { id: 'moderation', label: 'Moderasiya', icon: AlertTriangle },
      { id: 'support', label: 'Dəstək Müraciətləri', icon: MessageSquare },
      { id: 'messages', label: 'Mesajlar', icon: Key },
      { id: 'mommy-daily-messages', label: 'Anaya Mesaj', icon: Heart },
    ],
  },
  {
    id: 'content',
    label: 'Məzmun İdarəetməsi',
    emoji: '📝',
    icon: FileText,
    items: [
      { id: 'blog', label: 'Bloq', icon: FileText },
      { id: 'dynamic-content', label: 'Dinamik Məzmun', icon: Layers },
      { id: 'content', label: 'Digər Kontent', icon: FileText },
      { id: 'data', label: 'Məlumatlar', icon: Database },
      { id: 'faq', label: 'FAQ', icon: HelpCircle },
      { id: 'pregnancy', label: 'Hamiləlik Kontenti', icon: Baby },
      { id: 'flow-content', label: 'Menstruasiya Məzmunu', icon: Baby },
      { id: 'partner-tips', label: 'Partnyor Məsləhətləri', icon: Heart },
      { id: 'mental-health', label: 'Mental Sağlamlıq', icon: Brain },
      { id: 'first-aid', label: 'İlk Yardım (SOS)', icon: ShieldAlert },
      { id: 'recipes', label: 'Reseptlər', icon: UtensilsCrossed },
    ],
  },
  {
    id: 'tools',
    label: 'Modullar & Alətlər',
    emoji: '🛠',
    icon: Wrench,
    items: [
      { id: 'tools-config', label: 'Alət Konfiqurasiyaları', icon: Settings },
      { id: 'tools', label: 'Alətlər Sıralaması', icon: Wrench },
      { id: 'development-tips', label: 'İnkişaf Tövsiyələri', icon: Lightbulb },
      { id: 'baby-growth', label: 'Böyümə İzləmə', icon: Scale },
      { id: 'teething', label: 'Diş Çıxarma', icon: Sparkles },
      { id: 'crisis-calendar', label: 'Kriz Təqvimi', icon: Calendar },
      { id: 'baby-daily-info', label: 'Günlük Məlumatlar (Ana)', icon: Calendar },
      { id: 'phase-tips', label: 'Faza Məsləhətləri', icon: Lightbulb },
      { id: 'trimester-tips', label: 'Trimester Tövsiyələri', icon: Baby },
      { id: 'vitamins', label: 'Vitaminlər', icon: Pill },
      { id: 'maternity', label: 'Dekret Kalkulyatoru', icon: Calculator },
      { id: 'default-shopping', label: 'Default Alışveriş Siyahısı', icon: ShoppingCart },
      { id: 'fairy-tales', label: 'Sehrli Nağılçı', icon: BookHeart },
    ],
  },
  {
    id: 'commerce',
    label: 'Satış & E-Ticarət',
    emoji: '💰',
    icon: DollarSign,
    items: [
      { id: 'subscriptions', label: 'Abunəliklər', icon: Crown },
      { id: 'orders', label: 'Sifarişlər', icon: ShoppingCart },
      { id: 'epoint', label: 'Epoint Ödəniş', icon: CreditCard },
      { id: 'products', label: 'Məhsullar', icon: Package },
      { id: 'affiliate', label: 'Affiliate Məhsullar', icon: ShoppingBag },
      { id: 'marketplace', label: 'İkinci Əl Bazarı', icon: Store },
      { id: 'play-activities', label: 'Ağıllı Oyun Qutusu', icon: Gamepad2 },
      { id: 'album-orders', label: 'Albom Sifarişləri', icon: Package },
      { id: 'cakes', label: 'Tortlar', icon: Package },
      { id: 'photoshoot', label: 'Fotosessiya', icon: Camera },
      { id: 'coupons', label: 'Kupon Kodları', icon: Tag },
    ],
  },
  {
    id: 'places',
    label: 'Məkanlar & Partnyorlar',
    emoji: '📍',
    icon: MapPinned,
    items: [
      { id: 'places', label: 'Ana Dostu Məkanlar', icon: MapPin },
      { id: 'places-config', label: 'Məkan Konfiqurasiya', icon: MapPin },
      { id: 'healthcare-reviews', label: 'Həkim/Klinika Rəyləri', icon: Stethoscope },
      { id: 'partner-config', label: 'Partner Konfiqurasiya', icon: Heart },
    ],
  },
  {
    id: 'design',
    label: 'UI Dizayn & Branding',
    emoji: '🎨',
    icon: Palette,
    items: [
      { id: 'premium-config', label: 'Premium Səhifə Dizayneri', icon: Crown },
      { id: 'intro-slides', label: 'Qarşılama Ekranları', icon: Sparkles },
      { id: 'onboarding', label: 'Qeydiyyat Mərhələləri', icon: Sparkles },
      { id: 'banners', label: 'Bannerlər', icon: Megaphone },
      { id: 'branding', label: 'Branding', icon: Image },
      { id: 'baby-illustrations', label: 'Körpə İllustrasiyaları', icon: Baby },
      { id: 'fruit-images', label: 'Körpə Ölçüsü Şəkilləri', icon: Baby },
    ],
  },
  {
    id: 'system',
    label: 'Sistem Tənzimləmələri',
    emoji: '⚙️',
    icon: Cog,
    items: [
      { id: 'settings', label: 'Tənzimləmələr', icon: Settings },
      { id: 'security', label: 'Təhlükəsizlik', icon: Shield },
      { id: 'legal', label: 'Hüquqi Sənədlər', icon: Scale },
      { id: 'push-notifications', label: 'Push Bildirişləri', icon: Send },
      { id: 'force-update', label: 'Force Update', icon: Shield },
    ],
  },
];

// Find which group contains the active tab
const findActiveGroup = (activeTab: string): string | null => {
  for (const group of menuGroups) {
    if (group.items.some(item => item.id === activeTab)) {
      return group.id;
    }
  }
  return null;
};

const AdminLayout = ({ children, activeTab, onTabChange, onExit }: AdminLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const activeGroup = findActiveGroup(activeTab);
    return new Set(activeGroup ? [activeGroup] : ['main']);
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { profile, signOut } = useAuth();

  const { data: pendingCounts } = useQuery({
    queryKey: ['admin-pending-counts'],
    queryFn: async () => {
      const [placesRes, reviewsRes] = await Promise.all([
        supabase.from('mom_friendly_places').select('id', { count: 'exact', head: true }).eq('is_verified', false),
        supabase.from('place_reviews').select('id', { count: 'exact', head: true }).eq('is_verified', false),
      ]);
      return {
        places: (placesRes.count || 0) + (reviewsRes.count || 0),
      };
    },
    refetchInterval: 30000,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileSidebarOpen(false);
    // Auto-expand the group containing the selected tab
    const group = findActiveGroup(tab);
    if (group) {
      setExpandedGroups(prev => new Set(prev).add(group));
    }
  };

  const handleLogout = async () => {
    await signOut();
    onExit();
  };

  // Filter menu items based on search
  const filteredGroups = searchQuery.trim()
    ? menuGroups
        .map(group => ({
          ...group,
          items: group.items.filter(item =>
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter(group => group.items.length > 0)
    : menuGroups;

  const sidebarWidth = sidebarOpen ? 280 : 72;

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
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          "bg-card border-r border-border flex flex-col fixed h-full z-50",
          "max-lg:w-[300px] max-lg:transition-transform max-lg:duration-300",
          mobileSidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 min-w-0"
              >
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-bold text-sm text-foreground truncate">Admin Panel</h1>
                  <p className="text-[10px] text-muted-foreground">Anacan</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="shrink-0 h-8 w-8 hidden lg:flex"
          >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Search (only when expanded) */}
        {sidebarOpen && (
          <div className="px-3 py-2 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Menyu axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/50 border-0"
              />
            </div>
          </div>
        )}

        {/* Navigation - Accordion Groups */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1.5">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id) || searchQuery.trim().length > 0;
            const hasActiveItem = group.items.some(item => item.id === activeTab);

            return (
              <div key={group.id} className="px-2 mb-0.5">
                {/* Group Header */}
                <button
                  onClick={() => sidebarOpen ? toggleGroup(group.id) : undefined}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-all text-left",
                    hasActiveItem
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !sidebarOpen && "justify-center px-0"
                  )}
                  title={!sidebarOpen ? group.label : undefined}
                >
                  <group.icon className="w-4 h-4 shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="text-xs font-semibold truncate flex-1">
                        {group.emoji} {group.label}
                      </span>
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} />
                    </>
                  )}
                </button>

                {/* Group Items */}
                <AnimatePresence initial={false}>
                  {sidebarOpen && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pl-3 py-0.5 space-y-0.5">
                        {group.items.map((item) => {
                          const pendingCount = item.id === 'places' ? pendingCounts?.places : 0;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleTabChange(item.id)}
                              className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all text-left text-xs",
                                activeTab === item.id
                                  ? "bg-primary/15 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                              )}
                            >
                              <item.icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate flex-1">{item.label}</span>
                              {pendingCount && pendingCount > 0 ? (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full shrink-0">
                                  {pendingCount}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-xs">
                {profile?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs text-foreground truncate">{profile?.name || 'Admin'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{profile?.email}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onExit}
              className={cn("flex-1 h-7 text-xs", !sidebarOpen && "px-2")}
            >
              <Home className="w-3.5 h-3.5" />
              {sidebarOpen && <span className="ml-1.5">Tətbiqə qayıt</span>}
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              "w-full mt-1.5 h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10",
              !sidebarOpen && "px-2"
            )}
          >
            <LogOut className="w-3.5 h-3.5" />
            {sidebarOpen && <span className="ml-1.5">Çıxış</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-200 min-h-screen flex flex-col",
        "max-lg:ml-0",
        sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-[72px]'
      )}>
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden shrink-0 h-8 w-8"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Axtar..."
                className="pl-10 h-9 bg-muted/50 border-0"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
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
