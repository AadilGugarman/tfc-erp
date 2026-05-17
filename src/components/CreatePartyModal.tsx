import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  MapPin,
  DollarSign,
  StickyNote,
  ChevronRight,
  Check,
  Info,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Hash,
  AlertCircle,
} from "lucide-react";
import type { Party, LedgerType, PartyType } from "@/db/schema";
import { cn } from "@/utils/cn";

type Section = "basic" | "address" | "financial" | "notes";

const SECTIONS: {
  id: Section;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: "basic",
    label: "Basic Info",
    icon: User,
    description: "Name, contact & party type",
  },
  {
    id: "address",
    label: "Address",
    icon: MapPin,
    description: "Location & details",
  },
  {
    id: "financial",
    label: "Financial",
    icon: DollarSign,
    description: "Balance & credit info",
  },
  { id: "notes", label: "Notes", icon: StickyNote, description: "Remarks" },
];

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ElementType;
  hint?: string;
  error?: string;
  required?: boolean;
}

const FormInput: React.FC<InputProps> = ({
  label,
  icon: Icon,
  hint,
  error,
  required,
  className,
  ...props
}) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
      {label}
      {required && <span className="text-rose-400">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-350">
          <Icon size={14} className="text-slate-300" strokeWidth={2} />
        </div>
      )}
      <input
        className={`
          premium-input w-full bg-white border border-slate-200 rounded-xl text-sm text-slate-700
          placeholder:text-slate-300 transition-all duration-150
          focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
          hover:border-slate-300
          ${Icon ? "pl-9" : "pl-3.5"} pr-3.5 py-2.5
          ${
            error
              ? "border-rose-300 focus:border-rose-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.08)]"
              : ""
          }
          ${className || ""}
        `}
        {...props}
      />
    </div>
    {hint && !error && (
      <p className="text-[11px] text-slate-400 flex items-center gap-1">
        <Info size={10} />
        {hint}
      </p>
    )}
    {error && (
      <p className="text-[11px] text-rose-500 flex items-center gap-1">
        <AlertCircle size={10} />
        {error}
      </p>
    )}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ElementType;
  required?: boolean;
  options: { value: string; label: string }[];
}

