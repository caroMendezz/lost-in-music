import React, { useState } from 'react';
import '../styles/login.css';
import { Link } from 'react-router-dom';

function PasswordRecovery() {
  const [contact, setContact] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!contact.trim()) {
      alert('Ingresá un correo o teléfono.');
      return;
    }

    alert(`Enlace enviado a ${contact}`);
  };

  return (
    <>
      <div className="login-card">
        <div className="login-shine"></div>

        <div className="login-inner">

          <div className="login-logo">
            <img
              src="/logoo.png"
              alt="Logo Lost In Music"
              className="login-logo-img"
            />
          </div>

          <h1 className="login-logo-title">
            Lost In Music
          </h1>

          <div className="login-welcome">
            Tu red social musical
          </div>

          <h2 className="login-section-title">
            Recuperar contraseña
          </h2>

          <form className="login-form" onSubmit={handleSubmit}>

            <div className="login-input-group">
              <label className="login-label">
                Correo electrónico o teléfono
              </label>

              <input
                type="text"
                className="login-input"
                placeholder="tu@email.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />

              <div className="login-hint-text">
                Te enviaremos un enlace para recuperar tu cuenta.
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
            >
              Enviar enlace
            </button>

          </form>
          <div className="login-register-link">
            <span>¿Recordaste tu contraseña? </span>

            <Link
              to="/acceso"
              className="login-link"
            >
              Iniciar sesión
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

export default PasswordRecovery;