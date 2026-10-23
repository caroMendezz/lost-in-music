import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Shopinvivo from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Shopinvivo />
  </StrictMode>,
)
