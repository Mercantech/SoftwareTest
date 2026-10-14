import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Forside', end: true },
  { to: '/maalpinde', label: 'Målpinde', end: true },
  { to: '/test/oversigt', label: 'Test', end: false },
  { to: '/sikkerhed/kryptering', label: 'Sikkerhed', end: false },
]

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink to="/" className="site-logo" end>
            Mercantec <span>·</span> Test &amp; sikkerhed
          </NavLink>
          <nav aria-label="Hovednavigation">
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
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>
          Software test og sikkerhed · Mercantec ·{' '}
          <a href="https://testing.mercantec.tech">testing.mercantec.tech</a>
        </p>
      </footer>
    </>
  )
}
