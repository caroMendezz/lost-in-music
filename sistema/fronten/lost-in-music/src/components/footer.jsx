import React from 'react';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer-container">
      <span>Conjuguando - Comunicamos y disfrutamos.</span>

      <div className="footer-links">
        <a href="#" className="footer-link">
          Configuración
        </a>

        <a href="#" className="footer-link">
          Condiciones y políticas
        </a>
      </div>
    </footer>
  );
}

export default Footer;