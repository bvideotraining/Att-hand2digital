
import React, { useMemo } from 'react';
import { TRANSLATIONS } from '../constants';
import { User, Role } from '../types';

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
}

const Layout: React.FC<LayoutProps> = ({ 
  children, user, language, darkMode, onLogout, onLanguageToggle, onThemeToggle, onSaveDatabase, onNavigate, currentView, syncStatus
}) => {
  // Defensive translation access
  const t = useMemo(() => {
    const safeLang = (language === 'ar' || language === 'en') ? language : 'ar';
    return TRANSLATIONS[safeLang] || TRANSLATIONS.ar;
  }, [language]);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <nav className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => onNavigate('dashboard')}
            >
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <i className="fas fa-file-invoice text-xl"></i>
              </div>
              <h1 className="text-xl font-bold tracking-tight hidden lg:block">
                {t.title}
              </h1>
            </div>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                >
                  {t.dashboard}
                </button>
                {user.role === 'Admin' && (
                  <>
                    <button 
                      onClick={() => onNavigate('dictionary')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${currentView === 'dictionary' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                    >
                      {t.manageDictionary}
                    </button>
                    <button 
                      onClick={() => onNavigate('samples')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${currentView === 'samples' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                    >
                      {t.visualDictionary}
                    </button>
                    <button 
                      onClick={() => onNavigate('users')}
                      className={`px-4 py-2 rounded-lg font-medium transition ${currentView === 'users' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                    >
                      {t.userManagement}
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
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition shadow-sm text-sm ${syncStatus === 'synced' ? 'bg-green-100 text-green-700' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                title={t.saveDatabase}
              >
                <i className={`fas ${syncStatus === 'synced' ? 'fa-check' : 'fa-save'}`}></i>
                <span className="hidden xl:inline">{syncStatus === 'synced' ? 'Synced' : t.saveDatabase}</span>
              </button>
            )}

            <button 
              onClick={onLanguageToggle}
              className={`px-3 py-1 rounded-full text-sm font-medium border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
            >
              {language === 'ar' ? 'English' : 'العربية'}
            </button>
            
            <button 
              onClick={onThemeToggle}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <i className={`fas ${darkMode ? 'fa-sun text-yellow-400' : 'fa-moon text-gray-600'}`}></i>
            </button>
            
            {user && (
              <div className="flex items-center gap-3 border-r pr-3 rtl:border-r-0 rtl:border-l rtl:pl-3">
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-semibold leading-tight">{user.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{t[user.role === 'Admin' ? 'admin' : 'hrUser']}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <footer className={`py-6 border-t text-center text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
        <p>&copy; {new Date().getFullYear()} Arabic Attendance OCR. Secure Dual-Persistence Mode.</p>
      </footer>
    </div>
  );
};

export default Layout;
