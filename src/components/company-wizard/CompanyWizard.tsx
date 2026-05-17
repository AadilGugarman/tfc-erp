import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "./Header";
import { Stepper, STEPS } from "./Stepper";
import { CompanyDetailsStep } from "./CompanyDetailsStep";
import { FinancialSettingsStep } from "./FinancialSettingsStep";
import { ReviewConfirmStep } from "./ReviewConfirmStep";
import { UnsavedChangesModal } from "./UnsavedChangesModal";
import { SuccessModal } from "./SuccessModal";
import { CompanyListModal } from "./CompanyListModal";
import { CompanyFormData, ValidationErrors } from "../../types/company";
import { useAppStore } from "../../stores/useAppStore";
import { ArrowLeft, ArrowRight } from "lucide-react";

const INITIAL_DATA: CompanyFormData = {
  details: {
    companyName: "",
    legalName: "",
    gstin: "",
    panNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    phone: "",
    logoUrl: "",
  },
  financial: {
    fyStart: "",
    fyEnd: "",
    currency: "INR",
    currencySymbol: "₹",
    taxType: "gst",
    invoicePrefix: "INV/",
    invoiceStartingNumber: "0001",
    decimalPrecision: 2,
    enableMultiTax: true,
    enableRoundOff: true,
  },
};

const DRAFT_STORAGE_KEY = "tfc_company_wizard_draft";

interface CompanyWizardProps {
  mode?: "create" | "edit";
}

