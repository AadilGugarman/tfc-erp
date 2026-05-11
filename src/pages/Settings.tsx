import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import * as db from '@/db/db';
import type { Company } from '@/db/schema';
import { Settings as SettingsIcon, Save, RefreshCw, Trash2, Moon, Sun, Globe, Building2, Percent, Plus, Edit, X } from 'lucide-react';

export function SettingsPage() {
  const { t } = useTranslation();
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
      showNotification('Company name is required', 'error');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t('navigation.settings')}</h1>
        <p className="text-sm text-slate-500">{t('settings.title')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Settings */}
      {activeTab === 'basic' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('settings.businessName')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Company Management */}
      {activeTab === 'company' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{t('settings.manageCompanies')}</h2>
            <Button onClick={() => openCompanyModal()} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('settings.createCompany')}
            </Button>
          </div>

          <div className="grid gap-4">
            {companies.map(company => (
              <Card key={company.id} className={currentCompany?.id === company.id ? 'border-emerald-500' : ''}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{company.name}</h3>
                      {currentCompany?.id === company.id && (
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{company.address}</p>
                    <p className="text-xs text-slate-400">{company.email}</p>
                  </div>
                  <div className="flex gap-2">
                    {currentCompany?.id !== company.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentCompany(company.id)}
                      >
                        Switch
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCompanyModal(company)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {companies.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this company?')) {
                            deleteCompany(company.id);
                            showNotification(t('notifications.deleted'), 'success');
                          }
                        }}
                        className="text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Billing Configuration */}
      {activeTab === 'billing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              {t('settings.billing')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-xl">
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
          </CardContent>
        </Card>
      )}

      {/* Language Settings */}
      {activeTab === 'language' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('settings.selectLanguage')}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-w-xl">
            <div className="space-y-3">
              {[
                { value: 'english', label: t('settings.english'), flag: '🇬🇧' },
                { value: 'gujarati', label: t('settings.gujarati'), flag: '🇮🇳' },
              ].map(lang => (
                <button
                  key={lang.value}
                  onClick={() => setForm(f => ({ ...f, language: lang.value as any }))}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all ${
                    form.language === lang.value
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-left flex-1">
                    <p className="font-medium">{lang.label}</p>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    form.language === lang.value ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                  }`}>
                    {form.language === lang.value && <span className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-4">{t('keyboard.shortcuts')} - Language will be applied instantly after saving.</p>
          </CardContent>
        </Card>
      )}

      {/* Theme Settings */}
      {activeTab === 'theme' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5" />
              {t('settings.theme')}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-w-xl">
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
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg border-2 transition-all ${
                      form.darkMode === theme.value
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <p className="font-medium flex-1">{theme.label}</p>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      form.darkMode === theme.value ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}>
                      {form.darkMode === theme.value && <span className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.exportData')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Export all ERP data as JSON file</p>
              <Button
                variant="outline"
                className="w-full"
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.importData')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Restore from backup JSON file</p>
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
                      } catch (error) {
                        showNotification('Invalid file', 'error');
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{parties.length}</p>
                  <p className="text-xs text-slate-500">{t('navigation.parties')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{suppliers.length}</p>
                  <p className="text-xs text-slate-500">{t('navigation.suppliers')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{bills.length}</p>
                  <p className="text-xs text-slate-500">{t('navigation.billing')}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{inventoryItems.length}</p>
                  <p className="text-xs text-slate-500">{t('navigation.inventory')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demo Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full gap-2" onClick={seedData}>
                <RefreshCw className="h-4 w-4" />
                Load Demo Data
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 text-red-500 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => setShowReset(true)}
              >
                <Trash2 className="h-4 w-4" />
                Reset All Data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('common.cancel')}
        </Button>
        <Button onClick={save} className="gap-2 px-8">
          <Save className="h-4 w-4" />
          {t('settings.save')}
        </Button>
      </div>

      {/* Company Management Modal */}
      <Modal
        open={showCompanyModal}
        onClose={() => {
          setShowCompanyModal(false);
          setEditingCompany(null);
        }}
        title={editingCompany ? t('settings.editCompany') : t('settings.createCompany')}
      >
        <div className="space-y-4">
          <Input
            label={t('settings.companyName')}
            value={companyForm.name}
            onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))}
          />
          <Input
            label={t('settings.businessAddress')}
            value={companyForm.address}
            onChange={e => setCompanyForm(f => ({ ...f, address: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('settings.city')}
              value={companyForm.city}
              onChange={e => setCompanyForm(f => ({ ...f, city: e.target.value }))}
            />
            <Input
              label={t('settings.state')}
              value={companyForm.state}
              onChange={e => setCompanyForm(f => ({ ...f, state: e.target.value }))}
            />
          </div>
          <Input
            label={t('settings.phone')}
            value={companyForm.phone}
            onChange={e => setCompanyForm(f => ({ ...f, phone: e.target.value }))}
          />
          <Input
            label={t('settings.email')}
            type="email"
            value={companyForm.email}
            onChange={e => setCompanyForm(f => ({ ...f, email: e.target.value }))}
          />
          <Input
            label={t('settings.gstin')}
            value={companyForm.gstin}
            onChange={e => setCompanyForm(f => ({ ...f, gstin: e.target.value }))}
          />
          <Input
            label={t('settings.invoicePrefix')}
            value={companyForm.invoicePrefix}
            onChange={e => setCompanyForm(f => ({ ...f, invoicePrefix: e.target.value }))}
          />
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
            <Button
              variant="outline"
              onClick={() => {
                setShowCompanyModal(false);
                setEditingCompany(null);
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveCompany}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        open={showReset}
        onClose={() => setShowReset(false)}
        title="⚠️ Reset All Data"
        size="sm"
      >
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          This will permanently delete all parties, suppliers, bills, payments, inventory, and settings. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setShowReset(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="destructive" onClick={resetAll}>
            Yes, Reset Everything
          </Button>
        </div>
      </Modal>
    </div>
  );
}
