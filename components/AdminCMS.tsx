import React, { useState } from 'react';
import { SiteSettings, FeatureBlock } from '../types';
import { Save, Plus, Trash2, Settings, Globe, LayoutTemplate, Link as LinkIcon, Key } from 'lucide-react';

interface AdminCMSProps {
  settings: SiteSettings;
  onSave: (newSettings: SiteSettings) => void;
  language: string;
  darkMode: boolean;
}

const AdminCMS: React.FC<AdminCMSProps> = ({ settings, onSave, language, darkMode }) => {
  const [localSettings, setLocalSettings] = useState<SiteSettings>(settings);
  const isRtl = language === 'ar';

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (platform: keyof SiteSettings['socialLinks'], value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
  };

  const handleFeatureChange = (index: number, field: keyof FeatureBlock, value: string) => {
    const newFeatures = [...localSettings.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    handleChange('features', newFeatures);
  };

  const addFeature = () => {
    handleChange('features', [
      ...localSettings.features,
      { id: Date.now().toString(), icon: 'Zap', titleAr: '', titleEn: '', descAr: '', descEn: '' }
    ]);
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...localSettings.features];
    newFeatures.splice(index, 1);
    handleChange('features', newFeatures);
  };

  const saveChanges = () => {
    onSave(localSettings);
    alert(isRtl ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
  };

  const inputClass = `w-full px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`;
  const labelClass = "block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <LayoutTemplate className="w-8 h-8 text-blue-600" />
            {isRtl ? 'إدارة محتوى الموقع (CMS)' : 'Website Content Management (CMS)'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isRtl ? 'تعديل محتوى الصفحة الرئيسية والإعدادات العامة' : 'Edit landing page content and general settings'}
          </p>
        </div>
        <button 
          onClick={saveChanges}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Section */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4 dark:border-gray-800">
              <Globe className="w-5 h-5 text-blue-500" />
              {isRtl ? 'القسم الرئيسي (Hero)' : 'Hero Section'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>العنوان الرئيسي (عربي)</label>
                <input type="text" value={localSettings.heroTitleAr} onChange={e => handleChange('heroTitleAr', e.target.value)} className={inputClass} dir="rtl" />
              </div>
              <div>
                <label className={labelClass}>Hero Title (English)</label>
                <input type="text" value={localSettings.heroTitleEn} onChange={e => handleChange('heroTitleEn', e.target.value)} className={inputClass} dir="ltr" />
              </div>
              <div>
                <label className={labelClass}>النص الفرعي (عربي)</label>
                <textarea value={localSettings.heroSubtitleAr} onChange={e => handleChange('heroSubtitleAr', e.target.value)} className={inputClass} rows={3} dir="rtl" />
              </div>
              <div>
                <label className={labelClass}>Hero Subtitle (English)</label>
                <textarea value={localSettings.heroSubtitleEn} onChange={e => handleChange('heroSubtitleEn', e.target.value)} className={inputClass} rows={3} dir="ltr" />
              </div>
              <div>
                <label className={labelClass}>نص الزر (عربي)</label>
                <input type="text" value={localSettings.ctaTextAr} onChange={e => handleChange('ctaTextAr', e.target.value)} className={inputClass} dir="rtl" />
              </div>
              <div>
                <label className={labelClass}>Button Text (English)</label>
                <input type="text" value={localSettings.ctaTextEn} onChange={e => handleChange('ctaTextEn', e.target.value)} className={inputClass} dir="ltr" />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
            <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-800">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-blue-500" />
                {isRtl ? 'المميزات' : 'Features'}
              </h3>
              <button onClick={addFeature} className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-lg transition flex items-center gap-1 text-sm font-bold">
                <Plus className="w-4 h-4" /> {isRtl ? 'إضافة ميزة' : 'Add Feature'}
              </button>
            </div>

            <div className="space-y-6">
              {localSettings.features.map((feature, idx) => (
                <div key={feature.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} relative`}>
                  <button onClick={() => removeFeature(idx)} className="absolute top-4 right-4 rtl:left-4 rtl:right-auto text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Icon Name (Lucide React)</label>
                      <input type="text" value={feature.icon} onChange={e => handleFeatureChange(idx, 'icon', e.target.value)} className={inputClass} dir="ltr" placeholder="e.g. Zap, ShieldCheck, Download" />
                    </div>
                    <div>
                      <label className={labelClass}>العنوان (عربي)</label>
                      <input type="text" value={feature.titleAr} onChange={e => handleFeatureChange(idx, 'titleAr', e.target.value)} className={inputClass} dir="rtl" />
                    </div>
                    <div>
                      <label className={labelClass}>Title (English)</label>
                      <input type="text" value={feature.titleEn} onChange={e => handleFeatureChange(idx, 'titleEn', e.target.value)} className={inputClass} dir="ltr" />
                    </div>
                    <div>
                      <label className={labelClass}>الوصف (عربي)</label>
                      <textarea value={feature.descAr} onChange={e => handleFeatureChange(idx, 'descAr', e.target.value)} className={inputClass} rows={2} dir="rtl" />
                    </div>
                    <div>
                      <label className={labelClass}>Description (English)</label>
                      <textarea value={feature.descEn} onChange={e => handleFeatureChange(idx, 'descEn', e.target.value)} className={inputClass} rows={2} dir="ltr" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Integrations */}
        <div className="space-y-8">
          {/* Social Links */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4 dark:border-gray-800">
              <LinkIcon className="w-5 h-5 text-blue-500" />
              {isRtl ? 'روابط التواصل الاجتماعي' : 'Social Links'}
            </h3>
            <div className="space-y-4">
              {Object.keys(localSettings.socialLinks).map((platform) => (
                <div key={platform}>
                  <label className="block text-sm font-bold mb-1 capitalize text-gray-700 dark:text-gray-300">{platform}</label>
                  <input 
                    type="url" 
                    value={localSettings.socialLinks[platform as keyof SiteSettings['socialLinks']]} 
                    onChange={e => handleSocialChange(platform as keyof SiteSettings['socialLinks'], e.target.value)} 
                    className={inputClass} 
                    dir="ltr" 
                    placeholder={`https://${platform}.com/...`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Integrations & Environment Variables */}
          <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 border-b pb-4 dark:border-gray-800">
              <Settings className="w-5 h-5 text-blue-500" />
              {isRtl ? 'التكامل والإعدادات' : 'Integrations & Settings'}
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Menu Style</label>
                <select value={localSettings.menuStyle} onChange={e => handleChange('menuStyle', e.target.value)} className={inputClass} dir="ltr">
                  <option value="classic">Classic</option>
                  <option value="modern">Modern</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50">
                <h4 className="font-bold text-yellow-800 dark:text-yellow-500 flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4" />
                  Environment Variables
                </h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
                  {isRtl 
                    ? 'لأسباب أمنية، يجب تغيير إعدادات Firebase و GitHub من خلال لوحة تحكم الاستضافة (مثل Vercel أو Netlify) وإعادة بناء الموقع. لا يمكن تغييرها من هنا.' 
                    : 'For security reasons, Firebase and GitHub configurations must be changed in your hosting dashboard (e.g., Vercel, Netlify) and require a rebuild. They cannot be changed here.'}
                </p>
              </div>

              <div>
                <label className={labelClass}>Gemini API Key (Optional Override)</label>
                <input 
                  type="password" 
                  value={localSettings.geminiApiKey || ''} 
                  onChange={e => handleChange('geminiApiKey', e.target.value)} 
                  className={inputClass} 
                  dir="ltr" 
                  placeholder="AIzaSy..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isRtl ? 'إذا تم إدخاله هنا، سيتم استخدامه بدلاً من المتغير البيئي. (تحذير: سيتم حفظه في قاعدة البيانات)' : 'If entered here, it overrides the environment variable. (Warning: Saved to database)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCMS;
