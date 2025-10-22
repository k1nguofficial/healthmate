import { useEffect, useMemo, useRef } from 'react'
import type { FormEvent, JSX } from 'react'
import { useChatSession } from '../../hooks/useChatSession'
import './ChatWidget.css'

const placeholderExamples = [
  'Example: I’ve had a sore throat for three days and a mild fever.',
  'Example: I’m feeling dizzy after workouts and want to know why.',
  'Example: I’ve had stomach cramps since yesterday evening.',
  'Example: I’m recovering from a cold but my cough hasn’t gone away.',
  'Example: My child has a rash and low-grade fever—what should I watch for?',
]

function ChatWidget() {
  const { state, setInput, sendMessage, resetChat, trimmedInput, conversationSummary } = useChatSession()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const shouldAutoScrollRef = useRef(true)
  const placeholderText = useMemo(
    () => placeholderExamples[Math.floor(Math.random() * placeholderExamples.length)] ?? '',
    [],
  )

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [state.messages, state.isLoading])

  useEffect(() => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current

    const adjustHeight = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 280)}px`
    }

    adjustHeight()
  }, [state.input])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!trimmedInput) return
    shouldAutoScrollRef.current = true
    await sendMessage()
  }

  const handleReset = () => {
    resetChat()
    textareaRef.current?.focus()
    shouldAutoScrollRef.current = true
  }

  const handleMessagesScroll = () => {
    if (!messagesContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
    const atBottom = scrollHeight - clientHeight - scrollTop < 40
    shouldAutoScrollRef.current = atBottom
  }

  const renderMessageContent = (content: string, role: 'user' | 'assistant'): JSX.Element | JSX.Element[] => {
    if (role === 'user') {
      return <p>{content}</p>
    }

    const blocks = content
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)

    const escapeHtml = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

    const formatEmphasis = (value: string) =>
      escapeHtml(value)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')

    return blocks.map((block, index) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
      const isBulletList = lines.every((line) => /^[-•]/.test(line))
      const isDisclaimer = /^disclaimer\s*:/i.test(block)

      if (isBulletList) {
        return (
          <ul key={`${block}-${index}`}>
            {lines.map((line, lineIndex) => (
              <li
                key={`${line}-${lineIndex}`}
                dangerouslySetInnerHTML={{ __html: formatEmphasis(line.replace(/^[-•]\s*/, '')) }}
              />
            ))}
          </ul>
        )
      }

      if (isDisclaimer) {
        const [label, ...rest] = block.split(':')
        return (
          <p key={`${block}-${index}`} className="chat-widget__disclaimer">
            <strong>{label.trim()}:</strong> {rest.join(':').trim()}
          </p>
        )
      }

      return (
        <p key={`${block}-${index}`} dangerouslySetInnerHTML={{ __html: formatEmphasis(block) }} />
      )
    })
  }

  return (
    <div className="chat__panel chat-widget">
      <div
        ref={messagesContainerRef}
        className="chat-widget__messages"
        aria-live="polite"
        onScroll={handleMessagesScroll}
        tabIndex={0}
      >
        {state.messages.map((message) => (
          <article
            key={message.id}
            className={`chat__message ${message.role === 'user' ? 'chat__message--user' : 'chat__message--ai'}`}
          >
            {renderMessageContent(message.content, message.role)}
          </article>
        ))}
        {state.isLoading ? <div className="chat-widget__status">HealthMate is reviewing your symptoms…</div> : null}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-widget__form" onSubmit={handleSubmit} aria-label="Chat with HealthMate">
        <label className="chat-widget__label" htmlFor="chat-input">
          Describe your symptoms or question
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          className="chat-widget__textarea"
          placeholder={placeholderText}
          value={state.input}
          onChange={(event) => setInput(event.target.value)}
          disabled={state.isLoading}
          minLength={5}
          rows={4}
        />
        <div className="chat-widget__actions">
          <button className="chat-widget__submit" type="submit" disabled={!trimmedInput || state.isLoading}>
            {state.isLoading ? 'Sending…' : 'Send to HealthMate'}
          </button>
          <button className="chat-widget__reset" type="button" onClick={handleReset} disabled={state.isLoading}>
            Reset chat
          </button>
        </div>
        {state.error ? <p className="chat-widget__error">{state.error}</p> : null}
      </form>

      <aside className="chat-widget__meta">
        <h3>Safety Reminder</h3>
        <p>
          HealthMate shares educational insights, not medical diagnoses. Seek emergency care for severe symptoms (e.g.,
          chest pain, difficulty breathing, heavy bleeding) and contact a licensed professional for personal medical
          advice.
        </p>
        <details>
          <summary>Conversation summary</summary>
          <p className="chat-widget__summary">{conversationSummary || 'No messages yet.'}</p>
        </details>
      </aside>
    </div>
  )
}

export default ChatWidget
