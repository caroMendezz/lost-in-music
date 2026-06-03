import React from 'react';
 
function Footer() {
  const styles = {
    footer: {
      position: 'relative',
      zIndex: 10,
      backgroundColor: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(4px)',
      borderTop: '1px solid rgba(200,200,200,0.5)',
      padding: '8px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '11px',
      color: '#666',
    },
    links: {
      display: 'flex',
      gap: '14px',
    },
    link: {
      color: '#555',
      textDecoration: 'underline',
      cursor: 'pointer',
      fontSize: '11px',
    },
  };
 
  return (
    <footer style={styles.footer}>
      <span>Conjuguando - Comunicamos y disfrutamos.</span>
      <div style={styles.links}>
        <a href="#" style={styles.link}>Configuración</a>
        <a href="#" style={styles.link}>Condiciones y políticas</a>
      </div>
    </footer>
  );
}
 
export default Footer;