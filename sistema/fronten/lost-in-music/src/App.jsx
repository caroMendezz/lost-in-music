import { Routes, Route, Navigate } from 'react-router-dom'
import MessagesPage from './pages/messages/MessagesPage'

function App() {
  return (
    <Routes>
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="*" element={<Navigate to="/messages" replace />} />
    </Routes>
  )
}

export default App