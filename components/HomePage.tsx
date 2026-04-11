
import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  Upload, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Users, 
  Download, 
  Mail, 
  MessageSquare, 
  FileText,
  Globe,
  Moon,
  Sun
} from 'lucide-react';

interface HomePageProps {
  t: any;
  language: string;
  darkMode: boolean;
  siteSettings?: import('../types').SiteSettings;
  appMenuConfig?: import('../types').AppMenuConfig;
  cmsMenuConfig?: import('../types').CmsMenuConfig;
  onGetStarted: () => void;
  onSignIn: () => void;
  onLanguageToggle: () => void;
  onThemeToggle: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  t, 
  language, 
  darkMode, 
  siteSettings,
  appMenuConfig,
  cmsMenuConfig,
  onGetStarted, 
  onSignIn,
  onLanguageToggle,
  onThemeToggle
}) => {
  const isRtl = language === 'ar';
  const appName = cmsMenuConfig?.logoText || appMenuConfig?.appName || 'HandAttend AI';
  const logoImage = cmsMenuConfig?.logoImage || appMenuConfig?.logoImage;

  // Fallback content if siteSettings is not provided
  const heroTitle = isRtl ? (siteSettings?.heroTitleAr || t.heroTitle) : (siteSettings?.heroTitleEn || t.heroTitle);
  const heroSubtitle = isRtl ? (siteSettings?.heroSubtitleAr || t.heroSubtitle) : (siteSettings?.heroSubtitleEn || t.heroSubtitle);
  const ctaText = isRtl ? (siteSettings?.ctaTextAr || t.startForFree) : (siteSettings?.ctaTextEn || t.startForFree);
  
  const features = siteSettings?.features || [
    { id: '1', icon: 'Zap', titleAr: t.feature1Title, titleEn: t.feature1Title, descAr: t.feature1Desc, descEn: t.feature1Desc },
    { id: '2', icon: 'ShieldCheck', titleAr: t.feature2Title, titleEn: t.feature2Title, descAr: t.feature2Desc, descEn: t.feature2Desc },
    { id: '3', icon: 'Download', titleAr: t.feature3Title, titleEn: t.feature3Title, descAr: t.feature3Desc, descEn: t.feature3Desc }
  ];

  const menuStyle = siteSettings?.menuStyle || 'classic';

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b ${darkMode ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              {logoImage ? (
                <img src={logoImage} alt={appName} className="h-8 w-auto object-contain" />
              ) : (
                <div className="bg-blue-600 p-2 rounded-lg">
                  <FileText className="text-white w-5 h-5" />
                </div>
              )}
              <span className="text-xl font-bold tracking-tight">{appName}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors">{t.features}</a>
              <a href="#how-it-works" className="text-sm font-medium hover:text-blue-600 transition-colors">{t.howItWorks}</a>
              <a href="#contact" className="text-sm font-medium hover:text-blue-600 transition-colors">{t.contactUs}</a>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={onLanguageToggle} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition" title={t.switchLanguage}>
                <Globe className="w-5 h-5" />
              </button>
              <button onClick={onThemeToggle} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition" title={darkMode ? t.lightMode : t.darkMode}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={onSignIn} className="text-sm font-bold hover:text-blue-600 transition-colors px-4 py-2">
                {t.signIn}
              </button>
              <button 
                onClick={onGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-500/20"
              >
                {t.getStarted}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold mb-8 border border-blue-100 dark:border-blue-800"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Powered by Gemini 1.5 Pro</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]"
          >
            {heroTitle.split(' ').map((word: string, i: number) => (
              <span key={i} className={i >= 2 ? "text-blue-600" : ""}>{word} </span>
            ))}
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            {heroSubtitle}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              {ctaText}
              <ArrowRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
            </button>
            <button 
              onClick={onSignIn}
              className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg border transition ${darkMode ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              {t.signInToDashboard}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-24 px-4 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.featuresTitle}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t.featuresSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const IconMap: any = { Zap, ShieldCheck, Download, Cpu, Users, Upload, FileText, Globe, Moon, Sun, Mail, MessageSquare };
              const IconComponent = IconMap[feature.icon] || Zap;
              return (
                <motion.div
                  key={feature.id || i}
                  whileHover={{ y: -5 }}
                  className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{isRtl ? feature.titleAr : feature.titleEn}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{isRtl ? feature.descAr : feature.descEn}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.howItWorksTitle}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t.howItWorksSubtitle}</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { icon: <Upload className="w-6 h-6" />, title: t.step1Title, desc: t.step1Desc },
              { icon: <Cpu className="w-6 h-6" />, title: t.step2Title, desc: t.step2Desc },
              { icon: <Users className="w-6 h-6" />, title: t.step3Title, desc: t.step3Desc },
              { icon: <Download className="w-6 h-6" />, title: t.step4Title, desc: t.step4Desc }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`flex items-start gap-6 p-6 rounded-3xl border ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-100'}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400">
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`py-24 px-4 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.contactUsTitle}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t.contactUsSubtitle}</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-100'} shadow-xl`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">{t.sendUsMessage}</h3>
                  <p className="text-xs text-gray-500">{t.fillForm}</p>
                </div>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t.name}</label>
                    <input type="text" className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500 transition`} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t.email}</label>
                    <input type="email" className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500 transition`} placeholder="john@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.subject}</label>
                  <input type="text" className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500 transition`} placeholder={t.howCanWeHelp || "How can we help?"} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.message}</label>
                  <textarea rows={4} className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500 transition`} placeholder={t.yourMessageHere || "Your message here..."}></textarea>
                </div>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  {t.sendMessage}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-12 px-4 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600 w-5 h-5" />
            <span className="font-bold">{t.copyright}</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-gray-500">
            <a href="#" className="hover:text-blue-600 transition-colors">{t.termsOfService}</a>
            <a href="#" className="hover:text-blue-600 transition-colors">{t.privacyPolicy}</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
