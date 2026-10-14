import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'da' | 'en'

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  toggleLang: () => void
}

const STORAGE_KEY = 'softwaretest-lang'

const LanguageContext = createContext<LanguageContextValue | null>(null)

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'da' || stored === 'en') return stored
  } catch {
    /* ignore */
  }
  return 'da'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    typeof window === 'undefined' ? 'da' : readStoredLang(),
  )

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'da' ? 'en' : 'da')
  }, [lang, setLang])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(
    () => ({ lang, setLang, toggleLang }),
    [lang, setLang, toggleLang],
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage skal bruges inden i LanguageProvider')
  }
  return ctx
}
