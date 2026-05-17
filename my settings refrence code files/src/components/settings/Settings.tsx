import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import { SettingsSidebar, SettingsMobileHeader } from './SettingsSidebar';
import { Button, Alert } from './BaseComponents';
import { SETTINGS_CATEGORIES } from '../../types/settings';
import { useSettings, useActiveCategory, useSearchQuery, useIsSaving, useSaveError } from '../../store/settingsStore';
import { useSetActiveCategory, useSetSearchQuery, useSaveSettings, useLoadSettings } from '../../store/settingsStore';
import { CompanySettings } from './pages/CompanySettings';
import { FinancialSettings } from './pages/FinancialSettings';
import { InvoiceSettings } from './pages/InvoiceSettings';
import { BackupSettings } from './pages/BackupSettings';
import { AppearanceSettings } from './pages/AppearanceSettings';
import { SecuritySettings } from './pages/SecuritySettings';
import { Save, Settings as SettingsIcon, X } from 'lucide-react';

export const Settings: React.FC = () => {
  const settings = useSettings();
  const activeCategory = useActiveCategory();
  const searchQuery = useSearchQuery();
  const isSaving = useIsSaving();
  const saveError = useSaveError();
  
  const setActiveCategory = useSetActiveCategory();
  const setSearchQuery = useSetSearchQuery();
  const saveSettings = useSaveSettings();
  const loadSettings = useLoadSettings();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showSaveNotification, setShowSaveNotification] = React.useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Auto-save with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (settings) {
        await saveSettings();
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 2000);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [settings, saveSettings]);

  // Handle theme changes
  useEffect(() => {
    const root = document.documentElement;
    const theme = settings.appearance.theme;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.appearance.theme]);

  // Handle font size
  useEffect(() => {
    const root = document.documentElement;
    const fontSize = settings.appearance.fontSize;
    
    if (fontSize === 'small') {
      root.style.fontSize = '14px';
    } else if (fontSize === 'large') {
      root.style.fontSize = '16px';
    } else {
      root.style.fontSize = '15px';
    }
  }, [settings.appearance.fontSize]);

  const renderContent = () => {
    switch (activeCategory) {
      case 'company':
        return <CompanySettings />;
      case 'financial':
        return <FinancialSettings />;
      case 'invoice':
        return <InvoiceSettings />;
      case 'backup':
        return <BackupSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'security':
        return <SecuritySettings />;
      default:
        return <CompanySettings />;
    }
  };

  const activeCategoryConfig = SETTINGS_CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <SettingsSidebar
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <SettingsMobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
                <span>/</span>
                <span className="text-zinc-900 dark:text-white">{activeCategoryConfig?.label}</span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                {activeCategoryConfig?.label} Settings
              </h1>
              
              <p className="text-zinc-600 dark:text-zinc-400">
                {activeCategoryConfig?.description}
              </p>
            </div>

            {/* Save Status */}
            {showSaveNotification && (
              <div className="mb-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Save className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Settings saved successfully
                </span>
              </div>
            )}

            {/* Error Alert */}
            {saveError && (
              <Alert variant="error" className="mb-6">
                <div className="flex items-center justify-between">
                  <span>{saveError}</span>
                  <button 
                    onClick={() => setShowSaveNotification(false)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </Alert>
            )}

            {/* Settings Content */}
            <div className={cn(
              'transition-all duration-300',
              searchQuery ? 'opacity-50 pointer-events-none' : 'opacity-100'
            )}>
              {renderContent()}
            </div>

            {/* Search Results Empty State */}
            {searchQuery && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                  <SettingsIcon className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  No settings found
                </h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                  We couldn't find any settings matching "{searchQuery}"
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Save Button (Fixed at bottom on mobile) */}
        <div className="lg:hidden p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Button 
            className="w-full"
            onClick={saveSettings}
            isLoading={isSaving}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
