import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';
import { useLang } from './LangContext';
import LangSelector from './Langselector';
import NotificationsMenu from './NotificationsMenu';
import { useMyProfilePhoto } from '../hooks/useMyProfilePhoto';

function Header() {
  const navigate = useNavigate();
  const { t } = useLang(); // 👈 Hook de idioma
  const [menuOpen, setMenuOpen] = useState(false);
  const userPhoto = useMyProfilePhoto();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const menuRef = useRef(null);
  const searchRef = useRef(null);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('idRole');
    navigate('/acceso');
  };

  return (
    <header className="header-container">
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
              <div style={{ padding: '12px', color: '#888', textAlign: 'center' }}>{t.header.noUsers}</div> // 👈 Traducido
            )}
          </div>
        )}
      </div>

      <div className="header-icons">
        <LangSelector />

        <button
          className="header-icon-btn"
          title={t.header.home} // 👈 Traducido
          onClick={() => navigate('/feed')}
        >
          🏠
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
              <button
                onClick={() => { setMenuOpen(false); navigate('/perfil'); }}
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
          className="header-icon-btn"
          title={t.header.settings} // 👈 Traducido
          onClick={() => navigate('/settings')}
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}

export default Header;