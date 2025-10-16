import Navbar from '../components/layout/Navbar'
import Hero from '../components/sections/Hero'
import HowItWorks from '../components/sections/HowItWorks'
import Features from '../components/sections/Features'
import ChatSection from '../components/sections/ChatSection'
import About from '../components/sections/About'
import Disclaimer from '../components/sections/Disclaimer'
import Contact from '../components/sections/Contact'
import Footer from '../components/layout/Footer'

function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <ChatSection />
        <About />
        <Disclaimer />
        <Contact />
      </main>
      <Footer />
    </>
  )
}

export default HomePage
