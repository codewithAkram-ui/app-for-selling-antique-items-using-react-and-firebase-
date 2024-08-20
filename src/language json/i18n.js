import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';
import en from '../language json/english.json';
import hi from '../language json/hindi.json';
import ta from '../language json/tamil.json';

// Import the plural rules polyfill
import 'intl-pluralrules';

// Language detector configuration
const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: (callback) => {
      AsyncStorage.getItem('user-language', async (err, language) => {
        if (err || !language) {
          const locales = await RNLocalize.getLocales();
          const bestLanguage = locales[0]?.languageCode || 'en';  // Use languageCode or languageTag based on what `getLocales` provides
          callback(bestLanguage);
          return;
        }
        callback(language);
      });
    },
    init: () => {},
    cacheUserLanguage: (language) => {
      AsyncStorage.setItem('user-language', language);
    }
  };
  

// Initialize i18next
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      ta: { translation: ta }
    },
    fallbackLng: 'en',
    debug: true,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
