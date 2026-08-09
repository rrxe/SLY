import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TadsWidgetProvider } from 'react-tads-widget'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TadsWidgetProvider>
      <App />
    </TadsWidgetProvider>
  </StrictMode>,
)
