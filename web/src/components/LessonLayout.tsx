import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { getModuleNav, type LessonModule } from '../data/lessons'

type LessonLayoutProps = {
  module: LessonModule
  children: ReactNode
  toc?: ReactNode
}

export default function LessonLayout({ module, children, toc }: LessonLayoutProps) {
  const { pathname } = useLocation()
  const nav = getModuleNav(module)

  return (
    <div className={toc ? 'lesson-shell lesson-shell--with-toc' : 'lesson-shell'}>
      <aside className="lesson-sidebar" aria-label={`${nav.title} navigation`}>
        <h2>{nav.title}</h2>
        <ul>
          {nav.items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive || pathname === item.path ? 'active' : undefined
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>
      <article className="lesson-main lesson prose">{children}</article>
      {toc ? (
        <aside className="lesson-toc" aria-label="Indholdsfortegnelse">
          {toc}
        </aside>
      ) : null}
    </div>
  )
}
