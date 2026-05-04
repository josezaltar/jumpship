import { useState, useCallback } from 'react';
import { translations, type Language, type TranslationKey } from './translations';

const STORAGE_KEY = 'jumpship_language';

function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pt' || saved === 'en') return saved;
  } catch { /* ignore */ }
  return 'pt'; // padrão português para você
}

let globalLanguage: Language = getInitialLanguage();
const listeners = new Set<() => void>();

function setGlobalLanguage(lang: Language) {
  globalLanguage = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
  listeners.forEach(fn => fn());
}

export function useTranslation() {
  const [, forceUpdate] = useState(0);

  const subscribe = useCallback(() => {
    const fn = () => forceUpdate(n => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  // Subscribe on mount
  useState(() => { const unsub = subscribe(); return unsub; });

  const t = useCallback((key: TranslationKey): string => {
    return translations[globalLanguage][key] ?? translations.en[key] ?? key;
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setGlobalLanguage(lang);
  }, []);

  return {
    t,
    language: globalLanguage,
    setLanguage,
  };
}