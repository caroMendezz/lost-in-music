import React, { useState, useEffect } from 'react';
import '../styles/login.css';

function Login({ goToRegister }) {
  const [emailUser, setEmailUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const originalMargin = document.body.style.margin;
    const originalPadding = document.body.style.padding;
    const originalBackground = document.body.style.backgroundColor;

    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#8fd3ff';

    return () => {
      document.body.style.margin = originalMargin;
      document.body.style.padding = originalPadding;
      document.body.style.backgroundColor = originalBackground;
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!emailUser || !password) {
      alert('Por favor completa todos los campos.');
      return;
    }

    alert(`Iniciando sesión como: ${emailUser}\n¡Bienvenid@ a Lost In Music!`);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Redirigiendo a la recuperación de contraseña...');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    goToRegister();
  };
  return (
    <div className="login-container">
      {[1,2,3,4,5,6].map((n) => <div key={n} className={`bubble bubble-${n}`} />)}
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

          <h1 className="login-logo-title">Lost In Music</h1>

          <div className="login-welcome">
            Tu red social musical
          </div>

          <h2 className="login-section-title">
            Inicia Sesión
          </h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-input-group">
              <label className="login-label">
                Correo electrónico o Usuario
              </label>

              <input
                type="text"
                className="login-input"
                placeholder="tu@email.com"
                value={emailUser}
                onChange={(e) => setEmailUser(e.target.value)}
                required
              />

              <div className="login-hint-text">
                Usá tu email o nombre de usuario.
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">
                Contraseña
              </label>

              <div className="login-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input login-password-input"
                  placeholder="Escribe tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {password && (
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={
                      showPassword
                        ? 'Ocultar contraseña'
                        : 'Mostrar contraseña'
                    }
                  >
                    {showPassword ? (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                          stroke="#7ab8d8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="#7ab8d8"
                          strokeWidth="2"
                        />
                      </svg>
                    ) : (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
                          stroke="#7ab8d8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
                          stroke="#7ab8d8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1="1"
                          y1="1"
                          x2="23"
                          y2="23"
                          stroke="#7ab8d8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              <div className="login-hint-text">
                Escribe tu contraseña
              </div>
            </div>

            <div className="login-forgot-link">
              <a
                href="#"
                onClick={handleForgotPassword}
                className="login-link"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="login-button">
              Iniciar Sesión
            </button>
          </form>

          <div className="login-register-link">
            <span>¿No tenes cuenta? </span>

            <a
              href="#"
              onClick={handleRegister}
              className="login-link"
            >
              Registrate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;