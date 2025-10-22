import './About.css'

const objectives = [
  'Help users better understand their symptoms.',
  'Provide AI-driven, non-diagnostic guidance.',
  'Reduce unnecessary hospital visits for minor concerns.',
  'Educate users with preventive health tips.',
]

const targetUsers = [
  'General public seeking clarity about symptoms.',
  'Students and professionals needing quick guidance.',
  'Healthcare institutions offering 24/7 FAQ support.',
]

function About() {
  return (
    <section id="about" className="about">
      <div className="about__container">
        <p className="about__eyebrow">About HealthMate AI</p>
        <h2 className="about__title">LLM-powered medical guidance that meets you where you are</h2>
        <p className="about__lead">
          HealthMate is an AI-driven web assistant designed to turn symptom descriptions into actionable insights. It
          brings together trusted medical sources, conversational AI, and design built around peace of mind.
        </p>
        <div className="about__grid">
          <article className="about__panel">
            <h3>Objectives</h3>
            <ul>
              {objectives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="about__panel">
            <h3>Target Users</h3>
            <ul>
              {targetUsers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="about__panel">
            <h3>Technology Stack</h3>
            <p className="about__stack">
              Built with a React + Vite frontend and a TypeScript Express backend powered by Groq LLM integrations for
              medical language intelligence. Designed in Figma for a polished, accessible experience.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

export default About
