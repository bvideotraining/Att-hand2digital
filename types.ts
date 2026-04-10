
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

export interface AppState {
  users: User[];
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
}
