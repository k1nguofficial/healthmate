import './HowItWorks.css'

const steps = [
  {
    title: 'Describe your symptoms',
    description: 'Share what you feel in everyday language. Mention duration, intensity, and any triggers.',
    icon: '📝',
  },
  {
    title: 'AI analyzes your input',
    description: 'Our medical-grade language model interprets your symptoms and cross-references trusted sources.',
    icon: '🧠',
  },
  {
    title: 'Get possible causes & tips',
    description: 'Receive tailored insights, urgent care guidance, and prevention strategies instantly.',
    icon: '💡',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="how">
      <div className="how__intro">
        <p className="how__eyebrow">How It Works</p>
        <h2 className="how__title">Smarter health answers in three steps</h2>
        <p className="how__subtitle">
          Powered by large language models trained on medical data, HealthMate gives you clarity and next steps in
          minutes.
        </p>
      </div>
      <div className="how__steps">
        {steps.map((step, index) => (
          <article className="how__card" key={step.title}>
            <div className="how__badge">{index + 1}</div>
            <div className="how__icon" aria-hidden="true">
              {step.icon}
            </div>
            <h3 className="how__card-title">{step.title}</h3>
            <p className="how__card-description">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HowItWorks
