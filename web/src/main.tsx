import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'lenis/dist/lenis.css'
import App from './App.tsx'
import ReactLenis from 'lenis/react'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ReactLenis root>
        <App />
      </ReactLenis>
    </BrowserRouter>
  </StrictMode>,
)
