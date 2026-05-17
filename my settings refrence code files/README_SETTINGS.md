# Billing Pro - Settings Module

A professional, production-ready settings module for Tauri + React billing/accounting software.

## Features

### Settings Categories

1. **Company Settings**
   - Company information (name, legal name, GSTIN, PAN)
   - Contact details (email, phone, website)
   - Business address
   - Company logo upload with preview
   - Real-time validation for GSTIN, PAN, email, phone, pincode

2. **Financial Settings**
   - Financial year configuration with auto-generation
   - Currency settings (INR, USD, EUR, GBP, etc.)
   - Tax system (GST, VAT, Sales Tax)
   - Invoice numbering (prefix, starting number)
   - Decimal precision and round-off rules
   - Date/time format and timezone

3. **Invoice Settings** (Enhanced)
   - Template selection (Modern, Classic, Minimal, Professional)
   - Brand color customization
   - Terms & conditions
   - Footer notes
   - QR code enable/disable
   - Auto invoice numbering
   - Signature upload
   - **Live invoice preview with company details and logo**
   - **Print invoice (Thermal & A4 formats)**
   - **Download as PDF**
   - **Share on WhatsApp**

4. **Backup & Database Settings** (Enhanced)
   - Automatic backup configuration
   - Backup frequency (daily, weekly, monthly)
   - Backup location and encryption
   - Manual backup creation
   - **Backup history list with restore/delete options**
   - Database export/import
   - Database health monitoring
   - Restore from backup
   - Database reset (with confirmation)

5. **Appearance Settings**
   - Theme (Light, Dark, System)
   - Accent color picker with presets
   - Font size (Small, Medium, Large)
   - Compact mode toggle
   - Animation preferences
   - Live preview of changes

6. **Security Settings**
   - Password protection
   - Lock timeout configuration
   - Two-factor authentication (2FA)
   - Session management
   - Data encryption
   - Audit logging
   - Security score dashboard

## Invoice/Bill Features

### Invoice Layout

**Top Section:**
- Company Logo (auto-loaded from settings)
- Company Name
- Mobile Number
- Full Address
- GSTIN/PAN (if available)

**Header Section:**
- Bill No. (auto-generated)
- Date
- Customer Name
- Customer Mobile Number

**Main Table:**
| Item | Lot | Caret | Weight | Rate | Amount |
|------|-----|-------|--------|------|--------|
| Gold Chain | G1234 | 24 | 15.5g | ₹5800 | ₹89,900 |

**Payment Summary:**
- Previous Balance
- Today Amount
- Total Due
- Paid Amount
- Remaining Balance

**Footer:**
- Notes section
- Authorized Signature area
- QR Code (optional)
- Company footer notes

### Print/PDF Features

1. **Print Formats:**
   - Thermal printer format (58mm/80mm)
   - A4 invoice format
   - Modern typography
   - Professional spacing

2. **Actions:**
   - Print preview modal
   - Direct print to printer
   - PDF generation and download
   - WhatsApp sharing with prefilled message
   - Invoice preview modal

### WhatsApp Sharing

```typescript
const handleWhatsAppShare = () => {
  const message = `Hello ${customerName}, your invoice ${billNumber} for ₹${remainingBalance.toLocaleString()} is ready. Please check the attached invoice.`;
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
};
```

## Architecture

```
src/
├── components/settings/
│   ├── index.ts                    # Module exports
│   ├── Settings.tsx                # Main settings container
│   ├── SettingsSidebar.tsx         # Navigation sidebar
│   ├── BaseComponents.tsx          # Reusable UI components
│   ├── FileUpload.tsx              # File upload with preview
│   ├── ConfirmationDialog.tsx      # Confirmation dialogs
│   └── pages/
│       ├── CompanySettings.tsx
│       ├── FinancialSettings.tsx
│       ├── InvoiceSettings.tsx     # Enhanced with preview
│       ├── BackupSettings.tsx      # Enhanced with history
│       ├── AppearanceSettings.tsx
│       └── SecuritySettings.tsx
├── store/
│   └── settingsStore.ts            # Zustand state management
└── types/
    └── settings.ts                 # TypeScript types & constants
```

## State Management

Uses Zustand for state management with localStorage persistence:

