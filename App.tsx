
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, AttendanceFile, FileStatus, ExtractionResult, AppState, Role, VisualReference } from './types';
import { TRANSLATIONS } from './constants';
import Layout from './components/Layout';
import AttendanceTable from './components/AttendanceTable';
import { extractAttendanceData } from './services/geminiService';
import { exportToExcel } from './utils/excelExport';

// --- Visual Dictionary Page ---

const VisualDictionaryPage = ({ samples = [], onAdd, onDelete, language, darkMode }: { 
  samples: VisualReference[], 
  onAdd: (digit: string, image: string) => void, 
  onDelete: (id: string) => void, 
  language: 'ar' | 'en', 
  darkMode: boolean 
}) => {
  const t = TRANSLATIONS[language];
  const [digit, setDigit] = useState('');
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && digit) {
      const reader = new FileReader();
      reader.onload = () => {
        onAdd(digit, reader.result as string);
        setDigit('');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold">{t.visualDictionary}</h2>
        <p className="text-gray-500">{t.visualDictionarySubtitle}</p>
      </div>

      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm border space-y-6`}>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">{t.digitValue}</label>
            <input 
              type="text" 
              value={digit} 
              onChange={(e) => setDigit(e.target.value)} 
              placeholder="e.g. 5"
              className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
            />
          </div>
          <label className={`cursor-pointer ${!digit ? 'opacity-50 pointer-events-none' : ''} bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-md inline-flex items-center gap-2`}>
            <i className="fas fa-plus"></i>{t.addSample}
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={!digit} />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {samples?.map(sample => (
            <div key={sample.id} className="relative group">
              <div className={`aspect-square rounded-xl border overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'} bg-gray-50 flex items-center justify-center p-2`}>
                <img src={sample.imageBase64} alt={`Ref ${sample.digit}`} className="max-w-full max-h-full object-contain" />
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                  {sample.digit}
                </div>
              </div>
              <button 
                onClick={() => onDelete(sample.id)}
                className="absolute -top-2 -left-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs shadow-md opacity-0 group-hover:opacity-100 transition"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
          {(!samples || samples.length === 0) && (
            <div className="col-span-full py-10 text-center text-gray-400">
              {t.noSamples}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- User Management Component ---

const UserManagementPage = ({ users = [], onAdd, onDelete, language, darkMode }: any) => {
  const t = TRANSLATIONS[language];
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'HR User' as Role });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.password) {
      onAdd({ id: Math.random().toString(36).substr(2, 9), ...formData });
      setFormData({ name: '', email: '', password: '', role: 'HR User' });
    }
  };
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div><h2 className="text-2xl font-bold">{t.userManagement}</h2><p className="text-gray-500">{t.manageUsersSubtitle}</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm border col-span-1`}>
          <h3 className="font-bold mb-4">{t.addUser}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium mb-1">{t.userName}</label><input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} /></div>
            <div><label className="block text-sm font-medium mb-1">{t.email}</label><input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} /></div>
            <div><label className="block text-sm font-medium mb-1">{t.password}</label><input required type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} /></div>
            <div><label className="block text-sm font-medium mb-1">{t.role}</label><select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as Role})} className={`w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}><option value="HR User">{t.hrUser}</option><option value="Admin">{t.admin}</option></select></div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">{t.addUser}</button>
          </form>
        </div>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border col-span-2 overflow-hidden`}>
          <table className="w-full text-right">
            <thead className={`${darkMode ? 'bg-gray-750' : 'bg-gray-50'} border-b`}><tr><th className="px-6 py-4">{t.userName}</th><th className="px-6 py-4">{t.email}</th><th className="px-6 py-4">{t.role}</th><th className="px-6 py-4 w-20">{t.actions}</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{users?.map((u: any) => (<tr key={u.id}><td className="px-6 py-4 font-medium">{u.name}</td><td className="px-6 py-4 text-gray-500">{u.email}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{t[u.role === 'Admin' ? 'admin' : 'hrUser']}</span></td><td className="px-6 py-4"><button onClick={() => onDelete(u.id)} className="text-red-500 hover:text-red-700 p-2"><i className="fas fa-trash-alt"></i></button></td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Dictionary Management ---

const DictionaryPage = ({ names = [], onAdd, onDelete, language, darkMode }: { names: string[], onAdd: (name: string) => void, onDelete: (name: string) => void, language: 'ar' | 'en', darkMode: boolean }) => {
  const [newName, setNewName] = useState('');
  const t = TRANSLATIONS[language];
  const handleAdd = () => { if (newName.trim()) { onAdd(newName.trim()); setNewName(''); } };
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div><h2 className="text-2xl font-bold">{t.manageDictionary}</h2><p className="text-gray-500">{t.dictionarySubtitle}</p></div>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-2xl shadow-sm border space-y-4`}>
        <div className="flex gap-3"><input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t.namePlaceholder} className={`flex-1 px-4 py-3 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} onKeyPress={(e) => e.key === 'Enter' && handleAdd()} /><button onClick={handleAdd} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition shadow-md">{t.addName}</button></div>
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-right"><thead className={`${darkMode ? 'bg-gray-750' : 'bg-gray-50'} border-b`}><tr><th className="px-6 py-3">{t.employeeName}</th><th className="px-6 py-3 w-20">{t.actions}</th></tr></thead>
            <tbody className="divide-y divide-gray-100">{(!names || names.length === 0) ? (<tr><td colSpan={2} className="px-6 py-8 text-center text-gray-400">{t.dictionaryEmpty}</td></tr>) : 
              names.map(name => (<tr key={name} className="hover:bg-gray-50"><td className="px-6 py-3">{name}</td><td className="px-6 py-3 text-center"><button onClick={() => onDelete(name)} className="text-red-500 p-2"><i className="fas fa-trash-alt"></i></button></td></tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Database Import Page ---

const DatabaseImportPage = ({ onImport, onInitialize, language, darkMode }: any) => {
  const t = TRANSLATIONS[language];
  return (
    <div className="max-w-xl mx-auto mt-20 p-10 bg-white rounded-3xl shadow-2xl border border-gray-100 text-center space-y-8">
      <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center text-blue-600 mx-auto"><i className="fas fa-database text-3xl"></i></div>
      <div><h2 className="text-2xl font-bold mb-2">{t.importDatabase}</h2><p className="text-gray-500">{t.dbRequired}</p></div>
      <div className="flex flex-col gap-4"><label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition shadow-lg block">{t.importDatabase}<input type="file" className="hidden" accept=".json" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} /></label><button onClick={onInitialize} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold transition">{t.newDatabase}</button></div>
    </div>
  );
};

// --- Dashboard Page ---

const DashboardPage = ({ files = [], onUpload, language, darkMode, onFileSelect }: any) => {
  const t = TRANSLATIONS[language];
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const years = Array.from({ length: 11 }, (_, i) => 2024 + i);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { onUpload(e.target.files[0], selectedYear); } };
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-2xl font-bold">{t.dashboard}</h2><p className="text-gray-500">{t.subtitle}</p></div>
        <div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-2"><label className="text-sm font-bold text-gray-600">{t.selectYear}:</label><select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className={`px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} font-bold focus:ring-2 focus:ring-blue-500 outline-none`}>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div><label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg inline-flex items-center gap-2"><i className="fas fa-plus"></i>{t.upload}<input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} /></label></div>
      </div>
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-blue-800 flex items-center gap-3"><i className="fas fa-info-circle text-xl"></i><p className="text-sm font-medium">{t.saturdayFirst}</p></div>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border overflow-hidden`}><table className="w-full text-right"><thead className={`${darkMode ? 'bg-gray-750' : 'bg-gray-50'} border-b`}><tr><th className="px-6 py-4">{t.title}</th><th className="px-6 py-4">{t.titleWithYear}</th><th className="px-6 py-4">{t.status}</th><th className="px-6 py-4">{t.date}</th><th className="px-6 py-4">{t.actions}</th></tr></thead>
          <tbody className="divide-y divide-gray-100">{(!files || files.length === 0) ? (<tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">{t.noFiles}</td></tr>) : files.map((file: any) => (<tr key={file.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-medium">{file.name}</td><td className="px-6 py-4 font-bold text-blue-600">{file.year}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${file.status === FileStatus.Processing ? 'bg-blue-100 text-blue-700' : file.status === FileStatus.Completed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{file.status === FileStatus.Processing && <i className="fas fa-spinner fa-spin"></i>}{t[file.status.toLowerCase()]}</span></td><td className="px-6 py-4 text-gray-500 text-sm">{new Date(file.upload_date).toLocaleDateString()}</td><td className="px-6 py-4"><button onClick={() => onFileSelect(file)} disabled={file.status !== FileStatus.Completed} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition"><i className="fas fa-eye"></i></button></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

const ReviewPage = ({ file, language, darkMode, onSave, onBack }: any) => {
  const [data, setData] = useState<ExtractionResult | null>(file.data || null);
  const t = TRANSLATIONS[language];
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-center gap-4"><button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-lg"><i className={`fas fa-arrow-${language === 'ar' ? 'right' : 'left'}`}></i></button><div><h2 className="text-2xl font-bold">{t.reviewEdit}</h2><p className="text-gray-500 font-medium">{file.name} ({file.year})</p></div></div><div className="flex gap-3"><button onClick={() => exportToExcel(data, file.name.split('.')[0])} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold transition"><i className="fas fa-file-excel mr-2"></i>{t.downloadExcel}</button><button onClick={() => onSave(file.id, data)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition"><i className="fas fa-save mr-2"></i>{t.saveChanges}</button></div></div>
      <AttendanceTable data={data} language={language} darkMode={darkMode} onUpdate={setData} />
    </div>
  );
};

// --- Main App Component ---

const DEFAULT_USERS: User[] = [{ id: 'admin', name: 'System Admin', email: 'admin@system.com', password: 'admin', role: 'Admin' }];

const INITIAL_STATE: AppState = {
  users: DEFAULT_USERS,
  files: [],
  nameDictionary: [],
  visualReferences: [],
  language: 'ar',
  darkMode: false,
  isDatabaseLoaded: false
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'review' | 'dictionary' | 'users' | 'samples'>('dashboard');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const handleLogin = (credentials: { email: string, password: string }) => {
    const user = state.users?.find(u => u.email === credentials.email && u.password === credentials.password);
    if (user) setCurrentUser(user); else alert(TRANSLATIONS[state.language].invalidLogin);
  };
  const handleLogout = () => { setCurrentUser(null); setCurrentView('dashboard'); };
  const saveDatabaseToFile = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url; link.download = `attendance_db_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  };
  const importDatabaseFromFile = (file: File) => {
    const reader = new FileReader(); reader.onload = (e) => {
      try { 
        const importedState = JSON.parse(e.target?.result as string); 
        // Merge with initial state to ensure no missing keys
        setState({ 
          ...INITIAL_STATE,
          ...importedState, 
          isDatabaseLoaded: true 
        }); 
        alert(TRANSLATIONS[state.language].dbLoaded); 
      } 
      catch (err) { alert("Invalid format."); }
    }; reader.readAsText(file);
  };
  const initializeNewDatabase = () => setState(prev => ({ ...prev, isDatabaseLoaded: true }));
  const handleAddUser = (user: User) => setState(prev => ({ ...prev, users: [...(prev.users || []), user] }));
  const handleDeleteUser = (id: string) => setState(prev => ({ ...prev, users: (prev.users || []).filter(u => u.id !== id) }));
  const handleAddName = (name: string) => setState(prev => ({ ...prev, nameDictionary: [...new Set([...(prev.nameDictionary || []), name])] }));
  const handleDeleteName = (name: string) => setState(prev => ({ ...prev, nameDictionary: (prev.nameDictionary || []).filter(n => n !== name) }));

  const handleAddVisualSample = (digit: string, image: string) => {
    const newRef: VisualReference = { id: Math.random().toString(36).substr(2, 9), digit, imageBase64: image };
    setState(prev => ({ ...prev, visualReferences: [...(prev.visualReferences || []), newRef] }));
  };
  const handleDeleteVisualSample = (id: string) => setState(prev => ({ ...prev, visualReferences: (prev.visualReferences || []).filter(r => r.id !== id) }));

  const processFile = async (fileId: string, base64: string, year: number, mimeType: string) => {
    try {
      const result = await extractAttendanceData(base64, year, mimeType, state.nameDictionary || [], state.visualReferences || []);
      setState(prev => ({ ...prev, files: (prev.files || []).map(f => f.id === fileId ? { ...f, status: FileStatus.Completed, data: result } : f) }));
    } catch (error) {
      setState(prev => ({ ...prev, files: (prev.files || []).map(f => f.id === fileId ? { ...f, status: FileStatus.Failed } : f) }));
    }
  };
  const handleUpload = (file: File, year: number) => {
    const reader = new FileReader(); reader.onload = () => {
      const base64 = reader.result as string;
      const newFile: AttendanceFile = { id: Math.random().toString(36).substr(2, 9), name: file.name, uploaded_by: currentUser?.name || 'User', upload_date: new Date().toISOString(), status: FileStatus.Processing, year: year, previewUrl: base64 };
      setState(prev => ({ ...prev, files: [newFile, ...(prev.files || [])] }));
      processFile(newFile.id, base64, year, file.type);
    }; reader.readAsDataURL(file);
  };
  const handleUpdateFileData = (id: string, data: ExtractionResult) => {
    setState(prev => ({ ...prev, files: (prev.files || []).map(f => f.id === id ? { ...f, data } : f) }));
    alert(TRANSLATIONS[state.language].saveChanges);
  };

  const selectedFile = state.files?.find(f => f.id === selectedFileId);

  return (
    <HashRouter>
      <div dir={state.language === 'ar' ? 'rtl' : 'ltr'} className={state.language === 'ar' ? 'rtl-layout' : 'ltr-layout'}>
        {!state.isDatabaseLoaded ? (<DatabaseImportPage onImport={importDatabaseFromFile} onInitialize={initializeNewDatabase} language={state.language} darkMode={state.darkMode} />) : 
        !currentUser ? (<LoginPage onLogin={handleLogin} language={state.language} />) : (
          <Layout user={currentUser} language={state.language} darkMode={state.darkMode} onLogout={handleLogout} onLanguageToggle={() => setState(p => ({...p, language: p.language === 'ar' ? 'en' : 'ar'}))} onThemeToggle={() => setState(p => ({...p, darkMode: !p.darkMode}))} onSaveDatabase={saveDatabaseToFile} onNavigate={setCurrentView} currentView={currentView} >
            {currentView === 'dashboard' ? (<DashboardPage files={state.files} onUpload={handleUpload} language={state.language} darkMode={state.darkMode} onFileSelect={(f: any) => { setSelectedFileId(f.id); setCurrentView('review'); }} />) : 
             currentView === 'dictionary' ? (<DictionaryPage names={state.nameDictionary} onAdd={handleAddName} onDelete={handleDeleteName} language={state.language} darkMode={state.darkMode} />) : 
             currentView === 'samples' ? (<VisualDictionaryPage samples={state.visualReferences} onAdd={handleAddVisualSample} onDelete={handleDeleteVisualSample} language={state.language} darkMode={state.darkMode} />) : 
             currentView === 'users' ? (<UserManagementPage users={state.users} onAdd={handleAddUser} onDelete={handleDeleteUser} language={state.language} darkMode={state.darkMode} />) : 
             selectedFile ? (<ReviewPage file={selectedFile} language={state.language} darkMode={state.darkMode} onSave={handleUpdateFileData} onBack={() => setCurrentView('dashboard')} />) : <Navigate to="/" replace />}
          </Layout>
        )}
      </div>
    </HashRouter>
  );
};

const LoginPage = ({ onLogin, language }: any) => {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const t = TRANSLATIONS[language];
  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-gray-100"><div className="text-center mb-8"><div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg"><i className="fas fa-lock text-2xl"></i></div><h2 className="text-2xl font-bold">{t.login}</h2><p className="text-gray-500 mt-2">{t.subtitle}</p></div><div className="space-y-4"><div><label className="block text-sm font-medium mb-1">{t.email}</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" /></div><div><label className="block text-sm font-medium mb-1">{t.password}</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none" /></div><button onClick={() => onLogin({ email, password })} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md mt-4">{t.login}</button></div></div>
  );
};

export default App;
