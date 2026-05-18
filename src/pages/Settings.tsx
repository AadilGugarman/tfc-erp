import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Settings as SettingsIcon } from "lucide-react";
import { PageTransition } from "@/components";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/stores/useAppStore";
import type { SettingsCategory } from "@/db/schema";
import {
  SettingsSidebar,
  SettingsMobileHeader,
  SETTINGS_CATEGORIES,
} from "@/components/settings/SettingsSidebar";
import { FinancialSettings } from "@/components/settings/pages/FinancialSettings";
import { InvoiceSettings } from "@/components/settings/pages/InvoiceSettings";
import { BackupSettings } from "@/components/settings/pages/BackupSettings";
import { AppearanceSettings } from "@/components/settings/pages/AppearanceSettings";
import { SecuritySettings } from "@/components/settings/pages/SecuritySettings";
import { CompaniesSettings } from "@/components/settings/pages/CompaniesSettings";
import { cn } from "@/utils/cn";

const SETTINGS_SECTIONS: SettingsCategory[] = [
  "companies",
  "financial",
  "invoice",
  "backup",
  "appearance",
  "security",
];

function parseSettingsSection(value: string | null): SettingsCategory | null {
  if (value && SETTINGS_SECTIONS.includes(value as SettingsCategory)) {
    return value as SettingsCategory;
  }
  return null;
}

function applyTheme(theme: "light" | "dark" | "system") {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (theme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    document.documentElement.classList.toggle("dark", prefersDark);
  }
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { settings, loadSettings } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFromUrl = parseSettingsSection(searchParams.get("section"));
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(
    () => sectionFromUrl ?? "companies",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const section = parseSettingsSection(searchParams.get("section"));
    if (section) {
      setActiveCategory(section);
    }
  }, [searchParams]);

  const handleCategoryChange = (category: SettingsCategory) => {
    setActiveCategory(category);
    if (category === "companies") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ section: category }, { replace: true });
    }
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    applyTheme(settings.appearance.theme);
  }, [settings.appearance.theme]);

  const activeCategoryConfig = SETTINGS_CATEGORIES.find(
    (c) => c.id === activeCategory,
  );

  const filteredCategories = SETTINGS_CATEGORIES.filter(
    (c) =>
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const showCategory =
    !searchQuery || filteredCategories.some((c) => c.id === activeCategory);

  const renderContent = () => {
    switch (activeCategory) {
      case "companies":
        return <CompaniesSettings />;
      case "financial":
        return <FinancialSettings />;
      case "invoice":
        return <InvoiceSettings />;
      case "backup":
        return <BackupSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "security":
        return <SecuritySettings />;
      default:
        return <CompaniesSettings />;
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-[calc(100vh-4rem)] min-w-0 gap-6 px-4 py-4 lg:px-6 lg:py-5">
        <SettingsSidebar
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <SettingsMobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />

          <main className="flex-1 min-w-0 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl py-2 md:py-4">
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-2">
                  <SettingsIcon className="w-4 h-4" />
                  <span>{t("settings.title", "Settings")}</span>
                  <span>/</span>
                  <span className="text-zinc-900 dark:text-white">
                    {activeCategoryConfig?.label}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                  {activeCategoryConfig?.label}{" "}
                  {t("settings.title", "Settings")}
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {activeCategoryConfig?.description}
                </p>
              </div>

              {searchQuery && filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                  <SettingsIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                    No settings found
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                    No categories match &quot;{searchQuery}&quot;
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear search
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "transition-opacity",
                    searchQuery && !showCategory
                      ? "opacity-40 pointer-events-none"
                      : "opacity-100",
                  )}
                >
                  {renderContent()}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </PageTransition>
  );
}
