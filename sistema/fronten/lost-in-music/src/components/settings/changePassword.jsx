import React, { useState } from 'react';
import { useLang } from '../Langcontext';

function ChangePassword() {
  const { t } = useLang();
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
      setError(t.settings.changePassword.errorMismatch);
      return;
    }

    if (newPwd.length < 8) {
      setError(t.settings.changePassword.errorLength);
      return;
    }

    if (!token) {
      setError(t.settings.changePassword.errorSession);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/password/change/request`,
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
        throw new Error(data.message || t.settings.changePassword.errorGeneric);
      }

      setStep('code');
      setMessage(data.message || t.settings.changePassword.msgCodeSent);
    } catch (err) {
      setError(err.message || t.settings.changePassword.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!/^\d{6}$/.test(code.trim())) {
      setError(t.settings.changePassword.errorCode);
      return;
    }

    if (!token) {
      setError(t.settings.changePassword.errorSession);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/password/change/confirm`,
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
        throw new Error(data.message || t.settings.changePassword.errorGeneric);
      }

      setMessage(data.message || t.settings.changePassword.msgSuccess);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setCode('');
      setStep('success');
    } catch (err) {
      setError(err.message || t.settings.changePassword.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="config-section">
      <h3>{t.settings.changePassword.title}</h3>

      {step === 'form' && (
        <form className="config-form" onSubmit={handleRequestCode}>
          <label>
            {t.settings.changePassword.currentPass}
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <label>
            {t.settings.changePassword.newPass}
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
            {t.settings.changePassword.confirmPass}
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
              {loading ? t.settings.changePassword.sendingCode : t.settings.changePassword.btnSendCode}
            </button>
          </div>
        </form>
      )}

      {step === 'code' && (
        <form className="config-form" onSubmit={handleConfirmCode}>
          <p>{message}</p>
          <p>{t.settings.changePassword.codeInstruction}</p>

          <label>
            {t.settings.changePassword.codeLabel}
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={t.settings.changePassword.placeholderCode}
              required
            />
          </label>

          {error && <p role="alert" style={{ color: '#d93025' }}>{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t.settings.changePassword.verifying : t.settings.changePassword.btnVerify}
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
              {t.settings.changePassword.btnBack}
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
            {t.settings.changePassword.btnDone}
          </button>
        </div>
      )}
    </section>
  );
}

export default ChangePassword;