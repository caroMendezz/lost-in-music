import React from 'react';
import { useLang } from './LangContext';
import '../styles/Footer.css';

function Footer() {
  const { t } = useLang();
  const f = t.footer;

  return (
    <footer className="footer-container">
      <span>{f.tagline}</span>

      <div className="footer-links">
        <a href="#" className="footer-link">{f.settings}</a>
        <a href="#" className="footer-link">{f.terms}</a>
      </div>
    </footer>
  );
}

export default Footer;