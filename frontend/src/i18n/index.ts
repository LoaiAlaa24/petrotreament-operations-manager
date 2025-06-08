import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import ar from './locales/ar.json';

const resources = {
  en: {
    translation: en
  },
  ar: {
    translation: ar
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar', // Arabic as fallback instead of English
    debug: false,

    interpolation: {
      escapeValue: false // React already does escaping
    },

    detection: {
      order: ['localStorage', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng: string) => {
        // If no language is detected or stored, default to Arabic
        if (!lng || lng === 'undefined' || lng === 'null') {
          return 'ar';
        }
        return lng;
      }
    },

    // Set default language to Arabic if nothing is found
    load: 'languageOnly',
    preload: ['ar', 'en'],
    
    // Use Arabic as default only for first-time users
    initImmediate: false
  });

// Initialize language on load
i18n.on('initialized', () => {
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (!savedLanguage) {
    // If no language preference is saved, set Arabic as default and save it
    localStorage.setItem('i18nextLng', 'ar');
    i18n.changeLanguage('ar');
  }
});

export default i18n;