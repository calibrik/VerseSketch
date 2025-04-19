// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CookiesProvider } from 'react-cookie'

createRoot(document.getElementById('root')!).render(
  <CookiesProvider>
  {/* <StrictMode> */}
    <App />
  {/* </StrictMode>, */}
  </CookiesProvider>
)
