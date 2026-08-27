import React, { useState } from 'react';
import { useLang } from './LangContext';
import '../styles/LeftNav.css';

function LeftNav() {
  const { t } = useLang();
  const n = t.nav;

  // Keys estables; las etiquetas vienen del diccionario
  const navItems = [
    { key: 'principal', label: n.principal, icon: '🏠' },
    { key: 'mensajes',  label: n.mensajes,  icon: '💬' },
    { key: 'shop',      label: n.shop,      icon: '🛍️' },
    { key: 'amigos',    label: n.amigos,    icon: '👥' },
  ];

  const [active, setActive] = useState('principal');

  return (
    <nav className="leftnav-container">
      {navItems.map(({ key, label, icon }) => (
        <div
          key={key}
          className={`leftnav-item ${active === key ? 'leftnav-item-active' : ''}`}
          onClick={() => setActive(key)}
        >
          <div className={`leftnav-icon ${active === key ? 'leftnav-icon-active' : ''}`}>
            {icon}
          </div>
          <span>{label}</span>
        </div>
      ))}

      <div className="leftnav-bottom">
        {n.settings}
        <br />
        {n.terms}
      </div>
    </nav>
  );
}

export default LeftNav;