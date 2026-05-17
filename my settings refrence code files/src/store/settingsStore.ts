import { create } from 'zustand';
import { Settings, DEFAULT_SETTINGS, SettingsCategory } from '../types/settings';

interface SettingsState {
  settings: Settings;
  activeCategory: SettingsCategory;
  isSaving: boolean;
  saveError: string | null;
  searchQuery: string;
  
  // Actions
  setActiveCategory: (category: SettingsCategory) => void;
  updateSettings: <T extends SettingsCategory>(category: T, updates: Partial<Settings[T]>) => void;
  updateNestedSetting: <T extends SettingsCategory>(category: T, path: string, value: any) => void;
  setSettings: (settings: Settings) => void;
  saveSettings: () => Promise<boolean>;
  resetSettings: () => void;
  resetCategory: (category: SettingsCategory) => void;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
  loadSettings: () => void;
}

const STORAGE_KEY = 'billing-settings-storage';

// Load settings from localStorage
const loadFromStorage = (): Partial<SettingsState> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load settings from storage:', e);
  }
  return {};
};

// Save settings to localStorage
const saveToStorage = (state: Partial<SettingsState>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save settings to storage:', e);
  }
};

const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  activeCategory: 'company',
  isSaving: false,
  saveError: null,
  searchQuery: '',

  setActiveCategory: (category) => {
    set({ activeCategory: category });
    saveToStorage({ activeCategory: category });
  },

  updateSettings: (category, updates) => {
    set((state) => {
      const newSettings = {
        ...state.settings,
        [category]: {
          ...state.settings[category],
          ...updates,
        },
      };
      return { settings: newSettings };
    });
    // Auto-save to localStorage
    saveToStorage({ settings: get().settings });
  },

  updateNestedSetting: (category, path, value) => {
    set((state) => {
      const categorySettings = { ...state.settings[category] };
      const keys = path.split('.');
      let current: any = categorySettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      return {
        settings: {
          ...state.settings,
          [category]: categorySettings,
        },
      };
    });
    saveToStorage({ settings: get().settings });
  },

  setSettings: (settings) => {
    set({ settings });
    saveToStorage({ settings });
  },

  saveSettings: async () => {
    set({ isSaving: true, saveError: null });
    
    try {
      // In a real Tauri app, this would call Tauri commands
      // const { invoke } = await import('@tauri-apps/api/core');
      // await invoke('save_settings', { settings: get().settings });
      
      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      set({ isSaving: false });
      return true;
    } catch (error) {
      set({ 
        isSaving: false, 
        saveError: error instanceof Error ? error.message : 'Failed to save settings' 
      });
      return false;
    }
  },

  resetSettings: () => {
    set({ settings: DEFAULT_SETTINGS });
    saveToStorage({ settings: DEFAULT_SETTINGS });
  },

  resetCategory: (category) => {
    set((state) => ({
      settings: {
        ...state.settings,
        [category]: DEFAULT_SETTINGS[category],
      },
    }));
    saveToStorage({ settings: get().settings });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  clearError: () => set({ saveError: null }),

  loadSettings: () => {
    const stored = loadFromStorage();
    if (stored.settings) {
      set({ settings: { ...DEFAULT_SETTINGS, ...stored.settings } });
    }
    if (stored.activeCategory) {
      set({ activeCategory: stored.activeCategory });
    }
  },
}));

// Export selectors for convenient access
export const useSettings = () => useSettingsStore((state) => state.settings);
export const useActiveCategory = () => useSettingsStore((state) => state.activeCategory);
export const useIsSaving = () => useSettingsStore((state) => state.isSaving);
export const useSaveError = () => useSettingsStore((state) => state.saveError);
export const useSearchQuery = () => useSettingsStore((state) => state.searchQuery);
export const useSetActiveCategory = () => useSettingsStore((state) => state.setActiveCategory);
export const useUpdateSettings = () => useSettingsStore((state) => state.updateSettings);
export const useSaveSettings = () => useSettingsStore((state) => state.saveSettings);
export const useResetSettings = () => useSettingsStore((state) => state.resetSettings);
export const useResetCategory = () => useSettingsStore((state) => state.resetCategory);
export const useSetSearchQuery = () => useSettingsStore((state) => state.setSearchQuery);
export const useLoadSettings = () => useSettingsStore((state) => state.loadSettings);

export default useSettingsStore;
