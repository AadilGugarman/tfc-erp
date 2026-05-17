import React from "react";
import { FinancialSettings } from "../../types/company";
import { CURRENCIES, TAX_TYPES } from "../../data/mockData";
import { Calendar, RefreshCw, AlertCircle } from "lucide-react";

interface FinancialSettingsStepProps {
  data: FinancialSettings;
  onChange: (fields: Partial<FinancialSettings>) => void;
  errors: { [key: string]: string };
}

export const FinancialSettingsStep: React.FC<FinancialSettingsStepProps> = ({
  data,
  onChange,
  errors,
}) => {
  const handleCurrencyChange = (code: string) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (found) {
      onChange({ currency: code, currencySymbol: found.symbol });
    } else {
      onChange({ currency: code });
    }
  };

  const handleAutoGenerateFY = () => {
    const currentYear = new Date().getFullYear();
    // Indian FY: April 1 to March 31 next year
    onChange({
      fyStart: `${currentYear}-04-01`,
      fyEnd: `${currentYear + 1}-03-31`,
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header section */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Financial & Accounting Configuration
        </h2>
      </div>

      {/* Fiscal Calendar & Currency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Year Start */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Financial Year Start <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleAutoGenerateFY}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 animate-spin-hover" />
              <span>Auto-set April 1</span>
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={data.fyStart}
              onChange={(e) => onChange({ fyStart: e.target.value })}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.fyStart
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
          </div>
          {errors.fyStart && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.fyStart}</span>
            </p>
          )}
        </div>

        {/* Financial Year End */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Financial Year End <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={data.fyEnd}
              onChange={(e) => onChange({ fyEnd: e.target.value })}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.fyEnd
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
          </div>
          {errors.fyEnd && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.fyEnd}</span>
            </p>
          )}
        </div>

        {/* Base Currency */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Base Currency <span className="text-red-500">*</span>
          </label>
          <select
            value={data.currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-2xs"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Currency Symbol */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Currency Symbol <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.currencySymbol}
            onChange={(e) => onChange({ currencySymbol: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Invoice Numbering & Tax Rules */}
      <div className="border-t border-slate-200/80 pt-8 space-y-6">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Invoice Sequencing & Tax Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice Prefix */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Invoice Prefix <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.invoicePrefix}
              onChange={(e) => onChange({ invoicePrefix: e.target.value })}
              placeholder="e.g. INV/26-27/"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.invoicePrefix
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
            {errors.invoicePrefix && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.invoicePrefix}</span>
              </p>
            )}
          </div>

          {/* Invoice Starting Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Starting Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.invoiceStartingNumber}
              onChange={(e) =>
                onChange({ invoiceStartingNumber: e.target.value })
              }
              placeholder="e.g. 0001"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.invoiceStartingNumber
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
            {errors.invoiceStartingNumber && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.invoiceStartingNumber}</span>
              </p>
            )}
          </div>

          {/* Tax Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Statutory Tax Type <span className="text-red-500">*</span>
            </label>
            <select
              value={data.taxType}
              onChange={(e) => onChange({ taxType: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-2xs"
            >
              {TAX_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
