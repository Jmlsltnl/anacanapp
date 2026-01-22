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
      case 'products':
        return <AdminProducts />;
      case 'community':
        return <AdminCommunity />;
      case 'content':
        return <AdminContentManager />;
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
