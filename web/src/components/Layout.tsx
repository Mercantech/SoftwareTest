import { NavLink, Outlet } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/ui'
import LanguageToggle from './LanguageToggle'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  const { lang } = useLanguage()

  const navItems = [
    { to: '/', label: t(lang, 'navHome'), end: true },
    { to: '/maalpinde', label: t(lang, 'navObjectives'), end: true },
    { to: '/test/oversigt', label: t(lang, 'navTest'), end: false },
    { to: '/sikkerhed/kryptering', label: t(lang, 'navSecurity'), end: false },
  ]

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink to="/" className="site-logo" end>
            Mercantec <span>·</span>{' '}
            {lang === 'da' ? 'Test & sikkerhed' : 'Test & security'}
          </NavLink>
          <div className="site-header__right">
            <nav aria-label={t(lang, 'navAria')}>
              <ul className="site-nav">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) => (isActive ? 'active' : undefined)}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>
          {t(lang, 'footer')} ·{' '}
          <a href="https://testing.mercantec.tech">testing.mercantec.tech</a>
        </p>
      </footer>
    </>
  )
}
