import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from 'react-i18next';
import { Bell, Moon, Sun, Search, LogOut, ChevronDown, Building2 } from 'lucide-react';
import { todayStr, formatDate } from '@/utils/formatters';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/utils/cn';

export function Header() {
  const { settings, setDarkMode, setCurrentPage, logout, currentCompany, companies, setCurrentCompany } = useAppStore();
  const { t } = useTranslation();
  const [companyOpen, setCompanyOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const companyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'k') { e.preventDefault(); setCurrentPage('search'); }
      if (e.key === 'Escape') { setCompanyOpen(false); setProfileOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setCurrentPage]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) setCompanyOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-5 gap-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-black/20">
      {/* Left: Global Search */}
      <button
        onClick={() => setCurrentPage('search')}
        className={cn(
          'flex items-center gap-2.5 h-9 px-3.5 rounded-lg shrink-0',
          'bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700',
          'text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
          'hover:bg-slate-150 dark:hover:bg-slate-700/50',
          'transition-all duration-150 group'
        )}
      >
        <Search className="h-4 w-4 shrink-0 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors" />
        <span className="text-sm flex-1 text-left hidden sm:inline">
          Search...
        </span>
        <kbd className="hidden sm:flex text-xs px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono gap-0.5">
          <span>⌘</span>K
        </kbd>
      </button>

      {/* Center: Company & Date */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {companies && companies.length > 1 ? (
          <div className="relative" ref={companyRef}>
            <button
              onClick={() => setCompanyOpen(!companyOpen)}
              className={cn(
                'flex items-center gap-2 h-8 px-2.5 rounded-lg text-sm font-medium',
                'text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
                'hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-150'
              )}
            >
              <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <span className="truncate max-w-[140px]">{currentCompany?.name || 'Company'}</span>
              <ChevronDown className={cn(
                'h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200',
                companyOpen && 'rotate-180'
              )} />
            </button>
            {companyOpen && (
              <div className="absolute top-full mt-2 left-0 z-50 min-w-[200px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg shadow-black/10 dark:shadow-black/40 animate-slide-up py-2">
                {companies.map(company => (
                  <button
                    key={company.id}
                    onClick={() => { setCurrentCompany(company.id); setCompanyOpen(false); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-all duration-150',
                      currentCompany?.id === company.id
                        ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/30 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    )}
                  >
                    {currentCompany?.id === company.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                    )}
                    {company.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
          {formatDate(todayStr())}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Notifications */}
        <button className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg relative group',
          'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
          'hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-150'
        )}>
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!settings.darkMode)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
            'hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-150'
          )}
          title={settings.darkMode ? 'Light mode' : 'Dark mode'}
        >
          {settings.darkMode ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              'hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-150'
            )}
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <span className="text-xs font-bold text-white select-none">TF</span>
            </div>
          </button>
          {profileOpen && (
            <div className="absolute top-full right-0 mt-2 z-50 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg shadow-black/10 dark:shadow-black/40 animate-slide-up py-2">
              <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-800">
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin User</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Talha Fruit Co.</div>
              </div>
              <button
                onClick={() => { setProfileOpen(false); logout(); }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium',
                  'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30',
                  'transition-all duration-150'
                )}
              >
                <LogOut className="h-4 w-4" />
                <span>{t('header.logout', 'Logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
