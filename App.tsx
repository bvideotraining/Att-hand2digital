
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, AttendanceFile, FileStatus, ExtractionResult, AppState, Role, VisualReference } from './types';
import { TRANSLATIONS } from './constants';
import Layout from './components/Layout';
import AttendanceTable from './components/AttendanceTable';
import HomePage from './components/HomePage';
import WebsiteCMS from './components/WebsiteCMS';
import PublicPage from './components/PublicPage';
import { extractAttendanceData } from './services/geminiService';
import { uploadToFirebaseStorage } from './services/storageService';
import { exportToExcel } from './utils/excelExport';
import { auth, db, googleProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from './firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  FileText, 
  Globe, 
  Moon, 
  Sun, 
  AlertTriangle, 
  FileCheck, 
  Loader2, 
  HardDrive, 
  Plus, 
  CheckCircle, 
  Cloud, 
  LogIn, 
  UserPlus, 
  ArrowLeft, 
  ArrowRight,
  Eye,
  Trash2,
  Save,
  FileSpreadsheet,
  Info,
  Lightbulb,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  LayoutGrid,
  List
} from 'lucide-react';

// --- Error Handling for Firestore ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

// --- Global File Handle Reference (Non-serializable) ---
let globalFileHandle: any = null;
const LOCAL_STORAGE_KEY = 'arabic_attendance_db_backup';

const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, removeUndefined(v)])
    );
  }
  return obj;
};

const DEFAULT_ADMIN: User = { 
  id: 'admin', 
  name: 'System Admin', 
  email: 'admin@system.com', 
  password: 'admin', 
  role: 'Admin' 
};

const INITIAL_STATE: AppState = {
  users: [DEFAULT_ADMIN],
  files: [],
  nameDictionary: [],
  correctionHistory: [],
  visualReferences: [],
  language: 'ar',
  darkMode: false,
  isDatabaseLoaded: false,
  connectedFileName: undefined,
  siteSettings: {
    heroTitleAr: "تحويل كشوف الحضور المكتوبة بخط اليد إلى بيانات رقمية",
    heroTitleEn: "Convert Handwritten Attendance to Digital Data",
    heroSubtitleAr: "استخدم الذكاء الاصطناعي لاستخراج البيانات من كشوف الحضور العربية بدقة عالية",
    heroSubtitleEn: "Use AI to extract data from Arabic attendance sheets with high accuracy",
    ctaTextAr: "ابدأ الآن",
    ctaTextEn: "Get Started",
    features: [
      { id: '1', icon: 'Zap', titleAr: 'سرعة فائقة', titleEn: 'Lightning Fast', descAr: 'معالجة الكشوف في ثوانٍ', descEn: 'Process sheets in seconds' },
      { id: '2', icon: 'ShieldCheck', titleAr: 'دقة عالية', titleEn: 'High Accuracy', descAr: 'تعرف دقيق على الخط العربي', descEn: 'Accurate Arabic handwriting recognition' },
      { id: '3', icon: 'Download', titleAr: 'تصدير سهل', titleEn: 'Easy Export', descAr: 'تصدير البيانات إلى Excel', descEn: 'Export data to Excel' }
    ],
    socialLinks: { facebook: '', twitter: '', linkedin: '', github: '' },
    menuStyle: 'classic'
  },
  cmsPages: [
    {
      id: 'home-page-1',
      title: 'Home',
      slug: '/',
      status: 'published',
      inMenu: true,
      blocks: [
        {
          id: 'hero-1',
          type: 'hero',
          template: 'centered',
          title: 'Complete HR Management System for Modern Organizations',
          subtitle: 'Manage employees, attendance, payroll, leaves, bonuses, insurance, and organizational setup all in one unified platform.',
          buttonText: 'Get Started',
          buttonLink: '/login'
        } as import('./types').HeroBlock,
        {
          id: 'cards-1',
          type: 'cards',
          heading: 'Why Choose HR ERP?',
          columns: 3,
          cards: [
            { id: 'c1', icon: 'Zap', title: 'Automated Payroll', description: 'Salary calculations with deductions, bonuses, and insurance integration.' },
            { id: 'c2', icon: 'ShieldCheck', title: 'Enterprise Security', description: '7-layer security framework with role-based access control.' },
            { id: 'c3', icon: 'Users', title: 'Employee Self-Service', description: 'Empower employees to manage their own data and requests.' }
          ]
        } as import('./types').CardsBlock
      ]
    }
  ],
  cmsMenu: {
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
  },
  appMenu: {
    appName: 'HandAttend AI',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontColor: '#1f2937',
    items: [
      { id: 'dashboard', name: 'Dashboard', link: 'dashboard', icon: 'LayoutDashboard' },
      { id: 'dictionary', name: 'Manage Dictionary', link: 'dictionary', icon: 'BookOpen' },
      { id: 'samples', name: 'Visual Dictionary', link: 'samples', icon: 'ImageIcon' },
      { id: 'users', name: 'User Management', link: 'users', icon: 'Users' },
      { id: 'cms', name: 'CMS', link: 'cms', icon: 'Globe' }
    ]
  }
};

// --- Custom Hooks ---

const useTranslation = (lang: string) => {
  return useMemo(() => {
    // Hard safety fallback to ensure 't' is never undefined
    const safeLang = (lang === 'ar' || lang === 'en') ? lang : 'ar';
    return TRANSLATIONS[safeLang] || TRANSLATIONS.ar;
  }, [lang]);
};

// --- Page Components ---

