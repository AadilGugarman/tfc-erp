import { useTranslation } from 'react-i18next';
import { formatDate, todayStr } from '@/utils/formatters';
import { Sparkles } from 'lucide-react';

export function DashboardHero() {
  const { t } = useTranslation();
  const today = formatDate(todayStr());

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-slate-700/50 dark:border-slate-800/50">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-slate-600/5 to-emerald-600/10 mix-blend-screen" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl mix-blend-multiply animate-blob" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-slate-500/10 rounded-full filter blur-3xl mix-blend-multiply animate-blob animation-delay-2000" />
      </div>

      {/* Content */}
      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">TFC</h1>
              <Sparkles className="h-5 w-5 text-emerald-400/60" />
            </div>
            <p className="text-sm sm:text-base text-slate-300">{t('app.subtitle')}</p>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">{today}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
