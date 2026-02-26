import { createContext, useContext, useState, useCallback } from 'react';
import translations from '../config/translations';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const LANG_MAP = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  zh: 'Chinese',
  ar: 'Arabic',
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [langCode, setLangCode] = useState(() =>
    localStorage.getItem('croply-lang') || 'en'
  );

  const setLanguage = (code) => {
    setLangCode(code);
    localStorage.setItem('croply-lang', code);
  };

  const langName = LANG_MAP[langCode] || 'English';

  // Translation helper – falls back to English
  const t = useCallback(
    (key) => translations[langCode]?.[key] || translations.en[key] || key,
    [langCode]
  );

  return (
    <LanguageContext.Provider value={{ langCode, langName, setLanguage, LANGUAGES, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
