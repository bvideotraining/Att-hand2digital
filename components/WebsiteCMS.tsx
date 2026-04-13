import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CmsPage, CmsMenuConfig, CmsBlock, HeroBlock, RichTextBlock, CardsBlock, FormBlock, NewsletterBlock, FooterBlock, SiteSettings, BlockType, SocialLink } from '../types';
import { Settings, Image as ImageIcon, Plus, Layout, Type, CreditCard, FormInput, PanelBottom, ArrowLeft, Trash2, Copy, ExternalLink, Eye, Save, GripVertical, ChevronDown, ChevronUp, Globe, Key, Code, Mail, ArrowRight, Home, Zap, ShieldCheck, Cpu, Users, UserPlus, FileText, X, Link as LinkIcon, RefreshCw, Heart, Star, Bell, Camera, Coffee, Music, Video, MapPin, Search, MessageSquare, Edit, Download, Upload, Moon, Sun } from 'lucide-react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import MediaLibrary from './MediaLibrary';
import PublicPage from './PublicPage';
import TemplateSelector, { PAGE_TEMPLATES } from './TemplateSelector';
import { TRANSLATIONS } from '../constants';
import { uploadToFirebaseStorage } from '../services/storageService';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface WebsiteCMSProps {
  pages: CmsPage[];
  menuConfig: CmsMenuConfig;
  appMenuConfig?: import('../types').AppMenuConfig;
  siteSettings: SiteSettings;
  mediaImages?: {id: string, url: string, name: string}[];
  onSavePages: (pages: CmsPage[]) => void;
  onSaveMenu: (menu: CmsMenuConfig) => void;
  onSaveAppMenu?: (menu: import('../types').AppMenuConfig) => void;
  onSaveSettings: (settings: SiteSettings) => void;
  onChangeMenu?: (menu: CmsMenuConfig) => void;
  onChangeAppMenu?: (appMenu: import('../types').AppMenuConfig) => void;
  onChangeSettings?: (settings: SiteSettings) => void;
  onSaveMediaImage?: (image: {id: string, url: string, name: string}) => void;
  onDeleteMediaImage?: (id: string) => void;
  onForceSave?: () => void;
  onSyncBrandingToPublic?: () => void;
  onSaveNewsletterSettings?: (settings: import('../types').NewsletterSettings) => void;
  onDeleteNewsletterResponse?: (id: string) => void;
  onDeleteContactResponse?: (id: string) => void;
  newsletterSettings?: import('../types').NewsletterSettings;
  newsletterResponses?: import('../types').NewsletterResponse[];
  contactResponses?: import('../types').ContactResponse[];
  onNewsletterSubmit?: (email: string) => Promise<void>;
  onContactSubmit?: (formId: string, formTitle: string, data: any) => Promise<void>;
  isSyncing?: boolean;
  language: string;
  darkMode: boolean;
  storageMode?: 'local' | 'firebase';
  currentUser?: import('../types').User | null;
}

