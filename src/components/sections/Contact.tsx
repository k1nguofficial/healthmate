import './Contact.css'

const teamMembers = [
  { name: 'Achiles Soriano', role: 'Developer' },
  { name: 'Elvin Zarcilla', role: 'Developer' },
  { name: 'Jaril Dayao', role: 'Developer' },
  { name: 'Kyle James Amrinto', role: 'Project Manager' },
]

function Contact() {
  return (
    <section id="contact" className="contact">
      <div className="contact__container">
        <div className="contact__intro">
          <p className="contact__eyebrow">Let’s Connect</p>
          <h2 className="contact__title">Have feedback or want to collaborate?</h2>
          <p className="contact__subtitle">
            HealthMate is evolving rapidly. Share your ideas, report an issue, or request early access to our clinical
            partner program.
          </p>
        </div>
        <div className="contact__layout">
          <form
            className="contact__form"
            onSubmit={(event) => {
              event.preventDefault()
            }}
          >
            <label>
              <span>Name</span>
              <input type="text" name="name" placeholder="Your full name" />
            </label>
            <label>
              <span>Email</span>
              <input type="email" name="email" placeholder="you@example.com" />
            </label>
            <label>
              <span>Message</span>
              <textarea name="message" placeholder="How can we help?"></textarea>
            </label>
            <button type="submit">Send Message</button>
          </form>
          <aside className="contact__team">
            <h3>Team HealthMate</h3>
            <ul>
              {teamMembers.map((member) => (
                <li key={member.name}>
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default Contact
