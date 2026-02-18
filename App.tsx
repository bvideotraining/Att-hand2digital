
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, AttendanceFile, FileStatus, ExtractionResult, AppState, Role, VisualReference } from './types';
import { TRANSLATIONS } from './constants';
import Layout from './components/Layout';
import AttendanceTable from './components/AttendanceTable';
import { extractAttendanceData } from './services/geminiService';
import { exportToExcel } from './utils/excelExport';

// --- Global File Handle Reference (Non-serializable) ---
let globalFileHandle: any = null;
const LOCAL_STORAGE_KEY = 'arabic_attendance_db_backup';

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
  visualReferences: [],
  language: 'ar',
  darkMode: false,
  isDatabaseLoaded: false,
  connectedFileName: undefined
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
  const [digit, setDigit] = useState('');
  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file && digit) {
      const reader = new FileReader();
      reader.onload = () => { onAdd(digit, reader.result as string); setDigit(''); };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div><h2 className="text-2xl font-bold">{t.visualDictionary}</h2><p className="text-gray-500">{t.visualDictionarySubtitle}</p></div>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm border space-y-6`}>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">{t.digitValue}</label>
            <input type="text" value={digit} onChange={(e) => setDigit(e.target.value)} placeholder="e.g. 5" className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} />
          </div>
          <label className={`cursor-pointer ${!digit ? 'opacity-50 pointer-events-none' : ''} bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-md inline-flex items-center gap-2`}>
            <i className="fas fa-plus"></i>{t.addSample}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={!digit} />
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {samples?.map((sample: any) => (
            <div key={sample.id} className="relative group animate-in zoom-in duration-200">
              <div className={`aspect-square rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'} bg-gray-50 flex items-center justify-center p-2`}>
                <img src={sample.imageBase64} alt={`Ref ${sample.digit}`} className="max-w-full max-h-full object-contain" />
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">{sample.digit}</div>
              </div>
              <button onClick={() => onDelete(sample.id)} className="absolute -top-2 -left-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs shadow-md opacity-0 group-hover:opacity-100 transition"><i className="fas fa-times"></i></button>
            </div>
          ))}
          {(!samples || samples.length === 0) && <div className="col-span-full py-10 text-center text-gray-400">{t.noSamples}</div>}
        </div>
      </div>
    </div>
  );
};

