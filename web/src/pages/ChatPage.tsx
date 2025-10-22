import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ChatWidget from '../components/chat/ChatWidget'
import './ChatPage.css'

const benefits = [
  {
    title: 'Guided responses',
    description: 'Each reply is structured for clarity: summary, possible factors, and suggested next steps.',
  },
  {
    title: 'Safety focused',
    description:
      'Built-in guardrails ensure every answer reminds users to seek licensed care for urgent or personal situations.',
  },
  {
    title: 'Instant insights',
    description: 'Latency-tuned Groq models deliver answers in seconds, ideal for quick check-ins and triage.',
  },
]

function ChatPage() {
  return (
    <>
      <Navbar />
      <main className="chat-page">
        <section className="chat-page__hero">
          <div className="chat-page__intro">
            <p className="chat-page__eyebrow">HealthMate Assistant</p>
            <h1 className="chat-page__title">Talk through your symptoms with AI-guided support</h1>
            <p className="chat-page__subtitle">
              Describe how you feel, when it started, and any changes you notice. HealthMate summarizes what it heard,
              suggests possible contributing factors, and lists practical next steps—always reminding you to reach out
              to real clinicians for diagnosis.
            </p>
            <ul className="chat-page__benefits">
              {benefits.map((benefit) => (
                <li key={benefit.title}>
                  <strong>{benefit.title}</strong>
                  <span>{benefit.description}</span>
                </li>
              ))}
            </ul>
          </div>
          <ChatWidget />
        </section>

        <section className="chat-page__tips">
          <h2>Best practices for accurate guidance</h2>
          <div className="chat-page__tips-grid">
            <article>
              <h3>Be detailed</h3>
              <p>
                Mention timing, severity, recent travel, medications, and existing conditions. The assistant uses your
                context to surface more relevant considerations.
              </p>
            </article>
            <article>
              <h3>Share your goals</h3>
              <p>
                Let HealthMate know whether you want home care tips, a decision checklist before visiting a clinic, or
                educational resources to read.
              </p>
            </article>
            <article>
              <h3>Know the limits</h3>
              <p>
                HealthMate is not a doctor. If you experience life-threatening symptoms—chest pain, severe bleeding,
                sudden confusion—call emergency services immediately.
              </p>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default ChatPage
