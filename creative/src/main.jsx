import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CreativeAuthProvider } from './contexts/CreativeAuthContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <CreativeAuthProvider>
        <App />
      </CreativeAuthProvider>
    </HashRouter>
  </StrictMode>,
)
