/**
 * Paracha Mobile Shop — Internationalization Setup
 * Support for English (LTR) and Urdu (RTL) with localStorage persistence
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import urTranslations from './locales/ur.json';

export const LANGUAGE_STORAGE_KEY = 'paracha_language';

const getInitialLanguage = (): string => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'ur' || saved === 'en') {
      return saved;
    }
  } catch {
    // ignore localStorage access errors
  }
  return 'en';
};

const initialLang = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    ur: { translation: urTranslations },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export const updateDocumentDirection = (lang: string) => {
  if (typeof document === 'undefined') return;
  const isRtl = lang === 'ur';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

// Initial sync
updateDocumentDirection(initialLang);

// Synchronize on runtime language change
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    // ignore localStorage access errors
  }
  updateDocumentDirection(lng);
});

export default i18n;
