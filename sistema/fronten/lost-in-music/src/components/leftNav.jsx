import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLang } from './Langcontext';
import homeIcon from '../assets/home-icon.png';
import messagesIcon from '../assets/messages-icon.png';
import shopIcon from '../assets/shop-icon.png';
import friendsIcon from '../assets/friends-icon.png';
import '../styles/LeftNav.css';

// Pestaña que corresponde a la ruta actual (null = ninguna de las que navegan)
function getKeyFromPath(pathname) {
  if (pathname === '/amigos') return 'amigos';
  if (pathname.startsWith('/messages')) return 'mensajes';
  if (pathname.startsWith('/shopinvivo') || pathname.startsWith('/marketplace')) return 'shop';
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
    { key: 'principal', label: n.principal, image: homeIcon, path: '/' },
    { key: 'mensajes',  label: n.mensajes,  image: messagesIcon, path: '/messages' },
    { key: 'shop',      label: n.shop,      image: shopIcon, path: '/shopinvivo' },
    { key: 'amigos',    label: n.amigos,    image: friendsIcon, path: '/amigos' },
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
          <div
            className={`leftnav-icon ${active === item.key ? 'leftnav-icon-active' : ''} ${
              item.image ? 'leftnav-icon--image' : ''
            }`}
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                aria-hidden="true"
                className="leftnav-image-icon"
              />
            ) : (
              item.icon
            )}
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