const LinkPicker = ({ value, onChange, pages, darkMode, t }: { value: string, onChange: (val: string) => void, pages: CmsPage[], darkMode: boolean, t: any }) => {
  const [mode, setMode] = useState<'custom' | 'pages'>(pages.some(p => p.slug === value) ? 'pages' : 'custom');

  return (
    <div className="space-y-2">
      <div className="flex gap-2 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 w-fit">
        <button 
          onClick={() => setMode('custom')}
          className={`px-3 py-1 rounded-md text-xs font-bold transition ${mode === 'custom' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t.custom || 'Custom'}
        </button>
        <button 
          onClick={() => setMode('pages')}
          className={`px-3 py-1 rounded-md text-xs font-bold transition ${mode === 'pages' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t.pages || 'Pages'}
        </button>
      </div>
      {mode === 'custom' ? (
        <input 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder="https://... or /path"
          className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
        />
      ) : (
        <select 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
        >
          <option value="">Select a page...</option>
          {pages.map(p => (
            <option key={p.id} value={p.slug}>{p.title} ({p.slug})</option>
          ))}
        </select>
      )}
    </div>
  );
};

const ResponsesView = ({ newsletterResponses, contactResponses, onDeleteNewsletter, onDeleteContact, darkMode, language }: { 
  newsletterResponses: import('../types').NewsletterResponse[], 
  contactResponses: import('../types').ContactResponse[], 
  onDeleteNewsletter: (id: string) => void,
  onDeleteContact: (id: string) => void,
  darkMode: boolean,
  language: string
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'newsletter' | 'contact'>('newsletter');
  const isAr = language === 'ar';

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">{isAr ? 'ردود المستخدمين' : 'User Responses'}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{isAr ? 'إدارة ردود النشرة الإخبارية ونماذج الاتصال' : 'Manage newsletter and contact form submissions'}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveSubTab('newsletter')}
          className={`px-6 py-2 rounded-xl font-bold transition ${activeSubTab === 'newsletter' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {isAr ? 'النشرة الإخبارية' : 'Newsletter'} ({newsletterResponses.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('contact')}
          className={`px-6 py-2 rounded-xl font-bold transition ${activeSubTab === 'contact' ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {isAr ? 'نماذج الاتصال' : 'Contact Forms'} ({contactResponses.length})
        </button>
      </div>

      {activeSubTab === 'newsletter' ? (
        <div className="space-y-4">
          {newsletterResponses.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{isAr ? 'لا توجد ردود حتى الآن' : 'No responses yet'}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {newsletterResponses.map(res => (
                <div key={res.id} className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm flex justify-between items-center`}>
                  <div>
                    <div className="font-bold text-lg">{res.email}</div>
                    <div className="text-sm text-gray-500 flex gap-4 mt-1">
                      <span>{new Date(res.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
                      <span>{res.sourcePage}</span>
                    </div>
                  </div>
                  <button onClick={() => onDeleteNewsletter(res.id)} className="p-2 text-gray-400 hover:text-red-600 transition">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {contactResponses.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{isAr ? 'لا توجد ردود حتى الآن' : 'No responses yet'}</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {contactResponses.map(res => (
                <div key={res.id} className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-bold text-xl">{res.formTitle}</h4>
                      <div className="text-sm text-gray-500 flex gap-4 mt-1">
                        <span>{new Date(res.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</span>
                        <span>{res.sourcePage}</span>
                      </div>
                    </div>
                    <button onClick={() => onDeleteContact(res.id)} className="p-2 text-gray-400 hover:text-red-600 transition">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(res.data).map(([key, val]) => (
                      <div key={key} className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                        <div className="text-xs font-bold text-gray-400 uppercase mb-1">{key}</div>
                        <div className="text-gray-700 dark:text-gray-200">{String(val)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const WebsiteCMS: React.FC<WebsiteCMSProps> = ({ 
  pages, 
  menuConfig, 
  appMenuConfig, 
  siteSettings, 
  mediaImages: propsMediaImages, 
  onSavePages, 
  onSaveMenu, 
  onSaveAppMenu, 
  onSaveSettings, 
  onChangeMenu, 
  onChangeAppMenu, 
  onChangeSettings, 
  onSaveMediaImage, 
  onDeleteMediaImage, 
  onForceSave, 
  onSyncBrandingToPublic, 
  onSaveNewsletterSettings, 
  onDeleteNewsletterResponse, 
  onDeleteContactResponse, 
  onNewsletterSubmit, 
  onContactSubmit, 
  newsletterSettings, 
  newsletterResponses, 
  contactResponses, 
  isSyncing, 
  language, 
  darkMode, 
  storageMode, 
  currentUser 
}) => {
  const t = useMemo(() => {
    const safeLang = (language === 'ar' || language === 'en') ? language : 'ar';
    return (TRANSLATIONS[safeLang] || TRANSLATIONS.ar).cms;
  }, [language]);

  useEffect(() => {
    if (currentUser?.id && storageMode === 'firebase') {
      const isSharedAdmin = currentUser?.email?.toLowerCase() === 'bvideotraining@gmail.com' || currentUser?.email?.toLowerCase() === 'hr.totscollege@gmail.com';
      if (isSharedAdmin) {
        getDoc(doc(db, 'public', 'config')).then(snap => {
          if (!snap.exists() || !snap.data()?.ownerId) {
            setDoc(doc(db, 'public', 'config'), { ownerId: currentUser.id }, { merge: true }).catch(console.error);
          }
        }).catch(console.error);
      }
    }
  }, [currentUser, storageMode]);

  const [activeTab, setActiveTab] = useState<'pages' | 'menu' | 'appMenu' | 'settings' | 'newsletter' | 'responses'>('pages');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] = useState(false);
  const [mediaLibraryCallback, setMediaLibraryCallback] = useState<((url: string) => void) | null>(null);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [backlinksPage, setBacklinksPage] = useState<CmsPage | null>(null);

  // Local states for global save
  const [localMenu, setLocalMenu] = useState<CmsMenuConfig>(menuConfig);
  const [localAppMenu, setLocalAppMenu] = useState<import('../types').AppMenuConfig | undefined>(appMenuConfig);
  const [localSettings, setLocalSettings] = useState<SiteSettings>(siteSettings);
  const [localNewsletterSettings, setLocalNewsletterSettings] = useState<import('../types').NewsletterSettings>(newsletterSettings || {
    enabled: true,
    collectResponses: true,
    autoResponderEnabled: false
  });

  // Sync local state with props when they change (e.g. after a remote update)
  React.useEffect(() => {
    setLocalMenu(menuConfig);
  }, [menuConfig]);

  React.useEffect(() => {
    setLocalAppMenu(appMenuConfig);
  }, [appMenuConfig]);

  React.useEffect(() => {
    setLocalSettings(siteSettings);
  }, [siteSettings]);

  React.useEffect(() => {
    if (newsletterSettings) setLocalNewsletterSettings(newsletterSettings);
  }, [newsletterSettings]);

  const handleMenuChange = (menu: CmsMenuConfig) => {
    setLocalMenu(menu);
    if (onChangeMenu) onChangeMenu(menu);
  };

  const handleAppMenuChange = (appMenu: import('../types').AppMenuConfig) => {
    setLocalAppMenu(appMenu);
    if (onChangeAppMenu) onChangeAppMenu(appMenu);
  };

  const handleSettingsChange = (settings: SiteSettings) => {
    setLocalSettings(settings);
    if (onChangeSettings) onChangeSettings(settings);
  };

  const handleGlobalSave = () => {
    onSaveMenu(localMenu);
    if (onSaveAppMenu && localAppMenu) onSaveAppMenu(localAppMenu);
    onSaveSettings(localSettings);
    onSavePages(pages);
    if (onSaveNewsletterSettings) onSaveNewsletterSettings(localNewsletterSettings);
    if (onForceSave) onForceSave();
  };

  const [mediaImages, setMediaImages] = useState<{id: string, url: string, name: string}[]>([
    { id: '1', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000', name: 'Office Space' },
    { id: '2', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000', name: 'Team Collaboration' },
    { id: '3', url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80&w=1000', name: 'Tech Setup' },
  ]);

  const currentMediaImages = propsMediaImages && propsMediaImages.length > 0 ? propsMediaImages : mediaImages;

  const handleMediaImageAdd = (images: {id: string, url: string, name: string}[]) => {
    if (onSaveMediaImage) {
      // Find the new image (assuming it's the first one added)
      const newImage = images[0];
      if (newImage && !currentMediaImages.find(img => img.id === newImage.id)) {
        onSaveMediaImage(newImage);
      }
    } else {
      setMediaImages(images);
    }
  };

  const handleMediaImageDelete = (id: string) => {
    if (onDeleteMediaImage) {
      onDeleteMediaImage(id);
    } else {
      setMediaImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const handleDirectUpload = async (file: File, callback: (url: string) => void) => {
    try {
      let url = '';
      const id = Math.random().toString(36).substr(2, 9);
      
      if (storageMode === 'firebase' && currentUser) {
        url = await uploadToFirebaseStorage(file, `users/${currentUser.id}/media/${id}_${file.name}`);
      } else {
        url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const newImage = { id, url, name: file.name };
      if (onSaveMediaImage) {
        onSaveMediaImage(newImage);
      } else {
        setMediaImages(prev => [newImage, ...prev]);
      }
      callback(newImage.url);
    } catch (error) {
      console.error("Direct upload failed", error);
      alert("Upload failed. Please try again.");
    }
  };

  const openMediaLibrary = (callback: (url: string) => void) => {
    setMediaLibraryCallback(() => callback);
    setIsMediaLibraryOpen(true);
  };

  const editingPage = pages.find(p => p.id === editingPageId);

  const handleAddPage = () => {
    setIsTemplateSelectorOpen(true);
  };

  const handleSelectTemplate = (templateId: string | 'blank') => {
    let newBlocks: CmsBlock[] = [];
    let title = 'New Page';
    let slug = '/new-page';

    if (templateId !== 'blank') {
      const template = PAGE_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        // Deep copy blocks to avoid reference issues
        newBlocks = JSON.parse(JSON.stringify(template.blocks)).map((b: any) => ({
          ...b,
          id: Math.random().toString(36).substr(2, 9) // Give blocks unique IDs
        }));
        title = template.title;
        slug = `/${template.id}`;
        
        // Ensure unique slug
        let counter = 1;
        let baseSlug = slug;
        while (pages.some(p => p.slug === slug)) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
      }
    }

    const newPage: CmsPage = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      slug,
      status: 'draft',
      inMenu: false,
      blocks: newBlocks
    };
    onSavePages([...pages, newPage]);
    setEditingPageId(newPage.id);
    setIsTemplateSelectorOpen(false);
  };

  const handleDeletePage = (id: string) => {
    setPageToDelete(id);
  };

  const confirmDeletePage = () => {
    if (pageToDelete) {
      onSavePages(pages.filter(p => p.id !== pageToDelete));
      setPageToDelete(null);
    }
  };

  const getBacklinks = (targetSlug: string) => {
    const backlinks: { pageTitle: string; pageSlug: string; blockType: string }[] = [];
    
    pages.forEach(page => {
      page.blocks.forEach(block => {
        let found = false;
        let blockType = block.type;

        if (block.type === 'hero' && block.buttonLink === targetSlug) found = true;
        if (block.type === 'cards') {
          if (block.cards.some((c: any) => c.link === targetSlug)) found = true;
        }
        if (block.type === 'footer') {
          block.columns.forEach(col => {
            if (col.links.some(l => l.url === targetSlug)) found = true;
          });
        }
        if (block.type === 'richText' && block.content.includes(`href="${targetSlug}"`)) found = true;

        if (found) {
          backlinks.push({
            pageTitle: page.title,
            pageSlug: page.slug,
            blockType: blockType.charAt(0).toUpperCase() + blockType.slice(1)
          });
        }
      });
    });

    return backlinks;
  };

  const handleUpdatePage = (updatedPage: CmsPage) => {
    onSavePages(pages.map(p => p.id === updatedPage.id ? updatedPage : p));
  };

  if (editingPageId && editingPage) {
    return (
      <>
        <PageEditor 
          page={editingPage} 
          pages={pages} 
          menuConfig={menuConfig} 
          siteSettings={siteSettings} 
          onSave={handleUpdatePage} 
          onBack={() => setEditingPageId(null)} 
          openMediaLibrary={openMediaLibrary} 
          handleDirectUpload={handleDirectUpload} 
          darkMode={darkMode} 
          t={t} 
          language={language}
          onNewsletterSubmit={onNewsletterSubmit}
          onContactSubmit={onContactSubmit}
        />
        <MediaLibrary 
          isOpen={isMediaLibraryOpen} 
          onClose={() => {
            setIsMediaLibraryOpen(false);
            setMediaLibraryCallback(null);
          }} 
          onSelect={(url) => {
            if (mediaLibraryCallback) mediaLibraryCallback(url);
            setIsMediaLibraryOpen(false);
            setMediaLibraryCallback(null);
          }}
          darkMode={darkMode} 
          images={currentMediaImages}
          setImages={handleMediaImageAdd}
          onDeleteImage={handleMediaImageDelete}
          storageMode={storageMode}
          currentUser={currentUser}
        />
      </>
    );
  }

  return (
    <div className={`animate-in fade-in duration-500 ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Menu */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className={`sticky top-24 p-4 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm space-y-2`}>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => {
                  handleGlobalSave();
                  const btn = document.getElementById('cms-save-btn-sidebar');
                  if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Saved!`;
                    btn.classList.add('text-green-600');
                    setTimeout(() => {
                      btn.innerHTML = originalText;
                      btn.classList.remove('text-green-600');
                    }, 2000);
                  }
                }}
                id="cms-save-btn-sidebar"
                className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-700 dark:text-gray-300"
              >
                <Save className="w-4 h-4" />
                {t.saveAllChanges}
              </button>
              
              <hr className="border-gray-100 dark:border-gray-800 my-1" />
              
              {onSyncBrandingToPublic && (
                <button 
                  onClick={onSyncBrandingToPublic}
                  disabled={isSyncing}
                  className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold rounded-xl transition ${isSyncing ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? t.syncing : t.syncToPublic}
                </button>
              )}

              <hr className="border-gray-100 dark:border-gray-800 my-1" />

              <button 
                onClick={() => setActiveTab('pages')}
                className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold rounded-xl transition ${activeTab === 'pages' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <FileText className="w-4 h-4" />
                {t.pages}
              </button>

              <hr className="border-gray-100 dark:border-gray-800 my-1" />

              <button 
                onClick={() => setActiveTab('menu')}
                className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold rounded-xl transition ${activeTab === 'menu' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Layout className="w-4 h-4" />
                {t.menuStyle}
              </button>

              <hr className="border-gray-100 dark:border-gray-800 my-1" />

              <button 
                onClick={() => setActiveTab('appMenu')}
                className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold rounded-xl transition ${activeTab === 'appMenu' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <PanelBottom className="w-4 h-4" />
                {t.appMenu}
              </button>

              <hr className="border-gray-100 dark:border-gray-800 my-1" />

              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold rounded-xl transition ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Settings className="w-4 h-4" />
                {t.settings}
              </button>

              <hr className="border-gray-100 dark:border-gray-800 my-1" />

              <button 
                onClick={() => setActiveTab('newsletter')}
                className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold rounded-xl transition ${activeTab === 'newsletter' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <Mail className="w-4 h-4" />
                {t.newsletter}
              </button>

              <hr className="border-gray-100 dark:border-gray-800 my-1" />

              <button 
                onClick={() => setActiveTab('responses')}
                className={`flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold rounded-xl transition ${activeTab === 'responses' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <MessageSquare className="w-4 h-4" />
                {language === 'ar' ? 'الردود' : 'Responses'}
              </button>

              <hr className="border-gray-100 dark:border-gray-800 my-1" />

              <button 
                onClick={() => setIsMediaLibraryOpen(true)}
                className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold rounded-xl text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition"
              >
                <ImageIcon className="w-4 h-4" />
                {t.mediaLibrary}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">{t.title}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t.subtitle}</p>
            </div>
            {activeTab === 'pages' && (
              <button 
                onClick={handleAddPage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t.newPage}
              </button>
            )}
          </div>

      {activeTab === 'pages' ? (
        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder={t.searchPages} 
              className={`w-full max-w-md ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
            />
            <div className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>

          <div className="space-y-3">
            <Reorder.Group axis="y" values={pages} onReorder={onSavePages} className="space-y-3">
              {pages.map(page => (
                <Reorder.Item key={page.id} value={page} className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} hover:shadow-md transition`}>
                  <div className="flex items-center gap-4">
                    <div className="text-gray-400 cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg">{page.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${page.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {page.status === 'published' ? t.published : t.draft}
                        </span>
                        {page.inMenu && (
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            {t.inMenu}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{page.slug} &bull; {page.blocks.length} {t.blocks}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title={t.hideShow}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title={t.duplicate}>
                      <Copy className="w-4 h-4" />
                    </button>
                    <a href={`#${page.slug}`} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title={t.viewLive}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => setBacklinksPage(page)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title={t.linkedPages}>
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingPageId(page.id)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title={t.edit}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button onClick={() => handleDeletePage(page.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400" title={t.delete}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            {pages.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {t.noPagesFound}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'menu' ? (
        <MenuEditor config={localMenu} onSave={onSaveMenu} onChange={handleMenuChange} pages={pages} onSavePages={onSavePages} openMediaLibrary={openMediaLibrary} darkMode={darkMode} t={t} language={language} />
      ) : activeTab === 'appMenu' && localAppMenu ? (
        <AppMenuEditor config={localAppMenu} onSave={onSaveAppMenu} onChange={handleAppMenuChange} pages={pages} openMediaLibrary={openMediaLibrary} darkMode={darkMode} t={t} />
      ) : activeTab === 'newsletter' ? (
        <NewsletterEditor 
          settings={localNewsletterSettings} 
          responses={newsletterResponses || []} 
          onSave={onSaveNewsletterSettings || (() => {})} 
          onDeleteResponse={onDeleteNewsletterResponse || (() => {})}
          darkMode={darkMode} 
          t={t} 
          language={language} 
        />
      ) : activeTab === 'responses' ? (
        <ResponsesView 
          newsletterResponses={newsletterResponses || []}
          contactResponses={contactResponses || []}
          onDeleteNewsletter={onDeleteNewsletterResponse || (() => {})}
          onDeleteContact={onDeleteContactResponse || (() => {})}
          darkMode={darkMode}
          language={language}
        />
      ) : (
        <SettingsEditor settings={localSettings} onSave={onSaveSettings} onChange={handleSettingsChange} darkMode={darkMode} t={t} language={language} />
      )}
      </main>
    </div>

    <MediaLibrary 
        isOpen={isMediaLibraryOpen} 
        onClose={() => {
          setIsMediaLibraryOpen(false);
          setMediaLibraryCallback(null);
        }} 
        onSelect={(url) => {
          if (mediaLibraryCallback) mediaLibraryCallback(url);
          setIsMediaLibraryOpen(false);
          setMediaLibraryCallback(null);
        }}
        darkMode={darkMode} 
        images={currentMediaImages}
        setImages={handleMediaImageAdd}
        onDeleteImage={handleMediaImageDelete}
        storageMode={storageMode}
        currentUser={currentUser}
      />

      <TemplateSelector 
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        onSelect={handleSelectTemplate}
        language={language}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {pageToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPageToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-8 relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t.deletePageTitle}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                {t.deletePageConfirm.replace('{title}', pages.find(p => p.id === pageToDelete)?.title || '')}
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPageToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={confirmDeletePage}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-lg shadow-red-500/20"
                >
                  {t.confirmDelete}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Backlinks Modal */}
      <AnimatePresence>
        {backlinksPage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBacklinksPage(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{t.backlinksTitle.replace('{title}', backlinksPage.title)}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.backlinksSubtitle.replace('{slug}', backlinksPage.slug)}</p>
                </div>
                <button onClick={() => setBacklinksPage(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {getBacklinks(backlinksPage.slug).length > 0 ? (
                  <div className="space-y-3">
                    {getBacklinks(backlinksPage.slug).map((link, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <div>
                          <div className="font-bold">{link.pageTitle}</div>
                          <div className="text-xs text-gray-500">{link.pageSlug}</div>
                        </div>
                        <div className="text-xs font-medium px-2 py-1 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {link.blockType} {t.blocks}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>{t.noBacklinks}</p>
                  </div>
                )}
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={() => setBacklinksPage(null)}
                  className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-lg shadow-blue-500/20"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Page Editor Subcomponent ---

const PageEditor = ({ 
  page, 
  pages, 
  menuConfig, 
  siteSettings, 
  onSave, 
  onBack, 
  openMediaLibrary, 
  handleDirectUpload, 
  darkMode, 
  t, 
  language,
  onNewsletterSubmit,
  onContactSubmit
}: { 
  page: CmsPage, 
  pages: CmsPage[], 
  menuConfig: CmsMenuConfig, 
  siteSettings: SiteSettings, 
  onSave: (p: CmsPage) => void, 
  onBack: () => void, 
  openMediaLibrary: (cb: (url: string) => void) => void, 
  handleDirectUpload: (file: File, cb: (url: string) => void) => void, 
  darkMode: boolean, 
  t: any, 
  language: string,
  onNewsletterSubmit?: (email: string) => Promise<void>,
  onContactSubmit?: (formId: string, formTitle: string, data: any) => Promise<void>
}) => {
  const [localPage, setLocalPage] = useState<CmsPage>(page);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const handleSave = () => {
    onSave(localPage);
    onBack();
  };

  const addBlock = (type: BlockType) => {
    const newBlockBase = { id: Math.random().toString(36).substr(2, 9), type };
    let newBlock: CmsBlock;
    
    switch(type) {
      case 'hero':
        newBlock = { ...newBlockBase, type: 'hero', template: 'centered', title: 'New Hero', subtitle: 'Subtitle here', buttonText: 'Click Me', buttonLink: '/' } as HeroBlock;
        break;
      case 'richText':
        newBlock = { ...newBlockBase, type: 'richText', content: '<p>Enter your text here...</p>' } as RichTextBlock;
        break;
      case 'cards':
        newBlock = { ...newBlockBase, type: 'cards', heading: 'Features', columns: 3, cards: [] } as CardsBlock;
        break;
      case 'contactForm':
        newBlock = { ...newBlockBase, type: 'contactForm', title: 'Contact Us', subtitle: 'Send a message', fields: [], formWidth: 'medium', sectionPadding: 'medium', backgroundColor: '#ffffff', submitText: 'Send', submitBgColor: '#2563eb', submitTextColor: '#ffffff', destination: 'firestore' } as FormBlock;
        break;
      case 'newsletter':
        newBlock = { ...newBlockBase, type: 'newsletter', title: 'Subscribe to our Newsletter', subtitle: 'Get the latest updates.', placeholderText: 'Enter your email', buttonText: 'Subscribe', backgroundColor: '#f3f4f6', textColor: '#111827' } as NewsletterBlock;
        break;
      case 'footer':
        newBlock = { ...newBlockBase, type: 'footer', template: 'simple', companyName: 'Company', copyright: '© 2026', description: '', columns: [] } as FooterBlock;
        break;
      default: return;
    }

    setLocalPage(p => ({ ...p, blocks: [...p.blocks, newBlock] }));
    setShowBlockMenu(false);
  };

  const updateBlock = (id: string, updates: Partial<CmsBlock>) => {
    setLocalPage(p => ({
      ...p,
      blocks: p.blocks.map(b => b.id === id ? { ...b, ...updates } as CmsBlock : b)
    }));
  };

  const removeBlock = (id: string) => {
    setLocalPage(p => ({ ...p, blocks: p.blocks.filter(b => b.id !== id) }));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === localPage.blocks.length - 1)) return;
    const newBlocks = [...localPage.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setLocalPage(p => ({ ...p, blocks: newBlocks }));
  };

  if (isPreviewMode) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-950 overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="sticky top-0 z-50 bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <span className="font-bold">{t.previewMode}</span>
            <span className="text-sm text-gray-400">{localPage.title}</span>
          </div>
          <button onClick={() => setIsPreviewMode(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition flex items-center gap-2">
            <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} /> {t.exitPreview}
          </button>
        </div>
        <PublicPage 
          page={localPage}
          pages={[localPage]} 
          menuConfig={menuConfig} 
          darkMode={darkMode} 
          language={language}
          onLanguageToggle={() => {}}
          onThemeToggle={() => {}} 
          onSignIn={() => {}} 
          onNewsletterSubmit={onNewsletterSubmit}
          onContactSubmit={onContactSubmit}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-in fade-in ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 sticky top-20 z-40">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <div>
            <input 
              type="text" 
              value={localPage.title}
              onChange={e => setLocalPage({...localPage, title: e.target.value})}
              className="text-2xl font-bold bg-transparent outline-none border-b border-transparent focus:border-blue-500 transition"
              placeholder="English Title"
            />
            <input 
              type="text" 
              value={localPage.titleAr || ''}
              onChange={e => setLocalPage({...localPage, titleAr: e.target.value})}
              className="text-2xl font-bold bg-transparent outline-none border-b border-transparent focus:border-blue-500 transition ml-4 text-right"
              placeholder="العنوان بالعربية"
              dir="rtl"
            />
            <div className="flex items-center gap-2 mt-1">
              {isEditingSlug ? (
                <input
                  type="text"
                  value={localPage.slug}
                  onChange={e => setLocalPage({...localPage, slug: e.target.value})}
                  onBlur={() => setIsEditingSlug(false)}
                  onKeyDown={e => e.key === 'Enter' && setIsEditingSlug(false)}
                  autoFocus
                  className={`text-sm px-2 py-0.5 rounded border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              ) : (
                <>
                  <span className="text-sm text-gray-500">{localPage.slug}</span>
                  <button onClick={() => setIsEditingSlug(true)} className="text-xs text-blue-600 hover:underline">{t.editUrl}</button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsPreviewMode(true)} className="px-4 py-2 rounded-xl font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center gap-2">
            <Eye className="w-4 h-4" /> {t.preview}
          </button>
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Save className="w-4 h-4" /> {t.save}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4 pb-32">
        <Reorder.Group axis="y" values={localPage.blocks} onReorder={(newBlocks) => setLocalPage(p => ({ ...p, blocks: newBlocks }))} className="space-y-4">
          {localPage.blocks.map((block, index) => (
            <Reorder.Item key={block.id} value={block}>
              <BlockEditor 
                block={block} 
                index={index} 
                pages={pages}
                onUpdate={(updates: any) => updateBlock(block.id, updates)} 
                onRemove={() => removeBlock(block.id)}
                onMove={(dir: any) => moveBlock(index, dir)}
                openMediaLibrary={openMediaLibrary}
                handleDirectUpload={handleDirectUpload}
                darkMode={darkMode}
                t={t}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>

        <div className="relative mt-8">
          {showBlockMenu ? (
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-2xl shadow-xl border overflow-hidden z-50 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
              <div className="p-2 grid grid-cols-1 gap-1">
                <button onClick={() => addBlock('hero')} className="flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-left transition">
                  <Layout className="w-5 h-5 text-blue-500" /> <span className="font-medium">{t.heroSection}</span>
                </button>
                <button onClick={() => addBlock('richText')} className="flex items-center gap-3 p-3 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl text-left transition">
                  <Type className="w-5 h-5 text-green-500" /> <span className="font-medium">{t.richText}</span>
                </button>
                <button onClick={() => addBlock('cards')} className="flex items-center gap-3 p-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl text-left transition">
                  <CreditCard className="w-5 h-5 text-purple-500" /> <span className="font-medium">{t.cardsSection}</span>
                </button>
                <button onClick={() => addBlock('contactForm')} className="flex items-center gap-3 p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl text-left transition">
                  <FormInput className="w-5 h-5 text-orange-500" /> <span className="font-medium">{t.contactForm}</span>
                </button>
                <button onClick={() => addBlock('newsletter')} className="flex items-center gap-3 p-3 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl text-left transition">
                  <Mail className="w-5 h-5 text-pink-500" /> <span className="font-medium">{t.newsletter}</span>
                </button>
                <button onClick={() => addBlock('footer')} className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-left transition">
                  <PanelBottom className="w-5 h-5 text-gray-500" /> <span className="font-medium">{t.footer}</span>
                </button>
              </div>
            </div>
          ) : null}
          
          <button 
            onClick={() => setShowBlockMenu(!showBlockMenu)}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-gray-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition flex items-center justify-center gap-2 font-bold"
          >
            <Plus className="w-5 h-5" /> {t.addBlock}
          </button>
        </div>
      </div>
    </div>
  );
};

const BlockEditor = ({ block, index, onUpdate, onRemove, onMove, pages, openMediaLibrary, handleDirectUpload, darkMode, t }: any) => {
  const [expanded, setExpanded] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getIcon = () => {
    switch(block.type) {
      case 'hero': return <Layout className="w-5 h-5 text-blue-500" />;
      case 'richText': return <Type className="w-5 h-5 text-green-500" />;
      case 'cards': return <CreditCard className="w-5 h-5 text-purple-500" />;
      case 'contactForm': return <FormInput className="w-5 h-5 text-orange-500" />;
      case 'newsletter': return <Mail className="w-5 h-5 text-pink-500" />;
      case 'footer': return <PanelBottom className="w-5 h-5 text-gray-500" />;
      default: return <Layout className="w-5 h-5" />;
    }
  };

  const getTitle = () => {
    switch(block.type) {
      case 'hero': return t.heroSection;
      case 'richText': return t.richText;
      case 'cards': return t.cardsSection;
      case 'contactForm': return t.contactForm;
      case 'newsletter': return t.newsletter;
      case 'footer': return t.footer;
      default: return 'Block';
    }
  };

  return (
    <div className={`rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} shadow-sm overflow-hidden transition-all`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <div className="text-gray-400 cursor-grab active:cursor-grabbing"><GripVertical className="w-4 h-4" /></div>
          <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
            {getIcon()}
          </div>
          <span className="font-bold">{getTitle()}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase">{t.width || 'Width'}</span>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 px-2 py-1">
              <input 
                type="range" 
                min="20" 
                max="100" 
                step="5" 
                value={block.width || 100} 
                onChange={e => onUpdate({ width: parseInt(e.target.value) })}
                className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-[10px] font-bold w-8 text-center">{block.width || 100}%</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onMove('up')} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><ChevronUp className="w-4 h-4" /></button>
            <button onClick={() => onMove('down')} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"><ChevronDown className="w-4 h-4" /></button>
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button onClick={onRemove} className="p-1.5 text-red-400 hover:text-red-600 ml-2"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="p-6">
          {block.type === 'hero' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t.template}</label>
                <div className="grid grid-cols-4 gap-2">
                  {['centered', 'split', 'gradient', 'imageBg'].map(temp => (
                    <button 
                      key={temp}
                      onClick={() => onUpdate({ template: temp })}
                      className={`p-3 rounded-xl border text-sm font-medium transition ${block.template === temp ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      {t[temp] || temp.charAt(0).toUpperCase() + temp.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title 1 */}
              <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">{t.titleLabel} 1</h4>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">English Title</label>
                  <input type="text" value={block.title} onChange={e => onUpdate({ title: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">العنوان بالعربية (Arabic Title)</label>
                  <input type="text" value={block.titleAr || ''} onChange={e => onUpdate({ titleAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.titleColor}</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={block.titleColor || (darkMode ? '#ffffff' : '#111827')} onChange={e => onUpdate({ titleColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                      <input type="text" value={block.titleColor || (darkMode ? '#ffffff' : '#111827')} onChange={e => onUpdate({ titleColor: e.target.value })} className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.titleFont}</label>
                    <select value={block.titleFont || 'Inter'} onChange={e => onUpdate({ titleFont: e.target.value })} className={`w-full px-3 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                      <option value="Inter">Inter</option>
                      <option value="Outfit">Outfit</option>
                      <option value="Space Grotesk">Space Grotesk</option>
                      <option value="Playfair Display">Playfair Display</option>
                      <option value="JetBrains Mono">JetBrains Mono</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Title 2 Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="font-bold text-sm">{t.showSecondTitle}</span>
                <button 
                  onClick={() => onUpdate({ showSecondTitle: !block.showSecondTitle })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${block.showSecondTitle ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${block.showSecondTitle ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Title 2 */}
              {block.showSecondTitle && (
                <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4 animate-in slide-in-from-top-2">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">{t.secondTitle}</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">English Second Title</label>
                    <input type="text" value={block.secondTitle || ''} onChange={e => onUpdate({ secondTitle: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">العنوان الثاني بالعربية (Arabic Second Title)</label>
                    <input type="text" value={block.secondTitleAr || ''} onChange={e => onUpdate({ secondTitleAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.secondTitleColor}</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={block.secondTitleColor || '#3b82f6'} onChange={e => onUpdate({ secondTitleColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                        <input type="text" value={block.secondTitleColor || '#3b82f6'} onChange={e => onUpdate({ secondTitleColor: e.target.value })} className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.secondTitleFont}</label>
                      <select value={block.secondTitleFont || 'Inter'} onChange={e => onUpdate({ secondTitleFont: e.target.value })} className={`w-full px-3 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                        <option value="Inter">Inter</option>
                        <option value="Outfit">Outfit</option>
                        <option value="Space Grotesk">Space Grotesk</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="JetBrains Mono">JetBrains Mono</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtitle */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium">{t.subtitleLabel}</label>
                  <input type="color" value={block.subtitleColor || (darkMode ? '#9ca3af' : '#6b7280')} onChange={e => onUpdate({ subtitleColor: e.target.value })} className="w-6 h-6 rounded-md cursor-pointer border-none bg-transparent" />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">English Subtitle</label>
                    <textarea value={block.subtitle} onChange={e => onUpdate({ subtitle: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} rows={2} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">الوصف بالعربية (Arabic Subtitle)</label>
                    <textarea value={block.subtitleAr || ''} onChange={e => onUpdate({ subtitleAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} rows={2} dir="rtl" />
                  </div>
                </div>
              </div>

              {/* Button 1 */}
              <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">{t.buttonText} 1</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">English Button Text</label>
                      <input type="text" value={block.buttonText} onChange={e => onUpdate({ buttonText: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">نص الزر بالعربية (Arabic Button Text)</label>
                      <input type="text" value={block.buttonTextAr || ''} onChange={e => onUpdate({ buttonTextAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.buttonLink}</label>
                    <LinkPicker value={block.buttonLink} onChange={val => onUpdate({ buttonLink: val })} pages={pages} darkMode={darkMode} t={t} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.buttonBgColor}</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={block.buttonBgColor || '#2563eb'} onChange={e => onUpdate({ buttonBgColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                      <input type="text" value={block.buttonBgColor || '#2563eb'} onChange={e => onUpdate({ buttonBgColor: e.target.value })} className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.buttonTextColor}</label>
                    <div className="flex gap-2 items-center">
                      <input type="color" value={block.buttonTextColor || '#ffffff'} onChange={e => onUpdate({ buttonTextColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                      <input type="text" value={block.buttonTextColor || '#ffffff'} onChange={e => onUpdate({ buttonTextColor: e.target.value })} className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Button 2 Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <span className="font-bold text-sm">{t.showSecondButton}</span>
                <button 
                  onClick={() => onUpdate({ showSecondButton: !block.showSecondButton })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${block.showSecondButton ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${block.showSecondButton ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Button 2 */}
              {block.showSecondButton && (
                <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4 animate-in slide-in-from-top-2">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400">{t.secondButtonText}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">English Second Button Text</label>
                        <input type="text" value={block.secondButtonText || ''} onChange={e => onUpdate({ secondButtonText: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">نص الزر الثاني بالعربية (Arabic Second Button Text)</label>
                        <input type="text" value={block.secondButtonTextAr || ''} onChange={e => onUpdate({ secondButtonTextAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.buttonLink}</label>
                      <input type="text" value={block.secondButtonLink || ''} onChange={e => onUpdate({ secondButtonLink: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.secondButtonBgColor}</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={block.secondButtonBgColor || (darkMode ? '#1f2937' : '#f3f4f6')} onChange={e => onUpdate({ secondButtonBgColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                        <input type="text" value={block.secondButtonBgColor || (darkMode ? '#1f2937' : '#f3f4f6')} onChange={e => onUpdate({ secondButtonBgColor: e.target.value })} className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t.secondButtonTextColor}</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={block.secondButtonTextColor || (darkMode ? '#ffffff' : '#111827')} onChange={e => onUpdate({ secondButtonTextColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
                        <input type="text" value={block.secondButtonTextColor || (darkMode ? '#ffffff' : '#111827')} onChange={e => onUpdate({ secondButtonTextColor: e.target.value })} className={`flex-1 px-3 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(block.template === 'imageBg' || block.template === 'split') && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.backgroundImage}</label>
                  <div className="flex gap-2">
                    <input type="text" value={block.backgroundImage || ''} onChange={e => onUpdate({ backgroundImage: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} placeholder="https://..." />
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && handleDirectUpload) {
                          handleDirectUpload(file, (url: string) => onUpdate({ backgroundImage: url }));
                        }
                      }}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition whitespace-nowrap"
                    >
                      {t.uploadFile}
                    </button>

                    <button 
                      onClick={() => openMediaLibrary((url) => onUpdate({ backgroundImage: url }))}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition whitespace-nowrap"
                    >
                      {t.chooseFromLibrary}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {block.template === 'split' ? t.imageGuideSplit : t.imageGuideFull}
                  </p>
                </div>
              )}
            </div>
          )}

          {block.type === 'richText' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">English Content (HTML)</label>
                <textarea 
                  value={block.content} 
                  onChange={e => onUpdate({ content: e.target.value })} 
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`} 
                  rows={6} 
                  placeholder={t.placeholderHtml}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">المحتوى بالعربية (Arabic Content HTML)</label>
                <textarea 
                  value={block.contentAr || ''} 
                  onChange={e => onUpdate({ contentAr: e.target.value })} 
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-right ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`} 
                  rows={6} 
                  dir="rtl"
                  placeholder="أدخل المحتوى هنا..."
                />
              </div>
            </div>
          )}

          {block.type === 'cards' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">English Heading</label>
                    <input type="text" value={block.heading} onChange={e => onUpdate({ heading: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">العنوان بالعربية (Arabic Heading)</label>
                    <input type="text" value={block.headingAr || ''} onChange={e => onUpdate({ headingAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.layout || 'Layout'}</label>
                  <div className="flex gap-2">
                    {['grid', 'list'].map(l => (
                      <button 
                        key={l}
                        onClick={() => onUpdate({ layout: l as any })}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition capitalize ${block.layout === l || (!block.layout && l === 'grid') ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t.columns}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(c => (
                    <button 
                      key={c}
                      onClick={() => onUpdate({ columns: c as any })}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${block.columns === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                      {c} {t.cols}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <label className="block text-sm font-medium">{t.cards}</label>
                {block.cards.map((card: any, i: number) => (
                  <div key={card.id} className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase">{t.card} {i + 1}</span>
                      <button onClick={() => onUpdate({ cards: block.cards.filter((_: any, idx: number) => idx !== i) })} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.icon || 'Icon'}</label>
                        <div className="flex gap-2">
                          <div className={`p-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                            {(() => {
                              const IconMap: any = { Zap, ShieldCheck, Download, Cpu, Users, Upload, FileText, Globe, Moon, Sun, Mail, MessageSquare, Heart, Star, Bell, Camera, Coffee, Music, Video, MapPin, Search, Settings, Trash2, Edit, Save, Plus, X, ArrowRight, Home, Layout, Type, CreditCard, FormInput, PanelBottom, ArrowLeft, Copy, ExternalLink, Eye, GripVertical, ChevronDown, ChevronUp, Key, Code, RefreshCw, Link: LinkIcon };
                              const IconComp = IconMap[card.icon] || Zap;
                              return <IconComp className="w-5 h-5 text-blue-600" />;
                            })()}
                          </div>
                          <select 
                            value={card.icon} 
                            onChange={e => { const newCards = [...block.cards]; newCards[i].icon = e.target.value; onUpdate({ cards: newCards }); }} 
                            className={`flex-1 px-3 py-2 rounded-lg border outline-none text-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                          >
                            <optgroup label="Common">
                              <option value="Zap">Zap</option>
                              <option value="ShieldCheck">Shield</option>
                              <option value="Download">Download</option>
                              <option value="Cpu">CPU</option>
                              <option value="Users">Users</option>
                              <option value="Upload">Upload</option>
                              <option value="FileText">File</option>
                              <option value="Globe">Globe</option>
                            </optgroup>
                            <optgroup label="Communication">
                              <option value="Mail">Mail</option>
                              <option value="MessageSquare">Message</option>
                              <option value="Bell">Bell</option>
                            </optgroup>
                            <optgroup label="UI Elements">
                              <option value="Home">Home</option>
                              <option value="Layout">Layout</option>
                              <option value="Settings">Settings</option>
                              <option value="Star">Star</option>
                              <option value="Heart">Heart</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Title</label>
                          <input type="text" placeholder={t.titleLabel} value={card.title} onChange={e => { const newCards = [...block.cards]; newCards[i].title = e.target.value; onUpdate({ cards: newCards }); }} className={`w-full px-3 py-2 rounded-lg border outline-none ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">العنوان بالعربية (Arabic Title)</label>
                          <input type="text" placeholder="العنوان..." value={card.titleAr || ''} onChange={e => { const newCards = [...block.cards]; newCards[i].titleAr = e.target.value; onUpdate({ cards: newCards }); }} className={`w-full px-3 py-2 rounded-lg border outline-none text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Description</label>
                        <textarea placeholder={t.description} value={card.description} onChange={e => { const newCards = [...block.cards]; newCards[i].description = e.target.value; onUpdate({ cards: newCards }); }} className={`w-full px-3 py-2 rounded-lg border outline-none ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} rows={2} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">الوصف بالعربية (Arabic Description)</label>
                        <textarea placeholder="الوصف..." value={card.descriptionAr || ''} onChange={e => { const newCards = [...block.cards]; newCards[i].descriptionAr = e.target.value; onUpdate({ cards: newCards }); }} className={`w-full px-3 py-2 rounded-lg border outline-none text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} rows={2} dir="rtl" />
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => onUpdate({ cards: [...block.cards, { id: Math.random().toString(), icon: 'Zap', title: 'New Card', description: 'Description here' }] })}
                  className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-500 transition font-medium"
                >
                  {t.addCard}
                </button>
              </div>
            </div>
          )}

          {block.type === 'contactForm' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-blue-900/10 border-blue-800/30' : 'bg-blue-50 border-blue-100'}`}>
                <label className="block text-xs font-bold text-blue-500 uppercase mb-2">Form Template</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: 'contact', label: 'Contact Form', icon: MessageSquare },
                    { id: 'newsletter', label: 'Newsletter', icon: Mail },
                    { id: 'signup', label: 'Sign Up', icon: UserPlus },
                    { id: 'custom', label: 'Custom Form', icon: Edit }
                  ].map(tmpl => (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        const updates: any = { template: tmpl.id };
                        if (tmpl.id === 'contact') {
                          updates.title = 'Contact Us';
                          updates.titleAr = 'اتصل بنا';
                          updates.fields = [
                            { id: 'name', type: 'text', label: 'Full Name', labelAr: 'الاسم الكامل', required: true },
                            { id: 'email', type: 'email', label: 'Email Address', labelAr: 'البريد الإلكتروني', required: true },
                            { id: 'subject', type: 'text', label: 'Subject', labelAr: 'الموضوع', required: true },
                            { id: 'message', type: 'textarea', label: 'Message', labelAr: 'الرسالة', required: true }
                          ];
                        } else if (tmpl.id === 'newsletter') {
                          updates.title = 'Subscribe to Newsletter';
                          updates.titleAr = 'اشترك في النشرة الإخبارية';
                          updates.fields = [
                            { id: 'email', type: 'email', label: 'Email Address', labelAr: 'البريد الإلكتروني', required: true }
                          ];
                        } else if (tmpl.id === 'signup') {
                          updates.title = 'Create Account';
                          updates.titleAr = 'إنشاء حساب';
                          updates.fields = [
                            { id: 'name', type: 'text', label: 'Name', labelAr: 'الاسم', required: true },
                            { id: 'email', type: 'email', label: 'Email', labelAr: 'البريد الإلكتروني', required: true },
                            { id: 'password', type: 'text', label: 'Password', labelAr: 'كلمة المرور', required: true }
                          ];
                        }
                        onUpdate(updates);
                      }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition ${block.template === tmpl.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400'}`}
                    >
                      <tmpl.icon className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase">{tmpl.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Form Title</label>
                    <input type="text" value={block.title} onChange={e => onUpdate({ title: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">عنوان النموذج بالعربية (Arabic Form Title)</label>
                    <input type="text" value={block.titleAr || ''} onChange={e => onUpdate({ titleAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Form Subtitle</label>
                    <input type="text" value={block.subtitle} onChange={e => onUpdate({ subtitle: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">العنوان الفرعي بالعربية (Arabic Form Subtitle)</label>
                    <input type="text" value={block.subtitleAr || ''} onChange={e => onUpdate({ subtitleAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <label className="block text-sm font-medium">{t.formFields}</label>
                {block.fields.map((field: any, i: number) => (
                  <div key={field.id} className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold text-gray-500 uppercase">{t.field} {i + 1}</span>
                      <button onClick={() => onUpdate({ fields: block.fields.filter((_: any, idx: number) => idx !== i) })} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Label</label>
                          <input type="text" placeholder={t.label} value={field.label} onChange={e => { const newFields = [...block.fields]; newFields[i].label = e.target.value; onUpdate({ fields: newFields }); }} className={`w-full px-3 py-2 rounded-lg border outline-none ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">التسمية بالعربية (Arabic Label)</label>
                          <input type="text" placeholder="التسمية..." value={field.labelAr || ''} onChange={e => { const newFields = [...block.fields]; newFields[i].labelAr = e.target.value; onUpdate({ fields: newFields }); }} className={`w-full px-3 py-2 rounded-lg border outline-none text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.type || 'Type'}</label>
                        <select value={field.type} onChange={e => { const newFields = [...block.fields]; newFields[i].type = e.target.value; onUpdate({ fields: newFields }); }} className={`w-full px-3 py-2 rounded-lg border outline-none ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                          <option value="textarea">Textarea</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <input type="checkbox" checked={field.required} onChange={e => { const newFields = [...block.fields]; newFields[i].required = e.target.checked; onUpdate({ fields: newFields }); }} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                      <label className="text-sm">{t.requiredField}</label>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => onUpdate({ fields: [...block.fields, { id: Math.random().toString(), type: 'text', label: 'New Field', required: false }] })}
                  className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-500 transition font-medium"
                >
                  {t.addField}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Settings className="w-4 h-4" /> Behavior Settings</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Success Message (English)</label>
                      <input type="text" value={block.successMessage || 'Thank you! Your message has been sent.'} onChange={e => onUpdate({ successMessage: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">رسالة النجاح بالعربية</label>
                      <input type="text" value={block.successMessageAr || 'شكراً لك! تم إرسال رسالتك بنجاح.'} onChange={e => onUpdate({ successMessageAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} dir="rtl" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Redirect URL (Optional)</label>
                      <input type="text" value={block.redirectUrl || ''} onChange={e => onUpdate({ redirectUrl: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} placeholder="https://..." />
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Layout className="w-4 h-4" /> Style Settings</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Form Width</label>
                        <select value={block.formWidth || 'medium'} onChange={e => onUpdate({ formWidth: e.target.value })} className={`w-full px-3 py-2 rounded-xl border outline-none ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`}>
                          <option value="narrow">Narrow</option>
                          <option value="medium">Medium</option>
                          <option value="wide">Wide</option>
                          <option value="full">Full</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Button Style</label>
                        <select value={block.buttonStyle || 'solid'} onChange={e => onUpdate({ buttonStyle: e.target.value })} className={`w-full px-3 py-2 rounded-xl border outline-none ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`}>
                          <option value="solid">Solid</option>
                          <option value="outline">Outline</option>
                          <option value="ghost">Ghost</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={block.showLabels !== false} onChange={e => onUpdate({ showLabels: e.target.checked })} className="w-4 h-4 rounded text-blue-600" />
                      <label className="text-sm">Show Field Labels</label>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Background Color</label>
                      <div className="flex gap-2">
                        <input type="color" value={block.backgroundColor || '#ffffff'} onChange={e => onUpdate({ backgroundColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                        <input type="text" value={block.backgroundColor || '#ffffff'} onChange={e => onUpdate({ backgroundColor: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Submit Button Text</label>
                    <input type="text" value={block.submitText || 'Send'} onChange={e => onUpdate({ submitText: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">نص زر الإرسال بالعربية (Arabic Submit Button Text)</label>
                    <input type="text" value={block.submitTextAr || ''} onChange={e => onUpdate({ submitTextAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Button Background Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={block.submitBgColor || '#2563eb'} onChange={e => onUpdate({ submitBgColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                      <input type="text" value={block.submitBgColor || '#2563eb'} onChange={e => onUpdate({ submitBgColor: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-300'}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {block.type === 'newsletter' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Title</label>
                    <input type="text" value={block.title} onChange={e => onUpdate({ title: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">العنوان بالعربية (Arabic Title)</label>
                    <input type="text" value={block.titleAr || ''} onChange={e => onUpdate({ titleAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Subtitle</label>
                    <input type="text" value={block.subtitle} onChange={e => onUpdate({ subtitle: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">العنوان الفرعي بالعربية (Arabic Subtitle)</label>
                    <input type="text" value={block.subtitleAr || ''} onChange={e => onUpdate({ subtitleAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Placeholder</label>
                    <input type="text" value={block.placeholderText} onChange={e => onUpdate({ placeholderText: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">نص التلميح بالعربية (Arabic Placeholder)</label>
                    <input type="text" value={block.placeholderTextAr || ''} onChange={e => onUpdate({ placeholderTextAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Button Text</label>
                    <input type="text" value={block.buttonText} onChange={e => onUpdate({ buttonText: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">نص الزر بالعربية (Arabic Button Text)</label>
                    <input type="text" value={block.buttonTextAr || ''} onChange={e => onUpdate({ buttonTextAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {block.type === 'footer' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Company Name</label>
                    <input type="text" value={block.companyName} onChange={e => onUpdate({ companyName: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">اسم الشركة بالعربية (Arabic Company Name)</label>
                    <input type="text" value={block.companyNameAr || ''} onChange={e => onUpdate({ companyNameAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Copyright</label>
                    <input type="text" value={block.copyright} onChange={e => onUpdate({ copyright: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">حقوق النشر بالعربية (Arabic Copyright)</label>
                    <input type="text" value={block.copyrightAr || ''} onChange={e => onUpdate({ copyrightAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} dir="rtl" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Description</label>
                  <textarea value={block.description} onChange={e => onUpdate({ description: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} rows={2} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">الوصف بالعربية (Arabic Description)</label>
                  <textarea value={block.descriptionAr || ''} onChange={e => onUpdate({ descriptionAr: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 text-right ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} rows={2} dir="rtl" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium">{t.footerColumns || 'Footer Columns'}</label>
                  <button 
                    onClick={() => onUpdate({ columns: [...(block.columns || []), { id: Math.random().toString(), title: 'New Column', links: [] }] })}
                    className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" /> {t.addColumn || 'Add Column'}
                  </button>
                </div>
                <div className="space-y-4">
                  {(block.columns || []).map((col, colIdx) => (
                    <div key={col.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex flex-col gap-2 mb-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Column Title</label>
                              <input 
                                type="text" 
                                value={col.title} 
                                onChange={e => {
                                  const newCols = [...block.columns];
                                  newCols[colIdx].title = e.target.value;
                                  onUpdate({ columns: newCols });
                                }}
                                className={`w-full bg-transparent font-bold outline-none border-b border-transparent focus:border-blue-500 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">عنوان العمود بالعربية</label>
                              <input 
                                type="text" 
                                value={col.titleAr || ''} 
                                onChange={e => {
                                  const newCols = [...block.columns];
                                  newCols[colIdx].titleAr = e.target.value;
                                  onUpdate({ columns: newCols });
                                }}
                                className={`w-full bg-transparent font-bold outline-none border-b border-transparent focus:border-blue-500 text-right ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                dir="rtl"
                              />
                            </div>
                          </div>
                          <button 
                            onClick={() => onUpdate({ columns: block.columns.filter((_, idx) => idx !== colIdx) })}
                            className="text-red-500 hover:text-red-700 ml-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {col.links.map((link, linkIdx) => (
                          <div key={link.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">English Label</label>
                              <input 
                                type="text" 
                                value={link.label || ''} 
                                onChange={e => {
                                  const newCols = [...block.columns];
                                  newCols[colIdx].links[linkIdx].label = e.target.value;
                                  onUpdate({ columns: newCols });
                                }}
                                className={`w-full px-3 py-1.5 text-sm rounded-lg border outline-none ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 text-right">التسمية بالعربية</label>
                              <input 
                                type="text" 
                                value={link.labelAr || ''} 
                                onChange={e => {
                                  const newCols = [...block.columns];
                                  newCols[colIdx].links[linkIdx].labelAr = e.target.value;
                                  onUpdate({ columns: newCols });
                                }}
                                className={`w-full px-3 py-1.5 text-sm rounded-lg border outline-none text-right ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
                                dir="rtl"
                              />
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{t.linkUrl || 'Link URL'}</label>
                                <LinkPicker 
                                  value={link.url} 
                                  onChange={val => {
                                    const newCols = [...block.columns];
                                    newCols[colIdx].links[linkIdx].url = val;
                                    onUpdate({ columns: newCols });
                                  }} 
                                  pages={pages} 
                                  darkMode={darkMode} 
                                  t={t} 
                                />
                              </div>
                              <button 
                                onClick={() => {
                                  const newCols = [...block.columns];
                                  newCols[colIdx].links = newCols[colIdx].links.filter((_, idx) => idx !== linkIdx);
                                  onUpdate({ columns: newCols });
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const newCols = [...block.columns];
                            newCols[colIdx].links.push({ id: Math.random().toString(), label: 'New Link', url: '#' });
                            onUpdate({ columns: newCols });
                          }}
                          className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:text-blue-600 hover:border-blue-500 transition"
                        >
                          <Plus className="w-3 h-3 inline mr-1" /> {t.addLink || 'Add Link'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- App Menu Editor Subcomponent ---

const AppMenuEditor = ({ config, onSave, onChange, pages, openMediaLibrary, darkMode, t }: { config: import('../types').AppMenuConfig, onSave: (c: import('../types').AppMenuConfig) => void, onChange: (c: import('../types').AppMenuConfig) => void, pages: CmsPage[], openMediaLibrary: (cb: (url: string) => void) => void, darkMode: boolean, t: any }) => {
  const defaultConfig = useMemo(() => ({
    appName: 'HandAttend AI',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontColor: '#1f2937',
    items: []
  }), []);

  const [localConfig, setLocalConfig] = useState<import('../types').AppMenuConfig>(config || defaultConfig);

  const handleUpdate = (updates: Partial<import('../types').AppMenuConfig>) => {
    const next = { ...localConfig, ...updates };
    setLocalConfig(next);
    onChange(next);
  };

  const handleAddItem = () => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Item',
      link: 'dashboard',
      icon: 'FileText'
    };
    handleUpdate({ items: [...localConfig.items, newItem] });
  };

  const handleUpdateItem = (id: string, updates: any) => {
    handleUpdate({
      items: localConfig.items.map(item => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const handleRemoveItem = (id: string) => {
    handleUpdate({
      items: localConfig.items.filter(item => item.id !== id)
    });
  };

  const handleMoveItem = (index: number, dir: number) => {
    const newItems = [...localConfig.items];
    const temp = newItems[index];
    newItems[index] = newItems[index + dir];
    newItems[index + dir] = temp;
    handleUpdate({ items: newItems });
  };

  const availableIcons = [
    'LayoutDashboard', 'BookOpen', 'ImageIcon', 'Users', 'Globe', 'FileText', 'Settings', 'Home', 'Mail', 'CreditCard'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <h3 className="text-xl font-bold mb-6">App Menu Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1.5">Application Name</label>
            <input 
              type="text" 
              value={localConfig.appName} 
              onChange={e => handleUpdate({ appName: e.target.value })} 
              className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Logo Image</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={localConfig.logoImage || ''} 
                onChange={e => handleUpdate({ logoImage: e.target.value })} 
                className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                placeholder="https://..." 
              />
              <button 
                onClick={() => openMediaLibrary((url: string) => handleUpdate({ logoImage: url }))}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                {t.upload}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Font Family</label>
            <input 
              type="text" 
              value={localConfig.fontFamily} 
              onChange={e => handleUpdate({ fontFamily: e.target.value })} 
              className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
              placeholder="Inter, sans-serif"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Font Size</label>
            <input 
              type="text" 
              value={localConfig.fontSize} 
              onChange={e => handleUpdate({ fontSize: e.target.value })} 
              className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
              placeholder="14px"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Font Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={localConfig.fontColor} 
                onChange={e => handleUpdate({ fontColor: e.target.value })} 
                className="w-12 h-10 rounded cursor-pointer" 
              />
              <input 
                type="text" 
                value={localConfig.fontColor} 
                onChange={e => handleUpdate({ fontColor: e.target.value })} 
                className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold">Menu Items</h4>
          <button 
            onClick={handleAddItem}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        <div className="space-y-3">
          {localConfig.items.map((item, index) => (
            <div key={item.id} className={`p-4 rounded-xl border flex items-start gap-4 ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex flex-col gap-1 mt-1">
                <button 
                  onClick={() => handleMoveItem(index, -1)} 
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleMoveItem(index, 1)} 
                  disabled={index === localConfig.items.length - 1}
                  className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">Name</label>
                  <input 
                    type="text" 
                    value={item.name} 
                    onChange={e => handleUpdateItem(item.id, { name: e.target.value })} 
                    className={`w-full px-3 py-1.5 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">Link (View ID)</label>
                  <LinkPicker value={item.link} onChange={val => handleUpdateItem(item.id, { link: val })} pages={pages} darkMode={darkMode} t={t} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-gray-500">Icon</label>
                  <select 
                    value={item.icon} 
                    onChange={e => handleUpdateItem(item.id, { icon: e.target.value })} 
                    className={`w-full px-3 py-1.5 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}
                  >
                    {availableIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => handleRemoveItem(item.id)}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition mt-5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={() => onSave(localConfig)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Menu Editor Subcomponent ---

const MenuEditor = ({ config, onSave, onChange, pages, onSavePages, openMediaLibrary, darkMode, t, language }: { config: CmsMenuConfig, onSave: (c: CmsMenuConfig) => void, onChange: (c: CmsMenuConfig) => void, pages: CmsPage[], onSavePages: (p: CmsPage[]) => void, openMediaLibrary: (cb: (url: string) => void) => void, darkMode: boolean, t: any, language: string }) => {
  const defaultConfig = useMemo<CmsMenuConfig>(() => ({
    backgroundStyle: 'solid',
    backgroundColor: '#ffffff',
    gradientStart: '#3b82f6',
    gradientEnd: '#2563eb',
    bottomBorder: 'line',
    sticky: true,
    textColor: '#1f2937',
    hoverColor: '#2563eb',
    logoText: 'HR ERP',
    logoPosition: 'left',
    showSocial: true,
    socialPosition: 'right',
    socialLinks: [],
    showSignIn: true,
    signInText: 'Sign In',
    signInLink: '/login',
    signInBgColor: '#2563eb',
    signInTextColor: '#ffffff',
    signInBorderColor: '#2563eb',
    signInHoverBgColor: '#1d4ed8',
    signInStyle: 'solid'
  }), []);

  const [localConfig, setLocalConfig] = useState<CmsMenuConfig>(config || defaultConfig);

  const handleUpdate = (updates: Partial<CmsMenuConfig>) => {
    const next = { ...localConfig, ...updates };
    setLocalConfig(next);
    onChange(next);
  };

  const handleSave = () => {
    onSave(localConfig);
  };

  const togglePageInMenu = (pageId: string) => {
    const updatedPages = pages.map(p => p.id === pageId ? { ...p, inMenu: !p.inMenu } : p);
    onSavePages(updatedPages);
  };

  const addSocialLink = () => {
    const newLink: SocialLink = { id: Math.random().toString(36).substr(2, 9), platform: 'Facebook', url: '' };
    handleUpdate({ socialLinks: [...localConfig.socialLinks, newLink] });
  };

  const updateSocialLink = (id: string, updates: Partial<SocialLink>) => {
    handleUpdate({
      socialLinks: localConfig.socialLinks.map(link => link.id === id ? { ...link, ...updates } : link)
    });
  };

  const removeSocialLink = (id: string) => {
    handleUpdate({
      socialLinks: localConfig.socialLinks.filter(link => link.id !== id)
    });
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 animate-in fade-in ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-end">
        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2">
          <Save className="w-4 h-4" /> {t.saveMenuSettings}
        </button>
      </div>

      {/* Navigation Pages Toggle */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ArrowRight className={`w-5 h-5 text-blue-500 ${language === 'ar' ? 'rotate-180' : ''}`} /> {t.navigationPages}</h3>
        <p className="text-sm text-gray-500 mb-4">{t.navigationPagesDesc}</p>
        <div className="space-y-3">
          {pages.map(page => (
            <div key={page.id} className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div>
                <h4 className="font-bold">{page.title}</h4>
                <p className="text-xs text-gray-500">{page.slug}</p>
              </div>
              <button 
                onClick={() => togglePageInMenu(page.id)}
                className={`w-12 h-6 rounded-full transition-colors relative ${page.inMenu ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${page.inMenu ? (language === 'ar' ? 'right-7' : 'left-7') : (language === 'ar' ? 'right-1' : 'left-1')}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Background Style */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Layout className="w-5 h-5 text-blue-500" /> {t.backgroundStyle}</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">{t.style}</label>
            <div className="flex flex-wrap gap-2">
              {['solid', 'gradient', 'transparent', 'glass'].map(s => (
                <button 
                  key={s}
                  onClick={() => handleUpdate({ backgroundStyle: s as any })}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${localConfig.backgroundStyle === s ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  {s === 'glass' ? t.glassBlur : t[s] || s}
                </button>
              ))}
            </div>
          </div>

          {localConfig.backgroundStyle === 'solid' && (
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.backgroundColor}</label>
              <div className="flex gap-2">
                <input type="color" value={localConfig.backgroundColor} onChange={e => handleUpdate({ backgroundColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer" />
                <input type="text" value={localConfig.backgroundColor} onChange={e => handleUpdate({ backgroundColor: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
              </div>
            </div>
          )}

          {localConfig.backgroundStyle === 'gradient' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t.startColor}</label>
                <div className="flex gap-2">
                  <input type="color" value={localConfig.gradientStart || '#ffffff'} onChange={e => handleUpdate({ gradientStart: e.target.value })} className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer" />
                  <input type="text" value={localConfig.gradientStart || '#ffffff'} onChange={e => handleUpdate({ gradientStart: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t.endColor}</label>
                <div className="flex gap-2">
                  <input type="color" value={localConfig.gradientEnd || '#000000'} onChange={e => handleUpdate({ gradientEnd: e.target.value })} className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer" />
                  <input type="text" value={localConfig.gradientEnd || '#000000'} onChange={e => handleUpdate({ gradientEnd: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-3">{t.bottomBorder}</label>
            <div className="flex gap-2">
              {['none', 'line', 'shadow'].map(b => (
                <button 
                  key={b}
                  onClick={() => handleUpdate({ bottomBorder: b as any })}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${localConfig.bottomBorder === b ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  {t[b] || b}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="sticky" 
              checked={localConfig.sticky} 
              onChange={e => handleUpdate({ sticky: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="sticky" className="text-sm font-medium">{t.stickyHeader}</label>
          </div>
        </div>
      </div>

      {/* Menu Items Style */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Type className="w-5 h-5 text-blue-500" /> {t.menuItemsStyle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.textColor}</label>
            <div className="flex gap-2">
              <input type="color" value={localConfig.textColor} onChange={e => handleUpdate({ textColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer" />
              <input type="text" value={localConfig.textColor} onChange={e => handleUpdate({ textColor: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.hoverColor}</label>
            <div className="flex gap-2">
              <input type="color" value={localConfig.hoverColor} onChange={e => handleUpdate({ hoverColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer" />
              <input type="text" value={localConfig.hoverColor} onChange={e => handleUpdate({ hoverColor: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Button Style */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-500" /> {t.menuButtonStyle}</h3>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="showSignIn" 
              checked={localConfig.showSignIn} 
              onChange={e => handleUpdate({ showSignIn: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showSignIn" className="text-sm font-medium">{t.showPrimaryButton}</label>
          </div>

          {localConfig.showSignIn && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.buttonText}</label>
                  <input type="text" value={localConfig.signInText} onChange={e => handleUpdate({ signInText: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.buttonLink}</label>
                  <LinkPicker value={localConfig.signInLink} onChange={val => handleUpdate({ signInLink: val })} pages={pages} darkMode={darkMode} t={t} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.backgroundColor}</label>
                  <div className="flex gap-2">
                    <input type="color" value={localConfig.signInBgColor} onChange={e => handleUpdate({ signInBgColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer" />
                    <input type="text" value={localConfig.signInBgColor} onChange={e => handleUpdate({ signInBgColor: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.textColor}</label>
                  <div className="flex gap-2">
                    <input type="color" value={localConfig.signInTextColor} onChange={e => handleUpdate({ signInTextColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer" />
                    <input type="text" value={localConfig.signInTextColor} onChange={e => handleUpdate({ signInTextColor: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.borderColor}</label>
                  <div className="flex gap-2">
                    <input type="color" value={localConfig.signInBorderColor} onChange={e => handleUpdate({ signInBorderColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer" />
                    <input type="text" value={localConfig.signInBorderColor} onChange={e => handleUpdate({ signInBorderColor: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t.hoverEffectColor}</label>
                  <div className="flex gap-2">
                    <input type="color" value={localConfig.signInHoverBgColor} onChange={e => handleUpdate({ signInHoverBgColor: e.target.value })} className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer" />
                    <input type="text" value={localConfig.signInHoverBgColor} onChange={e => handleUpdate({ signInHoverBgColor: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">{t.buttonStyle}</label>
                <div className="flex gap-2">
                  {['solid', 'outline', 'ghost'].map(s => (
                    <button 
                      key={s}
                      onClick={() => handleUpdate({ signInStyle: s as any })}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${localConfig.signInStyle === s ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      {t[s] || s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Logo */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-purple-500" /> {t.logo}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.logoText}</label>
            <input type="text" value={localConfig.logoText} onChange={e => handleUpdate({ logoText: e.target.value })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.logoImageUrl}</label>
            <div className="flex gap-2">
              <input type="text" value={localConfig.logoImage || ''} onChange={e => handleUpdate({ logoImage: e.target.value })} className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} placeholder="https://..." />
              <button 
                onClick={() => openMediaLibrary((url) => handleUpdate({ logoImage: url }))}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                {t.upload}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Social Media Icons */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> {t.socialMediaIcons}</h3>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="showSocial" 
              checked={localConfig.showSocial} 
              onChange={e => handleUpdate({ showSocial: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showSocial" className="text-sm font-medium">{t.showSocialIcons}</label>
          </div>

          {localConfig.showSocial && (
            <>
              <div>
                <label className="block text-sm font-medium mb-3">{t.iconsPosition}</label>
                <div className="flex gap-2">
                  {['left', 'right'].map(p => (
                    <button 
                      key={p}
                      onClick={() => handleUpdate({ socialPosition: p as any })}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${localConfig.socialPosition === p ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      {t[p] || p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {localConfig.socialLinks.map((link) => (
                  <div key={link.id} className="flex gap-3 items-center">
                    <select 
                      value={link.platform} 
                      onChange={e => updateSocialLink(link.id, { platform: e.target.value })}
                      className={`w-32 px-3 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                    >
                      {['Facebook', 'LinkedIn', 'YouTube', 'GitHub', 'Twitter', 'Instagram'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <input 
                      type="text" 
                      value={link.url} 
                      onChange={e => updateSocialLink(link.id, { url: e.target.value })}
                      placeholder="https://..."
                      className={`flex-1 px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
                    />
                    <button onClick={() => removeSocialLink(link.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={addSocialLink}
                  className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-500 transition font-medium"
                >
                  + {t.addSocialLink}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SettingsEditor = ({ settings, onSave, onChange, darkMode, t, language }: { settings: SiteSettings, onSave: (s: SiteSettings) => void, onChange: (s: SiteSettings) => void, darkMode: boolean, t: any, language: string }) => {
  const [localSettings, setLocalSettings] = useState<SiteSettings>(settings);

  const handleUpdate = (updates: Partial<SiteSettings>) => {
    const next = { ...localSettings, ...updates };
    setLocalSettings(next);
    onChange(next);
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 animate-in fade-in ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-end">
        <button onClick={() => onSave(localSettings)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2">
          <Save className="w-4 h-4" /> {t.saveSettings}
        </button>
      </div>

      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-yellow-500" /> {t.envVarsApiKeys}</h3>
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-900/10 text-yellow-800 dark:text-yellow-300 text-sm">
            <strong>{t.securityNote}:</strong> {t.securityNoteDesc}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t.geminiApiKey}</label>
            <input 
              type="password" 
              value={localSettings.geminiApiKey || ''} 
              onChange={e => handleUpdate({ geminiApiKey: e.target.value })} 
              className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} 
              placeholder="AIzaSy..."
            />
            <p className="text-xs text-gray-500 mt-1">{t.geminiApiKeyOverride}</p>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> {t.socialMediaLinks}</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.facebook}</label>
              <input type="text" value={localSettings.socialLinks.facebook} onChange={e => handleUpdate({ socialLinks: {...localSettings.socialLinks, facebook: e.target.value} })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} placeholder="https://facebook.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.twitter}</label>
              <input type="text" value={localSettings.socialLinks.twitter} onChange={e => handleUpdate({ socialLinks: {...localSettings.socialLinks, twitter: e.target.value} })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} placeholder="https://twitter.com/..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.linkedin}</label>
              <input type="text" value={localSettings.socialLinks.linkedin} onChange={e => handleUpdate({ socialLinks: {...localSettings.socialLinks, linkedin: e.target.value} })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t.github}</label>
              <input type="text" value={localSettings.socialLinks.github} onChange={e => handleUpdate({ socialLinks: {...localSettings.socialLinks, github: e.target.value} })} className={`w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`} placeholder="https://github.com/..." />
            </div>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Code className="w-5 h-5 text-gray-700 dark:text-gray-300" /> {t.deploymentHosting}</h3>
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            {t.deploymentHostingDesc}
          </p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
            <li><strong>Firebase Hosting:</strong> {language === 'ar' ? 'استضافة سريعة وآمنة مع تكامل كامل مع Firestore.' : 'Fast and secure hosting with full Firestore integration.'}</li>
            <li><strong>Vercel:</strong> {t.vercelDesc}</li>
            <li><strong>Netlify:</strong> {t.netlifyDesc}</li>
            <li><strong>{t.envVars}:</strong> {t.envVarsDesc}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const NewsletterEditor = ({ settings, responses, onSave, onDeleteResponse, darkMode, t, language }: { settings: import('../types').NewsletterSettings, responses: import('../types').NewsletterResponse[], onSave: (s: import('../types').NewsletterSettings) => void, onDeleteResponse: (id: string) => void, darkMode: boolean, t: any, language: string }) => {
  const [localSettings, setLocalSettings] = useState<import('../types').NewsletterSettings>(settings);

  const handleUpdate = (updates: Partial<import('../types').NewsletterSettings>) => {
    const next = { ...localSettings, ...updates };
    setLocalSettings(next);
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 animate-in fade-in ${language === 'ar' ? 'font-arabic' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-end">
        <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>

      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Mail className="w-5 h-5 text-blue-500" /> Newsletter Activation</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div>
              <div className="font-bold">Enable Newsletter</div>
              <div className="text-sm text-gray-500">Allow users to subscribe to your newsletter</div>
            </div>
            <button 
              onClick={() => handleUpdate({ enabled: !localSettings.enabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <div>
              <div className="font-bold">Collect Responses</div>
              <div className="text-sm text-gray-500">Save subscriber emails to your database</div>
            </div>
            <button 
              onClick={() => handleUpdate({ collectResponses: !localSettings.collectResponses })}
              className={`w-12 h-6 rounded-full transition-colors relative ${localSettings.collectResponses ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.collectResponses ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-purple-500" /> Subscriber Responses ({responses.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase">Email</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase">Source</th>
                <th className="py-3 px-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {responses.length > 0 ? responses.map(res => (
                <tr key={res.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                  <td className="py-3 px-4 font-medium">{res.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(res.timestamp).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{res.sourcePage || '/'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => onDeleteResponse(res.id)} className="p-2 text-red-400 hover:text-red-600 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500 italic">No subscribers yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WebsiteCMS;
