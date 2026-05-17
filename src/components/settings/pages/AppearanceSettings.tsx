import React from 'react';
import { cn } from '@/utils/cn';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../BaseComponents';
import { Toggle, Button, SectionDivider, Badge } from '../BaseComponents';
import { ColorPicker } from '../FileUpload';
import { useAppStore } from '@/stores/useAppStore';
import { 
  Moon, 
  Sun, 
  Monitor,
  Type,
  Sparkles,
  CheckCircle2,
  Languages
} from 'lucide-react';

export const AppearanceSettings: React.FC = () => {
  const { settings, updateSettings, setLanguage, setDarkMode } = useAppStore();

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
  ];

  const accentColors = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#8b5cf6', label: 'Violet' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#ef4444', label: 'Red' },
    { value: '#f97316', label: 'Orange' },
    { value: '#eab308', label: 'Yellow' },
    { value: '#22c55e', label: 'Green' },
    { value: '#14b8a6', label: 'Teal' },
    { value: '#06b6d4', label: 'Cyan' },
    { value: '#6366f1', label: 'Indigo' },
    { value: '#f43f5e', label: 'Rose' },
    { value: '#78716c', label: 'Zinc' },
  ];

  const handleUpdate = (updates: Partial<typeof settings.appearance>) => {
    updateSettings({
      appearance: {
        ...settings.appearance,
        ...updates
      }
    });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    handleUpdate({ theme });
    if (theme === 'dark') setDarkMode(true);
    else if (theme === 'light') setDarkMode(false);
    else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
    }
  };

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100">
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose your preferred color theme for the application.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = settings.appearance.theme === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => handleThemeChange(option.value as any)}
                  className={cn(
                    'relative p-4 rounded-xl border-2 text-left transition-all',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={cn(
                      'w-6 h-6',
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500'
                    )} />
                    <span className={cn(
                      'font-medium',
                      isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-900 dark:text-white'
                    )}>
                      {option.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {option.value === 'light' && 'Clean, bright interface'}
                    {option.value === 'dark' && 'Easy on the eyes'}
                    {option.value === 'system' && 'Follows system preference'}
                  </p>
                  
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>
            Customize the accent color used throughout the application.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <ColorPicker
            label="Primary Accent"
            description="Used for buttons, links, and interactive elements"
            value={settings.appearance.accentColor}
            onChange={(color) => handleUpdate({ accentColor: color })}
          />

          <SectionDivider label="Quick Select" />

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => handleUpdate({ accentColor: color.value })}
                className={cn(
                  'w-full aspect-square rounded-lg transition-all',
                  settings.appearance.accentColor === color.value
                    ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                    : 'hover:scale-105'
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
              >
                {settings.appearance.accentColor === color.value && (
                  <CheckCircle2 className="w-full h-full p-1 text-white" />
                )}
              </button>
            ))}
          </div>

          <SectionDivider label="Preview" />
          
          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button 
                  size="sm"
                  style={{ backgroundColor: settings.appearance.accentColor }}
                >
                  Primary Button
                </Button>
                <Badge 
                  variant="info"
                  style={{ 
                    backgroundColor: `${settings.appearance.accentColor}20`,
                    color: settings.appearance.accentColor,
                    borderColor: settings.appearance.accentColor,
                  }}
                >
                  Info Badge
                </Badge>
              </div>
              
              <div className="h-1 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: '60%',
                    backgroundColor: settings.appearance.accentColor,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language & Region</CardTitle>
          <CardDescription>
            Choose your preferred language and regional settings.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setLanguage('english')}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border-2 transition-all',
                settings.appearance.language === 'english'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold">🇺🇸</div>
                <div className="text-left">
                  <p className="font-semibold">English</p>
                  <p className="text-xs text-zinc-500">United States</p>
                </div>
              </div>
              {settings.appearance.language === 'english' && <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </button>
            
            <button
              onClick={() => setLanguage('gujarati')}
              className={cn(
                'flex items-center justify-between p-4 rounded-xl border-2 transition-all',
                settings.appearance.language === 'gujarati'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-lg font-bold">🇮🇳</div>
                <div className="text-left">
                  <p className="font-semibold">ગુજરાતી</p>
                  <p className="text-xs text-zinc-500">India</p>
                </div>
              </div>
              {settings.appearance.language === 'gujarati' && <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Adjust text size and display preferences.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Font Size
            </label>
            
            <div className="grid grid-cols-3 gap-4">
              {fontSizeOptions.map((option) => {
                const isSelected = settings.appearance.fontSize === option.value;
                const fontSize = option.value === 'small' ? '0.875rem' : option.value === 'medium' ? '1rem' : '1.125rem';

                return (
                  <button
                    key={option.value}
                    onClick={() => handleUpdate({ fontSize: option.value as any })}
                    className={cn(
                      'p-4 rounded-xl border-2 text-center transition-all',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
                    )}
                  >
                    <Type 
                      className={cn(
                        'w-6 h-6 mx-auto mb-2',
                        isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500'
                      )} 
                    />
                    <span className={cn(
                      'block font-medium mb-1',
                      isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-900 dark:text-white'
                    )}>
                      {option.label}
                    </span>
                    <span 
                      className="text-zinc-500 dark:text-zinc-400"
                      style={{ fontSize }}
                    >
                      Sample text
                    </span>
                    
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <SectionDivider label="Display Options" />

          <Toggle
            checked={settings.appearance.compactMode}
            onCheckedChange={(checked) => handleUpdate({ compactMode: checked })}
            label="Compact Mode"
            description="Reduce spacing for more content on screen"
          />

          <Toggle
            checked={settings.appearance.lowStockAlert}
            onCheckedChange={(checked) => handleUpdate({ lowStockAlert: checked })}
            label="Low Stock Alerts"
            description="Show visual warnings when inventory is low"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Animations & Effects</CardTitle>
          <CardDescription>
            Control visual effects and motion in the application.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Toggle
            checked={settings.appearance.animations}
            onCheckedChange={(checked) => handleUpdate({ animations: checked })}
            label="Enable Animations"
            description="Smooth transitions and animations throughout the app"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Appearance</CardTitle>
          <CardDescription>
            Restore default appearance settings.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Button 
            variant="outline"
            onClick={() => {
              handleUpdate({
                theme: 'light',
                accentColor: '#3b82f6',
                fontSize: 'medium',
                compactMode: false,
                animations: true,
                language: 'english',
                lowStockAlert: true,
              });
              setDarkMode(false);
              setLanguage('english');
            }}
          >
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
