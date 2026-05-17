import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

export function DashboardHero() {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/70 dark:border-[#223150] bg-linear-to-br from-[#f8fcff] via-[#eef7ff] to-[#e6f0ff] dark:from-[#0c172b] dark:via-[#0d1d36] dark:to-[#122648]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.22),transparent_36%),radial-gradient(circle_at_86%_12%,rgba(14,116,144,0.2),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.16),transparent_40%)]" />
        <div className="absolute -top-20 right-2 h-60 w-60 rounded-full bg-cyan-300/30 dark:bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-16 left-10 h-44 w-44 rounded-full bg-blue-300/30 dark:bg-blue-500/20 blur-3xl" />
      </div>

      <div className="relative px-6 py-7 sm:px-8 sm:py-9">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/80 dark:border-blue-500/30 bg-white/80 dark:bg-blue-950/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            Control Center
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            TFC Dashboard
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            {t("common.operationalStatus")}
          </p>
        </div>
      </div>
    </div>
  );
}
