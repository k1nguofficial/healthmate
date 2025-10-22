import { Link, useLocation } from 'react-router-dom'
import SmoothScrollLink from '../common/SmoothScrollLink'
import './Navbar.css'

const navLinks = [
  { label: 'Home', href: '#home', type: 'hash' as const },
  { label: 'Chat', href: '/chat', type: 'route' as const },
  { label: 'Dashboard', href: '/dashboard', type: 'route' as const },
  { label: 'Resources', href: '#resources', type: 'hash' as const },
  { label: 'About', href: '#about', type: 'hash' as const },
  { label: 'Contact', href: '#contact', type: 'hash' as const },
]

function Navbar() {
  const location = useLocation()
  const onHome = location.pathname === '/'

  return (
    <header className="navbar">
      <div className="navbar__logo" aria-label="HealthMate">
        <span role="img" aria-hidden="true">
          💡
        </span>
        <span className="navbar__logo-text">HealthMate AI</span>
      </div>
      <nav aria-label="Primary">
        <ul className="navbar__links">
          {navLinks.map((link) => (
            <li key={link.label}>
              {link.type === 'route' ? (
                <Link to={link.href} className="navbar__link">
                  {link.label}
                </Link>
              ) : onHome ? (
                <SmoothScrollLink href={link.href} className="navbar__link">
                  {link.label}
                </SmoothScrollLink>
              ) : (
                <Link to={link.href === '#home' ? '/' : `/${link.href}`} className="navbar__link">
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      <Link className="navbar__cta" to="/chat">
        Start Symptom Check
      </Link>
    </header>
  )
}

export default Navbar
