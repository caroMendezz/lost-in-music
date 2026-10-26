import React, { useState } from 'react';
import '../styles/login.css';

// Cambiá esto si tu backend corre en otra URL (o definí VITE_API_URL en el .env)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function post(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Algo salió mal. Probá de nuevo.');
  }

  return data;
}

function PasswordRecovery({ goToLogin }) {
  const [step, setStep] = useState('contact'); // 'contact' | 'code' | 'done'
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const enviarCodigo = async (e) => {
    if (e) e.preventDefault();

    if (!contact.trim()) {
      setError('Ingresá un correo o teléfono.');
      return;
    }

    setLoading(true);
    setError('');
    setInfo('');

    try {
      const data = await post('/password/forgot', { contact: contact.trim() });

      setInfo(
        data.sentTo
          ? `Te enviamos un código a ${data.sentTo}. Vence en ${data.expiresInMinutes || 10} minutos.`
          : data.message || 'Si los datos coinciden con una cuenta, te enviamos un código.'
      );
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cambiarPassword = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Ingresá el código que llegó a tu correo.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== repeat) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await post('/password/reset', {
        contact: contact.trim(),
        code: code.trim(),
        password,
      });

      setInfo('');
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

          {error && (
            <div className="login-hint-text" style={{ color: '#ff6b6b' }}>
              {error}
            </div>
          )}

          {info && (
            <div className="login-hint-text">
              {info}
            </div>
          )}

          {step === 'contact' && (
            <form className="login-form" onSubmit={enviarCodigo}>

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
                  autoComplete="username"
                />

                <div className="login-hint-text">
                  Te enviaremos un código para recuperar tu cuenta.
                </div>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>

            </form>
          )}

          {step === 'code' && (
            <form className="login-form" onSubmit={cambiarPassword}>

              <div className="login-input-group">
                <label className="login-label">
                  Código de verificación
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="login-input"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoComplete="one-time-code"
                />
              </div>

              <div className="login-input-group">
                <label className="login-label">
                  Nueva contraseña
                </label>

                <input
                  type="password"
                  className="login-input"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="login-input-group">
                <label className="login-label">
                  Repetí la nueva contraseña
                </label>

                <input
                  type="password"
                  className="login-input"
                  placeholder="Repetí la contraseña"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Cambiar contraseña'}
              </button>

              <div className="login-register-link">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!loading) enviarCodigo();
                  }}
                  className="login-link"
                >
                  Reenviar código
                </a>
                <span> · </span>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setStep('contact');
                    setError('');
                    setInfo('');
                  }}
                  className="login-link"
                >
                  Cambiar correo o teléfono
                </a>
              </div>

            </form>
          )}

          {step === 'done' && (
            <div className="login-form">
              <div className="login-hint-text">
                Tu contraseña se actualizó. Ya podés iniciar sesión.
              </div>

              <button
                type="button"
                className="login-button"
                onClick={() => goToLogin?.()}
              >
                Iniciar sesión
              </button>
            </div>
          )}

          <div className="login-register-link">
            <span>¿Recordaste tu contraseña? </span>

            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                goToLogin?.();
              }}
              className="login-link"
            >
              Iniciar sesión
            </a>
          </div>

        </div>
      </div>
    </>
  );
}

export default PasswordRecovery;
