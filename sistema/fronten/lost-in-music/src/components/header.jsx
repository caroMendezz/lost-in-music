import React from 'react';
import '../styles/Header.css';

function Header() {
  return (
    <header className="header-container">
      <div className="header-searchbar">
        <span>🔍</span>
        <span>Buscar</span>
      </div>

      <div className="header-icons">
        <button className="header-icon-btn" title="Notificaciones">
          🔔
        </button>

        <button className="header-icon-btn" title="Perfil">
          👤
        </button>

        <button className="header-icon-btn" title="Configuración">
          ⚙️
        </button>
      </div>
    </header>
  );
}

export default Header;