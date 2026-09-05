import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (path: string, fallback?: string) => string;
  isUrdu: boolean;
  isEnglish: boolean;
}

const STORAGE_KEY = 'agroendure_app_language';

function getInitialLanguage(): Language {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'ur') {
        return saved;
      }
    } catch {}
  }
  return 'ur';
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'ur',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: () => '',
  isUrdu: true,
  isEnglish: false,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, language);
      } catch {}
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'ur' ? 'en' : 'ur'));
  };

  // Nested property lookup helper, e.g. t('agreement.headerTitle')
  const t = (path: string, fallback: string = ''): string => {
    const keys = path.split('.');
    const dict = translations[language] as any;
    let current = dict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return fallback || path;
      }
    }
    return typeof current === 'string' ? current : fallback || path;
  };

  const isUrdu = language === 'ur';
  const isEnglish = language === 'en';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isUrdu,
        isEnglish,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
