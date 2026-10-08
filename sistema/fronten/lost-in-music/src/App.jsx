import { Routes, Route, Navigate } from 'react-router-dom'
import MessagesPage from './pages/messages/MessagesPage'

/*
  ANDAMIO TEMPORAL, SOLO PARA LA RAMA messages.
  Al hacer el merge se descarta este App.jsx y se usa el de la rama principal, que ya trae el Header.
  Solo agrega la ruta /messages al App.jsx de la rama principal.

  - shellStyle: se sale del contenedor de 1126px que impone index.css (plantilla de Vite)
    para que la pagina use todo el ancho y el alto de la ventana.
  - headerSlotStyle: espacio VACIO con la altura reservada al header (no es un header).
*/
const shellStyle = {
  width: '100vw',
  marginLeft: 'calc(50% - 50vw)',
  height: '100vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

const headerSlotStyle = {
  height: 'var(--messages-header-offset, 64px)',
  flexShrink: 0,
}

function App() {
  return (
    <div style={shellStyle}>
      <div style={headerSlotStyle} />
      <Routes>
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="*" element={<Navigate to="/messages" replace />} />
      </Routes>
    </div>
  )
}

export default App
