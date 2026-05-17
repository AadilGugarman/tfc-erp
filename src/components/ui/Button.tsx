import React from "react";
import { cn } from "@/utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "destructive"
    | "ghost"
    | "outline"
    | "soft"
    | "mandi";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  className,
  disabled,
  fullWidth,
  ...props
}: ButtonProps) {
  const base = cn(
    "inline-flex items-center justify-center font-semibold rounded-lg",
    "transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0a0f1d]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-[0.98]",
    "select-none",
    fullWidth && "w-full",
  );

  const variants = {
    primary: cn(
      "bg-blue-600",
      "text-white border border-blue-700/80",
      "hover:bg-blue-700 active:bg-blue-800",
      "shadow-[0_8px_20px_-10px_rgba(37,99,235,0.55)] hover:shadow-[0_12px_28px_-12px_rgba(37,99,235,0.65)]",
    ),
    secondary: cn(
      "bg-slate-100 dark:bg-[#1b2335]",
      "text-slate-800 dark:text-[#d9e4ff] border border-slate-300 dark:border-[#31415f]",
      "hover:bg-slate-200 dark:hover:bg-[#26314a]",
      "shadow-sm shadow-slate-300/55 dark:shadow-black/20",
    ),
    destructive: cn(
      "bg-red-600",
      "text-white",
      "hover:bg-red-700",
      "shadow-md shadow-red-500/30 hover:shadow-lg hover:shadow-red-500/40",
    ),
    ghost: cn(
      "text-slate-700 dark:text-slate-300",
      "bg-white/70 dark:bg-[#0f1527]/65 border border-slate-300/90 dark:border-[#2b3955]",
      "hover:bg-slate-100 dark:hover:bg-[#1b2335]",
      "hover:text-slate-900 dark:hover:text-[#f1f5ff]",
    ),
    outline: cn(
      "border border-slate-300 dark:border-[#2a3550]",
      "text-slate-700 dark:text-slate-300 bg-white dark:bg-[#101827]",
      "hover:bg-slate-50 dark:hover:bg-[#141c2d]",
      "hover:border-slate-400 dark:hover:border-[#3b4a6b]",
    ),
    soft: cn(
      "bg-blue-50 dark:bg-blue-950/35",
      "text-blue-700 dark:text-blue-300",
      "hover:bg-blue-100 dark:hover:bg-blue-950/55",
      "border border-blue-200/50 dark:border-blue-800/50",
    ),
    mandi: cn(
      "bg-[#facc15] hover:bg-[#eab308] text-black border border-[#eab308]",
      "shadow-[0_4px_12px_-4px_rgba(250,204,21,0.5)]",
    ),
  };

  const sizes = {
    xs: "px-2 py-1 text-xs gap-1",
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {icon && !loading && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
