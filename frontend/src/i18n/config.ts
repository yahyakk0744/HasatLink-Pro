import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './en.json';
import trTranslation from './tr.json';

i18n
  .use(LanguageDetector) // Tarayıcı dilini otomatik algılar
  .use(initReactI18next) // React ile bağlantıyı kurar
  .init({
    resources: {
      en: { translation: enTranslation },
      tr: { translation: trTranslation }
    },
    fallbackLng: 'en', // Dil bulunamazsa varsayılan olarak İngilizce kullan
    interpolation: {
      escapeValue: false // React güvenliği için gerekli
    }
  });

export default i18n;