import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLang } from './LangContext';
import '../styles/LeftNav.css';

// Pestaña que corresponde a la ruta actual (null = ninguna de las que navegan)
function getKeyFromPath(pathname) {
  if (pathname === '/amigos') return 'amigos';
  if (pathname.startsWith('/messages')) return 'mensajes';
  if (pathname === '/' || pathname === '/feed' || pathname.startsWith('/post/')) return 'principal';
  return null;
}

function LeftNav() {
  const { t } = useLang();
  const n = t.nav;
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Keys estables; las etiquetas vienen del diccionario.
  // `path` = a dónde navega el botón (los que no tienen path solo se resaltan, como antes)
  const navItems = [
    { key: 'principal', label: n.principal, icon: '🏠', path: '/' },
    { key: 'mensajes',  label: n.mensajes,  icon: '💬', path: '/messages' },
    { key: 'shop',      label: n.shop,      icon: '🛍️' },
    { key: 'amigos',    label: n.amigos,    icon: '👥', path: '/amigos' },
  ];

  const routeKey = getKeyFromPath(pathname);
  const [active, setActive] = useState(routeKey ?? 'principal');

  // Si se entra por link directo o con el botón "atrás", el resaltado sigue a la ruta
  useEffect(() => {
    if (routeKey) setActive(routeKey);
  }, [routeKey]);

  const handleClick = (item) => {
    setActive(item.key);
    if (item.path) navigate(item.path);
  };

  return (
    <nav className="leftnav-container">
      {navItems.map((item) => (
        <div
          key={item.key}
          className={`leftnav-item ${active === item.key ? 'leftnav-item-active' : ''}`}
          onClick={() => handleClick(item)}
        >
          <div className={`leftnav-icon ${active === item.key ? 'leftnav-icon-active' : ''}`}>
            {item.icon}
          </div>
          <span>{item.label}</span>
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