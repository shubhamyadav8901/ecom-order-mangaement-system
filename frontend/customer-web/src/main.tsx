import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@shared/ui/styles.css'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from '@shared/ui/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
)
