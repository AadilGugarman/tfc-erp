import React from "react";
import { CompanyFormData } from "../../types/company";
import { CURRENCIES, TAX_TYPES } from "../../data/mockData";
import {
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Building2,
  Coins,
  ShieldCheck,
  Database,
} from "lucide-react";

interface ReviewConfirmStepProps {
  formData: CompanyFormData;
  onEditStep: (step: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  validationErrors: {
    details: { [key: string]: string };
    financial: { [key: string]: string };
  };
}

export const ReviewConfirmStep: React.FC<ReviewConfirmStepProps> = ({
  formData,
  onEditStep,
  onSubmit,
  isSubmitting,
  validationErrors,
}) => {
  const detailsErrorsCount = Object.keys(validationErrors.details).length;
  const financialErrorsCount = Object.keys(validationErrors.financial).length;
  const totalErrors = detailsErrorsCount + financialErrorsCount;

  const currencyObj = CURRENCIES.find(
    (c) => c.code === formData.financial.currency,
  );
  const taxObj = TAX_TYPES.find((t) => t.id === formData.financial.taxType);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Review Your Business Setup
        </h2>
      </div>

      {totalErrors > 0 ? (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-4 text-red-900 shadow-xs animate-shake">
          <div className="p-2 bg-red-100 rounded-xl text-red-600 shrink-0 mt-0.5">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm tracking-tight text-red-900">
              Action Required: {totalErrors} Missing or Invalid Field
              {totalErrors > 1 ? "s" : ""}
            </h3>
            <p className="text-xs text-red-700 mt-1 leading-normal">
              Please resolve the highlighted discrepancies below before
              continuing. Click the "Edit Section" button next to any incomplete
              block.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-6 flex items-center justify-between gap-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/20 backdrop-blur-xs rounded-2xl text-white shrink-0 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight text-white">
                Your Business Setup is Complete
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5 leading-normal">
                All required details have been verified successfully.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div
          className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
            detailsErrorsCount > 0
              ? "border-red-300 ring-4 ring-red-50"
              : "border-slate-200"
          }`}
        >
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                1. Company Details & Legal Identification
              </h3>
              {detailsErrorsCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                  {detailsErrorsCount} Error{detailsErrorsCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Section</span>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Company Name
              </span>
              <span
                className={`text-sm font-bold block truncate ${formData.details.companyName ? "text-slate-900" : "text-red-500"}`}
              >
                {formData.details.companyName || "Missing Company Name"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Legal Business Name
              </span>
              <span
                className={`text-sm font-bold block truncate ${formData.details.legalName ? "text-slate-900" : "text-red-500"}`}
              >
                {formData.details.legalName || "Missing Legal Name"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                GSTIN (Tax ID)
              </span>
              <span
                className={`text-sm font-mono font-bold block truncate ${
                  formData.details.gstin
                    ? "text-slate-900"
                    : formData.details.country === "India"
                      ? "text-red-500"
                      : "text-slate-500"
                }`}
              >
                {formData.details.gstin ||
                  (formData.details.country === "India"
                    ? "Missing GSTIN"
                    : "N/A")}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                PAN Number
              </span>
              <span
                className={`text-sm font-mono font-bold block truncate ${
                  formData.details.panNumber
                    ? "text-slate-900"
                    : formData.details.country === "India"
                      ? "text-red-500"
                      : "text-slate-500"
                }`}
              >
                {formData.details.panNumber ||
                  (formData.details.country === "India"
                    ? "Missing PAN"
                    : "N/A")}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Operating Address
              </span>
              <span
                className={`text-sm font-semibold block truncate ${formData.details.address ? "text-slate-800" : "text-red-500"}`}
              >
                {formData.details.address
                  ? `${formData.details.address}, ${formData.details.city}, ${formData.details.state} - ${formData.details.pincode}`
                  : "Missing Address"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Country
              </span>
              <span className="text-sm font-bold text-slate-900 block truncate">
                {formData.details.country}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Phone Number
              </span>
              <span
                className={`text-sm font-semibold block truncate ${formData.details.phone ? "text-slate-800" : "text-red-500"}`}
              >
                {formData.details.phone || "Missing Phone"}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
            financialErrorsCount > 0
              ? "border-red-300 ring-4 ring-red-50"
              : "border-slate-200"
          }`}
        >
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <Coins className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 tracking-tight">
                2. Financial & Accounting Configuration
              </h3>
              {financialErrorsCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                  {financialErrorsCount} Error
                  {financialErrorsCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Section</span>
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-8">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Financial Year
              </span>
              <span
                className={`text-sm font-bold block truncate ${formData.financial.fyStart && formData.financial.fyEnd ? "text-slate-900" : "text-red-500"}`}
              >
                {formData.financial.fyStart && formData.financial.fyEnd
                  ? `${formData.financial.fyStart} to ${formData.financial.fyEnd}`
                  : "Missing Dates"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Base Currency
              </span>
              <span className="text-sm font-bold text-slate-900 block truncate">
                {currencyObj
                  ? `${currencyObj.name} (${currencyObj.symbol})`
                  : formData.financial.currency}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Statutory Tax Type
              </span>
              <span className="text-sm font-bold text-slate-900 block truncate">
                {taxObj ? taxObj.name : formData.financial.taxType}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Invoice Sample
              </span>
              <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 block truncate">
                {formData.financial.invoicePrefix}
                {formData.financial.invoiceStartingNumber}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Multi-Tax Hierarchy
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${
                  formData.financial.enableMultiTax
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {formData.financial.enableMultiTax ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Automatic Round Off
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${
                  formData.financial.enableRoundOff
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {formData.financial.enableRoundOff ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-bold text-base tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
            <Database className="w-5 h-5 text-blue-400 animate-pulse" />
            <span>Finalize Your Company Setup</span>
          </h3>
          <p className="text-xs text-slate-400 leading-normal max-w-md">
            Review your information and continue to your company dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={totalErrors > 0 || isSubmitting}
          className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
            totalErrors > 0
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : isSubmitting
                ? "bg-blue-600 text-white animate-pulse"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02]"
          }`}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Processing...</span>
            </>
          ) : totalErrors > 0 ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span>
                Fix {totalErrors} Error{totalErrors > 1 ? "s" : ""} to Continue
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Continue to Dashboard</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
