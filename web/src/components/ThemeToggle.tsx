import { useTheme } from '../i18n/ThemeContext'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/ui'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { lang } = useLanguage()

  return (
    <div className="theme-toggle" role="group" aria-label={t(lang, 'themeToggleAria')}>
      <button
        type="button"
        className={theme === 'light' ? 'active' : undefined}
        aria-pressed={theme === 'light'}
        onClick={() => setTheme('light')}
        title={t(lang, 'themeLight')}
      >
        {t(lang, 'themeLight')}
      </button>
      <button
        type="button"
        className={theme === 'dark' ? 'active' : undefined}
        aria-pressed={theme === 'dark'}
        onClick={() => setTheme('dark')}
        title={t(lang, 'themeDark')}
      >
        {t(lang, 'themeDark')}
      </button>
    </div>
  )
}
