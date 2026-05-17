import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../BaseComponents';
import { Input, Select, Button, SectionDivider, Badge } from '../BaseComponents';
import { useAppStore } from '@/stores/useAppStore';
import { Calendar, DollarSign, Settings as SettingsIcon } from 'lucide-react';

export const FinancialSettings: React.FC = () => {
  const { settings, updateSettings } = useAppStore();

  const currencyOptions = [
    { value: 'INR', label: '₹ Indian Rupee (INR)' },
    { value: 'USD', label: '$ US Dollar (USD)' },
    { value: 'EUR', label: '€ Euro (EUR)' },
    { value: 'GBP', label: '£ British Pound (GBP)' },
    { value: 'AUD', label: 'A$ Australian Dollar (AUD)' },
    { value: 'CAD', label: 'C$ Canadian Dollar (CAD)' },
    { value: 'SGD', label: 'S$ Singapore Dollar (SGD)' },
    { value: 'AED', label: 'د.إ UAE Dirham (AED)' },
  ];

  const currencySymbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    AED: 'د.إ',
  };

  const taxSystemOptions = [
    { value: 'GST', label: 'GST (Goods and Services Tax)' },
    { value: 'VAT', label: 'VAT (Value Added Tax)' },
    { value: 'Sales Tax', label: 'Sales Tax' },
    { value: 'None', label: 'No Tax' },
  ];

  const roundOffOptions = [
    { value: 'nearest', label: 'Round to nearest' },
    { value: 'up', label: 'Round up' },
    { value: 'down', label: 'Round down' },
    { value: 'bankers', label: "Banker's rounding" },
  ];

  const dateFormatOptions = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (e.g., 25/12/2024)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (e.g., 12/25/2024)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (e.g., 2024-12-25)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (e.g., 25-12-2024)' },
    { value: 'MMMM DD, YYYY', label: 'MMMM DD, YYYY (e.g., December 25, 2024)' },
  ];

  const timeFormatOptions = [
    { value: '24h', label: '24-hour (e.g., 14:30)' },
    { value: '12h', label: '12-hour (e.g., 2:30 PM)' },
  ];

  const timezoneOptions = [
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST) - UTC+5:30' },
    { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
    { value: 'America/New_York', label: 'Eastern Time (ET) - UTC-5' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - UTC-8' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST) - UTC+4' },
    { value: 'Asia/Singapore', label: 'Singapore Standard Time (SGT) - UTC+8' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET) - UTC+10' },
  ];

  const handleUpdate = (updates: Partial<typeof settings.financial>) => {
    updateSettings({
      financial: {
        ...settings.financial,
        ...updates
      }
    });
  };

  const handleCurrencyChange = (value: string) => {
    handleUpdate({ 
      currency: value,
      currencySymbol: currencySymbols[value] || value,
    });
  };

  const generateNextFY = () => {
    const now = new Date();
    const startYear = now.getFullYear();
    const endYear = startYear + 1;
    
    const start = new Date(startYear, 3, 1); // April 1st
    const end = new Date(endYear, 2, 31); // March 31st
    
    handleUpdate({
      financialYearStart: start.toISOString().split('T')[0],
      financialYearEnd: end.toISOString().split('T')[0],
    });
  };

  const invoicePreview = `${settings.financial.invoicePrefix}-${String(settings.financial.invoiceStartingNumber).padStart(6, '0')}`;
  const purchasePreview = `${settings.financial.purchasePrefix}-${String(settings.financial.purchaseStartingNumber).padStart(6, '0')}`;
  const vehiclePreview = `${settings.financial.vehiclePrefix}-${String(settings.financial.vehicleStartingNumber).padStart(6, '0')}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Year</CardTitle>
              <CardDescription>
                Define your financial year for accounting and reporting purposes.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={generateNextFY}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Auto-generate
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Financial Year Start"
              type="date"
              value={settings.financial.financialYearStart}
              onChange={(e) => handleUpdate({ financialYearStart: e.target.value })}
            />
            
            <Input
              label="Financial Year End"
              type="date"
              value={settings.financial.financialYearEnd}
              onChange={(e) => handleUpdate({ financialYearEnd: e.target.value })}
            />
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Current Financial Year:</span>{' '}
              {new Date(settings.financial.financialYearStart).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}{' '}
              to{' '}
              {new Date(settings.financial.financialYearEnd).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>
            Configure the default currency for all transactions and invoices.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Currency"
              value={settings.financial.currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              options={currencyOptions}
            />
            
            <Input
              label="Currency Symbol"
              value={settings.financial.currencySymbol}
              onChange={(e) => handleUpdate({ currencySymbol: e.target.value })}
              description="Symbol displayed before amounts"
            />
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-white">
                  Preview
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  How amounts will appear
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                {settings.financial.currencySymbol}1,234.56
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {settings.financial.currency}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
          <CardDescription>
            Set up your tax system for invoicing and compliance.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Select
            label="Tax System"
            value={settings.financial.taxSystem}
            onChange={(e) => handleUpdate({ taxSystem: e.target.value as any })}
            options={taxSystemOptions}
            description="Select the tax system applicable to your business"
          />

          <SectionDivider label="Rounding Rules" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Decimal Precision"
              value={settings.financial.decimalPrecision.toString()}
              onChange={(e) => handleUpdate({ decimalPrecision: parseInt(e.target.value) })}
              options={[
                { value: '0', label: 'No decimals (e.g., ₹100)' },
                { value: '1', label: '1 decimal (e.g., ₹100.5)' },
                { value: '2', label: '2 decimals (e.g., ₹100.50)' },
                { value: '3', label: '3 decimals (e.g., ₹100.500)' },
              ]}
            />
            
            <Select
              label="Round Off Rule"
              value={settings.financial.roundOffRule}
              onChange={(e) => handleUpdate({ roundOffRule: e.target.value as any })}
              options={roundOffOptions}
              description="How to handle fractional amounts"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sequential Numbering</CardTitle>
          <CardDescription>
            Configure prefixes and starting points for your documents.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Invoice / Bill</h4>
              <Input
                label="Prefix"
                value={settings.financial.invoicePrefix}
                onChange={(e) => handleUpdate({ invoicePrefix: e.target.value.toUpperCase() })}
              />
              <Input
                label="Starting #"
                type="number"
                value={settings.financial.invoiceStartingNumber}
                onChange={(e) => handleUpdate({ invoiceStartingNumber: parseInt(e.target.value) || 1 })}
              />
              <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                Preview: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{invoicePreview}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Purchase Order</h4>
              <Input
                label="Prefix"
                value={settings.financial.purchasePrefix}
                onChange={(e) => handleUpdate({ purchasePrefix: e.target.value.toUpperCase() })}
              />
              <Input
                label="Starting #"
                type="number"
                value={settings.financial.purchaseStartingNumber}
                onChange={(e) => handleUpdate({ purchaseStartingNumber: parseInt(e.target.value) || 1 })}
              />
              <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                Preview: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{purchasePreview}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Vehicle Register</h4>
              <Input
                label="Prefix"
                value={settings.financial.vehiclePrefix}
                onChange={(e) => handleUpdate({ vehiclePrefix: e.target.value.toUpperCase() })}
              />
              <Input
                label="Starting #"
                type="number"
                value={settings.financial.vehicleStartingNumber}
                onChange={(e) => handleUpdate({ vehicleStartingNumber: parseInt(e.target.value) || 1 })}
              />
              <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded border border-zinc-200 dark:border-zinc-700">
                Preview: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{vehiclePreview}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date & Time Format</CardTitle>
          <CardDescription>
            Configure how dates and times are displayed throughout the application.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Date Format"
              value={settings.financial.dateFormat}
              onChange={(e) => handleUpdate({ dateFormat: e.target.value })}
              options={dateFormatOptions}
            />
            
            <Select
              label="Time Format"
              value={settings.financial.timeFormat}
              onChange={(e) => handleUpdate({ timeFormat: e.target.value as any })}
              options={timeFormatOptions}
            />
          </div>

          <Select
            label="Timezone"
            value={settings.financial.timezone}
            onChange={(e) => handleUpdate({ timezone: e.target.value })}
            options={timezoneOptions}
            description="Used for timestamps and scheduling"
          />

          <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">Current Time:</span>{' '}
              {new Date().toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: settings.financial.timezone,
              })}
              {' '}({settings.financial.timezone.split('/')[1]?.replace(/_/g, ' ') || 'Local'})
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
