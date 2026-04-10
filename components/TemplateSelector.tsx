import React from 'react';
import { X, Home, Zap, ShieldCheck, Cpu, Users, FileText, Mail, PanelBottom, CreditCard, Layout, Download, Upload, Globe, Moon, Sun, MessageSquare, ArrowRight } from 'lucide-react';
import { CmsPage, CmsBlock } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { TRANSLATIONS } from '../constants';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateId: string | 'blank') => void;
  language?: string;
}

export const PAGE_TEMPLATES = [
  {
    id: 'home',
    title: 'Home Page',
    titleAr: 'الصفحة الرئيسية',
    description: 'Full landing page with hero, features, and call to action.',
    descriptionAr: 'صفحة هبوط كاملة مع قسم هيرو، مميزات، ودعوة لاتخاذ إجراء.',
    icon: Home,
    thumbnail: 'https://picsum.photos/seed/hr-home/400/300',
    blocks: [
      { id: 'h1', type: 'hero', template: 'centered', title: 'Modern HR Management for Your Organization', subtitle: 'Streamline your workforce, payroll, and attendance with our unified platform.', buttonText: 'Get Started', buttonLink: '/register' },
      { id: 'c1', type: 'cards', heading: 'Core Features', columns: 3, cards: [
        { id: 'f1', icon: 'Zap', title: 'Fast Processing', description: 'Process attendance and payroll in seconds.' },
        { id: 'f2', icon: 'ShieldCheck', title: 'Secure Data', description: 'Enterprise-grade security for your sensitive HR data.' },
        { id: 'f3', icon: 'Users', title: 'Employee Portal', description: 'Self-service portal for employees to manage their profiles.' }
      ]},
      { id: 'n1', type: 'newsletter', title: 'Stay Updated', subtitle: 'Subscribe to our newsletter for the latest HR trends.', placeholderText: 'Enter your email', buttonText: 'Subscribe', backgroundColor: '#f3f4f6', textColor: '#111827' }
    ] as CmsBlock[]
  },
  {
    id: 'features',
    title: 'Application Features',
    titleAr: 'مميزات التطبيق',
    description: 'Showcase all application features with icons and descriptions.',
    descriptionAr: 'عرض جميع مميزات التطبيق مع الأيقونات والأوصاف.',
    icon: Zap,
    thumbnail: 'https://picsum.photos/seed/hr-features/400/300',
    blocks: [
      { id: 'h2', type: 'hero', template: 'split', title: 'Powerful Features for Modern HR', subtitle: 'Discover how our platform can transform your organization.', buttonText: 'Explore Features', buttonLink: '#features' },
      { id: 'c2', type: 'cards', heading: 'Key Capabilities', columns: 3, cards: [
        { id: 'feat1', icon: 'Cpu', title: 'AI Extraction', description: 'Extract data from handwritten sheets using advanced AI.' },
        { id: 'feat2', icon: 'Layout', title: 'Custom Dashboards', description: 'Visualize your HR data with customizable widgets.' },
        { id: 'feat3', icon: 'Users', title: 'Role Management', description: 'Granular access control for different user roles.' }
      ]}
    ] as CmsBlock[]
  },
  {
    id: 'benefits',
    title: 'Application Benefits',
    titleAr: 'فوائد التطبيق',
    description: 'Highlight the value and ROI of your application.',
    descriptionAr: 'تسليط الضوء على القيمة والعائد من الاستثمار لتطبيقك.',
    icon: ShieldCheck,
    thumbnail: 'https://picsum.photos/seed/hr-benefits/400/300',
    blocks: [
      { id: 'h3', type: 'hero', template: 'gradient', title: 'Why Organizations Trust Us', subtitle: 'Experience the benefits of a modern HR infrastructure.', buttonText: 'Learn More', buttonLink: '#benefits' },
      { id: 'c3', type: 'cards', heading: 'Business Benefits', columns: 3, cards: [
        { id: 'b1', icon: 'ShieldCheck', title: 'Compliance', description: 'Stay compliant with local labor laws automatically.' },
        { id: 'b2', icon: 'Zap', title: 'Efficiency', description: 'Reduce administrative overhead by up to 40%.' },
        { id: 'b3', icon: 'Users', title: 'Retention', description: 'Improve employee satisfaction with transparent processes.' }
      ]}
    ] as CmsBlock[]
  },
  {
    id: 'modules',
    title: 'Application Modules',
    titleAr: 'وحدات التطبيق',
    description: 'List the different modules available in your system.',
    descriptionAr: 'قائمة بالوحدات المختلفة المتاحة في نظامك.',
    icon: Cpu,
    thumbnail: 'https://picsum.photos/seed/hr-modules/400/300',
    blocks: [
      { id: 'h4', type: 'hero', template: 'centered', title: 'Modular HR Excellence', subtitle: 'Choose the modules that fit your organization\'s needs.', buttonText: 'View Modules', buttonLink: '#modules' },
      { id: 'c4', type: 'cards', heading: 'System Modules', columns: 4, cards: [
        { id: 'm1', icon: 'Users', title: 'Core HR', description: 'Employee database and records.' },
        { id: 'm2', icon: 'CreditCard', title: 'Payroll', description: 'Automated salary calculations.' },
        { id: 'm3', icon: 'Layout', title: 'Attendance', description: 'Time tracking and leave management.' },
        { id: 'm4', icon: 'Cpu', title: 'Analytics', description: 'Advanced reporting and insights.' }
      ]}
    ] as CmsBlock[]
  },
  {
    id: 'products',
    title: 'Products',
    titleAr: 'المنتجات',
    description: 'Showcase your product offerings or pricing plans.',
    descriptionAr: 'عرض عروض منتجاتك أو خطط التسعير.',
    icon: CreditCard,
    thumbnail: 'https://picsum.photos/seed/hr-products/400/300',
    blocks: [
      { id: 'h5', type: 'hero', template: 'imageBg', title: 'Our Solutions', subtitle: 'Tailored products for organizations of all sizes.', buttonText: 'View Pricing', buttonLink: '#pricing' },
      { id: 'c5', type: 'cards', heading: 'Product Plans', columns: 3, cards: [
        { id: 'p1', icon: 'Zap', title: 'Starter', description: 'For small teams up to 20 employees.' },
        { id: 'p2', icon: 'ShieldCheck', title: 'Professional', description: 'For growing organizations up to 200 employees.' },
        { id: 'p3', icon: 'Cpu', title: 'Enterprise', description: 'Custom solutions for large organizations.' }
      ]}
    ] as CmsBlock[]
  },
  {
    id: 'about',
    title: 'About Us',
    titleAr: 'من نحن',
    description: 'Tell your company story and introduce your team.',
    descriptionAr: 'أخبر قصة شركتك وقدم فريقك.',
    icon: Users,
    thumbnail: 'https://picsum.photos/seed/hr-about/400/300',
    blocks: [
      { id: 'h6', type: 'hero', template: 'split', title: 'Our Mission', subtitle: 'We are dedicated to modernizing HR for everyone.', buttonText: 'Our Story', buttonLink: '#story' },
      { id: 'r1', type: 'richText', content: '<h2>Our History</h2><p>Founded in 2024, we saw a gap in the market for localized HR solutions...</p>' }
    ] as CmsBlock[]
  },
  {
    id: 'contact',
    title: 'Contact Us',
    titleAr: 'اتصل بنا',
    description: 'Get in touch with your customers through a contact form.',
    descriptionAr: 'تواصل مع عملائك من خلال نموذج اتصال.',
    icon: Mail,
    thumbnail: 'https://picsum.photos/seed/hr-contact/400/300',
    blocks: [
      { id: 'h7', type: 'hero', template: 'centered', title: 'Get in Touch', subtitle: 'We\'d love to hear from you. Send us a message below.', buttonText: 'Contact Form', buttonLink: '#contact' },
      { 
        id: 'f1', 
        type: 'contactForm', 
        title: 'Send a Message', 
        subtitle: 'Fill out the form and we\'ll get back to you shortly.',
        fields: [
          { id: 'name', type: 'text', label: 'Full Name', required: true },
          { id: 'email', type: 'email', label: 'Email Address', required: true },
          { id: 'msg', type: 'textarea', label: 'Message', required: true }
        ],
        formWidth: 'medium',
        sectionPadding: 'medium',
        backgroundColor: '#ffffff',
        submitText: 'Send Message',
        submitBgColor: '#2563eb',
        submitTextColor: '#ffffff',
        destination: 'firestore',
        firestoreCollection: 'contact_submissions'
      } as CmsBlock
    ] as CmsBlock[]
  },
  {
    id: 'blog',
    title: 'Blog',
    titleAr: 'المدونة',
    description: 'A layout for your latest news and articles.',
    descriptionAr: 'تخطيط لآخر الأخبار والمقالات الخاصة بك.',
    icon: FileText,
    thumbnail: 'https://picsum.photos/seed/hr-blog/400/300',
    blocks: [
      { id: 'h8', type: 'hero', template: 'gradient', title: 'Our Blog', subtitle: 'Latest news, trends, and insights from the world of HR.', buttonText: 'Read Latest', buttonLink: '#latest' },
      { id: 'r2', type: 'richText', content: '<h3>Latest Articles</h3><p>Coming soon...</p>' }
    ] as CmsBlock[]
  },
  {
    id: 'newsletter',
    title: 'Newsletter Subscribe',
    titleAr: 'الاشتراك في النشرة البريدية',
    description: 'A dedicated page for newsletter signups.',
    descriptionAr: 'صفحة مخصصة للاشتراك في النشرة البريدية.',
    icon: PanelBottom,
    thumbnail: 'https://picsum.photos/seed/hr-newsletter/400/300',
    blocks: [
      { id: 'h9', type: 'hero', template: 'centered', title: 'Join Our Newsletter', subtitle: 'Get the best HR tips delivered to your inbox weekly.', buttonText: 'Subscribe Now', buttonLink: '#subscribe' },
      { id: 'n2', type: 'newsletter', title: 'Subscribe', subtitle: 'No spam, just value.', placeholderText: 'your@email.com', buttonText: 'Join Now', backgroundColor: '#ffffff', textColor: '#111827' }
    ] as CmsBlock[]
  }
];

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ isOpen, onClose, onSelect, language = 'en' }) => {
  const t = (TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS.en).cms;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-10 ${language === 'ar' ? 'font-arabic' : ''}`}
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">{t.chooseTemplate}</h3>
                <p className="text-gray-500 dark:text-gray-400">{t.chooseTemplateDesc}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mt-2">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t.availableTemplates}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Blank Page Option */}
                    <motion.button
                      whileHover={{ y: -5 }}
                      onClick={() => onSelect('blank')}
                      className="flex flex-col p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all text-left group bg-white dark:bg-gray-900"
                    >
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 group-hover:border-blue-500/50 transition-colors">
                        <FileText className="w-10 h-10 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h5 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">{t.blankPage}</h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{t.blankPageDesc}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          0 {t.blocks}
                        </span>
                      </div>
                    </motion.button>

                    {PAGE_TEMPLATES.map((template, idx) => (
                      <motion.button
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -5 }}
                        onClick={() => onSelect(template.id)}
                        className="flex flex-col p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all text-left group bg-white dark:bg-gray-900"
                      >
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800 group-hover:shadow-md transition-shadow">
                          <img 
                            src={template.thumbnail} 
                            alt={language === 'ar' ? template.titleAr : template.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                            <template.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                        </div>
                        <h5 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">
                          {language === 'ar' ? template.titleAr : template.title}
                        </h5>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {language === 'ar' ? template.descriptionAr : template.description}
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {template.blocks.length} {t.blocks}
                          </span>
                          {template.id === 'home' && (
                            <span className="text-xs font-medium px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                              {t.essential}
                            </span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TemplateSelector;
