import React, { useState, useEffect } from 'react';
import { CmsPage, CmsMenuConfig, CmsBlock, HeroBlock, RichTextBlock, CardsBlock, FormBlock, NewsletterBlock, FooterBlock } from '../types';
import { motion } from 'framer-motion';
import { Zap, ShieldCheck, CheckCircle, Download, Cpu, Users, Upload, FileText, Globe, Moon, Sun, Mail, MessageSquare, ArrowRight, Heart, Star, Bell, Camera, Coffee, Music, Video, MapPin, Search, Settings, Trash2, Edit, Save, Plus, X, Home, Layout, Type, CreditCard, FormInput, PanelBottom, ArrowLeft, Copy, ExternalLink, Eye, GripVertical, ChevronDown, ChevronUp, Key, Code, RefreshCw, Link as LinkIcon } from 'lucide-react';

interface PublicPageProps {
  page: CmsPage;
  pages: CmsPage[];
  menuConfig: CmsMenuConfig;
  darkMode: boolean;
  language: string;
  onLanguageToggle: () => void;
  onThemeToggle: () => void;
  onSignIn: () => void;
  onNewsletterSubmit?: (email: string) => Promise<void>;
  onContactSubmit?: (formId: string, formTitle: string, data: any) => Promise<void>;
}