const UserManagementPage = ({ users = [], onAdd, onUpdate, onDelete, language, darkMode }: any) => {
  const t = useTranslation(language);
  const [formData, setFormData] = useState({ id: '', name: '', email: '', password: '', role: 'HR User' as Role });
  const [isEditing, setIsEditing] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.password) {
      if (isEditing) onUpdate(formData); else onAdd({ id: Math.random().toString(36).substr(2, 9), ...formData });
      setFormData({ id: '', name: '', email: '', password: '', role: 'HR User' });
      setIsEditing(false);
    }
  };
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div><h2 className="text-2xl font-bold">{t.userManagement}</h2><p className="text-gray-500">{t.manageUsersSubtitle}</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm border col-span-1 h-fit`}>
          <h3 className="font-bold mb-4">{isEditing ? t.editUser : t.addUser}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">{t.userName}</label><input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} /></div>
            <div><label className="block text-sm font-medium mb-1">{t.email}</label><input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} /></div>
            <div><label className="block text-sm font-medium mb-1">{t.password}</label><input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={`w-full px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} /></div>
            <div><label className="block text-sm font-medium mb-1">{t.role}</label><select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as Role})} className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}><option value="HR User">{t.hrUser}</option><option value="Admin">{t.admin}</option></select></div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">{isEditing ? t.saveChanges : t.addUser}</button>
              {isEditing && <button type="button" onClick={() => { setIsEditing(false); setFormData({ id: '', name: '', email: '', password: '', role: 'HR User' }); }} className="bg-gray-200 text-gray-700 px-4 rounded-xl font-bold">{t.cancel}</button>}
            </div>
          </form>
        </div>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border col-span-2 overflow-hidden`}>
          <table className="w-full text-right"><thead className={`${darkMode ? 'bg-gray-750' : 'bg-gray-50'} border-b`}><tr><th className="px-6 py-4">{t.userName}</th><th className="px-6 py-4">{t.email}</th><th className="px-6 py-4">{t.role}</th><th className="px-6 py-4 w-28">{t.actions}</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{users?.map((u: any) => (<tr key={u.id} className="animate-in fade-in duration-300"><td className="px-6 py-4 font-medium">{u.name}</td><td className="px-6 py-4 text-gray-500">{u.email}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{t[u.role === 'Admin' ? 'admin' : 'hrUser']}</span></td><td className="px-6 py-4 flex gap-2">
              <button onClick={() => { setFormData({...u, password: u.password || ''}); setIsEditing(true); }} className="text-blue-500 hover:text-blue-700 p-2"><i className="fas fa-edit"></i></button>
              <button onClick={() => onDelete(u.id)} className="text-red-500 hover:text-red-700 p-2"><i className="fas fa-trash-alt"></i></button>
            </td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = ({ files = [], onUpload, onDelete, language, darkMode, onFileSelect }: any) => {
  const t = useTranslation(language);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const years = Array.from({ length: 11 }, (_, i) => 2024 + i);
  const handleFileChange = (e: any) => { if (e.target.files?.[0]) onUpload(e.target.files[0], selectedYear); };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-2xl font-bold">{t.dashboard}</h2><p className="text-gray-500">{t.subtitle}</p></div>
        <div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-2"><label className="text-sm font-bold text-gray-600">{t.selectYear}:</label><select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className={`px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} font-bold focus:ring-2 focus:ring-blue-500 outline-none`}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div><label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg inline-flex items-center gap-2"><i className="fas fa-plus"></i>{t.upload}<input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} /></label></div>
      </div>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border overflow-hidden`}>
        <table className="w-full text-right"><thead className={`${darkMode ? 'bg-gray-750' : 'bg-gray-50'} border-b`}><tr><th className="px-6 py-4">{t.title}</th><th className="px-6 py-4">{t.titleWithYear}</th><th className="px-6 py-4">{t.status}</th><th className="px-6 py-4">{t.date}</th><th className="px-6 py-4">{t.actions}</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{(!files || files.length === 0) ? (<tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">{t.noFiles}</td></tr>) : files.map((file: any) => (
            <tr key={file.id} className="hover:bg-gray-50 transition-colors animate-in fade-in duration-300">
              <td className="px-6 py-4 font-medium">{file.name}</td>
              <td className="px-6 py-4 font-bold text-blue-600">{file.year}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${file.status === FileStatus.Processing ? 'bg-blue-100 text-blue-700' : file.status === FileStatus.Completed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {file.status === FileStatus.Processing && <i className="fas fa-spinner fa-spin"></i>}{t[file.status.toLowerCase()]}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-500 text-sm">{new Date(file.upload_date).toLocaleDateString()}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <button onClick={() => onFileSelect(file)} disabled={file.status !== FileStatus.Completed} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition"><i className="fas fa-eye"></i></button>
                  <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      if (window.confirm(t.confirmDelete || 'Delete this record?')) {
                        onDelete(file.id); 
                      }
                    }} 
                    className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition"
                    title={t.deleteFile}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main App ---

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'review' | 'dictionary' | 'users' | 'samples'>('dashboard');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  
  const legacyFileInputRef = useRef<HTMLInputElement>(null);

  // Persistence management - Safe Quota Guard
  useEffect(() => {
    if (state.isDatabaseLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn("Local storage quota exceeded. State not cached.");
      }
      
      if (globalFileHandle) {
        saveToSystemFile(state);
      }
    }
  }, [state]);

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

  const applyImportedData = (imported: any, fileName: string) => {
    // SECURITY: Ensure we only import DATA, not system settings that could break the UI
    if (!imported || typeof imported !== 'object') {
      alert("Invalid file format.");
      return;
    }
    
    setState(current => {
      // Create a selective merge - ignore everything except business data
      const nextState: AppState = { 
        ...current, 
        users: Array.isArray(imported.users) ? imported.users : current.users,
        files: Array.isArray(imported.files) ? imported.files : [],
        nameDictionary: Array.isArray(imported.nameDictionary) ? imported.nameDictionary : [],
        visualReferences: Array.isArray(imported.visualReferences) ? imported.visualReferences : [],
        // Preserve current UI settings to prevent disappearing content
        language: current.language,
        darkMode: current.darkMode,
        isDatabaseLoaded: true, 
        connectedFileName: fileName 
      };

      // Safety check: ensure admin user exists
      const hasAdmin = nextState.users.some((u: User) => u.email.toLowerCase() === DEFAULT_ADMIN.email.toLowerCase());
      if (!hasAdmin) nextState.users = [DEFAULT_ADMIN, ...nextState.users];
      
      return nextState;
    });
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
        const newState = { ...INITIAL_STATE, isDatabaseLoaded: true, connectedFileName: 'attendance_db.json' };
        
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
    setState({ ...INITIAL_STATE, isDatabaseLoaded: true, connectedFileName: 'attendance_db.json' });
    alert((TRANSLATIONS[state.language] || TRANSLATIONS.ar).browserRestricted);
  };

  const handleLogin = (creds: any) => {
    if (!creds.email || !creds.password) return;
    
    const user = state.users.find(u => 
      u.email.toLowerCase() === creds.email.trim().toLowerCase() && 
      u.password === creds.password
    );

    if (user) { 
      setCurrentUser(user); 
      setLoginError(false); 
    } else { 
      setLoginError(true); 
    }
  };

  const handleDeleteFile = (id: string) => {
    setState(current => {
      const updatedFiles = current.files.filter(f => f.id !== id);
      return { ...current, files: updatedFiles };
    });
  };

  const handleUpdateFileData = (id: string, data: any) => {
    setState(p => ({
      ...p,
      files: p.files.map(f => f.id === id ? { ...f, data } : f)
    }));
  };

  const handleUpload = (file: File, year: number) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newFile: AttendanceFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        uploaded_by: currentUser?.name || 'User',
        upload_date: new Date().toISOString(),
        status: FileStatus.Processing,
        year,
        previewUrl: base64
      };
      setState(p => ({ ...p, files: [newFile, ...p.files] }));
      processFile(newFile.id, base64, year, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processFile = async (id: string, base64: string, year: number, mime: string) => {
    try {
      const res = await extractAttendanceData(base64, year, mime, state.nameDictionary, state.visualReferences);
      setState(p => ({
        ...p,
        files: p.files.map(f => f.id === id ? { ...f, status: FileStatus.Completed, data: res } : f)
      }));
    } catch (e) {
      setState(p => ({
        ...p,
        files: p.files.map(f => f.id === id ? { ...f, status: FileStatus.Failed } : f)
      }));
    }
  };

  const selectedFile = state.files.find(f => f.id === selectedFileId);

  return (
    <HashRouter>
      <div dir={state.language === 'ar' ? 'rtl' : 'ltr'} className={state.language === 'ar' ? 'rtl-layout' : 'ltr-layout'}>
        <input ref={legacyFileInputRef} type="file" className="hidden" accept=".json" onChange={handleLegacyFileSelect} />
        
        {!currentUser ? (
          <LoginPage 
            onLogin={handleLogin} 
            language={state.language} 
            isDatabaseLoaded={state.isDatabaseLoaded} 
            fileName={state.connectedFileName} 
            onConnect={handleConnectFile} 
            onCreate={handleCreateNewFile} 
            error={loginError} 
            onCloseError={() => setLoginError(false)} 
            isConnecting={isConnecting}
          />
        ) : (
          <Layout 
            user={currentUser} 
            language={state.language} 
            darkMode={state.darkMode} 
            onLogout={() => setCurrentUser(null)} 
            onLanguageToggle={() => setState(p => ({...p, language: p.language === 'ar' ? 'en' : 'ar'}))} 
            onThemeToggle={() => setState(p => ({...p, darkMode: !p.darkMode}))} 
            onSaveDatabase={globalFileHandle ? () => saveToSystemFile(state) : triggerManualSync} 
            onNavigate={setCurrentView} 
            currentView={currentView} 
            syncStatus={syncStatus}
          >
            {currentView === 'dashboard' ? <DashboardPage files={state.files} onUpload={handleUpload} onDelete={handleDeleteFile} language={state.language} darkMode={state.darkMode} onFileSelect={(f: any) => { setSelectedFileId(f.id); setCurrentView('review'); }} /> : 
             currentView === 'dictionary' ? <DictionaryPage names={state.nameDictionary} onAdd={(n: string) => setState(p => ({...p, nameDictionary: [...new Set([...p.nameDictionary, n])]}))} onDelete={(n: string) => setState(p => ({...p, nameDictionary: p.nameDictionary.filter(x => x !== n)}))} language={state.language} darkMode={state.darkMode} /> : 
             currentView === 'samples' ? <VisualDictionaryPage samples={state.visualReferences} onAdd={(d: string, i: string) => setState(p => ({...p, visualReferences: [...p.visualReferences, {id: Math.random().toString(), digit: d, imageBase64: i}]}))} onDelete={(id: string) => setState(p => ({...p, visualReferences: p.visualReferences.filter(r => r.id !== id)}))} language={state.language} darkMode={state.darkMode} /> : 
             currentView === 'users' ? <UserManagementPage users={state.users} onAdd={(u: User) => setState(p => ({...p, users: [...p.users, u]}))} onUpdate={(u: User) => setState(p => ({...p, users: p.users.map(x => x.id === u.id ? u : x)}))} onDelete={(id: string) => setState(p => ({...p, users: p.users.filter(u => u.id !== id)}))} language={state.language} darkMode={state.darkMode} /> : 
             selectedFile ? <ReviewPage file={selectedFile} language={state.language} darkMode={state.darkMode} onSave={handleUpdateFileData} onBack={() => setCurrentView('dashboard')} /> : <Navigate to="/" replace />}
          </Layout>
        )}
      </div>
    </HashRouter>
  );
};

