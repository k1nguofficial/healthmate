import './Features.css'

const features = [
  {
    title: 'Chatbot-based assistance',
    description: 'Converse with an empathetic AI that remembers context and guides you through symptom details.',
    icon: '🤖',
  },
  {
    title: 'Preventive health guidance',
    description: 'Learn lifestyle tips, home remedies, and when to seek professional care.',
    icon: '🩺',
  },
  {
    title: 'Multi-language support',
    description: 'Switch to the language you trust most for accurate understanding.',
    icon: '🌍',
  },
  {
    title: 'Secure & private',
    description: 'Your conversations stay encrypted and compliant with healthcare standards.',
    icon: '💬🔒',
  },
]

function Features() {
  return (
    <section id="resources" className="features">
      <div className="features__intro">
        <p className="features__eyebrow">Why HealthMate</p>
        <h2 className="features__title">Designed for fast, reliable healthcare answers</h2>
        <p className="features__subtitle">
          Built on the MERN stack and powered by advanced language models, HealthMate bridges the gap between your
          concerns and professional medical support.
        </p>
      </div>
      <div className="features__grid">
        {features.map((feature) => (
          <article className="features__card" key={feature.title}>
            <div className="features__icon" aria-hidden="true">
              {feature.icon}
            </div>
            <h3 className="features__card-title">{feature.title}</h3>
            <p className="features__card-description">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Features
