import './Navbar.css'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Chat', href: '#chat' },
  { label: 'Resources', href: '#resources' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__logo" aria-label="HealthMate">
        <span role="img" aria-hidden="true">
          💡
        </span>
        <span className="navbar__logo-text">HealthMate</span>
      </div>
      <nav aria-label="Primary">
        <ul className="navbar__links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="navbar__link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <a className="navbar__cta" href="#chat">
        Start Symptom Check
      </a>
    </header>
  )
}

export default Navbar
