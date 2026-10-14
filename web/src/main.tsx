import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { LanguageProvider } from './i18n/LanguageContext'
import './index.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root-element #root mangler')
}

createRoot(root).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
)
