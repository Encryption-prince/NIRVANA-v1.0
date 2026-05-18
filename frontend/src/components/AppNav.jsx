import { NavLink } from 'react-router-dom'

export default function AppNav() {
  return (
    <nav className="app-nav" aria-label="Main">
      <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')} end>
        Start session
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}>
        Session history
      </NavLink>
    </nav>
  )
}