const LoginPage = ({ onLogin, language, isDatabaseLoaded, fileName, onConnect, onCreate, error, onCloseError, isConnecting }: any) => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState(''); 
  const t = useTranslation(language);

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden relative">
        {error && (
          <div className="absolute inset-0 z-50 bg-white/95 flex items-center justify-center p-8 text-center animate-in fade-in duration-300">
            <div className="space-y-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center text-red-600 mx-auto"><i className="fas fa-exclamation-triangle text-2xl"></i></div>
              <h3 className="text-xl font-bold text-gray-900">{t.invalidLogin}</h3><p className="text-gray-600">{t.invalidLoginMsg}</p>
              <button onClick={onCloseError} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl transition shadow-md hover:bg-red-700">{t.cancel}</button>
            </div>
          </div>
        )}
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg"><i className="fas fa-file-invoice text-2xl"></i></div>
            <h2 className="text-2xl font-bold">{t.title}</h2><p className="text-gray-500 mt-2">{t.subtitle}</p>
          </div>
          
          {!isDatabaseLoaded ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm mb-4">
                <i className="fas fa-info-circle mr-2"></i> {t.dbRequired}
              </div>
              <button 
                onClick={onConnect} 
                disabled={isConnecting}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-3 ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isConnecting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-hdd"></i>}
                {t.importDatabase}
              </button>
              <button 
                onClick={onCreate} 
                disabled={isConnecting}
                className={`w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-bold transition flex items-center justify-center gap-3 ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isConnecting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-plus"></i>}
                {t.newDatabase}
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormLogin} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-green-100 p-4 rounded-xl text-green-800 text-sm mb-4 flex items-center gap-2">
                <i className="fas fa-check-circle"></i><span className="font-bold truncate">{t.dbConnectedSuccess} ({fileName || 'Database'})</span>
              </div>
              <div className="text-xs text-gray-500 text-center mb-2">{t.localMode}</div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.email}</label>
                <input 
                  type="email" 
                  autoComplete="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" 
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" 
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
              <div className="pt-6 border-t mt-4 grid grid-cols-2 gap-3">
                <button type="button" onClick={onConnect} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold transition text-xs truncate px-1"><i className="fas fa-sync-alt mr-1"></i>{t.switchDb}</button>
                <button type="button" onClick={onCreate} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold transition text-xs truncate px-1"><i className="fas fa-plus mr-1"></i>{t.newDatabase}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewPage = ({ file, language, darkMode, onSave, onBack }: any) => {
  const [data, setData] = useState(file.data || null); 
  const t = useTranslation(language); 
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-center gap-4"><button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-lg transition"><i className={`fas fa-arrow-${language === 'ar' ? 'right' : 'left'}`}></i></button><div><h2 className="text-2xl font-bold">{t.reviewEdit}</h2><p className="text-gray-500 font-medium">{file.name} ({file.year})</p></div></div><div className="flex gap-3"><button onClick={() => exportToExcel(data, file.name.split('.')[0])} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm hover:bg-green-700"><i className="fas fa-file-excel mr-2"></i>{t.downloadExcel}</button><button onClick={() => onSave(file.id, data)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm hover:bg-blue-700"><i className="fas fa-save mr-2"></i>{t.saveChanges}</button></div></div>
      <AttendanceTable data={data} language={language} darkMode={darkMode} onUpdate={setData} />
    </div>
  );
};

const DictionaryPage = ({ names = [], onAdd, onDelete, language, darkMode }: any) => {
  const [newName, setNewName] = useState(''); 
  const t = useTranslation(language);
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div><h2 className="text-2xl font-bold">{t.manageDictionary}</h2><p className="text-gray-500">{t.dictionarySubtitle}</p></div>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm border space-y-4`}>
        <div className="flex gap-3"><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.namePlaceholder} className={`flex-1 px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} /><button onClick={() => { if(newName) { onAdd(newName); setNewName(''); } }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">{t.addName}</button></div>
        <div className="border rounded-xl overflow-hidden"><table className="w-full text-right"><thead className={`${darkMode ? 'bg-gray-750' : 'bg-gray-50'} border-b`}><tr><th className="px-6 py-3">{t.employeeName}</th><th className="px-6 py-3 w-20">{t.actions}</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{names.map((n:any) => (<tr key={n} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-3">{n}</td><td className="px-6 py-3"><button onClick={() => onDelete(n)} className="text-red-500 hover:text-red-700 transition-colors"><i className="fas fa-trash-alt"></i></button></td></tr>))}</tbody>
        </table></div>
      </div>
    </div>
  );
};

export default App;
