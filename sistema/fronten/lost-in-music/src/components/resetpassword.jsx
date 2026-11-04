import React, { useState } from 'react';
import { useLang } from './LangContext';
import LangSelector from './Langselector';
import '../styles/login.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function post(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'ERROR');
  return data;
}

function PasswordRecovery({ goToLogin }) {
  const { t } = useLang();
  const [step, setStep] = useState('contact');
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
      setError(t.reset.errorContact);
      return;
    }
    setLoading(true); setError(''); setInfo('');

    try {
      const data = await post('/password/forgot', { contact: contact.trim() });
      setInfo(
        data.sentTo
          ? `${t.reset.btnSend} ${data.sentTo}. ${data.expiresInMinutes || 10} min.`
          : data.message || 'OK'
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
    if (!code.trim()) { setError(t.reset.errorCode); return; }
    if (password.length < 6) { setError(t.reset.errorPassLength); return; }
    if (password !== repeat) { setError(t.reset.errorPassMatch); return; }

    setLoading(true); setError('');

    try {
      await post('/password/reset', { contact: contact.trim(), code: code.trim(), password });
      setInfo(''); setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-card" style={{ position: 'relative' }}>
        {/* Selector de idioma en la esquina */}
        <div style={{ position: 'absolute', top: 15, right: 15, zIndex: 10 }}>
          <LangSelector />
        </div>

        <div className="login-shine"></div>

        <div className="login-inner">
          <div className="login-logo">
            <img src="/logoo.png" alt="Logo Lost In Music" className="login-logo-img" />
          </div>

          <h1 className="login-logo-title">Lost In Music</h1>
          <div className="login-welcome">{t.login.welcome}</div>
          <h2 className="login-section-title">{t.reset.title}</h2>

          {error && <div className="login-hint-text" style={{ color: '#ff6b6b' }}>{error}</div>}
          {info && <div className="login-hint-text">{info}</div>}

          {step === 'contact' && (
            <form className="login-form" onSubmit={enviarCodigo}>
              <div className="login-input-group">
                <label className="login-label">{t.reset.contactTitle}</label>
                <input
                  type="text" className="login-input" placeholder={t.reset.contactPlaceholder}
                  value={contact} onChange={(e) => setContact(e.target.value)}
                />
                <div className="login-hint-text">{t.reset.contactHint}</div>
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? t.reset.sending : t.reset.btnSend}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form className="login-form" onSubmit={cambiarPassword}>
              <div className="login-input-group">
                <label className="login-label">{t.reset.codeTitle}</label>
                <input
                  type="text" inputMode="numeric" maxLength={6} className="login-input"
                  placeholder={t.reset.codePlaceholder} value={code} onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="login-input-group">
                <label className="login-label">{t.reset.newPassTitle}</label>
                <input
                  type="password" className="login-input" placeholder={t.reset.newPassPlaceholder}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="login-input-group">
                <label className="login-label">{t.reset.repeatTitle}</label>
                <input
                  type="password" className="login-input" placeholder={t.reset.repeatPlaceholder}
                  value={repeat} onChange={(e) => setRepeat(e.target.value)}
                />
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? t.reset.saving : t.reset.btnChange}
              </button>

              <div className="login-register-link">
                <a href="#" onClick={(e) => { e.preventDefault(); if (!loading) enviarCodigo(); }} className="login-link">
                  {t.reset.resend}
                </a>
                <span> · </span>
                <a href="#" onClick={(e) => { e.preventDefault(); setStep('contact'); setError(''); setInfo(''); }} className="login-link">
                  {t.reset.changeContact}
                </a>
              </div>
            </form>
          )}

          {step === 'done' && (
            <div className="login-form">
              <div className="login-hint-text">{t.reset.success}</div>
              <button type="button" className="login-button" onClick={() => goToLogin?.()}>
                {t.reset.btnLogin}
              </button>
            </div>
          )}

          <div className="login-register-link">
            <span>{t.reset.remember}</span>
            <a href="#" onClick={(e) => { e.preventDefault(); goToLogin?.(); }} className="login-link">
              {t.reset.btnLogin}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default PasswordRecovery;