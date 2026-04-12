
export type Role = 'Admin' | 'HR User';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
}

export interface VisualReference {
  id: string;
  digit: string;
  imageBase64: string;
}

export interface ConfidenceValue<T> {
  value: T;
  confidence: number;
}

export interface AttendanceRecord {
  date: string;
  check_in: ConfidenceValue<string | null> & { note?: ConfidenceValue<string | null> };
  check_out: ConfidenceValue<string | null> & { note?: ConfidenceValue<string | null> };
}

export interface EmployeeExtraction {
  employee_name: ConfidenceValue<string>;
  records: AttendanceRecord[];
}

export interface ExtractionResult {
  employees: EmployeeExtraction[];
}

export enum FileStatus {
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed'
}

export interface AttendanceFile {
  id: string;
  name: string;
  uploaded_by: string;
  upload_date: string;
  status: FileStatus;
  year: number;
  startDate?: string;
  endDate?: string;
  data?: ExtractionResult;
  previewUrl?: string;
}

export interface CorrectionEntry {
  original: string;
  corrected: string;
  type: 'name' | 'time';
}

export interface FeatureBlock {
  id: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

export interface SiteSettings {
  heroTitleAr: string;
  heroTitleEn: string;
  heroSubtitleAr: string;
  heroSubtitleEn: string;
  ctaTextAr: string;
  ctaTextEn: string;
  features: FeatureBlock[];
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    github: string;
  };
  menuStyle: 'classic' | 'modern';
  geminiApiKey?: string;
}

export type BlockType = 'hero' | 'richText' | 'cards' | 'contactForm' | 'newsletter' | 'footer';

export interface BaseBlock {
  id: string;
  type: BlockType;
  width?: number; // percentage 0-100
}

export interface NewsletterBlock extends BaseBlock {
  type: 'newsletter';
  title: string;
  titleAr?: string;
  subtitle: string;
  subtitleAr?: string;
  placeholderText: string;
  placeholderTextAr?: string;
  buttonText: string;
  buttonTextAr?: string;
  backgroundColor: string;
  textColor: string;
}

export interface HeroBlock extends BaseBlock {
  type: 'hero';
  template: 'centered' | 'split' | 'gradient' | 'imageBg';
  title: string;
  titleAr?: string;
  titleColor?: string;
  titleFont?: string;
  showSecondTitle?: boolean;
  secondTitle?: string;
  secondTitleAr?: string;
  secondTitleColor?: string;
  secondTitleFont?: string;
  subtitle: string;
  subtitleAr?: string;
  subtitleColor?: string;
  buttonText: string;
  buttonTextAr?: string;
  buttonLink: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  showSecondButton?: boolean;
  secondButtonText?: string;
  secondButtonTextAr?: string;
  secondButtonLink?: string;
  secondButtonBgColor?: string;
  secondButtonTextColor?: string;
  backgroundImage?: string;
  overlayColor?: string;
}

export interface RichTextBlock extends BaseBlock {
  type: 'richText';
  content: string;
  contentAr?: string;
}

export interface CardItem {
  id: string;
  icon: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
}

export interface CardsBlock extends BaseBlock {
  type: 'cards';
  heading: string;
  headingAr?: string;
  columns: 1 | 2 | 3 | 4;
  layout?: 'grid' | 'list';
  cards: CardItem[];
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  label: string;
  labelAr?: string;
  required: boolean;
}

export interface FormBlock extends BaseBlock {
  type: 'contactForm';
  template?: 'contact' | 'newsletter' | 'signup' | 'custom';
  title: string;
  titleAr?: string;
  subtitle: string;
  subtitleAr?: string;
  fields: FormField[];
  formWidth: 'narrow' | 'medium' | 'wide' | 'full';
  sectionPadding: 'small' | 'medium' | 'large';
  backgroundColor: string;
  submitText: string;
  submitTextAr?: string;
  submitBgColor: string;
  submitTextColor: string;
  destination: 'firestore' | 'webhook';
  firestoreCollection?: string;
  successMessage?: string;
  successMessageAr?: string;
  redirectUrl?: string;
  showLabels?: boolean;
  buttonSize?: 'small' | 'medium' | 'large';
  buttonStyle?: 'solid' | 'outline' | 'ghost';
}

export interface FooterColumn {
  id: string;
  title: string;
  titleAr?: string;
  links: { id: string; label: string; labelAr?: string; url: string }[];
}

export interface FooterBlock extends BaseBlock {
  type: 'footer';
  template: 'simple' | 'columns' | 'centered';
  companyName: string;
  companyNameAr?: string;
  copyright: string;
  copyrightAr?: string;
  description: string;
  descriptionAr?: string;
  columns: FooterColumn[];
}

export type CmsBlock = HeroBlock | RichTextBlock | CardsBlock | FormBlock | NewsletterBlock | FooterBlock;

export interface CmsPage {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  status: 'published' | 'draft';
  inMenu: boolean;
  blocks: CmsBlock[];
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface CmsMenuConfig {
  backgroundStyle: 'solid' | 'gradient' | 'transparent' | 'glass';
  backgroundColor: string;
  gradientStart?: string;
  gradientEnd?: string;
  bottomBorder: 'none' | 'line' | 'shadow';
  sticky: boolean;
  textColor: string;
  hoverColor: string;
  logoText: string;
  logoImage?: string;
  logoPosition: 'left' | 'center';
  showSocial: boolean;
  socialLinks: SocialLink[];
  socialPosition: 'left' | 'right';
  showSignIn: boolean;
  signInText: string;
  signInLink: string;
  signInBgColor: string;
  signInTextColor: string;
  signInBorderColor: string;
  signInHoverBgColor: string;
  signInStyle: 'solid' | 'outline' | 'ghost';
}

export interface AppMenuItem {
  id: string;
  name: string;
  link: string;
  icon: string;
}

export interface AppMenuConfig {
  logoImage?: string;
  appName: string;
  fontFamily: string;
  fontSize: string;
  fontColor: string;
  items: AppMenuItem[];
}

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  status: 'active' | 'pending' | 'deactivated';
  createdAt: string;
}

export interface NewsletterResponse {
  id: string;
  email: string;
  timestamp: string;
  sourcePage?: string;
}

export interface ContactResponse {
  id: string;
  formId: string;
  formTitle: string;
  data: Record<string, any>;
  timestamp: string;
  sourcePage?: string;
}

export interface NewsletterSettings {
  enabled: boolean;
  collectResponses: boolean;
  autoResponderEnabled: boolean;
  autoResponderSubject?: string;
  autoResponderBody?: string;
}

export interface AppState {
  users: User[];
  userProfiles?: UserProfile[];
  files: AttendanceFile[];
  nameDictionary: string[];
  correctionHistory: CorrectionEntry[];
  visualReferences: VisualReference[];
  language: 'ar' | 'en';
  darkMode: boolean;
  isDatabaseLoaded: boolean;
  storageMode?: 'local' | 'firebase';
  connectedFileName?: string;
  siteSettings?: SiteSettings;
  cmsPages?: CmsPage[];
  cmsMenu?: CmsMenuConfig;
  appMenu?: AppMenuConfig;
  mediaImages?: {id: string, url: string, name: string}[];
  newsletterResponses?: NewsletterResponse[];
  contactResponses?: ContactResponse[];
  newsletterSettings?: NewsletterSettings;
}
