
import React, { useMemo } from 'react';
import { TRANSLATIONS } from '../constants';
import { User, Role } from '../types';
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
}

const Layout: React.FC<LayoutProps> = ({ 
  children, user, language, darkMode, onLogout, onLanguageToggle, onThemeToggle, onSaveDatabase, onNavigate, currentView, syncStatus, siteSettings
}) => {
  // Defensive translation access
  const t = useMemo(() => {
    const safeLang = (language === 'ar' || language === 'en') ? language : 'ar';
    return TRANSLATIONS[safeLang] || TRANSLATIONS.ar;
  }, [language]);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300`}>
      <nav className={`${darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'} border-b px-4 py-3 sticky top-0 z-50 backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => onNavigate('dashboard')}
            >
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden lg:block">
                HandAttend AI
              </h1>
            </div>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${currentView === 'dashboard' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t.dashboard}
                </button>
                {user.role === 'Admin' && (
                  <>
                    <button 
                      onClick={() => onNavigate('dictionary')}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${currentView === 'dictionary' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <BookOpen className="w-4 h-4" />
                      {t.manageDictionary}
                    </button>
                    <button 
                      onClick={() => onNavigate('samples')}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${currentView === 'samples' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      {t.visualDictionary}
                    </button>
                    <button 
                      onClick={() => onNavigate('users')}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${currentView === 'users' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <Users className="w-4 h-4" />
                      {t.userManagement}
                    </button>
                    <button 
                      onClick={() => onNavigate('cms')}
                      className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 ${currentView === 'cms' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <Globe className="w-4 h-4" />
                      CMS
                    </button>
                  </>
                )}
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

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
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
