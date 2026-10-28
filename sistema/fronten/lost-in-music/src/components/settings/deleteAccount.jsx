
import React, { useState } from 'react';

function DeleteAccount() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [confirmText, setConfirmText] = useState('');
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

    if (confirmText !== 'ELIMINAR') {
      setError('Escribí ELIMINAR para confirmar.');
      return;
    }

    if (!token) {
      setError('Tu sesión expiró. Iniciá sesión nuevamente.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://localhost:3000/account/delete/request',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: currentPwd,
            confirmText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo enviar el código.');
      }

      setMessage(data.message);
      setStep('code');
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async (e) => {
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
        'http://localhost:3000/account/delete/confirm',
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

      setMessage(data.message || 'Tu cuenta fue desactivada correctamente.');

      // Limpiar la sesión local después de la desactivación.
      localStorage.removeItem('token');
      localStorage.removeItem('idRole');

      setStep('success');
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="config-section danger">
      <h3>Eliminar cuenta</h3>

      {step === 'form' && (
        <>
          <p className="muted">
            Tu cuenta se desactivará y no podrás seguir utilizando sus funciones.
            El registro no se borrará de la base de datos.
          </p>

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
              Escribí <strong>ELIMINAR</strong> para confirmar
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                required
              />
            </label>

            {error && <p role="alert" style={{ color: '#d93025' }}>{error}</p>}

            <div className="form-actions">
              <button
                type="submit"
                className="btn-danger"
                disabled={loading}
              >
                {loading ? 'Enviando código...' : 'Continuar'}
              </button>
            </div>
          </form>
        </>
      )}

      {step === 'code' && (
        <form className="config-form" onSubmit={handleConfirmDeletion}>
          <p>{message}</p>
          <p>Ingresá el código de seis dígitos que enviamos a tu correo. Vence en 5 minutos.</p>

          <label>
            Código de verificación
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="123456"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              required
            />
          </label>

          {error && <p role="alert" style={{ color: '#d93025' }}>{error}</p>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-danger"
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Confirmar eliminación'}
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
          <p>Tu sesión se cerró. Gracias por haber usado Lost In Music.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              window.location.assign('/login');
            }}
          >
            Ir al inicio de sesión
          </button>
        </div>
      )}
    </section>
  );
}

export default DeleteAccount;
