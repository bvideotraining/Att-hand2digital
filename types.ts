
export type Role = 'Admin' | 'HR User';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Only stored in the JSON file for local auth
  role: Role;
}

export interface ConfidenceValue<T> {
  value: T;
  confidence: number;
}

export interface AttendanceRecord {
  date: string; // ISO format YYYY-MM-DD
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
  data?: ExtractionResult;
  previewUrl?: string;
}

export interface AppState {
  users: User[];
  files: AttendanceFile[];
  nameDictionary: string[];
  language: 'ar' | 'en';
  darkMode: boolean;
  isDatabaseLoaded: boolean;
}
