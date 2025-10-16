import './ChatSection.css'

function ChatSection() {
  return (
    <section id="chat" className="chat">
      <div className="chat__content">
        <h2 className="chat__title">Chat with HealthMate</h2>
        <p className="chat__subtitle">
          Launch the conversational assistant to describe symptoms, ask health questions, and get AI-generated next
          steps in minutes.
        </p>
        <div className="chat__actions">
          <a className="chat__primary" href="/chat">
            Open Chat Assistant
          </a>
          <a className="chat__secondary" href="#how-it-works">
            See how it works
          </a>
        </div>
      </div>
      <div className="chat__panel" aria-hidden="true">
        <div className="chat__message chat__message--user">“I have a persistent cough and mild fever.”</div>
        <div className="chat__message chat__message--ai">
          “Based on your symptoms, here are potential causes and recommended actions...”
        </div>
        <div className="chat__message chat__message--ai chat__message--tip">
          “Tip: Stay hydrated and monitor your temperature twice a day.”
        </div>
      </div>
    </section>
  )
}

export default ChatSection
