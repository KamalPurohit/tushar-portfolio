import { Banner } from './components/Banner.jsx'
import { Nav } from './components/Nav.jsx'
import { Hero } from './components/Hero.jsx'
import { Craft } from './components/Craft.jsx'
import { Work } from './components/Work.jsx'
import { About } from './components/About.jsx'
import { Contact } from './components/Contact.jsx'
import { Footer } from './components/Footer.jsx'

export default function App() {
  return (
    <>
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-buttons focus:border focus:border-surface-cream focus:bg-just-black focus:px-5 focus:py-2 focus:text-surface-cream"
      >
        Skip to content
      </a>

      <Banner />
      <Nav />
      <main>
        <Hero />
        <Craft />
        <Work />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
