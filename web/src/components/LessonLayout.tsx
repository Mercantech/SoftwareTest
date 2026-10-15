import { useRef, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getModuleNav, type LessonModule } from '../data/lessons'
import { getObjectiveByPath } from '../data/objectives'
import { useLanguage } from '../i18n/LanguageContext'
import { t } from '../i18n/ui'
import PresentMode from './PresentMode'

type LessonLayoutProps = {
  module: LessonModule
  children: ReactNode
  toc?: ReactNode
}

export default function LessonLayout({ module, children, toc }: LessonLayoutProps) {
  const { pathname } = useLocation()
  const { lang } = useLanguage()
  const nav = getModuleNav(module)
  const contentRef = useRef<HTMLElement>(null)

  return (
    <div className={toc ? 'lesson-shell lesson-shell--with-toc' : 'lesson-shell'}>
      <aside className="lesson-sidebar" aria-label={t(lang, 'sidebarAria')}>
        <h2>{nav.title[lang]}</h2>
        <ul>
          {nav.items.map((item) => {
            const objective = getObjectiveByPath(item.path)
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    isActive || pathname === item.path ? 'active' : undefined
                  }
                >
                  <span
                    className={
                      objective
                        ? 'lesson-sidebar__num'
                        : 'lesson-sidebar__num lesson-sidebar__num--none'
                    }
                    aria-hidden="true"
                  >
                    {objective ? `#${objective.id}` : '—'}
                  </span>
                  <span>{item.label[lang]}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </aside>
      <div className="lesson-main-wrap">
        <div className="lesson-toolbar">
          <PresentMode contentRef={contentRef} />
        </div>
        <article ref={contentRef} className="lesson-main lesson prose">
          {children}
        </article>
      </div>
      {toc ? (
        <aside className="lesson-toc" aria-label={t(lang, 'tocAria')}>
          {toc}
        </aside>
      ) : null}
    </div>
  )
}
