import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import * as db from '@/db/db';
import type { Company } from '@/db/schema';
import { Save, RefreshCw, Trash2, Moon, Sun, Globe, Building2, Percent, Plus, Edit, X } from 'lucide-react';

export function SettingsPage() {
  const { t } = useTranslation();
  const tx = (key: string, fallback: string) => t(key, { defaultValue: fallback });
  const { 
    settings, updateSettings, showNotification, loadParties, loadSuppliers, loadBills, loadPurchases, loadPayments, loadInventory, 
    parties, suppliers, bills, inventoryItems, language, setLanguage, 
    companies, currentCompany, createCompany, updateCompany, deleteCompany, setCurrentCompany
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState('basic');
  const [form, setForm] = useState({
    businessName: settings.businessName,
    businessAddress: settings.businessAddress,
    city: settings.city,
    state: settings.state,
    phone: settings.phone,
    email: settings.email,
    gstin: settings.gstin,
    commissionPercent: settings.commissionPercent,
    taxPercent: settings.taxPercent,
    currency: settings.currency,
    billPrefix: settings.billPrefix,
    purchasePrefix: settings.purchasePrefix,
    language: language,
    darkMode: settings.darkMode,
    lowStockAlert: settings.lowStockAlert,
  });

  const [showReset, setShowReset] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState<Omit<Company, 'createdAt' | 'updatedAt'>>({
    id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    gstin: '',
    invoicePrefix: '',
    language: 'english',
    theme: 'light',
    isActive: true,
  });

  useEffect(() => {
    setForm({
      businessName: settings.businessName,
      businessAddress: settings.businessAddress,
      city: settings.city,
      state: settings.state,
      phone: settings.phone,
      email: settings.email,
      gstin: settings.gstin,
      commissionPercent: settings.commissionPercent,
      taxPercent: settings.taxPercent,
      currency: settings.currency,
      billPrefix: settings.billPrefix,
      purchasePrefix: settings.purchasePrefix,
      language: language,
      darkMode: settings.darkMode,
      lowStockAlert: settings.lowStockAlert,
    });
  }, [settings, language]);

  const save = () => {
    updateSettings({
      businessName: form.businessName,
      businessAddress: form.businessAddress,
      city: form.city,
      state: form.state,
      phone: form.phone,
      email: form.email,
      gstin: form.gstin,
      commissionPercent: form.commissionPercent,
      taxPercent: form.taxPercent,
      currency: form.currency,
      billPrefix: form.billPrefix,
      purchasePrefix: form.purchasePrefix,
      language: form.language,
      darkMode: form.darkMode,
      lowStockAlert: form.lowStockAlert,
    });
    
    if (form.language !== language) {
      setLanguage(form.language);
    }
    
    if (form.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    showNotification(t('notifications.saved'), 'success');
  };

  const resetAll = () => {
    if (confirm(t('settings.backup'))) {
      localStorage.removeItem('fruit_market_erp_db');
      window.location.reload();
    }
  };

  const seedData = () => {
    db.seedDemoData();
    loadParties();
    loadSuppliers();
    loadBills();
    loadPurchases();
    loadPayments();
    loadInventory();
    showNotification(t('notifications.success'), 'success');
  };

  const handleSaveCompany = () => {
    if (!companyForm.name) {
      showNotification(tx('validation.required', 'Company name is required'), 'error');
      return;
    }

    if (editingCompany) {
      updateCompany({
        ...companyForm,
        id: editingCompany.id,
        createdAt: editingCompany.createdAt,
        updatedAt: new Date().toISOString(),
      });
      showNotification(t('notifications.updated'), 'success');
    } else {
      createCompany({
        ...companyForm,
        id: `company-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      showNotification(t('notifications.created'), 'success');
    }

    setShowCompanyModal(false);
    setEditingCompany(null);
    setCompanyForm({
      id: '',
      name: '',
      address: '',
      city: '',
      state: '',
      phone: '',
      email: '',
      gstin: '',
      invoicePrefix: '',
      language: 'english',
      theme: 'light',
      isActive: true,
    });
  };

  const openCompanyModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setCompanyForm({
        id: company.id,
        name: company.name,
        address: company.address,
        city: company.city,
        state: company.state,
        phone: company.phone,
        email: company.email,
        gstin: company.gstin,
        invoicePrefix: company.invoicePrefix,
        language: company.language,
        theme: company.theme,
        isActive: company.isActive,
      });
    } else {
      setEditingCompany(null);
      setCompanyForm({
        id: '',
        name: '',
        address: '',
        city: '',
        state: '',
        phone: '',
        email: '',
        gstin: '',
        invoicePrefix: '',
        language: 'english',
        theme: 'light',
        isActive: true,
      });
    }
    setShowCompanyModal(true);
  };

  const tabs = [
    { id: 'basic', label: t('settings.basic') },
    { id: 'company', label: t('settings.company') },
    { id: 'billing', label: t('settings.billing') },
    { id: 'language', label: t('settings.language') },
    { id: 'theme', label: t('settings.theme') },
    { id: 'backup', label: t('settings.backup') },
  ];

  const card = 'bg-white dark:bg-[#111318] border border-slate-200 dark:border-[#1e2330] rounded-lg p-5';

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-[15px] font-semibold text-slate-900 dark:text-white">{tx('settings.title', 'Settings')}</h1>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-[#1e2330]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#3b5bdb] text-[#3b5bdb] dark:text-[#8ba4f9]'
                : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Settings */}
      {activeTab === 'basic' && (
        <div className={`${card} max-w-xl space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1a1f2e]">
            <Building2 className="h-4 w-4 text-[#3b5bdb]" />
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{t('settings.businessName')}</span>
          </div>
          <Input
            label={t('settings.businessName')}
            value={form.businessName}
            onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
          />
          <TextArea
            label={t('settings.businessAddress')}
            value={form.businessAddress}
            onChange={e => setForm(f => ({ ...f, businessAddress: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('settings.city')}
              value={form.city}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            />
            <Input
              label={t('settings.state')}
              value={form.state}
              onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
            />
          </div>
          <Input
            label={t('settings.phone')}
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label={t('settings.email')}
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <Input
            label={t('settings.gstin')}
            value={form.gstin}
            onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))}
          />
        </div>
      )}

      {/* Company Management */}
      {activeTab === 'company' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{t('settings.manageCompanies')}</span>
            <Button size="sm" onClick={() => openCompanyModal()}>
              <Plus className="h-3.5 w-3.5" />
              {t('settings.createCompany')}
            </Button>
          </div>

          <div className="space-y-3">
            {companies.map(company => (
              <div key={company.id} className={`${card} flex items-center justify-between ${currentCompany?.id === company.id ? 'border-[#3b5bdb]' : ''}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{company.name}</span>
                    {currentCompany?.id === company.id && (
                      <span className="text-[10px] bg-[#eef2ff] dark:bg-[#1a1f2e] text-[#3b5bdb] dark:text-[#8ba4f9] px-2 py-0.5 rounded font-semibold uppercase tracking-[0.06em]">
                        {tx('settings.active', 'Active')}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">{company.address}</p>
                  <p className="text-[11px] text-slate-400">{company.email}</p>
                </div>
                <div className="flex gap-2">
                  {currentCompany?.id !== company.id && (
                    <Button variant="outline" size="sm" onClick={() => setCurrentCompany(company.id)}>
                      {tx('buttons.switchCompany', 'Switch')}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openCompanyModal(company)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  {companies.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { if (confirm(tx('dialogs.deleteConfirmation', 'Delete this company?'))) { deleteCompany(company.id); showNotification(t('notifications.deleted'), 'success'); } }}
                    >
                      <X className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing Configuration */}
      {activeTab === 'billing' && (
        <div className={`${card} max-w-xl space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1a1f2e]">
            <Percent className="h-4 w-4 text-[#3b5bdb]" />
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{t('settings.billing')}</span>
          </div>
          <Input
            label={t('settings.commissionPercent')}
            type="number"
            value={form.commissionPercent}
            onChange={e => setForm(f => ({ ...f, commissionPercent: parseFloat(e.target.value) || 0 }))}
            suffix="%"
          />
          <Input
            label={t('settings.taxPercent')}
            type="number"
            value={form.taxPercent}
            onChange={e => setForm(f => ({ ...f, taxPercent: parseFloat(e.target.value) || 0 }))}
            suffix="%"
          />
          <Input
            label={t('settings.currency')}
            value={form.currency}
            onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('settings.billPrefix')}
              value={form.billPrefix}
              onChange={e => setForm(f => ({ ...f, billPrefix: e.target.value }))}
            />
            <Input
              label={t('settings.purchasePrefix')}
              value={form.purchasePrefix}
              onChange={e => setForm(f => ({ ...f, purchasePrefix: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* Language Settings */}
      {activeTab === 'language' && (
        <div className={`${card} max-w-xl space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1a1f2e]">
            <Globe className="h-4 w-4 text-[#3b5bdb]" />
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{t('settings.selectLanguage')}</span>
          </div>
          <div className="space-y-3">
            {[
              { value: 'english', label: t('settings.english') },
              { value: 'gujarati', label: t('settings.gujarati') },
            ].map(lang => (
              <button
                key={lang.value}
                onClick={() => setForm(f => ({ ...f, language: lang.value as any }))}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                  form.language === lang.value
                    ? 'border-[#3b5bdb] bg-[#eef2ff] dark:bg-[#1a1f2e]'
                    : 'border-slate-200 dark:border-[#1e2330] hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <p className="text-[13px] font-medium flex-1 text-slate-800 dark:text-slate-200">{lang.label}</p>
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                  form.language === lang.value ? 'border-[#3b5bdb] bg-[#3b5bdb]' : 'border-slate-300'
                }`}>
                  {form.language === lang.value && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Theme Settings */}
      {activeTab === 'theme' && (
        <div className={`${card} max-w-xl space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-[#1a1f2e]">
            <Sun className="h-4 w-4 text-[#3b5bdb]" />
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{t('settings.theme')}</span>
          </div>
          <div className="space-y-3">
            {[
              { value: false, label: t('settings.lightMode'), icon: Sun },
              { value: true, label: t('settings.darkMode'), icon: Moon },
            ].map(theme => {
              const Icon = theme.icon;
              return (
                <button
                  key={String(theme.value)}
                  onClick={() => setForm(f => ({ ...f, darkMode: theme.value }))}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                    form.darkMode === theme.value
                      ? 'border-[#3b5bdb] bg-[#eef2ff] dark:bg-[#1a1f2e]'
                      : 'border-slate-200 dark:border-[#1e2330] hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <Icon className="h-5 w-5 text-slate-500" />
                  <p className="text-[13px] font-medium flex-1 text-slate-800 dark:text-slate-200">{theme.label}</p>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    form.darkMode === theme.value ? 'border-[#3b5bdb] bg-[#3b5bdb]' : 'border-slate-300'
                  }`}>
                    {form.darkMode === theme.value && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`${card} space-y-3`}>
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 block">{t('settings.exportData')}</span>
            <p className="text-[12px] text-slate-500">{tx('settings.exportDescription', 'Export all ERP data as JSON backup file')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const data = localStorage.getItem('fruit_market_erp_db');
                if (data) {
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `erp-backup-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }
              }}
            >
              {t('settings.exportData')}
            </Button>
          </div>

          <div className={`${card} space-y-3`}>
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 block">{t('settings.importData')}</span>
            <p className="text-[12px] text-slate-500">{tx('settings.importDescription', 'Restore from backup JSON file')}</p>
            <input
              type="file"
              accept=".json"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    try {
                      const data = evt.target?.result as string;
                      localStorage.setItem('fruit_market_erp_db', data);
                      window.location.reload();
                    } catch {
                      showNotification(tx('validation.invalidFile', 'Invalid file'), 'error');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
              className="block w-full text-[12px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[#eef2ff] file:text-[#3b5bdb] hover:file:bg-[#e0e7ff] dark:file:bg-[#1a1f2e] dark:file:text-[#8ba4f9]"
            />
          </div>

          <div className={`${card} space-y-3`}>
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 block">{tx('settings.dataStatistics', 'Data Statistics')}</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: t('navigation.parties'), value: parties.length },
                { label: t('navigation.suppliers'), value: suppliers.length },
                { label: t('navigation.billing'), value: bills.length },
                { label: t('navigation.inventory'), value: inventoryItems.length },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 dark:bg-[#0e1017] rounded p-3 text-center">
                  <p className="text-[16px] font-bold tabnum text-slate-800 dark:text-slate-200">{s.value}</p>
                  <p className="text-[11px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} space-y-3`}>
            <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 block">{tx('settings.demoData', 'Demo Data')}</span>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={seedData}>
              <RefreshCw className="h-3.5 w-3.5" />
              {tx('settings.loadDemoData', 'Load Demo Data')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={() => setShowReset(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {tx('settings.resetAllData', 'Reset All Data')}
            </Button>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#1e2330]">
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          {t('common.cancel')}
        </Button>
        <Button size="sm" onClick={save}>
          <Save className="h-3.5 w-3.5" />
          {t('settings.save')}
        </Button>
      </div>

      {/* Company Management Modal */}
      <Modal
        open={showCompanyModal}
        onClose={() => { setShowCompanyModal(false); setEditingCompany(null); }}
        title={editingCompany ? t('settings.editCompany') : t('settings.createCompany')}
      >
        <div className="space-y-4">
          <Input label={t('settings.companyName')} value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} />
          <Input label={t('settings.businessAddress')} value={companyForm.address} onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('settings.city')} value={companyForm.city} onChange={e => setCompanyForm(f => ({ ...f, city: e.target.value }))} />
            <Input label={t('settings.state')} value={companyForm.state} onChange={e => setCompanyForm(f => ({ ...f, state: e.target.value }))} />
          </div>
          <Input label={t('settings.phone')} value={companyForm.phone} onChange={e => setCompanyForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label={t('settings.email')} type="email" value={companyForm.email} onChange={e => setCompanyForm(f => ({ ...f, email: e.target.value }))} />
          <Input label={t('settings.gstin')} value={companyForm.gstin} onChange={e => setCompanyForm(f => ({ ...f, gstin: e.target.value }))} />
          <Input label={t('settings.invoicePrefix')} value={companyForm.invoicePrefix} onChange={e => setCompanyForm(f => ({ ...f, invoicePrefix: e.target.value }))} />
          <Select
            label={t('settings.language')}
            value={companyForm.language}
            onChange={e => setCompanyForm(f => ({ ...f, language: e.target.value as any }))}
            options={[
              { value: 'english', label: t('settings.english') },
              { value: 'gujarati', label: t('settings.gujarati') },
            ]}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" size="sm" onClick={() => { setShowCompanyModal(false); setEditingCompany(null); }}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" onClick={handleSaveCompany}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal open={showReset} onClose={() => setShowReset(false)} title={tx('settings.resetAllData', 'Reset All Data')} size="sm">
        <p className="text-[12px] text-slate-600 dark:text-slate-300 mb-4">
          {tx('settings.resetWarning', 'This will permanently delete all parties, suppliers, bills, payments, inventory, and settings. This action cannot be undone.')}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={() => setShowReset(false)}>{t('common.cancel')}</Button>
          <Button variant="destructive" size="sm" onClick={resetAll}>{tx('settings.confirmResetAll', 'Yes, Reset Everything')}</Button>
        </div>
      </Modal>
    </div>
  );
}
