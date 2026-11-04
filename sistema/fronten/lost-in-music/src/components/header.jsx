import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import homeIcon from '../assets/home-icon.png';
import settingsIcon from '../assets/settings-icon.png';
import helpIcon from '../assets/help-icon.png';
import logoIcon from '../assets/logo-icon.png';
import { useLang } from './LangContext';

import { useMyProfilePhoto } from '../hooks/useMyProfilePhoto';
import LangSelector from './LangSelector';
import NotificationsMenu from './NotificationsMenu';
import { useSession } from '../hooks/sessionContext';
import { clearSession } from '../services/session';
import { resolveMedia } from '../services/friendsApi';
import { disconnectAccountSocket } from '../services/accountSocket';
import { disconnectSocket } from '../services/socket';

function Header() {
  const navigate = useNavigate();
  const session = useSession();
  const isAdmin = Number(session?.user?.idRole) === 2;
  const { t } = useLang(); // 👈 Hook de idioma
  const [menuOpen, setMenuOpen] = useState(false);
  const userPhoto = useMyProfilePhoto();

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
          setUserPhoto(resolveMedia(parsedUser.profilePhoto));
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
        const res = await fetch(`http://localhost:3000/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
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

  const handleUserClick = (userId) => {
    setShowResults(false);
    setSearchQuery('');
    const currentIdRole = localStorage.getItem('idRole');
    if (String(currentIdRole) === '2') {
      navigate(`/admin/perfil/${userId}`);
    } else {
      navigate(`/perfil/${userId}`);
    }
  };

  // Perfil propio desde el menu del avatar: /perfil (sin id) es "mi perfil",
  // /perfil/:userId es el perfil de otro usuario (ver rutas en main.jsx).
  const handleViewOwnProfile = () => {
    setMenuOpen(false);
    navigate('/perfil');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('idRole'); // 👈 Agregado para limpiar el rol al salir
    disconnectSocket();
    disconnectAccountSocket();
    clearSession();
    navigate('/acceso');
  };

  return (
    <header className="header-container">

      {/* Logo + búsqueda: el logo queda pegado a la izquierda de la barra */}
      <div className="header-left">

      {/* --- LOGO (lleva al inicio) --- */}
      <button
        type="button"
        className="header-logo-btn"
        title="Lost In Music · Ir al inicio"
        aria-label="Ir al inicio"
        onClick={() => navigate('/feed')}
      >
        <img
          src={logoIcon}
          alt=""
          aria-hidden="true"
          className="header-logo-icon"
        />
      </button>

      {/* --- BARRA DE BÚSQUEDA --- */}
      <div className="header-searchbar" ref={searchRef} style={{ position: 'relative' }}>
        <span>🔍</span>
        <input
          type="text"
          placeholder={t.header.searchPlaceholder} // 👈 Traducido
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => { if (searchResults.length > 0) setShowResults(true) }}
          style={{
            border: 'none', background: 'transparent', outline: 'none',
            width: '100%', marginLeft: '8px', color: 'inherit'
          }}
        />

        {showResults && (
          <div style={{
            position: 'absolute', top: '120%', left: 0, right: 0,
            background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxHeight: '300px', overflowY: 'auto', zIndex: 1000, color: 'black'
          }}>
            {isSearching ? (
              <div style={{ padding: '12px', color: '#888' }}>{t.header.searching}</div> // 👈 Traducido
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
                    <img src={resolveMedia(user.profilePhoto)} alt={user.username} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>@{user.username}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '12px', color: '#888', textAlign: 'center' }}>{t.header.noUsers}</div> // 👈 Traducido
            )}
          </div>
        )}
      </div>
      </div>

      <div className="header-icons">
        <LangSelector />

        <button
          title={t.header.home} // 👈 Traducido
          className="header-icon-btn header-icon-btn--image"
          onClick={() => navigate('/feed')}
        >
          <img
            src={homeIcon}
            alt=""
            aria-hidden="true"
            className="header-img-icon"
          />
        </button>

        <NotificationsMenu />

        <div className="header-profile-wrapper" ref={menuRef} style={{ position: 'relative' }}>
          <button
            className="header-icon-btn profile-avatar-btn"
            title={t.header.profile} // 👈 Traducido
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {userPhoto ? (
              <img src={userPhoto} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : ('👤')}
          </button>

          {menuOpen && (
            <div className="profile-dropdown-card" style={{
              position: 'absolute', right: 0, top: '110%', background: 'white',
              boxShadow: '0px 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px',
              padding: '8px', zIndex: 1000, minWidth: '140px'
            }}>
              {isAdmin && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/admin');
                  }}
                  style={{
                    width: '100%', padding: '8px 12px', border: 'none',
                    background: 'transparent', textAlign: 'left', cursor: 'pointer',
                    color: '#2f5c79', fontWeight: 'bold', borderRadius: '4px'
                  }}
                >
                  🛡️ Administración
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/admin/reports');
                  }}
                  style={{
                    width: '100%', padding: '8px 12px', border: 'none',
                    background: 'transparent', textAlign: 'left', cursor: 'pointer',
                    color: '#b23a2f', fontWeight: 'bold', borderRadius: '4px'
                  }}
                >
                  🚩 Reportes
                </button>
              )}


              <button
                onClick={handleViewOwnProfile}
                style={{
                  width: '100%', padding: '8px 12px', border: 'none',
                  background: 'transparent', textAlign: 'left', cursor: 'pointer',
                  color: '#333', fontWeight: 'bold', borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                {t.header.viewProfile} {/* 👈 Traducido */}
              </button>

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
                {t.header.logout} {/* 👈 Traducido */}
              </button>
            </div>
          )}
        </div>

        <button
          title={t.header.settings} // 👈 Traducido
          className="header-icon-btn header-icon-btn--image"
          onClick={() => navigate('/settings')}
        >
          <img
            src={settingsIcon}
            alt=""
            aria-hidden="true"
            className="header-img-icon"
          />
        </button>

        {/* 6. Ayuda y contacto */}
        <button
          className="header-icon-btn header-icon-btn--image"
          title="Ayuda y contacto"
          aria-label="Ayuda y contacto"
          onClick={() => navigate('/ayuda')}
        >
          <img
            src={helpIcon}
            alt=""
            aria-hidden="true"
            className="header-img-icon"
          />
        </button>

      </div>
    </header>
  );
}

export default Header;