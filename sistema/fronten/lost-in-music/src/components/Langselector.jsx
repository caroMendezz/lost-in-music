import React from 'react';
import { useLang } from './LangContext';
import '../styles/Langselector.css';

function LangSelector() {
  const { lang, setLang } = useLang();
  console.log("CLICK COMPONENT MONTADO");
  return (
    <div className="lang-selector" role="group" aria-label="Seleccionar idioma">
      <button
        type="button"
        className={`lang-btn ${lang === 'es' ? 'lang-btn--active' : ''}`}
        onClick={() => {
            setLang('es');
            console.log("CLICK ES");
        }}
        aria-pressed={lang === 'es'}
        
      >
        
        ES
      </button>

      <span className="lang-divider" aria-hidden="true">|</span>

      <button
        type="button"
        className={`lang-btn ${lang === 'en' ? 'lang-btn--active' : ''}`}
        onClick={() => {
            console.log("CLICK EN");
            setLang('en');
        }}
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  );
}

export default LangSelector;