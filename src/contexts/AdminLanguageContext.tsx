import { createContext, useContext, useState, ReactNode } from 'react';

type AdminLanguage = 'az' | 'en' | 'ru' | 'tr';

interface AdminLanguageContextType {
  adminLanguage: AdminLanguage;
  setAdminLanguage: (lang: AdminLanguage) => void;
}

const AdminLanguageContext = createContext<AdminLanguageContextType | undefined>(undefined);

export function AdminLanguageProvider({ children }: { children: ReactNode }) {
  // Try to load from localStorage or default to 'az'
  const getInitialLanguage = (): AdminLanguage => {
    try {
      const stored = localStorage.getItem('anacan_admin_language');
      if (stored === 'az' || stored === 'en' || stored === 'ru' || stored === 'tr') {
        return stored;
      }
    } catch (e) {}
    return 'az';
  };

  const [adminLanguage, setAdminLanguageState] = useState<AdminLanguage>(getInitialLanguage);

  const setAdminLanguage = (lang: AdminLanguage) => {
    setAdminLanguageState(lang);
    try {
      localStorage.setItem('anacan_admin_language', lang);
    } catch (e) {}
  };

  return (
    <AdminLanguageContext.Provider value={{ adminLanguage, setAdminLanguage }}>
      {children}
    </AdminLanguageContext.Provider>
  );
}

export function useAdminLanguage() {
  const context = useContext(AdminLanguageContext);
  if (context === undefined) {
    throw new Error('useAdminLanguage must be used within an AdminLanguageProvider');
  }
  return context;
}
