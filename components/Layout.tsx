
import React, { useMemo } from 'react';
import { TRANSLATIONS } from '../constants';
import { User, Role, AppMenuConfig } from '../types';
import { 
  FileText, 
  LayoutDashboard, 
  BookOpen, 
  Image as ImageIcon, 
  Users, 
  LogOut, 
  Globe, 
  Sun, 
  Moon, 
  Check, 
  Save 
} from 'lucide-react';

// Map icon names to actual components
const IconMap: Record<string, React.FC<any>> = {
  LayoutDashboard,
  BookOpen,
  ImageIcon,
  Users,
  Globe,
  FileText
};

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  language: 'ar' | 'en';
  darkMode: boolean;
  onLogout: () => void;
  onLanguageToggle: () => void;
  onThemeToggle: () => void;
  onSaveDatabase: () => void;
  onNavigate: (view: any) => void;
  currentView: string;
  syncStatus?: string | null;
  siteSettings?: import('../types').SiteSettings;
  appMenuConfig?: AppMenuConfig;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, user, language, darkMode, onLogout, onLanguageToggle, onThemeToggle, onSaveDatabase, onNavigate, currentView, syncStatus, siteSettings, appMenuConfig
}) => {
  // Defensive translation access
  const t = useMemo(() => {
    const safeLang = (language === 'ar' || language === 'en') ? language : 'ar';
    return TRANSLATIONS[safeLang] || TRANSLATIONS.ar;
  }, [language]);

  const defaultMenuConfig: AppMenuConfig = {
    appName: 'HandAttend AI',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontColor: darkMode ? '#ffffff' : '#1f2937',
    items: [
      { id: 'dashboard', name: t.dashboard, link: 'dashboard', icon: 'LayoutDashboard' },
      { id: 'dictionary', name: t.manageDictionary, link: 'dictionary', icon: 'BookOpen' },
      { id: 'samples', name: t.visualDictionary, link: 'samples', icon: 'ImageIcon' },
      { id: 'users', name: t.userManagement, link: 'users', icon: 'Users' },
      { id: 'cms', name: 'CMS', link: 'cms', icon: 'Globe' }
    ]
  };

  const menu = appMenuConfig || defaultMenuConfig;

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`} style={{ fontFamily: menu.fontFamily }}>
      <nav className={`${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b px-4 py-3 sticky top-0 z-50 backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => onNavigate('dashboard')}
            >
              {menu.logoImage ? (
                <img src={menu.logoImage} alt={menu.appName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
              )}
              <h1 className="text-xl font-bold tracking-tight hidden lg:block" style={{ color: menu.fontColor }}>
                {menu.appName}
              </h1>
            </div>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                {menu.items.map(item => {
                  // Only show admin items to admins
                  if (user.role !== 'Admin' && item.id !== 'dashboard') return null;
                  
                  const IconComponent = IconMap[item.icon] || FileText;
                  
                  return (
                    <button 
                      key={item.id}
                      onClick={() => onNavigate(item.link)}
                      style={{ fontSize: menu.fontSize, color: currentView === item.link ? undefined : menu.fontColor }}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${currentView === item.link ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <button 
                onClick={onSaveDatabase}
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition shadow-sm text-sm ${syncStatus === 'synced' ? 'bg-green-100 text-green-700' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                title={t.saveDatabase}
              >
                {syncStatus === 'synced' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span className="hidden xl:inline">{syncStatus === 'synced' ? 'Synced' : t.saveDatabase}</span>
              </button>
            )}

            <button 
              onClick={onLanguageToggle}
              className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              title={t.switchLanguage}
            >
              <Globe className="w-5 h-5" />
            </button>
            
            <button 
              onClick={onThemeToggle}
              className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              title={darkMode ? t.lightMode : t.darkMode}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
            
            {user && (
              <div className="flex items-center gap-3 border-r dark:border-gray-800 pr-3 rtl:border-r-0 rtl:border-l rtl:pl-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold leading-tight">{user.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t[user.role === 'Admin' ? 'admin' : 'hrUser']}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition"
                  title={t.logout}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className={`flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 ${currentView === 'review' ? 'max-w-[120rem]' : 'max-w-7xl'}`}>
        {children}
      </main>

      <footer className={`py-8 border-t text-center text-sm ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-white border-gray-100 text-gray-500'}`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} HandAttend AI. {t.copyright_footer || 'Secure Dual-Persistence Mode.'}</p>
          <div className="flex gap-6 items-center">
            {siteSettings?.socialLinks?.facebook && <a href={siteSettings.socialLinks.facebook} target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors">Facebook</a>}
            {siteSettings?.socialLinks?.twitter && <a href={siteSettings.socialLinks.twitter} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Twitter</a>}
            {siteSettings?.socialLinks?.linkedin && <a href={siteSettings.socialLinks.linkedin} target="_blank" rel="noreferrer" className="hover:text-blue-700 transition-colors">LinkedIn</a>}
            {siteSettings?.socialLinks?.github && <a href={siteSettings.socialLinks.github} target="_blank" rel="noreferrer" className="hover:text-gray-900 dark:hover:text-white transition-colors">GitHub</a>}
            <a href="#" className="hover:text-blue-600 transition-colors">{t.termsOfService}</a>
            <a href="#" className="hover:text-blue-600 transition-colors">{t.privacyPolicy}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
