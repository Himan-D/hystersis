import './index.css'
import { About } from './components/About'
import { Features } from './components/Features'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'

export default function App() {
  return (
    <main>
      <Hero />
      <Features />
      <About />
      <Footer />
    </main>
  )
}
