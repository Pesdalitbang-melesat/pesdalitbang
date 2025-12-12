import React from 'react';
import { LayoutDashboard, Inbox, Send, FilePlus, Mail, Settings, Menu, ChevronLeft, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isCollapsed, toggleSidebar, isDarkMode, toggleTheme }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'incoming', label: 'Surat Masuk', icon: Inbox },
    { id: 'outgoing', label: 'Surat Keluar', icon: Send },
    { id: 'create', label: 'Rekap Surat Baru', icon: FilePlus },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div 
      className={`bg-slate-900 dark:bg-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-20 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-800 transition-all`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-indigo-500 p-1.5 rounded-lg flex-shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="whitespace-nowrap">
              <h1 className="text-lg font-bold tracking-tight">SuratAI</h1>
              <p className="text-[10px] text-slate-400">Smart Recap</p>
            </div>
          </div>
        )}
        
        {/* Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
          title={isCollapsed ? "Expand Menu" : "Minimize Menu"}
        >
          {isCollapsed ? <Menu className="w-6 h-6" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-start px-4'} py-3 rounded-lg text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
              
              {!isCollapsed && (
                <span className="ml-3 truncate">{item.label}</span>
              )}

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 space-y-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-3'} py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors`}
          title="Toggle Theme"
        >
            {isDarkMode ? (
                <Sun className="w-5 h-5" />
            ) : (
                <Moon className="w-5 h-5" />
            )}
            {!isCollapsed && (
                <span className="ml-3 text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            )}
        </button>

        {/* Status */}
        <div className={`bg-slate-800 dark:bg-slate-900 rounded-lg p-3 text-xs text-slate-400 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="relative">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          {!isCollapsed && (
            <div>
              <p className="font-semibold text-slate-300">Status AI</p>
              <p className="text-[10px]">Gemini 2.5 Ready</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;