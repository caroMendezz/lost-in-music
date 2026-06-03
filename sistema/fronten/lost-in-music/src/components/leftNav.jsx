import React, { useState } from 'react';
 
const navItems = [
  { label: 'Principal',    icon: '🏠' },
  { label: 'Mensajes',     icon: '💬' },
  { label: 'Shop in vivo', icon: '🛍️' },
  { label: 'Amigos',       icon: '👥' },
];
 
function LeftNav() {
  const [active, setActive] = useState('Principal');
 
  const styles = {
    nav: {
      width: '230px',
      minWidth: '230px',
      backgroundColor: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(4px)',
      borderRight: '1px solid rgba(200,200,200,0.4)',
      display: 'flex',
      flexDirection: 'column',
      paddingTop: '8px',
      position: 'relative',
      zIndex: 10,

    },
    item: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 12px',
      cursor: 'pointer',
      fontSize: '15px',
      color: isActive ? '#1a6fc4' : '#333',
      fontWeight: isActive ? '600' : '400',
      borderLeft: isActive ? '3px solid #4a90d9' : '3px solid transparent',
      backgroundColor: isActive ? 'rgba(74,144,217,0.08)' : 'transparent',
      transition: 'background 0.15s',
    }),
    icon: (isActive) => ({
      width: '26px',
      height: '26px',
      borderRadius: '50%',
      background: isActive ? '#4a90d9' : 'rgba(180,180,180,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      flexShrink: 0,
    }),
    bottom: {
      marginTop: 'auto',
      padding: '10px 12px',
      fontSize: '10px',
      color: '#999',
      lineHeight: '1.7',
    },
  };
 
  return (
    <nav style={styles.nav}>
      {navItems.map(({ label, icon }) => (
        <div
          key={label}
          style={styles.item(active === label)}
          onClick={() => setActive(label)}
        >
          <div style={styles.icon(active === label)}>{icon}</div>
          <span>{label}</span>
        </div>
      ))}
      <div style={styles.bottom}>
        Configuración<br />
        Condiciones y políticas
      </div>
    </nav>
  );
}
 
export default LeftNav;