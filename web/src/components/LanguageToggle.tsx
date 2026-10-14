import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/ui'

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="lang-toggle" role="group" aria-label={t(lang, 'langToggleAria')}>
      <button
        type="button"
        className={lang === 'da' ? 'active' : undefined}
        aria-pressed={lang === 'da'}
        onClick={() => setLang('da')}
      >
        {t(lang, 'langDa')}
      </button>
      <button
        type="button"
        className={lang === 'en' ? 'active' : undefined}
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
      >
        {t(lang, 'langEn')}
      </button>
    </div>
  )
}
