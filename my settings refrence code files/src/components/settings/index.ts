// ====================
// Settings Module Exports
// ====================

// Main Settings Component
export { Settings } from './Settings';

// Layout Components
export { SettingsSidebar, SettingsMobileHeader } from './SettingsSidebar';

// Base UI Components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Select,
  Toggle,
  Button,
  SectionDivider,
  Label,
  Badge,
  Alert,
} from './BaseComponents';

// Specialized Components
export { FileUpload, ColorPicker } from './FileUpload';
export { ConfirmationDialog, DangerDialog, DangerDialogWithInput } from './ConfirmationDialog';

// Settings Pages
export { CompanySettings } from './pages/CompanySettings';
export { FinancialSettings } from './pages/FinancialSettings';
export { InvoiceSettings } from './pages/InvoiceSettings';
export { BackupSettings } from './pages/BackupSettings';
export { AppearanceSettings } from './pages/AppearanceSettings';
export { SecuritySettings } from './pages/SecuritySettings';

// Store & Hooks
export {
  useSettings,
  useActiveCategory,
  useIsSaving,
  useSaveError,
  useSearchQuery,
  useSetActiveCategory,
  useUpdateSettings,
  useSaveSettings,
  useResetSettings,
  useResetCategory,
  useSetSearchQuery,
  useLoadSettings,
} from '../../store/settingsStore';

// Types
export type {
  Settings as SettingsType,
  CompanySettings as CompanySettingsType,
  FinancialSettings as FinancialSettingsType,
  InvoiceSettings as InvoiceSettingsType,
  BackupSettings as BackupSettingsType,
  AppearanceSettings as AppearanceSettingsType,
  SecuritySettings as SecuritySettingsType,
  BackupInfo,
  InvoiceItem,
  InvoiceDetails,
  SettingsCategory,
  SettingsCategoryConfig,
  ValidationErrors,
} from '../../types/settings';

// Constants
export { SETTINGS_CATEGORIES, DEFAULT_SETTINGS } from '../../types/settings';

// Validation Functions
export {
  validateGSTIN,
  validatePAN,
  validateEmail,
  validatePhone,
  validatePincode,
} from '../../types/settings';
