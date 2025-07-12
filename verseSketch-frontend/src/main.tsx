// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HistoryProvider } from './components/HistoryProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <HistoryProvider>
    {/* <StrictMode> */}
      <App/>
    {/* </StrictMode> */}
  </HistoryProvider>
)
