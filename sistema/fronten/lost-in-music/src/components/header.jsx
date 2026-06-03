import React from 'react';
 
function Header() {
  const styles = {
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 14px',
      backgroundColor: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(4px)',
      borderBottom: '1px solid rgba(200,200,200,0.5)',
      height: '42px',
      position: 'relative',
      zIndex: 20,
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '20px',
      padding: '4px 12px',
      flex: 1,
      maxWidth: '200px',
      fontSize: '12px',
      color: '#aaa',
    },
    icons: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    iconBtn: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: 'rgba(220,220,220,0.8)',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      cursor: 'pointer',
    },
  };
 
  return (
    <header style={styles.header}>
      <div style={styles.searchBar}>
        <span>🔍</span>
        <span>Buscar</span>
      </div>
      <div style={styles.icons}>
        <button style={styles.iconBtn} title="Notificaciones">🔔</button>
        <button style={styles.iconBtn} title="Perfil">👤</button>
        <button style={styles.iconBtn} title="Configuración">⚙️</button>
      </div>
    </header>
  );
}
 
export default Header;