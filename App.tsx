import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LetterForm from './components/LetterForm';
import LetterList from './components/LetterList';
import Settings from './components/Settings';
import { Letter, LetterType } from './types';
import { ArrowUpRight, ArrowDownLeft, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [letters, setLetters] = useState<Letter[]>([]);
  
  // State for Sidebar minimize feature
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // State for Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize Theme and Data
  useEffect(() => {
    // 1. Load Data
    const savedData = localStorage.getItem('suratAI_data');
    if (savedData) {
        setLetters(JSON.parse(savedData));
    } else {
        // Initial Dummy Data
        const initialData: Letter[] = [
            {
                id: '1',
                type: LetterType.INCOMING,
                referenceNumber: '001/INV/2023',
                sender: 'PT. Teknologi Maju',
                recipient: 'Direktur Utama',
                date: '2023-10-25',
                subject: 'Undangan Seminar AI',
                summary: 'Undangan untuk menghadiri seminar teknologi AI masa depan di Hotel Mulia pada tanggal 30 Oktober 2023.',
                tags: ['Undangan', 'Event', 'Penting'],
                documentUrl: 'https://drive.google.com/drive/u/0/my-drive',
                fileName: 'Undangan.pdf',
                createdAt: Date.now()
            },
            {
                id: '2',
                type: LetterType.OUTGOING,
                referenceNumber: '099/KEL/2023',
                sender: 'HRD Manager',
                recipient: 'Bpk. Ahmad Fauzi',
                date: '2023-10-26',
                subject: 'Surat Keputusan Pengangkatan',
                summary: 'Surat keputusan pengangkatan karyawan tetap untuk Bpk. Ahmad Fauzi efektif per 1 November 2023.',
                tags: ['HRD', 'Internal', 'SK'],
                documentUrl: 'https://drive.google.com/drive/u/0/my-drive',
                fileName: 'SK_Ahmad.pdf',
                createdAt: Date.now() - 10000
            }
        ];
        setLetters(initialData);
        localStorage.setItem('suratAI_data', JSON.stringify(initialData));
    }

    // 2. Load Theme Preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }

    // 3. Auto-collapse on mobile init
    if (window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  };

  const handleSaveLetter = (newLetter: Letter) => {
    const updatedLetters = [newLetter, ...letters];
    setLetters(updatedLetters);
    localStorage.setItem('suratAI_data', JSON.stringify(updatedLetters));
    setCurrentView('dashboard'); // Redirect to dashboard after save
  };

  // Dashboard Stats
  const incomingCount = letters.filter(l => l.type === LetterType.INCOMING).length;
  const outgoingCount = letters.filter(l => l.type === LetterType.OUTGOING).length;
  
  const renderContent = () => {
    switch (currentView) {
      case 'settings':
        return <Settings />;
      case 'create':
        return (
            <LetterForm 
                onSave={handleSaveLetter} 
                onCancel={() => setCurrentView('dashboard')} 
            />
        );
      case 'incoming':
        return <LetterList letters={letters} filterType={LetterType.INCOMING} />;
      case 'outgoing':
        return <LetterList letters={letters} filterType={LetterType.OUTGOING} />;
      case 'dashboard':
      default:
        return (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Surat Masuk</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{incomingCount}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <ArrowDownLeft className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Surat Keluar</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{outgoingCount}</h3>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-xl shadow-lg text-white">
                     <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-indigo-100">Total Arsip</p>
                            <h3 className="text-3xl font-bold mt-2">{letters.length}</h3>
                        </div>
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-indigo-200 bg-white/10 p-2 rounded inline-block">
                        AI Powered Analysis Active
                    </div>
                </div>
            </div>

            {/* Recent List */}
            <div className="w-full">
                <LetterList letters={letters.slice(0, 10)} filterType="all" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f6] dark:bg-slate-900 transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      <main 
        className={`flex-1 p-4 md:p-8 transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {currentView === 'dashboard' && 'Dashboard Overview'}
                    {currentView === 'incoming' && 'Arsip Surat Masuk'}
                    {currentView === 'outgoing' && 'Arsip Surat Keluar'}
                    {currentView === 'create' && 'Input Surat Baru'}
                    {currentView === 'settings' && 'Pengaturan'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your correspondence efficiently.</p>
            </div>
            {currentView !== 'create' && currentView !== 'settings' && (
                <button 
                    onClick={() => setCurrentView('create')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                >
                    <FileText className="w-4 h-4" />
                    + Rekap Surat
                </button>
            )}
        </header>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;