export const CompanyWizard: React.FC<CompanyWizardProps> = ({
  mode = "create",
}) => {
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { createCompany, updateCompany, companies, showNotification } =
    useAppStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CompanyFormData>(INITIAL_DATA);

  // Load existing company data if in edit mode
  useEffect(() => {
    if (mode === "edit" && companyId && companies.length > 0) {
      const company = companies.find((c) => c.id === companyId);
      if (company) {
        setFormData({
          details: {
            companyName: company.name,
            legalName: company.name,
            gstin: company.gstin,
            panNumber: "",
            address: company.address,
            city: company.city,
            state: company.state,
            pincode: "",
            country: "India",
            phone: company.phone,
            logoUrl: "",
          },
          financial: {
            fyStart: `2024-${String(company.financialYearStart).padStart(2, "0")}-01`,
            fyEnd: `2025-${String(company.financialYearEnd).padStart(2, "0")}-31`,
            currency: "INR",
            currencySymbol: "₹",
            taxType: "gst",
            invoicePrefix: company.invoicePrefix,
            invoiceStartingNumber: "0001",
            decimalPrecision: 2,
            enableMultiTax: true,
            enableRoundOff: true,
          },
        });
      }
    } else if (mode === "create") {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        setFormData(JSON.parse(saved));
      }
    }
  }, [mode, companyId, companies]);

  const [errors, setErrors] = useState<ValidationErrors>({
    details: {},
    financial: {},
  });
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  // Auto-save and persistence
  useEffect(() => {
    if (mode === "create") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
    }
    if (isDirty) {
      const timer = setTimeout(() => {
        setLastSavedTime(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        setIsDirty(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, isDirty]);

  const validateForm = useCallback(
    (data: CompanyFormData, strict = false): ValidationErrors => {
      const newErrors: ValidationErrors = {
        details: {},
        financial: {},
      };

      // Step 1: Company Details
      if (!data.details.companyName)
        newErrors.details.companyName = "Company name is required";
      if (!data.details.country)
        newErrors.details.country = "Country is required";

      if (strict) {
        if (!data.details.legalName)
          newErrors.details.legalName = "Legal business name is required";
        if (data.details.country === "India") {
          if (!data.details.gstin)
            newErrors.details.gstin = "GSTIN is required";
          if (!data.details.panNumber)
            newErrors.details.panNumber = "PAN number is required";
        }
        if (!data.details.address)
          newErrors.details.address = "Street address is required";
        if (!data.details.city) newErrors.details.city = "City is required";
        if (!data.details.state) newErrors.details.state = "State is required";
        if (!data.details.pincode)
          newErrors.details.pincode = "Pincode is required";
        if (!data.details.phone)
          newErrors.details.phone = "Phone number is required";
      }

      // Step 2: Financial Settings
      if (!data.financial.currency)
        newErrors.financial.currency = "Currency is required";
      if (strict) {
        if (!data.financial.fyStart)
          newErrors.financial.fyStart = "FY start date is required";
        if (!data.financial.fyEnd)
          newErrors.financial.fyEnd = "FY end date is required";
        if (!data.financial.invoicePrefix)
          newErrors.financial.invoicePrefix = "Invoice prefix is required";
        if (!data.financial.invoiceStartingNumber)
          newErrors.financial.invoiceStartingNumber =
            "Starting number is required";
      }

      return newErrors;
    },
    [],
  );

  // Update errors whenever formData changes (soft validation)
  useEffect(() => {
    setErrors(validateForm(formData, false));
  }, [formData, validateForm]);

  const handleUpdateDetails = (fields: Partial<CompanyFormData["details"]>) => {
    setFormData((prev) => ({
      ...prev,
      details: { ...prev.details, ...fields },
    }));
    setIsDirty(true);
  };

  const handleUpdateFinancial = (
    fields: Partial<CompanyFormData["financial"]>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      financial: { ...prev.financial, ...fields },
    }));
    setIsDirty(true);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the form? All entered data will be lost.",
      )
    ) {
      setFormData(INITIAL_DATA);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setCurrentStep(1);
      setErrors({ details: {}, financial: {} });
    }
  };

  const handleSubmit = async () => {
    const strictErrors = validateForm(formData, true);
    const hasErrors = Object.values(strictErrors).some(
      (stepErrors) => Object.keys(stepErrors).length > 0,
    );

    if (hasErrors) {
      setErrors(strictErrors);
      showNotification(
        "Statutory validation failed. Please resolve all required fields in the Review step.",
        "error",
      );
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const startMonth = new Date(formData.financial.fyStart).getMonth() + 1;
      const endMonth = new Date(formData.financial.fyEnd).getMonth() + 1;

      if (mode === "edit" && companyId) {
        const existingCompany = companies.find((c) => c.id === companyId);
        if (!existingCompany) throw new Error("Company not found");

        await updateCompany({
          ...existingCompany,
          name: formData.details.companyName,
          address: formData.details.address,
          city: formData.details.city,
          state: formData.details.state,
          phone: formData.details.phone,
          gstin: formData.details.gstin,
          invoicePrefix: formData.financial.invoicePrefix,
          financialYearStart: startMonth,
          financialYearEnd: endMonth,
          updatedAt: new Date().toISOString(),
        });
        showNotification("Company updated successfully", "success");
        navigate("/manage-companies");
      } else {
        await createCompany({
          name: formData.details.companyName,
          address: formData.details.address,
          city: formData.details.city,
          state: formData.details.state,
          phone: formData.details.phone,
          email: "",
          gstin: formData.details.gstin,
          invoicePrefix: formData.financial.invoicePrefix,
          language: "english",
          theme: "light",
          financialYearStart: startMonth,
          financialYearEnd: endMonth,
          isActive: true,
        });

        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setShowSuccessModal(true);
      }
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : "Failed to save company settings",
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate overall progress
  const calculateProgress = () => {
    const strictErrors = validateForm(formData, true);
    const totalRequiredFields = 15; // Estimated count of strict fields
    const filledRequiredFields =
      totalRequiredFields -
      (Object.keys(strictErrors.details).length +
        Object.keys(strictErrors.financial).length);
    return Math.round((filledRequiredFields / totalRequiredFields) * 100);
  };

  const getStepStatus = (
    stepId: number,
  ): "completed" | "warning" | "incomplete" | "pending" => {
    const strictErrors = validateForm(formData, true);
    if (stepId === 1) {
      if (!formData.details.companyName || !formData.details.country)
        return "incomplete";
      return Object.keys(strictErrors.details).length === 0
        ? "completed"
        : "warning";
    }
    if (stepId === 2) {
      if (!formData.financial.currency) return "incomplete";
      return Object.keys(strictErrors.financial).length === 0
        ? "completed"
        : "warning";
    }
    return "pending";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title={mode === "edit" ? "Edit Company" : "Create New Company"}
        onBackClick={() => {
          if (isDirty) {
            setShowUnsavedModal(true);
          } else if (mode === "edit") {
            navigate("/manage-companies");
          } else {
            setShowListModal(true);
          }
        }}
        lastSavedTime={lastSavedTime}
        isDirty={isDirty}
        onResetForm={handleReset}
      />

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
              <div
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {calculateProgress()}% Complete
            </span>
          </div>
          <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            Draft Auto-saved to Local Storage
          </div>
        </div>
      </div>

      <Stepper
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        getStepStatus={getStepStatus}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        <div className="flex-1">
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 p-8 min-h-[600px] flex flex-col">
            <div className="flex-1">
              {currentStep === 1 && (
                <CompanyDetailsStep
                  data={formData.details}
                  onChange={handleUpdateDetails}
                  errors={errors.details}
                />
              )}
              {currentStep === 2 && (
                <FinancialSettingsStep
                  data={formData.financial}
                  onChange={handleUpdateFinancial}
                  errors={errors.financial}
                />
              )}
              {currentStep === 3 && (
                <ReviewConfirmStep
                  formData={formData}
                  onEditStep={setCurrentStep}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  validationErrors={errors}
                />
              )}
            </div>

            {/* Navigation Footer */}
            {currentStep < 3 && (
              <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-0 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Step</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onConfirm={() =>
          navigate(mode === "edit" ? "/manage-companies" : "/select-company")
        }
      />

      <SuccessModal
        isOpen={showSuccessModal}
        formData={formData}
        onDashboardClick={() => navigate("/")}
        onCreateAnother={() => {
          setShowSuccessModal(false);
          setFormData(INITIAL_DATA);
          setCurrentStep(1);
        }}
        onConfigureTemplates={() => navigate("/settings")}
      />

      <CompanyListModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        onStartFresh={() => {
          setShowListModal(false);
          setFormData(INITIAL_DATA);
          setCurrentStep(1);
        }}
      />
    </div>
  );
};
