import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getModuleNav, type LessonModule } from '../data/lessons'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/ui'

type LessonLayoutProps = {
  module: LessonModule
  children: ReactNode
  toc?: ReactNode
}

export default function LessonLayout({ module, children, toc }: LessonLayoutProps) {
  const { pathname } = useLocation()
  const { lang } = useLanguage()
  const nav = getModuleNav(module)

  return (
    <div className={toc ? 'lesson-shell lesson-shell--with-toc' : 'lesson-shell'}>
      <aside className="lesson-sidebar" aria-label={t(lang, 'sidebarAria')}>
        <h2>{nav.title[lang]}</h2>
        <ul>
          {nav.items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive || pathname === item.path ? 'active' : undefined
                }
              >
                {item.label[lang]}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
      <article className="lesson-main lesson prose">{children}</article>
      {toc ? (
        <aside className="lesson-toc" aria-label={t(lang, 'tocAria')}>
          {toc}
        </aside>
      ) : null}
    </div>
  )
}
