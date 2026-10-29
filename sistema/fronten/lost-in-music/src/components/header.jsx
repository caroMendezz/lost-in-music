import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import { useLang } from './LangContext';
import LangSelector from './LangSelector';
import NotificationsMenu from './NotificationsMenu';

function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userPhoto, setUserPhoto] = useState('');
  
  // Estados para la búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const menuRef = useRef(null);
  const searchRef = useRef(null);

  // Cargar datos del usuario logueado
  useEffect(() => {
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

  // Cerrar menús al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de búsqueda con Debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem('token');
        
        // Llamada a tu backend
        const res = await fetch(`http://localhost:3000/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Error buscando usuarios:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Al hacer clic en un usuario, vamos a su perfil (Admin o Normal)
  const handleUserClick = (userId) => {
    setShowResults(false);
    setSearchQuery('');
    
    // Leemos el rol del localStorage
    const currentIdRole = localStorage.getItem('idRole');
    
    // Si es Admin (2), va a la ruta de admin. Si no, a la normal.
    if (String(currentIdRole) === '2') {
      navigate(`/admin/perfil/${userId}`); 
    } else {
      navigate(`/perfil/${userId}`); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('idRole'); // 👈 Agregado para limpiar el rol al salir
    navigate('/acceso');
  };

  return (
    <header className="header-container">
      
      {/* --- BARRA DE BÚSQUEDA --- */}
      <div className="header-searchbar" ref={searchRef} style={{ position: 'relative' }}>
        <span>🔍</span>
        <input 
          type="text" 
          placeholder="Buscar usuarios..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => { if(searchResults.length > 0) setShowResults(true) }}
          style={{ 
            border: 'none', background: 'transparent', outline: 'none', 
            width: '100%', marginLeft: '8px', color: 'inherit'
          }}
        />
        
        {/* DROPDOWN DE RESULTADOS */}
        {showResults && (
          <div style={{
            position: 'absolute', top: '120%', left: 0, right: 0,
            background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '300px', overflowY: 'auto', zIndex: 1000, color: 'black'
          }}>
            {isSearching ? (
              <div style={{ padding: '12px', color: '#888' }}>Buscando...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map(user => (
                <div 
                  key={user.userId} 
                  onClick={() => handleUserClick(user.userId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', 
                    padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>@{user.username}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', color: '#888', textAlign: 'center' }}>No se encontraron usuarios</div>
            )}
          </div>
        )}
      </div>

      {/* --- RESTO DEL HEADER (ICONOS Y PERFIL) --- */}
      <div className="header-icons">
        <LangSelector />
        
        <NotificationsMenu />

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

          {menuOpen && (
            <div className="profile-dropdown-card" style={{
              position: 'absolute', right: 0, top: '110%', background: 'white',
              boxShadow: '0px 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px',
              padding: '8px', zIndex: 1000, minWidth: '140px'
            }}>
              <button 
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '8px 12px', border: 'none',
                  background: 'transparent', textAlign: 'left', cursor: 'pointer',
                  color: '#d9534f', fontWeight: 'bold', borderRadius: '4px'
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