const PublicPage: React.FC<PublicPageProps> = ({ page, pages, menuConfig: rawMenuConfig, darkMode, language, onLanguageToggle, onThemeToggle, onSignIn, onNewsletterSubmit, onContactSubmit }) => {
  const menuConfig = React.useMemo(() => ({
    backgroundStyle: 'solid' as const,
    backgroundColor: '#ffffff',
    gradientStart: '#3b82f6',
    gradientEnd: '#2563eb',
    bottomBorder: 'line' as const,
    sticky: true,
    textColor: '#1f2937',
    hoverColor: '#2563eb',
    logoText: 'HR ERP',
    logoPosition: 'left' as const,
    showSocial: true,
    socialPosition: 'right' as const,
    socialLinks: [],
    showSignIn: true,
    signInText: 'Sign In',
    signInLink: '/login',
    signInBgColor: '#2563eb',
    signInTextColor: '#ffffff',
    signInBorderColor: '#2563eb',
    signInHoverBgColor: '#1d4ed8',
    signInStyle: 'solid' as const,
    ...(rawMenuConfig || {})
  }), [rawMenuConfig]);

  const getNavBackground = () => {
    switch (menuConfig.backgroundStyle) {
      case 'solid': return { backgroundColor: menuConfig.backgroundColor };
      case 'gradient': return { backgroundImage: `linear-gradient(to right, ${menuConfig.gradientStart || '#3b82f6'}, ${menuConfig.gradientEnd || '#2563eb'})` };
      case 'transparent': return { backgroundColor: 'transparent' };
      case 'glass': return {}; // Handled by classes
      default: return {};
    }
  };

  const getNavClasses = () => {
    let classes = menuConfig.sticky ? 'sticky top-0 z-50 ' : '';
    
    if (menuConfig.backgroundStyle === 'glass') {
      classes += darkMode ? 'bg-gray-900/70 backdrop-blur-lg ' : 'bg-white/70 backdrop-blur-lg ';
    } else if (menuConfig.backgroundStyle === 'transparent') {
      classes += 'bg-transparent ';
    }

    if (menuConfig.bottomBorder === 'line') {
      classes += 'border-b ' + (darkMode ? 'border-gray-800 ' : 'border-gray-200 ');
    } else if (menuConfig.bottomBorder === 'shadow') {
      classes += 'shadow-lg ';
    }

    return classes;
  };

  const formatLink = (link?: string) => {
    if (!link) return '#';
    if (link.startsWith('http')) return link;
    if (link.startsWith('#')) return link;
    return '#' + (link.startsWith('/') ? link : '/' + link);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Globe className="w-5 h-5" />;
      case 'linkedin': return <Users className="w-5 h-5" />;
      case 'youtube': return <Cpu className="w-5 h-5" />;
      case 'github': return <FileText className="w-5 h-5" />;
      case 'twitter': return <MessageSquare className="w-5 h-5" />;
      case 'instagram': return <Zap className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
  };

  const menuPages = pages.filter(p => p.inMenu);

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'} transition-colors duration-300`}>
      {/* Navigation */}
      <nav className={`${getNavClasses()} px-4 py-4 transition-all duration-300`} style={getNavBackground()}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href="#" className="flex items-center gap-2 group">
              {menuConfig.logoImage ? (
                <img src={menuConfig.logoImage} alt="Logo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  {menuConfig.logoText.charAt(0)}
                </div>
              )}
              <span className="text-xl font-extrabold tracking-tight" style={{ color: menuConfig.textColor }}>{menuConfig.logoText}</span>
            </a>

            {menuConfig.showSocial && menuConfig.socialPosition === 'left' && (
              <div className="hidden lg:flex items-center gap-3 border-l border-gray-200 dark:border-gray-800 pl-6 ml-2">
                {menuConfig.socialLinks.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" style={{ color: menuConfig.textColor }}>
                    {getSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            )}
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            {menuPages.map(p => (
              <a 
                key={p.id} 
                href={`#${p.slug === '/' ? '' : p.slug}`} 
                className={`font-bold transition-all relative group py-2`}
                style={{ color: page.id === p.id ? menuConfig.hoverColor : menuConfig.textColor }}
              >
                {language === 'ar' && p.titleAr ? p.titleAr : p.title}
                <span 
                  className="absolute bottom-0 left-0 w-0 h-0.5 transition-all group-hover:w-full"
                  style={{ backgroundColor: menuConfig.hoverColor }}
                />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {menuConfig.showSocial && menuConfig.socialPosition === 'right' && (
              <div className="hidden lg:flex items-center gap-3 mr-2">
                {menuConfig.socialLinks.map(link => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110" style={{ color: menuConfig.textColor }}>
                    {getSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            )}

            <button 
              onClick={onLanguageToggle} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition text-sm font-bold ${darkMode ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              style={{ color: menuConfig.textColor }}
            >
              <Globe className="w-5 h-5 text-blue-600" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            <button onClick={onThemeToggle} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: menuConfig.textColor }}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {menuConfig.showSignIn && (
              <a 
                href={formatLink(menuConfig.signInLink)}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95`}
                style={{ 
                  backgroundColor: menuConfig.signInStyle === 'solid' ? menuConfig.signInBgColor : 'transparent',
                  color: menuConfig.signInTextColor,
                  border: menuConfig.signInStyle === 'outline' ? `2px solid ${menuConfig.signInBorderColor}` : 'none',
                  '--hover-bg': menuConfig.signInHoverBgColor
                } as any}
                onMouseEnter={(e) => {
                  if (menuConfig.signInStyle !== 'outline') {
                    e.currentTarget.style.backgroundColor = menuConfig.signInHoverBgColor;
                  } else {
                    e.currentTarget.style.backgroundColor = `${menuConfig.signInHoverBgColor}20`;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = menuConfig.signInStyle === 'solid' ? menuConfig.signInBgColor : 'transparent';
                }}
              >
                {menuConfig.signInText}
              </a>
            )}
          </div>
        </div>
      </nav>

      <main>
        {page.blocks.map(block => (
          <div key={block.id} style={{ width: block.width ? `${block.width}%` : '100%', margin: '0 auto' }}>
            <BlockRenderer 
              block={block} 
              darkMode={darkMode} 
              language={language}
              onNewsletterSubmit={onNewsletterSubmit} 
              onContactSubmit={onContactSubmit}
            />
          </div>
        ))}
      </main>
    </div>
  );
};

const BlockRenderer: React.FC<{ 
  block: CmsBlock, 
  darkMode: boolean, 
  language: string,
  onNewsletterSubmit?: (email: string) => Promise<void>,
  onContactSubmit?: (formId: string, formTitle: string, data: any) => Promise<void> 
}> = ({ block, darkMode, language, onNewsletterSubmit, onContactSubmit }) => {
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isAr = language === 'ar';

  const formatLink = (link?: string) => {
    if (!link) return '#';
    if (link.startsWith('http')) return link;
    if (link.startsWith('#')) return link;
    return '#' + (link.startsWith('/') ? link : '/' + link);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    
    try {
      if (onNewsletterSubmit) {
        await onNewsletterSubmit(email);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setIsSubmitting(false);
      setIsSuccess(true);
      setEmail('');
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Newsletter submission failed", error);
      setIsSubmitting(false);
      alert("Submission failed. Please try again.");
    }
  };

  useEffect(() => {
    if (isSuccess) {
      const b = block as FormBlock;
      if (b.type === 'contactForm' && b.redirectUrl) {
        const timer = setTimeout(() => {
          window.location.href = b.redirectUrl!;
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isSuccess, block]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (onContactSubmit) {
        await onContactSubmit(block.id, (block as FormBlock).title, formData);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({});
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Contact form submission failed", error);
      setIsSubmitting(false);
      alert("Submission failed. Please try again.");
    }
  };

  switch (block.type) {
    case 'hero': {
      const b = block as HeroBlock;
      const isSplit = b.template === 'split';
      const isImageBg = b.template === 'imageBg';
      const isGradient = b.template === 'gradient';
      
      const getFontFamily = (font?: string) => {
        switch(font) {
          case 'Outfit': return '"Outfit", sans-serif';
          case 'Space Grotesk': return '"Space Grotesk", sans-serif';
          case 'Playfair Display': return '"Playfair Display", serif';
          case 'JetBrains Mono': return '"JetBrains Mono", monospace';
          default: return '"Inter", sans-serif';
        }
      };

      const content = (
        <div className={`max-w-7xl mx-auto relative z-10 ${isSplit ? 'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left' : 'text-center'}`}>
          <div className={isSplit ? 'order-2 lg:order-1' : ''}>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] flex flex-wrap gap-x-4 justify-center lg:justify-start"
              style={{ 
                fontFamily: getFontFamily(b.titleFont),
                color: b.titleColor || (darkMode ? '#ffffff' : '#111827'),
                justifyContent: isSplit ? 'flex-start' : 'center'
              }}
            >
              <span>{isAr && b.titleAr ? b.titleAr : b.title}</span>
              {b.showSecondTitle && (b.secondTitle || b.secondTitleAr) && (
                <span style={{ 
                  fontFamily: getFontFamily(b.secondTitleFont),
                  color: b.secondTitleColor || '#3b82f6'
                }}>
                  {isAr && b.secondTitleAr ? b.secondTitleAr : b.secondTitle}
                </span>
              )}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl max-w-3xl mb-10 leading-relaxed"
              style={{ 
                color: b.subtitleColor || (darkMode ? '#9ca3af' : '#6b7280'),
                marginLeft: isSplit ? '0' : 'auto',
                marginRight: isSplit ? '0' : 'auto'
              }}
            >
              {isAr && b.subtitleAr ? b.subtitleAr : b.subtitle}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`flex flex-wrap gap-4 ${isSplit ? 'justify-start' : 'justify-center'}`}
            >
              <a 
                href={formatLink(b.buttonLink)}
                className="inline-flex px-8 py-4 rounded-2xl font-bold text-lg transition shadow-xl items-center justify-center gap-2 hover:scale-105 active:scale-95"
                style={{ 
                  backgroundColor: b.buttonBgColor || '#2563eb',
                  color: b.buttonTextColor || '#ffffff',
                  boxShadow: `0 20px 25px -5px ${b.buttonBgColor || '#2563eb'}40`
                }}
              >
                {isAr && b.buttonTextAr ? b.buttonTextAr : b.buttonText}
                <ArrowRight className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
              </a>
              {b.showSecondButton && (b.secondButtonText || b.secondButtonTextAr) && (
                <a 
                  href={formatLink(b.secondButtonLink)}
                  className="inline-flex px-8 py-4 rounded-2xl font-bold text-lg transition shadow-xl items-center justify-center gap-2 hover:scale-105 active:scale-95"
                  style={{ 
                    backgroundColor: b.secondButtonBgColor || (darkMode ? '#1f2937' : '#f3f4f6'),
                    color: b.secondButtonTextColor || (darkMode ? '#ffffff' : '#111827'),
                    boxShadow: darkMode ? 'none' : '0 10px 15px -3px rgba(0,0,0,0.1)'
                  }}
                >
                  {isAr && b.secondButtonTextAr ? b.secondButtonTextAr : b.secondButtonText}
                </a>
              )}
            </motion.div>
          </div>
          {isSplit && b.backgroundImage && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="order-1 lg:order-2 h-full flex items-center"
            >
              <div className="relative w-full">
                <div className="absolute -inset-4 bg-blue-500/10 rounded-[3rem] blur-2xl" />
                <img 
                  src={b.backgroundImage} 
                  alt="Hero" 
                  className="relative w-full h-full min-h-[300px] lg:min-h-[500px] rounded-[2.5rem] shadow-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          )}
        </div>
      );

      return (
        <section 
          className={`relative pt-32 pb-20 px-4 overflow-hidden ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}
          style={{
            backgroundImage: isGradient ? `linear-gradient(135deg, ${darkMode ? '#030712' : '#f9fafb'} 0%, ${darkMode ? '#111827' : '#eff6ff'} 100%)` : 'none',
            minHeight: isSplit ? '80vh' : 'auto',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {isImageBg && b.backgroundImage && (
            <>
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${b.backgroundImage})` }}
              />
              <div 
                className="absolute inset-0 z-1"
                style={{ backgroundColor: b.overlayColor || 'rgba(0,0,0,0.5)' }}
              />
            </>
          )}
          {content}
        </section>
      );
    }
    case 'richText': {
      const b = block as RichTextBlock;
      return (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: isAr && b.contentAr ? b.contentAr : b.content }} />
        </section>
      );
    }
    case 'cards': {
      const b = block as CardsBlock;
      const isList = b.layout === 'list';
      const gridCols = b.columns === 1 ? 'grid-cols-1' : b.columns === 2 ? 'md:grid-cols-2' : b.columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';
      
      return (
        <section className={`py-24 px-4 ${darkMode ? 'bg-gray-900/50' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto">
            {(b.heading || b.headingAr) && <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">{isAr && b.headingAr ? b.headingAr : b.heading}</h2>}
            <div className={`grid gap-8 ${isList ? 'grid-cols-1 max-w-4xl mx-auto' : `grid-cols-1 ${gridCols}`}`}>
              {b.cards.map((card, i) => {
                const IconMap: any = { Zap, ShieldCheck, Download, Cpu, Users, Upload, FileText, Globe, Moon, Sun, Mail, MessageSquare, Heart, Star, Bell, Camera, Coffee, Music, Video, MapPin, Search, Settings, Trash2, Edit, Save, Plus, X, ArrowRight, Home, Layout, Type, CreditCard, FormInput, PanelBottom, ArrowLeft, Copy, ExternalLink, Eye, GripVertical, ChevronDown, ChevronUp, Key, Code, RefreshCw, Link: LinkIcon };
                const IconComponent = IconMap[card.icon] || Zap;
                return (
                  <motion.div 
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-gray-50 border-gray-100'} shadow-sm hover:shadow-xl transition-shadow`}
                  >
                    {isList ? (
                      <div className="flex items-start gap-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-blue-600">
                          <IconComponent className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold mb-2">{isAr && card.titleAr ? card.titleAr : card.title}</h3>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">{isAr && card.descriptionAr ? card.descriptionAr : card.description}</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-50 dark:bg-blue-900/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                          <IconComponent className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{isAr && card.titleAr ? card.titleAr : card.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{isAr && card.descriptionAr ? card.descriptionAr : card.description}</p>
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      );
    }
    case 'contactForm': {
      const b = block as FormBlock;
      const widthClass = b.formWidth === 'narrow' ? 'max-w-md' : b.formWidth === 'wide' ? 'max-w-5xl' : b.formWidth === 'full' ? 'max-w-full' : 'max-w-3xl';
      const paddingClass = b.sectionPadding === 'small' ? 'py-12' : b.sectionPadding === 'large' ? 'py-32' : 'py-24';
      
      return (
        <section className={`${paddingClass} px-4 transition-colors`} style={{ backgroundColor: b.backgroundColor }}>
          <div className={`${widthClass} mx-auto`}>
            {(b.title || b.titleAr) && (
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">{isAr && b.titleAr ? b.titleAr : b.title}</h2>
                <p className="text-gray-500 dark:text-gray-400">{isAr && b.subtitleAr ? b.subtitleAr : b.subtitle}</p>
              </div>
            )}
            
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-12 rounded-3xl border text-center ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-xl`}
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{isAr ? 'تم الإرسال!' : 'Success!'}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg">
                  {isAr && b.successMessageAr ? b.successMessageAr : (b.successMessage || (isAr ? 'شكراً لك! تم إرسال رسالتك بنجاح.' : 'Thank you! Your message has been sent.'))}
                </p>
                {b.redirectUrl && (
                  <p className="mt-6 text-sm text-blue-600">
                    {isAr ? 'سيتم تحويلك قريباً...' : 'Redirecting you shortly...'}
                  </p>
                )}
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-xl space-y-6`}>
                {b.fields && b.fields.length > 0 && (
                  <div className="space-y-6">
                    {b.fields.map(field => (
                      <div key={field.id}>
                        {(b.showLabels !== false) && (
                          <label className="block text-sm font-medium mb-2">
                            {isAr && field.labelAr ? field.labelAr : field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                        )}
                        {field.type === 'textarea' ? (
                          <textarea 
                            required={field.required} 
                            rows={4} 
                            placeholder={!(b.showLabels !== false) ? (isAr && field.labelAr ? field.labelAr : field.label) : ''}
                            value={formData[field.id] || ''}
                            onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                            className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}
                          ></textarea>
                        ) : (
                          <input 
                            type={field.type} 
                            required={field.required} 
                            placeholder={!(b.showLabels !== false) ? (isAr && field.labelAr ? field.labelAr : field.label) : ''}
                            value={formData[field.id] || ''}
                            onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                            className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`} 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full font-bold transition shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] ${
                    b.buttonSize === 'small' ? 'py-2 text-sm rounded-lg' : 
                    b.buttonSize === 'large' ? 'py-5 text-xl rounded-2xl' : 
                    'py-4 text-lg rounded-xl'
                  }`}
                  style={{ 
                    backgroundColor: b.buttonStyle === 'outline' ? 'transparent' : b.submitBgColor, 
                    color: b.buttonStyle === 'outline' ? b.submitBgColor : b.submitTextColor,
                    border: b.buttonStyle === 'outline' ? `2px solid ${b.submitBgColor}` : 'none',
                    opacity: isSubmitting ? 0.7 : 1 
                  }}
                >
                  {isSubmitting ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr && b.submitTextAr ? b.submitTextAr : b.submitText)}
                </button>
              </form>
            )}
          </div>
        </section>
      );
    }
    case 'newsletter': {
      const b = block as NewsletterBlock;
      return (
        <section className="py-24 px-4" style={{ backgroundColor: b.backgroundColor, color: b.textColor }}>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">{isAr && b.titleAr ? b.titleAr : b.title}</h2>
            <p className="text-lg md:text-xl opacity-80 mb-10 max-w-2xl mx-auto leading-relaxed">{isAr && b.subtitleAr ? b.subtitleAr : b.subtitle}</p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={isAr && b.placeholderTextAr ? b.placeholderTextAr : b.placeholderText} 
                className={`flex-1 px-6 py-4 rounded-2xl border-2 outline-none focus:border-blue-500 transition text-gray-900 ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-transparent shadow-sm'}`} 
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition shadow-xl shadow-blue-500/20 whitespace-nowrap"
                style={{ opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? (isAr ? 'جاري الاشتراك...' : 'Subscribing...') : isSuccess ? (isAr ? 'تم الاشتراك!' : 'Subscribed!') : (isAr && b.buttonTextAr ? b.buttonTextAr : b.buttonText)}
              </button>
            </form>
          </div>
        </section>
      );
    }
    case 'footer': {
      const b = block as FooterBlock;
      const isColumns = b.template === 'columns';
      const isCentered = b.template === 'centered';
      
      return (
        <footer className={`py-16 border-t ${darkMode ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className="max-w-7xl mx-auto px-4">
            {isColumns ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-2 lg:col-span-1">
                  <h3 className="text-xl font-bold mb-4">{isAr && b.companyNameAr ? b.companyNameAr : b.companyName}</h3>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    {isAr && b.descriptionAr ? b.descriptionAr : b.description}
                  </p>
                </div>
                {b.columns && b.columns.map(col => (
                  <div key={col.id}>
                    <h4 className="font-bold mb-6 uppercase text-sm tracking-widest text-gray-400">
                      {isAr && col.titleAr ? col.titleAr : col.title}
                    </h4>
                    <ul className="space-y-4">
                      {col.links.map(link => (
                        <li key={link.id}>
                          <a 
                            href={formatLink(link.url)} 
                            className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {isAr && link.labelAr ? link.labelAr : link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`mb-12 ${isCentered ? 'text-center' : 'text-left'}`}>
                <h3 className="text-2xl font-bold mb-4">{isAr && b.companyNameAr ? b.companyNameAr : b.companyName}</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  {isAr && b.descriptionAr ? b.descriptionAr : b.description}
                </p>
              </div>
            )}
            
            <div className={`pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 ${isCentered ? 'text-center' : ''}`}>
              <p className="text-sm text-gray-400">
                {isAr && b.copyrightAr ? b.copyrightAr : b.copyright}
              </p>
              {!isCentered && (
                <div className="flex gap-6">
                  {/* Optional social links could go here if added to footer block */}
                </div>
              )}
            </div>
          </div>
        </footer>
      );
    }
    default: return null;
  }
};

export default PublicPage;
