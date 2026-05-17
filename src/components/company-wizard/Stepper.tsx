import React from "react";
import {
  Check,
  Building2,
  Coins,
  Settings2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { StepConfig } from "../../types/company";

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  getStepStatus: (
    stepId: number,
  ) => "completed" | "warning" | "incomplete" | "pending";
}

export const STEPS: StepConfig[] = [
  {
    id: 1,
    title: "Company Details",
    subtitle: "Legal & Location",
    icon: "Building2",
  },
  {
    id: 2,
    title: "Financial Settings",
    subtitle: "Tax & Currency",
    icon: "Coins",
  },
  {
    id: 3,
    title: "Review & Confirm",
    subtitle: "Verify & Initialize",
    icon: "FileText",
  },
];

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onStepClick,
  getStepStatus,
}) => {
  const getIcon = (iconName: string, isCurrent: boolean, status: string) => {
    const className = `w-5 h-5 ${
      isCurrent || status === "completed"
        ? "text-white"
        : status === "warning"
          ? "text-amber-600"
          : "text-slate-400 group-hover:text-slate-600"
    }`;

    if (status === "completed" && !isCurrent) {
      return <Check className="w-5 h-5 stroke-[2.5]" />;
    }

    if (status === "warning" && !isCurrent) {
      return <AlertTriangle className="w-5 h-5" />;
    }

    switch (iconName) {
      case "Building2":
        return <Building2 className={className} />;
      case "Coins":
        return <Coins className={className} />;
      case "Settings2":
        return <Settings2 className={className} />;
      case "FileText":
        return <FileText className={className} />;
      default:
        return <Building2 className={className} />;
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-5 shadow-2xs">
      <div className="max-w-5xl mx-auto">
        <nav aria-label="Progress">
          <ol className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
            {STEPS.map((step, index) => {
              const isCurrent = currentStep === step.id;
              const status = getStepStatus(step.id);
              const isClickable = true; // Free navigation

              return (
                <li key={step.id} className="relative flex-1 w-full">
                  <div className="flex items-center w-full">
                    <button
                      onClick={() => onStepClick(step.id)}
                      className="group flex items-center gap-3 w-full text-left cursor-pointer transition-all"
                    >
                      {/* Step Number / Icon / Checkmark */}
                      <div
                        className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all font-semibold shadow-xs ${
                          isCurrent
                            ? "bg-blue-600 text-white shadow-blue-200 ring-4 ring-blue-50"
                            : status === "completed"
                              ? "bg-emerald-600 text-white shadow-emerald-200"
                              : status === "warning"
                                ? "bg-amber-50 text-amber-600 border border-amber-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200/80 group-hover:border-slate-300 group-hover:bg-slate-200/50"
                        }`}
                      >
                        {getIcon(step.icon, isCurrent, status)}
                      </div>

                      {/* Step Labels */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider ${
                              isCurrent
                                ? "text-blue-600"
                                : status === "completed"
                                  ? "text-emerald-600"
                                  : status === "warning"
                                    ? "text-amber-600"
                                    : "text-slate-400"
                            }`}
                          >
                            Step {step.id}
                          </span>
                        </div>
                        <h2
                          className={`text-sm font-bold truncate transition-colors ${
                            isCurrent
                              ? "text-slate-900"
                              : "text-slate-700 group-hover:text-slate-900"
                          }`}
                        >
                          {step.title}
                        </h2>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {status === "warning"
                            ? "Missing info"
                            : step.subtitle}
                        </p>
                      </div>
                    </button>

                    {/* Connecting Line */}
                    {index < STEPS.length - 1 && (
                      <div className="hidden md:block flex-1 ml-4">
                        <div
                          className={`h-1 rounded-full transition-all duration-300 ${
                            status === "completed"
                              ? "bg-emerald-500"
                              : "bg-slate-100"
                          }`}
                        ></div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
};
