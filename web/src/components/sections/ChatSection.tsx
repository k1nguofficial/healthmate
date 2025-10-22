import { Link } from 'react-router-dom'
import SmoothScrollLink from '../common/SmoothScrollLink'
import '../chat/ChatWidget.css'
import './ChatSection.css'

const sampleDialogue = [
  {
    role: 'user',
    text: '“My throat has been sore for three days and I started feeling feverish tonight.”',
  },
  {
    role: 'assistant',
    text: '“I hear: sore throat lasting 3 days, new fever. Watch for breathing difficulty—see urgent care if it appears.”',
  },
  {
    role: 'assistant',
    text: '“Try warm salt-water gargles, stay hydrated, and consult a clinician if fever exceeds 102°F or lasts >48 hours.”',
  },
]

function ChatSection() {
  return (
    <section id="chat" className="chat">
      <div className="chat__content">
        <p className="chat__eyebrow">AI Symptom Guide</p>
        <h2 className="chat__title">Personalized suggestions in a dedicated chat workspace</h2>
        <p className="chat__subtitle">
          HealthMate turns your description into structured insights—summaries, possible contributing factors, and clear
          next-step tips. When you’re ready, continue the conversation on our focused chat page.
        </p>
        <div className="chat__actions">
          <Link className="chat__primary" to="/chat">
            Open chat workspace
          </Link>
          <SmoothScrollLink className="chat__secondary" href="#how-it-works">
            See how it works
          </SmoothScrollLink>
        </div>
      </div>
      <div className="chat__panel" aria-hidden="true">
        {sampleDialogue.map((message) => (
          <div key={message.text} className={`chat__message chat__message--${message.role}`}>
            {message.text}
          </div>
        ))}
      </div>
    </section>
  )
}

export default ChatSection
