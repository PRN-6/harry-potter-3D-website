import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { HouseProvider } from './context/HouseContext'
import './index.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root not found')
}

createRoot(container).render(
  <StrictMode>
    <HouseProvider>
      <App />
    </HouseProvider>
  </StrictMode>,
)
