import './Footer.css'

const footerLinks = [
  { label: 'Terms of Use', href: '#terms' },
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">
        <span role="img" aria-hidden="true">
          💖
        </span>
        <span className="footer__brand-text">HealthMate</span>
      </div>
      <nav aria-label="Footer">
        <ul className="footer__links">
          {footerLinks.map((link) => (
            <li key={link.href}>
              <a className="footer__link" href={link.href}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="footer__meta">
        <a className="footer__link" href="https://github.com/" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <p className="footer__note">© {new Date().getFullYear()} HealthMate. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
