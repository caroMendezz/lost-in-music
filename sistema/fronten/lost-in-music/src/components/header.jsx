import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import { useLang } from './LangContext';
import LangSelector from './LangSelector';

function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userPhoto, setUserPhoto] = useState('');
  const menuRef = useRef(null);

  // Cargamos los datos del usuario autenticado (ej. desde localStorage si guardaste el perfil ahí, o un endpoint)
  useEffect(() => {
    // Si guardas los datos del usuario en el localStorage al hacer login:
    const storedUser = localStorage.getItem('user'); 
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.profilePhoto) {
          setUserPhoto(parsedUser.profilePhoto);
        }
      } catch (e) {
        console.error("Error al parsear el usuario", e);
      }
    }
  }, []);

  // Cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/acceso');
  };

  return (
    <header className="header-container">
      <div className="header-searchbar">
        <span>🔍</span>
        <span>Buscar</span>
      </div>

      <div className="header-icons">
        <LangSelector />
        
        <button className="header-icon-btn" title="Notificaciones">
          🔔
        </button>

        {/* Botón de Perfil con menú desplegable */}
        <div className="header-profile-wrapper" ref={menuRef} style={{ position: 'relative' }}>
          <button 
            className="header-icon-btn profile-avatar-btn" 
            title="Perfil"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {userPhoto ? (
              <img 
                src={userPhoto} 
                alt="Perfil" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
              />
            ) : (
              '👤'
            )}
          </button>

          {/* Card / Menú desplegable */}
          {menuOpen && (
            <div className="profile-dropdown-card" style={{
              position: 'absolute',
              right: 0,
              top: '110%',
              background: 'white',
              boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
              borderRadius: '8px',
              padding: '8px',
              zIndex: 1000,
              minWidth: '140px'
            }}>
              <button 
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#d9534f',
                  fontWeight: 'bold',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                🚪 Cerrar sesión
              </button>
            </div>
          )}
        </div>

        <button className="header-icon-btn" title="Configuración">
          ⚙️
        </button>
      </div>
    </header>
  );
}

export default Header;