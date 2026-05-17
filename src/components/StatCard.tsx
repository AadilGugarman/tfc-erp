import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  variant?: "default" | "blue" | "purple" | "teal" | "amber";
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  label,
  value,
  subtext,
  variant = "default",
  onClick,
}) => {
  const variants = {
    default: {
      bg: "bg-gradient-to-br from-slate-50 to-slate-100",
      icon: "bg-slate-100 text-slate-600",
      text: "text-slate-700",
    },
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      icon: "bg-blue-100 text-blue-600",
      text: "text-blue-700",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      icon: "bg-purple-100 text-purple-600",
      text: "text-purple-700",
    },
    teal: {
      bg: "bg-gradient-to-br from-teal-50 to-teal-100",
      icon: "bg-teal-100 text-teal-600",
      text: "text-teal-700",
    },
    amber: {
      bg: "bg-gradient-to-br from-amber-50 to-amber-100",
      icon: "bg-amber-100 text-amber-600",
      text: "text-amber-700",
    },
  };

  const style = variants[variant];

  return (
    <div
      className={cn(
        "p-5 rounded-lg border border-slate-200 transition-all duration-200",
        style.bg,
        onClick && "cursor-pointer hover:shadow-md hover:border-slate-300",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {label}
          </div>
          <div className={cn("text-2xl font-bold", style.text)}>{value}</div>
          {subtext && (
            <div className="text-[12px] text-slate-500 mt-1">{subtext}</div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg", style.icon)}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
};
