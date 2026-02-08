import { useState } from 'react';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminProducts from './admin/AdminProducts';
import AdminSettings from './admin/AdminSettings';
import AdminData from './admin/AdminData';
import AdminMessages from './admin/AdminMessages';
import AdminSecurity from './admin/AdminSecurity';
import AdminCommunity from './admin/AdminCommunity';
import AdminContentManager from './admin/AdminContentManager';
import AdminSubscriptions from './admin/AdminSubscriptions';
import AdminModeration from './admin/AdminModeration';
import AdminPregnancyContent from './admin/AdminPregnancyContent';
import AdminFruitImages from './admin/AdminFruitImages';
import AdminBlog from './admin/AdminBlog';
import AdminSupport from './admin/AdminSupport';
import AdminVitamins from './admin/AdminVitamins';
import AdminDynamicContent from './admin/AdminDynamicContent';
import AdminTrimesterTips from './admin/AdminTrimesterTips';
import AdminPhotoshoot from './admin/AdminPhotoshoot';
import AdminOrders from './admin/AdminOrders';
import AdminBranding from './admin/AdminBranding';
import AdminLegal from './admin/AdminLegal';
import AdminPushNotifications from './admin/AdminPushNotifications';
import AdminAffiliateProducts from './admin/AdminAffiliateProducts';
import AdminTools from './admin/AdminTools';
import AdminFlowContent from './admin/AdminFlowContent';
import AdminMarketplace from './admin/AdminMarketplace';
import AdminFirstAid from './admin/AdminFirstAid';
import AdminFairyTales from './admin/AdminFairyTales';
import AdminPlaces from './admin/AdminPlaces';
import AdminPlayActivities from './admin/AdminPlayActivities';
import AdminQuickActions from './admin/AdminQuickActions';
import AdminDevelopmentTips from './admin/AdminDevelopmentTips';
import AdminBanners from './admin/AdminBanners';
import AdminBabyGrowth from './admin/AdminBabyGrowth';
import AdminRecipes from './admin/AdminRecipes';
import AdminPartnerTips from './admin/AdminPartnerTips';
import AdminFAQ from './admin/AdminFAQ';
import AdminOnboarding from './admin/AdminOnboarding';
import AdminMentalHealth from './admin/AdminMentalHealth';
import AdminToolsConfig from './admin/AdminToolsConfig';
import AdminPlacesConfig from './admin/AdminPlacesConfig';
import AdminPartnerConfig from './admin/AdminPartnerConfig';
import AdminDefaultShoppingItems from './admin/AdminDefaultShoppingItems';
import AdminPremiumConfig from './admin/AdminPremiumConfig';
import AdminMaternityBenefits from './admin/AdminMaternityBenefits';
import AdminBabyIllustrations from './admin/AdminBabyIllustrations';
import AdminBabyCrisisCalendar from './admin/AdminBabyCrisisCalendar';
import AdminPhaseTips from './admin/AdminPhaseTips';

interface AdminPanelProps {
  onExit: () => void;
}

const AdminPanel = ({ onExit }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <AdminUsers />;
      case 'support':
        return <AdminSupport />;
      case 'blog':
        return <AdminBlog />;
      case 'orders':
        return <AdminOrders />;
      case 'products':
        return <AdminProducts />;
      case 'community':
        return <AdminCommunity />;
      case 'content':
        return <AdminContentManager />;
      case 'pregnancy':
        return <AdminPregnancyContent />;
      case 'fruit-images':
        return <AdminFruitImages />;
      case 'vitamins':
        return <AdminVitamins />;
      case 'dynamic-content':
        return <AdminDynamicContent />;
      case 'trimester-tips':
        return <AdminTrimesterTips />;
      case 'flow-symptoms':
        return <AdminFlowContent />;
      case 'flow-content':
        return <AdminFlowContent />;
      case 'photoshoot':
        return <AdminPhotoshoot />;
      case 'subscriptions':
        return <AdminSubscriptions />;
      case 'moderation':
        return <AdminModeration />;
      case 'data':
        return <AdminData />;
      case 'messages':
        return <AdminMessages />;
      case 'settings':
        return <AdminSettings />;
      case 'branding':
        return <AdminBranding />;
      case 'legal':
        return <AdminLegal />;
      case 'push-notifications':
        return <AdminPushNotifications />;
      case 'affiliate':
        return <AdminAffiliateProducts />;
      case 'tools':
        return <AdminTools />;
      case 'marketplace':
        return <AdminMarketplace />;
      case 'first-aid':
        return <AdminFirstAid />;
      case 'fairy-tales':
        return <AdminFairyTales />;
      case 'places':
        return <AdminPlaces />;
      case 'play-activities':
        return <AdminPlayActivities />;
      case 'quick-actions':
        return <AdminQuickActions />;
      case 'development-tips':
        return <AdminDevelopmentTips />;
      case 'banners':
        return <AdminBanners />;
      case 'baby-growth':
        return <AdminBabyGrowth />;
      case 'recipes':
        return <AdminRecipes />;
      case 'partner-tips':
        return <AdminPartnerTips />;
      case 'faq':
        return <AdminFAQ />;
      case 'onboarding':
        return <AdminOnboarding />;
      case 'mental-health':
        return <AdminMentalHealth />;
      case 'tools-config':
        return <AdminToolsConfig />;
      case 'places-config':
        return <AdminPlacesConfig />;
      case 'partner-config':
        return <AdminPartnerConfig />;
      case 'default-shopping':
        return <AdminDefaultShoppingItems />;
      case 'premium-config':
        return <AdminPremiumConfig />;
      case 'maternity':
        return <AdminMaternityBenefits />;
      case 'baby-illustrations':
        return <AdminBabyIllustrations />;
      case 'crisis-calendar':
        return <AdminBabyCrisisCalendar />;
      case 'phase-tips':
        return <AdminPhaseTips />;
      case 'security':
        return <AdminSecurity />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onExit={onExit}
    >
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPanel;
