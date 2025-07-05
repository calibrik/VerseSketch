// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HistoryProvider } from './components/HistoryProvider.tsx'
import { ErrorDisplayProvider } from './components/ErrorDisplayProvider.tsx'
import { StrictMode } from 'react'

createRoot(document.getElementById('root')!).render(
  <HistoryProvider>
    <StrictMode>
      <App/>
    </StrictMode>
  </HistoryProvider>
)
