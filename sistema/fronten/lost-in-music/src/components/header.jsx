import React from 'react';
import '../styles/Header.css';
import { useLang } from './LangContext';
import LangSelector from './LangSelector';

function Header() {
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