const VisualDictionaryPage = ({ samples = [], onAdd, onDelete, language, darkMode }: any) => {
  const t = useTranslation(language);
  const [digit, setDigit] = useState('0');
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCapturing(false);
    }
  };

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageBase64 = canvasRef.current.toDataURL('image/jpeg');
        onAdd(digit, imageBase64);
        
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        setIsCapturing(false);
      }
    }
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file && digit) {
      const reader = new FileReader();
      reader.onload = () => { onAdd(digit, reader.result as string); setDigit('0'); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">{t.visualDictionary}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t.visualSubtitle || 'Add visual references for handwritten digits'}</p>
        </div>
      </div>

      <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        {!isCapturing ? (
          <div className="text-center py-12">
            <div className="bg-blue-50 dark:bg-blue-900/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
              <ImageIcon className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold mb-4">{t.addVisualSample}</h3>
            <div className="flex items-center justify-center gap-4 mb-8">
              <label className="font-bold">{t.selectDigit}:</label>
              <select 
                value={digit} 
                onChange={(e) => setDigit(e.target.value)}
                className={`px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                {['0','1','2','3','4','5','6','7','8','9',':','/','-','.'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex justify-center gap-4">
              <button 
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {t.startCamera}
              </button>
              <label className={`cursor-pointer ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} px-8 py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2`}>
                <Upload className="w-5 h-5" />
                {t.uploadImage}
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative rounded-3xl overflow-hidden border-4 border-blue-600 shadow-2xl max-w-md mx-auto aspect-video bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-white/30 pointer-events-none"></div>
            </div>
            <div className="flex justify-center gap-4">
              <button 
                onClick={capture}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-bold transition shadow-xl shadow-green-500/20 flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {t.capture}
              </button>
              <button 
                onClick={() => {
                  if (videoRef.current?.srcObject) {
                    (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
                  }
                  setIsCapturing(false);
                }}
                className={`px-8 py-4 rounded-2xl font-bold transition ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        <div className="mt-12">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">{t.existingSamples} ({samples.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {samples.map((sample: VisualReference) => (
              <div key={sample.id} className={`group relative rounded-2xl border overflow-hidden transition-all hover:shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <img src={sample.imageBase64} className="w-full h-24 object-cover" alt={`Digit ${sample.digit}`} />
                <div className="absolute top-1 left-1 bg-blue-600 text-white w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shadow-md">
                  {sample.digit}
                </div>
                <button 
                  onClick={() => onDelete(sample.id)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition shadow-md"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagementPage = ({ users = [], onAdd, onUpdate, onDelete, language, darkMode }: any) => {
  const t = useTranslation(language);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({ name: '', email: '', role: 'HR User' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdate({ ...editingUser, ...formData });
      setEditingUser(null);
    } else {
      onAdd({ ...formData, id: Math.random().toString(36).substr(2, 9) });
      setIsAdding(false);
    }
    setFormData({ name: '', email: '', role: 'HR User' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">{t.userManagement}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t.usersSubtitle || 'Manage system users and their permissions'}</p>
        </div>
        {!isAdding && !editingUser && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            {t.addUser}
          </button>
        )}
      </div>

      {(isAdding || editingUser) && (
        <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-xl animate-in slide-in-from-top-4 duration-300`}>
          <h3 className="text-xl font-bold mb-6">{editingUser ? t.editUser : t.addUser}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t.name}</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t.email}</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t.role}</label>
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value as Role})} 
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                >
                  <option value="Admin">{t.admin}</option>
                  <option value="HR User">{t.hrUser}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => { setIsAdding(false); setEditingUser(null); }}
                className={`px-6 py-3 rounded-xl font-bold transition ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                {t.cancel}
              </button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-500/20">
                {editingUser ? t.update : t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'} shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t.name}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t.email}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t.role}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {users.map((u: User) => (
                <tr key={u.id} className={`transition-colors ${darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4 font-bold">{u.name}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      {t[u.role === 'Admin' ? 'admin' : 'hrUser']}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setEditingUser(u); setFormData(u); }}
                        className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-gray-800 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(u.id)}
                        className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = ({ files = [], onUpload, onDelete, language, darkMode, onFileSelect, storageMode, onImportToCloud, onSyncToCloud, isSyncing, syncStatus }: any) => {
  const t = useTranslation(language);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const years = Array.from({ length: 11 }, (_, i) => 2024 + i);
  const handleFileChange = (e: any) => { 
    if (e.target.files?.[0]) {
      onUpload(e.target.files[0], selectedYear, startDate, endDate); 
    }
  };
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">{t.dashboard}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center p-1 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition ${viewMode === 'grid' ? (darkMode ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600') : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition ${viewMode === 'list' ? (darkMode ? 'bg-gray-800 text-blue-400' : 'bg-blue-50 text-blue-600') : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          {storageMode === 'firebase' && (
            <>
              <button 
                onClick={onSyncToCloud}
                disabled={isSyncing}
                className={`${isSyncing ? 'bg-gray-100 text-gray-400' : 'bg-green-100 hover:bg-green-200 text-green-700'} px-3 py-1.5 rounded-lg font-bold transition shadow-sm inline-flex items-center gap-2 text-[12px]`}
                title="Sync current local data to cloud"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span>{isSyncing ? 'Syncing...' : 'Sync to Cloud'}</span>
              </button>
              {syncStatus === 'synced' && (
                <span className="text-green-600 text-xs font-bold animate-in fade-in">Synced successfully!</span>
              )}
              {syncStatus === 'error' && (
                <span className="text-red-600 text-xs font-bold animate-in fade-in">Sync failed!</span>
              )}
              <button 
                onClick={onImportToCloud}
                className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-lg font-bold transition shadow-sm inline-flex items-center gap-2 text-[12px]"
                title={t.importToCloudHelp}
              >
                <Cloud className="w-4 h-4" />
                <span>{t.importToCloud}</span>
              </button>
            </>
          )}
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold transition shadow-lg shadow-blue-500/20 inline-flex items-center gap-2 text-[12px]">
            <Upload className="w-4 h-4" />
            {t.upload}
            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
          </label>
        </div>
      </div>
      <div className={`p-4 rounded-2xl flex flex-wrap items-center gap-4 border ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.selectYear}</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className={`px-3 py-1.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none`}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.startDate} ({t.optional})</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`px-3 py-1.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} text-sm focus:ring-2 focus:ring-blue-500 outline-none`} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.endDate} ({t.optional})</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`px-3 py-1.5 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} text-sm focus:ring-2 focus:ring-blue-500 outline-none`} />
        </div>
      </div>
      <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm ${darkMode ? 'bg-blue-900/20 border-blue-800/30 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
        <Lightbulb className="w-5 h-5 text-blue-500" />
        <p>{t.dateRangeHelp}</p>
      </div>

      {(!files || files.length === 0) ? (
        <div className={`p-16 text-center rounded-3xl border-2 border-dashed ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="bg-gray-100 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">{t.noFiles}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">{t.noFilesMsg}</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
          {files.map((file: any) => (
            <div 
              key={file.id} 
              className={`group rounded-3xl border transition-all duration-300 hover:shadow-xl ${darkMode ? 'bg-gray-900 border-gray-800 hover:border-blue-500/50' : 'bg-white border-gray-100 hover:border-blue-200'} ${viewMode === 'list' ? 'flex items-center justify-between p-4' : ''}`}
            >
              {viewMode === 'grid' ? (
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-blue-50'} text-blue-600`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => onDelete(file.id)}
                      className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg truncate mb-1" title={file.name}>{file.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-blue-600 font-bold text-sm">{file.year}</span>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <span className="text-xs text-gray-500">{new Date(file.upload_date).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center gap-2">
                    {file.status === FileStatus.Completed ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" /> {t.completed}
                      </span>
                    ) : file.status === FileStatus.Processing ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full">
                        <Loader2 className="animate-spin w-3 h-3" /> {t.processing}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> {t.failed}
                      </span>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => onFileSelect(file)}
                    className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                  >
                    <Eye className="w-4 h-4" />
                    {t.view}
                  </button>
                </div>
              </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-blue-50'} text-blue-600 shrink-0`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate" title={file.name}>{file.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-blue-600 font-bold text-sm">{file.year}</span>
                        <span className="text-gray-300 dark:text-gray-700">•</span>
                        <span className="text-xs text-gray-500">{new Date(file.upload_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:flex items-center gap-2">
                      {file.status === FileStatus.Completed ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3" /> {t.completed}
                        </span>
                      ) : file.status === FileStatus.Processing ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-full">
                          <Loader2 className="animate-spin w-3 h-3" /> {t.processing}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> {t.failed}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onFileSelect(file)}
                        className={`p-2 rounded-xl transition ${darkMode ? 'bg-gray-800 hover:bg-blue-900/50 text-blue-400' : 'bg-gray-50 hover:bg-blue-50 text-blue-600'}`}
                        title={t.view}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => onDelete(file.id)}
                        className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...INITIAL_STATE, ...parsed };
      }
    } catch (e) {
      console.warn("Could not restore local state", e);
    }
    return INITIAL_STATE;
  });
  const t = useTranslation(state.language);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'review' | 'dictionary' | 'users' | 'samples' | 'cms'>('dashboard');
  const [showLanding, setShowLanding] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'error' | 'syncing' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const legacyFileInputRef = useRef<HTMLInputElement>(null);
  const isRemoteUpdate = useRef(false);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email || '',
          role: 'Admin' // Default role for workspace owner
        });
        // Prevent overwriting Firebase data with local state on initial load
        isRemoteUpdate.current = true; 
        setState(p => ({ ...p, storageMode: 'firebase', isDatabaseLoaded: true }));
        // Allow enough time for onSnapshot to fetch the real cloud data
        setTimeout(() => { isRemoteUpdate.current = false; }, 2000);
      } else {
        setCurrentUser(null);
        // Reset to initial state but keep firebase mode to trigger public fetch if needed
        // Actually, we want to keep the storageMode as firebase if it was already set
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Public Data Listener (for unauthenticated users)
  useEffect(() => {
    if (isAuthReady && !currentUser) {
      const unsubPublic = onSnapshot(doc(db, 'public', 'config'), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          let pages = data.cmsPages;
          if (pages && !Array.isArray(pages) && typeof pages === 'object') {
            const keys = Object.keys(pages).filter(k => !isNaN(Number(k))).sort((a, b) => Number(a) - Number(b));
            if (keys.length > 0) {
              pages = keys.map(k => (pages as any)[k]);
            }
          }
          
          setState(p => ({
            ...p,
            cmsPages: pages || p.cmsPages,
            cmsMenu: data.cmsMenu || p.cmsMenu,
            appMenu: data.appMenu || p.appMenu,
            siteSettings: data.siteSettings || p.siteSettings,
            isDatabaseLoaded: true,
            storageMode: 'firebase'
          }));
        }
      }, (err) => console.warn("Public config fetch failed", err));
      return () => unsubPublic();
    }
  }, [isAuthReady, currentUser]);

  // Firebase Data Sync & Migration
  useEffect(() => {
    if (state.storageMode === 'firebase' && currentUser && isAuthReady) {
      const uid = currentUser.id;
      let unsubFiles: any, unsubUsers: any, unsubDict: any, unsubVisual: any, unsubHistory: any;
      let unsubPages: any, unsubMenu: any, unsubAppMenu: any, unsubSite: any, unsubMedia: any;

      // Test connection to Firestore
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'users', uid));
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration. The client is offline.");
          }
        }
      };
      testConnection();

      const setupListeners = () => {
        unsubFiles = onSnapshot(collection(db, `users/${uid}/files`), (snap) => {
          if (snap.empty && isRemoteUpdate.current) return;
          setState(p => ({ ...p, files: snap.docs.map(d => d.data() as any) }));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/files`));

        unsubUsers = onSnapshot(collection(db, `users/${uid}/workspace_users`), (snap) => {
          if (snap.empty && isRemoteUpdate.current) return;
          setState(p => ({ ...p, users: snap.docs.map(d => d.data() as any) }));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/workspace_users`));

        unsubDict = onSnapshot(collection(db, `users/${uid}/nameDictionary`), (snap) => {
          if (snap.empty && isRemoteUpdate.current) return;
          setState(p => ({ ...p, nameDictionary: snap.docs.map(d => d.data().name) }));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/nameDictionary`));

        unsubVisual = onSnapshot(collection(db, `users/${uid}/visualReferences`), (snap) => {
          if (snap.empty && isRemoteUpdate.current) return;
          setState(p => ({ ...p, visualReferences: snap.docs.map(d => d.data() as any) }));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/visualReferences`));

        unsubHistory = onSnapshot(collection(db, `users/${uid}/correctionHistory`), (snap) => {
          if (snap.empty && isRemoteUpdate.current) return;
          setState(p => ({ ...p, correctionHistory: snap.docs.map(d => d.data() as any) }));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/correctionHistory`));

        // Add listeners for CMS and Settings
        unsubPages = onSnapshot(doc(db, `users/${uid}/cms`, 'pages'), (doc) => {
          if (!doc.exists() && isRemoteUpdate.current) return;
          if (doc.exists()) {
            const data = doc.data();
            let pages = [];
            if (Array.isArray(data.data)) {
              pages = data.data;
            } else {
              // Backward compatibility for numeric keys object
              const keys = Object.keys(data).filter(k => !isNaN(Number(k))).sort((a, b) => Number(a) - Number(b));
              if (keys.length > 0) {
                pages = keys.map(k => data[k]);
              }
            }
            setState(p => ({ ...p, cmsPages: pages }));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/cms/pages`));

        unsubMenu = onSnapshot(doc(db, `users/${uid}/cms`, 'menu'), (doc) => {
          if (!doc.exists() && isRemoteUpdate.current) return;
          if (doc.exists()) {
            setState(p => ({ ...p, cmsMenu: doc.data() as any }));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/cms/menu`));

        unsubAppMenu = onSnapshot(doc(db, `users/${uid}/cms`, 'appMenu'), (doc) => {
          if (!doc.exists() && isRemoteUpdate.current) return;
          if (doc.exists()) {
            setState(p => ({ ...p, appMenu: doc.data() as any }));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/cms/appMenu`));

        unsubSite = onSnapshot(doc(db, `users/${uid}/settings`, 'site'), (doc) => {
          if (!doc.exists() && isRemoteUpdate.current) return;
          if (doc.exists()) {
            setState(p => ({ ...p, siteSettings: doc.data() as any }));
          }
        }, (err) => handleFirestoreError(err, OperationType.GET, `users/${uid}/settings/site`));

        unsubMedia = onSnapshot(collection(db, `users/${uid}/mediaImages`), (snap) => {
          if (snap.empty && isRemoteUpdate.current) return;
          setState(p => ({ ...p, mediaImages: snap.docs.map(d => d.data() as any) }));
        }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${uid}/mediaImages`));

        setState(p => ({ ...p, isDatabaseLoaded: true, storageMode: 'firebase' }));
      };

      const migrateData = async () => {
        const oldDocRef = doc(db, `app_data/${uid}`);
        try {
          const oldDocSnap = await getDoc(oldDocRef);
          if (oldDocSnap.exists()) {
            const data = oldDocSnap.data();
            
            const users = typeof data.users === 'string' ? JSON.parse(data.users) : (data.users || []);
            for (const u of users) await setDoc(doc(db, `users/${uid}/workspace_users`, u.id), removeUndefined(u));
            
            const files = typeof data.files === 'string' ? JSON.parse(data.files) : (data.files || []);
            for (const f of files) await setDoc(doc(db, `users/${uid}/files`, f.id), removeUndefined(f));
            
            const dict = typeof data.nameDictionary === 'string' ? JSON.parse(data.nameDictionary) : (data.nameDictionary || []);
            for (const n of dict) await setDoc(doc(db, `users/${uid}/nameDictionary`, encodeURIComponent(n)), { name: n });
            
            const refs = typeof data.visualReferences === 'string' ? JSON.parse(data.visualReferences) : (data.visualReferences || []);
            for (const r of refs) await setDoc(doc(db, `users/${uid}/visualReferences`, r.id), removeUndefined(r));
            
            const history = typeof data.correctionHistory === 'string' ? JSON.parse(data.correctionHistory) : (data.correctionHistory || []);
            for (const h of history) await setDoc(doc(db, `users/${uid}/correctionHistory`, h.id || Math.random().toString(36).substr(2, 9)), removeUndefined(h));
            
            await deleteDoc(oldDocRef);
          }
        } catch (e) {
          console.error("Migration error", e);
        }
        setupListeners();
      };

      migrateData();

      return () => {
        if (unsubFiles) unsubFiles();
        if (unsubUsers) unsubUsers();
        if (unsubDict) unsubDict();
        if (unsubVisual) unsubVisual();
        if (unsubHistory) unsubHistory();
        if (unsubPages) unsubPages();
        if (unsubMenu) unsubMenu();
        if (unsubAppMenu) unsubAppMenu();
        if (unsubSite) unsubSite();
        if (unsubMedia) unsubMedia();
      };
    }
  }, [state.storageMode, currentUser, isAuthReady]);

  // Persistence management - Safe Quota Guard
  useEffect(() => {
    if (state.isDatabaseLoaded) {
      if (state.storageMode === 'local') {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.warn("Local storage quota exceeded. State not cached.");
        }
        
        if (globalFileHandle) {
          saveToSystemFile(state);
        }
      }
    }
  }, [state, currentUser]);

  const updateStateAndFirestore = async (
    collectionName: string, 
    docId: string, 
    data: any, 
    isDelete: boolean = false,
    localStateUpdater: (prev: AppState) => AppState,
    skipFirestore: boolean = false
  ) => {
    // Optimistically update local state first
    setState(localStateUpdater);

    if (!skipFirestore && state.storageMode === 'firebase' && currentUser) {
      const docRef = doc(db, `users/${currentUser.id}/${collectionName}`, docId);
      try {
        if (isDelete) {
          await deleteDoc(docRef);
        } else {
          let cleanData = Array.isArray(data) ? { data } : { ...data };
          if (collectionName === 'files' && cleanData.previewUrl && cleanData.previewUrl.startsWith('data:')) {
            delete cleanData.previewUrl;
          }
          await setDoc(docRef, removeUndefined(cleanData), { merge: true });

          // Sync to public config if admin (bvideotraining@gmail.com)
          if (currentUser.email === 'bvideotraining@gmail.com' && ['cms', 'settings'].includes(collectionName)) {
            const publicRef = doc(db, 'public', 'config');
            const update: any = {};
            if (collectionName === 'cms') {
              if (docId === 'pages') update.cmsPages = Array.isArray(data) ? data : (data.data || []);
              if (docId === 'menu') update.cmsMenu = data;
              if (docId === 'appMenu') update.appMenu = data;
            } else if (collectionName === 'settings' && docId === 'site') {
              update.siteSettings = data;
            }
            if (Object.keys(update).length > 0) {
              await setDoc(publicRef, removeUndefined(update), { merge: true });
            }
          }
        }
      } catch (err) {
        handleFirestoreError(err, isDelete ? OperationType.DELETE : OperationType.WRITE, docRef.path);
        // If it fails, we might want to revert, but for now we rely on onSnapshot to correct it
      }
    }
  };

  const saveToSystemFile = async (data: any) => {
    if (!globalFileHandle) return;
    try {
      const writable = await globalFileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus(null), 2000);
    } catch (err) {
      console.error("Direct sync failed", err);
    }
  };

  const triggerManualSync = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = state.connectedFileName || 'attendance_db.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert((TRANSLATIONS[state.language] || TRANSLATIONS.ar).syncManual);
  };

  const applyImportedData = async (imported: any, fileName: string, forceFirebase: boolean = false) => {
    // SECURITY: Ensure we only import DATA, not system settings that could break the UI
    if (!imported || typeof imported !== 'object') {
      alert("Invalid file format.");
      return;
    }
    
    const nextUsers = Array.isArray(imported.users) ? imported.users : state.users;
    const nextFiles = Array.isArray(imported.files) ? imported.files : [];
    const nextDict = Array.isArray(imported.nameDictionary) ? imported.nameDictionary : [];
    const nextHistory = Array.isArray(imported.correctionHistory) ? imported.correctionHistory : [];
    const nextVisual = Array.isArray(imported.visualReferences) ? imported.visualReferences : [];

    const isFirebase = forceFirebase || state.storageMode === 'firebase';

    if (isFirebase && currentUser) {
      const uid = currentUser.id;
      try {
        for (const u of nextUsers) await setDoc(doc(db, `users/${uid}/workspace_users`, u.id), removeUndefined(u));
        for (const f of nextFiles) {
          let cleanF = { ...f };
          if (cleanF.previewUrl && cleanF.previewUrl.startsWith('data:')) {
            delete cleanF.previewUrl;
          }
          await setDoc(doc(db, `users/${uid}/files`, f.id), removeUndefined(cleanF));
        }
        for (const n of nextDict) await setDoc(doc(db, `users/${uid}/nameDictionary`, encodeURIComponent(n)), { name: n });
        for (const r of nextVisual) await setDoc(doc(db, `users/${uid}/visualReferences`, r.id), removeUndefined(r));
        for (const h of nextHistory) await setDoc(doc(db, `users/${uid}/correctionHistory`, h.id || Math.random().toString(36).substr(2, 9)), removeUndefined(h));
      } catch (e) {
        console.error("Import error", e);
      }
    }

    setState(current => {
      const nextState: AppState = { 
        ...current, 
        users: nextUsers,
        files: nextFiles,
        nameDictionary: nextDict,
        correctionHistory: nextHistory,
        visualReferences: nextVisual,
        isDatabaseLoaded: true, 
        storageMode: isFirebase ? 'firebase' : current.storageMode,
        connectedFileName: forceFirebase ? current.connectedFileName : fileName 
      };

      // Safety check: ensure admin user exists
      const hasAdmin = nextState.users.some((u: User) => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase());
      if (!hasAdmin) nextState.users = [DEFAULT_ADMIN, ...nextState.users];
      
      return nextState;
    });
  };

  const handleImportToCloud = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const imported = JSON.parse(content);
            applyImportedData(imported, file.name, true);
            console.log("Data successfully imported to Firebase Cloud!");
          } catch (err) {
            console.error("Could not read file. Ensure it is a valid .json file.");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleSyncCurrentToCloud = async () => {
    if (!currentUser || state.storageMode !== 'firebase') {
      console.error("Please ensure you are logged in with Google to sync to the cloud.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    const uid = currentUser.id;
    
    try {
      console.log("Starting cloud sync for user:", uid);
      
      // 1. Sync Users
      console.log(`Syncing ${state.users.length} users...`);
      for (const u of state.users) {
        await setDoc(doc(db, `users/${uid}/workspace_users`, u.id), removeUndefined(u));
      }
      
      // 2. Sync Files (Upload images if they are base64)
      console.log(`Syncing ${state.files.length} files...`);
      for (const f of state.files) {
        let cleanF = { ...f };
        if (cleanF.previewUrl && cleanF.previewUrl.startsWith('data:')) {
          try {
            const response = await fetch(cleanF.previewUrl);
            const blob = await response.blob();
            const file = new File([blob], f.name, { type: blob.type });
            const fileUrl = await uploadToFirebaseStorage(file, `users/${uid}/files/${f.id}_${f.name}`);
            cleanF.previewUrl = fileUrl;
          } catch (e) {
            console.error("Failed to upload image to storage during sync", e);
            delete cleanF.previewUrl;
          }
        }
        await setDoc(doc(db, `users/${uid}/files`, f.id), removeUndefined(cleanF));
      }
      
      // 3. Sync Dictionary
      console.log(`Syncing ${state.nameDictionary.length} dictionary entries...`);
      for (const n of state.nameDictionary) {
        await setDoc(doc(db, `users/${uid}/nameDictionary`, encodeURIComponent(n)), { name: n });
      }
      
      // 4. Sync Visual References
      console.log(`Syncing ${state.visualReferences.length} visual references...`);
      for (const r of state.visualReferences) {
        await setDoc(doc(db, `users/${uid}/visualReferences`, r.id), removeUndefined(r));
      }
      
      // 5. Sync Correction History
      console.log(`Syncing ${state.correctionHistory.length} correction history items...`);
      for (const h of state.correctionHistory) {
        await setDoc(doc(db, `users/${uid}/correctionHistory`, h.id || Math.random().toString(36).substr(2, 9)), removeUndefined(h));
      }
      
      // 6. Sync CMS and Settings
      console.log("Syncing CMS and settings...");
      if (state.cmsPages) await setDoc(doc(db, `users/${uid}/cms`, 'pages'), removeUndefined({ data: state.cmsPages }));
      if (state.cmsMenu) await setDoc(doc(db, `users/${uid}/cms`, 'menu'), removeUndefined(state.cmsMenu));
      if (state.appMenu) await setDoc(doc(db, `users/${uid}/cms`, 'appMenu'), removeUndefined(state.appMenu));
      if (state.siteSettings) await setDoc(doc(db, `users/${uid}/settings`, 'site'), removeUndefined(state.siteSettings));

      console.log("Sync completed successfully.");
      setIsSyncing(false);
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus(null), 3000);
    } catch (e) {
      console.error("Sync error:", e);
      setIsSyncing(false);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleConnectFile = async () => {
    const isRestricted = window.self !== window.top;
    
    if (!isRestricted && 'showOpenFilePicker' in window) {
      try {
        setIsConnecting(true);
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{ description: 'JSON Database', accept: { 'application/json': ['.json'] } }],
          multiple: false
        });
        const file = await handle.getFile();
        const content = await file.text();
        const imported = JSON.parse(content);
        globalFileHandle = handle;
        applyImportedData(imported, file.name);
        setIsConnecting(false);
        return;
      } catch (err: any) {
        setIsConnecting(false);
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback for restricted environments
    legacyFileInputRef.current?.click();
  };

  const handleLegacyFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const imported = JSON.parse(content);
          globalFileHandle = null;
          applyImportedData(imported, file.name);
          e.target.value = ''; // Reset input
        } catch (err) {
          alert("Could not read file. Ensure it is a valid .json file.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCreateNewFile = async () => {
    const isRestricted = window.self !== window.top;
    
    if (!isRestricted && 'showSaveFilePicker' in window) {
      try {
        setIsConnecting(true);
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: 'attendance_db.json',
          types: [{ description: 'JSON Database', accept: { 'application/json': ['.json'] } }]
        });
        globalFileHandle = handle;
        const newState: AppState = { ...INITIAL_STATE, isDatabaseLoaded: true, connectedFileName: 'attendance_db.json', storageMode: 'local' };
        
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(newState, null, 2));
        await writable.close();
        
        setState(newState);
        setIsConnecting(false);
        return;
      } catch (err: any) {
        setIsConnecting(false);
        if (err.name === 'AbortError') return;
      }
    }

    globalFileHandle = null;
    setState({ ...INITIAL_STATE, isDatabaseLoaded: true, connectedFileName: 'attendance_db.json', storageMode: 'local' });
    alert((TRANSLATIONS[state.language] || TRANSLATIONS.ar).browserRestricted);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsConnecting(true);
      await signInWithPopup(auth, googleProvider);
      setState(p => ({ ...p, storageMode: 'firebase', isDatabaseLoaded: true }));
      setIsConnecting(false);
    } catch (err: any) {
      console.error("Google login failed", err);
      setIsConnecting(false);
      alert("Google login failed: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout error", e);
    }
    setCurrentUser(null);
    setState(p => ({ ...p, storageMode: 'local' }));
  };

  const handleFirebaseEmailLogin = async (email: string, pass: string) => {
    try {
      setIsConnecting(true);
      const creds = await signInWithEmailAndPassword(auth, email, pass);
      isRemoteUpdate.current = true;
      setState(p => ({ ...p, storageMode: 'firebase', isDatabaseLoaded: true }));
      setTimeout(() => { isRemoteUpdate.current = false; }, 2000);
      setIsConnecting(false);
    } catch (err: any) {
      console.error("Firebase login failed", err);
      setIsConnecting(false);
      alert("Login failed: " + err.message);
    }
  };

  const handleFirebaseEmailSignUp = async (email: string, pass: string) => {
    try {
      setIsConnecting(true);
      const creds = await createUserWithEmailAndPassword(auth, email, pass);
      isRemoteUpdate.current = true;
      setState(p => ({ ...p, storageMode: 'firebase', isDatabaseLoaded: true }));
      setTimeout(() => { isRemoteUpdate.current = false; }, 2000);
      setIsConnecting(false);
    } catch (err: any) {
      console.error("Firebase sign up failed", err);
      setIsConnecting(false);
      alert("Sign up failed: " + err.message);
    }
  };

  const handleFormLogin = (creds: any) => {
    if (!creds.email || !creds.password) return;
    
    const user = state.users.find(u => 
      u.email.toLowerCase() === creds.email.trim().toLowerCase() && 
      u.password === creds.password
    );

    if (user) { 
      setCurrentUser(user); 
      setLoginError(false); 
      setState(p => ({ ...p, storageMode: 'local' }));
    } else { 
      setLoginError(true); 
    }
  };

  const handleDeleteFile = (id: string) => {
    updateStateAndFirestore('files', id, null, true, current => {
      const updatedFiles = current.files.filter(f => f.id !== id);
      return { ...current, files: updatedFiles };
    });
  };

  const handleUpdateFileData = (id: string, data: ExtractionResult) => {
    const file = state.files.find(f => f.id === id);
    if (!file || !file.data) return;

    // Detect changes for "AI Learning"
    const newNames: string[] = [];
    const newCorrections: any[] = [];

    data.employees.forEach((emp, idx) => {
      const oldEmp = file.data!.employees[idx];
      if (oldEmp && emp.employee_name.value !== oldEmp.employee_name.value) {
        newNames.push(emp.employee_name.value);
        newCorrections.push({
          id: Math.random().toString(36).substr(2, 9),
          original: oldEmp.employee_name.value,
          corrected: emp.employee_name.value,
          type: 'name'
        });
      }

      emp.records.forEach((rec, rIdx) => {
        const oldRec = oldEmp?.records[rIdx];
        if (oldRec) {
          if (rec.check_in.value !== oldRec.check_in.value && rec.check_in.value) {
            newCorrections.push({
              id: Math.random().toString(36).substr(2, 9),
              original: oldRec.check_in.value,
              corrected: rec.check_in.value,
              type: 'time'
            });
          }
          if (rec.check_out.value !== oldRec.check_out.value && rec.check_out.value) {
            newCorrections.push({
              id: Math.random().toString(36).substr(2, 9),
              original: oldRec.check_out.value,
              corrected: rec.check_out.value,
              type: 'time'
            });
          }
        }
      });
    });

    const updatedFile = { ...file, data };
    
    if (state.storageMode === 'firebase' && currentUser) {
      updateStateAndFirestore('files', id, updatedFile, false, p => ({
        ...p, files: p.files.map(f => f.id === id ? updatedFile : f)
      }));
      
      newNames.forEach(n => {
        if (!state.nameDictionary.includes(n)) {
          updateStateAndFirestore('nameDictionary', encodeURIComponent(n), { name: n }, false, p => ({
            ...p, nameDictionary: [...new Set([...p.nameDictionary, n])]
          }));
        }
      });
      
      newCorrections.forEach(c => {
        updateStateAndFirestore('correctionHistory', c.id, c, false, p => ({
          ...p, correctionHistory: [...p.correctionHistory, c].slice(-50)
        }));
      });
    } else {
      setState(p => ({
        ...p,
        files: p.files.map(f => f.id === id ? updatedFile : f),
        nameDictionary: [...new Set([...p.nameDictionary, ...newNames])],
        correctionHistory: [...p.correctionHistory, ...newCorrections].slice(-50)
      }));
    }
  };

  const handleUpload = async (file: File, year: number, startDate?: string, endDate?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    let fileUrl = '';
    let base64 = '';

    // We still need base64 for Gemini processing if we don't want to change the service
    const getBase64 = (file: File): Promise<string> => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    base64 = await getBase64(file);

    if (state.storageMode === 'firebase' && currentUser) {
      try {
        fileUrl = await uploadToFirebaseStorage(file, `users/${currentUser.id}/files/${id}_${file.name}`);
      } catch (e) {
        console.error("Storage upload error", e);
        // Fallback to base64 if storage fails
        fileUrl = base64;
      }
    } else {
      fileUrl = base64;
    }

    const newFile: AttendanceFile = {
      id,
      name: file.name,
      uploaded_by: currentUser?.name || 'User',
      upload_date: new Date().toISOString(),
      status: FileStatus.Processing,
      year,
      previewUrl: fileUrl
    };
    if (startDate) newFile.startDate = startDate;
    if (endDate) newFile.endDate = endDate;

    updateStateAndFirestore('files', newFile.id, newFile, false, p => ({ ...p, files: [newFile, ...p.files] }));
    processFile(newFile.id, base64, year, file.type, startDate, endDate);
  };

  const processFile = async (id: string, base64: string, year: number, mime: string, startDate?: string, endDate?: string) => {
    try {
      const res = await extractAttendanceData(
        base64, 
        year, 
        mime, 
        state.nameDictionary, 
        state.visualReferences,
        startDate,
        endDate,
        state.correctionHistory,
        state.siteSettings?.geminiApiKey
      );
      
      // Update status to completed and save data
      updateStateAndFirestore('files', id, { status: FileStatus.Completed, data: res }, false, p => ({
        ...p, files: p.files.map(f => f.id === id ? { ...f, status: FileStatus.Completed, data: res } : f)
      }));
    } catch (e) {
      console.error("Extraction failed", e);
      updateStateAndFirestore('files', id, { status: FileStatus.Failed }, false, p => ({
        ...p, files: p.files.map(f => f.id === id ? { ...f, status: FileStatus.Failed } : f)
      }));
    }
  };

  const selectedFile = state.files.find(f => f.id === selectedFileId);

  const handleAddName = (n: string) => {
    updateStateAndFirestore('nameDictionary', encodeURIComponent(n), { name: n }, false, p => ({...p, nameDictionary: [...new Set([...p.nameDictionary, n])]}));
  };
  const handleDeleteName = (n: string) => {
    updateStateAndFirestore('nameDictionary', encodeURIComponent(n), null, true, p => ({...p, nameDictionary: p.nameDictionary.filter(x => x !== n)}));
  };

  const handleAddSample = (d: string, i: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    updateStateAndFirestore('visualReferences', id, {id, digit: d, imageBase64: i}, false, p => ({...p, visualReferences: [...p.visualReferences, {id, digit: d, imageBase64: i}]}));
  };
  const handleDeleteSample = (id: string) => {
    updateStateAndFirestore('visualReferences', id, null, true, p => ({...p, visualReferences: p.visualReferences.filter(r => r.id !== id)}));
  };

  const handleAddUser = (u: User) => {
    updateStateAndFirestore('workspace_users', u.id, u, false, p => ({...p, users: [...p.users, u]}));
  };
  const handleUpdateUser = (u: User) => {
    updateStateAndFirestore('workspace_users', u.id, u, false, p => ({...p, users: p.users.map(x => x.id === u.id ? u : x)}));
  };
  const handleDeleteUser = (id: string) => {
    updateStateAndFirestore('workspace_users', id, null, true, p => ({...p, users: p.users.filter(u => u.id !== id)}));
  };

  return (
    <HashRouter>
      <div dir={state.language === 'ar' ? 'rtl' : 'ltr'} className={`${state.language === 'ar' ? 'rtl-layout' : 'ltr-layout'} ${state.darkMode ? 'dark' : ''}`}>
        <input ref={legacyFileInputRef} type="file" className="hidden" accept=".json" onChange={handleLegacyFileSelect} />
        
        {!isAuthReady ? (
          <div className={`min-h-screen flex items-center justify-center ${state.darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
            <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
          </div>
        ) : !currentUser ? (
          showLanding ? (
            state.cmsPages && state.cmsPages.length > 0 && state.cmsMenu ? (
              <PublicPage 
                page={state.cmsPages.find(p => p.slug === window.location.hash.replace('#', '') || (window.location.hash === '' && p.slug === '/')) || state.cmsPages[0]} 
                pages={state.cmsPages}
                menuConfig={state.cmsMenu}
                darkMode={state.darkMode}
                onThemeToggle={() => setState(p => ({...p, darkMode: !p.darkMode}))}
                onSignIn={() => setShowLanding(false)}
              />
            ) : (
              <HomePage 
                t={t} 
                language={state.language} 
                darkMode={state.darkMode} 
                siteSettings={state.siteSettings}
                appMenuConfig={state.appMenu}
                cmsMenuConfig={state.cmsMenu}
                onGetStarted={() => setShowLanding(false)} 
                onSignIn={() => setShowLanding(false)}
                onLanguageToggle={() => setState(p => ({...p, language: p.language === 'ar' ? 'en' : 'ar'}))}
                onThemeToggle={() => setState(p => ({...p, darkMode: !p.darkMode}))}
              />
            )
          ) : (
            <LoginPage 
              onLogin={handleFormLogin} 
              onGoogleLogin={handleGoogleLogin}
              onFirebaseLogin={handleFirebaseEmailLogin}
              onFirebaseSignUp={handleFirebaseEmailSignUp}
              language={state.language} 
              darkMode={state.darkMode}
              appMenuConfig={state.appMenu}
              cmsMenuConfig={state.cmsMenu}
              onLanguageToggle={() => setState(p => ({...p, language: p.language === 'ar' ? 'en' : 'ar'}))}
              onThemeToggle={() => setState(p => ({...p, darkMode: !p.darkMode}))}
              isDatabaseLoaded={state.isDatabaseLoaded} 
              fileName={state.connectedFileName} 
              onConnect={handleConnectFile} 
              onCreate={handleCreateNewFile} 
              error={loginError} 
              onCloseError={() => setLoginError(false)} 
              isConnecting={isConnecting}
              onBackToHome={() => setShowLanding(true)}
            />
          )
        ) : (
          <Layout 
            user={currentUser} 
            language={state.language} 
            darkMode={state.darkMode} 
            siteSettings={state.siteSettings}
            appMenuConfig={state.appMenu}
            onLogout={handleLogout} 
            onLanguageToggle={() => setState(p => ({...p, language: p.language === 'ar' ? 'en' : 'ar'}))} 
            onThemeToggle={() => setState(p => ({...p, darkMode: !p.darkMode}))} 
            onSaveDatabase={state.storageMode === 'firebase' ? () => {
              setSyncStatus('synced');
              setTimeout(() => setSyncStatus(null), 2000);
            } : (globalFileHandle ? () => saveToSystemFile(state) : triggerManualSync)} 
            onNavigate={setCurrentView} 
            currentView={currentView} 
            syncStatus={syncStatus}
          >
            {currentView === 'dashboard' ? <DashboardPage files={state.files} onUpload={handleUpload} onDelete={handleDeleteFile} language={state.language} darkMode={state.darkMode} onFileSelect={(f: any) => { setSelectedFileId(f.id); setCurrentView('review'); }} storageMode={state.storageMode} onImportToCloud={handleImportToCloud} onSyncToCloud={handleSyncCurrentToCloud} isSyncing={isSyncing} syncStatus={syncStatus} /> : 
             currentView === 'dictionary' ? <DictionaryPage names={state.nameDictionary} onAdd={handleAddName} onDelete={handleDeleteName} language={state.language} darkMode={state.darkMode} /> : 
             currentView === 'samples' ? <VisualDictionaryPage samples={state.visualReferences} onAdd={handleAddSample} onDelete={handleDeleteSample} language={state.language} darkMode={state.darkMode} /> : 
                           currentView === 'cms' ? <WebsiteCMS 
                pages={state.cmsPages || []} 
                menuConfig={state.cmsMenu!} 
                appMenuConfig={state.appMenu!} 
                siteSettings={state.siteSettings!} 
                mediaImages={state.mediaImages || []} 
                onSavePages={(pages) => updateStateAndFirestore('cms', 'pages', pages, false, p => ({...p, cmsPages: pages}))} 
                onSaveMenu={(menu) => updateStateAndFirestore('cms', 'menu', menu, false, p => ({...p, cmsMenu: menu}))} 
                onSaveAppMenu={(appMenu) => updateStateAndFirestore('cms', 'appMenu', appMenu, false, p => ({...p, appMenu}))} 
                onSaveSettings={(settings) => updateStateAndFirestore('settings', 'site', settings, false, p => ({...p, siteSettings: settings}))} 
                onChangeMenu={(menu) => updateStateAndFirestore('cms', 'menu', menu, false, p => ({...p, cmsMenu: menu}), true)}
                onChangeAppMenu={(appMenu) => updateStateAndFirestore('cms', 'appMenu', appMenu, false, p => ({...p, appMenu}), true)}
                onChangeSettings={(settings) => updateStateAndFirestore('settings', 'site', settings, false, p => ({...p, siteSettings: settings}), true)}
                onSaveMediaImage={(image) => updateStateAndFirestore('mediaImages', image.id, image, false, p => ({...p, mediaImages: [image, ...(p.mediaImages || [])]}))} 
                onDeleteMediaImage={(id) => updateStateAndFirestore('mediaImages', id, null, true, p => ({...p, mediaImages: (p.mediaImages || []).filter(img => img.id !== id)}))} 
                onForceSave={state.storageMode === 'firebase' ? () => {
                  setSyncStatus('synced');
                  setTimeout(() => setSyncStatus(null), 2000);
                } : (globalFileHandle ? () => saveToSystemFile(state) : triggerManualSync)} 
                language={state.language} 
                darkMode={state.darkMode} 
                storageMode={state.storageMode} 
                currentUser={currentUser} 
              /> :
             currentView === 'users' ? <UserManagementPage users={state.users} onAdd={handleAddUser} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} language={state.language} darkMode={state.darkMode} /> : 
             selectedFile ? <ReviewPage file={selectedFile} language={state.language} darkMode={state.darkMode} onSave={handleUpdateFileData} onBack={() => setCurrentView('dashboard')} /> : <Navigate to="/" replace />}
          </Layout>
        )}
      </div>
    </HashRouter>
  );
};

