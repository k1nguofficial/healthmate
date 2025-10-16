import './Hero.css'

function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero__content">
        <p className="hero__eyebrow">Always-On Support</p>
        <h1 className="hero__title">Your AI-Powered Health Assistant</h1>
        <p className="hero__subtitle">
          Check symptoms, get suggestions, and learn preventive tips — instantly. HealthMate helps you
          make informed decisions before visiting a clinic.
        </p>
        <div className="hero__actions">
          <a className="hero__cta" href="#chat">
            Start Chat
          </a>
          <a className="hero__secondary" href="#resources">
            Explore Resources
          </a>
        </div>
      </div>
      <div className="hero__visual" role="img" aria-label="Illustration of a digital health assistant">
        <div className="hero__avatar">
          <span className="hero__avatar-icon">🩺</span>
          <div className="hero__pulse" />
        </div>
        <div className="hero__bubble hero__bubble--primary">Symptom Insights</div>
        <div className="hero__bubble hero__bubble--secondary">Preventive Guidance</div>
        <div className="hero__bubble hero__bubble--tertiary">24/7 Access</div>
      </div>
    </section>
  )
}

export default Hero
