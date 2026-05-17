import React from "react";
import { CompanyDetails } from "../../types/company";
import {
  Building,
  MapPin,
  Phone,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface CompanyDetailsStepProps {
  data: CompanyDetails;
  onChange: (fields: Partial<CompanyDetails>) => void;
  errors: { [key: string]: string };
}

export const CompanyDetailsStep: React.FC<CompanyDetailsStepProps> = ({
  data,
  onChange,
  errors,
}) => {
  const handleLogoUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fakeUrl = URL.createObjectURL(file);
      onChange({ logoUrl: fakeUrl });
    }
  };

  const sampleLogos = [
    {
      name: "BlueTech",
      url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "ApexCube",
      url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&auto=format&fit=crop&q=80",
    },
    {
      name: "Hexagon",
      url: "https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Company Details & Legal Identification
        </h2>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
          Company Logo
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-xs shrink-0 group hover:border-blue-500 transition-colors">
            {data.logoUrl ? (
              <img
                src={data.logoUrl}
                alt="Company Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <Building className="w-8 h-8 text-slate-300 group-hover:text-blue-500 transition-colors" />
            )}
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap gap-3 items-center">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUploadSim}
                />
              </label>

              <span className="text-xs text-slate-400 font-medium">
                OR select preset logo:
              </span>

              <div className="flex items-center gap-2">
                {sampleLogos.map((logo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChange({ logoUrl: logo.url })}
                    className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      data.logoUrl === logo.url
                        ? "border-blue-600 ring-2 ring-blue-100 scale-105"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                    title={logo.name}
                  >
                    <img
                      src={logo.url}
                      alt={logo.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Recommended size: 512x512px (PNG, JPG). This logo will be
              automatically rendered on your tax invoices, estimates, and
              customer statements.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Company Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={data.companyName}
              onChange={(e) => onChange({ companyName: e.target.value })}
              placeholder="e.g. Acme Technologies"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.companyName
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
          </div>
          {errors.companyName ? (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.companyName}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">
              The commercial trade name shown in your software header.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Legal Business Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={data.legalName}
              onChange={(e) => onChange({ legalName: e.target.value })}
              placeholder="e.g. Acme Technologies Private Limited"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.legalName
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
          </div>
          {errors.legalName ? (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.legalName}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">
              Official registered name on statutory tax documents.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            GSTIN (Tax ID){" "}
            {data.country === "India" && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.gstin}
              onChange={(e) =>
                onChange({ gstin: e.target.value.toUpperCase() })
              }
              placeholder="e.g. 29ABCDE1234F1Z5"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.gstin
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : data.gstin && !errors.gstin
                    ? "border-emerald-300 focus:ring-emerald-100 focus:border-emerald-500"
                    : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
            {data.gstin && !errors.gstin && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
          {errors.gstin ? (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.gstin}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">
              15-digit alphanumeric Goods and Services Tax Identification
              Number.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            PAN Number{" "}
            {data.country === "India" && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.panNumber}
              onChange={(e) =>
                onChange({ panNumber: e.target.value.toUpperCase() })
              }
              placeholder="e.g. ABCDE1234F"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-mono font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.panNumber
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : data.panNumber && !errors.panNumber
                    ? "border-emerald-300 focus:ring-emerald-100 focus:border-emerald-500"
                    : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
            {data.panNumber && !errors.panNumber && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-500">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
          {errors.panNumber ? (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errors.panNumber}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">
              10-character alphanumeric Permanent Account Number.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200/80 pt-8 space-y-6">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Business Address & Contact Info
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={data.country}
              onChange={(e) => onChange({ country: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-2xs"
            >
              <option value="India">India 🇮🇳</option>
              <option value="United States">United States 🇺🇸</option>
              <option value="United Kingdom">United Kingdom 🇬🇧</option>
              <option value="United Arab Emirates">
                United Arab Emirates 🇦🇪
              </option>
              <option value="Singapore">Singapore 🇸🇬</option>
              <option value="Germany">Germany 🇩🇪</option>
              <option value="Australia">Australia 🇦🇺</option>
              <option value="Canada">Canada 🇨🇦</option>
            </select>
            <p className="text-[11px] text-slate-400">
              Changing country automatically adapts financial defaults in Step
              2.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Street Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={data.address}
                onChange={(e) => onChange({ address: e.target.value })}
                placeholder="e.g. 42, Cyber Park, Phase 1"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.address
                    ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                    : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
                }`}
              />
            </div>
            {errors.address && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.address}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="e.g. Bengaluru"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.city
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
            {errors.city && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.city}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              State / Province <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.state}
              onChange={(e) => onChange({ state: e.target.value })}
              placeholder="e.g. Karnataka"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.state
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
            {errors.state && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.state}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pincode / Zip Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={data.pincode}
              onChange={(e) => onChange({ pincode: e.target.value })}
              placeholder="e.g. 560100"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                errors.pincode
                  ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                  : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
              }`}
            />
            {errors.pincode && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.pincode}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={data.phone}
                onChange={(e) => onChange({ phone: e.target.value })}
                placeholder="e.g. +91 80 5555 1234"
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium bg-white focus:outline-hidden focus:ring-2 transition-all ${
                  errors.phone
                    ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                    : "border-slate-200 focus:ring-blue-100 focus:border-blue-500"
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.phone}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