const FormSelect: React.FC<SelectProps> = ({
  label,
  icon: Icon,
  required,
  options,
  className,
  ...props
}) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
      {label}
      {required && <span className="text-rose-400">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Icon size={14} className="text-slate-300" strokeWidth={2} />
        </div>
      )}
      <select
        className={`
          premium-input w-full bg-white border border-slate-200 rounded-xl text-sm text-slate-700
          transition-all duration-150 appearance-none
          focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
          hover:border-slate-300 cursor-pointer
          ${Icon ? "pl-9" : "pl-3.5"} pr-8 py-2.5
          ${className || ""}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronRight
        size={12}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none"
      />
    </div>
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: React.ElementType;
  hint?: string;
}

const FormTextarea: React.FC<TextareaProps> = ({
  label,
  icon: Icon,
  hint,
  className,
  ...props
}) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 uppercase tracking-wide">
      {label}
    </label>
    <textarea
      className={`
        premium-input w-full bg-white border border-slate-200 rounded-xl text-sm text-slate-700
        placeholder:text-slate-300 transition-all duration-150 resize-none
        focus:outline-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
        hover:border-slate-300 px-3.5 py-2.5
        ${className || ""}
      `}
      {...props}
    />
    {hint && (
      <p className="text-[11px] text-slate-400 flex items-center gap-1">
        <Info size={10} />
        {hint}
      </p>
    )}
  </div>
);

interface SectionNavProps {
  active: Section;
  completed: Set<Section>;
  onChange: (s: Section) => void;
}

const SectionNav: React.FC<SectionNavProps> = ({
  active,
  completed,
  onChange,
}) => (
  <nav className="flex flex-col gap-1 p-2">
    {SECTIONS.map((section, idx) => {
      const isActive = active === section.id;
      const isCompleted = completed.has(section.id);
      const Icon = section.icon;
      return (
        <button
          key={section.id}
          onClick={() => onChange(section.id)}
          className={`
            group flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150 w-full
            ${
              isActive
                ? "bg-indigo-50 border border-indigo-100"
                : "hover:bg-slate-50 border border-transparent"
            }
          `}
        >
          <div
            className={`
            shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all
            ${
              isActive
                ? "bg-indigo-100"
                : isCompleted
                  ? "bg-emerald-50"
                  : "bg-slate-50"
            }
          `}
          >
            {isCompleted && !isActive ? (
              <Check size={13} className="text-emerald-500" strokeWidth={2.5} />
            ) : (
              <Icon
                size={14}
                className={isActive ? "text-indigo-600" : "text-slate-400"}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`text-xs font-semibold leading-tight ${
                isActive ? "text-indigo-700" : "text-slate-600"
              }`}
            >
              {section.label}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">
              {section.description}
            </div>
          </div>
          <div className="text-[10px] font-bold text-slate-300">{idx + 1}</div>
        </button>
      );
    })}
  </nav>
);

interface CreatePartyModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    phone: string;
    email: string;
    gstin: string;
    address: string;
    shippingAddress: string;
    city: string;
    state: string;
    openingBalance: number;
    balanceType: LedgerType;
    commissionPercent: number;
    creditLimit: number;
    partyType: PartyType;
    notes: string;
  }) => void;
  editParty?: Party | null;
}

export const CreatePartyModal: React.FC<CreatePartyModalProps> = ({
  open,
  onClose,
  onSave,
  editParty,
}) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gstin: "",
    address: "",
    shippingAddress: "",
    city: "",
    state: "",
    openingBalance: 0,
    balanceType: "debit" as LedgerType,
    commissionPercent: 3,
    creditLimit: 0,
    partyType: "customer" as PartyType,
    notes: "",
  });

  const [activeSection, setActiveSection] = useState<Section>("basic");
  const [completed, setCompleted] = useState<Set<Section>>(new Set());
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setForm({
        name: "",
        phone: "",
        email: "",
        gstin: "",
        address: "",
        shippingAddress: "",
        city: "",
        state: "",
        openingBalance: 0,
        balanceType: "debit",
        commissionPercent: 3,
        creditLimit: 0,
        partyType: "customer",
        notes: "",
      });
      setActiveSection("basic");
      setCompleted(new Set());
      setErrors({});
    } else if (editParty) {
      setForm({
        name: editParty.name,
        phone: editParty.phone,
        email: editParty.email,
        gstin: editParty.gstin,
        address: editParty.address,
        shippingAddress: editParty.shippingAddress || "",
        city: editParty.city,
        state: editParty.state,
        openingBalance: editParty.openingBalance,
        balanceType: editParty.balanceType,
        commissionPercent: editParty.commissionPercent,
        creditLimit: editParty.creditLimit || 0,
        partyType: editParty.partyType,
        notes: editParty.notes,
      });
    }
  }, [open, editParty]);

  const update = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const validateBasic = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Party name is required";
    if (!form.partyType) errs.partyType = "Party type is required";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Enter a valid email";
    return errs;
  };

  const handleNext = () => {
    if (activeSection === "basic") {
      const errs = validateBasic();
      if (Object.keys(errs).length) {
        setErrors(errs);
        return;
      }
    }
    setCompleted((prev) => new Set([...prev, activeSection]));
    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
    if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].id);
  };

  const handleSave = () => {
    const errs = validateBasic();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setActiveSection("basic");
      return;
    }
    onSave(form);
    onClose();
  };

  const currentSectionIdx = SECTIONS.findIndex((s) => s.id === activeSection);
  const isLastSection = currentSectionIdx === SECTIONS.length - 1;

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15, 20, 40, 0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 820,
          maxHeight: "min(92vh, 700px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              {editParty ? "Edit Party" : "New Party"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Step {currentSectionIdx + 1} of {SECTIONS.length} —{" "}
              {SECTIONS[currentSectionIdx].description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Nav — hidden on small screens */}
          <div className="hidden md:flex flex-col w-[196px] shrink-0 bg-slate-50/60 border-r border-slate-100 py-2">
            <SectionNav
              active={activeSection}
              completed={completed}
              onChange={setActiveSection}
            />
            <div className="mt-auto px-4 pb-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-indigo-600 mb-1">
                  Quick Tip
                </p>
                <p className="text-[10px] text-indigo-500 leading-relaxed">
                  Fields marked with{" "}
                  <span className="text-rose-400 font-bold">*</span> are
                  required. You can always edit details later.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile section tabs */}
          <div className="md:hidden flex items-center gap-1 px-4 py-2 border-b border-slate-100 bg-slate-50/60 overflow-x-auto shrink-0">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  activeSection === s.id
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-white text-slate-500 border border-slate-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Form content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* BASIC INFORMATION */}
              {activeSection === "basic" && (
                <>
                  <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <User size={12} className="text-indigo-600" />
                      </div>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <FormInput
                          label="Party Name"
                          icon={Building2}
                          placeholder="e.g. ABC Trading Company"
                          value={form.name}
                          onChange={(e) => update("name", e.target.value)}
                          required
                          error={errors.name}
                        />
                      </div>
                      <FormSelect
                        label="Party Type"
                        icon={Briefcase}
                        value={form.partyType}
                        onChange={(e) =>
                          update("partyType", e.target.value as PartyType)
                        }
                        required
                        options={[
                          { value: "customer", label: "Customer" },
                          { value: "supplier", label: "Supplier" },
                          {
                            value: "both",
                            label: "Both (Customer & Supplier)",
                          },
                        ]}
                      />
                      <FormInput
                        label="GSTIN"
                        icon={Hash}
                        placeholder="15-digit GST ID"
                        value={form.gstin}
                        onChange={(e) => update("gstin", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                      Contact Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormInput
                        label="Email Address"
                        icon={Mail}
                        placeholder="party@company.com"
                        type="email"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        error={errors.email}
                      />
                      <FormInput
                        label="Phone Number"
                        icon={Phone}
                        placeholder="+91 98765 43210"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ADDRESS DETAILS */}
              {activeSection === "address" && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center">
                      <MapPin size={12} className="text-sky-600" />
                    </div>
                    Address Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <FormInput
                        label="Address"
                        icon={MapPin}
                        placeholder="Street address, building, etc."
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FormInput
                        label="Shipping Address"
                        placeholder="Shipping address (optional)"
                        value={form.shippingAddress}
                        onChange={(e) =>
                          update("shippingAddress", e.target.value)
                        }
                      />
                    </div>
                    <FormInput
                      label="City"
                      placeholder="e.g. Mumbai"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                    />
                    <FormInput
                      label="State"
                      placeholder="e.g. Maharashtra"
                      value={form.state}
                      onChange={(e) => update("state", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* FINANCIAL DETAILS */}
              {activeSection === "financial" && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <DollarSign size={12} className="text-emerald-600" />
                    </div>
                    Financial Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormInput
                      label="Opening Balance"
                      icon={DollarSign}
                      type="number"
                      placeholder="₹ 0.00"
                      value={form.openingBalance}
                      onChange={(e) =>
                        update(
                          "openingBalance",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                    <FormSelect
                      label="Balance Type"
                      value={form.balanceType}
                      onChange={(e) =>
                        update("balanceType", e.target.value as LedgerType)
                      }
                      options={[
                        { value: "debit", label: "Debit (We receive)" },
                        { value: "credit", label: "Credit (They receive)" },
                      ]}
                    />
                    <FormInput
                      label="Credit Limit"
                      icon={DollarSign}
                      type="number"
                      placeholder="₹ 0.00"
                      value={form.creditLimit}
                      onChange={(e) =>
                        update("creditLimit", parseFloat(e.target.value) || 0)
                      }
                    />
                    <FormInput
                      label="Commission %"
                      type="number"
                      placeholder="3"
                      value={form.commissionPercent}
                      onChange={(e) =>
                        update(
                          "commissionPercent",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              {/* NOTES */}
              {activeSection === "notes" && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                      <StickyNote size={12} className="text-amber-600" />
                    </div>
                    Additional Notes
                  </h3>
                  <FormTextarea
                    label="Notes"
                    placeholder="Any additional remarks or information about this party..."
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={6}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {currentSectionIdx < SECTIONS.length - 1 && (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight size={14} />
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              {editParty
                ? "Update Party"
                : isLastSection
                  ? "Save Party"
                  : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
