import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en.json';
import guTranslations from '../locales/gu.json';

// Language detection and initialization
const savedLanguage = localStorage.getItem('appLanguage') || 'en';
const currentLng = savedLanguage === 'gu' ? 'gu' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      gu: { translation: guTranslations },
    },
    lng: currentLng,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    ns: 'translation',
    defaultNS: 'translation',
  });

// Persist language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('appLanguage', lng);
  document.documentElement.lang = lng;
});

// Make i18n globally accessible
(window as any).__i18n = i18n;

export default i18n;

