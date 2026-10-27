
import React, { useState } from 'react';

function ChangePassword() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [code, setCode] = useState('');

  const [step, setStep] = useState('form');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPwd !== confirmPwd) {
      setError('Las nuevas contraseñas no coinciden.');
      return;
    }

    if (newPwd.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!token) {
      setError('Tu sesión expiró. Iniciá sesión nuevamente.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:3000/password/change/request',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: currentPwd,
            newPassword: newPwd,
            confirmPassword: confirmPwd,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo enviar el código.');
      }

      setStep('code');
      setMessage(data.message || 'Revisá tu correo para obtener el código.');
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!/^\d{6}$/.test(code.trim())) {
      setError('Ingresá el código de seis dígitos.');
      return;
    }

    if (!token) {
      setError('Tu sesión expiró. Iniciá sesión nuevamente.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:3000/password/change/confirm',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ code: code.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo verificar el código.');
      }

      setMessage(data.message || '¡Contraseña cambiada correctamente!');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setCode('');
      setStep('success');
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="config-section">
      <h3>Cambiar contraseña</h3>

      {step === 'form' && (
        <form className="config-form" onSubmit={handleRequestCode}>
          <label>
            Contraseña actual
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <label>
            Nueva contraseña
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label>
            Confirmar nueva contraseña
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          {error && <p role="alert" style={{ color: '#d93025' }}>{error}</p>}
          {message && <p role="status">{message}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando código...' : 'Enviar código de verificación'}
            </button>
          </div>
        </form>
      )}

      {step === 'code' && (
        <form className="config-form" onSubmit={handleConfirmCode}>
          <p>{message}</p>
          <p>Ingresá el código de seis dígitos que enviamos a tu correo registrado. Vence en 5 minutos.</p>

          <label>
            Código de verificación
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              required
            />
          </label>

          {error && <p role="alert" style={{ color: '#d93025' }}>{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar y cambiar contraseña'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              disabled={loading}
              onClick={() => {
                setStep('form');
                setCode('');
                setMessage('');
                setError('');
              }}
            >
              Volver
            </button>
          </div>
        </form>
      )}

      {step === 'success' && (
        <div>
          <p role="status">{message}</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setStep('form');
              setMessage('');
              setError('');
            }}
          >
            Listo
          </button>
        </div>
      )}
    </section>
  );
}

export default ChangePassword;
