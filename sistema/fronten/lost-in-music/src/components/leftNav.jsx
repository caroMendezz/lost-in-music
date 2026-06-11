import React, { useState } from 'react';
import '../styles/LeftNav.css';

const navItems = [
  { label: 'Principal', icon: '🏠' },
  { label: 'Mensajes', icon: '💬' },
  { label: 'Shop in vivo', icon: '🛍️' },
  { label: 'Amigos', icon: '👥' },
];

function LeftNav() {
  const [active, setActive] = useState('Principal');

  return (
    <nav className="leftnav-container">
      {navItems.map(({ label, icon }) => (
        <div
          key={label}
          className={`leftnav-item ${
            active === label ? 'leftnav-item-active' : ''
          }`}
          onClick={() => setActive(label)}
        >
          <div
            className={`leftnav-icon ${
              active === label ? 'leftnav-icon-active' : ''
            }`}
          >
            {icon}
          </div>

          <span>{label}</span>
        </div>
      ))}

      <div className="leftnav-bottom">
        Configuración
        <br />
        Condiciones y políticas
      </div>
    </nav>
  );
}

export default LeftNav;