const LoginPage = ({ 
  onLogin, 
  onGoogleLogin, 
  onFirebaseLogin, 
  onFirebaseSignUp, 
  language, 
  darkMode,
  appMenuConfig,
  cmsMenuConfig,
  onLanguageToggle,
  onThemeToggle,
  isDatabaseLoaded, 
  fileName, 
  onConnect, 
  onCreate, 
  error, 
  onCloseError, 
  isConnecting,
  onBackToHome
}: any) => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [mode, setMode] = useState<'local' | 'firebase'>('local');
  const t = useTranslation(language);
  const isRtl = language === 'ar';
  const appName = cmsMenuConfig?.logoText || appMenuConfig?.appName || 'HandAttend AI';
  const logoImage = cmsMenuConfig?.logoImage || appMenuConfig?.logoImage;

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ email, password });
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full rounded-3xl shadow-2xl border overflow-hidden relative ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        {/* Header Controls */}
        <div className="absolute top-4 right-4 left-4 flex justify-between items-center z-10">
          <button onClick={onBackToHome} className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} title={t.home}>
            {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>
          <div className="flex gap-2">
            <button onClick={onLanguageToggle} className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} title={t.switchLanguage}>
              <Globe className="w-5 h-5" />
            </button>
            <button onClick={onThemeToggle} className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`} title={darkMode ? t.lightMode : t.darkMode}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className={`absolute inset-0 z-50 flex items-center justify-center p-8 text-center animate-in fade-in duration-300 ${darkMode ? 'bg-gray-900/95' : 'bg-white/95'}`}>
            <div className="space-y-6">
              <div className="bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t.invalidLogin}</h3>
              <p className="text-gray-500 dark:text-gray-400">{t.invalidLoginMsg}</p>
              <button onClick={onCloseError} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl transition shadow-md hover:bg-red-700">{t.cancel}</button>
            </div>
          </div>
        )}
        <div className="p-8 pt-16">
          <div className="text-center mb-8">
            {logoImage ? (
              <div className="mb-4 flex justify-center">
                <img src={logoImage} alt={appName} className="h-16 w-auto object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                <FileText className="w-8 h-8" />
              </div>
            )}
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{appName}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t.subtitle}</p>
          </div>

          <div className={`flex p-1 rounded-xl mb-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button 
              onClick={() => setMode('local')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'local' ? (darkMode ? 'bg-gray-700 text-blue-400 shadow-sm' : 'bg-white shadow-sm text-blue-600') : 'text-gray-500'}`}
            >
              {t.localFile}
            </button>
            <button 
              onClick={() => setMode('firebase')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${mode === 'firebase' ? (darkMode ? 'bg-gray-700 text-blue-400 shadow-sm' : 'bg-white shadow-sm text-blue-600') : 'text-gray-500'}`}
            >
              {t.firebaseCloud}
            </button>
          </div>
          
          {mode === 'local' ? (
            !isDatabaseLoaded ? (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-800 dark:text-blue-300 text-sm mb-4">
                  <Info className="w-4 h-4 inline mr-2" /> {t.dbRequired}
                </div>
                <button 
                  onClick={onConnect} 
                  disabled={isConnecting}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-3 ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isConnecting ? <Loader2 className="animate-spin w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
                  {t.importDatabase}
                </button>
                <button 
                  onClick={onCreate} 
                  disabled={isConnecting}
                  className={`w-full py-4 rounded-xl font-bold transition flex items-center justify-center gap-3 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isConnecting ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {t.newDatabase}
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormLogin} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-xl text-green-800 dark:text-green-300 text-sm mb-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /><span className="font-bold truncate">{t.dbConnectedSuccess} ({fileName || 'Database'})</span>
                </div>
                <div className="text-xs text-gray-500 text-center mb-2">{t.localMode}</div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.email}</label>
                  <input 
                    type="email" 
                    autoComplete="email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="admin@system.com" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.password}</label>
                  <input 
                    type="password" 
                    autoComplete="current-password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="••••••••" 
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md mt-4 flex items-center justify-center h-12"
                >
                  {t.login}
                </button>
                <div className="pt-6 border-t dark:border-gray-800 mt-4 grid grid-cols-2 gap-3">
                  <button type="button" onClick={onConnect} className={`py-2.5 rounded-xl font-bold transition text-xs truncate px-1 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}><i className="fas fa-sync-alt mr-1"></i>{t.switchDb}</button>
                  <button type="button" onClick={onCreate} className={`py-2.5 rounded-xl font-bold transition text-xs truncate px-1 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}><i className="fas fa-plus mr-1"></i>{t.newDatabase}</button>
                </div>
              </form>
            )
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-800 dark:text-blue-300 text-sm mb-4">
                <Cloud className="w-4 h-4 inline mr-2" /> {t.firebaseCloud}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t.email}</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="user@example.com" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.password}</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className={`w-full px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                  placeholder="••••••••" 
                />
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  type="button"
                  onClick={() => onFirebaseLogin(email, password)}
                  disabled={isConnecting || !email || !password}
                  className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 ${isConnecting ? 'opacity-50' : ''}`}
                >
                  <LogIn className="w-4 h-4" />
                  {t.login}
                </button>
                <button 
                  type="button"
                  onClick={() => onFirebaseSignUp(email, password)}
                  disabled={isConnecting || !email || !password}
                  className={`flex-1 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} ${isConnecting ? 'opacity-50' : ''}`}
                >
                  <UserPlus className="w-4 h-4" />
                  {t.signUp || 'Sign Up'}
                </button>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold">{t.or || 'OR'}</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-800"></div>
              </div>

              <button 
                onClick={onGoogleLogin}
                disabled={isConnecting}
                className={`w-full border-2 hover:border-blue-500 py-3 rounded-xl font-bold transition flex items-center justify-center gap-3 ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-700'} ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isConnecting ? <Loader2 className="animate-spin w-5 h-5" /> : <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />}
                {t.signInWithGoogle}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewPage = ({ file, language, darkMode, onSave, onBack }: any) => {
  const [data, setData] = useState(file.data || null); 
  const t = useTranslation(language); 
  const isRtl = language === 'ar';

  if (!data) return null;
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
            {isRtl ? <ArrowRight className="w-6 h-6" /> : <ArrowLeft className="w-6 h-6" />}
          </button>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">{t.reviewEdit}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-bold">{file.name} ({file.year})</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => exportToExcel(data, file.name.split('.')[0])} 
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-green-500/20 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            {t.downloadExcel}
          </button>
          <button 
            onClick={() => onSave(file.id, data)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {t.saveChanges}
          </button>
        </div>
      </div>
      <AttendanceTable data={data} language={language} darkMode={darkMode} onUpdate={setData} />
    </div>
  );
};

const DictionaryPage = ({ names = [], onAdd, onDelete, language, darkMode }: any) => {
  const [newName, setNewName] = useState(''); 
  const t = useTranslation(language);
  const isRtl = language === 'ar';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">{t.manageDictionary}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t.dictionarySubtitle}</p>
      </div>

      <div className={`p-8 rounded-3xl border shadow-sm space-y-8 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)} 
            placeholder={t.namePlaceholder} 
            className={`flex-1 px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
          />
          <button 
            onClick={() => { if(newName) { onAdd(newName); setNewName(''); } }} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t.addName}
          </button>
        </div>

        <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <table className="w-full text-left border-collapse">
            <thead className={`${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">{t.employeeName}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest w-24 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-800">
              {names.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-gray-400 italic">
                    {t.noNames || 'No names added yet.'}
                  </td>
                </tr>
              ) : (
                names.map((n:any) => (
                  <tr key={n} className={`transition-colors ${darkMode ? 'hover:bg-gray-800/30' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 font-bold">{n}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onDelete(n)} 
                        className={`p-2 rounded-lg transition ${darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                        title={t.delete}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-blue-900/20 border-blue-800/30 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-800'} flex items-start gap-4`}>
        <div className="bg-blue-600 text-white p-2 rounded-lg flex-shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold mb-1">{t.proTip || 'Pro Tip'}</h4>
          <p className="text-sm opacity-90 leading-relaxed">{t.dictionaryTip || 'Adding employee names helps the AI correctly identify handwritten names even if they are slightly unclear.'}</p>
        </div>
      </div>
    </div>
  );
};

export default App;
