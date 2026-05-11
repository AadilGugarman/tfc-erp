import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from 'react-i18next';
import { Bell, Moon, Sun, Keyboard, Search, Printer, Monitor, LogOut, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { todayStr, formatDate } from '@/utils/formatters';
import { useState, useEffect } from 'react';

export function Header() {
  const { settings, setDarkMode, sidebarOpen, setCurrentPage, logout, currentCompany, companies, setCurrentCompany } = useAppStore();
  const { t } = useTranslation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setCurrentPage('search');
      }
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen(!shortcutsOpen);
      }
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        setCurrentPage('print-preview');
      }
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setCurrentPage('tablet-view');
      }
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setCurrentPage('vehicle-register');
      }
      if (e.key === 'Escape') {
        setShortcutsOpen(false);
        setCompanyDropdownOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcutsOpen]);

  const shortcutsList = [
    ['Alt+1', t('keyboard.dashboard')],
    ['Alt+V', t('keyboard.vehicleArrivalRegister')],
    ['Alt+2', t('keyboard.parties')],
    ['Alt+3', t('keyboard.suppliers')],
    ['Alt+4', t('keyboard.ledger')],
    ['Alt+5', t('keyboard.billing')],
    ['Alt+6', t('keyboard.inventory')],
    ['Alt+7', t('keyboard.purchases')],
    ['Alt+8', t('keyboard.payments')],
    ['Alt+9', t('keyboard.reports')],
    ['Alt+0', t('keyboard.settings')],
    ['Ctrl+N', t('common.add')],
    ['Ctrl+F', t('common.search')],
    ['Ctrl+P', t('common.print')],
    ['Ctrl+T', 'Tablet View'],
    ['Esc', t('common.close')],
    ['Ctrl+/', t('header.shortcuts')],
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6">
        {/* Left Section: Company & Date */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="hidden md:flex items-center gap-1">
            <h2 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">TFC</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentCompany?.name || t('app.fullName')}</p>
          </div>
          
          {/* Company Selector */}
          {companies.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setCompanyDropdownOpen(!companyDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="truncate">{currentCompany?.name || 'Company'}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </button>
              
              {companyDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 min-w-[200px]">
                  {companies.map(company => (
                    <button
                      key={company.id}
                      onClick={() => {
                        setCurrentCompany(company.id);
                        setCompanyDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        currentCompany?.id === company.id
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-300 font-medium'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {company.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div className="hidden sm:flex items-center text-xs text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-4">
            <span>{formatDate(todayStr())}</span>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentPage('search')} 
            className="p-2 h-auto" 
            title={`${t('common.search')} (Ctrl+F)`}
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentPage('print-preview')} 
            className="p-2 h-auto hidden sm:inline-flex" 
            title={`${t('common.print')} (Ctrl+P)`}
          >
            <Printer className="h-4 w-4" />
          </Button>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentPage('tablet-view')} 
            className="p-2 h-auto hidden md:inline-flex" 
            title="Tablet View (Ctrl+T)"
          >
            <Monitor className="h-4 w-4" />
          </Button>

          {/* Shortcuts */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShortcutsOpen(!shortcutsOpen)} 
            className="p-2 h-auto" 
            title={`${t('header.shortcuts')} (Ctrl+/)`}
          >
            <Keyboard className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 h-auto relative"
            title={t('header.notifications')}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full" />
          </Button>

          {/* Dark Mode Toggle */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setDarkMode(!settings.darkMode)} 
            className="p-2 h-auto"
            title={settings.darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {settings.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Logout */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout} 
            className="p-2 h-auto" 
            title={t('header.logout')}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Shortcuts Help Modal */}
      {shortcutsOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center" 
          onClick={() => setShortcutsOpen(false)}
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div 
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full mx-4 p-6" 
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              {t('header.shortcuts')}
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {shortcutsList.map(([key, action]) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{action}</span>
                  <kbd className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 font-mono">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShortcutsOpen(false)}
              className="mt-4 w-full px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