```typescript
import { useSettings, useUpdateSettings } from './store/settingsStore';

const SettingsPage = () => {
  const settings = useSettings();
  const updateSettings = useUpdateSettings();

  return (
    <input
      value={settings.company.companyName}
      onChange={(e) => updateSettings('company', { companyName: e.target.value })}
    />
  );
};
```

## Tauri Integration

### File Operations

```typescript
// In src-tauri/src/lib.rs
#[tauri::command]
async fn save_settings(settings: String) -> Result<String, String> {
    // Save settings to SQLite or JSON
    Ok("Success".to_string())
}

#[tauri::command]
async fn create_backup(path: String) -> Result<String, String> {
    // Create backup file
    Ok("Success".to_string())
}

#[tauri::command]
async fn restore_backup(path: String) -> Result<String, String> {
    // Restore from backup
    Ok("Success".to_string())
}

#[tauri::command]
async fn delete_backup(path: String) -> Result<String, String> {
    // Delete backup file
    Ok("Success".to_string())
}

#[tauri::command]
async fn generate_pdf(invoice_data: String) -> Result<String, String> {
    // Generate PDF using a PDF library
    Ok("Success".to_string())
}

#[tauri::command]
async fn print_invoice(invoice_data: String, printer_name: String) -> Result<String, String> {
    // Send to printer
    Ok("Success".to_string())
}

// In React component
import { invoke } from '@tauri-apps/api/core';

const handleBackup = async () => {
  await invoke('create_backup', { path: '/path/to/backup' });
};

const handlePrint = async () => {
  await invoke('print_invoice', { invoice_data: JSON.stringify(invoiceData) });
};
```

### WhatsApp Integration

```typescript
// In src-tauri/src/lib.rs
#[tauri::command]
async fn share_whatsapp(phone: String, message: String) -> Result<String, String> {
    // Use system share or open WhatsApp Web
    Ok("Success".to_string())
}
```

## SQLite Persistence

### Settings Table

```sql
CREATE TABLE settings (
    id INTEGER PRIMARY KEY,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);
```

### Backup History Table

```sql
CREATE TABLE backup_history (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER,
    backup_type TEXT NOT NULL,
    encrypted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Invoice Table

```sql
CREATE TABLE invoices (
    id INTEGER PRIMARY KEY,
    bill_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT,
    total_amount REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    remaining_balance REAL NOT NULL,
    invoice_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoice_items (
    id INTEGER PRIMARY KEY,
    invoice_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    lot_number TEXT,
    caret TEXT,
    weight REAL NOT NULL,
    rate REAL NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
```

## Validation

Built-in validation functions:

```typescript
import { 
  validateGSTIN, 
  validatePAN, 
  validateEmail,
  validatePhone,
  validatePincode 
} from './types/settings';

const isGstinValid = validateGSTIN('27AAAAA0000A1Z5'); // true
const isPanValid = validatePAN('ABCDE1234F'); // true
```

## Customization

### Adding New Settings Category

1. Add to `types/settings.ts`:
```typescript
export interface NewSettings {
  // Your fields
}

export const SETTINGS_CATEGORIES = [
  // ... existing
  {
    id: 'new',
    label: 'New Category',
    icon: 'settings',
    description: 'Description',
  },
];
```

2. Create page component in `pages/NewSettings.tsx`

3. Add to main `Settings.tsx` switch statement

4. Add to `index.ts` exports

### Print CSS

Add to `src/index.css`:

```css
@media print {
  body {
    background: white;
  }
  
  .no-print {
    display: none !important;
  }
  
  .print-only {
    display: block !important;
  }
  
  /* Thermal printer (58mm) */
  .thermal-print {
    width: 58mm;
    font-size: 10px;
  }
  
  /* A4 format */
  .a4-print {
    width: 210mm;
    min-height: 297mm;
  }
}
```

## Security Best Practices

- Passwords are never stored in plain text
- Backup files can be encrypted
- Audit logging tracks all changes
- Dangerous actions require confirmation
- Session timeout prevents unauthorized access
- Type-to-confirm for destructive operations

## Performance

- Auto-save with 1-second debounce
- LocalStorage for instant access
- Minimal re-renders with Zustand
- Lazy loading for heavy components
- Efficient backup history management

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- Focus indicators
- ARIA labels
- High contrast mode support
- Print-friendly layouts

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- React 19
- Zustand (state management)
- Tailwind CSS 4
- Lucide React (icons)
- date-fns (date formatting)

## License

Proprietary - Billing Pro
