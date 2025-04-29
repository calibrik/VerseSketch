// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CookiesProvider } from 'react-cookie'
import { SignalRProvider } from './components/SignalRProvider.tsx'
import { HistoryProvider } from './components/HistoryProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <SignalRProvider>
    <CookiesProvider>
      <HistoryProvider>
        {/* <StrictMode> */}
          <App />
        {/* </StrictMode>, */}
      </HistoryProvider>
    </CookiesProvider>
  </SignalRProvider>
)
